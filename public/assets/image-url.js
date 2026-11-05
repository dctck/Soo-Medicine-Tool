// External image URLs are rendered by the visitor's browser, never fetched by our server.
export function externalImageURL(value){
 if(typeof value!=='string'||value.length>2000)return '';
 try{const u=new URL(value.trim()),h=u.hostname.toLowerCase();if(u.protocol!=='https:'||u.username||u.password||u.port||!h.includes('.')||/^[\d.]+$/.test(h)||h.includes(':')||/(^|\.)(localhost|local|internal|test|invalid)$/.test(h))return '';return u.href;}catch{return '';}
}
