'use strict';
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xf6f1e7);
scene.fog=new THREE.Fog(0xf6f1e7,12,38);

const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,0.1,100);
camera.position.set(4.8,3.8,6.8);
camera.lookAt(0,1,0);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

const MAT=new THREE.LineBasicMaterial({color:0x252c28});
function fillMat(hex,opacity=1){return new THREE.MeshBasicMaterial({color:hex,transparent:opacity<1,opacity,side:THREE.DoubleSide});}
const MAT_WOOD=fillMat(0xc4a47a);
const MAT_WOOD_DARK=fillMat(0x8d7154);
const MAT_COIN=fillMat(0xd8b95d);
const MAT_COIN_DARK=fillMat(0xa98d43);
const MAT_SLIME=fillMat(0x8fc9b2,.42);
const MAT_SLIME_CORE=fillMat(0x5f9c84,.52);

function edge(geo,mat,threshold=1){const g=new THREE.Group();g.add(new THREE.Mesh(geo,mat));g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,threshold),MAT));return g;}
function box(w,h,d,mat=MAT_WOOD){return edge(new THREE.BoxGeometry(w,h,d),mat);}
function put(o,x,y,z,rx=0,ry=0,rz=0,parent=scene){o.position.set(x,y,z);o.rotation.set(rx,ry,rz);parent.add(o);return o;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

let camYaw=0,camPitch=.34,dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;});
addEventListener('pointerup',()=>dragging=false);
addEventListener('pointermove',e=>{if(!dragging)return;camYaw-=(e.clientX-lastX)*.005;camPitch=clamp(camPitch-(e.clientY-lastY)*.004,-.05,.95);lastX=e.clientX;lastY=e.clientY;});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

function updateCamera(dt){
  const target=new THREE.Vector3(0,.95,0),dist=7;
  const wanted=new THREE.Vector3(
    target.x+Math.sin(camYaw)*Math.cos(camPitch)*dist,
    target.y+Math.sin(camPitch)*dist,
    target.z+Math.cos(camYaw)*Math.cos(camPitch)*dist
  );
  camera.position.lerp(wanted,Math.min(1,dt*6));
  camera.lookAt(target);
}
