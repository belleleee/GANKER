'use strict';

/* ==========================================================
   15-well.js
   WATER WELL MODULE

   严格沿用 line-art-style-magic-cabin 项目已有体系：

   box()
   log()
   edge()
   line()
   put()
   regMagic()
   solidBoxes

   功能：
   - 石砌井圈
   - 木制井架
   - 双坡木屋顶
   - 卷轴
   - 绳索
   - 木桶
   - 摇把
   - 点击 / E 放桶
   - 再次点击提桶
   - 弹簧动画
   - 打水后桶内出现水
   - 玩家不能穿过井体
   ========================================================== */


/* ==========================================================
   0. 水井系统
   ========================================================== */

const farmWells = [];


/* ==========================================================
   1. 水井构造
   ========================================================== */

function buildWell(
    x = -8,
    z = 7,
    rotationY = 0
) {

    /* ======================================================
       ROOT
       ====================================================== */

    const wellG =
        new THREE.Group();


    wellG.position.set(
        x,
        0,
        z
    );


    wellG.rotation.y =
        rotationY;


    scene.add(
        wellG
    );


    /* ======================================================
       尺寸
       ====================================================== */

    const WELL_R =
        0.72;


    const INNER_R =
        0.48;


    const STONE_H =
        0.20;


    const COURSE_N =
        3;


    const STONES_PER_COURSE =
        12;


    const POST_X =
        0.94;


    const POST_H =
        2.55;


    const AXLE_Y =
        1.82;


    const ROOF_EAVE_Y =
        2.40;


    const ROOF_RIDGE_Y =
        3.12;


    const ROOF_HALF_W =
        1.30;


    const ROOF_DEPTH =
        1.72;


    /* ======================================================
       2. 井圈
       多块石头围成圆环
       风格参考原项目坩埚外圈：
       多个 box 沿圆周排列
       ====================================================== */

    const stoneGroup =
        new THREE.Group();


    wellG.add(
        stoneGroup
    );


    for (
        let course = 0;
        course < COURSE_N;
        course++
    ) {

        const y =
            STONE_H / 2 +
            course * STONE_H;


        /*
           错缝排列
        */

        const offset =
            course % 2
                ? Math.PI /
                  STONES_PER_COURSE
                : 0;


        for (
            let i = 0;
            i < STONES_PER_COURSE;
            i++
        ) {

            const a =
                i /
                STONES_PER_COURSE *
                Math.PI *
                2 +
                offset;


            const stone =
                box(
                    0.38,
                    STONE_H - 0.015,
                    0.23
                );


            stone.position.set(
                Math.cos(a) *
                    WELL_R,

                y,

                Math.sin(a) *
                    WELL_R
            );


            /*
               让石块朝圆心方向
            */

            stone.rotation.y =
                -a +
                Math.PI / 2;


            stoneGroup.add(
                stone
            );
        }
    }


    /* ======================================================
       3. 顶层井沿
       稍微更宽
       ====================================================== */

    const rimGroup =
        new THREE.Group();


    wellG.add(
        rimGroup
    );


    const RIM_N =
        12;


    for (
        let i = 0;
        i < RIM_N;
        i++
    ) {

        const a =
            i /
            RIM_N *
            Math.PI *
            2;


        const rimStone =
            box(
                0.42,
                0.13,
                0.30
            );


        rimStone.position.set(
            Math.cos(a) *
                WELL_R,

            COURSE_N *
                STONE_H +
                0.065,

            Math.sin(a) *
                WELL_R
        );


        rimStone.rotation.y =
            -a +
            Math.PI / 2;


        rimGroup.add(
            rimStone
        );
    }


    /* ======================================================
       4. 井内黑暗
       用一个深色圆盘表现井口内部

       这里只使用 MeshBasicMaterial，
       保持原项目极简表现，不做 PBR。
       ====================================================== */

    const wellDarkMat =
        new THREE.MeshBasicMaterial({

            color:
                0x55514c,

            transparent:
                true,

            opacity:
                0.20,

            side:
                THREE.DoubleSide,

            depthWrite:
                false
        });


    const darkDisk =
        new THREE.Mesh(

            new THREE.CircleGeometry(
                INNER_R,
                32
            ),

            wellDarkMat
        );


    darkDisk.rotation.x =
        -Math.PI / 2;


    darkDisk.position.y =
        0.12;


    darkDisk.userData.noHit =
        true;


    wellG.add(
        darkDisk
    );


    /* ======================================================
       5. 左右立柱
       ====================================================== */

    const leftPost =
        box(
            0.18,
            POST_H,
            0.20
        );


    put(
        leftPost,

        -POST_X,

        POST_H / 2,

        0,

        0,
        0,
        0,

        wellG
    );


    const rightPost =
        box(
            0.18,
            POST_H,
            0.20
        );


    put(
        rightPost,

        POST_X,

        POST_H / 2,

        0,

        0,
        0,
        0,

        wellG
    );


    /* ======================================================
       6. 立柱加强木块
       ====================================================== */

    for (
        const sx of [
            -POST_X,
            POST_X
        ]
    ) {

        put(
            box(
                0.26,
                0.14,
                0.27
            ),

            sx,

            0.64,

            0,

            0,
            0,
            0,

            wellG
        );


        put(
            box(
                0.26,
                0.14,
                0.27
            ),

            sx,

            1.58,

            0,

            0,
            0,
            0,

            wellG
        );
    }


    /* ======================================================
       7. 斜撑
       直接使用原项目 logBetween()
       ====================================================== */

    logBetween(

        [
            -POST_X,
            2.06,
            0
        ],

        [
            -0.58,
            ROOF_EAVE_Y,
            0
        ],

        0.055,

        wellG
    );


    logBetween(

        [
            POST_X,
            2.06,
            0
        ],

        [
            0.58,
            ROOF_EAVE_Y,
            0
        ],

        0.055,

        wellG
    );


    /* ======================================================
       8. 屋顶横梁
       ====================================================== */

    put(

        box(
            2.35,
            0.16,
            0.18
        ),

        0,

        ROOF_EAVE_Y,

        0,

        0,
        0,
        0,

        wellG
    );


    /* ======================================================
       9. 三角屋架
       ====================================================== */

    for (
        const zz of [
            -0.70,
            0.70
        ]
    ) {

        logBetween(

            [
                -1.00,
                ROOF_EAVE_Y,
                zz
            ],

            [
                0,
                ROOF_RIDGE_Y,
                zz
            ],

            0.055,

            wellG
        );


        logBetween(

            [
                1.00,
                ROOF_EAVE_Y,
                zz
            ],

            [
                0,
                ROOF_RIDGE_Y,
                zz
            ],

            0.055,

            wellG
        );


        put(

            box(
                2.00,
                0.10,
                0.10
            ),

            0,

            ROOF_EAVE_Y,

            zz,

            0,
            0,
            0,

            wellG
        );
    }


    /* ======================================================
       10. 双坡屋顶
       ====================================================== */

    const roofRise =
        ROOF_RIDGE_Y -
        ROOF_EAVE_Y;


    const roofSlopeLen =
        Math.hypot(
            ROOF_HALF_W,
            roofRise
        );


    const roofAngle =
        Math.atan2(
            roofRise,
            ROOF_HALF_W
        );


    /* ---------- 左坡 ---------- */

    put(

        box(
            roofSlopeLen,
            0.07,
            ROOF_DEPTH
        ),

        -ROOF_HALF_W /
            2,

        (
            ROOF_EAVE_Y +
            ROOF_RIDGE_Y
        ) /
            2,

        0,

        0,
        0,
        roofAngle,

        wellG
    );


    /* ---------- 右坡 ---------- */

    put(

        box(
            roofSlopeLen,
            0.07,
            ROOF_DEPTH
        ),

        ROOF_HALF_W /
            2,

        (
            ROOF_EAVE_Y +
            ROOF_RIDGE_Y
        ) /
            2,

        0,

        0,
        0,
        -roofAngle,

        wellG
    );


    /* ======================================================
       11. 屋顶板条
       不使用贴图，继续使用项目的 box 建模方式
       ====================================================== */

    const TILE_N =
        6;


    for (
        let i = 0;
        i <= TILE_N;
        i++
    ) {

        const t =
            i /
            TILE_N;


        /* 左坡 */

        const lx =
            -ROOF_HALF_W +
            t *
            ROOF_HALF_W;


        const ly =
            ROOF_EAVE_Y +
            t *
            roofRise +
            0.055;


        put(

            log(
                ROOF_DEPTH +
                    0.08,

                0.025
            ),

            lx,

            ly,

            0,

            Math.PI / 2,
            0,
            0,

            wellG
        );


        /* 右坡 */

        const rx =
            ROOF_HALF_W -
            t *
            ROOF_HALF_W;


        put(

            log(
                ROOF_DEPTH +
                    0.08,

                0.025
            ),

            rx,

            ly,

            0,

            Math.PI / 2,
            0,
            0,

            wellG
        );
    }


    /* ======================================================
       12. 屋脊
       ====================================================== */

    put(

        log(
            ROOF_DEPTH +
                0.16,

            0.065
        ),

        0,

        ROOF_RIDGE_Y +
            0.03,

        0,

        Math.PI / 2,
        0,
        0,

        wellG
    );


    /* ======================================================
       13. 卷轴

       CylinderGeometry 默认 Y 轴，
       转 z = PI/2 后沿 X 方向
       ====================================================== */

    const axleG =
        new THREE.Group();


    axleG.position.set(
        0,
        AXLE_Y,
        0
    );


    wellG.add(
        axleG
    );


    const axle =
        log(
            1.72,
            0.095
        );


    axle.rotation.z =
        Math.PI / 2;


    axleG.add(
        axle
    );


    /* ======================================================
       14. 卷轴两端
       ====================================================== */

    for (
        const sx of [
            -0.87,
            0.87
        ]
    ) {

        const cap =
            edge(

                new THREE.CylinderGeometry(

                    0.13,

                    0.13,

                    0.055,

                    10
                )
            );


        cap.rotation.z =
            Math.PI / 2;


        cap.position.x =
            sx;


        axleG.add(
            cap
        );
    }


    /* ======================================================
       15. 绳子缠绕圈

       使用 TorusGeometry，
       视觉上类似原项目各种圆环构件。
       ====================================================== */

    const ropeLoops =
        [];


    for (
        let i = -3;
        i <= 3;
        i++
    ) {

        const ring =
            edge(

                new THREE.TorusGeometry(

                    0.112,

                    0.012,

                    6,

                    18
                )
            );


        ring.rotation.y =
            Math.PI / 2;


        ring.position.x =
            i *
            0.032;


        axleG.add(
            ring
        );


        ropeLoops.push(
            ring
        );
    }


    /* ======================================================
       16. 摇把
       ====================================================== */

    const crankPivot =
        new THREE.Group();


    crankPivot.position.set(
        POST_X +
            0.13,

        AXLE_Y,

        0
    );


    wellG.add(
        crankPivot
    );


    /* ---------- 从卷轴伸出的短轴 ---------- */

    const crankAxle =
        log(
            0.28,
            0.04
        );


    crankAxle.rotation.z =
        Math.PI / 2;


    crankAxle.position.x =
        0.14;


    crankPivot.add(
        crankAxle
    );


    /* ---------- L 形摇臂 ---------- */

    const crankArm =
        new THREE.Group();


    crankArm.position.x =
        0.28;


    crankPivot.add(
        crankArm
    );


    put(

        box(
            0.07,
            0.40,
            0.07
        ),

        0,

        -0.17,

        0,

        0,
        0,
        0,

        crankArm
    );


    /* ---------- 握把 ---------- */

    const handle =
        log(
            0.34,
            0.045
        );


    handle.rotation.z =
        Math.PI / 2;


    handle.position.set(
        0.17,
        -0.36,
        0
    );


    crankArm.add(
        handle
    );


    /* ======================================================
       17. 水桶
       ====================================================== */

    const bucketG =
        new THREE.Group();


    bucketG.position.set(
        0,
        1.08,
        0
    );


    wellG.add(
        bucketG
    );


    const BUCKET_R_TOP =
        0.22;


    const BUCKET_R_BOTTOM =
        0.17;


    const BUCKET_H =
        0.31;


    /* ---------- 桶身 ---------- */

    const bucketBody =
        edge(

            new THREE.CylinderGeometry(

                BUCKET_R_TOP,

                BUCKET_R_BOTTOM,

                BUCKET_H,

                10,

                1,

                true
            )
        );


    bucketG.add(
        bucketBody
    );


    /* ---------- 桶底 ---------- */

    const bucketBottom =
        edge(

            new THREE.CylinderGeometry(

                BUCKET_R_BOTTOM,

                BUCKET_R_BOTTOM,

                0.035,

                10
            )
        );


    bucketBottom.position.y =
        -BUCKET_H /
            2;


    bucketG.add(
        bucketBottom
    );


    /* ======================================================
       18. 桶箍
       ====================================================== */

    for (
        const yy of [
            -0.10,
            0.10
        ]
    ) {

        const hoop =
            edge(

                new THREE.TorusGeometry(

                    yy > 0
                        ? BUCKET_R_TOP
                        : BUCKET_R_BOTTOM +
                          0.015,

                    0.014,

                    6,

                    20
                )
            );


        hoop.rotation.x =
            Math.PI / 2;


        hoop.position.y =
            yy;


        bucketG.add(
            hoop
        );
    }


    /* ======================================================
       19. 桶身竖板结构线
       ====================================================== */

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const a =
            i /
            10 *
            Math.PI *
            2;


        const x1 =
            Math.cos(a) *
            BUCKET_R_BOTTOM;


        const z1 =
            Math.sin(a) *
            BUCKET_R_BOTTOM;


        const x2 =
            Math.cos(a) *
            BUCKET_R_TOP;


        const z2 =
            Math.sin(a) *
            BUCKET_R_TOP;


        bucketG.add(

            line([

                [
                    x1,
                    -BUCKET_H /
                        2,
                    z1
                ],

                [
                    x2,
                    BUCKET_H /
                        2,
                    z2
                ]

            ])
        );
    }


    /* ======================================================
       20. 桶提手

       用 TubeGeometry 做半圆弧
       仍然 edge() 包装
       ====================================================== */

    const handlePts =
        [];


    for (
        let i = 0;
        i <= 16;
        i++
    ) {

        const a =
            Math.PI *
            i /
            16;


        handlePts.push(

            V(

                Math.cos(a) *
                    0.20,

                Math.sin(a) *
                    0.22 +
                    0.14,

                0
            )
        );
    }


    const bucketHandle =
        edge(

            new THREE.TubeGeometry(

                new THREE.CatmullRomCurve3(
                    handlePts
                ),

                24,

                0.012,

                6,

                false
            )
        );


    bucketG.add(
        bucketHandle
    );


    /* ======================================================
       21. 桶内水面
       初始隐藏
       ====================================================== */

    const waterMat =
        new THREE.MeshBasicMaterial({

            color:
                0xa9c7d8,

            transparent:
                true,

            opacity:
                0.58,

            side:
                THREE.DoubleSide
        });


    const bucketWater =
        new THREE.Mesh(

            new THREE.CircleGeometry(
                0.18,
                20
            ),

            waterMat
        );


    bucketWater.rotation.x =
        -Math.PI / 2;


    bucketWater.position.y =
        0.145;


    bucketWater.visible =
        false;


    bucketWater.userData.noHit =
        true;


    bucketG.add(
        bucketWater
    );


    /* ======================================================
       22. 动态垂直绳索

       line() 返回 THREE.Line，
       但这里需要每帧改变长度，
       因此直接使用 BufferGeometry。
       ====================================================== */

    const ropeGeo =
        new THREE.BufferGeometry();


    const ropePositions =
        new Float32Array(
            6
        );


    ropeGeo.setAttribute(

        'position',

        new THREE.BufferAttribute(
            ropePositions,
            3
        )
    );


    const ropeLine =
        new THREE.Line(
            ropeGeo,
            MAT
        );


    ropeLine.userData.noHit =
        true;


    wellG.add(
        ropeLine
    );


    /* ======================================================
       23. 水井状态
       弹簧结构直接参考原项目：
       chestOpen / chestP / chestV
       ====================================================== */

    const state = {

        down:
            false,

        p:
            0,

        v:
            0,

        filled:
            false,

        autoDrawing:
            false,

        axle:
            axleG,

        crank:
            crankPivot,

        bucket:
            bucketG,

        water:
            bucketWater,

        rope:
            ropeLine,

        ropeGeo:
            ropeGeo,

        axleY:
            AXLE_Y,

        bucketTopY:
            1.08,

        /*
           桶下降到井内
           注意：这是 wellG 局部坐标
        */

        bucketBottomY:
            -0.72
    };


    wellG.userData.well =
        state;


    /* ======================================================
       24. 注册交互

       regMagic 会遍历当前 Group 内的 Mesh，
       给它们挂 magicRoot。
       所以必须在所有 Mesh 建好以后再调用。
       原项目 regMagic 本身就是这样实现的。
       ====================================================== */

    wellG.userData.aimLabel = '打水';

    function drawWaterFromWell() {

        if (state.autoDrawing) {
            showHintOverride('正在打水中，水桶马上就上来了');
            return;
        }

        if (
            typeof window.isWateringCanFilled === 'function' &&
            window.isWateringCanFilled()
        ) {
            showHintOverride('水壶已经有水了，先去农田浇灌吧');
            return;
        }

        state.down = true;
        state.filled = false;
        state.autoDrawing = true;
        wellG.userData.aimLabel = '正在打水';

        showHintOverride('水桶放下去了，等它提上来就能装满水壶');
    }

    regMagic(wellG, drawWaterFromWell);

    if (
        typeof interactables !==
        'undefined'
    ) {
        const wellInteractEntry = {
            x,
            z,
            r: 1.65,
            label: wellG.userData.aimLabel,
            act: drawWaterFromWell
        };

        state.interactEntry = wellInteractEntry;

        interactables.push(wellInteractEntry);
    }


    /* ======================================================
       25. 碰撞

       原项目玩家碰撞使用 solidBoxes，
       格式：
       {x1,z1,x2,z2}

       用井圈整体作为障碍，
       防止史莱姆直接穿过井体。
       ====================================================== */

    if (
        typeof solidBoxes !==
        'undefined'
    ) {

        /*
           当前 buildWell 支持 rotationY，
           为避免旋转后的 AABB 计算复杂化，
           井圈本身近似圆形，因此直接使用中心方框。
        */

        solidBoxes.push({

            x1:
                x -
                0.82,

            z1:
                z -
                0.82,

            x2:
                x +
                0.82,

            z2:
                z +
                0.82
        });
    }


    /* ======================================================
       26. 注册系统
       ====================================================== */

    farmWells.push(
        wellG
    );


    return wellG;
}


