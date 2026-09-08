
'use strict';

const MAX_HELPERS=8;

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

  const handMat=new THREE.MeshBasicMaterial({color:base,transparent:true,opacity:.34,depthWrite:false});
  const hands=[];
  for(const x of [-.18,.18]){
    const h=new THREE.Mesh(new THREE.SphereGeometry(.055*scale,10,8),handMat);
    h.position.set(x*scale,-.02*scale,.20*scale);
    h.scale.set(.75,.55,.75);
    h.visible=false;
    body.add(h);
    hands.push(h);
  }

  root.userData.slime={
    body,core,bubbles,eyes,hands,
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

const ROOM_REST = {
    active: false,
    kind: null,
    t0: 0,
    duration: 2.8,
    home: new THREE.Vector3(),
    target: new THREE.Vector3()
};

const playerKeys={};
const playerControl={
  vy:0,yaw:0,moveSpeed:0,onGround:true,groundT:0,
  pulse:0,squash:.97,squashV:0,wob:0,wobV:0,tilt:0,tiltV:0
};

const PLAYER_COIN_ACTION = {
  active:false,
  t:0,
  coinIndex:0,
  released:false,
  doneAt:0,
  from:new THREE.Vector3(),
  grab:new THREE.Vector3(-1.25,.12,-1.05),
  throwYaw:0,
  onRelease:null
};

const PLAYER_THROW_QUEUE = {
  active:false,
  list:[],
  onRelease:null
};

function beginPlayerCoinBatchThrow(count,onRelease){
  if(PLAYER_THROW_QUEUE.active||PLAYER_COIN_ACTION.active)return false;
  if(ROOM_REST.active)return false;
  PLAYER_THROW_QUEUE.active=true;
  PLAYER_THROW_QUEUE.list=Array.from({length:count},(_,i)=>i);
  PLAYER_THROW_QUEUE.onRelease=onRelease;
  return true;
}

function updatePlayerThrowQueue(){
  const q=PLAYER_THROW_QUEUE;
  if(!q.active)return;
  if(PLAYER_COIN_ACTION.active)return;
  if(ROOM_REST.active)return;
  if(!q.list.length){q.active=false;q.onRelease=null;return;}
  const idx=q.list[0];
  if(beginPlayerCoinThrow(q.onRelease,idx)){
    q.list.shift();
  }
}

const helperThrowQueues=Array.from({length:MAX_HELPERS},()=>({active:false,list:[],onRelease:null}));

function queueHelperThrow(i,indices,onRelease){
  const helper=helpers[i];
  if(!helper)return false;
  const q=helperThrowQueues[i];
  if(q.active)return false;
  q.active=true;
  q.list=indices.slice();
  q.onRelease=onRelease;
  return true;
}

function updateHelperThrowQueue(i){
  const helper=helpers[i];
  const q=helperThrowQueues[i];
  if(!helper||!q||!q.active)return;
  if(!helperCanWork(helper))return;
  if(actorBusy(helper))return;
  if(!q.list.length){q.active=false;q.onRelease=null;return;}
  const batch=q.list.splice(0,helperCoinCapacity(helper));
  if(!startHelperCoinThrow(helper,batch,q.onRelease)){
    q.list.unshift(...batch);
  }
}

function actorBusy(actor){
  if(actor===playerSlime)return PLAYER_COIN_ACTION.active;
  return !!(actor.userData.coinAction&&actor.userData.coinAction.active);
}

function lerpAngle(a,b,t){
  const d=(b-a+Math.PI*3)%(Math.PI*2)-Math.PI;
  return a+d*t;
}

function typingInRoomInput(){
  const el=document.activeElement;
  return !!(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.isContentEditable));
}

function clearPlayerMoveKeys(){
  for(const key of Object.keys(playerKeys))playerKeys[key]=false;
}

function tryPlayerSlimeJump(){
  const now=performance.now()*.001;
  if(playerControl.onGround||(now-playerControl.groundT)<.15){
    playerControl.vy=7.0;
    playerControl.onGround=false;
    playerControl.groundT=-10;
    playerControl.squashV+=1.3;
    playerControl.wobV+=2.2;
  }
}

