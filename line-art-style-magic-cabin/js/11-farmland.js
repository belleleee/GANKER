'use strict';
/* ========================================================== */
/* ============ 农田区域：6×6 地块（翻耕 / 播种 / 浇水 / 收获） ============ */
/* ========================================================== */
const FARMLAND_UNTILLED_COLOR = 0x7c8452; // 灰绿色：荒地，没打理过
const FARMLAND_TILLED_COLOR = 0xc2965f;   // 浅棕色：翻耕后，颜色一下子亮起来
const FARMLAND_WATERED_COLOR = 0x8f6a3f;  // 略深：浇水后
const FARM_WEED_MAT = LITMAT(0x5f7a3c);

const FARMLAND_CENTER = { x: 9.0, z: 0.0 }; // 小屋东侧空地，避开木屋/正门小路/树桩
const FARMLAND_N = 6, FARMLAND_SPACING = 1.2, FARMLAND_TILE_SIZE = 0.85, FARMLAND_TILE_H = 0.01;

const farmPlots = [];
const hoeSoilBursts = [];
const FARM_RESUME_HARVEST_TARGET = 3;
const FARM_WORKER_HIRE_COST = 80;
const FARM_WORKER_DAILY_WAGE = 60;
const FARM_WORKER_SPEED = 1.65;
const FARM_WORKER_PLANT_BATCH = 8;
const farmHireState = {
    hired: false,
    striking: false,
    lastPaidDay: 0,
    playerHarvests: 0,
    resumePrompted: false,
    resumeViewed: false,
    candidateUnlocked: false,
    dailyCropPlan: 'auto',
    worker: null,
    body: null,
    toolRoot: null,
    tools: {},
    signMesh: null,
    labelEntry: null,
    targetPlot: null,
    workCursor: 0,
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
    if (state.furrowGroup) state.furrowGroup.visible = state.tilled;
    if (state.weedGroup) state.weedGroup.visible = !state.tilled;
    if (state.gloss) state.gloss.visible = state.watered;
    const label = farmPlotLabel(state);
    state.group.userData.aimLabel = label;
    if (state.interactEntry) state.interactEntry.label = label;
    if (sound) SND.play(sound);
}
function plantFarmCropAs(state, cropId, silent) {
    const crop = (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[cropId]) ? CROP_TYPES[cropId] : CROP_TYPES.turnip;
    if (
        window.useBackpackItem &&
        !window.useBackpackItem(crop.seedItem, 1, silent)
    ) {
        if (!silent) SND.play('toggle');
        return false;
    }

    state.crop = createTurnip(state.x, 0.02, state.z, null, crop.id);
    state.watered = false;
    applyFarmPlotState(state, 'chim');
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('farmPlant', { cropId: crop.id });
    }
    if (!silent) showHintOverride(crop.name + '种子已经种下，背包种子 -1，装备水壶继续浇水');
    return true;
}
function pickAutoPlantCrop() {
    if (typeof CROP_ORDER === 'undefined' || typeof window.getBackpackItemCount !== 'function') return 'turnip';
    let best = 'turnip';
    let bestCount = -1;
    CROP_ORDER.forEach(id => {
        const crop = CROP_TYPES[id];
        const count = window.getBackpackItemCount(crop.seedItem);
        if (count > bestCount) {
            best = id;
            bestCount = count;
        }
    });
    return bestCount > 0 ? best : 'turnip';
}

function isFarmCropId(cropId) {
    return typeof CROP_TYPES !== 'undefined' && !!CROP_TYPES[cropId];
}

function getFarmCropName(cropId) {
    if (cropId === 'auto') return '自己判断';
    return isFarmCropId(cropId) ? CROP_TYPES[cropId].name : '自己判断';
}

function farmWorkerPlanText() {
    const plan = currentFarmWorkerCropPlan();
    return plan === 'auto' ? '自己判断' : '种' + getFarmCropName(plan);
}

function currentFarmWorkerCropPlan() {
    return isFarmCropId(farmHireState.dailyCropPlan) ? farmHireState.dailyCropPlan : 'auto';
}

function pickFarmWorkerPlantCrop() {
    const plan = currentFarmWorkerCropPlan();
    if (plan !== 'auto' && typeof window.getBackpackItemCount === 'function') {
        const crop = CROP_TYPES[plan];
        if (window.getBackpackItemCount(crop.seedItem) > 0) return plan;
    }
    return pickAutoPlantCrop();
}

