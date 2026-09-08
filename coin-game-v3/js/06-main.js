
'use strict';

let lastT=0;
function animate(ms){
  requestAnimationFrame(animate);
  const time=ms*.001;
  const dt=Math.min(time-lastT,.05);lastT=time;

  updateCoins(dt);
  updateSlimes(time);
  updateAuto(time);
  updateCamera(dt);

  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