function beginPlayerCoinThrow(onRelease,coinIndex=0){
  if(PLAYER_COIN_ACTION.active)return false;
  if(ROOM_REST.active)return false;

  clearPlayerMoveKeys();

  PLAYER_COIN_ACTION.active=true;
  PLAYER_COIN_ACTION.t=0;
  PLAYER_COIN_ACTION.coinIndex=coinIndex;
  PLAYER_COIN_ACTION.released=false;
  PLAYER_COIN_ACTION.doneAt=0;
  PLAYER_COIN_ACTION.from.copy(playerSlime.position);
  if(typeof coinGrabPoint==='function')PLAYER_COIN_ACTION.grab.copy(coinGrabPoint(coinIndex));
  PLAYER_COIN_ACTION.onRelease=onRelease;

  return true;
}

function setPlayerCoinHands(s,visible,reach=0,lift=0){
  if(!s||!s.hands)return;
  s.hands.forEach((h,i)=>{
    h.visible=visible;
    const side=i===0?-1:1;
    h.position.x=side*(.18+.03*reach)*1.15;
    h.position.y=(-.02+.07*lift)*1.15;
    h.position.z=(.20+.20*reach)*1.15;
    h.scale.set(.75+.25*reach,.55+.18*lift,.75+.25*reach);
  });
}

function updatePlayerCoinAction(time,dt){
  if(!PLAYER_COIN_ACTION.active)return false;

  const a=PLAYER_COIN_ACTION;
  const s=playerSlime.userData.slime;
  a.t+=dt;

  const grab=a.grab;
  const toGrab=grab.clone().sub(playerSlime.position);
  a.throwYaw=Math.atan2(-Math.sin(camYaw),-Math.cos(camYaw));

  if(a.t<.72){
    const k=smoothRoom(clamp(a.t/.72,0,1));
    playerSlime.position.lerpVectors(a.from,grab,k);
    playerControl.moveSpeed=1.25*(1-k);
    const yaw=Math.atan2(toGrab.x,toGrab.z);
    playerControl.yaw=lerpAngle(playerControl.yaw,yaw,Math.min(1,dt*8));
    playerSlime.rotation.y=playerControl.yaw;
    setPlayerCoinHands(s,true,k*.65,0);
  }else if(a.t<1.15){
    const k=smoothRoom(clamp((a.t-.72)/.43,0,1));
    playerSlime.position.copy(grab);
    playerControl.yaw=lerpAngle(playerControl.yaw,a.throwYaw,Math.min(1,dt*7));
    playerSlime.rotation.y=playerControl.yaw;
    setPlayerCoinHands(s,true,.65+.35*k,.1*k);
    if(typeof holdCoinBySlime==='function')holdCoinBySlime(playerSlime,a.coinIndex,.03*k);
  }else if(a.t<1.62){
    const k=smoothRoom(clamp((a.t-1.15)/.47,0,1));
    playerSlime.position.copy(grab);
    playerControl.yaw=lerpAngle(playerControl.yaw,a.throwYaw,Math.min(1,dt*10));
    playerSlime.rotation.y=playerControl.yaw;
    setPlayerCoinHands(s,true,1,.25+.75*k);
    if(typeof holdCoinBySlime==='function')holdCoinBySlime(playerSlime,a.coinIndex,.03+.28*k);
  }else{
    if(!a.released){
      a.released=true;
      const basis=new THREE.Vector3(Math.sin(playerSlime.rotation.y),0,Math.cos(playerSlime.rotation.y));
      const origin=playerSlime.position.clone().addScaledVector(basis,.40);
      origin.y+=.88;
      if(typeof a.onRelease==='function')a.onRelease(a.coinIndex,origin,playerSlime.rotation.y);
    }

    setPlayerCoinHands(s,true,.45,1);
    playerSlime.rotation.x=Math.sin((a.t-1.62)*5)*.04;

    const c=typeof coins!=='undefined'?coins[a.coinIndex]:null;
    if(c&&c.done){
      if(!a.doneAt)a.doneAt=a.t;
      if(a.t-a.doneAt>.55){
        a.active=false;
        a.onRelease=null;
        playerSlime.rotation.x=0;
        setPlayerCoinHands(s,false,0,0);
      }
    }
  }

  const breathe=1+Math.sin(time*1.8)*.025;
  const crouch=a.t<1.15?.95-.12*Math.sin(clamp((a.t-.55)/.60,0,1)*Math.PI):1;
  const stretch=a.t>=1.15&&a.t<1.72?1+.18*Math.sin(clamp((a.t-1.15)/.57,0,1)*Math.PI):1;
  const sy=clamp(breathe*crouch*stretch,.78,1.24);
  const sxz=1/Math.sqrt(sy);
  s.body.scale.set(sxz,sy,sxz);
  s.body.position.y=.30*1.15*sy;
  s.body.rotation.z=Math.sin(time*5+a.t*4)*.035;
  s.core.position.y=-.035+Math.sin(time*2.5)*.012;
  s.bubbles.forEach(b=>{
    b.mesh.scale.setScalar(.9+Math.sin(time*3+b.phase)*.08);
  });
  s.eyes.forEach(e=>{
    e.scale.y=1.22;
    e.position.y=.07*1.15+(a.released?.025:0);
  });

  return true;
}

