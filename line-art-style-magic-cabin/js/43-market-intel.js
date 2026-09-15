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

const MARKET_INTEL_SPOTS = [
    { id: 'farm', x: 9.0, z: 6.5, r: 3.5, label: '找农场主打听消息' },
    { id: 'cafe', x: 16.25, z: -13.5, r: 3.5, label: '找咖啡馆顾客打听消息' },
    { id: 'store', x: 10, z: -13.5, r: 3.5, label: '看看杂货铺的库存' }
];

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
    interactables.push({
        x: spot.x, z: spot.z, r: spot.r,
        label: spot.label,
        act: () => gatherMarketIntel(spot.id)
    });
});

function captureMarketIntelState() {
    ensureIntelDayReset();
    return {
        day: marketIntelState.day,
        usedToday: marketIntelState.usedToday
    };
}

function applyMarketIntelState(raw) {
    marketIntelState = {
        day: Number.isFinite(Number(raw && raw.day)) ? Math.trunc(Number(raw.day)) : -1,
        usedToday: Math.max(0, Math.trunc(Number(raw && raw.usedToday) || 0))
    };
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
