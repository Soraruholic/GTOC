(()=>{'use strict';
const data=window.LINE_ATLAS,en=window.ATLAS_EN,t=(zh,eng)=>en?eng:zh;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let route=data.routes[0],selected='feed';
function detail(id){
 const n=route.nodes.find(x=>x.id===id)||route.nodes[0];selected=n.id;
 document.querySelectorAll('[data-atlas-node]').forEach(el=>{el.classList.toggle('selected',el.dataset.atlasNode===selected);el.setAttribute('aria-pressed',String(el.dataset.atlasNode===selected));});
 document.getElementById('atlas-node-select').value=selected;
 const label=en?n.nameEn:n.name;
 let content=`<div class="eyebrow">${esc(n.kind)} / ${esc(route.id)}</div><h3>${esc(label)}</h3>`;
 if(!en)content+=`<dl><dt>需要什么</dt><dd>${esc(n.input)}</dd><dt>应得到什么</dt><dd>${esc(n.output)}</dd><dt>继续的门槛</dt><dd>${esc(n.check)}</dd></dl><details><summary>机理、条件与速率分析</summary><p>${esc(n.chemistry)}</p><p>${esc(n.conditions)}</p><p>${esc(n.rate)}</p></details>`;
 else content+='<p>Follow this stage in the station guide for actual feed, conditions, timing and residuals. Graph edges show net process handoff; they do not establish a microscopic mechanism or industrial yield.</p>';
 content+=`<p><a href="${esc(en?n.href.replace('#step-','#'):n.href)}">${t('打开这一站的操作与分析 →','Open the station guide →')}</a></p><p>`+n.reactions.map(r=>`<a href="wiki.html#reaction-${esc(r)}">${esc(r)}</a>`).join(' · ')+'</p>';
 if(n.id==='waste')content+=`<p>${t('回收候选先进入分类暂存；未知组成进入隔离。','Recovery candidates stay on hold; unknown compositions enter quarantine.')}</p>`;
 document.getElementById('atlas-detail').innerHTML=content;
}
function draw(){
 const svg=document.getElementById('atlas-svg');if(!svg)return;
 const max=Math.max(...route.nodes.map(n=>n.x)),rows=Math.max(...route.nodes.map(n=>n.y));
 const width=(max+1)*184+24,height=(rows+1)*120+50;
 svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.width='100%';
 const nodes=Object.fromEntries(route.nodes.map(n=>[n.id,n]));
 let s='<title>'+t('总合成路线图','Synthesis route map')+'</title><defs><marker id="atlas-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" style="fill:#859b94;stroke:none"/></marker></defs>';
 for(const [from,to] of route.edges){const a=nodes[from],b=nodes[to],right=b.x>=a.x;let x1=20+a.x*184+(right?150:0),y1=35+a.y*120+32,x2=20+b.x*184+(right?0:150),y2=35+b.y*120+32;const side=b.kind==='waste'||Math.abs(a.x-b.x)>2;let path;
  if(a.x===b.x){x1=20+a.x*184+75;x2=x1;y1=35+a.y*120+(b.y>a.y?64:0);y2=35+b.y*120+(b.y>a.y?0:64);if(Math.abs(a.y-b.y)>1){const lane=x1+96;path=`M${x1} ${y1} H${lane} V${y2-14} H${x2} V${y2}`;}else path=`M${x1} ${y1} L${x2} ${y2}`;}
  else if(Math.abs(a.x-b.x)>2){x1=20+a.x*184+75;x2=20+b.x*184+75;y1=35+a.y*120;y2=35+b.y*120;const lane=from==='feed'&&to==='c6'?12:23;path=`M${x1} ${y1} V${lane} H${x2+94} V${y2-12} H${x2} V${y2}`;}
  else if(a.y!==b.y){const down=b.y>a.y;x1=20+a.x*184+75;x2=20+b.x*184+75;y1=35+a.y*120+(down?64:0);y2=35+b.y*120+(down?0:64);path=`M${x1} ${y1} V${y1+(down?18:-18)} H${x2-92} V${y2+(down?-12:12)} H${x2} V${y2}`;}
  else {const mid=(x1+x2)/2;path=`M${x1} ${y1} H${mid} V${y2} H${x2}`;}
  s+=`<path class="${side?'side-stream':''}" d="${path}" marker-end="url(#atlas-arrow)"/>`;}
 const colors={source:'#dceae3',reaction:'#d4e9e4',separation:'#f2e4c5',product:'#e4ddec',waste:'#f3dfd7'};
 for(const n of route.nodes){const name=en?n.nameEn:n.name;const parts=name.length>23?[name.slice(0,23),name.slice(23)]:[name];s+=`<g class="route-node" data-atlas-node="${n.id}" role="button" tabindex="0" aria-label="${esc(name)}" aria-pressed="false" transform="translate(${20+n.x*184},${35+n.y*120})"><rect width="150" height="64" rx="9" fill="${colors[n.kind]}" stroke="#97b3a6"/><text x="10" y="${parts.length===1?36:27}">${parts.map((v,i)=>`<tspan x="10" dy="${i?17:0}">${esc(v)}</tspan>`).join('')}</text></g>`;}
 svg.innerHTML=s;
 document.getElementById('atlas-node-select').innerHTML=route.nodes.map(n=>`<option value="${n.id}">${esc(en?n.nameEn:n.name)}</option>`).join('');
 svg.querySelectorAll('[data-atlas-node]').forEach(g=>{g.addEventListener('click',()=>detail(g.dataset.atlasNode));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();detail(g.dataset.atlasNode);}});});
 detail(route.nodes.some(n=>n.id===selected)?selected:'feed');
}
if(document.getElementById('atlas-svg')){
 document.querySelectorAll('[data-atlas-route]').forEach(b=>b.addEventListener('click',()=>{route=data.routes.find(r=>r.id===b.dataset.atlasRoute);document.querySelectorAll('[data-atlas-route]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));selected='feed';draw();}));
 document.getElementById('atlas-node-select').addEventListener('change',e=>detail(e.target.value));draw();
}
if(document.getElementById('bus-scenario')){
 let source,target,quarantine,initial,done,reason;const scenario=document.getElementById('bus-scenario');
 function render(){document.getElementById('bus-scene').innerHTML=[[t('源仓','Source'),source],[t('接收器','Receiver'),target],[t('隔离仓','Quarantine'),quarantine]].map(([name,value])=>`<div class="bus-vessel"><i style="height:${value/10}%"></i><span>${name}</span><strong>${value}</strong><small>/ 1000</small></div>`).join('');document.getElementById('bus-feedback').textContent=reason+' · '+t('总账','Total')+`: ${source+target+quarantine} / ${initial}`;}
 function reset(){source=scenario.value==='missing'?0:1000;target=scenario.value==='full'?1000:0;quarantine=0;initial=source+target;done=false;reason=t('选择调度一次，先预测结果。','Predict the outcome, then advance.');render();}
 function tick(replay){if(replay&&done){reason='ALREADY_COMMITTED · '+t('同一请求不再扣账。','Replay does not debit again.');render();return;}if(source===0)reason='MISSING_FEED';else if(scenario.value==='full')reason='BUS_FULL · '+t('源端保留，上游暂停。','Source retained; upstream paused.');else if(scenario.value==='reactive')reason='LOCAL_TREATMENT_REQUIRED';else{const n=Math.min(250,source);source-=n;if(scenario.value==='unknown'){quarantine+=n;reason='QUARANTINE · '+t('未净化，也未销毁。','No purification or destruction.');}else{target+=n;reason='TRANSFERRED';}done=true;}render();}
 document.getElementById('bus-tick').addEventListener('click',()=>tick(false));document.getElementById('bus-replay').addEventListener('click',()=>tick(true));document.getElementById('bus-reset').addEventListener('click',reset);scenario.addEventListener('change',reset);reset();
}
if(document.getElementById('bus-layout')){
 const canvas=document.getElementById('bus-layout'),ctx=canvas.getContext('2d'),kind=document.getElementById('rack-kind'),port=document.getElementById('rack-port');
 let rack=data.racks[0],chosen=0,yaw=-.55,elevation=.72,faces=[],drag=null;
 const colors={SOURCE:'#518675',FEED_BUFFER:'#b48e43',LOCAL_BUFFER:'#59818d',CENTRAL_HOLD:'#a16e60',PURGE_HOLD:'#965648',REUSE_HOLD:'#7961a2'};
 function drawRack(){
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(2,devicePixelRatio||1);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const scale=Math.min(width/24,height/18),cy=Math.cos(yaw),sy=Math.sin(yaw),ce=Math.cos(elevation),se=Math.sin(elevation);
  const project=(x,y,z)=>{x-=9;z-=7.5;const xx=x*cy-z*sy,zz=x*sy+z*cy;return [width/2+xx*scale,height/2+(zz*se-y*ce)*scale,zz*ce+y*se];};
  const grid=(a,b)=>{const p=project(...a),q=project(...b);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();};ctx.strokeStyle='#87988c44';ctx.lineWidth=1;for(let x=0;x<=18;x++)grid([x,0,1],[x,0,15]);for(let z=1;z<=15;z++)grid([0,0,z],[18,0,z]);
  faces=[];const polys=[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]];
  for(const n of rack.nodes){const p=[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,1,0],[1,1,0],[1,1,1],[0,1,1]].map(v=>project(n.x+v[0],v[1],n.z+v[2]));for(let i=0;i<polys.length;i++){const vertices=polys[i].map(j=>p[j]);faces.push({n,vertices,depth:vertices.reduce((a,v)=>a+v[2],0)/4,top:i===4});}}
  faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){ctx.beginPath();f.vertices.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=colors[f.n.role];ctx.fill();ctx.strokeStyle=f.n.index===chosen+1?'#efc04c':'#ecf0e2';ctx.lineWidth=f.n.index===chosen+1?3:1;ctx.stroke();if(f.top){const x=f.vertices.reduce((a,p)=>a+p[0],0)/4,y=f.vertices.reduce((a,p)=>a+p[1],0)/4;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(f.n.index,x,y+3);}}
  const n=rack.nodes[chosen];document.getElementById('rack-detail').textContent=`#${n.index} · ${n.id} · ${n.role} · `+t('相对玩家脚下','Relative to player')+` (X+${n.x}, Y+0, Z+${n.z}) · `+t('右键读取服务端状态；网页为固定布局。','Right-click for server status; this page is a fixed layout.');
 }
 function chooseRack(){rack=data.racks.find(r=>r.id===kind.value);chosen=0;port.innerHTML=rack.nodes.map((n,i)=>`<option value="${i}">#${n.index} ${n.id}</option>`).join('');drawRack();}
 kind.addEventListener('change',chooseRack);port.addEventListener('change',()=>{chosen=Number(port.value);drawRack();});
 document.getElementById('rack-left').onclick=()=>{yaw-=.25;drawRack();};document.getElementById('rack-right').onclick=()=>{yaw+=.25;drawRack();};document.getElementById('rack-top').onclick=()=>{yaw=0;elevation=Math.PI/2;drawRack();};document.getElementById('rack-home').onclick=()=>{yaw=-.55;elevation=.72;drawRack();};
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>4)drag.moved=true;yaw+=dx*.008;elevation=Math.max(.25,Math.min(Math.PI/2,elevation+dy*.008));drag.x=e.clientX;drag.y=e.clientY;drawRack();});
 canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;for(const f of [...faces].reverse()){const p=f.vertices;let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if(((p[i][1]>y)!==(p[j][1]>y))&&(x<(p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1])+p[i][0]))inside=!inside;if(inside){chosen=f.n.index-1;port.value=String(chosen);break;}}}drag=null;drawRack();});
 canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.25:.25;drawRack();}});new ResizeObserver(drawRack).observe(canvas);chooseRack();
}
if(document.getElementById('recovery-fraction')){
 const input=document.getElementById('recovery-fraction');
 const render=()=>{const percent=Number(input.value),f=percent/100,fmt=x=>x.toFixed(2);
  document.getElementById('recovery-percent').textContent=percent+'%';
  document.getElementById('recovery-balance').innerHTML=[
   [t('输入混合物','Input mixture'),90,10,t('组成已记录','Composition recorded')],
   [t('回用候选仓','Reuse-candidate hold'),90*f,10*f,'REUSE_REVIEW_REQUIRED'],
   [t('排污暂存仓','Purge hold'),90*(1-f),10*(1-f),t('待处理，不排放','Treatment pending; no discharge')]
  ].map(row=>`<tr><th>${row[0]}</th><td>${fmt(row[1])}</td><td>${fmt(row[2])}</td><td>${row[3]}</td></tr>`).join('');
  document.getElementById('recovery-feedback').textContent=t('总量 100.00 → 100.00；非空出口的目标组分比例保持 90%。仅做分流不会提高纯度。','Total 100.00 → 100.00; each nonempty outlet remains 90% target. Splitting alone does not improve purity.');
 };
 input.addEventListener('input',render);render();
}
window.__lineAtlas={ready:true};
})();
