import { TYPE_CHART } from '../../constants/typeChart';

export const TYPE_ICONS: Record<string, string> = {
    'Normal': '⚪',
    'Fogo': '🔥',
    'Água': '💧',
    'Elétrico': '⚡',
    'Grama': '🌿',
    'Gelo': '❄️',
    'Lutador': '🥊',
    'Veneno': '☠️',
    'Terra': '🌍',
    'Voador': '🦅',
    'Psíquico': '🔮',
    'Inseto': '🐛',
    'Pedra': '🪨',
    'Fantasma': '👻',
    'Dragão': '🐉',
    'Noturno': '🌑',
    'Aço': '⚙️',
    'Fada': '✨'
};

export const TYPE_COLORS: Record<string, string> = {
    'Normal': '#A8A77A',
    'Fogo': '#EE8130',
    'Água': '#6390F0',
    'Elétrico': '#F7D02C',
    'Grama': '#7AC74C',
    'Gelo': '#96D9D6',
    'Lutador': '#C22E28',
    'Veneno': '#A33EA1',
    'Terra': '#E2BF65',
    'Voador': '#A98FF3',
    'Psíquico': '#F95587',
    'Inseto': '#A6B91A',
    'Pedra': '#B6A136',
    'Fantasma': '#735797',
    'Dragão': '#6F35FC',
    'Noturno': '#705746',
    'Aço': '#B7B7CE',
    'Fada': '#D685AD'
};

export const TYPE_LORE: Record<string, string> = {
    'Normal': 'Equilíbrio primordial e versatilidade sem afinidades extremas.',
    'Fogo': 'Combustão viva e energia térmica. Incinera florestas, gelo e metais.',
    'Água': 'Fluidez e adaptabilidade das marés. Extingue chamas e desgasta minerais.',
    'Elétrico': 'Descargas de alta voltagem e velocidade extrema. Eletrocuta água e céus.',
    'Grama': 'A força vital da flora e da natureza. Drena energias vitais e hidratação.',
    'Gelo': 'Frio glacial absoluto. Fragiliza escudos vegetais, dragões e voadores.',
    'Lutador': 'Disciplina marcial e impacto direto. Quebra rochas, gelo e defesas blindadas.',
    'Veneno': 'Toxinas corrosivas e miasmas químicos. Debilita plantas e fadas com pestilência.',
    'Terra': 'Solidez telúrica e abalos sísmicos. Devasta eletricidade, fogo e metais.',
    'Voador': 'Domínio pleno dos céus e rajadas de vento. Ataques aéreos rápidos e evasivos.',
    'Psíquico': 'Poder mental puro e telecinese. Sobrepuja lutadores e toxinas biológicas.',
    'Inseto': 'Resiliência e colônia. Ataques estratégicos contra mentes, ervas e sombras.',
    'Pedra': 'Dureza mineral e rochas ancestrais. Esmaga fogo, gelo, insetos e aves.',
    'Fantasma': 'Incorpóreo e espectral. Atravessa o plano físico e assombra mentes.',
    'Dragão': 'Força ancestral mística dos dracônicos. Poder elemental puro e dominante.',
    'Noturno': 'Astúcia, sombras e trapaças na escuridão. Neutraliza poderes mentais.',
    'Aço': 'Blindagem metálica inquebrável. A maior barreira de defesa física conhecida.',
    'Fada': 'Magia luminosa e encantamentos antigos. Domina dragões e artes marciais.'
};

export class TypeTooltip {
    private static container: HTMLDivElement | null = null;
    private static currentType: string | null = null;
    private static isVisible: boolean = false;
    private static initialized: boolean = false;
    private static anchor: HTMLElement | null = null;

    private static TYPE_MAP: Record<string, string> = {
        'AGUA': 'Água', 'ÁGUA': 'Água', 'Agua': 'Água', 'Água': 'Água',
        'ELETRICO': 'Elétrico', 'ELÉTRICO': 'Elétrico', 'Eletrico': 'Elétrico', 'Elétrico': 'Elétrico',
        'PSIQUICO': 'Psíquico', 'PSÍQUICO': 'Psíquico', 'Psiquico': 'Psíquico', 'Psíquico': 'Psíquico',
        'DRAGAO': 'Dragão', 'DRAGÃO': 'Dragão', 'Dragao': 'Dragão', 'Dragão': 'Dragão',
        'ACO': 'Aço', 'AÇO': 'Aço', 'Aco': 'Aço', 'Aço': 'Aço',
        'FOGO': 'Fogo', 'Fogo': 'Fogo',
        'GRAMA': 'Grama', 'Grama': 'Grama', 'PLANTA': 'Grama', 'Planta': 'Grama',
        'GELO': 'Gelo', 'Gelo': 'Gelo',
        'LUTADOR': 'Lutador', 'Lutador': 'Lutador',
        'VENENO': 'Veneno', 'Veneno': 'Veneno',
        'TERRA': 'Terra', 'Terra': 'Terra',
        'VOADOR': 'Voador', 'Voador': 'Voador',
        'INSETO': 'Inseto', 'Inseto': 'Inseto',
        'PEDRA': 'Pedra', 'Pedra': 'Pedra',
        'FANTASMA': 'Fantasma', 'Fantasma': 'Fantasma',
        'NOTURNO': 'Noturno', 'Noturno': 'Noturno',
        'FADA': 'Fada', 'Fada': 'Fada',
        'NORMAL': 'Normal', 'Normal': 'Normal'
    };