addEventListener('keydown',e=>{
  if(typingInRoomInput())return;
  playerKeys[e.code]=true;
  if(e.code==='Space'){
    e.preventDefault();
    tryPlayerSlimeJump();
  }
});

addEventListener('keyup',e=>{
  playerKeys[e.code]=false;
  if(e.code==='Space'&&playerControl.vy>2.6)playerControl.vy=2.6;
});

addEventListener('blur',clearPlayerMoveKeys);

function landPlayerSlime(time){
  if(playerControl.vy<-3.0){
    const impact=Math.min(1.5,(-playerControl.vy-3.0)*.30);
    playerControl.squashV-=impact;
    playerControl.wobV+=impact*2.6;
  }
  playerSlime.position.y=.12;
  playerControl.vy=0;
  playerControl.onGround=true;
  playerControl.groundT=time;
}

function updatePlayerSlimeMove(dt,time){
  if(ROOM_REST.active||PLAYER_COIN_ACTION.active){
    playerControl.moveSpeed+=(-playerControl.moveSpeed)*Math.min(1,dt*10);
    playerControl.onGround=true;
    playerControl.vy=0;
    return false;
  }

  let ix=0,iz=0;
  if(!typingInRoomInput()){
    if(playerKeys.KeyW||playerKeys.ArrowUp)iz+=1;
    if(playerKeys.KeyS||playerKeys.ArrowDown)iz-=1;
    if(playerKeys.KeyA||playerKeys.ArrowLeft)ix-=1;
    if(playerKeys.KeyD||playerKeys.ArrowRight)ix+=1;
    const m=Math.hypot(ix,iz);
    if(m>1){ix/=m;iz/=m;}
  }

  const running=!!(playerKeys.ShiftLeft||playerKeys.ShiftRight);
  const maxSpeed=running?3.2:1.6;
  let tx=0,tz=0;
  if(ix!==0||iz!==0){
    const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
    const rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
    tx=(fx*iz+rx*ix)*maxSpeed;
    tz=(fz*iz+rz*ix)*maxSpeed;
  }

  playerControl.moveSpeed+=(Math.hypot(tx,tz)-playerControl.moveSpeed)*Math.min(1,dt*10);
  const spd=playerControl.moveSpeed;
  const moving=spd>.12;
  if(moving)playerControl.pulse+=dt*(2.6+spd*1.3);

  const creep=moving?.45+.55*Math.max(0,Math.sin(playerControl.pulse-.5)):1;
  playerSlime.position.x=clamp(playerSlime.position.x+tx*dt*creep,-3.45,3.45);
  playerSlime.position.z=clamp(playerSlime.position.z+tz*dt*creep,-3.25,3.25);

  const ground=.12;
  if(playerSlime.position.y<=ground+.001&&playerControl.vy<=0){
    landPlayerSlime(time);
  }else{
    playerControl.vy-=22*dt;
    playerSlime.position.y+=playerControl.vy*dt;
    if(playerSlime.position.y<=ground&&playerControl.vy<=0)landPlayerSlime(time);
    else playerControl.onGround=false;
  }

  if(spd>.15)playerControl.yaw=lerpAngle(playerControl.yaw,Math.atan2(tx,tz),Math.min(1,dt*9));
  playerSlime.rotation.y=playerControl.yaw;
  return moving;
}