/* ==========================================================
   27. 更新单个水井
   ========================================================== */

function updateWellObject(
    well,
    dt,
    time
) {

    const s =
        well.userData.well;


    if (!s) {
        return;
    }


    /* ======================================================
       目标状态
       ====================================================== */

    const target =
        s.down
            ? 1
            : 0;


    /* ======================================================
       弹簧
       完全沿用原项目宝箱的逻辑风格：

       velocity += error * strength
       velocity *= damping
       progress += velocity
       ====================================================== */

    s.v +=
        (
            target -
            s.p
        ) *
        0.020;


    s.v *=
        0.90;


    s.p +=
        s.v;


    /*
       防止极小弹簧误差长期存在
    */

    if (
        Math.abs(
            target -
            s.p
        ) <
            0.0002 &&
        Math.abs(
            s.v
        ) <
            0.0002
    ) {

        s.p =
            target;

        s.v =
            0;
    }


    /* ======================================================
       28. 桶位置
       ====================================================== */

    const bucketY =

        s.bucketTopY +

        (
            s.bucketBottomY -
            s.bucketTopY
        ) *

        s.p;


    s.bucket.position.y =
        bucketY;


    /* ======================================================
       29. 卷轴 / 摇把旋转

       p 从 0 → 1 时旋转 5 圈。
       再升上来时自然反向旋转。
       ====================================================== */

    const turns =
        Math.PI *
        2 *
        5;


    s.axle.rotation.x =
        turns *
        s.p;


    s.crank.rotation.x =
        turns *
        s.p;


    /* ======================================================
       30. 绳索长度
       ====================================================== */

    const ropeAttr =
        s.ropeGeo
            .attributes
            .position;


    ropeAttr.setXYZ(

        0,

        0,

        s.axleY,

        0
    );


    ropeAttr.setXYZ(

        1,

        0,

        bucketY +
            0.34,

        0
    );


    ropeAttr.needsUpdate =
        true;


    /* ======================================================
       31. 桶到底后获得水

       第一次真正到井底，
       把 filled 设为 true。
       ====================================================== */

    if (
        s.p >
        0.93
    ) {

        s.filled =
            true;

        if (s.autoDrawing) {
            s.down = false;
        }
    }


    /* ======================================================
       32. 水面显示

       在井底时不显示，
       提到接近井口以后才看到桶里的水。
       ====================================================== */

    s.water.visible =

        s.filled &&

        s.p <
        0.72;


    /* ======================================================
       33. 水面轻微波动
       ====================================================== */

    if (
        s.water.visible
    ) {

        const sc =
            1 +
            Math.sin(
                time *
                3.2
            ) *
            0.025;


        s.water.scale.set(
            sc,
            sc,
            1
        );
    }


    /* ======================================================
       34. 桶轻微摆动

       运动过程中有小幅摆动，
       静止后归零。
       ====================================================== */

    const motion =
        Math.min(
            Math.abs(
                s.v
            ) *
                18,

            1
        );


    s.bucket.rotation.z =
        Math.sin(
            time *
                4.5
        ) *
        0.035 *
        motion;


    s.bucket.rotation.x =
        Math.sin(
            time *
                3.7 +
                1.2
        ) *
        0.025 *
        motion;


    /* ======================================================
       35. 更新交互提示
       ====================================================== */

    if (s.autoDrawing && s.filled && !s.down && s.p < 0.05) {

        s.autoDrawing = false;

        s.filled = false;

        if (typeof window.fillWateringCan === 'function') {
            window.fillWateringCan();
        } else {
            showHintOverride('水已经打上来了');
        }
    }

    if (
        s.down
    ) {

        well.userData.aimLabel =
            s.autoDrawing
                ? '正在打水'
                : '提起水桶';

    } else {

        well.userData.aimLabel =
            s.autoDrawing
                ? '正在打水'
                : '打水';
    }

    if (s.interactEntry) {
        s.interactEntry.label = well.userData.aimLabel;
    }
}


/* ==========================================================
   36. 更新所有水井
   ========================================================== */

function updateWells(
    dt,
    time
) {

    for (
        const well
        of farmWells
    ) {

        updateWellObject(
            well,
            dt,
            time
        );
    }
}


/* ==========================================================
   37. 创建水井

   你可以修改这里的位置：

   x = -9
   z = -7
   ========================================================== */

const farmWell =
    buildWell(
        8,
        6,
        0
    );


/* ==========================================================
   END OF 15-well.js
   ========================================================== */
