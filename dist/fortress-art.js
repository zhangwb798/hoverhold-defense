(function(root){'use strict';
const atlas=new Image(),stone=new Image(),materials=new WeakMap(),cache=new WeakMap();
atlas.src='assets/paint-castle-v48.webp';stone.src='assets/paint-tiles-v48.webp';
const ready=Promise.all([atlas.decode(),stone.decode()]);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
function path(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath()}
function roundedPath(ctx,points,radius){
 const ends=points.map((p,i)=>{const before=points[(i+points.length-1)%points.length],after=points[(i+1)%points.length],a=Math.hypot(p.x-before.x,p.y-before.y),b=Math.hypot(after.x-p.x,after.y-p.y),r=Math.min(radius,a*.3,b*.3);return {p,in:lerp(p,before,r/(a||1)),out:lerp(p,after,r/(b||1))}});
 ctx.beginPath();ctx.moveTo(ends[0].in.x,ends[0].in.y);for(const corner of ends){ctx.lineTo(corner.in.x,corner.in.y);ctx.quadraticCurveTo(corner.p.x,corner.p.y,corner.out.x,corner.out.y)}ctx.closePath();
}
function range(poly,a,b){let lo=0,hi=1;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dx=q.x-p.x,dy=q.y-p.y,v=dx*(a.y-p.y)-dy*(a.x-p.x),delta=dx*(b.y-a.y)-dy*(b.x-a.x);if(Math.abs(delta)<1e-7){if(v<0)return null;continue}const t=-v/delta;if(delta>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null}return [lo,hi]}
function parts(wall){
 if(cache.has(wall))return cache.get(wall);
 const result=[];let innerPhase=0,outerPhase=0;
 wall.inner.forEach((a,i)=>{
  if(wall.inner.length===8&&i%2===0)return; // Corner bastions replace the chamfer curtains.
  const b=wall.inner[(i+1)%wall.inner.length],A=wall.outer[i],B=wall.outer[(i+1)%wall.outer.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),normal={x:dy/length,y:-dx/length};
  const outerLength=Math.hypot(B.x-A.x,B.y-A.y),edgePhase=innerPhase,edgeOuterPhase=outerPhase;innerPhase+=length;outerPhase+=outerLength;
  const cuts=[range(wall.portal,a,b),range(wall.portal,A,B)].filter(Boolean);
  const spans=cuts.length?[[0,Math.min(...cuts.map(c=>c[0]))],[Math.max(...cuts.map(c=>c[1])),1]]:[[0,1]];
  for(const [from,to] of spans){if((to-from)*length<.2)continue;const count=Math.ceil((to-from)*length/36);for(let i=0;i<count;i++){const start=from+(to-from)*i/count,end=from+(to-from)*(i+1)/count,p=lerp(a,b,start),q=lerp(a,b,end),outerP=lerp(A,B,start),outerQ=lerp(A,B,end),outside=normal.x*.25+normal.y>0,footP=outside?outerP:p,footQ=outside?outerQ:q;result.push({p,q,outerP,outerQ,normal,outside,phase:edgePhase+start*length,outerPhase:edgeOuterPhase+start*outerLength,depth:(footP.y+footQ.y)/2,fade:{type:'wall',x:(footP.x+footQ.x)/2,y:(footP.y+footQ.y)/2,width:Math.hypot(q.x-p.x,q.y-p.y),height:64}})}}
 });cache.set(wall,result);return result;
}
function patterns(ctx){
 if(!stone.complete||!stone.naturalWidth)return [null,null,null,null];
 if(materials.has(ctx))return materials.get(ctx);
 const cw=Math.floor(stone.naturalWidth/4),ch=Math.floor(stone.naturalHeight/4),out=[];
 for(let i=0;i<4;i++){const canvas=document.createElement('canvas');canvas.width=canvas.height=84;const paint=canvas.getContext('2d');paint.drawImage(stone,[9,10,11,11][i]%4*cw,Math.floor([9,10,11,11][i]/4)*ch,cw,ch,0,0,84,84);paint.fillStyle='#e1d9c4';paint.globalAlpha=.2;paint.fillRect(0,0,84,84);out.push(ctx.createPattern(canvas,'repeat'))}
 materials.set(ctx,out);return out;
}
function face(ctx,a,b,height,material,shade,phase=0){
 const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.1)return;
 ctx.save();ctx.transform(dx/length,dy/length,0,-1,a.x,a.y);ctx.translate(-phase,0);ctx.fillStyle=material||'#858577';ctx.fillRect(phase,0,length,height);if(shade){ctx.fillStyle=shade;ctx.fillRect(phase,0,length,height)}ctx.restore();
}
function ground(ctx,pieces){
 ctx.save();ctx.fillStyle='#20362b16';for(const p of pieces){path(ctx,[p.outerP,p.outerQ,{x:p.outerQ.x+6,y:p.outerQ.y+5},{x:p.outerP.x+6,y:p.outerP.y+5}]);ctx.fill()}ctx.restore();
}
function circularProfile(wall,part){
 const c=wall.circle,a=Math.atan2((part.p.y-c.cy)/c.ry,(part.p.x-c.cx)/c.rx);let b=Math.atan2((part.q.y-c.cy)/c.ry,(part.q.x-c.cx)/c.rx);while(b<a)b+=Math.PI*2;
 const thickness=Math.hypot(part.outerP.x-part.p.x,part.outerP.y-part.p.y);
 const at=(t,outside=false,up=0)=>{const angle=a+(b-a)*t,nx=Math.cos(angle)/c.rx,ny=Math.sin(angle)/c.ry,length=Math.hypot(nx,ny);return {x:c.cx+Math.cos(angle)*c.rx+(outside?nx/length*thickness:0),y:c.cy+Math.sin(angle)*c.ry+(outside?ny/length*thickness:0)-up}};
 return {at,a,b};
}
function curvedLine(ctx,at,outside,up,reverse=false){for(let i=0;i<=6;i++){const p=at(reverse?1-i/6:i/6,outside,up);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}}
function curvedCurtain(ctx,part,height,wall){
 const {at}=circularProfile(wall,part),outside=part.outside,p=at(0,outside),q=at(1,outside),n=part.normal;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 // Pale limewash follows one continuous curve; irregular sparse joints replace the tiled brick grid.
 const g=ctx.createLinearGradient(p.x,p.y-height,p.x,p.y);g.addColorStop(0,outside?'#b8b9a4':'#c9c8b0');g.addColorStop(.35,outside?'#b8bba7':'#d1ceb7');g.addColorStop(1,outside?'#96a28d':'#b9bda4');
 ctx.beginPath();curvedLine(ctx,at,outside,0);for(let i=6;i>=0;i--){const v=at(i/6,outside,height);ctx.lineTo(v.x,v.y)}ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#b4b9a4';ctx.lineWidth=.42;ctx.stroke();
 ctx.globalAlpha=.19;ctx.fillStyle=patterns(ctx)[outside?0:1]||'#bbb9a1';ctx.fill();ctx.globalAlpha=1;
 ctx.fillStyle=n.x>.5?'#39584c0b':'#f0e7cb0d';ctx.fill();
 for(let row=1;row<4;row++){
  const y=height*row/4;ctx.beginPath();curvedLine(ctx,at,outside,y);ctx.strokeStyle=row%2?'#536f5c35':'#66796229';ctx.lineWidth=.65;ctx.stroke();
  const length=Math.hypot(q.x-p.x,q.y-p.y),phase=outside?part.outerPhase:part.phase,spacing=43;
  for(let mark=Math.ceil((phase-(row%2)*21)/spacing);mark*spacing+(row%2)*21<phase+length;mark++){const t=(mark*spacing+(row%2)*21-phase)/length;if(t<0)continue;const v=at(t,outside,y),jitter=Math.sin(mark*2.7+row)*1.5;ctx.beginPath();ctx.moveTo(v.x,v.y+jitter);ctx.lineTo(v.x+.5,v.y-height/4+1+jitter);ctx.strokeStyle='#64765f2b';ctx.stroke()}
 }
 // Rounded coping has no vertical cut lines between the rendering sections.
 ctx.beginPath();curvedLine(ctx,at,false,height);for(let i=6;i>=0;i--){const v=at(i/6,true,height);ctx.lineTo(v.x,v.y)}ctx.closePath();ctx.fillStyle='#c9c9ad';ctx.fill();ctx.strokeStyle='#c5c7ac';ctx.lineWidth=.45;ctx.stroke();
 ctx.beginPath();curvedLine(ctx,at,true,height);ctx.strokeStyle='#e3dfc080';ctx.lineWidth=1.6;ctx.stroke();
 ctx.beginPath();curvedLine(ctx,at,false,height);ctx.strokeStyle='#78907866';ctx.lineWidth=1.1;ctx.stroke();
 const length=Math.hypot(part.outerQ.x-part.outerP.x,part.outerQ.y-part.outerP.y),phase=part.outerPhase;
 for(let i=Math.ceil((phase-18)/38);i*38+18<phase+length;i++){
  const t=(i*38+18-phase)/length;if(t<0)continue;const v=at(t,true,height),rise=4.4+Math.sin(i*2.1)*.5,ax=-n.y,ay=n.x,left={x:v.x-ax*6,y:v.y-ay*6},right={x:v.x+ax*6,y:v.y+ay*6};
  roundedPath(ctx,[left,right,{x:right.x,y:right.y-rise},{x:left.x,y:left.y-rise}],2.8);ctx.fillStyle='#b8bda4';ctx.fill();ctx.beginPath();ctx.moveTo(left.x,left.y-rise+1);ctx.quadraticCurveTo(v.x,v.y-rise-1,right.x,right.y-rise+1);ctx.strokeStyle='#e3dfbf';ctx.lineWidth=2.1;ctx.stroke();
 }
 ctx.restore();
}
function curtain(ctx,part,height){
 const {p,q,outerP:A,outerQ:B,normal:n,outside}=part,m=patterns(ctx),dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
 ctx.save();
 face(ctx,outside?A:p,outside?B:q,height,m[outside?0:1],outside?(n.x>.6?'#2f3b3438':'#2f3b3412'):'#d0c9b012',outside?part.outerPhase:part.phase);
 const top=[{x:p.x,y:p.y-height},{x:q.x,y:q.y-height},{x:B.x,y:B.y-height},{x:A.x,y:A.y-height}];
 ctx.save();path(ctx,top);ctx.clip();ctx.transform(ux,uy,n.x,n.y,p.x,p.y-height);ctx.translate(-part.phase,0);ctx.fillStyle=m[2]||'#93927e';ctx.fillRect(part.phase-60,-10,length+120,70);ctx.restore();
 ctx.strokeStyle='#656b5050';ctx.lineWidth=1.1;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(p.x,p.y-height);ctx.lineTo(q.x,q.y-height);ctx.moveTo(A.x,A.y-height);ctx.lineTo(B.x,B.y-height);ctx.stroke();
 // Shallow, worn merlons use rounded edges instead of sharp upright cubes.
 const outsideLength=Math.hypot(B.x-A.x,B.y-A.y),ax=(B.x-A.x)/outsideLength,ay=(B.y-A.y)/outsideLength;
 for(let i=Math.ceil((part.outerPhase-15)/30);i*30+15<part.outerPhase+outsideLength;i++){
  const at=lerp(A,B,(i*30+15-part.outerPhase)/outsideLength),rise=6.5+Math.sin(i*2.1)*.7,left={x:at.x-ax*8,y:at.y-ay*8-height+.4},right={x:at.x+ax*8,y:at.y+ay*8-height+.4},backLeft={x:left.x-n.x*6,y:left.y-n.y*6},backRight={x:right.x-n.x*6,y:right.y-n.y*6};
  const front=outside?[left,right]:[backLeft,backRight];roundedPath(ctx,[front[0],front[1],{x:front[1].x,y:front[1].y-rise},{x:front[0].x,y:front[0].y-rise}],2.2);ctx.fillStyle='#c7c5b4';ctx.fill();
  roundedPath(ctx,[right,backRight,{x:backRight.x,y:backRight.y-rise},{x:right.x,y:right.y-rise}],1.5);ctx.fillStyle='#b3b6a6';ctx.fill();
  roundedPath(ctx,[{x:left.x,y:left.y-rise},{x:right.x,y:right.y-rise},{x:backRight.x,y:backRight.y-rise},{x:backLeft.x,y:backLeft.y-rise}],2);ctx.fillStyle='#e0dcc7';ctx.fill();ctx.strokeStyle='#73766055';ctx.lineWidth=.65;ctx.stroke();
 }
 // Low inner coping leaves a clear band of walkable-looking wall top.
 const ip={x:p.x,y:p.y-height},iq={x:q.x,y:q.y-height};face(ctx,ip,iq,3,m[3],null,part.phase);
 ctx.restore();
}
function sprite(ctx,object,alpha){
 if(!atlas.complete||!atlas.naturalWidth)return;
 const r=root.FORTRESS_LAYOUT[object.kind==='gate'?0:1],scale=object.width/r[2];
 ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(atlas,...r,object.x-r[2]*scale/2,object.y-r[3]*scale,r[2]*scale,r[3]*scale);ctx.restore();
}
function layers(ctx,map,wall,time,actors){
 const pieces=parts(wall),out=[{y:-100000,draw:()=>ground(ctx,pieces)}];
 for(const p of pieces)out.push({y:p.depth,draw:()=>{ctx.save();ctx.globalAlpha=root.BattleArt.opacity(p.fade,actors,time);if(wall.circle)curvedCurtain(ctx,p,map.wallHeight||32,wall);else curtain(ctx,p,map.wallHeight||48);ctx.restore()}});
 if(!wall.fortressProps){wall.fortressProps=(map.fortressCorners||wall.inner.filter((_,i)=>i%2===0).map(p=>[p.x,p.y])).map((p,i)=>({id:400+i,type:'tower',kind:'corner',x:p[0],y:p[1]+4,width:map.roundedFortress?64:90}));wall.fortressProps.push({id:410,type:'gate',kind:'gate',x:wall.gate.x,y:wall.gate.y+7,width:map.roundedFortress?112:146})}
 for(const o of wall.fortressProps){o.fade||={type:o.type,x:o.x,y:o.y,width:o.width,height:125};out.push({y:o.y,draw:()=>sprite(ctx,o,root.BattleArt.opacity(o.fade,actors,time))})}
 return out;
}
root.FortressArt={ready,layers,parts,range};
})(window);
