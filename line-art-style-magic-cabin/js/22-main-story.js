'use strict';

/* ================================================================
   主线剧情
   把 农场 → 茶场 → 钱滚钱商店 → 股市 串成一条经营线。
   第一份农场简历承接 plot 序章：从旧宅、农场、茶场到返城，
   这里的主线卡片负责把剧情的精神落到每个经营系统的目标上。
   ================================================================ */

const MAIN_STORY_STAGES = [
    {
        unlocks: null,
        title: '序章 · 从一块地开始',
        lines: [
            { speaker: '旁白', text: '你翻完第三次萝卜地，手心被锄柄磨得发烫。那一刻你忽然想起序章里那句话：往后这个家，不靠祖宗，靠手脚。' },
            { speaker: '旁白', text: '可一个人硬扛，终究扛不出一座农场。能把日子撑下去的人，也要学会把事情交给可靠的人。' },
            { speaker: '你', text: '先把第一份简历看完。如果他真是愿意替家里分担的人，就让他来试试。' }
        ],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '去农场找地主租地（付得起就 all-in），翻地种萝卜（没种子先去商店买），种出来后雇一个农场帮手',
        target: { x: 9.0, z: 0.0 },
        reflection: '记住这块地翻起来的手感——往后不管账本变多大，起点都是它。',
        auto: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true &&
            typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        unlocks: null,
        title: '第一部分 · 代销小摊（1987）',
        lines: [
            { speaker: '旁白', text: '厂里供销科的活儿干了九年，你听说上城区有个校办经销部年年亏钱，正打算对外承包。' },
            { speaker: '旁白', text: '想接这摊子，先得有点本钱，也得让人看见你是真能吃苦做买卖的人。你借了辆三轮车，在学校门口支起摊子：汽水、冰棍、毛巾、文具，什么都卖。' },
            { speaker: '你', text: '先别想太远。眼下就一个目标：攒够 110 个金币，攒够了，就有资格去会一会那位蒋经理。' }
        ],
        unlockToast: '📖 主线推进：小摊的本钱攒够了',
        questLabel: '在商店和农场之间倒腾生意，攒够 110 金币',
        target: { x: 10, z: -10 },
        coinRequirement: 110,
        lockedHint: '110 个金币还没攒够——小买卖就是这样，急不来，一笔一笔算才靠谱。',
        reflection: '110 个金币不算多，但这是你第一次，靠自己的本事把它凑齐的。',
        auto: () => currentCoins() >= 110
    },
    {
        unlocks: 'tea',
        title: '第二部分 · 承包谈判（1987）',
        lines: [
            { speaker: '旁白', text: '竞标那天，蒋经理坐镇多年，资历深、关系广，是这一行谁都绕不开的人物。评委葛局长手里的笔悬着，迟迟没落下。' },
            { speaker: '老陆', text: '别怕，你手上有的是他没有的——你敢吃苦，敢承诺，也懂门路。他有的，只是资历和关系户。' },
            { speaker: '你', text: '我承诺，第一年净利四万，第二年，十万。' },
            { speaker: '旁白', text: '一句话把在场的人都镇住了。合同签下来那天，退休的周老师和范老师主动留下来帮衬——往后这些年，他们会是最信得过的人。' },
            { speaker: '你', text: '茶场也该开出来了。一块地能顾住今天，一片茶场才顾得住明天。' }
        ],
        unlockToast: '📖 主线推进：茶场解锁了',
        questLabel: '去看看院子里那片茶场',
        target: { x: -11.5, z: -9.0 },
        coinRequirement: 250,
        lockedHint: '合同还没谈成——离承诺兑现还差一点，先把手头的钱攒够。',
        reflection: '话说出去了，就得做到——这是你在竞标桌上学到的第一课。'
    },
    {
        unlocks: 'coin',
        title: '第三部分 · 广告豪赌（1988）',
        lines: [
            { speaker: '旁白', text: '茶场有了收入，你请了朱教授帮忙研究儿童营养饮品——他起初直摆手，说这类"补品"十有八九是骗钱的花招，直到你把 300 多份孩子的饮食记录摆在他面前。' },
            { speaker: '旁白', text: '配方定下来那天，厂里的小孩们围着抢着起名字，最后喊出了一句"娃哈哈"——这个名字，就这么定了下来。' },
            { speaker: '郑主任', text: '电视台黄金时段还剩一个位置，广告费不便宜。你要不要赌这一把？' }
        ],
        unlockToast: '📖 主线推进：钱滚钱商店解锁了',
        questLabel: '去钱滚钱商店看看',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 900,
        lockedHint: '茶场的收入还没攒到能承受一次冒险的地步——先把本业做扎实。',
        choices: [
            {
                label: '上黄金时段广告（豪赌一把，成本高但覆盖广）',
                resultText: '你咬牙签下了黄金时段的合同。第二天订单就像雪片一样飞进来，娃哈哈这个名字，一下子传遍了半座城。',
                coinBonus: 260,
                flag: 'adGambleWon'
            },
            {
                label: '上便宜时段（稳妥，但效果有限）',
                resultText: '你选了便宜时段。订单确实涨了一些，但远没有想象中猛——至少这一步，走得稳当。',
                coinBonus: 90,
                flag: null
            }
        ],
        reflection: '进那扇门之前再想一遍：赢了别贪，输了别赌气加倍——这才是过关的本事。'
    },
    {
        unlocks: null,
        title: '第四部分 · 兼并国企（1991）',
        lines: [
            { speaker: '旁白', text: '娃哈哈营养食品厂已经有 140 个人，订单却还是接不过来。这时候，杭州罐头厂——曾经全国数一数二的大厂，如今 2200 号人闲着没活干——被中间人刘处长带到了你面前。' },
            { speaker: '王师傅', text: '厂里的人都在传，说你们要来是要裁人的。这话是真是假？' },
            { speaker: '你', text: '不裁人，工资照发，亏了算我自己的——但这个厂，我要真正接过来，不是挂个名。' }
        ],
        unlockToast: '📖 主线推进：罐头厂的事定下来了',
        questLabel: '想想罐头厂的事该怎么办',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 1500,
        lockedHint: '手头的钱还不够撑起一次真正的兼并——账上的底气得再攒攒。',
        auto: () => currentCoins() >= 1500,
        choices: [
            {
                label: '有偿兼并（掏 400 金币买断，担子重但产能真正归你）',
                resultText: '你把身家掏了大半，签下兼并合同。王师傅带头，厂里的老工人没有一个走的——这份信任，比钱更值钱。',
                coinCost: 400,
                coinBonus: 0,
                flag: 'factoryBonus'
            },
            {
                label: '联营/租赁（风险小，但产能终究不是自己的）',
                resultText: '你选了更稳妥的联营方式。厂子转起来了，但设备和产能说到底还是人家的，往后想扩大手脚都施展不开。',
                coinBonus: 60,
                flag: null
            }
        ],
        reflection: '不裁人、工资照发——这句话说出口容易，扛下去难。往后几年，会证明这句话值不值钱。'
    },
    {
        unlocks: null,
        title: '第五部分 · 非常可乐（1998）',
        lines: [
            { speaker: '旁白', text: '七年过去，可口可乐和百事可乐把大城市的货架占得满满当当，国产汽水一个接一个被挤出局——人称"水淹七军"。' },
            { speaker: '金总', text: '大城市这条路，你们真挤不进去——渠道、品牌、资本，哪一样比得过人家？' },
            { speaker: '你', text: '大城市挤不进去，那就换一条路——这些年跑遍乡镇攒下的联销体，才是我真正的底牌。' }
        ],
        unlockToast: '📖 主线推进：非常可乐的路子定下来了',
        questLabel: '想想非常可乐该走哪条路',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 2000,
        lockedHint: '这一步的本钱还没攒够——非常可乐输不起，得等手头再宽裕些。',
        auto: () => currentCoins() >= 2000,
        choices: [
            {
                label: '避开大城市，靠乡镇联销体铺货（稳扎稳打，田老板这样的老伙计最先接货）',
                resultText: '田老板第一个进了货，乡镇的小卖部一家接一家跟上。可口可乐和百事可乐盯着大城市，谁也没顾上这条"农村包围城市"的路。',
                coinBonus: 380,
                flag: 'ruralNetwork'
            },
            {
                label: '跟可口可乐、百事可乐正面打广告战（硬碰硬，资本拼不过人家）',
                resultText: '广告砸出去不少钱，声势没造起来几分，反倒被城里的经销商挤得没了脾气——这条路，走错了方向。',
                coinCost: 200,
                coinBonus: 0,
                flag: null
            }
        ],
        reflection: '别人的地盘，别硬闯；自己走出来的路，才是真的底牌。'
    },
    {
        unlocks: 'investment',
        title: '第六章 · 看懂更大的账',
        lines: [
            { speaker: '旁白', text: '非常可乐站稳了脚跟，你已经不只是在种地、炒茶、抛硬币了。越来越多的钱开始变成合同、股价、消息和预期。' },
            { speaker: '旁白', text: '市场会给人错觉：上涨时像所有门都打开，下跌时像所有路都堵死。可真正要紧的，是看懂这背后的生意。' },
            { speaker: '你', text: '去股市小屋看看。买之前先读新闻，赚钱之前先学会判断。' }
        ],
        unlockToast: '📖 主线推进：股市小屋解锁了',
        questLabel: '去股市小屋看看',
        target: { x: -12.0, z: 8.5 },
        coinRequirement: 2500,
        lockedHint: '手头的钱还撑不起看盘的资格——股市不是先来后到，是水到渠成。',
        reflection: '账上的数字越来越大，但记账的规矩不能变：先看懂，再动手。'
    },
    {
        unlocks: null,
        title: '第七章 · 达能之争（2007）',
        lines: [
            { speaker: '旁白', text: '九年前引进的那家外资合作方，忽然打来电话，说要谈"续约"的事——开口就是 40 亿，收购商标和渠道。' },
            { speaker: '沈律师', text: '这份合同是十年前签的，条款很长，措辞也很绕。有几条看着普通，其实藏着陷阱——真要签字，得一条一条核对清楚。' },
            { speaker: '王师傅', text: '厂里的账、厂里的人，我们信得过你。这次的字，你自己看着签。' }
        ],
        unlockToast: '📖 主线推进：合同的事，该有个了断了',
        questLabel: '决定要怎么处理这份合同',
        target: { x: -12.0, z: 8.5 },
        coinRequirement: 4000,
        lockedHint: '这一关不看钱多钱少，是账上的底气——再攒攒，等真正能扛事了再来。',
        auto: () => currentCoins() >= 4000,
        choices: [
            {
                label: '仔细核对每一条条款，哪怕慢一点、麻烦一点',
                resultText: '你带着沈律师把合同一条一条抠了下来，真找出了两条藏着陷阱的条款——一条关于商标转让的审批权，一条关于"类似资产"的优先收购权。合同改了，公司还是你的。',
                ending: 'good',
                flag: 'contractRead'
            },
            {
                label: '先签了再说，机会不等人，条款以后再慢慢扯',
                resultText: '合同签下去了，你才发现那几条绕来绕去的条款，早把商标和渠道的主动权让了出去。',
                ending: 'bad',
                flag: null
            }
        ]
    }
];

