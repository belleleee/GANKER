'use strict';

const COLORING_PALETTE = [
    '#f7f1df', '#c88057', '#b88761', '#75583f', '#f2c76b', '#d98778',
    '#829d68', '#5f8c7b', '#70a8af', '#629ba7', '#9a8fbd', '#a9848d',
    '#f4eedb', '#b8b2a3', '#2f352d', '#ffcf85', '#9eb48a', '#6f9a55'
];

const coloringState = {
    active: false,
    color: COLORING_PALETTE[1],
    paintMap: {},
    history: [],
    meshSeq: 0,
    ready: false
};

const COLORING_IGNORE_OPACITY = 0.06;
const COLORING_TMP = new THREE.Vector2();
const coloringRaycaster = new THREE.Raycaster();

function normalizeColorHex(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
    return null;
}

function materialTintHex(material) {
    if (!material) return null;
    if (material.uniforms) {
        const tint = material.uniforms.uTint && material.uniforms.uTint.value;
        const color = material.uniforms.uColor && material.uniforms.uColor.value;
        if (tint && tint.isColor) return '#' + tint.getHexString();
        if (color && color.isColor) return '#' + color.getHexString();
    }
    if (material.color && material.color.isColor) return '#' + material.color.getHexString();
    return null;
}

function canPaintMaterial(material) {
    if (!material || material.visible === false) return false;
    if (material.transparent && Number(material.opacity) <= COLORING_IGNORE_OPACITY) return false;
    return !!materialTintHex(material);
}

function meshPrimaryMaterial(mesh) {
    if (!mesh || !mesh.material) return null;
    if (Array.isArray(mesh.material)) {
        return mesh.material.find(canPaintMaterial) || null;
    }
    return canPaintMaterial(mesh.material) ? mesh.material : null;
}

function isPaintableMesh(mesh) {
    if (!mesh || !mesh.isMesh || !mesh.visible || !mesh.geometry) return false;
    if (mesh.userData && (mesh.userData.paintDisabled || mesh.userData.hingeGroup || mesh.userData.magicRoot)) return false;
    return !!meshPrimaryMaterial(mesh);
}

function collectPaintableMeshes() {
    const meshes = [];
    scene.traverse(obj => {
        if (isPaintableMesh(obj)) meshes.push(obj);
    });
    return meshes;
}

function ensurePaintId(mesh) {
    if (!mesh.userData.paintId) {
        coloringState.meshSeq += 1;
        mesh.userData.paintId = 'paint-' + coloringState.meshSeq;
    }
    return mesh.userData.paintId;
}

function clonePaintMaterial(material) {
    const cloned = material.clone();
    if (material.uniforms && cloned.uniforms) {
        cloned.uniforms = {};
        for (const key in material.uniforms) {
            const source = material.uniforms[key];
            if (key === 'uTint' || key === 'uColor') {
                cloned.uniforms[key] = { value: source.value && source.value.clone ? source.value.clone() : source.value };
            } else {
                cloned.uniforms[key] = source;
            }
        }
    }
    cloned.userData = Object.assign({}, material.userData || {});
    cloned.userData.paintClone = true;
    return cloned;
}

function ensureMeshOwnMaterial(mesh) {
    if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(mat => {
            if (!canPaintMaterial(mat)) return mat;
            if (mat.userData && mat.userData.paintClone) return mat;
            return clonePaintMaterial(mat);
        });
        return meshPrimaryMaterial(mesh);
    }
    if (!canPaintMaterial(mesh.material)) return null;
    if (!(mesh.material.userData && mesh.material.userData.paintClone)) {
        mesh.material = clonePaintMaterial(mesh.material);
    }
    return mesh.material;
}

