'use strict';

const COIN_SURFACE_Y = 0.032;
const COIN_THICKNESS = 0.045;
const COIN_REST_Y =
    COIN_SURFACE_Y +
    COIN_THICKNESS *
        0.5;

const COIN_SLOTS = [
    [-2.65, COIN_REST_Y, -2.15],
    [1.95, COIN_REST_Y, -1.95],
    [-0.35, COIN_REST_Y, -0.92],
    [2.55, COIN_REST_Y, 0.65],
    [-2.35, COIN_REST_Y, 1.05],
    [0.88, COIN_REST_Y, 2.25]
];

const COIN_MIN_X = -3.15;
const COIN_MAX_X = 3.15;
const COIN_MIN_Z = -2.55;
const COIN_MAX_Z = 2.55;

const coins = [];

function buildEmployeeCoinSlots(origin) {
    const ring = [
        [-0.20, -0.16],
        [0.19, -0.14],
        [-0.04, -0.04],
        [0.21, 0.08],
        [-0.20, 0.10],
        [0.04, 0.20]
    ];

    return ring.map(
        o => [
            clamp(
                origin[0] + o[0],
                COIN_MIN_X,
                COIN_MAX_X
            ),
            COIN_REST_Y,
            clamp(
                origin[2] + o[1],
                COIN_MIN_Z,
                COIN_MAX_Z
            )
        ]
    );
}

const PLAYER_RIG = {
    slots: COIN_SLOTS,
    coins: coins,
    getCount: () => 1,
    onResolved: () => onCoinsResolved()
};

const EMPLOYEE_RIGS = helperSlots.map(
    (slot, i) => ({
        slots: buildEmployeeCoinSlots(slot),
        coins: [],
        getCount: () => 1,
        onResolved: () => onEmployeeCoinsResolved(i)
    })
);

function syncCoinShadow(
    c
) {
    const h =
        Math.max(
            0,
            c.root.position.y -
                COIN_REST_Y
        );

    const s =
        clamp(
            1 -
                h *
                    0.18,
            0.58,
            1
        );

    c.shadow.position.x =
        c.root.position.x;

    c.shadow.position.z =
        c.root.position.z;

    c.shadow.scale.set(
        s,
        s,
        1
    );
}

function coinBasisFromYaw(
    yaw
) {
    const forward =
        new THREE.Vector3(
            Math.sin(yaw),
            0,
            Math.cos(yaw)
        );

    const right =
        new THREE.Vector3(
            Math.cos(yaw),
            0,
            -Math.sin(yaw)
        );

    return {
        forward:
            forward,

        right:
            right
    };
}

function coinFaceLine(
    pts,
    y,
    parent
) {
    parent.add(
        new THREE.Line(
            geo(
                pts.map(
                    p => [
                        p[0],
                        y,
                        p[1]
                    ]
                )
            ),
            MAT
        )
    );
}

function coinFaceLoop(
    pts,
    y,
    parent
) {
    parent.add(
        new THREE.LineLoop(
            geo(
                pts.map(
                    p => [
                        p[0],
                        y,
                        p[1]
                    ]
                )
            ),
            MAT
        )
    );
}

function makeCoinRing(
    r,
    y,
    parent
) {
    const pts = [];

    for (
        let k = 0;
        k < 64;
        k++
    ) {
        const a =
            k /
            64 *
            Math.PI *
            2;

        pts.push([
            Math.cos(a) *
                r,
            Math.sin(a) *
                r
        ]);
    }

    coinFaceLoop(
        pts,
        y,
        parent
    );
}

