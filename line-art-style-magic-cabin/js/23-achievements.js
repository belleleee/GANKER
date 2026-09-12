'use strict';

/* ================================================================
   成就系统
   周期性地检查各个系统的已有数据（金币、作物、茶叶、主线进度、
   抛硬币小游戏和股市小屋各自的存档），达成条件就解锁。
   对于"做过几次"这类无法从现有状态反推的事件，则通过 noteAchievementEvent
   轻量记录进成就统计里，随成就存档一起保存。
   ================================================================ */

function peekCoinGameSave() {
    try {
        const raw = typeof readJson === 'function' && typeof cabinSaveKey === 'function'
            ? readJson(cabinSaveKey(), null)
            : null;
        const economy = raw && raw.economy;
        return (economy && economy.coinGame) || null;
    } catch (err) {
        return null;
    }
}

function peekInvestmentRoomSave() {
    try {
        const raw = typeof readJson === 'function' && typeof cabinSaveKey === 'function'
            ? readJson(cabinSaveKey(), null)
            : null;
        const economy = raw && raw.economy;
        return (economy && economy.investment) || null;
    } catch (err) {
        return null;
    }
}

function peekCropCount(id) {
    return typeof cropStorage !== 'undefined' ? Math.max(0, Number(cropStorage[id]) || 0) : 0;
}

function totalStoredCrops() {
    return peekCropCount('turnip') + peekCropCount('cabbage') + peekCropCount('rice') + peekCropCount('potato');
}

const ACHIEVEMENT_STAT_DEFAULTS = {
    totalHarvests: 0,
    badWeatherHarvests: 0,
    goodWeatherHarvests: 0,
    tillCount: 0,
    plantCount: 0,
    waterCount: 0,
    seedBuys: 0,
    weatherAttempts: 0,
    weatherSuccesses: 0,
    interactions: 0,
    magicInteractions: 0,
    newspaperReads: 0,
    wellDraws: 0,
    cafeEntries: 0,
    coinShopEntries: 0,
    investmentEntries: 0,
    deliveryCount: 0
};

function makeAchievementStats(raw) {
    const stats = Object.assign({}, ACHIEVEMENT_STAT_DEFAULTS);
    if (raw && typeof raw === 'object') {
        Object.keys(ACHIEVEMENT_STAT_DEFAULTS).forEach(key => {
            stats[key] = Math.max(0, Math.trunc(Number(raw[key]) || 0));
        });
    }
    const byCrop = raw && raw.harvestByCrop && typeof raw.harvestByCrop === 'object' ? raw.harvestByCrop : {};
    stats.harvestByCrop = {
        turnip: Math.max(0, Math.trunc(Number(byCrop.turnip) || 0)),
        cabbage: Math.max(0, Math.trunc(Number(byCrop.cabbage) || 0)),
        rice: Math.max(0, Math.trunc(Number(byCrop.rice) || 0)),
        potato: Math.max(0, Math.trunc(Number(byCrop.potato) || 0))
    };
    return stats;
}

function getAchievementStats() {
    if (!achievementState.stats) achievementState.stats = makeAchievementStats(null);
    return achievementState.stats;
}

function noteAchievementEvent(type, detail) {
    const stats = getAchievementStats();
    const data = detail || {};
    let recorded = true;
    if (type === 'farmHarvest') {
        const cropId = ['turnip', 'cabbage', 'rice', 'potato'].indexOf(data.cropId) >= 0 ? data.cropId : 'turnip';
        stats.totalHarvests++;
        stats.harvestByCrop[cropId] = (stats.harvestByCrop[cropId] || 0) + 1;
        if (Number(data.multiplier) < 1) stats.badWeatherHarvests++;
        if (Number(data.multiplier) > 1) stats.goodWeatherHarvests++;
    } else if (type === 'farmTill') {
        stats.tillCount++;
    } else if (type === 'farmPlant') {
        stats.plantCount++;
    } else if (type === 'farmWater') {
        stats.waterCount++;
    } else if (type === 'seedBuy') {
        stats.seedBuys += Math.max(1, Math.trunc(Number(data.amount) || 1));
    } else if (type === 'weatherAttempt') {
        stats.weatherAttempts++;
    } else if (type === 'weatherSuccess') {
        stats.weatherSuccesses++;
    } else if (type === 'interaction') {
        stats.interactions++;
        if (data && data.magic) stats.magicInteractions++;
    } else if (type === 'newspaperRead') {
        stats.newspaperReads++;
    } else if (type === 'wellDraw') {
        stats.wellDraws++;
    } else if (type === 'enterCafe') {
        stats.cafeEntries++;
    } else if (type === 'enterCoinShop') {
        stats.coinShopEntries++;
    } else if (type === 'enterInvestmentRoom') {
        stats.investmentEntries++;
    } else if (type === 'deliveryDone') {
        stats.deliveryCount++;
    } else {
        recorded = false;
    }
    if (recorded) achievementStatsDirty = true;
}

