'use strict';

/* ================================================================
   提示条
   新手引导（欢迎语序列、锁大门、地点/节点触发的一堆小贴士、操作说明
   参考面板）整个删掉了——不再靠系统主动教，靠玩家自己摸索和小屋里
   的对话去认识这个世界。这个文件现在只留一块最小的基础设施：
   showGuideCard()/showThemeReflection()，因为主线感想、现金流预警、
   赌博风险提示这几处还在用同一块屏幕提示条。
   ================================================================ */

/* 主线的自动推进轮询（22-main-story.js 的 pollAutoStageAdvance）原本
   要等新手引导放完才开始；引导已经没有了，直接标记为"已跳过"。 */
window.APP_ONBOARDING_DISMISSED = true;

const guideBanner = document.getElementById('guideBanner');
const guideBannerText = document.getElementById('guideBannerText');

let guideBannerHideTimer = null;

function showGuideCard(text, holdSeconds) {
    if (!guideBanner) return;
    guideBannerText.textContent = text;
    guideBanner.hidden = false;
    clearTimeout(guideBannerHideTimer);
    guideBannerHideTimer = setTimeout(() => {
        guideBanner.hidden = true;
    }, (holdSeconds || 6) * 1000);
}

/* 主线每推进一章，紧跟着主线弹窗关闭之后，用同一块提示条补一句感想。 */
function showThemeReflection(text) {
    setTimeout(() => showGuideCard(text, 8), 900);
}

window.showThemeReflection = showThemeReflection;

/* 10-main-loop.js 每帧还会调用这个函数名，留一个空实现，不用改主循环。 */
function updateOnboardingGuide() { }
window.updateOnboardingGuide = updateOnboardingGuide;
