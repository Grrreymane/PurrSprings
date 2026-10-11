// SPEC_v2 14.1 / 14.2: runs tests/bot_balance.js for every profile x seed in parallel and prints the medians against
// the 14.2 targets, plus the cross-run metrics: A3 (ignore vs eager) and A4 (afk income in its 10 hands-off minutes vs
// afkref - the same seed played on from the same moment, buying nothing - in the same minutes; stage 4, see SPEC_v2 18.2).
//   node D:/Minigame/Hotelgame/tests/balance_all.js [cfg] [set=key:val,...] [seeds=12] [profiles=eager,casual,...] [game=dir] [j=N] [raw] [json]
// Exit 1 when any run fails an invariant or doesn't reach star 5.
// v2.0.1 (SPEC_v2 18.2, the user's v2.0 feedback): calls are the tea runner's job (G3) and the net pulls every pile in
// reach (G5), so C2 counts serving / the VIP / decor (>= 15 %), C5 is an upper bound on pick-ups (<= 14 / min), D1 and the
// E1 fast share are printed only, E1 done counts the calls since the runner was hired, E3 takes 40-100 s (G1: the VIP
// is led step by step and a quicker visit tips more), A4 45-80 % (G3: the calls - most of what playing added over idling
// at star 2 - are the runner's now; cleaning, towels and the desk are what is left).
const { execFile } = require('child_process'), path = require('path'), os = require('os');
const GAME = path.resolve(__dirname, '..'), HEADLESS = 'D:/Minigame/_workflow/tools/headless.js';
const argv = process.argv.slice(2), A = k => { const a = argv.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const cfg = argv.find(s => !s.includes('=') && s !== 'raw' && s !== 'json') || 'base', set = A('set'), N = +(A('seeds') || 12);
const profiles = (A('profiles') || 'eager,casual,novice,afk,afkref,ignore,shopper').split(',');
if (profiles.includes('afk') && !profiles.includes('afkref')) profiles.push('afkref');   // A4's reference
const GDIR = A('game') ? path.resolve(A('game')) : GAME, J = +(A('j') || Math.max(2, os.cpus().length - 2));
const run = (p, s) => new Promise(res => {
  const args = [HEADLESS, GDIR, 'tests/bot_balance.js', '--seed', String(s), '--', p, '0', 'json', 'cfg=' + cfg];
  if (set) args.push('set=' + set);
  execFile('node', args, { cwd: GAME, maxBuffer: 1 << 27 }, (err, out) => {
    const line = String(out).split('\n').find(l => l.startsWith('{'));
    try { res(Object.assign(JSON.parse(line), { seed: s })); } catch (e) { res({ profile: p, seed: s, error: String(out).slice(0, 600) }); }
  });
});
const med = a => { const b = a.filter(x => x !== null && x !== undefined && Number.isFinite(x)).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const fin = a => a.filter(x => x !== null && x !== undefined && Number.isFinite(x));
const mx = a => fin(a).length ? Math.max(...fin(a)) : null, mn = a => fin(a).length ? Math.min(...fin(a)) : null;
const mmss = t => t === null || t === undefined || !Number.isFinite(t) ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const R = x => x === null || x === undefined ? '--' : Math.round(x), P2 = x => x === null || x === undefined ? '--' : (x * 100).toFixed(0) + '%';
const ok = (c, s) => (c === null || c === undefined ? '-- ' : c ? 'ok ' : 'NO ') + s;
const missed = [];   // targets not met (profile: target)
(async () => {
  const jobs = []; for (const p of profiles) for (let s = 1; s <= N; s++) jobs.push([p, s]);
  const all = []; let next = 0;
  await Promise.all(Array.from({ length: Math.min(J, jobs.length) }, async () => { while (next < jobs.length) { const [p, s] = jobs[next++]; all.push(await run(p, s)); } }));
  all.sort((a, b) => a.seed - b.seed);
  console.log(`cfg=${cfg}${set ? ' set=' + set : ''}  (${N} seeds, game ${GDIR})`);
  let bad = 0; const sum = {};
  const by = p => all.filter(r => r.profile === p && !r.error);
  for (const p of profiles) {
    const rs = by(p), errs = all.filter(r => r.profile === p && r.error);
    if (errs.length) { bad += errs.length; console.log(`\n== ${p} ERRORS: ` + errs.map(e => 's' + e.seed + ': ' + e.error).join(' / ')); }
    if (!rs.length) continue;
    const M = k => rs.map(r => k(r.M)), f5 = rs.map(r => r.fin === null ? Infinity : r.fin), reached = f5.filter(Number.isFinite).length;
    const invs = rs.filter(r => Object.keys(r.inv || {}).length);
    bad += invs.length + rs.length - reached;
    const s = sum[p] = { fin: med(f5), reached, n: rs.length, inv: invs.length };
    console.log(`\n== ${p}: ★5 med ${mmss(med(f5))} [${mmss(mn(f5))}-${reached < rs.length ? 'NOT' : mmss(mx(f5))}]  reached ${reached}/${rs.length} | ★2 ${mmss(med(M(m => m.A1.s2)))} ★3 ${mmss(med(M(m => m.A1.s3)))} ★4 ${mmss(med(M(m => m.A1.s4)))}`);
    console.log(`  invariants ${invs.length ? 'FAIL ' + invs.map(r => 's' + r.seed + ':' + JSON.stringify(r.inv)).join(' ') : 'OK'} | stuck-replans ${rs.reduce((a, r) => a + r.stuckN, 0)} | unreachable ${rs.reduce((a, r) => a + r.M.F2.unreach, 0)} | menus checked ${rs.reduce((a, r) => a + r.menus, 0)}`);
    const tgt = [];
    if (p === 'eager') tgt.push(ok(med(f5) >= 1260 && med(f5) <= 1620, 'A1 ★5 21-27m'), ok(med(M(m => m.A1.s2)) >= 105 && med(M(m => m.A1.s2)) <= 160, '★2 1:45-2:40'), ok(med(M(m => m.A1.s3)) >= 450 && med(M(m => m.A1.s3)) <= 660, '★3 7:30-11'), ok(med(M(m => m.A1.s4)) >= 840 && med(M(m => m.A1.s4)) <= 1140, '★4 14-19'));
    if (p === 'casual') tgt.push(ok(mx(f5) <= 2160, 'A2 all ★5 <=36m'));
    if (p === 'novice') tgt.push(ok(mx(f5) <= 3480, 'A2 all ★5 <=58m'));
    console.log(`  B1 gaps ★2→★5: med ${R(med(M(m => m.B1.med)))} p90 ${R(med(M(m => m.B1.p90)))} max ${R(mx(M(m => m.B1.max)))} s (first 5 min max ${R(mx(M(m => m.B1.first5max)))}) | B3 max ${R(mx(M(m => m.B3.max)))} s | no-earn while following max ${R(mx(rs.map(r => r.maxActive)))} s`);
    if (p === 'eager') tgt.push(ok(med(M(m => m.B1.med)) <= 30 && med(M(m => m.B1.p90)) <= 50 && mx(M(m => m.B1.max)) <= 90, 'B1'), ok(mx(M(m => m.B1.first5max)) <= 45, 'B1 first 5m'));
    if (p === 'casual') tgt.push(ok(mx(M(m => m.B1.max)) <= 120, 'B2 <=120s'));
    if (p === 'novice') tgt.push(ok(mx(M(m => m.B1.max)) <= 180, 'B2 <=180s'));
    // stage 4 (SPEC_v2 18.2): the targets that describe what an attentive player sees - the news rhythm (B3), the arrow's
    // mix (C1-C3) and the pick-up rate (C5) - are not checked for novice (by its definition half its time is off-task
    // and 30 % of its decisions ignore the arrow: long gaps, slow trips and few pick-ups are the bot, not the inn), and
    // the arrow's mix not for ignore (it skips calls / VIPs / decor by definition, so piles and pads are what is left).
    // Their numbers are still printed above; '--' marks a target that does not apply.
    const ATT = p !== 'novice', MIX = ATT && p !== 'ignore';
    tgt.push(ok(ATT ? mx(M(m => m.B3.max)) <= 150 : null, 'B3 <=150s'));
    const c3 = {}; rs.forEach(r => { if (r.M.C3.kind) c3[r.M.C3.kind] = (c3[r.M.C3.kind] || 0) + 1; });
    console.log(`  C1 pile med ${P2(med(M(m => m.C1.max)))} max ${P2(mx(M(m => m.C1.max)))} | C2 active ${P2(med(M(m => m.C2)))} | C3 top kind ${Object.entries(c3).map(([k, n]) => k + '×' + n).join(' ')} share med ${P2(med(M(m => m.C3.share)))} max ${P2(mx(M(m => m.C3.share)))} | C4 null ${P2(med(M(m => m.C4)))} max ${P2(mx(M(m => m.C4)))} | C5 pickups/min ${med(M(m => m.C5))}`);
    tgt.push(ok(MIX ? mx(M(m => m.C1.max)) <= .35 : null, 'C1 <=35%'), ok(MIX ? med(M(m => m.C2)) >= .15 : null, 'C2 >=15%'), ok(MIX ? mx(M(m => m.C3.share)) <= .5 : null, 'C3 <=50%'), ok(mx(M(m => m.C4)) <= .05, 'C4 <=5%'), ok(ATT ? med(M(m => m.C5)) <= 14 : null, 'C5 <=14/min'));
    console.log(`  D1 active income ★3 ${P2(med(M(m => m.D1.s3)))} ★4 ${P2(med(M(m => m.D1.s4)))} ★5 ${P2(med(M(m => m.D1.s5)))} | D2 ★5 income/min ${R(med(M(m => m.D2)))}`);
    if (p === 'eager') { const d2 = med(M(m => m.D2)); tgt.push(ok(d2 === null ? null : d2 >= 2500 && d2 <= 4500, 'D2 2500-4500')); }   // D1: printed only (v2.0.1 G3)
    console.log(`  E1 calls done since the runner ${P2(med(M(m => m.E1.done)))} (runner ${R(med(M(m => m.E1.staff)))}, self-served ${R(med(M(m => m.E1.self)))}, hired ${mmss(med(M(m => m.E1.hireAt)))}; innkeeper before it ${P2(med(M(m => m.E1.pre)))}) fast ${P2(med(M(m => m.E1.fast)))} | VIP wait max ${R(mx(M(m => m.E3.waitMax)))} s | E2 hungry no-chef ${P2(med(M(m => m.E2.noChef)))} two waiters ${P2(med(M(m => m.E2.twoWaiters)))} | E3 VIP ${R(med(M(m => m.E3.used)))} s f ${med(M(m => m.E3.f))} income ${P2(med(M(m => m.E3.share)))} (left ${rs.reduce((a, r) => a + r.M.E3.left, 0)}/${rs.reduce((a, r) => a + r.M.E3.came, 0)}) | E4 first combo ${mmss(med(M(m => m.E4.firstCombo)))} combo rooms ★5 ${med(M(m => m.E4.rooms5))} | E5 angry ${P2(med(M(m => m.E5)))} max ${P2(mx(M(m => m.E5)))}`);
    // E1 (v2.0.1 G3): the calls since the tea runner was hired, brought by anyone: >= 80 % for every profile that plays
    // (afk included - it is the runner's job); the fast share is printed only (the runner has no fast bonus)
    if (p !== 'afkref') tgt.push(ok(med(M(m => m.E1.done)) >= .8, 'E1 done'));
    if (p === 'eager') tgt.push(ok(med(M(m => m.E2.noChef)) <= .25, 'E2 no chef <=25%'), ok(med(M(m => m.E2.twoWaiters)) <= .05, 'E2 2 waiters <=5%'),
      ok(med(M(m => m.E3.used)) >= 40 && med(M(m => m.E3.used)) <= 100 && med(M(m => m.E3.f)) >= .85 && med(M(m => m.E3.share)) <= .15, 'E3'),
      ok(med(M(m => m.E4.firstCombo)) >= 240 && med(M(m => m.E4.firstCombo)) <= 420 && med(M(m => m.E4.rooms5)) >= 6, 'E4'));
    if (p !== 'afk') tgt.push(ok(mx(M(m => m.E5)) < (p === 'novice' ? .12 : .08), 'E5'));
    { const v = rs.map(r => r.v21).filter(Boolean), st = v.flatMap(x => x.press.map(p => +String(p)[0])), aw = {}; v.forEach(x => x.awards.forEach(a => { const k = a.replace(/♥.*/, ''); aw[k] = (aw[k] || 0) + 1; }));   // v2.1 core A
      console.log(`  v2.1 festivals all lit ${v.reduce((a, x) => a + x.festOk, 0)}/${v.reduce((a, x) => a + x.fests, 0)} | press stars ${[1, 2, 3, 4, 5].map(n => n + '★×' + st.filter(x => x === n).length).join(' ')} | awards ${Object.entries(aw).map(([k, n]) => k + '×' + n).join(' ') || '-'} | mom ${v.reduce((a, x) => a + x.mom, 0)} | seasonal combos med ${med(v.map(x => x.seasonal))}`); }
    console.log(`  F1 lines/min ${med(M(m => m.F1))} | F2 ok med ${P2(med(M(m => m.F2.ok)))} min ${P2(mn(M(m => m.F2.ok)))} | jumps/run ${R(med(M(m => m.F2.jumps)))}, >3 in 5 s ${R(med(M(m => m.F2.many)))} (max ${R(mx(M(m => m.F2.many)))}), A-B-A ${R(med(M(m => m.F2.flip)))} | H1 pads on screen max ${mx(M(m => m.H1.max))} (shop ${mx(M(m => m.H1.shop))})`);
    tgt.push(ok(med(M(m => m.F1)) >= 4 && med(M(m => m.F1)) <= 8, 'F1 4-8/min'), ok(mn(M(m => m.F2.ok)) >= .95, 'F2 >=95%'), ok(mx(M(m => m.H1.max)) <= 4, 'H1'));
    if (p === 'shopper') {
      console.log(`  G1 first hat med ${mmss(med(M(m => m.G && m.G.firstHat)))} max ${mmss(mx(M(m => m.G && m.G.firstHat)))} | G2 1st hour ${med(M(m => m.G && m.G.hour))} pieces (min ${mn(M(m => m.G && m.G.hour))}), gap med ${mmss(med(M(m => m.G && m.G.gapMed)))} max ${mmss(mx(M(m => m.G && m.G.gapMax)))} | G3 gold★1 ${mmss(med(M(m => m.G && m.G.gold[1])))} gold★3 ${mmss(med(M(m => m.G && m.G.gold[3])))} | G4 seconds with nothing to buy ${rs.reduce((a, r) => a + (r.M.G4 || 0), 0)}`);
      tgt.push(ok(mx(M(m => m.G && m.G.firstHat)) <= 180, 'G1 <=3m'), ok(mn(M(m => m.G && m.G.hour)) >= 7 && med(M(m => m.G && m.G.gapMed)) <= 480 && mx(M(m => m.G && m.G.gapMax)) <= 900, 'G2'),
        ok(med(M(m => m.G && m.G.gold[1])) <= 900 && med(M(m => m.G && m.G.gold[3])) <= 6000, 'G3'), ok(rs.every(r => !r.M.G4), 'G4'));
    }
    // A4: the afk bot's income in its 10 hands-off minutes ÷ afkref's in the same minutes (same seed: the two are the same
    // run up to that moment; afkref plays on and buys nothing, so both have the same inn). A4lit = ÷ eager, whose inn
    // keeps growing (the stage 3 reading; printed for reference, see SPEC_v2 18.2 stage 4)
    if (p === 'afk') for (const r of rs) if (r.afk) {
      const f = by('afkref').find(x => x.seed === r.seed && x.afk && x.afk.from === r.afk.from);
      r.A4 = f && f.afk.inc ? r.afk.inc / f.afk.inc : null;
      const e = by('eager').find(x => x.seed === r.seed); let ei = null;
      if (e && e.inc30) { ei = 0; const a = Math.floor(r.afk.from / 30), b = Math.floor(r.afk.to / 30); for (let i = a; i < b; i++) ei += e.inc30[i] || 0; }
      r.A4lit = ei ? r.afk.inc / ei : null;
    }
    if (p === 'afk') { const a4 = rs.map(r => r.A4), al = rs.map(r => r.A4lit); s.A4 = med(a4); console.log(`  A4 afk income in its 10 hands-off minutes ÷ afkref (same seed, same inn, same minutes): med ${P2(med(a4))} [${P2(mn(a4))}-${P2(mx(a4))}] | ÷ eager (inn still growing): med ${P2(med(al))}`); tgt.push(ok(s.A4 === null ? null : s.A4 >= .45 && s.A4 <= .8, 'A4 45-80%')); }
    if (p === 'afkref') tgt.length = 0;   // a reference run for A4, no targets of its own
    console.log('  targets: ' + tgt.join(' | '));
    for (const t of tgt) if (t.startsWith('NO ')) missed.push(p + ': ' + t.slice(3));
    if (argv.includes('raw')) for (const r of rs) console.log(`  s${r.seed}: ★5 ${mmss(r.fin)} ★2 ${mmss(r.M.A1.s2)} ★3 ${mmss(r.M.A1.s3)} ★4 ${mmss(r.M.A1.s4)} | B1 ${R(r.M.B1.med)}/${R(r.M.B1.p90)}/${R(r.M.B1.max)} B3 ${r.M.B3.max} | C1 ${P2(r.M.C1.max)} C2 ${P2(r.M.C2)} C3 ${r.M.C3.kind} ${P2(r.M.C3.share)} C4 ${P2(r.M.C4)} | D1 ${P2(r.M.D1.s3)}/${P2(r.M.D1.s4)}/${P2(r.M.D1.s5)} D2 ${R(r.M.D2)} | E1 ${P2(r.M.E1.done)} E5 ${P2(r.M.E5)} | F2 ${P2(r.M.F2.ok)} jumps ${r.M.F2.many}/${r.M.F2.flip}${r.A4 !== undefined ? ' | A4 ' + P2(r.A4) : ''}`);
  }
  if (sum.ignore && sum.eager) { const a3 = sum.ignore.fin / sum.eager.fin; console.log(`\nA3 ignore ★5 ÷ eager ★5 (medians): ${a3.toFixed(2)} ${ok(a3 <= 1.4, 'A3 <=1.4')}`); if (a3 > 1.4) missed.push('A3'); }
  console.log(missed.length ? 'TARGETS NOT MET (' + missed.length + '): ' + missed.join(' | ') : 'TARGETS: every 14.2 target that applies is met');
  console.log(`\n${bad ? 'BALANCE RUNS FAILED: ' + bad + ' run(s) with an error, an invariant failure or no star 5' : 'ALL RUNS OK: every profile reached star 5 on every seed, invariants OK'}`);
  if (argv.includes('json')) console.log(JSON.stringify({ cfg, set, seeds: N, sum, runs: all.map(r => ({ profile: r.profile, seed: r.seed, fin: r.fin, M: r.M, inv: r.inv, afk: r.afk, A4: r.A4, A4lit: r.A4lit, unlockT: r.unlockT, v21: r.v21 })) }));
  process.exitCode = bad ? 1 : 0;
})();
