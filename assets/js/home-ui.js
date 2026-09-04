document.addEventListener("DOMContentLoaded", function () {
  var dialog = document.querySelector("#game-dialog");
  if (!dialog) return;
  var notes = {
    intro: { kicker: "城镇公告板 · 游戏说明", title: "不是复刻成功，而是理解选择。", text: "《发家之路》是一款关卡制交互故事游戏。你将从有限的资金、声望与个人特质出发，在真实商业人物经历启发的困境里做出判断。第一关“布鞋首富”包含承包谈判、广告豪赌、兼并、可乐大战和合同保卫战；每一次选择都会改变资源和结局。", links: [["从第一关开始", "level-1.html"]] },
    levels: { kicker: "站前公告 · 关卡开放", title: "三段人生转折，等待你出发。", text: "第一关“布鞋首富”从一次承包谈判开始，走向全国市场；第二关是旧城改造中的关系与胆识；第三关从反复失败里验证一个新的互联网想法。", links: [["第一关：布鞋首富", "level-1.html"], ["第二关：关系与胆识", "level-2.html"], ["第三关：屡败屡战", "level-3.html"]] },
    team: { kicker: "制作名单 · 开发公告", title: "这座小城由谁建造？", text: "成员 A 负责策划与故事架构，把商业人物经历整理成关卡事件。成员 B 负责网页视觉与像素地图呈现。成员 C 负责交互流程、事件纸条和数值反馈。我们共同完成资料梳理、关卡叙事与网页实现。", links: [] }
  };
  var title = document.querySelector("#dialog-title");
  var kicker = document.querySelector("#dialog-kicker");
  var text = document.querySelector("#dialog-text");
  var choices = document.querySelector("#dialog-choices");
  function close() { dialog.hidden = true; }
  function open(name) {
    var note = notes[name]; if (!note) return;
    kicker.textContent = note.kicker; title.textContent = note.title; text.textContent = note.text; choices.innerHTML = "";
    note.links.forEach(function (link) { var anchor = document.createElement("a"); anchor.className = "dialog-choice"; anchor.href = link[1]; anchor.textContent = link[0]; choices.appendChild(anchor); });
    var closeButton = document.createElement("button"); closeButton.className = "dialog-choice"; closeButton.type = "button"; closeButton.textContent = "收好公告"; closeButton.addEventListener("click", close); choices.appendChild(closeButton);
    dialog.hidden = false; document.querySelector("#dialog-close").focus();
  }
  document.querySelectorAll("[data-home-note]").forEach(function (button) { button.addEventListener("click", function () { open(button.dataset.homeNote); }); });
  document.querySelector("#dialog-close").addEventListener("click", close);
  document.addEventListener("keydown", function (event) { if (!dialog.hidden && event.key === "Escape") close(); });
});
