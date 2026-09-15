'use strict';

window.APP_SHELL_BLOCK_GAME = false;

const APP_SAVE_SCHEMA = 1;
const APP_CONTENT_ID = 'magic-cabin-local-2026';
const APP_USERS_KEY = 'magicCabin.users.v1';
const APP_SESSION_KEY = 'magicCabin.session.v1';
const APP_STORE_RETURN_KEY = 'magicCabin.returnFromStore.v1';
const APP_CAFE_REVENUE_KEY = 'magicCabin.cafeRevenue.v1';
const APP_JOURNAL_RELIC_KEY = 'magicCabin.journeyRelicReward.v1';
const APP_JOURNEY_RELIC_OBTAINED_KEY = 'journeyRelicObtained';
const APP_GUEST_ID = 'guest';

function wipeAllMagicCabinStorageIfRequested() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wipe') !== '1' && params.get('resetAllSaves') !== '1') return false;
    const removed = [];
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (key.indexOf('magicCabin.') === 0 || key === APP_JOURNEY_RELIC_OBTAINED_KEY)) {
                removed.push(key);
                localStorage.removeItem(key);
            }
        }
        sessionStorage.clear();
    } catch (err) {
        console.warn('Failed to wipe MagicCabin storage', err);
    }
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
    }
    window.__MAGIC_CABIN_WIPED__ = removed;
    return true;
}

const MAGIC_CABIN_STORAGE_WIPED = wipeAllMagicCabinStorageIfRequested();

const landingScreen = document.getElementById('landingScreen');
const membersModal = document.getElementById('membersModal');
const memberListView = document.getElementById('memberListView');
const memberDetailView = document.getElementById('memberDetailView');
const memberDetailName = document.getElementById('memberDetailName');
const memberDetailRole = document.getElementById('memberDetailRole');
const memberDetailText = document.getElementById('memberDetailText');
const memberDetailWork = document.getElementById('memberDetailWork');
const memberDetailTags = document.getElementById('memberDetailTags');
const memberPortrait = document.getElementById('memberPortrait');
const memberPortraitImg = document.getElementById('memberPortraitImg');
const authMsg = document.getElementById('authMsg');
const saveStatusEl = document.getElementById('saveStatus');
const coinHud = document.getElementById('coinHud');
const storageHud = document.getElementById('storageHud');
const backpackHud = document.getElementById('backpackHud');
const statsPanel = document.getElementById('statsPanel');
const statsPanelToggle = document.getElementById('statsPanelToggle');
const statsPanelSummary = document.getElementById('statsPanelSummary');
const luckStat = document.getElementById('luckStat');
const luckStatBar = document.getElementById('luckStatBar');
const reputationStat = document.getElementById('reputationStat');
const reputationStatBar = document.getElementById('reputationStatBar');
const goodwillStat = document.getElementById('goodwillStat');
const goodwillStatBar = document.getElementById('goodwillStatBar');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');

let currentCabinUser = loadSessionUser();
let autosaveTimer = 0;
const STARTING_CABIN_COINS = 100;
let cabinCoins = STARTING_CABIN_COINS;
let cropStorage = { turnip: 0, cabbage: 0, rice: 0, potato: 0, starRelic: 0 };
let cabinBackpack = { turnipSeed: 0, cabbageSeed: 0, riceSeed: 0, potatoSeed: 0 };
let cafeTotalRevenue = 0;
let cabinLuck = 50;
let statsPanelCollapsed = true;

const MEMBER_PROFILES = {
    zhou: {
        name: '周维健',
        role: '网站编辑',
        intro: '来自山东的普通计科学生，爱玩游戏，正在努力学习 HTML、CSS 和 JS。负责把项目内容整理成可以被玩家看懂、能顺利进入体验的网页结构。',
        work: '展示页面、网站文字整理、入口内容编辑',
        tags: '山东、计科、游戏、前端学习',
        image: 'menber/周.jpg'
    },
    huang: {
        name: '黄梓严',
        role: '文本、日志记录',
        intro: 'MOBA 和自走棋类爱好者，平时爱打网球和羽毛球。项目中负责文本资料与过程记录，让作品介绍和开发痕迹更加完整。',
        work: '文本撰写、日志记录、资料归档',
        tags: 'MOBA、自走棋、网球、羽毛球',
        image: 'menber/黄.jpg'
    },
    kang: {
        name: '康羿盟',
        role: '程序员',
        intro: 'Deltarune 厨兼音游爱好者，有一年编程经验，正在努力生存中。主要负责把交互想法落到代码里，让场景功能可以真实运行。',
        work: '程序开发、交互实现、功能调试',
        tags: 'Deltarune、音游、编程、调试',
        image: 'menber/康.jpg'
    },
    he: {
        name: '何恬',
        role: '程序员',
        intro: '赛博泥瓦匠，闲暇时间听歌撸猫，人生目标是猫猫自由和 Bug free。项目中负责程序实现与问题修补，把看起来松散的系统砌成能玩的作品。',
        work: '程序开发、问题修复、体验完善',
        tags: '听歌、猫猫自由、Bug free、赛博泥瓦匠',
        image: 'menber/何.jpg'
    },
    jia: {
        name: '贾翌宸',
        role: '文本、CIO',
        intro: 'FPS 玩家，也喜欢看动画片。项目中负责文本相关内容和信息整理，帮助团队把作品说明、成员信息和展示内容组织起来。',
        work: '文本整理、信息管理、展示内容协作',
        tags: 'FPS、动画片、文本、CIO',
        image: 'menber/贾.jpg'
    },
    ren: {
        name: '任嘉佑',
        role: '队长',
        intro: '作为团队队长，负责统筹所有工作，安排所有人的任务，协调开发节奏并推动项目按计划完成。',
        work: '团队统筹、任务分配、进度协调、项目推进',
        tags: '队长、统筹、任务安排、团队协作',
        image: 'menber/任.jpg'
    }
};

function cabinSaveKey() {
    return 'magicCabin.save.' + (currentCabinUser ? currentCabinUser.id : APP_GUEST_ID) + '.v1';
}

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (err) {
        return false;
    }
}

function hashText(text) {
    let h = 5381;
    for (let i = 0; i < text.length; i++) h = ((h << 5) + h) ^ text.charCodeAt(i);
    return (h >>> 0).toString(36);
}

function boundedText(value, maxLen) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLen);
}

function finiteNumber(value, fallback, limit) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(-limit, Math.min(limit, n));
}

function bool(value) {
    return value === true;
}

function renderCoins(bump) {
    if (!coinHud) return;
    coinHud.textContent = '金币 ' + cabinCoins;
    if (!bump) return;
    coinHud.classList.remove('bump');
    void coinHud.offsetWidth;
    coinHud.classList.add('bump');
    setTimeout(() => coinHud.classList.remove('bump'), 220);
}

