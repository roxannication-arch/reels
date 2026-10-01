// Готовит папку publish/ с фиксированными именами (01.mp4, 01.jpg … ) и manifest.json для студии.
//   node scripts/prep-publish.mjs out/2026-10-02 2026-10-02
// Печатает JSON-карту files для Artifact publish.
import fs from 'node:fs';
import path from 'node:path';

const [,, outDir, batch] = process.argv;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(ROOT, 'publish');
fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
const files = { 'reels/manifest.json': 'publish/manifest.json' };
const out = manifest.map((m, i) => {
  const n = String(i + 1).padStart(2, '0');
  fs.copyFileSync(path.join(outDir, m.file), path.join(pub, `${n}.mp4`));
  fs.copyFileSync(path.join(outDir, m.cover), path.join(pub, `${n}.jpg`));
  files[`reels/${n}.mp4`] = `publish/${n}.mp4`;
  files[`reels/${n}.jpg`] = `publish/${n}.jpg`;
  return { ...m, file: `${n}.mp4`, cover: `${n}.jpg`, batch };
});
// Слоты, которых сегодня нет, убираем со страницы (null = удалить файл при публикации)
for (let i = out.length + 1; i <= 15; i++) { const n = String(i).padStart(2, '0'); files[`reels/${n}.mp4`] = null; files[`reels/${n}.jpg`] = null; }
fs.writeFileSync(path.join(pub, 'manifest.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(files));
