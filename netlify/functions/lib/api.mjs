import {matchSourceSpacing} from '../../../public/assets/text-format.js';
import {randomUUID} from 'node:crypto';
import {article,treatment,settings,defaults,slug,fail,HttpError,text} from './model.mjs';
import {authenticate,csrf,sameOrigin,verify,token,digest,cookie,sessionKey} from './auth.mjs';
import {fetchDrafts} from './rss.mjs';
import {mediaType} from './media.mjs';
import {canonicalPost,importFullPost,sourceParagraphs,previewNaverLink} from './naver.mjs';
import {validateInquiry} from '../../../public/assets/inquiry-rules.js';
const MAX=4_000_000;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function body(request){if(Number(request.headers.get('content-length'))>300000)fail(413,'입력한 내용이 너무 큽니다.');const s=await request.text();if(s.length>300000)fail(413,'입력한 내용이 너무 큽니다.');try{const parsed=JSON.parse(s);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'입력 형식이 올바르지 않습니다.');return parsed;}catch{fail(400,'입력 형식이 올바르지 않습니다.');}}
async function records(store,prefix){const {blobs}=await store.list({prefix});const items=await Promise.all(blobs.map(x=>store.get(x.key,{type:'json'})));return items.filter(Boolean);}
export function createAPI({store,media,env=process.env,fetcher=fetch}){return async(request,context={})=>{try{
 const u=new URL(request.url);const path=u.pathname.replace(/^\/(?:api|\.netlify\/functions\/api)/,'').replace(/\/$/,'')||'/';const method=request.method;
 if(path==='/auth/login'&&method==='POST'){
  sameOrigin(request);const {password}=await body(request);if(typeof password!=='string'||password.length>500)fail(400,'비밀번호를 확인해 주세요.');
  const slot=Math.floor(Date.now()/900000);const prefix=`attempts/${digest(context.ip??'shared')}/${slot}/`;let permitted=false;for(let slotIndex=0;slotIndex<10;slotIndex++){const result=await store.setJSON(prefix+slotIndex,{at:Date.now()},{onlyIfNew:true});if(result.modified){permitted=true;break;}}if(!permitted)fail(429,'로그인 시도 횟수를 초과했습니다. 15분 뒤 다시 시도해 주세요.');
  if(!await verify(password,env.ADMIN_PASSWORD_HASH))fail(401,'비밀번호가 올바르지 않습니다.');const sid=token();const session={csrf:token(),expires:Date.now()+8*3600000,version:digest(env.ADMIN_PASSWORD_HASH)};await store.setJSON(`sessions/${digest(sid)}`,session);return json({csrf:session.csrf},200,{'Set-Cookie':cookie(sid)});
 }

 if(path==='/public/inquiries'&&method==='POST'){
  sameOrigin(request);const input=await body(request);const validation=validateInquiry(input);if(validation.error)fail(400,validation.error);const bucket=Math.floor(Date.now()/900000),prefix=`attempts/inquiry/${digest(context.ip??'shared')}/${bucket}/`;let permitted=false;for(let i=0;i<5;i++){const write=await store.setJSON(prefix+i,{at:Date.now()},{onlyIfNew:true});if(write.modified){permitted=true;break;}}if(!permitted)fail(429,'상담신청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.');const id=randomUUID(),now=Date.now();await store.setJSON('inquiries/'+id,{id,...validation.value,status:'new',createdAt:new Date(now).toISOString(),expiresAt:now+30*86400000});return json({ok:true},201);
 }
 if(path==='/public/settings'&&method==='GET')return json(await store.get('settings',{type:'json'})??defaults);
 if(/^\/public\/(articles|treatments)(\/[a-z0-9-]+)?$/.test(path)&&method==='GET'){
  const [,kind,id]=path.split('/').slice(1);const all=await records(store,kind+'/');const published=all.filter(x=>x.status==='published');
  if(id){const item=published.find(x=>x.slug===id);if(!item)fail(404,'요청한 내용을 찾을 수 없습니다.');return json(item);}return json(published.sort((a,b)=>kind==='treatments'?a.order-b.order:(b.publishedAt??b.updatedAt).localeCompare(a.publishedAt??a.updatedAt)).map(x=>kind==='articles'?{slug:x.slug,title:x.title,excerpt:x.excerpt,cover:x.cover,publishedAt:x.publishedAt,treatments:x.treatments}:x));
 }
 if(path.startsWith('/media/')&&method==='GET'){
  const id=path.slice(7);if(!/^[a-f0-9-]{36}$/.test(id))fail(404,'요청한 내용을 찾을 수 없습니다.');const result=await media.getWithMetadata(id,{type:'arrayBuffer'});if(!result)fail(404,'요청한 내용을 찾을 수 없습니다.');const bytes=new Uint8Array(result.data);const headers={'Content-Type':result.metadata.type,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable','Accept-Ranges':'bytes'};
  const range=request.headers.get('range');if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);let start,end;if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});if(!m[1]){start=Math.max(0,bytes.length-Number(m[2]));end=bytes.length-1;}else{start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),bytes.length-1):bytes.length-1;}if(start>end||start>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});return new Response(bytes.slice(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':String(end-start+1)}});}return new Response(bytes,{headers:{...headers,'Content-Length':String(bytes.length)}});
 }
 const session=await authenticate(request,store,env);
 if(method!=='GET')csrf(request,session);
 if(path==='/auth/session'&&method==='GET')return json({csrf:session.csrf,expires:session.expires});
 if(path==='/auth/logout'&&method==='POST'){await store.delete(session.key);return json({ok:true},200,{'Set-Cookie':cookie('',0)});}

 if(path==='/admin/inquiries'&&method==='GET')return json((await records(store,'inquiries/')).filter(x=>x.expiresAt>Date.now()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
 if(/^\/admin\/inquiries\/[a-f0-9-]{36}$/.test(path)){
  const id=path.split('/').pop(),key='inquiries/'+id;if(method==='DELETE'){await store.delete(key);return json({ok:true});}if(method==='PUT'){const item=await store.get(key,{type:'json'});if(!item||item.expiresAt<=Date.now())fail(404,'상담신청을 찾을 수 없습니다.');await store.setJSON(key,{...item,status:'done'});return json({ok:true});}
 }
 if(path==='/admin/settings'){if(method==='GET')return json(await store.get('settings',{type:'json'})??defaults);if(method==='PUT'){const value=settings(await body(request));await store.setJSON('settings',value);return json(value);}}
 const match=/^\/admin\/(articles|treatments)(?:\/([a-z0-9-]+))?$/.exec(path);
 if(match){const [,kind,id]=match;if(method==='GET'&&!id)return json(await records(store,kind+'/'));
  if(method==='PUT'&&id){slug(id);const value=(kind==='articles'?article:treatment)(await body(request));if(value.slug!==id)fail(400,'글 주소가 일치하지 않습니다.');const old=await store.get(kind+'/'+id,{type:'json'});const now=new Date().toISOString();const saved={...value,createdAt:old?.createdAt??now,updatedAt:now,...(kind==='articles'?{publishedAt:value.status==='published'?(old?.publishedAt??now):null}:{})};await store.setJSON(kind+'/'+id,saved);return json(saved);}
  if(method==='DELETE'&&id){await store.delete(kind+'/'+slug(id));return json({ok:true});}
 }
 if(path==='/admin/media'&&method==='GET')return json(await records(store,'media/'));
 if(path==='/admin/media'&&method==='POST'){
  if(Number(request.headers.get('content-length'))>MAX)fail(413,'파일은 최대 4MB까지 업로드할 수 있습니다.');const bytes=await request.arrayBuffer();if(bytes.byteLength>MAX)fail(413,'파일은 최대 4MB까지 업로드할 수 있습니다.');const type=request.headers.get('content-type')?.split(';')[0];if(!mediaType(bytes,type))fail(400,'PNG·JPEG·WebP·GIF 이미지 또는 MP4·WebM 영상을 선택해 주세요. 파일 형식이 올바르지 않습니다.');const id=randomUUID();const item={id,url:'/api/media/'+id,name:text(u.searchParams.get('name'),150)||id,type,size:bytes.byteLength,createdAt:new Date().toISOString()};await media.set(id,bytes,{metadata:{type}});await store.setJSON('media/'+id,item);return json(item,201);
 }
 if(/^\/admin\/media\/[a-f0-9-]{36}$/.test(path)&&method==='DELETE'){
  const id=path.split('/').pop();const url='/api/media/'+id;const content=JSON.stringify([await store.get('settings',{type:'json'}),await records(store,'articles/'),await records(store,'treatments/')]);if(content.includes(url))fail(409,'이 파일을 사용하는 글이나 홈페이지 설정이 있습니다. 사용 중인 위치에서 먼저 제거해 주세요.');await media.delete(id);await store.delete('media/'+id);return json({ok:true});
 }

 if(path==='/admin/import/feed'&&method==='POST'){
  const value=await body(request),config=await store.get('settings',{type:'json'});const items=await fetchDrafts(value.blogId||config?.naverBlogId||env.NAVER_BLOG_ID||'kmd_jjs',fetcher);const saved=await records(store,'articles/');return json(items.map(item=>{const canonical=canonicalPost(item.sourceUrl).url;const existing=saved.find(x=>{try{return canonicalPost(x.sourceUrl).url===canonical;}catch{return false;}});return {...item,existingSlug:existing?.slug??'',existingStatus:existing?.status??''};}));
 }
 if(path==='/admin/link-preview'&&method==='POST'){const value=await body(request);return json(await previewNaverLink(value.url,{store,media,fetcher}));}
 if(path==='/admin/import/spacing'&&method==='POST'){
  const value=await body(request);const existing=await store.get('articles/'+slug(value.slug),{type:'json'});if(!existing)fail(404,'글을 찾을 수 없습니다.');const original=await sourceParagraphs(existing.sourceUrl,fetcher),used=new Set();let changed=0;const content=structuredClone(existing);for(const section of content.sections){if(!['text','quote','heading','callout'].includes(section.type))continue;for(let i=0;i<original.length;i++){if(used.has(i)||original[i].type!==section.type)continue;const runs=matchSourceSpacing(section.runs,section.text,original[i].runs?.map(x=>x.text).join('')||original[i].text);if(runs){used.add(i);const next=runs.map(x=>x.text).join('');if(next!==section.text){section.runs=runs;section.text=next;changed++;}break;}}}return json({article:content,changed});
 }
 if(path==='/admin/import/full'&&method==='POST'){
  const value=await body(request);const canonical=canonicalPost(value.url);const saved=await records(store,'articles/');const existing=saved.find(x=>{try{return canonicalPost(x.sourceUrl).url===canonical.url;}catch{return false;}});
  if(existing&&!value.refresh)return json({article:existing,existing:true});
  if(value.refresh&&(!existing||value.slug!==existing.slug))fail(409,'기존 글을 확인할 수 없습니다. 글 목록에서 다시 열어 주세요.');
  if(value.refresh&&existing.status==='published')fail(409,'게시된 글은 먼저 임시저장으로 변경한 후 본문을 교체해 주세요.');
  const imported=await importFullPost(canonical.url,{store,media,fetcher});const now=new Date().toISOString();const content=article({...imported,...(existing?{slug:existing.slug,title:existing.title,excerpt:existing.excerpt,treatments:existing.treatments}:{}),status:'draft'});const result={...content,createdAt:existing?.createdAt??now,updatedAt:now,publishedAt:null};const write=await store.setJSON('articles/'+result.slug,result,existing?{}:{onlyIfNew:true});
  if(!write.modified)fail(409,'이미 가져온 글입니다. 글 목록에서 열어 주세요.');return json({article:result,existing:false,warnings:imported.warnings});
 }
 if(path==='/admin/import'&&method==='POST'){
  const value=await body(request);const config=await store.get('settings',{type:'json'});const drafts=await fetchDrafts(value.blogId||config?.naverBlogId||env.NAVER_BLOG_ID||'',fetcher);let imported=0;for(const draft of drafts){const key='articles/'+draft.slug;if(await store.get(key,{type:'json'}))continue;const now=new Date().toISOString();const write=await store.setJSON(key,{...draft,createdAt:now,updatedAt:now,publishedAt:null},{onlyIfNew:true});if(write.modified)imported++;}return json({imported,skipped:drafts.length-imported});
 }
 fail(404,'요청한 내용을 찾을 수 없습니다.');
 }catch(error){if(!(error instanceof HttpError))console.error('Soo API failure:',error?.name);return json({error:error instanceof HttpError?error.message:'현재 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.'},error instanceof HttpError?error.status:503);}};}