    static normalizeType(raw: string): string {
        if (!raw) return '';
        let clean = raw.trim();

        // 1. Remove prefixos comuns como "Tipo ", "Tipo: ", "Isca de tipo: "
        clean = clean.replace(/^(Tipo|tipo)[:\s]+/i, '').trim();
        clean = clean.replace(/^Isca de tipo[:\s]+/i, '').trim();

        // 2. Remove multiplicadores como "(2x)", "(1.75x)", "(0.75x)"
        clean = clean.replace(/\s*\(\d+(\.\d+)?x\)$/i, '').trim();

        // 3. Remove pontuações e emojis decorativos do início e do fim
        clean = clean.replace(/^[^\p{L}\p{N}]+/u, '').trim();
        clean = clean.replace(/[^\p{L}\p{N}]+$/u, '').trim();

        // Checagem direta
        if (this.TYPE_MAP[clean]) return this.TYPE_MAP[clean];
        if (this.TYPE_MAP[clean.toUpperCase()]) return this.TYPE_MAP[clean.toUpperCase()];

        // Procura palavras individuais se for uma frase/expressão
        const words = clean.split(/\s+/);
        for (const w of words) {
            const up = w.toUpperCase();
            if (this.TYPE_MAP[up]) return this.TYPE_MAP[up];
        }

        return clean;
    }

