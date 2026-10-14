// Je Themenbereich gibt es 15 interaktive Übungsaufgaben mit Lösung und Rechenweg.
const fmt = n => String(Number(n.toFixed(2))).replace('.', ',');
const make = (q, answer, wrong, explanation, seed) => {
  const options = [...new Set([String(answer), ...wrong.map(String).filter(x => String(x) !== String(answer))])].slice(0, 4);
  while (options.length < 4) options.push(`andere Antwort ${options.length}`);
  const correct = (seed * 3 + 1) % 4;
  const correctText = options.shift();
  options.splice(correct, 0, correctText);
  return { q, options, correct, explanation };
};
const kindOptions = ['proportional', 'antiproportional', 'linear, aber nicht proportional', 'weder noch'];
const classify = (q, kind, explanation, seed) => make(q, kind, kindOptions.filter(x => x !== kind), explanation, seed);

const propRecognitionCases = [
  ['2 kg Äpfel kosten 6 €. 4 kg kosten 12 €. Welche Zuordnung liegt vor?', 'proportional', 'Der Preis pro Kilogramm bleibt gleich: 6 : 2 = 12 : 4 = 3 €/kg.'],
  ['Ein Fahrrad fährt gleichmäßig schnell. Verdoppelt sich die Zeit, verdoppelt sich auch die Strecke. Welche Zuordnung passt?', 'proportional', 'Bei gleichbleibender Geschwindigkeit wachsen Zeit und Strecke im gleichen Verhältnis.'],
  ['3 Kinokarten kosten 30 €. 6 Karten kosten 60 €. Welche Zuordnung ist das?', 'proportional', 'Der Preis je Karte ist konstant: 30 : 3 = 60 : 6 = 10 €.'],
  ['Ein Wasserhahn füllt gleichmäßig. In doppelt so viel Zeit fließt doppelt so viel Wasser. Welche Zuordnung passt?', 'proportional', 'Bei konstantem Durchfluss ist die Wassermenge proportional zur Zeit.'],
  ['5 Hefte kosten 12,50 €. 8 gleich teure Hefte kosten 20 €. Welche Zuordnung liegt vor?', 'proportional', 'Der Stückpreis bleibt 2,50 €. Der Quotient Preis : Heftzahl ist konstant.'],
  ['Für dieselbe Arbeit brauchen 4 Arbeiter 9 Stunden. Mit 8 Arbeitern dauert es 4,5 Stunden. Welche Zuordnung ist das?', 'antiproportional', 'Arbeiterzahl · Zeit bleibt gleich: 4 · 9 = 8 · 4,5 = 36.'],
  ['Für dieselbe Strecke braucht ein Auto bei doppelter Geschwindigkeit halb so lange. Welche Zuordnung passt?', 'antiproportional', 'Bei fester Strecke bleiben Geschwindigkeit · Zeit gleich.'],
  ['6 Kinder teilen eine feste Menge Süßigkeiten. Je mehr Kinder mitessen, desto weniger bekommt jedes. Welche Zuordnung passt?', 'antiproportional', 'Die Gesamtmenge bleibt gleich; Kinderzahl · Anteil pro Kind ist konstant.'],
  ['3 Pumpen leeren einen Tank in 8 Stunden. 6 gleiche Pumpen brauchen 4 Stunden. Welche Zuordnung liegt vor?', 'antiproportional', 'Pumpleistung · Zeit bleibt gleich: 3 · 8 = 6 · 4 = 24 Pumpenstunden.'],
  ['Je mehr gleich schnelle Maschinen dieselbe Bestellung herstellen, desto kürzer ist die Arbeitszeit. Welche Zuordnung passt?', 'antiproportional', 'Für dieselbe Bestellung bleibt Maschinenzahl · Zeit konstant.'],
  ['Ein Taxi verlangt 4 € Grundgebühr und 2 € pro Kilometer. Welche Zuordnung passt?', 'linear, aber nicht proportional', 'Der Term lautet Kosten = 2 · Kilometer + 4. Die Gerade startet bei 4 € und nicht bei 0.'],
  ['Ein Handwerker nimmt 15 € Anfahrt und zusätzlich 20 € pro Stunde. Wie ist der Preis der Zeit zugeordnet?', 'linear, aber nicht proportional', 'Es gibt einen festen Startbetrag. Der Graph geht deshalb nicht durch den Ursprung.'],
  ['Zu x = 1, 2, 3 gehören y = 3, 5, 7. Welche Zuordnung passt?', 'linear, aber nicht proportional', 'y wächst bei jedem Schritt um 2, aber bei x = 0 wäre y = 1 statt 0.'],
  ['In einer Tabelle stehen (1|2), (2|5), (3|10). Welche Zuordnung passt?', 'weder noch', 'Der Quotient ist nicht konstant, das Produkt ist nicht konstant und die Zuwächse sind nicht gleich.'],
  ['Zu x = 1, 2, 3 gehören y = 5, 20, 45. Welche Zuordnung passt?', 'weder noch', 'Quotient und Produkt sind nicht konstant; auch die Zuwächse sind nicht gleich.']
];

