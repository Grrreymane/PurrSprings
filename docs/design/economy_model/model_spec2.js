// SPEC_v2 variant of model.js: VIP only from ★4 (every 210/180 s), no luggage income, C3/C4 are VIP suites (not guest rooms). Run: node model_spec2.js all items=items_spec2.js h3=0 h4=0 h5=0 noevents
// Coarse economy model for docs/design/economy.md (NOT the game): calibrates v2 prices before the real bots exist.
// Income model is fitted to the v1 bot measurements (v1 eager: 80 / 240 / 410 / 660 / 980 fish per min at ★1..★5);
// `node model.js all v1` replays the v1 table and lands within ~1 min of the real bots (eager ★5 17:58 vs 18:31).
//   node model.js [eager|casual|novice|afk|minimal|all] [v = timeline] [table] [v1] [noevents] [items=items_v2.js]
const ARGS = process.argv.slice(2);
const R = Math.round, mmss = t => t == null ? '--' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');

// ------------------------------------------------------------------ data (mirrors the doc tables)
// base fees per star (v1 STARS + new columns). meal = 早饭, lug = 行李小费 (family / VIP guests), pong / massage / shop per use
const STARS = [null,
  { room: 12, tip: 5, bath: 6,  milk: 4,  meal: 8,  lug: 10, pong: 5, massage: 5, shop: 8,  gap: 7 },
  { room: 14, tip: 5, bath: 9,  milk: 5,  meal: 8,  lug: 10, pong: 5, massage: 5, shop: 8,  gap: 6 },
  { room: 16, tip: 6, bath: 10, milk: 6,  meal: 10, lug: 12, pong: 6, massage: 6, shop: 9,  gap: 5 },
  { room: 20, tip: 8, bath: 12, milk: 8,  meal: 12, lug: 15, pong: 7, massage: 7, shop: 10, gap: 4.2 },
  { room: 25, tip: 10, bath: 15, milk: 10, meal: 15, lug: 20, pong: 8, massage: 8, shop: 12, gap: 3.6 },
];
// star requirements: key facility + ♥ (人气)
const STAR_REQ = [null, null, { key: 'onsen', hearts: 20 }, { key: 'dining', hearts: +(ARGS.find(a => a.startsWith('h3=')) || 'h3=74').slice(3) }, { key: 'garden', hearts: +(ARGS.find(a => a.startsWith('h4=')) || 'h4=145').slice(3) }, { key: 'roten', hearts: +(ARGS.find(a => a.startsWith('h5=')) || 'h5=245').slice(3) }];
const GUEST_MIX = [1, 1, 1, 1.05, 1.10, 1.15];   // couples / elders in 和室 (world doc 6.2); family + VIP-type guests go to cottages (×1.8)
// active income knobs (economy.md 4.2 / section 15)
const CALL_MULT = 3, CALL_CAP = [0, 0, 2.0, 2.5, 3.0, 3.5], VIP_MULT = 20, VIP_EVERY = [0, 0, 0, 1e12, 210, 180], EVENT_MULT = 25, EVENT_EVERY = 300;
const HEART = { call: 1, vip: 3, event: 3 };   // service ♥ (no passive ♥ before ★5)
const I = [];
const it = (id, name, price, req, hearts, layer, zone, eff, minStar, pad) => I.push({ id, name, price, req, hearts, layer, zone, eff: eff || {}, minStar: minStar || 1, pad });
eval(require('fs').readFileSync(__dirname + '/' + (ARGS.find(s => s.startsWith('items=')) || 'items=items_v2.js').slice(6), 'utf8'));
if (ARGS.includes('v1')) {
  I.length = 0;
  const V1 = [['room2',25,[],'room'],['room3',35,['room2'],'room'],['shoes1',35,['room2']],['onsen',50,['room3']],['room4',180,['onsen'],'room'],['recep',55,['onsen'],0,'recep'],['basket1',80,['onsen']],['milk',200,['onsen']],['maid1',120,['recep'],0,'maid'],['room5',320,['room4'],'room'],['room6',370,['room5'],'room'],['shoes2',340,['shoes1','room5']],['porter',430,['maid1','milk'],0,'porter'],['basket2',370,['basket1','porter']],['room7',500,['room6'],'room'],['room8',570,['room7'],'room'],['maid2',600,['room7','maid1'],0,'maid'],['bigbath',720,['room8']],['shoes3',570,['shoes2','room8']],['sign',1100,['bigbath','maid2']]];
  for (const [id, p, req, rm, st] of V1) it(id, id, p, req, 0, 'M', '', Object.assign(rm ? { room: 'wa' } : {}, st ? { staff: st } : {}, id === 'onsen' ? { fac: 'bath' } : {}, id === 'milk' ? { fac: 'milk' } : {}, id === 'bigbath' ? { slots: 'bath' } : {}));
  STAR_REQ[2] = { key: 'onsen', hearts: 0 }; STAR_REQ[3] = { key: 'room6', hearts: 0 }; STAR_REQ[4] = { key: 'room8', hearts: 0 }; STAR_REQ[5] = { key: 'sign', hearts: 0 };
}
const ITEM = {}; I.forEach(x => { ITEM[x.id] = x; });
for (const x of I) for (const r of x.req) if (!ITEM[r]) throw new Error('bad req ' + r + ' in ' + x.id);

