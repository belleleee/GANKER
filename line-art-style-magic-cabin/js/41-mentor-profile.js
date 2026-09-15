'use strict';

/* ================================================================
   关于师傅：把"认识他有多深"这件事可视化
   两块内容：
   1. 人物碎片——跟主线十个章节一一对应，每完成一章解锁一条，
      没解锁的先占位成"？？？"，不用额外的数据结构，直接复用
      mainStoryState.stage 这个已有进度。
   2. 关系数值——mainStoryState.mentor 的 trust/agreement/independence
      三项本来就在记，只是从来没有界面展示出来，这里配上文字化的
      档位描述，别只甩三个数字。
   ================================================================ */

const MENTOR_FRAGMENTS = [
    '他好像也不知道自己怎么到这儿的——跟你一样懵。',
    '他对几块钱都格外认真，好像穷过很长一段日子。',
    '他把账本看得很重，却什么都没解释。',
    '年轻时蹬过三轮车，一送就是好几年。',
    '以前什么都卖过——冰棍、文具，什么赚钱干什么。',
    '嘴里漏出过"娃哈哈"这个词，随即改口说是"以前的事"。',
    '他的真名是宗庆后——娃哈哈的创始人。',
    '当年也曾亲手定下让老伙计寒心的规矩，可他记得每一个人。',
    '他也有自己看不懂、不肯瞎判断的东西——谨慎是有边界的。',
    '他不会魔法，却在临走前教会了你怎么把日子过明白。'
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
const mentorRelation = document.getElementById('mentorRelation');
const mentorFragments = document.getElementById('mentorFragments');
const closeMentorBtn = document.getElementById('closeMentorBtn');
const mentorMenuBtn = document.getElementById('mentorMenuBtn');

function mentorRelationBand(value, labels) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    if (v < 30) return labels[0];
    if (v < 60) return labels[1];
    if (v < 85) return labels[2];
    return labels[3];
}

function mentorRelationRow(icon, label, value, labels) {
    const v = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="mentorRelationRow">' +
        '<div class="mentorRelationHead"><span><i class="mentorRelationIcon">' + icon + '</i>' + label + '</span><strong>' + mentorRelationBand(v, labels) + '</strong></div>' +
        '<div class="mentorRelationBar"><i style="width:' + v + '%"></i></div>' +
        '</div>';
}

function renderMentorRelation() {
    if (!mentorRelation) return;
    const mentor = (typeof mainStoryState !== 'undefined' && mainStoryState.mentor) || { trust: 50, agreement: 50, independence: 50 };
    mentorRelation.innerHTML =
        mentorRelationRow('🤝', '信任', mentor.trust, ['还在观察你', '开始认你这个人', '信得过你', '把你当自己人']) +
        mentorRelationRow('💭', '想法契合度', mentor.agreement, ['常常唱反调', '偶尔意见不合', '大多数时候想法一致', '几乎心有灵犀']) +
        mentorRelationRow('🧭', '你的独立性', mentor.independence, ['还很依赖他的判断', '开始有自己的想法', '能独立拿主意了', '完全能自己扛事']);
}

function renderMentorFragments() {
    if (!mentorFragments) return;
    const stage = typeof mainStoryState !== 'undefined' ? mainStoryState.stage : 0;
    const storyCards = MENTOR_FRAGMENTS.map((text, i) => {
        const unlocked = stage > i;
        return '<div class="mentorFragmentCard' + (unlocked ? ' on' : '') + '">' +
            '<span class="mentorFragmentIndex">' + (unlocked ? (i + 1) : '🔒') + '</span>' +
            '<p>' + (unlocked ? text : '还没解锁这段记忆') + '</p>' +
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
    renderMentorRelation();
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
