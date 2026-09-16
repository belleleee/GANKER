'use strict';
/* ============ 音效系统：静默跳过缺失文件 ============ */
const SND = (() => {
    const NAMES = ['doorbell', 'ui', 'chim', 'toggle', 'door'];
    const pool = {};
    for (const n of NAMES) { const a = new Audio('sounds/' + n + '.mp3'); a.preload = 'auto'; pool[n] = a; }
    let vol = 0.6, on = true;
    function play(name) {
        if (!on) return;
        const a = pool[name];
        if (!a || a.error) return;
        try { const c = a.cloneNode(); c.volume = vol; c.play().catch(() => { }); } catch (e) { }
    }
    return {
        play,
        setVolume(v) { vol = clamp(v, 0, 1); },
        setEnabled(v) { on = !!v; }
    };
})();

/* ============ HUD ============ */
const coinPill = document.getElementById('coinPill');
const heartsPill = document.getElementById('heartsPill');
const heldPill = document.getElementById('heldPill');
const flashOverlay = document.getElementById('flashOverlay');
let coins = 0, lives = MAX_LIVES;
const CAFE_REVENUE_KEY = 'magicCabin.cafeRevenue.v1';
function updateHUD() { coinPill.textContent = '🪙 ' + coins; }
function updateHearts() { heartsPill.textContent = '❤️'.repeat(lives) + '🖤'.repeat(MAX_LIVES - lives); }
function updateHeldHUD() {
    heldPill.textContent = heldItem ? ('手持：' + DRINK_MAP[heldItem].icon + DRINK_MAP[heldItem].name) : '手持：空';
}
function flashScreen(color) {
    flashOverlay.style.transition = 'none';
    flashOverlay.style.background = color;
    flashOverlay.style.opacity = '0.35';
    requestAnimationFrame(() => {
        flashOverlay.style.transition = 'opacity .4s';
        flashOverlay.style.opacity = '0';
    });
}

/* 累加，不是覆盖——玩家在小屋认领这笔钱之前，可能已经连续打了
   好几局。之前这里直接拿本局 coins 覆盖存档，第二局一开始
   beginGame() 又会把上一局还没被主游戏领走的钱清空，等于"连续打
   两局只给一次的钱"。现在改成读出已经存的、还没被领走的金额，
   加上本局赚的，一起存回去；真正清零只在主游戏那边领取之后
   （claimCafeRevenue()）发生。 */
function saveCafeRevenue() {
    try {
        const existing = JSON.parse(localStorage.getItem(CAFE_REVENUE_KEY) || 'null');
        const pending = existing && typeof existing === 'object'
            ? Math.max(0, Math.trunc(Number(existing.amount) || 0))
            : 0;
        localStorage.setItem(CAFE_REVENUE_KEY, JSON.stringify({
            amount: pending + Math.max(0, Math.trunc(Number(coins) || 0)),
            savedAt: new Date().toISOString()
        }));
    } catch (err) { }
}

function loseLife() {
    lives--; updateHearts();
    flashScreen('#e05a5a'); SND.play('door');
    if (lives <= 0) endGame(false);
}

/* ============ 游戏状态机 ============ */
let gameState = 'start';
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const endTitle = document.getElementById('endTitle');
const endDesc = document.getElementById('endDesc');

function beginGame() {
    /* 不清空营业额存档——上一局如果还没被主游戏领走，这笔钱得先
       攒着，不能被"再来一局"直接抹掉。 */
    coins = 0; lives = MAX_LIVES; heldItem = null;
    player.x = 0; player.z = -3.3; yaw = Math.PI; pitch = -0.22;
    for (const c of customers.slice()) disposeCustomer(c);
    customers.length = 0;
    for (let i = 0; i < slotUsed.length; i++) slotUsed[i] = false;
    nextSpawnAt = performance.now() / 1000 + 1.0;
    gameState = 'playing';
    updateHUD(); updateHearts(); updateHeldHUD();
    startScreen.classList.remove('show'); endScreen.classList.remove('show');
    if (!IS_TOUCH) renderer.domElement.requestPointerLock();
    updateLockUI();
}
function endGame(win) {
    gameState = win ? 'win' : 'lose';
    saveCafeRevenue();
    if (document.pointerLockElement) document.exitPointerLock();
    for (const c of customers.slice()) disposeCustomer(c);
    customers.length = 0;
    endTitle.textContent = win ? '🎉 打烊大吉！' : '😢 关门大吉...';
    endDesc.textContent = win
        ? ('恭喜！营业额达到 ' + coins + ' 金币，返回小屋后会存入小金库。')
        : ('还差一点，最终赚了 ' + coins + ' 金币，返回小屋后也会存入小金库。');
    endScreen.classList.add('show');
    updateLockUI();
}
document.getElementById('startBtn').addEventListener('click', beginGame);
document.getElementById('restartBtn').addEventListener('click', beginGame);

const menuDot = document.getElementById('menuDot');
const menuPanel = document.getElementById('menuPanel');
menuDot.addEventListener('click', () => menuPanel.classList.toggle('open'));
const sfxToggle = document.getElementById('sfxToggle');
sfxToggle.addEventListener('click', () => {
    const on = !sfxToggle.classList.contains('on');
    sfxToggle.classList.toggle('on', on);
    SND.setEnabled(on);
});
document.getElementById('sfxSlider').addEventListener('input', e => SND.setVolume(parseFloat(e.target.value)));
addEventListener('beforeunload', saveCafeRevenue);

/* ============ 初始化场景内容 ============ */
buildRoom();
buildStations();
camera.position.set(player.x, EYE_HEIGHT, player.z);
camera.rotation.y = yaw; camera.rotation.x = pitch;

/* ============ 主循环 ============ */
let lastT = 0;
function animate(t) {
    requestAnimationFrame(animate);
    const time = t * 0.001;
    const dt = Math.min(time - lastT, 0.05); lastT = time;
    if (gameState === 'playing') {
        updatePlayer(dt);
        maybeSpawn(time);
        updateCustomers(dt, time);
        updateInteractHint();
    }
    renderer.render(scene, camera);
}
animate(0);
addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
