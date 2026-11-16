export function talkPlacement(link){
 if(link.closest('footer,.footer'))return 'footer';
 if(link.closest('.mobile-contact'))return 'mobile';
 if(link.closest('.article-talk,.article-body'))return 'article';
 if(link.closest('#contact,.article-contact'))return 'contact';
 return 'other';
}
export function deviceKind(nav=globalThis.navigator){return nav?.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod|Mobile/i.test(nav?.userAgent||'')||(nav?.platform==='MacIntel'&&nav?.maxTouchPoints>1)?'mobile':'desktop';}
if(typeof document!=='undefined'&&location.hostname==='sooclinic.kr'&&navigator.doNotTrack!=='1'){
 const path=location.pathname.replace(/\/$/,'')||'/';
 if(path==='/'||path==='/blog'||/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)){
  const recent=new Map();
  const track=e=>{if(e.type==='auxclick'&&e.button!==1)return;const link=e.target instanceof Element?e.target.closest('a[href]'):null;if(!link||link.closest('#preview-dialog'))return;let url;try{url=new URL(link.href);}catch{return;}if(url.protocol!=='https:'||url.hostname!=='talk.naver.com')return;
   const placement=talkPlacement(link),key=path+':'+placement,now=Date.now();if(now-(recent.get(key)||0)<2000)return;recent.set(key,now);
   try{fetch('/api/public/talktalk-clicks',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),path:path==='/blog'?'/blog/':path,placement,device:deviceKind()}),keepalive:true}).catch(()=>{});}catch{}
  };
  document.addEventListener('click',track,{capture:true});document.addEventListener('auxclick',track,{capture:true});
 }
}