function updateControlledPlayerSlime(time,dt,moving){
  const s=playerSlime.userData.slime;
  if(!s)return;

  const breathe=1+Math.sin(time*1.7)*.03;
  const pulseSq=moving?1-.10*Math.max(0,Math.sin(playerControl.pulse-.9)):1;
  let jumpSq=1;
  if(!playerControl.onGround)jumpSq=playerControl.vy>2?1.22:(playerControl.vy<-2?1.12:1.07);
  const targetS=.97*breathe*pulseSq*jumpSq;
  playerControl.squashV+=(targetS-playerControl.squash)*165*dt;
  playerControl.squashV*=Math.exp(-6.2*dt);
  playerControl.squash+=playerControl.squashV*dt;

  const sy=clamp(playerControl.squash,.45,1.5);
  playerControl.wobV+=(-playerControl.wob)*55*dt;
  playerControl.wobV*=Math.exp(-3.4*dt);
  playerControl.wob+=playerControl.wobV*dt;
  const wob=clamp(playerControl.wob,-.35,.35);
  const sxz=(1/Math.sqrt(sy))*(1+wob*.10);

  const leanT=Math.min(playerControl.moveSpeed/1.6,1)*.15;
  playerControl.tiltV+=(leanT-playerControl.tilt)*130*dt;
  playerControl.tiltV*=Math.exp(-5*dt);
  playerControl.tilt+=playerControl.tiltV*dt;

  s.body.scale.set(sxz,sy,sxz);
  s.body.position.y=.30*1.15*sy;
  s.body.rotation.x=playerControl.tilt+wob*.35;
  s.body.rotation.z=Math.sin(time*2.1)*.02+Math.sin(playerControl.pulse*.5)*.035*Math.min(playerControl.moveSpeed/1.6,1)+wob*.55;
  s.core.position.y=-.035+Math.sin(time*1.8+s.pulse)*.012;
  s.bubbles.forEach(b=>{
    const bs=.88+Math.sin(time*2.2+b.phase)*.08;
    b.mesh.scale.setScalar(bs);
  });
  const blink=(time+s.phase)%4.4<.13;
  s.eyes.forEach(e=>e.scale.y=blink?.15:1.1);
}

const HELPER_COLORS=[0x7ac7b2,0xa7c985,0x9bb9dc,0xd3adcf];
const helperSlots=Array.from({length:MAX_HELPERS},(_,i)=>{
  const a=(i/MAX_HELPERS)*Math.PI*2;
  return [Math.sin(a)*2.85,.14,Math.cos(a)*2.05];
});
const helpers=[];
let helperActionSerial=0;
function syncHelpers(n){
  while(helpers.length<n && helpers.length<MAX_HELPERS){
    const i=helpers.length;
    const s=createProjectSlime(HELPER_COLORS[i%HELPER_COLORS.length],.78);
    s.position.set(...helperSlots[i]);scene.add(s);
    helpers.push(s);
  }
  helpers.forEach((h,i)=>h.visible=i<n);
}

function setHelperCoinHands(helper,visible,reach=0,lift=0){
  const s=helper&&helper.userData.slime;
  if(!s||!s.hands)return;
  s.hands.forEach((h,i)=>{
    h.visible=visible;
    const side=i===0?-1:1;
    h.position.x=side*(.18+.03*reach)*.78;
    h.position.y=(-.02+.07*lift)*.78;
    h.position.z=(.20+.20*reach)*.78;
    h.scale.set(.75+.25*reach,.55+.18*lift,.75+.25*reach);
  });
}

function helperEmployeeIndex(helper){
  return helpers.indexOf(helper);
}

function helperEmployeeState(helper){
  const i=helperEmployeeIndex(helper);
  return typeof state!=='undefined'&&Array.isArray(state.helperEmployees)?state.helperEmployees[i]:null;
}

function helperCanWork(helper){
  const emp=helperEmployeeState(helper);
  return !emp||!emp.striking;
}

