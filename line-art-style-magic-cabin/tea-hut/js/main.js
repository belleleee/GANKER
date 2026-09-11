'use strict';

const canvas = document.getElementById('teaHutCanvas');
const hintEl = document.getElementById('teaHint');
const panel = document.getElementById('inspectPanel');
const panelTitle = document.getElementById('inspectTitle');
const panelBody = document.getElementById('inspectBody');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf7f0df);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.05, 80);
camera.position.set(0, 1.35, 4.4);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

scene.add(new THREE.HemisphereLight(0xfff6e6, 0x6c7a68, 1.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(3, 5, 4);
scene.add(sun);

const lineMat = new THREE.LineBasicMaterial({ color: 0x191714 });
const mats = {
    wood: new THREE.MeshLambertMaterial({ color: 0x9a744f }),
    darkWood: new THREE.MeshLambertMaterial({ color: 0x644832 }),
    floor: new THREE.MeshLambertMaterial({ color: 0xd9c49f }),
    wall: new THREE.MeshLambertMaterial({ color: 0xf1e8d5 }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x78966b }),
    lightLeaf: new THREE.MeshLambertMaterial({ color: 0xa6b98c }),
    stone: new THREE.MeshLambertMaterial({ color: 0xaaa497 }),
    cloth: new THREE.MeshLambertMaterial({ color: 0xf7f0df }),
    fire: new THREE.MeshBasicMaterial({ color: 0xd89646 }),
    black: new THREE.MeshLambertMaterial({ color: 0x2a2824 })
};

function part(geo, mat) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 16), lineMat));
    return g;
}

function put(obj, x, y, z, rx = 0, ry = 0, rz = 0, parent = scene) {
    obj.position.set(x, y, z);
    obj.rotation.set(rx, ry, rz);
    parent.add(obj);
    return obj;
}

function box(w, h, d, mat = mats.wood) {
    return part(new THREE.BoxGeometry(w, h, d), mat);
}

function cyl(r1, r2, h, seg, mat, open = false) {
    return part(new THREE.CylinderGeometry(r1, r2, h, seg, 1, open), mat);
}

function makeTextPlane(lines, width, height, bg = '#f7f0df', fg = '#26231f') {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#8f7558';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, c.width - 32, c.height - 32);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, i) => {
        ctx.font = line.font || '30px "Songti SC", "STSong", serif';
        ctx.fillText(line.text, c.width / 2, line.y || 90 + i * 70);
    });
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
}

const interactables = [];

function addInteractable(obj, label, body) {
    obj.userData.label = label;
    obj.userData.body = body;
    interactables.push(obj);
}

function showPanel(title, body) {
    panelTitle.textContent = title;
    panelBody.innerHTML = body;
    panel.hidden = false;
}

function buildRoom() {
    put(box(7.4, 0.12, 5.8, mats.floor), 0, -0.06, 0);
    put(box(7.5, 2.5, 0.12, mats.wall), 0, 1.19, -2.9);
    put(box(0.12, 2.5, 5.8, mats.wall), -3.75, 1.19, 0);
    put(box(0.12, 2.5, 5.8, mats.wall), 3.75, 1.19, 0);

    for (let x = -3.0; x <= 3.01; x += 0.55) {
        put(box(0.035, 0.02, 5.65, mats.darkWood), x, 0.025, 0);
    }

    put(box(7.8, 0.16, 3.1, mats.darkWood), 0, 2.55, -0.45, 0.18, 0, 0);
    put(box(7.8, 0.16, 3.1, mats.darkWood), 0, 2.55, 0.45, -0.18, 0, 0);
    put(box(0.14, 0.14, 6.1, mats.darkWood), 0, 2.88, 0);

    const sign = makeTextPlane([
        { text: '制茶小屋', font: 'bold 58px "Songti SC", "STSong", serif', y: 118 },
        { text: '采好茶，做好茶。', font: '26px "Songti SC", "STSong", serif', y: 202 }
    ], 1.7, 0.86);
    put(sign, 0, 1.82, -2.965);
}

function buildStove() {
    const g = new THREE.Group();
    put(g, 2.25, 0, -1.72);
    put(box(1.05, 0.75, 0.96, mats.stone), 0, 0.38, 0, 0, 0, 0, g);
    put(box(0.46, 0.28, 0.035, mats.black), 0, 0.36, 0.50, 0, 0, 0, g);
    put(part(new THREE.ConeGeometry(0.16, 0.32, 6), mats.fire), 0, 0.42, 0.54, 0, 0, 0, g);
    put(cyl(0.56, 0.44, 0.18, 20, mats.black), 0, 0.84, 0, 0, 0, 0, g);
    const leaves = put(part(new THREE.SphereGeometry(0.36, 12, 8), mats.lightLeaf), 0, 0.94, 0, 0, 0, 0, g);
    leaves.scale.set(1.2, 0.14, 0.72);
    put(box(0.46, 1.92, 0.46, mats.stone), 0.38, 1.62, -0.36, 0, 0.04, 0, g);
    addInteractable(g, '炒茶灶', '这里负责杀青和翻炒。茶叶会从青涩的草味，慢慢变成更香的熟茶味。');
}

