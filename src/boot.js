// ============================================================ boot
const cloudy = cloudWanted();   // cloud.js: in the platform's player the SDK restores the save (from the default here)
S = loadState(cloudy ? {} : undefined);
resetWorld();
if (cloudy) { cloudStart(); langFetch(); boardBoot(); }   // i18n.js: the author's newest translations; board.js: the 1GP ranking
try { document.documentElement.lang = LANG; if (LANG !== 'zh') document.title = tr('猫猫温泉旅馆'); } catch (e) {}
// Test hook (see tools/make_test_page.py): _test.html replaces the line below to expose eval + bots.
/*TEST_HOOK*/
if (location.hash === '#cover') { (document.fonts ? document.fonts.ready : Promise.resolve()).then(renderCover); window.__gameBooted = true; return; }
let last = performance.now(), frameErr = 0, FRAME_DT = 1 / 60;
function frame(now) {
  let dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  // 18.2 (smooth walking): rAF timestamps jitter by a fraction of a millisecond; on a steady display every frame should
  // move the innkeeper the same distance, so a frame time near the running average counts as exactly that average
  if (dt > .004 && dt < .045) { FRAME_DT += (dt - FRAME_DT) * .05; if (Math.abs(dt - FRAME_DT) < FRAME_DT * .25) dt = FRAME_DT; }
  try { update(dt); render(); frameErr = 0; }
  catch (e) { if (frameErr++ === 0 && window.__gameErr) window.__gameErr(String(e && e.stack || e).slice(0, 600)); }
  requestAnimationFrame(frame);
}
window.__gameBooted = true;
requestAnimationFrame(frame);
