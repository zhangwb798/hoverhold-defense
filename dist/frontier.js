(function(root){'use strict';
const key='hoverhold-frontier-v1';
const heroes={
 vanguard:{name:'沈砚',title:'边关游骑',skill:'破阵突袭',description:'斩击身边地面敌军',hp:260,damage:34,range:44,speed:68,interval:1.05,splash:34,splashRate:.35,cooldown:16,color:'#b65b43',unlock:0},
 warden:{name:'陆青萝',title:'巡林医骑',skill:'回春旗',description:'治疗身边的伤兵',hp:220,damage:26,range:44,speed:65,interval:1.1,splash:30,splashRate:.30,cooldown:18,color:'#4a8a74',unlock:2},
 outrider:{name:'燕照',title:'霜渡斥候',skill:'霜矢急射',description:'射击附近敌军并使其减速，可对空',hp:195,damage:29,range:145,speed:65,interval:1.25,splash:26,splashRate:.25,cooldown:17,color:'#557ea0',unlock:5}
};
const equipment={
 blade:{name:'巡边刀',slot:'weapon',price:110,description:'主角伤害 +10',damage:10},
 spear:{name:'银纹长枪',slot:'weapon',price:240,description:'主角伤害 +18',damage:18},
 coat:{name:'柳叶轻甲',slot:'armor',price:115,description:'主角生命 +55',hp:55},
 mantle:{name:'霜纹披风',slot:'armor',price:260,description:'主角生命 +85，披风变为靛青',hp:85,dye:'#405f88'},
 knot:{name:'行军结',slot:'charm',price:120,description:'主角主动技能冷却缩短 2 秒',cooldown:2},
 banner:{name:'玄金军旗',slot:'charm',rare:true,description:'全军伤害 +6%，军旗染金',teamDamage:1.06,dye:'#c6924c'},
 seal:{name:'山河护符',slot:'charm',rare:true,description:'全军生命 +8%，主角披风染绿',teamHp:1.08,dye:'#557f58'}
};
const slots={weapon:'兵器',armor:'护甲',charm:'信物'};
const difficulties={
 story:{name:'从容',health:.80,damage:.74,count:.83,speed:.96},
 normal:{name:'标准',health:1,damage:1,count:1,speed:1},
 hard:{name:'险关',health:1.15,damage:1.2,count:1.14,speed:1.04}
};
const boons={
 hold:{name:'列阵拒马',desc:'枪兵对冲城兽造成的伤害 +22%',max:3},
 bow:{name:'雁翎箭',desc:'弓手、法师伤害 +10%',max:3},
 shield:{name:'守军甲胄',desc:'普通士兵最大生命 +8%，现有士兵同步提升',max:3},
 medic:{name:'同袍医术',desc:'牧师每次额外治疗一名伤兵，治疗量提高',max:2},
 levy:{name:'乡勇报到',desc:'招募速度 +12%',max:3},
 captain:{name:'骑阵合拍',desc:'主角技能冷却缩短 2 秒',max:3},
 repair:{name:'抢修城墙',desc:'修复城墙最大生命的 20%'},
 stock:{name:'辎重到营',desc:'立即获得 75 矿石和 55 木材'}
};
const chapterNotes=[
 '游骑沈砚赶到云山。守营人已经撤走，河对岸升起了敌军的烟。',
 '昨夜的木料刚够补墙。先立下集合旗，给守军留出一条退路。',
 '山口传来兽蹄声。守住最后一夜，医师就能沿溪入营。'
];
function read(raw){
 let saved;try{saved=JSON.parse(raw)}catch{}
 const owned=Array.isArray(saved?.owned)?[...new Set(saved.owned.filter(id=>Object.hasOwn(equipment,id)))]:[];
 const gear=Object.fromEntries(Object.keys(slots).map(slot=>{
  const id=saved?.gear?.[slot];return [slot,owned.includes(id)&&equipment[id].slot===slot?id:null];
 }));
 return {hero:Object.hasOwn(heroes,saved?.hero)?saved.hero:'vanguard',difficulty:Object.hasOwn(difficulties,saved?.difficulty)?saved.difficulty:'normal',owned,gear,best:Number.isSafeInteger(saved?.best)?Math.max(0,saved.best):0};
}
function unlocked(hero,progress){return hero.unlock===0||progress.stars[hero.unlock]>0}
function kit(save,progress){
 const id=unlocked(heroes[save.hero],progress)?save.hero:'vanguard';
 const cfg={...heroes[id],id,teamDamage:1,teamHp:1};
 for(const id of Object.values(save.gear)){
  if(!id)continue;
  const item=equipment[id];
  cfg.hp+=item.hp||0;cfg.damage+=item.damage||0;cfg.cooldown-=item.cooldown||0;
  cfg.teamDamage*=item.teamDamage||1;cfg.teamHp*=item.teamHp||1;
  if(item.dye)cfg.dye=item.dye;
 }
 return cfg;
}
function loot(save,{won,endless,waves},roll=Math.random()){
 if(!won&&(!endless||waves<3))return null;
 const rare=endless&&waves>=6||roll<.24;
 const candidates=Object.keys(equipment).filter(id=>!save.owned.includes(id)&&(rare||!equipment[id].rare));
 const matching=candidates.filter(id=>!!equipment[id].rare===rare);
 const pool=matching.length?matching:candidates;
 if(!pool.length)return null;
 return pool[Math.min(pool.length-1,Math.floor(roll*pool.length))];
}
function choices(levels,wave,random=Math.random){
 const available=Object.keys(boons).filter(id=>boons[id].max&&(levels[id]||0)<boons[id].max);
 const picked=[];
 while(picked.length<2&&available.length)picked.push(available.splice(Math.floor(random()*available.length),1)[0]);
 picked.push(wave%2?'stock':'repair');
 if(picked.length<3)picked.push(wave%2?'repair':'stock');
 return picked;
}
root.Frontier={key,heroes,equipment,slots,difficulties,boons,chapterNotes,read,unlocked,kit,loot,choices};
})(typeof window!=='undefined'?window:globalThis);
