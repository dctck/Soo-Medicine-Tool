import {$,el,api,renderSections,safeMedia,httpsLink,cards} from './shared.js';
const target=$('#article'),heading=$('#article-heading'),slug=location.pathname.split('/').filter(Boolean)[1];
async function load(){try{
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug??''))throw {status:404};
 const [item,settings,treatments]=await Promise.all([api('/public/articles/'+slug),api('/public/settings'),api('/public/treatments').catch(()=>[])]);
 const chosen=treatments.filter(x=>item.treatments.includes(x.slug));document.title=item.title+' | '+settings.name;document.querySelector('meta[name="description"]').content=item.excerpt;
 const crumbs=el('nav','',{class:'breadcrumbs','aria-label':'현재 위치'});crumbs.append(el('a','홈',{href:'/'}),document.createTextNode(' › '),el('a','건강 이야기',{href:'/blog/'}));
 heading.replaceChildren(crumbs);const pills=el('div','',{class:'article-pills'});for(const title of chosen.length?chosen.map(x=>x.title):['건강 이야기'])pills.append(el('span',title,{class:'article-pill'}));heading.append(pills,el('h1',item.title));
 const author=el('div','',{class:'article-author'});if(safeMedia(settings.portrait)){const avatar=el('span','',{class:'article-avatar'});avatar.append(el('img','',{src:settings.portrait,alt:settings.doctorName||settings.name,width:'46',height:'58'}));author.append(avatar);}const meta=el('div');meta.append(el('strong',settings.doctorName||settings.name),document.createTextNode(settings.name+(item.publishedAt?' · '+new Date(item.publishedAt).toLocaleDateString('ko-KR'):'')));author.append(meta);heading.append(author);
 target.replaceChildren();
 const headings=(item.sections??[]).map((s,index)=>({...s,index})).filter(s=>s.type==='heading'&&s.text);if(headings.length){const toc=el('nav','',{class:'article-toc','aria-label':'이 글의 목차'});toc.append(el('strong','이 글에서 알아볼 내용'));headings.forEach((s,index)=>toc.append(el('a',String(index+1).padStart(2,'0')+'  '+s.text,{href:'#article-section-'+s.index})));target.append(toc);}
 const body=el('div','',{class:'article-body'});renderSections(body,item.sections,'article-section',{aiBadges:true,fullBleed:true});target.append(body);
 if(httpsLink(item.sourceUrl))target.append(el('a','네이버 원문 보기 ↗',{href:item.sourceUrl,target:'_blank',rel:'noopener noreferrer',class:'small-link'}));target.append(el('p','이 글은 일반적인 건강 정보이며, 개인의 상태에 따른 진료와 상담을 대신하지 않습니다.',{class:'notice'}));
 if(chosen.length){$('#related-band').hidden=false;for(const t of chosen){const card=el('a','',{class:'related-card',href:'/#treatment-'+t.slug});card.append(el('small','진료 안내'),el('h3',t.title),el('p',t.summary));$('#related-treatments').append(card);}}
 if(settings.phone){for(const id of ['#article-phone','#mobile-phone']){$(id).href='tel:'+settings.phone.replace(/[^+\d]/g,'');$(id).textContent='전화 상담';}}
 const all=await api('/public/articles').catch(()=>[]);const more=all.filter(x=>x.slug!==item.slug).sort((a,b)=>Number(b.treatments.some(t=>item.treatments.includes(t)))-Number(a.treatments.some(t=>item.treatments.includes(t)))).slice(0,3);if(more.length){$('#more-band').hidden=false;cards($('#more-articles'),more);}
 if(location.hash.startsWith('#article-section-'))document.getElementById(location.hash.slice(1))?.scrollIntoView();
 }catch(e){heading.replaceChildren(el('h1',e.status===404?'이야기를 찾을 수 없습니다.':'이야기를 불러오지 못했습니다.'));target.replaceChildren(el('a','모든 이야기로 돌아가기',{href:'/blog/'}));}}
load();
