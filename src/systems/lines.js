// ============================================================ cat lines (SPEC_v2 8)
// One line on screen at most, <= 8 characters, in a white bubble over the speaker. Event lines (a new hire at its post,
// calls, VIPs, level-ups, an angry guest leaving, the innkeeper buying / overtaking) skip the cooldown: one pushes a chat
// line off, or waits behind another event line for at most 1 s. Chat lines (the rest) need a 7 s gap since the last line
// (10 s at star 1). Only cats on screen within 100 px of the innkeeper speak; in a new game's first minute only G01. The
// same line never twice within 60 s. The menu switch turns them all off. Callers roll the odds through lineSay(): a key
// can join several candidates with '|' (one event, several lines, each with its own odds).
// LINES: id -> { text (or fn(arg)), p (odds), ev (event line), who: g guest | k kitten | s staff | o shop owner | v VIP | p innkeeper | a pet }
const LINES = NUL();
[
  ['G01', 'g', '打扰啦～', .35], ['G02', 'g', '有空房吗？', .6], ['G03', 'g', '听说温泉超棒', .15], ['G04', 'g', '前台有人吗？', 1], ['G05', 'g', '还要等多久…', .5],
  ['G06', 'g', '麻烦你啦', .4], ['G07', 'g', '被子软软的', .3], ['G08', 'g', '呼噜呼噜…', .15], ['G09', 'g', '睡得真香！', .25], ['G10', 'g', '啊～活过来了', .35],
  ['G11', 'g', '水温刚刚好', .2], ['G12', 'g', '毛巾呢？', .6], ['G13', 'g', '咕嘟咕嘟！', .4], ['G14', 'g', '肚子饿扁了', .3], ['G15', 'g', '开动了！', .4],
  ['G16', 'g', '早饭好香喵', .15], ['G17', 'g', '还会再来的', .3], ['G18', 'g', '下次带朋友', .2], ['G19', 'g', '五星好评！', .15], ['G20', 'g', '下次吧…', 1, 1],
  ['G21', 'g', '唉，算了', .5, 1], ['G22', 'g', '能来杯茶吗', 1, 1], ['G23', 'g', '想喝冰牛奶', 1, 1], ['G24', 'g', '有夜宵吗？', 1, 1], ['G25', 'g', '正好想要！', .45, 1],
  ['G26', 'g', '掌柜真贴心', .25, 1], ['G27', 'g', '好快！谢谢', .2, 1], ['G28', 'g', '这房间真棒', .3], ['G29', 'g', '离汤近，好！', 1], ['G30', 'g', '好浪漫喵', 1],
  ['G31', 'g', '像自己家一样', 1], ['G32', 'k', '好好吃！', .3], ['G33', 'g', '晚安喵…', .1], ['G34', 'g', '星星好近喵…', .25], ['G35', 'g', '买点土产！', .35],
  ['G36', 'g', n => '第' + n + '位！', 1, 1], ['G37', 'g', '手脚真快！', .2, 1], ['G38', 'g', '神速喵！', .2, 1], ['G39', 'g', '谢啦掌柜', .3, 1],
  ['S01', 's', '欢迎光临！', 1, 1], ['S02', 's', '里边请～', .05], ['S03', 's', '早上好喵！', 1, 1], ['S04', 's', '打扫交给我', 1, 1], ['S05', 's', '我也来帮忙', 1, 1],
  ['S06', 's', '西馆交给我', 1, 1], ['S07', 's', '庭园交给我', 1, 1], ['S08', 's', '打扫完毕！', .15], ['S09', 's', '毛巾我来搬', 1, 1], ['S10', 's', '嘿咻嘿咻', .08],
  ['S11', 's', '厨房交给我', 1, 1], ['S12', 's', '出锅啦！', .08], ['S13', 's', '上菜啦～', 1, 1], ['S14', 's', '我来端盘子', 1, 1], ['S15', 's', '小心烫哦', .08],
  ['S16', 's', '账我来管', 1, 1], ['S17', 's', '今天赚不少', .15], ['S18', 's', '变强了喵！', 1, 1], ['S19', 's', '掌柜辛苦啦', .3],
  ['S20', 's', '茶水交给我', 1, 1], ['S21', 's', '请慢用～', .1],   // v2.0.1 G3: the tea runner at its post / handing a cup over
  ['K01', 'o', '生意来啦！', 1, 1], ['K02', 'o', '上新啦！', 1, 1], ['K03', 'o', '要试试吗？', 1, 1], ['K04', 'o', '真合身！', 1, 1],
  ['V01', 'v', '来取材喵', 1, 1], ['V02', 'v', '汤要大！', 1, 1], ['V03', 'v', '花开正好', 1, 1], ['V04', 'v', '靠岸歇歇', 1, 1], ['V05', 'v', '嘘，别说哦', 1, 1],
  ['V06', 'v', '茶要浓的', 1, 1], ['V07', 'v', '劳烦带路', 1, 1], ['V08', 'v', '慢点走嘛', 1, 1], ['V09', 'v', '此等风雅！', 1, 1], ['V10', 'v', '来，拍张照', 1, 1],
  ['V11', 'v', '名不虚传', 1, 1], ['V12', 'v', '改日再访', 1, 1],
  ['P01', 'p', '好耶！', 1, 1], ['P02', 'p', '生意兴隆！', 1, 1], ['P03', 'p', '又变大了！', 1, 1], ['P04', 'p', '升星啦！', 1, 1], ['P05', 'p', pet => pet ? '新伙伴！' : '新帽子！', 1, 1],
  ['P06', 'p', '超过啦！', 1, 1], ['P07', 'p', '新房间！', 1, 1], ['P08', 'p', '真好看！', 1, 1], ['P09', 'p', '更顺手了！', 1, 1], ['P10', 'p', '真风雅！', 1, 1],
  ['P11', 'p', '秘方到手！', 1, 1], ['A01', 'a', '嘎！', 1], ['A02', 'a', '汪！', 1, 1],
].forEach(([id, who, text, p, ev]) => { LINES[id] = { id, who, text, p, ev: !!ev }; });
const LINE_EV_T = 2.2, LINE_CHAT_T = 1.8, LINE_GAP = 7, LINE_GAP1 = 10, LINE_NEAR = 100, LINE_FIRST = 60, LINE_REPEAT = 60, LINE_WAIT = 1;
// a new hire's first words when it reaches its post (7.3.4)
// a hire's first words it couldn't say (off screen) wait up to HELLO_T s for it to be in view near you (lineOk; 18.2)
const HELLO_T = 180;
const ARRIVE_LINE = { recep: 'S01', maid1: 'S04', maid2: 'S05', maid3: 'S06', maid4: 'S07', porter: 'S09', chef: 'S11', waiter1: 'S13', waiter2: 'S14', clerk: 'S16', teaboy: 'S20', owner: 'K01' };
let LINE = null, LINE_NEXT = null, lineCD = -99, UIT = 0;   // the line on screen, an event line waiting (<= 1 s), when the last one came (UI time)
const LSAID = NUL();                                       // line id -> game time it was last said
// where a speaker's bubble points (world px): over the head; a cat with an icon bubble over its head speaks 12 px higher,
// the innkeeper 6 px higher than the others (its face stays clear), sleepers / bathers / diners over where they lie / sit
function sayAt(e) {
  if (e === P) return [P.x, P.y - 27 - (P.towels > 0 ? 4 + P.towels * 2 : 0)];
  if (e === PET) return [e.x, e.y - (e.kind === 'shiba' ? 17 : 11)];
  if (e.vip) {
    if (e.st === 'soak' && e.suite) { const tb = ROOM[e.suite].tub; return [tcx(tb), tb[1] * TILE - 3]; }
    const bub = e.st === 'arrive' || e.st === 'carpet' || (e.st === 'follow' && e.halt);
    return [e.x, e.y - 21 - (e.st === 'seated' && vipWish() ? 26 : bub ? 12 : 0)];   // over the big wish bubble (G1)
  }
  if (e.role) return [e.x, e.y - 21 - (e.carry > 0 ? 4 + e.carry * 2 : 0) - (e === badgeStaff() ? 9 : 0) - (T - (e.newT || -99) < NEW_TAG_T ? 10 : 0)];
  if (e.kind === 'kitten') return [e.x, e.y - (e.mode === 'park' ? 9 : 15)];
  if (e.kind === 'cat') return [e.x, e.y - (e.mode === 'park' ? 18 : 21)];
  const [hx, hy] = guestHead(e), up = (e.st === 'sleep' || (e.bub && e.st !== 'sleep') ? 12 : 0) + (e.call && e.st !== 'sleep' ? 13 : 0);
  return [hx, hy - up];
}
// a speaker counts when it is on screen and within 100 px of the innkeeper (the innkeeper always does)
function lineOk(e) {
  if (e === P) return true;
  if (e.gone || (e.vip && e !== VIPG)) return false;
  const [x, y] = sayAt(e), sx = x - cam.x, sy = y - cam.y;
  return sx > 4 && sx < W - 4 && sy > 20 && sy < H && dist(P.x, P.y, x, y + 16) <= LINE_NEAR;
}
// roll the odds of the candidates ('G17|G18|G19': 20 / 15 / 15 %, maybe none) and say the one that came up
function lineSay(who, key, arg) {
  if (!who || !S.opts.lines || state === 'title') return false;
  let id = null, x = Math.random();
  for (const k of String(key).split('|')) { const L = LINES[k]; if (!L) continue; x -= L.p; if (x < 0) { id = k; break; } }
  return id ? say(who, id, arg) : false;
}
function say(e, id, arg) {
  const L = LINES[id]; if (!L || !e || !S.opts.lines) return false;
  if (S.stats.time < LINE_FIRST && id !== 'G01') return false;                         // a new game's first minute: only G01
  if (LSAID[id] !== undefined && S.stats.time - LSAID[id] < LINE_REPEAT) return false;  // not the same line twice within 60 s
  if (id === 'G28' && S.stats.time - (LSAID.G28 === undefined ? -99 : LSAID.G28) < 30) return false;
  if (!lineOk(e)) return false;
  const ln = { e, id, text: typeof L.text === 'function' ? L.text(arg) : L.text, ev: L.ev, t: 0, q: 0 };
  if (LINE) {
    if (!ln.ev) return false;                                    // a chat line never cuts in
    if (LINE.ev) { LINE_NEXT = ln; return true; }                // behind another event line: wait (dropped after 1 s)
  } else if (!ln.ev && UIT - lineCD < (star() <= 1 ? LINE_GAP1 : LINE_GAP)) return false;   // chat: the global cooldown
  showLine(ln); return true;
}
function showLine(ln) { LINE = ln; LSAID[ln.id] = S.stats.time; lineCD = UIT; RUN.lines++; RUN.lineLog.push([S.stats.time, ln.id]); if (RUN.lineLog.length > 4000) RUN.lineLog.splice(0, 2000); }
function linesTick(dt) {
  if (LINE) { LINE.t += dt; if (LINE.t >= (LINE.ev ? LINE_EV_T : LINE_CHAT_T) || LINE.e.gone) LINE = null; }
  if (LINE_NEXT) {
    LINE_NEXT.q += dt;
    if (LINE_NEXT.q > LINE_WAIT || LINE_NEXT.e.gone) LINE_NEXT = null;
    else if (!LINE) { const n = LINE_NEXT; LINE_NEXT = null; if (!(LSAID[n.id] !== undefined && S.stats.time - LSAID[n.id] < LINE_REPEAT) && lineOk(n.e)) showLine(n); }   // still in view after the wait
  }
}
// S19: an idle staff cat greets the innkeeper walking past within 24 px (each cat at most once per 90 s)
function staffChat() {
  if (!P.moving || !LINES.S19) return;
  for (const s of STAFF) {
    if (s.role === 'owner' || s.arrive || s.moving || s.working || s.cooking || s.carry > 0 || s.bag > 0 || s.tray.length) continue;
    if (dist(P.x, P.y, s.x, s.y) > 24 || S.stats.time - (s.hi === undefined ? -99 : s.hi) < 90) continue;
    s.hi = S.stats.time; lineSay(s, 'S19'); return;
  }
}
// the bubble: white, a dark outline, a 3 px tail down to the speaker, 7 px pixel text; pops in over 0.15 s, fades the last 0.2 s
function drawLine() {
  const L = LINE; if (!L || !S.opts.lines) return;
  const [wx, wy] = sayAt(L.e), tx = R(wx) - CX, ty = R(wy) - CY;
  if (tx < -8 || tx > W + 8 || ty < 8 || ty > H + 24) return;
  const dur = L.ev ? LINE_EV_T : LINE_CHAT_T, a = L.t < .15 ? L.t / .15 : clamp((dur - L.t) / .2, 0, 1);
  const tw = Math.ceil(textW(L.text, 7)), bw = tw + 8, bh = 11, rise = L.t < .15 ? R((1 - L.t / .15) * 2) : 0;
  const bx = clamp(tx - (bw >> 1), 2, W - 2 - bw), by = Math.max(31, ty - 3 - bh + rise), tip = clamp(tx, bx + 3, bx + bw - 4);
  g.globalAlpha = a;
  g.fillStyle = OUT; g.fillRect(bx + 1, by, bw - 2, bh); g.fillRect(bx, by + 1, bw, bh - 2);
  g.fillStyle = '#ffffff'; g.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
  g.fillStyle = '#e8e4f0'; g.fillRect(bx + 2, by + bh - 2, bw - 4, 1);
  if (by + bh + 2 <= ty + 1) {   // the tail (only when the bubble really sits over the speaker)
    g.fillStyle = '#ffffff'; g.fillRect(tip - 1, by + bh - 1, 3, 1); g.fillRect(tip - 1, by + bh, 2, 1);
    g.fillStyle = OUT; g.fillRect(tip - 2, by + bh, 1, 1); g.fillRect(tip + 1, by + bh, 1, 1); g.fillRect(tip - 1, by + bh + 1, 2, 1);
  }
  g.globalAlpha = 1;
  txt(L.text, bx + bw / 2, by + bh / 2, 7, '#2a2238', 'center', null, a);
}
