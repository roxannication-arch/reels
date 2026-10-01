# Озвучка строк ролика бесплатным голосом Kokoro.
# python3 scripts/tts.py <brief.json> <out_dir>  -> пишет line-N.wav, voice.wav и timing.json
import json, sys, os
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
brief = json.load(open(sys.argv[1]))
out = sys.argv[2]
os.makedirs(out, exist_ok=True)
k = Kokoro(os.path.join(ROOT, 'models/kokoro-v1.0.onnx'), os.path.join(ROOT, 'models/voices-v1.0.bin'))
voice = brief.get('voice', 'af_heart')
speed = float(brief.get('speed', 1.05))
GAP = 0.28  # пауза между строками, сек
chunks, timing, t = [], [], 0.35  # короткий вдох в начале
sr = 24000
chunks.append(np.zeros(int(sr * t), dtype=np.float32))
for i, line in enumerate(brief['lines']):
    samples, sr = k.create(line['say'], voice=voice, speed=speed, lang='en-us')
    d = len(samples) / sr
    timing.append({'i': i, 'start': round(t, 3), 'end': round(t + d, 3)})
    chunks.append(samples.astype(np.float32))
    chunks.append(np.zeros(int(sr * GAP), dtype=np.float32))
    t += d + GAP
audio = np.concatenate(chunks)
sf.write(os.path.join(out, 'voice.wav'), audio, sr)
json.dump({'duration': round(t + 1.6, 3), 'lines': timing}, open(os.path.join(out, 'timing.json'), 'w'))
print(json.dumps({'duration': round(t, 2), 'lines': len(timing)}))
