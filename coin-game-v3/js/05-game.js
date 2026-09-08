
'use strict';

const state={
  wallet:40,
  stake:1,
  roundStart:1,
  roundValue:1,
  multiplier:1,
  coinCount:1,
  coinLevel:1,
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
const buyCoinSlot=$('buyCoinSlot'),upgradeCoin=$('upgradeCoin'),buyHelper=$('buyHelper'),toggleAuto=$('toggleAuto');

function coinMultiplier(){return 1.65+(state.coinLevel-1)*.18;}
function coinCost(){return 20*state.coinCount*state.coinCount;}
function upgradeCost(){return 28*state.coinLevel;}
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
  buyHelper.textContent=state.helperCount<4?`史莱姆助手 ${state.helperCount}/4 · ${helperCost()} 金币`:'史莱姆助手已满';
  toggleAuto.textContent=`自动策略：${state.auto?'开启':'关闭'}`;
  syncCoins(state.coinCount);syncHelpers(state.helperCount);

  if(!state.roundActive){
    mainAction.textContent='开始抛出';
    hintEl.innerHTML='Q / R 调整下注 · 当前下注 '+state.stake;
  }else if(state.waiting){
    mainAction.textContent='继续抛出';
    hintEl.innerHTML='E 收手 · Space / 按钮继续';
  }else{
    mainAction.textContent='抛出中…';
    hintEl.innerHTML='硬币正在落下';
  }
}

function startRound(){
  if(state.roundActive)return;
  if(state.wallet<state.stake){showResult('金币不足');return;}
  state.wallet-=state.stake;
  state.roundStart=state.stake;state.roundValue=state.stake;state.multiplier=1;
  state.roundActive=true;state.waiting=false;state.consecutive=0;
  refresh();throwRound();
}

function cashOut(){
  if(!state.roundActive || !state.waiting)return;
  state.wallet+=state.roundValue;
  showResult('落袋 +'+Math.floor(state.roundValue));
  state.roundActive=false;state.waiting=false;state.multiplier=1;
  refresh();
}

function throwRound(){
  if(!state.roundActive||!allDone())return;
  state.waiting=false;launchCoins();refresh();
}

function onCoinsResolved(){
  let heads=0;
  for(let i=0;i<state.coinCount;i++)if(coins[i].result==='HEAD')heads++;

  if(heads===0){
    showResult('全反面 · 本轮归零');
    state.roundActive=false;state.waiting=false;state.roundValue=0;state.multiplier=1;
    refresh();return;
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
  refresh();

  if(state.auto&&state.helperCount>0){
    state.nextAuto=performance.now()*.001+Math.max(.5,1.25-state.helperCount*.14);
  }
}

function adjustStake(dir){
  if(state.roundActive)return;
  const list=[1,2,5,10,20,50,100];
  let i=list.indexOf(state.stake);if(i<0)i=0;
  i=clamp(i+dir,0,list.length-1);state.stake=list[i];refresh();
}

function spend(cost,fn,msg){
  if(state.wallet<cost){showResult('金币不足');return;}
  state.wallet-=cost;fn();showResult(msg);refresh();
}

buyCoinSlot.onclick=()=>{if(state.coinCount<6)spend(coinCost(),()=>state.coinCount++,'新增大硬币');};
upgradeCoin.onclick=()=>spend(upgradeCost(),()=>state.coinLevel++,'倍率升级');
buyHelper.onclick=()=>{if(state.helperCount<4)spend(helperCost(),()=>state.helperCount++,'史莱姆助手加入');};
toggleAuto.onclick=()=>{if(state.helperCount===0){showResult('需要史莱姆助手');return;}state.auto=!state.auto;refresh();};

mainAction.onclick=()=>{
  if(!state.roundActive)startRound();
  else if(state.waiting)throwRound();
};

addEventListener('keydown',e=>{
  if(e.code==='Space'){e.preventDefault();if(!state.roundActive)startRound();else if(state.waiting)throwRound();}
  if(e.code==='KeyE'){e.preventDefault();cashOut();}
  if(e.code==='KeyQ')adjustStake(-1);
  if(e.code==='KeyR')adjustStake(1);
  if(e.code==='KeyV')viewMode=viewMode==='tp'?'near':'tp';
});

function updateAuto(time){
  if(!state.auto||state.helperCount===0)return;
  if(state.roundActive&&state.waiting&&time>=state.nextAuto)throwRound();
}

syncCoins(1);refresh();
