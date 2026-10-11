// ============================================================ audio (synthesised, no files)
// The v2 engine (SPEC_v2 9 + 13), merged in stage M; edit it here (src/audio/engine.js), then npm run sync.
/*AUDIO:BEGIN*/
// ============================================================ audio v2 (SPEC_v2 9 + 13; was audio/engine.js until the stage M merge)
// Everything is synthesised with WebAudio, no files. SPEC_v2 sections 9 + 13.
// Core interface: initAudio()  AC  tone/noise/glide (v1 signatures)  SFX.*  musicTick(dt)  musicWant(o)  musicDuck(sec)
//                 setMusicOn(b)  setSfxOn(b)  musicOn  sfxOn  ambWant(area, o)  MUSIC_DBG
// musicWant({ song, night, star, menu, area, shishi, shishiT }) every frame:
//   song  'title' | 'lobby' | 'onsen' | 'dining' | 'garden' | 'fest' | null (silence)
//   night 0..1 (dayLight().night), star 1..5, menu true while the pause menu is open,
//   area  AREAS id for the ambience bus (same as calling ambWant(area, o)),
//   shishi true once g_shishi is bought; shishiT = the clock the core animates shishiArt with: the knock sounds
//   whenever floor(shishiT / 20) changes; draw the fallen frame while (shishiT % 20) is in [0.3, 0.9).
// musicTick(dt) every frame. dt is only used without WebAudio (headless): the sequencer then runs "dry" so
// MUSIC_DBG still advances; with a real AudioContext the audio clock is used.
// The music never uses Math.random: every variation is a fixed table indexed by (pass, section, phrase).
// SFX.unlock / vip / gong / areaOpen duck the music themselves (musicDuck). M key: setMusicOn(x); setSfxOn(x) together.
// Effects (v2.0.1, feedback S1 "biubiubiu"): all of them go through one SFX bus (SFX_VOL, a notch under the music); the
// frequent ones (tests/bot_balance.js: meow ~30 / min, pop / bell / sweep / tick / coin 10-15 / min, bursts of 8-14 / s)
// are short low-mid sine / triangle with no upward slide, rate limited, and scaled down while many sound at once (_auBusy).
// This block also suspends AC while the page is hidden (the core's pagehide handler closes it; initAudio() rebuilds).
// Checks: audio/_preview.html (listen), audio/_render.py (offline WAV renders + level / click checks),
//         audio/_music_check.js (switch rate, voice budget, repeat distance), audio/_theory_check.js (no minor-2nd rubs).
let AC = null, NB = null, MB = null;
let musicOn = true, sfxOn = true;
(function _auPrefs() {   // separate keys 'music' / 'sfx'; an old v1 'mute = true' turns both off once
  try {
    if (typeof load !== 'function') return;
    let m = load('music', null), s = load('sfx', null);
    if (m === null || s === null) {
      const mu = !!load('mute', false);
      if (m === null) m = !mu;
      if (s === null) s = !mu;
      if (typeof save === 'function') { save('music', !!m); save('sfx', !!s); }
    }
    musicOn = !!m; sfxOn = !!s;
  } catch (e) {}
})();
const BGM_VOL = .05, AMB_VOL = .03, AU_LOOK = .3, AU_VMAX = 24, AU_MINGAP = 15;
const _auACtor = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
const MUSIC_DBG = { song: null, section: null, pass: 0, night: false, layers: [], voicesPerSec: 0, voicesMax: 0, sig: '', bar: 0, players: 0, switches: 0, amb: [], t: 0 };
let _auCtx = null, _auB = null, _auNo = 0;
const _auOffline = () => !!AC && typeof OfflineAudioContext !== 'undefined' && AC instanceof OfflineAudioContext;
function initAudio() {
  try {
    if (AC && AC.state === 'closed') AC = null;
    // a new context's clock starts at 0 (e.g. after pagehide closed the old one): _auBind() restarts every clock with it
    if (!AC && _auACtor) AC = new _auACtor();
    if (AC && AC !== _auCtx) _auBind();
    if (AC && !_auOffline() && AC.state !== 'running' && AC.state !== 'closed') { const pr = AC.resume(); if (pr && pr.catch) pr.catch(() => {}); }
  } catch (e) {}
}
function _auBind() {   // AC changed (first tap, bfcache return, or a test swapped in an OfflineAudioContext)
  _auCtx = AC; NB = null; MB = null; _auB = null; _auAB = null;
  _auPl.length = 0; _auVQ.length = 0; _auPend = null; _auSwT = -1e9; _auDuckEnd = 0;
  for (const k in _auAmb.lay) delete _auAmb.lay[k];
  for (const k in _auAmb.nx) delete _auAmb.nx[k];
  sfxCoinT = sfxPopT = sfxTickT = sfxTakeT = sfxSwapT = -1;
  for (const k in _auLast) delete _auLast[k];
  _auSB = null; _auK = 1; _auDen = 0; _auDenT = 0;
}
function _auNoise() {   // 2 s of white noise from a fixed xorshift seed (reproducible renders)
  if (!NB) {
    const n = AC.sampleRate * 2 | 0; NB = AC.createBuffer(1, n, AC.sampleRate);
    const a = NB.getChannelData(0); let s = 0x2545F491;
    for (let i = 0; i < n; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; a[i] = (s >>> 0) / 2147483648 - 1; }
  }
  return NB;
}
const _auNOff = () => (_auNo = (_auNo + .6180339887) % 1) * 1.7;
function _auBuses() {
  if (_auB) return _auB;
  const c = AC, mf = c.createBiquadFilter(), mm = c.createGain(), md = c.createGain(), ab = c.createGain();
  mf.type = 'lowpass'; mf.frequency.value = 18000; mf.Q.value = .7; mf.connect(c.destination);
  mm.connect(mf); md.connect(mm);
  MB = c.createGain(); MB.gain.value = 0; MB.connect(md);       // music bus (0.05)
  ab.gain.value = 0; ab.connect(md);                            // ambience bus AB (0.03)
  // shared echo for onsen / garden: 0.28 s, feedback .25, lowpass 2500 Hz in the loop, wet .25 (set on each player's send)
  const ein = c.createGain(), dl = c.createDelay(1), lp = c.createBiquadFilter(), fb = c.createGain();
  dl.delayTime.value = .28; lp.type = 'lowpass'; lp.frequency.value = 2500; fb.gain.value = .25;
  ein.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(MB);
  _auAB = ab;
  return (_auB = { mf, mm, md, ab, ein, vol: -1, amb: -1, menu: -1 });
}
let _auAB = null;
function _auLevels(now) {
  const b = _auBuses(), vol = musicOn ? BGM_VOL : 0, amb = musicOn ? AMB_VOL : 0, menu = _auW.menu ? 1 : 0;
  if (vol !== b.vol) { MB.gain.setTargetAtTime(vol, now, .15); b.vol = vol; }
  if (amb !== b.amb) { b.ab.gain.setTargetAtTime(amb, now, .15); b.amb = amb; }
  if (menu !== b.menu) {   // pause menu: half volume + 1200 Hz lowpass ("behind a paper door")
    b.mm.gain.setTargetAtTime(menu ? .5 : 1, now, .08); b.mf.frequency.setTargetAtTime(menu ? 1200 : 18000, now, .08); b.menu = menu;
  }
}
let _auDuckEnd = 0;
function musicDuck(sec) {   // music (and ambience) down to 60 %, back after sec
  try {
    if (!AC || !_auB) return;
    const now = AC.currentTime, g = _auB.md.gain;
    _auDuckEnd = Math.max(_auDuckEnd, now + (sec || 1));
    g.setTargetAtTime(.6, _auHold(g, now), .05); g.setTargetAtTime(1, _auDuckEnd, .25);
  } catch (e) {}
}
function setMusicOn(b) { musicOn = !!b; try { if (typeof save === 'function') save('music', musicOn); } catch (e) {} }
function setSfxOn(b) { sfxOn = !!b; try { if (typeof save === 'function') save('sfx', sfxOn); } catch (e) {} }

