'use strict';

/* ==========================================================
   14-store.js
   SECOND CABIN / STORE

   依赖原项目已有：
   THREE
   scene
   LOG_R
   LOG_GAP

   log()
   box()
   edge()
   line()
   put()
   squareWindow()
   registerHinge()
   regMagic()

   solidBoxes
   platformBoxes
   player
   ========================================================== */


/* ==========================================================
   0. 商店运行状态
   ========================================================== */

const storeSolidBoxes = [];
const storePlatformBoxes = [];
const storeSeats = [];
const storeOpenableBoxes = [];

let storeSitting = false;
let currentStoreSeat = null;
let activeStoreSeedChest = null;
let storeSelectedCropIndex = 0;

const STORE_SEED_PRICE =
    15;

function storeCropOrder() {
    return (typeof CROP_ORDER !== 'undefined' && CROP_ORDER.length) ? CROP_ORDER : ['turnip'];
}

function storeSelectedCrop() {
    const order = storeCropOrder();
    storeSelectedCropIndex = ((storeSelectedCropIndex % order.length) + order.length) % order.length;
    return order[storeSelectedCropIndex];
}

function storeChestHintText() {
    const cropId = storeSelectedCrop();
    const crop = (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[cropId]) ? CROP_TYPES[cropId] : null;
    if (!crop) return '货箱打开了：按 <b>B</b> 购买种子';
    return '货箱打开了：当前选购 <b>' + crop.name + '种子</b>（' + crop.seedPrice + ' 金币）· 按 <b>B</b> 购买 · 按 <b>C</b> 切换作物';
}

function cycleStoreCrop() {
    if (!activeStoreSeedChest || !isStoreChestBuyable(activeStoreSeedChest)) return;
    storeSelectedCropIndex++;
    showHintOverride(storeChestHintText());
    SND.play('ui');
}


/* ==========================================================
   0.5 商店货箱外观
   ========================================================== */

function makeStoreMaterial(hex) {

    if (
        typeof LITMAT === 'function'
    ) {
        return LITMAT(
            hex,
            {
                side:
                    THREE.DoubleSide
            }
        );
    }


    return new THREE.MeshBasicMaterial({
        color:
            hex,

        side:
            THREE.DoubleSide
    });
}


const STORE_BOX_WOOD_MAT =
    makeStoreMaterial(
        0x8a6a4a
    );


const STORE_BOX_DARK_MAT =
    makeStoreMaterial(
        0x6b4e35
    );


function storeSolidBox(
    w,
    h,
    d,
    mat = STORE_BOX_WOOD_MAT
) {

    const geo =
        new THREE.BoxGeometry(
            w,
            h,
            d
        );


    const g =
        new THREE.Group();


    g.add(
        new THREE.Mesh(
            geo,
            mat
        )
    );


    g.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(
                geo,
                1
            ),
            MAT
        )
    );


    return g;
}


function isTypingInStoreField() {

    const el =
        document.activeElement;


    if (
        !el
    ) {
        return false;
    }


    return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable
    );
}


function isStoreChestBuyable(chest) {

    if (
        !chest ||
        !chest.userData ||
        !chest.userData.storeBox ||
        !chest.userData.storeBox.open ||
        typeof player === 'undefined'
    ) {
        return false;
    }


    const p =
        new THREE.Vector3();


    chest.getWorldPosition(
        p
    );


    return Math.hypot(
        player.pos.x -
        p.x,
        player.pos.z -
        p.z
    ) <
        1.45;
}


function buySeedFromActiveStoreChest() {

    if (
        !isStoreChestBuyable(
            activeStoreSeedChest
        )
    ) {
        return false;
    }


    if (
        typeof window.buySeed !== 'function'
    ) {
        showHintOverride('背包系统还没有准备好，请稍等一下再购买');
        return true;
    }


    if (
        window.buySeed(
            storeSelectedCrop(),
            1
        )
    ) {
        SND.play('chim');
    } else {
        SND.play('toggle');
    }


    return true;
}


/* ==========================================================
   1. 碰撞辅助
   直接接入原项目 solidBoxes / platformBoxes
   ========================================================== */

function addStoreSolidBox(
    x1,
    z1,
    x2,
    z2
) {

    const b = {
        x1,
        z1,
        x2,
        z2
    };

    storeSolidBoxes.push(b);

    if (
        typeof solidBoxes !== 'undefined'
    ) {
        solidBoxes.push(b);
    }

    return b;
}


