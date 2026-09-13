'use strict';

const storyMapPanel = document.getElementById('storyMapPanel');
const storyMapRoute = document.getElementById('storyMapRoute');
const storyMapProgress = document.getElementById('storyMapProgress');
const storyMapClose = document.getElementById('closeStoryMapBtn');
const storyMapQuestBtn = document.getElementById('storyMapQuestBtn');
const storyMapMenuBtn = document.getElementById('storyMapMenuBtn');
let storyMapReturnFocus = null;

const STORY_MAP_NOTES = [
    '亲手收割三次萝卜，读简历并雇好帮手。',
    '完成第一笔送货，从小买卖攒出本钱。',
    '先看市场消息，再赢得承包茶场的机会。',
    '决定娃哈哈的广告投入。',
    '决定怎样接手罐头厂。',
    '决定非常可乐走哪条销售路。',
    '回看经营决定如何改变股价。',
    '读清合同，守住公司的主动权。'
];

const STORY_MAP_UNLOCKS = {
    investment: '股市小屋',
    tea: '茶场',
    coin: '钱滚钱商店'
};

function storyMapChoice(index) {
    if (index === 3) return mainStoryState.flags.adGambleWon ? '黄金时段广告' : '低成本广告';
    if (index === 4) return mainStoryState.flags.factoryBonus ? '有偿兼并' : '联营 / 租赁';
    if (index === 5) return mainStoryState.flags.ruralNetwork ? '乡镇联销体' : '正面广告战';
    if (index === 7) return mainStoryState.endingId === 'good' ? '逐条核对合同' : '直接签约';
    return '';
}

function storyMapText(parent, tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    parent.appendChild(element);
    return element;
}

function renderStoryMap() {
    if (!storyMapRoute) return;
    const completed = Math.min(mainStoryState.stage, MAIN_STORY_STAGES.length);
    storyMapProgress.textContent = '已完成 ' + completed + ' / ' + MAIN_STORY_STAGES.length + ' 段';
    storyMapRoute.replaceChildren();

    MAIN_STORY_STAGES.forEach((stage, index) => {
        const status = index < completed ? 'done' : index === completed ? 'current' : 'future';
        const stop = document.createElement('article');
        stop.className = 'storyMapStop storyMapStop--' + status + (index % 2 ? ' storyMapStop--right' : '');
        stop.setAttribute('aria-label', stage.title + '，' +
            (status === 'done' ? '已完成' : status === 'current' ? '当前目标' : '尚未到达'));

        const marker = storyMapText(stop, 'span', 'storyMapMarker', status === 'done' ? '✓' : String(index + 1));
        marker.setAttribute('aria-hidden', 'true');
        const content = document.createElement('div');
        content.className = 'storyMapStopBody';
        storyMapText(content, 'span', 'storyMapStatus',
            status === 'done' ? '已完成' : status === 'current' ? '正在进行' : '尚未到达');
        storyMapText(content, 'h3', 'storyMapStopTitle', stage.title);
        storyMapText(content, 'p', 'storyMapNote', STORY_MAP_NOTES[index]);

        if (stage.coinRequirement) {
            const target = stage.coinRequirement + ' 金币';
            storyMapText(content, 'p', 'storyMapMeta', status === 'current'
                ? '资金目标 ' + target + ' · 当前 ' + currentCoins()
                : '资金目标 ' + target);
        }
        if (stage.unlocks && STORY_MAP_UNLOCKS[stage.unlocks]) {
            storyMapText(content, 'p', 'storyMapMeta', '解锁 ' + STORY_MAP_UNLOCKS[stage.unlocks]);
        }
        if (status === 'done' && Array.isArray(stage.choices)) {
            storyMapText(content, 'p', 'storyMapDecision', '你的选择：' + storyMapChoice(index));
        } else if (status === 'current') {
            const objective = typeof currentMainStoryObjective === 'function' ? currentMainStoryObjective() : null;
            storyMapText(content, 'p', 'storyMapObjective', objective ? objective.label : stage.questLabel);
        }
        stop.appendChild(content);
        storyMapRoute.appendChild(stop);
    });
}

function openStoryMap(event) {
    if (!storyMapPanel || window.APP_GAME_MODAL_OPEN) return;
    storyMapReturnFocus = event && event.currentTarget || document.activeElement;
    renderStoryMap();
    document.getElementById('menuPanel')?.classList.remove('open');
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    storyMapPanel.hidden = false;
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    storyMapClose.focus();
}

function closeStoryMap() {
    if (!storyMapPanel || storyMapPanel.hidden) return;
    storyMapPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (storyMapReturnFocus && document.contains(storyMapReturnFocus)) storyMapReturnFocus.focus();
}

storyMapQuestBtn?.addEventListener('click', openStoryMap);
storyMapMenuBtn?.addEventListener('click', openStoryMap);
storyMapClose?.addEventListener('click', closeStoryMap);
storyMapPanel?.addEventListener('click', event => {
    if (event.target === storyMapPanel) closeStoryMap();
});
addEventListener('keydown', event => {
    if (event.key !== 'Escape' || storyMapPanel.hidden) return;
    event.preventDefault();
    closeStoryMap();
});