function addCoinFaceArt(
    root,
    r
) {
    const topY =
        COIN_THICKNESS *
        0.53;

    const bottomY =
        -COIN_THICKNESS *
        0.53;

    makeCoinRing(
        r *
            0.78,
        topY,
        root
    );

    makeCoinRing(
        r *
            0.55,
        topY,
        root
    );

    const starPts = [];

    for (
        let k = 0;
        k < 10;
        k++
    ) {
        const a =
            -Math.PI /
                2 +
            k *
                Math.PI /
                5;

        const rr =
            k % 2 === 0
                ? r * 0.31
                : r * 0.14;

        starPts.push([
            Math.cos(a) *
                rr,
            Math.sin(a) *
                rr
        ]);
    }

    coinFaceLoop(
        starPts,
        topY,
        root
    );

    makeCoinRing(
        r *
            0.72,
        bottomY,
        root
    );

    coinFaceLine(
        [
            [-r * 0.38, -r * 0.16],
            [r * 0.38, -r * 0.16]
        ],
        bottomY,
        root
    );

    coinFaceLine(
        [
            [-r * 0.34, 0],
            [r * 0.34, 0]
        ],
        bottomY,
        root
    );

    coinFaceLine(
        [
            [-r * 0.38, r * 0.16],
            [r * 0.38, r * 0.16]
        ],
        bottomY,
        root
    );
}

function addCoinRidges(
    root,
    r
) {
    for (
        let k = 0;
        k < 32;
        k++
    ) {
        const a =
            k /
            32 *
            Math.PI *
            2;

        const x =
            Math.cos(a) *
            r;

        const z =
            Math.sin(a) *
            r;

        root.add(
            new THREE.Line(
                geo([
                    [
                        x,
                        -COIN_THICKNESS *
                            0.48,
                        z
                    ],
                    [
                        x,
                        COIN_THICKNESS *
                            0.48,
                        z
                    ]
                ]),
                MAT
            )
        );
    }
}

function makeCoinShadow(
    r
) {
    const shadow =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                r * 0.98,
                32
            ),
            fillMat(
                0x4f4a3f,
                0.13
            )
        );

    shadow.rotation.x =
        -Math.PI /
        2;

    shadow.position.y =
        COIN_SURFACE_Y +
        0.002;

    shadow.userData.noHit =
        true;

    return shadow;
}

function makeBigCoin(
    rig,
    i
) {
    const root =
        new THREE.Group();

    const spin =
        new THREE.Group();

    scene.add(
        root
    );

    const r =
        i === 0
            ? 0.205
            : 0.175;

    const bodyGeo =
        new THREE.CylinderGeometry(
            r,
            r,
            COIN_THICKNESS,
            56
        );

    const body =
        new THREE.Mesh(
            bodyGeo,
            C.coin
        );

    const shadow =
        makeCoinShadow(
            r
        );

    scene.add(
        shadow
    );

    root.add(
        spin
    );

    spin.add(
        body
    );

    spin.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(
                bodyGeo,
                18
            ),
            MAT
        )
    );

    addCoinFaceArt(
        spin,
        r
    );

    addCoinRidges(
        spin,
        r
    );

    const c = {
        rig:
            rig,

        root:
            root,

        spin:
            spin,

        shadow:
            shadow,

        index:
            i,

        r:
            r,

        active:
            false,

        done:
            true,

        result:
            null,

        vel:
            new THREE.Vector3(),

        ang:
            new THREE.Vector3(),

        bounce:
            0,

        settling:
            false,

        settleT:
            0,

        settleDur:
            0.92,

        settleFrom:
            new THREE.Quaternion(),

        settleTo:
            new THREE.Quaternion(),

        finalYaw:
            0
    };

    rig.coins.push(
        c
    );

    resetCoin(
        c
    );

    return c;
}

function resetCoin(
    c
) {
    const p =
        c.rig.slots[
            c.index
        ];

    c.root.position.set(
        p[0],
        p[1],
        p[2]
    );

    syncCoinShadow(
        c
    );

    c.spin.rotation.set(
        0,
        0,
        0
    );

    c.spin.scale.setScalar(
        1
    );

    c.active =
        false;

    c.done =
        true;

    c.result =
        null;

    c.vel.set(
        0,
        0,
        0
    );

    c.ang.set(
        0,
        0,
        0
    );

    c.bounce =
        0;

    c.settling =
        false;

    c.settleT =
        0;

    c.shadow.visible =
        c.root.visible;
}

