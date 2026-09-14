'use strict';

/* ================================================================
   股市新手教学
   每加一个新机制（基本面/情绪/板块联动/IPO取舍/创始人套现），玩家
   都得先看得懂，才谈得上"判断"而不是"选菜单"。这里是一套只弹一次的
   教学卡片，在每个决策点第一次出现时，提前告诉玩家"这么做可能会怎样"。
   ================================================================ */

const INVEST_TIP_SEEN_PREFIX = 'magicCabin.investTips.';

function investTipUserId() {
    try {
        const raw = localStorage.getItem('magicCabin.session.v1');
        if (!raw) return 'guest';
        const data = JSON.parse(raw);
        if (data && typeof data.id === 'string' && data.id.trim()) return data.id.trim();
    } catch (err) { }
    return 'guest';
}

function investTipSeenKey() {
    return INVEST_TIP_SEEN_PREFIX + investTipUserId() + '.v1';
}

let investTipSeenCache = null;
function loadInvestTipSeen() {
    if (investTipSeenCache) return investTipSeenCache;
    try {
        investTipSeenCache = JSON.parse(localStorage.getItem(investTipSeenKey()) || '{}') || {};
    } catch (err) {
        investTipSeenCache = {};
    }
    return investTipSeenCache;
}

function markInvestTipSeen(id) {
    const seen = loadInvestTipSeen();
    seen[id] = true;
    try {
        localStorage.setItem(investTipSeenKey(), JSON.stringify(seen));
    } catch (err) { }
}

let investTipLayer = null;
function ensureInvestTipDom() {
    if (!investTipLayer) {
        investTipLayer = document.createElement('div');
        investTipLayer.className = 'investTipLayer';
        document.body.appendChild(investTipLayer);
    }
}

function showInvestTipOnce(id, title, body) {
    const seen = loadInvestTipSeen();
    if (seen[id]) return;
    markInvestTipSeen(id);
    ensureInvestTipDom();
    const node = document.createElement('div');
    node.className = 'investTipCard';
    node.innerHTML = '<p class="investTipKicker">教学 · ' + title + '</p><p class="investTipBody">' + body + '</p>';
    investTipLayer.appendChild(node);
    setTimeout(() => {
        node.classList.add('leaving');
        setTimeout(() => node.remove(), 400);
    }, 8000);
}

window.showInvestTipOnce = showInvestTipOnce;
