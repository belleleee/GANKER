'use strict';
let lastT=0;
function animate(ms){
 requestAnimationFrame(animate);
 const time=ms*.001,dt=Math.min(time-lastT,.05);lastT=time;
 updateCoin(dt);updateHelper(time);updateGameAuto(time);updateCamera(dt);
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
