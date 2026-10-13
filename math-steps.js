// Gemeinsame, sichtbare Rechenwege für die Kinder- und Schiedsrichterseite.
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b];}return a||1;};
const lcm=(a,b)=>Math.abs(a*b)/gcd(a,b);
const fmt=(n,d)=>d===1?String(n):`${n}/${d}`;

function reduceStep(n,d){
  const g=gcd(n,d);
  if(g<=1)return [];
  return [`Kürzen: Zähler und Nenner durch ${g} teilen: ${fmt(n,d)} = (${n} : ${g})/(${d} : ${g}) = ${fmt(n/g,d/g)}.`];
}

function multiplicationSteps(a,b,c,d){
  const steps=[];
  const g1=gcd(a,d),g2=gcd(c,b);
  let aa=a,bb=b,cc=c,dd=d;
  if(g1>1){aa/=g1;dd/=g1;steps.push(`Über Kreuz kürzen: ${a} und ${d} durch ${g1} teilen → ${aa} und ${dd}.`);}
  if(g2>1){cc/=g2;bb/=g2;steps.push(`Über Kreuz kürzen: ${c} und ${b} durch ${g2} teilen → ${cc} und ${bb}.`);}
  if(!steps.length)steps.push('Vor dem Multiplizieren lässt sich nicht über Kreuz kürzen.');
  const n=aa*cc,den=bb*dd;
  steps.push(`Zähler mal Zähler und Nenner mal Nenner: (${aa} · ${cc})/(${bb} · ${dd}) = ${fmt(n,den)}.`);
  const reduced=reduceStep(n,den);steps.push(...reduced);
  if(!reduced.length)steps.push(den===1?`Das Ergebnis ist die ganze Zahl ${n}.`:`Der Bruch ist bereits vollständig gekürzt: ${fmt(n,den)}.`);
  return steps;
}

function fractionOperationSteps(question){
  const q=String(question||'').replace(/[−–]/g,'-');
  // Nur einzelne Rechenoperationen automatisch zerlegen. Klammer- und
  // gemischte Aufgaben behalten ihren redaktionell hinterlegten Rechenweg.
  if(/[()]/.test(q))return null;
  if([...q.matchAll(/-?\d+\s*\/\s*\d+/g)].length!==2)return null;
  const matches=[...q.matchAll(/(-?\d+)\s*\/\s*(\d+)\s*([+\-*·×:/÷])\s*(-?\d+)\s*\/\s*(\d+)/g)];
  if(matches.length!==1)return null;
  const [,a0,b0,op0,c0,d0]=matches[0];
  const a=Number(a0),b=Number(b0),c=Number(c0),d=Number(d0);
  if(!b||!d)return null;
  const op=op0==='·'||op0==='×'?'*':op0===':'||op0==='÷'?'/':op0;
  if(op==='/'){
    const steps=[`Kehrwert des zweiten Bruchs bilden: ${fmt(c,d)} wird zu ${fmt(d,c)}.`];
    steps.push(...multiplicationSteps(a,b,d,c));
    return steps;
  }
  if(op==='*')return multiplicationSteps(a,b,c,d);
  const den=lcm(b,d),leftFactor=den/b,rightFactor=den/d;
  const left=a*leftFactor,right=c*rightFactor,n=op==='+'?left+right:left-right;
  const steps=[];
  if(b!==d)steps.push(`Gemeinsamen Nenner bestimmen: kgV(${b}, ${d}) = ${den}.`);
  if(b!==d)steps.push(`Gleichnamig machen: ${fmt(a,b)} = ${fmt(left,den)} und ${fmt(c,d)} = ${fmt(right,den)}.`);
  steps.push(`Zähler ${op==='+'?'addieren':'subtrahieren'}, Nenner beibehalten: ${fmt(left,den)} ${op==='+'?'+':'−'} ${fmt(right,den)} = ${fmt(n,den)}.`);
  const reduced=reduceStep(n,den);steps.push(...reduced);
  if(!reduced.length)steps.push(den===1?`Das Ergebnis ist die ganze Zahl ${n}.`:`Der Bruch ist bereits vollständig gekürzt: ${fmt(n,den)}.`);
  return steps;
}

function reduceFractionQuestion(question){
  const q=String(question||'').replace(/[−–]/g,'-');
  if(!/kürz/i.test(q))return null;
  const matches=[...q.matchAll(/(-?\d+)\s*\/\s*(\d+)/g)];
  if(matches.length!==1)return null;
  const n=Number(matches[0][1]),d=Number(matches[0][2]);
  if(!d)return null;
  const g=gcd(n,d);
  if(g===1)return [`Gemeinsamen Teiler prüfen: ggT(${Math.abs(n)}, ${Math.abs(d)}) = 1.`, `${fmt(n,d)} ist bereits vollständig gekürzt.`];
  return [`Größten gemeinsamen Teiler bestimmen: ggT(${Math.abs(n)}, ${Math.abs(d)}) = ${g}.`, `Zähler und Nenner durch ${g} teilen: ${fmt(n,d)} = (${n} : ${g})/(${d} : ${g}) = ${fmt(n/g,d/g)}.`, `${fmt(n/g,d/g)} ist vollständig gekürzt.`];
}

function splitExplanation(value){
  const source=String(value||'').trim();
  if(!source)return ['Prüfe die Rechenregel und führe die Rechnung Schritt für Schritt aus.'];
  return source.split(/\s*;\s*|(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/[.!?]+$/,''));
}

function explicitReductionSteps(explanation){
  const out=[];
  const chains=String(explanation||'').matchAll(/(?:-?\d+\s*\/\s*\d+\s*=\s*)+-?\d+\s*\/\s*\d+/g);
  for(const chain of chains){
    const fractions=[...chain[0].matchAll(/(-?\d+)\s*\/\s*(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
    for(let i=0;i<fractions.length-1;i++){
      const [n,d]=fractions[i],[rn,rd]=fractions[i+1],g=gcd(n,d);
      if(g>1&&n/g===rn&&d/g===rd){
        out.push(`Kürzungszahl bestimmen: ggT(${Math.abs(n)}, ${Math.abs(d)}) = ${g}.`);
        out.push(`Zähler und Nenner durch ${g} teilen: ${fmt(n,d)} = (${n} : ${g})/(${d} : ${g}) = ${fmt(rn,rd)}.`);
      }
    }
  }
  return out;
}

export function workedSteps(question){
  if(Array.isArray(question?.steps)&&question.steps.length)return question.steps;
  const text=question?.q||question?.question||'';
  const exact=fractionOperationSteps(text);
  if(exact)return exact;
  const reduction=reduceFractionQuestion(text);
  if(reduction)return reduction;
  const explanation=question?.explain||question?.explanation||'';
  return [...splitExplanation(explanation),...explicitReductionSteps(explanation)];
}

export function workedStepsHtml(question, renderText=value=>String(value)){
  const steps=workedSteps(question);
  return `<div class="player math-solution"><strong>🧮 Rechenweg – alle Schritte</strong><ol style="padding-left:22px;line-height:1.6">${steps.map(step=>`<li>${renderText(step)}</li>`).join('')}</ol></div>`;
}
