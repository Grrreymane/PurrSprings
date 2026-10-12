// A short frame-exact clip of the innkeeper walking (18.2 smooth-walking check), 60 fps, at dusk: along the lobby's back
// row behind the front desk (it must cover him), then up the main corridor. Look at it frame by frame: the innkeeper
// stays put on the screen, the floor slides evenly, the desk stays in front of him, his towels move with him.
//   python D:/Minigame/_workflow/tools/record_video.py D:/Minigame/Hotelgame tools/walk_video.js --fps 60 --size 540x960 --out .shots/walk.mp4
(() => {
  const unl = ids => ids.forEach(id => { S.unlocked[id] = true; S.paid[id] = UNLOCK[id].price; });
  REC.run({ fps: 60, seconds: 5, canvas: cv, setup() {
    newGame(); S.tut.moved = true; unl(['room2', 'room3', 'onsen', 'recep', 'shoes1', 'shoes2', 'tea', 'basket1']);
    for (const rm of ROOMS) if (roomOpen(rm) && !S.rooms[rm.id]) S.rooms[rm.id] = 'clean';
    S.peak = starOf(S); S.clock = .7; resetWorld(); go('play'); spawnT = 1e9;
    Object.assign(P, { x: 12 * TILE + 8, y: 24 * TILE + 6, dir: 'right', towels: 4 }); updCam(0, true);
    REC.log(`K ${K.toFixed(2)}, ${playerSpeed()} px/s`);
  }, step(i) {
    const t = i / 60;
    botMove = t < 1.8 ? { x: 1, y: 0 } : t < 2.3 ? { x: .7, y: -.7 } : { x: 0, y: -1 };
    update(1 / 60); if (state === 'card') modalClose(); render();
    if (i % 60 === 0) REC.log(`t ${t.toFixed(1)} state ${state} P ${P.x.toFixed(1)},${P.y.toFixed(1)} cam ${cam.x.toFixed(2)},${cam.y.toFixed(2)}`);
  } });
})();
