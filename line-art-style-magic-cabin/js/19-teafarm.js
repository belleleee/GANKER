'use strict';

/* ==========================================================
   19. TEA FARM
   线稿风茶场：茶垄 / 茶树 / 成熟嫩芽 / 逐株采摘 / 茶篓 / 再生

   依赖原项目：
   THREE
   scene
   MAT
   LITMAT
   put
   regMagic
   interactables
   solidBoxes
   SND
   showHintOverride
   player
   ========================================================== */


/* ==========================================================
   0. 基础配置
   ========================================================== */

const TEA_FARM_CENTER = {
    x: -11.5,
    z: -9.0
};

const TEA_ROWS = 4;
const TEA_COLS = 6;

const TEA_ROW_GAP = 1.45;
const TEA_COL_GAP = 1.05;

const TEA_GARDEN_ROW_DEPTH = 1.05;

const TEA_HUT_OFFSET = {
    x: 7.55,
    z: -3.00
};

/* 数值 = 墙体在 addHutLogWall 里的本地坐标 × g.scale(1.3)。
   房间放大过一次（四面墙的 fixed/halfLen 都改了），这里跟着
   重新算过——以后再调墙体位置/尺寸，记得同步换算这里，
   不然墙体碰撞盒会跟视觉模型对不上。 */
const TEA_HUT_COLLISION = {
    left: -2.34,
    right: 2.34,
    back: -1.76,
    front: 1.89,
    doorCenter: 1.18,
    doorHalf: 0.60
};

const TEA_PICK_DISTANCE = 1.15;

/*
   测试阶段先设为 45 秒。

   后面正式游戏可以改成：
   120
   300
   或者跟游戏内日期系统绑定。
*/
const TEA_REGROW_SECONDS = 75;
const TEA_PICK_COINS = 8;
const TEA_WORKER_DAILY_WAGE = 90;
const TEA_WEATHER_GOOD = ['fog', 'cloudy'];
const TEA_WEATHER_BAD = ['storm', 'blizzard'];
const TEA_WORKER_SPEED = 1.55;


/* ==========================================================
   1. 全局茶场状态
   ========================================================== */

const teaPlants = [];

const teaPickParticles = [];

const teaHutDoors = [];

let teaLeafCount = 0;

/* ==========================================================
   制茶流程：生茶青 → 晒茶筛 → 炒茶灶 → 工作台(装袋卖钱)
   采茶时立刻拿一笔小钱，是"卖鲜叶"；愿意攒够一批拿去
   小屋里三个工位加工，能换到明显更高的一笔——鼓励玩家
   真的走进小屋里跟这些"摆设"打交道，而不是路过看一眼。
   ========================================================== */
const TEA_PROCESS_BATCH = 5;
const TEA_FINISHED_SELL_PRICE = 45;
let teaProcessState = { raw: 0, dried: 0, roasted: 0, finished: 0 };

const teaRoastState = {
    lit: false,
    firePower: 0,
    stirTime: 0,
    stirPhase: 0,
    flames: [],
    panLeaves: null,
    panRim: null,
    glow: null
};

const teaHutLampState = {
    lit: true,
    core: null,
    beams: [],
    floorGlow: null,
    light: null
};

function setTeaHutLampLit(lit) {
    teaHutLampState.lit = lit;

    if (teaHutLampState.core) {
        teaHutLampState.core.visible = lit;
    }

    for (const beam of teaHutLampState.beams) {
        if (beam) {
            beam.visible = lit;
        }
    }

    if (teaHutLampState.floorGlow) {
        teaHutLampState.floorGlow.visible = lit;
    }

    if (teaHutLampState.light) {
        teaHutLampState.light.intensity = lit ? 1.15 : 0;
    }
}

function toggleTeaHutLamp() {
    setTeaHutLampLit(!teaHutLampState.lit);
    SND.play('lamp');
    showHintOverride(teaHutLampState.lit ? '茶屋吊灯点亮了' : '茶屋吊灯熄灭了');
}

function sieveTeaLeaves() {
    if (teaProcessState.raw < TEA_PROCESS_BATCH) {
        SND.play('toggle');
        showHintOverride('生茶青不够，还差 ' + (TEA_PROCESS_BATCH - teaProcessState.raw) + ' 份 · 先去茶园多采一点');
        return;
    }
    teaProcessState.raw -= TEA_PROCESS_BATCH;
    teaProcessState.dried += TEA_PROCESS_BATCH;
    SND.play('chim');
    showHintOverride('晒好一批茶青 · 得到 ' + TEA_PROCESS_BATCH + ' 份晒干茶青，去炒茶灶翻炒');
    if (typeof saveGameState === 'function') saveGameState(false);
}

function roastTeaLeaves() {
    if (!teaRoastState.lit) {
        SND.play('toggle');
        showHintOverride('炒茶灶还没点火 · 先靠近灶口点火');
        return;
    }

    if (teaProcessState.dried < TEA_PROCESS_BATCH) {
        SND.play('toggle');
        showHintOverride('晒干茶青不够，还差 ' + (TEA_PROCESS_BATCH - teaProcessState.dried) + ' 份 · 先去晒茶筛晒一批');
        return;
    }
    teaProcessState.dried -= TEA_PROCESS_BATCH;
    teaProcessState.roasted += TEA_PROCESS_BATCH;
    teaRoastState.stirTime = 3.2;
    teaRoastState.stirPhase = 0;
    SND.play('fire');
    showHintOverride('炒好一批茶叶 · 得到 ' + TEA_PROCESS_BATCH + ' 份炒制茶叶，去工作台分拣装袋');
    if (typeof saveGameState === 'function') saveGameState(false);
}

function toggleTeaRoastFire() {
    teaRoastState.lit = !teaRoastState.lit;

    if (!teaRoastState.lit) {
        teaRoastState.stirTime = 0;
    }

    SND.play('fire');
    showHintOverride(teaRoastState.lit ? '炒茶灶点着了 · 可以开始翻炒茶叶' : '炒茶灶熄灭了');
}

function makeTeaWorldInteract(
    parent,
    cfg,
    rootX,
    rootZ,
    rootScale
) {
    const hit =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                cfg.w,
                cfg.h,
                cfg.d
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0xffffff,

                transparent:
                    true,

                opacity:
                    0.01,

                depthWrite:
                    false
            })
        );

    hit.position.set(
        cfg.x,
        cfg.y,
        cfg.z
    );

    hit.userData.aimLabel =
        cfg.label;

    parent.add(
        hit
    );

    if (
        typeof regMagic ===
        'function'
    ) {
        regMagic(
            hit,
            cfg.act
        );
    }

    if (
        typeof interactables !==
        'undefined'
    ) {
        interactables.push({
            x:
                rootX +
                cfg.x *
                rootScale,

            z:
                rootZ +
                cfg.z *
                rootScale,

            r:
                cfg.r,

            label:
                cfg.label,

            act:
                cfg.act
        });
    }

    return hit;
}

function updateTeaRoastStation(dt, time) {
    const target = teaRoastState.lit ? 1 : 0;
    teaRoastState.firePower += (target - teaRoastState.firePower) * Math.min(1, dt * 7);

    const activeFire = teaRoastState.firePower > 0.025;
    for (const flame of teaRoastState.flames) {
        if (!flame || !flame.obj) continue;

        const pulse = 0.82 + Math.sin(time * flame.speed + flame.phase) * 0.18;
        flame.obj.visible = activeFire;
        flame.obj.scale.set(
            0.78 + teaRoastState.firePower * 0.30,
            Math.max(0.001, teaRoastState.firePower * pulse),
            0.78 + teaRoastState.firePower * 0.18
        );
        flame.obj.position.y = flame.baseY + Math.sin(time * 2.4 + flame.phase) * 0.012;
    }

    if (teaRoastState.glow) {
        teaRoastState.glow.visible = activeFire;
        teaRoastState.glow.scale.setScalar(0.85 + teaRoastState.firePower * 0.22);
        if (teaRoastState.glow.material) {
            teaRoastState.glow.material.opacity = 0.06 + teaRoastState.firePower * 0.13;
        }
    }

    if (teaRoastState.stirTime > 0) {
        teaRoastState.stirTime = Math.max(0, teaRoastState.stirTime - dt);
        teaRoastState.stirPhase += dt * 8.5;
    }

    const stirring = teaRoastState.stirTime > 0;
    if (teaRoastState.panLeaves) {
        const wobble = stirring ? Math.sin(teaRoastState.stirPhase) : Math.sin(time * 1.8) * 0.12;
        const hop = stirring ? Math.abs(Math.sin(teaRoastState.stirPhase * 1.35)) * 0.075 : 0;

        teaRoastState.panLeaves.rotation.y += dt * (stirring ? 4.6 : 0.25);
        teaRoastState.panLeaves.rotation.x = wobble * 0.18;
        teaRoastState.panLeaves.rotation.z = Math.sin(teaRoastState.stirPhase * 0.72) * (stirring ? 0.14 : 0.025);
        teaRoastState.panLeaves.position.x = Math.sin(teaRoastState.stirPhase * 0.9) * (stirring ? 0.08 : 0.018);
        teaRoastState.panLeaves.position.y = 0.56 + hop;
        teaRoastState.panLeaves.scale.set(
            1.20 + (stirring ? Math.sin(teaRoastState.stirPhase * 1.1) * 0.08 : 0),
            0.09 + (stirring ? Math.sin(teaRoastState.stirPhase * 1.6) * 0.025 : 0),
            0.82 + (stirring ? Math.cos(teaRoastState.stirPhase) * 0.06 : 0)
        );
    }

    if (teaRoastState.panRim) {
        teaRoastState.panRim.rotation.z = stirring ? Math.sin(teaRoastState.stirPhase * 1.2) * 0.035 : 0;
    }
}

function packageTeaLeaves() {
    if (teaProcessState.roasted < TEA_PROCESS_BATCH) {
        SND.play('toggle');
        showHintOverride('炒制茶叶不够，还差 ' + (TEA_PROCESS_BATCH - teaProcessState.roasted) + ' 份 · 先去炒茶灶炒一批');
        return;
    }
    teaProcessState.roasted -= TEA_PROCESS_BATCH;
    teaProcessState.finished += 1;
    if (typeof window.addCabinCoins === 'function') {
        window.addCabinCoins(TEA_FINISHED_SELL_PRICE, '卖出一批成品茶');
    }
    SND.play('ui');
    showHintOverride('分拣装袋完成 · 卖出一批成品茶 +' + TEA_FINISHED_SELL_PRICE + ' 金币（累计装过 ' + teaProcessState.finished + ' 批）');
    if (typeof saveGameState === 'function') saveGameState(false);
}

const teaHireState = {
    hired: false,
    striking: false,
    lastPaidDay: 0,
    worker: null,
    body: null,
    toolRoot: null,
    tool: null,
    labelEntry: null,
    targetPlant: null,
    phase: 'idle',
    actionTimer: 0,
    pulse: 0
};

function addTeaSolidBoxOnce(
    box
) {

    if (
        typeof solidBoxes ===
        'undefined' ||
        !box ||
        solidBoxes.includes(
            box
        )
    ) {

        return;
    }

    solidBoxes.push(
        box
    );
}

function removeTeaSolidBox(
    box
) {

    if (
        typeof solidBoxes ===
        'undefined' ||
        !box
    ) {

        return;
    }

    const idx =
        solidBoxes.indexOf(
            box
        );

    if (
        idx >=
        0
    ) {
        solidBoxes.splice(
            idx,
            1
        );
    }
}

function setTeaHutDoorBlock(
    doorState,
    closed
) {

    if (
        !doorState ||
        !doorState.block
    ) {

        return;
    }

    if (
        closed
    ) {
        addTeaSolidBoxOnce(
            doorState.block
        );
    } else {
        removeTeaSolidBox(
            doorState.block
        );
    }
}

function updateTeaHutDoors(
    dt
) {

    const k =
        Math.min(
            1,
            dt *
            7
        );

    for (
        const door of teaHutDoors
    ) {

        if (
            !door ||
            !door.pivot
        ) {

            continue;
        }

        const target =
            door.open ?
                1 :
                0;

        door.amount +=
            (
                target -
                door.amount
            ) *
            k;

        door.pivot.rotation.y =
            -1.42 *
            door.amount;
    }
}


/* ==========================================================
   2. 茶场材质

   仍然使用项目原本：
   LITMAT + EdgesGeometry + MAT

   不引入新的 shader。
   ========================================================== */

const teaWoodMat =
    LITMAT(
        0xa67c52
    );

const teaWoodDarkMat =
    LITMAT(
        0x75583f
    );

/* 屋顶/部分墙体专用的半透明材质。
   注意：不能用 LITMAT——LITMAT 生成的是共用 FILL 那套自定义
   ShaderMaterial，它的片元着色器里写死了 gl_FragColor = vec4(finalColor, 1.0)，
   根本不读 opacity/transparent 这两个属性，设了也白设，之前的"透明"从没生效过。
   这里改用普通的 MeshBasicMaterial，它是内置材质，真的会按 opacity 混合。 */
const teaRoofMat = new THREE.MeshBasicMaterial({
    color: 0x75583f,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    side: THREE.DoubleSide
});

const teaPostGhostMat = new THREE.MeshBasicMaterial({
    color: 0x75583f,
    transparent: true,
    opacity: 0.18,
    depthWrite: false
});

const teaPostGhostLineMat =
    MAT.clone();

teaPostGhostLineMat.transparent =
    true;

teaPostGhostLineMat.opacity =
    0.26;

teaPostGhostLineMat.depthWrite =
    false;

const teaBackWallGhostMat = new THREE.MeshBasicMaterial({
    color: 0xf4eedb,
    transparent: true,
    opacity: 0.20,
    depthWrite: false,
    side: THREE.DoubleSide
});

const teaBackWallGhostLineMat =
    MAT.clone();

teaBackWallGhostLineMat.transparent =
    true;

teaBackWallGhostLineMat.opacity =
    0.22;

teaBackWallGhostLineMat.depthWrite =
    false;

const teaBackWindowGhostMat = new THREE.MeshBasicMaterial({
    color: 0xa67c52,
    transparent: true,
    opacity: 0.22,
    depthWrite: false
});

const teaLeafMat =
    LITMAT(
        0x78966b
    );

const teaLeafLightMat =
    LITMAT(
        0x9eb48a
    );

