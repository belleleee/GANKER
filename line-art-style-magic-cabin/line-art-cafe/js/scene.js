'use strict';
/* ============ 触屏检测 / 通用工具 ============ */
const mqCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
const mqFine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
const IS_TOUCH = mqCoarse || (('ontouchstart' in window) && navigator.maxTouchPoints > 0 && !mqFine);
if (IS_TOUCH) document.body.classList.add('touch');

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ============ 场景 / 相机 / 渲染器 ============ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfdfbf6);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const MAT = new THREE.LineBasicMaterial({ color: 0x1a1a1a });

/* ============ 精简版线稿光照材质：环境光 + 3 个静态点光源 ============ */
const sharedU = {
    uAmbient: { value: new THREE.Color(0.55, 0.55, 0.58) },
    uLightPos: { value: [new THREE.Vector3(0, 3.0, -0.9), new THREE.Vector3(0, 1.3, -0.9), new THREE.Vector3(0, 2.1, 2)] },
    uLightColorI: { value: [new THREE.Color(1, 0.95, 0.85), new THREE.Color(0.85, 0.62, 0.32), new THREE.Color(0.6, 0.63, 0.66)] }
};
const VSH = `
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    void main(){
        vec4 wp = modelMatrix * vec4(position,1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
    }
`;
const FSH = `
    uniform vec3 uTint;
    uniform vec3 uAmbient;
    uniform vec3 uLightPos[3];
    uniform vec3 uLightColorI[3];
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    void main(){
        vec3 light = uAmbient;
        for(int i=0;i<3;i++){
            vec3 d = uLightPos[i]-vWorldPos;
            float atten = 1.0/(1.0+dot(d,d)*0.15);
            float ndotl = max(dot(normalize(vNormal), normalize(d)), 0.25);
            light += uLightColorI[i]*atten*ndotl;
        }
        gl_FragColor = vec4(uTint*light,1.0);
    }
`;
function LITMAT(hex) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uTint: { value: new THREE.Color(hex) },
            uAmbient: sharedU.uAmbient,
            uLightPos: sharedU.uLightPos,
            uLightColorI: sharedU.uLightColorI
        },
        vertexShader: VSH,
        fragmentShader: FSH
    });
}

/* ============ 几何 / 建模工具 ============ */
function edge(g) { return new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), MAT); }
function solid(g, hex, parent) {
    const m = new THREE.Mesh(g, LITMAT(hex));
    (parent || scene).add(m);
    m.add(edge(g));
    return m;
}
function put(o, x, y, z, parent) { o.position.set(x, y, z); (parent || scene).add(o); return o; }
function makeIconSprite(icon, size, depthTest) {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '46px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, 32, 36);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: depthTest !== false });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(size, size, 1);
    return spr;
}

/* ============ 布局常量 ============ */
const DOOR_HALF = 0.9, DOOR_TOP = 2.2, WALL_H = 3.2;
/* 吧台是横贯房间的隔断：玩家在后侧（吧台+取货点），顾客在前侧（门口+等待区），两者隔着吧台面对面 */
const DIVIDER = { x1: -5.1, x2: 5.1, z1: -1.3, z2: -0.5, top: 1.0 };
const STATION_Z = -1.15;
const TABLES = [{ x: -3.8, z: 2.8, r: 0.55 }, { x: 3.8, z: 2.8, r: 0.55 }];
const WAIT_SLOTS = [{ x: -1.3, z: 0.3 }, { x: 1.3, z: 0.3 }];
const DOOR_OUTSIDE = { x: 0, z: 6.4 };
const PLAYER_R = 0.32, EYE_HEIGHT = 1.6, MOVE_SPEED = 3.4, INTERACT_DIST = 4.2;
const MAX_LIVES = 3, WIN_COINS = 100;

const DRINKS = [
    { id: 'coffee', name: '咖啡', icon: '☕', color: 0x6f4e37, price: 12 },
    { id: 'milktea', name: '奶茶', icon: '🧋', color: 0xd8a35c, price: 14 },
    { id: 'tea', name: '红茶', icon: '🍵', color: 0xa0522d, price: 10 },
    { id: 'juice', name: '果汁', icon: '🧃', color: 0xff9d3d, price: 10 },
    { id: 'cookie', name: '曲奇', icon: '🍪', color: 0xc98a4b, price: 8 },
    { id: 'cake', name: '蛋糕', icon: '🍰', color: 0xf5b8c4, price: 16 }
];
const DRINK_MAP = {}; for (const d of DRINKS) DRINK_MAP[d.id] = d;
const CUSTOMER_COLORS = [0x8ec1de, 0xe0a8c4, 0xb9d68a, 0xe8c26a, 0xc7a8e8, 0xe8927a];

