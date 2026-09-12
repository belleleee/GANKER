'use strict';

/* ================================================================
   代销小摊 · 送货订单
   随机刷新的客户（史莱姆形象）出现在森林里，报出想要的作物和数量。
   接单之后，屏幕上会出现一个主线目标风格的箭头，指引玩家找到客户、
   把仓库里囤的作物送过去换钱——这是仓库里那堆作物第一次真正被花掉。
   ================================================================ */

const DELIVERY_MAX_OPEN = 3;
const DELIVERY_SPAWN_MIN_GAP = 35;
const DELIVERY_SPAWN_MAX_GAP = 70;
const DELIVERY_EXPIRE_SECONDS = 260;
const DELIVERY_REWARD_MULT = 1.6;
const DELIVERY_INTERACT_RADIUS = 1.6;

const DELIVERY_CUSTOMER_COLORS = [0xf4a6a0, 0x9fd0f0, 0xc8ecA0, 0xf3d98a, 0xd6a6f0, 0xa0e8d8];

const DELIVERY_SPOTS = [
    { x: 6.5, z: 24.5 }, { x: -9.0, z: 22.0 }, { x: 20.5, z: 6.0 },
    { x: -22.0, z: -6.5 }, { x: 3.0, z: -25.0 }, { x: -5.5, z: -22.5 },
    { x: 25.0, z: -8.0 }, { x: -18.0, z: 18.5 }, { x: 15.0, z: 20.0 },
    { x: -25.0, z: 9.0 }, { x: 10.0, z: -22.0 }, { x: -12.0, z: -24.0 }
];

let deliveryOrders = [];
let deliveryOrderSeq = 1;
let deliverySpawnTimer = 18;
let deliveryBoardTickTimer = 0;

function deliveryClearOfLandmarks(x, z) {
    if (Math.hypot(x - 9.0, z - 0.0) < 7) return false;
    if (Math.hypot(x - (-11.5), z - (-9.0)) < 7) return false;
    if (typeof coinShopClearing === 'function' && coinShopClearing(x, z, 1)) return false;
    if (typeof investmentRoomClearing === 'function' && investmentRoomClearing(x, z, 1)) return false;
    if (typeof cafeHouseClearing === 'function' && cafeHouseClearing(x, z, 1)) return false;
    if (Math.hypot(x, z) < 8) return false;
    return true;
}

function pickDeliverySpot() {
    const taken = deliveryOrders.map(o => ({ x: o.x, z: o.z }));
    const pool = DELIVERY_SPOTS.filter(s =>
        deliveryClearOfLandmarks(s.x, s.z) &&
        taken.every(t => Math.hypot(t.x - s.x, t.z - s.z) > 4)
    );
    if (!pool.length) return null;
    const base = pool[Math.floor(Math.random() * pool.length)];
    return { x: base.x + (Math.random() - 0.5) * 2.2, z: base.z + (Math.random() - 0.5) * 2.2 };
}

function makeDeliveryIconTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 96; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.font = '68px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📦', 48, 52);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}
let deliveryIconTex = null;

function buildDeliveryCustomer(color) {
    const g = new THREE.Group();
    const bodyMat = LITMAT(color, { transparent: true, opacity: 0.88 });
    const body = solid(new THREE.SphereGeometry(0.30, 18, 14), bodyMat);
    body.scale.set(1, 0.82, 1);
    body.position.y = 0.26;
    g.add(body);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2018 });
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), eyeMat);
        eye.position.set(side * 0.11, 0.32, 0.24);
        g.add(eye);
    }
    if (!deliveryIconTex) deliveryIconTex = makeDeliveryIconTexture();
    const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: deliveryIconTex, depthTest: false }));
    icon.scale.set(0.42, 0.42, 1);
    icon.position.y = 0.85;
    icon.userData.bobPhase = Math.random() * Math.PI * 2;
    g.add(icon);
    g.userData.icon = icon;
    g.userData.bob = 0;
    return g;
}

function deliveryCropDef(cropId) {
    return (typeof CROP_TYPES !== 'undefined' && CROP_TYPES[cropId]) ? CROP_TYPES[cropId] : null;
}

