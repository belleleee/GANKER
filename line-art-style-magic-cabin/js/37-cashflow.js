'use strict';

const CASHFLOW_LOOKAHEAD_DAYS = 7;
const CASHFLOW_MAX_EVENTS = 80;

/* ---------------- 现金流工具：不只是看预测，还能主动出手 ----------------
   贷款——现在借到钱，代价是利息和一笔到期必须还的钱；
   清仓促销——把囤着的作物按六折立刻变现，救急但亏本。
   两个工具都换的是"什么时候有钱"，不是白捡便宜。 */
const CASHFLOW_LOAN_AMOUNTS = [200, 500, 1000];
const CASHFLOW_LOAN_INTEREST = 0.15;
const CASHFLOW_LOAN_DUE_DAYS = 5;
const CASHFLOW_CLEARANCE_RATE = 0.6;

let cashFlowState = {
    events: [],
    seq: 1,
    panelCollapsed: false,
    lastProcessedDay: -1,
    crisisWarned: false
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
        lastProcessedDay: Math.trunc(Number(source.lastProcessedDay) || -1),
        crisisWarned: source.crisisWarned === true
    };
    renderCashFlowPanel();
}

function captureCashFlowState() {
    return {
        events: cashFlowState.events.map(event => Object.assign({}, event)),
        seq: cashFlowState.seq,
        panelCollapsed: cashFlowState.panelCollapsed,
        crisisWarned: cashFlowState.crisisWarned,
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
        if (event.locked) {
            event.locked = false;
            if (typeof showHintOverride === 'function') showHintOverride('拖欠的 ' + event.label + ' 终于补上了');
        }
        return true;
    }
    /* 还不起的账不会凭空消失——不再永久锁死，每天都会再试着扣一次，
       欠着的当天顺手扣一次"违约"代价（口碑受损），直到真的还清为止。
       这才是"流动性危机"该有的样子：不是游戏结束，是持续的压力。 */
    if (!event.locked) {
        event.locked = true;
        if (typeof window.addGoodwillPenalty === 'function') {
            window.addGoodwillPenalty(2, event.label + ' 到期没能付清，信用受损');
        }
    }
    if (typeof showHintOverride === 'function') {
        showHintOverride('现金流告急：' + event.label + ' 到期需要 ' + cost + ' 金币，现金不够——这笔账还欠着，有钱了会自动补上。');
    }
    return false;
}

function processCashFlowDueEvents() {
    const today = currentCashFlowDay();
    checkLiquidityCrisis();
    if (cashFlowState.lastProcessedDay === today) return;
    cashFlowState.lastProcessedDay = today;
    let changed = false;
    cashFlowState.events = cashFlowState.events.filter(event => {
        if (event.dueDay > today) return true;
        changed = true;
        return !settleCashFlowEvent(event);
    });
    if (changed && typeof saveGameState === 'function') saveGameState(false);
    renderCashFlowPanel();
}

/* ---------------- 流动性危机预警 ----------------
   不是"现金 < 0 就算破产"，而是"未来几天最低点会跌到0以下"就提前示警——
   给玩家留出反应时间，而不是猝死式的结算。同一次危机只提醒一次，
   等真的缓过来（min回到0以上）才会重新武装警报。 */
function checkLiquidityCrisis() {
    const forecast = projectedCashFlow(CASHFLOW_LOOKAHEAD_DAYS);
    if (forecast.min < 0) {
        if (!cashFlowState.crisisWarned) {
            cashFlowState.crisisWarned = true;
            const hitRow = forecast.rows.find(row => row.balance < 0);
            const dayLabel = hitRow ? cashFlowDueLabel(hitRow.day) : '这几天内';
            const investUnlocked = typeof isMainStoryFeatureUnlocked === 'function' && isMainStoryFeatureUnlocked('investment');
            const remedy = investUnlocked
                ? '借点钱、清仓变现，或者去股市小屋——娃哈哈上市了的话，卖点创始人股也能救急，别真等到那天现金见底。'
                : '借点钱、清仓变现，或者收一收开销，别真等到那天现金见底。';
            if (typeof window.publishLiveNews === 'function') {
                window.publishLiveNews(
                    '现金流预警：' + dayLabel + ' 恐将见底',
                    '账本上按现在的收支推算，' + dayLabel + ' 手里的钱会跌破0。' + remedy,
                    '账本版'
                );
            }
            if (typeof showGuideCard === 'function') {
                showGuideCard(
                    '现金流要出问题了——按现在的账，' + dayLabel + ' 手里的钱会跌破0。趁还有几天缓冲，' + remedy,
                    9
                );
            } else if (typeof showHintOverride === 'function') {
                showHintOverride('现金流预警：' + dayLabel + ' 现金会跌破0，提前想想办法');
            }
        }
    } else if (cashFlowState.crisisWarned) {
        cashFlowState.crisisWarned = false;
    }
}