function addStorePlatformBox(
    x1,
    z1,
    x2,
    z2,
    top,
    bot = 0
) {

    const b = {
        x1,
        z1,
        x2,
        z2,
        top,
        bot
    };

    storePlatformBoxes.push(b);

    if (
        typeof platformBoxes !== 'undefined'
    ) {
        platformBoxes.push(b);
    }

    return b;
}


/* ==========================================================
   2. 坐下
   ========================================================== */

function sitOnStoreChair(chair) {

    if (
        typeof player === 'undefined'
    ) {
        return;
    }


    /*
       再点击当前椅子：
       站起来
    */

    if (
        storeSitting &&
        currentStoreSeat === chair
    ) {

        standFromStoreChair();

        return;
    }


    /*
       如果已经坐在另一把椅子，
       先退出
    */

    if (
        storeSitting
    ) {

        standFromStoreChair();
    }


    const p =
        chair.userData
            .seatPosition
            .clone();


    chair.localToWorld(p);


    player.pos.set(
        p.x,
        p.y,
        p.z
    );


    player.vy = 0;

    player.onGround = true;


    storeSitting = true;

    currentStoreSeat =
        chair;


    chair.userData.occupied =
        true;
}


/* ==========================================================
   3. 站起
   ========================================================== */

function standFromStoreChair() {

    if (
        !storeSitting ||
        !currentStoreSeat ||
        typeof player === 'undefined'
    ) {
        return;
    }


    const chair =
        currentStoreSeat;


    /*
       椅子局部 +Z 方向站起来
    */

    const p =
        new THREE.Vector3(
            0,
            0,
            0.65
        );


    chair.localToWorld(p);


    player.pos.set(
        p.x,
        0,
        p.z
    );


    player.vy = 0;

    player.onGround = true;


    chair.userData.occupied =
        false;


    storeSitting = false;

    currentStoreSeat =
        null;
}


/* ==========================================================
   4. SECOND CABIN
   ========================================================== */

