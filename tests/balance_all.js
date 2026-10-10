// Runs tests/bot_balance.js for every profile x seed in parallel and prints medians (SPEC 7 targets).
//   node D:/Minigame/Hotelgame/tests/balance_all.js [cfg] [set=key:val,...] [seeds=6] [profiles=eager,casual,novice,afk] [raw]
const { execFile } = require('child_process'), path = require('path');
const GAME = path.resolve(__dirname, '..'), HEADLESS = 'D:/Minigame/_workflow/tools/headless.js';
const argv = process.argv.slice(2), A = k => { const a = argv.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const cfg = argv.find(s => !s.includes('=') && s !== 'raw') || 'base', set = A('set'), N = +(A('seeds') || 6);
const profiles = (A('profiles') || 'eager,casual,novice,afk').split(',');
const MAXMIN = { eager: 45, casual: 70, novice: 90, afk: 70 };
const run = (p, s) => new Promise(res => {
  const args = [HEADLESS, GAME, 'tests/bot_balance.js', '--seed', String(s), '--', p, String(MAXMIN[p] || 60), 'json', 'cfg=' + cfg];
  if (set) args.push('set=' + set);
  execFile('node', args, { cwd: GAME, maxBuffer: 1 << 26 }, (err, out) => {
    const line = String(out).split('\n').find(l => l.startsWith('{'));
    try { res(JSON.parse(line)); } catch (e) { res({ profile: p, error: String(out).slice(0, 400) }); }
  });
});
const med = a => { const b = a.filter(x => x !== null && x !== undefined && Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const mx = a => Math.max(...a.filter(Number.isFinite)), mn = a => Math.min(...a.filter(Number.isFinite));
const mmss = t => t === null || t === undefined || !Number.isFinite(t) ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const R = Math.round;
(async () => {
  const jobs = [];
  for (const p of profiles) for (let s = 1; s <= N; s++) jobs.push(run(p, s).then(r => Object.assign(r, { seed: s })));
  const all = await Promise.all(jobs);
  console.log(`cfg=${cfg}${set ? ' set=' + set : ''}  (${N} seeds)`);
  for (const p of profiles) {
    const rs = all.filter(r => r.profile === p);
    const errs = rs.filter(r => r.error); if (errs.length) { console.log(p + ' ERRORS: ' + errs.map(e => e.error).join(' / ')); continue; }
    const fins = rs.map(r => r.fin === null ? Infinity : r.fin);
    const ids = ['room2', 'room3', 'shoes1', 'onsen', 'recep', 'basket1', 'room4', 'milk', 'maid1', 'room5', 'shoes2', 'room6', 'porter', 'basket2', 'room7', 'room8', 'shoes3', 'maid2', 'bigbath', 'sign'];
    const tl = ids.map(id => ({ id, t: med(rs.map(r => r.unlockT[id])) })).filter(x => x.t !== null).sort((a, b) => a.t - b.t);
    const cnt = (arr) => { const c = {}; arr.forEach(x => { c[x] = (c[x] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + (v > 1 ? '×' + v : '')).join(' '); };
    console.log(`\n== ${p}: ★5 med ${mmss(med(fins))} [${mmss(mn(fins))}-${fins.some(f => !Number.isFinite(f)) ? 'NOT' : mmss(mx(fins))}]  reached ${fins.filter(Number.isFinite).length}/${rs.length}`);
    console.log(`  timeline: ${tl.map(x => mmss(x.t) + ' ' + x.id).join(', ')}`);
    console.log(`  unlock gap ≤5m: med ${R(med(rs.map(r => r.gapEarly)))} max ${R(mx(rs.map(r => r.gapEarly)))} (${cnt(rs.map(r => r.gapEarlyAt))}) | >5m: med ${R(med(rs.map(r => r.gapLate)))} max ${R(mx(rs.map(r => r.gapLate)))} (${cnt(rs.map(r => r.gapLateAt))})`);
    console.log(`  no-earn: med ${R(med(rs.map(r => r.maxGap)))} max ${R(mx(rs.map(r => r.maxGap)))}s | active no-earn max ${R(mx(rs.map(r => r.maxActiveGap)))}s | angry after recep med ${(med(rs.map(r => r.angryRate)) * 100).toFixed(1)}% max ${(mx(rs.map(r => r.angryRate)) * 100).toFixed(1)}% (all ${(med(rs.map(r => r.angryAll)) * 100).toFixed(1)}%)`);
    console.log(`  unspent: money ${R(med(rs.map(r => r.avgMoney)))} + piles ${R(med(rs.map(r => r.avgPiles)))} | towel starve med ${R(med(rs.map(r => r.starve)))} max ${R(mx(rs.map(r => r.starve)))}s (first 3 min ${R(med(rs.map(r => r.starve3)))}s, after porter ${R(med(rs.map(r => r.starvePorter)))}s) (basket=0 ${R(med(rs.map(r => r.starveAny)))}s), gave up towel ${R(med(rs.map(r => r.giveTowel)))} slot ${R(med(rs.map(r => r.giveSlot)))}, bathed ${R(med(rs.map(r => r.bathed)))}`);
    const od = rs.filter(r => r.onsenDip);
    const o = k => med(od.map(r => r.onsenDip[k]));
    console.log(`  around onsen (2m before | 0-2m after | 2-4m after): made/min ${R(o('before'))} | ${R(o('after'))} | ${R(o('after2'))}; picked up/min ${R(o('colB'))} | ${R(o('colA'))} | ${R(o('colA2'))}; check-ins/min ${o('ckB')} | ${o('ckA')} | ${o('ckA2')}; room held s ${R(o('holdB'))} | ${R(o('holdA'))} | ${R(o('holdA2'))}`);
    console.log(`  front guest waiting: desk empty ${R(med(rs.map(r => r.deskIdle)))}s, no clean room ${R(med(rs.map(r => r.noRoom)))}s`);
    const invs = rs.filter(r => Object.keys(r.inv || {}).length);
    console.log(`  invariants ${invs.length ? 'FAIL ' + invs.map(r => 's' + r.seed + ':' + JSON.stringify(r.inv)).join(' ') : 'OK'} | stuck-replans ${rs.reduce((a, r) => a + r.stuckN, 0)} | unreachable targets ${rs.reduce((a, r) => a + r.unreach, 0)}`);
    if (p === 'afk') for (const r of rs) if (r.afk) {
      const a = r.afk;
      console.log(`  afk s${r.seed}: from ${mmss(a.from)} | +${a.guests} guests, ${a.angry} angry | gen ${R(a.genPerMin)}/min | piles at return ${a.pileSum} ${JSON.stringify(a.piles)} | basket ${a.basket} q ${a.queue} | collected 90% in ${a.collected === undefined ? '--' : R(a.collected) + 's'}`);
    }
    if (argv.includes('raw')) for (const r of rs) console.log(`  s${r.seed}: ★5 ${mmss(r.fin)} gaps ${R(r.gapEarly)}(${r.gapEarlyAt})/${R(r.gapLate)}(${r.gapLateAt}) earn-gap ${R(r.maxGap)}@${mmss(r.maxGapAt)} angry ${(r.angryRate * 100).toFixed(1)}% starve ${R(r.starve)} onsen ${JSON.stringify(r.onsenDip)} | ${Object.entries(r.unlockT).sort((a, b) => a[1] - b[1]).map(([k, v]) => mmss(v) + ' ' + k).join(', ')}`);
  }
})();
