'use strict';

/* ================================================================
   经营扩展层
   目标：把农场、茶场、订单、股市、天气、员工安排串成一条能复盘的每日循环。
   不接管原来的 Three.js 场景，只监听现有系统事件，负责统计、结算和计划。
   ================================================================ */

const DAILY_PLAN_OPTIONS = [
    {
        id: 'balanced',
        label: '均衡经营',
        note: '正常种地，适合稳步推进。'
    },
    {
        id: 'farm',
        label: '专注农场',
        note: '农工移动更快，优先把地照料完。'
    },
    {
        id: 'orders',
        label: '订单优先',
        note: '订单刷新更快，适合用库存换现金。'
    },
    {
        id: 'rest',
        label: '休整一天',
        note: '员工放慢工作，幸运和心情小幅回升。'
    }
];

let gameplayLoopState = {
    day: -1,
    dailyPlan: 'balanced',
    settlementSeenDay: -1,
    ledger: freshDailyLedger()
};

const dailySettlementPanel = document.getElementById('dailySettlementPanel');
const dailySettlementKicker = document.getElementById('dailySettlementKicker');
const dailySettlementTitle = document.getElementById('dailySettlementTitle');
const dailySettlementBody = document.getElementById('dailySettlementBody');
const dailySettlementCloseBtn = document.getElementById('dailySettlementCloseBtn');
const dailyPlanOptions = document.getElementById('dailyPlanOptions');

function freshDailyLedger() {
    return {
        income: 0,
        expense: 0,
        farmHarvests: 0,
        badWeatherHarvests: 0,
        teaPicks: 0,
        teaBatches: 0,
        deliveries: 0,
        deliveryIncome: 0,
        investmentPnl: 0,
        notes: []
    };
}

function currentGameplayDay() {
    return typeof currentFarmDay === 'function' ? currentFarmDay() : 0;
}

function currentDailyPlan() {
    return DAILY_PLAN_OPTIONS.some(plan => plan.id === gameplayLoopState.dailyPlan)
        ? gameplayLoopState.dailyPlan
        : 'balanced';
}

function addDailyNote(text) {
    if (!text) return;
    const clean = String(text).replace(/<[^>]*>/g, '').slice(0, 80);
    if (!clean) return;
    if (!gameplayLoopState.ledger.notes.includes(clean)) {
        gameplayLoopState.ledger.notes.push(clean);
        gameplayLoopState.ledger.notes = gameplayLoopState.ledger.notes.slice(-5);
    }
}

function noteDailyMoney(amount, reason) {
    const value = Math.trunc(Number(amount) || 0);
    if (!value) return;
    if (value > 0) gameplayLoopState.ledger.income += value;
    else gameplayLoopState.ledger.expense += Math.abs(value);
    if (reason && reason !== false) addDailyNote((value > 0 ? '收入 ' : '支出 ') + Math.abs(value) + ' · ' + reason);
}

function noteDailyEvent(type, payload) {
    const data = payload || {};
    if (type === 'farmHarvest') {
        gameplayLoopState.ledger.farmHarvests++;
        if (Number(data.multiplier) < 1) gameplayLoopState.ledger.badWeatherHarvests++;
    } else if (type === 'teaPick') {
        gameplayLoopState.ledger.teaPicks++;
    } else if (type === 'teaBatch') {
        gameplayLoopState.ledger.teaBatches++;
    } else if (type === 'deliveryDone') {
        gameplayLoopState.ledger.deliveries++;
        gameplayLoopState.ledger.deliveryIncome += Math.max(0, Math.trunc(Number(data.reward) || 0));
    } else if (type === 'investmentPnl') {
        gameplayLoopState.ledger.investmentPnl += Math.trunc(Number(data.amount) || 0);
    }
}

function readSavedInvestmentPnl() {
    if (typeof readSavedInvestmentState !== 'function') return 0;
    const investment = readSavedInvestmentState();
    if (!investment || !investment.market || !investment.market.stocks) return 0;
    let value = 0;
    let cost = 0;
    const holdings = investment.holdings || {};
    Object.keys(holdings).forEach(id => {
        const h = holdings[id] || {};
        const stock = investment.market.stocks[id] || {};
        const qty = Math.max(0, Number(h.qty) || 0);
        value += qty * (Number(stock.price) || 0);
        cost += Number(h.cost) || 0;
    });
    const realized = (Number(investment.realizedGain) || 0) - (Number(investment.realizedLoss) || 0);
    return Math.round(realized + value - cost);
}

