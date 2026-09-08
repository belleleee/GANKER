
'use strict';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xf2eadc);
scene.fog=new THREE.Fog(0xf2eadc,14,36);

const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

const MAT=new THREE.LineBasicMaterial({color:0x2a2a24});
function fill(hex,opacity=1){
  return new THREE.MeshBasicMaterial({color:hex,transparent:opacity<1,opacity,side:THREE.DoubleSide});
}
const C={
  wall:fill(0xeee6d7),
  wood:fill(0xb89568),
  wood2:fill(0x8d6f4f),
  floor:fill(0xd7c4a0),
  leaf:fill(0xa8b889),
  coin:fill(0xe6bd55),
  coin2:fill(0xba8d2e),
  magic:fill(0xd9c2e7,.72),
  slime:fill(0x84cfb1,.40),
  slimeMid:fill(0xb2e0ce,.28),
  slimeCore:fill(0x5aa083,.56),
  dark:fill(0x30372f),
  glass:fill(0xbfdbe4,.32)
};

function edge(geo,mat,threshold=1){
  const g=new THREE.Group();
  g.add(new THREE.Mesh(geo,mat));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,threshold),MAT));
  return g;
}
function box(w,h,d,mat=C.wood){return edge(new THREE.BoxGeometry(w,h,d),mat);}
function put(o,x,y,z,rx=0,ry=0,rz=0,parent=scene){
  o.position.set(x,y,z);o.rotation.set(rx,ry,rz);parent.add(o);return o;
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

let camYaw=.12,camPitch=.24,dragging=false,lastX=0,lastY=0,viewMode='tp';
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{
  if(!dragging)return;
  camYaw-=(e.clientX-lastX)*.0045;
  camPitch=clamp(camPitch-(e.clientY-lastY)*.0035,-.02,.72);
  lastX=e.clientX;lastY=e.clientY;
});
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
function updateCamera(dt){
  const target=new THREE.Vector3(0,1.65,0);
  const dist=viewMode==='tp'?8.8:6.1;
  const wanted=new THREE.Vector3(
    target.x+Math.sin(camYaw)*Math.cos(camPitch)*dist,
    target.y+Math.sin(camPitch)*dist,
    target.z+Math.cos(camYaw)*Math.cos(camPitch)*dist
  );
  camera.position.lerp(wanted,Math.min(1,dt*5.5));
  camera.lookAt(target);
}
