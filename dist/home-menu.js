(function(root){'use strict';
 const $=q=>document.querySelector(q),stage=$('#stage'),home=$('#startCard'),picker=$('.map-picker');
 if(!home||!picker)return;
 const positions={mountain:[19,35],forest:[47,31],frost:[79,30],volcano:[81,57],desert:[79,86],island:[21,86],mist:[48,73]};
 const board=$('.title-board'),levels=$('.level-panel'),actions=$('.start-actions'),status=$('#mapStatus'),wallet=$('.meta-wallet');
 const atlas=document.createElement('dialog');atlas.id='mapAtlas';atlas.className='world-atlas';atlas.setAttribute('aria-labelledby','atlasTitle');
 atlas.innerHTML='<header class="atlas-head"><div class="atlas-heading-art" aria-hidden="true">山</div><div><small>悬城守卫 · 七方山河</small><h2 id="atlasTitle">山河图卷</h2></div><p>循山河而行，守一方安宁</p><button id="closeAtlas" class="atlas-close" type="button" aria-label="关闭地图选择">×</button></header><div class="atlas-layout"><div class="atlas-visual"><p class="atlas-hint">点击地标 · 选择战场</p></div><section class="atlas-detail" aria-label="关卡与出战"><p class="atlas-detail-eyebrow">此 行 之 地</p><div class="atlas-region"></div><div class="atlas-status" role="status"></div></section></div>';
 document.body.append(atlas);
 const options=picker.querySelector('.map-options');options.className='atlas-landmarks';
 for(const button of options.querySelectorAll('[data-map]')){
  const [x,y]=positions[button.dataset.map];button.className='atlas-place';button.style.setProperty('--landmark-x',x+'%');button.style.setProperty('--landmark-y',y+'%');
  button.setAttribute('aria-label',button.querySelector('strong').textContent);button.querySelector('.map-index')?.setAttribute('aria-hidden','true');
 }
 picker.querySelector('.map-heading').remove();picker.className='map-picker atlas-map';
 $('.atlas-visual').append(picker);$('.atlas-region').append(board);$('.atlas-detail').append(levels,actions);$('.atlas-status').append(status);
 home.classList.add('cover-home');home.replaceChildren();
 home.insertAdjacentHTML('beforeend','<img class="home-illustration" src="assets/home-cover-v56.webp" alt="悬城守卫：赤巾主角与伙伴守护青绿山河中的城池" fetchpriority="high" decoding="async"><div class="home-shade" aria-hidden="true"></div><h1 class="home-mobile-title">悬城守卫</h1><div class="home-menu"><p class="home-eyebrow">一 方 山 河 · 等 你 来 守</p><nav class="home-navigation" aria-label="起始界面"><button id="homeMapBtn" type="button" aria-haspopup="dialog" aria-controls="mapAtlas"><span class="home-map-art" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M8 13q4-4 10-1l29 2q9-6 10 3v33q-3 6-10 2l-30-2q-8 5-9-2Z" fill="#e8cf94" stroke="#6e775b" stroke-width="2"/><path d="m17 43 11-24 9 15 6-9 8 21-34-3" fill="#7e9b77" stroke="#537767" stroke-width="1.7"/><path d="m28 19 4 14-8-2m-8 13q12-5 23 3" fill="none" stroke="#dce2bc" stroke-width="2"/><path d="m12 12 2 38m36-36 2 37" stroke="#b88c52" stroke-width="3"/></svg></span><span><strong>地图选择</strong><small>展开山河 · 挑战关卡</small></span><i aria-hidden="true">›</i></button><button id="homeSettingsBtn" type="button" aria-haspopup="dialog" aria-controls="battleSettings"><span class="home-settings-art" aria-hidden="true">⚙</span><span><strong>设置</strong><small>音乐音效 · 画面震感</small></span><i aria-hidden="true">›</i></button></nav><div class="home-wallet"></div><p class="home-current" id="homeCurrent"></p></div><div class="home-footnote"><span>山河征途</span><span>2D 国风手绘守城</span></div>');
 const nav=$('.home-navigation'),settingsButton=$('#homeSettingsBtn');
 for(const [id,subtitle] of [['walletShopBtn','局外升级 · 衣冠行装'],['walletAchievementsBtn','征途留名 · 领取奖励']]){
  const button=$('#'+id),label=button.querySelector('small');button.classList.add('home-picture-button');label.innerHTML='<strong>'+label.textContent+'</strong><small>'+subtitle+'</small>';button.insertAdjacentHTML('beforeend','<i aria-hidden="true">›</i>');nav.insertBefore(button,settingsButton);
 }
 $('.home-wallet').append(wallet);
 $('#homeSettingsBtn').onclick=()=>$('#settingsBtn').click();
 const open=()=>{if(stage.classList.contains('playing'))return;atlas.showModal();const selected=picker.querySelector('[aria-pressed="true"]');(selected||$('#closeAtlas')).focus({preventScroll:true})};
 const close=()=>{if(atlas.open)atlas.close()};
 $('#homeMapBtn').onclick=open;$('#closeAtlas').onclick=close;
 atlas.addEventListener('click',event=>{if(event.target!==atlas)return;const r=atlas.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()});
 atlas.addEventListener('close',()=>{if(!home.classList.contains('hidden'))$('#homeMapBtn').focus({preventScroll:true})});
 // These buttons retain the original game handlers and selected-stage validation.
 for(const id of ['startBtn','endlessBtn'])$('#'+id).addEventListener('click',()=>{if(stage.classList.contains('playing'))close()});
 const syncHome=()=>{const visible=!home.classList.contains('hidden');document.body.classList.toggle('home-visible',visible);if(!visible)close();$('#homeCurrent').textContent='当前行程 · '+$('#chapterBadge').textContent};
 new MutationObserver(syncHome).observe(home,{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncHome).observe($('#chapterBadge'),{childList:true,subtree:true,characterData:true});syncHome();
 root.HomeScreen={open,close};
})(window);
