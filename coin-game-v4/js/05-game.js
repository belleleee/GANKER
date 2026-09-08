
'use strict';

const state={
  wallet:40,
  stake:1,
  best:1,
  roundStart:1,
  roundValue:1,
  multiplier:1,
  coinCount:1,
  coinLevel:1,
  chanceLevel:0,
  helperCount:0,
  auto:false,
  roundActive:false,
  waiting:false,
  consecutive:0,
  nextAuto:0
};

const $=id=>document.getElementById(id);
const walletEl=$('wallet'),stakeEl=$('stake'),multEl=$('multiplier'),potentialEl=$('potential');
const hintEl=$('hint'),resultEl=$('result'),mainAction=$('mainAction');
const buyCoinSlot=$('buyCoinSlot'),upgradeCoin=$('upgradeCoin'),upgradeChance=$('upgradeChance'),buyHelper=$('buyHelper'),toggleAuto=$('toggleAuto');

const COIN_GAME_FALLBACK_SAVE_KEY='coinGame.v4.save';
const CABIN_SESSION_KEY='magicCabin.session.v1';
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

function currentCabinSaveKey(){
  let id=CABIN_GUEST_ID;
  try{
    id=localStorage.getItem(CABIN_SESSION_KEY)||CABIN_GUEST_ID;
  }catch(err){
    id=CABIN_GUEST_ID;
  }
  return 'magicCabin.save.'+id+'.v1';
}

function clampInt(value,fallback,min,max){
  const n=Math.trunc(Number(value));
  if(!Number.isFinite(n))return fallback;
  return Math.max(min,Math.min(max,n));
}

function applyCoinGameSave(save){
  if(!save||typeof save!=='object')return false;
  state.wallet=clampInt(save.wallet,40,0,999999);
  state.stake=clampInt(save.stake,1,1,100);
  state.best=clampInt(save.best,state.stake,1,999999);
  state.coinCount=clampInt(save.coinCount,1,1,6);
  state.coinLevel=clampInt(save.coinLevel,1,1,999);
  state.chanceLevel=clampInt(save.chanceLevel,0,0,8);
  state.helperCount=clampInt(save.helperCount,0,0,4);
  state.auto=!!save.auto&&state.helperCount>0;
  return true;
}

