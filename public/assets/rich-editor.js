import {linkIcon} from './link-icons.js';
import {el,appendRuns,httpsLink} from './shared.js';
import {normalizeRuns,runsText,replaceRuns,sliceRuns,marksAt,selectionMarks,formatRuns,validColor,tones,listLines,selectedLines,resizeListLines,listDepths,listMarker} from './text-format.js';
export function readRuns(editor){const runs=[];function visit(node,state={}){if(node.nodeType===3){const text=node.textContent.replace(/\u200b/g,'');if(text)runs.push({text,...state});return;}if(node.nodeType!==1||node.classList.contains('line-list-marker'))return;const tag=node.tagName.toLowerCase();if(tag==='br'){if(!node.hasAttribute('data-editor-placeholder'))runs.push({text:'\n',...state});return;}if(node.classList.contains('rich-list-line')&&node.previousSibling)runs.push({text:'\n'});const flags={...state};if(['b','strong'].includes(tag))flags.bold=true;if(['i','em'].includes(tag))flags.italic=true;if(tag==='u')flags.underline=true;if(tag==='mark')flags.highlightColor=validColor(node.dataset.highlight)||'#fff2a1';if(validColor(node.dataset.color))flags.color=validColor(node.dataset.color);for(const tone of Object.keys(tones))if(node.classList.contains('tone-'+tone))flags.color=tones[tone];if(tag==='a'&&node.getAttribute('href')?.startsWith('https://'))flags.href=node.getAttribute('href');if(!node.classList.contains('rich-list-line')&&['div','p'].includes(tag)&&node.previousSibling&&runs.length&&!runs.at(-1).text.endsWith('\n'))runs.push({text:'\n',...state});for(const child of node.childNodes)visit(child,flags);if(!node.classList.contains('rich-list-line')&&['div','p'].includes(tag)&&node.nextSibling&&!runs.at(-1)?.text.endsWith('\n'))runs.push({text:'\n',...state});}for(const node of editor.childNodes)visit(node);return normalizeRuns(runs);}
const textPalette=['#334748','#087787','#38a8a2','#1d5276','#b01a8e','#b34842','#835e36','#64797d'];
const highlightPalette=['#fff2a1','#d6efec','#dceffa','#f4dfeb','#eee5f5','#e5ecee','#f8e4c8','#dceccf'];
function colorStore(){try{return JSON.parse(localStorage.getItem('soo-studio-colors-v1'))||{};}catch{return {};}}
function saveColors(store){try{localStorage.setItem('soo-studio-colors-v1',JSON.stringify(store));}catch{}}
export function richEditor(section,label,onChange,notify){let runs=normalizeRuns(section.runs,section.text),range={start:0,end:0},pending=null,composing=false,compositionFinishing=false,compositionTimer=null,popover=null;const wrap=el('div','',{class:'rich-wrap'}),tools=el('div','',{class:'format-tools',role:'toolbar','aria-label':'텍스트 서식'}),editor=el(section.type==='quote'?'blockquote':'div','',{class:'rich-input text-align-'+(section.align||'left')+(section.type==='quote'?' quote-'+(section.quoteStyle||'line'):''),contenteditable:'true',role:'textbox','aria-label':label,'aria-multiline':'true','data-placeholder':'내용을 입력해 주세요.'});let lists=listLines(section,runsText(runs));let depths=listDepths(section,lists);let history=[{depths:[...depths],runs:structuredClone(runs),lists:[...lists],range:{...range}}],historyIndex=0;const buttons={};
 function actualRange(){const selection=window.getSelection();if(!selection?.rangeCount||!editor.contains(selection.anchorNode)||!editor.contains(selection.focusNode))return null;const prefix=document.createRange();prefix.setStart(editor,0);prefix.setEnd(selection.anchorNode,selection.anchorOffset);const a=runsText(readRuns(prefix.cloneContents())).length;prefix.setEnd(selection.focusNode,selection.focusOffset);const b=runsText(readRuns(prefix.cloneContents())).length;return {start:Math.min(a,b),end:Math.max(a,b)};}
 function remember(){const actual=actualRange();if(actual){if(actual.start!==range.start||actual.end!==range.end)pending=null;range=actual;}return range;}
 function restore(){
  editor.focus({preventScroll:true});
  function point(position){
   let rowStart=0;
   const rows=editor.querySelectorAll(':scope > .rich-list-line');
   for(const row of rows){
    const length=runsText(readRuns(row)).length;
    if(position<=rowStart+length){
     if(!length)return [row,0];
     const walker=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);
     let remaining=position-rowStart,node;
     while((node=walker.nextNode())){
      if(remaining<=node.length)return [node,remaining];
      remaining-=node.length;
     }
     return [row,row.childNodes.length];
    }
    rowStart+=length+1;
   }
   const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
   let node,offset=0;
   while((node=walker.nextNode())){
    if(node.parentElement?.closest('.line-list-marker'))continue;
    const length=node.textContent.replace(/\u200b/g,'').length;
    if(length&&position<=offset+length){
     let physical=0,logical=0;
     while(physical<node.length&&(logical<position-offset||node.data[physical]==='\u200b')){
      if(node.data[physical]!=='\u200b')logical++;
      physical++;
     }
     return [node,physical];
    }
    offset+=length;
   }
   return [editor,editor.childNodes.length];
  }
  const selection=window.getSelection(),selectionRange=document.createRange();
  selectionRange.setStart(...point(range.start));
  selectionRange.setEnd(...point(range.end));
  selection.removeAllRanges();
  selection.addRange(selectionRange);
 }
 function currentMarks(){return pending&&range.start===range.end?pending:selectionMarks(runs,range.start,range.end);}
 function update(){const state=currentMarks();for(const key of ['bold','italic','underline'])buttons[key]?.setAttribute('aria-pressed',String(state[key]));for(const key of ['color','highlightColor']){const value=state[key],b=buttons[key];if(b){b.setAttribute('aria-pressed',value==='mixed'?'mixed':String(Boolean(value)));b.style.setProperty('--selected-color',validColor(value)||(key==='color'?'#334748':'#fff2a1'));b.title=(key==='color'?'글자 색상':'형광펜 색상')+(value==='mixed'?' · 여러 색상':value?' · '+value:' · 기본');}}if(section.type==='text'){
 const [first,last]=selectedLines(runsText(runs),range.start,range.end);
 for(const value of ['bullet','number','checklist']){
  buttons['list-'+value]?.setAttribute('aria-pressed',String(lists.slice(first,last+1).every(mode=>mode===value)));
 }
 }if(buttons.undo)buttons.undo.disabled=historyIndex===0;if(buttons.redo)buttons.redo.disabled=historyIndex===history.length-1;}
 function render(){
  editor.replaceChildren();

  let offset=0;const counters=[];
  runsText(runs).split('\n').forEach((line,index,lines)=>{
   const mode=lists[index];
   const depth=depths[index]||0;
   counters.length=depth+1;
   const number=mode==='number'?(counters[depth]||0)+1:0;
   counters[depth]=number;
   const row=el('div','',{class:'rich-list-line'+(mode?' has-list-marker':''),'data-depth':depth});
   if(mode){
    row.dataset.listMode=mode;
    row.dataset.marker=listMarker(mode,depth,number);
   }
   appendRuns(row,sliceRuns(runs,offset,offset+line.length));
   if(!line)row.append(el('br','',{'data-editor-placeholder':''}));
   editor.append(row);
   offset+=line.length+1;
  });
 }
 function persist(){
  section.runs=runs;
  section.text=runsText(runs);
  if(section.type==='text'){section.listType='';section.lineLists=lists;section.lineDepths=depths;}
  onChange();
  update();
 }
 function commit(next,newRange=range,nextLists=null,nextDepths=null){
  history[historyIndex].range={...range};
  const previousText=runsText(runs);
  runs=normalizeRuns(next);
  lists=nextLists||resizeListLines(previousText,runsText(runs),lists);
  depths=listDepths({lineDepths:nextDepths||resizeListLines(previousText,runsText(runs),depths)},lists);
  range={...newRange};
  if(JSON.stringify([history[historyIndex].runs,history[historyIndex].lists,history[historyIndex].depths])!==JSON.stringify([runs,lists,depths])){
   history=history.slice(0,historyIndex+1);
   history.push({depths:[...depths],runs:structuredClone(runs),lists:[...lists],range:{...range}});
   if(history.length>80)history.shift();
   historyIndex=history.length-1;
  }
  render();restore();persist();
 }
 function operation(property,value){remember();if(range.start===range.end){const base=pending||marksAt(runs,range.start);pending=property==='clear'?{bold:false,italic:false,underline:false,color:'',highlightColor:'',href:''}:{...base,[property]:['bold','italic','underline'].includes(property)?!base[property]:validColor(value)};update();restore();return;}pending=null;commit(formatRuns(runs,range.start,range.end,property,value));}
 function insert(text,replacement){
  remember();
  const before=runsText(runs);
  const marks=pending||marksAt(runs,range.start);
  const inserted=replacement||[{...marks,text}];
  const insertedText=runsText(inserted);
  const next=replaceRuns(runs,range.start,range.end,inserted);
  const first=before.slice(0,range.start).split('\n').length-1;
  const last=before.slice(0,range.end).split('\n').length-1;
  const lines=insertedText.split('\n').length;
  const nextLists=[...lists.slice(0,first),...Array(lines).fill(lists[first]||''),...lists.slice(last+1)];
  const nextDepths=[...depths.slice(0,first),...Array(lines).fill(depths[first]||0),...depths.slice(last+1)];
  const end=range.start+insertedText.length;
  commit(next,{start:end,end},nextLists,nextDepths);
 }
 function undo(dir){remember();const next=historyIndex+dir;if(next<0||next>=history.length)return;historyIndex=next;runs=structuredClone(history[next].runs);lists=[...history[next].lists];depths=[...history[next].depths];range={...history[next].range};pending=null;render();restore();persist();}
 function closePalette(){popover?.remove();popover=null;buttons.color.setAttribute('aria-expanded','false');buttons.highlightColor.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outsidePalette,true);}
 function outsidePalette(e){if(popover&&!popover.contains(e.target)&&!tools.contains(e.target))closePalette();}
 function showPalette(property){remember();if(popover?.dataset.property===property){closePalette();return;}closePalette();const isHighlight=property==='highlightColor',store=colorStore(),recentKey=isHighlight?'recentHighlight':'recentText',favoriteKey=isHighlight?'favoriteHighlight':'favoriteText';let chosen=validColor(currentMarks()[property])||(isHighlight?'#fff2a1':'#087787');popover=el('div','',{class:'format-popover',role:'dialog','aria-label':isHighlight?'형광펜 색상 선택':'글자 색상 선택','data-property':property});const panel=popover,title=el('strong',isHighlight?'형광펜 색상':'글자 색상'),groups=el('div'),custom=el('div','',{class:'custom-color-row'}),native=el('input','',{type:'color','aria-label':isHighlight?'형광펜 사용자 색상':'글자 사용자 색상'}),hex=el('input','',{type:'text','aria-label':'색상 코드',maxlength:'7'}),favorite=el('button','',{type:'button','aria-label':'즐겨찾는 색상에 추가 또는 제거'});native.value=chosen;hex.value=chosen;
  function choose(color){if(color){store[recentKey]=[color,...(store[recentKey]||[]).filter(c=>validColor(c)&&c!==color)].slice(0,8);saveColors(store);}operation(property,color);closePalette();}
  function favorites(){const values=(store[favoriteKey]||[]).filter(validColor);favorite.textContent=values.includes(chosen)?'★':'☆';favorite.setAttribute('aria-pressed',String(values.includes(chosen)));}
  function swatches(label,colors){const box=el('div','',{class:'color-group'});box.append(el('span',label));const grid=el('div','',{class:'color-swatches'});for(const color of colors.filter(validColor)){const b=el('button','',{type:'button',class:'color-swatch','aria-label':label+' '+color,'aria-pressed':String(currentMarks()[property]===color),title:color});b.style.backgroundColor=color;b.onmousedown=e=>e.preventDefault();b.onclick=()=>choose(color);grid.append(b);}box.append(grid);groups.append(box);}
  function drawGroups(){groups.replaceChildren();swatches(isHighlight?'추천 형광펜':'기본 색상',isHighlight?highlightPalette:textPalette);if(store[recentKey]?.length)swatches('최근 사용',store[recentKey]);if(store[favoriteKey]?.length)swatches('즐겨찾기',store[favoriteKey]);favorites();}
  native.oninput=()=>{chosen=native.value;hex.value=chosen;favorites();};hex.oninput=()=>{const color=validColor(hex.value);if(color){chosen=color;native.value=color;favorites();}};favorite.onmousedown=e=>e.preventDefault();favorite.onclick=()=>{const color=validColor(hex.value);if(!color)return;chosen=color;const values=(store[favoriteKey]||[]).filter(validColor);store[favoriteKey]=values.includes(color)?values.filter(x=>x!==color):[color,...values].slice(0,12);saveColors(store);drawGroups();};const apply=el('button','적용',{type:'button'});apply.onclick=()=>{const color=validColor(hex.value);if(!color){notify('#087787처럼 6자리 색상 코드를 입력해 주세요.');return;}choose(color);};const none=el('button',isHighlight?'형광펜 없음':'기본 글자색',{type:'button'});none.onmousedown=e=>e.preventDefault();none.onclick=()=>choose('');const close=el('button','닫기',{type:'button'});close.onclick=closePalette;custom.append(native,hex,favorite,apply);panel.append(title,groups,custom,none,close);wrap.append(panel);drawGroups();buttons[property].setAttribute('aria-expanded','true');document.addEventListener('pointerdown',outsidePalette,true);}
 function editLink(){
  remember();
  if(range.start===range.end){notify('링크를 넣을 텍스트를 먼저 선택해 주세요.');return;}
  const selected=sliceRuns(runs,range.start,range.end);
  const previous=selected[0]?.href||'';
  const entered=window.prompt('링크 주소 (https) · 비우면 링크 제거',previous);
  if(entered===null){restore();return;}
  const href=httpsLink(entered.trim());
  if(entered.trim()&&!href){notify('https://로 시작하는 링크를 입력해 주세요.');restore();return;}
  pending=null;
  commit(replaceRuns(runs,range.start,range.end,selected.map(run=>({...run,href}))));
 }
 const toolGroups={};
 function toolGroup(key){
  const group=['bold','italic','underline'].includes(key)?'강조':key.startsWith('align-')?'정렬':key.startsWith('list-')?'목록':['undo','redo'].includes(key)?'편집 기록':'색상 및 링크';
  if(!toolGroups[group]){
   toolGroups[group]=el('div','',{class:'format-group',role:'group','aria-label':group});
   tools.append(toolGroups[group]);
  }
  return toolGroups[group];
 }
 function tool(glyph,name,key,action){const b=el('button',glyph,{type:'button',title:name,'aria-label':name,'aria-pressed':'false'});b.onmousedown=e=>e.preventDefault();b.onclick=action;b.dataset.tool=key;toolGroup(key).append(b);buttons[key]=b;return b;}
 tool('B','굵게','bold',()=>operation('bold'));tool('I','기울임','italic',()=>operation('italic'));tool('U','밑줄','underline',()=>operation('underline')).classList.add('underline-tool');tool('','하이퍼링크','link',editLink).append(linkIcon('link'));for(const [glyph,name,key]of [['A','글자 색상','color'],['▰','형광펜 색상','highlightColor']]){const b=tool(glyph,name,key,()=>showPalette(key));b.classList.add('color-tool');b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');}tool('Tx','모든 서식 지우기','clear',()=>operation('clear'));tool('↶','실행 취소','undo',()=>undo(-1));tool('↷','다시 실행','redo',()=>undo(1));
 const alignmentButtons={};
 for(const [value,label] of [['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬']]){
  const button=tool('',label,'align-'+value,()=>{
   section.align=value;
   editor.classList.remove('text-align-left','text-align-center','text-align-right','text-align-justify');
   editor.classList.add('text-align-'+value);
   for(const [key,control] of Object.entries(alignmentButtons))control.setAttribute('aria-pressed',String(key===value));
   onChange();
   restore();
  });
  const icon=el('span','',{class:'align-icon align-'+value,'aria-hidden':'true'});
  for(let line=0;line<4;line++)icon.append(el('span'));
  button.append(icon);
  alignmentButtons[value]=button;
  button.setAttribute('aria-pressed',String((section.align||'left')===value));
 }
 if(section.type==='text'){
  for(const [mode,label,icon] of [['bullet','글머리 기호','list'],['number','번호 목록','listOrdered'],['checklist','체크리스트','squareCheck']]){
   tool('',label,'list-'+mode,()=>{
    remember();
    const [first,last]=selectedLines(runsText(runs),range.start,range.end);
    const remove=lists.slice(first,last+1).every(value=>value===mode);
    const next=lists.map((value,index)=>index>=first&&index<=last?(remove?'':mode):value);
    commit(runs,range,next);
   }).append(linkIcon(icon));
  }
 }
 function finishComposition(){
  clearTimeout(compositionTimer);
  compositionFinishing=false;
  syncDOM();
 }
 editor.onbeforeinput=event=>{
  if(event.isComposing||composing||/composition/i.test(event.inputType||''))return;
  if(['insertParagraph','insertLineBreak'].includes(event.inputType)){
   if(!actualRange())return;
   // Return can arrive before the browser's final input event. Read the
   // committed DOM before splitting so the previous syllable survives.
   finishComposition();
   event.preventDefault();
   insert('\n');
   return;
  }
  if(compositionFinishing)return;
  if(event.inputType==='insertText'&&pending&&event.data&&/^[\x20-\x7e]+$/.test(event.data)){
   event.preventDefault();
   insert(event.data);
  }else if(event.inputType==='historyUndo'||event.inputType==='historyRedo'){
   event.preventDefault();
   undo(event.inputType==='historyUndo'?-1:1);
  }
 };
 function syncDOM(event){if(composing||compositionFinishing||event?.isComposing)return;remember();const next=readRuns(editor);if(JSON.stringify(next)!==JSON.stringify(runs)){history[historyIndex].range={...range};depths=resizeListLines(runsText(runs),runsText(next),depths).map(Number);lists=resizeListLines(runsText(runs),runsText(next),lists);runs=next;history=history.slice(0,historyIndex+1);history.push({depths:[...depths],runs:structuredClone(runs),lists:[...lists],range:{...range}});if(history.length>80)history.shift();historyIndex=history.length-1;persist();}update();}
 editor.oninput=syncDOM;
 editor.oncompositionstart=()=>{
  clearTimeout(compositionTimer);
  composing=true;
  compositionFinishing=false;
 };
 editor.oncompositionend=()=>{
  composing=false;
  compositionFinishing=true;
  clearTimeout(compositionTimer);
  // Some browsers send a final input event after compositionend.
  // Let the browser finish replacing its marked text before reading the DOM.
  compositionTimer=setTimeout(()=>{
   compositionFinishing=false;
   if(editor.isConnected)syncDOM();
  },0);
 };
 editor.onkeydown=e=>{
 if(composing||e.isComposing||e.keyCode===229||e.key==='Process')return;
 if(['Enter','Tab','Backspace'].includes(e.key)&&actualRange())finishComposition();
 else if(compositionFinishing)return;
 if(!e.isComposing&&e.keyCode!==229&&!composing&&section.type==='text'&&['Tab','Enter','Backspace'].includes(e.key)){
  remember();
  const text=runsText(runs);
  const [first,last]=selectedLines(text,range.start,range.end);
  const lines=text.split('\n');
  const collapsed=range.start===range.end;
  const atStart=range.start===0||text[range.start-1]==='\n';
  if(lists[first]){
   const next=[...lists],levels=[...depths];
   if(e.key==='Tab'&&lists.slice(first,last+1).every(Boolean)){
    const depth=depths[first]||0;
    const canIndent=first>0&&lists[first-1]&&(depths[first-1]||0)>=depth&&depths.slice(first,last+1).every(level=>level<5);
    if(e.shiftKey||canIndent){
     e.preventDefault();
     for(let i=first;i<=last;i++)levels[i]=Math.max(0,(levels[i]||0)+(e.shiftKey?-1:1));
     commit(runs,range,next,levels);
     return;
    }
   }
   if(collapsed&&((e.key==='Enter'&&!e.shiftKey&&!lines[first].trim())||(e.key==='Backspace'&&atStart))){
    e.preventDefault();
    if(levels[first]>0)levels[first]--;
    else next[first]='';
    commit(runs,range,next,levels);
    return;
   }
  }
 }
if((e.ctrlKey||e.metaKey)&&!e.altKey){const key=e.key.toLowerCase();if(key==='k'){e.preventDefault();editLink();}else if(['b','i','u'].includes(key)){e.preventDefault();operation({b:'bold',i:'italic',u:'underline'}[key]);}else if(key==='z'||key==='y'){e.preventDefault();undo(key==='y'||e.shiftKey?1:-1);}}if(e.key==='Escape')closePalette();};
 function pasteList(html){
  if(section.type!=='text'||!html||html.length>300000)return false;
  const doc=new DOMParser().parseFromString(html,'text/html');
  doc.querySelectorAll('script,style,iframe,object').forEach(node=>node.remove());
  if(!doc.body.querySelector('ul,ol'))return false;
  const rows=[];
  function visit(node,depth=0){
   if(node.nodeType===3){if(node.textContent.trim())rows.push({runs:[{text:node.textContent}],mode:'',depth:0});return;}
   if(node.nodeType!==1)return;
   if(node.matches('ul,ol')){
    const mode=node.matches('ol')?'number':'bullet';
    for(const item of [...node.children].filter(child=>child.matches('li'))){
     const body=item.cloneNode(true);
     body.querySelectorAll('ul,ol').forEach(child=>child.remove());
     const text=readRuns(body).map(run=>({...run,text:run.text.replace(/\n+/g,' ')}));
     rows.push({runs:text,mode,depth:Math.min(5,depth)});
     for(const child of item.querySelectorAll('ul,ol'))if(child.parentElement.closest('li')===item)visit(child,depth+1);
    }
   }else if(node.querySelector('ul,ol')){
    for(const child of node.childNodes)visit(child,depth);
   }else{
    const text=readRuns(node);
    if(runsText(text).trim())rows.push({runs:text.map(run=>({...run,text:run.text.replace(/\n+/g,' ')})),mode:'',depth:0});
   }
  }
  for(const node of doc.body.childNodes)visit(node);
  if(!rows.some(row=>row.mode))return false;
  remember();
  const text=runsText(runs),first=selectedLines(text,range.start,range.end)[0];
  const replacement=rows.flatMap((row,index)=>index?[{text:'\n'},...row.runs]:row.runs);
  if(replacement.length>500||runsText(replacement).length>15000)return false;
  const next=replaceRuns(runs,range.start,range.end,replacement);
  const end=range.start+runsText(replacement).length;
  const modes=resizeListLines(text,runsText(next),lists),levels=resizeListLines(text,runsText(next),depths);
  rows.forEach((row,index)=>{modes[first+index]=row.mode;levels[first+index]=row.depth;});
  commit(next,{start:end,end},modes,levels);
  return true;
 }
 editor.onpaste=e=>{e.preventDefault();const internal=e.clipboardData.getData('application/x-soo-text-runs');if(internal){try{const parsed=normalizeRuns(JSON.parse(internal));if(parsed.length<=500&&runsText(parsed).length<=15000){insert('',parsed);return;}}catch{}}if(pasteList(e.clipboardData.getData('text/html')))return;insert(e.clipboardData.getData('text/plain'));};editor.oncopy=e=>{remember();if(range.start===range.end)return;e.preventDefault();const selected=sliceRuns(runs,range.start,range.end);e.clipboardData.setData('text/plain',runsText(selected));e.clipboardData.setData('application/x-soo-text-runs',JSON.stringify(selected));};editor.addEventListener('drop',e=>e.preventDefault());
 function selectionChanged(){if(!wrap.isConnected){document.removeEventListener('selectionchange',selectionChanged);closePalette();return;}if(!composing&&!compositionFinishing&&actualRange()){remember();update();}}document.addEventListener('selectionchange',selectionChanged);render();wrap.append(tools);if(section.type==='quote'){const preview=el('div','',{class:'article-body quote-editor-preview'});preview.append(editor);wrap.append(preview);}else wrap.append(editor);update();return wrap;}
