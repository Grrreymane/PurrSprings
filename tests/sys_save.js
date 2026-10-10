// SPEC_v2 10: save v2 fields, sanitising, never wiping, v1 -> v2 migration rules.
//   node D:/Minigame/_workflow/tools/headless.js D:/Minigame/Hotelgame tests/sys_save.js
const errs = [], ok = (c, m) => { if (!c) errs.push(m); };
const ld = o => loadState(typeof o === 'string' ? JSON.parse(o) : JSON.parse(JSON.stringify(o)));
// defaults carry every v2 field
const d = defaults();
for (const k of ['peak', 'hearts', 'clock', 'day', 'dayLog', 'decor', 'combos', 'seen', 'album', 'gifts', 'equip', 'staff', 'vipNext', 'opts']) ok(k in d, 'defaults() lacks ' + k);
ok(d.v === 2 && d.clock === .12 && d.peak === 1 && d.opts.lines === true, 'defaults values');
for (const k of ['calls', 'callsFast', 'vips', 'diners', 'combosMade']) ok(d.stats[k] === 0, 'stats.' + k);
// a fresh v2 save survives a round trip unchanged
{ const s = ld(d); ok(JSON.stringify(s) === JSON.stringify(d), 'defaults round trip changed: ' + JSON.stringify(s)); }
// a full v2 save with every field in use
{
  const full = Object.assign(defaults(), {
    money: 1234, earned: 99999, peak: 4, hearts: 321, clock: .7, day: 12, dayLog: { g: 40, h: 33, best: 51 },
    unlocked: { room1: true, room2: true, room3: true, onsen: true, recep: true, shop: true, d_scroll: true, d_ikebana: true, h_straw: true, p_duck: true, garden: true, w1: true, dining: true, room7: true },
    rooms: { room1: 'messy', room2: 'occupied', room3: 'reserved', c1: 'messy', c3: 'clean' },
    decor: { 'room1:A': 'd_scroll', 'room1:B': 'd_ikebana', 'room2:A': 'd_tank', 'c3:A': 'd_scroll', 'room5:A': 'd_scroll', 'room3:C': 'd_scroll', 'w1:B': 'd_ikebana' },
    combos: { c_ga: 3, nope: 1 }, seen: { call: true, decor: true, xx: true }, gifts: ['kawa', 'nobody', 'ozeki'],
    album: { vip: { kawa: 2, ozeki: 'x', bogus: 4 }, photos: [{ v: 'kawa', d: 3, h: 'h_straw', p: 'p_shiba' }, { v: 'zzz' }, 7], furs: { white: true, plaid: true }, types: { elder: 1, alien: 1 } },
    equip: { hat: 'h_straw', pet: 'p_shiba' }, staff: { maid1: 25, ghost: 3 }, vipNext: 9, opts: { lines: false }, futureKey: { keep: 1 },
  });
  const s = ld(full);
  ok(s.money === 1234 && s.peak === 4 && s.hearts === 321 && s.clock === .7 && s.day === 12 && s.dayLog.best === 51, 'numbers kept');
  ok(JSON.stringify(s.decor) === JSON.stringify({ 'room1:A': 'd_scroll', 'room1:B': 'd_ikebana', 'w1:B': 'd_ikebana' }), 'decor sanitised: ' + JSON.stringify(s.decor));
  ok(JSON.stringify(s.combos) === '{"c_ga":3}' && JSON.stringify(s.seen) === '{"call":true,"decor":true}', 'combos / seen');
  ok(JSON.stringify(s.gifts) === '["kawa","ozeki"]', 'gifts ' + JSON.stringify(s.gifts));
  ok(JSON.stringify(s.album) === JSON.stringify({ vip: { kawa: 2 }, photos: [{ v: 'kawa', d: 3, h: 'h_straw', p: null }], furs: { white: true }, types: { elder: true } }), 'album ' + JSON.stringify(s.album));
  ok(s.equip.hat === 'h_straw' && s.equip.pet === null, 'equip only owned: ' + JSON.stringify(s.equip));
  ok(JSON.stringify(s.staff) === '{"maid1":25}' && s.vipNext === VIPS.length && s.opts.lines === false, 'staff / vipNext / opts');
  ok(s.rooms.room2 === 'messy' && s.rooms.room3 === 'clean' && s.rooms.c1 === 'messy' && s.rooms.c3 === 'clean' && !('c2' in s.rooms), 'rooms: ' + JSON.stringify(s.rooms));
  ok(s.piles.room2 === STARS[4].tip, 'the sleeper in room2 left a star-4 tip: ' + JSON.stringify(s.piles));
  ok(s.futureKey && s.futureKey.keep === 1, 'unknown top-level keys are kept (never wipe)');
  const again = ld(s); ok(JSON.stringify(again) === JSON.stringify(s), 'second load is stable');
}
// odd values never throw and never go NaN / negative
for (const raw of ['null', '[]', '"x"', '{"clock":"noon","day":-3,"peak":99,"hearts":-1,"decor":[1,2],"album":null,"equip":"x","gifts":{"a":1},"staff":[5],"opts":7}',
  '{"v":2,"unlocked":{"room1":false},"rooms":{"room1":"occupied"},"piles":{"recep":"7","onsen":3}}', '{"v":"2","dayLog":{"g":"NaN"}}']) {
  try {
    const s = ld(raw);
    ok(s.v === 2 && s.unlocked.room1 && s.peak >= 1 && s.peak <= 5 && s.clock >= 0 && s.clock < 1 && s.day >= 1 && s.hearts >= 0, 'odd ' + raw + ' -> ' + JSON.stringify({ peak: s.peak, clock: s.clock, day: s.day }));
    ok(Array.isArray(s.gifts) && Array.isArray(s.album.photos) && s.equip.hat === null, 'odd shapes ' + raw);
    ok(!('onsen' in s.piles) && s.piles.recep >= 7 || raw.indexOf('recep') < 0, 'locked pile -> cash box ' + raw + ' ' + JSON.stringify(s.piles));
  } catch (e) { ok(false, 'threw on ' + raw + ': ' + e.message); }
}
// peak: the star never drops; star() = max(starOf, peak)
{ S = ld({ v: 2, peak: 4, unlocked: { onsen: true } }); ok(star() === 4 && starOf(S) === 2, 'peak keeps star 4'); }
{ S = ld({ v: 2, peak: 1, unlocked: { onsen: true, dining: true } }); ok(S.peak === 3, 'peak raised to starOf on load: ' + S.peak); }
// v1 -> v2 (10.2)
{
  const v1 = { v: 1, money: 100, earned: 5000, unlocked: { room1: true, room2: true, onsen: true, room6: true, room8: true, sign: true }, paid: { room2: 25, sign: 1100, foo: 30 }, stats: { guests: 4000 }, done: true };
  const s = ld(v1);
  ok(s.peak === 5 && s.done && s.unlocked.sign, 'v1 star 5 keeps peak 5 / done / unlocked.sign');
  ok(s.money === 130 && !('foo' in s.paid) && s.paid.sign === 1100, 'refund only for pads that no longer exist and were never bought: ' + s.money + ' ' + JSON.stringify(s.paid));
  const h = UNLOCK.room2.hearts + UNLOCK.onsen.hearts + UNLOCK.room6.hearts + UNLOCK.room8.hearts + 600;
  ok(s.hearts === h, 'hearts ' + s.hearts + ' want ' + h + ' (word of mouth capped at 600)');
  ok(s.gift === true, 'gift banner flag');
}
{ const s = ld({ unlocked: { room2: true }, paid: { sign: 300 }, money: 5 }); ok(s.money === 305 && s.peak === 1 && s.gift === false, 'v1 star 1, half-paid 招牌 refunded: ' + s.money); }
{ const s = ld({ v: 2, paid: { foo: 30 }, money: 5 }); ok(s.money === 5 && s.paid.foo === 30, 'v2 saves are not migrated again'); }
// the game's own save path
S = defaults(); S.money = 77; S.hearts = 9; S.decor = {}; saveNow(); ok(loadState().money === 77 && loadState().hearts === 9, 'saveNow -> loadState');
console.log(errs.length ? 'SYS SAVE FAIL\n  ' + errs.join('\n  ') : 'SYS SAVE OK');
if (errs.length) process.exitCode = 1;
