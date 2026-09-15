'use strict';

/* 开局炼金链：发光书 -> 取试剂 -> 坩埚失败 -> 主线开始 */
const ALCHEMY_INTRO_BOOK = { x: -3.58, z: -3.05 };
const ALCHEMY_INTRO_REAGENT = { x: -3.85, z: -0.10 };
const ALCHEMY_INTRO_CAULDRON = { x: -2.35, z: -0.45 };
const ALCHEMY_INTRO_START = { x: -3.02, z: -2.12, yaw: Math.PI };

const alchemyIntroState = {
    bookRead: false,
    reagentsTaken: false,
    cauldronUsed: false,
    complete: false,
    startedStory: false,
    dialogScene: 'wake',
    dialogIndex: 0
};

let alchemyBookGlow = null;
let alchemyBookLight = null;
let alchemyRecipeBoard = null;
let alchemyIntroPulse = 0;
let alchemyFailureFlash = 0;
let alchemyIntroOverlay = null;
let alchemyIntroGuide = null;
let alchemyIntroBeam = null;
let alchemyIntroTaskCard = null;
let alchemyIntroDialog = null;
let alchemyStageBeacons = [];
const alchemyIntroProjector = new THREE.Vector3();

const ALCHEMY_INTRO_DIALOGUES = {
    wake: [
        { speaker: '???', text: '……你醒了。' },
        { speaker: '???', text: '屋里暗得不正常。看向右侧的书架，那里有一本散发着微光的书。' },
        { speaker: '???', text: '去打开它吧。或许这里有改变现状的方法。' }
    ],
    book: [
        { speaker: '旁白', text: '书页自动翻到最后一页，纸边像被火燎过，正中画着一个圈。' },
        { speaker: '旁白', text: '圈里写着两个字——召唤。' },
        { speaker: '你', text: '召唤？我只是想把一枚金币变成两枚。' },
        { speaker: '旁白', text: '配方下面浮出一行小字：旧硬币、茶叶、星尘。墙上的瓶架似乎刚好有这些东西。' }
    ],
    reagents: [
        { speaker: '旁白', text: '瓶架上的小瓶自己晃了一下，像是在催你别磨蹭。' },
        { speaker: '???', text: '旧硬币压底，茶叶居中，星尘最后放。顺序错了，锅会不高兴。' },
        { speaker: '你', text: '锅还会不高兴？' },
        { speaker: '???', text: '你马上就知道了。把材料倒进炼金锅。' }
    ],
    cauldron: [
        { speaker: '旁白', text: '材料落进锅里，绿色的火光从锅沿爬出来。' },
        { speaker: '你', text: '看起来……好像成功了？' },
        { speaker: '???', text: '别急。赚钱这事，最怕你以为自己已经成功了。' },
        { speaker: '旁白', text: '下一秒，魔法阵亮得像白昼。' }
    ]
};

function alchemyIntroStep() {
    if (!alchemyIntroState.bookRead) return 0;
    if (!alchemyIntroState.reagentsTaken) return 1;
    if (!alchemyIntroState.cauldronUsed) return 2;
    return 3;
}

function alchemyIntroHint() {
    const step = alchemyIntroStep();
    if (step === 0) return '打开发光的炼金书';
    if (step === 1) return '按配方取下瓶架上的旧硬币、茶叶和星尘';
    if (step === 2) return '把材料倒进大魔女坩埚';
    return '炼金失败已经发生';
}

function alchemyIntroTaskTitle() {
    const step = alchemyIntroStep();
    if (step === 0) return '打开书架上的《炼金术》';
    if (step === 1) return '按配方摆弄瓶架上的材料';
    if (step === 2) return '把材料倒进炼金锅';
    return '炼金失败之后';
}

function alchemyIntroNarration() {
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    return lines[Math.min(alchemyIntroState.dialogIndex, lines.length - 1)] || lines[0];
}

function alchemyIntroDialogueDone() {
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    return alchemyIntroState.dialogIndex >= lines.length - 1;
}

