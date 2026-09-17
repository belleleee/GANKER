'use strict';

/* ================================================================
   财富事件系统
   金币攒到一定量之后，日子不会一直风平浪静——广告商会找上门收"曝光费"，
   陌生人会请你入股"稳赚不赔"的项目，电视里也会放募捐广告。
   金币越多，这些事情来得越勤，呼应"钱越多，操心越多"的主题，
   同时用真实的选择（要不要接这笔投资、要不要捐这笔钱）代替一个
   看不见摸不着的"税"。
   ================================================================ */

const WEALTH_EVENT_START = 500;
const WEALTH_EVENT_MIN_GAP = 35;
const WEALTH_EVENT_MAX_GAP = 70;
const WEALTH_EVENT_SHRINK_SPAN = 4000;
const WEALTH_EVENT_MAX_SHRINK = 0.6;

let wealthEventState = {
    charityTotalDonated: 0,
    goodwillPenalty: 0,
    charityDonations: 0,
    charityMaxSingle: 0,
    financingWins: 0,
    financingLosses: 0,
    financingSharesWon: 0,
    adHits: 0,
    marketNews: []
};

/* 广告/融资/慈善这些事件，不该只是小屋里孤立的一次性弹窗——
   把它们写成"市场消息"存进共享存档，股市小屋下次打开时会读到，
   拿去当一次全市场的涨跌冲击（详见 investment-room/js/market/state.js
   里的 applyExternalMarketNews）。 */
function pushMarketNews(bad, magnitude, title) {
    wealthEventState.marketNews.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        bad: !!bad,
        magnitude: Math.max(0.01, Math.min(0.2, magnitude)),
        title
    });
    wealthEventState.marketNews = wealthEventState.marketNews.slice(-5);
}
let wealthEventTimer = WEALTH_EVENT_MIN_GAP;
let wealthEventOpen = false;

const wealthEventPanel = document.getElementById('wealthEventPanel');
const wealthEventKicker = document.getElementById('wealthEventKicker');
const wealthEventTitle = document.getElementById('wealthEventTitle');
const wealthEventBody = document.getElementById('wealthEventBody');
const wealthEventActions = document.getElementById('wealthEventActions');

function currentCoinsSafe() {
    return typeof cabinCoins === 'number' ? cabinCoins : 0;
}

function randomEventGap() {
    const over = Math.max(0, currentCoinsSafe() - WEALTH_EVENT_START);
    const shrink = Math.min(WEALTH_EVENT_MAX_SHRINK, over / WEALTH_EVENT_SHRINK_SPAN);
    const minGap = WEALTH_EVENT_MIN_GAP * (1 - shrink);
    const maxGap = WEALTH_EVENT_MAX_GAP * (1 - shrink);
    return minGap + Math.random() * (maxGap - minGap);
}

function openWealthEventPanel(kicker, title, bodyHtml, buttons) {
    if (!wealthEventPanel) return;
    wealthEventOpen = true;
    wealthEventKicker.textContent = kicker;
    wealthEventTitle.textContent = title;
    wealthEventBody.innerHTML = bodyHtml;
    wealthEventActions.innerHTML = '';
    buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'wealthEventBtn' + (b.primary ? ' primary' : '');
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
            closeWealthEventPanel();
            if (typeof b.onClick === 'function') b.onClick();
        });
        wealthEventActions.appendChild(btn);
    });
    wealthEventPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeWealthEventPanel() {
    if (!wealthEventPanel) return;
    wealthEventPanel.hidden = true;
    wealthEventOpen = false;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
}

/* 口碑不能只靠捐钱直线堆满。这里把它拆成：
   - 慈善基础分：捐得越多越高，但越往后越难涨
   - 负面惩罚：融资爆雷、订单失约、拖欠工资等都会扣口碑
   最终值仍然归一化到 0~1，给其他系统当"可信任程度"使用。 */