const propRepresentations = Array.from({ length: 15 }, (_, i) => {
  const k = [2, 3, 4, 5, 6][i % 5], x = [3, 4, 5, 6, 7][(i * 2) % 5], y = k * x;
  switch (i % 5) {
    case 0: return make(`Die Zuordnung lautet y = ${k} · x. Wie groß ist y für x = ${x}?`, y, [y + k, y - k, k + x], `Setze x ein: y = ${k} · ${x} = ${y}.`, i);
    case 1: return make(`Eine proportionale Tabelle enthält x = ${x} und y = ${y}. Wie groß ist k?`, k, [k + 1, x, y], `Bei einer proportionalen Zuordnung gilt k = y : x. Also ${y} : ${x} = ${k}.`, i);
    case 2: return make(`In einer proportionalen Tabelle gilt k = ${k}. Ergänze den fehlenden Wert für x = ${x}.`, y, [y + 2, y - 2, k + x], `Nutze y = k · x: y = ${k} · ${x} = ${y}.`, i);
    case 3: return make(`Der Punkt (${x}|${y}) liegt auf einer proportionalen Geraden. Welcher Term gehört dazu?`, `y = ${k} · x`, [`y = ${k + 1} · x`, `y = x + ${k}`, `y = ${y} · x`], `Berechne k = y : x = ${y} : ${x} = ${k}. Daher lautet der Term y = ${k} · x.`, i);
    default: return make(`Bei k = ${k} und y = ${y}: Welcher x-Wert gehört zur proportionalen Zuordnung?`, x, [x + 1, x - 1, y + k], `Aus y = k · x folgt x = y : k. Also ${y} : ${k} = ${x}.`, i);
  }
});

const propWordProblems = [
  [2, 6, 5, 'kg Äpfel', '€', 'Äpfel'], [3, 12, 7, 'Tickets', '€', 'Tickets'],
  [4, 10, 8, 'Brötchen', '€', 'Brötchen'], [2, 140, 5, 'Stunden', 'km', 'Fahrzeit'],
  [3, 90, 7, 'Minuten', 'Seiten', 'Druckzeit'], [4, 300, 6, 'Personen', 'g Mehl', 'Personenzahl'],
  [5, 20, 8, 'Liter Farbe', 'm² Wand', 'Farbmenge'], [2, 7, 6, 'Meter Stoff', '€', 'Stofflänge'],
  [3, 18, 8, 'Flaschen', 'Liter', 'Flaschenzahl'], [4, 24, 10, 'Stunden', 'km', 'Fahrzeit'],
  [5, 15, 9, 'Portionen', '€', 'Portionenzahl'], [2, 250, 6, 'Minuten', 'Liter', 'Zeit'],
  [3, 45, 9, 'kg', '€', 'Masse'], [4, 28, 10, 'Karten', 'Punkte', 'Kartenzahl'],
  [5, 12, 15, 'Meter', '€', 'Länge']
];
const propDreisatz = propWordProblems.map(([x1, y1, x2, xUnit, yUnit, label], i) => {
  const per = y1 / x1, answer = per * x2;
  const a = fmt(answer), p = fmt(per);
  return make(`${x1} ${xUnit} entsprechen ${y1} ${yUnit}. Wie viel sind es bei ${x2} ${xUnit}?`, `${a} ${yUnit}`,
    [`${fmt(y1 * x2)} ${yUnit}`, `${fmt(y1 + x2)} ${yUnit}`, `${fmt(answer + per)} ${yUnit}`],
    `Erst auf 1 ${xUnit} rechnen: ${y1} : ${x1} = ${p} ${yUnit} pro ${label}. Dann hochrechnen: ${p} · ${x2} = ${a} ${yUnit}.`, i);
});

