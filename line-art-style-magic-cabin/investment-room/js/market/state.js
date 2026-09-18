const SESSION_KEY = 'magicCabin.session.v1';
const GUEST_ID = 'guest';
const SAVE_SCHEMA = 1;
const CONTENT_ID = 'magic-cabin-local-2026';
const state = { coins: 2600, investment: { jobLevel: 1, lastSalaryDay: -1, totalWages: 0, realizedGain: 0, realizedLoss: 0, reputation: 60, lastRumorDay: -1, lastCoffeeDay: -1, marginDebt: 0, holdings: {}, shorts: {}, company: null }, save: null };
const screenPanel = document.getElementById('screenPanel');
const dashClock = document.getElementById('dashClock');
const dashRep = document.getElementById('dashRep');
const dashSentiment = document.getElementById('dashSentiment');
const dashSidebar = document.getElementById('dashSidebar');
const dashMainHead = document.getElementById('dashMainHead');
const dashTrade = document.getElementById('dashTrade');
const dashHoldings = document.getElementById('dashHoldings');
const dashNews = document.getElementById('dashNews');
const dashBody = document.querySelector('.dashBody');
const closeScreenPanel = document.getElementById('closeScreenPanel');
const screenMeshes = [];
const screenTextures = [];
/* 股价再往上调一轮（大约再 ×1.7），起始资金从1200提到2600，配合新加
   的50股批量交易和融资杠杆，"股市是主要玩法"这件事在金额上要真正
   立得住——买卖、涨跌、K线波动应该是成百上千地动，而不是零钱游戏。 */
const STOCKS = [
  { id: 'TEA', name: '茶业合作社', start: 200, sector: 'tea' },
  { id: 'FARM', name: '农场经营', start: 175, sector: 'farm' },
  { id: 'SHIP', name: '城镇货运', start: 240, sector: 'freight' },
  { id: 'BOOK', name: '书籍工坊', start: 145, sector: 'book' },
  { id: 'COIN', name: '硬币商店', start: 265, sector: 'coin' },
  { id: 'LIGHT', name: '灯具作坊', start: 160, sector: 'light' },
  { id: 'CAFE', name: '线稿咖啡馆', start: 135, sector: 'cafe' },
  { id: 'MAGIC', name: '魔法道具铺', start: 310, sector: 'magic' },
  { id: 'WAHA', name: '娃哈哈', start: 205, sector: 'company', isPlayerCompany: true }
];
const NEWS_POOL = [
  { title: '茶场订单增长', targetStock: 'TEA', impact: .065, delay: 1 },
  { title: '农场雇佣需求上升', targetStock: 'FARM', impact: .045, delay: 1 },
  { title: '货运道路维修传闻', targetStock: 'SHIP', impact: -.055, delay: 1 },
  { title: '读书会带动书籍销量', targetStock: 'BOOK', impact: .038, delay: 2 },
  { title: '硬币热度短期过高', targetStock: 'COIN', impact: -.046, delay: 1 },
  { title: '灯具作坊收到大单', targetStock: 'LIGHT', impact: .058, delay: 1 },
  { title: '咖啡馆客流回暖', targetStock: 'CAFE', impact: .05, delay: 1 },
  { title: '魔法道具需求过热', targetStock: 'MAGIC', impact: -.06, delay: 1 }
];
const NEWS_SOURCES = [
  { id: 'official', label: '官方公告', tone: '#39ff9c', min: .72, max: .95 },
  { id: 'insider', label: '内部消息', tone: '#ffd666', min: .5, max: .88 },
  { id: 'reporter', label: '财经记者', tone: '#5be6ff', min: .45, max: .78 },
  { id: 'rival', label: '同行放话', tone: '#ff9f5b', min: .22, max: .55 },
  { id: 'forum', label: '论坛传闻', tone: '#ff5d75', min: .08, max: .42 },
  /* 玩家亲自去农场/咖啡馆/杂货铺打听到的——不是随机生成，是小屋那边
     真实场景喂过来的消息，可信度比论坛传闻高，但也不是官方公告，
     用同一套"可信度加权"逻辑处理，不用另起一套判定。 */
  { id: 'field', label: '亲耳听说', tone: '#a8e06a', min: .45, max: .75 }
];
let marketState = null;
let activeScreen = 'market';
let yaw = 0;
let pitch = 0;
let cameraRadius = 8;
let dragging = false;
let lastX = 0;
let lastY = 0;
let downX = 0;
let downY = 0;
let lastMarketTick = 0;
let lastTime = 0;
let activeInteractable = null;
let toastText = '';
let toastUntil = 0;
const hintEl = document.getElementById('hint');
const playerKeys = {};
const PLAYER_SPEED = 1.9;
const PLAYER_RUN = 3.4;
const INTERACT_RANGE = 2.2;
const player = {
  x: 0, z: 3.2, y: 0, yaw: Math.PI, mesh: null, body: null,
  vy: 0, onGround: true, groundT: 0,
  moveSpeed: 0, pulse: 0,
  squash: .97, squashV: 0,
  wob: 0, wobV: 0,
  tilt: 0, tiltV: 0
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

function currentUserId() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return GUEST_ID;
  try {
    const data = JSON.parse(raw);
    return data && data.id ? data.id : GUEST_ID;
  } catch (err) {
    return raw.trim() || GUEST_ID;
  }
}

function saveKey() {
  return 'magicCabin.save.' + currentUserId() + '.v1';
}

function intValue(value, fallback, min, max) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function finiteNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const low = min === undefined ? -Infinity : min;
  const high = max === undefined ? Infinity : max;
  return Math.max(low, Math.min(high, n));
}

function stockDefinition(id) {
  return STOCKS.find(item => item.id === id) || STOCKS[0];
}

/* ---------------- 基本面模型：股价不再是纯随机游走 ----------------
   每支非玩家公司的股票背后挂了几个"看不见"的变量（营收/利润/现金/
   负债/增长率），算出一个"真实价值"V；股价每天只是慢慢往V靠拢，
   news/event 的冲击也不再只是吓一下价格，是真的先改营收利润，V变了，
   价格才跟着变——这样"昨天那条消息"和"今天的涨跌"之间才有因果，
   而不是开个天窗随机数。 */
