'use strict';

const worldMapPanel = document.getElementById('worldMapPanel');
const worldMapSvg = document.getElementById('worldMapSvg');
const worldMapMenuBtn = document.getElementById('worldMapMenuBtn');
const worldMapQuestBtn = document.getElementById('worldMapQuestBtn');
const worldMapCloseBtn = document.getElementById('closeWorldMapBtn');
const worldMapInfoKind = document.getElementById('worldMapInfoKind');
const worldMapInfoTitle = document.getElementById('worldMapInfoTitle');
const worldMapInfoBody = document.getElementById('worldMapInfoBody');
const worldMapInfoDistance = document.getElementById('worldMapInfoDistance');

const WORLD_MAP_IMAGE = 'assets/ui/world-map.webp';
const WORLD_MAP_SIZE = { w: 1491, h: 1055 };
const WORLD_MAP_BOUNDS = { minX: -24, maxX: 23, minZ: -18, maxZ: 16 };
const WORLD_MAP_PLACES = [
    { id: 'home', name: '魔女小屋', kind: '主屋', x: 0, z: 0, w: 7.8, h: 7.8, color: '#c88057', note: '发家之路的起点。报纸、存档和屋内的各种交互都在这里。' },
    { id: 'farm', name: '农场', kind: '农田', x: 9, z: 0, w: 8.4, h: 8.4, color: '#74a176', note: '种植、收割和雇佣农场经营者。' },
    { id: 'store', name: '杂货铺 · 仓库', kind: '商店', x: 10, z: -10, w: 6.4, h: 5.6, color: '#b88761', note: '购买种子、整理仓库和补充经营所需的物资。' },
    { id: 'cafe', name: '线稿咖啡馆', kind: '咖啡馆', x: 16.25, z: -10, w: 4.2, h: 4.2, color: '#a9848d', note: '在仓库旁边，手头紧时可以来这里打工。' },
    { id: 'tea', name: '茶园 · 制茶小屋', kind: '茶场', x: -11.5, z: -9, w: 8.2, h: 7, color: '#829d68', note: '采茶青，晒茶、炒茶，再把成品茶装袋出售。' },
    { id: 'well', name: '水井', kind: '设施', x: 8, z: 6, w: 1.5, h: 1.5, color: '#70a8af', note: '农场旁边的水井。' },
    { id: 'investment', name: '股市小屋', kind: '投资', x: -12, z: 8.5, w: 3.8, h: 3.8, color: '#629ba7', note: '查看新闻、股价和持仓，判断什么时候买卖。' },
    { id: 'coin', name: '钱滚钱商店', kind: '投资', x: -18, z: 8.2, w: 3.8, h: 3.8, color: '#ac9563', note: '高风险的小游戏，记得量力而行。' }
];

const WORLD_MAP_SVG_NS = 'http://www.w3.org/2000/svg';
let worldMapPlayerMarker = null;
let worldMapGoalMarker = null;
let worldMapRoute = null;
let worldMapSelected = null;
let worldMapTimer = null;
let worldMapReturnFocus = null;
const worldMapGuideBtn = document.getElementById('worldMapGuideBtn');

/* ---------------- 实地虚线指引：地图上点了地方，脚下的地面就真的
   有一条虚线通向那儿，跟着走就是了，不用一直翻地图看。 ---------------- */

let worldGuideTargetPlace = null;
let worldGuideLine = null;
const WORLD_GUIDE_ARRIVE_DIST = 1.6;

function worldGuideGroundY(x, z) {
    return (typeof groundAt === 'function' ? groundAt(x, z, 0) : 0) + 0.04;
}

function ensureWorldGuideLine() {
    if (worldGuideLine || typeof scene === 'undefined') return;
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
    ]);
    const material = new THREE.LineDashedMaterial({
        color: 0xffd873,
        dashSize: 0.36,
        gapSize: 0.24,
        transparent: true,
        opacity: 0.92,
        depthTest: false
    });
    worldGuideLine = new THREE.Line(geometry, material);
    worldGuideLine.renderOrder = 50;
    worldGuideLine.frustumCulled = false;
    scene.add(worldGuideLine);
}

