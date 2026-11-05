/* Eight walking keys driven by travel distance; four attack keys driven by combat time. */
(()=>{'use strict';
const atlas={},walkAtlas={};
for(const key of ['troops-melee','troops-ranged','generals-melee','generals-ranged','enemies']){
 const image=new Image();image.src='assets/motion-'+key+'-v19.webp';atlas[key]=image;
 const walking=new Image();walking.src='assets/walk-'+key+'-v20.webp';walkAtlas[key]=walking;
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
 const phase=(((q.walkPhase??0)%1)+1)%1,walkFrame=q.moving?Math.floor(phase*8):(phase>.25&&phase<.75?4:0);
 return {key:binding[0],row:binding[1]*2+(attacking?1:Math.floor(walkFrame/4)),column:attacking?Math.floor(progress*4):walkFrame%4,attacking,progress,walkFrame};
}
function walk(q,distance){q.walkPhase=((q.walkPhase??(q.phase||0)/(Math.PI*2))+Math.max(0,distance)/(q.type==='brute'?40:34))%1}
function draw(ctx,q,size){
 const frame=pose(q);if(!frame)return false;const sheet=(frame.attacking?atlas:walkAtlas)[frame.key];if(!sheet.complete||!sheet.naturalWidth)return false;
 const cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/4;
 ctx.save();ctx.translate(q.x,q.y+12);ctx.scale(q.face<0?-1:1,1);
 if(q.hit>0)ctx.translate(-Math.sin(clamp(q.hit/.22,0,1)*Math.PI)*2,0);
 if(q.flash)ctx.globalAlpha=.6;
 const layout=frame.attacking?window.MOTION_LAYOUT:window.WALK_LAYOUT,baseline=layout?.[frame.key]?.[frame.row*4+frame.column]??.96;
 ctx.drawImage(sheet,frame.column*cw,frame.row*ch,cw,ch,-size/2,-size*baseline,size,size);ctx.restore();return true;
}
const ready=Promise.all([...Object.values(atlas),...Object.values(walkAtlas)].map(img=>img.decode().catch(()=>false)));
window.CharacterMotion={pose,walk,draw,duration,ready};
})();
