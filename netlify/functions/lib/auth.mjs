import {randomBytes,createHash,scrypt as scryptCb,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {fail} from './model.mjs';
const scrypt=promisify(scryptCb);
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
export const cookie=(value,age=28800)=>`__Host-soo_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
export async function verify(password,encoded){if(!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded??''))fail(503,'관리자 비밀번호가 아직 설정되지 않았습니다. 홈페이지 관리자에게 문의해 주세요.');const [,salt,hash]=encoded.split(':');const key=await scrypt(password,salt,64);return timingSafeEqual(key,Buffer.from(hash,'hex'));}
export function sessionKey(request){const value=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-soo_session=([a-f0-9]{64})(?:;|$)/)?.[1];return value?`sessions/${digest(value)}`:null;}
export async function authenticate(request,store,env){const key=sessionKey(request);const session=key?await store.get(key,{type:'json'}):null;if(!session||session.expires<Date.now()||session.version!==digest(env.ADMIN_PASSWORD_HASH??''))fail(401,'로그인해 주세요.');return {...session,key};}
export function sameOrigin(request){const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)fail(403,'현재 홈페이지에서 다시 시도해 주세요.');}
export function csrf(request,session){sameOrigin(request);const actual=request.headers.get('x-csrf-token')??'';if(!/^[a-f0-9]{64}$/.test(actual)||!timingSafeEqual(Buffer.from(actual),Buffer.from(session.csrf)))fail(403,'보안 정보가 만료되었습니다. 새로고침 후 다시 로그인해 주세요.');}