const ENDINGS = {
    good: {
        title: '结局 · 这块牌子还是你的',
        lines: [
            '合同改完那天，你把"娃哈哈"的牌子擦了一遍又一遍。字里行间的陷阱，你一条一条读了出来，没有一步是靠运气。',
            '王师傅在厂门口放了挂鞭炮，田老板从乡下赶了大半天路过来道喜。他们说的不多，就一句：这块牌子，还是咱们自己的。',
            '从代销小摊到今天，你没靠谁的祖荫，也没被哪份合同绕进去——一步一步，扛下来的。'
        ],
        achievement: 'ending_good'
    },
    bad: {
        title: '结局 · 替别人做的嫁衣',
        lines: [
            '那年冬天，"娃哈哈"的招牌被人摘了下来，换上了一块新的牌子。你手里攥着那份签了字的合同，忽然觉得那些绕来绕去的条款，原来早就写好了结局。',
            '王师傅和田老板还是没走。"东西换了牌子，可账和人没换"——他们这么说的时候，你才知道，有些东西，合同抢不走。',
            '你没有输给任何人，只是输给了一张没读懂的纸，和当年那点"先签了再说"的侥幸。路还长，摔一跤，才看得更清楚一点。'
        ],
        achievement: 'ending_bad',
        retry: true
    }
};

