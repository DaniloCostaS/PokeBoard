import type { Texture } from 'pixi.js';

// Texturas procedurais (desenhadas uma vez em canvas 2D) usadas pelo clima, ambiente e efeitos.
export type BoardTex = {
    soft: Texture;     // brilho radial branco
    streak: Texture;   // risco vertical (chuva / areia)
    star: Texture;     // brilho de 4 pontas
    ring: Texture;     // anel fino
    vignette: Texture; // bordas escuras/coloridas, centro transparente
    coin: Texture;     // moedinha
    chevron: Texture;  // seta ">" para a prévia do caminho
    pokeball: Texture;
    flake: Texture;    // floco de neve
    moon: Texture;     // lua de sangue
};

let cache: BoardTex | null = null;

const canvas = (w: number, h = w) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return { c, g: c.getContext('2d')! };
};

export function boardTextures(P: typeof import('pixi.js')): BoardTex {
    if (cache) return cache;
    const tex = (c: HTMLCanvasElement) => P.Texture.from(c);

    const soft = canvas(64);
    {
        const gr = soft.g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.35, 'rgba(255,255,255,0.55)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        soft.g.fillStyle = gr; soft.g.fillRect(0, 0, 64, 64);
    }

    const streak = canvas(4, 64);
    {
        const gr = streak.g.createLinearGradient(0, 0, 0, 64);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.75, 'rgba(255,255,255,0.9)');
        gr.addColorStop(1, 'rgba(255,255,255,1)');
        streak.g.fillStyle = gr; streak.g.fillRect(1, 0, 2, 64);
    }

    const star = canvas(48);
    {
        const g = star.g;
        const gr = g.createRadialGradient(24, 24, 0, 24, 24, 12);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
        g.fillStyle = '#fff';
        g.beginPath();
        g.moveTo(24, 0); g.quadraticCurveTo(26, 22, 48, 24); g.quadraticCurveTo(26, 26, 24, 48);
        g.quadraticCurveTo(22, 26, 0, 24); g.quadraticCurveTo(22, 22, 24, 0);
        g.fill();
    }

    const ring = canvas(64);
    {
        ring.g.strokeStyle = '#fff'; ring.g.lineWidth = 3;
        ring.g.beginPath(); ring.g.arc(32, 32, 29, 0, Math.PI * 2); ring.g.stroke();
    }

    const vignette = canvas(256);
    {
        const gr = vignette.g.createRadialGradient(128, 128, 56, 128, 128, 160);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.6, 'rgba(255,255,255,0.35)');
        gr.addColorStop(1, 'rgba(255,255,255,1)');
        vignette.g.fillStyle = gr; vignette.g.fillRect(0, 0, 256, 256);
    }

    const coin = canvas(32);
    {
        const g = coin.g;
        g.fillStyle = '#b8860b'; g.beginPath(); g.arc(16, 16, 15, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(16, 16, 12, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(12, 11, 4, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#c99a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 9); g.lineTo(16, 23); g.stroke();
    }

    const chevron = canvas(48);
    {
        const g = chevron.g;
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.strokeStyle = 'rgba(13,20,26,0.75)'; g.lineWidth = 12;
        g.beginPath(); g.moveTo(16, 10); g.lineTo(32, 24); g.lineTo(16, 38); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 6;
        g.beginPath(); g.moveTo(16, 10); g.lineTo(32, 24); g.lineTo(16, 38); g.stroke();
    }

    const pokeball = canvas(64);
    {
        const g = pokeball.g;
        g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e8403a'; g.beginPath(); g.arc(32, 32, 26, Math.PI, 0); g.fill();
        g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(32, 32, 26, 0, Math.PI); g.fill();
        g.fillStyle = '#1b1b1f'; g.fillRect(4, 29, 56, 6);
        g.beginPath(); g.arc(32, 32, 10, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(22, 18, 7, 4, -0.6, 0, Math.PI * 2); g.fill();
    }

    const flake = canvas(16);
    {
        const gr = flake.g.createRadialGradient(8, 8, 0, 8, 8, 8);
        gr.addColorStop(0, 'rgba(255,255,255,1)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0.85)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        flake.g.fillStyle = gr; flake.g.fillRect(0, 0, 16, 16);
    }

    const moon = canvas(64);
    {
        const g = moon.g;
        const gr = g.createRadialGradient(26, 24, 4, 32, 32, 30);
        gr.addColorStop(0, '#ffd2c4'); gr.addColorStop(0.7, '#e0604f'); gr.addColorStop(1, '#a8202a');
        g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(120,10,20,0.35)';
        for (const [cx, cy, cr] of [[40, 22, 6], [24, 40, 5], [42, 42, 4], [20, 22, 3]]) { g.beginPath(); g.arc(cx, cy, cr, 0, Math.PI * 2); g.fill(); }
    }

    cache = {
        soft: tex(soft.c), streak: tex(streak.c), star: tex(star.c), ring: tex(ring.c), vignette: tex(vignette.c),
        coin: tex(coin.c), chevron: tex(chevron.c), pokeball: tex(pokeball.c), flake: tex(flake.c), moon: tex(moon.c)
    };
    return cache;
}
