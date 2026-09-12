
'use strict';

const STARTING_COIN_WALLET=100;
const state={
  wallet:STARTING_COIN_WALLET,
  stake:1,
  best:1,
  roundStart:1,
  roundValue:1,
  multiplier:1,
  coinLevel:1,
  chanceLevel:0,
  helperCap:1,
  helperCount:0,
  helperStrategies:[],
  helperEmployees:[],
  selectedEmployee:0,
  activeStrategyIndex:-1,
  nextStrategyIndex:0,
  earned:0,
  lost:0,
  luckUntil:0,
  luckBought:0,
  luckStartWallet:STARTING_COIN_WALLET,
  nextTimedUi:0,
  auto:false,
  roundActive:false,
  waiting:false,
  consecutive:0,
  nextAuto:0,
  warnedHelper:false,
  addictionWarnings:0,
  cooldownUntil:0
};

const BANKRUPT_COOLDOWN_SECONDS=90;

const employeeRounds=Array.from({length:MAX_HELPERS},()=>({
  active:false,
  waiting:false,
  stake:0,
  roundStart:0,
  roundValue:0,
  multiplier:1,
  consecutive:0,
  nextAuto:0
}));

const $=id=>document.getElementById(id);
const walletEl=$('wallet'),stakeEl=$('stake'),multEl=$('multiplier'),potentialEl=$('potential');
const earnedEl=$('earned'),lostEl=$('lost'),netEl=$('net'),chanceEl=$('chance');
const hintEl=$('hint'),resultEl=$('result'),mainAction=$('mainAction');
const returnGame=$('returnGame');
const panelToggle=$('panelToggle'),sidePanel=$('sidePanel');
const strategyList=$('strategyList');
const employeeList=$('employeeList'),employeeDetail=$('employeeDetail');
const buyCoinSlot=$('buyCoinSlot'),upgradeCoin=$('upgradeCoin'),upgradeChance=$('upgradeChance'),buyHelper=$('buyHelper'),toggleAuto=$('toggleAuto');
const bookOverlay=$('bookOverlay'),bookName=$('bookName'),bookStatus=$('bookStatus'),bookPhoto=$('bookPhoto'),bookSkills=$('bookSkills'),bookStats=$('bookStats'),bookLog=$('bookLog'),closeBookBtn=$('closeBook');
const warningOverlay=$('warningOverlay'),warningTitle=$('warningTitle'),warningBody=$('warningBody'),warningCooldown=$('warningCooldown'),warningCloseBtn=$('warningCloseBtn');

const COIN_GAME_FALLBACK_SAVE_KEY='coinGame.v4.save';
const CABIN_SESSION_KEY='magicCabin.session.v1';
const CABIN_RETURN_KEY='magicCabin.returnFromStore.v1';
const CABIN_GUEST_ID='guest';

function readGameJson(key,fallback){
  try{
    const raw=localStorage.getItem(key);
    return raw?JSON.parse(raw):fallback;
  }catch(err){
    return fallback;
  }
}

function writeGameJson(key,value){
  try{
    localStorage.setItem(key,JSON.stringify(value));
    return true;
  }catch(err){
    return false;
  }
}

function currentCabinUserId(){
  try{
    const raw=localStorage.getItem(CABIN_SESSION_KEY);
    if(!raw)return CABIN_GUEST_ID;
    try{
      const session=JSON.parse(raw);
      if(session&&typeof session==='object'&&typeof session.id==='string'&&session.id.trim())return session.id.trim();
      if(typeof session==='string'&&session.trim())return session.trim();
    }catch(parseErr){
      if(raw.trim())return raw.trim();
    }
  }catch(err){
    return CABIN_GUEST_ID;
  }
  return CABIN_GUEST_ID;
}

function currentCabinSaveKey(){
  const id=currentCabinUserId();
  return 'magicCabin.save.'+id+'.v1';
}

function clampInt(value,fallback,min,max){
  const n=Math.trunc(Number(value));
  if(!Number.isFinite(n))return fallback;
  return Math.max(min,Math.min(max,n));
}

function defaultHelperStrategy(index){
  return {
    stake:index===0?1:2,
    cashOutAt:index===0?2.0:2.5
  };
}

function normalizeHelperStrategy(raw,index){
  const fallback=defaultHelperStrategy(index);
  const stake=clampInt(raw&&raw.stake,fallback.stake,1,100);
  const cash=Number(raw&&raw.cashOutAt);
  return {
    stake,
    cashOutAt:Number.isFinite(cash)?Math.max(1.2,Math.min(20,Math.round(cash*10)/10)):fallback.cashOutAt
  };
}

function ensureHelperStrategies(){
  while(state.helperStrategies.length<state.helperCount){
    state.helperStrategies.push(defaultHelperStrategy(state.helperStrategies.length));
  }
  state.helperStrategies=state.helperStrategies
    .slice(0,state.helperCount)
    .map((s,i)=>normalizeHelperStrategy(s,i));
}

