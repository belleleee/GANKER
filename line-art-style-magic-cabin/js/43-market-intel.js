'use strict';

/* ================================================================
   市场情报：地图上的场景变成"内幕消息来源"
   农场主、咖啡馆顾客、杂货铺库存——不再只是种地/打工/买种子的地方，
   走近了还能听到几句跟股市相关的闲话。每天只能打听 3 次，逼着玩家
   挑"这次去哪儿听"，而不是把所有信息都摊开给他看。
   消息真假参半，可信度不写明说破，直接推给股市小屋当一条新闻，走
   它已有的"可信度加权 + 低可信度消息事后部分反转"机制——不用在这边
   另起一套验证逻辑。
   ================================================================ */

const MARKET_INTEL_DAILY_LIMIT = 3;

/* cx/cz 是每个场景的大致中心（农场周边、咖啡馆门口、杂货铺附近），
   roam 是每天重新撒点的范围——位置不再钉死在一个坐标，每天换一次，
   逼玩家真的在场景里走一圈找人，而不是记住固定点位直接怼过去。 */
const MARKET_INTEL_SPOTS = [
    { id: 'farm', cx: 9.0, cz: 6.5, roam: 4.5, r: 3.2, label: '找农场主打听消息' },
    { id: 'cafe', cx: 16.25, cz: -13.5, roam: 4, r: 3.2, label: '找咖啡馆顾客打听消息' },
    { id: 'store', cx: 10, cz: -13.5, roam: 4, r: 3.2, label: '看看杂货铺的库存' }
];

/* 每天为每个地点随机撒点后实际落地的坐标，存档里带着走——同一天
   刷新页面/重进游戏，人不会瞬移，只有跨天才会换新位置。 */
let marketIntelPositions = {};
/* 每个地点对应的互动区（interactables 条目）和史莱姆网格引用，
   换位置的时候直接改这两样东西的坐标，不用整个重建。 */
let marketIntelEntities = {};

function randomPointInZone(spot) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * spot.roam;
    return { x: spot.cx + Math.cos(angle) * dist, z: spot.cz + Math.sin(angle) * dist };
}

function intelPositionFor(spot) {
    const saved = marketIntelPositions[spot.id];
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z)) return saved;
    return { x: spot.cx, z: spot.cz };
}

function applyIntelPositionToEntities(spot) {
    const pos = intelPositionFor(spot);
    const entities = marketIntelEntities[spot.id];
    if (!entities) return;
    if (entities.interactable) {
        entities.interactable.x = pos.x;
        entities.interactable.z = pos.z;
    }
    if (entities.slime) {
        const groundY = typeof groundAt === 'function' ? groundAt(pos.x, pos.z, 0) : 0;
        entities.slime.position.set(pos.x, groundY, pos.z);
    }
}

function reshuffleMarketIntelPositions() {
    MARKET_INTEL_SPOTS.forEach(spot => {
        marketIntelPositions[spot.id] = randomPointInZone(spot);
        applyIntelPositionToEntities(spot);
    });
}

const MARKET_INTEL_TIPS = {
    farm: [
        { targetStock: 'FARM', impact: -.07, credibility: .6, text: '农场主叹着气说："今年茶苗长得不太行，怕是要减产。"' },
        { targetStock: 'TEA', impact: -.05, credibility: .55, text: '路过的采购商嘀咕："今年茶叶收得少，怕是要涨价。"' },
        { targetStock: 'FARM', impact: .06, credibility: .58, text: '农场招工的牌子换了新的，看着是要扩产。' },
        { targetStock: 'CAFE', impact: .04, credibility: .5, text: '农场主随口提了一句，最近给咖啡馆供货的量在往上走。' }
    ],
    cafe: [
        { targetStock: 'WAHA', impact: .07, credibility: .6, text: '邻座客人念叨："最近那款新饮料到处都有人喝。"' },
        { targetStock: 'CAFE', impact: .05, credibility: .55, text: '店员小声说这周客人明显比平时多。' },
        { targetStock: 'WAHA', impact: -.06, credibility: .5, text: '有顾客抱怨："那款饮料配方好像变了，没有以前好喝了。"' },
        { targetStock: 'COIN', impact: -.04, credibility: .48, text: '有人在聊钱滚钱商店最近输钱的人变多了。' }
    ],
    store: [
        { targetStock: 'WAHA', impact: .08, credibility: .65, text: '老板念叨："这两天补了三次货，卖得是真快。"' },
        { targetStock: 'COIN', impact: -.05, credibility: .5, text: '路过硬币商店，门口这几天没什么人排队。' },
        { targetStock: 'MAGIC', impact: .06, credibility: .55, text: '杂货铺老板说魔法道具铺最近老是来批量进货。' },
        { targetStock: 'BOOK', impact: .04, credibility: .5, text: '书籍工坊的新书刚摆上架，没两天就见了底。' }
    ]
};

