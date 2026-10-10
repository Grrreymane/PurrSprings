// Endless-phase cadence model (after ★5), continuing from the end state of model.js (docs/design/economy.md section 10).
//   node endless.js [eager|casual|novice] [hours=8] [list]
// Income at ★5 comes from model.js (eager 4.0k / casual 3.1k / novice 2.0k per min, ~24 / 18 / 12% active).
// It grows with the functional tail (★5 pads in items_v2.js), gold stars (+5% fees, -3% spawn gap each), shrine levels (+1%)
// and plaza stalls (+1.5%). Purchases follow the guide: cheapest affordable visible pad; the 1,000,000 dream statue is never
// pointed at (bought only when the player has nothing else left to buy, or holds >= its price).
const ARGS = process.argv.slice(2), prof = ARGS[0] || 'eager', HOURS = +(ARGS[1] || 8);
const R = Math.round, hm = t => Math.floor(t / 3600) + 'h' + String(Math.floor(t % 3600 / 60)).padStart(2, '0');
const P = { eager: { inc: 4000, act: .24, part: .8, ovh: 5, hearts: 420 }, casual: { inc: 3070, act: .18, part: .5, ovh: 14, hearts: 380 }, novice: { inc: 1950, act: .12, part: .22, ovh: 35, hearts: 345 } }[prof];
// ---- functional tail = the ★5 pads of items_v2.js (+income share each)
const I = []; const it = (id, name, price, req, hearts, layer, zone, eff, minStar) => I.push({ id, name, price, req, hearts, eff: eff || {}, minStar });
eval(require('fs').readFileSync(__dirname + '/items_v2.js', 'utf8'));
const tailInc = x => x.eff.tier ? (x.eff.tier.lv === 3 ? .021 : .015) : x.eff.fac === 'pong' ? .02 : x.eff.fac === 'massage' ? .015 : x.eff.slots === 'pong' ? .01 : x.eff.staff ? .01 : 0;
const TAIL = I.filter(x => x.minStar === 5).map(x => ({ id: x.id, name: x.name, price: x.price, hearts: x.hearts, inc: tailInc(x), stand: 'tail', band: 0, req: x.req.filter(r => I.some(y => y.id === r && y.minStar === 5)) }));
// ---- boutique (杂货铺, 3 stands). band = price band: 0 opens at ★5, 1 at 金★1, 2 at 金★2, 3 at 金★3, 4 at 金★4 (or when the stand's lower bands are sold out)
const bandOf = p => p <= 12000 ? 0 : p <= 25000 ? 1 : p <= 45000 ? 2 : p <= 100000 ? 3 : 4;
const BOUT = [
  // 衣 stand: innkeeper outfits + staff uniforms
  ['o_yukata', '朝颜浴衣', 2000, '衣'], ['o_chef', '割烹着', 3000, '衣'], ['o_sakura', '樱花簪', 5000, '衣'], ['o_momiji', '红叶羽织', 6000, '衣'], ['o_snow', '雪国', 7000, '衣'],
  ['o_okami', '女将和服', 10000, '衣'], ['u_sakura', '樱色制服', 12000, '衣'], ['o_hakama', '书生袴', 14000, '衣'], ['u_indigo', '蓝染制服', 18000, '衣'], ['o_ninja', '忍者', 20000, '衣'],
  ['o_kitsune', '狐面', 25000, '衣'], ['u_sailor', '水手制服', 25000, '衣'], ['o_samurai', '武士', 35000, '衣'], ['u_gold', '金边制服', 60000, '衣'], ['o_maneki', '招财猫装', 88000, '衣'], ['o_king', '猫王', 150000, '衣'],
  // 景 stand: room themes (buy once, use in any room) + front noren / carpets + gold onsen
  ['d_noren_sakura', '樱暖帘', 4000, '景'], ['d_noren_red', '红暖帘', 5000, '景'], ['d_carpet_purple', '紫地毯', 6000, '景'], ['th_sakura', '樱之间', 8000, '景'], ['th_bamboo', '竹林之间', 9000, '景'],
  ['th_sea', '海之间', 10000, '景'], ['th_lantern', '灯笼之间', 10000, '景'], ['th_cattower', '猫爬架之间', 12000, '景'], ['th_kotatsu', '被炉之间', 14000, '景'], ['d_carpet_gold', '金地毯', 15000, '景'],
  ['th_starry', '星空之间', 16000, '景'], ['d_noren_gold', '金暖帘', 30000, '景'], ['th_gold', '金屏风之间', 40000, '景'], ['d_goldbath', '金汤', 250000, '景'],
  // 物 stand: ornaments + pets
  ['d_furin', '风铃', 3000, '物'], ['d_bonsai', '盆景', 4000, '物'], ['p_turtle', '乌龟', 6000, '物'], ['d_bambooLight', '竹灯', 8000, '物'], ['p_chick', '小鸡', 9000, '物'],
  ['p_duck', '小鸭', 12000, '物'], ['d_lanterns', '灯笼串', 15000, '物'], ['d_waterwheel', '水车', 18000, '物'], ['p_owl', '猫头鹰', 22000, '物'], ['d_sakura', '门前樱', 25000, '物'],
  ['p_shiba', '柴犬', 30000, '物'], ['d_maneki', '招财猫像', 35000, '物'], ['p_tanuki', '狸', 40000, '物'], ['d_bigcat', '招财巨像', 99999, '物'],
].map(([id, name, price, stand]) => ({ id, name, price, stand, band: bandOf(price), hearts: Math.max(2, R(price / 1000)), inc: 0, req: [] }));
// ---- other sinks: koi (escalating), shrine (10 levels, +1% each), plaza (gate + 4 stalls, +1.5% each), dream statue
const KOI = [2000, 3200, 5100, 8200, 13000, 21000, 33000, 54000].map((p, i) => ({ id: 'koi' + (i + 1), name: '锦鲤', price: p, stand: 'koi', band: 0, hearts: Math.max(2, R(p / 1000)), inc: 0, req: i ? ['koi' + i] : [] }));
const SHRINE = [10000, 20000, 35000, 50000, 70000, 90000, 120000, 160000, 220000, 300000].map((p, i) => ({ id: 'shrine' + (i + 1), name: '奉纳', price: p, stand: 'shrine', band: i ? 0 : 1, hearts: R(p / 1000), inc: .01, req: i ? ['shrine' + i] : [] }));
const PLAZA = [['plaza', '祭典', 20000, []], ['st_goldfish', '金鱼捞', 8000, ['plaza']], ['st_tako', '章鱼烧', 10000, ['plaza']], ['st_ice', '刨冰', 10000, ['plaza']], ['st_shateki', '射的', 15000, ['plaza']]]
  .map(([id, name, price, req]) => ({ id, name, price, stand: 'plaza', band: 1, hearts: R(price / 1000), inc: id === 'plaza' ? 0 : .015, req }));
