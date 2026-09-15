'use strict';

/* ================================================================
   主线剧情
   核心不是传记，也不是小游戏合集：
   一次失败的炼金术，让一个务实又固执的老人留在玩家身边。
   玩家通过种田、采茶、现金流和投资逐渐认识他，直到中后期才知道
   他是谁。经营系统是认识人物的方法，不是人物讲系统的工具。
   ================================================================ */

const MAIN_STORY_STAGES = [
    {
        unlocks: null,
        silent: true,
        title: '序章 · 炼金失败之后',
        lines: [
            { speaker: '旁白', text: '你照着《炼金术：如何把一枚硬币变成两枚》把旧硬币、茶叶和星尘丢进锅里。火光一跳，整间小屋黑了下来。' },
            { speaker: '旁白', text: '灯再亮时，角落多了一个老人。他拍了拍衣袖，看了一圈乱糟糟的小屋。' },
            { speaker: '老人', text: '这是哪儿？怎么连个正经货架都没有？' },
            { speaker: '你', text: '……我家。你谁啊？' },
            { speaker: '老人', text: '叫我宗师傅吧。你先别研究黄金了，外头那块地空着。' }
        ],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '打开发光的炼金书，取瓶架材料，再启动坩埚',
        target: { x: -3.58, z: -3.05 },
        reflection: '你认识到宗师傅的第一面：他不讲发财神话，只让你先把地种出来。',
        prologuePartAfter: 1,
        auto: () => typeof isAlchemyIntroComplete === 'function' && isAlchemyIntroComplete()
    },
    {
        unlocks: 'tea',
        title: '第一部分 · 七块钱也是钱',
        lines: [
            { speaker: '旁白', text: '你第一次把作物换成现金，算完账只多了几枚金币，心里难免泄气。' },
            { speaker: '你', text: '才赚这么点？' },
            { speaker: '宗师傅', text: '七块不是钱？' },
            { speaker: '你', text: '……是。' },
            { speaker: '宗师傅', text: '那就接着干。车轮停下，现金也就停下。' },
            { speaker: '旁白', text: '你不知道他为什么这么在意现金，只觉得这个老人抠得近乎固执。' }
        ],
        unlockToast: '📖 主线推进：茶园解锁了',
        questLabel: '生产作物 → 接第一笔订单 → 攒够 110 金币',
        target: { x: 9.0, z: 0.0 },
        coinRequirement: 110,
        lockedHint: '先完成一笔送货，并攒够 110 金币。',
        reflection: '你认识到宗师傅的第二面：钱不能断。利润写在纸上，现金握在手里。',
        prologuePartAfter: 2,
        auto: () => storyStat('deliveryCount') >= 1 && currentCoins() >= 110
    },
    {
        unlocks: 'coin',
        title: '第二部分 · 比蹬三轮轻松',
        lines: [
            { speaker: '旁白', text: '茶园开出来后，你开始采茶、晒茶、炒茶、装袋。流程变长了，回钱也变慢了。' },
            { speaker: '你', text: '这比种田麻烦多了。' },
            { speaker: '宗师傅', text: '比蹬三轮轻松。' },
            { speaker: '你', text: '你还蹬过三轮？送什么？' },
            { speaker: '宗师傅', text: '货。' },
            { speaker: '旁白', text: '他没有继续说。你第一次得到一个碎片：宗师傅以前不是坐在办公室里的人。' }
        ],
        unlockToast: '📖 主线推进：钱滚钱商店解锁了',
        questLabel: '完成茶叶生产链：采茶、晒茶、炒茶、装袋',
        target: { x: -11.5, z: -9.0 },
        lockedHint: '先把一批茶叶做成成品，弄明白产品怎么从田里走到市场。',
        reflection: '你认识到宗师傅的第三面：他所有判断，好像都从“货到底卖不卖得出去”开始。',
        prologuePartAfter: 3,
        auto: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 1
    },
    {
        unlocks: null,
        title: '第三部分 · 广告豪赌（1988）',
        lines: [
            { speaker: '旁白', text: '茶场有了收入，你开始琢磨把饮品做成真正的商品。包装、名字、宣传，每一项都要钱。' },
            { speaker: '宗师傅', text: '别先想着好看。喝的东西，先得好喝。' },
            { speaker: '旁白', text: '配方定下来那天，几个孩子围着抢着起名字，最后喊出了一句"娃哈哈"——这个名字，就这么留在了账本上。' },
            { speaker: '郑主任', text: '电视台黄金时段还剩一个位置，广告费不便宜。你要不要赌这一把？' },
            { speaker: '宗师傅', text: '东西能卖，广告才叫放大。东西卖不动，广告就是烧钱。' },
            { speaker: '旁白', text: '这是你第一次看见他的冒险：他不是爱赌，他只是认定以后，很少愿意退。' }
        ],
        unlockToast: '📖 主线推进：广告方案定下来了',
        questLabel: '去钱滚钱商店体验一次：钱可以生钱，也可以归零',
        target: { x: -6.2, z: -9.2 },
        lockedHint: '先去钱滚钱商店体验一次，再决定敢不敢押广告。',
        choices: [
            {
                label: '上黄金时段广告（豪赌一把，成本高但覆盖广）',
                resultText: '你咬牙签下了黄金时段的合同。订单像雪片一样飞进来，娃哈哈这个名字传遍半座城。宗师傅没有庆祝太久，只说：明天把货送上。',
                coinBonus: 260,
                flag: 'adGambleWon',
                mentor: { trust: 6, agreement: 8, independence: -2 },
                marketEvent: { impact: 0.18, delay: 2, headline: '娃哈哈黄金时段广告带动订单' }
            },
            {
                label: '上便宜时段（稳妥，但效果有限）',
                resultText: '你选了便宜时段。订单涨了一点，却没能把名字打出去。宗师傅看了你一会儿，说：稳不是错，但机会也会过期。',
                coinBonus: 90,
                flag: null,
                mentor: { trust: -1, agreement: -4, independence: 5 },
                marketEvent: { impact: 0.06, delay: 2, headline: '娃哈哈选择低成本广告投放' }
            }
        ],
        reflection: '你开始看见他的锋利：判断一旦形成，他会往前冲，也会要求身边的人一起冲。',
        prologuePartAfter: 4,
        auto: () => storyStat('coinShopEntries') >= 1
    },
    {
        unlocks: null,
        title: '第四部分 · 兼并国企（1991）',
        lines: [
            { speaker: '旁白', text: '娃哈哈营养食品厂已经有 140 个人，订单却还是接不过来。这时候，一座老工厂被中间人带到了你面前：设备旧、人多、账重，但产能是真的。' },
            { speaker: '王师傅', text: '厂里的人都在传，说你们要来是要裁人的。这话是真是假？' },
            { speaker: '你', text: '不裁人，工资照发，亏了算我自己的——但这个厂，我要真正接过来，不是挂个名。' },
            { speaker: '旁白', text: '你听见这句话时，既佩服，也有点害怕。因为它听起来不像商量，更像命令。' }
        ],
        unlockToast: '📖 主线推进：罐头厂的事定下来了',
        questLabel: '广告后再跑一单：用真实订单验证扩张',
        target: { x: 9.0, z: 0.0 },
        lockedHint: '先完成广告之后的新订单；有偿兼并还需要 400 金币。',
        auto: () => storyStat('deliveryCount') > storyMilestone('deliveryCount'),
        choices: [
            {
                label: '有偿兼并（掏 400 金币买断，担子重但产能真正归你）',
                resultText: '你把身家掏了大半，签下兼并合同。王师傅带头，厂里的老工人没有一个走。宗师傅说话算话，但你也第一次感觉到：他认定的事，很难再被劝回头。',
                coinCost: 400,
                coinBonus: 0,
                flag: 'factoryBonus',
                mentor: { trust: 7, agreement: 7, independence: -1 },
                marketEvent: { impact: 0.20, delay: 2, headline: '娃哈哈有偿兼并扩大产能' }
            },
            {
                label: '联营/租赁（风险小，但产能终究不是自己的）',
                resultText: '你选了更稳妥的联营方式。厂子转起来了，但设备和产能说到底还是人家的。宗师傅没有责怪你，只低声说：借来的地方，走路总要轻一点。',
                coinBonus: 60,
                flag: null,
                mentor: { trust: 1, agreement: -3, independence: 5 },
                marketEvent: { impact: 0.04, delay: 2, headline: '娃哈哈与罐头厂达成联营' }
            }
        ],
        reflection: '同一种实干，在小摊上叫坚持；到了大厂里，有时就像固执。'
    },
    {
        unlocks: null,
        title: '第五部分 · 非常可乐（1998）',
        lines: [
            { speaker: '旁白', text: '七年过去，可口可乐和百事可乐把大城市的货架占得满满当当，国产汽水一个接一个被挤出局——人称"水淹七军"。' },
            { speaker: '金总', text: '大城市这条路，你们真挤不进去——渠道、品牌、资本，哪一样比得过人家？' },
            { speaker: '你', text: '大城市挤不进去，那就换一条路——这些年跑遍乡镇攒下的联销体，才是我真正的底牌。' },
            { speaker: '旁白', text: '这条路很聪明，也很硬。聪明在它绕开巨头，硬在它要求老经销商先相信你。' }
        ],
        unlockToast: '📖 主线推进：非常可乐的路子定下来了',
        questLabel: '兼并后再跑一单：证明渠道能下沉到乡镇',
        target: { x: 9.0, z: 0.0 },
        lockedHint: '先把新渠道跑通一笔订单，再决定可乐往哪里卖。',
        auto: () => storyStat('deliveryCount') > storyMilestone('deliveryCount'),
        choices: [
            {
                label: '避开大城市，靠乡镇联销体铺货（稳扎稳打，田老板这样的老伙计最先接货）',
                resultText: '田老板第一个进了货，乡镇的小卖部一家接一家跟上。宗师傅看着订单沉默了很久，说：大城市有大城市的路，我们有我们的腿。',
                coinBonus: 380,
                flag: 'ruralNetwork',
                mentor: { trust: 8, agreement: 7, independence: 0 },
                marketEvent: { impact: 0.17, delay: 2, headline: '非常可乐在乡镇渠道打开销路' }
            },
            {
                label: '跟可口可乐、百事可乐正面打广告战（硬碰硬，资本拼不过人家）',
                resultText: '广告砸出去不少钱，声势没造起来几分，反倒被城里的经销商挤得没了脾气。宗师傅说：不是每一仗都该正面打。',
                coinCost: 200,
                coinBonus: 0,
                flag: null,
                mentor: { trust: -2, agreement: -5, independence: 4 },
                marketEvent: { impact: -0.14, delay: 2, headline: '非常可乐广告投入未能打开市场' }
            }
        ],
        reflection: '你理解他为什么相信渠道：那不是地图上的线，是一趟一趟跑出来的人情和账期。'
    },
    {
        unlocks: 'investment',
        title: '第六部分 · 名字还能值钱？',
        lines: [
            { speaker: '旁白', text: '你走进股市小屋，满屏 K 线跳动。宗师傅却没有先看涨跌，只点开一家公司的资料。' },
            { speaker: '宗师傅', text: '它卖什么？现金什么时候回来？欠了多少？' },
            { speaker: '你', text: '你不是说你不看这个吗？' },
            { speaker: '旁白', text: '旧报纸翻到一页，标题写着：娃哈哈创始人——宗庆后。照片上的人，和旁边喝茶的老人一模一样。' },
            { speaker: '你', text: '……宗师傅？你叫宗庆后？' },
            { speaker: '宗庆后', text: '怎么，名字还能值钱？' }
        ],
        unlockToast: '📖 主线推进：开始看更大的账',
        questLabel: '进入股市小屋：从公司生意看懂价格背后的账',
        target: { x: -12.0, z: 8.5 },
        reflection: '身份揭晓以后，你发现自己认识的不是百科里的名字，而是那个陪你种地、数库存、盯现金的人。',
        lockedHint: '先走到股市小屋，翻开那份旧资料。'
    },
    {
        unlocks: null,
        title: '第七部分 · 第一个拦路的人',
        lines: [
            { speaker: '旁白', text: '联销体推行到最后一站，邵老板把货单推回桌上。他不是外人。当年你蹬三轮送货，第一批愿意掏钱进货的人里，就有他。' },
            { speaker: '邵老板', text: '那时候你车都停不稳，我先拿了货。现在你让我先打款、后发货，还说这是规矩？' },
            { speaker: '宗庆后', text: '这些年，是你们垫着钱，把这张网撑起来的。我记得。可公司要往前走，账期不能一直压在厂里。' },
            { speaker: '旁白', text: '这一次没人像坏人。邵老板有理，宗庆后也有理。你第一次清楚地看见：成功后的规矩，会伤到当年帮你撑过来的人。' }
        ],
        unlockToast: '📖 主线推进：联销体的规矩定下来了',
        questLabel: '现金流面板保持安全后，再处理邵老板的质疑',
        target: { x: 9.0, z: 0.0 },
        lockedHint: '先让未来 7 天现金流不低于 0，再决定联销体规矩怎么落地。',
        auto: () => typeof projectedCashFlow === 'function' && projectedCashFlow(7).min >= 0,
        choices: [
            {
                label: '坚持先款后货：规矩统一，哪怕先伤感情',
                resultText: '你把新规矩推了下去。邵老板沉默很久，最后还是签了字。宗庆后说你做得对，可你知道，有些旧交情从这天起变薄了。',
                ending: 'good',
                flag: 'strictDealerTerms',
                mentor: { trust: 5, agreement: 7, independence: -2 }
            },
            {
                label: '给老经销商过渡期：现金慢一点，关系留一线',
                resultText: '你给邵老板这样的老伙计留了三个月过渡期。宗庆后皱了皱眉，但没有拦你。你第一次不是照着他做，而是带着理解，做了自己的判断。',
                ending: 'good',
                flag: 'dealerGracePeriod',
                mentor: { trust: 3, agreement: -2, independence: 8 }
            }
        ]
    }
];