function plantFarmCrop(state, silent) {
    return plantFarmCropAs(state, pickAutoPlantCrop(), silent);
}
function growFarmCrop(state, silent) {
    const cropData = state.crop.userData.crop;
    if (cropData.stage >= 3) return false;
    state.watered = true;
    setTurnipStage(state.crop, cropData.stage + 1);
    applyFarmPlotState(state, cropData.stage >= 3 ? 'magic' : 'chim');
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('farmWater');
    }
    if (!silent) showHintOverride(cropData.stage >= 3 ? '作物成熟了，装备镰刀收获' : '作物长高了一点');
    return true;
}
function harvestFarmCrop(state, silent) {
    const cropId = (state.crop.userData.crop && state.crop.userData.crop.cropType) || 'turnip';
    const cropDef = (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[cropId]) ? CROP_TYPES[cropId] : CROP_TYPES.turnip;
    removeTurnip(state.crop);
    state.crop = null;
    state.watered = false;
    state.harvested++;
    applyFarmPlotState(state, 'magic');
    if (window.addCropToStorage) window.addCropToStorage(cropDef.storageKey, 1);
    const multiplier = typeof cropWeatherMultiplier === 'function' ? cropWeatherMultiplier(cropId) : 1;
    const coins = Math.max(1, Math.round(cropDef.harvestCoins * multiplier));
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('farmHarvest', { cropId, multiplier });
    }
    if (window.addCabinCoins) {
        if (silent) window.addCabinCoins(coins, false);
        else window.addCabinCoins(coins, '收获' + cropDef.name + (multiplier > 1 ? '（天气加成）' : multiplier < 1 ? '（天气减产）' : ''));
    } else if (!silent) {
        showHintOverride('收获' + cropDef.name + ' +1，可以继续播种');
    }
    if (!silent) noteFarmPlayerHarvest();
    return true;
}

function spawnHoeSoilBurst(x, z) {
    const soilMat = LITMAT(0x9b7145);
    for (let i = 0; i < 7; i++) {
        const clod = solid(new THREE.IcosahedronGeometry(0.035 + Math.random() * 0.025, 0), soilMat);
        const a = Math.random() * Math.PI * 2;
        const speed = 0.45 + Math.random() * 0.45;
        clod.position.set(
            x + Math.cos(a) * 0.08,
            0.08,
            z + Math.sin(a) * 0.08
        );
        clod.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        scene.add(clod);
        hoeSoilBursts.push({
            mesh: clod,
            vx: Math.cos(a) * speed,
            vy: 0.55 + Math.random() * 0.35,
            vz: Math.sin(a) * speed,
            life: 0.42
        });
    }
}

function updateHoeSoilBursts(dt) {
    for (let i = hoeSoilBursts.length - 1; i >= 0; i--) {
        const p = hoeSoilBursts[i];
        p.life -= dt;
        p.vy -= 2.6 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y = Math.max(0.025, p.mesh.position.y + p.vy * dt);
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += dt * 7.0;
        p.mesh.rotation.z += dt * 5.5;
        p.mesh.scale.setScalar(Math.max(0.05, p.life / 0.42));
        if (p.life <= 0) {
            scene.remove(p.mesh);
            hoeSoilBursts.splice(i, 1);
        }
    }
}

