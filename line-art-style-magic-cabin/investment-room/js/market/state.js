const SESSION_KEY = 'magicCabin.session.v1';
const GUEST_ID = 'guest';
const SAVE_SCHEMA = 1;
const CONTENT_ID = 'magic-cabin-local-2026';
const state = { coins: 100, investment: { jobLevel: 1, lastSalaryDay: -1, totalWages: 0, realizedGain: 0, realizedLoss: 0, reputation: 60, lastRumorDay: -1, lastCoffeeDay: -1, holdings: {}, shorts: {} }, save: null };
const screenPanel = document.getElementById('screenPanel');
const dashClock = document.getElementById('dashClock');
const dashRep = document.getElementById('dashRep');
const dashSidebar = document.getElementById('dashSidebar');
const dashMainHead = document.getElementById('dashMainHead');
const dashTrade = document.getElementById('dashTrade');
const dashHoldings = document.getElementById('dashHoldings');
const dashNews = document.getElementById('dashNews');
const dashBody = document.querySelector('.dashBody');
const closeScreenPanel = document.getElementById('closeScreenPanel');
const screenMeshes = [];
const screenTextures = [];
const STOCKS = [
  { id: 'TEA', name: '茶业合作社', start: 39, sector: 'tea' },
  { id: 'FARM', name: '农场经营', start: 34, sector: 'farm' },
  { id: 'SHIP', name: '城镇货运', start: 47, sector: 'freight' },
  { id: 'BOOK', name: '书籍工坊', start: 28, sector: 'book' },
  { id: 'COIN', name: '硬币商店', start: 52, sector: 'coin' },
  { id: 'LIGHT', name: '灯具作坊', start: 31, sector: 'light' },
  { id: 'CAFE', name: '线稿咖啡馆', start: 26, sector: 'cafe' },
  { id: 'MAGIC', name: '魔法道具铺', start: 61, sector: 'magic' }
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
  { id: 'forum', label: '论坛传闻', tone: '#ff5d75', min: .08, max: .42 }
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

function stockTemplate(item) {
  return {
    id: item.id,
    name: item.name,
    sector: item.sector,
    price: item.start,
    prev: item.start,
    history: Array(12).fill(item.start),
    pressure: 0
  };
}

function normalizeMarket(raw) {
  const stocks = {};
  for (const item of STOCKS) {
    const saved = raw && raw.stocks && raw.stocks[item.id];
    const base = stockTemplate(item);
    const priceValue = Number(saved && saved.price);
    const prevValue = Number(saved && saved.prev);
    base.price = Number.isFinite(priceValue) ? Math.max(1, priceValue) : base.price;
    base.prev = Number.isFinite(prevValue) ? Math.max(1, prevValue) : base.prev;
    if (saved && Array.isArray(saved.history)) {
      base.history = saved.history.map(Number).filter(Number.isFinite).slice(-24);
      if (base.history.length < 2) base.history = Array(12).fill(base.price);
    }
    base.pressure = Number(saved && saved.pressure) || 0;
    stocks[item.id] = base;
  }
  const news = raw && Array.isArray(raw.news) ? raw.news.slice(-8) : [];
  return {
    day: intValue(raw && raw.day, 1, 1, 999999),
    selectedStock: STOCKS.some(item => item.id === (raw && raw.selectedStock)) ? raw.selectedStock : 'TEA',
    news: news.length ? news : [makeNewsEvent(0), makeNewsEvent(1)],
    stocks
  };
}

function normalizeInvestment(raw) {
  const holdings = {};
  if (raw && raw.holdings) {
    Object.keys(raw.holdings).forEach(id => {
      const h = raw.holdings[id] || {};
      const qty = intValue(h.qty, 0, 0, 999999);
      const cost = intValue(h.cost, 0, 0, 999999);
      if (qty) holdings[id] = { qty, cost };
    });
  }
  const shorts = {};
  if (raw && raw.shorts) {
    Object.keys(raw.shorts).forEach(id => {
      const s = raw.shorts[id] || {};
      const qty = intValue(s.qty, 0, 0, 999999);
      const entryValue = intValue(s.entryValue, 0, 0, 999999999);
      if (qty) shorts[id] = { qty, entryValue };
    });
  }
  return {
    jobLevel: intValue(raw && raw.jobLevel, 1, 1, 20),
    lastSalaryDay: intValue(raw && raw.lastSalaryDay, -1, -1, 999999),
    totalWages: intValue(raw && raw.totalWages, 0, 0, 999999),
    realizedGain: intValue(raw && raw.realizedGain, 0, 0, 999999),
    realizedLoss: intValue(raw && raw.realizedLoss, 0, 0, 999999),
    reputation: intValue(raw && raw.reputation, 60, 0, 100),
    lastRumorDay: intValue(raw && raw.lastRumorDay, -1, -1, 999999),
    lastCoffeeDay: intValue(raw && raw.lastCoffeeDay, -1, -1, 999999),
    market: normalizeMarket(raw && raw.market),
    holdings,
    shorts
  };
}

function loadState() {
  const save = readJson(saveKey(), null);
  state.save = save && save.schema === SAVE_SCHEMA && save.content === CONTENT_ID ? save : null;
  const economy = state.save && state.save.economy || {};
  state.coins = intValue(economy.coins, 100, 0, 999999);
  state.investment = normalizeInvestment(economy.investment);
  marketState = state.investment.market;
}

function saveState() {
  const save = state.save || { schema: SAVE_SCHEMA, content: CONTENT_ID, savedAt: new Date().toISOString(), economy: {} };
  save.savedAt = new Date().toISOString();
  save.economy = save.economy || {};
  save.economy.coins = state.coins;
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
  return marketState.stocks[id] || marketState.stocks.TEA;
}

function getHolding(id) {
  return state.investment.holdings[id] || { qty: 0, cost: 0 };
}

function setHolding(id, holding) {
  if (!holding.qty) delete state.investment.holdings[id];
  else state.investment.holdings[id] = { qty: holding.qty, cost: holding.cost };
}

function getShort(id) {
  return state.investment.shorts[id] || { qty: 0, entryValue: 0 };
}

function setShort(id, short) {
  if (!short.qty) delete state.investment.shorts[id];
  else state.investment.shorts[id] = { qty: short.qty, entryValue: short.entryValue };
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
  return Math.round(state.coins * 1.5 * repFactor);
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
  if (state.coins < cost) return;
  const stock = STOCKS.find(item => item.id === stockId);
  if (!stock) return;
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

function makeNewsEvent(offset) {
  const seed = Math.floor(Math.random() * NEWS_POOL.length);
  const base = NEWS_POOL[(seed + offset) % NEWS_POOL.length];
  const source = NEWS_SOURCES[Math.floor(Math.random() * NEWS_SOURCES.length)];
  const credibility = source.min + Math.random() * (source.max - source.min);
  return {
    title: base.title,
    targetStock: base.targetStock,
    impact: base.impact,
    credibility,
    source: source.id,
    delay: base.delay,
    day: (marketState ? marketState.day : 1) + offset
  };
}

function baseFluctuation() {
  return (Math.random() - .5) * .03;
}

function newsImpact(stockId, day) {
  let impact = 0;
  for (const news of marketState.news) {
    if (news.targetStock !== stockId) continue;
    const applyDay = news.day + news.delay;
    if (day === applyDay) {
      impact += news.credibility < .45 ? news.impact * .45 : news.impact * news.credibility;
    }
    if (news.credibility < .45 && (day === applyDay + 1 || day === applyDay + 2)) {
      impact -= news.impact * .65;
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
    const sectors = [...new Set(STOCKS.map(item => item.sector))];
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
    targets: STOCKS.map(item => item.id),
    title: bad ? '全市场恐慌性抛售' : '全市场普涨行情'
  };
}

function advanceMarketDay() {
  marketState.day += 1;
  const event = rollMarketEvent();
  const shocks = {};
  resolvePlayerRumors(marketState.day, shocks);
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
    const prevPrice = stock.price;
    const shock = shocks[item.id] || 0;
    const change = baseFluctuation() + newsImpact(item.id, marketState.day) + playerImpact(item.id) + shock;
    stock.prev = prevPrice;
    stock.price = Math.max(1, Math.round(clampPrice(prevPrice * (1 + change), prevPrice, shock ? .32 : .1) * 10) / 10);
    stock.history.push(stock.price);
    stock.history = stock.history.slice(-24);
  }
  if (marketState.news.length < 6 || Math.random() < .45) {
    marketState.news.push(makeNewsEvent(0));
    marketState.news = marketState.news.slice(-8);
  }
  redrawScreens();
  if (!screenPanel.hidden) renderScreenPanel(activeScreen);
  saveState();
}

function redrawScreens() {
  for (const texture of screenTextures) redrawTexture(texture);
  refreshSeatOccupancy();
}
