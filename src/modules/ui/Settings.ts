// Preferências visuais do jogador, guardadas só neste navegador.
// Se o armazenamento local estiver bloqueado, vale o padrão (sprites clássicos).

const ANIM_KEY = 'pb_anim_sprites';

export class Settings {
    private static initialized = false;
    private static memory: boolean | null = null;

    // Sprites animados do Pokémon Showdown na batalha. Desligado por padrão: cobrem 1056 de 1064 Pokémon
    // (faltam os Paradoxo "Iron" e Miraidon, que caem no sprite clássico).
    static get animatedSprites(): boolean {
        if (this.memory !== null) return this.memory;
        try { return localStorage.getItem(ANIM_KEY) === '1'; } catch { return false; }
    }

    static set animatedSprites(value: boolean) {
        this.memory = value;
        try { localStorage.setItem(ANIM_KEY, value ? '1' : '0'); } catch { /* sem armazenamento: vale só enquanto a página estiver aberta */ }
        document.querySelectorAll<HTMLInputElement>('[data-pb-setting="animatedSprites"]').forEach(input => { input.checked = value; });
        // Atualiza uma batalha aberta na hora
        const Battle = (window as any).Battle;
        if (Battle?.active && typeof Battle.updateUI === 'function') Battle.updateUI();
    }

    // Liga/desliga só nesta página, sem gravar a preferência (usado pelo modo demonstração)
    static preview(value: boolean) {
        this.memory = value;
        document.querySelectorAll<HTMLInputElement>('[data-pb-setting="animatedSprites"]').forEach(input => { input.checked = value; });
    }

    static init() {
        if (this.initialized) return;
        this.initialized = true;
        document.querySelectorAll<HTMLInputElement>('[data-pb-setting="animatedSprites"]').forEach(input => {
            input.checked = this.animatedSprites;
            input.addEventListener('change', () => { this.animatedSprites = input.checked; });
        });
    }
}

(window as any).PBSettings = Settings;
