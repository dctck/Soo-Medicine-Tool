import test from 'node:test';import assert from 'node:assert/strict';
import {tocItems} from '../public/assets/article-toc.js';
import {sections} from '../netlify/functions/lib/model.mjs';
import {articleBody} from '../netlify/functions/lib/search.mjs';
const id='12345678-1234-1234-1234-123456789abc',other='22345678-1234-1234-1234-123456789abc';
test('contents includes titles and all quote styles, with rename/hide surviving reorder',()=>{
 const body=[{type:'toc',entries:[{sectionId:id,label:'짧은 제목',hidden:false},{sectionId:other,hidden:true}]},{type:'heading',sectionId:id,text:'원래 긴 제목'},{type:'quote',sectionId:other,text:'숨길 인용문',quoteStyle:'large'},{type:'quote',text:'인용문 첫 줄\n둘째 줄',quoteStyle:'line'}];
 assert.deepEqual(tocItems(body).map(x=>x.label),['짧은 제목','인용문 첫 줄 둘째 줄']);assert.equal(tocItems([body[0],body[3],body[1],body[2]])[1].label,'짧은 제목');
 const saved=sections(body);assert.equal(saved[0].type,'toc');assert.equal(saved[0].entries[0].label,'짧은 제목');const html=articleBody({sections:saved},{});assert.match(html,/href="#article-section-3"/);assert.match(html,/<blockquote id="article-section-3"/);assert.equal((html.match(/class="article-toc"/g)||[]).length,1);
});
test('contents is optional, unique and fixed at top',()=>{
 assert.equal(tocItems([{type:'toc',tocEnabled:false},{type:'heading',text:'안내'}]).length,0);
 assert.throws(()=>sections([{type:'toc'},{type:'toc'}]));assert.equal(sections([{type:'text',text:'본문'},{type:'toc'}])[0].type,'toc');
 const saved=sections([{type:'heading',sectionId:id,text:'하나'},{type:'heading',sectionId:id,text:'둘'}]);assert.notEqual(saved[0].sectionId,saved[1].sectionId);
});

test('removing contents leaves no automatic contents navigation after save',()=>{const saved=sections([{type:'heading',text:'안내'},{type:'quote',text:'인용문'}]);assert.equal(tocItems(saved).length,0);assert.ok(!articleBody({tocManaged:true,sections:saved},{}).includes('class="article-toc"'));});

test("older published posts retain automatic contents until explicitly managed",()=>{assert.match(articleBody({sections:[{type:"quote",text:"기존 인용문"}]},{}),/class="article-toc"/);});
test('multiline quote contents labels keep every line in one readable label',()=>{
 const body=[{type:'toc',entries:[]},{type:'quote',text:'심적환\n주요 성분과 역할'},{type:'heading',text:'심적환\n복용 안내'}];
 assert.deepEqual(tocItems(body).map(x=>x.label),['심적환 주요 성분과 역할','심적환 복용 안내']);
});
