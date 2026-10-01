# reels — движок роликов Your Times

Одна команда делает пачку роликов 1080×1920 с голосом и обложками:

```
node scripts/render.mjs briefs/<date>.json out/<date>
node scripts/prep-publish.mjs out/<date> <date>     # печатает карту files для Artifact publish
```

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
- Хуки брать из briefs/hooks.md, не повторять 14 дней (журнал использованных: ArtifactData студии, collection "log").
- В день: 10 роликов, минимум 4 шаблона, 2 голоса. С 20 по 31 октября 3 из 10 в теме haunted.

## Студия
Страница studio/index.html публикуется как артефакт https://claude.ai/artifact/AFGvDbjmDKBXPHJQCzqNVj с файлами из publish/ (reels/01.mp4 … reels/manifest.json). Пути фиксированы, новая пачка заменяет старую.
