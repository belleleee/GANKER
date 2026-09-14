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
    },
    {
        date: '往事版 · 老照片专栏',
        title: '一只史莱姆的前半生',
        body: '本报独家取得了这只房客的往事记录：从宿迁老宅到杭州阁楼，从知青下乡到绍兴茶场，整整五段回忆，会随着主线一点点浮现。第一段藏在"查看第一份简历"里，剩下的，等主线推进自然会找上门——报社建议大家别急，故事和账本一样，都是一步步攒出来的。'
    },
    {
        date: '经营版 · 森林来信',
        title: '代销订单正式挂牌',
        body: '主线推进到"代销小摊"以后，森林里开始有客户蹲点等货了。订单板在小屋右上角，接单后地上会有箭头指路。留神那些戴着金圈的"批发大单"——量大钱多，但也最容易把仓库一口气搬空，接之前算好自己有没有那么多货。'
    },
    {
        date: '账本版 · 深夜算账',
        title: '现金流预测面板上线，教你"活到那一天"',
        body: '左上角新增了一块"现金流"面板：不只告诉你现在有多少钱，还会提前算出未来几天有哪些必须花的钱、哪些等着回款。真遇到快要见底的情况，面板会主动提醒，别等余额跳到负数才后知后觉。缺钱的时候，贷款、清仓甩卖、送货订单预付订金——挑一个能接受代价的，先撑过去。'
    },
    {
        date: '警示版 · 别上头',
        title: '钱滚钱商店挂出"冷静期"告示',
        body: '本报接到多起投诉：有房客一天之内把钱包输光好几回。商店已经加装了新规矩——连续破产满3次，大门直接锁3天，谁来求情都没用。与之相对，慈善捐款攒够的"口碑"倒是真能派上用场：骗局少坑一点，融资也更容易谈成。一边是代价，一边是回报，怎么选，报社不替你拿主意。'
    },
    {
        date: '证券版 · 大家来看盘',
        title: '股市小屋大改版：情绪、板块、基本面全都有了',
        body: '股价这次是真的会跟着行情动了——茶叶的消息现在会捎带影响货运，市场情绪从"恐慌"到"狂热"分成五档，连"娃哈哈"上市定价都要看当天的行情脸色。每支股票的交易面板里还加了"稳定度/走势/估值"三行小抄，照着看，比瞎猜K线靠谱得多。手头紧的时候，创始人也能折价卖点自己的股份应急——前提是公司已经上过市。'
    },
    {
        date: '地图版 · 别再迷路第二弹',
        title: '场景平面图开放查阅',
        body: '菜单里新增了"场景平面图"，点开能看到小屋、农场、茶场、商店这些地点的俯视布局。选中一个地方点"在地上标出路线"，脚下会出现一条跟着你走的虚线，一路指到目的地——总算不用再靠记忆瞎逛了。'
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
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    newspaperReadCount++;
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('newspaperRead');
    }
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
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
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