const teaBudMat =
    LITMAT(
        0xb9ca9e
    );

const teaSoilMat =
    LITMAT(
        0xc8ad82
    );

const teaGroundMat =
    LITMAT(
        0xeee2c5
    );

const teaSlopeMat =
    LITMAT(
        0x8ba85f
    );

const teaSlopeDarkMat =
    LITMAT(
        0x749450
    );

const teaSlopeEarthMat =
    LITMAT(
        0x8a6a45
    );

const teaTuftMat =
    LITMAT(
        0x6f9a55
    );

const teaBasketMat =
    LITMAT(
        0xc59a68
    );

const teaStoneMat =
    LITMAT(
        0xb8b2a3
    );

const teaClothMat =
    LITMAT(
        0xf4eedb
    );

const teaWaterMat =
    LITMAT(
        0x9db7ad
    );

const teaCharcoalMat =
    LITMAT(
        0x34312c
    );


/* ==========================================================
   3. 通用线稿模型函数

   结构：
       Group
       ├── Mesh
       └── EdgesGeometry

   与原项目的线稿视觉保持一致。
   ========================================================== */

function teaPart(
    geo,
    mat,
    threshold = 18
) {

    const g =
        new THREE.Group();


    const mesh =
        new THREE.Mesh(
            geo,
            mat
        );


    g.add(
        mesh
    );


    const edges =
        new THREE.LineSegments(
            new THREE.EdgesGeometry(
                geo,
                threshold
            ),
            MAT
        );


    g.add(
        edges
    );


    return g;
}

function makeTeaTextPlane(
    lines,
    width,
    height,
    options = {}
) {

    const canvas =
        document.createElement(
            'canvas'
        );


    canvas.width =
        512;


    canvas.height =
        320;


    const ctx =
        canvas.getContext(
            '2d'
        );


    ctx.fillStyle =
        options.bg ||
        '#f4ecd7';


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        options.stroke ||
        '#75583f';


    ctx.lineWidth =
        8;


    ctx.strokeRect(
        16,
        16,
        canvas.width - 32,
        canvas.height - 32
    );


    ctx.fillStyle =
        options.color ||
        '#2f2d27';


    ctx.textAlign =
        'center';


    ctx.textBaseline =
        'middle';


    lines.forEach(
        (
            line,
            i
        ) => {

            ctx.font =
                line.font ||
                '28px "Songti SC", "STSong", serif';


            ctx.fillText(
                line.text,
                canvas.width / 2,
                line.y || (
                    72 +
                    i * 70
                )
            );
        }
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.needsUpdate =
        true;


    return new THREE.Mesh(
        new THREE.PlaneGeometry(
            width,
            height
        ),
        new THREE.MeshBasicMaterial({
            map:
                texture,

            side:
                THREE.DoubleSide
        })
    );
}

function buildTeaFence(
    parent,
    width,
    depth
) {

    const postGeo =
        new THREE.CylinderGeometry(
            0.055,
            0.07,
            0.72,
            7
        );

    const railGeo =
        new THREE.BoxGeometry(
            0.12,
            0.08,
            1.0
        );

    const xMin =
        -width / 2 - 0.72;

    const xMax =
        width / 2 + 0.72;

    const zMin =
        -depth / 2 - 0.72;

    const zMax =
        depth / 2 + 0.82;

    const post =
        (
            x,
            z,
            h = 0.36
        ) => {

            put(
                teaPart(
                    postGeo,
                    teaWoodDarkMat
                ),
                x,
                h,
                z,
                0,
                0,
                0,
                parent
            );
        };

    const rail =
        (
            x,
            z,
            len,
            horizontal
        ) => {

            const piece =
                teaPart(
                    railGeo,
                    teaWoodMat
                );

            piece.scale.z =
                len;

            piece.rotation.y =
                horizontal
                    ? Math.PI / 2
                    : 0;

            piece.position.set(
                x,
                0.42,
                z
            );

            parent.add(
                piece
            );
        };

    for (
        let x = xMin;
        x <= xMax + 0.01;
        x += 1.35
    ) {

        if (
            Math.abs(x) > 0.85
        ) {
            post(
                x,
                zMax
            );
        }

        post(
            x,
            zMin
        );
    }

    for (
        let z = zMin;
        z <= zMax + 0.01;
        z += 1.35
    ) {

        post(
            xMin,
            z
        );

        post(
            xMax,
            z
        );
    }

    rail(
        xMin / 2 - 0.58,
        zMax,
        Math.abs(xMin) - 0.98,
        true
    );

    rail(
        xMax / 2 + 0.58,
        zMax,
        Math.abs(xMax) - 0.98,
        true
    );

    rail(
        0,
        zMin,
        width + 1.42,
        true
    );

    rail(
        xMin,
        0,
        depth + 1.42,
        false
    );

    rail(
        xMax,
        0,
        depth + 1.42,
        false
    );
}

function buildTeaStonePath(
    parent
) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const stone =
            teaPart(
                new THREE.BoxGeometry(
                    0.58 + (i % 2) * 0.10,
                    0.035,
                    0.34
                ),
                teaStoneMat
            );

        stone.position.set(
            (i % 2 ? 0.11 : -0.08),
            0.055,
            3.35 + i * 0.38
        );

        stone.rotation.y =
            (i % 2 ? -1 : 1) *
            0.12;

        parent.add(
            stone
        );
    }
}

function buildTeaProcessingShed(
    x,
    y,
    z
) {

    const g =
        new THREE.Group();

    g.position.set(
        x,
        y,
        z
    );

    g.scale.setScalar(
        1.22
    );

    scene.add(
        g
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                2.35,
                0.10,
                1.70
            ),
            teaWoodMat
        ),
        0,
        0.05,
        0,
        0,
        0,
        0,
        g
    );

    for (
        const p of [
            [-1.03, -0.68],
            [1.03, -0.68],
            [-1.03, 0.68],
            [1.03, 0.68]
        ]
    ) {

        put(
            teaPart(
                new THREE.CylinderGeometry(
                    0.055,
                    0.065,
                    1.34,
                    7
                ),
                teaWoodDarkMat
            ),
            p[0],
            0.72,
            p[1],
            0,
            0,
            0,
            g
        );
    }

    const roof =
        teaPart(
            new THREE.BoxGeometry(
                2.70,
                0.12,
                1.96
            ),
            teaWoodDarkMat
        );

    roof.position.set(
        0,
        1.48,
        0
    );

    roof.rotation.z =
        -0.08;

    g.add(
        roof
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                1.02,
                0.86,
                0.06
            ),
            teaClothMat
        ),
        -0.42,
        0.87,
        0.73,
        0,
        0,
        0,
        g
    );

    const curtain =
        makeTeaTextPlane(
            [
                {
                    text:
                        '茶',
                    font:
                        'bold 64px "Songti SC", "STSong", serif',
                    y:
                        132
                },
                {
                    text:
                        '采好茶  做好茶',
                    font:
                        '20px "Songti SC", "STSong", serif',
                    y:
                        218
                }
            ],
            0.92,
            0.58,
            {
                bg:
                    '#f4eedb',
                stroke:
                    '#9f8664'
            }
        );

    curtain.position.set(
        -0.42,
        0.88,
        0.767
    );

    g.add(
        curtain
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                1.28,
                0.12,
                0.58
            ),
            teaWoodMat
        ),
        0.42,
        0.56,
        0.34,
        0,
        0,
        0,
        g
    );

    for (
        const lx of [
            -0.08,
            0.92
        ]
    ) {

        put(
            teaPart(
                new THREE.CylinderGeometry(
                    0.035,
                    0.04,
                    0.55,
                    6
                ),
                teaWoodDarkMat
            ),
            lx,
            0.30,
            0.13,
            0,
            0,
            0,
            g
        );

        put(
            teaPart(
                new THREE.CylinderGeometry(
                    0.035,
                    0.04,
                    0.55,
                    6
                ),
                teaWoodDarkMat
            ),
            lx,
            0.30,
            0.55,
            0,
            0,
            0,
            g
        );
    }

    const scissors =
        new THREE.Group();

    scissors.position.set(
        0.02,
        0.66,
        0.36
    );

    scissors.rotation.y =
        -0.35;

    g.add(
        scissors
    );

    for (
        const side of [
            -1,
            1
        ]
    ) {

        const handle =
            teaPart(
                new THREE.TorusGeometry(
                    0.075,
                    0.012,
                    6,
                    12
                ),
                teaCharcoalMat
            );

        handle.position.set(
            side * 0.075,
            0.018,
            -0.17
        );

        handle.rotation.x =
            Math.PI / 2;

        scissors.add(
            handle
        );

        const blade =
            teaPart(
                new THREE.BoxGeometry(
                    0.035,
                    0.018,
                    0.34
                ),
                teaStoneMat
            );

        blade.position.set(
            side * 0.055,
            0.018,
            0.02
        );

        blade.rotation.y =
            side * 0.32;

        scissors.add(
            blade
        );
    }

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.025,
                0.025,
                0.026,
                8
            ),
            teaWoodDarkMat
        ),
        0,
        0.02,
        -0.04,
        Math.PI / 2,
        0,
        0,
        scissors
    );

    const pan =
        teaPart(
            new THREE.CylinderGeometry(
                0.42,
                0.34,
                0.16,
                18
            ),
            teaCharcoalMat
        );

    pan.position.set(
        0.42,
        0.68,
        0.34
    );

    g.add(
        pan
    );

    const teaHeap =
        teaPart(
            new THREE.SphereGeometry(
                0.28,
                10,
                6
            ),
            teaLeafLightMat
        );

    teaHeap.scale.set(
        1,
        0.22,
        0.72
    );

    teaHeap.position.set(
        0.42,
        0.78,
        0.34
    );

    g.add(
        teaHeap
    );

    const rack =
        new THREE.Group();

    rack.position.set(
        -0.54,
        0.44,
        -0.35
    );

    g.add(
        rack
    );

    for (
        const yy of [
            0,
            0.26
        ]
    ) {
        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.78,
                    0.045,
                    0.44
                ),
                teaBasketMat
            ),
            0,
            yy,
            0,
            0,
            0,
            0,
            rack
        );

        const leaves =
            teaPart(
                new THREE.SphereGeometry(
                    0.30,
                    9,
                    5
                ),
                teaLeafMat
            );

        leaves.scale.set(
            1.15,
            0.10,
            0.58
        );

        leaves.position.y =
            yy + 0.045;

        rack.add(
            leaves
        );
    }

    const bag =
        teaPart(
            new THREE.BoxGeometry(
                0.34,
                0.58,
                0.22
            ),
            teaClothMat
        );

    bag.position.set(
        0.98,
        0.35,
        -0.38
    );

    bag.rotation.z =
        -0.04;

    g.add(
        bag
    );

    const bagLabel =
        makeTeaTextPlane(
            [
                {
                    text:
                        '茶',
                    font:
                        'bold 32px "Songti SC", "STSong", serif',
                    y:
                        112
                }
            ],
            0.24,
            0.22
        );

    bagLabel.position.set(
        0.98,
        0.39,
        -0.495
    );

    g.add(
        bagLabel
    );

    g.userData.aimLabel =
        '查看制茶小屋';

    regMagic(
        g,
        () => {
            SND.play(
                'ui'
            );

            showHintOverride(
                '制茶小屋 · 茶青会在这里晾晒、翻炒、装袋'
            );
        }
    );

    interactables.push({
        x:
            x,

        z:
            z,

        r:
            1.4,

        label:
            '查看制茶小屋',

        act:
            () => {
                SND.play(
                    'ui'
                );

                showHintOverride(
                    '采好茶，做好茶。当前茶青：<b>' +
                    teaLeafCount +
                    '</b> 份'
                );
            }
    });

    return g;
}