function clampStat(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function readCabinReputation() {
    const investment = readSavedInvestmentState();
    if (!investment) return 60;
    return clampStat(investment.reputation, 60);
}

function readCabinGoodwillPct() {
    if (typeof window.getCharityGoodwill !== 'function') return 0;
    return clampStat(window.getCharityGoodwill() * 100, 0);
}

function setStatsPanelCollapsed(collapsed) {
    statsPanelCollapsed = !!collapsed;
    if (!statsPanel || !statsPanelToggle) return;
    statsPanel.classList.toggle('collapsed', statsPanelCollapsed);
    statsPanelToggle.setAttribute('aria-expanded', statsPanelCollapsed ? 'false' : 'true');
}

function renderStatsPanel() {
    if (!statsPanel) return;
    const luck = clampStat(cabinLuck, 50);
    const reputation = readCabinReputation();
    const goodwill = readCabinGoodwillPct();
    cabinLuck = luck;
    if (statsPanelSummary) {
        statsPanelSummary.textContent = '幸运 ' + luck + ' · 声誉 ' + reputation + ' · 口碑 ' + goodwill + '%';
    }
    if (luckStat) luckStat.textContent = String(luck);
    if (reputationStat) reputationStat.textContent = String(reputation);
    if (goodwillStat) goodwillStat.textContent = goodwill + '%';
    if (luckStatBar) luckStatBar.style.width = luck + '%';
    if (reputationStatBar) reputationStatBar.style.width = reputation + '%';
    if (goodwillStatBar) goodwillStatBar.style.width = goodwill + '%';
}

function addCabinLuck(delta, reason) {
    const change = Math.trunc(Number(delta) || 0);
    if (!change) return cabinLuck;
    const before = cabinLuck;
    cabinLuck = clampStat(cabinLuck + change, 50);
    renderStatsPanel();
    if (cabinLuck !== before && reason && typeof showHintOverride === 'function') {
        showHintOverride(String(reason) + ' · 幸运 ' + (change > 0 ? '+' : '') + change);
    }
    if (typeof saveGameState === 'function') saveGameState(false);
    return cabinLuck;
}

let moneyFeedbackLayer = null;
let moneyFeedbackFlash = null;
let moneyFeedbackStats = { gain: 0, loss: 0, lastBigGain: 0, lastBigLoss: 0 };

function ensureMoneyFeedbackDom() {
    if (!moneyFeedbackLayer) {
        moneyFeedbackLayer = document.createElement('div');
        moneyFeedbackLayer.className = 'moneyFeedbackLayer';
        document.body.appendChild(moneyFeedbackLayer);
    }
    if (!moneyFeedbackFlash) {
        moneyFeedbackFlash = document.createElement('div');
        moneyFeedbackFlash.className = 'moneyImpactFlash';
        document.body.appendChild(moneyFeedbackFlash);
    }
}

function cabinMoneyFeedback(amount, reason) {
    const value = Math.trunc(Number(amount) || 0);
    if (!value) return;
    ensureMoneyFeedbackDom();
    const isGain = value > 0;
    const abs = Math.abs(value);
    const major = abs >= 100;
    const label = reason && reason !== false ? String(reason).replace(/<[^>]*>/g, '') : (isGain ? '收入' : '支出');
    const rect = coinHud ? coinHud.getBoundingClientRect() : null;
    const x = rect ? rect.left + rect.width / 2 : innerWidth - 80;
    const y = rect ? rect.bottom + 10 : 76;
    const node = document.createElement('div');
    node.className = 'moneyFloat ' + (isGain ? 'gain' : 'loss') + (major ? ' major' : '');
    node.style.setProperty('--x', x + 'px');
    node.style.setProperty('--y', y + 'px');
    node.innerHTML = (isGain ? '+' : '-') + abs + '<small>' + label + '</small>';
    moneyFeedbackLayer.appendChild(node);
    setTimeout(() => node.remove(), 1100);

    moneyFeedbackFlash.className = 'moneyImpactFlash ' + (isGain ? 'gain' : 'loss');
    moneyFeedbackFlash.style.animation = 'none';
    void moneyFeedbackFlash.offsetWidth;
    moneyFeedbackFlash.style.animation = '';

    coinHud?.classList.remove('moneyGain', 'moneyLoss');
    coinHud?.classList.add(isGain ? 'moneyGain' : 'moneyLoss');
    setTimeout(() => coinHud?.classList.remove('moneyGain', 'moneyLoss'), 650);

    if (typeof slime !== 'undefined') {
        if (isGain) {
            slime.squashV += major ? 1.15 : .55;
            slime.wobV += major ? 1.65 : .8;
        } else {
            slime.squashV -= major ? 1.35 : .7;
            slime.wobV += major ? 1.9 : 1.0;
        }
    }
    if (!isGain) {
        document.body.classList.remove('moneyLossShake');
        void document.body.offsetWidth;
        document.body.classList.add('moneyLossShake');
        setTimeout(() => document.body.classList.remove('moneyLossShake'), 380);
    }
    if (typeof SND !== 'undefined') SND.play(isGain ? 'chim' : 'toggle');

    moneyFeedbackStats[isGain ? 'gain' : 'loss'] += abs;
    if (major && reason !== false) {
        const now = performance.now();
        if (isGain && now - moneyFeedbackStats.lastBigGain > 5000) {
            moneyFeedbackStats.lastBigGain = now;
            showHintOverride('这笔收入很关键：+' + abs + ' 金币 · 钱正在变成下一步的底气');
        } else if (!isGain && now - moneyFeedbackStats.lastBigLoss > 5000) {
            moneyFeedbackStats.lastBigLoss = now;
            showHintOverride('这笔支出有点疼：-' + abs + ' 金币 · 记到账本里，下一次判断要更稳');
        }
    }
}

window.cabinMoneyFeedback = cabinMoneyFeedback;

window.getCabinCoins = function getCabinCoins() {
    return cabinCoins;
};

function addCabinCoins(amount, reason) {
    const gain = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!gain) return;
    cabinCoins = Math.min(999999, cabinCoins + gain);
    renderCoins(true);
    if (typeof window.renderCashFlowPanel === 'function') window.renderCashFlowPanel();
    cabinMoneyFeedback(gain, reason);
    if (typeof window.noteDailyMoney === 'function') window.noteDailyMoney(gain, reason);
    if (typeof saveGameState === 'function') saveGameState(false);
    if (reason === false) return;
    showHintOverride((reason || '获得金币') + ' +' + gain + ' · 当前金币 ' + cabinCoins);
}

window.addCabinCoins = addCabinCoins;

function spendCabinCoins(amount, reason) {
    const cost = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!cost) return true;
    if (cabinCoins < cost) {
        showHintOverride('金币不足：需要 ' + cost + '，当前 ' + cabinCoins);
        return false;
    }
    cabinCoins -= cost;
    renderCoins(true);
    if (typeof window.renderCashFlowPanel === 'function') window.renderCashFlowPanel();
    cabinMoneyFeedback(-cost, reason || '花费金币');
    if (typeof window.noteDailyMoney === 'function') window.noteDailyMoney(-cost, reason || '花费金币');
    if (typeof saveGameState === 'function') saveGameState(false);
    if (reason) showHintOverride(reason + ' -' + cost + ' · 当前金币 ' + cabinCoins);
    return true;
}

