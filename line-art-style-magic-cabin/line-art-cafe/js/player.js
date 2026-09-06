'use strict';
/* ============ 玩家控制 ============ */
const player = { x: 0, z: -3.3 };
let yaw = Math.PI, pitch = -0.22;
const forward = new THREE.Vector3(), right = new THREE.Vector3();
const keys = {};
let heldItem = null;

function collideXZ(px, pz) {
    for (const b of colliders) {
        const cx = Math.max(b.x1, Math.min(px, b.x2));
        const cz = Math.max(b.z1, Math.min(pz, b.z2));
        let dx = px - cx, dz = pz - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 < PLAYER_R * PLAYER_R) {
            if (d2 < 1e-9) {
                const l = px - b.x1, r = b.x2 - px, t = pz - b.z1, bt = b.z2 - pz;
                const m = Math.min(l, r, t, bt);
                if (m === l) px = b.x1 - PLAYER_R; else if (m === r) px = b.x2 + PLAYER_R;
                else if (m === t) pz = b.z1 - PLAYER_R; else pz = b.z2 + PLAYER_R;
            } else {
                const d = Math.sqrt(d2);
                px = cx + dx / d * PLAYER_R; pz = cz + dz / d * PLAYER_R;
            }
        }
    }
    px = clamp(px, -4.7, 4.7); pz = clamp(pz, -4.7, 4.7);
    return [px, pz];
}

let joyF = 0, joyR = 0;
function updatePlayer(dt) {
    let f = 0, r = 0;
    if (IS_TOUCH) { f = joyF; r = joyR; }
    else {
        f = (keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0);
        r = (keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0);
    }
    forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(-forward.z, 0, forward.x);
    const mx = forward.x * f + right.x * r, mz = forward.z * f + right.z * r;
    const len = Math.hypot(mx, mz);
    if (len > 1e-4) {
        const s = MOVE_SPEED * dt / len;
        const [nx, nz] = collideXZ(player.x + mx * s, player.z + mz * s);
        player.x = nx; player.z = nz;
    }
    camera.position.set(player.x, EYE_HEIGHT, player.z);
    camera.rotation.y = yaw; camera.rotation.x = pitch;
}

addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyE') doInteract(); });
addEventListener('keyup', e => { keys[e.code] = false; });

addEventListener('mousemove', e => {
    if (document.pointerLockElement !== renderer.domElement) return;
    yaw -= e.movementX * 0.0022;
    pitch = clamp(pitch - e.movementY * 0.0022, -1.2, 1.2);
});
renderer.domElement.addEventListener('click', () => {
    if (!IS_TOUCH && gameState === 'playing' && !document.pointerLockElement) renderer.domElement.requestPointerLock();
});

/* ============ 缩放：桌面滚轮 / 触屏双指捏合 ============ */
const BASE_FOV = 60, MIN_FOV = 32, MAX_FOV = 75;
let fov = BASE_FOV;
function setFov(v) { fov = clamp(v, MIN_FOV, MAX_FOV); camera.fov = fov; camera.updateProjectionMatrix(); }
renderer.domElement.addEventListener('wheel', e => {
    e.preventDefault();
    setFov(fov + e.deltaY * 0.05);
}, { passive: false });

let lookId = null, lastLX = 0, lastLY = 0;
const touchPointers = new Map();
let pinchDist = null;
renderer.domElement.addEventListener('pointerdown', e => {
    if (!IS_TOUCH) return;
    touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchPointers.size === 2) {
        lookId = null;
        const pts = [...touchPointers.values()];
        pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    } else if (touchPointers.size === 1 && lookId === null) {
        lookId = e.pointerId; lastLX = e.clientX; lastLY = e.clientY;
    }
});
renderer.domElement.addEventListener('pointermove', e => {
    if (!IS_TOUCH || !touchPointers.has(e.pointerId)) return;
    touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchPointers.size >= 2) {
        const pts = [...touchPointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinchDist != null) setFov(fov - (d - pinchDist) * 0.05);
        pinchDist = d;
        return;
    }
    if (e.pointerId !== lookId) return;
    const dx = e.clientX - lastLX, dy = e.clientY - lastLY;
    lastLX = e.clientX; lastLY = e.clientY;
    yaw -= dx * 0.0035; pitch = clamp(pitch - dy * 0.0035, -1.2, 1.2);
});
function releaseTouchPointer(e) {
    if (!IS_TOUCH) return;
    touchPointers.delete(e.pointerId);
    if (e.pointerId === lookId) lookId = null;
    if (touchPointers.size < 2) pinchDist = null;
    if (touchPointers.size === 1 && lookId === null) {
        const [id, p] = [...touchPointers.entries()][0];
        lookId = id; lastLX = p.x; lastLY = p.y;
    }
}
renderer.domElement.addEventListener('pointerup', releaseTouchPointer);
renderer.domElement.addEventListener('pointercancel', releaseTouchPointer);

