import {readdir,readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
async function files(dir){const out=[];for(const x of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+x.name;if(x.isDirectory())out.push(...await files(p));else out.push(p);}return out;}
let count=0;for(const path of [...await files('public'),...await files('netlify'),...await files('scripts')]){if(/\.(mjs|js)$/.test(path)){const r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);count++;}if(path.endsWith('.html')){const source=await readFile(path,'utf8');assert.ok(source.includes('name="viewport"'),path);const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate IDs: '+path);for(const match of source.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g))await stat('public'+match[1]);}}
for(const path of ['dist/index.html','dist/admin/index.html','dist/blog/index.html','dist/blog/article.html','dist/404.html','public/assets/intro.mp4'])assert.ok((await stat(path)).size>0,path);
console.log(`Checked ${count} JavaScript files, HTML references, unique IDs and deployment output.`);

const fontCSS=await readFile('dist/assets/noto-sans-kr.css','utf8');for(const m of fontCSS.matchAll(/url\(\.\/([^\)]+)\)/g))await stat('dist/assets/'+m[1]);console.log('Self-hosted Korean font references verified.');