/* ============ 房屋搭建 ============ */
const colliders = [];
function wallBox(x1, x2, z1, z2, y1, y2, hex) {
    const w = x2 - x1, h = y2 - y1, d = z2 - z1;
    const m = solid(new THREE.BoxGeometry(w, h, d), hex || 0xf3ede0);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
    return m;
}
function buildRoom() {
    solid(new THREE.BoxGeometry(10.2, 0.1, 10.2), 0xe9dfc9).position.set(0, -0.05, 0);
    wallBox(-5.1, 5.1, -5.2, -5.0, 0, WALL_H);
    wallBox(-5.2, -5.0, -5.1, 5.1, 0, WALL_H);
    wallBox(5.0, 5.2, -5.1, 5.1, 0, WALL_H);
    wallBox(-5.1, -DOOR_HALF, 4.9, 5.1, 0, WALL_H);
    wallBox(DOOR_HALF, 5.1, 4.9, 5.1, 0, WALL_H);
    wallBox(-DOOR_HALF, DOOR_HALF, 4.9, 5.1, DOOR_TOP, WALL_H);

    colliders.push({ x1: -5.3, x2: 5.3, z1: -5.3, z2: -4.9 });
    colliders.push({ x1: -5.3, x2: -4.9, z1: -5.3, z2: 5.3 });
    colliders.push({ x1: 4.9, x2: 5.3, z1: -5.3, z2: 5.3 });
    colliders.push({ x1: -5.3, x2: -DOOR_HALF, z1: 4.9, z2: 5.3 });
    colliders.push({ x1: DOOR_HALF, x2: 5.3, z1: 4.9, z2: 5.3 });

    wallBox(DIVIDER.x1, DIVIDER.x2, DIVIDER.z1, DIVIDER.z2, 0, DIVIDER.top, 0xcfa06a);
    colliders.push({ x1: -5.3, x2: 5.3, z1: DIVIDER.z1 - 0.05, z2: DIVIDER.z2 + 0.05 });

    for (const t of TABLES) buildTable(t);
    buildWindow(-4.95, 0, 'x');
    buildWindow(4.95, 0, 'x');
    buildPendant();
}
function buildTable(t) {
    const g = new THREE.Group(); put(g, t.x, 0, t.z);
    solid(new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8), 0x8a6a45, g).position.y = 0.375;
    solid(new THREE.CylinderGeometry(t.r, t.r, 0.06, 20), 0xd9c39a, g).position.y = 0.78;
    for (let a = 0; a < 2; a++) {
        const ang = a * Math.PI + 0.5;
        buildStool(t.x + Math.sin(ang) * (t.r + 0.45), t.z + Math.cos(ang) * (t.r + 0.45));
    }
    const m = t.r + 0.75;
    colliders.push({ x1: t.x - m, x2: t.x + m, z1: t.z - m, z2: t.z + m });
}
function buildStool(x, z) {
    const g = new THREE.Group(); put(g, x, 0, z);
    solid(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), 0x8a6a45, g).position.y = 0.225;
    solid(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 14), 0xb5895a, g).position.y = 0.47;
}
function buildWindow(x, z, axis) {
    const paneGeo = new THREE.PlaneGeometry(1.1, 1.0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const pane = new THREE.Mesh(paneGeo, mat);
    pane.position.set(x, 1.9, z);
    if (axis === 'x') pane.rotation.y = Math.PI / 2;
    scene.add(pane);
    const frame = edge(paneGeo);
    frame.position.copy(pane.position); frame.rotation.copy(pane.rotation);
    scene.add(frame);
}
function buildPendant() {
    const g = new THREE.Group(); put(g, 0, 3.0, -0.9);
    solid(new THREE.SphereGeometry(0.16, 12, 10), 0xfff2cf, g);
    solid(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), 0x555555, g).position.y = 0.4;
}

/* ============ 取货站（吧台饮品） ============ */
const stationMeshes = [];
function buildStations() {
    const n = DRINKS.length;
    const span = 5.6;
    for (let i = 0; i < n; i++) {
        const x = -span / 2 + span * (i + 0.5) / n;
        buildStation(DRINKS[i], x);
    }
}
function buildStation(drink, x) {
    const g = new THREE.Group(); put(g, x, DIVIDER.top, STATION_Z);
    solid(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), 0xf5f0e6, g).position.y = 0.02;
    const cup = solid(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 12), drink.color, g);
    cup.position.y = 0.13;
    cup.userData.station = drink;
    stationMeshes.push(cup);
    const label = makeIconSprite(drink.icon, 0.32);
    label.position.set(0, 0.5, 0);
    g.add(label);
}
