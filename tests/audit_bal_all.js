// AUDIT COPY of tests/balance_all.js (2026-10-10): runs tests/audit_bal_bot.js (bot=... to change), keeps every run's full
// report (out=file.json) and prints the audit block (activity mix, new-content cadence, endless loop, boutique, lines).
// SPEC_v2 14.1 / 14.2: runs tests/bot_balance.js for every profile x seed in parallel and prints the medians against
// the 14.2 targets, plus the cross-run metrics: A3 (ignore vs eager) and A4 (afk income in its 10 hands-off minutes vs
// afkref - the same seed played on from the same moment, buying nothing - in the same minutes; stage 4, see SPEC_v2 18.2).
//   node D:/Minigame/Hotelgame/tests/balance_all.js [cfg] [set=key:val,...] [seeds=12] [profiles=eager,casual,...] [game=dir] [j=N] [raw] [json]
// Exit 1 when any run fails an invariant or doesn't reach star 5.
const { execFile } = require('child_process'), path = require('path'), os = require('os');
const GAME = path.resolve(__dirname, '..'), HEADLESS = 'D:/Minigame/_workflow/tools/headless.js';
const argv = process.argv.slice(2), A = k => { const a = argv.find(s => s.startsWith(k + '=')); return a ? a.slice(k.length + 1) : null; };
const cfg = argv.find(s => !s.includes('=') && s !== 'raw' && s !== 'json' && s !== 'quiet') || 'base', BOT = A('bot') || 'tests/audit_bal_bot.js', OUT = A('out'), POSTA = A('post'), set = A('set'), N = +(A('seeds') || 12);
const profiles = (A('profiles') || 'eager,casual,novice,afk,afkref,ignore,shopper').split(',');
if (profiles.includes('afk') && !profiles.includes('afkref')) profiles.push('afkref');   // A4's reference
const GDIR = A('game') ? path.resolve(A('game')) : GAME, J = +(A('j') || Math.max(2, os.cpus().length - 2));
const run = (p, s) => new Promise(res => {
  const args = [HEADLESS, GDIR, BOT, '--seed', String(s), '--', p, '0', 'json', 'cfg=' + cfg];
  if (set) args.push('set=' + set);
  if (POSTA && p === 'shopper') args.push('post=' + POSTA);
  execFile('node', args, { cwd: GAME, maxBuffer: 1 << 28 }, (err, out) => {
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
    tgt.push(ok(MIX ? mx(M(m => m.C1.max)) <= .35 : null, 'C1 <=35%'), ok(MIX ? med(M(m => m.C2)) >= .25 : null, 'C2 >=25%'), ok(MIX ? mx(M(m => m.C3.share)) <= .5 : null, 'C3 <=50%'), ok(mx(M(m => m.C4)) <= .05, 'C4 <=5%'), ok(ATT ? med(M(m => m.C5)) >= 4 && med(M(m => m.C5)) <= 8 : null, 'C5 4-8/min'));
    console.log(`  D1 active income ★3 ${P2(med(M(m => m.D1.s3)))} ★4 ${P2(med(M(m => m.D1.s4)))} ★5 ${P2(med(M(m => m.D1.s5)))} | D2 ★5 income/min ${R(med(M(m => m.D2)))}`);
    if (p === 'eager') { const d3 = med(M(m => m.D1.s3)), d4 = med(M(m => m.D1.s4)), d5 = med(M(m => m.D1.s5)), d2 = med(M(m => m.D2)); tgt.push(ok(d3 >= .15 && d3 <= .3 && d4 >= .2 && d4 <= .35 && (d5 === null || d5 >= .15), 'D1'), ok(d2 === null ? null : d2 >= 2500 && d2 <= 4500, 'D2 2500-4500')); }
    console.log(`  E1 calls done ${P2(med(M(m => m.E1.done)))} fast ${P2(med(M(m => m.E1.fast)))} | E2 hungry no-chef ${P2(med(M(m => m.E2.noChef)))} two waiters ${P2(med(M(m => m.E2.twoWaiters)))} | E3 VIP ${R(med(M(m => m.E3.used)))} s f ${med(M(m => m.E3.f))} income ${P2(med(M(m => m.E3.share)))} (left ${rs.reduce((a, r) => a + r.M.E3.left, 0)}/${rs.reduce((a, r) => a + r.M.E3.came, 0)}) | E4 first combo ${mmss(med(M(m => m.E4.firstCombo)))} combo rooms ★5 ${med(M(m => m.E4.rooms5))} | E5 angry ${P2(med(M(m => m.E5)))} max ${P2(mx(M(m => m.E5)))}`);
    // E1 (stage 4, 18.2): done >= 80 % / >= 45 % for eager / casual; the fast share 40-60 % is the eager rhythm (casual,
    // half as quick to answer, sits near 30-40 % for any fast window that keeps eager under 60 %; printed)
    if (p === 'eager' || p === 'casual') tgt.push(ok(med(M(m => m.E1.done)) >= (p === 'eager' ? .8 : .45), 'E1 done'), ok(p === 'eager' ? med(M(m => m.E1.fast)) >= .4 && med(M(m => m.E1.fast)) <= .6 : null, 'E1 fast 40-60%'));
    if (p === 'eager') tgt.push(ok(med(M(m => m.E2.noChef)) <= .25, 'E2 no chef <=25%'), ok(med(M(m => m.E2.twoWaiters)) <= .05, 'E2 2 waiters <=5%'),
      ok(med(M(m => m.E3.used)) >= 60 && med(M(m => m.E3.used)) <= 100 && med(M(m => m.E3.f)) >= .85 && med(M(m => m.E3.share)) <= .15, 'E3'),
      ok(med(M(m => m.E4.firstCombo)) >= 240 && med(M(m => m.E4.firstCombo)) <= 420 && med(M(m => m.E4.rooms5)) >= 6, 'E4'));
    if (p !== 'afk') tgt.push(ok(mx(M(m => m.E5)) < (p === 'novice' ? .12 : .08), 'E5'));
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
    if (p === 'afk') { const a4 = rs.map(r => r.A4), al = rs.map(r => r.A4lit); s.A4 = med(a4); console.log(`  A4 afk income in its 10 hands-off minutes ÷ afkref (same seed, same inn, same minutes): med ${P2(med(a4))} [${P2(mn(a4))}-${P2(mx(a4))}] | ÷ eager (inn still growing): med ${P2(med(al))}`); tgt.push(ok(s.A4 === null ? null : s.A4 >= .45 && s.A4 <= .65, 'A4 45-65%')); }
    if (p === 'afkref') tgt.length = 0;   // a reference run for A4, no targets of its own
    console.log('  targets: ' + tgt.join(' | '));
    for (const t of tgt) if (t.startsWith('NO ')) missed.push(p + ': ' + t.slice(3));
    if (argv.includes('raw')) for (const r of rs) console.log(`  s${r.seed}: ★5 ${mmss(r.fin)} ★2 ${mmss(r.M.A1.s2)} ★3 ${mmss(r.M.A1.s3)} ★4 ${mmss(r.M.A1.s4)} | B1 ${R(r.M.B1.med)}/${R(r.M.B1.p90)}/${R(r.M.B1.max)} B3 ${r.M.B3.max} | C1 ${P2(r.M.C1.max)} C2 ${P2(r.M.C2)} C3 ${r.M.C3.kind} ${P2(r.M.C3.share)} C4 ${P2(r.M.C4)} | D1 ${P2(r.M.D1.s3)}/${P2(r.M.D1.s4)}/${P2(r.M.D1.s5)} D2 ${R(r.M.D2)} | E1 ${P2(r.M.E1.done)} E5 ${P2(r.M.E5)} | F2 ${P2(r.M.F2.ok)} jumps ${r.M.F2.many}/${r.M.F2.flip}${r.A4 !== undefined ? ' | A4 ' + P2(r.A4) : ''}`);
  }
  if (sum.ignore && sum.eager) { const a3 = sum.ignore.fin / sum.eager.fin; console.log(`\nA3 ignore ★5 ÷ eager ★5 (medians): ${a3.toFixed(2)} ${ok(a3 <= 1.4, 'A3 <=1.4')}`); if (a3 > 1.4) missed.push('A3'); }
  console.log(missed.length ? 'TARGETS NOT MET (' + missed.length + '): ' + missed.join(' | ') : 'TARGETS: every 14.2 target that applies is met');
  console.log(`\n${bad ? 'BALANCE RUNS FAILED: ' + bad + ' run(s) with an error, an invariant failure or no star 5' : 'ALL RUNS OK: every profile reached star 5 on every seed, invariants OK'}`);
  if (argv.includes('json')) console.log(JSON.stringify({ cfg, set, seeds: N, sum, runs: all.map(r => ({ profile: r.profile, seed: r.seed, fin: r.fin, M: r.M, inv: r.inv, afk: r.afk, A4: r.A4, A4lit: r.A4lit })) }));
  // ---------------------------------------------------------------- audit block
  if (OUT) require('fs').writeFileSync(OUT, JSON.stringify({ cfg, set, seeds: N, runs: all }));
  if (!argv.includes('quiet')) {
    console.log('\n######## AUDIT');
    const segN = { s2: '★2', s3: '★3', s4: '★4', p1: '★5+0-60m', p2: '★5+60-120m', p3: '★5+2-4h' };
    for (const p of profiles) {
      const rs = by(p).filter(r => r.AUD); if (!rs.length || p === 'afkref') continue;
      console.log(`\n== ${p}`);
      // activity mix (arrow kind while following), medians over seeds
      const cats = ['money', 'buy', 'serve', 'vip', 'decor', 'chores', 'none', 'pour', 'here'];
      for (const s of Object.keys(segN)) { const ms = rs.map(r => r.AUD.mix[s]).filter(Boolean); if (!ms.length) continue;
        console.log(`  mix ${segN[s].padEnd(11)} ` + cats.map(c => c + ' ' + P2(med(ms.map(m => m[c] || 0)))).join(' | ')); }
      // new-content cadence
      for (const s of ['s2to5', 's2', 's3', 's4', 'p1', 'p2', 'p3']) { const ns = rs.map(r => r.AUD.novel[s]).filter(Boolean); if (!ns.length) continue;
        console.log(`  new ${s.padEnd(6)} n ${med(ns.map(n => n.n))} (${med(ns.map(n => n.perMin))}/min) gap med ${R(med(ns.map(n => n.med)))} s max med ${R(med(ns.map(n => n.max)))} worst ${R(mx(ns.map(n => n.max)))} s`); }
      { const rm = rs.map(r => r.AUD.rooms5).filter(Boolean); if (rm.length) { const cs = {}; for (const x of rm) for (const [k, n] of Object.entries(x.combos)) (cs[k] = cs[k] || []).push(n);
        console.log(`  rooms at ★5: open ${med(rm.map(x => x.open))}, bare ${med(rm.map(x => x.bare))}, decor only ${med(rm.map(x => x.decor))}, combo rooms by combo (med): ` + Object.entries(cs).map(([k, ns]) => k + ' ' + med(ns.concat(Array(rm.length - ns.length).fill(0)))).join(', ')); } }
      console.log(`  incremental buys ★2→★5: ${med(rs.map(r => r.AUD.incr.n))} of ${med(rs.map(r => r.AUD.incr.of))}`);
      if (p === 'shopper' || rs.some(r => r.AUD.post.length > 4)) {
        const B = Math.max(...rs.map(r => r.AUD.post.length));
        for (let i = 0; i < B; i++) { const bs = rs.map(r => r.AUD.post[i]).filter(Boolean); if (bs.length < rs.length / 2) break;
          const shop = bs.map(b => b.shop.length), gold = bs.map(b => b.gold.length);
          console.log(`  post +${String(bs[0].m).padStart(3)}m inc/min ${R(med(bs.map(b => b.incMin)))} | shop ${med(shop)} (sum ${shop.reduce((a, b) => a + b, 0)}) | gold ${gold.reduce((a, b) => a + b, 0)} | vips ${med(bs.map(b => b.vips))} | combos ${gold.length ? bs.reduce((a, b) => a + b.combos, 0) : 0} | money ${R(med(bs.map(b => b.money)))} | no-arrow ${P2(med(bs.map(b => b.none)))} | lines/min ${(med(bs.map(b => b.lines)) / 15).toFixed(1)}`); }
        const items = {}; for (const r of rs) for (const x of r.AUD.shop) (items[x.id] = items[x.id] || []).push(x);
        console.log('  boutique (at = min after ★5, mins = price ÷ income/min before it):');
        for (const [id, xs] of Object.entries(items).sort((a, b) => med(a[1].map(x => x.at)) - med(b[1].map(x => x.at))))
          console.log(`    ${id.padEnd(10)} ${String(xs[0].price).padStart(7)}  bought ${xs.length}/${rs.length}  at ${mmss(med(xs.map(x => x.at)))}  inc/min ${R(med(xs.map(x => x.incMin)))}  = ${med(xs.map(x => x.mins))} min of income`);
        const sa = rs.map(r => r.AUD.statueAt).filter(x => x !== null);
        console.log(`  end: statue paid med ${R(med(rs.map(r => r.AUD.statue)))} / 1,000,000${sa.length ? ' (bought ' + sa.length + '/' + rs.length + ' at med ' + mmss(med(sa)) + ' after ★5)' : ''} | money ${R(med(rs.map(r => r.AUD.money)))} | ♥ at ★5 ${R(med(rs.map(r => r.AUD.hearts5)))} → end ${R(med(rs.map(r => r.AUD.hearts)))} | gold★ ${med(rs.map(r => r.AUD.gold))}`);
        const ge = {}; for (const r of rs) for (const [k, t] of Object.entries((r.M.G || {}).gold || {})) (ge[k] = ge[k] || []).push(t);
        console.log('  gold★ lit (min after ★5, med / max): ' + Object.entries(ge).map(([k, ts]) => k + ': ' + mmss(med(ts)) + ' / ' + mmss(mx(ts)) + ' (' + ts.length + '/' + rs.length + ')').join(' | '));
      }
      for (const s of ['pre5', 'p1', 'p2']) { const ls = rs.map(r => r.AUD.lines[s]).filter(Boolean); if (!ls.length) continue;
        const top = {}; for (const l of ls) for (const t of l.top) { const [k, n] = t.split(':'); top[k] = (top[k] || 0) + +n; }
        console.log(`  lines ${s.padEnd(4)} ${med(ls.map(l => l.perMin))}/min, distinct ${med(ls.map(l => l.distinct))}, top-3 share ${P2(med(ls.map(l => l.topShare)))} | most said (all seeds): ${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => k + ' ' + n).join(', ')}`); }
      { const big = []; for (const r of rs) { const t2 = r.M.A1.s2; if (t2 === null || t2 === undefined) continue; const b = Object.entries(r.unlockT).filter(([id, t]) => r.fin !== null && t <= r.fin && !/^h_|^p_|^statue$/.test(id)).sort((a, b) => a[1] - b[1]);
          let p = t2, pid = '★2'; for (const [id, t] of b) { if (t <= t2) { pid = id; continue; } if (t - p > 120) big.push(`s${r.seed} ${R(t - p)}s ${pid}→${id} @${mmss(p)}`); p = t; pid = id; } }
        if (big.length) console.log(`  gaps >120 s ★2→★5 (${big.length}): ` + big.sort((a, b) => +b.split(' ')[1].slice(0, -1) - +a.split(' ')[1].slice(0, -1)).slice(0, 8).join(' | ')); }
      { const bs = rs.map(r => r.AUD.b2).filter(Boolean); if (bs.length) { const w = bs.slice().sort((a, b) => b.gapMax - a.gapMax)[0];
        console.log(`  longest gap split: worst ${w.gapMax} s = ${w.poorInMax} s too poor for any pad + ${w.richInMax} s with a pad affordable | longest "too poor" stretch med ${R(med(bs.map(b => b.poorRun)))} max ${R(mx(bs.map(b => b.poorRun)))} s`); } }
      if (rs.some(r => r.AUD.sakura)) console.log(`  receptionist tidied (b2c) med ${med(rs.map(r => r.AUD.sakura))} rooms`);
    }
  }
  process.exitCode = bad ? 1 : 0;
})();
