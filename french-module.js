import { firebaseConfig } from "./firebase-config.js?v=20261016-kinder-dependency-cache-bust-2";

const frenchWords = [
  { image: "👋", fr: "Salut !", de: "Hallo! / Tschüss!", fa: ["Salut", "Bonjour", "Au revoir"], da: ["Hallo", "Tschüss", "Hi", "Tschau"] },
  { image: "🙂", fr: "Ça va ?", de: "Wie geht’s? / Geht’s?", fa: ["Ça va", "Comment ça va"], da: ["Wie gehts", "Gehts", "Wie geht es", "Geht es", "Wie geht es dir"] },
  { image: "😊", fr: "Ça va.", de: "Es geht. / Ganz gut.", fa: ["Ça va", "Ça va bien", "Je vais bien"], da: ["Es geht", "Ganz gut", "Gut", "Alles gut", "Mir gehts gut"] },
  { image: "😐", fr: "Bof.", de: "Na ja. / Geht so.", fa: ["Bof", "Comme ci comme ça", "Pas très bien"], da: ["Na ja", "Geht so", "So lala", "Nicht so gut", "Nicht besonders"] },
  { image: "👋", fr: "À plus !", de: "Bis später!", fa: ["À plus", "À bientôt"], da: ["Bis später", "Bis dann", "Bis bald"] },
  { image: "👉", fr: "Et toi ?", de: "Und du?", fa: ["Et toi", "Et vous"], da: ["Und du", "Und dir"] },
  { image: "🧍", fr: "Tu t'appelles comment ?", de: "Wie heißt du?", fa: ["Tu t'appelles comment", "Comment tu t'appelles"], da: ["Wie heißt du", "Wie heisst du", "Wie ist dein Name"] },
  { image: "🙋", fr: "Je m'appelle…", de: "Ich heiße …", fa: ["Je m'appelle", "Je m'appelle…", "Je m'appelle ..."], da: ["Ich heiße", "Ich heiße …", "Ich heiße ...", "Ich heisse"] },
  { image: "🎂", fr: "J'ai … ans.", de: "Ich bin … Jahre alt.", fa: ["J'ai … ans", "J'ai ... ans", "J'ai ans"], da: ["Ich bin Jahre alt", "Ich bin … Jahre alt", "Ich bin ... Jahre alt"] },
  { image: "🏠", fr: "Tu habites où ?", de: "Wo wohnst du?", fa: ["Tu habites où", "Où habites-tu"], da: ["Wo wohnst du", "Wo lebst du"] },
  { image: "🏡", fr: "J'habite…", de: "Ich wohne …", fa: ["J'habite", "J'habite…", "J'habite ...", "Je vis"], da: ["Ich wohne", "Ich wohne …", "Ich wohne ...", "Ich lebe"] },
  { image: "🏫", fr: "Tu es en cinquième ?", de: "Bist du in der 7. Klasse?", fa: ["Tu es en cinquième", "Es-tu en cinquième"], da: ["Bist du in der 7 Klasse", "Bist du in der siebten Klasse", "Gehst du in die 7 Klasse", "Gehst du in die siebte Klasse"] },
  { image: "🧑‍🏫", fr: "Oui, je suis en cinquième A. / Non, je suis en…", de: "Ja, ich bin in der 7A. / Nein, ich bin in der …", fa: ["Oui je suis en cinquième A Non je suis en", "Oui je suis en cinquième A", "Non je suis en"], da: ["Ja ich bin in der 7A Nein ich bin in der", "Ja ich bin in der 7A", "Nein ich bin in der"] },
  { image: "🇩🇪", fr: "allemand", de: "Deutsch / deutsche Sprache", fa: ["allemand", "l'allemand"], da: ["Deutsch", "deutsche Sprache", "Deutsch als Sprache"] },
  { image: "🗣️", fr: "Je parle…", de: "Ich spreche …", fa: ["Je parle", "Je parle…", "Je parle ..."], da: ["Ich spreche", "Ich spreche …", "Ich spreche ..."] },
  { image: "🗣️❓", fr: "Tu parles quelles langues ?", de: "Welche Sprachen sprichst du?", fa: ["Tu parles quelles langues", "Quelles langues parles-tu"], da: ["Welche Sprachen sprichst du", "Welche Sprachen kannst du sprechen", "Was sprichst du für Sprachen"] },
  { image: "😄", fr: "Super !", de: "Super!", fa: ["Super", "Génial", "Cool"], da: ["Super", "Klasse", "Prima"] },
  { image: "👏", fr: "C'est super !", de: "Das ist toll!", fa: ["C'est super", "C'est génial", "C'est top"], da: ["Das ist toll", "Das ist super", "Das ist klasse"] },
  { image: "👍", fr: "Ah, d'accord.", de: "Ach so. / Aha, verstanden.", fa: ["Ah d'accord", "D'accord", "OK", "Ah je vois"], da: ["Ach so", "Aha verstanden", "Verstanden", "Aha", "Alles klar", "Okay"] },
  { image: "🔔", fr: "Ah, ça sonne !", de: "Oh, es klingelt!", fa: ["Ah ça sonne", "Ça sonne"], da: ["Oh es klingelt", "Es klingelt", "Es läutet", "Die Klingel läutet"] },
];

