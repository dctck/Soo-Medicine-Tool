export function tocItems(sections=[],allowAutomatic=false){
 const config=sections.find(s=>s.type==='toc');if((!config&&!allowAutomatic)||config?.tocEnabled===false)return [];
 return sections.flatMap((s,index)=>{if(!['heading','quote'].includes(s.type))return [];const text=(s.text||s.runs?.map(r=>r.text).join('')||'').trim();if(!text)return [];const key=s.sectionId||'section-'+index,entry=config?.entries?.find(x=>x.sectionId===key);if(entry?.hidden)return [];return [{key,index,label:(entry?.label?.trim()||s.title?.trim()||text).replace(/\s+/g,' ')}];});
}
export function tocCandidates(sections=[]){return tocItems(sections.map(s=>s.type==='toc'?{...s,tocEnabled:true,entries:[]}:s),true);}
