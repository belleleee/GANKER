'use strict';

/* ================================================================
   作物品类 + 播种选择弹窗
   农田不再只有萝卜——四种作物各自对天气有不同的偏好，
   播种时弹一个小选择框，让玩家挑一挑今天种什么。
   ================================================================ */

const CROP_ORDER = ['turnip', 'cabbage', 'rice', 'potato'];

const CROP_TYPES = {
    turnip: {
        id: 'turnip', name: '萝卜', icon: '🥕',
        seedItem: 'turnipSeed', storageKey: 'turnip',
        seedPrice: 15, harvestCoins: 25,
        weatherGood: [], weatherBad: [],
        rootColor: 0xd88963
    },
    cabbage: {
        id: 'cabbage', name: '白菜', icon: '🥬',
        seedItem: 'cabbageSeed', storageKey: 'cabbage',
        seedPrice: 20, harvestCoins: 34,
        weatherGood: ['sunny', 'cloudy'], weatherBad: ['rain', 'storm'],
        rootColor: 0xdff0c8
    },
    rice: {
        id: 'rice', name: '水稻', icon: '🌾',
        seedItem: 'riceSeed', storageKey: 'rice',
        seedPrice: 25, harvestCoins: 42,
        weatherGood: ['rain', 'storm'], weatherBad: ['sunny'],
        rootColor: 0xe8c96a
    },
    potato: {
        id: 'potato', name: '土豆', icon: '🥔',
        seedItem: 'potatoSeed', storageKey: 'potato',
        seedPrice: 18, harvestCoins: 30,
        weatherGood: ['fog', 'snow', 'blizzard'], weatherBad: [],
        rootColor: 0xa9784a
    }
};

/* 好天气 ×1.4，坏天气 ×0.6，不挑天气或天气一般 ×1.0 */
function weatherYieldMultiplier(goodList, badList) {
    const type = typeof wx !== 'undefined' ? wx.type : 'sunny';
    if (Array.isArray(goodList) && goodList.indexOf(type) >= 0) return 1.4;
    if (Array.isArray(badList) && badList.indexOf(type) >= 0) return 0.6;
    return 1.0;
}

function cropWeatherMultiplier(cropId) {
    const crop = CROP_TYPES[cropId];
    if (!crop) return 1.0;
    return weatherYieldMultiplier(crop.weatherGood, crop.weatherBad);
}

function cropWeatherNote(cropId) {
    const crop = CROP_TYPES[cropId];
    if (!crop) return '';
    const type = typeof wx !== 'undefined' ? wx.type : 'sunny';
    if (crop.weatherGood.indexOf(type) >= 0) return '今天天气很适合，收成 ×1.4';
    if (crop.weatherBad.indexOf(type) >= 0) return '今天天气不太行，收成 ×0.6';
    return '今天天气一般，收成正常';
}

/* ---------------- 播种选择弹窗 ---------------- */

const cropPanel = document.getElementById('cropPanel');
const cropPanelBody = document.getElementById('cropPanelBody');
let cropPanelCallback = null;

function backpackSeedCount(cropId) {
    const crop = CROP_TYPES[cropId];
    if (!crop || typeof window.getBackpackItemCount !== 'function') return 0;
    return window.getBackpackItemCount(crop.seedItem);
}

function openCropPicker(callback) {
    if (!cropPanel || !cropPanelBody) {
        callback(CROP_ORDER.find(id => backpackSeedCount(id) > 0) || null);
        return;
    }
    const available = CROP_ORDER.filter(id => backpackSeedCount(id) > 0);
    if (!available.length) {
        showHintOverride('背包里没有任何种子了，先去商店买 · 按 <b>B</b>');
        return;
    }
    cropPanelCallback = callback;
    cropPanelBody.innerHTML = available.map(id => {
        const crop = CROP_TYPES[id];
        return '<button type="button" class="cropOption" data-crop="' + id + '">' +
            '<span class="cropIcon">' + crop.icon + '</span>' +
            '<span class="cropName">' + crop.name + '</span>' +
            '<span class="cropCount">种子 ×' + backpackSeedCount(id) + '</span>' +
            '<span class="cropNote">' + cropWeatherNote(id) + '</span>' +
            '</button>';
    }).join('');
    cropPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeCropPicker() {
    if (!cropPanel) return;
    cropPanel.hidden = true;
    cropPanelCallback = null;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
}

if (cropPanelBody) {
    cropPanelBody.addEventListener('click', event => {
        const btn = event.target.closest('.cropOption');
        if (!btn) return;
        const cropId = btn.dataset.crop;
        const cb = cropPanelCallback;
        closeCropPicker();
        if (typeof SND !== 'undefined') SND.play('ui');
        if (typeof cb === 'function') cb(cropId);
    });
}
if (cropPanel) {
    cropPanel.addEventListener('click', event => {
        if (event.target === cropPanel) closeCropPicker();
    });
}
addEventListener('keydown', event => {
    if (!cropPanel || cropPanel.hidden) return;
    if (event.key === 'Escape') closeCropPicker();
});

window.openCropPicker = openCropPicker;
window.CROP_TYPES = CROP_TYPES;
window.CROP_ORDER = CROP_ORDER;
window.cropWeatherMultiplier = cropWeatherMultiplier;
window.weatherYieldMultiplier = weatherYieldMultiplier;
