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

const TEA_HUT_COLLISION = {
    left: -3.20,
    right: 3.20,
    back: -2.35,
    front: 3.05
};

const TEA_PICK_DISTANCE = 1.15;

/*
   测试阶段先设为 45 秒。

   后面正式游戏可以改成：
   120
   300
   或者跟游戏内日期系统绑定。
*/
const TEA_REGROW_SECONDS = 45;
const TEA_PICK_COINS = 18;
const TEA_WORKER_DAILY_WAGE = 60;
const TEA_WORKER_SPEED = 1.55;


/* ==========================================================
   1. 全局茶场状态
   ========================================================== */

const teaPlants = [];

const teaPickParticles = [];

let teaLeafCount = 0;

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
        1.85
    );

    scene.add(
        g
    );

    const enterTeaHut = () => {
        const go = () => {
            if (
                typeof window.prepareStoreReturn ===
                'function'
            ) {
                window.prepareStoreReturn();
            } else if (
                typeof saveGameState ===
                'function'
            ) {
                saveGameState(
                    false
                );
            }

            window.location.href =
                'tea-hut/index.html';
        };

        if (
            typeof window.requestMainStoryAccess ===
            'function'
        ) {
            window.requestMainStoryAccess(
                'tea',
                go
            );
        } else {
            go();
        }
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

    beam(
        3.05,
        0.16,
        2.28,
        0,
        0.08,
        0,
        0,
        0,
        0,
        teaStoneMat
    );

    beam(
        2.72,
        0.10,
        2.02,
        0,
        0.20,
        0,
        0,
        0,
        0,
        teaWoodMat
    );

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

        cylinder(
            new THREE.CylinderGeometry(
                0.065,
                0.080,
                1.62,
                7
            ),
            teaWoodDarkMat,
            p[0],
            1.02,
            p[1]
        );
    }

    beam(
        2.82,
        0.12,
        0.12,
        0,
        1.64,
        0.86
    );

    beam(
        2.82,
        0.12,
        0.12,
        0,
        1.64,
        -0.86
    );

    beam(
        0.12,
        0.12,
        1.92,
        -1.25,
        1.58,
        0
    );

    beam(
        0.12,
        0.12,
        1.92,
        1.25,
        1.58,
        0
    );

    beam(
        2.52,
        0.95,
        0.08,
        0,
        0.96,
        -0.92,
        0,
        0,
        0,
        teaClothMat
    );

    for (
        const wx of [
            -0.76,
            0.76
        ]
    ) {

        beam(
            0.42,
            0.46,
            0.055,
            wx,
            1.05,
            -0.965,
            0,
            0,
            0,
            teaWoodMat
        );

        beam(
            0.36,
            0.035,
            0.065,
            wx,
            1.05,
            -1.005
        );

        beam(
            0.035,
            0.36,
            0.065,
            wx,
            1.05,
            -1.005
        );
    }

    for (
        const side of [
            -1,
            1
        ]
    ) {

        const roof =
            teaPart(
                new THREE.BoxGeometry(
                    3.18,
                    0.10,
                    1.28
                ),
                teaWoodDarkMat
            );

        roof.position.set(
            0,
            1.96,
            side * 0.48
        );

        roof.rotation.x =
            side * 0.34;

        g.add(
            roof
        );

        for (
            let i = -3;
            i <= 3;
            i++
        ) {

            cylinder(
                new THREE.CylinderGeometry(
                    0.035,
                    0.035,
                    1.25,
                    6
                ),
                teaWoodMat,
                i * 0.44,
                2.04,
                side * 0.52,
                Math.PI / 2 + side * 0.34
            );
        }
    }

    beam(
        0.16,
        0.16,
        2.10,
        0,
        2.12,
        0
    );

    beam(
        0.36,
        0.58,
        0.36,
        0.86,
        2.32,
        -0.34,
        0,
        0.05,
        0,
        teaStoneMat
    );

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const smoke =
            teaPart(
                new THREE.SphereGeometry(
                    0.12 + i * 0.04,
                    8,
                    6
                ),
                teaClothMat
            );

        smoke.position.set(
            0.88 + i * 0.08,
            2.70 + i * 0.18,
            -0.34 - i * 0.05
        );

        smoke.scale.y =
            1.25;

        g.add(
            smoke
        );
    }

    beam(
        1.18,
        0.72,
        0.045,
        -0.48,
        1.05,
        0.93,
        0,
        0,
        0,
        teaClothMat
    );

    const curtain =
        makeTeaTextPlane(
            [
                {
                    text:
                        '茶',
                    font:
                        'bold 68px "Songti SC", "STSong", serif',
                    y:
                        126
                },
                {
                    text:
                        '手工制茶',
                    font:
                        '22px "Songti SC", "STSong", serif',
                    y:
                        218
                }
            ],
            0.98,
            0.58,
            {
                bg:
                    '#f4eedb',
                stroke:
                    '#9f8664'
            }
        );

    curtain.position.set(
        -0.48,
        1.05,
        0.958
    );

    g.add(
        curtain
    );

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

    beam(
        0.66,
        0.48,
        0.66,
        0.82,
        0.46,
        -0.34,
        0,
        0,
        0,
        teaStoneMat
    );

    beam(
        0.30,
        0.18,
        0.035,
        0.82,
        0.40,
        0.01,
        0,
        0,
        0,
        teaCharcoalMat
    );

    cylinder(
        new THREE.CylinderGeometry(
            0.42,
            0.34,
            0.16,
            18
        ),
        teaCharcoalMat,
        0.82,
        0.76,
        -0.34
    );

    const panLeaves =
        teaPart(
            new THREE.SphereGeometry(
                0.27,
                10,
                6
            ),
            teaLeafLightMat
        );

    panLeaves.scale.set(
        1.08,
        0.13,
        0.72
    );

    panLeaves.position.set(
        0.82,
        0.85,
        -0.34
    );

    g.add(
        panLeaves
    );

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

    for (
        const item of [
            [1.18, 0.52, 0.24],
            [1.20, 0.20, 0.17]
        ]
    ) {

        cylinder(
            new THREE.CylinderGeometry(
                item[2],
                item[2] * 0.82,
                0.36,
                12,
                1,
                true
            ),
            teaBasketMat,
            item[0],
            0.38,
            item[1]
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

    const bag =
        teaPart(
            new THREE.BoxGeometry(
                0.36,
                0.58,
                0.22
            ),
            teaClothMat
        );

    bag.position.set(
        1.13,
        0.48,
        -0.82
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
                        '茶叶',
                    font:
                        'bold 26px "Songti SC", "STSong", serif',
                    y:
                        132
                }
            ],
            0.25,
            0.20
        );

    bagLabel.position.set(
        1.13,
        0.50,
        -0.935
    );

    g.add(
        bagLabel
    );

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
        -1.52,
        0.78,
        0.70
    );

    board.rotation.y =
        0.20;

    g.add(
        board
    );

    /* ======================================================
       正面入口
       ====================================================== */

    beam(
        0.13,
        0.96,
        0.12,
        0.64,
        0.88,
        0.98
    );

    beam(
        0.13,
        0.96,
        0.12,
        1.18,
        0.88,
        0.98
    );

    beam(
        0.68,
        0.12,
        0.12,
        0.91,
        1.38,
        0.98
    );

    beam(
        0.72,
        0.08,
        0.24,
        0.91,
        0.29,
        1.10,
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
        1.34,
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
        1.62,
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
                0.46,
                0.82
            ),
            entryMat
        );

    doorway.position.set(
        0.91,
        0.86,
        1.012
    );

    g.add(
        doorway
    );

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
        1.04
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
        '进入制茶小屋';

    g.add(
        doorHit
    );

    if (
        typeof regMagic ===
        'function'
    ) {
        regMagic(
            doorHit,
            enterTeaHut
        );
    }

    g.userData.aimLabel =
        '进入制茶小屋';

    regMagic(
        g,
        enterTeaHut
    );

    interactables.push({
        x:
            x,

        z:
            z,

        r:
            3.15,

        label:
            '进入制茶小屋',

        act:
            enterTeaHut
    });

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

