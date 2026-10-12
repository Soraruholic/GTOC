/* Local operator rehearsal. Decimal fixed point mirrors packet rounding without fake server telemetry. */
(()=>{'use strict';
const {en,data}=OPS_LESSON,$=id=>document.getElementById(id),t=(zh,english)=>en?english:zh;
const scale=10n**36n,q=value=>{const [a,b='']=String(value).split('.');return BigInt(a)*scale+BigInt(b.padEnd(36,'0'));};
const ceil=n=>(n+scale-1n)/scale,fmt=n=>{const whole=n/scale,tail=(n%scale).toString().padStart(36,'0').slice(0,6).replace(/0+$/,'');return String(whole)+(tail?'.'+tail:'');};
let route,rows,stock,done,workup,isolated,paused,count;
const demand=row=>q(row.demand)/2n;
function reset(){route=$('ops-route').value;rows=data[route].feeds;stock=Object.fromEntries(rows.map(r=>[r.species,0n]));done=0;workup=false;isolated=false;paused=false;count=Number($('ops-count').value);$('ops-feed').replaceChildren();for(const row of rows){const o=document.createElement('option');o.value=row.species;o.textContent=en?row.species:row.label;$('ops-feed').append(o);}render();}
function remaining(row){return demand(row)*BigInt(count-done)-(workup&&row.species!=='treatment-service-cartridge'?demand(row):0n);}
function blocked(){return isolated||paused||done>=count;}
function render(){
 let status=done>=count?'COMPLETE':isolated?'ISOLATED':paused?'PAUSED':workup?'WORKUP':'SUPPLY';
 const labels={COMPLETE:t('任务完成，已停机','Order complete; stopped'),ISOLATED:t('隔离中；工序与后处理均停止','Isolated; operations and workup stop'),PAUSED:t('已暂停；任务目标保留','Paused; order retained'),WORKUP:t('等待后处理服务包并结算','Awaiting service packet and workup'),SUPPLY:t('检查本批物料，准备交接','Check this batch’s feed before handoff')};
 $('ops-status').textContent=labels[status];$('ops-done').textContent=done+' / '+count;
 $('ops-hint').textContent=t('教学练习：关阀与暂停不会抹掉目标，也不会创造原料。','Teaching exercise: isolation and pause retain the target and create no feed.');
 const stage=done>=count?3:workup?2:rows.some(r=>r.species!=='treatment-service-cartridge'&&stock[r.species]<demand(r))?0:1;
 document.querySelectorAll('.ops-stages li').forEach((el,i)=>{el.classList.toggle('active',i===stage);el.setAttribute('aria-current',i===stage?'step':'false');});
 $('ops-isolate').setAttribute('aria-pressed',String(isolated));$('ops-pause').setAttribute('aria-pressed',String(paused));
 $('ops-react').disabled=blocked()||workup;$('ops-treat').disabled=blocked()||!workup;
 $('ops-rows').replaceChildren();
 let deficits=0;
 for(const row of rows){const need=remaining(row),short=need>stock[row.species]?need-stock[row.species]:0n;if(short>0)deficits++;
  const tr=document.createElement('tr');tr.dataset.species=row.species;tr.dataset.short=String(short>0);
  const values=[en?row.species:row.label,fmt(stock[row.species]),fmt(need),String(ceil(short)),row.location.replace(/^箱 /,'')];
  values.forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});$('ops-rows').append(tr);
 }
 window.__opsState={route,count,done,workup,isolated,paused,status,deficits,stock:Object.fromEntries(Object.entries(stock).map(([s,n])=>[s,fmt(n)]))};
}
$('ops-fill').onclick=()=>{for(const row of rows){const short=remaining(row)-stock[row.species];if(short>0)stock[row.species]+=ceil(short)*scale;}render();};
$('ops-react').onclick=()=>{if(blocked()||workup)return;const feeds=rows.filter(r=>r.species!=='treatment-service-cartridge');if(feeds.some(r=>stock[r.species]<demand(r))){$('ops-hint').textContent=t('本批缺料；先补齐对应原料。','This batch lacks feed; replenish the matching stores first.');return;}for(const row of feeds)stock[row.species]-=demand(row);workup=true;render();};
$('ops-treat').onclick=()=>{if(blocked()||!workup)return;const service='treatment-service-cartridge';if(stock[service]<scale){$('ops-hint').textContent=t('缺少处理服务包：本批保持等待，任务尚未完成。','Missing service packet: the batch waits and the order is not complete.');return;}stock[service]-=scale;done++;workup=false;render();};
$('ops-isolate').onclick=()=>{isolated=!isolated;render();};$('ops-pause').onclick=()=>{paused=!paused;render();};
$('ops-credit').onclick=()=>{const n=Number($('ops-packets').value);if(!Number.isInteger(n)||n<1||n>64){$('ops-hint').textContent=t('输入 1–64 的整数包数。','Enter an integer from 1 to 64.');return;}stock[$('ops-feed').value]+=BigInt(n)*scale;render();};
for(const id of ['ops-route','ops-count'])$(id).onchange=reset;$('ops-reset').onclick=reset;reset();
})();