function buildSecondCabin(
    cx = 10,
    cz = -10
) {

    const houseG =
        new THREE.Group();


    houseG.position.set(
        cx,
        0,
        cz
    );


    scene.add(
        houseG
    );


    /* ======================================================
       5. 房屋尺寸
       ====================================================== */

    const HALF_W =
        3.2;

    const HALF_D =
        3.0;


    const SECOND_WALL_TOP =
        3.65;

    const SECOND_RIDGE_Y =
        5.25;


    const SECOND_LOG_R =
        LOG_R;

    const SECOND_LOG_GAP =
        LOG_GAP;


    /* ======================================================
       6. 门窗洞口
       ====================================================== */

    const DOOR2 = {

        c:
            0,

        hw:
            0.72,

        y0:
            0,

        y1:
            2.20
    };


    const WIN2_L = {

        c:
            -1.95,

        hw:
            0.50,

        y0:
            1.05,

        y1:
            2.00
    };


    const WIN2_R = {

        c:
            1.95,

        hw:
            0.50,

        y0:
            1.05,

        y1:
            2.00
    };


    const WIN2_SIDE = {

        c:
            0,

        hw:
            0.52,

        y0:
            1.05,

        y1:
            2.00
    };


    /* ======================================================
       7. 第二栋房子的木墙
       算法沿用原项目 logWall
       ====================================================== */

    function secondLogWall(
        along,
        fixed,
        halfLen,
        openings,
        cornerExt = 0,
        parent = houseG
    ) {

        const g =
            new THREE.Group();


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
                i *
                SECOND_LOG_GAP;


            if (
                y >
                SECOND_WALL_TOP
            ) {
                break;
            }


            let segs = [

                [
                    -halfLen -
                    cornerExt,

                    halfLen +
                    cornerExt
                ]

            ];


            for (
                const op of openings
            ) {

                if (
                    y > op.y0 &&
                    y < op.y1
                ) {

                    const next =
                        [];


                    for (
                        const [a, b]
                        of segs
                    ) {

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


                    segs =
                        next;
                }
            }


            for (
                const [a, b]
                of segs
            ) {

                if (
                    b - a <
                    0.15
                ) {
                    continue;
                }


                const L =
                    log(
                        b - a
                    );


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


                g.add(
                    L
                );
            }
        }


        parent.add(
            g
        );


        return g;
    }


    /* ======================================================
       8. 部分墙体可视化

       类似原项目 fullHouseGroup：
       正面 + 左侧保留
       后墙 + 右侧放入可隐藏组
       ====================================================== */

    const secondFullHouseGroup =
        new THREE.Group();


    secondFullHouseGroup.visible =
        false;


    houseG.add(
        secondFullHouseGroup
    );


    /* ---------- 正面 ---------- */

    secondLogWall(
        'x',
        HALF_D,
        HALF_W,

        [
            DOOR2,
            WIN2_L,
            WIN2_R
        ],

        0.16,

        houseG
    );


    /* ---------- 左墙 ---------- */

    secondLogWall(
        'z',
        -HALF_W,
        HALF_D,

        [
            WIN2_SIDE
        ],

        0.16,

        houseG
    );


    /* ---------- 后墙 ---------- */

    secondLogWall(
        'x',
        -HALF_D,
        HALF_W,

        [],

        0.16,

        secondFullHouseGroup
    );


    /* ---------- 右墙 ---------- */

    secondLogWall(
        'z',
        HALF_W,
        HALF_D,

        [
            WIN2_SIDE
        ],

        0.16,

        secondFullHouseGroup
    );


    /* ======================================================
       9. 山墙
       ====================================================== */

    function secondGable(
        z,
        openings = [],
        parent = houseG
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
                    SECOND_RIDGE_Y -
                    y
                )

                /

                (
                    SECOND_RIDGE_Y -
                    SECOND_WALL_TOP
                );


            if (
                halfW <
                0.28
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

                    const next =
                        [];


                    for (
                        const [a, b]
                        of segs
                    ) {

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


                    segs =
                        next;
                }
            }


            for (
                const [a, b]
                of segs
            ) {

                if (
                    b - a <
                    0.15
                ) {
                    continue;
                }


                const L =
                    log(
                        b - a
                    );


                L.rotation.z =
                    Math.PI / 2;


                L.position.set(
                    (a + b) / 2,
                    y,
                    z
                );


                g.add(
                    L
                );
            }


            y +=
                SECOND_LOG_GAP;
        }


        parent.add(
            g
        );


        return g;
    }


    secondGable(
        HALF_D,
        [],
        houseG
    );


    secondGable(
        -HALF_D,
        [],
        secondFullHouseGroup
    );


    /* ======================================================
       10. 屋顶
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


    /* ---------- 左坡 ---------- */

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


    /* ---------- 右坡 ---------- */

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

        secondFullHouseGroup
    );


    /* ======================================================
       11. 屋顶木梁
       ====================================================== */

    for (
        let t = 0.18;
        t < 0.95;
        t += 0.18
    ) {

        const px =

            -eaveX +
            t *
            eaveX;


        const py =

            eaveY +

            t *

            (
                SECOND_RIDGE_Y -
                eaveY
            )

            +

            0.10;


        put(

            log(
                roofDepth,
                0.065
            ),

            px,
            py,
            0,

            Math.PI / 2,
            0,
            0,

            houseG
        );
    }


    /* ======================================================
       12. 屋脊
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
       13. 檐口
       ====================================================== */

    for (
        const z of [

            HALF_D +
            0.18,

            -HALF_D -
            0.18
        ]
    ) {

        put(

            box(
                slopeLen -
                0.12,

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
    }


    /* ======================================================
       14. 窗户
       ====================================================== */

    squareWindow(

        WIN2_L.c,

        1.52,

        HALF_D +
        0.03,

        '+z',

        0.86,

        0.82,

        WIN2_L.hw,

        houseG
    );


    squareWindow(

        WIN2_R.c,

        1.52,

        HALF_D +
        0.03,

        '+z',

        0.86,

        0.82,

        WIN2_R.hw,

        houseG
    );


    squareWindow(

        -HALF_W -
        0.03,

        1.52,

        0,

        '-x',

        0.86,

        0.82,

        WIN2_SIDE.hw,

        houseG
    );


    squareWindow(

        HALF_W +
        0.03,

        1.52,

        0,

        '+x',

        0.86,

        0.82,

        WIN2_SIDE.hw,

        secondFullHouseGroup
    );


    /* ======================================================
       15. 门框
       ====================================================== */

    put(

        log(
            2.25,
            0.10
        ),

        -0.82,

        1.10,

        HALF_D +
        0.02,

        0,
        0,
        0,

        houseG
    );


    put(

        log(
            2.25,
            0.10
        ),

        0.82,

        1.10,

        HALF_D +
        0.02,

        0,
        0,
        0,

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

        HALF_D +
        0.08,

        0,
        0,
        0,

        houseG
    );


    /* ======================================================
       16. 门
       ====================================================== */

    const doorG =
        new THREE.Group();


    doorG.userData = {

        base:
            0,

        delta:
            1.9
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
                depth:
                    0.065,

                bevelEnabled:
                    false
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

        0,
        0,
        0,

        0,
        0,
        0,

        doorG
    );


    /* ---------- 门板 ---------- */

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

            0,
            0,
            0,

            0,
            0,
            0,

            doorG
        );
    }


    /* ---------- 门把手 ---------- */

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

        HALF_D -
        0.04
    );


    houseG.add(
        doorG
    );


    registerHinge(
        doorG
    );


    doorG.userData.aimLabel =
        '打开 / 关闭商店';


    /* ======================================================
       17. 门前台阶
       ====================================================== */

    put(

        box(
            1.9,
            0.12,
            0.75
        ),

        0,

        0.06,

        HALF_D +
        0.42,

        0,
        0,
        0,

        houseG
    );


    /* ======================================================
       18. 商店牌子
       ====================================================== */

    const storeSign =
        new THREE.Group();


    /* ---------- 两根吊绳 ---------- */

    put(

        line([

            [
                -0.42,
                0.35,
                0
            ],

            [
                -0.42,
                0.62,
                0
            ]

        ]),

        0,
        0,
        0,

        0,
        0,
        0,

        storeSign
    );


    put(

        line([

            [
                0.42,
                0.35,
                0
            ],

            [
                0.42,
                0.62,
                0
            ]

        ]),

        0,
        0,
        0,

        0,
        0,
        0,

        storeSign
    );


    /* ---------- 木牌 ---------- */

    put(

        box(
            1.35,
            0.52,
            0.07
        ),

        0,
        0,
        0,

        0,
        0,
        0,

        storeSign
    );


    /* ---------- 木牌内框 ---------- */

    put(

        line([

            [
                -0.57,
                -0.17,
                0.041
            ],

            [
                0.57,
                -0.17,
                0.041
            ],

            [
                0.57,
                0.17,
                0.041
            ],

            [
                -0.57,
                0.17,
                0.041
            ],

            [
                -0.57,
                -0.17,
                0.041
            ]

        ]),

        0,
        0,
        0,

        0,
        0,
        0,

        storeSign
    );


    storeSign.position.set(

        0,

        2.85,

        HALF_D +
        0.11
    );


    houseG.add(
        storeSign
    );


    /* ======================================================
       19. 屋顶吊灯
       ====================================================== */

    const storeLamp =
        new THREE.Group();


    storeLamp.position.set(

        0,

        SECOND_RIDGE_Y -
        0.18,

        0
    );


    houseG.add(
        storeLamp
    );


    /* ---------- 吊线 ---------- */

    put(

        line([

            [
                0,
                0,
                0
            ],

            [
                0,
                -0.38,
                0
            ]

        ]),

        0,
        0,
        0,

        0,
        0,
        0,

        storeLamp
    );


    const lampBody =
        new THREE.Group();


    lampBody.position.y =
        -0.55;


    storeLamp.add(
        lampBody
    );


    /* ---------- 顶盖 ---------- */

    put(

        edge(

            new THREE.ConeGeometry(

                0.14,

                0.10,

                4
            )
        ),

        0,

        0.17,

        0,

        0,
        0,
        0,

        lampBody
    );


    /* ---------- 灯罩 ---------- */

    put(

        box(
            0.23,
            0.30,
            0.23
        ),

        0,

        0,

        0,

        0,
        0,
        0,

        lampBody
    );


    /* ---------- 四根灯架 ---------- */

    for (
        const [x, z]
        of [

            [-0.11, -0.11],

            [0.11, -0.11],

            [-0.11, 0.11],

            [0.11, 0.11]
        ]
    ) {

        put(

            line([

                [
                    x,
                    -0.13,
                    z
                ],

                [
                    x,
                    0.13,
                    z
                ]

            ]),

            0,
            0,
            0,

            0,
            0,
            0,

            lampBody
        );
    }


    /* ---------- 灯光 ---------- */

    const storeLight =
        new THREE.PointLight(

            0xffd7a0,

            1.1,

            7,

            2
        );


    lampBody.add(
        storeLight
    );


    /* ---------- 光晕 ---------- */

    const haloMat =
        new THREE.MeshBasicMaterial({

            color:
                0xffd88f,

            transparent:
                true,

            opacity:
                0.14,

            depthWrite:
                false
        });


    const halo =
        new THREE.Mesh(

            new THREE.SphereGeometry(

                0.18,

                12,

                8
            ),

            haloMat
        );


    halo.userData.noHit =
        true;


    lampBody.add(
        halo
    );


    let storeLampOn =
        true;


    storeLamp.userData.aimLabel =
        '打开 / 关闭商店灯';


    regMagic(

        storeLamp,

        () => {

            storeLampOn =
                !storeLampOn;


            storeLight.intensity =

                storeLampOn

                    ? 1.1

                    : 0;


            halo.visible =
                storeLampOn;
        }
    );


    /* ======================================================
       20. 货架
       ====================================================== */

    function makeStoreShelf(
        x,
        z,
        ry = 0
    ) {

        const g =
            new THREE.Group();


        const W =
            1.35;


        const H =
            1.85;


        const D =
            0.34;


        /* ---------- 左板 ---------- */

        put(

            box(
                0.05,
                H,
                D
            ),

            -W / 2,

            H / 2,

            0,

            0,
            0,
            0,

            g
        );


        /* ---------- 右板 ---------- */

        put(

            box(
                0.05,
                H,
                D
            ),

            W / 2,

            H / 2,

            0,

            0,
            0,
            0,

            g
        );


        /* ---------- 背板 ---------- */

        put(

            box(
                W,
                H,
                0.025
            ),

            0,

            H / 2,

            -D / 2,

            0,
            0,
            0,

            g
        );


        /* ---------- 层板 ---------- */

        for (
            const y of [

                0.18,

                0.72,

                1.26,

                1.80
            ]
        ) {

            put(

                box(
                    W,
                    0.05,
                    D
                ),

                0,

                y,

                0,

                0,
                0,
                0,

                g
            );
        }


        /* ==================================================
           商品
           ================================================== */

        makeOpenableStoreBox(g, -0.38, 0.20, 0.04);
        makeOpenableStoreBox(g, 0.12, 0.74, 0.04, 0.26, 0.22, 0.20);
        makeOpenableStoreBox(g, 0.42, 1.28, 0.04, 0.28, 0.22, 0.21);


        g.position.set(
            x,
            0,
            z
        );


        g.rotation.y =
            ry;


        houseG.add(
            g
        );


        return g;
    }