function renderDailyPlanOptions() {
    if (!dailyPlanOptions) return;
    const active = currentDailyPlan();
    dailyPlanOptions.innerHTML = DAILY_PLAN_OPTIONS.map(plan =>
        '<button type="button" class="dailyPlanBtn' + (plan.id === active ? ' isActive' : '') + '" data-plan="' + plan.id + '">' +
        plan.label + '<small>' + plan.note + '</small></button>'
    ).join('');
}

function setDailyPlan(planId) {
    gameplayLoopState.dailyPlan = DAILY_PLAN_OPTIONS.some(plan => plan.id === planId) ? planId : 'balanced';
    renderDailyPlanOptions();
    if (typeof updateFarmHireLabel === 'function') updateFarmHireLabel();
    if (typeof saveGameState === 'function') saveGameState(false);
}

function settlementAdvice(ledger) {
    const weatherName = typeof wx !== 'undefined' && typeof WX_NAME !== 'undefined' ? WX_NAME[wx.type] : '未知';
    if (ledger.badWeatherHarvests > 0) {
        return '今天有作物遇到不合适的天气而减产。明天可以先看天气，再安排员工种水稻、白菜、土豆这类有偏好的作物。';
    }
    if (ledger.deliveries === 0 && ledger.farmHarvests > 0) {
        return '仓库里有收成，但还没有转成订单收入。可以接一单送货，让库存真的变成现金。';
    }
    if (ledger.teaPicks >= 5 && ledger.teaBatches === 0) {
        return '茶青已经攒够一批了，去茶屋完成晒茶、炒茶、装袋，收益会比只卖鲜叶更完整。';
    }
    if (ledger.investmentPnl < 0) {
        return '股市账面亏损时别急着追涨杀跌，先看新闻来源和延迟生效日期。';
    }
    return '今天天气是' + weatherName + '。继续保持“生产、订单、投资、复盘”的节奏，赚钱才有方向。';
}

function openDailySettlement(day, ledger) {
    if (!dailySettlementPanel || !dailySettlementBody) return;
    const pnl = readSavedInvestmentPnl();
    ledger.investmentPnl = pnl;
    const net = ledger.income - ledger.expense;
    if (dailySettlementKicker) dailySettlementKicker.textContent = '经营日报 · Day ' + day;
    if (dailySettlementTitle) dailySettlementTitle.textContent = net >= 0 ? '今天赚了 ' + net + ' 金币' : '今天亏了 ' + Math.abs(net) + ' 金币';
    const pnlText = pnl >= 0 ? '+' + pnl : String(pnl);
    /* 带图标的小圆点，一眼扫过去就知道今天忙了什么——订单量玩家
       最关心，固定露出来；农场/茶叶/股市这些今天没动静的就不占地方。 */
    const chips = [
        { icon: '💰', tone: 'gain', value: '+' + ledger.income, label: '收入', always: true },
        { icon: '💸', tone: 'loss', value: '-' + ledger.expense, label: '支出', always: true },
        { icon: '📦', tone: 'neutral', value: ledger.deliveries, label: '送单 · +' + ledger.deliveryIncome, always: true },
        { icon: '🌾', tone: 'neutral', value: ledger.farmHarvests, label: '收获' + (ledger.badWeatherHarvests ? ' · 减产' + ledger.badWeatherHarvests : ''), show: ledger.farmHarvests > 0 },
        { icon: '🍵', tone: 'neutral', value: ledger.teaBatches, label: '成品茶' + (ledger.teaPicks ? ' · 采茶' + ledger.teaPicks : ''), show: ledger.teaBatches > 0 || ledger.teaPicks > 0 },
        { icon: '📈', tone: pnl >= 0 ? 'gain' : 'loss', value: pnlText, label: '股票盈亏', show: pnl !== 0 }
    ].filter(t => t.always || t.show);
    const noteLines = [settlementAdvice(ledger)].concat(ledger.notes).slice(0, 4);
    dailySettlementBody.innerHTML =
        '<div class="dailySettlementChips">' +
        chips.map(t => '<div class="dailySettlementChip ' + t.tone + '"><span class="chipIcon">' + t.icon + '</span>' +
            '<span class="chipValue">' + t.value + '</span><span class="chipLabel">' + t.label + '</span></div>').join('') +
        '</div>' +
        '<ul class="dailySettlementNoteList">' + noteLines.map(n => '<li>' + n + '</li>').join('') + '</ul>';
    if (typeof window.publishLiveNews === 'function') {
        const headline = net >= 0 ? '今日盈余 ' + net + ' 金币' : '今日亏空 ' + Math.abs(net) + ' 金币';
        const bits = [];
        if (ledger.farmHarvests > 0) bits.push('收获 ' + ledger.farmHarvests + ' 次');
        if (ledger.deliveries > 0) bits.push('完成订单 ' + ledger.deliveries + ' 单，入账 ' + ledger.deliveryIncome);
        if (ledger.teaBatches > 0) bits.push('晒出成品茶 ' + ledger.teaBatches + ' 批');
        if (pnl) bits.push('股票账面' + (pnl >= 0 ? '盈' : '亏') + ' ' + Math.abs(pnl));
        const recap = (bits.length ? bits.join('，') + '。' : '今天没什么大动静。') + settlementAdvice(ledger);
        window.publishLiveNews(headline, recap, '经营日报');
    }
    dailySettlementPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
}