function onFarmPlotClick(state) {
    if (typeof window.requestLandAccess === 'function' && !window.requestLandAccess()) {
        return;
    }
    if (!state.tilled) {
        if (slotSel !== TOOL_SLOT.hoe) {
            SND.play('toggle');
            showHintOverride('需要先装备锄头 · 按 <b>3</b>');
            return;
        }
        if (!triggerToolSwing('hoe', () => {
            spawnHoeSoilBurst(state.x, state.z);
            state.tilled = true;
            state.watered = false;
            applyFarmPlotState(state, 'ui');
            if (typeof window.noteAchievementEvent === 'function') {
                window.noteAchievementEvent('farmTill');
            }
            showHintOverride('土地已经翻好，空手点击可以播种');
        })) SND.play('toggle'); // 锄头正在挥动中
    } else if (!state.crop) {
        if (slotSel !== 1) {
            SND.play('toggle');
            showHintOverride('需要先空手播种 · 按 <b>1</b>');
            return;
        }
        if (typeof window.openCropPicker === 'function') {
            window.openCropPicker(cropId => {
                if (cropId) plantFarmCropAs(state, cropId);
            });
        } else {
            plantFarmCrop(state);
        }
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

    /* ---------- 犁沟：翻地后浮现的田垄纹理 ---------- */
    const furrowGroup = new THREE.Group();
    const furrowMat = LITMAT(0xa9824f);
    const FURROW_ROWS = 4;
    for (let i = 0; i < FURROW_ROWS; i++) {
        const ridge = solid(
            new THREE.BoxGeometry(FARMLAND_TILE_SIZE * 0.92, 0.026, FARMLAND_TILE_SIZE / FURROW_ROWS * 0.5),
            furrowMat
        );
        ridge.position.set(
            0,
            FARMLAND_TILE_H + 0.013,
            -FARMLAND_TILE_SIZE / 2 + (i + 0.5) * (FARMLAND_TILE_SIZE / FURROW_ROWS)
        );
        furrowGroup.add(ridge);
    }
    furrowGroup.visible = false;
    g.add(furrowGroup);

    /* ---------- 杂草：没翻地之前，这块地看起来是荒废的 ---------- */
    const weedGroup = new THREE.Group();
    const WEED_TUFTS = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < WEED_TUFTS; i++) {
        const bx = (Math.random() - 0.5) * FARMLAND_TILE_SIZE * 0.7;
        const bz = (Math.random() - 0.5) * FARMLAND_TILE_SIZE * 0.7;
        const bladeCount = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < bladeCount; j++) {
            const h = 0.09 + Math.random() * 0.10;
            const ang = Math.random() * Math.PI * 2;
            const lean = 0.16 + Math.random() * 0.20;
            const blade = new THREE.Mesh(new THREE.ConeGeometry(0.018, 1, 4), FARM_WEED_MAT);
            blade.scale.set(1, h, 1);
            blade.position.set(
                bx + Math.cos(ang) * 0.035,
                FARMLAND_TILE_H + h * 0.5,
                bz + Math.sin(ang) * 0.035
            );
            blade.rotation.set(Math.cos(ang) * lean, Math.random() * Math.PI, Math.sin(ang) * lean);
            weedGroup.add(blade);
        }
    }
    g.add(weedGroup);

    /* ---------- 浇水后的湿润光泽 ---------- */
    const glossMat = new THREE.MeshBasicMaterial({
        color: 0x2c2013,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
    });
    const gloss = new THREE.Mesh(
        new THREE.PlaneGeometry(FARMLAND_TILE_SIZE * 0.94, FARMLAND_TILE_SIZE * 0.94),
        glossMat
    );
    gloss.rotation.x = -Math.PI / 2;
    gloss.position.y = FARMLAND_TILE_H + 0.006;
    gloss.visible = false;
    g.add(gloss);

    /* ---------- 靠近时的瞄准描边 ---------- */
    const highlightMat = new THREE.LineBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.9
    });
    const hw = FARMLAND_TILE_SIZE / 2;
    const highlight = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-hw, FARMLAND_TILE_H + 0.02, -hw),
            new THREE.Vector3(hw, FARMLAND_TILE_H + 0.02, -hw),
            new THREE.Vector3(hw, FARMLAND_TILE_H + 0.02, hw),
            new THREE.Vector3(-hw, FARMLAND_TILE_H + 0.02, hw)
        ]),
        highlightMat
    );
    highlight.visible = false;
    g.add(highlight);

    const state = {
        tilled: false,
        watered: false,
        crop: null,
        harvested: 0,
        group: g,
        material: mat,
        x, z,
        interactEntry: null,
        furrowGroup,
        weedGroup,
        gloss,
        highlight
    };
    g.userData.aimLabel = farmPlotLabel(state);
    regMagic(g, () => onFarmPlotClick(state));
    const entry = { x, z, r: 0.9, label: farmPlotLabel(state), act: () => onFarmPlotClick(state) };
    state.interactEntry = entry;
    interactables.push(entry);
    farmPlots.push(state);
    return state;
}

