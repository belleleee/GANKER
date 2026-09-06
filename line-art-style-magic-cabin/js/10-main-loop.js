'use strict';
            let lastT = 0;
            let ptLantern = 1, ptKot = 1, ptMc = 0, ptCb = 0, ptPlant = 0;
            function animate(t) {
                requestAnimationFrame(animate);
                const time = t * 0.001; const dt = Math.min(time - lastT, 0.05); lastT = time;
                if (window.APP_SHELL_BLOCK_GAME) {
                    renderer.render(scene, camera);
                    return;
                }
                updateSprings(); updatePlayer(dt, time); updateWeatherSystem(dt, time); updateInteractHint();
                updateWand(dt, time);
                updateBlast(dt, time);
                
                FILL.uniforms.uTime.value = time;
                FILL.uniforms.uFireStrength.value = fireP;

                if (ffOpacity > 0.01) {
                    for (let i = 0; i < FF_N; i++) {
                        const f = fireflies[i];
                        ffPos[i * 3] = f.bx + Math.sin(time * f.sp + f.ph) * f.amp;
                        ffPos[i * 3 + 1] = f.by + Math.sin(time * f.sp * 0.8 + f.ph * 1.3) * 0.32;
                        ffPos[i * 3 + 2] = f.bz + Math.cos(time * f.sp * 0.9 + f.ph * 0.7) * f.amp;
                    }
                    ffGeo.attributes.position.needsUpdate = true;
                }
                ffUniforms.uTime.value = time;
                for (const tool of farmTools) {
                    updateFarmTool(tool, dt, time);
                }
  
                /* ============ 室内陈设动画（一二楼家具·猫·坩埚·塔罗牌·茶壶等） ============ */
                for (const s of stools) {
                    const u = s.userData;
                    const target = u.open ? 0.42 : 0;
                    u.vel += (target - u.cur) * 0.02;
                    u.vel *= 0.88;
                    u.cur += u.vel;
                    s.position.z = u.bz + u.dz * u.cur;
                }

                for (const c of chairs) {
                    const u = c.userData;
                    const target = u.open ? 0.45 : 0;
                    u.vel += (target - u.cur) * 0.02;
                    u.vel *= 0.88;
                    u.cur += u.vel;
                    c.position.x = u.bx + u.ax * u.cur;
                    c.position.z = u.bz + u.az * u.cur;
                }

                orbP += ((orbOn ? 1 : 0) - orbP) * 0.02;
                for (const r of orbRings) {
                    r.holder.rotation.y += r.spd * 0.02 * orbP;
                    const sc = Math.max(orbP, 0.001);
                    r.holder.scale.set(sc, sc, sc);
                    r.holder.visible = orbP > 0.02;
                }
                orbStars.rotation.y += 0.018 * orbP;
                orbStars.scale.setScalar(Math.max(orbP, 0.001));
                orbStars.visible = orbP > 0.03;

                updateLiquid(time);
                for (const b of potBubbles) {
                    b.visible = corkOut;
                    if (corkOut) {
                        const prog = (time * 0.5 + b.userData.phase) % 1;
                        b.position.set(PX + Math.sin(prog * 9 + b.userData.wob) * 0.018,
                            MTTOP + 0.012 + prog * 0.052,
                            PZ + Math.cos(prog * 7 + b.userData.wob) * 0.018);
                        const sc = 0.55 + prog * 0.95;
                        b.scale.set(sc, sc, sc);
                    }
                }

                corkT += ((corkOut ? 1 : 0) - corkT) * 0.022;
                {
                    const raw = Math.min(Math.max(corkT, 0), 1);
                    const tC = raw * raw * (3 - 2 * raw);
                    let cx, cy, cz;
                    if (tC < 0.5) {
                        const u = tC / 0.5;
                        cx = CORK_M[0]; cz = CORK_M[2];
                        cy = CORK_M[1] + u * 0.20;
                    } else {
                        const u = (tC - 0.5) / 0.5;
                        cx = CORK_M[0] + (CORK_L[0] - CORK_M[0]) * u;
                        cz = CORK_M[2] + (CORK_L[2] - CORK_M[2]) * u;
                        cy = (CORK_M[1] + 0.20) - u * ((CORK_M[1] + 0.20) - CORK_L[1]);
                    }
                    corkG.position.set(cx, cy, cz);
                    corkG.rotation.z = Math.sin(tC * Math.PI) * 0.45;
                }

                bookP += ((bookOn ? 1 : 0) - bookP) * 0.02;
                if (flipping) {
                    flipCur += dt * 1.6;
                    if (flipCur >= 1) { flipCur = 0; flipping = false; }
                }
                pagePivot.visible = flipping;
                if (flipping) {
                    const e = flipCur * flipCur * (3 - 2 * flipCur);
                    pagePivot.rotation.z = 0.12 + e * (Math.PI - 0.24);
                }
                for (const g of glyphs) {
                    const u = g.userData;
                    u.age += dt;
                    if (u.age >= u.life) {
                        if (bookOn && bookP > 0.5) {
                            u.age = 0;
                            u.life = 2.5 + Math.random() * 1.2;
                            u.ox = (Math.random() - 0.5) * 0.22;
                            u.oz = (Math.random() - 0.5) * 0.18;
                            u.sway = Math.random() * 6.28;
                            g.visible = true;
                        } else {
                            g.visible = false;
                        }
                    }
                    if (g.visible) {
                        const p = u.age / u.life;
                        const rise = p * 0.38;
                        const sway = Math.sin(time * 2 + u.sway) * 0.03 * p;
                        g.position.set(BX + u.ox + sway, MTTOP + 0.06 + rise, BZ + u.oz);
                        const env = Math.min(p * 6, 1) * (1 - Math.max(0, (p - 0.65) / 0.35));
                        g.scale.setScalar(Math.max(env, 0.001));
                        g.rotation.y = Math.sin(time * 1.5 + u.sway) * 0.4;
                    }
                }

                /* ---- 书堆 ---- */
                {
                    const n = pileBooks.length;
                    if (pileState === 'falling') {
                        pileT += dt;
                        let done = true;
                        for (let i = 0; i < n; i++) {
                            const b = pileBooks[i], u = b.userData;
                            const delay = (n - 1 - i) * 0.075;
                            const p = Math.min(Math.max((pileT - delay) / 0.55, 0), 1);
                            if (p < 1) done = false;
                            const e = p * p;
                            b.position.x = u.sx + (u.fx - u.sx) * e;
                            b.position.z = u.sz + (u.fz - u.sz) * e;
                            b.position.y = u.sy + (u.fy - u.sy) * e + Math.sin(p * Math.PI) * 0.05;
                            b.rotation.y = u.sry + (u.fry - u.sry) * e;
                            b.rotation.z = Math.sin(p * Math.PI) * 0.45;
                        }
                        if (done) pileState = 'fallen';
                    } else if (pileState === 'rising') {
                        pileT += dt;
                        let done = true;
                        for (let i = 0; i < n; i++) {
                            const b = pileBooks[i], u = b.userData;
                            const delay = i * 0.11;
                            const p = Math.min(Math.max((pileT - delay) / 0.65, 0), 1);
                            if (p < 1) done = false;
                            const e = p * p * (3 - 2 * p);
                            b.position.x = u.fx + (u.sx - u.fx) * e;
                            b.position.z = u.fz + (u.sz - u.fz) * e;
                            b.position.y = u.fy + (u.sy - u.fy) * e + Math.sin(p * Math.PI) * 0.24;
                            b.rotation.y = u.fry + (u.sry - u.fry) * e + Math.sin(p * Math.PI * 2) * 0.4;
                            b.rotation.z = Math.sin((1 - p) * Math.PI) * 0.3;
                        }
                        if (done) pileState = 'stacked';
                    }
                }

                lanternPivot.rotation.x = Math.sin(time * 1.2) * 0.045;
                lanternPivot.rotation.z = Math.sin(time * 0.9 + 1) * 0.05;
                lanternFlame.visible = lanternLit;
                halo.visible = beam.visible = floorPool.visible = floorPool2.visible = tablePool.visible = lanternLit;
                if (lanternLit) {
                    const fk = 1 + Math.sin(time * 9) * 0.10 + Math.sin(time * 13.7) * 0.04;
                    lanternFlame.scale.set(1, fk, 1);
                    haloMat.opacity = 0.11 + 0.04 * fk;
                    beamMat.opacity = 0.07 + 0.025 * fk;
                    glowMatA.opacity = 0.07 + 0.025 * fk;
                    glowMatB.opacity = 0.06 + 0.02 * fk;
                }

                /* ---- 实体猫 ---- */

                {
                    catP += ((catAwake ? 1 : 0) - catP) * 0.03;
                    const br = 1 + Math.sin(time * 2.2) * 0.025 * (1 - 0.6 * catP);
                    catBody.scale.set(1, br, 1);
                    catHead.position.y = 0.265 + 0.05 * catP;
                    catHead.position.x = 0.215 - 0.03 * catP;
                    const blink = catP > 0.5 && (time % 3.6) < 0.14;
                    eyesOpen.visible = catP > 0.5 && !blink;
                    eyesClosed.visible = !eyesOpen.visible;
                    const twitch = Math.max(0, Math.sin(time * 0.37) - 0.985) * 30;
                    earLG.rotation.z = -0.05 + twitch * 0.25;
                    earRG.rotation.z = 0.05 + twitch * 0.25;
                    for (let i = 0; i < tailSegs.length; i++)
                        tailSegs[i].rotation.y = Math.sin(time * 1.1 + i * 0.7) * (0.03 + 0.06 * catP);
                }

                /* ---- 毛线球 ---- */
                {
                    const u = yarnG.userData;
                    u.vy -= 9.8 * dt;
                    u.y += u.vy * dt;
                    if (u.y <= 0) {
                        u.y = 0;
                        if (Math.abs(u.vy) > 0.45) { u.vy = -u.vy * 0.45; u.spinV *= 0.72; }
                        else { u.vy = 0; u.spinV *= (1 - 2.5 * dt); }
                    }
                    yarnBall.position.y = u.y;
                    yarnBall.rotation.y += u.spinV * dt;
                    u.spinV *= (1 - 0.4 * dt);
                }

                /* ---- 水晶球 ---- */
                {
                    if (cbRun > 0) cbRun -= dt;
                    const act = cbRun > 0;
                    for (let i = 0; i < cbMists.length; i++)
                        cbMists[i].l.rotation.y += dt * (act ? 2.0 + i * 0.5 : 0.35 + i * 0.1);
                    for (let i = 0; i < cbStars.length; i++) {
                        cbStars[i].rotation.y += dt * (act ? 3.0 : 0.8);
                        cbStars[i].position.y = (i % 2 ? 0.07 : -0.05) + Math.sin(time * 1.4 + i * 1.7) * 0.02;
                    }
                    cbMistMat.opacity = act ? 0.85 : 0.5;
                    cbGlowMat.opacity = act ? 0.10 + 0.06 * Math.sin(time * 6) : 0;
                }

                /* ---- 月光魔法盆栽 ---- */
                {
                    if (plantRun > 0) plantRun -= dt;
                    const act = plantRun > 0;
                    for (const s of plantStems) {
                        s.stem.rotation.z = Math.sin(time * 1.2 + s.ph) * 0.05 + (act ? Math.sin(time * 5 + s.ph) * 0.06 : 0);
                        s.stem.rotation.x = Math.cos(time * 0.9 + s.ph) * 0.04;
                    }
                    for (const b of plantBerries) {
                        b.obj.scale.setScalar(act ? 1 + 0.25 * Math.sin(time * 7 + b.ph) : 1);
                        b.m.opacity = act ? 1 : 0.85;
                    }
                }

                /* ---- 滑轮置物台：滑动 + 轮子滚动（朝被炉 -z 方向）---- */
                {
                    cartP += ((cartOut ? 1 : 0) - cartP) * 0.07;
                    cartG.position.set(CART_P0.x + CART_DIR.x * CART_DIST * cartP, 0,
                        CART_P0.z + CART_DIR.z * CART_DIST * cartP);
                    cartG.updateMatrixWorld(true);
                    const dC = cartP - cartPrevP;
                    if (Math.abs(dC) > 1e-5)
                        for (const w of cartWheels) w.children[0].rotation.y -= dC * 16;
                    cartPrevP = cartP;
                }

                /* ---- 羽毛笔：飞出书写魔法符号后归位 ---- */
                {
                    if (quillRun > 0) {
                        quillRun -= dt;
                        const p = 1 - Math.max(quillRun, 0) / QUILL_T;
                        _cw.set(QUILL_REST.pos[0], QUILL_REST.pos[1], QUILL_REST.pos[2]);
                        cartG.localToWorld(_cw);
                        const restX = _cw.x, restY = _cw.y, restZ = _cw.z;
                        const sX = QW_A.x, sY = QW_A.y + 0.08, sZ = QW_A.z;
                        const eX = QW_B.x, eY = QW_B.y + 0.08, eZ = QW_B.z;
                        let px, py, pz, rx = QUILL_REST.rotX, rz = QUILL_REST.rotZ;
                        if (p < 0.10) {
                            const u = sm01(p / 0.10);
                            px = restX + (sX - restX) * u;
                            py = restY + (sY - restY) * u + Math.sin(u * Math.PI) * 0.30;
                            pz = restZ + (sZ - restZ) * u;
                            rx = -0.25; rz = 0.10;
                        } else if (p < 0.70) {
                            const u = (p - 0.10) / 0.60;
                            px = sX + (eX - sX) * u;
                            py = sY + (eY - sY) * u + Math.sin(u * Math.PI * 6) * 0.02;
                            pz = sZ + (eZ - sZ) * u;
                            rx = -0.85 + Math.sin(u * Math.PI * 10) * 0.10;
                            rz = 0.22;
                            for (let i = 0; i < 8; i++) {
                                if (!magicGlyphs[i].active && u > (i + 0.25) / 8) {
                                    magicGlyphs[i].active = true;
                                    magicGlyphs[i].age = 0;
                                    magicGlyphs[i].sp.visible = true;
                                }
                            }
                        } else if (p < 0.80) {
                            const u = (p - 0.70) / 0.10;
                            px = eX; py = eY + Math.sin(u * Math.PI) * 0.05; pz = eZ;
                            rx = -0.5; rz = 0.15;
                        } else {
                            const u = sm01((p - 0.80) / 0.20);
                            px = eX + (restX - eX) * u;
                            py = eY + (restY - eY) * u + Math.sin(u * Math.PI) * 0.30;
                            pz = eZ + (restZ - eZ) * u;
                            rx = -0.25 * (1 - u) + QUILL_REST.rotX * u;
                            rz = 0.10 * (1 - u) + QUILL_REST.rotZ * u;
                        }
                        _cw.set(px, py, pz);
                        cartG.worldToLocal(_cw);
                        quillG.position.copy(_cw);
                        quillG.rotation.set(rx, 0, rz);
                        if (quillRun <= 0) {
                            quillG.position.set(QUILL_REST.pos[0], QUILL_REST.pos[1], QUILL_REST.pos[2]);
                            quillG.rotation.set(QUILL_REST.rotX, 0, QUILL_REST.rotZ);
                        }
                    }
                }

                /* ---- 魔法符号：上升渐隐 ---- */
                {
                    for (const g of magicGlyphs) {
                        if (g.active) {
                            g.age += dt;
                            const k = g.age / g.life;
                            if (k >= 1) { g.active = false; g.sp.visible = false; continue; }
                            const pop = Math.min(g.age * 7, 1);
                            g.mat.opacity = 0.95 * pop * (1 - Math.max(0, (k - 0.55) / 0.45));
                            g.sp.position.set(g.base.x + Math.sin(g.age * 2.2) * 0.02,
                                g.base.y + k * 0.20,
                                g.base.z);
                            const s = 0.16 * pop * (1 + 0.10 * Math.sin(g.age * 7));
                            g.sp.scale.set(s, s, 1);
                        }
                    }
                }

                /* ---- 纸堆：腾空扇动绕一楼一圈后飞回 ---- */
                {
                    if (paperRun > 0) {
                        paperRun -= dt;
                        const elapsed = PAPER_T - paperRun;
                        for (let i = 0; i < papers.length; i++) {
                            const pp = papers[i];
                            const delay = i * 0.12;
                            const D = PAPER_T - delay;
                            let ti = (elapsed - delay) / D;
                            if (ti < 0) ti = 0;
                            if (ti > 1) ti = 1;
                            _cw.copy(pp.home);
                            cartG.localToWorld(_cw);
                            const hx = _cw.x, hy = _cw.y, hz = _cw.z;
                            const a0 = pp.a0, r = pp.r;
                            const cirY = (a) => 1.45 + Math.sin(a * 3 + i) * 0.22;
                            let pos;
                            if (ti < 0.18) {
                                const u = sm01(ti / 0.18);
                                const cx = Math.cos(a0) * r, cy = cirY(a0), cz = Math.sin(a0) * r;
                                pos = {
                                    x: hx + (cx - hx) * u,
                                    y: hy + (cy - hy) * u + Math.sin(u * Math.PI) * 0.40,
                                    z: hz + (cz - hz) * u
                                };
                            } else if (ti < 0.78) {
                                const s = (ti - 0.18) / 0.60;
                                const a = a0 + s * Math.PI * 2;
                                pos = { x: Math.cos(a) * r, y: cirY(a), z: Math.sin(a) * r };
                            } else {
                                const u = sm01((ti - 0.78) / 0.22);
                                const cx = Math.cos(a0 + Math.PI * 2) * r, cy = cirY(a0 + Math.PI * 2), cz = Math.sin(a0 + Math.PI * 2) * r;
                                pos = {
                                    x: cx + (hx - cx) * u,
                                    y: cy + (hy - cy) * u + Math.sin(u * Math.PI) * 0.35,
                                    z: cz + (hz - cz) * u
                                };
                            }
                            _cw.set(pos.x, pos.y, pos.z);
                            cartG.worldToLocal(_cw);
                            pp.g.position.copy(_cw);
                            if (ti > 0.02 && ti < 0.98) {
                                pp.g.rotation.set(Math.sin(time * 7 + i * 1.3) * 0.9,
                                    time * 2.5 + i,
                                    Math.cos(time * 5 + i * 0.9) * 0.7);
                            } else {
                                pp.g.rotation.set(0, pp.ry0, 0);
                            }
                        }
                        if (paperRun <= 0) {
                            for (const pp of papers) {
                                pp.g.position.copy(pp.home);
                                pp.g.rotation.set(0, pp.ry0, 0);
                            }
                        }
                    }
                }

                /* ---- 暖桌：暖光呼吸 + 收音机音符 ---- */
                {
                    if (kotGlowMat) {
                        kotGlowMat.opacity = kotatsuOn ? 0.07 + 0.05 * (0.5 + 0.5 * Math.sin(time * 4.2)) : 0;
                    }
                    if (radioNoteRun > 0) {
                        radioNoteRun -= dt;
                        for (const nt of radioNotes) {
                            const p = (time * 0.55 + nt.ph) % 1;
                            if (p < 0.85) {
                                nt.g.visible = true;
                                const env = Math.min(p * 7, 1) * (1 - Math.max(0, (p - 0.7) / 0.15));
                                noteMat.opacity = 0.9 * env;
                                const src = radioG.userData.noteSrc;
                                src.getWorldPosition(_tv);
                                nt.g.position.set(
                                    _tv.x + Math.sin(time * 2 + nt.ph * 6) * 0.030 + p * 0.06,
                                    _tv.y + p * 0.28,
                                    _tv.z + Math.cos(time * 1.6 + nt.ph * 5) * 0.025
                                );
                                nt.g.rotation.y = Math.sin(time * 3 + nt.ph * 4) * 0.6;
                                nt.g.rotation.z = Math.sin(time * 2.5 + nt.ph * 3) * 0.25;
                            } else {
                                nt.g.visible = false;
                            }
                        }
                    } else {
                        for (const nt of radioNotes) nt.g.visible = false;
                    }
                }

                /* ---- 橘子：盆内 ⇄ 滚上桌面 ---- */
                {
                    const n = oranges.length;
                    if (orangeState === 'out' || orangeState === 'back') {
                        orangeT += dt;
                        let done = true;
                        for (let i = 0; i < n; i++) {
                            const o = oranges[i];
                            const delay = i * 0.085;
                            let p = Math.min(Math.max((orangeT - delay) / 0.65, 0), 1);
                            if (p < 1) done = false;
                            const e = p * p * (3 - 2 * p);
                            const f = orangeState === 'out' ? e : 1 - e;
                            o.mesh.position.set(
                                o.hx + (o.tx - o.hx) * f,
                                o.hy + (o.ty - o.hy) * f + Math.sin(f * Math.PI) * 0.09,
                                o.hz + (o.tz - o.hz) * f
                            );
                            o.mesh.rotation.set(o.ax * f, 0, o.az * f);
                        }
                        if (done) orangeState = orangeState === 'out' ? 'rolled' : 'inbowl';
                    }
                }

                /* ---- 坐垫：水平翻滚 180° ---- */
                {
                    for (const c of cushions) {
                        if (c.anim) {
                            c.p += dt * 2.2;
                            if (c.p >= 1) { c.p = 1; c.anim = 0; }
                            const e = c.p * c.p * (3 - 2 * c.p);
                            const ang = c.from + (c.to - c.from) * e;
                            c.g.rotation.x = ang;
                            c.g.position.y = Math.sin(c.p * Math.PI) * 0.24 + (ang / Math.PI) * 0.125;
                        }
                    }
                }

                /* ---- 塔罗牌 ---- */
                {
                    const n = tarotCards.length;
                    if (tarotState === 'flying') {
                        tarotT += dt;
                        let done = true;
                        for (let i = 0; i < n; i++) {
                            const c = tarotCards[i], u = c.userData;
                            const delay = i * 0.08;
                            const p = Math.min(Math.max((tarotT - delay) / 0.75, 0), 1);
                            if (p < 1) done = false;
                            const e = p * p * (3 - 2 * p);
                            const fp = tarotPose(u, i, time);
                            c.position.x = u.sx + (fp.x - u.sx) * e;
                            c.position.y = u.sy + (fp.y - u.sy) * e + Math.sin(p * Math.PI) * 0.18;
                            c.position.z = u.sz + (fp.z - u.sz) * e;
                            c.rotation.y = u.sry + (fp.ry - u.sry) * e;
                            c.rotation.x = fp.rx * e;
                            c.rotation.z = fp.rz * e;
                        }
                        if (done) tarotState = 'floating';
                    } else if (tarotState === 'floating') {
                        for (let i = 0; i < n; i++) {
                            const c = tarotCards[i], u = c.userData;
                            const fp = tarotPose(u, i, time);
                            c.position.set(fp.x, fp.y, fp.z);
                            c.rotation.set(fp.rx, fp.ry, fp.rz);
                        }
                    } else if (tarotState === 'returning') {
                        tarotT += dt;
                        let done = true;
                        for (let i = 0; i < n; i++) {
                            const c = tarotCards[i], u = c.userData;
                            const delay = (n - 1 - i) * 0.07;
                            const p = Math.min(Math.max((tarotT - delay) / 0.65, 0), 1);
                            if (p < 1) done = false;
                            const e = p * p * (3 - 2 * p);
                            c.position.x = u.px + (u.sx - u.px) * e;
                            c.position.y = u.py + (u.sy - u.py) * e + Math.sin(p * Math.PI) * 0.15;
                            c.position.z = u.pz + (u.sz - u.pz) * e;
                            c.rotation.y = u.pry + (u.sry - u.pry) * e;
                            c.rotation.x = u.prx * (1 - e);
                            c.rotation.z = u.prz * (1 - e);
                        }
                        if (done) tarotState = 'stacked';
                    }
                }

                for (const f of candleWavy) {
                    f.obj.visible = true;
                    updateWavyFlame(f, time, 0.9 + 0.1 * Math.sin(time * 11));
                }

                for (const b of shelfBooks) {
                    const u = b.userData;
                    const target = u.out ? 1 : 0;
                    u.vel += (target - u.cur) * 0.03;
                    u.vel *= 0.85;
                    u.cur += u.vel;
                    b.position.x = u.bx + 0.11 * u.cur;
                }

                /* ---- 试剂瓶 ---- */
                for (const rg of reagents) {
                    const u = rg.userData;
                    if (u.run > 0) u.run -= dt;
                    if (u.run > 0) {
                        const k = u.run / 1.3;
                        rg.rotation.z = Math.sin((1.3 - u.run) * 24) * 0.20 * k;
                        rg.position.y = u.by + Math.abs(Math.sin((1.3 - u.run) * 24)) * 0.006 * k;
                    } else {
                        rg.rotation.z = 0;
                        rg.position.y = u.by;
                    }
                }

                /* ---- 紫色魔法阵 ---- */
                {
                    if (mcRun > 0) mcRun -= dt;
                    const prog = mcRun > 0 ? 1 - mcRun / 8.0 : 1;
                    let inten = 0;
                    if (mcRun > 0) {
                        if (prog < 0.12) inten = prog / 0.12;
                        else if (prog < 0.82) inten = 1;
                        else inten = 1 - (prog - 0.82) / 0.18;
                    }
                    mcMat.opacity = 0.5 + 0.5 * inten;
                    mcBase.rotation.y += dt * (0.15 + 2.8 * inten);
                    for (const f of mcFloats) {
                        const ap = Math.min(Math.max((prog - (0.10 + f.ph * 0.07)) / 0.20, 0), 1);
                        const show = mcRun > 0 && ap > 0 && inten > 0.02;
                        f.g.visible = show;
                        if (show) {
                            const e = ap * ap * (3 - 2 * ap);
                            f.g.position.y = 0.05 + f.ty * e + Math.sin(time * 1.5 + f.ph) * 0.03;
                            f.g.rotation.y += dt * f.spd;
                            f.g.scale.setScalar(0.5 + 0.5 * e);
                            f.m.opacity = 0.85 * inten * e;
                        }
                    }
                    for (const q of mcParts) {
                        const show = inten > 0.04;
                        q.p.visible = show;
                        if (show) {
                            const pr = (q.ph + time * 0.35) % 1;
                            const a = q.a + time * q.spd;
                            q.p.position.set(MC_X + Math.cos(a) * q.r, 0.05 + pr * 2.5, MC_Z + Math.sin(a) * q.r);
                            const sc = Math.sin(pr * Math.PI) * inten;
                            q.p.scale.setScalar(Math.max(sc, 0.001));
                            q.p.rotation.y = time * 2;
                        }
                    }
                }

                {
                    const target = hgFlip ? Math.PI : 0;
                    hgRotV += (target - hgRot) * 0.012;
                    hgRotV *= 0.93;
                    hgRot += hgRotV;
                    hg.rotation.x = hgRot;
                    if (hgRun > 0) {
                        hgRun -= dt;
                        hgSand = Math.max(0.2, hgRun / 5);
                    }
                    const topP = hgFlip ? pileBotG : pileTopG;
                    const botP = hgFlip ? pileTopG : pileBotG;
                    topP.scale.setScalar(0.25 + 0.75 * hgSand);
                    botP.scale.setScalar(0.3 + 0.8 * (1 - hgSand));
                    const settled = Math.abs(hgRot - target) < 0.3;
                    const sv = hgRun > 0 && settled;
                    for (let i = 0; i < hgStreams.length; i++) {
                        const s = hgStreams[i];
                        s.visible = sv;
                        if (sv) {
                            const prog = (time * 1.5 + i / 3) % 1;
                            const y0 = 0.185;
                            const y1 = hgFlip ? 0.235 : 0.14;
                            s.position.y = y0 + (y1 - y0) * prog;
                        }
                    }
                }

                {
                    const target = chestOpen ? 1 : 0;
                    chestV += (target - chestP) * 0.02;
                    chestV *= 0.9;
                    chestP += chestV;
                    chestLid.rotation.x = -1.25 * chestP;
                    chestGem.visible = chestP > 0.3;
                    if (chestGem.visible) {
                        chestGem.position.y = 0.11 + Math.sin(time * 2.5) * 0.008 + chestP * 0.015;
                        chestGem.rotation.y = time * 1.2;
                    }
                }

                /* ---- 楼梯下储物箱：开盖 + 矿石旋转起伏 ---- */
                {
                    const target = storageOpen ? 1 : 0;
                    storageV += (target - storageP) * 0.02;
                    storageV *= 0.9;
                    storageP += storageV;
                    storageLid.rotation.x = -1.35 * storageP;
                    const show = storageP > 0.25;
                    for (let i = 0; i < oreMeshes.length; i++) {
                        const o = oreMeshes[i];
                        o.g.visible = show;
                        if (show) {
                            o.g.rotation.y += dt * 0.8;
                            if (storageP > 0.9)
                                o.g.position.y = o.by + Math.sin(time * 2 + i * 1.1) * 0.006;
                        }
                    }
                }

                {
                    carP += ((carOn ? 1 : 0) - carP) * 0.015;
                    carCanopy.rotation.y += 0.05 * carP;
                    for (let i = 0; i < carStars.length; i++) {
                        carStars[i].position.y = -0.072 + Math.sin(time * 3 + i * 1.57) * 0.01 * carP;
                    }
                }

                /* ---- 大魔女坩埚 ---- */
                {
                    if (stirRun > 0) stirRun -= dt;
                    const active = stirRun > 0;
                    const prog = active ? Math.min(Math.max(1 - stirRun / 4.5, 0), 1) : 0;
                    const ramp = Math.min(prog / 0.16, 1);
                    const down = Math.min(Math.max((prog - 0.72) / 0.28, 0), 1);
                    const spdEnv = active ? ramp * (1 - down * down) : 0;
                    stirAng += dt * (0.45 + 3.0 * spdEnv);
                    stirG.rotation.y = stirAng;
                    stickAsm.rotation.z = active ? Math.sin(time * 7) * 0.03 : Math.sin(time * 1.2) * 0.012;
                    bubbleI += ((active ? 1 : 0.3) - bubbleI) * 0.0035;

                    const arr = calSurfGeom.attributes.position.array;
                    const amp = 0.008 + 0.02 * ((bubbleI - 0.3) / 0.7);
                    for (let i = 0; i < 28; i++) {
                        const a = i / 28 * Math.PI * 2;
                        const rr = 0.37 + Math.sin(a * 3 + time * (active ? 2.2 : 1.4)) * amp * 0.8;
                        arr[i * 3] = Math.cos(a) * rr;
                        arr[i * 3 + 1] = 0.74 + CAL_UP + Math.sin(a * 3 - time * 1.8) * amp * 0.5;
                        arr[i * 3 + 2] = Math.sin(a) * rr;
                    }
                    calSurfGeom.attributes.position.needsUpdate = true;

                    for (const b of calBubbles) {
                        const pr = (time * (0.40 + 0.50 * bubbleI) + b.userData.phase) % 1;
                        const ba = b.userData.ba + time * 0.2;
                        b.position.set(CCX + Math.cos(ba) * b.userData.br,
                            0.74 + CAL_UP + pr * 0.14,
                            CCZ + Math.sin(ba) * b.userData.br);
                        const sc = (0.4 + pr * 1.3) * (pr < 0.85 ? 1 : (1 - pr) / 0.15);
                        b.scale.setScalar(Math.max(sc, 0.001));
                    }
                    const calPW = 0.85 + 0.15 * Math.sin(time * 6.3);
                    for (const f of calWavy) {
                        f.obj.visible = true;
                        updateWavyFlame(f, time, calPW);
                    }
                    calGlowMat.opacity = 0.07 + 0.05 * (0.5 + 0.5 * Math.sin(time * 6.3));
                }

                /* ---- 长餐桌 ---- */
                for (const p of plates) {
                    p.rotation.y += p.userData.spinV * dt;
                    p.userData.spinV *= Math.max(0, 1 - 2.0 * dt);
                }
                for (const c of cups) {
                    const u = c.userData;
                    if (u.run > 0) u.run -= dt;
                    const prog = u.run > 0 ? Math.min(Math.max(1 - u.run / 2.6, 0), 1) : 1;
                    const env = u.run > 0 ? Math.sin(Math.PI * prog) : 0;
                    u.lift = env * 0.13;
                    c.position.y = u.baseY + u.lift;
                    u.steam.visible = u.run > 0;
                    if (u.steam.visible) {
                        u.steam.position.y = 0.10 + (time * 0.25) % 0.07;
                        const ss = 0.85 + 0.15 * Math.sin(time * 5);
                        u.steam.scale.set(ss, 1, ss);
                    }
                }
                for (const it of tableItems) {
                    const u = it.userData;
                    if (u.run > 0) u.run -= dt;
                    const pr = u.run > 0 ? 1 - u.run / 1.4 : 1;
                    const env = u.run > 0 ? Math.sin(Math.PI * pr) : 0;
                    it.position.y = u.baseY + env * 0.05;
                    it.rotation.z = env * Math.sin(pr * 12) * 0.18;
                    it.rotation.y = u.ry + env * Math.sin(pr * 8) * 0.3;
                }

                /* ---- 茶壶 ---- */
                {
                    if (potRun > 0) potRun -= dt;
                    const p = potRun > 0 ? 1 - potRun / POT_T : 0;
                    const dirX = Math.sin(POT_RY), dirZ = Math.cos(POT_RY);
                    const hx = CUP_T.position.x - dirX * POT_TIP_FWD;
                    const hz = CUP_T.position.z - dirZ * POT_TIP_FWD;
                    const sm = tt => tt * tt * (3 - 2 * tt);
                    let ly = 0, dx = 0, dz = 0, tilt = 0;
                    if (p > 0) {
                        if (p < 0.14) {
                            ly = sm(p / 0.14) * 0.45;
                        } else if (p < 0.30) {
                            const u = sm((p - 0.14) / 0.16);
                            ly = 0.45; dx = u * (hx - POT_BX); dz = u * (hz - POT_BZ);
                        } else if (p < 0.40) {
                            const u = sm((p - 0.30) / 0.10);
                            ly = 0.45; dx = hx - POT_BX; dz = hz - POT_BZ; tilt = u * POT_TILT;
                        } else if (p < 0.70) {
                            ly = 0.45; dx = hx - POT_BX; dz = hz - POT_BZ; tilt = POT_TILT;
                        } else if (p < 0.80) {
                            const u = sm((p - 0.70) / 0.10);
                            ly = 0.45; dx = hx - POT_BX; dz = hz - POT_BZ; tilt = (1 - u) * POT_TILT;
                        } else if (p < 0.94) {
                            const u = sm((p - 0.80) / 0.14);
                            ly = 0.45; dx = (1 - u) * (hx - POT_BX); dz = (1 - u) * (hz - POT_BZ);
                        } else {
                            const u = sm((p - 0.94) / 0.06);
                            ly = (1 - u) * 0.45;
                        }
                    }
                    const floating = p > 0.02 && p < 0.98;
                    const bob = floating ? Math.sin(time * 3) * 0.012 : 0;
                    teapotPos.position.set(POT_BX + dx, DTOP + ly + bob, POT_BZ + dz);
                    teapot.rotation.x = tilt;
                    potHalo.visible = floating;
                    if (floating) potHaloMat.opacity = 0.09 + 0.04 * (0.5 + 0.5 * Math.sin(time * 5));
                    if (tilt > 0.45) {
                        potStream.visible = true;
                        potSpoutTip.getWorldPosition(_tv);
                        const ex = CUP_T.position.x, ey = CUP_T.position.y + 0.10, ezz = CUP_T.position.z;
                        const arr = potStreamGeom.attributes.position.array;
                        for (let i = 0; i < 10; i++) {
                            const tt = i / 9;
                            const wob = Math.sin(tt * Math.PI);
                            arr[i * 3] = _tv.x + (ex - _tv.x) * tt + Math.sin(tt * 9 + time * 8) * 0.008 * wob;
                            arr[i * 3 + 1] = _tv.y + (ey - _tv.y) * tt - 0.035 * wob;
                            arr[i * 3 + 2] = _tv.z + (ezz - _tv.z) * tt + Math.cos(tt * 7 + time * 6) * 0.008 * wob;
                        }
                        potStreamGeom.attributes.position.needsUpdate = true;
                    } else {
                        potStream.visible = false;
                    }
                }

                {
                    broomP += ((broomHover ? 1 : 0) - broomP) * 0.02;
                    const p = broomP;
                    broomG.position.x = BROOM_REST.x + (BROOM_FLY.x - BROOM_REST.x) * p;
                    broomG.position.z = BROOM_REST.z + (BROOM_FLY.z - BROOM_REST.z) * p;
                    broomG.position.y = BROOM_REST.y + (BROOM_FLY.y - BROOM_REST.y) * p
                        + Math.sin(time * 1.3) * 0.03 * p;
                    broomG.rotation.z = BROOM_REST.rz + (BROOM_FLY.rz - BROOM_REST.rz) * p
                        + Math.sin(time * 1.1) * 0.02 * p;
                    broomG.rotation.x = Math.sin(time * 0.9) * 0.03 * p;
                    broomG.rotation.y = Math.sin(time * 0.5) * 0.12 * p;
                    broomGlow.visible = p > 0.05;
                    if (broomGlow.visible) {
                        broomGlow.position.set(0, -0.20 + Math.sin(time * 2.2) * 0.012, 0);
                        broomGlow.rotation.y = time * 0.6;
                        const gs = 0.85 + 0.15 * Math.sin(time * 2.5);
                        broomGlow.scale.setScalar(gs * Math.min(p * 1.5, 1));
                    }
                }

                /* ---- 门铃：按钮按压 + 音波涟漪 ---- */
                {
                    if (bellRun > 0) bellRun -= dt;
                    if (bellRun > 0) {
                        btnG.position.z = -0.014 * Math.sin(Math.min((1.4 - bellRun) * 9, Math.PI));
                    } else {
                        btnG.position.z = 0;
                    }
                    if (bellRipple > 0) bellRipple -= dt;
                    for (const r of bellRipples) {
                        if (bellRipple > 0) {
                            const s = 1 + (1 - bellRipple) * 2.4;
                            r.l.scale.setScalar(Math.max(s, 0.001));
                            r.m.opacity = Math.max(0, bellRipple * 0.7);
                        } else {
                            r.m.opacity = 0;
                        }
                    }
                }

                /* ---- 晴天娃娃 + 风铃 ---- */
                {
                    for (const h of [sunPivot, chimePivot]) {
                        const u = h.userData;
                        u.energy *= Math.pow(0.35, dt);
                        if (u.energy < 0.002) u.energy = 0;
                        h.rotation.z = Math.sin(time * 1.1 + u.ph) * 0.045 + u.energy * Math.sin(time * 9 + u.ph) * 0.30;
                        h.rotation.x = Math.cos(time * 0.9 + u.ph) * 0.040 + u.energy * Math.cos(time * 8 + u.ph) * 0.22;
                    }
                }

                chairT += ((chairOpen ? 1 : 0) - chairT) * 0.07;
                const ck = smooth(Math.max(0, Math.min(1, chairT)));
                chairG.position.z = CHAIR_IN + (CHAIR_OUT - CHAIR_IN) * ck;
                pillowT += ((pillowOpen ? 1 : 0) - pillowT) * 0.05;
                const pe = pillowT * pillowT * (3 - 2 * pillowT);
                pillowG.rotation.x = Math.PI * pe;
                eraserT += ((eraserOpen ? 1 : 0) - eraserT) * 0.06;
                const ee = eraserT * eraserT * (3 - 2 * eraserT);
                eraserG.rotation.x = Math.PI * ee;
                updateChalk(time);
                updateWand2(time);
                updateRubik(time);
                updateLayerAnim(dt);
                updateSnow(time, dt);
                updateHourglass(time);
                updateDeck(time);
                updateBook(time, dt);
                updateCal(dt);
                updateGlyphs(time, dt);
                for (const tg of toppleGroups) updateTopple(tg);
                updateTissue(time, dt);
                updateWobblers(dt);
                updateHat(time, dt);
                updateCandies(dt);

                candleP += ((candleLit ? 1 : 0) - candleP) * 0.03;
                const candleVisible = candleP > 0.02;
                for (const f of candleWavy) {
                    f.obj.visible = candleVisible;
                    if (candleVisible) {
                        updateWavyFlame(f, time, candleP * (0.9 + 0.1 * Math.sin(time * 9)));
                    }
                }

                magicP += ((magicOn ? 1 : 0) - magicP) * 0.012;
                veil.material.opacity = magicP * 0.28;
                {
                    const flick = 0.9 + 0.1 * Math.sin(time * 9) + 0.04 * Math.sin(time * 23);
                    const boost = 0.30 + 0.50 * magicP;
                    for (const cg of candleGlows) {
                        cg.m.material.opacity = cg.maxOp * candleP * boost * flick;
                        cg.m.scale.setScalar(1 + 0.05 * Math.sin(time * 9 + cg.maxOp * 10));
                    }
                }
                if (magicP > 0.01) {
                    spinG.rotation.y += 0.020 * magicP;
                    innerG.rotation.y -= 0.008 * magicP;
                }
                const pulse = 0.8 + 0.2 * Math.sin(time * 2.4);
                for (let i = 0; i < glows.length; i++) {
                    glows[i].material.opacity = glows[i].userData.maxOp * magicP * pulse;
                    glows[i].scale.setScalar(1 + 0.06 * Math.sin(time * 2.4 + i * 1.1));
                }
                const partsOn = magicP > 0.02;
                for (const g of magicParts) {
                    g.visible = partsOn;
                    if (!partsOn) continue;
                    const b = g.userData.p;
                    const th = time * b.sp + b.ph;
                    g.position.set(
                        b.cx + Math.sin(th * 0.6) * 0.15,
                        b.y0 + Math.sin(th) * b.bob,
                        b.cz + Math.cos(th * 0.5) * 0.12
                    );
                    g.rotation.y += b.rs;
                    let tw;
                    if (g.userData.vivid) {
                        tw = Math.max(0.05, Math.pow(Math.abs(Math.sin(time * 3.4 + b.ph * 11)), 2.5) * 1.25);
                    } else if (g.userData.sharp) {
                        tw = Math.max(0.12, Math.pow(Math.abs(Math.sin(time * 2.2 + b.ph * 7)), 3) * 1.15);
                    } else if (g.userData.nebula) {
                        tw = 0.75 + 0.25 * Math.sin(time * 0.8 + b.ph * 3);
                    } else {
                        tw = 0.7 + 0.4 * Math.sin(time * 2.0 + b.ph * 5);
                    }
                    g.scale.setScalar(Math.max(0.001, magicP * (0.8 + 0.35 * tw)));
                    if (g.userData.halo) {
                        g.userData.halo.h1.material.opacity = g.userData.halo.opIn * tw * magicP;
                        g.userData.halo.h2.material.opacity = g.userData.halo.opOut * tw * magicP;
                    }
                    if (g.userData.spikes) {
                        g.userData.spikes.opacity = 0.85 * tw * magicP;
                    }
                    if (g.userData.cluster) {
                        for (const c of g.userData.cluster) {
                            const a = time * 0.5 + c.ph;
                            c.g.position.set(Math.cos(a) * 0.030, Math.sin(a * 0.8) * 0.008, Math.sin(a) * 0.030);
                        }
                    }
                    if (g.userData.tails) {
                        for (const tl of g.userData.tails) {
                            tl.m.material.opacity = (0.5 / tl.s) * tw * magicP;
                            tl.m.position.set(-Math.sin(th) * 0.045 * tl.s, -Math.cos(th * 0.5) * 0.018 * tl.s, 0);
                        }
                    }
                }
                fireP += ((fireLit ? 1 : 0) - fireP) * 0.016; const fireVisible = fireP > 0.02;
                for (const f of wavyFlames) { f.obj.visible = fireVisible; if (fireVisible) updateWavyFlame(f, time, fireP); }
                for (const sp of sparks) { sp.visible = fireP > 0.05; if (sp.visible) { const prog = (time * 0.22 + sp.userData.phase) % 1; sp.position.set(FX + sp.userData.drift * prog + Math.sin(time * 2.5 + sp.userData.phase * 9) * 0.04, 0.55 + prog * 1.0, FZ + Math.cos(time * 2 + sp.userData.phase * 7) * 0.1); const sc = ((1 - prog) * 0.9 + 0.15) * (0.35 + 0.65 * fireP); sp.scale.set(sc, sc, sc); } }
                for (const p of smokePuffs) { p.visible = fireP > 0.03; if (p.visible) { const prog = (time * 0.25 + p.userData.phase) % 1; const s = (0.5 + prog * 1.6) * fireP; p.scale.set(s, s, s); p.position.set(CHX - prog * 0.7, 7.35 + prog * 1.6, CHZ + Math.sin(time * 2 + p.userData.phase * 10) * 0.08); } }

                lampP += ((lampLit ? 1 : 0) - lampP) * 0.016;
                FILL.uniforms.uLampStrength.value = lampP;
                const lampVisible = lampP > 0.02;
                for (const f of chandelierFlames) { f.obj.visible = lampVisible; if (lampVisible) updateWavyFlame(f, time, lampP * (0.9 + 0.1 * Math.sin(time * 9 + f.phase))); }
                chandelier.rotation.x = Math.sin(time * 0.7) * 0.012;
                chandelier.rotation.z = Math.cos(time * 0.53) * 0.012;
                const lampBreath = 0.9 + 0.1 * Math.sin(time * 2.1);
                lampGlowMatA.opacity = lampP * 0.38 * lampBreath;
                lampGlowMatB.opacity = lampP * 0.13 * (0.9 + 0.1 * Math.sin(time * 2.1 + 1.0));
                lampCrystalMat.color.setRGB(0.45 + 0.55 * lampP, 0.45 + 0.4 * lampP, 0.5 + 0.12 * lampP);
                lampCrystal.rotation.y += 0.012;
                pendant.rotation.y -= 0.008;

                /* ---- 室内点光源：吊挂木灯·坩埚魔火·魔法阵·暖桌·水晶球·蜡烛·星象仪·月光盆栽 ---- */
                ptLantern += ((lanternLit ? 1 : 0) - ptLantern) * 0.07;
                ptKot += ((kotatsuOn ? 1 : 0) - ptKot) * 0.07;
                ptMc += ((mcRun > 0 ? 1 : 0) - ptMc) * 0.055;
                ptCb += ((cbRun > 0 ? 1 : 0) - ptCb) * 0.055;
                ptPlant += ((plantRun > 0 ? 1 : 0) - ptPlant) * 0.055;
                {
                    const PP = FILL.uniforms.uPtPos.value, PC = FILL.uniforms.uPtCol.value, PG = FILL.uniforms.uPtCfg.value;
                    PP[0].set(MTX, 2.52, MTZ); PC[0].set(0xffb066); PG[0].set(4.6, ptLantern, 0.0, 3.04);
                    PP[1].set(CCX, 1.14, CCZ); PC[1].set(0x6fa8ff); PG[1].set(5.6, 0.92, 0.0, 3.04);
                    PP[2].set(MC_X, 0.36, MC_Z); PC[2].set(0x9b6fe8); PG[2].set(5.2, ptMc, 0.0, 3.04);
                    PP[3].set(KOT_X, 0.48, KOT_Z); PC[3].set(0xffa858); PG[3].set(4.2, ptKot * (0.82 + 0.18 * (0.5 + 0.5 * Math.sin(time * 4.2))), 0.0, 3.04);
                    PP[4].set(CBX, 0.88, CBZ); PC[4].set(0xb5a0f2); PG[4].set(3.6, ptCb, 0.0, 3.04);
                    PP[5].set(NSX, FY + 1.00, NSZ); PC[5].set(0xffc06a); PG[5].set(3.6, candleP, 3.02, 6.9);
                    PP[6].set(1.75, TBL_TOP + 0.52, -2.72); PC[6].set(0xffe08a); PG[6].set(4.6, magicP, 3.02, 6.9);
                    PP[7].set(PLX, 0.48, PLZ); PC[7].set(0x9bc0e8); PG[7].set(3.8, ptPlant, 0.0, 3.04);
                }

                if (camShake > 0.002) {
                    camera.position.x += (Math.random() - 0.5) * camShake;
                    camera.position.y += (Math.random() - 0.5) * camShake;
                    camera.position.z += (Math.random() - 0.5) * camShake;
                    camShake *= Math.exp(-3.2 * dt);
                }

                renderer.render(scene, camera);
            }
            animate(0);
            addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
