'use strict';


/* ==========================================================
   12. 茶场碰撞

   使用原 player-controller 的 solidBoxes。

   不给每棵茶树放一个大方块，
   而是一整条茶垄一条碰撞带。

   玩家可以：

       茶垄
   ============

       玩家道路

   ============

       茶垄

   在茶垄之间自由移动。
   ========================================================== */

function addTeaFarmCollisions() {

    if (
        typeof solidBoxes ===
        'undefined'
    ) {

        return;
    }


    /* ======================================================
       茶垄碰撞

       茶园现在是平面地块，茶树本身保持可穿行采摘，
       不再把每一行茶垄当成实心墙。
       ====================================================== */


    /* ======================================================
       木牌碰撞
       ====================================================== */

    solidBoxes.push({

        x1:
            TEA_FARM_CENTER.x -
            3.78,

        z1:
            TEA_FARM_CENTER.z +
            4.20,

        x2:
            TEA_FARM_CENTER.x +
            -1.62,

        z2:
            TEA_FARM_CENTER.z +
            4.50
    });


    /* ======================================================
       制茶小屋碰撞
       ====================================================== */

    const hx =
        TEA_FARM_CENTER.x +
        TEA_HUT_OFFSET.x;

    const hz =
        TEA_FARM_CENTER.z +
        TEA_HUT_OFFSET.z;

    const t =
        0.22;

    const left =
        hx +
        TEA_HUT_COLLISION.left;

    const right =
        hx +
        TEA_HUT_COLLISION.right;

    const back =
        hz +
        TEA_HUT_COLLISION.back;

    const front =
        hz +
        TEA_HUT_COLLISION.front;

    const doorLeft =
        hx +
        TEA_HUT_COLLISION.doorCenter -
        TEA_HUT_COLLISION.doorHalf;

    const doorRight =
        hx +
        TEA_HUT_COLLISION.doorCenter +
        TEA_HUT_COLLISION.doorHalf;

    solidBoxes.push({
        x1:
            left,
        z1:
            back,
        x2:
            right,
        z2:
            back +
            t
    });

    solidBoxes.push({
        x1:
            left,
        z1:
            back,
        x2:
            left +
            t,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            right -
            t,
        z1:
            back,
        x2:
            right,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            left,
        z1:
            front -
            t,
        x2:
            doorLeft,
        z2:
            front
    });

    solidBoxes.push({
        x1:
            doorRight,
        z1:
            front -
            t,
        x2:
            right,
        z2:
            front
    });

}


/* ==========================================================
   13. 创建整个茶场
   ========================================================== */

function buildTeaFarm() {

    /* ======================================================
       地面 / 茶垄 / 木牌 / 茶篓
       ====================================================== */

    buildTeaFieldBase();


    /* ======================================================
       24 株茶树
       ====================================================== */

    for (
        let row = 0;
        row < TEA_ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < TEA_COLS;
            col++
        ) {

            const x =
                TEA_FARM_CENTER.x +

                (
                    col -
                    (
                        TEA_COLS - 1
                    ) /
                    2
                ) *
                TEA_COL_GAP;


            const z =
                TEA_FARM_CENTER.z +

                (
                    row -
                    (
                        TEA_ROWS - 1
                    ) /
                    2
                ) *
                TEA_ROW_GAP;


            buildTeaPlant(

                x,

                z,

                row *
                TEA_COLS +
                col,

                0
            );
        }
    }


    /* ======================================================
       茶工雇佣牌和角色
       ====================================================== */

    buildTeaHireStation();


    /* ======================================================
       碰撞
       ====================================================== */

    addTeaFarmCollisions();
}


/* ==========================================================
   14. 初始化
   ========================================================== */

buildTeaFarm();


/* ==========================================================
   15. 存档接口

   不直接修改 15-app-shell.js。

   暴露接口给现有存档系统调用。
   ========================================================== */


/* ==========================================================
   保存茶场
   ========================================================== */

window.captureTeaFarmState =
    function () {

        const now =
            performance.now() *
            0.001;


        const result = {

            /* ------------------------------------------------
               已采茶青数量
               ------------------------------------------------ */

            leafCount:
                teaLeafCount,


            /* ------------------------------------------------
               制茶流程库存（生茶青/晒干/炒制/成品批次）
               ------------------------------------------------ */

            process:
                {
                    raw: teaProcessState.raw,
                    dried: teaProcessState.dried,
                    roasted: teaProcessState.roasted,
                    finished: teaProcessState.finished
                },


            /* ------------------------------------------------
               每株茶树状态
               ------------------------------------------------ */

            plants:
                teaPlants.map(
                    p => ({

                        ready:
                            p.ready,

                        remaining:
                            p.ready
                                ? 0
                                : Math.max(

                                    0,

                                    p.regrowSeconds -

                                    (
                                        now -
                                        p.pickedAt
                                    )
                                )
                    })
                )
        };


        result.hire =
            {
                hired:
                    teaHireState.hired,

                striking:
                    teaHireState.striking,

                lastPaidDay:
                    teaHireState.lastPaidDay
            };


        return result;
    };