// ------------------------------------------------------------ v1 one-shot helpers (signatures unchanged)
// Every helper plays into the SFX bus (_auSfxBus: SFX_VOL, then a 7 kHz lowpass that takes the edge off) and starts from
// silence with a few ms ramp: no hard square-wave edge, and no one-sample spike when a delayed start falls between two
// samples (the gain was 1 until its first event). v is scaled by _auK (the busy-mix factor, 1 for everything but the
// frequent effects; reset after every SFX call).
const SFX_VOL = .72;
let _auSB = null, _auK = 1;
function _auSfxBus() {
  if (_auSB) return _auSB;
  const g = AC.createGain(), lp = AC.createBiquadFilter();
  g.gain.value = SFX_VOL; lp.type = 'lowpass'; lp.frequency.value = 7000; lp.Q.value = .5;
  g.connect(lp); lp.connect(AC.destination);
  return (_auSB = g);
}
function _auEnv(p, t, v, d, att) {   // gain param: 0 before t, up to v in att, exponential decay to silence at t + d
  p.value = 0; p.setValueAtTime(.0001, t); p.exponentialRampToValueAtTime(Math.max(.0002, v), t + (att || .004)); p.exponentialRampToValueAtTime(.0001, t + d);
}
function tone(f, d, type, v, f2, delay) {
  if (!AC || !sfxOn) return;
  try {
    if (AC !== _auCtx) _auBind();
    const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), gn = AC.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    _auEnv(gn.gain, t, (v || .06) * _auK, d);
    o.connect(gn); gn.connect(_auSfxBus()); o.start(t); o.stop(t + d + .03);
  } catch (e) {}
}
function noise(d, v, freq, delay, ft) {
  if (!AC || !sfxOn) return;
  try {
    if (AC !== _auCtx) _auBind();
    const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = _auNoise(); fl.type = ft || 'lowpass'; fl.frequency.value = freq || 1000;
    _auEnv(gn.gain, t, (v || .1) * _auK, d, .003);
    s.connect(fl); fl.connect(gn); gn.connect(_auSfxBus()); s.start(t, _auNOff()); s.stop(t + d + .03);
  } catch (e) {}
}
// pitch glide through several points (the guests' "meow"); lp (optional) = a lowpass in Hz
function glide(fs, ts, type, v, lp) {
  if (!AC || !sfxOn) return;
  try {
    if (AC !== _auCtx) _auBind();
    const t = AC.currentTime, o = AC.createOscillator(), gn = AC.createGain(), end = t + ts[ts.length - 1];
    o.type = type; o.frequency.setValueAtTime(fs[0], t); for (let i = 1; i < fs.length; i++) o.frequency.linearRampToValueAtTime(fs[i], t + ts[i]);
    v *= _auK; gn.gain.value = 0;
    gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(v, t + .03); gn.gain.setValueAtTime(v, end - .06); gn.gain.exponentialRampToValueAtTime(.0001, end + .06);
    let last = o;
    if (lp) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); last = fl; }
    last.connect(gn); gn.connect(_auSfxBus()); o.start(t); o.stop(end + .1);
  } catch (e) {}
}
// tone through a lowpass (soft horn) / filtered noise with a moving cutoff (paper door)
function _auTonF(f, d, type, v, f2, delay, lp) {
  if (!AC || !sfxOn) return;
  try {
    if (AC !== _auCtx) _auBind();
    const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    fl.type = 'lowpass'; fl.frequency.value = lp;
    _auEnv(gn.gain, t, v * _auK, d, .012);
    o.connect(fl); fl.connect(gn); gn.connect(_auSfxBus()); o.start(t); o.stop(t + d + .03);
  } catch (e) {}
}
function _auSweep(d, v, f0, f1, delay, ft) {
  if (!AC || !sfxOn) return;
  try {
    if (AC !== _auCtx) _auBind();
    const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = _auNoise(); fl.type = ft || 'lowpass'; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d);
    gn.gain.value = 0; gn.gain.setValueAtTime(.0001, t); gn.gain.linearRampToValueAtTime(v * _auK, t + d * .35); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl); fl.connect(gn); gn.connect(_auSfxBus()); s.start(t, _auNOff()); s.stop(t + d + .03);
  } catch (e) {}
}
function _auChirp(delay, v) {   // one small bird: 2-3 quick upward slides
  for (let i = 0; i < 3; i++) tone(2600 + i * 120, .07, 'sine', v * (1 - i * .2), 3400 + i * 150, delay + i * .11);
}

// rate limits: the v1 names for coin / pop / tick / take / swap (tests read them), _auLast for the rest; all restart with
// a new AudioContext (_auBind)
let sfxCoinT = -1, sfxPopT = -1, sfxTickT = -1, sfxTakeT = -1, sfxSwapT = -1;
const actx = () => AC ? AC.currentTime : 0;
const _auLast = {};
let _auDen = 0, _auDenT = 0, _auN = 0;
function _auGap(k, gap) { const now = actx(), l = _auLast[k]; if (l !== undefined && now - l < gap) return false; _auLast[k] = now; return true; }
// busy mix: a decaying count (0.8 s) of the frequent effects; past 2 at once each new one is scaled by sqrt(2 / n)
function _auBusy() {
  const now = actx(); _auDen = _auDen * Math.exp(-Math.max(0, now - _auDenT) / .8) + 1; _auDenT = now;
  _auK = _auDen > 2 ? Math.sqrt(2 / _auDen) : 1;
}
const SFX = {
  // ---- v1 names. Frequent ones softened in v2.0.1 (S1): no square waves, no upward slides, short and quiet
  click() { tone(560, .04, 'triangle', .036, 500); },
  coin(n) {   // a fish pile picked up: a soft sine ding; quick pick-ups climb a pentatonic step each (4 steps at most)
    if (actx() - sfxCoinT < .08) return; sfxCoinT = actx(); _auBusy();
    const f = 784 * Math.pow(2, [0, 2, 4, 7, 9][Math.max(0, Math.min(n | 0, 4))] / 12);
    tone(f, .16, 'sine', .026); tone(f * 2, .07, 'sine', .005);
  },
  tick(p) {   // fish poured into a price pad (10 a second while you stand on it): a soft wooden patter, two alternating
    if (actx() - sfxTickT < .1) return; sfxTickT = actx();   // pitches that rise only ~3 semitones over the whole price
    tone((820 + (p || 0) * 160) * (++_auN & 1 ? 1 : 1.06), .03, 'triangle', .019);
  },
  unlock() {
    musicDuck(1.2);
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .28, 'triangle', .045, 0, i * .07));
    [2093, 2637, 3136, 2349, 2794].forEach((f, i) => tone(f, .7, 'sine', .012, 0, .4 + i * .08));
  },
  bell() {   // a guest at the desk (~13 a minute): a small, lower desk bell
    if (!_auGap('bell', .5)) return; _auBusy();
    tone(1319, .6, 'sine', .026); tone(1319 * 2.76, .18, 'sine', .004);
  },
  sweep() { if (!_auGap('sweep', .3)) return; _auBusy(); noise(.16, .026, 1800, 0, 'bandpass'); noise(.14, .018, 2600, .09, 'bandpass'); },
  pop() {   // towels stacked / handed over, a tray item set down (bursts of 8-10 a second): a soft cloth tap
    if (actx() - sfxPopT < .09) return; sfxPopT = actx(); _auBusy();
    tone(700, .055, 'triangle', .032, 600); noise(.035, .016, 1400, 0, 'lowpass');
  },
  splash() { if (!_auGap('splash', .3)) return; _auBusy(); noise(.45, .05, 800); noise(.25, .022, 1500, .06); },
  milk() { if (!_auGap('milk', .3)) return; _auBusy(); tone(520, .09, 'triangle', .022, 400); tone(480, .09, 'triangle', .02, 370, .15); },
  meow() {   // every guest, anywhere (~30 a minute): short and soft, a small rise and fall, four voices in turn
    if (!_auGap('meow', .45)) return; _auBusy();
    const k = [1, 1.08, .93, 1.04][++_auN & 3];
    glide([560 * k, 640 * k, 470 * k], [0, .08, .24], 'triangle', .014, 1400);
  },
  hmph() { _auTonF(180, .28, 'sawtooth', .03, 120, 0, 900); noise(.14, .02, 600); },
  // ---- v2 (SPEC 9.5)
  ring() { if (!_auGap('ring', .4)) return; _auBusy(); [0, .1].forEach((d, i) => { tone(1568, .32, 'sine', i ? .016 : .02, 0, d); tone(2349, .2, 'sine', i ? .005 : .007, 0, d); }); },
  take() { if (actx() - sfxTakeT < .08) return; sfxTakeT = actx(); _auBusy(); noise(.03, .05, 1500, 0, 'bandpass'); tone(660, .045, 'triangle', .028, 600); },
  serve() { _auBusy(); tone(1568, .28, 'sine', .024); tone(2349, .18, 'sine', .008); },
  eat() { if (!_auGap('eat', .3)) return; _auBusy(); tone(480, .1, 'triangle', .02, 380); tone(460, .1, 'triangle', .018, 360, .16); },
  cook() { if (!_auGap('cook', .2)) return; _auBusy(); noise(.025, .035, 2200, 0, 'bandpass'); tone(1000, .03, 'triangle', .012); noise(.1, .012, 3200, .03, 'bandpass'); },
  vip() {
    musicDuck(1.2);
    [1319, 1568, 2093].forEach((f, i) => { tone(f, .8, 'sine', .032, 0, i * .12); tone(f * 2, .3, 'sine', .005, 0, i * .12); });
  },
  shutter() { noise(.015, .05, 4000, 0, 'highpass'); noise(.03, .04, 2000, .06, 'bandpass'); },   // no flash, ever
  gong() {
    musicDuck(1.5);
    tone(392, 1.6, 'sine', .032); tone(588, 1.4, 'sine', .017); tone(784, 1.2, 'sine', .011); tone(395, 1.6, 'sine', .009);
    tone(2093, .9, 'sine', .012, 0, .06); tone(3136, .5, 'sine', .005, 0, .06);
  },
  swap() { if (actx() - sfxSwapT < .05) return; sfxSwapT = actx(); tone(560, .07, 'triangle', .032, 440); },
  tryon() { noise(.09, .03, 1200); tone(660, .12, 'sine', .024, 880); },
  levelup() { [784, 988, 1319].forEach((f, i) => tone(f, i === 2 ? .3 : .14, 'triangle', .04, 0, i * .08)); },
  rankup() { [523, 659, 784].forEach((f, i) => _auTonF(f, i === 2 ? .32 : .13, 'square', .02, 0, i * .1, 2000)); },
  dawn() { _auChirp(0, .024); _auChirp(.42, .02); },
  dusk() {   // distant temple bell
    tone(110, 3, 'sine', .03); tone(220, 2.6, 'sine', .02); tone(330, 2.2, 'sine', .012); tone(221.6, 2.8, 'sine', .008);
    noise(.05, .01, 600, 0, 'bandpass');
  },
  areaOpen() {
    musicDuck(1.5);
    [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, .28, 'triangle', .04, 0, i * .07));
    [4186, 3520, 3951, 3136, 4699, 3729].forEach((f, i) => tone(f, .9, 'sine', .008, 0, .42 + i * .09));   // wind chimes
  },
  menu(open) { _auSweep(.14, .05, open ? 600 : 1100, open ? 1100 : 600, 0, 'lowpass'); },
  page() { noise(.04, .024, 1800, 0, 'bandpass'); tone(620, .04, 'triangle', .03, 560); },   // paper + a soft tap
  coinBig() { SFX.coin(4); for (let i = 0; i < 4; i++) noise(.05, .02 - i * .003, 2200, .05 + i * .04, 'bandpass'); },
  // small extras for the pets (SPEC 4.11)
  quack() { _auTonF(560, .1, 'sawtooth', .03, 430, 0, 1500); noise(.08, .02, 900, 0, 'bandpass'); _auTonF(530, .09, 'sawtooth', .025, 420, .13, 1500); },
  woof() { tone(330, .12, 'triangle', .05, 200); noise(.07, .02, 700, 0, 'bandpass'); },
};
// _auK applies to the call that set it only (a rare effect right after a busy one plays at full level)
for (const k of Object.keys(SFX)) { const f = SFX[k]; SFX[k] = function (a) { _auK = 1; try { return f.call(SFX, a); } finally { _auK = 1; } }; }

