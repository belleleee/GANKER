'use strict';

/* ================================================================
   成就系统
   周期性地检查各个系统的已有数据（金币、萝卜、茶叶、主线进度、
   创业笔记、抛硬币小游戏和股市小屋各自的存档），达成条件就解锁。
   不需要在每个操作点手动埋点，新增成就只要在下面加一条 check 即可。
   ================================================================ */

function peekCoinGameSave() {
    try {
        const raw = typeof readJson === 'function' && typeof cabinSaveKey === 'function'
            ? readJson(cabinSaveKey(), null)
            : null;
        const economy = raw && raw.economy;
        return (economy && economy.coinGame) || null;
    } catch (err) {
        return null;
    }
}

function peekInvestmentRoomSave() {
    try {
        const raw = typeof readJson === 'function' && typeof cabinSaveKey === 'function'
            ? readJson(cabinSaveKey(), null)
            : null;
        const economy = raw && raw.economy;
        return (economy && economy.investment) || null;
    } catch (err) {
        return null;
    }
}

const ACHIEVEMENT_CATEGORIES = [
    { id: 'farm', label: '农场', color: '#6fa84f' },
    { id: 'wealth', label: '财富', color: '#c8962c' },
    { id: 'tea', label: '茶场', color: '#3f9a7a' },
    { id: 'story', label: '主线', color: '#9c6bd8' },
    { id: 'coin', label: '钱滚钱', color: '#d87b3f' },
    { id: 'invest', label: '股市', color: '#3f7fd8' },
    { id: 'zong', label: '创业笔记', color: '#b8542f' },
    { id: 'explore', label: '探索小屋', color: '#5b8fa8' }
];

