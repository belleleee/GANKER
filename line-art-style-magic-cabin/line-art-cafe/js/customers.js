'use strict';

/* ==========================================================
   顾客系统 - Slime Customer System
   统一顾客整体高度：1.2
   ========================================================== */

const customers = [];
const slotUsed = WAIT_SLOTS.map(() => false);

let nextSpawnAt = 0;

/* 顾客统一高度 */
const CUSTOMER_Y = 1.2;


/* ==========================================================
   1. 创建史莱姆顾客
   ========================================================== */

function makeCustomerMesh(bodyColor = 0x4fd695) {

    /* ------------------------------------------------------
       Root
       负责整体：
       position / rotation / 移动 / 基础高度
       ------------------------------------------------------ */

    const slimeRoot = new THREE.Group();


    /* ------------------------------------------------------
       Body
       只负责：
       squash / stretch / wobble / 呼吸
       ------------------------------------------------------ */

    const slimeBody = new THREE.Group();

    /*
       不再把 1.2 写在 body 上。
       CUSTOMER_Y 统一由 slimeRoot 控制。
    */
    slimeBody.position.y = 0;

    slimeRoot.add(slimeBody);


    /* ======================================================
       颜色
       ====================================================== */

    const baseColor =
        new THREE.Color(bodyColor);

    const midColor =
        baseColor.clone().lerp(
            new THREE.Color(0xffffff),
            0.38
        );

    const coreColor =
        baseColor.clone().multiplyScalar(
            0.76
        );


    /* ======================================================
       材质
       ====================================================== */

    const membraneMat =
        new THREE.MeshBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            depthWrite: false
        });


    const midMat =
        new THREE.MeshBasicMaterial({
            color: midColor,
            transparent: true,
            opacity: 0.30,
            side: THREE.DoubleSide,
            depthWrite: false
        });


    const coreMat =
        new THREE.MeshBasicMaterial({
            color: coreColor,
            transparent: true,
            opacity: 0.52,
            depthWrite: false
        });


    const bubbleMat =
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.28,
            depthWrite: false
        });


    /* ======================================================
       主体
       ====================================================== */

    const SLIME_R = 0.30;

    const slimeGeo =
        new THREE.SphereGeometry(
            SLIME_R,
            26,
            18
        );


    /*
       保存原始顶点
    */
    const slimeOrig =
        slimeGeo.attributes.position
            .array
            .slice();


    /* ---------- 外膜 ---------- */

    const membrane =
        new THREE.Mesh(
            slimeGeo,
            membraneMat
        );

    slimeBody.add(membrane);


    /* ---------- 中间层 ---------- */

    const midGeo =
        slimeGeo.clone();

    const midLayer =
        new THREE.Mesh(
            midGeo,
            midMat
        );

    midLayer.scale.setScalar(
        0.9
    );

    slimeBody.add(midLayer);


    /* ---------- 内核 ---------- */

    const core =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.14,
                18,
                14
            ),
            coreMat
        );

    core.position.set(
        0,
        -0.035,
        0
    );

    slimeBody.add(core);


    /* ======================================================
       内部小气泡
       ====================================================== */

    const bubbles = [];

    const bubblePositions = [
        [-0.10,  0.07,  0.06],
        [ 0.11, -0.03, -0.04],
        [-0.04, -0.11,  0.10],
        [ 0.07,  0.12, -0.08]
    ];


    for (
        let i = 0;
        i < bubblePositions.length;
        i++
    ) {

        const p =
            bubblePositions[i];


        const bubble =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.025 + i * 0.004,
                    8,
                    6
                ),
                bubbleMat
            );


        bubble.position.set(
            p[0],
            p[1],
            p[2]
        );


        slimeBody.add(
            bubble
        );


        bubbles.push({
            mesh: bubble,

            phase:
                Math.random() *
                Math.PI * 2
        });
    }


    /* ======================================================
       眼睛
       ====================================================== */

    const eyeMat =
        new THREE.MeshBasicMaterial({
            color: 0x394039
        });


    const leftEye =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.026,
                8,
                6
            ),
            eyeMat
        );


    leftEye.position.set(
        -0.085,
        0.055,
        0.275
    );


    leftEye.scale.set(
        0.75,
        1.1,
        0.45
    );


    slimeBody.add(
        leftEye
    );


    const rightEye =
        leftEye.clone();


    rightEye.position.x =
        0.085;


    slimeBody.add(
        rightEye
    );


    /* ======================================================
       状态
       ====================================================== */

    slimeRoot.userData.slime = {

        body:
            slimeBody,

        membrane:
            membrane,

        midLayer:
            midLayer,

        core:
            core,

        bubbles:
            bubbles,

        leftEye:
            leftEye,

        rightEye:
            rightEye,

        geometry:
            slimeGeo,

        midGeometry:
            midGeo,

        originalVertices:
            slimeOrig,

        radius:
            SLIME_R,


        /* ---------- 弹簧 ---------- */

        squash:
            1,

        squashV:
            0,

        wob:
            0,

        wobV:
            0,

        tilt:
            0,

        tiltV:
            0,

        pulse:
            Math.random() *
            Math.PI * 2,


        /* ---------- 个体差异 ---------- */

        wobPhase:
            Math.random() *
            Math.PI * 2,

        bobPhase:
            Math.random() *
            Math.PI * 2
    };


    return slimeRoot;
}


