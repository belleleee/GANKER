const TABLE_TOP_Y = 0.86;
const TABLE_RADIUS = 1.7;
const GLOBE_RADIUS = .58;
const GLOBE_Y = TABLE_TOP_Y + GLOBE_RADIUS + .38;
const COFFEE_X = 3.0;
const COFFEE_Z = 2.7;
const COFFEE_ROT = -Math.PI * .62;
const COFFEE_COUNTER_Y = .905;
const propAnim = {};
const coffeeParts = {};

function triggerProp(id, duration) {
  propAnim[id] = { run: duration, duration };
}

function propProgress(id) {
  const p = propAnim[id];
  if (!p || p.run <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - p.run / p.duration));
}

function coffeeLocalToWorld(dx, dz) {
  const cos = Math.cos(COFFEE_ROT);
  const sin = Math.sin(COFFEE_ROT);
  return { x: COFFEE_X + dx * cos + dz * sin, z: COFFEE_Z - dx * sin + dz * cos };
}

function worldToCoffeeLocal(wx, wz) {
  const cos = Math.cos(COFFEE_ROT);
  const sin = Math.sin(COFFEE_ROT);
  const dx = wx - COFFEE_X;
  const dz = wz - COFFEE_Z;
  return { x: dx * cos - dz * sin, z: dx * sin + dz * cos };
}

const COFFEE_HALF_W = 1.5;
const COFFEE_HALF_D = .55;

function resolveCoffeeCollision(wx, wz) {
  const local = worldToCoffeeLocal(wx, wz);
  if (Math.abs(local.x) >= COFFEE_HALF_W || Math.abs(local.z) >= COFFEE_HALF_D) {
    return { x: wx, z: wz };
  }
  const penX = COFFEE_HALF_W - Math.abs(local.x);
  const penZ = COFFEE_HALF_D - Math.abs(local.z);
  if (penX < penZ) {
    local.x = (local.x < 0 ? -1 : 1) * COFFEE_HALF_W;
  } else {
    local.z = (local.z < 0 ? -1 : 1) * COFFEE_HALF_D;
  }
  return coffeeLocalToWorld(local.x, local.z);
}

const interactables = [];
const stoolMeshes = [];
const clickableMeshes = [];
const bookshelfBooks = [];
let nextKnowledgeBook = 0;
const KNOWLEDGE_CARDS = [
  {
    id: 'market-basic',
    title: '股票是什么',
    short: '买的是一小份公司未来',
    body: [
      '<strong>股票</strong>可以理解成一家公司的一小份所有权。你买下它，不是买一张会自动变贵的票，而是在押注这家公司以后能不能赚更多钱、变得更重要。',
      '股价上涨，通常代表市场更愿意为这家公司付钱；股价下跌，可能是大家变悲观，也可能只是短期情绪太激烈。',
      '在这个房间里，茶业、农场、货运、书籍这些标的都是练习用的虚构公司。它们会受到新闻、市场噪音和玩家买卖影响。',
      '判断一只股票时，可以先问三个问题：它靠什么赚钱？最近有什么消息？现在价格是不是已经把好消息或坏消息算进去了？',
      '最常见的误区是只看今天涨了还是跌了。真正要练的是：价格为什么变、这个变化能不能持续、如果判断错了最多亏多少。'
    ]
  },
  {
    id: 'read-news',
    title: '新闻怎么读',
    short: '消息有延迟，也有真假',
    body: [
      '新闻不会立刻完全反映到价格里。有的消息当天就影响价格，有的会隔一两个交易日才慢慢发酵。',
      '<strong>可信度</strong>越高，新闻影响越接近真实；可信度低的消息可能先带来错误上涨，之后又反噬下跌。',
      '读新闻时要分清三件事：消息说了什么、它影响哪一个标的、影响是短期情绪还是长期收益。',
      '例如“茶叶丰收”可能利好茶业合作社，但如果市场已经提前涨了很多，继续追买就未必划算。',
      '不要只看标题里的好坏词。更重要的是延迟、生效天数、可信度，以及它和屏幕上的价格走势是否互相印证。',
      '游戏里的新闻系统不是答案公布栏，而是线索。玩家能用它提高胜率，但不能靠它做到百分百确定。'
    ]
  },
  {
    id: 'trade-rule',
    title: '买卖与做空',
    short: '低买高卖，也能押下跌',
    body: [
      '<strong>买入</strong>适合你判断价格后面会上涨的时候。买入后，你持有股票，后面价格越高，你的账面市值越高。',
      '<strong>卖出</strong>是把已经持有的股票换回金币。卖出价高于买入均价，你赚钱；卖出价低于买入均价，你亏钱。',
      '<strong>做空</strong>是押价格下跌。可以理解成先借来卖出，之后如果价格跌了，再用更低价格买回来归还，中间差价就是收益。',
      '做空的风险更难直觉理解：如果价格上涨，你需要用更高价格买回来，亏损会扩大，所以不能只因为“涨太多了”就盲目做空。',
      '每次交易前可以先定一个计划：为什么买、目标大概在哪里、如果反方向走到什么程度就认错。',
      '这个房间鼓励小额试错。用一部分金币验证判断，比一次把全部金币压上去更稳定。'
    ]
  },
  {
    id: 'room-guide',
    title: '房间玩法',
    short: '看屏幕、读新闻、做决定',
    body: [
      '这个房间的核心循环是：看行情，读新闻，选择标的，买入或卖出，推进到下一交易日，再复盘结果。',
      '四面大屏负责不同信息：行情屏看整体涨跌，K线屏看走势，自选股屏看你关心的标的，新闻屏提供可能影响价格的线索。',
      '中央桌每个席位都有电脑，对应一个投资标的。买入后，对应席位会出现负责的史莱姆，让房间看起来像一个小小交易团队。',
      '全息球用于推进交易日。推进前最好先检查持仓和新闻，因为价格变化会在新的一天结算。',
      '咖啡角、书架、沙发这些区域不是装饰。它们用来放学习内容、轻交互和节奏缓冲，让投资不是只盯数字。',
      '一个稳妥玩法是：先选两三个你能看懂的标的，小额买入，观察新闻是否兑现，再逐步扩大仓位。'
    ]
  },
  {
    id: 'risk',
    title: '风险控制',
    short: '先活下来，再赚钱',
    body: [
      '<strong>风险控制</strong>的目标不是每次都猜对，而是在猜错时还能继续玩。只要金币没有被一次亏光，就还有修正判断的机会。',
      '不要把所有金币押在同一个标的上。单一新闻可能反转，单一行业也可能同时受到坏消息影响。',
      '看见连续上涨时，后面不一定继续涨；看见价格变便宜，也不代表马上会反弹。便宜和值得买不是一回事。',
      '可以给自己设一个仓位规则：单个标的不要超过总金币的一部分，短期不确定时少买，线索更清楚时再加。',
      '亏损时最危险的是急着翻本。越想立刻赚回来，越容易把一笔小错变成大错。',
      '这个游戏里的市场由基础波动、新闻影响和玩家行为共同组成，所以它既能被部分预测，也保留不可预测性。好的策略不是稳赢，而是长期下来更不容易被一次波动打倒。'
    ]
  }
];

