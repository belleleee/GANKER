
'use strict';

const house=new THREE.Group();
scene.add(house);

// floor
put(box(10.5,.16,8.2,C.floor),0,.0,0,0,0,0,house);

// back wall / side walls
put(box(10.5,5.8,.18,C.wall),0,2.8,-4.0,0,0,0,house);
put(box(.18,5.8,8.2,C.wall),-5.15,2.8,0,0,0,0,house);
put(box(.18,5.8,8.2,C.wall),5.15,2.8,0,0,0,0,house);

// beams
for(const x of [-4.3,-2.1,0,2.1,4.3]){
  put(box(.14,5.6,.14,C.wood2),x,2.8,-3.88,0,0,0,house);
}
for(const y of [1.15,3.2,5.0]){
  put(box(10.1,.13,.14,C.wood2),0,y,-3.88,0,0,0,house);
}

// window
const windowG=new THREE.Group();windowG.position.set(-2.9,2.55,-3.86);house.add(windowG);
put(box(2.3,2.8,.12,C.wood2),0,0,0,0,0,0,windowG);
put(box(1.95,2.45,.08,C.glass),0,0,.07,0,0,0,windowG);
put(box(.08,2.45,.10,C.wood2),0,0,.12,0,0,0,windowG);
put(box(1.95,.08,.10,C.wood2),0,0,.12,0,0,0,windowG);

// shelves
const shelf=new THREE.Group();shelf.position.set(3.55,.3,-3.55);house.add(shelf);
put(box(1.55,.12,.55,C.wood),0,.25,0,0,0,0,shelf);
put(box(1.55,.12,.55,C.wood),0,1.25,0,0,0,0,shelf);
put(box(1.55,.12,.55,C.wood),0,2.25,0,0,0,0,shelf);
for(const x of [-.68,.68])put(box(.11,2.55,.48,C.wood2),x,1.25,0,0,0,0,shelf);

// shelf items
for(const p of [[-.4,.55,0,.18],[.2,.55,0,.14],[-.25,1.55,0,.13],[.38,1.55,0,.16]]){
  const pot=edge(new THREE.CylinderGeometry(p[3],p[3]*.84,.28,8),C.wood);
  put(pot,p[0],p[1],.0,0,0,0,shelf);
}
for(const p of [[-.4,.78,.0],[.2,.77,.0],[-.25,1.78,.0],[.38,1.8,.0]]){
  const plant=edge(new THREE.SphereGeometry(.18,8,6),C.leaf);
  plant.scale.set(.9,.55,.6);put(plant,p[0],p[1],p[2],0,0,.18,shelf);
}

// crates
for(const [x,z,s] of [[-3.7,2.5,1],[3.6,2.4,.85],[2.7,3.0,.72]]){
  put(box(.85*s,.65*s,.75*s,C.wood),x,.36,z,0,.15,0,house);
}

// lanterns
for(const [x,z] of [[-1.2,-3.6],[2.2,-3.55]]){
  const g=new THREE.Group();g.position.set(x,2.45,z);house.add(g);
  put(edge(new THREE.CylinderGeometry(.16,.16,.28,8),fill(0xffd98a,.35)),0,0,0,0,0,0,g);
  put(edge(new THREE.TorusGeometry(.17,.018,6,16,Math.PI),C.wood2),0,.18,0,Math.PI/2,0,0,g);
}

// decorative rug
const rug=edge(new THREE.CylinderGeometry(1.45,1.45,.03,48),fill(0xd5c0a1,.6));
rug.scale.z=.7;
put(rug,0,.11,1.75,0,0,0,house);
