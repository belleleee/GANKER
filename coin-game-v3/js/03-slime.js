
'use strict';

function createProjectSlime(color=0x4fd695,scale=1){
  const root=new THREE.Group();
  const body=new THREE.Group();
  body.position.y=.30*scale;root.add(body);

  const base=new THREE.Color(color);
  const mid=base.clone().lerp(new THREE.Color(0xffffff),.38);
  const coreC=base.clone().multiplyScalar(.76);

  const outerMat=new THREE.MeshBasicMaterial({color:base,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false});
  const midMat=new THREE.MeshBasicMaterial({color:mid,transparent:true,opacity:.30,side:THREE.DoubleSide,depthWrite:false});
  const coreMat=new THREE.MeshBasicMaterial({color:coreC,transparent:true,opacity:.52,depthWrite:false});

  const r=.32*scale;
  const geo=new THREE.SphereGeometry(r,26,18);
  const outer=new THREE.Mesh(geo,outerMat);body.add(outer);
  body.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo,18),MAT));

  const midLayer=new THREE.Mesh(geo.clone(),midMat);midLayer.scale.setScalar(.90);body.add(midLayer);
  const core=new THREE.Mesh(new THREE.SphereGeometry(.145*scale,18,14),coreMat);
  core.position.set(0,-.035*scale,0);body.add(core);

  const bubbleMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.28,depthWrite:false});
  const bubbles=[];
  const bp=[[-.10,.07,.06],[.11,-.03,-.04],[-.04,-.11,.10],[.07,.12,-.08]];
  bp.forEach((p,i)=>{
    const b=new THREE.Mesh(new THREE.SphereGeometry((.025+i*.004)*scale,8,6),bubbleMat);
    b.position.set(p[0]*scale,p[1]*scale,p[2]*scale);body.add(b);
    bubbles.push({mesh:b,phase:Math.random()*Math.PI*2});
  });

  const eyeMat=new THREE.MeshBasicMaterial({color:0x394039});
  const eyes=[];
  for(const x of [-.085,.085]){
    const e=new THREE.Mesh(new THREE.SphereGeometry(.026*scale,8,6),eyeMat);
    e.position.set(x*scale,.055*scale,.275*scale);
    e.scale.set(.75,1.1,.45);body.add(e);eyes.push(e);
  }

  root.userData.slime={
    body,core,bubbles,eyes,
    pulse:Math.random()*Math.PI*2,
    phase:Math.random()*Math.PI*2,
    baseY:body.position.y
  };
  return root;
}

function updateProjectSlime(root,time,moving=false){
  const s=root.userData.slime;if(!s)return;
  const pulse=moving?Math.sin(time*8+s.pulse):Math.sin(time*2+s.pulse);
  const sy=moving?.91+pulse*.06:.97+pulse*.025;
  const sxz=1/Math.sqrt(Math.max(sy,.1));
  s.body.scale.set(sxz,sy,sxz);
  s.body.rotation.z=Math.sin(time*(moving?7:2.2)+s.phase)*(moving?.025:.01);
  s.core.position.y=-.035+Math.sin(time*1.8+s.pulse)*.012;
  s.bubbles.forEach(b=>{
    const bs=.88+Math.sin(time*2.2+b.phase)*.08;b.mesh.scale.setScalar(bs);
  });
  const blink=(time+s.phase)%4.4<.13;
  s.eyes.forEach(e=>e.scale.y=blink?.15:1.1);
}

const playerSlime=createProjectSlime(0x55d7a0,1.15);
playerSlime.position.set(0,.12,2.1);scene.add(playerSlime);

const helperSlots=[[-2.4,.14,1.3],[2.4,.14,1.25],[-3.2,.14,-.4],[3.2,.14,-.35]];
const helpers=[];
function syncHelpers(n){
  while(helpers.length<n && helpers.length<4){
    const i=helpers.length;
    const s=createProjectSlime([0x7ac7b2,0xa7c985,0x9bb9dc,0xd3adcf][i],.78);
    s.position.set(...helperSlots[i]);scene.add(s);
    helpers.push(s);
  }
  helpers.forEach((h,i)=>h.visible=i<n);
}
function updateSlimes(time){
  updateProjectSlime(playerSlime,time,true);
  helpers.forEach((h,i)=>{
    if(!h.visible)return;
    h.position.y=.14+Math.sin(time*2.2+i)*.025;
    updateProjectSlime(h,time,true);
  });
}
