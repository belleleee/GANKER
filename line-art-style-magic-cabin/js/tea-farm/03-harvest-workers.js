'use strict';


/* ==========================================================
   9. 采摘茶树
   ========================================================== */

function pickTeaPlant(
    state,
    silent
) {

    if (
        typeof window.isMainStoryFeatureUnlocked === 'function' &&
        !window.isMainStoryFeatureUnlocked('tea')
    ) {
        if (!silent && typeof window.requestMainStoryAccess === 'function') {
            window.requestMainStoryAccess('tea', () => pickTeaPlant(state, silent));
        }
        return;
    }

    /* ======================================================
       尚未重新成熟
       ====================================================== */

    if (
        !state.ready
    ) {

        if (
            !silent
        ) {

            SND.play(
                'toggle'
            );
        }


        const now =
            performance.now() *
            0.001;


        const remain =
            Math.max(
                1,

                Math.ceil(
                    state.regrowSeconds -
                    (
                        now -
                        state.pickedAt
                    )
                )
            );


        if (
            !silent
        ) {

            showHintOverride(
                '这株茶树刚采过，还要等待约 <b>' +
                remain +
                ' 秒</b>'
            );
        }


        return false;
    }


    /* ======================================================
       进入采摘后状态
       ====================================================== */

    state.ready =
        false;


    state.pickedAt =
        performance.now() *
        0.001;


    /* ======================================================
       嫩芽消失

       注意：
       老叶仍然保留。

       所以不会出现：
       “按 E → 整棵茶树消失”
       ====================================================== */

    state.buds.visible =
        false;


    /* ======================================================
       树冠稍微缩小

       用于表现刚刚被采摘过。
       ====================================================== */

    state.crown.scale.set(
        0.94,
        0.92,
        0.94
    );


    /* ======================================================
       更新交互提示
       ====================================================== */

    state.root.userData.aimLabel =
        '等待嫩芽重新长出';


    if (
        state.interactEntry
    ) {

        state.interactEntry.label =
            '等待嫩芽重新长出';
    }


    /* ======================================================
       获得茶青
       ====================================================== */

    teaLeafCount +=
        1;

    teaProcessState.raw += 1;
    if (typeof window.noteDailyEvent === 'function') {
        window.noteDailyEvent('teaPick', { raw: teaProcessState.raw });
    }

    const teaWeatherMult = typeof weatherYieldMultiplier === 'function'
        ? weatherYieldMultiplier(TEA_WEATHER_GOOD, TEA_WEATHER_BAD)
        : 1;
    const teaPickCoins = Math.max(1, Math.round(TEA_PICK_COINS * teaWeatherMult));

    if (
        window.addCabinCoins
    ) {

        window.addCabinCoins(
            teaPickCoins,
            false
        );
    }


    /* ======================================================
       音效
       ====================================================== */

    if (
        !silent
    ) {

        SND.play(
            'chim'
        );
    }


    /* ======================================================
       UI 提示
       ====================================================== */

    if (
        !silent
    ) {

        showHintOverride(
            '采到一份嫩茶青 · 茶篓 <b>' +
            teaLeafCount +
            '</b> · 金币 +' +
            '<b>' +
            teaPickCoins +
            '</b>' +
            (teaWeatherMult > 1 ? '（天气加成）' : teaWeatherMult < 1 ? '（天气减产）' : '')
        );
    }


    /* ======================================================
       生成采摘动画
       ====================================================== */

    if (
        !silent
    ) {

        spawnPickedTeaLeaves(
            state
        );
    }


    return true;
}


/* ==========================================================
   10. 采摘视觉反馈

   三片嫩叶从茶树飞向玩家。
   ========================================================== */

function spawnPickedTeaLeaves(
    state
) {

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const leaf =
            buildTeaLeaf(
                0.42,
                true
            );


        leaf.position.set(

            state.x +
            (
                i - 1
            ) *
            0.06,

            0.85 +
            i *
            0.025,

            state.z
        );


        scene.add(
            leaf
        );


        teaPickParticles.push({

            mesh:
                leaf,

            age:
                0,

            life:
                0.65 +
                i *
                0.08,

            phase:
                i *
                2.1
        });
    }
}


/* ==========================================================
   11. 茶场更新
   ========================================================== */

