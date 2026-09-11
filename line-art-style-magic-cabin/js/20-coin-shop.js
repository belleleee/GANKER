'use strict';

/* ==========================================================
   20-coin-shop.js
   FOREST COIN SHOP ENTRANCE
   ========================================================== */

(function () {
    const CX = Number.isFinite(window.COIN_SHOP_CX) ? window.COIN_SHOP_CX : -18.0;
    const CZ = Number.isFinite(window.COIN_SHOP_CZ) ? window.COIN_SHOP_CZ : 8.2;
    const HALF = 2.35;
    const WALL_TOP_LOCAL = 2.65;
    const LOG_R_LOCAL = 0.085;
    const LOG_GAP_LOCAL = 0.155;
    const ROOF_RIDGE_Y = 3.95;
    const ROOF_EAVE_Y = 2.62;
    const ROOF_EAVE_X = 2.65;
    const ROOF_SPAN = HALF * 2 + 0.75;
    const DOOR_HOLE_LOCAL = { c: 0, hw: 0.48, y0: 0.05, y1: 1.72 };
    const WIN_FRONT_L = { c: -1.42, hw: 0.38, y0: 0.82, y1: 1.48 };
    const WIN_FRONT_R = { c: 1.42, hw: 0.38, y0: 0.82, y1: 1.48 };
    const WIN_SIDE = { c: -0.8, hw: 0.38, y0: 0.82, y1: 1.48 };
    const WIN_GABLE_LOCAL = { c: 0, hw: 0.34, y0: 3.08, y1: 3.55 };

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

    function logGableLocal(parent, z, openings) {
        const g = new THREE.Group();
        let y = WALL_TOP_LOCAL + LOG_R_LOCAL;
        while (true) {
            const halfW = HALF * (ROOF_RIDGE_Y - 0.15 - y) / (ROOF_RIDGE_Y - 0.15 - WALL_TOP_LOCAL);
            if (halfW < 0.25) break;
            let segs = [[-halfW, halfW]];
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
                    segs = next.filter(seg => seg.length === 2 && seg[1] - seg[0] >= 0.15);
                }
            }
            for (const [a, b] of segs) {
                const L = log(b - a, LOG_R_LOCAL);
                L.rotation.z = Math.PI / 2;
                L.position.set((a + b) / 2, y, z);
                g.add(L);
            }
            y += LOG_GAP_LOCAL;
        }
        parent.add(g);
        return g;
    }

    function makeDoor() {
        const doorGroup = new THREE.Group();
        const doorShape = new THREE.Shape();
        doorShape.moveTo(-0.44, 0);
        doorShape.lineTo(-0.44, 1.08);
        doorShape.absarc(0, 1.08, 0.44, Math.PI, 0, true);
        doorShape.lineTo(0.44, 0);
        doorShape.lineTo(-0.44, 0);
        put(edge(new THREE.ExtrudeGeometry(doorShape, { depth: 0.055, bevelEnabled: false }).translate(0.44, 0, 0)), 0, 0, 0, 0, 0, 0, doorGroup);
        for (const px of [0.17, 0.34, 0.51, 0.68]) {
            put(line([[px, 0.04, 0.07], [px, 1.08, 0.07]]), 0, 0, 0, 0, 0, 0, doorGroup);
        }
        put(box(0.15, 0.05, 0.035), 0.08, 0.35, 0.07, 0, 0, 0, doorGroup);
        put(edge(new THREE.TorusGeometry(0.045, 0.012, 6, 16)), 0.74, 0.68, 0.08, 0, 0, 0, doorGroup);
        doorGroup.position.set(-0.44, 0, -HALF - 0.05);
        return doorGroup;
    }

    function makeSignTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 10;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 58px "Songti SC","STSong","PingFang SC",serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('钱滚钱商店', 256, 96);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function enterCoinShop() {
        const go = () => {
            if (typeof window.prepareStoreReturn === 'function') window.prepareStoreReturn();
            else if (typeof saveGameState === 'function') saveGameState(false);
            window.location.href = 'coin-game/index.html';
        };
        if (typeof window.requestMainStoryAccess === 'function') window.requestMainStoryAccess('coin', go);
        else go();
    }

    const shop = new THREE.Group();
    shop.position.set(CX, 0, CZ);
    scene.add(shop);

    put(box(HALF * 2 + 0.35, 0.09, HALF * 2 + 0.35), 0, 0.045, 0, 0, 0, 0, shop);
    logWallLocal(shop, 'x', -HALF, HALF, [DOOR_HOLE_LOCAL, WIN_FRONT_L, WIN_FRONT_R], 0.12);
    logWallLocal(shop, 'z', -HALF, HALF, [WIN_SIDE], 0.12);
    logWallLocal(shop, 'z', HALF, HALF, [], 0.12);
    logWallLocal(shop, 'x', HALF, HALF, [{ c: 0.75, hw: 0.38, y0: 0.82, y1: 1.48 }], 0.12);
    logGableLocal(shop, -HALF, [WIN_GABLE_LOCAL]);
    logGableLocal(shop, HALF, []);

    const roofAng = Math.atan2(ROOF_RIDGE_Y - ROOF_EAVE_Y, ROOF_EAVE_X);
    const slopeLen = Math.hypot(ROOF_EAVE_X, ROOF_RIDGE_Y - ROOF_EAVE_Y);
    put(box(slopeLen, 0.07, ROOF_SPAN), -ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.03, 0, 0, 0, roofAng, shop);
    put(box(slopeLen, 0.07, ROOF_SPAN), ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.03, 0, 0, -roofAng, shop);
    addLocalLog(shop, ROOF_SPAN, 0.07, 0, ROOF_RIDGE_Y + 0.04, 0, Math.PI / 2, 0, 0);
    for (let t = 0.14; t < 0.96; t += 0.145) {
        put(log(ROOF_SPAN, 0.06), -ROOF_EAVE_X + t * ROOF_EAVE_X, ROOF_EAVE_Y + t * (ROOF_RIDGE_Y - ROOF_EAVE_Y) + 0.08, 0, Math.PI / 2, 0, 0, shop);
        put(log(ROOF_SPAN, 0.06), ROOF_EAVE_X - t * ROOF_EAVE_X, ROOF_EAVE_Y + t * (ROOF_RIDGE_Y - ROOF_EAVE_Y) + 0.08, 0, Math.PI / 2, 0, 0, shop);
    }
    put(log(slopeLen + 0.1, 0.07), -ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.02, -HALF - 0.28, 0, 0, roofAng - Math.PI / 2, shop);
    put(log(slopeLen + 0.1, 0.07), ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 + 0.02, -HALF - 0.28, 0, 0, -(roofAng - Math.PI / 2), shop);
    put(log(HALF * 2 + 0.45, 0.08), 0, ROOF_EAVE_Y - 0.07, -HALF - 0.28, 0, 0, Math.PI / 2, shop);
    put(edge(new THREE.CircleGeometry(0.07, 8)), 0, ROOF_RIDGE_Y + 0.04, -HALF - 0.31, 0, Math.PI / 2, 0, shop);
    for (const zs of [HALF + 0.15, -HALF - 0.15]) {
        put(box(slopeLen - 0.08, 0.04, 0.34), -ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 - 0.02, zs, 0, 0, roofAng, shop);
        put(box(slopeLen - 0.08, 0.04, 0.34), ROOF_EAVE_X / 2, (ROOF_EAVE_Y + ROOF_RIDGE_Y) / 2 - 0.02, zs, 0, 0, -roofAng, shop);
    }

    if (typeof squareWindow === 'function') {
        squareWindow(WIN_FRONT_L.c, 1.14, -HALF - 0.02, '-z', 0.64, 0.58, WIN_FRONT_L.hw, shop);
        squareWindow(WIN_FRONT_R.c, 1.14, -HALF - 0.02, '-z', 0.64, 0.58, WIN_FRONT_R.hw, shop);
        squareWindow(-HALF - 0.02, 1.14, WIN_SIDE.c, '-x', 0.64, 0.58, WIN_SIDE.hw, shop);
        squareWindow(WIN_GABLE_LOCAL.c, 3.32, -HALF - 0.02, '-z', 0.56, 0.46, WIN_GABLE_LOCAL.hw, shop, WIN_GLASS_UP);
    }

    const doorGroup = makeDoor();
    shop.add(doorGroup);

    const signGroup = new THREE.Group();
    signGroup.position.set(0, 2.28, -HALF - 0.32);
    shop.add(signGroup);
    const signTex = makeSignTexture();
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.54), new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    signGroup.add(signBoard);
    signGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.48, 0.57, 0.02)), MAT));

    for (let i = 0; i < 8; i++) {
        const t = i / 7;
        const x = CX * t;
        const z = 5.2 + (CZ - 5.2) * t;
        const stone = box(0.72, 0.045, 0.46);
        stone.position.set(x + Math.sin(i * 1.7) * 0.25, 0.027, z);
        stone.rotation.y = Math.sin(i * 0.9) * 0.45;
        scene.add(stone);
    }

    const cutSpots = [[-3.0, -1.4], [-2.35, 1.75], [2.75, 1.2], [2.8, -1.2]];
    for (const [x, z] of cutSpots) {
        put(edge(new THREE.CylinderGeometry(0.22, 0.28, 0.36, 9)), x, 0.18, z, 0, Math.random() * Math.PI, 0, shop);
        put(edge(new THREE.CircleGeometry(0.18, 9)), x, 0.365, z, -Math.PI / 2, 0, 0, shop);
    }

    const doorHit = put(edge(new THREE.BoxGeometry(1.1, 1.7, 0.12)), 0, 0.86, -HALF - 0.09, 0, 0, 0, shop);
    doorHit.traverse(o => {
        if (o.isMesh) {
            o.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.01 });
        }
        if (o.isLineSegments) o.visible = false;
    });
    doorHit.userData.aimLabel = '进入钱滚钱商店';
    signGroup.userData.aimLabel = '进入钱滚钱商店';
    if (typeof regMagic === 'function') {
        regMagic(doorHit, enterCoinShop);
        regMagic(signGroup, enterCoinShop);
    }

    if (Array.isArray(solidBoxes)) {
        const t = 0.18;
        solidBoxes.push({ x1: CX - HALF - t, z1: CZ - HALF, x2: CX - HALF + t, z2: CZ + HALF });
        solidBoxes.push({ x1: CX + HALF - t, z1: CZ - HALF, x2: CX + HALF + t, z2: CZ + HALF });
        solidBoxes.push({ x1: CX - HALF, z1: CZ + HALF - t, x2: CX + HALF, z2: CZ + HALF + t });
        solidBoxes.push({ x1: CX - HALF, z1: CZ - HALF - t, x2: CX - 0.7, z2: CZ - HALF + t });
        solidBoxes.push({ x1: CX + 0.7, z1: CZ - HALF - t, x2: CX + HALF, z2: CZ - HALF + t });
    }
})();
