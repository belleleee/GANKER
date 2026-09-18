function safeMoney(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : (fallback || 0);
}

function safeStockForTrade(id) {
  const stock = getStock(id);
  if (!Number.isFinite(stock.price) || stock.price < 1) {
    marketState.stocks[id] = sanitizeStock(stock, id);
    return getStock(id);
  }
  return stock;
}

let marketFeedbackLayer = null;
let marketFeedbackFlash = null;
let marketFeedbackMilestone = { gain: 0, loss: 0 };

function ensureMarketFeedbackDom() {
  if (!marketFeedbackLayer) {
    marketFeedbackLayer = document.createElement('div');
    marketFeedbackLayer.className = 'marketFeedbackLayer';
    document.body.appendChild(marketFeedbackLayer);
  }
  if (!marketFeedbackFlash) {
    marketFeedbackFlash = document.createElement('div');
    marketFeedbackFlash.className = 'marketFeedbackFlash';
    document.body.appendChild(marketFeedbackFlash);
  }
}

function showMarketFeedback(amount, title, detail, options) {
  const value = Math.round(Number(amount) || 0);
  if (!value) return;
  const opts = options || {};
  ensureMarketFeedbackDom();
  const gain = value > 0;
  const abs = Math.abs(value);
  const node = document.createElement('div');
  node.className = 'marketResultToast ' + (gain ? 'gain' : 'loss');
  node.innerHTML =
    '<small>' + (title || (gain ? 'PROFIT' : 'LOSS')) + '</small>' +
    '<strong>' + (gain ? '+' : '-') + abs + '</strong>' +
    '<p>' + (detail || (gain ? '这次判断带来了现金流。' : '这次判断开始付出代价。')) + '</p>';
  marketFeedbackLayer.appendChild(node);
  setTimeout(() => node.remove(), 2500);

  marketFeedbackFlash.className = 'marketFeedbackFlash ' + (gain ? 'gain' : 'loss');
  marketFeedbackFlash.style.animation = 'none';
  void marketFeedbackFlash.offsetWidth;
  marketFeedbackFlash.style.animation = '';

  const monitor = document.querySelector('.screenMonitor');
  if (monitor) {
    monitor.classList.remove('marketPulseGain', 'marketPulseLoss');
    void monitor.offsetWidth;
    monitor.classList.add(gain ? 'marketPulseGain' : 'marketPulseLoss');
    setTimeout(() => monitor.classList.remove('marketPulseGain', 'marketPulseLoss'), 800);
  }
  const toastLabel = opts.toastLabel || (gain ? '盈利 +' : '亏损 -');
  if (typeof showToast === 'function') showToast(toastLabel + abs + ' · ' + (detail || ''), 2600);

  if (opts.countMilestone !== false) {
    const bucket = gain ? 'gain' : 'loss';
    const before = marketFeedbackMilestone[bucket];
    marketFeedbackMilestone[bucket] += abs;
    const crossed500 = before < 500 && marketFeedbackMilestone[bucket] >= 500;
    const crossed1500 = before < 1500 && marketFeedbackMilestone[bucket] >= 1500;
    if (crossed1500 || crossed500) {
      setTimeout(() => showToast(gain
        ? '累计盈利已经很可观了，别忘了把运气变成规则。'
        : '累计亏损已经敲响警钟，下一步先想活下来。', 3600), 500);
    }
  }
}

/* ---------------- 宗师傅苏格拉底式提问 ----------------
   买之前先问"为什么买"，不是直接告诉你该不该买——三个理由对应他
   三种反应：算过基本面的，他认；听消息就冲的，他要你先想想核实
   过没有；纯靠感觉的，他直接泼冷水。理由本身不影响成交，影响的
   是他怎么看你这一笔——判断质量的反馈，比"对/错"更接近真实投资。 */
const MENTOR_BUY_REASONS = [
  {
    id: 'fundamentals',
    label: '我算过基本面/估值，觉得被低估了',
    quote: '"这才像话。算错了不丢人，没算才丢人——继续这么来。"'
  },
  {
    id: 'news',
    label: '听到消息/新闻，觉得要涨',
    quote: '"消息只是线索，不是答案。核实过没有，还是听风就是雨？"'
  },
  {
    id: 'feel',
    label: '说不清，就是感觉会涨',
    quote: '"凭感觉进的场，跌下去也别怪我没提醒你——凭感觉赚的钱，迟早凭感觉还回去。"'
  }
];

let mentorBuyLayer = null;
let pendingBuyRequest = null;

function ensureMentorBuyDom() {
  if (mentorBuyLayer) return;
  mentorBuyLayer = document.createElement('div');
  mentorBuyLayer.className = 'mentorBuyLayer';
  mentorBuyLayer.hidden = true;
  document.body.appendChild(mentorBuyLayer);
  mentorBuyLayer.addEventListener('click', event => {
    if (event.target === mentorBuyLayer) closeMentorBuyPrompt();
    const btn = event.target.closest('button[data-reason]');
    if (btn) confirmMentorBuyReason(btn.dataset.reason);
  });
}

function requestBuyWithReason(id, qty, margin) {
  const stock = safeStockForTrade(id);
  ensureMentorBuyDom();
  pendingBuyRequest = { id, qty: Math.max(1, Math.trunc(Number(qty)) || 1), margin: !!margin };
  const rows = MENTOR_BUY_REASONS.map(r =>
    '<button type="button" class="mentorReasonBtn" data-reason="' + r.id + '">' + r.label + '</button>').join('');
  mentorBuyLayer.innerHTML =
    '<div class="mentorBuyCard">' +
    '<p class="mentorBuyAsk">宗庆后：买 ' + stock.name + ' ×' + pendingBuyRequest.qty + ' 之前，问你一句——<b>你为什么买？</b></p>' +
    '<div class="mentorReasonList">' + rows + '</div>' +
    '</div>';
  mentorBuyLayer.hidden = false;
}

function closeMentorBuyPrompt() {
  pendingBuyRequest = null;
  if (mentorBuyLayer) mentorBuyLayer.hidden = true;
}

function confirmMentorBuyReason(reasonId) {
  const request = pendingBuyRequest;
  const reason = MENTOR_BUY_REASONS.find(r => r.id === reasonId);
  if (!request || !reason) { closeMentorBuyPrompt(); return; }
  closeMentorBuyPrompt();
  if (request.margin) {
    buyStockOnMargin(request.id, request.qty);
  } else {
    buyStock(request.id, request.qty);
  }
  if (typeof showToast === 'function') showToast(reason.quote, 3600);
}

