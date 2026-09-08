'use strict';

/* ==========================================================
   02. HOUSE
   本文件刻意改回原项目的“木屋”语法：
   - logWall 横向圆木墙
   - 山墙
   - 斜屋顶 + 屋顶圆木梁
   - 切面展示：靠近相机的 +z 墙不画
   - 原项目式方窗
   - 原项目式吊挂木灯
   - 原项目式书架
   ========================================================== */

const HOUSE_HALF =
    4.0;

const WALL_TOP =
    4.42;

const LOG_R =
    0.15;

const LOG_GAP =
    0.27;

const RIDGE_Y =
    6.6;

const EAVE_Y =
    4.4;

const EAVE_X =
    4.4;

const ROOF_SPAN =
    9.2;

const houseG =
    new THREE.Group();

scene.add(
    houseG
);

const roomShelfBooks = [];
const roomCups = [];
const roomPlates = [];
const roomTableItems = [];
const roomChairs = [];
const roomCushions = [];
const roomRadioNotes = [];
const roomOranges = [];
let roomKotatsuOn = true;
let roomKotatsuGlowMat = null;
let roomRadioNoteRun = 0;
let roomOrangeState = 'inbowl';
let roomOrangeT = 0;

function smoothRoom(
    t
) {
    return t *
        t *
        (
            3 -
            2 *
                t
        );
}

function roomLoop(
    pts,
    parent,
    mat = MAT
) {
    return put(
        new THREE.LineLoop(
            geo(
                pts
            ),
            mat
        ),
        0,
        0,
        0,
        0,
        0,
        0,
        parent
    );
}

function roomLogBetween(
    a,
    b,
    r,
    parent,
    material = C.fill
) {
    const va =
        V(
            a[0],
            a[1],
            a[2]
        );

    const vb =
        V(
            b[0],
            b[1],
            b[2]
        );

    const mid =
        va.clone()
            .add(
                vb
            )
            .multiplyScalar(
                0.5
            );

    const dir =
        vb.clone()
            .sub(
                va
            );

    const g =
        log(
            dir.length(),
            r,
            material
        );

    g.quaternion.setFromUnitVectors(
        new THREE.Vector3(
            0,
            1,
            0
        ),
        dir.normalize()
    );

    g.position.copy(
        mid
    );

    parent.add(
        g
    );

    return g;
}


/* ==========================================================
   1. 地板
   原项目是大平面 + 地板线，这里只做房间范围
   ========================================================== */

put(
    new THREE.Mesh(
        new THREE.PlaneGeometry(
            8.6,
            8.6
        ),
        C.floor
    ),
    0,
    -0.01,
    0,
    -Math.PI / 2,
    0,
    0,
    houseG
);

for (
    let z = -3.8;
    z <= 3.8;
    z += 0.75
) {
    put(
        line([
            [-4.0, 0.012, z],
            [4.0, 0.012, z]
        ]),
        0,
        0,
        0,
        0,
        0,
        0,
        houseG
    );
}


/* ==========================================================
   2. logWall
   算法对应原项目 logWall：
   按 LOG_GAP 逐层放圆木，并根据 opening 切开
   ========================================================== */

