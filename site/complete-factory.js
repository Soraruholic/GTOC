(()=>{'use strict';
const D=window.COMPLETE_PLANTS,$=id=>document.getElementById(id),en=D.en,t=(a,b)=>en?b:a;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let kind=D.initial,route=D.routes[kind];
function graph(){const steps=route.steps,by=Object.fromEntries(steps.map(s=>[s.id,s]));let ns,es;
 if(kind==='ester'){ns=steps.map((s,i)=>[s.id,i,0]);es=steps.slice(1).map((s,i)=>[steps[i].id,s.id]);}
 else{ns=[['inventory',0,1],['c5',1,0],['claisen',1,1],['carroll',2,0],['haloester',2,2],['c10',3,0],['u07',4,0],['u08',5,0],['c14',6,0],['c6',5,2],['couple',7,1],['hydrogenate',8,1],['acetylate',9,1],['finish',10,1],['retinol',11,1],['collect',12,1]];es=[['inventory','c5'],['inventory','claisen'],['inventory','haloester'],['inventory','c6'],['c5','carroll'],['claisen','carroll'],['carroll','c10'],['c10','u07'],['u07','u08'],['u08','c14'],['haloester','c14'],['c14','couple'],['c6','couple'],['couple','hydrogenate'],['hydrogenate','acetylate'],['acetylate','finish'],['finish','retinol'],['retinol','collect']];}
 const pos=Object.fromEntries(ns.map(([id,x,y])=>[id,[x*116+8,y*95+14]])),width=(Math.max(...ns.map(n=>n[1]))+1)*116+12,height=kind==='ester'?140:340;
 let svg=`<svg viewBox="0 0 ${width} ${height}" aria-label="${t('总合成路线，含平行支线','Synthesis route including parallel branches')}"><defs><marker id="route-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10" fill="currentColor"/></marker></defs>`;
 for(const[a,b]of es){const[x,y]=pos[a],[xx,yy]=pos[b];svg+=`<path class="edge" marker-end="url(#route-arrow)" d="M${x+96} ${y+30}H${(x+96+xx)/2}V${yy+30}H${xx}"/>`;}
 const last=pos[kind==='ester'?'treatment':'collect'],first=pos[ns[0][0]],loopY=height-14;svg+=`<path class="edge" style="stroke:#4f8876" marker-end="url(#route-arrow)" d="M${last[0]+48} ${last[1]+66}V${loopY}H${first[0]+48}V${first[1]+66}"/><text x="${width/2}" y="${loopY-7}" text-anchor="middle" fill="currentColor" font-size="12">${t('合格单一物流 95% 回用 · 5% 排污与复杂残余 → 付费分类处置','95% approved clean-stream reclaim · 5% purge and complex residues → paid segregated disposal')}</text>`;
 for(const[id,x,y]of ns){const s=by[id],p=pos[id];let label=s.title;if(label.length>30&&en)label=label.slice(0,28)+'…';const words=en?label.split(' '):[...label];let chunks=[''];for(const word of words){let i=chunks.length-1;if(chunks[i].length+(en?word.length+1:1)>(en?14:8))chunks.push(word);else chunks[i]+=(en&&chunks[i]?' ':'')+word;}svg+=`<g tabindex="0" role="button" data-step="${id}" transform="translate(${p[0]} ${p[1]})" aria-label="${esc(s.title)}"><title>${esc(s.title)}</title><rect width="96" height="66" rx="7"/>${chunks.slice(0,3).map((x,i)=>`<text x="8" y="${20+i*17}">${esc(x)}</text>`).join('')}</g>`;}svg+='</svg>';
 $('route-map').innerHTML=svg;
 for(const g of $('route-map').querySelectorAll('[data-step]')){const go=()=>{const s=by[g.dataset.step];window.dispatchEvent(new CustomEvent('oc-focus-units',{detail:{plant:kind,units:s.units}}));$('route-note').innerHTML=esc(s.title)+' · '+`<a href="${kind==='ester'?'ester':'vitamin-a'}-guide.html#step-${s.id}">${t('阅读完整步骤','Read full step')}</a>`;for(const el of $('route-map').querySelectorAll('.active'))el.classList.remove('active');g.classList.add('active');};g.onclick=go;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};}
 $('route-note').textContent=kind==='ester'?t('从独立计量到可逆酯化，再到分离、干燥与分类收集。点击节点查看步骤，并在下方定位专线。','Follow metering, reversible esterification, separation, drying and collection. Select a node to read the step and locate its dedicated line below.'):t('C14 与 C6 只在合格交接后汇合。点击任意节点，高亮对应设备。','C14 and C6 join only after qualified handoff. Select a node to highlight its equipment.');
}
function bill(){if(!$('bill'))return;$('bill').innerHTML=Object.entries(route.data.supplies).map(([s,n])=>`<tr><td>${esc(en?s.replaceAll('-',' '):(route.data.speciesZh[s]||s))}<br><code>${esc(s)}</code></td><td>${Number(n).toPrecision(7)} ${t('工艺单位','process units')}<br><strong>${Math.ceil(n)} ${t('包 / 首批','packets / first batch')}</strong></td><td><a href="reagents.html#reagent-${esc(s)}">${t('查看 GT 制备配方','GT preparation recipe')}</a><br>${t('对应专仓供料 · 余量留仓','Matching dedicated store · carry-over retained')}</td></tr>`).join('');}

function load(k){kind=k;route=D.routes[kind];graph();bill();$('route').value=k;}
$('route').onchange=e=>{
 // Tutorial text and material requirements must always refer to the same plant.
 if($('bill')&&e.target.value!==D.initial){location.href=(e.target.value==='ester'?'ester':'vitamin-a')+'-guide.html#synthesis';return;}
 load(e.target.value);
};
for(const b of document.querySelectorAll('.focus-step'))b.onclick=()=>{
 window.dispatchEvent(new CustomEvent('oc-focus-units',{detail:{plant:D.initial,units:b.dataset.units.split(' ')}}));
 $('scene').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
};
load(kind);
})();
