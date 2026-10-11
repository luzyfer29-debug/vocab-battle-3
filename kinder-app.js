import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {getAuth,signInAnonymously,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {getDatabase,ref,onValue,get,set,update,runTransaction,remove} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';
import {BATTLES} from './questions.js';
import {MATH_BATTLES} from './math-questions.js';
import {GRAMMAR} from './grammar-data.js';
import {READING_TEXT_EN,READING_TEXT_DE,READING_ILLUSTRATION,READING_QUIZ,READING_TEXT_TASKS} from './reading-data.js';
import {WRITING_TASKS,WRITING_BATTLE} from './writing-data.js?v=unit2-writing-20261011c';
const app=document.querySelector('#app'),status=document.querySelector('#status');
const names=['Luca','Semir','Talea','Nele'];
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
const QUESTION_MS=15000,REVEAL_MS=3000;
const ADMIN_UID='M41x9WNoHAfqpSmyrztAgf2IZYC3';
let resetUnsubscribe=null,resetState={},resetReady=false;
let resetSources={legacy:{},english:{},math:{}};
let db,uid='',code='',role='',slot='',room=null,unsubscribe=null,solo=null;
let listeningRun=null,listeningSyncWarned=false;
let readingRun=null,readingLanguage='en',readingBattleLanguage='en';
let soloDirectTarget='',writingIndex=0,writingModelVisible=false,writingSyncTimer=null,wbDraft='',wbDraftIndex=-1,wbPlayerTimer=null;
let clock=null,busy=false,previousStageKey='',lastClockText='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(t,fn,cl='')=>`<button ${cl?`class="${cl}"`:''} data-action="${fn}">${t}</button>`;
const card=s=>`<section class="card">${s}</section>`;
const msg=(s,bad=false)=>status.innerHTML=`<p class="${bad?'error':'good'}">${esc(s)}</p>`;
// Lueckentexte aus den beiden vom Nutzer bereitgestellten Loesungsblaettern.
// Reihenfolge und Wortlaut der Saetze bleiben wie auf den Vorlagen.
const GAP_SETS=[
 {title:'Lückentext 1 · Station 1',groups:[{title:'Julies Nachricht an Beth · Aufgabe 4',parts:[
  'Hi Beth,\n\nHow was your trip to the activity centre?\n\nYou know I love ',
  ' (Freiluft-) activities, so I tried canoeing last weekend. Our group took a trip down the River Wye.\n\nThe trip wasn’t ',
  ' (gefährlich), of course, but we had to wear special ',
  ' (Ausrüstung) to keep us ',
  ' (sicher).\n\nGuess what? I wasn’t so bad. We had a friendly and ',
  ' (geduldig) instructor. She said I was very ',
  ' (begabt). ☺\n\nMara was there too. She’s a really ',
  ' (leistungsorientiert) girl and always wants to be most ',
  ' (erfolgreich). She was even ',
  ' (frech) to me. Well, forget about that …\n\nThe canoeing trip was great fun. In the evening I was ',
  ' (erschöpft) too, but I had a fantastic day.\n\nSee you soon!\nJulie'
 ],answers:[['outdoor'],['dangerous'],['equipment'],['safe'],['patient'],['talented'],['competitive'],['successful'],['cheeky'],['exhausted']]}]},
 {title:'Lückentext 2 · Station 2',groups:[
  {title:'Aufgabe 2 · Complete the sentences',parts:[
   'Example: I have a sore throat. I need my scarf.\n\n1. “Look, there has been an ',
   '. We must call an ambulance!”\n\n2. When I cut my finger, it started to ',
   ' badly.\n\n3. Your ',
   ' is a part of your leg.\n\n4. When you ',
   ' your ankle, you should put a bandage on it.\n\n5. “Yummy! Our pizza is ready. Let’s take it out.” – “Be careful! It’s hot. Don’t ',
   ' your hand when you take it out.”\n\n6. Call 999 for the ',
   ' services in the UK.'
  ],answers:[['accident'],['bleed'],['knee'],['sprain','twist','hurt'],['burn'],['emergency']]},
  {title:'Aufgabe 3 · Put in the right verb',parts:[
   '1. You ',
   ' (have / make) an accident.\n\n2. You ',
   ' (invite / call) the operator.\n\n3. You ',
   ' (give / ask) your name on the phone.\n\n4. You ',
   ' (speak / say) where you are.\n\n5. You ',
   ' (stay with / wait for) the hurt person.\n\n6. You ',
   ' (take / bring) a person to hospital.'
  ],answers:[['have'],['call'],['give'],['say'],['stay with'],['take']]}
 ]}
];
let gapStation=null;
function gapStorageKey(n){return `vb2gap_${soloName}_station_${n+1}`;}
function gapLoad(n){try{const v=JSON.parse(localStorage.getItem(gapStorageKey(n))||'null');return Array.isArray(v)?v:[];}catch{return [];}}
function gapSave(n,values){localStorage.setItem(gapStorageKey(n),JSON.stringify(values));}
function gapFields(n){return GAP_SETS[n].groups.flatMap(g=>g.answers);}
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

function gapRender(n,checked=false){
 if(!soloName){soloChooseName();return;}
 gapStation=n;
  if(!checked)gapSave(n,[]);
  const data=GAP_SETS[n],saved=gapLoad(n),answers=gapFields(n);let pos=0;
 const body=data.groups.map(group=>{
  let html='';for(let i=0;i<group.answers.length;i++){
   const idx=pos++,value=String(saved[idx]||''),correct=group.answers[i].some(a=>a.toLocaleLowerCase('en')===value.trim().toLocaleLowerCase('en'));
   html+=esc(group.parts[i]).replace(/\n/g,'<br>');
   html+=`<input data-gap="${idx}" aria-label="Lücke ${idx+1}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(value)}" style="display:inline-block;vertical-align:middle;box-sizing:border-box;max-width:130px;width:29vw;min-width:88px;height:38px;margin:2px 3px;padding:5px 7px;border:2px solid ${checked?(correct?'#6ee7a8':'#ff8d8d'):'#8c86bd'};border-radius:7px;background:#fff;color:#17152b;font-size:16px;line-height:1.2">`;
   if(checked&&!correct)html+=`<span style="color:#ffb0b0;font-weight:600"> (${esc(group.answers[i].join(' / '))})</span>`;
  }
  html+=esc(group.parts[group.answers.length]).replace(/\n/g,'<br>');
  return `<h3>${esc(group.title)}</h3><p style="line-height:1.85;overflow-wrap:break-word">${html}</p>`;
 }).join('');
 const count=answers.filter((a,i)=>a.some(x=>x.toLowerCase()===String(saved[i]||'').trim().toLowerCase())).length;
 app.innerHTML=card(`<h2>✍️ ${esc(data.title)}</h2><p>Setze die passenden englischen Vokabeln in die Lücken ein. Die Reihenfolge entspricht dem Arbeitsblatt. Beim erneuten Öffnen beginnt die Übung mit leeren Feldern.</p>${checked?`<p class="good"><strong>${count} von ${answers.length} richtig.</strong> Rote Lücken kannst du verbessern und erneut prüfen.</p>`:''}${body}${firstSummary('gap',n,saved,answers)}<div class="buttons">${btn('✅ Antworten prüfen','gapCheck')}${btn('🔄 Lücken leeren','gapClear','alt')}</div>`)+card(btn('Zur Lernübersicht','soloHome','alt'));
}
function gapCollect(){if(gapStation===null)return;gapSave(gapStation,Array.from(document.querySelectorAll('[data-gap]'),el=>el.value));}
function gapCheck(){if(gapStation===null)return;gapCollect();firstCapture('gap',gapStation,gapFields(gapStation),gapLoad(gapStation),GAP_SETS[gapStation].title);gapRender(gapStation,true);}
function gapClear(){if(gapStation===null)return;gapSave(gapStation,[]);gapRender(gapStation);}

// Grammar: Original order of normal exercises; no Diff corner.
// A blank item has prefix/suffix, accepted answers, and optional hint.
// Open sentences are self-checked against examples, not automatically marked wrong.

let grammarStation=null,grammarTask=null;
function grammarKey(st,task){return `vb2grammar_${soloName}_station${st+1}_task${task+1}`;}
function grammarRead(st,task){try{const v=JSON.parse(localStorage.getItem(grammarKey(st,task))||'[]');return Array.isArray(v)?v:[];}catch{return [];}}
function grammarWrite(st,task,v){localStorage.setItem(grammarKey(st,task),JSON.stringify(v));}
function grammarNormalize(v){return String(v||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');}
function grammarMenu(){grammarCollect();if(!soloName){soloChooseName();return;}grammarStation=null;grammarTask=null;app.innerHTML=card(`<h2>📘 Grammatik · ${esc(soloName)}</h2><p>Wähle Station 1 oder 2. Die Aufgaben stehen in der Reihenfolge des Arbeitsblatts. Ohne Diff corner.</p><div class="buttons">${btn('Station 1 · Aufgaben 1–4','grammarStation0')}${btn('Station 2 · Aufgaben 1–7','grammarStation1')}</div>`)+card(btn('Zur Lernübersicht','soloHome','alt'));}
function grammarStationMenu(st){grammarCollect();grammarStation=st;grammarTask=null;const s=GRAMMAR[st];app.innerHTML=card(`<h2>📘 ${esc(s.title)}</h2><p>Tippe die englischen Antworten selbst ein. Freie Sätze werden anhand von Beispielen selbst kontrolliert.</p>${s.tasks.map((t,i)=>`<div class="player"><strong>${esc(t.title)}</strong><div class="buttons">${btn('Aufgabe öffnen',`grammarTask${i}`)}</div></div>`).join('')}`)+card(btn('Zur Grammatik-Auswahl','grammarMenu','alt'));}
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
function grammarCheck(){if(grammarStation===null||grammarTask===null)return;grammarCollect();const t=GRAMMAR[grammarStation].tasks[grammarTask];firstCapture('grammar',grammarStation+'_'+grammarTask,t.items?.map(x=>x[2])||null,grammarRead(grammarStation,grammarTask),GRAMMAR[grammarStation].title+' · '+t.title);grammarRender(grammarStation,grammarTask,true);}
function grammarReveal(){if(grammarStation===null||grammarTask===null)return;grammarCollect();grammarRender(grammarStation,grammarTask,true,true);}
function grammarClear(){if(grammarStation===null||grammarTask===null)return;grammarWrite(grammarStation,grammarTask,[]);grammarRender(grammarStation,grammarTask);}

const key='vb2solo';
const SOLO_NAMES=['Luca','Semir','Talea','Nele'];
let soloName=localStorage.getItem('vb2solo_name')||'';
let dashboardUnsubscribe=null,soloHeartbeat=null;
function resetStamp(name,subject='english'){
 return Math.max(Number(resetState.all)||0,Number(resetState[name])||0,Number(resetState[`${subject}_${name}`])||0);
}
function clearLocalLearning(name,subject){
 const prefixes=subject==='math'?[`vb2math_${name}_battle_`]:[`vb2solo_${name}_battle_`,`vb2first_${name}_`,`vb2grammar_${name}_`,`vb2gap_${name}_`,`vb2listen_${name}_`,`vb2reading_${name}_`];
 for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&prefixes.some(p=>k.startsWith(p)))localStorage.removeItem(k);}
 if(subject==='math'&&mathName===name)mathRun=null;
 if(subject==='english'&&soloName===name){solo=null;listeningRun=null;stopSoloHeartbeat();grammarStation=null;grammarTask=null;gapStation=null;}
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
 }
 resetReady=true;
 if(activeMath&&mathName){mathHome();msg('Mathe-Lernstand zurückgesetzt. Englisch bleibt erhalten.');}
 else if(activeEnglish&&soloName){soloHome();msg('Englisch-Lernstand zurückgesetzt. Mathe bleibt erhalten.');}
}
function watchResets(){
 if(resetUnsubscribe){resetUnsubscribe();resetUnsubscribe=null;}
 resetReady=false;
 const refresh=()=>applyResetState({...resetSources.legacy,...Object.fromEntries(Object.entries(resetSources.english).map(([n,t])=>['english_'+n,t])),...Object.fromEntries(Object.entries(resetSources.math).map(([n,t])=>['math_'+n,t]))});
 const offs=[['learningResets','legacy'],['learningResetsEnglish','english'],['learningResetsMath','math']].map(([path,key])=>onValue(ref(db,path),snap=>{resetSources[key]=snap.val()||{};refresh();},e=>msg('Reset-Abgleich fehlgeschlagen: '+e.message,true)));
 resetUnsubscribe=()=>offs.forEach(fn=>fn());
}