function registerInteractable(x, z, range, kind, data) {
  interactables.push({ x, z, range, kind, data });
}

function registerClickableObject(root, kind, data) {
  root.traverse(child => {
    if (!child.isMesh) return;
    if (child.userData.interactKind) return;
    child.userData.interactKind = kind;
    child.userData.interactData = data === undefined ? null : data;
    clickableMeshes.push(child);
  });
}

function registerStoolSeat(stool, seat, range) {
  registerInteractable(seat.x, seat.z, range || 1.25, 'stoolSeat', seat);
  registerClickableObject(stool, 'stoolSeat', seat);
  stool.traverse(child => {
    if (!child.isMesh) return;
    child.userData.stoolSeat = seat;
    stoolMeshes.push(child);
  });
}

function buildRoundTable() {
  const group = new THREE.Group();
  put(edge(new THREE.CylinderGeometry(TABLE_RADIUS, TABLE_RADIUS, .08, 40), WOOD_MAT), 0, TABLE_TOP_Y, 0, 0, 0, 0, group);
  put(edge(new THREE.CylinderGeometry(TABLE_RADIUS + .03, TABLE_RADIUS + .03, .02, 40), WOOD_DARK_MAT), 0, TABLE_TOP_Y + .05, 0, 0, 0, 0, group);
  put(log(TABLE_TOP_Y - .08, .14), 0, (TABLE_TOP_Y - .08) / 2, 0, 0, 0, 0, group);
  put(edge(new THREE.CylinderGeometry(.46, .5, .05, 32), WOOD_DARK_MAT), 0, .03, 0, 0, 0, 0, group);
  put(group, 0, 0, TABLE_CENTER_Z);
  return group;
}

function buildDeskComputer(stockId) {
  const group = new THREE.Group();
  const texture = canvasTexture(220, 140, (ctx, w, h) => drawSeatChart(ctx, w, h, stockId));
  screenTextures.push(texture);
  put(box(.52, .035, .36, METAL_MAT), 0, .018, 0, 0, 0, 0, group);
  put(box(.36, .018, .08, SCREEN_FRAME_MAT), 0, .045, -.11, 0, 0, 0, group);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(.44, .28),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
  );
  put(screen, 0, .2, -.19, -.62, 0, 0, group);
  put(box(.5, .035, .035, SCREEN_FRAME_MAT), 0, .33, -.26, -.62, 0, 0, group);
  put(box(.035, .31, .035, SCREEN_FRAME_MAT), -.25, .2, -.19, -.62, 0, 0, group);
  put(box(.035, .31, .035, SCREEN_FRAME_MAT), .25, .2, -.19, -.62, 0, 0, group);
  put(box(.2, .012, .09, WOOD_DARK_MAT), 0, .043, .1, 0, 0, 0, group);
  return group;
}

