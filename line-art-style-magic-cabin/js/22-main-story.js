'use strict';

/* ================================================================
   主线剧情
   核心三个词：魔法、赚钱、陪伴。不是"魔法+宗庆后传记+模拟经营"，
   而是"我和一个来自另一个世界的老头一起研究怎么赚钱"。
   十个故事节点，每个都是玩家必须面对的具体问题，不是"解锁XX系统"的
   任务清单。种地/送货/采茶这些操作是节点内部要做的事，不跟章节平级，
   地图上只看得见这十个问题本身。经营系统是认识宗庆后的方法，
   不是人物讲系统的工具。
   ================================================================ */

const MAIN_STORY_STAGES = [
    {
        /* 问题：这是哪儿？这老头是谁？
           机制：开局炼金谜题（39-alchemy-intro.js 自己的对话框里演）
           碎片：他跟你一样，也说不清自己怎么到这儿的
           钩子：想送他回去，需要"归魂炼金术"——材料要钱，先挣第一块钱 */
        unlocks: null,
        silent: true,
        title: '炼金失败之后',
        lines: [],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '打开发光的炼金书，取瓶架材料，再启动坩埚',
        target: { x: -3.58, z: -3.05 },
        auto: () => typeof isAlchemyIntroStoryStarted === 'function' && isAlchemyIntroStoryStarted()
    },
    {
        /* 问题：钱到底是怎么变多的？
           机制：买种子→翻地→播种→浇水→收获→卖出，第一次完整过一遍
           碎片：他对几块钱都格外认真
           钩子：这么点钱也算钱？——那下一趟送货再看看 */
        unlocks: null,
        title: '第一笔生意',
        lines: [
            { speaker: '旁白', text: '种子买好、地翻好、水浇透——第一颗萝卜从土里挖出来的时候，你满心以为能改变点什么。' },
            { speaker: '你', text: '（举着萝卜）你看！我自己种出来的！' },
            { speaker: '师傅', text: '别举了，先拿去卖。地里的东西，长在土里不叫钱。' },
            { speaker: '旁白', text: '卖掉之后，钱包从 100 变成 120。' },
            { speaker: '你', text: '忙活半天，就赚了 20？' },
            { speaker: '师傅', text: '昨天这 20 块，是你的吗？' },
            { speaker: '你', text: '……不是。' },
            { speaker: '师傅', text: '那就别嫌少。从没有到有，永远是最难的一步。' },
            { speaker: '旁白', text: '你一时语塞——这个老头，对几块钱都格外认真。' }
        ],
        unlockToast: '📖 主线推进：赚到第一笔钱了',
        questLabel: '去杂货铺买种子，翻地播种，收获并卖出第一批作物',
        target: { x: 10, z: -10 },
        lockedHint: '先去杂货铺买种子，种出第一批作物并卖掉。',
        auto: () => storyStat('totalHarvests') >= 1 
        // && currentCoins() >= 120
    },
    {
        /* 问题：这几块钱，为什么让他这么在意？
           机制：接单送货，第一次走完"现金→货物→销售→现金"的整圈
           碎片：他把账本看得很重，却没解释原因
           钩子：他这么在意钱，到底是为什么？ */
        unlocks: null,
        title: '钱是怎么回来的',
        lines: [
            { speaker: '旁白', text: '你开始接单送货——种、卖、送、收款，钱这才第一次在你手里转成一个完整的圈。' },
            { speaker: '你', text: '送一趟才赚七块，这也算钱？' },
            { speaker: '师傅', text: '七块钱也是钱。' },
            { speaker: '你', text: '你怎么这么在意这几块钱？' },
            { speaker: '旁白', text: '师傅没有解释，只是把账本往你这边推了推。' },
            { speaker: '师傅', text: '你自己算。这一页，每一笔都是走出去的一趟路。' },
            { speaker: '旁白', text: '你低头看，密密麻麻的数字，突然不像数字了，倒像一串脚印。' },
            { speaker: '你', text: '……行吧。那我再跑几趟。' },
            { speaker: '师傅', text: '（难得笑了一下）这就对了。' }
        ],
        unlockToast: '📖 主线推进：现金开始转起来了',
        questLabel: '接单送货，攒够 110 金币',
        target: { x: 9.0, z: 0.0 },
        coinRequirement: 110,
        lockedHint: '先完成一笔送货，并攒够 110 金币。',
        auto: () => storyStat('deliveryCount') >= 1 
        // && currentCoins() >= 110
    },
    {
        /* 问题：这个老头以前到底是干什么的？
           机制：多送几趟货，熟悉这门生意
           碎片：第一次记忆闪回——三轮车、清晨、一个年轻男人的背影
           钩子：一句"你们有没有茶"，把玩家送进了茶园 */
        unlocks: 'tea',
        title: '这个老头以前干什么的？',
        lines: [
            { speaker: '旁白', text: '送货趟数多了，你发现师傅对路线、客户、账期比你还熟——谁家今天要货、谁家还没结账，他一清二楚。' },
            { speaker: '你', text: '等等，你以前是不是干过这个？' },
            { speaker: '师傅', text: '干过。' },
            { speaker: '你', text: '送货？' },
            { speaker: '师傅', text: '嗯。' },
            { speaker: '你', text: '多久？' },
            { speaker: '师傅', text: '……几年。' },
            { speaker: '旁白', text: '恍惚间，你好像看见一辆三轮车，清晨的雾里，一个年轻男人的背影。' },
            { speaker: '你', text: '那个人……是你？' },
            { speaker: '旁白', text: '他已经转身往前走了，像是没听见。' },
            { speaker: '你', text: '（追上去）喂，我问你话呢。' },
            { speaker: '师傅', text: '（脚步没停）走吧，客户还等着。' },
            { speaker: '旁白', text: '你没再追问——有些事，他愿意说的时候自然会说。' },
            { speaker: '旁白', text: '路上一个老客户随口问了一句："你们有没有茶？"——这句话，把你送进了茶园。' }
        ],
        unlockToast: '📖 主线推进：茶园解锁了',
        questLabel: '再多送几趟货，熟悉这门生意',
        target: { x: 9.0, z: 0.0 },
        lockedHint: '再多送几趟货。',
        auto: () => storyStat('deliveryCount') >= 3
    },
    {
        /* 问题：同样的叶子，为什么加工一下就能贵三倍？
           机制：采茶→晒茶→炒茶→装袋，第一次理解"原料→产品→增值"
           碎片：他年轻时候什么都卖过——冰棍、文具
           钩子：他绝对不是普通人 */
        unlocks: null,
        title: '一片叶子能值多少钱',
        lines: [
            { speaker: '旁白', text: '茶园开出来后，你先试着直接卖鲜叶——一斤才 10 块。' },
            { speaker: '旁白', text: '照着流程采茶、晒茶、炒茶、装袋，同样的叶子，变成 30 块。' },
            { speaker: '你', text: '什么都没多，就是装进盒子里，怎么贵了这么多？' },
            { speaker: '师傅', text: '什么叫没多？你采了、炒了、做了、装了——这些不是东西？' },
            { speaker: '你', text: '你以前也卖过东西？' },
            { speaker: '师傅', text: '卖过。冰棍、文具……什么都卖过。' },
            { speaker: '你', text: '那你最擅长卖什么？' },
            { speaker: '师傅', text: '不是擅长卖什么。是不管卖什么，都得先把东西本身做扎实——这个道理，走到哪儿都一样。' },
            { speaker: '旁白', text: '你越来越确信：这个老头，绝对不是普通人。' }
        ],
        unlockToast: '📖 主线推进：看懂了"加工"这件事',
        questLabel: '完成茶叶生产链：采茶、晒茶、炒茶、装袋',
        target: { x: -11.5, z: -9.0 },
        lockedHint: '先把一批茶叶做成成品，弄明白产品怎么从田里走到市场。',
        auto: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 1
    },
    {
        /* 问题：东西做出来了，然后呢？
           机制：仓库堆货卖不掉，第一次面对定价/客流/库存/渠道
           碎片：他嘴里第一次漏出"娃哈哈"这个词，随即改口
           钩子：娃哈哈是什么？ */
        unlocks: 'coin',
        title: '东西做出来，然后呢？',
        lines: [
            { speaker: '旁白', text: '尝到甜头，你开始疯狂制茶。没几天，仓库堆到：茶 ×47。' },
            { speaker: '你', text: '这么多茶，不是能卖很多钱吗？' },
            { speaker: '师傅', text: '谁买？' },
            { speaker: '旁白', text: '两个字，把你问住了。' },
            { speaker: '旁白', text: '你这才开始学定价、客流、库存、渠道这些没人教过你的东西。' },
            { speaker: '师傅', text: '东西堆着不叫资产，叫欠账——欠的是"当初该想好卖给谁"这笔账。' },
            { speaker: '你', text: '那现在怎么办？' },
            { speaker: '师傅', text: '降价甩一批，剩下的挑几个熟客一家家送。慢，但比堆在这儿强。' },
            { speaker: '师傅', text: '（低声）当年娃哈哈刚开始的时候……' },
            { speaker: '你', text: '等等——娃哈哈是什么？' },
            { speaker: '师傅', text: '……以前的事。' }
        ],
        unlockToast: '📖 主线推进："娃哈哈"这个词，你听见了',
        questLabel: '把囤积的茶叶想办法卖出去',
        target: { x: -11.5, z: -9.0 },
        lockedHint: '仓库堆着货卖不出去可不行，想想办法把茶叶变成钱。',
        auto: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 3
    },
    {
        /* 问题：这个老头，到底是谁？
           机制：走进股市小屋，第一次学着"先看生意，再看价格"
           碎片：身份正式揭晓——他就是宗庆后
           钩子：认识了名字之后，才刚开始真正认识这个人 */
        unlocks: 'investment',
        autoEntry: true,
        title: '原来你叫宗庆后',
        lines: [
            { speaker: '旁白', text: '你在股市小屋里点开了"娃哈哈"这家公司的资料——创始人持股、上市方案，写得清清楚楚。' },
            { speaker: '你', text: '（这几行条目，怎么看着这么眼熟……）' },
            { speaker: '旁白', text: '你想起茶屋角落那份旧报纸，标题写着：娃哈哈创始人——宗庆后。照片上的人，和旁边喝茶的老人一模一样。' },
            { speaker: '你', text: '……师傅？你就是宗庆后？' },
            { speaker: '宗庆后', text: '怎么，名字还能值钱？' },
            { speaker: '你', text: '你怎么早不说？' },
            { speaker: '宗庆后', text: '说了又怎样？地还是要种，货还是要送。名字改变不了账本上的数字。' },
            { speaker: '旁白', text: '你看着他，忽然觉得这些天一起种地、一起送货的日子，比任何一个名字都真实。' }
        ],
        unlockToast: '📖 主线推进：你知道他是谁了',
        questLabel: '去股市小屋，点开"公司上市"（WAHA）看看它的底细',
        target: { x: -12.0, z: 8.5 },
        lockedHint: '先去股市小屋，点开"公司上市"那一项看看。',
        auto: () => {
            const inv = typeof readSavedInvestmentState === 'function' ? readSavedInvestmentState() : null;
            return !!(inv && inv.wahaCompanyViewed);
        }
    },
    {
        /* 问题：账面上赚了，为什么手里还是没钱？
           机制：订单板出现一笔现在周转不开的大单，第一次理解"利润≠现金"
           碎片：联销体记忆——邵老板当年怎么帮他周转过这道坎
           钩子：这次是师傅把当年的法子教给玩家，不是替玩家拿主意 */
        unlocks: 'prepay',
        title: '赚了钱，为什么还是没钱？',
        lines: [
            { speaker: '旁白', text: '订单板上摆着一笔大单，利润相当可观——可翻遍钱包，连备货的本钱都凑不齐。' },
            { speaker: '你', text: '这单明明能赚，怎么反倒卡住了？' },
            { speaker: '旁白', text: '你这才明白：账上有赚头，不等于手里有钱——这中间差着一段周转的时间。' },
            { speaker: '宗庆后', text: '（沉默了一下）这个坎，我以前也踩过。' },
            { speaker: '旁白', text: '联销体刚起步那会儿，邵老板是第一批愿意掏钱进货的人。有一次订单太大，宗庆后自己也周转不开。' },
            { speaker: '邵老板', text: '你先把订金打给我一半，我先按单子备货，剩下的等你东西出手了再补给你。' },
            { speaker: '宗庆后', text: '我当时不乐意——好像欠了他一份人情。他说，这不是人情，这是生意人该有的法子。' },
            { speaker: '你', text: '那后来呢？' },
            { speaker: '宗庆后', text: '后来才想明白：让客户先付一部分订金，我能先周转开；他也算买了个"东西一定送到"的放心——两边都让一点利，账才转得动。' },
            { speaker: '旁白', text: '你看着眼前这张大单，忽然懂了——原来"预付订金"不是走捷径，是拿一点利润，换出周转的空间。' }
        ],
        unlockToast: '📖 主线推进：你学会了"预付订金"这招',
        questLabel: '遇到一笔现在周转不开的大单，听师傅讲完邵老板的故事',
        target: { x: 9.0, z: 0.0 },
        lockedHint: '先接到一笔现在周转不开的大单，答案自然会出现。',
        auto: () => {
            if (typeof deliveryOrders === 'undefined' || !Array.isArray(deliveryOrders)) return false;
            return deliveryOrders.some(order => order.bulk && !order.accepted && currentCoins() < order.reward);
        },
        choices: [
            {
                label: '学着用：这法子不丢人，先渡过这一关',
                resultText: '',
                flag: 'embracedPrepay',
                mentor: { trust: 5, agreement: 4, independence: 0 }
            },
            {
                label: '记下这招，但能不用就不用',
                resultText: '',
                flag: 'waryOfPrepay',
                mentor: { trust: 2, agreement: -2, independence: 8 }
            }
        ]
    },
    {
        /* 问题：这次，我该听谁的？
           机制：股市小屋出现一家"看不懂"的新公司，第一次没有标准答案
           碎片：他第一次承认自己判断不了——他也有边界
           钩子：不管结果如何，这是玩家第一次真正靠自己拿主意 */
        unlocks: null,
        title: '这一次，我不听你的',
        lines: [
            { speaker: '旁白', text: '魔法道具铺这几天像换了个公司——广告打得凶，账上却是净亏损。你翻着基本面，翻了老半天。' },
            { speaker: '旁白', text: '你把自己算的估值填了上去，比现价还高一截。' },
            { speaker: '你', text: '我觉得这家还能再涨。' },
            { speaker: '宗庆后', text: '我不投。' },
            { speaker: '你', text: '为什么？你不是看两眼就能算明白吗？' },
            { speaker: '宗庆后', text: '算得明白的，是我干过的生意——种地、送货、开店，这些账我闭着眼都能算。这种烧钱换增长的路数，我没干过，不该装懂。' },
            { speaker: '你', text: '那我这估值……' },
            { speaker: '宗庆后', text: '你自己填的，你自己担。这次我不替你拿主意。' },
            { speaker: '旁白', text: '这是他第一次，没能——或者说，没打算——替你做这个决定。' }
        ],
        unlockToast: '📖 主线推进：这次你自己做了判断',
        questLabel: '在股市小屋赚够 1000 金币',
        target: { x: -12.0, z: 8.5 },
        lockedHint: '先在股市小屋赚够 1000 金币的账面盈利。',
        auto: () => typeof readSavedInvestmentPnl === 'function' && readSavedInvestmentPnl() >= 1000,
        choices: [
            {
                label: '跟投（相信自己这些天攒下的判断）',
                resultText: '',
                flag: 'trustedOwnJudgment',
                mentor: { trust: 2, agreement: -6, independence: 14 },
                marketEvent: {
                    impact: -0.04, delay: 2, headline: '非共识判断短期承压：市场还没看懂这家新公司',
                    phase2: { impact: 0.22, delay: 6, headline: '几个月后：当初没人看懂的公司，业绩验证了判断' }
                }
            },
            {
                label: '听他的，不投（稳妥，但可能错过）',
                resultText: '',
                flag: null,
                mentor: { trust: 4, agreement: 8, independence: -6 },
                marketEvent: { impact: -0.05, delay: 3, headline: '谨慎策略错过一波新经济行情' }
            }
        ]
    },
    {
        /* 问题：材料终于凑齐了，真要送他走吗？
           机制：回到开局那口坩埚，完成"归魂炼金术"
           碎片：最后一次并肩——两人各自不擅长对方的事，但已经处得很好
           钩子：结局由这一路攒下的关系决定 */
        unlocks: null,
        title: '最后一次炼金',
        lines: [
            { speaker: '旁白', text: '材料终于凑齐了——月银、星尘、灵魂石，都摆在了当年那口坩埚旁边。屋子里的一切，和第一天几乎一模一样。' },
            { speaker: '你', text: '（习惯性地）这次怎么做？' },
            { speaker: '宗庆后', text: '你不是会了吗？' },
            { speaker: '你', text: '我问的是炼金。' },
            { speaker: '宗庆后', text: '我又不会魔法。' },
            { speaker: '旁白', text: '你笑了一下，转身面对坩埚。' },
            { speaker: '你', text: '这些天，谢谢你。' },
            { speaker: '宗庆后', text: '谢什么。地是你种的，账是你算的，我就在旁边看着。' },
            { speaker: '你', text: '看着，也是陪着。' },
            { speaker: '旁白', text: '他没接话，只是把手背在身后，等着你动手。真正送走他之前，还有最后一件事要想清楚。' }
        ],
        unlockToast: '📖 主线推进：材料集齐，可以做最后一次炼金了',
        questLabel: '材料备齐后，回到炼金锅完成最后一次炼金',
        target: { x: -2.35, z: -0.45 },
        coinRequirement: 3000,
        lockedHint: '钱攒够 3000 金币，材料才备得齐。',
        auto: () => currentCoins() >= 3000,
        choices: [
            {
                label: '把这段情分放在心上，体面地送他走',
                resultText: '',
                ending: 'good',
                flag: 'gracefulFarewell',
                mentor: { trust: 5, agreement: 5, independence: 5 }
            },
            {
                label: '事情办完就是办完，不必多想',
                resultText: '',
                ending: 'bad',
                flag: 'coldFarewell',
                mentor: { trust: -3, agreement: -2, independence: 8 }
            }
        ]
    }
];

