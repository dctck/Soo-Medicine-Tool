import {applySiteCopy} from './site-content.js';
import {$,el,api,cards} from './shared.js';
let articles=[];function render(){const term=$('#search').value.toLocaleLowerCase();const treatment=$('#treatment-filter').value;const filtered=articles.filter(x=>(x.title+' '+x.excerpt).toLocaleLowerCase().includes(term)&&(!treatment||x.treatments.includes(treatment)));cards($('#articles'),filtered);if(!filtered.length&&articles.length)$('#articles').replaceChildren(el('p','검색 결과가 없습니다.',{class:'empty'}));}
$('#search').addEventListener('input',render);$('#treatment-filter').addEventListener('change',render);
api('/public/articles').then(items=>{articles=items;render();}).catch(()=>$('#articles').replaceChildren(el('p','이야기를 불러오지 못했습니다. 새로고침해 주세요.',{class:'error'})));
api('/public/treatments').then(items=>{for(const t of items)$('#treatment-filter').append(el('option',t.title,{value:t.slug}));}).catch(()=>{});

api('/public/settings').then(applySiteCopy).catch(()=>{});