window.spendCabinCoins = spendCabinCoins;
window.getCabinLuck = function getCabinLuck() {
    return cabinLuck;
};
window.addCabinLuck = addCabinLuck;
window.renderStatsPanel = renderStatsPanel;

const CROP_STORAGE_KEYS = ['turnip', 'cabbage', 'rice', 'potato'];

function renderStorage(bump) {
    if (!storageHud) return;
    const breakdown = CROP_STORAGE_KEYS.map(key => {
        const crop = typeof CROP_TYPES !== 'undefined' && CROP_TYPES[key] ? CROP_TYPES[key] : null;
        return (crop ? crop.icon : key) + (cropStorage[key] || 0);
    }).join(' ');
    storageHud.textContent =
        '仓库 ' + breakdown + ' · 信物 ' + cropStorage.starRelic;
    if (!bump) return;
    storageHud.classList.remove('bump');
    void storageHud.offsetWidth;
    storageHud.classList.add('bump');
    setTimeout(() => storageHud.classList.remove('bump'), 220);
}

function addCropToStorage(cropName, amount) {
    const gain = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!gain || CROP_STORAGE_KEYS.indexOf(cropName) < 0) return;
    cropStorage[cropName] = Math.min(999999, (cropStorage[cropName] || 0) + gain);
    renderStorage(true);
}

window.addCropToStorage = addCropToStorage;

function addRelicToStorage(relicName, amount) {
    const gain = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!gain || relicName !== 'starRelic') return false;
    const before = cropStorage.starRelic || 0;
    cropStorage.starRelic = Math.min(1, before + gain);
    renderStorage(cropStorage.starRelic !== before);
    return cropStorage.starRelic !== before;
}

window.addRelicToStorage = addRelicToStorage;

const BACKPACK_SEED_KEYS = ['turnipSeed', 'cabbageSeed', 'riceSeed', 'potatoSeed'];
const SEED_LABELS = { turnipSeed: '萝卜种子', cabbageSeed: '白菜种子', riceSeed: '稻种', potatoSeed: '土豆种子' };

function renderBackpack(bump) {
    if (!backpackHud) return;
    const breakdown = CROP_STORAGE_KEYS.map(key => {
        const crop = typeof CROP_TYPES !== 'undefined' && CROP_TYPES[key] ? CROP_TYPES[key] : null;
        if (!crop) return '';
        return crop.icon + (cabinBackpack[crop.seedItem] || 0);
    }).filter(Boolean).join(' ');
    backpackHud.textContent = '种子 ' + breakdown;
    if (!bump) return;
    backpackHud.classList.remove('bump');
    void backpackHud.offsetWidth;
    backpackHud.classList.add('bump');
    setTimeout(() => backpackHud.classList.remove('bump'), 220);
}

function addBackpackItem(itemName, amount) {
    const gain = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!gain || BACKPACK_SEED_KEYS.indexOf(itemName) < 0) return;
    cabinBackpack[itemName] = Math.min(999999, (cabinBackpack[itemName] || 0) + gain);
    renderBackpack(true);
}

function useBackpackItem(itemName, amount, silent) {
    const cost = Math.max(0, Math.trunc(Number(amount) || 0));
    if (!cost || BACKPACK_SEED_KEYS.indexOf(itemName) < 0) return true;
    if ((cabinBackpack[itemName] || 0) < cost) {
        if (!silent) showHintOverride('背包里没有' + (SEED_LABELS[itemName] || '种子') + '了，去商店开箱后按 <b>B</b> 购买');
        return false;
    }
    cabinBackpack[itemName] -= cost;
    renderBackpack(true);
    return true;
}

function getBackpackItemCount(itemName) {
    if (BACKPACK_SEED_KEYS.indexOf(itemName) < 0) return 0;
    return cabinBackpack[itemName] || 0;
}

function buySeed(cropId, amount) {
    const crop = typeof CROP_TYPES !== 'undefined' ? CROP_TYPES[cropId] : null;
    if (!crop) return false;
    const count = Math.max(1, Math.trunc(Number(amount) || 1));
    const cost = crop.seedPrice * count;
    if (!spendCabinCoins(cost, null)) return false;
    addBackpackItem(crop.seedItem, count);
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('seedBuy', { cropId, amount: count });
    }
    showHintOverride('购入' + crop.name + '种子 +' + count + ' · 花费 ' + cost + ' 金币 · 背包 ' + cabinBackpack[crop.seedItem]);
    return true;
}

window.addBackpackItem = addBackpackItem;
window.useBackpackItem = useBackpackItem;
window.getBackpackItemCount = getBackpackItemCount;
window.buySeed = buySeed;

function loadUsers() {
    const users = readJson(APP_USERS_KEY, []);
    return Array.isArray(users) ? users : [];
}

function saveUsers(users) {
    return writeJson(APP_USERS_KEY, users);
}

function loadSessionUser() {
    const session = readJson(APP_SESSION_KEY, null);
    if (!session || typeof session.id !== 'string') return null;
    return loadUsers().find(u => u.id === session.id) || null;
}

function setCurrentUser(user, loadAfterSwitch) {
    currentCabinUser = user;
    if (user) writeJson(APP_SESSION_KEY, { id: user.id });
    updateAuthMessage(user ? '已登录：' + user.name + '，存档会绑定到这个账号。' : '未登录也可以游客进入，登录后会使用独立存档。');
    updateSaveStatus();
    if (loadAfterSwitch) {
        const loaded = autoLoadGameState(false);
        if (!loaded && typeof placePlayerAtAlchemyIntroStart === 'function') {
            placePlayerAtAlchemyIntroStart(true);
        }
    }
}

function updateAuthMessage(text) {
    if (!authMsg) return;
    authMsg.textContent = text;
}

function switchAuth(mode) {
    if (!loginForm || !registerForm || !showLoginBtn || !showRegisterBtn) return;
    const login = mode === 'login';
    loginForm.classList.toggle('hidden', !login);
    registerForm.classList.toggle('hidden', login);
    showLoginBtn.classList.toggle('on', login);
    showRegisterBtn.classList.toggle('on', !login);
}

function registerUser() {
    const nameInput = document.getElementById('registerName');
    const idInput = document.getElementById('registerId');
    const passInput = document.getElementById('registerPass');
    if (!nameInput || !idInput || !passInput) return;
    const name = boundedText(nameInput.value, 18);
    const memberId = boundedText(idInput.value, 18);
    const password = passInput.value;
    if (name.length < 2 || password.length < 4) {
        updateAuthMessage('用户名至少 2 位，密码至少 4 位。');
        return;
    }
    const users = loadUsers();
    if (users.some(u => u.name === name)) {
        updateAuthMessage('这个用户名已经注册过了。');
        return;
    }
    const user = {
        id: 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        name,
        memberId,
        pass: hashText(name + ':' + password),
        createdAt: new Date().toISOString()
    };
    users.push(user);
    if (!saveUsers(users)) {
        updateAuthMessage('浏览器拒绝写入本地数据，注册失败。');
        return;
    }
    setCurrentUser(user, false);
    switchAuth('login');
    updateAuthMessage('注册成功：' + user.name + '，可以进入游戏了。');
}

