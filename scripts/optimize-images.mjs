// Reduz as imagens de public/assets para o tamanho em que o jogo realmente as mostra.
// Rode "npm run optimize:images" ao adicionar arte nova: só mexe no que estiver fora do padrão, então pode rodar sempre.
// As imagens originais continuam no histórico do git.
import { existsSync, readdirSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import sharp from 'sharp';

const ROOT = 'public/assets/img';
const BOARD_DIR = join(ROOT, 'board');
const BOARD_SIZE = 256; // casa ampliada ao máximo: ~190 px de tela em DPR 2

// format "webp" troca o arquivo de extensão; "png"/"jpeg" mantêm o caminho (usado em URLs gravadas no banco, como avatares)
const RULES = [
    { match: /^Ginasios\//, max: 512, format: 'webp', quality: 78, board: 'gym' },
    { match: /^NPCs\//, max: 512, format: 'webp', quality: 76, board: 'npc' },
    { match: /^Terrenos\/(Grama|Agua|Areia)\./, max: 512, format: 'webp', quality: 74, board: 'tile' },
    { match: /^(PCMart|PokeBolaItem|Ginasio)\./, max: 512, format: 'webp', quality: 78, board: 'tile' },
    { match: /^Insignias\//, max: 320, format: 'webp', quality: 86 },
    { match: /^Background\/Batalha/, max: 1280, format: 'webp', quality: 74 },
    { match: /^Background\//, max: 1920, format: 'webp', quality: 72 },
    { match: /^manual_header\./, max: 1200, format: 'webp', quality: 78 },
    { match: /^Terrenos\/BarrancoRio\./, max: 1600, format: 'webp', quality: 74 },
    { match: /^Treinadores\//, max: 384, format: 'png', quality: 88 },
    { match: /^Cartas\/[^/]+\.jpg$/, max: 1024, format: 'jpeg', quality: 76 }
];
const ENCODE = {
    webp: (img, q) => img.webp({ quality: q, effort: 6, alphaQuality: 90 }),
    jpeg: (img, q) => img.jpeg({ quality: q, mozjpeg: true }),
    png: (img, q) => img.png({ palette: true, quality: q, effort: 10, compressionLevel: 9 })
};
const SAME_FORMAT_BUDGET = { png: 96 * 1024, jpeg: 180 * 1024 };

const walk = (dir) => readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
});
const slug = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');

let before = 0, after = 0, changed = 0;
mkdirSync(BOARD_DIR, { recursive: true });

for (const path of walk(ROOT)) {
    const rel = path.slice(ROOT.length + 1).normalize('NFC');
    if (rel.startsWith('board/') || !/\.(png|jpe?g|webp)$/i.test(rel)) continue;
    const rule = RULES.find((r) => r.match.test(rel));
    if (!rule) continue;

    const ext = extname(path);
    const out = rule.format === 'webp' ? path.slice(0, -ext.length) + '.webp' : path;
    const size = statSync(path).size;
    const meta = await sharp(path).metadata();
    const big = Math.max(meta.width, meta.height) > rule.max;
    const needsConversion = out !== path;
    const overBudget = !needsConversion && rule.format !== 'webp' && size > SAME_FORMAT_BUDGET[rule.format];

    if (big || needsConversion || overBudget) {
        const img = sharp(path).resize({ width: rule.max, height: rule.max, fit: 'inside', withoutEnlargement: true });
        const data = await ENCODE[rule.format](img, rule.quality).toBuffer();
        // Nunca troca por um arquivo maior no mesmo formato
        if (needsConversion || data.length < size) {
            writeFileSync(out, data);
            if (needsConversion) rmSync(path);
            before += size; after += data.length; changed++;
        }
    }

    if (rule.board) {
        const name = `${rule.board}-${slug(basename(out, extname(out)))}.webp`;
        const target = join(BOARD_DIR, name);
        if (!existsSync(target)) {
            await sharp(out).resize({ width: BOARD_SIZE, height: BOARD_SIZE, fit: 'cover' }).webp({ quality: 72, effort: 6 }).toFile(target);
        }
    }
}

console.log(`${changed} imagens otimizadas: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
