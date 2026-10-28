// ---- share card
// A tall pixel postcard (180x320, saved at 4x = 720x1280) with a QR code back to the game, shown in an
// overlay with 保存图片 / 分享给朋友 (system share sheet on phones) / 关闭. Long-press also saves on phones.
const SHARE_URL = 'https://www.aiwanna.games/games/3c4961eaf94f00edc68f3db316056970-cbf5b613';
const QR = ['111111100100001000111101001111111', '100000101101101101000100001000001', '101110100111001100101111001011101', '101110101101110111101010101011101', '101110100010101000010001001011101', '100000101010111100101110001000001', '111111101010101010101010101111111', '000000000000100010100111000000000', '111110111110110111111011110101010', '100011011100111000010101101000111', '110100111100000110100110000011010', '001000000111101100111111110000100', '101011111100010111000010010011000', '100010010011101000111111001000011', '101010110010011110001000011000010', '010100000010101000000110001110100', '011000101000010111000000110110010', '011001001111101000111001001001011', '110000110110100100001010011001010', '010100000101000000101110001100100', '101110111110010101000001110110010', '110000000011110010111111001001011', '101011111000101101101000000111010', '100010010111101110000110110011100', '100101111100111101101010111111001', '000000001001000010010100100011101', '111111101100010111000001101011010', '100000100000001000111111100011110', '101110101110011111101000111111001', '101110101001100001010111000111100', '101110101110110100101111101101010', '100000101111000010100100011011100', '111111101100111101011001101001010'];   // regenerate with: python D:/Minigame/_workflow/tools/qr_matrix.py <url>
function drawQR(qx, qy) {
  if (!QR.length) return;
  g.fillStyle = OUT; g.fillRect(qx - 4, qy - 4, QR.length + 8, QR.length + 8); g.fillStyle = '#ffffff'; g.fillRect(qx - 3, qy - 3, QR.length + 6, QR.length + 6);
  g.fillStyle = OUT; QR.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === '1') g.fillRect(qx + x, qy + y, 1, 1); });
}
function makeShare() {
  TQ.length = 0; g = low.getContext('2d'); g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false;
  // top: a corner of the inn (lobby + entrance) with the innkeeper out front, drawn 2x
  const cx0 = CX, cy0 = CY; CX = 190; CY = 23 * TILE - 4;
  drawScene(W, 150, true, true, true);
  CX = cx0; CY = cy0;
  g.drawImage(catSprite('down', 0, equipLook()), 90 - 16, 146 - 48, 32, 48);
  { const k = petOf(S.equip.pet); if (k) { const c = petSprite(k, 'down', k === 'shiba' ? 3 : 0); g.drawImage(c, 90 + 18, 146 - c.height * 2, c.width * 2, c.height * 2); } }
  { const ph = S.album.photos[S.album.photos.length - 1];   // the latest VIP photo, redrawn from data (7.8), pinned top right
    if (ph) { g.fillStyle = 'rgba(12,8,28,.35)'; g.fillRect(130, 36, 40, 46); g.drawImage(photoCanvas(ph), 128, 34); txt(L('第{0}天', ph.d), 148, 75.5, 6, '#5a3a1a', 'center', null); } }
  g.fillStyle = 'rgba(12,8,28,.55)'; g.fillRect(0, 0, W, 26);
  txt('猫猫温泉旅馆', 90, 13, 15, '#ffe14a');   // the card is drawn at 4x: pixel-font sizes in steps of 3 are crisp (F1)
  g.fillStyle = '#2a1e3a'; g.fillRect(0, 150, W, H - 150); g.fillStyle = OUT; g.fillRect(0, 150, W, 2);
  // middle: stars (gold ones too) + the rank, the title, three numbers
  panel(10, 158, 160, 106);
  const gs = goldStars();
  for (let i = 0; i < 5; i++) g.drawImage(starIcon(i < star(), i < gs), 38 + i * 15, 165, 14, 14);
  g.drawImage(trophyIcon(), 120, 166, 14, 14); txt('#' + rankOf(S.hearts), 137, 173.5, 9, '#8a3a1a', 'left', null);
  txt(gs >= 5 ? '传说之汤' : star() >= 5 ? '五星旅馆' : L('{0} 星旅馆', star()), 90, 191, 12, '#c0392b', 'center', null);
  const rowT = (y, a, b) => { txt(a, 26, y, 9, '#6a4a2a', 'left', null); txt(b, 154, y, 9, '#8a3a1a', 'right', null); };
  const ac = albumCount();
  rowT(209, '接待客人', L('{0} 位', S.stats.guests)); rowT(226, '总收入', L('{0} 鱼干', fmt(S.earned))); rowT(243, '图鉴', ac.n + '/' + ac.m);
  // ---- QR + link ----
  drawQR(10, 278);   // 33x33 (the platform link is long)
  txt('扫码，一起来开旅馆', 50, 289, 9, '#ffffff', 'left');
  txt('aiwanna.games', 50, 303, 6, '#9fe8ff', 'left');
  const S2 = 4, out = mk(W * S2, H * S2), o = out.getContext('2d'), k0 = K;
  o.imageSmoothingEnabled = false; o.drawImage(low, 0, 0, W * S2, H * S2);
  K = S2;
  for (const t of TQ) { const c = textSprite(t), w_ = c.w - 2 * c.pad; o.globalAlpha = t.alpha; o.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? w_ / 2 : t.align === 'right' ? w_ : 0)), R(t.y * K - c.h / 2)); }
  o.globalAlpha = 1; K = k0; TQ.length = 0; g.clearRect(0, 0, W, H);
  showShare(out, L(star() >= 5 ? '我的猫猫温泉旅馆成了五星旅馆，接待了 {0} 位客人，你也来开一家：' : '我的猫猫温泉旅馆开张啦，接待了 {0} 位客人，你也来开一家：', S.stats.guests));
}
let shareEl = null;
function showShare(cvs, msg) {
  const url = cvs.toDataURL('image/png'), name = 'purr-springs-' + Date.now().toString(36) + '.png';
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:10;background:rgba(6,10,24,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;touch-action:auto;color:#fff;font:12px ' + PFONT;
  const img = document.createElement('img');
  img.src = url; img.alt = '分享卡';
  img.style.cssText = 'max-width:100%;max-height:70vh;image-rendering:pixelated;border:3px solid #1b1b2f;border-radius:4px;-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto';
  const tip = document.createElement('div'); tip.textContent = '手机上可以长按图片保存'; tip.style.opacity = '.8';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
  const btn = (label, bg, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'font:24px ' + PFONT + ';color:#fff;background:' + bg + ';border:2px solid #1b1b2f;border-radius:4px;padding:6px 14px;cursor:pointer'; b.onclick = fn; row.appendChild(b); };
  btn('保存图片', '#48b858', () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); });
  try {
    cvs.toBlob(blob => {
      if (!blob || !navigator.canShare) return;
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) btn('分享给朋友', '#4a88e0', () => { navigator.share({ files: [file], title: tr('猫猫温泉旅馆'), text: msg + SHARE_URL }).catch(() => {}); });
    });
  } catch (e) {}
  btn('关闭', '#8a8a9a', () => { el.remove(); shareEl = null; });
  el.appendChild(img); el.appendChild(tip); el.appendChild(row);
  document.body.appendChild(el); shareEl = el;
}
