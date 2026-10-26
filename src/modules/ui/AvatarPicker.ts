/**
 * ESCOLHA DE AVATAR COM PRÉVIA
 * Troca o <select> de avatar por uma grade de retratos (o select continua no DOM, escondido, como fonte do valor:
 * escolher um retrato muda o select e dispara o 'change' de sempre).
 */
type PickerOpts = { compact?: boolean; taken?: () => Set<string> };

const pickers = new Map<HTMLSelectElement, { grid: HTMLElement; opts: PickerOpts }>();

function fileOf(v: string) { return (v || '').split('/').pop() || ''; }

export const AvatarPicker = {
    enhance(select: HTMLSelectElement | null, opts: PickerOpts = {}) {
        if (!select) return;
        const existing = pickers.get(select);
        if (existing) { this.refresh(select); return; }
        const grid = document.createElement('div');
        grid.className = `pb-avatar-picker${opts.compact ? ' is-compact' : ''}`;
        grid.setAttribute('role', 'radiogroup');
        grid.setAttribute('aria-label', select.getAttribute('aria-label') || 'Escolha o avatar');
        select.classList.add('pb-avatar-select-hidden');
        select.setAttribute('tabindex', '-1');
        select.setAttribute('aria-hidden', 'true');
        select.insertAdjacentElement('afterend', grid);
        pickers.set(select, { grid, opts });
        select.addEventListener('change', () => this.refresh(select));
        this.refresh(select);
    },

    refresh(select: HTMLSelectElement) {
        const entry = pickers.get(select);
        if (!entry) return;
        const { grid, opts } = entry;
        const taken = opts.taken ? opts.taken() : new Set<string>();
        const current = fileOf(select.value);
        grid.replaceChildren(...Array.from(select.options).map(opt => {
            const file = fileOf(opt.value);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pb-avatar-option';
            btn.setAttribute('role', 'radio');
            const selected = file === current;
            const isTaken = !selected && taken.has(file);
            btn.setAttribute('aria-checked', String(selected));
            btn.classList.toggle('is-selected', selected);
            btn.classList.toggle('is-taken', isTaken);
            btn.disabled = isTaken;
            btn.title = isTaken ? `${opt.text} (já escolhido)` : opt.text;
            const img = document.createElement('img');
            img.src = `/assets/img/Treinadores/${file}`;
            img.alt = '';
            img.loading = 'lazy';
            const label = document.createElement('span');
            label.textContent = opt.text;
            btn.append(img, label);
            btn.addEventListener('click', () => {
                if (select.value === opt.value) return;
                select.value = opt.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
            return btn;
        }));
    },

    refreshAll() { pickers.forEach((_, select) => { if (select.isConnected) this.refresh(select); else pickers.delete(select); }); },
};

(window as any).AvatarPicker = AvatarPicker;