const ACHIEVEMENTS = [
    {
        id: 'first_turnip',
        category: 'farm',
        icon: '🌱',
        title: '新手上路',
        desc: '收获第一颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        id: 'turnip_farmer',
        category: 'farm',
        icon: '🥕',
        title: '萝卜大户',
        desc: '仓库里存下 50 颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 50
    },
    {
        id: 'first_gold',
        category: 'wealth',
        icon: '🪙',
        title: '第一桶金',
        desc: '金币达到 200',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 200
    },
    {
        id: 'small_fortune',
        category: 'wealth',
        icon: '💰',
        title: '小有积蓄',
        desc: '金币达到 1000',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 1000
    },
    {
        id: 'tea_master',
        category: 'tea',
        icon: '🍵',
        title: '茶艺初成',
        desc: '累计采摘 20 片茶叶',
        check: () => typeof teaLeafCount !== 'undefined' && teaLeafCount >= 20
    },
    {
        id: 'story_chapter1',
        category: 'story',
        icon: '📖',
        title: '主线 · 序章',
        desc: '读完第一章占位剧情，解锁茶场',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('tea')
    },
    {
        id: 'story_chapter2',
        category: 'story',
        icon: '📖',
        title: '主线 · 中章',
        desc: '解锁钱滚钱商店',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('coin')
    },
    {
        id: 'story_chapter3',
        category: 'story',
        icon: '📖',
        title: '主线 · 终章',
        desc: '解锁股市小屋，主线全部读完',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('investment')
    },
    {
        id: 'first_employee',
        category: 'coin',
        icon: '🐌',
        title: '雇佣关系',
        desc: '在钱滚钱商店雇到第一个史莱姆助手',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.helperCount) >= 1;
        }
    },
    {
        id: 'first_trade',
        category: 'invest',
        icon: '📈',
        title: '股市新手',
        desc: '在股市小屋买入第一支股票',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && save.holdings && Object.keys(save.holdings).length > 0;
        }
    },
    {
        id: 'zong_book_finished',
        category: 'zong',
        icon: '📔',
        title: '创业笔记 · 合卷',
        desc: '读完《创业笔记》全部章节',
        check: () => typeof zongChapterIndex !== 'undefined' && typeof ZONG_CHAPTERS !== 'undefined' && zongChapterIndex >= ZONG_CHAPTERS.length
    },
    {
        id: 'zong_investor',
        category: 'zong',
        icon: '🤝',
        title: '创业笔记 · 老搭档',
        desc: '在《创业笔记》里投资 3 次',
        check: () => typeof zongStats !== 'undefined' && zongStats.investCount >= 3
    },
    {
        id: 'farm_hire',
        category: 'farm',
        icon: '🧑‍🌾',
        title: '农场雇佣关系',
        desc: '雇到第一个农场帮手',
        check: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true
    },
    {
        id: 'turnip_tycoon',
        category: 'farm',
        icon: '🥬',
        title: '萝卜富翁',
        desc: '仓库里存下 200 颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 200
    },
    {
        id: 'star_relic',
        category: 'farm',
        icon: '⭐',
        title: '意外之喜',
        desc: '收获时拾到一枚星石',
        check: () => typeof cropStorage !== 'undefined' && (cropStorage.starRelic || 0) >= 1
    },
    {
        id: 'coin_bankrupt',
        category: 'coin',
        icon: '📉',
        title: '血本无归',
        desc: '在钱滚钱商店把钱包输到见底',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.wallet) <= 0 && Number(save.lost) > 0;
        }
    },
    {
        id: 'coin_tycoon',
        category: 'coin',
        icon: '🏦',
        title: '钱滚钱大亨',
        desc: '在钱滚钱商店累计赚到 1000 金币',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.earned) >= 1000;
        }
    },
    {
        id: 'coin_full_house',
        category: 'coin',
        icon: '🐌',
        title: '满编团队',
        desc: '雇满 4 个史莱姆助手',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.helperCount) >= 4;
        }
    },
    {
        id: 'invest_profit',
        category: 'invest',
        icon: '🐂',
        title: '股市老手',
        desc: '在股市小屋累计实现盈利 500 金币',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && Number(save.realizedGain) >= 500;
        }
    },
    {
        id: 'invest_loss',
        category: 'invest',
        icon: '🐻',
        title: '割肉离场',
        desc: '在股市小屋累计亏损 300 金币',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && Number(save.realizedLoss) >= 300;
        }
    },
    {
        id: 'explore_fire',
        category: 'explore',
        icon: '🔥',
        title: '炉火可亲',
        desc: '点亮小屋的壁炉',
        check: () => typeof fireLit !== 'undefined' && fireLit === true
    },
    {
        id: 'explore_cat',
        category: 'explore',
        icon: '🐱',
        title: '唤醒猫咪',
        desc: '把小屋里打盹的猫叫醒',
        check: () => typeof catAwake !== 'undefined' && catAwake === true
    },
    {
        id: 'explore_book',
        category: 'explore',
        icon: '📗',
        title: '翻开魔法书',
        desc: '打开桌上的那本魔法书',
        check: () => typeof bookOn !== 'undefined' && bookOn === true
    },
    {
        id: 'explore_chest',
        category: 'explore',
        icon: '🗝️',
        title: '百宝箱',
        desc: '打开楼梯下的储物箱',
        check: () => (typeof chestOpen !== 'undefined' && chestOpen === true) || (typeof storageOpen !== 'undefined' && storageOpen === true)
    },
    {
        id: 'explore_all',
        category: 'explore',
        icon: '🏠',
        title: '小屋通透',
        desc: '同时点亮壁炉、油灯、灯笼，叫醒猫咪，还翻开了魔法书',
        check: () => typeof fireLit !== 'undefined' && fireLit && lampLit && lanternLit && catAwake && bookOn
    }
];

let achievementState = { unlocked: {} };
let achievementPollTimer = 0;

const achievementsPanel = document.getElementById('achievementsPanel');
const achievementsList = document.getElementById('achievementsList');
const achievementsProgress = document.getElementById('achievementsProgress');
const achievementsBadge = document.getElementById('achievementsBadge');
const closeAchievementsBtn = document.getElementById('closeAchievementsBtn');
const achievementsMenuBtn = document.getElementById('achievementsMenuBtn');

