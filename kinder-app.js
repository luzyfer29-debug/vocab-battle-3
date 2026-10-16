import {firebaseConfig} from './firebase-config.js?v=20261016-kinder-dependency-cache-bust-2';
import {BATTLES} from './questions.js?v=20261016-kinder-dependency-cache-bust-2';
import {MATH_BATTLES,MATH_EXAM_BATTLE,MATH_RATIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_CLASSWORKS,MATH_PROPORTIONAL_PRACTICE_BLOCKS,PROPORTIONAL_WORKSHEET_CARDS,PROPORTIONAL_FLASH_CARDS} from './math-questions.js?v=20261016-kinder-dependency-cache-bust-2';
import {FRACTION_MODULES} from './fractions-data.js?v=20261016-kinder-dependency-cache-bust-2';
import {WRITING_TASKS,WRITING_BATTLE} from './writing-data.js?v=20261016-room-question-sync-20261016';
import {GRAMMAR} from './grammar-data.js?v=20261016-room-question-sync-20261016';
import {READING_QUIZ} from './reading-data.js?v=20261016-room-question-sync-20261016';
let initializeApp,getAuth,signInAnonymously,onAuthStateChanged;
let getDatabase,ref,onValue,get,set,update,runTransaction,remove;
const RATIONAL_MATH_TITLES=['Rationale Zahlen · Aufgabe 1','Rationale Zahlen · Aufgabe 2','Rationale Zahlen · Aufgabe 3','Rationale Zahlen · Aufgabe 4'];
const LISTENING_QUESTIONS=[
 {q:'Welche Reihenfolge haben die Aktivitäten im Radiobeitrag?',options:['Radio-Studio → Zipline → Rafting → Skatepark → Erfrischungen → Cardiff-Schild','Zipline → Radio-Studio → Skatepark → Rafting → Cardiff-Schild → Erfrischungen','Radio-Studio → Rafting → Zipline → Erfrischungen → Skatepark → Cardiff-Schild','Cardiff-Schild → Radio-Studio → Zipline → Rafting → Skatepark → Erfrischungen'],correct:0},
 {q:'Welche Aktivität kannst du nahe Mount Snowdon ausprobieren?',options:['Eine Zipline','Skifahren','Reiten','Klettern in einer Halle'],correct:0},
 {q:'Welche Wassersportarten werden genannt?',options:['Segeln und Tauchen','Kanufahren und Rafting','Schwimmen und Surfen','Wasserski und Rudern'],correct:1},
 {q:'Was kannst du in der Stadt mit deinem Fahrrad machen?',options:['Eine geführte Tour fahren','Auf einer Rennstrecke fahren','Durch die Innenstadt fahren','Ein Fahrradrennen ansehen'],correct:2},
 {q:'Wo kannst du Skateboard fahren?',options:['In einem Skatepark','Im Radio-Studio','Auf einer Zipline','Auf dem Wasser'],correct:0},
 {q:'Welche weiteren Sportarten werden als Beispiele genannt?',options:['Tennis und Hockey','Tischtennis, Football und Netball','Basketball und Golf','Badminton und Rugby'],correct:1},
 {q:'The radio programme has the best tips for the weekend.',options:['Richtig','Falsch'],correct:0},
 {q:'Maisie Reedman is part of the radio team.',options:['Richtig','Falsch'],correct:1},
 {q:'The zip line in Cardiff is the longest in Europe.',options:['Richtig','Falsch'],correct:1},
 {q:'They will close some roads in the city centre.',options:['Richtig','Falsch'],correct:0},
 {q:'You need a helmet for some sports.',options:['Richtig','Falsch'],correct:1},
 {q:'Cardiff is the capital city of _____.',options:['England','Scotland','Wales','Northern Ireland'],correct:2},
 {q:'At the activity weekend you can try lots of different _____.',options:['sports and activities','school subjects','radio shows','shops'],correct:0},
 {q:'You can try out water sports like _____.',options:['canoeing and rafting','skiing and skating','tennis and football','cycling and running'],correct:0},
 {q:'Who will be there to help and answer questions?',options:['Teachers','Volunteers','Radio presenters','Police officers'],correct:1},
 {q:'What do the organisers hope?',options:['That it will rain','That lots of guests will come','That the roads stay open','That the event ends early'],correct:1},
 {q:'Why is Cardiff a good place to visit this weekend?',options:['You can try different activities all over the city.','There is a big football match.','All museums are free.','The shops are open all night.'],correct:0},
 {q:'What is special about the zip line near Mount Snowdon?',options:['It is the longest zip line in Europe.','It is inside a shopping centre.','It is only for children.','It goes over the sea.'],correct:0},
 {q:'Why is it safe to ride your bike or skateboard in the city centre?',options:['Some roads will be closed to cars.','There are no other people there.','You have to wear a uniform.','The roads are indoors.'],correct:0},
 {q:'What can you do if you do not want to do sports?',options:['Watch and have a drink or a snack.','Go home immediately.','Join the radio team.','Help close the roads.'],correct:0},
 {q:'How can you find out where each activity is?',options:['Follow the signs.','Ask at the train station.','Read a newspaper tomorrow.','Use a map in the radio studio.'],correct:0}
];
const app=document.querySelector('#app'),status=document.querySelector('#status');
const names=['Luca','Semir','Talea','Nele'];
const VOCAB_QUESTION_MS=8000,OTHER_QUESTION_MS=15000,REVEAL_MS=3000;
const ADMIN_UID='M41x9WNoHAfqpSmyrztAgf2IZYC3';
let resetUnsubscribe=null,resetState={},resetReady=false;
let db,uid='',code='',role='',slot='',room=null,unsubscribe=null,solo=null,joinExpectedRoomType='';
let clock=null,busy=false,previousStageKey='',lastClockText='';
let listeningRun=null,listeningSyncWarned=false,writingIndex=0,writingModelVisible=false,writingSyncTimer=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mathText=s=>esc(s).replace(/(-?\d+)\s*\/\s*(\d+)/g,(_,n,d)=>`<span style="display:inline-flex;vertical-align:middle;flex-direction:column;align-items:center;line-height:1.05;margin:0 .12em"><span>${n}</span><span style="border-top:1.5px solid currentColor;padding:1px 2px 0">${d}</span></span>`);
const btn=(t,fn,cl='')=>`<button ${cl?`class="${cl}"`:''} data-action="${fn}">${t}</button>`;
const card=s=>`<section class="card">${s}</section>`;
const msg=(s,bad=false)=>status.innerHTML=`<p class="${bad?'error':'good'}">${esc(s)}</p>`;
// Erstversuche bleiben pro Kind und Aufgabe lokal gespeichert.
// Die Schluessel sind kompatibel mit der zuvor verwendeten Lernverlauf-Version.
function firstKey(type,id){return `vb2first_${soloName}_${type}_${id}`;}
function firstRead(type,id){try{return JSON.parse(localStorage.getItem(firstKey(type,id))||'null');}catch{return null;}}
function firstCapture(type,id,answers,values,title){
 if(!soloName||firstRead(type,id))return;
 const inputs=values.map(v=>String(v||''));
 const errors=answers?inputs.map((answer,i)=>({position:i+1,answer,correct:(answers[i]||[]).join(' / '),ok:(answers[i]||[]).some(a=>grammarNormalize(a)===grammarNormalize(answer))})).filter(x=>!x.ok):[];
 const record={title,total:inputs.length,correct:answers?inputs.length-errors.length:null,errors,inputs,checkedAt:Date.now(),selfCheck:!answers};
 try{localStorage.setItem(firstKey(type,id),JSON.stringify(record));}catch{}
}
function firstSummary(type,id,values,answers){
 const first=firstRead(type,id);if(!first)return '';
 const current=answers?answers.filter((a,i)=>a.some(x=>grammarNormalize(x)===grammarNormalize(values[i]))).length:null;
 const original=first.selfCheck?'Freie Sätze – Selbstkontrolle':`${Number(first.correct)||0} von ${first.total} richtig`;
 const now=answers?`${current} von ${answers.length} richtig`:'Freie Sätze – Selbstkontrolle';
 const errors=first.selfCheck?'<p>Deine ersten Sätze sind gespeichert und können mit den Musterlösungen verglichen werden.</p>':(first.errors||[]).length?`<details><summary>Fehler des ersten Versuchs (${first.errors.length})</summary>${first.errors.map(x=>`<p><strong>Nr. ${Number(x.position)}:</strong> ${esc(x.answer||'(leer)')} → ${esc(x.correct||'')}</p>`).join('')}</details>`:'<p>Beim ersten Versuch alles richtig! 🎉</p>';
 return `<div style="margin:16px 0;padding:14px;border:1px solid #8c86bd;border-radius:12px"><h3>📋 Dein Lernverlauf</h3><p><strong>Erster Versuch:</strong> ${original}</p><p><strong>Aktueller Stand:</strong> ${now}</p>${errors}<p class="muted">Der erste Versuch bleibt auf diesem Handy gespeichert.</p></div>`;
}

// Grammar: Original order of normal exercises; no Diff corner.
// A blank item has prefix/suffix, accepted answers, and optional hint.
// Open sentences are self-checked against examples, not automatically marked wrong.