function helperCoinCapacity(){
  return 1;
}

function helperSpeedFactor(helper){
  const emp=helperEmployeeState(helper);
  const speed=emp&&emp.skills?Number(emp.skills.multi)||0:0;
  return Math.max(.4,1-speed*.15);
}

function helperGrabPointForCoins(helperIndex,list){
  const rig=typeof EMPLOYEE_RIGS!=='undefined'?EMPLOYEE_RIGS[helperIndex]:null;
  if(!Array.isArray(list)||!list.length||!rig||typeof rigGrabPoint!=='function'){
    return new THREE.Vector3(-1.25,.12,-1.05);
  }
  const p=new THREE.Vector3();
  list.forEach(idx=>p.add(rigGrabPoint(rig,idx)));
  p.multiplyScalar(1/list.length);
  return p;
}

function helperAnimProfile(helper,list){
  const i=Math.max(0,helperEmployeeIndex(helper));
  const emp=helperEmployeeState(helper);
  const diligent=emp&&emp.skills?Number(emp.skills.diligent)||0:0;
  const speed=helperSpeedFactor(helper);
  const multi=Array.isArray(list)?list.length:1;
  const first=Array.isArray(list)&&list.length?list[0]:0;
  const serial=helperActionSerial++;
  const kind=(i*3+first*5+multi*2+serial)%8;
  const phase=(i+1)*1.37+multi*.41+serial*.73;
  const center=new THREE.Vector3(0,.12,.15);
  const grab=helperGrabPointForCoins(i,list);
  const dx=center.x-grab.x;
  const dz=center.z-grab.z;
  return {
    kind,
    moveDur:Math.max(.18,(.70+(kind%3)*.06-i*.035-diligent*.025)*speed),
    grabDur:(.26+(kind%4)*.065)*speed,
    windDur:(.34+(kind%5)*.055+multi*.04)*speed,
    observeDur:Math.max(.12,(.28+(kind%4)*.095)*speed),
    hop:.08+(kind%5)*.035+multi*.025,
    curve:(kind%2===0?1:-1)*(.12+(kind%4)*.055+multi*.035),
    sway:.08+(kind%5)*.035,
    handLift:.70+(kind%4)*.12+multi*.08,
    throwYaw:Math.atan2(dx,dz)+(kind-3.5)*.08,
    spin:kindsToSpin(kind),
    phase
  };
}

function kindsToSpin(kind){
  return [0,.22,-.18,.35,-.32,.12,-.26,.42][kind]||0;
}

function applyHelperMoveStyle(helper,a,style,k,side){
  const wave=Math.sin(k*Math.PI);
  if(style.kind===0){
    helper.position.addScaledVector(side,wave*style.curve);
    helper.position.y=.14+wave*style.hop;
  }else if(style.kind===1){
    helper.position.addScaledVector(side,Math.sin(k*Math.PI*2)*style.curve*.55);
    helper.position.y=.14+Math.max(0,Math.sin(k*Math.PI*2))*style.hop*.75;
  }else if(style.kind===2){
    helper.position.addScaledVector(side,wave*style.curve*.35);
    helper.position.y=.14+wave*style.hop*1.8;
  }else if(style.kind===3){
    const pause=k<.22?0:smoothRoom((k-.22)/.78);
    helper.position.lerpVectors(a.from,a.grab,pause);
    helper.position.addScaledVector(side,Math.sin(pause*Math.PI)*style.curve*1.25);
    helper.position.y=.14+Math.sin(pause*Math.PI)*style.hop;
  }else if(style.kind===4){
    helper.position.addScaledVector(side,Math.sin(k*Math.PI*3)*style.curve*.45);
    helper.position.y=.14+wave*style.hop*.65;
  }else if(style.kind===5){
    helper.position.addScaledVector(side,wave*style.curve*1.7);
    helper.position.y=.14+Math.pow(wave,.55)*style.hop*.9;
  }else if(style.kind===6){
    helper.position.addScaledVector(side,wave*style.curve*.25);
    helper.position.y=.14+Math.sin(k*Math.PI*4)*.025+wave*style.hop*.45;
  }else{
    helper.position.addScaledVector(side,wave*style.curve);
    helper.position.y=.14+Math.sin(k*Math.PI*1.5)*style.hop;
    helper.rotation.y+=style.spin*wave*.08;
  }
}