function syncRigCoins(
    rig,
    n
) {
    while (
        rig.coins.length <
        n
    ) {
        makeBigCoin(
            rig,
            rig.coins.length
        );
    }

    rig.coins.forEach(
        (
            c,
            i
        ) => {
            c.root.visible =
                i < n;

            c.shadow.visible =
                i < n;
        }
    );
}

function syncCoins(
    n
) {
    syncRigCoins(
        PLAYER_RIG,
        n
    );
}

function rigAllDone(rig) {
    const n =
        rig.getCount();

    for (
        let i = 0;
        i < n;
        i++
    ) {
        if (
            !rig.coins[i] ||
            !rig.coins[i].done
        ) {
            return false;
        }
    }

    return true;
}

function allDone() {
    return rigAllDone(
        PLAYER_RIG
    );
}

function launchRigCoins(rig) {
    const n =
        rig.getCount();

    syncRigCoins(
        rig,
        n
    );

    for (
        let i = 0;
        i < n;
        i++
    ) {
        const c =
            rig.coins[i];

        const p =
            rig.slots[i];

        if (
            !c ||
            !p
        ) {
            continue;
        }

        c.done =
            false;

        c.active =
            true;

        c.result =
            null;

        c.bounce =
            0;

        c.settling =
            false;

        c.settleT =
            0;

        c.root.position.set(
            p[0],
            COIN_REST_Y +
                0.03,
            p[2]
        );

        syncCoinShadow(
            c
        );

        c.spin.rotation.set(
            (
                Math.random() -
                0.5
            ) *
                0.18,
            Math.random() *
                Math.PI *
                2,
            (
                Math.random() -
                0.5
            ) *
                0.18
        );

        c.spin.scale.setScalar(
            1
        );

        c.vel.set(
            (
                Math.random() -
                0.5
            ) *
                0.34,
            3.55 +
                Math.random() *
                    0.92,
            (
                Math.random() -
                0.5
            ) *
                0.28
        );

        c.ang.set(
            18 +
                Math.random() *
                    9,
            6 +
                Math.random() *
                    5,
            10 +
                Math.random() *
                    8
        );
    }
}

function launchCoins() {
    launchRigCoins(
        PLAYER_RIG
    );
}

function stageRigForThrow(rig) {
    const n =
        rig.getCount();

    syncRigCoins(
        rig,
        n
    );

    for (
        let i = 0;
        i < n;
        i++
    ) {
        const c =
            rig.coins[i];

        if (
            !c
        ) {
            continue;
        }

        resetCoin(
            c
        );

        c.done =
            false;

        c.root.visible =
            true;

        c.shadow.visible =
            true;
    }
}

function stageCoinsForSlimeThrow() {
    stageRigForThrow(
        PLAYER_RIG
    );
}

function rigGrabPoint(rig, index) {
    const p =
        rig.slots[
            index
        ] ||
        rig.slots[0];

    return new THREE.Vector3(
        p[0],
        0.12,
        p[2] +
            (
                p[2] > 1.55
                    ? -0.42
                    : 0.42
            )
    );
}

function coinGrabPoint(index) {
    return rigGrabPoint(
        PLAYER_RIG,
        index
    );
}

function holdRigCoinBySlime(
    rig,
    slime,
    index,
    lift = 0,
    spreadIndex = 0,
    spreadTotal = 1
) {
    if (
        !slime
    ) {
        return;
    }

    const basis =
        coinBasisFromYaw(
            slime.rotation.y
        );

    const c =
        rig.coins[
            index
        ];

    if (
        !c
    ) {
        return;
    }

    const p =
        slime.position
            .clone()
            .addScaledVector(
                basis.forward,
                0.34
            )
            .addScaledVector(
                basis.right,
                (
                    spreadIndex -
                    (
                        spreadTotal -
                        1
                    ) *
                        0.5
                ) *
                    0.14
            );

    p.y =
        slime.position.y +
        0.50 +
        lift;

    c.root.position.copy(
        p
    );

    c.spin.rotation.set(
        Math.PI *
            0.5,
        slime.rotation.y +
            index *
                0.22,
        (
            Math.random() -
            0.5
        ) *
            0.08
    );

    c.spin.scale.setScalar(
        0.72
    );

    c.shadow.visible =
        false;
}