function updateTeaFarm(
    dt,
    time
) {

    updateTeaRoastStation(
        dt,
        time
    );

    /* ======================================================
       更新所有茶树
       ====================================================== */

    for (
        const state
        of teaPlants
    ) {

        /* --------------------------------------------------
           风吹树冠
           -------------------------------------------------- */

        state.crown.rotation.z =
            Math.sin(
                time *
                1.35 +
                state.phase
            ) *
            0.018;


        state.crown.rotation.x =
            Math.sin(
                time *
                1.05 +
                state.phase *
                0.7
            ) *
            0.010;


        /* ==================================================
           已成熟
           ================================================== */

        if (
            state.ready
        ) {

            state.buds.rotation.y =
                Math.sin(
                    time *
                    1.2 +
                    state.phase
                ) *
                0.035;


            /*
               成熟嫩芽轻微呼吸。

               不是强烈发光，
               避免破坏原项目线稿风格。
            */

            const pulse =
                1 +
                Math.sin(
                    time *
                    2.1 +
                    state.phase
                ) *
                0.025;


            state.buds.scale.setScalar(
                pulse
            );
        }


        /* ==================================================
           采摘后等待再生
           ================================================== */

        else {

            const elapsed =
                time -
                state.pickedAt;


            if (
                elapsed >=
                state.regrowSeconds
            ) {

                /* ------------------------------------------
                   重新成熟
                   ------------------------------------------ */

                state.ready =
                    true;


                state.buds.visible =
                    true;


                state.crown.scale.set(
                    1,
                    1,
                    1
                );


                state.root.userData.aimLabel =
                    '采摘嫩茶叶';


                if (
                    state.interactEntry
                ) {

                    state.interactEntry.label =
                        '采摘嫩茶叶';
                }


                /*
                   新芽刚出现时稍微缩小，
                   下一帧呼吸动画会恢复。
                */

                state.buds.scale.set(
                    0.72,
                    0.72,
                    0.72
                );


                SND.play(
                    'magic'
                );
            }
        }
    }


    /* ======================================================
       更新采摘叶片动画
       ====================================================== */

    for (
        let i =
            teaPickParticles.length -
            1;

        i >= 0;

        i--
    ) {

        const p =
            teaPickParticles[i];


        p.age +=
            dt;


        const k =
            Math.min(
                p.age /
                p.life,
                1
            );


        /*
           smoothstep
        */

        const e =
            k *
            k *
            (
                3 -
                2 *
                k
            );


        /* ==================================================
           目标位置：玩家身体上方
           ================================================== */

        const tx =
            player.pos.x;


        const ty =
            player.pos.y +
            0.75;


        const tz =
            player.pos.z;


        /* ==================================================
           X 方向
           ================================================== */

        p.mesh.position.x +=
            (
                tx -
                p.mesh.position.x
            ) *
            Math.min(
                1,
                dt *
                5.5
            );


        /* ==================================================
           Z 方向
           ================================================== */

        p.mesh.position.z +=
            (
                tz -
                p.mesh.position.z
            ) *
            Math.min(
                1,
                dt *
                5.5
            );


        /* ==================================================
           Y 方向 + 小弧线
           ================================================== */

        p.mesh.position.y +=

            (
                ty -
                p.mesh.position.y
            ) *
            Math.min(
                1,
                dt *
                4.2
            )

            +

            Math.sin(
                k *
                Math.PI
            ) *
            dt *
            0.35;


        /* ==================================================
           飞行旋转
           ================================================== */

        p.mesh.rotation.y +=
            dt *
            5;


        p.mesh.rotation.z +=
            dt *
            3;


        /* ==================================================
           接近玩家后缩小
           ================================================== */

        const sc =
            Math.max(
                0.001,
                1 -
                e
            );


        p.mesh.scale.setScalar(
            sc
        );


        /* ==================================================
           动画结束
           ================================================== */

        if (
            k >= 1
        ) {

            scene.remove(
                p.mesh
            );


            p.mesh.traverse(
                o => {

                    if (
                        o.geometry
                    ) {

                        o.geometry.dispose();
                    }
                }
            );


            teaPickParticles.splice(
                i,
                1
            );
        }
    }
}


/* ==========================================================
   11.5 茶场雇佣系统
   ========================================================== */

