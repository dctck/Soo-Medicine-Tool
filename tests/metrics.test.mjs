import test from 'node:test';import assert from 'node:assert/strict';
import {metricDay,trackMetric,metricReport} from '../netlify/functions/lib/metrics.mjs';
const now=Date.parse('2026-11-12T16:00:00Z'),session='12345678-1234-1234-1234-123456789abc';
function memory(){const map=new Map([['articles/example',{status:'published'}]]);return {map,get:async key=>map.get(key),setJSON:async(key,value)=>{if(map.has(key))return {modified:false};map.set(key,value);return {modified:true};},list:async({prefix})=>({blobs:[...map.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))})};}
test('metrics use Korea calendar date',()=>assert.equal(metricDay(now),'2026-11-13'));
test('repeat visits and article opens count once per session per day',async()=>{const store=memory();await trackMetric(store,{session,path:'/'},now);await trackMetric(store,{session,path:'/blog/example'},now);await trackMetric(store,{session,path:'/blog/example'},now);const result=await metricReport(store,now);assert.equal(result.today,1);assert.equal(result.articles.example,1);assert.equal(result.month,1);});
test('drafts, admin, and invalid sessions are not counted',async()=>{const store=memory();assert.equal(await trackMetric(store,{session,path:'/admin/'},now),false);assert.equal(await trackMetric(store,{session,path:'/blog/missing'},now),false);assert.equal(await trackMetric(store,{session:'bad',path:'/'},now),false);assert.equal((await metricReport(store,now)).month,0);});
test('time windows exclude older visits',async()=>{const store=memory();await trackMetric(store,{session,path:'/'},now-8*86400000);const report=await metricReport(store,now);assert.equal(report.today,0);assert.equal(report.week,0);assert.equal(report.month,1);});