function defaultEmployee(index){
  const colors=['#7ac7b2','#a7c985','#9bb9dc','#d3adcf'];
  const now=nowSec();
  return {
    name:'员工 '+(index+1),
    color:colors[index%colors.length],
    hiredAt:now,
    paidUntil:now+3600,
    striking:false,
    earned:0,
    lost:0,
    trainingLog:[],
    skills:{luck:0,diligent:0,cheap:0,multi:0}
  };
}

function normalizeEmployee(raw,index){
  const d=defaultEmployee(index);
  const skills=raw&&raw.skills||{};
  const rawLog=Array.isArray(raw&&raw.trainingLog)?raw.trainingLog:[];
  return {
    name:typeof raw?.name==='string'&&raw.name.trim()?raw.name.trim().slice(0,10):d.name,
    color:typeof raw?.color==='string'?raw.color:d.color,
    hiredAt:Number(raw?.hiredAt)||d.hiredAt,
    paidUntil:Number(raw?.paidUntil)||d.paidUntil,
    striking:!!raw?.striking,
    earned:clampInt(raw?.earned,0,0,999999),
    lost:clampInt(raw?.lost,0,0,999999),
    trainingLog:rawLog.slice(-12).map(e=>({
      skill:typeof e?.skill==='string'?e.skill:'',
      level:clampInt(e?.level,0,0,10),
      at:Number(e?.at)||0
    })),
    skills:{
      luck:clampInt(skills.luck,0,0,10),
      diligent:clampInt(skills.diligent,0,0,5),
      cheap:clampInt(skills.cheap,0,0,5),
      multi:clampInt(skills.multi,0,0,4)
    }
  };
}

function ensureEmployees(){
  while(state.helperEmployees.length<state.helperCount){
    state.helperEmployees.push(defaultEmployee(state.helperEmployees.length));
  }
  state.helperEmployees=state.helperEmployees
    .slice(0,state.helperCount)
    .map((e,i)=>normalizeEmployee(e,i));
  state.selectedEmployee=clampInt(state.selectedEmployee,0,0,Math.max(0,state.helperCount-1));
}

function nowSec(){
  return Date.now()/1000;
}

function applyCoinGameSave(save){
  if(!save||typeof save!=='object')return false;
  state.wallet=clampInt(save.wallet,STARTING_COIN_WALLET,0,999999);
  state.stake=clampInt(save.stake,1,1,100);
  state.best=clampInt(save.best,state.stake,1,999999);
  state.coinLevel=clampInt(save.coinLevel,1,1,999);
  state.chanceLevel=clampInt(save.chanceLevel,0,0,8);
  state.helperCap=clampInt(save.helperCap,1,1,MAX_HELPERS);
  state.helperCount=clampInt(save.helperCount,0,0,MAX_HELPERS);
  state.helperStrategies=Array.isArray(save.helperStrategies)?save.helperStrategies:[];
  state.helperEmployees=Array.isArray(save.helperEmployees)?save.helperEmployees:[];
  state.selectedEmployee=clampInt(save.selectedEmployee,0,0,MAX_HELPERS-1);
  ensureHelperStrategies();
  ensureEmployees();
  state.nextStrategyIndex=clampInt(save.nextStrategyIndex,0,0,MAX_HELPERS-1);
  state.earned=clampInt(save.earned,0,0,999999);
  state.lost=clampInt(save.lost,0,0,999999);
  state.luckUntil=Number(save.luckUntil)||0;
  state.luckBought=clampInt(save.luckBought,0,0,9999);
  state.luckStartWallet=clampInt(save.luckStartWallet,state.wallet,0,999999);
  state.auto=state.helperCount>0||!!save.auto;
  state.warnedHelper=!!save.warnedHelper;
  state.addictionWarnings=clampInt(save.addictionWarnings,0,0,9999);
  state.cooldownUntil=Number(save.cooldownUntil)||0;
  return true;
}

function captureCoinGameSave(){
  ensureHelperStrategies();
  ensureEmployees();
  return {
    wallet:Math.floor(state.wallet),
    stake:Math.floor(state.stake),
    best:Math.floor(state.best),
    coinLevel:state.coinLevel,
    chanceLevel:state.chanceLevel,
    helperCap:state.helperCap,
    helperCount:state.helperCount,
    helperStrategies:state.helperStrategies.map((s,i)=>normalizeHelperStrategy(s,i)),
    helperEmployees:state.helperEmployees.map((e,i)=>normalizeEmployee(e,i)),
    selectedEmployee:state.selectedEmployee,
    nextStrategyIndex:state.nextStrategyIndex,
    earned:state.earned,
    lost:state.lost,
    luckUntil:state.luckUntil,
    luckBought:state.luckBought,
    luckStartWallet:state.luckStartWallet,
    auto:state.auto,
    warnedHelper:state.warnedHelper,
    addictionWarnings:state.addictionWarnings,
    cooldownUntil:state.cooldownUntil,
    savedAt:new Date().toISOString()
  };
}

