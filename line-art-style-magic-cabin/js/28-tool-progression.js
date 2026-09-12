'use strict';

/* ================================================================
   工具栏渐进解锁
   开局工具栏只有"空手"，锄头/水壶/镰刀/魔杖不再一开始就摆满等你猜——
   走近农田锄头才出现，翻完地水壶出现，种下种子镰刀出现，
   第一次收获后魔杖出现。用"东西自己冒出来"代替文字说明"下一步用什么"。
   ================================================================ */

const TOOL_SLOT_KEY = { 2: 'wand', 3: 'hoe', 4: 'wateringCan', 5: 'sickle' };
const TOOL_UNLOCK_RADIUS = 6.5;

let toolUnlockState = { hoe: false, wateringCan: false, sickle: false, wand: false };

function isToolUnlocked(n) {
    if (n === 1) return true;
    const key = TOOL_SLOT_KEY[n];
    return key ? !!toolUnlockState[key] : false;
}

function refreshToolSlotVisibility() {
    for (let i = 2; i <= 5; i++) {
        const el = document.getElementById('slot' + i);
        if (el) el.classList.toggle('hiddenSlot', !isToolUnlocked(i));
    }
}

function unlockTool(key, toastText) {
    if (toolUnlockState[key]) return;
    toolUnlockState[key] = true;
    refreshToolSlotVisibility();
    if (toastText && typeof showHintOverride === 'function') showHintOverride(toastText);
    if (typeof SND !== 'undefined') SND.play('chim');
    if (typeof saveGameState === 'function') saveGameState(false);
}

function updateToolProgression() {
    if (!toolUnlockState.hoe) {
        if (typeof player !== 'undefined' && typeof FARMLAND_CENTER !== 'undefined') {
            const dx = player.pos.x - FARMLAND_CENTER.x;
            const dz = player.pos.z - FARMLAND_CENTER.z;
            if (Math.hypot(dx, dz) < TOOL_UNLOCK_RADIUS) {
                unlockTool('hoe', '🔨 锄头出现了 · 按 <b>3</b> 装备，翻开这片地');
            }
        }
        return;
    }
    if (!toolUnlockState.wateringCan) {
        if (typeof farmPlots !== 'undefined' && farmPlots.some(p => p.tilled)) {
            unlockTool('wateringCan', '💧 水壶出现了 · 按 <b>4</b> 装备，去水井打水后浇地');
        }
        return;
    }
    if (!toolUnlockState.sickle) {
        if (typeof farmPlots !== 'undefined' && farmPlots.some(p => p.crop)) {
            unlockTool('sickle', '🌾 镰刀出现了 · 等作物熟了按 <b>5</b> 装备收割');
        }
        return;
    }
    if (!toolUnlockState.wand) {
        const harvested = typeof cropStorage !== 'undefined'
            ? (cropStorage.turnip || 0) + (cropStorage.cabbage || 0) + (cropStorage.rice || 0) + (cropStorage.potato || 0)
            : 0;
        if (harvested >= 1) {
            unlockTool('wand', '🪄 魔杖出现了 · 按 <b>2</b> 装备，按 <b>F</b> 或右键施法');
        }
    }
}

function captureToolUnlockState() {
    return Object.assign({}, toolUnlockState);
}

function applyToolUnlockState(raw) {
    toolUnlockState = {
        hoe: !!(raw && raw.hoe),
        wateringCan: !!(raw && raw.wateringCan),
        sickle: !!(raw && raw.sickle),
        wand: !!(raw && raw.wand)
    };
    refreshToolSlotVisibility();
}

window.isToolUnlocked = isToolUnlocked;
window.updateToolProgression = updateToolProgression;
window.captureToolUnlockState = captureToolUnlockState;
window.applyToolUnlockState = applyToolUnlockState;

refreshToolSlotVisibility();