function makeGlowSprite(innerRgb, outerRgb, size) {
  const canvasEl = document.createElement('canvas');
  canvasEl.width = canvasEl.height = 128;
  const ctx = canvasEl.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(' + innerRgb + ',1)');
  grad.addColorStop(.35, 'rgba(' + outerRgb + ',.55)');
  grad.addColorStop(1, 'rgba(' + outerRgb + ',0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvasEl);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  return sprite;
}

function buildHoloGlobe() {
  const group = new THREE.Group();
  const r = GLOBE_RADIUS;

  const haze = makeGlowSprite('255,255,255', '96,244,255', r * 5.2);
  group.add(haze);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(r * .5, 22, 16),
    new THREE.MeshBasicMaterial({ color: 0xeafcff, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(core);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(r, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0x5be6ff, transparent: true, opacity: .28, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(shell);

  const shellOuter = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.22, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0x5be6ff, transparent: true, opacity: .1, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(shellOuter);

  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(r, 18, 12), 12), SCREEN_TRIM_MAT));

  const RING_COLORS = [0x5be6ff, 0xc58bff, 0xffd666];
  const ringMeshes = [];
  RING_COLORS.forEach((color, idx) => {
    const tilt = (idx - 1) * (Math.PI / 3);
    const pts = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * (r + .22), Math.sin(a) * (r + .22) * .32, 0));
    }
    const ringMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: .8, blending: THREE.AdditiveBlending });
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    ring.rotation.x = Math.PI / 2 + tilt;
    ring.rotation.z = tilt * .6;
    group.add(ring);
    ringMeshes.push(ring);
  });

  const beamHeight = GLOBE_Y - TABLE_TOP_Y;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(.05, .22, beamHeight, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x5be6ff, transparent: true, opacity: .14, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  put(beam, 0, TABLE_TOP_Y + beamHeight / 2, TABLE_CENTER_Z);
  put(group, 0, GLOBE_Y, TABLE_CENTER_Z);
  holoGlobe = group;
  holoGlobeFx = { haze, core, shell, shellOuter, rings: ringMeshes };
  registerInteractable(0, TABLE_CENTER_Z, TABLE_RADIUS + 1.0, 'globe', null);
  return group;
}

const animatedSlimes = [];

function buildSimpleSlime(color, idle) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .88 });
  const body = edge(new THREE.SphereGeometry(.24, 20, 14), mat);
  body.scale.set(1, .82, 1);
  put(body, 0, .26, 0, 0, 0, 0, group);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2a24 });
  for (const side of [-1, 1]) {
    put(new THREE.Mesh(new THREE.SphereGeometry(.024, 8, 6), eyeMat), side * .09, .32, .2, 0, 0, 0, group);
  }
  if (idle !== false) animatedSlimes.push({ body, phase: Math.random() * Math.PI * 2 });
  group.userData.body = body;
  return group;
}

function buildStool() {
  const group = new THREE.Group();
  put(edge(new THREE.CylinderGeometry(.16, .16, .05, 20), WOOD_MAT), 0, .42, 0, 0, 0, 0, group);
  put(log(.38, .035), 0, .21, 0, 0, 0, 0, group);
  put(edge(new THREE.CylinderGeometry(.14, .14, .03, 20), WOOD_DARK_MAT), 0, .015, 0, 0, 0, 0, group);
  return group;
}

function buildSofa() {
  const group = new THREE.Group();
  const sofaMat = new THREE.MeshBasicMaterial({ color: 0x8fb0a1 });
  const cushionMat = new THREE.MeshBasicMaterial({ color: 0xb8cfbf });
  const pillowMat = new THREE.MeshBasicMaterial({ color: 0xf0cfaa });
  const throwMat = new THREE.MeshBasicMaterial({ color: 0x6c8c7e });

  put(box(1.75, .18, .58, sofaMat), 0, .32, 0, 0, 0, 0, group);
  put(box(1.9, .62, .16, sofaMat), 0, .55, -.29, -.08, 0, 0, group);
  put(box(.18, .42, .66, sofaMat), -.98, .44, 0, 0, 0, 0, group);
  put(box(.18, .42, .66, sofaMat), .98, .44, 0, 0, 0, 0, group);

  for (const x of [-.47, .47]) {
    put(box(.82, .08, .5, cushionMat), x, .45, .05, 0, 0, 0, group);
    put(box(.72, .3, .08, cushionMat), x, .68, -.24, -.16, 0, 0, group);
  }
  put(box(.42, .23, .08, pillowMat), -.55, .66, -.16, -.22, .12, .05, group);
  put(box(.38, .2, .08, new THREE.MeshBasicMaterial({ color: 0xd6b7c7 })), .55, .63, -.15, -.18, -.18, -.04, group);
  put(box(.52, .035, .32, throwMat), .18, .53, .16, 0, 0, .02, group);

  for (const x of [-.72, .72]) {
    for (const z of [-.22, .23]) {
      put(edge(new THREE.CylinderGeometry(.028, .022, .22, 8), WOOD_DARK_MAT), x, .11, z, 0, 0, 0, group);
    }
  }
  return group;
}