/* ==========================================================
   2. 顶点形变
   ========================================================== */

function deformCustomerSlime(
    mesh,
    time,
    moving
) {

    const s =
        mesh.userData.slime;


    if (!s) return;


    const geo =
        s.geometry;


    const arr =
        geo.attributes.position.array;


    const orig =
        s.originalVertices;


    const n =
        geo.attributes.position.count;


    const amp =
        moving
            ? 0.013
            : 0.004;


    const speed =
        moving
            ? 7.0
            : 1.7;


    for (
        let i = 0;
        i < n;
        i++
    ) {

        const ix =
            i * 3;


        const x0 =
            orig[ix];

        const y0 =
            orig[ix + 1];

        const z0 =
            orig[ix + 2];


        const h =
            y0 / s.radius;


        const spread =
            1 +
            0.16 *
            Math.max(
                0,
                -h
            );


        const phase =
            h * 3.2 -
            time * speed +
            s.wobPhase;


        const waveZ =
            Math.sin(
                phase
            ) *
            amp;


        const waveX =
            Math.sin(
                phase + 1.7
            ) *
            amp *
            0.45;


        arr[ix] =
            x0 * spread +
            waveX;


        arr[ix + 1] =
            y0 +
            Math.sin(
                phase * 0.82
            ) *
            amp *
            0.24;


        arr[ix + 2] =
            z0 * spread +
            waveZ;
    }


    geo.attributes.position
        .needsUpdate = true;
}


/* ==========================================================
   3. Slime 弹簧动画
   ========================================================== */