const DREAM = { id: 'statue', name: '金招财猫像', price: 1000000, stand: 'dream', band: 0, hearts: 1000, inc: 0, req: [] };
const ALL = TAIL.concat(BOUT, KOI, SHRINE, PLAZA, [DREAM]);
const GOLD = [700, 1000, 1500, 2300, 3300, 4500];   // ♥ for 金★1..5, 皇冠
let hearts = P.hearts, gold = 0, money = 0, incMul = 1, t = 0, last = 0, fw = 0, fwPrice = 3000, fwCool = 0, fwSpent = 0;
const buys = [], goldT = [], owned = new Set();
for (t = 0; t < HOURS * 3600; t++) {
  const g = Math.min(gold, 6), gm = 1 + .05 * g, spawnB = 1 / (1 - .03 * g);
  const routine = P.inc * (1 - P.act) * incMul * gm * Math.min(1.2, spawnB), active = P.inc * P.act * gm;
  money += (routine + active) / 60;
  // service ♥ ~ calls + VIP + events (model.js ★5: ~5.2 ♥/min at part .8), + 1 per 20 guests after ★5 (~25 guests/min)
  hearts += (P.part / .8 * 5.2 + 25 / 20) / 60;
  while (gold < GOLD.length && hearts >= GOLD[gold]) { gold++; goldT.push(t); }
  if (fwCool > 0) fwCool--;
  if (t - last < P.ovh) continue;
  const standOpen = x => x.band <= gold || ALL.filter(y => y.stand === x.stand && y.band < x.band).every(y => owned.has(y.id));
  const vis = ALL.filter(x => !owned.has(x.id) && x.req.every(r => owned.has(r)) && standOpen(x) && x.stand !== 'dream');
  // each boutique stand shows only its cheapest open item
  const shown = vis.filter(x => !['衣', '景', '物'].includes(x.stand) || x === vis.filter(y => y.stand === x.stand).sort((a, b) => a.price - b.price)[0]);
  const c = shown.filter(x => money >= x.price).sort((a, b) => a.price - b.price)[0] || (!shown.length && money >= DREAM.price && !owned.has('statue') ? DREAM : null);
  if (c) { money -= c.price; owned.add(c.id); hearts += c.hearts; incMul += c.inc; buys.push({ t, id: c.id, name: c.name, stand: c.stand, gap: t - last, price: c.price }); last = t; continue; }
  // fireworks: repeatable sink, only when nothing shown is affordable within ~5 min of income, off cooldown
  const nextP = shown.length ? Math.min(...shown.map(x => x.price)) : Infinity, perMin = (routine + active);
  if (prof !== 'novice' && fwCool === 0 && money >= fwPrice && (nextP - money) > 5 * perMin) { money -= fwPrice; fwSpent += fwPrice; money += fwPrice * .5; hearts += 10; fw++; fwPrice = Math.min(6000, fwPrice + 500); fwCool = 480; }
}
const catN = buys.filter(b => b.stand !== 'tail').length;
console.log(`${prof}: ${buys.length} buys in ${HOURS}h (${catN} non-tail), fireworks ${fw} (${fwSpent} spent), gold ★ at ${goldT.map(hm).join(' ')} | ♥ ${R(hearts)} | money left ${R(money)} | income/min at end ${R(P.inc * incMul * (1 + .05 * Math.min(gold, 6)))}`);
for (const m of [600, 1800, 3600, 7200, 10800, 14400, 21600, 28800]) {
  if (m > HOURS * 3600) break;
  const b = buys.filter(x => x.t <= m), b2 = b.filter(x => x.t > m - (m <= 3600 ? m : 3600));
  console.log(`  by ${hm(m)}: ${b.length} buys (${b.filter(x => x.stand !== 'tail').length} non-tail) | longest gap so far ${R(Math.max(0, ...b.map(x => x.gap)) / 60)} min | spent ${R(b.reduce((a, x) => a + x.price, 0) / 1000)}k`);
}
const total = ALL.reduce((a, x) => a + x.price, 0), catTotal = ALL.filter(x => x.stand !== 'tail').reduce((a, x) => a + x.price, 0);
console.log(`  catalogue: ${ALL.filter(x => x.stand !== 'tail').length} items, ${R(catTotal / 1000)}k (boutique ${R(BOUT.reduce((a, x) => a + x.price, 0) / 1000)}k, koi ${R(KOI.reduce((a, x) => a + x.price, 0) / 1000)}k, shrine ${R(SHRINE.reduce((a, x) => a + x.price, 0) / 1000)}k, plaza ${R(PLAZA.reduce((a, x) => a + x.price, 0) / 1000)}k, statue 1000k); tail ${R((total - catTotal) / 1000)}k`);
const done = id => { const b = buys.find(x => x.id === id); return b ? hm(b.t) : '—'; };
console.log(`  milestones: first boutique ${hm((buys.find(x => ['衣', '景', '物'].includes(x.stand)) || { t: NaN }).t)} | tail done ${hm(Math.max(...buys.filter(x => x.stand === 'tail').map(x => x.t)))} | shrine10 ${done('shrine10')} | o_king ${done('o_king')} | d_goldbath ${done('d_goldbath')} | statue ${done('statue')}`);
if (ARGS.includes('list')) console.log('  ' + buys.map(b => hm(b.t) + ' ' + b.id).join(', '));
const left = ALL.filter(x => !owned.has(x.id)).map(x => x.id); if (left.length) console.log('  not bought: ' + left.join(','));
