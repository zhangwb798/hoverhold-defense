(function(root){'use strict';
const buildings=new Image(),medic=new Image(),fades=new WeakMap();
buildings.src='assets/paint-buildings-v48.webp';medic.src='assets/medic-v45.png';
const ready=Promise.all([buildings.decode(),medic.decode()]);
function rect(kind,index){const sheet=kind==='buildings'?buildings:medic;return root.BATTLE_ART_LAYOUT?.[kind]?.[index]||[index%4*sheet.naturalWidth/4,Math.floor(index/4)*sheet.naturalHeight/2,sheet.naturalWidth/4,sheet.naturalHeight/2]}
function sprite(ctx,index,cx,baseline,size,alpha=1){if(!buildings.complete||!buildings.naturalWidth)return;const r=rect('buildings',index),scale=size/Math.max(r[2],r[3]);ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(buildings,...r,cx-r[2]*scale/2,baseline-r[3]*scale,r[2]*scale,r[3]*scale);ctx.restore()}
function opacity(object,actors,time){
 const cx=object.kind?object.x+object.w/2:object.x,cy=object.kind?object.y+object.h*.85:object.y,width=object.w||object.width||65,height=object.height||width;
 const close=actors.some(u=>u.hp>0&&Math.abs(u.x-cx)<width*.65+12&&u.y<cy+30&&u.y>cy-height*.9&&Math.hypot(u.x-cx,u.y-cy)<Math.max(66,width*.85));
 const structure=object.kind||['gate','tower','wall'].includes(object.type)||height<40;
 const target=close?(object.type==='wall'?.56:structure?.43:.27):1,old=fades.get(object)||{alpha:1,time:time-.016},dt=Math.max(0,Math.min(.1,time-old.time));old.alpha+=(target-old.alpha)*(1-Math.exp(-dt*8));old.time=time;fades.set(object,old);return old.alpha;
}
function building(ctx,z,map,time,actors){
 const index=z.kind==='troop'?{footman:0,archer:1,spearman:2,mage:3}[z.type]:z.type==='arrowTower'?4:5;
 const cx=z.x+z.w/2,cy=z.y+z.h/2,size=z.kind==='troop'?96*map.cityScale/.9:91;
 ctx.save();ctx.fillStyle='#2e443c';ctx.globalAlpha=.13;ctx.beginPath();ctx.ellipse(cx+3,cy+13,size*.33,size*.09,0,0,Math.PI*2);ctx.fill();ctx.restore();
 sprite(ctx,index,cx,cy+16,size,opacity(z,actors,time));
}
function healer(ctx,u,time){
 if(!medic.complete||!medic.naturalWidth)return;
 const healing=u.attack>0,index=healing?4+Math.min(3,Math.floor((1-u.attack/.38)*4)):u.moving?Math.floor((u.walkPhase||0)*4)%4:0;
 const r=rect('medic',index),cells=Array.from({length:8},(_,i)=>rect('medic',i)),scale=46/Math.max(...cells.map(c=>c[3])),anchor=(r[0]-(index%4+.5)*medic.naturalWidth/4)*scale;
 ctx.save();ctx.fillStyle='#2e443c';ctx.globalAlpha=.18;ctx.beginPath();ctx.ellipse(u.x,u.y+11,10,3,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=u.hit>0?.7:1;ctx.translate(u.x,u.y+12);ctx.scale(u.face<0?-1:1,1);ctx.drawImage(medic,...r,anchor,-r[3]*scale,r[2]*scale,r[3]*scale);ctx.restore();
}
root.BattleArt={ready,sprite,opacity,building,healer};
})(window);
