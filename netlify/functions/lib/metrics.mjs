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
