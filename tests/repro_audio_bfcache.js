// Repro / regression (v1 bug, kept for the v2 engine): after the AudioContext is closed on pagehide and re-created (page
// restored from bfcache, next tap), the music scheduler and the coin / pop throttles must restart on the NEW context's
// clock at once - not stay silent until it catches up with the old one. Also: hidden/visible keeps the music going, the
// music switch ramps the music bus to 0 and back, and resume() on a closed context is never called unguarded.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/repro_audio_bfcache.js --seed 1
// A fake AudioContext with a manual clock counts the oscillators each sound creates; music voices are counted at _auPlay.
class Param {
  constructor(v) { this.value = v || 0; }
  setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {}
  cancelScheduledValues() {} cancelAndHoldAtTime() {}
}
let osc = 0, resumedClosed = 0;
const node = o => Object.assign({ connect() {}, disconnect() {} }, o);
class FakeAC {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = node({}); }
  createOscillator() { osc++; return node({ type: '', frequency: new Param(440), detune: new Param(), start() {}, stop() {} }); }
  createGain() { return node({ gain: new Param(1) }); }
  createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData: () => d }; }
  createBufferSource() { return node({ buffer: null, loop: false, playbackRate: new Param(1), detune: new Param(), start() {}, stop() {} }); }
  createBiquadFilter() { return node({ type: '', frequency: new Param(350), Q: new Param(1), gain: new Param() }); }
  createDelay() { return node({ delayTime: new Param() }); }
  resume() { if (this.state === 'closed') { resumedClosed++; return Promise.reject(new Error('InvalidStateError: closed')); } this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
// the engine picks its AudioContext constructor when the page loads (headless has none), so the test hands it a context:
// a closed one is dropped by initAudio(), a new one is bound (every clock restarted) by the next initAudio() / musicTick()
const tap = () => { initAudio(); if (!AC) AC = new FakeAC(); initAudio(); };
setMusicOn(true); setSfxOn(true);
newGame();
tap();                                           // first tap
const DT = 1 / 30, fails = [];
const check = (c, m) => { if (!c) fails.push(m); };
const run = sec => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { AC.currentTime += DT; update(DT); } };
let voices = 0; const _play = _auPlay; _auPlay = function (...a) { voices++; return _play.apply(this, a); };
const music10 = () => { const a = voices; run(10); return voices - a; };
const coinOsc = () => { S.piles.recep = 10; const a = osc; collect('recep'); return osc - a; };
const popOsc = () => { const a = osc; SFX.pop(); return osc - a; };
let n = music10(); console.log('session 1: music voices in 10 s =', n); check(n > 0, 'no music in the first 10 s');
run(600);                                        // play ~10 minutes
const m1 = music10(), c1 = coinOsc(), p1 = popOsc();
console.log('session 1 after 10 min: music voices in 10 s =', m1, '| coin SFX osc =', c1, '| pop SFX osc =', p1, '| AC.currentTime', AC.currentTime.toFixed(1));
check(m1 > 0 && c1 > 0 && p1 > 0, 'silent after 10 min');
// control: visibilitychange hide/show (suspend / resume) keeps the music going
AC.suspend(); for (let i = 0; i < 300; i++) update(DT); AC.resume();
n = music10(); console.log('control, after a hidden/visible cycle: music voices in 10 s =', n); check(n > 0, 'no music after hidden/visible');
// control: the music switch mid-song ramps the music bus to 0 and back
const tgt = []; const mbSet = MB.gain.setTargetAtTime; MB.gain.setTargetAtTime = v => tgt.push(v);
setMusicOn(false); run(1); setMusicOn(true); run(1); MB.gain.setTargetAtTime = mbSet;
console.log('control, music off then on mid-song: music bus targets', JSON.stringify(tgt)); check(tgt.length === 2 && tgt[0] === 0 && tgt[1] > 0, 'music bus did not ramp 0 -> on');
run(1);
// pagehide handler body: save, then AC.close(). The page goes into bfcache.
saveNow(); AC.close();
for (let i = 0; i < 30; i++) update(DT);         // frames while closed: nothing may throw or resume the closed context
// page restored from bfcache; the player taps -> pointerdown -> initAudio() (the closed context is replaced)
tap();
console.log('after restore: new AC.currentTime', AC.currentTime, '| sfxCoinT', sfxCoinT.toFixed(1), 'sfxPopT', sfxPopT.toFixed(1));
const m2 = music10(), c2 = coinOsc(), p2 = popOsc();
console.log('after restore: music voices in 10 s =', m2, '| coin SFX osc =', c2, '| pop SFX osc =', p2);
check(m2 > 0 && c2 > 0 && p2 > 0, 'silent right after the bfcache restore');
run(60);
const m3 = music10(), c3 = coinOsc(), p3 = popOsc();
console.log('after restore +70 s: music voices in 10 s =', m3, '| coin SFX osc =', c3, '| pop SFX osc =', p3);
check(m3 > 0 && c3 > 0 && p3 > 0, 'silent 70 s after the restore');
// the visibilitychange handlers must not call resume() on a closed context (its promise rejects)
const old = AC; old.close(); document.dispatchEvent && document.dispatchEvent(new Event('visibilitychange'));
console.log('resume() calls on a closed context:', resumedClosed); check(resumedClosed === 0, 'resume() on a closed context');
if (fails.length) { console.log('AUDIO BFCACHE FAIL: ' + fails.join('; ')); process.exitCode = 1; }
else console.log('AUDIO BFCACHE OK  music + SFX restart at once on the new context');