function loadCoinGameState(){
  const cabinSave=readGameJson(currentCabinSaveKey(),null);
  if(cabinSave&&typeof cabinSave==='object'){
    const economy=cabinSave.economy||{};
    const coinGame=economy.coinGame||cabinSave.coinGame||{};
    const merged=Object.assign({},coinGame);
    if(Number.isFinite(Number(economy.coins)))merged.wallet=economy.coins;
    applyCoinGameSave(merged);
    return;
  }
  const returnSave=readGameJson(CABIN_RETURN_KEY,null);
  if(returnSave&&typeof returnSave==='object'&&returnSave.economy){
    const economy=returnSave.economy||{};
    const coinGame=economy.coinGame||returnSave.coinGame||{};
    const merged=Object.assign({},coinGame);
    if(Number.isFinite(Number(economy.coins)))merged.wallet=economy.coins;
    applyCoinGameSave(merged);
    return;
  }
  applyCoinGameSave(null);
}

function saveCoinGameState(){
  const data=captureCoinGameSave();
  const cabinKey=currentCabinSaveKey();
  const cabinSave=readGameJson(cabinKey,null);
  if(cabinSave&&typeof cabinSave==='object'){
    cabinSave.economy=cabinSave.economy||{};
    cabinSave.economy.coins=data.wallet;
    cabinSave.economy.coinGame=Object.assign({},cabinSave.economy.coinGame||{},data);
    cabinSave.savedAt=data.savedAt;
    writeGameJson(cabinKey,cabinSave);
  }
  writeGameJson(COIN_GAME_FALLBACK_SAVE_KEY,data);
}

const LUCK_BASE_DURATION=180;
const LUCK_MAX_DURATION=600;

function coinMultiplier(){return 1.45+(state.coinLevel-1)*.12;}
function luckActive(){return state.luckUntil>nowSec();}
function luckRemaining(){return Math.max(0,Math.ceil(state.luckUntil-nowSec()));}
function luckCost(){return 180+state.luckBought*90;}
function employeeWage(emp){
  const cheap=emp&&emp.skills?emp.skills.cheap:0;
  return Math.max(20,60-cheap*8);
}
function employeeWorkSeconds(emp){
  const diligent=emp&&emp.skills?emp.skills.diligent:0;
  return 3600+diligent*3600;
}
function employeeTrainingCost(emp,skill){
  const lv=emp&&emp.skills?emp.skills[skill]||0:0;
  return 120+lv*90;
}
function activeEmployeeLuckBonus(){
  ensureEmployees();
  return state.helperEmployees.reduce((sum,e)=>sum+(e.striking?0:e.skills.luck*.03),0);
}
function headChance(){
  const skillBonus=activeEmployeeLuckBonus();
  if(!luckActive())return Math.min(.95,.5+skillBonus);
  const remaining=luckRemaining();
  const timePenalty=Math.max(0,1-remaining/LUCK_BASE_DURATION)*.14;
  const profitSinceLuck=Math.max(0,state.wallet-state.luckStartWallet);
  const profitPenalty=Math.max(0,profitSinceLuck-120)*.0012;
  return Math.max(.5,Math.min(.95,.82+skillBonus-timePenalty-profitPenalty));
}
function helperCapCost(){return 20*state.helperCap*state.helperCap;}
function upgradeCost(){return 28*state.coinLevel;}
function helperCost(){return 50+state.helperCount*40;}
function helperAutoActive(){return state.helperCount>0;}

function stakeOptions(){
  return [1,2,5,10,20,50,100];
}

function showResult(t){
  resultEl.textContent=t;resultEl.classList.add('show');
  setTimeout(()=>resultEl.classList.remove('show'),950);
}

function inCooldown(){return nowSec()<state.cooldownUntil;}
function cooldownRemaining(){return Math.max(0,Math.ceil(state.cooldownUntil-nowSec()));}

function showAddictionWarning(title,body,cooldownSeconds){
  state.addictionWarnings=clampInt(state.addictionWarnings+1,1,0,9999);
  if(cooldownSeconds)state.cooldownUntil=Math.max(state.cooldownUntil,nowSec()+cooldownSeconds);
  saveCoinGameState();
  if(!warningOverlay)return;
  warningTitle.textContent=title;
  warningBody.innerHTML=body;
  warningOverlay.classList.add('show');
  refresh();
}

function closeAddictionWarning(){
  if(!warningOverlay)return;
  warningOverlay.classList.remove('show');
  refresh();
}

if(warningCloseBtn)warningCloseBtn.onclick=closeAddictionWarning;
if(warningOverlay){
  warningOverlay.addEventListener('click',e=>{
    if(e.target===warningOverlay)closeAddictionWarning();
  });
}
function gainText(t){
  const d=document.createElement('div');d.className='gain';d.textContent=t;
  d.style.left=(42+Math.random()*16)+'%';d.style.top=(34+Math.random()*14)+'%';
  document.body.appendChild(d);setTimeout(()=>d.remove(),900);
}

