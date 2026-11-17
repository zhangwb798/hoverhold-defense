(function(root){'use strict';
const names={
 mountain:['岩盾山匪','背篓投石手','撞木山魈'],
 island:['龟甲潮卫','织网鲛人','寄舰巨螺'],
 forest:['木面藤卫','菌伞巫童','披荆角鹿'],
 volcano:['炉腹铸兵','灰翼祭司','熔锤犰狳'],
 desert:['沙帆刀客','沙漏咒师','钻沙长蚺'],
 frost:['雪橇斧卫','鸣骨雪鸮','破冰长牙象'],
 mist:['苇甲蛙兵','提灯纸傀','沉木鳄龟']
};
const colors={mountain:'#c5ab7b',island:'#80cfcc',forest:'#b5ce72',volcano:'#f3a15d',desert:'#dfc083',frost:'#b4e9f5',mist:'#c3d984'};
const effects={mountain:'stone',island:'net',forest:'spore',volcano:'ember',desert:'sand',frost:'frost',mist:'lantern'};
const atlas={},requests={};
function ready(id){
 if(requests[id])return requests[id];
 if(!names[id])return Promise.reject(new Error('Unknown region'));
 const image=new Image();image.src='assets/enemies-'+id+'-v48.webp';atlas[id]=image;
 requests[id]=image.decode().catch(error=>{delete requests[id];delete atlas[id];throw error});return requests[id];
}
function config(e){
 const row=e.type==='beast'?2:e.role==='ranged'?1:0,id=e.faction;
 return {id,row,name:names[id][row],color:colors[id],effect:effects[id],size:row===2?78:row===1?48:53,
  range:row===1?132:38,radius:row===1?24:0,windup:row===1?.8:.7,interval:row===1?2.8:1.15};
}
function draw(ctx,e,time){
 if(!e.faction||!atlas[e.faction])return false;
 const cfg=config(e),sheet=atlas[e.faction];
 if(!sheet.complete||!sheet.naturalWidth)return false;
 const age=e.attack>0?1-e.attack/(e.attackSpan||cfg.windup):0;
 const column=e.attack>0?(age<.60?2:3):e.chargeWait>0?2:e.moving?Math.floor((e.walkPhase||time*.8)*2)%2:0;
 const rect=root.ENEMY_FACTION_LAYOUT[e.faction][cfg.row*4+column];
 const cells=root.ENEMY_FACTION_LAYOUT[e.faction].slice(cfg.row*4,cfg.row*4+4);
 const scale=cfg.size/Math.max(...cells.flatMap(cell=>[cell[2],cell[3]]));
 const width=rect[2]*scale,height=rect[3]*scale;
 ctx.save();ctx.fillStyle='#243b35';ctx.globalAlpha=.2;
 ctx.beginPath();ctx.ellipse(e.x,e.y+7,width*.32,4,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=e.flash?.65:1;ctx.translate(e.x,e.y+8);ctx.scale(e.face<0?-1:1,1);
 const recoil=e.hit>0?-Math.sin(e.hit/.22*Math.PI)*2:0;
 ctx.drawImage(sheet,...rect,-width/2+recoil,-height,width,height);ctx.restore();
 return true;
}
function warnings(ctx,attacks,time){
 for(const shot of attacks){
  const {x,y,radius,color}=shot;
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.globalAlpha=.12;
  ctx.beginPath();ctx.ellipse(x,y,radius,radius*.6,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.65;ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
  if(shot.warning){ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(x,y-5,2+Math.sin(time*9)*.6,0,Math.PI*2);ctx.fill()}
  ctx.restore();
 }
}
function drawNet(ctx,radius){
 ctx.lineWidth=1.4;
 for(let n=-2;n<=2;n++){
  const offset=n*radius*.3;
  ctx.beginPath();ctx.moveTo(-radius,offset);ctx.lineTo(radius,-offset);ctx.stroke();
  ctx.beginPath();ctx.moveTo(offset,-radius*.6);ctx.lineTo(-offset,radius*.6);ctx.stroke();
 }
}
function effect(ctx,fx){
 const progress=Math.max(0,Math.min(1,1-fx.life/fx.max));
 const flying=fx.phase==='flight',pulse=fx.phase==='field',fade=pulse?Math.min(1,fx.life*2):1-progress;
 const radius=pulse?fx.radius:fx.phase==='impact'?6+progress*fx.radius:7;
 let px=fx.x,py=fx.y-10;
 if(flying){
  px=fx.sx+(fx.x-fx.sx)*progress;
  py=fx.sy+(fx.y-12-fx.sy)*progress-Math.sin(progress*Math.PI)*35;
 }
 ctx.save();ctx.translate(px,py);ctx.globalAlpha=fade;ctx.strokeStyle=fx.color;ctx.fillStyle=fx.color;
 if(fx.phase==='impact'){
  ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,10,radius,radius*.5,0,0,Math.PI*2);ctx.stroke();
 }
 if(fx.effect==='net'){
  ctx.save();ctx.scale(1,flying?1:.7);ctx.rotate(flying?progress*2:0);drawNet(ctx,flying?9:radius);ctx.restore();
 }else if(fx.effect==='stone'){
  const count=flying?1:7;
  for(let i=0;i<count;i++){
   const angle=i*Math.PI*2/count,offset=flying?0:radius*.7;
   ctx.save();ctx.translate(Math.cos(angle)*offset,Math.sin(angle)*offset*.55);
   ctx.rotate(i+progress*3);ctx.fillStyle=i%2?'#937b5d':fx.color;ctx.fillRect(-3,-3,6,5);ctx.restore();
  }
 }else if(fx.effect==='frost'){
  const count=flying?1:6;
  ctx.lineWidth=2;
  for(let i=0;i<count;i++){
   ctx.save();ctx.rotate(i*Math.PI*2/count);
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(radius,0);ctx.lineTo(radius*.65,-4);ctx.moveTo(radius,0);ctx.lineTo(radius*.65,4);ctx.stroke();ctx.restore();
  }
 }else if(fx.effect==='ember'){
  for(let i=0;i<(flying?3:8);i++){
   const angle=i*2.4+progress*3,d=flying?i*3:radius*(.25+i*.08);
   ctx.beginPath();ctx.ellipse(Math.cos(angle)*d,Math.sin(angle)*d*.55-i*.8,3,6,-.4,0,Math.PI*2);ctx.fill();
  }
 }else if(fx.effect==='lantern'){
  if(flying){
   ctx.lineWidth=1.5;ctx.strokeRect(-5,-7,10,14);ctx.fillStyle='#fff0b1';ctx.fillRect(-3,-4,6,8);
  }else{
   for(let i=0;i<6;i++){
    ctx.save();ctx.rotate(i*Math.PI/3+progress*.7);ctx.translate(radius*.65,0);
    ctx.fillStyle=i%2?'#fff0bf':fx.color;ctx.fillRect(-3,-6,6,12);ctx.restore();
   }
  }
 }else if(fx.effect==='spore'){
  for(let i=0;i<7;i++){
   const angle=i*2.4+progress,d=flying?i*1.3:radius*.75;
   ctx.beginPath();ctx.arc(Math.cos(angle)*d,Math.sin(angle)*d*.55-progress*9,2.5+i%2,0,Math.PI*2);ctx.fill();
  }
 }else{
  ctx.lineWidth=1.7;
  for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,i*3,radius*(.4+i*.15),radius*.28,progress*4,0,Math.PI*1.5);ctx.stroke()}
 }
 ctx.restore();
}
root.EnemyFactions={names,colors,effects,atlas,ready,config,draw,warnings,effect};
})(window);