function charityGoodwill() {
    const donated = Math.max(0, wealthEventState.charityTotalDonated || 0);
    const base = Math.min(1, Math.sqrt(donated / 6000));
    const penalty = Math.min(0.75, Math.max(0, wealthEventState.goodwillPenalty || 0) / 100);
    return Math.max(0, base - penalty);
}

function addGoodwillPenalty(points, reason) {
    const value = Math.max(0, Math.trunc(Number(points) || 0));
    if (!value) return;
    wealthEventState.goodwillPenalty = Math.min(100, (wealthEventState.goodwillPenalty || 0) + value);
    if (reason && typeof showHintOverride === 'function') {
        showHintOverride(reason + ' · 口碑 -' + value);
    }
    if (typeof window.renderStatsPanel === 'function') window.renderStatsPanel();
    if (typeof saveGameState === 'function') saveGameState(false);
}

function cabinLuckBias(scale) {
    if (typeof window.getCabinLuck !== 'function') return 0;
    const luck = Math.max(0, Math.min(100, Number(window.getCabinLuck()) || 50));
    return ((luck - 50) / 50) * scale;
}

function triggerAdEvent() {
    const coins = currentCoinsSafe();
    const luckShield = Math.max(-0.08, Math.min(0.16, cabinLuckBias(0.12)));
    const cut = Math.max(20, Math.round(coins * (0.04 + Math.random() * 0.05) * (1 - charityGoodwill() * 0.3 - luckShield)));
    if (typeof window.spendCabinCoins === 'function') window.spendCabinCoins(cut, false);
    if (typeof window.addCabinLuck === 'function') window.addCabinLuck(-1, false);
    wealthEventState.adHits++;
    pushMarketNews(true, 0.04 + Math.random() * 0.03, '街头骗术横行，市场情绪转向谨慎');
    openWealthEventPanel(
        '突发广告',
        '被"精准投放"了',
        '一个自称"财富顾问"的商人堵在门口，硬塞给你一沓传单，说这是必须缴的"曝光费"。' +
        '<br>你还没来得及拒绝，钱包已经轻了 <b>' + cut + '</b> 金币。',
        [{ label: '认栽', primary: true }]
    );
}

/* 把 WAHA 创始股份加到玩家身上——小屋和股市小屋是两个独立页面，
   共用同一份存档（cabinSaveKey()），股市小屋只在自己 loadState() 时
   才会读一次这份存档，所以这里直接改存档里的 economy.investment.company，
   不用（也没法）碰股市小屋当前内存里的 state。下次玩家推开股市小屋的门，
   normalizeCompanyState() 会把这个数字读进去、夹到 [0,totalShares] 区间。 */
function grantWahaFounderShares(delta) {
    if (!delta) return 0;
    try {
        const raw = readJson(cabinSaveKey(), null);
        if (!raw || typeof raw !== 'object') return 0;
        raw.economy = raw.economy || {};
        raw.economy.investment = raw.economy.investment || {};
        const company = raw.economy.investment.company || {};
        const totalShares = Number(company.totalShares) || 10000;
        const base = Number.isFinite(company.founderShares) ? company.founderShares : totalShares;
        const next = Math.max(0, Math.min(totalShares, Math.round(base + delta)));
        company.founderShares = next;
        company.totalShares = totalShares;
        raw.economy.investment.company = company;
        writeJson(cabinSaveKey(), raw);
        return next - base;
    } catch (err) {
        return 0;
    }
}

/* 融资请求不再是"一个外地口音生意人"这一种脸——有人求稳、有人求快，
   还有人手里攥着早年跟着一起干的娃哈哈原始股，宁愿换现钱也不留着。
   每张卡自己定义抽成比例、成功率、赢了给什么（现金倍数 或 股份）。
   整体思路：比老版本更容易成，但每次能拿到的也更少——不再是靠一次
   暴击翻身，是靠一次次小赢慢慢攒。 */