function loginUser() {
    const nameInput = document.getElementById('loginName');
    const passInput = document.getElementById('loginPass');
    if (!nameInput || !passInput) return;
    const name = boundedText(nameInput.value, 18);
    const password = passInput.value;
    const user = loadUsers().find(u => u.name === name);
    if (!user || user.pass !== hashText(name + ':' + password)) {
        updateAuthMessage('用户名或密码不对。');
        return;
    }
    setCurrentUser(user, true);
}

function openMembers() {
    if (!membersModal) {
        window.location.href = 'index.html#team';
        return;
    }
    showMemberList();
    membersModal.hidden = false;
    const closeBtn = document.getElementById('closeMembersBtn');
    if (closeBtn) closeBtn.focus();
}

function closeMembers() {
    if (!membersModal) return;
    membersModal.hidden = true;
    showMemberList();
}

function showMemberList() {
    if (!memberListView || !memberDetailView) return;
    memberListView.hidden = false;
    memberDetailView.hidden = true;
}

function showMemberDetail(key) {
    const member = MEMBER_PROFILES[key];
    if (!member || !memberDetailName || !memberDetailRole || !memberDetailText || !memberDetailWork || !memberDetailTags || !memberPortrait || !memberPortraitImg || !memberListView || !memberDetailView) return;
    memberDetailName.textContent = member.name;
    memberDetailRole.textContent = member.role;
    memberDetailText.textContent = member.intro;
    memberDetailWork.textContent = member.work;
    memberDetailTags.textContent = member.tags;
    memberPortrait.dataset.initial = member.name.slice(0, 1);
    memberPortrait.classList.remove('fallback');
    memberPortraitImg.alt = member.name + '头像';
    memberPortraitImg.src = member.image;
    memberPortraitImg.onerror = () => memberPortrait.classList.add('fallback');
    memberListView.hidden = true;
    memberDetailView.hidden = false;
    document.getElementById('backToMembersBtn').focus();
}

function enterGame(loadFirst) {
    if (loadFirst) loadGameState(false);
    if (landingScreen) landingScreen.classList.add('hidden');
    window.APP_SHELL_BLOCK_GAME = false;
    updateSaveStatus();
    SND.play('chim');
}

function prepareStoreReturn() {
    writeJson(APP_STORE_RETURN_KEY, captureSaveState());
    saveGameState(false);
}

window.prepareStoreReturn = prepareStoreReturn;

function prepareJournalReturn() {
    saveGameState(false);
}

window.prepareJournalReturn = prepareJournalReturn;

function claimCafeRevenue() {
    const revenue = readJson(APP_CAFE_REVENUE_KEY, null);
    const amount = revenue && typeof revenue === 'object'
        ? Math.max(0, Math.trunc(Number(revenue.amount) || 0))
        : 0;
    if (!amount) return 0;
    try {
        localStorage.removeItem(APP_CAFE_REVENUE_KEY);
    } catch (err) { }
    cafeTotalRevenue = Math.min(999999, cafeTotalRevenue + amount);
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('enterCafe');
    }
    addCabinCoins(amount, '咖啡馆营业收入');
    saveGameState(false);
    return amount;
}

window.getCafeTotalRevenue = function () { return cafeTotalRevenue; };

function claimJournalRelic() {
    const reward = readJson(APP_JOURNAL_RELIC_KEY, null);
    const hasPendingReward = reward && typeof reward === 'object' && reward.starRelic;
    const hasLegacyReward =
        localStorage.getItem(APP_JOURNEY_RELIC_OBTAINED_KEY) === '1' &&
        !(cropStorage.starRelic || 0);
    const hasReward = hasPendingReward || hasLegacyReward;
    if (!hasReward) return false;
    try {
        localStorage.removeItem(APP_JOURNAL_RELIC_KEY);
    } catch (err) { }
    const added = addRelicToStorage('starRelic', 1);
    saveGameState(false);
    return added;
}

function readCoinGameReturnState() {
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save || typeof save !== 'object') return null;
    const economy = save.economy || {};
    const coins = Number(economy.coins);
    const coinGame = economy.coinGame || save.coinGame || null;
    if (!Number.isFinite(coins) && (!coinGame || typeof coinGame !== 'object')) return null;
    return {
        coins: Number.isFinite(coins)
            ? Math.max(0, Math.min(999999, Math.trunc(coins)))
            : null,
        coinGame: coinGame && typeof coinGame === 'object' ? coinGame : null
    };
}

function applyCoinGameReturnState(returnState) {
    if (!returnState) return false;
    if (Number.isFinite(returnState.coins)) {
        cabinCoins = returnState.coins;
        renderCoins(true);
    }
    return true;
}

function resumeFromStoreIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'store') return false;
    const coinGameReturn = readCoinGameReturnState();
    const latestSave = validateSave(readJson(cabinSaveKey(), null));
    const latestMarketEvents = latestSave && latestSave.pendingMarketEvents;
    const snapshot = validateSave(readJson(APP_STORE_RETURN_KEY, null));
    if (snapshot) applySaveState(snapshot);
    if (typeof applyMainStoryMarketEvents === 'function') applyMainStoryMarketEvents(latestMarketEvents);
    const restoredCoinGame = applyCoinGameReturnState(coinGameReturn);
    try {
        localStorage.removeItem(APP_STORE_RETURN_KEY);
    } catch (err) { }
    if (landingScreen) landingScreen.classList.add('hidden');
    window.APP_SHELL_BLOCK_GAME = false;
    const cafeRevenue = claimCafeRevenue();
    if (restoredCoinGame && !cafeRevenue) saveGameState(false);
    updateSaveStatus();
    showHintOverride(
        (snapshot ? '已回到进入商店前的位置' : '已返回小屋') +
        (restoredCoinGame ? ' · 金币已同步' : '') +
        (cafeRevenue ? ' · 咖啡馆收入 +' + cafeRevenue + ' 金币已入小金库' : '')
    );
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
    }
    return true;
}

function resumeFromJournalIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') !== 'journal') return false;
    loadGameState(false);
    if (landingScreen) landingScreen.classList.add('hidden');
    window.APP_SHELL_BLOCK_GAME = false;
    const relicAdded = claimJournalRelic();
    updateSaveStatus();
    showHintOverride(relicAdded ? '星辉信物已收入仓库' : '已返回小屋');
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
    }
    return true;
}

function loadRequestedSaveIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('load') !== '1') return false;
    loadGameState(false);
    window.APP_SHELL_BLOCK_GAME = false;
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
    }
    return true;
}

