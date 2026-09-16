'use strict';

/* ================================================================
   关于师傅：把"认识他有多深"这件事可视化——人物碎片，跟主线章节
   挂钩，每条记着一个 stage 门槛（推进到超过这一章才解锁），没解锁
   的先占位成"？？？"。一章可以挂不止一条碎片，不用碎片数量跟
   章节数严格1:1——内容取材自他年轻时的真实经历（马目农场、绍兴
   茶场、阿海、赵伯、代销小摊……），比只有一句话的版本更立体。
   ================================================================ */

const MENTOR_FRAGMENTS = [
    { stage: 0, text: '他好像也不知道自己怎么到这儿的——跟你一样懵。' },
    { stage: 0, text: '他对钱格外较真，一分一角都要数清楚，像是刻在骨头里的习惯。' },

    { stage: 1, text: '他对几块钱都格外认真，好像穷过很长一段日子。' },
    { stage: 1, text: '他八九岁就蹲在门口炒米沿街叫卖，一毛钱一包，手背上常年是冻疮裂开的口子。' },

    { stage: 2, text: '他把账本看得很重，却什么都没解释。' },
    { stage: 2, text: '年轻时蹬过三轮车，一送就是好几年。' },
    { stage: 2, text: '他年轻时在一个叫马目的地方待过——后来你才知道，那是个从前关犯人的地方。' },

    { stage: 3, text: '以前什么都卖过——冰棍、文具，什么赚钱干什么。' },
    { stage: 3, text: '他说过一句怪话："干得好的，评先进、加工分；干不好的，扣口粮。"像是背书一样脱口而出。' },

    { stage: 4, text: '嘴里漏出过"娃哈哈"这个词，随即改口说是"以前的事"。' },
    { stage: 4, text: '他提过一个叫阿海的人，说是当年一起扛过苦日子的兄弟，后来再没见过。' },

    { stage: 5, text: '他的真名是宗庆后——娃哈哈的创始人。' },
    { stage: 5, text: '他年轻时下乡插队十几年，从舟山到绍兴，种过茶、割过稻、挖过坝。' },

    { stage: 6, text: '当年也曾亲手定下让老伙计寒心的规矩，可他记得每一个人。' },
    { stage: 6, text: '他说过，有个姓赵的老人曾经教他——"这世上的路看着有千万条，其实轮到自己走的，就一条，把它走通了就什么都有了。"' },

    { stage: 7, text: '他也有自己看不懂、不肯瞎判断的东西——谨慎是有边界的。' },
    { stage: 7, text: '他很少提起自己的妻子，只说过一句：家里那套家具，是弟弟们打的，桌角刻了一对鸳鸯。' },

    { stage: 8, text: '他不会魔法，却在临走前教会了你怎么把日子过明白。' },
    { stage: 8, text: '他说，回城那年他三十三岁，没人觉得这个岁数回来的人能有什么出息——连他自己都这么以为。' }
];

/* 藏在小屋各处互动里的碎片——不按主线顺序解锁，碰到对应的
   成就就亮了。复用已经在记的 achievementState.unlocked，不用
   另起一套触发和存档逻辑。 */
const MENTOR_HIDDEN_FRAGMENTS = [
    { achievementId: 'explore_fire', icon: '🔥', text: '他说，冷天里第一件事是先点炉子，不是先算账——"人都冻透了，算什么都算不准。"' },
    { achievementId: 'explore_cat', icon: '🐱', text: '他看着睡着的猫说："会享福的东西，走到哪儿都饿不着。"语气说不清是羡慕还是感慨。' },
    { achievementId: 'explore_chest', icon: '📦', text: '翻箱子的时候他破例没拦你——"旧东西留着，不是舍不得扔，是记得当年怎么来的。"' },
    { achievementId: 'well_keeper', icon: '💧', text: '打水时他随口说："我年轻那会儿，水比钱难攒。"再问，他就不接话了。' },
    { achievementId: 'newspaper_reader', icon: '📰', text: '他不太爱看报纸上的大新闻，倒是每次都翻到"物价"那一栏，看得很认真。' },
    { achievementId: 'magic_touch', icon: '✨', text: '他从不碰魔法道具，却总站在旁边看你摆弄——"这些我不懂，但看着你捣鼓，挺好。"' },
    { achievementId: 'coin_bankrupt', icon: '🎲', text: '看你在钱滚钱商店输光那次，他没说教，只说了句："输得起，才输得明白。"' },
    { achievementId: 'interaction_collector', icon: '🧭', text: '你把屋里能碰的都碰了一遍那天，他笑了："好奇心不是坏毛病，就怕光好奇不算账。"' }
];

const mentorPanel = document.getElementById('mentorPanel');
const mentorFragments = document.getElementById('mentorFragments');
const closeMentorBtn = document.getElementById('closeMentorBtn');
const mentorMenuBtn = document.getElementById('mentorMenuBtn');

function renderMentorFragments() {
    if (!mentorFragments) return;
    const stage = typeof mainStoryState !== 'undefined' ? mainStoryState.stage : 0;
    const storyCards = MENTOR_FRAGMENTS.map((frag, i) => {
        const unlocked = stage > frag.stage;
        return '<div class="mentorFragmentCard' + (unlocked ? ' on' : '') + '">' +
            '<span class="mentorFragmentIndex">' + (unlocked ? (i + 1) : '🔒') + '</span>' +
            '<p>' + (unlocked ? frag.text : '还没解锁这段记忆') + '</p>' +
            '</div>';
    }).join('');
    const hiddenUnlockedCount = MENTOR_HIDDEN_FRAGMENTS.filter(f =>
        typeof achievementState !== 'undefined' && achievementState.unlocked[f.achievementId]).length;
    const hiddenCards = MENTOR_HIDDEN_FRAGMENTS.map(f => {
        const unlocked = typeof achievementState !== 'undefined' && !!achievementState.unlocked[f.achievementId];
        return '<div class="mentorFragmentCard mentorFragmentCard--hidden' + (unlocked ? ' on' : '') + '">' +
            '<span class="mentorFragmentIndex">' + (unlocked ? f.icon : '🔒') + '</span>' +
            '<p>' + (unlocked ? f.text : '还没碰到这段记忆——在小屋里多摸摸看') + '</p>' +
            '</div>';
    }).join('');
    mentorFragments.innerHTML = storyCards +
        '<p class="mentorFragmentsSubhead">藏在小屋里的记忆 · ' + hiddenUnlockedCount + '/' + MENTOR_HIDDEN_FRAGMENTS.length + '</p>' +
        hiddenCards;
}

function renderMentorPanel() {
    renderMentorFragments();
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