const FUND_BASE = { revenue: 100, profit: 15, cash: 80, debt: 20, growth: .08 };
const MEAN_REVERT_ALPHA = .15;

function fundFormula(f) {
  return .3 * f.revenue + 1.5 * f.profit + .2 * f.cash - .3 * f.debt + f.growth * 40;
}

const FUND_BASE_VALUE = fundFormula(FUND_BASE);

function fundScaleFor(id) {
  const item = stockDefinition(id);
  return item.start / FUND_BASE_VALUE;
}

function fairValue(stock) {
  if (!stock.fund) return stock.price;
  return Math.max(1, fundScaleFor(stock.id) * fundFormula(stock.fund));
}

function stockTemplate(item) {
  return {
    id: item.id,
    name: item.name,
    sector: item.sector,
    price: item.start,
    prev: item.start,
    history: Array(12).fill(item.start),
    pressure: 0,
    fund: item.isPlayerCompany ? null : Object.assign({}, FUND_BASE)
  };
}

function sanitizeStock(stock, id) {
  const item = stockDefinition(id);
  const base = stockTemplate(item);
  const source = stock && typeof stock === 'object' ? stock : {};
  const price = finiteNumber(source.price, base.price, 1, 999999);
  const prev = finiteNumber(source.prev, price, 1, 999999);
  const history = Array.isArray(source.history)
    ? source.history.map(value => finiteNumber(value, NaN, 1, 999999)).filter(Number.isFinite).slice(-24)
    : [];
  const fundSource = source.fund && typeof source.fund === 'object' ? source.fund : {};
  const fund = item.isPlayerCompany ? null : {
    revenue: finiteNumber(fundSource.revenue, FUND_BASE.revenue, 10, 99999),
    profit: finiteNumber(fundSource.profit, FUND_BASE.profit, -9999, 99999),
    cash: finiteNumber(fundSource.cash, FUND_BASE.cash, 0, 99999),
    debt: finiteNumber(fundSource.debt, FUND_BASE.debt, 0, 99999),
    growth: finiteNumber(fundSource.growth, FUND_BASE.growth, -.4, .4)
  };
  return {
    id: item.id,
    name: item.name,
    sector: item.sector,
    price,
    prev,
    history: history.length >= 2 ? history : Array(12).fill(price),
    pressure: finiteNumber(source.pressure, 0, -.2, .2),
    fund,
    playerValuation: finiteNumber(source.playerValuation, 0, 0, 999999),
    /* 被娃哈哈并购之后就不再是独立上市公司了——价格定格在被收购那天，
       侧栏还看得到，但不能再买卖，跟"退市"是一回事。 */
    acquired: !!source.acquired
  };
}

function normalizeMarket(raw) {
  const stocks = {};
  for (const item of STOCKS) {
    const saved = raw && raw.stocks && raw.stocks[item.id];
    stocks[item.id] = sanitizeStock(saved, item.id);
    const stock = stocks[item.id];
    if (stock.price === 1) {
      const collapse = stock.history.findIndex((price, i, history) =>
        i > 0 && price === 1 && history[i - 1] > 10);
      if (collapse > 0) {
        stock.price = stock.history[collapse - 1];
        stock.prev = stock.price;
        stock.history = stock.history.slice(0, collapse);
      }
    }
  }
  const news = raw && Array.isArray(raw.news) ? raw.news.slice(-8) : [];
  return {
    day: intValue(raw && raw.day, 1, 1, 999999),
    selectedStock: STOCKS.some(item => item.id === (raw && raw.selectedStock)) ? raw.selectedStock : 'TEA',
    news: news.length ? news : [makeNewsEvent(0), makeNewsEvent(1)],
    storyEvents: raw && Array.isArray(raw.storyEvents)
      ? raw.storyEvents.filter(event => event && typeof event.id === 'string' &&
          event.targetStock === 'WAHA' && Number.isFinite(event.impact) &&
          Number.isInteger(event.dueDay)).slice(-16) : [],
    sentiment: finiteNumber(raw && raw.sentiment, 0, -1, 1),
    stocks
  };
}

function sanitizePortfolioMap(raw, valueKey) {
  const result = {};
  if (!raw || typeof raw !== 'object') return result;
  Object.keys(raw).forEach(id => {
    if (!STOCKS.some(item => item.id === id)) return;
    const item = raw[id] || {};
    const qty = intValue(item.qty, 0, 0, 999999);
    const value = intValue(item[valueKey], 0, 0, 999999999);
    if (qty && value) result[id] = valueKey === 'cost' ? { qty, cost: value } : { qty, entryValue: value };
  });
  return result;
}

function sanitizeRetro(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!Number.isFinite(Number(raw.day))) return null;
  return {
    day: intValue(raw.day, 1, 1, 999999),
    startEquity: intValue(raw.startEquity, 0, -999999, 9999999),
    endEquity: intValue(raw.endEquity, 0, -999999, 9999999),
    pnl: intValue(raw.pnl, 0, -999999, 9999999),
    pnlPct: finiteNumber(raw.pnlPct, 0, -5, 5),
    repDelta: intValue(raw.repDelta, 0, -100, 100),
    confirmed: intValue(raw.confirmed, 0, 0, 999),
    debunked: intValue(raw.debunked, 0, 0, 999),
    seen: !!raw.seen
  };
}

