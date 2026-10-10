const { execFile } = require('child_process');
// Runs tests/econ_measure.js for every profile x seed in parallel and prints per-star medians (docs/design/economy.md section 1).
//   node D:/Minigame/Hotelgame/tests/econ_all.js [seeds=6] [profiles=eager,casual,novice,afk]
const path = require('path'), GAME = path.resolve(__dirname, '..'), HEADLESS = 'D:/Minigame/_workflow/tools/headless.js';
const N = +(process.argv[2] || 6), profiles = (process.argv[3] || 'eager,casual,novice,afk').split(',');
const run = (p, s) => new Promise(res => execFile('node', [HEADLESS, GAME, 'tests/econ_measure.js', '--seed', String(s), '--', p, '10', 'json'], { cwd: GAME, maxBuffer: 1 << 26 }, (e, out) => {
  const l = String(out).split('\n').find(x => x.startsWith('{')); try { res(JSON.parse(l)); } catch (er) { res({ profile: p, error: String(out).slice(0, 300) }); } }));
const med = a => { const b = a.filter(x => x !== null && x !== undefined && Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const mmss = t => t == null ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
(async () => {
  const jobs = []; for (const p of profiles) for (let s = 1; s <= N; s++) jobs.push(run(p, s));
  const all = await Promise.all(jobs);
  for (const p of profiles) {
    const rs = all.filter(r => r.profile === p && !r.error);
    console.log(`\n== ${p} (${rs.length} seeds) ★5 med ${mmss(med(rs.map(r => r.fin)))}`);
    for (const k of ['★1', '★2', '★3', '★4', 'post']) {
      const ss = rs.map(r => r.seg[k]).filter(Boolean); if (!ss.length) continue;
      const m = f => med(ss.map(f));
      const acts = {}; ss.forEach(s => Object.keys(s.act).forEach(a => acts[a] = 1));
      const actS = Object.keys(acts).map(a => a + ' ' + m(s => s.act[a] || 0) + '%').join(', ');
      const srcS = ['room', 'tip', 'bath', 'milk'].map(a => a + ' ' + m(s => s.srcPct[a]) + '%').join(' ');
      console.log(`  ${k}: dur ${m(s => s.dur)}s, buys ${m(s => s.nBuy)}, gap mean ${m(s => s.gapMean)} max ${m(s => s.gapMax)} | income/min ${m(s => s.incomePerMin)} (${srcS}) | held ${m(s => s.avgMoney)} + piles ${m(s => s.avgPiles)} | drought ${m(s => s.droughtPct)}% affordable-but-not-bought ${m(s => s.affordPct)}% | ≥2 pads ${m(s => s.choicePct)}% vis ${m(s => s.visPads)} | pickups/min ${m(s => s.pickupsPerMin)} avg ${m(s => s.avgPickup)}`);
      console.log(`      act: ${actS}`);
      const ph = {}; ss.forEach(s => Object.keys(s.phys).forEach(x => ph[x] = 1));
      console.log(`      body: ${Object.keys(ph).map(x => x + ' ' + m(s => s.phys[x] || 0) + '%').join(', ')} | buys: ${ss[0].buys}`);
    }
  }
})();