// ------------------------------------------------------------ songs (SPEC 9.2; data as written there)
// degree = index into the 5-note scale, +5 = one octave; null = rest; lengths in eighth notes; every motif = 2 bars
const SONGS = {};
SONGS.lobby = {   // lobby / main house / west wing / front / shop. A = the v1 tune (half a pass since v2.0: A B A2 B2, 18.2)
  bpm: 76, beat: 4, scale: ['D4', 'E4', 'G4', 'A4', 'B4'],
  form: ['A', 'B', 'A2', 'B2'],
  chords: { A: ['D', 'Bm7', 'G', 'A', 'D', 'G', 'Em7', 'D'],
            B: ['G', 'A', 'F#m7', 'Bm7', 'Em7', 'G', 'Asus4', 'A'] },
  phr: { A: ['m1', 'm1b', 'm2', 'cad'], B: ['b1', 'b2', 'b3', 'bcad'] },
  mot: {
    m1: [[3, 2], [4, 1], [3, 1], [2, 2], [1, 2], [0, 2], [1, 1], [2, 1], [3, 4]],
    m1b: [[4, 2], [3, 1], [2, 1], [1, 2], [2, 2], [3, 8]],
    m2: [[5, 2], [4, 1], [3, 1], [4, 2], [3, 2], [2, 2], [1, 1], [2, 1], [3, 4]],
    cad: [[1, 2], [2, 1], [1, 1], [0, 2], [1, 2], [0, 8]],
    b1: [[5, 2], [6, 2], [7, 3], [6, 1], [5, 2], [4, 2], [3, 4]],
    b2: [[4, 2], [5, 1], [4, 1], [3, 2], [2, 2], [3, 4], [null, 4]],
    b3: [[2, 1], [3, 1], [4, 2], [5, 2], [4, 2], [3, 2], [2, 2], [1, 4]],
    bcad: [[1, 2], [2, 2], [3, 2], [1, 2], [0, 8]] },
  lead: 'koto', counter: 'flute', perc: 'woodblock',
};
SONGS.onsen = {   // onsen / star bath: 3/4, slow, echo
  bpm: 72, beat: 3, scale: ['G4', 'A4', 'C5', 'D5', 'E5'],
  form: ['A', 'B', 'A2', 'B2'],
  chords: { A: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D'], B: ['C', 'D', 'Bm', 'Em', 'C', 'G', 'Am7', 'D'] },
  phr: { A: ['o1', 'o2', 'o1', 'ocad'], B: ['o3', 'o2', 'o3', 'ocad'] },
  mot: { o1: [[4, 3], [3, 1], [2, 2], [3, 3], [1, 3]], o2: [[2, 2], [3, 1], [4, 3], [5, 6]],
         o3: [[5, 3], [4, 1], [3, 2], [2, 2], [1, 2], [2, 2]], ocad: [[1, 3], [0, 9]] },
  lead: 'koto', counter: 'flute', perc: null, echo: true,
};
SONGS.dining = {  // dining hall: light, shamisen
  bpm: 100, beat: 4, scale: ['A4', 'B4', 'C#5', 'E5', 'F#5'],
  form: ['A', 'A2', 'B', 'A3'],
  chords: { A: ['A', 'F#m', 'D', 'E', 'A', 'F#m', 'Bm', 'E'], B: ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'] },
  phr: { A: ['d1', 'd2', 'd1', 'dcad'], B: ['d3', 'd2', 'd3', 'dcad'] },
  mot: { d1: [[0, 1], [2, 1], [3, 1], [4, 1], [3, 2], [2, 2], [0, 1], [1, 1], [2, 2], [0, 4]],
         d2: [[5, 1], [4, 1], [3, 1], [2, 1], [3, 2], [4, 2], [5, 2], [3, 2], [null, 4]],
         d3: [[2, 1], [2, 1], [3, 2], [4, 1], [4, 1], [5, 2], [4, 1], [3, 1], [2, 2], [null, 4]],
         dcad: [[3, 2], [2, 2], [1, 2], [2, 2], [0, 8]] },
  lead: 'shamisen', counter: 'flute', perc: 'woodblock-offbeat',
};
SONGS.garden = {  // garden / cottages / suites: shakuhachi, open
  bpm: 76, beat: 4, scale: ['E4', 'G4', 'A4', 'B4', 'D5'],
  form: ['A', 'B', 'A2', 'B2'],
  chords: { A: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'Bm'], B: ['Am', 'Em', 'C', 'G', 'Am', 'Em', 'C', 'D'] },
  phr: { A: ['g1', 'g2', 'g1', 'gcad'], B: ['g3', 'g2', 'g3', 'gcad'] },
  mot: { g1: [[0, 4], [1, 2], [2, 2], [3, 6], [2, 2]], g2: [[4, 3], [3, 1], [2, 4], [1, 2], [0, 6]],
         g3: [[5, 4], [4, 2], [3, 2], [4, 4], [null, 4]], gcad: [[2, 2], [1, 2], [0, 12]] },
  lead: 'shakuhachi', counter: 'koto-arp', perc: null, echo: true,
};
SONGS.fest = {    // star-5 celebration panel (v2.1 festivals)
  bpm: 112, beat: 4, scale: ['D4', 'E4', 'F#4', 'A4', 'B4'],
  form: ['A', 'A2', 'B', 'A3'],
  chords: { A: ['D', 'D', 'G', 'A', 'D', 'Bm', 'G', 'A'], B: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D'] },
  phr: { A: ['f1', 'f2', 'f1', 'f2'], B: ['f2', 'f1', 'f2', 'f1'] },
  mot: { f1: [[3, 1], [3, 1], [4, 1], [3, 1], [2, 2], [0, 2], [1, 1], [2, 1], [3, 2], [3, 4]],
         f2: [[5, 2], [4, 1], [3, 1], [4, 2], [3, 2], [2, 1], [1, 1], [0, 2], [null, 4]] },
  lead: 'fue', counter: 'shamisen', perc: 'taiko', taiko: 'D.D.DdD.|D.dDD.d.',   // D = don, d = small hit, . = rest
};
SONGS.title = { base: 'lobby', sections: ['A'], bpm: 72, layers: ['lead', 'pad'] };

// Deterministic variation (SPEC 9.3). Row = pass % 4, one letter per phrase:
//  '.' V0 as written   'o' V1 ornament (2-eighth notes -> note + upper neighbour)   's' V2 phrase up one degree (never the cadence)
//  'p' V4 sparse (off-beat notes dropped)   trailing 'e' = V3 echo: the counter re-sings each phrase's last two notes an octave up
// Odd passes (2nd, 4th) also swap lead and counter instruments (star 3+). floor(pass / 4) % 3 picks one of three
// accompaniment colours (bass figure, pad voicing, arpeggio shape), so a song needs 12 passes to repeat exactly.
const _auVAR = {
  A: ['....', '..o.', '....e', '.s..'],
  A2: ['oo..', '....e', 'oos.', '..oo'],
  A3: ['..s.e', 's...e', 'o.s.e', 'pp..e'],
  B: ['....', '.o.o', 'pppp', 'o...e'],
  B2: ['..s.e', 'o...e', '.os.e', 'pp..e'],
};
const _auPLUCK = { koto: 1, shamisen: 1 };
const _auSHIFT = { musicbox: 5, fue: 5 };                                       // these sing an octave up
const _auREG = { flute: [5, 9], fue: [6, 10], shakuhachi: [3, 7] };           // answer-phrase range (degrees)
const _auTRIM = { koto: 1, shamisen: 1, flute: .47, shakuhachi: .47, fue: .44, musicbox: .85, glock: 1,   // equal loudness as melody (measured)
  wood: 2.5, pon: 2.5, taiko: .75, taikoS: 1, rin: .75 };
const _auSGAIN = { lobby: 1, onsen: 1, dining: 1, garden: 1, fest: .9, title: 1.15 };   // measured: every song's tune within 1 LU

// ------------------------------------------------------------ tiny theory: note names, chords, scale degrees
const _auPC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const _auAcc = a => a === '#' ? 1 : a === 'b' ? -1 : 0;
function _auMidi(n) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); return 12 * (+m[3] + 1) + _auPC[m[1]] + _auAcc(m[2]); }
const _auSUF = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], sus4: [0, 5, 7] };
function _auChord(name) {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name), root = (_auPC[m[1]] + _auAcc(m[2]) + 12) % 12, iv = _auSUF[m[3]] || _auSUF[''];
  return { name, root, iv, pcs: iv.map(i => (root + i) % 12), fifth: (root + 7) % 12 };
}
const _auHz = m => 440 * Math.pow(2, (m - 69) / 12);
const _auIn = (pc, lo) => lo + (((pc - lo) % 12) + 12) % 12;              // midi with pitch class pc in [lo, lo + 12)
function _auDeg(sd, d) { const o = Math.floor(d / 5); return sd.sm[d - 5 * o] + 12 * o; }
const _auInCh = (sd, d, ch) => ch.pcs.indexOf(_auDeg(sd, d) % 12) >= 0;
function _auH(a, b, c) { let h = (a * 374761393 + b * 668265263 + c * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
const _auSC = {};
function _auSong(id) {
  if (_auSC[id]) return _auSC[id];
  const src = SONGS[id], b = src.base ? SONGS[src.base] : src, sd = Object.assign({}, b);
  if (src.base) { sd.form = src.sections; sd.bpm = src.bpm; sd.fix = src.layers; sd.echo = false; }
  sd.id = id; sd.bar8 = sd.beat * 2; sd.sm = sd.scale.map(_auMidi);
  sd.ch = { A: b.chords.A.map(_auChord), B: b.chords.B.map(_auChord) };
  sd.cnt = (sd.counter || 'flute').replace('-arp', '');
  return (_auSC[id] = sd);
}
function _auSnap(sd, d, ch) {   // nearest scale degree that is a chord tone (ties go down)
  if (_auInCh(sd, d, ch)) return d;
  const m0 = _auDeg(sd, d); let best = d, bd = 99;
  for (let x = d - 3; x <= d + 3; x++) if (_auInCh(sd, x, ch)) { const dist = Math.abs(_auDeg(sd, x) - m0); if (dist < bd) { bd = dist; best = x; } }
  return best;
}
function _auNear(sd, ch, t, lo, hi, up) {   // chord tone of the scale in [lo, hi] closest to degree t
  let best = null, bd = 1e9;
  for (let d = lo; d <= hi; d++) {
    if (!_auInCh(sd, d, ch)) continue;
    const dist = Math.abs(d - t) * 2 + (d === t ? 0 : (d > t) === up ? 0 : 1);
    if (dist < bd) { bd = dist; best = d; }
  }
  return best === null ? Math.max(lo, Math.min(hi, t)) : best;
}

// melody of one section after the variation table; notes: { s (eighth in section), d, l, ph }
function _auMel(sd, name, k) {
  const base = name[0], row = (_auVAR[name] || _auVAR[base])[k], B = sd.bar8, out = [];
  sd.phr[base].forEach((mn, pi) => {
    const c = row[pi], cad = pi === 3;
    let ns = sd.mot[mn].map(([d, l]) => ({ d, l }));
    if (c === 'o') ns = ns.reduce((a, n) => a.concat(n.d !== null && n.l === 2 ? [{ d: n.d, l: 1 }, { d: n.d + 1, l: 1 }] : [n]), []);
    if (c === 's' && !cad) ns = ns.map(n => ({ d: n.d === null ? null : n.d + 1, l: n.l }));
    let s = pi * 2 * B; const ph = [];
    for (const n of ns) { ph.push({ s, d: n.d, l: n.l, ph: pi }); s += n.l; }
    if (c === 'p') for (let i = ph.length - 1; i > 0; i--) if (ph[i].s % 2 === 1 && ph[i].d !== null) { ph[i - 1].l += ph[i].l; ph.splice(i, 1); }
    // varied phrases stick to the chord: a bar's first note that left the chord moves to the nearest chord tone
    if (c !== '.') for (const n of ph) if (n.d !== null && n.s % B === 0) n.d = _auSnap(sd, n.d, sd.ch[base][Math.floor(n.s / B) % 8]);
    out.push(...ph);
  });
  return { notes: out, echo: row.indexOf('e') >= 0 };
}
function _auThin(sd, ph) {   // night: only beats 1 and 3 and the phrase's last note; each rings until the next
  const B = sd.bar8, ns = ph.filter(n => n.d !== null), last = ns[ns.length - 1], end = ph.length ? ph[ph.length - 1].s + ph[ph.length - 1].l : 0;
  const keep = ns.filter(n => n.s % B === 0 || n.s % B === 4 || n === last);
  return keep.map((n, i) => ({ s: n.s, d: n.d, l: (i + 1 < keep.length ? keep[i + 1].s : end) - n.s, ph: n.ph }));
}
function _auHole(sd, ph, min) {   // the last long note / rest of a phrase: where the answer goes
  let h = null; for (const n of ph) if (n.l >= min) h = n;
  if (!h) return null;
  const s = h.s + (h.d === null ? 0 : 2);
  return { s, A: h.s + h.l - s };
}
function _auFill(sd, base, all, pi, inst, cc, st) {   // counter answers in the melody's holes (winds)
  const B = sd.bar8, ph = all.filter(n => n.ph === pi), rg = _auREG[inst] || [5, 9], lo = rg[0], hi = rg[1];
  const h = _auHole(sd, ph, B === 6 ? 3 : 4);
  if (!h || h.A < 2) return [];
  const chs = sd.ch[base], ch = chs[Math.floor(h.s / B) % 8];
  if (st.prev === undefined) st.prev = lo + 2;
  const n1 = _auNear(sd, ch, st.prev, lo, hi, ((pi + cc) & 1) === 0);
  if (h.A < 4) { st.prev = n1; return [{ s: h.s, d: n1, l: h.A }]; }
  const n3 = _auNear(sd, chs[Math.floor((h.s + 2) / B) % 8], n1 - 2, lo - 2, hi, false);
  st.prev = n3;
  if (cc === 1 || n3 >= n1 - 1) return [{ s: h.s, d: n1, l: 2 }, { s: h.s + 2, d: n3, l: h.A - 2 }];
  return [{ s: h.s, d: n1, l: 1 }, { s: h.s + 1, d: n1 - 1, l: 1 }, { s: h.s + 2, d: n3, l: h.A - 2 }];
}
function _auEcho(sd, all, pi) {   // V3: the phrase's last two notes, an octave up, in its last hole
  const ph = all.filter(n => n.ph === pi), mel = ph.filter(n => n.d !== null), h = _auHole(sd, ph.slice(-1), 1);
  if (mel.length < 2 || !h || h.A < 2) return [];
  return [{ s: h.s, d: mel[mel.length - 2].d + 5, l: 1 }, { s: h.s + 1, d: mel[mel.length - 1].d + 5, l: h.A - 1 }];
}
// Accompaniment never rubs against the tune: per bar, a chord tone a semitone away from any melody / counter
// pitch class sounding in that bar is left out (pentatonic tunes + filtered chords = no minor seconds anywhere).
function _auBarPcs(E, B, ys) {
  const r = []; for (let b = 0; b < 8; b++) r.push({});
  for (const e of E) if (ys.indexOf(e.y) >= 0 && typeof e.m === 'number') {
    const b1 = Math.min(7, Math.floor((e.s + Math.max(1, e.l) - 1) / B));
    for (let b = Math.floor(e.s / B); b <= b1; b++) r[b][e.m % 12] = 1;
  }
  return r;
}
function _auSafe(sd, ch, set) {   // usable pitch classes of a chord in one bar, root first when it is usable
  const bad1 = pc => set[(pc + 1) % 12], bad2 = pc => bad1(pc) || set[(pc + 11) % 12];
  let t = ch.pcs.filter(pc => !bad2(pc));
  if (t.length < 2) t = ch.pcs.filter(pc => !bad1(pc));
  if (t.length < 2) for (const iv of [7, 2, 9]) {   // still thin: borrow open scale tones (fifth, ninth, sixth)
    const pc = (ch.root + iv) % 12;
    if (t.length < 2 && t.indexOf(pc) < 0 && !bad1(pc) && sd.sm.some(m => m % 12 === pc)) t.push(pc);
  }
  if (!t.length) t = [ch.root];
  return t;
}
function _auStack(pcs, lo) {   // first pitch class in [lo, lo + 12), the rest stacked above it
  const out = [_auIn(pcs[0], lo)];
  for (let i = 1; i < pcs.length; i++) out.push(_auIn(pcs[i], out[i - 1] + 1));
  return out;
}
function _auArp(sd, base, pi, inst, cc, slow, safe) {   // broken chords (plucked counter), 2 bars
  const B = sd.bar8, lo = inst === 'shamisen' ? 52 : 50, out = [];
  const pat = slow ? (B === 6 ? [[0, 0, 6]] : [[0, 0, 4], [4, 2, 4]])
    : B === 6 ? (cc === 1 ? [[0, 0, 2], [2, 2, 2], [4, 1, 2]] : [[0, 0, 2], [2, 1, 2], [4, 2, 2]])
    : cc === 1 ? [[0, 0, 2], [2, 2, 2], [4, 1, 2], [6, 3, 2]] : cc === 2 ? [[0, 0, 3], [3, 1, 1], [4, 2, 2], [6, 3, 2]]
    : [[0, 0, 2], [2, 1, 2], [4, 2, 2], [6, 3, 2]];
  for (let b = 2 * pi; b < 2 * pi + 2; b++) {
    const st = _auStack(safe[b], lo), t = st.concat(st.map(m => m + 12));
    for (const [p, i, l] of pat) out.push({ s: b * B + p, m: t[i], l, v: p === 0 ? 1 : .8 });
  }
  return out;
}
function _auLong(sd, base, pi, st) {   // night counter for winds: one soft long tone per bar
  const B = sd.bar8, out = [];
  for (let b = 2 * pi; b < 2 * pi + 2; b++) {
    const d = _auNear(sd, sd.ch[base][b], st.prev === undefined ? 5 : st.prev, 3, 7, (b & 1) === 0);
    st.prev = d; out.push({ s: b * B, d, l: B });
  }
  return out;
}
function _auPadV(pcs, cc, night) {
  let p = pcs.slice(0, 3);
  if (cc === 1 && p.length > 2) p = [p[1], p[2], p[0]];        // inversion
  let v = _auStack(p, 50);
  if (cc === 2 && v.length > 2) v = [v[0], v[2], v[1] + 12];  // open voicing
  if (night) {   // an octave down where that stays above the bass (D3), two voices, darker filter (padN)
    v = v.map(m => m - 12 < 50 ? m : m - 12).sort((a, b) => a - b).filter((m, i, a) => i === 0 || m !== a[i - 1]);
    if (v.length > 2) v = v.slice(1);
  }
  return v;
}
// One section -> events per eighth step. Pure function (no AudioContext), cached.
const _auCC = {}; let _auCCn = 0;
function _auCompile(id, si, pass, night, star) {
  const sd = _auSong(id), fixed = !!sd.fix, isN = !!night && !fixed && id !== 'fest';
  star = fixed ? 0 : Math.max(1, Math.min(5, star | 0 || 1));
  const key = id + '|' + si + '|' + (pass % 12) + '|' + (isN ? 1 : 0) + '|' + star;
  if (_auCC[key]) return Object.assign({}, _auCC[key], { pass });
  if (++_auCCn > 300) { for (const k in _auCC) delete _auCC[k]; _auCCn = 0; }   // keep memory small on long sessions
  const name = sd.form[si], base = name[0], B = sd.bar8, LEN = 8 * B, k = pass % 4, cc = Math.floor(pass / 4) % 3;
  const L = fixed ? { lead: 1, pad: 1 } : { lead: 1, bass: 1, pad: star >= 2, counter: star >= 3, perc: star >= 4 && !isN, sparkle: star >= 5, star: isN };
  const chords = sd.ch[base], E = [];
  const add = (s, i, m, l, v, y) => { if (s >= 0 && s < LEN) E.push({ s, i, m, l, v, y }); };
  const mel = _auMel(sd, name, k), leadI = sd.lead, cntI = sd.cnt, swap = !!L.counter && !isN && (k & 1) === 1;
  const callResp = name === 'A3' || name === 'B2', inst = [];
  // 1) the tune
  for (let pi = 0; pi < 4; pi++) {
    let useC = base === 'B';
    if (callResp) useC = (pi & 1) === 1;
    if (swap) useC = !useC;
    const mi = isN ? 'musicbox' : L.counter && useC ? cntI : leadI;
    inst.push(mi === leadI ? cntI : leadI);
    let ph = mel.notes.filter(n => n.ph === pi);
    if (isN) ph = _auThin(sd, ph);
    const sh = _auSHIFT[mi] || 0;
    for (const n of ph) if (n.d !== null) add(n.s, mi, _auDeg(sd, n.d + sh), n.l, .8, 'lead');
  }
  let bp = _auBarPcs(E, B, ['lead']), safe = chords.map((ch, b) => _auSafe(sd, ch, bp[b]));
  // 2) the counter line: answers / echoes (winds, pentatonic) or broken chords (plucked, filtered)
  if (L.counter) {
    const st = {}, stN = {};
    for (let pi = 0; pi < 4; pi++) {
      const oi = inst[pi];
      let ns;
      if (isN) ns = (_auPLUCK[cntI] ? _auArp(sd, base, pi, cntI, cc, true, safe) : _auLong(sd, base, pi, stN)).map(n => Object.assign(n, { i: cntI, v: .3 * (n.v || 1) }));
      else ns = (mel.echo ? _auEcho(sd, mel.notes, pi) : _auPLUCK[oi] ? _auArp(sd, base, pi, oi, cc, false, safe).map(n => Object.assign(n, { v: 1.4 * n.v })) : _auFill(sd, base, mel.notes, pi, oi, cc, st).map(n => Object.assign(n, { v: .85 }))).map(n => Object.assign(n, { i: oi, v: .5 * (n.v || 1) }));
      for (const n of ns) { let m = n.m !== undefined ? n.m : _auDeg(sd, n.d); if (m > (_auPLUCK[n.i] ? 81 : 88)) m -= 12; add(n.s, n.i, m, n.l, n.v, 'counter'); }   // never shrill
    }
    bp = _auBarPcs(E, B, ['lead', 'counter']); safe = chords.map((ch, b) => _auSafe(sd, ch, bp[b]));
  }
  // 3) bass: the root (or the lowest safe chord tone) + the koto answering it, as in v1
  if (L.bass) {
    const busy = id === 'dining' || id === 'fest';
    for (let b = 0; b < 8; b++) {
      const ch = chords[b], s = b * B, nv = isN ? .7 : 1;
      const pcs = bp[b][(ch.root + 1) % 12] ? safe[b] : [ch.root].concat(safe[b].filter(pc => pc !== ch.root));
      const t = _auStack(pcs, 45), third = t.length > 1 ? t[1] : t[0] + 12;
      const fifth = pcs.indexOf(ch.fifth) >= 0 ? _auIn(ch.fifth, t[0] + 1) : third;
      add(s, busy ? 'bass5' : 'bass', t[0], B, (busy ? .45 : .3) * (isN ? .75 : 1), 'bass');   // sustained bass: measured, .3 sits ~6 LU under the tune
      if (busy) { add(s + 4, 'bass5', fifth, 2, .3, 'bass'); add(s, 'koto', t[0] + 12, 2, .22 * nv, 'bass'); continue; }
      const pl = id === 'garden' ? [[0, t[0] + 12, .25]]
        : cc === 1 ? [[0, t[0] + 12, .3], [3, third + 12, .16], [6, fifth + 12, .14]]
        : cc === 2 ? [[0, fifth + 12, .22], [2, t[0] + 12, .18], [4, third + 12, .15]]
        : [[0, t[0] + 12, .3], [4, fifth + 12, .2]];
      for (const [p, m, v] of pl) if (p < B) add(s + p, 'koto', m, 2, v * nv, 'bass');
    }
  }
  if (L.pad) {
    for (let b = 0; b < 8;) {
      let e = b + 1; while (e < 8 && chords[e].name === chords[b].name && safe[e].join() === safe[b].join()) e++;
      add(b * B, isN ? 'padN' : 'pad', _auPadV(safe[b], cc, isN), (e - b) * B, isN ? .085 : .095, 'pad');
      b = e;
    }
  }
  if (L.perc) {
    const pk = sd.perc || 'rin';   // songs without percussion get a soft rin bell every 4 bars instead
    for (let b = 0; b < 8; b++) {
      const s = b * B;
      if (pk === 'woodblock') { add(s + 2, 'wood', 0, 1, .25, 'perc'); add(s + 6, 'wood', 0, 1, .2, 'perc'); if (!(b & 1)) add(s, 'pon', 0, 1, .25, 'perc'); }
      else if (pk === 'woodblock-offbeat') { [1, 3, 5, 7].forEach((p, j) => add(s + p, 'wood', 0, 1, j & 1 ? .24 : .14, 'perc')); if (!(b & 1)) add(s, 'pon', 0, 1, .25, 'perc'); }
      else if (pk === 'taiko') { const pat = sd.taiko.split('|')[b & 1]; for (let j = 0; j < 8; j++) if (pat[j] !== '.') add(s + j, pat[j] === 'D' ? 'taiko' : 'taikoS', 0, 1, .25, 'perc'); }
      else if (!(b & 3)) { const both = safe[b].filter(pc => safe[b + 1].indexOf(pc) >= 0); add(s, 'rin', _auIn((both.length ? both : safe[b])[0], 88), B, .25, 'perc'); }
    }
  }
  if (L.sparkle) {   // last bar of the section: the glockenspiel rolls the chord
    const t = _auStack(safe[7], 62), pos = B === 8 ? [2, 3, 4, 6] : [2, 3, 4];
    pos.forEach((p, j) => add(7 * B + p, 'glock', t[j % t.length] + 12 * Math.floor(j / t.length), 2, .2, 'sparkle'));
  }
  if (L.star) for (const b of [1, 5]) {   // night: a high fifth "star" every 4 bars
    const ok = safe[b].filter(pc => safe[b + 1].indexOf(pc) >= 0), pool = ok.length ? ok : safe[b];
    add(b * B + 4, 'star', _auIn(pool.indexOf(chords[b].fifth) >= 0 ? chords[b].fifth : pool[0], 76), B, .2, 'star');
  }
  const at = [];
  for (const e of E) { e.n = Array.isArray(e.m) ? e.m.length : 1; (at[e.s] || (at[e.s] = [])).push(e); }
  const layers = Object.keys(L).filter(x => L[x]);
  const sec = { id, si, name, len: LEN, bar8: B, dt: 60 / sd.bpm / 2 / (isN ? .88 : 1), at, ev: E, layers, night: isN, k, cc, pass,
    sig: [id, name, k + '.' + cc, isN ? 'n' : 'd', layers.join('+')].join('|') };
  return (_auCC[key] = sec);
}

// ------------------------------------------------------------ instruments (SPEC 9.2 recipes)
function _auNz(out, t, d, v, f, ft, q) {
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
  s.buffer = _auNoise(); fl.type = ft; fl.frequency.value = f; if (q) fl.Q.value = q;
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + .002); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(gn); gn.connect(out); s.start(t, _auNOff()); s.stop(t + d + .03);
}
function _auSine(out, f, t, v, att, dec, f2, fd) {   // sine blip with exponential envelope
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + fd);
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + att); gn.gain.exponentialRampToValueAtTime(.0001, t + dec);
  o.connect(gn); gn.connect(out); o.start(t); o.stop(t + dec + .05);
}
function _auKoto(out, f, t, v, dec) {   // = v1 pluck
  const o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), g2 = AC.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.006, t); o.frequency.exponentialRampToValueAtTime(f, t + .05);
  o2.type = 'sine'; o2.frequency.setValueAtTime(f * 2, t);
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + .006);
  if (dec > 2) gn.gain.exponentialRampToValueAtTime(v * .3, t + .3);   // long notes: pluck, then a soft singing tail
  gn.gain.exponentialRampToValueAtTime(.0001, t + dec);
  g2.gain.setValueAtTime(.0001, t); g2.gain.exponentialRampToValueAtTime(v * .35, t + .004); g2.gain.exponentialRampToValueAtTime(.0001, t + .3);
  o.connect(gn); o2.connect(g2); gn.connect(out); g2.connect(out); o.start(t); o2.start(t); o.stop(t + dec + .05); o2.stop(t + .35);
}
function _auShami(out, f, t, v) {
  const o = AC.createOscillator(), lp = AC.createBiquadFilter(), gn = AC.createGain();
  o.type = 'square'; o.frequency.setValueAtTime(f * 1.02, t); o.frequency.exponentialRampToValueAtTime(f, t + .03);
  lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(1000, t + .35);   // closes a little: never buzzy
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + .004); gn.gain.exponentialRampToValueAtTime(.0001, t + .5);
  o.connect(lp); lp.connect(gn); gn.connect(out); o.start(t); o.stop(t + .55);
  _auNz(out, t, .025, v * .6, 3000, 'bandpass', 1.2);   // plectrum
}
function _auWind(out, f, t, dur, v, kind) {   // flute / shakuhachi / fue
  const sk = kind === 'shakuhachi', o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), g2 = AC.createGain();
  const lfo = AC.createOscillator(), lg = AC.createGain(), lg2 = AC.createGain(), att = sk ? .09 : .06, end = t + Math.max(.18, dur);
  o.type = o2.type = 'sine';
  if (sk) { o.frequency.setValueAtTime(f * .9439, t); o.frequency.exponentialRampToValueAtTime(f, t + .09); o2.frequency.setValueAtTime(f * 1.8877, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + .09); }
  else { o.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f * 2, t); }
  lfo.frequency.value = 5.2;   // vibrato 0.6 %, fading in after 150 ms
  lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + .15); lg.gain.linearRampToValueAtTime(f * .006, t + .45);
  lg2.gain.setValueAtTime(0, t); lg2.gain.setValueAtTime(0, t + .15); lg2.gain.linearRampToValueAtTime(f * .012, t + .45);
  lfo.connect(lg); lg.connect(o.frequency); lfo.connect(lg2); lg2.connect(o2.frequency);
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + att); gn.gain.linearRampToValueAtTime(v * .8, end); gn.gain.setTargetAtTime(0, end, sk ? .07 : .05);
  g2.gain.value = sk ? .1 : .06;   // a little body for phone speakers
  o.connect(gn); o2.connect(g2); g2.connect(gn); gn.connect(out);
  o.start(t); o2.start(t); lfo.start(t); o.stop(end + .45); o2.stop(end + .45); lfo.stop(end + .45);
  // breath at the start: noise band-passed at 2f
  const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), bg = AC.createGain(), bl = sk ? .18 : .12, bv = v * (sk ? 2.6 : kind === 'fue' ? 1.4 : 1.8);
  s.buffer = _auNoise(); fl.type = 'bandpass'; fl.frequency.value = f * 2; fl.Q.value = 6;
  bg.gain.setValueAtTime(0, t); bg.gain.linearRampToValueAtTime(bv, t + .025); bg.gain.linearRampToValueAtTime(0, t + bl);
  s.connect(fl); fl.connect(bg); bg.connect(out); s.start(t, _auNOff()); s.stop(t + bl + .02);
}
function _auMbox(out, f, t, v) {
  _auSine(out, f, t, v, .002, 1.2);
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = 'sine'; o.frequency.value = f * 3; o.detune.value = 2;
  gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v * .25, t + .002); gn.gain.exponentialRampToValueAtTime(.0001, t + .8);
  o.connect(gn); gn.connect(out); o.start(t); o.stop(t + .85);
  _auSine(out, f * 5, t, v * .08, .002, .45);
}
function _auPad(out, ms, t, dur, v, lpf) {
  const lp = AC.createBiquadFilter(), gn = AC.createGain(), end = t + dur;
  lp.type = 'lowpass'; lp.frequency.value = lpf; lp.Q.value = .5;
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + .5); gn.gain.setValueAtTime(v, end); gn.gain.setTargetAtTime(0, end, .3);
  lp.connect(gn); gn.connect(out);
  for (const m of ms) for (const dc of [-6, 6]) {
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = 'triangle'; o.frequency.value = _auHz(m); o.detune.value = dc; og.gain.value = .5;
    o.connect(og); og.connect(lp); o.start(t); o.stop(end + 1.6);
  }
}
let _auSolo = null;   // debug (preview / renders): array of layer names to hear alone
function _auPlay(p, e, t) {
  if (_auSolo && _auSolo.indexOf(e.y) < 0) return;
  const out = p.g, sd = p.sd, dt = p.sec.dt, tr = _auTRIM[e.i] || 1;
  // a touch of human timing / touch on plucked notes, fixed per (pass, step) so every repeat is identical
  const hz = _auH(p.pass, p.secIdx * 512 + e.s, e.i.length + (e.y === 'lead' ? 7 : 3));
  const v = e.v * tr * _auSGAIN[p.song] * (_auPLUCK[e.i] ? .93 + hz * .12 : 1), tt = t + (_auPLUCK[e.i] ? (hz - .5) * .012 : 0);
  const m = e.m, f = typeof m === 'number' ? _auHz(m) : 0, len = e.l * dt;
  switch (e.i) {
    case 'koto': _auKoto(out, f, Math.max(t, tt), v, len > 1.2 ? 2.8 : len > .8 ? 2 : 1.5); break;
    case 'shamisen': _auShami(out, f, Math.max(t, tt), v); break;
    case 'flute': case 'shakuhachi': case 'fue': _auWind(out, f, t, len * .94, v, e.i); break;
    case 'musicbox': _auMbox(out, f, t, v); break;
    case 'glock': _auSine(out, f * 2, t, v, .002, .6); _auSine(out, f * 5.4, t, v * .3, .002, .3); break;
    case 'bass': {   // v1 bassNote, but it carries through its bar (no dead air at phrase ends)
      const o = AC.createOscillator(), gn = AC.createGain(), end = t + Math.max(3.2, len + .6);
      o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + .08); gn.gain.exponentialRampToValueAtTime(v * .25, t + Math.max(.9, len * .6)); gn.gain.exponentialRampToValueAtTime(.0001, end);
      o.connect(gn); gn.connect(out); o.start(t); o.stop(end + .05);
      break;
    }
    case 'bass5': _auSine(out, f, t, v, .05, 1.3); break;
    case 'pad': _auPad(out, m, t, len, v, 1400); break;
    case 'padN': _auPad(out, m, t, len, v, 900); break;
    case 'wood': _auNz(out, t, .035, v * 2.5, 1800, 'bandpass', 8); _auSine(out, 900, t, v * .6, .002, .04); break;
    case 'pon': _auSine(out, 260, t, v * .9, .003, .25, 150, .12); _auNz(out, t, .02, v * 1.5, 1000, 'bandpass', 2); break;
    case 'taiko': _auSine(out, 90, t, v * 1.5, .004, .45, 48, .3); _auNz(out, t, .12, v * 1.2, 200, 'lowpass'); break;
    case 'taikoS': _auNz(out, t, .02, v * .8, 3000, 'highpass'); _auSine(out, 120, t, v * .4, .003, .15, 70, .1); break;
    case 'rin': _auSine(out, f, t, v * .5, .003, 3); _auSine(out, f * 1.003, t, v * .2, .003, 2.6); _auSine(out, f * 2.76, t, v * .12, .002, 1.2); break;
    case 'star': {
      const o = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain();
      o.type = o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 4;
      gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v * .6, t + .3); gn.gain.setTargetAtTime(0, t + .35, 1.1);
      o.connect(gn); o2.connect(gn); gn.connect(out); o.start(t); o2.start(t); o.stop(t + 6); o2.stop(t + 6);
      break;
    }
  }
}

