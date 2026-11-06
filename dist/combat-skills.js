(function(root){'use strict';
 const spells={
  healField:{name:'治疗法阵',key:'1',seal:'愈',cost:4,price:55,color:'#a7da9b',power:18,radius:92,duration:6},
  poisonField:{name:'毒药法阵',key:'2',seal:'毒',cost:5,price:60,color:'#b5a2da',power:16,radius:88,duration:6},
  fireball:{name:'火球',key:'3',seal:'火',cost:6,price:65,color:'#ffad62',power:120,radius:76,duration:.7},
  lightning:{name:'雷电',key:'4',seal:'雷',cost:7,price:70,color:'#9edbff',power:155,radius:74,duration:.55}
 };
 const maxPoints=30,orderCooldown=20,orderDuration=8,orderDamage=1.28,orderSpeed=1.20;
 function stats(id,level){const cfg=spells[id],extra=level-1;return {...cfg,power:Math.round(cfg.power*(1+extra*.15)),radius:cfg.radius+extra*2};}
 function bounty(type){return {raider:1,brute:2,beast:3,flyer:2,boss:8}[type]||1;}
 function capacity(camps,type){
  const upgraded=camps.filter(z=>z.kind==='troop'&&z.built&&z.tier>=2);
  if(!type)return upgraded.length?2:1;
  const tier=upgraded.reduce((max,z)=>z.type===type?Math.max(max,z.tier):max,1);
  return 20+Math.min(2,tier-1)*10;
 }
 function inField(p,f){return Math.hypot(p.x-f.x,(p.y-f.y)/.70)<=f.radius;}
 function description(id,level){const now=stats(id,level),next=stats(id,Math.min(10,level+1)),value=now.power===next.power?now.power:now.power+' → '+next.power;
  const effects={healField:'6 秒内每秒治疗 '+value,poisonField:'6 秒内每秒造成 '+value+' 地面伤害并减速',fireball:'落点地面群伤 '+value,lightning:'首击伤害 '+value+'，连锁最多 3 个目标，可对空'};
  return effects[id]+' · 消耗 '+now.cost+' 技能点';
 }
 root.CombatSkills={spells,maxPoints,orderCooldown,orderDuration,orderDamage,orderSpeed,stats,bounty,capacity,inField,description};
})(typeof window!=='undefined'?window:globalThis);