function unlockedCount() {
    return Object.keys(achievementState.unlocked).filter(id => achievementState.unlocked[id]).length;
}

function renderAchievementsPanel() {
    if (!achievementsList) return;
    achievementsList.innerHTML = ACHIEVEMENT_CATEGORIES.map(cat => {
        const items = ACHIEVEMENTS.filter(a => a.category === cat.id);
        if (!items.length) return '';
        const cards = items.map(a => {
            const on = !!achievementState.unlocked[a.id];
            return '<div class="achievementCard' + (on ? ' on' : '') + '" style="--accent:' + cat.color + '">' +
                '<div class="achievementIcon">' + (on ? a.icon : '🔒') + '</div>' +
                '<div class="achievementBody"><h3>' + a.title + '</h3><p>' + a.desc + '</p></div>' +
                (on ? '<div class="achievementRibbon">✓</div>' : '') +
                '</div>';
        }).join('');
        return '<section class="achievementGroup">' +
            '<h4 class="achievementGroupTitle" style="--accent:' + cat.color + '">' + cat.label + '</h4>' +
            '<div class="achievementGrid">' + cards + '</div>' +
            '</section>';
    }).join('');
    if (achievementsProgress) {
        const total = ACHIEVEMENTS.length;
        const done = unlockedCount();
        const pct = total ? Math.round(done / total * 100) : 0;
        achievementsProgress.innerHTML = '<span>' + done + ' / ' + total + ' 已达成</span>' +
            '<div class="achievementBar"><div class="achievementBarFill" style="width:' + pct + '%"></div></div>';
    }
}

function refreshAchievementsBadge() {
    if (!achievementsBadge) return;
    const n = unlockedCount();
    achievementsBadge.textContent = n + '/' + ACHIEVEMENTS.length;
    achievementsBadge.hidden = false;
}

function pollAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(a => {
        if (achievementState.unlocked[a.id]) return;
        let hit = false;
        try {
            hit = !!a.check();
        } catch (err) {
            hit = false;
        }
        if (hit) {
            achievementState.unlocked[a.id] = true;
            changed = true;
            if (typeof showHintOverride === 'function') {
                showHintOverride('🏆 达成成就：' + a.title);
            }
            if (typeof SND !== 'undefined') SND.play('chim');
        }
    });
    if (changed) {
        refreshAchievementsBadge();
        if (achievementsPanel && !achievementsPanel.hidden) renderAchievementsPanel();
        if (typeof saveGameState === 'function') saveGameState(false);
    }
}

function updateAchievements(dt) {
    achievementPollTimer -= dt || 0;
    if (achievementPollTimer > 0) return;
    achievementPollTimer = 1.5;
    pollAchievements();
}

function openAchievementsPanel() {
    if (!achievementsPanel) return;
    renderAchievementsPanel();
    achievementsPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeAchievementsPanel() {
    if (!achievementsPanel) return;
    achievementsPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function captureAchievementState() {
    return { unlocked: Object.assign({}, achievementState.unlocked) };
}

function applyAchievementState(raw) {
    const unlocked = {};
    if (raw && raw.unlocked && typeof raw.unlocked === 'object') {
        ACHIEVEMENTS.forEach(a => {
            if (raw.unlocked[a.id]) unlocked[a.id] = true;
        });
    }
    achievementState = { unlocked };
    refreshAchievementsBadge();
}

if (achievementsMenuBtn) achievementsMenuBtn.addEventListener('click', openAchievementsPanel);
if (closeAchievementsBtn) closeAchievementsBtn.addEventListener('click', closeAchievementsPanel);
if (achievementsPanel) {
    achievementsPanel.addEventListener('click', event => {
        if (event.target === achievementsPanel) closeAchievementsPanel();
    });
}
addEventListener('keydown', event => {
    if (!achievementsPanel || achievementsPanel.hidden) return;
    if (event.key === 'Escape') closeAchievementsPanel();
});

refreshAchievementsBadge();

window.updateAchievements = updateAchievements;
window.captureAchievementState = captureAchievementState;
window.applyAchievementState = applyAchievementState;
