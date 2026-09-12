'use strict';
/* ==========================================================
   FARM CROPS - 简单成长系统
   ========================================================== */

const crops = [];

const CROP_GREEN = LITMAT(0x8fbf78);
const CROP_GREEN_DARK = LITMAT(0x6f9e63);
const CROP_ROOT = LITMAT(0xd88963);


/* 清空 Group 里的旧模型 */
function clearGroup(g) {
    while (g.children.length > 0) {
        const child = g.children[0];
        g.remove(child);

        child.traverse(o => {
            if (o.geometry) o.geometry.dispose();
        });
    }
}


/* ==========================================================
   根据 stage 绘制作物
   stage 0：种子/刚播种
   stage 1：小芽
   stage 2：幼苗
   stage 3：成熟
   ========================================================== */

const CROP_ROOT_CACHE = {};
function cropRootMaterial(cropType) {
    const type = cropType || 'turnip';
    if (CROP_ROOT_CACHE[type]) return CROP_ROOT_CACHE[type];
    const hex = (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[type]) ? CROP_TYPES[type].rootColor : 0xd88963;
    const mat = LITMAT(hex);
    CROP_ROOT_CACHE[type] = mat;
    return mat;
}

function buildTurnipStage(holder, stage, cropType) {

    clearGroup(holder);

    /* ---------- stage 0：刚播种 ---------- */
    if (stage === 0) {

        const seed = edge(
            new THREE.SphereGeometry(0.025, 8, 6)
        );

        seed.scale.y = 0.5;

        put(
            seed,
            0, 0.02, 0,
            0, 0, 0,
            holder
        );
    }


    /* ---------- stage 1：刚发芽 ---------- */
    else if (stage === 1) {

        // 小茎
        const stem = edge(
            new THREE.CylinderGeometry(
                0.012,
                0.015,
                0.12,
                6
            )
        );

        put(
            stem,
            0, 0.06, 0,
            0, 0, 0,
            holder
        );


        // 左叶
        const leaf1 = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.07,
                8,
                6
            ),
            CROP_GREEN
        );

        leaf1.scale.set(
            1,
            0.35,
            0.55
        );

        leaf1.position.set(
            -0.045,
            0.12,
            0
        );

        leaf1.rotation.z =
            0.45;

        holder.add(leaf1);


        // 右叶
        const leaf2 =
            leaf1.clone();

        leaf2.position.x =
            0.045;

        leaf2.rotation.z =
            -0.45;

        holder.add(leaf2);
    }


    /* ---------- stage 2：幼苗 ---------- */
    else if (stage === 2) {

        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.018,
                0.022,
                0.22,
                6
            ),
            CROP_GREEN_DARK
        );

        stem.position.y =
            0.11;

        holder.add(stem);


        for (let i = 0; i < 4; i++) {

            const leaf =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        0.10,
                        8,
                        6
                    ),
                    CROP_GREEN
                );

            leaf.scale.set(
                1,
                0.30,
                0.55
            );

            const a =
                i / 4 *
                Math.PI * 2;

            leaf.position.set(
                Math.cos(a) * 0.07,
                0.20 +
                (i % 2) * 0.025,
                Math.sin(a) * 0.07
            );

            leaf.rotation.y =
                -a;

            leaf.rotation.z =
                0.35;

            holder.add(leaf);
        }
    }


    /* ---------- stage 3：成熟萝卜 ---------- */
    else {

        // 萝卜根
        const root = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.10,
                10,
                8
            ),
            cropRootMaterial(cropType)
        );

        root.scale.set(
            0.85,
            1.15,
            0.85
        );

        root.position.y =
            0.08;

        holder.add(root);


        // 叶子
        for (let i = 0; i < 5; i++) {

            const leaf =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        0.12,
                        8,
                        6
                    ),
                    i % 2
                        ? CROP_GREEN
                        : CROP_GREEN_DARK
                );

            leaf.scale.set(
                0.65,
                1,
                0.30
            );

            const a =
                i / 5 *
                Math.PI * 2;

            leaf.position.set(
                Math.cos(a) * 0.055,
                0.21,
                Math.sin(a) * 0.055
            );

            leaf.rotation.z =
                (Math.random() - 0.5)
                * 0.45;

            leaf.rotation.y =
                a;

            holder.add(leaf);
        }
    }
}


/* ==========================================================
   创建一株作物
   ========================================================== */

function setTurnipStage(crop, stage) {
    const nextStage = Math.max(0, Math.min(3, Math.trunc(stage)));
    crop.userData.crop.stage = nextStage;
    buildTurnipStage(
        crop,
        nextStage,
        crop.userData.crop.cropType
    );
}

function createTurnip(x, y, z, parent, cropType) {

    const crop = new THREE.Group();

    crop.position.set(
        x,
        y,
        z
    );

    (parent || scene).add(crop);


    crop.userData.crop = {
        stage: 0,
        plantedAt: gameSec,
        cropType: cropType || 'turnip'
    };


    buildTurnipStage(
        crop,
        0,
        crop.userData.crop.cropType
    );

    crops.push(crop);

    return crop;
}

function removeTurnip(crop) {
    if (!crop) return;
    clearGroup(crop);
    if (crop.parent) crop.parent.remove(crop);
    const idx = crops.indexOf(crop);
    if (idx >= 0) crops.splice(idx, 1);
}
