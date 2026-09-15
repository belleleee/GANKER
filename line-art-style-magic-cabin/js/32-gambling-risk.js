'use strict';

/* ================================================================
   投机成瘾 · 真实后果
   钱滚钱商店此前只有文字提醒（"别上头""见好就收"），说了不算数。
   现在真正连着几次把钱包输光，会被强制"冷静"几天，商店进不去，
   直到冷静期过去——这是账本上能看见的代价，不只是一句劝告。
   ================================================================ */

const GAMBLING_BANKRUPT_LIMIT = 3;
const GAMBLING_LOCK_DAYS = 3;

let gamblingRiskState = {
    bankruptciesSinceLock: 0,
    lastWalletSeen: null,
    lockedUntilDay: -1
};

function isCoinShopLocked() {
    if (gamblingRiskState.lockedUntilDay < 0) return false;
    if (typeof currentFarmDay !== 'function') return false;
    return currentFarmDay() < gamblingRiskState.lockedUntilDay;
}

function coinShopLockDaysLeft() {
    if (!isCoinShopLocked()) return 0;
    return gamblingRiskState.lockedUntilDay - currentFarmDay();
}

function pollGamblingRisk() {
    const save = typeof peekCoinGameSave === 'function' ? peekCoinGameSave() : null;
    if (!save) return;
    const wallet = Number(save.wallet) || 0;
    const lost = Number(save.lost) || 0;
    const prev = gamblingRiskState.lastWalletSeen;
    if (prev !== null && prev > 0 && wallet <= 0 && lost > 0) {
        gamblingRiskState.bankruptciesSinceLock++;
        if (gamblingRiskState.bankruptciesSinceLock >= GAMBLING_BANKRUPT_LIMIT &&
            !isCoinShopLocked() && typeof currentFarmDay === 'function') {
            gamblingRiskState.lockedUntilDay = currentFarmDay() + GAMBLING_LOCK_DAYS;
            gamblingRiskState.bankruptciesSinceLock = 0;
            if (typeof showGuideCard === 'function') {
                showGuideCard(
                    '钱包连着输光好几回了——这次不是提醒，是真管不住自己了。这几天先别进那屋子，冷静冷静。',
                    9
                );
            }
            if (typeof SND !== 'undefined') SND.play('toggle');
            if (typeof saveGameState === 'function') saveGameState(false);
        }
    }
    gamblingRiskState.lastWalletSeen = wallet;
}

function captureGamblingRiskState() {
    return {
        bankruptciesSinceLock: gamblingRiskState.bankruptciesSinceLock,
        lockedUntilDay: gamblingRiskState.lockedUntilDay
    };
}

function applyGamblingRiskState(raw) {
    gamblingRiskState = {
        bankruptciesSinceLock: Math.max(0, Math.trunc(Number(raw && raw.bankruptciesSinceLock) || 0)),
        lockedUntilDay: Number.isFinite(Number(raw && raw.lockedUntilDay)) ? Math.trunc(Number(raw.lockedUntilDay)) : -1,
        lastWalletSeen: null
    };
}

window.isCoinShopLocked = isCoinShopLocked;
window.coinShopLockDaysLeft = coinShopLockDaysLeft;
window.pollGamblingRisk = pollGamblingRisk;
window.captureGamblingRiskState = captureGamblingRiskState;
window.applyGamblingRiskState = applyGamblingRiskState;
