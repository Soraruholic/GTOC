/* Explicit navigation preserves user context. Preference storage is optional, never required. */
(()=>{'use strict';
const KEY='oc-site-language-v1',english=document.documentElement.lang.startsWith('en');
function ready(){
 if(document.getElementById('site-language-switch'))return;
 const control=document.createElement('div');control.className='site-language-control';control.id='site-language-switch';
 const label=document.createElement('span');label.textContent=english?'Language':'语言';
 const link=document.createElement('a');link.lang=english?'zh-Hans':'en';link.hreflang=link.lang;link.textContent=english?'中文':'English';
 control.append(label,link);const header=document.getElementById('site-header');if(header)header.append(control);else{control.classList.add('site-language-floating');document.body.prepend(control);}
 const page=location.pathname.split('/').pop()||'index.html',archive=location.pathname.includes('/archive/');
 const currentPages=['ester-guide','vitamin-a-guide','factory-services','factory-design','storage-logistics','process-quality','gameplay','next-line','ui-acceptance','process-manual','modular-plant','retinol-guide','line-bus','reagents','continuous-plant'];
 const root=new URL(english||archive?'../':'./',location.href),lessons=window.OC_LANGUAGE_LESSONS||[],toChinese={index:'index',learning:'learning',wiki:'wiki',mechanisms:'mechanisms',plants:'plants',play:'play',glossary:'learning'};
 function update(){
  const hash=location.hash;let destination;
  if(english){
   if(page==='lesson.html'){
    const l=lessons.find(x=>x.id===new URLSearchParams(location.search).get('id'))||lessons[0];
    destination=l?l.page+(l.branch===null?'#wiki-reactions':'?branch='+l.branch+'#lesson'):'mechanisms.html';
   }else if(page==='wiki.html')destination='wiki.html'+hash.replace(/^#compound-/,'#molecule-').replace(/^#sources$/,'');
   else if(currentPages.includes(page.replace('.html','')))destination=page+hash;
   else destination=(toChinese[page.replace('.html','')]||'index')+'.html';
  }else{
   const branch=document.getElementById('branch')?.value??new URLSearchParams(location.search).get('branch')??'0';
   const l=lessons.find(x=>x.page===page&&(x.branch===null||String(x.branch)===String(branch)));
   if(l)destination='en/lesson.html?id='+encodeURIComponent(l.id);
   else if(page==='wiki.html')destination=hash.startsWith('#mechanism-')?'en/mechanisms.html':'en/wiki.html'+hash.replace(/^#molecule-/,'#compound-');
   else if(currentPages.includes(page.replace('.html','')))destination='en/'+page+hash;
   else {const mapping={'index.html':'index','learning.html':'learning','mechanisms.html':'mechanisms','plants.html':'plants','play.html':'play','process-manual.html':'play','process.html':'plants','ionone-manual.html':'plants','ester-guide.html':'plants','vitamin-a-guide.html':'plants'};destination='en/'+(mapping[page]||'index')+'.html';}
  }
  link.href=new URL(destination,root).href;
  link.title=english?'Read the corresponding Chinese content':page==='wiki.html'&&location.hash.startsWith('#mechanism-')?'打开英文机理课程索引':'阅读对应英文内容';
 }
 link.addEventListener('click',()=>{try{localStorage.setItem(KEY,english?'zh':'en');}catch{}});
 // Do not redirect explicit deep links based on preference: a linked original must stay readable.
 try{control.dataset.preferredLanguage=localStorage.getItem(KEY)||document.documentElement.lang;}catch{}
 window.addEventListener('hashchange',update);document.addEventListener('change',e=>{if(e.target.id==='branch')update();});update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
