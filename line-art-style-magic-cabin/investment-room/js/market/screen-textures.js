function neonGlow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx) {
  ctx.shadowBlur = 0;
}

function readableText(ctx, text, x, y, color, font, align) {
  clearGlow(ctx);
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(2,7,9,.92)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawPanelBase(ctx, w, h, title) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0c1e24');
  grad.addColorStop(1, '#03080a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(96,244,255,.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(180,250,255,.045)';
  ctx.lineWidth = 1;
  for (let y = 1; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  neonGlow(ctx, 'rgba(96,244,255,.9)', 16);
  ctx.fillStyle = '#8ff3ff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('// ' + title, 30, 42);
  clearGlow(ctx);

  ctx.strokeStyle = 'rgba(96,244,255,.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 54);
  ctx.lineTo(w - 28, 54);
  ctx.stroke();

  readableText(ctx, 'SYS · LIVE', w - 30, 30, '#c9f7ff', 'bold 13px "Menlo","Consolas",monospace', 'right');
  ctx.textAlign = 'left';
}

function drawMarketScreen(ctx, w, h) {
  drawPanelBase(ctx, w, h, '市场行情');
  STOCKS.slice(0, 5).forEach((item, i) => {
    const stock = getStock(item.id);
    const y = 96 + i * 50;
    const diff = stock.price - stock.prev;
    const up = diff >= 0;
    const tone = up ? '#39ff9c' : '#ff5d75';
    ctx.fillStyle = i % 2 ? 'rgba(96,244,255,.055)' : 'rgba(255,255,255,.025)';
    ctx.fillRect(24, y - 29, w - 48, 38);
    readableText(ctx, item.name.slice(0, 5), 38, y, '#e7fbff', 'bold 23px "Songti SC","STSong",serif');
    neonGlow(ctx, tone, 10);
    readableText(ctx, stock.price.toFixed(1), 290, y, tone, 'bold 24px "Menlo","Consolas",monospace', 'right');
    readableText(ctx, formatPct(diff / Math.max(1, stock.prev)), 405, y, tone, 'bold 21px "Menlo","Consolas",monospace', 'right');
    const history = stock.history.slice(-10);
    const lo = Math.min(...history);
    const hi = Math.max(...history);
    ctx.beginPath();
    for (let k = 0; k < history.length; k++) {
      const x = 545 + k * 17;
      const yy = y + 8 - (history[k] - lo) / Math.max(1, hi - lo) * 28;
      if (!k) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.strokeStyle = tone;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    clearGlow(ctx);
  });
}

function drawCandleScreen(ctx, w, h) {
  drawPanelBase(ctx, w, h, 'K线图');
  const stock = getStock(marketState.selectedStock);
  neonGlow(ctx, 'rgba(96,244,255,.7)', 8);
  ctx.fillStyle = '#c9f7ff';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(stock.name + '  DAY ' + marketState.day, 32, 78);
  clearGlow(ctx);
  const history = stock.history.slice(-13);
  const candles = [];
  for (let i = 1; i < history.length; i++) {
    const open = history[i - 1];
    const close = history[i];
    const spread = Math.max(.25, Math.abs(close - open) * .55);
    candles.push({
      open,
      close,
      high: Math.max(open, close) + spread,
      low: Math.max(1, Math.min(open, close) - spread)
    });
  }
  const prices = candles.flatMap(c => [c.high, c.low]);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(1, max - min);
  const priceY = value => 322 - (value - min) / span * 210;
  candles.forEach((candle, i) => {
    const x = 80 + i * 50;
    const up = candle.close >= candle.open;
    const tone = up ? '#39ff9c' : '#ff5d75';
    const openY = priceY(candle.open);
    const closeY = priceY(candle.close);
    const highY = priceY(candle.high);
    const lowY = priceY(candle.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyH = Math.max(8, Math.abs(closeY - openY));
    neonGlow(ctx, tone, 9);
    ctx.strokeStyle = tone;
    ctx.fillStyle = tone;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();
    ctx.fillRect(x - 14, bodyTop, 28, bodyH);
    clearGlow(ctx);
  });
  neonGlow(ctx, 'rgba(255,214,102,.7)', 8);
  ctx.strokeStyle = '#ffd666';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < candles.length; i++) {
    const x = 80 + i * 50;
    const y = priceY(candles[i].close);
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  clearGlow(ctx);
}

function drawWatchScreen(ctx, w, h) {
  drawPanelBase(ctx, w, h, '自选股');
  STOCKS.forEach((item, i) => {
    const stock = getStock(item.id);
    const holding = getHolding(item.id);
    const diff = stock.price - stock.prev;
    const y = 92 + i * 46;
    const up = diff >= 0;
    const tone = up ? '#39ff9c' : '#ff5d75';
    ctx.fillStyle = i % 2 ? 'rgba(96,244,255,.05)' : 'rgba(255,255,255,.02)';
    ctx.fillRect(34, y - 30, w - 68, 38);
    readableText(ctx, item.id, 62, y, '#e7fbff', 'bold 24px "Menlo","Consolas",monospace');
    readableText(ctx, stock.price.toFixed(0), 180, y, '#c9f7ff', 'bold 21px "Menlo","Consolas",monospace');
    neonGlow(ctx, tone, 8);
    readableText(ctx, formatPct(diff / Math.max(1, stock.prev)), 315, y, tone, 'bold 20px "Menlo","Consolas",monospace', 'right');
    clearGlow(ctx);
    readableText(ctx, 'x' + holding.qty, 440, y, '#8ff3ff', 'bold 19px "Menlo","Consolas",monospace', 'right');
  });
}

function drawNewsScreen(ctx, w, h) {
  drawPanelBase(ctx, w, h, '新闻资讯');
  const lines = marketState.news.slice(-4);
  ctx.font = 'bold 24px monospace';
  lines.forEach((news, i) => {
    const title = news.isEvent ? '⚡ ' + news.title : (news.isExposeNotice ? '📢 ' + news.title : (news.isPlayerRumor ? '🤫 ' + news.title : news.title));
    readableText(ctx, title, 60, 108 + i * 62, i % 2 ? '#d9f9ff' : '#ffffff', 'bold 24px "Songti SC","STSong",serif');
    ctx.font = 'bold 18px monospace';
    if (news.isEvent) {
      const tone = news.bad ? '#ff5d75' : '#39ff9c';
      readableText(ctx, '突发事件 / 立即生效', 60, 136 + i * 62, tone, 'bold 18px "Songti SC","STSong",serif');
    } else if (news.isExposeNotice) {
      readableText(ctx, '造谣者声誉受损', 60, 136 + i * 62, '#ff5d75', 'bold 18px "Songti SC","STSong",serif');
    } else if (news.isPlayerRumor) {
      const tone = !news.resolved ? '#c58bff' : (news.exposed ? '#ff5d75' : '#39ff9c');
      const status = !news.resolved ? '尚未验证' : (news.exposed ? '已被揭穿' : '悄悄生效');
      readableText(ctx, '你散布的消息 / ' + status, 60, 136 + i * 62, tone, 'bold 18px "Songti SC","STSong",serif');
    } else {
      const src = NEWS_SOURCES.find(s => s.id === news.source) || NEWS_SOURCES[0];
      readableText(ctx, news.targetStock + ' / 延迟' + news.delay + '天 / ' + src.label, 60, 136 + i * 62, '#d7f7ff', 'bold 18px "Songti SC","STSong",serif');
    }
    clearGlow(ctx);
    ctx.font = 'bold 24px monospace';
  });
}

function drawPnlScreen(ctx, w, h) {
  drawPanelBase(ctx, w, h, '盈亏总览');
  const data = investmentPnlSummary();
  const totalUp = data.totalPnl >= 0;
  const totalTone = totalUp ? '#39ff9c' : '#ff5d75';
  const signed = value => (value >= 0 ? '+' : '') + value;

  readableText(ctx, '总盈亏', 46, 108, '#d7f7ff', 'bold 27px "Songti SC","STSong",serif');
  neonGlow(ctx, totalTone, 18);
  readableText(ctx, signed(data.totalPnl), w - 52, 112, totalTone, 'bold 46px "Menlo","Consolas",monospace', 'right');
  clearGlow(ctx);

  const rows = [
    ['持仓浮盈亏', data.longPnl],
    ['空单浮盈亏', data.shortPnl],
    ['已实现盈亏', data.realized]
  ];
  rows.forEach((row, i) => {
    const y = 178 + i * 54;
    const tone = row[1] >= 0 ? '#39ff9c' : '#ff5d75';
    ctx.fillStyle = i % 2 ? 'rgba(96,244,255,.045)' : 'rgba(255,255,255,.025)';
    ctx.fillRect(42, y - 32, w - 84, 40);
    readableText(ctx, row[0], 62, y, '#e7fbff', 'bold 23px "Songti SC","STSong",serif');
    readableText(ctx, signed(row[1]), w - 62, y, tone, 'bold 27px "Menlo","Consolas",monospace', 'right');
  });

  ctx.strokeStyle = 'rgba(96,244,255,.22)';
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(46, h - 76);
  ctx.lineTo(w - 46, h - 76);
  ctx.stroke();
  ctx.setLineDash([]);
  readableText(ctx, '持仓市值 ' + data.longValue + ' · 空单市值 ' + data.shortMarket, 52, h - 36, '#9eeef8', 'bold 19px "Songti SC","STSong",serif');
}

function buildFourScreenRig() {
  const rig = new THREE.Group();
  const main = chartScreen(2.55, 1.5, drawCandleScreen, 'chart');
  put(main, 0, 0, 0, 0, 0, 0, rig);
  const left = chartScreen(1.55, 1.45, drawMarketScreen, 'market');
  put(left, -2.08, .03, -.18, 0, .55, 0, rig);
  const right = chartScreen(1.55, 1.45, drawWatchScreen, 'watch');
  put(right, 2.08, .03, -.18, 0, -.55, 0, rig);
  const top = chartScreen(1.75, .82, drawNewsScreen, 'news');
  put(top, 0, 1.23, -.08, 0, 0, 0, rig);
  const pnl = chartScreen(1.75, .82, drawPnlScreen, 'pnl');
  put(pnl, 0, -1.23, -.08, 0, 0, 0, rig);

  put(box(5.4, .08, .10, SCREEN_FRAME_MAT), 0, .9, -.05, 0, 0, 0, rig);
  put(box(5.4, .08, .10, SCREEN_FRAME_MAT), 0, -.86, -.05, 0, 0, 0, rig);
  put(box(1.95, .07, .10, SCREEN_FRAME_MAT), 0, 1.72, -.06, 0, 0, 0, rig);
  put(box(1.95, .07, .10, SCREEN_FRAME_MAT), 0, -1.72, -.06, 0, 0, 0, rig);
  for (const x of [-2.5, -1.25, 0, 1.25, 2.5]) {
    put(box(.055, 1.82, .08, SCREEN_FRAME_MAT), x, .02, -.06, 0, 0, 0, rig);
    put(line([[x, .96, -.06], [x, 1.62, -.06]]), 0, 0, 0, 0, 0, 0, rig);
  }
  put(rig, 0, 3.15, -3.2);
}
