// Audio hookup checks the other suites don't make (stage 5 audit), on a fake AudioContext that records automation:
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/audit_crp_audio.js --seed 1
// 1. the pause menu muffles the music (master gain .5 + 1200 Hz lowpass) and closing restores it; nothing else ducks
// 2. music off: music bus -> 0, no new music voices, the ambience beds stop; sound effects still play
// 3. sound effects off: no SFX nodes, the music goes on
// 4. hidden -> AC.suspend(), visible -> resume(); pagehide closes AC: no music is scheduled on a closed context, the next
//    tap builds a new one and the music starts on it at once
const DT = 1 / 30;
let osc = 0, srcs = 0, voices = 0, stops = 0;
class Param { constructor(v) { this.value = v || 0; this.log = []; } setValueAtTime(v, t) { this.log.push(['set', v, t]); } exponentialRampToValueAtTime() {} linearRampToValueAtTime() {}
  setTargetAtTime(v, t, k) { this.log.push(['tgt', v, t, k]); this.value = v; } cancelScheduledValues() {} cancelAndHoldAtTime() {} }
const node = o => Object.assign({ connect() {}, disconnect() {} }, o);
class FakeAC {
  constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = node({}); }
  createOscillator() { osc++; return node({ type: '', frequency: new Param(440), detune: new Param(), start() {}, stop() { stops++; } }); }
  createGain() { return node({ gain: new Param(1) }); }
  createBuffer(c, n) { const d = new Float32Array(n); return { sampleRate: this.sampleRate, getChannelData: () => d }; }
  createBufferSource() { srcs++; return node({ buffer: null, loop: false, playbackRate: new Param(1), detune: new Param(), start() {}, stop() { stops++; } }); }
  createBiquadFilter() { return node({ type: '', frequency: new Param(350), Q: new Param(1), gain: new Param() }); }
  createDelay() { return node({ delayTime: new Param() }); }
  resume() { if (this.state === 'closed') return Promise.reject(new Error('closed')); this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
const _play = _auPlay; _auPlay = function (p, e, t) { voices++; return _play(p, e, t); };
let bad = 0; const check = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };
const run = (sec, f) => { for (let i = 0; i < sec * 30; i++) { if (f) f(); if (AC && AC.state === 'running') AC.currentTime += DT; update(DT); } };
setMusicOn(true); setSfxOn(true);
newGame(); AC = new FakeAC(); initAudio();
P.x = tcx([17, 3 + 2]); P.y = tcy([17, 5]); S.unlocked.onsen = true; rebuildWorld();   // stand in the onsen: water ambience
run(4);
const B = _auB, last = p => p.log.length ? p.log[p.log.length - 1][1] : p.value;
check(!!B && last(B.mm.gain) === 1 && last(B.mf.frequency) === 18000 && last(MB.gain) === BGM_VOL, 'playing: master 1, lowpass 18000, music bus ' + BGM_VOL);
check(voices > 0 && MUSIC_DBG.amb.length > 0, 'music voices ' + voices + ', ambience [' + MUSIC_DBG.amb + ']');
openMenu(); run(1);
check(last(B.mm.gain) === .5 && last(B.mf.frequency) === 1200 && last(MB.gain) === BGM_VOL, 'menu: master .5 + 1200 Hz lowpass (music bus untouched)');
const v0 = voices; run(2); check(voices > v0, 'menu: the music keeps going behind it (+' + (voices - v0) + ' voices)');
closeMenu(); run(1);
check(last(B.mm.gain) === 1 && last(B.mf.frequency) === 18000, 'menu closed: back to 1 / 18000');
// 2. music off
setMusicOn(false); const v1 = voices, o1 = osc; run(5);
check(last(MB.gain) === 0 && last(B.ab.gain) === 0, 'music off: music + ambience buses -> 0');
check(voices === v1, 'music off: no new music voices (' + (voices - v1) + ')');
check(Object.keys(_auAmb.lay).length === 0, 'music off: ambience beds stopped (' + Object.keys(_auAmb.lay) + ')');
const o2 = osc; SFX.click(); check(osc > o2, 'music off: sound effects still play');
setMusicOn(true); run(3); check(voices > v1 && last(MB.gain) === BGM_VOL, 'music back on: voices again, bus ' + BGM_VOL);
// 3. sfx off
setSfxOn(false); const o3 = osc, s3 = srcs; SFX.click(); SFX.coin(1); SFX.unlock(); SFX.splash();
check(osc === o3 && srcs === s3, 'sound effects off: no SFX nodes');
const v3 = voices; run(2); check(voices > v3, 'sound effects off: the music goes on');
setSfxOn(true);
// 4. hidden / pagehide
AC.suspend(); const v4 = voices; run(2); check(voices === v4, 'suspended (hidden): nothing scheduled');
AC.resume(); run(2); check(voices > v4, 'visible again: the music goes on');
const old = AC; old.close(); const v5 = voices; run(2); check(voices === v5, 'closed (pagehide): nothing scheduled on it');
// the next tap: initAudio drops the closed context; the page's constructor is a stub in headless, so the test hands one in
initAudio(); check(AC === null, 'initAudio() drops the closed context');
AC = new FakeAC(); initAudio(); run(1.5); check(voices > v5 && _auCtx === AC, 'a new context: the music starts on it at once (+' + (voices - v5) + ')');
console.log(bad ? 'AUDIT AUDIO: ' + bad + ' FAIL' : 'AUDIT AUDIO OK');
process.exitCode = bad ? 1 : 0;