/* ======================================================
   可打开货箱
   结构直接参考原项目 12.9c 宝箱
   ====================================================== */

function makeOpenableStoreBox(
    parent,
    x,
    y,
    z,
    w = 0.30,
    h = 0.25,
    d = 0.22
) {

    const chest =
        new THREE.Group();

    chest.position.set(
        x,
        y,
        z
    );

    parent.add(
        chest
    );


    /* ==================================================
       箱体
       ================================================== */

    put(
        storeSolidBox(
            w,
            h,
            d,
            STORE_BOX_WOOD_MAT
        ),

        0,
        h / 2,
        0,

        0,
        0,
        0,

        chest
    );


    /* ==================================================
       箱盖

       pivot 放在后沿：
       z = -d / 2

       实际盖板再向前偏 d/2
       ================================================== */

    const lid =
        new THREE.Group();

    lid.position.set(
        0,
        h,
        -d / 2
    );

    chest.add(
        lid
    );


    put(
        storeSolidBox(
            w,
            0.035,
            d,
            STORE_BOX_DARK_MAT
        ),

        0,
        0.0175,
        d / 2,

        0,
        0,
        0,

        lid
    );


    /* ==================================================
       箱体装饰线
       沿用原宝箱的两条纵线思路
       ================================================== */

    put(
        line([
            [
                -w / 2 -
                0.01,

                h * 0.78,

                d / 2
            ],
            [
                w / 2 +
                0.01,

                h * 0.78,

                d / 2
            ]
        ]),

        0, 0, 0,
        0, 0, 0,

        chest
    );


    put(
        line([
            [
                -w * 0.18,

                h * 0.48,

                d / 2
            ],
            [
                w * 0.18,

                h * 0.48,

                d / 2
            ]
        ]),

        0, 0, 0,
        0, 0, 0,

        chest
    );


    /* ==================================================
       开关状态
       ================================================== */

    const gem =
        edge(
            new THREE.OctahedronGeometry(
                Math.min(
                    w,
                    h,
                    d
                ) *
                0.13
            ),
            1,
            new THREE.LineBasicMaterial({
                color:
                    0x2e8b57
            })
        );


    put(
        gem,
        0,
        h +
        0.035,
        0,
        0,
        0,
        0,
        chest
    );


    gem.visible =
        false;


    gem.userData.baseY =
        h +
        0.035;


    chest.userData.storeBox = {

        open:
            false,

        p:
            0,

        v:
            0,

        lid:
            lid,

        gem:
            gem
    };


    chest.userData.aimLabel =
        '打开 / 关闭货箱';


    regMagic(
        chest,
        () => {

            const s =
                chest.userData
                    .storeBox;

            s.open =
                !s.open;

            if (
                s.open
            ) {
                activeStoreSeedChest =
                    chest;

                showHintOverride(storeChestHintText());
            } else if (
                activeStoreSeedChest === chest
            ) {
                activeStoreSeedChest =
                    null;
            }
        }
    );


    /*
       放进统一动画数组
    */

    storeOpenableBoxes.push(
        chest
    );


    return chest;
}


    /* ---------- 后墙两个货架 ---------- */

    const shelf1 =
        makeStoreShelf(

            -1.55,

            -2.62
        );


    const shelf2 =
        makeStoreShelf(

            0.05,

            -2.62
        );


    /* ======================================================
       21. 长桌
       ====================================================== */

    const storeTable =
        new THREE.Group();


    const TABLE_X =
        0.35;


    const TABLE_Z =
        0.20;


    /* ---------- 主桌板 ---------- */

    put(

        box(
            2.25,
            0.07,
            0.82
        ),

        0,

        0.75,

        0,

        0,
        0,
        0,

        storeTable
    );


    /* ---------- 下层桌板 ---------- */

    put(

        box(
            2.38,
            0.04,
            0.94
        ),

        0,

        0.69,

        0,

        0,
        0,
        0,

        storeTable
    );


    /* ---------- 桌腿 ---------- */

    for (
        const [x, z]
        of [

            [-0.98, -0.31],

            [0.98, -0.31],

            [-0.98, 0.31],

            [0.98, 0.31]
        ]
    ) {

        put(

            edge(

                new THREE.CylinderGeometry(

                    0.032,

                    0.026,

                    0.68,

                    6
                )
            ),

            x,

            0.34,

            z,

            0,
            0,
            0,

            storeTable
        );
    }


    storeTable.position.set(

        TABLE_X,

        0,

        TABLE_Z
    );


    houseG.add(
        storeTable
    );


    /* ======================================================
       22. 椅子
       ====================================================== */

    function makeStoreChair(
        x,
        z,
        ry = 0
    ) {

        const chair =
            new THREE.Group();


        /* ---------- 座面 ---------- */

        put(

            box(
                0.42,
                0.05,
                0.42
            ),

            0,

            0.45,

            0,

            0,
            0,
            0,

            chair
        );


        /* ---------- 靠背 ---------- */

        put(

            box(
                0.42,
                0.52,
                0.05
            ),

            0,

            0.73,

            -0.185,

            0,
            0,
            0,

            chair
        );


        /* ---------- 靠背横条 ---------- */

        for (
            const y of [

                0.62,

                0.90
            ]
        ) {

            put(

                box(
                    0.36,
                    0.04,
                    0.03
                ),

                0,

                y,

                -0.185,

                0,
                0,
                0,

                chair
            );
        }


        /* ---------- 四条腿 ---------- */

        for (
            const [sx, sz]
            of [

                [-1, -1],

                [1, -1],

                [-1, 1],

                [1, 1]
            ]
        ) {

            put(

                edge(

                    new THREE.CylinderGeometry(

                        0.022,

                        0.018,

                        0.44,

                        6
                    )
                ),

                sx *
                0.17,

                0.22,

                sz *
                0.17,

                0,
                0,
                0,

                chair
            );
        }


        chair.position.set(
            x,
            0,
            z
        );


        chair.rotation.y =
            ry;


        houseG.add(
            chair
        );


        /* ---------- 座位点 ---------- */

        chair.userData.seatPosition =
            new THREE.Vector3(

                0,

                0.47,

                0
            );


        chair.userData.occupied =
            false;


        chair.userData.aimLabel =
            '坐下 / 站起';


        regMagic(

            chair,

            () => {

                sitOnStoreChair(
                    chair
                );
            }
        );


        storeSeats.push(
            chair
        );


        return chair;
    }


    /* ---------- 四把椅子 ---------- */

    const chair1 =
        makeStoreChair(

            TABLE_X -
            0.72,

            TABLE_Z +
            0.82,

            Math.PI
        );


    const chair2 =
        makeStoreChair(

            TABLE_X +
            0.72,

            TABLE_Z +
            0.82,

            Math.PI
        );


    const chair3 =
        makeStoreChair(

            TABLE_X -
            0.72,

            TABLE_Z -
            0.82,

            0
        );


    const chair4 =
        makeStoreChair(

            TABLE_X +
            0.72,

            TABLE_Z -
            0.82,

            0
        );


    /* ======================================================
       23. 返回对象
       ====================================================== */

    return {

        group:
            houseG,

        door:
            doorG,

        fullHouseGroup:
            secondFullHouseGroup,

        sign:
            storeSign,

        lamp:
            storeLamp,

        shelves: [

            shelf1,

            shelf2
        ],

        table:
            storeTable,

        chairs: [

            chair1,

            chair2,

            chair3,

            chair4
        ]
    };
}