function makeCup(x, y, z, parent) {
  const g = new THREE.Group();
  put(edge(new THREE.CylinderGeometry(.045, .038, .09, 12)), 0, .045, 0, 0, 0, 0, g);
  put(edge(new THREE.TorusGeometry(.03, .008, 6, 12)), .052, .045, 0, 0, 0, 0, g);
  const steam = new THREE.Group();
  for (const off of [-.015, 0, .015]) {
    put(line([[off, 0, 0], [off + .012, .035, .003], [off - .01, .07, -.003], [off + .008, .105, .002]]), 0, 0, 0, 0, 0, 0, steam);
  }
  steam.position.y = .10;
  steam.visible = false;
  g.add(steam);
  put(g, x, y, z, 0, 0, 0, parent);
  g.userData = { run: 0, steam, baseY: y };
  cupsList.push(g);
  return g;
}

function buildTeapot(parent) {
  const scale = .82;
  const body = new THREE.Group();
  const shell = put(edge(new THREE.SphereGeometry(.105 * scale, 14, 11)), 0, .10 * scale, 0, 0, 0, 0, body);
  shell.scale.set(1, .82, 1);
  put(edge(new THREE.CylinderGeometry(.07 * scale, .095 * scale, .03 * scale, 12)), 0, .015 * scale, 0, 0, 0, 0, body);
  put(edge(new THREE.CylinderGeometry(.055 * scale, .068 * scale, .03 * scale, 12)), 0, .185 * scale, 0, 0, 0, 0, body);
  put(edge(new THREE.SphereGeometry(.02 * scale, 8, 6)), 0, .21 * scale, 0, 0, 0, 0, body);
  const arcPts = [];
  for (let i = 0; i <= 10; i++) {
    const a = ((20 + i * 14) * Math.PI) / 180;
    arcPts.push([Math.cos(a) * .115 * scale, .115 * scale + Math.sin(a) * .115 * scale, 0]);
  }
  for (let i = 0; i < arcPts.length - 1; i++) logBetween(arcPts[i], arcPts[i + 1], .011 * scale, body);
  logBetween([0, .07 * scale, .085 * scale], [0, .13 * scale, .145 * scale], .017 * scale, body);
  logBetween([0, .13 * scale, .145 * scale], [0, .175 * scale, .20 * scale], .013 * scale, body);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: .12, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(.16 * scale, 12, 8), haloMat);
  put(halo, 0, .10 * scale, 0, 0, 0, 0, body);
  halo.visible = false;
  const spoutTip = new THREE.Object3D();
  spoutTip.position.set(0, .175 * scale, .20 * scale);
  body.add(spoutTip);
  const pivot = new THREE.Group();
  pivot.add(body);
  put(pivot, 0, 0, 0, 0, 0, 0, parent);
  return { pivot, body, halo, haloMat, spoutTip };
}

