'use strict';
/* ========================================================== */
/* ============ 农田区域：6×6 地块（翻耕 / 播种 / 浇水 / 收获） ============ */
/* ========================================================== */
const FARMLAND_UNTILLED_COLOR = 0xece0c0; // 浅米白色：普通土地
const FARMLAND_TILLED_COLOR = 0xc2965f;   // 浅棕色：翻耕后
const FARMLAND_WATERED_COLOR = 0x8f6a3f;  // 略深：浇水后

const FARMLAND_CENTER = { x: 9.0, z: 0.0 }; // 小屋东侧空地，避开木屋/正门小路/树桩
const FARMLAND_N = 6, FARMLAND_SPACING = 1.2, FARMLAND_TILE_SIZE = 0.85, FARMLAND_TILE_H = 0.01;

const farmPlots = [];
const TURNIP_HARVEST_COINS = 25;
const FARM_WORKER_DAILY_WAGE = 60;
const FARM_WORKER_SPEED = 1.65;
const FARM_WORKER_PLANT_BATCH = 8;
const farmHireState = {
    hired: false,
    striking: false,
    lastPaidDay: 0,
    worker: null,
    body: null,
    toolRoot: null,
    tools: {},
    labelEntry: null,
    targetPlot: null,
    phase: 'idle',
    action: null,
    actionTimer: 0,
    pulse: 0
};

