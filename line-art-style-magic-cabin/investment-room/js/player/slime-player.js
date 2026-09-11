function buildRoom() {
  const houseHalf = 4;
  const backWinL = { c: -2.15, hw: .72, y0: 1.05, y1: 2.55 };
  const backWinR = { c: 1.9, hw: .58, y0: 1.15, y1: 2.3 };
  const ridgeY = 6.6;
  const eaveY = 4.4;
  const eaveX = 4.4;
  const roofSpan = 9.2;
  const roofAng = Math.atan2(ridgeY - eaveY, eaveX);
  const slopeLen = Math.hypot(eaveX, ridgeY - eaveY);

  put(new THREE.Mesh(new THREE.PlaneGeometry(8.6, 8.6), FLOOR_MAT), 0, -.01, 0, -Math.PI / 2);
  for (let z = -3.8; z <= 3.8; z += .75) put(line([[-4, .012, z], [4, .012, z]]));

  horizontalLogWall('x', -houseHalf, houseHalf, [backWinL, backWinR]);
  horizontalLogWall('z', houseHalf, houseHalf, []);
  gableWall(-houseHalf, []);

  put(box(slopeLen, .08, roofSpan), -eaveX / 2, (eaveY + ridgeY) / 2 + .04, 0, 0, 0, roofAng);
  put(log(roofSpan, .1), 0, ridgeY + .05, 0, Math.PI / 2, 0, 0);
  for (let t = .14; t < .96; t += .145) {
    const px = -eaveX + t * eaveX;
    const py = eaveY + t * (ridgeY - eaveY) + .13;
    put(log(roofSpan, .09), px, py, 0, Math.PI / 2, 0, 0);
  }
  put(log(slopeLen + .15, .1), -eaveX / 2, (eaveY + ridgeY) / 2 + .02, 4.55, 0, 0, roofAng - Math.PI / 2);
  put(line([[0, ridgeY + .05, -4.55], [-eaveX, eaveY, -4.55]]));
  put(line([[0, ridgeY + .05, 4.55], [-eaveX, eaveY, 4.55]]));
  put(box(.68, .045, 9.0), -4.12, 4.45, 0, 0, 0, roofAng);
  for (const z of [4.28, -4.28]) put(box(slopeLen - .1, .05, .6), -eaveX / 2, (eaveY + ridgeY) / 2 - .03, z, 0, 0, roofAng);

  squareWindow(backWinL.c, 1.78, -houseHalf, '-z', 1.3, 1.35, backWinL.hw);
  squareWindow(backWinR.c, 1.72, -houseHalf, '-z', 1.02, 1.1, backWinR.hw);
  buildFourScreenRig();
  buildRoundTable();
  buildHoloGlobe();
  buildSlimeSeats();
  buildCoffeeCorner();
  buildLoungeSofa();
  buildRoomBookshelf();
  buildPlayerSlime();
}

function buildPlayerSlime() {
  const group = buildSimpleSlime(0x55d7a0, false);
  group.scale.setScalar(1.3);
  put(group, player.x, 0, player.z, 0, player.yaw, 0);
  player.mesh = group;
  player.body = group.userData.body;
}

let sittingUntil = 0;
const PLAYER_JUMP_VY = 6.4;
const PLAYER_GRAVITY = 20;

function tryPlayerJump() {
  if (!screenPanel.hidden || !knowledgePanel.hidden) return;
  if (performance.now() < sittingUntil) return;
  const now = performance.now() * .001;
  if (player.onGround || (now - player.groundT) < .15) {
    player.vy = PLAYER_JUMP_VY;
    player.onGround = false;
    player.groundT = -10;
    player.squashV += 1.3;
    player.wobV += 2.2;
  }
}

function landPlayer(time) {
  if (player.vy < -3.0) {
    const impact = Math.min(1.5, (-player.vy - 3.0) * .3);
    player.squashV -= impact;
    player.wobV += impact * 2.6;
  }
  player.y = 0;
  player.vy = 0;
  player.onGround = true;
  player.groundT = time;
}

