(function(root){'use strict';
const blueprints={
 arrowTower:{name:'弓箭塔',kind:'tower',cell:0,gold:90,wood:60,time:4,size:108,wall:3,color:'#6199a0'},
 cannon:{name:'炮塔',kind:'tower',cell:1,gold:150,wood:110,time:5,size:104,wall:6,color:'#bc8151'},
 oreMachine:{name:'采矿机关',kind:'machine',cell:2,gold:110,wood:75,time:4,size:96,resource:'gold',color:'#c6a455'},
 woodMachine:{name:'伐木机关',kind:'machine',cell:3,gold:85,wood:100,time:4,size:96,resource:'wood',color:'#79a074'}
};
function campRate(tier){return Math.pow(1.45,Math.max(0,Math.min(3,tier-1)))}
function mergeReason(a,b,unlocked){if(!unlocked)return '通过第一章后解锁合营';if(!a||!b||a.id===b.id)return '请选择另一座兵营';if(a.kind!=='troop'||b.kind!=='troop'||!a.built||!b.built)return '只能合并已建成的兵营';if(a.type!==b.type||a.tier!==b.tier)return '需要同兵种、同等级的两座兵营';if(a.tier>=4)return '兵营已达四阶';return ''}
function towerStats(type,wall){return type==='cannon'?{damage:Math.round(44*(1+(wall-1)*.08)),range:270,interval:3,splash:70}:{damage:Math.round(18*(1+(wall-1)*.08)),range:245,interval:1.25,splash:0}}
root.FacilityRules={blueprints,campRate,mergeReason,towerStats};
})(typeof window!=='undefined'?window:globalThis);
