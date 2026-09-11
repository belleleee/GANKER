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
  const candles = stock.history.slice(-12);
  const min = Math.min(...candles);
  const max = Math.max(...candles);
  const span = Math.max(1, max - min);
  candles.forEach((value, i) => {
    const x = 80 + i * 50;
    const up = !i || value >= candles[i - 1];
    const top = 322 - (value - min) / span * 210;
    const tone = up ? '#39ff9c' : '#ff5d75';
    neonGlow(ctx, tone, 9);
    ctx.strokeStyle = tone;
    ctx.fillStyle = tone;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, top - 28);
    ctx.lineTo(x, top + 70);
    ctx.stroke();
    ctx.fillRect(x - 14, top, 28, 54);
    clearGlow(ctx);
  });
  neonGlow(ctx, 'rgba(255,214,102,.7)', 8);
  ctx.strokeStyle = '#ffd666';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < candles.length; i++) {
    const x = 80 + i * 50;
    const y = 322 - (candles[i] - min) / span * 210 + 24;
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

  put(box(5.4, .08, .10, SCREEN_FRAME_MAT), 0, .9, -.05, 0, 0, 0, rig);
  put(box(5.4, .08, .10, SCREEN_FRAME_MAT), 0, -.86, -.05, 0, 0, 0, rig);
  put(box(1.95, .07, .10, SCREEN_FRAME_MAT), 0, 1.72, -.06, 0, 0, 0, rig);
  for (const x of [-2.5, -1.25, 0, 1.25, 2.5]) {
    put(box(.055, 1.82, .08, SCREEN_FRAME_MAT), x, .02, -.06, 0, 0, 0, rig);
    put(line([[x, .96, -.06], [x, 1.62, -.06]]), 0, 0, 0, 0, 0, 0, rig);
  }
  put(rig, 0, 3.15, -3.2);
}
