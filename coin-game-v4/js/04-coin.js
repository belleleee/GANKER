'use strict';

const COIN_SURFACE_Y = 0.032;
const COIN_THICKNESS = 0.045;
const COIN_REST_Y =
    COIN_SURFACE_Y +
    COIN_THICKNESS *
        0.5;

const COIN_SLOTS = [
    [-1.95, COIN_REST_Y, -1.70],
    [-1.25, COIN_REST_Y, -1.70],
    [-0.55, COIN_REST_Y, -1.70],
    [-1.95, COIN_REST_Y, -1.38],
    [-1.25, COIN_REST_Y, -1.38],
    [-0.55, COIN_REST_Y, -1.38]
];

const COIN_MIN_X = -2.18;
const COIN_MAX_X = -0.32;
const COIN_MIN_Z = -1.92;
const COIN_MAX_Z = -1.16;

const coins = [];

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

    coins.push(
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
        COIN_SLOTS[
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

function syncCoins(
    n
) {
    while (
        coins.length <
        n
    ) {
        makeBigCoin(
            coins.length
        );
    }

    coins.forEach(
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

function allDone() {
    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        if (
            !coins[i] ||
            !coins[i].done
        ) {
            return false;
        }
    }

    return true;
}

function launchCoins() {
    syncCoins(
        state.coinCount
    );

    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        const c =
            coins[i];

        const p =
            COIN_SLOTS[i];

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

function stageCoinsForSlimeThrow() {
    syncCoins(
        state.coinCount
    );

    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        const c =
            coins[i];

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

function holdCoinsBySlime(
    lift = 0
) {
    if (
        typeof playerSlime ===
        'undefined'
    ) {
        return;
    }

    const basis =
        coinBasisFromYaw(
            playerSlime.rotation.y
        );

    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        const c =
            coins[i];

        if (
            !c
        ) {
            continue;
        }

        const row =
            Math.floor(
                i /
                    3
            );

        const col =
            i % 3;

        const spread =
            (
                col -
                Math.min(
                    state.coinCount -
                        row *
                            3,
                    3
                ) /
                    2 +
                0.5
            ) *
            0.15;

        const p =
            playerSlime.position
                .clone()
                .addScaledVector(
                    basis.forward,
                    0.34 +
                        row *
                            0.08
                )
                .addScaledVector(
                    basis.right,
                    spread
                );

        p.y =
            playerSlime.position.y +
            0.50 +
            lift +
            row *
                0.035;

        c.root.position.copy(
            p
        );

        c.spin.rotation.set(
            Math.PI *
                0.5,
            playerSlime.rotation.y +
                i *
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
}

function launchCoinsFromSlime(
    origin,
    yaw
) {
    syncCoins(
        state.coinCount
    );

    const basis =
        coinBasisFromYaw(
            yaw
        );

    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        const c =
            coins[i];

        if (
            !c
        ) {
            continue;
        }

        const row =
            Math.floor(
                i /
                    3
            );

        const col =
            i % 3;

        const spread =
            (
                col -
                Math.min(
                    state.coinCount -
                        row *
                            3,
                    3
                ) /
                    2 +
                0.5
            ) *
            0.18;

        const p =
            origin
                .clone()
                .addScaledVector(
                    basis.forward,
                    0.35 +
                        row *
                            0.06
                )
                .addScaledVector(
                    basis.right,
                    spread
                );

        p.y +=
            row *
            0.035;

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
                spread *
                    0.65 +
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
}

function settle(
    c
) {
    c.active =
        false;

    c.done =
        true;

    if (
        allDone()
    ) {
        onCoinsResolved();
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

function updateCoins(
    dt
) {
    for (
        let i = 0;
        i < state.coinCount;
        i++
    ) {
        const c =
            coins[i];

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