function stopSoloHeartbeat(){if(soloHeartbeat!==null){clearInterval(soloHeartbeat);soloHeartbeat=null;}}
function startSoloHeartbeat(){stopSoloHeartbeat();soloHeartbeat=setInterval(()=>{if(solo&&soloName)void syncSolo();},30000);}
function stopDashboard(){if(dashboardUnsubscribe){dashboardUnsubscribe();dashboardUnsubscribe=null;}}
function stopClock(){if(clock!==null){clearInterval(clock);clock=null;}lastClockText='';}
function home(){gbStop();stopDashboard();stopSoloHeartbeat();if(unsubscribe){unsubscribe();unsubscribe=null;}stopClock();code='';role='';slot='';room=null;solo=null;listeningRun=null;readingRun=null;busy=false;previousStageKey='';status.textContent='';app.innerHTML=card(`<style>#app .home-actions{display:grid;grid-template-columns:1fr;gap:12px}#app .home-actions button{width:100%;min-height:56px}</style><h2>🎮 Gemeinsam spielen</h2><div class="home-actions">${btn('⚡ Vokabel-Battle','join')}${btn('🎧 Listening-Battle','joinListening')}${btn('📖 Reading-Battle','joinReading')}${btn('📘 Grammatik-Battle','gbJoinForm')}${btn('✍️ Writing-Battle','writingJoinForm')}</div><p class="muted">Wähle ein Battle und gib anschließend den Spielcode ein.</p>`)+card(`<h2>📚 Alleine lernen</h2><div class="home-actions">${btn('🇬🇧 Vokabeln, Grammatik & Listening lernen','solo')}${btn('📖 Reading lernen','readingSoloChoose')}${btn('✍️ Writing lernen','writingSoloChoose')}${btn('🔢 Mathe Klasse 7 NRW lernen','mathChoose')}</div>`);}
function listen(){if(unsubscribe)unsubscribe();stopClock();unsubscribe=onValue(ref(db,`rooms/${code}`),snap=>{room=snap.val();if(!room){msg('Raum nicht gefunden oder gelöscht.',true);return;}render();},e=>msg('Firebase-Zugriff verweigert: '+e.message,true));}
function current(){const m=room?.meta||{},b=Number(m.battle||1)-1;if(m.mode==='listening')return LISTENING_QUESTIONS[Number(m.index||0)];if(m.subject==='reading')return READING_QUIZ[Number(m.index||0)];return (m.subject==='math'?MATH_BATTLES:BATTLES)[b]?.[Number(m.index||0)%30];}
function roomQuestionCount(m=room?.meta||{}){return m.mode==='listening'?LISTENING_QUESTIONS.length:m.subject==='reading'?READING_QUIZ.length:30;}
function roomTitle(m=room?.meta||{}){return m.mode==='listening'?'Listening · Activity weekend in Cardiff':m.subject==='reading'?'Reading · A trip to Cardiff Castle':m.subject==='math'?`Mathe-Übung ${Number(m.battle||1)}`:`Englisch-Battle ${Number(m.battle||1)}`;}
function readingParagraphs(text){return text.split(/\n\s*\n/).map(p=>`<p style="line-height:1.65">${esc(p)}</p>`).join('');}
function readingIntroCard(language=readingBattleLanguage){const text=language==='de'?READING_TEXT_DE:READING_TEXT_EN;return `<h2>📖 Reading: A trip to Cardiff Castle</h2><p>Schaut euch das Bild an und lest den kurzen Text gemeinsam. Ihr könnt zwischen Englisch und Deutsch wechseln.</p><div class="buttons">${btn('🇬🇧 English','readingBattleEn',language==='en'?'':'alt')}${btn('🇩🇪 Deutsch','readingBattleDe',language==='de'?'':'alt')}</div>${READING_ILLUSTRATION}${readingParagraphs(text)}`;}
function players(){return Object.entries(room?.slots||{}).map(([id,p])=>({id,...p})).sort((a,b)=>(b.score||0)-(a.score||0));}
function roster(){return players().map((p,i)=>`<div class="player row"><span>${i+1}. ${esc(p.name)}</span><span class="score">${p.score||0}</span></div>`).join('')||'<p>Noch keine Spieler.</p>';}
function chooseBattle(){app.innerHTML=card(`<h2>🎮 Battle auswählen</h2><p>Welches Battle soll gespielt werden?</p><label>Battle<select id="battle-choice"><option value="1">Battle 1 – 30 Fragen</option><option value="2">Battle 2 – 30 Fragen</option><option value="3">Battle 3 – 30 Fragen</option></select></label>${btn('Raum erstellen','createRoom')}`)+card(btn('Zurück','home','alt'));}
function countdown(){const m=room?.meta||{};if(m.stage!=='question'&&m.stage!=='reveal')return '';const remaining=Math.max(0,Math.ceil((Number(m.deadline||0)-Date.now())/1000));return m.stage==='question'?`⏱️ Noch ${remaining} Sekunden`:`⏳ Weiter in ${remaining} Sekunden`;}
function render(){if(!room)return;const oldAudio=document.querySelector('#listening-room-audio'),oldAudioTime=oldAudio?.currentTime||0,wasPlaying=!!oldAudio&&!oldAudio.paused;const m=room.meta||{},q=current(),stage=m.stage||'lobby',total=roomQuestionCount(m),questionNumber=(m.mode==='listening'||m.subject==='reading')?Number(m.index||0)+1:Number(m.index||0)%30+1;const stageKey=`${m.battle}:${m.index}:${stage}`;let s=card(`<p class="muted">Raumcode</p><div class="big">${esc(code)}</div><p>${esc(roomTitle(m))} · ${stage==='lobby'?'Warteraum':stage==='question'?`Frage ${questionNumber} von ${total}`:stage==='reveal'?'Auswertung':'Battle beendet'}</p>${roster()}`);if(m.mode==='listening')s+=card(`<h3>🎧 Listening-Audio</h3><audio id="listening-room-audio" controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg">Audio kann in diesem Browser nicht abgespielt werden.</audio><p class="muted">Hört euch die Aufnahme an. Danach beantwortet ihr die Fragen.</p>`);if(m.subject==='reading'&&stage==='lobby')s+=card(readingIntroCard());
if(role==='host'){
if(stage==='lobby')s+=card(`<h2>Schiedsrichter</h2><p>${esc(roomTitle(m))} starten – ${total} Fragen mit je 15 Sekunden. Danach erscheint die Rangliste.</p>${btn('▶️ Battle starten','start')}`);
 if(stage==='question'){const a=room.answers?.[m.index]||{};s+=card(`<h2>Frage ${questionNumber} von ${total}</h2><p>${esc(q?.q||'')}</p><h2 id="countdown">${countdown()}</h2><p>Antworten: ${Object.keys(a).length} von ${players().length}</p><p class="muted">Automatische Auswertung nach 15 Sekunden</p>`);}
 if(stage==='reveal')s+=card(`<h2>Richtige Antwort</h2><p class="good">${esc(q?.options[q.correct]??'')}</p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card(`<h2>🏆 ${esc(roomTitle(m))} beendet!</h2><p>Rangliste nach ${total} Fragen:</p>${roster()}${btn('🔄 Neues Spiel','reset')}`);
 s+=card(btn('Zur Startseite','home','alt'));
}else{
 const myAnswer=room.answers?.[m.index]?.[uid];
 if(stage==='lobby')s+=card('<h2>Warteraum</h2><p>Warte, bis der Schiedsrichter das Battle startet.</p>');
 if(stage==='question'&&q){const answered=myAnswer!==undefined;s+=card(`<h2>${esc(q.q)}</h2><h2 id="countdown">${countdown()}</h2><div class="answers">${q.options.map((o,i)=>`<button ${answered||Date.now()>=Number(m.deadline||0)?'disabled':''} data-answer="${i}" class="${answered&&Number(myAnswer.choice)===i?'picked':''}">${esc(o)}</button>`).join('')}</div><p class="muted">${answered?'Antwort abgegeben. Warte auf die Auswertung.':'Wähle eine Antwort innerhalb von 15 Sekunden.'}</p>`);}
 if(stage==='reveal')s+=card(`<h2>Auflösung</h2><p>Richtig: <strong class="good">${esc(q?.options[q.correct]??'')}</strong></p><h2 id="countdown">${countdown()}</h2>`);
 if(stage==='finished')s+=card(`<h2>🏆 ${esc(roomTitle(m))} geschafft!</h2><p>Die Rangliste steht oben.</p>`);
 s+=card(btn('Zur Startseite','home','alt'));
}
app.innerHTML=s;if(m.mode==='listening'&&oldAudio){const nextAudio=document.querySelector('#listening-room-audio');if(nextAudio){nextAudio.currentTime=oldAudioTime;if(wasPlaying)nextAudio.play().catch(()=>{});}}
if(stageKey!==previousStageKey){previousStageKey=stageKey;lastClockText='';}
if(stage==='question'||stage==='reveal'){if(clock===null)clock=setInterval(tick,250);tick();}else stopClock();}
function tick(){if(!room)return;const m=room.meta||{},stage=m.stage;if(stage!=='question'&&stage!=='reveal'){stopClock();return;}const text=countdown();if(text!==lastClockText){const el=document.querySelector('#countdown');if(el)el.textContent=text;lastClockText=text;}if(stage==='question'&&Date.now()>=Number(m.deadline||0)){document.querySelectorAll('[data-answer]').forEach(el=>el.disabled=true);}if(role!=='host'||busy||!m.deadline||Date.now()<Number(m.deadline))return;if(stage==='question')void automaticReveal();else if(stage==='reveal')void automaticNext();}
async function makeRoom(){const battle=Number(document.querySelector('#battle-choice')?.value||1);if(!uid){msg('Verbindung wird hergestellt. Bitte kurz warten.',true);return;}code=String(Math.floor(100000+Math.random()*900000));role='host';slot='';try{await set(ref(db,`rooms/${code}/meta`),{hostUid:uid,stage:'lobby',battle,index:(battle-1)*30,createdAt:Date.now()});listen();}catch(e){msg('Raum konnte nicht erstellt werden: '+e.message,true);}}
function joinForm(listening=false,selectedName='',reading=false){app.innerHTML=card(`<h2>${listening?'🎧 Listening-Battle beitreten':reading?'📖 Reading-Battle beitreten':'⚡ Vokabel-Battle beitreten'}</h2><p>Gib den sechsstelligen Raumcode des Schiedsrichters ein.</p><label>Raumcode<input id="roomcode" inputmode="numeric" maxlength="6" placeholder="6-stelliger Code"></label><label>Dein Name<select id="playername">${names.map(n=>`<option>${n}</option>`).join('')}</select></label>${btn('Beitreten','enter')}`)+card(btn('Zurück','home','alt'));if(selectedName)document.querySelector('#playername').value=selectedName;}
async function enter(){const c=document.querySelector('#roomcode').value.trim(),name=document.querySelector('#playername').value;if(!uid){msg('Anmeldung läuft. Bitte kurz warten.',true);return;}if(!/^\d{6}$/.test(c)){msg('Bitte sechsstelligen Code eingeben.',true);return;}try{const snap=await get(ref(db,`rooms/${c}`));if(!snap.exists()){msg('Raumcode nicht gefunden.',true);return;}const r=snap.val();let s=Object.keys(r.slots||{}).find(k=>r.slots[k]?.name===name&&r.slots[k]?.uid===uid);if(!s){if(r.meta?.stage!=='lobby'){msg('Das Battle läuft bereits. Bitte einen neuen Raum im Warteraum öffnen.',true);return;}s=String(names.indexOf(name)+1);if(r.slots?.[s]){msg('Dieser Name ist schon vergeben. Bitte anderen Namen wählen.',true);return;}await set(ref(db,`rooms/${c}/slots/${s}`),{name,uid,score:0});}code=c;role='player';slot=s;listen();}catch(e){msg('Beitritt fehlgeschlagen: '+e.message,true);}}
async function automaticReveal(){if(busy||role!=='host'||!room||room.meta?.hostUid!==uid||room.meta.stage!=='question')return;busy=true;const battle=room.meta.battle,index=room.meta.index;try{const q=current();if(!q)throw new Error('Frage nicht gefunden');const ans=room.answers?.[index]||{};for(const p of players()){if(Number(ans[p.uid]?.choice)===q.correct){await runTransaction(ref(db,`rooms/${code}/slots/${p.id}/score`),x=>(Number(x)||0)+10);}}if(room?.meta?.battle===battle&&room?.meta?.index===index&&room?.meta?.stage==='question')await update(ref(db,`rooms/${code}/meta`),{stage:'reveal',deadline:Date.now()+REVEAL_MS});}catch(e){msg('Automatische Auswertung fehlgeschlagen: '+e.message,true);}finally{busy=false;}}
async function automaticNext(){if(busy||role!=='host'||!room||room.meta?.hostUid!==uid||room.meta.stage!=='reveal')return;busy=true;const m={...room.meta};try{if(m.mode==='listening'?Number(m.index)>=LISTENING_QUESTIONS.length-1:Number(m.index)%30>=29)await update(ref(db,`rooms/${code}/meta`),{stage:'finished',deadline:0});else {const nextIndex=Number(m.index)+1;await update(ref(db,`rooms/${code}/meta`),{stage:'question',index:nextIndex,battle:Number(m.battle),deadline:Date.now()+QUESTION_MS});}}catch(e){msg('Nächste Frage konnte nicht gestartet werden: '+e.message,true);}finally{busy=false;}}
async function hostAction(a){if(role!=='host'||!room||room.meta?.hostUid!==uid){msg('Nur der Schiedsrichter darf das.',true);return;}const m=room.meta,offset=m.mode==='listening'?0:(Number(m.battle)-1)*30;try{if(a==='start'){if(players().length<1){msg('Mindestens ein Spieler muss beitreten.',true);return;}await update(ref(db,`rooms/${code}/meta`),{stage:'question',index:offset,deadline:Date.now()+QUESTION_MS});}if(a==='reset'){await remove(ref(db,`rooms/${code}/answers`));for(const p of players())await set(ref(db,`rooms/${code}/slots/${p.id}/score`),0);await update(ref(db,`rooms/${code}/meta`),{stage:'lobby',battle:Number(m.battle),index:offset,deadline:0});}}catch(e){msg('Aktion fehlgeschlagen: '+e.message,true);}}
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
 const exercises=[0,1,2].map(b=>{const entries=mistakeRows(b,soloSaved(b)?.mistakes);return `<h3>Übung ${b+1}</h3>${entries.length?entries.map(x=>`<div class="player"><strong>${esc(x.word)}</strong> – ${esc(x.translation)}<p class="muted">${x.count}× falsch beantwortet</p></div>`).join(''):'<p class="muted">Noch keine Fehler erfasst.</p>'}`;}).join('');
 const grammar=GRAMMAR.map((st,si)=>`<h3>Grammatik · Station ${si+1}</h3>${st.tasks.map((t,ti)=>firstMistakeSection('grammar',si+'_'+ti,t.title,t.items?.map(x=>x[2])||null)).join('')}`).join('');
 const gaps=GAP_SETS.map((set,i)=>firstMistakeSection('gap',i,set.title,gapFields(i))).join('');
 app.innerHTML=card(`<h2>📕 ${esc(soloName)} · Meine Fehlerliste</h2><p>Alle Fehler aus den Vokabelübungen sowie die ersten kontrollierten Versuche bei Grammatik und Lückentexten. Grammatik- und Lückentextdaten sind nur auf diesem Gerät gespeichert.</p><h2>📖 Vokabelübungen</h2>${exercises}<h2>📘 Grammatik</h2>${grammar}<h2>✍️ Lückentexte</h2>${gaps}`)+card(btn('Zur Lernübersicht','soloHome','alt'));
}
function soloKey(b){return `${key}_${soloName}_battle_${b+1}`;}
function soloSave(){if(!solo)return;solo.updatedAt=Date.now();localStorage.setItem(soloKey(solo.battle),JSON.stringify(solo));void syncSolo();}
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
  await set(ref(db,`soloProgress/${device}/${name}/battle${currentSolo.battle+1}`),{
   name,battle:currentSolo.battle+1,done:currentSolo.index,
   correct:Math.floor(currentSolo.score/10),score:currentSolo.score,
   finished:!!currentSolo.finished,mistakes:cleanMistakes(currentSolo.mistakes),updatedAt:savedAt
  });
 }catch(e){msg('Online-Speicherung noch nicht möglich: '+e.message,true);}
}
function soloChooseName(){if(!resetReady){msg('Lernstände werden abgeglichen. Bitte kurz warten.',true);return;}stopSoloHeartbeat();app.innerHTML=card(`<h2>📚 Wer lernt gerade?</h2><p>Wähle deinen Namen, damit dein Lernfortschritt gespeichert werden kann.</p><div class="name-actions">${SOLO_NAMES.map((n,i)=>btn(esc(n),`soloName${i}`)).join('')}</div>`)+card(btn('Zurück','home','alt'));}
function soloSetName(i){soloName=SOLO_NAMES[i];localStorage.setItem('vb2solo_name',soloName);const target=soloDirectTarget;soloDirectTarget='';if(target==='reading'){readingMenu();return;}if(target==='writing'){writingMenu();return;}soloHome();}
function soloChooseFor(target){soloDirectTarget=target;soloChooseName();}
function soloHome(){
 grammarCollect();stopSoloHeartbeat();if(!soloName){soloChooseName();return;}solo=null;
 const listening=listenLoad(),listenDone=listening?.index||0;
 const battleCards=[0,1,2].map(b=>{const saved=soloSaved(b),done=saved?.index||0;const reviewing=saved&&!saved.finished&&saved.review&&saved.wrong.length;return `<div class="solo-game"><h3>Übung ${b+1}</h3><p>${done} von 30 Fragen erledigt${reviewing?` · 🔁 ${saved.wrong.length} Wörter üben`:''}${saved?.finished?' · abgeschlossen':''}</p><div class="buttons">${btn(saved?'Neu beginnen':'Starten',`soloStart${b}`)}${saved&&!saved.finished?btn('Fortsetzen',`soloResume${b}`,'alt'):''}</div></div>`;}).join('');
 app.innerHTML=card(`<h2>📚 ${esc(soloName)} · Englisch lernen</h2><p class="solo-note">Dein Lernstand wird auf diesem Handy gespeichert und mit der Live-Übersicht synchronisiert.</p><div class="solo-section"><h3>📖 Vokabeln lernen</h3>${battleCards}<h3>🧩 Vokabeln einsetzen</h3><p class="solo-note">Setze die passenden englischen Vokabeln in die Lücken ein.</p><div class="solo-actions">${btn('✍️ Lückentext 1 · Station 1','gap0')}${btn('✍️ Lückentext 2 · Station 2','gap1')}</div></div>`)+card(`<div class="solo-section"><h3>🎧 Listening</h3><div class="solo-game"><h3>Activity weekend in Cardiff</h3><p>${listenDone} von ${LISTENING_QUESTIONS.length} Fragen${listening?.finished?' · abgeschlossen':''}</p><div class="buttons">${btn(listening?'Neu beginnen':'Starten','listenStart')}${listening&&!listening.finished?btn('Fortsetzen','listenResume','alt'):''}</div></div></div>`)+card(`<div class="solo-section"><h3>📖 Reading</h3><div class="solo-game"><h3>A trip to Cardiff Castle</h3><p>${readingLoad()?.complete?'Abgeschlossen · ':''}Originaltext Englisch/Deutsch, Ankreuzaufgaben und Schreibaufgaben</p><div class="solo-actions">${btn('Reading lernen','readingMenu')}</div></div></div>`)+card(`<div class="solo-section"><h3>✍️ Writing</h3><div class="solo-game"><h3>Unit 2 · Sports, e-mail und article</h3><p>${WRITING_TASKS.filter(t=>writingLoad().complete?.[t.id]).length} von ${WRITING_TASKS.length} Aufgaben selbst geprüft</p><div class="solo-actions">${btn('Writing lernen','writingMenu')}</div></div></div>`)+card(`<div class="solo-section"><h3>📘 Grammatik</h3><p class="solo-note">Wähle Grammatik-Station 1 oder 2.</p><div class="solo-actions">${btn('Grammatik · Station 1 & 2','grammarMenu')}</div></div>`)+card(`<div class="solo-actions solo-utility">${btn('📕 Meine Fehlerliste','soloMistakes','alt')}${btn('Anderen Namen wählen','soloChangeName','alt')}</div>`)+card(btn('Zurück','home','alt'));
}
function soloStart(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}const previous=soloSaved(b);solo={battle:b,index:0,score:0,finished:false,wrong:[],review:false,reviewPos:0,mistakes:cleanMistakes(previous?.mistakes)};soloSave();soloQuestion();}
function soloResume(b){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}solo=soloSaved(b);if(!solo){soloStart(b);return;}void syncSolo();if(solo.finished)soloFinished();else soloQuestion();}
function soloQuestion(){if(!solo)return;startSoloHeartbeat();const b=solo.battle;
 if(!solo.review&&solo.index>=30){if(solo.wrong.length){solo.review=true;solo.reviewPos=0;soloSave();}else{soloFinished();return;}}
 if(solo.review&&!solo.wrong.length){soloFinished();return;}
 const i=solo.review?solo.wrong[solo.reviewPos]:solo.index,q=BATTLES[b]?.[i];
 if(!q){msg('Frage konnte nicht geladen werden.',true);return;}
 const title=solo.review?`🔁 Wiederholung · ${solo.wrong.length} Wörter offen`:`Frage ${solo.index+1}/30`;
 app.innerHTML=card(`<h2>${esc(soloName)} · Übung ${b+1}</h2><p>${title} · ${solo.score} Punkte</p><div class="bar"><div class="fill" style="width:${solo.index/30*100}%"></div></div><h2>${esc(q.q)}</h2><div class="answers">${q.options.map((o,j)=>`<button data-soloanswer="${j}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Lernübersicht','solo','alt'));
}
function soloAnswer(i){if(!solo||solo.finished)return;const reviewing=solo.review;const questionIndex=reviewing?solo.wrong[solo.reviewPos]:solo.index;
 const q=BATTLES[solo.battle]?.[questionIndex];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;
 // Sofort deaktivieren, damit Doppeltippen keine Fragen überspringt.
 document.querySelectorAll('[data-soloanswer]').forEach(el=>el.disabled=true);
 const ok=i===q.correct;
 if(!ok){solo.mistakes=cleanMistakes(solo.mistakes);solo.mistakes[questionIndex]=(solo.mistakes[questionIndex]||0)+1;}
 if(reviewing){if(ok){solo.wrong.splice(solo.reviewPos,1);if(solo.reviewPos>=solo.wrong.length)solo.reviewPos=0;}
 else if(solo.wrong.length>1)solo.reviewPos=(solo.reviewPos+1)%solo.wrong.length;
 }else{if(ok)solo.score+=10;else if(!solo.wrong.includes(questionIndex))solo.wrong.push(questionIndex);solo.index++;}
 soloSave();
 const remaining=solo.wrong.length;
 app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.options[q.correct])}</strong></p><p>Deine Punkte: ${solo.score} von 300</p>${reviewing?`<p>🔁 Noch ${remaining} ${remaining===1?'Wort':'Wörter'} zum Üben.</p>`:''}${btn('Weiter ➜','soloNext')}`);
}
function soloNext(){if(!solo)return;soloQuestion();}
function soloFinished(){if(!solo)return;stopSoloHeartbeat();solo.finished=true;solo.index=30;solo.wrong=[];solo.review=false;solo.reviewPos=0;soloSave();app.innerHTML=card(`<h2>🏆 Übung ${solo.battle+1} abgeschlossen!</h2><p>Alle Wörter wurden richtig geübt.</p><p class="score">${solo.score} von 300 Punkten</p>${btn('Übung wiederholen',`soloStart${solo.battle}`)}`)+card(btn('Andere Übung auswählen','solo','alt'));}
function listeningKey(){return `vb2listen_${soloName}_unit2`;}
function listenLoad(){try{const v=JSON.parse(localStorage.getItem(listeningKey())||'null');if(!v||!Number.isInteger(v.index)||v.index<0||v.index>LISTENING_QUESTIONS.length||!Number.isFinite(v.score))return null;v.mistakes=cleanMistakes(v.mistakes);return v;}catch{return null;}}
function listenSave(){if(!listeningRun||!soloName)return;listeningRun.updatedAt=Date.now();localStorage.setItem(listeningKey(),JSON.stringify(listeningRun));void syncListeningProgress();}
async function syncListeningProgress(){if(!db||!uid||!soloName||!listeningRun||!resetReady)return;const run=listeningRun,name=soloName,device=uid,savedAt=Number(run.updatedAt)||Date.now();try{const rs=await get(ref(db,'learningResets'));applyResetState(rs.val());if(!resetReady||listeningRun!==run||soloName!==name||savedAt<=resetStamp(name,'english'))return;await set(ref(db,`soloProgress/${device}/${name}/listeningUnit2`),{name,done:run.index,total:LISTENING_QUESTIONS.length,score:run.score||0,finished:!!run.finished,mistakes:cleanMistakes(run.mistakes),runId:run.runId,updatedAt:savedAt,timestamp:savedAt});listeningSyncWarned=false;}catch(e){if(!listeningSyncWarned){listeningSyncWarned=true;msg('Listening bleibt auf diesem Handy gespeichert; Online-Speicherung gerade nicht möglich.',true);}}}
function listenStart(){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}const old=listenLoad();listeningRun={index:0,score:0,finished:false,mistakes:cleanMistakes(old?.mistakes),runId:`solo-${Date.now()}`,updatedAt:Date.now()};listenSave();listenQuestion();}
function listenResume(){if(!resetReady){msg('Bitte kurz auf den Reset-Abgleich warten.',true);return;}listeningRun=listenLoad();if(!listeningRun){listenStart();return;}if(listeningRun.finished){listenFinish();return;}listenQuestion();}
function listenQuestion(){if(!listeningRun)return;if(listeningRun.index>=LISTENING_QUESTIONS.length){listenFinish();return;}const q=LISTENING_QUESTIONS[listeningRun.index];app.innerHTML=card(`<h2>🎧 ${esc(soloName)} · Listening</h2><p>Activity weekend in Cardiff · Frage ${listeningRun.index+1} von ${LISTENING_QUESTIONS.length} · ${listeningRun.score} Punkte</p><audio controls preload="none" style="width:100%"><source src="./rl3_track3.mp3" type="audio/mpeg">Dein Browser unterstützt die Audiowiedergabe nicht.</audio><p class="muted">Höre dir den Beitrag an und wähle die passende Antwort.</p><h3>${esc(q.q)}</h3><div class="answers">${q.options.map((o,i)=>`<button data-listenanswer="${i}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function listenAnswer(i){if(!listeningRun||listeningRun.finished)return;const q=LISTENING_QUESTIONS[listeningRun.index];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;document.querySelectorAll('[data-listenanswer]').forEach(el=>el.disabled=true);const correct=i===q.correct;if(correct)listeningRun.score+=10;else listeningRun.mistakes[listeningRun.index]=(listeningRun.mistakes[listeningRun.index]||0)+1;listeningRun.index++;listenSave();app.innerHTML=card(`<h2>${correct?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Antwort: <strong>${esc(q.options[q.correct])}</strong></p><p>${listeningRun.score} Punkte</p>${btn('Weiter ➜','listenNext')}`);}
function listenNext(){listenQuestion();}
function listenFinish(){if(!listeningRun)return;listeningRun.finished=true;listeningRun.index=LISTENING_QUESTIONS.length;listenSave();app.innerHTML=card(`<h2>🏆 Listening geschafft!</h2><p>Activity weekend in Cardiff</p><p class="score">${listeningRun.score} von ${LISTENING_QUESTIONS.length*10} Punkten</p>${btn('Listening wiederholen','listenStart')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}

// Reading sequence: original English story + German translation, worksheet choices, then writing.
const readingKey=()=>`vb2reading_${soloName}_cardiff`;
function readingLoad(){try{return JSON.parse(localStorage.getItem(readingKey())||'null');}catch{return null;}}
function readingSave(){if(readingRun){localStorage.setItem(readingKey(),JSON.stringify(readingRun));void syncReadingProgress();}}
async function syncReadingProgress(){if(!db||!uid||!soloName||!readingRun)return;const now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/readingCardiff`),{done:Math.min(READING_QUIZ.length,Number(readingRun.index)||0),total:READING_QUIZ.length,score:Number(readingRun.score)||0,writingDone:Math.min(READING_TEXT_TASKS.length,Number(readingRun.textIndex)||0),writingTotal:READING_TEXT_TASKS.length,finished:!!readingRun.complete,updatedAt:now,timestamp:now});}catch(e){msg('Reading bleibt auf diesem Gerät gespeichert; die Live-Übersicht konnte nicht aktualisiert werden: '+e.message,true);}}
function readingMenu(){if(!soloName){soloChooseName();return;}readingRun=null;const saved=readingLoad();app.innerHTML=card(`<h2>📖 Reading · A trip to Cardiff Castle</h2><p>Lies den Text zuerst auf Englisch und danach auf Deutsch. Danach folgen dieselben Aufgaben wie auf dem Arbeitsblatt: Überschriften zuordnen, Aussagen ankreuzen und zum Schluss schriftlich antworten.</p><p>${saved?.complete?'Zuletzt abgeschlossen · ':''}${saved?`${saved.score||0} von ${READING_QUIZ.length*10} Punkten`:'Noch nicht begonnen'}</p>${btn('Lesen und üben','readingIntro')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function readingIntro(){readingLanguage='en';readingIntroRender();}
function readingIntroRender(){const text=readingLanguage==='de'?READING_TEXT_DE:READING_TEXT_EN;app.innerHTML=card(`<h2>📖 A trip to Cardiff Castle</h2><p>Lies zuerst eine Fassung und wechsle dann zur anderen, bis du die Geschichte verstanden hast.</p><div class="buttons">${btn('🇬🇧 English','readingLangEn',readingLanguage==='en'?'':'alt')}${btn('🇩🇪 Deutsch','readingLangDe',readingLanguage==='de'?'':'alt')}</div>${READING_ILLUSTRATION}<div style="line-height:1.7">${text.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('')}</div>${btn('Weiter zu den Ankreuzaufgaben','readingStart')}`)+card(btn('Zur Reading-Auswahl','readingMenu','alt'));}
function readingStart(){readingRun={index:0,score:0,textIndex:0,textAnswers:[],complete:false,checked:false};readingSave();readingQuestion();}
function readingQuestion(){if(!readingRun)return;if(readingRun.index>=READING_QUIZ.length){readingTextTask();return;}const q=READING_QUIZ[readingRun.index],heading=q.type==='heading',num=readingRun.index+1,taskLabel=heading?'Aufgabe 1 · Match the headings':'Aufgabe 2 · Right, wrong or not in the text?';app.innerHTML=card(`<h2>📖 ${esc(soloName)} · Reading</h2><p>${taskLabel} · ${num} von ${READING_QUIZ.length} · ${readingRun.score} Punkte</p><h3>${esc(q.q)}</h3><p class="muted">${heading?'Ordne die Überschrift dem passenden Absatz zu. Ein Vorschlag bleibt übrig.':'Kreuze an: right, wrong oder not in the text.'}</p><div class="answers">${q.options.map((o,i)=>`<button data-readinganswer="${i}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Reading-Auswahl','readingMenu','alt'));}
function readingAnswer(i){if(!readingRun||readingRun.complete)return;const q=READING_QUIZ[readingRun.index];if(!q||!Number.isInteger(i)||i<0||i>=q.options.length)return;document.querySelectorAll('[data-readinganswer]').forEach(el=>el.disabled=true);const ok=i===q.correct;if(ok)readingRun.score+=10;readingRun.index++;readingRun.checked=false;readingSave();app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Nicht ganz'}</h2><p>Richtige Antwort: <strong>${esc(q.options[q.correct])}</strong></p><p>${readingRun.score} Punkte</p>${btn('Weiter ➜','readingNext')}`);}
function readingTextTask(){if(!readingRun)return;const i=readingRun.textIndex;if(i>=READING_TEXT_TASKS.length){readingFinish();return;}const task=READING_TEXT_TASKS[i],saved=String(readingRun.textAnswers[i]||'');app.innerHTML=card(`<h2>✍️ Reading · Schreibaufgabe ${i+1} von ${READING_TEXT_TASKS.length}</h2><p>${esc(task.q)}</p><textarea data-readingtext rows="5" maxlength="1200" placeholder="Schreibe deine Antwort hier …" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(saved)}</textarea>${readingRun.checked?`<div class="player"><strong>Musterlösung</strong><p style="white-space:pre-wrap">${esc(task.sample)}</p><p class="muted">Vergleiche deine Antwort mit den wichtigen Informationen.</p></div>${btn(i+1<READING_TEXT_TASKS.length?'Nächste Textaufgabe':'Reading beenden','readingTextNext')}`:btn('Antwort speichern und Musterlösung ansehen','readingTextCheck')}`)+card(btn('Zur Reading-Auswahl','readingMenu','alt'));}
function readingTextCheck(){const field=document.querySelector('[data-readingtext]');if(!readingRun||!field)return;readingRun.textAnswers[readingRun.textIndex]=field.value.trim();readingRun.checked=true;readingSave();readingTextTask();}
function readingTextNext(){if(!readingRun)return;readingRun.textIndex++;readingRun.checked=false;readingSave();readingTextTask();}
function readingNext(){if(!readingRun)return;readingQuestion();}
function readingFinish(){if(!readingRun)return;readingRun.complete=true;readingSave();app.innerHTML=card(`<h2>🏆 Reading geschafft!</h2><p>A trip to Cardiff Castle</p><p class="score">${readingRun.score} von ${READING_QUIZ.length*10} Punkten</p><p>Du hast alle Ankreuzaufgaben bearbeitet und deine Antworten mit den Musterlösungen verglichen.</p>${btn('Reading wiederholen','readingIntro')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}

const writingKey=()=>`vb2writing_${soloName}_unit2`;
function writingLoad(){try{return JSON.parse(localStorage.getItem(writingKey())||'null')||{texts:{},plans:{},checks:{},complete:{}};}catch{return {texts:{},plans:{},checks:{},complete:{}};}}
async function syncWritingProgress(s=writingLoad()){if(!db||!uid||!soloName)return;const done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length,now=Date.now();try{await set(ref(db,`soloProgress/${uid}/${soloName}/writingUnit2`),{done,total:WRITING_TASKS.length,completed:s.complete||{},currentTask:WRITING_TASKS[writingIndex]?.title||'',active:true,updatedAt:now,timestamp:now});}catch(e){msg('Writing bleibt auf diesem Gerät gespeichert; die Live-Übersicht konnte nicht aktualisiert werden: '+e.message,true);}}
function writingMenu(){if(!soloName){soloChooseFor('writing');return;}const s=writingLoad(),done=WRITING_TASKS.filter(t=>s.complete?.[t.id]).length;app.innerHTML=card(`<h2>✍️ Writing · Unit 2</h2><p>Du lernst drei Schreibaufgaben Schritt für Schritt: planen, schreiben, mit einem Beispiel vergleichen und selbst prüfen.</p><div class="player"><h3>💡 Adjektiv oder Adverb?</h3><p><strong>Adjektive</strong> beschreiben Dinge oder Personen: <em>a fast sport</em> (ein schneller Sport).</p><p><strong>Adverbien</strong> beschreiben, wie jemand etwas tut: <em>run quickly</em> (schnell laufen).</p><p>Oft kommt <strong>-ly</strong> dazu: careful → carefully, slow → slowly, easy → easily. Merke: fast → fast, hard → hard, good → well.</p><p><strong>Simple Present</strong> nutzt du für allgemeine Fakten und Artikel. <strong>Simple Past</strong> nutzt du für Marks vergangenen Ausflug: went, was, had, helped.</p></div><p>${done} von ${WRITING_TASKS.length} Aufgaben selbst geprüft</p>${WRITING_TASKS.map((t,i)=>`<div class="solo-game"><h3>${esc(t.title)} ${s.complete?.[t.id]?'✅':''}</h3><p>${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p>${btn(s.complete?.[t.id]?'Weiter üben':'Aufgabe öffnen',`writingOpen${i}`)}</div>`).join('')}`)+card(btn('Zur Englisch-Auswahl','soloHome','alt'));}
function writingOpen(i){writingIndex=i;writingModelVisible=false;writingRender();void syncWritingProgress();}
function writingRender(){const t=WRITING_TASKS[writingIndex],s=writingLoad(),text=String(s.texts?.[t.id]||''),plan=String(s.plans?.[t.id]||''),checks=s.checks?.[t.id]||[];app.innerHTML=card(`<h2>✍️ ${esc(t.title)}</h2><p><strong>Deine Aufgabe:</strong> ${esc(t.goal)}</p><p class="muted">${esc(t.focus)}</p><div class="player"><h3>So gehst du vor</h3><ol>${t.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><h3>Satzanfänge als Hilfe</h3>${t.frames.map(x=>`<p><code>${esc(x)}</code></p>`).join('')}</div>${t.id==='article'?`<label>Meine Mindmap / Stichpunkte<textarea data-writingplan rows="4" maxlength="1500" placeholder="Sportart · was ist daran toll? · was tut man? · was braucht man? · wie sollte man sein?" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(plan)}</textarea></label>`:''}<label>Dein Text<textarea data-writingtext rows="10" maxlength="5000" placeholder="Schreibe deinen eigenen Text hier …" style="width:100%;padding:12px;border-radius:10px;font:inherit">${esc(text)}</textarea></label><p class="muted">Dein Text wird auf diesem Gerät automatisch gespeichert.</p>${btn(writingModelVisible?'Musterlösung ausblenden':'Musterlösung ansehen','writingModel','alt')}${writingModelVisible?`<div class="player"><h3>Musterlösung</h3><p style="white-space:pre-wrap;line-height:1.6">${esc(t.model)}</p><p class="muted">Vergleiche die Ideen. Schreibe deine eigene Version.</p></div>`:''}<div class="player"><h3>Meine Checkliste</h3>${t.checklist.map((x,i)=>`<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0"><input type="checkbox" data-writingcheck="${i}" ${checks[i]?'checked':''} style="width:auto;margin-top:4px"> <span>${esc(x)}</span></label>`).join('')}</div>${btn(s.complete?.[t.id]?'Als noch offen markieren':'Ich habe geprüft – Aufgabe abschließen','writingComplete')}${writingIndex>0?btn('← Vorige Aufgabe',`writingOpen${writingIndex-1}`,'alt'):''}${writingIndex<WRITING_TASKS.length-1?btn('Nächste Aufgabe →',`writingOpen${writingIndex+1}`,'alt'):''}`)+card(btn('Zur Writing-Übersicht','writingMenu','alt'));}
function writingToggleComplete(){const t=WRITING_TASKS[writingIndex],s=writingLoad();s.complete=s.complete||{};if(s.complete[t.id])delete s.complete[t.id];else{if(!String(s.texts?.[t.id]||'').trim()){msg('Schreibe erst deinen Text und vergleiche ihn mit der Musterlösung.',true);return;}if((s.checks?.[t.id]||[]).filter(Boolean).length<t.checklist.length){msg('Prüfe alle Punkte in der Checkliste, bevor du die Aufgabe abschließt.',true);return;}s.complete[t.id]=true;}localStorage.setItem(writingKey(),JSON.stringify(s));void syncWritingProgress(s);writingRender();}
function readingBattleLanguageSet(language){readingBattleLanguage=language;if(room?.meta?.subject==='reading'&&room.meta.stage==='lobby')render();}

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
 const table=`<div style="overflow-x:auto;max-width:100%"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;min-width:490px;text-align:left"><thead><tr><th style="padding:10px 6px">Kind</th><th>Übung 1</th><th>Übung 2</th><th>Übung 3</th><th>Gesamt</th></tr></thead><tbody>${cells}</tbody></table></div>`;
 const detailRows=SOLO_NAMES.map(name=>{
  const records=[1,2,3].map(b=>latest[name+':battle'+b]);
  const last=records.filter(Boolean).sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0))[0];
  const recent=last&&now-Number(last.updatedAt||0)<90000;
  return `<details style="margin:12px 0;padding:12px;background:rgba(255,255,255,.06);border-radius:12px"><summary><strong>${esc(name)}</strong> ${recent?'🟢':'⚪'} · Details ansehen</summary>${records.map((v,i)=>`<p><strong>Übung ${i+1}:</strong> ${v?`${Math.min(30,Number(v.done)||0)}/30 erledigt · ${Number(v.correct)||0} richtig · ${Number(v.score)||0} Punkte · zuletzt ${v.updatedAt?new Date(v.updatedAt).toLocaleString('de-DE'):'–'}`:'Noch keine Online-Daten'}</p>`).join('')}</details>`;
 }).join('');
 app.innerHTML=card('<h2>📊 Live-Lernübersicht</h2><p>Alle vier Kinder auf einen Blick. In den Übungsspalten steht: erledigte Fragen / 30 · Punkte. 🟢 bedeutet Aktivität in den letzten 90 Sekunden.</p>'+table+'<p class="muted">Wische die Tabelle seitlich, um alle Spalten zu sehen.</p><h3>Einzelheiten</h3>'+detailRows)+card(btn('Zurück','home','alt'));
}
function showDashboard(){
 stopDashboard();stopSoloHeartbeat();
 app.innerHTML=card('<h2>📊 Live-Lernübersicht</h2><p>Online-Lernstände werden geladen …</p>')+card(btn('Zurück','home','alt'));
 if(!uid){msg('Bitte kurz warten, bis die Anmeldung abgeschlossen ist.',true);return;}
 dashboardUnsubscribe=onValue(ref(db,'soloProgress'),snap=>{renderDashboard(snap.val());},e=>msg('Lernübersicht konnte nicht geladen werden: '+e.message,true));
}

// === Mathe Klasse 7 NRW: rationale Zahlen ===
let mathName='',mathRun=null,mathView='';
const mathKey=(n,b)=>`vb2math_${n}_battle_${b+1}`;
function mathLoad(n,b){try{return JSON.parse(localStorage.getItem(mathKey(n,b))||'null');}catch{return null;}}
function mathSave(){if(!mathRun)return;mathRun.updatedAt=Date.now();localStorage.setItem(mathKey(mathName,mathRun.b),JSON.stringify(mathRun));void mathSync();}
async function mathSync(){
 if(!db||!uid||!mathRun||!mathName||!resetReady)return;
 const currentRun=mathRun,name=mathName,device=uid,savedAt=Number(mathRun.updatedAt)||0;
 try{
  const rs=await get(ref(db,'learningResets'));
  applyResetState(rs.val());
  if(!resetReady||mathRun!==currentRun||mathName!==name||savedAt<=resetStamp(name,'math'))return;
  await set(ref(db,`mathProgress/${device}/${name}/battle${currentRun.b+1}`),{done:currentRun.index,score:currentRun.score,mistakes:currentRun.mistakes,updatedAt:savedAt,finished:!!currentRun.finished});
 }catch(e){msg('Mathe online noch nicht verfügbar – der Fortschritt bleibt auf diesem Gerät gespeichert.',true);}
}
function mathChoose(){mathRun=null;app.innerHTML=card('<h2>🔢 Mathe · Klasse 7 NRW</h2><p>Rationale Zahlen – wer lernt?</p>'+SOLO_NAMES.map((n,i)=>btn(esc(n),`mathName${i}`)).join(''))+card(btn('Zur Fächerauswahl','home','alt'));}
function mathSetName(i){mathName=SOLO_NAMES[i];mathHome();}
function mathHome(){mathRun=null;const titles=['Zahlen vergleichen, addieren und subtrahieren','Multiplizieren und dividieren','Klammern und gemischte Rechnungen'];app.innerHTML=card(`<h2>🔢 Mathe · ${esc(mathName)}</h2><p>Klasse 7 · Rationale Zahlen</p>`+titles.map((t,b)=>{const s=mathLoad(mathName,b);return `<div class="player"><h3>Übung ${b+1}</h3><p>${esc(t)}</p><p>${s?.index||0}/30 Aufgaben · ${s?.score||0} Punkte</p>${btn('Neu beginnen',`mathStart${b}`)}${s&&!s.finished?btn('Fortsetzen',`mathResume${b}`,'alt'):''}</div>`;}).join('')+btn('📕 Meine Mathe-Fehlerliste','mathMistakes','alt'))+card(btn('Fach wechseln','home','alt'));}
function mathStart(b,resume=false){const s=resume?mathLoad(mathName,b):null;mathRun=s&&s.index>=0?s:{b,index:0,score:0,finished:false,mistakes:{}};mathSave();mathQuestion();}
function mathQuestion(){if(!mathRun)return;if(mathRun.index>=30){mathRun.finished=true;mathSave();app.innerHTML=card(`<h2>🏆 Mathe-Übung geschafft!</h2><p>${mathRun.score} von 300 Punkten</p>`+btn('Zur Übersicht','mathHome'));return;}const q=MATH_BATTLES[mathRun.b][mathRun.index];app.innerHTML=card(`<h2>🔢 Mathe-Übung ${mathRun.b+1}</h2><p>Aufgabe ${mathRun.index+1}/30 · ${mathRun.score} Punkte</p><h2>${esc(q.q)}</h2><div class="answers">${q.options.map((o,i)=>`<button data-mathanswer="${i}">${esc(o)}</button>`).join('')}</div>`)+card(btn('Zur Mathe-Übersicht','mathHome','alt'));}
function mathAnswer(i){if(!mathRun||mathRun.index>=30)return;const q=MATH_BATTLES[mathRun.b][mathRun.index],ok=i===q.correct;document.querySelectorAll('[data-mathanswer]').forEach(el=>el.disabled=true);if(ok)mathRun.score+=10;else mathRun.mistakes[mathRun.index]=(mathRun.mistakes[mathRun.index]||0)+1;mathRun.index++;mathSave();app.innerHTML=card(`<h2>${ok?'✅ Richtig!':'❌ Leider falsch'}</h2><p>Richtige Lösung: <strong>${esc(q.options[q.correct])}</strong></p><p>${mathRun.score} Punkte</p>`+btn('Weiter ➜','mathNext'));}
function mathMistakes(){const content=[0,1,2].map(b=>{const s=mathLoad(mathName,b),m=s?.mistakes||{};return `<h3>Übung ${b+1}</h3>`+(Object.keys(m).length?Object.entries(m).map(([i,c])=>`<p>${esc(MATH_BATTLES[b][Number(i)].q)} → <strong>${esc(MATH_BATTLES[b][Number(i)].options[MATH_BATTLES[b][Number(i)].correct])}</strong> · ${c}× falsch</p>`).join(''):'<p>Noch keine Fehler.</p>');}).join('');app.innerHTML=card(`<h2>📕 ${esc(mathName)} · Mathe-Fehlerliste</h2>${content}`)+card(btn('Zur Mathe-Übersicht','mathHome','alt'));}
function mathAction(v){if(v==='mathChoose')mathChoose();else if(v==='mathHome')mathHome();else if(v==='mathMistakes')mathMistakes();else if(v==='mathNext')mathQuestion();else if(/^mathName[0-3]$/.test(v))mathSetName(Number(v.slice(-1)));else if(/^mathStart[012]$/.test(v))mathStart(Number(v.slice(-1)));else if(/^mathResume[012]$/.test(v))mathStart(Number(v.slice(-1)),true);else return false;return true;}


// Grammatik-Battle: Originalaufgaben, Texteingaben und Bewertung durch den Schiedsrichter.
const GB_TIME=45000;
let gbCode='',gbRoom=null,gbOff=null,gbBusy=false,gbTimer=null;
const gbNorm=s=>String(s||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ');
const gbQuestions=st=>GRAMMAR[st].tasks.flatMap((t,ti)=> (t.items||t.open||[]).map((item,i)=>({task:ti,number:i+1,title:t.title,intro:t.intro||'',prompt:t.items?item[0]+' _____ '+item[1]:(t.prompts?.[i]||'Schreibe einen vollständigen englischen Satz.'),accepted:t.items?item[2]:null,example:t.open?.[i]||null})));
function gbStop(){if(gbOff){gbOff();gbOff=null;}if(gbTimer){clearInterval(gbTimer);gbTimer=null;}if(wbPlayerTimer){clearInterval(wbPlayerTimer);wbPlayerTimer=null;}gbRoom=null;gbCode='';wbDraft='';wbDraftIndex=-1;}
function gbListen(){if(gbOff)gbOff();gbOff=onValue(ref(db,`grammarRooms/${gbCode}`),s=>{gbRoom=s.val();if(!gbRoom){msg('Grammatik-Raum nicht gefunden.',true);return;}gbRender();},e=>msg('Grammatik-Battle: '+e.message,true));}
function gbPlayers(){return Object.entries(gbRoom?.slots||{}).map(([id,v])=>({id,...v})).sort((a,b)=>(b.score||0)-(a.score||0));}
function gbRanking(){return gbPlayers().map((p,i)=>`<div class="player row"><span>${i+1}. ${esc(p.name)}</span><strong>${p.score||0} P</strong></div>`).join('')||'<p>Warte auf Spieler.</p>';}
function gbClock(){if(!gbRoom||gbRoom.meta?.stage!=='question')return;const el=document.querySelector('#gb-clock');if(el)el.textContent='⏱️ '+Math.max(0,Math.ceil((Number(gbRoom.meta.deadline||0)-Date.now())/1000))+' Sekunden';}

function gbJoinForm(){app.innerHTML=card('<h2>🏆 Grammatik-Battle beitreten</h2><label>Raumcode<input id="gb-code" inputmode="numeric" maxlength="6" placeholder="6-stelliger Code"></label><label>Dein Name<select id="gb-name">'+names.map(n=>`<option>${n}</option>`).join('')+'</select></label>'+btn('Beitreten','gbJoin'))+card(btn('Zurück','home','alt'));}
function writingJoinForm(){app.innerHTML=card('<h2>✍️ Writing-Battle beitreten</h2><p>Gib den sechsstelligen Code ein, den der Schiedsrichter erstellt hat.</p><label>Raumcode<input id="gb-code" inputmode="numeric" maxlength="6" placeholder="6-stelliger Code"></label><label>Dein Name<select id="gb-name">'+names.map(n=>`<option>${n}</option>`).join('')+'</select></label>'+btn('Beitreten','writingJoin'))+card(btn('Zurück','home','alt'));}
async function gbJoin(writing=false){const c=document.querySelector('#gb-code')?.value.trim(),name=document.querySelector('#gb-name')?.value;if(!/^\d{6}$/.test(c)){msg('Bitte sechsstelligen Code eingeben.',true);return;}try{const s=await get(ref(db,`grammarRooms/${c}`));if(!s.exists()){msg('Raum nicht gefunden.',true);return;}const r=s.val();if(writing&&r.meta?.kind!=='writing'){msg('Dieser Raumcode gehört nicht zu einem Writing-Battle.',true);return;}const slot=String(names.indexOf(name)+1);if(r.slots?.[slot]?.uid!==uid&&r.slots?.[slot]){msg('Dieser Name ist bereits belegt.',true);return;}if(!r.slots?.[slot]){if(r.meta?.stage!=='lobby'){msg('Das Battle läuft bereits.',true);return;}await set(ref(db,`grammarRooms/${c}/slots/${slot}`),{uid,name,score:0});}gbStop();gbCode=c;gbListen();}catch(e){msg('Beitritt fehlgeschlagen: '+e.message,true);}}
function gbRender(){if(gbRoom?.meta?.kind==='writing'){wbChildRender();return;}const m=gbRoom.meta||{},qs=gbQuestions(Number(m.station||0)),q=qs[Number(m.index||0)],stage=m.stage;let out=card(`<h2>🏆 Grammatik · Station ${Number(m.station)+1}</h2><p>Raum ${esc(gbCode)} · ${stage==='finished'?'Fertig':`Aufgabe ${Number(m.index)+1} von ${qs.length}`}</p>${gbRanking()}`);
if(stage==='lobby')out+=card('<h3>Warteraum</h3><p>Warte auf den Schiedsrichter.</p>');
if(stage==='question'&&q){const mine=gbRoom.submissions?.[m.index]?.[uid],review=gbRoom.reviews?.[m.index]?.[uid];out+=card(`<h3>${esc(q.title)}</h3><p>${esc(q.intro)}</p><p><strong>${esc(q.prompt)}</strong></p><p id="gb-clock"></p>`+(mine?`<p>Deine Antwort: <strong>${esc(mine.text)}</strong></p><p>${review?(review.correct?'✅ 10 Punkte':'❌ 0 Punkte'):'Antwort abgegeben. Warte auf die Bewertung.'}</p>`:`<label>Deine Antwort<textarea id="gb-answer" rows="3" placeholder="Antwort selbst schreiben" spellcheck="false"></textarea></label>${btn('Antwort abgeben','gbSubmit')}`));}
if(stage==='finished')out+=card('<h2>🏆 Geschafft!</h2>'+gbRanking());
app.innerHTML=out+card(btn('Zur Startseite','home','alt'));if(gbTimer)clearInterval(gbTimer);if(stage==='question'){gbTimer=setInterval(gbClock,1000);gbClock();}}
async function gbSubmit(){const m=gbRoom?.meta;if(!m||m.stage!=='question'||gbRoom.submissions?.[m.index]?.[uid])return;const textValue=document.querySelector('#gb-answer')?.value.trim();if(!textValue){msg('Bitte zuerst eine Antwort eingeben.',true);return;}if(textValue.length>1200){msg('Antwort ist zu lang.',true);return;}try{await set(ref(db,`grammarRooms/${gbCode}/submissions/${m.index}/${uid}`),{text:textValue,at:Date.now()});}catch(e){msg('Antwort konnte nicht gespeichert werden: '+e.message,true);}}
function wbChildRender(){const m=gbRoom.meta||{},i=Number(m.index||0),q=WRITING_BATTLE[i],me=Object.values(gbRoom.slots||{}).find(p=>p.uid===uid),submitted=gbRoom.submissions?.[i]?.[uid],review=gbRoom.reviews?.[i]?.[uid];if(wbDraftIndex!==i){wbDraft='';wbDraftIndex=i;}else{const field=document.querySelector('[data-writing-battle]')?.value;if(field!==undefined)wbDraft=field;}let content='';if(m.stage==='lobby')content='<h3>Warteraum</h3><p>Du bist dabei. Warte, bis der Schiedsrichter startet.</p>';else if(m.stage==='question'&&q){content=`<h3>${esc(q.title)}</h3><p>${esc(q.prompt)}</p><p id="wb-player-clock"></p>`;if(submitted){content+='<p class="good">✅ Antwort abgeschickt. Warte auf die nächste Aufgabe.</p>';if(review)content+=`<p>${review.correct?'✅ Richtig – 10 Punkte':'Noch nicht ganz – diesmal keine Punkte'}</p>`;content+=`<div class="player"><strong>Deine Antwort</strong><p style="white-space:pre-wrap">${esc(submitted.text)}</p></div>`;}else content+='<label>Deine Antwort<textarea data-writing-battle rows="5" maxlength="1000" placeholder="Schreibe deinen englischen Satz oder Text hier …" style="width:100%;padding:12px;border-radius:10px;font:inherit">'+esc(wbDraft)+'</textarea></label><p class="muted">Prüfe Satzanfang, Zeitform und Adjektive/Adverbien.</p>'+btn('Antwort abschicken','writingSubmit');}else if(m.stage==='finished')content='<h3>🏁 Das Battle ist beendet</h3><p>Danke fürs Schreiben!</p>'+gbRanking();else content='<p>Warte auf den Schiedsrichter.</p>';app.innerHTML=card(`<h2>✍️ Writing-Battle · ${esc(me?.name||'')}</h2><p>Raumcode: <strong>${esc(gbCode)}</strong></p>${content}`)+card(btn('Zur Startseite','home','alt'));if(wbPlayerTimer)clearInterval(wbPlayerTimer);if(m.stage==='question'){wbPlayerTimer=setInterval(()=>{const el=document.querySelector('#wb-player-clock');if(el)el.textContent='⏱️ '+Math.max(0,Math.ceil((Number(m.deadline||0)-Date.now())/1000))+' Sekunden';},1000);}}
async function writingBattleSubmit(){const m=gbRoom?.meta;if(m?.kind!=='writing'||m.stage!=='question'||gbRoom.submissions?.[m.index]?.[uid])return;const textValue=document.querySelector('[data-writing-battle]')?.value.trim();if(!textValue){msg('Schreibe zuerst deine Antwort.',true);return;}if(Date.now()>Number(m.deadline||0)){msg('Die Schreibzeit ist abgelaufen.',true);return;}try{await set(ref(db,`grammarRooms/${gbCode}/submissions/${m.index}/${uid}`),{text:textValue,at:Date.now()});wbDraft='';}catch(e){msg('Antwort konnte nicht gespeichert werden: '+e.message,true);}}

document.addEventListener('click',e=>{const ga=e.target.closest('[data-action]')?.dataset.action;if(ga==='writingJoinForm'){writingJoinForm();return;}if(ga==='writingJoin'){void gbJoin(true);return;}if(ga==='writingSubmit'){void writingBattleSubmit();return;}if(ga==='gbJoinForm'){gbJoinForm();return;}if(ga==='gbJoin'){void gbJoin();return;}if(ga==='gbSubmit'){void gbSubmit();return;}const ma=e.target.closest('[data-mathanswer]');if(ma){mathAnswer(Number(ma.dataset.mathanswer));return;}const mathButton=e.target.closest('[data-action]');if(mathButton&&mathAction(mathButton.dataset.action))return;const a=e.target.closest('[data-action]'),ans=e.target.closest('[data-answer]'),sa=e.target.closest('[data-soloanswer]'),la=e.target.closest('[data-listenanswer]'),ra=e.target.closest('[data-readinganswer]');if(ans){answer(Number(ans.dataset.answer));return;}if(sa){soloAnswer(Number(sa.dataset.soloanswer));return;}if(la){listenAnswer(Number(la.dataset.listenanswer));return;}if(ra){readingAnswer(Number(ra.dataset.readinganswer));return;}if(!a)return;const v=a.dataset.action;if(v==='home')home();else if(v==='host'||v==='createRoom'||v==='dashboard'||v==='start'||v==='reset')return;else if(v==='joinVocab')joinForm(false,soloName);else if(v==='join')joinForm();else if(v==='joinListening')joinForm(true);else if(v==='joinReading')joinForm(false,'',true);else if(v==='readingBattleEn')readingBattleLanguageSet('en');else if(v==='readingBattleDe')readingBattleLanguageSet('de');else if(v==='enter')enter();else if(['start','reset'].includes(v))hostAction(v);else if(v==='solo')soloChooseName();else if(v==='readingSoloChoose')soloChooseFor('reading');else if(v==='writingSoloChoose')soloChooseFor('writing');else if(v==='dashboard')void showDashboard();else if(v==='soloChangeName')soloChooseName();else if(v==='soloMistakes')showMyMistakes();else if(v==='soloHome')soloHome();else if(v==='readingMenu')readingMenu();else if(v==='writingMenu')writingMenu();else if(v==='writingModel'){writingModelVisible=!writingModelVisible;writingRender();}else if(v==='writingComplete')writingToggleComplete();else if(/^writingOpen[0-2]$/.test(v))writingOpen(Number(v.slice(-1)));else if(v==='readingIntro')readingIntro();else if(v==='readingStart')readingStart();else if(v==='readingLangEn'){readingLanguage='en';readingIntroRender();}else if(v==='readingLangDe'){readingLanguage='de';readingIntroRender();}else if(v==='readingNext')readingNext();else if(v==='readingTextCheck')readingTextCheck();else if(v==='readingTextNext')readingTextNext();else if(v==='grammarMenu')grammarMenu();else if(v==='grammarStation0')grammarStationMenu(0);else if(v==='grammarStation1')grammarStationMenu(1);else if(/^grammarTask\d+$/.test(v)){const n=Number(v.slice(11));if(grammarStation!==null&&n<GRAMMAR[grammarStation].tasks.length)grammarRender(grammarStation,n);}else if(v==='grammarCheck')grammarCheck();else if(v==='grammarReveal')grammarReveal();else if(v==='grammarClear')grammarClear();else if(v==='grammarBack')grammarStationMenu(grammarStation);else if(v==='gap0')gapRender(0);else if(v==='gap1')gapRender(1);else if(v==='gapCheck')gapCheck();else if(v==='gapClear')gapClear();else if(/^soloName[0-3]$/.test(v))soloSetName(Number(v.slice(-1)));else if(/^soloStart[012]$/.test(v))soloStart(Number(v.slice(-1)));else if(/^soloResume[012]$/.test(v))soloResume(Number(v.slice(-1)));else if(v==='soloNext')soloNext();else if(v==='listenStart')listenStart();else if(v==='listenResume')listenResume();else if(v==='listenNext')listenNext();});
document.addEventListener('input',e=>{if(e.target.matches('[data-gap]'))gapCollect();if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.matches('[data-writing-battle]'))wbDraft=e.target.value;if(e.target.matches('[data-writingtext]')){const s=writingLoad(),t=WRITING_TASKS[writingIndex];s.texts=s.texts||{};s.texts[t.id]=e.target.value;localStorage.setItem(writingKey(),JSON.stringify(s));if(writingSyncTimer)clearTimeout(writingSyncTimer);writingSyncTimer=setTimeout(()=>void syncWritingProgress(s),900);}if(e.target.matches('[data-writingplan]')){const s=writingLoad(),t=WRITING_TASKS[writingIndex];s.plans=s.plans||{};s.plans[t.id]=e.target.value;localStorage.setItem(writingKey(),JSON.stringify(s));if(writingSyncTimer)clearTimeout(writingSyncTimer);writingSyncTimer=setTimeout(()=>void syncWritingProgress(s),900);}});
document.addEventListener('change',e=>{if(e.target.matches('[data-grammar]'))grammarCollect();if(e.target.hasAttribute('data-writingcheck')){const s=writingLoad(),t=WRITING_TASKS[writingIndex];s.checks=s.checks||{};s.checks[t.id]=s.checks[t.id]||[];s.checks[t.id][Number(e.target.dataset.writingcheck)]=e.target.checked;localStorage.setItem(writingKey(),JSON.stringify(s));}});
document.addEventListener('focusout',e=>{if(e.target.matches('[data-grammar]'))grammarCollect();});
window.addEventListener('pagehide',()=>grammarCollect());
home();try{const fb=initializeApp(firebaseConfig),auth=getAuth(fb);db=getDatabase(fb);onAuthStateChanged(auth,u=>{if(u){uid=u.uid;watchResets();}else{uid='';resetReady=false;if(resetUnsubscribe){resetUnsubscribe();resetUnsubscribe=null;}signInAnonymously(auth).catch(e=>msg('Anmeldung fehlgeschlagen: '+e.message,true));}});}catch(e){msg('Firebase-Konfiguration fehlerhaft: '+e.message,true);}
