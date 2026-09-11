'use strict';

/* ================================================================
   书架彩蛋：《创业笔记》——宗庆后创业故事视觉小说
   拉出书架上的一本特定的书，翻开后是分章节的创业故事。
   每一章读完会遇到一次"投资"抉择：手里有金币就能投一笔，
   立刻拿到一笔回报，并解锁下一章；也可以选择不投，直接看下去。
   ================================================================ */

const ZONG_BOOK_INDEX = 6; // shelfBooks 数组里被选中的那一本书（最底层第7本）

const ZONG_CHAPTERS = [
    {
        title: '第一章 · 三轮车与代销部',
        lines: [
            { speaker: '旁白', text: '1987年，杭州上城区一间十几平方米的校办企业经销部里，42岁的宗庆后签下承包协议，借来14万元启动资金。' },
            { speaker: '宗庆后', text: '"别人笑我一把年纪才创业，可我等不起了——机会从不会等一个犹豫的人。"' },
            { speaker: '旁白', text: '他每天蹬着三轮车，给全市中小学校送冰棍、文具和汽水，一趟一趟地跑，把代销部的账本一页页写厚。' }
        ],
        invest: { cost: 20, reward: 32, desc: '代销部想多进一批畅销的文具和饮料，可流动资金不够，宗庆后正在找愿意先垫一笔货款的人。' }
    },
    {
        title: '第二章 · 儿童营养液',
        lines: [
            { speaker: '旁白', text: '1988年，宗庆后请来大学里的营养学教授调配方，做出了"娃哈哈儿童营养液"，主打一句朴素的口号。' },
            { speaker: '宗庆后', text: '"喝了娃哈哈，吃饭就是香——话糙理不糙，家长听得懂，孩子也肯喝。"' },
            { speaker: '旁白', text: '广告一打，订单像雪片一样飞来，小小的经销部第一次感受到什么叫供不应求。' }
        ],
        invest: { cost: 40, reward: 68, desc: '营养液订单暴涨，可产能跟不上，宗庆后想扩建一条生产线，正缺一笔周转资金。' }
    },
    {
        title: '第三章 · 小鱼吃大鱼',
        lines: [
            { speaker: '旁白', text: '1991年，年销售额几千万的娃哈哈，反过来兼并了规模大出好几倍的国营杭州罐头厂。' },
            { speaker: '宗庆后', text: '"厂子可以变小变大，但工人不能说不要就不要——我先把这句话立下来，人心才能收得住。"' },
            { speaker: '旁白', text: '靠着"不裁员、稳生产"的承诺，罐头厂两千多名员工的心，慢慢跟着这位新厂长走到了一起。' }
        ],
        invest: { cost: 65, reward: 105, desc: '兼并之后厂房、设备都要重新整顿，宗庆后想尽快把老厂的生产线改造成娃哈哈的样子。' }
    },
    {
        title: '第四章 · 合资与商标',
        lines: [
            { speaker: '旁白', text: '1996年，为了尽快扩大产能，娃哈哈引入达能等外资合资建厂，资金和设备一下宽裕起来。' },
            { speaker: '宗庆后', text: '"钱可以一起出，厂可以一起建，但娃哈哈这块牌子，是我们自己一步步走出来的，不能拱手让人。"' },
            { speaker: '旁白', text: '这句话后来在多年的商标纠纷里被反复提起，也让人第一次看清这位厂长的另一面——寸步不让的强硬。' }
        ],
        invest: { cost: 95, reward: 150, desc: '合资厂投产在即，宗庆后想再多铺几条生产线，把新增的产能尽快吃满市场。' }
    },
    {
        title: '第五章 · 非常可乐',
        lines: [
            { speaker: '旁白', text: '1998年，两大国际饮料巨头几乎占满了中国的可乐市场，娃哈哈却偏偏要做一款"中国人自己的可乐"。' },
            { speaker: '宗庆后', text: '"外国人能在中国卖可乐，我们为什么不能在自己的地盘上卖可乐？农村包围城市，一样能打赢。"' },
            { speaker: '旁白', text: '非常可乐没有硬碰硬地去挤大城市的货架，而是一头扎进了广袤的乡镇市场，慢慢扎下了根。' }
        ],
        invest: { cost: 130, reward: 205, desc: '非常可乐要铺进更多乡镇小卖部，宗庆后想再追加一批经销商的启动物料。' }
    },
    {
        title: '第六章 · 联销体',
        lines: [
            { speaker: '旁白', text: '娃哈哈和经销商约定：先打款、再发货，总部则承诺保住经销商的利润空间，双方拴成了一根绳上的蚂蚱。' },
            { speaker: '宗庆后', text: '"我让利给你，你替我把货铺到最偏的乡镇——这笔账，谁都不吃亏。"' },
            { speaker: '旁白', text: '靠着这张"联销体"织成的网，娃哈哈的产品铺到了全国最密的农村渠道，别的品牌很难再插进去。' }
        ],
        invest: { cost: 175, reward: 270, desc: '联销体要覆盖更偏远的乡镇网点，宗庆后想再垫付一批经销商的启动资金，把网织得更密。' }
    },
    {
        title: '尾声 · 永远创业',
        lines: [
            { speaker: '旁白', text: '往后的十几年里，宗庆后多次问鼎中国首富的榜单，可他大部分时间仍待在生产一线，穿着朴素的夹克巡厂房。' },
            { speaker: '宗庆后', text: '"钱多钱少是数字，厂子能不能一直办下去，才是我真正在意的事。"' },
            { speaker: '旁白', text: '笔记的最后一页没有写销售额，只留了四个字——永远创业。合上封面，油墨还带着一点新鲜的味道。' }
        ]
    }
];