function holdCoinBySlime(
    slime,
    index,
    lift = 0,
    spreadIndex = 0,
    spreadTotal = 1
) {
    holdRigCoinBySlime(
        PLAYER_RIG,
        slime,
        index,
        lift,
        spreadIndex,
        spreadTotal
    );
}

function holdCoinsBySlime(
    lift = 0
) {
    if (
        typeof playerSlime ===
        'undefined'
    ) {
        return;
    }

    holdCoinBySlime(
        playerSlime,
        0,
        lift
    );
}

function launchRigCoinFromSlime(
    rig,
    index,
    origin,
    yaw
) {
    syncRigCoins(
        rig,
        rig.getCount()
    );

    const basis =
        coinBasisFromYaw(
            yaw
        );

    const c =
        rig.coins[
            index
        ];

    if (
        !c
    ) {
        return;
    }

    const p =
        origin
            .clone()
            .addScaledVector(
                basis.forward,
                0.35
            );

    c.root.position.copy(
        p
    );

    c.shadow.visible =
        true;

    syncCoinShadow(
        c
    );

    c.done =
        false;

    c.active =
        true;

    c.result =
        null;

    c.bounce =
        0;

    c.settling =
        false;

    c.settleT =
        0;

    c.spin.scale.setScalar(
        1
    );

    c.vel.copy(
        basis.forward
    )
        .multiplyScalar(
            0.58 +
                Math.random() *
                    0.28
        )
        .addScaledVector(
            basis.right,
            (
                Math.random() -
                0.5
            ) *
                0.18
        );

    c.vel.y =
        3.55 +
        Math.random() *
            0.95;

    c.ang.set(
        20 +
            Math.random() *
                10,
        6 +
            Math.random() *
                5,
        12 +
            Math.random() *
                9
    );
}

function launchCoinFromSlime(
    index,
    origin,
    yaw
) {
    launchRigCoinFromSlime(
        PLAYER_RIG,
        index,
        origin,
        yaw
    );
}

function launchCoinsFromSlime(
    origin,
    yaw
) {
    launchCoinFromSlime(
        0,
        origin,
        yaw
    );
}

function settle(
    c
) {
    c.active =
        false;

    c.done =
        true;

    if (
        rigAllDone(
            c.rig
        ) &&
        typeof c.rig.onResolved ===
            'function'
    ) {
        c.rig.onResolved();
    }
}

function startCoinSettle(
    c
) {
    const chance =
        typeof headChance ===
            'function'
            ? headChance()
            : 0.5;

    const head =
        Math.random() <
        chance;

    c.result =
        head
            ? 'HEAD'
            : 'TAIL';

    c.settling =
        true;

    c.settleT =
        0;

    c.finalYaw =
        Math.random() *
        Math.PI *
        2;

    c.settleFrom.copy(
        c.spin.quaternion
    );

    c.settleTo.setFromEuler(
        new THREE.Euler(
            head
                ? 0
                : Math.PI,
            c.finalYaw,
            0
        )
    );

    c.vel.x *=
        0.36;

    c.vel.z *=
        0.36;

    c.vel.y =
        0;
}

