// The 1GP hearts board (src/core/board.js) against a fake REST API: a run opens in play, a settlement sends the current
// hearts once, a failed settlement is retried unchanged, refused ones are dropped, a switched-off board stops it all.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_board.js --seed 1
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const tick = () => new Promise(r => setTimeout(r, 0));
const calls = []; let reply = {};
globalThis.fetch = async (url, o) => {
  const path = url.replace(CLOUD_ORIGIN + '/api/v1', ''), body = o.body ? JSON.parse(o.body) : null;
  calls.push({ path, method: o.method, key: o.headers['Idempotency-Key'], auth: o.headers.Authorization, body });
  const kind = /\/runs$/.test(path) ? 'run' : /\/score$/.test(path) ? 'score' : 'me';
  const r = (reply[kind] || (() => ({ status: 200, data: {} })))(body);
  return { ok: r.status < 300, status: r.status, json: async () => r.data, headers: { get: () => null } };
};
boardSession = () => { BOARD.tok = 'tok'; return Promise.resolve('tok'); };   // the platform's handshake, faked
let runN = 0;
reply.run = () => ({ status: 201, data: { runId: 'r' + (++runN) } });
reply.me = () => ({ status: 200, data: { entry: { rank: 7 }, neighbors: [] } });
reply.score = b => ({ status: 200, data: { accepted: true, rank: 3, submittedScore: b.score } });
const settle = async () => { boardSettle(); for (let i = 0; i < 6; i++) { await tick(); boardStep(); } };
(async () => {
  newGame(); BOARD.on = true;
  boardTick(.1); for (let i = 0; i < 6; i++) await tick();
  ok(BOARD.run && BOARD.run.id === 'r1' && BOARD.rank === 7, 'a run opens in play, the rank so far is read: ' + JSON.stringify(BOARD));
  ok(calls[0].path === '/leaderboards/' + BOARD_ID + '/runs' && calls[0].key && calls[0].auth === 'Bearer tok', 'run request');
  // nothing earned: no settlement
  S.hearts = 0; await settle(); ok(!calls.some(c => c.path.endsWith('/score')), 'no score while hearts are 0');
  // 3 min of play with hearts: one score with the total, then the next run
  S.hearts = 50; for (let i = 0; i < 1800; i++) boardTick(.1); for (let i = 0; i < 8; i++) { await tick(); boardStep(); }
  const sc = calls.filter(c => c.path.endsWith('/score'));
  ok(sc.length === 1 && sc[0].path === '/runs/r1/score' && sc[0].body.score === 50, 'settled with 50: ' + JSON.stringify(sc));
  ok(BOARD.sent === 50 && BOARD.rank === 3 && BOARD.run && BOARD.run.id === 'r2', 'receipt kept, next run open');
  // unchanged hearts: no new score
  await settle(); ok(calls.filter(c => c.path.endsWith('/score')).length === 1, 'same hearts, no resend');
  // a failed settlement is retried with the same run, score and key
  S.hearts = 80; reply.score = () => ({ status: 503, data: { error: { code: 'SERVICE_UNAVAILABLE' } } });
  await settle(); const f1 = calls.filter(c => c.path.endsWith('/score')).pop();
  S.hearts = 95; reply.score = b => ({ status: 200, data: { rank: 2, submittedScore: b.score } }); BOARD.wait = 0;
  for (let i = 0; i < 6; i++) { await tick(); boardStep(); }
  const f2 = calls.filter(c => c.path.endsWith('/score')).pop();
  ok(f1 !== f2 && f2.key === f1.key && f2.path === f1.path && f2.body.score === 80 && BOARD.sent === 80 && BOARD.rank === 2, 'retry unchanged: ' + JSON.stringify([f1, f2]));
  // a refused settlement (already settled / expired) is dropped, the game goes on
  reply.score = () => ({ status: 409, data: { error: { code: 'ALREADY_SUBMITTED' } } });
  await settle(); ok(!BOARD.pend && BOARD.sent === 80, 'refused score dropped');
  // the board switched off on 1GP: everything stops
  BOARD.run = null; reply.run = () => ({ status: 404, data: { error: { code: 'BOARD_UNAVAILABLE' } } });
  boardStep(); for (let i = 0; i < 4; i++) await tick();
  ok(!BOARD.on, 'board off'); const n = calls.length; for (let i = 0; i < 2000; i++) boardTick(.1); await tick(); ok(calls.length === n, 'no calls once off');
  // the menu shows the 1GP rank in the player's row without breaking the page
  BOARD.rank = 12; state = 'menu'; MENU.page = 'inn'; MENU.sel = null; render();
  ok(TQ.some(t => t.s === '1GP #12'), 'rank in the menu');
  console.log(errs.length ? 'SYS BOARD FAIL\n  ' + errs.join('\n  ') : 'SYS BOARD OK');
  if (errs.length) process.exitCode = 1;
})().catch(e => { console.log('TEST ERROR: ' + (e && e.stack || e)); process.exitCode = 1; });
