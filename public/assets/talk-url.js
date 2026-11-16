// A clinic inbox URL, without the source blog's referral query or fragment.
export function generalTalkURL(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='talk.naver.com'||u.username||u.password||u.port||!/^\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname))return '';return u.origin+u.pathname.replace(/\/$/,'');}catch{return '';}}
export function talkURL(value){try{const u=new URL(value);if(!generalTalkURL(value))return '';return u.href;}catch{return '';}}
export function sectionTalkURL(section,settings){return talkURL(section.url||settings.talkUrl);}
