const p=new URLSearchParams(location.search),key=p.get('key'),timestamp=p.get('timestamp');
async function start(){try{if(!/^[a-zA-Z0-9]{3,40}$/.test(key||'')||!/^\d{10,16}$/.test(timestamp||''))throw Error();
// Official public rough-map renderer; HTTPS also on local preview.
const cdn='2851f17d_1789535060426';
window.daum={roughmap:{phase:'prod',cdn,loader:'tenth',URL_KEY_DATA_LOAD_PRE:'https://t1.kakaocdn.net/roughmap/',url_protocal:'https:',url_cdn_domain:'//t1.kakaocdn.net'}};
await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://t1.kakaocdn.net/kakaomapweb/roughmap/place/prod/'+cdn+'/roughmapLander.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
const map=document.getElementById('map');map.id='daumRoughmapContainer'+timestamp;map.className='root_daum_roughmap root_daum_roughmap_landing';new window.daum.roughmap.Lander({timestamp,key,mapWidth:'100%',mapHeight:p.get('compact')==='1'?'220':'360'}).render();}catch{document.getElementById('map-error').hidden=false;}}start();