function buildTeaWashBasin(
    parent,
    x,
    z
) {

    const basin =
        teaPart(
            new THREE.CylinderGeometry(
                0.38,
                0.46,
                0.32,
                12,
                1,
                true
            ),
            teaStoneMat
        );

    basin.position.set(
        x,
        0.20,
        z
    );

    parent.add(
        basin
    );

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.31,
                0.31,
                0.035,
                14
            ),
            teaWaterMat
        ),
        x,
        0.37,
        z,
        0,
        0,
        0,
        parent
    );

    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.035,
                0.04,
                0.72,
                6
            ),
            teaWoodDarkMat
        ),
        x - 0.18,
        0.72,
        z,
        0,
        0,
        0,
        parent
    );

    put(
        teaPart(
            new THREE.BoxGeometry(
                0.62,
                0.055,
                0.055
            ),
            teaWoodDarkMat
        ),
        x + 0.08,
        1.04,
        z,
        0,
        0,
        0,
        parent
    );
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


    buildTeaWashBasin(
        g,
        3.30,
        -2.88
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


    if (
        window.addCabinCoins
    ) {

        window.addCabinCoins(
            TEA_PICK_COINS,
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
            TEA_PICK_COINS +
            '</b>'
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
       制茶小屋 / 洗手池碰撞
       ====================================================== */

    solidBoxes.push({

        x1:
            TEA_FARM_CENTER.x +
            TEA_HUT_OFFSET.x +
            TEA_HUT_COLLISION.left,

        z1:
            TEA_FARM_CENTER.z +
            TEA_HUT_OFFSET.z +
            TEA_HUT_COLLISION.back,

        x2:
            TEA_FARM_CENTER.x +
            TEA_HUT_OFFSET.x +
            TEA_HUT_COLLISION.right,

        z2:
            TEA_FARM_CENTER.z +
            TEA_HUT_OFFSET.z +
            TEA_HUT_COLLISION.front
    });


    solidBoxes.push({

        x1:
            TEA_FARM_CENTER.x +
            2.88,

        z1:
            TEA_FARM_CENTER.z -
            3.25,

        x2:
            TEA_FARM_CENTER.x +
            3.72,

        z2:
            TEA_FARM_CENTER.z -
            2.50
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