// ------------------------------------------------------------ players, switching, voice budget
const _auPl = [];    // newest last; at most 2 schedule at once
const _auPass = {};  // song -> passes started so far
const _auPos = {};   // song -> where it resumes when re-entered (18.2): the section after the one it left once half of
                     // that was heard, else the same section again with a fresh pass (a new variation, never a repeat)
const _auVQ = [];    // start times of recent voices (budget: 24 per second)
const _auW = { song: 'title', night: 0, star: 1, menu: false };
let _auNight = false, _auPend = null, _auPendT = 0, _auSwT = -1e9, _auDryT = 0, _auPerf = -1;
function _auNextPass(song) { const n = _auPass[song] || 0; _auPass[song] = n + 1; return n; }
function _auNewPlayer(song, t0) {
  const rp = _auPos[song]; delete _auPos[song];
  const p = { song, sd: _auSong(song), secIdx: rp ? rp.secIdx : 0, pass: rp ? rp.pass : _auNextPass(song), step: 0, t: t0, sec: null, g: null, send: null, stopAt: Infinity, killAt: Infinity, start: t0 };
  if (AC) {
    const b = _auBuses();
    p.g = AC.createGain(); p.g.gain.setValueAtTime(.0001, Math.max(AC.currentTime, t0 - .01)); p.g.gain.linearRampToValueAtTime(1, t0 + 1.5); p.g.connect(MB);
    if (p.sd.echo) { p.send = AC.createGain(); p.send.gain.value = .25; p.g.connect(p.send); p.send.connect(b.ein); }
  }
  return p;
}
function _auCur() { for (let i = _auPl.length - 1; i >= 0; i--) if (_auPl[i].stopAt === Infinity) return _auPl[i]; return null; }
function _auNextBar(p) {
  if (!p.sec) return p.t;
  const B = p.sec.bar8; return p.t + ((B - p.step % B) % B) * p.sec.dt;
}
function _auHold(g, t) {   // freeze an AudioParam's automation at time t (fallback: at its current value, now)
  if (g.cancelAndHoldAtTime) { g.cancelAndHoldAtTime(t); return t; }
  const now = AC.currentTime, v = g.value; g.cancelScheduledValues(now); g.setValueAtTime(v, now); return Math.max(t, now);
}
function _auStop(p, t, tau) {
  p.stopAt = t; p.killAt = t + tau * 10;
  if (p.g) { try { const g = p.g.gain; g.setTargetAtTime(0, _auHold(g, t), tau); } catch (e) {} }
}
function _auSwitch(now) {
  const want = _auW.song || null, cur = _auCur(), cs = cur ? cur.song : null;
  if (want === cs) { _auPend = null; return; }
  if (_auPend !== want) { _auPend = want; _auPendT = now; }
  // areas: stay 1.5 s, and at least AU_MINGAP s between switches (so at most 4 a minute); title / fest / silence react fast
  const areaSw = cs && want && cs !== 'title' && cs !== 'fest' && want !== 'title' && want !== 'fest';
  if (cs && (now - _auPendT < (areaSw ? 1.5 : .25) || (areaSw && now - _auSwT < AU_MINGAP))) return;
  let tb = now + .05;
  if (cur) {
    tb = Math.max(now + .02, _auNextBar(cur));
    if (cur.song !== 'title' && cur.song !== 'fest') {   // an area song left: remember where it resumes (see _auPos)
      let si = cur.secIdx, ps = cur.pass;
      if (cur.sec && cur.step >= cur.sec.len / 2) { si++; if (si >= cur.sd.form.length) { si = 0; ps = _auNextPass(cur.song); } }
      else ps = _auNextPass(cur.song);
      _auPos[cur.song] = { secIdx: si, pass: ps };
    }
    _auStop(cur, tb, .6); cur.stopAt = tb + 2.5; cur.killAt = tb + 6;
  }
  for (const p of _auPl) if (p !== cur && p.stopAt > now) _auStop(p, now, .05);   // never more than 2 scheduling
  if (want) _auPl.push(_auNewPlayer(want, tb));
  _auPend = null; _auSwT = now; if (cs) MUSIC_DBG.switches++;
}
function _auVoiceOK(t, n, y) {   // every 1-second window that contains t must stay within the budget
  while (_auVQ.length && _auVQ[0] < t - 2) _auVQ.shift();
  let worst = 0;
  for (const w of _auVQ.filter(x => x > t - 1 && x <= t).concat([t])) {
    let c = 0; for (const x of _auVQ) if (x >= w && x < w + 1) c++;
    if (c > worst) worst = c;
  }
  if (worst + n > (y === 'lead' || y === 'bass' ? AU_VMAX : AU_VMAX - 4)) return false;
  let j = _auVQ.length; while (j > 0 && _auVQ[j - 1] > t) j--;
  for (let i = 0; i < n; i++) _auVQ.splice(j, 0, t);
  return true;
}
function _auEnter(p) {
  p.sec = _auCompile(p.song, p.secIdx, p.pass, _auNight, _auW.star);
  p.secT = p.t;
}
function _auRun(p, now, horizon) {
  const live = !!AC && musicOn;
  while (p.t < horizon && p.t < p.stopAt) {
    if (!p.sec) _auEnter(p);
    const evs = p.sec.at[p.step];
    if (evs && p.t >= now - .02) for (const e of evs) if (_auVoiceOK(p.t, e.n, e.y) && live) { try { _auPlay(p, e, p.t); } catch (er) {} }
    p.t += p.sec.dt;
    if (++p.step >= p.sec.len) { p.step = 0; p.sec = null; if (++p.secIdx >= p.sd.form.length) { p.secIdx = 0; p.pass = _auNextPass(p.song); } }
  }
}
function musicWant(o) {
  if (!o) return;
  if (o.song !== undefined) _auW.song = o.song;
  const nv = typeof o.night === 'boolean' ? +o.night : o.night;
  if (typeof nv === 'number') {
    _auW.night = nv;
    if (!_auNight && nv > .6) _auNight = true; else if (_auNight && nv < .4) _auNight = false;   // takes effect at the next section
  }
  if (o.star) _auW.star = o.star | 0;
  _auW.menu = !!o.menu;
  if (o.area !== undefined) ambWant(o.area, o);
}
function musicTick(dt) {
  try {
    let now;
    if (AC) {
      if (AC !== _auCtx) _auBind();
      if (AC.state === 'closed' || (AC.state !== 'running' && !_auOffline())) return;
      now = AC.currentTime; _auLevels(now);
    } else {
      if (_auACtor) return;   // a browser before the first tap: initAudio() will start everything
      if (typeof dt === 'number') _auDryT += Math.max(0, Math.min(dt, 1));
      else { const pn = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000; if (_auPerf >= 0) _auDryT += Math.max(0, Math.min(pn - _auPerf, 1)); _auPerf = pn; }
      now = _auDryT;
    }
    _auSwitch(now);
    for (const p of _auPl) {
      if (p.t < now - .5 && p.stopAt === Infinity) { const lag = now - p.t; p.t += lag; p.secT = (p.secT || 0) + lag; }   // throttled tab: jump, never pile up
      _auRun(p, now, now + AU_LOOK);
    }
    for (let i = _auPl.length - 1; i >= 0; i--) if (now > _auPl[i].killAt) {
      const p = _auPl[i]; try { if (p.g) p.g.disconnect(); if (p.send) p.send.disconnect(); } catch (e) {}
      _auPl.splice(i, 1);
    }
    _auAmbTick(now);
    const c = _auCur(), D = MUSIC_DBG;
    D.t = now; D.players = _auPl.length;
    let n = 0; for (const x of _auVQ) if (x > now - 1 && x <= now) n++;
    D.voicesPerSec = n; if (n > D.voicesMax) D.voicesMax = n;
    if (c && c.sec) { D.song = c.song; D.section = c.sec.name; D.pass = c.pass; D.night = c.sec.night; D.layers = c.sec.layers; D.sig = c.sec.sig; D.bar = Math.floor(c.step / c.sec.bar8); }
    else if (!c) { D.song = null; D.section = null; D.sig = ''; }
  } catch (e) {}
}

