'use strict';

/* ==========================================================
   13. FARM TOOLS
   镰刀 / 锄头 / 水壶

   结构：
   REST → FLY → USE → RETURN → REST

   与魔杖相同：
   - THREE.Group
   - 基础几何体
   - Mesh + EdgesGeometry
   - regMagic()
   - phase 状态机
   ========================================================== */


/* ==========================================================
   1. 全局工具列表
   ========================================================== */

const farmTools = [];

/* 三把农具对应的槽位号，和魔杖槽位 2 并列 */
const TOOL_SLOT = { hoe: 3, wateringCan: 4, sickle: 5 };

/* 农具统一挂在史莱姆身上（跟魔杖 wandRoot 一样挂在 slimeRoot 下），
   用很小的局部坐标当作"握在手里"的位置，不再摆在小屋里的固定地点 */
const toolHandRoot = new THREE.Group();
slimeRoot.add(toolHandRoot);
const TOOL_HAND_LOCAL = { x: 0.17, y: 0.27, z: 0.14 };


/* ==========================================================
   2. 材质
   ========================================================== */

const toolWoodMat = LITMAT(0xc59a68, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolWoodDarkMat = LITMAT(0x9e7049, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolMetalMat = LITMAT(0xb9bec0, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolMetalDarkMat = LITMAT(0x8c9395, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolGreenMat = LITMAT(0x91aaa0, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolGreenDarkMat = LITMAT(0x71877f, {
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});

const toolWaterMat = new THREE.MeshBasicMaterial({
    color: 0x7fcdf0,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide
});

const toolEdgeMat = new THREE.LineBasicMaterial({
    color: 0x5e5143
});

const toolHoleMat = new THREE.MeshBasicMaterial({
    color: 0x3a3532
});

let wateringCanFilled = false;

function setWateringCanFilled(filled, silent) {
    wateringCanFilled = !!filled;
    const tool = TOOLS_BY_NAME.wateringCan;
    if (tool && tool.userData.waterIndicator) {
        tool.userData.waterIndicator.visible = wateringCanFilled;
    }
    if (!silent) {
        showHintOverride(wateringCanFilled ? '水壶已经装满，可以去浇灌作物了' : '水壶已经空了，需要去水井打水');
    }
}

function isWateringCanFilled() {
    return wateringCanFilled;
}

function fillWateringCan() {
    setWateringCanFilled(true, false);
}

function consumeWateringCanWater() {
    if (!wateringCanFilled) {
        showHintOverride('水壶里没有水，先去水井旁按 <b>E</b> 打水');
        return false;
    }
    setWateringCanFilled(false, true);
    return true;
}

window.setWateringCanFilled = setWateringCanFilled;
window.isWateringCanFilled = isWateringCanFilled;
window.fillWateringCan = fillWateringCan;
window.consumeWateringCanWater = consumeWateringCanWater;


/* ==========================================================
   3. 工具基础零件
   与魔杖 woodPart() 相同思路
   ========================================================== */

function toolPart(geo, mat) {

    const g = new THREE.Group();

    const mesh = new THREE.Mesh(
        geo,
        mat || toolWoodMat
    );

    g.add(mesh);

    const lines = new THREE.LineSegments(
        new THREE.EdgesGeometry(
            geo,
            20
        ),
        toolEdgeMat
    );

    g.add(lines);

    return g;
}

function buildHoeModel(scale) {

    const s =
        scale || 1;

    const g =
        new THREE.Group();

    const handleLen =
        0.78 * s;

    const handle =
        toolPart(
            new THREE.CylinderGeometry(
                0.020 * s,
                0.027 * s,
                handleLen,
                8
            ),
            toolWoodMat
        );

    handle.rotation.x =
        Math.PI / 2;

    handle.position.z =
        -0.10 * s;

    g.add(handle);

    const grip =
        toolPart(
            new THREE.CylinderGeometry(
                0.027 * s,
                0.030 * s,
                0.16 * s,
                8
            ),
            toolWoodDarkMat
        );

    grip.rotation.x =
        Math.PI / 2;

    grip.position.z =
        -0.40 * s;

    g.add(grip);

    for (const z of [-0.43, -0.36]) {
        const wrap =
            toolPart(
                new THREE.TorusGeometry(
                    0.032 * s,
                    0.0045 * s,
                    6,
                    14
                ),
                toolMetalDarkMat
            );

        wrap.rotation.x =
            Math.PI / 2;

        wrap.position.z =
            z * s;

        g.add(wrap);
    }

    const socket =
        toolPart(
            new THREE.BoxGeometry(
                0.145 * s,
                0.105 * s,
                0.110 * s
            ),
            toolMetalDarkMat
        );

    socket.position.set(
        0,
        0,
        0.305 * s
    );

    g.add(socket);

    const cap =
        toolPart(
            new THREE.BoxGeometry(
                0.105 * s,
                0.078 * s,
                0.050 * s
            ),
            toolWoodDarkMat
        );

    cap.position.set(
        0,
        0.065 * s,
        0.310 * s
    );

    g.add(cap);

    const bladeShape =
        new THREE.Shape();

    bladeShape.moveTo(
        -0.165 * s,
        0.045 * s
    );
    bladeShape.lineTo(
        0.165 * s,
        0.045 * s
    );
    bladeShape.lineTo(
        0.115 * s,
        -0.245 * s
    );
    bladeShape.lineTo(
        -0.115 * s,
        -0.245 * s
    );
    bladeShape.closePath();

    const bladeGeo =
        new THREE.ExtrudeGeometry(
            bladeShape,
            {
                depth: 0.020 * s,
                bevelEnabled: false
            }
        );

    bladeGeo.translate(
        0,
        0,
        -0.010 * s
    );

    const blade =
        toolPart(
            bladeGeo,
            toolMetalMat
        );

    blade.position.set(
        0,
        -0.060 * s,
        0.365 * s
    );

    blade.rotation.x =
        -0.46;

    g.add(blade);

    const bladeEdge =
        toolPart(
            new THREE.BoxGeometry(
                0.245 * s,
                0.012 * s,
                0.018 * s
            ),
            toolMetalDarkMat
        );

    bladeEdge.position.set(
        0,
        -0.235 * s,
        0.480 * s
    );

    bladeEdge.rotation.x =
        -0.46;

    g.add(bladeEdge);

    return g;
}


/* ==========================================================
   4. 平滑函数
   不依赖其他文件中的 smooth()
   ========================================================== */

function toolSmooth(k) {

    k = Math.max(
        0,
        Math.min(
            1,
            k
        )
    );

    return (
        k * k *
        (3 - 2 * k)
    );
}


/* ==========================================================
   5. 镰刀模型
   ========================================================== */

function buildSickle() {

    const g = new THREE.Group();


    /* ---------- 木柄 ---------- */

    const handle = toolPart(

        new THREE.CylinderGeometry(
            0.025,
            0.032,
            0.72,
            8
        ),

        toolWoodMat
    );

    /*
       让工具局部 Z 轴成为主要长度方向
       与魔杖比较接近
    */

    handle.rotation.x =
        Math.PI / 2;

    handle.position.z =
        -0.02;

    g.add(handle);


    /* ---------- 柄尾 ---------- */

    const knob = toolPart(

        new THREE.SphereGeometry(
            0.04,
            8,
            6
        ),

        toolWoodDarkMat
    );

    knob.position.z =
        -0.38;

    g.add(knob);


    /* ---------- 手柄防滑缠绳 ---------- */

    for (let i = 0; i < 3; i++) {

        const wrap = toolPart(

            new THREE.TorusGeometry(
                0.034,
                0.009,
                6,
                12
            ),

            toolWoodDarkMat
        );

        wrap.position.z =
            -0.06 - i * 0.07;

        g.add(wrap);
    }


    /* ---------- 金属连接处 ---------- */

    const joint = toolPart(

        new THREE.CylinderGeometry(
            0.035,
            0.035,
            0.12,
            8
        ),

        toolMetalDarkMat
    );

    joint.rotation.x =
        Math.PI / 2;

    joint.position.z =
        0.38;

    g.add(joint);


    /* ---------- 铆钉 ---------- */

    const rivet = toolPart(

        new THREE.SphereGeometry(
            0.028,
            8,
            6
        ),

        toolMetalDarkMat
    );

    rivet.position.set(
        -0.02,
        0,
        0.40
    );

    g.add(rivet);


    /* ---------- 镰刀弯刃 ---------- */

    const blade = toolPart(

        new THREE.TorusGeometry(
            0.20,
            0.030,
            8,
            32,
            Math.PI * 0.90
        ),

        toolMetalMat
    );

    blade.position.set(
        -0.13,
        0,
        0.45
    );

    blade.rotation.set(
        Math.PI / 2,
        0,
        Math.PI / 2
    );

    g.add(blade);


    /* ---------- 刀尖 ---------- */

    const tip = toolPart(

        new THREE.ConeGeometry(
            0.035,
            0.14,
            6
        ),

        toolMetalMat
    );

    tip.position.set(
        -0.31,
        0,
        0.53
    );

    tip.rotation.z =
        -Math.PI / 2;

    g.add(tip);


    g.scale.setScalar(0.82);

    return g;
}


/* ==========================================================
   6. 锄头模型
   ========================================================== */

function buildHoe() {

    return buildHoeModel(0.76);
}


/* ==========================================================
   7. 水壶模型
   ========================================================== */

function buildWateringCan() {

    const g = new THREE.Group();


    /* ---------- 壶身 ---------- */

    const body = toolPart(

        new THREE.CylinderGeometry(
            0.17,
            0.19,
            0.28,
            20
        ),

        toolGreenMat
    );

    body.rotation.x =
        Math.PI ;

    g.add(body);


    /* ---------- 肩部装饰环 ---------- */

    const shoulder = toolPart(

        new THREE.TorusGeometry(
            0.105,
            0.012,
            6,
            18
        ),

        toolGreenDarkMat
    );

    shoulder.position.z =
        0.14;

    g.add(shoulder);


    /* ---------- 顶盖 ---------- */

    const lid = toolPart(

        new THREE.CylinderGeometry(
            0.10,
            0.11,
            0.04,
            10
        ),

        toolGreenDarkMat
    );

    lid.rotation.x =
        Math.PI / 2;

    lid.position.z =
        0.16;

    g.add(lid);


    /* ---------- 壶嘴 ---------- */

    const spout = toolPart(

        new THREE.CylinderGeometry(
            0.04,
            0.065,
            0.40,
            8
        ),

        toolGreenMat
    );

    spout.rotation.z =
        -Math.PI / 3;

    spout.position.set(
        0.26,
        0.05,
        0
    );

    g.add(spout);


    /* ---------- 喷水头 ---------- */

    const head = toolPart(

        new THREE.CylinderGeometry(
            0.09,
            0.045,
            0.075,
            10
        ),

        toolMetalDarkMat
    );

    head.position.set(
        0.43,
        0.15,
        0
    );

    head.rotation.z =
        -Math.PI / 3;

    g.add(head);


    /* ---------- 喷水孔 ---------- */

    const sprinkleGroup = new THREE.Group();

    sprinkleGroup.position.copy(
        head.position
    );

    sprinkleGroup.rotation.copy(
        head.rotation
    );

    g.add(sprinkleGroup);

    const holeSpots = [
        [0, 0],
        [0.032, 0.022],
        [-0.032, 0.022],
        [0.032, -0.022],
        [-0.032, -0.022],
        [0.05, 0],
        [-0.05, 0],
        [0, 0.05],
        [0, -0.05]
    ];

    holeSpots.forEach(spot => {

        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(
                0.007,
                8
            ),
            toolHoleMat
        );

        hole.position.set(
            spot[0],
            0.0376,
            spot[1]
        );

        hole.rotation.x =
            -Math.PI / 2;

        sprinkleGroup.add(hole);
    });


    /* ---------- 上方把手 ---------- */

    const handle = toolPart(

        new THREE.TorusGeometry(
            0.17,
            0.023,
            6,
            22,
            Math.PI
        ),

        toolGreenDarkMat
    );

    handle.position.set(
        0,
        0.14,
        0
    );

    handle.rotation.x =
        Math.PI / 2;

    g.add(handle);


    const waterIndicator =
        new THREE.Mesh(
            new THREE.CircleGeometry(0.105, 20),
            toolWaterMat
        );

    waterIndicator.position.set(
        0,
        0.151,
        0
    );

    waterIndicator.rotation.x =
        -Math.PI / 2;

    waterIndicator.visible =
        false;

    g.add(waterIndicator);
    g.userData.waterIndicator = waterIndicator;


    g.scale.setScalar(0.78);

    return g;
}


/* ==========================================================
   8. 创建工具
   核心结构和魔杖一致
   ========================================================== */

function createFarmTool({
    name,
    model,
    restRot
}) {

    const g =
        model();

    /*
       握持位置：固定在手部局部坐标，不再摆在世界里
    */

    g.position.set(
        TOOL_HAND_LOCAL.x,
        TOOL_HAND_LOCAL.y,
        TOOL_HAND_LOCAL.z
    );


    /*
       初始旋转
    */

    const initialRotation =
        restRot ||
        new THREE.Euler(
            0,
            0,
            0
        );

    g.rotation.copy(
        initialRotation
    );

    g.visible = false;

    toolHandRoot.add(g);


    /*
       状态
    */

    g.userData.toolState = {

        name: name,

        phase: 'idle',

        t0: 0,

        restRot:
            initialRotation.clone(),

        appear: 0,

        actionDone: false,

        /* 装备成功后由 triggerToolSwing() 写入，
           挥动打到一半时执行，具体效果交给调用方 */
        onImpact: null
    };


    farmTools.push(g);
    TOOLS_BY_NAME[name] = g;

    return g;
}

/* 供地块/作物系统调用：装备中的工具挥一下，动画打到一半时执行 onImpact */
const TOOLS_BY_NAME = {};
function triggerToolSwing(name, onImpact) {
    const tool = TOOLS_BY_NAME[name];
    if (!tool) return false;
    const s = tool.userData.toolState;
    if (s.phase !== 'idle') return false; // 正在挥的时候不重复触发
    s.phase = 'fly';
    s.t0 = performance.now() * 0.001;
    s.actionDone = false;
    s.onImpact = onImpact || null;
    return true;
}


/* ==========================================================
   9. 工具动画
   REST → FLY → USE → RETURN → REST
   ========================================================== */

function updateFarmTool(
    tool,
    dt,
    time
) {

    const s =
        tool.userData.toolState;


    if (!s) {
        return;
    }


    /*
       槽位选中的这把工具才慢慢显现，
       和魔杖 wandAppear 用同一套阻尼缓动
    */

    const wantVis =
        slotSel === TOOL_SLOT[s.name];

    s.appear +=
        ((wantVis ? 1 : 0) - s.appear) *
        Math.min(1, dt * 9);

    tool.visible =
        s.appear > 0.02;

    tool.scale.setScalar(
        0.5 + 0.5 * s.appear
    );

    if (!tool.visible) {
        return;
    }


    /*
       每个阶段时长
    */

    const FLY =
        0.55;

    const USE =
        0.65;

    const RETURN =
        0.55;


    const e =
        time - s.t0;


    /* ======================================================
       IDLE
       握持在手上，只有很小的呼吸感，等待被触发
       ====================================================== */

    if (
        s.phase === 'idle'
    ) {

        tool.position.set(
            TOOL_HAND_LOCAL.x,
            TOOL_HAND_LOCAL.y +
            Math.sin(time * 1.6) * 0.006,
            TOOL_HAND_LOCAL.z
        );

        tool.rotation.copy(
            s.restRot
        );

        return;
    }


    /* ======================================================
       FLY
       手上稍微抬起，准备挥动
       ====================================================== */

    if (
        s.phase === 'fly'
    ) {

        const k =
            toolSmooth(
                e / FLY
            );

        if (s.name === 'hoe') {
            tool.position.set(
                TOOL_HAND_LOCAL.x - 0.010 * k,
                TOOL_HAND_LOCAL.y + 0.052 * k,
                TOOL_HAND_LOCAL.z - 0.018 * k
            );
            tool.rotation.set(
                s.restRot.x + 0.38 * k,
                s.restRot.y - 0.16 * k,
                s.restRot.z + 0.26 * k
            );
        } else {
            tool.position.set(
                TOOL_HAND_LOCAL.x,
                TOOL_HAND_LOCAL.y +
                Math.sin(k * Math.PI) * 0.05,
                TOOL_HAND_LOCAL.z
            );

            /*
               飞行时稍微旋转
            */

            tool.rotation.y =
                s.restRot.y +
                Math.sin(
                    k *
                    Math.PI
                ) *
                0.45;
        }


        if (
            e >= FLY
        ) {

            s.phase =
                'use';

            s.t0 =
                time;

            s.actionDone =
                false;
        }

        return;
    }


    /* ======================================================
       USE
       工具动作（原地挥动，不再跨世界坐标飞行）
       ====================================================== */

    if (
        s.phase === 'use'
    ) {

        const raw =
            Math.min(
                e / USE,
                1
            );

        tool.position.set(
            TOOL_HAND_LOCAL.x,
            TOOL_HAND_LOCAL.y +
            Math.sin(raw * Math.PI) * 0.04,
            TOOL_HAND_LOCAL.z +
            Math.sin(raw * Math.PI) * 0.06
        );


        /* ==================================================
           锄头
           向下挥
           ================================================== */

        if (
            s.name === 'hoe'
        ) {

            const lift =
                raw < 0.25
                    ? toolSmooth(raw / 0.25)
                    : 1;

            const strike =
                raw < 0.25
                    ? 0
                    : raw < 0.62
                        ? toolSmooth((raw - 0.25) / 0.37)
                        : 1;

            const recoil =
                raw < 0.62
                    ? 0
                    : Math.sin(Math.min(1, (raw - 0.62) / 0.38) * Math.PI);

            tool.position.set(
                TOOL_HAND_LOCAL.x - 0.012 + 0.030 * strike,
                TOOL_HAND_LOCAL.y + 0.055 * lift + 0.020 * strike + 0.012 * recoil,
                TOOL_HAND_LOCAL.z - 0.020 + 0.080 * strike - 0.010 * recoil
            );

            tool.rotation.set(
                s.restRot.x + 0.42 * lift + 0.78 * strike - 0.12 * recoil,
                s.restRot.y - 0.10 * lift + 0.06 * strike,
                s.restRot.z + 0.22 * lift - 0.12 * strike + 0.05 * recoil
            );
        }


        /* ==================================================
           镰刀
           横向挥砍
           ================================================== */

        else if (
            s.name === 'sickle'
        ) {

            tool.rotation.set(

                s.restRot.x,

                s.restRot.y +
                Math.sin(
                    raw *
                    Math.PI
                ) *
                1.65,

                s.restRot.z -
                0.25 *
                Math.sin(
                    raw *
                    Math.PI
                )
            );
        }


        /* ==================================================
           水壶
           向前倾倒
           ================================================== */

        else if (
            s.name ===
            'wateringCan'
        ) {

            tool.rotation.set(

                s.restRot.x,

                s.restRot.y,

                s.restRot.z -
                Math.sin(
                    raw *
                    Math.PI
                ) *
                1.05
            );
        }


        /*
           动作中段真正执行功能
        */

        if (
            raw >= (s.name === 'hoe' ? 0.62 : 0.55) &&
            !s.actionDone
        ) {

            s.actionDone =
                true;

            performFarmToolAction(
                s.name,
                tool
            );
        }


        if (
            e >= USE
        ) {

            s.phase =
                'return';

            s.t0 =
                time;
        }

        return;
    }


    /* ======================================================
       RETURN
       挥完收回握持姿势
       ====================================================== */

    if (
        s.phase === 'return'
    ) {

        const k =
            toolSmooth(
                e / RETURN
            );


        tool.position.set(
            TOOL_HAND_LOCAL.x,
            TOOL_HAND_LOCAL.y +
            Math.sin(k * Math.PI) * 0.03,
            TOOL_HAND_LOCAL.z
        );


        /*
           旋转回原位
        */

        tool.rotation.x +=
            (
                s.restRot.x -
                tool.rotation.x
            ) *
            0.12;

        tool.rotation.y +=
            (
                s.restRot.y -
                tool.rotation.y
            ) *
            0.12;

        tool.rotation.z +=
            (
                s.restRot.z -
                tool.rotation.z
            ) *
            0.12;


        if (
            e >= RETURN
        ) {

            tool.position.set(
                TOOL_HAND_LOCAL.x,
                TOOL_HAND_LOCAL.y,
                TOOL_HAND_LOCAL.z
            );

            tool.rotation.copy(
                s.restRot
            );

            s.phase =
                'idle';

            s.actionDone =
                false;
        }
    }
}


/* ==========================================================
   10. 工具实际功能
   目前先留接口
   后面接农田
   ========================================================== */

function performFarmToolAction(
    name,
    tool
) {

    const s =
        tool.userData.toolState;

    /* 具体效果由 triggerToolSwing() 调用时传入的回调决定，
       这里只负责在挥动打到一半时执行它一次 */
    if (s.onImpact) {
        s.onImpact();
        s.onImpact = null;
    }
}


/* ==========================================================
   11. 创建三种工具
   这里控制工具初始位置
   ========================================================== */


/* ----------------------------------------------------------
   锄头
   ---------------------------------------------------------- */

const hoe =
    createFarmTool({
        name:
            'hoe',
        model:
            buildHoe,
        /*
           握在手里的初始姿态
        */
        restRot:
            new THREE.Euler(
                0,
                0,
                0.10
            )
    });
/* ----------------------------------------------------------
   镰刀
   ---------------------------------------------------------- */

const sickle =
    createFarmTool({
        name:
            'sickle',
        model:
            buildSickle,
        restRot:
            new THREE.Euler(
                0,
                0,
                -0.15
            )
    });
/* ----------------------------------------------------------
   水壶
   ---------------------------------------------------------- */

const wateringCan =
    createFarmTool({
        name:
            'wateringCan',
        model:
            buildWateringCan,
        restRot:
            new THREE.Euler(
                0,
                -0.50,
                0
            )
    });

setWateringCanFilled(false, true);
