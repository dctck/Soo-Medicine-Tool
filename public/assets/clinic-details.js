import {el,httpsLink} from './shared.js';
export function renderDoctorDetails(target,s){if(!target)return;target.replaceChildren();for(const [key,title]of [['doctorCredentials','약력'],['doctorActivities','학술활동'],['doctorPapers','저술논문']]){const value=(s[key]||'').trim();if(!value)continue;const section=el('section','',{class:'credentials-group '+(key==='doctorPapers'?'papers-group':'')});section.append(el('h3',title));if(key==='doctorPapers'){const list=el('ol','',{class:'papers-list'});for(const paper of value.split(/\n\s*\n/)){const lines=paper.split('\n'),li=el('li');li.append(el('strong',lines[0]));if(lines.length>1)li.append(el('p',lines.slice(1).join('\n')));list.append(li);}section.append(list);}else{const list=el('ul');for(const line of value.split('\n').filter(x=>x.trim()))list.append(el('li',line));section.append(list);}target.append(section);}}
export function renderContactMap(target,link,s,{compact=false}={}){target.replaceChildren();const destination=httpsLink(s.mapUrl)||'https://map.kakao.com/link/search/'+encodeURIComponent(s.address||'수한의원 양천구 중앙로 282');link.href=destination;if(/^[a-zA-Z0-9]{3,40}$/.test(s.kakaoMapKey||'')&&/^\d{10,16}$/.test(s.kakaoMapTimestamp||'')){target.append(el('iframe','',{src:'/map.html?key='+encodeURIComponent(s.kakaoMapKey)+'&timestamp='+encodeURIComponent(s.kakaoMapTimestamp)+(compact?'&compact=1':''),title:'수 한의원 카카오맵',loading:'lazy',sandbox:'allow-scripts allow-popups allow-popups-to-escape-sandbox',referrerpolicy:'no-referrer'}));}else{const card=el('a','',{href:destination,target:'_blank',rel:'noopener noreferrer',class:'map-fallback'});card.append(el('span','↗',{class:'map-location-mark','aria-hidden':'true'}),el('strong','신정네거리역 2·3번 출구'),el('span',s.directions||'서울시 양천구 중앙로 282 · 에이스 빌딩 2층'),el('small','카카오맵에서 위치·길찾기 보기'));target.append(card);}}

export function contactBlockType(section,settings){
 if(section.type==='location'||section.type==='talktalk')return section.type;
 if(section.type==='link'&&section.title==='위치 안내'&&/^https:\/\/map\.naver\.com\/p\/search\//.test(section.url||'')&&
  [settings.name,'수한의원'].some(name=>name&&name.replace(/\s/g,'')===(section.text||'').trim().replace(/\s/g,'')))return 'location';
 return '';
}

export function renderContactBlock(type,settings){
 if(type==='talktalk'){
  const href=httpsLink(settings.talkUrl);
  if(!href)return el('p','네이버 톡톡 주소를 준비 중입니다.',{class:'hint'});
  const link=el('a','',{href,class:'talk-banner'});
  link.append(el('span','•••',{class:'talk-bubble','aria-hidden':'true'}),el('span','궁금할 땐 네이버 톡톡하세요!'));
  const block=el('div','',{class:'article-talk'});
  block.append(link);
  return block;
 }
 const block=el('section','',{class:'article-location','aria-label':'위치 안내'});
 const map=el('div','',{class:'clinic-map'});
 const place=el('a',settings.name||'수 한의원',{target:'_blank',rel:'noopener noreferrer'});
 renderContactMap(map,place,settings,{compact:true});
 const info=el('div','',{class:'article-location-info'});
 const details=el('div');
 details.append(place);
 if(settings.address)details.append(el('p',settings.address.replace(/\s*\n\s*/g,' ')));
 info.append(details);
 const booking=httpsLink(settings.bookingUrl)||'https://booking.naver.com/booking/13/bizes/1188026';
 const reservation=el('a','예약',{href:booking,target:'_blank',rel:'noopener noreferrer',class:'article-location-booking','aria-label':'네이버 예약'});
 info.append(reservation);
 block.append(map,info);
 return block;
}