const root = document.querySelector("#app");
const names = ["Luca", "Talea", "Nele"];
let currentName = localStorage.getItem("vb2solo_name");
let run;
let firebasePromise;

async function firebaseContext() {
  if (!firebasePromise) {
    firebasePromise = (async () => {
      const [appModule, authModule, databaseModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js"),
      ]);
      const app = appModule.getApps()[0] || appModule.initializeApp(firebaseConfig);
      const auth = authModule.getAuth(app);
      if (!auth.currentUser) await authModule.signInAnonymously(auth);
      return { auth, database: databaseModule.getDatabase(app), databaseModule };
    })();
  }
  return firebasePromise;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function card(content) { return `<section class="card">${content}</section>`; }
function button(label, action, extra = "") { return `<button data-french-action="${action}" ${extra}>${label}</button>`; }
function key() { return `vb_french_unit1_${currentName || "guest"}`; }
function save() { try { localStorage.setItem(key(), JSON.stringify(run)); } catch {} }
function normalize(value) {
  return String(value || "").toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/œ/g, "oe").replace(/ß/g, "ss").replace(/['’]/g, "").replace(/[!?.,:;…"\/|]/g, " ").replace(/\s+/g, " ").trim();
}
function periodKeys(timestamp) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(timestamp)).map((item) => [item.type, item.value]));
  const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const week = Math.ceil((((date - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
  return { dayKey: `${parts.year}-${parts.month}-${parts.day}`, weekKey: `${year}-W${String(week).padStart(2, "0")}` };
}
async function syncActivity(newSession = false) {
  if (!run || !currentName || !names.includes(currentName)) return;
  const now = Date.now();
  run.sessionId ||= String(now);
  try {
    const { auth, database, databaseModule } = await firebaseContext();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const path = `learningActivity/${uid}/${currentName}/french_vocab_unit1`;
    const prompts = run.queue.map((item) => {
      const q = question(item);
      return `${q.direction}: ${q.source}`;
    });
    const draftAnswers = Array(run.total).fill("");
    const answerChecks = {};
    for (const entry of run.answers) {
      draftAnswers[entry.position] = entry.answer;
      answerChecks[String(entry.position)] = {
        attempted: true,
        correct: entry.correct,
        submittedAnswer: entry.answer,
        prompt: prompts[entry.position],
        accepted: [question(run.queue[entry.position]).target],
        updatedAt: entry.updatedAt,
      };
    }
    const { dayKey, weekKey } = periodKeys(now);
    const live = {
      taskTitle: "Französisch · Unité 1",
      done: run.answers.length,
      total: run.total,
      status: run.completed ? "Runde abgeschlossen · online gespeichert" : "In Bearbeitung · live gespeichert",
      draftAnswers,
      draftPrompts: prompts,
      draftUpdatedAt: run.answers.map((entry) => entry.updatedAt),
      updatedAt: now,
    };
    await databaseModule.runTransaction(databaseModule.ref(database, path), (current) => {
      const value = current && typeof current === "object" ? { ...current } : {};
      if (value.dayKey !== dayKey) { value.dayKey = dayKey; value.dayCount = 0; }
      if (value.weekKey !== weekKey) { value.weekKey = weekKey; value.weekCount = 0; }
      if (newSession) { value.dayCount = (Number(value.dayCount) || 0) + 1; value.weekCount = (Number(value.weekCount) || 0) + 1; }
      value.lastAt = now;
      value.live = live;
      value.answerChecks = answerChecks;
      value.errorItems = { ...(value.errorItems || {}) };
      for (const entry of run.answers) {
        if (entry.correct) {
          for (const item of Object.values(value.errorItems)) {
            if (item.vocabIndex === entry.index && item.direction === entry.direction && !item.resolved) {
              item.resolved = true;
              item.resolvedAt = entry.updatedAt;
            }
          }
          continue;
        }
        const index = `${run.sessionId}_${entry.position}`;
        const previous = value.errorItems[index];
        value.errorItems[index] = { subject: "french", topic: "Französisch · Unité 1", prompt: prompts[entry.position], submittedAnswer: entry.answer, answer: question(run.queue[entry.position]).target, vocabIndex: entry.index, direction: entry.direction, count: (Number(previous?.count) || 0) + 1, lastWrongAt: entry.updatedAt, dayKey, weekKey };
      }
      value.sessions = Array.isArray(value.sessions) ? [...value.sessions] : [];
      const session = { sessionId: run.sessionId, startedAt: run.startedAt || now, lastAt: now, live };
      const sessionIndex = value.sessions.findIndex((item) => item.sessionId === run.sessionId);
      if (sessionIndex >= 0) value.sessions[sessionIndex] = session;
      else value.sessions.push(session);
      value.sessions = value.sessions.slice(-100);
      return value;
    });
  } catch (error) {
    console.warn("Französische Lernaktivität konnte nicht synchronisiert werden:", error);
  }
}
function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
function ensureEntryButton() {
  const homeCard = [...root.querySelectorAll(".card")].find((item) => item.querySelector("h2")?.textContent.includes("Alleine lernen"));
  const actions = homeCard?.querySelector(".name-actions");
  if (!actions || actions.querySelector("[data-french-entry]")) return;
  const entry = document.createElement("button");
  entry.type = "button";
  entry.className = "french-learn-action";
  entry.textContent = "🇫🇷 Französisch · Unité 1";
  entry.dataset.frenchEntry = "true";
  entry.style.cssText = "width:100%;min-height:56px;background:#ffd27d;color:#382b13";
  entry.addEventListener("click", open);
  actions.append(entry);
  if(!actions.querySelector("[data-map-entry]")){
    const map=document.createElement("button");map.type="button";map.className="french-learn-action";
    map.textContent="🗺️ Karte · Frankreich";map.dataset.mapEntry="true";
    map.style.cssText="width:100%;min-height:56px;background:linear-gradient(135deg,#087f91,#124c83);color:#fff";
    map.addEventListener("click",()=>{pendingDestination="map";if(!names.includes(currentName)){chooseName();return;}mapMenu();});actions.append(map);
  }
}
new MutationObserver(ensureEntryButton).observe(root, { childList: true, subtree: true });
ensureEntryButton();

let pendingDestination = "unit1";
function open() {
  pendingDestination = "unit1";
  if (!names.includes(currentName)) { chooseName(); return; }
  try { run = JSON.parse(localStorage.getItem(key()) || "null"); } catch { run = null; }
  menu();
}
function chooseName() {
  root.innerHTML = card(`<h2>🇫🇷 Wer lernt Französisch?</h2><p>Wähle deinen Namen.</p><div class="buttons">${names.map((name) => `<button data-french-action="name" data-name="${name}">${name}</button>`).join("")}</div>`) + card(button("Zur Startseite", "home", 'class="alt"'));
}
function menu() {
  const last = run?.completed ? `<p class="muted">Letzte Runde: ${run.correct} von ${run.total} richtig${run.wrongItems?.length ? ` · ${run.wrongItems.length} zum Wiederholen` : ""}.</p>` : "";
  const resume = run && !run.completed ? button(`▶️ Runde fortsetzen · Aufgabe ${run.position + 1} von ${run.total}`, "resume") : "";
  root.innerHTML = card(`<h2>🇫🇷 Französisch · Unité 1</h2><p>${esc(currentName)} · Begrüßen, sich vorstellen, Schule und Sprachen.</p><p>Schreibe die Übersetzung selbst. Jedes Wort erscheint mit seinem passenden Bild. Bei „Gemischt“ kommen alle 20 Vokabeln in beiden Richtungen vor.</p>${last}<div class="solo-actions">${resume}${button("✍️ Französisch → Deutsch", "start-fr-de")}${button("✍️ Deutsch → Französisch", "start-de-fr")}${button("🔁 Gemischt üben · 40 Aufgaben", "start-both")}${button("📖 Vokabeln mit Bildern ansehen", "list")}</div>`) + card(`<div class="solo-actions">${button("Anderen Namen wählen", "pick-name", 'class="alt"')}${button("Zur Startseite", "home", 'class="alt"')}</div>`);
}
function start(mode, reviewItems) {
  const queue = reviewItems ? shuffle(reviewItems) : shuffle(frenchWords.flatMap((word, index) => mode === "both" ? [{ index, direction: "fr-de" }, { index, direction: "de-fr" }] : [{ index, direction: mode }]));
  run = { mode, queue, position: 0, correct: 0, total: queue.length, wrongItems: [], answers: [], completed: false, draft: "", feedback: null, startedAt: Date.now(), sessionId: String(Date.now()) };
  void syncActivity(true);
  save(); render();
}
function question(item) {
  const word = frenchWords[item.index];
  const frenchToGerman = item.direction === "fr-de";
  return { word, source: frenchToGerman ? word.fr : word.de, target: frenchToGerman ? word.de : word.fr, accepted: frenchToGerman ? [word.de, ...word.da] : [word.fr, ...word.fa], direction: frenchToGerman ? "Französisch → Deutsch" : "Deutsch → Französisch" };
}
function flexibleCompletion(index, direction, answer) {
  const text = normalize(answer);
  const patterns = direction === "fr-de"
    ? {
      7: /^(?:ich heisse|mein name ist) .+$/,
      8: /^ich bin (?:\d{1,2}|zehn|elf|zwolf|dreizehn|vierzehn|funfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig)(?: jahre(?: alt)?)?$/,
      10: /^(?:ich wohne|ich lebe) .+$/,
      12: /^(?:ja ich bin in der 7 ?a|nein ich bin in der .+)$/,
      14: /^(?:ich spreche|ich rede) .+$/
    }
    : {
      7: /^(?:je m ?appelle|mon nom est) .+$/,
      8: /^j ?ai (?:\d{1,2}|onze|douze|treize|quatorze|quinze|seize|dix sept|dix huit|dix neuf|vingt)(?: ans)?$/,
      10: /^(?:j ?habite|je vis) .+$/,
      12: /^(?:oui je suis en (?:cinquieme|5e) a|non je suis en .+)$/,
      14: /^je parle .+$/
    };
  return patterns[index]?.test(text) || false;
}
function render() {
  if (run.completed) {
    const retry = run.wrongItems.length ? button(`🔁 Fehler noch einmal schreiben (${run.wrongItems.length})`, "review") : "";
    root.innerHTML = card(`<h2>🇫🇷 Runde geschafft!</h2><p>${esc(currentName)} · ${run.correct} von ${run.total} richtig.</p>${run.wrongItems.length ? "<p>Schreibe die noch falschen Wörter noch einmal.</p>" : "<p>Alle Übersetzungen waren richtig. Sehr gut!</p>"}<div class="solo-actions">${retry}${button("Neue gemischte Runde", "start-both")}${button("Zur Französisch-Auswahl", "menu", 'class="alt"')}</div>`) + card(button("Zur Startseite", "home", 'class="alt"'));
    return;
  }
  const item = run.queue[run.position];
  const q = question(item);
  const feedback = run.feedback
    ? `<section class="solo-game"><p class="${run.feedback.correct ? "good" : "error"}">${run.feedback.correct ? "✅ Richtig!" : "❌ Noch nicht ganz."}</p><p>Richtige Übersetzung: <strong>${esc(q.target)}</strong></p>${button("Weiter", "next")}</section>`
    : `<label style="display:block;margin-top:14px">Deine Übersetzung<input data-french-answer autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(run.draft)}" style="display:block;width:100%;min-height:50px;margin-top:6px;padding:12px;border:2px solid #8ca8c6;border-radius:12px;font-size:1.08rem;background:#fff;color:#172337"></label>${button("Antwort prüfen", "check", 'style="margin-top:12px"')}`;
  root.innerHTML = card(`<h2>🇫🇷 Französisch · ${esc(currentName)}</h2><p>Aufgabe ${run.position + 1} von ${run.total} · ${q.direction}</p><div style="text-align:center;background:#f5f8fc;border-radius:16px;padding:18px;margin:14px 0"><div role="img" aria-label="Bildhinweis" style="font-size:64px;line-height:1.2">${q.word.image}</div><h2 style="color:#19344c">${esc(q.source)}</h2></div>${feedback}<p class="muted">Akzente dürfen bei der Eingabe fehlen; die richtige Schreibweise wird danach gezeigt.</p>`) + card(button("Zur Französisch-Auswahl", "menu", 'class="alt"'));
}
function checkAnswer() {
  if (!run || run.feedback) return;
  const value = root.querySelector("[data-french-answer]")?.value.trim() || "";
  if (!value) return;
  const item = run.queue[run.position];
  const q = question(item);
  const correct = q.accepted.some((answer) => normalize(answer) === normalize(value)) || flexibleCompletion(item.index, item.direction, value);
  run.draft = value;
  run.feedback = { correct, answer: value };
  run.answers.push({ index: item.index, position: run.position, direction: item.direction, answer: value, correct, updatedAt: Date.now() });
  if (correct) run.correct++;
  else run.wrongItems.push(item);
  save(); void syncActivity(); render();
}
function next() {
  if (!run?.feedback) return;
  run.position++;
  run.feedback = null;
  run.draft = "";
  if (run.position >= run.queue.length) run.completed = true;
  save(); void syncActivity(); render();
}
function showList() {
  const rows = frenchWords.map((word) => `<div class="solo-game" style="display:grid;grid-template-columns:48px 1fr;gap:10px;align-items:center"><div role="img" aria-label="Bildhinweis" style="font-size:32px;text-align:center">${word.image}</div><div><strong>${esc(word.fr)}</strong><br>${esc(word.de)}</div></div>`).join("");
  root.innerHTML = card(`<h2>📖 Vokabeln · Unité 1</h2><p>Sprich die französische Wendung laut und decke die Übersetzung zum Selbsttest ab.</p>${rows}`) + card(`<div class="solo-actions">${button("Französisch → Deutsch", "start-fr-de")}${button("Deutsch → Französisch", "start-de-fr")}${button("Zurück", "menu", 'class="alt"')}</div>`);
}

const franceMapQuestions=[
{p:"Hauptstadt Frankreichs?",a:["Paris"],h:"Norden, mit einem Stern markiert."},
{p:"Region um Paris?",a:["Île-de-France","Ile de France"],h:"Die Region heißt wörtlich „Insel Frankreich“."},
{p:"Insel im Mittelmeer im Südosten?",a:["la Corse","Corse","Korsika"],h:"Bastia und Ajaccio sind markiert."},
{p:"Stadt an der Spitze der Bretagne?",a:["Brest"],h:"Äußerster Nordwesten."},
{p:"Stadt im Norden nahe Belgien?",a:["Lille"],h:"Ganz im Norden."},
{p:"Stadt nahe Deutschland am Rhein?",a:["Strasbourg","Straßburg"],h:"Im Osten an der deutschen Grenze."},
{p:"Region im Nordosten?",a:["Grand Est"],h:"An Deutschland und Luxemburg."},
{p:"Hafenstadt am Mittelmeer im Süden?",a:["Marseille"],h:"Südfrankreich."},
{p:"Stadt an der Côte d’Azur?",a:["Nice","Nizza"],h:"Südosten, nahe Italien und Monaco."},
{p:"Stadt im Südwesten an der Garonne?",a:["Bordeaux"],h:"Nahe der Atlantikküste."},
{p:"Gebirge an der Grenze Frankreich–Spanien?",a:["Pyrenäen","les Pyrénées","Pyrenees"],h:"Im Süden."},
{p:"Gebirge mit dem Mont Blanc?",a:["Alpen","les Alpes"],h:"Im Südosten."},
{p:"Hochland im mittleren Süden?",a:["Massif Central","Zentralmassiv"],h:"Westlich der Alpen."},
{p:"Fluss durch Paris?",a:["Seine","la Seine"],h:"Fließt nordwestwärts zum Ärmelkanal."},
{p:"Längster Fluss Frankreichs durch Orléans?",a:["Loire","la Loire"],h:"Fließt westwärts zum Atlantik."},
{p:"Fluss durch Toulouse und Bordeaux?",a:["Garonne","la Garonne"],h:"Mündet in den Atlantik."},
{p:"Meer südlich von Frankreich?",a:["Mittelmeer","la mer Méditerranée"],h:"Zwischen Europa und Afrika."},
{p:"Ozean westlich von Frankreich?",a:["Atlantik","l’océan Atlantique"],h:"An der Westküste."},
{p:"Französischer Name des Ärmelkanals?",a:["La Manche","Manche"],h:"Zwischen Frankreich und Großbritannien."},
{p:"Nenne ein Nachbarland im Osten.",a:["Deutschland","Allemagne","Schweiz","Suisse","Italien","Italie","Luxemburg","Luxembourg"],h:"Deutschland, Schweiz, Italien und Luxemburg."},
{p:"Welches Land liegt südlich der Pyrenäen?",a:["Spanien","Espagne"],h:"Im Süden."},
{p:"Französisches Überseegebiet in der kleinen Weltkarte?",a:["Guadeloupe"],h:"In der Karibik."},
{p:"Stadt in der Region Occitanie nahe der Garonne?",a:["Toulouse"],h:"Nordwestlich der Pyrenäen."},
{p:"Region um Lyon und bis zu den Alpen?",a:["Auvergne-Rhône-Alpes","Auvergne Rhone Alpes"],h:"Im Südosten."},
{p:"Region im Westen mit Nantes?",a:["Pays de la Loire","Pays de Loire"],h:"Südlich der Bretagne."},
{p:"Region um Orléans?",a:["Centre-Val de Loire","Centre Val de Loire"],h:"Der Fluss Loire steht im Namen."},
{p:"Region mit Dijon?",a:["Bourgogne-Franche-Comté","Bourgogne Franche Comte"],h:"Im Osten."},
{p:"Region im Südwesten mit Bordeaux?",a:["Nouvelle-Aquitaine","Nouvelle Aquitaine"],h:"An der Atlantikküste."},
{p:"Region mit Caen und Rouen?",a:["Normandie","la Normandie"],h:"Im Nordwesten."},
{p:"Stadt an der Loire südwestlich von Orléans?",a:["Tours"],h:"Im Westen des Landes."},
{p:"Fluss, der bei Lyon nach Süden fließt?",a:["Rhône","Rhone"],h:"Mündet ins Mittelmeer."},
{p:"Stadt nahe der spanischen Grenze am Mittelmeer?",a:["Perpignan"],h:"Nahe den Pyrenäen."},
{p:"Region im Nordwesten mit Brest und Rennes?",a:["Bretagne","la Bretagne"],h:"An der Atlantikküste."},
{p:"Nenne eines der drei Meere an Frankreich.",a:["Mittelmeer","Atlantik","Ärmelkanal","la Manche","la mer Méditerranée","l’océan Atlantique"],h:"Mittelmeer, Atlantik oder Ärmelkanal."}
];
let mapRun=null;
function mapMenu(){try{mapRun=JSON.parse(localStorage.getItem("vb_french_map_"+currentName)||"null")}catch{mapRun=null}const resume=mapRun&&!mapRun.completed?button("Runde fortsetzen · Aufgabe "+(mapRun.position+1),"map-resume"):"";root.innerHTML=card('<h2>🗺️ Frankreich auf der Karte</h2><p>'+esc(currentName)+' · Klasse 7 Realschule</p><p>Übe, wo wichtige Städte, Regionen, Flüsse, Gebirge, Meere und Nachbarländer liegen.</p><div class="solo-actions">'+resume+button("🧭 Karte ansehen & lernen","map-look")+button("✍️ Karte abfragen · 10 Aufgaben","map-start")+button("Zurück zu Französisch","menu",'class="alt"')+'</div>')}
function mapSave(){try{localStorage.setItem("vb_french_map_"+currentName,JSON.stringify(mapRun))}catch{}}
async function syncMapActivity(newSession=false){
 if(!mapRun||!currentName||!names.includes(currentName))return;
 const now=Date.now();
 try{
  const {auth,database,databaseModule}=await firebaseContext(),uid=auth.currentUser?.uid;if(!uid)return;
  const path="learningActivity/"+uid+"/"+currentName+"/french_map";
  const {dayKey,weekKey}=periodKeys(now),prompts=mapRun.queue.map(i=>franceMapQuestions[i].p);
  const draftAnswers=Array(mapRun.total).fill("");
  const answerChecks={};
  mapRun.answers.forEach((x,i)=>{draftAnswers[i]=x.answer;answerChecks[String(i)]={attempted:true,correct:x.correct,submittedAnswer:x.answer,prompt:prompts[i],accepted:[franceMapQuestions[mapRun.queue[i]].a[0]],updatedAt:x.updatedAt};});
  const live={taskTitle:"Französisch · Karte Frankreich",done:mapRun.answers.length,total:mapRun.total,status:mapRun.completed?"Runde abgeschlossen · online gespeichert":"In Bearbeitung · live gespeichert",draftAnswers,draftPrompts:prompts,updatedAt:now};
  await databaseModule.runTransaction(databaseModule.ref(database,path),cur=>{
   const v=cur&&typeof cur==="object"?{...cur}:{};
   if(v.dayKey!==dayKey){v.dayKey=dayKey;v.dayCount=0;}if(v.weekKey!==weekKey){v.weekKey=weekKey;v.weekCount=0;}
   if(newSession){v.dayCount=(Number(v.dayCount)||0)+1;v.weekCount=(Number(v.weekCount)||0)+1;}
   v.lastAt=now;v.live=live;v.answerChecks={...(v.answerChecks||{}),...answerChecks};v.errorItems={...(v.errorItems||{})};
   mapRun.answers.forEach((x,i)=>{if(x.correct)return;const q=franceMapQuestions[mapRun.queue[i]],idx=mapRun.sessionId+"_"+i;v.errorItems[idx]={subject:"french",topic:"Französisch · Karte Frankreich",prompt:q.p,submittedAnswer:x.answer,answer:q.a[0],count:1,lastWrongAt:x.updatedAt,dayKey,weekKey};});
   v.sessions=Array.isArray(v.sessions)?[...v.sessions]:[];const session={sessionId:mapRun.sessionId,startedAt:mapRun.startedAt||now,lastAt:now,live};
   const n=v.sessions.findIndex(x=>x.sessionId===session.sessionId);if(n>=0)v.sessions[n]=session;else v.sessions.push(session);v.sessions=v.sessions.slice(-100);return v;
  });
 }catch(e){console.warn("Karten-Lernaktivität konnte nicht synchronisiert werden:",e);}
}
function mapLook(){root.innerHTML=card('<h2>🧭 Frankreich entdecken</h2><p>Suche Hauptstadt, Regionen, Städte, Flüsse, Gebirge, Meere und Nachbarländer. Tippe auf die Karte, um sie groß zu öffnen.</p><a href="./france-map.jpg" target="_blank" rel="noopener"><img src="./france-map.jpg" alt="Karte von Frankreich mit Regionen, Städten, Flüssen, Gebirgen und Nachbarländern" style="display:block;width:100%;height:auto;max-height:72vh;object-fit:contain;object-position:top;background:#e8eef7;border-radius:12px"></a><p class="small muted">Merke: Paris liegt im Norden, die Bretagne im Nordwesten, die Alpen im Südosten und die Pyrenäen im Süden.</p>')+card('<div class="solo-actions">'+button("✍️ Jetzt abfragen","map-start")+button("Zur Karte-Auswahl","map-menu",'class="alt"')+'</div>')}
function mapStart(){mapRun={queue:shuffle(franceMapQuestions.map((_,i)=>i)).slice(0,10),position:0,total:10,answers:[],completed:false,draft:"",feedback:null,startedAt:Date.now(),sessionId:String(Date.now())};mapSave();void syncMapActivity(true);mapRender()}
function mapRender(){if(!mapRun)return mapMenu();if(mapRun.completed){root.innerHTML=card('<h2>✅ Kartenrunde geschafft!</h2><p>'+esc(currentName)+' · '+mapRun.answers.filter(x=>x.correct).length+' von '+mapRun.total+' richtig.</p><div class="solo-actions">'+button("Noch einmal üben","map-start")+button("Karte ansehen","map-look")+button("Zur Karte-Auswahl","map-menu",'class="alt"')+'</div>');return}const q=franceMapQuestions[mapRun.queue[mapRun.position]];let body;if(mapRun.feedback){body='<section class="solo-game"><p class="'+(mapRun.feedback.correct?'good':'error')+'">'+(mapRun.feedback.correct?'✅ Richtig!':'🔎 Schau noch einmal genau hin.')+'</p><p>Gesucht: <strong>'+esc(q.a[0])+'</strong></p><p class="muted">'+esc(q.h)+'</p>'+button("Weiter","map-next")+'</section>'}else{body='<p class="muted">Nutze die Karte zum Nachschauen.</p><label>Deine Antwort<input data-map-answer autocomplete="off" value="'+esc(mapRun.draft)+'"></label>'+button("Antwort prüfen","map-check")}root.innerHTML=card('<h2>🗺️ Karten-Quiz · '+esc(currentName)+'</h2><p>Aufgabe '+(mapRun.position+1)+' von '+mapRun.total+'</p><div class="solo-game"><h3>'+esc(q.p)+'</h3><a href="./france-map.jpg" target="_blank" rel="noopener"><img src="./france-map.jpg" alt="Frankreichkarte zum Nachschauen" style="display:block;width:100%;height:auto;max-height:38vh;object-fit:contain;object-position:top;background:#e8eef7;border-radius:10px"></a></div>'+body)+card(button("Zur Karte-Auswahl","map-menu",'class="alt"'))}
function mapCheck(){if(!mapRun||mapRun.feedback)return;const answer=root.querySelector("[data-map-answer]")?.value.trim()||"";if(!answer)return;const q=franceMapQuestions[mapRun.queue[mapRun.position]];const correct=q.a.some(a=>normalize(a)===normalize(answer));mapRun.draft=answer;mapRun.feedback={correct};mapRun.answers.push({answer:answer,correct:correct,updatedAt:Date.now()});mapSave();void syncMapActivity();mapRender()}
function mapNext(){if(!mapRun?.feedback)return;mapRun.position++;mapRun.feedback=null;mapRun.draft="";if(mapRun.position>=mapRun.queue.length)mapRun.completed=true;mapSave();void syncMapActivity();mapRender()}

root.addEventListener("input", (event) => {
  if(event.target.matches("[data-map-answer]")&&mapRun&&!mapRun.feedback){mapRun.draft=event.target.value;mapSave();return;}
  if (!event.target.matches("[data-french-answer]") || !run || run.feedback) return;
  run.draft = event.target.value;
  save();
});
root.addEventListener("click", (event) => {
  const control = event.target.closest("[data-french-action]");
  if (!control) return;
  const action = control.dataset.frenchAction;
  if (action === "name") { currentName = control.dataset.name; localStorage.setItem("vb2solo_name", currentName); run = null; if(pendingDestination==="map")mapMenu();else menu(); }
  else if (action === "resume") render();
  else if (action === "start-fr-de") start("fr-de");
  else if (action === "start-de-fr") start("de-fr");
  else if (action === "start-both") start("both");
  else if (action === "review") start("review", run.wrongItems);
  else if (action === "check") checkAnswer();
  else if (action === "next") next();
  else if (action === "list") showList();
  else if (action === "menu") menu();
  else if (action === "pick-name") chooseName();
  else if (action === "map-menu") mapMenu();
  else if (action === "map-look") mapLook();
  else if (action === "map-start") mapStart();
  else if (action === "map-resume") mapRender();
  else if (action === "map-check") mapCheck();
  else if (action === "map-next") mapNext();
  else if (action === "home") location.reload();
});
