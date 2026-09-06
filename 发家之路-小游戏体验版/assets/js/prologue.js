document.addEventListener("DOMContentLoaded", function () {
  var prologue = document.querySelector("#birth-prologue");
  if (!prologue) return;
  if (window.FortuneSave && window.FortuneSave.getLevelSave("level1")) {
    prologue.hidden = true;
    document.dispatchEvent(new CustomEvent("prologue:complete"));
    return;
  }
  var scenes = [
    { chapter: "序章 · 出生篇", speaker: "旁白", mood: "home", text: "旧时代的尾巴，扫到了这个家。祖辈做过官，到父亲这一代，只剩下一份体面却挣不到钱的差事。母亲在小学教书，一份微薄的工资，要喂饱五张嘴。" },
    { speaker: "母亲 · 阿娟", mood: "mother", text: "米缸又见底了。" },
    { speaker: "父亲 · 老宗", mood: "father", text: "我知道。" },
    { speaker: "旁白", mood: "memory", text: "你走街串巷叫卖过炒米，寒冬腊月的火车站，也卖过热气腾腾的煮红薯。挣的钱不多，但你第一次知道，自己的力气能换来点什么。" },
    { speaker: "你", mood: "hope", text: "我考上了！不要学费，还有津贴！" },
    { speaker: "居委会办事员", mood: "office", text: "家庭成分……不符合条件。这个名额，给不了你。" },
    { speaker: "旁白", mood: "news", text: "后来，你去了舟山的农场，也到过茶场。日子磨掉了少年人的急躁，却没磨掉那股想把日子过好的劲。" },
    { chapter: "1987 · 杭州", speaker: "旁白", mood: "end", text: "二十多年后，你回到杭州。承包经销部、广告豪赌、兼并国企、硬战两乐，一连串决定正在前方等你。", ending: true }
  ];
  var current = 0;
  var speaker = document.querySelector("#prologue-speaker");
  var text = document.querySelector("#prologue-text");
  var chapter = document.querySelector("#prologue-chapter");
  var portrait = document.querySelector("#prologue-portrait");
  var next = document.querySelector("#prologue-next");
  function render() {
    var scene = scenes[current];
    speaker.textContent = scene.speaker;
    text.textContent = scene.text;
    chapter.textContent = scene.chapter || "序章 · 布鞋首富";
    portrait.className = "prologue-portrait " + scene.mood;
    prologue.dataset.mood = scene.mood;
    text.classList.remove("is-visible");
    requestAnimationFrame(function () { text.classList.add("is-visible"); });
    next.textContent = scene.ending ? "进入地图 · 开始正片" : "点击继续";
  }
  function advance() {
    if (scenes[current].ending) {
      prologue.classList.add("is-leaving");
      window.setTimeout(function () {
        prologue.hidden = true;
        document.dispatchEvent(new CustomEvent("prologue:complete"));
      }, 380);
      return;
    }
    current += 1;
    render();
  }
  next.addEventListener("click", advance);
  prologue.addEventListener("click", function (event) {
    if (event.target === prologue || event.target.classList.contains("prologue-background") || event.target.classList.contains("prologue-vignette")) advance();
  });
  document.addEventListener("keydown", function (event) {
    if (prologue.hidden || [" ", "Enter", "ArrowRight"].indexOf(event.key) === -1) return;
    event.preventDefault();
    advance();
  }, true);
  render();
});