let zongChapterIndex = 0;
let zongLineIndex = 0;
let zongResolvedCurrent = false;
let zongStats = { totalInvested: 0, totalReturned: 0, investCount: 0, skipCount: 0 };

const storyPanel = document.getElementById('storyPanel');
const storyChapterLabel = document.getElementById('storyChapterLabel');
const storySpeaker = document.getElementById('storySpeaker');
const storyText = document.getElementById('storyText');
const storyNextRow = document.getElementById('storyNextRow');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyInvestRow = document.getElementById('storyInvestRow');
const storyInvestDesc = document.getElementById('storyInvestDesc');
const storyInvestBtn = document.getElementById('storyInvestBtn');
const storySkipBtn = document.getElementById('storySkipBtn');
const storyDoneRow = document.getElementById('storyDoneRow');
const storyDoneText = document.getElementById('storyDoneText');
const storyCloseDoneBtn = document.getElementById('storyCloseDoneBtn');
const closeStoryBtn = document.getElementById('closeStoryBtn');

function zongCurrentChapter() {
    return ZONG_CHAPTERS[zongChapterIndex];
}

function renderZongFinished() {
    storyNextRow.hidden = true;
    storyInvestRow.hidden = true;
    storyDoneRow.hidden = false;
    storySpeaker.textContent = '旁白';
    storyText.textContent = '这本《创业笔记》已经翻到了最后一页。';
    storyChapterLabel.textContent = '全 ' + ZONG_CHAPTERS.length + ' 章 · 已读完';
    storyDoneText.textContent = '这些年一共投资了 ' + zongStats.investCount + ' 次，累计投入 ' + zongStats.totalInvested +
        ' 金币，收获 ' + zongStats.totalReturned + ' 金币。';
}

function renderZongLine() {
    const ch = zongCurrentChapter();
    const ln = ch.lines[zongLineIndex];
    storyChapterLabel.textContent = '第 ' + (zongChapterIndex + 1) + ' / ' + ZONG_CHAPTERS.length + ' 章 · ' + ch.title;
    storySpeaker.textContent = ln.speaker;
    storyText.textContent = ln.text;
    storyNextRow.hidden = false;
    storyInvestRow.hidden = true;
    storyDoneRow.hidden = true;
}

function showZongInvest(ch) {
    storyNextRow.hidden = true;
    storyInvestRow.hidden = false;
    const coins = typeof cabinCoins === 'number' ? cabinCoins : 0;
    const afford = coins >= ch.invest.cost;
    storyInvestDesc.textContent = ch.invest.desc + '（需要 ' + ch.invest.cost + ' 金币，预计收获 ' + ch.invest.reward + ' 金币）';
    storyInvestBtn.disabled = !afford;
    storyInvestBtn.textContent = afford ? ('投资 ' + ch.invest.cost + ' 金币') : '金币不足，投不了';
}

function advanceZongChapter() {
    zongChapterIndex++;
    zongResolvedCurrent = false;
    if (zongChapterIndex >= ZONG_CHAPTERS.length) {
        renderZongFinished();
    } else {
        zongLineIndex = 0;
        renderZongLine();
    }
    if (typeof SND !== 'undefined') SND.play('chim');
}

function onZongNext() {
    const ch = zongCurrentChapter();
    if (zongLineIndex < ch.lines.length - 1) {
        zongLineIndex++;
        renderZongLine();
        if (typeof SND !== 'undefined') SND.play('ui');
        return;
    }
    if (ch.invest && !zongResolvedCurrent) {
        showZongInvest(ch);
    } else {
        advanceZongChapter();
    }
}

