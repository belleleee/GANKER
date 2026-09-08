'use strict';
const tableG=new THREE.Group();scene.add(tableG);
put(box(4.8,.18,3.0,MAT_WOOD),0,1,0,0,0,0,tableG);
put(box(4.95,.08,3.15,MAT_WOOD_DARK),0,.88,0,0,0,0,tableG);
for(const [x,z] of [[-2.15,-1.25],[2.15,-1.25],[-2.15,1.25],[2.15,1.25]])
 put(edge(new THREE.CylinderGeometry(.08,.11,1.7,7),MAT_WOOD_DARK),x,0,z,0,0,0,tableG);

// 6 个实体硬币槽位
const COIN_SLOTS=[
 [-1.45,1.13,-.45],[-.48,1.13,-.45],[.48,1.13,-.45],[1.45,1.13,-.45],
 [-.72,1.13,.55],[.72,1.13,.55]
];
for(const p of COIN_SLOTS){
 const r=edge(new THREE.TorusGeometry(.31,.018,6,32),MAT_COIN_DARK);
 r.rotation.x=Math.PI/2;r.position.set(...p);tableG.add(r);
}

// 右后方实体升级桌
const upgradeTable3D=new THREE.Group();scene.add(upgradeTable3D);
put(box(1.75,.14,1.05,MAT_WOOD),3.15,.82,-.35,0,0,0,upgradeTable3D);
for(const [x,z] of [[2.5,-.72],[3.8,-.72],[2.5,.02],[3.8,.02]])
 put(edge(new THREE.CylinderGeometry(.055,.075,1.35,6),MAT_WOOD_DARK),x,.13,z,0,0,0,upgradeTable3D);
put(box(1.28,.48,.08,MAT_WOOD),3.15,1.35,-.82,-.15,0,0,upgradeTable3D);

// 4 个史莱姆工作位
const HELPER_SLOTS=[[ -1.75,1.34,1.1],[-.58,1.34,1.25],[.58,1.34,1.25],[1.75,1.34,1.1]];
const helpers=[];
function createHelper(i){
 const g=new THREE.Group();g.position.set(...HELPER_SLOTS[i]);scene.add(g);
 const body=new THREE.Mesh(new THREE.SphereGeometry(.25,20,14),MAT_SLIME);g.add(body);
 g.add(new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry,18),MAT));
 const core=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),MAT_SLIME_CORE);g.add(core);
 for(const x of [-.07,.07]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),fillMat(0x29332e));eye.position.set(x,.05,.235);g.add(eye);}
 helpers.push({g,body,phase:Math.random()*6.28});
}
function syncHelpers(n){while(helpers.length<n&&helpers.length<4)createHelper(helpers.length);for(let i=0;i<helpers.length;i++)helpers[i].g.visible=i<n;}
function updateHelper(time){helpers.forEach((h,i)=>{if(!h.g.visible)return;h.g.position.y=HELPER_SLOTS[i][1]+Math.sin(time*2.5+h.phase)*.025;h.body.scale.y=.95+Math.sin(time*4+h.phase)*.04;});}