function captureHinges() {
    return {
        door: !!doorGroup.userData.spring.open,
        winFL: !!winFL.userData.spring.open,
        winFR: !!winFR.userData.spring.open,
        winL: !!winL.userData.spring.open,
        winR: !!winR.userData.spring.open,
        winB: !!winB.userData.spring.open,
        winG: !!winG.userData.spring.open
    };
}

function applyHingeState(group, open) {
    if (!group || !group.userData || !group.userData.spring) return;
    const s = group.userData.spring;
    s.open = bool(open);
    s.cur = s.open ? 1 : 0;
    s.vel = 0;
    group.rotation.y = group.userData.base + group.userData.delta * s.cur;
}

function readSavedCoinGameState() {
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save || typeof save !== 'object') return null;
    const economy = save.economy || {};
    const coinGame = economy.coinGame || save.coinGame || null;
    return coinGame && typeof coinGame === 'object' ? coinGame : null;
}

function readSavedInvestmentState() {
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save || typeof save !== 'object') return null;
    const economy = save.economy || {};
    const investment = economy.investment || save.investment || null;
    return investment && typeof investment === 'object' ? investment : null;
}

function captureSaveState() {
    const savedCoinGame = readSavedCoinGameState();
    const syncedCoinGame = savedCoinGame
        ? Object.assign({}, savedCoinGame, { wallet: cabinCoins })
        : null;
    const savedInvestment = readSavedInvestmentState();

    return {
        schema: APP_SAVE_SCHEMA,
        content: APP_CONTENT_ID,
        savedAt: new Date().toISOString(),
        user: currentCabinUser ? { id: currentCabinUser.id, name: currentCabinUser.name } : null,
        player: {
            position: [player.pos.x, player.pos.y, player.pos.z],
            yaw: player.yaw,
            camYaw,
            camPitch,
            viewMode,
            viewDist,
            fixYaw,
            fixPitch,
            fixDist
        },
        world: {
            fullHouse,
            fireLit,
            lampLit,
            lanternLit,
            orbOn,
            corkOut,
            bookOn,
            catAwake,
            cartOut,
            kotatsuOn,
            storageOpen,
            wateringCanFilled:
                typeof window.isWateringCanFilled === 'function'
                    ? window.isWateringCanFilled()
                    : false,
            hinges: captureHinges()
        },
        weather: {
            gameSec,
            timeScale,
            slider: parseFloat(speedSlider.value),
            type: wx.type,
            random: wx.random
        },
        stats: {
            luck: cabinLuck,
            panelCollapsed: statsPanelCollapsed
        },
        economy: {
            coins: cabinCoins,
            storage: {
                turnip: cropStorage.turnip,
                cabbage: cropStorage.cabbage || 0,
                rice: cropStorage.rice || 0,
                potato: cropStorage.potato || 0,
                starRelic: cropStorage.starRelic || 0
            },
            backpack: {
                turnipSeed: cabinBackpack.turnipSeed,
                cabbageSeed: cabinBackpack.cabbageSeed || 0,
                riceSeed: cabinBackpack.riceSeed || 0,
                potatoSeed: cabinBackpack.potatoSeed || 0
            },
            coinGame: syncedCoinGame,
            investment: savedInvestment,
            cashFlow: typeof captureCashFlowState === 'function' ? captureCashFlowState() : null
        },
        ui: {
            sfxEnabled: SND.isEnabled(),
            sfxVolume: SND.getVolume(),
            signText,
            noteTexts: typeof notes !== 'undefined' ? notes.map(n => n.txt) : [],
            pictureUrl: typeof picState !== 'undefined' ? picState.url : '',
            slotSel
        },
        farming: {
            plots: typeof farmPlots !== 'undefined' ? farmPlots.map(p => ({
                tilled: p.tilled,
                watered: p.watered,
                cropStage: p.crop && p.crop.userData.crop ? p.crop.userData.crop.stage : null,
                cropType: p.crop && p.crop.userData.crop ? (p.crop.userData.crop.cropType || 'turnip') : null,
                harvested: p.harvested || 0
            })) : [],
            hire: typeof captureFarmHireState === 'function' ? captureFarmHireState() : null
        },
        teaFarm: typeof captureTeaFarmState === 'function' ? captureTeaFarmState() : null,
        newspaper: typeof captureNewspaperState === 'function' ? captureNewspaperState() : null,
        liveNews: typeof captureLiveNewsState === 'function' ? captureLiveNewsState() : null,
        mainStory: typeof captureMainStoryState === 'function' ? captureMainStoryState() : null,
        alchemyIntro: typeof captureAlchemyIntroState === 'function' ? captureAlchemyIntroState() : null,
        pendingMarketEvents: typeof captureMainStoryMarketEvents === 'function' ? captureMainStoryMarketEvents() : [],
        achievements: typeof captureAchievementState === 'function' ? captureAchievementState() : null,
        wealthEvents: typeof captureWealthEventsState === 'function' ? captureWealthEventsState() : null,
        land: typeof captureLandState === 'function' ? captureLandState() : null,
        weatherFarm: typeof captureWeatherFarmState === 'function' ? captureWeatherFarmState() : null,
        gameplayLoop: typeof captureGameplayLoopState === 'function' ? captureGameplayLoopState() : null,
        cafeTotalRevenue: cafeTotalRevenue,
        toolUnlock: typeof captureToolUnlockState === 'function' ? captureToolUnlockState() : null,
        prologue: typeof capturePrologueState === 'function' ? capturePrologueState() : null,
        gamblingRisk: typeof captureGamblingRiskState === 'function' ? captureGamblingRiskState() : null,
        coloring: typeof captureColoringState === 'function' ? captureColoringState() : null
    };
}

function validateSave(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.schema !== APP_SAVE_SCHEMA || raw.content !== APP_CONTENT_ID) return null;
    return raw;
}

function setSaveStatus(text) {
    if (saveStatusEl) saveStatusEl.textContent = text;
}

function updateSaveStatus() {
    if (typeof renderCheckpointList === 'function') renderCheckpointList();
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save) {
        setSaveStatus((currentCabinUser ? currentCabinUser.name : '游客') + '：尚未存档');
        return;
    }
    const when = new Date(save.savedAt);
    const label = Number.isNaN(when.getTime()) ? '有可用存档' : when.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    setSaveStatus((currentCabinUser ? currentCabinUser.name : '游客') + '：' + label);
}

/* ---------------- HUD 渐进式解锁：该出现的时候再出现，开局别一次性堆满 ----------------
   仓库/背包/地契这几块只有在能种地之后才有意义，跟工具栏渐进解锁
   （js/28-tool-progression.js）复用同一个"锄头解锁了没"的信号；
   现金流面板和状态数值面板是更后期的经营工具，等序章过去、主线正式
   开始（mainStoryState.stage>=1）才出现。时钟和金币从头就显示——
   时间和"手里只有100块"这两件事从进门那一刻就该看得见。 */
