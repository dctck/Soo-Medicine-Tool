// Uses Netlify's official local Blobs server and real SDK, never production storage.
import {BlobsServer} from '@netlify/blobs/server';
import {getStore} from '@netlify/blobs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';
import assert from 'node:assert/strict';
import {createAPI} from '../netlify/functions/lib/api.mjs';
const dir=await mkdtemp(join(tmpdir(),'soo-blobs-test-'));const token=randomBytes(32).toString('hex');let server=new BlobsServer({directory:dir,token,logger:()=>{}});
const password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');const env={ADMIN_PASSWORD_HASH:'scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex')};
let cookie='',csrf='';
function apiAt(port){const options={apiURL:`http://localhost:${port}`,edgeURL:`http://localhost:${port}`,uncachedEdgeURL:`http://localhost:${port}`,siteID:'soo-integration',token,consistency:'strong'};return createAPI({store:getStore({name:'cms',...options}),media:getStore({name:'media',...options}) ,env});}
let handler;async function call(path,method='GET',value,headers={}){return handler(new Request('https://soo.test/api'+path,{method,headers:{origin:'https://soo.test',cookie,'X-CSRF-Token':csrf,...(value!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:value===undefined?undefined:JSON.stringify(value)}),{ip:'test-client'});}
try{
 const {port}=await server.start();handler=apiAt(port);
 const login=await call('/auth/login','POST',{password});assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];csrf=(await login.json()).csrf;
 const article={title:'Persistent story',slug:'persistent-story',status:'draft',sections:[{type:'text',text:'Created against the actual Blobs SDK.'}],treatments:[]};
 assert.equal((await call('/admin/articles/persistent-story','PUT',article)).status,200);assert.equal((await call('/public/articles/persistent-story')).status,404);
 assert.equal((await call('/admin/articles/persistent-story','PUT',{...article,status:'published'})).status,200);
 assert.equal((await call('/public/inquiries','POST',{name:'테스트',contact:'01000000000',topic:'진료 안내',consent:true})).status,201);
 // Restart the storage server, keeping its directory. New API/store instances must read the data.
 await server.stop();server=new BlobsServer({directory:dir,token,logger:()=>{}});const restarted=await server.start();handler=apiAt(restarted.port);
 assert.equal((await call('/auth/session')).status,200);assert.equal((await (await call('/admin/inquiries')).json()).length,1);const publicResult=await call('/public/articles/persistent-story');const publicValue=await publicResult.json();assert.equal(publicResult.status,200,JSON.stringify(publicValue));assert.equal(publicValue.title,'Persistent story',JSON.stringify(publicValue));
 const raw=new Uint8Array([137,80,78,71,13,10,26,10,42]);const uploaded=await handler(new Request('https://soo.test/api/admin/media?name=test.png',{method:'POST',headers:{origin:'https://soo.test',cookie,'X-CSRF-Token':csrf,'Content-Type':'image/png'},body:raw}),{ip:'test-client'});assert.equal(uploaded.status,201);const item=await uploaded.json();const read=await call(item.url.slice(4));assert.deepEqual(new Uint8Array(await read.arrayBuffer()),raw);
 const range=await call(item.url.slice(4),'GET',undefined,{Range:'bytes=0-3'});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,4);
 assert.equal((await call('/auth/logout','POST',{})).status,200);assert.equal((await call('/admin/articles')).status,401);
 console.log('PASS: real Netlify Blobs SDK: login, draft isolation, publication, storage restart persistence, media upload/read/range and logout.');
}finally{await server.stop();await rm(dir,{recursive:true,force:true});}