/* ==========================================================
   24. 创建商店

   世界中心：
   x = 10
   z = -10
   ========================================================== */

const STORE_CX =
    10;


const STORE_CZ =
    -10;


const secondCabin =
    buildSecondCabin(

        STORE_CX,

        STORE_CZ
    );


/* ==========================================================
   25. 商店墙体碰撞

   房屋：
   x = 10 ± 3.2
   z = -10 ± 3.0

   即：
   x = 6.8 ~ 13.2
   z = -13 ~ -7
   ========================================================== */

const STORE_HW =
    3.2;


const STORE_HD =
    3.0;


const STORE_WALL_T =
    0.18;


const STORE_DOOR_HW =
    0.72;


/* ==========================================================
   26. 后墙
   ========================================================== */

addStoreSolidBox(

    STORE_CX -
    STORE_HW,

    STORE_CZ -
    STORE_HD -
    STORE_WALL_T,

    STORE_CX +
    STORE_HW,

    STORE_CZ -
    STORE_HD +
    STORE_WALL_T
);


/* ==========================================================
   27. 左墙
   ========================================================== */

addStoreSolidBox(

    STORE_CX -
    STORE_HW -
    STORE_WALL_T,

    STORE_CZ -
    STORE_HD,

    STORE_CX -
    STORE_HW +
    STORE_WALL_T,

    STORE_CZ +
    STORE_HD
);


