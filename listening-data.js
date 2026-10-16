export const LISTENING_QUESTIONS = [
  {task:1,type:'order',points:5,q:'Listen to the radio programme and put the photos in the right order.',images:[['listening-photo-zipline.jpg','Zip line'],['listening-photo-cardiff.jpg','Cardiff sign'],['listening-photo-skateboard.jpg','Skateboard park'],['listening-photo-radio.jpg','Radio studio'],['listening-photo-refreshments.jpg','Drinks and snacks'],['listening-photo-rafting.jpg','Rafting']],accepted:['2','6','4','1','5','3'],answerText:'Photo order: zip line 2 · Cardiff sign 6 · skateboard park 4 · radio studio 1 · drinks/snacks 5 · rafting 3'},
  ...[
    ['What is the first sport you can try near Mount Snowdon?',['zip line','zipline']],
    ['Name one water sport from the programme.',['canoeing','rafting']],
    ['What can you do with your bike in the city?',['ride your bike','cycling','cycle']],
    ['Where can you go skateboarding?',['skateboard park','skate park']],
    ['Write down another sport mentioned in the programme.',['table tennis','football','netball']]
  ].map(([q,accepted],i)=>({task:2,type:'text',points:1,instruction:'What can you do at the activity weekend in Cardiff? Write down five sports.',q:`${i+1}. ______________________________`,accepted,answerText:accepted.join(' / ')})),
  ...[
    ['The radio programme has the best tips for the weekend.','right'],
    ['Maisie Reedman is part of the radio team.','wrong'],
    ['The zip line in Cardiff is the longest in Europe.','wrong'],
    ['They will close some roads in the city centre.','right'],
    ['You need a helmet for some sports.','right']
  ].map(([q,answer])=>({task:3,type:'tf',points:1,instruction:'Listen again. Right or wrong? Tick (✓) the correct box for each sentence.',q,options:['Right','Wrong'],correct:answer==='right'?0:1,accepted:[answer],answerText:answer})),
  ...[
    ['Cardiff is the capital of _____.',['Wales','the capital city of wales']],
    ['At the activity weekend you can try lots of different _____.',['sports','activities','sports and activities']],
    ['You can try out water sports like _____.',['canoeing','rafting']],
    ['_____ will be there to help and answer questions.',['volunteers']],
    ['The organisers hope lots of _____ will come.',['guests','people']]
  ].map(([q,accepted])=>({task:4,type:'text',points:1,instruction:'Complete the sentences with the right information.',q,accepted,answerText:accepted.join(' / ')})),
  ...[
    ['Why is Cardiff a good place to visit this weekend?',['different sports','activities','all over the city']],
    ['What is special about the zip line near Mount Snowdon?',['longest','europe']],
    ['What will they do to make it safer to cycle or skateboard in the city centre?',['close','roads','cars']],
    ['What can you do if you do not want to do sports?',['watch','drink','snack']],
    ['How can you find out where each activity is?',['signs']]
  ].map(([q,required])=>({task:5,type:'open',points:1,instruction:'Answer the questions. Write complete sentences.',q,required,answerText:{
    'Why is Cardiff a good place to visit this weekend?':'You can try different sports and activities all over the city.',
    'What is special about the zip line near Mount Snowdon?':"It’s the longest zip line in Europe.",
    'What will they do to make it safer to cycle or skateboard in the city centre?':'They will close some roads to cars.',
    'What can you do if you do not want to do sports?':'You can just watch and have a drink or a snack.',
    'How can you find out where each activity is?':'There will be signs telling you where each activity is.'
  }[q]}))
];

export const LISTENING_TOTAL_POINTS = LISTENING_QUESTIONS.reduce((sum,q)=>sum+q.points,0);

export function listeningTaskImage(task){
  const images={2:['listening-cartoon-bat.jpg','Cartoon bat with a football'],4:['listening-wales-sign.jpg','Welcome to Wales sign'],5:['listening-good-luck.jpg','Good luck illustration']};
  const item=images[task];
  return item?`<img src="./${item[0]}" alt="${item[1]}" style="display:block;width:min(100%,300px);max-height:180px;object-fit:contain;border-radius:12px;margin:10px auto">`:'';
}

export function listeningIsCorrect(q,value){
  if(!q||value===undefined||value===null)return false;
  if(q.type==='order')return Array.isArray(value)&&value.map(String).join(',')===q.accepted.join(',');
  if(q.type==='tf')return q.accepted.includes(q.options[Number(value)]?.toLowerCase());
  const text=String(value).toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g,' ').trim();
  if(!text)return false;
  if(q.type==='open')return q.required.every(term=>text.includes(term));
  return q.accepted.some(term=>text.includes(String(term).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()));
}

export function listeningControls(q,prefix,disabled=false){
  const lock=disabled?'disabled':'';
  if(q.type==='order')return `<p>${q.images.map(([,label],i)=>`${i+1}. ${label}`).join(' · ')}</p><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">${q.images.map(([src,label],i)=>`<label style="display:block"><img src="./${src}" alt="${label}" style="width:100%;height:110px;object-fit:cover;border-radius:10px"><span>${label}</span><select data-listening-field="${prefix}" data-index="${i}" ${lock}><option value="">Position …</option>${[1,2,3,4,5,6].map(n=>`<option value="${n}">${n}</option>`).join('')}</select></label>`).join('')}</div>`;
  if(q.type==='tf')return `<div style="display:flex;gap:16px;flex-wrap:wrap">${q.options.map((o,i)=>`<label><input type="radio" name="${prefix}" value="${i}" data-listening-field="${prefix}" ${lock}> ${o}</label>`).join('')}</div>`;
  return `<textarea data-listening-field="${prefix}" rows="${q.type==='open'?3:1}" ${lock} placeholder="Write your answer …" style="box-sizing:border-box;width:100%;margin-top:8px;padding:12px;border:2px solid #5c7696;border-radius:10px;background:#fff;color:#172337;font:inherit"></textarea>`;
}

export function listeningAnswerValue(q,prefix,root=document){
  if(q.type==='order')return [...root.querySelectorAll(`[data-listening-field="${prefix}"]`)].sort((a,b)=>Number(a.dataset.index)-Number(b.dataset.index)).map(el=>el.value);
  if(q.type==='tf')return root.querySelector(`[data-listening-field="${prefix}"]:checked`)?.value;
  return root.querySelector(`[data-listening-field="${prefix}"]`)?.value||'';
}