function farmPlotColor(state) {
    if (state.watered) return FARMLAND_WATERED_COLOR;
    if (state.tilled) return FARMLAND_TILLED_COLOR;
    return FARMLAND_UNTILLED_COLOR;
}
function farmPlotLabel(state) {
    if (!state.tilled) return '翻地';
    if (!state.crop) return '播种萝卜';
    const stage = state.crop.userData.crop.stage;
    if (stage < 3) return '浇水成长 · 阶段 ' + (stage + 1) + '/4';
    return '收获成熟萝卜';
}
function applyFarmPlotState(state, sound) {
    state.material.uniforms.uTint.value.setHex(farmPlotColor(state));
    const label = farmPlotLabel(state);
    state.group.userData.aimLabel = label;
    if (state.interactEntry) state.interactEntry.label = label;
    if (sound) SND.play(sound);
}
function plantFarmCrop(state, silent) {
    if (
        window.useBackpackItem &&
        !window.useBackpackItem('turnipSeed', 1, silent)
    ) {
        if (!silent) SND.play('toggle');
        return false;
    }

    state.crop = createTurnip(state.x, 0.02, state.z);
    state.watered = false;
    applyFarmPlotState(state, 'chim');
    if (!silent) showHintOverride('萝卜种子已经种下，背包种子 -1，装备水壶继续浇水');
    return true;
}
function growFarmCrop(state, silent) {
    const cropData = state.crop.userData.crop;
    if (cropData.stage >= 3) return false;
    state.watered = true;
    setTurnipStage(state.crop, cropData.stage + 1);
    applyFarmPlotState(state, cropData.stage >= 3 ? 'magic' : 'chim');
    if (!silent) showHintOverride(cropData.stage >= 3 ? '萝卜成熟了，装备镰刀收获' : '萝卜长高了一点');
    return true;
}
function harvestFarmCrop(state, silent) {
    removeTurnip(state.crop);
    state.crop = null;
    state.watered = false;
    state.harvested++;
    applyFarmPlotState(state, 'magic');
    if (window.addCropToStorage) window.addCropToStorage('turnip', 1);
    if (window.addCabinCoins) {
        if (silent) window.addCabinCoins(TURNIP_HARVEST_COINS, false);
        else window.addCabinCoins(TURNIP_HARVEST_COINS, '收获萝卜');
    } else if (!silent) {
        showHintOverride('收获萝卜 +1，可以继续播种');
    }
    return true;
}
function onFarmPlotClick(state) {
    if (!state.tilled) {
        if (slotSel !== TOOL_SLOT.hoe) {
            SND.play('toggle');
            showHintOverride('需要先装备锄头 · 按 <b>3</b>');
            return;
        }
        if (!triggerToolSwing('hoe', () => {
            state.tilled = true;
            state.watered = false;
            applyFarmPlotState(state, 'ui');
            showHintOverride('土地已经翻好，空手点击可以播种');
        })) SND.play('toggle'); // 锄头正在挥动中
    } else if (!state.crop) {
        if (slotSel !== 1) {
            SND.play('toggle');
            showHintOverride('需要先空手播种 · 按 <b>1</b>');
            return;
        }
        plantFarmCrop(state);
    } else if (state.crop.userData.crop.stage < 3) {
        if (slotSel !== TOOL_SLOT.wateringCan) {
            SND.play('toggle');
            showHintOverride('需要先装备水壶 · 按 <b>4</b>');
            return;
        }
        if (window.isWateringCanFilled && !window.isWateringCanFilled()) {
            SND.play('toggle');
            showHintOverride('水壶里没有水，先去水井旁按 <b>E</b> 打水');
            return;
        }
        if (
            !triggerToolSwing('wateringCan', () => {
                if (window.consumeWateringCanWater && !window.consumeWateringCanWater()) {
                    SND.play('toggle');
                    return;
                }
                growFarmCrop(state);
            }
        )) {
            SND.play('toggle'); // 水壶正在挥动中
        }
    } else {
        if (slotSel !== TOOL_SLOT.sickle) {
            SND.play('toggle');
            showHintOverride('需要先装备镰刀 · 按 <b>5</b>');
            return;
        }
        if (!triggerToolSwing('sickle', () => harvestFarmCrop(state))) SND.play('toggle'); // 镰刀正在挥动中
    }
}
function buildFarmPlot(x, z) {
    const g = new THREE.Group();
    put(g, x, 0, z);
    const mat = LITMAT(FARMLAND_UNTILLED_COLOR);
    const tile = solid(new THREE.BoxGeometry(FARMLAND_TILE_SIZE, FARMLAND_TILE_H, FARMLAND_TILE_SIZE), mat);
    tile.position.y = FARMLAND_TILE_H / 2;
    g.add(tile);
    const state = { tilled: false, watered: false, crop: null, harvested: 0, group: g, material: mat, x, z, interactEntry: null };
    g.userData.aimLabel = farmPlotLabel(state);
    regMagic(g, () => onFarmPlotClick(state));
    const entry = { x, z, r: 0.9, label: farmPlotLabel(state), act: () => onFarmPlotClick(state) };
    state.interactEntry = entry;
    interactables.push(entry);
    farmPlots.push(state);
    return state;
}
//对每一块农田进行初始化，生成 6×6 的农田网格
for (let row = 0; row < FARMLAND_N; row++) {
    for (let col = 0; col < FARMLAND_N; col++) {
        const x = FARMLAND_CENTER.x + (col - (FARMLAND_N - 1) / 2) * FARMLAND_SPACING;
        const z = FARMLAND_CENTER.z + (row - (FARMLAND_N - 1) / 2) * FARMLAND_SPACING;
        buildFarmPlot(x, z);
    }
}

/* ========================================================== */
/* ============ 农场雇佣系统：自动照料农田 ============ */
/* ========================================================== */

function makeFarmHireLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7efd6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#6f7d5c';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 108);
    ctx.fillStyle = '#3f5638';
    ctx.font = 'bold 28px "Songti SC", "STSong", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 47);
    ctx.font = '18px "Songti SC", "STSong", serif';
    ctx.fillText('日薪 ' + FARM_WORKER_DAILY_WAGE + ' 金币', 128, 84);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.44), material);
}

function currentFarmDay() {
    if (typeof gameSec !== 'number') return 0;
    return Math.floor(gameSec / (24 * 3600));
}

function farmHireLabel() {
    if (farmHireState.striking) return '农工罢工中 · 补发工资';
    return farmHireState.hired
        ? '农工工作中'
        : '雇佣农工';
}

