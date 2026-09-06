document.addEventListener("DOMContentLoaded", function () {
  var prologue = document.querySelector("#birth-prologue");
  if (!prologue) return;
  if (window.FortuneSave && window.FortuneSave.getLevelSave("level1")) {
    prologue.hidden = true;
    document.dispatchEvent(new CustomEvent("prologue:complete"));
    return;
  }
  var outcome = { resilience: 0, negotiation: 0, ahaiBond: 0, fatherBond: 0, ahaiStayed: false };
  var scenes = [
    { chapter: "1945 · 宿迁旧宅", speaker: "旁白", mood: "home", text: "抗战刚结束，祖父的旧宅还在，门楣上的体面却已经松动。你出生在这个秋天，风吹落一院槐叶。" },
    { speaker: "父亲 · 老宗", mood: "father", text: "关系全断了。往后这个家，恐怕不能再靠祖上的名头过日子。" },
    { speaker: "母亲 · 阿娟", mood: "mother", text: "这孩子来得不是时候。" },
    { speaker: "父亲 · 老宗", mood: "father", text: "不。他来得正是时候。这个家，总得有人往下走。" },
    { chapter: "五十年代 · 杭州阁楼", speaker: "旁白", mood: "memory", text: "祖父去世后，一家人搬进杭州临街木楼。母亲代课养家，父亲抄账、修伞、扛货，体面慢慢换成了米面。" },
    { speaker: "母亲 · 阿娟", mood: "mother", text: "房东又催租了。我说月底一定凑齐，可拿什么凑，我心里也没底。" },
    { chapter: "少年 · 巷口", speaker: "旁白", mood: "memory", text: "七八岁时，别的孩子滚铁环，你守着铁锅卖炒米。红薯、馒头、零碎小货，凡是能补贴家用的，你都卖过。" },
    { speaker: "旁白", mood: "memory", text: "你第一次明白：钱不是从天上落下来的，是冻裂的手、停不下的铲子和一次次递出去的小包换来的。" },
    { chapter: "初中毕业 · 师范门口", speaker: "你", mood: "hope", text: "录取了。免学费，还有津贴。终于有一条路，可以不靠家里也走下去。" },
    { speaker: "居委会办事员", mood: "office", text: "家庭成分不符合条件。这个名额，给不了你。" },
    { speaker: "旁白", mood: "office", text: "那天晚上，你烧掉录取通知书。你对自己说：往后，别再指望一张纸替你改命。" },
    { chapter: "1963 · 舟山马目农场", speaker: "接引员", mood: "news", text: "这就是马目农场。没电，没自来水，睡棚子，明早四点集合。想走，现在还来得及。" },
    { speaker: "阿海", mood: "news", text: "咸水洗澡，四点开工……咱这是来当知青，还是来腌咸菜啊？" },
    {
      speaker: "阿海",
      mood: "news",
      text: "你呢？你又是为啥来的？",
      choices: [
        { label: "别的路都堵死了，这条路我认。", effect: { resilience: 10, ahaiBond: 5 }, response: "你把这句话说得很平。阿海没再追问，只点点头，说以后互相罩着。" },
        { label: "至少这是一条能走通的路。", effect: { resilience: 5 }, response: "你没有把话说满。可从那一刻起，你决定先走下去，再问远方。" },
        { label: "凭什么只能捡剩下的路走？", effect: { resilience: 5, fatherBond: 5 }, response: "怨气没有让你停下。它被你压进肩膀，变成往前走的力气。" }
      ]
    },
    { chapter: "马目农场 · 大潮之后", speaker: "旁白", mood: "memory", text: "入秋大潮泡毁了棉田，口粮开始紧发。白天你教阿海挑担省力，夜里宿舍里翻身声比鼾声更多。" },
    {
      speaker: "阿海",
      mood: "news",
      text: "我撑不住了。我想回去。我是不是特别没出息？",
      choices: [
        { label: "再撑一撑，你能熬过去。", effect: { ahaiBond: 15, ahaiStayed: true }, response: "阿海把全家福重新贴身收好。多年以后，他会成为第一个愿意跟你蹬三轮的人。" },
        { label: "想清楚就走，没人能替你扛。", effect: { ahaiBond: 5 }, response: "三天后，阿海离开农场。那张全家福留在你手里，像一个没能兑现的约定。" },
        { label: "不说话，只递给他一支烟。", effect: { resilience: 5, ahaiBond: 10 }, response: "烟点起来以后，屋里安静了很久。你不知道这算不算劝住，只知道那夜谁都没再哭。" }
      ]
    },
    { chapter: "第二年 · 坝堤", speaker: "队长老陈", mood: "news", text: "上头要评积极分子，我报的是你。不是因为你最能干，是因为你从不叫苦，也不偷奸耍滑。" },
    { chapter: "绍兴茶场", speaker: "赵伯", mood: "memory", text: "愁眉苦脸地干活，跟乐呵呵地干活，累的程度是一样的。能把一件事做到底的人，差不了。" },
    {
      speaker: "队长老陈",
      mood: "news",
      text: "这批稻子，今天必须割完。割不完，晚饭别想吃。",
      choices: [
        { label: "割就割，饭晚点吃没什么。", effect: { resilience: 15 }, response: "你割到后半夜，手上磨出血泡。第二天老陈路过，只丢下一句：还行。" },
        { label: "这个量要加人，我保证明天交差。", effect: { resilience: 5, negotiation: 10 }, response: "老陈沉默片刻，叫了两个人来帮你。你第一次发现，敢开口要条件未必吃亏。" },
        { label: "嘴上答应，心里差不多就行。", effect: { resilience: -5 }, response: "那天你没割完，晚饭也是凉的。更凉的是，你发现敷衍会让人心里发虚。" }
      ]
    },
    { chapter: "1977 · 茶场宿舍", speaker: "秀兰", mood: "mother", text: "你家里送来这套新家具，是在给咱俩指一条明路吧？" },
    { speaker: "你", mood: "hope", text: "路是明摆着的。就看愿不愿意，一起走。" },
    { chapter: "1978 · 回城", speaker: "队长老陈", mood: "end", text: "回去以后，别把在这儿学会的东西弄丢了。就一个字：扛。" },
    { chapter: "1987 · 杭州", speaker: "旁白", mood: "end", text: "九年后，校办经销部连年亏损。你蹬上三轮车，从汽水、棒冰和文具开始，亲手去翻命运留下的第一张底牌。", ending: true }
  ];
  var current = 0;
  var speaker = document.querySelector("#prologue-speaker");
  var text = document.querySelector("#prologue-text");
  var chapter = document.querySelector("#prologue-chapter");
  var portrait = document.querySelector("#prologue-portrait");
  var next = document.querySelector("#prologue-next");
  var choices = document.createElement("div");
  choices.className = "prologue-choices";
  next.parentNode.insertBefore(choices, next);
  function render() {
    var scene = scenes[current];
    speaker.textContent = scene.speaker;
    text.textContent = scene.text;
    chapter.textContent = scene.chapter || "序章 · 布鞋首富";
    portrait.className = "prologue-portrait " + scene.mood;
    prologue.dataset.mood = scene.mood;
    choices.innerHTML = "";
    choices.hidden = !scene.choices;
    next.hidden = Boolean(scene.choices);
    text.classList.remove("is-visible");
    requestAnimationFrame(function () { text.classList.add("is-visible"); });
    next.textContent = scene.ending ? "进入地图 · 开始正片" : "点击继续";
    if (scene.choices) renderChoices(scene);
  }
  function renderChoices(scene) {
    scene.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        applyChoice(choice);
      });
      choices.appendChild(button);
    });
  }
  function applyChoice(choice) {
    Object.keys(choice.effect || {}).forEach(function (key) {
      if (typeof choice.effect[key] === "number") outcome[key] += choice.effect[key];
      else outcome[key] = choice.effect[key];
    });
    scenes.splice(current + 1, 0, { speaker: "旁白", mood: scenes[current].mood, text: choice.response });
    current += 1;
    render();
  }
  function advance() {
    if (scenes[current].choices) return;
    if (scenes[current].ending) {
      prologue.classList.add("is-leaving");
      window.setTimeout(function () {
        prologue.hidden = true;
        document.dispatchEvent(new CustomEvent("prologue:complete", { detail: { outcome: outcome } }));
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