let grammarStation=null,grammarTask=null;
function grammarKey(st,task){return `vb2grammar_${soloName}_station${st+1}_task${task+1}`;}
function grammarRead(st,task){try{const v=JSON.parse(localStorage.getItem(grammarKey(st,task))||'[]');return Array.isArray(v)?v:[];}catch{return [];}}
function grammarWrite(st,task,v){localStorage.setItem(grammarKey(st,task),JSON.stringify(v));}
function grammarResultKey(st,task){return `vb2grammar_result_${soloName}_station${st+1}_task${task+1}`;}
function grammarReadResult(st,task){try{return JSON.parse(localStorage.getItem(grammarResultKey(st,task))||'null');}catch{return null;}}
function grammarStationProgress(st){const total=GRAMMAR[st].tasks.length,done=GRAMMAR[st].tasks.filter((_,i)=>grammarReadResult(st,i)?.finished).length;return {done,total};}
async function saveGrammarSeriesResult(st){
 const tasks=GRAMMAR[st].tasks.map((_,i)=>grammarReadResult(st,i));
 if(tasks.some(result=>!result?.finished))return {complete:false,done:tasks.filter(Boolean).length,total:tasks.length};
 const maxScore=GRAMMAR[st].tasks.reduce((sum,task)=>sum+(task.items?.length||0),0),correct=tasks.reduce((sum,result)=>sum+(Number(result.score)||0),0),now=Date.now(),activity=`grammar${st+1}`;
 if(!db||!uid||!soloName)throw new Error('Keine Online-Verbindung zur Ergebnisspeicherung.');
 const result={name:soloName,activity,done:maxScore,total:maxScore,completedTasks:tasks.length,taskCount:tasks.length,correct,score:correct,maxScore,finished:true,updatedAt:now,timestamp:now,tasks:tasks.map((task,i)=>({task:i+1,score:Number(task.score)||0,maxScore:Number(task.maxScore)||0,attempted:Number(task.attempted)||0,updatedAt:Number(task.updatedAt)||now}))};
 await set(ref(db,`englishSeriesResults/${uid}/${soloName}/${activity}`),result);
 return {complete:true,result};
}
function grammarNormalize(v){return String(v||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');}
function grammarMenu(){grammarCollect();if(!soloName){soloChooseName();return;}grammarStation=null;grammarTask=null;app.innerHTML=card(`<h2>📘 Grammatik · ${esc(soloName)}</h2><p>Wähle Station 1 oder 2. Die Aufgaben stehen in der Reihenfolge des Arbeitsblatts. Ohne Diff corner.</p><div class="buttons">${btn('Station 1 · Aufgaben 1–4','grammarStation0')}${btn('Station 2 · Aufgaben 1–7','grammarStation1')}</div>`)+card(btn('Zur Battle-Auswahl','soloHome','alt'));}
function grammarStationMenu(st){grammarCollect();grammarStation=st;grammarTask=null;const s=GRAMMAR[st],progress=grammarStationProgress(st);app.innerHTML=card(`<h2>📘 ${esc(s.title)}</h2><p>Tippe die englischen Antworten selbst ein. Freie Sätze werden anhand von Beispielen selbst kontrolliert.</p><p class="muted">Geprüfte Aufgaben: ${progress.done} von ${progress.total}. Die Gesamtwertung wird automatisch übernommen, sobald alle Aufgaben geprüft sind. Freie Schreibaufgaben zählen als bearbeitet; gewertet werden die automatisch prüfbaren Antworten.</p>${s.tasks.map((t,i)=>{const done=!!grammarReadResult(st,i)?.finished;return `<div class="player"><strong>${esc(t.title)}</strong><div class="buttons">${btn(done?'✅ Aufgabe geprüft · erneut öffnen':'Aufgabe öffnen',`grammarTask${i}`)}</div></div>`;}).join('')}`)+card(btn('Zur Grammatik-Auswahl','grammarMenu','alt'));}
function grammarCollect(){if(grammarStation===null||grammarTask===null)return;const fields=Array.from(document.querySelectorAll('[data-grammar]'));if(!fields.length)return;grammarWrite(grammarStation,grammarTask,fields.map(el=>el.value));}
function grammarRender(st,task,checked=false,reveal=false){
 if(!soloName){soloChooseName();return;}grammarStation=st;grammarTask=task;
 if(!checked&&!reveal)grammarWrite(st,task,[]);
  const t=GRAMMAR[st].tasks[task],values=grammarRead(st,task),isOpen=!!t.open;
 const inputStyle='box-sizing:border-box;display:inline-block;vertical-align:middle;max-width:190px;width:43vw;min-width:100px;min-height:38px;margin:3px 4px;padding:6px 8px;border-radius:8px;background:#fff;color:#17152b;font-size:16px;line-height:1.3';
 let content='';
 if(t.items){
  content=t.items.map(([before,after,answers],i)=>{
   const val=String(values[i]||''),ok=answers.some(a=>grammarNormalize(a)===grammarNormalize(val));
   return `<div style="margin:12px 0;line-height:1.85;overflow-wrap:break-word"><strong>${i+1}.</strong> ${esc(before)}<input data-grammar="${i}" aria-label="Aufgabe ${i+1}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(val)}" style="${inputStyle};border:2px solid ${checked?(ok?'#6ee7a8':'#ff8d8d'):'#8c86bd'}">${esc(after)}${reveal&&!ok?`<div style="color:#ffb0b0;font-weight:600">Lösung: ${esc(answers.join(' / '))}</div>`:''}</div>`;
  }).join('');
 }else{
  content=t.open.map((example,i)=>`<div style="margin:14px 0"><label style="display:block;margin-bottom:5px"><strong>${i+1}.</strong> ${esc(t.prompts?.[i]||'Schreibe einen vollständigen englischen Satz.')}</label><textarea data-grammar="${i}" rows="2" spellcheck="false" style="box-sizing:border-box;width:100%;max-width:100%;padding:9px;border-radius:8px;font-size:16px;background:white;color:#17152b">${esc(values[i]||'')}</textarea>${reveal?`<p class="muted">Musterlösung: <strong>${esc(example)}</strong></p>`:''}</div>`).join('');
 }
 const total=t.items?.length||t.open.length,correct=t.items?t.items.filter((x,i)=>x[2].some(a=>grammarNormalize(a)===grammarNormalize(values[i]))).length:0;
 app.innerHTML=card(`<h2>📘 ${esc(GRAMMAR[st].title)}</h2><h3>${esc(t.title)}</h3>${t.intro?`<p>${esc(t.intro)}</p>`:''}${t.example?`<p class="muted">Example: ${esc(t.example)}</p>`:''}<p class="muted">${isOpen?'Schreibe selbst. Über „💡 Lösung anzeigen“ kannst du die Musterlösungen ansehen; andere richtige Sätze sind möglich.':'Trage die richtige englische Form ein.'} Beim erneuten Öffnen beginnt die Übung mit leeren Feldern.</p>${checked?`<p class="good"><strong>${isOpen?'Deine Sätze sind gespeichert. Vergleiche sie bei Bedarf mit den Musterlösungen.':`${correct} von ${total} richtig. Verbessere die roten Felder selbst.`}</strong></p>`:''}${content}${firstSummary('grammar',st+'_'+task,values,t.items?.map(x=>x[2])||null)}<div class="buttons">${btn(isOpen?'✅ Eingaben speichern':'✅ Antworten prüfen','grammarCheck')}${btn('💡 Lösung anzeigen','grammarReveal','alt')}${btn('🔄 Eingaben leeren','grammarClear','alt')}</div>`)+card(btn('Zur Aufgabenübersicht','grammarBack','alt'));
}
function grammarCheck(){if(grammarStation===null||grammarTask===null)return;grammarCollect();const st=grammarStation,taskIndex=grammarTask,t=GRAMMAR[st].tasks[taskIndex],exercise=`english_grammar_${st+1}_task${taskIndex+1}`,values=grammarRead(st,taskIndex),correct=t.items?t.items.filter((item,index)=>item[2].some(a=>grammarNormalize(a)===grammarNormalize(values[index]))).length:0,attempted=t.items?t.items.length:values.filter(value=>String(value||'').trim()).length,now=Date.now();if(t.items)t.items.forEach((item,index)=>{const topic=GRAMMAR[st].title+' · '+t.title,prompt=`${item[0]} _____ ${item[1]}`;void recordLearningError(soloName,'english',exercise,index,topic,{prompt,accepted:item[2]},item[2].some(a=>grammarNormalize(a)===grammarNormalize(values[index])));});localStorage.setItem(grammarResultKey(st,taskIndex),JSON.stringify({score:correct,maxScore:t.items?.length||0,attempted,finished:true,updatedAt:now}));firstCapture('grammar',st+'_'+taskIndex,t.items?.map(x=>x[2])||null,values,GRAMMAR[st].title+' · '+t.title);grammarRender(st,taskIndex,true);void saveGrammarSeriesResult(st).then(result=>{if(result.complete)msg(`Grammatik ${st+1}: Ergebnis gespeichert (${result.result.correct} von ${result.result.maxScore} Punkten).`);else msg(`Grammatik ${st+1}: Aufgabe geprüft (${result.done} von ${result.total}). Die Gesamtwertung folgt nach allen Aufgaben.`);}).catch(error=>msg(`Grammatik-Ergebnis noch nicht online gespeichert: ${error.message}`,true));}
function grammarReveal(){if(grammarStation===null||grammarTask===null)return;grammarCollect();grammarRender(grammarStation,grammarTask,true,true);}
function grammarClear(){if(grammarStation===null||grammarTask===null)return;grammarWrite(grammarStation,grammarTask,[]);grammarRender(grammarStation,grammarTask);}

const key='vb2solo';
const SOLO_NAMES=['Luca','Semir','Talea','Nele'];
let activitySyncWarned=false;
function activityPeriodKeys(timestamp=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp)).map(x=>[x.type,x.value]));
 const year=Number(parts.year),month=Number(parts.month),day=Number(parts.day),date=new Date(Date.UTC(year,month-1,day));
 const isoDay=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()+4-isoDay);
 const weekYear=date.getUTCFullYear(),yearStart=new Date(Date.UTC(weekYear,0,1)),week=Math.ceil((((date-yearStart)/86400000)+1)/7);
 return {dayKey:`${parts.year}-${parts.month}-${parts.day}`,weekKey:`${weekYear}-W${String(week).padStart(2,'0')}`};
}
async function recordLearningActivity(name,exercise,increment=true){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!name||!exercise)return;
 const now=Date.now(),{dayKey,weekKey}=activityPeriodKeys(now),path=`learningActivity/${uid}/${name}/${exercise}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{};if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}if(increment){value.dayCount=(Number(value.dayCount)||0)+1;value.weekCount=(Number(value.weekCount)||0)+1;}value.lastAt=now;return value;});activitySyncWarned=false;}catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg('Tages- und Wochenzählung wartet auf die Firebase-Regeln. Lernfortschritt bleibt davon unberührt.',true);}}
}
function touchLearningActivity(name,exercise){void recordLearningActivity(name,exercise,false);}
function mathActivityId(b){if(b<3)return `math_rational_battle${b+1}`;if(b===3)return 'math_rational_cards';if(b===4)return 'math_exam';if(b===5)return 'math_rational_exam';if(b===6)return 'math_proportional_practice';if(b>=7&&b<=9)return `math_proportional_exam${b-6}`;if(b>=10&&b<=18)return `math_proportional_practice_${MATH_PROPORTIONAL_PRACTICE_BLOCKS[b-10]?.id||''}`;return '';}
let errorEvalSubject='',errorEvalPeriod='',errorEvalTopics=[],errorEvalQueue=[],errorEvalCurrent=null;
async function recordLearningError(name,subject,exercise,index,topic,q,correct){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!exercise)return false;
 const now=Date.now(),{dayKey,weekKey}=activityPeriodKeys(now),path=`learningActivity/${uid}/${name}/${exercise}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{};if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}value.lastAt=now;const errors={...(value.errorItems||{})},key=String(index),old=errors[key];if(correct){if(!old)return current;errors[key]={...old,resolved:true,resolvedAt:now};}else{errors[key]={subject,topic,prompt:String(q?.prompt||q?.q||''),options:Array.isArray(q?.options)?q.options.map(String):null,correctIndex:Number.isInteger(q?.correct)?q.correct:null,accepted:Array.isArray(q?.accepted)?q.accepted.map(String):null,explanation:String(q?.explanation||q?.explain||''),answer:String(q?.answer||''),count:(Number(old?.count)||0)+1,lastWrongAt:now,dayKey,weekKey,resolved:false,resolvedAt:null};}value.errorItems=errors;return value;});return true;}catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg('Fehler konnten gerade nicht online gespeichert werden. Bitte Verbindung prüfen.',true);}return false;}
}
function childLearningExercises(subject){if(subject==='math')return ['math_rational_battle1','math_rational_battle2','math_rational_battle3','math_rational_cards','math_exam','math_rational_exam','math_proportional_practice','math_proportional_exam1','math_proportional_exam2','math_proportional_exam3',...MATH_PROPORTIONAL_PRACTICE_BLOCKS.map(b=>`math_proportional_practice_${b.id}`),'math_proportional_worksheet','math_proportional_flashcards',...FRACTION_MODULES.map(m=>`math_fraction_${m.id}`)];return ['english_vocab_battle1','english_vocab_battle2','english_vocab_battle3','english_listening','english_reading',...GRAMMAR.flatMap((station,s)=>station.tasks.map((_,i)=>`english_grammar_${s+1}_task${i+1}`)),...WRITING_TASKS.map((_,i)=>`english_writing_task${i+1}`)];}
async function loadChildLearningActivity(name,subject){const ids=childLearningExercises(subject);const rows=await Promise.all(ids.map(async id=>[id,(await get(ref(db,`learningActivity/${uid}/${name}/${id}`))).val()]));return Object.fromEntries(rows.filter(([,value])=>value));}
async function importLegacyLearningErrors(subject,name){
 if(!db||!uid||!SOLO_NAMES.includes(name))return;
 const rows=[];
 if(subject==='math'){
  for(let b=0;b<=18;b++){const state=mathLoad(name,b);if(!state?.mistakes)continue;let questions=b<3?MATH_BATTLES[b]:b===3?MATH_CARDS.map(([prompt,answer])=>({prompt,accepted:[answer]})):mathExamData(b)?.questions;if(!questions)continue;const exercise=mathActivityId(b),topic=mathExamData(b)?.title||RATIONAL_MATH_TITLES[b]||'Rationale Zahlen · Merkkarten';for(const [index,count] of Object.entries(state.mistakes)){if(Number(count)<=0||!questions[Number(index)])continue;const raw=questions[Number(index)],q=raw.options?raw:{prompt:raw.prompt||raw.q,accepted:raw.accepted||[],explanation:raw.explanation||raw.explain||''};rows.push({exercise,index,topic,q});}}
  for(const module of FRACTION_MODULES){const state=fractionLoad(name,module.id);for(const [index,count] of Object.entries(state?.mistakes||{})){if(Number(count)>0&&module.questions[Number(index)])rows.push({exercise:`math_fraction_${module.id}`,index,topic:`Bruchrechnung · ${module.title}`,q:module.questions[Number(index)]});}}
 }else{
  for(let b=0;b<3;b++){const state=soloSaved(b);for(const [index,count] of Object.entries(state?.mistakes||{})){if(Number(count)>0&&BATTLES[b]?.[Number(index)])rows.push({exercise:`english_vocab_battle${b+1}`,index,topic:`Vokabel-Battle ${b+1}`,q:BATTLES[b][Number(index)]});}}
  const listening=listenLoad();for(const [index,count] of Object.entries(listening?.mistakes||{})){if(Number(count)>0&&LISTENING_QUESTIONS[Number(index)])rows.push({exercise:'english_listening',index,topic:'Listening · Activity weekend in Cardiff',q:LISTENING_QUESTIONS[Number(index)]});}
  for(let station=0;station<2;station++)for(let task=0;task<GRAMMAR[station].tasks.length;task++){const record=firstRead('grammar',station+'_'+task);for(const error of record?.errors||[]){const index=Number(error.position)-1,answers=String(error.correct||'').split(' / ').filter(Boolean),exercise=`english_grammar_${station+1}_task${task+1}`,question=GRAMMAR[station].tasks[task].items?.[index],prompt=question?`${question[0]} _____ ${question[1]}`:`${GRAMMAR[station].tasks[task].title} · Aufgabe ${index+1}`;if(answers.length)rows.push({exercise,index,topic:`${GRAMMAR[station].title} · ${GRAMMAR[station].tasks[task].title}`,q:{prompt,accepted:answers}});}}
 }
 if(!rows.length)return;
 const existing=await loadChildLearningActivity(name,subject);
 await Promise.all(rows.filter(row=>!existing[row.exercise]?.errorItems?.[String(row.index)]).map(row=>recordLearningError(name,subject,row.exercise,row.index,row.topic,row.q,false)));
}
function errorPeriodChoice(subject){errorEvalSubject=subject;errorEvalPeriod='';errorEvalTopics=[];errorEvalQueue=[];errorEvalCurrent=null;const names=SOLO_NAMES.map((n,i)=>btn(esc(n),`errorName${subject}_${i}`));app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'}-Auswertung</h2><p>Wähle dein Kind.</p><div class="name-actions">${names.join('')}</div>`)+card(btn('Zurück','home','alt'));}
function learningActivityLabel(exercise){
 const fixed={english_vocab_battle1:'Vokabel-Battle 1',english_vocab_battle2:'Vokabel-Battle 2',english_vocab_battle3:'Vokabel-Battle 3',english_listening:'Listening',english_reading:'Reading',math_rational_cards:'Rationale Zahlen · Merkkarten',math_proportional_practice:'Proportional / Antiproportional · Übung'};
 if(fixed[exercise])return fixed[exercise];
 let match=String(exercise).match(/^english_vocab_work_page(\\d+)$/);if(match)return 'Vokabelarbeit · Seite '+match[1];
 match=String(exercise).match(/^english_grammar_(\\d+)_task(\\d+)$/);if(match){const task=GRAMMAR[Number(match[1])-1]?.tasks?.[Number(match[2])-1]?.title;return 'Grammatik · Station '+match[1]+(task?' · '+task:'');}
 match=String(exercise).match(/^english_writing_task(\\d+)$/);if(match)return 'Writing · Aufgabe '+match[1];
 match=String(exercise).match(/^math_rational_battle(\\d+)$/);if(match)return RATIONAL_MATH_TITLES[Number(match[1])-1]||'Rationale Zahlen · Battle '+match[1];
 match=String(exercise).match(/^math_fraction_(.+)$/);if(match){const module=FRACTION_MODULES.find(item=>item.id===match[1]);return module?'Bruchrechnung · '+module.title:'Bruchrechnung';}
 match=String(exercise).match(/^math_proportional_practice_(.+)$/);if(match){const block=MATH_PROPORTIONAL_PRACTICE_BLOCKS.find(item=>item.id===match[1]);return block?'Proportional / Antiproportional · '+block.title:'Proportional / Antiproportional';}
 return String(exercise).replace(/^(english|math)_/,'').replace(/_/g,' ');
}
async function errorEvaluation(subject,period){
 const name=subject==='math'?mathName:soloName;if(!name||!SOLO_NAMES.includes(name)){errorPeriodChoice(subject);return;}if(!db||!uid){msg('Verbindung wird hergestellt. Bitte gleich noch einmal öffnen.',true);return;}
 if(!period){errorEvalSubject=subject;errorEvalPeriod='';app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'}-Auswertung · ${esc(name)}</h2><p>Welchen Zeitraum möchtest du ansehen?</p><div class="name-actions">${btn('📅 Tägliche Auswertung','errorPeriod_day')}${btn('🗓️ Wöchentliche Auswertung','errorPeriod_week')}</div>`)+card(btn('Zurück','home','alt'));return;}
 errorEvalSubject=subject;errorEvalPeriod=period;app.innerHTML=card('<h2>Auswertung wird geladen …</h2>');
 try{await importLegacyLearningErrors(subject,name);const data=await loadChildLearningActivity(name,subject),keys=activityPeriodKeys(),topics=new Map();for(const [exercise,entry] of Object.entries(data)){if(exercise==='english_vocab_work_battle1'||exercise==='english_vocab_work_battle2')continue;for(const [index,item] of Object.entries(entry?.errorItems||{})){if(item?.subject!==subject)continue;const inPeriod=period==='day'?item.dayKey===keys.dayKey:item.weekKey===keys.weekKey;if(!inPeriod&&!item.resolved){/* offene Fehler bleiben sichtbar, bis sie richtig gelöst sind */}else if(!inPeriod)continue;const topic=String(item.topic||exercise);if(!topics.has(topic))topics.set(topic,[]);topics.get(topic).push({exercise,index,item});}}
  errorEvalTopics=[...topics.entries()].map(([title,items])=>({title,items:items.sort((a,b)=>Number(a.item.lastWrongAt||0)-Number(b.item.lastWrongAt||0))}));const openCount=errorEvalTopics.reduce((n,t)=>n+t.items.filter(x=>!x.item.resolved).length,0),periodLabel=period==='day'?'Heute':'Diese Woche';
  const activityRows=period==='day'?Object.entries(data).filter(([exercise,entry])=>exercise!=='english_vocab_work_battle1'&&exercise!=='english_vocab_work_battle2'&&entry?.dayKey===keys.dayKey&&Number(entry.dayCount)>0).sort((a,b)=>Number(b[1].lastAt||0)-Number(a[1].lastAt||0)):[];
  const activitySummary=period==='day'&&activityRows.length?`<div class="player"><h3>Heute geübt</h3>${activityRows.map(([exercise,entry])=>`<p>📘 ${esc(learningActivityLabel(exercise))} · ${Number(entry.dayCount)}× gestartet oder fortgesetzt</p>`).join('')}</div>`:'';
  const blocks=errorEvalTopics.length?errorEvalTopics.map((t,i)=>{const open=t.items.filter(x=>!x.item.resolved).length,done=t.items.length-open;return `<div class="player"><h3>${esc(t.title)}</h3><p>${open} offen · ${done} richtig bearbeitet</p>${open?btn(`Fehler üben (${open})`,`errorTopic${i}`):'<p class="good">✅ Alle Fehler richtig bearbeitet</p>'}</div>`;}).join(''):'<p class="muted">Keine Fehler für diesen Zeitraum. Richtig beantwortete Aufgaben erscheinen hier nicht als Fehler.</p>';
  app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'} · ${periodLabel} · ${esc(name)}</h2><p>Nach Themen gebündelt. Offene Fehler bleiben hier, bis du sie richtig löst.</p>${activitySummary}<p><strong>${openCount} noch offen</strong></p>${blocks}<div class="name-actions">${btn('📅 Tägliche Auswertung','errorPeriod_day','alt')}${btn('🗓️ Wöchentliche Auswertung','errorPeriod_week','alt')}</div>`)+card(btn('Zurück zur Übersicht','errorSubjectHome','alt'));
 }catch(e){msg('Auswertung konnte nicht geladen werden: '+e.message,true);}
}
function errorPracticeStart(topicIndex){const topic=errorEvalTopics[topicIndex];if(!topic)return;errorEvalQueue=topic.items.filter(x=>!x.item.resolved);errorEvalCurrent={topicIndex,position:0};errorPracticeShow();}
function errorPracticeShow(){if(!errorEvalCurrent)return;const group=errorEvalTopics[errorEvalCurrent.topicIndex];errorEvalQueue=group.items.filter(x=>!x.item.resolved);if(!errorEvalQueue.length){app.innerHTML=card(`<h2>🏆 ${esc(group.title)}</h2><p class="good">Alle Fehler wurden richtig gelöst.</p>${btn('Zur Auswertung','errorRefresh')}`);return;}const entry=errorEvalQueue[0],item=entry.item;app.innerHTML=card(`<p class="muted">${esc(group.title)} · ${errorEvalQueue.length} noch offen</p><h2>${errorEvalSubject==='math'?mathText(item.prompt||'Aufgabe'):esc(item.prompt||'Aufgabe')}</h2>${item.options?`<div class="answers">${item.options.map((o,i)=>`<button data-error-answer="${i}">${errorEvalSubject==='math'?mathText(o):esc(o)}</button>`).join('')}</div>`:`<label>Deine Antwort<input data-error-text autocomplete="off" autocapitalize="none"></label>${btn('Antwort prüfen','errorTextCheck')}`}<div id="error-feedback"></div>`)+card(btn('Abbrechen · Zur Auswertung','errorRefresh','alt'));}
async function errorPracticeAnswer(value){if(!errorEvalCurrent||!errorEvalQueue.length)return;const entry=errorEvalQueue[0],item=entry.item,typed=String(value??'').trim(),correct=item.options?Number(value)===Number(item.correctIndex):(item.accepted||[]).some(x=>grammarNormalize(x)===grammarNormalize(typed));if(correct){const saved=await recordLearningError(subjectNameForErrors(),errorEvalSubject,entry.exercise,entry.index,item.topic,item,true);if(!saved){const fb=document.querySelector('#error-feedback');if(fb)fb.innerHTML='<p class="error">Der Lernstand konnte nicht gespeichert werden. Bitte Verbindung prüfen und erneut versuchen.</p>';return;}item.resolved=true;errorEvalQueue.shift();const feedback=document.querySelector('#error-feedback');if(feedback){feedback.innerHTML='<p class="good"><strong>✅ Richtig! Dieser Fehler ist erledigt.</strong></p>'+btn(errorEvalQueue.length?'Weiter ➜':'Zur Themenübersicht','errorPracticeNext');}else errorPracticeShow();return;}await recordLearningError(subjectNameForErrors(),errorEvalSubject,entry.exercise,entry.index,item.topic,item,false);const fb=document.querySelector('#error-feedback');if(fb)fb.innerHTML=`<p class="error"><strong>❌ Noch nicht richtig.</strong> ${item.options?`Richtige Antwort: ${errorEvalSubject==='math'?mathText(item.options[item.correctIndex]??''):esc(item.options[item.correctIndex]??'')}`:`Richtige Lösung: ${esc((item.accepted||[]).join(' / '))}`}</p>${errorEvalSubject==='math'&&item.explanation?`<p><strong>Rechenweg:</strong> ${mathText(item.explanation)}</p>`:''}<p>Versuche dieselbe Aufgabe noch einmal. Sie bleibt offen, bis sie richtig ist.</p>`;}
function subjectNameForErrors(){return errorEvalSubject==='math'?mathName:soloName;}
function errorPracticeNext(){if(errorEvalCurrent&&errorEvalQueue.length){errorPracticeShow();return;}errorEvaluation(errorEvalSubject,errorEvalPeriod);}
function errorEvaluationAction(action){if(action==='errorMath'){errorPeriodChoice('math');return true;}if(action==='errorEnglish'){errorPeriodChoice('english');return true;}if(action.startsWith('errorName')){const [,subject,index]=action.match(/^errorName(math|english)_(\d)$/)||[];if(!subject)return true;const name=SOLO_NAMES[Number(index)];if(subject==='math'){mathName=name;localStorage.setItem('vb2math_name',name);}else{soloName=name;localStorage.setItem('vb2solo_name',name);}errorEvaluation(subject);return true;}if(action==='errorPeriod_day'||action==='errorPeriod_week'){errorEvaluation(errorEvalSubject,action.endsWith('day')?'day':'week');return true;}if(/^errorTopic\d+$/.test(action)){errorPracticeStart(Number(action.slice(10)));return true;}if(action==='errorPracticeNext'){errorPracticeNext();return true;}if(action==='errorRefresh'){errorEvaluation(errorEvalSubject,errorEvalPeriod);return true;}if(action==='errorSubjectHome'){if(errorEvalSubject==='math')mathHome();else soloHome();return true;}if(action==='errorTextCheck'){const value=document.querySelector('[data-error-text]')?.value||'';void errorPracticeAnswer(value);return true;}return false;}
let soloName=localStorage.getItem('vb2solo_name')||'';
let dashboardUnsubscribe=null,soloHeartbeat=null;
function resetStamp(name,subject='english'){
 return Math.max(Number(resetState.all)||0,Number(resetState[name])||0,Number(resetState[`${subject}_${name}`])||0);
}
function clearLocalLearning(name,subject){
 const prefixes=subject==='math'?[`vb2math_${name}_battle_`]:[`vb2solo_${name}_battle_`,`vb2first_${name}_`,`vb2grammar_${name}_`,`vb2gap_${name}_`,`vb2listen_${name}_`,`vb2writing_${name}_`];
 for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&prefixes.some(p=>k.startsWith(p)))localStorage.removeItem(k);}
 if(subject==='math'){for(const m of FRACTION_MODULES)localStorage.removeItem('vb2math_'+name+'_fraction_'+m.id);if(mathName===name)mathRun=null;}
 if(subject==='english'&&soloName===name){solo=null;stopSoloHeartbeat();grammarStation=null;grammarTask=null;}
}
function applyResetState(state){
 resetState=state&&typeof state==='object'?state:{};
 let activeEnglish=false,activeMath=false;
 for(const name of SOLO_NAMES){
  for(const subject of ['english','math']){
   const stamp=resetStamp(name,subject),seenKey=`vb2reset_seen_${subject}_${name}`;
   // Preserve previous legacy reset acknowledgement when upgrading.
   const oldSeen=Number(localStorage.getItem(`vb2reset_seen_${name}`)||0);
   const seen=Math.max(Number(localStorage.getItem(seenKey)||0),oldSeen);
   if(stamp>seen){
    clearLocalLearning(name,subject);
    localStorage.setItem(seenKey,String(stamp));
    if(subject==='english'&&soloName===name)activeEnglish=true;
    if(subject==='math'&&mathName===name)activeMath=true;
   }
  }
  for(const mod of FRACTION_MODULES){
   const stamp=Number(resetState[name+'__math_fraction_'+mod.id])||0;
   const seenKey='vb2reset_seen_math_'+name+'_fraction_'+mod.id;
   if(stamp>Number(localStorage.getItem(seenKey)||0)){
    localStorage.removeItem('vb2math_'+name+'_fraction_'+mod.id);
    localStorage.setItem(seenKey,String(stamp));
    if(mathName===name&&fractionRun?.id===mod.id){fractionRun=null;activeMath=true;}
   }
  }
  const examStamp=Number(resetState[name+'__math_battle6']
)||0,examSeenKey=`vb2reset_seen_math_${name}_battle6`;
  if(examStamp>Number(localStorage.getItem(examSeenKey)||0)){
   localStorage.removeItem(mathKey(name,5));
   localStorage.setItem(examSeenKey,String(examStamp));
   if(mathName===name&&mathRun?.b===5){mathRun=null;activeMath=true;}
  }
  const proportionalStamp=Number(resetState[name+'__math_proportional'])||0,proportionalSeenKey=`vb2reset_seen_math_${name}_proportional`;
  if(proportionalStamp>Number(localStorage.getItem(proportionalSeenKey)||0)){
   localStorage.removeItem(mathKey(name,6));
   localStorage.setItem(proportionalSeenKey,String(proportionalStamp));
   if(mathName===name&&mathRun?.b===6){mathRun=null;activeMath=true;}
  }
  for(let index=0;index<MATH_PROPORTIONAL_CLASSWORKS.length;index++){
   const b=7+index,stamp=Number(resetState[name+'__math_proportional_exam'+(index+1)])||0,seenKey=`vb2reset_seen_math_${name}_proportional_exam${index+1}`;
   if(stamp>Number(localStorage.getItem(seenKey)||0)){
    localStorage.removeItem(mathKey(name,b));localStorage.setItem(seenKey,String(stamp));
    if(mathName===name&&mathRun?.b===b){mathRun=null;activeMath=true;}
   }
  }
  for(let index=0;index<MATH_PROPORTIONAL_PRACTICE_BLOCKS.length;index++){
   const block=MATH_PROPORTIONAL_PRACTICE_BLOCKS[index],b=10+index,stamp=Number(resetState[name+'__math_proportional_practice_'+block.id])||0,seenKey=`vb2reset_seen_math_${name}_proportional_practice_${block.id}`;
   if(stamp>Number(localStorage.getItem(seenKey)||0)){
    localStorage.removeItem(mathKey(name,b));localStorage.setItem(seenKey,String(stamp));
    if(mathName===name&&mathRun?.b===b){mathRun=null;activeMath=true;}
   }
  }
 }
 resetReady=true;
 if(activeMath&&mathName){mathHome();msg('Mathe-Lernstand zurückgesetzt. Englisch bleibt erhalten.');}
 else if(activeEnglish&&soloName){soloHome();msg('Englisch-Lernstand zurückgesetzt. Mathe bleibt erhalten.');}
}
function watchResets(){
 if(resetUnsubscribe){resetUnsubscribe();resetUnsubscribe=null;}
 resetReady=false;
 resetUnsubscribe=onValue(ref(db,'learningResets'),snap=>applyResetState(snap.val()),e=>msg('Reset-Abgleich fehlgeschlagen: '+e.message,true));
}

