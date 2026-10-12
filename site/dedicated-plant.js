(()=>{'use strict';
const {en,data}=window.DEDICATED_PAGE,$=id=>document.getElementById(id),t=(a,b)=>en?b:a;
let route=data[window.DEDICATED_PAGE.initial]||data.ester,selected=0,yaw=-.62,pitch=.75,zoom=1,focusMode=false,drag=null,currentStage='feed',focusAsset=null,traceMaterial=null;
const canvas=$('plant-canvas');
const esterUnits=['feed','reaction','still','condenser','wash','separator','dryer','product'];
function assetTag(a){if(a.family){const [group,n]=a.id.split(':');return a.family+'-'+(group==='service'?'SV':group.toUpperCase())+String(group==='e'?esterUnits.indexOf(n)+1:Number(n)+1).padStart(2,'0');}return (a.receiver?'RCV':a.phase==='GAS'?'GV':a.phase==='SOLID'?'SL':'TK')+'-'+String(route.stores.indexOf(a)+1).padStart(2,'0');}
function assets(){return [...route.machines,...route.stores];}
function tag(id){const a=assets().find(a=>a.id===id);return a?assetTag(a):id;}
function lineTag(l){return 'L-'+String(route.lines.indexOf(l)+1).padStart(3,'0');}
function registry(){const query=$('asset-search').value.trim().toLowerCase(),all=assets(),found=all.filter(a=>(assetTag(a)+' '+name(a.id)+' '+a.id).toLowerCase().includes(query));$('asset-select').innerHTML=found.map(a=>`<option value="${escape(a.id)}">${escape(assetTag(a)+' · '+name(a.id))}</option>`).join('');$('asset-count').textContent=found.length+' / '+all.length;$('asset-locate').disabled=!found.length;}
function locate(id){const a=assets().find(a=>a.id===id);if(!a)return;const index=route.lines.findIndex(l=>l.target===id||l.source===id);if(index<0)return;focusAsset=a;focusMode=true;zoom=1;$('line-kind').value=route.lines[index].kind;choose(index);$('asset-select').value=id;$('asset-feedback').textContent=t('已定位：','Located: ')+assetTag(a)+' · '+name(id);}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function choose(preferred){registry();const kind=$('line-kind').value,visible=route.lines.map((l,i)=>({...l,index:i})).filter(l=>kind==='all'||l.kind===kind);if(!visible.length){$('line-kind').value='all';return choose();}selected=visible.some(l=>l.index===preferred)?preferred:visible[0].index;$('pipe-select').innerHTML=visible.map(l=>`<option value="${l.index}">${escape(lineTag(route.lines[l.index])+' · '+lineTitle(l))}</option>`).join('');$('pipe-select').value=String(selected);detail();draw();}
function name(id){const m=route.machines.find(m=>m.id===id);if(m)return en?m.nameEn:m.name;
 if(id.startsWith('stock:')){const l=route.lines.find(l=>l.material===id.slice(6));return t('原料仓 · ','Store · ')+(l?material(l):id.slice(6).replaceAll('-',' '));}
 return t('接收罐 · ','Receiver · ')+id.replace(/^receiver:/,'');
}
function material(l){const spec=route.materials?.[l.material];return spec?(en?spec.nameEn:spec.name):en?l.material.replaceAll('-',' '):l.name;}
function lineTitle(l){if(l.kind==='SUPPLY')return material(l)+' → '+name(l.target);if(l.kind==='RECLAIM')return t('回用 · ','Reclaim · ')+material(l);return name(l.source)+' → '+name(l.target);}
function detail(){const l=route.lines[selected],mix=l.compositionPolicy==='FIXED_STREAM_MIXTURE_ALLOWED';
 $('pipe-detail').innerHTML=`<span class="eyebrow">${route.stores.length} ${t('仓/罐','STORES')} · ${route.lines.length} ${t('专线','LINES')}</span><span class="asset-badge">${lineTag(l)}</span><h3>${escape(lineTitle(l))}</h3><div class="stream-endpoints"><p><b>${t('来源','SOURCE')}</b>${escape(tag(l.source)+' · '+name(l.source))}</p><span aria-hidden="true">↓</span><p><b>${t('去向','DESTINATION')}</b>${escape(tag(l.target)+' · '+name(l.target))}</p></div><p>${mix?t('整股工艺物流：管道保持组成，分离在设备内完成。','Whole process stream: the pipe preserves composition; equipment performs separation.'):t('单一物料身份：只送到指定接收端。','Single material identity: delivered only to its fixed endpoint.')}</p>${l.kind==='SUPPLY'?`<p class="demand"><b>${Number(route.supplies[l.material]).toPrecision(5)}</b> ${t('工艺单位 / 整线每批','process units / plant batch')}</p><a href="reagents.html#reagent-${escape(l.material)}">${t('查看制备配方 →','Preparation recipe →')}</a>`:''}<details class="stream-contract"><summary>${t('端口、相态与运输契约','Ports, phase and transport contract')}</summary><dl><dt>${t('用途','Duty')}</dt><dd>${l.kind}</dd><dt>${t('相态','Phase')}</dt><dd>${({LIQUID:t('液体','Liquid'),GAS:t('气体','Gas'),SOLID:t('固体','Solid')})[l.phase]||escape(l.phase)}</dd><dt>${t('物流 ID','Stream ID')}</dt><dd><code>${escape(l.material)}</code></dd><dt>${t('路径','Path')}</dt><dd>${l.blocks} ${t('管段 / 封闭输送段','pipe / enclosed segments')}</dd><dt>${t('契约','Contract')}</dt><dd>${escape(l.transport)}</dd></dl></details>`;
}
const appearance=new PlantAppearance(canvas,{t,name,tag:assetTag,lineTag,onLocate:locate});
const operationNotes={FLOW:t('教学演示：箭头显示物流方向。游戏中的短暂机械动作只在服务器确认相关库存变化后出现。','Teaching view: arrows show direction. In game, short mechanical motion follows server-confirmed changes in related stock.'),PAUSED:t('暂停后不再提交新工序，机械动作停止。打开阀门本身不会恢复已暂停的整线。','Pause stops new operations and mechanical motion. Opening a valve does not resume a paused plant.'),ISOLATED:t('所选专线隔离后整线联锁；余料留在原账本位置，后处理和下一批也等待。右键游戏内管段可提交开/关。','Isolating this line interlocks the entire plant; stock stays in place, and treatment and the next batch wait. Right-click an in-game segment to submit open/close.'),BLOCKED:t('缺料、断管或通道被占用时停止推进。核对正确仓、线路与检修净空，再恢复运行。','Missing stock, a broken pipe or occupied clearance stops progress. Check the correct store, line and access clearance before resuming.'),COMMITTING:t('请求正在验证或落盘：等待确认，不把按钮点击当作已完成输送。','Validation or disk commit is pending: wait for confirmation. Clicking a button is not a completed transfer.')};
function operationDemo(){appearance.demo=$('operation-demo').value;$('operation-note').textContent=operationNotes[appearance.demo];draw();}
$('operation-demo').onchange=operationDemo;
function draw(){const chosen=route.lines[selected];
 window.__dedicatedScene={stores:route.stores.length,lines:route.lines.length,selected:chosen.material,source:chosen.source,target:chosen.target,kind:chosen.kind,stage:currentStage,receivers:route.stores.filter(s=>s.receiver).length,verticalSegments:route.lines.reduce((n,l)=>n+l.points.slice(1).filter((p,i)=>p[1]!==l.points[i][1]).length,0),focusedAsset:focusAsset?.id||null,materialFocus:traceMaterial};
 appearance.draw({materialFocus:traceMaterial,route,selected,yaw,pitch,zoom,focusMode,focusAsset,showAll:$('show-all').checked,labels:$('show-labels').checked,access:$('show-access').checked});
}
$('asset-search').oninput=registry;$('asset-locate').onclick=()=>locate($('asset-select').value);
$('show-labels').onchange=draw;
$('show-access').onchange=draw;
$('operation-note').textContent=operationNotes.FLOW;
$('plant-select').onchange=()=>{route=data[$('plant-select').value];focusAsset=null;$('asset-search').value='';zoom=1;focusMode=false;setStage(currentStage||'feed');materialOptions();};$('line-kind').onchange=()=>{focusAsset=null;currentStage='';document.querySelectorAll('.journey-step').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});choose();};$('view-focus').onclick=()=>{focusAsset=null;focusMode=!focusMode;draw();};$('pipe-select').onchange=()=>{traceMaterial=null;focusAsset=null;selected=Number($('pipe-select').value);detail();draw();};$('view-reset').onclick=()=>{yaw=-.62;pitch=.75;zoom=1;focusMode=false;focusAsset=null;draw();};$('view-top').onclick=()=>{pitch=Math.PI/2;yaw=0;draw();};$('show-all').onchange=draw;
const stageNotes={feed:['SUPPLY','先看蓝色 SUPPLY 线：每条线只有一个物料身份，缺料时整段停下。','Start with blue SUPPLY lines: each line has one material identity, and the segment stops when its store is empty.'],react:['PROCESS','橙色 PROCESS 线承接整股工艺物流；设备负责反应，管道不在途中分拣组分。','Orange PROCESS lines carry a whole process stream; equipment reacts, pipes do not sort it.'],separate:['PROCESS','分离设备把混合物变成新的合格或残余物流，方向仍由专线契约固定。','Separation equipment creates new qualified or residual streams; each direction stays fixed.'],finish:['COLLECT','紫色 COLLECT 线进入固定接收罐，绿色 RECLAIM 线只回送合格单物料。','Purple COLLECT lines enter fixed receivers; green RECLAIM lines return qualified single materials.']};
function setStage(stage){traceMaterial=null;focusAsset=null;currentStage=stage;const note=stageNotes[stage]||stageNotes.feed;document.querySelectorAll('.journey-step').forEach(b=>{const active=b.dataset.stage===stage;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$('journey-note').textContent=en?note[2]:note[1];$('line-kind').value=note[0];
 const families=stage==='react'?['R','H']:stage==='separate'?['D','X','S','F','Y','K']:[];
 const preferred=route.lines.findIndex(l=>l.kind===note[0]&&route.machines.some(m=>m.id===l.target&&families.includes(m.family)));
 choose(preferred);
}
document.querySelectorAll('.journey-step').forEach(b=>b.addEventListener('click',()=>setStage(b.dataset.stage)));
window.addEventListener('oc-focus-units',e=>{
 const d=e.detail;if(!d||!data[d.plant]||!Array.isArray(d.units))return;
 $('plant-select').value=d.plant;route=data[d.plant];
 let i=route.lines.findIndex(l=>l.kind==='PROCESS'&&d.units.includes(l.target));
 if(i<0)i=route.lines.findIndex(l=>d.units.includes(l.target)||d.units.includes(l.source));
 if(i<0)return;
 focusAsset=null;currentStage='';document.querySelectorAll('.journey-step').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
 $('line-kind').value=route.lines[i].kind;focusMode=true;zoom=1;choose(i);
});
canvas.tabIndex=0;canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.57,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(.15,pitch-.1);if(e.key==='+')zoom=Math.min(3,zoom*1.1);if(e.key==='-')zoom=Math.max(.6,zoom/1.1);draw();};
let pointerStart=null;canvas.onpointerdown=e=>{pointerStart=[e.clientX,e.clientY];drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointerup=e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])<5){const box=canvas.getBoundingClientRect(),hit=appearance.hit(e.clientX-box.left,e.clientY-box.top);if(hit)locate(hit.id);}pointerStart=null;drag=null;};canvas.onpointercancel=()=>drag=null;canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(.15,Math.min(1.57,pitch+(e.clientY-drag[1])*.006));drag=[e.clientX,e.clientY];draw();};canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.6,Math.min(3,zoom*Math.exp(-e.deltaY*.001)));draw();},{passive:false});new ResizeObserver(draw).observe(canvas);window.addEventListener('oc-theme-change',draw);$('plant-select').value=window.DEDICATED_PAGE.initial||'ester';$('plant-select').disabled=Boolean(window.DEDICATED_PAGE.initial);setStage('feed');


