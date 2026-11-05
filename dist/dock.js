(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function snapOpen(shift,range){return range<=0||shift<range*.5}
class CommandDrawer{
 constructor(panel,handle,contents){this.panel=panel;this.handle=handle;this.contents=contents;this.open=true;this.drag=null;this.shift=0;this.ignoreClickUntil=0;try{this.open=localStorage.getItem('hoverhold-command-dock')!=='closed'}catch{}
  handle.addEventListener('pointerdown',e=>{if(e.button>0)return;e.stopPropagation();this.refresh();this.drag={pointer:e.pointerId,startY:e.clientY,startShift:this.shift,moved:false};panel.classList.add('dragging');panel.classList.remove('is-collapsed');contents.inert=false;contents.setAttribute('aria-hidden','false');handle.setPointerCapture?.(e.pointerId)});
  handle.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;e.stopPropagation();const dy=e.clientY-this.drag.startY;this.drag.moved||=Math.abs(dy)>4;this.shift=clamp(this.drag.startShift+dy,0,this.range);this.paint()});
  handle.addEventListener('pointerup',e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;e.stopPropagation();const moved=this.drag.moved;this.drag=null;panel.classList.remove('dragging');if(moved){this.ignoreClickUntil=performance.now()+400;this.setOpen(snapOpen(this.shift,this.range))}else this.refresh();handle.releasePointerCapture?.(e.pointerId)});
  handle.addEventListener('pointercancel',()=>{this.drag=null;panel.classList.remove('dragging');this.refresh()});
  handle.addEventListener('click',e=>{e.stopPropagation();if(performance.now()<this.ignoreClickUntil)return;this.setOpen(!this.open)});
  if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>{if(!this.drag)this.refresh()});this.observer.observe(panel)}window.addEventListener('resize',()=>this.refresh());this.refresh();
 }
 paint(){this.panel.style.setProperty('--dock-shift',Math.round(this.shift)+'px')}
 refresh(){const height=this.panel.getBoundingClientRect().height,peek=Math.max(28,this.handle.getBoundingClientRect().height+9);this.range=Math.max(0,height-peek);if(!this.drag)this.shift=this.open?0:this.range;this.panel.classList.toggle('is-collapsed',!this.open&&!this.drag);this.handle.setAttribute('aria-expanded',String(this.open));this.contents.setAttribute('aria-hidden',String(!this.open));this.contents.inert=!this.open;const label=this.handle.querySelector('.dock-label');if(label)label.textContent=this.open?'点将台 · 下拉收起':'点将台 · 上拉展开';this.paint()}
 setOpen(open){this.open=!!open;this.refresh();try{localStorage.setItem('hoverhold-command-dock',this.open?'open':'closed')}catch{}}
}
root.CommandDrawer=CommandDrawer;root.DrawerRules={clamp,snapOpen};
})(window);
