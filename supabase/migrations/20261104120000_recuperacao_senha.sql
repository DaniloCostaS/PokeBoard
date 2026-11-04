-- ============================================================================
-- Recuperação de senha sem servidor de e-mail
--
-- Cada conta tem um código de recuperação pessoal. O jogo mostra o código uma
-- vez só e o banco guarda apenas o hash. Com e-mail + código, a pessoa define
-- uma senha nova na tela de login. O código é de uso único: ao ser usado, é
-- trocado por outro, e as sessões abertas em outros aparelhos são encerradas.
--
-- Quem esqueceu a senha e não tem código pede a um admin do projeto, que roda
-- no SQL Editor do Supabase e repassa o resultado:
--     select public.admin_recovery_code('email@do.amigo');
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.account_recovery (
    user_id uuid primary key references auth.users (id) on delete cascade,
    code_hash text not null,
    created_at timestamptz not null default now(),
    attempts int not null default 0,
    locked_until timestamptz
);

-- Sem policies: a tabela só é acessada pelas funções abaixo
alter table public.account_recovery enable row level security;
revoke all on table public.account_recovery from public, anon, authenticated;

-- 12 caracteres em alfabeto de 32 símbolos (60 bits), sem I, O, 0 e 1.
-- O hash é sempre do código sem o traço; a apresentação é XXXX-XXXX-XXXX.
create or replace function public.recovery_new_code() returns text
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
    v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_bytes bytea := gen_random_bytes(12);
    v_code text := '';
begin
    for i in 0..11 loop
        v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;
    return v_code;
end $$;

create or replace function public.recovery_format(p_code text) returns text
language sql immutable set search_path = public as $$
    select substr(p_code, 1, 4) || '-' || substr(p_code, 5, 4) || '-' || substr(p_code, 9, 4);
$$;

-- Grava um código novo para a conta (substitui o anterior e zera as tentativas)
create or replace function public.recovery_store_code(p_user uuid) returns text
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
    v_code text := public.recovery_new_code();
begin
    insert into public.account_recovery (user_id, code_hash)
    values (p_user, crypt(v_code, gen_salt('bf', 10)))
    on conflict (user_id) do update
        set code_hash = excluded.code_hash, created_at = now(), attempts = 0, locked_until = null;
    return public.recovery_format(v_code);
end $$;

-- Conta logada. Sem p_replace, só gera se ainda não houver código (senão devolve null).
create or replace function public.generate_recovery_code(p_replace boolean default false) returns text
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
    v_uid uuid := auth.uid();
    v_code text;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    if p_replace then return public.recovery_store_code(v_uid); end if;

    -- Duas abas abrindo juntas: só a que conseguir inserir mostra o código
    v_code := public.recovery_new_code();
    insert into public.account_recovery (user_id, code_hash)
    values (v_uid, crypt(v_code, gen_salt('bf', 10)))
    on conflict (user_id) do nothing;
    if not found then return null; end if;
    return public.recovery_format(v_code);
end $$;

-- Data em que o código atual foi criado (null se a conta não tem código)
create or replace function public.recovery_code_created_at() returns timestamptz
language sql stable security definer set search_path = public as $$
    select created_at from public.account_recovery where user_id = auth.uid();
$$;

-- Tela de login (sem sessão). Devolve jsonb em vez de levantar erro: um raise
-- desfaria a transação e, com ela, a contagem de tentativas erradas.
create or replace function public.reset_password_with_code(p_email text, p_code text, p_new_password text) returns jsonb
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
    v_uid uuid;
    v_row public.account_recovery%rowtype;
    v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
begin
    -- bcrypt ignora o que passa de 72 bytes; o Supabase Auth recusa o mesmo limite
    if p_new_password is null or char_length(p_new_password) < 6 or octet_length(p_new_password) > 72 then
        return jsonb_build_object('ok', false, 'reason', 'weak_password');
    end if;

    select id into v_uid from auth.users where lower(email) = lower(trim(coalesce(p_email, ''))) limit 1;
    if v_uid is null then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;

    -- Trava a linha: tentativas simultâneas não burlam o contador nem reusam o código
    select * into v_row from public.account_recovery where user_id = v_uid for update;
    if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;

    if v_row.locked_until is not null and v_row.locked_until > now() then
        return jsonb_build_object('ok', false, 'reason', 'locked');
    end if;

    if crypt(v_code, v_row.code_hash) <> v_row.code_hash then
        if v_row.attempts + 1 >= 5 then
            update public.account_recovery
                set attempts = 0, locked_until = now() + interval '15 minutes'
                where user_id = v_uid;
            return jsonb_build_object('ok', false, 'reason', 'locked');
        end if;
        update public.account_recovery
            set attempts = v_row.attempts + 1, locked_until = null
            where user_id = v_uid;
        return jsonb_build_object('ok', false, 'reason', 'invalid');
    end if;

    update auth.users
        set encrypted_password = crypt(p_new_password, gen_salt('bf', 10)), updated_at = now()
        where id = v_uid;
    delete from auth.sessions where user_id = v_uid;

    return jsonb_build_object('ok', true, 'code', public.recovery_store_code(v_uid));
end $$;

-- Só para o SQL Editor do Supabase: nenhum papel do app pode executar
create or replace function public.admin_recovery_code(p_email text) returns text
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
    v_uid uuid;
begin
    select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
    if v_uid is null then raise exception 'Conta não encontrada: %', p_email; end if;
    return public.recovery_store_code(v_uid);
end $$;

-- O Supabase dá execute a anon/authenticated em toda função nova de public:
-- é preciso revogar de todos e liberar só o que o app usa.
revoke all on function public.recovery_new_code() from public, anon, authenticated;
revoke all on function public.recovery_format(text) from public, anon, authenticated;
revoke all on function public.recovery_store_code(uuid) from public, anon, authenticated;
revoke all on function public.generate_recovery_code(boolean) from public, anon, authenticated;
revoke all on function public.recovery_code_created_at() from public, anon, authenticated;
revoke all on function public.reset_password_with_code(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_recovery_code(text) from public, anon, authenticated;

grant execute on function public.generate_recovery_code(boolean) to authenticated;
grant execute on function public.recovery_code_created_at() to authenticated;
grant execute on function public.reset_password_with_code(text, text, text) to anon, authenticated;
