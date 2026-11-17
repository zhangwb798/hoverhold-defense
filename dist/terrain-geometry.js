(function(root){'use strict';
 const riverY=x=>(610+Math.sin(x/2.4/155)*17+Math.cos(x/2.4/290)*10)*2.4+Math.sin(x/173+.7)*22+Math.sin(x/79)*7;
 const riverX=y=>(37+Math.sin(y/2.4/92)*18)*2.4+Math.sin(y/113)*14+Math.sin(y/47)*4;
 const water=(x,y)=>y>riverY(x)||x<riverX(y);
 root.TerrainGeometry={riverY,riverX,water};
})(typeof window!=='undefined'?window:globalThis);
