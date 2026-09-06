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
    if (document.pointerLockElement) document.exitPointerLock();
    for (const c of customers.slice()) disposeCustomer(c);
    customers.length = 0;
    endTitle.textContent = win ? '🎉 打烊大吉！' : '😢 关门大吉...';
    endDesc.textContent = win
        ? ('恭喜！营业额达到 ' + coins + ' 金币，成功打烊！')
        : ('还差一点，最终赚了 ' + coins + ' 金币，再试一次吧！');
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
