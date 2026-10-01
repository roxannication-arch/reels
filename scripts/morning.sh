#!/usr/bin/env bash
# Утро одной командой: окружение → план из банка → рендер → папка publish.
#   bash scripts/morning.sh <YYYY-MM-DD> [used.json]
# Печатает в конце одну строку JSON: карту files для Artifact publish.
set -euo pipefail
DATE="${1:?date}"; USED="${2:-briefs/used.json}"
cd "$(dirname "$0")/.."
{
  [ -d node_modules/remotion ] || npm i --loglevel=error
  python3 -c "import kokoro_onnx, soundfile" 2>/dev/null || pip install -q --break-system-packages kokoro-onnx soundfile
  mkdir -p models && cd models
  for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -s "$f" ] || curl -sSL -o "$f" "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f"; done
  cd ..
  node scripts/plan.mjs "$DATE" "$USED" > "briefs/$DATE.json"
  # журнал хуков: добавляем сегодняшние, храним 30 дней
  node -e '
    const fs=require("fs"); const [u,b,d]=process.argv.slice(1);
    const used=fs.existsSync(u)?JSON.parse(fs.readFileSync(u)):[];
    const cut=new Date(new Date(d+"T00:00:00Z")-30*864e5).toISOString().slice(0,10);
    const keep=used.filter(x=>x.date>=cut && x.date!==d);
    for (const r of JSON.parse(fs.readFileSync(b))) keep.push({hook:r.title,date:d});
    fs.writeFileSync(u, JSON.stringify(keep,null,1));
  ' "$USED" "briefs/$DATE.json" "$DATE"
  node scripts/render.mjs "briefs/$DATE.json" "out/$DATE" | grep -E "^[0-9]{4}-|done" || true
} >&2
node scripts/prep-publish.mjs "out/$DATE" "$DATE"