function closeDailySettlement() {
    if (!dailySettlementPanel) return;
    dailySettlementPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
}

function shouldOpenSettlement(ledger) {
    return ledger.income > 0 || ledger.expense > 0 || ledger.farmHarvests > 0 ||
        ledger.teaPicks > 0 || ledger.teaBatches > 0 || ledger.deliveries > 0;
}

function updateGameplayLoop() {
    const day = currentGameplayDay();
    if (gameplayLoopState.day < 0) {
        gameplayLoopState.day = day;
        return;
    }
    if (day === gameplayLoopState.day) return;
    const oldLedger = gameplayLoopState.ledger;
    const oldDay = gameplayLoopState.day;
    gameplayLoopState.day = day;
    gameplayLoopState.ledger = freshDailyLedger();
    if (currentDailyPlan() === 'rest' && typeof window.addCabinLuck === 'function') {
        window.addCabinLuck(1, false);
    }
    if (oldDay !== gameplayLoopState.settlementSeenDay && shouldOpenSettlement(oldLedger)) {
        gameplayLoopState.settlementSeenDay = oldDay;
        openDailySettlement(oldDay, oldLedger);
    }
}

function captureGameplayLoopState() {
    return {
        day: gameplayLoopState.day,
        dailyPlan: currentDailyPlan(),
        settlementSeenDay: gameplayLoopState.settlementSeenDay,
        ledger: Object.assign({}, gameplayLoopState.ledger, {
            notes: gameplayLoopState.ledger.notes.slice()
        })
    };
}

function applyGameplayLoopState(raw) {
    const ledger = raw && raw.ledger && typeof raw.ledger === 'object' ? raw.ledger : null;
    gameplayLoopState = {
        day: Number.isFinite(Number(raw && raw.day)) ? Math.trunc(Number(raw.day)) : -1,
        dailyPlan: DAILY_PLAN_OPTIONS.some(plan => plan.id === (raw && raw.dailyPlan)) ? raw.dailyPlan : 'balanced',
        settlementSeenDay: Number.isFinite(Number(raw && raw.settlementSeenDay)) ? Math.trunc(Number(raw.settlementSeenDay)) : -1,
        ledger: ledger ? Object.assign(freshDailyLedger(), ledger, {
            notes: Array.isArray(ledger.notes) ? ledger.notes.slice(-5) : []
        }) : freshDailyLedger()
    };
    renderDailyPlanOptions();
}

if (dailyPlanOptions) {
    dailyPlanOptions.addEventListener('click', event => {
        const btn = event.target.closest('.dailyPlanBtn');
        if (!btn) return;
        setDailyPlan(btn.dataset.plan);
        if (typeof SND !== 'undefined') SND.play('ui');
    });
}

if (dailySettlementCloseBtn) {
    dailySettlementCloseBtn.addEventListener('click', closeDailySettlement);
}

window.noteDailyMoney = noteDailyMoney;
window.noteDailyEvent = noteDailyEvent;
window.updateGameplayLoop = updateGameplayLoop;
window.captureGameplayLoopState = captureGameplayLoopState;
window.applyGameplayLoopState = applyGameplayLoopState;
window.getDailyPlan = currentDailyPlan;
window.renderDailyPlanOptions = renderDailyPlanOptions;

renderDailyPlanOptions();