function drawSeatChart(ctx, w, h, stockId) {
  const stock = getStock(stockId);
  const holding = getHolding(stockId);
  ctx.fillStyle = '#0a1a20';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(96,244,255,.12)';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const diff = stock.price - stock.prev;
  const up = diff >= 0;
  const tone = up ? '#39ff9c' : '#ff5d75';
  ctx.fillStyle = holding.qty ? '#bfeeff' : '#5f7078';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(stock.id, 8, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = tone;
  ctx.fillText(stock.price.toFixed(1), w - 8, 18);
  ctx.textAlign = 'left';

  const history = stock.history.slice(-16);
  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = Math.max(1, max - min);
  const padT = 26;
  const padB = 8;
  ctx.beginPath();
  history.forEach((value, i) => {
    const x = (w * i) / Math.max(1, history.length - 1);
    const y = padT + (h - padT - padB) * (1 - (value - min) / span);
    if (!i) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = holding.qty ? tone : 'rgba(140,160,168,.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!holding.qty) {
    ctx.fillStyle = 'rgba(140,160,168,.7)';
    ctx.font = '11px monospace';
    ctx.fillText('虚位以待', 8, h - 6);
  }
}

const seatSlimes = {};

function buildSlimeSeats() {
  const seatCount = STOCKS.length;
  const startDeg = -160;
  const spanDeg = 320;
  STOCKS.forEach((item, i) => {
    const deg = startDeg + (spanDeg * i) / (seatCount - 1);
    const a = (deg * Math.PI) / 180;
    const seatR = TABLE_RADIUS + .62;
    const x = Math.sin(a) * seatR;
    const z = TABLE_CENTER_Z - Math.cos(a) * seatR;
    const stool = buildStool();
    put(stool, x, 0, z, 0, a, 0);
    registerStoolSeat(stool, { x, z, yaw: a + Math.PI, stockId: item.id }, 1.35);
    const slime = buildSimpleSlime(SLIME_COLORS[i % SLIME_COLORS.length]);
    put(slime, x, .47, z, 0, a + Math.PI, 0);
    slime.visible = getHolding(item.id).qty > 0;
    seatSlimes[item.id] = slime;

    const computer = buildDeskComputer(item.id);
    const computerR = TABLE_RADIUS - .48;
    const computerX = Math.sin(a) * computerR;
    const computerZ = TABLE_CENTER_Z - Math.cos(a) * computerR;
    put(computer, computerX, TABLE_TOP_Y + .055, computerZ, 0, a + Math.PI, 0);
  });
}

function refreshSeatOccupancy() {
  Object.keys(seatSlimes).forEach(id => {
    seatSlimes[id].visible = getHolding(id).qty > 0;
  });
}

function buildPottedPlant() {
  const g = new THREE.Group();
  const leaves = new THREE.Group();
  const mainLeafMat = new THREE.MeshBasicMaterial({ color: 0x5c8a52, side: THREE.DoubleSide });
  const darkLeafMat = new THREE.MeshBasicMaterial({ color: 0x3f6d43, side: THREE.DoubleSide });
  const lightLeafMat = new THREE.MeshBasicMaterial({ color: 0x79a865, side: THREE.DoubleSide });
  const soilMat = new THREE.MeshBasicMaterial({ color: 0x4b3725 });
  const veinMat = new THREE.LineBasicMaterial({ color: 0x24492c, transparent: true, opacity: .65 });

  put(edge(new THREE.CylinderGeometry(.14, .17, .04, 18), WOOD_DARK_MAT), 0, .02, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.115, .085, .17, 18), PLANT_POT_MAT), 0, .105, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.13, .112, .035, 18), PLANT_POT_MAT), 0, .195, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.095, .09, .014, 18), soilMat), 0, .218, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.062, .072, .045, 10), new THREE.MeshBasicMaterial({ color: 0x6f8f58 })), 0, .248, 0, 0, 0, 0, leaves);

  function makeLeaf(width, length, mat) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(width * .75, length * .22, width * .62, length * .74, 0, length);
    shape.bezierCurveTo(-width * .62, length * .74, -width * .75, length * .22, 0, 0);
    const leaf = edge(new THREE.ShapeGeometry(shape, 18), mat);
    put(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, .01, .002),
        new THREE.Vector3(0, length * .92, .002)
      ]),
      veinMat
    ), 0, 0, 0, 0, 0, 0, leaf);
    for (const side of [-1, 1]) {
      for (let i = 1; i <= 2; i++) {
        const y = length * (.28 + i * .18);
        put(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, y, .003),
            new THREE.Vector3(side * width * (.25 + i * .09), y + length * .11, .003)
          ]),
          veinMat
        ), 0, 0, 0, 0, 0, 0, leaf);
      }
    }
    return leaf;
  }

  const leafSpecs = [
    [.13, .36, -18, .02, .01, darkLeafMat],
    [.11, .31, 34, -.03, .02, lightLeafMat],
    [.12, .34, 92, .01, -.02, mainLeafMat],
    [.10, .29, 154, -.02, -.01, darkLeafMat],
    [.115, .33, 218, .03, .01, lightLeafMat],
    [.09, .26, 276, 0, -.025, mainLeafMat],
    [.085, .24, 58, .01, .005, darkLeafMat],
    [.08, .22, 188, -.01, .012, lightLeafMat]
  ];
  leafSpecs.forEach(([width, length, deg, ox, oz, mat], i) => {
    const a = (deg * Math.PI) / 180;
    const leaf = makeLeaf(width, length, mat);
    const lean = .56 + (i % 3) * .08;
    put(
      leaf,
      Math.cos(a) * .035 + ox,
      .24 + (i % 2) * .012,
      Math.sin(a) * .035 + oz,
      Math.sin(a) * lean,
      a,
      -Math.cos(a) * lean,
      leaves
    );
  });
  g.add(leaves);
  return { group: g, leaves };
}

function buildBeanJar() {
  const g = new THREE.Group();
  const lid = put(edge(new THREE.CylinderGeometry(.052, .052, .02, 12), WOOD_DARK_MAT), 0, .14, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.05, .05, .13, 12), JAR_GLASS_MAT), 0, .065, 0, 0, 0, 0, g);
  put(edge(new THREE.CylinderGeometry(.045, .045, .07, 12), BEAN_MAT), 0, .04, 0, 0, 0, 0, g);
  return { group: g, lid };
}

function buildEspressoMachine() {
  const g = new THREE.Group();
  put(box(.36, .27, .27, METAL_MAT), 0, .135, 0, 0, 0, 0, g);
  put(box(.38, .03, .29, WOOD_DARK_MAT), 0, .285, 0, 0, 0, 0, g);
  const handles = [];
  for (const dx of [-.1, .1]) {
    handles.push(put(edge(new THREE.CylinderGeometry(.018, .018, .09, 10), WOOD_DARK_MAT), dx, .02, .17, Math.PI / 2.4, 0, 0, g));
  }
  put(edge(new THREE.CylinderGeometry(.02, .02, .06, 10), METAL_MAT), .14, .3, 0, 0, 0, 0, g);
  const steam = new THREE.Group();
  for (const off of [-.02, .02]) {
    put(line([[off, 0, 0], [off + .015, .05, .003], [off - .012, .1, -.003], [off + .01, .15, .002]]), 0, 0, 0, 0, 0, 0, steam);
  }
  steam.position.set(0, .3, .1);
  steam.visible = false;
  g.add(steam);
  return { group: g, handles, steam };
}