function setWorldGuideTarget(place) {
    if (worldGuideTargetPlace && worldGuideTargetPlace.id === place.id) {
        clearWorldGuideTarget();
        return;
    }
    worldGuideTargetPlace = place;
    ensureWorldGuideLine();
    if (worldGuideLine) worldGuideLine.visible = true;
    updateWorldGuideLine();
    if (worldMapGuideBtn) worldMapGuideBtn.textContent = '取消这条路线（' + place.name + '）';
    if (typeof showHintOverride === 'function') showHintOverride('地上已经标出去 ' + place.name + ' 的路了，跟着虚线走');
}

function clearWorldGuideTarget(silent) {
    worldGuideTargetPlace = null;
    if (worldGuideLine) worldGuideLine.visible = false;
    if (worldMapGuideBtn) worldMapGuideBtn.textContent = '在地上标出路线';
    if (!silent && typeof showHintOverride === 'function') showHintOverride('已取消地面路线指引');
}

function updateWorldGuideLine() {
    if (!worldGuideTargetPlace || !worldGuideLine) return;
    const pos = worldMapPosition();
    const target = worldGuideTargetPlace;
    const dist = Math.hypot(target.x - pos.x, target.z - pos.z);
    if (dist <= WORLD_GUIDE_ARRIVE_DIST) {
        const name = target.name;
        clearWorldGuideTarget(true);
        if (typeof showHintOverride === 'function') showHintOverride('到啦——' + name);
        if (typeof SND !== 'undefined') SND.play('chim');
        return;
    }
    const y0 = worldGuideGroundY(pos.x, pos.z);
    const y1 = worldGuideGroundY(target.x, target.z);
    const positions = worldGuideLine.geometry.attributes.position;
    positions.setXYZ(0, pos.x, y0, pos.z);
    positions.setXYZ(1, target.x, y1, target.z);
    positions.needsUpdate = true;
    worldGuideLine.geometry.computeBoundingSphere();
    worldGuideLine.computeLineDistances();
}

function updateWorldMapGuide(dt) {
    if (!worldGuideTargetPlace) return;
    updateWorldGuideLine();
}
window.updateWorldMapGuide = updateWorldMapGuide;

if (worldMapGuideBtn) {
    worldMapGuideBtn.addEventListener('click', event => {
        event.stopPropagation();
        if (worldMapSelected) setWorldGuideTarget(worldMapSelected);
    });
}

function worldMapPoint(x, z) {
    return {
        x: 84 + (x - WORLD_MAP_BOUNDS.minX) / (WORLD_MAP_BOUNDS.maxX - WORLD_MAP_BOUNDS.minX) * (WORLD_MAP_SIZE.w - 168),
        y: 88 + (z - WORLD_MAP_BOUNDS.minZ) / (WORLD_MAP_BOUNDS.maxZ - WORLD_MAP_BOUNDS.minZ) * (WORLD_MAP_SIZE.h - 176)
    };
}