// ------------------------------------------------------------------ economy model
const V1MODE = ARGS.includes('v1'), EVENTS = !ARGS.includes('noevents');
const PROF = {
  eager:   { part: .8,  overhead: 5,  collect: 1,   helpClean: 1,  label: 'eager' },
  casual:  { part: .5,  overhead: 14, collect: .85, helpClean: .6, label: 'casual' },
  novice:  { part: .22, overhead: 35, collect: .6,  helpClean: .3, label: 'novice' },
  afk:     { part: .8,  overhead: 5,  collect: 1,   helpClean: 1,  label: 'afk', afk: 600 },
  minimal: { part: .8,  overhead: 5,  collect: 1,   helpClean: 1,  label: 'minimal', minimal: true },   // never buys S layer / room tiers unless ♥ blocks a star
};
function run(pname) {
  const pf = PROF[pname];
  const U = new Set(['room1']); let money = 0, hearts = 4, t = 0, star = 1, earned = 0, act = 0, cool = 0, afkStart = null;
  const buys = [], starT = { 1: 0 }, src = {};
  const has = id => U.has(id);
  const WA = ['room1', 'room2', 'room3', 'room4', 'room5', 'room6', 'room7', 'room8', 'w1', 'w2', 'w3'];
  const cots = () => (has('garden') ? 1 : 0) + ['c2'].filter(has).length;
  const tierOf = r => has('t3_' + r) ? 2.2 : has('t2_' + r) ? 1.5 : 1;
  const staffN = r => I.filter(x => has(x.id) && x.eff.staff === r).length;
  const add = (k, v) => { src[k] = (src[k] || 0) + v; };
  function income(afkNow) {
    const s = STARS[star];
    const wa = V1MODE ? 1 + ['room2', 'room3', 'room4', 'room5', 'room6', 'room7', 'room8'].filter(has).length : WA.filter(r => r === 'room1' || has(r)).length;
    const cot = V1MODE ? 0 : cots(), nRooms = wa + cot;
    const gap = V1MODE ? s.gap : Math.max(1.8, s.gap * Math.min(1, 9 / nRooms));          // spawn scales with rooms (world doc 6.4)
    const spawn = 60 / gap, capRooms = wa * 3.0 + cot * 2.4;
    let eff = .88 * (has('recep') ? 1 : (afkNow ? .2 : .8 + .2 * (pf.part - .8)));
    const maidsNeed = Math.max(1, (wa + 2 * cot) / 5), help = afkNow ? 0 : pf.helpClean * (star <= 2 ? 1 : .5);
    eff *= .8 + .2 * Math.min(1, (staffN('maid') + help) / maidsNeed);
    const G = Math.min(spawn, capRooms) * eff;                                               // guests per minute
    const cotShare = V1MODE ? 0 : cot * 2.4 / capRooms;
    const waT = V1MODE ? (() => { let up = 0; return 1; })() : WA.filter(r => r === 'room1' || has(r)).reduce((a, r) => a + tierOf(r), 0) / wa;
    const cotT = cot ? ['c1', 'c2', 'c3', 'c4'].filter((c, i) => i === 0 ? has('garden') : has(c)).reduce((a, c) => a + (has('t3_' + c) ? 2.2 : 1.5), 0) / cot : 0;
    const mix = V1MODE ? 1 : GUEST_MIX[star];
    const Q = V1MODE ? 1 : (waT * wa + cotT * cot) / nRooms;                                   // inn quality: mean tier multiplier of open rooms
    const roomFee = (s.room + s.tip) * ((1 - cotShare) * waT * mix + cotShare * cotT * 1.8);
    const out = { room: roomFee };
    // onsen + 星见汤 (towels: porter, or the player)
    let bathShare = 0;
    if (has('onsen')) {
      const capOn = (has('bigbath') ? 5 : 3) * 60 / 13, capRo = has('roten') ? 6 * 60 / 15 : 0;
      const towel = has('porter') ? 1 : afkNow ? .35 : (.85 + .15 * pf.part);
      bathShare = Math.min(1, (capOn + capRo) / G) * towel;
      const roShare = capRo / (capOn + capRo);
      out.bath = bathShare * s.bath * ((1 - roShare) * (has('bigbath') ? 1.5 : 1) + roShare * 1.5);
      if (has('milk')) out.milk = bathShare * s.milk;
    }
    if (has('dining')) {   // seats 4 (+2 per table), ~4 diners/min/seat; cooking 24/min (chef 60); serving = waiters 15/min each or the player
      const seats = 4 + 2 * ['table3', 'table4'].filter(has).length, prod = has('chef') ? 60 : 24;
      const serve = staffN('waiter') * 15 + (afkNow ? 0 : pf.part * 9);
      out.meal = Math.min(1, Math.min(seats * 4, prod, serve) / G) * s.meal;
    }
    if (has('shop')) out.shop = .35 * s.shop;
    if (false) out.lug = cotShare * s.lug * (has('bellhop') ? 1 : afkNow ? .5 : .5 + .5 * pf.part);
    if (has('pingpong')) out.pong = .4 * bathShare * .7 * s.pong * (has('pingpong2') ? 1.6 : 1);
    if (has('massage')) out.massage = .25 * bathShare * s.massage;
    const routine = {}; let rSum = 0;
    for (const k in out) { routine[k] = G * out[k] * pf.collect / 60; rSum += routine[k]; }
    // active (player-only): calls / VIP / events / ping-pong rallies
    const active = {}; let aSum = 0, heartsMin = 0;
    if (!afkNow && !V1MODE) {
      const kinds = ['tea', 'milk', 'meal'].filter(w => I.some(x => has(x.id) && x.eff.call === w)).length;
      if (kinds) {
        const gen = Math.min(CALL_CAP[star], .25 * G) * [0, .6, .85, 1][kinds], done = gen * Math.min(1, pf.part * 1.06);
        active.call = done * CALL_MULT * s.room * Q * (1 + .5 * .8 * pf.part) / 60; heartsMin += done * HEART.call;
      }
      if (star >= 4) { const done = Math.min(1, pf.part * 1.1); active.vip = done * VIP_MULT * s.room * Q / VIP_EVERY[star]; heartsMin += done * HEART.vip * 60 / VIP_EVERY[star]; }
      if (star >= 3 && EVENTS) { const ok = Math.min(1, pf.part * 1.1); active.event = ok * EVENT_MULT * s.room * Q / EVENT_EVERY; heartsMin += ok * HEART.event * 60 / EVENT_EVERY; }
      if (has('pingpong')) active.rally = pf.part * .25 * 1.5 * s.room / 60;
      for (const k in active) aSum += active[k];
    }
    return { routine, active, rSum, aSum, G, heartsMin };
  }
  const visible = x => !has(x.id) && x.req.every(has) && star >= x.minStar;
  const starOK = n => { const q = STAR_REQ[n]; return q && has(q.key) && hearts >= q.hearts; };
  const perStar = {};
  let lastBuy = 0, finT = null, heartBlock = 0;
  const END = 90 * 60;
  for (t = 0; t < END; t++) {
    if (pf.afk && afkStart === null && has('maid1')) afkStart = t;
    const afkNow = pf.afk && afkStart !== null && t < afkStart + pf.afk;
    const inc = income(afkNow);
    const gain = inc.rSum + inc.aSum;
    money += gain; earned += gain; act += inc.aSum; hearts += inc.heartsMin / 60;
    for (const k in inc.routine) add(k, inc.routine[k]); for (const k in inc.active) add(k, inc.active[k]);
    const ps = perStar[star] || (perStar[star] = { t: 0, inc: 0, act: 0, buys: 0, src: {} }); ps.t++; ps.inc += gain; ps.act += inc.aSum;
    for (const k in inc.routine) ps.src[k] = (ps.src[k] || 0) + inc.routine[k]; for (const k in inc.active) ps.src[k] = (ps.src[k] || 0) + inc.active[k];
    while (star < 5 && starOK(star + 1)) { star++; starT[star] = t; }
    if (star === 5 && finT === null) finT = t;
    const q = STAR_REQ[star + 1];
    if (q && has(q.key) && hearts < q.hearts) heartBlock++;
    if (cool > 0) { cool--; continue; }
    if (afkNow) continue;
    // target (= the guide): star key first; ♥ short with the key bought → best ♥ per fish; else cheapest
    let vis = I.filter(visible);
    const heartsShort = q && has(q.key) && hearts < q.hearts;
    if (pf.minimal && !heartsShort) vis = vis.filter(x => !x.id.startsWith('dec_') && !x.eff.tier);
    let target = null;
    if (q) {
      if (!has(q.key) && visible(ITEM[q.key]) && money >= ITEM[q.key].price) target = ITEM[q.key];
      else if (heartsShort) { const hv = I.filter(visible).filter(x => x.hearts > 0).sort((a, b) => a.price / a.hearts - b.price / b.hearts); if (hv[0] && money >= hv[0].price) target = hv[0]; }
    }
    if (!target) { const c = vis.filter(x => money >= x.price).sort((a, b) => a.price - b.price); target = c[0] || null; }
    if (target) {
      money -= target.price; U.add(target.id); hearts += target.hearts; cool = pf.overhead;
      buys.push({ id: target.id, t, gap: t - lastBuy, star }); lastBuy = t; ps.buys++;
    }
    if (finT !== null && t > finT + 60) break;
  }
  return { pname, buys, starT, finT, perStar, actShare: act / Math.max(1, earned), hearts: R(hearts), money: R(money), src, earned, heartBlock, left: I.filter(x => !has(x.id)).map(x => x.id) };
}
if (!V1MODE) for (let n = 3; n <= 5; n++) { const pre = I.filter(x => x.minStar < n), hv = pre.reduce((a, x) => a + x.hearts, 4); console.log(`H2 ★${n}: ♥ need ${STAR_REQ[n].hearts} (max ${Math.floor(hv / 1.2)}), pads before ★${n} give ${hv} (+${R((hv / STAR_REQ[n].hearts - 1) * 100)}%) ${hv >= 1.2 * STAR_REQ[n].hearts ? 'OK' : 'FAIL'} | cost of ★${n - 1} pads ${pre.filter(x => x.minStar === n - 1).reduce((a, x) => a + x.price, 0)}`); }
const which = ARGS[0] || 'all';
const names = which === 'all' ? ['eager', 'casual', 'novice', 'afk', 'minimal'] : [which];
const pct = (a, b) => R(a / Math.max(1e-9, b) * 100);
for (const n of names) {
  const r = run(n);
  const pre = r.buys.filter(b => r.finT == null || b.t <= r.finT);
  const g2 = pre.filter(b => b.star >= 2).map(b => b.gap).sort((a, b) => a - b);
  const q = p => g2[Math.min(g2.length - 1, Math.floor(g2.length * p))];
  console.log(`== ${n}: ★5 ${mmss(r.finT)} | ${Object.entries(r.starT).map(([k, v]) => '★' + k + ' ' + mmss(v)).join(' ')} | buys to ★5 ${pre.length} | ★2+ gap med ${q(.5)} p90 ${q(.9)} max ${g2[g2.length - 1]} | active ${pct(r.actShare, 1)}% | ♥ ${r.hearts} | ♥-blocked ${r.heartBlock}s`);
  for (const k in r.perStar) { const p = r.perStar[k]; console.log(`   ★${k}: ${mmss(p.t)} income/min ${R(p.inc / p.t * 60)} active ${pct(p.act, p.inc)}% buys ${p.buys}${p.buys ? ' (every ' + R(p.t / p.buys) + ' s)' : ''}` + (ARGS.includes('src') ? ' | ' + Object.entries(p.src).sort((a, b) => b[1] - a[1]).map(([q, v]) => q + ' ' + pct(v, p.inc) + '%').join(' ') : '')); }
  console.log('   sources: ' + Object.entries(r.src).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + pct(v, r.earned) + '%').join(', '));
  if (ARGS.includes('v')) console.log('   ' + r.buys.map(b => mmss(b.t) + ' ' + b.id + '(' + b.gap + ')').join(', '));
  if (r.left.length && ARGS.includes('v')) console.log('   not bought: ' + r.left.join(','));
}
if (ARGS.includes('table')) {
  const runs = { eager: run('eager'), casual: run('casual') }, when = (rr, id) => { const b = rr.buys.find(x => x.id === id); return b ? mmss(b.t) : '—'; };
  console.log('\n| id | 名 | 价 | 前置 | ♥ | 层 | 区 | 出现 | 圈 | 模型 勤快 / 普通 |');
  for (const x of I) console.log(`| ${x.id} | ${x.name} | ${x.price} | ${x.req.join(', ') || '—'} | ${x.hearts || ''} | ${x.layer}${STAR_REQ.some(s => s && s.key === x.id) ? '★' : ''} | ${x.zone} | ★${x.minStar} | ${x.pad ? '(' + x.pad + ')' : ''} | ${when(runs.eager, x.id)} / ${when(runs.casual, x.id)} |`);
  const sum = I.reduce((a, x) => a + x.price, 0); console.log('total', sum, 'items', I.length);
  for (let n = 1; n <= 5; n++) console.log(`★${n} pads: ${I.filter(x => x.minStar === n).length}, cost ${I.filter(x => x.minStar === n).reduce((a, x) => a + x.price, 0)}`);
}
