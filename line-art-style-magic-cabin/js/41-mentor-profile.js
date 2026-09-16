'use strict';

/* ================================================================
   关于师傅：把"认识他有多深"这件事可视化——三个标签页，左边一列
   章节，右边大字读物，翻页读。
   1. 主线记忆——跟主线章节挂钩，每条记着一个 stage 门槛，一章可以
      挂不止一条，内容取材自他年轻时的真实经历。
   2. 生活碎片——藏在小屋各处互动里，不按顺序解锁，碰到对应的
      成就就亮了，复用已经在记的 achievementState.unlocked。
   3. 走进他的回忆——四篇独立的完整传记页面，各自挂 stage 门槛，
      跟主线一章一章对齐解锁。
   ================================================================ */

const MENTOR_FRAGMENTS = [
    { stage: 0, tag: '小屋 · 初见', title: '懵然初遇', text: '他好像也不知道自己怎么到这儿的——跟你一样懵。\n\n屋子里的一切他都要伸手碰一碰，像是想确认这是不是真的。你问他叫什么，他愣了一下，说随便叫吧，师傅就行。' },
    { stage: 0, tag: '小屋 · 初见', title: '锱铢必较', text: '他对钱格外较真，一分一角都要数清楚，像是刻在骨头里的习惯。\n\n哪怕只是你随口提到的几个铜板，他也要停下来算一遍，嘴里念叨"这笔账得记清楚"，仿佛少算一分都是天大的事。' },

    { stage: 1, tag: '巷口 · 幼年', title: '穷过的人', text: '他对几块钱都格外认真，好像穷过很长一段日子。\n\n有一次你随手把一枚硬币扔进抽屉，他皱着眉把它捡出来擦干净，才重新放好。"钱不这么放。"他只说了这一句，没再解释。' },
    { stage: 1, tag: '巷口 · 幼年', title: '炒米叫卖', text: '他八九岁就蹲在门口炒米沿街叫卖，一毛钱一包，手背上常年是冻疮裂开的口子。\n\n他说起这段往事时语气很平淡，像是在念别人的账本，可说到冻疮那句，手指无意识地摩挲了一下手背。' },

    { stage: 2, tag: '送货路上', title: '账本很重', text: '他把账本看得很重，却什么都没解释。\n\n你见过他半夜坐在灯下核对一页页数字，第二天问他昨晚在忙什么，他只说"睡不着，看看账"，眼神却躲开了你。' },
    { stage: 2, tag: '送货路上', title: '蹬三轮车', text: '年轻时蹬过三轮车，一送就是好几年。\n\n他偶尔会盯着院子里那辆旧车出神，手不自觉地比划出握车把的姿势，像是身体还记得那些年的重量。' },
    { stage: 2, tag: '送货路上', title: '马目农场', text: '他年轻时在一个叫马目的地方待过——后来你才知道，那是个从前关犯人的地方。\n\n提起这个地名时他停顿了很久，才说了一句"那地方，教会我扛"，然后就转开了话题，不肯再往下说。' },

    { stage: 3, tag: '茶园 · 加工', title: '什么都卖过', text: '以前什么都卖过——冰棍、文具，什么赚钱干什么。\n\n他说这话时带着点自嘲的笑："什么赚钱就卖什么，不丢人，丢人的是没东西卖。"' },
    { stage: 3, tag: '茶园 · 加工', title: '评先进', text: '他说过一句怪话："干得好的，评先进、加工分；干不好的，扣口粮。"像是背书一样脱口而出。\n\n你追问这是哪儿的规矩，他愣了一下才反应过来自己说漏了嘴，摆摆手说"随口胡说，别当真"。' },

    { stage: 4, tag: '仓库 · 囤货', title: '漏了口风', text: '嘴里漏出过"娃哈哈"这个词，随即改口说是"以前的事"。\n\n那一瞬间他的表情有种很少见的慌乱，很快又恢复成平时那副不动声色的样子，仿佛刚才什么都没发生过。' },
    { stage: 4, tag: '仓库 · 囤货', title: '挚友阿海', text: '他提过一个叫阿海的人，说是当年一起扛过苦日子的兄弟，后来再没见过。\n\n"欠他一句来找我，一直没兑现。"他说这话的时候望着窗外，很久没再开口。' },

    { stage: 5, tag: '股市小屋 · 身份', title: '真名揭晓', text: '他的真名是宗庆后——娃哈哈的创始人。\n\n你反应过来的那一刻，他只是耸了耸肩："怎么，名字还能值钱？"仿佛这不是什么大不了的秘密。' },
    { stage: 5, tag: '股市小屋 · 身份', title: '下乡十年', text: '他年轻时下乡插队十几年，从舟山到绍兴，种过茶、割过稻、挖过坝。\n\n"那些年不是白过的，"他说，"力气是唯一不会骗人的东西。"' },

    { stage: 6, tag: '账房 · 规矩', title: '寒心的规矩', text: '当年也曾亲手定下让老伙计寒心的规矩，可他记得每一个人。\n\n他说这话时语气很轻，却带着从没松开过的一点愧疚："规矩得立，但欠的人情，我记着。"' },
    { stage: 6, tag: '账房 · 规矩', title: '赵伯的道理', text: '他说过，有个姓赵的老人曾经教他——"这世上的路看着有千万条，其实轮到自己走的，就一条，把它走通了就什么都有了。"\n\n他讲这话的神情，像是又变回了当年那个没听懂的年轻人。' },

    { stage: 7, tag: '投资 · 边界', title: '边界感', text: '他也有自己看不懂、不肯瞎判断的东西——谨慎是有边界的。\n\n"算得明白的，是我干过的生意，"他说，"没干过的，不该装懂。"这句话他说得很认真，不像是在开玩笑。' },
    { stage: 7, tag: '投资 · 边界', title: '刻鸳鸯的家具', text: '他很少提起自己的妻子，只说过一句：家里那套家具，是弟弟们打的，桌角刻了一对鸳鸯。\n\n说完这句他就不再往下讲了，只是嘴角有一点很淡的笑意，一闪而过。' },

    { stage: 8, tag: '坩埚旁 · 临别', title: '临别的教诲', text: '他不会魔法，却在临走前教会了你怎么把日子过明白。\n\n"地是你种的，账是你算的，我就在旁边看着，"他说，"看着，也是陪着。"' },
    { stage: 8, tag: '坩埚旁 · 临别', title: '三十三岁回城', text: '他说，回城那年他三十三岁，没人觉得这个岁数回来的人能有什么出息——连他自己都这么以为。\n\n"可日子不会因为你灰心就停下来，"他说，"该接着走的，还是得走。"' }
];

