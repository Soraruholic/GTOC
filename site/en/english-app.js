/* English presentation only. Scientific identities and states come from the shared catalog. */
(()=>{'use strict';
const D=window.OC_EN,C=D.catalog,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const comp=id=>C.compounds.find(x=>x.slug===id),lname=id=>C.lessons.find(x=>x.id===id)?.title||id;
const link=(type,id,name)=>`<a href="wiki.html#${type}-${encodeURIComponent(id)}">${esc(name||id)}</a>`;
const lessonLink=id=>`<a href="lesson.html?id=${encodeURIComponent(id)}">${esc(id)} · ${esc(lname(id))}</a>`;
const tag=t=>`<span class="tag">${esc(t)}</span>`,p=t=>t?`<p>${esc(t)}</p>`:'';
const original=l=>'../'+l.page+(l.branch===null?'#wiki-reactions':'?branch='+l.branch+'#lesson');
const originalLink=(href,text='Chinese original')=>`<a href="${esc(href)}" lang="zh-Hans">${text}</a>`;
let viewer=null;
function viewerAt(id){
 const host=$(id);host.tabIndex=0;
 try{viewer=(window.OCTheme||window.$3Dmol).createViewer(host,{backgroundColor:'#ffffff',antialias:true});
 host.onkeydown=e=>{const turns={ArrowLeft:['y',-12],ArrowRight:['y',12],ArrowUp:['x',-12],ArrowDown:['x',12]};if(turns[e.key]){e.preventDefault();viewer.rotate(turns[e.key][1],turns[e.key][0]);viewer.render();}};
 return viewer;
 }catch(e){host.textContent='3D is unavailable in this browser. The mapped 2D structure and lesson remain available.';console.warn('3D unavailable',e.message);return null;}
}
function molecularStyle(v){v.setStyle({},{stick:{radius:.12},sphere:{scale:.23}});v.zoomTo();v.render();}
function stats(){if($('site-counts'))$('site-counts').innerHTML=[['compounds','substance entries'],['reactions','reaction entries'],['equipment','equipment & concepts'],['lessons','classrooms']].map(([k,n])=>`<span><strong>${D.coverage[k]}</strong>${n}</span>`).join('');if($('hero-molecule'))$('hero-molecule').innerHTML=comp('ethyl-acetate').visual.svg;}

function wiki(){
 let category='compounds';const prefixes={compounds:'compound',reactions:'reaction',equipment:'device',sources:'source'},idOf=r=>r.slug||r.id;
 const detail=$('wiki-record'),list=$('wiki-list');
 let reusableHost=null,reusableViewer=null;const viewerPool=document.createElement('div');viewerPool.hidden=true;document.body.append(viewerPool);
 function rows(){const term=$('wiki-search').value.toLowerCase(),filter=$('wiki-filter').value;return C[category].filter(r=>[r.name,r.title,r.originalName,r.slug,r.id,r.formula,r.smiles].some(v=>String(v||'').toLowerCase().includes(term))&&(category!=='compounds'||filter==='all'||r.kind===filter));}
 function renderList(){const found=rows();$('wiki-count').textContent=`${found.length} ${category} · reference snapshot, not live server telemetry`;
 list.innerHTML=found.length?found.map(r=>`<article class="card">${tag(r.id||r.kind||r.slug)}<h3>${esc(r.name||r.title)}</h3>${p(r.formula||r.question||r.groupName||r.readStatus)}<a href="#${prefixes[category]}-${encodeURIComponent(idOf(r))}">Explore entry →</a></article>`).join(''):'<p class="empty">No matching entries. Try a formula, ID or another name.</p>';
 }
 function setCategory(k){category=k;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===k)));$('wiki-filter').disabled=k!=='compounds';renderList();}
 function refs(r){return `<h3>Follow the connections</h3>${r.reactions?.length?`<p>${r.reactions.map(id=>link('reaction',id)).join(' · ')}</p>`:''}${r.equipment?.length?`<p>${r.equipment.map(id=>link('device',id,C.equipment.find(e=>e.id===id)?.name)).join(' · ')}</p>`:''}`;}
 function show(r){
  detail.hidden=false;detail.className='record panel';let s=`<div class="toolbar"><a href="#${category}">← Back to ${category}</a>${tag(r.id||r.slug)}</div><h2>${esc(r.name||r.title)}</h2>`;
  if(category==='compounds'){
   s+=tag(r.kind)+`<div class="split"><div>${r.visual?`<div class="molecular-plate">${r.visual.svg}</div>`:'<p class="empty">No discrete molecular structure is supplied for this entry. Formal components do not require an invented 3D molecule.</p>'}</div><div><dl class="meta-grid"><dt>Formula</dt><dd>${esc(r.formula||'Unspecified')}</dd><dt>Formal charge</dt><dd>${esc(r.charge??'Unspecified')}</dd><dt>Functional groups</dt><dd>${esc(r.family.join(', ')||'See component definition')}</dd><dt>SMILES</dt><dd><code>${esc(r.smiles||'Not assigned')}</code></dd><dt>Identity</dt><dd><code>${esc(r.recordId||'Not registered')}</code></dd></dl>${p(r.role)}<h3>What to observe</h3>${p(r.observe)}</div></div>`;
   if(r.visual?.sdf)s+='<h3>Rotate the molecular structure</h3><div id="wiki-viewer" class="viewer" aria-label="Rotatable 3D molecular structure"></div><div class="toolbar"><button id="wiki-reset">Reset view</button></div><p class="small">Drag or use arrow keys to rotate; scroll/pinch to zoom. RDKit teaching conformer, not a quantum-optimized intermediate or reaction path.</p>';
   s+=`<h3>Stereochemistry</h3>${p(r.stereo)}<h3>Scope and limits</h3>${p(r.limit)}${refs(r)}${originalLink('../wiki.html#molecule-'+r.slug)}`;
  }else if(category==='reactions'){
   const side=v=>Object.entries(v||{}).map(([id,n])=>`${esc(n)} ${link('compound',id,comp(id)?.name)}`).join(' + ');
   s+=tag(r.status)+`<div class="equation">${side(r.reactants)}<strong> → </strong>${side(r.products)}</div><p class="small">Catalog stoichiometric direction; reversibility is discussed in the mechanism and model definition.</p><h3>The question</h3>${p(r.question)}<h3>How to read the reaction</h3>${p(r.teaching)}<h3>Model limits</h3>${p(r.limit)}<p>Element balance: ${r.atomBalanced===true?'verified in the source catalog':r.atomBalanced===false?'not balanced':'not supplied'}. This does not establish kinetics or selectivity.</p>${r.lessons?.length?'<h3>Classrooms</h3>'+r.lessons.map(id=>pLink(lessonLink(id))).join(''):''}${originalLink('../wiki.html#reaction-'+r.id)}`;
  }else if(category==='equipment'){
   s+=tag(r.groupName)+p(r.limit);if(r.definition){s+=['purpose','inputs','outputs','operation','analysis','status'].filter(k=>r.definition[k]).map(k=>`<h3>${esc(k[0].toUpperCase()+k.slice(1))}</h3>${p(r.definition[k])}`).join('');}
   if(r.inventory){const items=['liquid','gas','solid','adsorbed'].flatMap(part=>Object.entries(r.inventory[part]||{}).filter(([,n])=>n).map(([id,n])=>`<tr><td>${part}</td><td>${link('compound',id,comp(id)?.name)}</td><td>${Number(n).toPrecision(7)}</td></tr>`));s+=`<h3>Reference inventory</h3><div class="table-wrap"><table><thead><tr><th>Compartment</th><th>Component</th><th>Amount / mol</th></tr></thead><tbody>${items.join('')||'<tr><td colspan="3">Empty in this reference snapshot.</td></tr>'}</tbody></table></div><p class="small">Fixed reference snapshot, not live server telemetry. Compartment labels do not certify physical phases. ${r.capacity?'Model capacity: '+esc(r.capacity)+' mol.':''}</p>`;}
   s+='<h3>Related components</h3><p>'+(r.compounds||[]).map(id=>link('compound',id,comp(id)?.name)).join(' · ')+'</p>'+originalLink('../'+(r.manual||r.page),'Detailed operating manual · Chinese')+' · '+originalLink('../wiki.html#device-'+r.id);
  }else{
   s+=tag(r.readStatus)+`<h3>What this source supports</h3>${p(r.supports)}<h3>Evidence boundary</h3>${p(r.boundary)}${r.url?`<a href="${esc(r.url)}" rel="noopener">Open source →</a>`:''}`;
  }
  if(reusableHost)viewerPool.append(reusableHost);
  detail.innerHTML=s;list.hidden=true;
  if(category==='compounds'&&r.visual?.sdf){
   const placeholder=detail.querySelector('#wiki-viewer');
   if(reusableHost)placeholder.replaceWith(reusableHost);else reusableHost=placeholder;
   const v=reusableViewer||(reusableViewer=viewerAt('wiki-viewer'));
   if(v){v.removeAllModels();v.addModel(r.visual.sdf,'sdf');v.resize();molecularStyle(v);$('wiki-reset').onclick=()=>{v.zoomTo();v.render();};}
  }
 }
 function route(){const hash=decodeURIComponent(location.hash.slice(1));const m=hash.match(/^(compound|reaction|device|source)-(.+)$/);if(m){const k=Object.keys(prefixes).find(k=>prefixes[k]===m[1]),r=C[k].find(r=>idOf(r)===m[2]);if(r){setCategory(k);show(r);return;}}
 detail.hidden=true;list.hidden=false;setCategory(Object.keys(prefixes).includes(hash)?hash:'compounds');
 }
 document.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.category;});
 $('wiki-search').oninput=()=>{detail.hidden=true;list.hidden=false;renderList();};$('wiki-filter').onchange=()=>{detail.hidden=true;list.hidden=false;renderList();};window.addEventListener('hashchange',route);route();
 window.__englishWiki={route};
}
const pLink=s=>'<p>'+s+'</p>';

