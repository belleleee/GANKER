'use strict';

/* ================================================================
   地契系统
   农田不是白来的：一开始要用几乎全部身家把这块荒地租下来才能翻土，
   租期到了要续租，攒够一大笔钱之后可以直接买断变成永久产权。
   呼应"发家之路"最初那一步孤注一掷的紧张感。
   ================================================================ */

const LAND_RENT_COST = 80;
const LAND_RENT_DAYS = 6;
const LAND_BUYOUT_COST = 3000;

let landState = {
    owned: false,
    rentedUntilDay: -1
};
let landPanelOpen = false;

const landPanel = document.getElementById('landPanel');
const landKicker = document.getElementById('landKicker');
const landTitle = document.getElementById('landTitle');
const landBody = document.getElementById('landBody');
const landActions = document.getElementById('landActions');
const landHud = document.getElementById('landHud');

function landCoins() {
    return typeof cabinCoins === 'number' ? cabinCoins : 0;
}

function landDaysLeft() {
    if (landState.rentedUntilDay < 0) return 0;
    return Math.max(0, landState.rentedUntilDay - currentFarmDay());
}

function isLandUsable() {
    if (landState.owned) return true;
    return landState.rentedUntilDay >= 0 && landDaysLeft() > 0;
}

function landNeverRented() {
    return !landState.owned && landState.rentedUntilDay < 0;
}

function landExpired() {
    return !landState.owned && landState.rentedUntilDay >= 0 && landDaysLeft() <= 0;
}

function renderLandHud() {
    if (!landHud) return;
    if (landState.owned) {
        landHud.textContent = '地契 · 已买断';
        landHud.classList.add('owned');
        return;
    }
    landHud.classList.remove('owned');
    if (landNeverRented()) {
        landHud.textContent = '地契 · 尚未租下';
    } else if (landExpired()) {
        landHud.textContent = '地契 · 租期已到';
    } else {
        landHud.textContent = '地契 · 租期还剩 ' + landDaysLeft() + ' 天';
    }
}

/* 对话框式：跟主线卡片/开局对话一样，一句一句地讲，讲完了才露出
   按钮——不再是一次性摊开一整块说明文字的"卡片"。 */
let landLines = [];
let landLineIndex = 0;
let landButtons = [];

function landLinesDone() {
    return landLineIndex >= landLines.length - 1;
}

function renderLandPanel() {
    if (!landBody) return;
    const linesDone = landLinesDone();
    /* 保留这一幕讲过的台词，不是只看当前一句——参考 22-main-story.js
       同样的改动。 */
    const shownLines = landLines.slice(0, Math.min(landLineIndex, Math.max(0, landLines.length - 1)) + 1);
    landBody.innerHTML = shownLines.map(line =>
        '<p>' + (typeof speakerPillHtml === 'function' ? speakerPillHtml(line.speaker) : '<span class="mainStorySpeaker">' + line.speaker + '</span>') + line.text + '</p>'
    ).join('');
    landBody.classList.toggle('dialogStep', !linesDone);
    if (landActions) landActions.hidden = !linesDone;
    const card = landPanel && landPanel.querySelector('.landCard');
    if (card) card.scrollTop = card.scrollHeight;
}

function advanceLandDialogue() {
    if (!landLinesDone()) {
        landLineIndex++;
        renderLandPanel();
        if (typeof SND !== 'undefined') SND.play('ui');
    }
}

function openLandPanel(kicker, title, lines, buttons) {
    if (!landPanel) return;
    landPanelOpen = true;
    landKicker.textContent = kicker;
    landTitle.textContent = title;
    landLines = Array.isArray(lines) ? lines : [];
    landLineIndex = 0;
    landButtons = buttons || [];
    landActions.innerHTML = '';
    landButtons.forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'landBtn' + (b.primary ? ' primary' : '');
        btn.textContent = b.label;
        btn.addEventListener('click', () => {
            closeLandPanel();
            if (typeof b.onClick === 'function') b.onClick();
        });
        landActions.appendChild(btn);
    });
    renderLandPanel();
    landPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeLandPanel() {
    if (!landPanel) return;
    landPanel.hidden = true;
    landPanelOpen = false;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof saveGameState === 'function') saveGameState(false);
}

if (landBody) {
    landBody.addEventListener('click', advanceLandDialogue);
}
addEventListener('keydown', event => {
    if (!landPanel || landPanel.hidden) return;
    if (event.key === 'Enter') advanceLandDialogue();
});

function doRentLand() {
    if (typeof spendCabinCoins !== 'function' || !spendCabinCoins(LAND_RENT_COST, '租下农田')) {
        showHintOverride('金币不够，这块地租不下来');
        return;
    }
    landState.rentedUntilDay = currentFarmDay() + LAND_RENT_DAYS;
    renderLandHud();
    if (typeof saveGameState === 'function') saveGameState(false);
    showHintOverride('地租下来了 · 租期 ' + LAND_RENT_DAYS + ' 天，赶紧翻地');
}

