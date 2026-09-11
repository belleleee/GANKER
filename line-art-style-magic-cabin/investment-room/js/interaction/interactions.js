function showToast(text, duration) {
  toastText = text;
  toastUntil = performance.now() + (duration || 2600);
}

const INTERACT_HINTS = {
  screen: 'WASD 移动 · 靠近屏幕按 E/点击查看',
  globe: '按 E/点击转动全息球，快进到下一交易日',
  espresso: '按 E/点击煮一杯咖啡（每天一次，声誉 +3）',
  grinder: '按 E/点击磨一磨咖啡豆',
  jar: '按 E/点击看看豆罐里是什么豆子',
  pastry: '按 E/点击打开点心柜看看',
  plant: '按 E/点击给绿植浇点水',
  shelf: '按 E/点击看看置物架',
  menu: '按 E/点击翻一翻今日菜单',
  lamp: '按 E/点击开关吊灯',
  cup: '按 E/点击端起杯子',
  bag: '按 E/点击看看纸袋',
  bookShelf: '按 E/点击翻翻书架',
  bookShelfBook: '按 E/点击抽出这本书',
  stool: '按 E/点击坐下来歇一会',
  teaset: '按 E/点击倒一壶茶'
};

function npcInteractHint(stockId) {
  const holding = getHolding(stockId);
  const stock = STOCKS.find(item => item.id === stockId);
  return holding.qty
    ? '按 E/点击找负责' + (stock ? stock.name : stockId) + '的史莱姆操作'
    : '这个位置还空着 · 买入后会有史莱姆上岗';
}

function stoolSeatInteractHint(seat) {
  if (!seat) return INTERACT_HINTS.stool;
  return '按 E/点击坐下来';
}

function nearestInteractable() {
  const wp = new THREE.Vector3();
  let best = null;
  let bestDist = Infinity;
  screenMeshes.forEach(mesh => {
    mesh.getWorldPosition(wp);
    const d = Math.hypot(wp.x - player.x, wp.z - player.z);
    if (d < INTERACT_RANGE && d < bestDist) {
      bestDist = d;
      best = { kind: 'screen', key: mesh.userData.screenKey };
    }
  });
  interactables.forEach(it => {
    const d = Math.hypot(it.x - player.x, it.z - player.z);
    if (d < it.range && d < bestDist) {
      bestDist = d;
      best = { kind: it.kind, key: it.data };
    }
  });
  return best;
}

function updateInteractionHint() {
  if (!screenPanel.hidden) {
    activeInteractable = null;
    return;
  }
  activeInteractable = nearestInteractable();
  let baseText = 'WASD 移动 · 空格跳 · 拖动看房间 · 滚轮缩放';
  if (activeInteractable) {
    if (activeInteractable.kind === 'npc') baseText = npcInteractHint(activeInteractable.key);
    else if (activeInteractable.kind === 'stoolSeat') baseText = stoolSeatInteractHint(activeInteractable.key);
    else baseText = INTERACT_HINTS[activeInteractable.kind];
  }
  if (hintEl) hintEl.textContent = performance.now() < toastUntil ? toastText : baseText;
}

const HANDLERS = {
  screen: target => renderScreenPanel(target.key),
  globe: interactGlobe,
  npc: target => interactNpc(target.key),
  stoolSeat: target => interactStoolSeat(target.key),
  espresso: interactEspresso,
  grinder: interactGrinder,
  jar: interactJar,
  pastry: interactPastry,
  plant: interactPlant,
  shelf: interactShelf,
  menu: interactMenu,
  lamp: interactLamp,
  cup: target => interactCup(target.key),
  bag: interactBag,
  bookShelf: interactBookShelf,
  bookShelfBook: target => interactBookShelfBook(target.key),
  stool: interactStool,
  teaset: interactTeaset
};

function handleInteract(target) {
  if (!target) return;
  const fn = HANDLERS[target.kind];
  if (fn) fn(target);
}

function interactGlobe() {
  advanceMarketDay();
  showToast('🌐 全息球转动，市场进入了新的一天');
}

function interactNpc(stockId) {
  const stock = STOCKS.find(item => item.id === stockId);
  const holding = getHolding(stockId);
  if (!holding.qty) {
    showToast('这个位置还空着——买一点 ' + (stock ? stock.name : stockId) + ' 就会有史莱姆来负责它');
    return;
  }
  marketState.selectedStock = stockId;
  activeScreen = 'chart';
  saveState();
  renderScreenPanel('chart');
}

function interactStoolSeat(seat) {
  if (!seat) return;
  interactStool({ key: seat });
}

function interactEspresso() {
  triggerProp('espresso', 1.6);
  const day = marketState.day;
  if (state.investment.lastCoffeeDay === day) {
    showToast('☕ 重新煮了一杯，但今天的提神效果已经用掉了');
    return;
  }
  state.investment.lastCoffeeDay = day;
  state.investment.reputation = Math.max(0, Math.min(100, state.investment.reputation + 3));
  showToast('☕ 现磨了一杯浓缩，精神一振，声誉 +3');
  saveState();
}