function stopSoloHeartbeat(){if(soloHeartbeat!==null){clearInterval(soloHeartbeat);soloHeartbeat=null;}}
function startSoloHeartbeat(){stopSoloHeartbeat();soloHeartbeat=setInterval(()=>{if(solo&&soloName)void syncSolo();},30000);}
function stopDashboard(){if(dashboardUnsubscribe){dashboardUnsubscribe();dashboardUnsubscribe=null;}}
function stopClock(){if(clock!==null){clearInterval(clock);clock=null;}lastClockText='';}
async function showEnglishSeries(){
 stopSoloHeartbeat();app.innerHTML=card('<h2>🏆 Englisch-Gesamtwertung</h2><p>Ergebnisse werden geladen …</p>')+card(btn('Zurück','home','alt'));
 try{
  const snap=await get(ref(db,'soloProgress')),battleData=snap.val()||{};
  const rows=SOLO_NAMES.map(name=>({name,points:[null,null,null],stamps:[0,0,0]}));
  for(const device of Object.values(battleData))for(const row of rows){const progress=device?.[row.name]||{};for(let battle=1;battle<=3;battle++){const result=progress['battle'+battle],index=battle-1;if(Number(result?.seriesBattle)!==battle||!Number.isFinite(Number(result?.seriesPoints)))continue;const stamp=Number(result.seriesUpdatedAt)||0;if(stamp>=row.stamps[index]){row.points[index]=Number(result.seriesPoints);row.stamps[index]=stamp;}}}
  rows.forEach(row=>row.total=row.points.reduce((sum,points)=>sum+(points||0),0));
  rows.sort((a,b)=>b.total-a.total||(b.points.filter(x=>x===30).length-a.points.filter(x=>x===30).length)||(b.points.filter(x=>x===20).length-a.points.filter(x=>x===20).length)||a.name.localeCompare(b.name,'de'));
  const body=rows.map((row,index)=>'<tr><td>'+(index+1)+'.</td><td><strong>'+esc(row.name)+'</strong></td>'+row.points.map(value=>'<td>'+(value===null?'–':value)+'</td>').join('')+'<td><strong>'+row.total+'</strong></td></tr>').join('');
  app.innerHTML=card('<h2>🏆 Englisch-Gesamtwertung</h2><p>Hier zählen die drei Vokabel-Battles. Punkte werden automatisch übernommen.</p><div style="overflow-x:auto"><table style="width:100%;min-width:560px;border-collapse:collapse;text-align:center"><thead><tr><th>Platz</th><th>Name</th><th>Battle 1</th><th>Battle 2</th><th>Battle 3</th><th>Gesamt</th></tr></thead><tbody>'+body+'</tbody></table></div>')+card(btn('Zurück zur Übersicht','home','alt'));
 }catch(e){app.innerHTML=card('<h2>🏆 Englisch-Gesamtwertung</h2><p class="error">Gesamtwertung konnte nicht geladen werden: '+esc(e.message)+'</p>')+card(btn('Zurück zur Übersicht','home','alt'));}
}
async function showGrammarSeries(){
 stopSoloHeartbeat();app.innerHTML=card('<h2>📘 Grammatik-Gesamtwertung</h2><p>Wertung wird geladen …</p>')+card(btn('Zurück','home','alt'));
 const activities=[{id:'grammar1',label:'Grammatik 1'},{id:'grammar2',label:'Grammatik 2'}],rankPoints={1:30,2:20,3:10,4:5};
 try{
  const snap=await get(ref(db,'englishSeriesResults')),data=snap.val()||{},rows=SOLO_NAMES.map(name=>({name,workScores:{},points:{grammar1:null,grammar2:null}}));
  for(const device of Object.values(data))for(const row of rows)for(const activity of activities){const result=device?.[row.name]?.[activity.id];if(!result?.finished||!Number.isFinite(Number(result.score))||!Number(result.maxScore))continue;const old=row.workScores[activity.id],stamp=Number(result.updatedAt)||0;if(!old||stamp>=old.stamp)row.workScores[activity.id]={score:Number(result.score),maxScore:Number(result.maxScore),stamp};}
  for(const activity of activities){const ranked=rankByScore(rows.filter(row=>row.workScores[activity.id]),row=>row.workScores[activity.id].score/row.workScores[activity.id].maxScore);ranked.forEach(({row,place,points})=>{const result=row.workScores[activity.id];result.rank=place;result.points=points;row.points[activity.id]=points;});}
  rows.forEach(row=>row.total=activities.reduce((sum,activity)=>sum+(row.points[activity.id]||0),0));
  rows.sort((a,b)=>b.total-a.total||(activities.filter(activity=>b.points[activity.id]===30).length-activities.filter(activity=>a.points[activity.id]===30).length)||(activities.filter(activity=>b.points[activity.id]===20).length-activities.filter(activity=>a.points[activity.id]===20).length)||a.name.localeCompare(b.name,'de'));
  const cell=(row,activity)=>{const result=row.workScores[activity.id];return result?`${result.score}/${result.maxScore}<br><strong>${result.points} Punkte · Platz ${result.rank}</strong>`:'–';},body=rows.map((row,index)=>`<tr><td>${index+1}.</td><td><strong>${esc(row.name)}</strong></td>${activities.map(activity=>`<td>${cell(row,activity)}</td>`).join('')}<td><strong>${row.total}</strong></td></tr>`).join('');
  app.innerHTML=card(`<h2>📘 Grammatik-Gesamtwertung</h2><p>Hier zählen nur Grammatik 1 und 2. Gleichstände erhalten je Station jeweils 30 Punkte. Ohne Gleichstand gibt es 30, 20, 10 und für Platz 4 fünf Punkte.</p><div style='overflow-x:auto'><table style='width:100%;min-width:540px;border-collapse:collapse;text-align:center'><thead><tr><th>Platz</th><th>Name</th>${activities.map(activity=>`<th>${activity.label}</th>`).join('')}<th>Gesamtpunkte</th></tr></thead><tbody>${body}</tbody></table></div>${rows.every(row=>activities.every(activity=>!row.workScores[activity.id]))?'<p class="muted">Noch keine Grammatik-Ergebnisse gespeichert.</p>':''}`)+card(btn('Zurück zur Übersicht','home','alt'));
 }catch(e){app.innerHTML=card(`<h2>📘 Grammatik-Gesamtwertung</h2><p class="error">Gesamtwertung konnte nicht geladen werden: ${esc(e.message)}</p>`)+card(btn('Zurück zur Übersicht','home','alt'));}
}
function home(){stopDashboard();stopSoloHeartbeat();if(unsubscribe){unsubscribe();unsubscribe=null;}stopClock();code='';role='';slot='';room=null;solo=null;busy=false;previousStageKey='';joinExpectedRoomType='';status.textContent='';app.innerHTML=card(`<h2>📚 Alleine lernen</h2><div class="name-actions">${btn('🇬🇧 Englisch lernen · Vokabeln, Grammatik, Listening, Reading & Writing','solo','english-learn-action')}${btn('🔢 Mathe Klasse 7 NRW lernen','mathChoose','math-learn-action')}</div><h3>Fehlerauswertung</h3><div class="name-actions">${btn('📊 Auswertung Englisch','errorEnglish','english-learn-action')}${btn('📊 Auswertung Mathe','errorMath','math-learn-action')}${btn('🏆 Englisch-Serie · Gesamtwertung','englishSeries','english-learn-action')}${btn('📘 Grammatik-Gesamtwertung','grammarSeries','english-grammar-action')}</div>`)+card(`<h2>⚔️ Battle</h2><div class="name-actions">${btn('⚡ Vokabel-Battle','join','english-vocab-action')}${btn('📝 Vokabelarbeit-Battle · Station 1, Seiten 1 + 2','joinVocabWork','english-vocab-action')}${btn('🩹 Vokabelarbeit-Battle · Station 2, Seiten 1 + 2','joinVocabWorkStation2','english-vocab-action')}${btn('🎧 Listening-Battle','join','english-listening-action')}${btn('📖 Reading-Battle','join','english-reading-action')}${btn('📘 Grammatik-Battle','join','english-grammar-action')}${btn('✍️ Writing-Battle','join','english-writing-action')}</div><p class="muted">Wähle ein Battle und gib anschließend den Spielcode ein.</p>`)+card(`<h2>🔢 Mathe-Battles</h2><div class="name-actions math-battle-buttons">${btn('1️⃣ Bruchrechnung-Battle beitreten','joinMathFractions','math-fractions-action')}${btn('2️⃣ Rationale-Zahlen-Battle beitreten','joinMathRational','math-rational-action')}${btn('3️⃣ Proportional-/Antiproportional-Klassenarbeit beitreten','joinMathExam','math-exam-action')}</div><p class="muted">Wähle das passende Battle und gib anschließend den Spielcode ein.</p>`);}
function listen(){if(unsubscribe)unsubscribe();stopClock();unsubscribe=onValue(ref(db,`rooms/${code}`),snap=>{room=snap.val();if(!room){msg('Raum nicht gefunden oder gelöscht.',true);return;}render();},e=>msg('Firebase-Zugriff verweigert: '+e.message,true));}
function current(){const m=room?.meta||{},b=Number(m.battle||1)-1,i=Number(m.index||0),localIndex=i%30;if(m.mode==='math-exam')return MATH_PROPORTIONAL_CLASSWORKS[0].questions[i%MATH_PROPORTIONAL_CLASSWORKS[0].questions.length];if(m.mode==='fractions'){const questions=FRACTION_MODULES[b]?.questions||[];return questions[i%Math.max(questions.length,1)];}if(m.mode==='reading')return READING_QUIZ[i];if(m.mode==='listening')return LISTENING_QUESTIONS[i];return (m.subject==='math'?MATH_BATTLES:BATTLES)[b]?.[localIndex];}
async function awardRoomPointsOnce(roomPath,slotId,questionKey,points){const result=await runTransaction(ref(db,`${roomPath}/slots/${slotId}`),current=>{if(!current||!current.uid)return;const awarded={...(current.awarded||{})},key=String(questionKey);if(awarded[key])return current;awarded[key]=true;return {...current,score:(Number(current.score)||0)+(Number(points)||0),awarded};});return result.committed;}
function roomQuestionCount(m=room?.meta||{}){return m.mode==='math-exam'?MATH_PROPORTIONAL_CLASSWORKS[0].questions.length:m.mode==='fractions'?(FRACTION_MODULES[Number(m.battle||1)-1]?.questions.length||0):m.mode==='reading'?READING_QUIZ.length:m.mode==='listening'?LISTENING_QUESTIONS.length:30;}
function roomTitle(m=room?.meta||{}){const n=Number(m.battle||1);return m.mode==='math-exam'?'Proportional / Antiproportional · Klassenarbeit 1':m.mode==='fractions'?FRACTION_MODULES[n-1]?.title||'Bruchrechnung':m.mode==='reading'?'Reading · A trip to Cardiff Castle':m.mode==='listening'?'Listening · Activity weekend in Cardiff':m.subject==='math'?RATIONAL_MATH_TITLES[n-1]||RATIONAL_MATH_TITLES[0]:'Englisch-Battle '+n;}
function questionDurationMs(m=room?.meta||{}){return m.mode==='vocab'||(!m.mode&&m.subject!=='math')?VOCAB_QUESTION_MS:OTHER_QUESTION_MS;}
function questionDurationSeconds(m=room?.meta||{}){return Math.round(questionDurationMs(m)/1000);}
function players(){return Object.entries(room?.slots||{}).map(([id,p])=>({id,...p})).sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));}
function rankByScore(entries,scoreOf=row=>Number(row.score)||0){const sorted=[...entries].sort((a,b)=>scoreOf(b)-scoreOf(a)||String(a.name||'').localeCompare(String(b.name||''),'de'));let place=0,lastScore;return sorted.map((row,index)=>{const score=scoreOf(row);if(index===0||score!==lastScore)place=index+1;lastScore=score;const tied=(index>0&&scoreOf(sorted[index-1])===score)||(index+1<sorted.length&&scoreOf(sorted[index+1])===score);return {row,place,tied,points:pointsForRank(place,tied)};});}
function pointsForRank(place,tied=false){return tied?30:([30,20,10,5][place-1]||0);}
function isEnglishSeriesRoom(m=room?.meta||{}){return m.subject==='english'&&(m.mode==='vocab'||!m.mode)&&Number(m.battle)>=1&&Number(m.battle)<=3;}
function englishSeriesPoints(place,tied=false){return pointsForRank(place,tied);}
function roster(){return rankByScore(players()).map(({row:p,place,tied,points})=>{const award=room?.meta?.stage==='finished'&&isEnglishSeriesRoom()?` · +${points} Serienpunkte${tied?' (Gleichstand)':''}`:'';return `<div class="player row"><span>${place}. ${esc(p.name)}</span><span class="score">${Number(p.score)||0}${award}</span></div>`;}).join('')||'<p>Noch keine Spieler.</p>'; }

