(()=>{'use strict';
const c=document.querySelector('#game'),x=c.getContext('2d'),$=q=>document.querySelector(q),W=1280,H=720,motion=window.CharacterMotion;x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
document.title='悬城守卫';document.querySelector('.tools')?.remove();document.querySelector('.logo small').textContent='云 山 营 地';document.querySelector('.castle-life>span').textContent='营地安危';c.setAttribute('aria-label','青绿山水 2.5D 手绘守城战场');
document.querySelector('.resources').insertAdjacentHTML('beforeend',"<div class=\"hud-counter\" title=\"枪兵\" role=\"group\" aria-label=\"枪兵数量\"><i class=\"hud-avatar hud-avatar-spearman\" aria-hidden=\"true\"></i><small>枪兵</small><strong id=\"spearmen\">0</strong></div><div class=\"hud-counter\" title=\"法师\" role=\"group\" aria-label=\"法师数量\"><i class=\"hud-avatar hud-avatar-mage\" aria-hidden=\"true\"></i><small>法师</small><strong id=\"mages\">0</strong></div>");

const startCard=$('#startCard');startCard.classList.add('start-menu');startCard.innerHTML='<div class="title-board"><small>青 山 作 伴 · 临 溪 筑 营</small><h1>悬城守卫</h1><b>云 山 营 地</b><span class="title-flourish">一方山水，等你来守</span></div><div class="start-actions"><button id="startBtn">入山守城 <b>➜</b></button><button id="guideBtn" class="secondary" aria-haspopup="dialog" aria-controls="beginnerGuide">新手指导</button><button id="frontierBtn" class="secondary">行装与难度</button><button id="endlessBtn" class="secondary">无尽守城</button></div><p>山河征途与无尽守城</p>';
const ui={gold:$('#gold'),wood:$('#wood'),foot:$('#footmen'),arch:$('#archers'),spear:$('#spearmen'),mage:$('#mages'),hp:$('#hp'),hpBar:$('#hpBar'),wave:$('#wave'),waveClock:$('#waveClock'),waveClockLabel:$('#waveClockLabel'),enemies:$('#enemies'),tip:$('#hoverTip')};
const actorScale=.60,bossScale=.64,buildingScale=.74,actorRatio=actorScale/.72,bossRatio=bossScale/.77;
const factions=window.EnemyFactions;
const tileScenes=window.TileScenes,view=new window.BattleView(c);
const worldWidth=()=>activeMap.worldWidth||W,worldHeight=()=>activeMap.worldHeight||H;
const maps=window.GAME_MAPS,castleRoutes=Object.fromEntries(maps.map(m=>[m.id,tileScenes.navigation(window.CastleNav.create(m),m)]));let activeMap=maps[0],mapReady=false,mapRequest=0,bg=new Image(),framedBackdrop=null;
const campaign=window.CampaignRules,F=window.Frontier;
let frontier=readFrontier(),wardrobeUI;
function readFrontier(){try{return F.read(localStorage.getItem(F.key))}catch{return F.read(null)}}
function saveFrontier(){try{localStorage.setItem(F.key,JSON.stringify(frontier));return true}catch{return false}}
let progress,saveUnavailable=false;try{progress=campaign.read(localStorage.getItem(campaign.key))}catch{progress=campaign.read(null);saveUnavailable=true}let selectedLevel=campaign.resume(progress);
const Meta=window.MetaRules,Facility=window.FacilityRules,Achievements=window.AchievementRules,Skills=window.CombatSkills;let profile,profileSaveFailed=false,metaUI;try{const raw=localStorage.getItem(Meta.key);profile=Meta.read(raw,progress);if(raw==null)localStorage.setItem(Meta.key,JSON.stringify(profile))}catch{profile||=Meta.read(null,progress);profileSaveFailed=true}
function persistProfile(){try{localStorage.setItem(Meta.key,JSON.stringify(profile));profileSaveFailed=false}catch{profileSaveFailed=true}metaUI?.wallet()}
function purchaseUpgrade(id){const result=Meta.purchase(profile,id,progress,run);if(result.ok){profile=result.profile;persistProfile();if(!s?.over)reset();if(mapReady)renderCampaign()}return result}
function openPreparation(id){return enterLevel(id,false).then(()=>{if(selectedLevel!==id)return;setBattleRunning(false);paused=false;reset();$('#stage').classList.remove('playing');startCard.classList.remove('hidden');$('#endCard').classList.add('hidden');metaUI?.close();renderCampaign();window.HomeScreen?.open()})}
function claimAchievement(id){
 if(run)return {ok:false,reason:'战斗结束后可以领取'};
 const r=Achievements.claim(profile.achievements,id,profile.coins,Meta.MAX_COINS);
 if(r.ok){profile={...profile,achievements:r.state,coins:r.coins};persistProfile()}
 return r;
}
function settleBattle(won,early=false){if(s.settled)return;s.settled=true;const r=Meta.settle(profile,{id:s.battleId,stageId:s.stage.id,kills:s.kills,wavesCleared:won?s.stage.waves:s.wave-1,won,early,endless:s.endless});profile=r.profile;if(r.ok)profile.achievements=Achievements.record(profile.achievements,s.journal,{won,kills:s.kills,perfect:s.hp>=s.maxHp});s.reward=r;persistProfile();const drop=recordFrontier(won);$('#battleReward').innerHTML='战后金币 +'+r.coins+'<small>击退与守波 '+(r.combat||0)+' · '+(won?'告捷 ':'参战 ')+(r.clear||r.participation||0)+' · 首通 '+(r.firstBonus||0)+' · 持有 '+profile.coins+'</small>'+(drop?'<small>获得装备 · '+F.equipment[drop].name+'</small>':'')+(Achievements.available(profile.achievements).length?'<small>有成就可领 · 整军备战 → 成就任务</small>':'')}

const levelPanel=document.createElement('div');levelPanel.className='level-panel';$('.start-actions').insertAdjacentElement('beforebegin',levelPanel);
$('#stage').insertAdjacentHTML('beforeend','<div class="chapter-badge" id="chapterBadge"></div>');
$('#endCard').innerHTML='<header class="result-scroll-heading"><p id="resultEyebrow"></p><h1 id="resultTitle"></h1></header><div id="resultStars" class="result-stars"></div><div class="score" id="score"></div><div class="settlement-coins" id="battleReward"></div><div id="saveNotice"></div><div class="result-actions"><button id="nextLevelBtn" class="hidden">下一关 ➜</button><button id="againBtn">重试本关 ↻</button><button id="resultMapBtn">返回图卷</button></div>';
function renderCampaign(){const chapter=maps.findIndex(m=>m.id===activeMap.id),stages=campaign.levels.slice(chapter*3,chapter*3+3),selected=campaign.levels[selectedLevel];levelPanel.innerHTML='<div class="campaign-progress">山河征途 · 已通过 '+progress.stars.filter(Boolean).length+'/'+campaign.levels.length+' 关 <span>'+progress.stars.reduce((a,b)=>a+b,0)+'/'+campaign.levels.length*3+' 星</span></div><div class="level-options">'+stages.map(l=>{const locked=l.id>progress.unlocked,stars=progress.stars[l.id];return `<button type="button" data-level="${l.id}" aria-pressed="${l.id===selectedLevel}" ${locked?'disabled':''}><small>${l.chapter}-${l.tier}</small><b>${l.title}</b><span>${locked?'待解锁':stars?'★'.repeat(stars)+'☆'.repeat(3-stars):l.waves+'波 · 待挑战'}</span></button>`}).join('')+'</div><p class="level-detail">'+(selectedLevel>progress.unlocked?'通过前一关后解锁此地':selected.waves+'波敌军 · 血量 ×'+(selected.health*1.3).toFixed(2)+' · 首波准备 '+Meta.preparationTime(selected,profile.levels)+' 秒')+'</p><p class="beast-intel">⚠ '+factions.names[activeMap.id][2]+'急袭 · 高速直冲城门</p>'+encounterIntel(selected);$('#startBtn').textContent=selectedLevel>progress.unlocked?'尚未解锁':'挑战 '+selected.chapter+'-'+selected.tier+' · '+selected.title;$('#startBtn').disabled=!mapReady||selectedLevel>progress.unlocked;$('#endlessBtn').disabled=!mapReady;$('#chapterBadge').textContent=activeMap.name+' · '+selected.chapter+'-'+selected.tier+' '+selected.title;picker.querySelectorAll('[data-map]').forEach(b=>{const chapterIndex=maps.findIndex(m=>m.id===b.dataset.map),won=progress.stars.slice(chapterIndex*3,chapterIndex*3+3).filter(Boolean).length;const label=b.querySelector('small');if(label)label.textContent=chapterIndex*3>progress.unlocked?'通过前章解锁':won+'/3 关已通过';});metaUI?.wallet()}
levelPanel.onclick=e=>{const b=e.target.closest('[data-level]');if(b&&!b.disabled)enterLevel(Number(b.dataset.level),false)};
async function enterLevel(id,auto){if(!Number.isInteger(id)||id<0||id>progress.unlocked||id>=campaign.levels.length)return;const target=campaign.levels[id];if(activeMap.id!==target.mapId||!mapReady){await chooseMap(target.mapId);if(!mapReady||activeMap.id!==target.mapId)return;}selectedLevel=id;renderCampaign();if(auto)start();}
$('#nextLevelBtn').onclick=()=>{if(s.over&&s.won)openPreparation(s.stage.id+1)};
$('#resultMapBtn').onclick=()=>mapBack.onclick();
const picker=document.createElement('section');picker.className='map-picker';picker.setAttribute('aria-label','选择战场');picker.innerHTML='<div class="map-heading">山河图卷 <span id="mapStatus" aria-live="polite">选择一方天地，即刻启程</span></div><div class="map-options">'+maps.map((m,i)=>`<button type="button" data-map="${m.id}" aria-pressed="false" style="--map-color:${m.color};--map-image:url(${m.image})"><span class="map-index">0${i+1}</span><strong>${m.name}</strong><small>${m.description}</small></button>`).join('')+'</div>';$('#stage').append(picker);
const mapBack=$('#mapBack');
async function chooseMap(id){const m=maps.find(m=>m.id===id)||maps[0],request=++mapRequest;mapReady=false;$('#startBtn').disabled=true;$('#endlessBtn').disabled=true;$('#mapStatus').textContent='正在铺开'+m.name+'…';try{const img=new Image();img.src=m.image;await Promise.all([img.decode(),motion.ready,factions.ready(m.id),tileScenes.ready(m),window.BattleArt.ready,window.FortressArt.ready,window.WardrobeArt?.ready||Promise.resolve()]);if(request!==mapRequest)return;bg=img;framedBackdrop=frameBackdrop(img,m);activeMap=m;mapReady=true;configureMap(m);const first=maps.indexOf(m)*3;selectedLevel=Math.max(first,Math.min(first+2,progress.unlocked));picker.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===m.id)));$('.title-board>b').textContent=m.name;$('.title-board>small').textContent=m.tag;$('.logo small').textContent=m.name;document.title='悬城守卫 · '+m.name;$('#mapStatus').textContent=m.location+' · '+m.description;$('#stage').dataset.map=m.id;document.documentElement.style.setProperty('--map-accent',m.color);try{localStorage.setItem('hoverhold-map',m.id)}catch{}renderCampaign();}catch{if(request!==mapRequest)return;$('#mapStatus').textContent='地图载入失败，请重新选择';$('#startBtn').disabled=true;}}
picker.onclick=e=>{const b=e.target.closest('[data-map]');if(b)chooseMap(b.dataset.map)};
mapBack.onclick=()=>{closeSettings();setBattleRunning(false);paused=false;reset();$('#stage').classList.remove('playing');startCard.classList.remove('hidden');$('#endCard').classList.add('hidden');renderCampaign();};
const buildingSheet=new Image();buildingSheet.src='assets/qinglu-barracks-v13.webp';
const unitSheet=new Image();unitSheet.src='assets/qinglu-units-v13.webp';
const generals=window.GENERALS,heroSheet=new Image();heroSheet.src='assets/generals-v18.webp';
const facilitySheet=new Image();facilitySheet.src='assets/facilities-v20.webp';
$('#stage').insertAdjacentHTML('beforeend','<section class="command-dock" aria-label="将领与军令"><button type="button" class="dock-handle" id="dockHandle" aria-expanded="true" aria-controls="dockContents" title="上下拖动收放，也可点击切换"><span class="dock-grip"></span><i class="command-art command-art-general" aria-hidden="true"></i><b class="dock-label">点将台 · 下拉收起</b><i class="dock-arrow">⌄</i></button><div id="dockContents"><nav class="field-tabs" aria-label="战场操作"><button type="button" data-field-tab="general" aria-selected="true"><i class="command-art command-art-general" aria-hidden="true"></i><span>点将</span></button><button type="button" data-field-tab="camp" aria-selected="false"><i class="command-art command-art-camp" aria-hidden="true"></i><span>营建</span></button><button type="button" data-field-tab="tower" aria-selected="false"><i class="command-art command-art-tower" aria-hidden="true"></i><span>城防</span></button><button type="button" data-field-tab="spells" aria-selected="false"><i class="command-art command-art-spells" aria-hidden="true"></i><span>术法</span></button></nav><div class="command-caption"><b>点将台</b><span id="generalStatus">220矿 / 160木 · 同类士兵≥3且最多</span><strong class="skill-meter" id="skillMeter" title="击杀敌军获得技能点">术法 0 / 30</strong><button id="clearRallyBtn" title="取消集合，恢复自由迎敌"><i class="command-art command-art-general" aria-hidden="true"></i><span>自由迎敌</span></button></div><div class="general-options">'+Object.entries(generals).map(([type,g])=>'<div class="general-slot"><button type="button" id="general-'+type+'" disabled><i class="command-portrait portrait-'+type+'" aria-hidden="true"></i><span class="command-card-name">'+g.name+'</span><small>'+troopLabel(type)+' · 0/20</small></button><button type="button" class="general-order" id="order-'+type+'" disabled><i class="command-art command-art-general" aria-hidden="true"></i><span>军令 · 未召唤</span></button></div>').join('')+'<div class="general-slot support-slot"><button id="hireMedic" type="button"><i class="command-portrait portrait-medic" aria-hidden="true"></i><span class="command-card-name" id="medicLabel">召唤牧师</span><small>64矿 / 45木</small></button></div></div><div class="field-options hidden" id="fieldOptions"></div><div class="command-help" id="commandHelp">牧师治疗友军 · 点击空地集合 · 点「军令」强化同兵种</div></div></section>');
const dockDrawer=new window.CommandDrawer($('.command-dock'),$('#dockHandle'),$('#dockContents'));
function troopLabel(type){return {footman:'剑士',archer:'弓手',spearman:'枪兵',mage:'法师'}[type]}
const generalButtons=Object.fromEntries(Object.keys(generals).map(type=>[type,$('#general-'+type)]));
Object.entries(generalButtons).forEach(([type,b])=>b.onclick=()=>summonGeneral(type));
$('#clearRallyBtn').onclick=clearRally;
const beastTypes=window.ANIMAL_RAIDERS,animalSheet=new Image();animalSheet.src='assets/animal-raiders-v21.webp';
const encounterRules=window.EncounterRules,flyerTypes=encounterRules.flyers,bossTypes=encounterRules.bosses,flyerSheet=new Image(),bossSheets={a:new Image(),b:new Image()};flyerSheet.src='assets/flyers-v21.webp';bossSheets.a.src='assets/bosses-a-v21.webp';bossSheets.b.src='assets/bosses-b-v21.webp';
$('#stage').insertAdjacentHTML('beforeend','<div class="boss-status" id="bossStatus"><div class="boss-heading"><b id="bossName"></b><small id="bossHealth"></small></div><div class="boss-track"><i id="bossHealthFill"></i></div><em id="bossSkill"></em></div>');
$('#stage').insertAdjacentHTML('beforeend','<div class="raid-alert" id="raidAlert" role="status" aria-live="polite"></div>');
function enemyRadius(e){if(e.faction)return factions.config(e).size*.35;return (e.type==='boss'?68:e.type==='brute'?42:e.type==='beast'?36:e.type==='flyer'?36:31)*(e.type==='boss'?bossScale:actorScale)}
function enemyAim(e){if(e.faction)return {x:e.x,y:e.y-factions.config(e).size*.35};if(e.type==='flyer'){const cfg=flyerTypes[e.mapKey];return {x:e.x,y:e.y-cfg.altitude-Math.sin(s.time*6+e.phase)*3}}if(e.type==='boss')return {x:e.x,y:e.y-bossTypes[e.mapKey].size*bossScale*.3};return {x:e.x,y:e.y-12*actorRatio}}
function enemyEffectPoint(e){const aim=enemyAim(e);return {x:aim.x,y:aim.y-(['flyer','boss'].includes(e.type)?0:6*actorRatio)}}
function enemyPointerDistance(e){const aim=enemyAim(e);return Math.hypot(p.x-aim.x,p.y-aim.y)}
function encounterIntel(stage){const notes=['敌军 · '+factions.names[stage.mapId].join(' / ')];if(encounterRules.flyerCount(stage)>0)notes.push(flyerTypes[stage.mapId].name+'出没 · 弓手、法师、弓箭塔可对空');if(encounterRules.hasBoss(stage))notes.push('决战首领：'+bossTypes[stage.mapId].name+' · 最后一波登场');return notes.length?'<p class="encounter-intel">'+notes.join('<br>')+'</p>':''}
function spawnFlyer(){const cfg=flyerTypes[activeMap.id];if(!cfg||(!s.endless&&!encounterRules.flyerCount(s.stage)))return false;const pt=activeMap.airEntry||waveEntrance(),hp=cfg.hp*s.stage.health*(1+wavePressure()*.08),e={type:'flyer',mapKey:activeMap.id,x:pt[0],y:pt[1],hp,max:hp,speed:cfg.speed*s.stage.speed,cd:.5,flash:0,focus:0,phase:rnd(0,6.28),moving:false,attack:0,hit:0,face:gate.x>pt[0]?1:-1};s.enemies.push(e);s.flyersSent++;s.raidAlert=2.4;$('#raidAlert').textContent='空袭 · '+cfg.name+'！弓手、法师与弓箭塔迎击';return e}
function spawnBoss(){if((!s.endless&&!encounterRules.hasBoss(s.stage))||s.bossSpawned)return false;const cfg=bossTypes[activeMap.id],pt=waveEntrance(),hp=Math.round(cfg.hp*s.stage.health),e={type:'boss',mapKey:activeMap.id,x:pt[0],y:pt[1],hp,max:hp,speed:cfg.speed*s.stage.speed,cd:1,flash:0,focus:0,phase:rnd(0,6.28),walkPhase:0,moving:false,attack:0,hit:0,face:gate.x>pt[0]?1:-1,skillTimer:4.5,enraged:false};s.bossSpawned=true;s.enemies.push(e);s.raidAlert=0;s.shake=.5;text(640,210,'决战首领 · '+cfg.name,cfg.color);beep(95,.25,'sawtooth');syncBoss();return e}
function inBlast(point,area){return Math.hypot(point.x-area.x,(point.y-area.y)/.6)<=area.radius}
function updateFlyer(e,dt){const cfg=flyerTypes[e.mapKey];if(e.airStrike){e.airStrike.delay-=dt;if(e.airStrike.delay<=0){const target=e.airStrike.target;e.airStrike=null;const damage=Math.round(cfg.damage*s.stage.damage*1.18);if(target){if(target.hp>0&&s.units.includes(target)&&dist(e,target)<110){target.hp-=damage;target.hit=.2;enemyImpact(e,target);s.fx.push({kind:'magic',x:target.x,y:target.y-20,vx:0,vy:-12,life:.25,max:.25,color:cfg.color})}}else if(dist(e,gate)<56){s.hp-=damage;enemyImpact(e,s.wall.attack);text(gate.x,gate.y-38,'空袭 -'+damage,'#e7b46b');s.shake=.2}}}if(e.attack>0)return;const target=nearestAlly(e,150,false),goal=target||gate,d=dist(e,goal),reach=target?80:42;if(d<reach){if(e.cd<=0){e.attackSpan=.6;e.attack=.6;e.cd=cfg.interval;e.airStrike={target,delay:.3};e.face=(target?.x??gate.x)>=e.x?1:-1}return}const dx=goal.x-e.x,dy=goal.y-e.y,move=Math.min(e.speed*dt,d-reach+2);e.x+=dx/d*move;e.y+=dy/d*move;e.face=dx>=0?1:-1;e.moving=true}
function chooseBossTarget(){const live=s.units.filter(u=>u.hp>0);if(!live.length)return {...gate};let best=live[0],count=-1;live.forEach(u=>{const nearby=live.filter(v=>Math.hypot(v.x-u.x,(v.y-u.y)/.6)<60).length;if(nearby>count){count=nearby;best=u}});return {x:best.x,y:best.y}}
function beginBossSkill(e){if(e.hp<=0)return false;const cfg=bossTypes[e.mapKey],point=chooseBossTarget();e.skill={x:point.x,y:point.y,radius:cfg.radius,timer:cfg.warning,duration:cfg.warning};e.strike=null;e.attack=0;e.moving=false;text(point.x,point.y-48,cfg.skill+' · 移出预警范围',cfg.color);return true}
function releaseBossSkill(e){const cfg=bossTypes[e.mapKey],area=e.skill;if(!area||e.hp<=0)return false;const damage=Math.round(cfg.skillDamage*s.stage.damage*1.18);s.units.forEach(u=>{if(u.hp<=0||!inBlast(u,area))return;u.hp-=damage;u.hit=.25;if(e.mapKey==='forest')u.slow=1.2;if(e.mapKey==='island'){const dx=u.x-area.x,dy=u.y-area.y,n=Math.hypot(dx,dy)||1;s.wall.advance(u,{x:u.x+dx/n*14,y:u.y+dy/n*14},14)}});if(inBlast(gate,area)){const hit=Math.round(damage*.4);s.hp-=hit;text(gate.x,gate.y-50,cfg.skill+' -'+hit,'#eab16f')}if(cfg.hazard)s.hazards.push({...area,life:cfg.hazard,max:cfg.hazard,damage:cfg.hazardDamage*s.stage.damage,color:cfg.color,mapKey:e.mapKey});enemyImpact(e,area);s.fx.push({kind:'impact',x:area.x,y:area.y,life:.65,max:.65,color:cfg.color});burst(area.x,area.y,cfg.color,24);s.shake=.5;e.skill=null;e.skillTimer=cfg.cooldown*(e.enraged?.8:1);e.attackSpan=.8;e.attack=.8;e.skillRelease=true;return true}
function bossStrike(e,target){if(e.hp<=0)return;const cfg=bossTypes[e.mapKey],damage=Math.round(cfg.damage*s.stage.damage*1.18*(e.enraged?1.15:1));if(target){if(target.hp<=0||!s.units.includes(target)||dist(e,target)>cfg.reach+20||!s.wall.clear(e,target))return;target.hp-=damage;target.hit=.25;enemyImpact(e,target);s.units.forEach(u=>{if(u!==target&&u.hp>0&&dist(u,target)<45&&s.wall.clear(target,u)){u.hp-=damage*.3;u.hit=.18}})}else if(groundAtGate(e,34)){s.hp-=damage;enemyImpact(e,s.wall.attack);text(gate.x,gate.y-48,'首领 -'+damage,'#eeb373')}s.shake=.35}
function updateBoss(e,dt){const cfg=bossTypes[e.mapKey];if(!e.enraged&&e.hp<=e.max*.5){e.enraged=true;text(e.x,e.y-95,'首领狂怒 · 攻势加快','#e6ae69');s.shake=.4}if(e.skill){e.skill.timer-=dt;if(e.skill.timer<=0)releaseBossSkill(e);return}if(e.strike){e.strike.delay-=dt;if(e.strike.delay<=0){const target=e.strike.target;e.strike=null;bossStrike(e,target)}}e.skillTimer-=dt;if(e.attack>0)return;if(e.skillTimer<=0){beginBossSkill(e);return}const target=nearestAlly(e,180,true);if(target?dist(e,target)<=cfg.reach:groundAtGate(e,27)){if(e.cd<=0){e.skillRelease=false;e.attackSpan=1.1;e.attack=1.1;e.cd=cfg.interval*(e.enraged?.8:1);e.strike={target,delay:.55};e.face=(target?.x??gate.x)>=e.x?1:-1}return}const move=target?pursueAlly(e,target,dt):advanceToGate(e,e.speed*(e.enraged?1.2:1)*dt);e.walkPhase=(e.walkPhase+move/32)%1;e.moving=move>.02}
function updateHazards(dt){s.hazards.forEach(h=>{h.life-=dt;if(h.life>0)s.units.forEach(u=>{if(u.hp>0&&inBlast(u,h))u.hp-=h.damage*dt})});s.hazards=s.hazards.filter(h=>h.life>0)}
function syncBoss(){const boss=s.enemies.find(e=>e.type==='boss'&&e.hp>0),visible=!!boss&&run&&!s.over;$('#bossStatus').classList.toggle('visible',visible);$('#stage').classList.toggle('has-boss',visible);if(!boss)return;const cfg=bossTypes[boss.mapKey];$('#bossName').textContent=cfg.name+(boss.enraged?' · 狂怒':'');$('#bossHealth').textContent=Math.ceil(Math.max(0,boss.hp))+' / '+boss.max;$('#bossHealthFill').style.transform='scaleX('+clamp(boss.hp/boss.max,0,1)+')';$('#bossStatus').classList.toggle('enraged',boss.enraged);$('#bossSkill').textContent=boss.skill?cfg.skill+'蓄势 · 移出亮起的范围':boss.enraged?'半血狂怒 · 攻击与移动加快':'最后一波首领 · 击败后方可通关'}
function drawFlyer(e){const cfg=flyerTypes[e.mapKey],aim=enemyAim(e),size=cfg.size*actorScale,col=Math.floor(s.time*9+e.phase)%4;x.save();x.globalAlpha=.17;x.fillStyle='#284c3d';x.beginPath();x.ellipse(e.x,e.y+12*actorRatio,size*.24,7*actorRatio,0,0,Math.PI*2);x.fill();x.globalAlpha=e.flash?.62:1;x.translate(aim.x,aim.y+(e.attack>0?Math.sin(e.attack*9)*4:0));x.scale(e.face,1);if(flyerSheet.complete&&flyerSheet.naturalWidth){const cw=flyerSheet.naturalWidth/4,ch=flyerSheet.naturalHeight/3;x.drawImage(flyerSheet,col*cw,cfg.row*ch,cw,ch,-size/2,-size*.55,size,size)}x.restore();if(s.animationDemo){x.save();x.font='bold 11px KaiTi,serif';x.textAlign='center';x.fillStyle='#fff0c6';x.shadowColor='#344a39';x.shadowBlur=3;x.fillText(cfg.name,e.x,aim.y+size*.45);x.restore()}}
function drawBoss(e){const cfg=bossTypes[e.mapKey],size=cfg.size*bossScale,sheet=bossSheets[cfg.sheet];let row=cfg.pair*2,col=e.moving?Math.floor((e.walkPhase||0)*4)%4:0;if(e.skill){row++;col=e.skill.timer>e.skill.duration*.78?0:1}else if(e.attack>0){row++;const t=clamp(1-e.attack/(e.attackSpan||1.1),0,.999);col=e.skillRelease?2+Math.floor(t*2):Math.floor(t*4)}x.save();x.globalAlpha=.24;x.fillStyle='#283e32';x.beginPath();x.ellipse(e.x,e.y+15*bossRatio,size*.31,13*bossRatio,0,0,Math.PI*2);x.fill();x.globalAlpha=e.flash?.65:1;x.translate(e.x,e.y+15*bossRatio);x.scale(e.face,1);if(sheet.complete&&sheet.naturalWidth){const cw=sheet.naturalWidth/4,ch=sheet.naturalHeight/4,height=size*ch/cw,baseline=window.ENCOUNTER_LAYOUT?.['bosses-'+cfg.sheet]?.[row*4+col]??.96;x.drawImage(sheet,col*cw,row*ch,cw,ch,-size/2,-height*baseline,size,height)}x.restore();if(e.enraged){x.save();x.strokeStyle='#e6a86f';x.globalAlpha=.5;x.lineWidth=2;x.beginPath();x.ellipse(e.x,e.y+12*bossRatio,size*.31,13*bossRatio,0,0,Math.PI*2);x.stroke();x.restore()}if(s.encounterDemo){x.save();x.font='bold 12px KaiTi,serif';x.textAlign='center';x.fillStyle='#fff0c6';x.shadowColor='#344a39';x.shadowBlur=3;x.fillText(cfg.name,e.x,e.y+37);x.restore()}}
function drawEncounterGround(){const circles=[...s.hazards.map(h=>({...h,warning:false,alpha:.17+.12*h.life/h.max})),...s.enemies.filter(e=>e.type==='boss'&&e.skill).map(e=>({...e.skill,warning:true,color:bossTypes[e.mapKey].color,alpha:.15+.1*Math.sin(s.time*9)}))];circles.forEach(a=>{x.save();x.fillStyle=a.color;x.globalAlpha=a.alpha;x.beginPath();x.ellipse(a.x,a.y,a.radius,a.radius*.6,0,0,Math.PI*2);x.fill();x.globalAlpha=.8;x.strokeStyle=a.color;x.lineWidth=a.warning?2.5:1.2;x.stroke();if(a.warning){const p=clamp(1-a.timer/a.duration,0,1);x.strokeStyle='#ffe7b1';x.lineWidth=3;x.beginPath();x.ellipse(a.x,a.y,a.radius,a.radius*.6,0,-Math.PI/2,-Math.PI/2+Math.PI*2*p);x.stroke();x.font='bold 12px KaiTi,serif';x.textAlign='center';x.fillStyle='#fff0c6';x.shadowColor='#4a4938';x.shadowBlur=3;x.fillText('离开预警范围',a.x,a.y-a.radius*.6-9)}x.restore()})}
function spawnAnimal(){const cfg=beastTypes[activeMap.id],pt=waveEntrance();const hp=cfg.hp*1.2*s.stage.health*(1+wavePressure()*.06);s.enemies.push({type:'beast',faction:activeMap.id,animalKey:activeMap.id,x:pt[0],y:pt[1],hp,max:hp,speed:cfg.speed*s.stage.speed,cd:0,flash:0,focus:0,phase:rnd(0,6.28),moving:false,attack:0,hit:0,face:gate.x>pt[0]?1:-1,chargeWait:1.15,impacted:false,dustCd:0});s.beastsSent++;s.raidAlert=2.5;$('#raidAlert').textContent='⚠ '+factions.names[activeMap.id][2]+'急袭！优先拦截冲城兽';text(pt[0],pt[1]-48,factions.names[activeMap.id][2]+' · 蓄势冲城',cfg.color);beep(180,.12,'sawtooth');}
function defeatEnemy(e,i){const beast=e.type==='beast',boss=e.type==='boss',flying=e.type==='flyer';s.kills++;s.skillPoints=Math.min(Skills.maxPoints,s.skillPoints+Skills.bounty(e.type));s.score+=boss?250:beast?25:flying?22:e.type==='brute'?35:12;if(beast)s.journal.beasts++;if(boss){s.bossDefeated=true;text(e.x,e.y-65,bossTypes[e.mapKey].name+'已击败！','#f4dc9b');s.shake=.6}s.enemies.splice(i,1);burst(e.x,e.y,boss?bossTypes[e.mapKey].color:beast?beastTypes[e.animalKey].color:flying?flyerTypes[e.mapKey].color:'#8a5941',boss?35:14)}
function groundAtGate(e,range){return dist(e,s.wall.attack)<range&&s.wall.clear(e,s.wall.attack)}
function lavaPhase(){
 if(!activeMap.lava||s.between>0)return 0;
 const time=s.waveTime%18;
 return time>=8&&time<11?1:time>=11&&time<16?2:0;
}
function advanceToGate(e,step){
 const map=activeMap,lava=map.lava;
 let goal=s.wall.attack;
 if(map.bridge&&!e.crossedBridge){
  if(dist(e,map.bridge)<18)e.crossedBridge=true;
  else goal=map.bridge;
 }
 if(lava&&e.x<lava.x+24&&!e.passedLava){
  const crossing=lavaPhase()===2?lava.detour:lava;
  if(dist(e,crossing)<18)e.passedLava=true;
  else goal=crossing;
 }
 return s.wall.advance(e,s.wall.waypoint(e,goal),step*(e.poisonUntil>s.time?.65:1));
}
function updateLava(dt){
 if(lavaPhase()!==2)return;
 for(const u of s.units)if(u.hp>0&&dist(u,activeMap.lava)<45){u.hp-=8*dt;u.hit=.12}
}
function chargeAnimal(e,dt){
 const cfg=beastTypes[e.animalKey];
 if(e.chargeWait>0){e.chargeWait=Math.max(0,e.chargeWait-dt);return}
 if(e.wallStrike){
  e.wallStrike.delay-=dt;
  if(e.wallStrike.delay<=0){
   const first=e.wallStrike.first;e.wallStrike=null;
   if(groundAtGate(e,22)){
    e.impacted=true;
    const damage=Math.round((first?cfg.impact:cfg.bite)*s.stage.damage*1.18);
    s.hp-=damage;enemyImpact(e,s.wall.attack);s.shake=first?.4:.2;
    text(gate.x,gate.y-45,'撞城 -'+damage,cfg.color);beep(65,.09);
   }
  }
  return;
 }
 if(e.attack>0)return;
 if(!groundAtGate(e,14)){
  const move=advanceToGate(e,e.speed*dt);e.moving=move>.02;motion.walk(e,move);
  e.dustCd-=dt;
  if(e.dustCd<=0){e.dustCd=.15;s.fx.push({kind:'particle',x:e.x-e.face*19,y:e.y+11,vx:-e.face*18,vy:-12,life:.28,max:.28,color:cfg.color})}
 }else if(e.cd<=0){
  e.attackSpan=.7;e.attack=.7;e.cd=1.4;e.wallStrike={delay:.7*.62,first:!e.impacted};
 }
}
function drawBeast(e){const cfg=beastTypes[e.animalKey],size=cfg.size*actorScale,t=performance.now()/1000,pace=Math.sin(t*19+e.phase),bob=e.moving?Math.abs(pace)*2:0;x.save();x.translate(e.x,e.y);if(e.chargeWait>0){x.strokeStyle=cfg.color;x.globalAlpha=.5+Math.sin(t*12)*.3;x.lineWidth=2;x.beginPath();x.ellipse(0,9,(26+Math.sin(t*9)*4)*actorRatio,10*actorRatio,0,0,Math.PI*2);x.stroke();}x.globalAlpha=.25;x.fillStyle='#233d31';x.beginPath();x.ellipse(0,12*actorRatio,size*.34,8*actorRatio,0,0,Math.PI*2);x.fill();x.globalAlpha=e.flash?.65:1;if(e.moving){x.strokeStyle=cfg.color;x.lineWidth=2;x.globalAlpha=.45;for(let j=0;j<3;j++){x.beginPath();x.moveTo(-e.face*(size*.4+j*4),-7+j*7);x.lineTo(-e.face*(size*.7+j*6),-7+j*7);x.stroke()}x.globalAlpha=e.flash?.65:1;}x.translate(0,-bob-(e.attack>0?Math.sin(e.attack*12)*3:0));x.scale(e.face,1);x.rotate(e.moving?pace*.025:0);if(animalSheet.complete&&animalSheet.naturalWidth){const cw=animalSheet.naturalWidth/3,ch=animalSheet.naturalHeight/2;x.drawImage(animalSheet,cfg.cell%3*cw,Math.floor(cfg.cell/3)*ch,cw,ch,-size/2,-size*.57,size,size*.82);}x.restore();}
const troop={
 footman:{name:'剑士',buildName:'剑士营',buildGold:88,buildWood:52,gold:33,wood:15,hp:62,damage:16,range:34,speed:44,rate:2,roof:'#b94b3f'},
 archer:{name:'弓手',buildName:'弓手营',buildGold:80,buildWood:60,gold:24,wood:27,hp:31,damage:12,range:170,speed:27,rate:2.15,roof:'#3f7eae'},
 spearman:{name:'枪兵',buildName:'长枪营',buildGold:110,buildWood:68,gold:42,wood:23,hp:78,damage:23,range:48,speed:35,rate:2.4,roof:'#638c4b'},
 mage:{name:'法师',buildName:'秘法塔',buildGold:136,buildWood:96,gold:54,wood:38,hp:25,damage:20,range:205,speed:24,rate:2.8,roof:'#805ca6'}
};
const zones=[
 {id:'mine',kind:'gold',x:315,y:45,w:150,h:100,name:'青岚金矿',hint:'正在开采矿石',rate:Meta.gatherIntervals.mine},{id:'mine2',kind:'gold',x:1100,y:85,w:150,h:100,name:'东山金矿',hint:'正在开采矿石',rate:Meta.gatherIntervals.mine},{id:'mine3',kind:'gold',x:1160,y:260,w:120,h:100,name:'临溪矿洞',hint:'正在开采矿石',rate:Meta.gatherIntervals.mine},
 {id:'wood',kind:'wood',x:165,y:150,w:225,h:130,name:'青岚林地',hint:'正在砍伐木材',rate:Meta.gatherIntervals.wood},{id:'wood2',kind:'wood',x:600,y:430,w:165,h:140,name:'临溪林地',hint:'正在砍伐木材',rate:Meta.gatherIntervals.wood},{id:'wood3',kind:'wood',x:940,y:205,w:180,h:140,name:'东山林地',hint:'正在砍伐木材',rate:Meta.gatherIntervals.wood},{id:'wood4',kind:'wood',x:1110,y:390,w:170,h:165,name:'东南林地',hint:'正在砍伐木材',rate:Meta.gatherIntervals.wood},
 {id:'footman',kind:'troop',type:'footman',x:128,y:345,w:110,h:60,name:'剑士营地'},{id:'archer',kind:'troop',type:'archer',x:268,y:345,w:110,h:60,name:'弓手营地'},{id:'spearman',kind:'troop',type:'spearman',x:128,y:415,w:110,h:60,name:'长枪营地'},{id:'mage',kind:'troop',type:'mage',x:268,y:415,w:110,h:60,name:'秘法营地'}
];
const zoneTemplates=zones.map(z=>({...z}));
const spawns=[[515,157],[1070,180],[1120,390]],gate={x:420,y:455};
function configureMap(m,training=false){let mine=0,wood=0,plot=0;const free=!training&&Meta.unlocks(progress,profile.levels).freeCamps;zones.splice(0,zones.length,...zoneTemplates.filter(z=>z.kind!=='troop'||!free).map(z=>({...z,built:false,tier:1})));zones.forEach(z=>{if(z.kind==='troop'){const [cx,cy]=m.plots[plot++];Object.assign(z,Facility.campFootprint(m));z.x=cx-z.w/2;z.y=cy-z.h/2}else{const {cx,cy,rx,ry}=z.kind==='gold'?m.mines[mine++]:m.trees[wood++];z.x=Math.max(0,cx-rx);z.y=Math.max(0,cy-ry);z.w=Math.min(m.worldWidth||W,cx+rx)-z.x;z.h=Math.min(m.worldHeight||H,cy+ry)-z.y;z.name=m.name+(z.kind==='gold'?' · 金矿':' · 林地')}});const individual=tileScenes.resourceZones(m,Meta);if(individual){for(let i=zones.length-1;i>=0;i--)if(['gold','wood'].includes(zones[i].kind))zones.splice(i,1);zones.unshift(...individual)}view.reset(m);gate.x=m.gate[0];gate.y=m.gate[1];spawns.splice(0,spawns.length,...m.spawns.map(p=>[...p]))}
let s,p={x:-99,y:-99,down:false},run=false,paused=false,last=performance.now(),battleSerial=0,audioOn=settingEnabled('sound'),shakeOn=settingEnabled('shake'),audio;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function reset(endless=false){const training=!endless&&selectedLevel===0&&settingEnabled('training');configureMap(activeMap,training);const baseStage=campaign.levels[selectedLevel],difficulty=F.difficulties[frontier.difficulty],stage=battleStage(baseStage,difficulty,endless,1),loadout=Meta.snapshot(profile),maxHp=Meta.wallHp(loadout);s={stage,baseStage,difficulty,endless,boons:{},captainKit:F.kit(frontier,progress),appearance:wardrobeUI?.snapshot()||{mount:'pony'},loadout,wall:castleRoutes[activeMap.id],journal:Achievements.journal(),training:training?0:null,lessonReady:false,skillPoints:0,spellAim:null,spellReadyAt:0,spellFields:[],orders:{},unlocks:Meta.unlocks(progress,loadout),battleId:Date.now().toString(36)+'-'+(++battleSerial)+'-'+Math.random().toString(36).slice(2),settled:false,won:false,...Meta.startingStock(stage,loadout),hp:maxHp,maxHp,wave:1,waveTime:0,raidersSent:0,between:Meta.preparationTime(stage,loadout),kills:0,score:0,cursorCd:0,healCd:0,rally:null,selectedGeneral:null,placement:null,mergeMode:false,mergeSource:null,fieldTab:'general',nextStructure:0,time:0,beastsSent:0,flyersSent:0,bossSpawned:false,bossDefeated:false,hazards:[],enemyShots:[],enemyFields:[],raidAlert:0,enemies:[],units:[],fx:[],texts:[],progress:{},buildings:{footman:false,archer:false,spearman:false,mage:false},over:false,shake:0};if(training)s.unlocks={...s.unlocks,freeCamps:false};zones.forEach(z=>s.progress[z.id]=0);renderField();sync()}
function settingEnabled(key){try{return localStorage.getItem('hoverhold-setting-'+key)!=='off'}catch{return true}}
function saveSetting(key,on){try{localStorage.setItem('hoverhold-setting-'+key,on?'on':'off')}catch{}}
function beep(f=400,d=.05,type='square'){if(!audioOn)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();let o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.028,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function clearPointer(){p.x=-99;p.y=-99;p.down=false}
function setBattleRunning(active){run=active;c.classList.toggle('battle-input',active);clearPointer()}
function start(mode){if(!mapReady||(mode!=='endless'&&selectedLevel>progress.unlocked))return;window.HomeScreen?.close();closeSettings();metaUI?.close();reset(mode==='endless');setBattleRunning(true);spawnCaptain();sync();paused=false;last=performance.now();$('#stage').classList.add('playing');dockDrawer.refresh();startCard.classList.add('hidden');$('#endCard').classList.add('hidden');beep(520,.08);setTimeout(()=>beep(780,.1),90)}
function pointer(e){if(!run)return;const r=c.getBoundingClientRect();p.sx=(e.clientX-r.left)/r.width*W;p.sy=(e.clientY-r.top)/r.height*H;const pos=view.world(p.sx,p.sy);p.x=pos.x;p.y=pos.y}
c.addEventListener('pointermove',e=>{if(view.dragMove(e)){clearPointer();return}pointer(e)});
c.addEventListener('pointerdown',e=>{if(!run)return;if(e.button===2)cancelTool();if(view.beginDrag(e)){clearPointer();return}if(e.button>0)return;p.down=true;pointer(e);clickBattle(p.x,p.y)});
window.addEventListener('pointerup',()=>{p.down=false;view.drag=null});c.addEventListener('pointerleave',()=>{if(!view.drag)clearPointer()});
c.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(settings.open)return;cancelTool();metaUI?.close();return}if(settings.open||e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;if(e.key.toLowerCase()==='q'){castCaptainSkill();return}const match=Object.entries(Skills.spells).find(([,spell])=>spell.key===e.key);if(match)selectSpell(match[0])});
const settings=$('#battleSettings');
function setPaused(value){paused=value;clearPointer();syncCommands();syncTimer()}
function syncSettings(){
 for(const [id,enabled] of [['soundBtn',audioOn],['shakeBtn',shakeOn]]){
  const control=$('#'+id);control.setAttribute('aria-pressed',String(enabled));control.querySelector('span').textContent=enabled?'开':'关';
 }
}
function closeSettings(){if(settings.open)settings.close();if(paused)setPaused(false)}
$('#settingsBtn').onclick=()=>{
 if(settings.open)return;
 $('#battleActions').hidden=!run;
 syncSettings();settings.showModal();if(run)setPaused(true);
};
$('#closeSettings').onclick=closeSettings;
settings.addEventListener('cancel',e=>{e.preventDefault();closeSettings()});
$('#soundBtn').onclick=()=>{audioOn=!audioOn;saveSetting('sound',audioOn);syncSettings()};
$('#shakeBtn').onclick=()=>{shakeOn=!shakeOn;saveSetting('shake',shakeOn);syncSettings()};
$('#settleNowBtn').onclick=()=>{if(!run)return;closeSettings();lose(true)};
$('#startBtn').onclick=()=>start();$('#endlessBtn').onclick=()=>start('endless');$('#skipPreparation').onclick=skipPreparation;$('#againBtn').onclick=$('#restartBtn').onclick=()=>start(s.endless?'endless':undefined);
function zone(){const hit=[...zones].reverse().find(z=>(z.remaining===undefined||z.remaining>0)&&p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h);return hit&&['gold','wood'].includes(hit.kind)?zones.find(z=>z.kind==='machine'&&!z.built&&z.resourceId===hit.id)||hit:hit}
function workTarget(){
 let a=zone();const ally=null;
 if(!a||['gold','wood'].includes(a.kind)){const id=tileScenes.resourceAt(activeMap,p);if(id!==null){const target=zones.find(z=>z.resourceUid===id&&z.remaining>0);if(target)a=target}}
 if(a?.kind==='troop')return {a,ally:null};
 if(ally||a)return {a:ally?null:a,ally};
 // The upper part of a built camp is visible above its ground footprint.
 const roof=[...zones].reverse().find(z=>z.kind==='troop'&&z.built&&Math.abs(p.x-z.x-z.w/2)<z.w*.45&&p.y>=z.y-z.h*.55&&p.y<z.y);
 return {a:roof,ally:null};
}
function hoveredEnemy(){return [...s.enemies].reverse().find(e=>e.hp>0&&enemyPointerDistance(e)<enemyRadius(e))}
function hoveredAlly(generalsOnly=false){let best=null,near=1e9;s.units.forEach(u=>{const d=Math.hypot(p.x-u.x,p.y-(u.y-16*actorRatio));if(u.hp>0&&(!generalsOnly||u.hero)&&d<(u.hero?29:23)*actorRatio&&d<near){near=d;best=u}});return best}
function unitStats(u){if(u.role==='captain')return s.captainKit;if(u.role==='medic')return {hp:Math.round(48*s.captainKit.teamHp*(1+boonLevel('shield')*.08)),damage:0,range:115,speed:34};const base=u.hero?generals[u.type]:troop[u.type],bonus=Meta.unitBonus(s.loadout,u.type,u.hero);return {...base,hp:Math.round(base.hp*bonus.hp*s.captainKit.teamHp*(1+(!u.hero?boonLevel('shield')*.08:0))),damage:Math.round(base.damage*bonus.damage*s.captainKit.teamDamage*(1+(['archer','mage'].includes(u.type)?boonLevel('bow')*.10:0))*(orderActive(u)?Skills.orderDamage:1)),speed:base.speed*bonus.speed*(u.slow>0?.55:1)}}
function unitName(u){if(u.role==='captain')return s.captainKit.name;if(u.role==='medic')return '牧师';return (u.hero?generals[u.type].name:troop[u.type].name)+' Lv.'+s.loadout[u.type]}
function orderActive(u){return !u.hero&&(s.orders[u.type]||0)>s.time}
function troopCapacity(type){return Skills.capacity(zones,type)}
function aliveTroops(type){return s.units.filter(u=>u.hp>0&&!u.hero&&u.type===type).length}
const generalMinimum=10;
function generalLimit(type){
 return zones.reduce((limit,z)=>z.kind==='troop'&&z.built&&z.type===type?Math.max(limit,Math.min(2,z.tier)):limit,0);
}
function liveGenerals(type){return s.units.filter(u=>u.hp>0&&u.hero&&!u.role&&(!type||u.type===type))}
function syncCommands(){
 const active=run&&!paused&&!s.over,afford=s.gold>=220&&s.wood>=160;
 for(const type of Object.keys(troop)){
  const b=generalButtons[type],count=aliveTroops(type),matching=liveGenerals(type),limit=generalLimit(type);
  const ready=active&&count>=generalMinimum&&matching.length<limit&&afford;
  b.disabled=!ready;b.classList.toggle('ready',ready);
  b.querySelector('small').textContent=troop[type].name+' '+count+'/'+troopCapacity(type)+' · 将 '+matching.length+'/'+limit;
  b.title=count<generalMinimum?'至少需要10名同种普通士兵在场':matching.length>=limit?'该兵种将领席位已满':!afford?'需要220矿石、160木材':'召唤'+generals[type].name;
  const order=$('#order-'+type),left=matching.length?Math.max(0,Math.ceil(Math.min(...matching.map(u=>u.orderReadyAt||0))-s.time)):0;
  order.disabled=!active||!matching.length||left>0||count===0||orderActive({type});
  order.querySelector('span').textContent=!matching.length?'军令 · 未召唤':orderActive({type})?'军令 · 生效中':left?'军令 · '+left+' 秒':'发动军令';
 }
 $('#generalStatus').textContent='将领 '+liveGenerals().length+' · 同类≥10 · 220矿 / 160木';
 $('#clearRallyBtn').disabled=!active||(!s.rally&&!s.selectedGeneral&&!s.units.some(u=>u.commandPoint));
}
function activateOrder(type){
 if(!run||paused||s.over||orderActive({type})||!aliveTroops(type))return false;
 const hero=s.units.find(u=>u.hp>0&&u.hero&&!u.role&&u.type===type&&(u.orderReadyAt||0)<=s.time);
 if(!hero)return false;
 hero.orderReadyAt=s.time+Skills.orderCooldown;
 s.orders[type]=s.time+Skills.orderDuration;
 s.journal.orders++;
 text(hero.x,hero.y-56,'军令 · '+troopLabel(type)+'振奋',generals[type].color);
 burst(hero.x,hero.y,generals[type].color,20);
 syncCommands();
 return true;
}
for(const type of Object.keys(generals))$('#order-'+type).onclick=()=>activateOrder(type);
function makeUnit(type,hero=false,at=null,role=null){const cfg=unitStats({type,hero,role}),entry=at||s.wall.innerDoor,jitter={x:entry.x+rnd(-8,8),y:entry.y+rnd(-6,6)},pos=!at&&s.wall.interior(jitter)?jitter:entry,u={type,hero,role,x:pos.x,y:pos.y,hp:cfg.hp,max:cfg.hp,cd:0,face:1,phase:rnd(0,6.28),moving:false,attack:0,hit:0};s.units.push(u);assignLeaders(type);if(s.rally)assignFormation();return u}
function summonGeneral(type){if(!generals[type]||!run||paused||s.over)return false;if(aliveTroops(type)<generalMinimum||liveGenerals(type).length>=generalLimit(type)||s.gold<220||s.wood<160)return false;s.gold-=220;s.wood-=160;const u=makeUnit(type,true);s.journal.generals[type]=(s.journal.generals[type]||0)+1;if(liveGenerals().length>=2)s.journal.doubleGeneral=1;text(u.x,u.y-75,generals[type].name+' · 应召出阵',generals[type].color);burst(u.x,u.y,'#e4bd65',26);s.fx.push({kind:'impact',x:u.x,y:u.y,life:1,max:1,color:'#e4bd65'});beep(660,.18);syncCommands();return true}
function assignLeaders(type){
 const leaders=liveGenerals(type);
 let index=0;
 for(const u of s.units)if(!u.hero&&u.hp>0&&u.type===type)u.leader=leaders.length?leaders[index++%leaders.length]:null;
}
function squadSize(hero){return s.units.filter(u=>u.hp>0&&u.leader===hero).length}
function commandLabel(hero){return hero.role==='captain'?unitName(hero)+' · '+s.captainKit.skill+'（Q）':unitName(hero)+' · '+squadSize(hero)+' 名'+troopLabel(hero.type)}
function commandGeneral(px,py){
 const hero=hoveredAlly(true);
 if(hero){
  s.selectedGeneral=s.selectedGeneral===hero?null:hero;
  if(s.selectedGeneral)ui.tip.textContent=commandLabel(hero)+' · 点击空地下令';
  syncCommands();return true;
 }
 const selected=s.selectedGeneral;
 if(!selected)return false;
 if(!rallyGround(px,py)||hoveredEnemy())return true;
 selected.commandPoint={x:px,y:py};selected.rally=null;
 s.fx.push({kind:'impact',x:px,y:py,life:.8,max:.8,color:(selected.role==='captain'?s.captainKit.color:generals[selected.type].color)});
 text(px,py-32,unitName(selected)+' · 进军',generals[selected.type].color);beep(500,.07);
 return true;
}
function openGround(px,py){if(!s.wall.walkable({x:px,y:py})||zones.some(z=>pointInZone({x:px,y:py},z)))return false;if(tileScenes.active(activeMap)||activeMap.legacyPainted)return !s.wall.interior({x:px,y:py});[px,py]=activeMap.unframe([px,py]);if(px<35||px>1245||py<110||py>575)return false;switch(activeMap.base||activeMap.id){case'mountain':return !(px<405&&py>290);case'island':return !(px>860&&py>230);case'forest':return !(px<475&&py<390);case'volcano':return !(px>835&&py<380);case'desert':return !(px>440&&px<930&&py>385);default:return true}}
function pointInZone(pt,z){return pt.x>=z.x&&pt.x<=z.x+z.w&&pt.y>=z.y&&pt.y<=z.y+z.h}
function rallyGround(px,py){const pt={x:px,y:py};if(!s.wall.walkable(pt)||(lavaPhase()===2&&dist(pt,activeMap.lava)<45))return false;return s.wall.interior(pt)?!zones.some(z=>pointInZone(pt,z)):openGround(px,py)}
function assignFormation(){
 if(!s.rally)return;
 const live=s.units.filter(u=>u.hp>0),pending=live.filter(u=>!u.rally);
 if(!pending.length)return;
 const occupied=live.filter(u=>u.rally).map(u=>u.rally),slots=[];
 const inside=s.wall.interior(s.rally);
 for(let row=-9;row<=9;row++)for(let col=-9;col<=9;col++){
  const pt={x:s.rally.x+col*24,y:s.rally.y+row*21};
  if(s.wall.interior(pt)===inside&&rallyGround(pt.x,pt.y)&&s.wall.clear(s.rally,pt))slots.push(pt);
 }
 slots.sort((a,b)=>dist(a,s.rally)-dist(b,s.rally));
 for(const u of pending){
  const slot=slots.find(pt=>occupied.every(other=>dist(pt,other)>12));
  u.rally=slot||s.rally;
  u.rallyArrived=false;
  occupied.push(u.rally);
 }
}
function issueRally(px,py){if(!run||paused||s.over||!rallyGround(px,py)||hoveredAlly()||hoveredEnemy())return false;s.rally={x:px,y:py};s.units.forEach(u=>{u.commandPoint=null;u.rally=null});assignFormation();text(px,py-44,s.units.some(u=>u.hp>0)?'全军集合':'集结点已设定','#e5f3c4');s.fx.push({kind:'impact',x:px,y:py,life:.8,max:.8,color:'#a1c986'});beep(500,.07);syncCommands();return true}
function clearRally(){if(!run||paused||s.over)return;s.rally=null;s.selectedGeneral=null;s.units.forEach(u=>{u.rally=null;u.commandPoint=null});ui.tip.textContent='已取消集合 · 全军自由迎敌';syncCommands()}
function healAlly(){return false}
function workRate(kind){return Meta.rate(s.loadout,kind||'build')}
function blueprintFor(type){const t=troop[type];return t?{name:t.buildName,kind:'troop',gold:t.buildGold,wood:t.buildWood,time:3,size:124,color:t.roof}:Facility.blueprints[type]}
function typeAvailability(type){const b=blueprintFor(type);if(!b)return '未知建筑';if(b.kind==='troop'&&!s.unlocks.freeCamps)return '通过第一章后解锁自由建营';if(b.kind==='machine')return '该建筑已移除';if(b.kind==='tower'&&s.loadout.wall<b.wall)return '需要城墙 Lv.'+b.wall;if(b.kind==='troop'&&zones.filter(z=>z.kind==='troop').length>=12)return '最多十二座兵营';if(b.kind==='tower'&&zones.filter(z=>z.type===type).length>=2)return '同类城防最多两座';if(s.gold<b.gold||s.wood<b.wood)return '矿石或木材不足';return ''}
function renderField(){if(!s)return;const tab=s.fieldTab;document.querySelectorAll('[data-field-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.fieldTab===tab)));$('.general-options').classList.toggle('hidden',tab!=='general');$('#fieldOptions').classList.toggle('hidden',tab==='general');$('.command-caption>b').textContent={general:'点将台',camp:'营建',tower:'城防',spells:'光标术法'}[tab];
 if(tab==='spells'){renderSpellOptions();syncField();dockDrawer.refresh();return;}
 let types=tab==='camp'?Object.keys(troop):tab==='tower'?['arrowTower','cannon']:[];
 if(tab==='camp'&&!s.unlocks.freeCamps){$('#fieldOptions').innerHTML='<div class="field-lock">通过第一章后解锁自由选址与合营 · 当前悬停城内地基建营</div>';return}
 $('#fieldOptions').innerHTML=types.map(type=>{const b=blueprintFor(type),reason=typeAvailability(type);return '<button type="button" data-build="'+type+'" '+(reason?'disabled':'')+' title="'+(reason||'选择后点击有效位置安放')+'"><i class="command-building building-'+type+'" aria-hidden="true"></i><span class="command-card-name">'+b.name+'</span><small>'+b.gold+'矿 '+b.wood+'木</small><em class="command-card-state">'+(reason?'暂不可用':'选择营建')+'</em></button>'}).join('')+(tab==='camp'?'<button type="button" id="mergeCampsBtn"><i class="command-art command-art-camp" aria-hidden="true"></i><span class="command-card-name">合营升阶</span><small>同类同阶 · 二合一</small><em class="command-card-state">先选两座兵营</em></button>':'');
 if(tab==='camp')$('#mergeCampsBtn').onclick=()=>{if(!run||paused||!s.unlocks.freeCamps)return;s.spellAim=null;s.placement=null;s.mergeMode=true;s.mergeSource=null;syncField()};syncField();dockDrawer.refresh();
}
$('.field-tabs').onclick=e=>{const b=e.target.closest('[data-field-tab]');if(b){s.fieldTab=b.dataset.fieldTab;renderField()}};
$('#fieldOptions').onclick=e=>{const spell=e.target.closest('[data-spell]');if(spell&&!spell.disabled){selectSpell(spell.dataset.spell);return}const b=e.target.closest('[data-build]');if(b&&!b.disabled)beginBuild(b.dataset.build)};
function syncField(){if(!s)return;syncSpellOptions();document.querySelectorAll('[data-build]').forEach(b=>{const reason=typeAvailability(b.dataset.build);b.disabled=!!reason||!run||paused||s.over;b.title=reason||'点击空地安放，悬停继续建造';b.classList.toggle('selected',s.placement?.type===b.dataset.build);setText(b.querySelector('.command-card-state'),reason?reason==='矿石或木材不足'?'材料不足':reason.startsWith('需要城墙')?reason.replace('需要','需'):reason.includes('解锁')?'尚未解锁':'已达上限':s.placement?.type===b.dataset.build?'点击战场放置':'选择营建')});if(s.fieldTab==='camp')$('#mergeCampsBtn')?.classList.toggle('selected',s.mergeMode);if(s.fieldTab!=='general')$('#generalStatus').textContent=s.fieldTab==='camp'?'兵营只能建在城内 · 同类同阶可合营':s.fieldTab==='tower'?'弓箭塔 Lv.3 / 炮塔 Lv.6 · 可建在城外':s.fieldTab==='spells'?'击杀积攒技能点 · 选术法后点击战场':'机器放在对应资源点 · 建成后自动工作';$('#commandHelp').textContent=s.spellAim?'已选 '+Skills.spells[s.spellAim].name+' · 左键释放 / Esc 取消':s.placement?'点击有效位置安放 · 悬停完成营建 · 右键取消':s.mergeMode?'先点一座兵营，再点同类同阶兵营合并':'牧师治疗友军 · 点将领再点空地下令'}
function cancelTool(){if(!s)return;s.selectedGeneral=null;s.spellAim=null;s.placement=null;s.mergeMode=false;s.mergeSource=null;syncField()}
function spellUnavailable(id){
 const spell=Skills.spells[id];
 if(!spell||!run||paused||s.over)return '进入战斗后可用';
 if(s.time<s.spellReadyAt)return '术法正在冷却';
 if(s.skillPoints<spell.cost)return '需要 '+spell.cost+' 技能点';
 return '';
}
function renderSpellOptions(){
 $('#fieldOptions').innerHTML=Object.entries(Skills.spells).map(([id,spell])=>'<button type="button" data-spell="'+id+'"><i class="command-art command-art-'+id+'" aria-hidden="true"></i><kbd>'+spell.key+'</kbd><span class="command-card-name">'+spell.name+'</span><small>'+spell.cost+' 点 · Lv.'+s.loadout[id]+'</small><em class="command-card-state"></em></button>').join('');
}
function syncSpellOptions(){
 $('#skillMeter').textContent='技能点 '+s.skillPoints+' / '+Skills.maxPoints;
 if(s.fieldTab!=='spells')return;
 document.querySelectorAll('[data-spell]').forEach(button=>{
  const id=button.dataset.spell,reason=spellUnavailable(id),selected=s.spellAim===id;
  button.disabled=!!reason;button.title=reason||Skills.description(id,s.loadout[id]);
  button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));setText(button.querySelector('.command-card-state'),selected?'点击战场施放':reason?reason==='术法正在冷却'?'冷却中':reason.startsWith('需要')?'技能点不足':'暂不可用':'选中施放');
 });
}
function selectSpell(id){
 const reason=spellUnavailable(id);if(reason)return false;
 const selected=s.spellAim===id?null:id;
 cancelTool();s.spellAim=selected;syncField();return true;
}
function castSpell(id,px,py){
 if(spellUnavailable(id)||!Number.isFinite(px)||!Number.isFinite(py)||px<0||px>worldWidth()||py<0||py>worldHeight())return false;
 const cfg=Skills.stats(id,s.loadout[id]),point={x:px,y:py,radius:cfg.radius};
 if(id==='fireball'){
  const targets=s.enemies.filter(e=>e.hp>0&&e.type!=='flyer'&&Skills.inField(e,point));
  if(!targets.length){text(px,py-25,'火球范围内没有地面敌军','#fff0bd');return false}
  targets.forEach(e=>{e.hp-=cfg.power;e.flash=1});
  s.fx.push({kind:'impact',x:px,y:py,life:.65,max:.65,color:cfg.color});s.shake=Math.max(s.shake,.22);
 }else if(id==='lightning'){
  let origin=point;const struck=new Set(),path=[];
  for(let i=0;i<3;i++){
   let nearest=null,hit=null,range=i?112:cfg.radius;
   for(const e of s.enemies){if(e.hp<=0||struck.has(e))continue;const aim=enemyAim(e),d=dist(aim,origin);if(d<=range){nearest=e;hit=aim;range=d}}
   if(!nearest)break;
   struck.add(nearest);path.push(hit);origin=hit;nearest.hp-=Math.round(cfg.power*Math.pow(.70,i));nearest.flash=1;
  }
  if(!path.length){text(px,py-25,'雷电需要附近的敌军','#d8f0ff');return false}
  s.fx.push({kind:'lightning',path:[{x:path[0].x-24,y:path[0].y-108},...path],life:cfg.duration,max:cfg.duration,color:cfg.color});
 }else{
  s.spellFields.push({...point,id,power:cfg.power,color:cfg.color,life:cfg.duration,max:cfg.duration});
 }
 s.skillPoints-=cfg.cost;s.spellReadyAt=s.time+.7;s.spellAim=null;
 s.journal.spells[id]=(s.journal.spells[id]||0)+1;
 text(px,py-25,cfg.name+' · −'+cfg.cost+' 点',cfg.color);burst(px,py,cfg.color,id==='fireball'?28:14);beep(id==='lightning'?130:440,.13);syncField();return true;
}
function updateSpellFields(dt){
 for(const field of s.spellFields){
  const elapsed=Math.min(dt,field.life);field.life-=elapsed;
  if(field.id==='healField'){
   for(const unit of s.units)if(unit.hp>0&&Skills.inField(unit,field))unit.hp=Math.min(unit.max,unit.hp+field.power*elapsed);
  }else{
   for(const e of s.enemies)if(e.hp>0&&e.type!=='flyer'&&Skills.inField(e,field)){e.hp-=field.power*elapsed;e.poisonUntil=s.time+.16;}
  }
 }
 s.spellFields=s.spellFields.filter(field=>field.life>0);
}
function drawSpellRing(px,py,radius,color,alpha){
 x.save();x.strokeStyle=color;x.fillStyle=color;x.globalAlpha=alpha*.25;x.beginPath();x.ellipse(px,py,radius,radius*.70,0,0,Math.PI*2);x.fill();
 x.globalAlpha=alpha;x.lineWidth=2;x.stroke();x.beginPath();x.ellipse(px,py,radius*.77,radius*.54,0,s.time*1.3,s.time*1.3+4.8);x.stroke();
 for(let i=0;i<8;i++){const a=i*Math.PI/4+s.time*.4;x.beginPath();x.arc(px+Math.cos(a)*radius*.88,py+Math.sin(a)*radius*.62,2,0,Math.PI*2);x.fill()}
 x.restore();
}
function drawSpellFields(){for(const f of s.spellFields)drawSpellRing(f.x,f.y,f.radius,f.color,.58*Math.min(1,f.life));}
function drawSpellAim(){if(!s.spellAim||p.x<0)return;const cfg=Skills.stats(s.spellAim,s.loadout[s.spellAim]);drawSpellRing(p.x,p.y,cfg.radius,cfg.color,.67);}
function beginBuild(type){if(!run||paused||s.over)return false;const reason=typeAvailability(type);if(reason){ui.tip.textContent=reason;return false}s.spellAim=null;s.placement={type};s.mergeMode=false;s.mergeSource=null;syncField();return true}
function placementPlan(type,px,py){
 const b=blueprintFor(type);if(!b)return {ok:false,reason:'未知建筑',cx:px,cy:py};let cx=px,cy=py,resourceId=null;
 if(b.kind==='troop'){
  const nearby=activeMap.plots.filter(([x,y])=>Math.hypot(x-px,y-py)<=20).sort((a,b)=>Math.hypot(a[0]-px,a[1]-py)-Math.hypot(b[0]-px,b[1]-py));
  for(const [x,y] of nearby){const snap=placementAt(b,x,y);if(snap.ok)return snap}
 }
 return placementAt(b,px,py);
}
function placementAt(b,px,py){
 let cx=px,cy=py,resourceId=null;
 if(b.kind==='machine'){const resource=zones.find(z=>z.kind===b.resource&&px>=z.x&&px<=z.x+z.w&&py>=z.y&&py<=z.y+z.h);if(!resource)return {ok:false,reason:'请选择'+(b.resource==='gold'?'矿区':'树林'),cx,cy};resourceId=resource.id;cx=Math.max(60,Math.min(1220,resource.x+resource.w/2));cy=Math.max(150,Math.min(565,resource.y+resource.h*.72));if(zones.some(z=>z.kind==='machine'&&z.resourceId===resourceId))return {ok:false,reason:'该资源点已有机关',cx,cy}}
 else if(b.kind==='troop'){
  if(!Facility.campFits(activeMap,cx,cy))return {ok:false,reason:'兵营地基必须完整位于城墙内',cx,cy};
  if(Math.hypot(cx-gate.x,cy-gate.y)<58*activeMap.cityScale)return {ok:false,reason:'给城门留出通道',cx,cy};
  const {w,h}=Facility.campFootprint(activeMap);
  if(zones.some(z=>['gold','wood'].includes(z.kind)&&cx+w/2>z.x&&cx-w/2<z.x+z.w&&cy+h/2>z.y&&cy-h/2<z.y+z.h))return {ok:false,reason:'避开矿区和树林',cx,cy};
 }else{if(!openGround(cx,cy)||![-1,1].every(dx=>[-1,1].every(dy=>openGround(cx+dx*43,cy+dy*25))))return {ok:false,reason:'请选择开阔陆地',cx,cy};if(Math.hypot(cx-gate.x,cy-gate.y)<70||spawns.some(p=>Math.hypot(cx-p[0],cy-p[1])<90))return {ok:false,reason:'避开城门和敌军入口',cx,cy}}
 const {w,h}=b.kind==='troop'?Facility.campFootprint(activeMap):{w:96,h:64};
 if(zones.some(z=>{if(z.kind==='gold'||z.kind==='wood')return false;const camp=b.kind==='troop'||z.kind==='troop';return Math.abs(cx-(z.x+z.w/2))<(camp?(w+z.w)/2+4:86)&&Math.abs(cy-(z.y+z.h/2))<(camp?(h+z.h)/2+4:62)}))return {ok:false,reason:'建筑之间需要留出通道',cx,cy};
 return {ok:true,cx,cy,resourceId};
}
function tryPlace(type,px,py){if(!run||paused||s.over||typeAvailability(type))return false;const plan=placementPlan(type,px,py),b=blueprintFor(type);if(!plan.ok){text(px,py-25,plan.reason,'#df9b6c');return false}s.gold-=b.gold;s.wood-=b.wood;const {w,h}=b.kind==='troop'?Facility.campFootprint(activeMap):{w:96,h:64};const z={id:'structure-'+(++s.nextStructure),kind:b.kind,type,x:plan.cx-w/2,y:plan.cy-h/2,w,h,name:b.name,tier:1,built:false,paid:true,resourceId:plan.resourceId,cd:0,production:0};zones.push(z);s.progress[z.id]=0;cancelTool();text(plan.cx,plan.cy-40,'材料已投入 · 悬停营建','#f4df9a');beep(360,.06);renderField();return z}
function mergePick(px,py){const z=[...zones].reverse().find(z=>z.kind==='troop'&&z.built&&px>=z.x&&px<=z.x+z.w&&py>=z.y&&py<=z.y+z.h);if(!z){ui.tip.textContent='请选择已建成的兵营';return false}if(!s.mergeSource){s.mergeSource=z.id;text(px,py-35,'已选 '+troop[z.type].buildName+' '+z.tier+'阶','#f4df9a');return false}const source=zones.find(a=>a.id===s.mergeSource);if(source===z){s.mergeSource=null;return false}return mergeCamps(source,z)}
function mergeCamps(a,b){if(!run||paused||s.over)return false;const reason=Facility.mergeReason(a,b,s.unlocks.freeCamps);if(reason){ui.tip.textContent=reason;return false}zones.splice(zones.indexOf(a),1);delete s.progress[a.id];b.tier++;s.journal.merges++;s.progress[b.id]=0;s.mergeSource=null;s.mergeMode=false;text(b.x+b.w/2,b.y-30,troop[b.type].buildName+'升至 '+b.tier+'阶','#e8c471');burst(b.x+b.w/2,b.y+b.h/2,'#e8c471',25);beep(760,.15);renderField();return true}
function clickBattle(px,py){if(!run||paused||s.over)return false;if(s.spellAim)return castSpell(s.spellAim,px,py);if(s.placement)return tryPlace(s.placement.type,px,py);if(s.mergeMode)return mergePick(px,py);if(commandGeneral(px,py))return true;return issueRally(px,py)}
function updateFacilities(dt){for(const z of zones){if(!z.built)continue;z.fire=Math.max(0,(z.fire||0)-dt);z.hit=Math.max(0,(z.hit||0)-dt);const cx=z.x+z.w/2,cy=z.y+z.h/2;if(z.kind==='tower'){z.cd=(z.cd||0)-dt;if(z.cd>0)continue;const cfg=Facility.towerStats(z.type,s.loadout.wall);let target=null,near=cfg.range;s.enemies.forEach(e=>{const d=Math.hypot(e.x-cx,e.y-cy);if(e.hp>0&&encounterRules.canTarget(z.type,e)&&d<near){near=d;target=e}});if(!target)continue;z.cd=cfg.interval;z.fire=.24;target.hp-=cfg.damage;target.flash=1;target.hit=.2;if(cfg.splash)s.enemies.forEach(e=>{if(e!==target&&e.hp>0&&encounterRules.canTarget(z.type,e)&&dist(e,target)<cfg.splash){e.hp-=cfg.damage*.6;e.flash=1}});const life=.28,impact=enemyEffectPoint(target);s.fx.push({kind:z.type==='cannon'?'shell':'arrow',x:cx,y:cy-42,vx:(impact.x-cx)/life,vy:(impact.y-(cy-42))/life,life,max:life,color:z.type==='cannon'?'#e4a261':'#e1d2a4'});if(z.type==='cannon'){s.fx.push({kind:'impact',x:target.x,y:target.y,life:.5,max:.5,color:'#e9b568'});burst(target.x,target.y,'#e9b568',10)}}}}
function action(dt){
 s.healCd=Math.max(0,s.healCd-dt);if(s.spellAim){ui.tip.textContent='瞄准 '+Skills.spells[s.spellAim].name+' · 点击释放 / Esc 取消';return}if(s.placement||s.mergeMode){ui.tip.textContent=s.mergeMode?(s.mergeSource?'再点击同类同阶兵营合并 · 右键取消':'先点击一座已建成兵营 · 右键取消'):(blueprintFor(s.placement.type).kind==='troop'?'在城墙内安放':'选择位置安放')+blueprintFor(s.placement.type).name+' · 右键取消';return}
 const {a}=workTarget();zones.forEach(z=>{if(z!==a&&(z.kind==='gold'||z.kind==='wood'||z.built))s.progress[z.id]=Math.max(0,(s.progress[z.id]||0)-dt*.6)});

 if(!a){ui.tip.textContent=s.selectedGeneral?'已选 '+commandLabel(s.selectedGeneral)+' · 点击空地下令 / Esc 取消':hoveredEnemy()?'敌军情报 · 查看敌军':s.rally?'集结点已设定 · 牧师治疗友军 / 点击空地重新集合':'悬停采集、建造、招兵 · 点击空地集合';return}
 if(a.kind==='gold'||a.kind==='wood'){const skill=a.kind==='gold'?'mine':'wood';s.progress[a.id]+=dt*workRate(skill);ui.tip.textContent=a.name+' · '+a.hint+(a.remaining!==undefined?' · 剩余 '+a.remaining+' / '+(a.capacity||100):'')+'（约 '+Meta.gatherPerSecond(s.loadout,skill).toFixed(1)+'/秒）';const cycles=Math.floor((s.progress[a.id]+1e-9)/a.rate);if(cycles>0){s.progress[a.id]=Math.max(0,s.progress[a.id]-cycles*a.rate);const gathered=Math.min(cycles*Meta.gatherYield,a.remaining??Infinity);if(a.remaining!==undefined){a.remaining-=gathered;if(a.remaining===0){tileScenes.removeResource(activeMap,a.resourceUid);s.progress[a.id]=0;text(p.x,p.y-24,a.kind==='wood'?'林木采尽':'矿石采尽','#e1cb8e')}}s[a.kind]+=gathered;s.journal.gathered[a.kind]+=gathered;burst(p.x,p.y,a.kind==='gold'?'#f6c445':'#77a64b',4)}return}
 const cfg=blueprintFor(a.type);
 if(!a.built){s.progress[a.id]+=dt*workRate('build');ui.tip.textContent='建造'+cfg.name+' · '+(a.paid?'材料已投入':cfg.gold+'矿 '+cfg.wood+'木');if(s.progress[a.id]>=cfg.time){s.progress[a.id]=0;construct(a.type,a)}}
 else if(a.kind==='troop'){const blocked=recruitBlockReason(a.type);if(blocked){ui.tip.textContent=blocked;return}s.progress[a.id]+=dt*workRate('recruit')*Facility.campRate(a.tier)*(1+boonLevel('levy')*.12);ui.tip.textContent=cfg.name+' '+a.tier+'阶 · 招募'+troop[a.type].name+' '+troop[a.type].gold+'矿 '+troop[a.type].wood+'木';if(s.progress[a.id]>=troop[a.type].rate){s.progress[a.id]=0;recruit(a.type,a)}}
 else ui.tip.textContent=cfg.name+(a.kind==='machine'?' · 自动产出 '+Meta.machineRate(s.loadout,a.type).toFixed(2)+'/秒':' · 自动防卫 · 生命 '+Math.ceil(a.hp)+'/'+a.maxHp);
}
function construct(type,z=zones.find(z=>z.kind==='troop'&&z.type===type&&!z.built)){if(!z||z.built)return false;const cfg=blueprintFor(type);if(!z.paid){if(s.gold<cfg.gold||s.wood<cfg.wood){text(p.x,p.y-30,'建造资源不足','#e25c52');return false}s.gold-=cfg.gold;s.wood-=cfg.wood}z.built=true;z.tier||=1;if(z.kind==='tower'){z.maxHp=Facility.towerHealth(type,s.loadout.wall);z.hp=z.maxHp;z.hit=0}z.cd=0;z.production=0;if(z.kind==='troop')s.buildings[type]=true;const built=z.kind==='troop'?'camp':z.kind==='machine'?'machine':type;s.journal.built[built]=(s.journal.built[built]||0)+1;text(z.x+z.w/2,z.y-30,cfg.name+'建成！','#f6d66d');burst(z.x+z.w/2,z.y+z.h/2,'#d6c69a',15);beep(440,.06);renderField();return true}
function recruitBlockReason(type){
 const cfg=troop[type],count=aliveTroops(type),limit=troopCapacity(type);
 if(count>=limit)return troopLabel(type)+' '+count+'/'+limit+' · '+(limit<40?'合营可扩至 '+(limit+10):'在场人数已满');
 const gold=Math.max(0,cfg.gold-s.gold),wood=Math.max(0,cfg.wood-s.wood);
 return gold||wood?'材料不足 · 还需 '+[gold?Math.ceil(gold)+'矿石':'',wood?Math.ceil(wood)+'木材':''].filter(Boolean).join(' / '):'';
}
function recruit(type,source){const cfg=troop[type];if(!cfg)return false;const blocked=recruitBlockReason(type);if(blocked){text(p.x,p.y-28,blocked,'#e25c52');return false}s.gold-=cfg.gold;s.wood-=cfg.wood;const pos=source?s.wall.egress(source.x+source.w/2,source.y+source.h/2,pt=>zones.some(z=>pointInZone(pt,z))):null;const u=makeUnit(type,false,pos);s.journal.recruited[type]=(s.journal.recruited[type]||0)+1;text(u.x,u.y-35,cfg.name+'出征','#f6d66d');beep(type==='mage'?720:type==='archer'?560:360,.06);return true}
function spawn(){
 const pt=waveEntrance(),ranged=s.wave>=2&&s.raidersSent%4===2;
 const brute=!ranged&&Math.random()<s.stage.bruteChance+wavePressure()*.025;
 const hp=(ranged?52:brute?115*1.25:46*1.3)*(1+wavePressure()*.12)*s.stage.health;
 s.enemies.push({faction:activeMap.id,role:ranged?'ranged':'melee',type:brute?'brute':'raider',
  x:pt[0]+rnd(-13,13),y:pt[1]+rnd(-9,9),hp,max:hp,
  speed:((ranged?29:brute?23:36)+wavePressure())*s.stage.speed,cd:0,flash:0,focus:0,
  phase:rnd(0,6.28),moving:true,attack:0,hit:0,face:-1});
}
function wavePressure(){return s.endless?1+Math.min(7,(s.wave-1)*.35):1+4*(s.wave-1)/(s.stage.waves-1)}
function waveEntrance(){return spawns[(s.wave-1)%spawns.length]}
function waveSpecials(){
 if(s.endless)return {beasts:s.wave<2?0:Math.min(3,1+Math.floor(s.wave/8)),flyers:flyerTypes[activeMap.id]&&s.wave>=4?Math.min(2,Math.floor(s.wave/4)):0};
 const ramp=(s.wave-1)/(s.stage.waves-1);
 return {beasts:s.wave===1?0:1+Math.floor(ramp*(s.stage.tier-1)),flyers:s.wave<3?0:Math.ceil(ramp*encounterRules.flyerCount(s.stage))};
}
function waveEnemyCount(stage,wave){
 if(s?.endless)return Math.max(3,Math.min(48,Math.round((4+wave*1.45)*s.difficulty.count)));
 const first=3+Math.floor(stage.extraEnemies/4),last=14+stage.extraEnemies;
 return Math.max(2,Math.round((first+(last-first)*Math.pow((wave-1)/(stage.waves-1),1.25))*(stage.countScale||1)));
}
function beginWave(){s.between=0;s.waveTime=0;s.raidersSent=0;beep(180,.16)}
function skipPreparation(){if(!run||paused||s.over||s.training!==null||s.between<=0)return false;beginWave();syncTimer();return true}
function step(dt){s.time+=dt;s.raidAlert=Math.max(0,s.raidAlert-dt);s.shake=Math.max(0,s.shake-dt*7);s.cursorCd=Math.max(0,s.cursorCd-dt);if(s.between>0){if(s.training===null)s.between-=dt;if(s.between<=0)beginWave()}else{const duration=s.stage.duration,count=waveEnemyCount(s.stage,s.wave);s.waveTime+=dt;while(s.raidersSent<count&&s.waveTime>=.25+s.raidersSent*duration/count){spawn();s.raidersSent++}const {beasts,flyers}=waveSpecials();if(s.beastsSent<beasts&&s.waveTime>=6+s.beastsSent*5)spawnAnimal();if(s.flyersSent<flyers&&s.waveTime>=8+s.flyersSent*5)spawnFlyer();if(s.endless?(s.wave%5===0&&s.waveTime>=9&&!s.bossSpawned&&bossTypes[activeMap.id]):encounterRules.bossDue(s.stage,s.wave,s.waveTime,s.bossSpawned))spawnBoss();if(s.waveTime>=duration&&!s.enemies.length&&(s.endless||!encounterRules.hasBoss(s.stage)||s.wave<s.stage.waves||s.bossDefeated)){if(!s.endless&&s.wave>=s.stage.waves){win();return}s.wave++;if(s.endless){s.stage=battleStage(s.baseStage,s.difficulty,true,s.wave);s.bossSpawned=false;s.bossDefeated=false;openBoons();}s.beastsSent=0;s.flyersSent=0;s.between=s.stage.rest;s.gold+=20;s.wood+=16;text(640,285,'波次守住！ +20矿 +16木','#f6d66d');beep(760,.18)}}action(dt);updateTraining();updateSpellFields(dt);units(dt);updateEnemyProjectiles(dt);updateFacilities(dt);updateHazards(dt);updateLava(dt);updateFrontierTerrain(dt);enemies(dt);effects(dt);sync()}
function beginEnemyAttack(e,target=null){e.vx=0;e.vy=0;e.attackSpan=e.faction?factions.config(e).windup:motion.duration(e);e.attack=e.attackSpan;e.strike={target,delay:e.attackSpan*.62};e.cd=target?1.1:1.25;e.face=(target?.x??gate.x)>=e.x?1:-1}
function resolveEnemyStrike(e,target){if(e.hp<=0)return;const dmg=(e.type==='brute'?(target?14:13):(target?7:6))*s.stage.damage*1.18;if(target){if(target.hp<=0||!s.units.includes(target)||dist(e,target)>54||!s.wall.clear(e,target))return;target.hp-=dmg;target.hit=.22;enemyImpact(e,target);s.shake=.2;beep(90,.03)}else if(groundAtGate(e,26)){const hit=Math.round(dmg);s.hp-=hit;enemyImpact(e,s.wall.attack);s.shake=.7;text(gate.x,gate.y-45,'-'+hit,'#e85b52');beep(70,.08)}}
function towerCenter(tower){return {x:tower.x+tower.w/2,y:tower.y+tower.h/2}}
function liveTower(tower){return tower?.kind==='tower'&&tower.built&&tower.hp>0&&zones.includes(tower)}
function chooseTower(e){
 if(liveTower(e.towerTarget))return e.towerTarget;
 let closest=null,near=Infinity;
 for(const tower of zones){
  if(!liveTower(tower))continue;
  const center=towerCenter(tower),d=dist(e,center);
  if(d>=near||!s.wall.route(e,center).length)continue;
  closest=tower;near=d;
 }
 return closest;
}
function towerAttackStats(e,tower){
 const cfg=beastTypes[e.animalKey];
 return {damage:e.lastTowerHit===tower?cfg.bite:cfg.impact,range:38,interval:1.4,duration:.7};
}
function damageTower(tower,damage){
 tower.hp=Math.max(0,tower.hp-damage);tower.hit=.26;
 const center=towerCenter(tower),color=tower.hp?'#f4c887':'#f28d67';
 text(center.x,center.y-45,tower.hp?'-'+damage:tower.name+'被摧毁',color);
 burst(center.x,center.y-15,color,tower.hp?5:23);
 if(tower.hp)return;
 zones.splice(zones.indexOf(tower),1);delete s.progress[tower.id];renderField();
}
function engageTower(e,dt){
 if(e.towerStrike){
  const strike=e.towerStrike;strike.left-=dt;
  if(strike.left>0)return true;
  e.towerStrike=null;
  if(liveTower(strike.tower)){
   const center=towerCenter(strike.tower);
   if(dist(e,center)<=strike.range+7&&s.wall.clear(e,center)){damageTower(strike.tower,strike.damage);enemyImpact(e,center);e.lastTowerHit=strike.tower}
  }
 }
 const tower=chooseTower(e);e.towerTarget=tower;
 if(!tower)return false;
 e.strike=null;e.airStrike=null;
 if(e.chargeWait>0){e.chargeWait=Math.max(0,e.chargeWait-dt);return true}
 if(e.attack>0)return true;
 const center=towerCenter(tower),d=dist(e,center),attack=towerAttackStats(e,tower),clear=s.wall.clear(e,center);
 if(d<=attack.range&&clear){
  if(e.cd<=0){
   e.face=center.x>=e.x?1:-1;e.attackSpan=attack.duration;e.attack=attack.duration;e.cd=attack.interval;e.skillRelease=false;
   e.towerStrike={tower,left:attack.duration*.62,range:attack.range,damage:Math.round(attack.damage*s.stage.damage*1.18)};
  }
  return true;
 }
 const distance=e.speed*dt*(e.poisonUntil>s.time?.65:1),step=clear?Math.min(distance,Math.max(0,d-attack.range+1)):distance;
 const moved=s.wall.advance(e,s.wall.waypoint(e,center),step);
 motion.walk(e,moved);e.moving=moved>.02;return true;
}
function enemyImpact(e,point){
 const id=e.faction||e.mapKey||activeMap.id;
 const color=factions.colors[id],effect=factions.effects[id];
 s.fx.push({kind:'enemyImpact',phase:'impact',effect,x:point.x,y:point.y,
  color,radius:e.type==='beast'?39:e.type==='boss'?55:24,life:.48,max:.48});
}
function updateFactionRanged(e,dt){
 const cfg=factions.config(e);
 if(e.rangedCast){
  e.rangedCast.left-=dt;
  if(e.rangedCast.left<=0){
   const cast=e.rangedCast;e.rangedCast=null;
   s.enemyShots.push({...cast,phase:'flight',warning:false,sx:e.x,sy:e.y-23,life:.65,max:.65});
  }
 }
 if(e.attack>0)return;
 const target=nearestAlly(e,230,true),point=target||s.wall.attack,d=dist(e,point);
 if(d<=cfg.range&&s.wall.clear(e,point)){
  if(e.cd<=0){
   e.attackSpan=cfg.windup;e.attack=cfg.windup;e.cd=cfg.interval;e.face=point.x>=e.x?1:-1;
   e.rangedCast={x:point.x,y:point.y,left:cfg.windup*.65,radius:cfg.radius,warning:true,
    color:cfg.color,effect:cfg.effect,damage:Math.round(7*s.stage.damage),wall:!target,origin:{x:e.x,y:e.y}};
  }
  return;
 }
 const moved=target?pursueAlly(e,target,dt):advanceToGate(e,e.speed*dt);
 motion.walk(e,moved);e.moving=moved>.02;
}
function updateEnemyProjectiles(dt){
 for(const shot of s.enemyShots){
  shot.life-=dt;
  if(shot.life>0)continue;
  s.fx.push({...shot,phase:'impact',kind:'enemyImpact',life:.5,max:.5});
  if(shot.wall){
   if(dist(shot,s.wall.attack)<=shot.radius+10&&s.wall.clear(shot.origin,s.wall.attack)){
    s.hp-=shot.damage;text(gate.x,gate.y-42,'-'+shot.damage,shot.color);
   }
  }else{
   for(const u of s.units){
    if(u.hp<=0||dist(u,shot)>shot.radius||!s.wall.clear(shot.origin,u))continue;
    u.hp-=shot.damage;u.hit=.22;
    if(['net','sand','frost'].includes(shot.effect))u.slow=Math.max(u.slow||0,1.4);
   }
   if(['spore','ember','lantern'].includes(shot.effect))s.enemyFields.push({...shot,phase:'field',life:2.4,max:2.4});
  }
 }
 s.enemyShots=s.enemyShots.filter(shot=>shot.life>0);
 for(const field of s.enemyFields){
  field.life-=dt;
  if(field.life<=0)continue;
  for(const u of s.units)if(u.hp>0&&dist(u,field)<field.radius&&s.wall.clear(field.origin,u)){
   u.hp-=field.damage*.20*dt;
   if(field.effect==='spore')u.slow=Math.max(u.slow||0,.2);
  }
 }
 s.enemyFields=s.enemyFields.filter(field=>field.life>0);
}
function drawEnemyTelegraphs(){
 const casts=s.enemies.filter(e=>e.hp>0&&e.rangedCast).map(e=>e.rangedCast);
 factions.warnings(x,[...casts,...s.enemyShots,...s.enemyFields],s.time);
 for(const field of s.enemyFields)factions.effect(x,field);
}
function drawEnemyEffects(){
 for(const shot of s.enemyShots)factions.effect(x,shot);
 for(const fx of s.fx)if(fx.kind==='enemyImpact')factions.effect(x,fx);
}

