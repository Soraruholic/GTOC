/* Runs before page styles/players. Theme preferences never change lesson or simulation state. */
(()=>{'use strict';
const KEY='oc-site-theme-v1',root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)'),printing=matchMedia('print'),viewers=new Set();
const valid=v=>['system','light','dark'].includes(v);let preference='system';
try{const saved=localStorage.getItem(KEY);if(valid(saved))preference=saved;}catch{}
const dark=()=>!printing.matches&&(preference==='dark'||preference==='system'&&system.matches);
function apply(){root.dataset.theme=dark()?'dark':'light';root.dataset.themePreference=preference;const select=document.getElementById('site-theme-select');if(select)select.value=preference;for(const item of viewers){if(!item.host?.isConnected){viewers.delete(item);continue;}item.viewer.setBackgroundColor(dark()?'#b8c7bf':item.background);}window.dispatchEvent(new CustomEvent('oc-theme-change',{detail:{preference,resolved:root.dataset.theme}}));}
function choose(value){if(!valid(value))return;preference=value;try{localStorage.setItem(KEY,value);}catch{}apply();}
system.addEventListener('change',apply);printing.addEventListener('change',apply);
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){preference=valid(e.newValue)?e.newValue:'system';apply();}});
window.OCTheme={choose,getState:()=>({preference,resolved:root.dataset.theme,viewers:viewers.size}),createViewer(element,options={}){
 const host=typeof element==='string'?document.getElementById(element):element?.nodeType?element:element?.[0],background=options.backgroundColor??'#ffffff';
 const viewer=window.$3Dmol.createViewer(element,{...options,backgroundColor:dark()?'#b8c7bf':background});viewers.add({viewer,background,host});return viewer;
}};
apply();
// Older classrooms contain literal colours. Derive dark overrides without rewriting their source.
function rgb(value){if(/^#[\da-f]{3,8}$/i.test(value)){let v=value.slice(1);if(v.length===3)v=v.split('').map(x=>x+x).join('');if(v.length===6)return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));}if(/^rgba?\(/.test(value)){const p=value.match(/[\d.]+/g)?.map(Number);if(p?.length>=3)return p;}return value==='white'?[255,255,255]:value==='black'?[0,0,0]:null;}
const luminance=c=>c.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
function colour(value,kind){if(kind==='text'&&value.includes('--white'))return '#deebe4';const c=rgb(value.trim());if(!c||c[3]===0)return null;let out;
 if(kind==='border')out=[68,96,87];
 else if(kind==='background'){if(luminance(c)<.14)return null;out=luminance(c)>.88?[25,42,48]:[35,57,54];}
 else{out=c.slice(0,3);while((luminance(out)+.05)/(.035+.05)<5.5&&out.some(x=>x<250))out=out.map(x=>Math.round(x+(255-x)*.12));}
 return 'rgba('+out.join(',')+','+(c[3]??1)+')';}
function adaptRules(rules){let css='';for(const rule of rules){if(rule.selectorText&&rule.style){const declarations=[];for(const prop of ['color','background-color','border-top-color','border-right-color','border-bottom-color','border-left-color']){const value=rule.style.getPropertyValue(prop),mapped=colour(value,prop==='color'?'text':prop==='background-color'?'background':'border');if(mapped)declarations.push(prop+':'+mapped+'!important');}if(declarations.length)css+='html[data-theme="dark"] :where('+rule.selectorText+'):not(svg,svg *){'+declarations.join(';')+'}\n';}else if(rule.cssRules&&rule.conditionText&&!/print/.test(rule.conditionText)){css+=(rule.type===4?'@media ':'@supports ')+rule.conditionText+'{'+adaptRules(rule.cssRules)+'}';}}return css;}
function inline(scope){const nodes=[];if(scope.nodeType!==1||scope.closest('svg')||scope.tagName==='CANVAS')return;if(scope.hasAttribute('style'))nodes.push(scope);nodes.push(...scope.querySelectorAll('[style]'));for(const el of nodes){if(el.closest('svg')||el.tagName==='CANVAS')continue;for(const [prop,kind,attr] of [['color','text','color'],['background-color','background','bg']]){const original=el.style.getPropertyValue(prop),mapped=colour(original,kind);if(mapped){el.style.setProperty('--oc-night-'+attr,mapped);el.setAttribute('data-oc-night-'+attr,'');}}}}
function ready(){
 const en=root.lang.startsWith('en'),control=document.createElement('div');control.className='site-theme-control';control.innerHTML='<label for="site-theme-select">◐ '+(en?'Appearance':'外观')+'</label><select id="site-theme-select" aria-label="'+(en?'Website appearance':'网站外观')+'"><option value="system">'+(en?'System':'跟随系统')+'</option><option value="light">'+(en?'Light':'浅色')+'</option><option value="dark">'+(en?'Dark':'深色')+'</option></select>';
 const header=document.getElementById('site-header');if(header)header.append(control);else{control.classList.add('site-theme-floating');document.body.prepend(control);}control.querySelector('select').addEventListener('change',e=>choose(e.target.value));
 const css=document.createElement('style');css.id='oc-theme-adapted';css.media='screen';css.textContent=Array.from(document.styleSheets).filter(s=>!s.ownerNode?.hasAttribute('data-oc-theme')).map(s=>{try{return adaptRules(s.cssRules);}catch{return '';}}).join('\n');
 // Explicit theme rules follow generated legacy overrides and retain selected-control contrast.
 const themeStyle=document.querySelector('style[data-oc-theme]');
 if(themeStyle)themeStyle.parentNode.insertBefore(css,themeStyle);else document.head.append(css);
 inline(document.body);const observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)inline(n);});observer.observe(document.body,{childList:true,subtree:true});apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
