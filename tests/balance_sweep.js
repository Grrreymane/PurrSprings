// Compare override sets side by side (one compact line per profile per set), 6 seeds each.
//   node D:/Minigame/Hotelgame/tests/balance_sweep.js "base" "set:basketStart:10" "cfg:A" ...
// Each argument is "base", "cfg:<name>", "set:<k:v,...>" or "cfg:<name>+<k:v,...>".
const { execFile } = require('child_process'), path = require('path');
const GAME = path.resolve(__dirname, '..'), HEADLESS = 'D:/Minigame/_workflow/tools/headless.js';
const N = +(process.env.SEEDS || 6), PROFILES = (process.env.PROFILES || 'eager,casual,novice,afk').split(','), MAXMIN = { eager: 45, casual: 70, novice: 100, afk: 70 };
const run = (p, s, cfg, set) => new Promise(res => {
  const args = [HEADLESS, GAME, 'tests/bot_balance.js', '--seed', String(s), '--', p, String(MAXMIN[p]), 'json', 'cfg=' + cfg];
  if (set) args.push('set=' + set);
  execFile('node', args, { cwd: GAME, maxBuffer: 1 << 26 }, (err, out) => {
    const line = String(out).split('\n').find(l => l.startsWith('{'));
    try { res(JSON.parse(line)); } catch (e) { res({ profile: p, error: String(out).slice(0, 300) }); }
  });
});
const med = a => { const b = a.filter(x => x !== null && x !== undefined && Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return NaN; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const mx = a => Math.max(...a);
const mmss = t => !Number.isFinite(t) ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const R = Math.round, pc = v => (v * 100).toFixed(1) + '%';
(async () => {
  const specs = process.argv.slice(2).length ? process.argv.slice(2) : ['base'];
  for (const spec of specs) {
    let cfg = 'base', set = '';
    if (spec.startsWith('cfg:')) { const [c, s] = spec.slice(4).split('+'); cfg = c; set = s || ''; } else if (spec.startsWith('set:')) set = spec.slice(4);
    const jobs = [];
    for (const p of PROFILES) for (let s = 1; s <= N; s++) jobs.push(run(p, s, cfg, set));
    const all = await Promise.all(jobs);
    console.log(`\n### ${spec}`);
    for (const p of PROFILES) {
      const rs = all.filter(r => r.profile === p);
      if (rs.some(r => r.error)) { console.log(p + ' ERROR ' + rs.find(r => r.error).error); continue; }
      const fins = rs.map(r => r.fin === null ? Infinity : r.fin), o = k => med(rs.map(r => r.onsenDip && r.onsenDip[k]));
      const inv = rs.filter(r => Object.keys(r.inv).length).length;
      console.log(`${p.padEnd(6)} ★5 ${mmss(med(fins))} [max ${mmss(mx(fins))}] r2 ${mmss(med(rs.map(r => r.unlockT.room2)))} | gap≤5m ${R(med(rs.map(r => r.gapEarly)))}/${R(mx(rs.map(r => r.gapEarly)))} >5m ${R(med(rs.map(r => r.gapLate)))}/${R(mx(rs.map(r => r.gapLate)))} | no-earn ${R(mx(rs.map(r => r.maxGap)))} act ${R(mx(rs.map(r => r.maxActiveGap)))} | angry ${pc(med(rs.map(r => r.angryRate)))}/${pc(mx(rs.map(r => r.angryRate)))} | starve ${R(med(rs.map(r => r.starve)))}(first3m ${R(med(rs.map(r => r.starve3)))} porter ${R(med(rs.map(r => r.starvePorter)))}) give ${R(med(rs.map(r => r.giveTowel)))} | qEmpty ${pc(med(rs.map(r => r.qEmptyPct)))} | $ ${R(med(rs.map(r => r.avgMoney)))}+${R(med(rs.map(r => r.avgPiles)))} | onsen made ${R(o('before'))}>${R(o('after'))}>${R(o('after2'))} ck ${o('ckB')}>${o('ckA')} hold ${R(o('holdB'))}>${R(o('holdA'))}${inv ? ' | INV FAIL ' + inv : ''}`);
    }
  }
})();