function updateFarmHireLabel() {
    if (farmHireState.labelEntry) farmHireState.labelEntry.label = farmHireLabel();
    if (farmHireState.worker) farmHireState.worker.userData.aimLabel = farmHireLabel();
}

function saveFarmHireStateNow() {
    if (typeof saveGameState === 'function') saveGameState(false);
}

function chooseFarmWorkerPlot() {
    const hasSeed =
        !window.getBackpackItemCount ||
        window.getBackpackItemCount('turnipSeed') > 0;
    const growingCount =
        farmPlots.filter(p => p.crop && p.crop.userData.crop.stage < 3).length;
    const shouldPlantMore =
        hasSeed &&
        growingCount < FARM_WORKER_PLANT_BATCH;

    return farmPlots.find(p => p.crop && p.crop.userData.crop.stage >= 3) ||
        (shouldPlantMore ? farmPlots.find(p => p.tilled && !p.crop) : null) ||
        (shouldPlantMore ? farmPlots.find(p => !p.tilled) : null) ||
        farmPlots.find(p => p.crop && p.crop.userData.crop.stage < 3) ||
        (hasSeed ? farmPlots.find(p => p.tilled && !p.crop) : null) ||
        farmPlots.find(p => !p.tilled) ||
        null;
}

function getFarmWorkerAction(plot) {
    if (!plot) return null;
    if (plot.crop && plot.crop.userData.crop.stage >= 3) {
        return { name: 'sickle', label: '收割', apply: () => harvestFarmCrop(plot, true) };
    }
    if (plot.crop && plot.crop.userData.crop.stage < 3) {
        return { name: 'wateringCan', label: '浇水', apply: () => growFarmCrop(plot, true) };
    }
    if (plot.tilled && !plot.crop) {
        return { name: 'seed', label: '播种', apply: () => plantFarmCrop(plot, true) };
    }
    if (!plot.tilled) {
        return {
            name: 'hoe',
            label: '翻地',
            apply: () => {
                plot.tilled = true;
                plot.watered = false;
                applyFarmPlotState(plot, 'ui');
            }
        };
    }
    return null;
}

function payFarmWorker(reason) {
    if (!window.spendCabinCoins) {
        showHintOverride('金币系统还没准备好，暂时不能支付工资');
        return false;
    }
    if (!window.spendCabinCoins(FARM_WORKER_DAILY_WAGE, null)) return false;
    farmHireState.lastPaidDay = currentFarmDay();
    farmHireState.striking = false;
    if (reason) showHintOverride(reason + ' · 日薪 -' + FARM_WORKER_DAILY_WAGE);
    saveFarmHireStateNow();
    return true;
}

function hireFarmWorker() {
    if (!farmHireState.hired) {
        farmHireState.hired = true;
        farmHireState.lastPaidDay = currentFarmDay();
        farmHireState.phase = 'seek';
        updateFarmHireLabel();
        SND.play('chim');
        showHintOverride('已雇佣农工 · 日结工资 ' + FARM_WORKER_DAILY_WAGE);
        saveFarmHireStateNow();
        return;
    }

    if (farmHireState.striking) {
        if (!payFarmWorker('已补发工资，农工恢复工作')) return;
        farmHireState.phase = 'seek';
        updateFarmHireLabel();
        SND.play('chim');
        return;
    }

    updateFarmHireLabel();
    showHintOverride('农工已在工作 · 每日结算日薪 ' + FARM_WORKER_DAILY_WAGE);
}

function makeWorkerToolPart(geo, mat) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat || LITMAT(0xc59a68));
    g.add(mesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 16), MAT));
    return g;
}

