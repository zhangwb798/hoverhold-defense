window.GAME_MAPS = [
 {id:'mountain',name:'云山营地',tag:'青山作伴 · 临溪筑营',description:'云海、溪流与青瓦营地',image:'assets/qinglu-battlefield-v13.webp',color:'#477c6f',particle:'#e7d48e',water:'#e4fff0'},
 {id:'island',name:'碧海孤岛',tag:'听潮枕浪 · 守望碧海',description:'白沙海岸与椰林港湾',image:'assets/map-island-v14.webp',color:'#268e9c',particle:'#fff1bb',water:'#e9ffff'},
 {id:'forest',name:'森罗幽谷',tag:'古木参天 · 萤火引路',description:'古树、苔石与幽深林谷',image:'assets/map-forest-v14.webp',color:'#466b42',particle:'#c7ee8c',water:'#c4f9de'},
 {id:'volcano',name:'赤焰火山',tag:'熔岩流火 · 镇守赤岭',description:'玄武岩、熔岩与灰烬',image:'assets/map-volcano-v14.webp',color:'#a85d40',particle:'#ffb15b',water:'#ffb265'},
 {id:'desert',name:'流沙绿洲',tag:'驼铃随风 · 绿洲为家',description:'金色沙丘与丝路绿洲',image:'assets/map-desert-v14.webp',color:'#ac813b',particle:'#f5d59e',water:'#d8fff0'}
];
const layouts={
 mountain:{plots:[[183,375],[323,375],[183,445],[323,445]],gate:[420,455],spawns:[[515,157],[1070,180],[1120,390]],mines:[[390,95],[1175,135],[1220,310]],trees:[[278,215],[683,500],[1030,275],[1195,470]],location:'西南临溪'},
 island:{plots:[[1085,345],[970,345],[1085,420],[970,420]],gate:[847,408],spawns:[[760,165],[210,180],[160,390]],mines:[[870,85],[125,130],[70,295]],trees:[[1000,200],[590,480],[280,265],[90,460]],location:'东南海港',flip:true},
 forest:{plots:[[240,202],[355,202],[240,269],[355,269]],gate:[486,265],spawns:[[1000,190],[1020,490],[550,580]],mines:[[704,110],[1178,137],[1229,310]],trees:[[192,468],[691,490],[1024,274],[1203,482]],location:'西北林谷'},
 volcano:{plots:[[978,203],[1105,203],[978,272],[1105,272]],gate:[816,282],spawns:[[400,160],[300,410],[850,515]],mines:[[384,114],[150,250],[154,468]],trees:[[282,216],[691,490],[576,166],[1062,490]],location:'东北赤岭'},
 desert:{plots:[[601,441],[735,441],[601,507],[735,507]],gate:[673,369],spawns:[[500,180],[900,200],[300,300]],mines:[[384,114],[1178,165],[1229,310]],trees:[[282,216],[294,445],[1024,274],[1203,482]],location:'南境绿洲'}
};
window.GAME_MAPS.forEach(m=>Object.assign(m,layouts[m.id]));
