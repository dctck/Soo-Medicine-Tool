import {test} from 'node:test';import assert from 'node:assert/strict';
import {normalizeRuns,formatRuns,selectionMarks,runsText,matchSourceSpacing,truncateText,listLines,selectedLines,resizeListLines} from '../public/assets/text-format.js';
import {sections} from '../netlify/functions/lib/model.mjs';
test('selected styles toggle off and leave unselected text untouched',()=>{let runs=normalizeRuns([{text:'abcdef'}]);runs=formatRuns(runs,1,4,'bold');assert.equal(selectionMarks(runs,1,4).bold,true);assert.equal(selectionMarks(runs,0,6).bold,'mixed');runs=formatRuns(runs,1,4,'bold');assert.deepEqual(runs,normalizeRuns([{text:'abcdef'}]));});
test('clear removes every mark and link only within the selection',()=>{const runs=normalizeRuns([{text:'abcdef',bold:true,italic:true,underline:true,tone:'brand',highlight:true,href:'https://example.com'}]);const result=formatRuns(runs,1,5,'clear');assert.deepEqual(result[1],normalizeRuns([{text:'bcde'}])[0]);assert.equal(result[0].bold,true);assert.equal(result[2].bold,true);});
test('custom colors persist safely and highlights support none',()=>{let runs=formatRuns([{text:'한국어'}],0,3,'color','#123ABC');runs=formatRuns(runs,0,3,'highlightColor','#d6efec');const saved=sections([{type:'text',runs}])[0];assert.equal(saved.runs[0].color,'#123abc');assert.equal(saved.runs[0].highlightColor,'#d6efec');assert.equal(selectionMarks(formatRuns(runs,0,3,'highlightColor',''),0,3).highlightColor,'');assert.equal(sections([{type:'text',runs:[{text:'x',color:'url(evil)',highlightColor:'red;display:none'}]}])[0].runs[0].color,'');});
test('spacing repair retains marks, changes whitespace only and skips edited wording',()=>{const result=matchSourceSpacing([{text:'첫째\n\n둘째',bold:true}],null,'첫째\n둘째');assert.equal(runsText(result),'첫째\n둘째');assert.ok(result.every(x=>x.bold));assert.equal(matchSourceSpacing([], '수정한 문장','원래 문장'),null);});
test('link excerpt truncates at 30 Unicode characters',()=>{assert.equal(truncateText('가'.repeat(31),30),'가'.repeat(30)+'…');assert.equal(truncateText('one  two\nthree',30),'one two three');});

test('partial list selections stop before the next line and survive edits and save',()=>{
 const text='first\nsecond\nthird';
 assert.deepEqual(selectedLines(text,6,13),[1,1]);
 assert.deepEqual(selectedLines(text,13,13),[2,2]);
 const [saved]=sections([{type:'text',text,lineLists:['','checklist','']}]);
 assert.deepEqual(listLines(saved,text),['','checklist','']);
 assert.deepEqual(resizeListLines(text,'first\nsec\nond\nthird',saved.lineLists),['','checklist','checklist','']);
 assert.deepEqual(listLines({listType:'bullet'},text),['bullet','bullet','bullet']);
});
