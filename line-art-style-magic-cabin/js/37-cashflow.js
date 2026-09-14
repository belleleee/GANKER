'use strict';

const CASHFLOW_LOOKAHEAD_DAYS = 7;
const CASHFLOW_MAX_EVENTS = 80;

let cashFlowState = {
    events: [],
    seq: 1,
    panelCollapsed: false,
    lastProcessedDay: -1
};

const cashFlowPanel = document.getElementById('cashFlowPanel');
const cashFlowToggle = document.getElementById('cashFlowToggle');
const cashFlowSummary = document.getElementById('cashFlowSummary');
const cashFlowBody = document.getElementById('cashFlowBody');

function currentCashFlowDay() {
    if (typeof gameSec !== 'number') return 1;
    return Math.max(1, Math.floor(gameSec / (24 * 3600)) + 1);
}

function normalizeCashFlowEvent(event) {
    if (!event || typeof event !== 'object') return null;
    const amount = Math.trunc(Number(event.amount) || 0);
    const dueDay = Math.max(1, Math.trunc(Number(event.dueDay) || 1));
    if (!amount) return null;
    return {
        id: typeof event.id === 'string' ? event.id.slice(0, 40) : 'cf_' + cashFlowState.seq++,
        amount,
        dueDay,
        label: typeof event.label === 'string' ? event.label.slice(0, 48) : '现金流事件',
        type: typeof event.type === 'string' ? event.type.slice(0, 24) : (amount >= 0 ? 'receivable' : 'payable'),
        createdDay: Math.max(1, Math.trunc(Number(event.createdDay) || currentCashFlowDay())),
        locked: event.locked === true
    };
}

function normalizeCashFlowState(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const events = Array.isArray(source.events)
        ? source.events.map(normalizeCashFlowEvent).filter(Boolean).slice(-CASHFLOW_MAX_EVENTS)
        : [];
    const maxSeq = events.reduce((max, event) => {
        const match = /^cf_(\d+)/.exec(event.id);
        return match ? Math.max(max, Number(match[1]) + 1) : max;
    }, 1);
    cashFlowState = {
        events,
        seq: Math.max(maxSeq, Math.trunc(Number(source.seq) || 1)),
        panelCollapsed: source.panelCollapsed === true,
        lastProcessedDay: Math.trunc(Number(source.lastProcessedDay) || -1)
    };
    renderCashFlowPanel();
}

function captureCashFlowState() {
    return {
        events: cashFlowState.events.map(event => Object.assign({}, event)),
        seq: cashFlowState.seq,
        panelCollapsed: cashFlowState.panelCollapsed,
        lastProcessedDay: cashFlowState.lastProcessedDay
    };
}

function applyCashFlowState(raw) {
    normalizeCashFlowState(raw);
}

function scheduleCashFlow(amount, dueInDays, label, options) {
    const value = Math.trunc(Number(amount) || 0);
    if (!value) return null;
    const opts = options || {};
    const today = currentCashFlowDay();
    const dueDay = today + Math.max(0, Math.trunc(Number(dueInDays) || 0));
    const event = normalizeCashFlowEvent({
        id: 'cf_' + cashFlowState.seq++,
        amount: value,
        dueDay,
        label: label || (value >= 0 ? '应收回款' : '待付账单'),
        type: opts.type || (value >= 0 ? 'receivable' : 'payable'),
        createdDay: today,
        locked: !!opts.locked
    });
    if (!event) return null;
    cashFlowState.events.push(event);
    cashFlowState.events = cashFlowState.events.slice(-CASHFLOW_MAX_EVENTS);
    renderCashFlowPanel();
    if (typeof saveGameState === 'function') saveGameState(false);
    return event;
}

function cashFlowDueLabel(day) {
    const today = currentCashFlowDay();
    if (day <= today) return '今天';
    if (day === today + 1) return '明天';
    return 'Day ' + day;
}

/* 光靠 scheduleCashFlow() 这个API是不够的——除了代销订单，没有别的系统会
   主动登记账单，导致预测面板永远是一条直线、"暂无未来收付款"。农场帮手的
   日薪、地租到期这两个最明显的经常性支出，直接在这里合成成"预测项"，
   不需要每个系统都手动调用 scheduleCashFlow 来登记。 */
function recurringForecastItems(day) {
    const items = [];
    if (typeof farmHireState !== 'undefined' && farmHireState.hired && !farmHireState.striking &&
        typeof FARM_WORKER_DAILY_WAGE === 'number') {
        items.push({ amount: -FARM_WORKER_DAILY_WAGE, label: '农场帮手日薪' });
    }
    if (typeof landState !== 'undefined' && !landState.owned && landState.rentedUntilDay === day &&
        typeof LAND_RENT_COST === 'number') {
        items.push({ amount: -LAND_RENT_COST, label: '地租到期（需续租）' });
    }
    return items;
}

