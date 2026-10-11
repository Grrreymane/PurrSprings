// a sound effect by name (SPEC_v2 9.5); an unknown name is silent
function sfx(k, a) { const f = SFX[k]; if (typeof f === 'function') try { f.call(SFX, a); } catch (e) {} }
function vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
// save when hidden; the audio block suspends / resumes AC itself
document.addEventListener('visibilitychange', () => { try { if (document.hidden && state !== 'title') saveNow(); } catch (e) {} });
window.addEventListener('pagehide', () => { try { if (state !== 'title') saveNow(); } catch (e) {} try { if (AC) AC.close(); } catch (e) {} });
