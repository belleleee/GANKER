'use strict';
            /* ========================================================== */
            /* 18.5 星象仪 */
            /* ========================================================== */
            let magicOn = false, magicP = 0;
            const GOLD = new THREE.LineBasicMaterial({ color: 0xc9a227 });
            const GOLDL = new THREE.LineBasicMaterial({ color: 0xb8912a });
            const astro = new THREE.Group();
            astro.position.set(1.75, TBL_TOP, -2.72);
            scene.add(astro);
            put(edge(new THREE.CylinderGeometry(0.15, 0.19, 0.09, 10)), 0, 0.045, 0, 0, 0, 0, astro);
            put(edge(new THREE.CylinderGeometry(0.055, 0.085, 0.16, 8)), 0, 0.17, 0, 0, 0, 0, astro);
            put(edge(new THREE.SphereGeometry(0.04, 8, 6)), 0, 0.265, 0, 0, 0, 0, astro);
            const tiltG = new THREE.Group();
            tiltG.position.y = 0.30;
            tiltG.rotation.z = 0.41;
            astro.add(tiltG);
            const spinG = new THREE.Group();
            spinG.position.y = 0.16;
            tiltG.add(spinG);
            put(edge(new THREE.CylinderGeometry(0.011, 0.011, 0.60, 6)), 0, 0, 0, 0, 0, 0, spinG);
            put(edge(new THREE.SphereGeometry(0.062, 10, 8), 1, GOLD), 0, 0, 0, 0, 0, 0, spinG);
            put(edge(new THREE.TorusGeometry(0.27, 0.011, 6, 34), 1, GOLD), 0, 0, 0, 0, 0, Math.PI / 2, spinG);
            put(edge(new THREE.TorusGeometry(0.27, 0.011, 6, 34), 1, GOLD), 0, 0, 0, 0, 0, 0, spinG);
            const innerG = new THREE.Group();
            spinG.add(innerG);
            put(edge(new THREE.TorusGeometry(0.21, 0.009, 6, 28), 1, GOLDL), 0, 0, 0, Math.PI / 3, 0, Math.PI / 4, innerG);
            put(edge(new THREE.TorusGeometry(0.15, 0.008, 6, 24), 1, GOLDL), 0, 0, 0, Math.PI / 2, 0.8, 0, innerG);

            function glowBall(r, op) {
                const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
                m.renderOrder = 9;
                m.userData.maxOp = op;
                spinG.add(m);
                return m;
            }
            const glows = [glowBall(0.10, 0.55), glowBall(0.20, 0.28), glowBall(0.34, 0.12)];
            regMagic(astro, () => { magicOn = !magicOn; });

            /* ========================================================== */
            /* 18.6 二楼夜幕 */
            /* ========================================================== */
            const veilShape = new THREE.Shape();
            veilShape.moveTo(-3.8, 0);
            veilShape.lineTo(3.8, 0);
            veilShape.lineTo(3.8, 1.35);
            veilShape.lineTo(0.0, 3.20);
            veilShape.lineTo(-3.8, 1.35);
            veilShape.closePath();
            const veilGeo = new THREE.ExtrudeGeometry(veilShape, { depth: 7.6, bevelEnabled: false });
            veilGeo.translate(0, 0, -3.8);
            veilGeo.translate(0, FLOOR_TOP, 0);
            const veil = new THREE.Mesh(veilGeo, new THREE.MeshBasicMaterial({ color: 0x5f5480, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
            veil.renderOrder = 4;
            scene.add(veil);

            /* ========================================================== */
            /* 18.7 宇宙星空粒子系统 */
            /* ========================================================== */
            const STAR_COLORS = [0xffffff, 0xbfd8ff, 0xffe9b0, 0xd9c1ff, 0x9fd8ff, 0xc9a2ff, 0x9ffce8, 0xffd166];
            const VIVID_COLORS = [0xff2255, 0x22ee66, 0x00b4ff, 0xffee00, 0xff00cc, 0x00ffe0];
            const magicParts = [];

            function addHalo(parent, color, r, opIn, opOut) {
                const h1 = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
                const h2 = new THREE.Mesh(new THREE.SphereGeometry(r * 1.5, 10, 8), new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
                h1.renderOrder = 7;
                h2.renderOrder = 7;
                parent.add(h1);
                parent.add(h2);
                return { h1: h1, h2: h2, opIn: opIn, opOut: opOut };
            }
            for (let i = 0; i < 96; i++) {
                const typ = i % 6;
                const g = new THREE.Group();
                let cl;
                if (typ === 5) {
                    cl = VIVID_COLORS[i % VIVID_COLORS.length];
                    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: cl })));
                    g.userData.halo = addHalo(g, cl, 0.028, 0.42, 0.14);
                    g.userData.vivid = true;
                } else {
                    cl = STAR_COLORS[i % STAR_COLORS.length];
                    if (typ === 0) {
                        g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.013), new THREE.MeshBasicMaterial({ color: cl })));
                        g.userData.halo = addHalo(g, cl, 0.026, 0.35, 0.12);
                        g.userData.sharp = true;
                    } else if (typ === 1) {
                        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), LITMAT(0xffffff)));
                        const spikeMat = new THREE.LineBasicMaterial({ color: cl, transparent: true, opacity: 0 });
                        const spikeLen = 0.075;
                        g.add(new THREE.LineSegments(
                            new THREE.BufferGeometry().setFromPoints([
                                V(-spikeLen, 0, 0), V(spikeLen, 0, 0),
                                V(0, -spikeLen * 0.7, 0), V(0, spikeLen * 0.7, 0)
                            ]), spikeMat
                        ));
                        g.userData.spikes = spikeMat;
                        g.userData.halo = addHalo(g, cl, 0.040, 0.45, 0.16);
                    } else if (typ === 2) {
                        g.add(new THREE.Mesh(
                            new THREE.SphereGeometry(0.015, 10, 8),
                            new THREE.MeshBasicMaterial({ color: cl, transparent: true, opacity: 0.75 })
                        ));
                        g.userData.halo = addHalo(g, cl, 0.070, 0.30, 0.22);
                        g.userData.nebula = true;
                    } else if (typ === 3) {
                        g.add(new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), LITMAT(0xffffff)));
                        g.userData.tails = [];
                        for (let s = 1; s <= 4; s++) {
                            const tp = new THREE.Mesh(
                                new THREE.SphereGeometry(0.016 * (1 - (s - 1) * 0.16), 6, 5),
                                new THREE.MeshBasicMaterial({ color: cl, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
                            );
                            tp.renderOrder = 7;
                            g.add(tp);
                            g.userData.tails.push({ m: tp, s: s });
                        }
                        g.userData.halo = addHalo(g, cl, 0.036, 0.40, 0.14);
                    } else {
                        g.userData.cluster = [];
                        for (let c = 0; c < 3; c++) {
                            const sg = new THREE.Group();
                            sg.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.009), new THREE.MeshBasicMaterial({ color: c === 0 ? 0xffffff : cl })));
                            g.add(sg);
                            g.userData.cluster.push({ g: sg, ph: c * 2.09 });
                        }
                        g.userData.halo = addHalo(g, cl, 0.042, 0.22, 0.10);
                    }
                }
                g.visible = false;
                const th = Math.random() * 6.28, orbR = 1.0 + Math.random() * 2.6;
                g.userData.p = {
                    cx: Math.cos(th) * orbR * 0.85,
                    cz: Math.sin(th) * orbR,
                    y0: FY + 0.40 + Math.random() * 2.5,
                    ph: Math.random() * 6.28,
                    sp: 0.10 + Math.random() * 0.28,
                    bob: 0.06 + Math.random() * 0.10,
                    rs: (Math.random() - 0.5) * 0.012
                };
                scene.add(g);
                magicParts.push(g);
            }

            /* ========================================================== */
            /* 18.8 小魔女计划板 */
            /* ========================================================== */
            const boardG = new THREE.Group();
            boardG.position.set(-2.9, FY, 2.8);
            boardG.rotation.y = 2.33;
            scene.add(boardG);
            const boardTilt = new THREE.Group();
            boardTilt.rotation.x = -0.09;
            boardG.add(boardTilt);
            const boardCanvas = document.createElement('canvas');
            boardCanvas.width = 512;
            boardCanvas.height = 392;
            const bctx = boardCanvas.getContext('2d');

            function drawBoardFace() {
                bctx.fillStyle = '#2f4136';
                bctx.fillRect(0, 0, 512, 392);
                for (let i = 0; i < 340; i++) {
                    bctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.045).toFixed(3) + ')';
                    bctx.fillRect(Math.random() * 512, Math.random() * 392, 2, 2);
                }
                const chalk = 'rgba(238,244,238,0.88)';
                bctx.fillStyle = chalk;
                bctx.strokeStyle = chalk;
                bctx.font = '34px serif';
                bctx.textAlign = 'center';
                bctx.textBaseline = 'alphabetic';
                bctx.fillText('✦ ✧ ❖ ✧ ✦', 256, 52);
                bctx.lineWidth = 2;
                bctx.beginPath();
                bctx.moveTo(120, 68);
                bctx.lineTo(392, 68);
                bctx.stroke();
                bctx.beginPath();
                bctx.moveTo(150, 76);
                bctx.lineTo(362, 76);
                bctx.stroke();
                bctx.lineWidth = 2.2;
                bctx.beginPath();
                bctx.arc(120, 215, 62, 0, 7);
                bctx.stroke();
                bctx.beginPath();
                bctx.arc(120, 215, 40, 0, 7);
                bctx.stroke();
                bctx.beginPath();
                bctx.moveTo(120, 162);
                bctx.lineTo(167, 246);
                bctx.lineTo(73, 246);
                bctx.closePath();
                bctx.stroke();
                bctx.beginPath();
                bctx.moveTo(120, 268);
                bctx.lineTo(73, 184);
                bctx.lineTo(167, 184);
                bctx.closePath();
                bctx.stroke();
                for (let k = 0; k < 8; k++) {
                    const a = k * Math.PI / 4;
                    bctx.beginPath();
                    bctx.moveTo(120 + Math.cos(a) * 62, 215 + Math.sin(a) * 62);
                    bctx.lineTo(120 + Math.cos(a) * 70, 215 + Math.sin(a) * 70);
                    bctx.stroke();
                }
                bctx.font = '22px serif';
                bctx.fillText('✦', 120, 223);
                bctx.textAlign = 'left';
                bctx.font = '26px serif';
                bctx.fillText('△ + ◯ ⇒ ✦', 245, 130);
                bctx.fillText('∴ ✦ ∝ ☽', 262, 172);
                bctx.fillText('☾ ∝ ✱ ∝ ❍', 248, 214);
                bctx.fillText('⟡ ☽ → ● ⟡', 250, 258);
                bctx.fillText('☽ ◐ ● ◑ ☾', 250, 308);
                bctx.font = '16px serif';
                bctx.fillText('✧', 60, 110);
                bctx.fillText('✦', 440, 100);
                bctx.fillText('✧', 470, 225);
                bctx.fillText('✦', 62, 335);
                bctx.fillText('✧', 310, 350);
                bctx.fillText('❖', 455, 175);

                function sticker(x, y, w, h, col, rot) {
                    bctx.save();
                    bctx.translate(x, y);
                    bctx.rotate(rot);
                    bctx.fillStyle = col;
                    bctx.fillRect(-w / 2, -h / 2, w, h);
                    bctx.strokeStyle = 'rgba(0,0,0,0.35)';
                    bctx.lineWidth = 2;
                    bctx.strokeRect(-w / 2, -h / 2, w, h);
                    bctx.fillStyle = 'rgba(255,255,255,0.45)';
                    bctx.fillRect(-w / 2 - 8, -h / 2 - 6, 16, 10);
                    bctx.restore();
                }
                sticker(455, 335, 46, 34, '#ffd166', 0.3);
                sticker(52, 185, 38, 30, '#ff8fab', -0.35);
                sticker(462, 58, 36, 28, '#8fd6ff', 0.15);
                boardTex.needsUpdate = true;
            }
            const boardTex = new THREE.CanvasTexture(boardCanvas);
            drawBoardFace();
            put(log(1.55, 0.035), -0.56, 0.77, 0.04, 0.05, 0, 0.05, boardTilt);
            put(log(1.55, 0.035), 0.56, 0.77, 0.04, 0.05, 0, -0.05, boardTilt);
            put(log(1.40, 0.035), 0.00, 0.70, -0.32, 0.30, 0, 0, boardTilt);
            put(log(1.10, 0.025), 0.00, 0.45, 0.06, 0, 0, Math.PI / 2, boardTilt);
            put(log(1.10, 0.025), 0.00, 1.30, 0.02, 0, 0, Math.PI / 2, boardTilt);
            put(box(1.27, 1.00, 0.06), 0, 1.00, 0, 0, 0, 0, boardTilt);
            {
                const woodSide = LITMAT(0xe8e2d0);
                const faceMat = new THREE.MeshBasicMaterial({ map: boardTex });
                const faceMesh = new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.86, 0.03), [woodSide, woodSide, woodSide, woodSide, faceMat, woodSide]);
                faceMesh.position.set(0, 1.00, 0.032);
                boardTilt.add(faceMesh);
                const eLines = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.13, 0.86, 0.03)), MAT);
                eLines.position.set(0, 1.00, 0.032);
                boardTilt.add(eLines);
            }
            put(box(1.20, 0.04, 0.14), 0, 0.54, 0.09, 0, 0, 0, boardTilt);
            const notes = [
                { col: '#ffe66d', txt: '采月光草', rz: 0.12, px: -0.40, py: 1.26 },
                { col: '#ffb3c6', txt: '归还魔法书', rz: -0.08, px: -0.05, py: 1.14 },
                { col: '#aecdff', txt: '作者：YIBI2333', rz: 0.18, px: 0.36, py: 0.84 }
            ];
            let noteEditing = 0;
            for (let i = 0; i < notes.length; i++) {
                const n = notes[i];
                n.canvas = document.createElement('canvas');
                n.canvas.width = 128;
                n.canvas.height = 128;
                n.ctx = n.canvas.getContext('2d');
                n.tex = new THREE.CanvasTexture(n.canvas);
                drawNote(i);
                const g = new THREE.Group();
                const sideMat = LITMAT(0xffffff);
                const faceMat = new THREE.MeshBasicMaterial({ map: n.tex });
                g.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.008), [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]));
                g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.17, 0.17, 0.008)), MAT));
                g.position.set(n.px, n.py, 0.052);
                g.rotation.z = n.rz;
                boardTilt.add(g);
                regMagic(g, () => openNoteEditor(i));
            }

            function drawNote(i) {
                const n = notes[i];
                const c = n.ctx;
                c.fillStyle = n.col;
                c.fillRect(0, 0, 128, 128);
                c.fillStyle = 'rgba(0,0,0,0.08)';
                c.fillRect(0, 112, 128, 16);
                c.fillStyle = 'rgba(255,255,255,0.55)';
                c.fillRect(44, 0, 40, 14);
                const len = Math.max(n.txt.length, 1);
                const size = len <= 3 ? 34 : len <= 5 ? 26 : len <= 7 ? 20 : 16;
                c.fillStyle = '#3a3a3a';
                c.font = 'bold ' + size + 'px "Microsoft YaHei", monospace';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText(n.txt, 64, 68);
                n.tex.needsUpdate = true;
            }

            function openNoteEditor(i) {
                noteEditing = i;
                const ed = document.getElementById('noteEditor');
                const inp = document.getElementById('noteInput');
                inp.value = notes[i].txt;
                ed.classList.add('show');
                inp.focus();
                inp.select();
            }
            let eraserOpen = false, eraserT = 0;
            const eraserG = new THREE.Group();
            eraserG.position.set(-0.30, 0.585, 0.09);
            boardTilt.add(eraserG);
            put(box(0.18, 0.05, 0.08), 0, 0, 0, 0, 0, 0, eraserG);
            put(iline([[-0.08, 0.028, -0.035], [-0.08, 0.028, 0.035]]), 0, 0, 0, 0, 0, 0, eraserG);
            regMagic(eraserG, () => { eraserOpen = !eraserOpen; });
            const GLYPHS = ['✦', '☾', '✧', '∴', '⟡', '✱', '☽', '✸'];
            const GLYPH_WARM = ['#fff3c9', '#ffd97a'];
            const GLYPH_COOL = ['#d9fbff', '#8ff3ff'];
            const glyphCanvas = document.createElement('canvas');
            glyphCanvas.width = 512;
            glyphCanvas.height = 200;
            const gctx = glyphCanvas.getContext('2d');
            const glyphTex = new THREE.CanvasTexture(glyphCanvas);
            const glyphPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), new THREE.MeshBasicMaterial({ map: glyphTex, transparent: true, opacity: 0, depthWrite: false }));
            glyphPlane.position.set(0, 0.95, 0.056);
            glyphPlane.renderOrder = 10;
            boardTilt.add(glyphPlane);

            function drawGlyphSet(curIdx, prog) {
                gctx.clearRect(0, 0, 512, 200);
                for (let i = 0; i < GLYPHS.length; i++) {
                    const gx = 40 + i * 62;
                    const gy = 100 + Math.sin(i * 1.3) * 14;
                    const warm = i % 2 === 1;
                    const col = warm ? GLYPH_WARM[0] : GLYPH_COOL[0];
                    const tr0 = warm ? 'rgba(255,243,201,0)' : 'rgba(217,251,255,0)';
                    gctx.save();
                    gctx.shadowColor = warm ? GLYPH_WARM[1] : GLYPH_COOL[1];
                    gctx.shadowBlur = 22;
                    gctx.font = 'bold 64px serif';
                    gctx.textAlign = 'center';
                    gctx.textBaseline = 'middle';
                    if (i < curIdx) {
                        gctx.fillStyle = col;
                        gctx.fillText(GLYPHS[i], gx, gy);
                    } else if (i === curIdx) {
                        const p = Math.max(0, Math.min(1, prog));
                        const top = gy - 38, bot = gy + 38;
                        const grad = gctx.createLinearGradient(0, top, 0, bot);
                        const wipe = top + (bot - top) * p;
                        const g0 = Math.max(0, (wipe - top) / (bot - top));
                        grad.addColorStop(0, col);
                        grad.addColorStop(Math.max(0.001, g0 - 0.02), col);
                        grad.addColorStop(Math.min(0.999, g0 + 0.02), tr0);
                        grad.addColorStop(1, tr0);
                        gctx.fillStyle = grad;
                        gctx.fillText(GLYPHS[i], gx, gy);
                    }
                    gctx.restore();
                }
                glyphTex.needsUpdate = true;
            }
            drawGlyphSet(0, 0);
            const chalkG = new THREE.Group();
            const CHALK_HOME = V(0.18, 0.578, 0.09);
            chalkG.position.copy(CHALK_HOME);
            boardTilt.add(chalkG);
            put(edge(new THREE.CylinderGeometry(0.013, 0.013, 0.11, 8)), 0, 0, 0, 0, 0, Math.PI / 2, chalkG);
            put(edge(new THREE.CircleGeometry(0.011, 8)), 0.056, 0, 0, 0, Math.PI / 2, 0, chalkG);
            const chalkState = { active: false, start: 0 };
            const glyphLocalX = i => ((40 + i * 62) / 512 - 0.5) * 1.0;
            const glyphLocalY = i => 0.95 - (Math.sin(i * 1.3) * 14) / 200 * 0.4;
            const smooth = k => k * k * (3 - 2 * k);
            regMagic(chalkG, () => {
                if (!chalkState.active) {
                    chalkState.active = true;
                    chalkState.start = performance.now() * 0.001;
                }
            });

            function updateChalk(time) {
                if (!chalkState.active) return;
                const RISE = 0.7, WPS = 0.55, HOLD = 1.8, FADE = 0.8, FALL = 0.7;
                const N = GLYPHS.length;
                const tWrite = RISE + N * WPS;
                const tHold = tWrite + HOLD;
                const tFade = tHold + FADE;
                const tEnd = tFade + FALL;
                const e = time - chalkState.start;
                if (e < RISE) {
                    const k = smooth(e / RISE);
                    const i = 0;
                    chalkG.position.lerpVectors(CHALK_HOME, V(glyphLocalX(i) + 0.06, glyphLocalY(i) + 0.05, 0.10), k);
                    chalkG.position.y += Math.sin(e * 10) * 0.02 * k;
                    glyphPlane.material.opacity = 0;
                } else if (e < tWrite) {
                    const k = (e - RISE) / WPS;
                    const i = Math.min(Math.floor(k), N - 1);
                    const prog = k - i;
                    drawGlyphSet(i, prog);
                    glyphPlane.material.opacity = Math.min(1, (e - RISE) * 3);
                    const revealY = glyphLocalY(i) + (prog - 0.5) * 0.15;
                    chalkG.position.set(
                        glyphLocalX(i) + 0.06 + Math.sin(time * 26) * 0.012,
                        Math.min(glyphLocalY(i) + 0.05, revealY + 0.03) + Math.sin(time * 19) * 0.008, 0.10
                    );
                } else if (e < tHold) {
                    drawGlyphSet(N, 1);
                    glyphPlane.material.opacity = 0.75 + 0.25 * Math.sin(time * 4);
                    const i = N - 1;
                    chalkG.position.set(glyphLocalX(i) + 0.06, glyphLocalY(i) + 0.05, 0.10);
                } else if (e < tFade) {
                    glyphPlane.material.opacity = Math.max(0, 1 - (e - tHold) / FADE);
                    const i = N - 1;
                    chalkG.position.set(glyphLocalX(i) + 0.06, glyphLocalY(i) + 0.05, 0.10);
                } else if (e < tEnd) {
                    const k = smooth((e - tFade) / FALL);
                    glyphPlane.material.opacity = 0;
                    chalkG.position.lerpVectors(V(glyphLocalX(N - 1) + 0.06, glyphLocalY(N - 1) + 0.05, 0.10), CHALK_HOME, k);
                } else {
                    chalkState.active = false;
                    glyphPlane.material.opacity = 0;
                    drawGlyphSet(0, 0);
                    chalkG.position.copy(CHALK_HOME);
                }
            }
            const SCROLL_R = 0.055;

            function scrollRoll(x, z, ry, y) {
                const s = new THREE.Group();
                const body = edge(new THREE.CylinderGeometry(SCROLL_R, SCROLL_R, 0.52, 10));
                body.rotation.z = Math.PI / 2;
                s.add(body);
                for (const ex of [-0.26, 0.26]) {
                    const c = edge(new THREE.CircleGeometry(SCROLL_R * 0.9, 10), 1, IN_MAT);
                    c.position.x = ex;
                    c.rotation.y = Math.sign(ex) * Math.PI / 2;
                    s.add(c);
                }
                const band = edge(new THREE.TorusGeometry(SCROLL_R + 0.003, 0.012, 6, 16));
                band.rotation.y = Math.PI / 2;
                band.position.x = 0.10;
                s.add(band);
                s.position.set(x, y !== undefined ? y : FY + SCROLL_R, z);
                s.rotation.y = ry;
                scene.add(s);
            }
            scrollRoll(-3.42, 3.28, 0.42);
            scrollRoll(-3.44, 3.50, 0.42);
            scrollRoll(-3.43, 3.39, 0.42, FY + SCROLL_R * (1 + Math.sqrt(3)));
            scrollRoll(-3.72, 3.02, 1.05);

            /* ========================================================== */
            /* 18.9 左墙中央的魔法杖 */
            /* ========================================================== */
            const WAND_Y = FY + 1.18;
            const WAND_Z = 0;
            const HOOK_X = -3.72;
            const WAND_REST = V(HOOK_X, WAND_Y - 0.012, WAND_Z);
            const WAND_HOVER = V(-2.95, FY + 1.60, -0.10);
            const CAST_POS = V(-0.60, FY + 1.50, 0.15);
            const wandWoodMat = LITMAT(0xcaa273, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
            const wandDarkMat = LITMAT(0x8a6238, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
            const wandEdgeMat = new THREE.LineBasicMaterial({ color: 0x5a4128 });

            function woodPart(g, mat) {
                const grp = new THREE.Group();
                grp.add(new THREE.Mesh(g, mat || wandWoodMat));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), wandEdgeMat));
                return grp;
            }
            const hookArcPts = [];
            for (let k = 0; k <= 22; k++) {
                const a = Math.PI * 0.75 + k / 22 * Math.PI * 1.5;
                hookArcPts.push(V(Math.cos(a) * 0.058, Math.sin(a) * 0.058, 0));
            }
            for (const hz of [WAND_Z - 0.30, WAND_Z + 0.30]) {
                put(box(0.03, 0.18, 0.08), -3.865, WAND_Y, hz);
                put(log(0.15, 0.013), -3.79, WAND_Y, hz, 0, 0, Math.PI / 2);
                const hook = woodPart(new THREE.TorusGeometry(0.058, 0.011, 6, 16, Math.PI * 1.5), wandDarkMat);
                hook.position.set(HOOK_X, WAND_Y, hz);
                hook.rotation.z = Math.PI * 0.75;
                scene.add(hook);
                const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(hookArcPts), wandEdgeMat);
                outline.position.set(HOOK_X, WAND_Y, hz);
                scene.add(outline);
            }
            const wandG = new THREE.Group();
            wandG.position.copy(WAND_REST);
            scene.add(wandG);
            {
                const main = woodPart(new THREE.CylinderGeometry(0.014, 0.022, 0.72, 10));
                main.rotation.x = Math.PI / 2;
                main.position.z = 0.00;
                wandG.add(main);
                const tip = woodPart(new THREE.CylinderGeometry(0.008, 0.014, 0.30, 10));
                tip.rotation.x = Math.PI / 2;
                tip.position.z = 0.51;
                wandG.add(tip);
                const knob = woodPart(new THREE.SphereGeometry(0.034, 10, 8), wandDarkMat);
                knob.position.z = -0.40;
                wandG.add(knob);
                const guard = woodPart(new THREE.TorusGeometry(0.030, 0.008, 6, 14), wandDarkMat);
                guard.position.z = -0.28;
                wandG.add(guard);
            }
            const crystalG = new THREE.Group();
            crystalG.position.set(0, 0, 0.78);
            wandG.add(crystalG);
            const cryGeo = new THREE.OctahedronGeometry(0.055);
            cryGeo.scale(0.8, 0.8, 1.9);
            const crystalMat = new THREE.MeshBasicMaterial({ color: 0xd8dce0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
            crystalG.add(new THREE.Mesh(cryGeo, crystalMat));
            crystalG.add(new THREE.LineSegments(new THREE.EdgesGeometry(cryGeo, 1), new THREE.LineBasicMaterial({ color: 0x8a9096 })));
            const cryCore = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
            crystalG.add(cryCore);

            function wandGlowSphere(r, op) {
                const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({ color: 0xd8dce0, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
                m.scale.set(0.8, 0.8, 1.5);
                m.renderOrder = 9;
                crystalG.add(m);
                return m;
            }
            const wGlow1 = wandGlowSphere(0.070, 0.15);
            const wGlow2 = wandGlowSphere(0.13, 0.05);
            const ELEMENTS = [
                { nm: 'fire', col: 0xff5a2a, glow: 0xff9a4a },
                { nm: 'water', col: 0x3c8aff, glow: 0x8fd4ff },
                { nm: 'ice', col: 0xaef0ff, glow: 0xe8fcff },
                { nm: 'earth', col: 0xc08a4a, glow: 0xe0b070 },
                { nm: 'bolt', col: 0xffe94a, glow: 0xfff8a0 },
                { nm: 'wind', col: 0x7dffb8, glow: 0xd0ffe4 }
            ];
            const loopLine = (pts, m) => new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), m);
            const openLine = (pts, m) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), m);

            function ringPts2(r, n) {
                const a = [];
                for (let i = 0; i < n; i++) {
                    const t = i / n * Math.PI * 2;
                    a.push(V(Math.cos(t) * r, Math.sin(t) * r, 0));
                }
                return a;
            }

            function polyPts2(r, k, rot) {
                const a = [];
                for (let i = 0; i < k; i++) {
                    const t = rot + i / k * Math.PI * 2;
                    a.push(V(Math.cos(t) * r, Math.sin(t) * r, 0));
                }
                return a;
            }

            function starPts2(rO, rI, k, rot) {
                const a = [];
                for (let i = 0; i < k * 2; i++) {
                    const t = rot + i / (k * 2) * Math.PI * 2;
                    const r = i % 2 === 0 ? rO : rI;
                    a.push(V(Math.cos(t) * r, Math.sin(t) * r, 0));
                }
                return a;
            }

            function spiralPts2(rMax, turns, n, rot) {
                const a = [];
                for (let i = 0; i <= n; i++) {
                    const t = i / n;
                    const ang = rot + t * turns * Math.PI * 2;
                    a.push(V(Math.cos(ang) * t * rMax, Math.sin(ang) * t * rMax, 0));
                }
                return a;
            }

            function buildMagicCircle(el, idx) {
                const g = new THREE.Group();
                const m1 = new THREE.LineBasicMaterial({ color: el.col, transparent: true, opacity: 0.95 });
                const m2 = new THREE.LineBasicMaterial({ color: el.glow, transparent: true, opacity: 0.55 });
                m1.userData.op = 0.95;
                m2.userData.op = 0.55;
                g.add(loopLine(ringPts2(0.50, 56), m1));
                g.add(loopLine(ringPts2(0.44, 56), m2));
                g.add(loopLine(ringPts2(0.30, 48), m2));
                const tick = [];
                for (let i = 0; i < 24; i++) {
                    const a = i / 24 * Math.PI * 2;
                    tick.push(
                        V(Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0),
                        V(Math.cos(a) * 0.50, Math.sin(a) * 0.50, 0)
                    );
                }
                g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tick), m2));
                if (idx === 0) {
                    g.add(loopLine(polyPts2(0.36, 3, -Math.PI / 2), m1));
                    g.add(loopLine(polyPts2(0.20, 3, Math.PI / 2), m2));
                } else if (idx === 1) {
                    g.add(loopLine(polyPts2(0.36, 6, 0), m1));
                    g.add(loopLine(ringPts2(0.18, 32), m1));
                } else if (idx === 2) {
                    g.add(loopLine(polyPts2(0.36, 3, 0), m1));
                    g.add(loopLine(polyPts2(0.36, 3, Math.PI), m1));
                } else if (idx === 3) {
                    g.add(loopLine(polyPts2(0.34, 4, Math.PI / 4), m1));
                    g.add(loopLine(polyPts2(0.34, 4, 0), m2));
                } else if (idx === 4) {
                    g.add(loopLine(starPts2(0.38, 0.15, 5, -Math.PI / 2), m1));
                } else {
                    g.add(openLine(spiralPts2(0.40, 2.2, 90, 0), m1));
                    g.add(openLine(spiralPts2(0.40, 2.2, 90, Math.PI), m2));
                }
                g.userData.mats = [m1, m2];
                return g;
            }

            function hash01(s) {
                let h = 0;
                for (let i = 0; i < s.length; i++) {
                    h = (h * 31 + s.charCodeAt(i)) % 997;
                }
                return h / 997;
            }

            function jitterGeo(geo, amp) {
                const pa = geo.attributes.position;
                for (let i = 0; i < pa.count; i++) {
                    const k = pa.getX(i).toFixed(3) + ',' + pa.getY(i).toFixed(3) + ',' + pa.getZ(i).toFixed(3);
                    pa.setXYZ(i,
                        pa.getX(i) + (hash01(k + 'x') - 0.5) * 2 * amp,
                        pa.getY(i) + (hash01(k + 'y') - 0.5) * 2 * amp,
                        pa.getZ(i) + (hash01(k + 'z') - 0.5) * 2 * amp
                    );
                }
                geo.computeVertexNormals();
                return geo;
            }

            function makeSolidFlame(h, w, color, phase, speed) {
                const K = 20;
                const geom = new THREE.BufferGeometry();
                const pos = new Float32Array((K + 1) * 2 * 3);
                geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                const idx = [];
                for (let k = 0; k < K; k++) {
                    const a = k * 2, b = k * 2 + 1, c = k * 2 + 2, d = k * 2 + 3;
                    idx.push(a, b, c, b, d, c);
                }
                geom.setIndex(idx);
                const mat = new THREE.MeshBasicMaterial({ color: color, depthWrite: false, side: THREE.DoubleSide });
                const grp = new THREE.Group();
                for (let i = 0; i < 3; i++) {
                    const mesh = new THREE.Mesh(geom, mat);
                    mesh.rotation.y = i * Math.PI / 3;
                    mesh.frustumCulled = false;
                    grp.add(mesh);
                }
                const f = { mesh: grp, geom: geom, h: h, w: w, phase: phase, speed: speed, K: K };
                f.update = time => {
                    const p = pos;
                    let i = 0;
                    for (let k = 0; k <= K; k++) {
                        const t = k / K;
                        const ww = w * Math.sin(Math.PI * (0.16 + 0.84 * t));
                        const wob = Math.sin(t * 5.2 - time * speed + phase) * 0.03 * t;
                        const y = -0.14 + t * h;
                        p[i++] = wob + ww;
                        p[i++] = y;
                        p[i++] = 0;
                        p[i++] = wob - ww;
                        p[i++] = y;
                        p[i++] = 0;
                    }
                    geom.attributes.position.needsUpdate = true;
                };
                return f;
            }

            function buildCreation(idx, el) {
                const g = new THREE.Group();
                const A = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
                if (idx === 0) {
                    const fOut = makeSolidFlame(0.46, 0.115, 0xc23c10, 0.0, 2.6);
                    const fMid = makeSolidFlame(0.36, 0.080, 0xff7a1a, 2.3, 3.1);
                    const fIn = makeSolidFlame(0.24, 0.045, 0xffd868, 4.1, 3.6);
                    g.add(fOut.mesh);
                    g.add(fMid.mesh);
                    g.add(fIn.mesh);
                    const embers = [];
                    for (let i = 0; i < 9; i++) {
                        const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.014), A(0xff8c3a, 0.9));
                        e.userData.ph = i / 9;
                        e.userData.rd = Math.random() * 0.09;
                        g.add(e);
                        embers.push(e);
                    }
                    g.userData.update = time => {
                        fOut.update(time);
                        fMid.update(time);
                        fIn.update(time);
                        for (const e of embers) {
                            const p = (time * 0.85 + e.userData.ph) % 1;
                            const a = e.userData.ph * 6.28;
                            e.position.set(
                                Math.cos(a) * e.userData.rd * (1 - p),
                                -0.08 + p * 0.48,
                                Math.sin(a) * e.userData.rd * (1 - p)
                            );
                            const s = (1 - p) * 0.9 + 0.12;
                            e.scale.set(s, s, s);
                        }
                    };
                } else if (idx === 1) {
                    const wOuter = new THREE.MeshBasicMaterial({ color: 0x2f7fe8, transparent: true, opacity: 0.55 });
                    const wInner = new THREE.MeshBasicMaterial({ color: 0x9cc4ec, transparent: true, opacity: 0.60 });
                    const main = new THREE.Group();
                    main.add(new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 12), wOuter));
                    main.add(new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), wInner));
                    g.add(main);
                    const hi1 = new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
                    hi1.position.set(-0.038, 0.042, 0.052);
                    g.add(hi1);
                    const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
                    hi2.position.set(-0.018, 0.085, 0.030);
                    g.add(hi2);
                    const drops = [];
                    for (let i = 0; i < 6; i++) {
                        const d = new THREE.Group();
                        d.add(new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), wOuter));
                        d.add(new THREE.Mesh(new THREE.SphereGeometry(0.020, 8, 6), wInner));
                        const dh = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
                        dh.position.set(-0.010, 0.011, 0.014);
                        d.add(dh);
                        d.userData.ph = i / 6;
                        g.add(d);
                        drops.push(d);
                    }
                    g.userData.update = time => {
                        const sq = 0.05 * Math.sin(time * 3.2);
                        main.scale.set(1 - sq, 1 + sq, 1 - sq);
                        main.rotation.y += 0.012;
                        const hs = 1 - sq * 0.5;
                        hi1.scale.set(hs, hs, hs);
                        hi2.scale.set(hs, hs, hs);
                        for (const d of drops) {
                            const a = time * 1.5 + d.userData.ph * 6.28;
                            const wob = 0.20 + 0.03 * Math.sin(time * 2 + d.userData.ph * 9);
                            d.position.set(Math.cos(a) * wob, Math.sin(a * 2 + d.userData.ph) * 0.09, Math.sin(a) * wob);
                            d.scale.setScalar(0.85 + 0.3 * Math.abs(Math.sin(a * 2)));
                        }
                    };
                } else if (idx === 2) {
                    function iceShard(r, h, tilt) {
                        const sg = new THREE.Group();
                        const mat = new THREE.MeshBasicMaterial({ color: 0xc8f4ff, transparent: true, opacity: 0.72, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                        const eMat = new THREE.LineBasicMaterial({ color: 0xeafcff, transparent: true, opacity: 0.85 });
                        const bodyG = new THREE.CylinderGeometry(r, r, h, 6);
                        sg.add(new THREE.Mesh(bodyG, mat));
                        sg.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyG, 20), eMat));
                        const capG = new THREE.ConeGeometry(r, r * 1.6, 6);
                        const cap = new THREE.Mesh(capG, mat);
                        cap.position.y = h / 2 + r * 0.8;
                        sg.add(cap);
                        const capEdge = new THREE.LineSegments(new THREE.EdgesGeometry(capG, 20), eMat);
                        capEdge.position.y = h / 2 + r * 0.8;
                        sg.add(capEdge);
                        const botG = new THREE.ConeGeometry(r, r * 1.0, 6);
                        const bot = new THREE.Mesh(botG, mat);
                        bot.position.y = -h / 2 - r * 0.5;
                        bot.rotation.z = Math.PI;
                        sg.add(bot);
                        const botEdge = new THREE.LineSegments(new THREE.EdgesGeometry(botG, 20), eMat);
                        botEdge.position.y = -h / 2 - r * 0.5;
                        botEdge.rotation.z = Math.PI;
                        sg.add(botEdge);
                        if (tilt) {
                            sg.rotation.z = tilt[0];
                            sg.rotation.x = tilt[1];
                        }
                        return sg;
                    }
                    const main = iceShard(0.052, 0.24);
                    g.add(main);
                    const subs = [];
                    for (let i = 0; i < 4; i++) {
                        const a = i / 4 * Math.PI * 2 + 0.5;
                        const s = iceShard(0.026, 0.13 + (i % 2) * 0.05, [Math.cos(a) * 0.55, Math.sin(a) * 0.55]);
                        s.position.set(Math.cos(a) * 0.10, -0.06, Math.sin(a) * 0.10);
                        g.add(s);
                        subs.push(s);
                    }
                    const sparkles = [];
                    for (let i = 0; i < 5; i++) {
                        const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.011), A(0xffffff, 0.9));
                        sp.userData.ph = i / 5;
                        g.add(sp);
                        sparkles.push(sp);
                    }
                    g.userData.update = time => {
                        g.rotation.y += 0.008;
                        for (const s of subs) s.rotation.y += 0.02;
                        for (const sp of sparkles) {
                            const a = time * 0.6 + sp.userData.ph * 6.28;
                            sp.position.set(Math.cos(a) * 0.19, 0.05 + Math.sin(a * 1.7) * 0.10, Math.sin(a) * 0.19);
                            sp.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(time * 5 + sp.userData.ph * 8));
                            const k = 0.7 + 0.5 * Math.abs(Math.sin(time * 4 + sp.userData.ph * 7));
                            sp.scale.set(k, k, k);
                        }
                    };
                } else if (idx === 3) {
                    const rockMat = LITMAT(0x9a6c3c, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
                    const rockEdgeMat = new THREE.LineBasicMaterial({ color: 0x5a3c1e, transparent: true, opacity: 0.8 });

                    function makeRock(r, amp) {
                        const rg = jitterGeo(new THREE.IcosahedronGeometry(r, 0), amp);
                        const rm = new THREE.Mesh(rg, rockMat);
                        rm.add(new THREE.LineSegments(new THREE.EdgesGeometry(rg, 5), rockEdgeMat));
                        return rm;
                    }
                    const rock = makeRock(0.13, 0.03);
                    g.add(rock);
                    const rocks = [];
                    for (let i = 0; i < 4; i++) {
                        const r = makeRock(0.045, 0.014);
                        r.userData.ph = i / 4;
                        g.add(r);
                        rocks.push(r);
                    }
                    g.userData.update = time => {
                        rock.rotation.y += 0.010;
                        rock.rotation.x += 0.004;
                        for (const r of rocks) {
                            const a = time * 0.5 + r.userData.ph * 6.28;
                            r.position.set(Math.cos(a) * 0.23, Math.sin(a * 2 + r.userData.ph) * 0.07, Math.sin(a) * 0.23);
                            r.rotation.x += 0.02;
                            r.rotation.y += 0.015;
                        }
                    };
                } else if (idx === 4) {
                    const core = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), A(0xffe94a, 0.95));
                    const glow1 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), A(0xfff8a0, 0.30));
                    const glow2 = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), A(0xffe94a, 0.12));
                    g.add(core);
                    g.add(glow1);
                    g.add(glow2);
                    const boltMatW = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
                    const boltMatY = new THREE.LineBasicMaterial({ color: 0xffe94a, transparent: true, opacity: 0.70 });
                    const bolts = [];
                    const NB = 5;
                    for (let i = 0; i < NB; i++) {
                        const lw = new THREE.Line(new THREE.BufferGeometry(), boltMatW);
                        const ly = new THREE.Line(new THREE.BufferGeometry(), boltMatY);
                        g.add(lw);
                        g.add(ly);
                        bolts.push({ w: lw, y: ly });
                    }

                    function genBolt(pair) {
                        const th = Math.random() * Math.PI * 2;
                        const ph = Math.acos(2 * Math.random() - 1);
                        const dir = V(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
                        const len = 0.20 + Math.random() * 0.12;
                        const pts = [dir.clone().multiplyScalar(0.05)];
                        const nSeg = 5;
                        for (let k = 1; k <= nSeg; k++) {
                            const t = k / nSeg;
                            const jitter = 0.05 * (1 - t * 0.5);
                            const p = dir.clone().multiplyScalar(0.05 + t * len);
                            p.x += (Math.random() - 0.5) * jitter * 2;
                            p.y += (Math.random() - 0.5) * jitter * 2;
                            p.z += (Math.random() - 0.5) * jitter * 2;
                            pts.push(p);
                        }
                        pair.w.geometry.dispose();
                        pair.w.geometry = new THREE.BufferGeometry().setFromPoints(pts);
                        pair.y.geometry.dispose();
                        pair.y.geometry = new THREE.BufferGeometry().setFromPoints(pts.map(p => p.clone().multiplyScalar(0.86)));
                    }
                    for (const b of bolts) genBolt(b);
                    let last = 0;
                    g.userData.update = time => {
                        if (time - last > 0.15) {
                            last = time;
                            for (const b of bolts) genBolt(b);
                        }
                        const f = Math.abs(Math.sin(time * 22));
                        core.scale.setScalar(1 + 0.15 * f);
                        glow1.material.opacity = 0.18 + 0.20 * f;
                        glow2.material.opacity = 0.07 + 0.08 * f;
                        boltMatW.opacity = 0.45 + 0.55 * f;
                        boltMatY.opacity = 0.35 + 0.45 * Math.abs(Math.sin(time * 22 + 1.1));
                    };
                } else {
                    const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), A(0xbfffe0, 0.4));
                    g.add(coreGlow);
                    const ribbons = [];
                    for (let i = 0; i < 3; i++) {
                        const pts = [];
                        for (let k = 0; k <= 40; k++) {
                            const t = k / 40;
                            const a = t * Math.PI * 2 * 1.6 + i * 2.09;
                            const r = 0.05 + t * 0.17;
                            pts.push(V(Math.cos(a) * r, -0.09 + t * 0.18, Math.sin(a) * r));
                        }
                        const rb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.007, 5), A(i % 2 ? 0x7dffb8 : 0xd0ffe4, 0.8));
                        g.add(rb);
                        ribbons.push(rb);
                    }
                    const slashes = [];
                    for (let i = 0; i < 2; i++) {
                        const s = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.008, 6, 20, Math.PI * 0.65), A(0xa8ffce, 0.85));
                        s.rotation.set(1.2 + i * 0.5, i * 1.8, i * 0.9);
                        g.add(s);
                        slashes.push(s);
                    }
                    const rings = [];
                    for (let i = 0; i < 3; i++) {
                        const r = loopLine(ringPts2(0.14, 40), new THREE.LineBasicMaterial({ color: el.glow, transparent: true, opacity: 0.8 }));
                        r.rotation.x = Math.PI / 2;
                        r.userData.ph = i / 3;
                        g.add(r);
                        rings.push(r);
                    }
                    g.userData.update = time => {
                        g.rotation.y += 0.03;
                        for (let i = 0; i < ribbons.length; i++) {
                            ribbons[i].rotation.y = time * (0.9 + i * 0.2) * (i % 2 ? -1 : 1);
                        }
                        for (let i = 0; i < slashes.length; i++) {
                            slashes[i].rotation.z += 0.09;
                            slashes[i].rotation.y = time * 1.2 * (i % 2 ? -1 : 1);
                        }
                        for (const r of rings) {
                            const p = (time * 0.8 + r.userData.ph) % 1;
                            const sc = 0.4 + p * 1.9;
                            r.scale.set(sc, sc, sc);
                            r.material.opacity = 0.85 * (1 - p);
                            r.position.y = Math.sin(p * Math.PI) * 0.12;
                        }
                    };
                }
                return g;
            }
            const wandState = { phase: 'idle', t0: 0, idx: 0, el: null, circleHolder: null, circleSpin: null, crea: null, dir: new THREE.Vector3(1, 0, 0) };
            const crystalColor = new THREE.Color(0xd8dce0);
            const crystalTarget = new THREE.Color(0xd8dce0);
            const IDENTITY_Q = new THREE.Quaternion();
            const aimQ = new THREE.Quaternion();
            {
                const m = new THREE.Matrix4().lookAt(CAST_POS, WAND_HOVER, V(0, 1, 0));
                aimQ.setFromRotationMatrix(m);
            }
            regMagic(wandG, () => {
                if (wandState.phase !== 'idle') return;
                wandState.idx = Math.floor(Math.random() * ELEMENTS.length);
                wandState.el = ELEMENTS[wandState.idx];
                wandState.phase = 'fly';
                wandState.t0 = performance.now() * 0.001;
            });

            function clearCast() {
                if (wandState.circleHolder) {
                    scene.remove(wandState.circleHolder);
                    wandState.circleHolder = null;
                    wandState.circleSpin = null;
                }
                if (wandState.crea) {
                    scene.remove(wandState.crea);
                    wandState.crea = null;
                }
            }

            function updateWand2(time) {
                crystalG.position.z = 0.78 + Math.sin(time * 2) * 0.02;
                crystalG.rotation.z += 0.025;
                crystalColor.lerp(crystalTarget, 0.08);
                crystalMat.color.copy(crystalColor);
                wGlow1.material.color.copy(crystalColor);
                wGlow2.material.color.copy(crystalColor);
                const FLY = 0.8, GROW = 0.5, HOLD = 2.3, FADE = 0.6, RET = 0.8;
                const s = wandState;
                const e = time - s.t0;
                if (s.phase === 'idle') {
                    wGlow1.material.opacity = 0.13 + 0.04 * Math.sin(time * 1.6);
                    wGlow2.material.opacity = 0.04 + 0.02 * Math.sin(time * 1.6);
                    cryCore.material.opacity = 0.55 + 0.10 * Math.sin(time * 1.6);
                    return;
                }
                if (s.phase === 'fly') {
                    const k = smooth(Math.min(e / FLY, 1));
                    wandG.position.lerpVectors(WAND_REST, WAND_HOVER, k);
                    wandG.position.y += Math.sin(k * Math.PI) * 0.10;
                    wandG.quaternion.slerp(aimQ, 0.06);
                    crystalTarget.set(s.el.col);
                    wGlow1.material.opacity = 0.20 + 0.20 * k;
                    wGlow2.material.opacity = 0.06 + 0.08 * k;
                    cryCore.material.opacity = 0.65 + 0.25 * k;
                    if (e >= FLY) {
                        s.phase = 'cast';
                        s.t0 = time;
                        wandG.quaternion.copy(aimQ);
                        s.dir.copy(CAST_POS).sub(WAND_HOVER).normalize();
                        s.circleSpin = buildMagicCircle(s.el, s.idx);
                        s.circleSpin.scale.setScalar(0.01);
                        s.circleHolder = new THREE.Group();
                        s.circleHolder.position.copy(CAST_POS);
                        s.circleHolder.quaternion.copy(aimQ);
                        s.circleHolder.add(s.circleSpin);
                        scene.add(s.circleHolder);
                        s.crea = buildCreation(s.idx, s.el);
                        s.crea.position.copy(CAST_POS).addScaledVector(s.dir, 0.42);
                        s.crea.scale.setScalar(0.01);
                        scene.add(s.crea);
                    }
                } else if (s.phase === 'cast') {
                    const gk = smooth(Math.min(e / GROW, 1));
                    s.circleSpin.scale.setScalar(0.01 + gk * 0.99);
                    s.circleSpin.rotation.z += 0.025;
                    s.crea.scale.setScalar(Math.max(0.01, gk));
                    if (s.crea.userData.update) s.crea.userData.update(time);
                    wandG.position.copy(WAND_HOVER);
                    wandG.position.y += Math.sin(time * 3) * 0.008;
                    wGlow1.material.opacity = 0.42 + 0.14 * Math.sin(time * 4);
                    wGlow2.material.opacity = 0.16 + 0.06 * Math.sin(time * 4);
                    if (e >= GROW + HOLD) {
                        s.phase = 'fade';
                        s.t0 = time;
                    }
                } else if (s.phase === 'fade') {
                    const k = Math.min(e / FADE, 1);
                    for (const m of s.circleSpin.userData.mats) m.opacity = m.userData.op * (1 - k);
                    s.circleSpin.rotation.z += 0.05;
                    s.crea.scale.setScalar(Math.max(0.01, 1 - k));
                    if (s.crea.userData.update) s.crea.userData.update(time);
                    wGlow1.material.opacity = 0.40 * (1 - k);
                    wGlow2.material.opacity = 0.15 * (1 - k);
                    if (e >= FADE) {
                        clearCast();
                        crystalTarget.set(0xd8dce0);
                        s.phase = 'return';
                        s.t0 = time;
                    }
                } else if (s.phase === 'return') {
                    const k = smooth(Math.min(e / RET, 1));
                    wandG.position.lerpVectors(WAND_HOVER, WAND_REST, k);
                    wandG.position.y += Math.sin(k * Math.PI) * 0.10;
                    wandG.quaternion.slerp(IDENTITY_Q, 0.07);
                    if (e >= RET) {
                        wandG.position.copy(WAND_REST);
                        wandG.quaternion.copy(IDENTITY_Q);
                        s.phase = 'idle';
                    }
                }
            }

