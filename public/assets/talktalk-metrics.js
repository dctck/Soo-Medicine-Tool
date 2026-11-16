export function talkPlacement(link){
 if(link.closest('.contact-dock'))return globalThis.matchMedia?.('(max-width:700px)').matches?'mobile':'sidebar';
 if(link.closest('footer,.footer'))return 'footer';
 if(link.closest('.mobile-contact'))return 'mobile';
 if(link.closest('.article-talk,.article-body'))return 'article';
 if(link.closest('#contact,.article-contact'))return 'contact';
 return 'other';
}
export function deviceKind(nav=globalThis.navigator){return nav?.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod|Mobile/i.test(nav?.userAgent||'')||(nav?.platform==='MacIntel'&&nav?.maxTouchPoints>1)?'mobile':'desktop';}
export function contactChannel(href){try{const u=new URL(href);if(u.username||u.password)return '';if(u.protocol==='tel:'&&/^[+\d ()-]+$/.test(u.pathname))return 'phone';if(u.protocol!=='https:')return '';if(u.hostname==='talk.naver.com')return 'naver';if(['open.kakao.com','pf.kakao.com'].includes(u.hostname))return 'kakao';return '';}catch{return '';}}
if(typeof document!=='undefined'&&location.hostname==='sooclinic.kr'&&navigator.doNotTrack!=='1'){
 const path=location.pathname.replace(/\/$/,'')||'/';
 if(path==='/'||path==='/blog'||/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)){
  const recent=new Map();
  const track=e=>{if(e.type==='auxclick'&&e.button!==1)return;const link=e.target instanceof Element?e.target.closest('a[href]'):null;if(!link||link.closest('#preview-dialog'))return;const channel=contactChannel(link.href);if(!channel)return;
   const placement=talkPlacement(link),key=path+':'+placement+':'+channel,now=Date.now();if(now-(recent.get(key)||0)<2000)return;recent.set(key,now);
   try{fetch('/api/public/contact-clicks',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),path:path==='/blog'?'/blog/':path,placement,channel,device:deviceKind()}),keepalive:true}).catch(()=>{});}catch{}
  };
  document.addEventListener('click',track,{capture:true});document.addEventListener('auxclick',track,{capture:true});
 }
}
