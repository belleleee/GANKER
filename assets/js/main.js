document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var message = form.querySelector(".form-message");
      message.textContent = form.dataset.demoForm;
    });
  });

  var map = document.querySelector("#game-map");
  var player = document.querySelector("#map-player");
  var prompt = document.querySelector("#map-prompt");
  if (!map || !player || !prompt) return;

  var position = { x: 15, y: 73 };
  var pressed = new Set();
  var activeLocation = null;
  var lastFrame = 0;
  var moveKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"]);
  var dialog = document.querySelector("#game-dialog");
  var dialogKicker = document.querySelector("#dialog-kicker");
  var dialogTitle = document.querySelector("#dialog-title");
  var dialogText = document.querySelector("#dialog-text");
  var dialogChoices = document.querySelector("#dialog-choices");
  var dialogClose = document.querySelector("#dialog-close");
  var state = { funds: 100000, reputation: 32, day: 1, goal: "找到第一笔机会资金", detail: "探索地图，选择你的下一步", progress: 24 };
  var events = {
    home: { kicker: "家 · 夜晚", title: "账本夹着一张纸条", text: "桌上只剩一盏台灯。你翻开账本，十万元现金是全部底气。母亲留下一张纸条：别急着证明自己，先想清楚这笔钱要替你换来什么。", choices: [{ label: "整理账本，重新规划", result: "你把每一笔开支记下。机会还没出现，但你更清楚自己能承担什么。", effect: { reputation: 1, day: 1, detail: "去报亭，寻找市场机会", progress: 30 } }, { label: "休息一晚", result: "你关掉台灯。明天仍会到来，先让自己保持清醒。", effect: { day: 1 } }] },
    news: { kicker: "报亭 · 清晨", title: "商业版的角落", text: "报纸上写着：省电视台正在出售一段广告时段。价格不低，但如果产品能被更多家庭看见，局面也许会改变。", choices: [{ label: "花 200 元买下商业报", result: "你用一份报纸换来一条线索：广告档期还有三天。", effect: { funds: -200, reputation: 1, day: 1, goal: "筹集广告资金", detail: "前往银行或公司打听融资", progress: 45 } }, { label: "先记下信息", result: "你把广告信息抄进笔记本，决定多比较几种方案。", effect: { day: 1, detail: "继续收集市场信息" } }] },
    bank: { kicker: "银行 · 上午", title: "一份融资申请", text: "柜台后的经理看完你的材料，没有立即拒绝。他说：如果你能证明产品有市场，银行可以再谈。", choices: [{ label: "提交融资意向", result: "经理收下了材料。融资未必成功，但你获得了正式沟通的机会。", effect: { reputation: 3, day: 1, detail: "去公司寻找合作背书", progress: 58 } }, { label: "暂不申请", result: "你决定不轻易背上债务，先去寻找更多市场证据。", effect: { day: 1 } }] },
    company: { kicker: "公司 · 午后", title: "会客室的等待", text: "一位采购负责人愿意给你十分钟。你的产品还没有名气，但你准备了一份认真做过的销售记录。", choices: [{ label: "展示销售记录", result: "对方没有立刻签约，却答应给你一次小批量试销的机会。", effect: { funds: 5000, reputation: 5, day: 1, goal: "完成第一批试销", detail: "去便利店观察顾客反馈", progress: 72 } }, { label: "保守告辞", result: "你保留了选择，但也错过了一次当场争取的机会。", effect: { day: 1 } }] },
    store: { kicker: "便利店 · 傍晚", title: "货架前的观察", text: "顾客在货架前停留的时间很短。你注意到他们会比较包装、价格和是否容易带走。市场从来不会直接说出答案。", choices: [{ label: "记录顾客习惯", result: "你写满了一页观察笔记。产品方向变得更清晰了。", effect: { reputation: 2, day: 1, goal: "准备下一次关键选择", detail: "回家整理你今天得到的线索", progress: 88 } }, { label: "直接推销产品", result: "有几位顾客愿意听你介绍，但真正掏钱的人不多。", effect: { funds: 300, day: 1 } }] },
    cafe: { kicker: "咖啡馆 · 黄昏", title: "朋友的一句提醒", text: "朋友听完你的想法，只说了一句：机会不保证成功，但不去问，就永远没有答案。", choices: [{ label: "请朋友介绍合作方", result: "朋友答应帮你约一位做渠道的人。人脉的价值，往往在关键时刻才显现。", effect: { reputation: 2, day: 1, detail: "新的渠道线索已记录" } }, { label: "自己再想想", result: "你把建议记下，决定等准备更充分再开口。", effect: { day: 1 } }] },
    campus: { kicker: "校园 · 旧教室", title: "黑板上的失败公式", text: "空教室的黑板上还留着一句话：失败不是结论，是下一次尝试的资料。你想起自己曾经被拒绝的那些时刻。", choices: [{ label: "写下复盘笔记", result: "你把过去的失误整理成三条原则。勇气并没有减少，反而更有方向。", effect: { reputation: 2, day: 1, detail: "获得特质：屡败屡战" } }, { label: "安静离开", result: "有些答案暂时还没有出现，但脚步不能停。", effect: { day: 1 } }] }
  };

  function refreshHud() {
    document.querySelector("#stat-funds").textContent = "¥ " + state.funds.toLocaleString("zh-CN");
    document.querySelector("#stat-reputation").textContent = state.reputation;
    document.querySelector("#stat-day").textContent = "第 " + state.day + " 天";
    document.querySelector("#goal-title").textContent = state.goal;
    document.querySelector("#goal-detail").textContent = state.detail;
    document.querySelector("#goal-progress").style.width = state.progress + "%";
  }

  function closeDialog() {
    dialog.hidden = true;
    pressed.clear();
    map.focus();
  }

  function openLocation(locationName) {
    var eventInfo = events[locationName];
    if (!eventInfo) return;
    pressed.clear();
    dialogKicker.textContent = eventInfo.kicker;
    dialogTitle.textContent = eventInfo.title;
    dialogText.textContent = eventInfo.text;
    dialogChoices.innerHTML = "";
    eventInfo.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "dialog-choice";
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        Object.keys(choice.effect).forEach(function (key) {
          if (typeof choice.effect[key] === "number") state[key] += choice.effect[key];
          else state[key] = choice.effect[key];
        });
        refreshHud();
        dialogText.textContent = choice.result;
        dialogChoices.innerHTML = "";
        var continueButton = document.createElement("button");
        continueButton.type = "button";
        continueButton.className = "dialog-choice";
        continueButton.textContent = "收好纸条，继续探索";
        continueButton.addEventListener("click", closeDialog);
        dialogChoices.appendChild(continueButton);
      });
      dialogChoices.appendChild(button);
    });
    dialog.hidden = false;
    dialogClose.focus();
  }

  function drawPlayer() {
    player.style.left = position.x + "%";
    player.style.top = position.y + "%";
  }

  function findNearbyLocation() {
    var playerRect = player.getBoundingClientRect();
    var playerX = playerRect.left + playerRect.width / 2;
    var playerY = playerRect.bottom;
    var nearest = null;
    var nearestDistance = Infinity;
    map.querySelectorAll(".map-location").forEach(function (location) {
      var rect = location.getBoundingClientRect();
      var locationX = rect.left + rect.width / 2;
      var locationY = rect.top + rect.height;
      var distance = Math.hypot(playerX - locationX, playerY - locationY);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = location;
      }
    });
    activeLocation = nearestDistance < Math.max(90, map.getBoundingClientRect().width * 0.08) ? nearest : null;
    if (activeLocation) {
      prompt.textContent = "按 E 进入：" + activeLocation.querySelector("b").textContent;
      prompt.classList.add("visible");
    } else {
      prompt.textContent = "方向键 / WASD 移动";
      prompt.classList.remove("visible");
    }
  }

  function update(now) {
    var elapsed = Math.min((now - lastFrame) / 1000 || 0, 0.05);
    lastFrame = now;
    var horizontal = (pressed.has("ArrowRight") || pressed.has("d") || pressed.has("D") ? 1 : 0) - (pressed.has("ArrowLeft") || pressed.has("a") || pressed.has("A") ? 1 : 0);
    var vertical = (pressed.has("ArrowDown") || pressed.has("s") || pressed.has("S") ? 1 : 0) - (pressed.has("ArrowUp") || pressed.has("w") || pressed.has("W") ? 1 : 0);
    var isMoving = dialog.hidden && (horizontal !== 0 || vertical !== 0);
    if (isMoving) {
      var length = Math.hypot(horizontal, vertical);
      position.x = Math.max(2, Math.min(98, position.x + horizontal / length * elapsed * 18));
      position.y = Math.max(47, Math.min(81, position.y + vertical / length * elapsed * 18));
      drawPlayer();
    }
    player.classList.toggle("is-moving", isMoving);
    findNearbyLocation();
    requestAnimationFrame(update);
  }

  document.addEventListener("keydown", function (event) {
    if (!dialog.hidden) {
      if (event.key === "Escape") closeDialog();
      event.preventDefault();
      return;
    }
    if (moveKeys.has(event.key)) {
      pressed.add(event.key);
      event.preventDefault();
    }
    if ((event.key === "e" || event.key === "E" || event.key === " ") && activeLocation) {
      event.preventDefault();
      openLocation(activeLocation.dataset.location);
    }
  });
  document.addEventListener("keyup", function (event) { pressed.delete(event.key); });
  window.addEventListener("blur", function () { pressed.clear(); });
  map.addEventListener("click", function () { map.focus(); });
  map.querySelectorAll(".map-location").forEach(function (location) {
    location.addEventListener("click", function () { openLocation(location.dataset.location); });
  });
  dialogClose.addEventListener("click", closeDialog);
  refreshHud();
  drawPlayer();
  requestAnimationFrame(update);
});