function showEmployeeFloatText(i,text,positive){
  const helper=typeof helpers!=='undefined'?helpers[i]:null;
  if(!helper||typeof camera==='undefined')return;
  camera.updateMatrixWorld();
  const pos=helper.position.clone();
  pos.y+=0.55;
  pos.project(camera);
  if(pos.z>1||pos.z<-1)return;
  let x=(pos.x*0.5+0.5)*window.innerWidth;
  let y=(1-(pos.y*0.5+0.5))*window.innerHeight;
  x=Math.max(20,Math.min(window.innerWidth-20,x));
  y=Math.max(20,Math.min(window.innerHeight-20,y));
  const d=document.createElement('div');
  d.className='gain employee-float '+(positive?'up':'down');
  d.textContent=text;
  d.style.left=(x-14+Math.random()*8)+'px';
  d.style.top=y+'px';
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),900);
}

function renderHelperStrategies(){
  if(!strategyList)return;
  ensureHelperStrategies();
  if(state.helperCount===0){
    strategyList.innerHTML='<div class="strategy-empty">雇佣助手后可以设置自动下注和收手倍率。</div>';
    return;
  }
  strategyList.innerHTML=state.helperStrategies.map((s,i)=>{
    const options=stakeOptions().map(v=>`<option value="${v}"${s.stake===v?' selected':''}>${v} 金币</option>`).join('');
    return `
      <div class="strategy-row" data-helper="${i}">
        <div class="strategy-name">助手 ${i+1}</div>
        <div class="strategy-controls">
          <label>下注
            <select class="strategy-stake">${options}</select>
          </label>
          <label>收手倍率
            <input class="strategy-cash" type="number" min="1.2" max="20" step="0.1" value="${s.cashOutAt.toFixed(1)}">
          </label>
        </div>
      </div>`;
  }).join('');
}

function updateEmployeeStrikes(){
  ensureEmployees();
  const now=nowSec();
  let changed=false;
  state.helperEmployees.forEach(e=>{
    if(!e.striking&&now>=e.paidUntil){
      e.striking=true;
      changed=true;
    }
  });
  if(changed){
    showResult('员工工资到期，开始罢工');
    saveCoinGameState();
  }
}

function employeeTimeText(emp){
  if(emp.striking)return '罢工中';
  const sec=Math.max(0,Math.ceil(emp.paidUntil-nowSec()));
  const h=Math.floor(sec/3600);
  const m=Math.ceil((sec%3600)/60);
  return h>0?h+'小时'+m+'分':m+'分钟';
}

function renderEmployees(){
  if(!employeeList||!employeeDetail)return;
  ensureEmployees();
  if(state.helperCount===0){
    employeeList.innerHTML='<div class="employee-empty">雇佣史莱姆助手后会生成员工档案。</div>';
    employeeDetail.innerHTML='';
    return;
  }
  employeeList.innerHTML='<div class="employee-list">'+state.helperEmployees.map((e,i)=>`
    <div class="employee-card${i===state.selectedEmployee?' on':''}" data-employee="${i}">
      <div class="employee-photo" style="background:${e.color}"></div>
      <div class="employee-name">${e.name}</div>
      <div class="employee-meta">${e.striking?'罢工中':'可工作'} · 工资 ${employeeWage(e)}</div>
      <div class="employee-meta">剩余 ${employeeTimeText(e)}</div>
      <button class="employee-archive" type="button" data-open-book="${i}">查看档案</button>
    </div>`).join('')+'</div>';
  const emp=state.helperEmployees[state.selectedEmployee];
  if(!emp){employeeDetail.innerHTML='';return;}
  const skills=[
    ['luck','幸运','正面概率 +3% / 点'],
    ['diligent','勤劳','工作时长 +1小时 / 点'],
    ['cheap','便宜','工资 -8金币 / 点'],
    ['multi','敏捷','抛硬币动作提速 15% / 点']
  ];
  employeeDetail.innerHTML=`
    <div class="employee-detail" data-employee-detail="${state.selectedEmployee}">
      <label>名字<input id="employeeNameInput" value="${emp.name}" maxlength="10"></label>
      <div class="employee-meta">状态：${emp.striking?'罢工中，需要发工资':'工作中'} · 下次工资 ${employeeTimeText(emp)}</div>
      <button class="employee-pay" data-pay-employee="${state.selectedEmployee}">发工资 ${employeeWage(emp)} 金币</button>
      ${skills.map(([key,label,desc])=>`
        <div class="employee-skill">
          <div>${label} Lv.${emp.skills[key]}<br><span class="employee-meta">${desc}</span></div>
          <button data-train-skill="${key}">培训 ${employeeTrainingCost(emp,key)}</button>
        </div>`).join('')}
    </div>`;
}

