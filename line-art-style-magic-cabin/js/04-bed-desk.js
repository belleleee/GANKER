'use strict';
            /* ========================================================== */
            /* ============ 二楼陈设（床·书桌·魔杖·星象仪·挂画等） ============ */
            /* ========================================================== */
            const FY = FLOOR_TOP;
            const BEDX = -2.4, BEDZ = -2.55;

            /* ---- 18.1 大床 ---- */
            for (const sxsz of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                put(edge(new THREE.CylinderGeometry(0.045, 0.035, 0.32, 8)), BEDX + sxsz[0] * 0.56, FY + 0.16, BEDZ + sxsz[1] * 1.02, 0, 0, 0);
            }
            put(box(1.32, 0.22, 2.24), BEDX, FY + 0.42, BEDZ);
            put(rbox(1.36, 0.80, 0.10, 0.06), BEDX, FY + 0.78, BEDZ - 1.14);
            put(rbox(1.32, 0.32, 2.24, 0.10), BEDX, FY + 0.69, BEDZ);
            let pillowOpen = false, pillowT = 0;
            const pillowG = new THREE.Group();
            pillowG.position.set(BEDX, FY + 0.94, BEDZ - 0.76);
            scene.add(pillowG);
            pillowG.add(rbox(0.66, 0.22, 0.44, 0.08));
            regMagic(pillowG, () => { pillowOpen = !pillowOpen; });
            {
                const bl = rbox(1.24, 0.20, 1.46, 0.08);
                bl.position.set(BEDX, FY + 0.85, BEDZ + 0.40);
                scene.add(bl);
                for (const bx of [-0.18, 0.18]) {
                    put(iline([[BEDX + bx, FY + 0.955, BEDZ - 0.28], [BEDX + bx, FY + 0.955, BEDZ + 1.08]]), 0, 0, 0);
                }
            }

            /* ---- 18.2 床头柜 + 可拉开抽屉 ---- */
            const NSX = -1.15, NSZ = -3.3;
            for (const sxsz of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                put(edge(new THREE.CylinderGeometry(0.022, 0.018, 0.16, 6)), NSX + sxsz[0] * 0.19, FY + 0.08, NSZ + sxsz[1] * 0.16, 0, 0, 0);
            }
            put(box(0.50, 0.40, 0.42), NSX, FY + 0.36, NSZ);
            put(box(0.56, 0.04, 0.48), NSX, FY + 0.58, NSZ);
            const drawerG = new THREE.Group();
            drawerG.position.set(NSX, FY + 0.40, NSZ + 0.20);
            scene.add(drawerG);
            put(box(0.42, 0.14, 0.05), 0, 0, 0, 0, 0, 0, drawerG);
            put(edge(new THREE.CylinderGeometry(0.017, 0.017, 0.028, 8)), 0, 0, 0.042, Math.PI / 2, 0, 0, drawerG);
            put(box(0.36, 0.11, 0.26), 0, 0, -0.16, 0, 0, 0, drawerG);
            regSlide(drawerG, 'z', 0.26);
            regMagic(drawerG, () => { drawerG.userData.slide.open = !drawerG.userData.slide.open; });

            /* ---- 18.3 蜡烛 ---- */
            let candleLit = true, candleP = 1;
            const candleG = new THREE.Group();
            candleG.position.set(NSX, FY + 0.60, NSZ);
            scene.add(candleG);
            put(edge(new THREE.CylinderGeometry(0.055, 0.075, 0.05, 10)), 0, 0.025, 0, 0, 0, 0, candleG);
            put(edge(new THREE.CylinderGeometry(0.016, 0.016, 0.09, 8)), 0, 0.09, 0, 0, 0, 0, candleG);
            put(edge(new THREE.CylinderGeometry(0.05, 0.06, 0.035, 10)), 0, 0.155, 0, 0, 0, 0, candleG);
            const candleBody = edge(new THREE.CylinderGeometry(0.035, 0.038, 0.20, 10));
            candleBody.position.set(0, 0.27, 0);
            candleG.add(candleBody);
            put(edge(new THREE.CylinderGeometry(0.006, 0.006, 0.035, 6)), 0, 0.385, 0, 0, 0, 0, candleG);
            const candleWavy = [];
            makeWavyFlame(NSX, NSZ, FY + 1.00, 0.12, 0.034, fireMid, 0.0, 3.2, candleWavy);
            makeWavyFlame(NSX, NSZ, FY + 1.02, 0.07, 0.016, fireIn, 2.0, 3.8, candleWavy);
            regMagic(candleG, () => { candleLit = !candleLit; });
            const candleGlows = [];

            function makeCandleGlow(r, op, col) {
                const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
                m.position.set(NSX, FY + 1.02, NSZ);
                m.renderOrder = 8;
                scene.add(m);
                candleGlows.push({ m: m, maxOp: op });
            }
            makeCandleGlow(0.045, 0.55, 0xfff0c0);
            makeCandleGlow(0.10, 0.28, 0xffc06a);
            makeCandleGlow(0.18, 0.12, 0xff9a3c);

            /* ---- 18.4 书桌 + 椅子 + 桌面玩具 ---- */
            const TBLX = 2.5, TBLZ = -2.5;
            const TBL_TOP = FY + 0.80;
            for (const sxsz of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                put(edge(new THREE.CylinderGeometry(0.035, 0.028, 0.72, 8)), TBLX + sxsz[0] * 1.00, FY + 0.36, TBLZ + sxsz[1] * 0.45, 0, 0, 0);
            }
            put(box(2.4, 0.08, 1.1), TBLX, FY + 0.76, TBLZ);
            put(box(2.0, 0.05, 0.05), TBLX, FY + 0.28, TBLZ + 0.45);
            put(box(2.0, 0.05, 0.05), TBLX, FY + 0.28, TBLZ - 0.45);

            /* —— 椅子 —— */
            const CHAIR_IN = -3.20;
            const CHAIR_OUT = -3.60;
            const chairG = new THREE.Group();
            chairG.position.set(2.6, FY, CHAIR_IN);
            scene.add(chairG);
            for (const szx of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                put(edge(new THREE.CylinderGeometry(0.022, 0.018, 0.44, 6)), szx[0] * 0.18, 0.22, szx[1] * 0.18, 0, 0, 0, chairG);
            }
            put(box(0.44, 0.05, 0.44), 0, 0.465, 0, 0, 0, 0, chairG);
            put(box(0.44, 0.52, 0.045), 0, 0.72, -0.198, 0, 0, 0, chairG);
            let chairOpen = false, chairT = 0;
            regMagic(chairG, () => { chairOpen = !chairOpen; });

            /* —— 魔方 —— */
            const rubikG = new THREE.Group();
            const RUBIK_HOME = V(3.15, TBL_TOP + 0.085, -2.68);
            rubikG.position.copy(RUBIK_HOME);
            scene.add(rubikG);
            const rubikPivot = new THREE.Group();
            rubikG.add(rubikPivot);
            const faceCol = { px: 0xd94a3d, nx: 0xf0a03c, py: 0xf3d04a, ny: 0x53c26a, pz: 0x4a86c8, nz: 0x9a5bb5 };
            const cmMat = {};
            for (const k in faceCol) cmMat[k] = new THREE.MeshBasicMaterial({ color: faceCol[k] });
            const cmDark = LITMAT(0x242424);
            const cubieEdgeMat = new THREE.LineBasicMaterial({ color: 0x0d0d0d });
            const cubies = [];
            for (let cx = -1; cx <= 1; cx++) {
                for (let cy = -1; cy <= 1; cy++) {
                    for (let cz = -1; cz <= 1; cz++) {
                        if (cx === 0 && cy === 0 && cz === 0) continue;
                        const g = new THREE.BoxGeometry(0.046, 0.046, 0.046);
                        const m = new THREE.Mesh(g, [
                            cx === 1 ? cmMat.px : cmDark,
                            cx === -1 ? cmMat.nx : cmDark,
                            cy === 1 ? cmMat.py : cmDark,
                            cy === -1 ? cmMat.ny : cmDark,
                            cz === 1 ? cmMat.pz : cmDark,
                            cz === -1 ? cmMat.nz : cmDark
                        ]);
                        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), cubieEdgeMat));
                        m.position.set(cx * 0.05, cy * 0.05, cz * 0.05);
                        rubikG.add(m);
                        cubies.push({ mesh: m, pos: V(cx, cy, cz) });
                    }
                }
            }
            const rubikState = { phase: 'idle', t0: 0, moves: [], mi: 0, scrambled: false, history: [] };
            let layerAnim = null;
            const AXV = { x: V(1, 0, 0), y: V(0, 1, 0), z: V(0, 0, 1) };

            function beginLayer(axis, layer, dir, dur, onDone) {
                rubikPivot.rotation.set(0, 0, 0);
                rubikPivot.updateMatrixWorld(true);
                for (const c of cubies) {
                    if (Math.round(c.pos[axis]) === layer) rubikPivot.attach(c.mesh);
                }
                layerAnim = { axis: axis, layer: layer, dir: dir, t: 0, dur: dur, onDone: onDone };
            }

            function updateLayerAnim(dt) {
                if (!layerAnim) return;
                const la = layerAnim;
                la.t += dt;
                const k = la.t >= la.dur ? 1 : (la.t / la.dur) * (la.t / la.dur) * (3 - 2 * la.t / la.dur);
                rubikPivot.rotation[la.axis] = la.dir * Math.PI / 2 * k;
                if (la.t >= la.dur) {
                    rubikPivot.rotation[la.axis] = la.dir * Math.PI / 2;
                    rubikPivot.updateMatrixWorld(true);
                    for (let i = cubies.length - 1; i >= 0; i--) {
                        const c = cubies[i];
                        if (c.mesh.parent === rubikPivot) {
                            rubikG.attach(c.mesh);
                            c.pos.applyAxisAngle(AXV[la.axis], la.dir * Math.PI / 2);
                            c.pos.set(Math.round(c.pos.x), Math.round(c.pos.y), Math.round(c.pos.z));
                            c.mesh.position.set(
                                Math.round(c.mesh.position.x / 0.05) * 0.05,
                                Math.round(c.mesh.position.y / 0.05) * 0.05,
                                Math.round(c.mesh.position.z / 0.05) * 0.05
                            );
                        }
                    }
                    rubikPivot.rotation.set(0, 0, 0);
                    const cb = la.onDone;
                    layerAnim = null;
                    if (cb) cb();
                }
            }

            function startNextTurn() {
                const s = rubikState;
                const mv = s.moves[s.mi];
                beginLayer(mv.a, mv.l, mv.d, 0.30, () => {
                    s.mi++;
                    if (s.mi < s.moves.length) {
                        startNextTurn();
                    } else {
                        s.phase = 'down';
                        s.t0 = performance.now() * 0.001;
                    }
                });
            }

            regMagic(rubikG, () => {
                const s = rubikState;
                if (s.phase !== 'idle') return;
                if (!s.scrambled) {
                    const AX = ['x', 'y', 'z'], LS = [-1, 0, 1];
                    s.moves = [];
                    let lastAxis = '';
                    for (let i = 0; i < 6; i++) {
                        let ax;
                        do {
                            ax = AX[Math.floor(Math.random() * 3)];
                        } while (ax === lastAxis);
                        lastAxis = ax;
                        s.moves.push({ a: ax, l: LS[Math.floor(Math.random() * 3)], d: Math.random() < 0.5 ? 1 : -1 });
                    }
                    s.history = s.moves.slice();
                } else {
                    s.moves = s.history.slice().reverse().map(m => ({ a: m.a, l: m.l, d: -m.d }));
                }
                s.mi = 0;
                s.phase = 'up';
                s.t0 = performance.now() * 0.001;
            });

            function updateRubik(time) {
                const s = rubikState;
                if (s.phase === 'idle') return;
                const e = time - s.t0;
                if (s.phase === 'up') {
                    const k = Math.min(e / 0.4, 1);
                    rubikG.position.y = RUBIK_HOME.y + (k * k * (3 - 2 * k)) * 0.25;
                    if (e >= 0.4) {
                        s.phase = 'turn';
                        startNextTurn();
                    }
                } else if (s.phase === 'turn') {
                    rubikG.position.y = RUBIK_HOME.y + 0.25 + Math.sin(time * 3) * 0.006;
                } else if (s.phase === 'down') {
                    const k = Math.min(e / 0.4, 1);
                    rubikG.position.y = RUBIK_HOME.y + (1 - k * k * (3 - 2 * k)) * 0.25;
                    if (e >= 0.4) {
                        rubikG.position.copy(RUBIK_HOME);
                        s.scrambled = !s.scrambled;
                        s.phase = 'idle';
                    }
                }
            }

            /* —— 通用倒塌/恢复 —— */
            const toppleGroups = [];

            function regTopple(group, items) {
                let maxD = 0;
                for (const it of items) if ((it.delay || 0) > maxD) maxD = it.delay || 0;
                group.userData.tp = { t: 0, open: false, items: items, maxD: maxD };
                toppleGroups.push(group);
                regMagic(group, () => { group.userData.tp.open = !group.userData.tp.open; });
            }

            function updateTopple(group) {
                const s = group.userData.tp;
                s.t += ((s.open ? 1 : 0) - s.t) * 0.055;
                for (const it of s.items) {
                    let e = s.t * (1 + s.maxD) - (it.delay || 0);
                    e = Math.max(0, Math.min(1, e));
                    e = e * e * (3 - 2 * e);
                    it.o.position.lerpVectors(it.hp, it.fp, e);
                    it.o.rotation.set(
                        it.hr[0] + (it.fr[0] - it.hr[0]) * e,
                        it.hr[1] + (it.fr[1] - it.hr[1]) * e,
                        it.hr[2] + (it.fr[2] - it.hr[2]) * e
                    );
                }
            }

            /* —— 金币柱 ×3 —— */
            const coinG = new THREE.Group();
            scene.add(coinG);
            {
                const goldMat = LITMAT(0xd9b23a, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const goldEdge = new THREE.LineBasicMaterial({ color: 0x8a6a1e });
                const coinItems = [];
                const cols = [
                    { x: 3.275, z: -2.282, n: 8, dOff: 0.00 },
                    { x: 3.340, z: -2.276, n: 10, dOff: 0.03 },
                    { x: 3.405, z: -2.284, n: 7, dOff: 0.06 }
                ];
                const BASE = { x: 3.34, z: -2.28 };
                const dl = Math.hypot(0.25, 1.0);
                const DIR = { x: 0.25 / dl, z: -1.0 / dl };
                const PER = { x: -DIR.z, z: DIR.x };
                const colOrder = [2, 0, 3, 1];
                const slots = [];
                for (let k = 0; k < 24; k++) {
                    const r = Math.floor(k / 4);
                    const cRaw = colOrder[k % 4];
                    const c = (r % 2 === 1) ? (cRaw + 2) % 4 : cRaw;
                    const d = 0.055 + r * 0.063;
                    const s = (c - 1.5) * 0.064 + (r % 2 === 1 ? 0.032 : 0);
                    slots.push({ x: BASE.x + DIR.x * d + PER.x * s, z: BASE.z + DIR.z * d + PER.z * s });
                }
                const all = [];
                for (const col of cols) {
                    for (let h = 0; h < col.n; h++) all.push({ col: col, h: h });
                }
                all.sort((a, b) => (a.h - b.h) || (a.col.x - b.col.x));
                all.forEach((it, k) => {
                    const c = new THREE.Group();
                    const cg = new THREE.CylinderGeometry(0.030, 0.030, 0.007, 14);
                    c.add(new THREE.Mesh(cg, goldMat));
                    c.add(new THREE.LineSegments(new THREE.EdgesGeometry(cg, 20), goldEdge));
                    const hp = V(it.col.x, TBL_TOP + 0.0035 + it.h * 0.0072, it.col.z);
                    let fp;
                    if (k < 24) {
                        const sl = slots[k];
                        fp = V(sl.x, TBL_TOP + 0.0035, sl.z);
                    } else {
                        const sl = slots[1];
                        fp = V(sl.x, TBL_TOP + 0.0035 + 0.0072, sl.z);
                    }
                    c.position.copy(hp);
                    coinG.add(c);
                    coinItems.push({ o: c, hp: hp, fp: fp, hr: [0, 0, 0], fr: [0, Math.random() * 6.28, 0], delay: it.col.dOff + it.h * 0.055 + Math.random() * 0.02 });
                });
                regTopple(coinG, coinItems);
            }

            /* —— 扑克牌堆 —— */
            const deckG = new THREE.Group();
            const DECK_HOME = V(3.35, TBL_TOP + 0.002, -2.15);
            deckG.position.copy(DECK_HOME);
            scene.add(deckG);
            const DECK_N = 11;
            const deckCards = [];
            let revealCard = null, revealFaceMat = null;
            const SUITS = [
                { ch: '♥', col: '#d0342c' },
                { ch: '♦', col: '#d0342c' },
                { ch: '♣', col: '#222222' },
                { ch: '♠', col: '#222222' }
            ];
            {
                const backCv = document.createElement('canvas');
                backCv.width = 128;
                backCv.height = 180;
                const bc = backCv.getContext('2d');
                bc.fillStyle = '#b04a4a';
                bc.fillRect(0, 0, 128, 180);
                bc.strokeStyle = 'rgba(255,255,255,0.75)';
                bc.lineWidth = 2;
                for (let k = -180; k < 180; k += 14) {
                    bc.beginPath();
                    bc.moveTo(k, 0);
                    bc.lineTo(k + 180, 180);
                    bc.stroke();
                    bc.beginPath();
                    bc.moveTo(k + 180, 0);
                    bc.lineTo(k, 180);
                    bc.stroke();
                }
                bc.strokeStyle = '#7a2a2a';
                bc.lineWidth = 8;
                bc.strokeRect(4, 4, 120, 172);
                const backTex = new THREE.CanvasTexture(backCv);
                const backMat = new THREE.MeshBasicMaterial({ map: backTex });
                const whiteMat = LITMAT(0xfdfdf6);
                const sideMat = LITMAT(0xe8e2d0);
                const cardGeo = new THREE.BoxGeometry(0.055, 0.0016, 0.078);
                const cardEdgeMat = new THREE.LineBasicMaterial({ color: 0x8a3a3a });
                for (let i = 0; i < DECK_N; i++) {
                    const c = new THREE.Group();
                    const m = new THREE.Mesh(cardGeo, [sideMat, sideMat, backMat, whiteMat, sideMat, sideMat]);
                    c.add(m);
                    c.add(new THREE.LineSegments(new THREE.EdgesGeometry(cardGeo), cardEdgeMat));
                    const by = i * 0.0017;
                    c.position.set(0, by, 0);
                    c.userData = { i: i, base: V(0, by, 0) };
                    deckG.add(c);
                    deckCards.push(c);
                }
                const faceCv = document.createElement('canvas');
                faceCv.width = 128;
                faceCv.height = 180;
                const faceTex = new THREE.CanvasTexture(faceCv);
                revealFaceMat = new THREE.MeshBasicMaterial({ map: faceTex });
                revealCard = { canvas: faceCv, tex: faceTex };

                function drawFace(si) {
                    const fc = faceCv.getContext('2d');
                    const su = SUITS[si];
                    fc.fillStyle = '#fdfdf6';
                    fc.fillRect(0, 0, 128, 180);
                    fc.strokeStyle = '#cccccc';
                    fc.lineWidth = 4;
                    fc.strokeRect(4, 4, 120, 172);
                    fc.fillStyle = su.col;
                    fc.textAlign = 'center';
                    fc.textBaseline = 'middle';
                    fc.font = '88px serif';
                    fc.fillText(su.ch, 64, 96);
                    fc.font = '26px serif';
                    fc.fillText(su.ch, 20, 24);
                    fc.fillText(su.ch, 108, 156);
                    faceTex.needsUpdate = true;
                }
                drawFace(0);
                const rc = new THREE.Group();
                const rGeo = new THREE.BoxGeometry(0.055, 0.0016, 0.078);
                const rm = new THREE.Mesh(rGeo, [sideMat, sideMat, backMat, revealFaceMat, sideMat, sideMat]);
                rc.add(rm);
                rc.add(new THREE.LineSegments(new THREE.EdgesGeometry(rGeo), cardEdgeMat));
                rc.position.set(0, DECK_N * 0.0017, 0);
                deckG.add(rc);
                revealCard.grp = rc;
                revealCard.draw = drawFace;
                revealCard.homeY = rc.position.y;
            }
            const deckState = { phase: 'idle', t0: 0 };
            regMagic(deckG, () => {
                if (deckState.phase !== 'idle') return;
                revealCard.draw(Math.floor(Math.random() * 4));
                deckState.phase = 'rise';
                deckState.t0 = performance.now() * 0.001;
            });

            function updateDeck(time) {
                const s = deckState;
                if (s.phase === 'idle') return;
                const e = time - s.t0;
                const rc = revealCard.grp;
                const go = ph => { s.phase = ph; s.t0 = time; };
                if (s.phase === 'rise') {
                    const k = smooth(Math.min(e / 0.35, 1));
                    deckG.position.y = DECK_HOME.y + 0.22 * k;
                    if (e >= 0.35) go('split');
                } else if (s.phase === 'split') {
                    deckG.position.y = DECK_HOME.y + 0.22 + Math.sin(time * 5) * 0.004;
                    const k = smooth(Math.min(e / 0.28, 1));
                    for (const c of deckCards) {
                        const side = (c.userData.i < 6) ? -1 : 1;
                        c.position.x = side * 0.052 * k;
                        c.position.y = c.userData.base.y + (side > 0 ? 0.005 : 0) * k;
                        c.rotation.y = side * 0.12 * k;
                    }
                    rc.position.x = 0.026 * k;
                    if (e >= 0.36) go('riffle');
                } else if (s.phase === 'riffle') {
                    deckG.position.y = DECK_HOME.y + 0.22 + Math.sin(time * 5) * 0.004;
                    for (const c of deckCards) {
                        const side = (c.userData.i < 6) ? -1 : 1;
                        const tk = smooth(Math.max(0, Math.min(1, (e - (side > 0 ? 0.14 : 0)) / 0.30)));
                        c.position.x = side * 0.052 * (1 - tk);
                        c.position.y = c.userData.base.y + (side > 0 ? 0.005 : 0) * (1 - tk) + Math.sin(tk * Math.PI) * 0.006;
                        c.rotation.y = side * 0.12 * (1 - tk);
                    }
                    const rtk = smooth(Math.max(0, Math.min(1, (e - 0.14) / 0.30)));
                    rc.position.x = 0.026 * (1 - rtk);
                    if (e >= 0.52) go('settle');
                } else if (s.phase === 'settle') {
                    for (const c of deckCards) {
                        c.position.copy(c.userData.base);
                        c.rotation.y = 0;
                    }
                    rc.position.set(0, revealCard.homeY, 0);
                    if (e >= 0.15) go('rup');
                } else if (s.phase === 'rup') {
                    const k = smooth(Math.min(e / 0.30, 1));
                    rc.position.y = revealCard.homeY + 0.11 * k;
                    if (e >= 0.30) go('rflip');
                } else if (s.phase === 'rflip') {
                    const k = smooth(Math.min(e / 0.45, 1));
                    rc.rotation.x = Math.PI * k;
                    rc.position.y = revealCard.homeY + 0.11 + 0.025 * Math.sin(k * Math.PI);
                    if (e >= 0.45) go('rhold');
                } else if (s.phase === 'rhold') {
                    rc.position.y = revealCard.homeY + 0.11 + Math.sin(time * 2.5) * 0.004;
                    if (e >= 1.5) go('rback');
                } else if (s.phase === 'rback') {
                    const k = smooth(Math.min(e / 0.45, 1));
                    rc.rotation.x = Math.PI * (1 - k);
                    rc.position.y = revealCard.homeY + 0.11 + 0.025 * Math.sin((1 - k) * Math.PI);
                    if (e >= 0.45) go('rdown');
                } else if (s.phase === 'rdown') {
                    const k = smooth(Math.min(e / 0.30, 1));
                    rc.position.y = revealCard.homeY + 0.11 * (1 - k);
                    if (e >= 0.30) go('down');
                } else if (s.phase === 'down') {
                    rc.rotation.x = 0;
                    const k = smooth(Math.min(e / 0.40, 1));
                    deckG.position.y = DECK_HOME.y + 0.22 * (1 - k);
                    if (e >= 0.40) {
                        deckG.position.copy(DECK_HOME);
                        s.phase = 'idle';
                    }
                }
            }

            /* —— 玻璃雪景球 —— */
            const snowG = new THREE.Group();
            snowG.position.set(3.50, TBL_TOP, -2.80);
            scene.add(snowG);
            const SNOW_C = V(0, 0.100, 0);
            const SNOW_R = 0.070;
            const SNOW_FLOOR = 0.040;
            const snowParts = [];
            {
                const woodM = LITMAT(0x8a6238, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const baseG = new THREE.CylinderGeometry(0.052, 0.060, 0.026, 14);
                const base = new THREE.Mesh(baseG, woodM);
                base.position.y = 0.013;
                snowG.add(base);
                snowG.add(new THREE.LineSegments(new THREE.EdgesGeometry(baseG), MAT).translateY(0.013));
                const trim = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 6, 18), LITMAT(0xcaa273));
                trim.rotation.x = Math.PI / 2;
                trim.position.y = 0.027;
                snowG.add(trim);
                const glass = new THREE.Mesh(new THREE.SphereGeometry(SNOW_R, 16, 12), new THREE.MeshBasicMaterial({ color: 0xdff2f8, transparent: true, opacity: 0.20, depthWrite: false, side: THREE.DoubleSide }));
                glass.position.copy(SNOW_C);
                glass.renderOrder = 6;
                snowG.add(glass);
                const whiteM = LITMAT(0xf4f8fc);
                const ground = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), whiteM);
                ground.scale.set(1.15, 0.35, 1.15);
                ground.position.y = 0.034;
                snowG.add(ground);
                const TX = 0.018, TZ = 0.006;
                const trunkM = LITMAT(0x6a4a2a);
                const g1 = new THREE.CylinderGeometry(0.004, 0.005, 0.014, 6);
                const trunk = new THREE.Mesh(g1, trunkM);
                trunk.position.set(TX, 0.044, TZ);
                snowG.add(trunk);
                const grn1 = LITMAT(0x2e7a44);
                const grn2 = LITMAT(0x3a8a52);
                const t1 = new THREE.ConeGeometry(0.017, 0.020, 8);
                const m1 = new THREE.Mesh(t1, grn1);
                m1.position.set(TX, 0.054, TZ);
                snowG.add(m1);
                snowG.add(new THREE.LineSegments(new THREE.EdgesGeometry(t1), MAT).translateX(TX).translateY(0.054).translateZ(TZ));
                const t2 = new THREE.ConeGeometry(0.0135, 0.018, 8);
                const m2 = new THREE.Mesh(t2, grn2);
                m2.position.set(TX, 0.064, TZ);
                snowG.add(m2);
                snowG.add(new THREE.LineSegments(new THREE.EdgesGeometry(t2), MAT).translateX(TX).translateY(0.064).translateZ(TZ));
                const t3 = new THREE.ConeGeometry(0.010, 0.016, 8);
                const m3 = new THREE.Mesh(t3, grn1);
                m3.position.set(TX, 0.073, TZ);
                snowG.add(m3);
                snowG.add(new THREE.LineSegments(new THREE.EdgesGeometry(t3), MAT).translateX(TX).translateY(0.073).translateZ(TZ));
                const houseM = LITMAT(0xc9803c);
                const hG = new THREE.BoxGeometry(0.022, 0.016, 0.018);
                const house = new THREE.Mesh(hG, houseM);
                house.position.set(-0.014, 0.048, -0.006);
                snowG.add(house);
                snowG.add(new THREE.LineSegments(new THREE.EdgesGeometry(hG), MAT).translateX(-0.014).translateY(0.048).translateZ(-0.006));
                const roofG = new THREE.ConeGeometry(0.017, 0.012, 4);
                const roof = new THREE.Mesh(roofG, LITMAT(0xa04638));
                roof.position.set(-0.014, 0.062, -0.006);
                roof.rotation.y = Math.PI / 4;
                snowG.add(roof);
                const flakeM = LITMAT(0xffffff);
                for (let i = 0; i < 24; i++) {
                    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.0032), flakeM);
                    const a = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1);
                    const r = 0.015 + Math.random() * 0.042;
                    const p = V(
                        SNOW_C.x + Math.sin(ph) * Math.cos(a) * r,
                        Math.max(SNOW_FLOOR + 0.004, SNOW_C.y + Math.cos(ph) * r),
                        SNOW_C.z + Math.sin(ph) * Math.sin(a) * r
                    );
                    m.position.copy(p);
                    snowG.add(m);
                    snowParts.push({ mesh: m, p: p, v: V(0, -0.008, 0), ph: Math.random() * 6.28, sf: 0.6 + Math.random() });
                }
            }
            regMagic(snowG, () => {
                for (const s of snowParts) {
                    const a = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1);
                    s.v.x += Math.sin(ph) * Math.cos(a) * (0.15 + Math.random() * 0.20);
                    s.v.z += Math.sin(ph) * Math.sin(a) * (0.15 + Math.random() * 0.20);
                    s.v.y += 0.10 + Math.random() * 0.14;
                }
            });

            function updateSnow(time, dt) {
                for (const s of snowParts) {
                    s.v.y -= 0.05 * dt;
                    s.v.multiplyScalar(Math.max(0, 1 - 1.4 * dt));
                    s.p.addScaledVector(s.v, dt);
                    s.p.x += Math.sin(time * s.sf + s.ph) * 0.00018;
                    const dx = s.p.x - SNOW_C.x, dy = s.p.y - SNOW_C.y, dz = s.p.z - SNOW_C.z;
                    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const R = SNOW_R - 0.004;
                    if (L > R) {
                        const k = R / L;
                        s.p.set(SNOW_C.x + dx * k, SNOW_C.y + dy * k, SNOW_C.z + dz * k);
                        s.v.multiplyScalar(0.35);
                    }
                    if (s.p.y < SNOW_FLOOR) {
                        s.p.y = SNOW_FLOOR;
                        s.v.y = Math.max(0, s.v.y);
                        s.v.x *= 0.5;
                        s.v.z *= 0.5;
                        if (s.v.length() < 0.006 && Math.random() < 0.004) {
                            s.p.set(
                                SNOW_C.x + (Math.random() - 0.5) * 0.05,
                                SNOW_C.y + 0.028 + Math.random() * 0.032,
                                SNOW_C.z + (Math.random() - 0.5) * 0.05
                            );
                            s.v.set(0, -0.008, 0);
                        }
                    }
                    s.mesh.position.copy(s.p);
                    s.mesh.rotation.y += 1.8 * dt;
                }
            }

            /* —— 沙漏 —— */
            const hourG = new THREE.Group();
            hourG.position.set(2.15, TBL_TOP + 0.106, -2.50);
            scene.add(hourG);
            let sandUp, sandDn, sandStream;
            const hourSand = { up: 1.0, dn: 0.05 };
            const hourState = { phase: 'flow', t0: performance.now() * 0.001 };
            {
                const woodM = LITMAT(0x8a6238, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const dG = new THREE.CylinderGeometry(0.050, 0.050, 0.012, 14);
                const d1 = new THREE.Mesh(dG, woodM);
                d1.position.y = 0.098;
                hourG.add(d1);
                const d2 = new THREE.Mesh(dG, woodM);
                d2.position.y = -0.098;
                hourG.add(d2);
                hourG.add(new THREE.LineSegments(new THREE.EdgesGeometry(dG), MAT).translateY(0.098));
                hourG.add(new THREE.LineSegments(new THREE.EdgesGeometry(dG), MAT).translateY(-0.098));
                for (let i = 0; i < 3; i++) {
                    const a = i * Math.PI * 2 / 3 + 0.5;
                    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.20, 6), woodM);
                    p.position.set(Math.cos(a) * 0.044, 0, Math.sin(a) * 0.044);
                    hourG.add(p);
                }
                const glassM = new THREE.MeshBasicMaterial({ color: 0xdff2f8, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
                const cupG = new THREE.ConeGeometry(0.038, 0.086, 14);
                const up = new THREE.Mesh(cupG, glassM);
                up.rotation.x = Math.PI;
                up.position.y = 0.047;
                hourG.add(up);
                const dn = new THREE.Mesh(cupG, glassM);
                dn.position.y = -0.047;
                hourG.add(dn);
                const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 8), glassM);
                hourG.add(neck);
                const sandM = LITMAT(0xe8c26a);
                const gU = new THREE.ConeGeometry(0.031, 0.082, 12);
                gU.rotateX(Math.PI);
                gU.translate(0, 0.041, 0);
                sandUp = new THREE.Mesh(gU, sandM);
                sandUp.position.y = 0.004;
                hourG.add(sandUp);
                const gD = new THREE.ConeGeometry(0.033, 0.070, 12);
                gD.translate(0, 0.035, 0);
                sandDn = new THREE.Mesh(gD, sandM);
                sandDn.position.y = -0.090;
                hourG.add(sandDn);
                sandStream = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.066, 6), LITMAT(0xe8c26a));
                sandStream.position.y = -0.037;
                hourG.add(sandStream);
            }
            regMagic(hourG, () => {
                if (hourState.phase !== 'idle') return;
                hourState.phase = 'flip';
                hourState.t0 = performance.now() * 0.001;
            });

            function updateHourglass(time) {
                const s = hourState;
                if (s.phase === 'flip') {
                    const e = time - s.t0;
                    const kk = smooth(Math.min(e / 0.6, 1));
                    hourG.rotation.z = kk * Math.PI;
                    sandStream.visible = false;
                    if (e >= 0.6) {
                        hourG.rotation.z = 0;
                        const t = hourSand.up;
                        hourSand.up = hourSand.dn;
                        hourSand.dn = t;
                        s.phase = 'flow';
                        s.t0 = time;
                    }
                } else if (s.phase === 'flow') {
                    const e = time - s.t0;
                    const kk = smooth(Math.min(e / 3.0, 1));
                    hourSand.up = 1 - 0.95 * kk;
                    hourSand.dn = 0.05 + 0.95 * kk;
                    sandStream.visible = e < 2.9;
                    if (e >= 3.0) {
                        sandStream.visible = false;
                        s.phase = 'idle';
                    }
                }
                sandUp.scale.setScalar(Math.max(0.05, hourSand.up));
                sandDn.scale.setScalar(Math.max(0.05, hourSand.dn));
            }

            /* ========================================================== */
            /* —— 台历（转轴位于背板面顶端：未翻页贴板前面、翻过页贴板背面， */
            /*       由背板物理隔开，翻到任何月份都互不交叉）—— */
            /* ========================================================== */
            const calG = new THREE.Group();
            calG.position.set(2.62, TBL_TOP, -2.34);
            calG.rotation.y = -0.18;
            scene.add(calG);
            const calState = { month: 1, phase: 'idle', animT: 0, animDur: 0.75, animPage: null };
            const calPages = [];
            {
                function calBox(w, h, d, col) {
                    const grp = new THREE.Group();
                    const g = new THREE.BoxGeometry(w, h, d);
                    grp.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
                    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), MAT));
                    return grp;
                }

                // 2026 年各月天数与 1 日星期（0 = 周日）
                const CAL_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                const CAL_FIRST = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];

                function drawCalPage(month, isFront) {
                    const cv = document.createElement('canvas');
                    cv.width = 128;
                    cv.height = 88;
                    const c = cv.getContext('2d');
                    if (!isFront) {
                        c.fillStyle = '#eae6da';
                        c.fillRect(0, 0, 128, 88);
                        c.strokeStyle = '#c9c2b0';
                        c.lineWidth = 2;
                        c.strokeRect(3, 3, 122, 82);
                        c.fillStyle = '#b8b0a0';
                        c.font = '11px serif';
                        c.textAlign = 'center';
                        c.textBaseline = 'middle';
                        c.fillText('✦ Magic ✦', 64, 44);
                        return new THREE.CanvasTexture(cv);
                    }
                    c.fillStyle = '#fdfdf8';
                    c.fillRect(0, 0, 128, 88);
                    // 标题栏
                    c.fillStyle = '#7a3a4a';
                    c.fillRect(0, 0, 128, 14);
                    c.fillStyle = '#ffffff';
                    c.font = 'bold 10px serif';
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.fillText(month + ' 月', 64, 8);
                    // 星期行
                    const days = ['日', '一', '二', '三', '四', '五', '六'];
                    c.textBaseline = 'alphabetic';
                    c.font = '7px serif';
                    for (let i = 0; i < 7; i++) {
                        c.fillStyle = i === 0 ? '#c05a5a' : (i === 6 ? '#5a7ac0' : '#8a8a8a');
                        c.fillText(days[i], 11 + i * 17.7, 24);
                    }
                    // 日期网格：按当月真实天数与首日星期排布（支持 6 行）
                    const nDays = CAL_DAYS[month - 1];
                    const first = CAL_FIRST[month - 1];
                    c.font = '7.5px serif';
                    for (let d = 1; d <= nDays; d++) {
                        const cell = first + d - 1;
                        const col = cell % 7;
                        const row = Math.floor(cell / 7);
                        c.fillStyle = col === 0 ? '#b04a4a' : (col === 6 ? '#4a6ab0' : '#444444');
                        c.fillText(d.toString(), 11 + col * 17.7, 33 + row * 8.6);
                    }
                    return new THREE.CanvasTexture(cv);
                }

                // 底座
                const base = calBox(0.20, 0.024, 0.13, 0x8a6238);
                base.position.y = 0.012;
                calG.add(base);

                // 背板组（前倾 0.32 rad；组内背板为竖直板，y 0~0.14，厚 z ±0.006）
                const backG = new THREE.Group();
                backG.position.set(0, 0.024, -0.028);
                backG.rotation.x = 0.32;
                calG.add(backG);

                // 背板
                const board = calBox(0.19, 0.14, 0.012, 0xa07850);
                board.position.set(0, 0.07, 0);
                backG.add(board);

                // 转轴托块（连接板顶与横杆，位于页面两侧之外）
                for (const sx of [-1, 1]) {
                    const lug = calBox(0.024, 0.022, 0.02, 0x8a6238);
                    lug.position.set(sx * 0.086, 0.146, 0);
                    backG.add(lug);
                }

                // 横杆：精确置于背板面顶端延长处（组内 (0, 0.152, 0)）
                const ROD_Y = 0.152, ROD_Z = 0;
                const rodGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.19, 6);
                rodGeo.rotateZ(Math.PI / 2);
                const rodMesh = new THREE.Mesh(rodGeo, LITMAT(0x5a3c1e, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
                rodMesh.position.set(0, ROD_Y, ROD_Z);
                rodMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(rodGeo, 10), MAT));
                backG.add(rodMesh);

                // 12 页月历：铰点 = 杆心。未翻时贴背板前面层叠（1 月最外、先翻），
                // 翻过后绕杆翻转近一整圈贴背板背面层叠（1 月最贴板）。
                const CAL_W = 0.16, CAL_H = 0.11, CAL_T = 0.0015;
                const pageSideMat = LITMAT(0xf0ede4);
                for (let i = 1; i <= 12; i++) {
                    const pgG = new THREE.Group();
                    pgG.position.set(0, ROD_Y, ROD_Z);
                    const frontMat = new THREE.MeshBasicMaterial({ map: drawCalPage(i, true) });
                    const backMat = new THREE.MeshBasicMaterial({ map: drawCalPage(i, false) });
                    const pgGeo = new THREE.BoxGeometry(CAL_W, CAL_H, CAL_T);
                    // 材质数组：index 5 (-z 面，朝书本) 正面月份；index 4 (+z 面) 背面装饰
                    const pgMesh = new THREE.Mesh(pgGeo, [pageSideMat, pageSideMat, pageSideMat, pageSideMat, backMat, frontMat]);
                    const zInit = -0.0085 - (12 - i) * 0.0016;  // 板前层叠：12 月贴板，1 月最外
                    const zFlip = 0.0085 + (i - 1) * 0.0016;    // 板后层叠：1 月贴板背，12 月最外
                    pgMesh.position.set(0, -CAL_H / 2, zInit);
                    pgMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(pgGeo), MAT));
                    pgG.add(pgMesh);
                    backG.add(pgG);
                    calPages.push({
                        grp: pgG,
                        mesh: pgMesh,
                        zInit: zInit,
                        zFlip: zFlip,
                        initRot: 0,
                        flippedRot: Math.PI * 2 - 0.03 - (i - 1) * 0.004
                    });
                }
            }
            regMagic(calG, () => {
                if (calState.phase !== 'idle') return;
                if (calState.month <= 12) {
                    calState.phase = 'flipping';
                    calState.animPage = calPages[calState.month - 1];
                    calState.animT = 0;
                    calState.animDur = 0.75;
                } else {
                    calState.phase = 'returning';
                    calState.animT = 0;
                    calState.animDur = 0.9;
                }
            });

            // 根据当前旋转角计算页面沿杆的 z 偏移：
            // 前半圈（页在前方）保持板前层叠位置，翻过顶部（rot > π）后平滑滑到板后层叠位置
            function calZFor(pg, rot) {
                const kk = smooth(Math.max(0, Math.min(1, (rot - Math.PI) / Math.PI)));
                return pg.zInit + (pg.zFlip - pg.zInit) * kk;
            }

            function updateCal(dt) {
                if (calState.phase === 'idle') return;
                calState.animT += dt;
                const e = calState.animT;
                const k = smooth(Math.min(e / calState.animDur, 1));
                if (calState.phase === 'flipping') {
                    const pg = calState.animPage;
                    const rot = pg.initRot + (pg.flippedRot - pg.initRot) * k;
                    pg.grp.rotation.x = rot;
                    pg.mesh.position.z = calZFor(pg, rot);
                    if (e >= calState.animDur) {
                        pg.grp.rotation.x = pg.flippedRot;
                        pg.mesh.position.z = pg.zFlip;
                        calState.month++;
                        calState.phase = 'idle';
                    }
                } else if (calState.phase === 'returning') {
                    for (const pg of calPages) {
                        const rot = pg.flippedRot + (pg.initRot - pg.flippedRot) * k;
                        pg.grp.rotation.x = rot;
                        pg.mesh.position.z = calZFor(pg, rot);
                    }
                    if (e >= calState.animDur) {
                        for (const pg of calPages) {
                            pg.grp.rotation.x = pg.initRot;
                            pg.mesh.position.z = pg.zInit;
                        }
                        calState.month = 1;
                        calState.phase = 'idle';
                    }
                }
            }

            /* ========================================================== */
            /* —— 魔法书本 —— */
            /* ========================================================== */
            const bookG = new THREE.Group();
            bookG.position.set(2.58, TBL_TOP + 0.001, -2.80);
            bookG.rotation.y = -0.35;
            scene.add(bookG);
            let coverPivot;
            let spineG;
            const flipperPivots = [];
            const fanPivots = [];
            const FAN_FIN = [0.40, 0.80, 1.20, 1.60, 2.00, 2.40, 2.80];
            const COVER_FIN = Math.PI;
            const COVER_Y0 = 0.039;
            const COVER_Y1 = 0.006;
            const FLIP_CLOSED_Y = [];
            const FLIP_OPEN_Y = [];
            for (let i = 0; i < 6; i++) {
                FLIP_CLOSED_Y.push(0.0222 + i * 0.0019);
                FLIP_OPEN_Y.push(0.0128 + i * 0.0019);
            }
            {
                const covMat = LITMAT(0x7a4638, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const covEdge = new THREE.LineBasicMaterial({ color: 0x4a2820 });
                const pgMat = LITMAT(0xf3ecd8, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                const pgEdge = new THREE.LineBasicMaterial({ color: 0xb8ad8e });

                function plate(w, t, d, mat, emat) {
                    const g = new THREE.BoxGeometry(w, t, d);
                    const grp = new THREE.Group();
                    const m = new THREE.Mesh(g, mat);
                    m.position.x = w / 2;
                    grp.add(m);
                    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), emat);
                    e.position.x = w / 2;
                    grp.add(e);
                    return grp;
                }

                function pageStack(count) {
                    const grp = new THREE.Group();
                    const t = 0.0012, gap = 0.00025;
                    for (let i = 0; i < count; i++) {
                        const pg = plate(0.19, t, 0.245, pgMat, pgEdge);
                        pg.position.y = i * (t + gap);
                        grp.add(pg);
                    }
                    return grp;
                }
                const back = plate(0.20, 0.012, 0.26, covMat, covEdge);
                back.position.set(0, 0.006, 0);
                bookG.add(back);
                const rightStack = pageStack(6);
                rightStack.position.set(0, 0.0125, 0);
                bookG.add(rightStack);
                for (let i = 0; i < 6; i++) {
                    const pg = plate(0.19, 0.0016, 0.245, pgMat, pgEdge);
                    pg.position.set(0, FLIP_CLOSED_Y[i], 0);
                    bookG.add(pg);
                    flipperPivots.push(pg);
                }
                for (let i = 0; i < 7; i++) {
                    const pg = plate(0.19, 0.0016, 0.245, pgMat, pgEdge);
                    pg.position.set(0, 0.0222 + i * 0.0009, 0);
                    pg.visible = false;
                    bookG.add(pg);
                    fanPivots.push(pg);
                }
                coverPivot = plate(0.20, 0.012, 0.26, covMat, covEdge);
                coverPivot.position.set(0, COVER_Y0, 0);
                bookG.add(coverPivot);
                const SPINE_R = 0.0225;
                const spineGeo = new THREE.CylinderGeometry(SPINE_R, SPINE_R, 0.27, 12, 1, false, 0, Math.PI);
                spineGeo.rotateX(Math.PI / 2);
                const spineMat = LITMAT(0x7a4638, { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                spineG = new THREE.Group();
                spineG.position.set(0, SPINE_R, 0);
                spineG.rotation.z = Math.PI;
                spineG.add(new THREE.Mesh(spineGeo, spineMat));
                spineG.add(new THREE.LineSegments(new THREE.EdgesGeometry(spineGeo, 10), covEdge));
                bookG.add(spineG);
            }
            const bookState = { phase: 'closed', t0: 0 };
            regMagic(bookG, () => {
                const s = bookState;
                if (s.phase === 'closed') {
                    s.phase = 'opening';
                    s.t0 = performance.now() * 0.001;
                } else if (s.phase === 'open') {
                    s.phase = 'closing';
                    s.t0 = performance.now() * 0.001;
                }
            });
            const GLYPH_SYMS = ['✦', '☾', '✧', '∴', '⟡', '✱', '☽', '✸', '❖', '✺', '✜', '✻'];
            const GLYPH_COLS = ['#ff6a4a', '#ffd94a', '#6affd9', '#6aa8ff', '#c86aff', '#ff6ad5', '#fff2b0'];
            const glyphTexCache = {};

            function getGlyphTex(sym, col) {
                const key = sym + col;
                if (glyphTexCache[key]) return glyphTexCache[key];
                const cv = document.createElement('canvas');
                cv.width = 128;
                cv.height = 128;
                const cx = cv.getContext('2d');
                cx.font = '84px serif';
                cx.textAlign = 'center';
                cx.textBaseline = 'middle';
                cx.shadowColor = col;
                cx.shadowBlur = 22;
                cx.fillStyle = col;
                cx.fillText(sym, 64, 68);
                cx.shadowBlur = 0;
                cx.fillStyle = '#ffffff';
                cx.fillText(sym, 64, 68);
                const tex = new THREE.CanvasTexture(cv);
                glyphTexCache[key] = tex;
                return tex;
            }
            const glyphObjs = [];
            const glyphGeoShared = new THREE.PlaneGeometry(0.05, 0.05);

            function spawnGlyphs(n) {
                for (let i = 0; i < n; i++) {
                    const sym = GLYPH_SYMS[Math.floor(Math.random() * GLYPH_SYMS.length)];
                    const col = GLYPH_COLS[Math.floor(Math.random() * GLYPH_COLS.length)];
                    const m = new THREE.Mesh(
                        glyphGeoShared,
                        new THREE.MeshBasicMaterial({ map: getGlyphTex(sym, col), transparent: true, opacity: 0, depthWrite: false })
                    );
                    m.renderOrder = 11;
                    m.position.set(
                        bookG.position.x + (Math.random() - 0.5) * 0.12,
                        bookG.position.y + 0.10 + Math.random() * 0.03,
                        bookG.position.z + (Math.random() - 0.5) * 0.10
                    );
                    scene.add(m);
                    glyphObjs.push({
                        m: m,
                        v: V((Math.random() - 0.5) * 0.06, 0.10 + Math.random() * 0.07, (Math.random() - 0.5) * 0.06),
                        life: 1.8 + Math.random() * 1.0,
                        t: 0,
                        ph: Math.random() * 6.28,
                        rs: (Math.random() - 0.5) * 3
                    });
                }
            }

            function updateGlyphs(time, dt) {
                for (let i = glyphObjs.length - 1; i >= 0; i--) {
                    const g = glyphObjs[i];
                    g.t += dt;
                    if (g.t >= g.life) {
                        scene.remove(g.m);
                        g.m.material.dispose();
                        glyphObjs.splice(i, 1);
                        continue;
                    }
                    g.m.position.addScaledVector(g.v, dt);
                    g.m.position.x += Math.sin(time * 3 + g.ph) * 0.0004;
                    g.v.multiplyScalar(Math.max(0, 1 - 0.25 * dt));
                    const fade = g.t / (g.life - 0.7);
                    g.m.material.opacity = Math.min(1, g.t / 0.25) * (1 - smooth(Math.max(0, Math.min(1, fade))));
                    const sc = 0.8 + 0.3 * Math.abs(Math.sin(time * 4 + g.ph));
                    g.m.scale.set(sc, sc, sc);
                    g.m.quaternion.copy(camera.quaternion);
                    g.m.rotation.z += g.rs * dt;
                }
            }
            let bookGlyphT = 0;

            function updateBook(time, dt) {
                const s = bookState;
                const e = time - s.t0;
                const ck = Math.max(0, Math.min(1, coverPivot.rotation.z / Math.PI));
                spineG.rotation.z = Math.PI + (Math.PI / 2) * ck;
                spineG.position.y = 0.0225 + (0.008 - 0.0225) * ck;
                const ss = 1 - 0.3 * ck;
                spineG.scale.set(ss, ss, 1);
                if (s.phase === 'opening') {
                    const CO = 0.55, W = 0.18;
                    const k = smooth(Math.min(e / CO, 1));
                    coverPivot.rotation.z = COVER_FIN * k;
                    coverPivot.position.y = COVER_Y0 + (COVER_Y1 - COVER_Y0) * k;
                    if (e >= CO + W) {
                        coverPivot.rotation.z = COVER_FIN;
                        coverPivot.position.y = COVER_Y1;
                        s.phase = 'flipping';
                        s.t0 = time;
                    }
                } else if (s.phase === 'flipping') {
                    const D = 0.10, DUR = 0.13, W = 0.25;
                    for (let i = 0; i < 6; i++) {
                        const kk = smooth(Math.max(0, Math.min(1, (e - i * D) / DUR)));
                        flipperPivots[i].rotation.z = 3.05 * kk;
                        flipperPivots[i].position.y = FLIP_OPEN_Y[i] + (FLIP_CLOSED_Y[i] - FLIP_OPEN_Y[i]) * (1 - kk);
                    }
                    if (e >= 5 * D + DUR + W) {
                        for (const fp of fanPivots) fp.visible = true;
                        s.phase = 'fanning';
                        s.t0 = time;
                    }
                } else if (s.phase === 'fanning') {
                    const F = 0.40;
                    const k = smooth(Math.min(e / F, 1));
                    for (let i = 0; i < 7; i++) {
                        fanPivots[i].rotation.z = FAN_FIN[i] * k;
                    }
                    if (e >= F) {
                        s.phase = 'open';
                        spawnGlyphs(8);
                        bookGlyphT = 0.45;
                    }
                } else if (s.phase === 'open') {
                    bookGlyphT -= dt;
                    if (bookGlyphT <= 0 && glyphObjs.length < 16) {
                        spawnGlyphs(1);
                        bookGlyphT = 0.45;
                    }
                } else if (s.phase === 'closing') {
                    const FAN = 0.35, W1 = 0.15;
                    const D = 0.08, DUR = 0.12, W2 = 0.22, CO = 0.50;
                    const tFanEnd = FAN;
                    const tFlipStart = FAN + W1;
                    const tFlipEnd = tFlipStart + 5 * D + DUR;
                    const tCoverStart = tFlipEnd + W2;
                    const tEnd = tCoverStart + CO;
                    if (e < tFanEnd) {
                        const k = smooth(e / FAN);
                        for (let i = 0; i < 7; i++) {
                            fanPivots[i].rotation.z = FAN_FIN[i] * (1 - k);
                        }
                    } else {
                        for (const fp of fanPivots) {
                            fp.visible = false;
                            fp.rotation.z = 0;
                        }
                    }
                    for (let i = 0; i < 6; i++) {
                        const j = 5 - i;
                        const kk = smooth(Math.max(0, Math.min(1, (e - tFlipStart - i * D) / DUR)));
                        flipperPivots[j].rotation.z = 3.05 * (1 - kk);
                        flipperPivots[j].position.y = FLIP_OPEN_Y[j] + (FLIP_CLOSED_Y[j] - FLIP_OPEN_Y[j]) * kk;
                    }
                    if (e >= tCoverStart) {
                        const k2 = smooth(Math.min((e - tCoverStart) / CO, 1));
                        coverPivot.rotation.z = COVER_FIN * (1 - k2);
                        coverPivot.position.y = COVER_Y1 + (COVER_Y0 - COVER_Y1) * k2;
                    }
                    if (e >= tEnd) {
                        coverPivot.rotation.z = 0;
                        coverPivot.position.y = COVER_Y0;
                        for (let i = 0; i < 6; i++) {
                            flipperPivots[i].rotation.z = 0;
                            flipperPivots[i].position.y = FLIP_CLOSED_Y[i];
                        }
                        s.phase = 'closed';
                    }
                }
            }

