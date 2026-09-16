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
let alchemyIntroBeam = null;
let alchemyIntroDialog = null;
let alchemyStageBeacons = [];
let alchemyFarmGuideBeacon = null;
const alchemyIntroProjector = new THREE.Vector3();

const ALCHEMY_INTRO_DIALOGUES = {
    wake: [
        { speaker: '???', text: '……你醒了。' },
        { speaker: '???', text: '屋里暗得不正常。看向右侧的书架，那里有一本散发着微光的书。' },
        { speaker: '???', text: '去打开它吧。或许奇妙的事情发生。' }
    ],
    book: [
        { speaker: '旁白', text: '书页自动翻到最后一页，纸边像被火燎过。封面这时才看清标题——《炼金术入门》。' },
        { speaker: '旁白', text: '扉页上写着一句话：将微不足道之物，炼成更有价值之物。' },
        { speaker: '你', text: '点石成金？✨✨（两眼放光' },
        { speaker: '旁白', text: '配方下面浮出一行小字：旧硬币、茶叶、星尘。墙上的瓶架似乎刚好有这些东西。' }
    ],
    reagents: [
        { speaker: '旁白', text: '瓶架上的小瓶自己晃了一下，像是在催你别磨蹭。' },
        { speaker: '???', text: '旧硬币压底，茶叶居中，星尘最后放。顺序错了，锅会不高兴。' },
        { speaker: '你', text: '锅还会不高兴？' },
        { speaker: '???', text: '你马上就知道了。把材料倒进炼金锅。' }
    ],
    meet: [
        { speaker: '旁白', text: '材料落进锅里，绿色的火光从锅沿爬出来。' },
        { speaker: '你', text: '看起来……好像成功了？' },
        { speaker: '???', text: '别急。' },
        { speaker: '旁白', text: '下一秒，魔法阵亮得像白昼——砰。' },
        { speaker: '旁白', text: '光散去，屋子第一次被真正照亮。你这才看清自己住的地方，乱糟糟的——而且多了一个人。' },
        { speaker: '你', text: '你……是谁？' },
        { speaker: '???', text: '我还想问你。这是哪儿？' },
        { speaker: '旁白', text: '他打量了一圈：炼金锅、魔法阵、墙上瓶瓶罐罐的材料，像是从没见过这些东西。' },
        { speaker: '旁白', text: '你把"炼金失控"这件事解释了一遍，他没听懂"魔法"是什么；你也说不清他从哪来。' },
        { speaker: '你', text: '所以……你也不知道怎么回去？' },
        { speaker: '???', text: '不知道。' },
        { speaker: '你', text: '那怎么办？' },
        { speaker: '???', text: '你不是会魔法吗？' },
        { speaker: '你', text: '可以查书！应该有灵魂召回或者逆向召唤之类的……' },
        { speaker: '旁白', text: '你翻开那本《炼金术入门》，一页新的配方浮了出来。' },
        { speaker: '旁白', text: '「归魂炼金术」<br>。。。。。。（总之就是很多材料）<br>预计材料费用：10000 金币' },
        { speaker: '旁白', text: '你翻了翻钱包。' },
        { speaker: '你', text: '……金币：100。' },
        { speaker: '旁白', text: '两个人沉默了一会儿。' },
        { speaker: '???', text: '先挣钱。' },
        { speaker: '你', text: '怎么挣？' },
        { speaker: '旁白', text: '他看向窗外那块荒地。' },
        { speaker: '???', text: '不是有地吗？' },
        { speaker: '你', text: '那好吧。' }
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
    if (alchemyIntroState.startedStory) return;
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    if (alchemyIntroState.dialogIndex < lines.length - 1) {
        alchemyIntroState.dialogIndex += 1;
        if (typeof SND !== 'undefined') SND.play('ui');
        if (typeof saveGameState === 'function') saveGameState(false);
        return;
    }
    /* "meet" 是最后一幕——台词放完之后再点一下/按一次 Enter，
       只标记"开场戏讲完了"，真正推进主线 stage0 交给
       22-main-story.js 的 pollAutoStageAdvance 在下一帧去做（它就是
       专门处理"没有实体门可以走进去触发"的静默推进）——这里不再自己
       直接调 advanceMainStoryStage，避免两条路径抢着推进同一章，
       把 stage 多推一次。 */
    if (alchemyIntroState.dialogScene === 'meet') {
        alchemyIntroState.startedStory = true;
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
    /* "失败+第一次见面"现在是同一段连续对话（meet），不再拆成
       cauldron→(950ms定时器)→meet 两段——那个定时器只存在于内存里，
       玩家中途刷新/重进游戏就会永远丢失，导致对话框卡在失败那句
       再也翻不动。直接切进 meet，一路点到底。 */
    setAlchemyIntroDialogScene('meet');
    if (typeof corkOut !== 'undefined') corkOut = true;
    if (typeof stirRun !== 'undefined') stirRun = Math.max(stirRun, 4.5);
    if (typeof fireLit !== 'undefined') fireLit = true;
    if (typeof showHintOverride === 'function') showHintOverride('砰！炼金失败了。屋里一黑，角落里多了一个人。');
    if (typeof SND !== 'undefined') SND.play('magic');
    setAlchemyRecipeVisible(false);
    if (typeof saveGameState === 'function') saveGameState(false);
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
    const guidingActive = !alchemyIntroState.complete;
    const dialogActive = !alchemyIntroState.startedStory;

    /* 对话框的显示/关闭跟着"故事讲完了没"走，不再跟着"谜题解完了没"——
       坩埚用完谜题就算解完了，但 meet 那段台词还没讲，对话框不能关。 */
    if (dialogActive) {
        ensureAlchemyIntroOverlay();
        if (alchemyIntroDialog) {
            alchemyIntroDialog.style.opacity = '1';
            alchemyIntroDialog.style.pointerEvents = 'auto';
        }
        const dialogText = alchemyIntroDialog && alchemyIntroDialog.querySelector('.alchemy-intro-dialog-text');
        const nameTag = alchemyIntroDialog && alchemyIntroDialog.querySelector('div');
        const arrow = alchemyIntroDialog && alchemyIntroDialog.querySelector('.alchemy-intro-dialog-arrow');
        const line = alchemyIntroNarration();
        if (nameTag && line) nameTag.textContent = line.speaker || '???';
        if (dialogText && line) {
            dialogText.innerHTML = line.text.replace(/(右侧的书架|微光的书|旧硬币、茶叶、星尘|墙上的瓶架|炼金锅|魔法阵|炼金失控|一枚金币变成两枚|赚钱|成功|归魂炼金术|月银 ×1|星尘 ×3|灵魂石 ×1|3000 金币|100|先挣钱|不是有地吗)/g, '<span style="color:#ffd56b;font-weight:800">$1</span>');
        }
        if (arrow) arrow.style.opacity = alchemyIntroDialogueDone() ? '0.35' : '1';
    } else if (alchemyIntroDialog) {
        /* 对话讲完之后必须把 pointer-events 也关掉——只把 opacity 调成
           0 的话，这块看不见的对话框（底部居中、最宽能到1120px）会
           永远盖在画布上吞掉那片区域的点击/拖动，"固定视角"底下拖动
           转镜头失灵、点某些按钮没反应，都是这个看不见的框在挡。 */
        alchemyIntroDialog.style.opacity = '0';
        alchemyIntroDialog.style.pointerEvents = 'none';
    }

    if (guidingActive) {
        const target = alchemyIntroTarget();
        alchemyIntroProjector.set(target.x, target.y, target.z).project(camera);
        const sx = (alchemyIntroProjector.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-alchemyIntroProjector.y * 0.5 + 0.5) * window.innerHeight;
        const pulse = 0.5 + Math.sin((time || 0) * 3.4) * 0.5;
        if (alchemyIntroBeam) {
            alchemyIntroBeam.style.opacity = '1';
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
        if (alchemyIntroBeam) alchemyIntroBeam.style.opacity = '0';
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
    updateAlchemyFarmGuide(dt, time);
}

/* 开场对话讲完之后，屋里的谜题就结束了，但玩家还得知道"先去种地"——
   在农田那片空地上摆一圈跟书架/瓶架/坩埚同款的光圈，锄头一解锁
   （走到农田附近）就消失，不需要玩家自己瞎逛着找。 */
function updateAlchemyFarmGuide(dt, time) {
    const storyStarted = typeof isAlchemyIntroStoryStarted === 'function' && isAlchemyIntroStoryStarted();
    const farmingUnlocked = typeof window.isToolUnlocked === 'function' && window.isToolUnlocked(3);
    const active = storyStarted && !farmingUnlocked && typeof FARMLAND_CENTER !== 'undefined';
    if (!active) {
        if (alchemyFarmGuideBeacon) alchemyFarmGuideBeacon.visible = false;
        return;
    }
    if (!alchemyFarmGuideBeacon) {
        const groundY = typeof groundAt === 'function' ? groundAt(FARMLAND_CENTER.x, FARMLAND_CENTER.z, 0) : 0;
        alchemyFarmGuideBeacon = makeAlchemyBeacon(FARMLAND_CENTER.x, groundY + 0.05, FARMLAND_CENTER.z, 0xa8e06a, 2.4);
    }
    alchemyFarmGuideBeacon.visible = true;
    const pulse = 0.5 + Math.sin((time || 0) * 2.2) * 0.5;
    alchemyFarmGuideBeacon.scale.setScalar(0.9 + pulse * 0.18);
    alchemyFarmGuideBeacon.userData.halo.material.opacity = 0.12 + pulse * 0.1;
    alchemyFarmGuideBeacon.userData.ring.material.opacity = 0.5 + pulse * 0.32;
    alchemyFarmGuideBeacon.rotation.y += (dt || 0) * 0.5;
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

/* "谜题解完了"(complete，坩埚一用完就为真) 跟"开场戏讲完了"
   (startedStory，meet 场景台词点到底才为真) 是两件不同的事——
   主线 stage0 的推进条件必须用后者，不然坩埚刚响，meet 这场戏
   还没开始演，主线就已经在背后悄悄推进了，meet 场景再点完一次
   又会把主线错误地多推一章。 */
function isAlchemyIntroStoryStarted() {
    return !!alchemyIntroState.startedStory;
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
    /* 自愈：老存档可能卡在已经删掉的 'cauldron' 场景里（坩埚用完了，
       但开场戏没讲完，又找不到旧场景），统一收敛到 meet 场景重讲一遍
       "第一次见面"，不会卡死在读不到的场景名上。 */
    alchemyIntroState.dialogScene = (alchemyIntroState.complete && !alchemyIntroState.startedStory)
        ? 'meet'
        : (ALCHEMY_INTRO_DIALOGUES[raw.dialogScene] ? raw.dialogScene : (
            alchemyIntroState.reagentsTaken ? 'reagents' : (alchemyIntroState.bookRead ? 'book' : 'wake')
        ));
    const lines = ALCHEMY_INTRO_DIALOGUES[alchemyIntroState.dialogScene] || ALCHEMY_INTRO_DIALOGUES.wake;
    alchemyIntroState.dialogIndex = Math.max(0, Math.min(lines.length - 1, Math.trunc(Number(raw.dialogIndex) || 0)));
    setAlchemyRecipeVisible(alchemyIntroState.bookRead && !alchemyIntroState.complete);
}

window.setupAlchemyIntro = setupAlchemyIntro;
window.updateAlchemyIntro = updateAlchemyIntro;
window.alchemyIntroHint = alchemyIntroHint;
window.placePlayerAtAlchemyIntroStart = placePlayerAtAlchemyIntroStart;
window.isAlchemyIntroComplete = isAlchemyIntroComplete;
window.isAlchemyIntroStoryStarted = isAlchemyIntroStoryStarted;
window.captureAlchemyIntroState = captureAlchemyIntroState;
window.applyAlchemyIntroState = applyAlchemyIntroState;

if (typeof scene !== 'undefined' && typeof interactables !== 'undefined') {
    setupAlchemyIntro();
}

addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (!alchemyIntroState.startedStory && alchemyIntroDialog && alchemyIntroDialog.style.opacity !== '0') {
        advanceAlchemyIntroDialogue();
    }
});