/* 藏在小屋各处互动里的碎片——不按主线顺序解锁，碰到对应的
   成就就亮了。复用已经在记的 achievementState.unlocked，不用
   另起一套触发和存档逻辑。title 直接借用对应成就的标题。 */
const MENTOR_HIDDEN_FRAGMENTS = [
    { achievementId: 'explore_fire', icon: '🔥', tag: '壁炉旁', title: '炉火可亲', text: '他说，冷天里第一件事是先点炉子，不是先算账——"人都冻透了，算什么都算不准。"\n\n说完他就蹲下来拨了拨炉子里的火，动作熟练得不像是第一次做这件事。' },
    { achievementId: 'explore_cat', icon: '🐱', tag: '猫窝边', title: '唤醒猫咪', text: '他看着睡着的猫说："会享福的东西，走到哪儿都饿不着。"语气说不清是羡慕还是感慨。\n\n他伸手想摸摸猫，又在半空中停住，改成轻轻拍了拍旁边的桌子。' },
    { achievementId: 'explore_chest', icon: '📦', tag: '储物箱前', title: '百宝箱', text: '翻箱子的时候他破例没拦你——"旧东西留着，不是舍不得扔，是记得当年怎么来的。"\n\n他拿起其中一件旧物看了很久，最后又轻轻放了回去，什么都没说。' },
    { achievementId: 'well_keeper', icon: '💧', tag: '水井边', title: '井边熟客', text: '打水时他随口说："我年轻那会儿，水比钱难攒。"再问，他就不接话了。\n\n他摇了摇井绳，看着水桶一点点升上来，神情有点恍惚。' },
    { achievementId: 'newspaper_reader', icon: '📰', tag: '报架前', title: '读报的人', text: '他不太爱看报纸上的大新闻，倒是每次都翻到"物价"那一栏，看得很认真。\n\n"新闻是别人的事，"他说，"物价才是自己的事。"' },
    { achievementId: 'magic_touch', icon: '🪄', tag: '法阵旁', title: '魔法手感', text: '他从不碰魔法道具，却总站在旁边看你摆弄——"这些我不懂，但看着你捣鼓，挺好。"\n\n他看得很专注，眼神里有一点你从没见过的好奇。' },
    { achievementId: 'coin_bankrupt', icon: '📉', tag: '钱滚钱商店', title: '血本无归', text: '看你在钱滚钱商店输光那次，他没说教，只说了句："输得起，才输得明白。"\n\n他拍了拍你的肩膀，力道不轻不重，像是在说"下次注意点"，又像是什么都没说。' },
    { achievementId: 'interaction_collector', icon: '✨', tag: '走遍小屋', title: '什么都要碰一下', text: '你把屋里能碰的都碰了一遍那天，他笑了："好奇心不是坏毛病，就怕光好奇不算账。"\n\n他难得笑得这么开，眼角的皱纹都堆到了一起。' }
];

