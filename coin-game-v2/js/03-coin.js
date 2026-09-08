'use strict';
const coins=[];
function makeCoin(i){
 const root=new THREE.Group();scene.add(root);
 const geo=new THREE.CylinderGeometry(.22,.22,.05,32);
 const mesh=new THREE.Mesh(geo,MAT_COIN);mesh.rotation.z=Math.PI/2;root.add(mesh);
 const lines=new THREE.LineSegments(new THREE.EdgesGeometry(geo,16),MAT);lines.rotation.z=Math.PI/2;root.add(lines);
 const mark=new THREE.Mesh(new THREE.TorusGeometry(.08,.012,6,18),MAT_COIN_DARK);mark.position.x=.028;mark.rotation.y=Math.PI/2;root.add(mark);
 const c={root,active:false,vel:new THREE.Vector3(),ang:new THREE.Vector3(),bounces:0,result:null,done:true,index:i};
 coins.push(c);resetOne(c);return c;
}
function resetOne(c){
 const p=COIN_SLOTS[c.index];c.root.position.set(p[0],1.36,p[2]);c.root.rotation.set(0,0,0);
 c.active=false;c.done=true;c.result=null;c.vel.set(0,0,0);c.ang.set(0,0,0);c.bounces=0;
}
function syncCoins(n){while(coins.length<n)makeCoin(coins.length);coins.forEach((c,i)=>c.root.visible=i<n);}
function launchAll(n){
 for(let i=0;i<n;i++){
  const c=coins[i],p=COIN_SLOTS[i];c.done=false;c.active=true;c.result=null;c.bounces=0;
  c.root.position.set(p[0],1.36,p[2]);
  c.vel.set((Math.random()-.5)*.45,4.7+Math.random()*1.1,(Math.random()-.5)*.45);
  c.ang.set(9+Math.random()*7,3+Math.random()*5,15+Math.random()*9);
 }
}
function finish(c){
 const up=new THREE.Vector3(0,1,0).applyQuaternion(c.root.quaternion);
 c.result=up.y>=0?'HEAD':'TAIL';c.active=false;c.done=true;
 if(activeCoinsDone())onAllCoinsResolved();
}
function activeCoinsDone(){for(let i=0;i<state.coinCount;i++)if(!coins[i].done)return false;return true;}
function updateCoin(dt){
 for(let i=0;i<state.coinCount;i++){
  const c=coins[i];if(!c.active)continue;
  c.vel.y-=12.5*dt;c.root.position.addScaledVector(c.vel,dt);
  c.root.rotation.x+=c.ang.x*dt;c.root.rotation.y+=c.ang.y*dt;c.root.rotation.z+=c.ang.z*dt;
  if(c.root.position.y<=1.36&&c.vel.y<0){
   c.root.position.y=1.36;
   if(c.bounces<2&&Math.abs(c.vel.y)>.75){c.vel.y*=-.32;c.vel.x*=.7;c.vel.z*=.7;c.ang.multiplyScalar(.56);c.bounces++;}
   else{
    c.vel.set(0,0,0);c.ang.multiplyScalar(.84);
    if(c.ang.length()<.65){
     const up=new THREE.Vector3(0,1,0).applyQuaternion(c.root.quaternion),head=up.y>=0;
     const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(head?0:Math.PI,0,Math.PI/2));
     c.root.quaternion.slerp(q,Math.min(1,dt*10));
     if(c.root.quaternion.angleTo(q)<.035){c.root.quaternion.copy(q);finish(c);}
    }
   }
  }
 }
}