function refreshProgressiveHud() {
    const farmingUnlocked = typeof window.isToolUnlocked === 'function' && window.isToolUnlocked(3);
    const storyStarted = typeof mainStoryState !== 'undefined' && mainStoryState.stage >= 1;
    if (storageHud) storageHud.hidden = !farmingUnlocked;
    if (backpackHud) backpackHud.hidden = !farmingUnlocked;
    if (typeof landHud !== 'undefined' && landHud) landHud.hidden = !farmingUnlocked;
    if (typeof cashFlowPanel !== 'undefined' && cashFlowPanel) cashFlowPanel.hidden = !storyStarted;
    if (statsPanel) statsPanel.hidden = !storyStarted;
}
window.refreshProgressiveHud = refreshProgressiveHud;
refreshProgressiveHud();

/* ---------------- 剧情存档点：主线每推进一章，先留一份"回退用"的快照 ----------------
   之前的存档只有一个槽位，剧情一旦推过去就没法回头。现在每次
   advanceMainStoryStage 真正把 stage+1 之前，先把当时的完整存档快照存一份，
   按章节号去重（同一章重复触发只保留最新一次），玩家在菜单"存档"页可以
   挑一个点"回到这里"，把当前进度整体换成那个快照。 */
const CHECKPOINT_MAX = 16;
const checkpointListEl = document.getElementById('checkpointList');

function checkpointStorageKey() {
    return 'magicCabin.checkpoints.' + (currentCabinUser ? currentCabinUser.id : APP_GUEST_ID) + '.v1';
}

function loadCheckpoints() {
    const raw = readJson(checkpointStorageKey(), []);
    return Array.isArray(raw) ? raw.filter(cp => cp && typeof cp === 'object' && cp.id && cp.save) : [];
}

function saveCheckpoints(list) {
    writeJson(checkpointStorageKey(), list.slice(-CHECKPOINT_MAX));
}

function recordMainStoryCheckpoint(stageIndex, title) {
    const list = loadCheckpoints().filter(cp => cp.stageIndex !== stageIndex);
    list.push({
        id: 'cp_' + stageIndex + '_' + Date.now(),
        stageIndex,
        title: boundedText(title || ('第 ' + (stageIndex + 1) + ' 章'), 40),
        timestamp: new Date().toISOString(),
        save: captureSaveState()
    });
    saveCheckpoints(list);
    renderCheckpointList();
}

function renderCheckpointList() {
    if (!checkpointListEl) return;
    const list = loadCheckpoints().slice().sort((a, b) => (a.stageIndex || 0) - (b.stageIndex || 0));
    if (!list.length) {
        checkpointListEl.innerHTML = '<div class="checkpointEmpty">还没有剧情存档点——主线每推进一章会自动留一个。</div>';
        return;
    }
    checkpointListEl.innerHTML = list.map(cp => {
        const when = new Date(cp.timestamp);
        const label = Number.isNaN(when.getTime()) ? '' : when.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        return '<div class="checkpointItem">' +
            '<span class="checkpointMeta"><span class="checkpointTitle">' + cp.title + '</span>' +
            '<span class="checkpointTime">' + label + '</span></span>' +
            '<button type="button" class="checkpointRestoreBtn" data-checkpoint="' + cp.id + '">回到这里</button>' +
            '</div>';
    }).join('');
}

function restoreCheckpoint(id) {
    const cp = loadCheckpoints().find(item => item.id === id);
    if (!cp || !cp.save) return;
    if (!window.confirm('回到"' + cp.title + '"这个存档点吗？现在还没存的进度会丢失。')) return;
    applySaveState(cp.save);
    saveGameState(false);
    updateSaveStatus();
    showHintOverride('已回到剧情存档点：' + cp.title);
    const menuPanelEl = document.getElementById('menuPanel');
    if (menuPanelEl) menuPanelEl.classList.remove('open');
}

if (checkpointListEl) {
    checkpointListEl.addEventListener('click', event => {
        const btn = event.target.closest('[data-checkpoint]');
        if (!btn) return;
        restoreCheckpoint(btn.dataset.checkpoint);
    });
}

/* 主线地图上点"回到这里"用的：按章节号找最近一次记录的存档点，
   没有就提示一句，不用先跳到菜单"存档"页去找。 */
function restoreCheckpointForStage(stageIndex) {
    const cp = loadCheckpoints().find(item => item.stageIndex === stageIndex);
    if (!cp) {
        showHintOverride('这一章还没有存档点，没法回退');
        return;
    }
    restoreCheckpoint(cp.id);
}

window.recordMainStoryCheckpoint = recordMainStoryCheckpoint;
window.restoreCheckpointForStage = restoreCheckpointForStage;
window.hasCheckpointForStage = stageIndex => loadCheckpoints().some(item => item.stageIndex === stageIndex);

function saveGameState(manual) {
    const ok = writeJson(cabinSaveKey(), captureSaveState());
    updateSaveStatus();
    if (manual) showHintOverride(ok ? '进度已保存' : '存档失败，浏览器可能禁用了本地存储');
    return ok;
}

function applyFarmPlotSave(plot, saved) {
    if (!plot || !saved) return;
    if (plot.crop) {
        removeTurnip(plot.crop);
        plot.crop = null;
    }
    plot.tilled = bool(saved.tilled);
    plot.watered = bool(saved.watered);
    plot.harvested = Math.max(0, Math.trunc(Number(saved.harvested) || 0));
    if (saved.cropStage !== null && saved.cropStage !== undefined) {
        const cropType = (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[saved.cropType]) ? saved.cropType : 'turnip';
        plot.crop = createTurnip(plot.x, 0.02, plot.z, null, cropType);
        setTurnipStage(plot.crop, Math.max(0, Math.min(3, Math.trunc(Number(saved.cropStage) || 0))));
        plot.tilled = true;
    }
    applyFarmPlotState(plot, null);
}

