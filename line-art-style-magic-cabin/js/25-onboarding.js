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
        text: '嘿，你醒啦？欢迎搬进这栋小屋——从今天起，这里就是你的第一间经销部、第一块田，也是第一本账。',
        holdSeconds: 6
    },
    {
        text: '兜里只有 100 个金币，家底薄得很。可发家之路从来不是一夜暴富，是一笔一笔算，一步一步扛出来的——就像很多年前，也有人是从一个代销的小摊子开始的。',
        holdSeconds: 7
    },
    {
        text: '先别急着出门，大门我暂时给你锁上啦——趁现在没人催，把这屋子好好逛一圈：点亮壁炉、叫醒打盹的猫、翻翻桌上的魔法书。会交互，才会经营。',
        holdSeconds: 40,
        onEnter: lockFrontDoor,
        doneWhen: () => (typeof fireLit !== 'undefined' && fireLit) ||
            (typeof catAwake !== 'undefined' && catAwake) ||
            (typeof bookOn !== 'undefined' && bookOn) ||
            (typeof storageOpen !== 'undefined' && storageOpen) ||
            (typeof chestOpen !== 'undefined' && chestOpen)
    },
    {
        text: '看得差不多了吧？大门解锁了。左侧主线目标会给你指路，但怎么选、押多大、什么时候收手，要你自己判断。',
        holdSeconds: 7,
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
    updateLowFundsGuide(dt);
    updateSeedShortageGuide(dt);
    updateLandRentGuide(dt);
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

/* 主线每推进一章，紧跟着主线弹窗关闭之后，朋友再补一句感想——
   跟主线卡片本身的台词分开，用引导条的语气把这一章的价值观点一下。 */
function showThemeReflection(text) {
    if (guideActive) return;
    setTimeout(() => showGuideCard(text, 8), 900);
}
window.showThemeReflection = showThemeReflection;

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
    { id: 'cafe', x: 16.25, z: -10.0, radius: 3.8, text: '仓库旁边这间小屋是线稿咖啡馆，进去打工能赚点零花钱，适合手头紧的时候周转一下。' },
    { id: 'store', x: 10, z: -10, radius: 5.5, text: '这是村里的杂货铺兼仓库，手头缺种子了就来这儿淘一淘。' },
    { id: 'coin', x: -18.0, z: 8.2, radius: 6, text: '这家店看着不太正经……进去的人有赚有赔，你自己掂量着来，别上头。' },
    { id: 'tea', x: -11.5, z: -9.0, radius: 6, text: '这片地以后能改成茶园，不过得先把手头的事忙完，主线推进到这儿才行。' },
    { id: 'invest', x: -12.0, z: 8.5, radius: 6, text: '股市小屋，是手头宽裕了才该来的地方——早来也做不了什么，先别急。' }
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
            return;
        }
    }
    updateMomentIntros();
}

/* ---------------- 到了某个节点，朋友主动搭一句话 ----------------
   光靠"走到某个地方"触发引导，一趟逛完之后就再没声音了，
   显得像个只会念开场白的系统提示。这里补一批"做成了某件事"
   触发的节点，让引导在整个成长过程里都还在，而不是只在头几分钟。 */

const MOMENT_INTROS = [
    {
        id: 'first_harvest',
        text: '这是你第一次收获——别小看这一筐，发家之路上，谁都是从头一筐开始算的。',
        check: () => typeof farmHireState !== 'undefined' && farmHireState.playerHarvests >= 1
    },
    {
        id: 'first_hire',
        text: '雇上人了，往后地里的活不用你一个人扛了。管得好，是本事；管不好，也是学费。',
        check: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true
    },
    {
        id: 'first_land_rent',
        text: '这块地正式租下来了。荒地能不能变良田，就看接下来这几天你怎么伺候它。',
        check: () => typeof landState !== 'undefined' && landState.rentedUntilDay >= 0
    },
    {
        id: 'first_land_own',
        text: '地契拿到手了！从今往后这块地是你自己的，不用再看租期的脸色。',
        check: () => typeof landState !== 'undefined' && landState.owned === true
    },
    {
        id: 'first_tea_batch',
        text: '第一批成品茶做出来了。晒、炒、包，一步都不能省——这就是当年绍兴茶场教你的耐心。',
        check: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 1
    },
    {
        id: 'coins_500',
        text: '手头攒到 500 了。这时候最容易飘，也最容易被那些"稳赚不赔"的话术盯上——多留个心眼。',
        check: () => currentCoinsForGuide() >= 500
    },
    {
        id: 'coins_2000',
        text: '2000 金币，不是小数目了。是继续滚雪球，还是分一点出去做点稳妥的事，你自己拿主意。',
        check: () => currentCoinsForGuide() >= 2000
    },
    {
        id: 'first_seed_buy',
        text: '第一次花钱买种子——生意就是这样，先舍得投一点，才有得赚。',
        check: () => achievementStat('seedBuys') >= 1
    },
    {
        id: 'first_coin_shop',
        text: '进钱滚钱商店了。这地方看着像玩，其实是在练一件事：什么时候该收手。',
        check: () => achievementStat('coinShopEntries') >= 1
    },
    {
        id: 'first_investment',
        text: '第一次走进股市小屋。别急着下手，先把墙上的新闻看完——看得懂消息，比看得懂K线更要紧。',
        check: () => achievementStat('investmentEntries') >= 1
    },
    {
        id: 'first_weather_attempt',
        text: '花钱求了一次天——这年头，运气也是要花本钱去赌的，输赢都别往心里去。',
        check: () => achievementStat('weatherAttempts') >= 1
    },
    {
        id: 'first_newspaper',
        text: '会看报纸了。这个习惯留着——往后市场上的风吹草动，很多都是先从这些字里冒出来的。',
        check: () => achievementStat('newspaperReads') >= 1
    },
    {
        id: 'harvest_20',
        text: '收了二十趟地了。当年在茶场，师傅说过一句话：能把一件事做到底的人，差不了。',
        check: () => achievementStat('totalHarvests') >= 20
    }
];

