import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sections} from '../netlify/functions/lib/model.mjs';
import {articleBody} from '../netlify/functions/lib/search.mjs';
test('FAQ questions and multiline answers survive saving and appear in initial article HTML',()=>{
 const saved=sections([{type:'faq',items:[{question:'예약이 필요한가요?',answer:'첫 번째 줄\n두 번째 줄'},{question:'<script>질문</script>',answer:'<img src=x onerror=alert(1)>'}]}]);
 assert.equal(saved[0].items[0].answer,'첫 번째 줄\n두 번째 줄');
 const html=articleBody({sections:saved},{});
 assert.ok(html.includes('예약이 필요한가요?'));
 assert.ok(html.includes('첫 번째 줄<br>두 번째 줄'));
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));
 assert.ok(!html.includes('<details'));
});
test('FAQ limits reject oversized or malformed data',()=>{
 assert.throws(()=>sections([{type:'faq',items:Array.from({length:21},()=>({question:'질문',answer:'답변'}))}]));
 assert.throws(()=>sections([{type:'faq',items:[null]}]));
});
