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
function plantFarmCrop(state) {
    if (
        window.useBackpackItem &&
        !window.useBackpackItem('turnipSeed', 1)
    ) {
        SND.play('toggle');
        return;
    }

    state.crop = createTurnip(state.x, 0.02, state.z);
    state.watered = false;
    applyFarmPlotState(state, 'chim');
    showHintOverride('萝卜种子已经种下，背包种子 -1，装备水壶继续浇水');
}
function growFarmCrop(state) {
    const cropData = state.crop.userData.crop;
    if (cropData.stage >= 3) return;
    state.watered = true;
    setTurnipStage(state.crop, cropData.stage + 1);
    applyFarmPlotState(state, cropData.stage >= 3 ? 'magic' : 'chim');
    showHintOverride(cropData.stage >= 3 ? '萝卜成熟了，装备镰刀收获' : '萝卜长高了一点');
}
function harvestFarmCrop(state) {
    removeTurnip(state.crop);
    state.crop = null;
    state.watered = false;
    state.harvested++;
    applyFarmPlotState(state, 'magic');
    if (window.addCropToStorage) window.addCropToStorage('turnip', 1);
    if (window.addCabinCoins) window.addCabinCoins(10, '收获萝卜');
    else showHintOverride('收获萝卜 +1，可以继续播种');
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