function setAlchemyIntroDialogScene(sceneName) {
    if (!ALCHEMY_INTRO_DIALOGUES[sceneName]) return;
    alchemyIntroState.dialogScene = sceneName;
    alchemyIntroState.dialogIndex = 0;
}

function advanceAlchemyIntroDialogue() {
    if (alchemyIntroState.complete) return;
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    if (alchemyIntroState.dialogIndex < lines.length - 1) {
        alchemyIntroState.dialogIndex += 1;
        if (typeof SND !== 'undefined') SND.play('ui');
        if (typeof saveGameState === 'function') saveGameState(false);
    }
}

function alchemyIntroTarget() {
    const step = alchemyIntroStep();
    if (step === 0) return { x: ALCHEMY_INTRO_BOOK.x, y: 1.50, z: ALCHEMY_INTRO_BOOK.z, radius: 135, cam: [-1.70, 1.46, -3.18] };
    if (step === 1) return { x: ALCHEMY_INTRO_REAGENT.x, y: 1.62, z: ALCHEMY_INTRO_REAGENT.z, radius: 155, cam: [-2.45, 1.48, -0.05] };
    return { x: ALCHEMY_INTRO_CAULDRON.x, y: 1.08, z: ALCHEMY_INTRO_CAULDRON.z, radius: 190, cam: [-1.38, 1.50, -1.32] };
}

function ensureAlchemyIntroOverlay() {
    if (alchemyIntroBeam) return;
    alchemyIntroBeam = document.createElement('div');
    alchemyIntroBeam.id = 'alchemyIntroBeam';
    alchemyIntroBeam.style.cssText = [
        'position:fixed',
        'width:22px',
        'height:22px',
        'z-index:10002',
        'pointer-events:none',
        'border-radius:50%',
        'border:2px solid rgba(205,255,246,.95)',
        'box-shadow:0 0 18px rgba(143,255,231,.95),0 0 56px rgba(143,255,231,.55)',
        'transform:translate(-50%,-50%)',
        'transition:opacity .25s ease'
    ].join(';');
    document.body.appendChild(alchemyIntroBeam);

    /* 看书/取材料/搅拌这三步的引导台词，用大号对话框呈现——不再是容易
       被忽略的角落小提示。不遮挡操作（pointer-events:none），点一下或
       按 Enter 只是翻到下一句，不点也不影响交互本身。 */
    alchemyIntroDialog = document.createElement('div');
    alchemyIntroDialog.id = 'alchemyIntroDialog';
    alchemyIntroDialog.style.cssText = [
        'position:fixed',
        'left:50%',
        'bottom:42px',
        'transform:translateX(-50%)',
        'z-index:10001',
        'pointer-events:auto',
        'cursor:pointer',
        'width:min(1120px,calc(100vw - 170px))',
        'min-height:128px',
        'padding:28px 42px 26px 96px',
        'border:1px solid rgba(255,255,255,.38)',
        'border-radius:12px',
        'background:linear-gradient(180deg,rgba(18,22,28,.88),rgba(8,11,16,.92))',
        'color:#f7f0dc',
        'font:500 24px/1.7 system-ui,-apple-system,BlinkMacSystemFont,\"Microsoft YaHei\",sans-serif',
        'box-shadow:0 18px 40px rgba(0,0,0,.38)',
        'opacity:0',
        'transition:opacity .3s ease'
    ].join(';');
    const nameTag = document.createElement('div');
    nameTag.textContent = '???';
    nameTag.style.cssText = [
        'position:absolute',
        'left:34px',
        'top:-30px',
        'min-width:160px',
        'height:42px',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'border-radius:13px 13px 4px 4px',
        'background:rgba(222,199,154,.92)',
        'color:#211a14',
        'font-weight:800'
    ].join(';');
    const sparkle = document.createElement('div');
    sparkle.textContent = '✦';
    sparkle.style.cssText = 'position:absolute;left:34px;top:36px;color:#ffd778;font-size:38px;text-shadow:0 0 18px rgba(255,215,120,.9)';
    const text = document.createElement('div');
    text.className = 'alchemy-intro-dialog-text';
    const arrow = document.createElement('div');
    arrow.className = 'alchemy-intro-dialog-arrow';
    arrow.textContent = '▼';
    arrow.style.cssText = 'position:absolute;right:28px;bottom:18px;color:#ffffff;font-size:25px;animation:alchemyIntroArrow 1s ease-in-out infinite';
    if (!document.getElementById('alchemyIntroStyle')) {
        const style = document.createElement('style');
        style.id = 'alchemyIntroStyle';
        style.textContent = '@keyframes alchemyIntroArrow{0%,100%{transform:translateY(0);opacity:.95}50%{transform:translateY(6px);opacity:.55}}';
        document.head.appendChild(style);
    }
    alchemyIntroDialog.appendChild(nameTag);
    alchemyIntroDialog.appendChild(sparkle);
    alchemyIntroDialog.appendChild(text);
    alchemyIntroDialog.appendChild(arrow);
    alchemyIntroDialog.addEventListener('click', advanceAlchemyIntroDialogue);
    document.body.appendChild(alchemyIntroDialog);
}

