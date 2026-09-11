closeScreenPanel.addEventListener('click', () => {
  screenPanel.hidden = true;
});

screenPanel.addEventListener('click', event => {
  if (event.target === screenPanel) screenPanel.hidden = true;
});

dashBody.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button) {
    if (button.dataset.action === 'nextDay') {
      advanceMarketDay();
      renderScreenPanel(activeScreen);
      return;
    }
    const stockId = button.dataset.stock;
    if (!stockId) return;
    if (button.dataset.action === 'buy') buyStock(stockId, 1);
    if (button.dataset.action === 'sell') sellStock(stockId, 1);
    if (button.dataset.action === 'short') shortStock(stockId, 1);
    if (button.dataset.action === 'cover') coverShort(stockId, 1);
    if (button.dataset.action === 'rumorGood') spreadRumor(stockId, false);
    if (button.dataset.action === 'rumorBad') spreadRumor(stockId, true);
    return;
  }
  const row = event.target.closest('.dashStockRow[data-stock]');
  if (row) {
    marketState.selectedStock = row.dataset.stock;
    saveState();
    renderScreenPanel(activeScreen);
  }
});

const pointerRaycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();

function pickClickableObject(event) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerRaycaster.setFromCamera(pointerNdc, camera);
  const hits = pointerRaycaster.intersectObjects(clickableMeshes, false);
  if (!hits.length) return false;
  const hit = hits[0].object.userData;
  if (!hit.interactKind) return false;
  handleInteract({ kind: hit.interactKind, key: hit.interactData });
  return true;
}

addEventListener('keydown', event => {
  playerKeys[event.code] = true;
  if (event.key === 'Escape' && !knowledgePanel.hidden) {
    closeKnowledgeCard();
    return;
  }
  if (event.key === 'Escape' && !screenPanel.hidden) {
    screenPanel.hidden = true;
    return;
  }
  if (event.code === 'KeyE' && screenPanel.hidden && knowledgePanel.hidden && activeInteractable) {
    handleInteract(activeInteractable);
  }
  if (event.code === 'Space') {
    event.preventDefault();
    tryPlayerJump();
  }
});
addEventListener('keyup', event => {
  playerKeys[event.code] = false;
  if (event.code === 'Space' && player.vy > 2.6) player.vy = 2.6;
});
addEventListener('blur', () => {
  Object.keys(playerKeys).forEach(key => { playerKeys[key] = false; });
});

canvas.addEventListener('pointerdown', event => {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
  downX = event.clientX;
  downY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!dragging) return;
  yaw -= (event.clientX - lastX) * .004;
  pitch = Math.max(-.4, Math.min(.55, pitch - (event.clientY - lastY) * .003));
  lastX = event.clientX;
  lastY = event.clientY;
});
canvas.addEventListener('pointerup', event => {
  dragging = false;
  const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
  if (moved > 6) return;
  if (!screenPanel.hidden || !knowledgePanel.hidden) return;
  if (pickClickableObject(event)) return;
  if (!activeInteractable) return;
  handleInteract(activeInteractable);
});
canvas.addEventListener('pointercancel', () => dragging = false);
canvas.addEventListener('wheel', event => {
  event.preventDefault();
  const nextRadius = cameraRadius + event.deltaY * .006;
  cameraRadius = Math.max(3.5, Math.min(14, nextRadius));
}, { passive: false });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (!screenPanel.hidden) {
    const canvas = document.getElementById('chartCanvas');
    if (canvas) drawLineChart(canvas, getStock(marketState.selectedStock));
  }
});

function animate(ms) {
  requestAnimationFrame(animate);
  const time = (ms || 0) * .001;
  const dt = lastTime ? Math.min(.05, time - lastTime) : 0;
  lastTime = time;

  const playerMoving = updatePlayerMovement(dt, time);
  updateControlledPlayerSlime(time, dt, playerMoving);
  updateInteractionHint();

  const radius = cameraRadius;
  camera.position.set(
    player.x + Math.sin(yaw) * radius,
    2.6 + Math.sin(pitch) * 2.0,
    player.z + Math.cos(yaw) * radius
  );
  camera.lookAt(player.x, 1.5, player.z);
  if (holoGlobe) {
    holoGlobe.rotation.y = time * .3;
    holoGlobe.position.y = GLOBE_Y + Math.sin(time * 1.4) * .06;
  }
  if (holoGlobeFx) {
    const pulse = 1 + Math.sin(time * 1.8) * .08;
    holoGlobeFx.core.scale.setScalar(pulse);
    holoGlobeFx.haze.material.opacity = .75 + Math.sin(time * 1.8) * .2;
    holoGlobeFx.shell.scale.setScalar(1 + Math.sin(time * 1.3 + 1) * .03);
    holoGlobeFx.shellOuter.scale.setScalar(1 + Math.sin(time * 1.1 + 2) * .05);
    holoGlobeFx.rings.forEach((ring, i) => {
      ring.rotation.z += (i % 2 ? -1 : 1) * .002 * (i + 1);
    });
  }
  animatedSlimes.forEach(s => {
    const breathe = 1 + Math.sin(time * 2 + s.phase) * .045;
    s.body.scale.set(1 / Math.sqrt(breathe), .82 * breathe, 1 / Math.sqrt(breathe));
  });
  updateBookshelf(time, dt);
  updateTeaSet(time, dt);
  updateCoffeeParts(time, dt);
  renderer.render(scene, camera);
}