/* ---------- 每帧检测最近的地块，点亮瞄准描边 ---------- */
let focusedFarmPlot = null;
const FARM_FOCUS_RADIUS = 1.25;
function updateFarmPlotFocus(dt, time) {
    if (typeof player === 'undefined') return;
    updateHoeSoilBursts(dt);
    let best = null;
    let bestD = FARM_FOCUS_RADIUS;
    for (const state of farmPlots) {
        const d = Math.hypot(player.pos.x - state.x, player.pos.z - state.z);
        if (d < bestD) {
            bestD = d;
            best = state;
        }
    }
    if (best !== focusedFarmPlot) {
        if (focusedFarmPlot) focusedFarmPlot.highlight.visible = false;
        focusedFarmPlot = best;
    }
    if (focusedFarmPlot) {
        focusedFarmPlot.highlight.visible = true;
        focusedFarmPlot.highlight.material.opacity = 0.55 + Math.sin(time * 4.2) * 0.35;
    }
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

function drawFarmHireLabel(canvas, text, subtext) {
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
    ctx.fillText(subtext, 128, 84);
}

function makeFarmHireLabel(text, subtext) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    drawFarmHireLabel(canvas, text, subtext);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.44), material);
    mesh.userData.labelCanvas = canvas;
    mesh.userData.labelTexture = texture;
    return mesh;
}

function updateFarmHireSignMesh() {
    const mesh = farmHireState.signMesh;
    if (!mesh || !mesh.userData.labelCanvas) return;
    drawFarmHireLabel(mesh.userData.labelCanvas, farmHireSignTitle(), farmHireSignSubtext());
    if (mesh.userData.labelTexture) mesh.userData.labelTexture.needsUpdate = true;
}

function currentFarmDay() {
    if (typeof gameSec !== 'number') return 0;
    return Math.floor(gameSec / (24 * 3600));
}

function farmHireLabel() {
    if (farmHireState.striking) return '农工罢工中 · 补发工资';
    if (farmHireState.hired) return '和农工对话 · ' + farmWorkerPlanText();
    if (farmHireState.playerHarvests < FARM_RESUME_HARVEST_TARGET) {
        return '收割萝卜 ' + farmHireState.playerHarvests + '/' + FARM_RESUME_HARVEST_TARGET + ' 后开放招聘';
    }
    if (!farmHireState.resumeViewed) return '查看第一份简历';
    return '雇佣农场经营者';
}

function farmHireSignTitle() {
    if (farmHireState.striking) return '补发工资';
    if (farmHireState.hired) return '经营中';
    if (farmHireState.playerHarvests < FARM_RESUME_HARVEST_TARGET) return '农场招募';
    if (!farmHireState.resumeViewed) return '查看简历';
    return '雇佣申请人';
}

function farmHireSignSubtext() {
    if (farmHireState.striking) return '日薪 ' + FARM_WORKER_DAILY_WAGE + ' 金币';
    if (farmHireState.hired) return '计划：' + farmWorkerPlanText();
    if (farmHireState.playerHarvests < FARM_RESUME_HARVEST_TARGET) {
        return '收割 ' + farmHireState.playerHarvests + '/' + FARM_RESUME_HARVEST_TARGET;
    }
    if (!farmHireState.resumeViewed) return '读完序章后面试';
    return '雇佣费 ' + FARM_WORKER_HIRE_COST + ' 金币';
}

function updateFarmHireLabel() {
    if (farmHireState.labelEntry) farmHireState.labelEntry.label = farmHireLabel();
    if (farmHireState.worker) farmHireState.worker.userData.aimLabel = farmHireLabel();
    updateFarmHireSignMesh();
}

function saveFarmHireStateNow() {
    if (typeof saveGameState === 'function') saveGameState(false);
}

const farmWorkerPanel = document.getElementById('farmWorkerPanel');
const farmWorkerStatus = document.getElementById('farmWorkerStatus');
const farmWorkerCropOptions = document.getElementById('farmWorkerCropOptions');
const closeFarmWorkerBtn = document.getElementById('closeFarmWorkerBtn');

function farmWorkerSeedCount(cropId) {
    if (!isFarmCropId(cropId) || typeof window.getBackpackItemCount !== 'function') return 0;
    return window.getBackpackItemCount(CROP_TYPES[cropId].seedItem);
}

