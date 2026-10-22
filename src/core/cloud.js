// ============================================================ cloud saves (AI Made Games / 1GP, SDK v1)
// Inside the platform's player (an iframe) the SDK owns the save: the whole of S (what saveNow stored) is the snapshot,
// the title waits until it is restored, and the platform's own UI settles conflicts, backups, offline play and account
// switches. Anywhere else (GitHub Pages, a plain tab, tests, the SDK failing to load) the game keeps its own
// localStorage save exactly as before. Add ?cloud to a plain tab to try the SDK there (it runs as a local guest).
const GAME_VERSION = '2.6.1';
const CLOUD_ORIGIN = 'https://www.ai-made.games', CLOUD_GAME = '7565102b-995c-470d-835e-455dc82bc891';
// legacy = the device's own pre-cloud save, offered on the title only when the SDK restored nothing (an explicit choice:
// it is never uploaded by itself and the old key is left as it is). err = initialize failed: no fresh start over it.
const CLOUD = { on: false, ready: true, legacy: null, status: '', code: '', err: '', errAt: 0 };
function cloudWanted() {
  try { if (window.parent && window.parent !== window) return true; } catch (e) { return true; }
  try { return /[?&]cloud(?:[=&]|$)/.test(location.search || ''); } catch (e) { return false; }
}
const legacyStar = d => { const u = d && d.unlocked || {}; return clamp(Math.max(1 + !!u.onsen + !!u.dining + !!u.garden + !!u.roten, (d && d.peak) | 0), 1, 5); };
const cloudSummary = d => L('★{0} · 第 {1} 天 · {2} 鱼干', legacyStar(d), Math.max(1, (d && d.day) | 0), fmt(Math.max(0, (d && d.money) | 0)));
function cloudExport() { S.rush5 = rushSave(); return JSON.parse(JSON.stringify(S)); }
// at startup and whenever the player picks another save on the platform (the cloud copy, a backup): the whole scene is
// rebuilt from it, nothing of the old one is kept (resetWorld clears guests, staff, timers and the rush)
function cloudImport(data) {
  S = loadState(data); hasSave = true; CLOUD.legacy = null; dirty = false; saveClock = 0;
  if (state === 'title') resetWorld(); else continueGame();
}
function cloudStart() {   // boot: S is the fresh default here (the SDK's baseline), the title waits on CLOUD.ready
  CLOUD.on = true; CLOUD.ready = false; hasSave = false;
  const raw = load('state', null); CLOUD.legacy = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null;
  if (window.AIMadeGames && window.AIMadeGames.saves) { cloudInit(); return; }
  const sc = document.createElement('script'); sc.src = CLOUD_ORIGIN + '/sdk/cloud-saves-v1.js'; sc.async = true;
  // a script that neither loads nor fails (a blocked host can hang for minutes) must not hold the title forever
  const late = setTimeout(cloudFallback, 12000);
  sc.onload = () => { clearTimeout(late); cloudInit(); }; sc.onerror = () => { clearTimeout(late); cloudFallback(); };
  document.head.appendChild(sc);
}
function cloudFallback() {   // the SDK never loaded: play on the device's own save, as outside the platform
  if (!CLOUD.on || CLOUD.ready) return;
  CLOUD.on = false; CLOUD.ready = true; CLOUD.legacy = null;
  S = loadState(); hasSave = hasSaveRaw(); resetWorld();
}
async function cloudInit() {
  if (!CLOUD.on) return;   // too late: the device save is already in play
  const sv = window.AIMadeGames && window.AIMadeGames.saves;
  if (!sv) { cloudFallback(); return; }
  try {
    sv.onStatus(s => {
      const st = s && s.status || '', code = s && s.code || '';
      if (st === 'error' && CLOUD.status !== 'error') CLOUD.errAt = Date.now();   // when this run of failures began
      if ((st === 'error' || st === 'conflict' || st === 'incompatible') && (st !== CLOUD.status || code !== CLOUD.code)) { try { console.warn('[cloud save]', st, code, s.error || ''); } catch (e) {} }
      CLOUD.status = st; CLOUD.code = code;
    });
  } catch (e) {}
  try {
    const r = await sv.initialize({ platformOrigin: CLOUD_ORIGIN, gameId: CLOUD_GAME, schemaVersion: 1, gameVersion: GAME_VERSION,
      exportState: cloudExport, importState: cloudImport, summary: cloudSummary });
    if (r && r.restored) CLOUD.legacy = null;
    CLOUD.ready = true;
  } catch (e) { CLOUD.err = e && e.code || 'ERROR'; }
}
// saveNow's cloud half: the SDK writes the device copy first, then uploads. Checkpoints come in bursts (a run of
// purchases), so uploads are at most one per CLOUD_GAP ms; the last one waits and goes out then (or at once on hide)
const CLOUD_GAP = 10;   // seconds of T
let cloudLast = -1e9, cloudPend = false;
function cloudSave(now) {
  if (!CLOUD.ready || CLOUD.err) return;
  if (!now && T - cloudLast < CLOUD_GAP) { cloudPend = true; return; }   // cloudTick sends it when the gap is over
  cloudPend = false; cloudLast = T;
  const fail = e => { if (e && e.code) CLOUD.code = e.code; };
  try { const p = window.AIMadeGames.saves.save(); if (p && p.catch) p.catch(fail); } catch (e) { fail(e); }
}
function cloudTick() { if (cloudPend && T - cloudLast >= CLOUD_GAP) cloudSave(true); }
const cloudFlush = () => { if (CLOUD.on && state !== 'title' && (cloudPend || dirty)) { S.rush5 = rushSave(); dirty = false; cloudSave(true); } };
document.addEventListener('visibilitychange', () => { if (document.hidden) cloudFlush(); });
window.addEventListener('pagehide', cloudFlush);
// the title: continue the device's pre-cloud save (it is saved to the account from here on)
function cloudLegacy() { const raw = CLOUD.legacy; CLOUD.legacy = null; S = loadState(raw); hasSave = true; continueGame(); saveNow(); }
// one short line when progress really is not reaching the cloud (or the device); a passing failure the SDK retries by
// itself (the network, a busy server) says nothing for its first 20 s
function cloudNote() {
  if (!CLOUD.on) return '';
  const c = CLOUD.code;
  if (c === 'IDENTITY_CHANGED' || c === 'RELOAD_REQUIRED') return '账号换了，请刷新';
  if (CLOUD.status === 'conflict') return '有两份存档，请在平台上选一份';
  if (CLOUD.status === 'incompatible' || c === 'INCOMPATIBLE_SAVE') return '存档版本不对，暂时不保存';
  if (c === 'LOCAL_WRITE_FAILED') return '存档写不进去，进度没保存';
  if (CLOUD.status === 'error' && Date.now() - (CLOUD.errAt || 0) > 20000) return '云存档没同步上';
  return '';
}
function drawCloudNote() {
  const s = cloudNote(); if (!s) return;
  const w = Math.min(W - 4, textW(s, 7) + 10 | 0); pill(R((W - w) / 2), 50, w, 11); txt(s, W / 2, 55.5, 7, '#ffb0a0');   // under the banner zone (y 18-48)
}