/* ==========================================================
   28. 右墙
   ========================================================== */

addStoreSolidBox(

    STORE_CX +
    STORE_HW -
    STORE_WALL_T,

    STORE_CZ -
    STORE_HD,

    STORE_CX +
    STORE_HW +
    STORE_WALL_T,

    STORE_CZ +
    STORE_HD
);


/* ==========================================================
   29. 前墙左半
   中间留下门洞
   ========================================================== */

addStoreSolidBox(

    STORE_CX -
    STORE_HW,

    STORE_CZ +
    STORE_HD -
    STORE_WALL_T,

    STORE_CX -
    STORE_DOOR_HW,

    STORE_CZ +
    STORE_HD +
    STORE_WALL_T
);


/* ==========================================================
   30. 前墙右半
   ========================================================== */

addStoreSolidBox(

    STORE_CX +
    STORE_DOOR_HW,

    STORE_CZ +
    STORE_HD -
    STORE_WALL_T,

    STORE_CX +
    STORE_HW,

    STORE_CZ +
    STORE_HD +
    STORE_WALL_T
);


/* ==========================================================
   31. 两个货架碰撞

   货架位于：
   local z = -2.62

   world z = -12.62
   ========================================================== */

addStorePlatformBox(

    STORE_CX -
    1.55 -
    0.70,

    STORE_CZ -
    2.62 -
    0.20,

    STORE_CX -
    1.55 +
    0.70,

    STORE_CZ -
    2.62 +
    0.20,

    1.85,

    0
);