/* 认出他是谁之后，才会开始一篇一篇解锁完整的独立传记页面——
   memories/ 下四个自成一体的页面，自己链着 part1→part2→part3
   （见各文件里的"下一篇"按钮），这边只管每一篇什么时候亮起来。 */
const MENTOR_MEMORY_CHAPTERS = [
    { stage: 5, file: 'memories/first.html', title: '序章 · 1945—1978', desc: '家道中落，下乡插队的那些年' },
    { stage: 6, file: 'memories/part1.html', title: '第①部分 · 代销小摊 · 1987', desc: '三十九岁，蹬三轮车摆摊攒第一桶金' },
    { stage: 7, file: 'memories/part2.html', title: '第②部分 · 承包谈判 · 1987', desc: '接下连年亏损的校办经销部' },
    { stage: 8, file: 'memories/part3.html', title: '第③部分 · 广告豪赌 · 1988', desc: '把全部身家押在一次电视广告上' }
];

const MENTOR_QUOTES = [
    '做生意，也是做人。',
    '地不哄人，你种下去多少心思，它就给你长多少东西。',
    '几块钱也是钱。',
    '先把眼前的事做好，日子总会好起来的。',
    '这世上的路看着有千万条，其实轮到自己走的，就一条。'
];

const MENTOR_TABS = [
    { id: 'story', label: '主线记忆', icon: '📖' },
    { id: 'hidden', label: '生活碎片', icon: '☕' },
    { id: 'memory', label: '走进他的回忆', icon: '📜' }
];

const mentorPanel = document.getElementById('mentorPanel');
const mentorHeroQuote = document.getElementById('mentorHeroQuote');
const mentorTabsEl = document.getElementById('mentorTabs');
const mentorReaderList = document.getElementById('mentorReaderList');
const mentorReaderDetail = document.getElementById('mentorReaderDetail');
const closeMentorBtn = document.getElementById('closeMentorBtn');
const mentorMenuBtn = document.getElementById('mentorMenuBtn');

let mentorActiveTab = 'story';
let mentorSelectedIndex = { story: 0, hidden: 0, memory: 0 };

function mentorCurrentStage() {
    return typeof mainStoryState !== 'undefined' ? mainStoryState.stage : 0;
}

function mentorStoryItems() {
    const stage = mentorCurrentStage();
    return MENTOR_FRAGMENTS.map((f, i) => ({
        unlocked: stage > f.stage,
        number: i + 1,
        tag: f.tag,
        title: f.title,
        body: f.text
    }));
}

function mentorHiddenItems() {
    return MENTOR_HIDDEN_FRAGMENTS.map(f => ({
        unlocked: typeof achievementState !== 'undefined' && !!achievementState.unlocked[f.achievementId],
        icon: f.icon,
        tag: f.tag,
        title: f.title,
        body: f.text
    }));
}

function mentorMemoryItems() {
    const stage = mentorCurrentStage();
    return MENTOR_MEMORY_CHAPTERS.map(c => ({
        unlocked: stage > c.stage,
        title: c.title,
        desc: c.desc,
        file: c.file
    }));
}

