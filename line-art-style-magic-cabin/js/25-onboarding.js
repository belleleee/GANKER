'use strict';

/* ================================================================
   新手引导
   不再是一进门就甩一张挡住全屏的说明书——改成跟主线目标条同款的
   半透明小卡片，随玩家的探索节奏一条一条地浮现、消失，游戏全程不暂停。
   完整版的操作说明还留着，作为菜单里可以随时翻看的参考资料。
   ================================================================ */

const ONBOARDING_SESSION_KEY = 'magicCabin.session.v1';

/* "看没看过引导"要跟着账号/游客走，不能整个浏览器共用一个标记——
   否则换个账号或者退出登录切回游客，明明是"新玩家"，却因为这个浏览器
   之前看过引导就再也不会弹出来了。 */
function onboardingUserId() {
    try {
        const raw = localStorage.getItem(ONBOARDING_SESSION_KEY);
        if (!raw) return 'guest';
        const session = JSON.parse(raw);
        if (session && typeof session.id === 'string' && session.id.trim()) return session.id.trim();
    } catch (err) { }
    return 'guest';
}
function onboardingSeenKey() {
    return 'magicCabin.onboardingSeen.' + onboardingUserId() + '.v1';
}

/* 引导条还在走的时候，主线目标条先别出来抢戏——见 22-main-story.js 的 updateQuestGuide */
window.APP_ONBOARDING_DISMISSED = false;

/* ---------------- 半透明引导条：像朋友一样，一句一句地聊 ---------------- */

const GUIDE_STEPS = [
    {
        text: '嘿，你醒啦？欢迎搬进这栋小屋——往后这日子，就靠你自己了。',
        holdSeconds: 5
    },
    {
        text: '兜里就 100 个金币，家底薄，但日子还长。我在这陪着你，一步步来就好。',
        holdSeconds: 5
    },
    {
        text: '先别急着出门，大门我暂时给你锁上啦——趁现在没人催，把这屋子好好逛一圈：点亮壁炉、叫醒打盹的猫、翻翻桌上的魔法书……',
        holdSeconds: 40,
        onEnter: lockFrontDoor,
        doneWhen: () => (typeof fireLit !== 'undefined' && fireLit) ||
            (typeof catAwake !== 'undefined' && catAwake) ||
            (typeof bookOn !== 'undefined' && bookOn) ||
            (typeof storageOpen !== 'undefined' && storageOpen) ||
            (typeof chestOpen !== 'undefined' && chestOpen)
    },
    {
        text: '看得差不多了吧？大门给你解锁啦——想不起来怎么操作，右上角那个 ● 随时能打开菜单看说明。走吧，外面的日子等着你呢。',
        holdSeconds: 6,
        onEnter: unlockFrontDoor
    }
];

let guideIndex = -1;
let guideTimer = 0;
let guideActive = false;

const guideBanner = document.getElementById('guideBanner');
const guideBannerText = document.getElementById('guideBannerText');
const guideBannerSkip = document.getElementById('guideBannerSkip');

function showGuideCard(text, holdSeconds) {
    if (!guideBanner) return;
    guideBannerText.textContent = text;
    guideBanner.hidden = false;
    clearTimeout(showGuideCard._t);
    showGuideCard._t = setTimeout(() => {
        if (!guideActive) guideBanner.hidden = true;
    }, (holdSeconds || 6) * 1000);
}

function renderGuideStep() {
    const step = GUIDE_STEPS[guideIndex];
    if (!step || !guideBanner) return;
    guideBannerText.textContent = step.text;
    guideTimer = step.holdSeconds;
    guideBanner.hidden = false;
    if (typeof step.onEnter === 'function') step.onEnter();
}

function advanceGuide() {
    guideIndex++;
    if (guideIndex >= GUIDE_STEPS.length) {
        finishGuide();
        return;
    }
    renderGuideStep();
}

function finishGuide() {
    guideActive = false;
    if (guideBanner) guideBanner.hidden = true;
    unlockFrontDoor();
    window.APP_ONBOARDING_DISMISSED = true;
    try {
        localStorage.setItem(onboardingSeenKey(), '1');
    } catch (err) { }
}

function startGuideSequence() {
    guideActive = true;
    guideIndex = -1;
    advanceGuide();
}

function updateOnboardingGuide(dt) {
    updateLocationIntros();
    if (!guideActive) return;
    const step = GUIDE_STEPS[guideIndex];
    if (!step) return;
    if (typeof step.doneWhen === 'function' && step.doneWhen()) {
        advanceGuide();
        return;
    }
    guideTimer -= dt || 0;
    if (guideTimer <= 0) advanceGuide();
}

if (guideBannerSkip) {
    guideBannerSkip.addEventListener('click', event => {
        event.stopPropagation();
        finishGuide();
        if (typeof SND !== 'undefined') SND.play('ui');
    });
}