addStorePlatformBox(

    STORE_CX +
    0.05 -
    0.70,

    STORE_CZ -
    2.62 -
    0.20,

    STORE_CX +
    0.05 +
    0.70,

    STORE_CZ -
    2.62 +
    0.20,

    1.85,

    0
);


/* ==========================================================
   32. 桌子平台

   不是 solidBox。

   使用 platformBox，
   所以史莱姆可以跳上桌面。
   ========================================================== */

const STORE_TABLE_WORLD_X =
    STORE_CX +
    0.35;


const STORE_TABLE_WORLD_Z =
    STORE_CZ +
    0.20;


addStorePlatformBox(

    STORE_TABLE_WORLD_X -
    1.18,

    STORE_TABLE_WORLD_Z -
    0.47,

    STORE_TABLE_WORLD_X +
    1.18,

    STORE_TABLE_WORLD_Z +
    0.47,

    0.78,

    0
);


/* ==========================================================
   33. 椅子平台

   让椅子也具有实体表面。
   ========================================================== */

function registerStoreChairPlatform(
    chair
) {

    const p =
        new THREE.Vector3();


    chair.getWorldPosition(
        p
    );


    addStorePlatformBox(

        p.x -
        0.23,

        p.z -
        0.23,

        p.x +
        0.23,

        p.z +
        0.23,

        0.475,

        0
    );
}