/* ==========================================================
   恢复茶场
   ========================================================== */

window.applyTeaFarmState =
    function (
        raw,
        elapsedRealSeconds = 0
    ) {

        if (
            !raw ||
            typeof raw !==
            'object'
        ) {

            return;
        }


        /* ==================================================
           恢复茶青数量
           ================================================== */

        teaLeafCount =
            Math.max(

                0,

                Math.min(

                    999999,

                    Math.trunc(
                        Number(
                            raw.leafCount
                        ) ||
                        0
                    )
                )
            );

        const proc = raw.process || {};
        teaProcessState = {
            raw: Math.max(0, Math.min(999999, Math.trunc(Number(proc.raw) || 0))),
            dried: Math.max(0, Math.min(999999, Math.trunc(Number(proc.dried) || 0))),
            roasted: Math.max(0, Math.min(999999, Math.trunc(Number(proc.roasted) || 0))),
            finished: Math.max(0, Math.min(999999, Math.trunc(Number(proc.finished) || 0)))
        };


        if (
            raw.hire
        ) {

            teaHireState.hired =
                !!(
                    raw.hire.hired ||
                    raw.hire.active
                );


            teaHireState.striking =
                !!raw.hire.striking;


            teaHireState.lastPaidDay =
                Math.max(
                    0,
                    Math.trunc(
                        Number(
                            raw.hire.lastPaidDay
                        ) ||
                        currentTeaDay()
                    )
                );


            teaHireState.targetPlant =
                null;


            teaHireState.phase =
                teaHireState.hired &&
                !teaHireState.striking
                    ? 'seek'
                    : 'idle';


            setTeaWorkerToolVisible(
                false
            );


            updateTeaHireLabel();
        }


        /* ==================================================
           没有茶树存档
           ================================================== */

        if (
            !Array.isArray(
                raw.plants
            )
        ) {

            return;
        }


        const now =
            performance.now() *
            0.001;


        /* ==================================================
           恢复每株茶树
           ================================================== */

        raw.plants.forEach(
            (
                saved,
                i
            ) => {

                const p =
                    teaPlants[i];


                if (
                    !p ||
                    !saved
                ) {

                    return;
                }


                const remaining =
                    Math.max(

                        0,

                        Math.min(

                            p.regrowSeconds,

                            Number(
                                saved.remaining
                            ) ||
                            0
                        ) -
                        elapsedRealSeconds
                    );


                p.ready =
                    saved.ready === true ||
                    remaining <= 0;


                /* ==========================================
                   已成熟
                   ========================================== */

                if (
                    p.ready
                ) {

                    p.pickedAt =
                        0;


                    p.buds.visible =
                        true;


                    p.crown.scale.set(
                        1,
                        1,
                        1
                    );


                    p.root.userData.aimLabel =
                        '采摘嫩茶叶';


                    if (
                        p.interactEntry
                    ) {

                        p.interactEntry.label =
                            '采摘嫩茶叶';
                    }
                }


                /* ==========================================
                   尚未成熟
                   ========================================== */

                else {

                    p.pickedAt =

                        now -

                        (
                            p.regrowSeconds -
                            remaining
                        );


                    p.buds.visible =
                        false;


                    p.crown.scale.set(
                        0.94,
                        0.92,
                        0.94
                    );


                    p.root.userData.aimLabel =
                        '等待嫩芽重新长出';


                    if (
                        p.interactEntry
                    ) {

                        p.interactEntry.label =
                            '等待嫩芽重新长出';
                    }
                }
            }
        );


        if (
            raw.hire
        ) {

            teaHireState.hired =
                !!(
                    raw.hire.hired ||
                    raw.hire.active
                );


            teaHireState.striking =
                !!raw.hire.striking;


            teaHireState.lastPaidDay =
                Math.max(
                    0,
                    Math.trunc(
                        Number(
                            raw.hire.lastPaidDay
                        ) ||
                        currentTeaDay()
                    )
                );


            teaHireState.targetPlant =
                null;


            teaHireState.phase =
                teaHireState.hired &&
                !teaHireState.striking
                    ? 'seek'
                    : 'idle';


            setTeaWorkerToolVisible(
                false
            );


            updateTeaHireLabel();
        }
    };


/* ==========================================================
   16. 茶青数量读取接口
   ========================================================== */

window.getTeaLeafCount =
    function () {

        return teaLeafCount;
    };


/* ==========================================================
   17. 茶青数量修改接口

   后面：
   制茶系统 / 商店 / 茶馆
   都可以调用这个接口。
   ========================================================== */

window.setTeaLeafCount =
    function (
        n
    ) {

        teaLeafCount =
            Math.max(

                0,

                Math.min(

                    999999,

                    Math.trunc(
                        Number(
                            n
                        ) ||
                        0
                    )
                )
            );
    };
