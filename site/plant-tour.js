/* A local, reversible lesson. Positions follow the frozen polyline; no stock is simulated. */
(()=>{'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
class PlantTour {
 constructor(appearance,{t,name,tag,lineTag}){
  Object.assign(this,{appearance,t,name,tag,lineTag});appearance.tour=this;
  this.root=document.getElementById('stream-tour');this.position=0;this.playing=false;this.enabled=false;
  if(!this.root)return;
  this.play=document.getElementById('tour-play');this.slider=document.getElementById('tour-position');
  this.play.onclick=()=>{this.enabled=true;this.playing=!this.playing;if(this.position>=1)this.position=0;
   if(this.playing){appearance.moving=true;appearance.motionState();}this.update();appearance.paintMotion();};
  this.slider.oninput=()=>{this.enabled=true;this.playing=false;this.position=clamp(Number(this.slider.value)/1000);this.update();appearance.paintMotion();};
  for(const [id,offset]of [['tour-back',-1],['tour-next',1]])document.getElementById(id).onclick=()=>{
   this.enabled=true;this.playing=false;const points=this.stops.map(s=>s.at),p=this.position;
   this.position=offset>0?(points.find(v=>v>p+1e-6)??1):([...points].reverse().find(v=>v<p-1e-6)??0);
   this.update();appearance.paintMotion();
  };
  document.getElementById('tour-reset').onclick=()=>{this.enabled=false;this.playing=false;this.position=0;this.update();appearance.paintMotion();};
 }
 sync(view){
  if(!this.root)return;
  const l=view.route.lines[view.selected],key=view.route.kind+'|'+l.id+'|'+l.source+'|'+l.target+'|'+view.selected;
  this.line=l;this.route=view.route;
  if(key!==this.key){this.key=key;this.position=0;this.playing=false;this.enabled=false;this.stops=this.landmarks(l);}
  if(this.appearance.demo!=='FLOW')this.playing=false;
  this.update();
 }
 landmarks(l){
  const t=this.t,source={at:0,title:t('01 · 确认来源','01 · Identify the source'),body:t('核对来源仓或上游设备的物流身份与可用量。空仓不会自动换料；混合物流保持其组成。','Check the source store or upstream equipment for identity and available stock. Empty stores keep their identity; mixtures keep their composition.')};
  const total=l.points.slice(1).reduce((n,b,i)=>n+Math.hypot(...b.map((v,j)=>v-l.points[i][j])),0);
  const fraction=p=>{let prior=0;for(let i=1;i<l.points.length;i++){const a=l.points[i-1],b=l.points[i],len=Math.hypot(...b.map((v,j)=>v-a[j]));
   const ap=Math.hypot(...p.map((v,j)=>v-a[j])),pb=Math.hypot(...p.map((v,j)=>v-b[j]));
   if(Math.abs(ap+pb-len)<1e-6)return clamp((prior+ap)/total);prior+=len;}return null;};
  const stops=[source];
  for(const f of l.fittings||[]){const at=fraction(f.point);if(at===null)continue;
   const valve=f.role==='VALVE',gas=f.role==='REGULATOR',solid=f.role==='FEEDER';
   stops.push({at,title:valve?t('03 · 隔离与检修','03 · Isolation'):gas?t('02 · 气体调节','02 · Gas regulation'):solid?t('02 · 封闭供料','02 · Enclosed feeding'):t('02 · 泵送接点','02 · Pump station'),body:valve?t('隔离阀关闭会联锁整线。开阀只恢复通路资格；仍要满足库存、结构与接收容量。','Closing isolation interlocks the plant. Opening it restores the path only; stock, structure and receiver capacity must also pass.'):t('相态决定输送部件：液体泵、气体调节器或固体给料器。箭头表示固定方向；演示速度不表示实际流量。','Phase selects the fitting: liquid pump, gas regulator or solids feeder. Arrows show fixed direction; playback speed is not a physical flow rate.')});
  }
  stops.push({at:1,title:t('04 · 接收与确认','04 · Receive and confirm'),body:l.kind==='RECLAIM'?t('只有合格的单物料才能沿这条回用线返回对应仓。回用在确认入账之后，才可供下一工序使用。','Only qualified single material returns to its matching store here. Reclaim becomes available after its receipt is committed.'):l.kind==='COLLECT'?t('整股物流进入具名接收罐，保留残余与批次来源。接收罐满时停机，不能用动画把废物消掉。','The named receiver retains the whole stream, residues and batch origin. Full capacity stops the line; animation cannot erase waste.'):t('接收设备核对输入后执行工序；反应与分离发生在设备内。游戏扣账与入账等待服务器提交确认。','The receiver validates input before its operation. Reaction and separation happen inside equipment. Game debits and credits await server commit.')});
  return stops.sort((a,b)=>a.at-b.at);
 }
 advance(ms){if(this.root&&this.playing){this.position=clamp(this.position+ms/18000);if(this.position===1)this.playing=false;this.update();}}
 update(){
  if(!this.root||!this.line)return;
  const t=this.t,blocked=this.appearance.demo!=='FLOW';
  if(blocked)this.playing=false;
  const index=this.stops.reduce((n,s,i)=>this.position+1e-6>=s.at?i:n,0),stop=this.stops[index];
  this.play.disabled=blocked;this.play.textContent=this.playing?t('暂停导览','Pause tour'):this.position>=1?t('重新播放','Replay tour'):t('播放交接导览','Play handoff tour');
  this.play.setAttribute('aria-pressed',String(this.playing));this.slider.value=String(Math.round(this.position*1000));
  this.slider.setAttribute('aria-valuetext',Math.round(this.position*100)+'% · '+stop.title);
  document.getElementById('tour-progress').textContent=Math.round(this.position*100)+'%';
  document.getElementById('tour-line').textContent=this.lineTag(this.line)+' · '+this.line.kind;
  document.getElementById('tour-source').textContent=this.name(this.line.source);
  document.getElementById('tour-target').textContent=this.name(this.line.target);
  document.getElementById('tour-title').textContent=stop.title;
  document.getElementById('tour-body').textContent=blocked?t('当前工况已联锁，播放停止。可手动逐站检查原因；恢复“物流交接示例”后再播放。','The selected state interlocks playback. Inspect stops manually; choose Transfer illustration to play again.'):stop.body;
  const steps=document.getElementById('tour-stops');
  if(this.renderKey!==this.key){this.renderKey=this.key;steps.replaceChildren(...this.stops.map((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=s.title;b.onclick=()=>{this.enabled=true;this.playing=false;this.position=s.at;this.update();this.appearance.paintMotion();};return b;}));}
  [...steps.children].forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'step':'false');});
  this.root.dataset.active=String(this.enabled);
  window.__plantTour={enabled:this.enabled,playing:this.playing,position:this.position,stage:index,stops:this.stops.map(s=>s.at),line:this.lineTag(this.line),blocked,serverMutation:false};
 }
}
window.PlantTour=PlantTour;
})();