function nearestAlly(e,radius,ground){
 let target=null,near=radius;
 for(const u of s.units){
  const distance=dist(e,u);
  if(u.hp>0&&distance<near&&(!ground||s.wall.clear(e,u))){target=u;near=distance}
 }
 return target;
}
function pursueAlly(e,u,dt){
 return s.wall.advance(e,s.wall.waypoint(e,u),e.speed*dt*(e.poisonUntil>s.time?.65:1)*(e.enraged?1.2:1));
}
function enemies(dt){
 for(let i=s.enemies.length-1;i>=0;i--){
  const e=s.enemies[i];if(e.hp<=0){defeatEnemy(e,i);continue}
  e.cd-=dt;e.flash=Math.max(0,e.flash-dt*5);e.attack=Math.max(0,e.attack-dt);e.hit=Math.max(0,e.hit-dt);e.moving=false;
  const focus=enemyPointerDistance(e)<enemyRadius(e);e.focus=clamp(e.focus+(focus?dt*2:-dt*3),0,1);

  if(e.type==='beast'&&engageTower(e,dt))continue;
  if(e.type==='flyer'){updateFlyer(e,dt);continue}
  if(e.type==='boss'){updateBoss(e,dt);continue}
  if(e.type==='beast'){chargeAnimal(e,dt);continue}
  if(e.role==='ranged'){updateFactionRanged(e,dt);continue}
  if(e.strike){e.strike.delay-=dt;if(e.strike.delay<=0){const target=e.strike.target;e.strike=null;resolveEnemyStrike(e,target)}}
  if(e.attack>0)continue;
  const u=nearestAlly(e,145,true);
  if(u){if(dist(e,u)<38){if(e.cd<=0)beginEnemyAttack(e,u)}else{const moved=pursueAlly(e,u,dt);motion.walk(e,moved);e.moving=moved>.02}}
  else if(!groundAtGate(e,18)){const moved=advanceToGate(e,e.speed*dt);motion.walk(e,moved);e.moving=moved>.02}else if(e.cd<=0)beginEnemyAttack(e)
 }if(s.hp<=0&&!s.over)lose()
}
function holdPost(u,target,arrival,resume){
 if(dist(u,target)>(u.heldPost===target?resume:arrival)){
  if(u.heldPost===target)u.heldPost=null;
  return false;
 }
 u.heldPost=target;u.vx=0;u.vy=0;
 return true;
}
function moveUnit(u,target,dt,cfg,forming=false){
 const waypoint=s.wall.waypoint(u,target);if(!waypoint)return;const dx=waypoint.x-u.x,dy=waypoint.y-u.y,d=Math.hypot(dx,dy);if(d<=.02){u.vx=u.vy=0;return}
 let sx=dx/d,sy=dy/d;
 if(waypoint===target&&(!forming||d>35)&&dist(u,s.wall.gate)>65)s.units.forEach(v=>{if(v===u||v.hp<=0)return;let ox=u.x-v.x,oy=u.y-v.y,n=Math.hypot(ox,oy);if(n<25){if(n<.1){ox=Math.cos(u.phase)*.5;oy=Math.sin(u.phase)*.5;n=.5}const push=(25-n)/25*.65;sx+=ox/n*push;sy+=oy/n*push}});
 const mag=Math.hypot(sx,sy)||1,blend=forming&&waypoint===target&&d<=35?1:1-Math.exp(-dt*10);u.vx=(u.vx||0)+(sx/mag*cfg.speed-(u.vx||0))*blend;u.vy=(u.vy||0)+(sy/mag*cfg.speed-(u.vy||0))*blend;
 const drift={x:u.x+u.vx*dt,y:u.y+u.vy*dt};let moved=s.wall.advance(u,drift,Math.min(d,cfg.speed*dt));
 if(moved<=.02){u.vx=dx/d*cfg.speed;u.vy=dy/d*cfg.speed;moved=s.wall.advance(u,waypoint,cfg.speed*dt)}
 motion.walk(u,moved);u.moving=moved>.02;
}
function spreadIdle(u,dt,cfg){let sx=0,sy=0;s.units.forEach(v=>{if(v===u||v.hp<=0)return;let dx=u.x-v.x,dy=u.y-v.y,n=Math.hypot(dx,dy);if(n<28){if(n<.1){dx=Math.cos(u.phase)*.5;dy=Math.sin(u.phase)*.5;n=.5}sx+=dx/n*(28-n);sy+=dy/n*(28-n)}});if(Math.hypot(sx,sy)>3)moveUnit(u,{x:u.x+sx,y:u.y+sy},dt,{...cfg,speed:Math.min(24,cfg.speed*.6)})}
function attackLine(u,target){return u.type==='archer'||u.type==='mage'||s.wall.clear(u,target)}
function resolveAlliedStrike(u,target){
 const cfg=unitStats(u);if(!attackLine(u,target)||!encounterRules.canTarget(u.type,target)||u.hp<=0||!s.enemies.includes(target)||target.hp<=0||dist(u,target)>cfg.range+(cfg.range<100?22:45))return;
 const impact=enemyEffectPoint(target);target.hp-=cfg.damage*(u.type==='spearman'&&target.type==='beast'?1+boonLevel('hold')*.22:1);target.flash=1;target.hit=.2;s.shake=Math.max(s.shake,u.hero?.25:.12);
 const color=u.hero?cfg.color:null;
 if(u.type==='archer'||u.type==='mage'){const life=u.type==='archer'?.32:.38,px=u.x+u.face*(u.hero?24:18),py=u.y-(u.hero?32:24);s.fx.push({kind:u.type==='archer'?'arrow':'magic',x:px,y:py,vx:(impact.x-px)/life,vy:(impact.y-py)/life,life,max:life,color:color||(u.type==='archer'?'#d7c59e':'#76547f')})}
 else{s.fx.push({kind:u.type==='spearman'?'thrust':'slash',x:target.x,y:target.y,life:.24,max:.24,color:color||(u.type==='spearman'?'#d9e0d4':'#b6372f'),angle:Math.atan2(target.y-u.y,target.x-u.x)});burst(target.x,target.y,color||'#a83b2f',5)}
 if(u.hero||u.type==='mage'){const radius=u.hero?cfg.splash:55,rate=u.hero?cfg.splashRate:.35;s.enemies.forEach(e=>{if(e!==target&&e.hp>0&&encounterRules.canTarget(u.type,e)&&attackLine(u,e)&&dist(e,target)<radius){e.hp-=cfg.damage*rate;e.flash=1;e.hit=.16}})}
 if(u.hero){s.fx.push({kind:'impact',x:target.x,y:target.y,life:.4,max:.4,color});burst(target.x,target.y,color,10)}
 beep(u.type==='mage'?760:u.type==='archer'?610:u.type==='spearman'?330:250,.035);
}
function beginUnitAttack(u,target){
 u.vx=0;u.vy=0;u.face=target.x>=u.x?1:-1;u.attackSpan=motion.duration(u);u.attack=u.attackSpan;u.strike={target,delay:u.attackSpan*.5};
 const interval=u.hero?unitStats(u).interval:u.type==='mage'?1.5:u.type==='archer'?1.15:u.type==='spearman'?1:.75;u.cd=interval/(orderActive(u)?Skills.orderSpeed:1);
}
function units(dt){
 for(let i=s.units.length-1;i>=0;i--){
  const u=s.units[i],cfg=unitStats(u);
  if(u.hp<=0){u.strike=null;burst(u.x,u.y,'#d9d2bd',8);s.units.splice(i,1);if(s.selectedGeneral===u)s.selectedGeneral=null;if(u.hero)assignLeaders(u.type);continue}
  u.slow=Math.max(0,(u.slow||0)-dt);u.displayHp=Math.max(u.hp,(u.displayHp??u.max)+(u.hp-(u.displayHp??u.max))*(1-Math.exp(-dt*8)));u.cd-=dt;u.attack=Math.max(0,u.attack-dt);u.hit=Math.max(0,u.hit-dt);u.moving=false;
  if(u.strike){u.strike.delay-=dt;if(u.strike.delay<=0){const target=u.strike.target;u.strike=null;resolveAlliedStrike(u,target)}}
  if(u.attack>0)continue;
  if(u.role==='medic'){updateMedic(u,dt,cfg);continue}
  const leader=u.leader?.hp>0?u.leader:null,command=u.commandPoint;
  if(command&&!holdPost(u,command,6,13)){moveUnit(u,command,dt,cfg,true);continue}
  if(leader&&dist(u,leader)>65){moveUnit(u,leader,dt,cfg,true);continue}
  const rally=!leader&&!command?u.rally:null;
  if(rally&&!u.rallyArrived&&dist(u,rally)<=6)u.rallyArrived=true;
  const guard=leader||command||u.rally;
  let target=null,d=1e9;
  s.enemies.forEach(e=>{const n=dist(u,e);if(e.hp>0&&encounterRules.canTarget(u.type,e)&&n<d&&(!guard||dist(e,guard)<cfg.range+(leader?40:75))){d=n;target=e}});
  if(!target){
   if(leader){if(!holdPost(u,leader,29,43))moveUnit(u,leader,dt,cfg,true)}
   else if(rally){if(!holdPost(u,rally,6,13))moveUnit(u,rally,dt,cfg,true)}
   else if(!command)spreadIdle(u,dt,cfg);
   continue;
  }
  if(d>cfg.range||!attackLine(u,target)){
   if(leader){
    if(dist(target,leader)<55)moveUnit(u,target,dt,cfg);
    else if(!holdPost(u,leader,29,43))moveUnit(u,leader,dt,cfg,true);
   }else if(!command){
    const post=rally&&!u.rallyArrived?rally:null;
    moveUnit(u,post||target,dt,cfg,!!post);
   }
   continue;
  }
  if(u.cd<=0)beginUnitAttack(u,target);
 }
}
function burst(px,py,color,n){for(let i=0;i<n;i++)s.fx.push({kind:'particle',x:px,y:py,vx:rnd(-60,60),vy:rnd(-75,25),life:rnd(.25,.65),max:.65,color})}function text(px,py,t,color){s.texts.push({x:px,y:py,t,color,life:1.3})}function effects(dt){s.fx.forEach(f=>{if(f.vx!=null){f.x+=f.vx*dt;f.y+=f.vy*dt}if(f.kind==='particle')f.vy+=100*dt;f.life-=dt});s.fx=s.fx.filter(f=>f.life>0);s.texts.forEach(t=>{t.y-=22*dt;t.life-=dt});s.texts=s.texts.filter(t=>t.life>0)}
const lessons=[
 '① 悬停发光的树林，采集一批木材',
 '② 悬停发光的地基，建成剑士营',
 '③ 继续悬停剑士营，招募第一名剑士'
];
function endTraining(completed){
 if(!run||s.training===null)return;
 saveSetting('training',false);s.training=null;s.lessonReady=completed;syncTimer();
}
$('#skipTraining').onclick=()=>endTraining(false);
function updateTraining(){
 if(s.training===null)return;
 if(s.training===0&&s.journal.gathered.wood>0)s.training=1;
 if(s.training===1&&s.buildings.footman)s.training=2;
 if(s.training===2&&s.journal.recruited.footman>0)endTraining(true);
}
function syncBriefing(waiting){
 const panel=$('#trainingPanel'),training=s.training!==null;
 panel.hidden=!run||!waiting||(!training&&!s.lessonReady);
 $('#skipTraining').hidden=!training;
 const label=training?lessons[s.training]:'第一名剑士已就位 · 可继续招兵，或点「跳过准备」开战';
 if($('#trainingText').textContent!==label)$('#trainingText').textContent=label;
 const forecast=$('#waveForecast');
 forecast.hidden=!run||!waiting||training||s.over;
 if(!forecast.hidden){
  const point=waveEntrance(),direction=(point[1]<H*.35?'北':point[1]>H*.62?'南':'')+(point[0]<W*.40?'西':point[0]>W*.62?'东':'');
  const {beasts,flyers}=waveSpecials(),boss=encounterRules.hasBoss(s.stage)&&s.wave===s.stage.waves;
  const regular=waveEnemyCount(s.stage,s.wave),ranged=s.wave>=2?Math.floor((regular+1)/4):0;
  const details=[regular+' 地面',ranged&&factions.names[activeMap.id][1]+' ×'+ranged,beasts&&'冲城兽 ×'+beasts,flyers&&'飞敌 ×'+flyers,boss&&'首领'].filter(Boolean).join(' · ');
  const lesson=!s.endless&&s.wave===1&&s.stage.id===1?'点击空地集结 · Q 放骑将技能':!s.endless&&s.wave===1&&s.stage.id===2?'冲城兽会优先拆塔，提前截击':'';
  const label='来袭 '+(direction||'中路')+' · '+details+(lesson?' · '+lesson:'')+(activeMap.id==='island'&&flyers?' · 飞敌由海侧绕行':'');
  if(forecast.textContent!==label)forecast.textContent=label;
 }
}
function syncTimer(){
 const waiting=s.between>0, remaining=s.over?0:waiting?s.between:Math.max(0,s.stage.duration-s.waveTime);
 const label=s.over?'战斗结束':waiting?(s.wave===1?'首波准备':'波间整备'):remaining>0?'出怪剩余':'清剿余敌';
 const seconds=String(Math.ceil(remaining)).padStart(2,'0');
 if(ui.waveClock.textContent!==seconds)ui.waveClock.textContent=seconds;
 if(ui.waveClockLabel.textContent!==label)ui.waveClockLabel.textContent=label;
 const skip=$('#skipPreparation');skip.hidden=!run||!waiting||s.over||s.training!==null;skip.disabled=paused;syncBriefing(waiting);
}
function sync(){$('#raidAlert').classList.toggle('visible',s.raidAlert>0&&run);ui.gold.textContent=Math.floor(s.gold);ui.wood.textContent=Math.floor(s.wood);ui.foot.textContent=s.units.filter(u=>!u.hero&&u.hp>0&&u.type==='footman').length;ui.arch.textContent=s.units.filter(u=>!u.hero&&u.hp>0&&u.type==='archer').length;ui.spear.textContent=s.units.filter(u=>!u.hero&&u.hp>0&&u.type==='spearman').length;ui.mage.textContent=s.units.filter(u=>!u.hero&&u.hp>0&&u.type==='mage').length;ui.hp.textContent=Math.max(0,Math.ceil(s.hp));ui.hpBar.style.transform=`scaleX(${clamp(s.hp/s.maxHp,0,1)})`;ui.wave.textContent=s.wave;$('.wave-card strong i').textContent=s.endless?'/ ∞':'/ '+s.stage.waves;$('.wave-card small').textContent=s.endless?'无尽守城':s.stage.chapter+'-'+s.stage.tier+' · '+s.stage.title;ui.enemies.textContent=`${s.enemies.length} 敌军`;syncTimer();document.querySelector('.castle-life>span').textContent='城墙 Lv.'+s.loadout.wall+' · '+s.maxHp+'生命';syncCommands();syncField();syncBoss();syncFrontierBattle()}
function lose(early=false){if(s.over)return;s.over=true;s.won=false;setBattleRunning(false);syncTimer();cancelTool();settleBattle(false,early);$('#resultEyebrow').textContent=activeMap.name+' · '+s.stage.chapter+'-'+s.stage.tier;$('#resultTitle').textContent=early?'本局已结算':'营地失守';$('#resultStars').textContent=s.endless?'守住 '+(s.wave-1)+' 波 · 最高 '+frontier.best+' 波':'守到第 '+s.wave+' / '+s.stage.waves+' 波';$('#score').textContent='击退 '+s.kills+' 名敌军 · '+(early?'已按本局进度结算':'休整升级，再守此关');$('#nextLevelBtn').classList.add('hidden');$('#againBtn').textContent=s.endless?'再战无尽 ↻':'重试本关 ↻';$('#saveNotice').textContent=profileSaveFailed?'浏览器无法保存升级，当前会话仍可继续':'金币已保存，可在整军备战中升级';$('#endCard').classList.remove('hidden');beep(90,.3)}
function win(){if(s.over)return;s.over=true;s.won=true;setBattleRunning(false);syncTimer();cancelTool();progress=campaign.complete(progress,s.stage.id,s.hp/s.maxHp*100);try{localStorage.setItem(campaign.key,JSON.stringify(progress));saveUnavailable=false}catch{saveUnavailable=true}settleBattle(true);const stars=progress.stars[s.stage.id];$('#resultEyebrow').textContent=activeMap.name+' · '+s.stage.chapter+'-'+s.stage.tier+' '+s.stage.title;$('#resultTitle').textContent=s.stage.id===campaign.levels.length-1?'山河全胜！':'山河无恙 · 此关告捷';$('#resultStars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#score').textContent='城防 '+Math.ceil(s.hp/s.maxHp*100)+'% · 击退 '+s.kills+' 名敌军 · '+s.score+' 战绩';$('#saveNotice').textContent=saveUnavailable||profileSaveFailed?'浏览器未能完整保存，本次会话仍可继续':s.stage.id===2?'第一章告捷：已解锁自由建营与合营':s.stage.id===5?'第二章告捷：已解锁自动采矿、伐木机关':'通关进度与金币已保存';$('#againBtn').textContent='重玩本关 ↻';$('#nextLevelBtn').classList.toggle('hidden',s.stage.id===campaign.levels.length-1);$('#nextLevelBtn').textContent=s.stage.tier===3?'准备下一地图 ➜':'准备下一关 ➜';renderCampaign();$('#endCard').classList.remove('hidden');beep(840,.3)}
function drawSceneFX(){if(window.DisplaySettings?.value.quality==='low')return;let tm=(paused?last:performance.now())/1000;if(activeMap.fullPainted){window.PaintedWorld.effects(x,activeMap,tm);return}if(tileScenes.active(activeMap)){tileScenes.effects(x,activeMap,tm);return}x.save();const frame=(px,py)=>activeMap.frame([activeMap.flip?W-px:px,py]);x.lineCap='round';const riverPaths=[[[0,0],[110,0],[140,90],[95,180],[27,260],[0,390]],[[0,535],[160,585],[360,600],[530,625],[540,665],[335,670],[105,620],[0,610]],[[650,595],[915,570],[1145,560],[1250,590],[1280,655],[950,668],[680,674]]];riverPaths.forEach((pts,ri)=>{x.save();x.beginPath();pts.map(([px,py])=>frame(px,py)).forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py));x.closePath();x.clip();for(let i=0;i<16;i++){let px=(i*99+tm*(19+ri*6))%1320-25,py=ri===0?(i*29+tm*8)%420:590+(i*23)%85;x.strokeStyle=activeMap.water;x.globalAlpha=.22+.1*Math.sin(tm*2+i);x.lineWidth=1.6;x.beginPath();x.ellipse(...frame(px,py),10+i%4*5,2.3,0,0,Math.PI);x.stroke()}x.restore()});for(let i=0;i<8;i++){let px=(tm*12+i*169)%1430-80,py=30+Math.sin(tm*.15+i)*12+(i%3)*14;x.globalAlpha=.08;x.fillStyle='#fff8d8';x.beginPath();x.ellipse(px,py,80+i%3*25,9,0,0,Math.PI*2);x.fill()}for(let i=0;i<15;i++){let px=(i*113+tm*(8+i%3))%W,py=(i*71+tm*13+Math.sin(tm+i)*9)%H;x.save();x.translate(px,py);x.rotate(tm+i);x.globalAlpha=.45;x.fillStyle=activeMap.particle;x.beginPath();x.ellipse(0,0,3,1.3,0,0,Math.PI*2);x.fill();x.restore()}x.restore()}
function drawFlag(px,py,color,f){x.save();x.strokeStyle='#302c27';x.lineWidth=3;x.beginPath();x.moveTo(px,py);x.lineTo(px,py+34);x.stroke();let off=f===1?3:f===2?5:f===3?2:0;x.fillStyle=color;x.globalAlpha=.9;x.beginPath();x.moveTo(px+2,py+2);x.quadraticCurveTo(px+13+off,py-2,px+24+off,py+5);x.lineTo(px+19+off,py+16);x.quadraticCurveTo(px+10,py+10,px+2,py+13);x.closePath();x.fill();x.restore()}
function drawBuilding(z){if(z.built&&z.kind!=='machine'&&!activeMap.legacyPainted){const cfg=blueprintFor(z.type),cx=z.x+z.w/2,cy=z.y+z.h/2;window.BattleArt.building(x,z,activeMap,performance.now()/1000,s.units);mapLabel(cfg.name+(z.kind==='troop'?' · '+z.tier+'阶':''),cx,cy+29,'#f1e5be');if(z.kind==='tower')drawTowerHealth(z,cx,cy);return}const cfg=blueprintFor(z.type),cx=z.x+z.w/2,cy=z.y+z.h/2,t=s.time||0;x.save();if(!z.built){x.strokeStyle='#ac9468aa';x.lineWidth=2;x.fillStyle='#fff2ca';x.beginPath();x.ellipse(cx,cy,15,8,0,0,Math.PI*2);x.fill();x.stroke();if(z.paid){x.strokeStyle='#97754c';x.lineWidth=3;x.beginPath();x.moveTo(cx-17,cy+6);x.lineTo(cx-17,cy-19);x.lineTo(cx+17,cy-19);x.lineTo(cx+17,cy+6);x.moveTo(cx-17,cy+2);x.lineTo(cx+17,cy-18);x.stroke();x.strokeStyle='#82a46e';x.lineWidth=2;x.beginPath();x.arc(cx,cy,22,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp((s.progress[z.id]||0)/cfg.time,0,1));x.stroke()}else{x.strokeStyle='#8b9b70';x.beginPath();x.moveTo(cx-4,cy);x.lineTo(cx+4,cy);x.moveTo(cx,cy-4);x.lineTo(cx,cy+4);x.stroke()}x.fillStyle='#6e7f5c';x.font='bold 10px KaiTi,serif';x.textAlign='center';x.fillText(cfg.name+(z.paid?' · 营建中':''),cx,cy+24);x.restore();return}
 if(z.kind==='troop'){const ratio=activeMap.cityScale/.9;x.translate(cx,cy);x.scale(ratio,ratio);x.translate(-cx,-cy)}
 x.globalAlpha=.18;x.fillStyle='#284e46';x.beginPath();x.ellipse(cx+6,cy+13,35,9,-.08,0,Math.PI*2);x.fill();x.globalAlpha=1;const isCamp=z.kind==='troop',sheet=isCamp?buildingSheet:facilitySheet,idx=isCamp?{footman:0,archer:1,spearman:2,mage:3}[z.type]:cfg.cell,size=(isCamp?124+(z.tier-1)*4:cfg.size)*buildingScale;if(sheet.complete&&sheet.naturalWidth){const cw=sheet.naturalWidth/2,ch=sheet.naturalHeight/2;x.globalAlpha=window.BattleArt.opacity(z,s.units,t);x.drawImage(sheet,idx%2*cw,Math.floor(idx/2)*ch,cw,ch,cx-size/2,cy-size*.75,size,size*.96)}
 if(isCamp){drawFlag(cx+31,cy-47,troop[z.type].roof,Math.floor(t*5)%4);x.fillStyle=z.tier>1?'#ab7d36':'#557663';x.font='bold 10px KaiTi,serif';x.textAlign='center';x.fillText(troop[z.type].name+'营 · '+z.tier+'阶',cx,cy+28);if(z.id===s.mergeSource){x.strokeStyle='#e2bc65';x.lineWidth=3;x.beginPath();x.ellipse(cx,cy+10,46,18,0,0,Math.PI*2);x.stroke()}}
 else{if(z.kind==='machine'){x.save();x.translate(cx+10,cy-5);x.rotate(t*2.5);x.strokeStyle='#c5a86c';x.lineWidth=2;x.beginPath();x.arc(0,0,8,0,Math.PI*2);x.moveTo(-8,0);x.lineTo(8,0);x.moveTo(0,-8);x.lineTo(0,8);x.stroke();x.restore()}if(z.fire>0){x.globalAlpha=z.fire*2;x.fillStyle='#ffe6a0';x.beginPath();x.arc(cx+24,cy-34,8,0,Math.PI*2);x.fill();x.globalAlpha=1}x.font='bold 9px KaiTi,serif';x.fillStyle='#648267';x.textAlign='center';x.fillText(cfg.name,cx,cy+25);if(z.kind==='tower')drawTowerHealth(z,cx,cy)}x.restore();
}
function drawPlacement(){if(!s.placement||p.x<0)return;if(!activeMap.legacyPainted){const ghost=blueprintFor(s.placement.type),ghostPlan=placementPlan(s.placement.type,p.x,p.y);window.BattleArt.sprite(x,ghost.kind==='troop'?{footman:0,archer:1,spearman:2,mage:3}[s.placement.type]:s.placement.type==='arrowTower'?4:5,ghostPlan.cx,ghostPlan.cy+16,ghost.kind==='troop'?96*activeMap.cityScale/.9:91,.45);mapLabel(ghostPlan.ok?'点击安放'+ghost.name:ghostPlan.reason,ghostPlan.cx,ghostPlan.cy-90,ghostPlan.ok?'#eef5cd':'#ffd0aa');return}const type=s.placement.type,cfg=blueprintFor(type),plan=placementPlan(type,p.x,p.y),cx=plan.cx,cy=plan.cy,ratio=cfg.kind==='troop'?activeMap.cityScale/.9:1;x.save();x.globalAlpha=.48;const sheet=cfg.kind==='troop'?buildingSheet:facilitySheet,idx=cfg.kind==='troop'?{footman:0,archer:1,spearman:2,mage:3}[type]:cfg.cell;if(sheet.complete&&sheet.naturalWidth){const cw=sheet.naturalWidth/2,ch=sheet.naturalHeight/2;x.drawImage(sheet,idx%2*cw,Math.floor(idx/2)*ch,cw,ch,cx-37*ratio,cy-58*ratio,74*ratio,71*ratio)}x.globalAlpha=.9;x.strokeStyle=plan.ok?'#94be77':'#cb896b';x.lineWidth=2;x.beginPath();x.ellipse(cx,cy+9,44*ratio,17*ratio,0,0,Math.PI*2);x.stroke();x.font='bold 12px KaiTi,serif';x.textAlign='center';x.fillStyle=plan.ok?'#eaf4c9':'#ffe2c2';x.shadowColor='#3f5942';x.shadowBlur=3;x.fillText(plan.ok?'点击安放'+cfg.name:plan.reason,cx,cy-82);x.restore()}
// Give painted props a uniform scale and blend back into the surrounding terrain.
function paintResourceArt(ctx,source,map,resource){
 const {x,y,cx,cy,rx,ry,scale,blendX,blendY}=resource;
 const left=Math.max(0,Math.floor(cx-blendX)),right=Math.min(ctx.canvas.width,Math.ceil(cx+blendX));
 const top=Math.max(0,Math.floor(cy-blendY)),bottom=Math.min(ctx.canvas.height,Math.ceil(cy+blendY));
 const width=right-left,height=bottom-top,patch=ctx.getImageData(left,top,width,height);
 const baseX=Array.from({length:width},(_,col)=>map.horizontal.inverse(left+col+.5)-.5);
 const baseY=Array.from({length:height},(_,row)=>map.vertical.inverse(top+row+.5)-.5);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const dx=left+col+.5-cx,dy=top+row+.5-cy;
  const outer=Math.hypot(dx/blendX,dy/blendY);
  if(outer>=1)continue;
  const inner=Math.hypot(dx/rx,dy/ry);
  const fade=inner<=1?0:clamp((inner-1)/(inner-outer),0,1);
  const weight=1-fade*fade*(3-2*fade);
  const warp=.5+.5*weight;
  const sx=edgeSafeSample(baseX[col],(x+dx/scale-.5-baseX[col])*warp,W-1);
  const sy=edgeSafeSample(baseY[row],(y+dy/scale-.5-baseY[row])*warp,H-1);
  const x0=Math.floor(sx),y0=Math.floor(sy),u=sx-x0,v=sy-y0;
  const x1=Math.min(x0+1,W-1),y1=Math.min(y0+1,H-1);
  const a=4*(y0*W+x0),b=4*(y0*W+x1),c=4*(y1*W+x0),d=4*(y1*W+x1);
  const pixel=4*(row*width+col);
  for(let channel=0;channel<3;channel++){
   const upper=source[a+channel]*(1-u)+source[b+channel]*u;
   const lower=source[c+channel]*(1-u)+source[d+channel]*u;
   const color=upper*(1-v)+lower*v;
   patch.data[pixel+channel]+=(color-patch.data[pixel+channel])*weight;
  }
 }
 ctx.putImageData(patch,left,top);
}
function edgeSafeSample(origin,shift,limit){
 origin=clamp(origin,0,limit);
 const gap=shift<0?origin:limit-origin;
 const t=Math.min(1,gap/(2*Math.abs(shift)+8));
 return origin+shift*t*t*(3-2*t);
}
function frameBackdrop(image,map){
 if(map.fullPainted)return image;
 if(tileScenes.active(map))return tileScenes.backdrop(map);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext?.('2d',{willReadFrequently:true});if(!ctx)return null;
 canvas.width=map.worldWidth||W;canvas.height=map.worldHeight||H;ctx.imageSmoothingQuality='high';
 const h=map.horizontal,v=map.vertical,scaleX=image.naturalWidth/W,scaleY=image.naturalHeight/H;
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const sx=(map.flip?W-h.source[col+1]:h.source[col])*scaleX,sy=v.source[row]*scaleY;
  const sw=(h.source[col+1]-h.source[col])*scaleX,sh=(v.source[row+1]-v.source[row])*scaleY;
  const left=h.screen[col],top=v.screen[row],width=h.screen[col+1]-left,height=v.screen[row+1]-top;
  if(map.flip){ctx.save();ctx.translate(left+width,0);ctx.scale(-1,1);ctx.drawImage(image,sx,sy,sw,sh,0,top,width,height);ctx.restore()}
  else ctx.drawImage(image,sx,sy,sw,sh,left,top,width,height);
 }
 const original=document.createElement('canvas');
 original.width=W;original.height=H;
 const originalCtx=original.getContext('2d',{willReadFrequently:true});
 if(!originalCtx)return canvas;
 originalCtx.imageSmoothingQuality='high';
 if(map.flip){originalCtx.translate(W,0);originalCtx.scale(-1,1)}
 originalCtx.drawImage(image,0,0,W,H);
 const pixels=originalCtx.getImageData(0,0,W,H).data;
 for(const resource of [...map.mines,...map.trees])paintResourceArt(ctx,pixels,map,resource);
 if(map.base)tintFrontier(ctx,map.id);
 return canvas;
}
function drawTowerHealth(tower,cx,cy){
 const fraction=clamp(tower.hp/tower.maxHp,0,1),width=40;
 x.fillStyle='#483f33';x.fillRect(cx-width/2-1,cy-49,width+2,6);
 x.fillStyle=tower.hit>0?'#f5ac75':fraction<.35?'#db775d':'#83bd87';x.fillRect(cx-width/2,cy-48,width*fraction,4);
}
function paintBackdrop(){if(framedBackdrop){x.drawImage(framedBackdrop,0,0,worldWidth(),worldHeight());return}x.save();if(activeMap.flip){x.translate(W,0);x.scale(-1,1)}x.drawImage(bg,0,0,W,H);x.restore()}
function drawWallPiece(piece){if(!bg.complete||!bg.naturalWidth)return;x.save();x.beginPath();piece.points.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y));x.closePath();x.clip();paintBackdrop();x.restore()}
function drawGateDepth(wall){
 const g=wall.gate;x.save();x.translate(g.x,g.y+4);x.rotate(Math.atan2(wall.dir.y,wall.dir.x));x.scale(1,.68);
 const fade=x.createRadialGradient(0,0,2,0,0,28);fade.addColorStop(0,'#26362d4d');fade.addColorStop(1,'#26362d00');
 x.fillStyle=fade;x.beginPath();x.arc(0,0,28,0,Math.PI*2);x.fill();x.restore();
}
function draw(){
 x.setTransform(c.width/W,0,0,c.height/H,0,0);x.save();x.beginPath();x.rect(0,0,W,H);x.clip();view.apply(x);if(shakeOn&&!paused&&s.shake)x.translate(rnd(-5*s.shake,5*s.shake),rnd(-3*s.shake,5*s.shake));const wall=castleRoutes[activeMap.id];
 if(bg.complete&&bg.naturalWidth)paintBackdrop();else{x.fillStyle='#b9d599';x.fillRect(0,0,W,H)}
 drawSceneFX();drawTactics();drawEnemyTelegraphs();drawGateDepth(wall);drawEncounterGround();drawSpellFields();
 const tiled=tileScenes.active(activeMap),sceneTime=(paused?last:performance.now())/1000;
 const layers=tiled?tileScenes.layers(x,activeMap,wall,sceneTime,s.units):wall.occluders.map(piece=>({y:piece.depth,draw:()=>drawWallPiece(piece)})).concat(window.LegacyResources.layers(x,activeMap,sceneTime,s.units));
 zones.filter(z=>!['gold','wood'].includes(z.kind)).forEach(z=>layers.push({y:z.y+z.h/2+19,draw:()=>drawBuilding(z)}));
 s.units.forEach(u=>layers.push({y:u.y+(tiled?0:12),draw:()=>{x.save();if(tiled)x.translate(0,-12);drawUnit(u);x.restore()}}));s.enemies.forEach(e=>layers.push({y:e.type==='flyer'?2000+e.y:e.y+(tiled?0:12),draw:()=>{x.save();if(tiled&&e.faction)x.translate(0,-8);drawEnemy(e);x.restore()}}));
 layers.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());drawEnemyEffects();drawRally();drawAllyBars();drawFX();drawSpellAim();drawPlacement();cursor();x.restore();view.render(framedBackdrop,s.units,s.enemies,zones);
}
function spriteCell(idx,dx,dy,dw,dh,flip=false,sheet=unitSheet){if(!(sheet.complete&&sheet.naturalWidth))return false;let cols=sheet===heroSheet?2:3,sw=sheet.naturalWidth/cols,sh=sheet.naturalHeight/2,sx=(idx%cols)*sw,sy=Math.floor(idx/cols)*sh;x.save();x.translate(dx+(flip?dw:0),dy);x.scale(flip?-1:1,1);x.drawImage(sheet,sx,sy,sw,sh,0,0,dw,dh);x.restore();return true}
function animatedBody(q,idx,size,isEnemy=false){x.save();x.globalAlpha=.23;x.fillStyle='#203c30';x.beginPath();x.ellipse(q.x,q.y+12*actorRatio,size*.22,size*.065,0,0,Math.PI*2);x.fill();x.restore();if(!motion.draw(x,q,size)){spriteCell(idx,q.x-size/2,q.y-size*.65,size,size,(q.face||1)<0,q.hero?heroSheet:unitSheet)}}
function drawTactics(){
 if(!run||s.over)return;
 const {bridge,lava}=activeMap;
 drawFrontierTerrain();
 if(bridge){
  drawSpellRing(bridge.x,bridge.y,31,'#e6ca86',.38);
  mapLabel('栈桥隘口',bridge.x,bridge.y+32,'#fff0c6');
 }
 const phase=lavaPhase();
 if(phase){
  drawSpellRing(lava.x,lava.y,48,phase===2?'#ff663c':'#ffd075',.72);
  mapLabel(phase===2?'熔岩封路 · 敌军绕行':'即将喷发 · 撤离通道',lava.x,lava.y-42,'#ffe2a1');
 }
 if(s.training!==null){
  const zone=zones.find(z=>s.training===0?z.kind==='wood':z.type==='footman');
  if(zone)drawSpellRing(zone.x+zone.w/2,zone.y+zone.h/2,Math.min(55,zone.w*.57),'#fff0ab',.72);
 }else if(s.between>0){
  const [px,py]=waveEntrance(),pulse=Math.sin(s.time*5)*5;
  x.save();x.translate(px,py+pulse);x.fillStyle='#ffe1a1';x.strokeStyle='#704e36';x.lineWidth=2;
  x.beginPath();x.moveTo(-10,-18);x.lineTo(10,-18);x.lineTo(0,0);x.closePath();x.fill();x.stroke();x.restore();
 }
 for(const e of s.enemies){
  if(e.type!=='beast'||e.chargeWait<=0||!liveTower(e.towerTarget))continue;
  const tower=towerCenter(e.towerTarget);
  drawSpellRing(tower.x,tower.y,25,'#ffac75',.62);
  mapLabel('冲城兽瞄准',tower.x,tower.y-49,'#ffe2a1');
 }
}
function mapLabel(label,px,py,color){
 x.save();x.font='bold 12px KaiTi,serif';x.textAlign='center';x.fillStyle=color;x.shadowColor='#302a23';x.shadowBlur=4;x.fillText(label,px,py);x.restore();
}
function drawRally(){
 if(!run)return;
 const t=s.time;
 if(s.rally)drawRallyFlag(s.rally,'#598366',t);
 for(const u of s.units){
  if(u.hero&&u.hp>0&&u.commandPoint)drawRallyFlag(u.commandPoint,u.role==='captain'?s.captainKit.color:generals[u.type].color,t);
 }
}
function drawRallyFlag({x:px,y:py},color,t){
 x.save();x.strokeStyle='#b7d295';x.globalAlpha=.7;x.lineWidth=2;x.beginPath();
 x.ellipse(px,py+10,24+Math.sin(t*3)*3,9,0,0,Math.PI*2);x.stroke();x.restore();
 drawFlag(px,py-26,color,Math.floor(t*7)%4);
}
function drawUnit(u){if(u.role){drawFrontierUnit(u);return}const idx={footman:0,archer:1,spearman:2,mage:3}[u.type];if(u.hero){x.save();x.strokeStyle=s.selectedGeneral===u?'#ffe0a0':generals[u.type].color;x.lineWidth=s.selectedGeneral===u?3:2;x.globalAlpha=.55+.15*Math.sin(performance.now()/300);x.beginPath();x.ellipse(u.x,u.y+11*actorRatio,20*actorRatio,7*actorRatio,0,0,Math.PI*2);x.stroke();x.restore()}if(orderActive(u)){x.save();x.strokeStyle=generals[u.type].color;x.lineWidth=2;x.globalAlpha=.70;x.beginPath();x.ellipse(u.x,u.y+9*actorRatio,16*actorRatio,6*actorRatio,0,0,Math.PI*2);x.stroke();x.restore()}animatedBody(u,idx,(u.hero?98:74)*actorScale,false);if(s.selectedGeneral&&u.leader===s.selectedGeneral){x.save();x.fillStyle=generals[u.type].color;x.beginPath();x.arc(u.x,u.y+10,3,0,Math.PI*2);x.fill();x.restore()}if(u.hero){x.save();x.font='bold 10px KaiTi,serif';x.textAlign='center';x.fillStyle='#fff1bf';x.shadowColor='#493b27';x.shadowBlur=3;x.fillText('✦ '+generals[u.type].name,u.x,u.y-64*actorRatio);x.restore()}}
function drawAllyHealth(u,focused=false){if(u.hp<=0||!Number.isFinite(u.max)||u.max<=0)return;const ratio=clamp(u.hp/u.max,0,1),trail=clamp((u.displayHp??u.hp)/u.max,ratio,1),width=Math.round((u.hero?(focused?54:46):(focused?40:32))*actorRatio),height=focused?5:4,px=Math.round(u.x-width/2),py=Math.round(u.y-(u.hero?53:43)*actorRatio);x.save();x.globalAlpha=focused||ratio<1?1:.65;x.shadowColor='#253e3d44';x.shadowBlur=3;x.fillStyle='#fff3d6';x.beginPath();x.roundRect(px-1,py-1,width+2,height+2,3);x.fill();x.shadowBlur=0;x.fillStyle='#34594dcc';x.beginPath();x.roundRect(px,py,width,height,2);x.fill();if(trail>ratio+.005){x.fillStyle='#e7cb88';x.fillRect(px,py,width*trail,height)}x.fillStyle=ratio>.6?'#65a97a':ratio>.3?'#dcaf4e':'#d76e56';if(ratio>0){x.beginPath();x.roundRect(px,py,Math.max(1,width*ratio),height,Math.min(2,width*ratio/2));x.fill()}if(focused){x.globalAlpha=1;x.font='bold 10px "Microsoft YaHei",sans-serif';x.textAlign='center';x.fillStyle='#fff5d6';x.shadowColor='#294339';x.shadowBlur=3;x.fillText(unitName(u)+' '+Math.ceil(Math.max(0,u.hp))+'/'+u.max,u.x,py-6)}x.restore()}
function drawAllyBars(){const focused=hoveredAlly();x.save();if(tileScenes.active(activeMap))x.translate(0,-12);s.units.forEach(u=>drawAllyHealth(u,u===focused));x.restore()}
function drawEnemy(e){if(e.type==='boss'){drawBoss(e);return}const flying=e.type==='flyer',size=e.faction?factions.config(e).size:(flying?flyerTypes[e.mapKey].size:e.type==='beast'?beastTypes[e.animalKey].size:e.type==='brute'?92:74)*actorScale;if(e.faction)factions.draw(x,e,s.time);else if(flying)drawFlyer(e);else if(e.type==='beast')drawBeast(e);else animatedBody(e,e.type==='brute'?5:4,size,true);if(flying||e.type==='beast'||e.hp<e.max||e.focus){const aim=enemyAim(e),py=flying?aim.y-size*.42-6:e.y-size*.65-8;const width=38*actorRatio;x.fillStyle='#fff3c9dd';x.beginPath();x.roundRect(e.x-width/2,py,width,5,3);x.fill();x.fillStyle=e.focus?'#eab75a':flying?flyerTypes[e.mapKey].color:'#c76a4d';x.beginPath();x.roundRect(e.x-width/2+1,py+1,(width-2)*clamp(e.hp/e.max,0,1),3,2);x.fill();if(e.faction&&e.focus)mapLabel(factions.config(e).name,e.x,py-7,'#fff0c6');if(flying){x.font='bold 9px KaiTi,serif';x.textAlign='center';x.fillStyle='#fff0c6';x.shadowColor='#364b3e';x.shadowBlur=2;x.fillText('空',e.x+width/2+6,py+5);x.shadowBlur=0}}}
function drawFX(){s.fx.forEach(f=>{if(f.kind==='enemyImpact')return;let a=clamp(f.life/(f.max||.34),0,1);x.save();x.globalAlpha=a;x.shadowColor=f.color;x.shadowBlur=f.kind==='magic'?15:5;if(f.kind==='lightning'){x.strokeStyle=f.color;x.lineWidth=5*a;x.beginPath();f.path.forEach((pt,i)=>{if(i===0){x.moveTo(pt.x,pt.y);return}const last=f.path[i-1];x.lineTo((last.x+pt.x)/2+9,(last.y+pt.y)/2-7);x.lineTo(pt.x,pt.y)});x.stroke();x.strokeStyle='#edf9ff';x.lineWidth=1.5;x.stroke()}else if(f.kind==='heal'){x.strokeStyle=f.color;x.lineWidth=2;x.beginPath();x.ellipse(f.x,f.y+24,18+(1-a)*10,6+(1-a)*3,0,0,Math.PI*2);x.stroke();x.lineWidth=3;x.beginPath();x.moveTo(f.x-4,f.y-(1-a)*15);x.lineTo(f.x+4,f.y-(1-a)*15);x.moveTo(f.x,f.y-4-(1-a)*15);x.lineTo(f.x,f.y+4-(1-a)*15);x.stroke()}else if(f.kind==='impact'){x.strokeStyle=f.color;x.lineWidth=4*a;x.beginPath();x.ellipse(f.x,f.y,12+(1-a)*48,6+(1-a)*20,0,0,Math.PI*2);x.stroke()}else if(f.kind==='arrow'||f.kind==='cursor'){x.strokeStyle=f.color;x.lineWidth=f.kind==='cursor'?5:3;x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x-f.vx*.035,f.y-f.vy*.035);x.stroke();if(f.kind==='cursor'){x.fillStyle='#fff8c9';x.fillRect(f.x-3,f.y-3,6,6)}}else if(f.kind==='shell'){x.fillStyle='#7e6047';x.beginPath();x.arc(f.x,f.y,5,0,Math.PI*2);x.fill();x.strokeStyle=f.color;x.lineWidth=2;x.beginPath();x.moveTo(f.x,f.y);x.lineTo(f.x-f.vx*.04,f.y-f.vy*.04);x.stroke()}else if(f.kind==='magic'){let r=6+(1-a)*8;x.fillStyle='#f6dcff';x.beginPath();x.arc(f.x,f.y,r,0,Math.PI*2);x.fill();x.strokeStyle=f.color;x.lineWidth=3;x.beginPath();x.arc(f.x,f.y,r+5,performance.now()/120,performance.now()/120+4.5);x.stroke()}else if(f.kind==='slash'){x.translate(f.x,f.y);x.rotate(f.angle||0);x.strokeStyle=f.color;x.lineWidth=7;x.beginPath();x.arc(0,0,24,-1.05,1.05);x.stroke();x.strokeStyle='#fff7c8';x.lineWidth=2;x.stroke()}else if(f.kind==='thrust'){x.translate(f.x,f.y);x.rotate(f.angle||0);x.strokeStyle=f.color;x.lineWidth=5;x.beginPath();x.moveTo(-28,0);x.lineTo(22,0);x.stroke();x.fillStyle='#fff';x.beginPath();x.moveTo(25,0);x.lineTo(14,-6);x.lineTo(14,6);x.closePath();x.fill()}else{x.fillStyle=f.color;x.fillRect(f.x-2,f.y-2,4,4)}x.restore()});s.texts.forEach(t=>{x.globalAlpha=clamp(t.life,0,1);x.fillStyle=t.color;x.font='900 16px Consolas';x.textAlign='center';x.shadowColor='#111322';x.shadowBlur=2;x.fillText(t.t,t.x,t.y);x.textAlign='left';x.shadowBlur=0;x.globalAlpha=1})}
function cursor(){
 if(!run||p.x<0||s.placement||s.spellAim)return;
 const {a}=workTarget(),t=(paused?last:performance.now())/1000;
 x.save();x.translate(p.x,p.y);x.shadowColor='#25372b';x.shadowBlur=2;
 if(!a||s.mergeMode||a.built&&a.kind==='tower'){
  x.strokeStyle='#f6edce';x.lineWidth=2;x.beginPath();for(const sign of [-1,1]){x.moveTo(sign*13,0);x.lineTo(sign*5,0);x.moveTo(0,sign*13);x.lineTo(0,sign*5)}x.stroke();x.restore();return;
 }
 const reason=a.kind==='troop'&&a.built?recruitBlockReason(a.type):'';
 if(reason){x.strokeStyle='#e4a083';x.lineWidth=2;x.beginPath();x.arc(0,0,10,0,Math.PI*2);x.moveTo(-7,7);x.lineTo(7,-7);x.stroke();x.font='bold 12px KaiTi,serif';x.textAlign='center';x.fillStyle='#ffe2bd';x.fillText(aliveTroops(a.type)>=troopCapacity(a.type)?'兵员已满':'材料不足',0,28);x.restore();return}
 const resource=a.kind==='gold'||a.kind==='wood',rate=resource?a.rate:a.built?troop[a.type].rate:blueprintFor(a.type).time,progress=clamp((s.progress[a.id]||0)/rate,0,1);
 x.fillStyle='#263b2acc';x.fillRect(-20,23,40,5);x.fillStyle='#f1cb74';x.fillRect(-20,23,40*progress,5);
 if(resource){
  x.rotate(-.45+Math.sin(t*10*workRate(a.kind==='gold'?'mine':'wood'))*.55);x.strokeStyle='#704526';x.lineWidth=6;x.beginPath();x.moveTo(-2,18);x.lineTo(2,-14);x.stroke();x.strokeStyle='#dfe3d5';x.fillStyle='#c9d0c8';x.lineWidth=3;
  if(a.kind==='wood'){x.beginPath();x.moveTo(1,-17);x.lineTo(17,-13);x.lineTo(15,-3);x.lineTo(1,-8);x.closePath();x.fill();x.stroke()}else{x.beginPath();x.moveTo(-14,-11);x.quadraticCurveTo(1,-22,18,-10);x.stroke()}
 }else if(!a.built){x.rotate(Math.sin(t*10)*.4);x.strokeStyle='#704526';x.lineWidth=6;x.beginPath();x.moveTo(0,18);x.lineTo(0,-12);x.stroke();x.fillStyle='#aab0ae';x.fillRect(-13,-17,26,8)}
 else{const wave=Math.sin(t*7)*3;x.strokeStyle='#eadfbd';x.lineWidth=4;x.beginPath();x.moveTo(-7,19);x.lineTo(-7,-20);x.stroke();x.fillStyle=troop[a.type].roof;x.beginPath();x.moveTo(-5,-18);x.quadraticCurveTo(8+wave,-13,19,-17);x.lineTo(18,1);x.quadraticCurveTo(7+wave,5,-5,0);x.closePath();x.fill()}
 x.restore();
}
function drawWeather(){if(window.DisplaySettings?.value.quality==='low'||activeMap.id==='mountain')return;let t=performance.now()/1000;x.save();x.fillStyle=activeMap.particle;for(let i=0;i<30;i++){let px=(i*127+t*(activeMap.id==='desert'?48:12))%W,py=(i*73-t*(activeMap.id==='volcano'?22:activeMap.id==='forest'?2:-5)+H*100)%H;x.globalAlpha=(activeMap.id==='forest'?.35:.2)+Math.sin(t+i)*.15;x.beginPath();x.ellipse(px,py,activeMap.id==='desert'?7:2,activeMap.id==='desert'?1:2,0,0,Math.PI*2);x.fill()}x.restore()}
function battleStage(base,difficulty,endless,wave){
 const scale=endless?1+Math.min(4,(wave-1)*.105):1;
 return {...base,
  health:(endless?1.07:base.health)*difficulty.health*scale,
  damage:(endless?.94:base.damage)*difficulty.damage*(endless?1+Math.min(2,(wave-1)*.065):1),
  speed:(endless?1:base.speed)*difficulty.speed,
  countScale:difficulty.count,
  preparation:endless?40:base.preparation,rest:endless?14:base.rest,
  gold:endless?280:base.gold,wood:endless?190:base.wood
 };
}
const frontierPanel=$('#frontierPanel'),boonPanel=$('#boonPanel');
$('#stage').insertAdjacentHTML('beforeend','<aside id="captainTools" class="captain-tools" hidden><button type="button" id="captainSkill"></button></aside><p id="frontierStory" class="frontier-story" hidden></p>');
const captainSkillButton=$('#captainSkill'),medicButton=$('#hireMedic');
$('#frontierBtn').onclick=()=>{if(run)return;renderFrontier();frontierPanel.showModal()};
$('#closeFrontier').onclick=()=>frontierPanel.close();
captainSkillButton.onclick=castCaptainSkill;
medicButton.onclick=hireMedic;
function setText(node,value){if(node.textContent!==value)node.textContent=value}
function renderFrontier(){
 const card=(title,description,control)=>'<div class="frontier-card"><strong>'+title+'</strong><small>'+description+'</small>'+control+'</div>';
 const heroCards=Object.entries(F.heroes).map(([id,h])=>{
  const unlocked=F.unlocked(h,progress),chosen=frontier.hero===id;
  return card(h.name+' · '+h.title,h.skill+' · '+h.description,
   '<button type="button" data-hero="'+id+'" '+(!unlocked||chosen?'disabled':'')+'>'+(chosen?'已选':unlocked?'选用':'通关 '+(h.unlock===2?'1-3':'2-3')+' 解锁')+'</button>');
 }).join('');
 const gearCards=Object.entries(F.equipment).map(([id,item])=>{
  const owned=frontier.owned.includes(id),equipped=frontier.gear[item.slot]===id;
  return card(item.name+' · '+F.slots[item.slot]+(item.rare?' · 稀有':''),item.description,
   '<button type="button" data-gear="'+id+'" '+(!owned&&(item.rare||profile.coins<item.price)?'disabled':'')+'>'+(equipped?'卸下':owned?'装备':item.rare?'对局掉落':item.price+' 金币购买')+'</button>');
 }).join('');
 $('#frontierOptions').innerHTML='<p class="frontier-balance">局外金币 '+profile.coins+' · 无尽纪录 '+frontier.best+' 波</p><h3>难度</h3><div class="frontier-difficulties">'+Object.entries(F.difficulties).map(([id,d])=>'<button type="button" data-difficulty="'+id+'" aria-pressed="'+(frontier.difficulty===id)+'">'+d.name+'</button>').join('')+'</div><h3>出战主角</h3><div class="frontier-grid">'+heroCards+'</div><h3>行装</h3><div class="frontier-grid">'+gearCards+'</div>';
}
function selectFrontierHero(id){
 if(run||!F.heroes[id]||!F.unlocked(F.heroes[id],progress))return {ok:false,reason:'角色尚未解锁'};
 frontier.hero=id;const saved=saveFrontier();return {ok:true,message:'已选用 '+F.heroes[id].name+'，下一局出战'+(saved?'':' · 浏览器未能保存，仅本次会话生效')};
}
function equipFrontierGear(id){
 if(run||!F.equipment[id])return {ok:false,reason:'战斗结束后可以调整行装'};
 const item=F.equipment[id];
 if(!frontier.owned.includes(id)){
  if(item.rare)return {ok:false,reason:'此行装可在对局结算时掉落'};
  if(profile.coins<item.price)return {ok:false,reason:'局外金币不足'};
  profile.coins-=item.price;frontier.owned.push(id);persistProfile();
 }
 frontier.gear[item.slot]=frontier.gear[item.slot]===id?null:id;const saved=saveFrontier();
 return {ok:true,message:(frontier.gear[item.slot]?'已装备 ':'已卸下 ')+item.name+'，下一局生效'+(saved?'':' · 浏览器未能保存，仅本次会话生效')};
}
$('#frontierOptions').onclick=e=>{
 const b=e.target.closest('button');if(!b||b.disabled||run)return;
 const {hero,difficulty,gear}=b.dataset;
 if(hero)selectFrontierHero(hero);
 if(difficulty&&F.difficulties[difficulty]){frontier.difficulty=difficulty;saveFrontier()}
 if(gear)equipFrontierGear(gear);
 renderFrontier();
};
function recordFrontier(won){
 const waves=won?s.stage.waves:s.wave-1;
 if(s.endless)frontier.best=Math.max(frontier.best,waves);
 const drop=F.loot(frontier,{won,endless:s.endless,waves});
 if(drop)frontier.owned.push(drop);
 saveFrontier();return drop;
}
function spawnCaptain(){
 const kit=s.captainKit;
 s.captain=makeUnit(kit.id==='outrider'?'archer':'footman',true,null,'captain');
}
function castCaptainSkill(){
 const u=s?.captain,kit=s?.captainKit;
 if(!run||paused||s.over||!u||u.hp<=0||(u.skillAt||0)>s.time)return false;
 const allies=kit.id==='warden';
 const targets=(allies?s.units:s.enemies).filter(target=>target.hp>0&&dist(u,target)<(kit.id==='outrider'?180:112)&&
  (allies?target.hp<target.max:kit.id==='outrider'||target.type!=='flyer')&&
  (target.type==='flyer'||s.wall.clear(u,target)));
 if(!targets.length){ui.tip.textContent='技能范围内暂无目标';return false}
 for(const target of targets){
  if(allies)healFromSupport(target,35,kit.color);
  else{target.hp-=kit.id==='vanguard'?80:58;target.hit=.22;target.flash=1;if(kit.id==='outrider')target.poisonUntil=s.time+3}
 }
 u.skillAt=s.time+Math.max(6,kit.cooldown-boonLevel('captain')*2);
 s.fx.push({kind:'impact',x:u.x,y:u.y,life:.8,max:.8,color:kit.color});
 text(u.x,u.y-59,kit.skill,kit.color);beep(440,.1);return true;
}
function medicCount(){return aliveTroops('medic')}
function canHireMedic(){return progress.stars[2]>0||s.endless}
function hireMedic(){
 if(!run||paused||s.over||!canHireMedic()||medicCount()>=3||s.gold<64||s.wood<45)return false;
 s.gold-=64;s.wood-=45;const u=makeUnit('medic',false,null,'medic');s.journal.recruited.medic=(s.journal.recruited.medic||0)+1;
 text(u.x,u.y-36,'牧师入阵','#a9e5bb');sync();return true;
}
function healFromSupport(unit,amount,color){
 const restored=Math.min(amount,unit.max-unit.hp);
 unit.hp+=restored;
 if(restored>0){text(unit.x,unit.y-44,'+'+Math.round(restored),color);s.fx.push({kind:'heal',x:unit.x,y:unit.y-20,life:.55,max:.55,color})}
}
function updateMedic(u,dt,cfg){
 const wounded=s.units.filter(ally=>ally!==u&&ally.hp>0&&ally.hp<ally.max&&dist(ally,u)<=cfg.range&&s.wall.clear(u,ally)).sort((a,b)=>a.hp/a.max-b.hp/b.max);
 if(wounded.length&&u.cd<=0){
  const level=boonLevel('medic');
  wounded.slice(0,level?2:1).forEach(ally=>healFromSupport(ally,14+level*3,'#a9e5bb'));
  u.cd=3.8;u.attack=.38;return;
 }
 const post=u.rally||s.captain;
 if(post&&(post.hp===undefined||post.hp>0)&&!holdPost(u,post,u.rally?6:52,u.rally?13:68))moveUnit(u,post,dt,cfg,true);
}
function syncFrontierBattle(){
 const tools=$('#captainTools'),u=s.captain,remaining=u?Math.max(0,Math.ceil((u.skillAt||0)-s.time)):0;
 tools.hidden=!run||s.over;
 if(tools.hidden){$('#frontierStory').hidden=true;return}
 setText(captainSkillButton,u?.hp>0?s.captainKit.skill+' · '+(remaining?remaining+'秒':'Q'):s.captainKit.name+' 已阵亡');
 captainSkillButton.title=s.captainKit.description;
 captainSkillButton.disabled=paused||!u||u.hp<=0||remaining>0;
 const medics=medicCount(),unlocked=canHireMedic();
 setText($('#medicLabel'),unlocked?'牧师 '+medics+'/3':'通关 1-3 解锁');
 medicButton.disabled=paused||!unlocked||medics>=3||s.gold<64||s.wood<45;
 const story=$('#frontierStory'),note=F.chapterNotes[s.stage.id];
 story.hidden=s.endless||s.wave!==1||s.between<=0||!note;
 if(!story.hidden)setText(story,note);
}
function boonLevel(id){return s.boons[id]||0}
function openBoons(){
 s.offeredBoons=F.choices(s.boons,s.wave-1);
 const owned=Object.entries(s.boons).map(([id,count])=>F.boons[id].name+' ×'+count);
 $('#boonSummary').textContent='已守住 '+(s.wave-1)+' 波 · 选一项补给再迎接下一波'+(owned.length?' ｜ 已选 '+owned.join('、'):'');
 $('#boonChoices').innerHTML=s.offeredBoons.map(id=>'<button type="button" data-boon="'+id+'"><strong>'+F.boons[id].name+'</strong><small>'+F.boons[id].desc+'</small></button>').join('');
 setPaused(true);boonPanel.showModal();
}
function pickBoon(id){
 if(!run||!s.endless||!s.offeredBoons?.includes(id))return false;
 s.offeredBoons=null;
 if(id==='stock'){s.gold+=75;s.wood+=55}
 else if(id==='repair')s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.2);
 else{
  s.boons[id]=boonLevel(id)+1;
  if(id==='shield')for(const u of s.units){
   if(u.hero||u.hp<=0)continue;
   const next=unitStats(u).hp;u.hp+=next-u.max;u.max=next;
  }
 }
 if(boonPanel.open)boonPanel.close();
 setPaused(false);sync();return true;
}
$('#boonChoices').onclick=e=>{const b=e.target.closest('[data-boon]');if(b)pickBoon(b.dataset.boon)};
boonPanel.addEventListener('cancel',e=>e.preventDefault());
$('#finishEndless').onclick=()=>{if(!s.offeredBoons)return;s.offeredBoons=null;boonPanel.close();setPaused(false);lose(true)};
function tintFrontier(ctx,id){
 const scene=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
 for(let i=0;i<scene.data.length;i+=4){
  const r=scene.data[i],g=scene.data[i+1],b=scene.data[i+2],gray=.23*r+.59*g+.18*b;
  if(id==='frost'){
   scene.data[i]=.25*r+.68*gray+19;scene.data[i+1]=.24*g+.77*gray+17;scene.data[i+2]=.22*b+.84*gray+24;
  }else{
   scene.data[i]=.25*r+.51*gray;scene.data[i+1]=.28*g+.58*gray+7;scene.data[i+2]=.38*b+.62*gray+18;
  }
 }
 ctx.putImageData(scene,0,0);
}
function updateFrontierTerrain(dt){
 const zone=activeMap.hazard;
 if(!zone)return;
 if(activeMap.id==='frost'&&s.between<=0&&s.waveTime%16>=7&&s.waveTime%16<12){
  for(const u of s.units)if(u.hp>0&&dist(u,zone)<105)u.slow=Math.max(u.slow,.22);
 }
 if(activeMap.id==='mist'){
  for(const e of s.enemies)if(e.hp>0&&!e.mistBoost&&e.type==='raider'&&dist(e,zone)<110){e.speed*=1.35;e.mistBoost=true}
 }
}
function drawFrontierTerrain(){
 const zone=activeMap.hazard;if(!zone)return;
 const frost=activeMap.id==='frost',wind=s.between<=0&&s.waveTime%16>=7&&s.waveTime%16<12;
 drawSpellRing(zone.x,zone.y,96,frost?'#d9f5ff':'#c2dba9',frost?(wind?.68:.25):.32);
 mapLabel(frost?(wind?'风雪 · 我军减速':'霜风谷'):'雾路 · 敌方斥候加速',zone.x,zone.y-44,'#fff5d5');
}
function drawFrontierEnemy(e){
 x.save();x.translate(e.x,e.y);x.scale(e.face||1,1);
 const frost=e.variant==='frost';
 const bob=e.moving?Math.sin(s.time*13+e.phase)*1.5:0;
 x.translate(0,bob);
 if(frost){
  x.fillStyle='#a4d3e6';x.strokeStyle='#466274';x.lineWidth=1.5;
  x.beginPath();x.moveTo(4,-23);x.lineTo(15,-18);x.lineTo(13,-6);x.lineTo(7,-2);x.lineTo(2,-9);x.closePath();x.fill();x.stroke();
  x.strokeStyle='#eaf8ff';x.beginPath();x.moveTo(7,-18);x.lineTo(11,-8);x.stroke();
 }else{
  x.fillStyle='#3e6958';x.beginPath();x.moveTo(0,-26);x.lineTo(-12,-13);x.lineTo(-7,-6);x.lineTo(3,-14);x.closePath();x.fill();
  x.fillStyle='#c7e68f';x.beginPath();x.arc(4,-23,2.4,0,Math.PI*2);x.fill();
 }
 x.restore();
}
function drawFrontierUnit(u){
 if(u.role==='medic'){window.BattleArt.healer(x,u,s.time);return}
 if(u.role==='captain'&&window.WardrobeArt?.draw(x,u,s.captainKit,s.appearance,s.time,66)){mapLabel(s.captainKit.name,u.x,u.y-65,s.selectedGeneral===u?'#ffe098':'#fff0c6');return}
 const captain=u.role==='captain',kit=s.captainKit,t=s.time;
 const stride=u.moving?Math.sin(t*(captain?13:10)+u.phase):0;
 const rise=Math.abs(stride)*2;
 x.save();
 x.globalAlpha=.27;x.fillStyle='#1e3d38';x.beginPath();x.ellipse(u.x,u.y+9,captain?23:10,captain?6:4,0,0,Math.PI*2);x.fill();
 x.globalAlpha=u.hit>0?.70:1;x.translate(u.x,u.y-rise);x.scale(u.face||1,1);
 if(captain){
  x.strokeStyle='#46362f';x.lineWidth=4;x.lineCap='round';
  for(const side of [-1,1]){
   x.beginPath();x.moveTo(side*11,-10);x.lineTo(side*13+side*stride*5,1);x.lineTo(side*14+side*stride*8,8);x.stroke();
  }
  x.fillStyle='#93684c';x.beginPath();x.ellipse(-1,-12,22,10,-.08,0,Math.PI*2);x.fill();
  x.fillStyle='#ac7e59';x.beginPath();x.ellipse(16,-22,8,11,.45,0,Math.PI*2);x.fill();
  x.fillStyle='#704d3a';x.beginPath();x.ellipse(23,-23,8,4,.08,0,Math.PI*2);x.fill();
  x.fillStyle='#412f28';x.fillRect(18,-33,3,6);x.fillRect(22,-28,2,2);
  x.strokeStyle='#573e31';x.lineWidth=3;x.beginPath();x.moveTo(-21,-12);x.quadraticCurveTo(-31,-9+stride*3,-29,-1+stride*4);x.stroke();
  x.fillStyle=kit.dye||kit.color;x.beginPath();x.moveTo(-2,-35);x.lineTo(-22,-21+stride*4);x.lineTo(-4,-17);x.closePath();x.fill();
  x.fillStyle='#c8a778';x.fillRect(-8,-28,16,8);
  const swing=u.attack>0?Math.sin((1-u.attack/(u.attackSpan||1))*Math.PI)*.8:0;
  x.save();x.translate(6,-29);x.rotate(-swing);x.strokeStyle='#e7dfbc';x.lineWidth=2;
  x.beginPath();x.moveTo(0,3);x.lineTo(kit.id==='outrider'?8:15,-12);x.stroke();x.restore();
 }else{
  x.strokeStyle='#3c5149';x.lineWidth=3;x.beginPath();x.moveTo(-4,-10);x.lineTo(-4+stride*4,2);x.moveTo(4,-10);x.lineTo(4-stride*4,2);x.stroke();
  x.fillStyle='#e4e1b6';x.beginPath();x.moveTo(-6,-22);x.lineTo(6,-22);x.lineTo(10,-3);x.lineTo(-10,-3);x.closePath();x.fill();
  x.strokeStyle='#705638';x.lineWidth=2;x.beginPath();x.moveTo(11,-3);x.lineTo(11,-27);x.stroke();
  x.fillStyle='#89d1a0';x.beginPath();x.arc(11,-28,4,0,Math.PI*2);x.fill();
 }
 const head=captain?-37:-25;
 x.fillStyle='#edc39d';x.beginPath();x.arc(0,head,5.5,0,Math.PI*2);x.fill();
 x.fillStyle=captain?'#3c4e4c':'#587b68';x.beginPath();x.ellipse(0,head-4,7,3.8,0,0,Math.PI*2);x.fill();
 x.fillStyle='#283d36';x.fillRect(3,head-1,1.5,1.5);
 x.restore();
 if(captain)mapLabel(kit.name,u.x,u.y-60,s.selectedGeneral===u?'#ffe098':'#fff0c6');
}
function animateReview(dt){s.time+=dt;s.demoTime=(s.demoTime||0)+dt;[...s.units,...s.enemies].forEach(q=>{const t=(s.demoTime+(q.phase||0)*.12)%4.6,oldX=q.x;q.moving=t<2.2;q.attackSpan=motion.duration(q);q.attack=t>=2.2&&t<3.8?q.attackSpan-((t-2.2)%q.attackSpan):0;q.x=q.originX+(q.moving?Math.sin(t/2.2*Math.PI*2)*18:0);if(q.moving)motion.walk(q,Math.abs(q.x-oldX))});ui.tip.textContent=s.encounterDemo?'上排飞行兽 · 下排决战首领 · 逐帧动作预览':'逐帧动作预览 · 上排普通兵 / 下排将领 · 最右侧为敌军'}
function loop(now){let elapsed=Math.min(Math.max(0,(now-last)/1000),1);last=now;view.update(Math.min(elapsed,.1),run&&!paused&&!s.over);if(p.x>=0&&p.sx!==undefined){const pos=view.world(p.sx,p.sy);p.x=pos.x;p.y=pos.y}while(elapsed>.000001&&run&&!paused){const dt=Math.min(elapsed,.035);if(s.animationDemo)animateReview(dt);else step(dt);elapsed-=dt}if(window.DisplaySettings?.frameReady(now)!==false){draw();drawWeather()}requestAnimationFrame(loop)}wardrobeUI=window.WardrobeUI?new window.WardrobeUI({frontier:()=>frontier,progress:()=>progress,coins:()=>profile.coins,allowed:()=>!run,hero:selectFrontierHero,gear:equipFrontierGear}):null;metaUI=new window.MetaUI({profile:()=>profile,progress:()=>progress,stage:()=>campaign.levels[selectedLevel],allowed:()=>!run,purchase:purchaseUpgrade,claim:claimAchievement,wardrobe:()=>wardrobeUI?.open({onReturn:()=>metaUI.open()}),warning:()=>profileSaveFailed?'浏览器无法保存升级，当前会话内仍可使用':''});reset();const requestedMap=new URLSearchParams(location.search).get('map');chooseMap(requestedMap||campaign.levels[selectedLevel].mapId);requestAnimationFrame(loop);if(new URLSearchParams(location.search).get('wardrobe')==='1')metaUI.openWardrobe();
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('review')==='art'){startCard.classList.add('hidden');$('#stage').classList.add('playing');Object.keys(s.buildings).forEach(type=>s.buildings[type]=true);zones.filter(z=>z.kind==='troop').forEach(z=>z.built=true);Object.keys(troop).forEach((type,i)=>{const cfg=troop[type];s.units.push({type,x:470+i*62,y:395+i%2*40,hp:Math.ceil(cfg.hp*[1,.65,.4,.2][i]),max:cfg.hp,cd:0,face:1,phase:i,moving:true,attack:0,hit:0})});ui.tip.textContent='己方血条预览 · 健康 / 受伤 / 濒危';sync()}
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('review')==='beasts'){startCard.classList.add('hidden');$('#stage').classList.add('playing');Object.keys(s.buildings).forEach(type=>s.buildings[type]=true);zones.filter(z=>z.kind==='troop').forEach(z=>z.built=true);Object.keys(beastTypes).forEach((animalKey,i)=>{const cfg=beastTypes[animalKey];s.enemies.push({type:'beast',animalKey,x:590+i%3*180,y:310+Math.floor(i/3)*135,hp:cfg.hp,max:cfg.hp,cd:0,flash:0,focus:0,phase:i,moving:true,attack:0,hit:0,face:1,chargeWait:0});text(590+i%3*180,265+Math.floor(i/3)*135,cfg.name,cfg.color)});ui.tip.textContent='五地图冲城兽 · 美术预览';}
if(["localhost","127.0.0.1"].includes(location.hostname)&&new URLSearchParams(location.search).get("review")==="commands"){(async()=>{await chooseMap("mountain");start();s.between=9999;s.gold=1200;s.wood=1000;Object.keys(s.buildings).forEach(type=>s.buildings[type]=true);zones.filter(z=>z.kind==='troop').forEach(z=>z.built=true);Object.keys(troop).forEach((type,i)=>{for(let j=0;j<3;j++){const u=makeUnit(type);u.x=505+i*85;u.y=330+j*65;u.hp=Math.ceil(u.max*(.4+j*.25))}});sync()})()}
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('review')==='motion'){(async()=>{await chooseMap('mountain');start();s.animationDemo=true;s.gold=1200;s.wood=1000;Object.keys(s.buildings).forEach(type=>s.buildings[type]=true);zones.filter(z=>z.kind==='troop').forEach(z=>z.built=true);Object.keys(troop).forEach((type,i)=>{for(const hero of [false,true]){const u=makeUnit(type,hero);u.x=510+i*128;u.originX=u.x;u.y=hero?442:292;u.phase=i}});['raider','brute'].forEach((type,i)=>s.enemies.push({type,x:1050,originX:1050,y:i?442:292,hp:500,max:500,cd:0,flash:0,focus:0,phase:1,moving:true,attack:0,hit:0,face:-1}));sync()})()}
if(['localhost','127.0.0.1'].includes(location.hostname)&&['workshop','systems'].includes(new URLSearchParams(location.search).get('review'))){(async()=>{for(let id=0;id<6;id++)progress=campaign.complete(progress,id,100);profile=Meta.read(null,progress);profile.coins=1600;profile.levels.wall=6;profile.levels.oreMachine=2;profile.levels.woodMachine=2;await chooseMap('forest');if(new URLSearchParams(location.search).get('review')==='workshop'){metaUI.open();return}selectedLevel=6;start();s.gold=1200;s.wood=1000;s.between=99999;Object.keys(troop).forEach((type,i)=>{const u=makeUnit(type);u.x=600+i*65;u.y=350});sync()})()}
if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('review')==='encounters'){(async()=>{for(let id=0;id<14;id++)progress=campaign.complete(progress,id,100);await chooseMap('forest');selectedLevel=8;start();s.animationDemo=true;s.encounterDemo=true;s.gold=900;s.wood=700;Object.keys(flyerTypes).forEach((mapKey,i)=>{const cfg=flyerTypes[mapKey];s.enemies.push({type:'flyer',mapKey,x:590+i*200,originX:590+i*200,y:245,hp:cfg.hp,max:cfg.hp,phase:i,attack:0,hit:0,flash:0,focus:0,face:1})});Object.keys(bossTypes).forEach((mapKey,i)=>{const cfg=bossTypes[mapKey];s.enemies.push({type:'boss',mapKey,x:480+i*210,originX:480+i*210,y:445,hp:cfg.hp,max:cfg.hp,phase:i,attack:0,hit:0,flash:0,focus:0,face:1,walkPhase:0})});s.bossSpawned=true;ui.tip.textContent='三种飞行兽与四方决战首领 · 造型预览';sync();dockDrawer.setOpen(false)})()}