function setAlchemyIntroOverlayVisible(visible) {
    ensureAlchemyIntroOverlay();
    if (alchemyIntroGuide) alchemyIntroGuide.style.opacity = visible ? '1' : '0';
    if (alchemyIntroDialog) alchemyIntroDialog.style.opacity = visible ? '1' : '0';
    if (alchemyIntroBeam) alchemyIntroBeam.style.opacity = visible ? '1' : '0';
}

function setAlchemyRecipeVisible(visible) {
    if (alchemyRecipeBoard) alchemyRecipeBoard.visible = !!visible;
}

function createAlchemyIntroBook() {
    const g = new THREE.Group();
    g.position.set(ALCHEMY_INTRO_BOOK.x, 1.43, ALCHEMY_INTRO_BOOK.z);
    g.rotation.y = Math.PI / 2;
    const coverMat = new THREE.MeshBasicMaterial({ color: 0x2d6f64, transparent: true, opacity: 0.96 });
    const pageMat = new THREE.MeshBasicMaterial({ color: 0xfff6da, transparent: true, opacity: 0.92 });
    put(solid(new THREE.BoxGeometry(0.055, 0.40, 0.30), coverMat), 0, 0, 0, 0, 0, 0, g);
    put(solid(new THREE.BoxGeometry(0.058, 0.34, 0.25), pageMat), 0.003, 0, 0, 0, 0, 0, g);
    put(line([[0.037, -0.11, -0.09], [0.037, -0.11, 0.09]]), 0, 0, 0, 0, 0, 0, g);
    put(line([[0.037, 0.02, -0.10], [0.037, 0.02, 0.10]]), 0, 0, 0, 0, 0, 0, g);
    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.30, 18, 10),
        new THREE.MeshBasicMaterial({
            color: 0x8fffe7,
            transparent: true,
            opacity: 0.16,
            depthWrite: false
        })
    );
    halo.userData.noHit = true;
    g.add(halo);
    g.userData.halo = halo;
    g.userData.aimLabel = '打开炼金书';
    regMagic(g, openAlchemyIntroBook);
    scene.add(g);
    alchemyBookLight = new THREE.PointLight(0x8fffe7, 0.9, 2.5);
    alchemyBookLight.position.set(ALCHEMY_INTRO_BOOK.x + 0.05, 1.55, ALCHEMY_INTRO_BOOK.z);
    scene.add(alchemyBookLight);
    return g;
}

function makeAlchemyBeacon(x, y, z, color, scale) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(scale, 18, 10), mat);
    halo.userData.noHit = true;
    group.add(halo);
    const ringMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.80 });
    const ringPts = [];
    for (let i = 0; i < 48; i++) {
        const a = i / 48 * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(a) * scale * 0.78, 0, Math.sin(a) * scale * 0.78));
    }
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.userData.noHit = true;
    group.add(ring);
    group.userData = { halo, ring, baseScale: scale };
    scene.add(group);
    return group;
}

