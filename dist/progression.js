(function(root){'use strict';
const MAX_LEVEL=10,key='hoverhold-upgrades-v1';
const definitions=[
 ['build','建造','cursor','筑',35],['wood','砍树','cursor','樵',35],['mine','挖矿','cursor','矿',35],['recruit','招兵','cursor','募',45],['attack','攻击','cursor','击',50],['heal','治疗','cursor','愈',45],
 ['wall','城墙','wall','城',75],['footman','剑士','troop','剑',60],['archer','弓手','troop','弓',60],['spearman','枪兵','troop','枪',65],['mage','法师','troop','法',70],
 ['oreMachine','采矿机关','machine','采',100],['woodMachine','伐木机关','machine','伐',100]
].map(([id,name,category,seal,base])=>({id,name,category,seal,base}));
const integer=(n,min,max,fallback=min)=>Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):fallback;
function read(raw,progress){let input;try{input=JSON.parse(raw)}catch{}const valid=input?.version===1,legacy=raw==null?(progress?.stars||[]).filter(n=>n>0).length:0;
 const levels=Object.fromEntries(definitions.map(d=>[d.id,integer(valid?input.levels?.[d.id]:1,1,MAX_LEVEL)]));
 return {version:1,coins:integer(valid?input.coins:legacy*90,0,1e9),levels,firstWins:Array.from({length:15},(_,i)=>valid?input.firstWins?.[i]===true:raw==null&&progress?.stars?.[i]>0),ledger:valid&&Array.isArray(input.ledger)?[...new Set(input.ledger.filter(x=>typeof x==='string'&&x.length>0&&x.length<100))].slice(-64):[]};
}
function unlocks(progress,levels){const stars=progress?.stars||[];return {freeCamps:stars.slice(0,3).length===3&&stars.slice(0,3).every(n=>n>0),machines:stars.slice(0,6).length===6&&stars.slice(0,6).every(n=>n>0),arrowTower:levels.wall>=3,cannon:levels.wall>=6}}
function cost(id,level){const d=definitions.find(d=>d.id===id);return d&&level<MAX_LEVEL?Math.round(d.base*Math.pow(1.43,Math.max(0,level-1))):null}
function purchase(profile,id,progress,inBattle=false){const d=definitions.find(d=>d.id===id);if(!d)return {ok:false,reason:'未知升级'};if(inBattle)return {ok:false,reason:'对战结束后才能升级'};const out=read(JSON.stringify(profile)),level=out.levels[id],price=cost(id,level);if(d.category==='machine'&&!unlocks(progress,out.levels).machines)return {ok:false,reason:'通过第二章解锁'};if(price==null)return {ok:false,reason:'已达满级'};if(out.coins<price)return {ok:false,reason:'金币不足'};out.coins-=price;out.levels[id]++;return {ok:true,profile:out,cost:price}}
function snapshot(profile){return Object.freeze({...profile.levels})}
function rate(levels,id){return 1+(levels[id]-1)*.16}
function wallHp(levels){return 100+(levels.wall-1)*30}
function unitBonus(levels,type,hero=false){const n=levels[type]-1;return {hp:1+n*(hero?.08:.12),damage:1+n*(hero?.1:.14),speed:1+n*.012}}
function attackDamage(levels){return 5+(levels.attack-1)*1.5}
function attackInterval(levels){return .42/(1+(levels.attack-1)*.05)}
function machineRate(levels,type){return 1.5*(1+(levels[type]-1)*.22)}
function settle(profile,battle){const out=read(JSON.stringify(profile)),id=battle.id;if(typeof id!=='string'||!id||id.length>=100||out.ledger.includes(id))return {ok:false,profile:out,coins:0};const stage=integer(battle.stageId,0,14),kills=integer(battle.kills,0,10000),waves=integer(battle.wavesCleared,0,5),won=battle.won===true,first=won&&!out.firstWins[stage],chapter=Math.floor(stage/3)+1,tier=stage%3+1;
 const combat=kills*2+waves*12,clear=won?50+chapter*15+tier*5:0,firstBonus=first?90:0,participation=won?0:15,coins=combat+clear+firstBonus+participation;
 out.coins=Math.min(1e9,out.coins+coins);if(won)out.firstWins[stage]=true;out.ledger.push(id);out.ledger=out.ledger.slice(-64);return {ok:true,profile:out,coins,combat,clear,participation,firstBonus};
}
root.MetaRules={key,MAX_LEVEL,definitions,read,unlocks,cost,purchase,snapshot,rate,wallHp,unitBonus,attackDamage,attackInterval,machineRate,settle};
})(typeof window!=='undefined'?window:globalThis);