function chooseTeaWorkerPlant() {

    const worker =
        teaHireState.worker;


    const readyPlants =
        teaPlants.filter(
            p => p.ready
        );


    if (
        readyPlants.length <=
        0
    ) {

        return null;
    }


    if (
        !worker
    ) {

        return readyPlants[0];
    }


    return readyPlants.reduce(
        (
            best,
            plant
        ) => {

            const bd =
                Math.hypot(
                    best.x -
                    worker.position.x,
                    best.z -
                    worker.position.z
                );


            const pd =
                Math.hypot(
                    plant.x -
                    worker.position.x,
                    plant.z -
                    worker.position.z
                );


            return pd < bd
                ? plant
                : best;
        },
        readyPlants[0]
    );
}

function payTeaWorker(
    reason
) {

    if (
        !window.spendCabinCoins
    ) {

        showHintOverride(
            '金币系统还没准备好，暂时不能支付茶工工资'
        );

        return false;
    }


    if (
        !window.spendCabinCoins(
            TEA_WORKER_DAILY_WAGE,
            null
        )
    ) {

        return false;
    }


    teaHireState.lastPaidDay =
        currentTeaDay();


    teaHireState.striking =
        false;


    saveTeaHireStateNow();


    if (
        reason
    ) {

        showHintOverride(
            reason +
            ' · 日薪 -' +
            TEA_WORKER_DAILY_WAGE
        );
    }


    return true;
}

function hireTeaWorker() {

    if (
        typeof window.isMainStoryFeatureUnlocked === 'function' &&
        !window.isMainStoryFeatureUnlocked('tea')
    ) {
        if (typeof window.requestMainStoryAccess === 'function') {
            window.requestMainStoryAccess('tea', hireTeaWorker);
        }
        return;
    }

    if (
        !teaHireState.hired
    ) {

        teaHireState.hired =
            true;


        teaHireState.lastPaidDay =
            currentTeaDay();


        teaHireState.phase =
            'seek';


        updateTeaHireLabel();


        SND.play(
            'chim'
        );


        showHintOverride(
            '已雇佣茶工 · 日结工资 ' +
            TEA_WORKER_DAILY_WAGE
        );


        saveTeaHireStateNow();


        return;
    }


    if (
        teaHireState.striking
    ) {

        if (
            !payTeaWorker(
                '已补发工资，茶工恢复采摘'
            )
        ) {

            return;
        }


        teaHireState.phase =
            'seek';


        updateTeaHireLabel();


        SND.play(
            'chim'
        );


        return;
    }


    updateTeaHireLabel();


    showHintOverride(
        '茶工已在采摘 · 每日结算日薪 ' +
        TEA_WORKER_DAILY_WAGE
    );
}

function buildTeaWorkerTool() {

    const g =
        new THREE.Group();


    const handle =
        teaPart(
            new THREE.CylinderGeometry(
                0.012,
                0.015,
                0.30,
                7
            ),
            teaWoodMat
        );


    handle.rotation.x =
        Math.PI /
        2;


    g.add(
        handle
    );


    for (
        const sx of [
            -1,
            1
        ]
    ) {

        const blade =
            teaPart(
                new THREE.BoxGeometry(
                    0.11,
                    0.018,
                    0.045
                ),
                teaBudMat
            );


        blade.position.set(
            sx *
            0.045,
            0,
            0.16
        );


        blade.rotation.y =
            sx *
            0.52;


        g.add(
            blade
        );
    }


    g.visible =
        false;


    return g;
}

