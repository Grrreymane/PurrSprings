// 16:9 share image: open index.html#cover, then tools/shot.py saves it as cover.png (1920x1080)
function renderCover() {
  const CW = 320, CH = 180, SC = 6, c = mk(CW, CH); g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  CX = 0; CY = 0; T = 2.2;
  // a wider open-air bath built from the map's own tiles (tileArt only needs a char + its neighbours)
  const CM = [
    'bbbbbbbbbbbbbbbbbbbb',
    'ffffffffffffffffffff',
    'ffffrrrrrrrrrrrrffff',
    'fffrr~~~~~~~~~~rrfff',
    'ffrr~~~~~~~~~~~~rrff',
    'ffr~~~~~~~~~~~~~~rff',
    'ffssssssssssssssssff',
    'fssssssssssssssssssf',
    'gssssssssssssssssssg',
    'ggssssssssssssssssgg',
    'gggssssssssssssssggg',
    'gggssssssssssssssggg',
  ];
  const cm = (x, y) => (x < 0 || y < 0 || x >= 20 || y >= CM.length) ? null : CM[y][x];
  for (let ty = 0; ty < CM.length; ty++) for (let tx = 0; tx < 20; tx++) {
    const k = CM[ty][tx], t = k === '~' ? waterArt(1, tx, ty) : tileArt(k, tx, ty, { u: cm(tx, ty - 1), d: cm(tx, ty + 1), l: cm(tx - 1, ty), r: cm(tx + 1, ty) });
    if (t) g.drawImage(t, tx * TILE, ty * TILE);
  }
  // bathers, props and cats on the deck, sorted by their feet
  const L = [], at = (y, f) => L.push({ y, f }), obj = (img, x, yb) => at(yb, () => g.drawImage(img, x, yb - img.height));
  const cat = (x, y, dir, look, fr) => at(y, () => { let s = catSprite(dir === 'left' || dir === 'right' ? 'side' : dir, fr || 0, look); if (dir === 'left') s = flipOf(s); g.drawImage(s, x - 8, y - 23); });
  [[100, 70, 'calico', 0], [160, 69, 'siamese', 1], [222, 70, 'black', 0], [72, 87, 'white', 1], [131, 88, 'gray', 0], [191, 87, 'cream', 1], [249, 88, 'cow', 0]]
    .forEach(([x, y, fur, f]) => at(y, () => g.drawImage(catBathing(fur, f), x - 9, y - 9)));
  obj(toroArt(), 13, 170); obj(toroArt(), 293, 170);
  // v2: a sakura and a maple frame the bath (anchors (16,44) / (14,36): trunk centre at the base)
  at(122, () => drawA(treeArt('sakura'), 30, 122, 16, 44)); at(118, () => drawA(treeArt('maple'), 292, 118, 14, 36));
  obj(basketArt(7, 10), 84, 116); obj(milkArt(1), 246, 124); obj(benchArt(), 34, 150);
  at(126, () => drawA(pileArt(6), 112, 126, 8, 17)); at(162, () => drawA(pileArt(3), 206, 162, 8, 17));
  cat(229, 134, 'right', { fur: 'tabby', outfit: 'yukata' });
  cat(118, 156, 'right', { fur: 'gray', outfit: 'yukata' }, 1);
  cat(160, 150, 'down', PLAYER_LOOK);
  L.sort((a, b) => a.y - b.y); L.forEach(e => e.f());
  const tw = towelArt(); for (let i = 0; i < 5; i++) drawA(tw, 160 + (i > 2 ? i - 2 : 0), 150 - 17 - i * 2, 5, 2);
  // steam: soft dithered wisps rising off the water
  for (let i = 0; i < 13; i++) {
    const x0 = 58 + ((i * 53) % 210), y0 = 92 - (i % 3) * 10, h = 20 + (i * 7) % 12;
    for (let j = 0; j < h; j++) {
      const x = R(x0 + Math.sin(j * .35 + i) * 3), y = y0 - j;
      if (y < 44) break;
      g.globalAlpha = .3 * Math.sin(j / h * Math.PI); g.fillStyle = '#ffffff'; g.fillRect(x, y, (j + i) & 1 ? 2 : 3, 1);
    }
  }
  g.globalAlpha = 1;
  drawA(bubbleArt('heart', 0), 160, 57, 7, 12); drawA(bubbleArt('milk', 0), 229, 114, 7, 12); drawA(bubbleArt('heart', 0), 118, 136, 7, 12);
  // title band over the fence and hedge
  g.fillStyle = '#0c081c'; g.globalAlpha = .5; g.fillRect(0, 0, CW, 36); for (let i = 0; i < 4; i++) { g.globalAlpha = .4 - i * .1; g.fillRect(0, 36 + i * 2, CW, 2); } g.globalAlpha = 1;
  const big = mk(CW * SC, CH * SC), bx = big.getContext('2d'); bx.imageSmoothingEnabled = false; bx.drawImage(c, 0, 0, CW * SC, CH * SC);
  // pixel-font title (F1): 120 px = 10 device px per glyph pixel (crisp), the subtitle at 4 px per glyph pixel
  const label = (s, x, y, px, col) => { const t = pixText(s, px, col, OUT), w = t.w - 2 * t.pad; bx.drawImage(t.cv, R(x - w / 2 - t.pad), R(y - t.h / 2)); };
  { const tt = tr('猫猫温泉旅馆'); label(tt, 960, 98, 120, '#ffe14a'); if (tt !== 'Purr Springs') label('Purr Springs', 960, 194, 48, '#dff6ff'); }   // i18n: #cover?lang=en = one English title
  document.body.innerHTML = ''; big.style.cssText = 'position:fixed;left:0;top:0;width:1920px;height:1080px'; document.body.appendChild(big);
  document.title = 'COVER READY';
}