function farmWorkerCropNote(cropId) {
    if (cropId === 'auto') return '员工会优先种背包里最多的种子，指定作物缺种子时也会临时这样处理。';
    const weatherNote = typeof cropWeatherNote === 'function' ? cropWeatherNote(cropId) : '';
    return weatherNote || '员工会优先寻找这种种子来播种。';
}

function renderFarmWorkerPanel() {
    if (!farmWorkerPanel || !farmWorkerCropOptions) return;
    const plan = currentFarmWorkerCropPlan();
    const chosenText = plan === 'auto'
        ? '当前指令：让员工自己判断。'
        : '当前指令：优先种' + getFarmCropName(plan) + '。';
    if (farmWorkerStatus) {
        farmWorkerStatus.textContent = chosenText + ' 每天工作时会按这个安排播种；如果指定作物没有种子，会自动改种其他有种子的作物。';
    }

    const options = ['auto'].concat(typeof CROP_ORDER !== 'undefined' ? CROP_ORDER : ['turnip']);
    farmWorkerCropOptions.innerHTML = options.map(cropId => {
        const active = cropId === plan ? ' isActive' : '';
        if (cropId === 'auto') {
            return '<button type="button" class="farmWorkerCropOption' + active + '" data-crop="auto">' +
                '<span class="farmWorkerCropIcon">◎</span>' +
                '<span class="farmWorkerCropName">自己判断</span>' +
                '<span class="farmWorkerCropCount">推荐</span>' +
                '<span class="farmWorkerCropNote">' + farmWorkerCropNote('auto') + '</span>' +
                '</button>';
        }
        const crop = CROP_TYPES[cropId];
        return '<button type="button" class="farmWorkerCropOption' + active + '" data-crop="' + cropId + '">' +
            '<span class="farmWorkerCropIcon">' + crop.icon + '</span>' +
            '<span class="farmWorkerCropName">优先种' + crop.name + '</span>' +
            '<span class="farmWorkerCropCount">种子 ×' + farmWorkerSeedCount(cropId) + '</span>' +
            '<span class="farmWorkerCropNote">' + farmWorkerCropNote(cropId) + '</span>' +
            '</button>';
    }).join('');
}

function openFarmWorkerPanel() {
    if (!farmWorkerPanel) {
        showHintOverride('农场员工：现在计划种' + getFarmCropName(currentFarmWorkerCropPlan()));
        return;
    }
    renderFarmWorkerPanel();
    farmWorkerPanel.hidden = false;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    if (typeof SND !== 'undefined') SND.play('ui');
}

function closeFarmWorkerPanel() {
    if (!farmWorkerPanel) return;
    farmWorkerPanel.hidden = true;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
}

function setupFarmWorkerPanel() {
    if (closeFarmWorkerBtn) closeFarmWorkerBtn.addEventListener('click', closeFarmWorkerPanel);
    if (farmWorkerPanel) {
        farmWorkerPanel.addEventListener('click', event => {
            if (event.target === farmWorkerPanel) closeFarmWorkerPanel();
        });
    }
    if (farmWorkerCropOptions) {
        farmWorkerCropOptions.addEventListener('click', event => {
            const btn = event.target.closest('.farmWorkerCropOption');
            if (!btn) return;
            const cropId = btn.dataset.crop || 'auto';
            farmHireState.dailyCropPlan = isFarmCropId(cropId) ? cropId : 'auto';
            renderFarmWorkerPanel();
            updateFarmHireLabel();
            saveFarmHireStateNow();
            if (typeof SND !== 'undefined') SND.play('ui');
            showHintOverride('已告诉农场员工：' + (farmHireState.dailyCropPlan === 'auto' ? '自己判断今天种什么' : '优先种' + getFarmCropName(farmHireState.dailyCropPlan)));
        });
    }
    addEventListener('keydown', event => {
        if (!farmWorkerPanel || farmWorkerPanel.hidden) return;
        if (event.key === 'Escape') closeFarmWorkerPanel();
    });
}