function chooseBattle(){app.innerHTML=card(`<h2>🎮 Battle auswählen</h2><p>Welches Battle soll gespielt werden?</p><label>Battle<select id="battle-choice"><option value="1">Battle 1 – 30 Fragen</option><option value="2">Battle 2 – 30 Fragen</option><option value="3">Battle 3 – 30 Fragen</option></select></label>${btn('Raum erstellen','createRoom')}`)+card(btn('Zurück','home','alt'));}
function countdown(){const m=room?.meta||{};if(m.stage!=='question'&&m.stage!=='reveal')return '';const remaining=Math.max(0,Math.ceil((Number(m.deadline||0)-Date.now())/1000));return m.stage==='question'?`⏱️ Noch ${remaining} Sekunden`:`⏳ Weiter in ${remaining} Sekunden`;}
function render(){if(!room)return;const m=room.meta||{},q=current(),stage=m.stage||'lobby',questionNumber=['math-exam','fractions','reading','listening'].includes(m.mode)?Number(m.index||0)+1:Number(m.index||0)%30+1;const stageKey=`${m.battle}:${m.index}:${stage}`;let s=card(`<p class="muted">Raumcode</p><div class="big">${esc(code)}</div><p>${esc(roomTitle(m))} · ${stage==='lobby'?'Warteraum':stage==='question'?`Frage ${questionNumber} von ${roomQuestionCount(m)}`:stage==='reveal'?'Auswertung':'Battle beendet'}</p>${roster()}`);
if(role==='host'){
 if(stage==='lobby')s+=card(`<h2>Schiedsrichter</h2><p>Battle ${m.battle} starten – 30 Fragen mit je ${questionDurationSeconds(m)} Sekunden. Danach erscheint die Rangliste.</p>${btn('▶️ Battle starten','start')}`);
 if(stage==='question'){const a=room.answers?.[m.index]||{};s+=card(`<h2>Frage ${Number(m.index)%30+1}</h2><p>${m.subject==='math'?mathText(q?.q||''):esc(q?.q||'')}</p><h2 id="countdown">${countdown()}</h2><p>Antworten: ${Object.keys(a).length} von ${players().length}</p><p class="muted">Automatische Auswertung nach ${questionDurationSeconds(m)} Sekunden</p>`);}
 if(stage==='reveal')s+=card(`<h2>Richtige Antwort</h2><p class="good">${m.subject==='math'?mathText(q?.options[q.correct]??''):esc(q?.options[q.correct]??'')}</p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card(`<h2>🏆 Battle ${m.battle} beendet!</h2><p>Rangliste nach 30 Fragen:</p>${roster()}${btn('🔄 Neues Spiel','reset')}`);
 s+=card(btn('Zur Startseite','home','alt'));
}else{
 const myAnswer=room.answers?.[m.index]?.[uid];
 if(stage==='lobby')s+=card('<h2>Warteraum</h2><p>Warte, bis der Schiedsrichter das Battle startet.</p>');
 if(stage==='question'&&q){const answered=myAnswer!==undefined;s+=card(`<h2>${m.subject==='math'?mathText(q.q):esc(q.q)}</h2><h2 id="countdown">${countdown()}</h2><div class="answers">${q.options.map((o,i)=>`<button ${answered||Date.now()>=Number(m.deadline||0)?'disabled':''} data-answer="${i}" class="${answered&&Number(myAnswer.choice)===i?'picked':''}">${m.subject==='math'?mathText(o):esc(o)}</button>`).join('')}</div><p class="muted">${answered?'Antwort abgegeben. Warte auf die Auswertung.':'Wähle eine Antwort innerhalb von ${questionDurationSeconds(m)} Sekunden.'}</p>`);}
 if(stage==='reveal')s+=card(`<h2>Auflösung</h2><p>Richtig: <strong class="good">${m.subject==='math'?mathText(q?.options[q.correct]??''):esc(q?.options[q.correct]??'')}</strong></p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card('<h2>🏆 Battle ${m.battle} geschafft!</h2><p>Die Rangliste steht oben.</p>');
 s+=card(btn('Zur Startseite','home','alt'));
}
app.innerHTML=s;
if(stageKey!==previousStageKey){previousStageKey=stageKey;lastClockText='';}
if(stage==='question'||stage==='reveal'){if(clock===null)clock=setInterval(tick,250);tick();}else stopClock();}
function tick(){if(!room)return;const m=room.meta||{},stage=m.stage;if(stage!=='question'&&stage!=='reveal'){stopClock();return;}const text=countdown();if(text!==lastClockText){const el=document.querySelector('#countdown');if(el)el.textContent=text;lastClockText=text;}if(stage==='question'&&Date.now()>=Number(m.deadline||0)){document.querySelectorAll('[data-answer]').forEach(el=>el.disabled=true);}if(role!=='host'||busy||!m.deadline||Date.now()<Number(m.deadline))return;if(stage==='question')void automaticReveal();else if(stage==='reveal')void automaticNext();}
async function makeRoom(){const battle=Number(document.querySelector('#battle-choice')?.value||1);if(!uid){msg('Verbindung wird hergestellt. Bitte kurz warten.',true);return;}code=String(Math.floor(100000+Math.random()*900000));role='host';slot='';try{await set(ref(db,`rooms/${code}/meta`),{hostUid:uid,stage:'lobby',battle,index:(battle-1)*30,createdAt:Date.now()});listen();}catch(e){msg('Raum konnte nicht erstellt werden: '+e.message,true);}}
function joinForm(label='Spiel beitreten',expectedRoomType=''){joinExpectedRoomType=expectedRoomType;app.innerHTML=card(`<h2>${esc(label)}</h2><label>Raumcode<input id="roomcode" inputmode="numeric" maxlength="6" placeholder="6-stelliger Code"></label><label>Dein Name<select id="playername">${names.map(n=>`<option>${n}</option>`).join('')}</select></label>${btn('Beitreten','enter')}`)+card(btn('Zurück','home','alt'));}
async function enter(){const c=document.querySelector('#roomcode').value.trim(),name=document.querySelector('#playername').value;if(!uid){msg('Anmeldung läuft. Bitte kurz warten.',true);return;}if(!/^\d{6}$/.test(c)){msg('Bitte sechsstelligen Code eingeben.',true);return;}try{let snap=await get(ref(db,`rooms/${c}`));if(snap.exists()){const r=snap.val(),meta=r.meta||{};if(meta.mode==='vocab-work'){msg('Diese Battle-Art ist auf der Kinderseite nicht verfügbar.',true);return;}if(joinExpectedRoomType){const isMath=meta.subject==='math',matches=joinExpectedRoomType==='fractions'?isMath&&meta.mode==='fractions':joinExpectedRoomType==='math-exam'?isMath&&meta.mode==='math-exam':joinExpectedRoomType==='rational'?isMath&&(meta.mode==='vocab'||meta.mode==='rational'||!meta.mode):!isMath&&(meta.mode==='vocab'||!meta.mode);if(!matches){msg('Dieser Code gehört zu einem anderen Battle. Bitte nimm den Code für den ausgewählten Button.',true);return;}}let s=Object.keys(r.slots||{}).find(k=>r.slots[k]?.name===name&&r.slots[k]?.uid===uid);if(!s){if(meta.stage!=='lobby'){msg('Das Battle läuft bereits. Bitte einen neuen Raum im Warteraum öffnen.',true);return;}s=String(names.indexOf(name)+1);if(r.slots?.[s]){msg('Dieser Name ist schon vergeben. Bitte anderen Namen wählen.',true);return;}await set(ref(db,`rooms/${c}/slots/${s}`),{name,uid,score:0});}code=c;role='player';slot=s;listen();return;}snap=await get(ref(db,`grammarRooms/${c}`));if(snap.exists()){const r=snap.val(),meta=r.meta||{};if(joinExpectedRoomType==='vocab-work-1'&&meta.kind!=='vocab-work'){msg('Dieser Code gehört nicht zum Vokabelarbeit-Battle Station 1.',true);return;}if(joinExpectedRoomType==='vocab-work-2'&&meta.kind!=='vocab-work-station2'){msg('Dieser Code gehört nicht zum Vokabelarbeit-Battle Station 2.',true);return;}let s=Object.keys(r.slots||{}).find(k=>r.slots[k]?.name===name&&r.slots[k]?.uid===uid);if(!s){if(meta.stage!=='lobby'){msg('Das Battle läuft bereits. Bitte den nächsten Raum abwarten.',true);return;}s=String(names.indexOf(name)+1);if(r.slots?.[s]){msg('Dieser Name ist schon vergeben. Bitte anderen Namen wählen.',true);return;}await set(ref(db,`grammarRooms/${c}/slots/${s}`),{name,uid,score:0});}if(meta.kind==='writing'){wbCode=c;wbSlot=s;wbListen();return;}if(meta.kind==='vocab-work'||meta.kind==='vocab-work-station2'){gbCode=c;gbSlot=s;gbListen();return;}if(meta.station!==undefined){gbCode=c;gbSlot=s;gbListen();return;}}msg('Raumcode nicht gefunden. Prüfe die sechs Ziffern.',true);}catch(e){msg('Beitritt fehlgeschlagen: '+e.message,true);}}
async function automaticReveal(){if(busy||role!=='host'||!room||room.meta?.hostUid!==uid||room.meta.stage!=='question')return;busy=true;const battle=room.meta.battle,index=Number(room.meta.index);try{const q=current();if(!q)throw new Error('Frage nicht gefunden');const ans=room.answers?.[index]||{};for(const p of players()){const correct=Number(ans[p.uid]?.choice)===q.correct;await awardRoomPointsOnce(`rooms/${code}`,p.id,index,correct?10:0);}if(room?.meta?.battle===battle&&room?.meta?.index===index&&room?.meta?.stage==='question')await update(ref(db,`rooms/${code}/meta`),{stage:'reveal',deadline:Date.now()+REVEAL_MS});}catch(e){msg('Automatische Auswertung fehlgeschlagen: '+e.message,true);}finally{busy=false;}}
async function automaticNext(){if(busy||role!=='host'||!room||room.meta?.hostUid!==uid||room.meta.stage!=='reveal')return;busy=true;const m={...room.meta},index=Number(m.index)||0;try{const special=['math-exam','fractions','reading','listening'].includes(m.mode),lastQuestion=special?index>=roomQuestionCount(m)-1:index%30>=roomQuestionCount(m)-1;if(lastQuestion)await update(ref(db,`rooms/${code}/meta`),{stage:'finished',deadline:0});else {const nextIndex=index+1;await update(ref(db,`rooms/${code}/meta`),{stage:'question',index:nextIndex,battle:Number(m.battle),deadline:Date.now()+questionDurationMs(m)});}}catch(e){msg('Nächste Frage konnte nicht gestartet werden: '+e.message,true);}finally{busy=false;}}
async function hostAction(a){if(role!=='host'||!room||room.meta?.hostUid!==uid){msg('Nur der Schiedsrichter darf das.',true);return;}const m=room.meta;try{if(a==='start'){if(players().length<1){msg('Mindestens ein Spieler muss beitreten.',true);return;}await update(ref(db,`rooms/${code}/meta`),{stage:'question',index:(Number(m.battle)-1)*30,deadline:Date.now()+questionDurationMs(m)});}if(a==='reset'){await remove(ref(db,`rooms/${code}/answers`));for(const p of players())await update(ref(db,`rooms/${code}/slots/${p.id}`),{score:0,awarded:{}});await update(ref(db,`rooms/${code}/meta`),{stage:'lobby',battle:Number(m.battle),index:(Number(m.battle)-1)*30,deadline:0});}}catch(e){msg('Aktion fehlgeschlagen: '+e.message,true);}}
async function answer(i){if(role!=='player'||room?.meta?.stage!=='question'||!uid)return;const n=room.meta.index;if(Date.now()>=Number(room.meta.deadline||0)){msg('Die Antwortzeit ist abgelaufen.',true);return;}if(room.answers?.[n]?.[uid]!==undefined)return;try{await set(ref(db,`rooms/${code}/answers/${n}/${uid}`),{choice:i,at:Date.now()});}catch(e){msg('Antwort konnte nicht gespeichert werden: '+e.message,true);}}

// Solo: 30 reguläre Fragen, danach falsch beantwortete Wörter wiederholen.
// Wiederholungen geben keine zusätzlichen Punkte; alle Zustände bleiben lokal gespeichert.
function cleanMistakes(v){const out={};if(!v||typeof v!=='object')return out;for(const [k,n] of Object.entries(v)){const i=Number(k);if(Number.isInteger(i)&&i>=0&&i<30&&Number.isFinite(Number(n))&&Number(n)>0)out[i]=Math.min(9999,Math.floor(Number(n)));}return out;}
function mistakeRows(b,m){return Object.entries(cleanMistakes(m)).map(([idx,count])=>{const q=BATTLES[b]?.[Number(idx)];if(!q)return null;return {word:q.word||q.q,translation:q.options[q.correct],count,idx:Number(idx)};}).filter(Boolean).sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word,'de'));}
function firstMistakeSection(type,id,title,answers){
 const r=firstRead(type,id);
 if(!r)return `<div class="player"><strong>${esc(title)}</strong><p class="muted">Noch kein erster Versuch gespeichert.</p></div>`;
 if(r.selfCheck){
  const entered=(r.inputs||[]).filter(x=>String(x||'').trim()).length;
  return `<div class="player"><strong>${esc(title)}</strong><p>${entered} von ${r.total} Sätzen im ersten Versuch ausgefüllt · Selbstkontrolle</p><details><summary>Erste Antworten ansehen</summary>${(r.inputs||[]).map((x,i)=>`<p><strong>${i+1}.</strong> ${esc(x||'(leer)')}</p>`).join('')}</details></div>`;
 }
 const mistakes=Array.isArray(r.errors)?r.errors:[];
 return `<div class="player"><strong>${esc(title)}</strong><p>Erster Versuch: ${Number(r.correct)||0} von ${r.total} richtig · ${mistakes.length} Fehler</p>${mistakes.length?`<details><summary>Fehler ansehen (${mistakes.length})</summary>${mistakes.map(x=>`<p><strong>Nr. ${Number(x.position)}:</strong> ${esc(x.answer||'(leer)')} → <strong>${esc(x.correct||'')}</strong></p>`).join('')}</details>`:'<p class="good">Alles richtig! 🎉</p>'}</div>`;
}
function showMyMistakes(){
 stopSoloHeartbeat();if(!soloName){soloChooseName();return;}
 const battles=[0,1,2].map(b=>{const entries=mistakeRows(b,soloSaved(b)?.mistakes);return `<h3>Battle ${b+1}</h3>${entries.length?entries.map(x=>`<div class="player"><strong>${esc(x.word)}</strong> – ${esc(x.translation)}<p class="muted">${x.count}× falsch beantwortet</p></div>`).join(''):'<p class="muted">Noch keine Fehler erfasst.</p>'}`;}).join('');
 const grammar=GRAMMAR.map((st,si)=>`<h3>Grammatik · Station ${si+1}</h3>${st.tasks.map((t,ti)=>firstMistakeSection('grammar',si+'_'+ti,t.title,t.items?.map(x=>x[2])||null)).join('')}`).join('');
 app.innerHTML=card(`<h2>📕 ${esc(soloName)} · Meine Fehlerliste</h2><p>Alle Fehler aus Battles sowie die ersten kontrollierten Versuche bei Grammatik. Grammatikdaten sind nur auf diesem Gerät gespeichert.</p><h2>🎮 Battles</h2>${battles}<h2>📘 Grammatik</h2>${grammar}`)+card(btn('Zur Battle-Auswahl','soloHome','alt'));
}
function soloKey(b){return `${key}_${soloName}_battle_${b+1}`;}
function soloSave(){if(!solo)return;solo.updatedAt=Date.now();localStorage.setItem(soloKey(solo.battle),JSON.stringify(solo));touchLearningActivity(soloName,`english_vocab_battle${solo.battle+1}`);void syncSolo();}
function soloSaved(b){try{const s=JSON.parse(localStorage.getItem(soloKey(b))||'null');if(!s||s.battle!==b||!Number.isInteger(s.index)||s.index<0||s.index>30||!Number.isFinite(s.score))return null;
 // Alte Speicherstände vor Einführung des Wiederholungsmodus bleiben kompatibel.
 s.wrong=Array.isArray(s.wrong)?s.wrong.filter(n=>Number.isInteger(n)&&n>=0&&n<30):[];
 s.mistakes=cleanMistakes(s.mistakes);s.review=!!s.review;s.reviewPos=Number.isInteger(s.reviewPos)&&s.reviewPos>=0?s.reviewPos:0;
 if(s.reviewPos>=s.wrong.length)s.reviewPos=0;
 return s;
}catch{return null;}}
async function syncSolo(){
 if(!uid||!db||!solo||!soloName||!resetReady)return;
 const currentSolo=solo,name=soloName,device=uid;
 const savedAt=Number(currentSolo.updatedAt)||Date.now();
 try{
  // Always check the current server reset before uploading old work.
  const rs=await get(ref(db,'learningResets'));
  applyResetState(rs.val());
  if(!resetReady||solo!==currentSolo||soloName!==name||savedAt<=resetStamp(name,'english'))return;
  await update(ref(db,`soloProgress/${device}/${name}/battle${currentSolo.battle+1}`),{
   name,battle:currentSolo.battle+1,done:currentSolo.index,
   correct:Math.floor(currentSolo.score/10),score:currentSolo.score,
   finished:!!currentSolo.finished,mistakes:cleanMistakes(currentSolo.mistakes),updatedAt:savedAt
  });
 }catch(e){msg('Online-Speicherung noch nicht möglich: '+e.message,true);}
}
function soloChooseName(){if(!resetReady){msg('Lernstände werden abgeglichen. Bitte kurz warten.',true);return;}stopSoloHeartbeat();app.innerHTML=card(`<h2>📚 Wer lernt gerade?</h2><p>Wähle deinen Namen, damit der Schiedsrichter deinen Lernfortschritt sehen kann.</p><div class="buttons">${SOLO_NAMES.map((n,i)=>btn(esc(n),`soloName${i}`)).join('')}</div>`)+card(btn('Zurück','home','alt'));}
function soloSetName(i){soloName=SOLO_NAMES[i];localStorage.setItem('vb2solo_name',soloName);soloHome();}
function soloHome(){
 grammarCollect();stopSoloHeartbeat();if(!soloName){soloChooseName();return;}solo=null;
 const battles=[0,1,2].map(b=>{const saved=soloSaved(b),done=saved?.index||0,reviewing=saved&&!saved.finished&&saved.review&&saved.wrong.length;return `<div class="solo-game"><div class="row"><h3>Battle ${b+1}</h3><span class="small">${done} von 30</span></div><p>Fragen erledigt${reviewing?` · 🔁 ${saved.wrong.length} wiederholen`:''}${saved?.finished?' · abgeschlossen':''}</p><div class="solo-actions">${btn(saved?'Neu beginnen':'Starten',`soloStart${b}`)}${saved&&!saved.finished?btn('Fortsetzen',`soloResume${b}`,'alt'):''}</div></div>`;}).join('');
 const vocabWorkCards=[
  ['📝 Vokabelarbeit · Station 1 · Seite 1','Aufgaben 1–3 · Sportarten, Gegenteile und Sätze. Schreibe die Antworten selbst wie auf dem Arbeitsblatt.','vocabWorkPage1'],
  ['📝 Vokabelarbeit · Station 1 · Seite 2','Aufgabe 4 · Julies Nachricht vervollständigen. Schreibe die Antworten selbst wie auf dem Arbeitsblatt.','vocabWorkPage2'],
  ['🩹 Vokabelarbeit · Station 2 · Seite 1','Aufgaben 1 + 2 · Bilder benennen und Sätze vervollständigen.','vocabWorkStation2Page1'],
  ['🩹 Vokabelarbeit · Station 2 · Seite 2','Aufgaben 3 + 4 · Verben einsetzen und Rettungsdienste nennen.','vocabWorkStation2Page2']
 ].map(([title,description,action])=>`<div class="solo-game"><h3>${esc(title)}</h3><p>${esc(description)}</p><div class="solo-actions">${btn('Seite öffnen',action)}</div></div>`).join('');
 const grammarCards=[
  ['📘 Grammatik · Station 1','Aufgaben 1–4 aus Station 1 selbstständig üben.','grammarStation0','Station 1 öffnen'],
  ['📘 Grammatik · Station 2','Aufgaben 1–7 aus Station 2 selbstständig üben.','grammarStation1','Station 2 öffnen']
 ].map(([title,description,action,label])=>`<div class="solo-game"><h3>${esc(title)}</h3><p>${esc(description)}</p><div class="solo-actions">${btn(label,action)}</div></div>`).join('');
 const listening=listenLoad(),writing=writingLoad(),writingDone=WRITING_TASKS.filter(t=>writing.complete?.[t.id]).length;
 const moreCards=`${grammarCards}<div class="solo-game"><h3>🎧 Listening · Activity weekend in Cardiff</h3><p>${listening?.index||0} von ${LISTENING_QUESTIONS.length} Fragen${listening?.finished?' · abgeschlossen':''}. Höre den Beitrag an und übe die Fragen.</p><div class="solo-actions">${btn(listening?'Neu beginnen':'Listening starten','listenStart')}${listening&&!listening.finished?btn('Fortsetzen','listenResume','alt'):''}</div></div><div class="solo-game"><h3>✍️ Writing · Unit 2</h3><p>${writingDone} von ${WRITING_TASKS.length} Schreibaufgaben selbst geprüft. Plane, schreibe und vergleiche mit Beispielen.</p><div class="solo-actions">${btn('Writing lernen','writingMenu')}</div></div>`;
 app.innerHTML=card(`<h2>📚 ${esc(soloName)} · Englisch lernen</h2><p class="solo-note">Wähle ein Vokabel-Battle oder übe die passenden Vokabeltexte. Dein Fortschritt wird auf diesem Handy und online gespeichert.</p><section class="solo-section"><h3>Vokabel-Battles</h3>${battles}</section><section class="solo-section"><h3>Vokabelarbeiten</h3>${vocabWorkCards}</section><section class="solo-section"><h3>Weitere Übungen</h3>${moreCards}</section><section class="solo-section"><h3>Dein Lernbereich</h3><div class="solo-actions solo-utility">${btn('📕 Meine Fehlerliste','soloMistakes','alt')}${btn('📊 Tages-/Wochenauswertung','errorEnglish','alt')}${btn('Anderen Namen wählen','soloChangeName','alt')}</div></section>`)+card(`<div class="solo-actions">${btn('Zurück','home','alt')}</div>`);
}
function vocabWorkKey(page){return `vb2vocabwork_${soloName}_station1_page${page}`;}
function vocabWorkLoad(page){try{const x=JSON.parse(localStorage.getItem(vocabWorkKey(page))||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
function vocabWorkInput(page,index,label,width='100%'){
 const value=vocabWorkLoad(page)[index]||'';
 return `<input data-vocabwork="${index}" aria-label="${esc(label)}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(value)}" style="width:${width};min-width:0;min-height:44px;margin:5px 0 8px;padding:9px 11px;border:2px solid #5c7696;border-radius:9px;background:#fff;color:#172337">`;
}
let vocabWorkCheckedPage=0;
function vocabWorkPage(page,checked=false,resultText=''){
 if(!soloName){soloChooseName();return;}
 vocabWorkCheckedPage=page;
 void recordLearningActivity(soloName,`english_vocab_work_page${page}`);
 const back=card(`<div class="solo-actions">${btn('Zurück zur Englisch-Auswahl','vocabWorkBack','alt')}</div>`);
 const result=checked?`<p class="good"><strong>${esc(resultText)}</strong></p>`:'';
 if(page===1){
  const sports=[['water sports',3],['ball sports',3],['winter sport',1]];let n=0;
  const table=sports.map(([title,count])=>`<section class="solo-game" style="margin-top:12px"><h3>${title}</h3>${Array.from({length:count},(_,i)=>{const ix=n++;return `<label style="display:block;margin:8px 0;font-weight:700">${i+1}. ${vocabWorkInput(1,ix,`${title} ${i+1}`)}</label>`;}).join('')}</section>`).join('');
  const opposites=['big','quiet','quick','interesting','safe','easy','good','fit'];
  const q2=opposites.map((word,i)=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) 32px minmax(0,1.4fr);align-items:center;gap:7px;margin:5px 0"><strong>${i+1}. ${word}</strong><span aria-hidden="true">↔</span>${vocabWorkInput(1,7+i,`Opposite of ${word}`)}</div>`).join('');
  const sentences=[
   `1. Rugby is a very fast and ${vocabWorkInput(1,15,'Sentence 1 answer')} sport.`,
   `2. There are lots of trees in the ${vocabWorkInput(1,16,'Sentence 2 answer')}.`,
   `3. Let’s take a ${vocabWorkInput(1,17,'Sentence 3 answer')} to the mountains next weekend.`,
   `4. You can ${vocabWorkInput(1,18,'Sentence 4 answer')} up a mountain or a tree.`,
   `5. To find out what you can or can’t do in a sport, you have to learn the ${vocabWorkInput(1,19,'Sentence 5 answer')}.`
  ].map(x=>`<p style="line-height:1.7;margin:14px 0">${x}</p>`).join('');
  app.innerHTML=card(`<h2>📝 Vokabelarbeit · Station 1 · Seite 1</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>1. Name the sports. Fill in the table.</h3><div style="display:grid;grid-template-columns:1fr;gap:4px">${table}</div></section><section class="solo-section"><h3>2. Find the opposites (↔).</h3>${q2}</section><section class="solo-section"><h3>3. Finish the sentences.</h3>${sentences}</section>${result}<p class="small muted">Trage alle Antworten ein und prüfe sie. Das Ergebnis wird automatisch für die Gesamtwertung gespeichert.</p><div class="buttons">${btn('✅ Prüfen und Ergebnis speichern','vocabWorkCheck')}</div>`)+back;
 }else{
  const inline=(i,word)=>vocabWorkInput(2,i,`Aufgabe 4 · ${word}`,'clamp(100px,30vw,190px)');
  const letter=`<div style="padding:14px 8px;line-height:2;font-size:clamp(16px,4.3vw,19px)"><p>Hi Beth,</p><p>How was your trip to the activity centre?</p><p>You know I love ${inline(0,'outdoor')} (Freiluft-) activities, so I tried canoeing last weekend. Our group took a trip down the River Wye.</p><p>The trip wasn’t ${inline(1,'dangerous')} (gefährlich), of course, but we had to wear special ${inline(2,'equipment')} (Ausrüstung) to keep us ${inline(3,'safe')} (sicher).</p><p>Guess what? I wasn’t so bad. We had a friendly and ${inline(4,'patient')} (geduldig) instructor. She said I was very ${inline(5,'talented')} (begabt). ☺</p><p>Mara was there too. She’s a really ${inline(6,'competitive')} (leistungsorientiert) girl and always wants to be most ${inline(7,'successful')} (erfolgreich). She was even ${inline(8,'cheeky')} (frech) to me. Well, forget about that …</p><p>The canoeing trip was great fun. In the evening I was ${inline(9,'exhausted')} (erschöpft) too, but I had a fantastic day.</p><p>See you soon!<br>Julie</p></div>`;
  app.innerHTML=card(`<h2>📝 Vokabelarbeit · Station 1 · Seite 2</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>4. Julie is Beth’s friend. Complete her message with the right words.</h3>${letter}</section>${result}<p class="small muted">Trage alle Antworten ein und prüfe sie. Das Ergebnis wird automatisch für die Gesamtwertung gespeichert.</p><div class="buttons">${btn('✅ Prüfen und Ergebnis speichern','vocabWorkCheck')}</div>`)+back;
 }
 window.scrollTo(0,0);
}
function vocabWorkCollect(){
 const first=document.querySelector('[data-vocabwork]');if(!first||!soloName)return;
 const page=document.querySelector('h2')?.textContent.includes('Seite 2')?2:1;
 const values=vocabWorkLoad(page);
 document.querySelectorAll('[data-vocabwork]').forEach(input=>{values[Number(input.dataset.vocabwork)]=input.value;});
 try{localStorage.setItem(vocabWorkKey(page),JSON.stringify(values));}catch{}
}
const VOCAB_WORK_ANSWERS={
 1:[['swimming'],['canoeing'],['rafting'],['rugby'],['netball'],['basketball'],['skiing'],['small'],['loud'],['slow'],['boring'],['dangerous'],['difficult','hard'],['bad'],['unfit'],['tough'],['wood','woods'],['trip'],['climb'],['rules']],
 2:[['outdoor'],['dangerous'],['equipment'],['safe'],['patient'],['talented'],['competitive'],['successful'],['cheeky'],['exhausted']]
};
function vocabWorkCheck(){
 const page=vocabWorkCheckedPage;if(!page||!soloName)return;vocabWorkCollect();
 const values=vocabWorkLoad(page),answers=VOCAB_WORK_ANSWERS[page],allFilled=answers.every((_,i)=>String(values[i]||'').trim());
 if(!allFilled){msg('Bitte erst alle Antworten eintragen.',true);return;}
 const normalized=values.map(grammarNormalize),correct=answers.reduce((sum,accepted,i)=>sum+(accepted.some(answer=>grammarNormalize(answer)===normalized[i])?1:0),0),now=Date.now();
 const result={name:soloName,activity:`vocabWork${page}`,done:answers.length,total:answers.length,correct,score:correct,maxScore:answers.length,finished:true,updatedAt:now,timestamp:now};
 if(db&&uid)void set(ref(db,`englishSeriesResults/${uid}/${soloName}/vocabWork${page}`),result).then(()=>vocabWorkPage(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`)).catch(e=>msg('Ergebnis konnte nicht online gespeichert werden: '+e.message,true));
 else msg('Verbindung wird hergestellt. Bitte gleich noch einmal prüfen.',true);
}

function vocabWorkStation2Key(page){return `vb2vocabwork_${soloName}_station2_page${page}`;}
function vocabWorkStation2Load(page){try{const x=JSON.parse(localStorage.getItem(vocabWorkStation2Key(page))||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
function vocabWorkStation2Input(page,index,label,width='100%'){
 const value=vocabWorkStation2Load(page)[index]||'';
 return `<input data-vocabwork-s2="${index}" aria-label="${esc(label)}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(value)}" style="width:${width};min-width:0;min-height:44px;margin:5px 0 8px;padding:9px 11px;border:2px solid #5c7696;border-radius:9px;background:#fff;color:#172337">`;
}
let vocabWorkStation2CheckedPage=0;
function vocabWorkStation2Page(page,checked=false,resultText=''){
 if(!soloName){soloChooseName();return;}
 vocabWorkStation2CheckedPage=page;
 void recordLearningActivity(soloName,`english_vocab_work_station2_page${page}`);
 const result=checked?`<p class="good"><strong>${esc(resultText)}</strong></p>`:'';
 const back=card(`<div class="solo-actions">${btn('Zurück zur Englisch-Auswahl','vocabWorkBack','alt')}</div>`);
 if(page===1){
  const pics=[['./station2-plaster.png','Bild 1'],['./station2-bandage.jpg','Bild 2'],['./station2-ambulance.jpg','Bild 3'],['./station2-tooth.png','Bild 4'],['./station2-tablet.png','Bild 5'],['./station2-cast.jpg','Bild 6']];
  const images=pics.map(([src,label],i)=>`<div class="solo-game" style="margin:0;padding:10px;text-align:center"><img src="${src}" alt="${label} aus Aufgabe 1" style="display:block;width:100%;height:128px;object-fit:contain;background:#fff;border-radius:10px;padding:6px"><label style="display:block;font-weight:700">${i+1}. ${vocabWorkStation2Input(1,i,`Aufgabe 1 · ${label}`)}</label></div>`).join('');
  const sentences=[
   `1. “Look, there has been an ${vocabWorkStation2Input(1,6,'Aufgabe 2 · Satz 1','clamp(120px,30vw,220px)')}. We must call an ambulance!”`,
   `2. When I cut my finger, it started to ${vocabWorkStation2Input(1,7,'Aufgabe 2 · Satz 2','clamp(120px,30vw,220px)')} badly.`,
   `3. Your ${vocabWorkStation2Input(1,8,'Aufgabe 2 · Satz 3','clamp(120px,30vw,220px)')} is a part of your leg.`,
   `4. When you ${vocabWorkStation2Input(1,9,'Aufgabe 2 · Satz 4','clamp(120px,30vw,220px)')} your ankle, you should put a bandage on it.`,
   `5. “Yummy! Our pizza is ready. Let’s take it out.” – “Be careful! It’s hot. Don’t ${vocabWorkStation2Input(1,10,'Aufgabe 2 · Satz 5','clamp(120px,30vw,220px)')} your hand when you take it out.”`,
   `6. Call 999 for the ${vocabWorkStation2Input(1,11,'Aufgabe 2 · Satz 6','clamp(120px,30vw,220px)')} services in the UK.`
  ].map(x=>`<p style="line-height:1.8;margin:14px 0">${x}</p>`).join('');
  app.innerHTML=card(`<h2>🩹 Vokabelarbeit · Station 2 · Seite 1</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>1. What is it? Write the right word under each picture.</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px">${images}</div></section><section class="solo-section"><h3>2. Complete the sentences with the right words.</h3><p><em>Example:</em> I have a sore throat. I need my scarf.</p>${sentences}</section>${result}<p class="small muted">Trage alle Antworten ein und prüfe sie. Das Ergebnis wird gespeichert.</p><div class="buttons">${btn('✅ Prüfen und Ergebnis speichern','vocabWorkStation2Check')}</div>`)+back;
 }else{
  const verbs=[
   `1. You ${vocabWorkStation2Input(2,0,'Aufgabe 3 · Satz 1','clamp(120px,30vw,220px)')} (have / make) an accident.`,
   `2. You ${vocabWorkStation2Input(2,1,'Aufgabe 3 · Satz 2','clamp(120px,30vw,220px)')} (invite / call) the operator.`,
   `3. You ${vocabWorkStation2Input(2,2,'Aufgabe 3 · Satz 3','clamp(120px,30vw,220px)')} (give / ask) your name on the phone.`,
   `4. You ${vocabWorkStation2Input(2,3,'Aufgabe 3 · Satz 4','clamp(120px,30vw,220px)')} (speak / say) where you are.`,
   `5. You ${vocabWorkStation2Input(2,4,'Aufgabe 3 · Satz 5','clamp(120px,30vw,220px)')} (stay with / wait for) the hurt person.`,
   `6. You ${vocabWorkStation2Input(2,5,'Aufgabe 3 · Satz 6','clamp(120px,30vw,220px)')} (take / bring) a person to hospital.`
  ].map(x=>`<p style="line-height:1.8;margin:14px 0">${x}</p>`).join('');
  const services=['1.','2.','3.','4.'].map((n,i)=>`<label style="display:flex;align-items:center;gap:8px;margin:12px 0;font-weight:700"><span>${n}</span>${vocabWorkStation2Input(2,6+i,`Aufgabe 4 · Emergency service ${n}`)}</label>`).join('');
  app.innerHTML=card(`<h2>🩹 Vokabelarbeit · Station 2 · Seite 2</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>3. Put in the right verb.</h3>${verbs}</section><section class="solo-section"><h3>4. Name the four emergency services in the UK.</h3>${services}</section>${result}<p class="small muted">Trage alle Antworten ein und prüfe sie. Das Ergebnis wird gespeichert.</p><div class="buttons">${btn('✅ Prüfen und Ergebnis speichern','vocabWorkStation2Check')}</div>`)+back;
 }
 window.scrollTo(0,0);
}
function vocabWorkStation2Collect(){
 const first=document.querySelector('[data-vocabwork-s2]');if(!first||!soloName)return;
 const page=vocabWorkStation2CheckedPage,values=vocabWorkStation2Load(page);
 document.querySelectorAll('[data-vocabwork-s2]').forEach(input=>{values[Number(input.dataset.vocabworkS2)]=input.value;});
 try{localStorage.setItem(vocabWorkStation2Key(page),JSON.stringify(values));}catch{}
}
const VOCAB_WORK_STATION2_ANSWERS={
 1:[['plaster'],['bandage'],['ambulance'],['tooth'],['tablet','medicine','tablet/medicine','tablet / medicine'],['cast'],['accident'],['bleed'],['knee'],['sprain','twist','hurt'],['burn'],['emergency']],
 2:[['have'],['call'],['give'],['say'],['stay with'],['take'],['police'],['fire brigade'],['ambulance'],['coastguard','coast guard']]
};
function vocabWorkStation2Check(){
 const page=vocabWorkStation2CheckedPage;if(!page||!soloName)return;vocabWorkStation2Collect();
 const values=vocabWorkStation2Load(page),answers=VOCAB_WORK_STATION2_ANSWERS[page];
 if(!answers.every((_,i)=>String(values[i]||'').trim())){msg('Bitte erst alle Antworten eintragen.',true);return;}
 const normalized=values.map(grammarNormalize),correct=answers.reduce((sum,accepted,i)=>sum+(accepted.some(answer=>grammarNormalize(answer)===normalized[i])?1:0),0),now=Date.now();
 const result={name:soloName,activity:`vocabWorkStation2Page${page}`,done:answers.length,total:answers.length,correct,score:correct,maxScore:answers.length,finished:true,updatedAt:now,timestamp:now};
 if(db&&uid)void set(ref(db,`englishSeriesResults/${uid}/${soloName}/vocabWorkStation2Page${page}`),result).then(()=>vocabWorkStation2Page(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`)).catch(e=>msg('Ergebnis konnte nicht online gespeichert werden: '+e.message,true));
 else msg('Verbindung wird hergestellt. Bitte gleich noch einmal prüfen.',true);
}

function soloStart(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}const previous=soloSaved(b);solo={battle:b,index:0,score:0,finished:false,wrong:[],review:false,reviewPos:0,mistakes:cleanMistakes(previous?.mistakes)};void recordLearningActivity(soloName,`english_vocab_battle${b+1}`);soloSave();soloQuestion();}
function soloResume(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}solo=soloSaved(b);if(!solo){soloStart(b);return;}void recordLearningActivity(soloName,`english_vocab_battle${b+1}`);void syncSolo();if(solo.finished)soloFinished();else soloQuestion();}
function soloQuestion(){if(!solo)return;startSoloHeartbeat();const b=solo.battle;
 if(!solo.review&&solo.index>=30){if(solo.wrong.length){solo.review=true;solo.reviewPos=0;soloSave();}else{soloFinished();return;}}
 if(solo.review&&!solo.wrong.length){soloFinished();return;}
 const i=solo.review?solo.wrong[solo.reviewPos]:solo.index,q=BATTLES[b]?.[i];
 if(!q){msg('Frage konnte nicht geladen werden.',true);return;}
 const title=solo.review?`🔁 Wiederholung · ${solo.wrong.length} Wörter offen`:`Frage ${solo.index+1}/30`;
 app.innerHTML=card(`<h2>${esc(soloName)} · Battle ${b+1}</h2><p>${title} · ${solo.score} Punkte</p><div class="bar"><div class="fill" style="width:${solo.index/30*100}%"></div></div><h2>${esc(q.q)}</h2><div class="answers">${q.options.map((o,j)=>`<button data-soloanswer="${j}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Battle-Auswahl','solo','alt'));
}
function soloAnswer(i){if(!solo||solo.finished)return;const reviewing=solo.review;const questionIndex=reviewing?solo.wrong[solo.reviewPos]:solo.index;
 const q=BATTLES[solo.battle]?.[questionIndex];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;
 // Sofort deaktivieren, damit Doppeltippen keine Fragen überspringt.
 document.querySelectorAll('[data-soloanswer]').forEach(el=>el.disabled=true);
 const ok=i===q.correct;
 void recordLearningError(soloName,'english',`english_vocab_battle${solo.battle+1}`,questionIndex,`Vokabel-Battle ${solo.battle+1}`,q,ok);
 if(!ok){solo.mistakes=cleanMistakes(solo.mistakes);solo.mistakes[questionIndex]=(solo.mistakes[questionIndex]||0)+1;}
 if(reviewing){if(ok){solo.wrong.splice(solo.reviewPos,1);if(solo.reviewPos>=solo.wrong.length)solo.reviewPos=0;}
 else if(solo.wrong.length>1)solo.reviewPos=(solo.reviewPos+1)%solo.wrong.length;
 }else{if(ok)solo.score+=10;else if(!solo.wrong.includes(questionIndex))solo.wrong.push(questionIndex);solo.index++;}
 soloSave();
 const remaining=solo.wrong.length;
 app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.options[q.correct])}</strong></p><p>Deine Punkte: ${solo.score} von 300</p>${reviewing?`<p>🔁 Noch ${remaining} ${remaining===1?'Wort':'Wörter'} zum Üben.</p>`:''}${btn('Weiter ➜','soloNext')}`);
}
function soloNext(){if(!solo)return;soloQuestion();}
function soloFinished(){if(!solo)return;stopSoloHeartbeat();solo.finished=true;solo.index=30;solo.wrong=[];solo.review=false;solo.reviewPos=0;soloSave();app.innerHTML=card(`<h2>🏆 Battle ${solo.battle+1} abgeschlossen!</h2><p>Alle Wörter wurden richtig geübt.</p><p class="score">${solo.score} von 300 Punkten</p>${btn('Battle wiederholen',`soloStart${solo.battle}`)}`)+card(btn('Anderes Battle auswählen','solo','alt'));}

function listeningKey(){return `vb2listen_${soloName}_unit2`;}
function listenLoad(){try{const s=JSON.parse(localStorage.getItem(listeningKey())||'null');if(!s||!Number.isInteger(s.index)||s.index<0||s.index>LISTENING_QUESTIONS.length)return null;s.mistakes=cleanMistakes(s.mistakes);return s;}catch{return null;}}
function listenSave(){if(!listeningRun||!soloName)return;listeningRun.updatedAt=Date.now();localStorage.setItem(listeningKey(),JSON.stringify(listeningRun));touchLearningActivity(soloName,'english_listening');void syncListeningProgress();}
async function syncListeningProgress(){if(!db||!uid||!soloName||!listeningRun)return;const run=listeningRun,now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/listeningUnit2`),{done:run.index,total:LISTENING_QUESTIONS.length,score:run.score||0,finished:!!run.finished,mistakes:cleanMistakes(run.mistakes),runId:run.runId,updatedAt:now,timestamp:now});listeningSyncWarned=false;}catch(e){if(!listeningSyncWarned){listeningSyncWarned=true;msg('Listening bleibt auf diesem Handy gespeichert; Online-Speicherung ist gerade nicht verfügbar.',true);}}}
function listenStart(){const old=listenLoad();listeningRun={index:0,score:0,finished:false,mistakes:cleanMistakes(old?.mistakes),runId:`solo-${Date.now()}`};void recordLearningActivity(soloName,'english_listening');listenSave();listenQuestion();}
function listenResume(){listeningRun=listenLoad();if(!listeningRun){listenStart();return;}void recordLearningActivity(soloName,'english_listening');if(listeningRun.finished){listenFinish();return;}listenQuestion();}
function listenQuestion(){if(!listeningRun)return;if(listeningRun.index>=LISTENING_QUESTIONS.length){listenFinish();return;}const q=LISTENING_QUESTIONS[listeningRun.index];app.innerHTML=card(`<h2>🎧 ${esc(soloName)} · Listening</h2><p>Activity weekend in Cardiff · Frage ${listeningRun.index+1} von ${LISTENING_QUESTIONS.length} · ${listeningRun.score} Punkte</p><audio controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg">Dein Browser unterstützt die Audiowiedergabe nicht.</audio><p class="muted">Höre dir den Beitrag an und wähle die passende Antwort. Du kannst die Aufnahme erneut starten.</p><h3>${esc(q.q)}</h3><div class="answers">${q.options.map((o,i)=>`<button data-listenanswer="${i}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function listenAnswer(i){if(!listeningRun||listeningRun.finished)return;const q=LISTENING_QUESTIONS[listeningRun.index];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;document.querySelectorAll('[data-listenanswer]').forEach(el=>el.disabled=true);const ok=i===q.correct;void recordLearningError(soloName,'english','english_listening',listeningRun.index,'Listening · Activity weekend in Cardiff',q,ok);if(ok)listeningRun.score+=10;else listeningRun.mistakes[listeningRun.index]=(listeningRun.mistakes[listeningRun.index]||0)+1;listeningRun.index++;listenSave();app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.options[q.correct])}</strong></p><p>${listeningRun.score} Punkte</p>${btn('Weiter ➜','listenNext')}`);}
function listenFinish(){if(!listeningRun)return;listeningRun.finished=true;listeningRun.index=LISTENING_QUESTIONS.length;listenSave();app.innerHTML=card(`<h2>🏆 Listening geschafft!</h2><p>Activity weekend in Cardiff</p><p class="score">${listeningRun.score} von ${LISTENING_QUESTIONS.length*10} Punkten</p>${btn('Listening wiederholen','listenStart')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function listenNext(){listenQuestion();}

const writingKey=()=>`vb2writing_${soloName}_unit2`;
function writingLoad(){try{return JSON.parse(localStorage.getItem(writingKey())||'null')||{texts:{},plans:{},checks:{},complete:{}};}catch{return {texts:{},plans:{},checks:{},complete:{}};}}
async function syncWritingProgress(s=writingLoad()){if(!db||!uid||!soloName)return;const done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length,now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/writingUnit2`),{done,total:WRITING_TASKS.length,completed:s.complete||{},currentTask:WRITING_TASKS[writingIndex]?.title||'',active:true,updatedAt:now,timestamp:now});}catch{msg('Writing bleibt auf diesem Handy gespeichert; Online-Speicherung ist gerade nicht verfügbar.',true);}}
function writingSaveField(field,value){const s=writingLoad(),t=WRITING_TASKS[writingIndex];if(!t)return;s[field]=s[field]||{};if(field==='checks'){s[field][t.id]=s[field][t.id]||[];s[field][t.id][value.index]=value.checked;}else s[field][t.id]=value;localStorage.setItem(writingKey(),JSON.stringify(s));if(writingSyncTimer)clearTimeout(writingSyncTimer);writingSyncTimer=setTimeout(()=>void syncWritingProgress(s),700);}
function writingMenu(){if(!soloName){soloChooseName();return;}const s=writingLoad(),done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length;app.innerHTML=card(`<h2>✍️ Writing · Unit 2</h2><p>Übe Schritt für Schritt: planen, schreiben, mit einem Beispiel vergleichen und selbst prüfen.</p><div class="solo-game"><h3>💡 Adjektiv oder Adverb?</h3><p><strong>Adj
ektive</strong> beschreiben Dinge oder Personen: <em>a fast sport</em> (ein schneller Sport).</p><p><strong>Adverbien</strong> beschreiben, wie jemand etwas tut: <em>run quickly</em> (schnell laufen).</p><p>Oft kommt <strong>-ly</strong> dazu: careful → carefully, slow → slowly, easy → easily. Merke: fast → fast, hard → hard, good → well.</p></div><p>${done} von ${WRITING_TASKS.length} Aufgaben selbst geprüft</p>${WRITING_TASKS.map((t,i)=>`<div class="solo-game"><h3>${esc(t.title)} ${s.complete?.[t.id]?'✅':''}</h3><p>${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p><div class="solo-actions">${btn(s.complete?.[t.id]?'Weiter üben':'Aufgabe öffnen',`writingOpen${i}`)}</div></div>`).join('')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function writingOpen(i){if(!WRITING_TASKS[i])return;writingIndex=i;writingModelVisible=false;void recordLearningActivity(soloName,`english_writing_task${i+1}`);writingRender();void syncWritingProgress();}
function writingRender(){const t=WRITING_TASKS[writingIndex];if(!t){writingMenu();return;}const s=writingLoad(),text=String(s.texts?.[t.id]||''),plan=String(s.plans?.[t.id]||''),checks=s.checks?.[t.id]||[];app.innerHTML=card(`<h2>✍️ ${esc(t.title)}</h2><p><strong>Deine Aufgabe:</strong> ${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p><div class="solo-game"><h3>So gehst du vor</h3><ol>${t.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Satzanfänge als Hilfe</h3>${t.frames.map(x=>`<p><code>${esc(x)}</code></p>`).join('')}</div>${t.id==='article'?`<label>Meine Stichpunkte<textarea data-writingplan rows="4" maxlength="1500" placeholder="Sportart · was ist daran toll? · was tut man? · was braucht man? · wie sollte man sein?" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(plan)}</textarea></label>`:''}<label>Dein Text<textarea data-writingtext rows="10" maxlength="5000" placeholder="Schreibe deinen eigenen Text hier …" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(text)}</textarea></label><p class="muted">Dein Text wird automatisch auf diesem Handy gespeichert.</p>${btn(writingModelVisible?'Musterlösung ausblenden':'Musterlösung ansehen','writingModel','alt')}${writingModelVisible?`<div class="solo-game"><h3>Musterlösung</h3><p style="white-space:pre-wrap;line-height:1.6">${esc(t.model)}</p><p class="muted">Vergleiche die Ideen und schreibe deine eigene Version.</p></div>`:''}<div class="solo-game"><h3>Meine Checkliste</h3>${t.checklist.map((x,i)=>`<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><input type="checkbox" data-writingcheck="${i}" ${checks[i]?'checked':''} style="width:auto;margin-top:4px"> <span>${esc(x)}</span></label>`).join('')}</div><div class="solo-actions">${btn(s.complete?.[t.id]?'Als noch offen markieren':'Ich habe geprüft – Aufgabe abschließen','writingComplete')}${writingIndex>0?btn('← Vorige Aufgabe',`writingOpen${writingIndex-1}`,'alt'):''}${writingIndex<WRITING_TASKS.length-1?btn('Nächste Aufgabe →',`writingOpen${writingIndex+1}`,'alt'):''}</div>`)+card(btn('Zur Writing-Übersicht','writingMenu','alt'));}
function writingToggleComplete(){const t=WRITING_TASKS[writingIndex],s=writingLoad();if(!t)return;s.complete=s.complete||{};if(s.complete[t.id])delete s.complete[t.id];else{if(!String(s.texts?.[t.id]||'').trim()){msg('Schreibe erst deinen Text und vergleiche ihn mit der Musterlösung.',true);return;}if((s.checks?.[t.id]||[]).filter(Boolean).length<t.checklist.length){msg('Prüfe alle Punkte in der Checkliste, bevor du die Aufgabe abschließt.',true);return;}s.complete[t.id]=true;}localStorage.setItem(writingKey(),JSON.stringify(s));void syncWritingProgress(s);writingRender();}
function renderDashboard(entries){
 const latest={};
 for(const perDevice of Object.values(entries||{}))for(const [name,perBattle] of Object.entries(perDevice||{}))if(SOLO_NAMES.includes(name))for(const [battle,v] of Object.entries(perBattle||{})){
  if(!/^battle[123]$/.test(battle)||!v||typeof v!=='object'||Number(v.updatedAt||0)<=resetStamp(name))continue;
  const k=name+':'+battle;if(!latest[k]||Number(v.updatedAt)>Number(latest[k].updatedAt))latest[k]=v;
 }
 const now=Date.now();
 const cells=SOLO_NAMES.map(name=>{
  const records=[1,2,3].map(b=>latest[name+':battle'+b]);
  const last=records.filter(Boolean).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0))[0];
  const recent=last&&now-Number(last.updatedAt||0)<90000;
  const details=records.map(v=>v?`${Math.min(30,Number(v.done)||0)}/30 · ${Number(v.score)||0} P`:'–');
  const sum=records.reduce((acc,v)=>acc+(Number(v?.score)||0),0);
  const done=records.reduce((acc,v)=>acc+Math.min(30,Number(v?.done)||0),0);
  return `<tr><th scope="row">${esc(name)} ${recent?'🟢':'⚪'}</th>${details.map(d=>`<td>${d}</td>`).join('')}<td><strong>${done}/90</strong><br>${sum} P</td></tr>`;
 }).join('');
 const table=`<div style="overflow-x:auto;max-width:100%"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:490px;text-align:left"><thead><tr><th style="padding:10px 6px">Kind</th><th>Battle 1</th><th>Battle 2</th><th>Battle 3</th><th>Gesamt</th></tr></thead><tbody>${cells}</tbody></table></div>`;
 const detailRows=SOLO_NAMES.map(name=>{
  const records=[1,2,3].map(b=>latest[name+':battle'+b]);
  const last=records.filter(Boolean).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0))[0];
  const recent=last&&now-Number(last.updatedAt||0)<90000;
  return `<details style="margin:12px 0;padding:12px;background:rgba(255,255,255,.06);border-radius:12px"><summary><strong>${esc(name)}</strong> ${recent?'🟢':'⚪'} · Details ansehen</summary>${records.map((v,i)=>`<p><strong>Battle ${i+1}:</strong> ${v?`${Math.min(30,Number(v.done)||0)}/30 erledigt · ${Number(v.correct)||0} richtig · ${Number(v.score)||0} Punkte · zuletzt ${v.updatedAt?new Date(v.updatedAt).toLocaleString('de-DE'):'–'}`:'Noch keine Online-Daten'}</p>`).join('')}</details>`;
 }).join('');
 app.innerHTML=card('<h2>📊 Live-Lernübersicht</h2><p>Alle vier Kinder auf einen Blick. In den Battle-Spalten steht: erledigte Fragen / 30 · Punkte. 🟢 bedeutet Aktivität in den letzten 90 Sekunden.</p>'+table+'<p class="muted">Wische die Tabelle seitlich, um alle Spalten zu sehen.</p><h3>Einzelheiten</h3>'+detailRows)+card(btn('Zurück','home','alt'));
}
function showDashboard(){
 stopDashboard();stopSoloHeartbeat();
 app.innerHTML=card('<h2>📊 Live-Lernübersicht</h2><p>Online-Lernstände werden geladen …</p>')+card(btn('Zurück','home','alt'));
 if(!uid){msg('Bitte kurz warten, bis die Anmeldung abgeschlossen ist.',true);return;}
 dashboardUnsubscribe=onValue(ref(db,'soloProgress'),snap=>{renderDashboard(snap.val());},e=>msg('Lernübersicht konnte nicht geladen werden: '+e.message,true));
}

// === Mathe Klasse 7 NRW: rationale Zahlen ===
let mathName='',mathRun=null,mathView='',mathPracticeGroup='proportional',mathPendingAction='',mathPendingSolution=null,fractionPendingSolution=null;
const mathKey=(n,b)=>`vb2math_${n}_battle_${b+1}`;
const MATH_CARDS=[
 ['Was sind rationale Zahlen?','Rationale Zahlen lassen sich als Bruch schreiben: Zähler und Nenner sind ganze Zahlen, der Nenner ist nicht 0.'],
 ['Wie schreibt man −3 als rationale Zahl?','−3 = −3/1.'],
 ['Was ist ein Bruch?','Ein Bruch besteht aus Zähler (oben) und Nenner (unten).'],
 ['Wie addiert man Brüche?','Auf einen gemeinsamen Nenner bringen, dann die Zähler addieren.'],
 ['Berechne: 1/4 + 2/4','(1 + 2)/4 = 3/4.'],
 ['Wie subtrahiert man Brüche?','Auf einen gemeinsamen Nenner bringen, dann die Zähler subtrahieren.'],
 ['Berechne: 5/6 − 1/3','1/3 = 2/6, also 5/6 − 2/6 = 3/6 = 1/2.'],
 ['Wie multipliziert man Brüche?','Zähler mal Zähler und Nenner mal Nenner.'],
 ['Berechne: 2/3 × 3/4','(2 × 3)/(3 × 4) = 6/12 = 1/2.'],
 ['Wie dividiert man Brüche?','Den ersten Bruch mit dem Kehrwert des zweiten multiplizieren.'],
 ['Berechne: 3/5 ÷ 2/7','3/5 × 7/2 = 21/10 = 2 1/10.'],
 ['Was ist der Kehrwert einer Zahl?','Der Bruch, bei dem Zähler und Nenner vertauscht sind.'],
 ['Wie vergleicht man rationale Zahlen?','Auf einen gemeinsamen Nenner bringen oder als Dezimalzahlen schreiben.'],
 ['Was ist größer: 3/4 oder 5/8?','3/4 = 6/8 und 6/8 > 5/8. Also ist 3/4 größer.'],
 ['Wie wird eine gemischte Zahl zum unechten Bruch?','Ganze Zahl × Nenner + Zähler. Das Ergebnis wird der neue Zähler; der Nenner bleibt gleich.'],
 ['Wandle 2 1/3 in einen unechten Bruch um.','2 × 3 + 1 = 7, also 7/3.'],
 ['Wie wird ein unechter Bruch zur gemischten Zahl?','Zähler durch Nenner teilen. Der Quotient ist die ganze Zahl, der Rest wird der Zähler.'],
 ['Wandle 9/4 in eine gemischte Zahl um.','9 ÷ 4 = 2 Rest 1, also 2 1/4.'],
 ['Was bedeutet Kürzen?','Zähler und Nenner durch dieselbe Zahl teilen, am besten durch einen gemeinsamen Teiler.'],
 ['Kürze 8/12.','8/12 = (8 ÷ 4)/(12 ÷ 4) = 2/3.']
];
function mathLoad(n,b){try{return JSON.parse(localStorage.getItem(mathKey(n,b))||'null');}catch{return null;}}
function mathSave(){if(!mathRun)return;mathRun.updatedAt=Date.now();localStorage.setItem(mathKey(mathName,mathRun.b),JSON.stringify(mathRun));touchLearningActivity(mathName,mathActivityId(mathRun.b));void mathSync();}
async function mathSync(){
 if(!db||!uid||!mathRun||!mathName||!resetReady)return;
 const currentRun=mathRun,name=mathName,device=uid,savedAt=Number(mathRun.updatedAt)||0;
 try{
  const rs=await get(ref(db,'learningResets'));
  applyResetState(rs.val());
  const moduleStamp=currentRun.b===5?(Number(resetState[name+'__math_battle6'])||0):currentRun.b===6?(Number(resetState[name+'__math_proportional'])||0):currentRun.b>=7&&currentRun.b<=9?(Number(resetState[name+'__math_proportional_exam'+(currentRun.b-6)])||0):currentRun.b>=10&&currentRun.b<=18?(Number(resetState[name+'__math_proportional_practice_'+MATH_PROPORTIONAL_PRACTICE_BLOCKS[currentRun.b-10]?.id])||0):0;
  if(!resetReady||mathRun!==currentRun||mathName!==name||savedAt<=Math.max(resetStamp(name,'math'),moduleStamp))return;
  await set(ref(db,`mathProgress/${device}/${name}/battle${currentRun.b+1}`),{done:currentRun.index,score:currentRun.score,mistakes:currentRun.mistakes,updatedAt:savedAt,finished:!!currentRun.finished});
 }catch(e){msg('Mathe online noch nicht verfügbar – der Fortschritt bleibt auf diesem Gerät gespeichert.',true);}
}
function mathChoose(){mathRun=null;mathView='';app.innerHTML=card('<h2>🔢 Mathe · Klasse 7 NRW</h2><p>Wähle ein Kapitel zum Lernen oder eine Klassenarbeit.</p><div class="name-actions">'+btn('➗ Bruchrechnung','mathViewFractions','math-choice-fractions')+btn('🔢 Rationale Zahlen','mathViewRational','math-choice-rational')+btn('📈 Proportional / Antiproportional','mathViewProportional','math-choice-proportional')+btn('📝 Klassenarbeit Brüche','mathViewExam','math-choice-exam-fractions')+btn('📝 Klassenarbeit Rationale Zahlen','mathViewRationalExam','math-choice-exam-rational')+btn('📝 Klassenarbeit Proportional / Antiproportional','mathViewProportionalExam','math-choice-proportional-exam')+'</div>'+btn('📊 Tages-/Wochenauswertung Mathe','errorMath','alt'))+card(btn('Zur Fächerauswahl','home','alt'));}
function mathSelectView(view){mathView=view;mathHome();if(view==='proportional')window.scrollTo(0,0);}
function mathNeedName(action){if(mathName)return false;mathPendingAction=action;app.innerHTML=card('<h2>📚 Wer lernt gerade?</h2><p>Wähle deinen Namen, damit dein Lernstand gespeichert wird.</p><div class="name-actions">'+SOLO_NAMES.map((n,i)=>btn(esc(n),`mathName${i}`)).join('')+'</div>')+card(btn('Zur Aufgabenübersicht','mathHome','alt'));return true;}
function mathSetName(i){mathName=SOLO_NAMES[i];const action=mathPendingAction;mathPendingAction='';if(action)mathAction(action);else mathHome();}
function mathHome(){mathRun=null;const back=card(btn('Zur Mathe-Auswahl','mathChoose','alt'))+card(btn('Fach wechseln','home','alt'));
 if(mathView==='fractions'){const fractions=FRACTION_MODULES.map(m=>{const v=fractionLoad(mathName,m.id);return '<div class="player"><h3>'+esc(m.title)+'</h3><p>'+Math.min(m.questions.length,Number(v?.index)||0)+'/'+m.questions.length+' Aufgaben · '+(Number(v?.score)||0)+' Punkte'+(v?.finished?' · abgeschlossen':'')+'</p>'+btn(v?.index&&!v.finished?'Weiterlernen':v?.finished?'Noch einmal üben':'Erklärung & Start','fractionOpen_'+m.id)+'</div>';}).join('');app.innerHTML=card('<h2>➗ Bruchrechnung · Klasse 7'+(mathName?' · '+esc(mathName):'')+'</h2><p>Erklärungen und Übungsfragen zu allen sieben Themen.</p>'+fractions+btn('📕 Meine Mathe-Fehlerliste','mathMistakes','alt'))+back;return;}
 if(mathView==='exam'){const x=mathLoad(mathName,4),done=Math.min(MATH_EXAM_BATTLE.length,Number(x?.index)||0);app.innerHTML=card('<h2>📝 Klassenarbeit Brüche & Rationale Zahlen'+(mathName?' · '+esc(mathName):'')+'</h2><p>20 gemischte Aufgaben zu rationalen Zahlen und Bruchrechnung.</p><div class="player"><h3>Klassenarbeit Brüche & Rationale Zahlen</h3><p>'+done+'/'+MATH_EXAM_BATTLE.length+' Aufgaben · '+(Number(x?.score)||0)+' Punkte'+(x?.finished?' · abgeschlossen':'')+'</p>'+btn(x?.finished?'Noch einmal üben':done>0?'Neu beginnen':'Klassenarbeit starten','mathStart4')+(x&&!x.finished&&done>0?btn('Fortsetzen','mathResume4','alt'):'')+'</div>')+back;return;}
 if(mathView==='rationalExam'){const x=mathLoad(mathName,5),done=Math.min(MATH_RATIONAL_EXAM_BATTLE.length,Number(x?.index)||0);app.innerHTML=card('<h2>📝 Mathe Klassenarbeit Rationale Zahlen'+(mathName?' · '+esc(mathName):'')+'</h2><p>20 Aufgaben zu Vergleichen, Betrag, Rechenregeln und gemischten Rechnungen mit rationalen Zahlen.</p><div class="player"><h3>Klassenarbeit Rationale Zahlen</h3><p>'+done+'/'+MATH_RATIONAL_EXAM_BATTLE.length+' Aufgaben · '+(Number(x?.score)||0)+' Punkte'+(x?.finished?' · abgeschlossen':'')+'</p>'+btn(x?.finished?'Noch einmal üben':done>0?'Neu beginnen':'Klassenarbeit starten','mathStart5')+(x&&!x.finished&&done>0?btn('Fortsetzen','mathResume5','alt'):'')+'</div>')+back;return;}
 if(mathView==='proportionalExam'){
 const classworks=MATH_PROPORTIONAL_CLASSWORKS.map((exam,index)=>{const b=7+index,s=mathLoad(mathName,b),finished=!!s?.finished,completed=Math.min(exam.questions.length,Number(s?.index)||0);return '<div class="player proportional-test-card"><h3>📝 '+esc(exam.title)+'</h3><p>Empfohlene Arbeitszeit: 45 Minuten · 15 Aufgaben · 30 Punkte</p><p>'+completed+'/15 Aufgaben · '+(Number(s?.score)||0)+'/30 Punkte'+(finished?' · abgeschlossen':'')+'</p>'+btn(finished?'Noch einmal üben':completed?'Neu beginnen':'Klassenarbeit starten','mathStart'+b)+(s&&!finished&&completed?btn('Fortsetzen','mathResume'+b,'alt'):'')+'</div>';}).join('');
 app.innerHTML=card('<h2>📝 Klassenarbeiten · Proportional / Antiproportional'+(mathName?' · '+esc(mathName):'')+'</h2><p>Wähle eine der drei Arbeiten. Jede umfasst 15 Aufgaben, 30 Punkte und 45 Minuten. Bei falschen Antworten werden Lösung und Rechenweg angezeigt.</p>'+classworks)+back;return;
 }
 if(mathView==='proportionalPractice'){
  const firstIndex=mathPracticeGroup==='proportional'?0:mathPracticeGroup==='antiproportional'?3:6;
  const chosenBlocks=MATH_PROPORTIONAL_PRACTICE_BLOCKS.slice(firstIndex,firstIndex+3).map((block,choiceIndex)=>{const index=firstIndex+choiceIndex,b=10+index,s=mathLoad(mathName,b),done=Math.min(block.questions.length,Number(s?.index)||0),finished=!!s?.finished,button=finished?'Block '+(choiceIndex+1)+' noch einmal':done?'Block '+(choiceIndex+1)+' neu starten':'Block '+(choiceIndex+1)+' starten';return '<div class="player proportional-test-card"><h3>'+esc(block.title)+'</h3><p>15 Lernaufgaben · 15 Punkte</p><p>'+done+'/15 Aufgaben · '+(Number(s?.score)||0)+'/15 Punkte'+(finished?' · abgeschlossen':'')+'</p>'+btn(button,'mathStart'+b)+(s&&!finished&&done?btn('Fortsetzen','mathResume'+b,'alt'):'')+'</div>';}).join('');
  const heading=mathPracticeGroup==='proportional'?'↗ Proportional':mathPracticeGroup==='antiproportional'?'↕ Antiproportional':'🟣 Gemischte Aufgaben';
  app.innerHTML=card('<h2>'+heading+' · Aufgaben auswählen</h2><p>Wähle einen der drei Blöcke.</p>'+chosenBlocks)+card(btn('Zurück zu Formeln und Auswahl','mathViewProportional','alt'))+card(btn('Zur Mathe-Auswahl','mathChoose','alt'));return;
 }
 if(mathView==='proportional'){
 const practiceCards=MATH_PROPORTIONAL_PRACTICE_BLOCKS.map((block,index)=>{const b=10+index,s=mathLoad(mathName,b),done=Math.min(block.questions.length,Number(s?.index)||0),finished=!!s?.finished,button=finished?'Noch einmal üben':done?'Neu beginnen':'Übung starten';return '<div class="player proportional-test-card"><h3>'+esc(block.title)+'</h3><p>15 Lernaufgaben · 15 Punkte</p><p>'+done+'/15 Aufgaben · '+(Number(s?.score)||0)+'/15 Punkte'+(finished?' · abgeschlossen':'')+'</p>'+btn(button,'mathStart'+b)+(s&&!finished&&done?btn('Fortsetzen','mathResume'+b,'alt'):'')+'</div>';});
 const practiceTabs='<div class="proportional-practice-tabs" role="group" aria-label="Übungsart auswählen"><button type="button" class="proportional-practice-button proportional-practice-pro" data-action="mathPracticePro">↗ Proportional</button><button type="button" class="proportional-practice-button proportional-practice-anti" data-action="mathPracticeAnti">↕ Antiproportional</button><button type="button" class="proportional-practice-button proportional-practice-mixed" data-action="mathPracticeMixed">⚖️ Gemischte Aufgaben</button></div>';
 const practicePanel='<section class="proportional-practice-panel"><h3>Übungswege</h3><p>Wähle, was du üben möchtest.</p>'+practiceTabs+'</section>';
 const proportionalTable='<div class="proportional-table-wrap"><table class="proportional-table"><caption>Gleicher Preis: 2 € pro Heft</caption><tbody><tr><th scope="row">Anzahl Hefte (x)</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th scope="row">Preis in € (y)</th><td>2</td><td>4</td><td>6</td><td>8</td></tr><tr class="table-rule"><th scope="row">Quotient y : x</th><td>2</td><td>2</td><td>2</td><td>2</td></tr></tbody></table></div>';
 const antiproportionalTable='<div class="proportional-table-wrap"><table class="proportional-table"><caption>Dieselbe Arbeit: 12 Arbeiterstunden</caption><tbody><tr><th scope="row">Arbeiter (x)</th><td>1</td><td>2</td><td>3</td><td>4</td></tr><tr><th scope="row">Zeit in Stunden (y)</th><td>12</td><td>6</td><td>4</td><td>3</td></tr><tr class="table-rule"><th scope="row">Produkt x · y</th><td>12</td><td>12</td><td>12</td><td>12</td></tr></tbody></table></div>';
 const proportionalVideo='<a class="proportional-video-link" href="https://studyflix.de/mathematik/proportionale-zuordnung-3238/video" target="_blank" rel="noopener noreferrer">▶️ Erklärvideo starten: Proportional</a>';
 const antiproportionalVideo='<a class="proportional-video-link" href="https://studyflix.de/mathematik/antiproportionale-zuordnung-3254/video" target="_blank" rel="noopener noreferrer">▶️ Erklärvideo starten: Antiproportional</a>';
 app.innerHTML=card('<h2>📈 Proportional / Antiproportional'+(mathName?' · '+esc(mathName):'')+'</h2><p class="proportional-meta">Klasse 7 · NRW</p>'+practicePanel+'<div class="proportional-notes"><article class="proportional-note proportional-card"><div class="proportional-note-heading"><span class="proportional-note-icon">↗</span><div><span class="proportional-kicker">Verstehen</span><h3>Proportional</h3></div><strong class="proportional-formula">y : x = k</strong></div><p>Beide Größen verändern sich im gleichen Verhältnis. Der Quotient bleibt gleich.</p><div class="proportional-example"><strong>Beispiel</strong><p>2 Stunden → 140 km. Pro Stunde sind das 140 : 2 = 70 km. In 3,5 Stunden sind es 70 · 3,5 = 245 km.</p><p>So sieht eine proportionale Tabelle aus: Je mehr Hefte, desto höher der Preis. Der Quotient bleibt immer 2.</p>'+proportionalTable+proportionalVideo+'</div></article><article class="proportional-note antiproportional-card"><div class="proportional-note-heading"><span class="proportional-note-icon">↕</span><div><span class="proportional-kicker">Verstehen</span><h3>Antiproportional</h3></div><strong class="proportional-formula">x · y = k</strong></div><p>Wird eine Größe größer, wird die andere entsprechend kleiner. Das Produkt bleibt gleich.</p><div class="proportional-example"><strong>Beispiel</strong><p>4 Arbeiter · 12 Stunden = 48 Arbeiterstunden. Mit 6 Arbeitern dauert es 48 : 6 = 8 Stunden.</p><p>In dieser Tabelle bleibt das Produkt aus Arbeiterzahl und Zeit immer 12.</p>'+antiproportionalTable+antiproportionalVideo+'</div></article></div><div class="proportional-material-panel"><h3>Erklärungen und Lernmaterial</h3><p>Zum Verstehen und Wiederholen.</p><div class="proportional-material-buttons">'+btn('📄 Arbeitsblatt','mathProportionalWorksheet')+btn('📖 Lernkarten','mathProportionalFlashcards')+'</div></div>'+btn('📕 Meine Mathe-Fehlerliste','mathMistakes','alt'))+back;return;
}
 const titles=['Zahlen vergleichen, addieren und subtrahieren','Multiplizieren und dividieren','Klammern und gemischte Rechnungen'];const battles=titles.map((t,b)=>{const x=mathLoad(mathName,b);return '<div class="player"><h3>'+RATIONAL_MATH_TITLES[b]+'</h3><p>'+esc(t)+'</p><p>'+(x?.index||0)+'/30 Aufgaben · '+(x?.score||0)+' Punkte</p>'+btn('Neu beginnen','mathStart'+b)+((x&&!x.finished)?btn('Fortsetzen','mathResume'+b,'alt'):'')+'</div>';}).join('');const x=mathLoad(mathName,3);const exercise='<div class="player"><h3>'+RATIONAL_MATH_TITLES[3]+'</h3><p>Merkkarten zu Brüchen, Rechenregeln, Vergleichen und Umwandeln</p><p>'+Math.min(MATH_CARDS.length,Number(x?.index)||0)+'/'+MATH_CARDS.length+' Karten · '+(Number(x?.score)||0)+' Punkte'+(x?.finished?' · abgeschlossen':'')+(x?.missed?.length?' · 🔁 '+x.missed.length+' zum Wiederholen':'')+'</p>'+btn(x&&x.index>0&&!x.finished?'Weiterlernen':x?.finished?'Noch einmal üben':'Starten','mathFlashStart')+(x&&x.index>0&&!x.finished?btn('Fortsetzen','mathFlashResume','alt'):'')+'</div>';app.innerHTML=card('<h2>🔢 Rationale Zahlen · Klasse 7'+(mathName?' · '+esc(mathName):'')+'</h2><p>Zahlen vergleichen, rechnen und umwandeln.</p>'+exercise+battles+btn('📕 Meine Mathe-Fehlerliste','mathMistakes','alt'))+back;}
let fractionRun=null;
function fractionLoad(name,id){try{return JSON.parse(localStorage.getItem('vb2math_'+name+'_fraction_'+id)||'null');}catch{return null;}}
function fractionSave(){if(!fractionRun||!mathName)return;fractionRun.updatedAt=Date.now();localStorage.setItem('vb2math_'+mathName+'_fraction_'+fractionRun.id,JSON.stringify(fractionRun));touchLearningActivity(mathName,'math_fraction_'+fractionRun.id);void fractionSync();}
async function fractionSync(){if(!db||!uid||!fractionRun||!mathName||!resetReady)return;try{const stamp=Number(resetState[mathName+'__math_fraction_'+fractionRun.id])||resetStamp(mathName,'math');if(fractionRun.updatedAt<=stamp)return;await set(ref(db,'mathProgress/'+uid+'/'+mathName+'/fraction_'+fractionRun.id),{done:fractionRun.index,score:fractionRun.score,mistakes:fractionRun.mistakes,updatedAt:fractionRun.updatedAt,finished:!!fractionRun.finished});}catch(e){msg('Bruch-Fortschritt online noch nicht verfügbar. Lokal bleibt er gespeichert.',true);}}
function fractionOpen(id){const m=FRACTION_MODULES.find(x=>x.id===id);if(!m)return;fractionRun=null;const v=fractionLoad(mathName,id);app.innerHTML=card('<h2>➗ '+esc(m.title)+'</h2><h3>So geht’s</h3><p>'+mathText(m.lesson)+'</p><div class="player"><strong>Beispiel:</strong><p>'+mathText(m.example)+'</p></div><p>'+(v?Math.min(m.questions.length,Number(v.index)||0)+'/'+m.questions.length+' Aufgaben · '+(Number(v.score)||0)+' Punkte':'')+'</p>'+btn(v?.index&&!v.finished?'Weiterlernen':v?.finished?'Noch einmal üben':'Übung starten','fractionStart_'+id))+card(btn('Zur Mathe-Übersicht','mathHome','alt'));}
function fractionStart(id){if(mathNeedName('fractionStart_'+id))return;const old=fractionLoad(mathName,id),m=FRACTION_MODULES.find(x=>x.id===id);if(!m)return;fractionRun=old&&!old.finished?old:{id:id,index:0,score:0,finished:false,mistakes:{}};void recordLearningActivity(mathName,'math_fraction_'+id);fractionSave();fractionQuestion();}
function fractionQuestion(){if(!fractionRun)return;const m=FRACTION_MODULES.find(x=>x.id===fractionRun.id);if(!m)return;if(fractionRun.index>=m.questions.length){fractionRun.finished=true;fractionSave();app.innerHTML=card('<h2>🏁 '+esc(m.title)+' geschafft!</h2><p>'+fractionRun.score+' von '+(m.questions.length*10)+' Punkten</p>'+btn('Zur Mathe-Übersicht','mathHome'));return;}const q=m.questions[fractionRun.index];app.innerHTML=card('<h2>➗ '+esc(m.shortTitle)+'</h2><p>Aufgabe '+(fractionRun.index+1)+' von '+m.questions.length+' · '+fractionRun.score+' Punkte</p><h3>'+mathText(q.q)+'</h3><div class="answers">'+q.options.map((o,i)=>'<button data-fractionanswer="'+i+'">'+mathText(o)+'</button>').join('')+'</div>')+card(btn('Zur Übersicht','mathHome','alt'));}
function fractionAnswer(i){if(!fractionRun)return;const m=FRACTION_MODULES.find(x=>x.id===fractionRun.id),questionIndex=fractionRun.index,q=m?.questions[questionIndex];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;document.querySelectorAll('[data-fractionanswer]').forEach(el=>el.disabled=true);const ok=i===q.correct;void recordLearningError(mathName,'math',`math_fraction_${m.id}`,questionIndex,`Bruchrechnung · ${m.title}`,q,ok);if(ok)fractionRun.score+=10;else fractionRun.mistakes[questionIndex]=(fractionRun.mistakes[questionIndex]||0)+1;fractionRun.index++;fractionSave();if(!ok){fractionPendingSolution={q};app.innerHTML=card('<h2>❌ Schau noch einmal auf die Regel</h2><p>💡 Tipp: Überlege, ob du zuerst gleichnamig machen, kürzen oder die passende Rechenregel anwenden musst.</p>'+btn('Lösung und Rechenweg ansehen','fractionShowSolution'));return;}app.innerHTML=card('<h2>✅ Richtig!</h2><p>'+fractionRun.score+' Punkte</p>'+btn('Weiter ➜','fractionNext'));}
function fractionShowSolution(){if(!fractionPendingSolution)return;const q=fractionPendingSolution.q;fractionPendingSolution=null;app.innerHTML=card('<h2>❌ Richtige Lösung</h2><p><strong>Antwort:</strong> '+mathText(q.options[q.correct])+'</p><p style="white-space:pre-line"><strong>Rechenweg:</strong> '+mathText(q.explain)+'</p><p>'+fractionRun.score+' Punkte</p>'+btn('Weiter ➜','fractionNext'));}
function mathStart(b,resume=false){if(mathNeedName((resume?'mathResume':'mathStart')+b))return;const s=resume?mathLoad(mathName,b):null;mathRun=s&&s.index>=0?s:{b,index:0,score:0,finished:false,mistakes:{}};void recordLearningActivity(mathName,mathActivityId(b));mathSave();mathQuestion();}
function mathExamData(b){
 if(b===4)return {title:'Mathe-Klassenarbeit',questions:MATH_EXAM_BATTLE};
 if(b===5)return {title:'Mathe Klassenarbeit Rationale Zahlen',questions:MATH_RATIONAL_EXAM_BATTLE};
 if(b===6)return {title:'Proportional / Antiproportional · Übungsbattle',questions:MATH_PROPORTIONAL_EXAM_BATTLE};
 if(b>=7&&b<=9){const exam=MATH_PROPORTIONAL_CLASSWORKS[b-7];return exam?{title:exam.title,questions:exam.questions,points:exam.points}:null;}
 if(b>=10&&b<=18){const block=MATH_PROPORTIONAL_PRACTICE_BLOCKS[b-10];return block?{title:block.title,questions:block.questions,points:block.points}:null;}
 return null;
}
function mathQuestion(){
 if(!mathRun)return;
 const exam=mathExamData(mathRun.b),questions=exam?.questions,total=questions?.length||30,maxPoints=exam?.points||total*10;
 if(mathRun.index>=total){mathRun.finished=true;mathSave();app.innerHTML=card('<h2>🏆 '+esc(exam?.title||RATIONAL_MATH_TITLES[mathRun.b]+' geschafft!')+'</h2><p>'+mathRun.score+' von '+maxPoints+' Punkten</p>'+btn('Zur Übersicht','mathHome'));return;}
 const q=questions?questions[mathRun.index]:MATH_BATTLES[mathRun.b][mathRun.index],title=exam?.title||RATIONAL_MATH_TITLES[mathRun.b];
 app.innerHTML=card('<h2>🔢 '+esc(title)+'</h2><p>Aufgabe '+(mathRun.index+1)+'/'+total+' · '+mathRun.score+'/'+maxPoints+' Punkte</p><h2>'+mathText(q.q)+'</h2><div class="answers">'+q.options.map((o,i)=>'<button data-mathanswer="'+i+'">'+mathText(o)+'</button>').join('')+'</div>')+card(btn('Zur Mathe-Übersicht','mathHome','alt'));
}
function mathAnswer(i){
 if(!mathRun)return;
 const exam=mathExamData(mathRun.b),questions=exam?.questions,total=questions?.length||30;
 if(mathRun.index>=total)return;
 const q=questions?questions[mathRun.index]:MATH_BATTLES[mathRun.b][mathRun.index],ok=i===q.correct;
 document.querySelectorAll('[data-mathanswer]').forEach(el=>el.disabled=true);
 const exercise=mathActivityId(mathRun.b),topic=mathExamData(mathRun.b)?.title||RATIONAL_MATH_TITLES[mathRun.b]||'Mathe';void recordLearningError(mathName,'math',exercise,mathRun.index,topic,q,ok);if(ok)mathRun.score+=Number(q.points)||10;else mathRun.mistakes[mathRun.index]=(mathRun.mistakes[mathRun.index]||0)+1;
 mathRun.index++;mathSave();
 if(!ok){mathPendingSolution={q};app.innerHTML=card('<h2>❌ Noch nicht richtig</h2><p>💡 Tipp: Lies die Aufgabe noch einmal und überlege, welche Regel oder Rechnung dazu passt. Rechne Schritt für Schritt.</p>'+btn('Lösung und Rechenweg ansehen','mathShowSolution'));return;}
 app.innerHTML=card('<h2>✅ Richtig!</h2><p>'+mathRun.score+' Punkte</p>'+btn('Weiter ➜','mathNext'));
}
function mathShowSolution(){if(!mathPendingSolution)return;const q=mathPendingSolution.q;mathPendingSolution=null;app.innerHTML=card('<h2>❌ Richtige Lösung</h2><p><strong>Antwort:</strong> '+mathText(q.options[q.correct])+'</p><p><strong>Rechenweg:</strong> '+mathText(q.explanation||q.explain||'')+'</p><p>'+mathRun.score+' Punkte</p>'+btn('Weiter ➜','mathNext'));}
function mathFlashStart(){if(mathNeedName('mathFlashStart'))return;mathRun={b:3,index:0,score:0,finished:false,mistakes:{},missed:[],review:false,reviewPos:0,revealed:false};void recordLearningActivity(mathName,'math_rational_cards');mathSave();mathFlashShow();}
function mathFlashResume(){if(mathNeedName('mathFlashResume'))return;const s=mathLoad(mathName,3);if(!s){mathFlashStart();return;}void recordLearningActivity(mathName,'math_rational_cards');mathRun={...s,b:3,missed:Array.isArray(s.missed)?s.missed:[],mistakes:s.mistakes||{},review:!!s.review,reviewPos:Number(s.reviewPos)||0,revealed:false};mathFlashShow();}
function mathFlashShow(){if(!mathRun)return;const cards=MATH_CARDS;if(!mathRun.review&&mathRun.index>=cards.length){if(mathRun.missed.length){mathRun.review=true;mathRun.reviewPos=0;mathRun.revealed=false;mathSave();}else{mathRun.finished=true;mathSave();app.innerHTML=card(`<h2>🏁 ${RATIONAL_MATH_TITLES[3]} geschafft!</h2><p>Du hast alle ${cards.length} Karten gelernt.</p><p class="score">${mathRun.score} von ${cards.length*10} Punkten</p>${btn('Zur Mathe-Übersicht','mathHome')}`);return;}}
 if(mathRun.review&&!mathRun.missed.length){mathRun.review=false;mathRun.finished=true;mathSave();app.innerHTML=card(`<h2>🏆 ${RATIONAL_MATH_TITLES[3]} geschafft!</h2><p>Du hast alle Karten noch einmal geübt.</p><p class="score">${mathRun.score} von ${cards.length*10} Punkten</p>${btn('Zur Mathe-Übersicht','mathHome')}`);return;}
 const index=mathRun.review?mathRun.missed[mathRun.reviewPos]:mathRun.index,[q,a]=cards[index];const num=mathRun.review?`Wiederholung ${mathRun.reviewPos+1} von ${mathRun.missed.length}`:`Karte ${mathRun.index+1} von ${cards.length}`;app.innerHTML=card(`<p class="muted">🔢 ${RATIONAL_MATH_TITLES[3]} · ${num} · ${mathRun.score} Punkte</p><div class="bar"><div class="fill" style="width:${mathRun.index/cards.length*100}%"></div></div><h2 style="margin-top:20px">${mathText(q)}</h2>${mathRun.revealed?`<div class="player"><strong>Antwort</strong><p>${mathText(a)}</p></div>${mathRun.review?btn('✅ Jetzt sicher','mathFlashReviewKnown'):btn('✅ Das kann ich','mathFlashKnown')}${mathRun.review?btn('🔁 Noch einmal','mathFlashReviewAgain','alt'):btn('🔁 Noch üben','mathFlashAgain','alt')}`:btn('💡 Antwort aufdecken','mathFlashReveal')}`)+card(btn('Zur Mathe-Übersicht','mathHome','alt'));}
function mathFlashReveal(){if(!mathRun)return;mathRun.revealed=true;mathSave();mathFlashShow();}
function mathFlashKnown(){if(!mathRun||mathRun.review)return;const index=mathRun.index,[prompt,answer]=MATH_CARDS[index]||[];void recordLearningError(mathName,'math','math_rational_cards',index,RATIONAL_MATH_TITLES[3],{
prompt,accepted:[answer||'']},true);mathRun.score+=10;mathRun.index++;mathRun.revealed=false;mathSave();mathFlashShow();}
function mathFlashAgain(){if(!mathRun||mathRun.review)return;const i=mathRun.index,[prompt,answer]=MATH_CARDS[i]||[];void recordLearningError(mathName,'math','math_rational_cards',i,RATIONAL_MATH_TITLES[3],{prompt,accepted:[answer||'']},false);if(!mathRun.missed.includes(i))mathRun.missed.push(i);mathRun.mistakes[i]=(Number(mathRun.mistakes[i])||0)+1;mathRun.index++;mathRun.revealed=false;mathSave();mathFlashShow();}
function mathFlashReviewKnown(){if(!mathRun||!mathRun.review)return;const i=mathRun.missed[mathRun.reviewPos],[prompt,answer]=MATH_CARDS[i]||[];void recordLearningError(mathName,'math','math_rational_cards',i,RATIONAL_MATH_TITLES[3],{prompt,accepted:[answer||'']},true);mathRun.missed=mathRun.missed.filter(x=>x!==i);if(mathRun.reviewPos>=mathRun.missed.length)mathRun.reviewPos=0;mathRun.revealed=false;mathSave();mathFlashShow();}
function mathFlashReviewAgain(){if(!mathRun||!mathRun.review||!mathRun.missed.length)return;mathRun.reviewPos=(mathRun.reviewPos+1)%mathRun.missed.length;mathRun.revealed=false;mathSave();mathFlashShow();}
function mathMistakes(){
 const content=[0,1,2].map(b=>{const s=mathLoad(mathName,b),m=s?.mistakes||{};return '<h3>'+RATIONAL_MATH_TITLES[b]+'</h3>'+(Object.keys(m).length?Object.entries(m).map(([i,c])=>'<p>'+mathText(MATH_BATTLES[b][Number(i)].q)+' → <strong>'+mathText(MATH_BATTLES[b][Number(i)].options[MATH_BATTLES[b][Number(i)].correct])+'</strong> · '+c+'× falsch</p>').join(''):'<p>Noch keine Fehler.</p>');}).join('');
 const s=mathLoad(mathName,3),m=s?.mistakes||{},cardErrors=Object.keys(m).map(i=>'<p>'+mathText(MATH_CARDS[Number(i)]?.[0]||'')+' → <strong>'+mathText(MATH_CARDS[Number(i)]?.[1]||'')+'</strong> · '+m[i]+'× zum Wiederholen markiert</p>').join('')||'<p>Noch keine Karten zum Wiederholen.</p>';
 const examErrors=(b,questions,title)=>{const state=mathLoad(mathName,b),items=Object.entries(state?.mistakes||{}).map(([i,count])=>{const q=questions[Number(i)];return q?'<p>'+mathText(q.q)+' → <strong>'+mathText(q.options[q.correct])+'</strong> · '+count+'× falsch</p>':'';}).join('')||'<p>Keine Fehler erfasst.</p>';return '<h3>'+esc(title)+'</h3>'+items;};
 const classworkErrors=MATH_PROPORTIONAL_CLASSWORKS.map((exam,index)=>examErrors(7+index,exam.questions,exam.title)).join('');
 const practiceErrors=MATH_PROPORTIONAL_PRACTICE_BLOCKS.map((block,index)=>examErrors(10+index,block.questions,block.title)).join('');
 app.innerHTML=card('<h2>📕 '+esc(mathName)+' · Mathe-Fehlerliste</h2>'+content+'<h3>'+RATIONAL_MATH_TITLES[3]+'</h3>'+cardErrors+examErrors(4,MATH_EXAM_BATTLE,'Klassenarbeit Brüche')+examErrors(5,MATH_RATIONAL_EXAM_BATTLE,'Klassenarbeit Rationale Zahlen')+examErrors(6,MATH_PROPORTIONAL_EXAM_BATTLE,'Proportional / Antiproportional · Übungsbattle')+classworkErrors+practiceErrors)+card(btn('Zur Mathe-Übersicht','mathHome','alt'));
}
let proportionalStudyDeck='',proportionalStudyIndex=0,proportionalStudyRevealed=false;
function mathProportionalStudyStart(deck){proportionalStudyDeck=deck;proportionalStudyIndex=0;proportionalStudyRevealed=false;void recordLearningActivity(mathName,`math_proportional_${deck}`);mathProportionalStudyShow();window.scrollTo(0,0);}
function mathProportionalStudyShow(){
 const cards=proportionalStudyDeck==='worksheet'?PROPORTIONAL_WORKSHEET_CARDS:PROPORTIONAL_FLASH_CARDS;
 const isWorksheet=proportionalStudyDeck==='worksheet';
 const title=isWorksheet?'Arbeitsblatt · Begriffe lernen':'Lernkarten · Frage und Antwort';
 const item=cards[proportionalStudyIndex];
 const frontLabel=isWorksheet?'Begriff':'Frage';
 const backLabel=isWorksheet?'Erklärung':'Antwort';
 const percent=Math.round((proportionalStudyIndex+1)/cards.length*100);
 const answer=proportionalStudyRevealed?'<div class="proportional-learning-side proportional-learning-answer"><strong>'+backLabel+'</strong><p>'+esc(item.back)+'</p></div>':btn('💡 '+backLabel+' anzeigen','mathProportionalReveal');
 const navigation=proportionalStudyRevealed?'<div class="proportional-card-nav">'+(proportionalStudyIndex>0?btn('← Zurück','mathProportionalPrevious','alt'):'<span></span>')+btn(proportionalStudyIndex+1<cards.length?'Nächste Karte →':'Fertig','mathProportionalNext')+'</div>':'';
 app.innerHTML=card('<h2>'+title+'</h2><p class="muted">Karte '+(proportionalStudyIndex+1)+' von '+cards.length+'</p><div class="bar"><div class="fill" style="width:'+percent+'%"></div></div><div class="proportional-learning-side proportional-learning-front"><strong>'+frontLabel+'</strong><h3>'+esc(item.front)+'</h3></div>'+answer+navigation)+card(btn('Zurück zum Kapitel','mathViewProportional','alt'));
}
function mathProportionalReveal(){proportionalStudyRevealed=true;mathProportionalStudyShow();}
function mathProportionalNext(){const cards=proportionalStudyDeck==='worksheet'?PROPORTIONAL_WORKSHEET_CARDS:PROPORTIONAL_FLASH_CARDS;if(proportionalStudyIndex+1>=cards.length){mathSelectView('proportional');return;}proportionalStudyIndex++;proportionalStudyRevealed=false;mathProportionalStudyShow();}
function mathProportionalPrevious(){if(proportionalStudyIndex>0)proportionalStudyIndex--;proportionalStudyRevealed=false;mathProportionalStudyShow();}
function mathAction(v){if(v.startsWith('fractionOpen_')){fractionOpen(v.slice(13));return true;}if(v.startsWith('fractionStart_')){fractionStart(v.slice(14));return true;}if(v==='fractionNext'){fractionQuestion();return true;}if(v==='mathChoose')mathChoose();else if(v==='mathViewFractions')mathSelectView('fractions');else if(v==='mathViewRational')mathSelectView('rational');else if(v==='mathViewExam')mathSelectView('exam');else if(v==='mathViewRationalExam')mathSelectView('rationalExam');else if(v==='mathViewProportional')mathSelectView('proportional');else if(v==='mathViewProportionalExam')mathSelectView('proportionalExam');else if(v==='mathPracticePro'){mathPracticeGroup='proportional';mathView='proportionalPractice';mathHome();}else if(v==='mathPracticeAnti'){mathPracticeGroup='antiproportional';mathView='proportionalPractice';mathHome();}else if(v==='mathPracticeMixed'){mathPracticeGroup='mixed';mathView='proportionalPractice';mathHome();}else if(v==='mathProportionalWorksheet')mathProportionalStudyStart('worksheet');else if(v==='mathProportionalFlashcards')mathProportionalStudyStart('flashcards');else if(v==='mathProportionalReveal')mathProportionalReveal();else if(v==='mathProportionalNext')mathProportionalNext();else if(v==='mathProportionalPrevious')mathProportionalPrevious();else if(v==='mathHome')mathHome();else if(v==='mathMistakes')mathMistakes();else if(v==='mathShowSolution')mathShowSolution();else if(v==='fractionShowSolution')fractionShowSolution();else if(v==='mathNext')mathQuestion();else if(v==='mathFlashStart')mathFlashStart();else if(v==='mathFlashResume')mathFlashResume();else if(v==='mathFlashReveal')mathFlashReveal();else if(v==='mathFlashKnown')mathFlashKnown();else if(v==='mathFlashAgain')mathFlashAgain();else if(v==='mathFlashReviewKnown')mathFlashReviewKnown();else if(v==='mathFlashReviewAgain')mathFlashReviewAgain();else if(/^mathName[0-3]$/.test(v))mathSetName(Number(v.slice(-1)));else if(/^mathStart\d+$/.test(v))mathStart(Number(v.slice(9)));else if(/^mathResume\d+$/.test(v))mathStart(Number(v.slice(10)),true);else return false;return true;}

const VOCAB_WORK_BATTLE_QUESTIONS=[
 {title:'Seite 1 · Aufgabe 1 · water sports',prompt:'Name the sports. Fill in the table. Water sports · 1.',accepted:['swimming']},
 {title:'Seite 1 · Aufgabe 1 · water sports',prompt:'Name the sports. Fill in the table. Water sports · 2.',accepted:['canoeing']},
 {title:'Seite 1 · Aufgabe 1 · water sports',prompt:'Name the sports. Fill in the table. Water sports · 3.',accepted:['rafting']},
 {title:'Seite 1 · Aufgabe 1 · ball sports',prompt:'Name the sports. Fill in the table. Ball sports · 1.',accepted:['rugby']},
 {title:'Seite 1 · Aufgabe 1 · ball sports',prompt:'Name the sports. Fill in the table. Ball sports · 2.',accepted:['netball']},
 {title:'Seite 1 · Aufgabe 1 · ball sports',prompt:'Name the sports. Fill in the table. Ball sports · 3.',accepted:['basketball']},
 {title:'Seite 1 · Aufgabe 1 · winter sport',prompt:'Name the sports. Fill in the table. Winter sport · 1.',accepted:['skiing']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “big”.',accepted:['small']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “quiet”.',accepted:['loud']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “quick”.',accepted:['slow']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “interesting”.',accepted:['boring']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “safe”.',accepted:['dangerous']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “easy”.',accepted:['difficult', 'hard']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “good”.',accepted:['bad']},
 {title:'Seite 1 · Aufgabe 2 · Find the opposites',prompt:'Find the opposite of “fit”.',accepted:['unfit']},
 {title:'Seite 1 · Aufgabe 3 · Finish the sentences',prompt:'Finish the sentence: Rugby is a very fast and ___ sport.',accepted:['tough']},
 {title:'Seite 1 · Aufgabe 3 · Finish the sentences',prompt:'Finish the sentence: There are lots of trees in the ___.',accepted:['wood', 'woods']},
 {title:'Seite 1 · Aufgabe 3 · Finish the sentences',prompt:'Finish the sentence: Let’s take a ___ to the mountains next weekend.',accepted:['trip']},
 {title:'Seite 1 · Aufgabe 3 · Finish the sentences',prompt:'Finish the sentence: You can ___ up a mountain or a tree.',accepted:['climb']},
 {title:'Seite 1 · Aufgabe 3 · Finish the sentences',prompt:'Finish the sentence: To find out what you can or can’t do in a sport, you have to learn the ___.',accepted:['rules']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: I love ___ (Freiluft-) activities.',accepted:['outdoor']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: The trip wasn’t ___ (gefährlich).',accepted:['dangerous']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: We had to wear special ___ (Ausrüstung).',accepted:['equipment']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: The equipment kept us ___ (sicher).',accepted:['safe']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: We had a friendly and ___ (geduldig) instructor.',accepted:['patient']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: She said I was very ___ (begabt).',accepted:['talented']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: Mara is a really ___ (leistungsorientiert) girl.',accepted:['competitive']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: She always wants to be most ___ (erfolgreich).',accepted:['successful']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: She was even ___ (frech) to me.',accepted:['cheeky']},
 {title:'Seite 2 · Aufgabe 4 · Julie’s message',prompt:'Julie’s message · Complete the gap: In the evening I was ___ (erschöpft).',accepted:['exhausted']}
];
const VOCAB_WORK_STATION2_BATTLE_QUESTIONS=[
 {title:"Seite 1 · Aufgabe 1 · Bild 1",prompt:"What is it? Write the right word under each picture. 1.",accepted:["plaster"],image:"./station2-plaster.png"},
 {title:"Seite 1 · Aufgabe 1 · Bild 2",prompt:"What is it? Write the right word under each picture. 2.",accepted:["bandage"],image:"./station2-bandage.jpg"},
 {title:"Seite 1 · Aufgabe 1 · Bild 3",prompt:"What is it? Write the right word under each picture. 3.",accepted:["ambulance"],image:"./station2-ambulance.jpg"},
 {title:"Seite 1 · Aufgabe 1 · Bild 4",prompt:"What is it? Write the right word under each picture. 4.",accepted:["tooth"],image:"./station2-tooth.png"},
 {title:"Seite 1 · Aufgabe 1 · Bild 5",prompt:"What is it? Write the right word under each picture. 5.",accepted:["tablet", "medicine", "tablet/medicine", "tablet / medicine"],image:"./station2-tablet.png"},
 {title:"Seite 1 · Aufgabe 1 · Bild 6",prompt:"What is it? Write the right word under each picture. 6.",accepted:["cast"],image:"./station2-cast.jpg"},
 {title:"Seite 1 · Aufgabe 2 · Satz 1",prompt:"Complete the sentence: “Look, there has been an ___. We must call an ambulance!”",accepted:["accident"]},
 {title:"Seite 1 · Aufgabe 2 · Satz 2",prompt:"Complete the sentence: When I cut my finger, it started to ___ badly.",accepted:["bleed"]},
 {title:"Seite 1 · Aufgabe 2 · Satz 3",prompt:"Complete the sentence: Your ___ is a part of your leg.",accepted:["knee"]},
 {title:"Seite 1 · Aufgabe 2 · Satz 4",prompt:"Complete the sentence: When you ___ your ankle, you should put a bandage on it.",accepted:["sprain", "twist", "hurt"]},
 {title:"Seite 1 · Aufgabe 2 · Satz 5",prompt:"Complete the sentence: “Be careful! It’s hot. Don’t ___ your hand when you take it out.”",accepted:["burn"]},
 {title:"Seite 1 · Aufgabe 2 · Satz 6",prompt:"Complete the sentence: Call 999 for the ___ services in the UK.",accepted:["emergency"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 1",prompt:"Put in the right verb: You ___ (have / make) an accident.",accepted:["have"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 2",prompt:"Put in the right verb: You ___ (invite / call) the operator.",accepted:["call"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 3",prompt:"Put in the right verb: You ___ (give / ask) your name on the phone.",accepted:["give"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 4",prompt:"Put in the right verb: You ___ (speak / say) where you are.",accepted:["say"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 5",prompt:"Put in the right verb: You ___ (stay with / wait for) the hurt person.",accepted:["stay with"]},
 {title:"Seite 2 · Aufgabe 3 · Satz 6",prompt:"Put in the right verb: You ___ (take / bring) a person to hospital.",accepted:["take"]},
 {title:"Seite 2 · Aufgabe 4 · Emergency services 1",prompt:"Name the four emergency services in the UK · 1.",accepted:["police"]},
 {title:"Seite 2 · Aufgabe 4 · Emergency services 2",prompt:"Name the four emergency services in the UK · 2.",accepted:["fire brigade"]},
 {title:"Seite 2 · Aufgabe 4 · Emergency services 3",prompt:"Name the four emergency services in the UK · 3.",accepted:["ambulance"]},
 {title:"Seite 2 · Aufgabe 4 · Emergency services 4",prompt:"Name the four emergency services in the UK · 4.",accepted:["coastguard", "coast guard"]}
];
const kidGbQuestions=station=>GRAMMAR[station].tasks.flatMap(task=>(task.items||task.open||[]).map((item,i)=>({title:task.title,prompt:task.items?item[0]+' _____ '+item[1]:(task.prompts?.[i]||'Schreibe einen vollständigen englischen Satz.')})));
function gbListen(){if(gbOff)gbOff();gbOff=onValue(ref(db,`grammarRooms/${gbCode}`),snap=>{gbRoom=snap.val();if(!gbRoom){msg('Grammatik-Raum nicht gefunden.',true);return;}gbRender();},e=>msg('Grammatik-Battle: '+e.message,true));}
function gbRender(){const m=gbRoom?.meta||{},isVocabWork=m.kind==='vocab-work'||m.kind==='vocab-work-station2',isVocabWork2=m.kind==='vocab-work-station2',questions=isVocabWork2?VOCAB_WORK_STATION2_BATTLE_QUESTIONS:isVocabWork?VOCAB_WORK_BATTLE_QUESTIONS:kidGbQuestions(Number(m.station||0)),q=questions[Number(m.index||0)],answer=gbRoom.submissions?.[m.index]?.[uid],review=gbRoom.reviews?.[m.index]?.[uid],title=isVocabWork2?'Vokabelarbeit · Station 2 · Seiten 1 + 2':isVocabWork?'Vokabelarbeit · Station 1 · Seiten 1 + 2':`Grammatik · Station ${Number(m.station)+1}`,image=q?.image?`<img src="${esc(q.image)}" alt="Abbildung zu ${esc(q.title)}" style="display:block;width:min(100%,340px);height:190px;object-fit:contain;background:#fff;border-radius:14px;border:2px solid #a9bad0;padding:8px;margin:12px auto">`:'';let content=m.stage==='lobby'?'<h3>Warteraum</h3><p>Warte, bis der Schiedsrichter startet.</p>':m.stage==='finished'?`<h3>${isVocabWork?'Vokabelarbeit':'Grammatik'}-Battle beendet</h3><p>Dein Ergebnis steht in der Rangliste.</p>`:q?`<h3>${esc(q.title)}</h3>${image}<p>${esc(q.prompt)}</p>${review?`<p>${review.correct?'✅ Richtig gewertet':'❌ Falsch gewertet'}</p>`:answer?'<p>Antwort abgegeben. Warte auf die Bewertung.</p>':`<label>Deine Antwort<input data-kid-gbtext maxlength="500" autocomplete="off" style="background:#fff;color:#172033;border:2px solid #a9bad0;border-radius:12px;padding:14px;font-size:1.1rem;width:100%;box-sizing:border-box"></label><button data-action="kidGbSubmit">Antwort abgeben</button>`}`:'<p>Aufgabe wird geladen …</p>';app.innerHTML=card(`<h2>📝 ${esc(title)}</h2><p>Aufgabe ${Math.min(questions.length,Number(m.index||0)+1)} von ${questions.length}</p>${content}`)+card(btn('Zur Startseite','home','alt'));}
async function kidGbSubmit(){const m=gbRoom?.meta||{},text=document.querySelector('[data-kid-gbtext]')?.value.trim();if(!uid||m.stage!=='question'||gbRoom.submissions?.[m.index]?.[uid])return;if(!text){msg('Schreibe zuerst deine Antwort.',true);return;}if(Date.now()>Number(m.deadline||0)){msg('Die Antwortzeit ist abgelaufen.',true);return;}try{await set(ref(db,`grammarRooms/${gbCode}/submissions/${m.index}/${uid}`),{text,at:Date.now()});}catch(e){msg('Antwort konnte nicht gespeichert werden: '+e.message,true);}}
function wbListen(){if(wbOff)wbOff();wbOff=onValue(ref(db,`grammarRooms/${wbCode}`),snap=>{wbRoom=snap.val();if(!wbRoom){msg('Writing-Raum nicht gefunden.',true);return;}wbRender();},e=>msg('Writing-Battle: '+e.message,true));}
function wbRender(){const m=wbRoom?.meta||{},i=Number(m.index||0),q=WRITING_BATTLE[i],answer=wbRoom.submissions?.[i]?.[uid],review=wbRoom.reviews?.[i]?.[uid];let content=m.stage==='lobby'?'<h3>Warteraum</h3><p>Warte, bis der Schiedsrichter startet.</p>':m.stage==='finished'?'<h3>Writing-Battle beendet</h3><p>Dein Ergebnis steht in der Rangliste.</p>':q?`<h3>${esc(q.title)}</h3><p>${esc(q.prompt)}</p>${review?`<p>${review.correct?'✅ Richtig gewertet':'❌ Falsch gewertet'}</p>`:answer?'<p>Text abgegeben. Warte auf die Bewertung.</p>':`<label>Dein Text<textarea data-kid-wbtext rows="8" maxlength="1200"></textarea></label><button data-action="kidWbSubmit">Text abgeben</button>`}`:'<p>Aufgabe wird geladen …</p>';app.innerHTML=card(`<h2>✍️ Writing-Battle · Unit 2</h2><p>Aufgabe ${Math.min(WRITING_BATTLE.length,i+1)} von ${WRITING_BATTLE.length}</p>${content}`)+card(btn('Zur Startseite','home','alt'));}
async function kidWbSubmit(){const m=wbRoom?.meta||{},i=Number(m.index||0),text=document.querySelector('[data-kid-wbtext]')?.value.trim();if(!uid||m.stage!=='question'||wbRoom.submissions?.[i]?.[uid])return;if(!text){msg('Schreibe zuerst deinen Text.',true);return;}if(Date.now()>Number(m.deadline||0)){msg('Die Schreibzeit ist abgelaufen.',true);return;}try{await set(ref(db,`grammarRooms/${wbCode}/submissions/${i}/${uid}`),{text,at:Date.now()});}catch(e){msg('Text konnte nicht gespeichert werden: '+e.message,true);}}
document.addEventListener('click',e=>{const ea=e.target.closest('[data-error-answer]');if(ea){void errorPracticeAnswer(ea.dataset.errorAnswer);return;}const ma=e.target.closest('[data-mathanswer]');if(ma){mathAnswer(Number(ma.dataset.mathanswer));return;}const mathButton=e.target.closest('[data-action]');if(mathButton&&(errorEvaluationAction(mathButton.dataset.action)||mathAction(mathButton.dataset.action)))return;const fa=e.target.closest('[data-fractionanswer]');if(fa){fractionAnswer(Number(fa.dataset.fractionanswer));return;}const a=e.target.closest('[data-action]'),ans=e.target.closest('[data-answer]'),sa=e.target.closest('[data-soloanswer]'),la=e.target.closest('[data-listenanswer]');if(ans){answer(Number(ans.dataset.answer));return;}if(sa){soloAnswer(Number(sa.dataset.soloanswer));return;}if(la){listenAnswer(Number(la.dataset.listenanswer));return;}if(!a)return;const v=a.dataset.action;if(v==='kidGbSubmit'){void kidGbSubmit();return;}if(v==='kidWbSubmit'){void kidWbSubmit();return;}if(v==='home')home();else if(v==='host'||v==='createRoom'||v==='dashboard'||v==='start'||v==='reset')return;else if(v==='join')joinForm();else if(v==='joinVocabWork')joinForm('Vokabelarbeit-Battle · Station 1, Seiten 1 + 2 beitreten','vocab-work-1');else if(v==='joinVocabWorkStation2')joinForm('Vokabelarbeit-Battle · Station 2, Seiten 1 + 2 beitreten','vocab-work-2');else if(v==='joinMathFractions')joinForm('1 · Bruchrechnung-Battle beitreten','fractions');else if(v==='joinMathRational')joinForm('2 · Rationale-Zahlen-Battle beitreten','rational');else if(v==='joinMathExam')joinForm('3 · Proportional-/Antiproportional-Klassenarbeit beitreten','math-exam');else if(v==='enter')enter();else if(['start','reset'].includes(v))hostAction(v);else if(v==='solo')soloChooseName();else if(v==='englishSeries')void showEnglishSeries();else if(v==='grammarSeries')void showGrammarSeries();else if(v==='dashboard')void showDashboard();else if(v==='soloChangeName')soloChooseName();else if(v==='soloMistakes')showMyMistakes();else if(v==='soloHome')soloHome();else if(v==='vocabWorkPage1')vocabWorkPage(1);else if(v==='vocabWorkPage2')vocabWorkPage(2);else if(v==='vocabWorkStation2Page1')vocabWorkStation2Page(1);else if(v==='vocabWorkStation2Page2')vocabWorkStation2Page(2);else if(v==='vocabWorkCheck')vocabWorkCheck();else if(v==='vocabWorkStation2Check')vocabWorkStation2Check();else if(v==='vocabWorkBack'){vocabWorkCollect();soloHome();}else if(v==='grammarMenu')grammarMenu();else if(v==='grammarStation0')grammarStationMenu(0);else if(v==='grammarStation1')grammarStationMenu(1);else if(/^grammarTask\d+$/.test(v)){const n=Number(v.slice(11));if(grammarStation!==null&&n<GRAMMAR[grammarStation].tasks.length){void recordLearningActivity(soloName,`english_grammar_${grammarStation+1}_task${n+1}`);grammarRender(grammarStation,n);}}else if(v==='grammarCheck')grammarCheck();else if(v==='grammarReveal')grammarReveal();else if(v==='grammarClear')grammarClear();else if(v==='grammarBack')grammarStationMenu(grammarStation);else if(v==='writingMenu')writingMenu();else if(v==='writingModel'){writingModelVisible=!writingModelVisible;writingRender();}else if(v==='writingComplete')writingToggleComplete();else if(/^writingOpen[0-2]$/.test(v))writingOpen(Number(v.slice(-1)));else if(v==='listenStart')listenStart();else if(v==='listenResume')listenResume();else if(v==='listenNext')listenNext();else if(/^soloName[0-3]$/.test(v))soloSetName(Number(v.slice(-1)));else if(/^soloStart[012]$/.test(v))soloStart(Number(v.slice(-1)));else if(/^soloResume[012]$/.test(v))soloResume(Number(v.slice(-1)));else if(v==='soloNext')soloNext();});
document.addEventListener('input',e=>{if(e.target.matches('[data-vocabwork]'))vocabWorkCollect();if(e.target.matches('[data-vocabwork-s2]'))vocabWorkStation2Collect();if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.matches('[data-writingtext]'))writingSaveField('texts',e.target.value);if(e.target.matches('[data-writingplan]'))writingSaveField('plans',e.target.value);});
document.addEventListener('change',e=>{if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.matches('[data-writingcheck]'))writingSaveField('checks',{index:Number(e.target.dataset.writingcheck),checked:e.target.checked});});
document.addEventListener('focusout',e=>{if(e.target.matches('[data-grammar]'))grammarCollect();});
window.addEventListener('pagehide',()=>grammarCollect());
home();
void initializeFirebase();

async function initializeFirebase(){
 try{
  const [appModule,authModule,databaseModule]=await Promise.all([
   import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
   import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
   import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js')
  ]);
  initializeApp=appModule.initializeApp;
  ({getAuth,signInAnonymously,onAuthStateChanged}=authModule);
  ({getDatabase,ref,onValue,get,set,update,runTransaction,remove}=databaseModule);
  const fb=initializeApp(firebaseConfig),auth=getAuth(fb);db=getDatabase(fb);
  onAuthStateChanged(auth,u=>{if(u){uid=u.uid;watchResets();}else{uid='';resetReady=false;if(resetUnsubscribe){resetUnsubscribe();resetUnsubscribe=null;}signInAnonymously(auth).catch(e=>msg('Anmeldung fehlgeschlagen: '+e.message,true));}});
 }catch(e){
  resetReady=true;
  status.innerHTML='<p class="muted">Online-Funktionen sind derzeit nicht verfügbar. Der Lernbereich bleibt geöffnet.</p>';
 }
}

