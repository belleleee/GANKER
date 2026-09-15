'use strict';

/* ================================================================
   新功能提醒：一次性对话框
   某个玩法（代销订单之类）第一次解锁的时候，不能只是悄悄地把面板显示
   出来——玩家会完全不知道发生了什么。复用主线卡片同款的深色对话框
   样式（.mainStoryPanel/.mainStoryCard），弹一次说明，之后不再打扰。
   ================================================================ */

const featureIntroPanel = document.getElementById('featureIntroPanel');
const featureIntroKicker = document.getElementById('featureIntroKicker');
const featureIntroTitle = document.getElementById('featureIntroTitle');
const featureIntroBody = document.getElementById('featureIntroBody');
const featureIntroCloseBtn = document.getElementById('featureIntroCloseBtn');

const FEATURE_INTRO_SEEN_PREFIX = 'magicCabin.featureIntroSeen.';

function featureIntroUserId() {
    try {
        const raw = localStorage.getItem('magicCabin.session.v1');
        if (!raw) return 'guest';
        const data = JSON.parse(raw);
        if (data && typeof data.id === 'string' && data.id.trim()) return data.id.trim();
    } catch (err) { }
    return 'guest';
}

function featureIntroSeenKey() {
    return FEATURE_INTRO_SEEN_PREFIX + featureIntroUserId() + '.v1';
}

let featureIntroSeenCache = null;
function loadFeatureIntroSeen() {
    if (featureIntroSeenCache) return featureIntroSeenCache;
    try {
        featureIntroSeenCache = JSON.parse(localStorage.getItem(featureIntroSeenKey()) || '{}') || {};
    } catch (err) {
        featureIntroSeenCache = {};
    }
    return featureIntroSeenCache;
}

function markFeatureIntroSeen(id) {
    const seen = loadFeatureIntroSeen();
    seen[id] = true;
    try {
        localStorage.setItem(featureIntroSeenKey(), JSON.stringify(seen));
    } catch (err) { }
}

function showFeatureIntro(id, kicker, title, lines) {
    if (!featureIntroPanel) return;
    const seen = loadFeatureIntroSeen();
    if (seen[id]) return;
    markFeatureIntroSeen(id);
    if (featureIntroKicker) featureIntroKicker.textContent = kicker || '经营 · 新功能';
    if (featureIntroTitle) featureIntroTitle.textContent = title || '';
    if (featureIntroBody) {
        featureIntroBody.innerHTML = (lines || []).map(line =>
            '<p><span class="mainStorySpeaker">' + line.speaker + '</span>' + line.text + '</p>'
        ).join('');
    }
    featureIntroPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeFeatureIntro() {
    if (!featureIntroPanel) return;
    featureIntroPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
}

if (featureIntroCloseBtn) featureIntroCloseBtn.addEventListener('click', closeFeatureIntro);
if (featureIntroPanel) {
    featureIntroPanel.addEventListener('click', event => {
        if (event.target === featureIntroPanel) closeFeatureIntro();
    });
}
addEventListener('keydown', event => {
    if (!featureIntroPanel || featureIntroPanel.hidden) return;
    if (event.key === 'Enter' || event.key === 'Escape') closeFeatureIntro();
});

window.showFeatureIntro = showFeatureIntro;