function buildTeaProcessingHutV2(
    x,
    y,
    z
) {

    const g =
        new THREE.Group();

    g.position.set(
        x,
        y,
        z
    );

    g.scale.setScalar(
        1.3
    );

    scene.add(
        g
    );

    const roastStationLocal = {
        x: 0.78,
        z: -0.98
    };

    const beam = (
        w,
        h,
        d,
        px,
        py,
        pz,
        rx = 0,
        ry = 0,
        rz = 0,
        mat = teaWoodDarkMat
    ) => {

        put(
            teaPart(
                new THREE.BoxGeometry(
                    w,
                    h,
                    d
                ),
                mat
            ),
            px,
            py,
            pz,
            rx,
            ry,
            rz,
            g
        );
    };

    const cylinder = (
        geo,
        mat,
        px,
        py,
        pz,
        rx = 0,
        ry = 0,
        rz = 0
    ) => {

        put(
            teaPart(
                geo,
                mat
            ),
            px,
            py,
            pz,
            rx,
            ry,
            rz,
            g
        );
    };

    const teaLogBetween = (
        parent,
        p1,
        p2,
        r,
        mat = teaWoodDarkMat
    ) => {

        const a =
            new THREE.Vector3(
                p1[0],
                p1[1],
                p1[2]
            );

        const b =
            new THREE.Vector3(
                p2[0],
                p2[1],
                p2[2]
            );

        const v =
            b.clone().sub(
                a
            );

        const leg =
            teaPart(
                new THREE.CylinderGeometry(
                    r,
                    r,
                    v.length(),
                    7
                ),
                mat
            );

        leg.position.copy(
            a.add(
                b
            ).multiplyScalar(
                0.5
            )
        );

        leg.quaternion.setFromUnitVectors(
            new THREE.Vector3(
                0,
                1,
                0
            ),
            v.normalize()
        );

        parent.add(
            leg
        );

        return leg;
    };

    const addHutLog = (
        len,
        r,
        px,
        py,
        pz,
        rx = 0,
        ry = 0,
        rz = 0,
        mat = teaWoodMat
    ) => {

        /* mat 传 null：这段木头完全不建（连黑色描边都没有），
           不是材质变透明——用于"这面墙整个看不见"的需求。 */
        if (mat === null) return;

        put(
            teaPart(
                new THREE.CylinderGeometry(
                    r,
                    r,
                    len,
                    8
                ),
                mat
            ),
            px,
            py,
            pz,
            rx,
            ry,
            rz,
            g
        );
    };

    const addHutLogWall = (
        along,
        fixed,
        halfLen,
        openings,
        mat
    ) => {

        const logR =
            0.052;

        const gap =
            0.142;

        const wallTop =
            1.55;

        for (
            let yLog = 0.34;
            yLog <= wallTop;
            yLog += gap
        ) {

            let segs = [
                [
                    -halfLen,
                    halfLen
                ]
            ];

            for (
                const op of openings
            ) {

                if (
                    yLog <= op.y0 ||
                    yLog >= op.y1
                ) {
                    continue;
                }

                const next = [];

                for (
                    const seg of segs
                ) {

                    const a =
                        seg[0];

                    const b =
                        seg[1];

                    const lo =
                        op.c -
                        op.hw;

                    const hi =
                        op.c +
                        op.hw;

                    if (
                        hi <= a ||
                        lo >= b
                    ) {
                        next.push(
                            seg
                        );
                        continue;
                    }

                    if (
                        lo > a
                    ) {
                        next.push([
                            a,
                            lo
                        ]);
                    }

                    if (
                        hi < b
                    ) {
                        next.push([
                            hi,
                            b
                        ]);
                    }
                }

                segs =
                    next;
            }

            for (
                const seg of segs
            ) {

                const a =
                    seg[0];

                const b =
                    seg[1];

                if (
                    b - a < 0.18
                ) {
                    continue;
                }

                if (
                    along ===
                    'x'
                ) {
                    addHutLog(
                        b - a,
                        logR,
                        (a + b) / 2,
                        yLog,
                        fixed,
                        0,
                        0,
                        Math.PI / 2,
                        mat
                    );
                } else {
                    addHutLog(
                        b - a,
                        logR,
                        fixed,
                        yLog,
                        (a + b) / 2,
                        Math.PI / 2,
                        0,
                        0,
                        mat
                    );
                }
            }
        }
    };

    const addHutWindow = (
        px,
        py,
        pz,
        face
    ) => {

        const frame =
            new THREE.Group();

        const frameMat =
            teaWoodDarkMat;

        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.56,
                    0.065,
                    0.08
                ),
                frameMat
            ),
            0,
            0.25,
            0,
            0,
            0,
            0,
            frame
        );

        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.56,
                    0.065,
                    0.08
                ),
                frameMat
            ),
            0,
            -0.25,
            0,
            0,
            0,
            0,
            frame
        );

        for (
            const sx of [
                -0.25,
                0.25
            ]
        ) {
            put(
                teaPart(
                    new THREE.BoxGeometry(
                        0.065,
                        0.56,
                        0.08
                    ),
                    frameMat
                ),
                sx,
                0,
                0,
                0,
                0,
                0,
                frame
            );
        }

        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.045,
                    0.48,
                    0.055
                ),
                frameMat
            ),
            0,
            0,
            0.02,
            0,
            0,
            0,
            frame
        );

        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.46,
                    0.045,
                    0.055
                ),
                frameMat
            ),
            0,
            0,
            0.02,
            0,
            0,
            0,
            frame
        );

        frame.position.set(
            px,
            py,
            pz
        );

        if (
            face ===
            'x'
        ) {
            frame.rotation.y =
                Math.PI / 2;
        }

        g.add(
            frame
        );
    };

    beam(
        3.85,
        0.16,
        3.05,
        0,
        0.08,
        0.05,
        0,
        0,
        0,
        teaStoneMat
    );

    beam(
        3.55,
        0.10,
        2.75,
        0,
        0.20,
        0.05,
        0,
        0,
        0,
        teaWoodMat
    );

    /* ======================================================
       把小屋地板登记成可站立平台
       之前地板是垫高的（石头地基+木地板，局部 y=0.20~0.25），
       但 groundAt()/collideXZ() 完全不知道这块地板的存在，
       史莱姆走进来脚下高度还是按室外地面(0)算，看起来就像
       陷进地基里——这里把地板范围和高度登记进 platformBoxes。
       ====================================================== */
    if (typeof platformBoxes !== 'undefined') {
        const floorHalfX = 1.775 * g.scale.x;
        const floorHalfZ = 1.375 * g.scale.z;
        const floorCenterZ = z + 0.05 * g.scale.z;
        platformBoxes.push({
            x1: x - floorHalfX,
            z1: floorCenterZ - floorHalfZ,
            x2: x + floorHalfX,
            z2: floorCenterZ + floorHalfZ,
            top: y + 0.25 * g.scale.y,
            bot: y
        });

        const addEntranceStepPlatform = (
            px,
            pz,
            w,
            d,
            top
        ) => {

            platformBoxes.push({
                x1:
                    x +
                    (px - w / 2) *
                    g.scale.x,

                z1:
                    z +
                    (pz - d / 2) *
                    g.scale.z,

                x2:
                    x +
                    (px + w / 2) *
                    g.scale.x,

                z2:
                    z +
                    (pz + d / 2) *
                    g.scale.z,

                top:
                    y +
                    top *
                    g.scale.y,

                bot:
                    y
            });
        };

        addEntranceStepPlatform(
            0.91,
            1.97,
            1.30,
            0.48,
            0.10
        );

        addEntranceStepPlatform(
            0.91,
            1.69,
            1.02,
            0.40,
            0.19
        );

        addEntranceStepPlatform(
            0.91,
            1.45,
            0.72,
            0.24,
            0.29
        );
    }

    for (
        const px of [
            -0.90,
            -0.45,
            0,
            0.45,
            0.90
        ]
    ) {

        beam(
            0.055,
            0.024,
            1.94,
            px,
            0.27,
            0,
            0,
            0,
            0,
            teaWoodDarkMat
        );
    }

    for (
        const p of [
            [-1.25, -0.86],
            [1.25, -0.86],
            [-1.25, 0.86],
            [1.25, 0.86]
        ]
    ) {

        const post =
            teaPart(
                new THREE.CylinderGeometry(
                    0.065,
                    0.080,
                    1.62,
                    7
                ),
                teaPostGhostMat
            );

        post.traverse(
            o => {
                if (
                    o.isLineSegments
                ) {
                    o.material =
                        teaPostGhostLineMat;
                }
            }
        );

        put(
            post,
            p[0],
            1.02,
            p[1],
            0,
            0,
            0,
            g
        );
    }

    /* ======================================================
       仓库式闭合墙体
       ====================================================== */

    addHutLogWall(
        'x',
        1.45,
        2.05,
        [
            {
                c:
                    0.91,
                hw:
                    0.46,
                y0:
                    0.20,
                y1:
                    1.36
            },
            {
                c:
                    -0.62,
                hw:
                    0.34,
                y0:
                    0.82,
                y1:
                    1.28
            }
        ]
    );

    addHutLogWall(
        'x',
        -1.35,
        2.05,
        [
            {
                c:
                    -0.72,
                hw:
                    0.34,
                y0:
                    0.82,
                y1:
                    1.28
            },
            {
                c:
                    0.72,
                hw:
                    0.34,
                y0:
                    0.82,
                y1:
                    1.28
            }
        ],
        null
    );

    addHutLogWall(
        'z',
        -1.80,
        1.35,
        [
            {
                c:
                    -0.18,
                hw:
                    0.32,
                y0:
                    0.82,
                y1:
                    1.28
            }
        ]
    );

    addHutLogWall(
        'z',
        1.80,
        1.35,
        [
            {
                c:
                    0.22,
                hw:
                    0.32,
                y0:
                    0.82,
                y1:
                    1.28
            }
        ],
        null
    );

    addHutWindow(
        -0.62,
        1.05,
        1.51,
        'z'
    );

    /* 后墙、右墙整面都不可见了，挂在这两面墙上的窗户
       也一并去掉，不然会出现"窗户浮在空气里"的情况。 */

    addHutWindow(
        -1.86,
        1.05,
        -0.18,
        'x'
    );

    /* 屋顶的檩条/桁架（原来这里有4根梁）按要求整体去掉，不建。 */

    /* 后侧这块整墙挡视线，直接不生成。 */

    for (
        const side of [
            -1,
            1
        ]
    ) {

        const roof =
            teaPart(
                new THREE.BoxGeometry(
                    4.02,
                    0.10,
                    1.70
                ),
                teaRoofMat
            );

        roof.position.set(
            0,
            1.96,
            side * 0.64
        );

        roof.rotation.x =
            side * 0.34;

        g.add(
            roof
        );

        /* 屋顶下的椽子("架子")按要求不建了。 */
    }

    /* 屋顶正脊梁、烟囱和烟囱冒出的烟按要求都不建了。 */

    /* 这块白色制茶布牌挡住室内视线，直接不生成。 */


    beam(
        1.28,
        0.12,
        0.62,
        -0.16,
        0.60,
        0.34,
        0,
        0,
        0,
        teaWoodMat
    );

    for (
        const px of [
            -0.70,
            0.38
        ]
    ) {
        for (
            const pz of [
                0.12,
                0.56
            ]
        ) {
            cylinder(
                new THREE.CylinderGeometry(
                    0.035,
                    0.040,
                    0.50,
                    6
                ),
                teaWoodDarkMat,
                px,
                0.34,
                pz
            );
        }
    }

    beam(
        0.48,
        0.08,
        0.34,
        -0.82,
        0.35,
        0.72,
        0,
        0.08,
        0,
        teaWoodMat
    );

    const roastStove =
        new THREE.Group();

    roastStove.position.set(
        roastStationLocal.x,
        0,
        roastStationLocal.z
    );

    g.add(
        roastStove
    );

    roastStove.userData.aimLabel =
        '点火 / 熄灭炒茶灶';

    const stoneCount =
        10;

    const stoneRadius =
        0.34;

    for (
        let course = 0;
        course < 3;
        course++
    ) {
        const yy =
            0.07 +
            course *
            0.105;

        const off =
            course % 2 ?
                Math.PI / stoneCount :
                0;

        for (
            let i = 0;
            i < stoneCount;
            i++
        ) {
            const a =
                i / stoneCount *
                Math.PI *
                2 +
                off;

            let frontGap =
                Math.abs(
                    a -
                    Math.PI / 2
                );

            frontGap =
                Math.min(
                    frontGap,
                    Math.PI *
                    2 -
                    frontGap
                );

            if (
                frontGap <
                0.38
            ) {
                continue;
            }

            const stone =
                teaPart(
                    new THREE.BoxGeometry(
                        0.18,
                        0.10,
                        0.13
                    ),
                    teaStoneMat
                );

            stone.position.set(
                Math.cos(
                    a
                ) *
                stoneRadius,
                yy,
                Math.sin(
                    a
                ) *
                stoneRadius
            );

            stone.rotation.y =
                -a +
                Math.PI / 2;

            roastStove.add(
                stone
            );
        }
    }

    if (
        typeof logBetween ===
        'function'
    ) {
        logBetween(
            [-0.23, 0.12, -0.07],
            [0.23, 0.12, -0.11],
            0.035,
            roastStove
        );

        logBetween(
            [-0.19, 0.12, 0.12],
            [0.22, 0.12, 0.08],
            0.035,
            roastStove
        );

        logBetween(
            [-0.21, 0.17, 0.00],
            [0.23, 0.17, -0.04],
            0.030,
            roastStove
        );
    }

    const flameMat =
        new THREE.MeshBasicMaterial({
            color:
                0xd58a3a,

            transparent:
                true,

            opacity:
                0.56,

            depthWrite:
                false,

            side:
                THREE.DoubleSide
        });

    teaRoastState.flames =
        [];

    for (
        const [i, f] of [
            [0, 0.24, 0.00, 0.16, 0.30],
            [-0.08, 0.22, 0.03, 0.10, 0.22],
            [0.09, 0.22, -0.03, 0.09, 0.20]
        ].entries()
    ) {
        const flame =
            teaPart(
                new THREE.ConeGeometry(
                    f[3],
                    f[4],
                    7
                ),
                flameMat
            );

        flame.visible =
            false;

        teaRoastState.flames.push({
            obj:
                flame,

            baseY:
                f[1],

            phase:
                i *
                1.7,

            speed:
                4.2 +
                i *
                0.9
        });

        put(
            flame,
            f[0],
            f[1],
            f[2],
            0,
            0,
            0,
            roastStove
        );
    }

    const roastGlowMat =
        new THREE.MeshBasicMaterial({
            color:
                0xd58a3a,

            transparent:
                true,

            opacity:
                0.01,

            depthWrite:
                false,

            side:
                THREE.DoubleSide
        });

    const roastGlow =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                0.46,
                24
            ),
            roastGlowMat
        );

    roastGlow.visible =
        false;

    roastGlow.rotation.x =
        -Math.PI / 2;

    roastGlow.position.set(
        0,
        0.016,
        0
    );

    roastStove.add(
        roastGlow
    );

    teaRoastState.glow =
        roastGlow;

    const flatPan =
        teaPart(
            new THREE.CylinderGeometry(
                0.36,
                0.32,
                0.070,
                24,
                1,
                true
            ),
            teaCharcoalMat
        );

    flatPan.position.set(
        0,
        0.47,
        0
    );

    roastStove.add(
        flatPan
    );

    const panRim =
        teaPart(
            new THREE.TorusGeometry(
                0.34,
                0.025,
                6,
                28
            ),
            teaCharcoalMat
        );

    panRim.rotation.x =
        Math.PI / 2;

    panRim.position.set(
        0,
        0.515,
        0
    );

    roastStove.add(
        panRim
    );

    teaRoastState.panRim =
        panRim;

    const panLeaves =
        teaPart(
            new THREE.SphereGeometry(
                0.21,
                10,
                6
            ),
            teaLeafLightMat
        );

    panLeaves.scale.set(
        1.20,
        0.09,
        0.82
    );

    panLeaves.position.set(
        0,
        0.56,
        0
    );

    roastStove.add(
        panLeaves
    );

    teaRoastState.panLeaves =
        panLeaves;

    for (
        const item of [
            [-0.88, -0.46, 0.44],
            [-0.46, -0.52, 0.39],
            [-0.66, -0.08, 0.34]
        ]
    ) {

        cylinder(
            new THREE.CylinderGeometry(
                item[2],
                item[2],
                0.055,
                18
            ),
            teaBasketMat,
            item[0],
            0.51,
            item[1]
        );

        const leaves =
            teaPart(
                new THREE.SphereGeometry(
                    item[2] * 0.68,
                    10,
                    6
                ),
                teaLeafMat
            );

        leaves.scale.set(
            1,
            0.10,
            0.72
        );

        leaves.position.set(
            item[0],
            0.57,
            item[1]
        );

        g.add(
            leaves
        );
    }

    beam(
        0.46,
        0.34,
        0.40,
        0.58,
        0.38,
        0.62,
        0,
        -0.18,
        0,
        teaWoodMat
    );

    /* 茶叶布袋太挡视线，直接不生成。 */


    const scissors =
        new THREE.Group();

    scissors.position.set(
        -0.10,
        0.68,
        0.35
    );

    scissors.rotation.y =
        -0.35;

    g.add(
        scissors
    );

    for (
        const side of [
            -1,
            1
        ]
    ) {

        const handle =
            teaPart(
                new THREE.TorusGeometry(
                    0.075,
                    0.012,
                    6,
                    12
                ),
                teaCharcoalMat
            );

        handle.position.set(
            side * 0.075,
            0.018,
            -0.17
        );

        handle.rotation.x =
            Math.PI / 2;

        scissors.add(
            handle
        );

        const blade =
            teaPart(
                new THREE.BoxGeometry(
                    0.035,
                    0.018,
                    0.34
                ),
                teaStoneMat
            );

        blade.position.set(
            side * 0.055,
            0.018,
            0.02
        );

        blade.rotation.y =
            side * 0.32;

        scissors.add(
            blade
        );
    }

    const board =
        makeTeaTextPlane(
            [
                {
                    text:
                        '手工制茶',
                    font:
                        'bold 28px "Songti SC", "STSong", serif',
                    y:
                        96
                },
                {
                    text:
                        '茶香四溢',
                    font:
                        '22px "Songti SC", "STSong", serif',
                    y:
                        166
                }
            ],
            0.56,
            0.48,
            {
                bg:
                    '#4f4030',
                stroke:
                    '#9f8664',
                color:
                    '#f4eedb'
            }
        );

    board.position.set(
        -1.96,
        0.78,
        0.70
    );

    board.rotation.y =
        0.20;

    g.add(
        board
    );

    const teaHutStool =
        new THREE.Group();

    teaHutStool.position.set(
        -0.78,
        0,
        0.92
    );

    teaHutStool.rotation.y =
        -0.18;

    g.add(
        teaHutStool
    );

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.21,
                0.18,
                0.05,
                12
            ),
            teaWoodMat
        ),
        0,
        0.45,
        0,
        0,
        0,
        0,
        teaHutStool
    );

    for (
        let i = 0;
        i < 3;
        i++
    ) {
        const a =
            i *
            (
                Math.PI *
                2 /
                3
            ) +
            0.55;

        teaLogBetween(
            teaHutStool,
            [
                Math.cos(
                    a
                ) *
                0.12,
                0.43,
                Math.sin(
                    a
                ) *
                0.12
            ],
            [
                Math.cos(
                    a
                ) *
                0.19,
                0.03,
                Math.sin(
                    a
                ) *
                0.19
            ],
            0.024,
            teaWoodDarkMat
        );
    }

    teaHutStool.userData.aimLabel =
        '茶屋小圆凳';

    if (
        typeof regMagic ===
        'function'
    ) {
        regMagic(
            teaHutStool,
            () => {
                SND.play(
                    'ui'
                );

                showHintOverride(
                    '茶屋小圆凳 · 从主屋搬来的三脚圆凳'
                );
            }
        );
    }

    if (
        typeof platformBoxes !==
        'undefined'
    ) {
        platformBoxes.push({
            x1:
                x +
                (
                    -0.78 -
                    0.23
                ) *
                g.scale.x,

            z1:
                z +
                (
                    0.92 -
                    0.23
                ) *
                g.scale.z,

            x2:
                x +
                (
                    -0.78 +
                    0.23
                ) *
                g.scale.x,

            z2:
                z +
                (
                    0.92 +
                    0.23
                ) *
                g.scale.z,

            top:
                y +
                0.475 *
                g.scale.y,

            bot:
                y
        });
    }

    const teaHutLamp =
        new THREE.Group();

    teaHutLamp.position.set(
        -0.10,
        1.54,
        0.08
    );

    g.add(
        teaHutLamp
    );

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.012,
                0.012,
                0.44,
                6
            ),
            teaCharcoalMat
        ),
        0,
        0.22,
        0,
        0,
        0,
        0,
        teaHutLamp
    );

    put(
        teaPart(
            new THREE.ConeGeometry(
                0.22,
                0.12,
                12
            ),
            teaWoodDarkMat
        ),
        0,
        0.02,
        0,
        Math.PI,
        0,
        0,
        teaHutLamp
    );

    const teaLampGlowMat =
        new THREE.MeshBasicMaterial({
            color:
                0xffd28a,

            transparent:
                true,

            opacity:
                0.32,

            depthWrite:
                false,

            side:
                THREE.DoubleSide
        });

    const teaLampCore =
        teaPart(
            new THREE.SphereGeometry(
                0.15,
                12,
                8
            ),
            teaLampGlowMat
        );

    teaLampCore.scale.set(
        1,
        1.24,
        1
    );

    teaLampCore.position.set(
        0,
        -0.10,
        0
    );

    teaHutLamp.add(
        teaLampCore
    );

    teaHutLampState.core =
        teaLampCore;

    const teaLampBeamMat =
        new THREE.MeshBasicMaterial({
            color:
                0xffd28a,

            transparent:
                true,

            opacity:
                0.075,

            depthWrite:
                false,

            side:
                THREE.DoubleSide
        });

    for (
        const beamSpec of [
            [0, 0.00],
            [0.18, 0.42],
            [-0.18, -0.36]
        ]
    ) {
        const ray =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    0.78,
                    1.42,
                    18,
                    1,
                    true
                ),
                teaLampBeamMat
            );

        ray.userData.noHit =
            true;

        ray.position.set(
            beamSpec[0],
            -0.86,
            0
        );

        ray.rotation.z =
            beamSpec[1];

        teaHutLamp.add(
            ray
        );

        teaHutLampState.beams.push(
            ray
        );
    }

    const teaLampFloorGlow =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                1.35,
                32
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0xffd28a,

                transparent:
                true,

                opacity:
                    0.075,

                depthWrite:
                    false,

                side:
                    THREE.DoubleSide
            })
        );

    teaLampFloorGlow.userData.noHit =
        true;

    teaLampFloorGlow.rotation.x =
        -Math.PI / 2;

    teaLampFloorGlow.position.set(
        0,
        -1.50,
        0
    );

    teaHutLamp.add(
        teaLampFloorGlow
    );

    teaHutLampState.floorGlow =
        teaLampFloorGlow;

    put(
        teaPart(
            new THREE.ConeGeometry(
                0.18,
                0.09,
                12
            ),
            teaWoodDarkMat
        ),
        0,
        -0.26,
        0,
        0,
        0,
        0,
        teaHutLamp
    );

    if (
        typeof THREE.PointLight ===
        'function'
    ) {
        const teaLampLight =
            new THREE.PointLight(
                0xffd89a,
                1.15,
                4.2,
                1.8
            );

        teaLampLight.position.set(
            0,
            -0.07,
            0
        );

        teaHutLamp.add(
            teaLampLight
        );

        teaHutLampState.light =
            teaLampLight;
    }

    setTeaHutLampLit(
        teaHutLampState.lit
    );

    teaHutLamp.userData.aimLabel =
        '点亮 / 熄灭茶屋吊灯';

    if (
        typeof regMagic ===
        'function'
    ) {
        regMagic(
            teaHutLamp,
            toggleTeaHutLamp
        );
    }

    /* ======================================================
       正面入口
       ====================================================== */

    beam(
        0.13,
        0.96,
        0.12,
        0.64,
        0.88,
        1.33
    );

    beam(
        0.13,
        0.96,
        0.12,
        1.18,
        0.88,
        1.33
    );

    beam(
        0.68,
        0.12,
        0.12,
        0.91,
        1.38,
        1.33
    );

    beam(
        0.72,
        0.08,
        0.24,
        0.91,
        0.29,
        1.45,
        0,
        0,
        0,
        teaStoneMat
    );

    beam(
        1.02,
        0.07,
        0.40,
        0.91,
        0.16,
        1.69,
        0,
        0,
        0,
        teaStoneMat
    );

    beam(
        1.30,
        0.055,
        0.48,
        0.91,
        0.07,
        1.97,
        0,
        0,
        0,
        teaStoneMat
    );

    const entryMat =
        new THREE.MeshBasicMaterial({
            color:
                0x1d1a16,

            transparent:
                true,

            opacity:
                0.22,

            depthWrite:
                false
        });

    const doorway =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                0.72,
                1.10
            ),
            entryMat
        );

    doorway.position.set(
        0.91,
        0.86,
        1.362
    );

    g.add(
        doorway
    );

    const warehouseDoor =
        new THREE.Group();

    warehouseDoor.position.set(
        0.55,
        0.27,
        1.425
    );

    for (
        const px of [
            0.08,
            0.24,
            0.40,
            0.56,
            0.72
        ]
    ) {

        put(
            teaPart(
                new THREE.BoxGeometry(
                    0.13,
                    1.08,
                    0.07
                ),
                teaWoodMat
            ),
            px,
            0.54,
            0,
            0,
            0,
            0,
            warehouseDoor
        );
    }

    put(
        teaPart(
            new THREE.BoxGeometry(
                0.90,
                0.08,
                0.08
            ),
            teaWoodDarkMat
        ),
        0.40,
        0.25,
        0.035,
        0,
        0,
        0,
        warehouseDoor
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                0.90,
                0.08,
                0.08
            ),
            teaWoodDarkMat
        ),
        0.40,
        0.78,
        0.035,
        0,
        0,
        0,
        warehouseDoor
    );

    put(
        teaPart(
            new THREE.TorusGeometry(
                0.055,
                0.014,
                6,
                16
            ),
            teaCharcoalMat
        ),
        0.71,
        0.62,
        0.065,
        0,
        0,
        0,
        warehouseDoor
    );

    g.add(
        warehouseDoor
    );

    warehouseDoor.userData.aimLabel =
        '打开 / 关上制茶小屋门';

    const doorState = {
        pivot:
            warehouseDoor,

        open:
            false,

        amount:
            0,

        block: {
            x1:
                x +
                TEA_HUT_COLLISION.doorCenter -
                TEA_HUT_COLLISION.doorHalf,

            z1:
                z +
                TEA_HUT_COLLISION.front -
                0.22,

            x2:
                x +
                TEA_HUT_COLLISION.doorCenter +
                TEA_HUT_COLLISION.doorHalf,

            z2:
                z +
                TEA_HUT_COLLISION.front
        }
    };

    teaHutDoors.push(
        doorState
    );

    setTeaHutDoorBlock(
        doorState,
        true
    );

    const toggleTeaHutDoor = () => {

        doorState.open =
            !doorState.open;

        setTeaHutDoorBlock(
            doorState,
            !doorState.open
        );

        if (
            typeof SND !==
            'undefined'
        ) {
            SND.play(
                'door'
            );
        }

        showHintOverride(
            doorState.open ?
                '制茶小屋的门打开了' :
                '制茶小屋的门关上了'
        );
    };

    const doorHit =
        teaPart(
            new THREE.BoxGeometry(
                0.62,
                1.05,
                0.14
            ),
            teaClothMat
        );

    doorHit.position.set(
        0.91,
        0.86,
        1.39
    );

    doorHit.traverse(
        o => {
            if (
                o.isMesh
            ) {
                o.material =
                    new THREE.MeshBasicMaterial({
                        color:
                            0xffffff,

                        transparent:
                            true,

                        opacity:
                            0.01
                    });
            }

            if (
                o.isLineSegments
            ) {
                o.visible =
                    false;
            }
        }
    );

    doorHit.userData.aimLabel =
        '打开 / 关上制茶小屋门';

    g.add(
        doorHit
    );

    if (
        typeof regMagic ===
        'function'
    ) {
        regMagic(
            warehouseDoor,
            toggleTeaHutDoor
        );

        regMagic(
            doorHit,
            toggleTeaHutDoor
        );
    }

    interactables.push({
        x:
            x +
            0.91 *
            g.scale.x,

        z:
            z +
            1.45 *
            g.scale.z,

        r:
            0.9,

        label:
            '打开 / 关上制茶小屋门',

        act:
            toggleTeaHutDoor
    });

    makeTeaWorldInteract(
        g,
        {
            x:
                -0.68,

            y:
                0.76,

            z:
                -0.30,

            w:
                1.36,

            h:
                0.72,

            d:
                0.92,

            r:
                1.34,

            label:
                '晒茶青（消耗生茶青 ×' + TEA_PROCESS_BATCH + '）',

            act:
                sieveTeaLeaves
        },
        x,
        z,
        g.scale.x
    );

    makeTeaWorldInteract(
        g,
        {
            x:
                -0.12,

            y:
                1.10,

            z:
                0.08,

            w:
                0.72,

            h:
                1.10,

            d:
                0.72,

            r:
                0.62,

            label:
                '点亮 / 熄灭茶屋吊灯',

            act:
                toggleTeaHutLamp
        },
        x,
        z,
        g.scale.x
    );

    makeTeaWorldInteract(
        g,
        {
            x:
                roastStationLocal.x -
                0.42,

            y:
                0.42,

            z:
                roastStationLocal.z +
                0.20,

            w:
                0.44,

            h:
                0.58,

            d:
                0.54,

            r:
                0.56,

            label:
                '点火 / 熄灭炒茶灶',

            act:
                toggleTeaRoastFire
        },
        x,
        z,
        g.scale.x
    );

    makeTeaWorldInteract(
        g,
        {
            x:
                roastStationLocal.x +
                0.12,

            y:
                0.72,

            z:
                roastStationLocal.z,

            w:
                0.82,

            h:
                0.42,

            d:
                0.82,

            r:
                0.86,

            label:
                '炒茶叶（消耗晒干茶青 ×' + TEA_PROCESS_BATCH + '）',

            act:
                roastTeaLeaves
        },
        x,
        z,
        g.scale.x
    );

    makeTeaWorldInteract(
        g,
        {
            x:
                -0.14,

            y:
                0.76,

            z:
                0.72,

            w:
                1.30,

            h:
                0.66,

            d:
                0.54,

            r:
                0.82,

            label:
                '打包卖茶（消耗炒制茶叶 ×' + TEA_PROCESS_BATCH + '）',

            act:
                packageTeaLeaves
        },
        x,
        z,
        g.scale.x
    );

    /* ======================================================
       室内家具碰撞：晒茶筛 / 炒茶灶 / 工作台
       之前只有外墙和门有碰撞盒，家具本身没有，
       史莱姆会直接穿模走进木头里——这里给三件大家具补上。
       ====================================================== */
    if (typeof solidBoxes !== 'undefined') {
        const addFurnitureBlock = (
            lx,
            lz,
            hx,
            hz
        ) => {
            const fx =
                x +
                lx *
                g.scale.x;

            const fz =
                z +
                lz *
                g.scale.z;

            addTeaSolidBoxOnce({
                x1:
                    fx -
                    hx *
                    g.scale.x,

                z1:
                    fz -
                    hz *
                    g.scale.z,

                x2:
                    fx +
                    hx *
                    g.scale.x,

                z2:
                    fz +
                    hz *
                    g.scale.z
            });
        };

        addFurnitureBlock(
            -0.70,
            -0.34,
            0.72,
            0.67
        );

        addFurnitureBlock(
            roastStationLocal.x,
            roastStationLocal.z,
            0.33,
            0.33
        );

        addFurnitureBlock(
            -0.16,
            0.34,
            0.74,
            0.40
        );

    }

    return g;
}

