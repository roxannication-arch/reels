# reels — движок роликов Your Times

Утро одной командой (окружение, план из банка, журнал хуков, рендер, publish/):

```
bash scripts/morning.sh <date>        # в конце печатает карту files для Artifact publish
```
Внутри: `plan.mjs` собирает 10 брифов из `briefs/bank.json` + `briefs/pools.json` (без модели, детерминированно по дате, хуки не повторяются 14 дней по `briefs/used.json`), `render.mjs` рендерит, `prep-publish.mjs` раскладывает в publish/. После запуска закоммить `briefs/used.json` и `briefs/<date>.json`.

Ручной режим: `node scripts/render.mjs briefs/<date>.json out/<date>` для своего брифа.

## Установка в свежей среде
```
npm ci || npm i
pip install --break-system-packages kokoro-onnx soundfile
mkdir -p models && cd models && for f in kokoro-v1.0.onnx voices-v1.0.bin; do [ -f $f ] || curl -sSL -o $f https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f; done
```
Браузер для рендера: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` (переопределить: `CHROME=...`).

## Формат брифа (briefs/*.json, массив)
```json
{
  "id": "2026-10-02-03",            // уникальный, попадает в имя файла
  "template": "frontpage",         // frontpage | printer | lockscreen | versus | headlines
  "theme": "paper",                // paper | haunted
  "account": "main",               // main | farm-1 … (для подписи в студии)
  "voice": "af_heart", "speed": 1.05,
  "lines": [
    { "say": "текст для голоса", "caption": "короткая подпись на экране (если нет — say)",
      "head": "заголовок (frontpage/headlines)", "kicker": "рубрика", "body": "подзаголовок" }
  ],
  "caption": "подпись к посту", "hashtags": "#…", "title": "название в студии",
  "name": "Roksana", "city": "Tulum", "weather": "29°C · Clear", "edition": "Morning Edition",
  "page": { "waiting": [["Имя","почему"]], "payments": [["Received today","$1,240"]], "diary": [["09:30","…"]] },
  "notifs": ["Slack · 14 new messages", "…"], "clearAt": 2, "splitAt": 1, "cta": "Link in bio"
}
```
Голос Kokoro: `af_heart` (тёплый женский), `af_bella`, `am_michael`, `bf_emma` (британский), `bm_george`.

## Правила контента
- Английский, без эмодзи и тире-em-dash, без цены в кадре. 4–6 строк, 12–18 секунд, последняя строка CTA.
- Контент живёт в `briefs/bank.json` (заготовки без id) и `briefs/hooks.md` (идеи хуков). Банк пополняется раз в неделю, минимум 70 заготовок в запасе; план берёт из него, журнал в `briefs/used.json`.
- В день: 10 роликов, не больше 3 одного шаблона, 2+ голоса. С 20 по 31 октября 3 из 10 в теме haunted (заготовки с theme "haunted").

## Студия
Страница studio/index.html публикуется как артефакт https://claude.ai/artifact/AFGvDbjmDKBXPHJQCzqNVj с файлами из publish/ (reels/01.mp4 … reels/manifest.json). Пути фиксированы, новая пачка заменяет старую.
