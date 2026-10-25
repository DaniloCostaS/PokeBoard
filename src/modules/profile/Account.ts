import { supabase } from '../network/SupabaseInit';

export type Profile = {
    id: string;
    username: string;
    avatar: string;
    title: string | null;
    frame: string | null;
};

const AUTH_ERRORS: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
    'User already registered': 'Já existe uma conta com esse e-mail.',
    'Password should be at least 6 characters': 'A senha precisa ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'E-mail inválido.',
    'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
};

function friendly(err: any): string {
    const msg = String(err?.message || err || '');
    for (const key in AUTH_ERRORS) if (msg.includes(key)) return AUTH_ERRORS[key];
    if (/rate limit/i.test(msg)) return AUTH_ERRORS['Email rate limit exceeded'];
    if (/Database error saving new user/i.test(msg)) return 'Esse nome de treinador já está em uso.';
    return msg || 'Algo deu errado. Tente novamente.';
}

/**
 * CONTA DO JOGADOR (Supabase Auth, e-mail e senha)
 * O perfil (nome de treinador, avatar, título e moldura) é criado no banco junto com a conta.
 */
export class Account {
    static profile: Profile | null = null;

    static get userId(): string | null { return this.profile?.id || null; }
    static get isLogged(): boolean { return !!this.profile; }

    // Restaura a sessão salva pelo supabase-js (localStorage) e carrega o perfil
    static async init(): Promise<Profile | null> {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { this.profile = null; return null; }
        return this.loadProfile(data.session.user.id);
    }

    static async loadProfile(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase.from('profiles').select('id, username, avatar, title, frame').eq('id', userId).maybeSingle();
        if (error || !data) { this.profile = null; return null; }
        this.profile = data as Profile;
        return this.profile;
    }

    static async usernameAvailable(username: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('username_available', { p_username: username });
        if (error) return true; // na dúvida, o banco recusa no cadastro
        return !!data;
    }

    static async signUp(email: string, password: string, username: string): Promise<{ ok: boolean; message?: string; needsConfirm?: boolean }> {
        const name = username.trim();
        if (name.length < 3 || name.length > 15) return { ok: false, message: 'O nome de treinador precisa ter de 3 a 15 caracteres.' };
        if (!(await this.usernameAvailable(name))) return { ok: false, message: 'Esse nome de treinador já está em uso.' };
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { username: name } } });
        if (error) return { ok: false, message: friendly(error) };
        if (!data.session) return { ok: true, needsConfirm: true, message: 'Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.' };
        await this.loadProfile(data.session.user.id);
        return { ok: !!this.profile, message: this.profile ? undefined : 'Conta criada, mas o perfil não carregou. Tente entrar.' };
    }

    static async signIn(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error || !data.session) return { ok: false, message: friendly(error) };
        await this.loadProfile(data.session.user.id);
        if (!this.profile) return { ok: false, message: 'Não encontramos o perfil desta conta.' };
        return { ok: true };
    }

    static async resetPassword(email: string): Promise<{ ok: boolean; message: string }> {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin });
        if (error) return { ok: false, message: friendly(error) };
        return { ok: true, message: 'Se o e-mail existir, enviamos um link para redefinir a senha.' };
    }

    // Link de "esqueci a senha": o Supabase abre o app com uma sessão de recuperação; pede a nova senha
    private static recoveryListening = false;
    static listenPasswordRecovery() {
        if (this.recoveryListening) return;
        this.recoveryListening = true;
        supabase.auth.onAuthStateChange((event) => {
            if (event !== 'PASSWORD_RECOVERY') return;
            setTimeout(async () => {
                const GameDialog = (window as any).GameDialog;
                const pw = await GameDialog.prompt('Digite sua nova senha (mínimo de 6 caracteres).', { title: 'Nova senha', inputType: 'password', okLabel: 'Salvar' });
                if (!pw) return;
                const { error } = await supabase.auth.updateUser({ password: pw });
                if (error) GameDialog.toast(friendly(error), { tone: 'danger' });
                else GameDialog.toast('Senha alterada!', { tone: 'success' });
            }, 0);
        });
    }

    static async signOut() {
        await supabase.auth.signOut();
        this.profile = null;
    }

    static async updateProfile(patch: Partial<Pick<Profile, 'avatar' | 'title' | 'frame'>>): Promise<boolean> {
        if (!this.profile) return false;
        const { error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', this.profile.id);
        if (error) return false;
        Object.assign(this.profile, patch);
        return true;
    }

    // Cosméticos que vão junto com o jogador para a sala (os outros veem moldura e título)
    static cosmetics(): { title: string | null; frame: string | null } | null {
        if (!this.profile) return null;
        return { title: this.profile.title, frame: this.profile.frame };
    }
}

(window as any).Account = Account;
