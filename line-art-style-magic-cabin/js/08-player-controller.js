'use strict';
            const player = { pos: new THREE.Vector3(0, 0, 5.2), vy: 0, yaw: Math.PI, moveSpeed: 6, onGround: true, groundT: 0 };
            let camYaw = Math.PI, camPitch = 0.32, viewDist = 3.2, pendYaw = 0, pendPitch = 0;
            let viewMode = 'fixed';
            const FIX_LOOK = V(0, 2.2, 0); let fixYaw = Math.atan2(9.5, 11.5); let fixPitch = Math.asin(5.0 / Math.hypot(9.5, 5.0, 11.5)); let fixDist = Math.hypot(9.5, 5.0, 11.5);
            const solidBoxes = [
                { x1: -4.85, z1: 3.80, x2: -0.78, z2: 4.20 }, { x1: 0.78, z1: 3.80, x2: 4.85, z2: 4.20 },
                { x1: -4.20, z1: -4.85, x2: 4.20, z2: -3.80 }, { x1: -4.20, z1: -4.85, x2: -3.80, z2: 4.85 },
                { x1: 3.80, z1: -4.85, x2: 4.20, z2: 4.85 }, { x1: -3.98, z1: 0.45, x2: -2.72, z2: 2.55 },
                { x1: -0.17, z1: -0.17, x2: 0.17, z2: 0.17 },
                { x1: -7.5, z1: 7.2, x2: -1.5, z2: 7.8 }, { x1: 1.5, z1: 7.2, x2: 7.5, z2: 7.8 },
                { x1: 2.78, z1: 5.98, x2: 3.42, z2: 6.62 },
                { x1: -6.18, z1: 5.82, x2: -5.42, z2: 6.58 },
                { x1: -5.58, z1: 6.42, x2: -4.82, z2: 7.18 },
                { x1: 5.22, z1: 6.12, x2: 5.98, z2: 6.88 },
                { x1: 7.26, z1: -6.14, x2: 7.94, z2: -5.46 },
                { x1: -8.54, z1: 3.26, x2: -7.86, z2: 3.94 },
                { x1: -6.84, z1: -8.84, x2: -6.16, z2: -8.16 },
                { x1: -60, z1: -60, x2: 60, z2: -19.55 },
                { x1: -60, z1: 19.55, x2: 60, z2: 60 },
                { x1: -60, z1: -60, x2: -19.55, z2: 60 },
                { x1: 19.55, z1: -60, x2: 60, z2: 60 }
            ];
            const DOOR_BOX = { x1: -0.85, z1: 3.78, x2: 0.85, z2: 4.22 }; const PLAYER_R = 0.26;
            /* ===== 家具平台碰撞体：史莱姆可跳跃站上（top 为台面高度） ===== */
            const platformBoxes = [
                { x1: MTX - 0.64, z1: MTZ - 0.46, x2: MTX + 0.64, z2: MTZ + 0.46, top: MTTOP },          // 原木餐桌
                { x1: DT_X - 1.36, z1: DT_Z - 0.46, x2: DT_X + 1.36, z2: DT_Z + 0.46, top: DTOP },      // 长餐桌
                { x1: KOT_X - 0.62, z1: KOT_Z - 0.62, x2: KOT_X + 0.62, z2: KOT_Z + 0.62, top: KTOP },  // 暖桌
                { x1: CBX - 0.28, z1: CBZ - 0.28, x2: CBX + 0.28, z2: CBZ + 0.28, top: 0.65 },         // 水晶球占卜台
                { x1: -1.84, z1: -1.97, x2: -0.86, z2: -1.03, top: 0.345 },                             // 灶台旁固定木台
                { x1: SFX - 0.25, z1: SFZ - 0.70, x2: SFX + 0.25, z2: SFZ + 0.70, top: 2.02 },         // 左墙书架（实心阻挡）
                { x1: CCX - 0.66, z1: CCZ - 0.66, x2: CCX + 0.66, z2: CCZ + 0.66, top: 1.28 },         // 大魔女坩埚（实心阻挡）
                { x1: -0.41, z1: -1.06, x2: 0.41, z2: -0.50, top: 0.49 },                              // 楼梯下储物箱
                { x1: -0.99, z1: -3.04, x2: -0.51, z2: -2.56, top: 0.48 },                             // 塔罗牌小圆凳
                { x1: BEDX - 0.68, z1: BEDZ - 1.18, x2: BEDX + 0.68, z2: BEDZ + 1.13, top: FY + 0.85, bot: FY }, // 二楼大床
                { x1: NSX - 0.29, z1: NSZ - 0.26, x2: NSX + 0.29, z2: NSZ + 0.26, top: FY + 0.60, bot: FY },    // 二楼床头柜
                { x1: TBLX - 1.22, z1: TBLZ - 0.58, x2: TBLX + 1.22, z2: TBLZ + 0.58, top: FY + 0.80, bot: FY }, // 二楼书桌
                { x1: -2.03, z1: 3.26, x2: -0.77, z2: 3.84, top: FY + 1.95, bot: FY },                 // 二楼衣柜（实心阻挡）
                { x1: 2.22, z1: 3.53, x2: 2.88, z2: 3.68, top: FY + 1.85, bot: FY },                   // 二楼拱形全身镜（实心阻挡）
                { x1: -3.58, z1: 2.28, x2: -2.40, z2: 3.48, top: FY + 2.0, bot: FY },                  // 二楼小黑板画架（实心阻挡）
                { x1: 0.61, z1: 3.21, x2: 1.29, z2: 3.76, top: FY + 0.41, bot: FY },                  // 二楼置物箱
                { x1: 1.59, z1: -3.66, x2: 2.11, z2: -3.14, top: FY + 0.60, bot: FY }                 // 二楼垃圾桶
            ];
            const movingPlatforms = [
                { g: stools[0], hx: 0.23, hz: 0.23, top: 0.475 },
                { g: stools[1], hx: 0.23, hz: 0.23, top: 0.475 },
                { g: cartG, hx: 0.21, hz: 0.16, top: 0.482 },
                { g: chairG, hx: 0.24, hz: 0.24, top: FY + 0.49, bot: FY },
                { g: stoolG, hx: 0.17, hz: 0.15, top: FY + 0.33, bot: FY },
                ...chairs.map(c => ({ g: c, hx: 0.23, hz: 0.23, top: 0.475 }))
            ];
            let activePlatforms = platformBoxes;
            function refreshPlatforms() {
                activePlatforms = platformBoxes.slice();
                for (const m of movingPlatforms) {
                    const px = m.g.position.x, pz = m.g.position.z;
                    activePlatforms.push({ x1: px - m.hx, z1: pz - m.hz, x2: px + m.hx, z2: pz + m.hz, top: m.top, bot: m.bot || 0 });
                }
            }
            function collideXZ(px, pz, y) { const boxes = solidBoxes.slice(); if (y >= 2.35 || !doorGroup.userData.spring.open) boxes.push(DOOR_BOX); for (const p of activePlatforms) { if (y < p.top - 0.42 && y + 0.5 > (p.bot || 0)) boxes.push(p); } for (const b of boxes) { const cx = Math.max(b.x1, Math.min(px, b.x2)); const cz = Math.max(b.z1, Math.min(pz, b.z2)); let dx = px - cx, dz = pz - cz; const d2 = dx * dx + dz * dz; if (d2 < PLAYER_R * PLAYER_R) { if (d2 < 1e-9) { const l = px - b.x1, rr = b.x2 - px; const tt = pz - b.z1, bb = b.z2 - pz; const m = Math.min(l, rr, tt, bb); if (m === l) px = b.x1 - PLAYER_R; else if (m === rr) px = b.x2 + PLAYER_R; else if (m === tt) pz = b.z1 - PLAYER_R; else pz = b.z2 + PLAYER_R; } else { const d = Math.sqrt(d2); px = cx + dx / d * PLAYER_R; pz = cz + dz / d * PLAYER_R; } } } return [px, pz]; }
            function stairHeightAt(aDeg) { if (aDeg > 30 && aDeg < 300) return ((aDeg - 30) / 270) * FLOOR_TOP; return 0; }
            function railCollide(px, pz, y, prevX, prevZ) { const r = Math.hypot(px, pz); if (r < 1e-5) return [px, pz]; const a = (Math.atan2(px, pz) * 180 / Math.PI + 360) % 360; const pR = Math.hypot(prevX, prevZ); const pA = (Math.atan2(prevX, prevZ) * 180 / Math.PI + 360) % 360; const inLand = ang => (ang >= 300 || ang <= 60); if (y > FLOOR_TOP - 0.30 && y < FLOOR_TOP + 0.95) { if (a > 60 && a < 300 && pA > 60 && pA < 300) { if (pR < 1.24 && r > 1.24) { const s = 1.21 / r; px *= s; pz *= s; } else if (pR > 1.24 && r < 1.24) { const s = 1.27 / r; px *= s; pz *= s; } } if (Math.min(r, pR) < 1.24 && inLand(a) !== inLand(pA)) { if ((a > 60 && a < 160) || (pA > 60 && pA < 160)) { px = prevX; pz = prevZ; } } } else if (y > 0.45 && y <= FLOOR_TOP - 0.30) { const sh = stairHeightAt(a); if (pR < 1.25 && Math.abs(y - sh) < 0.85) { if (r > 0.98 && r < 1.12) { const s = 0.98 / r; px *= s; pz *= s; } else if (r < 0.30) { const s = 0.30 / r; px *= s; pz *= s; } } } else if (y <= 0.45) { if (pR >= 1.14 && r < 1.14 && !(a > 18 && a < 62)) { const s = 1.14 / r; px *= s; pz *= s; } } return [px, pz]; }
            function groundAt(x, z, curY) { let g = 0; const r = Math.hypot(x, z); const a = (Math.atan2(x, z) * 180 / Math.PI + 360) % 360; if (r > 0.10 && r < 1.20 && a > 30 && a < 300) { const h = Math.min(((a - 30) / 270) * FLOOR_TOP, FLOOR_TOP); if (curY > h - 0.5) g = Math.max(g, h); } for (const p of activePlatforms) { if (x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2 && curY > p.top - 0.45) g = Math.max(g, p.top); } if (x > -4 && x < 4 && z > -4 && z < 4 && curY > 2.6) { if (r >= 1.20) g = Math.max(g, FLOOR_TOP); else if (a >= 300 || a <= 60) g = Math.max(g, FLOOR_TOP); } return g; }

            /* ---- 音效辅助：门窗弹簧 / 壁炉 / 吊灯 / 魔法物件 ---- */
            doorGroup.userData.sfx = 'door';
            for (const w of [winFL, winFR, winL, winR, winB, winG]) w.userData.sfx = 'window';
            const toggleSpring = g => { if (g.userData.onToggle) { g.userData.onToggle(); return; } g.userData.spring.open = !g.userData.spring.open; SND.play(g.userData.sfx || 'toggle'); };
            function toggleFire() { fireLit = !fireLit; SND.play('fire'); }
            function toggleLamp() { lampLit = !lampLit; SND.play('lamp'); }
            const fireMagic = o => { SND.play(o.userData.sfx || 'toggle'); o.userData.onClick(); };
            const interactables = [
                { x: FX, z: FZ, r: 2.0, label: '点燃 / 熄灭壁炉', act: toggleFire },
                { x: 0, z: 0, r: 2.4, label: '点亮 / 熄灭魔法吊灯', act: toggleLamp },
                { x: 0, z: 4, r: 1.8, label: '打开 / 关上大门', act: () => toggleSpring(doorGroup) },
                { x: WIN_F_L.c, z: 4, r: 1.6, label: '开 / 关前左窗', act: () => toggleSpring(winFL) },
                { x: WIN_F_R.c, z: 4, r: 1.6, label: '开 / 关前右窗', act: () => toggleSpring(winFR) },
                { x: -4, z: WIN_LEFT.c, r: 1.6, label: '开 / 关左侧窗', act: () => toggleSpring(winL) },
                { x: 3.1, z: 6.3, r: 2.2, label: '编辑路牌文字', act: openSignEditor },
                { x: 4, z: -1.5, r: 1.7, label: '开 / 关右侧窗', fh: true, act: () => toggleSpring(winR) },
                { x: 1.5, z: -4, r: 1.7, label: '开 / 关后窗', fh: true, act: () => toggleSpring(winB) }
            ];
            const hintEl = document.getElementById('hint'), crosshairEl = document.getElementById('crosshair'), lockTipEl = document.getElementById('lockTip');
            let nearestInteract = null, aimHit = null; const raycaster = new THREE.Raycaster(); const CENTER = new THREE.Vector2(0, 0); const mouse = new THREE.Vector2();
            function ancestorVisible(o) { let p = o; while (p) { if (p.visible === false) return false; p = p.parent; } return true; }
            function aimRay() { raycaster.setFromCamera(CENTER, camera); const h = raycaster.intersectObjects(hingeMeshes, false).filter(x => ancestorVisible(x.object)); if (h.length) { const g = h[0].object.userData.hingeGroup; return { label: g.userData.aimLabel || '交互', act: () => toggleSpring(g) }; } const m = raycaster.intersectObjects(magicMeshes, false).filter(x => ancestorVisible(x.object)); if (m.length) { const o = m[0].object.userData.magicRoot; return { label: o.userData.aimLabel || '交互', act: () => fireMagic(o) }; } const f = raycaster.intersectObjects(fireMeshes, false).filter(x => ancestorVisible(x.object)); if (f.length) return { label: '点燃 / 熄灭壁炉', act: toggleFire }; return null; }
            const isLocked = () => document.pointerLockElement === renderer.domElement;
            function doInteract() { if (viewMode === 'fp' && (aimHit || IS_TOUCH)) { if (aimHit) aimHit.act(); return; } if (nearestInteract) nearestInteract.act(); }
            function updateInteractHint() {
                if (performance.now() * 0.001 < hintOverrideUntil) { hintEl.innerHTML = hintOverrideText; hintEl.classList.add('show'); return; }
                if (viewMode === 'fp' && (isLocked() || IS_TOUCH)) { aimHit = aimRay(); if (aimHit) { hintEl.innerHTML = (IS_TOUCH ? '点按 <b>准星</b> 或 <b>交互键</b> ' : '点击 <b>左键</b> ') + aimHit.label; hintEl.classList.add('show'); } else hintEl.classList.remove('show'); return; } aimHit = null; nearestInteract = null; let best = 1e9; for (const it of interactables) { if (it.fh && !fullHouse) continue; const d = Math.hypot(player.pos.x - it.x, player.pos.z - it.z); if (d < it.r && d < best) { best = d; nearestInteract = it; } } if (nearestInteract) { hintEl.innerHTML = (IS_TOUCH ? '点按 <b>交互键</b> ' : '按 <b>E</b> ') + nearestInteract.label; hintEl.classList.add('show'); } else hintEl.classList.remove('show');
            }

            const keys = {}; const signInput = document.getElementById('signInput'); const signEditor = document.getElementById('signEditor'); const picInput = document.getElementById('picInput');
            let joyX = 0, joyY = 0, sprintBtnDown = false;
            function tryJump() { const now = performance.now() * 0.001; if (player.onGround || (now - player.groundT) < 0.15) { player.vy = 7.0; player.onGround = false; player.groundT = -10; slime.squashV += 1.3; slime.wobV += 2.2; } }
            addEventListener('keydown', e => {
                if (window.APP_SHELL_BLOCK_GAME) return;
                if (document.activeElement === signInput || document.activeElement === noteInput || document.activeElement === picInput) return;
                keys[e.code] = true;
                if (e.code === 'KeyV' && viewMode !== 'fixed') setViewMode(viewMode === 'fp' ? 'tp' : 'fp');
                if (e.code === 'Space') { e.preventDefault(); tryJump(); }
                if (e.code === 'KeyE' && nearestInteract) doInteract();
                if (e.code === 'Digit1' || e.code === 'Numpad1') selectSlot(1);
                if (e.code === 'Digit2' || e.code === 'Numpad2') selectSlot(2);
                if (e.code === 'Digit3' || e.code === 'Numpad3') selectSlot(3);
                if (e.code === 'Digit4' || e.code === 'Numpad4') selectSlot(4);
                if (e.code === 'Digit5' || e.code === 'Numpad5') selectSlot(5);
                if (e.code === 'KeyF') tryCast();
            });
            addEventListener('keyup', e => { keys[e.code] = false; if (e.code === 'Space' && player.vy > 2.6) player.vy = 2.6; });
            const joyZone = document.getElementById('joyZone'), joyBase = document.getElementById('joyBase'), joyKnob = document.getElementById('joyKnob');
            const JOY_R = 44; let joyId = null, joyCx = 0, joyCy = 0;
            function setKnob(dx, dy) { joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; }
            joyZone.addEventListener('pointerdown', e => { if (joyId !== null) return; joyId = e.pointerId; joyCx = e.clientX; joyCy = e.clientY; joyBase.style.display = 'block'; joyBase.style.left = joyCx + 'px'; joyBase.style.top = joyCy + 'px'; setKnob(0, 0); joyZone.setPointerCapture(e.pointerId); e.preventDefault(); });
            joyZone.addEventListener('pointermove', e => { if (e.pointerId !== joyId) return; let dx = e.clientX - joyCx, dy = e.clientY - joyCy; const m = Math.hypot(dx, dy); if (m > JOY_R) { dx = dx / m * JOY_R; dy = dy / m * JOY_R; } setKnob(dx, dy); joyX = dx / JOY_R; joyY = dy / JOY_R; e.preventDefault(); });
            function joyEnd(e) { if (e.pointerId !== joyId) return; joyId = null; joyX = 0; joyY = 0; joyBase.style.display = 'none'; setKnob(0, 0); }
            joyZone.addEventListener('pointerup', joyEnd); joyZone.addEventListener('pointercancel', joyEnd);
            const btnSprint = document.getElementById('btnSprint'), btnJump = document.getElementById('btnJump'), btnAct = document.getElementById('btnAct'), btnCast = document.getElementById('btnCast');
            btnSprint.addEventListener('pointerdown', e => { sprintBtnDown = true; btnSprint.classList.add('pressed'); e.preventDefault(); });
            function sprintEnd() { sprintBtnDown = false; btnSprint.classList.remove('pressed'); }
            btnSprint.addEventListener('pointerup', sprintEnd); btnSprint.addEventListener('pointercancel', sprintEnd);
            btnJump.addEventListener('pointerdown', e => { btnJump.classList.add('pressed'); tryJump(); e.preventDefault(); });
            btnJump.addEventListener('pointerup', () => { btnJump.classList.remove('pressed'); if (player.vy > 2.6) player.vy = 2.6; });
            btnJump.addEventListener('pointercancel', () => btnJump.classList.remove('pressed'));
            btnAct.addEventListener('pointerdown', e => { btnAct.classList.add('pressed'); doInteract(); e.preventDefault(); });
            btnAct.addEventListener('pointerup', () => btnAct.classList.remove('pressed')); btnAct.addEventListener('pointercancel', () => btnAct.classList.remove('pressed'));
            btnCast.addEventListener('pointerdown', e => { btnCast.classList.add('pressed'); tryCast(); e.preventDefault(); });
            btnCast.addEventListener('pointerup', () => btnCast.classList.remove('pressed')); btnCast.addEventListener('pointercancel', () => btnCast.classList.remove('pressed'));
            document.getElementById('slot1').addEventListener('click', () => selectSlot(1));
            document.getElementById('slot2').addEventListener('click', () => selectSlot(2));
            document.getElementById('slot3').addEventListener('click', () => selectSlot(3));
            document.getElementById('slot4').addEventListener('click', () => selectSlot(4));
            document.getElementById('slot5').addEventListener('click', () => selectSlot(5));
            let dragInfo = null; const ptrs = new Map(); let pinchMode = false, pinchD = 0, didPinch = false;
            renderer.domElement.addEventListener('pointerdown', e => {
                if (window.APP_SHELL_BLOCK_GAME) return;
                if (e.button === 2) { tryCast(); return; }
                ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); pinchMode = true; didPinch = true; dragInfo = null; } else if (ptrs.size === 1) { dragInfo = { x: e.clientX, y: e.clientY, moved: 0 }; didPinch = false; }
            });
            renderer.domElement.addEventListener('pointermove', e => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pinchMode && ptrs.size >= 2) { const [a, b] = [...ptrs.values()]; const nd = Math.hypot(a.x - b.x, a.y - b.y); const diff = pinchD - nd; if (viewMode === 'fixed') fixDist = Math.max(4, Math.min(40, fixDist + diff * 0.02)); else viewDist = Math.max(1.4, Math.min(7.0, viewDist + diff * 0.006)); pinchD = nd; return; } if (!dragInfo) return; if (viewMode === 'fp' && isLocked()) return; const dx = e.clientX - dragInfo.x, dy = e.clientY - dragInfo.y; dragInfo.x = e.clientX; dragInfo.y = e.clientY; dragInfo.moved += Math.abs(dx) + Math.abs(dy); pendYaw -= dx * 0.0055; pendPitch += dy * 0.0045 * (viewMode === 'fp' ? -1 : 1); });
            renderer.domElement.addEventListener('pointerup', e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchMode = false; if (!dragInfo) return; const wasClick = dragInfo.moved < 6 && !didPinch; dragInfo = null; if (!wasClick) return; if (viewMode === 'fp' && (isLocked() || IS_TOUCH)) { if (aimHit) aimHit.act(); return; } if (viewMode === 'fp' && !IS_TOUCH && !isLocked()) { renderer.domElement.requestPointerLock(); return; } mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; raycaster.setFromCamera(mouse, camera); const hits = raycaster.intersectObjects(hingeMeshes, false).filter(h => ancestorVisible(h.object)); if (hits.length) { toggleSpring(hits[0].object.userData.hingeGroup); return; } const mh = raycaster.intersectObjects(magicMeshes, false).filter(h => ancestorVisible(h.object)); if (mh.length) { fireMagic(mh[0].object.userData.magicRoot); return; } const fh = raycaster.intersectObjects(fireMeshes, false).filter(h => ancestorVisible(h.object)); if (fh.length) toggleFire(); });
            renderer.domElement.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchMode = false; dragInfo = null; });
            document.addEventListener('mousemove', e => { if (isLocked() && viewMode === 'fp') { camYaw -= e.movementX * 0.0026; camPitch -= e.movementY * 0.0022; camPitch = Math.max(-1.2, Math.min(1.2, camPitch)); } });
            document.addEventListener('pointerlockchange', () => { const locked = isLocked(); crosshairEl.classList.toggle('show', viewMode === 'fp' && (locked || IS_TOUCH)); lockTipEl.classList.toggle('show', viewMode === 'fp' && !locked && !IS_TOUCH); });
            renderer.domElement.addEventListener('wheel', e => { if (viewMode === 'fixed') fixDist = Math.max(4, Math.min(40, fixDist + e.deltaY * 0.012)); else viewDist = Math.max(1.4, Math.min(7.0, viewDist + e.deltaY * 0.0025)); }, { passive: true });
            addEventListener('contextmenu', e => { if (e.target === renderer.domElement || e.target.closest('#joyZone, .touchBtn')) e.preventDefault(); });

            const menuPanel = document.getElementById('menuPanel'), houseToggle = document.getElementById('houseToggle'), viewFixedBtn = document.getElementById('viewFixedBtn'), viewTpBtn = document.getElementById('viewTpBtn'), viewFpBtn = document.getElementById('viewFpBtn'), resetBtn = document.getElementById('resetBtn');
            document.getElementById('menuDot').addEventListener('click', () => { SND.play('ui'); menuPanel.classList.toggle('open'); });
            houseToggle.addEventListener('click', () => { SND.play('ui'); fullHouse = !fullHouse; houseToggle.classList.toggle('on', fullHouse); fullHouseGroup.visible = fullHouse; dashedGroup.visible = !fullHouse; });
            function resetSlime() { player.pos.set(0, 0, 5.2); player.vy = 0; player.yaw = Math.PI; player.moveSpeed = 0; player.onGround = true; camYaw = Math.PI; camPitch = 0.32; pendYaw = 0; pendPitch = 0; slime.squash = SLIME_FLAT; slime.squashV = 0; slime.wob = 0; slime.wobV = 0; }
            resetBtn.addEventListener('click', () => { SND.play('ui'); resetSlime(); });
            function setViewMode(m) { viewMode = m; viewFixedBtn.classList.toggle('on', m === 'fixed'); viewTpBtn.classList.toggle('on', m === 'tp'); viewFpBtn.classList.toggle('on', m === 'fp'); if (m === 'fixed') { if (document.pointerLockElement) document.exitPointerLock(); slimeRoot.visible = true; crosshairEl.classList.remove('show'); lockTipEl.classList.remove('show'); } else { slimeRoot.visible = (m !== 'fp'); if (m === 'fp') { if (IS_TOUCH) crosshairEl.classList.add('show'); else lockTipEl.classList.add('show'); } else { if (document.pointerLockElement) document.exitPointerLock(); crosshairEl.classList.remove('show'); lockTipEl.classList.remove('show'); } } }
            viewFixedBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('fixed'); }); viewTpBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('tp'); }); viewFpBtn.addEventListener('click', () => { SND.play('ui'); setViewMode('fp'); });
            const sfxToggle = document.getElementById('sfxToggle'), sfxSlider = document.getElementById('sfxSlider');
            sfxToggle.addEventListener('click', () => { const on = !SND.isEnabled(); SND.setEnabled(on); sfxToggle.classList.toggle('on', on); if (on) SND.play('ui'); });
            sfxSlider.addEventListener('input', () => SND.setVolume(parseFloat(sfxSlider.value)));
            function applySign() { signText = signInput.value.trim() || '魔女小屋'; drawSign(signText); signEditor.classList.remove('show'); signInput.blur(); SND.play('chim'); }
            document.getElementById('signOk').addEventListener('click', applySign);
            signInput.addEventListener('keydown', e => { if (e.key === 'Enter') applySign(); if (e.key === 'Escape') { signEditor.classList.remove('show'); signInput.blur(); } e.stopPropagation(); });

            function lerpAngle(a, b, t) { let d = (b - a + Math.PI * 3) % (Math.PI * 2) - Math.PI; return a + d * t; }
            function slimeLand(time) { if (player.vy < -3.0) { const impact = Math.min(1.5, (-player.vy - 3.0) * 0.30); slime.squashV -= impact; slime.wobV += impact * 2.6; } player.pos.y = groundAt(player.pos.x, player.pos.z, player.pos.y); player.pos.y = Math.max(player.pos.y, 0); player.vy = 0; player.onGround = true; player.groundT = time; }
            function updatePlayer(dt, time) {
                refreshPlatforms();
                if (pendYaw !== 0 || pendPitch !== 0) { const APPLY = 0.6; if (viewMode === 'fixed') { fixYaw += pendYaw * APPLY; fixPitch += pendPitch * APPLY; fixPitch = Math.max(0.05, Math.min(1.45, fixPitch)); } else { camYaw += pendYaw * APPLY; camPitch += pendPitch * APPLY; if (viewMode === 'fp') camPitch = Math.max(-1.2, Math.min(1.2, camPitch)); else camPitch = Math.max(-0.25, Math.min(1.15, camPitch)); } pendYaw *= (1 - APPLY); pendPitch *= (1 - APPLY); if (Math.abs(pendYaw) < 1e-5) pendYaw = 0; if (Math.abs(pendPitch) < 1e-5) pendPitch = 0; }
                if (viewMode === 'fixed') camYaw = fixYaw + Math.PI;
                const typing = document.activeElement === signInput || document.activeElement === noteInput || document.activeElement === picInput; let ix = 0, iz = 0;
                if (!typing) { if (keys['KeyW'] || keys['ArrowUp']) iz += 1; if (keys['KeyS'] || keys['ArrowDown']) iz -= 1; if (keys['KeyA'] || keys['ArrowLeft']) ix -= 1; if (keys['KeyD'] || keys['ArrowRight']) ix += 1; ix += joyX; iz += -joyY; const m = Math.hypot(ix, iz); if (m > 1) { ix /= m; iz /= m; } }
                const joyFull = Math.hypot(joyX, joyY) > 0.85; const running = !!(keys['ShiftLeft'] || keys['ShiftRight']) || sprintBtnDown || joyFull; const maxSpeed = running ? 3.2 : 1.6;
                let tx = 0, tz = 0; if (ix !== 0 || iz !== 0) { const fx = Math.sin(camYaw), fz = Math.cos(camYaw); const rx = -Math.cos(camYaw), rz = Math.sin(camYaw); tx = (fx * iz + rx * ix) * maxSpeed; tz = (fz * iz + rz * ix) * maxSpeed; }
                player.moveSpeed += (Math.hypot(tx, tz) - player.moveSpeed) * Math.min(1, dt * 10); const spd = player.moveSpeed; const moving = spd > 0.12;
                if (moving) slime.pulse += dt * (2.6 + spd * 1.3);
                const creep = moving ? 0.45 + 0.55 * Math.max(0, Math.sin(slime.pulse - 0.5)) : 1;
                const ox = player.pos.x, oz = player.pos.z; let nx = player.pos.x + tx * dt * creep, nz = player.pos.z + tz * dt * creep;
                [nx, nz] = collideXZ(nx, nz, player.pos.y);[nx, nz] = railCollide(nx, nz, player.pos.y, ox, oz); player.pos.x = nx; player.pos.z = nz;
                const ground = groundAt(player.pos.x, player.pos.z, player.pos.y);
                if (player.pos.y <= ground + 0.001 && player.vy <= 0) { if (player.pos.y - ground > 0.5) player.vy = 0; else slimeLand(time); }
                if (player.pos.y > ground + 0.001 || player.vy > 0) { player.vy -= 22 * dt; player.pos.y += player.vy * dt; const g2 = groundAt(player.pos.x, player.pos.z, player.pos.y); if (player.pos.y <= g2 && player.vy <= 0) slimeLand(time); else if (player.pos.y > g2) player.onGround = false; }
                if (spd > 0.15) player.yaw = lerpAngle(player.yaw, Math.atan2(tx, tz), Math.min(1, dt * 9));
                const breathe = 1 + Math.sin(time * 1.7) * 0.03; const pulseSq = moving ? 1 - 0.10 * Math.max(0, Math.sin(slime.pulse - 0.9)) : 1; let jumpSq = 1;
                if (!player.onGround) jumpSq = player.vy > 2 ? 1.22 : (player.vy < -2 ? 1.12 : 1.07);
                const targetS = SLIME_FLAT * breathe * pulseSq * jumpSq;
                slime.squashV += (targetS - slime.squash) * 165 * dt; slime.squashV *= Math.exp(-6.2 * dt); slime.squash += slime.squashV * dt;
                const sy = Math.max(0.45, Math.min(1.5, slime.squash)); const sxz = (1 / Math.sqrt(sy)) * (1 + slime.wob * 0.10);
                slime.wobV += (-slime.wob) * 55 * dt; slime.wobV *= Math.exp(-3.4 * dt); slime.wob += slime.wobV * dt; const wob = Math.max(-0.35, Math.min(0.35, slime.wob));
                slimeRoot.position.set(player.pos.x, player.pos.y, player.pos.z); slimeRoot.rotation.y = player.yaw; slimeBody.scale.set(sxz, sy, sxz); slimeBody.position.y = SLIME_R * sy;
                const leanT = Math.min(spd / 1.6, 1) * 0.15; slime.tiltV += (leanT - slime.tilt) * 130 * dt; slime.tiltV *= Math.exp(-5 * dt); slime.tilt += slime.tiltV * dt;
                slimeBody.rotation.x = slime.tilt + wob * 0.35; slimeBody.rotation.z = Math.sin(time * 2.1) * 0.02 + Math.sin(slime.pulse * 0.5) * 0.035 * Math.min(spd / 1.6, 1) + wob * 0.55;
                const casting = blast.active && blast.t < T_BOOM;
                if (casting) slime.pulse += dt * 3;
                const wAmp = moving ? 0.013 + 0.007 * Math.min(spd / 1.6, 1) : (casting ? 0.016 : 0.005);
                const wSpd = moving ? 7.5 : (casting ? 5 : 1.5);
                deformSlime(time, wAmp, wSpd);
                core.scale.setScalar(1 + 0.06 * Math.sin(time * 2.4 + slime.pulse) + (casting ? 0.15 : 0)); core.position.set(Math.sin(time * 1.3) * 0.012, 0.015 * Math.sin(time * 1.9), Math.sin(time * 1.1) * 0.010);
                for (const b of bubbles) { const t = (time * 0.22 + b.userData.ph) % 1; const r2 = b.userData.rr * (1 - t * 0.45); b.position.set(Math.cos(b.userData.ang) * r2, -0.12 + t * 0.24, Math.sin(b.userData.ang) * r2); b.scale.setScalar(0.5 + 0.5 * Math.sin(t * Math.PI)); }
                const shs = 1 / Math.sqrt(sy); slimeShadow.scale.set(shs, shs, 1); slimeShadow.material.opacity = 0.10 + 0.10 / sy;
                if (viewMode === 'fixed') { const cp = Math.cos(fixPitch), sp = Math.sin(fixPitch); camera.position.set(FIX_LOOK.x + Math.sin(fixYaw) * cp * fixDist, FIX_LOOK.y + sp * fixDist, FIX_LOOK.z + Math.cos(fixYaw) * cp * fixDist); camera.lookAt(FIX_LOOK); }
                else if (viewMode === 'fp') { camera.position.set(player.pos.x, player.pos.y + 0.30, player.pos.z); camera.lookAt(player.pos.x + Math.sin(camYaw) * Math.cos(camPitch) * 10, player.pos.y + 0.30 + Math.sin(camPitch) * 10, player.pos.z + Math.cos(camYaw) * Math.cos(camPitch) * 10); }
                else { const cp = Math.cos(camPitch), sp = Math.sin(camPitch); const px = player.pos.x - Math.sin(camYaw) * cp * viewDist, py = player.pos.y + 0.34 + sp * viewDist, pz = player.pos.z - Math.cos(camYaw) * cp * viewDist; camera.position.set(px, Math.max(py, 0.25), pz); camera.lookAt(player.pos.x, player.pos.y + 0.25, player.pos.z); }
            }
