import test from 'node:test';import assert from 'node:assert/strict';
import {generalTalkURL,talkURL,sectionTalkURL} from '../public/assets/talk-url.js';
import {settings,sections} from '../netlify/functions/lib/model.mjs';
import {articleBody} from '../netlify/functions/lib/search.mjs';
const original='https://talk.naver.com/w5u6ki?frm=pblog&ref=https%3A%2F%2Fblog.naver.com%2Fexample%2F123#nafullscreen';
test('TalkTalk validates the destination while preserving source query and fragment',()=>{
 assert.equal(generalTalkURL(original),'https://talk.naver.com/w5u6ki');assert.equal(talkURL(original),original);assert.equal(settings({talkUrl:original}).talkUrl,original);
 for(const url of ['javascript:alert(1)','https://talk.naver.com.evil.test/a','https://u:p@talk.naver.com/a','https://talk.naver.com:444/a'])assert.equal(talkURL(url),'');
});
test('section override survives save, wins over default and clears back to default',()=>{
 const config={talkUrl:'https://talk.naver.com/clinic'},saved=sections([{type:'talktalk',url:original}])[0];assert.equal(saved.url,original);assert.equal(sectionTalkURL(saved,config),original);assert.equal(sectionTalkURL({...saved,url:''},config),config.talkUrl);assert.throws(()=>sections([{type:'talktalk',url:'https://example.com/'}]));
 const html=articleBody({tocManaged:true,sections:[saved,{type:'talktalk'}]},config);assert.match(html,/frm=pblog&amp;ref=/);assert.match(html,/https:\/\/talk.naver.com\/clinic/);
});
test('both Naver banner and card imports preserve original URL in the standard TalkTalk section',async()=>{
 const {parseNaverHTML}=await import('../netlify/functions/lib/naver.mjs');for(const type of ['se-talktalk','se-oglink']){const parsed=parseNaverHTML(`<div class="se-main-container"><div class="se-component se-text"><p class="se-text-paragraph">본문</p></div><div class="se-component ${type}"><a href="${original.replaceAll('&','&amp;')}">톡톡 상담</a></div></div>`);assert.equal(parsed.sections[1].type,'talktalk');assert.equal(parsed.sections[1].url,original);}
});
test('legacy generic TalkTalk buttons retain their original destination',()=>{const html=articleBody({tocManaged:true,sections:[{type:'button',url:original}]},{talkUrl:'https://talk.naver.com/clinic'});assert.ok(!html.includes('https://talk.naver.com/clinic'));assert.match(html,/frm=pblog/);});
