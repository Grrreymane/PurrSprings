#!/usr/bin/env python3
"""Render listening previews of the v2 audio engine to WAV, offline, in headless Chrome, and check them.

    python D:/Minigame/Hotelgame/tools/audio/render.py [--only lobby_day,bgm_tour] [--gain-db 6]

Serves the game folder, opens tools/audio/render.html in headless Chrome (the engine is read from index.html's
AUDIO block by engine_from_index.js); the page renders every job in
render.html with an OfflineAudioContext (the engine runs exactly as in the game: musicWant + musicTick per frame)
and posts float32 PCM back. Output: D:/Minigame/Hotelgame/.shots/audio/<job>.wav + report.json.
--gain-db is a preview make-up gain applied equally to every file (the in-game level is reported separately).
Checks: peak < -3 dBFS, no clipping, no silence gaps inside music, RMS, click detector, crossfade dips.
"""
import argparse, functools, http.server, json, os, pathlib, subprocess, sys, tempfile, threading, time, urllib.parse, wave
import numpy as np

sys.path.insert(0, 'D:/Minigame/_workflow/tools')
from shot import browser  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent
GAME = HERE.parent.parent
OUT = GAME / '.shots' / 'audio'


def db(x):
    return float(20 * np.log10(max(float(x), 1e-12)))


def win_rms(m, sr, w):
    n = int(sr * w)
    k = len(m) // n
    if k == 0:
        return np.array([0.0])
    return np.sqrt((m[:k * n].reshape(k, n) ** 2).mean(axis=1))


def clicks(m, sr):
    """Isolated single-sample discontinuities: |d[n]| far above the local RMS of d (+-2.5 ms)."""
    d = np.diff(m)
    a = np.abs(d)
    n = int(sr * .0025) * 2 + 1
    k = np.ones(n) / n
    loc = np.sqrt(np.convolve(d * d, k, mode='same'))
    r = a / (loc + 1e-9)
    idx = np.where((r > 8) & (a > 1e-3))[0]
    out, last = [], -1e9
    for i in idx:
        if i - last > sr * .01:
            out.append(round(i / sr, 3))
        last = i
    return out


def analyze(x, sr, meta, music):
    m = x.mean(axis=1)
    peak = float(np.abs(x).max())
    rep = {'seconds': round(len(m) / sr, 1), 'peak_dbfs': round(db(peak), 1), 'clipped_samples': int((np.abs(x) >= .999).sum()),
           'rms_dbfs': round(db(np.sqrt((m ** 2).mean())), 1)}
    w1 = win_rms(m, sr, 1.0)[1:]
    if len(w1):
        rep['rms_1s_min_dbfs'] = round(db(w1.min()), 1)
        rep['rms_1s_max_dbfs'] = round(db(w1.max()), 1)
    w = win_rms(m, sr, .05)
    quiet = w < 10 ** (-60 / 20)
    # longest run of silence after the first sound and before the end (music only: tails at the very end ignored)
    nz = np.where(~quiet)[0]
    gap = 0.0
    if len(nz):
        run = best = 0
        for q in quiet[nz[0]:nz[-1] + 1]:
            run = run + 1 if q else 0
            best = max(best, run)
        gap = best * .05
    rep['longest_silence_s'] = round(gap, 2)
    c = clicks(m, sr)
    rep['clicks'] = len(c)
    rep['click_times'] = c[:12]
    trans = []
    for ts in meta.get('switches', []):
        # loudness in 0.5 s windows from 4 s before to 6 s after the crossfade starts (on the old song's bar line):
        # a smooth fade has no window far below / above the median (no dropout, no bump)
        e = win_rms(m[int(max(0, ts - 4) * sr):int((ts + 6) * sr)], sr, .5)
        med = np.median(e) if len(e) else 1
        trans.append({'t': ts, 'clicks_near': len([t for t in c if ts - .2 <= t <= ts + 3.5]),
                      'min_db_vs_median': round(db(e.min() / med), 1) if len(e) else 0, 'max_db_vs_median': round(db(e.max() / med), 1) if len(e) else 0})
    if trans:
        rep['transitions'] = trans
    if music:
        ok = rep['peak_dbfs'] < -3 and rep['clipped_samples'] == 0 and gap < 1.5 and not any(t['clicks_near'] for t in trans)
    else:
        ok = rep['peak_dbfs'] < -3 and rep['clipped_samples'] == 0
    rep['ok'] = bool(ok)
    return rep