// ------------------------------------------------------------ ambience bus AB (SPEC 9.4)
const _auAMBS = { onsen: { water: 1 }, roten: { water: 1, falls: 1 }, front: { wind: 1, birds: 1 }, garden: { birds: 1, insects: 1, shishi: 1 }, dining: { fire: 1 } };
const _auAmb = { area: null, shishi: false, shT: null, shK: null, lay: {}, nx: {}, buf: null, r: 0x9E3779B9 };
function ambWant(area, o) {
  _auAmb.area = area || null;
  if (o) { if (o.shishi !== undefined) _auAmb.shishi = !!o.shishi; if (typeof o.shishiT === 'number') _auAmb.shT = o.shishiT; }
}
function _auR() { let a = _auAmb.r = (_auAmb.r + 0x6D2B79F5) | 0; a = Math.imul(a ^ (a >>> 15), 1 | a); a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a; return ((a ^ (a >>> 14)) >>> 0) / 4294967296; }
function _auAmbBuf() {   // 6.1 s of noise, its own seed (longer than NB so loops never line up)
  if (!_auAmb.buf || _auAmb.buf.sampleRate !== AC.sampleRate) {
    const n = AC.sampleRate * 6.1 | 0, b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0); let s = 0x1B873593;
    for (let i = 0; i < n; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; a[i] = (s >>> 0) / 2147483648 - 1; }
    _auAmb.buf = b;
  }
  return _auAmb.buf;
}
function _auLayer(kind) {   // continuous noise bed: source -> filter -> level (with slow LFO) -> crossfade gain -> AB
  const c = AC, src = c.createBufferSource(), f = c.createBiquadFilter(), m = c.createGain(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  const lvl = kind === 'water' ? 1.1 : kind === 'falls' ? .25 : 1.1;
  src.buffer = _auAmbBuf(); src.loop = true; src.playbackRate.value = kind === 'water' ? 1 : kind === 'falls' ? .93 : .87;
  if (kind === 'water') { f.type = 'lowpass'; f.frequency.value = 450; lfo.frequency.value = .2; lg.gain.value = lvl * .3; }
  else if (kind === 'falls') { f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = .7; lfo.frequency.value = .13; lg.gain.value = lvl * .1; }
  else { f.type = 'lowpass'; f.frequency.value = 300; lfo.frequency.value = .1; lg.gain.value = lvl * .5; }
  m.gain.value = lvl; g.gain.value = 0;
  lfo.connect(lg); lg.connect(m.gain); src.connect(f); f.connect(m); m.connect(g); g.connect(_auAB);
  src.start(c.currentTime, (kind.length * 1.37) % 5); lfo.start();
  return { src, lfo, g, tgt: 0, off: c.currentTime };
}
function _auAmbOne(t, kind) {   // one-shot ambience events, all into AB
  const out = _auAB;
  if (kind === 'drip') _auSine(out, 1100, t, .5, .003, .09, 1700, .04);
  else if (kind === 'bird') { const n = 2 + (_auR() < .5 ? 1 : 0), f0 = 2600 + _auR() * 300; for (let i = 0; i < n; i++) _auSine(out, f0 + i * 90, t + i * .13, .22 * (1 - i * .15), .01, .09, f0 + 800 + i * 60, .07); }
  else if (kind === 'insect') {
    for (let i = 0; i < 3; i++) {
      const s = t + i * .37, o = AC.createOscillator(), gate = AC.createOscillator(), gg = AC.createGain(), env = AC.createGain();
      o.type = 'sine'; o.frequency.value = 4300; gate.type = 'square'; gate.frequency.value = 28;
      gg.gain.value = .5; const gd = AC.createGain(); gd.gain.value = .5; gate.connect(gd); gd.connect(gg.gain);   // square -1..1 -> gain 0..1
      env.gain.setValueAtTime(0, s); env.gain.linearRampToValueAtTime(.12, s + .02); env.gain.setValueAtTime(.12, s + .23); env.gain.linearRampToValueAtTime(0, s + .25);
      o.connect(gg); gg.connect(env); env.connect(out); o.start(s); gate.start(s); o.stop(s + .27); gate.stop(s + .27);
    }
  }
  else if (kind === 'fire') _auNz(out, t, .012 + _auR() * .025, .5 + _auR() * .7, 6000, 'highpass');
  else if (kind === 'shishi') {   // trickle, then the bamboo "tok"
    const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain();
    s.buffer = _auNoise(); fl.type = 'bandpass'; fl.frequency.value = 1300; fl.Q.value = 1.2;
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(.5, t + .2); gn.gain.linearRampToValueAtTime(0, t + .32);
    s.connect(fl); fl.connect(gn); gn.connect(out); s.start(t, _auNOff()); s.stop(t + .35);
    _auNz(out, t + .3, .05, 3, 700, 'bandpass', 4); _auSine(out, 320, t + .3, .9, .002, .09);
  }
}
function _auAmbTick(now) {
  const A = _auAmb, live = musicOn && (!_auSolo || _auSolo.indexOf('amb') >= 0), S = live ? (_auAMBS[A.area] || {}) : {}, night = _auW.night > .5, hor = now + AU_LOOK;
  const act = [];
  for (const kind of ['water', 'falls', 'wind']) {
    const want = S[kind] ? 1 : 0; let L = A.lay[kind];
    if (want) act.push(kind);
    if (!AC) continue;
    if (want && !L) L = A.lay[kind] = _auLayer(kind);
    if (!L) continue;
    if (L.tgt !== want) { L.g.gain.setTargetAtTime(want, now, .27); L.tgt = want; L.off = now; }   // 0.8 s crossfade
    if (!want && now - L.off > 3) { try { L.src.stop(); L.lfo.stop(); L.g.disconnect(); } catch (e) {} delete A.lay[kind]; }
  }
  const ev = (key, on, gap, kind) => {   // schedule one-shot events at random gaps while 'on'
    if (!on) { A.nx[key] = 0; return; }
    act.push(kind || key);
    if (!A.nx[key]) A.nx[key] = now + gap() * .5;
    while (A.nx[key] < hor) { if (AC) { try { _auAmbOne(Math.max(now, A.nx[key]), kind || key); } catch (e) {} } A.nx[key] += gap(); }
  };
  ev('drip', S.water, () => 2 + _auR() * 4);
  ev('bird', S.birds && !night, () => 6 + _auR() * 6);
  ev('insect', S.insects && night, () => 1.5 + _auR() * 2.5);
  ev('fire', S.fire, () => .2 + _auR() * .9);
  if (S.shishi && A.shishi) {
    act.push('shishi');
    if (A.shT !== null) { const k = Math.floor(A.shT / 20); if (A.shK !== null && k !== A.shK && AC) { try { _auAmbOne(now, 'shishi'); } catch (e) {} } A.shK = k; }
    else ev('shishiT', true, () => 20, 'shishi');
  } else A.shK = A.shT !== null ? Math.floor(A.shT / 20) : null;
  MUSIC_DBG.amb = act;
}
// keep the v1 fixes: suspend while hidden; the core's pagehide closes AC and initAudio() builds a fresh one
try {
  document.addEventListener('visibilitychange', () => {
    try { if (!AC || AC.state === 'closed' || _auOffline()) return; const pr = document.hidden ? AC.suspend() : AC.resume(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {}
  });
} catch (e) {}
/*AUDIO:END*/