const antiRecognitionCases = [
  ['4 Arbeiter brauchen 12 Stunden, 6 gleich schnelle Arbeiter brauchen 8 Stunden. Welche Zuordnung ist das?', 'antiproportional', 'Das Produkt bleibt gleich: 4 · 12 = 6 · 8 = 48.'],
  ['Für eine feste Strecke braucht man bei 60 km/h 3 Stunden, bei 90 km/h 2 Stunden. Welche Zuordnung passt?', 'antiproportional', 'Geschwindigkeit · Zeit ist gleich: 60 · 3 = 90 · 2 = 180 km.'],
  ['2 gleiche Wasserhähne füllen ein Becken in 15 Minuten, 5 Hähne in 6 Minuten. Welche Zuordnung passt?', 'antiproportional', 'Hähne · Minuten bleibt gleich: 2 · 15 = 5 · 6 = 30.'],
  ['12 Kinder erhalten je 3 Kekse. Teilen 18 Kinder dieselbe Keksmenge, bekommt jedes 2 Kekse. Welche Zuordnung ist das?', 'antiproportional', 'Kinderzahl · Kekse pro Kind bleibt 36.'],
  ['Eine feste Arbeit dauert mit 3 Maschinen 20 Stunden, mit 4 Maschinen 15 Stunden. Welche Zuordnung passt?', 'antiproportional', '3 · 20 = 4 · 15 = 60 Maschinenstunden.'],
  ['2 kg Birnen kosten 5 €, 6 kg kosten 15 €. Welche Zuordnung ist das?', 'proportional', 'Der Preis je Kilogramm ist konstant: 5 : 2 = 15 : 6.'],
  ['Bei gleichbleibender Geschwindigkeit fährt ein Zug in 2 Stunden 160 km und in 5 Stunden 400 km. Welche Zuordnung passt?', 'proportional', 'Die Geschwindigkeit bleibt 80 km/h; Strecke : Zeit ist konstant.'],
  ['4 gleiche Stifte kosten 3 €, 8 Stifte kosten 6 €. Welche Zuordnung passt?', 'proportional', 'Der Preis je Stift bleibt gleich.'],
  ['Ein Rezept für 3 Personen braucht 450 g Reis. Für 6 Personen werden 900 g benötigt. Welche Zuordnung ist das?', 'proportional', 'Personenzahl und Reismenge wachsen im gleichen Verhältnis.'],
  ['Ein Drucker druckt 40 Seiten in 2 Minuten und 100 Seiten in 5 Minuten. Welche Zuordnung passt?', 'proportional', 'Die Seitenzahl pro Minute bleibt 20.'],
  ['Ein Lieferdienst nimmt 3 € Grundgebühr und 1 € je Kilometer. Welche Zuordnung liegt vor?', 'linear, aber nicht proportional', 'Der feste Startpreis macht den Zusammenhang linear, aber nicht proportional.'],
  ['Eine Parkuhr kostet 2 € Grundbetrag und 1,50 € je Stunde. Welche Zuordnung ist das?', 'linear, aber nicht proportional', 'Die Gerade beginnt bei 2 € und geht nicht durch den Ursprung.'],
  ['Bei x = 0, 1, 2 stehen y = 5, 8, 11. Welche Zuordnung passt?', 'linear, aber nicht proportional', 'Die Zuwächse sind gleich, aber der Startwert ist 5 statt 0.'],
  ['Zu x = 1, 2, 4 gehören y = 3, 5, 8. Welche Zuordnung passt?', 'weder noch', 'Quotient und Produkt sind nicht konstant; auch die Änderungen sind nicht gleich.'],
  ['Zu x = 2, 3, 5 gehören y = 4, 8, 9. Welche Zuordnung passt?', 'weder noch', 'Weder bleibt y : x noch x · y gleich; auch die Zuwächse bilden keine lineare Regel.']
];