function applyHelperGrabStyle(helper,s,style,k){
  const body=s&&s.body;
  if(!body)return;
  if(style.kind===0||style.kind===5){
    body.scale.y*=.86-.08*Math.sin(k*Math.PI);
    body.rotation.x=-.10*Math.sin(k*Math.PI);
  }else if(style.kind===1||style.kind===6){
    body.rotation.z+=Math.sin(k*Math.PI*4+style.phase)*.12;
    body.scale.x*=1+.06*Math.sin(k*Math.PI);
  }else if(style.kind===2){
    body.scale.y*=.75+.20*k;
    body.rotation.x=-.18*(1-k);
  }else if(style.kind===3){
    body.scale.z*=1+.18*Math.sin(k*Math.PI);
  }else if(style.kind===4){
    body.rotation.y+=Math.sin(k*Math.PI)*.20;
    body.rotation.z+=Math.sin(k*Math.PI*2)*.10;
  }else{
    body.scale.y*=1+.08*Math.sin(k*Math.PI*2);
    body.rotation.x+=Math.sin(k*Math.PI)*.09;
  }
}

function applyHelperWindStyle(helper,s,style,k){
  const body=s&&s.body;
  if(!body)return;
  const wave=Math.sin(k*Math.PI);
  if(style.kind===0){
    body.rotation.z+=Math.sin(k*Math.PI*2+style.phase)*.11;
    body.scale.y*=1+.16*wave;
  }else if(style.kind===1){
    helper.rotation.y+=style.spin*wave*.15;
    body.scale.x*=1+.13*wave;
  }else if(style.kind===2){
    body.scale.y*=1+.28*wave;
    body.rotation.x+=.16*wave;
  }else if(style.kind===3){
    helper.position.addScaledVector(new THREE.Vector3(Math.sin(aSafeYaw(helper)),0,Math.cos(aSafeYaw(helper))),-.10*wave);
    body.scale.z*=1+.20*wave;
  }else if(style.kind===4){
    body.rotation.z+=Math.sin(k*Math.PI*5+style.phase)*.18;
    body.scale.y*=1+.10*wave;
  }else if(style.kind===5){
    helper.position.y=.14+wave*style.hop*.85;
    body.rotation.x-=.20*wave;
  }else if(style.kind===6){
    body.scale.x*=1+.08*Math.sin(k*Math.PI*3);
    body.scale.z*=1+.12*wave;
  }else{
    helper.rotation.y+=style.spin*wave*.20;
    body.rotation.z+=style.spin*wave;
  }
}

function aSafeYaw(o){
  return o&&Number.isFinite(o.rotation.y)?o.rotation.y:0;
}

function startHelperCoinThrow(helper,coinIndices,onRelease){
  if(!helper||!helper.visible)return false;
  if(!helperCanWork(helper))return false;
  if(helper.userData.coinAction&&helper.userData.coinAction.active)return false;
  const list=Array.isArray(coinIndices)?coinIndices:[coinIndices];
  const first=list[0];
  const helperIndex=helperEmployeeIndex(helper);
  const grab=helperGrabPointForCoins(helperIndex,list);
  const style=helperAnimProfile(helper,list);
  const action={
    active:true,
    t:0,
    coinIndex:first,
    coinIndices:list,
    released:false,
    doneAt:0,
    from:helper.position.clone(),
    grab,
    throwYaw:style.throwYaw,
    style,
    onRelease
  };
  helper.userData.coinAction=action;
  return true;
}

