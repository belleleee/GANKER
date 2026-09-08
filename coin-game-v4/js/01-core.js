'use strict';

/* ==========================================================
   01. CORE
   独立 coin-game 版本，但绘制语法尽量保持原项目：
   edge / box / log / line / put
   ========================================================== */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfdfbf6);
scene.fog = new THREE.Fog(0xfdfbf6, 42, 110);

const camera = new THREE.PerspectiveCamera(
    50,
    innerWidth / innerHeight,
    0.1,
    180
);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(
        devicePixelRatio,
        2
    )
);

renderer.setSize(
    innerWidth,
    innerHeight
);

document.body.appendChild(
    renderer.domElement
);


/* ==========================================================
   原项目式线条 / 填充
   ========================================================== */

const MAT =
    new THREE.LineBasicMaterial({
        color: 0x111111
    });

const IN_MAT =
    new THREE.LineBasicMaterial({
        color: 0x888888
    });

function fillMat(
    hex = 0xffffff,
    opacity = 1
) {
    return new THREE.MeshBasicMaterial({
        color: hex,
        transparent: opacity < 1,
        opacity: opacity,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
}

const FILL = fillMat(0xffffff);

const C = {
    fill: FILL,
    wood: fillMat(0xd7bd91),
    woodDark: fillMat(0xb28b5f),
    floor: fillMat(0xf5ead4),
    cloth: fillMat(0xf4eee3),
    cushion: fillMat(0xe7dcc8),
    green: fillMat(0xa9bb91),
    glass: fillMat(0xffffff, 0.48),
    flame: fillMat(0xffd48b, 0.70),
    halo: fillMat(0xffd78a, 0.11),
    coin: fillMat(0xe5bd54),
    coin2: fillMat(0xb7892b),
    coinDark: fillMat(0xb7892b),
    slime: fillMat(0x84cfb1, 0.40),
    slimeMid: fillMat(0xb2e0ce, 0.28),
    slimeCore: fillMat(0x5aa083, 0.56),
    dark: fillMat(0x30372f)
};

const V = (
    x,
    y,
    z
) =>
    new THREE.Vector3(
        x,
        y,
        z
    );

function geo(
    pts
) {
    return new THREE.BufferGeometry()
        .setFromPoints(
            pts.map(
                p =>
                    V(
                        p[0],
                        p[1],
                        p[2]
                    )
            )
        );
}

function line(
    pts,
    mat = MAT
) {
    return new THREE.Line(
        geo(pts),
        mat
    );
}

function edge(
    g,
    material = C.fill,
    threshold = 1,
    lmat = MAT
) {
    const grp =
        new THREE.Group();

    grp.add(
        new THREE.Mesh(
            g,
            material
        )
    );

    grp.add(
        new THREE.LineSegments(
            new THREE.EdgesGeometry(
                g,
                threshold
            ),
            lmat
        )
    );

    return grp;
}

function box(
    w,
    h,
    d,
    material = C.fill
) {
    return edge(
        new THREE.BoxGeometry(
            w,
            h,
            d
        ),
        material
    );
}

function log(
    len,
    r = 0.15,
    material = C.fill
) {
    return edge(
        new THREE.CylinderGeometry(
            r,
            r,
            len,
            8
        ),
        material
    );
}

function put(
    o,
    x,
    y,
    z,
    rx = 0,
    ry = 0,
    rz = 0,
    parent = scene
) {
    o.position.set(
        x,
        y,
        z
    );

    o.rotation.set(
        rx,
        ry,
        rz
    );

    parent.add(
        o
    );

    return o;
}

function clamp(
    v,
    a,
    b
) {
    return Math.max(
        a,
        Math.min(
            b,
            v
        )
    );
}


/* ==========================================================
   独立场景交互
   仿原项目 regMagic：Mesh -> root -> onClick
   ========================================================== */

const roomInteractMeshes = [];

function regRoomInteract(
    root,
    label,
    onClick,
    force = false
) {
    root.userData.aimLabel =
        label;

    root.userData.onClick =
        onClick;

    root.traverse(
        o => {
            if (
                o.isMesh &&
                !o.userData.noHit
            ) {
                if (
                    force ||
                    !o.userData.roomRoot
                ) {
                    o.userData.roomRoot =
                        root;
                }

                if (
                    !roomInteractMeshes
                        .includes(o)
                ) {
                    roomInteractMeshes.push(
                        o
                    );
                }
            }
        }
    );

    return root;
}

const roomRaycaster =
    new THREE.Raycaster();

const roomPointer =
    new THREE.Vector2();

renderer.domElement.addEventListener(
    'click',
    e => {
        const rect =
            renderer.domElement
                .getBoundingClientRect();

        roomPointer.x =
            (
                (
                    e.clientX -
                    rect.left
                ) /
                rect.width
            ) *
            2 -
            1;

        roomPointer.y =
            -(
                (
                    e.clientY -
                    rect.top
                ) /
                rect.height
            ) *
            2 +
            1;

        roomRaycaster.setFromCamera(
            roomPointer,
            camera
        );

        const hits =
            roomRaycaster.intersectObjects(
                roomInteractMeshes,
                false
            );

        if (
            !hits.length
        ) {
            return;
        }

        const root =
            hits[0]
                .object
                .userData
                .roomRoot;

        if (
            root &&
            typeof root.userData.onClick ===
                'function'
        ) {
            root.userData.onClick();
        }
    }
);


/* ==========================================================
   相机
   ========================================================== */

let camYaw =
    0.04;

let camPitch =
    0.25;

let dragging =
    false;

let lastX =
    0;

let lastY =
    0;

let viewMode =
    'tp';

renderer.domElement.addEventListener(
    'pointerdown',
    e => {
        dragging =
            true;

        lastX =
            e.clientX;

        lastY =
            e.clientY;
    }
);

addEventListener(
    'pointerup',
    () => {
        dragging =
            false;
    }
);

addEventListener(
    'pointermove',
    e => {
        if (
            !dragging
        ) {
            return;
        }

        camYaw -=
            (
                e.clientX -
                lastX
            ) *
            0.0045;

        camPitch =
            clamp(
                camPitch -
                (
                    e.clientY -
                    lastY
                ) *
                0.0035,
                0.02,
                0.72
            );

        lastX =
            e.clientX;

        lastY =
            e.clientY;
    }
);

addEventListener(
    'resize',
    () => {
        camera.aspect =
            innerWidth /
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );
    }
);

function updateCamera(
    dt
) {
    const slimeTarget =
        typeof playerSlime !==
            'undefined'
            ? playerSlime.position
            : null;

    const target =
        new THREE.Vector3(
            slimeTarget
                ? slimeTarget.x
                : 0,
            slimeTarget
                ? slimeTarget.y + 1.45
                : 1.75,
            slimeTarget
                ? slimeTarget.z
                : 0
        );

    const dist =
        viewMode === 'near'
            ? 6.6
            : 10.6;

    const wanted =
        new THREE.Vector3(
            target.x +
                Math.sin(
                    camYaw
                ) *
                Math.cos(
                    camPitch
                ) *
                dist,

            target.y +
                Math.sin(
                    camPitch
                ) *
                dist,

            target.z +
                Math.cos(
                    camYaw
                ) *
                Math.cos(
                    camPitch
                ) *
                dist
        );

    camera.position.lerp(
        wanted,
        Math.min(
            1,
            dt *
            5.5
        )
    );

    camera.lookAt(
        target
    );
}