function spawnDeliveryOrder() {
    if (deliveryOrders.length >= DELIVERY_MAX_OPEN) return;
    if (typeof CROP_ORDER === 'undefined' || !CROP_ORDER.length) return;
    const spot = pickDeliverySpot();
    if (!spot) return;
    const cropId = CROP_ORDER[Math.floor(Math.random() * CROP_ORDER.length)];
    const crop = deliveryCropDef(cropId);
    if (!crop) return;
    const qty = 1 + Math.floor(Math.random() * 3);
    const reward = Math.max(10, Math.round(crop.harvestCoins * qty * DELIVERY_REWARD_MULT));
    const color = DELIVERY_CUSTOMER_COLORS[Math.floor(Math.random() * DELIVERY_CUSTOMER_COLORS.length)];
    const mesh = buildDeliveryCustomer(color);
    const groundY = typeof groundAt === 'function' ? groundAt(spot.x, spot.z, 0) : 0;
    mesh.position.set(spot.x, groundY, spot.z);
    scene.add(mesh);

    const order = {
        id: deliveryOrderSeq++,
        cropId, qty, reward,
        x: spot.x, z: spot.z,
        mesh,
        accepted: false,
        life: DELIVERY_EXPIRE_SECONDS,
        interactEntry: null
    };
    deliveryOrders.push(order);
    renderDeliveryBoard();
}

function deliveryCropStorageCount(cropId) {
    const crop = deliveryCropDef(cropId);
    if (!crop || typeof cropStorage === 'undefined') return 0;
    return Math.max(0, Number(cropStorage[crop.storageKey]) || 0);
}

function tryFulfillDelivery(order) {
    const have = deliveryCropStorageCount(order.cropId);
    const crop = deliveryCropDef(order.cropId);
    if (!crop) return;
    if (have < order.qty) {
        showHintOverride('仓库里的' + crop.name + '不够——还差 ' + (order.qty - have) + ' 个，先去种/收够了再来');
        if (typeof SND !== 'undefined') SND.play('toggle');
        return;
    }
    cropStorage[crop.storageKey] = have - order.qty;
    if (typeof renderStorage === 'function') renderStorage(true);
    if (typeof window.addCabinCoins === 'function') {
        window.addCabinCoins(order.reward, '送货 · ' + crop.name + ' ×' + order.qty);
    }
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('deliveryDone', { cropId: order.cropId });
    }
    removeDeliveryOrder(order, false);
    showHintOverride('客户收下了' + crop.name + '，客气地道了谢');
    if (typeof SND !== 'undefined') SND.play('chim');
}

function removeDeliveryOrder(order, expired) {
    const idx = deliveryOrders.indexOf(order);
    if (idx >= 0) deliveryOrders.splice(idx, 1);
    if (order.mesh && order.mesh.parent) order.mesh.parent.remove(order.mesh);
    if (order.interactEntry && Array.isArray(interactables)) {
        const eIdx = interactables.indexOf(order.interactEntry);
        if (eIdx >= 0) interactables.splice(eIdx, 1);
    }
    if (expired) {
        if (deliveryActiveTargetId === order.id) deliveryActiveTargetId = null;
        showHintOverride('森林里那位客户等不及，先走了——订单错过了');
    }
    renderDeliveryBoard();
}

function acceptDeliveryOrder(id) {
    const order = deliveryOrders.find(o => o.id === id);
    if (!order || order.accepted) return;
    order.accepted = true;
    const crop = deliveryCropDef(order.cropId);
    const entry = {
        x: order.x, z: order.z, r: DELIVERY_INTERACT_RADIUS,
        label: '送货 · ' + (crop ? crop.name : '作物') + ' ×' + order.qty,
        act: () => tryFulfillDelivery(order)
    };
    order.interactEntry = entry;
    if (Array.isArray(interactables)) interactables.push(entry);
    if (order.mesh && typeof regMagic === 'function') regMagic(order.mesh, () => tryFulfillDelivery(order));
    deliveryActiveTargetId = order.id;
    if (typeof SND !== 'undefined') SND.play('ui');
    renderDeliveryBoard();
}

/* ---------------- 订单板：列出还没接的单 ---------------- */

const deliveryBoard = document.getElementById('deliveryBoard');
const deliveryBoardList = document.getElementById('deliveryBoardList');

