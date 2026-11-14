import {cp,rm,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,sep} from 'node:path';
const generated=resolve('public/assets/fonts');
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true,filter:src=>resolve(src)!==generated&&!resolve(src).startsWith(generated+sep)});
// Fonts are installed from the locked package and generated at deploy time, not uploaded to GitHub.
const packageRoot='node_modules/@fontsource-variable/noto-sans-kr';
const css=await readFile(packageRoot+'/index.css','utf8');
const names=[...new Set([...css.matchAll(/url\(\.\/files\/([^\)]+)\)/g)].map(x=>x[1]))];
await mkdir('dist/assets/fonts',{recursive:true});
await Promise.all(names.map(name=>cp(packageRoot+'/files/'+name,'dist/assets/fonts/'+name)));
await cp(packageRoot+'/LICENSE','dist/assets/fonts/OFL.txt');
await writeFile('dist/assets/noto-sans-kr.css',css.replaceAll('./files/','./fonts/'));
console.log(`Website built in dist/; ${names.length} Korean font subsets generated automatically.`);

let mediaOrigin='';if(process.env.R2_PUBLIC_BASE_URL){const u=new URL(process.env.R2_PUBLIC_BASE_URL);if(u.protocol!=='https:'||u.username||u.password||u.port||u.pathname!=='/'||u.search||u.hash)throw Error('R2_PUBLIC_BASE_URL must be a single HTTPS origin');mediaOrigin=' '+u.origin;}
const pagePolicy=`
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https:; media-src 'self'${mediaOrigin}; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
`;
await writeFile('dist/_headers',['/','/admin/*','/blog/*','/404.html','/assets/*'].map(path=>path+pagePolicy).join(''));

await writeFile('dist/_headers',(await readFile('dist/_headers','utf8'))+`/map.html
  Content-Security-Policy: upgrade-insecure-requests; default-src 'none'; script-src 'self' https://ssl.daumcdn.net https://t1.daumcdn.net https://t1.kakaocdn.net https://map.kakao.com; style-src 'self' 'unsafe-inline' https://t1.daumcdn.net https://t1.kakaocdn.net; img-src https: data:; connect-src https://*.kakao.com https://*.daum.net https://t1.kakaocdn.net http://t1.kakaocdn.net; frame-src https://map.kakao.com; base-uri 'none'; form-action 'none'; frame-ancestors 'self'
`);

// Version stylesheet URLs by content so a normal refresh receives the current styles.
async function versionStyles(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const path=directory+'/'+entry.name;if(entry.isDirectory()){await versionStyles(path);continue;}if(!entry.name.endsWith('.html'))continue;let html=await readFile(path,'utf8');const refs=[...new Set([...html.matchAll(/href="(\/assets\/[a-zA-Z0-9._-]+\.css)(?:\?[^"<>]*)?"/g)].map(m=>m[1]))];for(const ref of refs){const version=createHash('sha256').update(await readFile('dist'+ref)).digest('hex').slice(0,12);html=html.replaceAll(new RegExp('href="'+ref.replaceAll('.','\\.')+'(?:\\?[^"<>]*)?"','g'),'href="'+ref+'?v='+version+'"');}await writeFile(path,html);}}
await versionStyles('dist');