function buildWorkTable() {
    const g = new THREE.Group();
    put(g, -0.35, 0, 0.85);
    put(box(2.25, 0.16, 0.94, mats.wood), 0, 0.72, 0, 0, 0, 0, g);
    for (const x of [-0.86, 0.86]) for (const z of [-0.34, 0.34]) put(cyl(0.045, 0.055, 0.70, 7, mats.darkWood), x, 0.36, z, 0, 0, 0, g);
    put(box(0.72, 0.10, 0.32, mats.darkWood), -0.65, 0.84, 0.12, 0, -0.2, 0, g);
    put(cyl(0.15, 0.15, 0.04, 16, mats.black), 0.20, 0.84, -0.12, 0, 0, 0, g);
    put(cyl(0.09, 0.11, 0.18, 12, mats.cloth), 0.54, 0.90, 0.18, 0, 0, 0, g);
    addInteractable(g, '工作台', '茶叶在这里分拣、称重、记录。好茶先靠眼睛挑，再靠手感确认。');
}

function buildDryingArea() {
    const g = new THREE.Group();
    put(g, -2.35, 0, -1.35);
    for (const z of [-0.55, 0, 0.55]) {
        put(cyl(0.58, 0.58, 0.065, 22, mats.wood), 0, 0.48, z, 0, 0, 0, g);
        const leaves = put(part(new THREE.SphereGeometry(0.40, 12, 8), mats.leaf), 0, 0.55, z, 0, 0, 0, g);
        leaves.scale.set(1, 0.10, 0.72);
    }
    addInteractable(g, '晒茶筛', '摊开茶青，让水汽慢慢散掉。太急会苦，太慢会闷。');
}

function buildStorage() {
    const g = new THREE.Group();
    put(g, 2.35, 0, 1.25);
    put(cyl(0.32, 0.26, 0.56, 12, mats.wood, true), 0, 0.30, 0, 0, 0, 0, g);
    put(cyl(0.24, 0.20, 0.40, 12, mats.wood, true), 0.58, 0.23, 0.14, 0, 0, 0, g);
    put(box(0.72, 0.54, 0.58, mats.wood), -0.62, 0.28, 0.16, 0, 0, 0, g);
    put(box(0.48, 0.82, 0.30, mats.cloth), 0.20, 0.42, -0.70, 0, 0, 0, g);
    const label = makeTextPlane([{ text: '茶叶', font: 'bold 28px "Songti SC", "STSong", serif', y: 150 }], 0.32, 0.24);
    put(label, 0.20, 0.46, -0.86, 0, 0, 0, g);
    addInteractable(g, '茶叶仓储', '成品茶、竹筛、木桶和茶袋都放在这里。以后可以接入售卖、订单和库存。');
}

function buildSlime() {
    const g = new THREE.Group();
    const body = part(new THREE.SphereGeometry(0.26, 22, 16), new THREE.MeshBasicMaterial({ color: 0x8ee4c5, transparent: true, opacity: 0.62 }));
    body.scale.y = 0.78;
    body.position.y = 0.25;
    g.add(body);
    for (const x of [-0.085, 0.085]) put(part(new THREE.SphereGeometry(0.018, 8, 6), mats.black), x, 0.34, 0.22, 0, 0, 0, g);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshBasicMaterial({ color: 0x1e5a40, transparent: true, opacity: 0.16, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    g.add(shadow);
    return { root: g, body };
}

buildRoom();
buildStove();
buildWorkTable();
buildDryingArea();
buildStorage();
const slime = buildSlime();
scene.add(slime.root);

const keys = new Set();
let yaw = Math.PI;
let mouseDown = false;
let nearest = null;

window.addEventListener('keydown', e => {
    keys.add(e.code);
    if (e.code === 'KeyE') interact();
    if (e.code === 'Escape') panel.hidden = true;
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('mousedown', () => { mouseDown = true; });
window.addEventListener('mouseup', () => { mouseDown = false; });
window.addEventListener('mousemove', e => {
    if (!mouseDown) return;
    yaw -= e.movementX * 0.004;
});

function interact() {
    if (!nearest) return;
    showPanel(nearest.userData.label, nearest.userData.body);
}

function update(dt, time) {
    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3.6 : 2.1;
    const f = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const r = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const dir = new THREE.Vector3();
    if (f || r) {
        dir.set(Math.sin(yaw) * f + Math.cos(yaw) * r, 0, Math.cos(yaw) * f - Math.sin(yaw) * r).normalize();
        slime.root.position.addScaledVector(dir, speed * dt);
        slime.root.position.x = Math.max(-3.05, Math.min(3.05, slime.root.position.x));
        slime.root.position.z = Math.max(-2.20, Math.min(2.20, slime.root.position.z));
        slime.root.rotation.y = Math.atan2(dir.x, dir.z);
    }
    const bob = 1 + Math.sin(time * 2.2) * 0.035;
    slime.body.scale.set(1 / Math.sqrt(bob), 0.78 * bob, 1 / Math.sqrt(bob));

    camera.position.set(
        slime.root.position.x - Math.sin(yaw) * 4.0,
        2.35,
        slime.root.position.z - Math.cos(yaw) * 4.0
    );
    camera.lookAt(slime.root.position.x, 0.72, slime.root.position.z);

    nearest = null;
    let best = 1.35;
    for (const obj of interactables) {
        const d = obj.position.distanceTo(slime.root.position);
        if (d < best) {
            nearest = obj;
            best = d;
        }
    }
    hintEl.textContent = nearest ? '按 E 互动：' + nearest.userData.label : 'WASD 移动，靠近物品按 E 互动';
}

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt, now / 1000);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('returnBtn').addEventListener('click', () => {
    window.location.href = '../game.html?from=store';
});
document.getElementById('closePanelBtn').addEventListener('click', () => {
    panel.hidden = true;
});