for (
    const chair
    of secondCabin.chairs
) {

    registerStoreChairPlatform(
        chair
    );
}


/* ==========================================================
   34. 商店可视化模式

   默认：
   secondFullHouseGroup.visible = false

   即隐藏：
   - 后墙
   - 右墙
   - 部分屋顶

   如果需要完整显示：
       setSecondCabinFullView(true)

   恢复切面：
       setSecondCabinFullView(false)
   ========================================================== */

function setSecondCabinFullView(
    visible
) {

    if (
        !secondCabin ||
        !secondCabin.fullHouseGroup
    ) {
        return;
    }


    secondCabin
        .fullHouseGroup
        .visible =
            !!visible;
}


/* ==========================================================
   35. 商店内部判断

   后续可以用于：
   - 进入商店后隐藏墙
   - 离开后恢复完整外观
   - BGM
   - UI
   ========================================================== */

function isPlayerInsideSecondCabin() {

    if (
        typeof player === 'undefined'
    ) {
        return false;
    }


    return (

        player.pos.x >

            STORE_CX -
            STORE_HW +

            0.15

        &&

        player.pos.x <

            STORE_CX +
            STORE_HW -

            0.15

        &&

        player.pos.z >

            STORE_CZ -
            STORE_HD +

            0.15

        &&

        player.pos.z <

            STORE_CZ +
            STORE_HD -

            0.15
    );
}


/* ==========================================================
   36. 商店每帧更新

   目前只负责：
   坐下时保持玩家位于椅子上。

   注意：
   需要在主 animate/update loop 中调用：

       updateSecondCabin(dt, time);

   ========================================================== */

function updateSecondCabin(
    dt,
    time
) {

    if (
        activeStoreSeedChest &&
        !isStoreChestBuyable(
            activeStoreSeedChest
        )
    ) {
        activeStoreSeedChest =
            null;
    }

    for (
        const chest
        of storeOpenableBoxes
    ) {

        const s =
            chest
                .userData
                .storeBox;


        if (
            !s
        ) {
            continue;
        }


        if (
            s.open &&
            !activeStoreSeedChest &&
            isStoreChestBuyable(
                chest
            )
        ) {
            activeStoreSeedChest =
                chest;
        }


        const target =
            s.open

                ? 1

                : 0;


        s.v +=
            (
                target -
                s.p
            ) *
            0.02;


        s.v *=
            0.9;


        s.p +=
            s.v;


        s.lid.rotation.x =
            -1.25 *
            s.p;


        s.gem.visible =
            s.p >
            0.3;


        if (
            s.gem.visible
        ) {
            s.gem.position.y =
                s.gem.userData.baseY +
                Math.sin(
                    time *
                    2.5
                ) *
                0.008 +
                s.p *
                0.015;

            s.gem.rotation.y =
                time *
                1.2;
        }
    }

    if (
        !storeSitting ||
        !currentStoreSeat ||
        typeof player === 'undefined'
    ) {
        return;
    }


    /*
       每帧重新取得椅子世界坐标。

       以后即使椅子本身有动画，
       玩家仍然跟随。
    */

    const p =
        currentStoreSeat
            .userData
            .seatPosition
            .clone();


    currentStoreSeat
        .localToWorld(p);


    player.pos.x =
        p.x;


    player.pos.y =
        p.y;


    player.pos.z =
        p.z;


    player.vy =
        0;


    player.onGround =
        true;
}


addEventListener('keydown', e => {
    if (
        e.code !== 'KeyB' ||
        e.repeat ||
        window.APP_SHELL_BLOCK_GAME ||
        isTypingInStoreField()
    ) {
        return;
    }


    if (
        buySeedFromActiveStoreChest()
    ) {
        e.preventDefault();
    }
});

addEventListener('keydown', e => {
    if (
        e.code !== 'KeyC' ||
        e.repeat ||
        window.APP_SHELL_BLOCK_GAME ||
        isTypingInStoreField()
    ) {
        return;
    }

    if (activeStoreSeedChest && isStoreChestBuyable(activeStoreSeedChest)) {
        cycleStoreCrop();
        e.preventDefault();
    }
});


/* ==========================================================
   END OF 14-store.js
   ========================================================== */