function updateCustomerSlime(
    mesh,
    dt,
    time,
    moving,
    speed = 0
) {

    const s =
        mesh.userData.slime;


    if (!s) return;


    /* ======================================================
       squash
       ====================================================== */

    const movePulse =
        moving
            ? Math.sin(
                time * 8 +
                s.pulse
            )
            : Math.sin(
                time * 2 +
                s.pulse
            );


    const targetSquash =
        moving
            ? 0.91 +
              movePulse * 0.06
            : 0.97 +
              movePulse * 0.025;


    s.squashV +=
        (
            targetSquash -
            s.squash
        ) *
        18 *
        dt;


    s.squashV *=
        Math.pow(
            0.055,
            dt
        );


    s.squash +=
        s.squashV;


    /* ======================================================
       wobble
       ====================================================== */

    const targetWob =
        moving
            ? Math.sin(
                time * 7 +
                s.wobPhase
            ) * 0.16
            : Math.sin(
                time * 2.2 +
                s.wobPhase
            ) * 0.035;


    s.wobV +=
        (
            targetWob -
            s.wob
        ) *
        14 *
        dt;


    s.wobV *=
        Math.pow(
            0.06,
            dt
        );


    s.wob +=
        s.wobV;


    /* ======================================================
       squash / stretch
       ====================================================== */

    const sy =
        clamp(
            s.squash,
            0.60,
            1.25
        );


    const sxz =
        1 /
        Math.sqrt(
            Math.max(
                sy,
                0.1
            )
        );


    s.body.scale.set(
        sxz *
        (
            1 +
            s.wob * 0.04
        ),

        sy,

        sxz *
        (
            1 -
            s.wob * 0.03
        )
    );


    /* ======================================================
       身体倾斜
       ====================================================== */

    s.body.rotation.z =
        s.wob * 0.18;


    s.body.rotation.x =
        Math.sin(
            time * 2.3 +
            s.wobPhase
        ) *
        0.025;


    /* ======================================================
       内核漂浮
       ====================================================== */

    s.core.position.y =
        -0.035 +
        Math.sin(
            time * 1.8 +
            s.pulse
        ) *
        0.012;


    s.core.position.x =
        Math.sin(
            time * 1.4 +
            s.wobPhase
        ) *
        0.012;


    /* ======================================================
       气泡
       ====================================================== */

    for (
        let i = 0;
        i < s.bubbles.length;
        i++
    ) {

        const b =
            s.bubbles[i];


        b.mesh.position.y +=
            Math.sin(
                time * 1.5 +
                b.phase
            ) *
            0.00015;


        const bs =
            0.88 +
            Math.sin(
                time * 2.2 +
                b.phase
            ) *
            0.08;


        b.mesh.scale.setScalar(
            bs
        );
    }


    /* ======================================================
       眨眼
       ====================================================== */

    const blink =
        (
            time +
            s.bobPhase
        ) % 4.4 < 0.13;


    const eyeY =
        blink
            ? 0.15
            : 1;


    s.leftEye.scale.y =
        eyeY;


    s.rightEye.scale.y =
        eyeY;


    /* ======================================================
       顶点动画
       ====================================================== */

    deformCustomerSlime(
        mesh,
        time,
        moving
    );
}


/* ==========================================================
   4. 订单图标
   ========================================================== */

function makeOrderGfx() {

    const canvas =
        document.createElement(
            'canvas'
        );


    canvas.width =
        128;


    canvas.height =
        128;


    const ctx =
        canvas.getContext(
            '2d'
        );


    const tex =
        new THREE.CanvasTexture(
            canvas
        );


    const mat =
        new THREE.SpriteMaterial({
            map: tex,
            depthTest: false,
            transparent: true
        });


    const sprite =
        new THREE.Sprite(
            mat
        );


    sprite.scale.set(
        0.48,
        0.48,
        1
    );


    return {
        canvas,
        ctx,
        tex,
        sprite
    };
}


/* ==========================================================
   5. 绘制订单
   ========================================================== */