function refresh(){
  ensureHelperStrategies();
  ensureEmployees();
  updateEmployeeStrikes();
  if(!luckActive())state.luckUntil=0;
  walletEl.textContent=Math.floor(state.wallet);
  stakeEl.textContent=Math.floor(state.stake);
  multEl.textContent='×'+state.multiplier.toFixed(2);
  potentialEl.textContent=Math.floor(state.roundValue);
  if(earnedEl)earnedEl.textContent=Math.floor(state.earned);
  if(lostEl)lostEl.textContent=Math.floor(state.lost);
  if(netEl)netEl.textContent=Math.floor(state.earned-state.lost);
  if(chanceEl)chanceEl.textContent=Math.round(headChance()*100)+'%';
  buyCoinSlot.textContent=state.helperCap<MAX_HELPERS?`扩建员工工位 · ${helperCapCost()} 金币`:'工位已满';
  upgradeCoin.textContent=`提升倍率 Lv.${state.coinLevel} · ${upgradeCost()} 金币`;
  upgradeChance.textContent=luckActive()
    ? `幸运卡片 ${Math.round(headChance()*100)}% · 剩余 ${luckRemaining()} 秒 · 叠加 ${luckCost()} 金币`
    : `购买幸运卡片 · ${luckCost()} 金币`;
  buyHelper.textContent=state.helperCount<state.helperCap?`史莱姆助手 ${state.helperCount}/${state.helperCap} · ${helperCost()} 金币`:`史莱姆助手 ${state.helperCount}/${state.helperCap} 已满`;
  toggleAuto.textContent=helperAutoActive()?'助手自动抛币：开启':'自动策略：未雇佣';
  syncCoins(1);syncHelpers(state.helperCount);
  EMPLOYEE_RIGS.forEach(rig=>syncRigCoins(rig,1));
  renderHelperStrategies();
  renderEmployees();

  if(inCooldown()){
    mainAction.textContent='冷静期 '+cooldownRemaining()+' 秒';
    hintEl.innerHTML='刚刚输光过一次，先歇一歇，别急着回本';
  }else if(!state.roundActive){
    mainAction.textContent='让史莱姆抛硬币';
    hintEl.innerHTML='Q / R 调整下注 · 当前下注 '+state.stake;
  }else if(state.waiting){
    mainAction.textContent='继续让史莱姆抛';
    hintEl.innerHTML='E 收手 · Enter / 按钮继续';
  }else{
    mainAction.textContent='史莱姆正在抛…';
    hintEl.innerHTML='史莱姆正在抓取和观察硬币';
  }
}

function refreshTimedPanels(time){
  if(time<state.nextTimedUi)return;
  if(inCooldown()&&!state.roundActive){
    mainAction.textContent='冷静期 '+cooldownRemaining()+' 秒';
  }
  const wasActive=state.luckUntil>0;
  if(!luckActive())state.luckUntil=0;
  if(chanceEl)chanceEl.textContent=Math.round(headChance()*100)+'%';
  upgradeChance.textContent=luckActive()
    ? `幸运卡片 ${Math.round(headChance()*100)}% · 剩余 ${luckRemaining()} 秒`
    : `购买幸运卡片 · ${luckCost()} 金币`;
  if(wasActive&&!state.luckUntil)saveCoinGameState();
  state.nextTimedUi=time+1;
}

function startRound(){
  state.activeStrategyIndex=-1;
  return startRoundWithStake(state.stake,-1);
}

function startRoundWithStake(stake,strategyIndex){
  if(state.roundActive)return;
  if(inCooldown()){showResult('冷静期还剩 '+cooldownRemaining()+' 秒，先歇一歇');return;}
  const wager=clampInt(stake,state.stake,1,100);
  if(state.wallet<wager){showResult('金币不足');return;}
  state.stake=wager;
  state.activeStrategyIndex=strategyIndex;
  if(strategyIndex>=0&&state.helperStrategies.length){
    state.nextStrategyIndex=(strategyIndex+1)%state.helperStrategies.length;
  }
  state.wallet-=wager;
  state.roundStart=wager;state.roundValue=wager;state.multiplier=1;
  state.roundActive=true;state.waiting=false;state.consecutive=0;
  saveCoinGameState();refresh();throwRound();
}

function cashOut(){
  if(!state.roundActive || !state.waiting)return;
  state.wallet+=state.roundValue;
  state.earned=Math.min(999999,state.earned+Math.max(0,Math.floor(state.roundValue-state.roundStart)));
  state.best=Math.max(state.best,state.roundValue);
  showResult('落袋 +'+Math.floor(state.roundValue));
  state.roundActive=false;state.waiting=false;state.multiplier=1;state.activeStrategyIndex=-1;
  saveCoinGameState();refresh();
}

function throwRound(){
  if(!state.roundActive||!allDone())return;
  state.waiting=false;
  stageCoinsForSlimeThrow();
  const release=(coinIndex,origin,yaw)=>launchCoinFromSlime(coinIndex,origin,yaw);
  if(typeof beginPlayerCoinBatchThrow==='function'){
    if(!beginPlayerCoinBatchThrow(1,release))return;
  }else{
    launchCoins();
  }
  refresh();
}

