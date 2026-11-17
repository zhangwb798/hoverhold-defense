(function(root){'use strict';
const cache=new Map(),states=new Map(),sheet=new Image();sheet.src='assets/world-resources-v58.webp';const ready=sheet.decode();
function state(map){if(!states.has(map.id))states.set(map.id,{removed:new Set(),refresh:[]});return states.get(map.id)}
function spriteRect(o){return root.WORLD_RESOURCE_LAYOUT[o.sprite]}
function objects(map){
 if(cache.has(map.id))return cache.get(map.id);
 const wall=root.CastleNav.create(map),out=[],a=map.artLayout,families={mountain:[0,1],island:[2,0],forest:[1,0],volcano:[3],desert:[2,3],frost:[4],mist:[5,1]};
 function place(source,ore,index){const [x,y]=map.artPoint(source);if(!map.isGround({x,y})||!wall.walkable({x,y})||Math.hypot((source[0]-a.center[0])/a.radii[0],(source[1]-a.center[1])/a.radii[1])<1.55||wall.interior({x,y})||Math.hypot(x-map.gate[0],y-map.gate[1])<105||out.some(o=>Math.hypot(o.x-x,o.y-y)<82)||map.spawns.some(p=>Math.hypot(p[0]-x,p[1]-y)<65))return false;
  const family=families[map.id],sprite=ore?(map.id==='volcano'?7:6):family[index%family.length],r=root.WORLD_RESOURCE_LAYOUT[sprite],width=ore?83:70+index%3*6;
  out.push({id:ore?500+index:1+index,type:ore?'ore':'tree',sprite,x,y,width,height:r[3]/Math.max(r[2],r[3])*width,radius:ore?15:7});return true;
 }
 const near=[[-150,70],[150,70],[155,-85],[-150,-85],[220,135],[-220,135],[225,-120],[-225,-120]];let n=0;
 for(const [dx,dy] of near)if(place([a.center[0]+dx,a.center[1]+dy],false,n))n++;
 for(let i=0;n<40&&i<400;i++)if(place([250+(i*137)%1240,190+(i*97)%600],false,n))n++;
 let mine=0;for(const [dx,dy] of [[180,0],[-180,0],[120,155],[-120,155]])if(place([a.center[0]+dx,a.center[1]+dy],true,mine))mine++;
 for(let i=0;mine<16&&i<400;i++)if(place([280+(i*173)%1170,210+(i*131)%560],true,mine))mine++;
 cache.set(map.id,out);return out;
}
function zones(map,Meta){const s=state(map);s.removed.clear();s.refresh.forEach(fn=>fn());return objects(map).map(o=>{const r=spriteRect(o),scale=o.width/Math.max(r[2],r[3]),w=r[2]*scale,h=r[3]*scale,ore=o.type==='ore',capacity=ore?100:150;return {id:(ore?'ore-':'tree-')+o.id,resourceUid:o.id,kind:ore?'gold':'wood',name:ore?'金矿':'林木',hint:ore?'正在开采矿石':'正在砍伐木材',x:o.x-w/2,y:o.y-h,w,h,rate:ore?Meta.gatherIntervals.mine:Meta.gatherIntervals.wood,remaining:capacity,capacity}})}
function at(map,p){return [...objects(map)].sort((a,b)=>b.y-a.y).find(o=>!state(map).removed.has(o.id)&&Math.abs(p.x-o.x)<o.width*.43&&p.y<=o.y+4&&p.y>=o.y-o.height*.94)?.id??null}
function remove(map,id){const s=state(map);s.removed.add(id);s.refresh.forEach(fn=>fn(id))}
function layers(ctx,map,time,actors){return objects(map).filter(o=>!state(map).removed.has(o.id)).map(o=>({y:o.y,draw:()=>{const r=spriteRect(o),scale=o.width/Math.max(r[2],r[3]);ctx.save();ctx.translate(o.x,o.y);ctx.globalAlpha=.13;ctx.fillStyle='#294c3d';ctx.beginPath();ctx.ellipse(2,1,18,5,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=root.BattleArt.opacity(o,actors,time);if(o.type!=='ore'&&root.DisplaySettings?.value.quality!=='low')ctx.rotate(Math.sin(time*1.25+o.id)*.008);ctx.drawImage(sheet,...r,-r[2]*scale/2,-r[3]*scale,r[2]*scale,r[3]*scale);ctx.restore()}}))}
function ground(map,p,base){return base.interior(p)||map.isGround(p)}
root.LegacyResources={ready,state,objects,zones,at,remove,layers,ground};
})(window);
