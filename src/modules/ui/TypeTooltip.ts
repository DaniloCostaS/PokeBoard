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

    static normalizeType(raw: string): string {
        const clean = raw.trim();
        const map: Record<string, string> = {
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
        return map[clean] || map[clean.toUpperCase()] || clean;
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
        const color = TYPE_COLORS[type] || '#f1c40f';

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
                return `<div class="type-tooltip-empty">${emptyText}</div>`;
            }
            return `<div class="type-tooltip-pill-list">
                ${list.map(t => {
                    const c = TYPE_COLORS[t] || '#777';
                    const ic = TYPE_ICONS[t] || '';
                    return `<span class="type-tooltip-pill" style="background-color: ${c};">
                        <span class="type-tooltip-pill-icon">${ic}</span>
                        <span>${t}</span>
                    </span>`;
                }).join('')}
            </div>`;
        };

        return `
            <div class="type-tooltip-header">
                <div class="type-tooltip-title-wrap">
                    <span class="type-tooltip-orb" style="background:${color}; box-shadow: 0 0 10px ${color};">${icon}</span>
                    <span class="type-tooltip-title">Tipo ${type}</span>
                </div>
                <span class="type-tooltip-tag">Elemental</span>
            </div>
            <div class="type-tooltip-lore">${lore}</div>

            <div class="type-tooltip-section">
                <div class="type-tooltip-label text-advantage">
                    <span>⚔️ Causa +75% Dano (1.75x) em:</span>
                </div>
                ${renderPills(superEffectiveAtk, 'Nenhuma vantagem elemental')}

                <div class="type-tooltip-label text-disadvantage" style="margin-top: 6px;">
                    <span>🛡️ Causa -25% Dano (0.75x) em:</span>
                </div>
                ${renderPills(notVeryEffectiveAtk, 'Nenhum redutor elemental')}
            </div>

            <div class="type-tooltip-divider"></div>

            <div class="type-tooltip-section">
                <div class="type-tooltip-label text-weakness">
                    <span>💥 Sofre +75% Dano (1.75x) de:</span>
                </div>
                ${renderPills(weaknessesDef, 'Nenhuma fraqueza elemental')}

                <div class="type-tooltip-label text-resistance" style="margin-top: 6px;">
                    <span>🔰 Resiste com -25% Dano (0.75x) de:</span>
                </div>
                ${renderPills(resistancesDef, 'Nenhuma resistência elemental')}
            </div>
        `;
    }

    static show(rawType: string, event: MouseEvent | { clientX: number; clientY: number }) {
        this.createContainer();
        if (!this.container) return;

        const normalized = this.normalizeType(rawType);
        if (!TYPE_COLORS[normalized]) return;

        if (this.currentType !== normalized || !this.isVisible) {
            this.currentType = normalized;
            this.container.innerHTML = this.generateHTML(normalized);
        }

        this.container.style.display = 'block';
        this.isVisible = true;
        this.updatePosition(event);
    }

    static updatePosition(event: MouseEvent | { clientX: number; clientY: number }) {
        if (!this.container || !this.isVisible) return;

        const pad = 14;
        let x = event.clientX + pad;
        let y = event.clientY + pad;

        const rect = this.container.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Se passar da borda direita, coloca à esquerda do cursor
        if (x + rect.width > winW - 10) {
            x = event.clientX - rect.width - pad;
        }
        if (x < 10) x = 10;

        // Se passar da borda inferior, coloca acima do cursor
        if (y + rect.height > winH - 10) {
            y = event.clientY - rect.height - pad;
        }
        if (y < 10) y = 10;

        this.container.style.left = `${x}px`;
        this.container.style.top = `${y}px`;
    }

    static hide() {
        if (!this.container) return;
        this.container.style.display = 'none';
        this.isVisible = false;
        this.currentType = null;
    }

    static init() {
        this.createContainer();

        document.addEventListener('mouseover', (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('.poke-type-badge, [data-type], [data-pokemon-type]');
            if (target) {
                const typeVal = target.getAttribute('data-type') || 
                                target.getAttribute('data-pokemon-type') || 
                                target.textContent?.trim();
                if (typeVal) {
                    const norm = this.normalizeType(typeVal);
                    if (TYPE_COLORS[norm]) {
                        this.show(norm, e);
                    }
                }
            }
        });

        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (this.isVisible) {
                this.updatePosition(e);
            }
        });

        document.addEventListener('mouseout', (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('.poke-type-badge, [data-type], [data-pokemon-type]');
            if (target) {
                const related = e.relatedTarget as HTMLElement | null;
                if (!related || !related.closest('.poke-type-badge, [data-type], [data-pokemon-type]')) {
                    this.hide();
                }
            }
        });

        window.addEventListener('scroll', () => this.hide(), { passive: true });
    }
}
