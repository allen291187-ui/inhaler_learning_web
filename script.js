const STORAGE_KEY = 'pgy_inhaler_learning_v34';
const defaultState = () => ({
  screen:'intro', skillIndex:0, quizIndex:0, selectedCases:[], completedCases:[], caseIndex:0, qIndex:0,
  score:0, total:0, mode:'initial', caseScores:{}, currentCaseCorrect:0, currentCaseTotal:0,
  returnTo:null, hasSavedProgress:false, answerRecords:[]
});
let state = defaultState();
const card = document.getElementById('card');
const stepList = document.getElementById('stepList');
const progressText = document.getElementById('progressText');
const barFill = document.getElementById('barFill');
const sidebar = document.getElementById('sidebar');
const mobileNavBtn = document.getElementById('mobileNavBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileNavClose = document.getElementById('mobileNavClose');

function isMobileNav(){ return window.matchMedia('(max-width: 850px)').matches; }
function openMobileNav(){
  if(!isMobileNav()) return;
  sidebar.classList.add('mobile-open');
  sidebarOverlay.classList.add('show');
  document.body.classList.add('mobile-nav-open');
  mobileNavBtn.setAttribute('aria-expanded','true');
}
function closeMobileNav(){
  sidebar.classList.remove('mobile-open');
  sidebarOverlay.classList.remove('show');
  document.body.classList.remove('mobile-nav-open');
  mobileNavBtn.setAttribute('aria-expanded','false');
}
function toggleMobileNav(){ sidebar.classList.contains('mobile-open') ? closeMobileNav() : openMobileNav(); }
mobileNavBtn.addEventListener('click', toggleMobileNav);
sidebarOverlay.addEventListener('click', closeMobileNav);
if(mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
window.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMobileNav(); });
window.addEventListener('resize', ()=>{ if(!isMobileNav()) closeMobileNav(); });

document.getElementById('restartBtn').onclick = ()=>{ closeMobileNav(); restart(); };

function saveState(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {} }
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return false;
    const saved = JSON.parse(raw);
    state = Object.assign(defaultState(), saved, { hasSavedProgress:true, returnTo:null });
    if(!Array.isArray(state.answerRecords)) state.answerRecords=[];
    return true;
  } catch(e) { return false; }
}
function clearSavedState(){ try { localStorage.removeItem(STORAGE_KEY); } catch(e) {} }
function preserveReturnPoint(){
  if(['caseQ','caseIntro','caseSummary'].includes(state.screen)) state.returnTo={screen:state.screen,selectedCases:state.selectedCases,caseIndex:state.caseIndex,qIndex:state.qIndex,mode:state.mode,currentCaseCorrect:state.currentCaseCorrect,currentCaseTotal:state.currentCaseTotal};
}
function restoreReturnPoint(){
  if(!state.returnTo) return false; const r=state.returnTo;
  state.screen=r.screen||'caseQ'; state.selectedCases=r.selectedCases||state.selectedCases; state.caseIndex=r.caseIndex||0; state.qIndex=r.qIndex||0; state.mode=r.mode||state.mode; state.currentCaseCorrect=r.currentCaseCorrect||0; state.currentCaseTotal=r.currentCaseTotal||0; state.returnTo=null; render(); return true;
}
function goCourseIntro(){ preserveReturnPoint(); state.screen='intro'; render(); }
function goSkills(){ preserveReturnPoint(); state.screen='skill'; state.skillIndex=0; render(); }
function goQuiz(){ preserveReturnPoint(); state.screen='quiz'; state.quizIndex=0; render(); }
function coreCasesDone(){ return state.mode!=='initial' || (state.selectedCases.length===2 && state.selectedCases.every(c=>state.completedCases.includes(c.name))); }
function goCaseMap(){ preserveReturnPoint(); if(state.mode==='initial' && state.selectedCases.length===2 && !coreCasesDone()){ continueMainCases(); return; } if(state.mode==='initial' && state.selectedCases.length===0){ state.screen='quiz'; state.quizIndex=Math.min(state.quizIndex, COURSE.quiz.length-1); render(); return; } state.screen='map'; render(); }
function goCasePractice(){ if(['caseIntro','caseQ','caseSummary'].includes(state.screen)){render();return;} if(state.returnTo){restoreReturnPoint();return;} if(state.selectedCases?.length && state.mode==='initial' && !coreCasesDone()){continueMainCases();return;} state.screen='map';render(); }
function goFinish(){ preserveReturnPoint(); if(state.mode==='initial' && state.selectedCases.length===2 && !coreCasesDone()){continueMainCases();return;} state.screen='finish'; render(); }
function goStep(i){ closeMobileNav(); const actions=[goCourseIntro,goSkills,goQuiz,goCaseMap,goCasePractice,goFinish]; if(actions[i]) actions[i](); }