const FINANCING_CARDS = [
    {
        id: 'cashSafe',
        weight: 3,
        kicker: '融资请求',
        title: '老街坊搭伙',
        body: name =>
            '巷口开杂货铺的老周凑过来，说想跟你搭伙做批小买卖，只要 <b>' + name + '</b> 金币周转，' +
            '赚了大家平分。<br>数目不大，他这人你也认识，靠谱。',
        stakeRange: coins => Math.max(20, Math.round(coins * (0.04 + Math.random() * 0.05))),
        winChance: () => 0.55 + charityGoodwill() * 0.12 + cabinLuckBias(0.08),
        winChanceRange: [0.35, 0.78],
        reward: { type: 'cash', mult: 1.5 },
        winText: reward => '老周真赚了一笔，分你 +' + reward + ' 金币，人情也攒下了。',
        loseText: stake => '小买卖赔了本，' + stake + ' 金币打水漂——好在数目不大，老周还挺不好意思。'
    },
    {
        id: 'cashRisk',
        weight: 2,
        kicker: '融资请求',
        title: '外地生意人',
        body: name =>
            '一个操着外地口音的生意人，说手里有个"稳赚不赔"的项目，想请你入股 <b>' + name + '</b> 金币。' +
            '<br>这种话，你年轻时也不是没听过。',
        stakeRange: coins => Math.max(30, Math.round(coins * (0.10 + Math.random() * 0.12))),
        winChance: () => 0.30 + charityGoodwill() * 0.10 + cabinLuckBias(0.08),
        winChanceRange: [0.15, 0.50],
        reward: { type: 'cash', mult: 2.0 },
        winText: reward => '运气这次站在你这边——项目真赚了，回本 +' + reward + ' 金币。',
        loseText: stake => '项目黄了，' + stake + ' 金币打了水漂——这种事，十次里有九次是这样。'
    },
    {
        id: 'equitySafe',
        weight: 2,
        kicker: '融资请求',
        title: '想套现的小股东',
        body: name =>
            '当年跟着一起跑腿的小张，手里还留着一点娃哈哈的原始股，说家里急用钱，' +
            '愿意折价转给你，开价 <b>' + name + '</b> 金币。<br>股份不多，但都是自己人，靠谱。',
        stakeRange: coins => Math.max(40, Math.round(coins * (0.05 + Math.random() * 0.05))),
        winChance: () => 0.55 + charityGoodwill() * 0.12 + cabinLuckBias(0.08),
        winChanceRange: [0.35, 0.78],
        reward: { type: 'equity', perStake: 1 / 45, minShares: 12, maxShares: 60 },
        winText: shares => '手续办妥，小张把 ' + shares + ' 股原始股过户给了你。',
        loseText: stake => '钱付了，小张那边却一直没把股份过户过来——' + stake + ' 金币打了水漂。'
    },
    {
        id: 'equityRisk',
        weight: 1,
        kicker: '融资请求',
        title: '公司元老让股',
        body: name =>
            '一位当年一起熬过苦日子的老伙计找上门，说自己不干了，手里那份娃哈哈原始股' +
            '想一次性套现走人，开价 <b>' + name + '</b> 金币，股份比小张那份多不少。<br>' +
            '这份交情，值不值这个价，你得自己掂量。',
        stakeRange: coins => Math.max(60, Math.round(coins * (0.10 + Math.random() * 0.10))),
        winChance: () => 0.30 + charityGoodwill() * 0.10 + cabinLuckBias(0.08),
        winChanceRange: [0.15, 0.50],
        reward: { type: 'equity', perStake: 1 / 28, minShares: 35, maxShares: 150 },
        winText: shares => '老伙计爽快，一次性把 ' + shares + ' 股原始股都过户给了你，转身就走。',
        loseText: stake => '钱到了对方手里，人却再也找不着了——' + stake + ' 金币和这份交情一起打了水漂。'
    }
];

function pickFinancingCard() {
    const total = FINANCING_CARDS.reduce((sum, c) => sum + c.weight, 0);
    let roll = Math.random() * total;
    for (const card of FINANCING_CARDS) {
        roll -= card.weight;
        if (roll <= 0) return card;
    }
    return FINANCING_CARDS[0];
}

