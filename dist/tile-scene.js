(function(root){'use strict';
const maps=root.TILE_MAPS,cache=new Map(),terrain=new Image(),props=new Image();
terrain.src='assets/paint-tiles-v48.webp';props.src='assets/paint-props-v48.webp';
const loaded=Promise.all([terrain.decode(),props.decode()]);
const kinds={pine:0,tree:1,bush:2,ore:3,rock:4,reeds:5,tower:6,gate:7};
const inside=(poly,p)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit}return hit};
const {riverY,riverX}=root.TerrainGeometry;
const states=new Map();
function state(map){if(!states.has(map.id))states.set(map.id,{removed:new Set(),refresh:[]});return states.get(map.id)}
function reset(map){if(!active(map))return;state(map).removed.clear();state(map).refresh.forEach(fn=>fn())}
function removeResource(map,id){if(map.legacyPainted)return root.LegacyResources.remove(map,id);state(map).removed.add(id);state(map).refresh.forEach(fn=>fn(id))}
function resourceZones(map,Meta){if(map.legacyPainted)return root.LegacyResources.zones(map,Meta);if(!active(map))return null;reset(map);return objects(map).filter(o=>o.resource).map(o=>{const kind=o.type==='ore'?'gold':'wood',r=root.TILE_PROP_LAYOUT[kinds[o.type]],scale=o.width/Math.max(r[2],r[3]),w=r[2]*scale,h=r[3]*scale;return {id:'resource-'+o.id,resourceUid:o.id,kind,name:kind==='gold'?'金矿':'林木',hint:kind==='gold'?'正在开采矿石':'正在砍伐木材',x:o.x-w/2,y:o.y-h,w,h,rate:Meta.gatherIntervals[kind==='gold'?'mine':'wood'],remaining:100}})}
function active(map){return !map.legacyPainted&&!!maps[map.id]}
function data(map){return maps[map.id]}
function objects(map){return data(map).layers.find(l=>l.name==='scenery').objects}
function ready(map){return map.legacyPainted?root.LegacyResources.ready:active(map)?loaded:Promise.resolve()}
function path(ctx,points,close=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(close)ctx.closePath()}
function curve(ctx,points){ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length-1;i++){const p=points[i],q=points[i+1];ctx.quadraticCurveTo(p.x,p.y,(p.x+q.x)/2,(p.y+q.y)/2)}ctx.lineTo(points.at(-1).x,points.at(-1).y)}
function texture(index,size){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),cw=Math.floor(terrain.naturalWidth/4),ch=Math.floor(terrain.naturalHeight/4);
 ctx.drawImage(terrain,index%4*cw,Math.floor(index/4)*ch,cw,ch,0,0,size,size);return canvas;
}
// Static washes are baked into the map once; animation only draws the sparse water strokes.
function wash(ctx,x,y,rx,ry,color){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,.05,0,0,1);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function distantHills(ctx,width){
 const ridges=[{base:178,height:215,color:'#709b9c',alpha:.39},{base:227,height:230,color:'#618b82',alpha:.32},{base:260,height:124,color:'#718779',alpha:.24}];
 for(let layer=0;layer<ridges.length;layer++){
  const ridge=ridges[layer];ctx.save();ctx.globalAlpha=ridge.alpha;ctx.beginPath();ctx.moveTo(-80,ridge.base);
  for(let i=0;i<13;i++){const x=i*width/11-90,peak=ridge.base-ridge.height*(.4+.6*Math.abs(Math.sin(i*1.71+layer)));ctx.bezierCurveTo(x-50,ridge.base-38,x-10,peak,x+28,peak+7);ctx.bezierCurveTo(x+73,peak+18,x+97,ridge.base-43,x+width/11,ridge.base-12)}
  ctx.lineTo(width+120,380);ctx.lineTo(-80,380);ctx.closePath();const g=ctx.createLinearGradient(0,20,0,350);g.addColorStop(0,ridge.color);g.addColorStop(.67,ridge.color+'bb');g.addColorStop(1,ridge.color+'00');ctx.fillStyle=g;ctx.fill();ctx.restore();
 }
 for(let i=0;i<8;i++)wash(ctx,i*440-60,230+Math.sin(i)*38,360,36,'#f2efdf80');
}
function inkRock(ctx,x,y,w,h,seed){
 const vertices=[[-.54,0],[-.44,-.39],[-.29,-.48],[-.17,-.91],[.09,-1],[.33,-.69],[.38,-.35],[.55,-.13],[.39,.05]];
 ctx.save();ctx.translate(x,y);wash(ctx,3,1,w*.7,10,'#637a6a30');ctx.beginPath();vertices.forEach(([a,b],i)=>{const px=a*w,py=b*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath();const g=ctx.createLinearGradient(-w*.3,-h,w*.4,0);g.addColorStop(0,'#cad2bd');g.addColorStop(.45,'#a4b8a5');g.addColorStop(1,'#7f9b8c');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#627c7061';ctx.lineWidth=1.2;ctx.stroke();
 ctx.strokeStyle='#6a847766';ctx.lineWidth=.9;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo((-w*.2+i*w*.1),-h*(.4+i%2*.2));ctx.lineTo((-w*.25+i*w*.13),-h*.18);ctx.lineTo((-w*.2+i*w*.12),-2);ctx.stroke()}
 for(let i=0;i<17;i++){const a=Math.sin(seed+i*7.3)*w*.38,b=-Math.abs(Math.cos(seed+i*2.7))*h*.45;ctx.fillStyle=i%2?'#5d80672e':'#d8d9be52';ctx.beginPath();ctx.ellipse(a,b,3+i%3,1.5,0,0,Math.PI*2);ctx.fill()}ctx.restore();
}
function waterShape(ctx,width,height){
 const bank=[];for(let x=0;x<=width;x+=12)bank.push({x,y:riverY(x)});bank.push({x:width,y:height},{x:0,y:height});path(ctx,bank,true);
 const west=[];for(let y=0;y<=height;y+=12)west.push({x:riverX(y),y});west.push({x:0,y:height},{x:0,y:0});
 // One union mask avoids an overlap seam where the two river arms meet.
 west.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
}
function shoreStroke(ctx,width,height){
 ctx.beginPath();ctx.moveTo(0,riverY(0));for(let x=12;x<=width;x+=12)ctx.lineTo(x,riverY(x));
 ctx.moveTo(riverX(0),0);for(let y=12;y<=height;y+=12)ctx.lineTo(riverX(y),y);
}
function riverPainting(ctx,width,height,water){
 // Wet grass and silt dissolve into the bank rather than outlining it.
 ctx.save();shoreStroke(ctx,width,height);ctx.filter='blur(13px)';ctx.lineWidth=64;ctx.strokeStyle='#8d9d7c49';ctx.stroke();ctx.lineWidth=32;ctx.strokeStyle='#d7d1ab8c';ctx.stroke();ctx.restore();
 ctx.save();waterShape(ctx,width,height);ctx.clip();ctx.fillStyle=water;ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#afc5b0';ctx.globalAlpha=.6;ctx.fillRect(0,0,width,height);ctx.globalAlpha=1;
 const depth=ctx.createLinearGradient(0,1380,0,height);depth.addColorStop(0,'#d9dfc077');depth.addColorStop(.5,'#89b1a333');depth.addColorStop(1,'#587f7c55');ctx.fillStyle=depth;ctx.fillRect(0,0,width,height);
 shoreStroke(ctx,width,height);ctx.filter='blur(11px)';ctx.lineWidth=44;ctx.strokeStyle='#d2d6b975';ctx.stroke();ctx.lineWidth=17;ctx.strokeStyle='#d9d2aa65';ctx.stroke();ctx.filter='none';
 for(let i=0;i<29;i++){const x=100+i*107,y=riverY(x)+37+(i%4)*28;wash(ctx,x,y,105+i%3*35,17,'#d4e2ca2e')}
 ctx.restore();
 for(const [x,w,h] of [[340,95,51],[1155,78,48],[2185,104,69],[2860,143,91]])inkRock(ctx,x,riverY(x)+35,w,h,x/37);
 for(const [y,w,h] of [[390,83,74],[835,91,65],[1210,72,56]])inkRock(ctx,riverX(y)-17,y,w,h,y/29);
 // Broken dry-brush marks and small reed tufts, never a continuous green contour.
 ctx.save();ctx.lineCap='round';
 for(let i=0;i<58;i++){const x=105+i*51,y=riverY(x),seed=Math.sin(i*2.399);ctx.strokeStyle=i%3?'#6f837a35':'#b1ba9d61';ctx.lineWidth=.8+i%3*.25;ctx.beginPath();ctx.moveTo(x,y+7+seed*3);ctx.quadraticCurveTo(x+9,y+10+seed*3,x+19,y+7+seed*3);ctx.stroke();
  if(i%5===1){for(let j=0;j<3;j++){ctx.strokeStyle='#7a8b6659';ctx.beginPath();ctx.moveTo(x+j*3,y-4);ctx.quadraticCurveTo(x+j*3-2,y-11,x+j*4-4,y-16-j*2);ctx.stroke()}}
 }
 ctx.restore();
}
function backdrop(map){
 if(cache.has(map.id))return cache.get(map.id);
 const doc=data(map),canvas=document.createElement('canvas');canvas.width=map.worldWidth||1280;canvas.height=map.worldHeight||720;const worldWidth=canvas.width,worldHeight=canvas.height;
 const ctx=canvas.getContext('2d'),source=doc.layers.find(l=>l.name==='terrain');ctx.imageSmoothingQuality='high';
 const grass=ctx.createPattern(texture(0,512),'repeat'),dirt=ctx.createPattern(texture(4,384),'repeat'),stone=ctx.createPattern(texture(8,160),'repeat'),water=ctx.createPattern(texture(12,384),'repeat');
 ctx.fillStyle=grass;ctx.fillRect(0,0,worldWidth,worldHeight);
 ctx.fillStyle='#e6e4cc';ctx.globalAlpha=.48;ctx.fillRect(0,0,worldWidth,worldHeight);ctx.globalAlpha=1;
 for(let i=0;i<63;i++){const px=180+(i*397)%worldWidth,py=240+(i*233)%1230;wash(ctx,px,py,130+i%4*37,61+i%3*22,i%3?'#7b9f8220':'#eee6cb38')}
 distantHills(ctx,worldWidth);
 // Broad washes around groves leave the fighting ground quiet and free of a stamped grid.
 for(const o of objects(map).filter(o=>['tree','pine'].includes(o.type))){
  ctx.save();ctx.translate(o.x,o.y-8);ctx.beginPath();
  for(let i=0;i<12;i++){const angle=i/12*Math.PI*2,r=46+Math.sin(i*2.3+o.id)*9;const px=Math.cos(angle)*r*1.25,py=Math.sin(angle)*r*.7;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();
  const wash=ctx.createRadialGradient(0,0,3,0,0,65);wash.addColorStop(0,'#7fa77955');wash.addColorStop(1,'#9fbf8100');ctx.fillStyle=wash;ctx.fill();ctx.restore();
 }
 const roads=doc.layers.find(l=>l.name==='roads').objects,roadCanvas=document.createElement('canvas');roadCanvas.width=worldWidth;roadCanvas.height=worldHeight;const roadCtx=roadCanvas.getContext('2d');
 for(const road of roads){const width=road.properties.find(p=>p.name==='width').value;
  roadCtx.clearRect(0,0,worldWidth,worldHeight);roadCtx.save();roadCtx.lineCap='round';roadCtx.lineJoin='round';roadCtx.strokeStyle='#d9d2af';roadCtx.lineWidth=width+18;roadCtx.globalAlpha=.22;curve(roadCtx,road.polyline);roadCtx.stroke();roadCtx.lineWidth=width+7;roadCtx.globalAlpha=.4;roadCtx.stroke();
  roadCtx.strokeStyle=dirt;roadCtx.lineWidth=width;roadCtx.globalAlpha=1;curve(roadCtx,road.polyline);roadCtx.stroke();
  const end=road.polyline.at(-1),previous=road.polyline.at(-2),dx=end.x-previous.x,dy=end.y-previous.y,length=Math.hypot(dx,dy)||1,fade=Math.min(120,length),mask=roadCtx.createLinearGradient(end.x-dx/length*fade,end.y-dy/length*fade,end.x,end.y);mask.addColorStop(0,'#000f');mask.addColorStop(1,'#0000');roadCtx.globalCompositeOperation='destination-in';roadCtx.fillStyle=mask;roadCtx.fillRect(0,0,worldWidth,worldHeight);roadCtx.restore();ctx.drawImage(roadCanvas,0,0);
 }
 const court=map.courtyard.map(([x,y])=>({x,y}));path(ctx,court,true);ctx.fillStyle=dirt;ctx.fill();
 ctx.save();path(ctx,court,true);ctx.clip();const center=court.reduce((p,q)=>({x:p.x+q.x/court.length,y:p.y+q.y/court.length}),{x:0,y:0});
 ctx.lineWidth=32;ctx.strokeStyle=stone;ctx.lineCap='round';path(ctx,[{x:map.gate[0],y:map.gate[1]},center]);ctx.stroke();
 for(const [px,py] of map.plots){ctx.globalAlpha=.72;ctx.fillStyle=stone;ctx.beginPath();ctx.ellipse(px,py+8,55,28,.28,0,Math.PI*2);ctx.fill()}ctx.restore();
 // River contours and the collision layer are authored from the same river functions.
 riverPainting(ctx,worldWidth,worldHeight,water);
 // Fine paper fibres and scattered earth marks tie the empty ground to the painted props.
 ctx.save();ctx.lineWidth=.7;for(let i=0;i<3100;i++){const px=(i*349.73)%worldWidth,py=(i*191.17)%worldHeight;ctx.strokeStyle=i%3?'#647b6820':'#fcf3dc38';ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+2+i%4,py+Math.sin(i)*1.3);ctx.stroke()}ctx.restore();
 const shade=ctx.createLinearGradient(0,0,0,worldHeight);shade.addColorStop(0,'#50756516');shade.addColorStop(.25,'#213c3500');shade.addColorStop(.8,'#213c3500');shade.addColorStop(1,'#50756510');ctx.fillStyle=shade;ctx.fillRect(0,0,worldWidth,worldHeight);
 cache.set(map.id,canvas);return canvas;
}
function drawProp(ctx,object,time,actors=[]){
 if(object.type==='gate'||object.type==='tower'){root.BattleArt.sprite(ctx,object.type==='gate'?6:7,object.x,object.y,object.width,root.BattleArt.opacity(object,actors,time));return}
 const rect=root.TILE_PROP_LAYOUT[kinds[object.type]],size=object.width,scale=size/Math.max(rect[2],rect[3]),w=rect[2]*scale,h=rect[3]*scale;
 const plant=['tree','pine','reeds','bush'].includes(object.type),sway=plant?Math.sin(time*1.4+object.id)*.012:0;
 ctx.save();ctx.translate(object.x,object.y);ctx.fillStyle='#253c32';ctx.globalAlpha=.12;ctx.beginPath();ctx.ellipse(3,1,w*.31,Math.max(3,w*.07),0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=root.BattleArt.opacity(object,actors,time);ctx.rotate(sway);ctx.drawImage(props,...rect,-w/2,-h,w,h);ctx.restore();
}
function resourceAt(map,point){
 if(map.legacyPainted)return root.LegacyResources.at(map,point);
 if(!active(map))return null;
 return objects(map).filter(o=>o.resource&&!state(map).removed.has(o.id)).sort((a,b)=>b.y-a.y).find(o=>{
  const rect=root.TILE_PROP_LAYOUT[kinds[o.type]],scale=o.width/Math.max(rect[2],rect[3]);
  return Math.abs(point.x-o.x)<rect[2]*scale*.46&&point.y<=o.y+4&&point.y>=o.y-rect[3]*scale*.94;
 })?.id??null;
}
function layers(ctx,map,wall,time,actors=[]){
 const scenery=objects(map).filter(o=>!state(map).removed.has(o.id)).map(o=>({y:o.y,draw:()=>drawProp(ctx,o,time,actors)}));
 return scenery.concat(root.FortressArt.layers(ctx,map,wall,time,actors));
}
function effects(ctx,map,time){
 ctx.save();ctx.strokeStyle='#e2e9d3';ctx.lineWidth=.8;ctx.globalAlpha=.25;
 for(let i=0;i<48;i++){const x=(i*83+time*19)%(map.worldWidth||1280),y=riverY(x)+16+(i%4)*18;ctx.beginPath();ctx.ellipse(x,y,8+i%3*4,1.4,0,.1,Math.PI);ctx.stroke()}
 for(let i=0;i<13;i++){const y=(i*71+time*13)%(map.worldHeight||720);ctx.beginPath();ctx.ellipse(riverX(y)*.45,y,6,1.5,0,0,Math.PI);ctx.stroke()}
 ctx.restore();
}
function navigation(base,map){
 if(!active(map)&&!map.legacyPainted)return base;
 const legacy=map.legacyPainted,doc=legacy?null:data(map),obstacles=legacy?root.LegacyResources.objects(map):objects(map).filter(o=>o.radius>0),navigationState=legacy?root.LegacyResources.state(map):state(map);
 function ground(p){
  if(p.x<8||p.x>(map.worldWidth||1280)-8||p.y<8||p.y>(map.worldHeight||720)-10)return false;
  if(legacy?!root.LegacyResources.ground(map,p,base):root.TerrainGeometry.water(p.x,p.y))return false;
  return !obstacles.some(o=>!navigationState.removed.has(o.id)&&Math.hypot(p.x-o.x,(p.y-o.y)*1.3)<o.radius+3);
 }
 const walkable=p=>base.walkable(p)&&ground(p);
 function clear(a,b){if(!base.clear(a,b))return false;const length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(length/7));for(let i=1;i<=steps;i++)if(!ground({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps}))return false;return true}
 const size=legacy?28:16,cols=Math.ceil((map.worldWidth||1280)/size),rows=Math.ceil((map.worldHeight||720)/size),points=Array.from({length:cols*rows},(_,i)=>({x:i%cols*size+size/2,y:Math.floor(i/cols)*size+size/2})),valid=points.map(walkable),links=new Map();
 navigationState.refresh.push(id=>{const o=obstacles.find(o=>o.id===id);if(!o)points.forEach((p,i)=>valid[i]=walkable(p));else{const r=o.radius+4;for(let y=Math.max(0,Math.floor((o.y-r)/size));y<=Math.min(rows-1,Math.ceil((o.y+r)/size));y++)for(let x=Math.max(0,Math.floor((o.x-r)/size));x<=Math.min(cols-1,Math.ceil((o.x+r)/size));x++){const i=y*cols+x;valid[i]=walkable(points[i])}}links.clear()});
 function neighbours(id){if(links.has(id))return links.get(id);const out=[],col=id%cols,row=Math.floor(id/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=col+dx,y=row+dy,next=y*cols+x;if(x>=0&&x<cols&&y>=0&&y<rows&&valid[next]&&clear(points[id],points[next]))out.push([next,Math.hypot(dx,dy)*size])}links.set(id,out);return out}
 function nearby(p){const col=Math.floor(p.x/size),row=Math.floor(p.y/size),out=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=col+dx,y=row+dy,id=y*cols+x;if(x>=0&&x<cols&&y>=0&&y<rows&&valid[id]&&clear(p,points[id]))out.push(id)}return out.sort((a,b)=>Math.hypot(points[a].x-p.x,points[a].y-p.y)-Math.hypot(points[b].x-p.x,points[b].y-p.y)).slice(0,5)}
 function route(start,end){
  if(!walkable(end))return [];if(clear(start,end))return [end];
  const simple=base.route(start,end);if(simple.length&&simple.every((p,i)=>clear(i?simple[i-1]:start,p)))return simple;
  const starts=nearby(start),ends=new Set(nearby(end));if(!starts.length||!ends.size)return [];
  const costs=new Float64Array(points.length).fill(Infinity),prev=new Int32Array(points.length).fill(-1),open=new Set(starts),closed=new Set();
  for(const id of starts)costs[id]=Math.hypot(points[id].x-start.x,points[id].y-start.y);
  let finish=-1;
  while(open.size){let current=-1,best=Infinity;for(const id of open){const p=points[id],score=costs[id]+Math.hypot(p.x-end.x,p.y-end.y);if(score<best){best=score;current=id}}if(ends.has(current)){finish=current;break}open.delete(current);closed.add(current);for(const [next,length] of neighbours(current)){const cost=costs[current]+length;if(!closed.has(next)&&cost<costs[next]){costs[next]=cost;prev[next]=current;open.add(next)}}}
  if(finish<0)return [];const out=[end];for(let id=finish;id>=0;id=prev[id])out.unshift(points[id]);
  const smooth=[];let from=start;for(let i=0;i<out.length;i++){while(i+1<out.length&&clear(from,out[i+1]))i++;smooth.push(out[i]);from=out[i]}return smooth;
 }
 function waypoint(entity,target){if(clear(entity,target)){entity.terrainRoute=null;return target}let state=entity.terrainRoute;if(!state||Math.hypot(state.goal.x-target.x,state.goal.y-target.y)>20||!state.path.length||!clear(entity,state.path[0]))state=entity.terrainRoute={goal:{x:target.x,y:target.y},path:route(entity,target)};while(state.path.length>1&&Math.hypot(state.path[0].x-entity.x,state.path[0].y-entity.y)<3&&clear(entity,state.path[1]))state.path.shift();return state.path[0]||null}
 function advance(entity,to,max){if(!to)return 0;const distance=Math.hypot(to.x-entity.x,to.y-entity.y),length=Math.min(distance,max);if(length<1e-6)return 0;const next={x:entity.x+(to.x-entity.x)*length/distance,y:entity.y+(to.y-entity.y)*length/distance};if(!walkable(next)||!clear(entity,next))return 0;const dx=next.x-entity.x;entity.x=next.x;entity.y=next.y;if(Math.abs(dx)>.03)entity.face=dx>0?1:-1;return length}
 return {...base,ground,walkable,clear,route,waypoint,advance};
}
root.TileScenes={active,ready,backdrop,layers,effects,navigation,resourceAt,resourceZones,removeResource};
})(window);
