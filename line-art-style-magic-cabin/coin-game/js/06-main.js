'use strict';

let lastT = 0;

function animate(ms) {
    requestAnimationFrame(animate);

    const time = ms * 0.001;
    const dt = Math.min(time - lastT, 0.05);
    lastT = time;

    updateCoins(dt);

    /* 原本的史莱姆 idle / working 动画 */
    updateSlimes(time, dt);

    if (
        typeof updateRoomDaily === 'function'
    ) {
        updateRoomDaily(dt, time);
    }

    /* 房间休息动作放在后面，覆盖 playerSlime 的普通 idle 动画 */
    if (
        typeof updateRoomRest === 'function'
    ) {
        updateRoomRest(time);
    }

    updateCamera(dt);
    updateAuto(time);

    renderer.render(
        scene,
        camera
    );
}

requestAnimationFrame(animate);