function worldMapNode(tag, attrs, parent) {
    const node = document.createElementNS(WORLD_MAP_SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (parent) parent.appendChild(node);
    return node;
}

function worldMapText(x, y, label, className, parent) {
    const node = worldMapNode('text', { x, y, class: className, 'text-anchor': 'middle' }, parent);
    node.textContent = label;
    return node;
}

function worldMapPosition() {
    return typeof player !== 'undefined' && player.pos ? player.pos : { x: 0, z: 0 };
}

function worldMapSelect(place) {
    worldMapSelected = place;
    worldMapInfoKind.textContent = place.kind;
    worldMapInfoTitle.textContent = place.name;
    worldMapInfoBody.textContent = place.note;
    if (worldMapGuideBtn) {
        const active = worldGuideTargetPlace && worldGuideTargetPlace.id === place.id;
        worldMapGuideBtn.textContent = active ? '取消这条路线（' + place.name + '）' : '在地上标出路线';
    }
    worldMapUpdate();
}

function worldMapDraw() {
    worldMapSvg.replaceChildren();
    worldMapNode('image', {
        href: WORLD_MAP_IMAGE,
        x: 0,
        y: 0,
        width: WORLD_MAP_SIZE.w,
        height: WORLD_MAP_SIZE.h,
        preserveAspectRatio: 'xMidYMid meet',
        class: 'worldMapImage'
    }, worldMapSvg);

    const north = worldMapNode('g', { class: 'worldMapNorth' }, worldMapSvg);
    worldMapText(1364, 84, 'N', 'worldMapNorthLabel', north);
    worldMapNode('path', { d: 'M1364 93 L1352 123 L1364 114 L1376 123 Z' }, north);

    WORLD_MAP_PLACES.forEach(place => {
        const p = worldMapPoint(place.x, place.z);
        const w = Math.max(56, place.w / 47 * (WORLD_MAP_SIZE.w - 168));
        const h = Math.max(48, place.h / 34 * (WORLD_MAP_SIZE.h - 176));
        const group = worldMapNode('g', { class: 'worldMapPlace', role: 'button', tabindex: '0', 'aria-label': place.name }, worldMapSvg);
        worldMapNode('rect', { x: p.x - w / 2, y: p.y - h / 2, width: w, height: h, rx: 14, class: 'worldMapHotspot' }, group);
        worldMapText(p.x, p.y + h / 2 + 19, place.name, 'worldMapPlaceLabel', group);
        worldMapNode('title', {}, group).textContent = place.name;
        group.addEventListener('click', () => worldMapSelect(place));
        group.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            worldMapSelect(place);
        });
    });

    worldMapRoute = worldMapNode('line', { class: 'worldMapTargetRoute' }, worldMapSvg);
    worldMapGoalMarker = worldMapNode('g', { class: 'worldMapGoalMarker' }, worldMapSvg);
    worldMapNode('circle', { r: 24 }, worldMapGoalMarker);
    worldMapNode('circle', { r: 8 }, worldMapGoalMarker);
    worldMapPlayerMarker = worldMapNode('g', { class: 'worldMapPlayerMarker' }, worldMapSvg);
    worldMapNode('path', { d: 'M0 -29 L20 21 L0 11 L-20 21 Z' }, worldMapPlayerMarker);
    worldMapNode('circle', { r: 5 }, worldMapPlayerMarker);
}

function worldMapUpdate() {
    if (!worldMapPlayerMarker) return;
    const pos = worldMapPosition();
    const p = worldMapPoint(Number(pos.x) || 0, Number(pos.z) || 0);
    const yaw = typeof player !== 'undefined' && Number.isFinite(player.yaw) ? player.yaw : 0;
    worldMapPlayerMarker.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${yaw * 180 / Math.PI})`);
    const objective = typeof currentMainStoryObjective === 'function' ? currentMainStoryObjective() : null;
    worldMapGoalMarker.hidden = !objective;
    worldMapRoute.hidden = !objective;
    if (objective) {
        const goal = worldMapPoint(objective.x, objective.z);
        worldMapGoalMarker.setAttribute('transform', `translate(${goal.x} ${goal.y})`);
        worldMapRoute.setAttribute('x1', p.x);
        worldMapRoute.setAttribute('y1', p.y);
        worldMapRoute.setAttribute('x2', goal.x);
        worldMapRoute.setAttribute('y2', goal.y);
    }
    if (worldMapSelected) {
        worldMapInfoDistance.textContent = '距你约 ' + Math.round(Math.hypot(worldMapSelected.x - pos.x, worldMapSelected.z - pos.z)) + ' 米';
    }
}

function openWorldMap(event) {
    if (!worldMapPanel || window.APP_GAME_MODAL_OPEN) return;
    worldMapReturnFocus = event && event.currentTarget || document.activeElement;
    document.getElementById('menuPanel')?.classList.remove('open');
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    worldMapDraw();
    worldMapSelect(WORLD_MAP_PLACES[0]);
    worldMapPanel.hidden = false;
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    worldMapTimer = setInterval(worldMapUpdate, 150);
    worldMapCloseBtn.focus();
}

function closeWorldMap() {
    if (!worldMapPanel || worldMapPanel.hidden) return;
    clearInterval(worldMapTimer);
    worldMapTimer = null;
    worldMapPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (worldMapReturnFocus && document.contains(worldMapReturnFocus)) worldMapReturnFocus.focus();
}

worldMapMenuBtn?.addEventListener('click', openWorldMap);
worldMapQuestBtn?.addEventListener('click', openWorldMap);
worldMapCloseBtn?.addEventListener('click', closeWorldMap);
worldMapPanel?.addEventListener('click', event => {
    if (event.target === worldMapPanel) closeWorldMap();
});
addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !worldMapPanel || worldMapPanel.hidden) return;
    event.preventDefault();
    closeWorldMap();
});