function updateHelperCoinAction(helper,time,dt){
  const a=helper&&helper.userData.coinAction;
  if(!a||!a.active)return false;
  const s=helper.userData.slime;
  const helperIndex=helperEmployeeIndex(helper);
  const rig=typeof EMPLOYEE_RIGS!=='undefined'?EMPLOYEE_RIGS[helperIndex]:null;
  a.t+=dt;
  const toGrab=a.grab.clone().sub(helper.position);
  const style=a.style||helperAnimProfile(helper,a.coinIndices);
  const moveEnd=style.moveDur;
  const grabEnd=moveEnd+style.grabDur;
  const windEnd=grabEnd+style.windDur;

  if(a.t<moveEnd){
    const k=smoothRoom(clamp(a.t/moveEnd,0,1));
    helper.position.lerpVectors(a.from,a.grab,k);
    const side=new THREE.Vector3(
      -(a.grab.z-a.from.z),
      0,
      a.grab.x-a.from.x
    );
    if(side.lengthSq()>.001)side.normalize();
    applyHelperMoveStyle(helper,a,style,k,side);
    helper.rotation.y=lerpAngle(helper.rotation.y,Math.atan2(toGrab.x,toGrab.z),Math.min(1,dt*8));
    setHelperCoinHands(helper,true,k*.65,0);
    updateProjectSlime(helper,time,true);
    const body=s&&s.body;
    if(body)body.rotation.z+=Math.sin(k*Math.PI*2+style.phase)*style.sway;
  }else if(a.t<grabEnd){
    const k=smoothRoom(clamp((a.t-moveEnd)/style.grabDur,0,1));
    helper.position.copy(a.grab);
    helper.position.y=.14+Math.sin(k*Math.PI)*style.hop*.35;
    helper.rotation.y=lerpAngle(helper.rotation.y,a.throwYaw,Math.min(1,dt*7));
    setHelperCoinHands(helper,true,.65+.35*k,.1*k);
    if(rig&&typeof holdRigCoinBySlime==='function')a.coinIndices.forEach((idx,n)=>holdRigCoinBySlime(rig,helper,idx,.03*k,n,a.coinIndices.length));
    updateProjectSlime(helper,time,false);
    applyHelperGrabStyle(helper,s,style,k);
  }else if(a.t<windEnd){
    const k=smoothRoom(clamp((a.t-grabEnd)/style.windDur,0,1));
    helper.position.copy(a.grab);
    helper.position.y=.14+Math.sin(k*Math.PI)*style.hop*.55;
    helper.rotation.y=lerpAngle(helper.rotation.y,a.throwYaw,Math.min(1,dt*10));
    setHelperCoinHands(helper,true,1,.25+style.handLift*k);
    if(rig&&typeof holdRigCoinBySlime==='function')a.coinIndices.forEach((idx,n)=>holdRigCoinBySlime(rig,helper,idx,.03+.28*k,n,a.coinIndices.length));
    updateProjectSlime(helper,time,false);
    applyHelperWindStyle(helper,s,style,k);
  }else{
    if(!a.released){
      a.released=true;
      const basis=new THREE.Vector3(Math.sin(helper.rotation.y),0,Math.cos(helper.rotation.y));
      const origin=helper.position.clone().addScaledVector(basis,.38);
      origin.y+=.70+Math.min(.18,a.coinIndices.length*.05);
      if(typeof a.onRelease==='function'){
        a.coinIndices.forEach((idx,n)=>{
          const yaw=helper.rotation.y+(n-(a.coinIndices.length-1)*.5)*.10;
          a.onRelease(idx,origin,yaw);
        });
      }
    }
    const observeT=a.t-windEnd;
    const look=Math.min(1,observeT/style.observeDur);
    setHelperCoinHands(helper,true,.35+.10*Math.sin(observeT*9+style.phase),.75*(1-look));
    helper.rotation.x=Math.sin(observeT*5+style.phase)*.04*(1-look);
    helper.rotation.y=lerpAngle(helper.rotation.y,a.throwYaw+Math.sin(observeT*3+style.phase)*.08,Math.min(1,dt*5));
    updateProjectSlime(helper,time,false);

    const done=a.coinIndices.every(idx=>rig&&rig.coins[idx]&&rig.coins[idx].done);
    if(done){
      if(!a.doneAt)a.doneAt=a.t;
      if(a.t-a.doneAt>style.observeDur){
        a.active=false;
        helper.rotation.x=0;
        setHelperCoinHands(helper,false,0,0);
      }
    }
  }
  return true;
}