def seg_levels(x, sr, segs):
    """Per-effect levels of the sfx reel: peak, RMS over the 0.3 s after the onset, spectral centroid (brightness) and the
    loss through a 700 Hz 2nd-order highpass (a phone speaker, WORKFLOW 2)."""
    m = x.mean(axis=1)
    out = {}
    for name, t0, t1 in segs:
        a = m[int(t0 * sr):int(t1 * sr)]
        if not len(a) or np.abs(a).max() < 1e-6:
            out[name] = None
            continue
        on = int(np.argmax(np.abs(a) > np.abs(a).max() * .05))
        b = a[on:on + int(.3 * sr)]
        P = np.abs(np.fft.rfft(a)) ** 2
        f = np.fft.rfftfreq(len(a), 1 / sr)
        hp = (f / 700) ** 4 / (1 + (f / 700) ** 4)
        out[name] = {'peak': round(db(np.abs(a).max()), 1), 'rms300': round(db(np.sqrt((b ** 2).mean())), 1),
                     'centroid_hz': int((P * f).sum() / (P.sum() + 1e-20)),
                     'phone_loss_db': round(float(-10 * np.log10((P * hp).sum() / (P.sum() + 1e-20))), 1),
                     'len_s': round(float((np.abs(a) > 10 ** (-60 / 20)).nonzero()[0][-1] / sr), 2)}
    return out


def write_wav(path, x, sr):
    pcm = np.clip(x, -1, 1)
    pcm = (pcm * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(sr); f.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--gain-db', type=float, default=0.0)
    ap.add_argument('--solo', default='', help='layers to hear alone, e.g. lead+pad (calibration)')
    ap.add_argument('--out', default=str(OUT))
    ap.add_argument('--timeout', type=int, default=900)
    a = ap.parse_args()
    out_dir = pathlib.Path(a.out); out_dir.mkdir(parents=True, exist_ok=True)
    done = threading.Event()
    report = {}
    rp = out_dir / 'report.json'
    if a.only and rp.exists():
        try: report = json.loads(rp.read_text(encoding='utf-8')).get('files', {})
        except Exception: report = {}
    g = 10 ** (a.gain_db / 20)

    class H(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args): pass
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store'); super().end_headers()
        def do_POST(self):
            body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            u = urllib.parse.urlparse(self.path)
            if u.path == '/__wav':
                meta = json.loads(urllib.parse.parse_qs(u.query)['meta'][0])
                x = np.frombuffer(body, dtype='<f4').reshape(-1, 2).astype(np.float64)
                name = meta['name']
                music = not (name.startswith('sfx_reel') or name.endswith('_dry'))
                game = analyze(x, meta['sr'], meta, music)
                y = x * g
                rep = analyze(y, meta['sr'], meta, music)
                rep['in_game_peak_dbfs'] = game['peak_dbfs']; rep['in_game_rms_dbfs'] = game['rms_dbfs']
                rep['switch_times'] = meta.get('switches'); rep['voices_max_per_s'] = meta.get('voicesMax')
                if meta.get('segs'):
                    rep['effects'] = seg_levels(x, meta['sr'], meta['segs'])
                    for k, v in rep['effects'].items():
                        if v:
                            print(f"   {k:10s} peak {v['peak']:6.1f}  rms300 {v['rms300']:6.1f}  centroid {v['centroid_hz']:5d} Hz  "
                                  f"phone loss {v['phone_loss_db']:5.1f} dB  len {v['len_s']}s", flush=True)
                write_wav(out_dir / (name.replace('+', '_') + '.wav'), y, meta['sr'])
                report[name] = rep
                print(f"{name:14s} peak {rep['peak_dbfs']:6.1f} dBFS  rms {rep['rms_dbfs']:6.1f}  (in game {game['peak_dbfs']:.1f} / {game['rms_dbfs']:.1f})  "
                      f"clip {rep['clipped_samples']}  gap {rep['longest_silence_s']}s  clicks {rep['clicks']}  voices/s<= {meta.get('voicesMax')}  ok={rep['ok']}", flush=True)
            elif u.path == '/__log':
                print(body.decode('utf-8', 'replace'), flush=True)
            elif u.path == '/__done':
                done.set()
            self.send_response(204); self.end_headers()

    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(H, directory=str(GAME)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_port}/tools/audio/render.html?i=0' + (f'&only={a.only}' if a.only else '') + (f'&solo={a.solo}' if a.solo else '') + f'&t={int(time.time())}'
    t0 = time.time()
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as prof:
        chrome = subprocess.Popen([browser(), '--headless=new', '--mute-audio', '--disable-background-timer-throttling',
                                   '--disable-renderer-backgrounding', f'--user-data-dir={prof}', url],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ok = done.wait(a.timeout)
        chrome.kill(); chrome.wait()
    srv.shutdown()
    rp.write_text(json.dumps({'gain_db': a.gain_db, 'files': report}, indent=1), encoding='utf-8')
    print(f'{"done" if ok else "TIMED OUT"} in {time.time() - t0:.0f}s -> {out_dir}')


if __name__ == '__main__':
    main()
