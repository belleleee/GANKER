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

const teaBasketMat =
    LITMAT(
        0xc59a68
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

       不使用农田的方格结构。
       茶场是一整块连续土地。
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
       茶垄
       ====================================================== */

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
           连续的土垄。
        */

        put(
            teaPart(
                new THREE.BoxGeometry(
                    (
                        TEA_COLS - 1
                    ) *
                    TEA_COL_GAP +
                    1.05,

                    0.10,

                    0.72
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
                            -3.0,
                            0.115,
                            z + dz
                        ),

                        new THREE.Vector3(
                            3.0,
                            0.115,
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
    }


    /* ======================================================
       茶场入口牌
       ====================================================== */

    buildTeaSign(
        TEA_FARM_CENTER.x,
        0,
        TEA_FARM_CENTER.z + 4.0
    );


    /* ======================================================
       茶篓
       ====================================================== */

    buildTeaBasket(
        TEA_FARM_CENTER.x + 3.55,
        0,
        TEA_FARM_CENTER.z + 2.65
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
                1.55,
                0.58,
                0.10
            ),
            teaWoodMat
        ),

        0,
        1.02,
        0,

        0,
        0,
        0,

        g
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
        0,
        1.02,
        0.07
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

       使用压扁 SphereGeometry。

       原因：
       - 保持低模
       - 有自然弧度
       - EdgesGeometry 可以形成清晰轮廓
       ====================================================== */

    const leaf =
        teaPart(
            new THREE.SphereGeometry(
                0.13,
                8,
                6
            ),

            light
                ? teaLeafLightMat
                : teaLeafMat
        );


    leaf.scale.set(
        1.55 * scale,
        0.42 * scale,
        0.72 * scale
    );


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
                    -0.14 * scale,
                    0.012,
                    0
                ),

                new THREE.Vector3(
                    0.14 * scale,
                    0.012,
                    0
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


    return g;
}


/* ==========================================================
   8. 创建一株茶树
   ========================================================== */

function buildTeaPlant(
    x,
    z,
    index
) {

    const root =
        new THREE.Group();


    root.position.set(
        x,
        0.11,
        z
    );


    scene.add(
        root
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
                0.12;


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
       ====================================================== */

    for (
        let row = 0;
        row < TEA_ROWS;
        row++
    ) {

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


        const halfW =

            (
                (
                    TEA_COLS - 1
                ) *
                TEA_COL_GAP
            ) /
            2

            +

            0.42;


        solidBoxes.push({

            x1:
                TEA_FARM_CENTER.x -
                halfW,

            z1:
                z -
                0.28,

            x2:
                TEA_FARM_CENTER.x +
                halfW,

            z2:
                z +
                0.28
        });
    }


    /* ======================================================
       木牌碰撞
       ====================================================== */

    solidBoxes.push({

        x1:
            TEA_FARM_CENTER.x -
            0.72,

        z1:
            TEA_FARM_CENTER.z +
            3.88,

        x2:
            TEA_FARM_CENTER.x +
            0.72,

        z2:
            TEA_FARM_CENTER.z +
            4.12
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
                col
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
