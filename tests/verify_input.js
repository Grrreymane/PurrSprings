// Verifier probe (browser): re-checks the input findings from the bugs audit, plus the thumb-switch handoff.
//   python D:/Minigame/_workflow/tools/make_test_page.py D:/Minigame/Hotelgame
//   python D:/Minigame/_workflow/tools/shot.py D:/Minigame/Hotelgame --page _test.html --size 540x1170 --wait 3000
//     --hash "#fetch('tests/verify_input.js').then(r=>r.text()).then(t=>eval(t))" --out D:/Minigame/Hotelgame/.shots/verify_input_phone.png
(() => {
  const out = [];
  const b0 = () => cv.getBoundingClientRect();
  const cl = (lx, ly) => { const b = b0(); return { clientX: b.left + lx / W * b.width, clientY: b.top + ly / H * b.height }; };
  const pe = (type, id, lx, ly, raw) => window.dispatchEvent(new PointerEvent(type, Object.assign({ pointerId: id, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true }, raw || cl(lx, ly))));
  const iv = () => { const v = inputVec(); return '(' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ')'; };
  newGame(); S.tut.moved = true;
  const b = b0();
  out.push('window ' + innerWidth + 'x' + innerHeight + ' canvas css ' + R(b.left) + ',' + R(b.top) + ' ' + R(b.width) + 'x' + R(b.height));
  // 1) stray second finger while thumb drags
  pe('pointerdown', 1, 90, 200); pe('pointermove', 1, 110, 200);
  out.push('1a thumb drag right: ' + iv());
  pe('pointerdown', 2, 40, 260); out.push('1b stray finger down: ' + iv() + ' JOY.id=' + JOY.id);
  pe('pointerup', 2, 40, 260); pe('pointermove', 1, 112, 200);
  out.push('1c stray lifts, thumb still held right: JOY.on=' + JOY.on + ' ' + iv());
  pe('pointerup', 1, 112, 200);
  // 2) thumb switch: new thumb down, old thumb up, new thumb drags
  pe('pointerdown', 1, 90, 200); pe('pointermove', 1, 110, 200);
  pe('pointerdown', 2, 60, 240); pe('pointerup', 1, 110, 200); pe('pointermove', 2, 60, 220);
  out.push('2 thumb switch (new down, old up, new drags up): JOY.on=' + JOY.on + ' ' + iv());
  pe('pointerup', 2, 60, 220);
  // 3) mute hit test: in-canvas icon, top bar above icon, top bar left, right side bar top strip far from canvas
  const tap = (raw, label) => { const m = musicOn; pe('pointerdown', 9, 0, 0, raw); pe('pointerup', 9, 0, 0, raw); out.push(label + ': ' + (musicOn !== m ? 'TOGGLED' : 'no')); musicOn = sfxOn = m; };
  tap(cl(172, 8), '3a icon in canvas');
  if (b.top > 20) { tap({ clientX: b.right - 10, clientY: b.top / 2 }, '3b top bar just above icon'); tap({ clientX: b.left + 30, clientY: b.top / 2 }, '3c top bar left'); }
  if (innerWidth - b.right > 40) tap({ clientX: innerWidth - 20, clientY: b.top + 10 }, '3d right side bar, top strip, ' + R(innerWidth - 20 - b.right) + 'px right of canvas');
  // 4) M held
  let flips = 0; const m1 = musicOn;
  for (let i = 0; i < 6; i++) { const w = musicOn; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', repeat: i > 0, bubbles: true })); if (musicOn !== w) flips++; }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyM', key: 'm', bubbles: true }));
  out.push('4 M held (1+5 repeats): toggles=' + flips); musicOn = sfxOn = m1;
  // 5) celebrate + keys; does WASD do anything there?
  go('celebrate'); st = 2;
  for (const code of ['Enter', 'Space', 'Escape']) window.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
  out.push('5 celebrate after Enter/Space/Esc: state=' + state);
  for (const k in KEYS) KEYS[k] = false;
  go('play');
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:6px;right:6px;top:6px;z-index:30;background:#000c;color:#fff;font:15px/1.45 monospace;padding:8px;white-space:pre-wrap';
  d.textContent = 'VERIFY INPUT\n' + out.join('\n');
  document.body.appendChild(d);
  document.title = 'VERIFY ' + out.length;
})();
