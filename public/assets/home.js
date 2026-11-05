import {renderDoctorDetails,renderContactMap} from './clinic-details.js';
import {applySiteCopy,previewSettings} from './site-content.js';
import {configureHeroVideo} from './hero-video.js';
import {$,el,api,cards,renderSections,safeMedia,httpsLink} from './shared.js';
const video=$('#intro'),control=$('#film-control');let intentionalPause=matchMedia('(prefers-reduced-motion: reduce)').matches;
function videoState(){control.textContent=video.paused?'재생 ▷':'일시정지 Ⅱ';control.setAttribute('aria-label',video.paused?'영상 재생':'영상 일시정지');}
video.addEventListener('play',videoState);video.addEventListener('pause',videoState);control.onclick=async()=>{if(video.paused){intentionalPause=false;try{await video.play();}catch{}}else{intentionalPause=true;video.pause();}videoState();};if(intentionalPause){video.autoplay=false;video.pause();}videoState();
const settingsReady=api('/public/settings').then(saved=>{const previewId=new URLSearchParams(location.search).get('studioPreview'),draft=previewSettings(previewId,localStorage),s=draft||saved;applySiteCopy(s);document.title=s.pageTitle;document.querySelector('meta[name=description]').content=s.metaDescription;if(draft){const banner=el('div','저장 전 미리보기 · 공개 홈페이지에는 반영되지 않았습니다.',{class:'studio-preview-banner'});document.body.prepend(banner);}for(const [selector,key] of [['#hero-title','heroTitle'],['#hero-text','heroText'],['#doctor-bio','doctorBio']])$(selector).textContent=s[key];$('#doctor-name').textContent=s.doctorName||s.name;renderDoctorDetails($('#doctor-details'),s);for(const [selector,key] of [['#portrait','portrait'],['#interior','interior']]){$(selector).hidden=!safeMedia(s[key]);if(safeMedia(s[key]))$(selector).src=s[key];}$('.video-frame').hidden=!safeMedia(s.video);if(!safeMedia(s.video))video.pause();if(safeMedia(s.video))configureHeroVideo(video,s.video,{paused:intentionalPause});
 const talk=$('#clinic-talk');const talkUrl=httpsLink(s.talkUrl);talk.hidden=!talkUrl;if(talkUrl)talk.href=talkUrl;const phone=$('#clinic-phone');phone.textContent=s.phone||'';phone.hidden=!s.phone;phone.href='tel:'+(s.phone||'').replace(/[^+\d]/g,'');$('#clinic-address').textContent=s.address||'';
 const compact=value=>value.replace(/\s+/g,'');
 const addressLines=new Set((s.address||'').split('\n').map(compact));
 const directions=(s.directions||'').split('\n').filter(line=>line.trim()&&!addressLines.has(compact(line))).join('\n');
 for(const [selector,value] of [['#clinic-directions',directions],['#clinic-parking',s.parking]]){
  const detail=$(selector);detail.textContent=value||'';detail.hidden=!value;
  const station=selector==='#clinic-directions'&&/^(신정네거리역)\s+(2\s*·\s*3번 출구)(\n[\s\S]*)?$/.exec(value||'');
  if(station){
   const pill=el('span','',{class:'subway-pill'});
   pill.append(el('span','234-3',{class:'subway-marker'}),el('span',station[1]));
   detail.replaceChildren(pill,el('span',' '+station[2],{class:'subway-exits'}));
   if(station[3])detail.append(document.createTextNode(station[3]));
  }
 }
 renderContactMap($('#clinic-map'),$('#kakao-map-link'),s);$('#clinic-hours-title').textContent=s.hours?s.hoursLabel:s.contactEmptyLabel;
 $('#clinic-hours').textContent=s.hours||s.contactEmpty;
 if(httpsLink(s.bookingUrl)){$('#booking').href=s.bookingUrl;$('#booking').hidden=false;}return s;}).catch(()=>null);
api('/public/treatments').then(async items=>{const config=await settingsReady;const list=$('#treatments-list');list.replaceChildren();if(!items.length)list.append(el('p',config?.treatmentEmpty||'자세한 진료 안내를 준비하고 있습니다.',{class:'empty'}));for(const t of items)list.append(el('a',t.title,{class:'article-pill treatment-tag',id:'treatment-'+t.slug,href:'/blog/?treatment='+encodeURIComponent(t.slug)}));if(location.hash.startsWith('#treatment-')){const d=document.getElementById(location.hash.slice(1));if(d){d.scrollIntoView();}}}).catch(()=>$('#treatments-list').replaceChildren(el('p','진료 안내를 불러오지 못했습니다. 잠시 후 다시 방문해 주세요.',{class:'error'})));
api('/public/articles').then(items=>cards($('#journal'),items.slice(0,3))).catch(()=>$('#journal').replaceChildren(el('p','이야기를 불러오지 못했습니다. 잠시 후 다시 방문해 주세요.',{class:'error'})));