function buildWorkerTool(name) {
    const g = new THREE.Group();
    const wood = LITMAT(0xc59a68);
    const metal = LITMAT(0xb9bec0);
    const green = LITMAT(0x91aaa0);

    if (name === 'hoe') {
        const handle = makeWorkerToolPart(new THREE.CylinderGeometry(0.014, 0.018, 0.46, 8), wood);
        handle.rotation.x = Math.PI / 2;
        g.add(handle);
        const blade = makeWorkerToolPart(new THREE.BoxGeometry(0.19, 0.035, 0.08), metal);
        blade.position.set(0, -0.05, 0.24);
        blade.rotation.x = -0.38;
        g.add(blade);
    } else if (name === 'wateringCan') {
        const body = makeWorkerToolPart(new THREE.CylinderGeometry(0.08, 0.095, 0.13, 14), green);
        body.rotation.x = Math.PI;
        g.add(body);
        const spout = makeWorkerToolPart(new THREE.CylinderGeometry(0.018, 0.028, 0.20, 8), green);
        spout.rotation.z = -Math.PI / 3;
        spout.position.set(0.13, 0.03, 0);
        g.add(spout);
    } else if (name === 'sickle') {
        const handle = makeWorkerToolPart(new THREE.CylinderGeometry(0.014, 0.018, 0.42, 8), wood);
        handle.rotation.x = Math.PI / 2;
        g.add(handle);
        const blade = makeWorkerToolPart(new THREE.TorusGeometry(0.11, 0.014, 6, 24, Math.PI * 0.9), metal);
        blade.position.set(-0.07, 0, 0.24);
        blade.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        g.add(blade);
    } else {
        const seed = makeWorkerToolPart(new THREE.SphereGeometry(0.045, 8, 6), LITMAT(0xd88963));
        seed.scale.y = 0.65;
        g.add(seed);
    }

    g.visible = false;
    return g;
}