test('TalkTalk history keeps Korean date, source title and device without visitor identifiers',async()=>{
 const {trackTalkClick,talkClickReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();store.map.set('articles/example',{status:'published',title:'감기 한약 안내'});
 await trackTalkClick(store,{id:session,path:'/blog/example',placement:'article',device:'mobile'},now);
 await trackTalkClick(store,{id:session,path:'/blog/example',placement:'article',device:'mobile'},now);
 await trackTalkClick(store,{id:'22345678-1234-1234-1234-123456789abc',path:'/',placement:'footer',device:'desktop'},now+1);
 const report=await talkClickReport(store,{},now+1);assert.equal(report.total,2);assert.equal(report.mobile,1);assert.equal(report.desktop,1);assert.equal(report.events[1].articleTitle,'감기 한약 안내');assert.equal(report.events[0].placement,'footer');assert.equal(report.events[1].at,new Date(now).toISOString());assert.equal(report.timezone,'Asia/Seoul');assert.ok(!('session' in report.events[0]));assert.ok(!('ip' in report.events[0]));
});
test('TalkTalk rejects drafts, admin, invalid device or placement and preserves ordinary visit counts',async()=>{
 const {trackTalkClick,talkClickReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();const base={id:session,path:'/',placement:'contact',device:'desktop'};
 for(const change of [{path:'/admin/'},{path:'/blog/missing'},{device:'unknown'},{placement:'invalid'},{id:'bad'},{path:'/?private=info'}])assert.equal(await trackTalkClick(store,{...base,...change},now),false);
 await trackTalkClick(store,base,now);assert.equal((await metricReport(store,now)).month,0);assert.equal((await talkClickReport(store,{},now)).total,1);
});
test('TalkTalk pagination preserves simultaneous events and includes 90-day history',async()=>{
 const {trackTalkClick,talkClickReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();
 for(let i=0;i<105;i++)await trackTalkClick(store,{id:i.toString(16).padStart(8,'0')+'-1234-1234-1234-123456789abc',path:'/',placement:'contact',device:'mobile'},now);
 const first=await talkClickReport(store,{},now),second=await talkClickReport(store,{before:first.next},now);assert.equal(first.events.length,100);assert.equal(second.events.length,5);assert.equal(new Set([...first.events,...second.events].map(x=>x.key)).size,105);
 await trackTalkClick(store,{id:session,path:'/',placement:'contact',device:'desktop'},now-40*86400000);assert.equal((await talkClickReport(store,{days:30},now)).total,105);assert.equal((await talkClickReport(store,{days:90},now)).total,106);
});
test('device labels support phones, iPads and desktop without persisting user agent',async()=>{
 const {deviceKind,talkPlacement}=await import('../public/assets/talktalk-metrics.js');
 assert.equal(deviceKind({userAgent:'Mozilla Android Mobile'}),'mobile');assert.equal(deviceKind({userAgent:'Safari',platform:'MacIntel',maxTouchPoints:5}),'mobile');assert.equal(deviceKind({userAgent:'Windows Chrome'}),'desktop');
 assert.equal(talkPlacement({closest:s=>s==='footer,.footer'}),'footer');assert.equal(talkPlacement({closest:s=>s==='.article-talk,.article-body'}),'article');
});

test('activity charts zero-fill dates, follow range and expose Korean today count',async()=>{
 const {userActivityReport,todayTalkClicks,trackTalkClick}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();
 await trackMetric(store,{session,path:'/'},now-2*86400000);await trackTalkClick(store,{id:session,path:'/',placement:'contact',device:'mobile'},now);
 const report=await userActivityReport(store,{days:7},now);assert.equal(report.series.length,7);assert.equal(report.series.at(-1).clicks,1);assert.equal(report.series.at(-2).clicks,0);assert.equal(report.visitors,1);assert.equal((await todayTalkClicks(store,now)).today,1);
});
test('cleanup preserves all-time daily totals while removing old detailed records',async()=>{
 const {userActivityReport,trackTalkClick}=await import('../netlify/functions/lib/metrics.mjs');const {cleanup}=await import('../netlify/functions/lib/cleanup.mjs');const store=memory();store.delete=async key=>store.map.delete(key);const old=now-100*86400000;
 await trackMetric(store,{session,path:'/'},old);await trackTalkClick(store,{id:session,path:'/',placement:'contact',device:'desktop'},old);
 await cleanup(store,now);await cleanup(store,now);
 const report=await userActivityReport(store,{days:'all'},now);assert.equal(report.visitors,1);assert.equal(report.total,1);assert.equal(report.events.length,0);assert.equal(report.series.length,1);assert.equal((await userActivityReport(store,{days:30},now)).total,0);
});

test('all time spans only first through last recorded date and fills gaps',async()=>{const {userActivityReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();assert.equal((await userActivityReport(store,{days:'all'},now)).series.length,0);await trackMetric(store,{session,path:'/'},now-10*86400000);await trackMetric(store,{session,path:'/'},now-8*86400000);const report=await userActivityReport(store,{days:'all'},now);assert.equal(report.series.length,3);assert.equal(report.series[0].day,metricDay(now-10*86400000));assert.equal(report.series.at(-1).day,metricDay(now-8*86400000));assert.equal(report.series[1].visitors,0);});

test('visit device counts deduplicate sessions and preserve unknown legacy visits',async()=>{const {userActivityReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();await trackMetric(store,{session,path:'/',device:'mobile'},now);await trackMetric(store,{session,path:'/blog/example',device:'desktop'},now);await trackMetric(store,{session:'22345678-1234-1234-1234-123456789abc',path:'/'},now);const report=await userActivityReport(store,{days:7},now);assert.equal(report.visitors,2);assert.equal(report.visitMobile,1);assert.equal(report.visitDesktop,0);assert.equal(report.visitors-report.visitMobile-report.visitDesktop,1);});

test('contact clicks retain channel and article source; legacy TalkTalk stays Naver',async()=>{
 const {trackTalkClick,userActivityReport}=await import('../netlify/functions/lib/metrics.mjs');const store=memory();store.map.set('articles/example',{status:'published',title:'진료 안내'});
 for(const [i,channel] of ['naver','kakao','phone'].entries())assert.equal(await trackTalkClick(store,{id:i.toString().padStart(8,'0')+'-1234-1234-1234-123456789abc',path:'/blog/example',placement:'sidebar',channel,device:'desktop'},now+i),true);
 const report=await userActivityReport(store,{},now+3);assert.equal(report.total,3);assert.deepEqual(report.events.map(x=>x.channel),['phone','kakao','naver']);assert.ok(report.events.every(x=>x.articleTitle==='진료 안내'&&x.placement==='sidebar'));
 assert.equal(await trackTalkClick(store,{id:session,path:'/',placement:'contact',channel:'invalid',device:'desktop'},now),false);
});
test('contact destinations identify KakaoTalk, Naver and phone without accepting unrelated URLs',async()=>{
 const {contactChannel}=await import('../public/assets/talktalk-metrics.js');assert.equal(contactChannel('https://talk.naver.com/abc'),'naver');assert.equal(contactChannel('https://open.kakao.com/o/abc'),'kakao');assert.equal(contactChannel('https://pf.kakao.com/abc/chat'),'kakao');assert.equal(contactChannel('tel:0226061275'),'phone');for(const link of ['javascript:alert(1)','https://talk.naver.com.evil.test/','https://user:pass@open.kakao.com/o/a','tel:bad'])assert.equal(contactChannel(link),'');
});