function buildTeaBench(
    parent,
    x,
    z
) {

    put(
        teaPart(
            new THREE.BoxGeometry(
                1.12,
                0.12,
                0.32
            ),
            teaWoodMat
        ),
        x,
        0.36,
        z,
        0,
        0.08,
        0,
        parent
    );

    for (
        const lx of [
            -0.42,
            0.42
        ]
    ) {
        put(
            teaPart(
                new THREE.CylinderGeometry(
                    0.035,
                    0.04,
                    0.34,
                    6
                ),
                teaWoodDarkMat
            ),
            x + lx,
            0.18,
            z - 0.10,
            0,
            0,
            0,
            parent
        );
    }
}

function buildTeaLantern(
    parent,
    x,
    z
) {

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.055,
                0.070,
                1.20,
                7
            ),
            teaStoneMat
        ),
        x,
        0.60,
        z,
        0,
        0,
        0,
        parent
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                0.42,
                0.10,
                0.42
            ),
            teaStoneMat
        ),
        x,
        1.18,
        z,
        0,
        Math.PI / 4,
        0,
        parent
    );

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.18,
                0.22,
                0.22,
                8
            ),
            teaClothMat
        ),
        x,
        1.36,
        z,
        0,
        0,
        0,
        parent
    );

    put(
        teaPart(
            new THREE.ConeGeometry(
                0.28,
                0.16,
                8
            ),
            teaStoneMat
        ),
        x,
        1.58,
        z,
        0,
        Math.PI / 4,
        0,
        parent
    );
}