    private static createContainer() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'type-effectiveness-tooltip';
        this.container.className = 'type-tooltip-box';
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
    }

    static generateHTML(rawType: string): string {
        const type = this.normalizeType(rawType);
        const icon = TYPE_ICONS[type] || '⚪';
        const lore = TYPE_LORE[type] || 'Afinidade elemental primordial de combate.';

        // 1. Vantagens e Redutores Ofensivos (Ataque)
        const superEffectiveAtk: string[] = [];
        const notVeryEffectiveAtk: string[] = [];

        if (TYPE_CHART[type]) {
            for (const defType of Object.keys(TYPE_CHART[type])) {
                const multi = TYPE_CHART[type][defType];
                if (multi === 2) {
                    superEffectiveAtk.push(defType);
                } else if (multi === 0.5) {
                    notVeryEffectiveAtk.push(defType);
                }
            }
        }

        // 2. Fraquezas e Resistências Defensivas (Defesa)
        const weaknessesDef: string[] = [];
        const resistancesDef: string[] = [];

        for (const atkT of Object.keys(TYPE_CHART)) {
            const multi = TYPE_CHART[atkT]?.[type];
            if (multi === 2) {
                weaknessesDef.push(atkT);
            } else if (multi === 0.5) {
                resistancesDef.push(atkT);
            }
        }

        const renderPills = (list: string[], emptyText: string) => list.length === 0
            ? `<p class="type-tt-empty">${emptyText}</p>`
            : `<div class="type-tt-pills">${list.map(t => `<span class="type-tt-pill" style="--pill:${TYPE_COLORS[t] || '#777'}">${TYPE_ICONS[t] || ''} ${t}</span>`).join('')}</div>`;

        const row = (cls: string, title: string, multi: string, list: string[], empty: string) => `
            <div class="type-tt-row ${cls}">
                <div class="type-tt-row-head"><span>${title}</span><b>${multi}</b></div>
                ${renderPills(list, empty)}
            </div>`;

        return `
            <div class="type-tt-head">
                <span class="type-tt-orb" aria-hidden="true">${icon}</span>
                <div class="type-tt-name"><small>Tipo</small><h4>${type}</h4></div>
            </div>
            <p class="type-tt-lore">${lore}</p>
            <div class="type-tt-grid">
                <section class="type-tt-col">
                    <h5>⚔️ Atacando</h5>
                    ${row('is-good', 'Causa mais dano em', '1.75x', superEffectiveAtk, 'Nenhum tipo')}
                    ${row('is-bad', 'Causa menos dano em', '0.75x', notVeryEffectiveAtk, 'Nenhum tipo')}
                </section>
                <section class="type-tt-col">
                    <h5>🛡️ Defendendo</h5>
                    ${row('is-bad', 'Recebe mais dano de', '1.75x', weaknessesDef, 'Nenhum tipo')}
                    ${row('is-good', 'Recebe menos dano de', '0.75x', resistancesDef, 'Nenhum tipo')}
                </section>
            </div>
        `;
    }

    static show(rawType: string, event: MouseEvent | Touch | { clientX: number; clientY: number }) {
        this.createContainer();
        if (!this.container) return;

        const normalized = this.normalizeType(rawType);
        const color = TYPE_COLORS[normalized];
        if (!color) return;

        // Injeta as variáveis de tema elemental dinâmicas no container
        this.container.style.setProperty('--type-color', color);
        this.container.style.setProperty('--type-glow', `${color}66`);

        if (this.currentType !== normalized || !this.isVisible) {
            this.currentType = normalized;
            this.container.innerHTML = this.generateHTML(normalized);
        }

        this.container.style.display = 'block';
        this.isVisible = true;
        this.updatePosition(event);
    }

    static updatePosition(event: MouseEvent | Touch | { clientX: number; clientY: number }) {
        if (!this.container || !this.isVisible) return;

        // Celular: painel fixo na parte de baixo da tela, sem depender de onde foi o toque
        const isSheet = window.innerWidth <= 640;
        this.container.classList.toggle('is-sheet', isSheet);
        if (isSheet) {
            this.container.style.left = '';
            this.container.style.top = '';
            return;
        }

        const pad = 14;
        let x = event.clientX + pad;
        let y = event.clientY + pad;

        const rect = this.container.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Se passar da borda direita, posiciona à esquerda do cursor
        if (x + rect.width > winW - 12) {
            x = event.clientX - rect.width - pad;
        }
        if (x < 12) x = 12;

        // Se passar da borda inferior, posiciona acima do cursor
        if (y + rect.height > winH - 12) {
            y = event.clientY - rect.height - pad;
        }
        if (y < 12) y = 12;

        this.container.style.left = `${Math.round(x)}px`;
        this.container.style.top = `${Math.round(y)}px`;
    }

    static hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
        this.isVisible = false;
        this.currentType = null;
    }

    static init() {
        if (this.initialized) return;
        this.initialized = true;
        this.createContainer();

        const findTypeTarget = (el: HTMLElement | null): { target: HTMLElement; typeVal: string } | null => {
            if (!el) return null;
            const target = el.closest('.poke-type-badge, [data-type], [data-pokemon-type]') as HTMLElement | null;
            if (!target) return null;

            const typeVal = target.getAttribute('data-type') || 
                            target.getAttribute('data-pokemon-type') || 
                            target.textContent?.trim() || '';
            return typeVal ? { target, typeVal } : null;
        };

        // 1. Mouse hover no desktop
        document.addEventListener('mouseover', (e: MouseEvent) => {
            const found = findTypeTarget(e.target as HTMLElement);
            if (found) {
                const norm = this.normalizeType(found.typeVal);
                if (TYPE_COLORS[norm]) {
                    this.anchor = found.target;
                    this.show(norm, e);
                }
            }
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.isVisible) {
                this.updatePosition(e);
            }
        });

        document.addEventListener('mouseout', (e: MouseEvent) => {
            const found = findTypeTarget(e.target as HTMLElement);
            if (found) {
                const related = e.relatedTarget as HTMLElement | null;
                if (!related || !related.closest('.poke-type-badge, [data-type], [data-pokemon-type]')) {
                    this.hide();
                }
            }
        });

        // 2. Suporte a clique / toque mobile
        document.addEventListener('click', (e: MouseEvent) => {
            const found = findTypeTarget(e.target as HTMLElement);
            if (found) {
                const norm = this.normalizeType(found.typeVal);
                if (TYPE_COLORS[norm]) {
                    this.anchor = found.target;
                    this.show(norm, e);
                    e.stopPropagation();
                    return;
                }
            }
            if (this.isVisible) {
                this.hide();
            }
        });

        // Oculta só quando rola o que contém a tag (rolagem automática do log, por exemplo, não fecha o painel)
        window.addEventListener('scroll', e => {
            const scrolled = e.target as Node;
            if (this.isVisible && (scrolled === document || scrolled.contains(this.anchor))) this.hide();
        }, { passive: true, capture: true });
    }
}
