'use strict';

const storyMapPanel = document.getElementById('storyMapPanel');
const storyMapRoute = document.getElementById('storyMapRoute');
const storyMapProgress = document.getElementById('storyMapProgress');
const storyMapClose = document.getElementById('closeStoryMapBtn');
const storyMapQuestBtn = document.getElementById('storyMapQuestBtn');
const storyMapMenuBtn = document.getElementById('storyMapMenuBtn');
let storyMapReturnFocus = null;

const STORY_MAP_NOTES = [
    '炼金术失败，陌生老人留下来，让你先从种地开始。',
    '买种子、翻地、播种、收获——第一次真正赚到钱。',
    '开始送货接单，现金第一次转成一个完整的圈。',
    '送货趟数多了，发现这个老头对生意熟得不像话。',
    '采茶、制茶、卖茶，第一次看懂"加工"能值多少钱。',
    '仓库堆满了货，却没人买——第一次听见"娃哈哈"这个名字。',
    '在股市小屋翻到旧报纸，终于知道他是谁。',
    '生意做大，现金却见底——处理老经销商的质疑。',
    '第一次，他没能替你拿主意。',
    '材料集齐，回到最初的小屋，准备最后一次炼金。'
];

/* 每章配一个系统图标，对应它主要发生在哪个场景——地图之前全靠文字，
   一眼看过去很单调，加个图标让每段路一眼能认出"这是在哪儿发生的"。 */
const STORY_MAP_ICONS = ['🏠', '🌱', '🚚', '🚲', '🍵', '🏪', '✨', '💰', '📈', '🔮'];

const STORY_MAP_UNLOCKS = {
    investment: '股市小屋',
    tea: '茶场',
    coin: '钱滚钱商店'
};

function storyMapChoice(index) {
    if (index === 7) {
        if (mainStoryState.flags.strictDealerTerms) return '坚持先款后货';
        if (mainStoryState.flags.dealerGracePeriod) return '给老经销商过渡期';
    }
    if (index === 8) {
        if (mainStoryState.flags.trustedOwnJudgment) return '跟投新公司';
        return '听他的，不投';
    }
    if (index === 9) {
        if (mainStoryState.flags.gracefulFarewell) return '体面地送他走';
        if (mainStoryState.flags.coldFarewell) return '事情办完就是办完';
    }
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

        const marker = storyMapText(stop, 'span', 'storyMapMarker', status === 'future' ? '🔒' : (STORY_MAP_ICONS[index] || '•'));
        marker.setAttribute('aria-hidden', 'true');
        const content = document.createElement('div');
        content.className = 'storyMapStopBody';
        content.style.setProperty('--stopIcon', '"' + (STORY_MAP_ICONS[index] || '') + '"');
        const statusRow = document.createElement('div');
        statusRow.className = 'storyMapStatusRow';
        storyMapText(statusRow, 'span', 'storyMapStatus',
            status === 'done' ? '已完成' : status === 'current' ? '正在进行' : '尚未到达');
        if (status === 'current') {
            const avatar = document.createElement('img');
            avatar.className = 'storyMapMentorAvatar';
            avatar.src = 'assets/ui/mentor-avatar.webp';
            avatar.alt = '';
            avatar.setAttribute('aria-hidden', 'true');
            statusRow.appendChild(avatar);
        }
        content.appendChild(statusRow);
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
        if (status === 'done' && typeof window.hasCheckpointForStage === 'function' && window.hasCheckpointForStage(index)) {
            const rewindBtn = document.createElement('button');
            rewindBtn.type = 'button';
            rewindBtn.className = 'storyMapRewindBtn';
            rewindBtn.dataset.stage = String(index);
            rewindBtn.textContent = '回到这里';
            content.appendChild(rewindBtn);
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
    if (event.target === storyMapPanel) {
        closeStoryMap();
        return;
    }
    const rewindBtn = event.target.closest('.storyMapRewindBtn');
    if (rewindBtn && typeof window.restoreCheckpointForStage === 'function') {
        window.restoreCheckpointForStage(Number(rewindBtn.dataset.stage));
        closeStoryMap();
    }
});
addEventListener('keydown', event => {
    if (event.key !== 'Escape' || storyMapPanel.hidden) return;
    event.preventDefault();
    closeStoryMap();
});
