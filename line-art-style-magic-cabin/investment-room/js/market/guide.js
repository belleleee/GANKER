'use strict';

/* ================================================================
   股市小屋对话式新手引导
   静态的知识卡片得自己去翻书架才看得到，跟"正犯难该点哪个"是脱节的。
   这里改成宗庆后开口说话、一句一句"继续"下去的对话框——第一次打开
   交易屏自动弹一次，之后点顶部"？"随时能再放一遍。
   ================================================================ */

const MARKET_GUIDE_STEPS = [
    { speaker: '宗庆后', text: '这屋子按钮是多，但其实就分四类事——先跟你说清楚，省得你瞎点。' },
    { speaker: '宗庆后', text: '左边一整排是所有股票的行情，先看看谁涨谁跌。' },
    { speaker: '宗庆后', text: '选中一只，中间会看到走势，还有它的营收、利润这些底细——这叫"基本面"，买之前先看这个，别光看涨跌。' },
    { speaker: '宗庆后', text: '看完了，右边就是买卖——买、卖、融资买，动的都是你自己的钱。' },
    { speaker: '你', text: '那"公司上市"那一项呢？' },
    { speaker: '宗庆后', text: '那是娃哈哈，你自己的公司。选中它，右边会多出"创始人套现""公司增发""并购"——这几个跟买卖别的股票不是一回事，钱进哪个账户都不一样，到时候你自己看。' },
    { speaker: '宗庆后', text: '不知道买什么的时候，先去地图上打听打听消息，或者看看新闻——账是能算的，别瞎猜。' },
    { speaker: '你', text: '记住了。' },
    { speaker: '宗庆后', text: '记不住也没事，右上角那个"？"随时能把我这段话再放一遍。' }
];

let marketGuideLayer = null;
let marketGuideIndex = 0;

function ensureMarketGuideDom() {
    if (marketGuideLayer) return;
    marketGuideLayer = document.createElement('div');
    marketGuideLayer.className = 'marketGuideLayer';
    marketGuideLayer.hidden = true;
    document.body.appendChild(marketGuideLayer);
    marketGuideLayer.addEventListener('click', event => {
        if (event.target === marketGuideLayer) closeMarketGuide();
        if (event.target.closest('[data-guide-action="next"]')) advanceMarketGuide();
        if (event.target.closest('[data-guide-action="skip"]')) closeMarketGuide();
    });
}

function renderMarketGuideStep() {
    const step = MARKET_GUIDE_STEPS[marketGuideIndex];
    const isLast = marketGuideIndex >= MARKET_GUIDE_STEPS.length - 1;
    marketGuideLayer.innerHTML =
        '<div class="marketGuideCard">' +
        '<p class="marketGuideKicker">股市小屋 · 引导 ' + (marketGuideIndex + 1) + '/' + MARKET_GUIDE_STEPS.length + '</p>' +
        '<p class="marketGuideLine"><span class="marketGuideSpeaker">' + step.speaker + '</span>' + step.text + '</p>' +
        '<div class="marketGuideActions">' +
        '<button type="button" class="marketGuideSkip" data-guide-action="skip">跳过</button>' +
        '<button type="button" class="marketGuideNext" data-guide-action="next">' + (isLast ? '知道了' : '继续') + '</button>' +
        '</div></div>';
}

function openMarketGuide() {
    ensureMarketGuideDom();
    marketGuideIndex = 0;
    renderMarketGuideStep();
    marketGuideLayer.hidden = false;
}

function closeMarketGuide() {
    if (marketGuideLayer) marketGuideLayer.hidden = true;
    if (typeof markInvestTipSeen === 'function') markInvestTipSeen('marketWelcomeGuide');
}

function advanceMarketGuide() {
    if (marketGuideIndex >= MARKET_GUIDE_STEPS.length - 1) {
        closeMarketGuide();
        return;
    }
    marketGuideIndex++;
    renderMarketGuideStep();
}

if (typeof document !== 'undefined') {
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && marketGuideLayer && !marketGuideLayer.hidden) closeMarketGuide();
    });
}

let marketGuideAutoChecked = false;
function maybeAutoShowMarketGuide() {
    if (marketGuideAutoChecked) return;
    marketGuideAutoChecked = true;
    const seen = typeof loadInvestTipSeen === 'function' ? loadInvestTipSeen() : {};
    if (!seen.marketWelcomeGuide) {
        setTimeout(openMarketGuide, 350);
    }
}

window.openMarketGuide = openMarketGuide;
window.maybeAutoShowMarketGuide = maybeAutoShowMarketGuide;
