(()=>{'use strict';
const D=window.COMPLETE_PLANTS,$=id=>document.getElementById(id),en=D.en,t=(a,b)=>en?b:a;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let kind=D.initial,route=D.routes[kind],yaw=-.5,pitch=.85,zoom=1,selected='',focus=new Set(),drag=null,objects=[],hits=[];
const canvas=$('factory-canvas'),ctx=canvas.getContext('2d');
try{if(localStorage.getItem('complete-theme')==='dark')document.body.classList.add('dark');}catch(_){}
$('theme').onclick=()=>{document.body.classList.toggle('dark');try{localStorage.setItem('complete-theme',document.body.classList.contains('dark')?'dark':'light');}catch(_){}draw();};
function makeObjects(){const d=route.data;objects=[];
 for(const m of d.machines)objects.push({...m,anchor:[m.x,m.y+1,m.z],x:m.x-m.width/2+.5,w:m.width,h:m.height,d:m.width,kind:'machine',color:'#4f8876'});
 for(const c of d.cells)if(c.kind==='STORAGE')objects.push({...c,w:1.2,h:1.7,d:1.2,kind:c.id.startsWith('stock:')?'stock':local(c.id)?'local':'receiver',color:c.id.startsWith('stock:')?'#bd8252':local(c.id)?'#ab735f':'#668da8'});
 // Compress actual bus voxels along X. Coordinates still match the exported block plan.
 const groups=new Map();for(const c of d.cells)if(c.kind==='BUS'){const key=c.y+','+c.z;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c.x);}
 for(const [key,xs]of groups){const[y,z]=key.split(',').map(Number);xs.sort((a,b)=>a-b);let start=xs[0],last=start;for(let i=1;i<=xs.length;i++){if(xs[i]===last+1){last=xs[i];continue;}objects.push({id:'bus',kind:'bus',x:start,y:y+.25,z:z+.25,w:last-start+1,h:.35,d:.35,color:'#748fa6'});start=xs[i];last=start;}}
}
function local(id){const k=id.replace('receiver:','');return !k.startsWith('e:')&&!k.startsWith('r:')&&k!=='k:5:liquid'&&k!=='v:5:liquid';}
function objectName(o){if(o.kind==='machine')return en?o.labelEn:o.labelZh;if(o.kind==='stock'){const id=o.id.slice(6);return en?id.replaceAll('-',' '):(route.data.speciesZh[id]||id);}return t(o.kind==='local'?'局部接收':'中央接收',o.kind==='local'?'Local receiver':'Central receiver')+' · '+o.id.replace('receiver:','');}
function controls(){const opts=objects.filter(o=>o.kind!=='bus');$('unit-select').innerHTML=opts.map(o=>`<option value="${esc(o.id)}">${esc(objectName(o))} · ${esc(o.id)}</option>`).join('');selected=opts[0]?.id||'';$('unit-select').value=selected;detail();}
function detail(){const o=objects.find(o=>o.id===selected);if(!o)return;const step=route.steps.find(s=>!['build','inventory'].includes(s.id)&&s.units.includes(o.id));
 let html=`<span class="eyebrow">${esc(o.kind.toUpperCase())}</span><h3>${esc(objectName(o))}</h3><p><code>${esc(o.id)}</code></p><p>${t('相对控制锚点','Relative to the anchor')}: (${(o.anchor||[o.x,o.y,o.z]).join(', ')})</p>`;
 if(o.kind==='machine')html+=`<p>${o.w} × ${o.h} × ${o.d} · ${t('独立端口、库存引用与只读状态 UI。','Separate ports, an inventory reference and a read-only status UI.')}</p><p>${esc(step?.title||t('工序的有限缓冲与隔离端','Finite process buffer or containment boundary'))}</p>`;
 if(o.kind==='stock'){const id=o.id.slice(6);html+=`<p>${t('有限测试原料','Finite test supply')}: <strong>${Number(route.data.supplies[id]).toPrecision(6)}</strong></p><p>${t('这是一批预置的教学库存，运行时不补发；真实 GT 进料证明是另一验收边界。','A single explicit teaching charge, never refilled during operation. Native GT ingress proof is a separate acceptance boundary.')}</p>`;}
 if(o.kind==='local'||o.kind==='receiver')html+=`<p>${o.kind==='local'?t('局部密封保管；不接普通混合废液管。','Local sealed custody; not an ordinary mixed waste header.'):t('中央分类保管。保持原有全部组分；不是纯化产物。','Segregated central custody. All original components remain; collection is not purification.')}</p>`;
 if(step)html+=`<a href="${kind==='ester'?'ester':'vitamin-a'}-guide.html#step-${step.id}">${t('阅读这一步的完整说明 →','Read this step in full →')}</a>`;
 html+=`<p class="caption">${t('布局测试导出 · 非实时遥测','Layout test export · not live telemetry')}</p>`;
 $('unit-detail').innerHTML=html;
 if(['e:reaction','v:1'].includes(o.id) && route.data.trace.length){plot();}
}
function plot(){const raw=route.data.trace;let lines=kind==='ester'?[1,2,3,4].map(i=>raw.map(p=>[p[0],p[i]])):['h','mono','di'].map(key=>raw.map(p=>[p.t,p[key]]));const all=lines.flat().filter(p=>p.every(Number.isFinite));if(!all.length)return;
 const maxT=Math.max(...all.map(p=>p[0]),1),maxN=Math.max(...all.map(p=>p[1]),.001),colors=['#b16f43','#4e8475','#698eae','#9c7898'];
 const paths=lines.map((l,i)=>`<path fill="none" stroke="${colors[i]}" stroke-width="2" d="${l.filter(p=>p.every(Number.isFinite)).map((p,j)=>(j?'L':'M')+(25+200*p[0]/maxT).toFixed(1)+','+(116-96*p[1]/maxN).toFixed(1)).join(' ')}"/>`).join('');
 $('unit-detail').insertAdjacentHTML('beforeend',`<svg class="mini-plot" viewBox="0 0 250 140" role="img" aria-label="${t('已通过测试的参考反应轨迹','Tested reference reaction trace')}"><path d="M25 10V116H235" stroke="currentColor" fill="none"/>${paths}<text x="28" y="136" fill="currentColor" font-size="9">0 → ${maxT} model s · mol</text></svg><p class="plot-key">${kind==='ester'?t('酸 / 醇 / 酯 / 水','Acid / alcohol / ester / water'):t('原料 / 单乙酸酯 / 二乙酸酯','Feed / monoacetate / diacetate')} · ${t('参考数据，非实测','reference data, not measurements')}</p>`);
}
function graph(){const steps=route.steps,by=Object.fromEntries(steps.map(s=>[s.id,s]));let ns,es;
 if(kind==='ester'){ns=steps.map((s,i)=>[s.id,i,0]);es=steps.slice(1).map((s,i)=>[steps[i].id,s.id]);}
 else{ns=[['inventory',0,1],['c5',1,0],['claisen',1,1],['carroll',2,0],['haloester',2,2],['c10',3,0],['u07',4,0],['u08',5,0],['c14',6,0],['c6',5,2],['couple',7,1],['hydrogenate',8,1],['acetylate',9,1],['finish',10,1],['retinol',11,1],['collect',12,1]];es=[['inventory','c5'],['inventory','claisen'],['inventory','haloester'],['inventory','c6'],['c5','carroll'],['claisen','carroll'],['carroll','c10'],['c10','u07'],['u07','u08'],['u08','c14'],['haloester','c14'],['c14','couple'],['c6','couple'],['couple','hydrogenate'],['hydrogenate','acetylate'],['acetylate','finish'],['finish','retinol'],['retinol','collect']];}
 const pos=Object.fromEntries(ns.map(([id,x,y])=>[id,[x*116+8,y*95+14]])),width=(Math.max(...ns.map(n=>n[1]))+1)*116+12,height=kind==='ester'?105:295;
 let svg=`<svg viewBox="0 0 ${width} ${height}" aria-label="${t('总合成路线，含平行支线','Synthesis route including parallel branches')}"><defs><marker id="route-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10" fill="currentColor"/></marker></defs>`;
 for(const[a,b]of es){const[x,y]=pos[a],[xx,yy]=pos[b];svg+=`<path class="edge" marker-end="url(#route-arrow)" d="M${x+96} ${y+30}H${(x+96+xx)/2}V${yy+30}H${xx}"/>`;}
 for(const[id,x,y]of ns){const s=by[id],p=pos[id];let label=s.title;if(label.length>30&&en)label=label.slice(0,28)+'…';const words=en?label.split(' '):[...label];let chunks=[''];for(const word of words){let i=chunks.length-1;if(chunks[i].length+(en?word.length+1:1)>(en?14:8))chunks.push(word);else chunks[i]+=(en&&chunks[i]?' ':'')+word;}svg+=`<g tabindex="0" role="button" data-step="${id}" transform="translate(${p[0]} ${p[1]})" aria-label="${esc(s.title)}"><title>${esc(s.title)}</title><rect width="96" height="66" rx="7"/>${chunks.slice(0,3).map((x,i)=>`<text x="8" y="${20+i*17}">${esc(x)}</text>`).join('')}</g>`;}svg+='</svg>';
 $('route-map').innerHTML=svg;
 for(const g of $('route-map').querySelectorAll('[data-step]')){const go=()=>{const s=by[g.dataset.step];focus=new Set(s.units);selected=s.units[0];$('unit-select').value=selected;detail();draw();$('route-note').innerHTML=esc(s.title)+' · '+`<a href="${kind==='ester'?'ester':'vitamin-a'}-guide.html#step-${s.id}">${t('阅读完整步骤','Read full step')}</a>`;for(const el of $('route-map').querySelectorAll('.active'))el.classList.remove('active');g.classList.add('active');};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};}
 $('route-note').textContent=kind==='ester'?t('从独立计量到可逆酯化，再到分离、干燥与分类收集。点击节点定位设备。','Follow metering, reversible esterification, separation, drying and collection. Select a node to locate its equipment.'):t('C14 与 C6 只在合格交接后汇合。点击任意节点，高亮对应设备。','C14 and C6 join only after qualified handoff. Select a node to highlight its equipment.');
}
function bill(){$('bill').innerHTML=Object.entries(route.data.supplies).map(([s,n])=>`<tr><td>${esc(en?s.replaceAll('-',' '):(route.data.speciesZh[s]||s))}<br><code>${esc(s)}</code></td><td>${Number(n).toPrecision(7)} ${s.endsWith('cartridge')||s==='heater-charge'?t('份测试能力','test charge'):t('教学 mol','teaching mol')}</td><td><a href="factory-services.html#supplies">${t('查原生配方 / 制备候选','Native recipes / preparation candidates')}</a><br>${t('整线测试仓显式预置；不等于生存闭合','Explicit finite test stock; not survival closure')}</td></tr>`).join('');}
function draw(){if(!ctx||!objects.length)return;const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const dark=document.body.classList.contains('dark');
 const visible=objects.filter(o=>o.kind==='bus'?$('layer-bus').checked:o.kind==='machine'?$('layer-machine').checked:$('layer-storage').checked),bounds=objects.filter(o=>o.kind!=='bus');
 const minX=Math.min(...bounds.map(o=>o.x)),maxX=Math.max(...bounds.map(o=>o.x+o.w)),minZ=Math.min(...bounds.map(o=>o.z)),maxZ=Math.max(...bounds.map(o=>o.z+o.d));const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
 const space=(x,y,z)=>{x-=cx;z-=cz;const u=x*Math.cos(yaw)+z*Math.sin(yaw),v=-x*Math.sin(yaw)+z*Math.cos(yaw);return[u,v*Math.sin(pitch)-y*Math.cos(pitch),v*Math.cos(pitch)+y*Math.sin(pitch)];};
 const corners=[];for(const x of[minX-5,maxX+5])for(const z of[minZ-4,maxZ+4])for(const y of[-2,7])corners.push(space(x,y,z));const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);let scale=Math.min((width-28)/(Math.max(...xs)-Math.min(...xs)),(height-40)/(Math.max(...ys)-Math.min(...ys)))*zoom;
 const project=(x,y,z)=>{const p=space(x,y,z);return[width/2+p[0]*scale,height/2+p[1]*scale,p[2]];};ctx.strokeStyle=dark?'#33463a':'#dce2d6';ctx.lineWidth=.6;
 for(let x=Math.floor(minX/8)*8;x<=maxX+8;x+=8){const a=project(x,-2,minZ),b=project(x,-2,maxZ);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
 for(let z=Math.floor(minZ/8)*8;z<=maxZ+8;z+=8){const a=project(minX,-2,z),b=project(maxX,-2,z);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
 const faces=[];for(const o of visible){const vs=[[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,1,0],[1,1,0],[1,1,1],[0,1,1]].map(p=>project(o.x+p[0]*o.w,o.y+p[1]*o.h,o.z+p[2]*o.d));for(const ids of[[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]]){const pts=ids.map(i=>vs[i]);faces.push({o,pts,depth:pts.reduce((s,p)=>s+p[2],0)/4,top:ids[0]===4});}}
 faces.sort((a,b)=>a.depth-b.depth);hits=[];for(const f of faces){const active=f.o.id===selected||focus.has(f.o.id);ctx.globalAlpha=focus.size&&f.o.kind==='machine'&&!active ? .33 : 1;ctx.fillStyle=active?'#d7a75d':f.o.color;ctx.strokeStyle=active?(dark?'#ffe7ad':'#815319'):(dark?'#263a30':'#f4f4e9');ctx.lineWidth=active?1.5:.5;ctx.beginPath();f.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();ctx.stroke();if(f.top&&f.o.kind!=='bus')hits.push(f);}
 ctx.globalAlpha=1;ctx.fillStyle=dark?'#dfe9da':'#3c5747';ctx.font='12px system-ui';ctx.fillText(`${route.data.moduleCount} ${t('模块','modules')} · ${route.data.sourceCount} ${t('源仓','sources')} · ${route.data.operationCount} ${t('持久化步骤','durable steps')}`,14,22);
 window.__completeFactory={ready:true,kind,objects:objects.length,machines:route.data.moduleCount,bus:objects.filter(o=>o.kind==='bus').length,selected};
}
function load(k){kind=k;route=D.routes[kind];focus.clear();makeObjects();controls();graph();bill();draw();$('route').value=kind;}
function hit(x,y,ps){let yes=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;yaw=drag.yaw+(e.clientX-drag.x)*.007;pitch=Math.min(1.53,Math.max(.15,drag.pitch+(e.clientY-drag.y)*.004));draw();};
canvas.onpointerup=e=>{if(drag&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5){const b=canvas.getBoundingClientRect();for(const f of [...hits].reverse())if(hit(e.clientX-b.left,e.clientY-b.top,f.pts)){selected=f.o.id;focus.clear();$('unit-select').value=selected;detail();draw();break;}}drag=null;};
canvas.onwheel=e=>{e.preventDefault();zoom=Math.min(3,Math.max(.5,zoom*(e.deltaY<0?1.1:.9)));draw();};
canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.53,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(.15,pitch-.1);if(e.key==='+')zoom=Math.min(3,zoom*1.1);if(e.key==='-')zoom=Math.max(.5,zoom/1.1);draw();}};
$('route').onchange=e=>load(e.target.value);$('unit-select').onchange=e=>{selected=e.target.value;focus.clear();detail();draw();};
for(const id of['layer-bus','layer-storage','layer-machine'])$(id).onchange=draw;
$('view-top').onclick=()=>{pitch=1.53;yaw=0;draw();};$('view-iso').onclick=()=>{pitch=.85;yaw=-.5;draw();};$('view-reset').onclick=()=>{pitch=.85;yaw=-.5;zoom=1;focus.clear();draw();};
for(const b of document.querySelectorAll('.focus-step'))b.onclick=()=>{if(kind!==D.initial)load(D.initial);focus=new Set(b.dataset.units.split(' '));selected=[...focus][0];$('unit-select').value=selected;detail();draw();$('scene').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
new ResizeObserver(draw).observe(canvas);load(kind);
})();
