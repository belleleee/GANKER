'use strict';

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
