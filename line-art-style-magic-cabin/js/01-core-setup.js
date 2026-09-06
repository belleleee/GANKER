'use strict';
            const mqCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false;
            const mqFine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : true;
            const IS_TOUCH = mqCoarse || (('ontouchstart' in window) && navigator.maxTouchPoints > 0 && !mqFine);
            if (IS_TOUCH) document.body.classList.add('touch');

            /* ============ 音效系统：文件放 sounds/ 目录，缺失时静默跳过 ============ */
            const SND = (() => {
                const NAMES = ['door', 'window', 'fire', 'lamp', 'cast', 'magic', 'cat', 'toggle', 'ui', 'chim', 'doorbell'];
                const pool = {};
                for (const n of NAMES) { const a = new Audio('sounds/' + n + '.mp3'); a.preload = 'auto'; pool[n] = a; }
                let vol = 0.6, on = true;
                function play(name) {
                    if (!on) return;
                    const a = pool[name];
                    if (!a || a.error) return;
                    try { const c = a.cloneNode(); c.volume = vol; c.play().catch(() => { }); } catch (e) { }
                }
                return {
                    play,
                    setVolume(v) { vol = Math.max(0, Math.min(1, v)); },
                    getVolume() { return vol; },
                    setEnabled(v) { on = !!v; },
                    isEnabled() { return on; }
                };
            })();

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xfdfbf6);
            scene.fog = new THREE.Fog(0xfdfbf6, 60, 160);

            const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(devicePixelRatio, IS_TOUCH ? 1.5 : 2));
            renderer.setSize(innerWidth, innerHeight);
            document.body.appendChild(renderer.domElement);

            const MAT = new THREE.LineBasicMaterial({ color: 0x111111 });
            const DASHMAT = new THREE.LineDashedMaterial({ color: 0xa9a9a9, dashSize: 0.22, gapSize: 0.16, transparent: true, opacity: 0.85 });
            const IN_MAT = new THREE.LineBasicMaterial({ color: 0x8a8a8a });

            /* ============ 全局 FILL 材质：内置一楼炉火 + 二楼魔法吊灯光照 ============ */
            const FILL = new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: new THREE.Color(0xffffff) },
                    uTint: { value: new THREE.Color(0xffffff) },
                    uFireCenter: { value: new THREE.Vector3(0, 0, 0) },
                    uFireRadius: { value: 11.0 },
                    uFireColorNear: { value: new THREE.Color(1.0, 0.62, 0.26) },
                    uFireColorFar: { value: new THREE.Color(0.78, 0.26, 0.09) },
                    uFireStrength: { value: 0.0 },
                    uLampCenter: { value: new THREE.Vector3(0, 5.45, 0) },
                    uLampRadius: { value: 12.0 },
                    uLampColorNear: { value: new THREE.Color(1.0, 0.80, 0.58) },
                    uLampColorFar: { value: new THREE.Color(0.72, 0.50, 0.85) },
                    uLampStrength: { value: 0.0 },
                    uDaylight: { value: 0.0 },
                    uTime: { value: 0 },
                    uPtPos: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] },
                    uPtCol: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color(), new THREE.Color()] },
                    uPtCfg: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
                    uPtCount: { value: 8 }
                },
                vertexShader: `
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
                fragmentShader: `
            uniform vec3 uColor;
            uniform vec3 uTint;
            uniform vec3 uFireCenter;
            uniform float uFireRadius;
            uniform vec3 uFireColorNear;
            uniform vec3 uFireColorFar;
            uniform float uFireStrength;
            uniform vec3 uLampCenter;
            uniform float uLampRadius;
            uniform vec3 uLampColorNear;
            uniform vec3 uLampColorFar;
            uniform float uLampStrength;
            uniform float uDaylight;
            uniform float uTime;
            uniform vec3 uPtPos[8];
            uniform vec3 uPtCol[8];
            uniform vec4 uPtCfg[8];
            uniform int uPtCount;
            varying vec3 vWorldPos;
            varying vec3 vWorldNormal;

            void main() {
                vec3 finalColor = uColor * uTint;

                float limX = min(4.0, 13.2 - 2.0 * vWorldPos.y);
                float inX = 1.0 - smoothstep(limX, limX + 0.12, abs(vWorldPos.x));
                float inZ = smoothstep(-4.12, -4.0, vWorldPos.z) * (1.0 - smoothstep(4.0, 4.12, vWorldPos.z));

                /* ---- 一楼炉火 ---- */
                float inYF = 1.0 - smoothstep(2.98, 3.10, vWorldPos.y);
                float roomMaskF = inX * inZ * inYF * step(-0.05, vWorldPos.y);
                if (roomMaskF > 0.002 && uFireStrength > 0.002) {
                    vec3 toFire = uFireCenter - vWorldPos;
                    float dist = length(toFire);
                    vec3 dirToFire = toFire / max(dist, 0.0001);
                    float ndl = dot(normalize(vWorldNormal), dirToFire);
                    float facing = smoothstep(-0.08, 0.45, ndl);
                    float t = clamp(1.0 - dist / uFireRadius, 0.0, 1.0);
                    float atten = t * t * 0.78 + t * 0.22;
                    vec3 fireCol = mix(uFireColorFar, uFireColorNear, t);
                    float flicker = 0.87
                        + 0.08 * sin(uTime * 6.7 + dist * 1.3)
                        + 0.03 * sin(uTime * 11.3 + 2.1)
                        + 0.02 * sin(uTime * 19.7 + 5.0);
                    float dayFade = 1.0 - uDaylight * 0.75;
                    float direct = atten * facing * 0.55;
                    float bounce = atten * 0.18 * (0.35 + 0.65 * smoothstep(-0.5, 0.3, ndl));
                    finalColor += fireCol * uFireStrength * flicker * dayFade * (direct + bounce) * roomMaskF;
                }

                /* ---- 二楼魔法吊灯 ---- */
                float inYL = smoothstep(3.0, 3.12, vWorldPos.y) * (1.0 - smoothstep(6.65, 6.95, vWorldPos.y));
                float roomMaskL = inX * inZ * inYL;
                if (roomMaskL > 0.002 && uLampStrength > 0.002) {
                    vec3 toLamp = uLampCenter - vWorldPos;
                    float distL = length(toLamp);
                    vec3 dirToLamp = toLamp / max(distL, 0.0001);
                    float ndlL = dot(normalize(vWorldNormal), dirToLamp);
                    float facingL = smoothstep(-0.08, 0.45, ndlL);
                    float tL = clamp(1.0 - distL / uLampRadius, 0.0, 1.0);
                    float attenL = tL * tL * 0.78 + tL * 0.22;
                    vec3 lampCol = mix(uLampColorFar, uLampColorNear, tL);
                    float flickerL = 0.93 + 0.045 * sin(uTime * 2.1 + distL * 0.8) + 0.025 * sin(uTime * 4.7 + 1.3);
                    float dayFadeL = 1.0 - uDaylight * 0.75;
                    float directL = attenL * facingL * 0.6;
                    float bounceL = attenL * 0.2 * (0.35 + 0.65 * smoothstep(-0.5, 0.3, ndlL));
                    finalColor += lampCol * uLampStrength * flickerL * dayFadeL * (directL + bounceL) * roomMaskL;
                }

                /* ---- 室内点光源（吊挂木灯·坩埚魔火·魔法阵·暖桌·水晶球·蜡烛·星象仪·月光盆栽） ---- */
                for (int i = 0; i < 8; i++) {
                    if (i >= uPtCount) break;
                    float ptS = uPtCfg[i].y;
                    if (ptS < 0.003) continue;
                    float yMaskPt = smoothstep(uPtCfg[i].z, uPtCfg[i].z + 0.12, vWorldPos.y)
                        * (1.0 - smoothstep(uPtCfg[i].w - 0.12, uPtCfg[i].w, vWorldPos.y));
                    float roomPt = inX * inZ * yMaskPt;
                    if (roomPt < 0.003) continue;
                    vec3 toPt = uPtPos[i] - vWorldPos;
                    float dPt = length(toPt);
                    float tPt = clamp(1.0 - dPt / uPtCfg[i].x, 0.0, 1.0);
                    float aPt = tPt * tPt * 0.78 + tPt * 0.22;
                    vec3 cPt = uPtCol[i] * (0.60 + 0.40 * tPt);
                    vec3 dirPt = toPt / max(dPt, 0.0001);
                    float ndlPt = dot(normalize(vWorldNormal), dirPt);
                    float facingPt = smoothstep(-0.08, 0.45, ndlPt);
                    float flickPt = 0.90 + 0.06 * sin(uTime * (5.3 + float(i) * 1.7) + dPt * 1.1 + float(i) * 2.4)
                        + 0.04 * sin(uTime * (9.1 + float(i) * 0.9) + float(i));
                    float fadePt = 1.0 - uDaylight * 0.75;
                    float dirLPt = aPt * facingPt * 0.50;
                    float bncPt = aPt * 0.16 * (0.35 + 0.65 * smoothstep(-0.5, 0.3, ndlPt));
                    finalColor += cPt * ptS * flickPt * fadePt * (dirLPt + bncPt) * roomPt;
                }

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
                side: THREE.DoubleSide,
                polygonOffset: true,
                polygonOffsetFactor: 1,
                polygonOffsetUnits: 1
            });

            /* ============ 彩色物品材质工厂：与 FILL 共享环境/光照 uniform（uTint 独立） ============ */
            function LITMAT(hex, opts) {
                const u = { uTint: { value: new THREE.Color(hex) } };
                for (const k in FILL.uniforms) if (k !== 'uTint') u[k] = FILL.uniforms[k];
                const m = new THREE.ShaderMaterial({
                    uniforms: u, vertexShader: FILL.vertexShader, fragmentShader: FILL.fragmentShader
                });
                if (opts) for (const k in opts) m[k] = opts[k];
                return m;
            }

            const WIN_GLASS = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const WIN_GLASS_UP = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });

            const V = (x, y, z) => new THREE.Vector3(x, y, z);
            const geo = pts => new THREE.BufferGeometry().setFromPoints(pts.map(p => V(p[0], p[1], p[2])));
            const line = pts => new THREE.Line(geo(pts), MAT);
            const iline = pts => new THREE.Line(geo(pts), IN_MAT);
            function dline(pts) { const l = new THREE.Line(geo(pts), DASHMAT); l.computeLineDistances(); return l; }

            function edge(g, threshold = 1, lmat) {
                const grp = new THREE.Group();
                grp.add(new THREE.Mesh(g, FILL));
                grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, threshold), lmat || MAT));
                return grp;
            }
            const box = (w, h, d) => edge(new THREE.BoxGeometry(w, h, d));
            const log = (len, r = 0.15) => edge(new THREE.CylinderGeometry(r, r, len, 8));
            function put(o, x, y, z, rx, ry, rz, parent) {
                o.position.set(x, y, z); if (rx) o.rotation.x = rx; if (ry) o.rotation.y = ry; if (rz) o.rotation.z = rz; (parent || scene).add(o); return o;
            }
            function logBetween(p1, p2, r, parent) {
                const v = V(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]); const L = edge(new THREE.CylinderGeometry(r, r, v.length(), 8));
                L.position.set((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2);
                L.quaternion.setFromUnitVectors(V(0, 1, 0), v.normalize()); (parent || scene).add(L); return L;
            }

            put(new THREE.Mesh(new THREE.PlaneGeometry(130, 130), FILL), 0, -0.01, 0, -Math.PI / 2, 0, 0);
            for (let z = -9; z <= 9; z += 1.5) put(line([[-10, 0.01, z], [10, 0.01, z]]), 0, 0, 0);

            const HOLE_R = 1.2, FLOOR_TOP = 3.12;
            const DOOR_HOLE = { c: 0, hw: 0.78, y0: 0, y1: 2.35 };
            const WIN_F_L = { c: -2.4, hw: 0.58, y0: 1.1, y1: 2.1 };
            const WIN_F_R = { c: 2.4, hw: 0.58, y0: 1.1, y1: 2.1 };
            const WIN_LEFT = { c: -1.5, hw: 0.58, y0: 1.1, y1: 2.1 };
            const WIN_GABLE = { c: 0, hw: 0.52, y0: 4.95, y1: 5.8 };
            const LOG_R = 0.15, LOG_GAP = 0.27, WALL_TOP = 4.42, WALL_Y0 = 0;

            function logWall(along, fixed, halfLen, openings, cornerExt, parent) {
                const g = new THREE.Group(); const nLogs = Math.floor((WALL_TOP - WALL_Y0) / LOG_GAP);
                for (let i = 0; i <= nLogs; i++) {
                    const y = WALL_Y0 + LOG_R + i * LOG_GAP; if (y > WALL_TOP) break;
                    let segs = [[-halfLen - cornerExt, halfLen + cornerExt]];
                    for (const op of openings) {
                        if (y > op.y0 && y < op.y1) {
                            const next = [];
                            for (const [a, b] of segs) {
                                const lo = op.c - op.hw, hi = op.c + op.hw;
                                if (hi <= a || lo >= b) { next.push([a, b]); continue; }
                                if (lo > a) next.push([a, lo]); if (hi < b) next.push([hi, b]);
                            } segs = next;
                        }
                    }
                    for (const [a, b] of segs) {
                        if (b - a < 0.15) continue; const L = log(b - a);
                        if (along === 'x') { L.rotation.z = Math.PI / 2; L.position.set((a + b) / 2, y, fixed); }
                        else { L.rotation.x = Math.PI / 2; L.position.set(fixed, y, (a + b) / 2); }
                        g.add(L);
                    }
                } (parent || scene).add(g);
            }

            const D_HALF = 4;
            logWall('x', 4, D_HALF, [DOOR_HOLE, WIN_F_L, WIN_F_R], 0.18);
            logWall('z', -4, D_HALF, [WIN_LEFT], 0);

            const dashedGroup = new THREE.Group(); scene.add(dashedGroup);
            const WX = 4.18;
            put(dline([[4, 0.02, -WX], [4, 0.02, WX], [4, WALL_TOP, WX], [4, WALL_TOP, -WX], [4, 0.02, -WX]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[4, 0.02, -WX], [4, WALL_TOP, -WX]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[4, 0.02, WX], [4, WALL_TOP, WX]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[-WX, 0.02, -4], [WX, 0.02, -4], [WX, WALL_TOP, -4], [-WX, WALL_TOP, -4], [-WX, 0.02, -4]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[-WX, 0.02, -4], [-WX, WALL_TOP, -4]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[WX, 0.02, -4], [WX, WALL_TOP, -4]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[-4, 4.5, -4], [0, 6.35, -4], [4, 4.5, -4], [-4, 4.5, -4]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[0, 6.7, 4.6], [4.4, 4.4, 4.6]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[0, 6.7, -4.6], [4.4, 4.4, -4.6]]), 0, 0, 0, 0, 0, 0, dashedGroup);
            put(dline([[4.4, 4.4, -4.6], [4.4, 4.4, 4.6]]), 0, 0, 0, 0, 0, 0, dashedGroup);

            const ridgeY = 6.6, eaveY = 4.4, eaveX = 4.4, roofSpan = 9.2;
            const roofAng = Math.atan2(ridgeY - eaveY, eaveX);
            const slopeLen = Math.hypot(eaveX, ridgeY - eaveY);
            put(box(slopeLen, 0.08, roofSpan), -eaveX / 2, (eaveY + ridgeY) / 2 + 0.04, 0, 0, 0, roofAng);
            put(log(roofSpan, 0.1), 0, ridgeY + 0.05, 0, Math.PI / 2, 0, 0);
            for (let t = 0.14; t < 0.96; t += 0.145) { const px = -eaveX + t * eaveX, py = eaveY + t * (ridgeY - eaveY) + 0.13; put(log(roofSpan, 0.09), px, py, 0, Math.PI / 2, 0, 0); }
            put(log(slopeLen + 0.15, 0.1), -eaveX / 2, (eaveY + ridgeY) / 2 + 0.02, 4.55, 0, 0, roofAng - Math.PI / 2);
            put(line([[0, ridgeY + 0.05, -4.55], [-eaveX, eaveY, -4.55]]), 0, 0, 0);
            put(log(9.1, 0.12), 0, eaveY - 0.12, 4.55, 0, 0, Math.PI / 2);
            put(edge(new THREE.CircleGeometry(0.1, 8)), 0, ridgeY + 0.05, -4.6, 0, Math.PI / 2, 0);
            put(box(0.68, 0.045, 9.0), -4.12, 4.45, 0, 0, 0, roofAng);
            for (const zs of [4.28, -4.28]) put(box(slopeLen - 0.1, 0.05, 0.6), -eaveX / 2, (eaveY + ridgeY) / 2 - 0.03, zs, 0, 0, roofAng);

            const GABLE_TOP = ridgeY - 0.25;
            function logGable(z, openings, parent) {
                const g = new THREE.Group(); let y = WALL_TOP + LOG_R;
                while (true) {
                    const halfW = D_HALF * (GABLE_TOP - y) / (GABLE_TOP - WALL_TOP); if (halfW < 0.3) break;
                    let segs = [[-halfW, halfW]];
                    for (const op of openings) {
                        if (y > op.y0 && y < op.y1) {
                            const next = [];
                            for (const [a, b] of segs) { const lo = op.c - op.hw, hi = op.c + op.hw; if (hi <= a || lo >= b) { next.push([a, b]); continue; } if (lo > a) next.push([a, lo]); if (hi < b) next.push([hi, b]); }
                            segs = next;
                        }
                    }
                    for (const [a, b] of segs) { if (b - a < 0.15) continue; const L = log(b - a); L.rotation.z = Math.PI / 2; L.position.set((a + b) / 2, y, z); g.add(L); }
                    y += LOG_GAP;
                } (parent || scene).add(g);
            }
            logGable(4, [WIN_GABLE]);

            const fullHouseGroup = new THREE.Group(); fullHouseGroup.visible = false; scene.add(fullHouseGroup); let fullHouse = false;
            {
                const WIN_R = { c: -1.5, hw: 0.52, y0: 1.1, y1: 2.1 }; const WIN_B = { c: 1.5, hw: 0.52, y0: 1.1, y1: 2.1 };
                logWall('z', 4, D_HALF, [WIN_R], 0.18, fullHouseGroup); logWall('x', -4, D_HALF, [WIN_B], 0.18, fullHouseGroup); logGable(-4, [], fullHouseGroup);
                put(box(slopeLen, 0.08, roofSpan), eaveX / 2, (eaveY + ridgeY) / 2 + 0.04, 0, 0, 0, -roofAng, fullHouseGroup);
                for (let t = 0.14; t < 0.96; t += 0.145) { const px = eaveX - t * eaveX, py = eaveY + t * (ridgeY - eaveY) + 0.13; put(log(roofSpan, 0.09), px, py, 0, Math.PI / 2, 0, 0, fullHouseGroup); }
                put(log(slopeLen + 0.15, 0.1), eaveX / 2, (eaveY + ridgeY) / 2 + 0.02, 4.55, 0, 0, -(roofAng - Math.PI / 2), fullHouseGroup);
                put(line([[0, ridgeY + 0.05, -4.55], [eaveX, eaveY, -4.55]]), 0, 0, 0, 0, 0, 0, fullHouseGroup);
                put(box(0.68, 0.045, 9.0), 4.12, 4.45, 0, 0, 0, -roofAng, fullHouseGroup);
                for (const zs of [4.28, -4.28]) put(box(slopeLen - 0.1, 0.05, 0.6), eaveX / 2, (eaveY + ridgeY) / 2 - 0.03, zs, 0, 0, -roofAng, fullHouseGroup);
            }

            const floorShape = new THREE.Shape();
            floorShape.moveTo(-4, -4); floorShape.lineTo(4, -4); floorShape.lineTo(4, 4); floorShape.lineTo(-4, 4); floorShape.closePath();
            const holePath = new THREE.Path(); holePath.absarc(0, 0, HOLE_R, 0, Math.PI * 2, true); floorShape.holes.push(holePath);
            const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: 0.12, bevelEnabled: false });
            floorGeo.rotateX(-Math.PI / 2); floorGeo.translate(0, 3, 0); scene.add(edge(floorGeo));
            const ring = edge(new THREE.TorusGeometry(HOLE_R, 0.04, 8, 32)); ring.rotation.x = Math.PI / 2; ring.position.set(0, FLOOR_TOP + 0.01, 0); scene.add(ring);

            const landingShape = new THREE.Shape(); landingShape.moveTo(0, 0); landingShape.absarc(0, 0, HOLE_R, Math.PI / 6, Math.PI - Math.PI / 6, false); landingShape.lineTo(0, 0);
            const landingGeo = new THREE.ExtrudeGeometry(landingShape, { depth: 0.12, bevelEnabled: false, curveSegments: 10 });
            landingGeo.rotateX(Math.PI / 2); put(edge(landingGeo), 0, FLOOR_TOP + 0.01, 0);

            const RAIL_R = 1.24, RAIL_H = 0.85, D2R = Math.PI / 180;
            for (let deg = 60; deg <= 300; deg += 30) { const th = deg * D2R; put(edge(new THREE.CylinderGeometry(0.025, 0.025, RAIL_H, 6)), Math.sin(th) * RAIL_R, FLOOR_TOP + RAIL_H / 2, Math.cos(th) * RAIL_R, 0, 0, 0); }
            for (const hy of [RAIL_H, 0.45]) { const pts = []; for (let deg = 60; deg <= 300; deg += 5) { const th = deg * D2R; pts.push([Math.sin(th) * RAIL_R, FLOOR_TOP + hy, Math.cos(th) * RAIL_R]); } put(line(pts), 0, 0, 0); }
            const eX = Math.sin(60 * D2R), eZ = Math.cos(60 * D2R);
            for (const r of [0.38, 0.8]) put(edge(new THREE.CylinderGeometry(0.025, 0.025, RAIL_H, 6)), eX * r, FLOOR_TOP + RAIL_H / 2, eZ * r, 0, 0, 0);
            for (const hy of [RAIL_H, 0.45]) put(line([[eX * 0.15, FLOOR_TOP + hy, eZ * 0.15], [eX * RAIL_R, FLOOR_TOP + hy, eZ * RAIL_R]]), 0, 0, 0);
            for (let z = -3.2; z <= 3.2; z += 0.9) { const avoidR = HOLE_R + 0.05; if (Math.abs(z) >= avoidR) { put(log(8, 0.07), 0, 2.86, z, 0, 0, Math.PI / 2); } else { const dx = Math.sqrt(avoidR * avoidR - z * z); put(log(4 - dx, 0.07), -(4 + dx) / 2, 2.86, z, 0, 0, Math.PI / 2); put(log(4 - dx, 0.07), (4 + dx) / 2, 2.86, z, 0, 0, Math.PI / 2); } }

            function interiorWallLines(along, fixed, openings, skipV) {
                for (let y = 0.6; y < 4.4; y += 0.8) {
                    let segs = [[-3.9, 3.9]];
                    for (const op of openings) { if (y > op.y0 && y < op.y1) { const next = []; for (const [a, b] of segs) { const lo = op.c - op.hw, hi = op.c + op.hw; if (hi <= a || lo >= b) { next.push([a, b]); continue; } if (lo > a) next.push([a, lo]); if (hi < b) next.push([hi, b]); } segs = next; } }
                    for (const [a, b] of segs) { if (b - a < 0.2) continue; if (along === 'x') put(line([[a, y, fixed], [b, y, fixed]]), 0, 0, 0); else put(line([[fixed, y, a], [fixed, y, b]]), 0, 0, 0); }
                }
                for (let p = -3; p <= 3; p += 1.5) {
                    if (skipV && skipV.indexOf(p) !== -1) continue; let segs = [[0.1, 4.4]];
                    for (const op of openings) { if (p > op.c - op.hw && p < op.c + op.hw) { const next = []; for (const [a, b] of segs) { if (op.y1 <= a || op.y0 >= b) { next.push([a, b]); continue; } if (op.y0 > a) next.push([a, op.y0]); if (op.y1 < b) next.push([op.y1, b]); } segs = next; } }
                    for (const [a, b] of segs) { if (b - a < 0.2) continue; if (along === 'x') put(line([[p, a, fixed], [p, b, fixed]]), 0, 0, 0); else put(line([[fixed, a, p], [fixed, b, p]]), 0, 0, 0); }
                }
            }
            interiorWallLines('x', 3.9, [DOOR_HOLE, WIN_F_L, WIN_F_R], [0]);
            interiorWallLines('z', -3.9, [WIN_LEFT]);

            const hinges = [], hingeMeshes = [], slides = [];
            function registerHinge(g) { g.userData.spring = { cur: 0, vel: 0, open: false }; hinges.push(g); g.traverse(o => { if (o.isMesh) { o.userData.hingeGroup = g; hingeMeshes.push(o); } }); }
            function regSlide(g, axis, dist) { g.userData.slide = { cur: 0, vel: 0, open: false, base: g.position[axis], axis: axis, dist: dist }; slides.push(g); return g; }
            function updateSprings() { for (const g of hinges) { const s = g.userData.spring; const target = s.open ? 1 : 0; s.vel += (target - s.cur) * 0.015; s.vel *= 0.95; s.cur += s.vel; if (s.cur < 0 && g.userData.bounce) { s.cur = 0; s.vel = -s.vel * 0.35; } g.rotation.y = g.userData.base + g.userData.delta * s.cur; } for (const g of slides) { const s = g.userData.slide; const target = s.open ? 1 : 0; s.vel += (target - s.cur) * 0.02; s.vel *= 0.92; s.cur += s.vel; g.position[s.axis] = s.base + s.dist * s.cur; } }

            function squareWindow(cx, cy, cz, face, w, h, holeHw, parent, glassMat) {
                const g = new THREE.Group(); g.userData = { base: 0, delta: 0 }; const parts = new THREE.Group(); const t = 0.09, d = 0.12;
                put(box(w, t, d), w / 2, h / 2 - t / 2, 0, 0, 0, 0, parts); put(box(w, t, d), w / 2, -h / 2 + t / 2, 0, 0, 0, 0, parts);
                put(box(t, h, d), t / 2, 0, 0, 0, 0, 0, parts); put(box(t, h, d), w - t / 2, 0, 0, 0, 0, 0, parts);
                put(box(w - 2 * t, 0.05, 0.07), w / 2, 0, 0.02, 0, 0, 0, parts); put(box(0.05, h - 2 * t, 0.07), w / 2, 0, 0.02, 0, 0, 0, parts);
                { const gg = new THREE.BoxGeometry(w - 2 * t, h - 2 * t, 0.04); const glass = new THREE.Mesh(gg, glassMat || WIN_GLASS); glass.position.set(w / 2, 0, 0); parts.add(glass); const glassEdge = new THREE.LineSegments(new THREE.EdgesGeometry(gg), MAT); glassEdge.position.set(w / 2, 0, 0); parts.add(glassEdge); }
                g.add(parts); put(box(0.07, 0.16, 0.16), 0.02, h / 2 - 0.2, 0, 0, 0, 0, g); put(box(0.07, 0.16, 0.16), 0.02, -h / 2 + 0.2, 0, 0, 0, 0, g);
                const P = parent || scene; const sideOff = holeHw - 0.045;
                if (face === '+z' || face === '-z') {
                    for (const s of [-1, 1]) put(box(0.1, h + 0.24, 0.22), cx + s * sideOff, cy + 0.02, cz, 0, 0, 0, P);
                    put(box(2 * holeHw + 0.06, 0.1, 0.22), cx, cy + h / 2 + 0.06, cz, 0, 0, 0, P);
                    if (face === '+z') put(box(w + 0.24, 0.08, 0.2), cx, cy - h / 2 - 0.06, cz + 0.02, 0, 0, 0, P);
                    if (face === '-z') put(box(w + 0.24, 0.08, 0.2), cx, cy - h / 2 - 0.06, cz - 0.02, 0, 0, 0, P);
                } else {
                    for (const s of [-1, 1]) put(box(0.22, h + 0.24, 0.1), cx, cy + 0.02, cz + s * sideOff, 0, 0, 0, P);
                    put(box(0.22, 0.1, 2 * holeHw + 0.06), cx, cy + h / 2 + 0.06, cz, 0, 0, 0, P);
                    if (face === '-x') put(box(0.2, 0.08, w + 0.24), cx - 0.02, cy - h / 2 - 0.06, cz, 0, 0, 0, P);
                    if (face === '+x') put(box(0.2, 0.08, w + 0.24), cx + 0.02, cy - h / 2 - 0.06, cz, 0, 0, 0, P);
                }
                if (face === '+z') { g.userData.base = 0; g.position.set(cx - w / 2, cy, cz); }
                if (face === '-x') { g.userData.base = -Math.PI / 2; g.position.set(cx, cy, cz - w / 2); }
                if (face === '+x') { g.userData.base = Math.PI / 2; g.position.set(cx, cy, cz + w / 2); }
                if (face === '-z') { g.userData.base = Math.PI; g.position.set(cx + w / 2, cy, cz); }
                g.userData.delta = -1.35; P.add(g); registerHinge(g); return g;
            }
            const winFL = squareWindow(WIN_F_L.c, 1.6, 4.03, '+z', 0.95, 0.9, WIN_F_L.hw);
            const winFR = squareWindow(WIN_F_R.c, 1.6, 4.03, '+z', 0.95, 0.9, WIN_F_R.hw);
            const winL = squareWindow(-4.03, 1.6, WIN_LEFT.c, '-x', 0.95, 0.9, WIN_LEFT.hw);
            const winG = squareWindow(WIN_GABLE.c, 5.38, 4.03, '+z', 0.85, 0.75, WIN_GABLE.hw, null, WIN_GLASS_UP);
            const winR = squareWindow(4.03, 1.6, -1.5, '+x', 0.95, 0.9, 0.52, fullHouseGroup);
            const winB = squareWindow(1.5, 1.6, -4.03, '-z', 0.95, 0.9, 0.52, fullHouseGroup);

            put(log(2.42, 0.1), -0.84, 1.21, 4.02, 0, 0, 0); put(log(2.42, 0.1), 0.84, 1.21, 4.02, 0, 0, 0); put(box(1.7, 0.1, 0.28), 0, 0.05, 4.12);
            const doorGroup = new THREE.Group(); doorGroup.userData = { base: 0, delta: 1.9 };
            const doorShape = new THREE.Shape(); doorShape.moveTo(-0.72, 0); doorShape.lineTo(-0.72, 1.63); doorShape.absarc(0, 1.63, 0.72, Math.PI, 0, true); doorShape.lineTo(0.72, 0); doorShape.lineTo(-0.72, 0);
            put(edge(new THREE.ExtrudeGeometry(doorShape, { depth: 0.07, bevelEnabled: false }).translate(0.72, 0, 0)), 0, 0, 0, 0, 0, 0, doorGroup);
            for (const px of [0.28, 0.54, 0.8, 1.06]) put(line([[px, 0.05, 0.09], [px, 1.63, 0.09]]), 0, 0, 0, doorGroup);
            put(box(0.22, 0.07, 0.04), 0.13, 0.5, 0.09, 0, 0, 0, doorGroup);
            put(edge(new THREE.TorusGeometry(0.07, 0.02, 6, 16)), 1.2, 1.05, 0.10, 0, 0, 0, doorGroup);
            doorGroup.position.set(-0.72, 0, 3.96); scene.add(doorGroup); registerHinge(doorGroup);
            doorGroup.userData.aimLabel = '打开 / 关上大门';
            winFL.userData.aimLabel = '开 / 关前左窗'; winFR.userData.aimLabel = '开 / 关前右窗'; winL.userData.aimLabel = '开 / 关左侧窗'; winG.userData.aimLabel = '开 / 关阁楼窗'; winR.userData.aimLabel = '开 / 关右侧窗'; winB.userData.aimLabel = '开 / 关后窗';

            const CHX = -3.35, CHZ = 1.5, HEARTH = 0.12, FX = CHX + 0.15, FZ = CHZ;
            FILL.uniforms.uFireCenter.value.set(FX, 0.55, FZ);

            const fireMeshes = []; let fireLit = true; let fireP = 1;
            function regFire(o) { o.traverse(m => { if (m.isMesh) { m.userData.isFire = true; fireMeshes.push(m); } }); return o; }
            regFire(put(box(1.0, 0.12, 1.9), CHX, 0.06, CHZ)); regFire(put(box(0.08, 1.33, 1.8), CHX - 0.46, 0.785, CHZ)); regFire(put(box(0.94, 1.33, 0.35), CHX, 0.785, CHZ - 0.725)); regFire(put(box(0.94, 1.33, 0.35), CHX, 0.785, CHZ + 0.725));
            regFire(put(box(0.94, 0.25, 1.8), CHX, 1.325, CHZ)); regFire(put(box(1.05, 0.12, 2.2), CHX, 1.46, CHZ)); regFire(put(box(0.7, 0.08, 2.0), CHX + 0.8, 0.04, CHZ));
            const fwShape = new THREE.Shape(); fwShape.moveTo(-0.9, 0); fwShape.lineTo(0.9, 0); fwShape.lineTo(0.9, 1.52); fwShape.lineTo(-0.9, 1.52); fwShape.closePath();
            const fwHole = new THREE.Path(); fwHole.moveTo(-0.55, 0.12); fwHole.lineTo(-0.55, 0.62); fwHole.absarc(0, 0.62, 0.55, Math.PI, 0, true); fwHole.lineTo(0.55, 0.12); fwHole.closePath(); fwShape.holes.push(fwHole);
            const fwGeo = new THREE.ExtrudeGeometry(fwShape, { depth: 0.08, bevelEnabled: false, curveSegments: 12 }); fwGeo.rotateY(-Math.PI / 2); regFire(put(edge(fwGeo), CHX + 0.5, 0, CHZ));
            const BK = CHX - 0.42;
            for (let y = 0.26; y <= 1.0; y += 0.22) put(iline([[BK, y, CHZ - 0.5], [BK, y, CHZ + 0.5]]), 0, 0, 0);
            for (let r = 0; r < 4; r++) { const y0 = 0.26 + r * 0.22; for (let zq = -0.44; zq <= 0.44; zq += 0.22) { const zo = zq + (r % 2 ? 0.11 : 0); if (Math.abs(zo) < 0.5) put(iline([[BK, y0, CHZ + zo], [BK, y0 + 0.22, CHZ + zo]]), 0, 0, 0); } }
            for (let i = 0; i < 5; i++) put(iline([[FX - 0.18 + i * 0.07, HEARTH, FZ - 0.28 + i * 0.13], [FX - 0.10 + i * 0.07, HEARTH, FZ - 0.22 + i * 0.13]]), 0, 0, 0);
            const WOOD_R = 0.05;
            regFire(logBetween([FX - 0.06, HEARTH + WOOD_R, FZ - 0.42], [FX - 0.06, HEARTH + WOOD_R, FZ + 0.42], WOOD_R));
            regFire(logBetween([FX + 0.12, HEARTH + WOOD_R, FZ - 0.38], [FX + 0.12, HEARTH + WOOD_R, FZ + 0.38], WOOD_R));
            regFire(logBetween([FX - 0.34, HEARTH + WOOD_R * 3, FZ + 0.05], [FX + 0.38, HEARTH + WOOD_R * 3, FZ - 0.03], WOOD_R));
            for (const p of [[FX - 0.06, HEARTH + WOOD_R, FZ - 0.42], [FX + 0.12, HEARTH + WOOD_R, FZ + 0.38]]) { put(edge(new THREE.CircleGeometry(WOOD_R * 0.9, 8)), p[0], p[1], p[2], 0, 0, 0); put(edge(new THREE.CircleGeometry(WOOD_R * 0.35, 6)), p[0], p[1], p[2], 0, 0, 0); }
            const TEEPEE_BASE_R = 0.30, TEEPEE_TOP_Y = HEARTH + 0.62, STICK_Y = HEARTH + WOOD_R * 0.9;
            for (let i = 0; i < 5; i++) { const a = i * (Math.PI * 2 / 5) + 0.35; const bx = FX + Math.cos(a) * TEEPEE_BASE_R; const bz = FZ + Math.sin(a) * TEEPEE_BASE_R; regFire(logBetween([bx, STICK_Y, bz], [FX, TEEPEE_TOP_Y, FZ], WOOD_R * 0.9)); put(edge(new THREE.CircleGeometry(WOOD_R * 0.8, 8)), bx + Math.cos(a) * 0.005, STICK_Y, bz + Math.sin(a) * 0.005, 0, 0, 0); }

            const fireOut = new THREE.LineBasicMaterial({ color: 0xb8421f }), fireMid = new THREE.LineBasicMaterial({ color: 0xe0862e }), fireIn = new THREE.LineBasicMaterial({ color: 0xf5c542 });
            const wavyFlames = [];
            function makeWavyFlame(x0, z0, y0, h, w, mat, phase, speed, list) { const K = 24; const count = (K + 1) * 2; const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); const ln = new THREE.LineLoop(geom, mat); ln.frustumCulled = false; scene.add(ln); const f = { obj: ln, x0, z0, y0, h, w, phase, speed, geom, K }; (list || wavyFlames).push(f); return f; }
            function updateWavyFlame(f, time, pw) { const p = f.geom.attributes.position.array; const K = f.K; const hh = f.h * pw; const wsc = 0.3 + 0.7 * pw; let idx = 0; for (let k = 0; k <= K; k++) { const t = k / K; const ww = f.w * wsc * Math.sin(Math.PI * (0.16 + 0.84 * t)); const wob = Math.sin(t * 5.2 - time * f.speed + f.phase) * 0.028 * t * pw; const zo = Math.sin(t * 4 - time * f.speed * 0.7 + f.phase * 1.7) * 0.02 * t * pw; p[idx++] = f.x0 + wob + ww; p[idx++] = f.y0 + t * hh; p[idx++] = f.z0 + zo; } for (let k = K; k >= 0; k--) { const t = k / K; const ww = f.w * wsc * Math.sin(Math.PI * (0.16 + 0.84 * t)); const wob = Math.sin(t * 5.2 - time * f.speed + f.phase) * 0.028 * t * pw; const zo = Math.sin(t * 4 - time * f.speed * 0.7 + f.phase * 1.7) * 0.02 * t * pw; p[idx++] = f.x0 + wob - ww; p[idx++] = f.y0 + t * hh; p[idx++] = f.z0 + zo; } f.geom.attributes.position.needsUpdate = true; }
            makeWavyFlame(FX, FZ, HEARTH + 0.02, 0.80, 0.30, fireOut, 0.0, 2.6); makeWavyFlame(FX + 0.01, FZ - 0.01, HEARTH + 0.04, 0.60, 0.20, fireMid, 2.3, 3.1); makeWavyFlame(FX - 0.01, FZ + 0.01, HEARTH + 0.06, 0.38, 0.11, fireIn, 4.1, 3.6); makeWavyFlame(FX - 0.14, FZ - 0.10, HEARTH + 0.02, 0.34, 0.11, fireOut, 1.2, 3.3); makeWavyFlame(FX + 0.15, FZ + 0.12, HEARTH + 0.02, 0.28, 0.10, fireOut, 3.4, 3.0);
            const sparks = [];
            for (let i = 0; i < 6; i++) { const sp = edge(new THREE.OctahedronGeometry(0.016)); sp.userData.phase = i / 6; sp.userData.drift = (Math.random() - 0.5) * 0.25; scene.add(sp); sparks.push(sp); }
            put(box(0.85, 1.0, 1.6), CHX, 1.9, CHZ); put(box(0.7, 4.9, 0.7), CHX, 4.85, CHZ);
            put(line([[CHX - 0.42, 3.13, CHZ - 0.42], [CHX + 0.42, 3.13, CHZ - 0.42], [CHX + 0.42, 3.13, CHZ + 0.42], [CHX - 0.42, 3.13, CHZ + 0.42], [CHX - 0.42, 3.13, CHZ - 0.42]]), 0, 0, 0);
            const smokePuffs = [];
            for (let i = 0; i < 5; i++) { const p = edge(new THREE.TorusGeometry(0.14, 0.035, 6, 20)); p.rotation.x = Math.PI / 2; p.userData.phase = i / 5; scene.add(p); smokePuffs.push(p); }

            const magicMeshes = [];
            function regMagic(o, onClick) { o.userData.onClick = onClick; o.traverse(m => { if (m.isMesh && !m.userData.noHit) { m.userData.magicRoot = o; magicMeshes.push(m); } }); return o; }

            const STAIR_N = 14;
            function buildStairs() {
                const g = new THREE.Group(); const N = STAIR_N; const riseTotal = FLOOR_TOP; const stepH = riseTotal / (N + 1); const dTheta = 270 / N; const rI = 0.14, rO = 1.1; const railH = 0.85, rPost = rO - 0.07; const treadHalf = dTheta * 0.46; const thick = 0.06;
                put(log(FLOOR_TOP + RAIL_H, 0.08), 0, (FLOOR_TOP + RAIL_H) / 2, 0, 0, 0, 0, g);
                function treadGeo(a0, a1) { const s = new THREE.Shape(); s.moveTo(rI * Math.sin(a0), rI * Math.cos(a0)); s.lineTo(rO * Math.sin(a0), rO * Math.cos(a0)); const nSeg = 5; for (let j = 1; j <= nSeg; j++) { const a = a0 + (a1 - a0) * j / nSeg; s.lineTo(rO * Math.sin(a), rO * Math.cos(a)); } s.lineTo(rI * Math.sin(a1), rI * Math.cos(a1)); s.closePath(); const gg = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false }); gg.rotateX(Math.PI / 2); gg.translate(0, thick, 0); return gg; }
                const thetaEnd = -60 - dTheta / 2; const railPts = [];
                for (let k = 0; k < N; k++) { const thDeg = thetaEnd - (N - 1 - k) * dTheta; const th = thDeg * D2R; const yTop = (k + 1) * stepH; const tread = edge(treadGeo(th - treadHalf * D2R, th + treadHalf * D2R)); tread.position.y = yTop - thick; g.add(tread); const norm = ((thDeg % 360) + 360) % 360; const underPlatform = (norm <= 60 || norm >= 300) && (yTop + railH > FLOOR_TOP - 0.1); if (!underPlatform) { put(edge(new THREE.CylinderGeometry(0.02, 0.02, railH, 6)), rPost * Math.sin(th), yTop + railH / 2, rPost * Math.cos(th), 0, 0, 0, g); } railPts.push(V(rPost * Math.sin(th), yTop + railH, rPost * Math.cos(th))); }
                g.add(edge(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 64, 0.03, 6, false))); return g;
            }
            scene.add(buildStairs());

            put(box(1.25, 0.06, 1.0), -0.58, 2.98, 4.55, 0, 0, 0.35); put(box(1.25, 0.06, 1.0), 0.58, 2.98, 4.55, 0, 0, -0.35);
            put(log(2.78, 0.06), -1.15, 1.39, 4.95, 0, 0, 0.03); put(log(2.78, 0.06), 1.15, 1.39, 4.95, 0, 0, -0.03);
            put(line([[-1.15, 2.5, 4.95], [-0.7, 2.92, 4.55]]), 0, 0, 0); put(line([[1.15, 2.5, 4.95], [0.7, 2.92, 4.55]]), 0, 0, 0); put(box(1.4, 0.03, 0.6), 0, 0.02, 4.45);
            for (let i = 0; i < 4; i++) put(box(0.7, 0.05, 0.5), (i % 2) * 0.25 - 0.1, 0.025, 5.1 + i * 0.85);

            const signG = new THREE.Group(); signG.position.set(3.1, 0, 6.3); signG.rotation.y = -0.45; scene.add(signG);
            put(edge(new THREE.CylinderGeometry(0.035, 0.05, 1.5, 8)), 0, 0.75, 0, 0.04, 0, 0.05, signG);
            const signCanvas = document.createElement('canvas'); signCanvas.width = 256; signCanvas.height = 128; const sctx = signCanvas.getContext('2d');
            const signTexture = new THREE.CanvasTexture(signCanvas); let signText = '魔女小屋';
            function drawSign(text) { const n = Math.max(text.length, 1); const size = n <= 4 ? 46 : n <= 6 ? 36 : n <= 8 ? 28 : 22; sctx.fillStyle = '#ffffff'; sctx.fillRect(0, 0, 256, 128); sctx.strokeStyle = '#111111'; sctx.lineWidth = 5; sctx.strokeRect(5, 5, 246, 118); sctx.lineWidth = 1.5; sctx.strokeRect(14, 14, 228, 100); sctx.fillStyle = '#111111'; sctx.font = 'bold ' + size + 'px "Microsoft YaHei", monospace'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'; sctx.fillText(text, 128, 66); signTexture.needsUpdate = true; }
            drawSign(signText);
            const signSideMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); const signFaceMat = new THREE.MeshBasicMaterial({ map: signTexture });
            const signBoardG = new THREE.Group(); signBoardG.position.set(0, 1.5, 0.10); signBoardG.rotation.z = 0.07; signBoardG.rotation.x = 0.03; signG.add(signBoardG);
            { const boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.045), [signSideMat, signSideMat, signSideMat, signSideMat, signFaceMat, signSideMat]); signBoardG.add(boardMesh); signBoardG.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.85, 0.48, 0.045)), MAT)); for (const [nx, ny] of [[-0.36, 0.19], [0.36, 0.19], [-0.36, -0.19], [0.36, -0.19]]) put(edge(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 6)), nx, ny, 0.028, 0, 0, 0, signBoardG); }
            function openSignEditor() { if (document.pointerLockElement) document.exitPointerLock(); const ed = document.getElementById('signEditor'); const inp = document.getElementById('signInput'); inp.value = signText; ed.classList.add('show'); inp.focus(); inp.select(); }
            signG.userData.aimLabel = '编辑路牌文字'; regMagic(signG, openSignEditor);

            put(edge(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6)), 0, ridgeY + 0.4, 0); put(edge(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6)), 0, ridgeY + 0.55, 0, 0, 0, Math.PI / 2); put(edge(new THREE.ConeGeometry(0.06, 0.16, 6)), 0.3, ridgeY + 0.55, 0, 0, 0, -Math.PI / 2); put(edge(new THREE.ConeGeometry(0.06, 0.14, 4)), -0.28, ridgeY + 0.55, 0, 0, 0, Math.PI / 2);

            const GATE_L = -1.4, GATE_R = 1.4;
            for (let x = -7; x <= 7; x += 0.8) { if (x > GATE_L - 0.1 && x < GATE_R + 0.1) continue; const picket = new THREE.Group(); put(box(0.12, 0.9, 0.06), 0, 0.45, 0, 0, 0, 0, picket); put(edge(new THREE.ConeGeometry(0.09, 0.22, 4)), 0, 1.0, 0, 0, 0, 0, picket); put(picket, x, 0, 7.5); }
            for (const cy of [0.75, 0.35]) { const len = 7 - GATE_R; put(log(len, 0.04), (GATE_L - 7) / 2, cy, 7.5, 0, 0, Math.PI / 2); put(log(len, 0.04), (GATE_R + 7) / 2, cy, 7.5, 0, 0, Math.PI / 2); }
            for (const gx of [GATE_L - 0.08, GATE_R + 0.08]) { put(box(0.14, 1.15, 0.1), gx, 0.575, 7.5); put(edge(new THREE.ConeGeometry(0.1, 0.2, 4)), gx, 1.25, 7.5); }
            function mushroom(x, z, s) { const g = new THREE.Group(); put(edge(new THREE.CylinderGeometry(0.05 * s, 0.08 * s, 0.3 * s, 8)), 0, 0.15 * s, 0, 0, 0, 0, g); put(edge(new THREE.SphereGeometry(0.22 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), 0, 0.28 * s, 0, 0, 0, 0, g); put(g, x, 0, z); }
            mushroom(-5.8, 6.2, 1.2); mushroom(-5.2, 6.8, 0.8); mushroom(5.6, 6.5, 1.0);

