function updateCoffeeParts(time, dt) {
  Object.keys(propAnim).forEach(id => {
    const p = propAnim[id];
    if (p.run > 0) p.run -= dt || 1 / 60;
  });

  const espresso = coffeeParts.espresso;
  if (espresso) {
    const p = propProgress('espresso');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    espresso.handles.forEach(h => { h.rotation.x = Math.PI / 2.4 + env * .5; });
    espresso.steam.visible = env > .05;
    if (espresso.steam.visible) {
      espresso.steam.position.y = .3 + (time * .3) % .06;
      espresso.steam.scale.setScalar(.85 + .15 * Math.sin(time * 6));
    }
  }

  const grinder = coffeeParts.grinder;
  if (grinder) {
    const p = propProgress('grinder');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    grinder.hopper.rotation.z = Math.sin(time * 30) * .08 * env;
    grinder.hopper.position.y = .245 + Math.abs(Math.sin(time * 30)) * .01 * env;
  }

  (coffeeParts.jars || []).forEach((jar, i) => {
    const p = propProgress('jar');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    jar.lid.position.y = .14 + env * .03;
    jar.lid.rotation.y = time * 2 * env + i;
  });

  const pastry = coffeeParts.pastry;
  if (pastry) {
    const p = propProgress('pastry');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    pastry.lid.position.y = .10 + env * .12;
  }

  const plant = coffeeParts.plant;
  if (plant) {
    const p = propProgress('plant');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    plant.leaves.rotation.z = Math.sin(time * 6) * .1 * env;
    plant.leaves.position.y = env * .02;
  }

  const shelf = coffeeParts.shelf;
  if (shelf) {
    const p = propProgress('shelf');
    const env = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    shelf.group.rotation.z = Math.sin(time * 8) * .015 * env;
  }

  const lamp = coffeeParts.lamp;
  if (lamp) {
    const targetOpacity = lamp.on ? 1 : .8;
    const targetColor = lamp.on ? 0xfff4d6 : 0x6b5f4a;
    lamp.bulbMat.opacity += (targetOpacity - lamp.bulbMat.opacity) * .1;
    lamp.bulbMat.color.lerp(new THREE.Color(targetColor), .1);
    if (lamp.glow) {
      const glowTarget = lamp.on ? .78 : 0;
      lamp.glow.material.opacity += (glowTarget - lamp.glow.material.opacity) * .12;
      lamp.glow.visible = lamp.glow.material.opacity > .02;
      lamp.glow.scale.setScalar(.95 + Math.sin(time * 2.2) * .035);
    }
    if (lamp.beamMat) {
      const beamTarget = lamp.on ? .16 : 0;
      lamp.beamMat.opacity += (beamTarget - lamp.beamMat.opacity) * .1;
      if (lamp.beam) lamp.beam.visible = lamp.beamMat.opacity > .01;
    }
    lamp.shade.rotation.z = Math.sin(time * .7) * .03;
  }
}

function updateBookshelf(time, dt) {
  for (const book of bookshelfBooks) {
    const u = book.userData;
    const target = u.out ? .16 : 0;
    u.vel += (target - u.cur) * .045;
    u.vel *= .82;
    u.cur += u.vel;
    book.position.x = u.bx + u.cur;
  }
}

function updateTeaSet(time, dt) {
  cupsList.forEach(c => {
    const u = c.userData;
    if (u.run > 0) u.run -= dt;
    const prog = u.run > 0 ? Math.min(Math.max(1 - u.run / 2.6, 0), 1) : 1;
    const env = u.run > 0 ? Math.sin(Math.PI * prog) : 0;
    c.position.y = u.baseY + env * .05;
    u.steam.visible = u.run > 0;
    if (u.steam.visible) {
      u.steam.position.y = .10 + (time * .25) % .07;
      const ss = .85 + .15 * Math.sin(time * 5);
      u.steam.scale.set(ss, 1, ss);
    }
  });

  if (!teapotPivot) return;
  if (potRun > 0) potRun -= dt;
  const p = potRun > 0 ? 1 - potRun / POT_T : 0;
  const sm = t => t * t * (3 - 2 * t);
  let ly = 0;
  let tilt = 0;
  if (p > 0) {
    if (p < .14) {
      ly = sm(p / .14) * .18;
    } else if (p < .30) {
      ly = .18;
    } else if (p < .40) {
      const u = sm((p - .30) / .10);
      ly = .18; tilt = u * POT_TILT;
    } else if (p < .70) {
      ly = .18; tilt = POT_TILT;
    } else if (p < .80) {
      const u = sm((p - .70) / .10);
      ly = .18; tilt = (1 - u) * POT_TILT;
    } else if (p < .94) {
      ly = .18;
    } else {
      const u = sm((p - .94) / .06);
      ly = (1 - u) * .18;
    }
  }
  const floating = p > .02 && p < .98;
  const bob = floating ? Math.sin(time * 3) * .012 : 0;
  teapotPivot.position.set(potBaseX, COFFEE_COUNTER_Y + ly + bob, potBaseZ);
  teapotBody.rotation.x = tilt;
  potHalo.visible = floating;
  if (floating) potHaloMat.opacity = .09 + .04 * (.5 + .5 * Math.sin(time * 5));

  if (tilt > POT_TILT * .7) {
    potStream.visible = true;
    potSpoutTip.getWorldPosition(_potTv);
    if (cupTargetRef) cupTargetRef.getWorldPosition(_potCv);
    else _potCv.copy(_potTv);
    _potCv.y += .09;
    const arr = potStreamGeom.attributes.position.array;
    for (let i = 0; i < 10; i++) {
      const tt = i / 9;
      const wob = Math.sin(tt * Math.PI);
      arr[i * 3] = _potTv.x + (_potCv.x - _potTv.x) * tt + Math.sin(tt * 9 + time * 8) * .008 * wob;
      arr[i * 3 + 1] = _potTv.y + (_potCv.y - _potTv.y) * tt - .035 * wob;
      arr[i * 3 + 2] = _potTv.z + (_potCv.z - _potTv.z) * tt + Math.cos(tt * 7 + time * 6) * .008 * wob;
    }
    potStreamGeom.attributes.position.needsUpdate = true;
  } else {
    potStream.visible = false;
  }
}