function noteFarmPlayerHarvest() {
    farmHireState.playerHarvests = Math.max(
        farmHireState.playerHarvests + 1,
        farmPlots.reduce((sum, p) => sum + (p.harvested || 0), 0)
    );
    if (
        farmHireState.playerHarvests >= FARM_RESUME_HARVEST_TARGET &&
        !farmHireState.resumePrompted &&
        !farmHireState.hired
    ) {
        farmHireState.resumePrompted = true;
        showHintOverride('你觉得一个人经营农场太累了，也许该看看第一份求职简历');
    }
    updateFarmHireLabel();
    saveFarmHireStateNow();
}

function workerPlantFarmCrop(state) {
    if (
        state.crop
    ) {

        return false;
    }

    return plantFarmCropAs(
        state,
        pickFarmWorkerPlantCrop(),
        true
    );
}

function pickFarmWorkerCandidate(
    candidates
) {

    if (
        !candidates.length
    ) {

        return null;
    }

    const total =
        farmPlots.length;

    let best =
        candidates[0];

    let bestStep =
        total + 1;

    for (
        const plot of candidates
    ) {

        const index =
            farmPlots.indexOf(
                plot
            );

        const step =
            (
                index -
                farmHireState.workCursor +
                total
            ) %
            total;

        if (
            step < bestStep
        ) {

            best =
                plot;

            bestStep =
                step;
        }
    }

    return best;
}

function chooseFarmWorkerPlot() {
    const growingCount =
        farmPlots.filter(p => p.crop && p.crop.userData.crop.stage < 3).length;
    const shouldPlantMore =
        growingCount < FARM_WORKER_PLANT_BATCH;

    return pickFarmWorkerCandidate(
        farmPlots.filter(p => p.crop && p.crop.userData.crop.stage >= 3)
    ) ||
        (
            shouldPlantMore
                ? pickFarmWorkerCandidate(farmPlots.filter(p => p.tilled && !p.crop))
                : null
        ) ||
        (
            shouldPlantMore
                ? pickFarmWorkerCandidate(farmPlots.filter(p => !p.tilled))
                : null
        ) ||
        pickFarmWorkerCandidate(
            farmPlots.filter(p => p.crop && p.crop.userData.crop.stage < 3)
        ) ||
        pickFarmWorkerCandidate(
            farmPlots.filter(p => p.tilled && !p.crop)
        ) ||
        pickFarmWorkerCandidate(
            farmPlots.filter(p => !p.tilled)
        ) ||
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
        return { name: 'seed', label: '播种', apply: () => workerPlantFarmCrop(plot) };
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

function openFarmResumeStory() {
    const panel = document.getElementById('farmResumePanel');
    const frame = document.getElementById('farmResumeFrame');
    if (!panel || !frame) {
        showHintOverride('第一份简历已经放在桌上：先阅读序章剧情');
        return;
    }
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    frame.src = 'prologue/first.html';
    panel.hidden = false;
}

function closeFarmResumeStory() {
    const panel = document.getElementById('farmResumePanel');
    const frame = document.getElementById('farmResumeFrame');
    if (panel) panel.hidden = true;
    if (frame) frame.src = 'about:blank';
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    window.APP_SHELL_BLOCK_GAME = false;
}

function completeFarmResumeStory() {
    farmHireState.resumeViewed = true;
    farmHireState.candidateUnlocked = true;
    farmHireState.resumePrompted = true;
    closeFarmResumeStory();
    updateFarmHireLabel();
    SND.play('chim');
    showHintOverride('简历读完了：申请人想来经营农场，帮助家里减轻负担');
    saveFarmHireStateNow();
}

function setupFarmResumePanel() {
    const closeBtn = document.getElementById('closeFarmResumeBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeFarmResumeStory);
    window.addEventListener('message', event => {
        if (!event.data || event.data.type !== 'farm-resume-complete') return;
        completeFarmResumeStory();
    });
}

function hireFarmWorker() {
    if (
        !farmHireState.hired &&
        farmHireState.playerHarvests < FARM_RESUME_HARVEST_TARGET
    ) {
        const left = FARM_RESUME_HARVEST_TARGET - farmHireState.playerHarvests;
        showHintOverride('你还没累到想招人 · 再亲自收割 ' + left + ' 次萝卜');
        return;
    }

    if (!farmHireState.hired && !farmHireState.resumeViewed) {
        farmHireState.resumePrompted = true;
        updateFarmHireLabel();
        saveFarmHireStateNow();
        openFarmResumeStory();
        return;
    }

    if (!farmHireState.hired) {
        if (!window.spendCabinCoins) {
            showHintOverride('金币系统还没准备好，暂时不能雇佣');
            return;
        }
        if (!window.spendCabinCoins(FARM_WORKER_HIRE_COST, '雇佣农场经营者')) return;
        farmHireState.hired = true;
        farmHireState.lastPaidDay = currentFarmDay();
        farmHireState.phase = 'seek';
        updateFarmHireLabel();
        SND.play('chim');
        showHintOverride('已雇佣农场经营者 · 日结工资 ' + FARM_WORKER_DAILY_WAGE);
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
    openFarmWorkerPanel();
}

function makeWorkerToolPart(geo, mat) {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, mat || LITMAT(0xc59a68));
    g.add(mesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 16), MAT));
    return g;
}

