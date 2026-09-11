function buyStock(id, count) {
  const stock = getStock(id);
  const cost = Math.ceil(stock.price * count);
  if (state.coins < cost) {
    if (typeof showToast === 'function') showToast('金币不够，买 ' + stock.name + ' 需要 ' + cost + ' 金币');
    return;
  }
  state.coins -= cost;
  const holding = getHolding(id);
  holding.qty += count;
  holding.cost += cost;
  stock.pressure += .01 * count;
  setHolding(id, holding);
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function sellStock(id, count) {
  const stock = getStock(id);
  const holding = getHolding(id);
  const qty = Math.min(count, holding.qty);
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
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function shortStock(id, count) {
  const stock = getStock(id);
  const proceeds = Math.floor(stock.price * count);
  if (shortExposure() + proceeds > shortLimit()) {
    if (typeof showToast === 'function') showToast('做空额度不够了，先平掉一些空单');
    return;
  }
  const short = getShort(id);
  short.qty += count;
  short.entryValue += proceeds;
  setShort(id, short);
  state.coins = Math.min(999999, state.coins + proceeds);
  stock.pressure -= .012 * count;
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function coverShort(id, count) {
  const stock = getStock(id);
  const short = getShort(id);
  const qty = Math.min(count, short.qty);
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
  redrawScreens();
  renderScreenPanel(activeScreen);
  saveState();
}

function marketIndexSummary() {
  const diffs = STOCKS.map(item => {
    const stock = getStock(item.id);
    return (stock.price - stock.prev) / Math.max(1, stock.prev);
  });
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const index = 1000 * (1 + STOCKS.reduce((sum, item) => sum + getStock(item.id).price, 0) / (STOCKS.length * 1000));
  const cls = avg >= 0 ? 'up' : 'down';
  return '<div class="dashIndexCard">' +
    '<small>大盘指数 · SIDX</small>' +
    '<strong>' + index.toFixed(2) + '</strong>' +
    '<span class="' + cls + '">' + formatPct(avg) + '</span>' +
    '</div>';
}

function sidebarRows() {
  const rows = STOCKS.map(item => {
    const stock = getStock(item.id);
    const diff = stock.price - stock.prev;
    const cls = diff >= 0 ? 'up' : 'down';
    const selected = item.id === marketState.selectedStock;
    return '<button class="dashStockRow' + (selected ? ' on' : '') + '" data-stock="' + item.id + '">' +
      '<span class="dashStockName">' + item.name + '<small>' + item.id + '</small></span>' +
      '<span class="dashStockPrice">' + stock.price.toFixed(1) + '<small class="' + cls + '">' + formatPct(diff / Math.max(1, stock.prev)) + '</small></span>' +
      '</button>';
  }).join('');
  return marketIndexSummary() + rows;
}

function tradePanelHtml(stock) {
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
  return '<div class="dashTradeHead"><h3>' + stock.name + '</h3><p>' + stock.id + ' · 持有 ' + holding.qty + ' 股' +
    (short.qty ? ' · 空单 ' + short.qty + ' 股' : '') + '</p></div>' +
    (!canBuy ? '<p class="dashRumorHint warn">金币不够，买 1 股需要 ' + buyCost + ' 金币</p>' : '') +
    '<div class="dashTradeActions">' +
    '<button data-action="buy" data-stock="' + stock.id + '"' + (canBuy ? '' : ' disabled') + '>买 1</button>' +
    '<button class="ghost" data-action="sell" data-stock="' + stock.id + '"' + (canSell ? '' : ' disabled') + '>卖 1</button>' +
    '</div>' +
    '<div class="dashTradeActions">' +
    '<button class="short" data-action="short" data-stock="' + stock.id + '"' + (canShort ? '' : ' disabled') + '>做空 1</button>' +
    '<button class="ghost" data-action="cover" data-stock="' + stock.id + '"' + (canCover ? '' : ' disabled') + '>平仓 1</button>' +
    '</div>' +
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
    '<button class="dashNextDay" data-action="nextDay">下一交易日 · Day ' + marketState.day + '</button>';
}

function rumorPanelHtml(stock) {
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
  const longRows = STOCKS.filter(item => getHolding(item.id).qty > 0);
  const shortRows = STOCKS.filter(item => getShort(item.id).qty > 0);
  if (!longRows.length && !shortRows.length) return '<h3>我的持仓</h3><p class="dashEmpty">还没有持仓，去买点股票吧。</p>';
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
  return '<h3>我的持仓</h3>' + longBody + shortBody;
}

function newsPanelHtml() {
  const rows = marketState.news.slice(-6).reverse().map(news => {
    if (news.isEvent) {
      return '<div class="dashNewsRow dashNewsRow--event"><b>⚡ ' + news.title + '</b>' +
        '<span class="' + (news.bad ? 'down' : 'up') + '">突发事件 · 立即生效</span></div>';
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
    return '<div class="dashNewsRow"><b>' + news.title + '</b>' +
      news.targetStock + ' · 延迟 ' + news.delay + ' 天 · ' +
      '<span style="color:' + src.tone + '">' + src.label + '</span></div>';
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

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(96,244,255,.04)');
  grad.addColorStop(1, 'rgba(96,244,255,.01)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const padL = 54;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const history = stock.history.slice(-24);
  let min = Math.min(...history);
  let max = Math.max(...history);
  if (max - min < Math.max(1, stock.price * 0.03)) {
    const mid = (max + min) / 2;
    const pad = Math.max(1, mid * 0.04);
    min = mid - pad;
    max = mid + pad;
  }
  const span = Math.max(1, max - min);
  const up = history[history.length - 1] >= history[0];
  const tone = up ? '#39ff9c' : '#ff5d75';

  ctx.strokeStyle = 'rgba(96,244,255,.12)';
  ctx.lineWidth = 1;
  ctx.font = '11px monospace';
  ctx.fillStyle = '#c9f7ff';
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
  areaGrad.addColorStop(0, up ? 'rgba(57,255,156,.28)' : 'rgba(255,93,117,.28)');
  areaGrad.addColorStop(1, 'rgba(96,244,255,0)');
  ctx.beginPath();
  ctx.moveTo(points[0][0], padT + plotH);
  points.forEach(p => ctx.lineTo(p[0], p[1]));
  ctx.lineTo(points[points.length - 1][0], padT + plotH);
  ctx.closePath();
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.shadowColor = tone;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = tone;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
  ctx.shadowBlur = 0;

  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.fillStyle = tone;
  ctx.shadowColor = tone;
  ctx.shadowBlur = 14;
  ctx.arc(last[0], last[1], 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function renderScreenPanel(key) {
  activeScreen = key || activeScreen;
  screenPanel.hidden = false;
  const stock = getStock(marketState.selectedStock);
  dashClock.textContent = 'DAY ' + marketState.day;
  dashRep.textContent = '声誉 ' + reputation();
  dashRep.className = 'dashRep ' + (reputation() >= 60 ? 'up' : reputation() <= 30 ? 'down' : '');
  dashSidebar.innerHTML = sidebarRows();
  const diff = stock.price - stock.prev;
  dashMainHead.innerHTML = '<h3>' + stock.name + '</h3>' +
    '<span class="dashPrice ' + (diff >= 0 ? 'up' : 'down') + '">' + stock.price.toFixed(1) + '</span>' +
    '<small class="' + (diff >= 0 ? 'up' : 'down') + '">' + formatPct(diff / Math.max(1, stock.prev)) + '</small>';
  dashTrade.innerHTML = tradePanelHtml(stock);
  dashHoldings.innerHTML = holdingsPanelHtml();
  dashNews.innerHTML = newsPanelHtml();
  const canvas = document.getElementById('chartCanvas');
  if (canvas) drawLineChart(canvas, stock);
}

document.getElementById('returnGame').addEventListener('click', () => {
  saveState();
  window.location.href = '../game.html?from=store';
});
