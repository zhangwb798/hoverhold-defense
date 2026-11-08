(() => {
  'use strict';
  const pages = [
    { label:'第一关', title:'第一次守城，从这里开始', intro:'选「云山营地 → 1-1 初守」，再点「挑战」。第一关守住 8 波就能过关。', body:`
      <ol class="guide-steps">
        <li><strong>先建一座剑士营</strong><p>进入战场后，把鼠标停在城内的剑士营地基上，等进度条走完。若已解锁自由建营，点底部「营建 → 剑士营」，点击城内空地放地基，再悬停完成建造。</p></li>
        <li><strong>招几名剑士，再补弓手</strong><p>继续悬停建好的剑士营，每完成一次进度就招一名兵。先招 2–3 名剑士，再建弓手营，用剑士挡敌、弓手从后方输出。</p></li>
        <li><strong>趁准备时间补资源</strong><p>右下角默认有 30 秒首波准备。鼠标移到矿洞挖矿、移到树林砍树。材料充足就回营继续招兵；波间还有 12 秒可补给。准备好后可以在右下角点「跳过准备」，提前开始当前波。</p></li>
        <li><strong>开战后盯住城门</strong><p>士兵会自行迎敌。鼠标指向敌人可补伤害，指向受伤的己方士兵可治疗。冲城兽一出现就优先处理，别等它撞门。</p></li>
      </ol><aside class="guide-tip"><b>第一局的小目标</b><p>先学会「采集 → 建营 → 招兵」这个循环。城墙生命归零会失败；最后一波清完后结算。</p></aside>` },
    { label:'鼠标操作', title:'把鼠标停在目标上', intro:'采集、建造、招兵、治疗和协攻主要靠悬停，不需要连续点击。开始菜单上的树林和矿洞只是背景。', body:`
      <dl class="guide-glossary">
        <div><dt>悬停矿洞 / 树林</dt><dd>光标变成铁镐 / 斧头，进度走完收一次资源。顶部资源栏显示局内矿石、木材和现役兵力。</dd></div>
        <div><dt>悬停地基 / 已建兵营</dt><dd>地基需要悬停建造；建成后悬停同一位置招兵。没有足够的矿石或木材时不会出兵。</dd></div>
        <div><dt>悬停己方 / 敌军</dt><dd>对己方受伤单位持续治疗，对敌军持续协助攻击。飞行兽要指向空中的本体，影子不是攻击目标。</dd></div>
        <div><dt>点击空地</dt><dd>设置全军集合点，士兵到达后驻守。选中将领时，改为给该将领下令。设置建造或合营工具时，点击优先用于该工具。</dd></div>
        <div><dt>右键或 Esc</dt><dd>退出建造选址或合营。上方「Ⅱ」暂停或继续，「↻」重开本关，「山河图」返回选关。</dd></div>
      </dl><aside class="guide-tip"><b>看光标和提示</b><p>它们会告诉你鼠标当前在做什么。提示是治疗时，移开一点，重新对准兵营或资源点。</p></aside>` },
    { label:'四种兵', title:'近战挡住，远程输出', intro:'矿石和木材都要留一部分给招兵。四种兵的营地和招募价格不同，可以根据来敌搭配。', body:`
      <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>兵种</th><th>用途</th><th>建营（矿 / 木）</th><th>每名（矿 / 木）</th></tr></thead><tbody>
        <tr><th>剑士</th><td>便宜、走得快，适合开局挡敌</td><td>44 / 26</td><td>22 / 10</td></tr>
        <tr><th>弓手</th><td>生命较低，适合在后排远射，可打飞行兽</td><td>40 / 30</td><td>16 / 18</td></tr>
        <tr><th>枪兵</th><td>生命较高，能在前排稳住阵线</td><td>55 / 34</td><td>28 / 15</td></tr>
        <tr><th>法师</th><td>生命较低，远射带范围伤害，可打飞行兽；从秘法塔招募</td><td>68 / 48</td><td>36 / 25</td></tr>
      </tbody></table></div><aside class="guide-tip"><b>配兵建议</b><p>前两章用近战加弓手过渡。第三章起会有空袭，提前准备弓手或法师。别把所有材料花在营地上，记得留招募费。</p></aside>` },
    { label:'营建城防', title:'兵营进城，塔可出城', intro:'拖动屏幕底部的点将台把手可以收起或展开，点击把手也能切换。「营建」「城防」「机关」分别管理不同建筑。', body:`
      <h3>兵营与合营</h3><p>尚未通关第一章时，用城内现成的地基。通关第一章后，可以在「营建」选择兵营种类，点击城内空地放置，再悬停建成。靠近预设地基时会自动对齐。整块地基必须在城墙内，留出城门通道。</p><p>点「合营」后依次选择两座<strong>同兵种、同阶、已建成</strong>的兵营，合成一座更高阶的兵营，出兵更快，最高四阶。每种普通士兵默认最多 20 名同时在场。该兵种有二阶兵营时，上限为 30；有三阶或四阶兵营时，上限为 40。阵亡会腾出名额。</p>
      <h3>弓箭塔和炮塔</h3><p>城墙 Lv.3 解锁弓箭塔（90 矿 / 60 木），Lv.6 解锁炮塔（150 矿 / 110 木）。两者可建在城外空地；放下地基后仍需悬停建成。弓箭塔可对空，炮塔擅长打成群的地面敌军。建成后有独立血条，会被冲城兽优先攻击，其他敌军优先攻击附近的我方单位，生命耗尽时被拆毁。</p>
      <h3>自动采集机关</h3><p>通关第二章后解锁。采矿机关（110 矿 / 75 木）放在矿区；伐木机关（85 矿 / 100 木）放在树林。建成后自动产出，同一资源点只能放一台。可在局外升级效率。</p>` },
    { label:'点将集结', title:'让部队从城门出击', intro:'城墙有碰撞，地面部队会走城门进出。把集合点放在开阔地，留出部队绕行的时间。', body:`
      <h3>怎么召唤将领</h3><ol class="guide-numbered"><li>同一种普通士兵至少有 <strong>10 名在场</strong>。</li><li>准备 <strong>220 矿石、160 木材</strong>，在底部「点将」点击对应将领。</li><li>将领名额按兵种单独计算。该兵种有一阶兵营可召唤一名，有二阶或以上兵营可召唤两名。</li></ol>
      <h3>怎么发动军令</h3><p>召唤后点击该将领下方的「发动军令」。同兵种普通士兵获得 8 秒增益，伤害提高 28%，攻击频率提高 20%。每名将领冷却 20 秒，同兵种增益不可叠加。</p><h3>怎么调动和救人</h3><p>普通兵会跟随同兵种将领，有两位时分成两队。点击战场上的将领，跟队士兵会亮起同色标记。再点空地即可调动该队。按 Esc 取消选中后，点空地可下达全军集合令。将领和普通兵都有血条，鼠标悬停在受伤单位身上即可治疗。</p><aside class="guide-tip"><b>实战做法</b><p>把近战与远程集中在城门外的开阔处。首领技能出现预警时，尽早把集合点移到亮圈外。</p></aside>` },
    { label:'敌军首领', title:'认清冲城兽、空袭和 Boss', intro:'15 关的敌人血量、伤害和移速逐关提高。每章的初守、鏖战、决战分别要守 8、12、16 波。', body:`
      <dl class="guide-glossary">
        <div><dt>地面冲城兽</dt><dd>每张地图都有不同的冲城兽，会快速绕墙冲向城门。看到急袭提示就用部队和光标集中攻击。</dd></div>
        <div><dt>飞行兽</dt><dd>前两章不会出现。第三章森林有獠蝠，第四章火山有飞蜥，第五章荒漠有毒蝎。用弓手、法师、弓箭塔或光标对空。</dd></div>
        <div><dt>决战首领</dt><dd>第二章起，各章第三关的最后一波会出现专属 Boss。看顶部血条和地面的技能预警；半血后首领会狂怒。击败首领并清完剩余敌军才算通关。</dd></div>
        <div><dt>右下角倒计时</dt><dd>「首波准备」和「波间整备」表示下波前的时间；「出怪剩余」归零后仍要清掉现有敌人，不能放松。</dd></div>
      </dl>` },
    { label:'光标术法', title:'击杀攒点，再瞄准释放', intro:'每局技能点从 0 开始，上限 30。击杀普通敌军得 1 点、重甲和飞行兽 2 点、冲城兽 3 点、首领 8 点。', body:`
      <p>点底部「术法」选技能，也可直接按数字键 1–4。把准星移到目标处，左键释放。右键或 Esc 可以取消瞄准，不扣点。</p>
      <dl class="guide-glossary">
        <div><dt>1 · 治疗法阵（4 点）</dt><dd>持续 6 秒，治疗范围内的己方士兵与将领。把阵放在己方驻守的位置。</dd></div>
        <div><dt>2 · 毒药法阵（5 点）</dt><dd>持续 6 秒，伤害并减速进入法阵的地面敌军。放在冲城兽必经的城门外。</dd></div>
        <div><dt>3 · 火球（6 点）</dt><dd>对落点附近的地面敌军造成一次范围伤害。敌人聚在一起时最有效。</dd></div>
        <div><dt>4 · 雷电（7 点）</dt><dd>打击准星附近的敌军，再向周围连锁，最多命中三名敌人。可以直接瞄准空中的飞行兽。</dd></div>
      </dl><aside class="guide-tip"><b>局外强化</b><p>在「整军备战 → 光标术法」用金币分别提升四种术法的威力和范围。费用仍由战场技能点支付。</p></aside>` },
    { label:'金币成就', title:'打一局，整一次军', intro:'局内矿石和木材用于打这一局；局外金币用于升级，跟着存档走。两种资源用途不同。', body:`
      <h3>金币怎么来</h3><p>战斗胜负结算时都会按战绩发金币，通关还有额外奖励。击杀敌人计入战绩与成就，不再掉局内矿石或木材；守完一波仍有补给。</p>
      <h3>升级先买什么</h3><p>在开始界面右上角打开「整军备战」。可以升级光标采集、建造、招兵、攻击和治疗，也可以升级城墙、四个兵种及机关。在「开局储备」可加开场矿石、木材和首波备战时间。</p><p>开场矿石每级加 20，木材每级加 15，首波准备每级加 5 秒（最高 75 秒）。升级从下一局生效；不改变波间 12 秒的间隔。</p>
      <h3>怎么领成就</h3><p>左上角「成就」可直接打开 48 项任务。第一次召唤将领、单局累计招募同种士兵 5／15／25／50 名、营建、守城和首次施法都能解锁奖励。战后记录进度，完成后点「领取」，每项只能领一次。</p>` },
    { label:'常见问题', title:'卡住时，先查这几件事', intro:'遇到操作没有反应，先看右下角倒计时、屏幕提示和底部按钮的状态。', body:`
      <dl class="guide-glossary">
        <div><dt>建了地基却没有士兵？</dt><dd>先悬停地基把营地建完，再继续悬停招兵。还要检查矿石、木材是否足够。</dd></div>
        <div><dt>为什么不能在这里放兵营？</dt><dd>必须放在城墙内，并避开城门和其他建筑。绿色预览可放，提示不可放时移动位置。备战时，右下角显示来袭方向和特殊敌军。城外可以放弓箭塔或炮塔。</dd></div>
        <div><dt>将领按钮为什么是灰色？</dt><dd>看是否有同种普通士兵至少 10 名、材料是否够，以及该兵种将领席位是否已满。</dd></div>
        <div><dt>倒计时到 00 还不通关？</dt><dd>可能仍有地面敌人、飞行兽或 Boss 存活。看右下敌军数量和顶部首领血条。</dd></div>
        <div><dt>怎么解锁下一关？</dt><dd>碧海孤岛的地面军会经过栈桥隘口，2-3 的飞敌则从海侧绕行。赤焰火山封路前会预警，喷发时地面敌军绕行，留在熔岩中的单位会受伤。守住当前关卡的全部波次就能解锁下一关。遇到决战首领时，还要击败首领才算通关。</dd></div>
      </dl><aside class="guide-tip"><b>现在可以去打第一局了</b><p>回到选关，选「云山营地 → 1-1 初守」。跟着战场提示采木、建剑士营并招出第一名剑士。引导结束后，备战倒计时才开始。</p></aside>` }
  ];

  const $ = id => document.getElementById(id);
  const launch = $('guideBtn'), dialog = $('beginnerGuide'), nav = $('guideNav'), content = $('guideContent');
  const previous = $('guidePrev'), next = $('guideNext'), close = $('guideClose'), count = $('guideCount');
  let current = 0;
  nav.innerHTML = pages.map((p, i) => `<button type="button" data-guide-page="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${p.label}</button>`).join('');
  const links = [...nav.querySelectorAll('[data-guide-page]')];

  function show(index, focus = false) {
    current = index;
    const p = pages[index];
    links.forEach((link, i) => i === index ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    content.innerHTML = `<div class="guide-eyebrow">第 ${index + 1} 章 · ${p.label}</div><h3 id="guidePageTitle" tabindex="-1">${p.title}</h3><p class="guide-intro">${p.intro}</p>${p.body}`;
    content.scrollTop = 0;
    count.textContent = `${index + 1} / ${pages.length}`;
    previous.disabled = index === 0;
    next.textContent = index === pages.length - 1 ? '返回选关' : '下一章 →';
    if (focus) $('guidePageTitle').focus({ preventScroll:true });
  }

  launch.addEventListener('click', () => { if (!dialog.open) { show(current); dialog.showModal(); } });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => launch.focus({ preventScroll:true }));
  nav.addEventListener('click', event => { const button = event.target.closest('[data-guide-page]'); if (button) show(Number(button.dataset.guidePage), true); });
  previous.addEventListener('click', () => { if (current > 0) show(current - 1, true); });
  next.addEventListener('click', () => { if (current === pages.length - 1) dialog.close(); else show(current + 1, true); });
})();