const ACHIEVEMENT_CATEGORIES = [
    { id: 'farm', label: '农场', color: '#6fa84f' },
    { id: 'wealth', label: '财富', color: '#c8962c' },
    { id: 'tea', label: '茶场', color: '#3f9a7a' },
    { id: 'story', label: '主线', color: '#9c6bd8' },
    { id: 'coin', label: '钱滚钱', color: '#d87b3f' },
    { id: 'invest', label: '股市', color: '#3f7fd8' },
    { id: 'explore', label: '探索小屋', color: '#5b8fa8' },
    { id: 'interaction', label: '交互', color: '#8a7bd8' },
    { id: 'charity', label: '慈善', color: '#5ba872' },
    { id: 'delivery', label: '代销', color: '#c86b4a' }
];

const ACHIEVEMENTS = [
    {
        id: 'first_turnip',
        category: 'farm',
        icon: '🌱',
        title: '新手上路',
        desc: '收获第一颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 1
    },
    {
        id: 'turnip_farmer',
        category: 'farm',
        icon: '🥕',
        title: '萝卜大户',
        desc: '仓库里存下 50 颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 50
    },
    {
        id: 'first_cabbage',
        category: 'farm',
        icon: '🥬',
        title: '第一棵白菜',
        desc: '收获第一棵白菜',
        check: () => peekCropCount('cabbage') >= 1
    },
    {
        id: 'first_rice',
        category: 'farm',
        icon: '🌾',
        title: '第一束水稻',
        desc: '收获第一束水稻',
        check: () => peekCropCount('rice') >= 1
    },
    {
        id: 'first_potato',
        category: 'farm',
        icon: '🥔',
        title: '第一颗土豆',
        desc: '收获第一颗土豆',
        check: () => peekCropCount('potato') >= 1
    },
    {
        id: 'cabbage_farmer',
        category: 'farm',
        icon: '🥬',
        title: '白菜成垛',
        desc: '仓库里存下 50 棵白菜',
        check: () => peekCropCount('cabbage') >= 50
    },
    {
        id: 'rice_farmer',
        category: 'farm',
        icon: '🌾',
        title: '稻浪初起',
        desc: '仓库里存下 50 束水稻',
        check: () => peekCropCount('rice') >= 50
    },
    {
        id: 'potato_farmer',
        category: 'farm',
        icon: '🥔',
        title: '土豆地窖',
        desc: '仓库里存下 50 颗土豆',
        check: () => peekCropCount('potato') >= 50
    },
    {
        id: 'four_crop_farmer',
        category: 'farm',
        icon: '🧺',
        title: '四季菜篮',
        desc: '萝卜、白菜、水稻、土豆都至少收获过一次',
        check: () => ['turnip', 'cabbage', 'rice', 'potato'].every(id => peekCropCount(id) >= 1)
    },
    {
        id: 'weather_misread',
        category: 'farm',
        icon: '🌧️',
        title: '看天吃饭',
        desc: '在不适合的天气里收获作物，导致一次减产',
        check: () => getAchievementStats().badWeatherHarvests >= 1
    },
    {
        id: 'weather_lessons',
        category: 'farm',
        icon: '☔',
        title: '天不帮忙',
        desc: '累计经历 5 次天气减产',
        check: () => getAchievementStats().badWeatherHarvests >= 5
    },
    {
        id: 'weather_reader',
        category: 'farm',
        icon: '☀️',
        title: '会看天色',
        desc: '累计吃到 5 次天气加成',
        check: () => getAchievementStats().goodWeatherHarvests >= 5
    },
    {
        id: 'grain_keeper',
        category: 'farm',
        icon: '🏚️',
        title: '满仓不是梦',
        desc: '仓库里的四类作物合计达到 300',
        check: () => totalStoredCrops() >= 300
    },
    {
        id: 'first_gold',
        category: 'wealth',
        icon: '🪙',
        title: '第一桶金',
        desc: '金币达到 200',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 200
    },
    {
        id: 'small_fortune',
        category: 'wealth',
        icon: '💰',
        title: '小有积蓄',
        desc: '金币达到 1000',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 1000
    },
    {
        id: 'comfortable_cash',
        category: 'wealth',
        icon: '💵',
        title: '手头宽裕',
        desc: '金币达到 5000',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 5000
    },
    {
        id: 'ten_thousand_coins',
        category: 'wealth',
        icon: '🏛️',
        title: '万元户',
        desc: '金币达到 10000',
        check: () => typeof cabinCoins === 'number' && cabinCoins >= 10000
    },
    {
        id: 'tea_master',
        category: 'tea',
        icon: '🍵',
        title: '茶艺初成',
        desc: '累计采摘 20 片茶叶',
        check: () => typeof teaLeafCount !== 'undefined' && teaLeafCount >= 20
    },
    {
        id: 'story_chapter1',
        category: 'story',
        icon: '📖',
        title: '主线 · 序章',
        desc: '读完第一章主线，解锁茶场',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('tea')
    },
    {
        id: 'story_chapter2',
        category: 'story',
        icon: '📖',
        title: '主线 · 中章',
        desc: '解锁钱滚钱商店',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('coin')
    },
    {
        id: 'story_chapter3',
        category: 'story',
        icon: '📖',
        title: '主线 · 终章',
        desc: '解锁股市小屋，主线全部读完',
        check: () => typeof window.isMainStoryFeatureUnlocked === 'function' && window.isMainStoryFeatureUnlocked('investment')
    },
    {
        id: 'first_employee',
        category: 'coin',
        icon: '🐌',
        title: '雇佣关系',
        desc: '在钱滚钱商店雇到第一个史莱姆助手',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.helperCount) >= 1;
        }
    },
    {
        id: 'first_trade',
        category: 'invest',
        icon: '📈',
        title: '股市新手',
        desc: '在股市小屋买入第一支股票',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && save.holdings && Object.keys(save.holdings).length > 0;
        }
    },
    {
        id: 'farm_hire',
        category: 'farm',
        icon: '🧑‍🌾',
        title: '农场雇佣关系',
        desc: '雇到第一个农场帮手',
        check: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true
    },
    {
        id: 'turnip_tycoon',
        category: 'farm',
        icon: '🥬',
        title: '萝卜富翁',
        desc: '仓库里存下 200 颗萝卜',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 200
    },
    {
        id: 'star_relic',
        category: 'farm',
        icon: '⭐',
        title: '意外之喜',
        desc: '收获时拾到一枚星石',
        check: () => typeof cropStorage !== 'undefined' && (cropStorage.starRelic || 0) >= 1
    },
    {
        id: 'coin_bankrupt',
        category: 'coin',
        icon: '📉',
        title: '血本无归',
        desc: '在钱滚钱商店把钱包输到见底',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.wallet) <= 0 && Number(save.lost) > 0;
        }
    },
    {
        id: 'coin_tycoon',
        category: 'coin',
        icon: '🏦',
        title: '钱滚钱大亨',
        desc: '在钱滚钱商店累计赚到 1000 金币',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.earned) >= 1000;
        }
    },
    {
        id: 'coin_full_house',
        category: 'coin',
        icon: '🐌',
        title: '满编团队',
        desc: '雇满 4 个史莱姆助手',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.helperCount) >= 4;
        }
    },
    {
        id: 'invest_profit',
        category: 'invest',
        icon: '🐂',
        title: '股市老手',
        desc: '在股市小屋累计实现盈利 500 金币',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && Number(save.realizedGain) >= 500;
        }
    },
    {
        id: 'invest_loss',
        category: 'invest',
        icon: '🐻',
        title: '割肉离场',
        desc: '在股市小屋累计亏损 300 金币',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && Number(save.realizedLoss) >= 300;
        }
    },
    {
        id: 'explore_fire',
        category: 'explore',
        icon: '🔥',
        title: '炉火可亲',
        desc: '点亮小屋的壁炉',
        check: () => typeof fireLit !== 'undefined' && fireLit === true
    },
    {
        id: 'explore_cat',
        category: 'explore',
        icon: '🐱',
        title: '唤醒猫咪',
        desc: '把小屋里打盹的猫叫醒',
        check: () => typeof catAwake !== 'undefined' && catAwake === true
    },
    {
        id: 'explore_book',
        category: 'explore',
        icon: '📗',
        title: '翻开魔法书',
        desc: '打开桌上的那本魔法书',
        check: () => typeof bookOn !== 'undefined' && bookOn === true
    },
    {
        id: 'explore_chest',
        category: 'explore',
        icon: '🗝️',
        title: '百宝箱',
        desc: '打开楼梯下的储物箱',
        check: () => (typeof chestOpen !== 'undefined' && chestOpen === true) || (typeof storageOpen !== 'undefined' && storageOpen === true)
    },
    {
        id: 'explore_all',
        category: 'explore',
        icon: '🏠',
        title: '小屋通透',
        desc: '同时点亮壁炉、油灯、灯笼，叫醒猫咪，还翻开了魔法书',
        check: () => typeof fireLit !== 'undefined' && fireLit && lampLit && lanternLit && catAwake && bookOn
    },
    {
        id: 'first_interaction',
        category: 'interaction',
        icon: '👆',
        title: '伸手摸摸',
        desc: '完成第一次场景交互',
        check: () => getAchievementStats().interactions >= 1
    },
    {
        id: 'interaction_habit',
        category: 'interaction',
        icon: '🖐️',
        title: '到处试试',
        desc: '累计完成 20 次场景交互',
        check: () => getAchievementStats().interactions >= 20
    },
    {
        id: 'interaction_collector',
        category: 'interaction',
        icon: '✨',
        title: '什么都要碰一下',
        desc: '累计完成 100 次场景交互',
        check: () => getAchievementStats().interactions >= 100
    },
    {
        id: 'magic_touch',
        category: 'interaction',
        icon: '🪄',
        title: '魔法手感',
        desc: '累计触发 20 次魔法物件交互',
        check: () => getAchievementStats().magicInteractions >= 20
    },
    {
        id: 'well_keeper',
        category: 'interaction',
        icon: '💧',
        title: '井边熟客',
        desc: '在水井打过 5 次水',
        check: () => getAchievementStats().wellDraws >= 5
    },
    {
        id: 'newspaper_reader',
        category: 'interaction',
        icon: '📰',
        title: '读报的人',
        desc: '阅读过魔女小屋报刊',
        check: () => getAchievementStats().newspaperReads >= 1
    },
    {
        id: 'seed_shopper',
        category: 'interaction',
        icon: '🛒',
        title: '种子采购员',
        desc: '累计购买 20 包种子',
        check: () => getAchievementStats().seedBuys >= 20
    },
    {
        id: 'weather_prayer',
        category: 'interaction',
        icon: '🌦️',
        title: '和天气谈判',
        desc: '第一次花钱祈天',
        check: () => getAchievementStats().weatherAttempts >= 1
    },
    {
        id: 'weather_bargain',
        category: 'interaction',
        icon: '🌤️',
        title: '天遂人愿',
        desc: '祈天成功 3 次',
        check: () => getAchievementStats().weatherSuccesses >= 3
    },
    {
        id: 'tool_cycle',
        category: 'interaction',
        icon: '🧰',
        title: '工具轮班',
        desc: '完成过翻地、播种、浇水、收获四种农活',
        check: () => {
            const s = getAchievementStats();
            return s.tillCount >= 1 && s.plantCount >= 1 && s.waterCount >= 1 && s.totalHarvests >= 1;
        }
    },
    {
        id: 'went_to_work',
        category: 'interaction',
        icon: '☕',
        title: '去咖啡馆看看',
        desc: '从主场景进入过线稿咖啡馆',
        check: () => getAchievementStats().cafeEntries >= 1
    },
    {
        id: 'risk_room_visit',
        category: 'interaction',
        icon: '🎲',
        title: '走进风险屋',
        desc: '从主场景进入过钱滚钱商店',
        check: () => getAchievementStats().coinShopEntries >= 1
    },
    {
        id: 'market_room_visit',
        category: 'interaction',
        icon: '📊',
        title: '第一次看盘',
        desc: '从主场景进入过股市小屋',
        check: () => getAchievementStats().investmentEntries >= 1
    },
    {
        id: 'steady_farmer',
        category: 'wealth',
        icon: '🌾',
        title: '薄利多销',
        desc: '从没进过钱滚钱商店，光靠种地开店把金币攒到 1500',
        check: () => {
            if (typeof cabinCoins !== 'number' || cabinCoins < 1500) return false;
            const save = peekCoinGameSave();
            return !save || !Number(save.helperCount);
        }
    },
    {
        id: 'two_hands_working',
        category: 'farm',
        icon: '🤝',
        title: '授人以渔',
        desc: '农场和茶场的帮手同时在替你干活',
        check: () => typeof farmHireState !== 'undefined' && farmHireState.hired === true &&
            typeof teaHireState !== 'undefined' && teaHireState.hired === true
    },
    {
        id: 'gambler_warned',
        category: 'coin',
        icon: '🃏',
        title: '赌徒的一夜',
        desc: '在钱滚钱商店被投机风险的警示逮个正着',
        check: () => {
            const save = peekCoinGameSave();
            return !!save && Number(save.addictionWarnings) >= 1;
        }
    },
    {
        id: 'paper_rich',
        category: 'invest',
        icon: '📄',
        title: '纸上富贵',
        desc: '在股市小屋同时持有 3 支以上股票，却一次也没卖出变现',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && save.holdings && Object.keys(save.holdings).length >= 3 && !Number(save.realizedGain);
        }
    },
    {
        id: 'cash_out_in_time',
        category: 'invest',
        icon: '🎯',
        title: '见好就收',
        desc: '在股市小屋累计兑现盈利 300 金币，且亏损始终没超过 100',
        check: () => {
            const save = peekInvestmentRoomSave();
            return !!save && Number(save.realizedGain) >= 300 && Number(save.realizedLoss) <= 100;
        }
    },
    {
        id: 'one_track_mind',
        category: 'farm',
        icon: '🥕',
        title: '一根筋',
        desc: '仓库里存下 500 颗萝卜——肯把一件事做到底的人，差不了',
        check: () => typeof cropStorage !== 'undefined' && cropStorage.turnip >= 500
    },
    {
        id: 'back_from_the_edge',
        category: 'coin',
        icon: '🧗',
        title: '悬崖勒马',
        desc: '在钱滚钱商店血本无归过一次之后，靠自己重新攒回 500 金币',
        check: () => {
            const save = peekCoinGameSave();
            return !!achievementState.unlocked['coin_bankrupt'] && !!save && Number(save.wallet) >= 500;
        }
    },
    {
        id: 'burned_by_pitch',
        category: 'wealth',
        icon: '📉',
        title: '经一堑',
        desc: '被上门的"稳赚不赔"项目坑过 3 次',
        check: () => typeof window.getFinancingStats === 'function' && window.getFinancingStats().losses >= 3
    },
    {
        id: 'ad_taxed',
        category: 'wealth',
        icon: '📣',
        title: '被广告收割',
        desc: '被突发广告事件扣过一次金币',
        check: () => typeof window.getWealthEventStats === 'function' && window.getWealthEventStats().adHits >= 1
    },
    {
        id: 'ad_resistant',
        category: 'wealth',
        icon: '🧾',
        title: '营销成本',
        desc: '累计遇到 5 次突发广告事件',
        check: () => typeof window.getWealthEventStats === 'function' && window.getWealthEventStats().adHits >= 5
    },
    {
        id: 'lucky_pitch',
        category: 'wealth',
        icon: '🍀',
        title: '慧眼识金',
        desc: '接下一笔上门融资，居然真赚到了',
        check: () => typeof window.getFinancingStats === 'function' && window.getFinancingStats().wins >= 1
    },
    {
        id: 'tea_first_batch',
        category: 'tea',
        icon: '📦',
        title: '手工茶第一单',
        desc: '在制茶小屋里走完晒茶→炒茶→打包一整套流程，卖出第一批成品茶',
        check: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 1
    },
    {
        id: 'tea_batch_master',
        category: 'tea',
        icon: '🍱',
        title: '制茶老师傅',
        desc: '累计打包卖出 10 批成品茶',
        check: () => typeof teaProcessState !== 'undefined' && teaProcessState.finished >= 10
    },
    {
        id: 'charity_starter',
        category: 'charity',
        icon: '🪙',
        title: '热心肠',
        desc: '累计捐款达到 100 金币',
        check: () => typeof window.getCharityTotalDonated === 'function' && window.getCharityTotalDonated() >= 100
    },
    {
        id: 'charity_regular',
        category: 'charity',
        icon: '❤️',
        title: '热心人',
        desc: '累计捐款达到 500 金币',
        check: () => typeof window.getCharityTotalDonated === 'function' && window.getCharityTotalDonated() >= 500
    },
    {
        id: 'charity_first_choice',
        category: 'charity',
        icon: '🤲',
        title: '第一次伸手相助',
        desc: '完成第一次慈善捐款',
        check: () => typeof window.getWealthEventStats === 'function' && window.getWealthEventStats().charityDonations >= 1
    },
    {
        id: 'charity_three_times',
        category: 'charity',
        icon: '🌱',
        title: '善意会重复',
        desc: '累计完成 3 次慈善捐款',
        check: () => typeof window.getWealthEventStats === 'function' && window.getWealthEventStats().charityDonations >= 3
    },
    {
        id: 'charity_big_gift',
        category: 'charity',
        icon: '🎁',
        title: '大额捐赠',
        desc: '单次捐款达到 500 金币',
        check: () => typeof window.getWealthEventStats === 'function' && window.getWealthEventStats().charityMaxSingle >= 500
    },
    {
        id: 'cafe_first_shift',
        category: 'wealth',
        icon: '☕',
        title: '打工人',
        desc: '第一次去咖啡馆打工，赚到营业收入',
        check: () => typeof window.getCafeTotalRevenue === 'function' && window.getCafeTotalRevenue() >= 1
    },
    {
        id: 'cafe_barista',
        category: 'wealth',
        icon: '🧋',
        title: '金牌咖啡师',
        desc: '咖啡馆累计营业收入达到 500 金币',
        check: () => typeof window.getCafeTotalRevenue === 'function' && window.getCafeTotalRevenue() >= 500
    },
    {
        id: 'land_allin',
        category: 'farm',
        icon: '🎲',
        title: '孤注一掷',
        desc: '身上没剩几个钱的时候，还是把那块荒地租了下来',
        check: () => typeof landState !== 'undefined' && landState.rentedUntilDay >= 0
    },
    {
        id: 'land_owner',
        category: 'farm',
        icon: '📜',
        title: '地契到手',
        desc: '把租的地直接买断，从此这块地是自己的了',
        check: () => typeof landState !== 'undefined' && landState.owned === true
    },
    {
        id: 'charity_grand',
        category: 'charity',
        icon: '🏅',
        title: '大慈善家',
        desc: '累计捐款达到 2000 金币——赚钱是本事，舍得给出去，是另一种本事',
        check: () => typeof window.getCharityTotalDonated === 'function' && window.getCharityTotalDonated() >= 2000
    },
    {
        id: 'first_delivery',
        category: 'delivery',
        icon: '📦',
        title: '第一单生意',
        desc: '接下并送完第一单代销订单',
        check: () => getAchievementStats().deliveryCount >= 1
    },
    {
        id: 'delivery_regular',
        category: 'delivery',
        icon: '🚲',
        title: '走街串巷',
        desc: '累计送完 10 单代销订单——这就是当年三轮车摆摊的手艺',
        check: () => getAchievementStats().deliveryCount >= 10
    }
];

