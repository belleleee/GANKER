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
const closeFeatureIntroBtn = document.getElementById('closeFeatureIntroBtn');

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

let featureIntroOnClose = null;
let featureIntroLines = [];
let featureIntroLineIndex = 0;

function dialogueLineHtmlFallback(line) {
    return '<p>' + (typeof speakerPillHtml === 'function' ? speakerPillHtml(line.speaker) : '<span class="mainStorySpeaker">' + line.speaker + '</span>') + line.text + '</p>';
}

/* 一句一句往下"继续"，不是把整段台词一次性甩出来——跟主线对话框
   （mainStoryPanel）同一个节奏，读起来才像在跟人说话，不是在看
   一整块说明文档。 */
function renderFeatureIntroStep() {
    if (!featureIntroBody) return;
    const lines = featureIntroLines;
    const idx = Math.min(featureIntroLineIndex, Math.max(0, lines.length - 1));
    const shown = lines.slice(0, idx + 1);
    featureIntroBody.innerHTML = shown.map(dialogueLineHtmlFallback).join('');
    const linesDone = idx >= lines.length - 1;
    if (featureIntroCloseBtn) featureIntroCloseBtn.textContent = linesDone ? '知道了' : '继续';
    if (featureIntroPanel) {
        const card = featureIntroPanel.querySelector('.mainStoryCard');
        if (card) card.scrollTop = card.scrollHeight;
    }
}

/* 返回 true 表示这次真的弹出来了（第一次见到）；返回 false 表示
   已经看过、没弹——调用方可以据此决定要不要直接往下走（比如进咖啡馆
   打工这种"看完对话再跳转"的场景，见 29-cafe-entrance.js）。 */
function showFeatureIntro(id, kicker, title, lines, onClose) {
    if (!featureIntroPanel) return false;
    const seen = loadFeatureIntroSeen();
    if (seen[id]) return false;
    markFeatureIntroSeen(id);
    featureIntroOnClose = typeof onClose === 'function' ? onClose : null;
    if (featureIntroKicker) featureIntroKicker.textContent = kicker || '经营 · 新功能';
    if (featureIntroTitle) featureIntroTitle.textContent = title || '';
    featureIntroLines = Array.isArray(lines) ? lines : [];
    featureIntroLineIndex = 0;
    renderFeatureIntroStep();
    featureIntroPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
    return true;
}

function closeFeatureIntro() {
    if (!featureIntroPanel) return;
    featureIntroPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
    const onClose = featureIntroOnClose;
    featureIntroOnClose = null;
    if (onClose) onClose();
}

function advanceFeatureIntro() {
    if (featureIntroLineIndex >= featureIntroLines.length - 1) {
        closeFeatureIntro();
        return;
    }
    featureIntroLineIndex++;
    renderFeatureIntroStep();
    if (typeof SND !== 'undefined') SND.play('ui');
}

if (featureIntroCloseBtn) featureIntroCloseBtn.addEventListener('click', advanceFeatureIntro);
if (closeFeatureIntroBtn) closeFeatureIntroBtn.addEventListener('click', closeFeatureIntro);
if (featureIntroPanel) {
    featureIntroPanel.addEventListener('click', event => {
        if (event.target === featureIntroPanel) closeFeatureIntro();
    });
}
addEventListener('keydown', event => {
    if (!featureIntroPanel || featureIntroPanel.hidden) return;
    if (event.key === 'Enter') advanceFeatureIntro();
    if (event.key === 'Escape') closeFeatureIntro();
});

window.showFeatureIntro = showFeatureIntro;