function mentorItemsForTab(tab) {
    if (tab === 'hidden') return mentorHiddenItems();
    if (tab === 'memory') return mentorMemoryItems();
    return mentorStoryItems();
}

function mentorUnlockedCount(items) {
    return items.filter(it => it.unlocked).length;
}

function renderMentorTabs() {
    if (!mentorTabsEl) return;
    mentorTabsEl.innerHTML = MENTOR_TABS.map(tab => {
        const items = mentorItemsForTab(tab.id);
        const count = mentorUnlockedCount(items);
        return '<button type="button" class="mentorTabBtn' + (tab.id === mentorActiveTab ? ' on' : '') + '" data-tab="' + tab.id + '">' +
            '<span class="mentorTabIcon">' + tab.icon + '</span>' + tab.label +
            '<em>' + count + '/' + items.length + '</em>' +
            '</button>';
    }).join('');
}

function renderMentorList() {
    if (!mentorReaderList) return;
    const items = mentorItemsForTab(mentorActiveTab);
    const selected = mentorSelectedIndex[mentorActiveTab] || 0;
    if (mentorActiveTab === 'story') {
        mentorReaderList.innerHTML =
            '<p class="mentorListHead">主线进度</p>' +
            '<p class="mentorListCount">' + mentorUnlockedCount(items) + ' / ' + items.length + '</p>' +
            '<div class="mentorListTimeline">' +
            items.map((it, i) => '<div class="mentorListRow' + (i === selected ? ' on' : '') + (it.unlocked ? ' unlocked' : ' locked') + '" data-index="' + i + '">' +
                '<span class="mentorListNum">' + it.number + '</span>' +
                '<span class="mentorListLabel">' + (it.unlocked ? it.title : '？？？') + '</span>' +
                '</div>').join('') +
            '</div>';
    } else if (mentorActiveTab === 'hidden') {
        mentorReaderList.innerHTML =
            '<p class="mentorListHead">生活碎片</p>' +
            '<p class="mentorListCount">' + mentorUnlockedCount(items) + ' / ' + items.length + '</p>' +
            '<div class="mentorListTimeline">' +
            items.map((it, i) => '<div class="mentorListRow' + (i === selected ? ' on' : '') + (it.unlocked ? ' unlocked' : ' locked') + '" data-index="' + i + '">' +
                '<span class="mentorListNum">' + (it.unlocked ? it.icon : '🔒') + '</span>' +
                '<span class="mentorListLabel">' + (it.unlocked ? it.title : '？？？') + '</span>' +
                '</div>').join('') +
            '</div>';
    } else {
        mentorReaderList.innerHTML =
            '<p class="mentorListHead">走进他的回忆</p>' +
            '<p class="mentorListCount">' + mentorUnlockedCount(items) + ' / ' + items.length + '</p>' +
            '<div class="mentorListTimeline">' +
            items.map((it, i) => '<div class="mentorListRow' + (i === selected ? ' on' : '') + (it.unlocked ? ' unlocked' : ' locked') + '" data-index="' + i + '">' +
                '<span class="mentorListNum">' + (it.unlocked ? '📖' : '🔒') + '</span>' +
                '<span class="mentorListLabel">' + it.title + '</span>' +
                '</div>').join('') +
            '</div>';
    }
}

function mentorClampIndex(tab, items) {
    const idx = mentorSelectedIndex[tab] || 0;
    return Math.max(0, Math.min(items.length - 1, idx));
}