function normalizeInvestment(raw) {
  const holdings = sanitizePortfolioMap(raw && raw.holdings, 'cost');
  const shorts = sanitizePortfolioMap(raw && raw.shorts, 'entryValue');
  return {
    jobLevel: intValue(raw && raw.jobLevel, 1, 1, 20),
    lastSalaryDay: intValue(raw && raw.lastSalaryDay, -1, -1, 999999),
    totalWages: intValue(raw && raw.totalWages, 0, 0, 999999),
    realizedGain: intValue(raw && raw.realizedGain, 0, 0, 999999),
    realizedLoss: intValue(raw && raw.realizedLoss, 0, 0, 999999),
    reputation: intValue(raw && raw.reputation, 60, 0, 100),
    lastRumorDay: intValue(raw && raw.lastRumorDay, -1, -1, 999999),
    lastCoffeeDay: intValue(raw && raw.lastCoffeeDay, -1, -1, 999999),
    marginDebt: intValue(raw && raw.marginDebt, 0, 0, 9999999),
    /* 主线"原来你叫宗庆后"要靠玩家自己点开WAHA那份公司资料才触发，
       不是走进股市小屋这个动作本身——这个标记就是让主游戏那边知道
       "资料被翻开过了"。 */
    wahaCompanyViewed: !!(raw && raw.wahaCompanyViewed),
    /* 7天一轮的判断质量复盘：每周记录一次"这周信了几条最终证实、
       几条被证伪"，跟资产变化放在一起看，比"赚到100万=胜利"更能
       说明玩家的判断是不是真的在变好。 */
    weekAnchorDay: intValue(raw && raw.weekAnchorDay, 1, 1, 999999),
    weekStartEquity: intValue(raw && raw.weekStartEquity, 2600, -999999, 9999999),
    weekStartReputation: intValue(raw && raw.weekStartReputation, 60, 0, 100),
    weekConfirmed: intValue(raw && raw.weekConfirmed, 0, 0, 999),
    weekDebunked: intValue(raw && raw.weekDebunked, 0, 0, 999),
    lastRetro: sanitizeRetro(raw && raw.lastRetro),
    market: normalizeMarket(raw && raw.market),
    company: normalizeCompanyState(raw && raw.company),
    /* 投资任务：借鉴参考项目 stockmarket-simulation 的 quests 系统——
       一串"持仓凑成什么样子/资产滚到多少"的目标，完成后手动领奖，
       claimedQuests 记的是已经领过的任务 id，防止重复领取。 */
    claimedQuests: Array.isArray(raw && raw.claimedQuests)
      ? raw.claimedQuests.filter(id => typeof id === 'string').slice(0, 64)
      : [],
    holdings,
    shorts
  };
}

function normalizeCompanyState(raw) {
  const listed = !!(raw && raw.listed);
  const totalShares = intValue(raw && raw.totalShares, 10000, 1000, 1000000);
  /* 新存档不再默认给玩家100%创始股——娃哈哈不是白送的，得靠小屋那边
     "融资请求"里那些愿意让股的card，一点一点买/攒回来，直到过半数
     才算真正拿到公司的控制权（见 dashboard.js 里 wahaCompanyPanelHtml
     对上市面板的持股门槛判断）。 */
  const founderShares = intValue(raw && raw.founderShares, 0, 0, totalShares);
  const publicShares = intValue(raw && raw.publicShares, listed ? Math.max(0, totalShares - founderShares) : 0, 0, totalShares);
  const treasury = intValue(raw && raw.treasury, 0, 0, 999999999);
  return {
    listed,
    totalShares,
    founderShares,
    publicShares,
    treasury,
    offerPrice: intValue(raw && raw.offerPrice, 0, 0, 999999),
    offerTarget: typeof (raw && raw.offerTarget) === 'string' ? raw.offerTarget.slice(0, 40) : '',
    ipoDay: intValue(raw && raw.ipoDay, -1, -1, 999999),
    lockupUntilDay: intValue(raw && raw.lockupUntilDay, -1, -1, 999999),
    acquisitions: Array.isArray(raw && raw.acquisitions)
      ? raw.acquisitions.filter(id => STOCKS.some(item => item.id === id && !item.isPlayerCompany)).slice(0, 8)
      : [],
    /* 每完成一次并购，给 WAHA 自己的股价加一点点"吃不掉的"每日常驻
       涨幅——之前并购只往 waha.pressure 里加数，但 WAHA 的价格公式
       根本不看 pressure（只看 shock），所以并购买了跟没买一样。现在
       这笔加成是真实、持续生效的（见 advanceMarketDay 里的 change
       公式），并且在公司面板里能看到具体数字。 */
    acquisitionDrift: finiteNumber(raw && raw.acquisitionDrift, 0, 0, .05),
    /* 创始人持股跌破关键线之后，股市小屋会不定期弹出"董事会否决"或
       "恶意收购警报"——控制权风险不再只是好看的文字标签。一次只挂一件
       待处理事件，玩家没处理完之前不会再叠加新的。 */
    pendingControlEvent: (raw && raw.pendingControlEvent && typeof raw.pendingControlEvent === 'object' &&
      (raw.pendingControlEvent.type === 'veto' || raw.pendingControlEvent.type === 'hostile'))
      ? {
        type: raw.pendingControlEvent.type,
        day: intValue(raw.pendingControlEvent.day, 0, 0, 999999),
        shares: intValue(raw.pendingControlEvent.shares, 0, 0, totalShares)
      }
      : null
  };
}

function loadState() {
  const save = readJson(saveKey(), null);
  state.save = save && save.schema === SAVE_SCHEMA && save.content === CONTENT_ID ? save : null;
  const economy = state.save && state.save.economy || {};
  state.coins = intValue(economy.coins, 2600, 0, 999999);
  state.investment = normalizeInvestment(economy.investment);
  marketState = state.investment.market;
  applyExternalMarketNews();
  queueStoryMarketEvents();
  queueMarketTips();
  saveState();
}

/* 小屋那边"打听消息"攒下的情报（save.marketTips），读进来直接变成一条
   带可信度的新闻，走已有的 newsImpact() 可信度加权逻辑——不用另起
   一套判定，玩家亲耳听说的消息和财经记者、论坛传闻是同一套处理方式，
   只是可信度区间不一样。 */
function queueMarketTips() {
  const pending = state.save && Array.isArray(state.save.marketTips) ? state.save.marketTips : [];
  if (!pending.length) return;
  for (const tip of pending) {
    if (!tip || typeof tip.id !== 'string' || !Number.isFinite(tip.impact)) continue;
    if (!STOCKS.some(item => item.id === tip.targetStock)) continue;
    if (marketState.news.some(news => news.intelId === tip.id)) continue;
    const tipNews = {
      title: String(tip.label || '打听到的消息').slice(0, 80),
      targetStock: tip.targetStock,
      impact: Math.max(-.2, Math.min(.2, tip.impact)),
      credibility: finiteNumber(tip.credibility, .55, .2, .9),
      source: 'field',
      intelId: tip.id,
      delay: 1,
      day: marketState.day
    };
    if (newsNeedsVerification(tipNews)) {
      tipNews.verified = false;
      tipNews.verifyDay = marketState.day + tipNews.delay + 2 + Math.floor(Math.random() * 2);
    }
    marketState.news.push(tipNews);
  }
  marketState.news = marketState.news.slice(-8);
  if (state.save) state.save.marketTips = [];
}

