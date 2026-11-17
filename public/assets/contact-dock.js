import {talkURL} from './talk-url.js';
export function contactLinks(settings){
 const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
 const kakao=https(settings.kakaoTalkUrl),talk=talkURL(settings.talkUrl);
 return [{kind:'kakao',label:'카톡 상담',href:kakao,disabled:!kakao},...(talk?[{kind:'talk',label:'네이버 톡톡',href:talk}]:[]),{kind:'directions',label:'오시는 길',href:'/#contact'}];
}
function brandIcon(kind){
 const icon=document.createElement('span');icon.className='dock-icon dock-icon-'+kind;icon.setAttribute('aria-hidden','true');
 // Familiar chat service colors, kept separate from the clinic-colored navigation.
 if(kind==='kakao'){icon.innerHTML='<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#FEE500"/><path d="M20 8c-8 0-14 5-14 11 0 4 3 7 7 9l-2 6 7-5h2c8 0 14-4 14-10S28 8 20 8" fill="#391B1B"/><text x="20" y="22" text-anchor="middle" fill="#FEE500" font-size="9" font-weight="700">TALK</text></svg>';}
 else if(kind==='talk'){icon.innerHTML='<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#03C75A"/><path d="M20 8c-7 0-12 5-12 11v12l7-3h5c7 0 12-4 12-10S27 8 20 8Z" fill="white"/><circle cx="15" cy="18" r="1.6" fill="#03C75A"/><circle cx="20" cy="18" r="1.6" fill="#03C75A"/><circle cx="25" cy="18" r="1.6" fill="#03C75A"/></svg>';}
 else icon.innerHTML='<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><path d="M30 17c0 8-10 16-10 16S10 25 10 17a10 10 0 1 1 20 0Z"/><circle cx="20" cy="17" r="3.5"/></svg>';
 return icon;
}
async function showDirections(settings,trigger){
 document.querySelector('.directions-dialog')?.remove();
 const dialog=document.createElement('dialog');dialog.className='directions-dialog';dialog.setAttribute('aria-labelledby','directions-dialog-title');
 const title=document.createElement('h2');title.id='directions-dialog-title';title.textContent='오시는 길';
 const close=document.createElement('button');close.type='button';close.className='directions-close';close.textContent='닫기 ×';close.onclick=()=>dialog.close();
 const address=document.createElement('p');address.textContent=settings.address||'';
 const directions=document.createElement('p');directions.textContent=settings.directions||'';
 const map=document.createElement('div');map.className='clinic-map';
 const link=document.createElement('a');link.textContent='네이버 지도에서 길찾기 ↗';link.target='_blank';link.rel='noopener noreferrer';
 dialog.append(close,title,directions,map);document.body.append(dialog);
 dialog.addEventListener('close',()=>{dialog.remove();trigger.focus();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.showModal();const {renderContactMap}=await import('./clinic-details.js');if(dialog.isConnected)renderContactMap(map,link,settings,{compact:true});
}
export function renderContactDock(settings){
 document.querySelector('.contact-dock')?.remove();document.body.classList.remove('has-contact-dock');if(location.pathname.startsWith('/admin'))return;
 const nav=document.createElement('nav');nav.className='contact-dock';nav.setAttribute('aria-label','빠른 상담');
 for(const item of contactLinks(settings)){
  const popup=item.kind==='directions';const a=document.createElement(item.disabled||popup?'button':'a');
  if(item.disabled){a.type='button';a.disabled=true;a.title='카톡 상담 준비 중';}else if(popup){a.type='button';a.setAttribute('aria-haspopup','dialog');a.onclick=()=>showDirections(settings,a);}else{a.href=item.href;if(item.kind!=='directions'){a.target='_blank';a.rel='noopener noreferrer';}}
  a.className='dock-'+item.kind;const label=document.createElement('span');label.textContent=item.label;a.append(brandIcon(item.kind),label);nav.append(a);
 }
 document.body.append(nav);document.body.classList.add('has-contact-dock');
 // Article footer/header directions keep the reader in their current article.
 for(const link of document.querySelectorAll('a[href="/#contact"],a[href="#contact"]'))link.onclick=event=>{event.preventDefault();showDirections(settings,link);};
}
