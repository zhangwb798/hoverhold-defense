(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
class BattleView{
 constructor(canvas){
  this.canvas=canvas;this.x=0;this.y=0;this.zoom=1;this.defaultZoom=1;this.overview=false;this.width=1280;this.height=720;this.keys=new Set();this.drag=null;
  document.querySelector('#stage').insertAdjacentHTML('beforeend','<aside class="battle-overview" id="battleOverview" hidden><div class="overview-tools"><button id="zoomOut" type="button" aria-label="拉远视角">−</button><button id="overviewToggle" type="button" title="切换全地图与局部视野">全视图 <span>125%</span></button><button id="zoomIn" type="button" aria-label="拉近视角">＋</button></div><canvas id="overviewMap" width="240" height="135" aria-label="点击或拖动小地图移动视野"></canvas><small>滚轮缩放 · WASD / 拖动移图</small></aside>');
  this.panel=document.querySelector('#battleOverview');this.mini=document.querySelector('#overviewMap');this.mini.width=240;this.mini.height=135;this.button=document.querySelector('#overviewToggle');
  this.button.onclick=()=>this.toggle();
  document.querySelector('#zoomIn').onclick=()=>{if(this.overview)this.toggle();this.setZoom(this.zoom+.15)};document.querySelector('#zoomOut').onclick=()=>{if(this.overview)this.toggle();this.setZoom(this.zoom-.15)};
  canvas.addEventListener('wheel',e=>{if(!this.enabled)return;e.preventDefault();if(this.overview)this.toggle();const r=canvas.getBoundingClientRect();this.setZoom(this.zoom+(e.deltaY<0?.1:-.1),(e.clientX-r.left)/r.width*1280,(e.clientY-r.top)/r.height*720)},{passive:false});
  const move=e=>{if(!this.miniDrag&&e.type!=='pointerdown')return;const r=this.mini.getBoundingClientRect();if(this.overview){this.zoom=this.localView?.zoom||this.defaultZoom;this.overview=false}this.center((e.clientX-r.left)/r.width*this.width,(e.clientY-r.top)/r.height*this.height)};
  this.mini.addEventListener('pointerdown',e=>{this.miniDrag=true;this.mini.setPointerCapture?.(e.pointerId);move(e)});this.mini.addEventListener('pointermove',move);this.mini.addEventListener('pointerup',()=>this.miniDrag=false);this.mini.addEventListener('pointercancel',()=>this.miniDrag=false);
  root.addEventListener('keydown',e=>{if(!this.enabled||e.ctrlKey||e.altKey||e.metaKey||document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(key)){this.keys.add(key);e.preventDefault()}});
  root.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));root.addEventListener('blur',()=>{this.keys.clear();this.drag=null});
 }
 reset(map){this.map=map;this.width=map.worldWidth||1280;this.height=map.worldHeight||720;this.defaultZoom=map.defaultZoom||(map.worldWidth?1.25:1);this.zoom=this.defaultZoom;this.overview=false;this.localView=null;this.keys.clear();this.center(map.gate[0]+(map.worldWidth?155:280),map.gate[1]-160)}
 center(x,y){this.x=x-640/this.zoom;this.y=y-360/this.zoom;this.limit()}
 limit(){this.x=clamp(this.x,0,Math.max(0,this.width-1280/this.zoom));this.y=clamp(this.y,0,Math.max(0,this.height-720/this.zoom))}
 toggle(){if(!this.overview){this.localView={x:this.x,y:this.y,zoom:this.zoom};this.zoom=Math.min(1280/this.width,720/this.height);this.overview=true;this.center(this.width/2,this.height/2)}else{this.zoom=this.localView?.zoom||this.defaultZoom;this.x=this.localView?.x||0;this.y=this.localView?.y||0;this.overview=false;this.limit()}}
 setZoom(value,sx=640,sy=360){if(this.overview)this.toggle();const anchor=this.world(sx,sy);this.zoom=clamp(value,Math.max(.85,Math.min(1280/this.width,720/this.height)),1.65);this.x=anchor.x-sx/this.zoom;this.y=anchor.y-sy/this.zoom;this.limit()}
 world(x,y){return {x:this.x+x/this.zoom,y:this.y+y/this.zoom}}
 screen(x,y){return {x:(x-this.x)*this.zoom,y:(y-this.y)*this.zoom}}
 beginDrag(e){if(!this.enabled||![1,2].includes(e.button))return false;this.drag={x:e.clientX,y:e.clientY,worldX:this.x,worldY:this.y};this.canvas.setPointerCapture?.(e.pointerId);return true}
 dragMove(e){if(!this.drag)return false;const r=this.canvas.getBoundingClientRect();this.x=this.drag.worldX-(e.clientX-this.drag.x)*1280/r.width/this.zoom;this.y=this.drag.worldY-(e.clientY-this.drag.y)*720/r.height/this.zoom;this.limit();return true}
 update(dt,enabled){this.enabled=enabled;this.panel.hidden=!enabled;if(!enabled){this.keys.clear();return}let dx=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),dy=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);if(dx||dy){const size=Math.hypot(dx,dy);this.x+=dx/size*420*dt/this.zoom;this.y+=dy/size*420*dt/this.zoom;this.limit()}}
 apply(ctx){ctx.scale(this.zoom,this.zoom);ctx.translate(-this.x,-this.y)}
 render(background,units,enemies,zones){
  if(!this.enabled)return;const ctx=this.mini.getContext('2d'),sx=this.mini.width/this.width,sy=this.mini.height/this.height;
  ctx.clearRect(0,0,this.mini.width,this.mini.height);if(background)ctx.drawImage(background,0,0,this.mini.width,this.mini.height);else{ctx.fillStyle='#728b62';ctx.fillRect(0,0,this.mini.width,this.mini.height)}
  const dots=(array,color,radius)=>{ctx.fillStyle=color;for(const p of array){ctx.beginPath();ctx.arc(p.x*sx,p.y*sy,radius,0,Math.PI*2);ctx.fill()}};
  dots(zones.filter(z=>z.remaining>0).map(z=>({x:z.x+z.w/2,y:z.y+z.h/2})), '#e6c77e',1.3);dots(units.filter(u=>u.hp>0),'#d8f3cd',1.8);dots(enemies.filter(u=>u.hp>0),'#c75745',2);
  const x=this.x*sx,y=this.y*sy,w=1280/this.zoom*sx,h=720/this.zoom*sy;
  ctx.fillStyle='#142b2633';ctx.fillRect(0,0,240,y);ctx.fillRect(0,y+h,240,135-y-h);ctx.fillRect(0,y,x,h);ctx.fillRect(x+w,y,240-x-w,h);
  ctx.strokeStyle='#fff1be';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,Math.min(w-2,238),Math.min(h-2,133));
  this.button.setAttribute('aria-pressed',String(this.overview));this.button.querySelector('span').textContent=Math.round(this.zoom*100)+'%';
 }
}
root.BattleView=BattleView;
})(window);