function triggerFinancingEvent() {
    const coins = currentCoinsSafe();
    const card = pickFinancingCard();
    const stake = card.stakeRange(coins);
    openWealthEventPanel(
        card.kicker,
        card.title,
        card.body(stake),
        [
            {
                label: '婉拒',
                onClick: () => showHintOverride('你摆摆手，让他自己走了。')
            },
            {
                label: '入股 ' + stake + ' 金币',
                primary: true,
                onClick: () => resolveFinancing(card, stake)
            }
        ]
    );
}

function resolveFinancing(card, stake) {
    if (typeof window.spendCabinCoins !== 'function' || !window.spendCabinCoins(stake, false)) {
        showHintOverride('金币不够，这笔投资谈不成。');
        return;
    }
    const [lo, hi] = card.winChanceRange;
    const winChance = Math.max(lo, Math.min(hi, card.winChance()));
    const win = Math.random() < winChance;
    if (win) {
        if (typeof window.addCabinLuck === 'function') window.addCabinLuck(2, false);
        wealthEventState.financingWins++;
        pushMarketNews(false, 0.05 + Math.random() * 0.04, '民间融资传出好消息，市场情绪回暖');
        if (card.reward.type === 'equity') {
            const raw = Math.round(stake * card.reward.perStake);
            const shares = Math.max(card.reward.minShares, Math.min(card.reward.maxShares, raw));
            const granted = grantWahaFounderShares(shares);
            wealthEventState.financingSharesWon = (wealthEventState.financingSharesWon || 0) + granted;
            showHintOverride(card.winText(granted));
        } else {
            const reward = Math.round(stake * card.reward.mult);
            if (typeof window.addCabinCoins === 'function') window.addCabinCoins(reward, false);
            showHintOverride(card.winText(reward));
        }
    } else {
        if (typeof window.addCabinLuck === 'function') window.addCabinLuck(-2, false);
        addGoodwillPenalty(4, false);
        wealthEventState.financingLosses++;
        pushMarketNews(true, 0.06 + Math.random() * 0.04, '非正规融资项目接连爆雷，投资者信心受挫');
        showHintOverride(card.loseText(stake));
    }
    if (typeof saveGameState === 'function') saveGameState(false);
}

const CHARITY_OPTIONS = [50, 200, 500];

function triggerCharityEvent() {
    const coins = currentCoinsSafe();
    const affordable = CHARITY_OPTIONS.filter(v => v <= coins);
    const buttons = affordable.map(v => ({
        label: '捐 ' + v + ' 金币',
        onClick: () => donateCharity(v)
    }));
    buttons.push({ label: '这次不捐了', primary: affordable.length === 0 });
    openWealthEventPanel(
        '募捐广告',
        '山区小学要盖新校舍',
        '电视里在播一则公益广告，说山区有所小学的屋顶塌了，孩子们在漏雨的教室里上课。' +
        '<br>屏幕下方滚动着一个捐款账号。',
        buttons
    );
}

function donateCharity(amount) {
    if (typeof window.spendCabinCoins !== 'function' || !window.spendCabinCoins(amount, false)) {
        showHintOverride('金币不够，捐不了这么多。');
        return;
    }
    wealthEventState.charityTotalDonated += amount;
    wealthEventState.goodwillPenalty = Math.max(0, (wealthEventState.goodwillPenalty || 0) - Math.max(1, Math.round(amount / 180)));
    wealthEventState.charityDonations++;
    wealthEventState.charityMaxSingle = Math.max(wealthEventState.charityMaxSingle || 0, amount);
    if (typeof window.addCabinLuck === 'function') window.addCabinLuck(Math.max(1, Math.round(amount / 250)), false);
    if (typeof window.renderStatsPanel === 'function') window.renderStatsPanel();
    pushMarketNews(false, 0.02 + Math.random() * 0.02, '慈善捐赠传递暖意，市场情绪略有提振');
    if (typeof saveGameState === 'function') saveGameState(false);
    const goodwillPct = Math.round(charityGoodwill() * 100);
    showHintOverride('捐出 ' + amount + ' 金币 · 累计捐款 ' + wealthEventState.charityTotalDonated +
        ' 金币 · 口碑 ' + goodwillPct + '%（增长会变慢；失约、拖欠工资、爆雷会扣口碑）');
}