function achievementStat(key) {
    if (typeof achievementState === 'undefined' || !achievementState.stats) return 0;
    return Number(achievementState.stats[key]) || 0;
}

/* ---------------- 手头紧了，主动指一条能周转的路 ----------------
   缺钱是这个游戏最常见的卡点：种子买不起、地租不上、主线金币门槛
   够不着。与其让玩家自己瞎逛发现咖啡馆，不如手头紧的时候主动说一句——
   这也是"不那么 free play"的一部分：遇到困境时，朋友会给条路，而不是
   把玩家晾在原地。 */

const LOW_FUNDS_THRESHOLD = 20;
const LOW_FUNDS_COOLDOWN = 150;
let lowFundsCooldownTimer = 20;

function updateLowFundsGuide(dt) {
    if (guideActive) return;
    if (window.APP_SHELL_BLOCK_GAME) return;
    if (!window.APP_ONBOARDING_DISMISSED) return;
    lowFundsCooldownTimer -= dt || 0;
    if (lowFundsCooldownTimer > 0) return;
    if (currentCoinsForGuide() > LOW_FUNDS_THRESHOLD) return;
    lowFundsCooldownTimer = LOW_FUNDS_COOLDOWN;
    const alreadyWorked = achievementStat('cafeEntries') >= 1;
    showGuideCard(
        alreadyWorked
            ? '手头又紧了——线稿咖啡馆那边随时能再去打一班工，先周转开，别硬扛着不吃饭。'
            : '兜里没剩几个钱了。别硬扛——仓库旁边那间线稿咖啡馆能打工赚零花钱，先去缓一口气，回头再种地也不迟。',
        8
    );
}

function currentCoinsForGuide() {
    return typeof cabinCoins === 'number' ? cabinCoins : 0;
}

/* ---------------- 缺种子了，主动提醒去商店补货 ----------------
   地已经翻好、也租下来了，结果因为背包里没种子干瞪眼——
   这种"卡在下一步"的情况最容易让人觉得无所适从，得主动说一句。 */

const SEED_SHORTAGE_COOLDOWN = 150;
let seedShortageCooldownTimer = 15;

function totalBackpackSeeds() {
    if (typeof window.CROP_ORDER === 'undefined' || typeof window.getBackpackItemCount !== 'function') return -1;
    return window.CROP_ORDER.reduce((sum, id) => {
        const crop = window.CROP_TYPES[id];
        return sum + (crop ? window.getBackpackItemCount(crop.seedItem) : 0);
    }, 0);
}

function updateSeedShortageGuide(dt) {
    if (guideActive) return;
    if (window.APP_SHELL_BLOCK_GAME) return;
    if (!window.APP_ONBOARDING_DISMISSED) return;
    if (typeof landState === 'undefined' || !isLandUsableForGuide()) return;
    seedShortageCooldownTimer -= dt || 0;
    if (seedShortageCooldownTimer > 0) return;
    const seedCount = totalBackpackSeeds();
    if (seedCount !== 0) return;
    seedShortageCooldownTimer = SEED_SHORTAGE_COOLDOWN;
    showGuideCard('背包里种子空了，地翻好了也种不下去——先去村里的杂货铺补点种子，手头紧就先买最便宜的萝卜种。', 8);
}

function isLandUsableForGuide() {
    return typeof isLandUsable === 'function' ? isLandUsable() : false;
}

/* ---------------- 地租快到期了，提前提醒 ----------------
   租期一到，地会被直接收回——与其让玩家某天突然发现地租不上了，
   不如提前一两天就提醒，给他时间准备。 */

const LAND_RENT_WARN_COOLDOWN = 200;
let landRentWarnCooldownTimer = 25;