let marketIntelState = { day: -1, usedToday: 0 };
/* 发往股市小屋的情报，走跟 22-main-story.js 的 pendingMarketEvents
   完全一样的"发送方不清空，接收方按id去重"模式——两边是分开存档、
   分开读写的页面，没法互相确认"对方收到没"，这样最省心。 */
let pendingMarketTips = [];

function currentIntelDay() {
    return typeof currentFarmDay === 'function' ? currentFarmDay() : 0;
}

function ensureIntelDayReset() {
    const day = currentIntelDay();
    if (day !== marketIntelState.day) {
        marketIntelState.day = day;
        marketIntelState.usedToday = 0;
        reshuffleMarketIntelPositions();
    }
}

function marketIntelRemaining() {
    ensureIntelDayReset();
    return Math.max(0, MARKET_INTEL_DAILY_LIMIT - marketIntelState.usedToday);
}

function gatherMarketIntel(spotId) {
    ensureIntelDayReset();
    if (marketIntelRemaining() <= 0) {
        showHintOverride('今天已经打听够了（' + MARKET_INTEL_DAILY_LIMIT + '/' + MARKET_INTEL_DAILY_LIMIT + '），明天再来。');
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    const pool = MARKET_INTEL_TIPS[spotId];
    if (!pool || !pool.length) return;
    const tip = pool[Math.floor(Math.random() * pool.length)];
    marketIntelState.usedToday++;
    const variance = .7 + Math.random() * .6;
    pendingMarketTips.push({
        id: 'intel_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        targetStock: tip.targetStock,
        impact: Math.round(tip.impact * variance * 1000) / 1000,
        credibility: Math.max(.3, Math.min(.85, tip.credibility + (Math.random() - .5) * .1)),
        label: tip.text.length > 60 ? tip.text.slice(0, 60) + '…' : tip.text,
        day: currentIntelDay()
    });
    pendingMarketTips = pendingMarketTips.slice(-16);
    showHintOverride('📡 ' + tip.text + '（今日还能打听 ' + marketIntelRemaining() + ' 次 · 去股市小屋看这条消息）');
    if (typeof SND !== 'undefined') SND.play('ui');
    if (typeof saveGameState === 'function') saveGameState(false);
}

MARKET_INTEL_SPOTS.forEach(spot => {
    if (typeof interactables === 'undefined') return;
    const pos = intelPositionFor(spot);
    const entry = {
        x: pos.x, z: pos.z, r: spot.r,
        label: spot.label,
        act: () => gatherMarketIntel(spot.id)
    };
    interactables.push(entry);
    marketIntelEntities[spot.id] = Object.assign({}, marketIntelEntities[spot.id], { interactable: entry });
});

/* ================================================================
   情报小史莱姆：光站在原地不好找，今天还有打听次数时，在三个地点
   各冒出一只举着消息图标的小史莱姆——用得着的时候看得见，用完就
   缩回去，玩家一眼就知道"这儿今天还有话可以打听"。
   ================================================================ */

const MARKET_INTEL_SLIME_ICONS = { farm: '🌾', cafe: '☕', store: '🛒' };
const MARKET_INTEL_SLIME_COLORS = { farm: 0x9bd66a, cafe: 0xd6a26a, store: 0x6ab6d6 };
let marketIntelSlimeTexCache = {};

function marketIntelIconTexture(emoji) {
    if (marketIntelSlimeTexCache[emoji]) return marketIntelSlimeTexCache[emoji];
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.font = '64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 48, 52);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    marketIntelSlimeTexCache[emoji] = tex;
    return tex;
}

function buildMarketIntelSlime(spot) {
    const g = new THREE.Group();
    const color = MARKET_INTEL_SLIME_COLORS[spot.id] || 0x9bd66a;
    const bodyMat = LITMAT(color, { transparent: true, opacity: .9 });
    const body = solid(new THREE.SphereGeometry(.34, 18, 14), bodyMat);
    body.scale.set(1, .8, 1);
    body.position.y = .28;
    g.add(body);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2018 });
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), eyeMat);
        eye.position.set(side * .12, .34, .27);
        g.add(eye);
    }
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: marketIntelIconTexture(MARKET_INTEL_SLIME_ICONS[spot.id] || '💬'), depthTest: false }));
    icon.scale.set(.46, .46, 1);
    icon.position.y = .92;
    g.add(icon);
    g.userData.icon = icon;
    g.userData.phase = Math.random() * Math.PI * 2;
    const pos = intelPositionFor(spot);
    const groundY = typeof groundAt === 'function' ? groundAt(pos.x, pos.z, 0) : 0;
    g.position.set(pos.x, groundY, pos.z);
    if (typeof scene !== 'undefined') scene.add(g);
    return g;
}