function ensureAlchemyStageBeacons() {
    if (alchemyStageBeacons.length) return;
    alchemyStageBeacons = [
        makeAlchemyBeacon(ALCHEMY_INTRO_BOOK.x, 1.50, ALCHEMY_INTRO_BOOK.z, 0x8fffe7, 0.34),
        makeAlchemyBeacon(ALCHEMY_INTRO_REAGENT.x, 1.62, ALCHEMY_INTRO_REAGENT.z, 0xffd76a, 0.42),
        makeAlchemyBeacon(ALCHEMY_INTRO_CAULDRON.x, 1.04, ALCHEMY_INTRO_CAULDRON.z, 0x7fb8ff, 0.66)
    ];
}

function openAlchemyIntroBook() {
    if (alchemyIntroState.complete) {
        setAlchemyRecipeVisible(!alchemyRecipeBoard || !alchemyRecipeBoard.visible);
        return;
    }
    alchemyIntroState.bookRead = true;
    if (typeof bookOn !== 'undefined') bookOn = true;
    if (typeof flipping !== 'undefined') flipping = true;
    setAlchemyIntroDialogScene('book');
    setAlchemyRecipeVisible(true);
    if (typeof showHintOverride === 'function') {
        showHintOverride('书页亮起来：旧硬币 + 茶叶 + 星尘。去瓶架取材料。');
    }
    if (typeof SND !== 'undefined') SND.play('ui');
    if (typeof saveGameState === 'function') saveGameState(false);
}

function takeAlchemyReagents() {
    if (!alchemyIntroState.bookRead) {
        if (typeof showHintOverride === 'function') showHintOverride('先打开书架上那本发光的书，看清配方。');
        return;
    }
    if (alchemyIntroState.complete) return;
    alchemyIntroState.reagentsTaken = true;
    setAlchemyIntroDialogScene('reagents');
    if (typeof showHintOverride === 'function') {
        showHintOverride('材料备齐：旧硬币、茶叶、星尘。现在去启动坩埚。');
    }
    if (typeof SND !== 'undefined') SND.play('toggle');
    if (typeof saveGameState === 'function') saveGameState(false);
}

function useAlchemyCauldron() {
    if (!alchemyIntroState.bookRead) {
        if (typeof showHintOverride === 'function') showHintOverride('先去书架读那本发光的炼金书。');
        return;
    }
    if (!alchemyIntroState.reagentsTaken) {
        if (typeof showHintOverride === 'function') showHintOverride('配方还缺材料，先去瓶架取旧硬币、茶叶和星尘。');
        return;
    }
    if (alchemyIntroState.complete) {
        if (typeof showHintOverride === 'function') showHintOverride('锅里还冒着烟。刚才的失败，已经把故事推开了。');
        return;
    }
    alchemyIntroState.cauldronUsed = true;
    alchemyIntroState.complete = true;
    alchemyFailureFlash = 1.8;
    setAlchemyIntroDialogScene('cauldron');
    if (typeof corkOut !== 'undefined') corkOut = true;
    if (typeof stirRun !== 'undefined') stirRun = Math.max(stirRun, 4.5);
    if (typeof fireLit !== 'undefined') fireLit = true;
    if (typeof showHintOverride === 'function') showHintOverride('砰！炼金失败了。屋里一黑，角落里多了一个老人。');
    if (typeof SND !== 'undefined') SND.play('magic');
    setAlchemyRecipeVisible(false);
    setAlchemyIntroOverlayVisible(false);
    if (typeof saveGameState === 'function') saveGameState(false);
    window.setTimeout(() => {
        if (alchemyIntroState.startedStory) return;
        alchemyIntroState.startedStory = true;
        if (typeof openMainStoryStage === 'function') openMainStoryStage(0, null);
        if (typeof saveGameState === 'function') saveGameState(false);
    }, 950);
}

