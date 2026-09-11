'use strict';

const canvas = document.getElementById('roomCanvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5ebda);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4.8, 13);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);

const LINE_MAT = new THREE.LineBasicMaterial({ color: 0x111111 });
const FILL_MAT = new THREE.MeshBasicMaterial({ color: 0xfffdf6 });
const FLOOR_MAT = new THREE.MeshBasicMaterial({ color: 0xf5ead4, side: THREE.DoubleSide });
const GLASS_MAT = new THREE.MeshBasicMaterial({ color: 0xf7fbff, transparent: true, opacity: .42 });
const SCREEN_MAT = new THREE.MeshBasicMaterial({ color: 0x08161b });
const SCREEN_FRAME_MAT = new THREE.MeshBasicMaterial({ color: 0x141d21 });
const SCREEN_TRIM_MAT = new THREE.LineBasicMaterial({ color: 0x5be6ff, transparent: true, opacity: .85 });
const WOOD_MAT = new THREE.MeshBasicMaterial({ color: 0x6b4a30 });
const WOOD_DARK_MAT = new THREE.MeshBasicMaterial({ color: 0x3a2a1c });
const METAL_MAT = new THREE.MeshBasicMaterial({ color: 0x2c2f33 });
const PLANT_LEAF_MAT = new THREE.MeshBasicMaterial({ color: 0x5c8a52 });
const PLANT_POT_MAT = new THREE.MeshBasicMaterial({ color: 0xb5714a });
const PAPER_BAG_MAT = new THREE.MeshBasicMaterial({ color: 0xc9a877 });
const JAR_GLASS_MAT = new THREE.MeshBasicMaterial({ color: 0xf7fbff, transparent: true, opacity: .35 });
const BEAN_MAT = new THREE.MeshBasicMaterial({ color: 0x4a3220, transparent: true, opacity: .8 });
const SLIME_COLORS = [0x7ac7b2, 0x9bb9dc, 0xd3adcf, 0xf2c86b, 0xa7c985];
let holoGlobe = null;
let holoGlobeFx = null;
const cupsList = [];
const POT_T = 3.2;
const POT_TILT = .6;
const POT_TIP_FWD = .13;
let potRun = 0;
let teapotPivot = null;
let teapotBody = null;
let potHalo = null;
let potHaloMat = null;
let potStream = null;
let potStreamGeom = null;
let potSpoutTip = null;
let cupTargetRef = null;
let potBaseX = 0;
let potBaseZ = 0;
let potRy = 0;
const _potTv = new THREE.Vector3();
const _potCv = new THREE.Vector3();
const TABLE_CENTER_Z = -0.4;

function edge(geo, material) {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(geo, material || FILL_MAT));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 18), LINE_MAT));
  return group;
}

function box(w, h, d, material) {
  return edge(new THREE.BoxGeometry(w, h, d), material);
}

function line(points) {
  const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.Line(geo, LINE_MAT);
}

function log(length, radius) {
  return edge(new THREE.CylinderGeometry(radius || .09, radius || .09, length, 10), FILL_MAT);
}

function logBetween(p1, p2, r, parent) {
  const v = new THREE.Vector3(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
  const seg = edge(new THREE.CylinderGeometry(r, r, v.length(), 8));
  seg.position.set((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2);
  seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
  (parent || scene).add(seg);
  return seg;
}

function put(obj, x, y, z, rx, ry, rz, parent) {
  obj.position.set(x || 0, y || 0, z || 0);
  obj.rotation.set(rx || 0, ry || 0, rz || 0);
  (parent || scene).add(obj);
  return obj;
}

function canvasTexture(w, h, draw) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvasEl);
  if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.userData = { ctx, width: w, height: h, draw };
  return texture;
}

function redrawTexture(texture) {
  const data = texture.userData;
  if (!data || !data.draw) return;
  data.draw(data.ctx, data.width, data.height);
  texture.needsUpdate = true;
}

function chartScreen(width, height, draw, screenKey) {
  const group = new THREE.Group();
  const texture = canvasTexture(768, 432, draw);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
  );
  screen.userData.screenKey = screenKey;
  screen.userData.screenTexture = texture;
  group.add(screen);
  put(box(width + .12, height + .12, .08, SCREEN_FRAME_MAT), 0, 0, -.035, 0, 0, 0, group);
  put(screen, 0, 0, .02, 0, 0, 0, group);
  const trimW = width / 2 + .015;
  const trimH = height / 2 + .015;
  const trim = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-trimW, -trimH, .028),
      new THREE.Vector3(trimW, -trimH, .028),
      new THREE.Vector3(trimW, trimH, .028),
      new THREE.Vector3(-trimW, trimH, .028)
    ]),
    SCREEN_TRIM_MAT
  );
  group.add(trim);
  screenMeshes.push(screen);
  screenTextures.push(texture);
  return group;
}