function queueStoryMarketEvents() {
  const pending = state.save && Array.isArray(state.save.pendingMarketEvents)
    ? state.save.pendingMarketEvents : [];
  if (!pending.length) return;
  for (const event of pending) {
    if (!event || event.targetStock !== 'WAHA' || typeof event.id !== 'string' ||
        !Number.isFinite(event.impact)) continue;
    if (marketState.storyEvents.some(queued => queued.id === event.id)) continue;
    const delay1 = intValue(event.delay, 1, 1, 30);
    marketState.storyEvents.push({
      id: event.id,
      targetStock: 'WAHA',
      headline: String(event.headline || '娃哈哈经营消息').slice(0, 80),
      impact: Math.max(-.32, Math.min(.32, event.impact)),
      dueDay: marketState.day + delay1
    });
    marketState.news.push({
      title: String(event.headline || '娃哈哈经营消息').slice(0, 80),
      targetStock: 'WAHA',
      isStoryPending: true,
      storyEventId: event.id,
      day: marketState.day,
      delay: delay1
    });
    /* 两段式效果：广告豪赌这类决策，短期利润先受挫，价值要等更久才
       兑现——phase2 是同一个决策延后发生的第二次冲击，单独排队，
       跟 phase1 用同一套 storyEvents/news 管线，只是 dueDay 更晚。 */
    const phase2 = event.phase2;
    if (phase2 && Number.isFinite(phase2.impact)) {
      const delay2 = delay1 + intValue(phase2.delay, 4, 1, 60);
      const id2 = event.id + '-p2';
      if (!marketState.storyEvents.some(queued => queued.id === id2)) {
        marketState.storyEvents.push({
          id: id2,
          targetStock: 'WAHA',
          headline: String(phase2.headline || '娃哈哈长期效应显现').slice(0, 80),
          impact: Math.max(-.32, Math.min(.32, phase2.impact)),
          dueDay: marketState.day + delay2
        });
        marketState.news.push({
          title: String(phase2.headline || '娃哈哈长期效应显现').slice(0, 80),
          targetStock: 'WAHA',
          isStoryPending: true,
          storyEventId: id2,
          day: marketState.day,
          delay: delay2
        });
      }
    }
  }
  marketState.storyEvents = marketState.storyEvents.slice(-16);
  marketState.news = marketState.news.slice(-8);
  state.save.pendingMarketEvents = [];
}

/* 小屋那边的广告/融资/慈善弹窗，会把结果当"市场消息"写进同一份存档
   （save.wealthEvents.marketNews）。这里读进来，当一次全市场冲击应用到
   股价上，用完就把队列清空写回存档，避免同一条消息被反复吃两遍。 */
function applyExternalMarketNews() {
  const pending = state.save && state.save.wealthEvents && Array.isArray(state.save.wealthEvents.marketNews)
    ? state.save.wealthEvents.marketNews
    : [];
  if (!pending.length) return;
  pending.forEach(entry => {
    const bad = !!entry.bad;
    const magnitude = Math.max(0.01, Math.min(0.2, Number(entry.magnitude) || 0.05));
    for (const item of STOCKS.filter(stock => !stock.isPlayerCompany)) {
      const stock = getStock(item.id);
      const variance = .5 + Math.random() * .5;
      const change = (bad ? -1 : 1) * magnitude * variance;
      const prevPrice = stock.price;
      stock.prev = prevPrice;
      stock.price = Math.max(1, Math.round(clampPrice(prevPrice * (1 + change), prevPrice, .25) * 10) / 10);
      stock.history.push(stock.price);
      stock.history = stock.history.slice(-24);
    }
    marketState.news.push({
      title: entry.title || (bad ? '外部消息面偏空' : '外部消息面偏多'),
      targetStock: 'EVENT',
      isEvent: true,
      bad,
      delay: 0,
      day: marketState.day
    });
  });
  marketState.news = marketState.news.slice(-8);
  if (state.save.wealthEvents) state.save.wealthEvents.marketNews = [];
  saveState();
}

function saveState() {
  const save = state.save || { schema: SAVE_SCHEMA, content: CONTENT_ID, savedAt: new Date().toISOString(), economy: {} };
  save.savedAt = new Date().toISOString();
  save.economy = save.economy || {};
  state.coins = intValue(state.coins, 2600, 0, 999999);
  save.economy.coins = state.coins;
  marketState = normalizeMarket(marketState);
  state.investment.market = marketState;
  save.economy.investment = normalizeInvestment(state.investment);
  state.save = save;
  writeJson(saveKey(), save);
}