const marketIntelSlimes = (typeof scene !== 'undefined')
    ? MARKET_INTEL_SPOTS.map(spot => {
        const mesh = buildMarketIntelSlime(spot);
        marketIntelEntities[spot.id] = Object.assign({}, marketIntelEntities[spot.id], { slime: mesh });
        return { spot, mesh };
    })
    : [];

function updateMarketIntelSlimes(dt, time) {
    if (!marketIntelSlimes.length) return;
    const available = marketIntelRemaining() > 0;
    for (const entry of marketIntelSlimes) {
        const mesh = entry.mesh;
        mesh.visible = available;
        if (!available) continue;
        const ph = mesh.userData.phase;
        mesh.scale.y = .82 + Math.sin(time * 2.4 + ph) * .05;
        if (mesh.userData.icon) {
            mesh.userData.icon.position.y = .92 + Math.sin(time * 2.6 + ph) * .05;
        }
    }
}

window.updateMarketIntelSlimes = updateMarketIntelSlimes;

function captureMarketIntelState() {
    ensureIntelDayReset();
    const positions = {};
    MARKET_INTEL_SPOTS.forEach(spot => {
        const pos = marketIntelPositions[spot.id];
        if (pos) positions[spot.id] = { x: pos.x, z: pos.z };
    });
    return {
        day: marketIntelState.day,
        usedToday: marketIntelState.usedToday,
        positions
    };
}

function applyMarketIntelState(raw) {
    marketIntelState = {
        day: Number.isFinite(Number(raw && raw.day)) ? Math.trunc(Number(raw.day)) : -1,
        usedToday: Math.max(0, Math.trunc(Number(raw && raw.usedToday) || 0))
    };
    const rawPositions = raw && raw.positions && typeof raw.positions === 'object' ? raw.positions : {};
    MARKET_INTEL_SPOTS.forEach(spot => {
        const pos = rawPositions[spot.id];
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.z)) {
            marketIntelPositions[spot.id] = { x: pos.x, z: pos.z };
        }
        applyIntelPositionToEntities(spot);
    });
}

function captureMarketTips() {
    return pendingMarketTips.slice();
}

function applyMarketTips(raw) {
    pendingMarketTips = Array.isArray(raw)
        ? raw.filter(tip => tip && typeof tip.id === 'string').slice(-16)
        : [];
}

window.marketIntelRemaining = marketIntelRemaining;
window.captureMarketIntelState = captureMarketIntelState;
window.applyMarketIntelState = applyMarketIntelState;
window.captureMarketTips = captureMarketTips;
window.applyMarketTips = applyMarketTips;