function drawOrder(c) {

    const frac =
        clamp(
            c.timeLeft /
            c.total,
            0,
            1
        );


    const {
        ctx
    } =
        c.orderGfx;


    ctx.clearRect(
        0,
        0,
        128,
        128
    );


    /* ---------- 白底 ---------- */

    ctx.beginPath();


    ctx.arc(
        64,
        64,
        56,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        'rgba(255,255,255,0.94)';


    ctx.fill();


    /* ---------- 边框 ---------- */

    ctx.lineWidth =
        4;


    ctx.strokeStyle =
        '#55504a';


    ctx.stroke();


    /* ---------- 倒计时区域 ---------- */

    ctx.beginPath();


    ctx.moveTo(
        64,
        64
    );


    ctx.arc(
        64,
        64,
        56,
        -Math.PI / 2,
        -Math.PI / 2 +
        Math.PI * 2 *
        frac
    );


    ctx.closePath();


    if (
        frac > 0.4
    ) {

        ctx.fillStyle =
            'rgba(120,190,110,0.48)';

    } else if (
        frac > 0.18
    ) {

        ctx.fillStyle =
            'rgba(230,170,60,0.55)';

    } else {

        ctx.fillStyle =
            'rgba(220,70,70,0.60)';
    }


    ctx.fill();


    /* ---------- 商品 ---------- */

    ctx.font =
        '54px "Apple Color Emoji","Segoe UI Emoji",sans-serif';


    ctx.textAlign =
        'center';


    ctx.textBaseline =
        'middle';


    ctx.fillText(
        c.drink.icon,
        64,
        68
    );


    c.orderGfx.tex.needsUpdate =
        true;
}


/* ==========================================================
   6. Dispose
   ========================================================== */

function disposeGroup(g) {

    const geometries =
        new Set();


    const materials =
        new Set();


    g.traverse(o => {

        if (
            o.geometry &&
            !geometries.has(
                o.geometry
            )
        ) {

            geometries.add(
                o.geometry
            );


            o.geometry.dispose();
        }


        if (
            o.material &&
            o.material !== MAT &&
            !materials.has(
                o.material
            )
        ) {

            materials.add(
                o.material
            );


            if (
                o.material.dispose
            ) {

                o.material.dispose();
            }
        }
    });
}


function disposeCustomer(c) {

    scene.remove(
        c.mesh
    );


    disposeGroup(
        c.mesh
    );


    if (
        c.orderGfx.tex
    ) {

        c.orderGfx.tex.dispose();
    }


    if (
        c.orderGfx.sprite.material
    ) {

        c.orderGfx.sprite
            .material
            .dispose();
    }
}


/* ==========================================================
   7. 当前订单时间
   ========================================================== */

function currentOrderTime() {

    const difficulty =
        clamp(
            coins /
            WIN_COINS,
            0,
            1
        );


    return (
        16 -
        7 *
        difficulty
    );
}


/* ==========================================================
   8. Spawn
   ========================================================== */

function spawnCustomer(slot) {

    const drink =
        DRINKS[
            Math.floor(
                Math.random() *
                DRINKS.length
            )
        ];


    const bodyColor =
        CUSTOMER_COLORS[
            Math.floor(
                Math.random() *
                CUSTOMER_COLORS.length
            )
        ];


    const mesh =
        makeCustomerMesh(
            bodyColor
        );


    /*
       统一初始高度 1.2
    */

    mesh.position.set(
        DOOR_OUTSIDE.x,
        CUSTOMER_Y,
        DOOR_OUTSIDE.z
    );


    scene.add(
        mesh
    );


    /* ---------- 订单图标 ---------- */

    const orderGfx =
        makeOrderGfx();


    /*
       相对于 root 的高度
    */

    orderGfx.sprite.position.set(
        0,
        0.65,
        0
    );


    mesh.add(
        orderGfx.sprite
    );


    const total =
        currentOrderTime();


    const cust = {

        mesh,

        drink,

        orderGfx,

        slot,

        state:
            'enter',

        timeLeft:
            total,

        total,

        happy:
            null
    };


    mesh.userData.customerRef =
        cust;


    customers.push(
        cust
    );


    /* ---------- 出现弹性 ---------- */

    const slime =
        mesh.userData.slime;


    slime.squash =
        0.72;


    slime.squashV =
        2.2;


    slime.wobV =
        1.4;


    SND.play(
        'doorbell'
    );
}


/* ==========================================================
   9. 离开
   ========================================================== */

function resolveCustomer(
    c,
    happy
) {

    if (
        c.state ===
        'leaving'
    ) {

        return;
    }


    c.state =
        'leaving';


    c.happy =
        happy;


    /*
       保证开始离开时高度仍是 1.2
    */

    c.mesh.position.y =
        CUSTOMER_Y;


    const slime =
        c.mesh.userData.slime;


    slime.squashV +=
        happy
            ? 1.8
            : -0.8;


    slime.wobV +=
        happy
            ? 1.6
            : 0.7;
}


/* ==========================================================
   10. 更新顾客
   ========================================================== */

function updateCustomers(
    dt,
    time
) {

    for (
        let i =
            customers.length - 1;

        i >= 0;

        i--
    ) {

        const c =
            customers[i];


        let moving =
            false;


        let speed =
            0;


        /* ==================================================
           ENTER / LEAVE
           ================================================== */

        if (
            c.state === 'enter' ||
            c.state === 'leaving'
        ) {

            /*
               无论进来还是离开，
               root 高度始终保持 1.2
            */

            c.mesh.position.y =
                CUSTOMER_Y;


            const destX =
                c.state === 'enter'
                    ? WAIT_SLOTS[
                        c.slot
                    ].x
                    : DOOR_OUTSIDE.x;


            const destZ =
                c.state === 'enter'
                    ? WAIT_SLOTS[
                        c.slot
                    ].z
                    : DOOR_OUTSIDE.z;


            const dx =
                destX -
                c.mesh.position.x;


            const dz =
                destZ -
                c.mesh.position.z;


            const dist =
                Math.hypot(
                    dx,
                    dz
                );


            if (
                dist > 0.045
            ) {

                moving =
                    true;


                const moveSpeed =
                    c.state ===
                    'leaving'
                        ? 2.1
                        : 1.65;


                speed =
                    moveSpeed;


                const step =
                    Math.min(
                        moveSpeed * dt,
                        dist
                    );


                c.mesh.position.x +=
                    dx / dist *
                    step;


                c.mesh.position.z +=
                    dz / dist *
                    step;


                c.mesh.rotation.y =
                    Math.atan2(
                        dx,
                        dz
                    );


            } else if (
                c.state === 'enter'
            ) {

                /*
                   到达等待位时，
                   y 仍然是 1.2
                */

                c.mesh.position.set(
                    destX,
                    CUSTOMER_Y,
                    destZ
                );


                c.state =
                    'waiting';


                const slime =
                    c.mesh.userData
                        .slime;


                slime.squashV -=
                    0.8;


                slime.wobV +=
                    0.7;


            } else {

                disposeCustomer(
                    c
                );


                customers.splice(
                    i,
                    1
                );


                slotUsed[
                    c.slot
                ] =
                    false;


                continue;
            }
        }


        /* ==================================================
           WAITING
           ================================================== */

        if (
            c.state === 'waiting'
        ) {

            /*
               等待阶段 root 仍然固定 1.2
            */

            c.mesh.position.y =
                CUSTOMER_Y;


            c.timeLeft -=
                dt;


            drawOrder(
                c
            );


            /*
               只有 body 做很小的呼吸 bob。
               不改变整个顾客的基础高度。
            */

            const slime =
                c.mesh.userData
                    .slime;


            slime.body.position.y =
                Math.sin(
                    time * 2 +
                    slime.bobPhase
                ) *
                0.012;


            if (
                c.timeLeft <= 0
            ) {

                c.timeLeft =
                    0;


                resolveCustomer(
                    c,
                    false
                );


                loseLife();
            }
        }


        /* ==================================================
           Slime Animation
           ================================================== */

        updateCustomerSlime(
            c.mesh,
            dt,
            time,
            moving,
            speed
        );
    }
}


/* ==========================================================
   11. Spawn scheduler
   ========================================================== */

function maybeSpawn(time) {

    if (
        time <
        nextSpawnAt
    ) {

        return;
    }


    const slot =
        slotUsed.indexOf(
            false
        );


    if (
        slot === -1
    ) {

        return;
    }


    slotUsed[
        slot
    ] =
        true;


    spawnCustomer(
        slot
    );
    const difficulty =
        clamp(
            coins /
            WIN_COINS,
            0,
            1
        );ß
    nextSpawnAt =
        time +
        (
            3.5 -
            1.8 *
            difficulty
        ) +
        Math.random() *
        1.2;
}