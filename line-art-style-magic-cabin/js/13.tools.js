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

const toolEdgeMat = new THREE.LineBasicMaterial({
    color: 0x5e5143
});


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


    /* ---------- 镰刀弯刃 ---------- */

    const blade = toolPart(

        new THREE.TorusGeometry(
            0.20,
            0.024,
            6,
            28,
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


    return g;
}


/* ==========================================================
   6. 锄头模型
   ========================================================== */

function buildHoe() {

    const g = new THREE.Group();


    /* ---------- 长柄 ---------- */

    const handle = toolPart(

        new THREE.CylinderGeometry(
            0.026,
            0.034,
            0.90,
            8
        ),

        toolWoodMat
    );

    handle.rotation.x =
        Math.PI / 2;

    g.add(handle);


    /* ---------- 柄尾 ---------- */

    const knob = toolPart(

        new THREE.SphereGeometry(
            0.038,
            8,
            6
        ),

        toolWoodDarkMat
    );

    knob.position.z =
        -0.46;

    g.add(knob);


    /* ---------- 金属连接件 ---------- */

    const joint = toolPart(

        new THREE.CylinderGeometry(
            0.035,
            0.035,
            0.14,
            8
        ),

        toolMetalDarkMat
    );

    joint.rotation.x =
        Math.PI / 2;

    joint.position.z =
        0.46;

    g.add(joint);


    /* ---------- 锄刃 ---------- */

    const blade = toolPart(

        new THREE.BoxGeometry(
            0.34,
            0.055,
            0.16
        ),

        toolMetalMat
    );

    blade.position.set(
        0,
        -0.09,
        0.50
    );

    blade.rotation.x =
        -0.38;

    g.add(blade);


    return g;
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

            tool.rotation.set(
                s.restRot.x -
                Math.sin(
                    raw *
                    Math.PI
                ) *
                1.25,

                s.restRot.y,

                s.restRot.z +
                0.18 *
                Math.sin(
                    raw *
                    Math.PI
                )
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
            raw >= 0.55 &&
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