function buildTeaDirectionPost(
    parent,
    x,
    z
) {

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.045,
                0.055,
                1.05,
                6
            ),
            teaWoodDarkMat
        ),
        x,
        0.52,
        z,
        0,
        0,
        0,
        parent
    );

    [
        ['茶田', 0.88, -0.14],
        ['加工坊', 0.68, 0.10],
        ['休息区', 0.48, -0.06]
    ].forEach(
        (
            item,
            i
        ) => {

            const plank =
                teaPart(
                    new THREE.BoxGeometry(
                        0.74,
                        0.18,
                        0.055
                    ),
                    teaWoodMat
                );

            plank.position.set(
                x + item[2],
                item[1],
                z
            );

            plank.rotation.y =
                i % 2 === 0
                    ? -0.28
                    : 0.24;

            parent.add(
                plank
            );

            const label =
                makeTeaTextPlane(
                    [
                        {
                            text:
                                item[0],
                            font:
                                'bold 22px "Songti SC", "STSong", serif',
                            y:
                                150
                        }
                    ],
                    0.54,
                    0.13,
                    {
                        bg:
                            '#d2ae78',
                        stroke:
                            '#75583f'
                    }
                );

            label.position.set(
                x + item[2],
                item[1],
                z + 0.035
            );

            label.rotation.y =
                plank.rotation.y;

            parent.add(
                label
            );
        }
    );
}

function makeTeaHireLabel(
    text
) {

    const canvas =
        document.createElement(
            'canvas'
        );


    canvas.width =
        256;


    canvas.height =
        128;


    const ctx =
        canvas.getContext(
            '2d'
        );


    ctx.fillStyle =
        '#f4efd9';


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        '#718665';


    ctx.lineWidth =
        8;


    ctx.strokeRect(
        10,
        10,
        236,
        108
    );


    ctx.fillStyle =
        '#3f5638';


    ctx.font =
        'bold 28px "Songti SC", "STSong", serif';


    ctx.textAlign =
        'center';


    ctx.textBaseline =
        'middle';


    ctx.fillText(
        text,
        128,
        47
    );


    ctx.font =
        '18px "Songti SC", "STSong", serif';


    ctx.fillText(
        '日薪 ' +
        TEA_WORKER_DAILY_WAGE +
        ' 金币',
        128,
        84
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    return new THREE.Mesh(
        new THREE.PlaneGeometry(
            0.88,
            0.44
        ),
        new THREE.MeshBasicMaterial({
            map:
                texture,

            side:
                THREE.DoubleSide
        })
    );
}

function currentTeaDay() {

    if (
        typeof gameSec !==
        'number'
    ) {

        return 0;
    }


    return Math.floor(
        gameSec /
        (
            24 *
            3600
        )
    );
}

function teaHireLabel() {

    if (
        teaHireState.striking
    ) {

        return '茶工罢工中 · 补发工资';
    }


    return teaHireState.hired
        ? '茶工采摘中'
        : '雇佣茶工';
}

function updateTeaHireLabel() {

    if (
        teaHireState.labelEntry
    ) {

        teaHireState.labelEntry.label =
            teaHireLabel();
    }


    if (
        teaHireState.worker
    ) {

        teaHireState.worker.userData.aimLabel =
            teaHireLabel();
    }
}

function saveTeaHireStateNow() {

    if (
        typeof saveGameState ===
        'function'
    ) {

        saveGameState(
            false
        );
    }
}


/* ==========================================================
   4. 构建茶场地面
   ========================================================== */

function buildTeaFieldBase() {

    const g =
        new THREE.Group();


    g.position.set(
        TEA_FARM_CENTER.x,
        0,
        TEA_FARM_CENTER.z
    );


    scene.add(
        g
    );


    /* ------------------------------------------------------
       茶场整体地面
       ------------------------------------------------------ */

    put(
        teaPart(
            new THREE.BoxGeometry(
                8.2,
                0.035,
                6.8
            ),
            teaGroundMat
        ),

        0,
        0.018,
        0,

        0,
        0,
        0,

        g
    );


    /* ======================================================
       平面茶园
       每一行茶树都在同一高度，地面像参考图一样由
       茶树行、土路和石板路平铺拼接。
       ====================================================== */

    const terraceWidth =
        (TEA_COLS - 1) * TEA_COL_GAP + 1.05;

    for (
        let row = 0;
        row < TEA_ROWS;
        row++
    ) {

        const z =
            (
                row -
                (
                    TEA_ROWS - 1
                ) / 2
            ) *
            TEA_ROW_GAP;

        /*
           平面地块：每行都是同一高度的长方形茶田。
        */

        put(
            teaPart(
                new THREE.BoxGeometry(
                    terraceWidth,
                    0.10,
                    TEA_GARDEN_ROW_DEPTH
                ),
                teaSoilMat
            ),

            0,
            0.05,
            z,

            0,
            0,
            0,

            g
        );


        /*
           土垄上的两条细线。

           主要作用不是物理结构，
           而是强化原项目的线稿感。
        */

        for (
            const dz of [
                -0.24,
                0.24
            ]
        ) {

            const geo =
                new THREE.BufferGeometry()
                    .setFromPoints([
                        new THREE.Vector3(
                            -terraceWidth / 2 + 0.15,
                            0.105,
                            z + dz
                        ),

                        new THREE.Vector3(
                            terraceWidth / 2 - 0.15,
                            0.105,
                            z + dz
                        )
                    ]);


            const line =
                new THREE.Line(
                    geo,
                    MAT
                );


            g.add(
                line
            );
        }

        if (
            row < TEA_ROWS - 1
        ) {

            const pathZ =
                z +
                TEA_ROW_GAP /
                2;

            put(
                teaPart(
                    new THREE.BoxGeometry(
                        terraceWidth + 0.36,
                        0.026,
                        0.32
                    ),
                    teaStoneMat
                ),
                0,
                0.055,
                pathZ,
                0,
                0,
                0,
                g
            );
        }

    }

    buildTeaFence(
        g,
        terraceWidth,
        TEA_ROWS * TEA_ROW_GAP + 0.85
    );


    buildTeaStonePath(
        g
    );


    buildTeaBench(
        g,
        -2.70,
        3.02
    );


    buildTeaLantern(
        g,
        -3.55,
        3.62
    );


    buildTeaDirectionPost(
        g,
        3.05,
        3.28
    );


    /* ======================================================
       茶场入口牌
       ====================================================== */

    buildTeaSign(
        TEA_FARM_CENTER.x - 2.70,
        0,
        TEA_FARM_CENTER.z + 4.35
    );


    /* ======================================================
       茶篓
       ====================================================== */

    buildTeaBasket(
        TEA_FARM_CENTER.x + 3.45,
        0,
        TEA_FARM_CENTER.z + 3.30
    );

    buildTeaProcessingHutV2(
        TEA_FARM_CENTER.x + TEA_HUT_OFFSET.x,
        0,
        TEA_FARM_CENTER.z + TEA_HUT_OFFSET.z
    );


    return g;
}


/* ==========================================================
   5. 茶场入口牌
   ========================================================== */

function buildTeaSign(
    x,
    y,
    z
) {

    const g =
        new THREE.Group();


    g.position.set(
        x,
        y,
        z
    );


    scene.add(
        g
    );


    /* ------------------------------------------------------
       左木柱
       ------------------------------------------------------ */

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.045,
                0.055,
                1.25,
                7
            ),
            teaWoodDarkMat
        ),

        -0.58,
        0.62,
        0,

        0,
        0,
        0,

        g
    );


    /* ------------------------------------------------------
       右木柱
       ------------------------------------------------------ */

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.045,
                0.055,
                1.25,
                7
            ),
            teaWoodDarkMat
        ),

        0.58,
        0.62,
        0,

        0,
        0,
        0,

        g
    );


    /* ------------------------------------------------------
       牌面
       ------------------------------------------------------ */

    put(
        teaPart(
            new THREE.BoxGeometry(
                1.95,
                0.86,
                0.10
            ),
            teaWoodMat
        ),

        0,
        1.08,
        0,

        0,
        0,
        0,

        g
    );

    const label =
        makeTeaTextPlane(
            [
                {
                    text:
                        '茶场',
                    font:
                        'bold 62px "Songti SC", "STSong", serif',
                    y:
                        92
                },
                {
                    text:
                        '一片叶子，',
                    font:
                        '24px "Songti SC", "STSong", serif',
                    y:
                        174
                },
                {
                    text:
                        '也是一个更好的明天。',
                    font:
                        '24px "Songti SC", "STSong", serif',
                    y:
                        220
                }
            ],
            1.80,
            0.72,
            {
                bg:
                    '#f4ecd7',
                stroke:
                    '#6f5b42'
            }
        );

    label.position.set(
        0,
        1.08,
        0.057
    );

    g.add(
        label
    );


    /* ======================================================
       茶叶图案

       不使用外部图片。
       直接使用两个低模叶片。
       ====================================================== */

    const icon =
        new THREE.Group();


    for (
        const sx of [
            -1,
            1
        ]
    ) {

        const leaf =
            teaPart(
                new THREE.SphereGeometry(
                    0.11,
                    8,
                    6
                ),
                teaLeafMat
            );


        leaf.scale.set(
            1.35,
            0.55,
            0.25
        );


        leaf.position.set(
            sx * 0.10,
            0,
            0.065
        );


        leaf.rotation.z =
            sx * 0.55;


        icon.add(
            leaf
        );
    }


    icon.position.set(
        0.64,
        0.84,
        0.085
    );


    g.add(
        icon
    );


    /* ======================================================
       第一人称交互
       ====================================================== */

    g.userData.aimLabel =
        '查看茶场';


    regMagic(
        g,
        () => {

            SND.play(
                'ui'
            );


            showHintOverride(
                '茶场 · 嫩芽发亮时即可采摘'
            );
        }
    );


    /* ======================================================
       第三人称 / 靠近交互
       ====================================================== */

    interactables.push({

        x:
            x,

        z:
            z,

        r:
            1.5,

        label:
            '查看茶场',

        act:
            () => {

                SND.play(
                    'ui'
                );


                showHintOverride(
                    '茶场 · 靠近成熟茶树按 <b>E</b> 采摘嫩芽'
                );
            }
    });


    return g;
}


/* ==========================================================
   6. 茶篓
   ========================================================== */

function buildTeaBasket(
    x,
    y,
    z
) {

    const g =
        new THREE.Group();


    g.position.set(
        x,
        y,
        z
    );


    scene.add(
        g
    );


    /* ======================================================
       篓身
       ====================================================== */

    const basket =
        teaPart(
            new THREE.CylinderGeometry(
                0.34,
                0.27,
                0.46,
                10,
                1,
                true
            ),
            teaBasketMat
        );


    basket.position.y =
        0.25;


    g.add(
        basket
    );


    /* ======================================================
       篓底
       ====================================================== */

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.27,
                0.27,
                0.035,
                10
            ),
            teaBasketMat
        ),

        0,
        0.035,
        0,

        0,
        0,
        0,

        g
    );


    /* ======================================================
       提手
       ====================================================== */

    const handle =
        teaPart(
            new THREE.TorusGeometry(
                0.29,
                0.025,
                6,
                18,
                Math.PI
            ),
            teaWoodDarkMat
        );


    handle.position.y =
        0.49;


    handle.rotation.x =
        Math.PI / 2;


    g.add(
        handle
    );


    /* ======================================================
       编织横线
       ====================================================== */

    for (
        const yy of [
            0.12,
            0.23,
            0.34
        ]
    ) {

        const ringGeo =
            new THREE.CylinderGeometry(
                0.31,
                0.29,
                0.018,
                10
            );


        const ring =
            new THREE.LineSegments(
                new THREE.EdgesGeometry(
                    ringGeo
                ),
                MAT
            );


        ring.position.y =
            yy;


        g.add(
            ring
        );
    }


    /* ======================================================
       茶篓交互
       ====================================================== */

    g.userData.aimLabel =
        '查看茶篓';


    regMagic(
        g,
        () => {

            SND.play(
                'ui'
            );


            showHintOverride(
                '茶篓里已有茶青 <b>' +
                teaLeafCount +
                '</b> 份'
            );
        }
    );


    interactables.push({

        x:
            x,

        z:
            z,

        r:
            1.2,

        label:
            '查看茶篓',

        act:
            () => {

                SND.play(
                    'ui'
                );


                showHintOverride(
                    '当前茶青：<b>' +
                    teaLeafCount +
                    '</b> 份'
                );
            }
    });


    return g;
}