function doBuyoutLand() {
    if (typeof spendCabinCoins !== 'function' || !spendCabinCoins(LAND_BUYOUT_COST, '买断农田')) {
        showHintOverride('金币还不够买断这块地');
        return;
    }
    landState.owned = true;
    renderLandHud();
    if (typeof saveGameState === 'function') saveGameState(false);
    showHintOverride('这块地是你自己的了，往后再也不用交租');
}

function promptRentFirstTime() {
    openLandPanel(
        '第一个决定',
        '要不要 all-in 租下这块地？',
        [
            { speaker: '旁白', text: '屋子东边这片荒地，地主愿意租给你，开价 <b>' + LAND_RENT_COST + '</b> 金币——你手里满打满算也就 <b>' + landCoins() + '</b> 金币，这几乎是全部家当。' },
            { speaker: '师傅', text: '租下来，才能翻地种萝卜，走出第一步；不租，就只能在屋子里接着晃荡。' },
            { speaker: '旁白', text: '钱攒到 <b>' + LAND_BUYOUT_COST + '</b> 金币以上，还能把这块地直接买断，从此不用再交租。' }
        ],
        [
            { label: '再想想', onClick: () => showHintOverride('想好了随时回来找地主') },
            { label: 'All-in 租下来（-' + LAND_RENT_COST + ' 金币）', primary: true, onClick: doRentLand }
        ]
    );
}

function promptRenew() {
    const buttons = [
        { label: '再想想', onClick: () => showHintOverride('租期到了，地暂时动不了') },
        { label: '续租（-' + LAND_RENT_COST + ' 金币）', onClick: doRentLand }
    ];
    if (landCoins() >= LAND_BUYOUT_COST) {
        buttons.push({ label: '直接买断（-' + LAND_BUYOUT_COST + ' 金币）', primary: true, onClick: doBuyoutLand });
    }
    openLandPanel(
        '租期到了',
        '地主上门收地了',
        [
            { speaker: '旁白', text: '当初租的那 ' + LAND_RENT_DAYS + ' 天期限到了，地主上门了。' },
            { speaker: '地主', text: '要么续租接着种，要么——你手头要是宽裕，不如直接买断，以后再也不用看人脸色。' }
        ],
        buttons
    );
}

/* 租期没到，但钱已经够了——之前唯一能买断的入口是"租期到了"那个
   弹窗，等于逼着玩家干等到期。现在点左上角的地契HUD随时能买断。 */
function promptBuyoutEarly() {
    const buttons = [
        { label: '再想想', onClick: () => { } }
    ];
    const afford = landCoins() >= LAND_BUYOUT_COST;
    if (afford) {
        buttons.push({ label: '直接买断（-' + LAND_BUYOUT_COST + ' 金币）', primary: true, onClick: doBuyoutLand });
    }
    openLandPanel(
        '地契',
        '要不要现在就买断？',
        [
            { speaker: '旁白', text: '地还在租期内，还剩 ' + landDaysLeft() + ' 天。不用等到期——凑够 ' + LAND_BUYOUT_COST + ' 金币，随时可以提前买断。' },
            { speaker: '师傅', text: afford ? '够了，买断吧，往后不用再看人脸色。' : '还差 ' + Math.max(0, LAND_BUYOUT_COST - landCoins()) + ' 金币，再攒攒。' }
        ],
        buttons
    );
}

function openLandStatusPanel() {
    if (landPanelOpen) return;
    if (landState.owned) {
        showHintOverride('地契 · 已经买断了，这块地是你自己的');
        return;
    }
    if (landNeverRented()) {
        promptRentFirstTime();
        return;
    }
    if (landExpired()) {
        promptRenew();
        return;
    }
    promptBuyoutEarly();
}

if (landHud) {
    landHud.addEventListener('click', openLandStatusPanel);
}

/* 返回 true 表示这块地现在可以正常操作（翻地/播种/浇水/收获）；
   返回 false 表示这次点击被拦下来了，弹窗会引导玩家先解决地契问题。 */
function requestLandAccess() {
    if (isLandUsable()) return true;
    if (landPanelOpen) return false;
    if (landNeverRented()) {
        promptRentFirstTime();
    } else {
        promptRenew();
    }
    return false;
}

function updateLandTenure() {
    renderLandHud();
}

function captureLandState() {
    return {
        owned: landState.owned,
        rentedUntilDay: landState.rentedUntilDay
    };
}

function applyLandState(raw) {
    landState = {
        owned: !!(raw && raw.owned),
        rentedUntilDay: Number.isFinite(Number(raw && raw.rentedUntilDay)) ? Math.trunc(Number(raw.rentedUntilDay)) : -1
    };
    renderLandHud();
}

if (landPanel) {
    landPanel.addEventListener('click', event => {
        if (event.target === landPanel) closeLandPanel();
    });
}

window.requestLandAccess = requestLandAccess;
window.captureLandState = captureLandState;
window.applyLandState = applyLandState;
window.updateLandTenure = updateLandTenure;
window.isLandOwnedOrRented = isLandUsable;

renderLandHud();