function buildGrinder() {
  const g = new THREE.Group();
  put(edge(new THREE.CylinderGeometry(.06, .07, .2, 12), METAL_MAT), 0, .10, 0, 0, 0, 0, g);
  const hopper = put(edge(new THREE.ConeGeometry(.055, .09, 12), BEAN_MAT), 0, .245, 0, Math.PI, 0, 0, g);
  return { group: g, hopper };
}

function buildPastryCase() {
  const g = new THREE.Group();
  put(box(.4, .02, .22, WOOD_DARK_MAT), 0, .01, 0, 0, 0, 0, g);
  const lid = new THREE.Group();
  lid.add(edge(new THREE.BoxGeometry(.4, .16, .22), GLASS_MAT));
  lid.position.set(0, .10, 0);
  g.add(lid);
  for (const dx of [-.12, 0, .12]) {
    put(edge(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xe8b979 })), dx, .045, 0, 0, 0, 0, g);
  }
  return { group: g, lid };
}

function buildHangingLamp() {
  const g = new THREE.Group();
  const cordTop = 2.0;
  const shadeY = 1.35;
  const shade = new THREE.Group();
  shade.position.set(0, shadeY, 0);
  put(line([[0, cordTop - shadeY, 0], [0, .08, 0]]), 0, 0, 0, 0, 0, 0, shade);
  put(edge(new THREE.ConeGeometry(.09, .09, 16, 1, true), METAL_MAT), 0, 0, 0, Math.PI, 0, 0, shade);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0x6b5f4a, transparent: true, opacity: .8 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.025, 8, 6), bulbMat);
  put(bulb, 0, -.03, 0, 0, 0, 0, shade);
  const glow = makeGlowSprite('255,236,178', '255,176,72', .62);
  glow.position.set(0, -.08, 0);
  glow.material.opacity = 0;
  shade.add(glow);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffd98f,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(.38, .95, 24, 1, true), beamMat);
  put(beam, 0, -.55, 0, Math.PI, 0, 0, shade);
  g.add(shade);
  return { group: g, shade, bulb, bulbMat, glow, beam, beamMat, on: false };
}

function buildWallShelf() {
  const g = new THREE.Group();
  put(box(1.2, .05, .18, WOOD_MAT), 0, 0, 0, 0, 0, 0, g);
  for (let i = 0; i < 3; i++) {
    const jar = buildBeanJar();
    put(jar.group, -.42 + i * .16, .095, 0, 0, 0, 0, g);
  }
  put(box(.14, .18, .1, PAPER_BAG_MAT), .38, .12, 0, 0, 0, 0, g);
  return { group: g };
}

