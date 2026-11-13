// Approximate first-party session counts. No IP address, referrer, or user-agent is stored.
const path=location.pathname.replace(/\/$/,'')||'/';
if(location.hostname==='sooclinic.kr'&&navigator.doNotTrack!=='1'&&(path==='/'||path==='/blog'||/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path))){
 try{let session=sessionStorage.getItem('soo-visit-session');if(!session){session=crypto.randomUUID();sessionStorage.setItem('soo-visit-session',session);}const page=path==='/blog'?'/blog/':path;const key='soo-counted-'+new Date(Date.now()+9*3600000).toISOString().slice(0,10)+page;
 const send=()=>{if(document.visibilityState!=='visible'||sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');fetch('/api/public/metrics',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({session,path:page}),keepalive:true}).then(r=>{if(!r.ok)sessionStorage.removeItem(key);}).catch(()=>sessionStorage.removeItem(key));};
 send();document.addEventListener('visibilitychange',send);
 }catch{/* Metrics never interrupt the website. */}
}
