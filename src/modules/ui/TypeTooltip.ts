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

        const renderPills = (list: string[], emptyText: string) => {
            if (list.length === 0) {
                return `
                    <div class="type-tooltip-empty">
                        <span class="type-tooltip-empty-dash">—</span>
                        <span>${emptyText}</span>
                    </div>`;
            }
            return `
                <div class="type-tooltip-pill-list">
                    ${list.map(t => {
                        const c = TYPE_COLORS[t] || '#777';
                        const ic = TYPE_ICONS[t] || '⚪';
                        return `
                            <span class="type-tooltip-pill" style="--pill-bg: ${c};">
                                <span class="type-tooltip-pill-icon">${ic}</span>
                                <span class="type-tooltip-pill-name">${t}</span>
                            </span>`;
                    }).join('')}
                </div>`;
        };

        return `
            <div class="type-tooltip-ambient" aria-hidden="true"></div>

            <div class="type-tooltip-header">
                <div class="type-tooltip-header-left">
                    <div class="type-tooltip-orb-wrap">
                        <span class="type-tooltip-orb">${icon}</span>
                    </div>
                    <div class="type-tooltip-title-col">
                        <span class="type-tooltip-kicker">Afinidade Elemental</span>
                        <h4 class="type-tooltip-title">Tipo ${type}</h4>
                    </div>
                </div>
                <span class="type-tooltip-elem-badge">Elemental</span>
            </div>

            <div class="type-tooltip-lore-box">
                <p class="type-tooltip-lore-text">${lore}</p>
            </div>

            <div class="type-tooltip-combat-grid">
                <!-- Card Ofensivo -->
                <div class="type-combat-card type-combat-card--atk">
                    <div class="type-combat-card-head">
                        <span class="type-combat-head-icon">⚔️</span>
                        <span class="type-combat-head-label">Eficácia Ofensiva (Ataque)</span>
                    </div>

                    <div class="type-combat-row">
                        <div class="type-combat-subhead text-advantage">
                            <span class="type-mult-badge badge-adv">+75% (1.75x)</span>
                            <span class="type-mult-title">Dano aumentado em:</span>
                        </div>
                        ${renderPills(superEffectiveAtk, 'Nenhuma vantagem elemental direta')}
                    </div>

                    <div class="type-combat-row">
                        <div class="type-combat-subhead text-disadvantage">
                            <span class="type-mult-badge badge-disadv">-25% (0.75x)</span>
                            <span class="type-mult-title">Dano reduzido contra:</span>
                        </div>
                        ${renderPills(notVeryEffectiveAtk, 'Nenhum redutor elemental')}
                    </div>
                </div>

                <!-- Card Defensivo -->
                <div class="type-combat-card type-combat-card--def">
                    <div class="type-combat-card-head">
                        <span class="type-combat-head-icon">🛡️</span>
                        <span class="type-combat-head-label">Eficácia Defensiva (Defesa)</span>
                    </div>

                    <div class="type-combat-row">
                        <div class="type-combat-subhead text-weakness">
                            <span class="type-mult-badge badge-weak">+75% (1.75x)</span>
                            <span class="type-mult-title">Sofre dano crítico de:</span>
                        </div>
                        ${renderPills(weaknessesDef, 'Nenhuma fraqueza elemental')}
                    </div>

                    <div class="type-combat-row">
                        <div class="type-combat-subhead text-resistance">
                            <span class="type-mult-badge badge-res">-25% (0.75x)</span>
                            <span class="type-mult-title">Resiste a golpes de:</span>
                        </div>
                        ${renderPills(resistancesDef, 'Nenhuma resistência elemental')}
                    </div>
                </div>
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
        this.container.style.setProperty('--type-glow-soft', `${color}28`);

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
                    this.show(norm, e);
                    e.stopPropagation();
                    return;
                }
            }
            if (this.isVisible) {
                this.hide();
            }
        });

        // Oculta ao rolar a página
        window.addEventListener('scroll', () => this.hide(), { passive: true });
    }
}