let achievementState = { unlocked: {}, stats: makeAchievementStats(null) };
let achievementStatsDirty = false;
let achievementPollTimer = 0;

const achievementsPanel = document.getElementById('achievementsPanel');
const achievementsList = document.getElementById('achievementsList');
const achievementsProgress = document.getElementById('achievementsProgress');
const achievementsBadge = document.getElementById('achievementsBadge');
const closeAchievementsBtn = document.getElementById('closeAchievementsBtn');
const achievementsMenuBtn = document.getElementById('achievementsMenuBtn');

function unlockedCount() {
    return Object.keys(achievementState.unlocked).filter(id => achievementState.unlocked[id]).length;
}

function renderAchievementsPanel() {
    if (!achievementsList) return;
    achievementsList.innerHTML = ACHIEVEMENT_CATEGORIES.map(cat => {
        const items = ACHIEVEMENTS.filter(a => a.category === cat.id);
        if (!items.length) return '';
        const cards = items.map(a => {
            const on = !!achievementState.unlocked[a.id];
            return '<div class="achievementCard' + (on ? ' on' : '') + '" style="--accent:' + cat.color + '">' +
                '<div class="achievementIcon">' + (on ? a.icon : '🔒') + '</div>' +
                '<div class="achievementBody"><h3>' + a.title + '</h3><p>' + a.desc + '</p></div>' +
                (on ? '<div class="achievementRibbon">✓</div>' : '') +
                '</div>';
        }).join('');
        return '<section class="achievementGroup">' +
            '<h4 class="achievementGroupTitle" style="--accent:' + cat.color + '">' + cat.label + '</h4>' +
            '<div class="achievementGrid">' + cards + '</div>' +
            '</section>';
    }).join('');
    if (achievementsProgress) {
        const total = ACHIEVEMENTS.length;
        const done = unlockedCount();
        const pct = total ? Math.round(done / total * 100) : 0;
        achievementsProgress.innerHTML = '<span>' + done + ' / ' + total + ' 已达成</span>' +
            '<div class="achievementBar"><div class="achievementBarFill" style="width:' + pct + '%"></div></div>';
    }
}