// Shared recipe definitions; this planner neither reads nor creates server stock.
function materialOptions(){
 if(!$('trace-material'))return;
 const ids=Object.keys(route.supplies);
 $('trace-material').innerHTML=ids.map(id=>`<option value="${escape(id)}">${escape(material({material:id,name:id}))}</option>`).join('');
 $('trace-stock').value='0';traceMaterial=null;renderMaterial(false);
}
function ingredients(values,unit,multiple=1){return Object.entries(values||{}).map(([id,n])=>`<li><code>${escape(id)}</code><strong>${Number((n*multiple).toPrecision(9))} ${unit}</strong></li>`).join('');}
function renderMaterial(focus=true){
 const id=$('trace-material').value,spec=route.materials?.[id],r=spec?.recipe;
 if(!r)return;
 const entered=$('trace-stock').value,stock=Number(entered),batches=Number($('trace-batches').value);
 if(entered.trim()===''||!Number.isFinite(stock)||stock<0||stock>1000000){$('material-card').textContent=t('请输入 0–1,000,000 之间的已确认库存。','Enter credited stock between 0 and 1,000,000.');return;}
 const demand=Number((Number(route.supplies[id])*batches).toPrecision(12)),deficit=Math.max(0,Number((demand-stock).toPrecision(12))),packets=Math.ceil(deficit),runs=Math.ceil(packets/r.output);
 const supply=route.lines.map((l,i)=>({l,i})).filter(({l})=>l.material===id&&l.kind==='SUPPLY'),reclaim=route.lines.filter(l=>l.material===id&&l.kind==='RECLAIM');
 const store=route.stores.find(a=>a.id==='stock:'+id),label=material({material:id,name:id});
 const a=k=>spec[k+(en?'En':'')]||'';
 const auxiliary=spec.category?`<p>${escape(a('classification'))}</p><p>${escape(a('role'))}</p>`:`<p>${t('固定物料身份。组成和结构请查物料 Wiki；配方换算是本模组的游戏规则。','Fixed feed identity. See the material Wiki for structure; recipe conversion is a mod gameplay rule.')}</p>`;
 const destinations=supply.map(({l,i})=>`<button type="button" data-trace-line="${i}">${escape(lineTag(l)+' → '+tag(l.target)+' · '+name(l.target))}</button>`).join('');
 const recipe=ingredients(r.fluidInputs,'mB',runs)+ingredients(r.oreInputs,t('个','items'),runs)+ingredients(r.packetInputs,t('包','packets'),runs);
 const coproducts=ingredients(r.fluidOutputs,'mB',runs)+ingredients(r.packetOutputs,t('包','packets'),runs);
 const service=id==='treatment-service-cartridge',after=service?t('已用凭证记入服务消耗。废物留有批次组成与委外去向；凭证不是废液，也不进行化学中和。','Used vouchers count as service costs. Waste retains its composition and contracted destination; the voucher is not wastewater or a neutralising reagent.'):id==='dryer-cartridge'?t('干燥介质消耗与吸附水分别留账；用后介质交委外。当前不能靠加热按钮再生。','Spent medium and adsorbed water are recorded separately and dispatched; heating does not currently regenerate the medium.'):id==='heater-charge'?t('煤粉包当前计供热成本。独立锅炉的空气、烟气、灰渣与蒸汽供回属于下一步公用工程扩展。','Coal charges currently pay a heating cost. Boiler air, flue gas, ash and steam supply/return belong to the next utility expansion.'):id==='acid-catalyst-cartridge'?t('用后催化剂额度单独留账并委外；与硫酸反应物包不互换。','Spent catalyst allowance is recorded for contracted disposal; it is not interchangeable with sulfuric-acid reagent packets.'):t('反应后按设备生成的具名混合物流继续输送。原料身份不会自动延续成“纯物料”出料。','After reaction, follow the equipment’s named process mixture. The feed identity does not imply a pure outlet.');
 $('material-card').innerHTML=`<article><span class="eyebrow">${service?'SERVICE CREDIT':'FIXED IDENTITY'}</span><h4>${escape(label)}</h4><code>${escape(id)}</code>${auxiliary}<p><b>${t('供料位置','Source')}</b> ${escape(store?assetTag(store):id)} · ${t('相对锚点的箱坐标','Chest relative to anchor')} (${store?.x}, ${store?.y+2}, ${store?.z-1})</p><div class="material-destinations">${destinations}</div><p>${t('合格回用专线','Qualified reclaim lines')}: ${reclaim.length} · ${t('不预支未来回用','No credit for future reclaim')}</p><a href="reagents.html#reagent-${escape(id)}">${t('完整配方与来源 →','Recipe and provenance →')}</a></article><article><span class="eyebrow">${t('全新批次备料练习','FRESH-BATCH PLANNER')}</span><div class="material-totals"><span><b>${demand}</b>${t('计划工艺单位','process units needed')}</span><span><b>${packets}</b>${t('需补整包','whole packets to add')}</span><span><b>${runs}</b>${t('LCR 配方次数','LCR recipe runs')}</span></div><p>${t('现有','Credited')}: ${stock} · ${t('补料后余量','Stock after planned use')}: ${Number((stock+runs*r.output-demand).toPrecision(10))}</p><details open><summary>${t('制造这些包所需的直接投入','Direct ingredients for these packets')}</summary><ul class="material-ingredients">${recipe||'<li>'+t('无需新增投入','No new feed needed')+'</li>'}</ul><p>${r.EUt} EU/t · ${r.durationTicks} tick × ${runs} · ${t('电路','circuit')} ${id==='acid-catalyst-cartridge'?23:24}</p>${coproducts?'<h5>'+t('同时接收副产物','Receive coproducts too')+'</h5><ul class="material-ingredients">'+coproducts+'</ul>':''}</details><p class="material-after">${after}</p>${spec.preparation?'<details><summary>'+t('现实制备与游戏入口','Real supply and game input')+'</summary><p>'+escape(a('preparation'))+'</p></details>':''}</article>`;
 $('material-card').querySelectorAll('[data-trace-line]').forEach(b=>b.onclick=()=>{traceMaterial=id;focusAsset=null;focusMode=true;zoom=1;$('line-kind').value='SUPPLY';choose(Number(b.dataset.traceLine));});
 window.__materialPlanner={id,demand,stock,packets,runs,output:r.output,coproducts:r.packetOutputs,reclaim:reclaim.length,source:store?.id,serverMutation:false};
 if(focus&&supply.length){traceMaterial=id;focusMode=false;focusAsset=null;$('line-kind').value='SUPPLY';choose(supply[0].i);}
}
if($('trace-material')){
 $('trace-material').onchange=()=>{$('trace-stock').value='0';renderMaterial();};
 $('trace-batches').onchange=()=>renderMaterial();$('trace-stock').oninput=()=>renderMaterial();
 $('trace-locate').onclick=()=>{traceMaterial=$('trace-material').value;locate('stock:'+traceMaterial);};
 $('trace-clear').onclick=()=>{traceMaterial=null;draw();};materialOptions();
}