function formatPct(value) {
  const n = Number.isFinite(value) ? value * 100 : 0;
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function getStock(id) {
  const key = STOCKS.some(item => item.id === id) ? id : 'TEA';
  const current = marketState.stocks[key];
  /* 之前每次调用都无条件重新 sanitize 并替换 marketState.stocks[key]，
     会产生一个新对象。advanceMarketDay() 外层循环拿到的 stock 引用，
     一旦中途（比如 playerImpact 内部）又调用一次 getStock，就会被换成
     "没人再指向"的孤儿对象——外层继续往这个孤儿对象上写新价格，写了
     等于没写，marketState.stocks[key] 其实还是没变过的旧对象，导致
     股价和K线永远刷新不出来（新闻是直接 push 进数组的，不受影响）。
     只在对象形状不对时才重新 sanitize，否则原样返回同一个引用，
     保证同一个 tick 里多次调用拿到的是同一份。 */
  if (!current || typeof current !== 'object' ||
      !Number.isFinite(current.price) || !Array.isArray(current.history)) {
    marketState.stocks[key] = sanitizeStock(current, key);
  }
  return marketState.stocks[key];
}

/* 玩家自己填的"我认为它值多少"——不用来算任何东西，纯粹是让"形成
   判断"这一步变成一个具体、能回头对照的数字，而不是只在脑子里想想。 */
function setPlayerValuation(id, amount) {
  const stock = getStock(id);
  stock.playerValuation = Math.max(0, Math.round(finiteNumber(amount, 0, 0, 999999)));
  saveState();
}

function getHolding(id) {
  const raw = state.investment.holdings[id] || { qty: 0, cost: 0 };
  const holding = {
    qty: intValue(raw.qty, 0, 0, 999999),
    cost: intValue(raw.cost, 0, 0, 999999999)
  };
  if (!holding.qty || !holding.cost) delete state.investment.holdings[id];
  else state.investment.holdings[id] = holding;
  return holding;
}

function setHolding(id, holding) {
  const qty = intValue(holding && holding.qty, 0, 0, 999999);
  const cost = intValue(holding && holding.cost, 0, 0, 999999999);
  if (!qty || !cost) delete state.investment.holdings[id];
  else state.investment.holdings[id] = { qty, cost };
}

function getShort(id) {
  const raw = state.investment.shorts[id] || { qty: 0, entryValue: 0 };
  const short = {
    qty: intValue(raw.qty, 0, 0, 999999),
    entryValue: intValue(raw.entryValue, 0, 0, 999999999)
  };
  if (!short.qty || !short.entryValue) delete state.investment.shorts[id];
  else state.investment.shorts[id] = short;
  return short;
}

function setShort(id, short) {
  const qty = intValue(short && short.qty, 0, 0, 999999);
  const entryValue = intValue(short && short.entryValue, 0, 0, 999999999);
  if (!qty || !entryValue) delete state.investment.shorts[id];
  else state.investment.shorts[id] = { qty, entryValue };
}

function shortExposure() {
  return Object.keys(state.investment.shorts).reduce((sum, id) => {
    return sum + getShort(id).qty * getStock(id).price;
  }, 0);
}

function reputation() {
  return state.investment.reputation;
}

function shortLimit() {
  const repFactor = .7 + reputation() / 200;
  state.coins = intValue(state.coins, 2600, 0, 999999);
  return Math.round(state.coins * 1.5 * repFactor);
}

function investmentPnlSummary() {
  let longValue = 0;
  let longCost = 0;
  let shortEntry = 0;
  let shortMarket = 0;
  for (const item of STOCKS) {
    const stock = getStock(item.id);
    const holding = getHolding(item.id);
    const short = getShort(item.id);
    longValue += holding.qty * stock.price;
    longCost += holding.cost;
    shortEntry += short.entryValue;
    shortMarket += short.qty * stock.price;
  }
  const longPnl = Math.round(longValue - longCost);
  const shortPnl = Math.round(shortEntry - shortMarket);
  const realized = intValue(state.investment.realizedGain, 0, 0, 999999)
    - intValue(state.investment.realizedLoss, 0, 0, 999999);
  return {
    longValue: Math.round(longValue),
    longCost: Math.round(longCost),
    longPnl,
    shortEntry: Math.round(shortEntry),
    shortMarket: Math.round(shortMarket),
    shortPnl,
    realized,
    totalPnl: realized + longPnl + shortPnl
  };
}

/* ---------------- 融资杠杆：新玩法，比单纯买卖更有分量 ----------------
   借钱买股票，赚了翻倍赚，亏了也翻倍亏，每天还要计利息——这是"股市
   是主要玩法"里真正加深度、加刺激的一块：赢面更大，代价也更真实。
   权益（现金+持仓市值-欠款）跌破欠款的30%，直接触发强制平仓，把
   持仓全部按市价卖掉抵债，声誉也会受重创，不是嘴上说说的风险。 */
const MARGIN_INTEREST_RATE = .015;
const MARGIN_MAX_LEVERAGE = 1;
const MARGIN_CALL_RATIO = .3;

function marginDebt() {
  return intValue(state.investment.marginDebt, 0, 0, 9999999);
}

function setMarginDebt(value) {
  state.investment.marginDebt = Math.max(0, Math.round(finiteNumber(value, 0, 0, 9999999)));
}

function marginBorrowLimit() {
  state.coins = intValue(state.coins, 2600, 0, 999999);
  return Math.max(0, Math.round(state.coins * MARGIN_MAX_LEVERAGE) - marginDebt());
}

function portfolioEquity() {
  const pnl = investmentPnlSummary();
  return state.coins + pnl.longValue - marginDebt();
}

function dismissRetro() {
  if (state.investment.lastRetro) state.investment.lastRetro.seen = true;
  saveState();
  redrawScreens();
  if (!screenPanel.hidden) renderScreenPanel(activeScreen);
}

function forceLiquidateMargin() {
  let recovered = 0;
  for (const item of STOCKS) {
    const holding = getHolding(item.id);
    if (!holding.qty) continue;
    const stock = getStock(item.id);
    const income = Math.floor(stock.price * holding.qty);
    recovered += income;
    const profit = income - holding.cost;
    if (profit >= 0) state.investment.realizedGain += profit;
    else state.investment.realizedLoss += Math.abs(profit);
    setHolding(item.id, { qty: 0, cost: 0 });
  }
  state.coins = Math.min(999999, state.coins + recovered);
  const debt = marginDebt();
  const payoff = Math.min(debt, state.coins);
  state.coins -= payoff;
  setMarginDebt(debt - payoff);
  state.investment.reputation = Math.max(0, state.investment.reputation - 20);
  marketState.news.push({
    title: '融资爆仓：权益跌破维持担保比例，持仓被强制平仓',
    targetStock: 'EVENT', isEvent: true, bad: true, delay: 0, day: marketState.day
  });
  marketState.news = marketState.news.slice(-8);
  if (typeof showMarketFeedback === 'function' && payoff > 0) {
    showMarketFeedback(-payoff, '融资爆仓', '权益跌破维持担保比例，系统把全部持仓按市价卖出抵债 ' + payoff + ' 金币，声誉也受了重创。', {
      countMilestone: false, toastLabel: '强平 -'
    });
  } else if (typeof showToast === 'function') {
    showToast('融资爆仓：持仓已被强制平仓抵债，声誉受损。', 3200);
  }
}

const RUMOR_IMPACT = .09;
const RUMOR_REP_PENALTY = 16;

function rumorCost() {
  return Math.round(90 * (1.6 - reputation() / 150));
}

function rumorExposeChance() {
  return Math.max(.1, Math.min(.8, .42 - reputation() / 260));
}

function canSpreadRumor() {
  return marketState.day !== state.investment.lastRumorDay;
}

function spreadRumor(stockId, bad) {
  if (!canSpreadRumor()) return;
  const cost = rumorCost();
  state.coins = intValue(state.coins, 2600, 0, 999999);
  if (state.coins < cost) return;
  const stock = STOCKS.find(item => item.id === stockId);
  if (!stock || stock.isPlayerCompany) return;
  state.coins -= cost;
  state.investment.lastRumorDay = marketState.day;
  marketState.news.push({
    title: '有传闻称"' + stock.name + '"即将' + (bad ? '暴雷' : '爆单'),
    targetStock: stockId,
    impact: (bad ? -1 : 1) * RUMOR_IMPACT,
    delay: 1,
    day: marketState.day,
    isPlayerRumor: true,
    exposeChance: rumorExposeChance(),
    repPenalty: RUMOR_REP_PENALTY,
    resolved: false
  });
  marketState.news = marketState.news.slice(-8);
  if (typeof showMarketFeedback === 'function') {
    showMarketFeedback(-cost, bad ? '散布利空成本' : '散布利好成本',
      '花 ' + cost + ' 金币影响 ' + stock.name + '，声誉和结果都要等市场检验。', {
        toastLabel: '成本 -'
      });
  }
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function resolvePlayerRumors(day, shocks) {
  marketState.news.forEach(news => {
    if (!news.isPlayerRumor || news.resolved) return;
    if (day !== news.day + news.delay) return;
    news.resolved = true;
    const exposed = Math.random() < news.exposeChance;
    news.exposed = exposed;
    if (exposed) {
      shocks[news.targetStock] = (shocks[news.targetStock] || 0) + news.impact * .3;
      state.investment.reputation = Math.max(0, Math.min(100, state.investment.reputation - news.repPenalty));
      const stock = STOCKS.find(item => item.id === news.targetStock);
      marketState.news.push({
        title: '有人散布的"' + (stock ? stock.name : news.targetStock) + '"传闻被揭穿',
        isExposeNotice: true,
        bad: true,
        delay: 0,
        day
      });
    } else {
      shocks[news.targetStock] = (shocks[news.targetStock] || 0) + news.impact;
    }
  });
  marketState.news = marketState.news.slice(-8);
}

/* ---------------- 传闻验证队列 ----------------
   可信度很低（<.45）的消息，newsImpact() 里已经有一套"先生效、隔
   一两天自动回撤大半"的机制，玩家看不出来但价格会自己纠正。
   这里补的是中等可信度（.45~.85，官方公告以外的大多数消息）：这批
   以前"一锤定音、永远不揭晓"，现在会在生效几天后按可信度概率真正
   判定一次"属实/证伪"，属实小幅加码，证伪把已经吃进的涨跌部分
   打回去——玩家能在资讯栏里看到"待验证 → 已证实/已证伪"的状态变化，
   而不是所有消息都石沉大海。 */
function newsNeedsVerification(news) {
  return Number.isFinite(news.credibility) && news.credibility >= .45 && news.credibility < .85 &&
    !news.isPlayerRumor && !news.isEvent && !news.isStoryEvent && !news.isStoryPending && !news.isExposeNotice;
}

function makeNewsEvent(offset) {
  const seed = Math.floor(Math.random() * NEWS_POOL.length);
  const base = NEWS_POOL[(seed + offset) % NEWS_POOL.length];
  const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
  const credibility = source.min + Math.random() * (source.max - source.min);
  const day = (marketState ? marketState.day : 1) + offset;
  const event = {
    title: base.title,
    targetStock: base.targetStock,
    impact: base.impact,
    credibility,
    source: source.id,
    delay: base.delay,
    day
  };
  if (newsNeedsVerification(event)) {
    event.verified = false;
    event.verifyDay = day + base.delay + 2 + Math.floor(Math.random() * 2);
  }
  return event;
}

function resolveNewsVerification(day, shocks) {
  marketState.news.forEach(news => {
    if (!newsNeedsVerification(news) || news.verified !== false || !Number.isFinite(news.verifyDay)) return;
    if (day < news.verifyDay) return;
    news.verified = true;
    const trueNews = Math.random() < news.credibility;
    news.verifyOutcome = trueNews;
    if (trueNews) {
      shocks[news.targetStock] = (shocks[news.targetStock] || 0) + news.impact * .18;
      state.investment.weekConfirmed = intValue(state.investment.weekConfirmed, 0, 0, 999) + 1;
    } else {
      shocks[news.targetStock] = (shocks[news.targetStock] || 0) - news.impact * .55;
      state.investment.weekDebunked = intValue(state.investment.weekDebunked, 0, 0, 999) + 1;
      marketState.news.push({
        title: '"' + news.title + '" 被证实是假消息',
        isExposeNotice: true,
        bad: news.impact > 0,
        delay: 0,
        day
      });
    }
  });
  marketState.news = marketState.news.slice(-8);
}

/* ---------------- 7天投资复盘 ----------------
   "赚到100万=胜利"只看结果，看不出判断本身有没有变好。这里每满
   7个交易日结一次：这周资产从哪到哪、这周信过的消息里有多少最终
   证实/被揭穿、声誉涨跌——跟"这周赚了多少钱"放在一张卡片里对照着看。 */
function checkWeeklyRetrospective() {
  const inv = state.investment;
  if (marketState.day - inv.weekAnchorDay < 7) return;
  const endEquity = typeof portfolioEquity === 'function' ? portfolioEquity() : state.coins;
  const startEquity = inv.weekStartEquity;
  const pnl = Math.round(endEquity - startEquity);
  const pnlPct = startEquity > 0 ? pnl / startEquity : 0;
  inv.lastRetro = {
    day: marketState.day,
    startEquity: Math.round(startEquity),
    endEquity: Math.round(endEquity),
    pnl,
    pnlPct,
    repDelta: reputation() - inv.weekStartReputation,
    confirmed: inv.weekConfirmed,
    debunked: inv.weekDebunked,
    seen: false
  };
  inv.weekAnchorDay = marketState.day;
  inv.weekStartEquity = endEquity;
  inv.weekStartReputation = reputation();
  inv.weekConfirmed = 0;
  inv.weekDebunked = 0;
  if (typeof showToast === 'function') showToast('📋 本周投资复盘生成了，去资讯栏看看这周的判断质量', 3200);
}

/* ---------------- 板块联动 ----------------
   "茶叶减产"不该只让茶业合作社一家动——跟茶挨得近的货运、跟农场挨得近
   的咖啡馆，也该跟着抖一下，哪怕抖得比本体轻。玩家看报纸判断的时候，
   才有"连锁反应"可以推理，而不是每条新闻只跟一支股票有关系。 */
const SECTOR_CORRELATIONS = {
  tea: [{ sector: 'freight', weight: .32 }, { sector: 'farm', weight: .15 }],
  farm: [{ sector: 'cafe', weight: .3 }, { sector: 'tea', weight: .15 }],
  freight: [{ sector: 'tea', weight: .2 }, { sector: 'farm', weight: .1 }],
  cafe: [{ sector: 'farm', weight: .18 }],
  book: [{ sector: 'magic', weight: .2 }],
  magic: [{ sector: 'book', weight: .15 }, { sector: 'coin', weight: -.12 }],
  coin: [{ sector: 'magic', weight: -.1 }],
  light: []
};

function sectorOf(stockId) {
  const item = STOCKS.find(s => s.id === stockId);
  return item ? item.sector : null;
}

/* ---------------- 市场情绪 ----------------
   跟着最近几天的整体涨跌自己滚出来的一个 -1(恐慌) ~ +1(狂热) 的分数，
   会让日常波动带个方向性偏置，也会让 IPO 定价跟着市场冷热浮动。 */
function marketSentimentScore() {
  return finiteNumber(marketState && marketState.sentiment, 0, -1, 1);
}

function marketSentimentLabel() {
  const s = marketSentimentScore();
  if (s >= .5) return { id: 'euphoric', label: '狂热', tone: '#c9701f' };
  if (s >= .15) return { id: 'optimistic', label: '乐观', tone: '#2f9e5c' };
  if (s > -.15) return { id: 'calm', label: '平稳', tone: '#4c7a82' };
  if (s > -.5) return { id: 'cautious', label: '谨慎', tone: '#a8763c' };
  return { id: 'panic', label: '恐慌', tone: '#c0392b' };
}

function updateMarketSentiment() {
  const tradable = STOCKS.filter(item => !item.isPlayerCompany);
  let sum = 0;
  let n = 0;
  tradable.forEach(item => {
    const stock = getStock(item.id);
    if (Number.isFinite(stock.prev) && stock.prev > 0) {
      sum += (stock.price - stock.prev) / stock.prev;
      n++;
    }
  });
  const avgChange = n ? sum / n : 0;
  const prev = marketSentimentScore();
  const next = prev * .72 + avgChange * 6 + (Math.random() - .5) * .06;
  marketState.sentiment = Math.max(-1, Math.min(1, next));
}

/* IPO定价跟着市场情绪走：狂热的时候市场愿意为新股多付钱（最多+20%），
   恐慌的时候只愿意打折买（最多-25%）——同一份上市方案，选的时机不同，
   融到的钱可以差出不少。 */
function sentimentIpoMultiplier() {
  const s = marketSentimentScore();
  return s >= 0 ? 1 + s * .2 : 1 + s * .25;
}

function baseFluctuation() {
  return (Math.random() - .5) * .03 + marketSentimentScore() * .008;
}

function newsImpact(stockId, day) {
  let impact = 0;
  const mySector = sectorOf(stockId);
  for (const news of marketState.news) {
    if (!news || news.isPlayerRumor || !Number.isFinite(news.impact) || !Number.isFinite(news.credibility)) continue;
    let weight = 0;
    if (news.targetStock === stockId) {
      weight = 1;
    } else if (mySector) {
      const newsSector = sectorOf(news.targetStock);
      const links = SECTOR_CORRELATIONS[newsSector] || [];
      const link = links.find(l => l.sector === mySector);
      if (link) weight = link.weight;
    }
    if (!weight) continue;
    const applyDay = news.day + news.delay;
    if (day === applyDay) {
      impact += (news.credibility < .45 ? news.impact * .45 : news.impact * news.credibility) * weight;
    }
    if (news.credibility < .45 && (day === applyDay + 1 || day === applyDay + 2)) {
      impact -= news.impact * .65 * weight;
    }
  }
  return impact;
}

function playerImpact(stockId) {
  const holding = getHolding(stockId);
  const stock = getStock(stockId);
  const holdingRatio = Math.min(.08, holding.qty * stock.price / 9000);
  const pressure = Math.max(-.025, Math.min(.025, stock.pressure || 0));
  stock.pressure *= .55;
  return holdingRatio * .02 + pressure;
}

function clampPrice(price, prevPrice, maxChange) {
  if (!Number.isFinite(price) || !Number.isFinite(prevPrice) || prevPrice < 1) {
    return Math.max(1, finiteNumber(price, 1, 1, 999999));
  }
  const cap = maxChange || .1;
  const upper = prevPrice * (1 + cap);
  const lower = prevPrice * (1 - cap);
  return Math.max(lower, Math.min(upper, price));
}

function rollMarketEvent() {
  if (Math.random() > .12) return null;
  const bad = Math.random() < .5;
  const magnitude = .12 + Math.random() * .14;
  const sectorEvent = Math.random() < .6;
  if (sectorEvent) {
    const sectors = [...new Set(STOCKS.filter(item => !item.isPlayerCompany).map(item => item.sector))];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const targets = STOCKS.filter(item => item.sector === sector).map(item => item.id);
    return {
      scope: 'sector',
      bad,
      magnitude,
      targets,
      title: (bad ? '突发利空' : '突发利好') + '：' + sector + ' 板块'
    };
  }
  return {
    scope: 'market',
    bad,
    magnitude,
    targets: STOCKS.filter(item => !item.isPlayerCompany).map(item => item.id),
    title: bad ? '全市场恐慌性抛售' : '全市场普涨行情'
  };
}

function advanceMarketDay() {
  const pnlBefore = typeof investmentPnlSummary === 'function' ? investmentPnlSummary().totalPnl : 0;
  marketState.day += 1;
  const event = rollMarketEvent();
  const shocks = {};
  const dueStoryEvents = marketState.storyEvents.filter(item => item.dueDay <= marketState.day);
  marketState.storyEvents = marketState.storyEvents.filter(item => item.dueDay > marketState.day);
  for (const storyEvent of dueStoryEvents) {
    marketState.news = marketState.news.filter(news => news.storyEventId !== storyEvent.id);
    shocks.WAHA = (shocks.WAHA || 0) + storyEvent.impact;
    marketState.news.push({
      title: storyEvent.headline,
      targetStock: 'WAHA',
      isStoryEvent: true,
      impact: storyEvent.impact,
      delay: 0,
      day: marketState.day
    });
  }
  marketState.news = marketState.news.slice(-8);
  resolvePlayerRumors(marketState.day, shocks);
  resolveNewsVerification(marketState.day, shocks);
  state.investment.reputation = Math.round(state.investment.reputation + (60 - state.investment.reputation) * .02);
  if (event) {
    event.targets.forEach(id => {
      const variance = event.scope === 'market' ? .55 + Math.random() * .45 : 1;
      shocks[id] = (event.bad ? -1 : 1) * event.magnitude * variance;
    });
    marketState.news.push({
      title: event.title,
      targetStock: 'EVENT',
      isEvent: true,
      bad: event.bad,
      delay: 0,
      day: marketState.day
    });
    marketState.news = marketState.news.slice(-8);
  }
  for (const item of STOCKS) {
    const stock = getStock(item.id);
    if (stock.acquired) continue;
    const prevPrice = stock.price;
    const shock = shocks[item.id] || 0;
    let revert = 0;
    if (!item.isPlayerCompany && stock.fund) {
      /* 基本面自己会慢慢漂移（跟着增长率走+一点噪声），消息/事件的
         冲击这里也先落到营收利润上，而不是只吓一下价格——冲击有多
         大，"真实价值"就跟着挪多少，股价接下来几天是在往这个新的
         价值靠拢，不是当天炸一下就完事。 */
      stock.fund.revenue = Math.max(10, stock.fund.revenue * (1 + stock.fund.growth * .08 + (Math.random() - .5) * .02));
      stock.fund.profit = stock.fund.profit + (Math.random() - .5) * stock.fund.revenue * .01;
      if (shock) {
        stock.fund.revenue = Math.max(10, stock.fund.revenue * (1 + shock * .6));
        stock.fund.profit = stock.fund.profit + stock.fund.revenue * shock * .15;
      }
      const fv = fairValue(stock);
      revert = MEAN_REVERT_ALPHA * (fv - prevPrice) / prevPrice;
    }
    const change = item.isPlayerCompany ? shock + (state.investment.company ? state.investment.company.acquisitionDrift : 0)
      : baseFluctuation() + newsImpact(item.id, marketState.day) + playerImpact(item.id) + shock * .4 + revert;
    stock.prev = prevPrice;
    stock.price = Math.max(1, Math.round(clampPrice(prevPrice * (1 + change), prevPrice, shock ? .32 : .1) * 10) / 10);
    stock.history.push(stock.price);
    stock.history = stock.history.slice(-24);
  }
  updateMarketSentiment();
  if (marketState.news.length < 6 || Math.random() < .45) {
    marketState.news.push(makeNewsEvent(0));
    marketState.news = marketState.news.slice(-8);
  }
  /* 融资欠款每天计一次利息，再检查权益有没有跌破维持担保比例——
   * 顺序很重要：先算完利息、再用当天收盘后的最新价算权益，才是
   * 玩家实际会看到的那个数。 */
  if (marginDebt() > 0) {
    setMarginDebt(marginDebt() * (1 + MARGIN_INTEREST_RATE));
    if (portfolioEquity() < marginDebt() * MARGIN_CALL_RATIO) {
      forceLiquidateMargin();
    }
  }
  /* 创始人持股跌破关键线，就有机会摊上"董事会否决"/"恶意收购"这类
     控制权事件——一次只挂一件，玩家处理掉之前不会再抽新的，避免
     事件叠事件。具体阈值/概率跟 founderControlRiskLabel() 用的分界
     线（67/51/34）对齐，"有被联合否决的风险"对应否决事件，
     "控制权已经不在你手上"对应恶意收购。 */
  const company = state.investment.company;
  if (company && company.listed && !company.pendingControlEvent) {
    const founderPct = typeof wahaFounderPct === 'function' ? wahaFounderPct(company) : 100;
    if (founderPct < 34 && Math.random() < .30) {
      company.pendingControlEvent = {
        type: 'hostile',
        day: marketState.day,
        shares: Math.max(50, Math.round(company.totalShares * .05))
      };
    } else if (founderPct < 51 && Math.random() < .22) {
      company.pendingControlEvent = { type: 'veto', day: marketState.day, shares: 0 };
    }
  }
  checkWeeklyRetrospective();
  redrawScreens();
  if (!screenPanel.hidden) renderScreenPanel(activeScreen);
  if (typeof investmentPnlSummary === 'function' && typeof showMarketFeedback === 'function') {
    const pnlAfter = investmentPnlSummary().totalPnl;
    const delta = Math.round(pnlAfter - pnlBefore);
    if (delta) {
      showMarketFeedback(delta, '今日盈亏', 'Day ' + marketState.day + ' 收盘 · 总盈亏从 ' + pnlBefore + ' 变为 ' + pnlAfter);
    } else if (typeof showToast === 'function') {
      showToast('Day ' + marketState.day + ' 收盘 · 持仓暂时没有明显变化', 2400);
    }
  }
  saveState();
}

function redrawScreens() {
  for (const texture of screenTextures) redrawTexture(texture);
  refreshSeatOccupancy();
}