const ENDINGS = {
    good: {
        title: '结局 · 这块牌子还是你的',
        lines: [
            '联销体的新规矩落地后，订单没有立刻变漂亮。有人抱怨，有人观望，也有人像邵老板那样，骂完以后照旧把货接走。',
            '宗庆后站在仓库门口说：我说什么你都听，那这一路就白走了。你忽然明白，他留给你的不是答案，而是一种看账、看人、看路的方式。',
            '最后你记住的不是一句“伟大企业家”，而是一个具体的人：能吃苦，会算账，重感情，也固执。你认识了宗庆后。'
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

let mainStoryState = {
    stage: 0,
    flags: {},
    endingId: null,
    milestones: {},
    mentor: { trust: 50, agreement: 50, independence: 50 }
};
let pendingMarketEvents = [];

function captureMainStoryMarketEvents() {
    return pendingMarketEvents.slice();
}

function applyMainStoryMarketEvents(raw) {
    pendingMarketEvents = Array.isArray(raw) ? raw.filter(event => event && typeof event.id === 'string').slice(-16) : [];
}
let mainStoryPendingProceed = null;
/* 台词现在一句一句走对话框，不再一次性把整章台词全甩在卡片里 */
let mainStoryLineIndex = 0;

const mainStoryPanel = document.getElementById('mainStoryPanel');
const mainStoryTitle = document.getElementById('mainStoryTitle');
const mainStoryBody = document.getElementById('mainStoryBody');
const mainStoryChoices = document.getElementById('mainStoryChoices');
const mainStoryNextBtn = document.getElementById('mainStoryNextBtn');
const closeMainStoryBtn = document.getElementById('closeMainStoryBtn');

/* 目标没达成时点“继续”/按回车不会真的翻页，之前只弹一条被卡片本身挡住看
   不见的提示，玩家会以为卡片卡死了。改成在卡片上直接抖一下 + 高亮锁定
   提示行，反馈是"看得见"的。 */
function flashMainStoryLocked() {
    const card = mainStoryPanel && mainStoryPanel.querySelector('.mainStoryCard');
    if (!card) return;
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 420);
}

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

function clampMentorValue(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 50;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function applyMentorDelta(delta) {
    if (!delta || typeof delta !== 'object') return;
    const current = mainStoryState.mentor || { trust: 50, agreement: 50, independence: 50 };
    mainStoryState.mentor = {
        trust: clampMentorValue(current.trust + (Number(delta.trust) || 0)),
        agreement: clampMentorValue(current.agreement + (Number(delta.agreement) || 0)),
        independence: clampMentorValue(current.independence + (Number(delta.independence) || 0))
    };
}

function storyStat(key) {
    if (typeof getAchievementStats !== 'function') return 0;
    return Math.max(0, Number(getAchievementStats()[key]) || 0);
}

function storyMilestone(key) {
    const saved = mainStoryState.milestones || {};
    return Math.max(0, Number(saved[key]) || 0);
}

function mainStoryStageReady(stage) {
    if (!stageCoinsMet(stage)) return false;
    if (typeof stage.auto !== 'function') return true;
    try { return !!stage.auto(); } catch (err) { return false; }
}

function mainStoryLinesDone(stage) {
    const lines = stage.lines || [];
    return mainStoryLineIndex >= lines.length - 1;
}

function renderMainStoryCard(stage) {
    mainStoryTitle.textContent = stage.title;
    const met = mainStoryStageReady(stage);
    const lines = stage.lines || [];
    const linesDone = mainStoryLinesDone(stage);
    const line = lines[Math.min(mainStoryLineIndex, Math.max(0, lines.length - 1))];

    let html = line ? '<p><span class="mainStorySpeaker">' + line.speaker + '</span>' + line.text + '</p>' : '';
    if (linesDone) {
        if (stage.coinRequirement) {
            const coinsMet = stageCoinsMet(stage);
            html += '<p class="mainStoryCoinNote' + (coinsMet ? ' met' : '') + '">需要攒够 ' + stage.coinRequirement +
                ' 金币 · 当前 ' + currentCoins() + (coinsMet ? ' · 已达成' : '') + '</p>';
        }
        if (!met && stage.lockedHint) {
            html += '<p class="mainStoryCoinNote">' + stage.lockedHint + '</p>';
        }
    }
    mainStoryBody.innerHTML = html;
    mainStoryBody.classList.toggle('dialogStep', !linesDone);

    if (linesDone && Array.isArray(stage.choices) && mainStoryChoices) {
        mainStoryChoices.hidden = false;
        mainStoryChoices.innerHTML = stage.choices.map((choice, i) =>
            '<button type="button" class="mainStoryChoiceBtn" data-choice="' + i + '"' + (met && (!choice.coinCost || currentCoins() >= choice.coinCost) ? '' : ' disabled') + '>' +
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
            if (!linesDone) {
                mainStoryNextBtn.disabled = false;
                mainStoryNextBtn.textContent = '继续';
            } else {
                mainStoryNextBtn.disabled = !met;
                mainStoryNextBtn.textContent = met ? '继续' : '尚未完成目标';
            }
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
    mainStoryLineIndex = 0;
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
    if (typeof window.recordMainStoryCheckpoint === 'function') {
        window.recordMainStoryCheckpoint(idx, stage.title);
    }
    mainStoryState.milestones = {
        deliveryCount: storyStat('deliveryCount'),
        investmentEntries: storyStat('investmentEntries'),
        newspaperReads: storyStat('newspaperReads')
    };
    mainStoryState.stage = idx + 1;
    if (typeof window.refreshProgressiveHud === 'function') window.refreshProgressiveHud();
    if (typeof window.publishLiveNews === 'function') {
        window.publishLiveNews(stage.title || '主线推进', resultText || stage.unlockToast || '小屋的故事又往前走了一步。', '主线快讯');
    }
    if (typeof showHintOverride === 'function') showHintOverride(resultText || stage.unlockToast);
    if (typeof SND !== 'undefined') SND.play('chim');
    if (stage.reflection && typeof window.showThemeReflection === 'function') {
        window.showThemeReflection(stage.reflection);
    }
    if (typeof stage.prologuePartAfter === 'number' && typeof window.openProloguePart === 'function') {
        setTimeout(() => window.openProloguePart(stage.prologuePartAfter), 2200);
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
    if (!mainStoryLinesDone(stage)) {
        mainStoryLineIndex++;
        renderMainStoryCard(stage);
        if (typeof SND !== 'undefined') SND.play('ui');
        return;
    }
    if (Array.isArray(stage.choices)) return;
    if (!mainStoryStageReady(stage)) {
        flashMainStoryLocked();
        if (typeof showHintOverride === 'function') {
            showHintOverride(stage.lockedHint || '先完成当前主线目标');
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
    if (!mainStoryStageReady(stage)) {
        flashMainStoryLocked();
        if (typeof showHintOverride === 'function') {
            showHintOverride(stage.lockedHint || '先完成当前主线目标');
        }
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    const choice = stage.choices[choiceIndex];
    if (!choice) return;
    if (choice.coinCost && currentCoins() < choice.coinCost) return;
    if (choice.coinCost && typeof spendCabinCoins === 'function') {
        if (!spendCabinCoins(choice.coinCost, '兼并/投入')) return;
    }
    if (choice.coinBonus && typeof window.addCabinCoins === 'function') {
        window.addCabinCoins(choice.coinBonus, false);
    }
    if (choice.flag) mainStoryState.flags[choice.flag] = true;
    if (choice.mentor) applyMentorDelta(choice.mentor);
    if (choice.marketEvent) {
        pendingMarketEvents.push(Object.assign({ id: 'story-' + idx + '-' + choiceIndex, targetStock: 'WAHA' }, choice.marketEvent));
    }
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
    if (window.APP_GAME_MODAL_OPEN || window.APP_SHELL_BLOCK_GAME) return;
    if (mainStoryAutoCooldown > 0) return;
    if (!window.APP_ONBOARDING_DISMISSED) return;
    if (!mainStoryStageReady(stage)) return;
    /* silent：不弹开局宗师傅那段对话卡片，条件达成直接静默推进主线 */
    if (stage.silent) {
        advanceMainStoryStage(stage, stage.unlockToast);
        return;
    }
    openMainStoryStage(mainStoryState.stage, null);
}

function captureMainStoryState() {
    return {
        stage: mainStoryState.stage,
        flags: Object.assign({}, mainStoryState.flags),
        endingId: mainStoryState.endingId || null,
        milestones: Object.assign({}, mainStoryState.milestones),
        mentor: Object.assign({}, mainStoryState.mentor || {})
    };
}

function applyMainStoryState(raw) {
    const stage = Math.max(0, Math.min(MAIN_STORY_STAGES.length, Math.trunc(Number(raw && raw.stage) || 0)));
    const flags = (raw && raw.flags && typeof raw.flags === 'object') ? Object.assign({}, raw.flags) : {};
    const endingId = (raw && (raw.endingId === 'good' || raw.endingId === 'bad')) ? raw.endingId : null;
    const rawMilestones = raw && raw.milestones && typeof raw.milestones === 'object' ? raw.milestones : {};
    const milestones = {};
    ['deliveryCount', 'investmentEntries', 'newspaperReads'].forEach(key => {
        milestones[key] = Number.isFinite(Number(rawMilestones[key]))
            ? Math.max(0, Math.trunc(Number(rawMilestones[key]))) : storyStat(key);
    });
    const rawMentor = raw && raw.mentor && typeof raw.mentor === 'object' ? raw.mentor : {};
    const mentor = {
        trust: clampMentorValue(rawMentor.trust),
        agreement: clampMentorValue(rawMentor.agreement),
        independence: clampMentorValue(rawMentor.independence)
    };
    mainStoryState = { stage, flags, endingId, milestones, mentor };
    if (typeof window.refreshProgressiveHud === 'function') window.refreshProgressiveHud();
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
    if (mainStoryState.stage === 0 && typeof isAlchemyIntroComplete === 'function' && !isAlchemyIntroComplete()) {
        label = typeof window.alchemyIntroHint === 'function'
            ? window.alchemyIntroHint()
            : '打开发光的炼金书，取瓶架材料，再启动坩埚';
    } else if (mainStoryState.stage === 1) {
        const delivered = storyStat('deliveryCount') >= 1;
        if (!delivered) label = '完成第一笔送货（订单板接单），再攒够 110 金币';
        else if (currentCoins() < 110) label = '第一笔送货完成，继续攒到 110 金币';
    } else if (mainStoryState.stage === 4 || mainStoryState.stage === 5) {
        label += '（' + (storyStat('deliveryCount') > storyMilestone('deliveryCount') ? '已完成' : '还需 1 单') + '）';
    }
    if (stage.coinRequirement && !stageCoinsMet(stage)) {
        label += '（当前 ' + currentCoins() + ' 金币）';
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
if (closeMainStoryBtn) closeMainStoryBtn.addEventListener('click', () => closeMainStoryStage(false));
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
