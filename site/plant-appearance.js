/* Industrial teaching scene. Geometry uses construction coordinates; motion shows direction only. */
(()=>{'use strict';
const DUTIES={SUPPLY:'#5c9fc0',PROCESS:'#db934d',COLLECT:'#b081a7',RECLAIM:'#56a48a'};
const mix=(hex,f)=>'#'+hex.slice(1).match(/../g).map(x=>Math.round(Math.min(255,parseInt(x,16)*f)).toString(16).padStart(2,'0')).join('');
class PlantAppearance {
 constructor(canvas,{t,name,tag,lineTag,onLocate}){
  Object.assign(this,{canvas,t,name,tag,lineTag,onLocate});this.ctx=canvas.getContext('2d');this.base=document.createElement('canvas');
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.moving=!this.reduced.matches;this.onScreen=false;this.elapsed=0;this.frame=0;this.last=0;this.painted=0;this.labels=[];this.demo='FLOW';
  this.button=document.getElementById('flow-motion');this.button.onclick=()=>{this.moving=!this.moving;this.motionState();};
  this.reduced.addEventListener('change',e=>{this.moving=!e.matches;this.motionState();});
  document.addEventListener('visibilitychange',()=>this.motionState());
  this.observer=new IntersectionObserver(es=>{this.onScreen=es[0].isIntersecting;this.motionState();});this.observer.observe(canvas);this.motionState();
 }
 motionState(){
  this.button.textContent=this.moving?this.t('暂停流向演示','Pause direction demo'):this.t('播放流向演示','Play direction demo');this.button.setAttribute('aria-pressed',String(this.moving));
  cancelAnimationFrame(this.frame);this.frame=0;this.last=0;
  if(this.moving&&this.onScreen&&!document.hidden&&this.view&&this.demo==='FLOW')this.frame=requestAnimationFrame(now=>this.tick(now));
  if(this.view)this.paintMotion();
 }
 tick(now){this.elapsed+=this.last?Math.min(80,now-this.last):0;this.last=now;
  if(now-this.painted>=1000/30){this.paintMotion();this.painted=now;}
  this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 face(vertices,color,stroke='#58716c'){
  const ps=vertices.map(this.project);this.shapes.push({depth:ps.reduce((n,p)=>n+p[2],0)/ps.length,draw:()=>{
   const c=this.ctx;c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=stroke;c.lineWidth=.45;c.stroke();
  }});
 }
 box(x,y,z,w,h,d,color){const a=x+w,b=y+h,f=z+d;
  this.face([[x,y,z],[x,b,z],[a,b,z],[a,y,z]],mix(color,.82));this.face([[a,y,f],[a,b,f],[x,b,f],[x,y,f]],mix(color,.95));
  this.face([[x,y,f],[x,b,f],[x,b,z],[x,y,z]],mix(color,.74));this.face([[a,y,z],[a,b,z],[a,b,f],[a,y,f]],color);
  this.face([[x,b,z],[x,b,f],[a,b,f],[a,b,z]],mix(color,1.14));
 }
 cylinder(x,y,z,r,h,color,axis='y',topRadius=r){
  const v=(a,k)=>{const radius=k===0?r:topRadius;return axis==='x'?[x-h/2+k,y+radius*Math.cos(a),z+radius*Math.sin(a)]:[x+Math.cos(a)*radius,y+k,z+Math.sin(a)*radius];};
  for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;this.face([v(a,0),v(a,h),v(b,h),v(b,0)],mix(color,.82+.2*Math.cos(a-.8)));}
  this.face(Array.from({length:12},(_,i)=>v(i*Math.PI/6,h)),mix(color,1.15));
 }
 line(a,b,color,width=1,arrow=false){const p=this.project(a),q=this.project(b),c=this.ctx;
  this.shapes.push({depth:(p[2]+q[2])/2,draw:()=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();
   if(arrow&&Math.hypot(q[0]-p[0],q[1]-p[1])>18)this.arrow([(p[0]+q[0])/2,(p[1]+q[1])/2],Math.atan2(q[1]-p[1],q[0]-p[0]),color,4);
  }});
 }
 arrow(p,angle,color,size){const c=this.ctx;c.save();c.translate(p[0],p[1]);c.rotate(angle);c.fillStyle=color;c.beginPath();c.moveTo(size,0);c.lineTo(-size,-size*.7);c.lineTo(-size,size*.7);c.closePath();c.fill();c.restore();}
 flush(){this.shapes.sort((a,b)=>a.depth-b.depth).forEach(s=>s.draw());this.shapes=[];}
 pad(x,z,w,d,color){this.box(x,-1.9,z,w,.25,d,color);}
 machine(m,active){
  const x=m.x+.5,z=m.z+m.w/2,y=m.y+.35,h=m.h-1,r=m.family==='D'?1.59:2.4;
  const steel=active?'#91bfb4':this.dark?'#829b9a':'#aabebc',trim=active?'#c8964b':'#587e7b';
  this.pad(x-m.w/2,z-m.w/2,m.w,m.w,active?'#76978c':'#89988d');
  for(const dx of [-1,1])for(const dz of [-1,1])this.box(x+dx*r*.85-.12,-1.6,z+dz*r*.85-.12,.24,1.3,.24,'#596d70');
  if(m.family==='M'){
   for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){this.cylinder(x+a*1.7,y,z+b*1.7,.5,h,steel);this.cylinder(x+a*1.7,y+h,z+b*1.7,.26,.45,trim);}
  }else if(['X','S'].includes(m.family)){
   this.cylinder(x,y+3,z,2.5,m.w*.7,steel,'x');
   for(const side of [-1,1]){this.cylinder(x+side*m.w*.31,y+3,z,2.55,.16,trim,'x');this.box(x+side*1.6-.2,y-1,z-1.1,.4,1.7,2.2,'#5c7376');}
   if(m.family==='X')for(let k=-2;k<=2;k++)this.cylinder(x+k*.85,y+3,z,2.52,.08,'#799c99','x');
  }else{
   this.cylinder(x,y,z,r,h,steel);this.cylinder(x,y+h,z,r,.45,steel,'y',r*.65);
   for(const level of [y+.15,y+h-.15])this.cylinder(x,level,z,r*1.04,.13,trim);
   if(['R','H','K'].includes(m.family)){this.box(x-.38,y+h+.4,z-.38,.76,.6,.76,'#425c63');this.cylinder(x,y+h+1,z,.18,.22,'#cb9c5a');}
   if(['D','F','Y'].includes(m.family))for(let k=1;k<4;k++)this.cylinder(x,y+k*h/4,z,r*1.03,.12,trim);
   if(m.family==='D'){
    for(const dx of [-.3,.3])this.line([x+r+.3+dx,y,z],[x+r+.3+dx,y+h+.4,z],'#cba75e',1.4);
    for(let k=0;k<h;k+=.65)this.line([x+r,y+k,z],[x+r+.6,y+k,z],'#cba75e',1);
   }
  }
  this.box(x-.58,y,z-m.w/2-.14,1.16,.68,.2,'#364f56');this.box(x-.4,y+.2,z-m.w/2-.18,.8,.25,.06,'#cedbc4');
  this.cylinder(x,y+.3,z-r-.38,.23,.3,'#6d8d92');
 }
 store(s,active){
  const x=s.x+.5,z=s.z+2.5,y=s.y-.6,color=active?'#d7b477':s.receiver?'#b39aaf':s.phase==='GAS'?'#8bafbd':s.phase==='SOLID'?'#bbad8e':'#99b9ab';
  this.pad(x-2.5,z-2.5,5,5,s.receiver?'#95868d':'#879b90');
  if(s.phase==='GAS'){
   this.cylinder(x,s.y+1.25,z,1.45,4,color,'x');
   for(const dx of [-1.35,1.35]){this.box(x+dx-.2,y-.7,z-1,.4,1.6,2,'#667d80');this.cylinder(x+dx,s.y+1.25,z,1.5,.15,'#567c88','x');}
  }else{
   if(s.phase==='SOLID'){this.cylinder(x,y+.25,z,.45,.9,color,'y',2);this.cylinder(x,y+1.15,z,2,2.4,color);}
   else this.cylinder(x,y,z,2.15,3.5,color);
   this.cylinder(x,y+3.5,z,2.15,.35,color,'y',1.6);
   for(const level of [y+1.1,y+3.4])this.cylinder(x,level,z,2.2,.12,s.receiver?'#875d82':'#517f75');
  }
  this.box(x-.6,s.y,z-2.55,1.2,.65,.15,'#41565b');this.box(x-.43,s.y+.2,z-2.58,.86,.23,.05,'#d3dfc6');
 }
 nozzle(a,p,color){
  if(!a)return;
  // The exported face remains the connection point. A visible neck joins that
  // face to the illustrative vessel within its multiblock envelope.
  const center=[a.x+.5,p[1],a.z+(a.w||5)/2],dx=p[0]-center[0],dz=p[2]-center[2];
  // The game renders an independent neck into the vessel body, with no shared manifold.
  const length=Math.hypot(dx,dz)||1,radius=['M','X','S'].includes(a.family)?0:a.family==='D'?1.59:a.family?1.8:1.5;
  const shell=[center[0]+dx/length*Math.min(radius,length),p[1],center[2]+dz/length*Math.min(radius,length)];
  this.line(p,shell,'#526d70',Math.max(2,this.scale*.3));
  this.box(p[0]-.25,p[1]-.25,p[2]-.25,.5,.5,.5,color);
 }
 accessPart(a){
  const p=this.project([a.x+.5,a.y+.5,a.z+.5]);if(p[0]<-12||p[0]>this.w+12||p[1]<-12||p[1]>this.h+12)return;
  const {x,y,z,meta}=a,steel=this.dark?'#617e80':'#7e9695',gold='#cbab5f';
  if(meta===0){
   this.face([[x,y+.2,z],[x+1,y+.2,z],[x+1,y+.2,z+1],[x,y+.2,z+1]],steel);
   if(this.scale>7)for(let i=1;i<4;i++)this.line([x+i/4,y+.21,z+.1],[x+i/4,y+.21,z+.9],this.dark?'#263f3a':'#435f59',.6);
  }else if(meta===1)this.box(x+.38,y,z+.38,.24,1,.24,steel);
  else if(meta===2)this.box(x,y+.35,z+.38,1,.3,.24,steel);
  else if(meta===3)this.box(x+.38,y+.35,z,.24,.3,1,steel);
  else if(meta===4||meta===5){
   const a=meta===4?[x,y+1,z+.5]:[x+.5,y+1,z],b=meta===4?[x+1,y+1,z+.5]:[x+.5,y+1,z+1];
   this.line(a,b,gold,1.6);this.line([a[0],y,a[2]],a,gold,1);if(this.scale>5)this.line([a[0],y+.5,a[2]],[b[0],y+.5,b[2]],gold,1);
  }else if(meta===6){
   for(const dx of [.12,.88])this.line([x+dx,y,z+.9],[x+dx,y+1,z+.9],gold,1.4);
   for(const dy of [.15,.48,.81])this.line([x+.12,y+dy,z+.9],[x+.88,y+dy,z+.9],steel,1.1);
  }
 }
 fitting(f){
  const [x,y,z]=f.point,color=f.role==='VALVE'?(this.demo==='ISOLATED'?'#c77d62':'#69aa86'):f.role==='REGULATOR'?'#6a9fbb':f.role==='FEEDER'?'#b39a68':'#648e91';
  this.box(x-.32,y-.28,z-.32,.64,.56,.64,color);
  if(f.role==='VALVE'){
   const vertical=this.demo==='ISOLATED';this.line([x-.6,y+.4,z],[x+.6,y+.4,z],vertical?'#ba7755':'#d9b76b',2);
   if(vertical)this.line([x,y+.4,z-.6],[x,y+.4,z+.6],'#c87962',2);
  }else this.box(x+.28,y-.2,z-.26,.36,.4,.52,'#a5bcb0');
 }
 badge(a,priority=false){
  const {w,h}=this,point=this.project([a.x+.5,a.y+(a.h||4)+1.5,a.z+(a.w||5)/2]),text=this.tag(a),c=this.ctx;
  if(point[0]<0||point[0]>w||point[1]<15||point[1]>h-42)return;
  c.font=(priority?'bold ':'')+'11px ui-monospace,Consolas,monospace';const width=c.measureText(text).width+14;
  let x=Math.max(6,Math.min(w-width-6,point[0]-width/2)),y=point[1]-23;
  for(let tries=0;tries<6;tries++){
   if(!this.labels.some(b=>x<b.x+b.w+4&&x+width>b.x-4&&y<b.y+b.h+4&&y+21>b.y-4))break;y-=25;
  }
  if(y<42||this.labels.some(b=>x<b.x+b.w+4&&x+width>b.x-4&&y<b.y+b.h+4&&y+21>b.y-4))return;
  c.strokeStyle=priority?'#c3924f':this.dark?'#69837a':'#98aea4';c.lineWidth=1;c.beginPath();c.moveTo(point[0],point[1]);c.lineTo(x+width/2,y+21);c.stroke();
  c.fillStyle=priority?(this.dark?'#674f30':'#fff0d3'):(this.dark?'#203a34ee':'#f9fcf5ef');c.fillRect(x,y,width,21);c.strokeRect(x,y,width,21);c.fillStyle=this.dark?'#f0e7d3':'#2a5246';c.fillText(text,x+7,y+14);
  this.labels.push({id:a.id,x,y,w:width,h:21});
 }
 draw(view){
  this.view=view;const {route,selected,yaw,pitch,zoom,focusMode,focusAsset}=view,chosen=route.lines[selected];
  const rect=this.canvas.getBoundingClientRect(),w=this.w=rect.width,h=this.h=rect.height,dpr=this.dpr=Math.min(2,devicePixelRatio||1),c=this.ctx;
  this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);this.shapes=[];this.labels=[];
  this.dark=document.documentElement.dataset.theme==='dark';const gradient=c.createLinearGradient(0,0,w,h);gradient.addColorStop(0,this.dark?'#152c2d':'#e9f0e9');gradient.addColorStop(1,this.dark?'#23352e':'#fcf7e9');c.fillStyle=gradient;c.fillRect(0,0,w,h);
  const all=[...route.machines,...route.stores],minZ=Math.min(...route.lines.flatMap(l=>l.points.map(p=>p[2])))-7,maxZ=Math.max(...all.map(a=>a.z+9));
  const fx=chosen.points.map(p=>p[0]),fz=chosen.points.map(p=>p[2]);
  const cx=focusMode?(focusAsset?focusAsset.x+.5:(Math.min(...fx)+Math.max(...fx))/2):44;
  const cz=focusMode?(focusAsset?focusAsset.z+(focusAsset.w||5)/2:(Math.min(...fz)+Math.max(...fz))/2):(minZ+maxZ)/2;
  const extent=focusMode?(focusAsset?25:Math.max(28,Math.max(...fx)-Math.min(...fx)+20,Math.max(...fz)-Math.min(...fz)+20)):Math.max(110,maxZ-minZ);
  this.scale=Math.min(w*.82/(extent*1.05),h*.82/(extent*.85))*zoom;
  this.project=([x,y,z])=>{x-=cx;z-=cz;const xx=x*Math.cos(yaw)-z*Math.sin(yaw),zz=x*Math.sin(yaw)+z*Math.cos(yaw);return[w/2+xx*this.scale,h*.55+(zz*Math.sin(pitch)-y*Math.cos(pitch))*this.scale,zz*Math.cos(pitch)+y*Math.sin(pitch)];};
  this.face([[-7,-2,minZ],[98,-2,minZ],[98,-2,maxZ],[-7,-2,maxZ]],this.dark?'#30433a':'#dce4d8');this.flush();
  // Painted footprints indicate teaching zones, not extra blocks placed in the world.
  const raw=route.stores.filter(s=>!s.receiver),receivers=route.stores.filter(s=>s.receiver);
  for(const [list,color]of [[raw,this.dark?'#334e50':'#cbdfe0'],[receivers,this.dark?'#4b404a':'#e0d4df']])if(list.length){const near=Math.min(...list.map(s=>s.z))-1,far=Math.max(...list.map(s=>s.z))+6;this.face([[-4,-1.99,near],[94,-1.99,near],[94,-1.99,far],[-4,-1.99,far]],color);}
  for(let x=0;x<=98;x+=14)this.line([x,-1.98,minZ],[x,-1.98,maxZ],this.dark?'#456052':'#bdcdbd',.5);
  for(let z=Math.ceil(minZ/14)*14;z<maxZ;z+=14)this.line([-7,-1.98,z],[98,-1.98,z],this.dark?'#456052':'#bdcdbd',.5);this.flush();
  if(view.access)(route.access||[]).forEach(a=>this.accessPart(a));
  route.lines.forEach((l,i)=>{if(i!==selected&&!view.showAll)return;const active=i===selected,col=active?DUTIES[l.kind]:(this.dark?'#648078':'#95aba2');
   for(let j=1;j<l.points.length;j++){this.line(l.points[j-1],l.points[j],this.dark?'#314c47':'#718d87',active?5:1.7);this.line(l.points[j-1],l.points[j],col,active?3:1,false);}
  });
  route.machines.forEach(m=>this.machine(m,m.id===chosen.source||m.id===chosen.target));route.stores.forEach(s=>this.store(s,s.id===chosen.source||s.id===chosen.target));
  route.lines.forEach((l,i)=>{if(i!==selected&&!view.showAll)return;this.nozzle(all.find(a=>a.id===l.source),l.points[0],'#6d9fb6');this.nozzle(all.find(a=>a.id===l.target),l.points.at(-1),'#65a38a');(l.fittings||[]).forEach(f=>this.fitting(f));});this.flush();
  // The selected line is traced above equipment so its direction stays inspectable.
  for(let j=1;j<chosen.points.length;j++)this.line(chosen.points[j-1],chosen.points[j],DUTIES[chosen.kind],1.8,true);this.flush();
  const priority=all.filter(a=>a.id===chosen.source||a.id===chosen.target||a===focusAsset);priority.forEach(a=>this.badge(a,true));
  if(view.labels)all.filter(a=>!priority.includes(a)).sort((a,b)=>this.project([b.x,b.y,b.z])[2]-this.project([a.x,a.y,a.z])[2]).forEach(a=>this.badge(a));
  for(const [p,col]of [[chosen.points[0],'#3c8fbd'],[chosen.points.at(-1),'#39a078']]){const xy=this.project(p);c.beginPath();c.arc(xy[0],xy[1],4,0,2*Math.PI);c.fillStyle=col;c.fill();c.strokeStyle='#fff7e3';c.lineWidth=1.4;c.stroke();}
  c.fillStyle=this.dark?'#192f2dee':'#f4f8eeed';c.fillRect(0,0,w,42);c.fillRect(0,h-36,w,36);
  c.fillStyle=this.dark?'#ebdfc6':'#345448';c.font='bold 12px ui-monospace,Consolas,monospace';c.fillText(this.lineTag(chosen)+'  /  '+chosen.kind+'  /  DEMO: '+this.demo,18,27);
  c.font='11px system-ui';c.fillStyle=this.dark?'#bdcbc1':'#5b7065';c.fillText(this.t('铭牌可点击 · 拖动旋转 · 滚轮缩放','Click a tag · Drag to orbit · Scroll to zoom'),18,h-18);
  this.base.width=this.canvas.width;this.base.height=this.canvas.height;this.base.getContext('2d').drawImage(this.canvas,0,0);
  this.paintMotion();this.motionState();
 }
 sample(fraction){const points=this.view.route.lines[this.view.selected].points,lengths=points.slice(1).map((b,i)=>Math.hypot(...b.map((v,j)=>v-points[i][j]))),total=lengths.reduce((a,b)=>a+b,0);let remaining=Math.max(0,Math.min(1,fraction))*total;
  for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]||i===lengths.length-1){const f=lengths[i]?remaining/lengths[i]:0;return{point:points[i].map((v,j)=>v+(points[i+1][j]-v)*f),segment:i};}remaining-=lengths[i];}
  return{point:points[0],segment:0};
 }
 paintMotion(){if(!this.view)return;const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.drawImage(this.base,0,0,this.w,this.h);const l=this.view.route.lines[this.view.selected];
  if(this.demo==='FLOW')for(let i=0;i<3;i++){const sample=this.sample((this.elapsed/10000+i/3)%1),p=this.project(sample.point),a=this.project(l.points[sample.segment]),b=this.project(l.points[sample.segment+1]);c.beginPath();c.arc(p[0],p[1],5,0,Math.PI*2);c.fillStyle=this.dark?'#213a34':'#fff9e8';c.fill();this.arrow(p,Math.atan2(b[1]-a[1],b[0]-a[0]),DUTIES[l.kind],3.5);}
  if(window.__dedicatedScene)Object.assign(window.__dedicatedScene,{motionEnabled:this.moving,motionRunning:!!this.frame,elapsed:this.elapsed,labelCount:this.labels.length,assetTags:[...this.view.route.machines,...this.view.route.stores].map(a=>this.tag(a)),selectedLineTag:this.lineTag(l),demo:this.demo,accessParts:this.view.access?(this.view.route.access||[]).length:0,fittings:(l.fittings||[]).map(f=>f.role)});
 }
 hit(x,y){return this.labels.find(a=>x>=a.x&&x<=a.x+a.w&&y>=a.y&&y<=a.y+a.h);}
}
window.PlantAppearance=PlantAppearance;
})();
