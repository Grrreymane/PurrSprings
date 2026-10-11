// ---- share card
// A tall pixel postcard (180x320, saved at 4x = 720x1280) with a QR code back to the game, shown in an
// overlay with 保存图片 / 分享给朋友 (system share sheet on phones) / 关闭. Long-press also saves on phones.
const SHARE_URL = 'https://grrreymane.github.io/PurrSprings/';
const QR = ['11111110011001110111001111111', '10000010100111010101001000001', '10111010001110011010001011101', '10111010010110111011101011101', '10111010100111110001001011101', '10000010001000110111101000001', '11111110101010101010101111111', '00000000001011010111000000000', '10101010001101000101100010010', '01001101000001001100111001001', '10001010110111000110011000111', '10001000000001100100100100010', '10110111110101000110111101011', '10110100011001111000101001001', '10010111101001101100100001011', '11111000100111100100100101010', '00101010001001100101111101011', '00000101100010001000011001101', '10011110011001001010010000011', '01011000000011100111100101010', '10111110010010100100111110000', '00000000100001001001100010111', '11111110001000100101101011011', '10000010010101011110100011000', '10111010101010100110111110000', '10111010001111001001100010111', '10111010110011101101000111001', '10000010000111010111110010010', '11111110110010000001111110011'];   // regenerate with: python D:/Minigame/_workflow/tools/qr_matrix.py <url>
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
    if (ph) { g.fillStyle = 'rgba(12,8,28,.35)'; g.fillRect(130, 36, 40, 46); g.drawImage(photoCanvas(ph), 128, 34); txt('第' + ph.d + '天', 148, 75.5, 6, '#5a3a1a', 'center', null); } }
  g.fillStyle = 'rgba(12,8,28,.55)'; g.fillRect(0, 0, W, 26);
  txt('猫猫温泉旅馆', 90, 13, 14, '#ffe14a');
  g.fillStyle = '#2a1e3a'; g.fillRect(0, 150, W, H - 150); g.fillStyle = OUT; g.fillRect(0, 150, W, 2);
  // middle: stars (gold ones too) + the rank, the title, three numbers
  panel(10, 158, 160, 106);
  const gs = goldStars();
  for (let i = 0; i < 5; i++) g.drawImage(starIcon(i < star(), i < gs), 38 + i * 15, 165, 14, 14);
  g.drawImage(trophyIcon(), 120, 166, 14, 14); txt('#' + rankOf(S.hearts), 137, 173.5, 9, '#8a3a1a', 'left', null);
  txt(gs >= 5 ? '传说之汤' : star() >= 5 ? '五星旅馆' : star() + ' 星旅馆', 90, 191, 12, '#c0392b', 'center', null);
  const rowT = (y, a, b) => { txt(a, 26, y, 8, '#6a4a2a', 'left', null); txt(b, 154, y, 8, '#8a3a1a', 'right', null); };
  const ac = albumCount();
  rowT(209, '接待客人', S.stats.guests + ' 位'); rowT(226, '总收入', fmt(S.earned) + ' 鱼干'); rowT(243, '图鉴', ac.n + '/' + ac.m);
  // ---- QR + link ----
  drawQR(12, 280);
  txt('扫码，一起来开旅馆', 50, 289, 8.5, '#ffffff', 'left');
  txt(SHARE_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''), 50, 303, 6, '#9fe8ff', 'left');
  const S2 = 4, out = mk(W * S2, H * S2), o = out.getContext('2d'), k0 = K;
  o.imageSmoothingEnabled = false; o.drawImage(low, 0, 0, W * S2, H * S2);
  K = S2;
  for (const t of TQ) { const c = textSprite(t), w_ = c.w - 2 * c.pad; o.globalAlpha = t.alpha; o.drawImage(c.cv, R(t.x * K - c.pad - (t.align === 'center' ? w_ / 2 : t.align === 'right' ? w_ : 0)), R(t.y * K - c.h / 2)); }
  o.globalAlpha = 1; K = k0; TQ.length = 0; g.clearRect(0, 0, W, H);
  showShare(out, '我的猫猫温泉旅馆' + (star() >= 5 ? '成了五星旅馆' : '开张啦') + '，接待了 ' + S.stats.guests + ' 位客人，你也来开一家：');
}
let shareEl = null;
function showShare(cvs, msg) {
  const url = cvs.toDataURL('image/png'), name = 'purr-springs-' + Date.now().toString(36) + '.png';
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:10;background:rgba(6,10,24,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;box-sizing:border-box;touch-action:auto;color:#fff;font:15px ' + FONT;
  const img = document.createElement('img');
  img.src = url; img.alt = '分享卡';
  img.style.cssText = 'max-width:100%;max-height:70vh;image-rendering:pixelated;border:3px solid #1b1b2f;border-radius:4px;-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto';
  const tip = document.createElement('div'); tip.textContent = '手机上可以长按图片保存'; tip.style.opacity = '.8';
  const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center';
  const btn = (label, bg, fn) => { const b = document.createElement('button'); b.textContent = label; b.style.cssText = 'font:16px ' + FONT + ';color:#fff;background:' + bg + ';border:2px solid #1b1b2f;border-radius:4px;padding:8px 18px;cursor:pointer'; b.onclick = fn; row.appendChild(b); };
  btn('保存图片', '#48b858', () => { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); });
  try {
    cvs.toBlob(blob => {
      if (!blob || !navigator.canShare) return;
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) btn('分享给朋友', '#4a88e0', () => { navigator.share({ files: [file], title: '猫猫温泉旅馆', text: msg + SHARE_URL }).catch(() => {}); });
    });
  } catch (e) {}
  btn('关闭', '#8a8a9a', () => { el.remove(); shareEl = null; });
  el.appendChild(img); el.appendChild(tip); el.appendChild(row);
  document.body.appendChild(el); shareEl = el;
}