let mainStoryState = { stage: 0, flags: {}, endingId: null };
let mainStoryPendingProceed = null;

const mainStoryPanel = document.getElementById('mainStoryPanel');
const mainStoryTitle = document.getElementById('mainStoryTitle');
const mainStoryBody = document.getElementById('mainStoryBody');
const mainStoryChoices = document.getElementById('mainStoryChoices');
const mainStoryNextBtn = document.getElementById('mainStoryNextBtn');

const endingPanel = document.getElementById('endingPanel');
const endingKicker = document.getElementById('endingKicker');
const endingTitle = document.getElementById('endingTitle');
const endingBody = document.getElementById('endingBody');
const endingCloseBtn = document.getElementById('endingCloseBtn');

function mainStoryStageIndexFor(key) {
    return MAIN_STORY_STAGES.findIndex(stage => stage.unlocks === key);
}

function isFeatureUnlocked(key) {
    const idx = mainStoryStageIndexFor(key);
    if (idx < 0) return true;
    return mainStoryState.stage > idx;
}

function currentCoins() {
    return typeof cabinCoins === 'number' ? cabinCoins : 0;
}

function stageCoinsMet(stage) {
    return !stage.coinRequirement || currentCoins() >= stage.coinRequirement;
}

function renderMainStoryCard(stage) {
    mainStoryTitle.textContent = stage.title;
    const met = stageCoinsMet(stage);
    let html = stage.lines.map(line =>
        '<p><span class="mainStorySpeaker">' + line.speaker + '</span>' + line.text + '</p>'
    ).join('');
    if (stage.coinRequirement) {
        html += '<p class="mainStoryCoinNote' + (met ? ' met' : '') + '">💰 需要攒够 ' + stage.coinRequirement +
            ' 金币才能推进 · 当前 ' + currentCoins() + (met ? ' · 已达成' : '') + '</p>';
        if (!met && stage.lockedHint) {
            html += '<p class="mainStoryCoinNote">' + stage.lockedHint + '</p>';
        }
    }
    mainStoryBody.innerHTML = html;

    if (Array.isArray(stage.choices) && mainStoryChoices) {
        mainStoryChoices.hidden = false;
        mainStoryChoices.innerHTML = stage.choices.map((choice, i) =>
            '<button type="button" class="mainStoryChoiceBtn" data-choice="' + i + '"' + (met ? '' : ' disabled') + '>' +
            choice.label + '</button>'
        ).join('');
        if (mainStoryNextBtn) mainStoryNextBtn.hidden = true;
    } else {
        if (mainStoryChoices) {
            mainStoryChoices.hidden = true;
            mainStoryChoices.innerHTML = '';
        }
        if (mainStoryNextBtn) {
            mainStoryNextBtn.hidden = false;
            mainStoryNextBtn.disabled = !met;
            mainStoryNextBtn.textContent = met ? '继续' : '金币还不够';
        }
    }
}

