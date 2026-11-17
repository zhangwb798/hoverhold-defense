(function(root){'use strict';
 const key='hoverhold-display-v1',qualityValues=['low','medium','high'],resolutions=['auto','1280','1600','1920'],sizes=['fit','90','80'];
 function read(raw){let value;try{value=JSON.parse(raw)}catch{}return {quality:qualityValues.includes(value?.quality)?value.quality:'medium',resolution:resolutions.includes(value?.resolution)?value.resolution:'auto',size:sizes.includes(value?.size)?value.size:'fit'}}
 function dimensions(value,width,dpr=1){const ceiling={low:1280,medium:1600,high:1920}[value.quality],desired=value.resolution==='auto'?Math.min(ceiling,width*dpr):Number(value.resolution),w=desired>1600?1920:desired>1280?1600:1280;return {width:w,height:w/16*9}}
 root.DisplayRules={read,dimensions};
 let value;try{value=read(localStorage.getItem(key))}catch{value=read(null)}
 const $=q=>document.querySelector(q),canvas=$('#game'),controls=$('#displaySettings');let lastFrame=-Infinity;
 function apply(){
  document.body.classList.add('display-managed');document.documentElement.style.setProperty('--view-scale',value.size==='fit'?'1':String(Number(value.size)/100));
  const rect=canvas.getBoundingClientRect(),size=dimensions(value,rect.width,root.devicePixelRatio||1);
  if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height}
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=value.quality==='low'?'low':'high';
  for(const field of ['quality','resolution','size'])$('#display-'+field).value=value[field];
  $('#displaySummary').textContent='渲染 '+size.width+' × '+size.height+' · 画面保持 16:9 · 设置自动保存';
 }
 controls.addEventListener('change',event=>{const field=event.target.dataset.display;if(!field)return;value=read(JSON.stringify({...value,[field]:event.target.value}));try{localStorage.setItem(key,JSON.stringify(value))}catch{}lastFrame=-Infinity;apply()});
 $('#fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('#displaySummary').textContent='当前浏览器不支持全屏，可使用画面尺寸调整'}catch{$('#displaySummary').textContent='当前浏览器未能进入全屏，可使用画面尺寸调整'}};
 root.addEventListener('resize',apply);document.addEventListener('fullscreenchange',()=>{$('#fullscreenBtn').textContent=document.fullscreenElement?'退出全屏':'进入全屏';apply()});
 if(root.ResizeObserver)new ResizeObserver(apply).observe($('#stage'));
 function frameReady(now){if(document.body.classList.contains('home-visible'))return false;const fps={low:30,medium:45,high:60}[value.quality];if(now-lastFrame<1000/fps-.5)return false;lastFrame=now;return true}
 root.DisplaySettings={get value(){return value},apply,frameReady};apply();
})(window);
