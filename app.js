// VOCAB BATTLE 3.0 - geprüfte Ersatzdatei (JavaScript-Syntax mit Node geprüft)
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {getAuth,signInAnonymously,onAuthStateChanged,signInWithEmailAndPassword,signOut,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {getDatabase,ref,onValue,get,set,update,runTransaction,remove} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {LISTENING_QUESTIONS,LISTENING_TOTAL_POINTS,listeningIsCorrect,listeningControls,listeningAnswerValue,listeningTaskImage} from './listening-data.js?v=listening-worksheet-20261016c';
import {firebaseConfig} from './firebase-config.js';
import {BATTLES} from './questions.js';
import {MATH_BATTLES,MATH_EXAM_BATTLE,MATH_RATIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_EXAM_BATTLE,MATH_PROPORTIONAL_CLASSWORKS,MATH_PROPORTIONAL_PRACTICE_BLOCKS} from './math-questions.js?v=proportional-uebungsbloecke-20261015b';
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
const RATIONAL_MATH_TITLES=['Rationale Zahlen · Aufgabe 1','Rationale Zahlen · Aufgabe 2','Rationale Zahlen · Aufgabe 3','Rationale Zahlen · Aufgabe 4'];
import {FRACTION_MODULES} from './fractions-data.js?v=20261014-probetest';
import {GRAMMAR} from './grammar-data.js';
import {READING_TEXT_EN,READING_TEXT_DE,READING_ILLUSTRATION,READING_QUIZ,READING_TEXT_TASKS} from './reading-data.js';
import {WRITING_TASKS,WRITING_BATTLE} from './writing-data.js';

const app=document.querySelector('#app'),status=document.querySelector('#status');
const names=['Luca','Semir','Talea','Nele'];
const VOCAB_QUESTION_MS=20000,OTHER_QUESTION_MS=15000,REVEAL_MS=3000;
let db,uid='',code='',role='',slot='',room=null,unsubscribe=null,solo=null;
let clock=null,busy=false,previousStageKey='',lastClockText='';
let readingRun=null,readingLanguage='en',readingBattleLanguage='en';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(t,fn,cl='')=>`<button type="button" ${cl?`class="${cl}"`:''} data-action="${fn}">${t}</button>`;
const card=s=>`<section class="card">${s}</section>`;
const msg=(s,bad=false)=>{status.innerHTML=`<p class="${bad?'error':'good'}">${esc(s)}</p>`;if(bad)requestAnimationFrame(()=>status.scrollIntoView({behavior:'smooth',block:'center'}));};
const key='vb2solo';
let resetState={};
const ADMIN_UID='M41x9WNoHAfqpSmyrztAgf2IZYC3';
let authClient=null,adminLoggedIn=false,authStateReady=false,manualAuthSubmit=false,pendingBattleStart='';let refereeRoomCreating=false;
async function refreshRefereeSession(){const user=authClient?.currentUser;if(!user||user.uid!==ADMIN_UID)throw Object.assign(new Error('Die gespeicherte Schiedsrichter-Anmeldung ist nicht verfügbar.'),{code:'AUTH_REQUIRED'});await user.getIdToken();uid=user.uid;adminLoggedIn=true;authStateReady=true;}
function loginForm(){app.innerHTML=card(`<h2>🔐 Schiedsrichter-Anmeldung</h2><p>Nur das berechtigte Schiedsrichterkonto kann Spiele starten und die Lernübersicht öffnen.</p><label>E-Mail<input id="admin-email" type="email" autocomplete="username" placeholder="E-Mail-Adresse"></label><label>Passwort<input id="admin-password" type="password" autocomplete="current-password" placeholder="Passwort"></label>${btn('Anmelden','adminLogin')}`)+card(btn('Zurück','home','alt'));}
function launchPendingBattleStart(action){if(action==='vocab-work'){void vocabWorkBattleCreate();return true;}if(action==='vocab-work-station2'){void vocabWorkStation2BattleCreate();return true;}if(action==='grammar-station-1'){void gbCreate(0);return true;}if(action==='grammar-station-2'){void gbCreate(1);return true;}return false;}
function waitForBattleAuth(action){pendingBattleStart=action;status.textContent='';app.innerHTML=card('<h2>⏳ Anmeldung wird geprüft …</h2><p>Der ausgewählte Warteraum öffnet sich automatisch.</p>');if(authClient?.currentUser){authClient.currentUser.getIdToken().then(()=>{if(pendingBattleStart!==action)return;authStateReady=true;uid=authClient.currentUser?.uid||'';adminLoggedIn=uid===ADMIN_UID;if(adminLoggedIn){pendingBattleStart='';launchPendingBattleStart(action);}else loginForm();}).catch(e=>{loginForm();msg('Anmeldung konnte nicht geprüft werden: '+e.message,true);});}}
async function adminLogin(){const email=document.querySelector('#admin-email')?.value.trim(),password=document.querySelector('#admin-password')?.value;if(!email||!password){msg('Bitte E-Mail und Passwort eingeben.',true);return;}manualAuthSubmit=true;try{await setPersistence(authClient,browserLocalPersistence);const cred=await signInWithEmailAndPassword(authClient,email,password);if(cred.user.uid!==ADMIN_UID){await signOut(authClient);adminLoggedIn=false;manualAuthSubmit=false;msg('Dieses Konto ist nicht als Schiedsrichter berechtigt.',true);return;}uid=cred.user.uid;adminLoggedIn=true;authStateReady=true;const pending=pendingBattleStart;pendingBattleStart='';if(!launchPendingBattleStart(pending)){home();msg('Schiedsrichter erfolgreich angemeldet.');}manualAuthSubmit=false;}catch(e){manualAuthSubmit=false;msg('Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen. '+e.code,true);}}
async function adminLogout(){try{await signOut(authClient);adminLoggedIn=false;uid='';home();}catch(e){msg('Abmeldung fehlgeschlagen: '+e.message,true);}}

const SOLO_NAMES=['Luca','Semir','Talea','Nele'];
let activitySyncWarned=false;
function activityPeriodKeys(timestamp=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp)).map(x=>[x.type,x.value]));
 const date=new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day))),isoDay=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()+4-isoDay);
 const isoYear=date.getUTCFullYear(),yearStart=new Date(Date.UTC(isoYear,0,1)),week=Math.ceil((((date-yearStart)/86400000)+1)/7);
 return {dayKey:`${parts.year}-${parts.month}-${parts.day}`,weekKey:`${isoYear}-W${String(week).padStart(2,'0')}`};
}
async function recordLearningActivity(name,exercise,increment=true){if(!db||!uid||!SOLO_NAMES.includes(name)||!exercise)return;const now=Date.now(),{dayKey,weekKey}=activityPeriodKeys(now);try{await runTransaction(ref(db,`learningActivity/${uid}/${name}/${exercise}`),current=>{const value=current&&typeof current==='object'?{...current}:{};if(value.dayKey!==dayKey){value.dayKey=dayKey;value.dayCount=0;}if(value.weekKey!==weekKey){value.weekKey=weekKey;value.weekCount=0;}if(increment){value.dayCount=(Number(value.dayCount)||0)+1;value.weekCount=(Number(value.weekCount)||0)+1;}value.lastAt=now;return value;});activitySyncWarned=false;}catch(e){if(!activitySyncWarned){activitySyncWarned=true;msg('Tages- und Wochenzählung wartet auf die Firebase-Regeln.',true);}}}
function touchLearningActivity(name,exercise){void recordLearningActivity(name,exercise,false);}
function mathActivityId(b){return b<3?`math_rational_battle${b+1}`:'';}
let soloName=localStorage.getItem('vb2solo_name')||'';
let dashboardUnsubscribe=null,soloHeartbeat=null;
let liveChildFilter=localStorage.getItem('vb_live_child_filter')||'all';
let liveDashboardSubject=localStorage.getItem('vb_live_dashboard_subject')==='math'?'math':'english';
let liveDashboardData={english:{},math:{},activity:{},series:{}};
let resetBusy=false;
let readingSyncWarned=false;
function stopSoloHeartbeat(){if(soloHeartbeat!==null){clearInterval(soloHeartbeat);soloHeartbeat=null;}}
function startSoloHeartbeat(){stopSoloHeartbeat();soloHeartbeat=setInterval(()=>{if(solo&&soloName)void syncSolo();},30000);}
function stopDashboard(){if(dashboardUnsubscribe){dashboardUnsubscribe();dashboardUnsubscribe=null;}}
function stopClock(){if(clock!==null){clearInterval(clock);clock=null;}lastClockText='';}
function home(){gbStop();wbStop();stopDashboard();stopSoloHeartbeat();if(unsubscribe){unsubscribe();unsubscribe=null;}stopClock();code='';role='';slot='';room=null;solo=null;busy=false;previousStageKey='';status.textContent='';const styles=`<style>
#app .home-layout{display:grid;gap:14px}
#app .home-block{padding:14px;background:linear-gradient(145deg,rgba(24,34,68,.98),rgba(13,18,43,.98));border:1px solid rgba(89,168,255,.65);border-radius:17px;box-shadow:0 0 16px rgba(57,116,255,.15)}
#app .home-block h3{margin:0 0 11px;font-size:18px;color:#fff;text-shadow:0 0 12px rgba(48,239,255,.25)}
#app .home-referee-block{border-color:rgba(48,239,255,.68);box-shadow:0 0 18px rgba(48,239,255,.14)}
#app .home-start-battles{border-color:rgba(255,66,208,.56);box-shadow:0 0 18px rgba(255,66,208,.13)}
#app .home-math-block{border-color:rgba(255,228,94,.58);box-shadow:0 0 18px rgba(255,155,69,.12)}
#app .home-battle-grid,#app .home-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#app .home-layout button{width:100%;min-width:0;min-height:62px;padding:11px 9px;line-height:1.2;white-space:normal;overflow-wrap:anywhere;font-size:clamp(14px,3.8vw,17px);font-weight:800;border:1px solid rgba(255,255,255,.35);border-radius:14px}
#app .home-layout button:focus-visible{outline:3px solid #ff42d0;outline-offset:3px}
#app .home-referee-block [data-action="dashboard"]{background:linear-gradient(135deg,#fff078,#ffb94e);color:#201638;box-shadow:0 0 13px rgba(255,228,94,.24)}
#app .home-referee-block [data-action="englishSeries"]{background:linear-gradient(135deg,#9a4de8,#4f35b5);color:#fff;box-shadow:0 0 13px rgba(173,103,255,.27)}
#app .home-referee-block [data-action="grammarSeries"]{background:linear-gradient(135deg,#087f91,#124c83);color:#fff;border:1px solid #30efff;box-shadow:0 0 13px rgba(48,239,255,.27)}
#app .home-referee-block [data-action="adminLogout"]{background:linear-gradient(135deg,#182955,#111b3b);color:#f8f7ff;border-color:#30efff;box-shadow:0 0 12px rgba(48,239,255,.18)}
#app .home-math-block>[data-action]{display:block;margin:11px 0;border-radius:14px}
#app .home-math-block>[data-action]:last-child{margin-bottom:2px}
#app .home-math-block>[data-action="fractionBattleChoose"]{background:linear-gradient(135deg,#fff078,#ff9b45);color:#201638}
#app .home-math-block>[data-action="mathHost"]{background:linear-gradient(135deg,#1e4dff,#202050);color:#fff;border-color:#30efff}
#app .home-math-block>[data-action="mathExamChoose"]{background:linear-gradient(135deg,#ff42cf,#6311aa);color:#fff;border-color:#ff9bea}
#app .home-battle-grid [data-action="host"]{background:linear-gradient(135deg,#1e4dff,#202050);color:#fff;border-color:#30efff}
#app .home-battle-grid [data-action="gbChoose"]{background:linear-gradient(135deg,#9a4de8,#4f35b5);color:#fff;border-color:#d5a8ff}
#app .home-battle-grid [data-action="listenBattleChoose"]{background:linear-gradient(135deg,#087f91,#124c83);color:#fff;border-color:#30efff}
#app .home-battle-grid [data-action="readingBattleChoose"]{background:linear-gradient(135deg,#08775c,#15513f);color:#fff;border-color:#55f0a8}
#app .home-battle-grid [data-action="writingBattleChoose"]{background:linear-gradient(135deg,#ff8a47,#d93473);color:#fff;border-color:#ffc07b}
#app .home-tools-grid [data-action="join"]{background:linear-gradient(135deg,#fff078,#ffb94e);color:#201638}
#app .home-tools-grid [data-action="solo"]{background:linear-gradient(135deg,#9a4de8,#4f35b5);color:#fff}
#app .home-tools-grid [data-action="mathChoose"]{background:linear-gradient(135deg,#087f91,#124c83);color:#fff;border-color:#30efff}
#app .home-tools-grid [data-action="join"]{grid-column:1/-1}
#app .home-battle-grid [data-action="readingBattleChoose"],#app .home-battle-grid [data-action="writingBattleChoose"]{grid-column:1/-1}
@media(max-width:380px){#app .home-layout{gap:11px}#app .home-block{padding:12px}#app .home-battle-grid,#app .home-tools-grid{gap:8px}#app .home-layout button{min-height:58px;padding:10px 7px;font-size:14px}}
#app .home-layout{gap:18px}
#app .home-block{position:relative;isolation:isolate;overflow:hidden;padding:clamp(16px,4vw,22px);background:radial-gradient(circle at 100% 0,rgba(89,168,255,.13),transparent 42%),linear-gradient(145deg,rgba(28,39,76,.99),rgba(13,18,43,.99));border:1px solid rgba(137,177,255,.48);border-radius:22px;box-shadow:0 14px 30px rgba(0,0,0,.24),0 0 18px rgba(57,116,255,.13)}
#app .home-block::before{content:"";position:absolute;z-index:-1;inset:0 0 auto;height:3px;background:linear-gradient(90deg,#30efff,#3974ff,#ad67ff,#ff42d0,#ffe45e)}
#app .home-referee-block{border-color:rgba(48,239,255,.62);box-shadow:0 14px 30px rgba(0,0,0,.22),0 0 20px rgba(48,239,255,.11)}
#app .home-referee-block::before{background:linear-gradient(90deg,#30efff,#3974ff,#ad67ff)}
#app .home-start-battles{border-color:rgba(255,66,208,.5);box-shadow:0 14px 30px rgba(0,0,0,.22),0 0 20px rgba(255,66,208,.1)}
#app .home-start-battles::before{background:linear-gradient(90deg,#ff42d0,#ad67ff,#ff9b45)}
#app .home-math-block{border-color:rgba(255,228,94,.48);box-shadow:0 14px 30px rgba(0,0,0,.22),0 0 20px rgba(255,228,94,.09)}
#app .home-math-block::before{background:linear-gradient(90deg,#ffe45e,#ff9b45,#ff42d0)}
#app .home-block h3{display:flex;align-items:center;gap:9px;margin:0 0 8px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.1);font-size:clamp(19px,5vw,23px);letter-spacing:.15px}
#app .home-subtitle{margin:0 0 14px;color:#c7d5f1;font-size:14px;line-height:1.45}
#app .home-layout button{min-height:66px;padding:13px 12px;border-radius:16px;font-size:clamp(15px,4vw,18px);letter-spacing:.1px;box-shadow:0 7px 16px rgba(3,7,25,.23),inset 0 1px 0 rgba(255,255,255,.28)}
#app .home-layout button:hover{transform:translateY(-2px);filter:brightness(1.06)}
#app .home-referee-block [data-action="englishSeries"]{background:linear-gradient(135deg,#a856ef,#633ac4);border-color:#d5a8ff;box-shadow:0 7px 18px rgba(115,62,199,.27)}
#app .home-referee-block [data-action="grammarSeries"]{background:linear-gradient(135deg,#12a9bc,#2855bb);border-color:#6ef4ff;box-shadow:0 7px 18px rgba(20,153,197,.25)}
#app .home-battle-grid [data-action="host"]{background:linear-gradient(135deg,#3264ff,#213a9c);box-shadow:0 7px 17px rgba(50,100,255,.25)}
#app .home-battle-grid [data-action="gbChoose"]{background:linear-gradient(135deg,#a856ef,#633ac4);box-shadow:0 7px 17px rgba(168,86,239,.23)}
.22)}
#app .home-battle-grid [data-action="listenBattleChoose"]{background:linear-gradient(135deg,#10b6c5,#17618f);box-shadow:0 7px 17px rgba(16,182,197,.2)}
#app .home-battle-grid [data-action="readingBattleChoose"]{background:linear-gradient(135deg,#20b881,#14664f);box-shadow:0 7px 17px rgba(32,184,129,.2)}
#app .home-battle-grid [data-action="writingBattleChoose"]{background:linear-gradient(135deg,#ff9947,#d94a72);box-shadow:0 7px 17px rgba(255,153,71,.2)}
@media(max-width:380px){#app .home-layout{gap:13px}#app .home-block{padding:14px}#app .home-layout button{min-height:60px;padding:11px 8px;font-size:14px}}

#app .home-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}
#app .home-block{position:relative;isolation:auto;overflow:hidden;min-width:0;padding:clamp(18px,2vw,24px);background:#172235;border:1px solid #34445b;border-radius:18px;box-shadow:0 8px 22px rgba(0,0,0,.16)}
#app .home-block::before{height:3px;background:#6a879d}
#app .home-referee-block{grid-column:1/-1;border-color:#426775;box-shadow:0 8px 22px rgba(0,0,0,.16)}#app .home-referee-block::before{background:#67d8d0}
#app .home-start-battles::before{background:#8c9fb2}#app .home-math-block::before{background:#b9a7f5}#app .home-layout>.home-block:nth-child(4){grid-column:1/-1}
#app .home-block h3{display:flex;align-items:center;gap:9px;margin:0 0 10px;padding:0 0 12px;border-bottom:1px solid #34445b;font-size:clamp(19px,2.2vw,22px);letter-spacing:0;text-shadow:none}
#app .home-subtitle{margin:0 0 16px;color:#b8c4d5;font-size:15px;line-height:1.5}
#app .home-layout button{width:100%;min-width:0;min-height:56px;padding:12px 15px;border:1px solid #4b637b;border-radius:13px;background:#263750!important;color:#f5f7fb!important;box-shadow:none!important;font-size:15px;font-weight:750;letter-spacing:0;line-height:1.35;white-space:normal;overflow-wrap:anywhere;transform:none}
#app .home-layout button:hover:not(:disabled){background:#30445f!important;border-color:#83a0bc!important;filter:none;box-shadow:0 5px 14px rgba(0,0,0,.18)!important;transform:translateY(-1px)}
#app .home-referee-block [data-action="dashboard"],#app .home-referee-block [data-action="adminForm"]{background:#286f72!important;border-color:#68c9c1!important;color:#fff!important}
#app .home-referee-block [data-action="dashboard"]:hover,#app .home-referee-block [data-action="adminForm"]:hover{background:#318285!important}
#app .home-battle-grid,#app .home-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#app .home-math-block>[data-action]{display:block;margin:10px 0}#app .home-math-block>[data-action]:last-child{margin-bottom:0}
#app .home-tools-grid [data-action="join"]{grid-column:1/-1}
@media(max-width:700px){#app .home-layout{grid-template-columns:1fr;gap:13px}#app .home-referee-block,#app .home-layout>.home-block:nth-child(4){grid-column:auto}#app .home-block{padding:16px;border-radius:16px}#app .home-battle-grid,#app .home-tools-grid{gap:9px}#app .home-layout button{min-height:54px;padding:11px 10px;font-size:14px}}
</style>`;app.innerHTML=card(`${styles}<h2>Was möchtest du machen?</h2><div class="home-layout">${adminLoggedIn?`<section class="home-block home-referee-block"><h3>🎮 Schiedsrichter</h3><p class="home-subtitle">Live-Spiele im Blick behalten und Ergebnisse ansehen.</p>${btn('📊 Live-Übersicht öffnen','dashboard')}${btn('🏆 Tages- & Wochenwertung','refereeDailyWeekly')}${btn('🇬🇧 Englisch · Battle-Auswertung','battleSeriesEnglish')}${btn('🔢 Mathe · Battle-Auswertung','battleSeriesMath')}${btn('Abmelden','adminLogout','alt')}</section>`:`<section class="home-block home-referee-block"><h3>🎮 Schiedsrichter</h3><p class="home-subtitle">Live-Spiele im Blick behalten und Ergebnisse ansehen.</p>${btn('🔐 Schiedsrichter anmelden','adminForm')}</section>`}<section class="home-block home-start-battles"><h3>⚔️ Battle starten</h3><p class="home-subtitle">Wähle eine Spielart und starte einen neuen Raum.</p><div class="home-battle-grid">${btn('🇬🇧 Vokabel-Battle','host')}${btn('📝 Vokabelarbeit-Battle · Station 1 · Seiten 1 + 2','vocabWorkHomeStart')}${btn('🩹 Vokabelarbeit-Battle · Station 2 · Seiten 1 + 2','vocabWorkStation2HomeStart')}${btn('🏆 Grammatik-Battle · Station 1','gbHomeStation1')}${btn('🏆 Grammatik-Battle · Station 2','gbHomeStation2')}${btn('🎧 Listening-Battle','listenBattleChoose')}${btn('📖 Reading-Battle','readingBattleChoose')}${btn('✍️ Writing-Battle','writingBattleChoose')}</div></section><section class="home-block home-math-block"><h3>🔢 Mathe-Battle</h3><p class="muted">Mathe-Battle auswählen und einen Raum starten.</p>${btn('1️⃣ Bruchrechnung-Battle starten','fractionBattleChoose')}${btn('2️⃣ Rationale-Zahlen-Battle starten','mathHost')}${btn('3️⃣ Proportional-/Antiproportional-Klassenarbeit starten','mathExamChoose')}</section>${!adminLoggedIn?`<section class="home-block"><h3>👥 Mitspielen und lernen</h3><p class="home-subtitle">Alleine üben oder einem laufenden Battle beitreten.</p><div class="home-tools-grid">${btn('Spiel beitreten','join')}${btn('🇬🇧 Englisch','solo')}${btn('🔢 Mathe Klasse 7 NRW','mathChoose')}</div></section>`:''}</div>`)+card(`<p class="muted">${adminLoggedIn?'Battles startest du unter „Battle starten“. Die Live-Übersicht ist hier beim Schiedsrichter.':'Der Schiedsrichter startet die Battles. Du kannst mit einem Raumcode beitreten oder alleine lernen.'}</p>`);}
function listen(){if(unsubscribe)unsubscribe();stopClock();unsubscribe=onValue(ref(db,`rooms/${code}`),snap=>{room=snap.val();if(!room){msg('Raum nicht gefunden oder gelöscht.',true);return;}render();},e=>msg('Firebase-Zugriff verweigert: '+e.message,true));}
function current(){const m=room?.meta||{},b=Number(m.battle||1)-1,i=Number(m.index||0)%30;if(m.mode==='math-exam')return MATH_PROPORTIONAL_CLASSWORKS[0].questions[Number(m.index||0)%MATH_PROPORTIONAL_CLASSWORKS[0].questions.length];if(m.mode==='fractions'){const questions=FRACTION_MODULES[b]?.questions||[];return questions[Number(m.index||0)%Math.max(questions.length,1)];}if(m.mode==='reading')return READING_QUIZ[Number(m.index||0)];if(m.mode==='listening')return LISTENING_QUESTIONS[Number(m.index||0)];return (m.subject==='math'?MATH_BATTLES:BATTLES)[b]?.[i];}
async function awardRoomPointsOnce(roomPath,slotId,questionKey,points){const scoreRef=ref(db,`${roomPath}/slots/${slotId}`);const result=await runTransaction(scoreRef,current=>{if(!current||!current.uid)return;const awarded={...(current.awarded||{})},key=String(questionKey);if(awarded[key])return current;awarded[key]=true;return {...current,score:(Number(current.score)||0)+(Number(points)||0),awarded};});return result.committed;}
function roomQuestionCount(m=room?.meta||{}){return m.mode==='math-exam'?MATH_PROPORTIONAL_CLASSWORKS[0].questions.length:m.mode==='fractions'?(FRACTION_MODULES[Number(m.battle||1)-1]?.questions.length||0):m.mode==='reading'?READING_QUIZ.length:m.mode==='listening'?LISTENING_QUESTIONS.length:30;}
function roomTitle(m=room?.meta||{}){const n=Number(m.battle||1);return m.mode==='math-exam'?'Proportional / Antiproportional · Klassenarbeit 1':m.mode==='fractions'?FRACTION_MODULES[n-1]?.title||'Bruchrechnung':m.mode==='reading'?'Reading · A trip to Cardiff Castle':m.mode==='listening'?'Listening · Activity weekend in Cardiff':m.subject==='math'?RATIONAL_MATH_TITLES[n-1]||RATIONAL_MATH_TITLES[0]:`Englisch-Battle ${n}`;}
function questionDurationMs(m=room?.meta||{}){return m.mode==='listening'?60000:m.mode==='vocab'||(!m.mode&&m.subject!=='math')?VOCAB_QUESTION_MS:OTHER_QUESTION_MS;}
function questionDurationSeconds(m=room?.meta||{}){return Math.round(questionDurationMs(m)/1000);}
function battleOffset(m=room?.meta||{}){return m.mode==='math-exam'||m.mode==='fractions'||m.mode==='reading'||m.mode==='listening'?0:(Number(m.battle||1)-1)*30;}
function updateBattleChoices(){const subject=document.querySelector('#subject-choice')?.value||'english',select=document.querySelector('#battle-choice');if(!select)return;const opts=subject==='reading'?[['1','Reading · A trip to Cardiff Castle · 13 Fragen']]:subject==='listening'?[['1','Listening · Activity weekend in Cardiff · 21 Fragen']]:subject==='math'?[['1',`${RATIONAL_MATH_TITLES[0]} · 30 Fragen`],['2',`${RATIONAL_MATH_TITLES[1]} · 30 Fragen`],['3',`${RATIONAL_MATH_TITLES[2]} · 30 Fragen`]]:[['1','Battle 1 · 30 Fragen'],['2','Battle 2 · 30 Fragen'],['3','Battle 3 · 30 Fragen']];select.innerHTML=opts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');}
function players(){return Object.entries(room?.slots||{}).map(([id,p])=>({id,...p})).sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0));}
function rankByScore(entries,scoreOf=row=>Number(row.score)||0){const sorted=[...entries].sort((a,b)=>scoreOf(b)-scoreOf(a)||String(a.name||'').localeCompare(String(b.name||''),'de'));let place=0,lastScore;return sorted.map((row,index)=>{const score=scoreOf(row);if(index===0||score!==lastScore)place=index+1;lastScore=score;const tied=(index>0&&scoreOf(sorted[index-1])===score)||(index+1<sorted.length&&scoreOf(sorted[index+1])===score);return {row,place,tied,points:pointsForRank(place,tied)};});}
function pointsForRank(place,tied=false){return battleBonusPoints(place);}
function isEnglishSeriesRoom(m=room?.meta||{}){return m.subject==='english'&&(m.mode==='vocab'||!m.mode)&&Number(m.battle)>=1&&Number(m.battle)<=3;}
function battleBonusPoints(place){return [10,8,5,3][Number(place)-1]||0;}
function englishSeriesPoints(place,tied=false){return battleBonusPoints(place);}
function isoWeekDays(weekKey){const match=String(weekKey||'').match(/^(\d{4})-W(\d{2})$/);if(!match)return [];const year=Number(match[1]),week=Number(match[2]),jan4=new Date(Date.UTC(year,0,4)),weekday=jan4.getUTCDay()||7,monday=new Date(Date.UTC(year,0,4-(weekday-1)+(week-1)*7));return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()+i);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;});}
function previousIsoWeek(weekKey){const first=isoWeekDays(weekKey)[0];if(!first)return '';const d=new Date(`${first}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-7);return activityDateKeys(d.getTime()).weekKey;}
function dailyRowTotals(row){
 const entries=Object.values(row?.progressByExercise||{});
 const progress=entries.reduce((sum,item)=>sum+Math.max(0,Math.floor(Number(item?.count)||0)),0);
 const stored=Math.max(Number(row?.attempts)||0,(Number(row?.checkedAttempts)||0)+(Number(row?.submittedAttempts)||0));
 if(stored>=1000 && entries.length)return {attempts:progress,checkedAttempts:progress,mistakes:Math.min(progress,Math.max(0,Number(row?.mistakes)||0))};
 if(stored>=1000)return {attempts:0,checkedAttempts:0,mistakes:0};
 const hasProgress=entries.length>0,verified=Number(row?.answerCounterVersion)===2;
 const hasChecked=Object.prototype.hasOwnProperty.call(row||{},'checkedAttempts')&&Number.isFinite(Number(row.checkedAttempts))&&Number(row.checkedAttempts)>=0;
 const trusted=verified||hasChecked;
 const checkedAttempts=Math.max(0,Number(trusted?row?.checkedAttempts:row?.attempts)||0);
 const submittedAttempts=verified?Math.max(0,Number(row?.submittedAttempts)||0):0;
 const mistakes=Math.min(checkedAttempts,Math.max(0,Number(row?.mistakes)||0));
 return {attempts:checkedAttempts+submittedAttempts,checkedAttempts,mistakes};
}