function mechanisms(){const render=()=>{const term=$('lesson-search').value.toLowerCase(),lessons=C.lessons.filter(l=>(l.id+' '+l.title+' '+l.summary).toLowerCase().includes(term));$('lesson-count').textContent=`${lessons.length} classrooms · ${lessons.reduce((n,l)=>n+D.branches[l.id].states.length,0)} mapped states`;$('lesson-list').innerHTML=lessons.map(l=>`<article class="card">${tag(l.id)}${tag(D.branches[l.id].states.length+' states')}<h3>${esc(l.title)}</h3>${p(l.summary)}<a href="lesson.html?id=${encodeURIComponent(l.id)}">Enter classroom →</a></article>`).join('')||'<p class="empty">No matching classroom.</p>';};$('lesson-search').oninput=render;render();}

function classroom(){
 const id=new URLSearchParams(location.search).get('id')||'Fischer',l=C.lessons.find(l=>l.id===id);
 if(!l){$('lesson-title').textContent='Classroom not found';$('lesson-summary').innerHTML='<a href="mechanisms.html">Choose an available lesson.</a>';return;}
 const b=D.branches[id];let index=0,practice=false;const mapped=aid=>{const i=b.atoms.findIndex(a=>String(a.id)===String(aid));return b.atoms[i]?.map??i+1;};
 $('atom-picker').innerHTML='<option value="">Choose an atom</option>'+b.atoms.map(a=>`<option value="${esc(a.id)}">${esc(mapped(a.id))} · ${esc(a.element)}${typeof a.id==='string'?' ('+esc(a.id)+')':''}</option>`).join('');$('atom-picker').onchange=e=>{if(e.target.value!=='')selectAtom(e.target.value);};
 $('lesson-title').textContent=l.title;$('lesson-summary').textContent=l.summary;$('lesson-scope').textContent=l.scope||'A teaching mechanism, not a validated reaction trajectory.';$('lesson-original').href=original(l);
 $('lesson-picker').innerHTML=C.lessons.map(x=>`<option value="${esc(x.id)}">${esc(x.id+' · '+x.title)}</option>`).join('');$('lesson-picker').value=id;$('lesson-picker').onchange=e=>{location.href='lesson.html?id='+encodeURIComponent(e.target.value);};
 const v=viewerAt('lesson-viewer');let model=null;
 function selectAtom(aid){const a=b.atoms.find(x=>String(x.id)===String(aid)),s=b.states[index];if(!a)return;const bonded=s.bonds.filter(([x,y])=>String(x)===String(aid)||String(y)===String(aid)).map(([x,y,n])=>`${mapped(String(x)===String(aid)?y:x)} (order ${n})`);$('atom-picker').value=String(aid);
  const starts=s.arrows.filter(x=>x.source.some(z=>String(z)===String(aid))),ends=s.arrows.filter(x=>x.target.some(z=>String(z)===String(aid)));
  $('atom-feedback').textContent=`Mapped atom ${mapped(a.id)}${typeof a.id==='string'?' ('+a.id+')':''} · ${a.element}. Formal charge: ${s.charges[aid]||0}. Bonded to: ${bonded.join(', ')||'none'}. ${starts.length?'This atom belongs to an electron source in the outgoing step. ':''}${ends.length?'This atom belongs to an electron target in the outgoing step. ':''}${!starts.length&&!ends.length?'No outgoing electron arrow involves this atom in the selected frame.':''}`;
  if(practice){const arrow=s.arrows[0];$('practice-result').textContent=arrow.source.some(x=>String(x)===String(aid))?(arrow.kind==='bond'?`Correct: the electron pair starts in the bond between ${arrow.source.map(mapped).join(' and ')}. Both endpoints locate that bond.`:'Correct: this is the atom donating the first lone pair.'):'Look again at the tail of the first curved arrow. It starts at a lone pair or an existing bond, not at the electron acceptor.';}
 }
 function show(){const s=b.states[index];practice=false;
  $('state-title').textContent=s.title;$('state-why').textContent=s.why;$('state-pitfall').textContent=s.pitfall;$('state-number').textContent=`State ${index+1} of ${b.states.length}`;$('state-progress').style.width=(100*(index+1)/b.states.length)+'%';
  $('previous-state').disabled=index===0;$('next-state').disabled=index===b.states.length-1;
  $('state-buttons').innerHTML=b.states.map((x,i)=>`<button data-state="${i}" ${i===index?'aria-current="step"':''}>${i+1}. ${esc(x.title)}</button>`).join('');$('state-buttons').querySelectorAll('button').forEach(el=>el.onclick=()=>{index=+el.dataset.state;show();});
  $('atom-feedback').textContent='Select an atom to inspect its identity, charge and role. Use Tab and Enter in the 2D drawing, the atom selector, or a 3D atom.';$('atom-picker').value='';
  $('practice-result').textContent='';$('practice-start').disabled=!s.arrows.length;$('practice-prompt').textContent=s.arrows.length?'Locate the source of the first electron arrow. If it begins at a bond, either of that bond’s atoms is accepted.':'No outgoing electron arrow is defined here. Compare the endpoint or identity without inventing an elementary mechanism.';
  window.OCMechanismMotion.show($('motion-host'),b,index,selectAtom);
  if(v){v.removeAllModels();v.removeAllLabels();model=v.addModel();const ids=new Map(b.atoms.map((a,i)=>[String(a.id),i]));const atoms=b.atoms.map(a=>{const pos=s.positions[a.id];const edges=s.bonds.filter(([x,y])=>String(x)===String(a.id)||String(y)===String(a.id));return {elem:a.element,x:pos[0],y:pos[1],z:pos[2],bonds:edges.map(([x,y])=>ids.get(String(String(x)===String(a.id)?y:x))),bondOrder:edges.map(x=>x[2]),properties:{mappedId:a.id},clickable:true,callback:atom=>selectAtom(atom.properties.mappedId)};});model.addAtoms(atoms);molecularStyle(v);labels();}
  window.__englishLessonState={id,index,states:b.states.length,atoms:b.atoms.length,webgl:!!v};
 }
 function labels(){if(!v)return;v.removeAllLabels();if($('show-labels').checked){for(const a of b.atoms){const q=b.states[index].positions[a.id];v.addLabel(String(mapped(a.id))+(typeof a.id==='string'?' ('+a.id+')':''),{position:{x:q[0],y:q[1],z:q[2]},fontSize:10,fontColor:'#122b25',backgroundColor:'#f5f4eb',backgroundOpacity:.85});}}v.render();}
 $('show-labels').onchange=labels;$('reset-camera').onclick=()=>{if(v){v.zoomTo();v.render();}};
 $('previous-state').onclick=()=>{if(index){index--;show();}};$('next-state').onclick=()=>{if(index<b.states.length-1){index++;show();}};
 $('practice-start').onclick=()=>{practice=true;$('practice-result').textContent='Select an electron-source atom in either drawing.';};
 window.__englishLesson={setState:i=>{if(Number.isInteger(i)&&i>=0&&i<b.states.length){index=i;show();}},selectAtom};show();
}

