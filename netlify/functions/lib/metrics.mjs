const DAY=86400000;
export function metricDay(now=Date.now()){return new Date(now+9*3600000).toISOString().slice(0,10);}
export async function trackMetric(store,value,now=Date.now()){
 if(!/^[a-f0-9-]{36}$/.test(value.session||''))return false;
 const path=value.path;if(!['/','/blog/'].includes(path)&&!/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path||''))return false;
 const slug=path.startsWith('/blog/')?path.slice(6):'';
 if(slug){const article=await store.get('articles/'+slug,{type:'json'});if(article?.status!=='published')return false;}
 const prefix='metrics/'+metricDay(now)+'/';
 await store.setJSON(prefix+'visit/'+value.session,{}, {onlyIfNew:true});
 if(slug)await store.setJSON(prefix+'article/'+slug+'/'+value.session,{}, {onlyIfNew:true});
 return true;
}
export async function metricReport(store,now=Date.now()){
 const days=Array.from({length:30},(_,i)=>metricDay(now-i*DAY));
 const rows=await Promise.all(days.map(async day=>{const {blobs}=await store.list({prefix:'metrics/'+day+'/'});return {day,keys:blobs.map(b=>b.key)};}));
 const articles={};let today=0,week=0,month=0;
 rows.forEach(({keys},index)=>{const visits=keys.filter(key=>key.includes('/visit/')).length;month+=visits;if(index<7)week+=visits;if(index===0)today=visits;for(const key of keys){const match=/\/article\/([a-z0-9-]+)\//.exec(key);if(match)articles[match[1]]=(articles[match[1]]||0)+1;}});
 return {today,week,month,articles,timezone:'Asia/Seoul',days:30};
}

const clickPlaces=new Set(['footer','contact','article','mobile','other']);
export async function trackTalkClick(store,value,now=Date.now()){
 if(!/^[a-f0-9-]{36}$/.test(value.id||'')||!clickPlaces.has(value.placement)||!['mobile','desktop'].includes(value.device))return false;
 const path=value.path;if(!['/','/blog/'].includes(path)&&!/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path||''))return false;
 const slug=path.startsWith('/blog/')?path.slice(6):'';
 let articleTitle='';if(slug){const article=await store.get('articles/'+slug,{type:'json'});if(article?.status!=='published')return false;articleTitle=article.title||slug;}
 // No identity, IP, full user-agent, or query string is retained.
 const key=`metrics/${metricDay(now)}/talktalk/${String(now).padStart(13,'0')}-${value.id}/${value.device}/${value.placement}`;
 await store.setJSON(key,{at:new Date(now).toISOString(),path,articleTitle,placement:value.placement,device:value.device},{onlyIfNew:true});return true;
}
export async function talkClickReport(store,{before='',days=30}={},now=Date.now()){
 days=[7,30,90].includes(Number(days))?Number(days):30;
 const dates=Array.from({length:days},(_,i)=>metricDay(now-i*DAY));
 const pages=await Promise.all(dates.map(day=>store.list({prefix:`metrics/${day}/talktalk/`})));
 const keys=pages.flatMap(p=>p.blobs.map(b=>b.key));
 const sorted=keys.sort().reverse(),filtered=before?sorted.filter(key=>key<before):sorted;
 const selected=filtered.slice(0,100);
 const events=(await Promise.all(selected.map(async key=>({key,...await store.get(key,{type:'json'})})))) .filter(x=>x.at);
 return {events,total:keys.length,mobile:keys.filter(key=>key.includes('/mobile/')).length,desktop:keys.filter(key=>key.includes('/desktop/')).length,days,timezone:'Asia/Seoul',next:filtered.length>100?selected.at(-1):''};
}

export function summarizeMetricKeys(keys){return {visitors:keys.filter(k=>k.includes('/visit/')).length,clicks:keys.filter(k=>k.includes('/talktalk/')).length,mobile:keys.filter(k=>k.includes('/talktalk/')&&k.includes('/mobile/')).length,desktop:keys.filter(k=>k.includes('/talktalk/')&&k.includes('/desktop/')).length};}
export async function todayTalkClicks(store,now=Date.now()){const {blobs}=await store.list({prefix:`metrics/${metricDay(now)}/talktalk/`});return {today:blobs.length,day:metricDay(now),timezone:'Asia/Seoul'};}
export async function userActivityReport(store,{days=30,before=''}={},now=Date.now()){
 const all=days==='all',count=[7,30,90].includes(Number(days))?Number(days):30,today=metricDay(now);
 const raw=all?await store.list({prefix:'metrics/'}):{blobs:(await Promise.all(Array.from({length:count},(_,i)=>store.list({prefix:`metrics/${metricDay(now-i*DAY)}/`})))).flatMap(p=>p.blobs)};
 const groups=new Map();for(const {key} of raw.blobs){const day=key.split('/')[1];if(day>today)continue;if(!groups.has(day))groups.set(day,[]);groups.get(day).push(key);}
 const daily=new Map([...groups].map(([day,keys])=>[day,{day,...summarizeMetricKeys(keys)}]));
 if(all){const archive=await store.list({prefix:'metric-days/'});for(const batch of Array.from({length:Math.ceil(archive.blobs.length/50)},(_,i)=>archive.blobs.slice(i*50,i*50+50))){const rows=await Promise.all(batch.map(x=>store.get(x.key,{type:'json'})));for(const row of rows)if(row&&row.day<=today)daily.set(row.day,row);}}
 const recordedDays=[...daily.keys()].sort(),start=all?(recordedDays[0]||today):metricDay(now-(count-1)*DAY),end=all?(recordedDays.at(-1)||today):today,series=[];for(let date=Date.parse(start+'T00:00:00Z');(!all||recordedDays.length)&&date<=Date.parse(end+'T00:00:00Z');date+=DAY){const day=new Date(date).toISOString().slice(0,10);series.push(daily.get(day)||{day,visitors:0,clicks:0,mobile:0,desktop:0});}
 const sums=series.reduce((a,x)=>({visitors:a.visitors+x.visitors,total:a.total+x.clicks,mobile:a.mobile+x.mobile,desktop:a.desktop+x.desktop}),{visitors:0,total:0,mobile:0,desktop:0});
 const keys=raw.blobs.map(x=>x.key).filter(k=>k.includes('/talktalk/')&&k.split('/')[1]>=metricDay(now-89*DAY)).sort().reverse().filter(k=>!before||k<before),selected=keys.slice(0,100);
 const events=(await Promise.all(selected.map(async key=>({key,...await store.get(key,{type:'json'})})))).filter(x=>x.at);
 return {...sums,series,events,days:all?'all':count,next:keys.length>100?selected.at(-1):'',timezone:'Asia/Seoul',historyDays:90};
}
