'use strict';

const NEWSPAPER_ISSUES = [
    {
        date: '今日特刊 · 晴后有魔法云',
        title: '小屋农田开放试种',
        body: '据小屋报刊社报道，屋外萝卜田已经完成初步建模。玩家可以装备锄头翻地，空手播种，再用水壶照顾作物。成熟后的萝卜会进入作物仓库，也能为后续金币系统和商店交换继续扩展。'
    },
    {
        date: '生活版 · 炉火旁来信',
        title: '金币开始在小屋流通',
        body: '新的金币记录系统已经启用。每一次值得纪念的收获、售卖或任务奖励，都可以累计到右上角的金币栏里。报刊社提醒各位魔女学徒：金币不会凭空变多，除非有人认真写了奖励逻辑。'
    },
    {
        date: '团队版 · 六人小组',
        title: '成员介绍页完成更新',
        body: '展示页中的六位成员头像已经可以围绕中心公转。点击头像会进入个人介绍页面，队长任嘉佑负责统筹所有工作、安排所有人的任务，也会继续推动小屋功能一点点长出来。'
    },
    {
        date: '商店版 · 茶馆门口',
        title: '返回小屋不再迷路',
        body: '茶馆的返回路线已经调整为回到游戏页，并会尽量恢复进入商店前的位置。小屋管理处表示：以后从哪里进商店，就应该回到哪里，不能每次都被传送到展示页门口。'
    }
];

let newspaperIndex = 0;
let newspaperReadCount = 0;

const newspaperPanel = document.getElementById('newspaperPanel');
const newspaperDate = document.getElementById('newspaperDate');
const newspaperHeadline = document.getElementById('newspaperHeadline');
const newspaperBody = document.getElementById('newspaperBody');
const newspaperCounter = document.getElementById('newspaperCounter');
const prevNewspaperBtn = document.getElementById('prevNewspaperBtn');
const nextNewspaperBtn = document.getElementById('nextNewspaperBtn');
const closeNewspaperBtn = document.getElementById('closeNewspaperBtn');

function makeLabelPlane(text, width, height, options) {
    const opts = options || {};
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.background || '#fffdf2';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = opts.border || '#2f352d';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    ctx.fillStyle = opts.color || '#2f352d';
    ctx.font = opts.font || 'bold 32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.19), material);
    return mesh;
}

function clampNewspaperIndex(value) {
    const n = Math.trunc(Number(value) || 0);
    return Math.max(0, Math.min(NEWSPAPER_ISSUES.length - 1, n));
}

function renderNewspaper() {
    if (!newspaperPanel) return;
    const issue = NEWSPAPER_ISSUES[newspaperIndex];
    newspaperDate.textContent = issue.date;
    newspaperHeadline.textContent = issue.title;
    newspaperBody.textContent = issue.body;
    newspaperCounter.textContent = (newspaperIndex + 1) + ' / ' + NEWSPAPER_ISSUES.length;
    prevNewspaperBtn.disabled = newspaperIndex === 0;
    nextNewspaperBtn.disabled = newspaperIndex === NEWSPAPER_ISSUES.length - 1;
}

function openNewspaper() {
    if (!newspaperPanel) return;
    newspaperReadCount++;
    renderNewspaper();
    newspaperPanel.hidden = false;
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (document.pointerLockElement) document.exitPointerLock();
    closeNewspaperBtn.focus();
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeNewspaper() {
    if (!newspaperPanel) return;
    newspaperPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
    if (typeof SND !== 'undefined') SND.play('ui');
}

function turnNewspaper(delta) {
    const next = clampNewspaperIndex(newspaperIndex + delta);
    if (next === newspaperIndex) return;
    newspaperIndex = next;
    renderNewspaper();
    if (typeof SND !== 'undefined') SND.play('chim');
}

function makeNewspaperRack() {
    const rack = new THREE.Group();
    rack.position.set(-3.18, 0, -1.95);
    rack.rotation.y = 1.18;
    scene.add(rack);

    const stand = edge(new THREE.BoxGeometry(0.66, 0.08, 0.44));
    stand.position.set(0, 0.62, 0);
    rack.add(stand);

    const legA = edge(new THREE.CylinderGeometry(0.018, 0.018, 0.62, 8));
    legA.position.set(-0.24, 0.31, -0.12);
    rack.add(legA);

    const legB = legA.clone();
    legB.position.set(0.24, 0.31, -0.12);
    rack.add(legB);

    const back = edge(new THREE.BoxGeometry(0.72, 0.50, 0.05));
    back.position.set(0, 0.88, -0.18);
    back.rotation.x = -0.22;
    rack.add(back);

    const label = makeLabelPlane('今日小屋报', 256, 80, {
        font: 'bold 34px Georgia',
        color: '#2f352d',
        background: '#fff8d8'
    });
    label.position.set(0, 1.02, -0.145);
    label.rotation.x = -0.22;
    rack.add(label);

    for (let i = 0; i < 5; i++) {
        const paper = edge(new THREE.BoxGeometry(0.50, 0.012, 0.34));
        paper.position.set((i - 2) * 0.018, 0.69 + i * 0.018, 0.03 + i * 0.018);
        paper.rotation.y = (i - 2) * 0.05;
        rack.add(paper);
    }

    const rolled = edge(new THREE.CylinderGeometry(0.055, 0.055, 0.46, 16));
    rolled.rotation.z = Math.PI / 2;
    rolled.position.set(0.02, 0.78, 0.19);
    rack.add(rolled);

    rack.userData.aimLabel = '阅读魔女小屋报刊';
    rack.userData.sfx = 'ui';
    regMagic(rack, openNewspaper);
    interactables.push({ x: rack.position.x, z: rack.position.z, r: 1.35, label: '阅读魔女小屋报刊', act: openNewspaper });
}

function captureNewspaperState() {
    return {
        index: newspaperIndex,
        readCount: newspaperReadCount
    };
}

function applyNewspaperState(state) {
    if (!state || typeof state !== 'object') return;
    newspaperIndex = clampNewspaperIndex(state.index);
    newspaperReadCount = Math.max(0, Math.trunc(Number(state.readCount) || 0));
    renderNewspaper();
}

if (closeNewspaperBtn) closeNewspaperBtn.addEventListener('click', closeNewspaper);
if (prevNewspaperBtn) prevNewspaperBtn.addEventListener('click', () => turnNewspaper(-1));
if (nextNewspaperBtn) nextNewspaperBtn.addEventListener('click', () => turnNewspaper(1));

addEventListener('keydown', e => {
    if (!newspaperPanel || newspaperPanel.hidden) return;
    if (e.key === 'Escape') closeNewspaper();
    if (e.key === 'ArrowLeft') turnNewspaper(-1);
    if (e.key === 'ArrowRight') turnNewspaper(1);
});

if (newspaperPanel) {
    newspaperPanel.addEventListener('click', e => {
        if (e.target === newspaperPanel) closeNewspaper();
    });
}

makeNewspaperRack();
renderNewspaper();

window.captureNewspaperState = captureNewspaperState;
window.applyNewspaperState = applyNewspaperState;
