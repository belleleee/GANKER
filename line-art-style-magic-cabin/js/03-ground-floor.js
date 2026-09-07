'use strict';
            /* ========================================================== */
            /* ============ 室内陈设专用：圆角几何与材质工具 ============ */
            /* ========================================================== */
            function roundBoxGeo(w, h, d, r, seg) {
                if (seg === undefined) seg = 2;
                r = Math.min(r, w / 2, h / 2, d / 2);
                const g = new THREE.BoxGeometry(w, h, d, seg * 2 + 1, seg * 2 + 1, seg * 2 + 1);
                const pa = g.attributes.position;
                const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
                for (let i = 0; i < pa.count; i++) {
                    const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
                    const cx = Math.max(-hw, Math.min(hw, x));
                    const cy = Math.max(-hh, Math.min(hh, y));
                    const cz = Math.max(-hd, Math.min(hd, z));
                    const dx = x - cx, dy = y - cy, dz = z - cz;
                    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (len > 1e-9) {
                        pa.setXYZ(i, cx + dx / len * r, cy + dy / len * r, cz + dz / len * r);
                    } else {
                        pa.setXYZ(i, cx, cy, cz);
                    }
                }
                g.computeVertexNormals();
                return g;
            }

            const rbox = (w, h, d, r, seg) => edge(roundBoxGeo(w, h, d, r, seg === undefined ? 2 : seg), 12);

            /* —— 一楼陈设专用：材质与工具 —— */

            const HITMAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
            const DARK = LITMAT(0x2b2b2b);
            const PINK = LITMAT(0xd98a94);

            const CATMAT = LITMAT(0xece6da);
            const CATMAT2 = LITMAT(0xe2dbcd);
            const lloop = (pts, parent) => { const l = new THREE.LineLoop(geo(pts), MAT); (parent || scene).add(l); return l; };
            const sm01 = t => t * t * (3 - 2 * t);
            function solid(g, mat, lmat) {
                const grp = new THREE.Group();
                grp.add(new THREE.Mesh(g, mat));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), lmat || MAT));
                return grp;
            }
            function solidCyl(p1, p2, r, parent, mat) {
                const v = V(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
                const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 8), mat || CATMAT);
                m.position.set((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2);
                m.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize());
                (parent || scene).add(m);
                return m;
            }

            /* ========================================================== */
            /* ============ 一楼生活陈设（魔法餐桌·书架·暖桌·猫等） ============ */
            /* ========================================================== */
            const MTX = 1.8, MTZ = 2.2, MTTOP = 0.78;

            // ---- 12.1 原木餐桌 ----
            put(box(1.15, 0.06, 0.8), MTX, 0.75, MTZ);
            put(box(1.27, 0.04, 0.92), MTX, 0.70, MTZ);
            for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
                put(edge(new THREE.CylinderGeometry(0.035, 0.028, 0.7, 6)),
                    MTX + sx * 0.47, 0.36, MTZ + sz * 0.28, 0, 0, 0);
            put(log(0.94, 0.02), MTX, 0.28, MTZ - 0.28, 0, 0, Math.PI / 2);
            put(log(0.94, 0.02), MTX, 0.28, MTZ + 0.28, 0, 0, Math.PI / 2);

            // ---- 12.2 星象仪 ----
            let orbOn = true, orbP = 1;
            const OX = MTX - 0.38, OZ = MTZ - 0.14;
            const orbG = new THREE.Group();
            orbG.position.set(OX, MTTOP, OZ);
            put(edge(new THREE.CylinderGeometry(0.09, 0.12, 0.06, 10)), 0, 0.03, 0, 0, 0, 0, orbG);
            put(edge(new THREE.CylinderGeometry(0.035, 0.05, 0.05, 8)), 0, 0.08, 0, 0, 0, 0, orbG);
            put(edge(new THREE.SphereGeometry(0.15, 14, 10)), 0, 0.21, 0, 0, 0, 0, orbG);
            put(line([[0, 0.14, 0.13], [0, 0.24, 0.145], [0, 0.29, 0.08]]), 0, 0, 0, orbG);
            put(line([[0, 0.14, -0.13], [0, 0.24, -0.145], [0, 0.29, -0.08]]), 0, 0, 0, orbG);

            const orbRings = [];
            for (const [tilt, spd] of [[0.5, 1.0], [-0.42, -0.75], [Math.PI / 2, 0.55]]) {
                const holder = new THREE.Group();
                holder.position.y = 0.21;
                const t = edge(new THREE.TorusGeometry(0.21, 0.006, 6, 44));
                t.rotation.x = tilt;
                holder.add(t);
                const pl = edge(new THREE.SphereGeometry(0.018, 8, 6));
                pl.position.set(0.21, 0, 0);
                holder.add(pl);
                orbG.add(holder);
                orbRings.push({ holder, spd });
            }
            const orbStars = new THREE.Group();
            orbStars.position.y = 0.21;
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2;
                const st = edge(new THREE.OctahedronGeometry(0.022));
                st.position.set(Math.cos(a) * 0.27, Math.sin(a * 2) * 0.07, Math.sin(a) * 0.27);
                orbStars.add(st);
            }
            orbG.add(orbStars);
            scene.add(orbG);
            regMagic(orbG, () => { orbOn = !orbOn; });
            orbG.userData.sfx = 'magic';

            // ---- 12.3 魔法药剂瓶 ----
            let corkOut = false, corkT = 0;
            const PX = MTX + 0.05, PZ = MTZ + 0.24;
            const potG = new THREE.Group();
            potG.position.set(PX, MTTOP, PZ);
            const PROF = [[0.018, 0.038], [0.035, 0.062], [0.05, 0.076], [0.065, 0.085], [0.08, 0.089],
            [0.10, 0.090], [0.12, 0.086], [0.14, 0.075], [0.16, 0.056], [0.178, 0.034], [0.19, 0.026]];
            for (const [yy, rr] of PROF) {
                const pts = [];
                for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2; pts.push([Math.cos(a) * rr, yy, Math.sin(a) * rr]); }
                lloop(pts, potG);
            }
            for (const ang of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
                const c = Math.cos(ang), s = Math.sin(ang);
                const pts = PROF.map(([yy, rr]) => [c * rr, yy, s * rr]);
                put(line(pts), 0, 0, 0, 0, 0, 0, potG);
            }
            put(edge(new THREE.CylinderGeometry(0.024, 0.024, 0.055, 8)), 0, 0.228, 0, 0, 0, 0, potG);
            put(edge(new THREE.TorusGeometry(0.027, 0.006, 6, 14)), 0, 0.258, 0, Math.PI / 2, 0, 0, potG);

            const LIQ_Y = 0.078;
            const waterMat = new THREE.MeshBasicMaterial({
                color: 0x5aa8dd, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide
            });
            const waterBody = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), waterMat);
            put(waterBody, 0, 0.006, 0, 0, 0, 0, potG);
            const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.077, 20), waterMat);
            put(waterDisc, 0, LIQ_Y - 0.004, 0, -Math.PI / 2, 0, 0, potG);
            const liquidMat = new THREE.LineBasicMaterial({ color: 0x2e6fa3 });
            const liquidMat2 = new THREE.LineBasicMaterial({ color: 0x7db8dd });
            const liquidGeom = new THREE.BufferGeometry();
            liquidGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
            const liquidLoop = new THREE.LineLoop(liquidGeom, liquidMat);
            liquidLoop.frustumCulled = false;
            potG.add(liquidLoop);
            const liquidGeom2 = new THREE.BufferGeometry();
            liquidGeom2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
            const liquidLoop2 = new THREE.LineLoop(liquidGeom2, liquidMat2);
            liquidLoop2.frustumCulled = false;
            potG.add(liquidLoop2);
            scene.add(potG);

            function updateLiquid(time) {
                const arr = liquidGeom.attributes.position.array;
                const amp = corkOut ? 0.007 : 0.0025;
                const spd = corkOut ? 3.2 : 1.1;
                for (let i = 0; i < 24; i++) {
                    const a = i / 24 * Math.PI * 2;
                    const rr = 0.080 + Math.sin(a * 3 + time * spd) * amp;
                    arr[i * 3] = Math.cos(a) * rr;
                    arr[i * 3 + 1] = LIQ_Y + Math.sin(a * 3 - time * spd * 1.3) * amp * 0.6;
                    arr[i * 3 + 2] = Math.sin(a) * rr;
                }
                liquidGeom.attributes.position.needsUpdate = true;
                const arr2 = liquidGeom2.attributes.position.array;
                for (let i = 0; i < 24; i++) {
                    const a = i / 24 * Math.PI * 2;
                    const rr = 0.072 + Math.sin(a * 3 + time * spd + 1.2) * amp * 0.7;
                    arr2[i * 3] = Math.cos(a) * rr;
                    arr2[i * 3 + 1] = LIQ_Y - 0.003 + Math.sin(a * 3 - time * spd * 1.3 + 0.8) * amp * 0.4;
                    arr2[i * 3 + 2] = Math.sin(a) * rr;
                }
                liquidGeom2.attributes.position.needsUpdate = true;
                waterMat.opacity = corkOut ? 0.38 : 0.32;
            }

            const CORK_M = [PX, MTTOP + 0.29, PZ];
            const CORK_L = [PX + 0.17, MTTOP + 0.018, PZ - 0.07];
            const corkG = new THREE.Group();
            put(edge(new THREE.CylinderGeometry(0.021, 0.024, 0.038, 8)), 0, 0, 0, 0, 0, 0, corkG);
            put(line([[0, 0.014, 0.022], [0, -0.008, 0.023]]), 0, 0, 0, corkG);
            corkG.position.set(CORK_M[0], CORK_M[1], CORK_M[2]);
            scene.add(corkG);

            const bubbleMat = new THREE.LineBasicMaterial({ color: 0x2e6fa3 });
            const potBubbles = [];
            for (let i = 0; i < 4; i++) {
                const b = edge(new THREE.SphereGeometry(0.009, 6, 5), 1, bubbleMat);
                b.userData.phase = i / 4;
                b.userData.wob = Math.random() * 6.28;
                b.visible = false;
                scene.add(b);
                potBubbles.push(b);
            }
            regMagic(potG, () => { corkOut = !corkOut; });
            regMagic(corkG, () => { corkOut = !corkOut; });

            // ---- 12.4 魔法书 ----
            let bookOn = true, bookP = 1;
            let flipCur = 0, flipping = false;
            const BX = MTX + 0.30, BZ = MTZ - 0.12;
            const dineBookG = new THREE.Group();
            dineBookG.position.set(BX, MTTOP, BZ);
            dineBookG.rotation.y = 0.4;
            put(box(0.30, 0.018, 0.38), -0.15, 0.012, 0, 0, 0, -0.14, dineBookG);
            put(box(0.30, 0.018, 0.38), 0.15, 0.012, 0, 0, 0, 0.14, dineBookG);
            put(box(0.26, 0.014, 0.34), -0.14, 0.032, 0, 0, 0, -0.12, dineBookG);
            put(box(0.26, 0.014, 0.34), 0.14, 0.032, 0, 0, 0, 0.12, dineBookG);
            put(line([[0, 0.055, -0.19], [0, 0.055, 0.19]]), 0, 0, 0, dineBookG);
            for (const [px, pz] of [[-0.16, -0.08], [-0.10, 0.06], [-0.19, 0.10], [0.08, -0.10], [0.15, 0.05], [0.19, -0.04]])
                put(line([[px - 0.025, 0.045, pz - 0.025], [px + 0.025, 0.045, pz + 0.025]]), 0, 0, 0, dineBookG);
            const pagePivot = new THREE.Group();
            put(box(0.24, 0.007, 0.31), 0.12, 0.0395, 0, 0, 0, 0, pagePivot);
            pagePivot.rotation.z = 0.12;
            pagePivot.visible = false;
            dineBookG.add(pagePivot);
            scene.add(dineBookG);

            const glyphs = [];
            for (let i = 0; i < 7; i++) {
                const g = new THREE.Group();
                for (let s = 0; s < 3; s++) {
                    const a = Math.random() * 1.2 - 0.6;
                    const l = 0.02 + Math.random() * 0.02;
                    put(line([[0, s * 0.028, 0], [Math.sin(a) * l, s * 0.028 + 0.026, 0]]), 0, 0, 0, g);
                }
                g.userData = {
                    age: Math.random() * 2.5, life: 2.5 + Math.random() * 1.2,
                    ox: (Math.random() - 0.5) * 0.22, oz: (Math.random() - 0.5) * 0.18,
                    sway: Math.random() * 6.28
                };
                g.visible = false;
                scene.add(g);
                glyphs.push(g);
            }
            regMagic(dineBookG, () => {
                bookOn = !bookOn;
                if (!flipping) { flipping = true; flipCur = 0; }
            });

            // ---- 12.5 三脚圆凳 ----
            const stools = [];
            function makeStool(x, z, dz) {
                const g = new THREE.Group();
                put(edge(new THREE.CylinderGeometry(0.21, 0.18, 0.05, 12)), 0, 0.45, 0, 0, 0, 0, g);
                for (let i = 0; i < 3; i++) {
                    const a = i * (Math.PI * 2 / 3) + 0.55;
                    logBetween([Math.cos(a) * 0.12, 0.43, Math.sin(a) * 0.12],
                        [Math.cos(a) * 0.19, 0.03, Math.sin(a) * 0.19], 0.024, g);
                }
                g.position.set(x, 0, z);
                g.userData = { bx: x, bz: z, dz, cur: 0, vel: 0, open: false };
                scene.add(g);
                stools.push(g);
                regMagic(g, () => { g.userData.open = !g.userData.open; });
            }
            makeStool(MTX, MTZ - 0.85, -1);
            makeStool(MTX, MTZ + 0.85, 1);

            // ---- 12.6 桌下椭圆地毯 ----
            {
                const r1 = [], r2 = [];
                for (let i = 0; i <= 44; i++) {
                    const a = i / 44 * Math.PI * 2;
                    r1.push([MTX + Math.cos(a) * 1.05, 0.008, MTZ + Math.sin(a) * 0.75]);
                    r2.push([MTX + Math.cos(a) * 0.82, 0.008, MTZ + Math.sin(a) * 0.57]);
                }
                lloop(r1); lloop(r2);
                for (let i = 0; i < 8; i++) {
                    const a = i / 8 * Math.PI * 2;
                    put(line([[MTX + Math.cos(a) * 0.82, 0.008, MTZ + Math.sin(a) * 0.57],
                    [MTX + Math.cos(a) * 1.05, 0.008, MTZ + Math.sin(a) * 0.75]]), 0, 0, 0);
                }
            }

            // ---- 12.7 吊挂木灯 ----
            let lanternLit = true;
            const lanternPivot = new THREE.Group();
            lanternPivot.position.set(MTX, 2.88, MTZ);
            scene.add(lanternPivot);
            put(line([[0, 0, 0], [0, -0.26, 0]]), 0, 0, 0, 0, 0, 0, lanternPivot);
            const lantG = new THREE.Group();
            lantG.position.y = -0.44;
            lanternPivot.add(lantG);
            put(edge(new THREE.ConeGeometry(0.09, 0.07, 4)), 0, 0.13, 0, 0, 0, 0, lantG);
            put(box(0.16, 0.2, 0.16), 0, 0, 0, 0, 0, 0, lantG);
            for (const s of [[0, 0.085], [0, -0.085], [0.085, 0], [-0.085, 0]])
                put(line([[s[0], 0.1, s[1]], [s[0], -0.1, s[1]]]), 0, 0, 0, 0, 0, 0, lantG);
            const lanternFlame = new THREE.Group();
            put(line([[0, -0.06, 0], [0.014, -0.02, 0], [0.014, 0.015, 0], [0, 0.06, 0]]), 0, 0, 0, 0, 0, 0, lanternFlame);
            lantG.add(lanternFlame);

            const haloMat = new THREE.MeshBasicMaterial({ color: 0xffd88f, transparent: true, opacity: 0.14, depthWrite: false });
            const halo = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), haloMat);
            halo.userData.noHit = true;
            put(halo, 0, 0, 0, 0, 0, 0, lantG);

            const beamMat = new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide });
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.85, 2.35, 24, 1, true), beamMat);
            beam.userData.noHit = true;
            put(beam, 0, -1.52, 0, 0, 0, 0, lanternPivot);

            const glowMatA = new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide });
            const glowMatB = new THREE.MeshBasicMaterial({ color: 0xffd88f, transparent: true, opacity: 0.075, depthWrite: false, side: THREE.DoubleSide });
            const floorPool = new THREE.Mesh(new THREE.CircleGeometry(1.15, 28), glowMatA);
            floorPool.userData.noHit = true;
            put(floorPool, MTX, 0.012, MTZ, -Math.PI / 2, 0, 0);
            const floorPool2 = new THREE.Mesh(new THREE.CircleGeometry(0.7, 24), glowMatB);
            floorPool2.userData.noHit = true;
            put(floorPool2, MTX, 0.014, MTZ, -Math.PI / 2, 0, 0);
            const tablePool = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), glowMatB);
            tablePool.userData.noHit = true;
            put(tablePool, MTX, 0.795, MTZ, -Math.PI / 2, 0, 0);
            regMagic(lanternPivot, () => { lanternLit = !lanternLit; });

            /* ---- 12.8 壁炉旁的猫 ---- */
            let catAwake = false, catP = 0;
            const catG = new THREE.Group();
            catG.position.set(-1.85, 0, 1.45);
            catG.rotation.y = Math.PI;
            scene.add(catG);
            const catBody = new THREE.Group();
            catG.add(catBody);
            {
                const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 12), CATMAT);
                bodyMesh.scale.set(1.28, 0.74, 0.95);
                put(bodyMesh, 0, 0.125, 0, 0, 0, 0, catBody);

                for (const s of [1, -1]) {
                    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), CATMAT2);
                    paw.scale.set(0.9, 0.55, 1.15);
                    put(paw, 0.20, 0.072, s * 0.082, 0, 0, s * 0.18, catBody);
                }
            }
            const catHead = new THREE.Group();
            catHead.position.set(0.215, 0.265, 0.02);
            catBody.add(catHead);
            put(new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), CATMAT), 0, 0, 0, 0, 0, 0, catHead);
            const earLG = new THREE.Group();
            earLG.position.set(-0.052, 0.078, 0.012);
            catHead.add(earLG);
            put(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.092, 8), CATMAT), 0, 0.034, 0, 0, Math.PI / 4, -0.20, earLG);
            put(new THREE.Mesh(new THREE.ConeGeometry(0.023, 0.058, 6), PINK), 0, 0.030, 0.011, 0, Math.PI / 4, -0.20, earLG);
            const earRG = new THREE.Group();
            earRG.position.set(0.046, 0.080, 0.014);
            catHead.add(earRG);
            put(new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.092, 8), CATMAT), 0, 0.034, 0, 0, Math.PI / 4, 0.20, earRG);
            put(new THREE.Mesh(new THREE.ConeGeometry(0.023, 0.058, 6), PINK), 0, 0.030, 0.011, 0, Math.PI / 4, 0.20, earRG);
            const eyesOpen = new THREE.Group();
            catHead.add(eyesOpen);
            for (const ex of [-0.038, 0.034]) {
                put(new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), DARK), ex, 0.008, 0.088, 0, 0, 0, eyesOpen);
                put(new THREE.Mesh(new THREE.SphereGeometry(0.0042, 6, 4),
                    LITMAT(0xffffff)), ex + 0.005, 0.014, 0.096, 0, 0, 0, eyesOpen);
            }
            /* 闭眼：= 号（每眼两条短横线） */
            const eyesClosed = new THREE.Group();
            eyesClosed.visible = false;
            catHead.add(eyesClosed);
            for (const ex of [-0.038, 0.034]) {
                put(line([[ex - 0.016, 0.012, 0.091], [ex + 0.016, 0.012, 0.091]]), 0, 0, 0, 0, 0, 0, eyesClosed);
                put(line([[ex - 0.016, -0.002, 0.091], [ex + 0.016, -0.002, 0.091]]), 0, 0, 0, 0, 0, 0, eyesClosed);
            }
            put(new THREE.Mesh(new THREE.OctahedronGeometry(0.011), PINK), 0, -0.014, 0.100, 0, 0, 0, catHead);
            put(line([[0, -0.019, 0.100], [0, -0.026, 0.098]]), 0, 0, 0, 0, 0, 0, catHead);
            put(line([
                [-0.017, -0.024, 0.096],
                [-0.014, -0.034, 0.098],
                [-0.006, -0.038, 0.100],
                [0.000, -0.030, 0.100],
                [0.006, -0.038, 0.100],
                [0.014, -0.034, 0.098],
                [0.017, -0.024, 0.096]
            ]), 0, 0, 0, 0, 0, 0, catHead);
            for (const s of [-1, 1])
                put(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6),
                    new THREE.MeshBasicMaterial({ color: 0xf2b0b6, transparent: true, opacity: 0.55 })),
                    s * 0.063, -0.012, 0.075, 0, 0, 0, catHead);
            for (const s of [-1, 1]) {
                put(line([[s * 0.070, 0.008, 0.075], [s * 0.142, 0.016, 0.081]]), 0, 0, 0, 0, 0, 0, catHead);
                put(line([[s * 0.070, -0.006, 0.075], [s * 0.142, -0.012, 0.081]]), 0, 0, 0, 0, 0, 0, catHead);
            }
            const tailSegs = [];
            {
                const seg1 = new THREE.Group();
                seg1.position.set(-0.20, 0.10, 0.11);
                catBody.add(seg1);
                solidCyl([0, 0, 0], [0.06, 0.00, 0.15], 0.023, seg1);
                const seg2 = new THREE.Group();
                seg2.position.set(0.06, 0.00, 0.15);
                seg1.add(seg2);
                solidCyl([0, 0, 0], [0.17, -0.01, 0.03], 0.021, seg2);
                const seg3 = new THREE.Group();
                seg3.position.set(0.17, -0.01, 0.03);
                seg2.add(seg3);
                solidCyl([0, 0, 0], [0.14, -0.02, -0.06], 0.019, seg3);
                put(new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), CATMAT2), 0.14, -0.02, -0.06, 0, 0, 0, seg3);
                tailSegs.push(seg1, seg2, seg3);
            }
            const catHit = new THREE.Mesh(new THREE.SphereGeometry(0.20, 8, 6), HITMAT);
            catHit.position.set(0, 0.12, 0);
            catG.add(catHit);
            regMagic(catG, () => { catAwake = !catAwake; });
            catG.userData.sfx = 'cat';

            /* ---- 猫旁边：毛线球 ---- */
            const yarnG = new THREE.Group();
            yarnG.position.set(-1.28, 0, 1.02);
            scene.add(yarnG);
            const yarnBall = new THREE.Group();
            yarnG.add(yarnBall);
            {
                put(edge(new THREE.SphereGeometry(0.085, 12, 9)), 0, 0.085, 0, 0, 0, 0, yarnBall);
                for (const [rx, ry] of [[Math.PI / 2, 0], [Math.PI / 2, 0.9], [Math.PI / 2, -0.7], [0.5, 0.3], [-0.6, 1.2]]) {
                    const pts = [];
                    for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI * 2; pts.push([Math.cos(a) * 0.086, Math.sin(a) * 0.086, 0]); }
                    put(new THREE.LineLoop(geo(pts), MAT), 0, 0.085, 0, rx, ry, 0, yarnBall);
                }
                put(line([[0.06, 0.115, 0.05], [0.14, 0.096, 0.09], [0.22, 0.091, 0.04], [0.28, 0.091, -0.05]]), 0, 0, 0, 0, 0, 0, yarnBall);
            }
            yarnG.userData = { vy: 0, y: 0, spinV: 0 };
            regMagic(yarnG, () => {
                yarnG.userData.vy = 2.4;
                yarnG.userData.spinV = (Math.random() - 0.5) * 12;
            });

            /* ---- 12.9 左墙书架 + 可抽拉的书 ---- */
            const shelfBooks = [];
            const SFX = -3.72, SFZ = -2.85, SFW = 1.3;
            {
                put(box(0.3, 1.86, 0.05), SFX, 1.05, SFZ - SFW / 2);
                put(box(0.3, 1.86, 0.05), SFX, 1.05, SFZ + SFW / 2);
                put(box(0.02, 1.86, 1.3), SFX - 0.15, 1.05, SFZ);
                for (const sy of [0.18, 0.78, 1.38, 1.95]) put(box(0.3, 0.05, 1.3), SFX, sy, SFZ);

                function addBook(z, yBase, h, th) {
                    const g = new THREE.Group();
                    put(box(0.18, h, th), 0, h / 2, 0, 0, 0, 0, g);
                    put(line([[0.092, h * 0.55, -th * 0.3], [0.092, h * 0.55, th * 0.3]]), 0, 0, 0, 0, 0, 0, g);
                    g.position.set(SFX + 0.02, yBase, z);
                    g.userData = { out: false, cur: 0, vel: 0, bx: SFX + 0.02 };
                    scene.add(g);
                    shelfBooks.push(g);
                    regMagic(g, () => { g.userData.out = !g.userData.out; });
                }
                const HS = [0.36, 0.30, 0.40, 0.33, 0.27, 0.38, 0.31, 0.35, 0.29, 0.37, 0.34, 0.28];
                const TS = [0.07, 0.06, 0.075, 0.065, 0.07, 0.062, 0.072];
                let hi = 0, ti = 0;
                for (const s of [{ y: 0.205, z0: -3.42, z1: -2.30 },
                { y: 0.805, z0: -3.42, z1: -2.78 },
                { y: 1.405, z0: -3.42, z1: -2.30 }]) {
                    let z = s.z0;
                    while (z < s.z1 - 0.07) {
                        const h = HS[hi++ % HS.length];
                        const th = TS[ti++ % TS.length];
                        addBook(z + th / 2, s.y, h, th);
                        z += th + 0.012;
                    }
                }
            }

            /* ---- 12.9a 左窗下魔法书堆 ---- */
            const bookPileG = new THREE.Group();
            bookPileG.position.set(-3.62, 0, -1.4);
            scene.add(bookPileG);
            const pileBooks = [];
            let pileState = 'stacked', pileT = 0;
            {
                const DIMS = [
                    [0.24, 0.058, 0.17], [0.21, 0.052, 0.155], [0.25, 0.062, 0.16],
                    [0.24, 0.024, 0.17],
                    [0.235, 0.055, 0.165], [0.22, 0.050, 0.15], [0.245, 0.060, 0.17],
                    [0.22, 0.024, 0.155],
                    [0.23, 0.056, 0.16], [0.20, 0.046, 0.15],
                    [0.24, 0.024, 0.165],
                    [0.235, 0.058, 0.16], [0.22, 0.055, 0.155]
                ];
                let cy = 0;
                DIMS.forEach((dm, i) => {
                    const [w, h, d] = dm;
                    const b = new THREE.Group();
                    const isOpen = (h < 0.03);
                    if (isOpen) {
                        const lp = box(w / 2 - 0.012, 0.010, d - 0.02); lp.rotation.z = 0.10;
                        put(lp, -(w / 4 - 0.004), 0.006, 0, 0, 0, 0, b);
                        const rp = box(w / 2 - 0.012, 0.010, d - 0.02); rp.rotation.z = -0.10;
                        put(rp, (w / 4 - 0.004), 0.006, 0, 0, 0, 0, b);
                        put(line([[-(w / 4) + 0.01, 0.013, -d * 0.36], [-(w / 4) + 0.03, 0.013, d * 0.34]]), 0, 0, 0, 0, 0, 0, b);
                        put(line([[(w / 4) - 0.03, 0.013, -d * 0.34], [(w / 4) - 0.01, 0.013, d * 0.36]]), 0, 0, 0, 0, 0, 0, b);
                    } else {
                        put(box(w, h, d), 0, h / 2, 0, 0, 0, 0, b);
                        put(line([[w / 2, h * 0.35, -d * 0.42], [w / 2, h * 0.35, d * 0.42]]), 0, 0, 0, 0, 0, 0, b);
                        put(line([[w / 2, h * 0.65, -d * 0.42], [w / 2, h * 0.65, d * 0.42]]), 0, 0, 0, 0, 0, 0, b);
                    }
                    const fy = isOpen ? 0.014 : h / 2 + 0.004;
                    b.userData = {
                        sx: (Math.random() - 0.5) * 0.04, sy: cy, sz: (Math.random() - 0.5) * 0.04,
                        sry: (Math.random() - 0.5) * 0.35,
                        fx: 0.16 + i * 0.048 + (Math.random() - 0.5) * 0.04,
                        fz: -(0.22 + i * 0.052 + (Math.random() - 0.5) * 0.06),
                        fy, fry: Math.random() * Math.PI * 2
                    };
                    b.position.set(b.userData.sx, cy, b.userData.sz);
                    b.rotation.y = b.userData.sry;
                    cy += h + 0.003;
                    bookPileG.add(b);
                    pileBooks.push(b);
                });
            }
            regMagic(bookPileG, () => {
                if (pileState === 'stacked') { pileState = 'falling'; pileT = 0; }
                else if (pileState === 'fallen') { pileState = 'rising'; pileT = 0; }
            });

            /* ---- 12.9b 沙漏 ---- */
            let hgFlip = false, hgRun = 0, hgRot = 0, hgRotV = 0, hgSand = 1;
            const sandMat = new THREE.LineBasicMaterial({ color: 0xb08948 });
            const sloop = (pts, parent) => { const l = new THREE.LineLoop(geo(pts), sandMat); (parent || scene).add(l); return l; };
            const HG_H = 0.36, HG_MID = HG_H / 2;
            const hg = new THREE.Group();
            hg.position.set(SFX, 0.805 + HG_MID, -2.44);
            scene.add(hg);
            const hgInner = new THREE.Group();
            hgInner.position.y = -HG_MID;
            hg.add(hgInner);
            {
                put(box(0.17, 0.016, 0.17), 0, 0.008, 0, 0, 0, 0, hgInner);
                put(box(0.17, 0.016, 0.17), 0, HG_H - 0.008, 0, 0, 0, 0, hgInner);
                for (const [px, pz] of [[-0.066, -0.066], [0.066, -0.066], [-0.066, 0.066], [0.066, 0.066]])
                    put(edge(new THREE.CylinderGeometry(0.008, 0.008, HG_H - 0.032, 6)),
                        px, HG_MID, pz, 0, 0, 0, hgInner);
                lloop([[-0.056, HG_H - 0.022], [-0.052, HG_H - 0.055], [-0.04, HG_H - 0.10], [-0.02, HG_H - 0.145],
                [-0.009, HG_H - 0.17], [0.009, HG_H - 0.17], [0.02, HG_H - 0.145], [0.04, HG_H - 0.10],
                [0.052, HG_H - 0.055], [0.056, HG_H - 0.022]], hgInner);
                lloop([[-0.009, 0.17], [-0.02, 0.145], [-0.04, 0.10], [-0.052, 0.055], [-0.056, 0.022],
                [0.056, 0.022], [0.052, 0.055], [0.04, 0.10], [0.02, 0.145], [0.009, 0.17]], hgInner);
            }
            const pileTopG = new THREE.Group(); pileTopG.position.set(0, 0.315, 0); hgInner.add(pileTopG);
            sloop([[-0.045, 0.02], [0.045, 0.02], [0, -0.08]], pileTopG);
            sloop([[-0.030, 0.02], [0.030, 0.02], [0, -0.05]], pileTopG);
            const pileBotG = new THREE.Group(); pileBotG.position.set(0, 0.045, 0); hgInner.add(pileBotG);
            sloop([[-0.045, -0.02], [0.045, -0.02], [0, 0.09]], pileBotG);
            sloop([[-0.030, -0.02], [0.030, -0.02], [0, 0.055]], pileBotG);
            const hgStreams = [];
            for (let i = 0; i < 3; i++) {
                const s = new THREE.Line(geo([[0, 0, 0], [0, -0.02, 0]]), sandMat);
                hgInner.add(s);
                s.visible = false;
                hgStreams.push(s);
            }
            regMagic(hg, () => { hgFlip = !hgFlip; hgSand = 1; hgRun = 5; });

            /* ---- 12.9c 宝箱 ---- */
            let chestOpen = false, chestP = 0, chestV = 0;
            const chest = new THREE.Group();
            chest.position.set(SFX, 0.805, -2.66);
            scene.add(chest);
            put(box(0.16, 0.1, 0.12), 0, 0.05, 0, 0, 0, 0, chest);
            const chestLid = new THREE.Group();
            chestLid.position.set(0, 0.1, -0.06);
            put(box(0.16, 0.035, 0.12), 0, 0.0175, 0.06, 0, 0, 0, chestLid);
            chest.add(chestLid);
            put(line([[-0.05, 0.101, 0.06], [-0.05, 0.101, -0.06]]), 0, 0, 0, 0, 0, 0, chest);
            put(line([[0.05, 0.101, 0.06], [0.05, 0.101, -0.06]]), 0, 0, 0, 0, 0, 0, chest);
            const chestGem = edge(new THREE.OctahedronGeometry(0.02), 1, new THREE.LineBasicMaterial({ color: 0x2e8b57 }));
            put(chestGem, 0, 0.115, 0, 0, 0, 0, chest);
            chestGem.visible = false;
            regMagic(chest, () => { chestOpen = !chestOpen; });

            /* ---- 12.9d 旋转星铃 ---- */
            let carOn = false, carP = 0;
            const car = new THREE.Group();
            car.position.set(SFX, 1.975, -3.05);
            scene.add(car);
            put(edge(new THREE.CylinderGeometry(0.075, 0.09, 0.05, 10)), 0, 0.025, 0, 0, 0, 0, car);
            put(edge(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6)), 0, 0.21, 0, 0, 0, 0, car);
            const carCanopy = new THREE.Group();
            carCanopy.position.y = 0.38;
            car.add(carCanopy);
            put(edge(new THREE.ConeGeometry(0.11, 0.07, 10)), 0, 0.035, 0, 0, 0, 0, carCanopy);
            const carStars = [];
            for (let i = 0; i < 4; i++) {
                const a = i * Math.PI / 2;
                const sx = Math.cos(a) * 0.09, sz = Math.sin(a) * 0.09;
                put(line([[sx, 0, sz], [sx, -0.06, sz]]), 0, 0, 0, 0, 0, 0, carCanopy);
                const st = edge(new THREE.OctahedronGeometry(0.015));
                put(st, sx, -0.072, sz, 0, 0, 0, carCanopy);
                carStars.push(st);
            }
            regMagic(car, () => { carOn = !carOn; });

            /* ---- 12.9e 大魔女坩埚 ---- */
            const CCX = -2.35, CCZ = -0.45;
            const STOVE_TOP = 0.58;
            const CAL_UP = 0.34;
            const cauldronG = new THREE.Group();
            cauldronG.position.set(CCX, 0, CCZ);
            scene.add(cauldronG);
            {
                const BN = 15, BR = 0.62;
                for (let course = 0; course < 4; course++) {
                    const y = 0.075 + course * 0.145;
                    const off = course % 2 ? Math.PI / BN : 0;
                    for (let i = 0; i < BN; i++) {
                        const a = i / BN * Math.PI * 2 + off;
                        let da = Math.abs(a - (-Math.PI / 2));
                        da = Math.min(da, Math.PI * 2 - da);
                        if (da < 0.30) continue;
                        const b = box(0.28, 0.13, 0.17);
                        b.position.set(Math.cos(a) * BR, y, Math.sin(a) * BR);
                        b.rotation.y = -a + Math.PI / 2;
                        cauldronG.add(b);
                    }
                }
                logBetween([-0.30, 0.12, -0.10], [0.30, 0.12, -0.14], 0.05, cauldronG);
                logBetween([-0.26, 0.12, 0.12], [0.28, 0.12, 0.08], 0.05, cauldronG);
                logBetween([-0.28, 0.18, -0.02], [0.30, 0.18, -0.06], 0.045, cauldronG);
                logBetween([0.10, 0.11, -0.30], [0.12, 0.09, -0.78], 0.045, cauldronG);
                const CPROF = [[0.08, 0.40], [0.20, 0.50], [0.34, 0.545], [0.48, 0.555], [0.62, 0.55], [0.74, 0.515], [0.86, 0.455], [0.94, 0.42]];
                const lathePts = [new THREE.Vector2(0.05, 0.08 + CAL_UP)];
                for (const [yy, rr] of CPROF) lathePts.push(new THREE.Vector2(rr, yy + CAL_UP));
                lathePts.push(new THREE.Vector2(0.38, 0.94 + CAL_UP));
                cauldronG.add(new THREE.Mesh(new THREE.LatheGeometry(lathePts, 28), FILL));
                for (const [yy, rr] of CPROF) {
                    const pts = [];
                    for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2; pts.push([Math.cos(a) * rr, yy + CAL_UP, Math.sin(a) * rr]); }
                    lloop(pts, cauldronG);
                }
                for (const ang of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4, Math.PI * 0.75, -Math.PI * 0.75]) {
                    const c = Math.cos(ang), s = Math.sin(ang);
                    put(line(CPROF.map(([yy, rr]) => [c * rr, yy + CAL_UP, s * rr])), 0, 0, 0, 0, 0, 0, cauldronG);
                }
                const rim = edge(new THREE.TorusGeometry(0.42, 0.04, 6, 32));
                rim.rotation.x = Math.PI / 2;
                put(rim, 0, 0.94 + CAL_UP, 0, 0, 0, 0, cauldronG);
                const calLiqMat = new THREE.MeshBasicMaterial({
                    color: 0x4a7d4e, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide
                });
                const calLiq = new THREE.Mesh(new THREE.CircleGeometry(0.37, 28), calLiqMat);
                calLiq.userData.noHit = true;
                put(calLiq, 0, 0.72 + CAL_UP, 0, -Math.PI / 2, 0, 0, cauldronG);
            }
            const calSurfMat = new THREE.LineBasicMaterial({ color: 0x2e5d38 });
            const calSurfGeom = new THREE.BufferGeometry();
            calSurfGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(28 * 3), 3));
            const calSurf = new THREE.LineLoop(calSurfGeom, calSurfMat);
            calSurf.frustumCulled = false;
            cauldronG.add(calSurf);
            const stirG = new THREE.Group();
            cauldronG.add(stirG);
            const stickAsm = new THREE.Group();
            stickAsm.position.set(0, 0, 0);
            stirG.add(stickAsm);
            logBetween([0.16, 0.96, 0], [0.30, 1.40, 0], 0.026, stickAsm);
            put(edge(new THREE.SphereGeometry(0.032, 8, 6)), 0.31, 1.44, 0, 0, 0, 0, stickAsm);
            const calFireOutMat = new THREE.LineBasicMaterial({ color: 0x3b6fd6 });
            const calFireMidMat = new THREE.LineBasicMaterial({ color: 0x6fa8ff });
            const calFireInMat = new THREE.LineBasicMaterial({ color: 0xcfe8ff });
            const calWavy = [];
            makeWavyFlame(CCX, CCZ, 0.13, 0.54, 0.21, calFireOutMat, 0.0, 2.6, calWavy);
            makeWavyFlame(CCX + 0.02, CCZ - 0.02, 0.13, 0.38, 0.13, calFireMidMat, 2.3, 3.1, calWavy);
            makeWavyFlame(CCX - 0.02, CCZ + 0.02, 0.13, 0.22, 0.06, calFireInMat, 4.1, 3.6, calWavy);
            makeWavyFlame(CCX - 0.22, CCZ + 0.14, 0.13, 0.34, 0.09, calFireOutMat, 1.2, 3.0, calWavy);
            makeWavyFlame(CCX + 0.23, CCZ - 0.15, 0.13, 0.30, 0.08, calFireOutMat, 3.4, 2.9, calWavy);
            makeWavyFlame(CCX - 0.10, CCZ - 0.40, 0.13, 0.44, 0.11, calFireOutMat, 5.0, 2.8, calWavy);
            makeWavyFlame(CCX + 0.12, CCZ - 0.41, 0.13, 0.40, 0.09, calFireMidMat, 0.8, 3.2, calWavy);
            const calGlowMat = new THREE.MeshBasicMaterial({
                color: 0x6fa8ff, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide
            });
            const calGlow = new THREE.Mesh(new THREE.CircleGeometry(0.80, 28), calGlowMat);
            calGlow.userData.noHit = true;
            put(calGlow, 0, 0.014, 0, -Math.PI / 2, 0, 0, cauldronG);
            const calBubbles = [];
            for (let i = 0; i < 8; i++) {
                const b = edge(new THREE.SphereGeometry(0.026, 6, 5), 1, calSurfMat);
                b.userData.phase = i / 8;
                b.userData.br = 0.05 + Math.random() * 0.26;
                b.userData.ba = Math.random() * 6.28;
                scene.add(b);
                calBubbles.push(b);
            }
            let stirRun = 0, stirAng = 0, bubbleI = 0.3;
            regMagic(cauldronG, () => { stirRun = 4.5; });

            /* ---- 灶台旁：固定木台 ---- */
            const platformG = new THREE.Group();
            platformG.position.set(-1.35, 0, -1.5);
            platformG.rotation.y = 0.4;
            scene.add(platformG);
            put(box(0.72, 0.30, 0.62), 0, 0.15, 0, 0, 0, 0, platformG);
            put(box(0.78, 0.045, 0.68), 0, 0.322, 0, 0, 0, 0, platformG);
            for (const px of [-0.19, 0, 0.19])
                put(line([[px - 0.09, 0.346, -0.335], [px - 0.09, 0.346, 0.335]]), 0, 0, 0, 0, 0, 0, platformG);

            /* ---- 左墙试剂药水架 ---- */
            const reagents = [];
            {
                const SHX = -3.85, SHZ = -0.1;
                for (const sy of [1.42, 1.74])
                    put(box(0.07, 0.035, 1.15), SHX, sy, SHZ);
                for (const sz of [-0.55, -0.1, 0.35])
                    for (const sy of [1.40, 1.72])
                        put(line([[SHX - 0.12, sy - 0.14, sz], [SHX + 0.035, sy, sz]]), 0, 0, 0);
                const reGlassMat = new THREE.MeshBasicMaterial({
                    color: 0xeaf4f0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide
                });
                const corkMat = LITMAT(0xc9a877);
                function makeReagent(z, baseY, col, r, bh) {
                    const g = new THREE.Group();
                    put(solid(new THREE.CylinderGeometry(r, r * 0.92, bh, 10), reGlassMat), 0, bh / 2, 0, 0, 0, 0, g);
                    const lh = bh * 0.62;
                    const liqMat = new THREE.MeshBasicMaterial({
                        color: col, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide
                    });
                    put(solid(new THREE.CylinderGeometry(r * 0.8, r * 0.75, lh, 10), liqMat), 0, lh / 2 + 0.005, 0, 0, 0, 0, g);
                    const surf = [];
                    for (let k = 0; k <= 14; k++) { const a = k / 14 * Math.PI * 2; surf.push([Math.cos(a) * r * 0.8, lh + 0.006, Math.sin(a) * r * 0.8]); }
                    put(new THREE.LineLoop(geo(surf), new THREE.LineBasicMaterial({ color: col })), 0, 0, 0, 0, 0, 0, g);
                    put(solid(new THREE.CylinderGeometry(r * 0.34, r * 0.82, 0.045, 10), reGlassMat), 0, bh + 0.022, 0, 0, 0, 0, g);
                    put(solid(new THREE.CylinderGeometry(r * 0.34, r * 0.36, 0.05, 10), reGlassMat), 0, bh + 0.069, 0, 0, 0, 0, g);
                    put(solid(new THREE.CylinderGeometry(r * 0.3, r * 0.35, 0.045, 8), corkMat), 0, bh + 0.116, 0, 0, 0, 0, g);
                    g.position.set(SHX + 0.02, baseY, z);
                    g.userData = { run: 0, by: baseY };
                    scene.add(g);
                    reagents.push(g);
                    regMagic(g, () => { g.userData.run = 1.3; });
                }
                makeReagent(-0.52, 1.4375, 0xc0392b, 0.040, 0.100);
                makeReagent(-0.25, 1.4375, 0x2980b9, 0.045, 0.115);
                makeReagent(0.02, 1.4375, 0x8e44ad, 0.036, 0.090);
                makeReagent(0.28, 1.4375, 0xe67e22, 0.042, 0.100);
                makeReagent(-0.40, 1.7575, 0x27ae60, 0.043, 0.110);
                makeReagent(-0.10, 1.7575, 0xd4ac0d, 0.038, 0.090);
                makeReagent(0.20, 1.7575, 0x16a085, 0.040, 0.100);
            }

            /* ---- 紫色魔法阵 ---- */
            const MC_X = -2.75, MC_Z = -2.15;
            const mcG = new THREE.Group();
            mcG.position.set(MC_X, 0.015, MC_Z);
            scene.add(mcG);
            const mcMat = new THREE.LineBasicMaterial({ color: 0x8a4fd6, transparent: true, opacity: 0.55 });
            const mcLoop = (pts, parent, mat) => { const l = new THREE.LineLoop(geo(pts), mat || mcMat); parent.add(l); return l; };
            const mcBase = new THREE.Group();
            mcG.add(mcBase);
            {
                const ring = (r, seg) => { const p = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; p.push([Math.cos(a) * r, 0, Math.sin(a) * r]); } return p; };
                const poly = (r, n, rot) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 + rot; p.push([Math.cos(a) * r, 0, Math.sin(a) * r]); } return p; };
                const sc = (cx, cz, r) => { const p = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2; p.push([cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r]); } return p; };
                mcLoop(ring(0.72, 48), mcBase);
                mcLoop(ring(0.68, 48), mcBase);
                mcLoop(ring(0.55, 44), mcBase);
                mcLoop(ring(0.36, 40), mcBase);
                mcLoop(ring(0.14, 24), mcBase);
                mcLoop(poly(0.55, 6, 0), mcBase);
                mcLoop(poly(0.50, 3, -Math.PI / 2), mcBase);
                mcLoop(poly(0.50, 3, Math.PI / 2), mcBase);
                for (let i = 0; i < 12; i++) {
                    const a = i / 12 * Math.PI * 2;
                    mcBase.add(new THREE.Line(geo([[Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14], [Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36]]), mcMat));
                }
                for (let i = 0; i < 24; i++) {
                    const a = i / 24 * Math.PI * 2;
                    mcBase.add(new THREE.Line(geo([[Math.cos(a - 0.02) * 0.68, 0, Math.sin(a - 0.02) * 0.68], [Math.cos(a + 0.02) * 0.68, 0, Math.sin(a + 0.02) * 0.68]]), mcMat));
                    mcBase.add(new THREE.Line(geo([[Math.cos(a) * 0.68, 0, Math.sin(a) * 0.68], [Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72]]), mcMat));
                }
                for (let i = 0; i < 6; i++) {
                    const a = i / 6 * Math.PI * 2;
                    mcLoop(sc(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.045), mcBase);
                }
            }
            const mcFloats = [];
            {
                const mkMat = c => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0 });
                const ring = (r, seg) => { const p = []; for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; p.push([Math.cos(a) * r, 0, Math.sin(a) * r]); } return p; };
                const poly = (r, n, rot) => { const p = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2 + rot; p.push([Math.cos(a) * r, 0, Math.sin(a) * r]); } return p; };
                {
                    const g = new THREE.Group(); const m = mkMat(0xd84fd0);
                    mcLoop(ring(0.30, 36), g, m);
                    mcLoop(poly(0.27, 3, -Math.PI / 2), g, m);
                    mcLoop(ring(0.10, 20), g, m);
                    mcFloats.push({ g, m, ty: 0.80, spd: 1.5, ph: 0 });
                }
                {
                    const g = new THREE.Group(); const m = mkMat(0x4f9bd8);
                    mcLoop(poly(0.24, 6, 0), g, m);
                    mcLoop(poly(0.16, 6, Math.PI / 6), g, m);
                    for (let i = 0; i < 6; i++) {
                        const a = i / 6 * Math.PI * 2;
                        g.add(new THREE.Line(geo([[Math.cos(a) * 0.16, 0, Math.sin(a) * 0.16], [Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24]]), m));
                    }
                    mcFloats.push({ g, m, ty: 1.25, spd: -1.1, ph: 1 });
                }
                {
                    const g = new THREE.Group(); const m = mkMat(0xd8a84f);
                    mcLoop(ring(0.26, 32), g, m);
                    mcLoop(ring(0.18, 28), g, m);
                    for (let i = 0; i < 8; i++) {
                        const a = i / 8 * Math.PI * 2;
                        g.add(new THREE.Line(geo([[Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], [Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26]]), m));
                    }
                    mcFloats.push({ g, m, ty: 1.70, spd: 1.9, ph: 2 });
                }
                {
                    const g = new THREE.Group(); const m = mkMat(0x4fd88a);
                    const star = []; for (let i = 0; i <= 5; i++) { const a = (i * 2 / 5) * Math.PI * 2 - Math.PI / 2; star.push([Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26]); }
                    mcLoop(star, g, m);
                    mcLoop(ring(0.26, 32), g, m);
                    mcLoop(ring(0.10, 20), g, m);
                    mcFloats.push({ g, m, ty: 2.10, spd: -1.6, ph: 3 });
                }
                {
                    const g = new THREE.Group(); const m = mkMat(0x4fd8d8);
                    mcLoop(poly(0.22, 4, 0), g, m);
                    mcLoop(poly(0.22, 4, Math.PI / 4), g, m);
                    mcLoop(ring(0.28, 32), g, m);
                    mcFloats.push({ g, m, ty: 2.45, spd: 1.2, ph: 4 });
                }
                {
                    const g = new THREE.Group(); const m = mkMat(0x9b4fd8);
                    mcLoop(ring(0.34, 36), g, m);
                    mcLoop(poly(0.30, 3, Math.PI / 2), g, m);
                    mcLoop(ring(0.20, 28), g, m);
                    mcFloats.push({ g, m, ty: 0.48, spd: 2.2, ph: 5 });
                }
                for (const f of mcFloats) { f.g.visible = false; mcG.add(f.g); }
            }
            const mcParts = [];
            {
                const cols = [0xd84fd0, 0x4f9bd8, 0xd8a84f, 0x8a4fd6, 0x4fd88a, 0x4fd8d8, 0x9b4fd8];
                for (let i = 0; i < 24; i++) {
                    const m = new THREE.LineBasicMaterial({ color: cols[i % cols.length] });
                    const p = edge(new THREE.OctahedronGeometry(0.016), 1, m);
                    p.visible = false;
                    scene.add(p);
                    mcParts.push({
                        p, a: Math.random() * Math.PI * 2, r: 0.15 + Math.random() * 0.55,
                        ph: Math.random(), spd: 0.6 + Math.random() * 0.8
                    });
                }
            }
            const mcHit = new THREE.Mesh(new THREE.CircleGeometry(0.75, 28), HITMAT);
            mcHit.rotation.x = -Math.PI / 2;
            mcHit.position.y = 0.002;
            mcG.add(mcHit);
            let mcRun = 0;
            regMagic(mcG, () => { if (mcRun <= 0) mcRun = 8.0; });
            mcG.userData.sfx = 'magic';

            /* ---- 12.9f 长餐桌 ---- */
            const DT_X = 1.6, DT_Z = -3.35;
            const DTOP = 0.77;
            put(box(2.6, 0.06, 0.8), DT_X, 0.74, DT_Z);
            put(box(2.72, 0.04, 0.92), DT_X, 0.69, DT_Z);
            for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
                put(edge(new THREE.CylinderGeometry(0.032, 0.026, 0.68, 6)),
                    DT_X + sx * 1.15, 0.35, DT_Z + sz * 0.32, 0, 0, 0);

            const plates = [];
            function makePlate(x, z, food) {
                const g = new THREE.Group();
                put(edge(new THREE.CylinderGeometry(0.14, 0.115, 0.022, 18)), 0, 0.011, 0, 0, 0, 0, g);
                put(edge(new THREE.TorusGeometry(0.10, 0.005, 6, 26)), 0, 0.022, 0, Math.PI / 2, 0, 0, g);
                if (food === 'fish') {
                    lloop([[0.085, 0.034, 0], [0.07, 0.034, 0.026], [0.03, 0.034, 0.04], [-0.02, 0.034, 0.036],
                    [-0.055, 0.034, 0.012], [-0.055, 0.034, -0.012], [-0.02, 0.034, -0.036],
                    [0.03, 0.034, -0.04], [0.07, 0.034, -0.026]], g);
                    lloop([[-0.05, 0.034, 0], [-0.09, 0.034, 0.032], [-0.078, 0.034, 0], [-0.09, 0.034, -0.032]], g);
                    lloop([[0.012, 0.034, 0.016], [-0.012, 0.034, 0.036], [-0.038, 0.034, 0.010]], g);
                    put(edge(new THREE.CircleGeometry(0.006, 6)), 0.058, 0.037, 0.006, -Math.PI / 2, 0, 0, g);
                    put(line([[0.012, 0.036, -0.028], [0.04, 0.036, -0.004]]), 0, 0, 0, 0, 0, 0, g);
                    put(line([[-0.012, 0.036, -0.026], [0.016, 0.036, -0.002]]), 0, 0, 0, 0, 0, 0, g);
                }
                if (food === 'egg') {
                    const RS = [0.075, 0.088, 0.078, 0.092, 0.070, 0.082, 0.090, 0.076];
                    const w = [];
                    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.push([Math.cos(a) * RS[i], 0.030, Math.sin(a) * RS[i]]); }
                    lloop(w, g);
                    put(edge(new THREE.CircleGeometry(0.032, 14)), 0.012, 0.034, 0.006, -Math.PI / 2, 0, 0, g);
                    put(edge(new THREE.CircleGeometry(0.013, 10)), 0.012, 0.036, 0.006, -Math.PI / 2, 0, 0, g);
                }
                if (food === 'pancakes') {
                    for (let i = 0; i < 3; i++)
                        put(edge(new THREE.CylinderGeometry(0.095 - i * 0.008, 0.085 - i * 0.008, 0.02, 16)),
                            0.008 * i, 0.032 + 0.021 * i, 0, 0, 0, 0, g);
                    put(box(0.034, 0.016, 0.026), 0.012, 0.096, 0, 0, 0, 0, g);
                }
                g.position.set(x, DTOP, z);
                scene.add(g);
                g.userData.spinV = 0;
                plates.push(g);
                regMagic(g, () => { g.userData.spinV = 9; });
            }
            makePlate(DT_X - 0.85, DT_Z - 0.12, 'fish');
            makePlate(DT_X + 0.85, DT_Z - 0.12, 'egg');
            makePlate(DT_X + 0.30, DT_Z - 0.32, 'pancakes');

            /* 茶杯（餐桌/暖桌通用） */
            const cups = [];
            function makeCup(x, z, baseY, parent) {
                const by = (baseY === undefined) ? DTOP : baseY;
                const g = new THREE.Group();
                put(edge(new THREE.CylinderGeometry(0.045, 0.038, 0.09, 12)), 0, 0.045, 0, 0, 0, 0, g);
                put(edge(new THREE.TorusGeometry(0.03, 0.008, 6, 12)), 0.052, 0.045, 0, 0, 0, 0, g);
                const steam = new THREE.Group();
                for (const off of [-0.015, 0, 0.015])
                    put(line([[off, 0, 0], [off + 0.012, 0.035, 0.003], [off - 0.01, 0.07, -0.003], [off + 0.008, 0.105, 0.002]]),
                        0, 0, 0, 0, 0, 0, steam);
                steam.position.y = 0.10;
                steam.visible = false;
                g.add(steam);
                g.position.set(x, by, z);
                (parent || scene).add(g);
                g.userData = { run: 0, lift: 0, steam, baseY: by };
                cups.push(g);
                regMagic(g, () => { g.userData.run = 2.6; });
            }
            makeCup(DT_X - 0.85, DT_Z + 0.20);
            makeCup(DT_X + 0.85, DT_Z + 0.20);
            makeCup(DT_X, DT_Z + 0.20);

            /* ---- 提梁茶壶 ---- */
            const POT_BX = DT_X + 0.42, POT_BZ = DT_Z + 0.02;
            const CUP_T = cups[2];
            const POT_RY = Math.atan2(CUP_T.position.x - POT_BX, CUP_T.position.z - POT_BZ);
            const POT_TILT = 0.65;
            const POT_TIP_FWD = 0.20 * Math.cos(POT_TILT) + 0.175 * Math.sin(POT_TILT);
            const teapotPos = new THREE.Group();
            teapotPos.position.set(POT_BX, DTOP, POT_BZ);
            teapotPos.rotation.y = POT_RY;
            scene.add(teapotPos);
            const teapot = new THREE.Group();
            teapotPos.add(teapot);
            let potHalo, potHaloMat;
            {
                const body = put(edge(new THREE.SphereGeometry(0.105, 14, 11)), 0, 0.10, 0, 0, 0, 0, teapot);
                body.scale.set(1, 0.82, 1);
                put(edge(new THREE.CylinderGeometry(0.07, 0.095, 0.03, 12)), 0, 0.015, 0, 0, 0, 0, teapot);
                put(edge(new THREE.CylinderGeometry(0.055, 0.068, 0.03, 12)), 0, 0.185, 0, 0, 0, 0, teapot);
                put(edge(new THREE.SphereGeometry(0.02, 8, 6)), 0, 0.21, 0, 0, 0, 0, teapot);
                const arcPts = [];
                for (let i = 0; i <= 10; i++) {
                    const a = (20 + i * 14) * D2R;
                    arcPts.push([Math.cos(a) * 0.115, 0.115 + Math.sin(a) * 0.115, 0]);
                }
                for (let i = 0; i < arcPts.length - 1; i++)
                    logBetween(arcPts[i], arcPts[i + 1], 0.011, teapot);
                logBetween([0, 0.07, 0.085], [0, 0.13, 0.145], 0.017, teapot);
                logBetween([0, 0.13, 0.145], [0, 0.175, 0.20], 0.013, teapot);
                potHaloMat = new THREE.MeshBasicMaterial({
                    color: 0xbfe3ff, transparent: true, opacity: 0.12, depthWrite: false
                });
                potHalo = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), potHaloMat);
                potHalo.userData.noHit = true;
                put(potHalo, 0, 0.10, 0, 0, 0, 0, teapot);
                potHalo.visible = false;
            }
            const potSpoutTip = new THREE.Object3D();
            potSpoutTip.position.set(0, 0.175, 0.20);
            teapot.add(potSpoutTip);
            const potStreamMat = new THREE.LineBasicMaterial({ color: 0x7db8dd });
            const potStreamGeom = new THREE.BufferGeometry();
            potStreamGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 3), 3));
            const potStream = new THREE.Line(potStreamGeom, potStreamMat);
            potStream.frustumCulled = false;
            potStream.visible = false;
            scene.add(potStream);
            const POT_T = 3.6;
            let potRun = 0;
            const _tv = new THREE.Vector3();
            regMagic(teapotPos, () => { potRun = POT_T; });

            /* ---- 桌面散放餐具 ---- */
            const tableItems = [];
            function regItem(g) {
                g.userData.run = 0;
                tableItems.push(g);
                regMagic(g, () => { g.userData.run = 1.4; });
            }
            function baseAt(g, x, z, ry) {
                g.position.set(x, DTOP, z);
                g.rotation.y = ry;
                g.userData.baseY = DTOP;
                g.userData.ry = ry;
            }
            function makeSpoon(x, z, ry) {
                const g = new THREE.Group();
                const handle = edge(new THREE.CylinderGeometry(0.006, 0.0095, 0.22, 6));
                handle.rotation.x = Math.PI / 2;
                put(handle, 0, 0.011, -0.018, 0, 0, 0, g);
                const bowlMesh = new THREE.Mesh(new THREE.SphereGeometry(0.033, 12, 8), FILL);
                bowlMesh.scale.set(0.7, 0.42, 1.2);
                put(bowlMesh, 0, 0.017, 0.082, 0, 0, 0, g);
                const eo = [], ei = [];
                for (let i = 0; i <= 16; i++) {
                    const a = i / 16 * Math.PI * 2;
                    eo.push([Math.cos(a) * 0.023, 0.027, 0.082 + Math.sin(a) * 0.040]);
                    ei.push([Math.cos(a) * 0.014, 0.029, 0.082 + Math.sin(a) * 0.026]);
                }
                lloop(eo, g);
                lloop(ei, g);
                baseAt(g, x, z, ry);
                scene.add(g);
                regItem(g);
            }
            makeSpoon(DT_X - 0.50, DT_Z + 0.06, 0.9);
            makeSpoon(DT_X + 0.58, DT_Z + 0.14, -0.8);
            function makeChopsticks(x, z, ry) {
                const g = new THREE.Group();
                logBetween([-0.008, 0.008, -0.115], [-0.008, 0.014, 0.115], 0.006, g);
                logBetween([0.008, 0.008, -0.115], [0.010, 0.014, 0.115], 0.006, g);
                baseAt(g, x, z, ry);
                scene.add(g);
                regItem(g);
            }
            makeChopsticks(DT_X - 1.02, DT_Z + 0.06, 2.0);
            makeChopsticks(DT_X + 1.02, DT_Z + 0.04, 1.1);
            function makeBowlStack(x, z) {
                const g = new THREE.Group();
                const BP = [[0.045, 0], [0.055, 0.018], [0.062, 0.03], [0.085, 0.042],
                [0.108, 0.068], [0.122, 0.096], [0.128, 0.112], [0.112, 0.112]];
                const lathePts = BP.map(p => new THREE.Vector2(p[0], p[1]));
                for (let i = 0; i < 3; i++) {
                    const b = new THREE.Group();
                    b.position.y = i * 0.062;
                    b.rotation.y = i * 0.4;
                    put(new THREE.Mesh(new THREE.LatheGeometry(lathePts, 18), FILL), 0, 0, 0, 0, 0, 0, b);
                    for (const [ry, rr] of [[0, 0.045], [0.068, 0.108], [0.112, 0.128], [0.112, 0.112]]) {
                        const pts = [];
                        for (let k = 0; k <= 18; k++) { const a = k / 18 * Math.PI * 2; pts.push([Math.cos(a) * rr, ry, Math.sin(a) * rr]); }
                        lloop(pts, b);
                    }
                    for (const ang of [0, 2.1, 4.2]) {
                        const c = Math.cos(ang), s = Math.sin(ang);
                        put(line(BP.map(([px, py]) => [c * px, py, s * px])), 0, 0, 0, 0, 0, 0, b);
                    }
                    g.add(b);
                }
                baseAt(g, x, z, 0.1);
                scene.add(g);
                regItem(g);
            }
            makeBowlStack(DT_X - 0.32, DT_Z - 0.28);

            const chairs = [];
            function makeChair(x, z, ry, ax, az) {
                const g = new THREE.Group();
                put(box(0.42, 0.05, 0.42), 0, 0.45, 0, 0, 0, 0, g);
                put(box(0.42, 0.52, 0.05), 0, 0.73, -0.185, 0, 0, 0, g);
                put(box(0.36, 0.04, 0.03), 0, 0.90, -0.185, 0, 0, 0, g);
                put(box(0.36, 0.04, 0.03), 0, 0.62, -0.185, 0, 0, 0, g);
                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
                    put(edge(new THREE.CylinderGeometry(0.022, 0.018, 0.44, 6)), sx * 0.17, 0.22, sz * 0.17, 0, 0, 0, g);
                g.position.set(x, 0, z);
                g.rotation.y = ry;
                g.userData = { bx: x, bz: z, ax, az, cur: 0, vel: 0, open: false };
                scene.add(g);
                chairs.push(g);
                regMagic(g, () => { g.userData.open = !g.userData.open; });
            }
            makeChair(DT_X - 0.85, DT_Z + 0.85, Math.PI, 0, 1);
            makeChair(DT_X, DT_Z + 0.85, Math.PI, 0, 1);
            makeChair(DT_X + 0.85, DT_Z + 0.85, Math.PI, 0, 1);
            makeChair(DT_X - 1.42, DT_Z, Math.PI / 2, -1, 0);
            makeChair(DT_X + 1.42, DT_Z, -Math.PI / 2, 1, 0);

            /* ---- 12.10 魔法扫帚 ---- */
            let broomHover = false, broomP = 0;
            const BROOM_REST = { x: -3.3, y: 0.105, z: 3.35, rz: 0.33 };
            const BROOM_FLY = { x: -2.7, y: 0.95, z: 2.65, rz: 0.05 };
            const broomG = new THREE.Group();
            broomG.position.set(BROOM_REST.x, BROOM_REST.y, BROOM_REST.z);
            broomG.rotation.z = BROOM_REST.rz;
            scene.add(broomG);
            {
                put(edge(new THREE.CylinderGeometry(0.022, 0.026, 1.45, 8)), 0, 0.865, 0, 0, 0, 0, broomG);
                put(edge(new THREE.SphereGeometry(0.026, 8, 6)), 0, 1.59, 0, 0, 0, 0, broomG);
                put(line([[-0.026, 1.25, 0], [0.026, 1.25, 0]]), 0, 0, 0, 0, 0, 0, broomG);
                put(line([[-0.026, 0.95, 0], [0.026, 0.95, 0]]), 0, 0, 0, 0, 0, 0, broomG);

                const SEGS = [
                    [0.140, 0.026],
                    [0.090, 0.048],
                    [0.045, 0.072],
                    [0.000, 0.092],
                    [-0.055, 0.104],
                    [-0.100, 0.112]
                ];
                const ringAt = (y, r, seg) => {
                    const pts = [];
                    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pts.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
                    put(line(pts), 0, 0, 0, 0, 0, 0, broomG);
                };
                for (const [yy, rr] of SEGS) ringAt(yy, rr, yy === 0.140 ? 10 : 14);
                for (let i = 0; i < 16; i++) {
                    const a = i / 16 * Math.PI * 2;
                    const pts = SEGS.map(([yy, rr]) => [Math.cos(a) * rr, yy, Math.sin(a) * rr]);
                    put(line(pts), 0, 0, 0, 0, 0, 0, broomG);
                }
                put(line([[-0.038, 0.09, 0], [0.050, 0.045, 0]]), 0, 0, 0, 0, 0, 0, broomG);
                put(line([[0.038, 0.09, 0], [-0.050, 0.045, 0]]), 0, 0, 0, 0, 0, 0, broomG);
                put(line([[0, 0.09, -0.038], [0, 0.045, 0.050]]), 0, 0, 0, 0, 0, 0, broomG);
                put(line([[0, 0.09, 0.038], [0, 0.045, -0.050]]), 0, 0, 0, 0, 0, 0, broomG);
            }
            const broomGlow = new THREE.Group();
            broomGlow.visible = false;
            {
                const gp = [], gp2 = [];
                for (let i = 0; i <= 30; i++) {
                    const a = i / 30 * Math.PI * 2;
                    gp.push([Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24]);
                    const r2 = 0.24 + Math.sin(a * 4) * 0.02;
                    gp2.push([Math.cos(a) * r2, 0.012, Math.sin(a) * r2]);
                }
                put(line(gp), 0, 0, 0, 0, 0, 0, broomGlow);
                put(line(gp2), 0, 0, 0, 0, 0, 0, broomGlow);
            }
            broomG.add(broomGlow);
            regMagic(broomG, () => { broomHover = !broomHover; });

            /* ---- 12.11 水晶球占卜台【门侧前右墙角】 ---- */
            const CBX = 3.05, CBZ = 3.25;
            const orbStandG = new THREE.Group();
            orbStandG.position.set(CBX, 0, CBZ);
            scene.add(orbStandG);
            for (let i = 0; i < 3; i++) {
                const a = i * Math.PI * 2 / 3 + 0.5;
                logBetween([Math.cos(a) * 0.15, 0.62, Math.sin(a) * 0.15],
                    [Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26], 0.028, orbStandG);
            }
            put(edge(new THREE.TorusGeometry(0.17, 0.02, 6, 20)), 0, 0.40, 0, Math.PI / 2, 0, 0, orbStandG);
            put(edge(new THREE.CylinderGeometry(0.13, 0.17, 0.06, 12)), 0, 0.62, 0, 0, 0, 0, orbStandG);
            {
                const cbGlassMat = new THREE.MeshBasicMaterial({ color: 0xdceef5, transparent: true, opacity: 0.20, depthWrite: false });
                const cbLineMat = new THREE.LineBasicMaterial({ color: 0x8ab8c8 });
                const cbSphere = new THREE.Group();
                cbSphere.add(new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), cbGlassMat));
                cbSphere.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(0.24, 12, 8)), cbLineMat));
                const hc = [];
                for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; hc.push([Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24]); }
                cbSphere.add(new THREE.LineLoop(geo(hc), cbLineMat));
                put(cbSphere, 0, 0.90, 0, 0, 0, 0, orbStandG);
            }
            const cbInner = new THREE.Group();
            cbInner.position.set(0, 0.90, 0);
            orbStandG.add(cbInner);
            const cbMistMat = new THREE.LineBasicMaterial({ color: 0x9b6fd8, transparent: true, opacity: 0.5 });
            const cbMists = [];
            for (let i = 0; i < 3; i++) {
                const pts = [];
                const r = 0.08 + i * 0.045;
                for (let k = 0; k <= 24; k++) {
                    const a = k / 24 * Math.PI * 2;
                    pts.push([Math.cos(a) * r, Math.sin(a * 2 + i) * 0.05, Math.sin(a) * r]);
                }
                const l = new THREE.Line(geo(pts), cbMistMat);
                cbInner.add(l);
                cbMists.push({ l, ph: i });
            }
            const cbStars = [];
            for (let i = 0; i < 5; i++) {
                const st = solid(new THREE.OctahedronGeometry(0.014),
                    new THREE.MeshBasicMaterial({ color: 0xcab4f0 }));
                st.position.set((i - 2) * 0.075, (i % 2 ? 0.07 : -0.05), (Math.random() - 0.5) * 0.1);
                cbInner.add(st);
                cbStars.push(st);
            }
            const cbGlowMat = new THREE.MeshBasicMaterial({ color: 0xb49bf0, transparent: true, opacity: 0, depthWrite: false });
            const cbGlow = new THREE.Mesh(new THREE.SphereGeometry(0.30, 12, 8), cbGlowMat);
            cbGlow.userData.noHit = true;
            put(cbGlow, 0, 0.90, 0, 0, 0, 0, orbStandG);
            const cbHit = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), HITMAT);
            put(cbHit, 0, 0.90, 0, 0, 0, 0, orbStandG);
            let cbRun = 0;
            regMagic(orbStandG, () => { cbRun = 5.0; });
            orbStandG.userData.sfx = 'magic';

            /* ---- 月光魔法盆栽【门侧前右墙角】 ---- */
            const PLX = 3.55, PLZ = 2.45;
            const plantG = new THREE.Group();
            plantG.position.set(PLX, 0, PLZ);
            scene.add(plantG);
            const potMat = LITMAT(0xa9744f);
            put(solid(new THREE.CylinderGeometry(0.14, 0.10, 0.20, 10), potMat), 0, 0.10, 0, 0, 0, 0, plantG);
            put(solid(new THREE.CylinderGeometry(0.155, 0.155, 0.03, 10), potMat), 0, 0.215, 0, 0, 0, 0, plantG);
            put(solid(new THREE.CylinderGeometry(0.125, 0.125, 0.02, 10),
                LITMAT(0x5a4632)), 0, 0.228, 0, 0, 0, 0, plantG);
            const plantStems = [], plantBerries = [];
            for (let i = 0; i < 5; i++) {
                const a = i * Math.PI * 2 / 5 + 0.4;
                const tipX = Math.cos(a) * 0.17, tipZ = Math.sin(a) * 0.17;
                const stem = new THREE.Group();
                stem.position.set(0, 0.23, 0);
                put(line([[0, 0, 0], [tipX * 0.35, 0.13, tipZ * 0.35], [tipX * 0.8, 0.25, tipZ * 0.8], [tipX, 0.35, tipZ]]), 0, 0, 0, 0, 0, 0, stem);
                const lp = [];
                for (let k = 0; k <= 12; k++) { const t = k / 12 * Math.PI * 2; lp.push([Math.cos(t) * 0.045, Math.sin(t) * 0.035, 0]); }
                put(new THREE.LineLoop(geo(lp), MAT), tipX * 0.45, 0.16, tipZ * 0.45, 0, a, 0, stem);
                const bm = new THREE.MeshBasicMaterial({
                    color: i % 2 ? 0x9b6fd8 : 0x4fb0d8, transparent: true, opacity: 0.85
                });
                const berry = solid(new THREE.SphereGeometry(0.026, 8, 6), bm);
                put(berry, tipX, 0.37, tipZ, 0, 0, 0, stem);
                plantG.add(stem);
                plantStems.push({ stem, ph: i * 1.3 });
                plantBerries.push({ obj: berry, m: bm, ph: i });
            }
            let plantRun = 0;
            regMagic(plantG, () => { plantRun = 4.0; });

            /* ---- 12.11b 滑轮置物台【魔法餐桌另一侧】：可滑动 + 墨水瓶羽毛笔 + 纸堆 ---- */
            const CART_P0 = { x: 2.85, z: 2.2 };   // 魔法餐桌右侧边
            const CART_DIR = { x: 0, z: -1 };      // 【调整】朝被炉方向（-z，向屋内）滑出，不再撞花盆
            const CART_DIST = 0.55;
            let cartOut = false, cartP = 0, cartPrevP = 0;
            const cartG = new THREE.Group();
            cartG.position.set(CART_P0.x, 0, CART_P0.z);
            cartG.rotation.y = Math.atan2(CART_DIR.x, CART_DIR.z);
            scene.add(cartG);

            const cartWheels = [];
            const cartBody = new THREE.Group();
            cartG.add(cartBody);
            {
                const woodMat = LITMAT(0x9c7a58, { side: THREE.DoubleSide });
                const darkMat = LITMAT(0x6b543f, { side: THREE.DoubleSide });
                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                    const wh = new THREE.Group();
                    wh.rotation.z = Math.PI / 2;
                    put(edge(new THREE.CylinderGeometry(0.034, 0.034, 0.024, 10)), 0, 0, 0, 0, 0, 0, wh);
                    put(edge(new THREE.CylinderGeometry(0.011, 0.011, 0.028, 6)), 0, 0, 0, 0, 0, 0, wh);
                    wh.position.set(sx * 0.15, 0.034, sz * 0.10);
                    cartG.add(wh);
                    cartWheels.push(wh);
                }
                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
                    put(edge(new THREE.CylinderGeometry(0.011, 0.011, 0.46, 6)),
                        sx * 0.155, 0.26, sz * 0.115, 0, 0, 0, cartBody);
                put(solid(new THREE.BoxGeometry(0.40, 0.024, 0.30), woodMat), 0, 0.185, 0, 0, 0, 0, cartBody);
                put(solid(new THREE.BoxGeometry(0.40, 0.024, 0.30), woodMat), 0, 0.47, 0, 0, 0, 0, cartBody);
                put(solid(new THREE.BoxGeometry(0.40, 0.05, 0.012), darkMat), 0, 0.21, -0.145, 0, 0, 0, cartBody);
                put(solid(new THREE.BoxGeometry(0.40, 0.05, 0.012), darkMat), 0, 0.495, -0.145, 0, 0, 0, cartBody);
                logBetween([-0.14, 0.48, 0.14], [-0.14, 0.78, 0.14], 0.011, cartBody);
                logBetween([0.14, 0.48, 0.14], [0.14, 0.78, 0.14], 0.011, cartBody);
                logBetween([-0.14, 0.78, 0.14], [0.14, 0.78, 0.14], 0.011, cartBody);
            }

            /* —— 墨水瓶（上层）—— */
            const inkG = new THREE.Group();
            inkG.position.set(-0.10, 0.482, 0.02);
            cartG.add(inkG);
            {
                const glassMat = new THREE.MeshBasicMaterial({ color: 0x2a3a6e, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
                const inkMat = LITMAT(0x1a2a5e);
                put(solid(new THREE.CylinderGeometry(0.036, 0.042, 0.075, 10), glassMat), 0, 0.0375, 0, 0, 0, 0, inkG);
                put(solid(new THREE.CylinderGeometry(0.02, 0.028, 0.024, 8), glassMat), 0, 0.086, 0, 0, 0, 0, inkG);
                put(solid(new THREE.CylinderGeometry(0.031, 0.031, 0.052, 10), inkMat), 0, 0.030, 0, 0, 0, 0, inkG);
            }

            /* —— 羽毛笔（插在墨水瓶里）—— */
            const quillG = new THREE.Group();
            cartG.add(quillG);
            const QUILL_REST = { pos: [-0.10, 0.505, 0.02], rotX: -0.15, rotZ: 0.30 };
            {
                const featherMat = LITMAT(0xf4f0e6, { side: THREE.DoubleSide });
                put(solid(new THREE.CylinderGeometry(0.0035, 0.0035, 0.15, 6),
                    LITMAT(0xd9c9a8)), 0, 0.085, 0, 0, 0, 0, quillG);
                put(solid(new THREE.ConeGeometry(0.0035, 0.03, 6),
                    LITMAT(0x4a3b28)), 0, 0.005, 0, 0, 0, Math.PI, quillG);
                const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), featherMat);
                f.scale.set(0.32, 1.5, 0.55);
                f.position.set(0.012, 0.155, 0);
                f.rotation.z = -0.18;
                quillG.add(f);
                put(line([[0, 0.09, 0], [0.006, 0.22, 0]]), 0, 0, 0, 0, 0, 0, quillG);
                for (let k = 0; k < 5; k++) {
                    const yy = 0.11 + k * 0.024;
                    put(line([[0.002, yy, 0], [0.028 - k * 0.002, yy + 0.014, 0]]), 0, 0, 0, 0, 0, 0, quillG);
                    put(line([[0.002, yy, 0], [-0.016 + k * 0.001, yy + 0.012, 0]]), 0, 0, 0, 0, 0, 0, quillG);
                }
            }
            quillG.position.set(QUILL_REST.pos[0], QUILL_REST.pos[1], QUILL_REST.pos[2]);
            quillG.rotation.set(QUILL_REST.rotX, 0, QUILL_REST.rotZ);

            /* —— 发光魔法符号（Sprite 池：花体/哥特数学字母 + 柔光，无描边）—— */
            const GLYPH_CHARS = ['𝔑', '𝔎', '𝓇', '𝔓', '𝒻', '𝓀', '𝔖', '𝓌'];
            const GLYPH_COLORS = ['#d84fd0', '#4f9bd8', '#d8a84f', '#e05555', '#4fd8b0', '#f0e04f', '#9b6fd8', '#e084f0'];
            const magicGlyphs = [];
            for (let i = 0; i < 8; i++) {
                const cv = document.createElement('canvas');
                cv.width = cv.height = 128;
                const cx = cv.getContext('2d');
                cx.font = 'bold 84px "STIX Two Math", "Cambria Math", serif';
                cx.textAlign = 'center';
                cx.textBaseline = 'middle';
                cx.shadowColor = GLYPH_COLORS[i];
                cx.shadowBlur = 12;
                cx.fillStyle = GLYPH_COLORS[i];
                cx.fillText(GLYPH_CHARS[i], 64, 68);
                cx.fillText(GLYPH_CHARS[i], 64, 68);
                const tex = new THREE.CanvasTexture(cv);
                const mat = new THREE.SpriteMaterial({
                    map: tex, transparent: true, opacity: 0, depthWrite: false
                });
                const sp = new THREE.Sprite(mat);
                sp.scale.setScalar(0.001);
                sp.visible = false;
                scene.add(sp);
                magicGlyphs.push({ sp, mat, active: false, age: 0, life: 2.4, base: new THREE.Vector3() });
            }

            /* 书写路径（世界坐标）：餐桌上方空中（右侧） */
            const QW_A = new THREE.Vector3(2.75, 1.30, 1.75);
            const QW_B = new THREE.Vector3(1.65, 1.55, 1.05);
            for (let i = 0; i < 8; i++) {
                magicGlyphs[i].base.lerpVectors(QW_A, QW_B, (i + 0.5) / 8);
                magicGlyphs[i].base.y += Math.sin(i * 2.2) * 0.05;
            }

            let quillRun = 0;
            const QUILL_T = 7.0;
            function startQuill() {
                if (quillRun <= 0.4) {
                    quillRun = QUILL_T;
                    for (const g of magicGlyphs) { g.active = false; g.sp.visible = false; g.mat.opacity = 0; }
                }
            }

            /* —— 纸堆（下层）—— */
            const paperG = new THREE.Group();
            cartG.add(paperG);
            const papers = [];
            for (let i = 0; i < 8; i++) {
                const pg = new THREE.Group();
                put(solid(new THREE.BoxGeometry(0.13, 0.0022, 0.18), FILL), 0, 0, 0, 0, 0, 0, pg);
                for (const ly of [-0.03, 0, 0.03])
                    put(line([[-0.045, 0.0025, ly], [0.045, 0.0025, ly]]), 0, 0, 0, 0, 0, 0, pg);
                const ry0 = (Math.random() - 0.5) * 0.3;
                pg.position.set(0.08 + (i % 3) * 0.003, 0.198 + i * 0.0028, -0.02 + (Math.random() - 0.5) * 0.012);
                pg.rotation.y = ry0;
                paperG.add(pg);
                papers.push({ g: pg, home: pg.position.clone(), ry0, a0: 1.0 + i * 0.8, r: 2.1 + (i % 3) * 0.28 });
            }
            let paperRun = 0;
            const PAPER_T = 8.5;
            const _cw = new THREE.Vector3();

            regMagic(cartBody, () => { cartOut = !cartOut; });
            regMagic(inkG, () => { startQuill(); });
            regMagic(quillG, () => { startQuill(); });
            regMagic(paperG, () => { if (paperRun <= 0) paperRun = PAPER_T; });

            /* ---- 12.12 塔罗牌牌堆 ---- */
            const tarotG = new THREE.Group();
            tarotG.position.set(-0.75, 0, -2.8);
            scene.add(tarotG);
            {
                for (let i = 0; i < 3; i++) {
                    const a = i * Math.PI * 2 / 3 + 0.9;
                    logBetween([Math.cos(a) * 0.10, 0.44, Math.sin(a) * 0.10],
                        [Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17], 0.024, tarotG);
                }
                put(edge(new THREE.CylinderGeometry(0.24, 0.20, 0.035, 14)), 0, 0.46, 0, 0, 0, 0, tarotG);
            }
            const tarotCards = [];
            let tarotState = 'stacked', tarotT = 0;
            const TAROT_N = 9;
            function enterJournalLevel() {
                if (typeof window.prepareJournalReturn === 'function') {
                    window.prepareJournalReturn();
                }
                window.APP_SHELL_BLOCK_GAME = false;
                window.APP_GAME_MODAL_OPEN = false;
                window.location.href = 'jourmal.html';
            }
            function makeJournalCardFace() {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 384;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fbf7df';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#b9c7ad';
                ctx.lineWidth = 10;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(26, 38, 204, 118, 56);
                } else {
                    ctx.rect(26, 38, 204, 118);
                }
                ctx.stroke();
                ctx.fillStyle = '#526a48';
                ctx.font = 'bold 34px "Songti SC", "STSong", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('进入遗迹', 128, 82);
                ctx.fillText('穿越', 128, 120);
                ctx.strokeStyle = '#d8d4b5';
                ctx.lineWidth = 3;
                for (let y = 200; y < 360; y += 32) {
                    ctx.beginPath();
                    ctx.moveTo(28, y);
                    ctx.lineTo(228, y);
                    ctx.stroke();
                }
                const texture = new THREE.CanvasTexture(canvas);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const face = new THREE.Mesh(new THREE.PlaneGeometry(0.138, 0.204), material);
                face.position.y = 0.008;
                face.rotation.x = -Math.PI / 2;
                return face;
            }
            for (let i = 0; i < TAROT_N; i++) {
                const c = new THREE.Group();
                put(box(0.15, 0.005, 0.23), 0, 0, 0, 0, 0, 0, c);
                put(edge(new THREE.TorusGeometry(0.034, 0.004, 4, 18)), 0, 0.004, 0, Math.PI / 2, 0, 0, c);
                put(edge(new THREE.OctahedronGeometry(0.011)), 0, 0.0055, 0, 0, 0, 0, c);
                for (const s of [-1, 1])
                    put(line([[s * 0.052, 0.004, -0.075], [s * 0.052, 0.004, 0.075]]), 0, 0, 0, 0, 0, 0, c);
                put(line([[-0.055, 0.004, -0.095], [0.055, 0.004, -0.095]]), 0, 0, 0, 0, 0, 0, c);
                put(line([[-0.055, 0.004, 0.095], [0.055, 0.004, 0.095]]), 0, 0, 0, 0, 0, 0, c);
                const sy = 0.482 + i * 0.0065;
                const sry = (i % 2 ? 1 : -1) * (0.08 + i * 0.045);
                c.userData = {
                    sx: (Math.random() - 0.5) * 0.01, sy, sz: (Math.random() - 0.5) * 0.01, sry,
                    fa: i * (Math.PI * 2 * 1.05 / TAROT_N),
                    fr: 0.15 + i * 0.022,
                    fy: 1.05 + i * 0.14,
                    px: 0, py: 0, pz: 0, prx: 0, pry: 0, prz: 0
                };
                c.position.set(c.userData.sx, sy, c.userData.sz);
                c.rotation.y = sry;
                tarotG.add(c);
                tarotCards.push(c);
            }
            const journalCard = tarotCards[tarotCards.length - 1];
            journalCard.add(makeJournalCardFace());
            journalCard.userData.aimLabel = '进入遗迹穿越';
            function tarotPose(u, i, t) {
                return {
                    x: Math.cos(u.fa) * u.fr,
                    y: u.fy + Math.sin(t * 1.6 + i * 0.9) * 0.03,
                    z: Math.sin(u.fa) * u.fr,
                    ry: u.fa + Math.PI / 2 + Math.sin(t * 0.8 + i * 0.7) * 0.25,
                    rx: -0.30 + Math.sin(t * 0.6 + i) * 0.08,
                    rz: Math.sin(t * 0.7 + i * 1.3) * 0.10
                };
            }
            regMagic(tarotG, () => {
                if (tarotState === 'stacked') { tarotState = 'flying'; tarotT = 0; }
                else if (tarotState === 'floating') {
                    for (const c of tarotCards) {
                        const u = c.userData;
                        u.px = c.position.x; u.py = c.position.y; u.pz = c.position.z;
                        u.prx = c.rotation.x; u.pry = c.rotation.y; u.prz = c.rotation.z;
                    }
                    tarotState = 'returning'; tarotT = 0;
                }
            });
            regMagic(journalCard, enterJournalLevel);

            /* ---- 12.13 暖桌（八角桌板 + 等腰梯形垂帘 + 四角倒三角填补）+ 收音机 + 果盆橘子 + 方坐垫 ---- */
            let kotatsuOn = true;
            let kotGlowMat = null;
            let radioNoteRun = 0;
            const KOT_X = 2.55, KOT_Z = -0.5, KTOP = 0.4475;
            const kotatsuG = new THREE.Group();
            kotatsuG.position.set(KOT_X, 0, KOT_Z);
            kotatsuG.rotation.y = 0.22;
            scene.add(kotatsuG);

            const kotBody = new THREE.Group();
            kotatsuG.add(kotBody);
            {
                const tilt = 0.16;
                const C = 0.595;
                const topY = 0.405;
                const Lc = 0.38;
                const bz = C + Lc * Math.sin(tilt);
                const wt = 0.87;
                const wb = 2 * bz;

                const topShape = new THREE.Shape();
                topShape.moveTo(-C, -(C - 0.165));
                topShape.lineTo(-(C - 0.165), -C);
                topShape.lineTo((C - 0.165), -C);
                topShape.lineTo(C, -(C - 0.165));
                topShape.lineTo(C, (C - 0.165));
                topShape.lineTo((C - 0.165), C);
                topShape.lineTo(-(C - 0.165), C);
                topShape.lineTo(-C, (C - 0.165));
                topShape.closePath();
                const topGeo = new THREE.ExtrudeGeometry(topShape, { depth: 0.055, bevelEnabled: false });
                topGeo.rotateX(-Math.PI / 2);
                put(edge(topGeo), 0, KTOP - 0.055, 0, 0, 0, 0, kotBody);

                for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
                    put(box(0.07, 0.40, 0.07), sx * 0.42, 0.20, sz * 0.42, 0, 0, 0, kotBody);

                const quiltMat = LITMAT(0xc4a484, { side: THREE.DoubleSide });
                const trapShape = new THREE.Shape();
                trapShape.moveTo(-wt / 2, 0);
                trapShape.lineTo(wt / 2, 0);
                trapShape.lineTo(wb / 2, -Lc);
                trapShape.lineTo(-wb / 2, -Lc);
                trapShape.closePath();
                const trapGeo = new THREE.ExtrudeGeometry(trapShape, { depth: 0.03, bevelEnabled: false });
                function makeCurtain() {
                    const g = solid(trapGeo, quiltMat);
                    for (const s of [-0.22, 0.22])
                        put(line([[s, -0.035, 0.034], [s, -Lc + 0.05, 0.034]]), 0, 0, 0, 0, 0, 0, g);
                    const hem = [];
                    for (let i = 0; i <= 24; i++) {
                        const t2 = i / 24;
                        hem.push([-wb / 2 + t2 * wb, -Lc + Math.sin(t2 * Math.PI * 5) * 0.012, 0.034]);
                    }
                    put(line(hem), 0, 0, 0, 0, 0, 0, g);
                    return g;
                }
                for (const ry of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
                    const w = new THREE.Group();
                    w.rotation.y = ry;
                    kotBody.add(w);
                    put(makeCurtain(), 0, topY, C, -tilt, 0, 0, w);
                }

                const yBot = topY - Lc * Math.cos(tilt);
                for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                    const P1 = [sx * (wt / 2), topY, sz * C];
                    const P2 = [sx * C, topY, sz * (wt / 2)];
                    const P3 = [sx * bz, yBot, sz * bz];
                    const triGeo = new THREE.BufferGeometry();
                    triGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                        P1[0], P1[1], P1[2],
                        P2[0], P2[1], P2[2],
                        P3[0], P3[1], P3[2]
                    ]), 3));
                    triGeo.computeVertexNormals();
                    kotBody.add(solid(triGeo, quiltMat));
                }

                kotGlowMat = new THREE.MeshBasicMaterial({
                    color: 0xffab5e, transparent: true, opacity: 0.10, depthWrite: false, side: THREE.DoubleSide
                });
                const kotGlow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 24), kotGlowMat);
                kotGlow.userData.noHit = true;
                put(kotGlow, 0, 0.015, 0, -Math.PI / 2, 0, 0, kotBody);
            }
            regMagic(kotBody, () => { kotatsuOn = !kotatsuOn; });

            /* —— 收音机（点击播放音符）—— */
            const radioG = new THREE.Group();
            radioG.position.set(-0.34, KTOP, 0.30);
            radioG.rotation.y = -0.45;
            kotatsuG.add(radioG);
            {
                const woodMat = LITMAT(0x8f6b4e, { side: THREE.DoubleSide });
                put(solid(new THREE.BoxGeometry(0.20, 0.115, 0.10), woodMat), 0, 0.0575, 0, 0, 0, 0, radioG);
                for (let i = 0; i < 4; i++)
                    put(line([[-0.075, 0.032 + i * 0.018, 0.052], [-0.005, 0.032 + i * 0.018, 0.052]]), 0, 0, 0, 0, 0, 0, radioG);
                put(line([[-0.078, 0.026, 0.052], [-0.078, 0.092, 0.052]]), 0, 0, 0, 0, 0, 0, radioG);
                put(line([[-0.002, 0.026, 0.052], [-0.002, 0.092, 0.052]]), 0, 0, 0, 0, 0, 0, radioG);
                put(edge(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 8)),
                    0.035, 0.080, 0.052, Math.PI / 2, 0, 0, radioG);
                put(edge(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 8)),
                    0.070, 0.080, 0.052, Math.PI / 2, 0, 0, radioG);
                logBetween([0.085, 0.11, 0], [0.150, 0.235, -0.01], 0.005, radioG);
                const noteSrc = new THREE.Object3D();
                noteSrc.position.set(0.150, 0.245, -0.01);
                radioG.add(noteSrc);
                radioG.userData.noteSrc = noteSrc;
            }
            const noteMat = new THREE.LineBasicMaterial({ color: 0x6b4ea8, transparent: true, opacity: 0 });
            const radioNotes = [];
            for (let i = 0; i < 4; i++) {
                const g = new THREE.Group();
                const head = [];
                for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI * 2; head.push([Math.cos(a) * 0.013, Math.sin(a) * 0.009, 0]); }
                g.add(new THREE.LineLoop(geo(head), noteMat));
                g.add(new THREE.Line(geo([[0.011, 0.007, 0], [0.011, 0.052, 0]]), noteMat));
                g.add(new THREE.Line(geo([[0.011, 0.052, 0], [0.024, 0.044, 0]]), noteMat));
                g.visible = false;
                scene.add(g);
                radioNotes.push({ g, ph: i / 4 });
            }
            regMagic(radioG, () => { radioNoteRun = 3.2; });

            /* —— 果盆 + 橘子 6 颗 —— */
            const FB_X = -0.24, FB_Z = 0.10;
            {
                const BP = [[0.055, 0], [0.07, 0.018], [0.10, 0.038], [0.14, 0.058], [0.165, 0.078], [0.155, 0.082]];
                put(new THREE.Mesh(new THREE.LatheGeometry(BP.map(p => new THREE.Vector2(p[0], p[1])), 18), FILL),
                    FB_X, KTOP, FB_Z, 0, 0, 0, kotatsuG);
                for (const [ry, rr] of [[0.038, 0.10], [0.078, 0.165], [0.082, 0.155]]) {
                    const pts = [];
                    for (let k = 0; k <= 18; k++) { const a = k / 18 * Math.PI * 2; pts.push([FB_X + Math.cos(a) * rr, KTOP + ry, FB_Z + Math.sin(a) * rr]); }
                    lloop(pts, kotatsuG);
                }
                for (const ang of [0, 2.1, 4.2]) {
                    const c = Math.cos(ang), s = Math.sin(ang);
                    put(line(BP.map(([px, py]) => [FB_X + c * px, KTOP + py, FB_Z + s * px])), 0, 0, 0, 0, 0, 0, kotatsuG);
                }
            }
            const oranges = [];
            let orangeState = 'inbowl', orangeT = 0;
            const OR = 0.033;
            {
                const orangeG = new THREE.Group();
                orangeG.position.set(FB_X, KTOP, FB_Z);
                kotatsuG.add(orangeG);
                const oMat = LITMAT(0xe8963c);
                const oMat2 = LITMAT(0xf0a44f);
                const RA = 0.075;
                const homes = [
                    [RA, 0.000, 0.050],
                    [RA * Math.cos(1.2566), RA * Math.sin(1.2566), 0.050],
                    [RA * Math.cos(2.5133), RA * Math.sin(2.5133), 0.050],
                    [RA * Math.cos(3.7699), RA * Math.sin(3.7699), 0.050],
                    [RA * Math.cos(5.0265), RA * Math.sin(5.0265), 0.050],
                    [0.000, 0.000, 0.102]
                ];
                const rolls = [
                    [0.42, -0.36],
                    [0.42, -0.12],
                    [0.42, 0.12],
                    [0.42, 0.36],
                    [0.55, -0.24],
                    [0.55, 0.02]
                ];
                for (let i = 0; i < 6; i++) {
                    const mesh = solid(new THREE.SphereGeometry(OR, 10, 8), i % 2 ? oMat2 : oMat);
                    const hx = homes[i][0], hy = homes[i][2], hz = homes[i][1];
                    const tx = rolls[i][0], tz = rolls[i][1];
                    mesh.position.set(hx, hy, hz);
                    orangeG.add(mesh);
                    const dx = tx - hx, dz = tz - hz;
                    oranges.push({ mesh, hx, hy, hz, tx, ty: OR, tz, ax: dz / OR, az: -dx / OR });
                }
                const stem = solid(new THREE.CylinderGeometry(0.004, 0.004, 0.016, 5),
                    LITMAT(0x7a5230));
                put(stem, 0, 0.038, 0, 0, 0, 0, oranges[5].mesh);
                regMagic(orangeG, () => {
                    if (orangeState === 'inbowl') { orangeState = 'out'; orangeT = 0; }
                    else if (orangeState === 'rolled') { orangeState = 'back'; orangeT = 0; }
                });
            }

            /* —— 茶杯 ×2 —— */
            makeCup(-0.34, -0.34, KTOP, kotatsuG);
            makeCup(-0.14, -0.44, KTOP, kotatsuG);

            /* —— 方坐垫 ×2 —— */
            const cushions = [];
            function makeCushion(x, z, ry, col, colBottom) {
                const g = new THREE.Group();
                const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
                const m2 = new THREE.MeshBasicMaterial({ color: colBottom, side: THREE.DoubleSide });
                put(solid(new THREE.BoxGeometry(0.44, 0.085, 0.44), m), 0, 0.048, 0, 0, 0, 0, g);
                put(solid(new THREE.BoxGeometry(0.36, 0.032, 0.36), m), 0, 0.098, 0, 0, 0, 0, g);
                put(solid(new THREE.BoxGeometry(0.44, 0.014, 0.44), m2), 0, 0.008, 0, 0, 0, 0, g);
                put(edge(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 8)), 0, 0.118, 0, 0, 0, 0, g);
                for (let k = 0; k < 4; k++) {
                    const a = k / 4 * Math.PI * 2 + Math.PI / 4;
                    put(line([[Math.cos(a) * 0.04, 0.115, Math.sin(a) * 0.04],
                    [Math.cos(a) * 0.15, 0.102, Math.sin(a) * 0.15]]), 0, 0, 0, 0, 0, 0, g);
                }
                g.position.set(x, 0, z);
                g.rotation.y = ry;
                kotatsuG.add(g);
                const c = { g, anim: 0, p: 0, from: 0, to: 0 };
                cushions.push(c);
                regMagic(g, () => {
                    if (c.anim === 0) {
                        c.from = c.to;
                        c.to = c.to > Math.PI / 2 ? 0 : Math.PI;
                        c.anim = 1; c.p = 0;
                    }
                });
            }
            makeCushion(0.00, 0.98, 0.12, 0xd98a94, 0xb96a75);
            makeCushion(-0.98, 0.02, 1.62, 0x8fae6e, 0x74915a);

            /* ---- 门铃【墙外侧，与门中间齐平高度】 ---- */
            const doorbellG = new THREE.Group();
            doorbellG.position.set(1.25, 1.05, 4.17);
            scene.add(doorbellG);
            const btnG = new THREE.Group();
            {
                put(box(0.15, 0.20, 0.035), 0, 0, 0, 0, 0, 0, doorbellG);
                put(edge(new THREE.TorusGeometry(0.045, 0.008, 6, 18)), 0, 0.025, 0.040, 0, 0, 0, btnG);
                put(edge(new THREE.CylinderGeometry(0.042, 0.042, 0.028, 16)), 0, 0.025, 0.022, Math.PI / 2, 0, 0, btnG);
                put(solid(new THREE.CylinderGeometry(0.024, 0.024, 0.030, 12),
                    LITMAT(0xd98a94)), 0, 0.025, 0.024, Math.PI / 2, 0, 0, btnG);
                doorbellG.add(btnG);
                put(line([[-0.045, -0.050, 0.020], [0.045, -0.050, 0.020]]), 0, 0, 0, 0, 0, 0, doorbellG);
                put(line([[-0.045, -0.065, 0.020], [0.045, -0.065, 0.020]]), 0, 0, 0, 0, 0, 0, doorbellG);
            }
            let bellRun = 0, bellRipple = 0;
            const bellRipples = [];
            for (let i = 0; i < 3; i++) {
                const rm = new THREE.LineBasicMaterial({ color: 0x8a7d5a, transparent: true, opacity: 0 });
                const rp = [];
                for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 2; rp.push([Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05]); }
                const l = new THREE.LineLoop(geo(rp), rm);
                l.rotation.x = Math.PI / 2;
                l.position.set(1.25, 1.075, 4.22);
                l.frustumCulled = false;
                scene.add(l);
                bellRipples.push({ l, m: rm, ph: i / 3 });
            }
            regMagic(doorbellG, () => { bellRun = 1.4; bellRipple = 1.1; });
            doorbellG.userData.sfx = 'doorbell';

            /* ---- 门口上方挂杆 ---- */
            const hangBar = new THREE.Group();
            hangBar.position.set(0, 2.66, 3.86);
            scene.add(hangBar);
            put(box(0.95, 0.035, 0.05), 0, 0, 0, 0, 0, 0, hangBar);
            for (const ex of [-0.45, 0.45])
                put(line([[ex, 0, 0.05], [ex * 1.08, 0.10, 0.10]]), 0, 0, 0, 0, 0, 0, hangBar);

            /* —— 晴天娃娃【无眉毛：眼睛 + 大微笑 + 腮红，五官贴球面外】—— */
            const CLOTH = LITMAT(0xfdfcf8, { side: THREE.DoubleSide });
            const sunPivot = new THREE.Group();
            sunPivot.position.set(-0.27, -0.017, 0);
            sunPivot.rotation.y = Math.PI;   /* 转向室内（-z），默认相机可见正脸 */
            hangBar.add(sunPivot);
            {
                /* 头球参数：中心 (0,-0.098,0)，半径 0.058 */
                const HC_Y = -0.098, HC_R = 0.058;
                const fz = (x, y) => Math.sqrt(Math.max(HC_R * HC_R - x * x - (y - HC_Y) * (y - HC_Y), 1e-4)) + 0.004;

                put(line([[0, 0, 0], [0, -0.045, 0]]), 0, 0, 0, 0, 0, 0, sunPivot);
                put(new THREE.Mesh(new THREE.SphereGeometry(HC_R, 14, 10), CLOTH), 0, HC_Y, 0, 0, 0, 0, sunPivot);
                put(new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.088, 0.24, 12), CLOTH), 0, -0.243, 0, 0, 0, 0, sunPivot);
                const zb = [];
                for (let i = 0; i <= 18; i++) {
                    const a = i / 18 * Math.PI * 2;
                    zb.push([Math.cos(a) * 0.088, -0.363 + Math.sin(a * 3) * 0.014, Math.sin(a) * 0.088]);
                }
                put(new THREE.LineLoop(geo(zb), MAT), 0, 0, 0, 0, 0, 0, sunPivot);
                put(line([[-0.028, -0.135, -0.045], [-0.048, -0.33, -0.062]]), 0, 0, 0, 0, 0, 0, sunPivot);
                put(line([[0.028, -0.135, -0.045], [0.048, -0.33, -0.062]]), 0, 0, 0, 0, 0, 0, sunPivot);
                /* 眼睛（球面外凸，无眉毛） */
                put(new THREE.Mesh(new THREE.SphereGeometry(0.0065, 6, 5), DARK), -0.020, -0.094, fz(-0.020, -0.094), 0, 0, 0, sunPivot);
                put(new THREE.Mesh(new THREE.SphereGeometry(0.0065, 6, 5), DARK), 0.020, -0.094, fz(0.020, -0.094), 0, 0, 0, sunPivot);
                /* 大微笑（五点弧线，贴球面） */
                put(line([
                    [-0.024, -0.112, fz(-0.024, -0.112)],
                    [-0.012, -0.120, fz(-0.012, -0.120)],
                    [0.000, -0.124, fz(0.000, -0.124)],
                    [0.012, -0.120, fz(0.012, -0.120)],
                    [0.024, -0.112, fz(0.024, -0.112)]
                ]), 0, 0, 0, 0, 0, 0, sunPivot);
                /* 腮红（球面外） */
                put(new THREE.Mesh(new THREE.SphereGeometry(0.010, 6, 5),
                    new THREE.MeshBasicMaterial({ color: 0xf2b0b6, transparent: true, opacity: 0.55 })),
                    -0.034, -0.108, fz(-0.034, -0.108), 0, 0, 0, sunPivot);
                put(new THREE.Mesh(new THREE.SphereGeometry(0.010, 6, 5),
                    new THREE.MeshBasicMaterial({ color: 0xf2b0b6, transparent: true, opacity: 0.55 })),
                    0.034, -0.108, fz(0.034, -0.108), 0, 0, 0, sunPivot);
            }
            sunPivot.userData = { energy: 0, ph: 0 };

            /* —— 玻璃风铃 —— */
            const glassMat = new THREE.MeshBasicMaterial({
                color: 0x9fdce8, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide
            });
            const glassLineMat = new THREE.LineBasicMaterial({ color: 0x4f9bb0 });
            const glass = g => {
                const grp = new THREE.Group();
                grp.add(new THREE.Mesh(g, glassMat));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), glassLineMat));
                return grp;
            };
            const chimePivot = new THREE.Group();
            chimePivot.position.set(0.27, -0.017, 0);
            hangBar.add(chimePivot);
            {
                put(line([[0, 0, 0], [0, -0.05, 0]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(edge(new THREE.TorusGeometry(0.026, 0.005, 6, 14)), 0, -0.056, 0, 0, 0, 0, chimePivot);
                const prof = [];
                for (let i = 0; i <= 6; i++) {
                    const a = i / 6 * Math.PI / 2;
                    prof.push(new THREE.Vector2(Math.sin(a) * 0.055, -0.062 - Math.cos(a) * 0.055));
                }
                prof.push(new THREE.Vector2(0.075, -0.140));
                prof.push(new THREE.Vector2(0.078, -0.148));
                const dome = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), glassMat);
                put(dome, 0, 0, 0, 0, 0, 0, chimePivot);
                const rimPts = [];
                for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; rimPts.push([Math.cos(a) * 0.078, -0.148, Math.sin(a) * 0.078]); }
                put(new THREE.LineLoop(geo(rimPts), glassLineMat), 0, 0, 0, 0, 0, 0, chimePivot);
                const midPts = [];
                for (let i = 0; i <= 18; i++) { const a = i / 18 * Math.PI * 2; midPts.push([Math.cos(a) * 0.055, -0.062, Math.sin(a) * 0.055]); }
                put(new THREE.LineLoop(geo(midPts), glassLineMat), 0, 0, 0, 0, 0, 0, chimePivot);
                put(line([[0, -0.062, 0], [0, -0.165, 0]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), DARK), 0, -0.170, 0, 0, 0, 0, chimePivot);
                put(line([[0, -0.178, 0], [0, -0.19, 0.002]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(edge(new THREE.BoxGeometry(0.038, 0.26, 0.005)), 0, -0.32, 0, 0, 0.12, 0, chimePivot);
                put(line([[-0.018, -0.275, 0.004], [0.018, -0.30, 0.004]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(line([[-0.018, -0.335, 0.004], [0.018, -0.36, 0.004]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(line([[0, -0.45, 0], [0.022, -0.50, 0.01]]), 0, 0, 0, 0, 0, 0, chimePivot);
                put(line([[0, -0.45, 0], [-0.022, -0.50, 0.01]]), 0, 0, 0, 0, 0, 0, chimePivot);
            }
            chimePivot.userData = { energy: 0, ph: 2 };
            regMagic(sunPivot, () => { sunPivot.userData.energy = 1; });
            regMagic(chimePivot, () => { chimePivot.userData.energy = 1; });

            /* ============ 楼梯下储物箱（点击开盖，内藏彩色矿石） ============ */
            let storageOpen = false, storageP = 0, storageV = 0;
            const storageChest = new THREE.Group();
            storageChest.position.set(0, 0, -0.78);
            storageChest.rotation.y = Math.PI;
            scene.add(storageChest);
            const storageLid = new THREE.Group();
            const oreMeshes = [];
            {
                const woodMat = LITMAT(0x8a6a4a, { side: THREE.DoubleSide });
                const darkMat = LITMAT(0x6b4e35, { side: THREE.DoubleSide });
                const W = 0.78, D = 0.52, H = 0.40, T = 0.03;
                put(solid(new THREE.BoxGeometry(W, T, D), woodMat), 0, T / 2, 0, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(W, H, T), woodMat), 0, T + H / 2, D / 2 - T / 2, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(W, H, T), woodMat), 0, T + H / 2, -D / 2 + T / 2, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(T, H, D - 2 * T), woodMat), W / 2 - T / 2, T + H / 2, 0, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(T, H, D - 2 * T), woodMat), -W / 2 + T / 2, T + H / 2, 0, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(W + 0.04, 0.05, 0.05), darkMat), 0, H + 0.015, D / 2, 0, 0, 0, storageChest);
                put(solid(new THREE.BoxGeometry(W + 0.04, 0.05, 0.05), darkMat), 0, H + 0.015, -D / 2, 0, 0, 0, storageChest);
                put(line([[-0.09, H - 0.06, D / 2 + 0.012], [0.09, H - 0.06, D / 2 + 0.012]]), 0, 0, 0, 0, 0, 0, storageChest);
                storageLid.position.set(0, H + 0.03, -D / 2);
                put(solid(new THREE.BoxGeometry(W + 0.04, 0.06, D + 0.04), darkMat), 0, 0.03, D / 2, 0, 0, 0, storageLid);
                put(line([[-W / 2 - 0.02, 0.06, D / 2], [-W / 2 + 0.06, 0.06, D / 2]]), 0, 0, 0, 0, 0, 0, storageLid);
                put(line([[W / 2 - 0.06, 0.06, D / 2], [W / 2 + 0.02, 0.06, D / 2]]), 0, 0, 0, 0, 0, 0, storageLid);
                storageChest.add(storageLid);
                const ORES = [
                    [0x9b4fd8, 'oct'], [0x2fbf6f, 'ico'], [0xd84444, 'oct'],
                    [0x3f7fd8, 'dod'], [0xe8b93a, 'oct'], [0x3fc8d8, 'ico'],
                    [0xe07bb8, 'dod'], [0xd89a3a, 'oct']
                ];
                const oreEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
                ORES.forEach((o, i) => {
                    const g = o[1] === 'oct' ? new THREE.OctahedronGeometry(0.052)
                        : o[1] === 'ico' ? new THREE.IcosahedronGeometry(0.050, 0)
                            : new THREE.DodecahedronGeometry(0.048);
                    const m = solid(g, new THREE.MeshBasicMaterial({ color: o[0] }), oreEdgeMat);
                    const col = i % 4, row = Math.floor(i / 4);
                    m.position.set(-0.27 + col * 0.18, 0.10 + row * 0.045, 0.10 - row * 0.21);
                    m.rotation.y = i * 0.7;
                    m.visible = false;
                    storageChest.add(m);
                    oreMeshes.push({ g: m, by: m.position.y });
                });
            }
            regMagic(storageChest, () => { storageOpen = !storageOpen; });