function buyStock(id, count) {
  const stock = safeStockForTrade(id);
  if (stock.id === 'WAHA' && !companyState().listed) {
    if (typeof showToast === 'function') showToast('娃哈哈还没上市，先选择发行方案。');
    return;
  }
  if (stock.acquired) {
    if (typeof showToast === 'function') showToast(stock.name + '已经被娃哈哈收购，不再是独立上市公司了。');
    return;
  }
  if (typeof showInvestTipOnce === 'function') {
    showInvestTipOnce('firstBuy',
      '买入之后，你自己也成了影响价格的一份子',
      '持仓越重，你的买卖动作本身也会轻轻推动股价——一次性砸太多进一支股票，容易把自己架在高位。分批买，比一把梭哈更接近"经营"而不是"赌"。');
  }
  const qty = Math.max(1, Math.trunc(Number(count)) || 1);
  state.coins = Math.trunc(safeMoney(state.coins, 100));
  const cost = Math.ceil(stock.price * qty);
  if (!Number.isFinite(cost)) return;
  if (state.coins < cost) {
    if (typeof showToast === 'function') showToast('金币不够，买 ' + stock.name + ' 需要 ' + cost + ' 金币');
    return;
  }
  state.coins -= cost;
  const holding = getHolding(id);
  holding.qty += qty;
  holding.cost += cost;
  stock.pressure += .01 * qty;
  setHolding(id, holding);
  logTrade();
  showMarketFeedback(-cost, '建仓成本', '买入 ' + stock.name + ' ×' + qty + '，现金减少但仓位开始工作。', {
    countMilestone: false,
    toastLabel: '现金 -'
  });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function buyStockOnMargin(id, count) {
  const stock = safeStockForTrade(id);
  if (stock.id === 'WAHA' && !companyState().listed) {
    if (typeof showToast === 'function') showToast('娃哈哈还没上市，先选择发行方案。');
    return;
  }
  if (typeof showInvestTipOnce === 'function') {
    showInvestTipOnce('marginBuy',
      '融资买入：借钱放大仓位，也放大风险',
      '融资买的部分是借来的，每天要计利息；一旦权益（现金+持仓市值-欠款）跌破欠款的30%，系统会强制把持仓全部卖掉抵债，还会扣声誉。赚的时候翻倍赚，亏的时候也翻倍亏——别把全部身家都押在杠杆上。');
  }
  const qty = Math.max(1, Math.trunc(Number(count)) || 1);
  state.coins = Math.trunc(safeMoney(state.coins, 2600));
  const cost = Math.ceil(stock.price * qty);
  if (!Number.isFinite(cost)) return;
  const cashPart = Math.min(state.coins, cost);
  const borrowPart = cost - cashPart;
  if (borrowPart > marginBorrowLimit()) {
    if (typeof showToast === 'function') showToast('融资额度不够了，先还一部分融资款或减少数量');
    return;
  }
  state.coins -= cashPart;
  if (borrowPart > 0) setMarginDebt(marginDebt() + borrowPart);
  const holding = getHolding(id);
  holding.qty += qty;
  holding.cost += cost;
  stock.pressure += .012 * qty;
  setHolding(id, holding);
  logTrade();
  showMarketFeedback(-cost, '融资建仓', '买入 ' + stock.name + ' ×' + qty +
    (borrowPart ? '，其中融资 ' + borrowPart + ' 金币（欠款合计 ' + marginDebt() + '）' : '') + '。', {
      countMilestone: false, toastLabel: '现金 -'
    });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function repayMargin(amount) {
  const debt = marginDebt();
  if (!debt) {
    if (typeof showToast === 'function') showToast('没有融资欠款需要偿还');
    return;
  }
  state.coins = Math.trunc(safeMoney(state.coins, 2600));
  const pay = Math.min(Math.max(1, Math.trunc(Number(amount)) || 0), debt, state.coins);
  if (pay <= 0) {
    if (typeof showToast === 'function') showToast('金币不够还款');
    return;
  }
  state.coins -= pay;
  setMarginDebt(debt - pay);
  showMarketFeedback(-pay, '偿还融资', '还掉 ' + pay + ' 金币融资欠款，剩余欠款 ' + marginDebt() + '。', {
    countMilestone: false, toastLabel: '现金 -'
  });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function sellStock(id, count) {
  const stock = safeStockForTrade(id);
  if (stock.id === 'WAHA' && !companyState().listed) {
    if (typeof showToast === 'function') showToast('娃哈哈还没上市，不能二级市场卖出。');
    return;
  }
  const holding = getHolding(id);
  const qty = Math.min(Math.max(1, Math.trunc(Number(count)) || 1), holding.qty);
  if (!qty) {
    if (typeof showToast === 'function') showToast('你还没有持有 ' + stock.name);
    return;
  }
  const income = Math.floor(stock.price * qty);
  const avg = holding.qty ? holding.cost / holding.qty : 0;
  const costOut = Math.round(avg * qty);
  const profit = income - costOut;
  if (profit >= 0) state.investment.realizedGain += profit;
  else state.investment.realizedLoss += Math.abs(profit);
  holding.qty -= qty;
  holding.cost = Math.max(0, holding.cost - costOut);
  stock.pressure -= .012 * qty;
  setHolding(id, holding);
  state.coins = Math.min(999999, state.coins + income);
  logTrade();
  showMarketFeedback(profit || income, profit >= 0 ? '卖出兑现' : '卖出止损',
    stock.name + ' ×' + qty + ' · 回收 ' + income + ' 金币 · 本次' + (profit >= 0 ? '赚 ' + profit : '亏 ' + Math.abs(profit)), {
      countMilestone: profit !== 0,
      toastLabel: profit === 0 ? '现金 +' : undefined
    });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function shortStock(id, count) {
  const stock = safeStockForTrade(id);
  if (stock.id === 'WAHA') {
    if (typeof showToast === 'function') showToast('创始人公司不能做空。');
    return;
  }
  if (typeof showInvestTipOnce === 'function') {
    showInvestTipOnce('firstShort',
      '做空是反着赚钱，风险也是反着来的',
      '做空先拿到钱，但欠的是股票，不是钱——股价涨得越多，平仓要花的钱就越多，亏损没有上限。做空之前，先看看"稳定度"高不高，别在情绪狂热的时候跟风做空。');
  }
  const qty = Math.max(1, Math.trunc(Number(count)) || 1);
  state.coins = Math.trunc(safeMoney(state.coins, 100));
  const proceeds = Math.floor(stock.price * qty);
  if (!Number.isFinite(proceeds)) return;
  if (shortExposure() + proceeds > shortLimit()) {
    if (typeof showToast === 'function') showToast('做空额度不够了，先平掉一些空单');
    return;
  }
  const short = getShort(id);
  short.qty += qty;
  short.entryValue += proceeds;
  setShort(id, short);
  state.coins = Math.min(999999, state.coins + proceeds);
  stock.pressure -= .012 * qty;
  logTrade();
  showMarketFeedback(proceeds, '开空回笼现金', '做空 ' + stock.name + ' ×' + qty + '，先拿到现金，风险也一起放大。', {
    countMilestone: false,
    toastLabel: '现金 +'
  });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function coverShort(id, count) {
  const stock = safeStockForTrade(id);
  if (stock.id === 'WAHA') {
    if (typeof showToast === 'function') showToast('娃哈哈没有可平的做空仓位。');
    return;
  }
  const short = getShort(id);
  const qty = Math.min(Math.max(1, Math.trunc(Number(count)) || 1), short.qty);
  if (!qty) {
    if (typeof showToast === 'function') showToast('你还没有 ' + stock.name + ' 的空单');
    return;
  }
  const cost = Math.ceil(stock.price * qty);
  if (state.coins < cost) {
    if (typeof showToast === 'function') showToast('金币不够，平仓需要 ' + cost + ' 金币');
    return;
  }
  const avgEntry = short.qty ? short.entryValue / short.qty : 0;
  const entryOut = Math.round(avgEntry * qty);
  const profit = entryOut - cost;
  if (profit >= 0) state.investment.realizedGain += profit;
  else state.investment.realizedLoss += Math.abs(profit);
  short.qty -= qty;
  short.entryValue = Math.max(0, short.entryValue - entryOut);
  setShort(id, short);
  state.coins -= cost;
  stock.pressure += .01 * qty;
  logTrade();
  showMarketFeedback(profit || -cost, profit >= 0 ? '空单盈利' : '空单亏损',
    stock.name + ' ×' + qty + ' · 平仓花费 ' + cost + ' 金币 · 本次' + (profit >= 0 ? '赚 ' + profit : '亏 ' + Math.abs(profit)), {
      countMilestone: profit !== 0,
      toastLabel: profit === 0 ? '现金 -' : undefined
    });
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

const WAHA_IPO_PLANS = {
  employee: {
    label: '员工与老经销商',
    target: '员工与老经销商',
    publicShares: 1600,
    price: 102,
    rep: 8,
    shock: .04,
    note: '发行少、定价温和，控制权稳，口碑和声誉更好。'
  },
  partner: {
    label: '乡镇联销伙伴',
    target: '乡镇联销伙伴',
    publicShares: 2600,
    price: 120,
    rep: 3,
    shock: .08,
    note: '融资和渠道兼顾，股权稀释适中。'
  },
  public: {
    label: '公开市场投资者',
    target: '公开市场投资者',
    publicShares: 4200,
    price: 144,
    rep: -4,
    shock: .13,
    note: '融资最多，但创始人控制权稀释明显，市场预期更剧烈。'
  }
};

function companyState() {
  state.investment.company = normalizeCompanyState(state.investment.company);
  return state.investment.company;
}

function wahaFounderPct(company) {
  const c = company || companyState();
  return Math.round((c.founderShares / Math.max(1, c.totalShares)) * 1000) / 10;
}

function launchWahaIpo(planId) {
  const plan = WAHA_IPO_PLANS[planId];
  if (!plan) return;
  const company = companyState();
  if (company.listed) {
    if (typeof showToast === 'function') showToast('娃哈哈已经上市了，后续只能通过二级市场交易。');
    return;
  }
  if (wahaFounderPct(company) < 50) {
    if (typeof showToast === 'function') showToast('创始人持股还没过半，公司还不是你说了算，谈不上上市。');
    return;
  }
  const stock = getStock('WAHA');
  /* 上市定价跟着市场情绪走：狂热的时候投资人愿意多付钱，恐慌的时候
     只愿意打折买——同一个发行方案，挑的时机不同，融到的钱能差出一截。 */
  const sentimentMult = typeof sentimentIpoMultiplier === 'function' ? sentimentIpoMultiplier() : 1;
  const offerPrice = Math.max(1, Math.round(plan.price * sentimentMult));
  company.totalShares = 10000;
  company.publicShares = plan.publicShares;
  company.founderShares = company.totalShares - plan.publicShares;
  company.offerPrice = offerPrice;
  company.offerTarget = plan.target;
  company.ipoDay = marketState.day;
  company.lockupUntilDay = marketState.day + 5;
  company.treasury += plan.publicShares * offerPrice;
  company.listed = true;
  stock.prev = stock.price;
  stock.price = offerPrice;
  stock.history = stock.history.concat([stock.price]).slice(-24);
  const holding = getHolding('WAHA');
  holding.qty += plan.publicShares;
  holding.cost += plan.publicShares * offerPrice;
  setHolding('WAHA', holding);
  state.investment.reputation = Math.max(0, Math.min(100, state.investment.reputation + plan.rep));
  const sentimentNote = sentimentMult > 1.02 ? '（市场情绪火热，定价上浮）' : sentimentMult < 0.98 ? '（市场情绪谨慎，定价打了折）' : '';
  marketState.news.push({
    title: '娃哈哈完成上市：发行给' + plan.target,
    targetStock: 'WAHA',
    isStoryEvent: true,
    impact: plan.shock,
    delay: 0,
    day: marketState.day
  });
  marketState.news = marketState.news.slice(-8);
  if (typeof showMarketFeedback === 'function') {
    showMarketFeedback(plan.publicShares * offerPrice, '上市融资',
      '发行 ' + plan.publicShares + ' 股 · 定价 ' + offerPrice + sentimentNote + ' · 创始人持股 ' + wahaFounderPct(company) + '%', {
        toastLabel: '公司融资 +'
      });
  }
  if (typeof showInvestTipOnce === 'function') {
    setTimeout(() => showInvestTipOnce('ipoConsequence',
      '上市不是终点，是新的约束',
      '从今往后，WAHA 的股价会跟着主线剧情里的经营决定走——广告砸得好、兼并谈得成，股价会涨；决定失误，股价也会跌。持股比例还决定了往后能不能靠"创始人紧急套现"救急。'), 900);
  }
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

/* ---------------- 公司增发 ----------------
   跟"创始人套现"正好相反：卖的是公司新发行的股份，钱进公司账上
   （company.treasury），不是玩家个人腰包。创始人手里的股数没变，
   但总股数变多了，持股比例被动稀释——这才是真正的"上市再融资"。 */
const SECONDARY_OFFERING_TIERS = [.08, .15, .25];

function secondaryOfferingHtml(company, stock) {
  if (!company.listed) return '';
  const sentimentMult = typeof sentimentIpoMultiplier === 'function' ? sentimentIpoMultiplier() : 1;
  const price = Math.max(1, Math.round(stock.price * .94 * sentimentMult));
  const founderPctNow = wahaFounderPct(company);
  const rows = SECONDARY_OFFERING_TIERS.map(frac => {
    const newShares = Math.max(1, Math.round(company.totalShares * frac));
    const raised = newShares * price;
    const totalAfter = company.totalShares + newShares;
    const founderPctAfter = Math.round((company.founderShares / totalAfter) * 1000) / 10;
    return '<div class="founderChoiceRow">' +
      '<b>增发' + Math.round(frac * 100) + '%股本</b>' +
      '<span>公司融资 <em>+' + raised + '</em></span>' +
      '<span>创始人持股 <em>' + founderPctNow + '% → ' + founderPctAfter + '%</em></span>' +
      '<span>新增流通 <em>' + newShares + ' 股</em></span>' +
      '<span>发行价 <em>' + price + '</em></span>' +
      '<button class="ghost founderSaleBtn" data-action="secondaryOffering" data-shares="' + newShares + '">就这么办</button>' +
      '</div>';
  }).join('');
  return '<div class="founderEmergencyBox">' +
    '<p class="founderEmergencyTitle">公司增发 · 钱进公司账上，创始人持股会被稀释：</p>' +
    '<div class="founderChoiceTable">' + rows + '</div>' +
    '</div>';
}

function launchSecondaryOffering(newShares) {
  const company = companyState();
  if (!company.listed) return;
  const shares = Math.max(1, Math.trunc(Number(newShares)) || 0);
  const stock = getStock('WAHA');
  const sentimentMult = typeof sentimentIpoMultiplier === 'function' ? sentimentIpoMultiplier() : 1;
  const price = Math.max(1, Math.round(stock.price * .94 * sentimentMult));
  const raised = shares * price;
  company.totalShares += shares;
  company.publicShares += shares;
  company.treasury += raised;
  stock.pressure -= Math.min(.06, shares / Math.max(1, company.totalShares) * .3);
  if (typeof showMarketFeedback === 'function') {
    showMarketFeedback(raised, '公司增发',
      '新发行 ' + shares + ' 股 · 定价 ' + price + ' · 公司现金 +' + raised + ' · 创始人持股稀释到 ' + wahaFounderPct(company) + '%', {
        toastLabel: '公司融资 +'
      });
  }
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

/* ---------------- 并购 ----------------
   花公司账上的钱，把一家其他上市公司整个买下来——跟"买它的股票"
   完全不同：股票是玩家个人持仓的一部分，并购是公司资产的一部分，
   花的是 company.treasury，买完目标公司直接退市（不能再交易），
   玩家自己手里原本持有的那部分也按收购价一并结清。 */
const ACQUIRE_SHARE_BASE = 10000;
const ACQUIRE_PREMIUM = 1.3;

function acquisitionCost(stock) {
  return Math.round(stock.price * ACQUIRE_SHARE_BASE * ACQUIRE_PREMIUM);
}

function acquisitionTargetsHtml(company) {
  if (!company.listed) return '';
  const targets = STOCKS.filter(item => !item.isPlayerCompany).map(item => getStock(item.id)).filter(s => !s.acquired);
  if (!targets.length) {
    return '<div class="founderEmergencyBox"><p class="founderEmergencyTitle">市面上能并购的公司都已经收入囊中了。</p></div>';
  }
  const rows = targets.map(stock => {
    const cost = acquisitionCost(stock);
    const affordable = company.treasury >= cost;
    return '<div class="founderChoiceRow">' +
      '<b>' + stock.name + '</b>' +
      '<span>并购成本 <em>' + cost + '</em></span>' +
      '<span>当前股价 <em>' + stock.price.toFixed(1) + '</em></span>' +
      '<span>公司现金 <em>' + company.treasury + '</em></span>' +
      '<span></span>' +
      '<button class="ghost founderSaleBtn" data-action="acquireCompany" data-stock="' + stock.id + '"' +
      (affordable ? '' : ' disabled') + '>收购</button>' +
      '</div>';
  }).join('');
  return '<div class="founderEmergencyBox">' +
    '<p class="founderEmergencyTitle">并购 · 溢价' + Math.round((ACQUIRE_PREMIUM - 1) * 100) +
    '%整体买下，目标公司买完直接退市：</p>' +
    '<div class="founderChoiceTable">' + rows + '</div>' +
    '</div>';
}

function acquireCompany(targetId) {
  const company = companyState();
  if (!company.listed) return;
  const target = STOCKS.find(item => item.id === targetId && !item.isPlayerCompany);
  if (!target) return;
  const stock = getStock(targetId);
  if (stock.acquired) {
    if (typeof showToast === 'function') showToast(stock.name + '已经被收购过了');
    return;
  }
  const cost = acquisitionCost(stock);
  if (company.treasury < cost) {
    if (typeof showToast === 'function') showToast('公司现金不够，并购 ' + stock.name + ' 需要 ' + cost);
    return;
  }
  /* 玩家自己手里如果原本就持有这家公司的股票，收购生效时一并按
     当前价格结清——买下整家公司，不能只买公司、剩下玩家自己的仓位。 */
  const holding = getHolding(targetId);
  let payoutNote = '';
  if (holding.qty > 0) {
    const payout = Math.round(holding.qty * stock.price);
    state.coins = Math.min(999999, state.coins + payout);
    setHolding(targetId, { qty: 0, cost: 0 });
    payoutNote = '，你原本持有的 ' + holding.qty + ' 股按市价结清 +' + payout;
  }
  company.treasury -= cost;
  stock.acquired = true;
  company.acquisitions = Array.isArray(company.acquisitions) ? company.acquisitions.concat(target.id) : [target.id];
  /* 每次并购给 WAHA 自己的股价加一点点常驻涨幅——不是一次性的新闻
     冲击（那种几天就衰减没了），是真的写进 advanceMarketDay() 定价
     公式里的持续加成，公司面板里也看得到具体数字。 */
  company.acquisitionDrift = Math.min(.05, (company.acquisitionDrift || 0) + .008);
  marketState.news.push({
    title: '娃哈哈完成并购："' + stock.name + '"并入版图',
    targetStock: 'WAHA',
    isStoryEvent: true,
    impact: .1,
    delay: 0,
    day: marketState.day
  });
  marketState.news = marketState.news.slice(-8);
  if (typeof showMarketFeedback === 'function') {
    showMarketFeedback(-cost, '完成并购',
      '花 ' + cost + ' 金币公司现金收购 ' + stock.name + '，对方退市' + payoutNote, {
        countMilestone: false, toastLabel: '公司现金 -'
      });
  }
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function marketIndexSummary() {
  const tradeStocks = STOCKS.filter(item => !item.isPlayerCompany);
  const diffs = tradeStocks.map(item => {
    const stock = getStock(item.id);
    return (stock.price - stock.prev) / Math.max(1, stock.prev);
  });
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const totalPrice = tradeStocks.reduce((sum, item) => sum + safeMoney(getStock(item.id).price, item.start), 0);
  const index = 1000 * (1 + totalPrice / (tradeStocks.length * 1000));
  const cls = avg >= 0 ? 'up' : 'down';
  return '<div class="dashIndexCard">' +
    '<small>大盘指数 · SIDX</small>' +
    '<strong>' + index.toFixed(2) + '</strong>' +
    '<span class="' + cls + '">' + formatPct(avg) + '</span>' +
    '</div>';
}

function sidebarRows() {
  const rows = STOCKS.filter(item => !item.isPlayerCompany).map(item => {
    const stock = getStock(item.id);
    const diff = stock.price - stock.prev;
    const cls = diff >= 0 ? 'up' : 'down';
    const selected = activeScreen !== 'company' && item.id === marketState.selectedStock;
    if (stock.acquired) {
      return '<button class="dashStockRow acquired' + (selected ? ' on' : '') + '" data-stock="' + item.id + '">' +
        '<span class="dashStockName">' + item.name + '<small>已被娃哈哈收购 · 退市</small></span>' +
        '<span class="dashStockPrice">' + stock.price.toFixed(1) + '</span>' +
        '</button>';
    }
    return '<button class="dashStockRow' + (selected ? ' on' : '') + '" data-stock="' + item.id + '">' +
      '<span class="dashStockName">' + item.name + '<small>' + item.id + '</small></span>' +
      '<span class="dashStockPrice">' + stock.price.toFixed(1) + '<small class="' + cls + '">' + formatPct(diff / Math.max(1, stock.prev)) + '</small></span>' +
      '</button>';
  }).join('');
  const waha = getStock('WAHA');
  const company = companyState();
  return marketIndexSummary() +
    '<button class="dashCompanyRow' + (activeScreen === 'company' ? ' on' : '') + '" data-company="WAHA">' +
    '<span><b>公司上市</b><small>WAHA · ' + (company.listed ? '已上市' : '未上市') + '</small></span>' +
    '<strong>' + waha.price.toFixed(1) + '</strong>' +
    '</button>' +
    rows;
}

/* ---------------- 基本面：三句话看懂一支股票 ----------------
   不做PE/PB/ROE那一套——玩家判断的是"好公司≠好股票"：
   稳定度（波动越小越稳）、增长（最近价格趋势）、估值（现价相对
   "真实价值"V是偏高还是偏低）。V不是从价格倒推出来的，是
   stock.fund 里营收/利润/现金/负债这几个真实变量算出来的
   （见 state.js 的 fairValue()）——消息先改这几个数，再体现到
   估值和股价上，玩家看基本面才是在看"真东西"，不是在看K线的影子。 */
function stockFundamentals(stock) {
  const history = (stock.history || []).slice(-12).filter(Number.isFinite);
  const early = history.length >= 2 ? history[0] : stock.price;
  const growthPct = early ? (stock.price - early) / early : 0;
  let volSum = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1] || 1;
    volSum += Math.abs((history[i] - prev) / prev);
  }
  const avgVol = history.length > 1 ? volSum / (history.length - 1) : 0;
  const stability = Math.max(4, Math.min(100, Math.round(100 - avgVol * 1400)));
  const fv = typeof fairValue === 'function' ? fairValue(stock) : stock.price;
  const ratio = fv ? stock.price / fv : 1;
  const valuationLabel = ratio > 1.12 ? '偏高' : ratio < 0.9 ? '偏低' : '合理';
  return { growthPct, stability, valuationLabel, fairValue: Math.round(fv * 10) / 10 };
}

function fundamentalBar(pct, tone) {
  return '<div class="fundBar"><i style="width:' + Math.max(2, Math.min(100, pct)) + '%;background:' + tone + '"></i></div>';
}

function stockFundamentalsHtml(stock) {
  const f = stockFundamentals(stock);
  const growthPct100 = Math.round(50 + f.growthPct * 250);
  const growthTone = f.growthPct >= 0 ? '#39ff9c' : '#ff5d75';
  const valTone = f.valuationLabel === '偏高' ? '#ff5d75' : f.valuationLabel === '偏低' ? '#39ff9c' : '#ffd666';
  let html = '<div class="stockFundamentals">' +
    '<div class="fundRow"><span>稳定度</span>' + fundamentalBar(f.stability, '#5be6ff') + '<b>' + f.stability + '</b></div>' +
    '<div class="fundRow"><span>近期走势</span>' + fundamentalBar(growthPct100, growthTone) +
    '<b style="color:' + growthTone + '">' + (f.growthPct >= 0 ? '+' : '') + Math.round(f.growthPct * 100) + '%</b></div>' +
    '<div class="fundRow"><span>估值</span><b class="fundValuation" style="color:' + valTone + '">' + f.valuationLabel +
    '（真实价值约 ' + f.fairValue + '）</b></div>' +
    '</div>';
  if (stock.fund) {
    const fu = stock.fund;
    html += '<div class="companyFacts">' +
      '<div class="companyFactRow"><span>营收</span><b>' + Math.round(fu.revenue) + '</b></div>' +
      '<div class="companyFactRow"><span>利润</span><b class="' + (fu.profit >= 0 ? 'up' : 'down') + '">' + Math.round(fu.profit) + '</b></div>' +
      '<div class="companyFactRow"><span>现金</span><b>' + Math.round(fu.cash) + '</b></div>' +
      '<div class="companyFactRow"><span>负债</span><b>' + Math.round(fu.debt) + '</b></div>' +
      '<div class="companyFactRow"><span>增长率</span><b class="' + (fu.growth >= 0 ? 'up' : 'down') + '">' + (fu.growth >= 0 ? '+' : '') + Math.round(fu.growth * 100) + '%</b></div>' +
      '</div>';
  }
  const myVal = stock.playerValuation || 0;
  html += '<div class="myValuationBox">' +
    '<label>你的估值<input type="number" min="0" step="1" id="myValuationInput" value="' + (myVal || '') + '" placeholder="你觉得它值多少？"></label>' +
    '<button type="button" data-action="setValuation" data-stock="' + stock.id + '">记下判断</button>' +
    (myVal ? '<p class="myValuationNote">你觉得值 <b>' + myVal + '</b>，市场价 <b>' + Math.round(stock.price) + '</b> —— ' +
      (myVal > stock.price ? '你认为被低估了' : myVal < stock.price ? '你认为被高估了' : '你觉得价格公道') + '</p>' : '') +
    '</div>';
  return html;
}

function marginPanelHtml() {
  const debt = marginDebt();
  const limit = marginBorrowLimit();
  const equity = Math.round(portfolioEquity());
  const callLine = Math.round(debt * MARGIN_CALL_RATIO);
  if (!debt && !limit) return '';
  return '<div class="dashMarginBox' + (debt ? ' danger' : '') + '">' +
    '<div class="dashMarginRow"><span>融资欠款</span><strong>' + debt + '</strong></div>' +
    '<div class="dashMarginRow"><span>剩余融资额度</span><strong>' + limit + '</strong></div>' +
    (debt ? '<div class="dashMarginRow"><span>当前权益（现金+持仓-欠款）</span><strong class="' + (equity >= callLine * 1.3 ? 'up' : 'down') + '">' + equity + '</strong></div>' +
      '<div class="dashMarginRow"><span>强平线（欠款×30%）</span><strong>' + callLine + '</strong></div>' +
      '<p class="dashRumorHint warn">每天按 ' + Math.round(MARGIN_INTEREST_RATE * 1000) / 10 + '% 计利息，权益跌破强平线会被强制平仓。</p>' +
      '<div class="dashTradeActions dashTradeActionsWrap">' +
      [Math.min(debt, 100), Math.min(debt, 500), debt].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).map(n =>
        '<button class="ghost" data-action="repayMargin" data-amount="' + n + '"' + (state.coins >= n ? '' : ' disabled') + '>还 ' + n + '</button>'
      ).join('') +
      '</div>' : '') +
    '</div>';
}

function tradePanelHtml(stock) {
  if (stock.id === 'WAHA') return wahaCompanyPanelHtml(stock);
  if (stock.acquired) {
    return '<div class="dashTradeHead"><h3>' + stock.name + '</h3><p>已经被娃哈哈整体收购，退市了，不能再交易。</p></div>';
  }
  if (typeof showInvestTipOnce === 'function') {
    showInvestTipOnce('fundamentals',
      '看基本面，不是只看涨跌',
      '稳定度低、走势乱涨的股票，价格常常已经"偏高"——好公司不等于好股票。买之前，把"稳定度/近期走势/估值"三行都扫一眼。');
    showInvestTipOnce('sentiment',
      '市场情绪会偷偷改变你的判断',
      '头顶那行"市场 XX"是整体情绪——狂热的时候人人觉得会涨，容易追高；恐慌的时候人人想跑，容易错杀好东西。情绪不是事实，只是别人的情绪。');
  }
  const holding = getHolding(stock.id);
  const short = getShort(stock.id);
  const avg = holding.qty ? Math.round(holding.cost / holding.qty) : 0;
  const value = holding.qty * stock.price;
  const shortAvg = short.qty ? Math.round(short.entryValue / short.qty) : 0;
  const shortPnl = short.qty ? Math.round(short.entryValue - short.qty * stock.price) : 0;
  const buyCost = Math.ceil(stock.price);
  const canBuy = state.coins >= buyCost;
  const canSell = holding.qty > 0;
  const canShort = shortExposure() + Math.floor(stock.price) <= shortLimit();
  const canCover = short.qty > 0 && state.coins >= Math.ceil(stock.price);
  const TRADE_TIERS = [1, 5, 20, 50];
  const buyBtns = TRADE_TIERS.map(n =>
    '<button data-action="buy" data-stock="' + stock.id + '" data-qty="' + n + '"' + (state.coins >= buyCost * n ? '' : ' disabled') + '>买 ' + n + '</button>'
  ).join('');
  const marginLimit = marginBorrowLimit();
  const marginBtns = TRADE_TIERS.map(n => {
    const cost = buyCost * n;
    const borrowNeeded = Math.max(0, cost - state.coins);
    return '<button class="margin" data-action="marginBuy" data-stock="' + stock.id + '" data-qty="' + n + '"' +
      (borrowNeeded <= marginLimit ? '' : ' disabled') + '>融资买 ' + n + '</button>';
  }).join('');
  const sellBtns = TRADE_TIERS.map(n =>
    '<button class="ghost" data-action="sell" data-stock="' + stock.id + '" data-qty="' + n + '"' + (holding.qty >= n ? '' : ' disabled') + '>卖 ' + n + '</button>'
  ).join('') + '<button class="ghost" data-action="sell" data-stock="' + stock.id + '" data-qty="999999"' + (canSell ? '' : ' disabled') + '>清仓</button>';
  const shortBtns = TRADE_TIERS.map(n =>
    '<button class="short" data-action="short" data-stock="' + stock.id + '" data-qty="' + n + '"' + (shortExposure() + Math.floor(stock.price) * n <= shortLimit() ? '' : ' disabled') + '>做空 ' + n + '</button>'
  ).join('');
  const coverBtns = TRADE_TIERS.map(n =>
    '<button class="ghost" data-action="cover" data-stock="' + stock.id + '" data-qty="' + n + '"' + (short.qty >= n && state.coins >= buyCost * n ? '' : ' disabled') + '>平仓 ' + n + '</button>'
  ).join('') + '<button class="ghost" data-action="cover" data-stock="' + stock.id + '" data-qty="999999"' + (canCover ? '' : ' disabled') + '>全平</button>';
  return '<div class="dashTradeHead"><h3>' + stock.name + '</h3><p>' + stock.id + ' · 持有 ' + holding.qty + ' 股' +
    (short.qty ? ' · 空单 ' + short.qty + ' 股' : '') + '</p></div>' +
    stockFundamentalsHtml(stock) +
    (!canBuy ? '<p class="dashRumorHint warn">金币不够，买 1 股需要 ' + buyCost + ' 金币</p>' : '') +
    '<div class="dashTradeActions dashTradeActionsWrap">' + buyBtns + '</div>' +
    '<div class="dashTradeActions dashTradeActionsWrap">' + sellBtns + '</div>' +
    '<div class="dashTradeActions dashTradeActionsWrap">' + shortBtns + '</div>' +
    '<div class="dashTradeActions dashTradeActionsWrap">' + coverBtns + '</div>' +
    '<div class="dashTradeActions dashTradeActionsWrap">' + marginBtns + '</div>' +
    marginPanelHtml() +
    '<div class="dashTradeInfo">' +
    '<div><span>现金</span><strong>' + state.coins + '</strong></div>' +
    '<div><span>持仓成本均价</span><strong>' + avg + '</strong></div>' +
    '<div><span>持仓市值</span><strong>' + Math.round(value) + '</strong></div>' +
    (short.qty ? '<div><span>空单均价</span><strong>' + shortAvg + '</strong></div>' +
      '<div><span>空单浮动盈亏</span><strong class="' + (shortPnl >= 0 ? 'up' : 'down') + '">' + (shortPnl >= 0 ? '+' : '') + shortPnl + '</strong></div>' : '') +
    '<div><span>可用做空额度</span><strong>' + Math.max(0, shortLimit() - shortExposure()) + '</strong></div>' +
    '<div><span>声誉</span><strong>' + reputation() + '</strong></div>' +
    '</div>' +
    rumorPanelHtml(stock) +
    '<button class="dashNextDay" data-action="nextDay">下一交易日 · Day ' + (marketState.day + 1) + '</button>';
}

function wahaCompanyPanelHtml(stock) {
  const company = companyState();
  const holding = getHolding('WAHA');
  const founderPctNow = wahaFounderPct(company);
  if (!company.listed && founderPctNow < 50) {
    return '<div class="dashTradeHead"><h3>还没拿到控制权</h3>' +
      '<p>娃哈哈现在不是你说了算——创始人持股只有 <b>' + founderPctNow + '%</b>，过半才能决定要不要上市融资。</p></div>' +
      '<div class="dashTradeInfo">' +
      '<div><span>创始人持股</span><strong>' + founderPctNow + '%</strong></div>' +
      '<div><span>还差多少过半</span><strong>' + Math.max(0, Math.round((50 - founderPctNow) * 100) / 100) + '%</strong></div>' +
      '</div>' +
      '<p class="dashRumorHint">日子里偶尔会有人主动找上门，愿意把手里的原始股折价转让——留意小屋里弹出的"融资请求"。</p>' +
      '<button class="dashNextDay" data-action="nextDay">下一交易日 · Day ' + (marketState.day + 1) + '</button>';
  }
  if (!company.listed) {
    const sentiment = typeof marketSentimentLabel === 'function' ? marketSentimentLabel() : { label: '平稳' };
    const sentimentMult = typeof sentimentIpoMultiplier === 'function' ? sentimentIpoMultiplier() : 1;
    if (typeof showInvestTipOnce === 'function') {
      showInvestTipOnce('ipoTradeoff',
        '卖多少股，是真正的取舍',
        '少卖股票融资就少，但你保得住控制权、股价也更稳；多卖股票能拿到更多钱，但公司往后就不完全是你说了算。选之前想清楚：这笔钱是要解决眼下的现金流，还是想换更快的扩张速度？');
    }
    return '<div class="dashTradeHead"><h3>上市方案</h3><p>选择这次把多少股、以什么价格卖给谁——当前市场情绪：' + sentiment.label + '，定价已按情绪调整。</p></div>' +
      '<div class="wahaIpoBox">' +
      Object.keys(WAHA_IPO_PLANS).map(id => {
        const plan = WAHA_IPO_PLANS[id];
        const adjPrice = Math.max(1, Math.round(plan.price * sentimentMult));
        const founderPct = Math.round(((10000 - plan.publicShares) / 10000) * 1000) / 10;
        return '<button type="button" class="wahaIpoPlan" data-action="wahaIpo" data-plan="' + id + '" data-stock="WAHA">' +
          '<b>' + plan.label + '</b>' +
          '<span>卖出 ' + plan.publicShares + ' 股 · 每股 ' + adjPrice + ' · 融资 ' + (plan.publicShares * adjPrice) + '</span>' +
          '<small>上市后你持股 ' + founderPct + '%</small>' +
          '</button>';
      }).join('') +
      '</div>' +
      '<button class="dashNextDay" data-action="nextDay">下一交易日 · Day ' + (marketState.day + 1) + '</button>';
  }
  const founderPct = wahaFounderPct(company);
  const canSell = holding.qty > 0;
  const canBuy = state.coins >= Math.ceil(stock.price);
  return '<div class="dashTradeHead"><h3>公开股交易</h3><p>创始人股保留控制权，公开股可买卖。</p></div>' +
    '<div class="dashTradeInfo">' +
    '<div><span>创始人持股</span><strong>' + founderPct + '%</strong></div>' +
    '<div><span>公开持仓</span><strong>' + holding.qty + ' 股</strong></div>' +
    '<div><span>公司现金</span><strong>' + company.treasury + '</strong></div>' +
    '</div>' +
    '<div class="dashTradeActions">' +
    '<button data-action="buy" data-stock="WAHA"' + (canBuy ? '' : ' disabled') + '>增持公开股 1</button>' +
    '<button class="ghost" data-action="sell" data-stock="WAHA"' + (canSell ? '' : ' disabled') + '>卖公开股 1</button>' +
    '</div>' +
    founderEmergencySaleHtml(company, stock) +
    secondaryOfferingHtml(company, stock) +
    acquisitionTargetsHtml(company) +
    '<button class="dashNextDay" data-action="nextDay">下一交易日 · Day ' + (marketState.day + 1) + '</button>';
}

/* ---------------- 创始人紧急套现 ----------------
   跟"上市融资"不一样：那笔钱进的是公司账（company.treasury），
   这里卖的是创始人自己手里的股份，钱直接进玩家个人钱包（state.coins，
   跟主游戏的 cabinCoins 共享同一个存档字段），专门用来在主游戏那边
   现金流告急的时候，能有个"卖点身家换现金"的真实去处。折价出手，
   还会让股价承压——套现不是没有代价的。 */
const FOUNDER_EMERGENCY_TIERS = [0.05, 0.1, 0.2];
const FOUNDER_EMERGENCY_DISCOUNT = 0.08;

function founderControlRiskLabel(pct) {
    if (pct >= 67) return { label: '绝对控制', tone: '#39ff9c' };
    if (pct >= 51) return { label: '相对安全', tone: '#8fd3e6' };
    if (pct >= 34) return { label: '有被联合否决的风险', tone: '#ffd666' };
    return { label: '控制权已经不在你手上', tone: '#ff5d75' };
}

function founderEmergencySaleHtml(company, stock) {
    if (!company.listed) return '';
    if (typeof showInvestTipOnce === 'function') {
        showInvestTipOnce('founderSale',
            '这是一个真正的创业者决策，不是"哪个选项数字大选哪个"',
            '卖股权换现金，钱进你个人腰包，公司账上不会多一分钱——但创始人持股是真的会降下去。持股比例掉到一定线以下，别人联手就能在重大决策上压过你。先看完三个选项的完整后果再决定。');
    }
    const price = Math.max(1, Math.round(stock.price * (1 - FOUNDER_EMERGENCY_DISCOUNT)));
    const founderPctNow = wahaFounderPct(company);
    const rows = [{ frac: 0, label: '不套现' }].concat(FOUNDER_EMERGENCY_TIERS.map(frac => ({ frac, label: '套现' + Math.round(frac * 100) + '%股权' })));
    const body = rows.map(row => {
        if (row.frac === 0) {
            const risk = founderControlRiskLabel(founderPctNow);
            return '<div class="founderChoiceRow">' +
                '<b>' + row.label + '</b>' +
                '<span>到手现金 <em>+0</em></span>' +
                '<span>创始人持股 <em>' + founderPctNow + '%</em></span>' +
                '<span>控制权 <em style="color:' + risk.tone + '">' + risk.label + '</em></span>' +
                '<span>市场信心 <em>不受影响</em></span>' +
                '</div>';
        }
        const shares = Math.max(1, Math.round(company.totalShares * row.frac));
        const affordable = shares <= company.founderShares;
        const proceeds = shares * price;
        const founderPctAfter = Math.round(((company.founderShares - shares) / Math.max(1, company.totalShares)) * 1000) / 10;
        const risk = founderControlRiskLabel(founderPctAfter);
        const pressureNote = row.frac >= .2 ? '明显承压' : (row.frac >= .1 ? '略微承压' : '几乎不受影响');
        return '<div class="founderChoiceRow">' +
            '<b>' + row.label + '</b>' +
            '<span>到手现金 <em>+' + proceeds + '</em></span>' +
            '<span>创始人持股 <em>' + founderPctAfter + '%</em></span>' +
            '<span>控制权 <em style="color:' + risk.tone + '">' + risk.label + '</em></span>' +
            '<span>市场信心 <em>' + pressureNote + '</em></span>' +
            '<button class="ghost founderSaleBtn" data-action="founderSale" data-shares="' + shares + '"' +
            (affordable ? '' : ' disabled') + '>就这么办</button>' +
            '</div>';
    }).join('');
    return '<div class="founderEmergencyBox">' +
        '<p class="founderEmergencyTitle">创始人套现决策 · 折价 ' + Math.round(FOUNDER_EMERGENCY_DISCOUNT * 100) +
        '% 出手，四个选项完整后果对比：</p>' +
        '<div class="founderChoiceTable">' + body + '</div>' +
        '</div>';
}

function founderEmergencySale(shares) {
    const company = companyState();
    if (!company.listed) return;
    const qty = Math.max(1, Math.trunc(Number(shares)) || 0);
    if (qty > company.founderShares) {
        if (typeof showToast === 'function') showToast('创始人股不够卖这么多');
        return;
    }
    const stock = getStock('WAHA');
    const price = Math.max(1, Math.round(stock.price * (1 - FOUNDER_EMERGENCY_DISCOUNT)));
    const proceeds = qty * price;
    company.founderShares -= qty;
    company.publicShares += qty;
    state.coins = Math.min(999999, state.coins + proceeds);
    stock.pressure -= .02;
    if (typeof showMarketFeedback === 'function') {
        showMarketFeedback(proceeds, '创始人紧急套现',
            '卖出 ' + qty + ' 股创始人股（折价出手）· 个人现金 +' + proceeds + ' · 创始人持股降到 ' + wahaFounderPct(company) + '%', {
                toastLabel: '个人现金 +'
            });
    }
    redrawScreens();
    renderScreenPanel(activeScreen);
    saveState();
}

function wahaCompanyDashboardHtml(stock) {
  const company = companyState();
  const founderPct = wahaFounderPct(company);
  const holding = getHolding('WAHA');
  const publicPct = Math.round((company.publicShares / Math.max(1, company.totalShares)) * 1000) / 10;
  const status = company.listed ? '已上市' : '未上市';
  const controlClass = founderPct >= 67 ? 'strong' : founderPct >= 51 ? 'watch' : 'risk';
  const nextStep = company.listed
    ? '后续主线里的广告、兼并、渠道选择，会继续影响 WAHA 股价。'
    : (founderPct >= 50
      ? '先在右侧选择上市方案：决定卖给谁、卖多少股、定什么价格。'
      : '创始人持股还没过半，先想办法把股份攒够——留意小屋里弹出的"融资请求"。');
  return '<div class="wahaDashboard">' +
    '<section class="wahaHero">' +
    '<p>FOUNDER COMPANY</p><h3>娃哈哈</h3><span>' + status + ' · 创始人公司</span>' +
    '</section>' +
    controlEventHtml(company) +
    '<section class="wahaMetrics">' +
    '<div><small>创始人</small><strong class="' + controlClass + '">' + founderPct + '%</strong></div>' +
    '<div><small>公开流通</small><strong>' + publicPct + '%</strong></div>' +
    '<div><small>公司现金</small><strong>' + company.treasury + '</strong></div>' +
    '<div><small>你的公开股</small><strong>' + holding.qty + '</strong></div>' +
    '</section>' +
    '<section class="wahaEquity">' +
    '<div class="wahaEquityBar"><i style="width:' + founderPct + '%"></i><em style="width:' + publicPct + '%"></em></div>' +
    '<div class="wahaEquityLegend"><span>创始人股 ' + company.founderShares + '</span><span>公开股 ' + company.publicShares + '</span></div>' +
    '</section>' +
    '<p class="wahaNextStep">' + nextStep + '</p>' +
    (company.acquisitions.length
      ? '<section class="wahaAcquired"><small>已收购 · 并购加成每日 +' + Math.round((company.acquisitionDrift || 0) * 1000) / 10 + '%</small><strong>' +
        company.acquisitions.map(id => { const s = STOCKS.find(item => item.id === id); return s ? s.name : id; }).join(' · ') +
        '</strong></section>'
      : '') +
    '</div>';
}

/* ---------------- 控制权事件 ----------------
   创始人持股跌破关键线之后，advanceMarketDay() 会按概率往
   company.pendingControlEvent 里挂一件事——不再是风险标签自己说说
   而已，是真的会打断玩家、要求做一次选择。 */
function controlEventHtml(company) {
  const evt = company.pendingControlEvent;
  if (!evt) return '';
  if (evt.type === 'veto') {
    return '<div class="founderEmergencyBox">' +
      '<p class="founderEmergencyTitle">董事会否决</p>' +
      '<p class="dashRumorHint warn">持股不过半，你说了不算——董事会这次直接把你的一项提案给否了，声誉受损。</p>' +
      '<div class="dashTradeActions"><button class="ghost founderSaleBtn" data-action="resolveControlEvent" data-choice="ack">认了</button></div>' +
      '</div>';
  }
  const stock = getStock('WAHA');
  const price = Math.max(1, Math.round(stock.price * 1.15));
  const cost = evt.shares * price;
  const affordable = state.coins >= cost;
  return '<div class="founderEmergencyBox">' +
    '<p class="founderEmergencyTitle">恶意收购警报 · 有人在场外悄悄扫货，想拿下公司</p>' +
    '<div class="founderChoiceTable">' +
    '<div class="founderChoiceRow">' +
    '<b>买回股份守住控制权</b>' +
    '<span>需要 <em>' + evt.shares + '</em> 股</span>' +
    '<span>溢价 <em>15%</em> · 每股 <em>' + price + '</em></span>' +
    '<span>花费 <em>' + cost + '</em></span>' +
    '<button class="ghost founderSaleBtn" data-action="resolveControlEvent" data-choice="defend"' +
    (affordable ? '' : ' disabled') + '>就这么办</button>' +
    '</div>' +
    '<div class="founderChoiceRow">' +
    '<b>不管它，赌一把</b>' +
    '<span>不花钱</span>' +
    '<span>声誉会掉</span>' +
    '<span>外部资本话语权变大</span>' +
    '<button class="ghost founderSaleBtn" data-action="resolveControlEvent" data-choice="ignore">不管了</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function resolveControlEvent(choice) {
  const company = companyState();
  const evt = company.pendingControlEvent;
  if (!evt) return;
  if (evt.type === 'veto') {
    company.pendingControlEvent = null;
    state.investment.reputation = Math.max(0, state.investment.reputation - 3);
    if (typeof showMarketFeedback === 'function') {
      showMarketFeedback(0, '董事会否决', '一项提案被董事会否了 · 声誉 -3', { countMilestone: false });
    }
  } else if (evt.type === 'hostile') {
    const stock = getStock('WAHA');
    if (choice === 'defend') {
      const price = Math.max(1, Math.round(stock.price * 1.15));
      const cost = evt.shares * price;
      if (state.coins < cost) {
        if (typeof showToast === 'function') showToast('金币不够，买不回这些股份');
        return;
      }
      state.coins -= cost;
      company.publicShares = Math.max(0, company.publicShares - evt.shares);
      company.founderShares = Math.min(company.totalShares, company.founderShares + evt.shares);
      company.pendingControlEvent = null;
      if (typeof showMarketFeedback === 'function') {
        showMarketFeedback(-cost, '守住控制权',
          '溢价买回 ' + evt.shares + ' 股 · 花费 ' + cost + ' · 创始人持股回到 ' + wahaFounderPct(company) + '%', {
            toastLabel: '个人现金 -'
          });
      }
    } else {
      company.pendingControlEvent = null;
      state.investment.reputation = Math.max(0, state.investment.reputation - 8);
      if (typeof showMarketFeedback === 'function') {
        showMarketFeedback(0, '控制权旁落', '你没有出手，外部资本拿到了更多话语权 · 声誉 -8', { countMilestone: false });
      }
    }
  }
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function rumorPanelHtml(stock) {
  if (stock.id === 'WAHA') return '';
  const canRumor = canSpreadRumor();
  const cost = rumorCost();
  const affordable = state.coins >= cost;
  const disabled = !canRumor || !affordable;
  const hint = !canRumor ? '今天已经放过一条消息了' : (!affordable ? '金币不够（需要 ' + cost + '）' : '花 ' + cost + ' 金币放一条消息，隔天生效，可能被揭穿');
  return '<div class="dashRumor">' +
    '<p class="dashRumorHint' + (disabled ? ' warn' : '') + '">' + hint + '</p>' +
    '<div class="dashTradeActions">' +
    '<button class="rumor" data-action="rumorGood" data-stock="' + stock.id + '"' + (disabled ? ' disabled' : '') + '>散布利好</button>' +
    '<button class="rumor ghost" data-action="rumorBad" data-stock="' + stock.id + '"' + (disabled ? ' disabled' : '') + '>散布利空</button>' +
    '</div>' +
    '</div>';
}

function holdingsPanelHtml() {
  const tradeStocks = STOCKS.filter(item => !item.isPlayerCompany);
  const longRows = tradeStocks.filter(item => getHolding(item.id).qty > 0);
  const shortRows = tradeStocks.filter(item => getShort(item.id).qty > 0);
  if (!longRows.length && !shortRows.length) return '<h3>我的持仓</h3><p class="dashEmpty">还没有持仓，去买点股票吧。</p>';
  const header = '<div class="dashHoldingRow dashHoldingRow--head">' +
    '<span>标的</span><span>数量</span><span>均价</span><span>现价</span><span>盈亏</span>' +
    '</div>';
  const longBody = longRows.map(item => {
    const stock = getStock(item.id);
    const holding = getHolding(item.id);
    const avg = holding.qty ? holding.cost / holding.qty : 0;
    const value = holding.qty * stock.price;
    const profit = value - holding.cost;
    const cls = profit >= 0 ? 'up' : 'down';
    return '<div class="dashHoldingRow">' +
      '<span>' + item.name + '</span><span>' + holding.qty + '</span>' +
      '<span>' + avg.toFixed(1) + '</span><span>' + stock.price.toFixed(1) + '</span>' +
      '<span class="' + cls + '">' + (profit >= 0 ? '+' : '') + Math.round(profit) + '</span>' +
      '</div>';
  }).join('');
  const shortBody = shortRows.map(item => {
    const stock = getStock(item.id);
    const short = getShort(item.id);
    const avg = short.qty ? short.entryValue / short.qty : 0;
    const profit = short.entryValue - short.qty * stock.price;
    const cls = profit >= 0 ? 'up' : 'down';
    return '<div class="dashHoldingRow dashHoldingRow--short">' +
      '<span>[空] ' + item.name + '</span><span>' + short.qty + '</span>' +
      '<span>' + avg.toFixed(1) + '</span><span>' + stock.price.toFixed(1) + '</span>' +
      '<span class="' + cls + '">' + (profit >= 0 ? '+' : '') + Math.round(profit) + '</span>' +
      '</div>';
  }).join('');
  return '<h3>我的持仓</h3>' + header + longBody + shortBody;
}

function retroCardHtml() {
  const retro = state.investment.lastRetro;
  if (!retro || retro.seen) return '';
  const pnlTone = retro.pnl >= 0 ? '#39ff9c' : '#ff5d75';
  const repTone = retro.repDelta >= 0 ? '#39ff9c' : '#ff5d75';
  const total = retro.confirmed + retro.debunked;
  const hitRate = total ? Math.round((retro.confirmed / total) * 100) : null;
  const hitNote = hitRate === null
    ? '这周没有消息进入验证'
    : '这周信过的消息里，' + hitRate + '% 最终证实是真的（' + retro.confirmed + ' 真 / ' + retro.debunked + ' 假）';
  const tradeCount = retro.tradeCount || 0;
  const tradeNote = tradeCount >= 15
    ? '这周下单 ' + tradeCount + ' 次，手有点痒——频繁进出，手续费和踏空的风险都在悄悄吃你的收益。'
    : tradeCount === 0
      ? '这周一次都没动——是稳得住，还是错过了机会，自己心里有数。'
      : '这周下单 ' + tradeCount + ' 次，节奏还算正常。';
  const concentrationPct = retro.concentrationPct || 0;
  const concentrationNote = concentrationPct >= 70
    ? '有 ' + concentrationPct + '% 的仓位压在一支股票上——赌对了翻倍，赌错了直接伤筋动骨。'
    : concentrationPct >= 40
      ? '最大的一支股票占了 ' + concentrationPct + '% 的仓位，集中度偏高，多留意它的风吹草动。'
      : '仓位分得比较散（最大一支占 ' + concentrationPct + '%），稳，但也很难靠一支股票翻身。';
  return '<div class="retroCard">' +
    '<p class="retroTitle">📋 第 ' + (retro.day - 7) + '～' + retro.day + ' 天投资复盘</p>' +
    '<div class="retroRow"><span>总资产</span><b style="color:' + pnlTone + '">' + retro.startEquity + ' → ' + retro.endEquity +
    '（' + (retro.pnl >= 0 ? '+' : '') + retro.pnl + ' · ' + formatPct(retro.pnlPct) + '）</b></div>' +
    '<div class="retroRow"><span>声誉变化</span><b style="color:' + repTone + '">' + (retro.repDelta >= 0 ? '+' : '') + retro.repDelta + '</b></div>' +
    '<div class="retroRow"><span>判断质量</span><b>' + hitNote + '</b></div>' +
    '<div class="retroRow"><span>交易习惯</span><b>' + tradeNote + '</b></div>' +
    '<div class="retroRow"><span>仓位集中度</span><b>' + concentrationNote + '</b></div>' +
    '<button class="ghost retroDismissBtn" data-action="dismissRetro">知道了</button>' +
    '</div>';
}

function newsPanelHtml() {
  const rows = marketState.news.slice(-6).reverse().map(news => {
    if (news.isStoryPending) {
      return '<div class="dashNewsRow"><b>' + news.title + '</b>' +
        '<span>WAHA · 预计延迟 ' + news.delay + ' 个交易日</span></div>';
    }
    if (news.isStoryEvent) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>' + news.title + '</b>' +
        '<span class="' + (news.impact >= 0 ? 'up' : 'down') + '">公司事件 · 已反映在股价</span></div>';
    }
    if (news.isEvent) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>⚡ ' + news.title + '</b>' +
        '<span class="' + (news.bad ? 'down' : 'up') + '">突发事件 · 立即生效</span></div>';
    }
    if (news.isEarningsPending) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>📅 ' + news.title + '</b>' +
        '<span>财报预告 · 明日揭晓</span></div>';
    }
    if (news.isEarnings) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>📊 ' + news.title + '</b>' +
        '<span class="' + (news.bad ? 'down' : 'up') + '">财报公布 · 已反映在股价</span></div>';
    }
    if (news.isExposeNotice) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>📢 ' + news.title + '</b>' +
        '<span class="down">造谣者声誉受损</span></div>';
    }
    if (news.isPlayerRumor) {
      const status = !news.resolved ? '尚未验证 · 明日揭晓' : (news.exposed ? '已被揭穿' : '悄悄生效了');
      const tone = !news.resolved ? '#c58bff' : (news.exposed ? '#ff5d75' : '#39ff9c');
      return '<div class="dashNewsRow dashNewsRow--rumor"><b>🤫 ' + news.title + '</b>' +
        '<span style="color:' + tone + '">你散布的消息 · ' + status + '</span></div>';
    }
    const src = NEWS_SOURCES.find(s => s.id === news.source) || NEWS_SOURCES[0];
    let verifyTag = '';
    if (news.verified === false) {
      verifyTag = ' · <span style="color:#c58bff">待验证 · Day ' + news.verifyDay + ' 揭晓</span>';
    } else if (news.verified === true) {
      verifyTag = news.verifyOutcome
        ? ' · <span style="color:#39ff9c">已证实</span>'
        : ' · <span style="color:#ff5d75">已证伪，价格已回调</span>';
    }
    return '<div class="dashNewsRow"><b>' + news.title + '</b>' +
      news.targetStock + ' · 延迟 ' + news.delay + ' 天 · ' +
      '<span style="color:' + src.tone + '">' + src.label + '</span>' + verifyTag + '</div>';
  }).join('');
  return '<h3>财经资讯</h3>' + rows;
}

function drawLineChart(canvas, stock) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(200, Math.round(rect.width));
  const h = Math.max(120, Math.round(rect.height));
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#fffefa';
  ctx.fillRect(0, 0, w, h);

  const padL = 54;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const cleanStock = sanitizeStock(stock, stock && stock.id);
  const history = cleanStock.history.slice(-24);
  let min = Math.min(...history);
  let max = Math.max(...history);
  if (max - min < Math.max(1, cleanStock.price * 0.03)) {
    const mid = (max + min) / 2;
    const pad = Math.max(1, mid * 0.04);
    min = mid - pad;
    max = mid + pad;
  }
  const span = Math.max(1, max - min);
  const up = history[history.length - 1] >= history[0];
  const tone = up ? '#2f9e5c' : '#d1503f';

  ctx.strokeStyle = 'rgba(58,47,34,.12)';
  ctx.lineWidth = 1;
  ctx.font = '11px "Songti SC","PingFang SC",serif';
  ctx.fillStyle = '#8a7a5c';
  for (let i = 0; i <= 4; i++) {
    const y = padT + plotH * (i / 4);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    const value = max - span * (i / 4);
    ctx.fillText(value.toFixed(1), 6, y + 4);
  }

  const points = history.map((value, i) => [
    padL + (plotW * i) / Math.max(1, history.length - 1),
    padT + plotH - ((value - min) / span) * plotH
  ]);

  const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  areaGrad.addColorStop(0, up ? 'rgba(47,158,92,.16)' : 'rgba(209,80,63,.16)');
  areaGrad.addColorStop(1, 'rgba(209,80,63,0)');
  ctx.beginPath();
  ctx.moveTo(points[0][0], padT + plotH);
  points.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(points[points.length - 1][0], padT + plotH);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.strokeStyle = tone;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.fillStyle = tone;
  ctx.arc(last[0], last[1], 4, 0, Math.PI * 2);
  ctx.fill();
}

function renderScreenPanel(key) {
  activeScreen = key || activeScreen;
  if (marketState.selectedStock === 'WAHA') {
    activeScreen = 'company';
    marketState.selectedStock = 'TEA';
  }
  screenPanel.hidden = false;
  if (typeof maybeAutoShowMarketGuide === 'function') maybeAutoShowMarketGuide();
  state.coins = Math.trunc(safeMoney(state.coins, 100));
  const isCompanyPage = activeScreen === 'company';
  if (isCompanyPage && !state.investment.wahaCompanyViewed) {
    state.investment.wahaCompanyViewed = true;
    saveState();
  }
  const stock = safeStockForTrade(isCompanyPage ? 'WAHA' : marketState.selectedStock);
  const pnl = investmentPnlSummary();
  dashClock.textContent = 'DAY ' + marketState.day;
  dashRep.textContent = '声誉 ' + reputation();
  dashRep.className = 'dashRep ' + (reputation() >= 60 ? 'up' : reputation() <= 30 ? 'down' : '');
  if (dashSentiment && typeof marketSentimentLabel === 'function') {
    const sentiment = marketSentimentLabel();
    dashSentiment.textContent = '市场 ' + sentiment.label;
    dashSentiment.style.color = sentiment.tone;
  }
  dashSidebar.innerHTML = sidebarRows();
  dashBody.classList.toggle('wahaMode', isCompanyPage);
  dashBody.classList.toggle('companyMode', isCompanyPage);
  const diff = stock.price - stock.prev;
  dashMainHead.innerHTML = '<h3>' + stock.name + '</h3>' +
    '<span class="dashPrice ' + (diff >= 0 ? 'up' : 'down') + '">' + stock.price.toFixed(1) + '</span>' +
    '<small class="' + (diff >= 0 ? 'up' : 'down') + '">' + formatPct(diff / Math.max(1, stock.prev)) + '</small>' +
    '<span class="dashPnlPulse ' + (pnl.totalPnl >= 0 ? 'up' : 'down') + '">总盈亏 ' + (pnl.totalPnl >= 0 ? '+' : '') + pnl.totalPnl + '</span>';
  dashTrade.innerHTML = tradePanelHtml(stock);
  dashHoldings.innerHTML = holdingsPanelHtml();
  dashNews.innerHTML = retroCardHtml() + newsPanelHtml();
  const canvas = document.getElementById('chartCanvas');
  if (isCompanyPage) {
    if (canvas) canvas.style.display = 'none';
    const existing = document.getElementById('wahaCompanyDashboard');
    if (existing) existing.remove();
    const panel = document.createElement('div');
    panel.id = 'wahaCompanyDashboard';
    panel.innerHTML = wahaCompanyDashboardHtml(stock);
    document.querySelector('.dashMain')?.appendChild(panel);
  } else {
    const existing = document.getElementById('wahaCompanyDashboard');
    if (existing) existing.remove();
    if (canvas) {
      canvas.style.display = '';
      drawLineChart(canvas, stock);
    }
  }
}

document.getElementById('returnGame').addEventListener('click', () => {
  saveState();
  window.location.href = '../game.html?from=store';
});
