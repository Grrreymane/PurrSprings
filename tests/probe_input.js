// Browser probe for the pointer / keyboard handlers (they can't run in headless.js, which stubs addEventListener).
// Eval'd inside the game closure from _test.html (see WORKFLOW 5):
//   python D:/Minigame/_workflow/tools/make_test_page.py D:/Minigame/Hotelgame
//   python D:/Minigame/_workflow/tools/shot.py D:/Minigame/Hotelgame --page _test.html --size 540x1170 --wait 3000
//     --hash "#fetch('tests/probe_input.js').then(r=>r.text()).then(t=>eval(t))" --out D:/Minigame/Hotelgame/.shots/probe_input.png
// Synthetic PointerEvents / KeyboardEvents are dispatched on window; results are printed in an overlay.
(() => {
  const out = [];
  const r = () => cv.getBoundingClientRect();
  const cl = (lx, ly) => { const b = r(); return { clientX: b.left + lx / W * b.width, clientY: b.top + ly / H * b.height }; };
  const pe = (type, id, lx, ly, raw) => window.dispatchEvent(new PointerEvent(type, Object.assign({ pointerId: id, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true }, raw || cl(lx, ly))));
  const iv = () => { const v = inputVec(); return '(' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ')'; };
  newGame(); S.tut.moved = true;
  // ---- two fingers
  pe('pointerdown', 1, 90, 200); pe('pointermove', 1, 110, 200);
  out.push('A finger1 down+drag right 20: JOY.on=' + JOY.on + ' input=' + iv());
  pe('pointerdown', 2, 40, 260);
  out.push('B finger2 down elsewhere: JOY.id=' + JOY.id + ' base=(' + R(JOY.bx) + ',' + R(JOY.by) + ') input=' + iv());
  pe('pointermove', 1, 120, 200);
  out.push('C finger1 drags further: input=' + iv() + ' (ignored)');
  pe('pointerup', 2, 40, 260);
  pe('pointermove', 1, 130, 200);
  out.push('D finger2 lifts, finger1 still held 40px right: JOY.on=' + JOY.on + ' input=' + iv());
  pe('pointerup', 1, 130, 200);
  // ---- tap in the letterbox bar above the canvas, right side
  const b = r(), m0 = muted;
  if (b.top > 20) {
    pe('pointerdown', 3, 0, 0, { clientX: b.right - 8, clientY: b.top / 2 }); pe('pointerup', 3, 0, 0, { clientX: b.right - 8, clientY: b.top / 2 });
    out.push('E tap in black bar above canvas (y=' + R(b.top / 2) + 'px, canvas top ' + R(b.top) + 'px): muted ' + m0 + ' -> ' + muted);
  } else out.push('E no top letterbox at this window size');
  muted = m0;
  // ---- key auto-repeat on M
  const m1 = muted; let flips = 0;
  for (let i = 0; i < 4; i++) { const was = muted; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', repeat: i > 0, bubbles: true })); if (muted !== was) flips++; }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', key: 'm', bubbles: true }));
  out.push('F hold M (1 press + 3 auto-repeats): mute toggled ' + flips + ' times');
  muted = m1;
  // ---- keyboard on the celebration panel
  go('celebrate'); st = 2;
  for (const code of ['Enter', 'Space', 'Escape']) window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
  out.push('G celebrate + Enter/Space/Escape: state=' + state);
  go('play');
  // ---- print
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:6px;right:6px;top:6px;z-index:30;background:#000c;color:#fff;font:15px/1.45 monospace;padding:8px;white-space:pre-wrap';
  d.textContent = 'INPUT PROBE\n' + out.join('\n');
  document.body.appendChild(d);
  document.title = 'PROBE ' + out.length;
  console.log(out.join('\n'));
})();