function roomLogWall(
    along,
    fixed,
    halfLen,
    openings = [],
    cornerExt = 0
) {
    const g =
        new THREE.Group();

    const nLogs =
        Math.floor(
            WALL_TOP /
            LOG_GAP
        );

    for (
        let i = 0;
        i <= nLogs;
        i++
    ) {
        const y =
            LOG_R +
            i *
            LOG_GAP;

        if (
            y >
            WALL_TOP
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
            const op
            of openings
        ) {
            if (
                y >
                    op.y0 &&
                y <
                    op.y1
            ) {
                const next =
                    [];

                for (
                    const [
                        a,
                        b
                    ]
                    of segs
                ) {
                    const lo =
                        op.c -
                        op.hw;

                    const hi =
                        op.c +
                        op.hw;

                    if (
                        hi <=
                            a ||
                        lo >=
                            b
                    ) {
                        next.push([
                            a,
                            b
                        ]);

                        continue;
                    }

                    if (
                        lo >
                        a
                    ) {
                        next.push([
                            a,
                            lo
                        ]);
                    }

                    if (
                        hi <
                        b
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
        }

        for (
            const [
                a,
                b
            ]
            of segs
        ) {
            if (
                b -
                    a <
                0.15
            ) {
                continue;
            }

            const L =
                log(
                    b -
                        a,
                    LOG_R,
                    C.fill
                );

            if (
                along ===
                'x'
            ) {
                L.rotation.z =
                    Math.PI /
                    2;

                L.position.set(
                    (
                        a +
                        b
                    ) /
                        2,
                    y,
                    fixed
                );
            } else {
                L.rotation.x =
                    Math.PI /
                    2;

                L.position.set(
                    fixed,
                    y,
                    (
                        a +
                        b
                    ) /
                        2
                );
            }

            g.add(
                L
            );
        }
    }

    houseG.add(
        g
    );

    return g;
}


/* ==========================================================
   3. 墙体开口
   相机在 +z，保留后墙与右墙，前墙和左墙不画 => 原项目切面逻辑
   ========================================================== */

const BACK_WIN_L = {
    c: -2.15,
    hw: 0.72,
    y0: 1.05,
    y1: 2.55
};

const BACK_WIN_R = {
    c: 1.9,
    hw: 0.58,
    y0: 1.15,
    y1: 2.30
};

roomLogWall(
    'x',
    -HOUSE_HALF,
    HOUSE_HALF,
    [
        BACK_WIN_L,
        BACK_WIN_R
    ],
    0.18
);

roomLogWall(
    'z',
    HOUSE_HALF,
    HOUSE_HALF,
    [],
    0.18
);


/* ==========================================================
   4. 山墙
   ========================================================== */

function roomGable(
    z
) {
    const g =
        new THREE.Group();

    let y =
        WALL_TOP +
        LOG_R;

    while (
        true
    ) {
        const halfW =
            HOUSE_HALF *
            (
                RIDGE_Y -
                y
            ) /
            (
                RIDGE_Y -
                WALL_TOP
            );

        if (
            halfW <
            0.30
        ) {
            break;
        }

        const L =
            log(
                halfW *
                    2,
                LOG_R,
                C.fill
            );

        L.rotation.z =
            Math.PI /
            2;

        L.position.set(
            0,
            y,
            z
        );

        g.add(
            L
        );

        y +=
            LOG_GAP;
    }

    houseG.add(
        g
    );
}

roomGable(
    -HOUSE_HALF
);


/* ==========================================================
   5. 屋顶
   只画远侧斜坡 + 屋脊 + 椽条，保持室内可视
   ========================================================== */

const roofAng =
    Math.atan2(
        RIDGE_Y -
            EAVE_Y,
        EAVE_X
    );

const slopeLen =
    Math.hypot(
        EAVE_X,
        RIDGE_Y -
            EAVE_Y
    );

/* 远侧屋顶 */
put(
    box(
        slopeLen,
        0.08,
        ROOF_SPAN,
        C.fill
    ),
    -EAVE_X /
        2,
    (
        EAVE_Y +
        RIDGE_Y
    ) /
        2 +
        0.04,
    0,
    0,
    0,
    roofAng,
    houseG
);

/* 屋脊 */
put(
    log(
        ROOF_SPAN,
        0.10,
        C.fill
    ),
    0,
    RIDGE_Y +
        0.05,
    0,
    Math.PI /
        2,
    0,
    0,
    houseG
);

/* 原项目屋顶横向圆木梁 */
for (
    let t = 0.14;
    t < 0.96;
    t += 0.145
) {
    const px =
        -EAVE_X +
        t *
            EAVE_X;

    const py =
        EAVE_Y +
        t *
            (
                RIDGE_Y -
                EAVE_Y
            ) +
        0.13;

    put(
        log(
            ROOF_SPAN,
            0.09,
            C.fill
        ),
        px,
        py,
        0,
        Math.PI /
            2,
        0,
        0,
        houseG
    );
}


/* ==========================================================
   6. squareWindow
   结构对应原项目：框 + 十字 + 玻璃 + 线稿
   ========================================================== */

function backWindow(
    cx,
    cy,
    cz,
    w,
    h
) {
    const g =
        new THREE.Group();

    const t =
        0.09;

    put(
        box(
            w,
            t,
            0.12,
            C.fill
        ),
        0,
        h /
            2,
        0,
        0,
        0,
        0,
        g
    );

    put(
        box(
            w,
            t,
            0.12,
            C.fill
        ),
        0,
        -h /
            2,
        0,
        0,
        0,
        0,
        g
    );

    put(
        box(
            t,
            h,
            0.12,
            C.fill
        ),
        -w /
            2,
        0,
        0,
        0,
        0,
        0,
        g
    );

    put(
        box(
            t,
            h,
            0.12,
            C.fill
        ),
        w /
            2,
        0,
        0,
        0,
        0,
        0,
        g
    );

    put(
        box(
            w -
                2 *
                    t,
            0.05,
            0.07,
            C.fill
        ),
        0,
        0,
        0.02,
        0,
        0,
        0,
        g
    );

    put(
        box(
            0.05,
            h -
                2 *
                    t,
            0.07,
            C.fill
        ),
        0,
        0,
        0.02,
        0,
        0,
        0,
        g
    );

    const gg =
        new THREE.BoxGeometry(
            w -
                2 *
                    t,
            h -
                2 *
                    t,
            0.035
        );

    const glass =
        new THREE.Mesh(
            gg,
            C.glass
        );

    g.add(
        glass
    );

    g.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(
                gg
            ),
            MAT
        )
    );

    g.position.set(
        cx,
        cy,
        cz +
            0.03
    );

    houseG.add(
        g
    );

    return g;
}

backWindow(
    -2.15,
    1.78,
    -HOUSE_HALF,
    1.30,
    1.35
);

backWindow(
    1.90,
    1.72,
    -HOUSE_HALF,
    1.02,
    1.10
);


/* ==========================================================
   7. 吊挂木灯
   对应原项目：吊线 + 方灯 + flame + halo + PointLight
   ========================================================== */

let roomLanternLit =
    true;

const lanternPivot =
    new THREE.Group();

lanternPivot.position.set(
    0.8,
    5.9,
    -0.45
);

houseG.add(
    lanternPivot
);

put(
    line([
        [0, 0, 0],
        [0, -0.55, 0]
    ]),
    0,
    0,
    0,
    0,
    0,
    0,
    lanternPivot
);

const lanternG =
    new THREE.Group();

lanternG.position.y =
    -0.74;

lanternPivot.add(
    lanternG
);

put(
    edge(
        new THREE.ConeGeometry(
            0.14,
            0.09,
            4
        ),
        C.fill
    ),
    0,
    0.17,
    0,
    0,
    0,
    0,
    lanternG
);

put(
    box(
        0.24,
        0.30,
        0.24,
        C.fill
    ),
    0,
    0,
    0,
    0,
    0,
    0,
    lanternG
);

const flame =
    edge(
        new THREE.SphereGeometry(
            0.055,
            8,
            6
        ),
        C.flame
    );

flame.scale.set(
    0.70,
    1.40,
    0.70
);

put(
    flame,
    0,
    0,
    0,
    0,
    0,
    0,
    lanternG
);

const halo =
    new THREE.Mesh(
        new THREE.SphereGeometry(
            0.45,
            14,
            10
        ),
        C.halo
    );

halo.userData.noHit =
    true;

lanternG.add(
    halo
);

const lampLight =
    new THREE.PointLight(
        0xffd4a0,
        1.15,
        8.0,
        2
    );

lampLight.position.set(
    0,
    0,
    0
);

lanternG.add(
    lampLight
);

regRoomInteract(
    lanternPivot,
    '点亮 / 熄灭吊灯',
    () => {
        roomLanternLit =
            !roomLanternLit;

        flame.visible =
            roomLanternLit;

        halo.visible =
            roomLanternLit;

        lampLight.intensity =
            roomLanternLit
                ? 1.15
                : 0;

        if (
            typeof showResult ===
            'function'
        ) {
            showResult(
                roomLanternLit
                    ? '吊灯亮了'
                    : '吊灯熄灭'
            );
        }
    }
);


/* ==========================================================
   8. 原项目式书架
   ========================================================== */

function makeRoomShelf(
    x,
    z,
    ry = 0
) {
    const g =
        new THREE.Group();

    put(
        box(
            0.30,
            1.86,
            0.05,
            C.fill
        ),
        0,
        1.05,
        -0.65,
        0,
        0,
        0,
        g
    );

    put(
        box(
            0.30,
            1.86,
            0.05,
            C.fill
        ),
        0,
        1.05,
        0.65,
        0,
        0,
        0,
        g
    );

    put(
        box(
            0.02,
            1.86,
            1.30,
            C.fill
        ),
        -0.15,
        1.05,
        0,
        0,
        0,
        0,
        g
    );

    for (
        const sy of [
            0.18,
            0.78,
            1.38,
            1.95
        ]
    ) {
        put(
            box(
                0.30,
                0.05,
                1.30,
                C.fill
            ),
            0,
            sy,
            0,
            0,
            0,
            0,
            g
        );
    }

    g.position.set(
        x,
        0,
        z
    );

    g.rotation.y =
        ry;

    g.userData.baseX =
        x;

    g.userData.baseZ =
        z;

    g.userData.open =
        false;

    g.userData.openAmount =
        0;

    houseG.add(
        g
    );

    return g;
}

const shelfA =
    makeRoomShelf(
        -3.72,
        -2.85,
        0
    );

function addShelfBook(
    z,
    yBase,
    h,
    th
) {
    const g =
        new THREE.Group();

    put(
        box(
            0.18,
            h,
            th,
            C.wood
        ),
        0,
        h /
            2,
        0,
        0,
        0,
        0,
        g
    );

    put(
        line([
            [0.092, h * 0.55, -th * 0.3],
            [0.092, h * 0.55, th * 0.3]
        ]),
        0,
        0,
        0,
        0,
        0,
        0,
        g
    );

    g.position.set(
        0.02,
        yBase,
        z
    );

    g.userData.baseX =
        0.02;

    g.userData.baseZ =
        z;

    g.userData.pullAxis =
        'x';

    g.userData.out =
        false;

    shelfA.add(
        g
    );

    roomShelfBooks.push(
        g
    );

    regRoomInteract(
        g,
        '抽出一本书',
        () => {
            g.userData.out =
                !g.userData.out;

            if (
                typeof showResult ===
                    'function'
            ) {
                showResult(
                    g.userData.out
                        ? '抽出一本书'
                        : '把书放回去'
                );
            }
        }
    );
}

const shelfBookHeights = [
    0.36,
    0.30,
    0.40,
    0.33,
    0.27,
    0.38,
    0.31,
    0.35,
    0.29,
    0.37,
    0.34,
    0.28
];

const shelfBookThicknesses = [
    0.07,
    0.06,
    0.075,
    0.065,
    0.07,
    0.062,
    0.072
];

let shelfHeightIndex =
    0;

let shelfThicknessIndex =
    0;

for (
    const row
    of [
        { y: 0.205, z0: -0.57, z1: 0.55 },
        { y: 0.805, z0: -0.57, z1: 0.07 },
        { y: 1.405, z0: -0.57, z1: 0.55 }
    ]
) {
    let bookZ =
        row.z0;

    while (
        bookZ <
        row.z1 -
            0.07
    ) {
        const h =
            shelfBookHeights[
                shelfHeightIndex++ %
                    shelfBookHeights.length
            ];

        const th =
            shelfBookThicknesses[
                shelfThicknessIndex++ %
                    shelfBookThicknesses.length
            ];

        addShelfBook(
            bookZ +
                th /
                    2,
            row.y,
            h,
            th
        );

        bookZ +=
            th +
            0.012;
    }
}

for (
    const p of [
        [0.02, 0.205, 0.38, 0.22, 0.30, 0.22],
        [0.02, 0.805, 0.28, 0.20, 0.34, 0.18],
        [0.02, 1.405, 0.34, 0.24, 0.32, 0.20]
    ]
) {
    const book =
        box(
            p[3],
            p[4],
            p[5],
            C.wood
        );

    put(
        book,
        p[0],
        p[1] +
            p[4] /
                2,
        p[2],
        0,
        0,
        0,
        shelfA
    );

    book.userData.baseX =
        p[0];

    book.userData.baseZ =
        p[2];

    book.userData.pullAxis =
        'x';

    book.userData.out =
        false;

    roomShelfBooks.push(
        book
    );

    regRoomInteract(
        book,
        '抽出一本书',
        () => {
            book.userData.out =
                !book.userData.out;

            if (
                typeof showResult ===
                    'function'
            ) {
                showResult(
                    book.userData.out
                        ? '抽出一本书'
                        : '把书放回去'
                );
            }
        }
    );
}


/* ==========================================================
   9. 地毯
   ========================================================== */

const rug =
    edge(
        new THREE.CylinderGeometry(
            1.48,
            1.48,
            0.025,
            48
        ),
        C.cushion
    );

rug.scale.set(
    1.0,
    1.0,
    0.72
);

put(
    rug,
    0.45,
    0.025,
    1.55,
    0,
    0,
    0,
    houseG
);

function updateRoomDaily(
    dt,
    time
) {
    lanternPivot.rotation.x =
        Math.sin(
            time *
                1.2
        ) *
        0.045;

    lanternPivot.rotation.z =
        Math.sin(
            time *
                0.9 +
                1
        ) *
        0.05;

    flame.visible =
        roomLanternLit;

    halo.visible =
        roomLanternLit;

    lampLight.intensity =
        roomLanternLit
            ? 1.15 +
                Math.sin(
                    time *
                        5
                ) *
                    0.15
            : 0;

    roomShelfBooks.forEach(
        b => {
            const target =
                b.userData.out
                    ? 0.18
                    : 0;

            const speed =
                Math.min(
                    1,
                    dt *
                        8
                );

            if (
                b.userData.pullAxis ===
                'x'
            ) {
                b.position.x +=
                    (
                        b.userData.baseX +
                            target -
                        b.position.x
                    ) *
                    speed;
            } else {
                b.position.z +=
                    (
                        b.userData.baseZ +
                            target -
                        b.position.z
                    ) *
                    speed;
            }
        }
    );

    for (
        const p
        of roomPlates
    ) {
        p.rotation.y +=
            p.userData.spinV *
            dt;

        p.userData.spinV *=
            Math.max(
                0,
                1 -
                    2.0 *
                        dt
            );
    }

    for (
        const c
        of roomCups
    ) {
        const u =
            c.userData;

        if (
            u.run >
            0
        ) {
            u.run -=
                dt;
        }

        const prog =
            u.run >
            0
                ? Math.min(
                    Math.max(
                        1 -
                            u.run /
                                2.6,
                        0
                    ),
                    1
                )
                : 1;

        const env =
            u.run >
            0
                ? Math.sin(
                    Math.PI *
                        prog
                )
                : 0;

        u.lift =
            env *
            0.13;

        c.position.y =
            u.baseY +
            u.lift;

        u.steam.visible =
            u.run >
            0;

        if (
            u.steam.visible
        ) {
            u.steam.position.y =
                0.10 +
                (
                    time *
                    0.25
                ) %
                    0.07;

            const ss =
                0.85 +
                0.15 *
                    Math.sin(
                        time *
                            5
                    );

            u.steam.scale.set(
                ss,
                1,
                ss
            );
        }
    }

    for (
        const it
        of roomTableItems
    ) {
        const u =
            it.userData;

        if (
            u.run >
            0
        ) {
            u.run -=
                dt;
        }

        const pr =
            u.run >
            0
                ? 1 -
                    u.run /
                        1.4
                : 1;

        const env =
            u.run >
            0
                ? Math.sin(
                    Math.PI *
                        pr
                )
                : 0;

        it.position.y =
            u.baseY +
            env *
                0.05;

        it.rotation.z =
            env *
            Math.sin(
                pr *
                    12
            ) *
            0.18;

        it.rotation.y =
            u.ry +
            env *
                Math.sin(
                    pr *
                        8
                ) *
                0.3;
    }

    for (
        const chair
        of roomChairs
    ) {
        chair.userData.openAmount +=
            (
                (
                    chair.userData.open
                        ? 1
                        : 0
                ) -
                chair.userData.openAmount
            ) *
            Math.min(
                1,
                dt *
                    7
            );

        const pull =
            smoothRoom(
                chair.userData.openAmount
            ) *
            0.38;

        chair.position.x =
            chair.userData.baseX +
            Math.sin(
                chair.rotation.y
            ) *
            pull;

        chair.position.z =
            chair.userData.baseZ +
            Math.cos(
                chair.rotation.y
            ) *
            pull;
    }

    if (
        roomKotatsuGlowMat
    ) {
        roomKotatsuGlowMat.opacity =
            roomKotatsuOn
                ? 0.07 +
                    0.05 *
                        (
                            0.5 +
                            0.5 *
                                Math.sin(
                                    time *
                                        4.2
                                )
                        )
                : 0;
    }

    if (
        roomRadioNoteRun >
        0
    ) {
        roomRadioNoteRun -=
            dt;
    }

    for (
        const note
        of roomRadioNotes
    ) {
        const active =
            roomRadioNoteRun >
            0;

        note.g.visible =
            active;

        if (
            active
        ) {
            const k =
                (
                    3.2 -
                    roomRadioNoteRun +
                    note.ph
                ) %
                1;

            const world =
                new THREE.Vector3();

            radioG.getWorldPosition(
                world
            );

            note.g.position.set(
                world.x +
                    0.18 +
                    Math.sin(
                        k *
                            Math.PI *
                            2
                    ) *
                        0.06,
                world.y +
                    0.26 +
                    k *
                        0.55,
                world.z -
                    0.02
            );

            note.g.scale.setScalar(
                0.8 +
                    k *
                        0.55
            );

            note.g.rotation.z =
                Math.sin(
                    time *
                        4 +
                        note.ph *
                            6
                ) *
                0.30;

            noteMat.opacity =
                Math.max(
                    0,
                    1 -
                        k
                );
        }
    }

    if (
        roomOrangeState ===
            'out' ||
        roomOrangeState ===
            'back'
    ) {
        roomOrangeT =
            Math.min(
                1,
                roomOrangeT +
                    dt *
                        1.8
            );

        if (
            roomOrangeT >=
            1
        ) {
            roomOrangeState =
                roomOrangeState ===
                    'out'
                    ? 'rolled'
                    : 'inbowl';
        }
    }

    const orangeK =
        roomOrangeState ===
            'inbowl'
            ? 0
            : roomOrangeState ===
                'rolled'
                ? 1
                : roomOrangeState ===
                    'out'
                    ? smoothRoom(
                        roomOrangeT
                    )
                    : 1 -
                        smoothRoom(
                            roomOrangeT
                        );

    for (
        const o
        of roomOranges
    ) {
        o.mesh.position.x =
            o.hx +
            (
                o.tx -
                o.hx
            ) *
                orangeK;

        o.mesh.position.z =
            o.hz +
            (
                o.tz -
                o.hz
            ) *
                orangeK;

        o.mesh.position.y =
            o.hy +
            (
                o.ty -
                o.hy
            ) *
                orangeK +
            Math.sin(
                orangeK *
                    Math.PI
            ) *
                0.10;

        o.mesh.rotation.x =
            o.ax *
            orangeK;

        o.mesh.rotation.z =
            o.az *
            orangeK;
    }

    for (
        const c
        of roomCushions
    ) {
        if (
            c.anim >
            0
        ) {
            c.p =
                Math.min(
                    1,
                    c.p +
                        dt *
                            2.2
                );

            const k =
                smoothRoom(
                    c.p
                );

            c.g.rotation.x =
                c.from +
                (
                    c.to -
                    c.from
                ) *
                    k;

            if (
                c.p >=
                1
            ) {
                c.anim =
                    0;
            }
        }
    }

}
