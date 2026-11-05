(function(root){'use strict';
const groups={first:'初阵',recruit:'单局招募',gather:'采集',hunt:'讨敌',guard:'守城',build:'营造'};
const troops={footman:'剑士',archer:'弓手',spearman:'枪兵',mage:'法师'};
const definitions=[];
function add(group,id,key,target,reward,title,detail){definitions.push({group,id,key,target,reward,title,detail})}
add('first','first-camp','camp',1,40,'安营扎寨','建成第一座兵营');
add('first','first-recruit','recruits',1,35,'新兵入列','招募第一名普通士兵');
add('first','first-beast','beasts',1,55,'截住冲城兽','击退第一头地面冲城兽');
add('first','first-general','generals',1,100,'登台点将','首次召唤任意将领');
for(const [type,name] of Object.entries(troops))add('first','general-'+type,'general:'+type,1,75,name+'领军','首次召唤'+name+'将领');
for(const [type,name] of Object.entries(troops))for(const [i,n] of [5,15,25,50].entries())add('recruit',type+'-'+n,'best:'+type,n,[45,90,160,350][i],name+' · '+['小队','列阵','成军','大阵'][i],'单局招募 '+n+' 名'+name);
for(const [key,label] of [['gold','矿石'],['wood','木材']])for(const [i,n] of [400,2400].entries())add('gather',key+'-'+n,key,n,[60,160][i],label+(i?'满仓':'入库'),'累计采集 '+n+' '+label+'（含采集机关）');
for(const [i,n] of [20,80,250,700].entries())add('hunt','kills-'+n,'kills',n,[45,90,170,300][i],['初捷','破阵','百战','荡寇'][i],'累计击退 '+n+' 名敌军');
for(const [i,n] of [1,5,15].entries())add('guard','wins-'+n,'wins',n,[60,130,250][i],['初守告捷','五战得胜','守城老将'][i],'赢得 '+n+' 场战斗（可重玩同关）');
add('guard','flawless','flawless',1,120,'寸土未失','城墙满血时取得一场胜利');
for(const [key,title,detail,reward] of [['arrowTower','瞭望设防','建成第一座弓箭塔',65],['cannon','火炮上阵','建成第一座炮塔',100],['machine','机关开工','建成第一台采集机关',85],['merges','并营扩军','完成第一次兵营合成',75]])add('build','build-'+key,key,1,reward,title,detail);
const cap=Object.fromEntries(definitions.map(d=>[d.key,Math.max(...definitions.filter(other=>other.key===d.key).map(other=>other.target))]));
const bounded=(n,max)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
function read(raw){const stats=Object.fromEntries(Object.entries(cap).map(([key,max])=>[key,bounded(raw?.stats?.[key],max)]));return {stats,claimed:definitions.filter(d=>stats[d.key]>=d.target&&Array.isArray(raw?.claimed)&&raw.claimed.includes(d.id)).map(d=>d.id)}}
function journal(){return {recruited:{},generals:{},gathered:{gold:0,wood:0},built:{},merges:0,beasts:0}}
function record(raw,entry,result){const next=read(raw),add=(key,n)=>{next.stats[key]=bounded(next.stats[key]+(n||0),cap[key])};
 for(const type of Object.keys(troops)){const n=entry.recruited[type]||0;next.stats['best:'+type]=Math.max(next.stats['best:'+type],bounded(n,cap['best:'+type]));add('recruits',n);add('general:'+type,entry.generals[type]);add('generals',entry.generals[type]);}
 for(const k of ['gold','wood'])add(k,entry.gathered[k]);
 for(const k of ['camp','arrowTower','cannon','machine'])add(k,entry.built[k]);
 add('merges',entry.merges);add('beasts',entry.beasts);add('kills',result.kills);
 if(result.won){add('wins',1);if(result.perfect)add('flawless',1)}
 return next;
}
function available(state){return definitions.filter(d=>state.stats[d.key]>=d.target&&!state.claimed.includes(d.id))}
function claim(raw,id,coins,maxCoins){const state=read(raw),d=definitions.find(d=>d.id===id);if(!d||state.stats[d.key]<d.target)return {ok:false,reason:'尚未完成此成就'};if(state.claimed.includes(id))return {ok:false,reason:'奖励已领取'};if(coins+d.reward>maxCoins)return {ok:false,reason:'金币接近上限，请先花掉一些再领取'};state.claimed.push(id);return {ok:true,state,coins:coins+d.reward,reward:d.reward};}
root.AchievementRules={groups,definitions,read,journal,record,available,claim};
})(typeof window!=='undefined'?window:globalThis);
