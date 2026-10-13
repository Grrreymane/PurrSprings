// ============================================================ cloud saves (AI Made Games / 1GP, SDK v1)
// Inside the platform's player (an iframe) the SDK owns the save: the whole of S (what saveNow stored) is the snapshot,
// the title waits until it is restored, and the platform's own UI settles conflicts, backups, offline play and account
// switches. Anywhere else (GitHub Pages, a plain tab, tests, the SDK failing to load) the game keeps its own
// localStorage save exactly as before. Add ?cloud to a plain tab to try the SDK there (it runs as a local guest).
const GAME_VERSION = '2.6.1';
const CLOUD_ORIGIN = 'https://www.ai-made.games', CLOUD_GAME = '7565102b-995c-470d-835e-455dc82bc891';
// legacy = the device's own pre-cloud save, offered on the title only when the SDK restored nothing (an explicit choice:
// it is never uploaded by itself and the old key is left as it is). err = initialize failed: no fresh start over it.
const CLOUD = { on: false, ready: true, legacy: null, status: '', code: '', err: '' };
function cloudWanted() {
  try { if (window.parent && window.parent !== window) return true; } catch (e) { return true; }
  try { return /[?&]cloud(?:[=&]|$)/.test(location.search || ''); } catch (e) { return false; }
}
const legacyStar = d => { const u = d && d.unlocked || {}; return clamp(Math.max(1 + !!u.onsen + !!u.dining + !!u.garden + !!u.roten, (d && d.peak) | 0), 1, 5); };
const cloudSummary = d => '★' + legacyStar(d) + ' · 第 ' + Math.max(1, (d && d.day) | 0) + ' 天 · ' + fmt(Math.max(0, (d && d.money) | 0)) + ' 鱼干';
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
  try { sv.onStatus(s => { CLOUD.status = s && s.status || ''; CLOUD.code = s && s.code || ''; }); } catch (e) {}
  try {
    const r = await sv.initialize({ platformOrigin: CLOUD_ORIGIN, gameId: CLOUD_GAME, schemaVersion: 1, gameVersion: GAME_VERSION,
      exportState: cloudExport, importState: cloudImport, summary: cloudSummary });
    if (r && r.restored) CLOUD.legacy = null;
    CLOUD.ready = true;
  } catch (e) { CLOUD.err = e && e.code || 'ERROR'; }
}
// saveNow's cloud half: the SDK writes the device copy first, then syncs; a blocked save shows in the status note
function cloudSave() {
  if (!CLOUD.ready || CLOUD.err) return;
  const fail = e => { if (e && e.code) CLOUD.code = e.code; };
  try { const p = window.AIMadeGames.saves.save(); if (p && p.catch) p.catch(fail); } catch (e) { fail(e); }
}
// the title: continue the device's pre-cloud save (it is saved to the account from here on)
function cloudLegacy() { const raw = CLOUD.legacy; CLOUD.legacy = null; S = loadState(raw); hasSave = true; continueGame(); saveNow(); }
// one short line when progress is not reaching the cloud (or the device); nothing while all is well
function cloudNote() {
  if (!CLOUD.on) return '';
  const c = CLOUD.code;
  if (c === 'IDENTITY_CHANGED' || c === 'RELOAD_REQUIRED') return '账号换了，请刷新';
  if (CLOUD.status === 'conflict') return '有两份存档，请在平台上选一份';
  if (CLOUD.status === 'incompatible' || c === 'INCOMPATIBLE_SAVE') return '存档版本不对，暂时不保存';
  if (c === 'LOCAL_WRITE_FAILED') return '存档写不进去，进度没保存';
  if (CLOUD.status === 'error') return '云存档没同步上';
  return '';
}
function drawCloudNote() {
  const s = cloudNote(); if (!s) return;
  const w = Math.min(W - 4, textW(s, 7) + 10 | 0); pill(R((W - w) / 2), 18, w, 11); txt(s, W / 2, 23.5, 7, '#ffb0a0');
}