function applyColorToMaterial(material, hex) {
    if (!material) return false;
    if (material.uniforms) {
        if (material.uniforms.uTint && material.uniforms.uTint.value && material.uniforms.uTint.value.isColor) {
            material.uniforms.uTint.value.set(hex);
            material.needsUpdate = true;
            return true;
        }
        if (material.uniforms.uColor && material.uniforms.uColor.value && material.uniforms.uColor.value.isColor) {
            material.uniforms.uColor.value.set(hex);
            material.needsUpdate = true;
            return true;
        }
    }
    if (material.color && material.color.isColor) {
        material.color.set(hex);
        material.needsUpdate = true;
        return true;
    }
    return false;
}

function setMeshColor(mesh, hex, rememberHistory) {
    const color = normalizeColorHex(hex);
    if (!mesh || !color) return false;
    const material = ensureMeshOwnMaterial(mesh);
    if (!material) return false;
    const paintId = ensurePaintId(mesh);
    const before = coloringState.paintMap[paintId] || materialTintHex(material);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let changed = false;
    for (const mat of materials) {
        if (canPaintMaterial(mat)) changed = applyColorToMaterial(mat, color) || changed;
    }
    if (!changed) return false;
    coloringState.paintMap[paintId] = color;
    if (rememberHistory && before && before !== color) {
        coloringState.history.push({ paintId, before, after: color });
        coloringState.history = coloringState.history.slice(-30);
    }
    updateColoringStatus('已上色：' + color);
    updateColoringUndoState();
    return true;
}

function findPaintMeshById(paintId) {
    let found = null;
    scene.traverse(obj => {
        if (!found && obj.userData && obj.userData.paintId === paintId) found = obj;
    });
    return found;
}

function restoreMeshDefault(mesh) {
    if (!mesh || !mesh.userData || !mesh.userData.paintOriginal) return false;
    const original = mesh.userData.paintOriginal;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (let i = 0; i < materials.length; i++) {
        const hex = original[i];
        if (hex && canPaintMaterial(materials[i])) applyColorToMaterial(materials[i], hex);
    }
    if (mesh.userData.paintId) delete coloringState.paintMap[mesh.userData.paintId];
    return true;
}

function rememberOriginalColor(mesh) {
    if (!mesh || !mesh.material || mesh.userData.paintOriginal) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mesh.userData.paintOriginal = materials.map(materialTintHex);
}

function initColoringMeshes() {
    if (!scene || coloringState.ready) return;
    coloringState.ready = true;
    collectPaintableMeshes().forEach(mesh => {
        ensurePaintId(mesh);
        rememberOriginalColor(mesh);
    });
}

function applySavedColoring() {
    initColoringMeshes();
    for (const paintId in coloringState.paintMap) {
        const mesh = findPaintMeshById(paintId);
        if (mesh) setMeshColor(mesh, coloringState.paintMap[paintId], false);
    }
}

function captureColoringState() {
    initColoringMeshes();
    return {
        colors: Object.assign({}, coloringState.paintMap)
    };
}

function applyColoringState(saved) {
    coloringState.paintMap = {};
    coloringState.history = [];
    if (saved && saved.colors && typeof saved.colors === 'object') {
        for (const key in saved.colors) {
            const color = normalizeColorHex(saved.colors[key]);
            if (color) coloringState.paintMap[key] = color;
        }
    }
    applySavedColoring();
    updateColoringUndoState();
}

function updateColoringStatus(text) {
    const status = document.getElementById('coloringStatus');
    if (status) status.textContent = text;
}

function updateColoringUndoState() {
    const undo = document.getElementById('coloringUndoBtn');
    if (undo) undo.disabled = coloringState.history.length === 0;
}

function setColoringActive(active) {
    coloringState.active = !!active;
    const panel = document.getElementById('coloringPanel');
    if (panel) panel.hidden = !coloringState.active;
    document.body.classList.toggle('coloringModeActive', coloringState.active);
    if (coloringState.active) {
        initColoringMeshes();
        updateColoringStatus('选择颜色后，点击画面里的物件即可上色。');
    }
}