const antiRepresentations = Array.from({ length: 15 }, (_, i) => {
  const k = [12, 18, 24, 30, 36][i % 5], x = [2, 3, 4, 5, 6][(i * 2) % 5], y = k / x;
  switch (i % 5) {
    case 0: return make(`Die Zuordnung lautet y = ${k} : x. Wie groß ist y für x = ${x}?`, y, [y + 2, y - 1, k * x], `Setze x ein: y = ${k} : ${x} = ${fmt(y)}.`, i);
    case 1: return make(`Ein Punkt (${x}|${y}) liegt auf einer antiproportionalen Zuordnung. Wie groß ist k?`, k, [k + x, k - x, x + y], `Bei einer antiproportionalen Zuordnung gilt k = x · y. Also ${x} · ${fmt(y)} = ${k}.`, i);
    case 2: return make(`Bei x · y = ${k} und y = ${fmt(y)}: Welcher x-Wert gehört dazu?`, x, [x + 1, x + 2, k + x], `Stelle nach x um: x = k : y = ${k} : ${fmt(y)} = ${x}.`, i);
    case 3: return make(`Welche Regel passt zum Punkt (${x}|${y}) auf einem antiproportionalen Graphen?`, `y = ${k} : x`, [`y = ${k} · x`, `y = x + ${k}`, `y = ${x} : x`], `Das feste Produkt ist x · y = ${x} · ${fmt(y)} = ${k}. Daher y = ${k} : x.`, i);
    default: return make(`Eine Tabelle hat das feste Produkt k = ${k}. Ergänze y für x = ${x}.`, y, [y + 3, y - 2, k * x], `Halte das Produkt gleich: y = k : x = ${k} : ${x} = ${fmt(y)}.`, i);
  }
});

const antiWordProblems = [
  [4, 12, 6, 'Arbeiter', 'Stunden', 'gleiche Arbeit'], [3, 20, 5, 'Maschinen', 'Stunden', 'gleiche Bestellung'],
  [2, 18, 6, 'Pumpen', 'Minuten', 'denselben Tank'], [5, 8, 4, 'Personen', 'Tage', 'denselbe Menge Proviant'],
  [60, 3, 90, 'km/h', 'Stunden', 'dieselbe Strecke'], [6, 10, 12, 'Arbeiter', 'Stunden', 'gleiche Arbeit'],
  [4, 15, 10, 'Hähne', 'Minuten', 'denselben Pool'], [8, 9, 12, 'Drucker', 'Minuten', 'denselben Druckauftrag'],
  [3, 16, 8, 'Bagger', 'Tage', 'dieselbe Baustelle'], [40, 5, 50, 'km/h', 'Stunden', 'dieselbe Strecke'],
  [5, 14, 7, 'Maler', 'Stunden', 'dieselbe Wand'], [2, 24, 8, 'Pumpen', 'Stunden', 'dieselbe Wassermenge'],
  [4, 21, 7, 'Kräfte', 'Tage', 'dieselbe Arbeit'], [6, 15, 10, 'Teams', 'Stunden', 'dieselbe Aufgabe'],
  [3, 30, 9, 'Lkw', 'Fahrten', 'dieselbe Ladung']
];
const antiDreisatz = antiWordProblems.map(([x1, y1, x2, xUnit, yUnit, context], i) => {
  const product = x1 * y1, answer = product / x2;
  const p = fmt(product), a = fmt(answer);
  return make(`${x1} ${xUnit} benötigen ${y1} ${yUnit} für ${context}. Wie lange bzw. wie viele ${yUnit} brauchen ${x2} ${xUnit}?`, `${a} ${yUnit}`,
    [`${fmt(y1 * x2)} ${yUnit}`, `${fmt(product - x2)} ${yUnit}`, `${fmt(answer + y1)} ${yUnit}`],
    `Zuerst das feste Produkt berechnen: ${x1} · ${y1} = ${p}. Dann durch die neue Anzahl teilen: ${p} : ${x2} = ${a} ${yUnit}.`, i);
});

