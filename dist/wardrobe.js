(function(root){'use strict';
const key='hoverhold-wardrobe-v1',mounts={
 pony:{name:'听溪青骢',tag:'青缎轻鞍 · 云山行旅',description:'灰蓝毛色与奶白鬃毛，青缎鞍毯配一枚溪石玉扣。轻快的游历伙伴。',row:0},
 goat:{name:'石铃山羊',tag:'岩角铜铃 · 山径访客',description:'短卷岩角、赭色绒毛，步伐稳当。靛蓝行囊和杏色流苏随步伐轻摆。',row:1},
 badger:{name:'苔团灵獾',tag:'叶耳木铃 · 林间伙伴',description:'圆滚的黑白灵獾，背着苔绿小鞍，耳尖像两片新叶。四只短爪也能走得神气。',row:2},
 crane:{name:'折云纸鸢',tag:'青瓷折羽 · 御风奇物',description:'以青瓷色纸羽折成的灵鸢。羽翼舒展、靛尾浮动，载着行者掠过山间。',row:3}
};
const heroRows={vanguard:0,warden:1,outrider:2},heroLooks={vanguard:'赤巾巡边',warden:'青萝采芳',outrider:'霜羽望川'};
function read(raw){let value;try{value=JSON.parse(raw)}catch{}return {mount:Object.hasOwn(mounts,value?.mount)?value.mount:'pony'}}
function choose(state,id){return Object.hasOwn(mounts,id)?{mount:id}:{...state}}
const art={heroes:new Image(),mounts:new Image()},pending=[];for(const id of Object.keys(art)){art[id].src='assets/wardrobe-'+id+'-v50.webp';pending.push(art[id].decode())}const ready=Promise.all(pending);
function rect(kind,row,frame){return root.WARDROBE_LAYOUT?.[kind]?.[row*4+frame]}
function blit(ctx,kind,row,frame,cx,baseline,size){const image=art[kind],r=rect(kind,row,frame),m=root.WARDROBE_LAYOUT?.metrics?.[kind]?.[row];if(!r||!m||!image.complete||!image.naturalWidth)return false;const scale=size/m.extent;ctx.drawImage(image,...r,cx+(r[0]-(frame+.5)*m.cellWidth)*scale,baseline+(r[1]-m.baseline)*scale,r[2]*scale,r[3]*scale);return true}
function draw(ctx,{x,y,face=1,moving=false,attack=0,attackSpan=.6,hit=0,phase=0},kit,look,time,size=68){
 if(!art.heroes.complete||!art.mounts.complete||!root.WARDROBE_LAYOUT||!art.heroes.naturalWidth||!art.mounts.naturalWidth)return false;
 const mount=mounts[look?.mount]||mounts.pony,cycle=time*7+phase,frame=moving?Math.floor(cycle)%4:mount.row===3?Math.floor(time*3)%4:0,riderFrame=attack>0?Math.min(3,2+Math.floor((1-attack/(attackSpan||.6))*2)):moving?Math.floor(cycle)%2:0;
 const lift=mount.row===3?Math.sin(time*3+phase)*1.8: moving?Math.sin(cycle*Math.PI)*.7:Math.sin(time*2+phase)*.3;
 ctx.save();ctx.fillStyle='#344c42';ctx.globalAlpha=.18;ctx.beginPath();ctx.ellipse(x,y+7,size*.32,size*.075,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=hit>0?.7:1;ctx.translate(x,y+7+lift*size/68);ctx.scale(face,1);
 blit(ctx,'mounts',mount.row,frame,0,0,size);
 const row=heroRows[kit.id]??0,riderSize=size*.72,saddleY=-size*.17,riderX=-size*.085;
 if(kit.dye){ctx.save();ctx.strokeStyle=kit.dye;ctx.lineWidth=size*.065;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(riderX,-size*.5);ctx.quadraticCurveTo(-size*.35,-size*.53,-size*.43,-size*.35+Math.sin(time*5)*size*.045);ctx.stroke();ctx.restore()}
 blit(ctx,'heroes',row,riderFrame,riderX,saddleY,riderSize);ctx.restore();return true;
}
function icon(kind,row,frame=0){const image=art[kind],r=rect(kind,row,frame);if(!r||!image.naturalWidth)return '';const canvas=document.createElement('canvas');canvas.width=canvas.height=144;const ctx=canvas.getContext('2d');blit(ctx,kind,row,frame,72,132,120);return canvas.toDataURL('image/png')}
const gearOrder=['blade','spear','coat','mantle','knot','banner','seal'];
function gearIcon(id){const r=root.WARDROBE_LAYOUT?.icons?.[gearOrder.indexOf(id)];if(!r)return '';const c=document.createElement('canvas');c.width=c.height=120;const ctx=c.getContext('2d'),image=root.WardrobeArt.icons;if(!image?.naturalWidth)return '';const scale=96/Math.max(r[2],r[3]);ctx.drawImage(image,...r,60-r[2]*scale/2,60-r[3]*scale/2,r[2]*scale,r[3]*scale);return c.toDataURL('image/png')}
class WardrobeUI{
 constructor(ctx){this.ctx=ctx;this.state=read(this.getStored());this.tab='mounts';this.selected=this.state.mount;this.mode='walk';this.serial=0;this.iconCache={};this.gearCache={};
  document.body.insertAdjacentHTML('beforeend','<dialog id="wardrobePanel" class="wardrobe-panel" aria-labelledby="wardrobeTitle"><header class="scroll-head"><button id="wardrobeBack" class="wardrobe-back" type="button" aria-label="返回整军备战" title="返回整军备战" hidden>‹</button><div><small>悬城守卫 · 山河行装</small><h2 id="wardrobeTitle">衣冠行装</h2></div><button class="ink-close" id="wardrobeClose" type="button" aria-label="关闭装扮">×</button></header><nav class="wardrobe-tabs" aria-label="装扮分类"><button type="button" data-wardrobe-tab="heroes" aria-selected="false">角色</button><button type="button" data-wardrobe-tab="mounts" aria-selected="true">坐骑</button><button type="button" data-wardrobe-tab="gear" aria-selected="false">行装</button></nav><div class="wardrobe-layout"><section class="wardrobe-scene"><div class="wardrobe-view"><canvas id="wardrobePreview" width="640" height="500" aria-label="人物与坐骑动态预览"></canvas><span class="wardrobe-nameplate" id="wardrobeNameplate"></span><span class="wardrobe-preview-mark">山 河 同 行</span></div><div class="wardrobe-pose" aria-label="预览动作"><button type="button" data-pose="idle">站姿</button><button type="button" data-pose="walk" aria-pressed="true">行走</button><button type="button" data-pose="attack">出招</button></div><div class="wardrobe-current" id="wardrobeCurrent"></div></section><section class="wardrobe-inventory"><div class="wardrobe-detail" id="wardrobeDetail" aria-live="polite"></div><div class="wardrobe-list-head"><h3 id="wardrobeListTitle">山河坐骑</h3><span id="wardrobeCount"></span></div><div class="wardrobe-collection" id="wardrobeCollection"></div><p class="wardrobe-message" id="wardrobeMessage" role="status"></p></section></div><footer class="wardrobe-footer"><span>坐骑装扮仅改变外观 · 出战时固定本局行装</span><button type="button" id="wardrobeReset">恢复默认坐骑</button></footer></dialog>');
  this.panel=document.querySelector('#wardrobePanel');this.panel.querySelector('#wardrobeBack').onclick=()=>{const callback=this.onReturn;this.onReturn=null;this.panel.close();callback?.()};this.panel.querySelector('#wardrobeClose').onclick=()=>this.panel.close();this.panel.querySelector('#wardrobeReset').onclick=()=>{this.state=read(null);this.selected='pony';this.tab='mounts';this.persist();this.render();this.message('已恢复听溪青骢')};
  this.panel.onclick=e=>{if(e.target===this.panel){const r=this.panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.panel.close();return}const button=e.target.closest('button');if(!button||button.disabled)return;const d=button.dataset;if(d.wardrobeTab){this.tab=d.wardrobeTab;this.selected=this.tab==='heroes'?ctx.frontier().hero:this.tab==='gear'?'blade':this.state.mount;this.render()}else if(d.wardrobePick){this.selected=d.wardrobePick;this.render()}else if(d.pose){this.mode=d.pose;this.renderPose()}else if(d.wardrobeApply)this.apply()};
  this.panel.addEventListener('close',()=>{this.serial++});
 }
 getStored(){try{return localStorage.getItem(key)}catch{return null}}
 snapshot(){return {...this.state}}
 persist(){try{localStorage.setItem(key,JSON.stringify(this.state));return true}catch{this.message('浏览器暂时无法保存；本次会话仍可使用。');return false}}
 message(text){this.panel.querySelector('#wardrobeMessage').textContent=text}
 async open(options={}){if(!this.ctx.allowed())return false;this.onReturn=typeof options.onReturn==='function'?options.onReturn:null;this.panel.querySelector('#wardrobeBack').hidden=!this.onReturn;this.tab='mounts';this.selected=this.state.mount;this.panel.showModal();this.message('正在绘制行装…');try{await ready;await root.WardrobeArt.icons.decode();if(!this.panel.open)return false;this.render();this.message('已开放全部四种坐骑，点击卡片可预览。');this.animate(++this.serial);return true}catch{this.message('装扮素材加载失败，请关闭后重试。');return false}}
 thumb(kind,id){const cache=kind==='gear'?this.gearCache:this.iconCache,key=kind+id;if(!cache[key])cache[key]=kind==='gear'?gearIcon(id):icon(kind==='heroes'?'heroes':'mounts',kind==='heroes'?heroRows[id]:mounts[id].row);return cache[key]}
 apply(){if(!this.ctx.allowed())return;let result;
  if(this.tab==='mounts'){this.state=choose(this.state,this.selected);const saved=this.persist();result={ok:true,message:'已使用 '+mounts[this.selected].name+(saved?'':' · 浏览器未能保存，仅本次会话生效')}}
  else if(this.tab==='heroes')result=this.ctx.hero(this.selected);
  else result=this.ctx.gear(this.selected);
  this.render();this.message(result?.ok?result.message:result?.reason||'未能保存，请重试');
 }
 renderPose(){this.panel.querySelectorAll('[data-pose]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===this.mode)))}
 render(){const F=root.Frontier,save=this.ctx.frontier(),progress=this.ctx.progress(),kit=F.kit(save,progress),sel=this.selected;this.panel.querySelectorAll('[data-wardrobe-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.wardrobeTab===this.tab)));this.renderPose();
  const list=this.tab==='heroes'?F.heroes:this.tab==='gear'?F.equipment:mounts;const item=list[sel];let title,tag,desc,button,disabled=false,equipped=false;
  if(this.tab==='heroes'){title=item.name;tag=heroLooks[sel]+' · '+item.title;desc=item.skill+'：'+item.description+'。生命 '+item.hp+'，攻击 '+item.damage+'。';equipped=save.hero===sel;const unlocked=F.unlocked(item,progress);disabled=!unlocked||equipped;button=equipped?'已出战':unlocked?'选为出战角色':'通关 '+(item.unlock===2?'1-3':'2-3')+' 解锁'}
  else if(this.tab==='gear'){title=item.name;tag=F.slots[item.slot]+(item.rare?' · 稀有行装':' · 行旅所藏');desc=item.description;const owned=save.owned.includes(sel);equipped=save.gear[item.slot]===sel;disabled=!owned&&(item.rare||this.ctx.coins()<item.price);button=equipped?'卸下':owned?'装备':item.rare?'对局掉落':item.price+' 金币 · 购买并装备'}
  else{title=item.name;tag=item.tag;desc=item.description;equipped=this.state.mount===sel;button=equipped?'已使用':'使用此坐骑';disabled=equipped}
  this.panel.querySelector('#wardrobeDetail').innerHTML='<span class="wardrobe-eyebrow">'+(this.tab==='gear'?'行装图鉴':this.tab==='heroes'?'出战角色':'山河坐骑')+'</span><h3>'+title+'</h3><p class="wardrobe-tag">'+tag+'</p><p>'+desc+'</p><button type="button" class="wardrobe-apply" data-wardrobe-apply="true" '+(disabled?'disabled':'')+'>'+button+'</button>';
  this.panel.querySelector('#wardrobeListTitle').textContent=this.tab==='heroes'?'结伴行者':this.tab==='gear'?'行装藏品':'山河坐骑';
  this.panel.querySelector('#wardrobeCount').textContent=this.tab==='gear'?'金币 '+this.ctx.coins():Object.keys(list).length+' 款';
  this.panel.querySelector('.wardrobe-collection').innerHTML=Object.entries(list).map(([id,item])=>{const active=this.tab==='gear'?save.gear[item.slot]===id:this.tab==='heroes'?save.hero===id:this.state.mount===id,locked=this.tab==='gear'?!save.owned.includes(id):this.tab==='heroes'?!F.unlocked(item,progress):false;return '<button type="button" data-wardrobe-pick="'+id+'" aria-pressed="'+(id===sel)+'" aria-label="预览'+item.name+'" class="wardrobe-card '+(active?'equipped':'')+'"><span class="wardrobe-portrait"><img src="'+this.thumb(this.tab,id)+'" alt="" width="120" height="120"></span><b>'+item.name+'</b><small>'+(active?'已使用':locked?this.tab==='gear'?'未获得':'待解锁':'可使用')+'</small></button>'}).join('');
  const previewHero=this.tab==='heroes'?sel:kit.id,previewMount=this.tab==='mounts'?sel:this.state.mount;this.panel.querySelector('#wardrobeNameplate').textContent=mounts[previewMount].name;this.panel.querySelector('#wardrobeCurrent').innerHTML='<b>'+F.heroes[previewHero].name+'</b><span>'+heroLooks[previewHero]+' · '+mounts[previewMount].name+'</span><small>当前行装：'+Object.values(save.gear).filter(Boolean).map(id=>F.equipment[id].name).join('、')+'<span>'+(!Object.values(save.gear).some(Boolean)?'轻装启程':'')+'</span></small>';this.preview={kit:this.tab==='heroes'?{...F.heroes[sel],id:sel}:kit,look:{mount:previewMount}};
 }
 animate(serial){if(!this.panel.open||serial!==this.serial)return;const canvas=this.panel.querySelector('#wardrobePreview'),ctx=canvas.getContext('2d'),time=performance.now()/1000;ctx.clearRect(0,0,canvas.width,canvas.height);if(this.preview){const attack=this.mode==='attack'?.8-(time%1.8):0;draw(ctx,{x:340,y:418,face:1,moving:this.mode==='walk',attack:Math.max(0,attack),attackSpan:.8,phase:0},this.preview.kit,this.preview.look,time,305)}requestAnimationFrame(()=>this.animate(serial))}
}
const icons=new Image();icons.src='assets/wardrobe-icons-v50.webp';
root.WardrobeRules={key,mounts,heroRows,heroLooks,read,choose};root.WardrobeArt={ready,draw,icons};root.WardrobeUI=WardrobeUI;
})(window);