const ENDINGS = {
    good: {
        title: '结局 · 这份情分记下了',
        lines: [
            '坩埚再次亮起来的时候，你没有像第一次那样慌。你把这些日子攒下的账本、成就墙、还有心里那点舍不得，一并放进了那圈光里。',
            '宗庆后临走前只说了一句：这一路，你不是照我说的做，是自己算明白的。我没白待这一趟。',
            '光散开以后，屋子恢复了安静。你忽然明白，他留给你的不是一套怎么赚钱的方法，而是一种看账、看人、看路的方式——你认识了宗庆后，也认识了现在的自己。'
        ],
        achievement: 'ending_good'
    },
    bad: {
        title: '结局 · 账算完了，人走了',
        lines: [
            '材料倒进坩埚，光一闪，宗庆后就那么干脆地不见了——像一笔已经结清的账，说走就走，没什么好留恋的。',
            '你低头看着账本，数字都对，一分不差。可屋子空出来一块，怎么擦都擦不干净。',
            '你没有输给任何人，只是没来得及问一句：这一路，除了赚钱，还剩下点别的什么？路还长，这个问题，以后大概还会想起来。'
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

function dialogueLineHtml(line) {
    return '<p>' + (typeof speakerPillHtml === 'function' ? speakerPillHtml(line.speaker) : '<span class="mainStorySpeaker">' + line.speaker + '</span>') + line.text + '</p>';
}

function renderMainStoryCard(stage) {
    mainStoryTitle.textContent = stage.title;
    const met = mainStoryStageReady(stage);
    const lines = stage.lines || [];
    const linesDone = mainStoryLinesDone(stage);
    /* 之前只显示当前这一句，翻页就把上一句擦掉，看着信息量很少。
       现在保留这一幕已经讲过的台词（从头到当前这句），新的一句
       追加在最下面，翻旧账不用回忆——跟真的聊天记录一样。 */
    const shownLines = lines.slice(0, Math.min(mainStoryLineIndex, Math.max(0, lines.length - 1)) + 1);

    let html = shownLines.map(dialogueLineHtml).join('');
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
    if (linesDone) mainStoryStageSeen[mainStoryState.stage] = true;
    if (mainStoryPanel) {
        const card = mainStoryPanel.querySelector('.mainStoryCard');
        if (card) card.scrollTop = card.scrollHeight;
    }

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
    /* 之前的台词已经读完过一次的话，重开这一章直接跳到选项/继续按钮，
       不用每次自动弹窗都从头重新点一遍已经看过的对话。 */
    mainStoryLineIndex = mainStoryStageSeen[idx] ? Math.max(0, (stage.lines || []).length - 1) : 0;
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
    if (!unlocked) mainStoryAutoCooldown = mainStoryStageSeen[mainStoryState.stage] ? 45 : 6;
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
   结局：最后一次炼金那一章的选择，决定送别宗庆后的方式——
   坏结局允许重新回去，把那次选择再想一遍。
   ================================================================ */

function triggerEnding(id) {
    const ending = ENDINGS[id];
    if (!ending) return;
    mainStoryState.endingId = id;
    if (!endingPanel) return;
    endingKicker.textContent = id === 'good' ? '结局 · 好结局' : '结局 · 坏结局';
    endingTitle.textContent = ending.title;
    endingBody.innerHTML = ending.lines.map(t => '<p>' + t + '</p>').join('') +
        (ending.retry ? '<p class="endingRetryNote">合上账本，深吸一口气——愿意的话，可以回去把那个选择再想一遍。</p>' : '');
    if (endingCloseBtn) endingCloseBtn.textContent = ending.retry ? '回去重新想想' : '合上这本账';
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
    const stage = MAIN_STORY_STAGES[idx];
    /* autoEntry：这一章不靠"走到门口就先把剧情念一遍"来触发——
       先放玩家自由进去，章节本身的 auto 条件会在别的地方（比如
       股市小屋里点开了什么）达成后，由 pollAutoStageAdvance 自动
       弹出对话，不需要卡在门口。 */
    if (stage && stage.autoEntry) {
        if (typeof proceed === 'function') proceed();
        return;
    }
    if (stage && stage.silent) {
        if (typeof showHintOverride === 'function') {
            showHintOverride(stage.lockedHint || stage.questLabel || '条件还没达成，先继续经营');
        }
        return;
    }
    openMainStoryStage(idx, proceed);
}

let mainStoryAutoCooldown = 0;
/* 这一章的台词是不是已经完整读过一遍——只在这次会话里记，重开
   游戏会重置，但足够避免"关掉又弹、每次都从头念一遍"的烦躁感。 */
const mainStoryStageSeen = {};

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
if (questText) {
    /* 目标已经达成、只差一个决定的时候，点一下任务栏文字就能随时
       手动把对话叫回来，不用干等自动弹窗的冷却时间。 */
    questText.style.cursor = 'pointer';
    questText.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const idx = mainStoryState.stage;
        const stage = MAIN_STORY_STAGES[idx];
        if (!stage || (mainStoryPanel && !mainStoryPanel.hidden) || !mainStoryStageReady(stage)) return;
        mainStoryAutoCooldown = 0;
        openMainStoryStage(idx, null);
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
    } else if (mainStoryState.stage === 2) {
        const delivered = storyStat('deliveryCount') >= 1;
        if (!delivered) label = '完成第一笔送货（订单板接单），再攒够 110 金币';
        else if (currentCoins() < 110) label = '第一笔送货完成，继续攒到 110 金币';
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