function applySaveState(save) {
    const p = save.player || {};
    const pos = Array.isArray(p.position) ? p.position : [0, 0, 5.2];
    player.pos.set(
        finiteNumber(pos[0], 0, 1000),
        finiteNumber(pos[1], 0, 1000),
        finiteNumber(pos[2], 5.2, 1000)
    );
    player.vy = 0;
    player.onGround = true;
    player.yaw = finiteNumber(p.yaw, Math.PI, 100);
    camYaw = finiteNumber(p.camYaw, Math.PI, 100);
    camPitch = finiteNumber(p.camPitch, 0.32, 10);
    viewDist = finiteNumber(p.viewDist, 3.2, 50);
    fixYaw = finiteNumber(p.fixYaw, fixYaw, 100);
    fixPitch = finiteNumber(p.fixPitch, fixPitch, 10);
    fixDist = finiteNumber(p.fixDist, fixDist, 100);
    setViewMode(['fixed', 'tp', 'fp'].includes(p.viewMode) ? p.viewMode : 'fixed');

    const world = save.world || {};
    fullHouse = bool(world.fullHouse);
    fullHouseGroup.visible = fullHouse;
    dashedGroup.visible = !fullHouse;
    houseToggle.classList.toggle('on', fullHouse);
    fireLit = bool(world.fireLit);
    lampLit = bool(world.lampLit);
    lanternLit = bool(world.lanternLit);
    orbOn = bool(world.orbOn);
    corkOut = bool(world.corkOut);
    bookOn = bool(world.bookOn);
    catAwake = bool(world.catAwake);
    cartOut = bool(world.cartOut);
    kotatsuOn = bool(world.kotatsuOn);
    storageOpen = bool(world.storageOpen);
    if (typeof window.setWateringCanFilled === 'function') {
        window.setWateringCanFilled(bool(world.wateringCanFilled), true);
    }
    const h = world.hinges || {};
    applyHingeState(doorGroup, h.door);
    applyHingeState(winFL, h.winFL);
    applyHingeState(winFR, h.winFR);
    applyHingeState(winL, h.winL);
    applyHingeState(winR, h.winR);
    applyHingeState(winB, h.winB);
    applyHingeState(winG, h.winG);

    const weather = save.weather || {};
    gameSec = finiteNumber(weather.gameSec, 10 * 3600, 24 * 3600 * 365);
    timeScale = finiteNumber(weather.timeScale, 60, 3600);
    speedSlider.value = String(Math.max(0, Math.min(1, Number(weather.slider) || 0.5)));
    setWeather(WX_LIST.includes(weather.type) ? weather.type : 'sunny');
    wx.random = bool(weather.random);
    wxRandToggle.classList.toggle('on', wx.random);
    timeSlider.value = String(curHour());

    const ui = save.ui || {};
    const economy = save.economy || {};
    const stats = save.stats || {};
    cabinLuck = clampStat(stats.luck, 50);
    setStatsPanelCollapsed(stats.panelCollapsed !== false);
    cabinCoins = Math.max(0, Math.min(999999, Math.trunc(Number(economy.coins) || 0)));
    const storage = economy.storage || save.storage || {};
    cropStorage = {
        turnip: Math.max(0, Math.min(999999, Math.trunc(Number(storage.turnip) || 0))),
        cabbage: Math.max(0, Math.min(999999, Math.trunc(Number(storage.cabbage) || 0))),
        rice: Math.max(0, Math.min(999999, Math.trunc(Number(storage.rice) || 0))),
        potato: Math.max(0, Math.min(999999, Math.trunc(Number(storage.potato) || 0))),
        starRelic: Math.max(
            0,
            Math.min(1, Math.trunc(Number(storage.starRelic) || 0))
        )
    };
    const backpack = economy.backpack || save.backpack || {};
    cabinBackpack = {
        turnipSeed: Math.max(0, Math.min(999999, Math.trunc(Number(backpack.turnipSeed) || 0))),
        cabbageSeed: Math.max(0, Math.min(999999, Math.trunc(Number(backpack.cabbageSeed) || 0))),
        riceSeed: Math.max(0, Math.min(999999, Math.trunc(Number(backpack.riceSeed) || 0))),
        potatoSeed: Math.max(0, Math.min(999999, Math.trunc(Number(backpack.potatoSeed) || 0)))
    };
    renderCoins(false);
    renderStorage(false);
    renderBackpack(false);
    if (typeof applyCashFlowState === 'function') {
        applyCashFlowState(economy.cashFlow || save.cashFlow);
    }
    SND.setEnabled(ui.sfxEnabled !== false);
    sfxToggle.classList.toggle('on', SND.isEnabled());
    SND.setVolume(finiteNumber(ui.sfxVolume, 0.6, 1));
    sfxSlider.value = String(SND.getVolume());
    signText = boundedText(ui.signText || '魔女小屋', 10) || '魔女小屋';
    signInput.value = signText;
    drawSign(signText);
    if (Array.isArray(ui.noteTexts) && typeof notes !== 'undefined') {
        ui.noteTexts.forEach((text, i) => {
            if (!notes[i]) return;
            notes[i].txt = boundedText(text, 10) || '...';
            drawNote(i);
        });
    }
    if (typeof picState !== 'undefined') {
        const pictureUrl = boundedText(ui.pictureUrl || '', 500);
        picState.url = pictureUrl;
        if (pictureUrl) setPicture(pictureUrl);
    }
    if (typeof applyToolUnlockState === 'function') {
        applyToolUnlockState(save.toolUnlock);
    }
    selectSlot(Number.isInteger(ui.slotSel) ? ui.slotSel : 1);

    const farming = save.farming || {};
    if (Array.isArray(farming.plots) && typeof farmPlots !== 'undefined') {
        farming.plots.forEach((plotSave, i) => applyFarmPlotSave(farmPlots[i], plotSave));
    }
    const hasPlotCropStages = Array.isArray(farming.plots) && farming.plots.some(plot => plot && Object.prototype.hasOwnProperty.call(plot, 'cropStage'));
    if (Array.isArray(farming.crops) && typeof farmPlots !== 'undefined' && !hasPlotCropStages) {
        farming.crops.forEach((stage, i) => {
            const plot = farmPlots[i];
            if (!plot) return;
            applyFarmPlotSave(plot, { tilled: true, watered: false, cropStage: stage, harvested: 0 });
        });
    }
    if (typeof applyFarmHireState === 'function') {
        applyFarmHireState(farming.hire);
    }
    if (typeof applyTeaFarmState === 'function') {
        const savedAtMs = Date.parse(save.savedAt);
        const elapsedRealSeconds = Number.isFinite(savedAtMs) ? Math.max(0, (Date.now() - savedAtMs) / 1000) : 0;
        applyTeaFarmState(save.teaFarm, elapsedRealSeconds);
    }
    if (typeof applyLiveNewsState === 'function') {
        applyLiveNewsState(save.liveNews);
    }
    if (typeof applyNewspaperState === 'function') {
        applyNewspaperState(save.newspaper);
    }
    if (typeof applyAchievementState === 'function') {
        applyAchievementState(save.achievements);
    }
    if (typeof applyMainStoryState === 'function') {
        applyMainStoryState(save.mainStory);
    }
    if (typeof applyAlchemyIntroState === 'function') {
        applyAlchemyIntroState(save.alchemyIntro);
    }
    if (typeof applyMainStoryMarketEvents === 'function') {
        applyMainStoryMarketEvents(save.pendingMarketEvents);
    }
    if (typeof applyWealthEventsState === 'function') {
        applyWealthEventsState(save.wealthEvents);
    }
    if (typeof applyLandState === 'function') {
        applyLandState(save.land);
    }
    if (typeof applyWeatherFarmState === 'function') {
        applyWeatherFarmState(save.weatherFarm);
    }
    if (typeof applyGameplayLoopState === 'function') {
        applyGameplayLoopState(save.gameplayLoop);
    }
    if (typeof applyPrologueState === 'function') {
        applyPrologueState(save.prologue);
    }
    if (typeof applyGamblingRiskState === 'function') {
        applyGamblingRiskState(save.gamblingRisk);
    }
    if (typeof applyColoringState === 'function') {
        applyColoringState(save.coloring);
    }
    cafeTotalRevenue = Math.max(0, Math.trunc(Number(save.cafeTotalRevenue) || 0));
    renderStatsPanel();
    if (typeof renderCashFlowPanel === 'function') renderCashFlowPanel();
}