function renderMentorDetail() {
    if (!mentorReaderDetail) return;
    const items = mentorItemsForTab(mentorActiveTab);
    if (!items.length) { mentorReaderDetail.innerHTML = ''; return; }
    const idx = mentorClampIndex(mentorActiveTab, items);
    mentorSelectedIndex[mentorActiveTab] = idx;
    const it = items[idx];
    const prevDisabled = idx <= 0;
    const nextDisabled = idx >= items.length - 1;
    const nav = '<div class="mentorDetailNav">' +
        '<button type="button" class="mentorNavBtn" data-nav="prev"' + (prevDisabled ? ' disabled' : '') + '>‹ 上一章</button>' +
        '<button type="button" class="mentorNavBtn" data-nav="next"' + (nextDisabled ? ' disabled' : '') + '>下一章 ›</button>' +
        '</div>';

    if (mentorActiveTab === 'memory') {
        const badge = it.unlocked ? '<span class="mentorDetailBadge on">已解锁 ✓</span>' : '<span class="mentorDetailBadge">未解锁 🔒</span>';
        mentorReaderDetail.innerHTML =
            '<div class="mentorDetailHead"><h3>' + it.title + '</h3>' + badge + '</div>' +
            '<p class="mentorDetailBody">' + (it.unlocked ? it.desc : '主线再往前推进一些，这一篇才会打开。') + '</p>' +
            (it.unlocked
                ? '<a class="mentorDetailEnter" href="' + it.file + '" target="_blank" rel="noopener">📜 进入这一章（新标签页）</a>'
                : '') +
            nav;
        return;
    }

    const badge = it.unlocked ? '<span class="mentorDetailBadge on">已解锁 ✓</span>' : '<span class="mentorDetailBadge">未解锁 🔒</span>';
    const tagHtml = it.tag ? '<span class="mentorDetailTag">📍 ' + it.tag + '</span>' : '';
    mentorReaderDetail.innerHTML =
        '<div class="mentorDetailKicker">' + (mentorActiveTab === 'story' ? ('第 ' + it.number + ' 章') : '生活碎片') + '</div>' +
        '<div class="mentorDetailHead"><h3>' + (it.unlocked ? it.title : '？？？') + '</h3>' + tagHtml + badge + '</div>' +
        '<p class="mentorDetailBody">' + (it.unlocked ? it.body : '还没解锁这段记忆。') + '</p>' +
        nav;
}

function renderMentorPanel() {
    if (mentorHeroQuote) {
        const q = MENTOR_QUOTES[Math.floor(Math.random() * MENTOR_QUOTES.length)];
        mentorHeroQuote.innerHTML = '“' + q + '”<br>——宗庆后';
    }
    renderMentorTabs();
    renderMentorList();
    renderMentorDetail();
}

function mentorSelectTab(tab) {
    if (tab === mentorActiveTab) return;
    mentorActiveTab = tab;
    renderMentorPanel();
}

function mentorSelectIndex(i) {
    mentorSelectedIndex[mentorActiveTab] = i;
    renderMentorList();
    renderMentorDetail();
}

function mentorNav(dir) {
    const items = mentorItemsForTab(mentorActiveTab);
    const idx = mentorClampIndex(mentorActiveTab, items);
    const next = dir === 'next' ? idx + 1 : idx - 1;
    if (next < 0 || next >= items.length) return;
    mentorSelectIndex(next);
}

if (mentorTabsEl) {
    mentorTabsEl.addEventListener('click', event => {
        const btn = event.target.closest('[data-tab]');
        if (btn) mentorSelectTab(btn.dataset.tab);
    });
}
if (mentorReaderList) {
    mentorReaderList.addEventListener('click', event => {
        const row = event.target.closest('[data-index]');
        if (row) mentorSelectIndex(Number(row.dataset.index));
    });
}
if (mentorReaderDetail) {
    mentorReaderDetail.addEventListener('click', event => {
        const btn = event.target.closest('[data-nav]');
        if (btn && !btn.disabled) mentorNav(btn.dataset.nav);
    });
}

function openMentorPanel() {
    if (!mentorPanel) return;
    renderMentorPanel();
    document.getElementById('menuPanel')?.classList.remove('open');
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    mentorPanel.hidden = false;
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeMentorPanel() {
    if (!mentorPanel || mentorPanel.hidden) return;
    mentorPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof SND !== 'undefined') SND.play('ui');
}

if (mentorMenuBtn) mentorMenuBtn.addEventListener('click', openMentorPanel);
if (closeMentorBtn) closeMentorBtn.addEventListener('click', closeMentorPanel);
if (mentorPanel) {
    mentorPanel.addEventListener('click', event => {
        if (event.target === mentorPanel) closeMentorPanel();
    });
}
addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !mentorPanel || mentorPanel.hidden) return;
    closeMentorPanel();
});