function hasActiveLoan() {
    return cashFlowState.events.some(event => event.type === 'loan');
}

function takeCashFlowLoan(amount) {
    if (hasActiveLoan()) {
        if (typeof showHintOverride === 'function') showHintOverride('手头还有一笔贷款没还清，先结清再借新的');
        return;
    }
    const principal = Math.max(1, Math.trunc(Number(amount) || 0));
    if (!principal) return;
    if (typeof window.addCabinCoins === 'function') window.addCabinCoins(principal, '银行贷款到账');
    const repay = Math.round(principal * (1 + CASHFLOW_LOAN_INTEREST));
    scheduleCashFlow(-repay, CASHFLOW_LOAN_DUE_DAYS, '贷款还本付息', { type: 'loan' });
    if (typeof showHintOverride === 'function') {
        showHintOverride('借到 ' + principal + ' 金币，' + CASHFLOW_LOAN_DUE_DAYS + ' 天后要还 ' + repay + '（含息）');
    }
}

function clearanceSaleCrops() {
    if (typeof cropStorage === 'undefined' || typeof CROP_TYPES === 'undefined' || typeof CROP_STORAGE_KEYS === 'undefined') return;
    let total = 0;
    CROP_STORAGE_KEYS.forEach(key => {
        const qty = Math.max(0, Math.trunc(Number(cropStorage[key]) || 0));
        if (!qty) return;
        const cropDef = Object.keys(CROP_TYPES).map(id => CROP_TYPES[id]).find(c => c.storageKey === key);
        const price = cropDef ? cropDef.harvestCoins : 0;
        total += Math.round(price * CASHFLOW_CLEARANCE_RATE) * qty;
        cropStorage[key] = 0;
    });
    if (!total) {
        if (typeof showHintOverride === 'function') showHintOverride('仓库里没什么可以清的');
        return;
    }
    if (typeof renderStorage === 'function') renderStorage(true);
    if (typeof window.addCabinCoins === 'function') window.addCabinCoins(total, '清仓甩卖');
    if (typeof showHintOverride === 'function') showHintOverride('仓库清空，六折甩卖换回 ' + total + ' 金币');
    renderCashFlowPanel();
}

function cashFlowToolsHtml() {
    const loanActive = hasActiveLoan();
    const loanBtns = loanActive
        ? '<p class="cashFlowToolNote">贷款未结清，到期会自动扣还</p>'
        : CASHFLOW_LOAN_AMOUNTS.map(v =>
            '<button type="button" class="cashFlowToolBtn" data-loan="' + v + '">借 ' + v + '</button>'
        ).join('');
    return '<div class="cashFlowTools">' +
        '<p class="cashFlowToolsTitle">现金流工具</p>' +
        '<div class="cashFlowToolRow">' + loanBtns + '</div>' +
        '<div class="cashFlowToolRow">' +
        '<button type="button" class="cashFlowToolBtn clearance" data-clearance="1">清仓促销（六折变现仓库作物）</button>' +
        '</div>' +
        '</div>';
}

if (cashFlowBody) {
    cashFlowBody.addEventListener('click', event => {
        const loanBtn = event.target.closest('[data-loan]');
        if (loanBtn) {
            takeCashFlowLoan(Number(loanBtn.dataset.loan));
            return;
        }
        const clearanceBtn = event.target.closest('[data-clearance]');
        if (clearanceBtn) clearanceSaleCrops();
    });
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
    /* 原来这里还有一份"今天/明天/Day8…Day12"逐日列表，但没有事件的那几天
       金额完全不变，一大串重复数字没什么信息量。简化成只列真正会发生变化
       的收付款项，一眼看完。 */
    cashFlowBody.innerHTML =
        '<div class="cashFlowEvents">' +
        upcoming.slice().sort((a, b) => a.dueDay - b.dueDay).slice(0, 4).map(item =>
            '<div class="cashFlowEvent ' + (item.amount >= 0 ? 'gain' : 'loss') + '">' +
            '<span>' + cashFlowDueLabel(item.dueDay) + ' · ' + item.label + '</span>' +
            '<strong>' + (item.amount >= 0 ? '+' : '') + item.amount + '</strong>' +
            '</div>'
        ).join('') +
        (upcoming.length ? '' : '<p class="cashFlowEmpty">暂无未来收付款。</p>') +
        '</div>' +
        cashFlowToolsHtml();
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