// A local learning exercise: no inventory mutations or simulated server telemetry.
const faults={
 empty:{question:t('下一步需要乙醇，但乙醇专仓余额为零。你会怎么做？','The next operation needs ethanol, but its dedicated store is empty. What do you do?'),answers:[t('补给乙醇专仓并核对入账','Replenish the ethanol store and check credit'),t('延长反应时间等待自产乙醇','Wait longer for the reactor to make its own ethanol'),t('把水仓临时改成乙醇仓','Relabel the water store as ethanol')],right:0,why:t('缺料是输入库存不足。补给正确身份的原料后才能继续；延长时间或改仓名不会创造乙醇。','This is a feed-stock shortage. Only matching material replenishment enables progress; time and relabeling do not create ethanol.')},
 broken:{question:t('库存充足，但一条专线的方向或身份不匹配。你会怎么做？','Stock is sufficient, but a line has a mismatched direction or identity. What do you do?'),answers:[t('连接最近的一条其他物料管','Join the nearest other material line'),t('反复点击恢复跳过检查','Repeatedly resume to skip validation'),t('暂停，核对并恢复原线路身份与方向','Pause and restore the original line identity and direction')],right:2,why:t('线路是固定来源到固定去向的契约。恢复原来的完整路径后再继续；相邻管道并不会自动获得这股物流的资格。','The line binds one source to one destination. Restore its intact original path before resuming; adjacent pipes do not gain its identity.')},
 full:{question:t('后处理接收罐已满，下一批仍有原料。你会怎么做？','The workup receiver is full, while another batch has feed. What do you do?'),answers:[t('把废液接到成品罐腾空间','Send waste to the product tank'),t('暂停，按该罐契约完成处置或合格回用','Pause and use that receiver’s disposal or qualified reclaim contract'),t('提高反应进度强行继续','Force reaction progress higher')],right:1,why:t('满罐是接收能力限制。先把原有物流交给合格去向，释放容量，再恢复；不能靠混罐或忽略残余继续。','A full tank is a receiving-capacity constraint. Transfer its contents to a qualified destination before resuming; mixing tanks or discarding the account is not a remedy.')}
};
const solved=new Set();
function showFault(){if(!$('fault-case'))return;const key=$('fault-case').value,f=faults[key];$('fault-question').textContent=f.question;$('fault-feedback').textContent='';$('fault-answers').replaceChildren();
 f.answers.forEach((answer,i)=>{const b=document.createElement('button');b.type='button';b.textContent=answer;b.onclick=()=>{const ok=i===f.right;if(ok)solved.add(key);$('fault-feedback').textContent=(ok?t('处理正确。','Correct. '):t('再想一想。','Try again. '))+f.why;$('fault-feedback').dataset.correct=String(ok);$('fault-score').textContent=solved.size+' / 3';$('fault-progress').value=solved.size;};$('fault-answers').append(b);});
}
if($('fault-case')){$('fault-case').onchange=showFault;showFault();}
})();