function onCoinsResolved(){
  const head=coins[0]&&coins[0].result==='HEAD';

  if(!head){
    showResult('反面 · 本轮归零');
    state.lost=Math.min(999999,state.lost+Math.max(0,Math.floor(state.roundStart)));
    state.roundActive=false;state.waiting=false;state.roundValue=0;state.multiplier=1;state.activeStrategyIndex=-1;
    if(state.wallet<=0){
      showAddictionWarning(
        '投机不是正经生意',
        '钱包见底了。<br>钱来得快，也能去得一样快——真正能撑住一份家业的，从来不是赌一把的运气，是种一茬地、开一间店那样，日子一天天攒出来的本钱。<br>接下来 '+BANKRUPT_COOLDOWN_SECONDS+' 秒，史莱姆需要冷静一下，先歇歇手。',
        BANKRUPT_COOLDOWN_SECONDS
      );
    }
    saveCoinGameState();refresh();return;
  }

  const step=coinMultiplier();
  state.multiplier*=step;
  const old=state.roundValue;
  state.roundValue=Math.max(old,Math.round(state.roundStart*state.multiplier));
  const gain=state.roundValue-old;

  if(gain>0)gainText('+'+gain);

  state.consecutive++;
  state.waiting=true;showResult(`正面 · ×${step.toFixed(2)}`);
  saveCoinGameState();
  refresh();
}

function ensureEmployeeRoundState(i){
  if(!employeeRounds[i]){
    employeeRounds[i]={active:false,waiting:false,stake:0,roundStart:0,roundValue:0,multiplier:1,consecutive:0,nextAuto:0};
  }
  return employeeRounds[i];
}

function startEmployeeRound(i){
  if(inCooldown())return false;
  const emp=state.helperEmployees[i];
  if(!emp||emp.striking)return false;
  const r=ensureEmployeeRoundState(i);
  if(r.active)return false;
  const helper=typeof helpers!=='undefined'?helpers[i]:null;
  if(!helper||actorBusy(helper))return false;
  const rig=EMPLOYEE_RIGS[i];
  if(!rigAllDone(rig))return false;
  const strategy=normalizeHelperStrategy(state.helperStrategies[i],i);
  if(state.wallet<strategy.stake)return false;
  state.wallet-=strategy.stake;
  r.stake=strategy.stake;
  r.roundStart=strategy.stake;
  r.roundValue=strategy.stake;
  r.multiplier=1;
  r.active=true;
  r.waiting=false;
  r.consecutive=0;
  if(!throwForEmployee(i)){
    r.active=false;
    state.wallet+=strategy.stake;
    return false;
  }
  saveCoinGameState();
  return true;
}

function throwForEmployee(i){
  const r=employeeRounds[i];
  const helper=typeof helpers!=='undefined'?helpers[i]:null;
  if(!r||!r.active||!helper)return false;
  if(actorBusy(helper))return false;
  const rig=EMPLOYEE_RIGS[i];
  if(!rigAllDone(rig))return false;
  r.waiting=false;
  stageRigForThrow(rig);
  const started=queueHelperThrow(i,[0],(coinIndex,origin,yaw)=>{
    launchRigCoinFromSlime(rig,coinIndex,origin,yaw);
  });
  if(!started)r.waiting=true;
  return started;
}

function onEmployeeCoinsResolved(i){
  const r=employeeRounds[i];
  if(!r)return;
  const rig=EMPLOYEE_RIGS[i];
  const head=rig.coins[0]&&rig.coins[0].result==='HEAD';

  if(!head){
    const emp=state.helperEmployees[i];
    const lostAmount=Math.max(0,Math.floor(r.roundStart));
    state.lost=Math.min(999999,state.lost+lostAmount);
    if(emp)emp.lost=Math.min(999999,emp.lost+lostAmount);
    showEmployeeFloatText(i,'-'+Math.floor(r.roundStart),false);
    r.active=false;r.waiting=false;r.roundValue=0;r.multiplier=1;
    if(state.wallet<=0){
      showAddictionWarning(
        '投机不是正经生意',
        '雇的助手把钱包也抛空了。<br>史莱姆助手再勤快，也扛不住主人上头——雇人是为了把生意做大，不是把风险外包出去。<br>接下来 '+BANKRUPT_COOLDOWN_SECONDS+' 秒，商店需要冷静一下。',
        BANKRUPT_COOLDOWN_SECONDS
      );
    }
    saveCoinGameState();refresh();
    scheduleEmployeeAuto(i,1.0);
    return;
  }

  const step=coinMultiplier();
  r.multiplier*=step;
  const old=r.roundValue;
  r.roundValue=Math.max(old,Math.round(r.roundStart*r.multiplier));
  const gain=r.roundValue-old;
  if(gain>0)showEmployeeFloatText(i,'+'+gain,true);
  r.consecutive++;
  r.waiting=true;
  saveCoinGameState();refresh();

  const strategy=normalizeHelperStrategy(state.helperStrategies[i],i);
  const shouldCashOut=r.multiplier>=strategy.cashOutAt||r.roundValue>=Math.ceil(r.roundStart*strategy.cashOutAt);
  scheduleEmployeeAuto(i,shouldCashOut?0.4:0.65);
}

function scheduleEmployeeAuto(i,delay){
  const r=employeeRounds[i];
  if(!r)return;
  r.nextAuto=performance.now()*.001+delay;
}

