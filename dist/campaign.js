(function(root){
 'use strict';
 const mapIds=['mountain','island','forest','volcano','desert'];
 const titles=['初守','鏖战','决战'];
 const levels=mapIds.flatMap((mapId,chapter)=>titles.map((title,tier)=>({
  id:chapter*3+tier,mapId,chapter:chapter+1,tier:tier+1,title,
  waves:3+tier,duration:20,preparation:30,rest:12,
  health:.85+(chapter*3+tier)*.065,speed:1+(chapter*3+tier)*.012,
  damage:.85+(chapter*3+tier)*.045,extraEnemies:chapter*2+tier*2,
  bruteChance:.025+(chapter*3+tier)*.009,gold:160,wood:120
 })));
 function read(raw){let input;try{input=JSON.parse(raw)}catch{}const stars=Array.from({length:15},(_,i)=>{const n=input?.stars?.[i];return Number.isInteger(n)?Math.max(0,Math.min(3,n)):0});let unlocked=0;while(unlocked<14&&stars[unlocked]>0)unlocked++;for(let i=unlocked+1;i<15;i++)stars[i]=0;return {version:1,stars,unlocked};}
 function complete(progress,id,hp){const out=read(JSON.stringify(progress));if(!Number.isInteger(id)||id<0||id>out.unlocked||id>14)return out;const stars=hp>=80?3:hp>=40?2:1;out.stars[id]=Math.max(out.stars[id],stars);return read(JSON.stringify(out));}
 function resume(progress){return progress.stars.findIndex(n=>n===0)<0?14:progress.unlocked;}
 root.CampaignRules={levels,read,complete,resume,key:'hoverhold-campaign-v1'};
})(typeof window!=='undefined'?window:globalThis);
