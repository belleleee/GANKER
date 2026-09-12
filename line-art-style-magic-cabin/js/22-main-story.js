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
        title: '序章 · 白手起家',
        lines: [
            { speaker: '旁白', text: '院子里那块荒地是你现在拥有的全部家当。没有本钱，没有帮手，只有一把锄头和一身力气。' },
            { speaker: '旁白', text: '这世上很多路，年轻时都堵死过一回——能靠自己双手挣出来的，才轮得到你走。' },
            { speaker: '你', text: '先把地种起来。收成好了，再看看能不能雇个帮手打理。' }
        ],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '去农场找地主租地（付得起就 all-in），翻地种萝卜（没种子先去商店买），种出来后雇一个农场帮手',
        target: { x: 9.0, z: 0.0 },
        auto: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true &&
            typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        unlocks: 'tea',
        title: '第一章 · 校办经销部',
        lines: [
            { speaker: '旁白', text: '手里攒下第一笔本钱，光靠一块地终究撑不起一份家业。院子角落那片荒着的茶场，也该拾掇起来了。' },
            { speaker: '旁白', text: '别人笑你一把年纪才想着折腾，可你等不起——机会从不会等一个犹豫的人。' },
            { speaker: '你', text: '一块地能顾住嘴，两条路才能顾住将来。去把茶场开出来。' }
        ],
        unlockToast: '📖 主线推进：茶场解锁了',
        questLabel: '去看看院子里那片茶场',
        target: { x: -11.5, z: -9.0 },
        coinRequirement: 250
    },
    {
        unlocks: 'coin',
        title: '第二章 · 广告豪赌',
        lines: [
            { speaker: '旁白', text: '茶场慢慢有了起色，镇上有人提起了那家"钱滚钱商店"——听说进去的人，有的一夜翻了身，有的血本无归。' },
            { speaker: '旁白', text: '这一注，是把全部家底押上去的一注。签下去，可能一夜翻身；打了水漂，可能就此关门。' },
            { speaker: '你', text: '……去看看。但记住，赌的是本事，不是命。见好该收手的时候，就得收。' }
        ],
        unlockToast: '📖 主线推进：钱滚钱商店解锁了',
        questLabel: '去钱滚钱商店看看',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 900
    },
    {
        unlocks: 'investment',
        title: '第三章 · 合资与股权',
        lines: [
            { speaker: '旁白', text: '手里渐渐攒下了不小的一笔本钱，镇上的股市小屋也终于对你敞开了门——这是比雇人经营更远一层的生意：把钱交给一纸合同去打理。' },
            { speaker: '旁白', text: '钱可以一起出，厂可以一起建，但你亲手挣出来的这份家业，一个字一个字都得看仔细，不能拱手让人。' },
            { speaker: '你', text: '这次要更谨慎一点。合同上的每一条，都得自己读懂了才能签。' }
        ],
        unlockToast: '📖 主线推进：股市小屋解锁了',
        questLabel: '去股市小屋看看',
        target: { x: 16.5, z: -8.5 },
        coinRequirement: 2500
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
