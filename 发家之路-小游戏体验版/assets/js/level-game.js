document.addEventListener("DOMContentLoaded", function () {
  var game = document.querySelector("#level-game");
  if (!game) return;

  var definitions = {
    "1": { stats: { funds: 100000, reputation: 32, day: 1 }, goal: "拿下经销部承包权", detail: "前往文教局，做出十万元利润承诺", events: {
      home: ["文教局 · 1987", "“10万元。”", "文教局要承包下属经销部。别人报4万、5万，你盘算了一夜，决定报出10万元利润承诺。办公室里安静了两秒。", ["签下承包责任书", "你拿到了经销部经营权。没人知道这双布鞋能走多远，但你知道，机会从来不是等来的。", { reputation: 8, day: 1, goal: "争取电视广告机会", detail: "前往电视台，确认黄金时段", progress: 48 }]],
      news: ["杭州电视台 · 1988", "二十一万元的黄金时段", "电视台开出21万元广告费，几乎是你全部的家底。签下去，可能一夜翻身；打了水漂，可能就此关门。", ["签下广告合同", "广告播出后，订单像潮水一样涌来。你把十万元的赌注，换成了品牌走进千家万户的机会。", { funds: 400000, reputation: 10, day: 2, goal: "寻找扩大产能的机会", detail: "前往罐头厂，考察一座烫手的国企", progress: 76 }]],
      bank: ["杭州罐头厂 · 1991", "140人，要接住2200人吗？", "杭州罐头厂资不抵债，2200多名职工等待去向。你的厂只有140人。兼并意味着巨大的压力，也意味着通往全国市场的产能。", ["接下这份兼并计划", "你决定把最重的担子扛在肩上。非常可乐、联销体和更大的市场，还在前方等你。第一关完成：布鞋走出的路，才刚刚开始。", { funds: -80000, reputation: 15, day: 3, goal: "第一关完成", detail: "已解锁：非常可乐与联销体的后续篇章", progress: 100 }]]
    } },
    "2": { stats: { funds: 680000, reputation: 54, day: 12 }, goal: "争取旧城改造项目", detail: "先听见社区的真实声音", events: {
      home: ["办公室 · 清晨", "一张旧城区地图", "地图上是一片被许多人放弃的街区。团队认为风险太高，但你看见了被忽略的机会。", ["圈出改造重点", "你决定先解决居民真正关心的问题，而不是急着谈价格。", { reputation: 2, day: 1, detail: "去咖啡馆约见社区代表" }]],
      cafe: ["咖啡馆 · 下午", "不只是一笔交易", "社区代表说得很直接：大家不反对改变，只是不相信承诺。", ["认真记录诉求", "你带走一份比合同更重要的清单：信任需要被一点点建立。", { reputation: 5, day: 1, detail: "带着方案去公司协商", progress: 58 }]],
      company: ["公司 · 会客室", "签字之前", "合作方担心投入，团队也等待你的决定。你必须选择怎样开始这项改造。", ["先做社区协商", "方案获得了更多支持。项目推进得慢一些，却有了更坚实的基础。", { funds: -80000, reputation: 12, day: 2, goal: "项目进入筹备期", detail: "第二关完成：关系成为新的资产", progress: 100 }]]
    } },
    "3": { stats: { funds: 90000, reputation: 28, day: 28 }, goal: "验证互联网商业想法", detail: "从一个真实需求开始", events: {
      home: ["公寓 · 夜晚", "一场小小的会议", "团队围坐在客厅里。没有人确定互联网能不能改变生意，但每个人都知道不能再等待。", ["写下第一版计划", "你决定不追求完美的开始，只先找到一个愿意尝试的商户。", { reputation: 2, day: 1, detail: "去校园寻找新的伙伴" }]],
      campus: ["校园 · 午后", "失败留下的笔记", "走过旧教室时，你想起那些被拒绝的时刻。失败没有给答案，却让你更能听懂问题。", ["整理复盘笔记", "你获得了更清晰的方向：先为一个具体的人解决一个具体的问题。", { reputation: 4, day: 1, detail: "去便利店观察真实顾客", progress: 60 }]],
      store: ["便利店 · 傍晚", "第一个小商户", "店主愿意给你一次机会，但只愿意先尝试小范围合作。", ["承诺完成试点", "第一个试点达成。它不够大，却证明了这条路可以走下去。", { funds: -30000, reputation: 10, day: 2, goal: "试点项目启动", detail: "第三关完成：新的平台正在形成", progress: 100 }]]
    } }
  };

  var config = definitions[game.dataset.level];
  var saveSystem = window.FortuneSave || null;
  var saveLevelId = "level" + game.dataset.level;
  var saved = saveSystem ? saveSystem.getLevelSave(saveLevelId) : null;
  var state = Object.assign({ progress: 25, visited: {} }, config.stats, { goal: config.goal, detail: config.detail }, saved || {});
  var player = game.querySelector(".map-player");
  var prompt = game.querySelector(".map-prompt");
  var dialog = game.querySelector(".game-dialog");
  var activeLocation = null;
  var pressed = new Set();
  var position = state.position || { x: 15, y: 73 };
  var lastFrame = 0;
  var lastMoveSave = 0;
  var moveKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"]);

  function refresh() {
    game.querySelector("[data-stat=funds]").textContent = "¥ " + state.funds.toLocaleString("zh-CN");
    game.querySelector("[data-stat=reputation]").textContent = state.reputation;
    game.querySelector("[data-stat=day]").textContent = "第 " + state.day + " 天";
    game.querySelector("[data-goal]").textContent = state.goal;
    game.querySelector("[data-detail]").textContent = state.detail;
    game.querySelector("[data-progress]").style.width = state.progress + "%";
  }
  function saveProgress() {
    state.position = position;
    if (saveSystem) saveSystem.saveLevel(saveLevelId, state);
  }
  function closeDialog() { dialog.hidden = true; pressed.clear(); game.focus(); }
  function openEvent(name) {
    var eventInfo = config.events[name]; if (!eventInfo) return;
    pressed.clear();
    dialog.querySelector(".note-kicker").textContent = eventInfo[0];
    dialog.querySelector("h2").textContent = eventInfo[1];
    dialog.querySelector(".event-copy").textContent = eventInfo[2];
    var choices = dialog.querySelector(".dialog-choices"); choices.innerHTML = "";
    var choice = eventInfo[3]; var button = document.createElement("button");
    button.type = "button"; button.className = "dialog-choice"; button.textContent = choice[0];
    button.addEventListener("click", function () {
      Object.keys(choice[2]).forEach(function (key) {
        if (["funds", "reputation", "day"].includes(key)) state[key] += choice[2][key];
        else state[key] = choice[2][key];
      });
      refresh(); dialog.querySelector(".event-copy").textContent = choice[1]; choices.innerHTML = "";
      state.visited[name] = true;
      if (saveSystem && state.progress >= 100) saveSystem.completeLevel(saveLevelId, Number(game.dataset.level) + 1, state);
      else saveProgress();
      var done = document.createElement("button"); done.type = "button"; done.className = "dialog-choice"; done.textContent = "继续探索"; done.addEventListener("click", closeDialog); choices.appendChild(done);
    });
    choices.appendChild(button); dialog.hidden = false; dialog.querySelector(".dialog-close").focus();
  }
  function findNearby() {
    var playerRect = player.getBoundingClientRect(); var px = playerRect.left + playerRect.width / 2; var py = playerRect.bottom;
    var nearest = null; var distance = Infinity;
    game.querySelectorAll(".map-location").forEach(function (location) { var rect = location.getBoundingClientRect(); var value = Math.hypot(px - (rect.left + rect.width / 2), py - (rect.top + rect.height)); if (value < distance) { distance = value; nearest = location; } });
    activeLocation = distance < Math.max(90, game.getBoundingClientRect().width * .08) ? nearest : null;
    prompt.textContent = activeLocation ? "按 E 调查：" + activeLocation.querySelector("b").textContent : "方向键 / WASD 移动";
    prompt.classList.toggle("visible", Boolean(activeLocation));
  }
  function frame(now) {
    var elapsed = Math.min((now - lastFrame) / 1000 || 0, .05); lastFrame = now;
    var x = (pressed.has("ArrowRight") || pressed.has("d") || pressed.has("D") ? 1 : 0) - (pressed.has("ArrowLeft") || pressed.has("a") || pressed.has("A") ? 1 : 0);
    var y = (pressed.has("ArrowDown") || pressed.has("s") || pressed.has("S") ? 1 : 0) - (pressed.has("ArrowUp") || pressed.has("w") || pressed.has("W") ? 1 : 0);
    var moving = dialog.hidden && (x || y); if (moving) { var length = Math.hypot(x, y); position.x = Math.max(2, Math.min(98, position.x + x / length * elapsed * 18)); position.y = Math.max(47, Math.min(81, position.y + y / length * elapsed * 18)); player.style.left = position.x + "%"; player.style.top = position.y + "%"; if (now - lastMoveSave > 700) { lastMoveSave = now; saveProgress(); } }
    player.classList.toggle("is-moving", Boolean(moving)); findNearby(); requestAnimationFrame(frame);
  }
  document.addEventListener("keydown", function (event) { if (!dialog.hidden) { if (event.key === "Escape") closeDialog(); event.preventDefault(); return; } if (moveKeys.has(event.key)) { pressed.add(event.key); event.preventDefault(); } if ((event.key === "e" || event.key === "E" || event.key === " ") && activeLocation) { event.preventDefault(); openEvent(activeLocation.dataset.event); } });
  document.addEventListener("keyup", function (event) { pressed.delete(event.key); }); window.addEventListener("blur", function () { pressed.clear(); });
  game.querySelectorAll(".map-location").forEach(function (location) { location.addEventListener("click", function () { openEvent(location.dataset.event); }); });
  if (saveSystem) saveSystem.requireUser();
  player.style.left = position.x + "%";
  player.style.top = position.y + "%";
  game.querySelector(".dialog-close").addEventListener("click", closeDialog); refresh(); saveProgress(); requestAnimationFrame(frame);
});