function captureCoinGameSave(){
  return {
    wallet:Math.floor(state.wallet),
    stake:Math.floor(state.stake),
    best:Math.floor(state.best),
    coinCount:state.coinCount,
    coinLevel:state.coinLevel,
    chanceLevel:state.chanceLevel,
    helperCount:state.helperCount,
    auto:state.auto,
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
  applyCoinGameSave(readGameJson(COIN_GAME_FALLBACK_SAVE_KEY,null));
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

function coinMultiplier(){return 1.65+(state.coinLevel-1)*.18;}
function headChance(){return Math.min(.82,.5+state.chanceLevel*.04);}
function coinCost(){return 20*state.coinCount*state.coinCount;}
function upgradeCost(){return 28*state.coinLevel;}
function chanceCost(){return 35+state.chanceLevel*24;}
function helperCost(){return 50+state.helperCount*40;}

function showResult(t){
  resultEl.textContent=t;resultEl.classList.add('show');
  setTimeout(()=>resultEl.classList.remove('show'),950);
}
function gainText(t){
  const d=document.createElement('div');d.className='gain';d.textContent=t;
  d.style.left=(42+Math.random()*16)+'%';d.style.top=(34+Math.random()*14)+'%';
  document.body.appendChild(d);setTimeout(()=>d.remove(),900);
}

function refresh(){
  walletEl.textContent=Math.floor(state.wallet);
  stakeEl.textContent=Math.floor(state.stake);
  multEl.textContent='×'+state.multiplier.toFixed(2);
  potentialEl.textContent=Math.floor(state.roundValue);
  buyCoinSlot.textContent=state.coinCount<6?`增加槽位 · ${coinCost()} 金币`:'硬币槽已满';
  upgradeCoin.textContent=`提升倍率 Lv.${state.coinLevel} · ${upgradeCost()} 金币`;
  upgradeChance.textContent=state.chanceLevel<8?`幸运卡片 ${Math.round(headChance()*100)}% · ${chanceCost()} 金币`:'幸运卡片已满 · 82%';
  buyHelper.textContent=state.helperCount<4?`史莱姆助手 ${state.helperCount}/4 · ${helperCost()} 金币`:'史莱姆助手已满';
  toggleAuto.textContent=`自动策略：${state.auto?'开启':'关闭'}`;
  syncCoins(state.coinCount);syncHelpers(state.helperCount);

  if(!state.roundActive){
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

function startRound(){
  if(state.roundActive)return;
  if(state.wallet<state.stake){showResult('金币不足');return;}
  state.wallet-=state.stake;
  state.roundStart=state.stake;state.roundValue=state.stake;state.multiplier=1;
  state.roundActive=true;state.waiting=false;state.consecutive=0;
  saveCoinGameState();refresh();throwRound();
}

function cashOut(){
  if(!state.roundActive || !state.waiting)return;
  state.wallet+=state.roundValue;
  state.best=Math.max(state.best,state.roundValue);
  showResult('落袋 +'+Math.floor(state.roundValue));
  state.roundActive=false;state.waiting=false;state.multiplier=1;
  saveCoinGameState();refresh();
}

function throwRound(){
  if(!state.roundActive||!allDone())return;
  state.waiting=false;
  const release=(origin,yaw)=>{
    if(typeof launchCoinsFromSlime==='function')launchCoinsFromSlime(origin,yaw);
    else launchCoins();
  };
  if(typeof beginPlayerCoinThrow==='function'){
    if(!beginPlayerCoinThrow(release))return;
  }else{
    release();
  }
  refresh();
}

function onCoinsResolved(){
  let heads=0;
  for(let i=0;i<state.coinCount;i++)if(coins[i].result==='HEAD')heads++;

  if(heads===0){
    showResult('全反面 · 本轮归零');
    state.roundActive=false;state.waiting=false;state.roundValue=0;state.multiplier=1;
    saveCoinGameState();refresh();return;
  }

  const ratio=heads/state.coinCount;
  const step=1+(coinMultiplier()-1)*ratio;
  state.multiplier*=step;
  const old=state.roundValue;
  state.roundValue=Math.max(old+1,Math.round(state.roundStart*state.multiplier));
  const gain=state.roundValue-old;

  for(let i=0;i<heads;i++)setTimeout(()=>gainText('+'+Math.max(1,Math.round(gain/heads))),i*80);

  state.consecutive++;
  state.waiting=true;showResult(`${heads}/${state.coinCount} 正面 · ×${step.toFixed(2)}`);
  saveCoinGameState();
  refresh();

  if(state.auto&&state.helperCount>0){
    state.nextAuto=performance.now()*.001+Math.max(.5,1.25-state.helperCount*.14);
  }
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

buyCoinSlot.onclick=()=>{if(state.coinCount<6)spend(coinCost(),()=>state.coinCount++,'新增大硬币');};
upgradeCoin.onclick=()=>spend(upgradeCost(),()=>state.coinLevel++,'倍率升级');
upgradeChance.onclick=()=>{if(state.chanceLevel<8)spend(chanceCost(),()=>state.chanceLevel++,'正面概率提升');};
buyHelper.onclick=()=>{if(state.helperCount<4)spend(helperCost(),()=>state.helperCount++,'史莱姆助手加入');};
toggleAuto.onclick=()=>{if(state.helperCount===0){showResult('需要史莱姆助手');return;}state.auto=!state.auto;saveCoinGameState();refresh();};

mainAction.onclick=()=>{
  if(!state.roundActive)startRound();
  else if(state.waiting)throwRound();
};

addEventListener('keydown',e=>{
  if(e.code==='Enter'){e.preventDefault();if(!state.roundActive)startRound();else if(state.waiting)throwRound();}
  if(e.code==='KeyE'){e.preventDefault();cashOut();}
  if(e.code==='KeyQ')adjustStake(-1);
  if(e.code==='KeyR')adjustStake(1);
  if(e.code==='KeyV')viewMode=viewMode==='tp'?'near':'tp';
});

function updateAuto(time){
  if(!state.auto||state.helperCount===0)return;
  if(state.roundActive&&state.waiting&&time>=state.nextAuto)throwRound();
}

loadCoinGameState();syncCoins(state.coinCount);refresh();