const joyZone = document.getElementById('joyZone');
const joyBase = document.getElementById('joyBase');
const joyKnob = document.getElementById('joyKnob');
const JOY_R = 52;
let joyId = null, joyCX = 0, joyCY = 0;
joyZone.addEventListener('pointerdown', e => {
    if (joyId !== null) return;
    joyId = e.pointerId; joyCX = e.clientX; joyCY = e.clientY;
    joyBase.style.left = joyCX + 'px'; joyBase.style.top = joyCY + 'px'; joyBase.style.display = 'block';
});
joyZone.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    let dx = e.clientX - joyCX, dy = e.clientY - joyCY;
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) { dx = dx / d * JOY_R; dy = dy / d * JOY_R; }
    joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    joyR = dx / JOY_R; joyF = -dy / JOY_R;
});
function joyEnd(e) {
    if (e.pointerId !== joyId) return;
    joyId = null; joyBase.style.display = 'none'; joyKnob.style.transform = 'translate(0,0)';
    joyF = 0; joyR = 0;
}
joyZone.addEventListener('pointerup', joyEnd);
joyZone.addEventListener('pointercancel', joyEnd);

const btnAct = document.getElementById('btnAct');
btnAct.addEventListener('pointerdown', e => { e.preventDefault(); btnAct.classList.add('pressed'); doInteract(); });
btnAct.addEventListener('pointerup', () => btnAct.classList.remove('pressed'));
btnAct.addEventListener('pointercancel', () => btnAct.classList.remove('pressed'));

const crosshairEl = document.getElementById('crosshair');
const lockTipEl = document.getElementById('lockTip');
function updateLockUI() {
    if (IS_TOUCH) { crosshairEl.classList.add('show'); lockTipEl.classList.remove('show'); return; }
    if (document.pointerLockElement === renderer.domElement) {
        crosshairEl.classList.add('show'); lockTipEl.classList.remove('show');
    } else {
        crosshairEl.classList.remove('show');
        lockTipEl.classList.toggle('show', gameState === 'playing');
    }
}
document.addEventListener('pointerlockchange', updateLockUI);

/* ============ 交互（拾取 / 交付） ============ */
const raycaster = new THREE.Raycaster();
const CENTER2 = new THREE.Vector2(0, 0);
const hintEl = document.getElementById('hint');

function getAimTarget() {
    raycaster.setFromCamera(CENTER2, camera);
    const sHits = raycaster.intersectObjects(stationMeshes, false);
    if (sHits.length && sHits[0].distance < INTERACT_DIST) return { type: 'station', ref: sHits[0].object.userData.station };
    const custMeshes = customers.filter(c => c.state === 'waiting').map(c => c.mesh);
    if (custMeshes.length) {
        const cHits = raycaster.intersectObjects(custMeshes, true);
        if (cHits.length && cHits[0].distance < INTERACT_DIST) {
            let o = cHits[0].object;
            while (o && !o.userData.customerRef) o = o.parent;
            if (o) return { type: 'customer', ref: o.userData.customerRef };
        }
    }
    return null;
}
function updateInteractHint() {
    if (gameState !== 'playing') { hintEl.classList.remove('show'); return; }
    const t = getAimTarget();
    if (!t) { hintEl.classList.remove('show'); return; }
    if (t.type === 'station') hintEl.innerHTML = '按 <b>E</b> 取 ' + t.ref.icon + t.ref.name;
    else hintEl.innerHTML = heldItem ? '按 <b>E</b> 交付' : '看看顾客要点什么';
    hintEl.classList.add('show');
}
function doInteract() {
    if (gameState !== 'playing') return;
    const t = getAimTarget();
    if (!t) return;
    if (t.type === 'station') tryPickup(t.ref);
    else tryDeliver(t.ref);
}
function tryPickup(drink) {
    heldItem = drink.id;
    updateHeldHUD();
    SND.play('ui');
}
function tryDeliver(cust) {
    if (!heldItem) return;
    if (heldItem === cust.drink.id) {
        coins += cust.drink.price;
        updateHUD();
        saveCafeRevenue();
        heldItem = null; updateHeldHUD();
        SND.play('chim');
        flashScreen('#7fd18a');
        resolveCustomer(cust, true);
        if (coins >= WIN_COINS) endGame(true);
    } else {
        heldItem = null; updateHeldHUD();
        SND.play('toggle');
        flashScreen('#e05a5a');
    }
}