function buildTeaHireStation() {

    const x =
        TEA_FARM_CENTER.x -
        4.4;


    const z =
        TEA_FARM_CENTER.z +
        2.7;


    const g =
        new THREE.Group();


    g.position.set(
        x,
        0,
        z
    );


    scene.add(
        g
    );


    put(
        teaPart(
            new THREE.CylinderGeometry(
                0.04,
                0.05,
                0.95,
                7
            ),
            teaWoodDarkMat
        ),
        0,
        0.475,
        0,
        0,
        0,
        0,
        g
    );


    const sign =
        makeTeaHireLabel(
            '雇佣茶工'
        );


    sign.position.set(
        0,
        1.02,
        0
    );


    sign.rotation.y =
        Math.PI /
        2;


    g.add(
        sign
    );


    const worker =
        new THREE.Group();


    worker.position.set(
        x +
        0.7,
        0,
        z -
        0.22
    );


    const body =
        teaPart(
            new THREE.SphereGeometry(
                0.22,
                18,
                12
            ),
            teaLeafLightMat
        );


    body.scale.set(
        1,
        0.78,
        1
    );


    body.position.y =
        0.21;


    worker.add(
        body
    );


    const core =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.075,
                12,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0xdce9c0,

                transparent:
                    true,

                opacity:
                    0.58
            })
        );


    core.position.set(
        0,
        0.24,
        0
    );


    worker.add(
        core
    );


    for (
        const xEye of [
            -0.075,
            0.075
        ]
    ) {

        const eye =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.018,
                    8,
                    6
                ),
                LITMAT(
                    0x1b2420
                )
            );


        eye.position.set(
            xEye,
            0.30,
            0.18
        );


        worker.add(
            eye
        );
    }


    const shadow =
        new THREE.Mesh(
            new THREE.CircleGeometry(
                0.23,
                20
            ),
            new THREE.MeshBasicMaterial({
                color:
                    0x1e5a40,

                transparent:
                    true,

                opacity:
                    0.12,

                depthWrite:
                    false
            })
        );


    shadow.rotation.x =
        -Math.PI /
        2;


    shadow.position.y =
        0.012;


    worker.add(
        shadow
    );


    const toolRoot =
        new THREE.Group();


    toolRoot.position.set(
        0.20,
        0.28,
        0.14
    );


    teaHireState.tool =
        buildTeaWorkerTool();


    toolRoot.add(
        teaHireState.tool
    );


    worker.add(
        toolRoot
    );


    scene.add(
        worker
    );


    teaHireState.worker =
        worker;


    teaHireState.body =
        body;


    teaHireState.toolRoot =
        toolRoot;


    g.userData.aimLabel =
        teaHireLabel();


    regMagic(
        g,
        hireTeaWorker
    );


    const entry = {

        x:
            x,

        z:
            z,

        r:
            1.35,

        label:
            teaHireLabel(),

        act:
            hireTeaWorker
    };


    teaHireState.labelEntry =
        entry;


    interactables.push(
        entry
    );
}

function setTeaWorkerToolVisible(
    visible
) {

    if (
        teaHireState.tool
    ) {

        teaHireState.tool.visible =
            !!visible;
    }
}

function startTeaWorkerTask() {

    const plant =
        chooseTeaWorkerPlant();


    if (
        !plant
    ) {

        teaHireState.targetPlant =
            null;


        teaHireState.phase =
            'wait';


        teaHireState.actionTimer =
            1.2;


        setTeaWorkerToolVisible(
            false
        );


        return;
    }


    teaHireState.targetPlant =
        plant;


    teaHireState.phase =
        'move';


    setTeaWorkerToolVisible(
        true
    );
}

function animateTeaWorker(
    dt,
    time,
    moving
) {

    const worker =
        teaHireState.worker;


    if (
        !worker ||
        !teaHireState.body
    ) {

        return;
    }


    if (
        moving
    ) {

        teaHireState.pulse +=
            dt *
            7.0;
    }


    const breathe =
        1 +
        Math.sin(
            time *
            1.7
        ) *
        0.03;


    const stepSquash =
        moving
            ? 1 -
            0.10 *
            Math.max(
                0,
                Math.sin(
                    teaHireState.pulse -
                    0.9
                )
            )
            : 1;


    const actionSquash =
        teaHireState.phase ===
        'act'
            ? 1 +
            0.08 *
            Math.sin(
                teaHireState.actionTimer *
                Math.PI *
                5
            )
            : 1;


    const sy =
        Math.max(
            0.55,
            Math.min(
                1.25,
                0.78 *
                breathe *
                stepSquash *
                actionSquash
            )
        );


    const sxz =
        1 /
        Math.sqrt(
            sy
        );


    teaHireState.body.scale.set(
        sxz,
        sy,
        sxz
    );


    teaHireState.body.position.y =
        0.22 *
        sy;


    teaHireState.body.rotation.x =
        moving
            ? Math.sin(
                teaHireState.pulse
            ) *
            0.08
            : 0;


    teaHireState.body.rotation.z =
        moving
            ? Math.sin(
                teaHireState.pulse *
                0.5
            ) *
            0.08
            : 0;


    if (
        teaHireState.toolRoot
    ) {

        teaHireState.toolRoot.position.y =
            0.28 +
            Math.sin(
                time *
                1.6
            ) *
            0.006;


        teaHireState.toolRoot.rotation.set(
            0,
            0,
            0
        );


        if (
            teaHireState.phase ===
            'act'
        ) {

            const raw =
                Math.min(
                    1,
                    teaHireState.actionTimer /
                    0.9
                );


            const swing =
                Math.sin(
                    raw *
                    Math.PI
                );


            teaHireState.toolRoot.rotation.y =
                1.25 *
                swing;


            teaHireState.toolRoot.rotation.z =
                -0.35 *
                swing;
        }
    }
}