/* ==========================================================
   7. 创建单片茶叶
   ========================================================== */

function buildTeaLeaf(
    scale = 1,
    light = false
) {

    const g =
        new THREE.Group();


    /* ======================================================
       叶片主体

       用扁平尖叶替代原来的压扁球体，
       让正面、侧面厚度和叶脉更清楚。
       ====================================================== */

    const shape =
        new THREE.Shape();

    shape.moveTo(
        0,
        0.18 * scale
    );

    shape.bezierCurveTo(
        0.13 * scale,
        0.12 * scale,
        0.18 * scale,
        -0.08 * scale,
        0,
        -0.20 * scale
    );

    shape.bezierCurveTo(
        -0.18 * scale,
        -0.08 * scale,
        -0.13 * scale,
        0.12 * scale,
        0,
        0.18 * scale
    );

    const leaf =
        teaPart(
            new THREE.ExtrudeGeometry(
                shape,
                {
                    depth:
                        0.018 * scale,

                    bevelEnabled:
                        false
                }
            ),

            light
                ? teaLeafLightMat
                : teaLeafMat
        );


    leaf.rotation.x =
        Math.PI / 2;


    g.add(
        leaf
    );


    /* ======================================================
       中央叶脉
       ====================================================== */

    const veinGeo =
        new THREE.BufferGeometry()
            .setFromPoints([

                new THREE.Vector3(
                    0,
                    0.014,
                    -0.16 * scale
                ),

                new THREE.Vector3(
                    0,
                    0.014,
                    0.15 * scale
                )
            ]);


    const vein =
        new THREE.Line(
            veinGeo,
            MAT
        );


    g.add(
        vein
    );

    for (
        const side of [
            -1,
            1
        ]
    ) {

        g.add(
            new THREE.Line(
                new THREE.BufferGeometry()
                    .setFromPoints([
                        new THREE.Vector3(
                            0,
                            0.015,
                            -0.02 * scale
                        ),
                        new THREE.Vector3(
                            side * 0.075 * scale,
                            0.015,
                            0.07 * scale
                        )
                    ]),
                MAT
            )
        );
    }

    return g;
}

function buildTeaBranch(
    from,
    to,
    radius,
    mat = teaWoodDarkMat
) {

    const dir =
        new THREE.Vector3()
            .subVectors(
                to,
                from
            );

    const len =
        dir.length();

    const branch =
        teaPart(
            new THREE.CylinderGeometry(
                radius * 0.72,
                radius,
                len,
                6
            ),
            mat
        );

    branch.position.copy(
        from
    ).add(
        to
    ).multiplyScalar(
        0.5
    );

    branch.quaternion.setFromUnitVectors(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        dir.normalize()
    );

    return branch;
}

function buildTeaGrassClump(
    parent,
    x,
    z,
    seed
) {

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const blade =
            teaPart(
                new THREE.ConeGeometry(
                    0.022,
                    0.14 + (i % 2) * 0.04,
                    4
                ),
                teaTuftMat
            );

        blade.position.set(
            x + Math.cos(seed + i) * 0.09,
            0.065,
            z + Math.sin(seed * 1.7 + i) * 0.07
        );

        blade.rotation.z =
            -0.22 + i * 0.11;

        parent.add(
            blade
        );
    }
}


/* ==========================================================
   8. 创建一株茶树
   ========================================================== */

function buildTeaPlant(
    x,
    z,
    index,
    baseY
) {

    const root =
        new THREE.Group();


    root.position.set(
        x,
        (baseY || 0) + 0.11,
        z
    );


    scene.add(
        root
    );

    /* ======================================================
       修剪过的茶篷底形

       每个可采摘点仍然是一株茶树，但视觉上压成
       横向矮茶垄，连在一起时会像参考图里的成排茶树。
       ====================================================== */

    const hedgeBase =
        teaPart(
            new THREE.SphereGeometry(
                0.42,
                10,
                6
            ),
            index % 2 === 0
                ? teaLeafMat
                : teaLeafLightMat
        );

    hedgeBase.scale.set(
        1.35,
        0.36,
        0.78
    );

    hedgeBase.position.y =
        0.30;

    root.add(
        hedgeBase
    );

    const canopyLobes = [
        [-0.32, 0.52, -0.10, 0.34, 0.18, 0.26],
        [0.00, 0.58, -0.15, 0.42, 0.20, 0.30],
        [0.32, 0.52, -0.08, 0.34, 0.18, 0.26],
        [-0.22, 0.49, 0.18, 0.34, 0.17, 0.24],
        [0.20, 0.50, 0.17, 0.36, 0.17, 0.25],
        [0.00, 0.64, 0.05, 0.30, 0.16, 0.22]
    ];

    canopyLobes.forEach(
        (
            p,
            i
        ) => {

            const lobe =
                teaPart(
                    new THREE.IcosahedronGeometry(
                        0.23,
                        1
                    ),
                    i % 2 === 0
                        ? teaLeafMat
                        : teaLeafLightMat
                );

            lobe.scale.set(
                p[3],
                p[4],
                p[5]
            );

            lobe.position.set(
                p[0],
                p[1],
                p[2]
            );

            lobe.rotation.set(
                0.14 * i,
                index * 0.17 + i * 0.44,
                -0.08 * i
            );

            root.add(
                lobe
            );
        }
    );


    /* ======================================================
       主枝
       ====================================================== */

    const stem =
        teaPart(
            new THREE.CylinderGeometry(
                0.035,
                0.055,
                0.55,
                7
            ),
            teaWoodDarkMat
        );


    stem.position.y =
        0.29;


    root.add(
        stem
    );

    const branchTargets = [
        [-0.35, 0.52, 0.00],
        [-0.18, 0.62, -0.22],
        [0.18, 0.61, -0.22],
        [0.36, 0.52, 0.03],
        [-0.22, 0.48, 0.22],
        [0.23, 0.49, 0.20]
    ];

    branchTargets.forEach(
        (
            p,
            i
        ) => {

            const from =
                new THREE.Vector3(
                    0,
                    0.16 + (i % 2) * 0.06,
                    0
                );

            const to =
                new THREE.Vector3(
                    p[0],
                    p[1],
                    p[2]
                );

            root.add(
                buildTeaBranch(
                    from,
                    to,
                    0.026 - Math.min(i, 4) * 0.002
                )
            );
        }
    );

    buildTeaGrassClump(
        root,
        -0.28,
        0.22,
        index * 1.3
    );

    buildTeaGrassClump(
        root,
        0.31,
        -0.16,
        index * 1.7 + 2
    );


    /* ======================================================
       老叶树冠
       ====================================================== */

    const crown =
        new THREE.Group();


    root.add(
        crown
    );


    /*
       不使用一个大绿色球。

       用多个叶片组合成茶树冠，
       这样仍然能够看出“茶叶”结构。
    */

    const clusters = [

        [
            -0.28,
            0.48,
            0.02,
            0.15
        ],

        [
            0.00,
            0.56,
            -0.08,
            -0.10
        ],

        [
            0.28,
            0.49,
            0.04,
            -0.18
        ],

        [
            -0.16,
            0.66,
            -0.05,
            0.45
        ],

        [
            0.17,
            0.67,
            0.02,
            -0.40
        ],

        [
            -0.02,
            0.43,
            0.19,
            0.05
        ],

        [
            0.04,
            0.47,
            -0.21,
            -0.08
        ],

        /*
           下面这一圈是新加的"裙摆"簇，
           把裸露的主枝根部挡住，
           让整株看起来是一丛被修剪过的
           圆润茶蓬，而不是插着叶子的细杆。
        */

        [
            -0.22,
            0.24,
            0.14,
            0.32
        ],

        [
            0.23,
            0.22,
            -0.12,
            -0.28
        ],

        [
            0.00,
            0.20,
            0.22,
            0.62
        ],

        [
            -0.14,
            0.30,
            -0.18,
            -0.55
        ],

        [
            0.16,
            0.33,
            0.15,
            0.22
        ],

        [
            -0.05,
            0.60,
            0.13,
            0.75
        ],

        [
            0.09,
            0.61,
            -0.15,
            -0.65
        ],

        [
            -0.38,
            0.40,
            -0.08,
            0.95
        ],

        [
            0.38,
            0.39,
            -0.04,
            -0.92
        ],

        [
            -0.34,
            0.52,
            0.18,
            1.15
        ],

        [
            0.34,
            0.53,
            0.16,
            -1.10
        ],

        [
            -0.12,
            0.73,
            0.06,
            0.28
        ],

        [
            0.13,
            0.72,
            -0.06,
            -0.26
        ],

        [
            -0.30,
            0.61,
            -0.18,
            0.72
        ],

        [
            0.29,
            0.62,
            -0.17,
            -0.70
        ],

        [
            0.00,
            0.50,
            0.28,
            0.02
        ],

        [
            0.00,
            0.54,
            -0.30,
            -0.04
        ]
    ];


    clusters.forEach(
        (
            p,
            i
        ) => {

            const leaf =
                buildTeaLeaf(
                    0.90 +
                    (
                        i % 3
                    ) *
                    0.08,

                    i % 3 === 0
                );


            leaf.position.set(
                p[0],
                p[1],
                p[2]
            );


            leaf.rotation.y =
                p[3];


            leaf.rotation.z =
                (
                    i % 2
                        ? 1
                        : -1
                ) *
                (
                    0.12 +
                    (i % 4) *
                    0.035
                );


            leaf.rotation.x +=
                (
                    i % 3 -
                    1
                ) *
                0.10;


            crown.add(
                leaf
            );
        }
    );


    /* ======================================================
       嫩芽
       ====================================================== */

    const buds =
        new THREE.Group();


    root.add(
        buds
    );


    const budPos = [

        [
            -0.18,
            0.78,
            0.02
        ],

        [
            0.00,
            0.83,
            -0.04
        ],

        [
            0.19,
            0.76,
            0.05
        ]
    ];


    budPos.forEach(
        (
            p,
            i
        ) => {

            const bud =
                new THREE.Group();


            /* ----------------------------------------------
               嫩芽小茎
               ---------------------------------------------- */

            const stalk =
                teaPart(
                    new THREE.CylinderGeometry(
                        0.012,
                        0.016,
                        0.16,
                        6
                    ),
                    teaLeafMat
                );


            stalk.position.y =
                0.07;


            bud.add(
                stalk
            );


            /* ----------------------------------------------
               左嫩叶
               ---------------------------------------------- */

            const l1 =
                buildTeaLeaf(
                    0.48,
                    true
                );


            l1.position.set(
                -0.055,
                0.13,
                0
            );


            l1.rotation.z =
                0.58;


            bud.add(
                l1
            );


            /* ----------------------------------------------
               右嫩叶
               ---------------------------------------------- */

            const l2 =
                buildTeaLeaf(
                    0.48,
                    true
                );


            l2.position.set(
                0.055,
                0.14,
                0
            );


            l2.rotation.z =
                -0.58;


            bud.add(
                l2
            );


            bud.position.set(
                p[0],
                p[1],
                p[2]
            );


            bud.rotation.y =
                i * 1.7;


            buds.add(
                bud
            );
        }
    );


    /* ======================================================
       茶树状态
       ====================================================== */

    const state = {

        index:
            index,

        root:
            root,

        crown:
            crown,

        buds:
            buds,

        x:
            x,

        z:
            z,

        ready:
            true,

        pickedAt:
            0,

        regrowSeconds:
            TEA_REGROW_SECONDS,

        phase:
            Math.random() *
            Math.PI *
            2,

        interactEntry:
            null
    };


    root.userData.teaPlant =
        state;


    root.userData.aimLabel =
        '采摘嫩茶叶';


    /* ======================================================
       第一人称交互
       ====================================================== */

    regMagic(
        root,
        () => {

            pickTeaPlant(
                state
            );
        }
    );


    /* ======================================================
       第三人称 E 交互
       ====================================================== */

    const entry = {

        x:
            x,

        z:
            z,

        r:
            TEA_PICK_DISTANCE,

        label:
            '采摘嫩茶叶',

        act:
            () => {

                pickTeaPlant(
                    state
                );
            }
    };


    state.interactEntry =
        entry;


    interactables.push(
        entry
    );


    teaPlants.push(
        state
    );


    return state;
}


/* ==========================================================
   9. 采摘茶树
   ========================================================== */