function employeeCashOut(i){
  const r=employeeRounds[i];
  if(!r||!r.active||!r.waiting)return;
  const emp=state.helperEmployees[i];
  const gain=Math.max(0,Math.floor(r.roundValue-r.roundStart));
  state.wallet+=r.roundValue;
  state.earned=Math.min(999999,state.earned+gain);
  if(emp)emp.earned=Math.min(999999,emp.earned+gain);
  state.best=Math.max(state.best,r.roundValue);
  r.active=false;r.waiting=false;r.multiplier=1;
  saveCoinGameState();refresh();
}

function adjustStake(dir){
  if(state.roundActive)return;
  const list=[1,2,5,10,20,50,100];
  let i=list.indexOf(state.stake);if(i<0)i=0;
  i=clamp(i+dir,0,list.length-1);state.stake=list[i];saveCoinGameState();refresh();
}

function spend(cost,fn,msg){
  if(state.wallet<cost){showResult('金币不足');return;}
  state.wallet-=cost;fn();showResult(msg);saveCoinGameState();refresh();
}

buyCoinSlot.onclick=()=>{if(state.helperCap<MAX_HELPERS)spend(helperCapCost(),()=>state.helperCap++,'扩建员工工位');};
upgradeCoin.onclick=()=>spend(upgradeCost(),()=>state.coinLevel++,'倍率升级');
upgradeChance.onclick=()=>{
  spend(luckCost(),()=>{
    state.luckBought++;
    const wasActive=luckActive();
    const base=wasActive?state.luckUntil:nowSec();
    state.luckUntil=Math.min(base+LUCK_BASE_DURATION,nowSec()+LUCK_MAX_DURATION);
    if(!wasActive)state.luckStartWallet=state.wallet;
  },wasActiveLabel());
};
function wasActiveLabel(){
  return luckActive()?'幸运卡片时长叠加':'幸运卡片生效 180 秒';
}
buyHelper.onclick=()=>{
  if(state.helperCount>=state.helperCap)return;
  spend(helperCost(),()=>{
    state.helperCount++;state.auto=true;ensureHelperStrategies();ensureEmployees();
    if(state.helperCount>=3&&!state.warnedHelper){
      state.warnedHelper=true;
      showAddictionWarning(
        '雇人不是为了赌得更大',
        '第 '+state.helperCount+' 个史莱姆助手加入了。<br>雇人本该是把生意做稳、做大——如果雇人只是为了让自己能同时押更多注，那和亲手把钱包越掏越空，没什么两样。<br>见好该收手的时候，谁都替不了你做这个决定。'
      );
    }
  },'史莱姆助手加入');
};
toggleAuto.onclick=()=>{if(state.helperCount===0){showResult('需要史莱姆助手');return;}state.auto=true;showResult('助手会一直自动抛币');saveCoinGameState();refresh();};

if(strategyList){
  strategyList.addEventListener('change',e=>{
    const row=e.target.closest('.strategy-row');
    if(!row)return;
    const i=clampInt(row.dataset.helper,0,0,MAX_HELPERS-1);
    ensureHelperStrategies();
    if(!state.helperStrategies[i])return;
    if(e.target.classList.contains('strategy-stake')){
      state.helperStrategies[i].stake=clampInt(e.target.value,state.helperStrategies[i].stake,1,100);
      state.stake=state.helperStrategies[i].stake;
    }
    if(e.target.classList.contains('strategy-cash')){
      state.helperStrategies[i].cashOutAt=normalizeHelperStrategy({stake:state.helperStrategies[i].stake,cashOutAt:e.target.value},i).cashOutAt;
    }
    saveCoinGameState();refresh();
  });
}

const SKILL_LABELS={luck:'幸运',diligent:'勤劳',cheap:'便宜',multi:'敏捷'};

