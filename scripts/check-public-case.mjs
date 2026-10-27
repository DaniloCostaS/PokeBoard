// Barra o deploy quando um arquivo de public/ tem nome diferente do que está no git
// (no Mac "greatBall.png" e "greatball.png" são o mesmo arquivo; no Firebase não, e a imagem some).
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const tracked = execSync('git -c core.quotepath=off ls-files -z public', { encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
for (const path of tracked) {
    const parts = path.split('/');
    let dir = '.';
    for (const part of parts) {
        let names;
        try { names = readdirSync(dir); } catch { break; }
        const real = names.find(n => n.normalize('NFC') === part.normalize('NFC'))
            ?? names.find(n => n.normalize('NFC').toLowerCase() === part.normalize('NFC').toLowerCase());
        if (!real) { problems.push(`faltando: ${path}`); break; }
        if (real.normalize('NFC') !== part.normalize('NFC')) { problems.push(`nome diferente: ${join(dir, real)} (no git: ${path})`); break; }
        dir = join(dir, real);
    }
}
if (problems.length) {
    console.error('\nArquivos de public/ diferentes do repositório (maiúsculas/minúsculas):\n  ' + [...new Set(problems)].join('\n  '));
    console.error('\nCorrija renomeando para o nome do git (ou apague e rode "git checkout -- public"), depois "npm run build" de novo.\n');
    process.exit(1);
}
console.log(`public/ ok (${tracked.length} arquivos conferidos)`);