function updateLandRentGuide(dt) {
    if (guideActive) return;
    if (window.APP_SHELL_BLOCK_GAME) return;
    if (!window.APP_ONBOARDING_DISMISSED) return;
    if (typeof landState === 'undefined' || landState.owned) return;
    if (typeof landDaysLeft !== 'function' || typeof currentFarmDay !== 'function') return;
    if (landState.rentedUntilDay < 0) return;
    const daysLeft = landDaysLeft();
    if (daysLeft <= 0 || daysLeft > 2) return;
    landRentWarnCooldownTimer -= dt || 0;
    if (landRentWarnCooldownTimer > 0) return;
    landRentWarnCooldownTimer = LAND_RENT_WARN_COOLDOWN;
    const canAfford = currentCoinsForGuide() >= (typeof LAND_RENT_COST === 'number' ? LAND_RENT_COST : 80);
    showGuideCard(
        canAfford
            ? '地租还剩 ' + daysLeft + ' 天就到期了——手头够钱，记得找地主续上，别到时候地被收回去。'
            : '地租只剩 ' + daysLeft + ' 天了，可手头的钱还不够续租——趁现在多收几趟、或者去咖啡馆打个工，别让地租断了。',
        8
    );
}

function momentIntroSeenKey() {
    return 'magicCabin.momentIntros.' + onboardingUserId() + '.v1';
}

let momentIntroSeen = null;
function loadMomentIntroSeen() {
    if (momentIntroSeen) return momentIntroSeen;
    try {
        momentIntroSeen = JSON.parse(localStorage.getItem(momentIntroSeenKey()) || '{}') || {};
    } catch (err) {
        momentIntroSeen = {};
    }
    return momentIntroSeen;
}
function markMomentIntroSeen(id) {
    const seen = loadMomentIntroSeen();
    seen[id] = true;
    try {
        localStorage.setItem(momentIntroSeenKey(), JSON.stringify(seen));
    } catch (err) { }
}

function updateMomentIntros() {
    const seen = loadMomentIntroSeen();
    for (const moment of MOMENT_INTROS) {
        if (seen[moment.id]) continue;
        let met = false;
        try {
            met = !!moment.check();
        } catch (err) {
            met = false;
        }
        if (met) {
            markMomentIntroSeen(moment.id);
            showGuideCard(moment.text, 7);
            return;
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
            '<br>它现在兜里只有 <b>100 金币</b>，屋外有荒地，路边有商店，远处还有钱滚钱商店和股市小屋。每一处都像一扇门。' +
            '<br>这条“发家之路”不是单纯把数字堆高：你会遇到租地、雇人、赌一把、投一笔、读新闻、看合同、做慈善这些选择。' +
            '<br>有些选择会赚钱，有些会亏钱；有些看起来慢，却会把路铺得更稳——从代销小摊到谈成一份承包，从一次广告豪赌到并下一间老厂，往后每一关，都是一次新的选择。'
    },
    {
        kicker: '在赚钱之前',
        title: '先认认这个家',
        body:
            '别急着往外冲。这栋房子自己也有些小秘密：点亮壁炉、叫醒打盹的猫、翻开桌上的魔法书、打开楼梯下的储物箱……' +
            '<br>每发现一处，都会计入成就墙。靠近物件按 <b>E</b>、用魔杖点一点、读报、打水、进咖啡馆，这些小动作也会被记录。' +
            '<br>仓库旁边有一间<b>线稿咖啡馆</b>，从屋外的咖啡馆小屋进去，就能打工赚点零花钱。屋里的魔法帽子现在只负责变糖果。' +
            '<br>花几分钟走一走、看一看，再出门赚钱也不迟——毕竟这是它以后很长一段时间里，唯一的家。'
    },
    {
        kicker: '经营判断',
        title: '看天气，看账本，也看字',
        body:
            '你会从第一块地开始：翻地、播种、浇水、收获。萝卜稳，白菜挑晴天，水稻爱雨，土豆更耐冷。种什么，要看今天的天气。' +
            '<br>后面的系统也一样：钱滚钱商店考验概率和收手，股市小屋考验新闻判断，财富事件会让你在投资、损失和慈善之间做选择。' +
            '<br>剧情里那些“广告豪赌”“兼并老厂”“逐字读合同”的精神，都会落到游戏操作里：别只看按钮，要看按钮背后的风险。' +
            '<br>左侧主线目标负责指路；真正的经营判断，要由你来做。'
    },
    {
        kicker: '成就墙',
        title: '你的每一步都会留下痕迹',
        body:
            '菜单 → 经营 → <b>成就墙</b> 里会记录这只史莱姆怎么一点点把日子过起来。' +
            '<br>农场不只看萝卜，<b>水稻、土豆、白菜</b>也都有自己的成就；天气也会影响收成，选错天气导致歉收，反而也是一段经历。' +
            '<br>金币、投资、钱滚钱商店、咖啡馆打工、慈善捐款，都会慢慢累积成不同的成就。' +
            '<br>不用刻意刷，正常玩就会亮起来；想挑战的话，就试试看把每种作物、每种交互、每条经营路线都走一遍。'
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
            '<p class="onboardingHint">忘了操作也没关系，左侧的主线目标会一直给你指路，随时可以在菜单"世界"标签页里重新打开这份说明。</p>'
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
