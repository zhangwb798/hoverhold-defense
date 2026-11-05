(function(root){'use strict';
const $=q=>document.querySelector(q),M=root.MetaRules;
class MetaUI{
 constructor(ctx){this.ctx=ctx;this.tab='cursor';
  $('#stage').insertAdjacentHTML('beforeend','<div class="meta-wallet"><span>局外金币 <b id="campaignCoins">0</b></span><button id="walletShopBtn">整军备战</button></div><section class="workshop-overlay hidden" id="upgradePanel" role="dialog" aria-modal="true" aria-label="局外升级"><header class="workshop-head"><div><h2>整军备战</h2><p>积累战后金币，磨炼六艺，固守山河</p></div><span class="workshop-coins">金币 <b id="shopCoins">0</b></span><button id="closeShopBtn" aria-label="关闭升级">×</button></header><nav class="workshop-tabs" aria-label="升级类别">'+[['cursor','光标六艺'],['wall','城防'],['troop','兵种'],['machine','采集机关'],['reserve','开局储备']].map(([id,name])=>'<button data-shop-tab="'+id+'" aria-selected="'+(id==='cursor')+'">'+name+'</button>').join('')+'</nav><div class="upgrade-cards" id="upgradeCards"></div><p class="workshop-note" id="upgradeNote"></p></section>');
  $('.start-actions').insertAdjacentHTML('beforeend','<button id="workshopBtn" class="secondary">整军备战</button>');
  $('#endCard .result-actions').insertAdjacentHTML('beforeend','<button id="resultWorkshopBtn">整军备战</button>');
  for(const id of ['#walletShopBtn','#workshopBtn','#resultWorkshopBtn'])$(id).onclick=()=>this.open();$('#closeShopBtn').onclick=()=>this.close();
  $('.workshop-tabs').onclick=e=>{const b=e.target.closest('[data-shop-tab]');if(b){this.tab=b.dataset.shopTab;this.render()}};
  $('#upgradeCards').onclick=e=>{const b=e.target.closest('[data-upgrade]');if(!b||b.disabled)return;const r=ctx.purchase(b.dataset.upgrade);this.render();this.note(r.ok?'升级完成 · 下一局生效':r.reason,!r.ok)};
  this.wallet();
 }
 wallet(){$('#campaignCoins').textContent=this.ctx.profile().coins;$('#shopCoins').textContent=this.ctx.profile().coins}
 note(message,error=false){$('#upgradeNote').textContent=message;$('#upgradeNote').classList.toggle('error',error)}
 open(tab){if(!this.ctx.allowed())return false;if(tab)this.tab=tab;$('#upgradePanel').classList.remove('hidden');this.render();return true}
 close(){$('#upgradePanel').classList.add('hidden')}
 description(id,levels){const level=levels[id],n=Math.min(M.MAX_LEVEL,level+1),next={...levels,[id]:n},pct=v=>Math.round(v*100)+'%';
  if(id==='wall')return '城墙生命 '+M.wallHp(levels)+' → '+M.wallHp(next)+' · 3级解锁弓箭塔，6级解锁炮塔';
  if(id==='prep'){const stage=this.ctx.stage();return '首波前 '+M.preparationTime(stage,levels)+(level<M.MAX_LEVEL?' → '+M.preparationTime(stage,next):'')+' 秒 · 波间时间不变';}
  if(id==='mine'||id==='wood'){const label=id==='mine'?'矿石':'木材';return '悬停每秒约 '+M.gatherPerSecond(levels,id).toFixed(1)+(level<M.MAX_LEVEL?' → '+M.gatherPerSecond(next,id).toFixed(1):'')+' '+label;}
  if(id==='startGold'||id==='startWood'){const stage=this.ctx.stage(),resource=id==='startGold'?'gold':'wood',label=id==='startGold'?'矿石':'木材',current=M.startingStock(stage,levels)[resource],after=M.startingStock(stage,next)[resource];return '每局开场 '+current+(level<M.MAX_LEVEL?' → '+after:'')+' '+label;}
  if(id==='attack')return '光标伤害 '+M.attackDamage(levels).toFixed(1)+' → '+M.attackDamage(next).toFixed(1)+'，同时缩短攻击间隔';
  if(['footman','archer','spearman','mage'].includes(id)){const a=M.unitBonus(levels,id),b=M.unitBonus(next,id);return '生命 '+pct(a.hp)+' → '+pct(b.hp)+' · 攻击 '+pct(a.damage)+' → '+pct(b.damage)+'（同类将领也获得加成）'}
  if(id.endsWith('Machine'))return '每台自动产出 '+M.machineRate(levels,id).toFixed(2)+' → '+M.machineRate(next,id).toFixed(2)+' / 秒 · 局内消耗矿石木材制作';
  return (id==='heal'?'持续治疗效率':'工作效率')+' ×'+M.rate(levels,id).toFixed(2)+' → ×'+M.rate(next,id).toFixed(2);
 }
 render(){const p=this.ctx.profile(),u=M.unlocks(this.ctx.progress(),p.levels);this.wallet();$('#upgradePanel').dataset.tab=this.tab;document.querySelectorAll('[data-shop-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.shopTab===this.tab)));
  let html=M.definitions.filter(d=>d.category===this.tab).map(d=>{const level=p.levels[d.id],price=M.cost(d.id,level),locked=d.category==='machine'&&!u.machines,disabled=locked||price==null||p.coins<price;return '<article class="upgrade-card '+(locked?'locked':'')+'"><header><span class="upgrade-seal">'+d.seal+'</span><div><h3>'+d.name+'</h3><small>Lv.'+level+(level<M.MAX_LEVEL?' → Lv.'+(level+1):' · 满级')+'</small></div></header><p>'+this.description(d.id,p.levels)+'</p><button data-upgrade="'+d.id+'" '+(disabled?'disabled':'')+'>'+(locked?'通过第二章解锁':price==null?'已达满级':'升级 · '+price+' 金币'+(p.coins<price?'（不足）':''))+'</button></article>'}).join('');
  if(this.tab==='wall')html+=[['弓箭塔',3,'arrowTower','射程远、射速快，自动迎击敌人'],['炮塔',6,'cannon','范围炮击，适合拦截成群敌军']].map(([name,level,id,detail])=>'<article class="upgrade-card info"><header><span class="upgrade-seal">'+(level===3?'弩':'炮')+'</span><div><h3>'+name+'</h3><small>'+(u[id]?'已解锁 · 下一局可营建':'城墙达到 Lv.'+level+' 解锁')+'</small></div></header><p>'+detail+'。在局内消耗矿石、木材建造，最多各两座。</p></article>').join('');
  $('#upgradeCards').innerHTML=html;this.note(this.ctx.warning()||'金币在胜负结算时获得 · 升级在开局时固定，本局不会随击杀变化',!!this.ctx.warning());
 }
}
root.MetaUI=MetaUI;
})(window);
