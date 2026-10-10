// v2 purchase table (docs/design/economy.md section 6). Geography = docs/design/world-area-variety.md (40x36 map, v1 coords x+10).
// it(id, name, price, req, hearts, layer, zone, eff, minStar, pad)
//   layer: B = area gate / star key (key ids are in STAR_REQ), M = rooms / staff / facilities / room tiers, S = decor / small upgrades
//   eff (model only): room 'wa'|'cot' · tier {lv, of} · fac · call · staff · slots · speed · magnet · area
//   minStar: the star at which the pad may first appear (only gates and the listed pads check it; others just need req)
// ---- ★1 main building (= v1) ---------------------------------------------------------------------------------------------
it('room2', '客房', 25, [], 3, 'M', '本馆', { room: 'wa' }, 1, [18, 20]);
it('room3', '客房', 35, ['room2'], 3, 'M', '本馆', { room: 'wa' }, 1, [16, 16]);
it('shoes1', '跑鞋', 35, ['room2'], 0, 'S', '大堂', { speed: 1 }, 1, [19, 28]);
it('onsen', '温泉', 50, ['room3'], 15, 'B', '温泉', { fac: 'bath' }, 1, [17, 7]);
// ---- ★2 onsen: first staff, first call (tea), first 上房, first decor, dining gate (key ★3) ------------------------------------
it('recep', '前台', 55, ['onsen'], 1, 'M', '大堂', { staff: 'recep' }, 2, [19, 25]);
it('dec_scroll', '挂轴', 40, ['recep'], 6, 'S', '大堂', {}, 2, [22, 27]);
it('tea', '茶台', 60, ['recep'], 3, 'S', '大堂', { call: 'tea' }, 2, [12, 24]);
it('basket1', '竹篮', 70, ['onsen'], 0, 'S', '大堂', {}, 2, [20, 28]);
it('maid1', '仲居', 110, ['recep'], 1, 'M', '大堂', { staff: 'maid' }, 2, [19, 25]);
it('magnet1', '招财', 80, ['maid1'], 0, 'S', '大堂', { magnet: 1 }, 2, [21, 28]);
it('dec_screen', '屏风', 90, ['dec_scroll', 'maid1'], 6, 'S', '大堂', {}, 2, [22, 27]);
it('t2_room1', '上房', 100, ['maid1'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room1' } }, 2, [16, 20]);
it('room4', '客房', 140, ['onsen'], 3, 'M', '本馆', { room: 'wa' }, 2, [18, 16]);
it('t2_room2', '上房', 120, ['t2_room1', 'room4'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room2' } }, 2, [18, 20]);
it('milk', '牛奶', 160, ['onsen'], 5, 'M', '温泉', { fac: 'milk', call: 'milk' }, 2, [20, 5]);
it('dec_lamp', '竹灯', 60, ['milk'], 6, 'S', '温泉', {}, 2, [12, 5]);
it('room5', '客房', 210, ['room4'], 3, 'M', '本馆', { room: 'wa' }, 2, [16, 12]);
it('shoes2', '跑鞋', 220, ['shoes1', 'room5'], 0, 'S', '大堂', { speed: 1 }, 2, [19, 28]);
it('room6', '客房', 250, ['room5'], 3, 'M', '本馆', { room: 'wa' }, 2, [18, 12]);
it('dining', '食堂', 450, ['room5', 'maid1'], 15, 'B', '食堂', { area: 'dining', fac: 'meal', call: 'meal' }, 2, [11, 26]);
// ---- ★3 dining + ♥: waiter / chef / tables, west wing W1-W3, porter, clerk, top of the main corridor, garden gate (key ★4) --
it('waiter1', '配膳', 200, ['dining'], 1, 'M', '食堂', { staff: 'waiter' }, 3, [9, 22]);
it('tray1', '托盘', 180, ['dining'], 0, 'S', '食堂', {}, 3, [6, 21]);
it('w1', '西馆', 330, ['dining'], 4, 'M', '西馆', { area: 'west', room: 'wa' }, 3, [8, 19]);
it('porter', '搬运', 300, ['maid1', 'milk'], 1, 'M', '大堂', { staff: 'porter' }, 3, [20, 25]);
it('t2_room3', '上房', 160, ['t2_room2', 'room5'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room3' } }, 3, [16, 16]);
it('dec_ikebana', '生花', 120, ['dining'], 6, 'S', '食堂', {}, 3, [8, 28]);
it('table3', '餐桌', 300, ['waiter1'], 3, 'M', '食堂', { slots: 'seat' }, 3, [3, 26]);
it('chef', '厨师', 380, ['table3'], 1, 'M', '食堂', { staff: 'chef' }, 3, [6, 20]);
it('room7', '客房', 400, ['room6'], 3, 'M', '本馆', { room: 'wa' }, 3, [16, 8]);
it('dec_stone', '石灯', 140, ['dec_lamp'], 6, 'S', '温泉', {}, 3, [12, 5]);
it('basket2', '竹篮', 260, ['basket1', 'porter'], 0, 'S', '大堂', {}, 3, [20, 28]);
it('w2', '客房', 420, ['w1'], 4, 'M', '西馆', { room: 'wa' }, 3, [7, 12]);
it('t2_room4', '上房', 190, ['t2_room3', 'room4'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room4' } }, 3, [18, 16]);
it('room8', '客房', 460, ['room7'], 3, 'M', '本馆', { room: 'wa' }, 3, [18, 8]);
it('clerk', '账房', 480, ['porter', 'chef'], 1, 'M', '大堂', { staff: 'clerk' }, 3, [20, 25]);
it('magnet2', '招财', 280, ['magnet1', 'clerk'], 0, 'S', '大堂', { magnet: 1 }, 3, [21, 28]);
it('maid2', '仲居', 450, ['room7', 'maid1'], 1, 'M', '大堂', { staff: 'maid' }, 3, [19, 25]);
it('dec_tank', '鱼缸', 240, ['dec_ikebana'], 8, 'S', '食堂', {}, 3, [8, 28]);
it('shoes3', '跑鞋', 420, ['shoes2', 'room8'], 0, 'S', '大堂', { speed: 1 }, 3, [19, 28]);
it('bigbath', '浴池', 560, ['room8'], 10, 'M', '温泉', { slots: 'bath' }, 3, [13, 5]);
it('w3', '客房', 520, ['w2'], 4, 'M', '西馆', { room: 'wa' }, 3, [7, 8]);
it('garden', '庭园', 1000, ['w1', 'room7'], 20, 'B', '庭园', { area: 'garden', room: 'cot', fac: 'lug' }, 3, [22, 26]);
// ---- ★4 garden + ♥: cottages C2-C4, luggage porter, souvenir shop, first 特等, garden decor, 星见汤 (key ★5) --------------------
it('bellhop', '行李', 550, ['garden', 'clerk'], 1, 'M', '大堂', { staff: 'bellhop' }, 4, [20, 25]);
it('dec_shishi', '惊鹿', 260, ['garden'], 8, 'S', '庭园', {}, 4, [27, 27]);
it('t2_room5', '上房', 240, ['t2_room4', 'room5'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room5' } }, 4, [16, 12]);
it('c2', '别院', 800, ['garden'], 6, 'M', '庭园', { room: 'cot' }, 4, [32, 21]);
it('t2_room6', '上房', 280, ['t2_room5', 'room6'], 6, 'M', '本馆', { tier: { lv: 2, of: 'room6' } }, 4, [18, 12]);
it('shop', '土产', 640, ['garden'], 10, 'M', '杂货铺', { fac: 'shop', area: 'market' }, 4, [12, 31]);
it('t3_room1', '特等', 520, ['t2_room1'], 12, 'M', '本馆', { tier: { lv: 3, of: 'room1' } }, 4, [16, 20]);
it('dec_sakura', '樱树', 340, ['dec_shishi'], 10, 'S', '庭园', {}, 4, [27, 27]);
it('table4', '餐桌', 450, ['table3', 'chef'], 3, 'M', '食堂', { slots: 'seat' }, 4, [7, 26]);
it('t3_room2', '特等', 580, ['t3_room1', 't2_room2'], 12, 'M', '本馆', { tier: { lv: 3, of: 'room2' } }, 4, [18, 20]);
it('maid3', '仲居', 700, ['maid2', 'c2'], 1, 'M', '大堂', { staff: 'maid' }, 4, [19, 25]);
it('waiter2', '配膳', 600, ['waiter1', 'table4'], 1, 'M', '食堂', { staff: 'waiter' }, 4, [9, 22]);
it('c3', '别院', 1100, ['c2'], 6, 'M', '庭园', { room: 'cot' }, 4, [25, 12]);
it('shoes4', '跑鞋', 900, ['shoes3', 'c2'], 0, 'S', '大堂', { speed: 1 }, 4, [19, 28]);
it('dec_maple', '枫树', 380, ['dec_sakura'], 8, 'S', '庭园', {}, 4, [27, 27]);
it('tray2', '托盘', 420, ['tray1', 'w2'], 0, 'S', '食堂', {}, 4, [6, 21]);
it('c4', '别院', 1400, ['c3'], 6, 'M', '庭园', { room: 'cot' }, 4, [32, 12]);
it('magnet3', '招财', 600, ['magnet2', 'c3'], 0, 'S', '大堂', { magnet: 1 }, 4, [21, 28]);
it('roten', '星见汤', 2400, ['c2', 'bigbath'], 25, 'B', '星见汤', { area: 'roten', fac: 'roten' }, 4, [23, 4]);
// ---- ★5 functional tail (first ~10 min after ★5; then the boutique etc. in endless.js) ------------------------------------
it('pingpong', '乒乓', 800, ['roten'], 5, 'M', '星见汤', { fac: 'pong' }, 5, [28, 6]);
it('dec_deck', '灯笼', 600, ['roten'], 8, 'S', '星见汤', {}, 5, [26, 5]);
it('massage', '按摩', 1000, ['pingpong'], 5, 'M', '星见汤', { fac: 'massage' }, 5, [37, 5]);
it('maid4', '仲居', 1000, ['maid3', 'c4'], 1, 'M', '大堂', { staff: 'maid' }, 5, [19, 25]);
it('dec_rock', '枯山', 500, ['dec_maple'], 8, 'S', '庭园', {}, 5, [27, 27]);
it('pingpong2', '乒乓', 1500, ['pingpong', 'c4'], 3, 'M', '星见汤', { slots: 'pong' }, 5, [34, 6]);
const T2 = [['room7', 340, [16, 8]], ['room8', 360, [18, 8]], ['w1', 400, [7, 16]], ['w2', 420, [7, 12]], ['w3', 440, [7, 8]]];
let prev2 = 't2_room6';
for (const [r, p, pad] of T2) { it('t2_' + r, '上房', p, [prev2, r], 6, 'M', r[0] === 'w' ? '西馆' : '本馆', { tier: { lv: 2, of: r } }, 5, pad); prev2 = 't2_' + r; }
const T3 = [['room3', 700, [16, 16]], ['room4', 780, [18, 16]], ['room5', 860, [16, 12]], ['room6', 940, [18, 12]], ['room7', 1020, [16, 8]], ['room8', 1100, [18, 8]],
  ['w1', 1200, [7, 16]], ['w2', 1300, [7, 12]], ['w3', 1400, [7, 8]], ['c1', 1500, [25, 21]], ['c2', 1600, [32, 21]], ['c3', 1700, [25, 12]], ['c4', 1800, [32, 12]]];
let prev3 = 't3_room2';
for (const [r, p, pad] of T3) { const roomReq = r[0] === 'c' ? (r === 'c1' ? 'garden' : r) : 't2_' + r; it('t3_' + r, '特等', p, [prev3, roomReq], 12, 'M', r[0] === 'w' ? '西馆' : r[0] === 'c' ? '庭园' : '本馆', { tier: { lv: 3, of: r } }, 5, pad); prev3 = 't3_' + r; }