window.updateOnboardingGuide = updateOnboardingGuide;

/* ---------------- 大门暂时锁住：先把屋里逛完再出门 ---------------- */

function lockFrontDoor() {
    if (typeof doorGroup === 'undefined') return;
    window.APP_FRONT_DOOR_LOCKED = true;
    doorGroup.userData.onToggle = () => {
        showHintOverride('再等等，先把屋里逛完——外面的世界不会跑掉的');
        if (typeof SND !== 'undefined') SND.play('toggle');
    };
}

function unlockFrontDoor() {
    if (typeof doorGroup === 'undefined') return;
    if (!window.APP_FRONT_DOOR_LOCKED) return;
    window.APP_FRONT_DOOR_LOCKED = false;
    doorGroup.userData.onToggle = null;
    showHintOverride('🚪 大门解锁了，随时可以出门');
}

/* ---------------- 到了新地方，朋友在旁边跟你念叨两句 ---------------- */

const LOCATION_INTROS = [
    { id: 'farm', x: 9.0, z: 0.0, radius: 7, text: '到啦，这就是你的地——不过荒了挺久，得先找地主聊聊才能动手翻。' },
    { id: 'store', x: 10, z: -10, radius: 6, text: '这是村里的杂货铺，手头缺种子了就来这儿淘一淘。' },
    { id: 'coin', x: -18.0, z: 8.2, radius: 6, text: '这家店看着不太正经……进去的人有赚有赔，你自己掂量着来，别上头。' },
    { id: 'tea', x: -11.5, z: -9.0, radius: 6, text: '这片地以后能改成茶园，不过得先把手头的事忙完，主线推进到这儿才行。' },
    { id: 'invest', x: 16.5, z: -8.5, radius: 6, text: '股市小屋，是手头宽裕了才该来的地方——早来也做不了什么，先别急。' }
];

function locationIntroSeenKey() {
    return 'magicCabin.locationIntros.' + onboardingUserId() + '.v1';
}

let locationIntroSeen = null;
function loadLocationIntroSeen() {
    if (locationIntroSeen) return locationIntroSeen;
    try {
        locationIntroSeen = JSON.parse(localStorage.getItem(locationIntroSeenKey()) || '{}') || {};
    } catch (err) {
        locationIntroSeen = {};
    }
    return locationIntroSeen;
}
function markLocationIntroSeen(id) {
    const seen = loadLocationIntroSeen();
    seen[id] = true;
    try {
        localStorage.setItem(locationIntroSeenKey(), JSON.stringify(seen));
    } catch (err) { }
}

function updateLocationIntros() {
    if (guideActive) return;
    if (typeof player === 'undefined') return;
    if (window.APP_SHELL_BLOCK_GAME) return;
    const seen = loadLocationIntroSeen();
    for (const loc of LOCATION_INTROS) {
        if (seen[loc.id]) continue;
        const dx = player.pos.x - loc.x;
        const dz = player.pos.z - loc.z;
        if (Math.hypot(dx, dz) <= loc.radius) {
            markLocationIntroSeen(loc.id);
            showGuideCard(loc.text, 7);
            break;
        }
    }
}

(function autoStartGuideOnce() {
    let seen = false;
    try {
        seen = localStorage.getItem(onboardingSeenKey()) === '1';
    } catch (err) {
        seen = false;
    }
    if (seen) {
        window.APP_ONBOARDING_DISMISSED = true;
        return;
    }
    setTimeout(startGuideSequence, 800);
})();

/* ---------------- 完整版操作说明：菜单里随时可以翻看 ---------------- */