function refreshAchievementsBadge() {
    if (!achievementsBadge) return;
    const n = unlockedCount();
    achievementsBadge.textContent = n + '/' + ACHIEVEMENTS.length;
    achievementsBadge.hidden = false;
}

function pollAchievements() {
    let changed = false;
    ACHIEVEMENTS.forEach(a => {
        if (achievementState.unlocked[a.id]) return;
        let hit = false;
        try {
            hit = !!a.check();
        } catch (err) {
            hit = false;
        }
        if (hit) {
            achievementState.unlocked[a.id] = true;
            changed = true;
            if (typeof showHintOverride === 'function') {
                showHintOverride('🏆 达成成就：' + a.title);
            }
            if (typeof SND !== 'undefined') SND.play('chim');
        }
    });
    if (changed || achievementStatsDirty) {
        refreshAchievementsBadge();
        if (achievementsPanel && !achievementsPanel.hidden) renderAchievementsPanel();
        achievementStatsDirty = false;
        if (typeof saveGameState === 'function') saveGameState(false);
    }
}

function updateAchievements(dt) {
    achievementPollTimer -= dt || 0;
    if (achievementPollTimer > 0) return;
    achievementPollTimer = 1.5;
    pollAchievements();
}

function openAchievementsPanel() {
    if (!achievementsPanel) return;
    renderAchievementsPanel();
    achievementsPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeAchievementsPanel() {
    if (!achievementsPanel) return;
    achievementsPanel.hidden = true;
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function captureAchievementState() {
    return {
        unlocked: Object.assign({}, achievementState.unlocked),
        stats: makeAchievementStats(achievementState.stats)
    };
}

function applyAchievementState(raw) {
    const unlocked = {};
    if (raw && raw.unlocked && typeof raw.unlocked === 'object') {
        ACHIEVEMENTS.forEach(a => {
            if (raw.unlocked[a.id]) unlocked[a.id] = true;
        });
    }
    achievementState = { unlocked, stats: makeAchievementStats(raw && raw.stats) };
    achievementStatsDirty = false;
    refreshAchievementsBadge();
}

if (achievementsMenuBtn) achievementsMenuBtn.addEventListener('click', openAchievementsPanel);
if (closeAchievementsBtn) closeAchievementsBtn.addEventListener('click', closeAchievementsPanel);
if (achievementsPanel) {
    achievementsPanel.addEventListener('click', event => {
        if (event.target === achievementsPanel) closeAchievementsPanel();
    });
}
addEventListener('keydown', event => {
    if (!achievementsPanel || achievementsPanel.hidden) return;
    if (event.key === 'Escape') closeAchievementsPanel();
});

refreshAchievementsBadge();

window.updateAchievements = updateAchievements;
window.captureAchievementState = captureAchievementState;
window.applyAchievementState = applyAchievementState;
window.noteAchievementEvent = noteAchievementEvent;