function pickWealthEvent() {
    const roll = Math.random();
    if (roll < 0.4) triggerAdEvent();
    else if (roll < 0.75) triggerFinancingEvent();
    else triggerCharityEvent();
}

function updateWealthEvents(dt) {
    if (wealthEventOpen) return;
    if (window.APP_SHELL_BLOCK_GAME) return;
    if (currentCoinsSafe() < WEALTH_EVENT_START) return;
    wealthEventTimer -= dt || 0;
    if (wealthEventTimer > 0) return;
    wealthEventTimer = randomEventGap();
    pickWealthEvent();
}

function captureWealthEventsState() {
    return {
        charityTotalDonated: wealthEventState.charityTotalDonated,
        goodwillPenalty: wealthEventState.goodwillPenalty || 0,
        charityDonations: wealthEventState.charityDonations,
        charityMaxSingle: wealthEventState.charityMaxSingle,
        financingWins: wealthEventState.financingWins,
        financingLosses: wealthEventState.financingLosses,
        financingSharesWon: wealthEventState.financingSharesWon || 0,
        adHits: wealthEventState.adHits,
        marketNews: wealthEventState.marketNews
    };
}

function applyWealthEventsState(raw) {
    wealthEventState = {
        charityTotalDonated: Math.max(0, Math.trunc(Number(raw && raw.charityTotalDonated) || 0)),
        goodwillPenalty: Math.max(0, Math.min(100, Math.trunc(Number(raw && raw.goodwillPenalty) || 0))),
        charityDonations: Math.max(0, Math.trunc(Number(raw && raw.charityDonations) || 0)),
        charityMaxSingle: Math.max(0, Math.trunc(Number(raw && raw.charityMaxSingle) || 0)),
        financingWins: Math.max(0, Math.trunc(Number(raw && raw.financingWins) || 0)),
        financingLosses: Math.max(0, Math.trunc(Number(raw && raw.financingLosses) || 0)),
        financingSharesWon: Math.max(0, Math.trunc(Number(raw && raw.financingSharesWon) || 0)),
        adHits: Math.max(0, Math.trunc(Number(raw && raw.adHits) || 0)),
        marketNews: Array.isArray(raw && raw.marketNews) ? raw.marketNews.slice(-5) : []
    };
}

if (wealthEventActions) {
    wealthEventActions.addEventListener('keydown', e => {
        if (e.key === 'Escape') e.preventDefault();
    });
}

window.updateWealthEvents = updateWealthEvents;
window.captureWealthEventsState = captureWealthEventsState;
window.applyWealthEventsState = applyWealthEventsState;
window.getCharityTotalDonated = function () { return wealthEventState.charityTotalDonated; };
window.getCharityGoodwill = charityGoodwill;
window.addGoodwillPenalty = addGoodwillPenalty;
window.getFinancingStats = function () {
    return {
        wins: wealthEventState.financingWins,
        losses: wealthEventState.financingLosses,
        sharesWon: wealthEventState.financingSharesWon || 0
    };
};
window.getWealthEventStats = function () {
    return {
        charityTotalDonated: wealthEventState.charityTotalDonated,
        goodwillPenalty: wealthEventState.goodwillPenalty || 0,
        charityDonations: wealthEventState.charityDonations,
        charityMaxSingle: wealthEventState.charityMaxSingle,
        financingWins: wealthEventState.financingWins,
        financingLosses: wealthEventState.financingLosses,
        financingSharesWon: wealthEventState.financingSharesWon || 0,
        adHits: wealthEventState.adHits
    };
};