function settleTeaWorkerWage() {

    if (
        !teaHireState.hired ||
        teaHireState.striking
    ) {

        return;
    }


    const day =
        currentTeaDay();


    if (
        day <
        teaHireState.lastPaidDay
    ) {

        teaHireState.lastPaidDay =
            day;


        saveTeaHireStateNow();


        return;
    }


    if (
        day <=
        teaHireState.lastPaidDay
    ) {

        return;
    }


    if (
        window.spendCabinCoins &&
        window.spendCabinCoins(
            TEA_WORKER_DAILY_WAGE,
            null
        )
    ) {

        teaHireState.lastPaidDay =
            day;


        saveTeaHireStateNow();


        return;
    }


    teaHireState.striking =
        true;


    teaHireState.phase =
        'idle';


    teaHireState.targetPlant =
        null;


    setTeaWorkerToolVisible(
        false
    );


    showHintOverride(
        '金币不足，茶工罢工了 · 需要补发 ' +
        TEA_WORKER_DAILY_WAGE +
        ' 金币'
    );


    saveTeaHireStateNow();
}

function updateTeaHireSystem(
    dt,
    time
) {

    updateTeaHutDoors(
        dt
    );

    settleTeaWorkerWage();


    if (
        !teaHireState.hired ||
        teaHireState.striking
    ) {

        animateTeaWorker(
            dt,
            time,
            false
        );


        updateTeaHireLabel();


        return;
    }


    let moving =
        false;


    if (
        teaHireState.phase ===
        'idle' ||
        teaHireState.phase ===
        'seek'
    ) {

        startTeaWorkerTask();
    }


    if (
        teaHireState.phase ===
        'wait'
    ) {

        teaHireState.actionTimer -=
            dt;


        if (
            teaHireState.actionTimer <=
            0
        ) {

            teaHireState.phase =
                'seek';
        }
    } else if (
        teaHireState.phase ===
        'move'
    ) {

        const plant =
            teaHireState.targetPlant;


        const worker =
            teaHireState.worker;


        if (
            !plant ||
            !worker ||
            !plant.ready
        ) {

            teaHireState.phase =
                'seek';
        } else {

            const dx =
                plant.x -
                worker.position.x;


            const dz =
                plant.z -
                worker.position.z;


            const dist =
                Math.hypot(
                    dx,
                    dz
                );


            worker.rotation.y =
                Math.atan2(
                    dx,
                    dz
                );


            if (
                dist >
                0.42
            ) {

                const step =
                    Math.min(
                        dist,
                        TEA_WORKER_SPEED *
                        dt
                    );


                worker.position.x +=
                    dx /
                    dist *
                    step;


                worker.position.z +=
                    dz /
                    dist *
                    step;


                worker.position.y =
                    0;


                moving =
                    true;
            } else {

                teaHireState.phase =
                    'act';


                teaHireState.actionTimer =
                    0;
            }
        }
    } else if (
        teaHireState.phase ===
        'act'
    ) {

        teaHireState.actionTimer +=
            dt;


        if (
            teaHireState.actionTimer >=
            0.48 &&
            teaHireState.targetPlant
        ) {

            pickTeaPlant(
                teaHireState.targetPlant,
                true
            );


            teaHireState.targetPlant =
                null;
        }


        if (
            teaHireState.actionTimer >=
            0.9
        ) {

            teaHireState.phase =
                'seek';
        }
    }


    animateTeaWorker(
        dt,
        time,
        moving
    );


    updateTeaHireLabel();
}
