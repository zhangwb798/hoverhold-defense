window.GAME_MAPS = [
 {id:'mountain',name:'云山营地',tag:'青山作伴 · 临溪筑营',description:'云海、溪流与青瓦营地',image:'assets/qinglu-battlefield-v13.webp',color:'#477c6f',particle:'#e7d48e',water:'#e4fff0'},
 {id:'island',name:'碧海孤岛',tag:'听潮枕浪 · 守望碧海',description:'白沙海岸与椰林港湾',image:'assets/map-island-v14.webp',color:'#268e9c',particle:'#fff1bb',water:'#e9ffff'},
 {id:'forest',name:'森罗幽谷',tag:'古木参天 · 萤火引路',description:'古树、苔石与幽深林谷',image:'assets/map-forest-v14.webp',color:'#466b42',particle:'#c7ee8c',water:'#c4f9de'},
 {id:'volcano',name:'赤焰火山',tag:'熔岩流火 · 镇守赤岭',description:'玄武岩、熔岩与灰烬',image:'assets/map-volcano-v14.webp',color:'#a85d40',particle:'#ffb15b',water:'#ffb265'},
 {id:'desert',name:'流沙绿洲',tag:'驼铃随风 · 绿洲为家',description:'金色沙丘与丝路绿洲',image:'assets/map-desert-v14.webp',color:'#ac813b',particle:'#f5d59e',water:'#d8fff0'}
];
const layouts={
 mountain:{plots:[[183,375],[323,375],[183,445],[323,445]],gate:[345,511],spawns:[[515,157],[1070,180],[1120,390]],mines:[[389,80,68,56],[1175,128,74,63],[1225,315,57,58]],trees:[[289,215,107,59],[686,500,96,77],[1030,277,113,83],[1202,459,85,73]],location:'西南临溪'},
 island:{plots:[[1085,345],[970,345],[1085,420],[970,420]],gate:[847,408],spawns:[[760,165],[210,180],[160,390]],mines:[[874,83,66,53],[128,131,78,57],[65,278,64,57]],trees:[[1000,185,86,48],[579,446,102,57],[283,236,94,62],[105,425,92,60]],location:'东南海港',flip:true},
 forest:{plots:[[240,202],[355,202],[240,269],[355,269]],gate:[486,265],spawns:[[1000,190],[1020,490],[550,580]],mines:[[724,111,73,47],[1151,149,70,56],[1217,306,66,50]],trees:[[191,469,94,64],[692,472,106,65],[1000,254,89,61],[1160,462,96,62]],location:'西北林谷'},
 volcano:{plots:[[978,203],[1105,203],[978,272],[1105,272]],gate:[816,282],spawns:[[400,160],[300,410],[850,515]],mines:[[383,114,73,56],[154,246,67,57],[152,451,75,64]],trees:[[285,232,74,55],[692,463,94,74],[578,173,76,49],[1076,464,85,63]],location:'东北赤岭'},
 desert:{plots:[[601,441],[735,441],[601,507],[735,507]],gate:[673,369],spawns:[[500,180],[900,200],[300,300]],mines:[[399,111,101,55],[1160,151,99,62],[1220,306,76,58]],trees:[[287,216,84,58],[292,431,96,63],[978,257,88,59],[1166,462,94,65]],location:'南境绿洲'}
};
// Ground inside each painted wall, in battle coordinates (including the island's mirror).
const courtyards={
 mountain:[[105,353],[150,324],[265,308],[366,322],[421,357],[432,409],[409,457],[365,483],[269,493],[153,480],[106,444],[89,395]],
 island:[[907,334],[958,303],[1045,296],[1120,309],[1157,341],[1160,399],[1134,445],[1081,475],[973,479],[915,452],[888,409],[888,365]],
 forest:[[150,181],[211,155],[325,154],[413,173],[448,218],[440,276],[394,312],[313,322],[204,314],[140,285],[124,225]],
 volcano:[[903,180],[954,155],[1098,151],[1173,169],[1215,207],[1214,264],[1160,305],[1090,324],[973,321],[897,287],[875,239]],
 desert:[[517,425],[578,399],[636,394],[707,395],[773,406],[822,432],[841,476],[821,517],[762,545],[689,554],[610,550],[541,533],[500,497],[492,457]]
};
// Bounds of the visible fortifications, including roofs and the gate approach.
// Island coordinates are in the mirrored battle view.
const cityBounds={
 mountain:[50,246,493,580],
 island:[828,201,1246,588],
 forest:[62,68,506,397],
 volcano:[803,44,1266,387],
 desert:[412,315,930,620]
};
const targetCityArea=.07;
// Trace the raised roof separately so the occluder never repaints the courtyard behind it.
const gateRoofs={
 mountain:[[278,490],[285,485],[296,484],[294,476],[301,469],[307,476],[376,464],[385,457],[392,456],[389,470],[395,477],[409,471],[416,468],[417,478],[411,488],[410,497],[379,508],[293,518],[281,508]]
};
// Scale from the original painting so the map's city framing cannot flatten resource props.
const resourceScale=.84;
// Share the extra ground across both sides without over-stretching a narrow map edge.
function battlefieldAxis(low,high,limit,scale){
 const released=(high-low)*(1-scale),maxStretch=.55;
 const minBefore=Math.max(0,released-(limit-high)*maxStretch),maxBefore=Math.min(released,low*maxStretch);
 const before=Math.min(maxBefore,Math.max(minBefore,released/2));
 const source=[0,low,high,limit],screen=[0,Math.round(low+before),Math.round(high+before-released),limit];
 const map=(value,from,to)=>{
  const i=value<from[1]?0:value<from[2]?1:2;
  return to[i]+(value-from[i])*(to[i+1]-to[i])/(from[i+1]-from[i]);
 };
 return {source,screen,forward:value=>map(value,source,screen),inverse:value=>map(value,screen,source)};
}
window.GAME_MAPS.forEach(m=>{
 const raw=layouts[m.id],court=courtyards[m.id],[left,top,right,bottom]=cityBounds[m.id];
 const cityScale=Math.min(.9,Math.sqrt(targetCityArea*1280*720/((right-left)*(bottom-top))));
 const horizontal=battlefieldAxis(left,right,1280,cityScale);
 const vertical=battlefieldAxis(top,bottom,720,cityScale);
 const frame=([x,y])=>[horizontal.forward(x),vertical.forward(y)];
 Object.assign(m,raw,{cityScale,frame,unframe:([x,y])=>[horizontal.inverse(x),vertical.inverse(y)],horizontal,vertical});
 for(const key of ['plots','spawns'])m[key]=raw[key].map(frame);
 for(const key of ['mines','trees'])m[key]=raw[key].map(([x,y,halfW,halfH])=>{
  const [cx,cy]=frame([x,y]),[left,top]=frame([x-halfW,y-halfH]),[right,bottom]=frame([x+halfW,y+halfH]);
  return {
   x,y,cx,cy,rx:halfW*resourceScale,ry:halfH*resourceScale,scale:resourceScale,
   blendX:Math.max(halfW,cx-left,right-cx)*1.55,
   blendY:Math.max(halfH,cy-top,bottom-cy)*1.55
  };
 });
 const marker=xy=>{const [x,y]=frame(xy);return {x,y}};
 if(m.id==='island'){m.bridge=marker([754,405]);m.airEntry=frame([85,595]);}
 if(m.id==='volcano')m.lava={...marker([690,320]),detour:marker([690,400])};
 m.gate=frame(raw.gate);m.courtyard=court.map(frame);
 m.gateRoof=gateRoofs[m.id]?.map(frame);
});
