import { Account } from './Account';
import { GameDialog } from '../ui/GameDialog';

const esc = (v: string) => v.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c));

/**
 * RECUPERAÇÃO DE SENHA (sem e-mail)
 * "Esqueci a senha" no login (e-mail + código + senha nova) e a tela que mostra o código,
 * que só aparece uma vez: no primeiro acesso da conta, ao gerar outro e depois de cada troca.
 */
export class RecoveryScreen {
    private static layer: HTMLElement | null = null;
    private static canEscape = false;

    private static ensureLayer(): HTMLElement {
        if (this.layer) return this.layer;
        const layer = document.createElement('div');
        layer.id = 'recovery-modal';
        layer.className = 'modal pb-profile pb-recover';
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && this.canEscape && layer.style.display === 'flex' && !GameDialog.isOpen()) this.close();
        });
        document.body.appendChild(layer);
        this.layer = layer;
        return layer;
    }

    private static close() {
        if (this.layer) { this.layer.style.display = 'none'; this.layer.innerHTML = ''; }
        this.canEscape = false;
    }

    // Formulário do login. onDone: true se já entrou na conta, false se precisa entrar manualmente.
    static openForgot(email: string, onDone: (loggedIn: boolean) => void) {
        const layer = this.ensureLayer();
        this.canEscape = true;
        layer.innerHTML = `<form class="modal-content pb-rd-card pb-recover-card" role="dialog" aria-modal="true" aria-labelledby="pb-recover-title" novalidate>
            <header>
                <div><h2 id="pb-recover-title">Esqueci a senha</h2></div>
                <button type="button" class="pb-rd-close" data-close aria-label="Fechar">✕</button>
            </header>
            <p class="pb-recover-text">Informe seu e-mail e o <b>código de recuperação</b> que você guardou para criar uma senha nova.</p>
            <label class="pb-recover-field"><span>E-mail</span><input type="email" id="recover-email" autocomplete="email" placeholder="voce@email.com" value="${esc(email)}"></label>
            <label class="pb-recover-field"><span>Código de recuperação</span><input type="text" id="recover-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" maxlength="20"></label>
            <label class="pb-recover-field"><span>Nova senha</span><input type="password" id="recover-pass" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></label>
            <label class="pb-recover-field"><span>Repita a nova senha</span><input type="password" id="recover-pass2" autocomplete="new-password"></label>
            <p id="recover-feedback" class="trainer-login-feedback" role="alert" aria-live="polite" hidden></p>
            <button type="submit" id="recover-submit" class="pb-recover-primary">Trocar senha</button>
            <p class="trainer-room-hint">Não tem o código? Peça a um admin do jogo um código avulso.</p>
        </form>`;
        layer.style.display = 'flex';
        layer.querySelector('[data-close]')!.addEventListener('click', () => this.close());

        const field = (id: string) => layer.querySelector(`#${id}`) as HTMLInputElement;
        const feedback = field('recover-feedback') as unknown as HTMLElement;
        const fail = (message: string, focus?: HTMLInputElement) => {
            feedback.textContent = message;
            feedback.hidden = false;
            focus?.focus();
        };
        layer.querySelector('form')!.addEventListener('submit', async e => {
            e.preventDefault();
            const emailEl = field('recover-email'), codeEl = field('recover-code'), passEl = field('recover-pass'), pass2El = field('recover-pass2');
            const mail = emailEl.value.trim();
            if (!mail) return fail('Informe seu e-mail.', emailEl);
            if (codeEl.value.replace(/[^a-zA-Z0-9]/g, '').length !== 12) return fail('O código tem 12 caracteres, como ABCD-EFGH-JKLM.', codeEl);
            if (passEl.value.length < 6) return fail('A senha precisa ter pelo menos 6 caracteres.', passEl);
            if (passEl.value !== pass2El.value) return fail('As duas senhas não são iguais.', pass2El);

            feedback.hidden = true;
            const submit = field('recover-submit') as unknown as HTMLButtonElement;
            submit.disabled = true;
            const res = await Account.resetPassword(mail, codeEl.value, passEl.value);
            if (!res.ok) {
                submit.disabled = false;
                return fail(res.message || 'Não foi possível trocar a senha.');
            }
            const login = await Account.signIn(mail, passEl.value);
            // Mesmo sem conseguir entrar agora, o código novo já vale e só aparece aqui
            this.showCode(res.code!, () => onDone(login.ok), 'Senha trocada! O código antigo parou de funcionar. Guarde este novo:');
        });
        (email ? field('recover-code') : field('recover-email')).focus();
    }

    // Mostra o código uma única vez; só fecha depois de a pessoa confirmar que guardou
    static showCode(code: string, onClose?: () => void, intro = 'Se você esquecer a senha, este código permite criar outra. Sem servidor de e-mail, ele é a sua forma de recuperar a conta.') {
        const layer = this.ensureLayer();
        this.canEscape = false;
        layer.innerHTML = `<div class="modal-content pb-rd-card pb-recover-card" role="dialog" aria-modal="true" aria-labelledby="pb-recover-title">
            <header><div><h2 id="pb-recover-title">Guarde seu código de recuperação</h2></div></header>
            <p class="pb-recover-text">${esc(intro)}</p>
            <div class="pb-recover-code"><output id="recover-code-value">${esc(code)}</output><button type="button" id="recover-copy">Copiar</button></div>
            <ul class="pb-recover-notes">
                <li>Ele <b>não aparece de novo</b>. Anote ou salve em um lugar seguro.</li>
                <li>Não compartilhe: quem tiver seu e-mail e este código pode trocar sua senha.</li>
                <li>Perdeu? Com a conta aberta, gere outro em <b>Meu perfil → Conta</b>.</li>
            </ul>
            <label class="pb-recover-check"><input type="checkbox" id="recover-saved"><span>Já guardei meu código</span></label>
            <button type="button" id="recover-done" class="pb-recover-primary" disabled>Continuar</button>
        </div>`;
        layer.style.display = 'flex';

        const done = layer.querySelector('#recover-done') as HTMLButtonElement;
        const saved = layer.querySelector('#recover-saved') as HTMLInputElement;
        saved.addEventListener('change', () => { done.disabled = !saved.checked; });
        done.addEventListener('click', () => { this.close(); onClose?.(); });
        const copy = layer.querySelector('#recover-copy') as HTMLButtonElement;
        copy.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(code);
                copy.textContent = 'Copiado!';
            } catch {
                // Sem clipboard (ex.: http na rede local): seleciona para copiar à mão
                const range = document.createRange();
                range.selectNodeContents(layer.querySelector('#recover-code-value')!);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
                GameDialog.toast('Código selecionado. Copie ou anote.', { tone: 'info' });
            }
        });
        saved.focus();
    }

    // Contas que ainda não têm código (novas ou anteriores a esta função) recebem um ao entrar
    static async promptIfMissing() {
        const code = await Account.ensureRecoveryCode();
        if (code) this.showCode(code);
    }
}