function updatePlayerMovement(dt, time) {
  if (!screenPanel.hidden || !knowledgePanel.hidden) return false;
  if (performance.now() < sittingUntil) return false;

  let ix = 0;
  let iz = 0;
  if (playerKeys.KeyW || playerKeys.ArrowUp) iz += 1;
  if (playerKeys.KeyS || playerKeys.ArrowDown) iz -= 1;
  if (playerKeys.KeyA || playerKeys.ArrowLeft) ix -= 1;
  if (playerKeys.KeyD || playerKeys.ArrowRight) ix += 1;
  const len = Math.hypot(ix, iz);
  if (len > 1) {
    ix /= len;
    iz /= len;
  }

  const running = !!(playerKeys.ShiftLeft || playerKeys.ShiftRight);
  const maxSpeed = running ? PLAYER_RUN : PLAYER_SPEED;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  let tx = 0;
  let tz = 0;
  if (ix !== 0 || iz !== 0) {
    tx = (fx * iz + rx * ix) * maxSpeed;
    tz = (fz * iz + rz * ix) * maxSpeed;
  }

  player.moveSpeed += (Math.hypot(tx, tz) - player.moveSpeed) * Math.min(1, dt * 10);
  const spd = player.moveSpeed;
  const moving = spd > .12;
  if (moving) player.pulse += dt * (2.6 + spd * 1.3);
  const creep = moving ? .45 + .55 * Math.max(0, Math.sin(player.pulse - .5)) : 1;

  let nx = Math.max(-3.7, Math.min(3.7, player.x + tx * dt * creep));
  let nz = Math.max(-3.7, Math.min(3.7, player.z + tz * dt * creep));

  const tdx = nx;
  const tdz = nz - TABLE_CENTER_Z;
  const tdist = Math.hypot(tdx, tdz);
  const tableMin = TABLE_RADIUS + .4;
  if (tdist > 0.0001 && tdist < tableMin) {
    nx = (tdx / tdist) * tableMin;
    nz = TABLE_CENTER_Z + (tdz / tdist) * tableMin;
  }

  const resolvedCoffee = resolveCoffeeCollision(nx, nz);
  nx = resolvedCoffee.x;
  nz = resolvedCoffee.z;

  player.x = nx;
  player.z = nz;
  if (spd > .15) player.yaw = Math.atan2(tx, tz);

  const ground = 0;
  if (player.y <= ground + .001 && player.vy <= 0) {
    landPlayer(time);
  } else {
    player.vy -= PLAYER_GRAVITY * dt;
    player.y += player.vy * dt;
    if (player.y <= ground && player.vy <= 0) landPlayer(time);
    else player.onGround = false;
  }

  if (player.mesh) {
    player.mesh.position.set(player.x, player.y, player.z);
    player.mesh.rotation.y = player.yaw;
  }
  return moving;
}

function updateControlledPlayerSlime(time, dt, moving) {
  if (!player.body) return;
  if (performance.now() < sittingUntil) {
    player.body.scale.set(1, .55, 1);
    player.body.position.y = .15;
    player.body.rotation.x = 0;
    player.body.rotation.z = 0;
    return;
  }

  const breathe = 1 + Math.sin(time * 1.7) * .03;
  const pulseSq = moving ? 1 - .10 * Math.max(0, Math.sin(player.pulse - .9)) : 1;
  let jumpSq = 1;
  if (!player.onGround) jumpSq = player.vy > 2 ? 1.22 : (player.vy < -2 ? 1.12 : 1.07);
  const targetS = .97 * breathe * pulseSq * jumpSq;
  player.squashV += (targetS - player.squash) * 165 * dt;
  player.squashV *= Math.exp(-6.2 * dt);
  player.squash += player.squashV * dt;

  const sy = Math.max(.45, Math.min(1.5, player.squash));
  player.wobV += -player.wob * 55 * dt;
  player.wobV *= Math.exp(-3.4 * dt);
  player.wob += player.wobV * dt;
  const wob = Math.max(-.35, Math.min(.35, player.wob));
  const sxz = (1 / Math.sqrt(sy)) * (1 + wob * .10);

  const leanT = Math.min(player.moveSpeed / PLAYER_RUN, 1) * .15;
  player.tiltV += (leanT - player.tilt) * 130 * dt;
  player.tiltV *= Math.exp(-5 * dt);
  player.tilt += player.tiltV * dt;

  player.body.scale.set(sxz, sy, sxz);
  player.body.position.y = .26 * sy;
  player.body.rotation.x = player.tilt + wob * .35;
  player.body.rotation.z = Math.sin(time * 2.1) * .02 +
    Math.sin(player.pulse * .5) * .035 * Math.min(player.moveSpeed / PLAYER_RUN, 1) + wob * .55;
}