function updateSettlingCoin(
    c,
    dt
) {
    c.settleT +=
        dt;

    const k =
        clamp(
            c.settleT /
                c.settleDur,
            0,
            1
        );

    const ease =
        k *
        k *
        (
            3 -
            2 *
                k
        );

    c.spin.quaternion
        .slerpQuaternions(
            c.settleFrom,
            c.settleTo,
            ease
        );

    const wobble =
        Math.sin(
            k *
                Math.PI *
                6
        ) *
        (1 - k) *
        0.16;

    c.spin.rotateX(
        wobble
    );

    c.spin.rotateZ(
        Math.cos(
            k *
                Math.PI *
                5 +
                c.index
        ) *
            wobble *
            0.55
    );

    c.root.position.y =
        COIN_REST_Y +
        Math.sin(
            k *
                Math.PI
        ) *
            (1 - k) *
            0.04;

    c.root.position.x =
        clamp(
            c.root.position.x +
                c.vel.x *
                    dt *
                    (1 - k),
            COIN_MIN_X,
            COIN_MAX_X
        );

    c.root.position.z =
        clamp(
            c.root.position.z +
                c.vel.z *
                    dt *
                    (1 - k),
            COIN_MIN_Z,
            COIN_MAX_Z
        );

    syncCoinShadow(
        c
    );

    const squash =
        1 -
        Math.sin(
            k *
                Math.PI *
                4
        ) *
            (1 - k) *
            0.025;

    c.spin.scale.set(
        1 / Math.sqrt(
            squash
        ),
        squash,
        1 / Math.sqrt(
            squash
        )
    );

    if (
        k >= 1
    ) {
        c.spin.quaternion.copy(
            c.settleTo
        );

        c.root.position.y =
            COIN_REST_Y;

        syncCoinShadow(
            c
        );

        c.spin.scale.setScalar(
            1
        );

        c.settling =
            false;

        settle(
            c
        );
    }
}

function updateRigCoins(
    rig,
    dt
) {
    const n =
        rig.getCount();

    for (
        let i = 0;
        i < n;
        i++
    ) {
        const c =
            rig.coins[i];

        if (
            !c ||
            !c.active
        ) {
            continue;
        }

        if (
            c.settling
        ) {
            updateSettlingCoin(
                c,
                dt
            );

            continue;
        }

        c.vel.y -=
            10.8 *
            dt;

        c.root.position
            .addScaledVector(
                c.vel,
                dt
            );

        syncCoinShadow(
            c
        );

        c.spin.rotation.x +=
            c.ang.x *
            dt;

        c.spin.rotation.y +=
            c.ang.y *
            dt;

        c.spin.rotation.z +=
            c.ang.z *
            dt;

        const scaleBack =
            Math.min(
                1,
                dt *
                    10
            );

        c.spin.scale.x +=
            (
                1 -
                c.spin.scale.x
            ) *
            scaleBack;

        c.spin.scale.y +=
            (
                1 -
                c.spin.scale.y
            ) *
            scaleBack;

        c.spin.scale.z +=
            (
                1 -
                c.spin.scale.z
            ) *
            scaleBack;

        c.vel.x *=
            Math.max(
                0,
                1 -
                    dt *
                        0.22
            );

        c.vel.z *=
            Math.max(
                0,
                1 -
                    dt *
                        0.22
            );

        const floor =
            COIN_REST_Y;

        if (
            c.root.position.y <=
                floor &&
            c.vel.y <
                0
        ) {
            c.root.position.y =
                floor;

            if (
                c.bounce <
                    2 &&
                Math.abs(
                    c.vel.y
                ) >
                    0.72
            ) {
                c.vel.y *=
                    -0.28;

                c.vel.x *=
                    0.62;

                c.vel.z *=
                    0.62;

                c.ang.multiplyScalar(
                    0.54
                );

                c.spin.scale.set(
                    1.05,
                    0.92,
                    1.05
                );

                c.bounce++;
            } else {
                startCoinSettle(
                    c
                );
            }
        }
    }
}

function updateCoins(
    dt
) {
    updateRigCoins(
        PLAYER_RIG,
        dt
    );

    EMPLOYEE_RIGS.forEach(
        rig => {
            if (
                rig
            ) {
                updateRigCoins(
                    rig,
                    dt
                );
            }
        }
    );
}