function setupAlchemyIntro() {
    if (alchemyBookGlow) return;
    ensureAlchemyIntroOverlay();
    ensureAlchemyStageBeacons();
    alchemyBookGlow = createAlchemyIntroBook();
    interactables.push({
        x: ALCHEMY_INTRO_BOOK.x,
        z: ALCHEMY_INTRO_BOOK.z,
        r: 1.25,
        label: '打开炼金书',
        act: openAlchemyIntroBook
    });
    interactables.push({
        x: ALCHEMY_INTRO_REAGENT.x,
        z: ALCHEMY_INTRO_REAGENT.z,
        r: 1.25,
        label: '取炼金材料',
        act: takeAlchemyReagents
    });
    interactables.push({
        x: ALCHEMY_INTRO_CAULDRON.x,
        z: ALCHEMY_INTRO_CAULDRON.z,
        r: 1.45,
        label: '启动炼金锅',
        act: useAlchemyCauldron
    });
}

function updateAlchemyIntro(dt, time) {
    alchemyIntroPulse += dt || 0;
    const introActive = !alchemyIntroState.complete;
    if (introActive) {
        setAlchemyIntroOverlayVisible(true);
        if (alchemyIntroTaskCard) {
            alchemyIntroTaskCard.innerHTML = '<div style="font-size:21px;color:#2d2118;margin:6px 0 8px">' +
                alchemyIntroTaskTitle() + '</div><div>' +
                (alchemyIntroDialogueDone() ? alchemyIntroHint() : '点击下方对话框继续') +
                '</div><div style="margin-top:8px;color:#80623f;font-size:14px">' +
                '也可以按 Enter 继续对话' +
                '</div>';
        }
        const dialogText = alchemyIntroDialog && alchemyIntroDialog.querySelector('.alchemy-intro-dialog-text');
        const nameTag = alchemyIntroDialog && alchemyIntroDialog.querySelector('div');
        const arrow = alchemyIntroDialog && alchemyIntroDialog.querySelector('.alchemy-intro-dialog-arrow');
        const line = alchemyIntroNarration();
        if (nameTag && line) nameTag.textContent = line.speaker || '???';
        if (dialogText && line) {
            dialogText.innerHTML = line.text.replace(/(右侧的书架|微光的书|旧硬币、茶叶、星尘|墙上的瓶架|炼金锅|魔法阵|召唤|一枚金币变成两枚|赚钱|成功)/g, '<span style="color:#ffd56b;font-weight:800">$1</span>');
        }
        if (arrow) arrow.style.opacity = alchemyIntroDialogueDone() ? '0.35' : '1';
        const target = alchemyIntroTarget();
        alchemyIntroProjector.set(target.x, target.y, target.z).project(camera);
        const sx = (alchemyIntroProjector.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-alchemyIntroProjector.y * 0.5 + 0.5) * window.innerHeight;
        const pulse = 0.5 + Math.sin((time || 0) * 3.4) * 0.5;
        const radius = target.radius + pulse * 28;
        if (alchemyIntroOverlay) {
            alchemyIntroOverlay.style.background =
                'radial-gradient(circle ' + radius + 'px at ' + sx + 'px ' + sy + 'px, ' +
                'rgba(255,226,132,.08) 0%, rgba(5,8,14,.18) 36%, rgba(5,8,14,.62) 68%, rgba(2,4,8,.76) 100%)';
        }
        if (alchemyIntroBeam) {
            alchemyIntroBeam.style.left = sx + 'px';
            alchemyIntroBeam.style.top = sy + 'px';
        }
        ensureAlchemyStageBeacons();
        const step = alchemyIntroStep();
        alchemyStageBeacons.forEach((beacon, index) => {
            const on = index === step;
            beacon.visible = on;
            if (!on) return;
            const glow = 0.75 + pulse * 0.35;
            beacon.scale.setScalar(glow);
            beacon.userData.halo.material.opacity = 0.16 + pulse * 0.16;
            beacon.userData.ring.material.opacity = 0.55 + pulse * 0.35;
            beacon.rotation.y += (dt || 0) * 0.9;
        });
    } else {
        setAlchemyIntroOverlayVisible(false);
        alchemyStageBeacons.forEach(beacon => { beacon.visible = false; });
    }
    if (alchemyBookGlow) {
        const active = !alchemyIntroState.complete;
        alchemyBookGlow.visible = active;
        if (alchemyBookLight) alchemyBookLight.visible = active;
        if (active) {
            const p = 0.5 + Math.sin((time || 0) * 3.2) * 0.5;
            alchemyBookGlow.userData.halo.material.opacity = 0.10 + p * 0.14;
            alchemyBookGlow.userData.halo.scale.setScalar(0.86 + p * 0.20);
            if (alchemyBookLight) alchemyBookLight.intensity = 0.55 + p * 0.7;
        }
    }
    if (alchemyFailureFlash > 0) {
        alchemyFailureFlash = Math.max(0, alchemyFailureFlash - (dt || 0));
        if (typeof orbOn !== 'undefined') orbOn = true;
        if (typeof lampLit !== 'undefined') lampLit = Math.sin((time || 0) * 24) > -0.25;
    }
}

