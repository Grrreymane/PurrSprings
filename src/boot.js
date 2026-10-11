// ============================================================ boot
S = loadState();
resetWorld();
// Test hook (see tools/make_test_page.py): _test.html replaces the line below to expose eval + bots.
/*TEST_HOOK*/
if (location.hash === '#cover') { (document.fonts ? document.fonts.ready : Promise.resolve()).then(renderCover); window.__gameBooted = true; return; }
let last = performance.now(), frameErr = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  try { update(dt); render(); frameErr = 0; }
  catch (e) { if (frameErr++ === 0 && window.__gameErr) window.__gameErr(String(e && e.stack || e).slice(0, 600)); }
  requestAnimationFrame(frame);
}
window.__gameBooted = true;
requestAnimationFrame(frame);
