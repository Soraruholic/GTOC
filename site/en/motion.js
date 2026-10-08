/* Shared, local-only full-structure teaching animation. No inferred reaction trajectories. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
let panel=null,current=null,raf=0,progress=0,playing=false,selectAtom=()=>{};
const node=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n;};
const charge=(s,id)=>s.charges[id]||0;
function stop(){cancelAnimationFrame(raf);playing=false;if(panel)panel.querySelector('[data-motion-play]').textContent='Play this step';}
// Convex placement prevents a bond between two centres from passing through a third centre.
// This is a connectivity diagram, not molecular geometry or a reaction trajectory.
function centerPositions(entries){const p={};entries.forEach(([,id],i)=>{const angle=-Math.PI/2+2*Math.PI*i/entries.length;p[id]=entries.length<3?[220+420*i,170]:[430+290*Math.cos(angle),180+120*Math.sin(angle)];});return p;}
function init(host){
 if(panel===host)return;
 stop();panel=host;host.innerHTML='<div class="motion-toolbar"><button type="button" data-motion-play>Play this step</button><button type="button" data-motion-reset>Reset step</button><label>Step progress <input data-motion-progress aria-label="2D step animation progress" type="range" min="0" max="100" value="0"></label><span data-motion-status role="status"></span></div><div data-motion-canvas></div><p class="small" data-motion-caption></p>';
 host.querySelector('[data-motion-play]').onclick=()=>{if(playing){stop();return;}if(progress>=1)progress=0;playing=true;let previousFrame=null;host.querySelector('[data-motion-play]').textContent='Pause animation';const frame=now=>{if(!playing)return;const elapsed=previousFrame===null?0:Math.max(0,Math.min(100,now-previousFrame));previousFrame=now;progress=Math.min(1,progress+elapsed/4500);draw();if(progress<1)raf=requestAnimationFrame(frame);else stop();};raf=requestAnimationFrame(frame);};
 host.querySelector('[data-motion-reset]').onclick=()=>{stop();progress=0;draw();};
 host.querySelector('[data-motion-progress]').oninput=e=>{stop();progress=+e.target.value/100;draw();};
}
function draw(){
 const {branch,index}=current,from=branch.states[index],to=branch.states[index+1],result=!!to&&progress>=.82,s=result?to:from,canvas=panel.querySelector('[data-motion-canvas]');
 canvas.innerHTML=s.svg;const svg=canvas.querySelector('svg');svg.setAttribute('role','img');svg.setAttribute('aria-label','2D mechanism animation with full atom mapping');
 const overlay=node('g',{'data-motion-overlay':'','font-family':'sans-serif'},svg),points=s.drawingPoints;
 const defs=node('defs',{},overlay);for(const [id,color] of [['pair','#256da0'],['bond','#ad6c24']]){const marker=node('marker',{id:'motion-'+id,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'},defs);node('path',{d:'M0 0L10 5L0 10z',fill:color},marker);}
 if(to&&!result){
  for(const [i,a] of from.arrows.entries()){
   const p=points[a.source[0]],q=a.kind==='bond'?points[a.source[1]]:p,r=a.target.length===2?[(points[a.target[0]][0]+points[a.target[1]][0])/2,(points[a.target[0]][1]+points[a.target[1]][1])/2]:points[a.target[0]];if(!p||!q||!r)throw new Error('Missing mapped 2D arrow atom');
   const source=a.kind==='bond'?[(p[0]+q[0])/2,(p[1]+q[1])/2]:[p[0]-8,p[1]-12],dx=r[0]-source[0],dy=r[1]-source[1],len=Math.hypot(dx,dy)||1;
   const end=a.target.length===2?r:[r[0]-dx/len*15,r[1]-dy/len*15],bend=(i%2?-1:1)*Math.min(85,Math.max(40,len*.25));
   const path=node('path',{d:`M${source} Q${(source[0]+end[0])/2-dy/len*bend},${(source[1]+end[1])/2+dx/len*bend} ${end}`,fill:'none',stroke:a.kind==='pair'?'#256da0':'#ad6c24','stroke-width':3,'marker-end':'url(#motion-'+a.kind+')','data-electron-arrow':i,'data-target-atoms':a.target.join(',')},overlay);
   const t=Math.min(1,progress/.62),length=path.getTotalLength();path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length*(1-t));
   if(progress>0&&progress<.65){const pos=path.getPointAtLength(length*t);node('circle',{cx:pos.x,cy:pos.y,r:4,fill:'#256da0','data-electron-pair':''},overlay);node('circle',{cx:pos.x+6,cy:pos.y,r:2.5,fill:'#256da0'},overlay);}
  }
 }
 if(to&&progress>=.62){
  const key=(a,b)=>[String(a),String(b)].sort().join('|'),before=new Map(from.bonds.map(([a,b,o])=>[key(a,b),o])),after=new Map(to.bonds.map(([a,b,o])=>[key(a,b),o]));
  for(const edge of new Set([...before.keys(),...after.keys()])){
   const change=(after.get(edge)||0)-(before.get(edge)||0);if(!change)continue;
   const [a,b]=edge.split('|'),p=points[a],q=points[b];if(!p||!q)continue;
   if((result&&change>0)||(!result&&change<0))node('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:change>0?'#16834b':'#c44139','stroke-width':8,opacity:.4,'data-bond-change':change},overlay);
  }
 }
 for(const a of branch.atoms){const p=points[a.id];if(!p)continue;const g=node('g',{'data-motion-atom':a.id,role:'button',tabindex:0,'aria-label':'Select mapped atom '+(a.map||a.id)},overlay);node('circle',{cx:p[0],cy:p[1],r:15,fill:'transparent',stroke:'transparent'},g);const act=()=>selectAtom(a.id);g.onclick=act;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}};
  if(to&&progress>=.62&&charge(from,a.id)!==charge(to,a.id)){const t=node('text',{x:p[0]+15,y:p[1]-18,fill:'#8c3371','font-size':13,'data-charge-change':a.id},overlay);t.textContent=`${charge(from,a.id)} → ${charge(to,a.id)}`;}
 }
 panel.querySelector('[data-motion-progress]').value=String(Math.round(progress*100));
 panel.querySelector('[data-motion-status]').textContent=!to?'Branch endpoint':result?'Next keyframe preview':progress<.62?(from.arrows.length?'Electron-pair movement':'Net endpoint observation (elementary steps not expanded)'):from.arrows.length?'Bond-order / charge changes':'Net bond comparison (elementary steps not expanded)';
 panel.querySelector('[data-motion-caption]').textContent=!to?'The complete structure and atom mapping are retained.':from.arrows.length?'Blue starts at a lone pair; gold starts at a bond. Red marks weakening/breaking bonds, green marks forming/strengthening bonds. The slider previews the next keyframe. Use Next state above to advance the full lesson.':'This branch shows net-equation or identity endpoints only; no electron arrows are invented. The 2D transition is not a reaction pathway.';
}
window.OCMechanismMotion={show(host,branch,index,select){init(host);stop();current={branch,index};selectAtom=select;progress=0;panel.querySelector('[data-motion-play]').disabled=index===branch.states.length-1;panel.querySelector('[data-motion-progress]').disabled=index===branch.states.length-1;draw();},getState:()=>({progress,playing,index:current?.index}),centerPositions,stop};
window.addEventListener('pagehide',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