function renderDeliveryBoard() {
    if (!deliveryBoard || !deliveryBoardList) return;
    const pending = deliveryOrders.filter(o => !o.accepted);
    if (!pending.length) {
        deliveryBoard.hidden = true;
        return;
    }
    deliveryBoard.hidden = false;
    deliveryBoardList.innerHTML = pending.map(o => {
        const crop = deliveryCropDef(o.cropId);
        return '<div class="deliveryBoardRow">' +
            '<span class="deliveryBoardIcon">' + (crop ? crop.icon : '📦') + '</span>' +
            '<span class="deliveryBoardName">' + (crop ? crop.name : '作物') + ' ×' + o.qty + '</span>' +
            '<span class="deliveryBoardTimer' + (o.life < 40 ? ' urgent' : '') + '">' + deliveryFormatTime(o.life) + '</span>' +
            '<span class="deliveryBoardReward">+' + o.reward + ' 金币</span>' +
            '<button type="button" class="deliveryAcceptBtn" data-order="' + o.id + '">接单</button>' +
            '</div>';
    }).join('');
}

function deliveryFormatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

if (deliveryBoardList) {
    deliveryBoardList.addEventListener('click', event => {
        const btn = event.target.closest('.deliveryAcceptBtn');
        if (!btn) return;
        acceptDeliveryOrder(Number(btn.dataset.order));
    });
}

/* ---------------- 送货箭头：跟主线箭头同款，指向已接的订单 ---------------- */

let deliveryActiveTargetId = null;
const deliveryBanner = document.getElementById('deliveryBanner');
const deliveryArrow = document.getElementById('deliveryArrow');
const deliveryBannerText = document.getElementById('deliveryBannerText');
const deliveryBannerDistance = document.getElementById('deliveryBannerDistance');

function currentDeliveryTarget() {
    if (deliveryActiveTargetId == null) {
        const next = deliveryOrders.find(o => o.accepted);
        deliveryActiveTargetId = next ? next.id : null;
    }
    return deliveryOrders.find(o => o.id === deliveryActiveTargetId && o.accepted) || null;
}

function updateDeliveryBanner() {
    if (!deliveryBanner) return;
    const order = currentDeliveryTarget();
    if (!order || typeof player === 'undefined' || window.APP_SHELL_BLOCK_GAME) {
        deliveryBanner.hidden = true;
        return;
    }
    deliveryBanner.hidden = false;
    const crop = deliveryCropDef(order.cropId);
    deliveryBannerText.textContent = '送 ' + (crop ? crop.name : '作物') + ' ×' + order.qty + ' 给森林里的客户';
    const dx = order.x - player.pos.x;
    const dz = order.z - player.pos.z;
    const dist = Math.hypot(dx, dz);
    deliveryBannerDistance.textContent = Math.round(dist) + ' 米 · 剩 ' + deliveryFormatTime(order.life);
    deliveryBanner.classList.toggle('urgent', order.life < 40);
    const targetAngle = Math.atan2(dx, dz);
    const heading = typeof camYaw === 'number' ? camYaw : (player.yaw || 0);
    let rel = targetAngle - heading;
    rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (deliveryArrow) deliveryArrow.style.transform = 'rotate(' + (rel * 180 / Math.PI) + 'deg)';
}

/* ---------------- 主循环：生成、倒计时、飘浮动画 ---------------- */

function updateDeliveryOrders(dt, time) {
    deliverySpawnTimer -= dt || 0;
    if (deliverySpawnTimer <= 0) {
        deliverySpawnTimer = DELIVERY_SPAWN_MIN_GAP + Math.random() * (DELIVERY_SPAWN_MAX_GAP - DELIVERY_SPAWN_MIN_GAP);
        spawnDeliveryOrder();
    }
    for (let i = deliveryOrders.length - 1; i >= 0; i--) {
        const order = deliveryOrders[i];
        order.life -= dt || 0;
        if (order.mesh) {
            order.mesh.position.y += 0;
            const icon = order.mesh.userData.icon;
            if (icon) icon.position.y = 0.85 + Math.sin((time || 0) * 2 + icon.userData.bobPhase) * 0.05;
            order.mesh.rotation.y += (dt || 0) * 0.6;
        }
        if (order.life <= 0) removeDeliveryOrder(order, true);
    }
    deliveryBoardTickTimer -= dt || 0;
    if (deliveryBoardTickTimer <= 0) {
        deliveryBoardTickTimer = 1;
        renderDeliveryBoard();
    }
    updateDeliveryBanner();
}

window.updateDeliveryOrders = updateDeliveryOrders;
