import { FRAMES } from './Achievements';

const FRAME_IDS = new Set(FRAMES.map(f => f.id));

/** Utilidades visuais dos cosméticos (vêm do banco: sempre validar/escapar antes de pôr no HTML). */
export const Cosmetics = {
    frameClass(frame: string | null | undefined): string {
        return frame && FRAME_IDS.has(frame) ? `pb-frame pb-frame--${frame}` : '';
    },
    escape(value: unknown): string {
        return String(value ?? '').slice(0, 40).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c));
    },
};