function interactGrinder() {
  triggerProp('grinder', 1.2);
  showToast('🌰 咖啡豆被磨成了细粉，香气扑面而来');
}

const JAR_QUIPS = ['是埃塞俄比亚的日晒豆', '是巴西的水洗豆，酸度低', '是耶加雪菲，花香明显', '闻起来像是深烘的曼特宁'];

function interactJar() {
  triggerProp('jar', .9);
  const quip = JAR_QUIPS[Math.floor(Math.random() * JAR_QUIPS.length)];
  showToast('🫙 打开罐子看了看，' + quip);
}

function interactPastry() {
  triggerProp('pastry', 1.3);
  if (Math.random() < .3) {
    const bonus = 4 + Math.floor(Math.random() * 8);
    state.coins = Math.min(999999, state.coins + bonus);
    showToast('🥐 顺手拿了块点心，居然在盘子底下翻到 ' + bonus + ' 金币', 3200);
    saveState();
  } else {
    showToast('🥐 打开点心柜看了看，口水都要流下来了');
  }
}

function interactPlant() {
  triggerProp('plant', 1.6);
  showToast('🌿 给绿植浇了点水，叶子精神多了');
}

function interactShelf() {
  triggerProp('shelf', 1.0);
  showToast('📚 架子上摆着几罐豆子和一只纸袋，摆得整整齐齐');
}

function interactMenu() {
  triggerProp('menu', 1.0);
  const special = MENU_SPECIALS[Math.floor(Math.random() * MENU_SPECIALS.length)];
  if (coffeeParts.menu) {
    coffeeParts.menu.texture.userData.draw = (ctx, w, h) => drawMenuTexture(ctx, w, h, special);
    redrawTexture(coffeeParts.menu.texture);
  }
  showToast('📋 翻了翻菜单：' + special);
}

function interactLamp() {
  const lamp = coffeeParts.lamp;
  if (!lamp) return;
  lamp.on = !lamp.on;
  showToast(lamp.on ? '💡 吊灯亮了起来' : '💡 关掉了吊灯');
}

function interactCup(cup) {
  if (cup && cup.userData) cup.userData.run = 1.8;
  showToast('☕ 端起杯子闻了闻，还带着一点温热');
}

function interactBag() {
  showToast('🛍️ 纸袋里装着今天刚烘好的咖啡豆');
}

function interactBookShelf() {
  let changed = 0;
  for (const book of bookshelfBooks) {
    if (Math.random() < .18) {
      book.userData.out = !book.userData.out;
      changed += 1;
    }
  }
  if (!changed && bookshelfBooks.length) {
    const book = bookshelfBooks[Math.floor(Math.random() * bookshelfBooks.length)];
    book.userData.out = !book.userData.out;
  }
  showToast('📚 书架上的几本书轻轻滑动了一下');
}

function interactBookShelfBook(book) {
  if (!book || !book.userData) return;
  if (book.userData.knowledgeId) {
    openKnowledgeCard(book.userData.knowledgeId);
    return;
  }
  book.userData.out = !book.userData.out;
  showToast(book.userData.out ? '📖 抽出了一本投资笔记' : '📖 把书推回了书架');
}

const knowledgePanel = document.getElementById('knowledgePanel');
const closeKnowledgePanel = document.getElementById('closeKnowledgePanel');
const knowledgeKicker = document.getElementById('knowledgeKicker');
const knowledgeTitle = document.getElementById('knowledgeTitle');
const knowledgeBody = document.getElementById('knowledgeBody');

function openKnowledgeCard(id) {
  const card = KNOWLEDGE_CARDS.find(item => item.id === id) || KNOWLEDGE_CARDS[0];
  if (!card || !knowledgePanel) return;
  knowledgeKicker.textContent = 'STUDY CARD · ' + card.id.toUpperCase();
  knowledgeTitle.textContent = card.title;
  knowledgeBody.innerHTML = card.body.map(line => '<p>' + line + '</p>').join('');
  knowledgePanel.hidden = false;
}

function closeKnowledgeCard() {
  if (knowledgePanel) knowledgePanel.hidden = true;
}

if (closeKnowledgePanel) closeKnowledgePanel.addEventListener('click', closeKnowledgeCard);
if (knowledgePanel) {
  knowledgePanel.addEventListener('click', event => {
    if (event.target === knowledgePanel) closeKnowledgeCard();
  });
}

function interactStool(target) {
  const seat = target && target.key;
  if (seat) {
    player.x = seat.x;
    player.z = seat.z;
    player.yaw = seat.yaw;
    player.y = .42;
    player.vy = 0;
    player.onGround = false;
    if (player.mesh) {
      player.mesh.position.set(player.x, player.y, player.z);
      player.mesh.rotation.y = player.yaw;
    }
  }
  triggerProp('stool', 2.4);
  sittingUntil = performance.now() + 2400;
  showToast('🪑 坐下来歇了一会儿');
}

function interactTeaset() {
  potRun = POT_T;
  cupsList.forEach(c => { c.userData.run = 2.6; });
  showToast('🍵 倒了一壶茶');
}