function pickTeaPlant(
    state,
    silent
) {

    if (
        typeof window.isMainStoryFeatureUnlocked === 'function' &&
        !window.isMainStoryFeatureUnlocked('tea')
    ) {
        if (!silent && typeof window.requestMainStoryAccess === 'function') {
            window.requestMainStoryAccess('tea', () => pickTeaPlant(state, silent));
        }
        return;
    }

    /* ======================================================
       尚未重新成熟
       ====================================================== */

    if (
        !state.ready
    ) {

        if (
            !silent
        ) {

            SND.play(
                'toggle'
            );
        }


        const now =
            performance.now() *
            0.001;


        const remain =
            Math.max(
                1,

                Math.ceil(
                    state.regrowSeconds -
                    (
                        now -
                        state.pickedAt
                    )
                )
            );


        if (
            !silent
        ) {

            showHintOverride(
                '这株茶树刚采过，还要等待约 <b>' +
                remain +
                ' 秒</b>'
            );
        }


        return false;
    }


    /* ======================================================
       进入采摘后状态
       ====================================================== */

    state.ready =
        false;


    state.pickedAt =
        performance.now() *
        0.001;


    /* ======================================================
       嫩芽消失

       注意：
       老叶仍然保留。

       所以不会出现：
       “按 E → 整棵茶树消失”
       ====================================================== */

    state.buds.visible =
        false;


    /* ======================================================
       树冠稍微缩小

       用于表现刚刚被采摘过。
       ====================================================== */

    state.crown.scale.set(
        0.94,
        0.92,
        0.94
    );


    /* ======================================================
       更新交互提示
       ====================================================== */

    state.root.userData.aimLabel =
        '等待嫩芽重新长出';


    if (
        state.interactEntry
    ) {

        state.interactEntry.label =
            '等待嫩芽重新长出';
    }


    /* ======================================================
       获得茶青
       ====================================================== */

    teaLeafCount +=
        1;

    teaProcessState.raw += 1;

    const teaWeatherMult = typeof weatherYieldMultiplier === 'function'
        ? weatherYieldMultiplier(TEA_WEATHER_GOOD, TEA_WEATHER_BAD)
        : 1;
    const teaPickCoins = Math.max(1, Math.round(TEA_PICK_COINS * teaWeatherMult));

    if (
        window.addCabinCoins
    ) {

        window.addCabinCoins(
            teaPickCoins,
            false
        );
    }


    /* ======================================================
       音效
       ====================================================== */

    if (
        !silent
    ) {

        SND.play(
            'chim'
        );
    }


    /* ======================================================
       UI 提示
       ====================================================== */

    if (
        !silent
    ) {

        showHintOverride(
            '采到一份嫩茶青 · 茶篓 <b>' +
            teaLeafCount +
            '</b> · 金币 +' +
            '<b>' +
            teaPickCoins +
            '</b>' +
            (teaWeatherMult > 1 ? '（天气加成）' : teaWeatherMult < 1 ? '（天气减产）' : '')
        );
    }


    /* ======================================================
       生成采摘动画
       ====================================================== */

    if (
        !silent
    ) {

        spawnPickedTeaLeaves(
            state
        );
    }


    return true;
}


/* ==========================================================
   10. 采摘视觉反馈

   三片嫩叶从茶树飞向玩家。
   ========================================================== */

function spawnPickedTeaLeaves(
    state
) {

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const leaf =
            buildTeaLeaf(
                0.42,
                true
            );


        leaf.position.set(

            state.x +
            (
                i - 1
            ) *
            0.06,

            0.85 +
            i *
            0.025,

            state.z
        );


        scene.add(
            leaf
        );


        teaPickParticles.push({

            mesh:
                leaf,

            age:
                0,

            life:
                0.65 +
                i *
                0.08,

            phase:
                i *
                2.1
        });
    }
}


/* ==========================================================
   11. 茶场更新
   ========================================================== */

function updateTeaFarm(
    dt,
    time
) {

    updateTeaRoastStation(
        dt,
        time
    );

    /* ======================================================
       更新所有茶树
       ====================================================== */

    for (
        const state
        of teaPlants
    ) {

        /* --------------------------------------------------
           风吹树冠
           -------------------------------------------------- */

        state.crown.rotation.z =
            Math.sin(
                time *
                1.35 +
                state.phase
            ) *
            0.018;


        state.crown.rotation.x =
            Math.sin(
                time *
                1.05 +
                state.phase *
                0.7
            ) *
            0.010;


        /* ==================================================
           已成熟
           ================================================== */

        if (
            state.ready
        ) {

            state.buds.rotation.y =
                Math.sin(
                    time *
                    1.2 +
                    state.phase
                ) *
                0.035;


            /*
               成熟嫩芽轻微呼吸。

               不是强烈发光，
               避免破坏原项目线稿风格。
            */

            const pulse =
                1 +
                Math.sin(
                    time *
                    2.1 +
                    state.phase
                ) *
                0.025;


            state.buds.scale.setScalar(
                pulse
            );
        }


        /* ==================================================
           采摘后等待再生
           ================================================== */

        else {

            const elapsed =
                time -
                state.pickedAt;


            if (
                elapsed >=
                state.regrowSeconds
            ) {

                /* ------------------------------------------
                   重新成熟
                   ------------------------------------------ */

                state.ready =
                    true;


                state.buds.visible =
                    true;


                state.crown.scale.set(
                    1,
                    1,
                    1
                );


                state.root.userData.aimLabel =
                    '采摘嫩茶叶';


                if (
                    state.interactEntry
                ) {

                    state.interactEntry.label =
                        '采摘嫩茶叶';
                }


                /*
                   新芽刚出现时稍微缩小，
                   下一帧呼吸动画会恢复。
                */

                state.buds.scale.set(
                    0.72,
                    0.72,
                    0.72
                );


                SND.play(
                    'magic'
                );
            }
        }
    }


    /* ======================================================
       更新采摘叶片动画
       ====================================================== */

    for (
        let i =
            teaPickParticles.length -
            1;

        i >= 0;

        i--
    ) {

        const p =
            teaPickParticles[i];


        p.age +=
            dt;


        const k =
            Math.min(
                p.age /
                p.life,
                1
            );


        /*
           smoothstep
        */

        const e =
            k *
            k *
            (
                3 -
                2 *
                k
            );


        /* ==================================================
           目标位置：玩家身体上方
           ================================================== */

        const tx =
            player.pos.x;


        const ty =
            player.pos.y +
            0.75;


        const tz =
            player.pos.z;


        /* ==================================================
           X 方向
           ================================================== */

        p.mesh.position.x +=
            (
                tx -
                p.mesh.position.x
            ) *
            Math.min(
                1,
                dt *
                5.5
            );


        /* ==================================================
           Z 方向
           ================================================== */

        p.mesh.position.z +=
            (
                tz -
                p.mesh.position.z
            ) *
            Math.min(
                1,
                dt *
                5.5
            );


        /* ==================================================
           Y 方向 + 小弧线
           ================================================== */

        p.mesh.position.y +=

            (
                ty -
                p.mesh.position.y
            ) *
            Math.min(
                1,
                dt *
                4.2
            )

            +

            Math.sin(
                k *
                Math.PI
            ) *
            dt *
            0.35;


        /* ==================================================
           飞行旋转
           ================================================== */

        p.mesh.rotation.y +=
            dt *
            5;


        p.mesh.rotation.z +=
            dt *
            3;


        /* ==================================================
           接近玩家后缩小
           ================================================== */

        const sc =
            Math.max(
                0.001,
                1 -
                e
            );


        p.mesh.scale.setScalar(
            sc
        );


        /* ==================================================
           动画结束
           ================================================== */

        if (
            k >= 1
        ) {

            scene.remove(
                p.mesh
            );


            p.mesh.traverse(
                o => {

                    if (
                        o.geometry
                    ) {

                        o.geometry.dispose();
                    }
                }
            );


            teaPickParticles.splice(
                i,
                1
            );
        }
    }
}


/* ==========================================================
   11.5 茶场雇佣系统
   ========================================================== */

function chooseTeaWorkerPlant() {

    const worker =
        teaHireState.worker;


    const readyPlants =
        teaPlants.filter(
            p => p.ready
        );


    if (
        readyPlants.length <=
        0
    ) {

        return null;
    }


    if (
        !worker
    ) {

        return readyPlants[0];
    }


    return readyPlants.reduce(
        (
            best,
            plant
        ) => {

            const bd =
                Math.hypot(
                    best.x -
                    worker.position.x,
                    best.z -
                    worker.position.z
                );


            const pd =
                Math.hypot(
                    plant.x -
                    worker.position.x,
                    plant.z -
                    worker.position.z
                );


            return pd < bd
                ? plant
                : best;
        },
        readyPlants[0]
    );
}

function payTeaWorker(
    reason
) {

    if (
        !window.spendCabinCoins
    ) {

        showHintOverride(
            '金币系统还没准备好，暂时不能支付茶工工资'
        );

        return false;
    }


    if (
        !window.spendCabinCoins(
            TEA_WORKER_DAILY_WAGE,
            null
        )
    ) {

        return false;
    }


    teaHireState.lastPaidDay =
        currentTeaDay();


    teaHireState.striking =
        false;


    saveTeaHireStateNow();


    if (
        reason
    ) {

        showHintOverride(
            reason +
            ' · 日薪 -' +
            TEA_WORKER_DAILY_WAGE
        );
    }


    return true;
}

function hireTeaWorker() {

    if (
        typeof window.isMainStoryFeatureUnlocked === 'function' &&
        !window.isMainStoryFeatureUnlocked('tea')
    ) {
        if (typeof window.requestMainStoryAccess === 'function') {
            window.requestMainStoryAccess('tea', hireTeaWorker);
        }
        return;
    }

    if (
        !teaHireState.hired
    ) {

        teaHireState.hired =
            true;


        teaHireState.lastPaidDay =
            currentTeaDay();


        teaHireState.phase =
            'seek';


        updateTeaHireLabel();


        SND.play(
            'chim'
        );


        showHintOverride(
            '已雇佣茶工 · 日结工资 ' +
            TEA_WORKER_DAILY_WAGE
        );


        saveTeaHireStateNow();


        return;
    }


    if (
        teaHireState.striking
    ) {

        if (
            !payTeaWorker(
                '已补发工资，茶工恢复采摘'
            )
        ) {

            return;
        }


        teaHireState.phase =
            'seek';


        updateTeaHireLabel();


        SND.play(
            'chim'
        );


        return;
    }


    updateTeaHireLabel();


    showHintOverride(
        '茶工已在采摘 · 每日结算日薪 ' +
        TEA_WORKER_DAILY_WAGE
    );
}

function buildTeaWorkerTool() {

    const g =
        new THREE.Group();


    const handle =
        teaPart(
            new THREE.CylinderGeometry(
                0.012,
                0.015,
                0.30,
                7
            ),
            teaWoodMat
        );


    handle.rotation.x =
        Math.PI /
        2;


    g.add(
        handle
    );


    for (
        const sx of [
            -1,
            1
        ]
    ) {

        const blade =
            teaPart(
                new THREE.BoxGeometry(
                    0.11,
                    0.018,
                    0.045
                ),
                teaBudMat
            );


        blade.position.set(
            sx *
            0.045,
            0,
            0.16
        );


        blade.rotation.y =
            sx *
            0.52;


        g.add(
            blade
        );
    }


    g.visible =
        false;


    return g;
}

function buildTeaHireStation() {

    const x =
        TEA_FARM_CENTER.x -
        4.4;


    const z =
        TEA_FARM_CENTER.z +
        2.7;


    const g =
        new THREE.Group();


    g.position.set(
        x,
        0,
        z
    );


    scene.add(
        g
    );


    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.04,
                0.05,
                0.95,
                7
            ),
            teaWoodDarkMat
        ),
        0,
        0.475,
        0,
        0,
        0,
        0,
        g
    );


    const sign =
        makeTeaHireLabel(
            '雇佣茶工'
        );


    sign.position.set(
        0,
        1.02,
        0
    );


    sign.rotation.y =
        Math.PI /
        2;


    g.add(
        sign
    );


    const worker =
        new THREE.Group();


    worker.position.set(
        x +
        0.7,
        0,
        z -
        0.22
    );


    const body =
        teaPart(
            new THREE.SphereGeometry(
                0.22,
                18,
                12
            ),
            teaLeafLightMat
        );


    body.scale.set(
        1,
        0.78,
        1
    );


    body.position.y =
        0.21;


    worker.add(
        body
    );


    const core =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.075,
                12,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0xdce9c0,

                transparent:
                    true,

                opacity:
                    0.58
            })
        );


    core.position.set(
        0,
        0.24,
        0
    );


    worker.add(
        core
    );


    for (
        const xEye of [
            -0.075,
            0.075
        ]
    ) {

        const eye =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.018,
                    8,
                    6
                ),
                LITMAT(
                    0x1b2420
                )
            );


        eye.position.set(
            xEye,
            0.30,
            0.18
        );


        worker.add(
            eye
        );
    }


    const shadow =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                0.23,
                20
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0x1e5a40,

                transparent:
                    true,

                opacity:
                    0.12,

                depthWrite:
                    false
            })
        );


    shadow.rotation.x =
        -Math.PI /
        2;


    shadow.position.y =
        0.012;


    worker.add(
        shadow
    );


    const toolRoot =
        new THREE.Group();


    toolRoot.position.set(
        0.20,
        0.28,
        0.14
    );


    teaHireState.tool =
        buildTeaWorkerTool();


    toolRoot.add(
        teaHireState.tool
    );


    worker.add(
        toolRoot
    );


    scene.add(
        worker
    );


    teaHireState.worker =
        worker;


    teaHireState.body =
        body;


    teaHireState.toolRoot =
        toolRoot;


    g.userData.aimLabel =
        teaHireLabel();


    regMagic(
        g,
        hireTeaWorker
    );


    const entry = {

        x:
            x,

        z:
            z,

        r:
            1.35,

        label:
            teaHireLabel(),

        act:
            hireTeaWorker
    };


    teaHireState.labelEntry =
        entry;


    interactables.push(
        entry
    );
}

function setTeaWorkerToolVisible(
    visible
) {

    if (
        teaHireState.tool
    ) {

        teaHireState.tool.visible =
            !!visible;
    }
}

function startTeaWorkerTask() {

    const plant =
        chooseTeaWorkerPlant();


    if (
        !plant
    ) {

        teaHireState.targetPlant =
            null;


        teaHireState.phase =
            'wait';


        teaHireState.actionTimer =
            1.2;


        setTeaWorkerToolVisible(
            false
        );


        return;
    }


    teaHireState.targetPlant =
        plant;


    teaHireState.phase =
        'move';


    setTeaWorkerToolVisible(
        true
    );
}

