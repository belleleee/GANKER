'use strict';
            /* ========================================================== */
            /* 18.10 垃圾桶 / 抽纸盒 / 衣柜（二楼） */
            /* ========================================================== */
            function cbox(w, h, d, col) {
                const grp = new THREE.Group();
                const g = new THREE.BoxGeometry(w, h, d);
                grp.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), MAT));
                return grp;
            }

            function crboxCol(w, h, d, r, col) {
                const grp = new THREE.Group();
                const g = roundBoxGeo(w, h, d, r);
                grp.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 12), MAT));
                return grp;
            }

            function crumpleBall(r) {
                const grp = new THREE.Group();
                const g = jitterGeo(new THREE.SphereGeometry(r, 10, 8), r * 0.15);
                grp.add(new THREE.Mesh(g, LITMAT(0xffffff, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), MAT));
                return grp;
            }

            function arcPos(a, b, t, h) {
                const p = a.clone().lerp(b, t);
                p.y += Math.sin(Math.PI * t) * h;
                return p;
            }
            const wobblers = [];

            function regWobble(g) {
                g.userData.wob = { amp: 0, t: 0 };
                wobblers.push(g);
                regMagic(g, function () {
                    g.userData.wob.amp = 1;
                    g.userData.wob.t = 0;
                });
            }

            function updateWobblers(dt) {
                for (const g of wobblers) {
                    const w = g.userData.wob;
                    if (w.amp < 0.005) {
                        g.rotation.z = 0;
                        continue;
                    }
                    w.t += dt;
                    w.amp *= Math.pow(0.10, dt);
                    g.rotation.z = Math.sin(w.t * 13) * 0.42 * w.amp;
                }
            }

            /* ========================================================== */
            /* 衣柜 */
            /* ========================================================== */
            const WD_W = 1.25;
            const WD_D = 0.58;
            const WD_H = 1.95;
            const WD_COL = 0xc9b391;
            const WD_DARK = 0x9a7d55;
            const wardrobeG = new THREE.Group();
            wardrobeG.position.set(-1.40, FY, 3.55);
            wardrobeG.rotation.y = Math.PI;
            scene.add(wardrobeG);
            {
                put(cbox(WD_W, WD_H, 0.04, WD_COL), 0, WD_H / 2, -WD_D / 2 + 0.02, 0, 0, 0, wardrobeG);
                put(cbox(0.04, WD_H, WD_D, WD_COL), -WD_W / 2 + 0.02, WD_H / 2, 0, 0, 0, 0, wardrobeG);
                put(cbox(0.04, WD_H, WD_D, WD_COL), WD_W / 2 - 0.02, WD_H / 2, 0, 0, 0, 0, wardrobeG);
                put(cbox(WD_W, 0.04, WD_D, WD_COL), 0, WD_H - 0.02, 0, 0, 0, 0, wardrobeG);
                put(cbox(WD_W, 0.45, WD_D, WD_COL), 0, 0.225, 0, 0, 0, 0, wardrobeG);
                const wardrobeDrawerG = new THREE.Group();
                wardrobeDrawerG.position.set(0, 0.20, WD_D / 2 - 0.10);
                wardrobeG.add(wardrobeDrawerG);
                {
                    const p = crboxCol(WD_W - 0.08, 0.35, 0.05, 0.01, WD_DARK);
                    p.position.set(0, 0, 0.05);
                    wardrobeDrawerG.add(p);
                    const knob = edge(new THREE.CylinderGeometry(0.017, 0.017, 0.03, 8));
                    knob.rotation.x = Math.PI / 2;
                    knob.position.set(0, 0, 0.092);
                    wardrobeDrawerG.add(knob);
                    const drawerInsideMat = new THREE.MeshBasicMaterial({ color: WD_DARK, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                    const insideGeo = new THREE.BoxGeometry(WD_W - 0.12, 0.25, WD_D - 0.2);
                    const inside = new THREE.Group();
                    inside.add(new THREE.Mesh(insideGeo, drawerInsideMat));
                    inside.add(new THREE.LineSegments(new THREE.EdgesGeometry(insideGeo), MAT));
                    inside.position.set(0, 0, -0.10);
                    wardrobeDrawerG.add(inside);
                }
                regSlide(wardrobeDrawerG, 'z', 0.25);
                regMagic(wardrobeDrawerG, () => {
                    const sl = wardrobeDrawerG.userData.slide;
                    if (!sl.open && !doorsBothOpen()) { SND.play('ui'); return; }
                    sl.open = !sl.open;
                });
                const ROD_Y = 1.50;
                const ROD_Z = -0.05;
                for (const sx of [-1, 1]) {
                    put(cbox(0.07, 0.07, 0.07, WD_DARK), sx * (WD_W / 2 - 0.06), ROD_Y, ROD_Z, 0, 0, 0, wardrobeG);
                }
                const rod = edge(new THREE.CylinderGeometry(0.016, 0.016, WD_W - 0.10, 8));
                rod.rotation.z = Math.PI / 2;
                rod.position.set(0, ROD_Y, ROD_Z);
                wardrobeG.add(rod);

                function makeHanger(hx, clothCol) {
                    const hg = new THREE.Group();
                    hg.position.set(hx, ROD_Y, ROD_Z);
                    hg.rotation.y = Math.PI / 2;
                    wardrobeG.add(hg);
                    const hook = edge(new THREE.TorusGeometry(0.026, 0.005, 6, 12));
                    hg.add(hook);
                    put(edge(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 6)), 0, -0.04, 0, 0, 0, 0, hg);
                    logBetween([0, -0.065, 0], [-0.15, -0.17, 0], 0.007, hg);
                    logBetween([0, -0.065, 0], [0.15, -0.17, 0], 0.007, hg);
                    logBetween([-0.15, -0.17, 0], [0.15, -0.17, 0], 0.007, hg);
                    if (clothCol !== null && clothCol !== undefined) {
                        const cl = crboxCol(0.27, 0.30, 0.03, 0.035, clothCol);
                        cl.position.set(0, -0.34, 0);
                        hg.add(cl);
                        hg.add(iline([[-0.05, -0.20, 0.018], [0, -0.23, 0.018], [0.05, -0.20, 0.018]]));
                    }
                    regWobble(hg);
                }
                makeHanger(-0.40, 0xe3b3b8);
                makeHanger(-0.12, null);
                makeHanger(0.34, 0xa9c6e2);
                const stackCols = [0xd9a5a0, 0xbcd4b0, 0xe6d9b8, 0xb9aede];
                let syL = 0.45;
                for (let i = 0; i < 4; i++) {
                    const w = 0.35 - (i % 2) * 0.03;
                    const d = 0.32 - (i % 2) * 0.02;
                    const c = crboxCol(w, 0.07, d, 0.032, stackCols[i % stackCols.length]);
                    c.position.set(-0.28, syL + 0.035, (i % 2 ? -0.012 : 0.010));
                    c.rotation.y = (i % 2 ? 0.05 : -0.06);
                    wardrobeG.add(c);
                    syL += 0.07;
                }
                let syR = 0.45;
                for (let i = 0; i < 4; i++) {
                    const w = 0.35 - (i % 2) * 0.03;
                    const d = 0.32 - (i % 2) * 0.02;
                    const c = crboxCol(w, 0.07, d, 0.032, stackCols[(i + 2) % stackCols.length]);
                    c.position.set(0.28, syR + 0.035, (i % 2 ? -0.012 : 0.010));
                    c.rotation.y = (i % 2 ? 0.05 : -0.06);
                    wardrobeG.add(c);
                    syR += 0.07;
                }
                const doorW = WD_W / 2 - 0.02;
                const doorH = WD_H - 0.10;
                const dl = new THREE.Group();
                dl.userData = { base: 0, delta: -1.8 };
                dl.position.set(-WD_W / 2 + 0.02, WD_H / 2, WD_D / 2 + 0.025);
                wardrobeG.add(dl);
                {
                    const p = crboxCol(doorW - 0.03, doorH, 0.035, 0.012, WD_COL);
                    p.position.set(doorW / 2, 0, 0);
                    dl.add(p);
                    const hw = doorW / 2 - 0.10, hh = doorH / 2 - 0.14;
                    dl.add(iline([
                        [doorW / 2 - hw, -hh, 0.022], [doorW / 2 + hw, -hh, 0.022],
                        [doorW / 2 + hw, hh, 0.022], [doorW / 2 - hw, hh, 0.022],
                        [doorW / 2 - hw, -hh, 0.022]
                    ]));
                    const knob = edge(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8));
                    knob.rotation.x = Math.PI / 2;
                    knob.position.set(doorW - 0.10, 0, 0.038);
                    dl.add(knob);
                }
                registerHinge(dl);
                const dr = new THREE.Group();
                dr.userData = { base: 0, delta: 1.8 };
                dr.position.set(WD_W / 2 - 0.02, WD_H / 2, WD_D / 2 + 0.025);
                wardrobeG.add(dr);
                {
                    const p = crboxCol(doorW - 0.03, doorH, 0.035, 0.012, WD_COL);
                    p.position.set(-doorW / 2, 0, 0);
                    dr.add(p);
                    const hw = doorW / 2 - 0.10, hh = doorH / 2 - 0.14;
                    dr.add(iline([
                        [-doorW / 2 - hw, -hh, 0.022], [-doorW / 2 + hw, -hh, 0.022],
                        [-doorW / 2 + hw, hh, 0.022], [-doorW / 2 - hw, hh, 0.022],
                        [-doorW / 2 - hw, -hh, 0.022]
                    ]));
                    const knob = edge(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 8));
                    knob.rotation.x = Math.PI / 2;
                    knob.position.set(-(doorW - 0.10), 0, 0.038);
                    dr.add(knob);
                }
                registerHinge(dr);
                /* 关衣柜门时若底部抽屉还开着，先收抽屉再关门，避免穿模；抽屉必须两扇门都开才能拉出 */
                const doorsBothOpen = () => dl.userData.spring.open && dr.userData.spring.open && !dl.userData.closing && !dr.userData.closing;
                const closeWardrobeDoor = door => {
                    const s = door.userData.spring;
                    if (!s.open || !wardrobeDrawerG.userData.slide.open) { s.open = !s.open; SND.play('toggle'); return; }
                    wardrobeDrawerG.userData.slide.open = false; SND.play('toggle');
                    door.userData.closing = true;
                    setTimeout(() => { door.userData.closing = false; s.open = false; SND.play('toggle'); }, 420);
                };
                dl.userData.onToggle = () => closeWardrobeDoor(dl);
                dr.userData.onToggle = () => closeWardrobeDoor(dr);
                dl.userData.aimLabel = dr.userData.aimLabel = '开 / 关衣柜门';
                dl.userData.bounce = dr.userData.bounce = true; /* 关门回弹打到关闭位反弹，不向内穿进柜体 */
                wardrobeDrawerG.userData.aimLabel = '开 / 关抽屉';
            }

            /* ========================================================== */
            /* 18.11 墙钩挎包 / 置物箱与魔女帽 / 可推拉小凳子 */
            /* ========================================================== */
            const wallHookZ = 3.825;
            const hookBaseY = FY + 1.38;
            const bagHookX = 0.15;

            // J 形墙钩：钩身向下再向上勾起，开口朝上
            function makeWallHook(x, y, z) {
                const g = new THREE.Group();
                put(cbox(0.06, 0.09, 0.028, 0x9a7d55), 0, 0.03, 0.014, 0, 0, 0, g);
                const hookCurve = new THREE.CatmullRomCurve3([
                    V(0, 0.05, 0.012),
                    V(0, 0.015, -0.008),
                    V(0, -0.02, -0.038),
                    V(0, -0.06, -0.055),
                    V(0, -0.048, -0.078),
                    V(0, -0.012, -0.082)
                ]);
                const tubeGeo = new THREE.TubeGeometry(hookCurve, 32, 0.008, 6, false);
                const hookMat = LITMAT(0x5a4128, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                g.add(new THREE.Mesh(tubeGeo, hookMat));
                g.add(new THREE.LineSegments(new THREE.EdgesGeometry(tubeGeo, 20), MAT));
                const tip = edge(new THREE.SphereGeometry(0.011, 8, 6));
                tip.position.set(0, -0.012, -0.082);
                g.add(tip);
                g.position.set(x, y, z);
                scene.add(g);
                return g;
            }

            makeWallHook(bagHookX, hookBaseY, wallHookZ);

            /* —— 挎包：两条绷紧的背带从包顶两角拉向钩上挂环，构成三角 —— */
            const bagG = new THREE.Group();
            const bagHookPt = V(bagHookX, hookBaseY - 0.055, wallHookZ - 0.05);
            const BAG_DROP = 0.50;
            bagG.position.set(bagHookPt.x, bagHookPt.y - BAG_DROP, bagHookPt.z + 0.02);
            scene.add(bagG);
            {
                const strapMat = LITMAT(0x4a2a1a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

                // 包身
                bagG.add(crboxCol(0.24, 0.24, 0.10, 0.03, 0x8a5a3a));
                // 包盖
                const flap = crboxCol(0.245, 0.018, 0.108, 0.012, 0x6a3a2a);
                flap.position.y = 0.125;
                bagG.add(flap);
                const front = crboxCol(0.245, 0.095, 0.016, 0.012, 0x6a3a2a);
                front.position.set(0, 0.072, 0.051);
                bagG.add(front);
                // 金色搭扣
                put(cbox(0.048, 0.03, 0.014, 0xc9a05a), 0, 0.052, 0.062, 0, 0, 0, bagG);
                // 缝线装饰
                bagG.add(iline([[-0.10, -0.11, 0.052], [0.10, -0.11, 0.052]]));
                bagG.add(iline([[-0.10, -0.02, 0.052], [0.10, -0.02, 0.052]]));

                // 顶部挂环
                const hookLocal = V(0, BAG_DROP, -0.02);
                const ringGeo = new THREE.TorusGeometry(0.022, 0.006, 6, 14);
                const ring = new THREE.Mesh(ringGeo, strapMat);
                ring.add(new THREE.LineSegments(new THREE.EdgesGeometry(ringGeo), MAT));
                ring.rotation.y = Math.PI / 2;
                ring.position.copy(hookLocal);
                bagG.add(ring);

                // 两条绷紧的背带
                const strapTop = V(0, hookLocal.y - 0.02, hookLocal.z);
                function tautStrapGeo(x0) {
                    const from = V(x0, 0.115, 0.015);
                    const mid = from.clone().lerp(strapTop, 0.5);
                    mid.y -= 0.005;
                    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([from, mid, strapTop]), 24, 0.008, 6, false);
                }
                const strapLGeo = tautStrapGeo(-0.095);
                bagG.add(new THREE.Mesh(strapLGeo, strapMat));
                bagG.add(new THREE.LineSegments(new THREE.EdgesGeometry(strapLGeo, 20), MAT));
                const strapRGeo = tautStrapGeo(0.095);
                bagG.add(new THREE.Mesh(strapRGeo, strapMat));
                bagG.add(new THREE.LineSegments(new THREE.EdgesGeometry(strapRGeo, 20), MAT));
            }

            /* ========================================================== */
            /* 置物箱（挎包旁边地上）：加宽 + 简化 + 颜色统一 */
            /* ========================================================== */
            const crateX = 0.95, crateZ = 3.48;
            const CR_W = 0.68, CR_D = 0.55, CR_H = 0.32;
            const CRATE_TOP = FY + CR_H + 0.092;
            {
                const CR_COL = 0xa07850;
                const CR_DARK = 0x8a6238;
                // 箱体
                put(cbox(CR_W, CR_H, CR_D, CR_COL), crateX, FY + CR_H / 2, crateZ, 0, 0, 0);
                // 箱盖沿（略大一圈）
                put(cbox(CR_W + 0.04, 0.07, CR_D + 0.04, CR_DARK), crateX, FY + CR_H + 0.035, crateZ, 0, 0, 0);
                // 盖顶面板
                put(cbox(CR_W - 0.10, 0.022, CR_D - 0.10, CR_COL), crateX, FY + CR_H + 0.081, crateZ, 0, 0, 0);
                // 正面搭扣（朝向房间一侧）
                put(cbox(0.10, 0.11, 0.02, CR_DARK), crateX, FY + CR_H / 2, crateZ - CR_D / 2 - 0.006, 0, 0, 0);
            }

            /* ========================================================== */
            /* 可推拉小凳子（挎包下方、箱子旁的地上，点击拉出/推回） */
            /* ========================================================== */
            const stoolG = new THREE.Group();
            stoolG.position.set(0.22, FY, 3.50);
            scene.add(stoolG);
            {
                const ST_COL = 0xa07850;   // 与置物箱统一木色
                const ST_DARK = 0x8a6238;
                // 凳面（圆角）
                const seat = crboxCol(0.34, 0.05, 0.30, 0.02, ST_COL);
                seat.position.y = 0.27;
                stoolG.add(seat);
                // 四条腿（微微外撇）
                for (const sx of [-1, 1]) {
                    for (const sz of [-1, 1]) {
                        const leg = edge(new THREE.CylinderGeometry(0.02, 0.024, 0.25, 8));
                        leg.position.set(sx * 0.13, 0.135, sz * 0.11);
                        leg.rotation.z = sx * 0.05;
                        leg.rotation.x = -sz * 0.05;
                        stoolG.add(leg);
                    }
                }
                // 侧面横撑
                put(cbox(0.24, 0.025, 0.025, ST_DARK), 0, 0.10, 0.105, 0, 0, 0, stoolG);
                put(cbox(0.24, 0.025, 0.025, ST_DARK), 0, 0.10, -0.105, 0, 0, 0, stoolG);
                put(cbox(0.025, 0.025, 0.19, ST_DARK), 0.125, 0.10, 0, 0, 0, 0, stoolG);
                put(cbox(0.025, 0.025, 0.19, ST_DARK), -0.125, 0.10, 0, 0, 0, 0, stoolG);
                // 凳面小坐垫
                const cushion = crboxCol(0.26, 0.045, 0.22, 0.02, 0x7a5a8a);
                cushion.position.y = 0.305;
                stoolG.add(cushion);
            }
            regSlide(stoolG, 'z', -0.38);
            regMagic(stoolG, () => {
                stoolG.userData.slide.open = !stoolG.userData.slide.open;
            });

            /* ========================================================== */
            /* 魔女帽：更大帽檐 + 低弯折尖，点击飞起撒糖果 */
            /* ========================================================== */
            const hatG = new THREE.Group();
            const HAT_HOME_POS = V(crateX, CRATE_TOP, crateZ);
            const HAT_HOVER_POS = V(crateX - 0.05, FY + 1.45, crateZ - 0.10);
            const HAT_TILT = 1.35;
            hatG.position.copy(HAT_HOME_POS);
            hatG.rotation.z = 0.05;
            scene.add(hatG);
            {
                const hatMat = LITMAT(0x2a1a3a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const ribbonMat = LITMAT(0x5a2a4a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const buckleMat = LITMAT(0xc9a05a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });

                // 超大帽檐
                const brimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.022, 22);
                const brim = new THREE.Mesh(brimGeo, hatMat);
                brim.add(new THREE.LineSegments(new THREE.EdgesGeometry(brimGeo, 20), MAT));
                brim.position.y = 0.011;
                hatG.add(brim);

                // 帽身（锥台，底接帽檐）
                const bodyGeo = new THREE.CylinderGeometry(0.052, 0.16, 0.30, 18);
                const body = new THREE.Mesh(bodyGeo, hatMat);
                body.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo, 20), MAT));
                body.position.y = 0.17;
                hatG.add(body);

                // 弯折关节球（弯折点 y = 0.32）
                const jointGeo = new THREE.SphereGeometry(0.052, 10, 8);
                const joint = new THREE.Mesh(jointGeo, hatMat);
                joint.add(new THREE.LineSegments(new THREE.EdgesGeometry(jointGeo, 15), MAT));
                joint.position.y = 0.32;
                hatG.add(joint);

                // 弯折帽尖（从低处关节向侧上方伸出并微微下垂）
                const tipGeo = new THREE.ConeGeometry(0.052, 0.17, 12);
                const tip = new THREE.Mesh(tipGeo, hatMat);
                tip.add(new THREE.LineSegments(new THREE.EdgesGeometry(tipGeo, 15), MAT));
                tip.rotation.z = -1.0;
                tip.position.set(0.072, 0.366, 0);
                hatG.add(tip);

                // 缎带环
                const bandGeo = new THREE.TorusGeometry(0.136, 0.015, 6, 20);
                const band = new THREE.Mesh(bandGeo, ribbonMat);
                band.add(new THREE.LineSegments(new THREE.EdgesGeometry(bandGeo), MAT));
                band.rotation.x = Math.PI / 2;
                band.position.y = 0.075;
                hatG.add(band);

                // 金色带扣
                const buckleGeo = new THREE.BoxGeometry(0.04, 0.03, 0.012);
                const buckle = new THREE.Mesh(buckleGeo, buckleMat);
                buckle.add(new THREE.LineSegments(new THREE.EdgesGeometry(buckleGeo), MAT));
                buckle.position.set(0, 0.075, 0.157);
                hatG.add(buckle);
            }

            /* —— 魔女帽交互：飞起悬浮撒糖果后落回 —— */
            const hatState = { phase: 'idle', t0: 0 };
            let hatCandyT = 0;
            const candies = [];
            const CANDY_COLORS = [0xe05555, 0xf0973c, 0xf0d355, 0x66c266, 0x5a9ad8, 0xa86ac9, 0xe07ab0, 0x8adfcb];

            function makeCandy() {
                const g = new THREE.Group();
                const col = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
                const mat = new THREE.MeshBasicMaterial({ color: col, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const type = Math.floor(Math.random() * 3);
                if (type === 0) {
                    // 包裹糖：圆球 + 两侧糖纸角
                    const sg = new THREE.SphereGeometry(0.02, 10, 8);
                    const s = new THREE.Mesh(sg, mat);
                    s.add(new THREE.LineSegments(new THREE.EdgesGeometry(sg, 15), MAT));
                    g.add(s);
                    for (const sd of [-1, 1]) {
                        const cg = new THREE.ConeGeometry(0.012, 0.022, 6);
                        cg.rotateZ(sd * Math.PI / 2);
                        cg.translate(sd * 0.03, 0, 0);
                        const cm = new THREE.Mesh(cg, mat);
                        cm.add(new THREE.LineSegments(new THREE.EdgesGeometry(cg, 20), MAT));
                        g.add(cm);
                    }
                } else if (type === 1) {
                    // 方块糖
                    g.add(crboxCol(0.036, 0.036, 0.036, 0.008, col));
                } else {
                    // 圆环糖
                    const tg = new THREE.TorusGeometry(0.018, 0.009, 6, 14);
                    const tm = new THREE.Mesh(tg, mat);
                    tm.add(new THREE.LineSegments(new THREE.EdgesGeometry(tg), MAT));
                    g.add(tm);
                }
                scene.add(g);
                if (window.prepareStoreReturn) window.prepareStoreReturn();
                window.location.href = './line-art-cafe/index.html';
                return g;
            }

            function spawnCandy() {
                const obj = makeCandy();
                const mouth = V(Math.sin(hatG.rotation.z), -Math.cos(hatG.rotation.z), 0);
                const p = hatG.position.clone().addScaledVector(mouth, 0.03);
                p.x += (Math.random() - 0.5) * 0.06;
                p.y += (Math.random() - 0.5) * 0.04;
                p.z += (Math.random() - 0.5) * 0.06;
                obj.position.copy(p);
                obj.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
                candies.push({
                    obj: obj,
                    v: mouth.clone().multiplyScalar(0.35 + Math.random() * 0.35)
                        .add(V((Math.random() - 0.5) * 0.3, 0.1 + Math.random() * 0.3, (Math.random() - 0.62) * 0.5)),
                    av: V((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                    r: 0.024,
                    onCrate: false,
                    resting: false, restT: 0,
                    dying: false, dieT: 0
                });
            }

            function updateHat(time, dt) {
                const s = hatState;
                if (s.phase === 'idle') return;
                const e = time - s.t0;
                if (s.phase === 'rising') {
                    const D = 0.9;
                    const k = smooth(Math.min(e / D, 1));
                    hatG.position.lerpVectors(HAT_HOME_POS, HAT_HOVER_POS, k);
                    hatG.position.y += Math.sin(k * Math.PI) * 0.18;
                    hatG.rotation.z = 0.05 + (HAT_TILT - 0.05) * k;
                    if (e >= D) {
                        s.phase = 'floating';
                        s.t0 = time;
                        hatCandyT = 0.3;
                    }
                } else if (s.phase === 'floating') {
                    const D = 3.4;
                    hatG.position.copy(HAT_HOVER_POS);
                    hatG.position.y += Math.sin(time * 2.6) * 0.03;
                    hatG.rotation.z = HAT_TILT + Math.sin(time * 2.0) * 0.10;
                    hatG.rotation.x = Math.sin(time * 1.5) * 0.07;
                    hatCandyT -= dt;
                    if (e < 2.1 && hatCandyT <= 0) {
                        hatCandyT = 0.13;
                        spawnCandy();
                    }
                    if (e >= D) {
                        s.phase = 'returning';
                        s.t0 = time;
                    }
                } else if (s.phase === 'returning') {
                    const D = 0.9;
                    const k = smooth(Math.min(e / D, 1));
                    hatG.position.lerpVectors(HAT_HOVER_POS, HAT_HOME_POS, k);
                    hatG.position.y += Math.sin(k * Math.PI) * 0.12;
                    hatG.rotation.z = HAT_TILT + (0.05 - HAT_TILT) * k;
                    hatG.rotation.x = Math.sin(time * 1.5) * 0.07 * (1 - k);
                    if (e >= D) {
                        hatG.position.copy(HAT_HOME_POS);
                        hatG.rotation.set(0, 0, 0.05);
                        s.phase = 'idle';
                    }
                }
            }

            function updateCandies(dt) {
                for (let i = candies.length - 1; i >= 0; i--) {
                    const c = candies[i];
                    if (c.dying) {
                        c.dieT += dt;
                        const k = Math.min(c.dieT / 0.5, 1);
                        c.obj.scale.setScalar(Math.max(0.001, 1 - k));
                        if (k >= 1) {
                            scene.remove(c.obj);
                            c.obj.traverse(o => {
                                if (o.geometry) o.geometry.dispose();
                                if (o.material) o.material.dispose();
                            });
                            candies.splice(i, 1);
                        }
                        continue;
                    }
                    if (c.resting) {
                        c.restT += dt;
                        if (c.restT > (c.onCrate ? 0.8 : 3.2)) {
                            c.dying = true;
                            c.dieT = 0;
                        }
                        continue;
                    }
                    c.v.y -= 3.0 * dt;
                    c.obj.position.addScaledVector(c.v, dt);
                    c.obj.rotation.x += c.av.x * dt;
                    c.obj.rotation.y += c.av.y * dt;
                    c.obj.rotation.z += c.av.z * dt;
                    let floorY = FY;
                    if (Math.abs(c.obj.position.x - crateX) < CR_W / 2 + 0.02 &&
                        Math.abs(c.obj.position.z - crateZ) < CR_D / 2 + 0.02) {
                        floorY = CRATE_TOP;
                    }
                    if (c.obj.position.y < floorY + c.r) {
                        c.obj.position.y = floorY + c.r;
                        c.onCrate = (floorY > FY + 0.1);
                        if (Math.abs(c.v.y) > 0.55) {
                            c.v.y = -c.v.y * 0.42;
                            c.v.x *= 0.72;
                            c.v.z *= 0.72;
                            c.av.multiplyScalar(0.6);
                        } else {
                            c.v.y = 0;
                            c.v.x *= 0.8;
                            c.v.z *= 0.8;
                            c.av.multiplyScalar(0.6);
                            if (c.v.length() < 0.05) {
                                c.resting = true;
                                c.restT = 0;
                                c.v.set(0, 0, 0);
                            }
                        }
                    }
                }
            }

            hatG.userData.aimLabel = '摸一摸魔法帽子 · 变出糖果，通向咖啡馆打工';
            regMagic(hatG, () => {
                if (hatState.phase !== 'idle') return;
                hatState.phase = 'rising';
                hatState.t0 = performance.now() * 0.001;
            });

            /* ========================================================== */
            /* 垃圾桶 */
            /* ========================================================== */
            const BIN_X = 1.85;
            const BIN_Z = -3.40;
            const BIN_H = 0.60;
            const BIN_R = 0.26;
            const binG = new THREE.Group();
            binG.position.set(BIN_X, FY, BIN_Z);
            scene.add(binG);
            {
                const wallG = new THREE.CylinderGeometry(BIN_R, BIN_R - 0.03, BIN_H, 16, 1, true);
                const wall = new THREE.Mesh(wallG, LITMAT(0xeef0ec, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
                wall.position.y = BIN_H / 2;
                binG.add(wall);
                const bottomGeo = new THREE.CircleGeometry(BIN_R - 0.026, 16);
                const bottom = new THREE.Mesh(bottomGeo, LITMAT(0xe3e6e3, { side: THREE.DoubleSide }));
                bottom.rotation.x = -Math.PI / 2;
                bottom.position.y = 0.008;
                binG.add(bottom);
                const bottomEdgeGeo = new THREE.EdgesGeometry(bottomGeo);
                const bottomEdge = new THREE.LineSegments(bottomEdgeGeo, MAT);
                bottomEdge.rotation.x = -Math.PI / 2;
                bottomEdge.position.y = 0.008;
                binG.add(bottomEdge);
                const rim = edge(new THREE.TorusGeometry(BIN_R + 0.003, 0.014, 6, 20));
                rim.rotation.x = Math.PI / 2;
                rim.position.y = BIN_H;
                binG.add(rim);
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    const pb = crumpleBall(0.05);
                    pb.position.set(Math.cos(a) * 0.13, 0.065, Math.sin(a) * 0.13);
                    pb.rotation.y = a;
                    binG.add(pb);
                }
                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3 + Math.PI / 6;
                    const pb = crumpleBall(0.05);
                    pb.position.set(Math.cos(a) * 0.13, 0.16, Math.sin(a) * 0.13);
                    pb.rotation.y = a + 0.7;
                    binG.add(pb);
                }
                for (let i = 0; i < 3; i++) {
                    const a = i * Math.PI * 2 / 3;
                    const pb = crumpleBall(0.05);
                    pb.position.set(Math.cos(a) * 0.105, 0.26, Math.sin(a) * 0.105);
                    pb.rotation.y = a + 1.3;
                    binG.add(pb);
                }
                {
                    const pb = crumpleBall(0.05);
                    pb.position.set(0, 0.26, 0);
                    pb.rotation.y = 0.8;
                    binG.add(pb);
                }
                const boxA = cbox(0.09, 0.05, 0.07, 0xcf8a76);
                boxA.position.set(0.11, 0.34, 0.02);
                boxA.rotation.y = 0.5;
                binG.add(boxA);
                const boxB = cbox(0.09, 0.05, 0.07, 0x8fb4c9);
                boxB.position.set(-0.10, 0.34, -0.06);
                boxB.rotation.y = -0.4;
                binG.add(boxB);
            }

            /* ========================================================== */
            /* 抽纸盒 */
            /* ========================================================== */
            const TISSUE_X = 1.42;
            const TISSUE_Z = -2.15;
            const tissueBoxG = new THREE.Group();
            tissueBoxG.position.set(TISSUE_X, TBL_TOP, TISSUE_Z);
            tissueBoxG.rotation.y = 0.22;
            scene.add(tissueBoxG);
            let standbyPaper = null;
            {
                const body = crboxCol(0.22, 0.13, 0.16, 0.015, 0xa9c29b);
                body.position.y = 0.065;
                tissueBoxG.add(body);
                const slot = cbox(0.13, 0.008, 0.03, 0x4e5a4e);
                slot.position.y = 0.132;
                tissueBoxG.add(slot);
                standbyPaper = new THREE.Group();
                const sb = crboxCol(0.10, 0.07, 0.005, 0.004, 0xfdfdf6);
                standbyPaper.add(sb);
                standbyPaper.add(iline([[-0.03, -0.028, 0.004], [0.032, -0.028, 0.004]]));
                standbyPaper.position.set(0, 0.168, 0);
                standbyPaper.rotation.x = 0.06;
                tissueBoxG.add(standbyPaper);
            }
            const SLOT_POS = V(TISSUE_X, TBL_TOP + 0.135, TISSUE_Z);
            const DESK_REST = V(2.05, TBL_TOP + 0.008, -2.00);
            const BIN_MOUTH = V(BIN_X, FY + BIN_H + 0.10, BIN_Z);
            const BIN_FALL = V(BIN_X, FY + 0.18, BIN_Z);
            const tissuePaperG = new THREE.Group();
            tissuePaperG.visible = false;
            scene.add(tissuePaperG);
            const paperFlat = new THREE.Group();
            {
                const sheet = crboxCol(0.10, 0.15, 0.005, 0.004, 0xfdfdf6);
                sheet.position.y = 0.075;
                paperFlat.add(sheet);
                paperFlat.add(iline([[-0.025, 0.03, 0.004], [-0.032, 0.12, 0.004]]));
                paperFlat.add(iline([[0.025, 0.03, 0.004], [0.018, 0.12, 0.004]]));
            }
            tissuePaperG.add(paperFlat);
            const paperBallFly = crumpleBall(0.05);
            paperBallFly.visible = false;
            tissuePaperG.add(paperBallFly);
            const tissueState = { phase: 'idle', t: 0 };
            let standbyAnimT = -1;
            regMagic(tissueBoxG, function () {
                if (tissueState.phase !== 'idle') return;
                tissueState.phase = 'rise';
                tissueState.t = 0;
                standbyAnimT = 0;
                paperFlat.visible = true;
                paperFlat.scale.set(1, 0.15, 1);
                paperFlat.rotation.set(0, 0, 0);
                paperFlat.position.set(0, 0, 0);
                paperBallFly.visible = false;
                paperBallFly.scale.setScalar(1);
                tissuePaperG.rotation.set(0, 0.22, 0);
                tissuePaperG.position.copy(SLOT_POS);
                tissuePaperG.visible = true;
            });
            regMagic(tissuePaperG, function () {
                if (tissueState.phase !== 'rest') return;
                tissueState.phase = 'crumple';
                tissueState.t = 0;
            });

            function updateTissue(time, dt) {
                const s = tissueState;
                if (standbyAnimT >= 0) {
                    standbyAnimT += dt;
                    const e = standbyAnimT;
                    if (e < 0.35) {
                        standbyPaper.scale.y = 1 - 0.78 * smooth(e / 0.35);
                    } else if (e < 0.75) {
                        standbyPaper.scale.y = 0.22 + 0.78 * smooth((e - 0.35) / 0.40);
                    } else {
                        standbyPaper.scale.y = 1;
                        standbyAnimT = -1;
                    }
                }
                if (s.phase === 'idle') return;
                s.t += dt;
                const e = s.t;
                if (s.phase === 'rise') {
                    const k = smooth(Math.min(e / 0.50, 1));
                    paperFlat.scale.y = 0.15 + 0.85 * k;
                    if (e >= 0.50) {
                        paperFlat.scale.y = 1;
                        s.phase = 'lift';
                        s.t = 0;
                    }
                } else if (s.phase === 'lift') {
                    const k = smooth(Math.min(e / 0.30, 1));
                    tissuePaperG.position.y = SLOT_POS.y + 0.10 * k;
                    if (e >= 0.30) {
                        s.phase = 'lay';
                        s.t = 0;
                    }
                } else if (s.phase === 'lay') {
                    const k = smooth(Math.min(e / 0.45, 1));
                    const from = V(SLOT_POS.x, SLOT_POS.y + 0.10, SLOT_POS.z);
                    tissuePaperG.position.copy(arcPos(from, DESK_REST, k, 0.03));
                    paperFlat.rotation.x = -Math.PI / 2 * k;
                    if (e >= 0.45) {
                        tissuePaperG.position.copy(DESK_REST);
                        paperFlat.rotation.x = -Math.PI / 2;
                        s.phase = 'rest';
                    }
                } else if (s.phase === 'crumple') {
                    const k = smooth(Math.min(e / 0.70, 1));
                    const sc = 1 - 0.85 * k;
                    paperFlat.scale.set(sc, sc, 1);
                    paperFlat.rotation.z = Math.sin(e * 22) * 0.30 * k;
                    paperFlat.position.x = Math.sin(e * 31) * 0.012 * k;
                    paperFlat.position.y = Math.sin(e * 27) * 0.006 * k;
                    paperBallFly.visible = true;
                    paperBallFly.scale.setScalar(0.15 + 0.85 * k);
                    paperBallFly.rotation.y += dt * 7;
                    paperBallFly.rotation.x += dt * 4;
                    if (e >= 0.70) {
                        paperFlat.visible = false;
                        paperFlat.scale.set(1, 1, 1);
                        paperFlat.rotation.set(-Math.PI / 2, 0, 0);
                        paperFlat.position.set(0, 0, 0);
                        s.phase = 'toss';
                        s.t = 0;
                    }
                } else if (s.phase === 'toss') {
                    const k = smooth(Math.min(e / 1.15, 1));
                    tissuePaperG.position.copy(arcPos(DESK_REST, BIN_MOUTH, k, 1.2));
                    paperBallFly.rotation.x += dt * 9;
                    paperBallFly.rotation.y += dt * 6;
                    if (e >= 1.15) {
                        s.phase = 'drop';
                        s.t = 0;
                    }
                } else if (s.phase === 'drop') {
                    const k = smooth(Math.min(e / 0.5, 1));
                    tissuePaperG.position.lerpVectors(BIN_MOUTH, BIN_FALL, k);
                    paperBallFly.rotation.x += dt * 6;
                    if (k > 0.7) {
                        paperBallFly.scale.setScalar(Math.max(0.001, 1 - (k - 0.7) / 0.3));
                    }
                    if (e >= 0.5) {
                        tissuePaperG.visible = false;
                        paperBallFly.scale.setScalar(1);
                        s.phase = 'idle';
                    }
                }
            }

            /* ========================================================== */
            /* 18.12 烟囱墙：魔法时钟（与现实时间同步） */
            /* ========================================================== */
            function colEdge(g, col, th) {
                const grp = new THREE.Group();
                grp.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, th === undefined ? 20 : th), MAT));
                return grp;
            }
            const clockCanvas = document.createElement('canvas');
            clockCanvas.width = 256;
            clockCanvas.height = 256;
            const cctx = clockCanvas.getContext('2d');
            const clockTex = new THREE.CanvasTexture(clockCanvas);
            let clockLastKey = '';
            function clockHand(ang, len, w, col) {
                cctx.strokeStyle = col;
                cctx.lineWidth = w;
                cctx.lineCap = 'round';
                cctx.beginPath();
                cctx.moveTo(128 - Math.cos(ang) * 14, 128 - Math.sin(ang) * 14);
                cctx.lineTo(128 + Math.cos(ang) * len, 128 + Math.sin(ang) * len);
                cctx.stroke();
            }
            function drawClock() {
                const now = new Date();
                const key = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
                if (key === clockLastKey) return;
                clockLastKey = key;
                const c = cctx;
                c.fillStyle = '#faf4e4';
                c.beginPath(); c.arc(128, 128, 122, 0, 7); c.fill();
                c.strokeStyle = '#3a3a3a';
                c.lineWidth = 4;
                c.beginPath(); c.arc(128, 128, 119, 0, 7); c.stroke();
                for (let i = 0; i < 12; i++) {
                    const a = i / 12 * Math.PI * 2 - Math.PI / 2;
                    c.lineWidth = i % 3 === 0 ? 5 : 2.5;
                    c.beginPath();
                    c.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100);
                    c.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112);
                    c.stroke();
                }
                c.fillStyle = '#5a4a6a';
                c.font = 'bold 26px serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('12', 128, 52);
                c.fillText('3', 204, 128);
                c.fillText('6', 128, 204);
                c.fillText('9', 52, 128);
                c.fillStyle = '#b8912a';
                c.font = '15px serif';
                c.fillText('✦', 128, 94);
                const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
                clockHand((h + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, 56, 6.5, '#3a3a3a');
                clockHand((m + s / 60) / 60 * Math.PI * 2 - Math.PI / 2, 86, 4.5, '#3a3a3a');
                clockHand(s / 60 * Math.PI * 2 - Math.PI / 2, 98, 2, '#b04a4a');
                c.fillStyle = '#3a3a3a';
                c.beginPath(); c.arc(128, 128, 7, 0, 7); c.fill();
                c.fillStyle = '#b04a4a';
                c.beginPath(); c.arc(128, 128, 3, 0, 7); c.fill();
                clockTex.needsUpdate = true;
            }
            drawClock();
            const clockG = new THREE.Group();
            clockG.position.set(-2.95, FY + 1.42, CHZ);
            clockG.rotation.y = Math.PI / 2;
            scene.add(clockG);
            {
                clockG.add(edge(new THREE.TorusGeometry(0.30, 0.042, 8, 30)));
                const face = new THREE.Mesh(new THREE.CircleGeometry(0.285, 30), new THREE.MeshBasicMaterial({ map: clockTex }));
                face.position.z = 0.028;
                clockG.add(face);
                put(colEdge(new THREE.OctahedronGeometry(0.05), 0xb8912a), 0, 0.40, 0.02, 0, 0, 0, clockG);
                put(colEdge(new THREE.OctahedronGeometry(0.028), 0xb8912a), -0.36, 0, 0.02, 0, 0, 0, clockG);
                put(colEdge(new THREE.OctahedronGeometry(0.028), 0xb8912a), 0.36, 0, 0.02, 0, 0, 0, clockG);
            }

            /* ========================================================== */
            /* 18.13 前墙挂画（镜子旁，点击编辑链接，支持 gif 动图） */
            /* ========================================================== */
            const picG = new THREE.Group();
            picG.position.set(1.45, FY + 1.55, 3.82);
            picG.rotation.y = Math.PI;
            scene.add(picG);
            {
                const FR_W = 0.72, FR_H = 0.54, FR_B = 0.06;
                put(cbox(FR_W, FR_B, 0.04, 0x8a6238), 0, FR_H / 2 - FR_B / 2, 0, 0, 0, 0, picG);
                put(cbox(FR_W, FR_B, 0.04, 0x8a6238), 0, -FR_H / 2 + FR_B / 2, 0, 0, 0, 0, picG);
                put(cbox(FR_B, FR_H - 2 * FR_B, 0.04, 0x8a6238), -FR_W / 2 + FR_B / 2, 0, 0, 0, 0, 0, picG);
                put(cbox(FR_B, FR_H - 2 * FR_B, 0.04, 0x8a6238), FR_W / 2 - FR_B / 2, 0, 0, 0, 0, 0, picG);
                put(cbox(FR_W - 2 * FR_B, FR_H - 2 * FR_B, 0.016, 0xf5efdf), 0, 0, -0.006, 0, 0, 0, picG);
                put(colEdge(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 6), 0x5a4128), 0, 0.52, -0.03, Math.PI / 2, 0, 0, picG);
                picG.add(iline([[-0.26, 0.25, 0.005], [0, 0.50, -0.012], [0.26, 0.25, 0.005]]));
            }
            const picCv = document.createElement('canvas');
            picCv.width = 256;
            picCv.height = 176;
            const pctx = picCv.getContext('2d');
            const picTex = new THREE.CanvasTexture(picCv);
            const picPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: picTex }));
            picPlane.position.set(0, 0, 0.008);
            picPlane.scale.set(0.58, 0.40, 1);
            picG.add(picPlane);
            const picState = { url: '', img: null, lastT: 0 };
            function drawPicBlank() {
                pctx.fillStyle = '#f7f2e6';
                pctx.fillRect(0, 0, 256, 176);
                pctx.strokeStyle = 'rgba(180,168,140,0.5)';
                pctx.lineWidth = 2;
                pctx.strokeRect(6, 6, 244, 164);
                picTex.needsUpdate = true;
            }
            drawPicBlank();
            function drawPicImage() {
                const img = picState.img;
                if (!img || !img.width || !img.height) return;
                const iw = img.width, ih = img.height;
                const maxW = 244, maxH = 164;
                const a = iw / ih;
                let w = maxW, h = maxW / a;
                if (h > maxH) { h = maxH; w = maxH * a; }
                pctx.fillStyle = '#f7f2e6';
                pctx.fillRect(0, 0, 256, 176);
                pctx.drawImage(img, (256 - w) / 2, (176 - h) / 2, w, h);
                picTex.needsUpdate = true;
            }
            /* 图片加载：直连失败时依次走中转代理（解决防盗链 / 无CORS / http链接） */
            const PIC_SOURCES = [
                function (u) { return u; },
                function (u) { return 'https://images.weserv.nl/?url=' + encodeURIComponent(u); },
                function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
                function (u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); }
            ];
            function tryLoadPic(url, idx) {
                if (idx >= PIC_SOURCES.length) {
                    picState.img = null;
                    drawPicBlank();
                    return;
                }
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function () {
                    if (!img.width || !img.height) { tryLoadPic(url, idx + 1); return; }
                    picState.img = img;
                    picState.lastT = 0;
                    drawPicImage();
                };
                img.onerror = function () { tryLoadPic(url, idx + 1); };
                img.src = PIC_SOURCES[idx](url);
            }
            function setPicture(url) { tryLoadPic(url, 0); }
            function openPicEditor() {
                const ed = document.getElementById('picEditor');
                const inp = document.getElementById('picInput');
                inp.value = picState.url;
                ed.classList.add('show');
                inp.focus();
                inp.select();
            }
            regMagic(picG, openPicEditor);
            function applyPic() {
                let u = document.getElementById('picInput').value.trim();
                document.getElementById('picEditor').classList.remove('show');
                document.getElementById('picInput').blur();
                if (!u) return;
                if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
                picState.url = u;
                setPicture(u);
                SND.play('chim');
            }
            document.getElementById('picOk').addEventListener('click', applyPic);
            document.getElementById('picInput').addEventListener('keydown', function (e) {
                if (e.key === 'Enter') applyPic();
                if (e.key === 'Escape') {
                    document.getElementById('picEditor').classList.remove('show');
                    document.getElementById('picInput').blur();
                }
                e.stopPropagation();
            });


            /* ========================================================== */
            /* 18.14 拱形全身镜（点击镜面泛起水波涟漪） */
            /* ========================================================== */
            const mirrorG = new THREE.Group();
            mirrorG.position.set(2.55, FY, 3.60);
            mirrorG.rotation.y = Math.PI;
            scene.add(mirrorG);
            const mirrorTilt = new THREE.Group();
            mirrorTilt.rotation.x = -0.09;
            mirrorG.add(mirrorTilt);
            const mirrorCv = document.createElement('canvas');
            mirrorCv.width = 160;
            mirrorCv.height = 480;
            const mctx = mirrorCv.getContext('2d');
            const mirrorTex = new THREE.CanvasTexture(mirrorCv);
            const mirrorRipples = [];
            let mirrorPane;
            {
                // ---- 拱形木框：外拱形轮廓挖内拱形孔，挤出厚度 ----
                const OUT_W = 0.66, OUT_H = 1.80;
                const IN_W = 0.54, IN_H = 1.66, IN_Y0 = 0.07;
                const frameShape = new THREE.Shape();
                const oR = OUT_W / 2, oTop = OUT_H - oR;
                frameShape.moveTo(-oR, 0);
                frameShape.lineTo(-oR, oTop);
                frameShape.absarc(0, oTop, oR, Math.PI, 0, true);
                frameShape.lineTo(oR, 0);
                frameShape.closePath();
                const holePath2 = new THREE.Path();
                const iR = IN_W / 2, iBot = IN_Y0, iTop = IN_Y0 + IN_H - iR;
                holePath2.moveTo(-iR, iBot);
                holePath2.lineTo(-iR, iTop);
                holePath2.absarc(0, iTop, iR, Math.PI, 0, true);
                holePath2.lineTo(iR, iBot);
                holePath2.closePath();
                frameShape.holes.push(holePath2);
                const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: 0.05, bevelEnabled: false, curveSegments: 20 });
                const frameMesh = new THREE.Mesh(frameGeo, LITMAT(0x7a5a3a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
                frameMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(frameGeo, 8), MAT));
                frameMesh.position.z = -0.025;
                mirrorTilt.add(frameMesh);
                // ---- 镜面（拱形绘制在 canvas 上，嵌入框内 ----
                mirrorPane = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.60), new THREE.MeshBasicMaterial({ map: mirrorTex }));
                mirrorPane.position.set(0, IN_Y0 + IN_H / 2, 0.018);
                mirrorTilt.add(mirrorPane);
                // ---- 框顶金色月牙 ----
                const moonShape = new THREE.Shape();
                moonShape.absarc(0, 0, 0.058, Math.PI / 2, Math.PI * 1.5, false);
                moonShape.absarc(0.024, 0, 0.046, Math.PI * 1.5, Math.PI / 2, true);
                const moonGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 0.012, bevelEnabled: false, curveSegments: 14 });
                const moon = new THREE.Mesh(moonGeo, LITMAT(0xc9a227, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
                moon.add(new THREE.LineSegments(new THREE.EdgesGeometry(moonGeo, 8), MAT));
                moon.position.set(0, 1.87, 0);
                mirrorTilt.add(moon);
                // ---- 月牙两侧小星（拉长八面体） ----
                for (const sxy of [[-0.20, 1.74], [0.20, 1.74]]) {
                    const st = colEdge(new THREE.OctahedronGeometry(0.026), 0xc9a227);
                    st.scale.set(0.7, 1.4, 0.7);
                    st.position.set(sxy[0], sxy[1], 0.01);
                    mirrorTilt.add(st);
                }
                // ---- 底部横木底座 ----
                put(cbox(0.58, 0.06, 0.11, 0x5a4128), 0, 0.02, 0.01, 0, 0, 0, mirrorTilt);
            }
            const mirrorStars = [];
            for (let i = 0; i < 16; i++) {
                mirrorStars.push({ x: 12 + (i * 53 + 23) % 136, y: 120 + (i * 97 + 41) % 340, s: i % 3 === 0 ? 1.8 : 1.1 });
            }
            function mirrorArchPath(c) {
                c.beginPath();
                c.moveTo(2, 480);
                c.lineTo(2, 72);
                c.arc(80, 72, 78, Math.PI, 0, false);
                c.lineTo(158, 480);
                c.closePath();
            }
            function drawMirror(time) {
                const c = mctx;
                c.fillStyle = '#4a3a2c';
                c.fillRect(0, 0, 160, 480);
                c.save();
                mirrorArchPath(c);
                c.clip();
                const g = c.createLinearGradient(0, 0, 0, 480);
                g.addColorStop(0, '#eef5f8');
                g.addColorStop(0.5, '#d8e9f0');
                g.addColorStop(1, '#c6dbe6');
                c.fillStyle = g;
                c.fillRect(0, 0, 160, 480);
                const sx = 45 + Math.sin(time * 0.45) * 55;
                const g2 = c.createLinearGradient(sx - 40, 0, sx + 40, 0);
                g2.addColorStop(0, 'rgba(255,255,255,0)');
                g2.addColorStop(0.5, 'rgba(255,255,255,0.4)');
                g2.addColorStop(1, 'rgba(255,255,255,0)');
                c.fillStyle = g2;
                c.fillRect(0, 0, 160, 480);
                c.fillStyle = 'rgba(250,244,214,0.5)';
                c.beginPath(); c.arc(106, 150, 27, 0, 7); c.fill();
                c.fillStyle = 'rgba(214,232,240,0.6)';
                c.beginPath(); c.arc(114, 142, 23, 0, 7); c.fill();
                for (let i = 0; i < mirrorStars.length; i++) {
                    const st = mirrorStars[i];
                    const tw = 0.3 + 0.3 * Math.abs(Math.sin(time * 1.8 + i * 1.7));
                    c.fillStyle = 'rgba(255,255,255,' + tw.toFixed(2) + ')';
                    c.beginPath(); c.arc(st.x, st.y, st.s, 0, 7); c.fill();
                }
                for (const rp of mirrorRipples) {
                    for (let k = 0; k < 3; k++) {
                        const rr = rp.r * (1 - k * 0.18);
                        if (rr < 2) continue;
                        c.strokeStyle = 'rgba(255,255,255,' + (rp.a * (1 - k * 0.28)).toFixed(3) + ')';
                        c.lineWidth = 2.6 - k * 0.8;
                        c.beginPath();
                        c.ellipse(rp.x, rp.y, rr, rr * 0.62, 0, 0, 7);
                        c.stroke();
                        c.strokeStyle = 'rgba(90,130,155,' + (rp.a * 0.35 * (1 - k * 0.28)).toFixed(3) + ')';
                        c.beginPath();
                        c.ellipse(rp.x, rp.y, rr * 0.9, rr * 0.62 * 0.9, 0, 0, 7);
                        c.stroke();
                    }
                }
                c.restore();
                mirrorArchPath(c);
                c.strokeStyle = 'rgba(70,52,36,0.6)';
                c.lineWidth = 3;
                c.stroke();
                mirrorTex.needsUpdate = true;
            }
            function spawnMirrorRipple(x, y) {
                mirrorRipples.push({ x: x, y: y, r: 3, a: 1, max: 130 + Math.random() * 40 });
                for (let i = 0; i < 3; i++) {
                    mirrorRipples.push({
                        x: x + (Math.random() - 0.5) * 46,
                        y: y + (Math.random() - 0.5) * 90,
                        r: 2, a: 0.7, max: 40 + Math.random() * 30
                    });
                }
            }
            let mirrorDown = null;
            const mirrorRay = new THREE.Raycaster();
            const mirrorMouse = new THREE.Vector2();
            renderer.domElement.addEventListener('pointerdown', function (e) {
                mirrorDown = { x: e.clientX, y: e.clientY };
            });
            renderer.domElement.addEventListener('pointerup', function (e) {
                if (!mirrorDown) return;
                const moved = Math.abs(e.clientX - mirrorDown.x) + Math.abs(e.clientY - mirrorDown.y);
                mirrorDown = null;
                if (moved >= 6) return;
                mirrorMouse.x = (e.clientX / innerWidth) * 2 - 1;
                mirrorMouse.y = -(e.clientY / innerHeight) * 2 + 1;
                mirrorRay.setFromCamera(mirrorMouse, camera);
                const hits = mirrorRay.intersectObject(mirrorPane, false);
                if (hits.length) {
                    const lp = mirrorPane.worldToLocal(hits[0].point.clone());
                    spawnMirrorRipple((lp.x / 0.54 + 0.5) * 160, (0.5 - lp.y / 1.60) * 480);
                }
            });

            /* ========================================================== */
            /* 18.15 毛茸茸大地毯（右前角与书桌之间） */
            /* ========================================================== */
            const rugG = new THREE.Group();
            rugG.position.set(2.7, FY + 0.02, 0.7);
            scene.add(rugG);
            const rugCv = document.createElement('canvas');
            rugCv.width = 512;
            rugCv.height = 420;
            const rctx = rugCv.getContext('2d');
            const rugTex = new THREE.CanvasTexture(rugCv);
            {
                rugG.add(crboxCol(2.2, 0.04, 1.8, 0.02, 0x7d5064));
                const rugPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), new THREE.MeshBasicMaterial({ map: rugTex }));
                rugPlane.rotation.x = -Math.PI / 2;
                rugPlane.position.y = 0.024;
                rugG.add(rugPlane);
            }
            function canvasRoundRect(c, x, y, w, h, r) {
                c.beginPath();
                c.moveTo(x + r, y);
                c.lineTo(x + w - r, y);
                c.arcTo(x + w, y, x + w, y + r, r);
                c.lineTo(x + w, y + h - r);
                c.arcTo(x + w, y + h, x + w - r, y + h, r);
                c.lineTo(x + r, y + h);
                c.arcTo(x, y + h, x, y + h - r, r);
                c.lineTo(x, y + r);
                c.arcTo(x, y, x + r, y, r);
                c.closePath();
            }
            function drawRug() {
                const c = rctx;
                c.fillStyle = '#8a5a70';
                c.fillRect(0, 0, 512, 420);
                c.strokeStyle = '#e9dcc8';
                c.lineWidth = 7;
                canvasRoundRect(c, 22, 22, 468, 376, 34);
                c.stroke();
                c.lineWidth = 2.5;
                canvasRoundRect(c, 38, 38, 436, 344, 26);
                c.stroke();
                c.fillStyle = '#e9dcc8';
                c.beginPath(); c.arc(225, 210, 60, 0, 7); c.fill();
                c.fillStyle = '#8a5a70';
                c.beginPath(); c.arc(248, 194, 52, 0, 7); c.fill();
                c.fillStyle = '#e9dcc8';
                c.font = '34px serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('✦', 320, 160);
                c.fillText('✧', 360, 215);
                c.fillText('✦', 318, 262);
                c.font = '22px serif';
                c.fillText('✧', 78, 76); c.fillText('✦', 434, 76);
                c.fillText('✦', 78, 344); c.fillText('✧', 434, 344);
                for (let i = 0; i < 3400; i++) {
                    const x = Math.random() * 512, y = Math.random() * 420;
                    const a = Math.random() * Math.PI * 2;
                    const l = 4 + Math.random() * 7;
                    c.strokeStyle = Math.random() < 0.5 ? 'rgba(255,214,228,0.09)' : 'rgba(48,20,36,0.09)';
                    c.lineWidth = 1.6;
                    c.beginPath();
                    c.moveTo(x, y);
                    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
                    c.stroke();
                }
                c.strokeStyle = '#c9a2b4';
                c.lineWidth = 2;
                for (let i = 0; i < 58; i++) {
                    const x = 14 + i * 8.4;
                    c.beginPath(); c.moveTo(x, 26); c.lineTo(x + (Math.random() - 0.5) * 7, 5 + Math.random() * 6); c.stroke();
                    c.beginPath(); c.moveTo(x, 394); c.lineTo(x + (Math.random() - 0.5) * 7, 415 - Math.random() * 6); c.stroke();
                }
                for (let i = 0; i < 46; i++) {
                    const y = 14 + i * 8.6;
                    c.beginPath(); c.moveTo(26, y); c.lineTo(5 + Math.random() * 6, y + (Math.random() - 0.5) * 7); c.stroke();
                    c.beginPath(); c.moveTo(486, y); c.lineTo(507 - Math.random() * 6, y + (Math.random() - 0.5) * 7); c.stroke();
                }
                rugTex.needsUpdate = true;
            }
            drawRug();

            /* ========================================================== */
            /* 18.16 右前角杂物纸箱（左右两片盖向外翻开） */
            /* ========================================================== */
            const junkG = new THREE.Group();
            junkG.position.set(3.34, FY, 3.34);
            junkG.rotation.y = Math.PI / 4;
            scene.add(junkG);
            const CB_COL = 0xc9a878, CB_DARK = 0xb0906a;
            let junkOpen = false, junkT = 0;
            const junkFlaps = [];
            const junkInside = new THREE.Group();
            junkG.add(junkInside);
            {
                const S = 0.56, H = 0.40, T = 0.028;
                // 箱体五面（底 + 四壁，顶部敞开由盖子封）
                put(cbox(S, T, S, CB_COL), 0, T / 2, 0, 0, 0, 0, junkG);
                put(cbox(S, H, T, CB_COL), 0, H / 2, -S / 2 + T / 2, 0, 0, 0, junkG);
                put(cbox(S, H, T, CB_COL), 0, H / 2, S / 2 - T / 2, 0, 0, 0, junkG);
                put(cbox(T, H, S - 2 * T, CB_COL), -S / 2 + T / 2, H / 2, 0, 0, 0, 0, junkG);
                put(cbox(T, H, S - 2 * T, CB_COL), S / 2 - T / 2, H / 2, 0, 0, 0, 0, junkG);
                // 正面胶带与手写标签
                put(cbox(0.10, 0.34, 0.008, CB_DARK), 0.07, 0.20, -S / 2 - 0.004, 0, 0, 0, junkG);
                const junkCv = document.createElement('canvas');
                junkCv.width = 96;
                junkCv.height = 48;
                const jc = junkCv.getContext('2d');
                jc.fillStyle = '#f2ead6';
                jc.fillRect(0, 0, 96, 48);
                jc.strokeStyle = '#8a6a4a';
                jc.lineWidth = 3;
                jc.strokeRect(3, 3, 90, 42);
                jc.fillStyle = '#5a4a3a';
                jc.font = 'bold 19px "Microsoft YaHei", serif';
                jc.textAlign = 'center';
                jc.textBaseline = 'middle';
                jc.fillText('杂物 ✦', 48, 26);
                const junkTex = new THREE.CanvasTexture(junkCv);
                const junkLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.10), new THREE.MeshBasicMaterial({ map: junkTex }));
                junkLabel.position.set(-0.15, 0.24, -S / 2 - 0.006);
                junkLabel.rotation.y = Math.PI;
                junkG.add(junkLabel);
                // 左盖：铰链在箱口左缘，盖板向右平铺盖住左半箱口
                const flapL = new THREE.Group();
                flapL.position.set(-S / 2, H, 0);
                const pl = cbox(S / 2 - 0.005, 0.018, S - 0.05, CB_COL);
                pl.position.set(S / 4, 0, 0);
                flapL.add(pl);
                junkG.add(flapL);
                junkFlaps.push({ pivot: flapL, target: Math.PI + 0.35 });
                // 右盖：铰链在箱口右缘，盖板向左平铺盖住右半箱口
                const flapR = new THREE.Group();
                flapR.position.set(S / 2, H, 0);
                const pr = cbox(S / 2 - 0.005, 0.018, S - 0.05, CB_COL);
                pr.position.set(-S / 4, 0, 0);
                flapR.add(pr);
                junkG.add(flapR);
                junkFlaps.push({ pivot: flapR, target: -(Math.PI + 0.35) });
                // ---- 箱内杂物 ----
                const bottle = new THREE.Group();
                const bb = colEdge(new THREE.CylinderGeometry(0.040, 0.048, 0.13, 10), 0x6a9a7a);
                bb.position.y = 0.065;
                bottle.add(bb);
                const bn = colEdge(new THREE.CylinderGeometry(0.013, 0.013, 0.05, 8), 0x8a6238);
                bn.position.y = 0.155;
                bottle.add(bn);
                const bc = colEdge(new THREE.SphereGeometry(0.017, 8, 6), 0xb08a5a);
                bc.position.y = 0.185;
                bottle.add(bc);
                bottle.position.set(-0.13, T, 0.07);
                bottle.rotation.y = 0.5;
                junkInside.add(bottle);
                const yarn = colEdge(new THREE.SphereGeometry(0.062, 12, 10), 0xc26a8a, 15);
                yarn.position.set(0.14, T + 0.062, -0.10);
                junkInside.add(yarn);
                for (let k = 0; k < 3; k++) {
                    const tr = colEdge(new THREE.TorusGeometry(0.062, 0.005, 6, 18), 0xe8a8c0);
                    tr.rotation.set(k * 0.9, k * 1.2, 0);
                    tr.position.copy(yarn.position);
                    junkInside.add(tr);
                }
                const bk1 = cbox(0.17, 0.035, 0.12, 0x7a4638);
                bk1.position.set(0.06, T + 0.018, 0.13);
                bk1.rotation.y = 0.45;
                junkInside.add(bk1);
                const bk2 = cbox(0.15, 0.03, 0.11, 0x4a6a8a);
                bk2.position.set(0.075, T + 0.05, 0.125);
                bk2.rotation.y = 0.12;
                junkInside.add(bk2);
                const bone = new THREE.Group();
                const shaft = colEdge(new THREE.CylinderGeometry(0.011, 0.011, 0.15, 8), 0xf0ead8);
                shaft.rotation.z = Math.PI / 2;
                bone.add(shaft);
                for (const e of [-1, 1]) {
                    for (const o of [-0.011, 0.011]) {
                        const knob = colEdge(new THREE.SphereGeometry(0.019, 8, 6), 0xf0ead8);
                        knob.position.set(e * 0.078, o, 0);
                        bone.add(knob);
                    }
                }
                bone.position.set(-0.08, T + 0.02, -0.12);
                bone.rotation.y = 0.6;
                junkInside.add(bone);
            }
            regMagic(junkG, function () { junkOpen = !junkOpen; });

            /* ========================================================== */
            /* 18.17 新增装饰统一刷新（独立动画循环） */
            /* ========================================================== */
            function updateNewDecor(time, dt) {
                drawClock();
                if (picState.img && time - picState.lastT > 0.1) {
                    drawPicImage();
                    picState.lastT = time;
                }
                for (let i = mirrorRipples.length - 1; i >= 0; i--) {
                    const rp = mirrorRipples[i];
                    rp.r += 62 * dt;
                    rp.a = Math.max(0, 1 - rp.r / rp.max);
                    if (rp.a <= 0.01) mirrorRipples.splice(i, 1);
                }
                mirrorDirtyT += dt;
                if (mirrorRipples.length || mirrorDirtyT > 0.12) { drawMirror(time); mirrorDirtyT = 0; }
                junkT += ((junkOpen ? 1 : 0) - junkT) * 0.075;
                const jk = smooth(Math.max(0, Math.min(1, junkT)));
                for (const f of junkFlaps) {
                    f.pivot.rotation.z = f.target * jk;
                }
                junkInside.position.y = Math.sin(Math.min(1, junkT) * Math.PI) * 0.05;
            }
            let decorLastT = performance.now() * 0.001;
            let mirrorDirtyT = 0;
            (function decorLoop() {
                requestAnimationFrame(decorLoop);
                const t = performance.now() * 0.001;
                const dt = Math.min(0.05, Math.max(0.001, t - decorLastT));
                decorLastT = t;
                updateNewDecor(t, dt);
            })();

            /* ============ 便签编辑器（二楼计划板） ============ */
            const noteInput = document.getElementById('noteInput');
            const noteEditor = document.getElementById('noteEditor');
            function applyNote() {
                notes[noteEditing].txt = noteInput.value.trim() || '...';
                drawNote(noteEditing);
                noteEditor.classList.remove('show');
                noteInput.blur();
                SND.play('chim');
            }
            document.getElementById('noteOk').addEventListener('click', applyNote);
            noteInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') applyNote();
                if (e.key === 'Escape') {
                    noteEditor.classList.remove('show');
                    noteInput.blur();
                }
                e.stopPropagation();
            });


            /* ========================================================== */
            /* ============ 二楼顶中央魔法吊灯 ============ */
            /* ========================================================== */
            let lampLit = true; let lampP = 1;
            const LAMP_Y = -0.95;
            const chandelier = new THREE.Group();
            chandelier.position.set(0, 6.3, 0);
            scene.add(chandelier);
            put(edge(new THREE.ConeGeometry(0.06, 0.16, 6)), 0, 0.15, 0, 0, 0, 0, chandelier);
            for (let i = 0; i < 4; i++) {
                put(edge(new THREE.TorusGeometry(0.045, 0.013, 6, 12)), 0, -0.03 - i * 0.09, 0, 0, (i % 2) * Math.PI / 2, 0, chandelier);
            }
            put(edge(new THREE.CylinderGeometry(0.02, 0.026, 0.62, 8)), 0, -0.63, 0, 0, 0, 0, chandelier);
            for (let i = 0; i < 3; i++) {
                const ang = i * Math.PI * 2 / 3 + 0.5;
                logBetween([0, -0.6, 0], [Math.cos(ang) * 0.55, LAMP_Y, Math.sin(ang) * 0.55], 0.015, chandelier);
            }
            put(edge(new THREE.TorusGeometry(0.55, 0.035, 8, 26)), 0, LAMP_Y, 0, Math.PI / 2, 0, 0, chandelier);
            for (let i = 0; i < 6; i++) {
                const ang = i * Math.PI / 3 + 0.26;
                const cx = Math.cos(ang) * 0.55, cz = Math.sin(ang) * 0.55;
                put(edge(new THREE.CylinderGeometry(0.014, 0.02, 0.16, 6)), cx, LAMP_Y + 0.08, cz, 0, 0, 0, chandelier);
                put(edge(new THREE.CylinderGeometry(0.052, 0.036, 0.03, 8)), cx, LAMP_Y + 0.175, cz, 0, 0, 0, chandelier);
                put(edge(new THREE.CylinderGeometry(0.028, 0.028, 0.17, 8)), cx, LAMP_Y + 0.27, cz, 0, 0, 0, chandelier);
                put(edge(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6)), cx, LAMP_Y + 0.365, cz, 0, 0, 0, chandelier);
            }
            const lampCrystalMat = new THREE.MeshBasicMaterial({ color: 0x73737e, transparent: true, opacity: 0.95 });
            const lampCrystal = new THREE.Group();
            { const cryG = new THREE.OctahedronGeometry(0.13); lampCrystal.add(new THREE.Mesh(cryG, lampCrystalMat)); lampCrystal.add(new THREE.LineSegments(new THREE.EdgesGeometry(cryG), MAT)); }
            put(lampCrystal, 0, LAMP_Y + 0.06, 0, 0, 0, 0, chandelier);
            const pendant = new THREE.Group();
            { const pG = new THREE.OctahedronGeometry(0.09); pendant.add(new THREE.Mesh(pG, lampCrystalMat)); pendant.add(new THREE.LineSegments(new THREE.EdgesGeometry(pG), MAT)); }
            put(edge(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6)), 0, LAMP_Y - 0.25, 0, 0, 0, 0, chandelier);
            put(pendant, 0, LAMP_Y - 0.58, 0, 0, 0, 0, chandelier);
            const lampGlowMatA = new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
            const lampGlowMatB = new THREE.MeshBasicMaterial({ color: 0xe0b4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
            const glowA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), lampGlowMatA);
            const glowB = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), lampGlowMatB);
            glowA.renderOrder = 7; glowB.renderOrder = 7;
            put(glowA, 0, LAMP_Y + 0.06, 0, 0, 0, 0, chandelier);
            put(glowB, 0, LAMP_Y + 0.06, 0, 0, 0, 0, chandelier);
            const chandelierFlames = [];
            for (let i = 0; i < 6; i++) {
                const ang = i * Math.PI / 3 + 0.26;
                const cx = Math.cos(ang) * 0.55, cz = Math.sin(ang) * 0.55;
                makeWavyFlame(cx, cz, LAMP_Y + 0.375, 0.14, 0.042, fireMid, i * 1.1, 3.3, chandelierFlames);
                makeWavyFlame(cx, cz, LAMP_Y + 0.395, 0.075, 0.02, fireIn, i * 1.1 + 2.0, 3.8, chandelierFlames);
            }
            for (const f of chandelierFlames) chandelier.add(f.obj);
            chandelier.userData.aimLabel = '点亮 / 熄灭魔法吊灯';
            regMagic(chandelier, () => { lampLit = !lampLit; });
            chandelier.userData.sfx = 'lamp';

            const MEMB_MAT = new THREE.MeshBasicMaterial({ color: 0x4fd695, transparent: true, opacity: 0.40, side: THREE.DoubleSide, depthWrite: false });
            const MID_MAT = new THREE.MeshBasicMaterial({ color: 0x8ce8b6, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false });
            const CORE_MAT = new THREE.MeshBasicMaterial({ color: 0x2fbb7c, transparent: true, opacity: 0.50, side: THREE.DoubleSide, depthWrite: false });
            const BUBBLE_MAT = new THREE.MeshBasicMaterial({ color: 0xeafff2, transparent: true, opacity: 0.35, depthWrite: false });
            const slimeRoot = new THREE.Group(); scene.add(slimeRoot); const slimeBody = new THREE.Group(); slimeRoot.add(slimeBody);
            const SLIME_R = 0.30; const slimeGeo = new THREE.SphereGeometry(SLIME_R, 26, 18); const slimeOrig = slimeGeo.attributes.position.array.slice();
            const membrane = new THREE.Mesh(slimeGeo, MEMB_MAT); membrane.renderOrder = 3; slimeBody.add(membrane);
            const midLayer = new THREE.Mesh(slimeGeo, MID_MAT); midLayer.scale.setScalar(0.86); midLayer.renderOrder = 2; slimeBody.add(midLayer);
            const core = new THREE.Mesh(new THREE.SphereGeometry(0.145, 18, 14), CORE_MAT); core.renderOrder = 1; slimeBody.add(core);
            const bubbles = [];
            for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.016 + Math.random() * 0.012, 8, 6), BUBBLE_MAT); b.renderOrder = 1; b.userData = { ph: Math.random(), ang: Math.random() * 6.28, rr: 0.03 + Math.random() * 0.07 }; slimeBody.add(b); bubbles.push(b); }
            const slimeShadow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), new THREE.MeshBasicMaterial({ color: 0x1e5a40, transparent: true, opacity: 0.16, depthWrite: false })); slimeShadow.rotation.x = -Math.PI / 2; slimeShadow.position.y = 0.012; slimeRoot.add(slimeShadow);
            const SLIME_FLAT = 0.78; const slime = { squash: SLIME_FLAT, squashV: 0, wob: 0, wobV: 0, tilt: 0, tiltV: 0, pulse: 2.0 };
            function deformSlime(time, amp, speed) { const arr = slimeGeo.attributes.position.array; const n = slimeGeo.attributes.position.count; for (let i = 0; i < n; i++) { const x0 = slimeOrig[i * 3], y0 = slimeOrig[i * 3 + 1], z0 = slimeOrig[i * 3 + 2]; const h = y0 / SLIME_R; const spread = 1 + 0.20 * Math.max(0, -h); const ph = h * 3.4 - time * speed; const w = Math.sin(ph) * amp; const w2 = Math.sin(ph + 1.7) * amp * 0.4; arr[i * 3] = x0 * spread - w2; arr[i * 3 + 1] = y0 + Math.sin(ph * 0.8 + 0.6) * amp * 0.25; arr[i * 3 + 2] = z0 * spread + w; } slimeGeo.attributes.position.needsUpdate = true; }