function formatBookTime(sec){
  if(!sec)return '';
  const d=new Date(sec*1000);
  return (d.getMonth()+1)+'-'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function openEmployeeBook(i){
  ensureEmployees();
  const emp=state.helperEmployees[i];
  if(!emp||!bookOverlay)return;
  bookName.textContent=emp.name;
  bookStatus.textContent=(emp.striking?'罢工中':'工作中')+' · '+employeeTimeText(emp);
  bookPhoto.style.background=emp.color;
  bookSkills.innerHTML=Object.keys(SKILL_LABELS).map(k=>
    `<div class="book-skill-row"><span>${SKILL_LABELS[k]}</span><span>Lv.${emp.skills[k]||0}</span></div>`
  ).join('');
  const net=emp.earned-emp.lost;
  bookStats.innerHTML=`
    <div>累计赚到 <b class="up">+${Math.floor(emp.earned)}</b></div>
    <div>累计赔掉 <b class="down">-${Math.floor(emp.lost)}</b></div>
    <div>净收益 <b class="${net>=0?'up':'down'}">${net>=0?'+':''}${Math.floor(net)}</b></div>
  `;
  const log=Array.isArray(emp.trainingLog)?emp.trainingLog.slice().reverse():[];
  bookLog.innerHTML=log.length
    ? log.map(e=>`<div class="book-log-row">${formatBookTime(e.at)} · ${SKILL_LABELS[e.skill]||e.skill} 培训至 Lv.${e.level}</div>`).join('')
    : '<div class="book-log-empty">还没有培训记录</div>';
  bookOverlay.classList.add('show');
}

function closeEmployeeBook(){
  if(bookOverlay)bookOverlay.classList.remove('show');
}

if(closeBookBtn)closeBookBtn.onclick=closeEmployeeBook;
if(bookOverlay){
  bookOverlay.addEventListener('click',e=>{
    if(e.target===bookOverlay)closeEmployeeBook();
  });
}

if(employeeList){
  employeeList.addEventListener('click',e=>{
    const openBook=e.target.closest('[data-open-book]');
    if(openBook){
      openEmployeeBook(clampInt(openBook.dataset.openBook,0,0,MAX_HELPERS-1));
      return;
    }
    const card=e.target.closest('.employee-card');
    if(!card)return;
    state.selectedEmployee=clampInt(card.dataset.employee,0,0,MAX_HELPERS-1);
    saveCoinGameState();refresh();
  });
}

if(employeeDetail){
  employeeDetail.addEventListener('change',e=>{
    if(e.target.id!=='employeeNameInput')return;
    ensureEmployees();
    const emp=state.helperEmployees[state.selectedEmployee];
    if(!emp)return;
    emp.name=e.target.value.trim().slice(0,10)||emp.name;
    saveCoinGameState();refresh();
  });
  employeeDetail.addEventListener('click',e=>{
    ensureEmployees();
    const emp=state.helperEmployees[state.selectedEmployee];
    if(!emp)return;
    const pay=e.target.closest('[data-pay-employee]');
    if(pay){
      const wage=employeeWage(emp);
      if(state.wallet<wage){showResult('金币不足，员工继续罢工');return;}
      state.wallet-=wage;
      emp.striking=false;
      emp.paidUntil=nowSec()+employeeWorkSeconds(emp);
      saveCoinGameState();refresh();
      return;
    }
    const train=e.target.closest('[data-train-skill]');
    if(!train)return;
    const skill=train.dataset.trainSkill;
    if(!emp.skills||!Object.prototype.hasOwnProperty.call(emp.skills,skill))return;
    const max=skill==='multi'?4:(skill==='diligent'||skill==='cheap'?5:10);
    if(emp.skills[skill]>=max){showResult('这个技能已满');return;}
    const cost=employeeTrainingCost(emp,skill);
    if(state.wallet<cost){showResult('金币不足，无法培训');return;}
    state.wallet-=cost;
    emp.skills[skill]++;
    emp.trainingLog=Array.isArray(emp.trainingLog)?emp.trainingLog:[];
    emp.trainingLog.push({skill,level:emp.skills[skill],at:nowSec()});
    if(emp.trainingLog.length>12)emp.trainingLog.shift();
    saveCoinGameState();refresh();
  });
}

mainAction.onclick=()=>{
  if(!state.roundActive)startRound();
  else if(state.waiting)throwRound();
};

if(returnGame){
  returnGame.onclick=()=>{
    saveCoinGameState();
    window.location.href='../game.html?from=store';
  };
}

if(panelToggle&&sidePanel){
  panelToggle.onclick=()=>{
    const collapsed=!sidePanel.classList.contains('collapsed');
    sidePanel.classList.toggle('collapsed',collapsed);
    sidePanel.setAttribute('aria-hidden',collapsed?'true':'false');
    panelToggle.setAttribute('aria-expanded',collapsed?'false':'true');
    panelToggle.textContent=collapsed?'设置':'收起';
  };
}

addEventListener('beforeunload',saveCoinGameState);

addEventListener('keydown',e=>{
  if(e.code==='Enter'){e.preventDefault();if(!state.roundActive)startRound();else if(state.waiting)throwRound();}
  if(e.code==='KeyE'){e.preventDefault();cashOut();}
  if(e.code==='KeyQ')adjustStake(-1);
  if(e.code==='KeyR')adjustStake(1);
  if(e.code==='KeyV')viewMode=viewMode==='tp'?'near':'tp';
});

function updateAuto(time){
  refreshTimedPanels(time);
  updateEmployeeStrikes();
  ensureHelperStrategies();
  for(let i=0;i<state.helperCount;i++){
    updateEmployeeAutoTick(i,time);
  }
}

function updateEmployeeAutoTick(i,time){
  const emp=state.helperEmployees[i];
  if(!emp||emp.striking)return;
  const r=ensureEmployeeRoundState(i);

  if(!r.active){
    if(time<r.nextAuto)return;
    if(!startEmployeeRound(i))r.nextAuto=time+1.2;
    return;
  }

  if(r.waiting){
    if(time<r.nextAuto)return;
    const strategy=normalizeHelperStrategy(state.helperStrategies[i],i);
    const shouldCashOut=r.multiplier>=strategy.cashOutAt||r.roundValue>=Math.ceil(r.roundStart*strategy.cashOutAt);
    if(shouldCashOut)employeeCashOut(i);
    else throwForEmployee(i);
  }
}

loadCoinGameState();syncCoins(1);refresh();