function buildFarmWorkerContract() {
    const g = new THREE.Group();
    const x = FARMLAND_CENTER.x - 4.6;
    const z = FARMLAND_CENTER.z;
    put(g, x, 0, z);

    const postMat = LITMAT(0x8f7558);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.95, 8), postMat);
    post.position.y = 0.475;
    post.add(new THREE.LineSegments(new THREE.EdgesGeometry(post.geometry, 1), MAT));
    g.add(post);

    const sign = makeFarmHireLabel('雇佣农工');
    sign.position.set(0, 1.02, 0);
    sign.rotation.y = Math.PI / 2;
    g.add(sign);

    const worker = new THREE.Group();
    worker.position.set(x + 0.75, 0, z + 0.25);
    const body = edge(new THREE.SphereGeometry(0.22, 18, 12));
    body.scale.set(1, 0.78, 1);
    body.position.y = 0.21;
    worker.add(body);

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xa9cfbf, transparent: true, opacity: 0.62 })
    );
    core.position.set(0, 0.23, 0);
    worker.add(core);

    for (const xEye of [-0.075, 0.075]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), LITMAT(0x1b2420));
        eye.position.set(xEye, 0.30, 0.18);
        worker.add(eye);
    }

    const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.23, 20),
        new THREE.MeshBasicMaterial({ color: 0x1e5a40, transparent: true, opacity: 0.12, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    worker.add(shadow);

    const toolRoot = new THREE.Group();
    toolRoot.position.set(0.20, 0.28, 0.14);
    worker.add(toolRoot);
    for (const name of ['hoe', 'wateringCan', 'sickle', 'seed']) {
        const tool = buildWorkerTool(name);
        toolRoot.add(tool);
        farmHireState.tools[name] = tool;
    }

    scene.add(worker);
    farmHireState.worker = worker;
    farmHireState.body = body;
    farmHireState.toolRoot = toolRoot;

    g.userData.aimLabel = farmHireLabel();
    regMagic(g, hireFarmWorker);
    const entry = { x, z, r: 1.35, label: farmHireLabel(), act: hireFarmWorker };
    farmHireState.labelEntry = entry;
    interactables.push(entry);
}

function setWorkerTool(name) {
    for (const key of Object.keys(farmHireState.tools)) {
        farmHireState.tools[key].visible = key === name;
    }
}

function startFarmWorkerTask() {
    const plot = chooseFarmWorkerPlot();
    const action = getFarmWorkerAction(plot);
    if (!plot || !action) {
        farmHireState.targetPlot = null;
        farmHireState.action = null;
        farmHireState.phase = 'wait';
        farmHireState.actionTimer = 1.2;
        setWorkerTool(null);
        return;
    }
    farmHireState.targetPlot = plot;
    farmHireState.action = action;
    farmHireState.phase = 'move';
    setWorkerTool(action.name);
}

function animateFarmWorker(dt, time, moving) {
    const worker = farmHireState.worker;
    if (!worker || !farmHireState.body) return;

    if (moving) farmHireState.pulse += dt * 7.0;
    const breathe = 1 + Math.sin(time * 1.7) * 0.03;
    const stepSquash = moving ? 1 - 0.10 * Math.max(0, Math.sin(farmHireState.pulse - 0.9)) : 1;
    const actionSquash = farmHireState.phase === 'act'
        ? 1 + 0.08 * Math.sin(farmHireState.actionTimer * Math.PI * 5)
        : 1;
    const sy = Math.max(0.55, Math.min(1.25, 0.78 * breathe * stepSquash * actionSquash));
    const sxz = 1 / Math.sqrt(sy);
    farmHireState.body.scale.set(sxz, sy, sxz);
    farmHireState.body.position.y = 0.22 * sy;
    farmHireState.body.rotation.x = moving ? Math.sin(farmHireState.pulse) * 0.08 : 0;
    farmHireState.body.rotation.z = moving ? Math.sin(farmHireState.pulse * 0.5) * 0.08 : 0;

    if (farmHireState.toolRoot) {
        farmHireState.toolRoot.position.y = 0.28 + Math.sin(time * 1.6) * 0.006;
        farmHireState.toolRoot.rotation.set(0, 0, 0);
        if (farmHireState.phase === 'act') {
            const raw = Math.min(1, farmHireState.actionTimer / 0.95);
            const swing = Math.sin(raw * Math.PI);
            const action = farmHireState.action && farmHireState.action.name;
            if (action === 'hoe') {
                farmHireState.toolRoot.rotation.x = -1.15 * swing;
            } else if (action === 'sickle') {
                farmHireState.toolRoot.rotation.y = 1.45 * swing;
                farmHireState.toolRoot.rotation.z = -0.22 * swing;
            } else if (action === 'wateringCan') {
                farmHireState.toolRoot.rotation.z = -0.95 * swing;
            } else if (action === 'seed') {
                farmHireState.toolRoot.position.y += 0.08 * swing;
                farmHireState.toolRoot.position.z += 0.12 * swing;
            }
        }
    }
}

function settleFarmWorkerWage() {
    if (!farmHireState.hired || farmHireState.striking) return;
    const day = currentFarmDay();
    if (day < farmHireState.lastPaidDay) {
        farmHireState.lastPaidDay = day;
        saveFarmHireStateNow();
        return;
    }
    if (day <= farmHireState.lastPaidDay) return;

    if (window.spendCabinCoins && window.spendCabinCoins(FARM_WORKER_DAILY_WAGE, null)) {
        farmHireState.lastPaidDay = day;
        saveFarmHireStateNow();
        return;
    }

    farmHireState.striking = true;
    farmHireState.phase = 'idle';
    farmHireState.action = null;
    farmHireState.targetPlot = null;
    setWorkerTool(null);
    showHintOverride('金币不足，农工罢工了 · 需要补发 ' + FARM_WORKER_DAILY_WAGE + ' 金币');
    saveFarmHireStateNow();
}

function updateFarmHireSystem(dt, time) {
    settleFarmWorkerWage();

    if (!farmHireState.hired || farmHireState.striking) {
        animateFarmWorker(dt, time, false);
        updateFarmHireLabel();
        return;
    }

    let moving = false;

    if (farmHireState.phase === 'idle' || farmHireState.phase === 'seek') {
        startFarmWorkerTask();
    }

    if (farmHireState.phase === 'wait') {
        farmHireState.actionTimer -= dt;
        if (farmHireState.actionTimer <= 0) farmHireState.phase = 'seek';
    } else if (farmHireState.phase === 'move') {
        const plot = farmHireState.targetPlot;
        const worker = farmHireState.worker;
        if (!plot || !worker) {
            farmHireState.phase = 'seek';
        } else {
            const dx = plot.x - worker.position.x;
            const dz = plot.z - worker.position.z;
            const dist = Math.hypot(dx, dz);
            worker.rotation.y = Math.atan2(dx, dz);
            if (dist > 0.34) {
                const step = Math.min(dist, FARM_WORKER_SPEED * dt);
                worker.position.x += dx / dist * step;
                worker.position.z += dz / dist * step;
                moving = true;
            } else {
                farmHireState.phase = 'act';
                farmHireState.actionTimer = 0;
            }
        }
    } else if (farmHireState.phase === 'act') {
        farmHireState.actionTimer += dt;
        if (farmHireState.actionTimer >= 0.50 && farmHireState.action) {
            const action = farmHireState.action;
            farmHireState.action = null;
            action.apply();
            if (action.name !== 'seed') SND.play(action.name === 'hoe' ? 'ui' : 'chim');
        }
        if (farmHireState.actionTimer >= 0.95) {
            farmHireState.phase = 'seek';
        }
    }

    animateFarmWorker(dt, time, moving);
    updateFarmHireLabel();
}

function captureFarmHireState() {
    return {
        hired: farmHireState.hired,
        striking: farmHireState.striking,
        lastPaidDay: farmHireState.lastPaidDay
    };
}

function applyFarmHireState(save) {
    farmHireState.hired = !!(save && (save.hired || save.active));
    farmHireState.striking = !!(save && save.striking);
    farmHireState.lastPaidDay = Math.max(
        0,
        Math.trunc(Number(save && save.lastPaidDay) || currentFarmDay())
    );
    farmHireState.action = null;
    farmHireState.targetPlot = null;
    farmHireState.phase = farmHireState.hired && !farmHireState.striking ? 'seek' : 'idle';
    setWorkerTool(null);
    updateFarmHireLabel();
}

buildFarmWorkerContract();

/* ==========================================================
   FARM STREET LAMPS
   自动昼夜 + 手动开关
   ========================================================== */

const farmLamps = [];

/**
 * 创建一盏线稿风农场路灯
 */
function buildFarmLamp(x, y, z, rotationY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotationY;
    scene.add(g);

    /* ---------- 材质 ---------- */

    const poleMat = LITMAT(0x74746f);

    const darkMat = LITMAT(0x555550);

    const glassOffMat = new THREE.MeshBasicMaterial({
        color: 0xf2ead4,
        transparent: true,
        opacity: 0.55
    });

    const glassOnMat = new THREE.MeshBasicMaterial({
        color: 0xffd978,
        transparent: true,
        opacity: 0.88
    });


    /* ---------- 1. 底座 ---------- */

    put(
        edge(
            new THREE.CylinderGeometry(
                0.15, 0.19, 0.10, 10
            )
        ),
        0, 0.05, 0,
        0, 0, 0,
        g
    );


    /* ---------- 2. 灯杆 ---------- */

    const poleGeo =
        new THREE.CylinderGeometry(
            0.035,
            0.045,
            1.75,
            8
        );

    const pole = new THREE.Mesh(
        poleGeo,
        poleMat
    );

    pole.position.y = 0.95;

    pole.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(poleGeo, 20),
            MAT
        )
    );

    g.add(pole);


    /* ---------- 3. 顶部横臂 ---------- */

    const armGeo =
        new THREE.CylinderGeometry(
            0.025,
            0.025,
            0.42,
            8
        );

    const arm = new THREE.Mesh(
        armGeo,
        darkMat
    );

    arm.rotation.z = Math.PI / 2;
    arm.position.set(
        0.15,
        1.78,
        0
    );

    arm.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(armGeo, 20),
            MAT
        )
    );

    g.add(arm);


    /* ---------- 4. 灯罩 ---------- */

    const shadeGeo =
        new THREE.ConeGeometry(
            0.16,
            0.12,
            12,
            1,
            true
        );

    const shade = new THREE.Mesh(
        shadeGeo,
        darkMat
    );

    shade.position.set(
        0.32,
        1.70,
        0
    );

    shade.rotation.z = Math.PI;

    shade.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(shadeGeo, 20),
            MAT
        )
    );

    g.add(shade);


    /* ---------- 5. 灯泡 ---------- */

    const bulbGeo =
        new THREE.SphereGeometry(
            0.075,
            12,
            8
        );

    const bulb = new THREE.Mesh(
        bulbGeo,
        glassOffMat
    );

    bulb.position.set(
        0.32,
        1.62,
        0
    );

    g.add(bulb);


    /* ---------- 6. 真正负责照明的 PointLight ---------- */

    const light = new THREE.PointLight(
        0xffc766, // 暖黄色
        0,        // 初始关闭
        4.5,      // 照明范围
        2
    );

    light.position.copy(
        bulb.position
    );

    g.add(light);


    /* ---------- 7. 柔和光晕 ---------- */

    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(
            0.14,
            12,
            8
        ),
        new THREE.MeshBasicMaterial({
            color: 0xffd978,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );

    glow.position.copy(
        bulb.position
    );

    glow.renderOrder = 8;

    g.add(glow);


    /* ---------- 状态 ---------- */

    g.userData.lamp = {
        light,
        bulb,
        glow,

        glassOffMat,
        glassOnMat,

        // null = 自动
        // true = 强制打开
        // false = 强制关闭
        manualOverride: null,

        isOn: false
    };


    /* ---------- 点击灯进行手动控制 ---------- */

    regMagic(g, () => {

        const state = g.userData.lamp;

        if (state.manualOverride === null) {

            // 第一次点击：
            // 与当前状态相反
            state.manualOverride =
                !state.isOn;

        } else {

            // 后续点击切换
            state.manualOverride =
                !state.manualOverride;
        }

        updateFarmLamp(g);
    });


    farmLamps.push(g);

    return g;
}


