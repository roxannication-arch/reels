// Собирает дневной бриф из банка без участия модели.
//   node scripts/plan.mjs <date> [used.json] > briefs/<date>.json
// Банк: briefs/bank.json — массив заготовок {template, theme?, lines[]} без id. Полоса, уведомления и голос подмешиваются из пулов.
// used.json — массив строк-хуков, которые нельзя брать (журнал за 14 дней).
import fs from 'node:fs';
import path from 'node:path';

const [,, date, usedPath] = process.argv;
if (!date) { console.error('usage: node scripts/plan.mjs <YYYY-MM-DD> [used.json]'); process.exit(1); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'briefs/bank.json'), 'utf8'));
const pools = JSON.parse(fs.readFileSync(path.join(ROOT, 'briefs/pools.json'), 'utf8'));
// used.json: [{hook, date}] или просто строки; хуки за последние 14 дней не берём
const cutoff = new Date(new Date(date + 'T00:00:00Z').getTime() - 14 * 864e5).toISOString().slice(0, 10);
const usedRaw = usedPath && fs.existsSync(usedPath) ? JSON.parse(fs.readFileSync(usedPath, 'utf8')) : [];
const used = new Set(usedRaw.map((u) => (typeof u === 'string' ? u : (u.date >= cutoff ? u.hook : null))).filter(Boolean));

// Детерминированный генератор от даты, чтобы перезапуск в тот же день давал ту же пачку
let seed = [...date].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => arr.map((v) => [rnd(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

const day = Number(date.slice(8, 10)), month = Number(date.slice(5, 7));
const haunted = month === 10 && day >= 20 && day <= 31;
const COUNT = Number(process.env.COUNT || 10);
const MAX_PER_TEMPLATE = 3;

// Кандидаты: не использованные, подходящие по теме
let pool = bank.filter((b) => !used.has(b.lines[0].say) && ((b.theme === 'haunted') === false || haunted));
let hauntedPool = shuffle(pool.filter((b) => b.theme === 'haunted'));
let plainPool = shuffle(pool.filter((b) => b.theme !== 'haunted'));

const chosen = [];
const perTemplate = {};
const take = (src, n) => {
  for (const b of src) {
    if (chosen.length >= COUNT || n <= 0) break;
    if ((perTemplate[b.template] || 0) >= MAX_PER_TEMPLATE) continue;
    chosen.push(b); perTemplate[b.template] = (perTemplate[b.template] || 0) + 1; n--;
  }
};
if (haunted) take(hauntedPool, 3);
take(plainPool, COUNT - chosen.length);
if (chosen.length < COUNT) { // банк почти пуст: добираем из использованных, лучше повтор, чем пустое утро
  const rest = shuffle(bank.filter((b) => !chosen.includes(b) && (b.theme !== 'haunted' || haunted)));
  take(rest, COUNT - chosen.length);
}
if (chosen.length < 8) console.error(`warning: only ${chosen.length} briefs available, refill briefs/bank.json`);

const CTA = ['Want your own? Link in bio.', 'Yours is in the bio.', 'Link in bio if you want one.'];
const voicesF = ['af_heart', 'af_bella', 'bf_emma'], voicesM = ['am_michael', 'bm_george'];

const out = chosen.map((b, i) => {
  const page = pick(pools.pages);
  const voice = i % 4 === 3 ? pick(voicesM) : pick(voicesF);
  const lines = b.lines.map((l) => ({ ...l }));
  if (!/link in bio/i.test(lines[lines.length - 1].say)) lines.push({ say: pick(CTA), caption: 'Link in bio' });
  const hook = lines[0].say;
  const body = lines.slice(1, -1).map((l) => l.say).join(' ');
  const caption = b.caption || `${hook}\n\n${body}\n\nWant your own paper? Link in bio.`;
  const tags = b.hashtags || pools.hashtags[b.template] || pools.hashtags.default;
  return {
    id: `${date}-${String(i + 1).padStart(2, '0')}`,
    template: b.template, theme: b.theme || 'paper', account: 'main', voice, speed: 1.05,
    title: hook, lines, caption, hashtags: tags,
    name: 'Roksana', city: pools.city, weather: pick(pools.weather), edition: b.theme === 'haunted' ? 'Haunted Edition' : 'Morning Edition',
    date: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    lockDate: new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    page, notifs: b.notifs || pick(pools.notifs), clearAt: b.clearAt ?? 2, splitAt: b.splitAt ?? 1,
  };
});
process.stdout.write(JSON.stringify(out, null, 2));
