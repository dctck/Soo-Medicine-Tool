import {cp,rm,mkdir,readFile,writeFile} from 'node:fs/promises';
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
