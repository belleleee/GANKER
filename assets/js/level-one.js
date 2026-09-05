document.addEventListener("DOMContentLoaded", function () {
  var game = document.querySelector("#zqh-level");
  if (!game) return;

  var endingThreshold = 800;
  var saveLevelId = "level1";
  var saveSystem = window.FortuneSave || null;
  var canvas = game.querySelector("[data-canvas-map]");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var canvasSize = { width: 1280, height: 720 };
  var state = initialState();
  var nodes = [
    { left: 31, top: 55 }, { left: 18, top: 51 }, { left: 44, top: 49 },
    { left: 57, top: 42 }, { left: 78, top: 52 }, { left: 68, top: 43 }, { left: 91, top: 52 }
  ];
  var scenes = [
    {
      id: "stall-prelude", year: "返城过渡 · 1987", title: "代销小摊", fullTitle: "三轮车代销", type: "stall",
      copy: "蹬三轮车代销汽水、棒冰和文具。先把小摊做起来，攒够第一桶金，再去争取承包经销部的机会。"
    },
    {
      id: "contract", year: "场景1 · 1987", title: "承包谈判", type: "duel",
      copy: "文教局要对下属经销部实行承包。别人报四万、五万，你盘算一夜，决定喊出一个所有人都觉得疯了的数字。",
      player: [{ name: "肯吃苦", power: 7 }, { name: "敢承诺", power: 9 }, { name: "懂门路", power: 8 }],
      opponent: [{ name: "资历", power: 8 }, { name: "关系户背景", power: 9 }, { name: "保守稳妥", power: 7 }],
      win: "'10万元。'你说出这个数字时，办公室里安静了两秒。机会落到你手里。",
      lose: "你没有完全压住竞争者，但文教局还是看见了你的胆量。机会来得更艰难。"
    },
    {
      id: "ads", year: "场景2 · 1988", title: "电视广告", fullTitle: "广告豪赌", type: "event",
      copy: "杭州电视台开出21万元广告费，这几乎是全部家底。签下去，可能一夜翻身，也可能就此关门。",
      options: [
        { label: "签下广告合同，All in", successRate: .68, success: { cash: 5, reputation: 18, text: "广告打响后订单剧增，账面现金翻了数倍。" }, fail: { cash: .35, reputation: -6, text: "广告没有立刻回本。靠着序章里攒下的韧劲，你撑过了最难的几周。" } },
        { label: "保守做法，靠口碑慢慢积累", effect: { cash: 1.5, reputation: 4, text: "增长稳定，但速度不够惊人。你保住了现金，也错过了一次爆发。" } }
      ]
    },
    {
      id: "factory", year: "场景3 · 1991", title: "兼并国企", type: "event",
      copy: "杭州罐头厂，2200多名职工，资不抵债。你自己的厂只有140人。面前三条路，每一条都牵动未来。",
      options: [
        { label: "联营：低风险低回报", effect: { cash: 1.2, reputation: 0, text: "你稳住了节奏，但资源整合有限。" } },
        { label: "租赁：稳妥接手", effect: { cash: 1.4, reputation: 5, text: "团队看见了你的管理能力，声誉稳步上升。" } },
        { label: "有偿兼并：承担8000万风险", effect: { cash: .72, reputation: 15, bonus: "factory", text: "短期压力陡增，但你拿到了未来大战真正需要的产能和班底。" } }
      ]
    },
    {
      id: "cola", year: "场景4 · 1998", title: "非常可乐", fullTitle: "非常可乐大战两乐", type: "duel",
      copy: "七个中国品牌倒在两乐脚下，业界说这是'水淹七军'。你偏要用价格、渠道和本土口味打一场侧翼战。",
      player: [{ name: "价格优势", power: 8 }, { name: "联销体渠道", power: 9 }, { name: "本土口味", power: 7 }],
      opponent: [{ name: "品牌积淀", power: 9 }, { name: "资金实力", power: 9 }, { name: "一二线渠道", power: 7 }],
      win: "'非常可乐，中国人自己的可乐！'这句话喊出去后，下沉市场先动了起来。",
      lose: "正面硬拼并不轻松，但你守住了下沉市场的基本盘。"
    },
    {
      id: "danone", year: "场景5 · 2007", title: "达能之争", type: "clue",
      copy: "合作十年的外方股东突然翻出合同，想用40亿低价拿走你亲手做大的资产。你必须一字一句看清陷阱。",
      clauses: [
        { text: "双方共同享有合资公司的正常经营收益。", trap: false },
        { text: "如需商标转让，须提交合资公司董事会审议。", trap: true },
        { text: "外方可优先收购与合资公司同类业务相关资产。", trap: true },
        { text: "投资款项将按约定分期到位。", trap: false },
        { text: "双方应保持现有品牌市场秩序。", trap: false }
      ]
    },
    {
      id: "network", year: "场景6 · 收尾", title: "联销体", fullTitle: "联销体推行遇阻", type: "event",
      copy: "你想把'先打款后发货'定成规矩，几乎所有经销商都在反对。现金流、信任和渠道秩序，全压在这一步。",
      options: [
        { label: "强硬推行到底", effect: { cash: 2, reputation: -8, text: "短期骂声很多，但现金流稳住了，网络变得坚硬。" } },
        { label: "部分妥协，逐步推行", effect: { cash: 1.3, reputation: 3, text: "关系更平稳，渠道扩张速度也更慢。" } }
      ]
    }
  ];

  function initialState() {
    return { cash: 40, reputation: 10, resilience: 2, negotiation: 1, sceneIndex: 0, completed: {}, pendingBonus: null, movingTimer: null, stageCleanup: null, player: { left: 7, top: 63 } };
  }
  function restoreState(save) {
    var next = initialState();
    if (!save) return next;
    next.cash = typeof save.cash === "number" ? save.cash : next.cash;
    next.reputation = typeof save.reputation === "number" ? save.reputation : next.reputation;
    next.resilience = typeof save.resilience === "number" ? save.resilience : next.resilience;
    next.negotiation = typeof save.negotiation === "number" ? save.negotiation : next.negotiation;
    next.sceneIndex = typeof save.sceneIndex === "number" ? Math.min(save.sceneIndex, scenes.length) : next.sceneIndex;
    next.completed = save.completedScenes || {};
    next.pendingBonus = save.pendingBonus || null;
    if (save.player && typeof save.player.left === "number" && typeof save.player.top === "number") next.player = save.player;
    return next;
  }
  function serializeState() {
    return {
      cash: state.cash,
      reputation: state.reputation,
      resilience: state.resilience,
      negotiation: state.negotiation,
      sceneIndex: state.sceneIndex,
      completedScenes: state.completed,
      pendingBonus: state.pendingBonus,
      player: state.player
    };
  }
  function saveProgress() {
    if (saveSystem) saveSystem.saveLevel(saveLevelId, serializeState());
  }
  function formatCash(value) { return "¥" + Math.max(0, Math.round(value)); }
  function pxX(percent) { return percent / 100 * canvasSize.width; }
  function pxY(percent) { return percent / 100 * canvasSize.height; }
  function rect(x, y, width, height, color) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }
  function text(value, x, y, size, color, align) {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = "700 " + size + "px 'Courier New', monospace";
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(value, Math.round(x), Math.round(y));
  }
  function drawCloud(x, y, scale) {
    rect(x, y + 10 * scale, 70 * scale, 14 * scale, "#eef8eb");
    rect(x + 16 * scale, y, 36 * scale, 12 * scale, "#eef8eb");
    rect(x + 48 * scale, y + 4 * scale, 46 * scale, 10 * scale, "#d9ebdd");
  }
  function drawBuilding(x, y, width, height, color, roof) {
    rect(x, y, width, height, "#17242d");
    rect(x + 6, y + 6, width - 12, height - 6, color);
    rect(x - 8, y - 14, width + 16, 16, "#17242d");
    rect(x - 2, y - 10, width + 4, 10, roof);
    for (var row = y + 20; row < y + height - 18; row += 30) {
      for (var col = x + 16; col < x + width - 16; col += 34) {
        rect(col, row, 16, 18, "#8bd2df");
        rect(col + 3, row + 3, 5, 12, "#356b7b");
      }
    }
  }
  function drawCanvasNode(scene, index) {
    var node = nodes[index];
    var x = pxX(node.left);
    var y = pxY(node.top);
    var completed = Boolean(state.completed[scene.id]);
    var unlocked = index === state.sceneIndex;
    var locked = index > state.sceneIndex;
    var fill = completed ? "#47715a" : unlocked ? "#c7623e" : "#203a35";
    if (locked) fill = "#4b5550";
    rect(x - 64, y - 26, 128, 52, "#17242d");
    rect(x - 58, y - 20, 116, 40, fill);
    rect(x - 72, y + 26, 14, 42, "#17242d");
    rect(x - 68, y + 26, 6, 42, "#6d472d");
    rect(x - 47, y - 10, 24, 24, locked ? "#8d8a70" : "#e6b85a");
    text(String(index + 1), x - 35, y + 2, 16, "#17242d", "center");
    text(scene.title, x + 8, y - 1, 16, locked ? "#b9b49b" : "#fff0bf", "center");
    if (unlocked && !completed) {
      rect(x - 66, y - 28, 132, 4, "#fff0bf");
      rect(x - 66, y + 24, 132, 4, "#fff0bf");
    }
  }
  function drawCanvasPlayer() {
    var x = pxX(state.player.left);
    var y = pxY(state.player.top);
    rect(x - 10, y - 48, 20, 20, "#17242d");
    rect(x - 6, y - 44, 12, 12, "#e5a06f");
    rect(x - 14, y - 28, 28, 34, "#17242d");
    rect(x - 10, y - 24, 13, 26, "#7b4a31");
    rect(x + 3, y - 24, 7, 26, "#e5d5a8");
  }
  function drawCanvasMap() {
    if (!ctx) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.imageSmoothingEnabled = false;
    rect(0, 0, canvasSize.width, canvasSize.height, "#78ccef");
    drawCloud(86, 54, 1);
    drawCloud(610, 62, 1.2);
    drawCloud(960, 96, 1.5);
    rect(0, 258, canvasSize.width, 120, "#7fc96d");
    rect(0, 236, 360, 90, "#5b9d7c");
    rect(870, 222, 410, 122, "#5d9c7c");
    rect(0, 356, canvasSize.width, 118, "#bb8550");
    for (var stone = 0; stone < 38; stone += 1) {
      rect(stone * 38, 417 + (stone % 2) * 18, 26, 8, "#d3a671");
    }
    drawBuilding(84, 270, 170, 142, "#e1b16f", "#a84d3c");
    drawBuilding(322, 332, 160, 80, "#965f3b", "#d6d0a2");
    drawBuilding(570, 200, 190, 220, "#7fa3ad", "#d4d7cd");
    drawBuilding(840, 272, 174, 140, "#c7b080", "#d4c59a");
    drawBuilding(1072, 290, 160, 122, "#9a563a", "#c56742");
    rect(0, 474, canvasSize.width, 74, "#a57d58");
    for (var tile = 0; tile < 44; tile += 1) {
      rect(tile * 32, 508, 18, 5, "#c7a07a");
    }
    rect(0, 548, canvasSize.width, 62, "#355d44");
    rect(0, 610, canvasSize.width, 110, "#193946");
    scenes.forEach(drawCanvasNode);
    drawCanvasPlayer();
    text("返城之后，先从一单单小生意开始。", 38, 600, 18, "#fff0bf");
    text("蹬起三轮车，再走向六个关键选择。", 38, 646, 36, "#fff0bf");
  }
  function updateHud() {
    game.querySelector("[data-cash]").textContent = formatCash(state.cash);
    game.querySelector("[data-reputation]").textContent = state.reputation;
    game.querySelector("[data-progress]").textContent = Object.keys(state.completed).length + "/" + scenes.length;
    drawCanvasMap();
  }
  function updateTip() {
    var sceneIndex = getNearbySceneIndex();
    var tip = game.querySelector("[data-tip]");
    if (sceneIndex >= 0) tip.textContent = "按 E 进入：" + (scenes[sceneIndex].fullTitle || scenes[sceneIndex].title);
    else tip.textContent = "用 WASD / 方向键探索地图，走到已解锁地点附近按 E。";
  }
  function placePlayer() {
    var player = game.querySelector("[data-player]");
    player.style.left = state.player.left + "%";
    player.style.top = state.player.top + "%";
    updateTip();
    drawCanvasMap();
  }
  function getNearbySceneIndex() {
    if (game.querySelector("[data-stage]").hidden === false || game.querySelector("[data-ending]").hidden === false) return -1;
    for (var index = 0; index < scenes.length; index += 1) {
      var dx = state.player.left - nodes[index].left;
      var dy = state.player.top - (nodes[index].top + 7);
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (index === state.sceneIndex && !state.completed[scenes[index].id] && distance <= 8) return index;
    }
    return -1;
  }
  function renderNodes() {
    var box = game.querySelector("[data-nodes]");
    box.innerHTML = "";
    scenes.forEach(function (scene, index) {
      var node = document.createElement("div");
      node.className = "zqh-node" + (state.completed[scene.id] ? " completed" : "") + (index === state.sceneIndex ? " unlocked" : "") + (index > state.sceneIndex ? " locked" : "");
      node.style.left = nodes[index].left + "%";
      node.style.top = nodes[index].top + "%";
      node.innerHTML = "<span>" + (index + 1) + "</span><b>" + scene.title + "</b><small>" + scene.year.replace("场景" + index + " · ", "") + "</small>";
      box.appendChild(node);
    });
    updateHud();
    updateTip();
    drawCanvasMap();
  }
  function movePlayer(dx, dy) {
    if (!game.querySelector("[data-stage]").hidden || !game.querySelector("[data-ending]").hidden) return;
    state.player.left = Math.max(3, Math.min(96, state.player.left + dx));
    state.player.top = Math.max(33, Math.min(84, state.player.top + dy));
    game.querySelector("[data-player]").classList.add("is-moving");
    placePlayer();
    window.clearTimeout(state.movingTimer);
    state.movingTimer = window.setTimeout(function () { game.querySelector("[data-player]").classList.remove("is-moving"); }, 160);
    saveProgress();
  }
  function interactOnMap() {
    var sceneIndex = getNearbySceneIndex();
    if (sceneIndex >= 0) openScene(sceneIndex);
    else updateTip();
  }
  function openScene(index) {
    clearStageRuntime();
    var scene = scenes[index];
    game.querySelector("[data-stage-year]").textContent = scene.year;
    game.querySelector("[data-stage-title]").textContent = scene.fullTitle || scene.title;
    game.querySelector("[data-stage-copy]").textContent = scene.copy;
    game.querySelector("[data-stage-feedback]").textContent = "";
    game.querySelector("[data-stage-next]").hidden = true;
    game.querySelector("[data-stage]").hidden = false;
    if (scene.type === "stall") renderStallPrelude(scene);
    if (scene.type === "duel") renderDuel(scene);
    if (scene.type === "event") renderEvent(scene);
    if (scene.type === "clue") renderClue(scene);
  }
  function closeStage() {
    clearStageRuntime();
    game.querySelector("[data-stage]").hidden = true;
    renderNodes();
    placePlayer();
  }
  function clearStageRuntime() {
    if (typeof state.stageCleanup === "function") state.stageCleanup();
    state.stageCleanup = null;
  }
  function finishScene(scene, text, effect) {
    var feedback = game.querySelector("[data-stage-feedback]");
    var next = game.querySelector("[data-stage-next]");
    if (effect) applyEffect(effect);
    clearStageRuntime();
    game.querySelectorAll("[data-stage-body] button").forEach(function (button) { button.disabled = true; });
    state.completed[scene.id] = true;
    state.sceneIndex = Math.max(state.sceneIndex, scenes.indexOf(scene) + 1);
    feedback.textContent = text;
    next.hidden = false;
    next.onclick = function () { state.sceneIndex >= scenes.length ? showEnding() : closeStage(); };
    updateHud();
    saveProgress();
  }
  function applyEffect(effect) {
    if (typeof effect.cash === "number") state.cash *= effect.cash;
    if (typeof effect.reputation === "number") state.reputation += effect.reputation;
    if (effect.bonus) state.pendingBonus = effect.bonus;
  }
  function renderStallPrelude(scene) {
    if (!window.FortuneStallMiniGame) {
      game.querySelector("[data-stage-feedback]").textContent = "小摊小游戏脚本没有加载，请检查 stall-minigame.js。";
      return;
    }
    window.FortuneStallMiniGame.render({
      game: game,
      scene: scene,
      state: state,
      updateHud: updateHud,
      formatCash: formatCash,
      finishScene: finishScene
    });
  }
  function renderDuel(scene) {
    var body = game.querySelector("[data-stage-body]");
    body.innerHTML = "<p class='duel-help'>系统已给出一套默认策略。你可以调整每轮派出的筹码，然后逐轮揭晓谈判结果。</p><div class='duel-toolbar'><button type='button' data-default-strategy>恢复默认策略</button><button type='button' data-start-duel>开始第 1 轮</button></div><div class='zqh-duel' data-duel></div><div class='round-log' data-round-log></div>";
    var duel = body.querySelector("[data-duel]");
    var selected = defaultStrategy(scene);
    var started = false;
    var wins = 0;
    var currentRound = 0;
    var roundMods = scene.opponent.map(function () { return randomRoundMod(); });
    function renderBoard() {
      duel.innerHTML = "";
      scene.opponent.forEach(function (opponent, index) {
        var row = document.createElement("section");
        var picked = scene.player[selected[index]];
        row.innerHTML = "<div class='opponent-card'><span>对手第 " + (index + 1) + " 轮</span><b>" + opponent.name + "</b><small>基础强度 " + opponent.power + "</small></div><div class='selected-chip'><span>己方默认应对</span><b>" + picked.name + "</b><small>基础强度 " + (picked.power + state.negotiation) + "</small></div><div class='chip-bank'></div>";
        scene.player.forEach(function (chip, chipIndex) {
          var button = document.createElement("button");
          var usedElsewhere = Object.keys(selected).some(function (key) { return Number(key) !== index && selected[key] === chipIndex; });
          button.type = "button";
          button.textContent = chip.name + " · " + (chip.power + state.negotiation);
          button.disabled = started || usedElsewhere;
          if (selected[index] === chipIndex) button.classList.add("picked");
          button.addEventListener("click", function () {
            selected[index] = chipIndex;
            renderBoard();
          });
          row.querySelector(".chip-bank").appendChild(button);
        });
        duel.appendChild(row);
      });
    }
    body.querySelector("[data-default-strategy]").addEventListener("click", function () {
      if (started) return;
      selected = defaultStrategy(scene);
      roundMods = scene.opponent.map(function () { return randomRoundMod(); });
      body.querySelector("[data-round-log]").innerHTML = "";
      renderBoard();
    });
    body.querySelector("[data-start-duel]").addEventListener("click", function () {
      if (currentRound >= scene.opponent.length) { resolveDuel(scene, wins); return; }
      started = true;
      body.querySelector("[data-default-strategy]").disabled = true;
      wins += revealDuelRound(scene, selected, roundMods, currentRound, body.querySelector("[data-round-log]"));
      currentRound += 1;
      renderBoard();
      if (currentRound < scene.opponent.length) {
        body.querySelector("[data-start-duel]").textContent = "开始第 " + (currentRound + 1) + " 轮";
      } else {
        body.querySelector("[data-start-duel]").textContent = "结算整场";
      }
    });
    renderBoard();
  }
  function defaultStrategy(scene) {
    if (scene.id === "contract") return { 0: 2, 1: 1, 2: 0 };
    return { 0: 0, 1: 1, 2: 2 };
  }
  function randomRoundMod() {
    var playerMods = [
      { value: -1, text: "临场紧张 -1" }, { value: 0, text: "正常发挥 +0" }, { value: 1, text: "抓住破绽 +1" }
    ];
    var opponentMods = [
      { value: -1, text: "对方失误 -1" }, { value: 0, text: "对方稳住 +0" }, { value: 1, text: "对方加压 +1" }
    ];
    return {
      player: playerMods[Math.floor(Math.random() * playerMods.length)],
      opponent: opponentMods[Math.floor(Math.random() * opponentMods.length)]
    };
  }
  function revealDuelRound(scene, selected, mods, roundIndex, log) {
    var opponent = scene.opponent[roundIndex];
    var chip = scene.player[selected[roundIndex]];
    var factoryEdge = scene.id === "cola" && state.pendingBonus === "factory" ? 1 : 0;
    var playerScore = chip.power + state.negotiation + factoryEdge + mods[roundIndex].player.value;
    var opponentScore = opponent.power + mods[roundIndex].opponent.value;
    var win = playerScore >= opponentScore;
    var card = document.createElement("article");
    card.className = "round-card " + (win ? "win" : "lose");
    card.innerHTML = "<p>第 " + (roundIndex + 1) + " 轮</p><h3>" + chip.name + " 对 " + opponent.name + "</h3><div><span>己方 " + playerScore + "（" + mods[roundIndex].player.text + "）</span><span>对手 " + opponentScore + "（" + mods[roundIndex].opponent.text + "）</span></div><b>" + (win ? "本轮占优" : "本轮受挫") + "</b>";
    log.appendChild(card);
    return win ? 1 : 0;
  }
  function resolveDuel(scene, wins) {
    var factoryBoost = scene.id === "cola" && state.pendingBonus === "factory" ? 1.25 : 1;
    var effect = wins >= 2 ? { cash: scene.id === "cola" ? 4 * factoryBoost : 2.2, reputation: 10 } : { cash: scene.id === "cola" ? 1.6 : 1.25, reputation: 2 };
    finishScene(scene, wins >= 2 ? scene.win : scene.lose, effect);
  }
  function renderEvent(scene) {
    var body = game.querySelector("[data-stage-body]");
    body.innerHTML = "<div class='event-options'></div>";
    scene.options.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", function () {
        if (option.successRate) {
          var ok = Math.random() < option.successRate;
          var effect = ok ? option.success : option.fail;
          if (!ok && state.resilience > 1) effect = { cash: Math.max(effect.cash, .55), reputation: effect.reputation, text: effect.text };
          var noisyEffect = withMarketNoise(effect);
          finishScene(scene, noisyEffect.text, noisyEffect);
        } else {
          var noisyEffect = withMarketNoise(option.effect);
          finishScene(scene, noisyEffect.text, noisyEffect);
        }
      });
      body.querySelector(".event-options").appendChild(button);
    });
  }
  function withMarketNoise(effect) {
    var rolls = [
      { cash: .9, text: "临时成本上涨，现金收益打九折。" },
      { cash: 1, text: "市场反应与预期基本一致。" },
      { cash: 1.1, text: "渠道反馈超出预期，现金收益提高一成。" }
    ];
    var roll = rolls[Math.floor(Math.random() * rolls.length)];
    return { cash: effect.cash * roll.cash, reputation: effect.reputation, bonus: effect.bonus, text: effect.text + " " + roll.text };
  }
  function renderClue(scene) {
    var body = game.querySelector("[data-stage-body]");
    var selected = [];
    body.innerHTML = "<div class='clause-list'></div><button type='button' class='submit-clues'>提交判断</button>";
    scene.clauses.forEach(function (clause, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "clause-card";
      button.textContent = clause.text;
      button.addEventListener("click", function () {
        if (selected.indexOf(index) >= 0) selected = selected.filter(function (item) { return item !== index; });
        else selected.push(index);
        button.classList.toggle("selected");
      });
      body.querySelector(".clause-list").appendChild(button);
    });
    body.querySelector(".submit-clues").addEventListener("click", function () {
      var correct = scene.clauses.filter(function (clause, index) { return clause.trap && selected.indexOf(index) >= 0; }).length;
      var wrong = selected.filter(function (index) { return !scene.clauses[index].trap; }).length;
      if (correct === 2 && wrong === 0) finishScene(scene, "你抓住了真正危险的条款，保住控制权，声誉大涨。", { cash: 1.15, reputation: 20 });
      else if (correct > 0) finishScene(scene, "你看出了一部分问题，虽然付出代价，仍然守住了主导权。", { cash: .82, reputation: 8 });
      else finishScene(scene, "陷阱没有被及时识破，公司元气受损，但你还是没有放手。", { cash: .55, reputation: -5 });
    });
  }
  function showEnding() {
    game.querySelector("[data-stage]").hidden = true;
    var good = state.cash >= endingThreshold;
    game.querySelector("[data-ending-title]").textContent = good ? "好结局：布鞋首富" : "阶段性成就：仍在路上";
    game.querySelector("[data-ending-cash]").textContent = formatCash(state.cash);
    game.querySelector("[data-ending-copy]").textContent = good ? "喝了这个，吃饭就是香。你没有比别人聪明，但你比别人更早相信：脚踏实地，也能走到很远的地方。" : "路还没有走完。换一双布鞋，重新挑战不同的决策组合，也许就能跨过那道门槛。";
    game.querySelector("[data-ending]").hidden = false;
    if (saveSystem && good) saveSystem.completeLevel(saveLevelId, 2, serializeState());
    else saveProgress();
  }
  function startFromSave() {
    if (saveSystem) saveSystem.requireUser();
    state = restoreState(saveSystem ? saveSystem.getLevelSave(saveLevelId) : null);
    game.querySelector("[data-ending]").hidden = true;
    game.querySelector("[data-stage]").hidden = true;
    game.querySelector("[data-map]").hidden = false;
    renderNodes();
    placePlayer();
    saveProgress();
    if (Object.keys(state.completed).length >= scenes.length) showEnding();
  }
  function resetGame() {
    window.clearTimeout(state.movingTimer);
    clearStageRuntime();
    if (saveSystem) saveSystem.clearLevel(saveLevelId);
    state = initialState();
    game.querySelector("[data-ending]").hidden = true;
    game.querySelector("[data-stage]").hidden = true;
    game.querySelector("[data-map]").hidden = false;
    renderNodes();
    placePlayer();
    saveProgress();
  }

  game.querySelector("[data-close-stage]").addEventListener("click", closeStage);
  game.querySelector("[data-restart]").addEventListener("click", resetGame);
  document.addEventListener("keydown", function (event) {
    if (game.hidden) return;
    if (!game.querySelector("[data-stage]").hidden || !game.querySelector("[data-ending]").hidden) return;
    var keys = { ArrowLeft: [-3, 0], a: [-3, 0], A: [-3, 0], ArrowRight: [3, 0], d: [3, 0], D: [3, 0], ArrowUp: [0, -3], w: [0, -3], W: [0, -3], ArrowDown: [0, 3], s: [0, 3], S: [0, 3] };
    if (keys[event.key]) {
      event.preventDefault();
      movePlayer(keys[event.key][0], keys[event.key][1]);
    }
    if (event.key === "e" || event.key === "E" || event.key === "Enter") {
      event.preventDefault();
      interactOnMap();
    }
  });
  document.addEventListener("prologue:complete", function () { game.hidden = false; startFromSave(); }, { once: true });
});