/* ==========================================================
   打开 / 关闭灯
   ========================================================== */

function setFarmLampState(lamp, on) {

    const state =
        lamp.userData.lamp;

    if (state.isOn === on)
        return;

    state.isOn = on;

    if (on) {

        state.light.intensity = 1.4;

        state.bulb.material =
            state.glassOnMat;

        state.glow.material.opacity =
            0.22;

    } else {

        state.light.intensity = 0;

        state.bulb.material =
            state.glassOffMat;

        state.glow.material.opacity =
            0;
    }
}


/* ==========================================================
   判断一盏灯现在应该亮还是灭
   ========================================================== */

function updateFarmLamp(lamp) {

    const state =
        lamp.userData.lamp;


    /* ----- 手动模式优先 ----- */

    if (state.manualOverride !== null) {

        setFarmLampState(
            lamp,
            state.manualOverride
        );

        return;
    }


    /* ----- 自动模式 ----- */

    // 假设项目里有 hour
    // 18:00 后开灯
    // 06:00 后关灯

    const isNight =
        hour >= 18 ||
        hour < 6;

    setFarmLampState(
        lamp,
        isNight
    );
}


/* ==========================================================
   更新所有灯
   ========================================================== */

function updateFarmLamps() {

    for (const lamp of farmLamps) {
        updateFarmLamp(lamp);
    }
}
buildFarmLamp(13, 0.0, 4,  2);
buildFarmLamp(10, 0.0, 4,  1.5);
buildFarmLamp(7, 0.0, 4,  1);

buildFarmLamp(13, 0.0, -4,  -2);
buildFarmLamp(10, 0.0, -4, -1.5);
buildFarmLamp(7, 0.0, -4,  -1);