function placePlayerAtAlchemyIntroStart(force) {
    if (!force && alchemyIntroState.complete) return;
    if (typeof player === 'undefined' || !player || !player.pos) return;
    player.pos.set(ALCHEMY_INTRO_START.x, 0, ALCHEMY_INTRO_START.z);
    player.vy = 0;
    player.onGround = true;
    player.yaw = ALCHEMY_INTRO_START.yaw;
    if (typeof camYaw !== 'undefined') camYaw = ALCHEMY_INTRO_START.yaw;
    if (typeof setViewMode === 'function') setViewMode('tp');
}

function isAlchemyIntroComplete() {
    return !!alchemyIntroState.complete;
}

function captureAlchemyIntroState() {
    return Object.assign({}, alchemyIntroState);
}

function applyAlchemyIntroState(raw) {
    if (!raw || typeof raw !== 'object') return;
    alchemyIntroState.bookRead = !!raw.bookRead;
    alchemyIntroState.reagentsTaken = !!raw.reagentsTaken;
    alchemyIntroState.cauldronUsed = !!raw.cauldronUsed;
    alchemyIntroState.complete = !!raw.complete;
    alchemyIntroState.startedStory = !!raw.startedStory;
    alchemyIntroState.dialogScene = ALCHEMY_INTRO_DIALOGUES[raw.dialogScene] ? raw.dialogScene : (
        alchemyIntroState.reagentsTaken ? 'reagents' : (alchemyIntroState.bookRead ? 'book' : 'wake')
    );
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    alchemyIntroState.dialogIndex = Math.max(0, Math.min(lines.length - 1, Math.trunc(Number(raw.dialogIndex) || 0)));
    setAlchemyRecipeVisible(alchemyIntroState.bookRead && !alchemyIntroState.complete);
}

window.setupAlchemyIntro = setupAlchemyIntro;
window.updateAlchemyIntro = updateAlchemyIntro;
window.alchemyIntroHint = alchemyIntroHint;
window.placePlayerAtAlchemyIntroStart = placePlayerAtAlchemyIntroStart;
window.isAlchemyIntroComplete = isAlchemyIntroComplete;
window.captureAlchemyIntroState = captureAlchemyIntroState;
window.applyAlchemyIntroState = applyAlchemyIntroState;

if (typeof scene !== 'undefined' && typeof interactables !== 'undefined') {
    setupAlchemyIntro();
}

addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (!alchemyIntroState.complete && alchemyIntroDialog && alchemyIntroDialog.style.opacity !== '0') {
        advanceAlchemyIntroDialogue();
    }
});
