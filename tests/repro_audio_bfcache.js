// Repro: after the AudioContext is closed on pagehide and re-created (page restored from bfcache, next tap),
// the music scheduler and the coin / pop / tick throttles still hold times from the OLD context's clock, so
// background music and the throttled SFX stay silent until the new context's clock catches up.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/repro_audio_bfcache.js --seed 1
// A fake AudioContext with a manual clock counts the oscillators each sound creates.
class Param { setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} }
let osc = 0;
class FakeAC {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; }
  createOscillator() { osc++; return { type: '', frequency: new Param(), connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: Object.assign(new Param(), { value: 0 }), connect() {} }; }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { return { connect() {}, start() {}, stop() {} }; }
  createBiquadFilter() { return { type: '', frequency: { value: 0 }, connect() {} }; }
  resume() { if (this.state === 'closed') return Promise.reject(new Error('InvalidStateError: closed')); this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
window.AudioContext = FakeAC;
musicOn = sfxOn = true;   // (v2: the v1 `musicOn` became musicOn / sfxOn)
newGame();
initAudio();                                     // first tap
const DT = 1 / 30;
const run = sec => { for (let i = 0, n = Math.round(sec / DT); i < n; i++) { AC.currentTime += DT; update(DT); } };
let notes = 0; const _pluck = pluck; pluck = function (...a) { notes++; return _pluck(...a); };
const musicOsc = sec => { const a = notes; run(sec); return a === notes ? 0 : notes - a; };
const coinOsc = () => { S.piles.recep = 10; const a = osc; collect('recep'); return osc - a; };
const popOsc = () => { const a = osc; SFX.pop(); return osc - a; };
console.log('session 1: music notes in 10 s =', musicOsc(10));
run(600);                                        // play ~10 minutes
console.log('session 1 after 10 min: music notes in 10 s =', musicOsc(10), '| coin SFX osc =', coinOsc(), '| pop SFX osc =', popOsc(), '| AC.currentTime', AC.currentTime.toFixed(1), 'bgmNext', bgmNext.toFixed(1));
// control: visibilitychange hide/show (suspend / resume) keeps the music going
AC.suspend(); for (let i = 0; i < 300; i++) update(DT); AC.resume();
console.log('control, after a hidden/visible cycle: music notes in 10 s =', musicOsc(10));
// control: mute mid-song ramps the music bus to 0 and back
let tgt = []; const mbSet = MB.gain.setTargetAtTime; MB.gain.setTargetAtTime = (v) => tgt.push(v); musicOn = false; run(1); musicOn = true; run(1); MB.gain.setTargetAtTime = mbSet;
console.log('control, mute then unmute mid-song: music bus targets', JSON.stringify(tgt));
run(1);
// pagehide handler body (index.html line ~1835): save, then AC.close(). Page goes into bfcache.
saveNow(); AC.close();
// page restored from bfcache; the player taps -> pointerdown -> initAudio() (closed context is replaced)
initAudio();
console.log('after restore: new AC.currentTime', AC.currentTime, '| stale bgmNext', bgmNext.toFixed(1), 'sfxCoinT', sfxCoinT.toFixed(1), 'sfxPopT', sfxPopT.toFixed(1));
console.log('after restore: music notes in 10 s =', musicOsc(10), '| coin SFX osc =', coinOsc(), '| pop SFX osc =', popOsc());
run(60);
console.log('after restore +70 s: music notes in 10 s =', musicOsc(10), '| coin SFX osc =', coinOsc(), '| pop SFX osc =', popOsc());
// the visibilitychange handler calls AC.resume() unconditionally; on a closed context that promise rejects (unhandled)
const closed = new FakeAC(); closed.close(); let rejected = false; closed.resume().catch(() => { rejected = true; }); Promise.resolve().then(() => Promise.resolve()).then(() => console.log('resume() on a closed context rejects:', rejected));
