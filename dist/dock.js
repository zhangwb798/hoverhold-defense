(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function snapOpen(shift,range){return range<=0||shift<range*.5}
function hoverContains(rect,p,open){const margin=open?14:22;return !!p&&p.x>=rect.left-18&&p.x<=rect.right+18&&p.y>=rect.top-margin&&p.y<=rect.bottom+14}
class CommandDrawer{
 constructor(panel,handle,contents){
  this.panel=panel;this.handle=handle;this.contents=contents;this.drag=null;this.shift=0;this.ignoreClickUntil=0;this.pointer=null;this.leaveTimer=null;this.keyboardMode=false;
  this.hoverEnabled=typeof matchMedia==='undefined'||matchMedia('(hover: hover) and (pointer: fine)').matches;this.open=!this.hoverEnabled;
  if(!this.hoverEnabled)try{this.open=localStorage.getItem('hoverhold-command-dock')!=='closed'}catch{}
  handle.title=this.hoverEnabled?'鼠标靠近自动展开，移开自动收起':'上下拖动收放，也可点击切换';
  handle.addEventListener('pointerdown',e=>{if(e.button>0)return;e.stopPropagation();this.clearLeave();this.refresh();this.drag={pointer:e.pointerId,startY:e.clientY,startShift:this.shift,moved:false};panel.classList.add('dragging');panel.classList.remove('is-collapsed');contents.inert=false;contents.setAttribute('aria-hidden','false');handle.setPointerCapture?.(e.pointerId)});
  handle.addEventListener('pointermove',e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;e.stopPropagation();const dy=e.clientY-this.drag.startY;this.drag.moved||=Math.abs(dy)>4;this.shift=clamp(this.drag.startShift+dy,0,this.range);this.paint()});
  handle.addEventListener('pointerup',e=>{if(!this.drag||e.pointerId!==this.drag.pointer)return;e.stopPropagation();const moved=this.drag.moved;this.drag=null;panel.classList.remove('dragging');if(moved){this.ignoreClickUntil=performance.now()+400;this.setOpen(snapOpen(this.shift,this.range))}else this.refresh();handle.releasePointerCapture?.(e.pointerId)});
  handle.addEventListener('pointercancel',()=>{this.drag=null;panel.classList.remove('dragging');this.refresh()});
  handle.addEventListener('click',e=>{e.stopPropagation();if(performance.now()<this.ignoreClickUntil)return;if(this.hoverEnabled&&e.detail>0){this.setOpen(true,{automatic:true});return}this.setOpen(!this.open)});
  panel.addEventListener('pointerenter',e=>this.hover(e));
  panel.addEventListener('pointerleave',e=>{if(!this.hoverEnabled||e.pointerType==='touch')return;this.pointer={x:e.clientX,y:e.clientY};this.scheduleClose()});
  panel.addEventListener('focusin',()=>{if(this.keyboardMode){this.clearLeave();this.setOpen(true,{automatic:true})}});
  panel.addEventListener('focusout',()=>{if(this.hoverEnabled)setTimeout(()=>{if(!panel.contains(document.activeElement))this.scheduleClose()},0)});
  window.addEventListener('keydown',e=>{if(e.key==='Tab')this.keyboardMode=true});
  window.addEventListener('pointermove',e=>this.hover(e));window.addEventListener('pointerup',e=>this.hover(e));
  window.addEventListener('pointerout',e=>{if(this.hoverEnabled&&e.relatedTarget===null){this.pointer=null;this.scheduleClose()}});
  window.addEventListener('blur',()=>{if(this.hoverEnabled&&!this.drag){this.pointer=null;this.keyboardMode=false;this.clearLeave();this.setOpen(false,{automatic:true})}});
  if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>{if(!this.drag)this.refresh()});this.observer.observe(panel)}window.addEventListener('resize',()=>this.refresh());this.refresh();
 }
 clearLeave(){if(this.leaveTimer!==null){clearTimeout(this.leaveTimer);this.leaveTimer=null}}
 hover(e){
  if(!this.hoverEnabled||e.pointerType==='touch'||e.pointerType==='pen'||this.drag)return;
  if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;this.pointer={x:e.clientX,y:e.clientY};this.keyboardMode=false;
  if(e.buttons)return;const rect=this.panel.getBoundingClientRect();if(rect.height<=0)return;
  if(hoverContains(this.hoverRect(),this.pointer,this.open)){this.clearLeave();if(!this.open)this.setOpen(true,{automatic:true})}else this.scheduleClose();
 }
 hoverRect(){const rect=this.panel.getBoundingClientRect();if(this.open)return rect;const stage=this.panel.closest?.('.stage')?.getBoundingClientRect(),bottom=stage?.bottom??rect.top+Math.max(28,this.handle.getBoundingClientRect().height+9);return {left:rect.left,right:rect.right,top:bottom-Math.max(28,this.handle.getBoundingClientRect().height+9),bottom}}
 scheduleClose(){
  if(!this.hoverEnabled||!this.open||this.drag||this.leaveTimer!==null)return;
  this.leaveTimer=setTimeout(()=>{this.leaveTimer=null;if(this.drag||this.keyboardMode&&this.panel.contains(document.activeElement))return;if(!hoverContains(this.panel.getBoundingClientRect(),this.pointer,true))this.setOpen(false,{automatic:true})},280);
 }
 paint(){this.panel.style.setProperty('--dock-shift',Math.round(this.shift)+'px')}
 refresh(){
  const height=this.panel.getBoundingClientRect().height,peek=Math.max(28,this.handle.getBoundingClientRect().height+9);if(height<=0&&this.hoverEnabled){this.open=false;this.clearLeave()}this.range=Math.max(0,height-peek);if(!this.drag)this.shift=this.open?0:this.range;
  this.panel.classList.toggle('is-collapsed',!this.open&&!this.drag);this.handle.setAttribute('aria-expanded',String(this.open));this.contents.setAttribute('aria-hidden',String(!this.open));this.contents.inert=!this.open;
  const label=this.handle.querySelector('.dock-label');if(label)label.textContent=this.hoverEnabled?this.open?'点将台 · 移开自动收起':'点将台 · 鼠标靠近展开':this.open?'点将台 · 下拉收起':'点将台 · 上拉展开';this.paint();
 }
 setOpen(open,{automatic=false}={}){this.clearLeave();this.open=!!open;this.refresh();if(!automatic)try{localStorage.setItem('hoverhold-command-dock',this.open?'open':'closed')}catch{}}
}
root.CommandDrawer=CommandDrawer;root.DrawerRules={clamp,snapOpen,hoverContains};
})(window);
