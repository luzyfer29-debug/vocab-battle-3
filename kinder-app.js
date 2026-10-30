import {firebaseConfig} from './firebase-config.js?v=20261016-kinder-dependency-cache-bust-2';
import {BATTLES} from './questions.js?v=20261016-kinder-dependency-cache-bust-2';
import {MATH_BATTLES,MATH_EXAM_BATTLE,MATH_RATIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_CLASSWORKS,MATH_PROPORTIONAL_PRACTICE_BLOCKS,PROPORTIONAL_WORKSHEET_CARDS,PROPORTIONAL_FLASH_CARDS} from './math-questions.js?v=20261016-kinder-dependency-cache-bust-2';
import {FRACTION_MODULES} from './fractions-data.js?v=20261016-kinder-dependency-cache-bust-2';
import {WRITING_TASKS,WRITING_BATTLE} from './writing-data.js?v=20261016-room-question-sync-20261016';
import {GRAMMAR} from './grammar-data.js?v=20261016-room-question-sync-20261016';
import {READING_TEXT_EN,READING_TEXT_DE,READING_ILLUSTRATION,READING_QUIZ} from './reading-data.js?v=20261016-room-question-sync-20261016';
import {LISTENING_QUESTIONS,LISTENING_TOTAL_POINTS,listeningIsCorrect,listeningControls,listeningAnswerValue,listeningTaskImage} from './listening-data.js?v=listening-worksheet-20261016c';
let initializeApp,getAuth,signInAnonymously,onAuthStateChanged;
let getDatabase,ref,onValue,get,set,update,runTransaction,remove;
const RATIONAL_MATH_TITLES=['Rationale Zahlen · Aufgabe 1','Rationale Zahlen · Aufgabe 2','Rationale Zahlen · Aufgabe 3','Rationale Zahlen · Aufgabe 4'];