function openMainStoryStage(idx, proceed) {
    if (!mainStoryPanel) {
        if (typeof proceed === 'function') proceed();
        return;
    }
    const stage = MAIN_STORY_STAGES[idx];
    if (!stage) {
        if (typeof proceed === 'function') proceed();
        return;
    }
    mainStoryPendingProceed = proceed || null;
    renderMainStoryCard(stage);
    mainStoryPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeMainStoryStage(unlocked) {
    if (!mainStoryPanel) return;
    mainStoryPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (!unlocked) mainStoryAutoCooldown = 6;
    const proceed = mainStoryPendingProceed;
    mainStoryPendingProceed = null;
    if (unlocked && typeof proceed === 'function') proceed();
    if (typeof saveGameState === 'function') saveGameState(false);
}

function advanceMainStoryStage(stage, resultText) {
    const idx = mainStoryState.stage;
    mainStoryState.stage = idx + 1;
    if (typeof showHintOverride === 'function') showHintOverride(resultText || stage.unlockToast);
    if (typeof SND !== 'undefined') SND.play('chim');
    if (stage.reflection && typeof window.showThemeReflection === 'function') {
        window.showThemeReflection(stage.reflection);
    }
    closeMainStoryStage(true);
}

function onMainStoryNext() {
    const idx = mainStoryState.stage;
    const stage = MAIN_STORY_STAGES[idx];
    if (!stage) {
        closeMainStoryStage(false);
        return;
    }
    if (Array.isArray(stage.choices)) return;
    if (!stageCoinsMet(stage)) {
        if (typeof showHintOverride === 'function') {
            showHintOverride('金币还不够，需要攒到 ' + stage.coinRequirement + ' 金币（当前 ' + currentCoins() + '）');
        }
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    advanceMainStoryStage(stage, stage.unlockToast);
}

function onMainStoryChoice(choiceIndex) {
    const idx = mainStoryState.stage;
    const stage = MAIN_STORY_STAGES[idx];
    if (!stage || !Array.isArray(stage.choices)) return;
    if (!stageCoinsMet(stage)) {
        if (typeof showHintOverride === 'function') {
            showHintOverride('金币还不够，需要攒到 ' + stage.coinRequirement + ' 金币（当前 ' + currentCoins() + '）');
        }
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    const choice = stage.choices[choiceIndex];
    if (!choice) return;
    if (choice.coinCost && typeof spendCabinCoins === 'function') {
        if (!spendCabinCoins(choice.coinCost, '兼并/投入')) return;
    }
    if (choice.coinBonus && typeof window.addCabinCoins === 'function') {
        window.addCabinCoins(choice.coinBonus, false);
    }
    if (choice.flag) mainStoryState.flags[choice.flag] = true;
    if (choice.ending) mainStoryState.endingId = choice.ending;
    advanceMainStoryStage(stage, choice.resultText || stage.unlockToast);
    if (choice.ending) {
        setTimeout(() => triggerEnding(choice.ending), 700);
    }
}

if (mainStoryChoices) {
    mainStoryChoices.addEventListener('click', event => {
        const btn = event.target.closest('.mainStoryChoiceBtn');
        if (!btn || btn.disabled) return;
        onMainStoryChoice(Number(btn.dataset.choice));
    });
}

/* ================================================================
   结局：目前只有"达能之争"这一关会分出好/坏两条结局，
   坏结局允许重新回去把合同再读一遍。
   ================================================================ */

function triggerEnding(id) {
    const ending = ENDINGS[id];
    if (!ending) return;
    mainStoryState.endingId = id;
    if (!endingPanel) return;
    endingKicker.textContent = id === 'good' ? '结局 · 好结局' : '结局 · 坏结局';
    endingTitle.textContent = ending.title;
    endingBody.innerHTML = ending.lines.map(t => '<p>' + t + '</p>').join('') +
        (ending.retry ? '<p class="endingRetryNote">合上账本，深吸一口气——愿意的话，可以回去把那份合同再读一遍。</p>' : '');
    if (endingCloseBtn) endingCloseBtn.textContent = ending.retry ? '回去重新读合同' : '合上这本账';
    endingPanel.hidden = false;
    endingPanel.dataset.retry = ending.retry ? '1' : '0';
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
}

function closeEndingPanel() {
    if (!endingPanel) return;
    const retry = endingPanel.dataset.retry === '1';
    endingPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (retry) {
        const idx = MAIN_STORY_STAGES.findIndex(s => Array.isArray(s.choices) && s.choices.some(c => c.ending));
        if (idx >= 0) mainStoryState.stage = idx;
        mainStoryState.endingId = null;
    }
    if (typeof saveGameState === 'function') saveGameState(false);
}

if (endingCloseBtn) endingCloseBtn.addEventListener('click', closeEndingPanel);

/**
 * 想进入某个受主线门槛控制的系统时调用：
 * - 已解锁：直接执行 proceed()
 * - 还没轮到它：提示先完成前面的章节
 * - 正好是下一章：弹出主线卡片，读完就解锁并执行 proceed()
 */
function requestMainStoryAccess(key, proceed) {
    if (isFeatureUnlocked(key)) {
        if (typeof proceed === 'function') proceed();
        return;
    }
    const idx = mainStoryStageIndexFor(key);
    if (idx !== mainStoryState.stage) {
        if (typeof showHintOverride === 'function') showHintOverride('主线还没到这里，先把前面的剧情走完');
        return;
    }
    openMainStoryStage(idx, proceed);
}

let mainStoryAutoCooldown = 0;

/**
 * 有些章节没有实体的门可以走进去触发（比如序章：种地+雇人），
 * 靠这个每帧轮询一次，达成条件就自动弹出主线卡片。
 */
function pollAutoStageAdvance() {
    const stage = MAIN_STORY_STAGES[mainStoryState.stage];
    if (!stage || typeof stage.auto !== 'function') return;
    if (mainStoryPanel && !mainStoryPanel.hidden) return;
    if (mainStoryAutoCooldown > 0) return;
    if (!window.APP_ONBOARDING_DISMISSED) return;
    let met = false;
    try {
        met = !!stage.auto();
    } catch (err) {
        met = false;
    }
    if (met) openMainStoryStage(mainStoryState.stage, null);
}

function captureMainStoryState() {
    return {
        stage: mainStoryState.stage,
        flags: Object.assign({}, mainStoryState.flags),
        endingId: mainStoryState.endingId || null
    };
}

function applyMainStoryState(raw) {
    const stage = Math.max(0, Math.min(MAIN_STORY_STAGES.length, Math.trunc(Number(raw && raw.stage) || 0)));
    const flags = (raw && raw.flags && typeof raw.flags === 'object') ? Object.assign({}, raw.flags) : {};
    const endingId = (raw && (raw.endingId === 'good' || raw.endingId === 'bad')) ? raw.endingId : null;
    mainStoryState = { stage, flags, endingId };
}

/* ================================================================
   任务目标 + 方向指引
   屏幕上常驻一个目标提示条，箭头始终指向当前主线目标的方向。
   ================================================================ */

const questBanner = document.getElementById('questBanner');
const questArrow = document.getElementById('questArrow');
const questText = document.getElementById('questText');
const questDistance = document.getElementById('questDistance');
const QUEST_GUIDE_COLLAPSED_KEY = 'magicCabin.questGuideCollapsed.v1';

let questGuideCollapsed = false;
try {
    questGuideCollapsed = localStorage.getItem(QUEST_GUIDE_COLLAPSED_KEY) === '1';
} catch (err) {
    questGuideCollapsed = false;
}

function applyQuestGuideCollapsed() {
    if (!questBanner || !questArrow) return;
    questBanner.classList.toggle('collapsed', questGuideCollapsed);
    questArrow.setAttribute('aria-expanded', questGuideCollapsed ? 'false' : 'true');
    questArrow.setAttribute('aria-label', questGuideCollapsed ? '展开主线目标' : '收起主线目标');
    questArrow.title = questGuideCollapsed ? '展开主线目标' : '收起主线目标';
}

function setQuestGuideCollapsed(collapsed) {
    questGuideCollapsed = !!collapsed;
    applyQuestGuideCollapsed();
    try {
        localStorage.setItem(QUEST_GUIDE_COLLAPSED_KEY, questGuideCollapsed ? '1' : '0');
    } catch (err) { }
}

if (questArrow) {
    questArrow.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setQuestGuideCollapsed(!questGuideCollapsed);
        if (typeof SND !== 'undefined') SND.play('ui');
    });
}
applyQuestGuideCollapsed();

function currentMainStoryObjective() {
    const stage = MAIN_STORY_STAGES[mainStoryState.stage];
    if (!stage) return null;
    let label = stage.questLabel;
    if (stage.coinRequirement && !stageCoinsMet(stage)) {
        label += '（攒够 ' + stage.coinRequirement + ' 金币 · 当前 ' + currentCoins() + '）';
    }
    return { label, x: stage.target.x, z: stage.target.z };
}

function updateQuestGuide(dt) {
    if (mainStoryAutoCooldown > 0) mainStoryAutoCooldown -= dt || 0;
    pollAutoStageAdvance();
    if (!questBanner) return;
    const objective = currentMainStoryObjective();
    if (!objective || typeof player === 'undefined' || (mainStoryPanel && !mainStoryPanel.hidden) || !window.APP_ONBOARDING_DISMISSED) {
        questBanner.hidden = true;
        return;
    }
    questBanner.hidden = false;
    questText.textContent = objective.label;

    const dx = objective.x - player.pos.x;
    const dz = objective.z - player.pos.z;
    const dist = Math.hypot(dx, dz);
    questDistance.textContent = Math.round(dist) + ' 米';

    const targetAngle = Math.atan2(dx, dz);
    const heading = typeof camYaw === 'number' ? camYaw : (player.yaw || 0);
    let rel = targetAngle - heading;
    rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    questArrow.style.transform = 'rotate(' + (rel * 180 / Math.PI) + 'deg)';
}

window.updateQuestGuide = updateQuestGuide;

if (mainStoryNextBtn) mainStoryNextBtn.addEventListener('click', onMainStoryNext);
if (mainStoryPanel) {
    mainStoryPanel.addEventListener('click', event => {
        if (event.target === mainStoryPanel) closeMainStoryStage(false);
    });
}
addEventListener('keydown', event => {
    if (!mainStoryPanel || mainStoryPanel.hidden) return;
    if (event.key === 'Escape') closeMainStoryStage(false);
    if (event.key === 'Enter') onMainStoryNext();
});

window.requestMainStoryAccess = requestMainStoryAccess;
window.isMainStoryFeatureUnlocked = isFeatureUnlocked;
window.captureMainStoryState = captureMainStoryState;
window.applyMainStoryState = applyMainStoryState;