if(['localhost','127.0.0.1'].includes(location.hostname)&&new URLSearchParams(location.search).get('review')==='factions'){
 (async()=>{
  const id=new URLSearchParams(location.search).get('map')||'island';
  await chooseMap(id);selectedLevel=maps.findIndex(m=>m.id===id)*3;start('endless');
  s.between=99999;s.captain.hp=0;s.units.length=0;s.time=3;s.wave=2;
  s.gold=s.wood=500;dockDrawer.setOpen(false);
  const [entryX,entryY]=activeMap.spawns[0];
  const centers=[[500,275],[700,340],[900,405]];
  for(let row=0;row<3;row++){
   const [px,py]=centers[row];
   if(row===2)spawnAnimal();else{s.raidersSent=row===1?2:0;spawn()}
   const enemy=s.enemies.at(-1);Object.assign(enemy,{x:px,y:py,hp:100000,max:100000,cd:0,chargeWait:0,face:1});
   if(row===2){const tower={id:'review-tower',kind:'tower',type:'arrowTower',name:'弓箭塔',x:px+62-48,y:py-32,w:96,h:64,built:true,hp:100000,maxHp:100000,cd:9999};zones.push(tower)}
   else{const ally=makeUnit('footman',false,{x:px+60,y:py});ally.hp=ally.max=100000;ally.damage=0;ally.cd=99999;ally.commandPoint={x:ally.x,y:ally.y}}
  }
  sync();
 })();
}
if(['localhost','127.0.0.1'].includes(location.hostname)&&['overview','fortress'].includes(new URLSearchParams(location.search).get('review'))){
 (async()=>{await chooseMap('mountain');start('endless');s.between=99999;s.gold=s.wood=3000;
 for(const [i,type] of Object.keys(troop).entries()){const pos=activeMap.plots[i],camp=tryPlace(type,...pos);if(camp)construct(type,camp);const u=makeUnit(type,false,{x:pos[0]+30,y:pos[1]+20});u.commandPoint={x:u.x,y:u.y}}
 hireMedic();const medic=s.units.find(u=>u.role==='medic');if(medic){medic.x=s.wall.innerDoor.x-25;medic.y=s.wall.innerDoor.y-30;medic.rally={x:medic.x,y:medic.y}}sync();dockDrawer.setOpen(false);if(new URLSearchParams(location.search).get('review')==='fortress')issueRally(gate.x+400,gate.y-40);
 })();
}
})();
