// ============================================================ 1GP leaderboard: 旅馆人气榜 (hearts, higher is better)
// The rule: the score is the inn's total hearts (S.hearts, the number the rival board in the menu uses), for the whole
// save. 1GP keeps each player's best and hearts only grow, so a run is settled with the current total every few minutes
// of play and when the page hides, and the next run opens right away. Native fetch to the REST API; the short-lived
// player token comes from the platform's player by postMessage and lives in memory only. Only inside that player:
// a plain tab plays on without a board, and board trouble (network, sign-in, limits) never stops the game.
const BOARD_ID = '15d78731-2977-443e-add6-4f25b9826b6f', BOARD_EVERY = 180, BOARD_MAX = 10000000;
// tok/exp: the token; run: the open run { id, at }; runKey: its start request's key (kept for a retry); pend: a settlement
// not yet confirmed { id, score, key } (retried unchanged); sent: the last confirmed score; rank: 1GP rank (0 = unknown)
const BOARD = { on: false, tok: null, exp: 0, run: null, runKey: null, pend: null, sent: -1, rank: 0, busy: false, wait: 0, t: 0, me: false };
const uuid = () => { try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); };
function boardBoot() {
  try { BOARD.on = !!(window.parent && window.parent !== window) && typeof fetch === 'function'; } catch (e) { BOARD.on = false; }
  if (!BOARD.on) return;
  document.addEventListener('visibilitychange', () => { if (document.hidden && state !== 'title') boardSettle(); });
}
// the platform's player hands out a game token for this origin (15 s at most)
function boardSession() {
  if (BOARD.tok && Date.now() < BOARD.exp - 60000) return Promise.resolve(BOARD.tok);
  return new Promise((res, rej) => {
    const id = uuid();
    const done = (f, v) => { clearTimeout(tm); window.removeEventListener('message', on); f(v); };
    const on = ev => {
      const d = ev.data;
      if (ev.source !== window.parent || ev.origin !== CLOUD_ORIGIN || !d || d.source !== 'aimadegames-platform' || d.type !== 'leaderboard-session' || d.requestId !== id) return;
      if (d.error || d.apiOrigin !== CLOUD_ORIGIN || !d.session || !d.session.token) { done(rej, Error('session')); return; }
      BOARD.tok = d.session.token; BOARD.exp = Date.parse(d.session.expiresAt) || Date.now() + 3e6; done(res, BOARD.tok);
    };
    const tm = setTimeout(() => done(rej, Error('timeout')), 15000);
    window.addEventListener('message', on);
    try { window.parent.postMessage({ source: 'aimadegames', type: 'leaderboard-session', requestId: id }, CLOUD_ORIGIN); } catch (e) { done(rej, e); }
  });
}
async function boardApi(method, url, key, body) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = setTimeout(() => { try { ctl && ctl.abort(); } catch (e) {} }, 15000);
  const h = { Authorization: 'Bearer ' + BOARD.tok }; if (key) h['Idempotency-Key'] = key; if (body) h['Content-Type'] = 'application/json';
  try {
    const r = await fetch(CLOUD_ORIGIN + '/api/v1' + url, { method, headers: h, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', keepalive: !!body, signal: ctl ? ctl.signal : undefined });
    let d = null; try { d = await r.json(); } catch (e) {}
    if (r.status === 401) BOARD.tok = null;
    return { ok: r.ok, status: r.status, code: d && d.error && d.error.code || '', data: d, after: +r.headers.get('Retry-After') || 0 };
  } finally { clearTimeout(tm); }
}
const boardLater = (s, r) => { BOARD.wait = Date.now() + 1000 * Math.max(s, (r && r.after) || 0); };
// one step at a time: confirm a pending settlement, else open a run while playing
async function boardStep() {
  if (!BOARD.on || BOARD.busy || Date.now() < BOARD.wait) return;
  if (!BOARD.pend && (BOARD.run || state !== 'play')) return;
  BOARD.busy = true;
  try {
    try { await boardSession(); } catch (e) { boardLater(300); return; }   // not offered (signed out, an old player): try again later
    if (BOARD.pend) {
      const p = BOARD.pend, r = await boardApi('POST', '/runs/' + p.id + '/score', p.key, { score: p.score });
      if (r.ok) { BOARD.sent = p.score; BOARD.pend = null; if (r.data && r.data.rank) BOARD.rank = r.data.rank; }
      else if ([400, 404, 409, 410, 422].includes(r.status)) { BOARD.pend = null; if (r.code === 'BOARD_UNAVAILABLE') BOARD.on = false; }   // nothing a retry would fix
      else boardLater(r.status === 429 ? 60 : 30, r);
      return;
    }
    BOARD.runKey = BOARD.runKey || uuid();
    const r = await boardApi('POST', '/leaderboards/' + BOARD_ID + '/runs', BOARD.runKey);
    if (r.ok && r.data && r.data.runId) { BOARD.run = { id: r.data.runId, at: Date.now() }; BOARD.runKey = null; }
    else if (r.status === 404) BOARD.on = false;   // the board is switched off on 1GP
    else boardLater(r.status === 429 ? 60 : 30, r);
    if (!BOARD.me && BOARD.run) {   // the rank so far, once (it shows in the menu's rank board)
      BOARD.me = true; const m = await boardApi('GET', '/leaderboards/' + BOARD_ID + '/me?around=0');
      if (m.ok && m.data && m.data.entry && m.data.entry.rank) BOARD.rank = m.data.entry.rank;
    }
  } catch (e) { boardLater(30); } finally { BOARD.busy = false; }
}
// settle the open run with today's hearts (only when they grew; a run older than ~1.5 h is let go - 1GP drops it at 2 h)
function boardSettle() {
  if (!BOARD.on || !BOARD.run || BOARD.pend) return;
  const h = S.hearts | 0;
  if (h > BOARD.sent && h > 0 && h <= BOARD_MAX) { BOARD.pend = { id: BOARD.run.id, score: h, key: uuid() }; BOARD.run = null; BOARD.wait = 0; }
  else if (Date.now() - BOARD.run.at > 5.4e6) BOARD.run = null;
  boardStep();
}
function boardTick(dt) {
  if (!BOARD.on) return;
  BOARD.t += dt; if (BOARD.t >= BOARD_EVERY) { BOARD.t = 0; boardSettle(); }
  boardStep();
}
