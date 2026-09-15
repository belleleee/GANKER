'use strict';

/* ================================================================
   强化师傅的存在感
   三件事：
   1. speakerPillHtml() —— 对话框里凡是他说话，名字前带个小头像，
      跟"旁白"/"你"这些区分开，一眼能认出是他。
   2. 日常闲逛时，隔几分钟非阻断地插一句贴着当下情境的话——不是
      教程提示，是他这个人会说的话。
   3. 补几处原本没有他反应的具体行为（连续破产被锁店、第一次花钱
      祈天）的台词。
   ================================================================ */

function speakerPillHtml(speaker) {
    const isMentor = speaker === '师傅' || speaker === '宗庆后';
    return '<span class="mainStorySpeaker' + (isMentor ? ' mainStorySpeakerMentor' : '') + '">' +
        (isMentor ? '<img class="mentorAvatar" src="assets/ui/mentor-avatar.webp" alt="" aria-hidden="true">' : '') +
        speaker + '</span>';
}
window.speakerPillHtml = speakerPillHtml;

/* ---------------- 日常闲逛：隔一段时间插一句 ---------------- */

const MENTOR_AMBIENT_COOLDOWN_MIN = 240;
const MENTOR_AMBIENT_COOLDOWN_MAX = 420;
let mentorAmbientTimer = 90;

function pickRandomLine(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function mentorAmbientPool() {
    const lines = [];
    const hour = typeof curHour === 'function' ? curHour() : 12;
    const coins = typeof cabinCoins === 'number' ? cabinCoins : 0;
    const wxType = typeof wx !== 'undefined' ? wx.type : null;

    if (hour >= 22 || hour < 5) lines.push('这么晚还不睡？地不会因为你熬夜多长一寸。');
    if (hour >= 5 && hour < 8) lines.push('起这么早，是好事——早起的地，露水最养苗。');
    if (coins < 30) lines.push('兜里没剩几个钱了，先想想手头能周转的法子，别硬扛。');
    if (coins >= 5000) lines.push('手头宽裕了，也别忘了当初兜里只有100块的时候。');
    if (wxType === 'storm' || wxType === 'blizzard') lines.push('这天气，地里的活先缓一缓，人比作物金贵。');
    if (wxType === 'sunny') lines.push('好天气，别浪费在屋里晃悠。');
    if (typeof landState !== 'undefined' && landState && !landState.owned && landState.rentedUntilDay >= 0) {
        lines.push('地租着终究不踏实，攒够了就买断。');
    }

    /* 通用兜底，保证池子不会因为条件都没命中而空着 */
    lines.push(
        '别老站着，账不会自己动。',
        '发呆也是一种成本。',
        '钱这东西，攒得慢，花得快，多看两眼账本没坏处。',
        '这屋子，当年也乱糟糟的，现在像点样子了。',
        '别想太多，先把手头这件事做完。',
        '干什么都行，别空着手站在这儿。'
    );
    return lines;
}

function updateMentorAmbient(dt) {
    if (window.APP_SHELL_BLOCK_GAME || window.APP_GAME_MODAL_OPEN) return;
    mentorAmbientTimer -= dt || 0;
    if (mentorAmbientTimer > 0) return;
    mentorAmbientTimer = MENTOR_AMBIENT_COOLDOWN_MIN + Math.random() * (MENTOR_AMBIENT_COOLDOWN_MAX - MENTOR_AMBIENT_COOLDOWN_MIN);
    /* 序章还没过（人都还没正式认识）先别插话 */
    if (typeof mainStoryState === 'undefined' || mainStoryState.stage < 1) return;
    const pool = mentorAmbientPool();
    if (!pool.length) return;
    if (typeof showGuideCard === 'function') showGuideCard('师傅：' + pickRandomLine(pool), 6);
}
window.updateMentorAmbient = updateMentorAmbient;
