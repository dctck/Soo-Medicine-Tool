// Only explicit inline text highlights count; white/transparent page backgrounds do not.
export function importedHighlight(tag,style=''){
 if(tag==='mark')return '#fff2a1';
 if(!['span','b','strong','i','em','u','a'].includes(tag))return '';
 const raw=/(?:^|;)\s*background-color\s*:\s*([^;]+)/i.exec(style)?.[1]?.trim().toLowerCase();if(!raw)return '';
 let rgb;if(/^#[\da-f]{3}$/i.test(raw))rgb=[...raw.slice(1)].map(c=>parseInt(c+c,16));else if(/^#[\da-f]{6}$/i.test(raw))rgb=[1,3,5].map(i=>parseInt(raw.slice(i,i+2),16));else{const m=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(raw);if(!m||Number(m[4]??1)<0.5)return '';rgb=m.slice(1,4).map(Number);}
 if(rgb.some(n=>n>255)||rgb.every(n=>n>=240)||Math.max(...rgb)-Math.min(...rgb)<20)return '';
 return '#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join('');
}
