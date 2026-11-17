import test from 'node:test';
import assert from 'node:assert/strict';
import {settings,resolveSettings,publicSettings} from '../netlify/functions/lib/model.mjs';
test('Kakao map settings migrate to the clinic Naver link without resetting other copy',()=>{
 const value=resolveSettings({homepageRevision:'2026-11-02-profile',mapUrl:'https://map.kakao.com/link/map/1910394930',mapLabel:'카카오맵 열기 ↗',heroTitle:'Keep my headline'});
 assert.equal(value.mapUrl,'https://naver.me/xyTnW6nn');assert.equal(value.mapLabel,'네이버 지도 열기 ↗');assert.equal(value.heroTitle,'Keep my headline');
});
test('Naver map destination is editable and public without an API key',()=>{
 const value=settings({mapUrl:'https://naver.me/xyTnW6nn'});assert.equal(publicSettings(value).mapUrl,'https://naver.me/xyTnW6nn');assert.equal(value.naverMapClientId,undefined);
 const edited=resolveSettings({...value,mapUrl:'https://naver.me/another'});assert.equal(edited.mapUrl,'https://naver.me/another');
});
