// Рендер пачки роликов одной командой:
//   node scripts/render.mjs briefs/2026-10-02.json out/2026-10-02
// Каждый элемент массива в briefs-файле — один ролик: {id, template, theme, lines:[{say, caption?, head?, kicker?, body?}], caption, hashtags, ...}
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const [,, briefsPath, outDir] = process.argv;
if (!briefsPath || !outDir) { console.error('usage: node scripts/render.mjs <briefs.json> <outDir>'); process.exit(1); }
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const briefs = JSON.parse(fs.readFileSync(briefsPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'public/voice'), { recursive: true });

// 1) Озвучка всех роликов (public/ копируется в бандл один раз, поэтому голос должен быть готов до бандла)
const timings = {};
for (const brief of briefs) {
  const voiceDir = path.join(ROOT, 'public/voice', brief.id);
  fs.mkdirSync(voiceDir, { recursive: true });
  fs.writeFileSync(path.join(voiceDir, 'brief.json'), JSON.stringify(brief));
  execFileSync('python3', [path.join(ROOT, 'scripts/tts.py'), path.join(voiceDir, 'brief.json'), voiceDir], { stdio: 'inherit' });
  timings[brief.id] = JSON.parse(fs.readFileSync(path.join(voiceDir, 'timing.json'), 'utf8'));
}

// 2) Бандл и рендер
console.log('bundling…');
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.js'), publicDir: path.join(ROOT, 'public') });

const manifest = [];
for (const brief of briefs) {
  const id = brief.id;
  const timing = timings[id];
  const inputProps = { brief, timing, audio: null };
  const composition = await selectComposition({ serveUrl, id: 'Reel', inputProps, browserExecutable: CHROME });
  const outFile = path.join(outDir, `${id}.mp4`);
  const silent = path.join(outDir, `${id}.silent.mp4`);
  await renderMedia({
    composition, serveUrl, codec: 'h264', outputLocation: silent, inputProps, muted: true,
    crf: 20, concurrency: 2,
    browserExecutable: CHROME,
    onProgress: ({ progress }) => process.stdout.write(`\r${id} ${(progress * 100).toFixed(0)}%   `),
  });
  // Голос подмешиваем ffmpeg: надёжнее, чем звук внутри бандла
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', path.join(ROOT, 'public/voice', id, 'voice.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', outFile]);
  fs.unlinkSync(silent);
  // Обложка: кадр на 1.2 с
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1.2', '-i', outFile, '-frames:v', '1', path.join(outDir, `${id}.jpg`)]);
  const size = fs.statSync(outFile).size;
  console.log(`\n${id}: ${timing.duration}s, ${(size / 1e6).toFixed(1)} MB`);
  manifest.push({ id, file: `${id}.mp4`, cover: `${id}.jpg`, duration: timing.duration, template: brief.template, theme: brief.theme || 'paper', title: brief.title || brief.lines[0].say, caption: brief.caption || '', hashtags: brief.hashtags || '', account: brief.account || 'main' });
}
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`done: ${manifest.length} reels → ${outDir}`);