function updateSlimes(time, dt){
  const acting = updatePlayerCoinAction(time,dt);
  updatePlayerThrowQueue();
  const playerMoving = acting ? false : updatePlayerSlimeMove(dt,time);
  if(!acting)updateControlledPlayerSlime(time,dt,playerMoving);
  helpers.forEach((h,i)=>{
    if(!h.visible)return;
    updateHelperThrowQueue(i);
    if(updateHelperCoinAction(h,time,dt))return;
    h.position.y=.14+Math.sin(time*2.2+i)*.025;
    updateProjectSlime(h,time,true);
  });
}


/* ==========================================================
   ROOM REST INTERACTION
   给独立 coin-game 增加房间休息动作。
   不改变工作 worker 状态机；工作时不允许强行休息。
   ========================================================== */

function triggerSlimeRest(
    kind,
    object = null
) {
    const worker =
        playerSlime.userData.worker;

    if (
        worker &&
        worker.state !== 'idle'
    ) {
        if (
            typeof showResult === 'function'
        ) {
            showResult(
                '史莱姆正在工作'
            );
        }

        return;
    }

    ROOM_REST.active =
        true;

    ROOM_REST.kind =
        kind;

    ROOM_REST.t0 =
        performance.now() *
        0.001;

    ROOM_REST.home.copy(
        playerSlime.position
    );

    if (
        kind === 'bed'
    ) {
        ROOM_REST.target.set(
            -2.72,
            0.52,
            -3.02
        );
    } else if (
        kind === 'chair'
    ) {
        ROOM_REST.target.copy(
            object.position
        );

        ROOM_REST.target.y =
            0.48;
    } else if (
        kind === 'kotatsu'
    ) {
        ROOM_REST.target.set(
            2.25,
            0.13,
            2.15
        );
    } else {
        ROOM_REST.target.set(
            -1.25,
            0.13,
            -0.85
        );
    }
}

function updateRoomRest(
    time
) {
    if (
        !ROOM_REST.active
    ) {
        return false;
    }

    const e =
        time -
        ROOM_REST.t0;

    const moveIn =
        0.60;

    const restEnd =
        ROOM_REST.duration -
        0.60;

    if (
        e <
        moveIn
    ) {
        const k =
            clamp(
                e /
                moveIn,
                0,
                1
            );

        const s =
            k *
            k *
            (
                3 -
                2 *
                k
            );

        playerSlime.position.lerpVectors(
            ROOM_REST.home,
            ROOM_REST.target,
            s
        );

        playerSlime.position.y +=
            Math.sin(
                k *
                Math.PI
            ) *
            0.18;

        updateProjectSlime(
            playerSlime,
            time,
            true
        );

        return true;
    }

    if (
        e <
        restEnd
    ) {
        playerSlime.position.copy(
            ROOM_REST.target
        );

        const body =
            playerSlime
                .userData
                .slime
                .body;

        if (
            ROOM_REST.kind === 'bed'
        ) {
            body.scale.set(
                1.22,
                0.62,
                1.08
            );

            body.rotation.z =
                0.14;
        } else if (
            ROOM_REST.kind === 'chair'
        ) {
            body.scale.set(
                1.08,
                0.78,
                1.08
            );

            body.rotation.z =
                0;
        } else if (
            ROOM_REST.kind === 'kotatsu'
        ) {
            body.scale.set(
                1.18,
                0.68,
                1.18
            );
        } else {
            updateProjectSlime(
                playerSlime,
                time,
                false
            );
        }

        return true;
    }

    if (
        e <
        ROOM_REST.duration
    ) {
        const k =
            clamp(
                (
                    e -
                    restEnd
                ) /
                0.60,
                0,
                1
            );

        const s =
            k *
            k *
            (
                3 -
                2 *
                k
            );

        playerSlime.position.lerpVectors(
            ROOM_REST.target,
            ROOM_REST.home,
            s
        );

        playerSlime.position.y +=
            Math.sin(
                k *
                Math.PI
            ) *
            0.14;

        updateProjectSlime(
            playerSlime,
            time,
            true
        );

        return true;
    }

    playerSlime.position.copy(
        ROOM_REST.home
    );

    playerSlime
        .userData
        .slime
        .body
        .scale
        .set(
            1,
            1,
            1
        );

    ROOM_REST.active =
        false;

    ROOM_REST.kind =
        null;

    return false;
}