function plants(){const stages=[['Build the upstream C5 → C8 → C10 chain',['U01','U02','U03','U04','U05','U06']],['Condense and cyclize to the ionone skeleton',['U07','U08','U08-alpha','U06-workup','U07-quench','U08-quench']],['Build the C14 aldehyde branch',['A01','A02','A03','A04']],['Build the C6 enynol branch',['B01','B02','B03','B04']],['Activate, couple and work up',['C01','C02','C03','C04']],['Hydrogenate, acetylate and finish',['D01','D02','E01','E02','E03']],['Future alcohol product',['F01']]];
 $('route-stages').innerHTML=stages.map(([title,ids],i)=>`<div class="stage"><h3>${i+1}. ${title}</h3>${ids.map(id=>{const r=C.reactions.find(x=>x.id===id);return r?`<p>${link('reaction',id,id+' · '+r.name)} ${tag(r.status)}</p>`:'';}).join('')}</div>`).join('');
}
function glossary(){$('glossary-search').oninput=e=>{const t=e.target.value.toLowerCase();$('glossary-rows').querySelectorAll('tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(t));};const a=D.coverage;$('translation-coverage').textContent=`Current edition: ${a.compounds} substance entries, ${a.reactions} reactions, ${a.equipment} equipment/concept entries, ${a.lessons} lessons and ${a.states} states. ${a.translatedSourceStrings} distinct source passages translated; ${a.pendingSourceStrings} source passages awaiting English review. Structural and numerical invariants checked during generation.`;}
document.querySelectorAll('nav a').forEach(a=>{if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});
const page=document.body.dataset.page;({index:stats,wiki,mechanisms,lesson:classroom,plants,glossary}[page]||(()=>{}))();document.documentElement.dataset.englishReady='true';
})();