const ONBOARDING_STEPS = [
    {
        kicker: '这只史莱姆，是谁？',
        title: '一只白手起家的史莱姆',
        body:
            '这栋魔女小屋新来的房客，是一只会吃苦、会攒钱、也会做梦的史莱姆。' +
            '<br>它现在兜里只有 <b>100 金币</b>，屋子里堆着荒废的农田、落灰的商店，还有一间没人敢常去的钱滚钱商店。' +
            '<br>它的每一步成长——第一次收获、第一次雇人、第一次赌上全部身家——都会呼应着屋子深处，书架上那本《创业笔记》里，记下的某个真实创业者的一生。' +
            '<br>它的故事，接下来要由你亲手写。'
    },
    {
        kicker: '在赚钱之前',
        title: '先认认这个家',
        body:
            '别急着往外冲。这栋房子自己也有些小秘密：点亮壁炉、叫醒打盹的猫、翻开桌上的魔法书、打开楼梯下的储物箱……' +
            '<br>每发现一处，都会计入成就墙（菜单 → 经营 → 成就墙 可以查看）。' +
            '<br>屋里还挂着一顶魔法帽子——伸手摸一摸它，会变出糖果，糖果会把你带去<b>咖啡馆打工</b>，那是最快能上手赚点零花钱的路子。' +
            '<br>花几分钟走一走、看一看，再出门赚钱也不迟——毕竟这是它以后很长一段时间里，唯一的家。'
    },
    {
        kicker: '基本操作',
        title: '怎么操作这只史莱姆',
        body:
            '<div class="onboardingKeys">' +
            '<div><b>WASD / 方向键</b><span>移动</span></div>' +
            '<div><b>Shift</b><span>疾跑</span></div>' +
            '<div><b>空格</b><span>跳跃</span></div>' +
            '<div><b>E</b><span>交互 · 靠近物体后按 E</span></div>' +
            '<div><b>1</b><span>空手 / 播种</span></div>' +
            '<div><b>2</b><span>魔杖</span></div>' +
            '<div><b>3</b><span>锄头 · 翻地</span></div>' +
            '<div><b>4</b><span>水壶 · 浇水</span></div>' +
            '<div><b>5</b><span>镰刀 · 收割</span></div>' +
            '<div><b>V</b><span>切换视角</span></div>' +
            '<div><b>F / 鼠标右键</b><span>施法</span></div>' +
            '<div><b>右上角 ●</b><span>打开菜单</span></div>' +
            '</div>' +
            '<p class="onboardingHint">忘了操作也没关系，屏幕上方会一直有任务提示指路，随时可以在菜单"世界"标签页里重新打开这份说明。</p>'
    },
    {
        kicker: '第一个决定',
        title: '要不要 all-in？',
        body:
            '熟悉了家之后，真正的考验在门外——屋子东边那片荒地，地主愿意租给它，但开价 <b>80 金币</b>，几乎是它全部的家当。' +
            '<br>租下来，才能翻地种萝卜，走出发家的第一步；不租，就只能在屋子里继续晃荡。' +
            '<br>钱攒到一大笔之后，还能把这块地直接买断，从此不用再交租。' +
            '<br>这条路怎么走，走到农田边上，自然会有人问你。'
    }
];

let onboardingStepIndex = 0;

const onboardingPanel = document.getElementById('onboardingPanel');
const onboardingKicker = document.getElementById('onboardingKicker');
const onboardingTitle = document.getElementById('onboardingTitle');
const onboardingBody = document.getElementById('onboardingBody');
const onboardingPrevBtn = document.getElementById('onboardingPrevBtn');
const onboardingNextBtn = document.getElementById('onboardingNextBtn');
const closeOnboardingBtn = document.getElementById('closeOnboardingBtn');
const onboardingMenuBtn = document.getElementById('onboardingMenuBtn');

function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[onboardingStepIndex];
    if (!step || !onboardingPanel) return;
    onboardingKicker.textContent = step.kicker + ' · ' + (onboardingStepIndex + 1) + ' / ' + ONBOARDING_STEPS.length;
    onboardingTitle.textContent = step.title;
    onboardingBody.innerHTML = step.body;
    onboardingPrevBtn.hidden = onboardingStepIndex === 0;
    const isLast = onboardingStepIndex === ONBOARDING_STEPS.length - 1;
    onboardingNextBtn.textContent = isLast ? '知道了' : '下一步';
}

function openOnboardingPanel() {
    if (!onboardingPanel) return;
    onboardingStepIndex = 0;
    renderOnboardingStep();
    onboardingPanel.hidden = false;
    if (guideBanner) guideBanner.hidden = true;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeOnboardingPanel() {
    if (!onboardingPanel) return;
    onboardingPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function onboardingNext() {
    if (onboardingStepIndex >= ONBOARDING_STEPS.length - 1) {
        closeOnboardingPanel();
        return;
    }
    onboardingStepIndex++;
    renderOnboardingStep();
    if (typeof SND !== 'undefined') SND.play('ui');
}

function onboardingPrev() {
    if (onboardingStepIndex <= 0) return;
    onboardingStepIndex--;
    renderOnboardingStep();
    if (typeof SND !== 'undefined') SND.play('ui');
}

if (onboardingNextBtn) onboardingNextBtn.addEventListener('click', onboardingNext);
if (onboardingPrevBtn) onboardingPrevBtn.addEventListener('click', onboardingPrev);
if (closeOnboardingBtn) closeOnboardingBtn.addEventListener('click', closeOnboardingPanel);
if (onboardingMenuBtn) onboardingMenuBtn.addEventListener('click', openOnboardingPanel);
if (onboardingPanel) {
    onboardingPanel.addEventListener('click', event => {
        if (event.target === onboardingPanel) closeOnboardingPanel();
    });
}
addEventListener('keydown', event => {
    if (!onboardingPanel || onboardingPanel.hidden) return;
    if (event.key === 'Escape') closeOnboardingPanel();
    if (event.key === 'Enter') onboardingNext();
    if (event.key === 'ArrowLeft') onboardingPrev();
    if (event.key === 'ArrowRight') onboardingNext();
});
