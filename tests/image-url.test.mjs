import {test} from 'node:test';
import assert from 'node:assert/strict';
import {externalImageURL} from '../public/assets/image-url.js';
import {sections,settings} from '../netlify/functions/lib/model.mjs';
test('external body images accept public HTTPS links without enabling arbitrary home media',()=>{
 const url='https://images.example.com/photo.jpg?size=large';assert.equal(sections([{type:'image',url}])[0].url,url);assert.throws(()=>settings({portrait:url}));
 for(const url of ['javascript:alert(1)','data:image/png;base64,abc','http://images.example.com/a.jpg','https://user:pass@example.com/a','https://127.0.0.1/a','https://localhost/a','https://files.local/a','https://[::1]/a']){assert.equal(externalImageURL(url),'');assert.throws(()=>sections([{type:'image',url}]));}
});