function onZongInvest() {
    const ch = zongCurrentChapter();
    if (!ch.invest || zongResolvedCurrent) return;
    const coins = typeof cabinCoins === 'number' ? cabinCoins : 0;
    if (coins < ch.invest.cost) return;
    cabinCoins = coins - ch.invest.cost + ch.invest.reward;
    zongStats.totalInvested += ch.invest.cost;
    zongStats.totalReturned += ch.invest.reward;
    zongStats.investCount++;
    zongResolvedCurrent = true;
    if (typeof renderCoins === 'function') renderCoins(true);
    if (typeof showHintOverride === 'function') {
        showHintOverride('投资回报 +' + ch.invest.reward + ' 金币 · 当前金币 ' + cabinCoins);
    }
    if (typeof SND !== 'undefined') SND.play('chim');
    storyInvestRow.hidden = true;
    storyNextRow.hidden = false;
    storySpeaker.textContent = '旁白';
    storyText.textContent = '这一笔投资跟着宗庆后一起冒了险——事情办成了，净赚 ' + (ch.invest.reward - ch.invest.cost) + ' 金币。';
}

function onZongSkip() {
    const ch = zongCurrentChapter();
    if (!ch.invest || zongResolvedCurrent) return;
    zongResolvedCurrent = true;
    zongStats.skipCount++;
    storyInvestRow.hidden = true;
    storyNextRow.hidden = false;
    storySpeaker.textContent = '旁白';
    storyText.textContent = '这一次，你选择在一旁看着——宗庆后照样咬牙把这一步走完了，只是这次的收获与你无关。';
    if (typeof SND !== 'undefined') SND.play('ui');
}

function openZongStory() {
    if (!storyPanel) return;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (zongChapterIndex >= ZONG_CHAPTERS.length) {
        renderZongFinished();
    } else {
        zongLineIndex = 0;
        renderZongLine();
    }
    storyPanel.hidden = false;
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (document.pointerLockElement) document.exitPointerLock();
    closeStoryBtn.focus();
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeZongStory() {
    if (!storyPanel) return;
    storyPanel.hidden = true;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
    if (typeof SND !== 'undefined') SND.play('ui');
}

function captureZongStoryState() {
    return {
        chapterIndex: zongChapterIndex,
        resolvedCurrent: zongResolvedCurrent,
        stats: zongStats
    };
}

function applyZongStoryState(state) {
    if (!state || typeof state !== 'object') return;
    zongChapterIndex = Math.max(0, Math.min(ZONG_CHAPTERS.length, Math.trunc(Number(state.chapterIndex) || 0)));
    zongResolvedCurrent = state.resolvedCurrent === true;
    const s = state.stats || {};
    zongStats = {
        totalInvested: Math.max(0, Math.trunc(Number(s.totalInvested) || 0)),
        totalReturned: Math.max(0, Math.trunc(Number(s.totalReturned) || 0)),
        investCount: Math.max(0, Math.trunc(Number(s.investCount) || 0)),
        skipCount: Math.max(0, Math.trunc(Number(s.skipCount) || 0))
    };
}

if (closeStoryBtn) closeStoryBtn.addEventListener('click', closeZongStory);
if (storyCloseDoneBtn) storyCloseDoneBtn.addEventListener('click', closeZongStory);
if (storyNextBtn) storyNextBtn.addEventListener('click', onZongNext);
if (storyInvestBtn) storyInvestBtn.addEventListener('click', onZongInvest);
if (storySkipBtn) storySkipBtn.addEventListener('click', onZongSkip);

addEventListener('keydown', e => {
    if (!storyPanel || storyPanel.hidden) return;
    if (e.key === 'Escape') closeZongStory();
    if (e.key === 'Enter' && !storyNextRow.hidden) onZongNext();
});

if (storyPanel) {
    storyPanel.addEventListener('click', e => {
        if (e.target === storyPanel) closeZongStory();
    });
}

function makeZongBook() {
    if (typeof shelfBooks === 'undefined' || !shelfBooks[ZONG_BOOK_INDEX]) return;
    const book = shelfBooks[ZONG_BOOK_INDEX];
    book.userData.aimLabel = '翻开《创业笔记》';
    book.userData.sfx = 'ui';
    regMagic(book, () => {
        book.userData.out = !book.userData.out;
        openZongStory();
    });
    interactables.push({
        x: book.userData.bx,
        z: book.position.z,
        r: 1.2,
        label: '翻开《创业笔记》',
        act: openZongStory
    });
}

makeZongBook();

window.captureZongStoryState = captureZongStoryState;
window.applyZongStoryState = applyZongStoryState;
