(function(root){'use strict';
const flyers={
 forest:{name:'藤翼獠蝠',row:0,hp:66,speed:58,damage:6,interval:1.5,size:90,altitude:39,color:'#a4be78'},
 volcano:{name:'熔翼飞蜥',row:1,hp:78,speed:55,damage:8,interval:1.65,size:98,altitude:43,color:'#e8a064'},
 desert:{name:'沙翼毒蝎',row:2,hp:70,speed:65,damage:7,interval:1.4,size:94,altitude:40,color:'#d4bc72'}
};
const bosses={
 island:{name:'潮甲蟹王',sheet:'a',pair:0,hp:1400,speed:16,damage:21,interval:2.3,size:188,reach:72,color:'#76b6b1',skill:'怒潮钳击',skillDamage:34,radius:60,warning:3,cooldown:11},
 forest:{name:'古藤獠王',sheet:'a',pair:1,hp:1800,speed:19,damage:25,interval:2.15,size:194,reach:74,color:'#99b272',skill:'古藤震荡',skillDamage:32,radius:62,warning:3.1,cooldown:10.5},
 volcano:{name:'熔脊龙蜥',sheet:'b',pair:0,hp:2300,speed:17,damage:29,interval:2.5,size:202,reach:78,color:'#e4a06a',skill:'熔脊喷发',skillDamage:40,radius:65,warning:3.3,cooldown:11.5,hazard:3,hazardDamage:7},
 desert:{name:'金甲蝎皇',sheet:'b',pair:1,hp:2800,speed:20,damage:32,interval:2.25,size:198,reach:78,color:'#d8bc72',skill:'毒沙落刺',skillDamage:37,radius:60,warning:3.1,cooldown:10,hazard:4,hazardDamage:5}
};
function flyerCount(stage){return stage.chapter<3?0:1+(stage.tier===3?1:0)+(stage.chapter===5?1:0)}
function hasBoss(stage){return stage.chapter>=2&&stage.tier===3&&!!bosses[stage.mapId]}
function bossDue(stage,wave,time,spawned){return hasBoss(stage)&&wave===stage.waves&&time>=9&&!spawned}
function canTarget(type,enemy){return enemy.type!=='flyer'||['archer','mage','arrowTower','cursor'].includes(type)}
root.EncounterRules={flyers,bosses,flyerCount,hasBoss,bossDue,canTarget};
})(typeof window!=='undefined'?window:globalThis);
