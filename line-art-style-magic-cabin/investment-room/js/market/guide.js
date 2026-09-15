'use strict';

/* ================================================================
   股市小屋对话式新手引导
   静态的知识卡片得自己去翻书架才看得到，跟"正犯难该点哪个"是脱节的。
   这里改成宗庆后开口说话、一句一句"继续"下去的对话框——第一次打开
   交易屏自动弹一次，之后点顶部"？"随时能再放一遍。
   ================================================================ */

const MARKET_GUIDE_STEPS = [
    { speaker: '宗庆后', text: '这屋子按钮是多，但其实就分四类事——研究、交易、创始人、资本运作。一样一样跟你说，别急。' },
    { speaker: '你', text: '那从哪儿看起？' },
    { speaker: '宗庆后', text: '先看【研究】。左边一整排是所有股票的行情，绿的涨红的跌，先扫一眼谁在动。' },
    { speaker: '宗庆后', text: '点一只股票，中间会出来走势图，下面还有它的营收、利润、现金、负债——这叫"基本面"，是真东西，不是猜的。' },
    { speaker: '宗庆后', text: '基本面旁边有个框，让你自己填一个"我觉得它值多少钱"。填了之后，页面会告诉你现价是偏高还是偏低——这不是给你答案，是逼你自己先算一遍。' },
    { speaker: '你', text: '新闻呢？' },
    { speaker: '宗庆后', text: '资讯栏在右下角。新闻不是全信的——每条后面标了来源，"官方公告"比"论坛传闻"可信得多。可信度中等的消息过几天还会真正"揭晓"一次，是真是假到时候你能看到。' },
    { speaker: '宗庆后', text: '光看屏幕不够。地图上农场主、咖啡馆顾客、杂货铺，走近了能打听到消息——但每天只能打听3次，得想清楚今天去哪儿听。' },
    { speaker: '你', text: '看完这些，才轮到买卖？' },
    { speaker: '宗庆后', text: '对，这就是【交易】层了。右边买、卖、融资买——动的都是你自己的钱，跟公司账没关系。' },
    { speaker: '宗庆后', text: '买之前我会问你一句"为什么买"。理由不影响能不能买，但算过账的、听消息的、纯凭感觉的，我心里数不一样。' },
    { speaker: '宗庆后', text: '融资买是借钱加仓，赚得多亏得也多，权益跌太狠会被强制平仓——不是不能碰，是别把全部身家都押上去。' },
    { speaker: '你', text: '那"公司上市"那一项呢？' },
    { speaker: '宗庆后', text: '那是娃哈哈，你自己的公司——这就到【创始人】层了。选中它，右边会多出几个别的股票没有的按钮。' },
    { speaker: '宗庆后', text: '"创始人套现"是卖你个人手里的股份，折价出手，钱进你自己腰包，公司账上不会多一分。' },
    { speaker: '宗庆后', text: '"公司增发"正好反过来——发新股卖给市场，钱进公司账上，你手里股数没变，但总股数变多了，持股比例被动稀释。' },
    { speaker: '宗庆后', text: '这两个还有一件事得盯着："控制权"。持股跌破67%开始有被联合否决的风险，跌破34%基本就说了不算了。' },
    { speaker: '宗庆后', text: '再往下是【资本运作】——"并购"，花公司账上的钱把别的上市公司整个买下来，对方直接退市。跟买它的股票完全是两回事，一个动你个人仓位，一个动公司资产。' },
    { speaker: '你', text: '信息这么多，我怎么知道自己判断得对不对？' },
    { speaker: '宗庆后', text: '每满7天，资讯栏会弹一张复盘卡——这周资产变化多少、你信过的消息最后有多少条是真的。不是看赚了多少，是看你判断的准头有没有在变好。' },
    { speaker: '你', text: '记住了。' },
    { speaker: '宗庆后', text: '记不住也没事，右上角那个"？"随时能把这段话整个再放一遍。先去研究层看两眼，再决定买不买——这是最稳的顺序。' }
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