function selectColoringColor(hex) {
    const color = normalizeColorHex(hex);
    if (!color) return;
    coloringState.color = color;
    document.querySelectorAll('.coloringSwatch').forEach(btn => {
        btn.classList.toggle('isSelected', btn.dataset.color === color);
    });
    const custom = document.getElementById('coloringCustomInput');
    if (custom) custom.value = color;
}

function handleColoringPick(event) {
    if (!coloringState.active || window.APP_SHELL_BLOCK_GAME) return false;
    if (event.target !== renderer.domElement) return false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    initColoringMeshes();
    COLORING_TMP.x = (event.clientX / innerWidth) * 2 - 1;
    COLORING_TMP.y = -(event.clientY / innerHeight) * 2 + 1;
    coloringRaycaster.setFromCamera(COLORING_TMP, camera);
    const hits = coloringRaycaster
        .intersectObjects(collectPaintableMeshes(), false)
        .filter(hit => ancestorVisible(hit.object));
    if (!hits.length) {
        updateColoringStatus('这里暂时不能上色，换一个家具、墙面或作物试试。');
        return true;
    }
    setMeshColor(hits[0].object, coloringState.color, true);
    if (typeof window.noteAchievementEvent === 'function') {
        window.noteAchievementEvent('interaction', { label: '给画面上色', magic: false });
    }
    SND.play('ui');
    return true;
}

function blockColoringPointer(event) {
    if (!coloringState.active || window.APP_SHELL_BLOCK_GAME) return;
    if (event.target !== renderer.domElement) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
}

function setupColoringUi() {
    const openBtn = document.getElementById('coloringMenuBtn');
    const closeBtn = document.getElementById('closeColoringBtn');
    const palette = document.getElementById('coloringPalette');
    const custom = document.getElementById('coloringCustomInput');
    const undo = document.getElementById('coloringUndoBtn');
    const reset = document.getElementById('coloringResetBtn');
    if (!openBtn || !closeBtn || !palette || !custom || !undo || !reset) return;

    palette.innerHTML = COLORING_PALETTE.map(color =>
        '<button class="coloringSwatch" type="button" data-color="' + color + '" style="--swatch:' + color + '" aria-label="选择颜色 ' + color + '"></button>'
    ).join('');
    palette.addEventListener('click', event => {
        const btn = event.target.closest('.coloringSwatch');
        if (!btn) return;
        selectColoringColor(btn.dataset.color);
        SND.play('ui');
    });
    custom.addEventListener('input', () => selectColoringColor(custom.value));
    openBtn.addEventListener('click', () => {
        SND.play('ui');
        setColoringActive(!coloringState.active);
    });
    closeBtn.addEventListener('click', () => {
        SND.play('ui');
        setColoringActive(false);
    });
    undo.addEventListener('click', () => {
        const entry = coloringState.history.pop();
        if (!entry) return;
        const mesh = findPaintMeshById(entry.paintId);
        if (mesh) setMeshColor(mesh, entry.before, false);
        updateColoringStatus('已撤销上一笔颜色。');
        updateColoringUndoState();
        SND.play('ui');
    });
    reset.addEventListener('click', () => {
        initColoringMeshes();
        collectPaintableMeshes().forEach(restoreMeshDefault);
        coloringState.paintMap = {};
        coloringState.history = [];
        updateColoringStatus('画面颜色已恢复默认。');
        updateColoringUndoState();
        SND.play('ui');
    });
    selectColoringColor(coloringState.color);
    updateColoringUndoState();
}

renderer.domElement.addEventListener('pointerdown', blockColoringPointer, true);
renderer.domElement.addEventListener('pointermove', blockColoringPointer, true);
renderer.domElement.addEventListener('pointercancel', blockColoringPointer, true);
renderer.domElement.addEventListener('pointerup', handleColoringPick, true);
addEventListener('keydown', event => {
    if (event.key === 'Escape' && coloringState.active) {
        setColoringActive(false);
    }
});
setupColoringUi();

window.captureColoringState = captureColoringState;
window.applyColoringState = applyColoringState;
