import test from 'node:test';import assert from 'node:assert/strict';
import {contactLinks} from '../public/assets/contact-dock.js';
import {settings,publicSettings} from '../netlify/functions/lib/model.mjs';
test('contact navigation uses saved chat destinations and phone, and hides missing channels',()=>{
 const s={kakaoTalkUrl:'https://open.kakao.com/o/example',talkUrl:'https://talk.naver.com/w5u6ki',phone:'02-2606-1275'};
 assert.deepEqual(contactLinks(s).map(x=>x.label),['카톡 상담','네이버 톡톡','오시는 길']);assert.equal(contactLinks(s)[2].href,'/#contact');assert.equal(contactLinks({...s,kakaoTalkUrl:''})[0].disabled,true);assert.equal(contactLinks({}).filter(x=>!x.disabled&&x.kind!=='directions').length,0);
 for(const bad of ['javascript:alert(1)','http://open.kakao.com/o/example','https://user:pass@open.kakao.com/'])assert.equal(contactLinks({kakaoTalkUrl:bad}).filter(x=>!x.disabled&&x.kind!=='directions').length,0);
});
test('KakaoTalk destination is editable, persisted in settings and publicly readable',()=>{
 const value=settings({kakaoTalkUrl:'https://open.kakao.com/o/example'});assert.equal(publicSettings(value).kakaoTalkUrl,'https://open.kakao.com/o/example');assert.throws(()=>settings({kakaoTalkUrl:'javascript:alert(1)'}));
});
