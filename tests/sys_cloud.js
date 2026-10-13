// Cloud saves (src/core/cloud.js) against a fake AI Made Games SDK: first launch, continue, the pre-cloud save,
// a save picked on the platform mid-game (cloud copy / backup), a failed start, offline / conflict / account notes.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_cloud.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const tap = r => onPress({ x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 });
const tick = () => new Promise(r => setTimeout(r, 0));
const LEGACY = SAVE + 'state';
// a fake SDK: initialize captures the baseline, then does what `plan` says (restore data / resolve empty / reject / hang)
function fakeSdk(plan) {
  const sdk = { saves: { calls: [], status: null, baseline: null, cfg: null, fns: [],
    onStatus(fn) { this.fns.push(fn); fn({ status: 'loading', ready: false }); return () => {}; },
    emit(s) { for (const f of this.fns) f(s); },
    async initialize(cfg) {
      this.cfg = cfg; this.baseline = cfg.exportState();
      if (plan.hang) return new Promise((res, rej) => { this.finish = res; this.fail = rej; });
      if (plan.reject) throw Object.assign(Error('x'), { code: plan.reject });
      if (plan.data) { await cfg.importState(JSON.parse(JSON.stringify(plan.data))); return { restored: true, status: { status: 'synced' } }; }
      return { restored: false, status: { status: plan.status || 'local' } };
    },
    async save() { const s = this.cfg.exportState(); this.calls.push(s); return s; },
  } };
  window.AIMadeGames = sdk; return sdk.saves;
}
function fresh() {   // back to the title of a new page load in the platform's player
  Object.assign(CLOUD, { on: false, ready: true, legacy: null, status: '', code: '', err: '' });
  localStorage.clear(); go('title'); S = loadState({}); resetWorld(); dirty = false;
}
const progress = (money, day) => { const s = defaults(); s.money = money; s.day = day; s.unlocked.onsen = true; return s; };
(async () => {
  // 1. first launch: nothing restored, the title waits, then a new game uploads its first save
  fresh(); let sv = fakeSdk({ hang: true }); cloudStart();
  ok(CLOUD.on && !CLOUD.ready, 'waits for initialize'); tap(BTN.start); ok(state === 'title', 'no start before initialize');
  ok(sv.cfg.gameId === '7565102b-995c-470d-835e-455dc82bc891' && sv.cfg.schemaVersion === 1 && sv.cfg.platformOrigin === 'https://www.ai-made.games', 'config');
  ok(sv.baseline.money === 0 && sv.baseline.day === 1 && !sv.baseline.unlocked.onsen, 'baseline is the default state');
  sv.emit({ status: 'offline' }); CLOUD.status = 'offline'; render();   // the title says so, still no start
  tap(BTN.start); ok(state === 'title', 'offline: no start until the platform settles it');
  sv.finish({ restored: false }); await tick();
  ok(CLOUD.ready && !hasSave && !CLOUD.legacy, 'ready, empty');
  tap(BTN.start); ok(state === 'play' && sv.calls.length === 1, 'new game saved through the SDK');
  ok(localStorage.getItem(LEGACY) === null, 'no legacy key written in cloud mode');
  S.money = 77; markDirty(); for (let i = 0; i < 50; i++) update(1 / 4); ok(sv.calls.length === 1, 'no upload every 2 s');
  for (let i = 0; i < 20; i++) update(1 / 4); ok(sv.calls.length === 2 && sv.calls[1].money >= 77, 'dirty state saved after ~15 s');
  ok(JSON.stringify(sv.calls[1]).length < 256 * 1024, 'snapshot under 256 KiB');
  // 2. continue: the cloud save is restored before the title's button, and continue does not re-read the device
  fresh(); localStorage.setItem(LEGACY, JSON.stringify(progress(5, 2)));
  sv = fakeSdk({ data: progress(500, 7) }); cloudStart(); await tick();
  ok(CLOUD.ready && hasSave && !CLOUD.legacy && S.money === 500, 'cloud save restored, device save not offered');
  tap(BTN.start); ok(state === 'play' && S.money === 500 && S.day === 7, 'continue keeps the restored save');
  // 3. a save picked on the platform mid-game (backup / cloud copy): the scene is rebuilt from it
  for (let i = 0; i < 400; i++) update(1 / 30);
  S.money = 9; sv.cfg.importState(progress(1234, 30));
  ok(state === 'play' && S.money === 1234 && S.day === 30 && GUESTS.length === 0, 'runtime import replaces the scene');
  state = 'menu'; sv.cfg.importState(progress(4, 3)); ok(state === 'play' && S.money === 4, 'runtime import from the menu');
  // 4. the pre-cloud save: offered on the title only when nothing was restored; continued only on that choice
  fresh(); localStorage.setItem(LEGACY, JSON.stringify(progress(321, 12)));
  sv = fakeSdk({}); cloudStart(); await tick();
  ok(CLOUD.legacy && !hasSave && S.money === 0 && sv.calls.length === 0, 'legacy offered, not uploaded');
  tap(BTN.start); ok(state === 'play' && S.money === 321 && S.day === 12 && sv.calls.length === 1 && sv.calls[0].money === 321, 'legacy continued and saved');
  ok(JSON.parse(localStorage.getItem(LEGACY)).money === 321, 'legacy key left intact');
  fresh(); localStorage.setItem(LEGACY, JSON.stringify(progress(321, 12)));
  sv = fakeSdk({}); cloudStart(); await tick();
  tap(BTN.fresh); ok(state === 'play' && S.money === 0 && S.day === 1 && !CLOUD.legacy, 'start over instead');
  // 5. a failed start (incompatible / newer format): no fresh game over it, nothing saved
  fresh(); sv = fakeSdk({ reject: 'INCOMPATIBLE_SAVE' }); cloudStart(); await tick();
  ok(CLOUD.err === 'INCOMPATIBLE_SAVE', 'error kept'); tap(BTN.start); ok(state === 'title' && sv.calls.length === 0, 'no start, no save');
  // 6. notes while playing: conflict, account switch, a full device
  fresh(); sv = fakeSdk({}); cloudStart(); await tick(); tap(BTN.start);
  sv.emit({ status: 'conflict' }); ok(/选一份/.test(cloudNote()), 'conflict note');
  sv.emit({ status: 'error', code: 'IDENTITY_CHANGED' }); ok(/刷新/.test(cloudNote()), 'account note');
  sv.emit({ status: 'error', code: 'LOCAL_WRITE_FAILED' }); ok(/没保存/.test(cloudNote()), 'write failed note');
  sv.emit({ status: 'synced' }); ok(cloudNote() === '', 'quiet when synced');
  render();
  // 7. the SDK never loaded: the device's own save, as outside the platform
  fresh(); localStorage.setItem(LEGACY, JSON.stringify(progress(66, 4))); delete window.AIMadeGames;
  CLOUD.on = true; CLOUD.ready = false; cloudFallback();
  ok(!CLOUD.on && CLOUD.ready && hasSave && S.money === 66, 'fallback to the device save');
  tap(BTN.start); saveNow(); ok(JSON.parse(localStorage.getItem(LEGACY)).money === S.money, 'fallback saves locally');
  // 8. summary
  ok(cloudSummary(progress(12345, 9)) === '★2 · 第 9 天 · 1.2万 鱼干', 'summary: ' + cloudSummary(progress(12345, 9)));
  console.log(errs.length ? 'SYS CLOUD FAIL\n  ' + errs.join('\n  ') : 'SYS CLOUD OK');
  if (errs.length) process.exitCode = 1;
})().catch(e => { console.log('TEST ERROR: ' + (e && e.stack || e)); process.exitCode = 1; });
