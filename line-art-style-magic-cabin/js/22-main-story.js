'use strict';

/* ================================================================
   主线剧情（占位版）
   用一张一张的占位卡片，把 农场 → 茶场 → 钱庄 → 股市 串成一条主线：
   必须按顺序"读完"上一章的占位卡片，才能解锁下一个经营系统。
   正文先留空壳，后续直接替换 MAIN_STORY_STAGES 里的 lines 即可。
   ================================================================ */

const MAIN_STORY_STAGES = [
    {
        unlocks: null,
        title: '序章 · 占位剧情',
        lines: [
            { speaker: '旁白', text: '（占位剧情）主角盘下了院子里那块荒地，打算先翻地种上一茬萝卜，攒点本钱。' },
            { speaker: '你', text: '（占位台词）先把地种起来，等收成好了，再看看能不能雇个帮手打理。' }
        ],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '去农场翻地、种萝卜，攒够收成后雇一个农场帮手',
        target: { x: 9.0, z: 0.0 },
        auto: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true &&
            typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        unlocks: 'tea',
        title: '第一章 · 占位剧情',
        lines: [
            { speaker: '旁白', text: '（占位剧情）这里以后会补上真正的开篇故事——大致是主角决定把院子里那片荒地拾掇成茶场。' },
            { speaker: '你', text: '（占位台词）先把这片地看一看。' }
        ],
        unlockToast: '📖 主线推进：茶场解锁了',
        questLabel: '去看看院子里那片茶场',
        target: { x: -11.5, z: -9.0 },
        coinRequirement: 100
    },
    {
        unlocks: 'coin',
        title: '第二章 · 占位剧情',
        lines: [
            { speaker: '旁白', text: '（占位剧情）茶场慢慢有了起色，镇上有人提起了那家"钱滚钱商店"。' },
            { speaker: '你', text: '（占位台词）去看看到底是怎么回事。' }
        ],
        unlockToast: '📖 主线推进：钱滚钱商店解锁了',
        questLabel: '去钱滚钱商店看看',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 300
    },
    {
        unlocks: 'investment',
        title: '第三章 · 占位剧情',
        lines: [
            { speaker: '旁白', text: '（占位剧情）手里渐渐攒下了一点本钱，是时候去看看股市小屋了。' },
            { speaker: '你', text: '（占位台词）这次要更谨慎一点。' }
        ],
        unlockToast: '📖 主线推进：股市小屋解锁了',
        questLabel: '去股市小屋看看',
        target: { x: 16.5, z: -8.5 },
        coinRequirement: 800
    }
];

let mainStoryState = { stage: 0 };
let mainStoryPendingProceed = null;

const mainStoryPanel = document.getElementById('mainStoryPanel');
const mainStoryTitle = document.getElementById('mainStoryTitle');
const mainStoryBody = document.getElementById('mainStoryBody');
const mainStoryNextBtn = document.getElementById('mainStoryNextBtn');

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
    }
    mainStoryBody.innerHTML = html;
    if (mainStoryNextBtn) {
        mainStoryNextBtn.disabled = !met;
        mainStoryNextBtn.textContent = met ? '继续' : '金币还不够';
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

function onMainStoryNext() {
    const idx = mainStoryState.stage;
    const stage = MAIN_STORY_STAGES[idx];
    if (!stage) {
        closeMainStoryStage(false);
        return;
    }
    if (!stageCoinsMet(stage)) {
        if (typeof showHintOverride === 'function') {
            showHintOverride('金币还不够，需要攒到 ' + stage.coinRequirement + ' 金币（当前 ' + currentCoins() + '）');
        }
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    mainStoryState.stage = idx + 1;
    if (typeof showHintOverride === 'function') showHintOverride(stage.unlockToast);
    if (typeof SND !== 'undefined') SND.play('chim');
    closeMainStoryStage(true);
}

/**
 * 想进入某个受主线门槛控制的系统时调用：
 * - 已解锁：直接执行 proceed()
 * - 还没轮到它：提示先完成前面的章节
 * - 正好是下一章：弹出占位卡片，读完就解锁并执行 proceed()
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
 * 靠这个每帧轮询一次，达成条件就自动弹出占位卡片。
 */
function pollAutoStageAdvance() {
    const stage = MAIN_STORY_STAGES[mainStoryState.stage];
    if (!stage || typeof stage.auto !== 'function') return;
    if (mainStoryPanel && !mainStoryPanel.hidden) return;
    if (mainStoryAutoCooldown > 0) return;
    let met = false;
    try {
        met = !!stage.auto();
    } catch (err) {
        met = false;
    }
    if (met) openMainStoryStage(mainStoryState.stage, null);
}

function captureMainStoryState() {
    return { stage: mainStoryState.stage };
}

function applyMainStoryState(raw) {
    const stage = Math.max(0, Math.min(MAIN_STORY_STAGES.length, Math.trunc(Number(raw && raw.stage) || 0)));
    mainStoryState = { stage };
}

/* ================================================================
   任务目标 + 方向指引
   屏幕上常驻一个目标提示条，箭头始终指向当前主线目标的方向。
   ================================================================ */

const questBanner = document.getElementById('questBanner');
const questArrow = document.getElementById('questArrow');
const questText = document.getElementById('questText');
const questDistance = document.getElementById('questDistance');

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
    if (!objective || typeof player === 'undefined' || (mainStoryPanel && !mainStoryPanel.hidden)) {
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
