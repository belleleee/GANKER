
'use strict';

const COIN_SLOTS=[
 [-1.55,1.6,-.15],[-.52,1.6,-.15],[.52,1.6,-.15],[1.55,1.6,-.15],
 [-.75,1.55,.72],[.75,1.55,.72]
];

const coins=[];

function makeBigCoin(i){
  const root=new THREE.Group();scene.add(root);

  const r=i===0?.62:.40;
  const geo=new THREE.CylinderGeometry(r,r,.10,36);
  const mesh=new THREE.Mesh(geo,C.coin);root.add(mesh);
  root.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,16),MAT));

  // Cylinder axis Y. Rotate so coin initially stands facing camera.
  root.rotation.z=Math.PI/2;

  const ring=edge(new THREE.TorusGeometry(r*.65,.025,6,32),C.coin2);
  ring.rotation.y=Math.PI/2;ring.position.x=.055;root.add(ring);

  const star=edge(new THREE.OctahedronGeometry(r*.24,0),C.coin2);
  star.scale.set(1.2,.35,1.2);star.position.x=.062;root.add(star);

  const c={root,index:i,r,active:false,done:true,result:null,vel:new THREE.Vector3(),ang:new THREE.Vector3(),bounce:0,baseY:1.35};
  coins.push(c);resetCoin(c);
  return c;
}

function resetCoin(c){
  const p=COIN_SLOTS[c.index];
  c.root.position.set(p[0],c.baseY,p[2]);
  c.root.rotation.set(0,0,Math.PI/2);
  c.active=false;c.done=true;c.result=null;c.vel.set(0,0,0);c.ang.set(0,0,0);c.bounce=0;
}

function syncCoins(n){
  while(coins.length<n)makeBigCoin(coins.length);
  coins.forEach((c,i)=>c.root.visible=i<n);
}

function allDone(){
  for(let i=0;i<state.coinCount;i++)if(!coins[i].done)return false;
  return true;
}

function launchCoins(){
  for(let i=0;i<state.coinCount;i++){
    const c=coins[i],p=COIN_SLOTS[i];
    c.done=false;c.active=true;c.result=null;c.bounce=0;
    c.root.position.set(p[0],1.55,p[2]);
    c.vel.set((Math.random()-.5)*.5,5.0+Math.random()*1.2,(Math.random()-.5)*.45);
    c.ang.set(10+Math.random()*5,4+Math.random()*5,16+Math.random()*7);
  }
}

function settle(c){
  const up=new THREE.Vector3(0,1,0).applyQuaternion(c.root.quaternion);
  c.result=up.y>=0?'HEAD':'TAIL';c.active=false;c.done=true;
  if(allDone())onCoinsResolved();
}

function updateCoins(dt){
  for(let i=0;i<state.coinCount;i++){
    const c=coins[i];if(!c.active)continue;
    c.vel.y-=12.5*dt;
    c.root.position.addScaledVector(c.vel,dt);
    c.root.rotation.x+=c.ang.x*dt;c.root.rotation.y+=c.ang.y*dt;c.root.rotation.z+=c.ang.z*dt;

    const floor=1.32;
    if(c.root.position.y<=floor && c.vel.y<0){
      c.root.position.y=floor;
      if(c.bounce<2 && Math.abs(c.vel.y)>.8){
        c.vel.y*=-.33;c.vel.x*=.72;c.vel.z*=.72;c.ang.multiplyScalar(.58);c.bounce++;
      }else{
        c.vel.set(0,0,0);c.ang.multiplyScalar(.84);
        if(c.ang.length()<.7){
          const up=new THREE.Vector3(0,1,0).applyQuaternion(c.root.quaternion);
          const head=up.y>=0;
          const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(head?0:Math.PI,0,Math.PI/2));
          c.root.quaternion.slerp(q,Math.min(1,dt*9));
          if(c.root.quaternion.angleTo(q)<.035){c.root.quaternion.copy(q);settle(c);}
        }
      }
    }
  }
}