function farmToolSmooth(k) {
    const t =
        Math.max(
            0,
            Math.min(
                1,
                k
            )
        );

    return t *
        t *
        (
            3 -
            2 *
            t
        );
}

function buildWorkerTool(name) {
    const g = new THREE.Group();
    const wood = LITMAT(0xc59a68);
    const metal = LITMAT(0xb9bec0);
    const green = LITMAT(0x91aaa0);

    if (name === 'hoe') {
        const handle = makeWorkerToolPart(new THREE.CylinderGeometry(0.009, 0.013, 0.35, 8), wood);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = -0.05;
        g.add(handle);

        const grip = makeWorkerToolPart(new THREE.CylinderGeometry(0.014, 0.015, 0.08, 8), LITMAT(0x9e7049));
        grip.rotation.x = Math.PI / 2;
        grip.position.z = -0.205;
        g.add(grip);

        for (const z of [-0.225, -0.185]) {
            const wrap = makeWorkerToolPart(new THREE.TorusGeometry(0.016, 0.0028, 6, 12), LITMAT(0x8c9395));
            wrap.rotation.x = Math.PI / 2;
            wrap.position.z = z;
            g.add(wrap);
        }

        const socket = makeWorkerToolPart(new THREE.BoxGeometry(0.070, 0.052, 0.055), LITMAT(0x8c9395));
        socket.position.set(0, 0, 0.155);
        g.add(socket);

        const cap = makeWorkerToolPart(new THREE.BoxGeometry(0.052, 0.038, 0.026), LITMAT(0x9e7049));
        cap.position.set(0, 0.032, 0.158);
        g.add(cap);

        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(-0.078, 0.022);
        bladeShape.lineTo(0.078, 0.022);
        bladeShape.lineTo(0.055, -0.115);
        bladeShape.lineTo(-0.055, -0.115);
        bladeShape.closePath();
        const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.010, bevelEnabled: false });
        bladeGeo.translate(0, 0, -0.005);
        const blade = makeWorkerToolPart(bladeGeo, metal);
        blade.position.set(0, -0.030, 0.185);
        blade.rotation.x = -0.46;
        g.add(blade);
    } else if (name === 'wateringCan') {
        const body = makeWorkerToolPart(new THREE.CylinderGeometry(0.08, 0.095, 0.13, 14), green);
        body.rotation.x = Math.PI;
        g.add(body);
        const spout = makeWorkerToolPart(new THREE.CylinderGeometry(0.018, 0.028, 0.20, 8), green);
        spout.rotation.z = -Math.PI / 3;
        spout.position.set(0.13, 0.03, 0);
        g.add(spout);
        g.scale.setScalar(0.78);
    } else if (name === 'sickle') {
        const handle = makeWorkerToolPart(new THREE.CylinderGeometry(0.014, 0.018, 0.42, 8), wood);
        handle.rotation.x = Math.PI / 2;
        g.add(handle);
        const blade = makeWorkerToolPart(new THREE.TorusGeometry(0.11, 0.014, 6, 24, Math.PI * 0.9), metal);
        blade.position.set(-0.07, 0, 0.24);
        blade.rotation.set(Math.PI / 2, 0, Math.PI / 2);
        g.add(blade);
        g.scale.setScalar(0.82);
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

    const sign = makeFarmHireLabel(farmHireSignTitle(), farmHireSignSubtext());
    sign.position.set(0, 1.02, 0);
    sign.rotation.y = Math.PI / 2;
    g.add(sign);
    farmHireState.signMesh = sign;

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
    farmHireState.workCursor =
        (
            farmPlots.indexOf(
                plot
            ) +
            1
        ) %
        farmPlots.length;
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
        farmHireState.toolRoot.position.set(
            0.20,
            0.28 + Math.sin(time * 1.6) * 0.006,
            0.14
        );
        farmHireState.toolRoot.rotation.set(0, 0, 0);
        if (farmHireState.phase === 'act') {
            const raw = Math.min(1, farmHireState.actionTimer / 0.95);
            const swing = Math.sin(raw * Math.PI);
            const action = farmHireState.action && farmHireState.action.name;
            if (action === 'hoe') {
                const lift = raw < 0.25 ? farmToolSmooth(raw / 0.25) : 1;
                const strike = raw < 0.25 ? 0 : raw < 0.62 ? farmToolSmooth((raw - 0.25) / 0.37) : 1;
                const recoil = raw < 0.62 ? 0 : Math.sin(Math.min(1, (raw - 0.62) / 0.38) * Math.PI);
                farmHireState.toolRoot.position.y += 0.034 * lift + 0.014 * strike + 0.010 * recoil;
                farmHireState.toolRoot.position.z += -0.014 * lift + 0.060 * strike - 0.008 * recoil;
                farmHireState.toolRoot.rotation.x = 0.30 * lift + 0.64 * strike - 0.10 * recoil;
                farmHireState.toolRoot.rotation.y = -0.08 * lift + 0.05 * strike;
                farmHireState.toolRoot.rotation.z = 0.16 * lift - 0.10 * strike + 0.04 * recoil;
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

    const landOk = typeof window.isLandOwnedOrRented !== 'function' || window.isLandOwnedOrRented();
    if (!farmHireState.hired || farmHireState.striking || !landOk) {
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
        const actionHitTime = farmHireState.action && farmHireState.action.name === 'hoe' ? 0.62 : 0.50;
        if (farmHireState.actionTimer >= actionHitTime && farmHireState.action) {
            const action = farmHireState.action;
            farmHireState.action = null;
            if (action.name === 'hoe' && farmHireState.targetPlot) {
                spawnHoeSoilBurst(farmHireState.targetPlot.x, farmHireState.targetPlot.z);
            }
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
        lastPaidDay: farmHireState.lastPaidDay,
        playerHarvests: farmHireState.playerHarvests,
        resumePrompted: farmHireState.resumePrompted,
        resumeViewed: farmHireState.resumeViewed,
        candidateUnlocked: farmHireState.candidateUnlocked,
        dailyCropPlan: currentFarmWorkerCropPlan()
    };
}

function applyFarmHireState(save) {
    farmHireState.hired = !!(save && (save.hired || save.active));
    farmHireState.striking = !!(save && save.striking);
    farmHireState.lastPaidDay = Math.max(
        0,
        Math.trunc(Number(save && save.lastPaidDay) || currentFarmDay())
    );
    const savedHarvests = Math.trunc(Number(save && save.playerHarvests) || 0);
    const plotHarvests = farmPlots.reduce((sum, p) => sum + (p.harvested || 0), 0);
    farmHireState.playerHarvests = Math.max(0, savedHarvests, plotHarvests);
    farmHireState.resumePrompted = !!(
        save &&
        save.resumePrompted
    ) || farmHireState.playerHarvests >= FARM_RESUME_HARVEST_TARGET;
    farmHireState.resumeViewed = !!(
        farmHireState.hired ||
        (save && (save.resumeViewed || save.candidateUnlocked))
    );
    farmHireState.candidateUnlocked = !!(
        farmHireState.resumeViewed ||
        (save && save.candidateUnlocked)
    );
    farmHireState.dailyCropPlan = isFarmCropId(save && save.dailyCropPlan) ? save.dailyCropPlan : 'auto';
    farmHireState.action = null;
    farmHireState.targetPlot = null;
    farmHireState.phase = farmHireState.hired && !farmHireState.striking ? 'seek' : 'idle';
    setWorkerTool(null);
    updateFarmHireLabel();
}

setupFarmResumePanel();
setupFarmWorkerPanel();
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
