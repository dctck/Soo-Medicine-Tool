const ns='http://www.w3.org/2000/svg';
export function activityChart(series,key,label){
 const figure=document.createElement('figure');figure.className='activity-chart';const caption=document.createElement('figcaption');caption.textContent=label;figure.append(caption);const note=document.createElement('p');note.className='chart-range-note';note.textContent=series.length?series[0].day+' ~ '+series.at(-1).day+(series.length===1?' · 하루치 기록만 있어 점 하나로 표시됩니다.':''):'아직 기록된 데이터가 없습니다.';figure.append(note);if(!series.length)return figure;
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 720 240');svg.setAttribute('role','img');svg.setAttribute('aria-label',label+' · 가로축 날짜, 세로축 횟수');
 const add=(tag,attrs,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;svg.append(n);return n;};
 const max=Math.max(3,...series.map(x=>x[key])),top=Math.ceil(max/3)*3,x=i=>52+(series.length===1?320:i*640/Math.max(1,series.length-1)),y=v=>196-v/top*160;
 for(let i=0;i<=3;i++){const value=top*i/3;add('line',{x1:52,y1:y(value),x2:692,y2:y(value),class:'chart-grid'});add('text',{x:40,y:y(value)+4,'text-anchor':'end',class:'chart-label'},value+'');}
 const points=series.map((d,i)=>`${x(i)},${y(d[key])}`).join(' ');add('polyline',{points,fill:'none',class:'chart-line'});
 series.forEach((d,i)=>{const dot=add('circle',{cx:x(i),cy:y(d[key]),r:series.length>90?1.5:3,class:'chart-dot'});const title=document.createElementNS(ns,'title');title.textContent=d.day+' · '+d[key]+'회';dot.append(title);});
 const ticks=new Set([0,Math.max(0,series.length-1),...Array.from({length:4},(_,i)=>Math.round((series.length-1)*(i+1)/5))]);for(const i of ticks){const d=series[i];if(d)add('text',{x:x(i),y:222,'text-anchor':'middle',class:'chart-label'},d.day.slice(2).replaceAll('-','.'));}
 figure.append(svg);const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='날짜별 수치 보기';const table=document.createElement('table');for(const d of series){const row=table.insertRow();row.insertCell().textContent=d.day;row.insertCell().textContent=d[key]+'회';}details.append(summary,table);figure.append(details);return figure;
}
