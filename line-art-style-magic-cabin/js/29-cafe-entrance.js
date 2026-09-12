'use strict';

/* ==========================================================
   29-cafe-entrance.js
   LINE ART CAFE ENTRANCE
   ========================================================== */

(function () {
    const CX = Number.isFinite(window.CAFE_HOUSE_CX) ? window.CAFE_HOUSE_CX : 16.25;
    const CZ = Number.isFinite(window.CAFE_HOUSE_CZ) ? window.CAFE_HOUSE_CZ : -10.0;
    const CAFE_SCALE = 0.85;
    const HALF = 2.05;
    const WALL_TOP_LOCAL = 2.38;
    const LOG_R_LOCAL = 0.078;
    const LOG_GAP_LOCAL = 0.15;
    const ROOF_RIDGE_Y = 3.55;
    const ROOF_EAVE_Y = 2.35;
    const ROOF_EAVE_X = 2.35;
    const ROOF_SPAN = HALF * 2 + 0.72;
    const DOOR_HOLE_LOCAL = { c: 0, hw: 0.48, y0: 0.05, y1: 1.65 };
    const WIN_FRONT_L = { c: -1.24, hw: 0.32, y0: 0.86, y1: 1.42 };
    const WIN_FRONT_R = { c: 1.24, hw: 0.32, y0: 0.86, y1: 1.42 };
    const WIN_SIDE = { c: -0.72, hw: 0.34, y0: 0.86, y1: 1.42 };

    function addLocalLog(parent, len, r, x, y, z, rx, ry, rz) {
        return put(log(len, r || LOG_R_LOCAL), x, y, z, rx || 0, ry || 0, rz || 0, parent);
    }

    function logWallLocal(parent, along, fixed, halfLen, openings, cornerExt) {
        const g = new THREE.Group();
        const nLogs = Math.floor(WALL_TOP_LOCAL / LOG_GAP_LOCAL);
        for (let i = 0; i <= nLogs; i++) {
            const y = LOG_R_LOCAL + i * LOG_GAP_LOCAL;
            if (y > WALL_TOP_LOCAL) break;
            let segs = [[-halfLen - (cornerExt || 0), halfLen + (cornerExt || 0)]];
            for (const op of openings) {
                if (y > op.y0 && y < op.y1) {
                    const next = [];
                    for (const [a, b] of segs) {
                        const lo = op.c - op.hw;
                        const hi = op.c + op.hw;
                        if (hi <= a || lo >= b) {
                            next.push([a, b]);
                            continue;
                        }
                        if (lo > a) next.push([a, lo]);
                        if (hi < b) next.push([hi, b]);
                    }
                    segs = next;
                }
            }
            for (const [a, b] of segs) {
                if (b - a < 0.15) continue;
                const L = log(b - a, LOG_R_LOCAL);
                if (along === 'x') {
                    L.rotation.z = Math.PI / 2;
                    L.position.set((a + b) / 2, y, fixed);
                } else {
                    L.rotation.x = Math.PI / 2;
                    L.position.set(fixed, y, (a + b) / 2);
                }
                g.add(L);
            }
        }
        parent.add(g);
        return g;
    }

    function logGableLocal(parent, z) {
        const g = new THREE.Group();
        let y = WALL_TOP_LOCAL + LOG_R_LOCAL;
        while (true) {
            const halfW = HALF * (ROOF_RIDGE_Y - 0.16 - y) / (ROOF_RIDGE_Y - 0.16 - WALL_TOP_LOCAL);
            if (halfW < 0.25) break;
            const L = log(halfW * 2, LOG_R_LOCAL);
            L.rotation.z = Math.PI / 2;
            L.position.set(0, y, z);
            g.add(L);
            y += LOG_GAP_LOCAL;
        }
        parent.add(g);
        return g;
    }

    function makeDoor() {
        const doorGroup = new THREE.Group();
        const doorShape = new THREE.Shape();
        doorShape.moveTo(-0.44, 0);
        doorShape.lineTo(-0.44, 1.02);
        doorShape.absarc(0, 1.02, 0.44, Math.PI, 0, true);
        doorShape.lineTo(0.44, 0);
        doorShape.lineTo(-0.44, 0);
        put(edge(new THREE.ExtrudeGeometry(doorShape, { depth: 0.055, bevelEnabled: false }).translate(0.44, 0, 0)), 0, 0, 0, 0, 0, 0, doorGroup);
        for (const px of [0.17, 0.34, 0.51, 0.68]) {
            put(line([[px, 0.04, 0.07], [px, 1.02, 0.07]]), 0, 0, 0, 0, 0, 0, doorGroup);
        }
        put(box(0.15, 0.05, 0.035), 0.08, 0.35, 0.07, 0, 0, 0, doorGroup);
        put(edge(new THREE.TorusGeometry(0.045, 0.012, 6, 16)), 0.74, 0.65, 0.08, 0, 0, 0, doorGroup);
        doorGroup.position.set(-0.44, 0, -HALF - 0.05);
        return doorGroup;
    }

    function makeSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff8ec';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#33251d';
        ctx.lineWidth = 10;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        ctx.fillStyle = '#33251d';
        ctx.font = 'bold 58px "Songti SC","STSong","PingFang SC",serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('线稿咖啡馆', 256, 82);
        ctx.font = 'bold 24px "Menlo","Consolas",monospace';
        ctx.fillText('CAFE SHIFT', 256, 135);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function enterCafe() {
        if (typeof window.noteAchievementEvent === 'function') {
            window.noteAchievementEvent('enterCafe');
        }
        if (typeof window.prepareStoreReturn === 'function') window.prepareStoreReturn();
        else if (typeof saveGameState === 'function') saveGameState(false);
        window.location.href = './line-art-cafe/index.html';
    }

    const cafe = new THREE.Group();
    cafe.position.set(CX, 0, CZ);
    cafe.rotation.y = Math.PI;
    cafe.scale.setScalar(CAFE_SCALE);
    scene.add(cafe);

    put(box(HALF * 2 + 0.32, 0.09, HALF * 2 + 0.32), 0, 0.045, 0, 0, 0, 0, cafe);
    logWallLocal(cafe, 'x', -HALF, HALF, [DOOR_HOLE_LOCAL, WIN_FRONT_L, WIN_FRONT_R], 0.12);
    logWallLocal(cafe, 'z', -HALF, HALF, [WIN_SIDE], 0.12);
    logWallLocal(cafe, 'z', HALF, HALF, [], 0.12);
    logWallLocal(cafe, 'x', HALF, HALF, [{ c: 0.74, hw: 0.34, y0: 0.86, y1: 1.42 }], 0.12);
    logGableLocal(cafe, -HALF);
    logGableLocal(cafe, HALF);

    const roofAng = Math.atan2(ROOF_RIDGE_Y - ROOF_EAVE_Y, ROOF_EAVE_X);
    const slopeLen = Math.hypot(ROOF_EAVE_X, ROOF_RIDGE_Y - ROOF_EAVE_Y);
    put(box(slopeLen, 0.07, ROOF_SPAN), -ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.03, 0, 0, 0, roofAng, cafe);
    put(box(slopeLen, 0.07, ROOF_SPAN), ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.03, 0, 0, -roofAng, cafe);
    addLocalLog(cafe, ROOF_SPAN, 0.07, 0, ROOF_RIDGE_Y + 0.04, 0, Math.PI / 2, 0, 0);
    for (let t = 0.16; t < 0.96; t += 0.16) {
        put(log(ROOF_SPAN, 0.055), -ROOF_EAVE_X + t * ROOF_EAVE_X, ROOF_EAVE_Y + t * (ROOF_RIDGE_Y - ROOF_EAVE_Y) + 0.08, 0, Math.PI / 2, 0, 0, cafe);
        put(log(ROOF_SPAN, 0.055), ROOF_EAVE_X - t * ROOF_EAVE_X, ROOF_EAVE_Y + t * (ROOF_RIDGE_Y - ROOF_EAVE_Y) + 0.08, 0, Math.PI / 2, 0, 0, cafe);
    }
    put(log(HALF * 2 + 0.44, 0.075), 0, ROOF_EAVE_Y - 0.07, -HALF - 0.28, 0, 0, Math.PI / 2, cafe);

    if (typeof squareWindow === 'function') {
        squareWindow(WIN_FRONT_L.c, 1.14, -HALF - 0.02, '-z', 0.56, 0.52, WIN_FRONT_L.hw, cafe);
        squareWindow(WIN_FRONT_R.c, 1.14, -HALF - 0.02, '-z', 0.56, 0.52, WIN_FRONT_R.hw, cafe);
        squareWindow(-HALF - 0.02, 1.14, WIN_SIDE.c, '-x', 0.58, 0.52, WIN_SIDE.hw, cafe);
    }

    cafe.add(makeDoor());

    const signGroup = new THREE.Group();
    signGroup.position.set(0, 2.08, -HALF - 0.32);
    cafe.add(signGroup);
    const signTex = makeSignTexture();
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.58), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    signGroup.add(signBoard);
    signGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.58, 0.61, 0.02)), MAT));

    const cup = new THREE.Group();
    cup.position.set(-1.35, 0.1, -HALF - 0.75);
    cafe.add(cup);
    put(edge(new THREE.CylinderGeometry(0.20, 0.17, 0.28, 16)), 0, 0.14, 0, 0, 0, 0, cup);
    put(edge(new THREE.TorusGeometry(0.09, 0.018, 6, 14)), 0.20, 0.16, 0, 0, Math.PI / 2, 0, cup);
    put(edge(new THREE.CircleGeometry(0.17, 16)), 0, 0.285, 0, -Math.PI / 2, 0, 0, cup);
    for (let i = 0; i < 3; i++) {
        const steam = line([[0, 0, 0], [0.03, 0.12, 0], [-0.01, 0.24, 0]]);
        steam.position.set(-0.08 + i * 0.08, 0.34, 0);
        cup.add(steam);
    }

    for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const x = 13.65 + (CX - 13.65) * t;
        const z = -7.2 + (CZ + HALF * CAFE_SCALE + 0.70 + 7.2) * t;
        const stone = box(0.64, 0.045, 0.42);
        stone.position.set(x + Math.sin(i * 1.1) * 0.18, 0.027, z + Math.cos(i * 0.9) * 0.12);
        stone.rotation.y = Math.sin(i * 0.8) * 0.4;
        scene.add(stone);
    }

    const doorHit = put(edge(new THREE.BoxGeometry(1.14, 1.68, 0.12)), 0, 0.84, -HALF - 0.09, 0, 0, 0, cafe);
    doorHit.traverse(o => {
        if (o.isMesh) {
            o.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.01 });
        }
        if (o.isLineSegments) o.visible = false;
    });
    doorHit.userData.aimLabel = '进入线稿咖啡馆';
    signGroup.userData.aimLabel = '进入线稿咖啡馆';
    if (typeof regMagic === 'function') {
        regMagic(doorHit, enterCafe);
        regMagic(signGroup, enterCafe);
    }

    if (Array.isArray(solidBoxes)) {
        const h = HALF * CAFE_SCALE;
        const t = 0.18 * CAFE_SCALE;
        const doorHalf = 0.78 * CAFE_SCALE;
        solidBoxes.push({ x1: CX - h - t, z1: CZ - h, x2: CX - h + t, z2: CZ + h });
        solidBoxes.push({ x1: CX + h - t, z1: CZ - h, x2: CX + h + t, z2: CZ + h });
        solidBoxes.push({ x1: CX - h, z1: CZ - h - t, x2: CX + h, z2: CZ - h + t });
        solidBoxes.push({ x1: CX - h, z1: CZ + h - t, x2: CX - doorHalf, z2: CZ + h + t });
        solidBoxes.push({ x1: CX + doorHalf, z1: CZ + h - t, x2: CX + h, z2: CZ + h + t });
    }
})();