function animateTeaWorker(
    dt,
    time,
    moving
) {

    const worker =
        teaHireState.worker;


    if (
        !worker ||
        !teaHireState.body
    ) {

        return;
    }


    if (
        moving
    ) {

        teaHireState.pulse +=
            dt *
            7.0;
    }


    const breathe =
        1 +
        Math.sin(
            time *
            1.7
        ) *
        0.03;


    const stepSquash =
        moving
            ? 1 -
            0.10 *
            Math.max(
                0,
                Math.sin(
                    teaHireState.pulse -
                    0.9
                )
            )
            : 1;


    const actionSquash =
        teaHireState.phase ===
        'act'
            ? 1 +
            0.08 *
            Math.sin(
                teaHireState.actionTimer *
                Math.PI *
                5
            )
            : 1;


    const sy =
        Math.max(
            0.55,
            Math.min(
                1.25,
                0.78 *
                breathe *
                stepSquash *
                actionSquash
            )
        );


    const sxz =
        1 /
        Math.sqrt(
            sy
        );


    teaHireState.body.scale.set(
        sxz,
        sy,
        sxz
    );


    teaHireState.body.position.y =
        0.22 *
        sy;


    teaHireState.body.rotation.x =
        moving
            ? Math.sin(
                teaHireState.pulse
            ) *
            0.08
            : 0;


    teaHireState.body.rotation.z =
        moving
            ? Math.sin(
                teaHireState.pulse *
                0.5
            ) *
            0.08
            : 0;


    if (
        teaHireState.toolRoot
    ) {

        teaHireState.toolRoot.position.y =
            0.28 +
            Math.sin(
                time *
                1.6
            ) *
            0.006;


        teaHireState.toolRoot.rotation.set(
            0,
            0,
            0
        );


        if (
            teaHireState.phase ===
            'act'
        ) {

            const raw =
                Math.min(
                    1,
                    teaHireState.actionTimer /
                    0.9
                );


            const swing =
                Math.sin(
                    raw *
                    Math.PI
                );


            teaHireState.toolRoot.rotation.y =
                1.25 *
                swing;


            teaHireState.toolRoot.rotation.z =
                -0.35 *
                swing;
        }
    }
}

function settleTeaWorkerWage() {

    if (
        !teaHireState.hired ||
        teaHireState.striking
    ) {

        return;
    }


    const day =
        currentTeaDay();


    if (
        day <
        teaHireState.lastPaidDay
    ) {

        teaHireState.lastPaidDay =
            day;


        saveTeaHireStateNow();


        return;
    }


    if (
        day <=
        teaHireState.lastPaidDay
    ) {

        return;
    }


    if (
        window.spendCabinCoins &&
        window.spendCabinCoins(
            TEA_WORKER_DAILY_WAGE,
            null
        )
    ) {

        teaHireState.lastPaidDay =
            day;


        saveTeaHireStateNow();


        return;
    }


    teaHireState.striking =
        true;


    teaHireState.phase =
        'idle';


    teaHireState.targetPlant =
        null;


    setTeaWorkerToolVisible(
        false
    );


    showHintOverride(
        '金币不足，茶工罢工了 · 需要补发 ' +
        TEA_WORKER_DAILY_WAGE +
        ' 金币'
    );


    saveTeaHireStateNow();
}

function updateTeaHireSystem(
    dt,
    time
) {

    updateTeaHutDoors(
        dt
    );

    settleTeaWorkerWage();


    if (
        !teaHireState.hired ||
        teaHireState.striking
    ) {

        animateTeaWorker(
            dt,
            time,
            false
        );


        updateTeaHireLabel();


        return;
    }


    let moving =
        false;


    if (
        teaHireState.phase ===
        'idle' ||
        teaHireState.phase ===
        'seek'
    ) {

        startTeaWorkerTask();
    }


    if (
        teaHireState.phase ===
        'wait'
    ) {

        teaHireState.actionTimer -=
            dt;


        if (
            teaHireState.actionTimer <=
            0
        ) {

            teaHireState.phase =
                'seek';
        }
    } else if (
        teaHireState.phase ===
        'move'
    ) {

        const plant =
            teaHireState.targetPlant;


        const worker =
            teaHireState.worker;


        if (
            !plant ||
            !worker ||
            !plant.ready
        ) {

            teaHireState.phase =
                'seek';
        } else {

            const dx =
                plant.x -
                worker.position.x;


            const dz =
                plant.z -
                worker.position.z;


            const dist =
                Math.hypot(
                    dx,
                    dz
                );


            worker.rotation.y =
                Math.atan2(
                    dx,
                    dz
                );


            if (
                dist >
                0.42
            ) {

                const step =
                    Math.min(
                        dist,
                        TEA_WORKER_SPEED *
                        dt
                    );


                worker.position.x +=
                    dx /
                    dist *
                    step;


                worker.position.z +=
                    dz /
                    dist *
                    step;


                worker.position.y =
                    0;


                moving =
                    true;
            } else {

                teaHireState.phase =
                    'act';


                teaHireState.actionTimer =
                    0;
            }
        }
    } else if (
        teaHireState.phase ===
        'act'
    ) {

        teaHireState.actionTimer +=
            dt;


        if (
            teaHireState.actionTimer >=
            0.48 &&
            teaHireState.targetPlant
        ) {

            pickTeaPlant(
                teaHireState.targetPlant,
                true
            );


            teaHireState.targetPlant =
                null;
        }


        if (
            teaHireState.actionTimer >=
            0.9
        ) {

            teaHireState.phase =
                'seek';
        }
    }


    animateTeaWorker(
        dt,
        time,
        moving
    );


    updateTeaHireLabel();
}


/* ==========================================================
   12. 茶场碰撞

   使用原 player-controller 的 solidBoxes。

   不给每棵茶树放一个大方块，
   而是一整条茶垄一条碰撞带。

   玩家可以：

       茶垄
   ============

       玩家道路

   ============

       茶垄

   在茶垄之间自由移动。
   ========================================================== */

function addTeaFarmCollisions() {

    if (
        typeof solidBoxes ===
        'undefined'
    ) {

        return;
    }


    /* ======================================================
       茶垄碰撞

       茶园现在是平面地块，茶树本身保持可穿行采摘，
       不再把每一行茶垄当成实心墙。
       ====================================================== */


    /* ======================================================
       木牌碰撞
       ====================================================== */

    solidBoxes.push({

        x1:
            TEA_FARM_CENTER.x -
            3.78,

        z1:
            TEA_FARM_CENTER.z +
            4.20,

        x2:
            TEA_FARM_CENTER.x +
            -1.62,

        z2:
            TEA_FARM_CENTER.z +
            4.50
    });


    /* ======================================================
       制茶小屋碰撞
       ====================================================== */

    const hx =
        TEA_FARM_CENTER.x +
        TEA_HUT_OFFSET.x;

    const hz =
        TEA_FARM_CENTER.z +
        TEA_HUT_OFFSET.z;

    const t =
        0.22;

    const left =
        hx +
        TEA_HUT_COLLISION.left;

    const right =
        hx +
        TEA_HUT_COLLISION.right;

    const back =
        hz +
        TEA_HUT_COLLISION.back;

    const front =
        hz +
        TEA_HUT_COLLISION.front;

    const doorLeft =
        hx +
        TEA_HUT_COLLISION.doorCenter -
        TEA_HUT_COLLISION.doorHalf;

    const doorRight =
        hx +
        TEA_HUT_COLLISION.doorCenter +
        TEA_HUT_COLLISION.doorHalf;

    solidBoxes.push({
        x1:
            left,
        z1:
            back,
        x2:
            right,
        z2:
            back +
            t
    });

    solidBoxes.push({
        x1:
            left,
        z1:
            back,
        x2:
            left +
            t,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            right -
            t,
        z1:
            back,
        x2:
            right,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            left,
        z1:
            front -
            t,
        x2:
            doorLeft,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            doorRight,
        z1:
            front -
            t,
        x2:
            right,
        z2:
            front
    });

}


/* ==========================================================
   13. 创建整个茶场
   ========================================================== */

function buildTeaFarm() {

    /* ======================================================
       地面 / 茶垄 / 木牌 / 茶篓
       ====================================================== */

    buildTeaFieldBase();


    /* ======================================================
       24 株茶树
       ====================================================== */

    for (
        let row = 0;
        row < TEA_ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < TEA_COLS;
            col++
        ) {

            const x =
                TEA_FARM_CENTER.x +

                (
                    col -
                    (
                        TEA_COLS - 1
                    ) /
                    2
                ) *
                TEA_COL_GAP;


            const z =
                TEA_FARM_CENTER.z +

                (
                    row -
                    (
                        TEA_ROWS - 1
                    ) /
                    2
                ) *
                TEA_ROW_GAP;


            buildTeaPlant(

                x,

                z,

                row *
                TEA_COLS +
                col,

                0
            );
        }
    }


    /* ======================================================
       茶工雇佣牌和角色
       ====================================================== */

    buildTeaHireStation();


    /* ======================================================
       碰撞
       ====================================================== */

    addTeaFarmCollisions();
}


/* ==========================================================
   14. 初始化
   ========================================================== */

buildTeaFarm();


/* ==========================================================
   15. 存档接口

   不直接修改 15-app-shell.js。

   暴露接口给现有存档系统调用。
   ========================================================== */


/* ==========================================================
   保存茶场
   ========================================================== */

window.captureTeaFarmState =
    function () {

        const now =
            performance.now() *
            0.001;


        const result = {

            /* ------------------------------------------------
               已采茶青数量
               ------------------------------------------------ */

            leafCount:
                teaLeafCount,


            /* ------------------------------------------------
               制茶流程库存（生茶青/晒干/炒制/成品批次）
               ------------------------------------------------ */

            process:
                {
                    raw: teaProcessState.raw,
                    dried: teaProcessState.dried,
                    roasted: teaProcessState.roasted,
                    finished: teaProcessState.finished
                },


            /* ------------------------------------------------
               每株茶树状态
               ------------------------------------------------ */

            plants:
                teaPlants.map(
                    p => ({

                        ready:
                            p.ready,

                        remaining:
                            p.ready
                                ? 0
                                : Math.max(

                                    0,

                                    p.regrowSeconds -

                                    (
                                        now -
                                        p.pickedAt
                                    )
                                )
                    })
                )
        };


        result.hire =
            {
                hired:
                    teaHireState.hired,

                striking:
                    teaHireState.striking,

                lastPaidDay:
                    teaHireState.lastPaidDay
            };


        return result;
    };


/* ==========================================================
   恢复茶场
   ========================================================== */

window.applyTeaFarmState =
    function (
        raw,
        elapsedRealSeconds = 0
    ) {

        if (
            !raw ||
            typeof raw !==
            'object'
        ) {

            return;
        }


        /* ==================================================
           恢复茶青数量
           ================================================== */

        teaLeafCount =
            Math.max(

                0,

                Math.min(

                    999999,

                    Math.trunc(
                        Number(
                            raw.leafCount
                        ) ||
                        0
                    )
                )
            );

        const proc = raw.process || {};
        teaProcessState = {
            raw: Math.max(0, Math.min(999999, Math.trunc(Number(proc.raw) || 0))),
            dried: Math.max(0, Math.min(999999, Math.trunc(Number(proc.dried) || 0))),
            roasted: Math.max(0, Math.min(999999, Math.trunc(Number(proc.roasted) || 0))),
            finished: Math.max(0, Math.min(999999, Math.trunc(Number(proc.finished) || 0)))
        };


        if (
            raw.hire
        ) {

            teaHireState.hired =
                !!(
                    raw.hire.hired ||
                    raw.hire.active
                );


            teaHireState.striking =
                !!raw.hire.striking;


            teaHireState.lastPaidDay =
                Math.max(
                    0,
                    Math.trunc(
                        Number(
                            raw.hire.lastPaidDay
                        ) ||
                        currentTeaDay()
                    )
                );


            teaHireState.targetPlant =
                null;


            teaHireState.phase =
                teaHireState.hired &&
                !teaHireState.striking
                    ? 'seek'
                    : 'idle';


            setTeaWorkerToolVisible(
                false
            );


            updateTeaHireLabel();
        }


        /* ==================================================
           没有茶树存档
           ================================================== */

        if (
            !Array.isArray(
                raw.plants
            )
        ) {

            return;
        }


        const now =
            performance.now() *
            0.001;


        /* ==================================================
           恢复每株茶树
           ================================================== */

        raw.plants.forEach(
            (
                saved,
                i
            ) => {

                const p =
                    teaPlants[i];


                if (
                    !p ||
                    !saved
                ) {

                    return;
                }


                const remaining =
                    Math.max(

                        0,

                        Math.min(

                            p.regrowSeconds,

                            Number(
                                saved.remaining
                            ) ||
                            0
                        ) -
                        elapsedRealSeconds
                    );


                p.ready =
                    saved.ready === true ||
                    remaining <= 0;


                /* ==========================================
                   已成熟
                   ========================================== */

                if (
                    p.ready
                ) {

                    p.pickedAt =
                        0;


                    p.buds.visible =
                        true;


                    p.crown.scale.set(
                        1,
                        1,
                        1
                    );


                    p.root.userData.aimLabel =
                        '采摘嫩茶叶';


                    if (
                        p.interactEntry
                    ) {

                        p.interactEntry.label =
                            '采摘嫩茶叶';
                    }
                }


                /* ==========================================
                   尚未成熟
                   ========================================== */

                else {

                    p.pickedAt =

                        now -

                        (
                            p.regrowSeconds -
                            remaining
                        );


                    p.buds.visible =
                        false;


                    p.crown.scale.set(
                        0.94,
                        0.92,
                        0.94
                    );


                    p.root.userData.aimLabel =
                        '等待嫩芽重新长出';


                    if (
                        p.interactEntry
                    ) {

                        p.interactEntry.label =
                            '等待嫩芽重新长出';
                    }
                }
            }
        );


        if (
            raw.hire
        ) {

            teaHireState.hired =
                !!(
                    raw.hire.hired ||
                    raw.hire.active
                );


            teaHireState.striking =
                !!raw.hire.striking;


            teaHireState.lastPaidDay =
                Math.max(
                    0,
                    Math.trunc(
                        Number(
                            raw.hire.lastPaidDay
                        ) ||
                        currentTeaDay()
                    )
                );


            teaHireState.targetPlant =
                null;


            teaHireState.phase =
                teaHireState.hired &&
                !teaHireState.striking
                    ? 'seek'
                    : 'idle';


            setTeaWorkerToolVisible(
                false
            );


            updateTeaHireLabel();
        }
    };


/* ==========================================================
   16. 茶青数量读取接口
   ========================================================== */

window.getTeaLeafCount =
    function () {

        return teaLeafCount;
    };


/* ==========================================================
   17. 茶青数量修改接口

   后面：
   制茶系统 / 商店 / 茶馆
   都可以调用这个接口。
   ========================================================== */

window.setTeaLeafCount =
    function (
        n
    ) {

        teaLeafCount =
            Math.max(

                0,

                Math.min(

                    999999,

                    Math.trunc(
                        Number(
                            n
                        ) ||
                        0
                    )
                )
            );
    };