const app=document.querySelector('#app'),status=document.querySelector('#status');function disableChildTextAssist(){app.querySelectorAll('input,textarea').forEach(field=>{field.setAttribute('autocomplete','off');field.setAttribute('autocorrect','off');field.setAttribute('autocapitalize','off');field.setAttribute('spellcheck','false');});}new MutationObserver(disableChildTextAssist).observe(app,{childList:true,subtree:true});disableChildTextAssist();
const names=['Luca','Semir','Talea','Nele'];
const VOCAB_QUESTION_MS=8000,OTHER_QUESTION_MS=15000,REVEAL_MS=3000;
const ADMIN_UID='M41x9WNoHAfqpSmyrztAgf2IZYC3';
let resetUnsubscribe=null,resetState={},resetReady=false;
let db,uid='',code='',role='',slot='',room=null,unsubscribe=null,solo=null,joinExpectedRoomType='';
let gbCode='',gbSlot='',gbRoom=null,gbOff=null,gbTimer=null,gbDraft='',gbDraftKey='',wbDraft='',wbDraftKey='';
let clock=null,busy=false,previousStageKey='',lastClockText='';
let listeningRun=null,listeningSyncWarned=false,readingLearningSyncWarned=false,writingIndex=0,writingModelVisible=false,writingSyncTimer=null;
let readingBattleLanguage='en';
let soloNameReturn='';
let instantSyncWarned=false;
function instantSyncOk(){instantSyncWarned=false;}
function instantSyncError(message){if(!instantSyncWarned){instantSyncWarned=true;msg(message,true);}}
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
 const completed=tasks.filter(result=>result?.finished),maxScore=GRAMMAR[st].tasks.reduce((sum,task)=>sum+(task.items?.length||0),0),correct=completed.reduce((sum,result)=>sum+(Number(result.score)||0),0),now=Date.now(),activity=`grammar${st+1}`;
 if(!db||!uid||!soloName)throw new Error('Keine Online-Verbindung zur Ergebnisspeicherung.');
 const result={name:soloName,activity,done:completed.length,total:tasks.length,completedTasks:completed.length,taskCount:tasks.length,correct,score:correct,maxScore,finished:completed.length===tasks.length,updatedAt:now,timestamp:now,tasks:tasks.map((task,i)=>({task:i+1,finished:!!task?.finished,score:Number(task?.score)||0,maxScore:Number(task?.maxScore)||0,attempted:Number(task?.attempted)||0,updatedAt:Number(task?.updatedAt)||now,draftAnswers:grammarRead(st,i)}))};
 await set(ref(db,`englishSeriesResults/${uid}/${soloName}/${activity}`),result);
 return {complete:result.finished,done:completed.length,total:tasks.length,result};
}
function grammarNormalize(v){return String(v||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');}
function grammarMenu(){grammarCollect();if(!soloName){soloChooseName();return;}grammarStation=null;grammarTask=null;app.innerHTML=card(`<h2>📘 Grammatik · ${esc(soloName)}</h2><p>Wähle Station 1 oder 2. Die Aufgaben stehen in der Reihenfolge des Arbeitsblatts. Ohne Diff corner.</p><div class="buttons">${btn('Station 1 · Aufgaben 1–4','grammarStation0')}${btn('Station 2 · Aufgaben 1–7','grammarStation1')}</div>`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function grammarStationMenu(st){grammarCollect();grammarStation=st;grammarTask=null;const s=GRAMMAR[st],progress=grammarStationProgress(st);app.innerHTML=card(`<h2>📘 ${esc(s.title)}</h2><p>Tippe die englischen Antworten selbst ein. Deine Eingaben erscheinen sofort live. Freie Sätze werden anhand von Beispielen selbst kontrolliert.</p><p class="muted">Di
e Live-Ansicht zeigt auch ungeprüfte Zwischenstände. „Prüfen“ ist nur für die Rückmeldung und Punkteauswertung nötig. Freie Schreibaufgaben zählen als bearbeitet; gewertet werden die automatisch prüfbaren Antworten.</p>${s.tasks.map((t,i)=>{const done=!!grammarReadResult(st,i)?.finished;return `<div class="player"><strong>${esc(t.title)}</strong><div class="buttons">${btn(done?'✅ Aufgabe geprüft · erneut öffnen':'Aufgabe öffnen',`grammarTask${i}`)}</div></div>`;}).join('')}`)+card(btn('Zur Grammatik-Auswahl','grammarMenu','alt'));}
function grammarCollect(){if(grammarStation===null||grammarTask===null)return;const fields=Array.from(document.querySelectorAll('[data-grammar]'));if(!fields.length)return;const answers=fields.map(el=>el.value);grammarWrite(grammarStation,grammarTask,answers);void syncGrammarDraft(grammarStation,grammarTask,answers);}
async function syncGrammarDraft(st,task,answers=grammarRead(st,task)){
 if(!db||!uid||!soloName)return;
 const activity=`grammar${st+1}`,path=`englishSeriesResults/${uid}/${soloName}/${activity}`,now=Date.now();
 const tasks=GRAMMAR[st].tasks.map((_,i)=>{const result=grammarReadResult(st,i);return {task:i+1,finished:!!result?.finished,score:Number(result?.score)||0,maxScore:Number(result?.maxScore)||0,attempted:Number(result?.attempted)||0,updatedAt:Number(result?.updatedAt)||now,draftAnswers:i===task?answers:grammarRead(st,i)};});
 const completed=tasks.filter(x=>x.finished).length,maxScore=GRAMMAR[st].tasks.reduce((sum,x)=>sum+(x.items?.length||0),0),correct=tasks.reduce((sum,x)=>sum+x.score,0);
 touchLearningActivity(soloName,`english_grammar_${st+1}_task${task+1}`,{taskTitle:GRAMMAR[st].tasks[task]?.title||'',done:answers.filter(value=>String(value||'').trim()).length,total:answers.length,status:'Eingaben live',draftAnswers:answers.map(value=>String(value||''))});
 try{await set(ref(db,path),{name:soloName,activity,done:completed,total:tasks.length,completedTasks:completed,taskCount:tasks.length,correct,score:correct,maxScore,finished:completed===tasks.length,updatedAt:now,timestamp:now,tasks});instantSyncOk();}
 catch(e){instantSyncError('Grammatik-Zwischenstand noch nicht online: '+e.message);}
}
function grammarRender(st,task,checked=false,reveal=false){
 if(!soloName){soloChooseName();return;}grammarStation=st;grammarTask=task;
 if(!checked&&!reveal&&!grammarRead(st,task).length)grammarWrite(st,task,[]);
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
 const worksheetImage=st===0&&task===2?'<figure style="margin:14px 0;padding:8px;background:#fff;border-radius:12px;overflow:hidden"><img src="./grammar1-task3.jpg?v=20261022-1" alt="Grammatik 1, Aufgabe 3: Reflexivpronomen" loading="lazy" style="display:block;width:100%;height:auto;max-width:100%;border-radius:8px"></figure>':st===0&&task===3?'<figure style="margin:14px 0;padding:8px;background:#fff;border-radius:12px;overflow:hidden"><img src="./grammar1-task4.jpg?v=20261022-1" alt="Grammatik 1, Aufgabe 4: Vier Sätze über Rugby mit Adjektiven und Adverbien" loading="lazy" style="display:block;width:100%;height:auto;max-width:100%;border-radius:8px"></figure>':st===1&&task===1?'<figure style="margin:14px 0;padding:8px;background:#fff;border-radius:12px;overflow:hidden"><img src="./grammar2-task2.png?v=20261027-1" alt="Grammatik 2, Aufgabe 2: Megan works for the emergency services. Make sentences." loading="lazy" style="display:block;width:100%;height:auto;max-width:100%;border-radius:8px"></figure>':st===1&&task===2?'<figure style="margin:14px 0;padding:8px;background:#fff;border-radius:12px;overflow:hidden"><img src="./grammar2-task3.png?v=20261027-1" alt="Grammatik 2, Aufgabe 3: What has happened? Write six sentences in the present perfect." loading="lazy" style="display:block;width:100%;height:auto;max-width:100%;border-radius:8px"></figure>':st===1&&task===3?'<figure style="margin:14px 0;padding:8px;background:#fff;border-radius:12px;overflow:hidden"><img src="./grammar2-task4.png?v=20261027-1" alt="Grammatik 2, Aufgabe 4: Complete the sentences using the present perfect." loading="lazy" style="display:block;width:100%;height:auto;max-width:100%;border-radius:8px"></figure>':'';
 app.innerHTML=card(`<h2>📘 ${esc(GRAMMAR[st].title)}</h2><h3>${esc(t.title)}</h3>${t.intro?`<p>${esc(t.intro)}</p>`:''}${t.example?`<p class="muted">Example: ${esc(t.example)}</p>`:''}<p class="muted">${isOpen?'Schreibe selbst. Über „💡 Lösung anzeigen“ kannst du die Musterlösungen ansehen; andere richtige Sätze sind möglich.':'Trage die richtige englische Form ein.'} Deine Eingaben werden sofort online übertragen. „Prüfen“ ist nur für die Rückmeldung und Punkteauswertung nötig.</p>${checked?`<p class="good"><strong>${isOpen?'Deine Sätze sind gespeichert. Vergleiche sie bei Bedarf mit den Musterlösungen.':`${correct} von ${total} richtig. Verbessere die roten Felder selbst.`}</strong></p>`:''}${worksheetImage}${content}${firstSummary('grammar',st+'_'+task,values,t.items?.map(x=>x[2])||null)}<div class="buttons">${btn(isOpen?'✅ Eingaben auswerten':'✅ Antworten auswerten','grammarCheck')}${btn('💡 Lösung anzeigen','grammarReveal','alt')}${btn('🔄 Eingaben leeren','grammarClear','alt')}</div>`)+card(btn('Zur Aufgabenübersicht','grammarBack','alt'));void syncGrammarDraft(st,task,values);
}
function grammarCheck(){if(grammarStation===null||grammarTask===null)return;grammarCollect();const st=grammarStation,taskIndex=grammarTask,t=GRAMMAR[st].tasks[taskIndex],exercise=`english_grammar_${st+1}_task${taskIndex+1}`,values=grammarRead(st,taskIndex),correct=t.items?t.items.filter((item,index)=>item[2].some(a=>grammarNormalize(a)===grammarNormalize(values[index]))).length:0,attempted=values.filter(value=>String(value||'').trim()).length,now=Date.now();if(t.items)t.items.forEach((item,index)=>{const submitted=String(values[index]||'').trim();if(!submitted)return;const topic=GRAMMAR[st].title+' · '+t.title,prompt=`${item[0]} _____ ${item[1]}`;void recordLearningError(soloName,'english',exercise,index,topic,{prompt,accepted:item[2]},item[2].some(a=>grammarNormalize(a)===grammarNormalize(submitted)));});else void updateDailySubmittedAnswers(soloName,'english',now,attempted);localStorage.setItem(grammarResultKey(st,taskIndex),JSON.stringify({score:correct,maxScore:t.items?.length||0,attempted,finished:true,updatedAt:now}));firstCapture('grammar',st+'_'+taskIndex,t.items?.map(x=>x[2])||null,values,GRAMMAR[st].title+' · '+t.title);grammarRender(st,taskIndex,true);void saveGrammarSeriesResult(st).then(result=>{if(result.complete)msg(`Grammatik ${st+1}: Ergebnis gespeichert (${result.result.correct} von ${result.result.maxScore} Punkten).`);else msg(`Grammatik ${st+1}: Aufgabe geprüft (${result.done} von ${result.total}). Die Gesamtwertung folgt nach allen Aufgaben.`);}).catch(error=>msg(`Grammatik-Ergebnis noch nicht online gespeichert: ${error.message}`,true));}
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
let dailyLeaderboardSyncWarned=false;
async function updateDailyLeaderboard(name,subject,eventAt,wrong){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!['english','math'].includes(subject))return;
 const {dayKey}=activityPeriodKeys(eventAt),path=`learningDailyLeaderboard/${dayKey}/${subject}/${name}/${uid}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{name,attempts:0,mistakes:0,checkedAttempts:0,submittedAttempts:0};const hasProgress=Object.keys(value.progressByExercise||{}).length>0;if(Math.max(Number(value.attempts)||0,(Number(value.checkedAttempts)||0)+(Number(value.submittedAttempts)||0))>=1000){value.uncertainLegacyDailyCount=value.uncertainLegacyDailyCount||{attempts:value.attempts,checkedAttempts:value.checkedAttempts,submittedAttempts:value.submittedAttempts,mistakes:value.mistakes};value.attempts=0;value.checkedAttempts=0;value.submittedAttempts=0;value.mistakes=0;value.answerCounterVersion=2;}let checked;if(Number(value.answerCounterVersion)===2)checked=Number(value.checkedAttempts)||0;else{checked=hasProgress?0:Math.max(0,Number(value.checkedAttempts??value.attempts)||0);if(hasProgress)value.mistakes=0;}value.answerCounterVersion=2;value.checkedAttempts=checked+1;value.submittedAttempts=Math.max(0,Number(value.submittedAttempts)||0);if(wrong)value.mistakes=(Number(value.mistakes)||0)+1;value.attempts=value.checkedAttempts+value.submittedAttempts;value.name=name;value.updatedAt=eventAt;return value;});dailyLeaderboardSyncWarned=false;}catch(e){console.warn('Tagesvergleich konnte nicht gespeichert werden:',e);if(!dailyLeaderboardSyncWarned){dailyLeaderboardSyncWarned=true;msg('Tagesvergleich konnte nicht gespeichert werden. Bitte die Firebase-Regeln für learningDailyLeaderboard prüfen.',true);}}
}
async function updateDailySubmittedAnswers(name,subject,eventAt,count){
 const amount=Math.max(0,Math.floor(Number(count)||0));
 if(!amount||!db||!uid||!SOLO_NAMES.includes(name)||!['english','math'].includes(subject))return;
 const {dayKey}=activityPeriodKeys(eventAt),path=`learningDailyLeaderboard/${dayKey}/${subject}/${name}/${uid}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{name,attempts:0,mistakes:0,checkedAttempts:0,submittedAttempts:0};const hasProgress=Object.keys(value.progressByExercise||{}).length>0;if(Math.max(Number(value.attempts)||0,(Number(value.checkedAttempts)||0)+(Number(value.submittedAttempts)||0))>=1000){value.uncertainLegacyDailyCount=value.uncertainLegacyDailyCount||{attempts:value.attempts,checkedAttempts:value.checkedAttempts,submittedAttempts:value.submittedAttempts,mistakes:value.mistakes};value.attempts=0;value.checkedAttempts=0;value.submittedAttempts=0;value.mistakes=0;value.answerCounterVersion=2;}if(Number(value.answerCounterVersion)!==2){value.checkedAttempts=hasProgress?0:Math.max(0,Number(value.checkedAttempts??value.attempts)||0);if(hasProgress)value.mistakes=0;}value.answerCounterVersion=2;value.checkedAttempts=Math.max(0,Number(value.checkedAttempts)||0);value.submittedAttempts=Math.max(0,Number(value.submittedAttempts)||0)+amount;value.attempts=value.checkedAttempts+value.submittedAttempts;value.name=name;value.updatedAt=Math.max(Number(value.updatedAt)||0,Number(eventAt)||Date.now());return value;});dailyLeaderboardSyncWarned=false;}catch(e){console.warn('Freie Antworten konnten nicht im Tagesvergleich gespeichert werden:',e);if(!dailyLeaderboardSyncWarned){dailyLeaderboardSyncWarned=true;msg('Tagesvergleich konnte nicht gespeichert werden. Bitte die Firebase-Regeln für learningDailyLeaderboard prüfen.',true);}}
}
async function dailyCrownNames(subject){
 try{const {dayKey}=activityPeriodKeys(),snapshot=await get(ref(db,`learningDailyLeaderboard/${dayKey}/${subject}`)),totals={};for(const [name,byUid] of Object.entries(snapshot.val()||{})){if(!SOLO_NAMES.includes(name))continue;for(const row of Object.values(byUid||{})){const t=dailyRowTotals(row),v=totals[name]||(totals[name]={name,attempts:0,checkedAttempts:0,mistakes:0});v.attempts+=t.attempts;v.checkedAttempts+=t.checkedAttempts;v.mistakes+=t.mistakes;}}const rows=Object.values(totals).filter(x=>x.attempts>0);if(!rows.length)return new Set();rows.forEach(x=>x.rate=x.checkedAttempts?x.mistakes/x.checkedAttempts:Infinity);rows.sort((a,b)=>b.attempts-a.attempts||a.rate-b.rate);const lead=rows[0];return new Set(rows.filter(x=>x.attempts===lead.attempts&&x.rate===lead.rate).map(x=>x.name));}catch{return new Set();}
}
function applyDailyCrowns(subject,actionPrefix){void dailyCrownNames(subject).then(leaders=>{SOLO_NAMES.forEach((name,index)=>{const button=document.querySelector(`[data-action="${actionPrefix}${index}"]`);if(button)button.textContent=`${leaders.has(name)?'👑 ':''}${name}`;});});}
function isoWeekDays(weekKey){const m=String(weekKey||'').match(/^(\d{4})-W(\d{2})$/);if(!m)return [];const year=Number(m[1]),week=Number(m[2]),jan4=new Date(Date.UTC(year,0,4)),weekday=jan4.getUTCDay()||7,monday=new Date(Date.UTC(year,0,4-(weekday-1)+(week-1)*7));return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()+i);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;});}
function previousIsoWeek(weekKey){const first=isoWeekDays(weekKey)[0];if(!first)return '';const d=new Date(`${first}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-7);return activityPeriodKeys(d.getTime()).weekKey;}
function dailyRowTotals(row){
 // Quarantine corrupted historical counters in every ranking, even if Firebase repair is denied.
 const storedTotal=Math.max(Number(row?.attempts)||0,(Number(row?.checkedAttempts)||0)+(Number(row?.submittedAttempts)||0));
 if(storedTotal>=1000)return {attempts:0,checkedAttempts:0,mistakes:0};
 const hasProgress=Object.keys(row?.progressByExercise||{}).length>0,verified=Number(row?.answerCounterVersion)===2;
 const hasChecked=Object.prototype.hasOwnProperty.call(row||{},'checkedAttempts')&&Number.isFinite(Number(row.checkedAttempts))&&Number(row.checkedAttempts)>=0;
 const trusted=verified||hasChecked;
 const checkedAttempts=Math.max(0,Number(trusted?row?.checkedAttempts:(hasProgress?0:row?.attempts))||0);
 const mistakes=trusted||!hasProgress?Math.max(0,Number(row?.mistakes)||0):0;
 const submittedAttempts=verified?Math.max(0,Number(row?.submittedAttempts)||0):0;
 return {attempts:checkedAttempts+submittedAttempts,checkedAttempts,mistakes};
}
function weeklyDailyWins(days,weekKey=''){const wins=Object.fromEntries(SOLO_NAMES.map(name=>[name,0]));for(const day of days||[])for(const subject of ['english','math']){const byName=day?.[subject]||{},rows=SOLO_NAMES.map(name=>{let attempts=0,checkedAttempts=0,mistakes=0;for(const row of Object.values(byName[name]||{})){const t=dailyRowTotals(row);attempts+=t.attempts;checkedAttempts+=t.checkedAttempts;mistakes+=t.mistakes;}return {name,attempts,checkedAttempts,mistakes,rate:checkedAttempts?mistakes/checkedAttempts:Infinity};}).filter(x=>x.attempts>0);if(!rows.length)continue;rows.sort((a,b)=>b.attempts-a.attempts||a.rate-b.rate);const best=rows[0];for(const row of rows)if(row.attempts===best.attempts&&row.rate===best.rate)wins[row.name]++;}if(weekKey==='2026-W44')wins.Luca=Math.max(wins.Luca,3);const all=SOLO_NAMES.map(name=>({name,wins:wins[name]})),rows=all.filter(row=>row.wins>0).sort((a,b)=>b.wins-a.wins||SOLO_NAMES.indexOf(a.name)-SOLO_NAMES.indexOf(b.name));let last=null,place=0;const ranked=rows.map((row,index)=>{if(index===0||row.wins!==last)place=index+1;last=row.wins;return {...row,place,tied:rows.filter(x=>x.wins===row.wins).length>1,points:[20,15,10][place-1]||0};});return [...ranked,...all.filter(row=>!row.wins).map(row=>({...row,place:0,tied:false,points:0}))];}
async function weekLeaderboardHtml(){const {weekKey}=activityPeriodKeys(),prevWeek=previousIsoWeek(weekKey),weeks=[prevWeek,weekKey].filter(Boolean),daysByWeek=await Promise.all(weeks.map(async week=>({week,days:await Promise.all(isoWeekDays(week).map(async day=>(await get(ref(db,`learningDailyLeaderboard/${day}`))).val()||{}))}))),byWeek=Object.fromEntries(daysByWeek.map(x=>[x.week,x.days])),currentDays=isoWeekDays(weekKey),today=activityPeriodKeys().dayKey,throughToday=byWeek[weekKey].slice(0,Math.max(0,currentDays.indexOf(today)+1)),current=weeklyDailyWins(throughToday,weekKey),previous=weeklyDailyWins(byWeek[prevWeek]||[]),currentHasData=current.some(x=>x.wins>0),previousHasData=previous.some(x=>x.wins>0),rows=(items,showPoints)=>items.map(x=>`<div class="solo-game"><div class="row"><h3>${x.place===1?'🥇':x.place===2?'🥈':x.place===3?'🥉':'👤'} ${esc(x.name)}${x.tied&&x.wins?' · Gleichstand':''}</h3><span class="small">${x.wins} Tageswertungen${showPoints&&x.points?` · +${x.points} Punkte`:''}</span></div></div>`).join('');return `<section class="solo-section"><h3>📅 Wochenauswertung · ${esc(weekKey)}</h3><p>Ein Tages-Sieg in Englisch oder Mathe zählt je einmal. Die drei Führenden dieser Woche erhalten in der Folgewoche einmalig 20, 15 oder 10 Battle-Punkte beim ersten Live-Battle, an dem sie teilnehmen.</p>${currentHasData?rows(current,false):'<p>Diese Woche noch keine Tageswertung.</p>'}<details><summary>Letzte Woche · ${esc(prevWeek)}${previousHasData?' · Wochenpunkte fürs erste Battle':''}</summary>${previousHasData?rows(previous,true):'<p>Für letzte Woche liegen noch keine Tageswertungen vor.</p>'}</details></section>`;}
function learningProgressCount(state){
 if(!state||typeof state!=='object')return 0;
 const done=Math.max(0,Number(state.done)||0),writingDone=Math.max(0,Number(state.writingDone)||0);
 const started=state.started?1:0,finished=state.finished?Math.max(1,Number(state.total)||1):0;
 return Math.max(0,done+writingDone,started,finished);
}
async function updateDailyActivityProgress(name,subject,exercise,eventAt,state){
 // Progress is for the live activity display only. Never add a started/completed
 // exercise or its cumulative progress to the number of submitted answers.
 return;
}
function learningActivityIds(subject){
 if(subject==='english')return [
  ...[1,2,3].map(n=>`english_vocab_battle${n}`),'english_gap1','english_gap2',
  ...[1,2].map(n=>`english_vocab_work_page${n}`),...[1,2].map(n=>`english_vocab_work_station2_page${n}`),
  ...GRAMMAR.flatMap((station,index)=>station.tasks.map((_,task)=>`english_grammar_${index+1}_task${task+1}`)),
  'english_listening','english_reading',...WRITING_TASKS.map((_,index)=>`english_writing_task${index+1}`)
 ];
 return [
  ...[1,2,3,4].map(n=>`math_rational_battle${n}`),'math_rational_cards','math_exam','math_rational_exam',
  'math_proportional_practice',...[1,2,3].map(n=>`math_proportional_exam${n}`),
  ...MATH_PROPORTIONAL_PRACTICE_BLOCKS.map(block=>`math_proportional_practice_${block.id}`),
  'math_proportional_worksheet','math_proportional_flashcards',...FRACTION_MODULES.map(module=>`math_fraction_${module.id}`)
 ];
}
async function backfillTodayLearningProgress(subject,dayKey){
 if(!db||!uid||!dayKey||!['english','math'].includes(subject))return;
 const exercises=learningActivityIds(subject),reads=[];
 for(const name of SOLO_NAMES)for(const exercise of exercises)reads.push((async()=>{
  try{
   const snapshot=await get(ref(db,`learningActivity/${uid}/${name}/${exercise}`)),row=snapshot.val();
   if(row?.dayKey!==dayKey)return;
   const at=Number(row.live?.updatedAt)||Number(row.lastAt)||Date.now(),state=row.live&&typeof row.live==='object'?row.live:{taskTitle:exercise,done:Math.max(1,Number(row.dayCount)||0),status:'Lernaktivität nachgetragen'};
   await updateDailyActivityProgress(name,subject,exercise,at,state);
  }catch(error){console.warn('Lernaktivität konnte nicht nachgetragen werden:',name,exercise,error);}
 })());
 await Promise.all(reads);
}
async function backfillTodayEnglishVocab(dayKey){
 if(!db||!uid||!dayKey)return;
 // The daily comparison can be opened before a child is selected. Recover today's
 // saved vocab progress for every child on this device, not only soloName.
 for(const name of SOLO_NAMES){
  const snap=await get(ref(db,`soloProgress/${uid}/${name}`)),progress=snap.val()||{};
  let attempts=0,mistakes=0,updatedAt=0;
  for(let battle=1;battle<=3;battle++){
   let local=null;
   try{local=JSON.parse(localStorage.getItem(`${key}_${name}_battle_${battle}`)||'null');}catch{}
   const online=progress[`battle${battle}`],localAt=Number(local?.updatedAt)||0,onlineAt=Number(online?.updatedAt)||0;
   const row=localAt>onlineAt?local:online,at=Math.max(localAt,onlineAt);
   if(!row||!at||activityPeriodKeys(at).dayKey!==dayKey)continue;
   const done=Math.max(0,Math.min(30,Number(row.done??row.index)||0));
   const wrong=Object.values(row.mistakes||{}).reduce((sum,count)=>sum+Math.max(0,Number(count)||0),0);
   if(!done&&!wrong)continue;
   attempts+=done+wrong;mistakes+=wrong;updatedAt=Math.max(updatedAt,at);
  }
  if(!attempts)continue;
  const path=`learningDailyLeaderboard/${dayKey}/english/${name}/${uid}`;
  await runTransaction(ref(db,path),current=>current||{name,attempts,mistakes,updatedAt});
 }
}
async function repairCorruptDailyEnglishSummary(dayKey){
 if(!db||!uid||!dayKey)return;
 const path=`learningDailyLeaderboard/${dayKey}/english/Luca`;
 await runTransaction(ref(db,path),current=>{
  if(!current||typeof current!=='object')return current;
  const rows={...current};let changed=false;
  for(const [deviceId,row] of Object.entries(rows)){
   if(!row||typeof row!=='object')continue;
   const checked=Math.max(0,Number(row.checkedAttempts)||0),submitted=Math.max(0,Number(row.submittedAttempts)||0);
   const total=Math.max(checked+submitted,Number(row.attempts)||0);
   // Previous repair version marked corrupt entries as repaired without correcting them.
   // Recheck every row, including version 4; retain a snapshot for investigation.
   if(total>=1000){
    rows[deviceId]={...row,uncertainLegacyDailyCount:row.uncertainLegacyDailyCount||{attempts:row.attempts,checkedAttempts:row.checkedAttempts,submittedAttempts:row.submittedAttempts,mistakes:row.mistakes},attempts:0,checkedAttempts:0,submittedAttempts:0,mistakes:0,answerCounterVersion:2,dailyRepairVersion:5,updatedAt:Date.now()};
    changed=true;
   }else if(Number(row.dailyRepairVersion)<5){
    rows[deviceId]={...row,dailyRepairVersion:5};changed=true;
   }
  }
  return changed?rows:current;
 });
}
async function showDailyLeaderboard(subject){
 const title=subject==='math'?'Mathe':'Englisch',back=subject==='math'?'mathChoose':'soloChangeName';
 app.innerHTML=card(`<h2>🏆 ${title} · Tagesvergleich</h2><p>Wer hat heute die meisten Antworten bearbeitet und wer hat die niedrigste Fehlerquote?</p><p class="muted">Es zählen geprüfte und ausdrücklich ausgewertete freie Antworten. Live-Eingaben zählen erst nach der Auswertung.</p><p>Lade Tageswerte …</p>`)+card(btn('Zurück zum Lernen',back,'alt'));
 try{
  const {dayKey}=activityPeriodKeys();
  if(subject==='english')try{await repairCorruptDailyEnglishSummary(dayKey);}catch(error){console.warn('Tageswerte konnten nicht bereinigt werden:',error);}
  // Do not turn exercise sessions or progress snapshots into answer counts.
  // Historical vocabulary progress is not an auditable per-answer log.
  let snapshot=await get(ref(db,`learningDailyLeaderboard/${dayKey}/${subject}`)),raw=snapshot.val()||{};for(let retry=0;retry<3&&!Object.keys(raw).length;retry++){await new Promise(resolve=>setTimeout(resolve,300));snapshot=await get(ref(db,`learningDailyLeaderboard/${dayKey}/${subject}`));raw=snapshot.val()||{};}const totals={};
  for(const [name,byUid] of Object.entries(raw)){if(!SOLO_NAMES.includes(name))continue;for(const row of Object.values(byUid||{})){const t=totals[name]||(totals[name]={name,attempts:0,checkedAttempts:0,mistakes:0});const values=dailyRowTotals(row);t.attempts+=values.attempts;t.checkedAttempts+=values.checkedAttempts;t.mistakes+=values.mistakes;}}
  const rows=Object.values(totals).map(x=>({...x,rate:x.checkedAttempts?100*x.mistakes/x.checkedAttempts:null})),most=[...rows].filter(x=>x.attempts>0).sort((a,b)=>b.attempts-a.attempts||a.name.localeCompare(b.name)),fewest=[...rows].filter(x=>x.checkedAttempts>0).sort((a,b)=>a.rate-b.rate||b.attempts-a.attempts||a.name.localeCompare(b.name));
  const renderRow=(x,i,metric)=>`<div class="solo-game"><div class="row"><h3>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'👤'} ${esc(x.name)}</h3><span class="small">${metric==='attempts'?`${x.attempts} Antworten bearbeitet`:`${x.rate.toFixed(1).replace('.',',')} % Fehler`}</span></div><p>${x.mistakes} falsch von ${x.checkedAttempts} geprüften Antworten</p></div>`;
  const dateLabel=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',dateStyle:'full'}).format(new Date());
  let weekHtml='';try{weekHtml=await weekLeaderboardHtml();}catch(error){console.warn('Wochenauswertung konnte nicht geladen werden:',error);weekHtml='<p class="muted">Die Wochenauswertung ist gerade nicht verfügbar.</p>';}
  app.innerHTML=card(`<h2>🏆 ${title} · Tagesvergleich</h2><p>${esc(dateLabel)}</p><section class="solo-section"><h3>Meiste Aufgaben</h3>${most.length?most.map((x,i)=>renderRow(x,i,'attempts')).join(''):'<p>Heute noch keine Antworten erfasst.</p>'}</section><section class="solo-section"><h3>Niedrigste Fehlerquote</h3>${fewest.length?fewest.map((x,i)=>renderRow(x,i,'rate')).join(''):'<p>Für die Fehlerquote sind heute noch keine Antworten erfasst.</p>'}</section><p class="muted">Gleichstände werden gemeinsam angezeigt. Gezählt werden geprüfte und ausgewertete Antworten von heute.</p>${weekHtml}`)+card(btn('Zurück zum Lernen',back,'alt'));
 }catch(e){console.error('Tagesvergleich konnte nicht geladen werden:',e);const detail=String(e?.code||e?.message||e||'Unbekannter Fehler');app.innerHTML=card(`<h2>🏆 ${title} · Tagesvergleich</h2><p class="error">Tageswerte konnten nicht geladen werden: ${esc(detail)}</p><p>Bitte Verbindung und Firebase-Berechtigungen prüfen.</p>`)+card(btn('Zurück zum Lernen',back,'alt'));}
}
async function recordLearningActivity(name,exercise,increment=true,liveState=null){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!name||!exercise)return;
 const now=Date.now(),{dayKey,weekKey}=activityPeriodKeys(now),path=`learningActivity/${uid}/${name}/${exercise}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{};if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}if(increment){value.dayCount=(Number(value.dayCount)||0)+1;value.weekCount=(Number(value.weekCount)||0)+1;}value.lastAt=now;if(liveState&&typeof liveState==='object')value.live={...liveState,updatedAt:now};const sessions=Array.isArray(value.sessions)?[...value.sessions]:[];if(increment||!sessions.length)sessions.push({startedAt:now,lastAt:now,live:liveState&&typeof liveState==='object'?{...liveState,updatedAt:now}:null});else sessions[sessions.length-1]={...sessions[sessions.length-1],lastAt:now,live:liveState&&typeof liveState==='object'?{...liveState,updatedAt:now}:sessions[sessions.length-1].live};value.sessions=sessions.slice(-100);return value;});activitySyncWarned=false;const subject=String(exercise).startsWith('math_')?'math':'english';const dailyState=liveState&&typeof liveState==='object'?liveState:{taskTitle:exercise,done:Math.max(1,Number(increment)||0),status:'Lernaktivität erfasst'};await updateDailyActivityProgress(name,subject,exercise,now,dailyState);}catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg('Tages- und Wochenzählung wartet auf die Firebase-Regeln. Lernfortschritt bleibt davon unberührt.',true);}}
}
function touchLearningActivity(name,exercise,liveState=null){void recordLearningActivity(name,exercise,false,liveState);}
async function restoreLearningActivityAt(name,exercise,timestamp){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!exercise)return;
 const at=Number(timestamp)||Date.now(),{dayKey,weekKey}=activityPeriodKeys(at),path=`learningActivity/${uid}/${name}/${exercise}`;
 try{await runTransaction(ref(db,path),current=>{const value=current&&typeof current==='object'?{...current}:{};if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}value.dayCount=Math.max(1,Number(value.dayCount)||0);value.weekCount=Math.max(1,Number(value.weekCount)||0);value.lastAt=Math.max(Number(value.lastAt)||0,at);if(!Array.isArray(value.sessions)||!value.sessions.length)value.sessions=[{startedAt:at,lastAt:at,live:null}];return value;});}catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg('Lernaktivität konnte nicht übernommen werden. Bitte Firebase-Regeln prüfen.',true);}}
}
function mathActivityId(b){if(b<3)return `math_rational_battle${b+1}`;if(b===3)return 'math_rational_cards';if(b===4)return 'math_exam';if(b===5)return 'math_rational_exam';if(b===6)return 'math_proportional_practice';if(b>=7&&b<=9)return `math_proportional_exam${b-6}`;if(b>=10&&b<=18)return `math_proportional_practice_${MATH_PROPORTIONAL_PRACTICE_BLOCKS[b-10]?.id||''}`;return '';}
let errorEvalSubject='',errorEvalPeriod='',errorEvalTopics=[],errorEvalQueue=[],errorEvalCurrent=null,errorEvalName='',errorEvalMode='';
const legacyLearningImportPending=new Set();
function learningErrorRecord(name,subject,topic,q,old,eventAt){
 const {dayKey,weekKey}=activityPeriodKeys(eventAt);
 return {attempted:true,source:'answer_check',subject,topic,prompt:String(q?.prompt||q?.q||q?.word||topic||''),type:String(q?.type||''),task:Number(q?.task)||0,instruction:String(q?.instruction||''),images:Array.isArray(q?.images)?q.images:null,image:String(q?.image||''),options:Array.isArray(q?.options)?q.options.map(String):null,correctIndex:Number.isInteger(q?.correct)?q.correct:null,accepted:Array.isArray(q?.accepted)?q.accepted.map(String):Array.isArray(q?.required)?q.required.map(String):null,required:Array.isArray(q?.required)?q.required.map(String):null,explanation:String(q?.explanation||q?.explain||''),answer:String(q?.answer||q?.answerText||''),count:(Number(old?.count)||0)+1,lastWrongAt:eventAt,dayKey,weekKey,resolved:false,resolvedAt:null};
}
function reviewItemAt(item){const lastWrongAt=Number(item?.lastWrongAt)||0,resolvedAt=Number(item?.resolvedAt)||0;return item?.resolved===true?Math.max(lastWrongAt,resolvedAt)+1:lastWrongAt;}
async function recordLearningError(name,subject,exercise,index,topic,q,correct,occurredAt=Date.now()){
 if(!db||!uid||!SOLO_NAMES.includes(name)||!exercise)return false;
 const eventAt=Number(occurredAt)||Date.now(),path=`learningActivity/${uid}/${name}/${exercise}`,sharedPath=`learningReview/${name}/${subject}/${exercise}/${index}`;
 // Tages- und Wochenwertung nur für bestätigte Lernantworten, niemals für Live-Battles.
 try{
  let changedItem=null;
  await runTransaction(ref(db,path),current=>{
   const value=current&&typeof current==='object'?{...current}:{};
   const {dayKey,weekKey}=activityPeriodKeys(eventAt);
   if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}
   if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}
   value.lastAt=Math.max(Number(value.lastAt)||0,eventAt);
   const errors={...(value.errorItems||{})},key=String(index),old=errors[key];
   if(correct){const base=old||learningErrorRecord(name,subject,topic,q,null,eventAt);changedItem={...base,resolved:true,resolvedAt:Math.max(eventAt,Number(base.lastWrongAt)||0)+1};errors[key]=changedItem;}
   else{changedItem=learningErrorRecord(name,subject,topic,q,old,eventAt);errors[key]=changedItem;}
   value.errorItems=errors;return value;
  });
  await runTransaction(ref(db,sharedPath),current=>{
   if(correct){const base=current||learningErrorRecord(name,subject,topic,q,null,eventAt);return {...base,resolved:true,resolvedAt:Math.max(eventAt,Number(base.lastWrongAt)||0)+1};}
   const next=learningErrorRecord(name,subject,topic,q,current,eventAt);
   return next;
  });
  await updateDailyLeaderboard(name,subject,eventAt,!correct);
  activitySyncWarned=false;return true;
 }catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg(`Fehler konnten nicht geräteübergreifend gespeichert werden (${e.code||e.message||'Firebase-Zugriff verweigert'}).`,true);}return false;}
}
function childLearningExercises(subject){if(subject==='math')return ['math_rational_battle1','math_rational_battle2','math_rational_battle3','math_rational_cards','math_exam','math_rational_exam','math_proportional_practice','math_proportional_exam1','math_proportional_exam2','math_proportional_exam3',...MATH_PROPORTIONAL_PRACTICE_BLOCKS.map(b=>`math_proportional_practice_${b.id}`),'math_proportional_worksheet','math_proportional_flashcards',...FRACTION_MODULES.map(m=>`math_fraction_${m.id}`)];return ['english_vocab_battle1','english_vocab_battle2','english_vocab_battle3','english_vocab_work_page1','english_vocab_work_page2','english_vocab_work_station2_page1','english_vocab_work_station2_page2','english_listening','english_reading',...GRAMMAR.flatMap((station,s)=>station.tasks.map((_,i)=>`english_grammar_${s+1}_task${i+1}`)),...WRITING_TASKS.map((_,i)=>`english_writing_task${i+1}`)];}
async function mergeSharedLearningReview(name,subject,exercise,index,item){
 if(!item||(item.subject&&item.subject!==subject)||item.source==='live_battle'||item.source==='battle')return;
 const at=Number(item.lastWrongAt)||Date.now(),period=activityPeriodKeys(at),resolved=item.resolved===true;
 const normalized={...item,attempted:true,source:'answer_check',subject,topic:String(item.topic||exercise),prompt:String(item.prompt||item.q||item.word||exercise),count:Math.max(1,Number(item.count)||1),lastWrongAt:at,dayKey:String(item.dayKey||period.dayKey),weekKey:String(item.weekKey||period.weekKey),resolved};
 delete normalized.resolvedAt;
 if(resolved)normalized.resolvedAt=Math.max(Number(item.resolvedAt)||0,at)+1;
 const path=`learningReview/${name}/${subject}/${exercise}/${index}`;
 await runTransaction(ref(db,path),current=>!current||reviewItemAt(normalized)>=reviewItemAt(current)?normalized:current);
}
async function loadChildLearningActivity(name,subject){
 const ids=childLearningExercises(subject),[rows,sharedResult]=await Promise.all([
  Promise.all(ids.map(async id=>[id,(await get(ref(db,`learningActivity/${uid}/${name}/${id}`))).val()])),
  get(ref(db,`learningReview/${name}/${subject}`)).then(snapshot=>({shared:snapshot.val()||{}})).catch(error=>({error}))
 ]),data=Object.fromEntries(rows.filter(([,value])=>value));
 const shared=sharedResult.shared||{};
 if(sharedResult.error&&!activitySyncWarned){activitySyncWarned=true;msg(`Fehler von anderen Geräten konnten nicht geladen werden (${sharedResult.error.code||sharedResult.error.message||'Firebase-Zugriff verweigert'}).`,true);}
 const migrations=[];
 if(!sharedResult.error)for(const [exercise,entry] of Object.entries(data))for(const [index,item] of Object.entries(entry?.errorItems||{})){
  const current=shared[exercise]?.[index];
  if(!current||reviewItemAt(item)>reviewItemAt(current))migrations.push(mergeSharedLearningReview(name,subject,exercise,index,item));
 }
 if(migrations.length)void Promise.allSettled(migrations).then(results=>{
  const failure=results.find(result=>result.status==='rejected');
  if(failure&&!activitySyncWarned){activitySyncWarned=true;msg(`Alte Fehler sind geladen, konnten aber nicht alle auf andere Geräte übertragen werden (${failure.reason?.code||failure.reason?.message||'Firebase-Regelprüfung'}).`,true);}
 });
 for(const [exercise,errorItems] of Object.entries(shared)){
  if(!data[exercise])data[exercise]={};
  const merged={...(data[exercise].errorItems||{})};
  for(const [index,item] of Object.entries(errorItems||{}))if(!merged[index]||reviewItemAt(item)>=reviewItemAt(merged[index]))merged[index]=item;
  data[exercise].errorItems=merged;
 }
 return data;
}
async function importLegacyLearningErrors(subject,name){
 if(!db||!uid||!SOLO_NAMES.includes(name))return;
 const rows=[];
 const remoteRoot=subject==='math'?'mathProgress':'soloProgress';let remote={};try{remote=(await get(ref(db,`${remoteRoot}/${uid}/${name}`))).val()||{};}catch{}
 if(subject==='math'){
  for(let b=0;b<=18;b++){const local=mathLoad(name,b),cloud=remote[`battle${b+1}`]||{},state={...cloud,...local,index:Math.max(Number(local?.index)||0,Number(cloud?.done)||0),updatedAt:Math.max(Number(local?.updatedAt)||0,Number(cloud?.updatedAt)||0),mistakes:{...(cloud?.mistakes||{}),...(local?.mistakes||{})}};if(!Object.keys(state.mistakes).length)continue;let questions=b<3?MATH_BATTLES[b]:b===3?MATH_CARDS.map(([prompt,answer])=>({prompt,accepted:[answer]})):mathExamData(b)?.questions;if(!questions)continue;const exercise=mathActivityId(b),topic=mathExamData(b)?.title||RATIONAL_MATH_TITLES[b]||'Rationale Zahlen · Merkkarten';const attempted=Number.isInteger(Number(state.index))?Math.max(0,Number(state.index)):0;for(const [index,count] of Object.entries(state.mistakes)){const questionIndex=Number(index);if(Number(count)<=0||questionIndex<0||questionIndex>=attempted||!questions[questionIndex])continue;const raw=questions[Number(index)],q=raw.options?raw:{prompt:raw.prompt||raw.q,accepted:raw.accepted||[],explanation:raw.explanation||raw.explain||''};rows.push({exercise,index,topic,q,at:state.updatedAt});}}
  for(const module of FRACTION_MODULES){const local=fractionLoad(name,module.id),cloud=remote[`fraction_${module.id}`]||{},state={...cloud,...local,index:Math.max(Number(local?.index)||0,Number(cloud?.done)||0),updatedAt:Math.max(Number(local?.updatedAt)||0,Number(cloud?.updatedAt)||0),mistakes:{...(cloud?.mistakes||{}),...(local?.mistakes||{})}};const attempted=Math.max(0,Number(state?.index)||0);for(const [index,count] of Object.entries(state?.mistakes||{})){const questionIndex=Number(index);if(Number(count)>0&&questionIndex>=0&&questionIndex<attempted&&module.questions[questionIndex])rows.push({exercise:`math_fraction_${module.id}`,index:questionIndex,topic:`Bruchrechnung · ${module.title}`,q:module.questions[questionIndex],at:state.updatedAt});}}
 }else{
  for(let b=0;b<3;b++){const local=soloSaved(b),cloud=remote[`battle${b+1}`]||{},state={...cloud,...local,index:Math.max(Number(local?.index)||0,Number(cloud?.done)||0),updatedAt:Math.max(Number(local?.updatedAt)||0,Number(cloud?.updatedAt)||0),mistakes:{...(cloud?.mistakes||{}),...(local?.mistakes||{})}};const attempted=Math.max(0,Number(state?.index)||0);for(const [index,count] of Object.entries(state?.mistakes||{})){const questionIndex=Number(index);if(Number(count)>0&&questionIndex>=0&&questionIndex<attempted&&BATTLES[b]?.[questionIndex])rows.push({exercise:`english_vocab_battle${b+1}`,index:questionIndex,topic:`Vokabeln ${b+1}`,q:BATTLES[b][questionIndex],at:state.updatedAt});}}
  const listeningLocal=listenLoad(),listeningCloud=remote.listeningUnit2||{},listening={...listeningCloud,...listeningLocal,index:Math.max(Number(listeningLocal?.index)||0,Number(listeningCloud?.done)||0),updatedAt:Math.max(Number(listeningLocal?.updatedAt)||0,Number(listeningCloud?.updatedAt)||0),mistakes:{...(listeningCloud?.mistakes||{}),...(listeningLocal?.mistakes||{})}},listeningAttempted=Math.max(0,Number(listening.index)||0);for(const [index,count] of Object.entries((!listeningCloud.runId||/^solo-/.test(String(listeningCloud.runId)))?listening?.mistakes||{}:{})){const questionIndex=Number(index);if(Number(count)>0&&questionIndex>=0&&questionIndex<listeningAttempted&&LISTENING_QUESTIONS[questionIndex])rows.push({exercise:'english_listening',index:questionIndex,topic:'Listening · Activity weekend in Cardiff',q:LISTENING_QUESTIONS[questionIndex],at:listening.updatedAt});}
  for(let station=0;station<2;station++)for(let task=0;task<GRAMMAR[station].tasks.length;task++){const record=firstRead('grammar',station+'_'+task);for(const error of record?.errors||[]){if(!String(error.answer||'').trim())continue;const index=Number(error.position)-1,answers=String(error.correct||'').split(' / ').filter(Boolean),exercise=`english_grammar_${station+1}_task${task+1}`,question=GRAMMAR[station].tasks[task].items?.[index],prompt=question?`${question[0]} _____ ${question[1]}`:`${GRAMMAR[station].tasks[task].title} · Aufgabe ${index+1}`;if(answers.length)rows.push({exercise,index,topic:`${GRAMMAR[station].title} · ${GRAMMAR[station].tasks[task].title}`,q:{prompt,accepted:answers}});}}
  const workPages=[
   {exercise:'english_vocab_work_page1',topic:'Vokabelarbeit · Station 1 · Seite 1',answers:VOCAB_WORK_ANSWERS[1],values:vocabWorkLoad(1),saved:vocabWorkSavedResult(1)},
   {exercise:'english_vocab_work_page2',topic:'Vokabelarbeit · Station 1 · Seite 2',answers:VOCAB_WORK_ANSWERS[2],values:vocabWorkLoad(2),saved:vocabWorkSavedResult(2)},
   {exercise:'english_vocab_work_station2_page1',topic:'Vokabelarbeit · Station 2 · Seite 1',answers:VOCAB_WORK_STATION2_ANSWERS[1],values:vocabWorkStation2Load(1),saved:vocabWorkStation2SavedResult(1)},
   {exercise:'english_vocab_work_station2_page2',topic:'Vokabelarbeit · Station 2 · Seite 2',answers:VOCAB_WORK_STATION2_ANSWERS[2],values:vocabWorkStation2Load(2),saved:vocabWorkStation2SavedResult(2)}
  ];
  for(const page of workPages){if(!page.saved||!Array.isArray(page.values))continue;page.answers.forEach((accepted,index)=>{const answer=String(page.values[index]||'');if(answer.trim()&&!accepted.some(value=>grammarNormalize(value)===grammarNormalize(answer)))rows.push({exercise:page.exercise,index,topic:page.topic,q:{prompt:`${page.topic} · Aufgabe ${index+1}`,accepted}});});}
  const reading=readingLoad(),draft=reading;
  if(reading?.checked&&draft){const paragraphOptions=['1','2','3','4','-'];READING_HEADINGS.forEach((question,index)=>{if(question.correct==='-')return;const selected=String(draft.matches?.[index]||'').trim();if(selected&&selected!==question.correct)rows.push({exercise:'english_reading',index,topic:'Reading · Cardiff Castle · Überschriften',q:{prompt:question.text,options:paragraphOptions,correct:paragraphOptions.indexOf(question.correct),type:'tf'}});});const truthOptions=['Right','Wrong','Not in the text'];READING_STATEMENTS.forEach(([prompt,correct],index)=>{const selected=String(draft.truth?.[index]||'').trim();if(selected&&selected!==correct)rows.push({exercise:'english_reading',index:READING_HEADINGS.length+index,topic:'Reading · Cardiff Castle · Aussagen',q:{prompt,options:truthOptions,correct:truthOptions.indexOf(({right:'Right',wrong:'Wrong',not:'Not in the text'})[correct]),type:'tf'}});});}
 }
 if(!rows.length)return [];
 const existing=await loadChildLearningActivity(name,subject),latestByExercise=new Map();for(const row of rows){const old=latestByExercise.get(row.exercise)||0;latestByExercise.set(row.exercise,Math.max(old,Number(row.at)||0));}
 await Promise.all([...latestByExercise].map(([exercise,at])=>restoreLearningActivityAt(name,exercise,at)));
 await Promise.all(rows.filter(row=>!existing[row.exercise]?.errorItems?.[String(row.index)]).map(row=>recordLearningError(name,subject,row.exercise,row.index,row.topic,row.q,false,row.at||Date.now())));
  return rows;
}
function errorPeriodChoice(subject){errorEvalSubject=subject;errorEvalMode='analytics';errorEvalPeriod='';errorEvalTopics=[];errorEvalQueue=[];errorEvalCurrent=null;const names=SOLO_NAMES.map((n,i)=>btn(esc(n),`errorName${subject}_${i}`));app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'}-Auswertung</h2><p>Wähle dein Kind.</p><div class="name-actions">${names.join('')}</div>`)+card(btn('Zurück','home','alt'));}
function learningActivityLabel(exercise){
 const fixed={english_vocab_battle1:'Vokabeln 1',english_vocab_battle2:'Vokabeln 2',english_vocab_battle3:'Vokabeln 3',english_listening:'Listening',english_reading:'Reading',math_rational_cards:'Rationale Zahlen · Merkkarten',math_proportional_practice:'Proportional / Antiproportional · Übung',math_proportional_worksheet:'Proportional · Arbeitsblatt',math_proportional_flashcards:'Proportional · Lernkarten'};
 if(fixed[exercise])return fixed[exercise];
 let match=String(exercise).match(/^english_vocab_work_page(\\d+)$/);if(match)return 'Vokabelarbeit · Seite '+match[1];
 match=String(exercise).match(/^english_vocab_work_station2_page(\\d+)$/);if(match)return 'Vokabelarbeit · Station 2 · Seite '+match[1];
 match=String(exercise).match(/^english_grammar_(\\d+)_task(\\d+)$/);if(match){const task=GRAMMAR[Number(match[1])-1]?.tasks?.[Number(match[2])-1]?.title;return 'Grammatik · Station '+match[1]+(task?' · '+task:'');}
 match=String(exercise).match(/^english_writing_task(\\d+)$/);if(match)return 'Writing · Aufgabe '+match[1];
 match=String(exercise).match(/^math_rational_battle(\\d+)$/);if(match)return RATIONAL_MATH_TITLES[Number(match[1])-1]||'Rationale Zahlen · Battle '+match[1];
 match=String(exercise).match(/^math_fraction_(.+)$/);if(match){const module=FRACTION_MODULES.find(item=>item.id===match[1]);return module?'Bruchrechnung · '+module.title:'Bruchrechnung';}
 match=String(exercise).match(/^math_proportional_practice_(.+)$/);if(match){const block=MATH_PROPORTIONAL_PRACTICE_BLOCKS.find(item=>item.id===match[1]);return block?'Proportional / Antiproportional · '+block.title:'Proportional / Antiproportional';}
 return String(exercise).replace(/^(english|math)_/,'').replace(/_/g,' ');
}
function learningReviewSubjectChoice(name){
 if(!SOLO_NAMES.includes(name)){soloChooseName();return;}
 if(!db||!uid){msg('Verbindung wird hergestellt. Bitte gleich noch einmal öffnen.',true);return;}
 errorEvalName=name;errorEvalSubject='child';errorEvalMode='childReview';errorEvalPeriod='';errorEvalTopics=[];errorEvalQueue=[];errorEvalCurrent=null;
 app.innerHTML=card(`<h2>📘 ${esc(name)} · Fehler wiederholen</h2><p>Wähle ein Fach. Die Fehler werden getrennt angezeigt.</p><div class="name-actions">${btn('🇬🇧 Englisch · Fehler üben','reviewEnglishChild','english-learn-action')}${btn('🔢 Mathe · Fehler üben','reviewMathChild','math-learn-action')}</div>`)+card(btn('Zurück zum Lernen','reviewBack','alt'));
}
async function learningReview(name,subject=''){
 if(!SOLO_NAMES.includes(name)){soloChooseName();return;}

 if(!db||!uid){msg('Verbindung wird hergestellt. Bitte gleich noch einmal öffnen.',true);return;}
 soloName=name;mathName=name;localStorage.setItem('vb2solo_name',name);localStorage.setItem('vb2math_name',name);
 if(subject!=='english'&&subject!=='math'){learningReviewSubjectChoice(name);return;}
 errorEvalSubject=subject;errorEvalMode='childReview';errorEvalPeriod='';errorEvalName=name;errorEvalTopics=[];errorEvalQueue=[];errorEvalCurrent=null;
 app.innerHTML=card(`<h2>📘 ${esc(name)} · ${subject==='math'?'Mathe':'Englisch'}-Fehler</h2><p>Offene Fehler werden nach Thema geladen …</p>`);
 try{
  const data=await loadChildLearningActivity(name,subject),topics=new Map();
  for(const [exercise,entry] of Object.entries(data))for(const [index,item] of Object.entries(entry?.errorItems||{})){
   const itemSubject=item?.subject|| (exercise.startsWith('math_')?'math':'english');
   const hasAttemptEvidence=item?.attempted===true||Number(index)<Math.max(0,Number(entry?.live?.done)||0);
   if(itemSubject!==subject||item?.resolved===true||item?.source==='live_battle'||item?.source==='battle'||!hasAttemptEvidence)continue;
   const reviewItem={...item,subject};
   if(!reviewItem.image&&Array.isArray(reviewItem.images)&&reviewItem.images.length===1)reviewItem.image=String(reviewItem.images[0]||'');
   const station2Picture=String(exercise).match(/^english_vocab_work_station2_page1$/);
   if(station2Picture&&Number(index)<6)reviewItem.image=VOCAB_WORK_STATION2_BATTLE_QUESTIONS[Number(index)]?.image||'';
   const vocabWorkReview=vocabWorkReviewData(String(exercise),Number(index));
   if(vocabWorkReview){
    reviewItem.prompt=vocabWorkReview.prompt;
    reviewItem.instruction=vocabWorkReview.instruction;
    const station1=String(exercise).match(/^english_vocab_work_page(\d+)$/),station2=String(exercise).match(/^english_vocab_work_station2_page(\d+)$/);
    const canonicalAnswers=station1?VOCAB_WORK_ANSWERS[Number(station1[1])]?.[Number(index)]:station2?VOCAB_WORK_STATION2_ANSWERS[Number(station2[1])]?.[Number(index)]:null;
    if(Array.isArray(canonicalAnswers)){
     reviewItem.accepted=canonicalAnswers.map(String);
     reviewItem.answer='';
     reviewItem.type='text';
     delete reviewItem.options;
     delete reviewItem.correctIndex;
     delete reviewItem.required;
    }
   }
   const storedTitle=String(item.topic||''),title=/^Vokabel-Battle [1-3]$/.test(storedTitle)?learningActivityLabel(exercise):storedTitle||learningActivityLabel(exercise),key=`${subject}::${title}`;
   if(!topics.has(key))topics.set(key,{title,subject,items:[]});
   topics.get(key).items.push({exercise,index,item:reviewItem});
  }
  errorEvalTopics=[...topics.values()].map(group=>({...group,items:group.items.sort((a,b)=>Number(a.item.lastWrongAt||0)-Number(b.item.lastWrongAt||0))}));
  const count=errorEvalTopics.reduce((total,group)=>total+group.items.length,0),label=subject==='math'?'🔢 Mathe':'🇬🇧 Englisch';
  const blocks=errorEvalTopics.length?errorEvalTopics.map((group,index)=>`<div class="player"><h3>${esc(group.title)}</h3><p>${group.items.length} Aufgabe${group.items.length===1?'':'n'} offen</p>${btn(`Jetzt üben (${group.items.length})`,`reviewTopic${index}`)}</div>`).join(''):'<p class="muted">Keine offenen Fehler in diesem Fach. ✅</p>';
  app.innerHTML=card(`<h2>📘 ${esc(name)} · ${label} · Das muss ich erneut lernen</h2><p>Jede Aufgabe bleibt hier, bis sie richtig gelöst ist. Danach wird sie aus dieser Liste entfernt.</p><p><strong>${count} Aufgabe${count===1?'':'n'} offen</strong></p>${blocks}`)+card(btn(`Zurück zum ${subject==='math'?'Mathe-':'Englisch-'}Lernen`,'reviewBack','alt'));
  const importKey=`vb2_legacy_review_import_${uid}_${name}_${subject}`;
  if(localStorage.getItem(importKey)!=='1'&&!legacyLearningImportPending.has(importKey)){
   legacyLearningImportPending.add(importKey);
   void importLegacyLearningErrors(subject,name).then(()=>{
    localStorage.setItem(importKey,'1');
    if(errorEvalMode==='childReview'&&errorEvalName===name&&errorEvalSubject===subject)void learningReview(name,subject);
   }).catch(error=>{if(errorEvalMode==='childReview'&&errorEvalName===name&&errorEvalSubject===subject)msg(`Ältere Fehler konnten nicht ergänzt werden (${error.code||error.message}).`,true);}).finally(()=>legacyLearningImportPending.delete(importKey));
  }
 }catch(e){msg('Wiederholaufgaben konnten nicht geladen werden: '+e.message,true);}
}
async function errorEvaluation(subject,period){
 const name=subject==='math'?mathName:soloName;if(!name||!SOLO_NAMES.includes(name)){errorPeriodChoice(subject);return;}if(!db||!uid){msg('Verbindung wird hergestellt. Bitte gleich noch einmal öffnen.',true);return;}
 errorEvalMode='analytics';errorEvalName=name;
 if(!period){errorEvalSubject=subject;errorEvalPeriod='';app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'}-Auswertung · ${esc(name)}</h2><p>Welchen Zeitraum möchtest du ansehen?</p><div class="name-actions">${btn('📅 Tägliche Auswertung','errorPeriod_day')}${btn('🗓️ Wöchentliche Auswertung','errorPeriod_week')}</div>`)+card(btn('Zurück','home','alt'));return;}
 errorEvalSubject=subject;errorEvalPeriod=period;app.innerHTML=card('<h2>Auswertung wird geladen …</h2>');
 try{await importLegacyLearningErrors(subject,name);const data=await loadChildLearningActivity(name,subject),keys=activityPeriodKeys(),topics=new Map();for(const [exercise,entry] of Object.entries(data)){if(exercise==='english_vocab_work_battle1'||exercise==='english_vocab_work_battle2')continue;for(const [index,item] of Object.entries(entry?.errorItems||{})){if(item?.subject!==subject)continue;const inPeriod=period==='day'?item.dayKey===keys.dayKey:item.weekKey===keys.weekKey;if(!inPeriod&&!item.resolved){/* offene Fehler bleiben sichtbar, bis sie richtig gelöst sind */}else if(!inPeriod)continue;const topic=String(item.topic||exercise);if(!topics.has(topic))topics.set(topic,[]);topics.get(topic).push({exercise,index,item});}}
  errorEvalTopics=[...topics.entries()].map(([title,items])=>({title,items:items.sort((a,b)=>Number(a.item.lastWrongAt||0)-Number(b.item.lastWrongAt||0))}));const openCount=errorEvalTopics.reduce((n,t)=>n+t.items.filter(x=>!x.item.resolved).length,0),periodLabel=period==='day'?'Heute':'Diese Woche';
  const activityField=period==='day'?'dayCount':'weekCount',activityKey=period==='day'?'dayKey':'weekKey',activityDate=period==='day'?keys.dayKey:keys.weekKey,activityTitle=period==='day'?'Heute geübt':'Diese Woche geübt',activityRows=Object.entries(data).filter(([exercise,entry])=>exercise!=='english_vocab_work_battle1'&&exercise!=='english_vocab_work_battle2'&&entry?.[activityKey]===activityDate&&Number(entry[activityField])>0).sort((a,b)=>Number(b[1].lastAt||0)-Number(a[1].lastAt||0));
  const activitySummary=activityRows.length?`<div class="player"><h3>${activityTitle}</h3>${activityRows.map(([exercise,entry])=>`<p>📘 ${esc(learningActivityLabel(exercise))} · ${Number(entry[activityField])}× gestartet oder fortgesetzt</p>`).join('')}</div>`:'';
  const blocks=errorEvalTopics.length?errorEvalTopics.map((t,i)=>{const open=t.items.filter(x=>!x.item.resolved).length,done=t.items.length-open;return `<div class="player"><h3>${esc(t.title)}</h3><p>${open} offen · ${done} richtig bearbeitet</p>${open?btn(`Fehler üben (${open})`,`errorTopic${i}`):'<p class="good">✅ Alle Fehler richtig bearbeitet</p>'}</div>`;}).join(''):'<p class="muted">Keine Fehler für diesen Zeitraum. Richtig beantwortete Aufgaben erscheinen hier nicht als Fehler.</p>';
  app.innerHTML=card(`<h2>📊 ${subject==='math'?'Mathe':'Englisch'} · ${periodLabel} · ${esc(name)}</h2><p>Nach Themen gebündelt. Offene Fehler bleiben hier, bis du sie richtig löst.</p>${activitySummary}<p><strong>${openCount} noch offen</strong></p>${blocks}<div class="name-actions">${btn('📅 Tägliche Auswertung','errorPeriod_day','alt')}${btn('🗓️ Wöchentliche Auswertung','errorPeriod_week','alt')}</div>`)+card(btn('Zurück zur Übersicht','errorSubjectHome','alt'));
 }catch(e){msg('Auswertung konnte nicht geladen werden: '+e.message,true);}
}
function errorPracticeStart(topicIndex){const topic=errorEvalTopics[topicIndex];if(!topic)return;errorEvalQueue=topic.items.filter(x=>!x.item.resolved);errorEvalCurrent={topicIndex,position:0};errorPracticeShow();}
function errorPracticeShow(){
 if(!errorEvalCurrent)return;
 const group=errorEvalTopics[errorEvalCurrent.topicIndex];
 errorEvalQueue=group.items.filter(x=>!x.item.resolved);
 if(!errorEvalQueue.length){if(errorEvalMode==='childReview')void learningReview(errorEvalName,errorEvalSubject);else void errorEvaluation(errorEvalSubject,errorEvalPeriod);return;}
 const entry=errorEvalQueue[0],item=entry.item,worksheet={...item,q:item.prompt,answerText:item.answer};
 let input;
 if(item.type==='order')input=`${listeningControls(worksheet,'error')}<button data-error-listening-submit="order">Antwort prüfen</button>`;
 else if(item.options)input=`<div class="answers">${item.options.map((o,i)=>`<button data-error-answer="${i}">${esc(o)}</button>`).join('')}</div>`;
 else input=`<label>Deine Antwort<textarea data-error-text rows="${item.type==='open'?3:1}" autocomplete="off" autocapitalize="none"></textarea></label>${btn('Antwort prüfen','errorTextCheck')}`;
 app.innerHTML=card(`<p class="muted">${group.subject==='math'?'🔢 Mathe':'🇬🇧 Englisch'} · ${esc(group.title)} · ${errorEvalQueue.length} noch offen</p><h2>${item.subject==='math'?mathText(item.prompt||'Aufgabe'):esc(item.prompt||'Aufgabe')}</h2>${item.instruction?`<p class="muted">${esc(item.instruction)}</p>`:''}${item.image?'<img src="'+esc(item.image)+'" alt="Bild zur Aufgabe" style="display:block;max-width:100%;max-height:240px;object-fit:contain;margin:12px auto">':''}${item.type==='order'||item.task?listeningTaskImage(item.task):''}${input}<div id="error-feedback"></div>`)+card(btn('Zur Themenliste','errorRefresh','alt'));
}
async function errorPracticeAnswer(value){
 if(!errorEvalCurrent||!errorEvalQueue.length)return;
 const entry=errorEvalQueue[0],item=entry.item,typed=String(value??'').trim();
 let correct;
 const accepted=Array.isArray(item.accepted)&&item.accepted.length?item.accepted:Array.isArray(item.required)&&item.required.length?item.required:item.answer?[item.answer]:[];
 if(item.type==='order')correct=Array.isArray(value)&&value.map(String).join(',')===(item.accepted||[]).join(',');
 else if(Array.isArray(item.options)&&item.correctIndex!==null&&item.correctIndex!==undefined&&Number.isInteger(Number(item.correctIndex)))correct=Number(value)===Number(item.correctIndex);
 else if(Array.isArray(item.options)){const selected=item.options[Number(value)];correct=Boolean(selected)&&accepted.some(x=>grammarNormalize(x)===grammarNormalize(selected));}
 else if(item.type==='open'){const required=Array.isArray(item.required)&&item.required.length?item.required:accepted;correct=required.length>0&&required.every(term=>grammarNormalize(typed).includes(grammarNormalize(term)));}
 else correct=accepted.some(x=>grammarNormalize(x)===grammarNormalize(typed));
 const subject=errorEvalSubject==='math'||errorEvalSubject==='english'?errorEvalSubject:(item.subject||(entry.exercise.startsWith('math_')?'math':'english'));
 const saved=await recordLearningError(errorEvalName,subject,entry.exercise,entry.index,item.topic,item,correct);
 if(!saved){const fb=document.querySelector('#error-feedback');if(fb)fb.innerHTML='<p class="error">Der Lernstand konnte nicht gespeichert werden. Bitte Verbindung prüfen und erneut versuchen.</p>';return;}
 if(correct){
  item.resolved=true;errorEvalQueue.shift();
  if(errorEvalMode==='childReview'){
   if(errorEvalQueue.length){msg('✅ Richtig. Die gelöste Aufgabe wurde entfernt.',false);errorPracticeShow();}
   else await learningReview(errorEvalName,errorEvalSubject);
   return;
  }
  const feedback=document.querySelector('#error-feedback');
  if(feedback)feedback.innerHTML='<p class="good"><strong>✅ Richtig! Die Aufgabe ist erledigt und aus der offenen Liste entfernt.</strong></p>'+btn(errorEvalQueue.length?'Weiter ➜':'Zur Themenliste','errorPracticeNext');
  else errorPracticeShow();
  return;
 }
 const fb=document.querySelector('#error-feedback');
 if(fb)fb.innerHTML=`<p class="error"><strong>❌ Noch nicht richtig.</strong> ${Array.isArray(item.options)&&item.correctIndex!==null&&item.correctIndex!==undefined?`Richtige Antwort: ${esc(item.options[item.correctIndex]??'')}`:accepted.length?`Richtige Lösung: ${esc(accepted.join(' / '))}`:'Bitte kontrolliere deine Antwort noch einmal.'}</p><p>Versuche dieselbe Aufgabe noch einmal. Sie bleibt offen, bis sie richtig ist.</p>`;
}
function subjectNameForErrors(){return errorEvalSubject==='math'?mathName:soloName;}
function errorPracticeNext(){if(errorEvalCurrent&&errorEvalQueue.length){errorPracticeShow();return;}if(errorEvalMode==='childReview')void learningReview(errorEvalName,errorEvalSubject);else void errorEvaluation(errorEvalSubject,errorEvalPeriod);}
function errorEvaluationAction(action){if(action==='dailyLeaderboardEnglish'){void showDailyLeaderboard('english');return true;}if(action==='dailyLeaderboardMath'){void showDailyLeaderboard('math');return true;}const reviewMatch=action.match(/^reviewChild(\d)$/);if(reviewMatch){void learningReview(SOLO_NAMES[Number(reviewMatch[1])]);return true;}if(action==='reviewEnglishChild'){void learningReview(soloName,'english');return true;}if(action==='reviewMathChild'){if(mathNeedName('reviewMathChild'))return true;void learningReview(mathName,'math');return true;}if(action==='reviewSwitchEnglish'){void learningReview(errorEvalName,'english');return true;}if(action==='reviewSwitchMath'){void learningReview(errorEvalName,'math');return true;}if(action==='reviewSubjectBack'){learningReviewSubjectChoice(errorEvalName);return true;}if(/^reviewTopic\d+$/.test(action)){errorPracticeStart(Number(action.slice(11)));return true;}if(action==='errorMath'){errorPeriodChoice('math');return true;}if(action==='errorEnglish'){errorPeriodChoice('english');return true;}if(action.startsWith('errorName')){const [,subject,index]=action.match(/^errorName(math|english)_(\d)$/)||[];if(!subject)return true;const name=SOLO_NAMES[Number(index)];if(subject==='math'){mathName=name;localStorage.setItem('vb2math_name',name);}else{soloName=name;localStorage.setItem('vb2solo_name',name);}errorEvaluation(subject);return true;}if(action==='errorPeriod_day'||action==='errorPeriod_week'){errorEvaluation(errorEvalSubject,action.endsWith('day')?'day':'week');return true;}if(/^errorTopic\d+$/.test(action)){errorPracticeStart(Number(action.slice(10)));return true;}if(action==='errorPracticeNext'){errorPracticeNext();return true;}if(action==='errorRefresh'){if(errorEvalMode==='childReview')void learningReview(errorEvalName,errorEvalSubject);else void errorEvaluation(errorEvalSubject,errorEvalPeriod);return true;}if(action==='reviewBack'){if(errorEvalName&&errorEvalMode==='childReview'){soloName=errorEvalName;mathName=errorEvalName;if(errorEvalSubject==='math')mathHome();else soloHome();}else if(errorEvalName){soloName=errorEvalName;mathName=errorEvalName;soloHome();}else home();return true;}if(action==='errorSubjectHome'){if(errorEvalSubject==='math')mathHome();else soloHome();return true;}if(action==='errorTextCheck'){const value=document.querySelector('[data-error-text]')?.value||'';void errorPracticeAnswer(value);return true;}return false;}
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
  const vocabWorkResetKeys={
   vocabWork1:[`vb2vocabwork_${name}_station1_page1`,`vb2vocabwork_result_${name}_station1_page1`],
   vocabWork2:[`vb2vocabwork_${name}_station1_page2`,`vb2vocabwork_result_${name}_station1_page2`],
   vocabWorkStation2Page1:[`vb2vocabwork_${name}_station2_page1`,`vb2vocabwork_result_${name}_station2_page1`],
   vocabWorkStation2Page2:[`vb2vocabwork_${name}_station2_page2`,`vb2vocabwork_result_${name}_station2_page2`]
  };
  for(const [moduleId,keys] of Object.entries(vocabWorkResetKeys)){
   const stamp=Number(resetState[`${name}__${moduleId}`])||0,seenKey=`vb2reset_seen_english_${name}_${moduleId}`;
   if(stamp>Number(localStorage.getItem(seenKey)||0)){
    for(const key of keys)localStorage.removeItem(key);
    localStorage.setItem(seenKey,String(stamp));
    if(soloName===name)activeEnglish=true;
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
 const resetData={base:{},english:{},math:{}},loaded={base:false,english:false,math:false};
 const apply=()=>{applyResetState({...resetData.base,...resetData.english,...resetData.math});resetReady=Object.values(loaded).every(Boolean);};
 const offBase=onValue(ref(db,'learningResets'),snap=>{resetData.base=snap.val()||{};loaded.base=true;apply();},e=>msg('Reset-Abgleich fehlgeschlagen: '+e.message,true));
 const offEnglish=onValue(ref(db,'learningResetsEnglish'),snap=>{resetData.english=snap.val()||{};loaded.english=true;apply();},e=>msg('Englisch-Reset konnte nicht geladen werden: '+e.message,true));
 const offMath=onValue(ref(db,'learningResetsMath'),snap=>{resetData.math=snap.val()||{};loaded.math=true;apply();},e=>msg('Mathe-Reset konnte nicht geladen werden: '+e.message,true));
 resetUnsubscribe=()=>{offBase();offEnglish();offMath();};
}

function stopSoloHeartbeat(){if(soloHeartbeat!==null){clearInterval(soloHeartbeat);soloHeartbeat=null;}}
function startSoloHeartbeat(){stopSoloHeartbeat();soloHeartbeat=setInterval(()=>{if(solo&&soloName)void syncSolo();},30000);}
function stopDashboard(){if(dashboardUnsubscribe){dashboardUnsubscribe();dashboardUnsubscribe=null;}}
function stopClock(){if(clock!==null){clearInterval(clock);clock=null;}lastClockText='';}
function battleOverviewActivities(subject){
 if(subject==='math')return [
  ...FRACTION_MODULES.map(item=>({id:`fraction_${item.id}`,label:`Bruchrechnung · ${item.title}`})),
  ...RATIONAL_MATH_TITLES.slice(0,3).map((label,i)=>({id:`rational_${i+1}`,label})),
  {id:'proportional_exam',label:'Proportional-/Antiproportional-Klassenarbeit'}
 ];
 return [
  ...[1,2,3].map(i=>({id:`vocab_${i}`,label:`Vokabel-Battle ${i}`})),
  {id:'vocab_work_station1',label:'Vokabelarbeit · Station 1'},
  {id:'vocab_work_station2',label:'Vokabelarbeit · Station 2'},
  {id:'grammar_station1',label:'Grammatik · Station 1'},
  {id:'grammar_station2',label:'Grammatik · Station 2'},
  {id:'listening',label:'Listening-Battle'},
  {id:'reading',label:'Reading-Battle'},
  {id:'writing',label:'Writing-Battle'}
 ];
}
function competitionRank(entries){
 const sorted=[...entries].sort((a,b)=>Number(b.correct)-Number(a.correct)||String(a.name).localeCompare(String(b.name),'de'));let last=null,place=0;
 return sorted.map((row,index)=>{if(index===0||Number(row.correct)!==last)place=index+1;last=Number(row.correct);const tied=(index>0&&Number(sorted[index-1].correct)===last)||(index+1<sorted.length&&Number(sorted[index+1].correct)===last);return {row,place,tied,bonus:[10,8,5,3][place-1]||0};});
}
function legacyBattleResult(profile,activity){
 let legacy=null,correct=0,maxCorrect=0;
 if(/^vocab_[123]$/.test(activity.id)){
  const battle=Number(activity.id.slice(-1));legacy=profile[`battle${battle}`];if(!legacy||(!legacy.finished&&Number(legacy.done)<30))return null;
  correct=Number.isFinite(Number(legacy.correct))?Number(legacy.correct):Math.floor((Number(legacy.score)||0)/10);maxCorrect=30;
 }else if(activity.id==='grammar_station1'||activity.id==='grammar_station2'){
  legacy=profile[`grammarStation${activity.id.endsWith('1')?'1':'2'}`];if(!legacy?.finished||!legacy.runId)return null;
  correct=Number(legacy.correct);maxCorrect=Number(legacy.total);
 }else if(activity.id==='listening'){
  legacy=profile.listeningUnit2;if(!legacy?.finished||!/^battle-/.test(String(legacy.runId||'')))return null;
  correct=Math.round((Number(legacy.score)||0)/10);maxCorrect=Number(legacy.total)||LISTENING_TOTAL_POINTS;
 }else if(activity.id==='writing'){
  legacy=profile.writingBattleUnit2;if(!legacy?.finished||!/^writing-/.test(String(legacy.runId||'')))return null;
  correct=Math.round((Number(legacy.score)||0)/10);maxCorrect=Number(legacy.total)||WRITING_BATTLE.length;
 }else return null;
 if(!Number.isFinite(correct)||!Number.isFinite(maxCorrect)||maxCorrect<=0)return null;
 return {correct,maxCorrect,finished:true,updatedAt:Number(legacy.updatedAt)||0};
}
async function showBattleSeries(subject){
 stopSoloHeartbeat();const isMath=subject==='math',root=isMath?'mathProgress':'soloProgress',title=isMath?'Mathe':'Englisch';
 app.innerHTML=card(`<h2>🏆 ${title} · Battle-Auswertung</h2><p>Battle-Ergebnisse werden geladen …</p>`)+card(btn('Zurück','home','alt'));
 
try{
  const snap=await get(ref(db,`battleRankings/${subject}`)),data=snap.val()||{},activities=battleOverviewActivities(subject),rows=SOLO_NAMES.map(name=>({name,results:{},total:0,played:0}));
  for(const activity of activities)for(const row of rows){const record=data?.[activity.id]?.[row.name];if(!record?.finished||!Number.isFinite(Number(record.correct))||Number(record.maxCorrect)<=0)continue;row.results[activity.id]={correct:Math.min(Number(record.maxCorrect),Math.max(0,Number(record.correct)||0)),maxCorrect:Number(record.maxCorrect),updatedAt:Number(record.updatedAt)||0};}
  for(const activity of activities){const ranked=competitionRank(rows.filter(row=>row.results[activity.id]).map(row=>({...row,...row.results[activity.id]})));for(const entry of ranked){const result=rows.find(row=>row.name===entry.row.name).results[activity.id];result.place=entry.place;result.tied=entry.tied;result.bonus=entry.bonus;}}
  for(const row of rows){row.played=activities.filter(a=>row.results[a.id]).length;row.total=activities.reduce((sum,a)=>sum+(row.results[a.id]?.bonus||0),0);}
  const overall=competitionRank(rows.filter(row=>row.played).map(row=>({...row,correct:row.total})));for(const entry of overall){const row=rows.find(item=>item.name===entry.row.name);row.totalPlace=entry.place;row.totalTied=entry.tied;}
  const summaryHead=activities.map(a=>`<th>${esc(a.label)}</th>`).join('');
  const summaryRows=rows.map(row=>`<tr><td>${row.totalPlace?`${row.totalPlace}.${row.totalTied?' · Gleichstand':''}`:'–'}</td><td><strong>${esc(row.name)}</strong></td>${activities.map(a=>`<td>${row.results[a.id]?`+${row.results[a.id].bonus}`:'–'}</td>`).join('')}<td><strong>${row.played?row.total:'–'}</strong></td></tr>`).join('');
  const details=activities.map(activity=>{const ranked=competitionRank(rows.filter(row=>row.results[activity.id]).map(row=>({...row,...row.results[activity.id]}))),byName=new Map(ranked.map(e=>[e.row.name,e]));return `<details class="player"><summary><strong>${esc(activity.label)}</strong></summary><div style="overflow-x:auto"><table style="width:100%;min-width:0;table-layout:fixed;border-collapse:collapse;text-align:center;font-size:clamp(13px,3.6vw,16px)"><thead><tr><th style="width:15%">Platz</th><th style="width:30%">Name</th><th style="width:25%">Richtig</th><th style="width:30%">Bonus</th></tr></thead><tbody>${rows.map(row=>{const e=byName.get(row.name);return `<tr><td>${e?`${e.place}.`:'–'}</td><td>${esc(row.name)}</td><td>${e?`${e.row.correct}/${e.row.maxCorrect}`:'–'}</td><td>${e?`+${e.bonus}${e.tied?' · Gleichstand':''}`:'–'}</td></tr>`;}).join('')}</tbody></table></div>${ranked.length?'':'<p class="muted">Dieses Battle wurde noch nicht gewertet.</p>'}</details>`;}).join('');
  app.innerHTML=card(`<h2>🏆 ${title} · Battle-Auswertung</h2><p>Jedes Battle wird nach der Zahl der richtigen Antworten gewertet. Pro Battle gibt es zusätzlich 10 Punkte für Platz 1, 8 für Platz 2, 5 für Platz 3 und 3 für Platz 4. Bei Gleichstand erhalten alle denselben Bonus. Die Gesamtwertung addiert die Battle-Bonuspunkte dieses Fachs.</p><h3>Einzelwertung je Battle</h3>${details}<h3>Gesamtübersicht · nur ${title}</h3><div style="overflow-x:auto"><table style="width:100%;min-width:900px;border-collapse:collapse;text-align:center"><thead><tr><th>Platz</th><th>Name</th>${summaryHead}<th>Bonus gesamt</th></tr></thead><tbody>${summaryRows}</tbody></table></div>${rows.every(row=>!row.played)?'<p class="muted">Noch keine abgeschlossenen Battles gespeichert.</p>':''}`)+card(btn('Zurück zur Übersicht','home','alt'));
 }catch(e){app.innerHTML=card(`<h2>🏆 ${title} · Battle-Auswertung</h2><p class="error">Auswertung konnte nicht geladen werden: ${esc(e.message)}</p>`)+card(btn('Zurück zur Übersicht','home','alt'));}
}
function showEnglishSeries(){return showBattleSeries('english');}
function showGrammarSeries(){return showBattleSeries('english');}
function home(){stopDashboard();stopSoloHeartbeat();if(unsubscribe){unsubscribe();unsubscribe=null;}stopClock();code='';role='';slot='';room=null;solo=null;busy=false;previousStageKey='';joinExpectedRoomType='';status.textContent='';app.innerHTML=card(`<h2>📚 Alleine lernen</h2><div class="name-actions">${btn('🇬🇧 Englisch lernen · Vokabeln, Grammatik, Listening, Reading & Writing','solo','english-learn-action')}${btn('🔢 Mathe Klasse 7 NRW lernen','mathChoose','math-learn-action')}</div>`)+card(`<h2>⚔️ Battle</h2><div class="name-actions">${btn('⚡ Vokabel-Battle','join','english-vocab-action')}${btn('📝 Vokabelarbeit-Battle · Station 1, Seiten 1 + 2','joinVocabWork','english-vocab-action')}${btn('🩹 Vokabelarbeit-Battle · Station 2, Seiten 1 + 2','joinVocabWorkStation2','english-vocab-action')}${btn('🎧 Listening-Battle','join','english-listening-action')}${btn('📖 Reading-Battle','join','english-reading-action')}${btn('📘 Grammatik-Battle','join','english-grammar-action')}${btn('✍️ Writing-Battle','join','english-writing-action')}</div><p class="muted">Wähle ein Battle und gib anschließend den Spielcode ein.</p>`)+card(`<h2>🔢 Mathe-Battles</h2><div class="name-actions math-battle-buttons">${btn('1️⃣ Bruchrechnung-Battle beitreten','joinMathFractions','math-fractions-action')}${btn('2️⃣ Rationale-Zahlen-Battle beitreten','joinMathRational','math-rational-action')}${btn('3️⃣ Proportional-/Antiproportional-Klassenarbeit beitreten','joinMathExam','math-exam-action')}</div><p class="muted">Wähle das passende Battle und gib anschließend den Spielcode ein.</p>`);}
function listen(){if(unsubscribe)unsubscribe();stopClock();unsubscribe=onValue(ref(db,`rooms/${code}`),snap=>{room=snap.val();if(!room){msg('Raum nicht gefunden oder gelöscht.',true);return;}render();},e=>msg('Firebase-Zugriff verweigert: '+e.message,true));}
function current(){const m=room?.meta||{},b=Number(m.battle||1)-1,i=Number(m.index||0),localIndex=i%30;if(m.mode==='math-exam')return MATH_PROPORTIONAL_CLASSWORKS[0].questions[i%MATH_PROPORTIONAL_CLASSWORKS[0].questions.length];if(m.mode==='fractions'){const questions=FRACTION_MODULES[b]?.questions||[];return questions[i%Math.max(questions.length,1)];}if(m.mode==='reading')return READING_QUIZ[i];if(m.mode==='listening')return LISTENING_QUESTIONS[i];return (m.subject==='math'?MATH_BATTLES:BATTLES)[b]?.[localIndex];}
async function awardRoomPointsOnce(roomPath,slotId,questionKey,points){const result=await runTransaction(ref(db,`${roomPath}/slots/${slotId}`),current=>{if(!current||!current.uid)return;const awarded={...(current.awarded||{})},key=String(questionKey);if(awarded[key])return current;awarded[key]=true;return {...current,score:(Number(current.score)||0)+(Number(points)||0),awarded};});return result.committed;}
function roomQuestionCount(m=room?.meta||{}){return m.mode==='math-exam'?MATH_PROPORTIONAL_CLASSWORKS[0].questions.length:m.mode==='fractions'?(FRACTION_MODULES[Number(m.battle||1)-1]?.questions.length||0):m.mode==='reading'?READING_QUIZ.length:m.mode==='listening'?LISTENING_QUESTIONS.length:30;}
function roomTitle(m=room?.meta||{}){const n=Number(m.battle||1);return m.mode==='math-exam'?'Proportional / Antiproportional · Klassenarbeit 1':m.mode==='fractions'?FRACTION_MODULES[n-1]?.title||'Bruchrechnung':m.mode==='reading'?'Reading · A trip to Cardiff Castle':m.mode==='listening'?'Listening · Activity weekend in Cardiff':m.subject==='math'?RATIONAL_MATH_TITLES[n-1]||RATIONAL_MATH_TITLES[0]:'Englisch-Battle '+n;}
function questionDurationMs(m=room?.meta||{}){return m.mode==='listening'?60000:m.mode==='vocab'||(!m.mode&&m.subject!=='math')?VOCAB_QUESTION_MS:OTHER_QUESTION_MS;}
function questionDurationSeconds(m=room?.meta||{}){return Math.round(questionDurationMs(m
)/1000);}
function players(){return Object.entries(room?.slots||{}).map(([id,p])=>({id,...p})).sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));}
function rankByScore(entries,scoreOf=row=>Number(row.score)||0){const sorted=[...entries].sort((a,b)=>scoreOf(b)-scoreOf(a)||String(a.name||'').localeCompare(String(b.name||''),'de'));let place=0,lastScore;return sorted.map((row,index)=>{const score=scoreOf(row);if(index===0||score!==lastScore)place=index+1;lastScore=score;const tied=(index>0&&scoreOf(sorted[index-1])===score)||(index+1<sorted.length&&scoreOf(sorted[index+1])===score);return {row,place,tied,points:pointsForRank(place,tied)};});}
function battleBonusPoints(place){return [10,8,5,3][Number(place)-1]||0;}
function pointsForRank(place,tied=false){return battleBonusPoints(place);}
function isEnglishSeriesRoom(m=room?.meta||{}){return m.subject==='english'&&(m.mode==='vocab'||!m.mode)&&Number(m.battle)>=1&&Number(m.battle)<=3;}
function englishSeriesPoints(place,tied=false){return battleBonusPoints(place);}
function roster(){return rankByScore(players()).map(({row:p,place,tied})=>{const listening=room?.meta?.mode==='listening',points=Math.floor((Number(p.score)||0)/10),score=listening?`${points}/${LISTENING_TOTAL_POINTS} Punkte`:String(Number(p.score)||0),award=room?.meta?.stage==='finished'?(listening?` · +${battleBonusPoints(place)} Battle-Punkte${tied?' (Gleichstand)':''}`:` · ${points} richtig · +${battleBonusPoints(place)} Battle-Punkte${tied?' (Gleichstand)':''}`):'';return `<div class="player row"><span>${place}. ${esc(p.name)}</span><span class="score">${score}${award}</span></div>`;}).join('')||'<p>Noch keine Spieler.</p>'; }

function chooseBattle(){app.innerHTML=card(`<h2>🎮 Battle auswählen</h2><p>Welches Battle soll gespielt werden?</p><label>Battle<select id="battle-choice"><option value="1">Battle 1 – 30 Fragen</option><option value="2">Battle 2 – 30 Fragen</option><option value="3">Battle 3 – 30 Fragen</option></select></label>${btn('Raum erstellen','createRoom')}`)+card(btn('Zurück','home','alt'));}

function readingBattleTextCard(){const text=readingBattleLanguage==='de'?READING_TEXT_DE:READING_TEXT_EN;return `<h3>📖 A trip to Cardiff Castle · Lesetext</h3><div class="buttons">${btn('🇬🇧 English','readingRoomEn',readingBattleLanguage==='en'?'':'alt')}${btn('🇩🇪 Deutsch','readingRoomDe',readingBattleLanguage==='de'?'':'alt')}</div>${READING_ILLUSTRATION}<div style="line-height:1.7">${String(text||'').split(/\n\s*\n/).filter(Boolean).map(paragraph=>`<p style="white-space:pre-line">${esc(paragraph)}</p>`).join('')}</div>`;}
function countdown(){const m=room?.meta||{};if(m.stage!=='question'&&m.stage!=='reveal')return '';const remaining=Math.max(0,Math.ceil((Number(m.deadline||0)-Date.now())/1000));return m.stage==='question'?`⏱️ Noch ${remaining} Sekunden`:`⏳ Weiter in ${remaining} Sekunden`;}
function render(){if(!room)return;const m=room.meta||{},q=current(),stage=m.stage||'lobby',questionNumber=['math-exam','fractions','reading','listening'].includes(m.mode)?Number(m.index||0)+1:Number(m.index||0)%30+1;const stageKey=`${m.battle}:${m.index}:${stage}`;let s=card(`<p class="muted">Raumcode</p><div class="big">${esc(code)}</div><p>${esc(roomTitle(m))} · ${stage==='lobby'?'Warteraum':stage==='question'?`Frage ${questionNumber} von ${roomQuestionCount(m)}`:stage==='reveal'?'Auswertung':'Battle beendet'}</p>${roster()}`);if(m.mode==='reading'&&(stage==='lobby'||stage==='question'))s+=card(readingBattleTextCard());
if(role==='host'){
 if(stage==='lobby')s+=card(`<h2>Schiedsrichter</h2><p>Battle ${m.battle} starten – 30 Fragen mit je ${questionDurationSeconds(m)} Sekunden. Danach erscheint die Rangliste.</p>${btn('▶️ Battle starten','start')}`);
 if(stage==='question'){const a=room.answers?.[m.index]||{};s+=card(`<h2>${m.mode==='listening'?`🎧 Listening · Aufgabe ${q.task}`:`Frage ${Number(m.index)%30+1}`}</h2>${m.mode==='listening'?'<audio controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg"></audio>':''}<p>${m.subject==='math'?mathText(q?.q||''):esc(q?.q||'')}</p>${m.mode==='listening'?listeningControls(q,'host',true):''}<h2 id="countdown">${countdown()}</h2><p>Antworten: ${Object.keys(a).length} von ${players().length}</p><p class="muted">Automatische Auswertung nach ${questionDurationSeconds(m)} Sekunden</p>`);}
 if(stage==='reveal')s+=card(`<h2>Richtige Antwort</h2><p class="good">${m.mode==='listening'?esc(q?.answerText||''):m.subject==='math'?mathText(q?.options[q.correct]??''):esc(q?.options[q.correct]??'')}</p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card(`<h2>🏆 Battle ${m.battle} beendet!</h2><p>Rangliste nach 30 Fragen:</p>${roster()}${btn('🔄 Neues Spiel','reset')}`);
 s+=card(btn('Zur Startseite','home','alt'));
}else{
 const myAnswer=room.answers?.[m.index]?.[uid];
 if(stage==='lobby')s+=card('<h2>Warteraum</h2><p>Warte, bis der Schiedsrichter das Battle startet.</p>');
 if(stage==='question'&&q){const answered=myAnswer!==undefined;s+=card(m.mode==='listening'?`<h2>🎧 Listening · Aufgabe ${q.task}</h2><audio controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg"></audio>${listeningTaskImage(q.task)}<p class="muted">${esc(q.instruction||'')}</p><p>${esc(q.q)}</p>${listeningControls(q,'battle',answered||Date.now()>=Number(m.deadline||0))}${answered?'<p>Antwort abgegeben. Warte auf die Auswertung.</p>':'<button data-listening-submit="battle">Antwort abgeben</button>'}<h2 id="countdown">${countdown()}</h2>`:`<h2>${m.subject==='math'?mathText(q.q):esc(q.q)}</h2><h2 id="countdown">${countdown()}</h2><div class="answers">${q.options.map((o,i)=>`<button ${answered||Date.now()>=Number(m.deadline||0)?'disabled':''} data-answer="${i}" class="${answered&&Number(myAnswer.choice)===i?'picked':''}">${m.subject==='math'?mathText(o):esc(o)}</button>`).join('')}</div><p class="muted">${answered?'Antwort abgegeben. Warte auf die Auswertung.':'Wähle eine Antwort innerhalb von '+questionDurationSeconds(m)+' Sekunden.'}</p>`);}
 if(stage==='reveal')s+=card(`<h2>Auflösung</h2><p>Richtig: <strong class="good">${m.mode==='listening'?esc(q?.answerText||''):m.subject==='math'?mathText(q?.options[q.correct]??''):esc(q?.options[q.correct]??'')}</strong></p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card('<h2>🏆 Battle ${m.battle} geschafft!</h2><p>Die Rangliste steht oben.</p>');
 s+=card(btn('Zur Startseite','home','alt'));
}
app.innerHTML=s;
if(stageKey!==previousStageKey){previousStageKey=stageKey;lastClockText='';}
if(stage==='question'||stage==='reveal'){if(clock===null)clock=setInterval(tick,250);tick();}else stopClock();}
function tick(){if(!room)return;const m=room.meta||{},stage=m.stage;if(stage!=='question'&&stage!=='reveal'){stopClock();return;}const text=countdown();if(text!==lastClockText){const el=document.querySelector('#countdown');if(el)el.textContent=text;lastClockText=text;}if(stage==='question'&&Date.now()>=Number(m.deadline||0)){document.querySelectorAll('[data-answer]').forEach(el=>el.disabled=true);}if(role!=='host'||busy||!m.deadline||Date.now()<Number(m.deadline))return;if(stage==='question')void automaticReveal();else if(stage==='reveal')void automaticNext();}
async function makeRoom(){const battle=Number(document.querySelector('#battle-choice')?.value||1);if(!uid){msg('Verbindung wird hergestellt. Bitte kurz warten.',true);return;}code=String(Math.floor(100000+Math.random()*900000));role='host';slot='';try{await set(ref(db,`rooms/${code}/meta`),{hostUid:uid,stage:'lobby',battle,index:(battle-1)*30,createdAt:Date.now()});listen();}catch(e){msg('Raum konnte nicht erstellt werden: '+e.message,true);}}
function joinForm(label='Spiel beitreten',expectedRoomType=''){joinExpectedRoomType=expectedRoomType;app.innerHTML=card(`<h2>${esc(label)}</h2><label>Raumcode<input id="roomcode" inputmode="numeric" maxlength="6" placeholder="6-stelliger Code"></label><label>Dein Name<select id="playername">${names.map(n=>`<option>${n}</option>`).join('')}</select></label>${btn('Beitreten','enter')}`)+card(btn('Zurück','home','alt'));}
async function enter(){
 const c=document.querySelector('#roomcode').value.trim(),name=document.querySelector('#playername').value;
 if(!uid){msg('Anmeldung läuft. Bitte kurz warten.',true);return;}
 if(!/^\d{6}$/.test(c)){msg('Bitte sechsstelligen Code eingeben.',true);return;}
 try{
  // Grammar and vocabulary-work rooms live under grammarRooms. With the current
  // rules, reading a missing rooms/<code> path is denied, so check the requested
  // grammar room first instead of letting that denial stop the lookup.
  const preferGrammar=joinExpectedRoomType==='vocab-work-1'||joinExpectedRoomType==='vocab-work-2';
  let grammarSnap=null,roomSnap=null,firstReadError=null;
  if(preferGrammar){grammarSnap=await get(ref(db,`grammarRooms/${c}`));if(!grammarSnap.exists()){msg('Raumcode nicht gefunden. Prüfe die sechs Ziffern.',true);return;}}
  else{
   try{roomSnap=await get(ref(db,`rooms/${c}`));}catch(e){firstReadError=e;}
   if(!roomSnap?.exists()){
    try{grammarSnap=await get(ref(db,`grammarRooms/${c}`));}catch(e){if(firstReadError)throw firstReadError;throw e;}
   }
  }
  if(roomSnap?.exists()){
   const r=roomSnap.val(),meta=r.meta||{};
   if(meta.mode==='vocab-work'){msg('Diese Battle-Art ist auf der Kinderseite nicht verfügbar.',true);return;}
   if(joinExpectedRoomType){const isMath=meta.subject==='math',matches=joinExpectedRoomType==='fractions'?isMath&&meta.mode==='fractions':joinExpectedRoomType==='math-exam'?isMath&&meta.mode==='math-exam':joinExpectedRoomType==='rational'?isMath&&(meta.mode==='vocab'||meta.mode==='rational'||!meta.mode):!isMath&&(meta.mode==='vocab'||!meta.mode);if(!matches){msg('Dieser Code gehört zu einem anderen Battle. Bitte nimm den Code für den ausgewählten Button.',true);return;}}
   let s=Object.keys(r.slots||{}).find(k=>r.slots[k]?.name===name&&r.slots[k]?.uid===uid);
   if(!s){if(meta.stage!=='lobby'){msg('Das Battle läuft bereits. Bitte einen neuen Raum im Warteraum öffnen.',true);return;}s=String(names.indexOf(name)+1);if(r.slots?.[s]){msg('Dieser Name ist schon vergeben. Bitte anderen Namen wählen.',true);return;}await set(ref(db,`rooms/${c}/slots/${s}`),{name,uid,score:0});}
   code=c;role='player';slot=s;listen();return;
  }
  if(grammarSnap?.exists()){
   const r=grammarSnap.val(),meta=r.meta||{};
   if(joinExpectedRoomType==='vocab-work-1'&&meta.kind!=='vocab-work'){msg('Dieser Code gehört nicht zum Vokabelarbeit-Battle Station 1.',true);return;}
   if(joinExpectedRoomType==='vocab-work-2'&&meta.kind!=='vocab-work-station2'){msg('Dieser Code gehört nicht zum Vokabelarbeit-Battle Station 2.',true);return;}
   let s=Object.keys(r.slots||{}).find(k=>r.slots[k]?.name===name&&r.slots[k]?.uid===uid);
   if(!s){if(meta.stage!=='lobby'){msg('Das Battle läuft bereits. Bitte den nächsten Raum abwarten.',true);return;}s=String(names.indexOf(name)+1);if(r.slots?.[s]){msg('Dieser Name ist schon vergeben. Bitte anderen Namen wählen.',true);return;}await set(ref(db,`grammarRooms/${c}/slots/${s}`),{name,uid,score:0});}
   if(meta.kind==='writing'){wbCode=c;wbSlot=s;wbListen();return;}
   if(meta.kind==='vocab-work'||meta.kind==='vocab-work-station2'||meta.station!==undefined){gbCode=c;gbSlot=s;gbListen();return;}
  }
  msg('Raumcode nicht gefunden. Prüfe die sechs Ziffern.',true);
 }catch(e){msg('Beitritt fehlgeschlagen: '+e.message,true);}
}
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
function soloKey(b){return `${key}_${soloName}_battle_${b+1}`;}
function soloSave(){if(!solo)return;solo.updatedAt=Date.now();localStorage.setItem(soloKey(solo.battle),JSON.stringify(solo));touchLearningActivity(soloName,`english_vocab_battle${solo.battle+1}`,{done:Math.min(30,Number(solo.index)||0),total:30,score:Number(solo.score)||0,finished:!!solo.finished,status:'Fortschritt live'});void syncSolo();}
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
function soloChooseName(){if(!resetReady){msg('Lernstände werden abgeglichen. Bitte kurz warten.',true);return;}stopSoloHeartbeat();app.innerHTML=card(`<h2>📚 Wer lernt gerade?</h2><p>Wähle deinen Namen, damit der Schiedsrichter deinen Lernfortschritt sehen kann.</p><div class="solo-actions daily-compare-entry">${btn('🏆 Tagesvergleich Englisch','dailyLeaderboardEnglish','alt')}</div><p class="muted">👑 Tageskrone: meiste Antworten; bei Gleichstand entscheidet die niedrigere Fehlerquote.</p><div class="buttons">${SOLO_NAMES.map((n,i)=>btn(esc(n),`soloName${i}`)).join('')}</div>`)+card(btn('Zurück','home','alt'));applyDailyCrowns('english','soloName');}
function soloSetName(i){soloName=SOLO_NAMES[i];localStorage.setItem('vb2solo_name',soloName);if(soloNameReturn==='reading'){soloNameReturn='';readingLearnHome();return;}soloHome();}
function soloHome(){
 grammarCollect();stopSoloHeartbeat();if(!soloName){soloChooseName();return;}solo=null;
 const battles=[0,1,2].map(b=>{const saved=soloSaved(b),done=saved?.index||0,reviewing=saved&&!saved.finished&&saved.review&&saved.wrong.length;return `<div class="solo-game"><div class="row"><h3>Vokabeln ${b+1}</h3><span class="small">${done} von 30</span></div><p>Fragen erledigt${reviewing?` · 🔁 ${saved.wrong.length} wiederholen`:''}${saved?.finished?' · abgeschlossen':''}</p><div class="solo-actions">${btn(saved?'Neu beginnen':'Starten',`soloStart${b}`)}${saved&&!saved.finished?btn('Fortsetzen',`soloResume${b}`,'alt'):''}</div></div>`;}).join('');
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
 const moreCards=`${grammarCards}<div class="solo-game"><h3>🎧 Listening · Activity weekend in Cardiff</h3><p>${listening?.index||0} von ${LISTENING_QUESTIONS.length} Aufgaben · ${((Number(listening?.score)||0)/10)}/${LISTENING_TOTAL_POINTS} Punkte${listening?.finished?' · abgeschlossen':''}. Höre den Beitrag an und übe die Fragen.</p><div class="solo-actions">${btn(listening?'Neu beginnen':'Listening starten','listenStart')}${listening&&!listening.finished?btn('Fortsetzen','listenResume','alt'):''}</div></div><div class="solo-game"><h3>📖 Reading · A trip to Cardiff Castle</h3><p>Lies den Bericht und bearbeite alle vier Aufgaben mit direkter Auswertung.</p><div class="solo-actions">${btn('Reading lernen','readingLearnHome')}</div></div><div class="solo-game"><h3>✍️ Writing · Unit 2</h3><p>${writingDone} von ${WRITING_TASKS.length} Schreibaufgaben selbst geprüft. Plane, schreibe und vergleiche mit Beispielen.</p><div class="solo-actions">${btn('Writing lernen','writingMenu')}</div></div>`;
 app.innerHTML=card(`<h2>📚 ${esc(soloName)} · Englisch lernen</h2><p class="solo-note">Wähle Vokabeln 1, 2 oder 3 oder übe die passenden Vokabeltexte. Dein Fortschritt wird auf diesem Handy und online gespeichert.</p><div class="solo-actions">${btn('🇬🇧 Englisch-Fehler wiederholen','reviewEnglishChild')}</div><section class="solo-section"><h3>Vokabeln 1–3</h3>${battles}</section><section class="solo-section"><h3>Vokabelarbeiten</h3>${vocabWorkCards}</section><section class="solo-section"><h3>Weitere Übungen</h3>${moreCards}</section><section class="solo-section"><h3>Dein Lernbereich</h3><div class="solo-actions solo-utility">${btn('Anderen Namen wählen','soloChangeName','alt')}</div></section>`)+card(`<div class="solo-actions">${btn('Zurück','home','alt')}</div>`);
}
function vocabWorkKey(page){return `vb2vocabwork_${soloName}_station1_page${page}`;}
function vocabWorkResultKey(page){return `vb2vocabwork_result_${soloName}_station1_page${page}`;}
function vocabWorkSavedResult(page){try{return JSON.parse(localStorage.getItem(vocabWorkResultKey(page))||'null');}catch{return null;}}
function vocabWorkLoad(page){try{const x=JSON.parse(localStorage.getItem(vocabWorkKey(page))||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
function vocabWorkInput(page,index,label,width='100%'){
 const value=vocabWorkLoad(page)[index]||'';
 return `<input data-vocabwork="${index}" aria-label="${esc(label)}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(value)}" style="width:${width};min-width:0;min-height:44px;margin:5px 0 8px;padding:9px 11px;border:2px solid #5c7696;border-radius:9px;background:#fff;color:#172337">`;
}
let vocabWorkCheckedPage=0;
const vocabWorkDraftTimers={};
const vocabWorkDraftQueues={};
function vocabWorkDraftKey(station,page){return station===1?`vocabWork${page}`:`vocabWorkStation2Page${page}`;}
function cancelVocabWorkDraftSync(station,page){const key=`${station}_${page}`;if(vocabWorkDraftTimers[key]){clearTimeout(vocabWorkDraftTimers[key]);delete vocabWorkDraftTimers[key];}}
function scheduleVocabWorkDraftSync(station,page){
 cancelVocabWorkDraftSync(station,page);const key=`${station}_${page}`,previous=vocabWorkDraftQueues[key]||Promise.resolve();vocabWorkDraftQueues[key]=previous.catch(()=>{}).then(()=>syncVocabWorkDraft(station,page));return vocabWorkDraftQueues[key];
}
async function syncVocabWorkDraft(station,page){
 if(!db||!uid||!soloName){msg('Zwischenstand noch nicht online gespeichert. Die Antworten bleiben auf diesem Gerät.',true);return;}
 const values=station===1?vocabWorkLoad(page):vocabWorkStation2Load(page);
 const answers=station===1?VOCAB_WORK_ANSWERS[page]:VOCAB_WORK_STATION2_ANSWERS[page];
 if(!answers)return;
 const now=Date.now(),activity=vocabWorkDraftKey(station,page),done=values.filter(value=>String(value||'').trim()).length;
 const draft={name:soloName,activity,done,total:answers.length,correct:0,score:0,maxScore:answers.length,finished:false,draftAnswers:values.map(value=>String(value||'')),updatedAt:now,timestamp:now};
 const id=station===1?`english_vocab_work_page${page}`:`english_vocab_work_station2_page${page}`;
 touchLearningActivity(soloName,id,{taskTitle:`Vokabelarbeit · Station ${station} · Seite ${page}`,done,total:answers.length,status:'Antworten live',draftAnswers:draft.draftAnswers});
 try{await set(ref(db,`englishSeriesResults/${uid}/${soloName}/${activity}`),draft);instantSyncOk();}
 catch(e){instantSyncError('Zwischenstand konnte nicht online gespeichert werden: '+e.message);}
}
function vocabWorkPage(page,checked=false,resultText=''){
 if(!soloName){soloChooseName();return;}
 if(!checked){const saved=vocabWorkSavedResult(page);if(saved&&Number.isFinite(Number(saved.correct))){checked=true;resultText=`${saved.correct} von ${saved.total} richtig · Ergebnis gespeichert`;}}
 vocabWorkCheckedPage=page;
 void recordLearningActivity(soloName,`english_vocab_work_page${page}`);
 if(checked){app.innerHTML=card(`<h2>📝 Vokabelarbeit · Station 1 · Seite ${page}</h2><p class="muted">${esc(soloName)} · Vocabulary</p><p class="good"><strong>${esc(resultText)}</strong></p><p class="muted">Die alten Antworten sind gelöscht. Dein Ergebnis bleibt in der Übersicht erhalten.</p>`)+card(`<div class="buttons">${btn('🔄 Noch einmal üben','vocabWorkRetry')}${btn('Zurück zur Englisch-Auswahl','vocabWorkBack','alt')}</div>`);window.scrollTo(0,0);return;}
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
  app.innerHTML=card(`<h2>📝 Vokabelarbeit · Station 1 · Seite 1</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>1. Name the sports. Fill in the table.</h3><p class="muted">Nenne pro Feld eine passende Sportart. Alle Wasser-, Ball- und Wintersportarten sind erlaubt, zum Beispiel tennis, volleyball oder waterball.</p><div style="display:grid;grid-template-columns:1fr;gap:4px">${table}</div></section><section class="solo-section"><h3>2. Find the opposites (↔).</h3>${q2}</section><section class="solo-section"><h3>3. Finish the sentences.</h3>${sentences}</section>${result}<p class="small muted">Jede Eingabe wird sofort online angezeigt. „Prüfen“ ist nur für die Punkteauswertung nötig.</p><div class="buttons">${btn('✅ Antworten auswerten','vocabWorkCheck')}</div>`)+back;
 }else{
  const inline=(i,word)=>vocabWorkInput(2,i,`Aufgabe 4 · ${word}`,'clamp(100px,30vw,190px)');
  const letter=`<div style="padding:14px 8px;line-height:2;font-size:clamp(16px,4.3vw,19px)"><p>Hi Beth,</p><p>How was your trip to the activity centre?</p><p>You know I love ${inline(0,'outdoor')} (Freiluft-) activities, so I tried canoeing last weekend. Our group took a trip down the River Wye.</p><p>The trip wasn’t ${inline(1,'dangerous')} (gefährlich), of course, but we had to wear special ${inline(2,'equipment')} (Ausrüstung) to keep us ${inline(3,'safe')} (sicher).</p><p>Guess what? I wasn’t so bad. We had a friendly and ${inline(4,'patient')} (geduldig) instructor. She said I was very ${inline(5,'talented')} (begabt). ☺</p><p>Mara was there too. She’s a really ${inline(6,'competitive')} (leistungsorientiert) girl and always wants to be most ${inline(7,'successful')} (erfolgreich). She was even ${inline(8,'cheeky')} (frech) to me. Well, forget about that …</p><p>The canoeing trip was great fun. In the evening I was ${inline(9,'exhausted')} (erschöpft) too, but I had a fantastic day.</p><p>See you soon!<br>Julie</p></div>`;
  app.innerHTML=card(`<h2>📝 Vokabelarbeit · Station 1 · Seite 2</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>4. Julie is Beth’s friend. Complete her message with the right words.</h3>${letter}</section>${result}<p class="small muted">Jede Eingabe wird sofort online angezeigt. „Prüfen“ ist nur für die Punkteauswertung nötig.</p><div class="buttons">${btn('✅ Antworten auswerten','vocabWorkCheck')}</div>`)+back;
 }
 void scheduleVocabWorkDraftSync(1,page);window.scrollTo(0,0);
}
function vocabWorkCollect(sync=true){
 const first=document.querySelector('[data-vocabwork]');if(!first||!soloName)return;
 const page=document.querySelector('h2')?.textContent.includes('Seite 2')?2:1;
 const values=vocabWorkLoad(page);
 document.querySelectorAll('[data-vocabwork]').forEach(input=>{values[Number(input.dataset.vocabwork)]=input.value;});
 try{localStorage.setItem(vocabWorkKey(page),JSON.stringify(values));}catch{}
 if(sync)scheduleVocabWorkDraftSync(1,page);
}
const VOCAB_WORK_ANSWERS={

 1:[["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"],["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"],["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"],["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"],["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"],["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"],["alpine skiing", "skiing", "downhill skiing", "freestyle skiing", "mogul skiing", "ski cross", "ski jumping", "ski flying", "cross country skiing", "cross-country skiing", "nordic skiing", "nordic combined", "ski mountaineering", "skimo", "telemark skiing", "speed skiing", "extreme skiing", "heli skiing", "heliskiing", "ski orienteering", "ski ballet", "firngleiten", "fun carving", "monoski", "skibob", "snowboarding", "snowboard cross", "snowboard slopestyle", "snowboard halfpipe", "snowboard big air", "snowkiting", "snowshoeing", "snowmobiling", "snowmobile racing", "snow scooting", "snowscooting", "snow tubing", "sledding", "sleighing", "tobogganing", "luge", "bobsleigh", "bobsled", "skeleton", "ice hockey", "sledge hockey", "para ice hockey", "figure skating", "ice dancing", "speed skating", "short track speed skating", "short track", "curling", "ice stock sport", "ice stock", "broomball", "bandy", "rinkball", "ringette", "ice climbing", "ice cross downhill", "ice sailing", "ice yachting", "ice biking", "winter triathlon", "winter pentathlon", "dog sled racing", "dog sledding", "sled dog racing", "skijoring", "snow rugby", "snow polo", "snow cricket", "snow volleyball", "snow golf", "snow kayaking", "snowball fighting", "yukigassen", "winter swimming", "cold water surfing", "ice fishing", "ice racing", "ice speedway", "barrel jumping", "synchronized skating", "synchronised skating", "figure skating pairs", "bobsleighing", "ice skating", "skating", "ski racing", "biathlon", "biathlon relay", "Ski", "Skifahren", "Ski alpin", "Abfahrtslauf", "Freestyle-Skiing", "Buckelpiste", "Skicross", "Skispringen", "Skifliegen", "Skilanglauf", "Langlauf", "Nordische Kombination", "Skibergsteigen", "Skitourengehen", "Telemark", "Geschwindigkeitsskifahren", "Extremskifahren", "Ski-Orientierungslauf", "Fun-Carving", "Snowboard", "Snowboardcross", "Snowkiten", "Schneeschuhwandern", "Schneemobilrennen", "Snowscoot", "Snowtubing", "Schlittenfahren", "Rodeln", "Rennrodeln", "Bob", "Bobsport", "Eishockey", "Para-Eishockey", "Eiskunstlauf", "Eistanz", "Eisschnelllauf", "Shorttrack", "Eisstockschießen", "Eisklettern", "Eisrennen", "Eissegeln", "Eisbike", "Wintertriathlon", "Hundeschlittenrennen", "Skijöring", "Snowrugby", "Snowpolo", "Snowcricket", "Schneeballwerfen", "Winterbaden", "Winterschwimmen", "Eisschwimmen", "Eisangeln", "Eisspeedway"],['small'],['loud'],['slow'],['boring'],['dangerous'],['difficult','hard'],['bad'],['unfit'],['tough'],['wood','woods'],['trip'],['climb'],['rules']],

 2:[['outdoor'],['dangerous'],['equipment'],['safe'],['patient'],['talented'],['competitive'],['successful'],['cheeky'],['exhausted']]
};
const VOCAB_WORK_REVIEW_PROMPTS={
 1:[
  'Name a water sport.', 'Name a water sport.', 'Name a water sport.',
  'Name a ball sport.', 'Name a ball sport.', 'Name a ball sport.',
  'Name a winter sport.',
  ...['big','quiet','quick','interesting','safe','easy','good','fit'].map(word=>`Write the opposite of “${word}”.`),
  'Complete the sentence: Rugby is a very fast and ___ sport.',
  'Complete the sentence: There are lots of trees in the ___.',
  'Complete the sentence: Let’s take a ___ to the mountains next weekend.',
  'Complete the sentence: You can ___ up a mountain or a tree.',
  'Complete the sentence: To find out what you can or can’t do in a sport, you have to learn the ___. '
 ],
 2:[
  'Julie’s message: “You know I love ___ (Freiluft-) activities, so I tried canoeing last weekend.”',
  'Julie’s message: “The trip wasn’t ___ (gefährlich), of course …”',
  'Julie’s message: “We had to wear special ___ (Ausrüstung) …”',
  'Julie’s message: “… to keep us ___ (sicher).”',
  'Julie’s message: “We had a friendly and ___ (geduldig) instructor.”',
  'Julie’s message: “She said I was very ___ (begabt).”',
  'Julie’s message: “She’s a really ___ (leistungsorientiert) girl …”',
  'Julie’s message: “… always wants to be most ___ (erfolgreich).”',
  'Julie’s message: “She was even ___ (frech) to me.”',
  'Julie’s message: “In the evening I was ___ (erschöpft) too …”'
 ]
};
const VOCAB_WORK_STATION2_REVIEW_PROMPTS={
 1:[
  'Picture 1: What is the first-aid item?',
  'Picture 2: What is the first-aid item?',
  'Picture 3: What is the first-aid item?',
  'Picture 4: What is the first-aid item?',
  'Picture 5: What is the first-aid item?',
  'Picture 6: What is the first-aid item?',
  'Complete: “There has been an ___ . We must call an ambulance!”',
  'Complete: “When I cut my finger, it started to ___ badly.”',
  'Complete: “Your ___ is a part of your leg.”',
  'Complete: “When you ___ your ankle, you should put a bandage on it.”',
  'Complete: “Don’t ___ your hand when you take it out.”',
  'Complete: “Call 999 for the ___ services in the UK.”'
 ],
 2:[
  'Choose the right verb: You ___ an accident. (have / make)',
  'Choose the right verb: You ___ the operator. (invite / call)',
  'Choose the right verb: You ___ your name on the phone. (give / ask)',
  'Choose the right verb: You ___ where you are. (speak / say)',
  'Choose the right verb: You ___ the hurt person. (stay with / wait for)',
  'Choose the right verb: You ___ a person to hospital. (take / bring)',
  'Name an emergency service: 1',
  'Name an emergency service: 2',
  'Name an emergency service: 3',
  'Name an emergency service: 4'
 ]
};
function vocabWorkReviewData(exercise,index){
 const id=String(exercise),i=Number(index),station2=id.match(/^english_vocab_work_station2_page(\d+)$/),station1=id.match(/^english_vocab_work_page(\d+)$/);
 if(station2){const page=Number(station2[1]);return {prompt:VOCAB_WORK_STATION2_REVIEW_PROMPTS[page]?.[i]||`Vokabelarbeit · Station 2 · Seite ${page} · Aufgabe ${i+1}`,instruction:page===1?'Name the first-aid item or complete the sentence.':'Complete the sentences or name the emergency services.'};}
 if(station1){const page=Number(station1[1]);return {prompt:VOCAB_WORK_REVIEW_PROMPTS[page]?.[i]||`Vokabelarbeit · Station 1 · Seite ${page} · Aufgabe ${i+1}`,instruction:page===2?'Complete Julie’s message with the right words.':'Complete the vocabulary exercise.'};}
 return null;
}
async function recordVocabWorkErrors(exercise,topic,answers,values){const saved=await Promise.all(answers.map((accepted,index)=>{const answer=String(values[index]||'').trim();if(!answer)return true;const correct=accepted.some(value=>grammarNormalize(value)===grammarNormalize(answer)),review=vocabWorkReviewData(exercise,index);return recordLearningError(soloName,'english',exercise,index,topic,{prompt:review?.prompt||`${topic} · Aufgabe ${index+1}`,instruction:review?.instruction||'Complete the vocabulary exercise.',accepted},correct);}));return saved.every(Boolean);}
async function vocabWorkCheck(){
 const page=vocabWorkCheckedPage;if(!page||!soloName)return;vocabWorkCollect(false);
 const values=vocabWorkLoad(page),answers=VOCAB_WORK_ANSWERS[page],allFilled=answers.every((_,i)=>String(values[i]||'').trim());
 if(!allFilled){msg('Bitte erst alle Antworten eintragen.',true);return;}
 cancelVocabWorkDraftSync(1,page);
 await (vocabWorkDraftQueues[`1_${page}`]||Promise.resolve());
 const normalized=values.map(grammarNormalize),correct=answers.reduce((sum,accepted,i)=>sum+(accepted.some(answer=>grammarNormalize(answer)===normalized[i])?1:0),0),now=Date.now();
 const result={name:soloName,activity:`vocabWork${page}`,done:answers.length,total:answers.length,correct,score:correct,maxScore:answers.length,finished:true,draftAnswers:values.map(value=>String(value||'')),updatedAt:now,timestamp:now};
 if(db&&uid){const exercise=`english_vocab_work_page${page}`,topic=`Vokabelarbeit · Station 1 · Seite ${page}`;touchLearningActivity(soloName,exercise,{taskTitle:topic,done:answers.length,total:answers.length,score:correct,maxScore:answers.length,finished:true,status:'Ergebnis geprüft',draftAnswers:result.draftAnswers});if(!await recordVocabWorkErrors(exercise,topic,answers,values)){msg('Fehler konnten nicht sicher gespeichert werden. Bitte Verbindung prüfen und erneut auswerten.',true);return;}void set(ref(db,`englishSeriesResults/${uid}/${soloName}/vocabWork${page}`),result).then(()=>{try{localStorage.setItem(vocabWorkResultKey(page),JSON.stringify({correct,total:answers.length}));localStorage.removeItem(vocabWorkKey(page));}catch{}vocabWorkPage(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`);}).catch(e=>{try{localStorage.setItem(vocabWorkResultKey(page),JSON.stringify({correct,total:answers.length}));}catch{}vocabWorkPage(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`);msg('Punkte-Ergebnis konnte nicht separat gespeichert werden; Antworten und Wiederholfehler wurden übertragen. '+e.message,true);});}
 else msg('Verbindung wird hergestellt. Bitte gleich noch einmal prüfen.',true);
}
function vocabWorkRetry(){const page=vocabWorkCheckedPage;if(!page||!soloName)return;try{localStorage.removeItem(vocabWorkKey(page));localStorage.removeItem(vocabWorkResultKey(page));}catch{}vocabWorkPage(page);}

function vocabWorkStation2Key(page){return `vb2vocabwork_${soloName}_station2_page${page}`;}
function vocabWorkStation2ResultKey(page){return `vb2vocabwork_result_${soloName}_station2_page${page}`;}
function vocabWorkStation2SavedResult(page){try{return JSON.parse(localStorage.getItem(vocabWorkStation2ResultKey(page))||'null');}catch{return null;}}
function vocabWorkStation2Load(page){try{const x=JSON.parse(localStorage.getItem(vocabWorkStation2Key(page))||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
function vocabWorkStation2Input(page,index,label,width='100%'){
 const value=vocabWorkStation2Load(page)[index]||'';
 return `<input data-vocabwork-s2="${index}" aria-label="${esc(label)}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(value)}" style="width:${width};min-width:0;min-height:44px;margin:5px 0 8px;padding:9px 11px;border:2px solid #5c7696;border-radius:9px;background:#fff;color:#172337">`;
}
let vocabWorkStation2CheckedPage=0;
function vocabWorkStation2Page(page,checked=false,resultText=''){
 if(!soloName){soloChooseName();return;}
 if(!checked){const saved=vocabWorkStation2SavedResult(page);if(saved&&Number.isFinite(Number(saved.correct))){checked=true;resultText=`${saved.correct} von ${saved.total} richtig · Ergebnis gespeichert`;}}
 vocabWorkStation2CheckedPage=page;
 void recordLearningActivity(soloName,`english_vocab_work_station2_page${page}`);
 if(checked){app.innerHTML=card(`<h2>🩹 Vokabelarbeit · Station 2 · Seite ${page}</h2><p class="muted">${esc(soloName)} · Vocabulary</p><p class="good"><strong>${esc(resultText)}</strong></p><p class="muted">Die alten Antworten sind gelöscht. Dein Ergebnis bleibt in der Übersicht erhalten.</p>`)+card(`<div class="buttons">${btn('🔄 Noch einmal üben','vocabWorkStation2Retry')}${btn('Zurück zur Englisch-Auswahl','vocabWorkBack','alt')}</div>`);window.scrollTo(0,0);return;}
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
   app.innerHTML=card(`<h2>🩹 Vokabelarbeit · Station 2 · Seite 1</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>1. What is it? Write the right word under each picture.</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:10px">${images}</div></section><section class="solo-section"><h3>2. Complete the sentences with the right words.</h3><p><em>Example:</em> I have a sore throat. I need my scarf.</p>${sentences}</section>${result}<p class="small muted">Jede Eingabe wird sofort online angezeigt. „Prüfen“ ist nur für die Punkteauswertung nötig.</p><div class="buttons">${btn('✅ Antworten auswerten','vocabWorkStation2Check')}</div>`)+back;
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
   app.innerHTML=card(`<h2>🩹 Vokabelarbeit · Station 2 · Seite 2</h2><p class="muted">${esc(soloName)} · Vocabulary</p><section class="solo-section"><h3>3. Put in the right verb.</h3>${verbs}</section><section class="solo-section"><h3>4. Name the four emergency services in the UK.</h3>${services}</section>${result}<p class="small muted">Jede Eingabe wird sofort online angezeigt. „Prüfen“ ist nur für die Punkteauswertung nötig.</p><div class="buttons">${btn('✅ Antworten auswerten','vocabWorkStation2Check')}</div>`)+back;
 }
 void scheduleVocabWorkDraftSync(2,page);window.scrollTo(0,0);
}
function vocabWorkStation2Collect(sync=true){
 const first=document.querySelector('[data-vocabwork-s2]');if(!first||!soloName)return;
 const page=vocabWorkStation2CheckedPage,values=vocabWorkStation2Load(page);
 document.querySelectorAll('[data-vocabwork-s2]').forEach(input=>{values[Number(input.dataset.vocabworkS2)]=input.value;});
 try{localStorage.setItem(vocabWorkStation2Key(page),JSON.stringify(values));}catch{}
 if(sync)scheduleVocabWorkDraftSync(2,page);
}
const VOCAB_WORK_STATION2_ANSWERS={
 1:[['plaster'],['bandage'],['ambulance'],['tooth'],['tablet','medicine','tablet/medicine','tablet / medicine'],['cast'],['accident'],['bleed'],['knee'],['sprain','twist','hurt'],['burn'],['emergency']],
 2:[['have'],['call'],['give'],['say'],['stay with'],['take'],['police'],['fire brigade'],['ambulance'],['coastguard','coast guard']]
};
async function vocabWorkStation2Check(){
 const page=vocabWorkStation2CheckedPage;if(!page||!soloName)return;vocabWorkStation2Collect(false);
 const values=vocabWorkStation2Load(page),answers=VOCAB_WORK_STATION2_ANSWERS[page];
 if(!answers.every((_,i)=>String(values[i]||'').trim())){msg('Bitte erst alle Antworten eintragen.',true);return;}
 cancelVocabWorkDraftSync(2,page);
 await (vocabWorkDraftQueues[`2_${page}`]||Promise.resolve());
 const normalized=values.map(grammarNormalize),correct=answers.reduce((sum,accepted,i)=>sum+(accepted.some(answer=>grammarNormalize(answer)===normalized[i])?1:0),0),now=Date.now();
 const result={name:soloName,activity:`vocabWorkStation2Page${page}`,done:answers.length,total:answers.length,correct,score:correct,maxScore:answers.length,finished:true,draftAnswers:values.map(value=>String(value||'')),updatedAt:now,timestamp:now};
 if(db&&uid){const exercise=`english_vocab_work_station2_page${page}`,topic=`Vokabelarbeit · Station 2 · Seite ${page}`;touchLearningActivity(soloName,exercise,{taskTitle:topic,done:answers.length,total:answers.length,score:correct,maxScore:answers.length,finished:true,status:'Ergebnis geprüft',draftAnswers:result.draftAnswers});if(!await recordVocabWorkErrors(exercise,topic,answers,values)){msg('Fehler konnten nicht sicher gespeichert werden. Bitte Verbindung prüfen und erneut auswerten.',true);return;}void set(ref(db,`englishSeriesResults/${uid}/${soloName}/vocabWorkStation2Page${page}`),result).then(()=>{try{localStorage.setItem(vocabWorkStation2ResultKey(page),JSON.stringify({correct,total:answers.length}));localStorage.removeItem(vocabWorkStation2Key(page));}catch{}vocabWorkStation2Page(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`);}).catch(e=>{try{localStorage.setItem(vocabWorkStation2ResultKey(page),JSON.stringify({correct,total:answers.length}));}catch{}vocabWorkStation2Page(page,true,`${correct} von ${answers.length} richtig · Ergebnis gespeichert`);msg('Punkte-Ergebnis konnte nicht separat gespeichert werden; Antworten und Wiederholfehler wurden übertragen. '+e.message,true);});}
 else msg('Verbindung wird hergestellt. Bitte gleich noch einmal prüfen.',true);
}
function vocabWorkStation2Retry(){const page=vocabWorkStation2CheckedPage;if(!page||!soloName)return;try{localStorage.removeItem(vocabWorkStation2Key(page));localStorage.removeItem(vocabWorkStation2ResultKey(page));}catch{}vocabWorkStation2Page(page);}


function soloStart(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}const previous=soloSaved(b);solo={battle:b,index:0,score:0,finished:false,wrong:[],review:false,reviewPos:0,mistakes:cleanMistakes(previous?.mistakes)};void recordLearningActivity(soloName,`english_vocab_battle${b+1}`);soloSave();soloQuestion();}
function soloResume(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}solo=soloSaved(b);if(!solo){soloStart(b);return;}void recordLearningActivity(soloName,`english_vocab_battle${b+1}`);void syncSolo();if(solo.finished)soloFinished();else soloQuestion();}
function soloQuestion(){if(!solo)return;startSoloHeartbeat();const b=solo.battle;
 if(!solo.review&&solo.index>=30){if(solo.wrong.length){solo.review=true;solo.reviewPos=0;soloSave();}else{soloFinished();return;}}
 if(solo.review&&!solo.wrong.length){soloFinished();return;}
 const i=solo.review?solo.wrong[solo.reviewPos]:solo.index,q=BATTLES[b]?.[i];
 if(!q){msg('Frage konnte nicht geladen werden.',true);return;}
 const title=solo.review?`🔁 Wiederholung · ${solo.wrong.length} Wörter offen`:`Frage ${solo.index+1}/30`;
 app.innerHTML=card(`<h2>${esc(soloName)} · Vokabeln ${b+1}</h2><p>${title} · ${solo.score} Punkte</p><div class="bar"><div class="fill" style="width:${solo.index/30*100}%"></div></div><h2>${esc(q.q)}</h2><div class="answers">${q.options.map((o,j)=>`<button data-soloanswer="${j}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Vokabelauswahl','solo','alt'));
}
function soloAnswer(i){if(!solo||solo.finished)return;const reviewing=solo.review;const questionIndex=reviewing?solo.wrong[solo.reviewPos]:solo.index;
 const q=BATTLES[solo.battle]?.[questionIndex];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;
 // Sofort deaktivieren, damit Doppeltippen keine Fragen überspringt.
 document.querySelectorAll('[data-soloanswer]').forEach(el=>el.disabled=true);
 const ok=i===q.correct;
 void recordLearningError(soloName,'english',`english_vocab_battle${solo.battle+1}`,questionIndex,`Vokabeln ${solo.battle+1}`,q,ok);
 if(!ok){solo.mistakes=cleanMistakes(solo.mistakes);solo.mistakes[questionIndex]=(solo.mistakes[questionIndex]||0)+1;}
 if(reviewing){if(ok){solo.wrong.splice(solo.reviewPos,1);if(solo.reviewPos>=solo.wrong.length)solo.reviewPos=0;}
 else if(solo.wrong.length>1)solo.reviewPos=(solo.reviewPos+1)%solo.wrong.length;
 }else{if(ok)solo.score+=10;else if(!solo.wrong.includes(questionIndex))solo.wrong.push(questionIndex);solo.index++;}
 soloSave();
 const remaining=solo.wrong.length;
 app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.answerText)}</strong></p><p>Deine Punkte: ${solo.score} von 300</p>${reviewing?`<p>🔁 Noch ${remaining} ${remaining===1?'Wort':'Wörter'} zum Üben.</p>`:''}${btn('Weiter ➜','soloNext')}`);
}
function soloNext(){if(!solo)return;soloQuestion();}
function soloFinished(){if(!solo)return;stopSoloHeartbeat();solo.finished=true;solo.index=30;solo.wrong=[];solo.review=false;solo.reviewPos=0;soloSave();app.innerHTML=card(`<h2>🏆 Vokabeln ${solo.battle+1} abgeschlossen!</h2><p>Alle Wörter wurden richtig geübt.</p><p class="score">${solo.score} von 300 Punkten</p>${btn('Vokabeln erneut lernen',`soloStart${solo.battle}`)}`)+card(btn('Andere Vokabeln auswählen','solo','alt'));}

function listeningKey(){return `vb2listen_${soloName}_unit2`;}
function listenLoad(){try{const s=JSON.parse(localStorage.getItem(listeningKey())||'null');if(!s||!Number.isInteger(s.index)||s.index<0||s.index>LISTENING_QUESTIONS.length)return null;s.mistakes=cleanMistakes(s.mistakes);return s;}catch{return null;}}
function listenSave(){if(!listeningRun||!soloName)return;listeningRun.updatedAt=Date.now();localStorage.setItem(listeningKey(),JSON.stringify(listeningRun));touchLearningActivity(soloName,'english_listening',{done:listeningRun.index,total:LISTENING_QUESTIONS.length,score:listeningRun.score||0,finished:!!listeningRun.finished,status:'Listening-Fortschritt live'});void syncListeningProgress();}
async function syncListeningProgress(){if(!db||!uid||!soloName||!listeningRun)return;const run=listeningRun,now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/listeningUnit2`),{done:run.index,total:LISTENING_TOTAL_POINTS,totalQuestions:LISTENING_QUESTIONS.length,score:run.score||0,finished:!!run.finished,mistakes:cleanMistakes(run.mistakes),runId:run.runId,updatedAt:now,timestamp:now});listeningSyncWarned=false;}catch(e){if(!listeningSyncWarned){listeningSyncWarned=true;msg('Listening bleibt auf diesem Handy gespeichert; Online-Speicherung ist gerade nicht verfügbar.',true);}}}
function listenStart(){const old=listenLoad();listeningRun={index:0,score:0,finished:false,mistakes:cleanMistakes(old?.mistakes),runId:`solo-${Date.now()}`};void recordLearningActivity(soloName,'english_listening');listenSave();listenQuestion();}
function listenResume(){listeningRun=listenLoad();if(!listeningRun){listenStart();return;}void recordLearningActivity(soloName,'english_listening');if(listeningRun.finished){listenFinish();return;}listenQuestion();}
function listenQuestion(){if(!listeningRun)return;if(listeningRun.index>=LISTENING_QUESTIONS.length){listenFinish();return;}const q=LISTENING_QUESTIONS[listeningRun.index];app.innerHTML=card(`<h2>🎧 ${esc(soloName)} · Listening · Aufgabe ${q.task}</h2><p>Activity weekend in Cardiff · Teil ${listeningRun.index+1} von ${LISTENING_QUESTIONS.length} · ${(listeningRun.score||0)/10} von ${LISTENING_TOTAL_POINTS} Punkten</p><audio controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg">Dein Browser unterstützt die Audiowiedergabe nicht.</audio><p class="muted">Höre dir den Beitrag an. Du kannst die Aufnahme erneut starten.</p><p class="muted">${esc(q.instruction||'')}</p>${listeningTaskImage(q.task)}<h3>${esc(q.q)}</h3>${listeningControls(q,'solo',false)}<button data-listening-submit="solo">Antwort prüfen</button>`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function listenAnswer(value){if(!listeningRun||listeningRun.finished)return;const q=LISTENING_QUESTIONS[listeningRun.index];if(!q)return;const ok=listeningIsCorrect(q,value);void recordLearningError(soloName,'english','english_listening',listeningRun.index,'Listening · Activity weekend in Cardiff',q,ok);if(ok)listeningRun.score+=10*q.points;else listeningRun.mistakes[listeningRun.index]=(listeningRun.mistakes[listeningRun.index]||0)+1;listeningRun.index++;listenSave();app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.answerText)}</strong></p><p>${listeningRun.score/10} von ${LISTENING_TOTAL_POINTS} Punkten</p>${btn('Weiter ➜','listenNext')}`);}
function listenFinish(){if(!listeningRun)return;listeningRun.finished=true;listeningRun.index=LISTENING_QUESTIONS.length;listenSave();app.innerHTML=card(`<h2>🏆 Listening geschafft!</h2><p>Activity weekend in Cardiff</p><p class="score">${listeningRun.score/10} von ${LISTENING_TOTAL_POINTS} Punkten</p>${btn('Listening wiederholen','listenStart')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function listenNext(){listenQuestion();}

const READING_HEADINGS=[
 {text:'The way up',correct:'3'},
 {text:'Like real eyes',correct:'4'},
 {text:'Adventure in the park',correct:'2'},
 {text:'The king’s family',correct:'-'},
 {text:'History at school',correct:'1'}
];
const READING_STATEMENTS=[
 ['Mr Oldman is a teacher at Llanelli Southwest School.','right'],
 ['He collects old clocks too.','not'],
 ['Cardiff is the capital of Wales.','right'],
 ['It rained all the time during their day trip.','wrong'],
 ['There were five real knights in the park.','wrong'],
 ['One of them looked like Shakespeare.','not'],
 ['The clock tower was hard to climb.','right'],
 ['The students saw a real wild animal on the wall.','wrong']
];
const readingKey=()=>`vb2reading_${soloName}_cardiff_castle`;
function readingLoad(){try{return JSON.parse(localStorage.getItem(readingKey())||'null')||{matches:[],truth:[],answers:['',''],guestbook:'',own4:0,showSamples:false,checked:false};}catch{return {matches:[],truth:[],answers:['',''],guestbook:'',own4:0,showSamples:false,checked:false};}}
function readingSave(s=readingLoad()){if(!soloName)return;try{localStorage.setItem(readingKey(),JSON.stringify(s));}catch{}void syncReadingLearningProgress(s);}
async function syncReadingLearningProgress(s){if(!db||!uid||!soloName)return;const matches=READING_HEADINGS.filter((h,i)=>h.correct!=='-'&&String(s.matches?.[i]||'').trim()).length,truth=(s.truth||[]).filter(Boolean).length,done=matches+truth,result=readingResult(s),writingDone=[...(s.answers||[]),s.guestbook||''].filter(x=>String(x).trim()).length,now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/readingCardiff`),{done,total:12,score:(result.matches+result.truth)*10,writingDone:Math.min(3,writingDone),writingTotal:3,finished:done>=12&&writingDone>=3,checked:!!s.checked,draft:{matches:s.matches||[],truth:s.truth||[],answers:s.answers||[],guestbook:s.guestbook||'',own4:Number(s.own4)||0},updatedAt:now,timestamp:now});touchLearningActivity(soloName,'english_reading',{done,total:12,writingDone:Math.min(3,writingDone),status:'Reading-Antworten live'});readingLearningSyncWarned=false;instantSyncOk();}catch(e){instantSyncError('Reading konnte gerade nicht live übertragen werden: '+e.message);}}
function readingLearn(){if(!soloName){soloNameReturn='reading';soloChooseName();return;}readingLearnHome();}
function readingLearnHome(){if(!soloName){readingLearn();return;}solo=null;void recordLearningActivity(soloName,'english_reading');readingSave(readingLoad());readingRender();}
function readingRender(){
 const s=readingLoad(),matches=READING_HEADINGS.map((h,i)=>`<div class="solo-game"><div class="row"><strong>${esc(h.text)}</strong><label style="min-width:130px">Paragraph<select data-reading-match="${i}" style="margin:4px 0 0;padding:9px"><option value="">Choose …</option>${['1','2','3','4','-'].map(n=>`<option value="${n}" ${s.matches?.[
i]===n?'selected':''}>${n==='-'?'No match':n}</option>`).join('')}</select></label></div>${s.checked?`<p class="${s.matches?.[i]===h.correct?'good':'error'}">${s.matches?.[i]===h.correct?'✅ Correct':'❌ Correct answer: '+(h.correct==='-'?'No match':h.correct)}</p>`:''}</div>`).join('');
 const statements=READING_STATEMENTS.map(([text,correct],i)=>`<div class="solo-game"><p><strong>${i+1}.</strong> ${esc(text)}</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px">${[['right','Right'],['wrong','Wrong'],['not','Not in the text']].map(([value,label])=>`<label style="display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 4px;border:1px solid #62779b;border-radius:10px;background:rgba(15,20,49,.3);font-size:clamp(12px,3.5vw,15px)"><input type="radio" name="reading-truth-${i}" data-reading-truth="${i}" value="${value}" ${s.truth?.[i]===value?'checked':''} style="width:auto;min-height:0;margin:0;accent-color:#30efff">${label}</label>`).join('')}</div>${s.checked?`<p class="${s.truth?.[i]===correct?'good':'error'}">${s.truth?.[i]===correct?'✅ Correct':'❌ Correct answer: '+({right:'Right',wrong:'Wrong',not:'Not in the text'}[correct])}</p>`:''}</div>`).join('');
 const result=s.checked?readingResult(s):null;

 app.innerHTML=card(`<h2>📖 ${esc(soloName)} · Reading</h2><p class="solo-note">Reading · A trip to Cardiff Castle · Unit 2</p><article class="solo-game"><h3>Llanelli Southwest School</h3><p><u>Our class trip to Cardiff Castle</u></p><h4>[1]</h4><p>Everyone at our school knows that our History teacher, Mr Oldman, is interested in history. But did you know that Mr Oldman also owns a private collection of knight’s armour and other things from the past? He even has a 34-year-old car. What a crazy hobby! We found out about that in our History lessons during the last two weeks. We learned a lot about knights, castles, swords and armour too. We even put on costumes in class! It was really exciting and great fun. Finally our class went on a day trip to visit Cardiff Castle.</p><img src="./reading-cardiff-castle.jpg" alt="Cardiff Castle" style="display:block;width:100%;max-height:220px;object-fit:contain;border-radius:12px;margin:12px 0"><h4>[2]</h4><p>Cardiff Castle is in the city centre of the Welsh capital. There are lots of big trees and colourful plants in the park around it. When we arrived there, the weather was nice and sunny. First we had a break in the park and enjoyed our picnic. Suddenly we saw a knight in armour ride through the park. Two knights were behind him and shouted some strange words. Two other knights jousted with each other. It looked so real! Mr Oldman said the actors were practising for a play by Shakespeare.</p><h4>[3]</h4><p>Cardiff Castle is about 2,000 years old. It has dark corridors and a tall clock tower. We went up to the tower: There are lots of small steps and it was difficult to walk up. Mr Oldman was happy that no one fell down or got hurt or got lost. At the end Mr Oldman himself hit his head. But it wasn’t too bad. He just needed a plaster.</p><img src="./reading-clock-tower.jpg" alt="Clock tower at Cardiff Castle" style="display:block;width:min(100%,360px);max-height:220px;object-fit:contain;border-radius:12px;margin:12px auto"><h4>[4]</h4><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(110px,34%);gap:12px;align-items:start"><div><p>In the park around the castle there is a famous wall: the Animal Wall. When you stand there and look up, you will look right into the eyes of lions, a bear, monkeys, raccoons and other animals.</p><p>First I jumped because I thought a real wild animal would come down the wall. It was scary! But then I looked again and laughed. Mr Oldman saw that and smiled too.</p></div><img src="./reading-animal-wall.jpg" alt="Animal Wall sculpture" style="width:100%;border-radius:12px"></div><p>We all loved the trip to Cardiff Castle and had a great day.</p><p><em>by Mike Sheffield, Year 9</em></p></article><section class="solo-section"><h3>1 · Match the headings with paragraphs 1–4. One heading is wrong. <span class="small">/4</span></h3>${matches}</section><section class="solo-section"><h3>2 · Right, wrong or not in the text? Tick the correct box. <span class="small">/8</span></h3>${statements}</section><section class="solo-section"><h3>3 · Answer the questions. Write complete sentences. <span class="small">/4</span></h3><div class="solo-game"><label>1. What’s Mr Oldman’s favourite subject? Give 2 details from the text.<textarea data-reading-answer="0" rows="3" style="width:100%;margin-top:8px;padding:12px;border:2px solid #5c7696;border-radius:10px;background:#fff;color:#172337;font:inherit">${esc(s.answers?.[0]||'')}</textarea></label>${s.checked?`<p class="${readingOpenScore(s.answers?.[0],0)?'good':'error'}">${readingOpenScore(s.answers?.[0],0)?'✅':'❌'} Sample answer: He is interested in history and owns a private collection of knight’s armour and other things from the past.</p>`:''}</div><div class="solo-game"><label>2. Why did Mike jump when he saw the Animal Wall?<textarea data-reading-answer="1" rows="3" style="width:100%;margin-top:8px;padding:12px;border:2px solid #5c7696;border-radius:10px;background:#fff;color:#172337;font:inherit">${esc(s.answers?.[1]||'')}</textarea></label>${s.checked?`<p class="${readingOpenScore(s.answers?.[1],1)?'good':'error'}">${readingOpenScore(s.answers?.[1],1)?'✅':'❌'} Sample answer: He was scared/afraid of a stone animal. / He thought the animal was real.</p>`:''}</div></section><section class="solo-section"><h3>4 · Write a short message in the guestbook. <span class="small">/4</span></h3><p>What do you think about Mike’s report and the class trip to Cardiff Castle?</p><div class="solo-game"><h3>Llanelli Southwest School · Guestbook</h3><textarea data-reading-guestbook rows="5" placeholder="Write your message here …" style="width:100%;padding:12px;border:2px solid #5c7696;border-radius:10px;background:#fff;color:#172337;font:inherit">${esc(s.guestbook||'')}</textarea><p class="small muted">Example: I think Year 9 had a very exciting class trip to Cardiff Castle. Mike’s report is interesting. I really like the photos. I want to visit Cardiff Castle in my next summer holidays. — Melanie</p><img src="./reading-good-luck.jpg" alt="Good luck mascot" style="display:block;width:min(100%,280px);height:auto;border-radius:12px;margin:12px 0"><label style="display:flex;align-items:center;gap:8px"><input type="range" min="0" max="4" step="1" data-reading-own4 value="${Number(s.own4)||0}" style="width:140px;margin:0;accent-color:#30efff">Self-check points: <strong data-reading-own4-label>${Number(s.own4)||0} / 4</strong></label><p class="small muted">Give yourself points for a complete message, your opinion, a reason or detail, and a clear sign-off.</p></div></section>${result?card(`<h3>📊 Dein Ergebnis</h3><p class="score">${result.total} von 20 Punkten</p><p>Aufgabe 1: ${result.matches}/4 · Aufgabe 2: ${result.truth}/8 · Aufgabe 3: ${result.open}/4 · Aufgabe 4: ${result.own4}/4</p>`):''}<div class="buttons">${btn(s.checked?'✅ Erneut prüfen':'✅ Antworten prüfen und Ergebnis ansehen','readingCheck')}${btn(s.showSamples?'Beispiele schließen':'Musterantworten ansehen','readingSamples','alt')}</div>${s.showSamples?card(`<h3>Musterantworten · Aufgabe 3</h3><p>1. He is interested in history and owns a private collection of knight’s armour and other things from the past.</p><p>2. He was scared/afraid of a stone animal. / He thought the animal was real.</p><h3>Beispiel · Aufgabe 4</h3><p>I think Year 9 had a very exciting class trip to Cardiff Castle. Mike’s report is interesting. I really like the photos. I want to visit Cardiff Castle in my next summer holidays. — Melanie</p>`):''}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));
}
function readingOpenScore(text,index){const value=String(text||'').toLowerCase();if(index===0)return /histor/.test(value)&&/(collection|armou?r|past|things from)/.test(value);return 
/(scared|afraid|frightened|real)/.test(value);}
function readingResult(s){const matches=READING_HEADINGS.reduce((n,h,i)=>n+(h.correct!=='-'&&s.matches?.[i]===h.correct?1:0),0),truth=READING_STATEMENTS.reduce((n,q,i)=>n+(s.truth?.[i]===q[1]?1:0),0),open=READING_HEADINGS.length?((readingOpenScore(s.answers?.[0],0)?2:0)+(readingOpenScore(s.answers?.[1],1)?2:0)):0,own4=Math.max(0,Math.min(4,Number(s.own4)||0));return {matches,truth,open,own4,total:matches+truth+open+own4};}
function readingCheck(){readingInputSave();const s=readingLoad();s.checked=true;readingSave(s);void syncReadingLearningProgress(s);const manualAnswers=[...(s.answers||[]),s.guestbook||''].filter(value=>String(value||'').trim()).length;void updateDailySubmittedAnswers(soloName,'english',Date.now(),manualAnswers);const paragraphOptions=['1','2','3','4','-'];READING_HEADINGS.forEach((question,index)=>{if(question.correct==='-')return;const selected=String(s.matches?.[index]||'').trim();if(!selected)return;void recordLearningError(soloName,'english','english_reading',index,'Reading · Cardiff Castle · Überschriften',{prompt:question.text,options:paragraphOptions,correct:paragraphOptions.indexOf(question.correct),type:'tf'},selected===question.correct);});const truthOptions=['Right','Wrong','Not in the text'],truthValues={right:'Right',wrong:'Wrong',not:'Not in the text'};READING_STATEMENTS.forEach(([prompt,correct],index)=>{const selected=String(s.truth?.[index]||'').trim();if(!selected)return;void recordLearningError(soloName,'english','english_reading',READING_HEADINGS.length+index,'Reading · Cardiff Castle · Aussagen',{prompt,options:truthOptions,correct:truthOptions.indexOf(truthValues[correct]),type:'tf'},selected===correct);});readingRender();}
function readingSamples(){readingInputSave();const s=readingLoad();s.showSamples=!s.showSamples;readingSave(s);readingRender();}
function readingInputSave(){const s=readingLoad();document.querySelectorAll('[data-reading-match]').forEach(el=>s.matches[Number(el.dataset.readingMatch)]=el.value);document.querySelectorAll('[data-reading-truth]:checked').forEach(el=>s.truth[Number(el.dataset.readingTruth)]=el.value);document.querySelectorAll('[data-reading-answer]').forEach(el=>s.answers[Number(el.dataset.readingAnswer)]=el.value);const guest=document.querySelector('[data-reading-guestbook]');if(guest)s.guestbook=guest.value;const own=document.querySelector('[data-reading-own4]');if(own)s.own4=Number(own.value);readingSave(s);}

const writingKey=()=>`vb2writing_${soloName}_unit2`;
function writingLoad(){try{return JSON.parse(localStorage.getItem(writingKey())||'null')||{texts:{},plans:{},checks:{},complete:{}};}catch{return {texts:{},plans:{},checks:{},complete:{}};}}
async function syncWritingProgress(s=writingLoad()){if(!db||!uid||!soloName)return;const done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length,started=WRITING_TASKS.filter(t=>String(s.texts?.[t.id]||'').trim()||String(s.plans?.[t.id]||'').trim()||(s.checks?.[t.id]||[]).some(Boolean)).length,now=Date.now(),drafts=Object.fromEntries(WRITING_TASKS.map(t=>[t.id,{text:s.texts?.[t.id]||'',plan:s.plans?.[t.id]||'',checks:s.checks?.[t.id]||[],started:!!(String(s.texts?.[t.id]||'').trim()||String(s.plans?.[t.id]||'').trim()||(s.checks?.[t.id]||[]).some(Boolean))}]));try{await set(ref(db,`soloProgress/${uid}/${soloName}/writingUnit2`),{done,started,total:WRITING_TASKS.length,completed:s.complete||{},drafts,currentTask:WRITING_TASKS[writingIndex]?.title||'',active:true,updatedAt:now,timestamp:now});instantSyncOk();}catch(e){instantSyncError('Writing konnte gerade nicht live übertragen werden: '+e.message);}}
function writingSaveField(field,value){const s=writingLoad(),t=WRITING_TASKS[writingIndex];if(!t)return;s[field]=s[field]||{};if(field==='checks'){s[field][t.id]=s[field][t.id]||[];s[field][t.id][value.index]=value.checked;}else s[field][t.id]=value;localStorage.setItem(writingKey(),JSON.stringify(s));touchLearningActivity(soloName,`english_writing_task${writingIndex+1}`,{taskTitle:t.title,started:!!(String(s.texts?.[t.id]||'').trim()||String(s.plans?.[t.id]||'').trim()),finished:!!s.complete?.[t.id],status:'Writing-Entwurf live'});void syncWritingProgress(s);}
function writingMenu(){if(!soloName){soloChooseName();return;}const s=writingLoad(),done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length;app.innerHTML=card(`<h2>✍️ Writing · Unit 2</h2><p>Übe Schritt für Schritt: planen, schreiben, mit einem Beispiel vergleichen und selbst prüfen.</p><div class="solo-game"><h3>💡 Adjektiv oder Adverb?</h3><p><strong>Adj
ektive</strong> beschreiben Dinge oder Personen: <em>a fast sport</em> (ein schneller Sport).</p><p><strong>Adverbien</strong> beschreiben, wie jemand etwas tut: <em>run quickly</em> (schnell laufen).</p><p>Oft kommt <strong>-ly</strong> dazu: careful → carefully, slow → slowly, easy → easily. Merke: fast → fast, hard → hard, good → well.</p></div><p>${done} von ${WRITING_TASKS.length} Aufgaben selbst geprüft</p>${WRITING_TASKS.map((t,i)=>`<div class="solo-game"><h3>${esc(t.title)} ${s.complete?.[t.id]?'✅':''}</h3><p>${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p><div class="solo-actions">${btn(s.complete?.[t.id]?'Weiter üben':'Aufgabe öffnen',`writingOpen${i}`)}</div></div>`).join('')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function writingOpen(i){if(!WRITING_TASKS[i])return;writingIndex=i;writingModelVisible=false;void recordLearningActivity(soloName,`english_writing_task${i+1}`);writingRender();void syncWritingProgress();}
function writingRender(){const t=WRITING_TASKS[writingIndex];if(!t){writingMenu();return;}const s=writingLoad(),text=String(s.texts?.[t.id]||''),plan=String(s.plans?.[t.id]||''),checks=s.checks?.[t.id]||[];app.innerHTML=card(`<h2>✍️ ${esc(t.title)}</h2><p><strong>Deine Aufgabe:</strong> ${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p><div class="solo-game"><h3>So gehst du vor</h3><ol>${t.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Satzanfänge als Hilfe</h3>${t.frames.map(x=>`<p><code>${esc(x)}</code></p>`).join('')}</div>${t.id==='article'?`<label>Meine Stichpunkte<textarea data-writingplan rows="4" maxlength="1500" placeholder="Sportart · was ist daran toll? · was tut man? · was braucht man? · wie sollte man sein?" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(plan)}</textarea></label>`:''}<label>Dein Text<textarea data-writingtext rows="10" maxlength="5000" placeholder="Schreibe deinen eigenen Text hier …" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(text)}</textarea></label><p class="muted">Deine Eingaben erscheinen sofort live.</p>${btn(writingModelVisible?'Musterlösung ausblenden':'Musterlösung ansehen','writingModel','alt')}${writingModelVisible?`<div class="solo-game"><h3>Musterlösung</h3><p style="white-space:pre-wrap;line-height:1.6">${esc(t.model)}</p><p class="muted">Vergleiche die Ideen und schreibe deine eigene Version.</p></div>`:''}<div class="solo-game"><h3>Meine Checkliste</h3>${t.checklist.map((x,i)=>`<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><input type="checkbox" data-writingcheck="${i}" ${checks[i]?'checked':''} style="width:auto;margin-top:4px"> <span>${esc(x)}</span></label>`).join('')}</div><div class="solo-actions">${btn(s.complete?.[t.id]?'Als noch offen markieren':'Aufgabe abschließen','writingComplete')}${writingIndex>0?btn('← Vorige Aufgabe',`writingOpen${writingIndex-1}`,'alt'):''}${writingIndex<WRITING_TASKS.length-1?btn('Nächste Aufgabe →',`writingOpen${writingIndex+1}`,'alt'):''}</div>`)+card(btn('Zur Writing-Übersicht','writingMenu','alt'));}
function writingToggleComplete(){const t=WRITING_TASKS[writingIndex],s=writingLoad();if(!t)return;s.complete=s.complete||{};if(s.complete[t.id])delete s.complete[t.id];else{if(!String(s.texts?.[t.id]||'').trim()){msg('Schreibe erst deinen Text und vergleiche ihn mit der Musterlösung.',true);return;}if((s.checks?.[t.id]||[]).filter(Boolean).length<t.checklist.length){msg('Prüfe alle Punkte in der Checkliste, bevor du die Aufgabe abschließt.',true);return;}s.complete[t.id]=true;void updateDailySubmittedAnswers(soloName,'english',Date.now(),1);}localStorage.setItem(writingKey(),JSON.stringify(s));void syncWritingProgress(s);writingRender();}
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
function mathActivityTotal(b){if(b<3)return MATH_BATTLES[b]?.length||30;if(b===3)return MATH_CARDS.length;if(b===4)return MATH_EXAM_BATTLE.length;if(b===5)return MATH_RATIONAL_EXAM_BATTLE.length;if(b===6)return MATH_PROPORTIONAL_EXAM_BATTLE.length;if(b>=7&&b<=9)return MATH_PROPORTIONAL_CLASSWORKS[b-7]?.questions.length||15;if(b>=10&&b<=18)return MATH_PROPORTIONAL_PRACTICE_BLOCKS[b-10]?.questions.length||15;return 0;} function mathSave(){if(!mathRun)return;mathRun.updatedAt=Date.now();localStorage.setItem(mathKey(mathName,mathRun.b),JSON.stringify(mathRun));touchLearningActivity(mathName,mathActivityId(mathRun.b),{done:mathRun.index,total:mathActivityTotal(mathRun.b),score:Number(mathRun.score)||0,finished:!!mathRun.finished,status:'Mathe-Fortschritt live'});void mathSync();}
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
function mathChoose(){mathRun=null;mathView='';app.innerHTML=card('<h2>🔢 Mathe · Klasse 7 NRW</h2><p>Wähle ein Kapitel zum Lernen oder eine Klassenarbeit.</p>'+`<div class="solo-actions daily-compare-entry">${btn('🏆 Tagesvergleich Mathe','dailyLeaderboardMath','alt')}</div><section class="solo-section math-review-panel"><div class="math-review-copy"><span class="math-review-kicker">🔁 Wiederholen</span><h3>Das muss ich noch lernen</h3><p>Offene Mathefehler üben, bis sie richtig beantwortet sind.</p></div><div class="solo-actions">${btn('Mathe-Fehler wiederholen','reviewMathChild','math-review-button')}</div></section>`+'<div class="name-actions">'+btn('➗ Bruchrechnung','mathViewFractions','math-choice-fractions')+btn('🔢 Rationale Zahlen','mathViewRational','math-choice-rational')+btn('📈 Proportional / Antiproportional','mathViewProportional','math-choice-proportional')+btn('📝 Klassenarbeit Brüche','mathViewExam','math-choice-exam-fractions')+btn('📝 Klassenarbeit Rationale Zahlen','mathViewRationalExam','math-choice-exam-rational')+btn('📝 Klassenarbeit Proportional / Antiproportional','mathViewProportionalExam','math-choice-proportional-exam')+'</div>')+card(btn('Zur Fächerauswahl','home','alt'));}
function mathSelectView(view){mathView=view;mathHome();if(view==='proportional')window.scrollTo(0,0);}
function mathNeedName(action){if(mathName)return false;mathPendingAction=action;app.innerHTML=card('<h2>📚 Wer lernt gerade?</h2><p>Wähle deinen Namen, damit dein Lernstand gespeichert wird.</p><div class="solo-actions daily-compare-entry">'+btn('🏆 Tagesvergleich Mathe','dailyLeaderboardMath','alt')+'</div><p class="muted">👑 Tageskrone: meiste Antworten; bei Gleichstand entscheidet die niedrigere Fehlerquote.</p><div class="name-actions">'+SOLO_NAMES.map((n,i)=>btn(esc(n),`mathName${i}`)).join('')+'</div>')+card(btn('Zur Aufgabenübersicht','mathHome','alt'));applyDailyCrowns('math','mathName');return true;}
function mathSetName(i){mathName=SOLO_NAMES[i];const action=mathPendingAction;mathPendingAction='';if(action==='reviewMathChild'){void learningReview(mathName,'math');return;}if(action)mathAction(action);else mathHome();}
function mathHome(){mathRun=null;const back=card((mathName?btn('🔁 Das muss ich noch lernen · Mathe','reviewMathChild'):'')+btn('Zur Mathe-Auswahl','mathChoose','alt'))+card(btn('Fach wechseln','home','alt'));
 if(mathView==='fractions'){const fractions=FRACTION_MODULES.map(m=>{const v=fractionLoad(mathName,m.id);return '<div class="player"><h3>'+esc(m.title)+'</h3><p>'+Math.min(m.questions.length,Number(v?.index)||0)+'/'+m.questions.length+' Aufgaben · '+(Number(v?.score)||0)+' Punkte'+(v?.finished?' · abgeschlossen':'')+'</p>'+btn(v?.index&&!v.finished?'Weiterlernen':v?.finished?'Noch einmal üben':'Erklärung & Start','fractionOpen_'+m.id)+'</div>';}).join('');app.innerHTML=card('<h2>➗ Bruchrechnung · Klasse 7'+(mathName?' · '+esc(mathName):'')+'</h2><p>Erklärungen und Übungsfragen zu allen sieben Themen.</p>'+fractions)+back;return;}
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

 app.innerHTML=card('<h2>📈 Proportional / Antiproportional'+(mathName?' · '+esc(mathName):'')+'</h2><p class="proportional-meta">Klasse 7 · NRW</p>'+practicePanel+'<div class="proportional-notes"><article class="proportional-note proportional-card"><div class="proportional-note-heading"><span class="proportional-note-icon">↗</span><div><span class="proportional-kicker">Verstehen</span><h3>Proportional</h3></div><strong class="proportional-formula">y : x = k</strong></div><p>Beide Größen verändern sich im gleichen Verhältnis. Der Quotient bleibt gleich.</p><div class="proportional-example"><strong>Beispiel</strong><p>2 Stunden → 140 km. Pro Stunde sind das 140 : 2 = 70 km. In 3,5 Stunden sind es 70 · 3,5 = 245 km.</p><p>So sieht eine proportionale Tabelle aus: Je mehr Hefte, desto höher der Preis. Der Quotient bleibt immer 2.</p>'+proportionalTable+proportionalVideo+'</div></article><article class="proportional-note antiproportional-card"><div class="proportional-note-heading"><span class="proportional-note-icon">↕</span><div><span class="proportional-kicker">Verstehen</span><h3>Antiproportional</h3></div><strong class="proportional-formula">x · y = k</strong></div><p>Wird eine Größe größer, wird die andere entsprechend kleiner. Das Produkt bleibt gleich.</p><div class="proportional-example"><strong>Beispiel</strong><p>4 Arbeiter · 12 Stunden = 48 Arbeiterstunden. Mit 6 Arbeitern dauert es 48 : 6 = 8 Stunden.</p><p>In dieser Tabelle bleibt das Produkt aus Arbeiterzahl und Zeit immer 12.</p>'+antiproportionalTable+antiproportionalVideo+'</div></article></div><div class="proportional-material-panel"><h3>Erklärungen und Lernmaterial</h3><p>Zum Verstehen und Wiederholen.</p><div class="proportional-material-buttons">'+btn('📄 Arbeitsblatt','mathProportionalWorksheet')+btn('📖 Lernkarten','mathProportionalFlashcards')+'</div></div>')+back;return;
}
 const titles=['Zahlen vergleichen, addieren und subtrahieren','Multiplizieren und dividieren','Klammern und gemischte Rechnungen'];const battles=titles.map((t,b)=>{const x=mathLoad(mathName,b);return '<div class="player"><h3>'+RATIONAL_MATH_TITLES[b]+'</h3><p>'+esc(t)+'</p><p>'+(x?.index||0)+'/30 Aufgaben · '+(x?.score||0)+' Punkte</p>'+btn('Neu beginnen','mathStart'+b)+((x&&!x.finished)?btn('Fortsetzen','mathResume'+b,'alt'):'')+'</div>';}).join('');const x=mathLoad(mathName,3);const exercise='<div class="player"><h3>'+RATIONAL_MATH_TITLES[3]+'</h3><p>Merkkarten zu Brüchen, Rechenregeln, Vergleichen und Umwandeln</p><p>'+Math.min(MATH_CARDS.length,Number(x?.index)||0)+'/'+MATH_CARDS.length+' Karten · '+(Number(x?.score)||0)+' Punkte'+(x?.finished?' · abgeschlossen':'')+(x?.missed?.length?' · 🔁 '+x.missed.length+' zum Wiederholen':'')+'</p>'+btn(x&&x.index>0&&!x.finished?'Weiterlernen':x?.finished?'Noch einmal üben':'Starten','mathFlashStart')+(x&&x.index>0&&!x.finished?btn('Fortsetzen','mathFlashResume','alt'):'')+'</div>';app.innerHTML=card('<h2>🔢 Rationale Zahlen · Klasse 7'+(mathName?' · '+esc(mathName):'')+'</h2><p>Zahlen vergleichen, rechnen und umwandeln.</p>'+exercise+battles)+back;}
let fractionRun=null;
function fractionLoad(name,id){try{return JSON.parse(localStorage.getItem('vb2math_'+name+'_fraction_'+id)||'null');}catch{return null;}}
function fractionSave(){if(!fractionRun||!mathName)return;fractionRun.updatedAt=Date.now();localStorage.setItem('vb2math_'+mathName+'_fraction_'+fractionRun.id,JSON.stringify(fractionRun));const total=FRACTION_MODULES.find(m=>m.id===fractionRun.id)?.questions.length||0;touchLearningActivity(mathName,'math_fraction_'+fractionRun.id,{done:fractionRun.index,total,score:Number(fractionRun.score)||0,finished:!!fractionRun.finished,status:'Bruch-Fortschritt live'});void fractionSync();}
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
let proportionalStudyDeck='',proportionalStudyIndex=0,proportionalStudyRevealed=false;
function mathProportionalStudyStart(deck){proportionalStudyDeck=deck;proportionalStudyIndex=0;proportionalStudyRevealed=false;void recordLearningActivity(mathName,`math_proportional_${deck}`);mathProportionalStudyShow();window.scrollTo(0,0);}
function mathProportionalStudyShow(){
 const cards=proportionalStudyDeck==='worksheet'?PROPORTIONAL_WORKSHEET_CARDS:PROPORTIONAL_FLASH_CARDS;
 const isWorksheet=proportionalStudyDeck==='worksheet';
 const title=isWorksheet?'Arbeitsblatt · Begriffe lernen':'Lernkarten · Frage und Antwort';
 const item=cards[proportionalStudyIndex];touchLearningActivity(mathName,`math_proportional_${proportionalStudyDeck}`,{taskTitle:item.front,done:proportionalStudyIndex+(proportionalStudyRevealed?1:0),total:cards.length,revealed:proportionalStudyRevealed,status:isWorksheet?'Arbeitsblatt live':'Lernkarten live'});
 const frontLabel=isWorksheet?'Begriff':'Frage';
 const backLabel=isWorksheet?'Erklärung':'Antwort';
 const percent=Math.round((proportionalStudyIndex+1)/cards.length*100);
 const answer=proportionalStudyRevealed?'<div class="proportional-learning-side proportional-learning-answer"><strong>'+backLabel+'</strong><p>'+esc(item.back)+'</p></div>':btn('💡 '+backLabel+' anzeigen','mathProportionalReveal');
 const navigation=proportionalStudyRevealed?'<div class="proportional-card-nav">'+(proportionalStudyIndex>0?btn('← Zurück','mathProportionalPrevious','alt'):'<span></span>')+btn(proportionalStudyIndex+1<cards.length?'Nächste Karte →':'Fertig','mathProportionalNext')+'</div>':'';
 app.innerHTML=card('<h2>'+title+'</h2><p class="muted">Karte '+(proportionalStudyIndex+1)+' von '+cards.length+'</p><div class="bar"><div class="fill" style="width:'+percent+'%"></div></div><div class="proportional-learning-side proportional-learning-front"><strong>'+frontLabel+'</strong><h3>'+esc(item.front)+'</h3></div>'+answer+navigation)+card(btn('Zurück zum Kapitel','mathViewProportional','alt'));
}
function mathProportionalReveal(){proportionalStudyRevealed=true;mathProportionalStudyShow();}
function mathProportionalNext(){const cards=proportionalStudyDeck==='worksheet'?PROPORTIONAL_WORKSHEET_CARDS:PROPORTIONAL_FLASH_CARDS;if(proportionalStudyIndex+1>=cards.length){touchLearningActivity(mathName,`math_proportional_${proportionalStudyDeck}`,{done:cards.length,total:cards.length,finished:true,status:'abgeschlossen'});mathSelectView('proportional');return;}proportionalStudyIndex++;proportionalStudyRevealed=false;mathProportionalStudyShow();}
function mathProportionalPrevious(){if(proportionalStudyIndex>0)proportionalStudyIndex--;proportionalStudyRevealed=false;mathProportionalStudyShow();}
function mathAction(v){if(v.startsWith('fractionOpen_')){fractionOpen(v.slice(13));return true;}if(v.startsWith('fractionStart_')){fractionStart(v.slice(14));return true;}if(v==='fractionNext'){fractionQuestion();return true;}if(v==='mathChoose')mathChoose();else if(v==='mathViewFractions')mathSelectView('fractions');else if(v==='mathViewRational')mathSelectView('rational');else if(v==='mathViewExam')mathSelectView('exam');else if(v==='mathViewRationalExam')mathSelectView('rationalExam');else if(v==='mathViewProportional')mathSelectView('proportional');else if(v==='mathViewProportionalExam')mathSelectView('proportionalExam');else if(v==='mathPracticePro'){mathPracticeGroup='proportional';mathView='proportionalPractice';mathHome();}else if(v==='mathPracticeAnti'){mathPracticeGroup='antiproportional';mathView='proportionalPractice';mathHome();}else if(v==='mathPracticeMixed'){mathPracticeGroup='mixed';mathView='proportionalPractice';mathHome();}else if(v==='mathProportionalWorksheet')mathProportionalStudyStart('worksheet');else if(v==='mathProportionalFlashcards')mathProportionalStudyStart('flashcards');else if(v==='mathProportionalReveal')mathProportionalReveal();else if(v==='mathProportionalNext')mathProportionalNext();else if(v==='mathProportionalPrevious')mathProportionalPrevious();else if(v==='mathHome')mathHome();else if(v==='mathShowSolution')mathShowSolution();else if(v==='fractionShowSolution')fractionShowSolution();else if(v==='mathNext')mathQuestion();else if(v==='mathFlashStart')mathFlashStart();else if(v==='mathFlashResume')mathFlashResume();else if(v==='mathFlashReveal')mathFlashReveal();else if(v==='mathFlashKnown')mathFlashKnown();else if(v==='mathFlashAgain')mathFlashAgain();else if(v==='mathFlashReviewKnown')mathFlashReviewKnown();else if(v==='mathFlashReviewAgain')mathFlashReviewAgain();else if(/^mathName[0-3]$/.test(v))mathSetName(Number(v.slice(-1)));else if(/^mathStart\d+$/.test(v))mathStart(Number(v.slice(9)));else if(/^mathResume\d+$/.test(v))mathStart(Number(v.slice(10)),true);else return false;return true;}

const VOCAB_WORK_BATTLE_QUESTIONS=[
 {title:"Seite 1 · Aufgabe 1 · water sports",category:"water sports",prompt:"Name a water sport. Any correct water sports is accepted.",accepted:["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"]},
 {title:"Seite 1 · Aufgabe 1 · water sports",category:"water sports",prompt:"Name a water sport. Any correct water sports is accepted.",accepted:["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"]},
 {title:"Seite 1 · Aufgabe 1 · water sports",category:"water sports",prompt:"Name a water sport. Any correct water sports is accepted.",accepted:["swimming", "open water swimming", "marathon swimming", "freestyle swimming", "artistic swimming", "synchronized swimming", "synchronised swimming", "water ballet", "diving", "springboard diving", "platform diving", "high diving", "cliff diving", "scuba diving", "free diving", "freediving", "snorkeling", "snorkelling", "finswimming", "underwater swimming", "underwater hockey", "underwater rugby", "underwater football", "underwater orienteering", "underwater target shooting", "water polo", "waterball", "water ball", "canoeing", "canoe sprint", "canoe slalom", "canoe cross", "kayaking", "whitewater kayaking", "kayak cross", "rafting", "white water rafting", "river rafting", "canoe polo", "kayak polo", "rowing", "coastal rowing", "dragon boat racing", "dragon boating", "sailing", "yachting", "regatta", "boat racing", "powerboat racing", "windsurfing", "wind surfing", "kitesurfing", "kite surfing", "kiteboarding", "stand up paddleboarding", "stand-up paddleboarding", "paddleboarding", "sup", "surfing", "river surfing", "bodyboarding", "boogie boarding", "skimboarding", "wakeboarding", "water skiing", "waterskiing", "barefoot water skiing", "kneeboarding", "jet skiing", "jetskiing", "personal watercraft racing", "parasailing", "flyboarding", "hydroflight", "hydrofoil surfing", "foil surfing", "paddle surfing", "tubing", "water tubing", "canyoning", "canyoneering", "coasteering", "river trekking", "sport fishing", "fly fishing", "spearfishing", "aquathlon", "water basketball", "water volleyball", "beach water polo", "water aerobics", "aqua aerobics", "aquabiking", "aqua zumba", "ice swimming", "lifesaving sport", "surf lifesaving", "water rescue sport", "Schwimmen", "Freiwasserschwimmen", "Synchronschwimmen", "Kunstschwimmen", "Wasserspringen", "Turmspringen", "Wasserball", "Wasserballspiel", "Kanufahren", "Kanusport", "Kanurennsport", "Kanuslalom", "Kajakfahren", "Wildwasserkajak", "Rudern", "Drachenboot", "Drachenbootrennen", "Segeln", "Regattasegeln", "Surfen", "Wellenreiten", "Windsurfen", "Kitesurfen", "Stand-up-Paddling", "Stehpaddeln", "Wasserski", "Wakeboard", "Wasserskifahren", "Tauchen", "Sporttauchen", "Schnorcheln", "Unterwasserrugby", "Unterwasserhockey", "Jetski", "Wassermotorradrennen", "Wasserrettungssport", "Sportfischen", "Fliegenfischen"]},
 {title:"Seite 1 · Aufgabe 1 · ball sports",category:"ball sports",prompt:"Name a ball sport. Any correct ball sports is accepted.",accepted:["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"]},

 {title:"Seite 1 · Aufgabe 1 · ball sports",category:"ball sports",prompt:"Name a ball sport. Any correct ball sports is accepted.",accepted:["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"]},
 {title:"Seite 1 · Aufgabe 1 · ball sports",category:"ball sports",prompt:"Name a ball sport. Any correct ball sports is accepted.",accepted:["football", "soccer", "association football", "american football", "canadian football", "australian rules football", "gaelic football", "rugby", "rugby union", "rugby league", "rugby sevens", "flag football", "futsal", "indoor soccer", "beach soccer", "basketball", "3x3 basketball", "wheelchair basketball", "streetball", "netball", "fast5 netball", "volleyball", "beach volleyball", "snow volleyball", "sitting volleyball", "water volleyball", "water polo", "waterball", "water basketball", "handball", "team handball", "field handball", "beach handball", "american handball", "gaelic handball", "hockey", "field hockey", "indoor hockey", "floorball", "roller hockey", "street hockey", "ice hockey", "bandy", "rink bandy", "cricket", "baseball", "softball", "baseball5", "rounders", "pesapallo", "tee ball", "kickball", "wiffleball", "tennis", "table tennis", "ping pong", "badminton", "squash", "racquetball", "padel", "paddle tennis", "pickleball", "beach tennis", "crossminton", "speed badminton", "golf", "mini golf", "golfcross", "bowling", "ten-pin bowling", "nine-pin bowling", "lawn bowls", "bocce", "bocce ball", "boules", "petanque", "pétanque", "billiards", "pool", "snooker", "carom billiards", "dodgeball", "battle ball", "tchoukball", "korfball", "lacrosse", "field lacrosse", "box lacrosse", "hurling", "camogie", "fistball", "fives", "jai alai", "basque pelota", "frontenis", "xare", "valencian pilota", "sepak takraw", "sipa", "footvolley", "teqball", "bossaball", "roundnet", "spikeball", "four square", "tetherball", "kin-ball", "kin ball", "gaga ball", "gaga", "goalball", "crossnet", "cestoball", "cycle ball", "cycleball", "bicycle polo", "canoe polo", "kayak polo", "horseball", "polo", "polocrosse", "pushball", "ringball", "ring tennis", "ringtennis", "ultimate frisbee", "frisbee", "disc golf", "boccia", "bocce volo", "skittleball", "klootschieten", "shuffleboard", "croquet", "stickball", "paintball", "skee ball", "slamball", "flickerball", "hooverball", "newcomb ball", "patball", "downball", "wallball", "wireball", "wiffle ball", "whiffle ball", "baseketball", "basketball tennis", "football tennis", "table football", "foosball", "table soccer", "carom", "candlepin bowling", "duckpin bowling", "five-pin bowling", "crown green bowls", "lawn tennis", "platform tennis", "soft tennis", "real tennis", "paddleball", "paddle ball", "squash tennis", "underwater rugby", "underwater football", "Fußball", "Hallenfußball", "Rollstuhlbasketball", "Beachvolleyball", "Schneevolleyball", "Wasserball", "Wasserballspiel", "Wasserbasketball", "Beachhandball", "Feldhockey", "Hallenhockey", "Unihockey", "Eishockey", "Pesäpallo", "Tischtennis", "Pingpong", "Minigolf", "Kegeln", "Boule", "Billard", "Poolbillard", "Völkerball", "Faustball", "Pelota", "Vier gewinnt Ballspiel", "Kanu-Polo", "Kajak-Polo", "Pferdepolo", "Klootschießen", "Tischfußball", "Schlagball", "Brennball"]},
 {title:"Seite 1 · Aufgabe 1 · winter sport",category:"winter sport",prompt:"Name a winter sport. Any correct winter sport is accepted.",accepted:["alpine skiing", "skiing", "downhill skiing", "freestyle skiing", "mogul skiing", "ski cross", "ski jumping", "ski flying", "cross country skiing", "cross-country skiing", "nordic skiing", "nordic combined", "ski mountaineering", "skimo", "telemark skiing", "speed skiing", "extreme skiing", "heli skiing", "heliskiing", "ski orienteering", "ski ballet", "firngleiten", "fun carving", "monoski", "skibob", "snowboarding", "snowboard cross", "snowboard slopestyle", "snowboard halfpipe", "snowboard big air", "snowkiting", "snowshoeing", "snowmobiling", "snowmobile racing", "snow scooting", "snowscooting", "snow tubing", "sledding", "sleighing", "tobogganing", "luge", "bobsleigh", "bobsled", "skeleton", "ice hockey", "sledge hockey", "para ice hockey", "figure skating", "ice dancing", "speed skating", "short track speed skating", "short track", "curling", "ice stock sport", "ice stock", "broomball", "bandy", "rinkball", "ringette", "ice climbing", "ice cross downhill", "ice sailing", "ice yachting", "ice biking", "winter triathlon", "winter pentathlon", "dog sled racing", "dog sledding", "sled dog racing", "skijoring", "snow rugby", "snow polo", "snow cricket", "snow volleyball", "snow golf", "snow kayaking", "snowball fighting", "yukigassen", "winter swimming", "cold water surfing", "ice fishing", "ice racing", "ice speedway", "barrel jumping", "synchronized skating", "synchronised skating", "figure skating pairs", "bobsleighing", "ice skating", "skating", "ski racing", "biathlon", "biathlon relay", "Ski", "Skifahren", "Ski alpin", "Abfahrtslauf", "Freestyle-Skiing", "Buckelpiste", "Skicross", "Skispringen", "Skifliegen", "Skilanglauf", "Langlauf", "Nordische Kombination", "Skibergsteigen", "Skitourengehen", "Telemark", "Geschwindigkeitsskifahren", "Extremskifahren", "Ski-Orientierungslauf", "Fun-Carving", "Snowboard", "Snowboardcross", "Snowkiten", "Schneeschuhwandern", "Schneemobilrennen", "Snowscoot", "Snowtubing", "Schlittenfahren", "Rodeln", "Rennrodeln", "Bob", "Bobsport", "Eishockey", "Para-Eishockey", "Eiskunstlauf", "Eistanz", "Eisschnelllauf", "Shorttrack", "Eisstockschießen", "Eisklettern", "Eisrennen", "Eissegeln", "Eisbike", "Wintertriathlon", "Hundeschlittenrennen", "Skijöring", "Snowrugby", "Snowpolo", "Snowcricket", "Schneeballwerfen", "Winterbaden", "Winterschwimmen", "Eisschwimmen", "Eisangeln", "Eisspeedway"]},
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
const kidGbQuestions=station=>GRAMMAR[station].tasks.flatMap(task=>(task.items||task.open||[]).map((item,i)=>({title:task.title,prompt:task.items?item[0]+' _____ '+item[1]:(task.prompts?.[i]||'Schreibe einen vollständigen englischen Satz.'),image:String(task.images?.[i]||task.image||'')})));
function gbListen(){if(gbOff)gbOff();if(gbTimer){clearInterval(gbTimer);gbTimer=null;}gbOff=onValue(ref(db,'grammarRooms/'+gbCode),snap=>{gbRoom=snap.val();if(!gbRoom){msg('Grammatik-Raum nicht gefunden.',true);return;}gbRender();},e=>msg('Grammatik-Battle: '+e.message,true));}
function gbClock(){const m=gbRoom?.meta||{},el=document.querySelector('#kid-gb-clock');if(!el||m.stage!=='question')return;el.textContent='⏱️ Noch '+Math.max(0,Math.ceil((Number(m.deadline||0)-Date.now())/1000))+' Sekunden';}

function gbRender(){const m=gbRoom?.meta||{},draftKey=`${gbCode}:${m.index}:${uid}`;if(draftKey!==gbDraftKey){gbDraftKey=draftKey;gbDraft='';}const activeDraft=document.querySelector('[data-kid-gbtext]');if(activeDraft)gbDraft=activeDraft.value;const isVocabWork=m.kind==='vocab-work'||m.kind==='vocab-work-station2',isVocabWork2=m.kind==='vocab-work-station2',questions=isVocabWork2?VOCAB_WORK_STATION2_BATTLE_QUESTIONS:isVocabWork?VOCAB_WORK_BATTLE_QUESTIONS:kidGbQuestions(Number(m.station||0)),q=questions[Number(m.index||0)],answer=gbRoom.submissions?.[m.index]?.[uid],review=gbRoom.reviews?.[m.index]?.[uid],title=isVocabWork2?'Vokabelarbeit · Station 2 · Seiten 1 + 2':isVocabWork?'Vokabelarbeit · Station 1 · Seiten 1 + 2':'Grammatik · Station '+(Number(m.station)+1),image=q?.image?'<img src="'+esc(q.image)+'" alt="Abbildung zu '+esc(q.title)+'" style="display:block;width:min(100%,340px);height:190px;object-fit:contain;background:#fff;border-radius:14px;border:2px solid #a9bad0;padding:8px;margin:12px auto">':'',reveal=isVocabWork&&m.stage==='reveal';let content='';if(m.stage==='lobby')content='<h3>Warteraum</h3><p>Warte, bis der Schiedsrichter startet.</p>';else if(m.stage==='finished')content='<h3>'+(isVocabWork?'Vokabelarbeit':'Grammatik')+'-Battle beendet</h3><p>Dein Ergebnis steht in der Rangliste.</p>';else if(q){content='<h3>'+esc(q.title)+'</h3>'+image+'<p>'+esc(q.prompt)+'</p>';if(m.stage==='question')content+='<p id="kid-gb-clock"></p>';if(reveal)content+='<p class="'+(review?.correct?'good':'error')+'">'+(review?.correct?'✅ Richtig':'❌ Falsch')+' · Deine Antwort: '+esc(answer?.text||'keine Antwort')+'</p><p><strong>Richtige Lösung:</strong> '+(q.category?'Any correct '+esc(q.category)+' is accepted.':esc((q.accepted||[]).join(' / ')))+'</p>';else if(review)content+='<p>'+(review.correct?'✅ Richtig gewertet':'❌ Falsch gewertet')+'</p>';else if(answer)content+='<p>'+(isVocabWork?'✅ Antwort abgegeben. Die Auswertung folgt nach Ablauf der Zeit.':'Antwort abgegeben. Warte auf die Bewertung.')+'</p>';else content+='<label>Deine Antwort<input data-kid-gbtext maxlength="500" autocomplete="off" value="'+esc(gbDraft)+'" style="background:#fff;color:#172033;border:2px solid #a9bad0;border-radius:12px;padding:14px;font-size:1.1rem;width:100%;box-sizing:border-box"></label><button data-action="kidGbSubmit">Antwort abgeben</button>';}else content='<p>Aufgabe wird geladen …</p>';app.innerHTML=card('<h2>📝 '+esc(title)+'</h2><p>Aufgabe '+Math.min(questions.length,Number(m.index||0)+1)+' von '+questions.length+'</p>'+content)+card(btn('Zur Startseite','home','alt'));if(gbTimer)clearInterval(gbTimer);if(m.stage==='question'){gbTimer=setInterval(gbClock,250);gbClock();}}
async function kidGbSubmit(){const m=gbRoom?.meta||{},text=document.querySelector('[data-kid-gbtext]')?.value.trim();if(!uid||m.stage!=='question'||gbRoom.submissions?.[m.index]?.[uid])return;if(!text){msg('Schreibe zuerst deine Antwort.',true);return;}if(Date.now()>=Number(m.deadline||0)){msg('Die Antwortzeit ist abgelaufen.',true);return;}try{await set(ref(db,`grammarRooms/${gbCode}/submissions/${m.index}/${uid}`),{text,at:Date.now()});}catch(e){msg('Antwort konnte nicht gespeichert werden: '+e.message,true);}}
function wbListen(){if(wbOff)wbOff();wbOff=onValue(ref(db,`grammarRooms/${wbCode}`),snap=>{wbRoom=snap.val();if(!wbRoom){msg('Writing-Raum nicht gefunden.',true);return;}wbRender();},e=>msg('Writing-Battle: '+e.message,true));}
function wbRender(){const m=wbRoom?.meta||{},i=Number(m.index||0),draftKey=`writing:${gbCode}:${i}:${uid}`;if(draftKey!==wbDraftKey){wbDraftKey=draftKey;wbDraft='';}const activeDraft=document.querySelector('[data-kid-wbtext]');if(activeDraft)wbDraft=activeDraft.value;const q=WRITING_BATTLE[i],answer=wbRoom.submissions?.[i]?.[uid],review=wbRoom.reviews?.[i]?.[uid];let content=m.stage==='lobby'?'<h3>Warteraum</h3><p>Warte, bis der Schiedsrichter startet.</p>':m.stage==='finished'?'<h3>Writing-Battle beendet</h3><p>Dein Ergebnis steht in der Rangliste.</p>':q?`<h3>${esc(q.title)}</h3><p>${esc(q.prompt)}</p>${review?`<p>${review.correct?'✅ Richtig gewertet':'❌ Falsch gewertet'}</p>`:answer?'<p>Text abgegeben. Warte auf die Bewertung.</p>':`<label>Dein Text<textarea data-kid-wbtext rows="8" maxlength="1200">${esc(wbDraft)}</textarea></label><button data-action="kidWbSubmit">Text abgeben</button>`}`:'<p>Aufgabe wird geladen …</p>';app.innerHTML=card(`<h2>✍️ Writing-Battle · Unit 2</h2><p>Aufgabe ${Math.min(WRITING_BATTLE.length,i+1)} von ${WRITING_BATTLE.length}</p>${content}`)+card(btn('Zur Startseite','home','alt'));}
async function kidWbSubmit(){const m=wbRoom?.meta||{},i=Number(m.index||0),text=document.querySelector('[data-kid-wbtext]')?.value.trim();if(!uid||m.stage!=='question'||wbRoom.submissions?.[i]?.[uid])return;if(!text){msg('Schreibe zuerst deinen Text.',true);return;}if(Date.now()>Number(m.deadline||0)){msg('Die Schreibzeit ist abgelaufen.',true);return;}try{await set(ref(db,`grammarRooms/${wbCode}/submissions/${i}/${uid}`),{text,at:Date.now()});}catch(e){msg('Text konnte nicht gespeichert werden: '+e.message,true);}}
document.addEventListener('click',e=>{const ea=e.target.closest('[data-error-answer]');if(ea){void errorPracticeAnswer(ea.dataset.errorAnswer);return;}const errorListenSubmit=e.target.closest('[data-error-listening-submit]');if(errorListenSubmit){const item=errorEvalQueue[0]?.item;if(item)void errorPracticeAnswer(listeningAnswerValue({...item,q:item.prompt},'error'));return;}const ma=e.target.closest('[data-mathanswer]');if(ma){mathAnswer(Number(ma.dataset.mathanswer));return;}const mathButton=e.target.closest('[data-action]');if(mathButton&&(errorEvaluationAction(mathButton.dataset.action)||mathAction(mathButton.dataset.action)))return;const fa=e.target.closest('[data-fractionanswer]');if(fa){fractionAnswer(Number(fa.dataset.fractionanswer));return;}const a=e.target.closest('[data-action]'),ans=e.target.closest('[data-answer]'),sa=e.target.closest('[data-soloanswer]'),la=e.target.closest('[data-listenanswer]');if(ans){answer(Number(ans.dataset.answer));return;}if(sa){soloAnswer(Number(sa.dataset.soloanswer));return;}if(la){listenAnswer(Number(la.dataset.listenanswer));return;}const listenSubmit=e.target.closest('[data-listening-submit]');if(listenSubmit){const q=room?.meta?.mode==='listening'?current():LISTENING_QUESTIONS[listeningRun?.index];const prefix=listenSubmit.dataset.listeningSubmit==='battle'?'battle':'solo';const value=listeningAnswerValue(q,prefix);if(prefix==='battle')void answer(value);else listenAnswer(value);return;}if(!a)return;const v=a.dataset.action;if(v==='kidGbSubmit'){void kidGbSubmit();return;}if(v==='kidWbSubmit'){void kidWbSubmit();return;}if(v==='home')home();else if(v==='host'||v==='createRoom'||v==='dashboard'||v==='start'||v==='reset')return;else if(v==='join')joinForm();else if(v==='joinVocabWork')joinForm('Vokabelarbeit-Battle · Station 1, Seiten 1 + 2 beitreten','vocab-work-1');else if(v==='joinVocabWorkStation2')joinForm('Vokabelarbeit-Battle · Station 2, Seiten 1 + 2 beitreten','vocab-work-2');else if(v==='joinMathFractions')joinForm('1 · Bruchrechnung-Battle beitreten','fractions');else if(v==='joinMathRational')joinForm('2 · Rationale-Zahlen-Battle beitreten','rational');else if(v==='joinMathExam')joinForm('3 · Proportional-/Antiproportional-Klassenarbeit beitreten','math-exam');else if(v==='enter')enter();else if(['start','reset'].includes(v))hostAction(v);else if(v==='solo')soloChooseName();else if(v==='readingLearn')readingLearn();else if(v==='readingLearnHome')readingLearnHome();else if(v==='readingCheck')readingCheck();else if(v==='readingSamples')readingSamples();else if(v==='readingRoomEn'){readingBattleLanguage='en';render();}else if(v==='readingRoomDe'){readingBattleLanguage='de';render();}else if(v==='englishSeries'||v==='grammarSeries'||v==='battleSeriesEnglish')void showBattleSeries('english');else if(v==='battleSeriesMath')void showBattleSeries('math');else if(v==='dashboard')void showDashboard();else if(v==='soloChangeName')soloChooseName();else if(v==='soloHome')soloHome();else if(v==='vocabWorkPage1')vocabWorkPage(1);else if(v==='vocabWorkPage2')vocabWorkPage(2);else if(v==='vocabWorkStation2Page1')vocabWorkStation2Page(1);else if(v==='vocabWorkStation2Page2')vocabWorkStation2Page(2);else if(v==='vocabWorkCheck')vocabWorkCheck();else if(v==='vocabWorkRetry')vocabWorkRetry();else if(v==='vocabWorkStation2Check')vocabWorkStation2Check();else if(v==='vocabWorkStation2Retry')vocabWorkStation2Retry();else if(v==='vocabWorkBack'){vocabWorkCollect();soloHome();}else if(v==='grammarMenu')grammarMenu();else if(v==='grammarStation0')grammarStationMenu(0);else if(v==='grammarStation1')grammarStationMenu(1);else if(/^grammarTask\d+$/.test(v)){const n=Number(v.slice(11));if(grammarStation!==null&&n<GRAMMAR[grammarStation].tasks.length){void recordLearningActivity(soloName,`english_grammar_${grammarStation+1}_task${n+1}`);grammarRender(grammarStation,n);}}else if(v==='grammarCheck')grammarCheck();else if(v==='grammarReveal')grammarReveal();else if(v==='grammarClear')grammarClear();else if(v==='grammarBack')grammarStationMenu(grammarStation);else if(v==='writingMenu')writingMenu();else if(v==='writingModel'){writingModelVisible=!writingModelVisible;writingRender();}else if(v==='writingComplete')writingToggleComplete();else if(/^writingOpen[0-2]$/.test(v))writingOpen(Number(v.slice(-1)));else if(v==='listenStart')listenStart();else if(v==='listenResume')listenResume();else if(v==='listenNext')listenNext();else if(/^soloName[0-3]$/.test(v))soloSetName(Number(v.slice(-1)));else if(/^soloStart[012]$/.test(v))soloStart(Number(v.slice(-1)));else if(/^soloResume[012]$/.test(v))soloResume(Number(v.slice(-1)));else if(v==='soloNext')soloNext();});
document.addEventListener('input',e=>{if(e.target.matches('[data-kid-gbtext]'))gbDraft=e.target.value;if(e.target.matches('[data-kid-wbtext]'))wbDraft=e.target.value;if(e.target.matches('[data-reading-match],[data-reading-truth],[data-reading-answer],[data-reading-guestbook],[data-reading-own4]')){readingInputSave();const label=document.querySelector('[data-reading-own4-label]');if(label&&e.target.matches('[data-reading-own4]'))label.textContent=`${e.target.value} / 4`;}if(e.target.matches('[data-vocabwork]'))vocabWorkCollect();if(e.target.matches('[data-vocabwork-s2]'))vocabWorkStation2Collect();if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.matches('[data-writingtext]'))writingSaveField('texts',e.target.value);if(e.target.matches('[data-writingplan]'))writingSaveField('plans',e.target.value);});
document.addEventListener('change',e=>{if(e.target.matches('[data-reading-match],[data-reading-truth],[data-reading-own4]'))readingInputSave();if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.matches('[data-writingcheck]'))writingSaveField('checks',{index:Number(e.target.dataset.writingcheck),checked:e.target.checked});});
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







