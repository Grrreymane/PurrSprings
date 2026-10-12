// ============================================================ v2.1 the cat mom (SPEC_v2 16.5)
// From star 5, once a year on the 3rd day of spring (from clock .30, as soon as no VIP is in and a suite is open) the
// innkeeper's mom comes: an orange cat in an apron with a bundle. She is a VIP in all but name (VIPG with mom: true;
// VIP.mom = MOM_DEF so vip.js finds her wishes): greet her, lead her to a free suite, tea -> her bath -> a photo. The
// photo is the family photo: the innkeeper (as dressed now) + mom + every hired staff cat at the front door, redrawn
// from the data each time (familyPhoto); it pauses the game as a card and hangs on the lobby's north wall (15,22) facing
// the desk. Her lines (E10): coming "来看看你喵" (from the 3rd year "又长大了呢", the 10th "十年了呀"), going "妈妈为你骄傲".
// vip.js has two hooks: the last wish of mom calls momPhoto() instead of filing a VIP photo / gift, and her goodbye is
// momLeaveLine(). Saved: S.mom (visits), S.momY (the year of the last one; 1 by default, so the first can come in year 2 -
// nobody is at star 5 on day 3 anyway).
VIP.mom = MOM_DEF;
function momTick() {
  const v = VIPG;
  if (v) { if (v.mom) momFollow(v); return; }
  const due = momDue();
  if (((due === true && S.clock >= MOM_AT) || due === 'late') && SUITES.some(suiteAvail)) momArrive(yearOf(S.day));
}
// v2.4: her day (spring day 3) until she came this year - no VIP / rare guest starts a visit then (vip.js), so a suite is
// free for her; a guest of honour asleep in the only suite that night: she comes as soon as one is free the next day ('late')
function momDue() {
  if (star() < MOM_STAR || !S.unlocked.garden || !SUITES.some(rm => roomOpen(rm)) || S.momY >= yearOf(S.day)) return false;
  const s = seasonNow();
  return s === 0 && seasonDay(S.day) === 2 ? true : s === 1 && seasonDay(S.day) === 0 ? 'late' : false;
}
function momArrive(year) {   // the same fields as vipArrive() builds, + mom / said / momYear
  VIPG = { id: 'mom', vip: true, mom: true, said: false, momYear: year, look: MOM_DEF.look, x: EXIT[0], y: EXIT[1], dir: 'up', moving: false, walkT: 0, path: [], goal: null, q: [], st: 'arrive', t: 0, tt: 0,
    halt: false, greetT: 0, actT: 0, wi: 0, suite: null, G: vipGift(), paid: 0, t0: S.stats.time, greetAt: null, trailT: 0, noSuite: 0 };
  S.momY = year; S.mom = (S.mom | 0) + 1;
  banner('mom', 0); sfx('vip'); news('mom'); markDirty();
}
// her hello once you greet her (or, if nobody did, when she has sat down)
function momFollow(v) {
  if (v.said || v.st === 'arrive' || v.st === 'carpet' || v.st === 'leave') return;
  const y = v.momYear || 1;
  v.said = say(v, 'E10', y === 10 ? 'ten' : y >= 3 ? 'grown' : 'come') || (v.st === 'seated' && v.t > 10);
}
// the photo wish done (vip.js vipWishDone): the family photo card instead of a VIP's album photo / gift
function momPhoto(v) { modalPush({ kind: 'family', y: v.momYear || yearOf(S.day) }); news('family'); markDirty(); }
function momLeaveLine(v) { delete LSAID.E10; say(v, 'E10', 'go'); }   // (E10 said on arrival: not "the same line within 60 s")
// ---- the family photo, redrawn from the data: who is hired, what the innkeeper wears, the pet
function familyCast() {
  const ids = Object.keys(STAFF_DEF).filter(id => STAFF_DEF[id].role !== 'owner' && S.unlocked[STAFF_DEF[id].need]);
  return { ids, looks: ids.map(id => { const s = STAFF.find(q => q.id === id); return s ? staffLook(s) : STAFF_DEF[id].look; }), me: equipLook(), pet: petOf(S.equip.pet) };
}
const FAMILY = new Map();
function familyPhoto() {
  const c0 = familyCast(), key = c0.ids.join(',') + '|' + c0.looks.map(l => l.trim || 0).join('') + '|' + JSON.stringify(c0.me) + '|' + c0.pet;
  let c = FAMILY.get(key); if (c) return c;
  c = mk(124, 84); const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#cfe8f4'; x.fillRect(0, 0, 124, 10); x.fillStyle = '#4a3a4a'; x.fillRect(0, 10, 124, 4); x.fillStyle = '#6a5a6a'; x.fillRect(0, 10, 124, 1);   // sky, the eave
  x.fillStyle = '#ead6a8'; x.fillRect(0, 14, 124, 46); x.fillStyle = '#8a5a34'; for (const px of [6, 34, 88, 116]) x.fillRect(px, 14, 3, 46);             // the wall, its posts
  x.drawImage(entranceNoren(), 38, 15);
  x.fillStyle = '#d8c8a0'; x.fillRect(0, 60, 124, 24); x.fillStyle = '#c8b890'; x.fillRect(0, 60, 124, 1);                                                   // the ground
  const back = c0.looks.slice(0, 6), front = c0.looks.slice(6), row = (L, y) => L.forEach((look, i) => x.drawImage(catSprite('down', 0, look), R(62 - L.length * 7.5 + i * 15), y - 23));
  row(back, 58);
  const fl = front.slice(0, Math.ceil(front.length / 2)), fr = front.slice(fl.length), mid = fl.concat([MOM_DEF.look, c0.me], fr);
  row(mid, 80);
  if (c0.pet) { const pc = petSprite(c0.pet, 'down', 0), i = fl.length + 1; x.drawImage(pc, R(62 - mid.length * 7.5 + i * 15) + 10, 82 - pc.height); }
  FAMILY.set(key, c); return c;
}
// on the wall (15,22): the frame's 14 x 10 window (pre-painted with the inn's door) gets the same people as tiny figures
// - the staff in two rows, mom and the innkeeper in front in the middle, everyone's feet on the window's bottom row
function familyMini() {
  const c0 = familyCast(), key = 'mini:' + c0.ids.join(',');
  let c = FAMILY.get(key); if (c) return c;
  c = mk(14, 10); const x = c.getContext('2d');
  const fig = (fur, px, py, w, body) => { const f = FURS[fur] || FURS.orange; x.fillStyle = f.O; x.fillRect(px, py - 2, w, 2); x.fillStyle = body || f.D; x.fillRect(px, py, w, 1); };
  const L = c0.looks, back = L.slice(0, 7), front = L.slice(7, 11);
  back.forEach((l, i) => fig(l.fur, 7 - (back.length - 1) + 2 * i, 7));
  [1, 3, 11, 13].slice(0, front.length).forEach((px, i) => fig(front[i].fur, px - 1, 9));
  fig('orange', 4, 9, 2, '#c86a8a'); fig('orange', 8, 9, 2, '#2f4a7a');   // mom (apron pink) and the innkeeper (happi blue)
  FAMILY.set(key, c); return c;
}
function drawFamilyCard(m) {
  panel(18, 64, 144, 196);
  txt('全家福', 90, 84, 13, '#8a3a1a', 'center', null);
  g.fillStyle = OUT; g.fillRect(24, 95, 132, 96); g.fillStyle = '#fbfbf6'; g.fillRect(25, 96, 130, 94);
  g.drawImage(familyPhoto(), 28, 99);
  txt('第' + m.y + '年 · 春', 90, 200, 7, '#8a5a34', 'center', null);
  txt(LINES.E10.text('go'), 90, 222, 9, '#c0392b', 'center', null);
}