function loadGameState(manual) {
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save) {
        if (manual) showHintOverride('没有找到当前账号的存档');
        updateAuthMessage('没有找到当前账号的存档，可以直接开始新游戏。');
        updateSaveStatus();
        return false;
    }
    applySaveState(save);
    updateSaveStatus();
    if (manual) showHintOverride('存档已读取');
    return true;
}

function autoLoadGameState(showLoadedHint) {
    const save = validateSave(readJson(cabinSaveKey(), null));
    if (!save) {
        updateAuthMessage(currentCabinUser
            ? '已登录：' + currentCabinUser.name + '，没有找到旧存档，将从新游戏开始。'
            : '未登录也可以游客进入，将从新游戏开始。');
        updateSaveStatus();
        return false;
    }
    applySaveState(save);
    updateSaveStatus();
    updateAuthMessage(currentCabinUser
        ? '已登录：' + currentCabinUser.name + '，已自动读取存档。'
        : '游客存档已自动读取。');
    if (showLoadedHint) showHintOverride('存档已自动读取');
    return true;
}

function clearGameSave() {
    try {
        localStorage.removeItem(cabinSaveKey());
        updateSaveStatus();
        showHintOverride('当前账号存档已清除');
    } catch (err) {
        showHintOverride('清除失败，浏览器可能禁用了本地存储');
    }
}

function exportGameSaveJson() {
    const save = captureSaveState();
    writeJson(cabinSaveKey(), save);
    updateSaveStatus();
    const userPart = currentCabinUser ? currentCabinUser.name : 'guest';
    const datePart = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'magic-cabin-save-' + userPart + '-' + datePart + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showHintOverride('JSON 存档已导出');
}

function importGameSaveJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const save = validateSave(JSON.parse(String(reader.result || '')));
            if (!save) {
                showHintOverride('导入失败：这不是当前游戏的存档 JSON');
                return;
            }
            writeJson(cabinSaveKey(), save);
            applySaveState(save);
            updateSaveStatus();
            showHintOverride('JSON 存档已导入');
        } catch (err) {
            showHintOverride('导入失败：JSON 文件格式不正确');
        }
    };
    reader.onerror = () => showHintOverride('导入失败：无法读取文件');
    reader.readAsText(file);
}

function openImportSavePicker() {
    const input = document.getElementById('importSaveInput');
    if (!input) return;
    input.value = '';
    input.click();
}

function bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
}

bindClick('enterGameBtn', () => enterGame(false));
bindClick('continueGameBtn', () => enterGame(true));
bindClick('openMembersBtn', openMembers);
bindClick('membersMenuBtn', openMembers);
bindClick('showcaseMenuBtn', () => { window.location.href = 'index.html'; });

(function setupMenuTabs() {
    const menuPanelEl = document.getElementById('menuPanel');
    if (!menuPanelEl) return;
    menuPanelEl.addEventListener('click', event => {
        const btn = event.target.closest('.menuTabBtn');
        if (!btn || !menuPanelEl.contains(btn)) return;
        const key = btn.dataset.menuTab;
        menuPanelEl.querySelectorAll('.menuTabBtn').forEach(b => b.classList.toggle('on', b === btn));
        menuPanelEl.querySelectorAll('.menuTabPanel').forEach(panel => {
            panel.hidden = panel.dataset.menuPanel !== key;
        });
        menuPanelEl.scrollTop = 0;
    });
})();
bindClick('investmentMenuBtn', () => {
    const go = () => {
        if (typeof prepareStoreReturn === 'function') prepareStoreReturn();
        else saveGameState(false);
        window.location.href = 'investment-room/index.html';
    };
    if (typeof window.requestMainStoryAccess === 'function') window.requestMainStoryAccess('investment', go);
    else go();
});
bindClick('closeMembersBtn', closeMembers);
bindClick('backToMembersBtn', showMemberList);
document.querySelectorAll('.memberAvatar[data-member]').forEach(card => {
    card.addEventListener('click', () => showMemberDetail(card.dataset.member));
});
bindClick('saveGameBtn', () => saveGameState(true));
bindClick('loadGameBtn', () => loadGameState(true));
bindClick('exportSaveBtn', exportGameSaveJson);
bindClick('importSaveBtn', openImportSavePicker);
bindClick('clearSaveBtn', clearGameSave);
bindClick('showLoginBtn', () => switchAuth('login'));
bindClick('showRegisterBtn', () => switchAuth('register'));
bindClick('registerBtn', registerUser);
bindClick('loginBtn', loginUser);
if (membersModal) {
    membersModal.addEventListener('click', e => { if (e.target === membersModal) closeMembers(); });
}

const importSaveInput = document.getElementById('importSaveInput');
if (importSaveInput) {
    importSaveInput.addEventListener('change', () => importGameSaveJson(importSaveInput.files && importSaveInput.files[0]));
}

for (const id of ['loginName', 'loginPass']) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter') loginUser();
    });
}
for (const id of ['registerName', 'registerId', 'registerPass']) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter') registerUser();
    });
}

addEventListener('keydown', e => {
    if (e.key === 'Escape' && membersModal && !membersModal.hidden) closeMembers();
});

addEventListener('beforeunload', () => {
    if (!window.APP_SHELL_BLOCK_GAME) saveGameState(false);
});

addEventListener('pagehide', () => {
    if (!window.APP_SHELL_BLOCK_GAME) saveGameState(false);
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !window.APP_SHELL_BLOCK_GAME) saveGameState(false);
});

statsPanelToggle?.addEventListener('click', () => {
    setStatsPanelCollapsed(!statsPanelCollapsed);
    saveGameState(false);
});

(function autosaveLoop() {
    requestAnimationFrame(autosaveLoop);
    if (window.APP_SHELL_BLOCK_GAME) return;
    const now = performance.now();
    if (now - autosaveTimer > 25000) {
        autosaveTimer = now;
        saveGameState(false);
    }
})();

setCurrentUser(currentCabinUser, false);
renderCoins(false);
renderStorage(false);
renderBackpack(false);
setStatsPanelCollapsed(statsPanelCollapsed);
renderStatsPanel();
if (!resumeFromStoreIfNeeded() && !resumeFromJournalIfNeeded()) {
    const loadedSave = loadRequestedSaveIfNeeded() || autoLoadGameState(false);
    if (!loadedSave && typeof placePlayerAtAlchemyIntroStart === 'function') {
        placePlayerAtAlchemyIntroStart(true);
    }
    const cafeRevenue = claimCafeRevenue();
    if (cafeRevenue) {
        showHintOverride('咖啡馆收入 +' + cafeRevenue + ' 金币已入小金库');
    }
}
