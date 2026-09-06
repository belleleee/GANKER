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


/* ==========================================================
   1. 全局茶场状态
   ========================================================== */

const teaPlants = [];

const teaPickParticles = [];

let teaLeafCount = 0;


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
    state
) {

    /* ======================================================
       尚未重新成熟
       ====================================================== */

    if (
        !state.ready
    ) {

        SND.play(
            'toggle'
        );


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


        showHintOverride(
            '这株茶树刚采过，还要等待约 <b>' +
            remain +
            ' 秒</b>'
        );


        return;
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


    /* ======================================================
       音效
       ====================================================== */

    SND.play(
        'chim'
    );


    /* ======================================================
       UI 提示
       ====================================================== */

    showHintOverride(
        '采到一份嫩茶青 · 茶篓 <b>' +
        teaLeafCount +
        '</b>'
    );


    /* ======================================================
       生成采摘动画
       ====================================================== */

    spawnPickedTeaLeaves(
        state
    );
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


        return {

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
    };


/* ==========================================================
   恢复茶场
   ========================================================== */

window.applyTeaFarmState =
    function (
        raw
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
                        )
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