const mixedCases = [
  ['y = 5 · x', 'proportional', 'Der Quotient y : x bleibt 5; der Graph geht durch den Ursprung.'],
  ['y = 36 : x', 'antiproportional', 'Das Produkt x · y bleibt 36.'],
  ['y = 3 · x + 4', 'linear, aber nicht proportional', 'Es ist eine Gerade mit Startwert 4 und geht nicht durch (0|0).'],
  ['x · y = 72', 'antiproportional', 'Das Produkt ist fest; gleichwertig gilt y = 72 : x.'],
  ['y : x = 2,5', 'proportional', 'Der Quotient ist fest; daraus folgt y = 2,5 · x.'],
  ['Punkt (4|20) auf einer Geraden durch den Ursprung', 'proportional', 'k = 20 : 4 = 5, also gehört der Punkt zur proportionalen Regel y = 5 · x.'],
  ['Punkt (3|8) auf einer Kurve mit x · y = 24', 'antiproportional', '3 · 8 = 24; das Produkt ist der feste Faktor.'],
  ['Punkt (0|6) auf einer Geraden', 'linear, aber nicht proportional', 'Eine proportionale Gerade muss durch (0|0) gehen; hier liegt der Startwert bei 6.'],
  ['Wertetabelle: x = 1, 2, 3; y = 4, 8, 12', 'proportional', 'y : x ist immer 4.'],
  ['Wertetabelle: x = 2, 4, 8; y = 12, 6, 3', 'antiproportional', 'x · y ist immer 24.'],
  ['Ein Kinoticket kostet 8 €. Mehr Tickets kosten entsprechend mehr.', 'proportional', 'Bei festem Stückpreis ist Gesamtpreis : Ticketzahl konstant.'],
  ['Eine feste Strecke: Je schneller man fährt, desto kürzer ist die Fahrzeit.', 'antiproportional', 'Bei fester Strecke bleibt Geschwindigkeit · Zeit gleich.'],
  ['Eine Taxifahrt kostet 5 € Grundgebühr plus 2 € pro km.', 'linear, aber nicht proportional', 'Der Grundpreis bedeutet: bei 0 km fallen schon 5 € an.'],
  ['Wertetabelle: x = 1, 2, 3; y = 2, 5, 9', 'weder noch', 'Quotient, Produkt und Zuwächse sind nicht konstant.'],
  ['Ein Würfel wird geworfen; x ist die Zahl oben, y ist die Farbe des Würfels.', 'weder noch', 'Zwischen diesen Größen besteht keine proportionale oder antiproportionale Zuordnungsregel.']
];
const mixed = mixedCases.map(([q, kind, why], i) => classify(`Welche Art von Zuordnung beschreibt: ${q}?`, kind, why, i));

export const PROPORTIONAL_PRACTICE_TOPICS = [
  { id: 'prop-erkennen', title: 'Proportional erkennen', shortTitle: 'Proportional erkennen', icon: '🔎', group: 'Proportional', questions: propRecognitionCases.map(([q,k,e],i)=>classify(q,k,e,i)) },
  { id: 'prop-tabelle', title: 'Proportionale Tabelle, Term und Graph', shortTitle: 'Proportional: Tabelle · Term · Graph', icon: '📈', group: 'Proportional', questions: propRepresentations },
  { id: 'prop-dreisatz', title: 'Proportionaler Dreisatz', shortTitle: 'Proportionaler Dreisatz', icon: '🧮', group: 'Proportional', questions: propDreisatz },
  { id: 'anti-erkennen', title: 'Antiproportional erkennen', shortTitle: 'Antiproportional erkennen', icon: '🔎', group: 'Antiproportional', questions: antiRecognitionCases.map(([q,k,e],i)=>classify(q,k,e,i)) },
  { id: 'anti-tabelle', title: 'Antiproportionale Tabelle, Term und Graph', shortTitle: 'Antiproportional: Tabelle · Term · Graph', icon: '📉', group: 'Antiproportional', questions: antiRepresentations },
  { id: 'anti-dreisatz', title: 'Antiproportionaler Dreisatz', shortTitle: 'Antiproportionaler Dreisatz', icon: '🧮', group: 'Antiproportional', questions: antiDreisatz },
  { id: 'zuordnungen-vergleichen', title: 'Zuordnungen vergleichen und anwenden', shortTitle: 'Zuordnungen vergleichen', icon: '⚖️', group: 'Vergleichen', questions: mixed }
];