function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function btn(text,fn,cls='primary'){ return `<button class="${cls}" onclick="${fn}">${text}</button>`; }
function esc(s){ return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function skillTags(skills=[]){ return skills.length?`<div class="skill-tags">${skills.map(s=>`<span>🏷️ ${esc(s)}</span>`).join('')}</div>`:''; }
function setSteps(active){
  const steps=[{label:'📖 課程介紹'},{label:'💬 溝通技巧'},{label:'📝 技巧小測驗'},{label:'📋 案例總表'},{label:'🎭 案例演練'},{label:'🏆 完成回饋'}];
  stepList.innerHTML=steps.map((s,i)=>`<li class="${i===active?'active':''} ${i<active?'done':''}" onclick="goStep(${i})" role="button" tabindex="0">${s.label}</li>`).join('');
  progressText.textContent=(steps[active]?.label.replace(/^[^一-龥A-Za-z]+\s*/,'')||'完成'); barFill.style.width=`${Math.min(100,active/(steps.length-1)*100)}%`;
}
function render(){
  if(state.screen==='intro')renderIntro(); if(state.screen==='skill')renderSkill(); if(state.screen==='quiz')renderQuiz(); if(state.screen==='map')renderCaseMap(); if(state.screen==='caseIntro')renderCaseIntro(); if(state.screen==='caseQ')renderCaseQ(); if(state.screen==='caseSummary')renderCaseSummary(); if(state.screen==='finish')renderFinish(); if(state.screen==='records')renderRecords(); saveState();
}
function renderIntro(){
  setSteps(0); const i=COURSE.intro;
  const resume=state.completedCases.length||state.total||state.returnTo?`<div class="notice"><b>歡迎回來</b><br>已完成案例：${state.completedCases.length}/${COURSE.cases.length}｜客觀題答對：${state.score}/${state.total}<div class="actions compact"><button class="primary" onclick="continueLearning()">繼續學習</button><button class="ghost" onclick="restart()">重新開始</button></div></div>`:'';
  const returnBtn=state.returnTo?`<button class="ghost" onclick="restoreReturnPoint()">⬅ 返回剛剛的案例</button>`:'';
  card.innerHTML=`<div class="tag">${esc(COURSE.version)}</div><h2>${i.heading}</h2><p class="lead">${i.text}</p>${resume}<div class="grid">${i.bullets.map(b=>`<div class="mini">${b}</div>`).join('')}</div><div class="notice">教材來源：吸入劑衛教與藥師病房溝通案例簡報。請勿輸入病人個資。</div><div class="actions">${btn('開始學習','startCourse()')}${returnBtn}</div>`;
}
function continueLearning(){ if(state.returnTo){restoreReturnPoint();return;} if(state.mode==='initial' && state.selectedCases.length===2 && !coreCasesDone()){continueMainCases();return;} if(state.completedCases.length){state.screen='map';render();return;} startCourse(); }
function startCourse(){state.screen='skill';state.skillIndex=0;render();}
function renderSkill(){ setSteps(1); const s=COURSE.skills[state.skillIndex]; const returnBtn=state.returnTo?`<button class="ghost" onclick="restoreReturnPoint()">⬅ 返回剛剛的案例</button>`:''; card.innerHTML=`<div class="skill-view"><div class="tag">溝通技巧 ${state.skillIndex+1}/${COURSE.skills.length} · ${s.tag}</div><h2>${s.name}</h2><p class="purpose">${s.purpose}</p><h3>藥師可以這樣說</h3><blockquote>${s.example}</blockquote><div class="actions"><button class="ghost" onclick="prevSkill()" ${state.skillIndex===0?'disabled':''}>上一個</button><button class="primary" onclick="nextSkill()">${state.skillIndex===COURSE.skills.length-1?'進入小測驗':'下一個技巧'}</button>${returnBtn}</div></div>`; }
function prevSkill(){if(state.skillIndex>0){state.skillIndex--;render();}} function nextSkill(){if(state.skillIndex<COURSE.skills.length-1)state.skillIndex++;else{state.screen='quiz';state.quizIndex=0;}render();}
function renderQuiz(){setSteps(2);renderQuestion(COURSE.quiz[state.quizIndex],'answerQuiz');}
function renderQuestion(q,handler){
  let html=`<div class="tag">${q.title}</div><h2>${q.prompt}</h2>`;
  if(q.type==='single')html+=`<div class="options">${q.options.map((o,i)=>`<button class="option" onclick="${handler}(${i})"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join('')}</div>`;
  if(q.type==='match'){ html+=`<p class="lead">選出每個情境最適合的技巧：</p>`; q.pairs.forEach((p,idx)=>{html+=`<label class="match"><b>${idx+1}. ${p.left}</b><select id="m${idx}">${q.choices.map(c=>`<option>${c}</option>`).join('')}</select></label>`;}); html+=`<div class="actions"><button class="primary" onclick="${handler}('match')">送出答案</button></div>`; }
  if(q.type==='short')html+=`<textarea id="shortAns" placeholder="請寫下你會怎麼說。沒有唯一標準答案，先寫出你的臨床想法。"></textarea><div class="actions"><button class="primary" onclick="${handler}('short')">送出回答</button></div>`;
  html+=`<div id="feedback" class="feedback hidden"></div>`; card.innerHTML=html;
}
function getMatchAnswer(q){ return q.pairs.map((p,i)=>`${i+1}. ${document.getElementById(`m${i}`).value}`).join('；'); }
function addRecord({section,caseName='',q,answer,correct=null}){
  state.answerRecords.push({section,caseName,title:q.title,prompt:q.prompt,type:q.type,answer,correct,reference:q.type==='single'?`${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}`:q.type==='match'?q.pairs.map((p,i)=>`${i+1}. ${p.right}`).join('；'):(q.better||q.sample||''),feedback:q.feedback||'',skills:q.skills||[],time:new Date().toLocaleString('zh-TW')});
}
function answerQuiz(ans){
  const q=COURSE.quiz[state.quizIndex]; let correct=false,selectedLabel='';
  if(q.type==='single'){correct=ans===q.answer;selectedLabel=`${String.fromCharCode(65+ans)}. ${q.options[ans]}`;}
  if(q.type==='match'){selectedLabel=getMatchAnswer(q);correct=q.pairs.every((p,i)=>document.getElementById(`m${i}`).value===p.right);}
  addRecord({section:'技巧小測驗',q,answer:selectedLabel,correct});
  showFeedback({correct,q,selectedLabel,next:()=>{state.quizIndex++;if(state.quizIndex>=COURSE.quiz.length)startCases();else renderQuiz();}});
}
function startCases(){state.mode='initial';state.selectedCases=shuffle(COURSE.cases).slice(0,2);state.caseIndex=0;state.qIndex=0;state.screen='caseIntro';render();}
function renderCaseMap(){
  setSteps(3); const list=COURSE.cases.map(c=>{const done=state.completedCases.includes(c.name),score=state.caseScores[c.name];return `<button class="case-card ${done?'done':''}" onclick="startSpecificCase('${encodeURIComponent(c.name)}')"><b>${done?'✅ ':'□ '}${c.name}</b><small>${c.learning}</small>${score?`<em>客觀題：${score.correct}/${score.total}</em>`:''}</button>`;}).join('');
  card.innerHTML=`<div class="tag">案例總表</div><h2>選擇想練習的案例</h2><p class="lead">你已完成系統安排的 2 個主線案例，可從下方自由選擇其他案例繼續練習。</p><div class="legend"><span>✅ 已完成</span><span>□ 未完成</span></div><div class="case-list">${list}</div><div class="actions"><button class="ghost" onclick="state.screen='finish';render();">查看學習成果</button></div>`;
}
function continueMainCases(){const next=state.selectedCases.findIndex(c=>!state.completedCases.includes(c.name));if(next>=0){state.caseIndex=next;state.screen='caseIntro';state.qIndex=0;render();}else{state.screen='finish';render();}}
function startSpecificCase(encodedName){const name=decodeURIComponent(encodedName),c=COURSE.cases.find(x=>x.name===name);if(!c)return;state.mode='extra';state.selectedCases=[c];state.caseIndex=0;state.qIndex=0;state.screen='caseIntro';render();}
function renderCaseIntro(){setSteps(4);const c=state.selectedCases[state.caseIndex];state.currentCaseCorrect=0;state.currentCaseTotal=0;const status=state.completedCases.includes(c.name)?'已完成，可重複練習':(state.mode==='extra'?'延伸案例':'主線案例');card.innerHTML=`<div class="tag">${status}</div><h2>${c.name}</h2><p class="lead">${c.background}</p><div class="mini"><b>本案例學習重點：</b>${c.learning}</div><div class="mini"><b>資料來源：</b>${c.source}</div><div class="actions">${btn('開始本案例','startCaseQuestions()')}${state.mode==='extra'?`<button class="ghost" onclick="state.screen='map';render();">返回案例總表</button>`:''}</div>`;}
function startCaseQuestions(){state.screen='caseQ';state.qIndex=0;render();}
function renderCaseQ(){const c=state.selectedCases[state.caseIndex],q=c.questions[state.qIndex];renderQuestion({...q,title:`${c.name}｜${q.title}（${state.qIndex+1}/${c.questions.length}）`},'answerCase');}
function answerCase(ans){
  const c=state.selectedCases[state.caseIndex],q=c.questions[state.qIndex]; let correct=null,selectedLabel='';
  if(q.type==='single'){correct=ans===q.answer;selectedLabel=`${String.fromCharCode(65+ans)}. ${q.options[ans]}`;state.currentCaseTotal++;if(correct)state.currentCaseCorrect++;}
  if(q.type==='short'){selectedLabel=(document.getElementById('shortAns').value||'').trim()||'未輸入內容';}
  addRecord({section:'案例演練',caseName:c.name,q,answer:selectedLabel,correct});
  showFeedback({correct,q,selectedLabel,next:()=>{state.qIndex++;if(state.qIndex>=c.questions.length){if(!state.completedCases.includes(c.name))state.completedCases.push(c.name);state.caseScores[c.name]={correct:state.currentCaseCorrect,total:state.currentCaseTotal};state.screen='caseSummary';}render();}});
}
function showFeedback({correct,q,selectedLabel,next}){
  if(correct!==null){state.total++;if(correct)state.score++;}
  const fb=document.getElementById('feedback'); fb.className=`feedback ${correct===false?'review':'good'}`;
  let reference='',analysis=q.feedback||'';
  if(q.type==='single'){
    const idx=q.options.findIndex((_,i)=>`${String.fromCharCode(65+i)}. ${q.options[i]}`===selectedLabel);
    reference=`<p><b>參考答案：</b>${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}</p>`;
    // 技巧小測驗保留選項層級解析；案例演練只呈現整體解析，避免資訊重複。
    if(state.screen==='quiz'&&q.optionExplanations&&idx>=0) analysis=`${analysis}<br><br>${q.optionExplanations[idx]}`;
  }
  if(q.type==='match') reference=`<p><b>參考配對：</b>${q.pairs.map((p,i)=>`${i+1}. ${p.right}`).join('；')}</p>`;
  const preferred=q.better||q.sample||'';
  let heading='💬 回饋與解析'; if(correct===true)heading='✅ 判斷合適'; if(correct===false)heading='🔎 再想一想';
  const isCase=state.screen==='caseQ';
  let feedbackBody='';
  if(isCase&&q.type==='single'){
    feedbackBody=`<p><b>你的選擇：</b>${selectedLabel}</p>${reference}<p><b>解析：</b>${analysis}</p>`;
  }else{
    feedbackBody=`${q.type==='short'?`<p><b>你的回答：</b><br>${esc(selectedLabel)}</p>`:correct===false?`<p><b>你的選擇：</b>${selectedLabel}</p>`:''}${q.type!=='short'&&correct===false?reference:''}<p><b>${q.type==='short'?'思考重點':'解析'}：</b>${analysis}</p>${q.type==='short'&&preferred?`<p><b>較佳說法：</b><br>${preferred}</p>`:q.better?`<p><b>較佳說法：</b><br>${q.better}</p>`:''}`;
  }
  fb.innerHTML=`<h3>${heading}</h3>${feedbackBody}${skillTags(q.skills)}<div class="actions"><button class="primary" id="nextBtn">繼續</button></div>`;
  document.getElementById('nextBtn').onclick=next; document.querySelectorAll('.option,select,textarea').forEach(el=>el.disabled=true);
}
function renderCaseSummary(){setSteps(4);const c=state.selectedCases[state.caseIndex],score=state.caseScores[c.name]||{correct:state.currentCaseCorrect,total:state.currentCaseTotal},skills=[...new Set(c.questions.flatMap(q=>q.skills||[]))];card.innerHTML=`<div class="tag">🎉 案例完成</div><h2>${c.name}</h2><p class="lead">客觀題判斷：<b>${score.correct}/${score.total}</b>；開放性問答不計對錯。</p><h3>本案例學習到</h3>${skillTags(skills)}<div class="grid"><div class="mini">臨床重點：先找出病人真正卡住的地方，再選擇合適的溝通技巧。</div><div class="mini">衛教目標：讓病人願意說、聽得懂、做得到，最後能回覆示教。</div></div><div class="actions"><button class="primary" onclick="afterCaseNext()">繼續</button></div>`;}
function afterCaseNext(){if(state.mode==='initial'){const next=state.selectedCases.findIndex(c=>!state.completedCases.includes(c.name));if(next>=0){state.caseIndex=next;state.qIndex=0;state.screen='caseIntro';}else state.screen='map';}else state.screen='map';render();}
function renderFinish(){
  setSteps(5); const pct=state.total?Math.round(state.score/state.total*100):0,remaining=COURSE.cases.filter(c=>!state.completedCases.includes(c.name));
  card.innerHTML=`<div class="tag">🏆 學習成果</div><h2>目前學習完成</h2><p class="lead">客觀題答對：<b>${state.score}/${state.total}</b>${state.total?`（${pct}%）`:''}</p><p class="lead">完成案例：<b>${state.completedCases.length}/${COURSE.cases.length}</b></p><div class="case-list">${COURSE.cases.map(c=>`<button class="case-card ${state.completedCases.includes(c.name)?'done':''}" onclick="startSpecificCase('${encodeURIComponent(c.name)}')"><b>${state.completedCases.includes(c.name)?'✅ ':'□ '}${c.name}</b><small>${c.learning}</small>${state.caseScores[c.name]?`<em>客觀題：${state.caseScores[c.name].correct}/${state.caseScores[c.name].total}</em>`:''}</button>`).join('')}</div><h3>作答紀錄</h3><p>可查看本次技巧測驗與案例演練的實際回答，並列印或另存為 PDF，方便後續師生討論。</p><div class="actions"><button class="primary" onclick="state.screen='records';render();">查看我的作答紀錄</button></div>${remaining.length?`<div class="notice">尚未完成案例：${remaining.map(c=>c.name).join('、')}</div>`:'<div class="notice">所有案例皆已完成。</div>'}`;
}
function renderRecords(){
  setSteps(5); const rows=state.answerRecords.length?state.answerRecords.map((r,i)=>`<article class="record"><div class="record-head"><b>${i+1}. ${esc(r.section)}${r.caseName?`｜${esc(r.caseName)}`:''}</b><small>${esc(r.time)}</small></div><p><b>題目：</b>${esc(r.prompt)}</p><p><b>我的回答：</b><br>${esc(r.answer)}</p>${r.reference?`<p><b>${r.type==='short'?'較佳說法':'參考答案'}：</b><br>${esc(r.reference)}</p>`:''}${r.feedback?`<p><b>學習重點：</b>${esc(r.feedback)}</p>`:''}${r.skills?.length?`<p><b>相關技巧：</b>${r.skills.map(esc).join('、')}</p>`:''}</article>`).join(''):`<div class="notice">目前還沒有作答紀錄。</div>`;
  card.innerHTML=`<div class="tag">🧾 作答紀錄</div><h2>我的學習與作答紀錄</h2><p class="lead">此頁整理本次實際作答內容，可提供教師後續回饋討論。開放性問答不判定對錯。</p><div class="record-list">${rows}</div><div class="actions no-print"><button class="primary" onclick="window.print()">列印／另存 PDF</button><button class="ghost" onclick="state.screen='finish';render();">返回學習成果</button></div>`;
}
function restart(){closeMobileNav();state=defaultState();clearSavedState();render();}
if(!loadState())state=defaultState(); render();
