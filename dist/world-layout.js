(function(root){'use strict';
const authored={
 mountain:{width:1671,center:[398,522],radii:[77,40],plots:[[373,508],[420,508],[374,535],[423,535]],gate:[441,569],spawns:[[690,215],[1490,290],[1180,650]],land:[[230,170],[650,120],[1020,140],[1430,140],[1550,260],[1560,670],[1450,745],[1180,790],[850,800],[600,740],[480,680],[225,600],[180,480],[240,320]],blocks:[[915,328,150,72],[740,666,130,85],[1415,615,145,85],[1310,320,130,80]],water:[[[110,360],[130,550],[270,755],[600,830],[1100,830],[1450,780]]]},
 island:{center:[1275,474],radii:[99,47],plots:[[1244,455],[1307,456],[1246,486],[1310,487]],gate:[1210,539],spawns:[[350,230],[400,650],[1000,180]],land:[[230,160],[540,100],[1100,110],[1480,180],[1540,340],[1440,620],[1200,770],[820,805],[580,765],[230,690],[190,520],[230,350]],blocks:[[780,312,130,75],[850,583,130,70],[470,478,100,70],[1260,243,115,65],[1470,680,95,85]],water:[[[180,860],[620,885],[1050,875],[1460,850]],[[70,260],[80,440],[120,580]]]},
 forest:{center:[442,298],radii:[80,40],plots:[[415,282],[466,282],[415,310],[467,310]],gate:[490,354],spawns:[[790,190],[1420,460],[1000,730]],land:[[260,150],[650,115],[1150,115],[1490,200],[1490,550],[1370,720],[1150,790],[700,795],[310,735],[230,570],[270,350]],blocks:[[1045,240,120,70],[875,390,120,70],[625,580,130,90],[1230,568,120,75],[535,120,130,70]],water:[[[120,380],[145,600],[300,800],[750,855],[1260,860]]]},
 volcano:{center:[1290,292],radii:[104,50],plots:[[1258,275],[1323,275],[1257,306],[1325,306]],gate:[1229,358],spawns:[[550,270],[360,650],[1010,740]],land:[[220,180],[590,145],[1040,135],[1470,160],[1520,330],[1470,620],[1300,780],[820,810],[400,760],[200,600],[210,350]],blocks:[[620,420,130,70],[1050,545,120,75],[740,720,110,65],[360,215,90,60]],water:[[[45,330],[70,600],[250,830],[700,910],[1250,915]]]},
 desert:{center:[841,615],radii:[94,47],plots:[[812,600],[873,600],[812,632],[875,632]],gate:[924,568],spawns:[[550,240],[1310,300],[300,540]],land:[[240,200],[680,150],[1190,140],[1480,210],[1510,520],[1350,750],[1000,825],[650,820],[300,730],[225,570],[245,350]],blocks:[[780,245,135,75],[1170,430,130,80],[515,455,80,60],[1290,690,120,80]],water:[[[65,500],[110,630],[270,730],[490,790]]]},
 frost:{center:[418,310],radii:[92,44],plots:[[385,294],[449,290],[386,326],[452,322]],gate:[472,375],spawns:[[850,280],[1410,510],[800,690]],land:[[255,205],[670,180],[1110,180],[1500,220],[1500,570],[1330,730],[1100,790],[720,790],[340,720],[265,510]],blocks:[[945,450,140,70],[575,620,130,70],[1030,220,110,70],[1440,640,110,80]],water:[[[125,370],[165,580],[360,790],[900,855],[1420,830]]]},
 mist:{center:[1128,524],radii:[108,52],plots:[[1099,505],[1165,508],[1095,540],[1165,544]],gate:[1050,588],spawns:[[450,270],[630,500],[1350,280]],land:[[240,230],[690,180],[1140,220],[1490,250],[1500,490],[1400,630],[1240,720],[900,745],[520,680],[300,600],[220,430]],blocks:[[725,350,125,70],[1325,410,100,75],[700,700,140,65],[405,620,105,65]],water:[[[130,490],[200,650],[650,825],[1100,820],[1440,730]]]}
};
function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
for(const map of root.GAME_MAPS){
 const a=authored[map.id],sx=3840/(a.width||1672),sy=2160/941,point=p=>[p[0]*sx,p[1]*sy];
 Object.assign(map,{image:'assets/world-'+map.id+'-v58.webp',worldWidth:3840,worldHeight:2160,defaultZoom:.9,cityScale:.72,gateWidth:43,wallThickness:22,legacyPainted:true,fullPainted:true,flip:false,artLayout:a,artPoint:point,artSource:([x,y])=>[x/sx,y/sy],frame:([x,y])=>[x*3,y*3],unframe:([x,y])=>[x/3,y/3]});
 map.courtyard=Array.from({length:40},(_,i)=>point([a.center[0]+Math.cos(i/40*Math.PI*2)*a.radii[0],a.center[1]+Math.sin(i/40*Math.PI*2)*a.radii[1]]));
 map.plots=a.plots.map(point);map.gate=point(a.gate);map.spawns=a.spawns.map(point);map.gateRoof=[[-21,-34],[21,-34],[26,-7],[-26,-7]].map(([dx,dy])=>point([a.gate[0]+dx,a.gate[1]+dy]));
 map.land=a.land.map(point);map.terrainBlocks=a.blocks.map(([x,y,rx,ry])=>({x:x*sx,y:y*sy,rx:rx*sx,ry:ry*sy}));
 map.isGround=p=>inside(map.land,p.x,p.y)&&!map.terrainBlocks.some(b=>Math.hypot((p.x-b.x)/b.rx,(p.y-b.y)/b.ry)<1);
 map.airEntry=point(a.spawns[0]);map.bridge=null;map.lava=null;map.hazard=null;
 if(map.id==='volcano'){const [x,y]=point([800,880]),[dx,dy]=point([850,785]);map.lava={x,y,detour:{x:dx,y:dy}}}
 if(map.id==='frost'||map.id==='mist'){const [x,y]=point(map.id==='frost'?[890,540]:[820,600]);map.hazard={x,y}}
}
function effects(ctx,map,time){
 const paths=map.artLayout.water;ctx.save();ctx.globalAlpha=.23;ctx.strokeStyle=map.id==='volcano'?'#ffe1a5':'#d7f2e4';ctx.lineWidth=1;
 for(let i=0;i<42;i++){const pts=paths[i%paths.length],phase=(i*.137+time*.022)%1,at=phase*(pts.length-1),j=Math.floor(at),t=at-j,a=pts[j],b=pts[Math.min(j+1,pts.length-1)],[x,y]=map.artPoint([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+(i%3-1)*5]);ctx.beginPath();ctx.ellipse(x,y,7+i%4*3,1.7,0,.1,Math.PI);ctx.stroke()}ctx.restore();
}
root.PaintedWorld={authored,inside,effects};
})(window);
