/* Four articulated walk poses and four attack poses for each human character. */
(()=>{'use strict';
const atlas={};
for(const key of ['troops-melee','troops-ranged','generals-melee','generals-ranged','enemies']){
 const image=new Image();image.src='assets/motion-'+key+'-v19.webp';atlas[key]=image;
}
const bindings={
 footman:['troops-melee',0],spearman:['troops-melee',1],archer:['troops-ranged',0],mage:['troops-ranged',1],
 'hero-footman':['generals-melee',0],'hero-spearman':['generals-melee',1],'hero-archer':['generals-ranged',0],'hero-mage':['generals-ranged',1],
 raider:['enemies',0],brute:['enemies',1]
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function duration(q){return q.type==='brute'?.88:q.type==='raider'?.72:q.type==='mage'?(q.hero?.92:.96):q.type==='archer'?(q.hero?.68:.84):q.type==='spearman'?(q.hero?.72:.76):q.hero?.6:.64}
function pose(q){
 const binding=bindings[(q.hero?'hero-':'')+q.type];if(!binding)return null;
 const attacking=q.attack>0,progress=attacking?clamp(1-q.attack/(q.attackSpan||duration(q)),0,.999):0;
 return {key:binding[0],row:binding[1]*2+(attacking?1:0),column:attacking?Math.floor(progress*4):q.moving?Math.floor((((q.walkPhase??0)%1)+1)%1*4):0,attacking,progress};
}
function walk(q,distance){q.walkPhase=((q.walkPhase??(q.phase||0)/(Math.PI*2))+distance/(q.type==='brute'?32:q.hero?28:24))%1}
function draw(ctx,q,size){
 const frame=pose(q);if(!frame)return false;const sheet=atlas[frame.key];if(!sheet.complete||!sheet.naturalWidth)return false;
 const cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/4;
 ctx.save();ctx.translate(q.x,q.y+12);ctx.scale(q.face<0?-1:1,1);
 if(q.hit>0)ctx.translate(-Math.sin(clamp(q.hit/.22,0,1)*Math.PI)*2,0);
 if(q.flash)ctx.globalAlpha=.6;
 const baseline=window.MOTION_LAYOUT?.[frame.key]?.[frame.row*4+frame.column]??.96;
 ctx.drawImage(sheet,frame.column*cw,frame.row*ch,cw,ch,-size/2,-size*baseline,size,size);ctx.restore();return true;
}
const ready=Promise.all(Object.values(atlas).map(img=>img.decode().catch(()=>false)));
window.CharacterMotion={pose,walk,draw,duration,ready};
})();