function projectedCashFlow(days) {
    const today = currentCashFlowDay();
    const start = typeof window.getCabinCoins === 'function' ? window.getCabinCoins() : 0;
    let running = Math.trunc(Number(start) || 0);
    const rows = [];
    let min = running;
    for (let i = 0; i < days; i++) {
        const day = today + i;
        const scheduled = cashFlowState.events
            .filter(event => event.dueDay === day)
            .reduce((sum, event) => sum + event.amount, 0);
        /* 第0天（今天）不叠加"每天都有"的日薪——那笔钱按游戏里实际的结算
           时机（settleFarmWorkerWage）走，这里只预测"明天开始"还要花多少。 */
        const recurring = i > 0 ? recurringForecastItems(day).reduce((sum, item) => sum + item.amount, 0) : 0;
        const delta = scheduled + recurring;
        if (i > 0 || delta) running += delta;
        min = Math.min(min, running);
        rows.push({ day, balance: running, delta });
    }
    return { start, min, rows };
}

function settleCashFlowEvent(event) {
    if (!event || event.locked) return true;
    if (event.amount > 0) {
        if (typeof window.addCabinCoins === 'function') {
            window.addCabinCoins(event.amount, '回款 · ' + event.label);
        }
        return true;
    }
    const cost = Math.abs(event.amount);
    if (typeof window.spendCabinCoins === 'function' && window.spendCabinCoins(cost, '到期付款 · ' + event.label)) {
        return true;
    }
    event.locked = true;
    if (typeof showHintOverride === 'function') {
        showHintOverride('现金流告急：' + event.label + ' 到期需要 ' + cost + ' 金币，现金不够。');
    }
    return false;
}

function processCashFlowDueEvents() {
    const today = currentCashFlowDay();
    if (cashFlowState.lastProcessedDay === today) return;
    cashFlowState.lastProcessedDay = today;
    let changed = false;
    cashFlowState.events = cashFlowState.events.filter(event => {
        if (event.dueDay > today || event.locked) return true;
        changed = true;
        return !settleCashFlowEvent(event);
    });
    if (changed && typeof saveGameState === 'function') saveGameState(false);
    renderCashFlowPanel();
}

function upcomingDisplayItems() {
    const today = currentCashFlowDay();
    const items = cashFlowState.events.map(event => ({
        dueDay: event.dueDay,
        label: event.label,
        amount: event.amount
    }));
    for (let i = 1; i < CASHFLOW_LOOKAHEAD_DAYS; i++) {
        const day = today + i;
        recurringForecastItems(day).forEach(item => items.push({ dueDay: day, label: item.label, amount: item.amount }));
    }
    return items;
}

function renderCashFlowPanel() {
    if (!cashFlowPanel || !cashFlowSummary || !cashFlowBody) return;
    const forecast = projectedCashFlow(CASHFLOW_LOOKAHEAD_DAYS);
    const upcoming = upcomingDisplayItems();
    const pendingIn = upcoming.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const pendingOut = upcoming.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const danger = forecast.min < 0;
    const warn = !danger && forecast.min < Math.max(100, forecast.start * 0.25);
    cashFlowPanel.classList.toggle('collapsed', cashFlowState.panelCollapsed);
    cashFlowPanel.classList.toggle('danger', danger);
    cashFlowPanel.classList.toggle('warn', warn);
    if (cashFlowToggle) cashFlowToggle.setAttribute('aria-expanded', String(!cashFlowState.panelCollapsed));
    cashFlowSummary.textContent = '7天最低 ' + forecast.min + ' · 应收 ' + pendingIn + ' · 应付 ' + pendingOut;
    cashFlowBody.innerHTML =
        '<div class="cashFlowRows">' +
        forecast.rows.map(row => {
            const cls = row.balance < 0 ? ' danger' : row.balance < 100 ? ' warn' : '';
            const delta = row.delta ? '<small class="' + (row.delta > 0 ? 'gain' : 'loss') + '">' + (row.delta > 0 ? '+' : '') + row.delta + '</small>' : '<small></small>';
            return '<div class="cashFlowRow' + cls + '">' +
                '<span>' + cashFlowDueLabel(row.day) + '</span>' +
                '<strong>' + row.balance + '</strong>' +
                delta +
                '</div>';
        }).join('') +
        '</div>' +
        '<div class="cashFlowEvents">' +
        upcoming.slice().sort((a, b) => a.dueDay - b.dueDay).slice(0, 4).map(item =>
            '<div class="cashFlowEvent ' + (item.amount >= 0 ? 'gain' : 'loss') + '">' +
            '<span>' + cashFlowDueLabel(item.dueDay) + ' · ' + item.label + '</span>' +
            '<strong>' + (item.amount >= 0 ? '+' : '') + item.amount + '</strong>' +
            '</div>'
        ).join('') +
        (upcoming.length ? '' : '<p class="cashFlowEmpty">暂无未来收付款。</p>') +
        '</div>';
}

function updateCashFlow() {
    processCashFlowDueEvents();
}

if (cashFlowToggle) {
    cashFlowToggle.addEventListener('click', () => {
        cashFlowState.panelCollapsed = !cashFlowState.panelCollapsed;
        renderCashFlowPanel();
        if (typeof saveGameState === 'function') saveGameState(false);
    });
}

window.captureCashFlowState = captureCashFlowState;
window.applyCashFlowState = applyCashFlowState;
window.scheduleCashFlow = scheduleCashFlow;
window.renderCashFlowPanel = renderCashFlowPanel;
window.updateCashFlow = updateCashFlow;
