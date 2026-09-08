'use strict';
const state={wallet:40,roundValue:0,baseStake:1,roundStart:1,coinCount:1,coinLevel:1,helperCount:0,tableLevel:1,rolls:0,goodRounds:0,roundActive:false,waiting:false,auto:false,nextAuto:0};

const $=id=>document.getElementById(id);
const walletEl=$('wallet'),roundEl=$('roundValue'),coinCountEl=$('coinCount'),helperCountEl=$('helperCount'),rollsEl=$('rolls'),hintEl=$('hint'),resultEl=$('result');
const buyCoin=$('buyCoin'),upgradeCoin=$('upgradeCoin'),buyHelper=$('buyHelper'),upgradeTable=$('upgradeTable'),toggleAuto=$('toggleAuto'),strategy=$('strategySelect');

function multiplier(){return 1.75+(state.coinLevel-1)*.18;}
function coinCost(){return 18*state.coinCount*state.coinCount;}
function coinLvCost(){return 25*state.coinLevel;}
function helperCost(){return 35+state.helperCount*35;}
function tableCost(){return 60*state.tableLevel;}

function popupGain(text){
 const d=document.createElement('div');d.className='floatGain';d.textContent=text;
 d.style.left=(42+Math.random()*16)+'%';d.style.top=(38+Math.random()*12)+'%';document.body.appendChild(d);
 setTimeout(()=>d.remove(),950);
}
function flash(t){resultEl.textContent=t;resultEl.classList.add('show');setTimeout(()=>resultEl.classList.remove('show'),850);}

function refresh(){
 walletEl.textContent=Math.floor(state.wallet);roundEl.textContent=Math.floor(state.roundValue);
 coinCountEl.textContent=state.coinCount+' / 6';helperCountEl.textContent=state.helperCount+' / 4';rollsEl.textContent=state.rolls;
 buyCoin.innerHTML=`增加硬币槽 <small>${state.coinCount<6?'价格 '+coinCost():'已满'}</small>`;
 upgradeCoin.innerHTML=`硬币收益 Lv.${state.coinLevel}<small>单枚正面 ×${multiplier().toFixed(2)} · 价格 ${coinLvCost()}</small>`;
 buyHelper.innerHTML=`史莱姆助手 ${state.helperCount}/4<small>${state.helperCount<4?'价格 '+helperCost():'已满'}</small>`;
 upgradeTable.innerHTML=`升级钱桌 Lv.${state.tableLevel}<small>提高每轮基础资产 · 价格 ${tableCost()}</small>`;
 toggleAuto.innerHTML=`自动抛币：${state.auto?'开启':'关闭'}<small>需要至少 1 只史莱姆</small>`;
 toggleAuto.disabled=state.helperCount===0;
 syncCoins(state.coinCount);syncHelpers(state.helperCount);

 if(!state.roundActive)hintEl.innerHTML='<b>E</b> 投入本金开始';
 else if(state.waiting)hintEl.innerHTML='<b>E 收手</b> / <b>Space 继续滚</b>';
 else hintEl.innerHTML='<b>Space</b> 抛全部硬币';
}
function startRound(){
 if(state.roundActive)return;
 const cost=state.baseStake*state.tableLevel;if(state.wallet<cost){flash('金币不足');return;}
 state.wallet-=cost;state.roundValue=cost;state.roundStart=cost;state.rolls=0;state.goodRounds=0;state.roundActive=true;state.waiting=false;
 flash('投入 '+cost);refresh();
}
function cashOut(auto=false){
 if(!state.roundActive)return;
 state.wallet+=state.roundValue;flash((auto?'自动收手 ':'落袋 ' )+'+'+Math.floor(state.roundValue));
 state.roundActive=false;state.waiting=false;state.roundValue=0;state.rolls=0;refresh();
}
function throwCoins(){
 if(!state.roundActive||!activeCoinsDone())return;
 state.waiting=false;coins.slice(0,state.coinCount).forEach(c=>c.done=false);launchAll(state.coinCount);refresh();
}
function onAllCoinsResolved(){
 state.rolls++;
 let heads=0;for(let i=0;i<state.coinCount;i++)if(coins[i].result==='HEAD')heads++;
 const tails=state.coinCount-heads;

 // 多币设计：正面贡献收益；全反面才爆仓。风险随硬币数下降，但增长密度上升。
 if(heads===0){
  popupGain('全反面');flash('爆仓 · 本轮归零');
  state.roundActive=false;state.waiting=false;state.roundValue=0;state.goodRounds=0;refresh();return;
 }
 const gain=Math.max(1,Math.round(state.roundValue*(heads/state.coinCount)*(multiplier()-.75)));
 state.roundValue+=gain;
 state.goodRounds++;
 for(let i=0;i<heads;i++)setTimeout(()=>popupGain('+'+Math.max(1,Math.round(gain/heads))),i*90);
 if(tails)popupGain(tails+' 枚反面');
 state.waiting=true;refresh();
 if(shouldAutoCash())setTimeout(()=>cashOut(true),500);
 else if(state.auto&&state.helperCount>0)state.nextAuto=performance.now()*.001+Math.max(.45,1.25-state.helperCount*.16);
}
function shouldAutoCash(){
 const s=strategy.value;
 if(s==='off')return false;
 if(s==='streak3')return state.goodRounds>=3;
 return state.roundValue>=state.roundStart*Number(s);
}
function buy(cost,fn,msg){if(state.wallet<cost){flash('金币不足');return;}state.wallet-=cost;fn();flash(msg);refresh();}
buyCoin.onclick=()=>{if(state.coinCount<6)buy(coinCost(),()=>state.coinCount++,'新增硬币槽');};
upgradeCoin.onclick=()=>buy(coinLvCost(),()=>state.coinLevel++,'硬币收益升级');
buyHelper.onclick=()=>{if(state.helperCount<4)buy(helperCost(),()=>state.helperCount++,'史莱姆加入');};
upgradeTable.onclick=()=>buy(tableCost(),()=>state.tableLevel++,'钱桌升级');
toggleAuto.onclick=()=>{if(state.helperCount){state.auto=!state.auto;flash(state.auto?'自动化开启':'自动化关闭');refresh();}};
strategy.onchange=refresh;

addEventListener('keydown',e=>{
 if(e.code==='KeyE'){e.preventDefault();if(!state.roundActive)startRound();else if(state.waiting)cashOut();}
 if(e.code==='Space'){e.preventDefault();if(state.roundActive&&activeCoinsDone())throwCoins();}
 if(e.code==='KeyU')upgradeCoin.click();
});
function updateGameAuto(t){
 if(!state.auto||state.helperCount===0)return;
 if(!state.roundActive&&t>=state.nextAuto){startRound();state.nextAuto=t+.7;return;}
 if(state.roundActive&&state.waiting&&t>=state.nextAuto)throwCoins();
}
syncCoins(1);refresh();
