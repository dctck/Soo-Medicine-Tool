import {generalTalkURL,sectionTalkURL} from './talk-url.js';
import {el,httpsLink} from './shared.js';
export function renderDoctorDetails(target,s){if(!target)return;target.replaceChildren();for(const [key,title]of [['doctorCredentials','약력'],['doctorActivities','학술활동'],['doctorPapers','저술논문']]){const value=(s[key]||'').trim();if(!value)continue;const section=el('section','',{class:'credentials-group '+(key==='doctorPapers'?'papers-group':'')});section.append(el('h3',title));if(key==='doctorPapers'){const list=el('ol','',{class:'papers-list'});for(const paper of value.split(/\n\s*\n/)){const lines=paper.split('\n'),li=el('li');li.append(el('strong',lines[0]));if(lines.length>1)li.append(el('p',lines.slice(1).join('\n')));list.append(li);}section.append(list);}else{const list=el('ul');for(const line of value.split('\n').filter(x=>x.trim()))list.append(el('li',line));section.append(list);}target.append(section);}}
export function renderLocationCard(s){
 const destination=httpsLink(s.mapUrl)&&!s.mapUrl.includes('map.kakao.com')?s.mapUrl:'https://naver.me/xyTnW6nn';
 const card=el('div','',{class:'naver-place-card'}),place=el('a','',{href:destination,target:'_blank',rel:'noopener noreferrer',class:'naver-place-main','aria-label':(s.name||'수 한의원')+' 네이버 지도 열기'});
 const pin=el('span','',{class:'naver-place-pin','aria-hidden':'true'});pin.innerHTML='<svg viewBox="0 0 32 40" fill="#03c75a"><path d="M16 1C8 1 2 7 2 15c0 10 14 24 14 24s14-14 14-24C30 7 24 1 16 1Z"/><circle cx="16" cy="15" r="5" fill="white"/></svg>';
 const details=el('span','',{class:'naver-place-details'});details.append(el('strong',s.name||'수 한의원'),el('span',(s.address||'서울시 양천구 중앙로 282 에이스 빌딩 2층').replace(/\s*\n\s*/g,' ')));place.append(pin,details);
 const reservation=el('a','예약',{href:httpsLink(s.bookingUrl)||'https://booking.naver.com/booking/13/bizes/1188026',target:'_blank',rel:'noopener noreferrer',class:'article-location-booking','aria-label':'네이버 예약'});
 card.append(place,reservation);return card;
}
export function renderContactMap(target,link,s){
 link.href=httpsLink(s.mapUrl)&&!s.mapUrl.includes('map.kakao.com')?s.mapUrl:'https://naver.me/xyTnW6nn';
 target.classList.add('location-card-host');target.replaceChildren(renderLocationCard(s));
}


export function contactBlockType(section,settings){
 if(section.type==='location'||section.type==='talktalk')return section.type;
 if(['button','link'].includes(section.type)&&generalTalkURL(section.url))return 'talktalk';
 if(section.type==='link'&&section.title==='위치 안내'&&/^https:\/\/map\.naver\.com\/p\/search\//.test(section.url||'')&&
  [settings.name,'수한의원'].some(name=>name&&name.replace(/\s/g,'')===(section.text||'').trim().replace(/\s/g,'')))return 'location';
 return '';
}

export function renderContactBlock(type,settings,section={}){
 if(type==='talktalk'){
  const href=sectionTalkURL(section,settings);
  if(!href)return el('p','네이버 톡톡 주소를 준비 중입니다.',{class:'hint'});
  const link=el('a','',{href,class:'talk-banner'});
  link.append(el('span','•••',{class:'talk-bubble','aria-hidden':'true'}),el('span','궁금할 땐 네이버 톡톡하세요!'));
  const block=el('div','',{class:'article-talk'});
  block.append(link);
  return block;
 }
 const block=el('section','',{class:'article-location article-location-compact','aria-label':'위치 안내'});block.append(renderLocationCard(settings));return block;
}

export function renderLandingMap(target,link,s,{compact=false}={}){target.replaceChildren();const destination=httpsLink(s.mapUrl)&&!s.mapUrl.includes('map.kakao.com')?s.mapUrl:'https://naver.me/xyTnW6nn';link.href=destination;if(/^[a-zA-Z0-9]{3,40}$/.test(s.kakaoMapKey||'')&&/^\d{10,16}$/.test(s.kakaoMapTimestamp||'')){target.append(el('iframe','',{src:'/map.html?key='+encodeURIComponent(s.kakaoMapKey)+'&timestamp='+encodeURIComponent(s.kakaoMapTimestamp)+(compact?'&compact=1':''),title:'수 한의원 카카오맵',loading:'lazy',sandbox:'allow-scripts allow-popups allow-popups-to-escape-sandbox',referrerpolicy:'no-referrer'}));}else{const card=el('a','',{href:destination,target:'_blank',rel:'noopener noreferrer',class:'map-fallback'});card.append(el('span','↗',{class:'map-location-mark','aria-hidden':'true'}),el('strong','신정네거리역 2·3번 출구'),el('span',s.directions||'서울시 양천구 중앙로 282 · 에이스 빌딩 2층'),el('small','카카오맵에서 위치·길찾기 보기'));target.append(card);}}