function buildOriginalBookshelf() {
  const shelf = new THREE.Group();
  const SFW = 1.3;
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xf9f6ed });
  nextKnowledgeBook = 0;
  const bookMats = [
    new THREE.MeshBasicMaterial({ color: 0xb99560 }),
    new THREE.MeshBasicMaterial({ color: 0xd0b27b }),
    new THREE.MeshBasicMaterial({ color: 0x9f7a45 }),
    new THREE.MeshBasicMaterial({ color: 0xc8a46b })
  ];

  put(box(.3, 1.86, .05, frameMat), 0, 1.05, -SFW / 2, 0, 0, 0, shelf);
  put(box(.3, 1.86, .05, frameMat), 0, 1.05, SFW / 2, 0, 0, 0, shelf);
  put(box(.02, 1.86, 1.3, frameMat), -.15, 1.05, 0, 0, 0, 0, shelf);
  for (const sy of [.18, .78, 1.38, 1.95]) {
    put(box(.3, .05, 1.3, frameMat), 0, sy, 0, 0, 0, 0, shelf);
  }

  function drawBookSpineTexture(ctx, w, h, card, color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2e2b24';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.fillStyle = '#fff8e8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 25px "Songti SC","STSong",serif';
    const chars = Array.from(card.title);
    const step = Math.min(35, (h - 96) / Math.max(chars.length, 1));
    const startY = 74;
    chars.forEach((char, index) => {
      ctx.fillText(char, w / 2, startY + index * step);
    });
    ctx.font = 'bold 12px "SF Mono","Menlo",monospace';
    ctx.fillText('CARD', w / 2, h - 30);
    ctx.fillStyle = '#f4e7c8';
    ctx.beginPath();
    ctx.arc(w / 2, 22, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function addBook(z, yBase, h, th) {
    const book = new THREE.Group();
    const mat = bookMats[bookshelfBooks.length % bookMats.length];
    const knowledgeCard = nextKnowledgeBook < KNOWLEDGE_CARDS.length ? KNOWLEDGE_CARDS[nextKnowledgeBook++] : null;
    if (knowledgeCard) {
      const spineColors = ['#58784f', '#6d5b8c', '#8a5a44', '#3f6f7a', '#7a6740'];
      const spineTexture = canvasTexture(92, 420, (ctx, w, hh) => {
        drawBookSpineTexture(ctx, w, hh, knowledgeCard, spineColors[nextKnowledgeBook % spineColors.length]);
      });
      const spineMat = new THREE.MeshBasicMaterial({ map: spineTexture, transparent: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
      put(box(.18, h, th, mat), 0, h / 2, 0, 0, 0, 0, book);
      put(new THREE.Mesh(new THREE.PlaneGeometry(th * .86, h * .88), spineMat), .094, h / 2, 0, 0, Math.PI / 2, 0, book);
    } else {
      put(box(.18, h, th, mat), 0, h / 2, 0, 0, 0, 0, book);
    }
    put(line([[.092, h * .55, -th * .3], [.092, h * .55, th * .3]]), 0, 0, 0, 0, 0, 0, book);
    book.position.set(.02, yBase, z);
    book.userData = { out: false, cur: 0, vel: 0, bx: .02, knowledgeId: knowledgeCard ? knowledgeCard.id : null };
    shelf.add(book);
    bookshelfBooks.push(book);
    registerClickableObject(book, 'bookShelfBook', book);
  }

  const HS = [.36, .30, .40, .33, .27, .38, .31, .35, .29, .37, .34, .28];
  const TS = [.07, .06, .075, .065, .07, .062, .072];
  let hi = 0;
  let ti = 0;
  for (const row of [
    { y: .205, z0: -.57, z1: .55 },
    { y: .805, z0: -.57, z1: .07 },
    { y: 1.405, z0: -.57, z1: .55 }
  ]) {
    let z = row.z0;
    while (z < row.z1 - .07) {
      const h = HS[hi++ % HS.length];
      const th = TS[ti++ % TS.length];
      addBook(z + th / 2, row.y, h, th);
      z += th + .012;
    }
  }

  return shelf;
}

const MENU_SPECIALS = [
  '今日特惠：拿铁买一送一',
  '今日特惠：摩卡 -5 元',
  '今日推荐：新到手冲豆',
  '今日特惠：第二杯半价',
  '今日推荐：焦糖玛奇朵回归'
];

function drawMenuTexture(ctx, w, h, special) {
  ctx.fillStyle = '#1c1c1c';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = '#f2e6c9';
  ctx.font = 'bold 22px "Songti SC","STSong",serif';
  ctx.fillText('今日咖啡', 20, 40);
  const rows = [['美式 ¥18'], ['拿铁 ¥22'], ['卡布奇诺 ¥22'], ['摩卡 ¥24']];
  ctx.font = '15px monospace';
  rows.forEach((r, i) => ctx.fillText(r[0], 20, 76 + i * 28));
  ctx.font = 'bold 13px "Songti SC",serif';
  ctx.fillStyle = '#ffd666';
  ctx.fillText(special || '', 20, h - 34);
  ctx.font = 'italic 12px serif';
  ctx.fillStyle = '#c9a877';
  ctx.fillText('Good Coffee, Better Decisions.', 20, h - 14);
}

function buildMenuBoard() {
  const texture = canvasTexture(300, 220, (ctx, w, h) => drawMenuTexture(ctx, w, h, MENU_SPECIALS[0]));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.5, .37), new THREE.MeshBasicMaterial({ map: texture }));
  return { group: mesh, mesh, texture };
}

function regCoffeePart(dx, dz, range, kind, data) {
  const w = coffeeLocalToWorld(dx, dz);
  registerInteractable(w.x, w.z, Math.max(range || 0, 1.25), kind, data === undefined ? null : data);
}

function coffeeLocalDirToWorld(dx, dz) {
  const cos = Math.cos(COFFEE_ROT);
  const sin = Math.sin(COFFEE_ROT);
  return { x: dx * cos + dz * sin, z: -dx * sin + dz * cos };
}

function coffeeSeatData(dx, dz) {
  const pos = coffeeLocalToWorld(dx, dz);
  const dir = coffeeLocalDirToWorld(0, -1);
  return { x: pos.x, z: pos.z, yaw: Math.atan2(dir.x, dir.z) };
}

function buildCoffeeCorner() {
  const group = new THREE.Group();
  const counterW = 2.6;
  const counterD = .6;
  const counterY = COFFEE_COUNTER_Y;

  put(box(counterW, .85, counterD, WOOD_MAT), 0, .425, 0, 0, 0, 0, group);
  put(box(counterW + .06, .06, counterD + .05, WOOD_DARK_MAT), 0, .875, 0, 0, 0, 0, group);

  const plant = buildPottedPlant();
  put(plant.group, -1.35, counterY, -.05, 0, 0, 0, group);
  coffeeParts.plant = plant;
  regCoffeePart(-1.35, -.05, .6, 'plant');
  registerClickableObject(plant.group, 'plant');

  const espresso = buildEspressoMachine();
  put(espresso.group, -.95, counterY, -.08, 0, 0, 0, group);
  coffeeParts.espresso = espresso;
  regCoffeePart(-.95, -.08, .6, 'espresso');
  registerClickableObject(espresso.group, 'espresso');

  const grinder = buildGrinder();
  put(grinder.group, -.5, counterY, -.08, 0, 0, 0, group);
  coffeeParts.grinder = grinder;
  regCoffeePart(-.5, -.08, .55, 'grinder');
  registerClickableObject(grinder.group, 'grinder');

  const jar1 = buildBeanJar();
  put(jar1.group, -.15, counterY, -.08, 0, 0, 0, group);
  const jar2 = buildBeanJar();
  put(jar2.group, 0, counterY, -.08, 0, 0, 0, group);
  coffeeParts.jars = [jar1, jar2];
  regCoffeePart(-.08, -.08, .55, 'jar');
  registerClickableObject(jar1.group, 'jar');
  registerClickableObject(jar2.group, 'jar');

  const paperBag = put(box(.12, .17, .08, PAPER_BAG_MAT), .18, counterY + .085, -.08, 0, 0, 0, group);
  regCoffeePart(.18, -.08, .55, 'bag');
  registerClickableObject(paperBag, 'bag');

  const pastry = buildPastryCase();
  put(pastry.group, 1.0, counterY, .02, 0, 0, 0, group);
  coffeeParts.pastry = pastry;
  regCoffeePart(1.0, .02, .6, 'pastry');
  registerClickableObject(pastry.group, 'pastry');

  const cupSlots = [[.42, .16], [.56, .18], [.7, .12]];
  cupSlots.forEach(([dx, dz]) => {
    const cup = makeCup(dx, counterY, dz, group);
    regCoffeePart(dx, dz, .55, 'cup', cup);
    registerClickableObject(cup, 'cup', cup);
  });
  cupTargetRef = cupsList[cupsList.length - 2];

  potBaseX = .6;
  potBaseZ = .05;
  potRy = Math.atan2(cupSlots[1][0] - potBaseX, cupSlots[1][1] - potBaseZ);
  const teapot = buildTeapot(group);
  put(teapot.pivot, potBaseX, counterY, potBaseZ, 0, potRy, 0, group);
  teapotPivot = teapot.pivot;
  teapotBody = teapot.body;
  potHalo = teapot.halo;
  potHaloMat = teapot.haloMat;
  potSpoutTip = teapot.spoutTip;
  regCoffeePart(potBaseX, potBaseZ, .75, 'teaset');
  registerClickableObject(teapot.pivot, 'teaset');

  potStreamGeom = new THREE.BufferGeometry();
  potStreamGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 3), 3));
  potStream = new THREE.Line(potStreamGeom, new THREE.LineBasicMaterial({ color: 0x7db8dd }));
  potStream.frustumCulled = false;
  potStream.visible = false;
  scene.add(potStream);

  const shelf = buildWallShelf();
  put(shelf.group, -.2, 1.4, -.5, 0, 0, 0, group);
  coffeeParts.shelf = shelf;
  regCoffeePart(-.2, -.5, .6, 'shelf');
  registerClickableObject(shelf.group, 'shelf');

  const menu = buildMenuBoard();
  put(menu.mesh, .8, 1.55, -.5, 0, 0, 0, group);
  coffeeParts.menu = menu;
  regCoffeePart(.8, -.5, .6, 'menu');
  registerClickableObject(menu.mesh, 'menu');

  const lamp = buildHangingLamp();
  put(lamp.group, -.72, .12, -.38, 0, 0, 0, group);
  coffeeParts.lamp = lamp;
  regCoffeePart(-.72, -.38, .95, 'lamp');
  registerClickableObject(lamp.group, 'lamp');

  const stoolA = buildStool();
  const stoolB = buildStool();
  put(stoolA, -.3, 0, .8, 0, Math.PI, 0, group);
  put(stoolB, .4, 0, .8, 0, Math.PI, 0, group);
  registerStoolSeat(stoolA, coffeeSeatData(-.3, .8), .9);
  registerStoolSeat(stoolB, coffeeSeatData(.4, .8), .9);

  put(group, COFFEE_X, 0, COFFEE_Z, 0, COFFEE_ROT, 0);
}

function buildLoungeSofa() {
  const sofa = buildSofa();
  const x = -3.0;
  const z = 2.15;
  const yaw = Math.PI / 2;
  put(sofa, x, 0, z, 0, yaw, 0);
  registerStoolSeat(sofa, { x: x + .18, z, yaw: Math.PI / 2 }, 1.25);
}

function buildRoomBookshelf() {
  const shelf = buildOriginalBookshelf();
  put(shelf, -3.72, 0, -2.75, 0, 0, 0);
  registerInteractable(-3.62, -2.75, 1.25, 'bookShelf', null);
  registerClickableObject(shelf, 'bookShelf', null);
}
