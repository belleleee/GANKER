'use strict';

/* ================================================================
   主线剧情
   把 农场 → 茶场 → 钱滚钱商店 → 股市 串成一条经营线。
   第一份农场简历承接 plot 序章：从旧宅、农场、茶场到返城，
   这里的主线卡片负责把剧情的精神落到每个经营系统的目标上。
   ================================================================ */

const MAIN_STORY_STAGES = [
    {
        unlocks: null,
        title: '序章 · 从一块地开始',
        lines: [
            { speaker: '旁白', text: '你翻完第三次萝卜地，手心被锄柄磨得发烫。那一刻你忽然想起序章里那句话：往后这个家，不靠祖宗，靠手脚。' },
            { speaker: '旁白', text: '可一个人硬扛，终究扛不出一座农场。能把日子撑下去的人，也要学会把事情交给可靠的人。' },
            { speaker: '你', text: '先把第一份简历看完。如果他真是愿意替家里分担的人，就让他来试试。' }
        ],
        unlockToast: '📖 主线推进：正式开始经营',
        questLabel: '去农场找地主租地（付得起就 all-in），翻地种萝卜（没种子先去商店买），种出来后雇一个农场帮手',
        target: { x: 9.0, z: 0.0 },
        reflection: '记住这块地翻起来的手感——往后不管账本变多大，起点都是它。',
        auto: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true &&
            typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        unlocks: null,
        title: '第一部分 · 代销小摊（1987）',
        lines: [
            { speaker: '旁白', text: '厂里供销科的活儿干了九年，你听说上城区有个校办经销部年年亏钱，正打算对外承包。' },
            { speaker: '旁白', text: '想接这摊子，先得有点本钱，也得让人看见你是真能吃苦做买卖的人。你借了辆三轮车，在学校门口支起摊子：汽水、冰棍、毛巾、文具，什么都卖。' },
            { speaker: '你', text: '先别想太远。眼下就一个目标：攒够 110 个金币，攒够了，就有资格去会一会那位蒋经理。' }
        ],
        unlockToast: '📖 主线推进：小摊的本钱攒够了',
        questLabel: '在商店和农场之间倒腾生意，攒够 110 金币',
        target: { x: 10, z: -10 },
        coinRequirement: 110,
        lockedHint: '110 个金币还没攒够——小买卖就是这样，急不来，一笔一笔算才靠谱。',
        reflection: '110 个金币不算多，但这是你第一次，靠自己的本事把它凑齐的。',
        auto: () => currentCoins() >= 110
    },
    {
        unlocks: 'tea',
        title: '第二部分 · 承包谈判（1987）',
        lines: [
            { speaker: '旁白', text: '竞标那天，蒋经理坐镇多年，资历深、关系广，是这一行谁都绕不开的人物。评委葛局长手里的笔悬着，迟迟没落下。' },
            { speaker: '老陆', text: '别怕，你手上有的是他没有的——你敢吃苦，敢承诺，也懂门路。他有的，只是资历和关系户。' },
            { speaker: '你', text: '我承诺，第一年净利四万，第二年，十万。' },
            { speaker: '旁白', text: '一句话把在场的人都镇住了。合同签下来那天，退休的周老师和范老师主动留下来帮衬——往后这些年，他们会是最信得过的人。' },
            { speaker: '你', text: '茶场也该开出来了。一块地能顾住今天，一片茶场才顾得住明天。' }
        ],
        unlockToast: '📖 主线推进：茶场解锁了',
        questLabel: '去看看院子里那片茶场',
        target: { x: -11.5, z: -9.0 },
        coinRequirement: 250,
        lockedHint: '合同还没谈成——离承诺兑现还差一点，先把手头的钱攒够。',
        reflection: '话说出去了，就得做到——这是你在竞标桌上学到的第一课。'
    },
    {
        unlocks: 'coin',
        title: '第三章 · 广告豪赌',
        lines: [
            { speaker: '旁白', text: '茶场有了收入，账本上第一次出现了真正能调度的钱。可钱放在那里不会长大，只有流动起来，才可能生出新的机会。' },
            { speaker: '旁白', text: '镇上那间钱滚钱商店像一次试胆：它不是正经农活，也不是稳妥茶场，而是一门关于概率、贪心和收手的课。' },
            { speaker: '你', text: '可以去试。但这次要记住，冒险不是赌命，是学会在还能赢的时候停手。' }
        ],
        unlockToast: '📖 主线推进：钱滚钱商店解锁了',
        questLabel: '去钱滚钱商店看看',
        target: { x: -18.0, z: 8.2 },
        coinRequirement: 900,
        lockedHint: '茶场的收入还没攒到能承受一次冒险的地步——先把本业做扎实。',
        reflection: '进那扇门之前再想一遍：赢了别贪，输了别赌气加倍——这才是过关的本事。'
    },
    {
        unlocks: 'investment',
        title: '第四章 · 看懂更大的账',
        lines: [
            { speaker: '旁白', text: '你已经不只是在种地、炒茶、抛硬币了。越来越多的钱开始变成合同、股价、消息和预期。' },
            { speaker: '旁白', text: '市场会给人错觉：上涨时像所有门都打开，下跌时像所有路都堵死。可真正要紧的，是看懂这背后的生意。' },
            { speaker: '你', text: '去股市小屋看看。买之前先读新闻，赚钱之前先学会判断。' }
        ],
        unlockToast: '📖 主线推进：股市小屋解锁了',
        questLabel: '去股市小屋看看',
        target: { x: -12.0, z: 8.5 },
        coinRequirement: 2500,
        lockedHint: '手头的钱还撑不起看盘的资格——股市不是先来后到，是水到渠成。',
        reflection: '账上的数字越来越大，但记账的规矩不能变：先看懂，再动手。'
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
        if (!met && stage.lockedHint) {
            html += '<p class="mainStoryCoinNote">' + stage.lockedHint + '</p>';
        }
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
    if (stage.reflection && typeof window.showThemeReflection === 'function') {
        window.showThemeReflection(stage.reflection);
    }
    closeMainStoryStage(true);
}

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
