import {listLines,listDepths,listMarker} from './text-format.js';
import {contactBlockType,renderContactBlock} from './clinic-details.js';
import {linkIcon} from './link-icons.js';
import {normalizeRuns,sliceRuns,runsText,truncateText} from './text-format.js';
import {externalImageURL} from './image-url.js';
export const $=s=>document.querySelector(s);
export function el(tag,text='',attrs={}){const n=document.createElement(tag);n.textContent=text;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
export async function api(path,options={}){const r=await fetch('/api'+path,{credentials:'same-origin',...options});const value=await r.json();if(!r.ok){const e=new Error(value.error||'Request failed');e.status=r.status;throw e;}return value;}
export function safeMedia(s){return typeof s==='string'&&/^\/(?:assets\/[\w.-]+|api\/media\/[a-f0-9-]+)$/.test(s)?s:'';}
export function httpsLink(s){try{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}

export function appendRuns(target,runs,fallback=''){const normalized=normalizeRuns(runs,fallback);for(const [index,run] of normalized.entries()){let node=document.createTextNode(run.text);for(const [active,tag] of [[run.underline,'u'],[run.italic,'em'],[run.bold,'strong']])if(active){const wrapper=el(tag);
 if(tag==='em'){
  const before=normalized[index-1],after=normalized[index+1];
  if(before&&!before.italic&&/\S$/.test(before.text)&&/^\S/.test(run.text))wrapper.classList.add('italic-gap-start');
  if(after&&!after.italic&&/\S$/.test(run.text)&&/^\S/.test(after.text))wrapper.classList.add('italic-gap-end');
 }
 wrapper.append(node);node=wrapper;}if(run.highlightColor){const mark=el('mark','',{'data-highlight':run.highlightColor});mark.style.backgroundColor=run.highlightColor;mark.append(node);node=mark;}if(run.color){const span=el('span','',{'data-color':run.color});span.style.color=run.color;span.append(node);node=span;}if(httpsLink(run.href)){const a=el('a','',{href:run.href,target:'_blank',rel:'noopener noreferrer'});a.append(node);node=a;}target.append(node);}}
export function renderLinkCard(s){const url=httpsLink(s.url);if(!url)return el('span');const card=el('a','',{href:url,target:'_blank',rel:'noopener noreferrer',class:'related-card imported-link'});card.append(s.linkVisual!=='icon'&&safeMedia(s.thumbnail)?el('img','',{src:s.thumbnail,alt:'',loading:'lazy'}):el('span','',{class:'link-placeholder','aria-hidden':'true'}));const placeholder=card.querySelector('.link-placeholder');if(placeholder)placeholder.append(linkIcon(s.icon));const detail=el('div','',{class:'link-detail'}),u=new URL(url);detail.append(el('strong',s.title||'관련 링크'),el('span',truncateText(s.text,30),{class:'link-excerpt'}),el('small',truncateText(u.hostname+u.pathname,48),{class:'link-address'}));card.append(detail);return card;}
export function renderImage(section,{aiBadges=false,fullBleed=false}={}){const url=safeMedia(section.url)||externalImageURL(section.url);const align=['left','center','right','fill'].includes(section.align)?section.align:'center';const height=Math.max(100,Math.min(1200,Number(section.height)||450));const figure=el('figure','',{class:'section-image align-'+align+(fullBleed&&align==='fill'?' full-bleed':'')});figure.style.setProperty('--image-max-height',height+'px');if(!url)return figure;const frame=el('div','',{class:'image-frame'}),img=el('img','',{src:url,alt:section.alt||'',loading:'lazy',referrerpolicy:'no-referrer'});img.onload=()=>frame.style.setProperty('--image-display-height',Math.min(height,img.naturalHeight)+'px');frame.append(img);if(aiBadges&&section.ai)frame.append(el('span','AI 활용',{class:'ai-badge'}));figure.append(frame);if(section.text)figure.append(el('figcaption',section.text));return figure;}
export function renderSections(target,sections,anchorPrefix='',options={}){(sections??[]).forEach((s,index)=>{const contact=options.settings&&contactBlockType(s,options.settings);if(contact){target.append(renderContactBlock(contact,options.settings));return;}if(s.type==='image'){if(safeMedia(s.url)||externalImageURL(s.url))target.append(renderImage(s,options));}else if(s.type==='divider')target.append(el('hr','',{class:'section-divider'}));else if(s.type==='spacer'){const spacer=el('div','',{class:'section-spacer','aria-hidden':'true'});spacer.style.height=Math.max(16,Math.min(160,Number(s.space)||48))+'px';target.append(spacer);}else if(s.type==='button'){if(httpsLink(s.url))target.append(el('a',s.title||s.text||'자세히 보기 ↗',{href:s.url,target:'_blank',rel:'noopener noreferrer',class:'article-button'}));}else if(s.type==='link'){if(httpsLink(s.url))target.append(renderLinkCard(s));}else if(s.type==='callout'){const block=el('aside','',{class:'callout'}),p=el('p');appendRuns(p,s.runs,s.text);block.append(el('strong',s.title||'원장님 한마디'),p);target.append(block);}else if(s.type==='checklist'){const list=el('ul','',{class:'checks'});for(const line of (s.text||'').split('\n').map(x=>x.trim()).filter(Boolean))list.append(el('li',line));target.append(list);}else if(s.type==='text'&&(s.listType||s.lineLists?.some(Boolean))){
 const runs=normalizeRuns(s.runs,s.text);
 const text=runsText(runs);
 const modes=listLines(s,text),depths=listDepths(s,modes),stack=[];
 let offset=0;
 for(const [index,line] of text.split('\n').entries()){
  const mode=modes[index];
  let depth=Math.min(depths[index],stack.length);
  if(depth&&!stack[depth-1]?.item)depth=0;
  const node=mode?el('li'):el('p','',{class:'section-copy text-align-'+(s.align||'left')});
  if(mode){
   stack.length=Math.min(stack.length,depth+1);
   if(stack[depth]?.mode!==mode){
    const list=el(mode==='number'?'ol':'ul','',{class:'body-list article-structured-list list-'+mode+' text-align-'+(s.align||'left')});
    (depth?stack[depth-1].item:target).append(list);
    stack[depth]={mode,list,number:0};
   }
   const entry=stack[depth];
   entry.item=node;
   entry.list.append(node);
   const marker=el('span',listMarker(mode,depth,++entry.number),{class:'line-list-marker'+(mode==='bullet'?' bullet-marker':''),'aria-hidden':'true'});
   if(mode==='checklist')marker.append(linkIcon('squareCheck'));
   node.append(marker);
  }else{stack.length=0;target.append(node);}
  appendRuns(node,sliceRuns(runs,offset,offset+line.length));
  if(!line&&!mode)node.append(el('br'));
  offset+=line.length+1;
 }
}else if(['heading','text','quote'].includes(s.type)){const node=el({heading:'h2',text:'p',quote:'blockquote'}[s.type],'',{class:'section-copy '+(s.type==='heading'?'emphasis-title ':'')+'text-align-'+(['left','center','right','justify'].includes(s.align)?s.align:'left')+(s.type==='quote'?' quote-'+(s.quoteStyle||'line'):'')});if(s.type==='heading')node.textContent=s.text||'';else appendRuns(node,s.runs,s.text);if(s.type==='heading'&&anchorPrefix)node.id=anchorPrefix+'-'+index;target.append(node);}});}
export function cards(target,items){target.replaceChildren();if(!items.length){target.append(el('p','새로운 이야기를 준비하고 있습니다.',{class:'empty'}));return;}for(const x of items){const a=el('a','',{href:'/blog/'+encodeURIComponent(x.slug),class:'article-card'});if(safeMedia(x.cover))a.append(el('img','',{src:x.cover,alt:'',loading:'lazy'}));else a.append(el('div','秀',{class:'card-art','aria-hidden':'true'}));const tags=el('div','',{class:'card-treatment-tags'});for(const tag of x.treatmentTags||[])tags.append(el('span',tag.title,{class:'article-pill'}));if(tags.children.length)a.append(tags);a.append(el('small',x.publishedAt?new Date(x.publishedAt).toLocaleDateString('ko-KR'):'SOO JOURNAL'),el('h3',x.title),el('p',x.excerpt),el('span','이야기 읽기 ↗',{class:'small-link'}));target.append(a);}}
if($('#year'))$('#year').textContent=new Date().getFullYear();

if(!location.pathname.startsWith('/admin'))api('/public/settings').then(s=>{for(const node of document.querySelectorAll('.brand strong'))node.textContent=s.name;for(const node of document.querySelectorAll('.brand small'))node.textContent=s.englishName;}).catch(()=>{});

function setPageWidth(){document.documentElement.style.setProperty('--page-width',document.documentElement.clientWidth+'px');}setPageWidth();window.addEventListener('resize',setPageWidth);
