/* ==========================================================
   SECOND CABIN
   使用原项目 logWall / logGable / squareWindow /
   registerHinge / box / log / put
   ========================================================== */

function buildSecondCabin(cx = 10, cz = 0) {

    const houseG = new THREE.Group();
    houseG.position.set(cx, 0, cz);
    scene.add(houseG);


    /* ======================================================
       1. 第二栋房子的尺寸
       ====================================================== */

    const HALF_W = 3.2;      // x 方向半宽
    const HALF_D = 3.0;      // z 方向半深

    const SECOND_WALL_TOP = 3.65;
    const SECOND_RIDGE_Y = 5.25;

    const SECOND_LOG_R = LOG_R;
    const SECOND_LOG_GAP = LOG_GAP;


    /* ======================================================
       2. 门窗洞口
       注意：坐标是 houseG 内部局部坐标
       ====================================================== */

    const DOOR2 = {
        c: 0,
        hw: 0.72,
        y0: 0,
        y1: 2.20
    };

    const WIN2_L = {
        c: -1.95,
        hw: 0.50,
        y0: 1.05,
        y1: 2.00
    };

    const WIN2_R = {
        c: 1.95,
        hw: 0.50,
        y0: 1.05,
        y1: 2.00
    };

    const WIN2_SIDE = {
        c: 0,
        hw: 0.52,
        y0: 1.05,
        y1: 2.00
    };


    /* ======================================================
       3. 自己包一层 logWall
       因为原项目 logWall 使用全局 WALL_TOP / D_HALF，
       第二栋房子尺寸不同，所以这里做局部版本
       ====================================================== */

    function secondLogWall(
        along,
        fixed,
        halfLen,
        openings,
        cornerExt = 0
    ) {

        const g = new THREE.Group();

        const nLogs =
            Math.floor(
                SECOND_WALL_TOP /
                SECOND_LOG_GAP
            );

        for (
            let i = 0;
            i <= nLogs;
            i++
        ) {

            const y =
                SECOND_LOG_R +
                i * SECOND_LOG_GAP;

            if (
                y > SECOND_WALL_TOP
            ) {
                break;
            }

            let segs = [
                [
                    -halfLen - cornerExt,
                    halfLen + cornerExt
                ]
            ];


            for (
                const op of openings
            ) {

                if (
                    y > op.y0 &&
                    y < op.y1
                ) {

                    const next = [];

                    for (
                        const [a, b] of segs
                    ) {

                        const lo =
                            op.c - op.hw;

                        const hi =
                            op.c + op.hw;


                        if (
                            hi <= a ||
                            lo >= b
                        ) {

                            next.push(
                                [a, b]
                            );

                            continue;
                        }


                        if (
                            lo > a
                        ) {
                            next.push(
                                [a, lo]
                            );
                        }

                        if (
                            hi < b
                        ) {
                            next.push(
                                [hi, b]
                            );
                        }
                    }

                    segs = next;
                }
            }


            for (
                const [a, b] of segs
            ) {

                if (
                    b - a < 0.15
                ) {
                    continue;
                }

                const L =
                    log(b - a);


                if (
                    along === 'x'
                ) {

                    L.rotation.z =
                        Math.PI / 2;

                    L.position.set(
                        (a + b) / 2,
                        y,
                        fixed
                    );

                } else {

                    L.rotation.x =
                        Math.PI / 2;

                    L.position.set(
                        fixed,
                        y,
                        (a + b) / 2
                    );
                }


                g.add(L);
            }
        }

        houseG.add(g);

        return g;
    }


    /* ======================================================
       4. 四面墙
       正面 +z
       ====================================================== */

    secondLogWall(
        'x',
        HALF_D,
        HALF_W,
        [
            DOOR2,
            WIN2_L,
            WIN2_R
        ],
        0.16
    );

    secondLogWall(
        'x',
        -HALF_D,
        HALF_W,
        [],
        0.16
    );

    secondLogWall(
        'z',
        -HALF_W,
        HALF_D,
        [
            WIN2_SIDE
        ],
        0.16
    );

    secondLogWall(
        'z',
        HALF_W,
        HALF_D,
        [
            WIN2_SIDE
        ],
        0.16
    );


    /* ======================================================
       5. 山墙
       ====================================================== */

    function secondGable(
        z,
        openings = []
    ) {

        const g =
            new THREE.Group();

        let y =
            SECOND_WALL_TOP +
            SECOND_LOG_R;


        while (true) {

            const halfW =
                HALF_W *
                (
                    SECOND_RIDGE_Y - y
                ) /
                (
                    SECOND_RIDGE_Y -
                    SECOND_WALL_TOP
                );


            if (
                halfW < 0.28
            ) {
                break;
            }


            let segs = [
                [
                    -halfW,
                    halfW
                ]
            ];


            for (
                const op of openings
            ) {

                if (
                    y > op.y0 &&
                    y < op.y1
                ) {

                    const next = [];

                    for (
                        const [a, b]
                        of segs
                    ) {

                        const lo =
                            op.c - op.hw;

                        const hi =
                            op.c + op.hw;


                        if (
                            hi <= a ||
                            lo >= b
                        ) {

                            next.push(
                                [a, b]
                            );

                            continue;
                        }


                        if (
                            lo > a
                        ) {
                            next.push(
                                [a, lo]
                            );
                        }

                        if (
                            hi < b
                        ) {
                            next.push(
                                [hi, b]
                            );
                        }
                    }

                    segs = next;
                }
            }


            for (
                const [a, b]
                of segs
            ) {

                if (
                    b - a < 0.15
                ) {
                    continue;
                }

                const L =
                    log(b - a);

                L.rotation.z =
                    Math.PI / 2;

                L.position.set(
                    (a + b) / 2,
                    y,
                    z
                );

                g.add(L);
            }


            y +=
                SECOND_LOG_GAP;
        }


        houseG.add(g);

        return g;
    }


    secondGable(
        HALF_D
    );

    secondGable(
        -HALF_D
    );


    /* ======================================================
       6. 屋顶
       ====================================================== */

    const eaveY =
        SECOND_WALL_TOP +
        0.02;

    const eaveX =
        HALF_W +
        0.35;

    const roofDepth =
        HALF_D * 2 +
        0.65;


    const roofAng =
        Math.atan2(
            SECOND_RIDGE_Y -
            eaveY,

            eaveX
        );


    const slopeLen =
        Math.hypot(
            eaveX,
            SECOND_RIDGE_Y -
            eaveY
        );


    /* 左坡 */

    put(
        box(
            slopeLen,
            0.08,
            roofDepth
        ),

        -eaveX / 2,

        (
            eaveY +
            SECOND_RIDGE_Y
        ) / 2,

        0,

        0,
        0,
        roofAng,

        houseG
    );


    /* 右坡 */

    put(
        box(
            slopeLen,
            0.08,
            roofDepth
        ),

        eaveX / 2,

        (
            eaveY +
            SECOND_RIDGE_Y
        ) / 2,

        0,

        0,
        0,
        -roofAng,

        houseG
    );


    /* ======================================================
       7. 屋脊
       ====================================================== */

    put(
        log(
            roofDepth,
            0.10
        ),

        0,
        SECOND_RIDGE_Y,
        0,

        Math.PI / 2,
        0,
        0,

        houseG
    );


    /* ======================================================
       8. 檐口装饰梁
       ====================================================== */

    for (
        const z of [
            HALF_D + 0.18,
            -HALF_D - 0.18
        ]
    ) {

        put(
            box(
                slopeLen - 0.12,
                0.05,
                0.32
            ),

            -eaveX / 2,

            (
                eaveY +
                SECOND_RIDGE_Y
            ) / 2 -
            0.03,

            z,

            0,
            0,
            roofAng,

            houseG
        );


        put(
            box(
                slopeLen - 0.12,
                0.05,
                0.32
            ),

            eaveX / 2,

            (
                eaveY +
                SECOND_RIDGE_Y
            ) / 2 -
            0.03,

            z,

            0,
            0,
            -roofAng,

            houseG
        );
    }


    /* ======================================================
       9. 正面窗户
       squareWindow 可以直接复用
       ====================================================== */

    squareWindow(
        WIN2_L.c,
        1.52,
        HALF_D + 0.03,
        '+z',
        0.86,
        0.82,
        WIN2_L.hw,
        houseG
    );


    squareWindow(
        WIN2_R.c,
        1.52,
        HALF_D + 0.03,
        '+z',
        0.86,
        0.82,
        WIN2_R.hw,
        houseG
    );


    /* ======================================================
       10. 左右侧窗
       ====================================================== */

    squareWindow(
        -HALF_W - 0.03,
        1.52,
        0,
        '-x',
        0.86,
        0.82,
        WIN2_SIDE.hw,
        houseG
    );


    squareWindow(
        HALF_W + 0.03,
        1.52,
        0,
        '+x',
        0.86,
        0.82,
        WIN2_SIDE.hw,
        houseG
    );


    /* ======================================================
       11. 门框
       ====================================================== */

    put(
        log(
            2.25,
            0.10
        ),
        -0.82,
        1.10,
        HALF_D + 0.02,
        0, 0, 0,
        houseG
    );


    put(
        log(
            2.25,
            0.10
        ),
        0.82,
        1.10,
        HALF_D + 0.02,
        0, 0, 0,
        houseG
    );


    put(
        box(
            1.72,
            0.10,
            0.24
        ),
        0,
        2.16,
        HALF_D + 0.08,
        0, 0, 0,
        houseG
    );


    /* ======================================================
       12. 可开门
       结构沿用原项目
       ====================================================== */

    const doorG =
        new THREE.Group();

    doorG.userData = {
        base: 0,
        delta: 1.9
    };


    const doorShape =
        new THREE.Shape();

    doorShape.moveTo(
        -0.67,
        0
    );

    doorShape.lineTo(
        -0.67,
        1.50
    );

    doorShape.absarc(
        0,
        1.50,
        0.67,
        Math.PI,
        0,
        true
    );

    doorShape.lineTo(
        0.67,
        0
    );

    doorShape.lineTo(
        -0.67,
        0
    );


    const doorGeo =
        new THREE.ExtrudeGeometry(
            doorShape,
            {
                depth: 0.065,
                bevelEnabled: false
            }
        );

    doorGeo.translate(
        0.67,
        0,
        0
    );


    put(
        edge(
            doorGeo
        ),
        0, 0, 0,
        0, 0, 0,
        doorG
    );
    /* 门板竖线 */
    for (
        const px of [
            0.25,
            0.50,
            0.75,
            1.00
        ]
    ) {
        put(
            line([
                [
                    px,
                    0.06,
                    0.085
                ],
                [
                    px,
                    1.50,
                    0.085
                ]
            ]),
            0, 0, 0,
            0, 0, 0,
            doorG
        );
    }
    /* 门把手 */
    put(
        edge(
            new THREE.TorusGeometry(
                0.065,
                0.018,
                6,
                16
            )
        ),
        1.10,
        0.95,
        0.095,
        0,
        0,
        0,
        doorG
    );
    doorG.position.set(
        -0.67,
        0,
        HALF_D - 0.04
    );
    houseG.add(
        doorG
    );
    registerHinge(
        doorG
    );
    doorG.userData.aimLabel =
        '打开 / 关闭小屋';
    /* ======================================================
       13. 门前台阶
       ====================================================== */
    put(
        box(
            1.9,
            0.12,
            0.75
        ),
        0,
        0.06,
        HALF_D + 0.42,
        0, 0, 0,

        houseG
    );
    /* ======================================================
       14. 小招牌
       ====================================================== */
    const signG =
        new THREE.Group();
    put(
        box(
            1.15,
            0.42,
            0.06
        ),
        0,
        0,
        0,
        0, 0, 0,
        signG
    );
    signG.position.set(
        0,
        2.85,
        HALF_D + 0.08
    );
    houseG.add(
        signG
    );
    return {
        group: houseG,
        door: doorG
    };
}
/* ==========================================================
   创建第二栋房子
   ========================================================== */

const secondCabin =
    buildSecondCabin(
        10,
        -10
    );