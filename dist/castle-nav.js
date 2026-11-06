(function(root){'use strict';
const EPS=1e-6,point=([x,y])=>({x,y}),add=(a,b,n=1)=>({x:a.x+b.x*n,y:a.y+b.y*n}),sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),dot=(a,b)=>a.x*b.x+a.y*b.y,cross=(a,b)=>a.x*b.y-a.y*b.x,distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function unit(p){const n=Math.hypot(p.x,p.y)||1;return {x:p.x/n,y:p.y/n}}
function normal(a,b){return unit({x:b.y-a.y,y:a.x-b.x})}
function offset(poly,amount){return poly.map((p,i)=>{const a=normal(poly[(i+poly.length-1)%poly.length],p),b=normal(p,poly[(i+1)%poly.length]);return add(p,add(a,b),amount/(1+dot(a,b)))})}
function inside(poly,p){return poly.every((a,i)=>cross(sub(poly[(i+1)%poly.length],a),sub(p,a))>=-EPS)}
// Clip a movement segment to a convex polygon, using distances along the segment.
function interval(poly,a,b){let enter=0,exit=1;for(let i=0;i<poly.length;i++){const p=poly[i],edge=sub(poly[(i+1)%poly.length],p),v=cross(edge,sub(a,p)),delta=cross(edge,sub(b,a));if(Math.abs(delta)<EPS){if(v< -EPS)return null;continue}const at=-v/delta;if(delta>0)enter=Math.max(enter,at);else exit=Math.min(exit,at);if(enter>exit+EPS)return null}return [enter,exit]}
function nearestEdge(poly,p){let best=null,d=Infinity;poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],edge=sub(b,a),t=Math.max(0,Math.min(1,dot(sub(p,a),edge)/dot(edge,edge))),q=add(a,edge,t),r=distance(q,p);if(r<d){d=r;best={q,normal:normal(a,b)}}});return best}
function create(map){
 const scale=map.cityScale||1;
 const inner=map.courtyard.map(point),outer=offset(inner,27*scale),gate=point(map.gate),edge=nearestEdge(inner,gate),at=edge.q,dir=edge.normal,side={x:-dir.y,y:dir.x};
 const innerDoor=add(at,dir,-29*scale),outerDoor=add(at,dir,48*scale),attack=add(at,dir,52*scale);
 const portal=[[-34,-29],[60,-29],[60,29],[-34,29]].map(([depth,width])=>add(add(at,dir,depth*scale),side,width*scale));
 const interior=p=>inside(inner,p),walkable=p=>interior(p)||!inside(outer,p)||inside(portal,p);
 function clear(a,b){const hit=interval(outer,a,b);if(!hit||hit[1]-hit[0]<EPS)return true;const allowed=[interval(inner,a,b),interval(portal,a,b)].filter(Boolean).sort((u,v)=>u[0]-v[0]);let t=hit[0];for(const [from,to] of allowed){if(from<=t+EPS)t=Math.max(t,to);if(t>=hit[1]-EPS)return true}return false}
 const nodes=[innerDoor,outerDoor,...offset(inner,37*scale)],links=nodes.map((p,i)=>nodes.map((q,j)=>i!==j&&clear(p,q)?distance(p,q):Infinity));
 function route(start,end){if(!walkable(end))return [];if(clear(start,end))return [end];const n=nodes.length,dist=nodes.map(p=>clear(start,p)?distance(start,p):Infinity),prev=Array(n).fill(-1),seen=new Set();let endNode=-1,cost=Infinity;
  for(let i=0;i<n;i++){let j=-1;for(let k=0;k<n;k++)if(!seen.has(k)&&dist[k]<(j<0?Infinity:dist[j]))j=k;if(j<0||dist[j]>=cost)break;seen.add(j);if(clear(nodes[j],end)&&dist[j]+distance(nodes[j],end)<cost){endNode=j;cost=dist[j]+distance(nodes[j],end)}for(let k=0;k<n;k++){const c=dist[j]+links[j][k];if(c<dist[k]){dist[k]=c;prev[k]=j}}}
  if(endNode<0)return [];const out=[end];for(let j=endNode;j>=0;j=prev[j])out.unshift(nodes[j]);return out;
 }
 function waypoint(entity,target){if(clear(entity,target)){entity.wallRoute=null;return target}let cache=entity.wallRoute;if(!cache||distance(cache.goal,target)>20||!cache.path.length||!clear(entity,cache.path[0]))cache=entity.wallRoute={goal:{x:target.x,y:target.y},path:route(entity,target)};while(cache.path.length>1&&distance(entity,cache.path[0])<3&&clear(entity,cache.path[1]))cache.path.shift();return cache.path[0]||null}
 function advance(entity,to,max){if(!to)return 0;const d=distance(entity,to),length=Math.min(d,max);if(length<=EPS)return 0;const next=add(entity,sub(to,entity),length/d);if(!walkable(next)||!clear(entity,next))return 0;const dx=next.x-entity.x;entity.x=next.x;entity.y=next.y;if(Math.abs(dx)>.03)entity.face=dx>0?1:-1;return length}
 function egress(x,y,blocked){const ratio=scale/.9,options=[[0,37],[0,-37],[54,0],[-54,0],[40,34],[-40,34],[40,-34],[-40,-34]].map(([dx,dy])=>({x:x+dx*ratio,y:y+dy*ratio}));return options.filter(p=>interior(p)&&!blocked(p)).sort((a,b)=>distance(a,innerDoor)-distance(b,innerDoor))[0]||innerDoor}
 const occluders=[];
 inner.forEach((a,i)=>{const b=inner[(i+1)%inner.length],n=normal(a,b);if(n.y<.2)return;const footA=add(a,n,38*scale),footB=add(b,n,38*scale);occluders.push({depth:(footA.y+footB.y)/2,points:[{x:a.x,y:a.y-9*scale},{x:b.x,y:b.y-9*scale},footB,footA]})});
 occluders.push({depth:gate.y+2,points:[[-31,-72],[31,-72],[31,-13],[-31,-13]].map(([dx,dy])=>({x:gate.x+dx*scale,y:gate.y+dy*scale}))});
 return {inner,outer,portal,gate,innerDoor,outerDoor,attack,dir,interior,walkable,clear,route,waypoint,advance,egress,occluders};
}
root.CastleNav={create};
})(typeof window!=='undefined'?window:globalThis);
