'use strict';

/* ================================================================
   天气改成"一天一种"：
   每到新的一天，系统会自动随机定下当天的天气；
   想改天气，可以花钱"祈天"，有成功率，不管成不成，钱都花出去了，
   而且当天最终也只会落地一种天气。
   这个天气会影响农田和茶场当天的收成倍率。
   ================================================================ */

const WEATHER_ATTEMPT_BASE_COST = 40;
const WEATHER_ATTEMPT_STEP_COST = 25;
const WEATHER_ATTEMPT_SUCCESS_CHANCE = 0.55;

let weatherFarmState = {
    day: -1,
    attemptsToday: 0
};

const weatherStatusEl = document.getElementById('weatherStatus');

function weatherFarmCoins() {
    return typeof cabinCoins === 'number' ? cabinCoins : 0;
}

function weatherAttemptCost() {
    return WEATHER_ATTEMPT_BASE_COST + weatherFarmState.attemptsToday * WEATHER_ATTEMPT_STEP_COST;
}

function renderWeatherStatus() {
    if (!weatherStatusEl || typeof wx === 'undefined' || typeof WX_NAME === 'undefined') return;
    const cost = weatherAttemptCost();
    weatherStatusEl.innerHTML =
        '今日天气：<b>' + WX_NAME[wx.type] + '</b>' +
        '<br>点上面的天气按钮可以花 <b>' + cost + '</b> 金币祈天改天气（成功率 ' +
        Math.round(WEATHER_ATTEMPT_SUCCESS_CHANCE * 100) + '%，不管成不成钱都要花掉）';
}

function ensureDailyWeatherRoll() {
    if (typeof currentFarmDay !== 'function' || typeof WX_LIST === 'undefined' || typeof setWeather !== 'function') return;
    const day = currentFarmDay();
    if (day === weatherFarmState.day) return;
    weatherFarmState.day = day;
    weatherFarmState.attemptsToday = 0;
    const pick = WX_LIST[Math.floor(Math.random() * WX_LIST.length)];
    setWeather(pick);
    if (typeof showHintOverride === 'function') {
        showHintOverride('新的一天，今天的天气是 <b>' + WX_NAME[pick] + '</b>');
    }
}

function attemptWeatherChange(target) {
    ensureDailyWeatherRoll();
    if (typeof wx === 'undefined') return;
    if (target === wx.type) {
        showHintOverride('今天已经是这个天气了');
        return;
    }
    const cost = weatherAttemptCost();
    if (weatherFarmCoins() < cost) {
        showHintOverride('祈天需要 ' + cost + ' 金币，你现在只有 ' + weatherFarmCoins());
        return;
    }
    if (typeof spendCabinCoins !== 'function' || !spendCabinCoins(cost, false)) return;
    weatherFarmState.attemptsToday++;
    const success = Math.random() < WEATHER_ATTEMPT_SUCCESS_CHANCE;
    if (success) {
        setWeather(target);
        showHintOverride('祈天成功——天说变就变，今天变成了 <b>' + WX_NAME[target] + '</b>（花费 ' + cost + ' 金币）');
    } else {
        showHintOverride('祈天没成，' + cost + ' 金币打了水漂——天不随人愿，今天还是 <b>' + WX_NAME[wx.type] + '</b>');
        renderWeatherStatus();
    }
    if (typeof saveGameState === 'function') saveGameState(false);
}

function onWeatherChanged() {
    renderWeatherStatus();
}

function updateWeatherFarming() {
    ensureDailyWeatherRoll();
    renderWeatherStatus();
}

function captureWeatherFarmState() {
    return {
        day: weatherFarmState.day,
        attemptsToday: weatherFarmState.attemptsToday
    };
}

function applyWeatherFarmState(raw) {
    weatherFarmState = {
        day: Number.isFinite(Number(raw && raw.day)) ? Math.trunc(Number(raw.day)) : -1,
        attemptsToday: Math.max(0, Math.trunc(Number(raw && raw.attemptsToday) || 0))
    };
    renderWeatherStatus();
}

window.attemptWeatherChange = attemptWeatherChange;
window.onWeatherChanged = onWeatherChanged;
window.updateWeatherFarming = updateWeatherFarming;
window.captureWeatherFarmState = captureWeatherFarmState;
window.applyWeatherFarmState = applyWeatherFarmState;
