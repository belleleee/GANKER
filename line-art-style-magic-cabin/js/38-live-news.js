'use strict';

/* ================================================================
   小屋实时新闻
   报刊社不再只印固定的十期"创刊号"，真正玩下去之后发生的事——主线推进、
   每日结算、批发大单、现金流告急——都会被记一笔，追加成报刊的新页面。
   ================================================================ */

const LIVE_NEWS_MAX = 24;
let liveNewsLog = [];

function currentGameplayDayForNews() {
    return typeof currentFarmDay === 'function' ? currentFarmDay() : 0;
}

function publishLiveNews(title, body, tag) {
    if (!title || !body) return;
    const day = currentGameplayDayForNews();
    const entry = {
        date: 'Day ' + Math.max(1, Math.trunc(Number(day) || 1)) + ' · ' + (tag || '本报快讯'),
        title: String(title).slice(0, 60),
        body: String(body).slice(0, 240),
        day
    };
    const prev = liveNewsLog[liveNewsLog.length - 1];
    if (prev && prev.title === entry.title && prev.day === entry.day) return;
    liveNewsLog.push(entry);
    if (liveNewsLog.length > LIVE_NEWS_MAX) liveNewsLog.shift();
    if (typeof window.showHintOverride === 'function') {
        window.showHintOverride('📰 报刊更新：' + entry.title);
    }
}

function getLiveNewsLog() {
    return liveNewsLog;
}

function captureLiveNewsState() {
    return { log: liveNewsLog.slice(-LIVE_NEWS_MAX) };
}

function applyLiveNewsState(state) {
    liveNewsLog = (state && Array.isArray(state.log))
        ? state.log.slice(-LIVE_NEWS_MAX).filter(e => e && e.title && e.body)
        : [];
}

window.publishLiveNews = publishLiveNews;
window.getLiveNewsLog = getLiveNewsLog;
window.captureLiveNewsState = captureLiveNewsState;
window.applyLiveNewsState = applyLiveNewsState;
