const STORAGE_KEY = 'pgy_inhaler_learning_v33';
const defaultState = () => ({
  screen:'intro', skillIndex:0, quizIndex:0, selectedCases:[], completedCases:[], caseIndex:0, qIndex:0,
  score:0, total:0, mode:'initial', caseScores:{}, currentCaseCorrect:0, currentCaseTotal:0,
  returnTo:null, hasSavedProgress:false
});
let state = defaultState();
const card = document.getElementById('card');
const stepList = document.getElementById('stepList');
const progressText = document.getElementById('progressText');
const barFill = document.getElementById('barFill');
document.getElementById('restartBtn').onclick = restart;

function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const saved = JSON.parse(raw);
    state = Object.assign(defaultState(), saved, { hasSavedProgress:true, returnTo:null });
    return true;
  } catch(e) { return false; }
}
function clearSavedState(){
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
}
function preserveReturnPoint(){
  if(['caseQ','caseIntro','caseSummary'].includes(state.screen)){
    state.returnTo = {
      screen: state.screen,
      selectedCases: state.selectedCases,
      caseIndex: state.caseIndex,
      qIndex: state.qIndex,
      mode: state.mode,
      currentCaseCorrect: state.currentCaseCorrect,
      currentCaseTotal: state.currentCaseTotal
    };
  }
}
function restoreReturnPoint(){
  if(!state.returnTo) return false;
  const r = state.returnTo;
  state.screen = r.screen || 'caseQ';
  state.selectedCases = r.selectedCases || state.selectedCases;
  state.caseIndex = r.caseIndex || 0;
  state.qIndex = r.qIndex || 0;
  state.mode = r.mode || state.mode;
  state.currentCaseCorrect = r.currentCaseCorrect || 0;
  state.currentCaseTotal = r.currentCaseTotal || 0;
  state.returnTo = null;
  render();
  return true;
}
function goIntro(){ preserveReturnPoint(); state.screen='intro'; render(); }
function goCourseIntro(){ preserveReturnPoint(); state.screen='intro'; render(); }
function goSkills(){ preserveReturnPoint(); state.screen='skill'; state.skillIndex=0; render(); }
function goQuiz(){ preserveReturnPoint(); state.screen='quiz'; state.quizIndex=0; render(); }
function goCaseMap(){ preserveReturnPoint(); state.screen='map'; render(); }
function goCasePractice(){
  if(['caseIntro','caseQ','caseSummary'].includes(state.screen)){ render(); return; }
  if(state.returnTo){ restoreReturnPoint(); return; }
  if(state.selectedCases && state.selectedCases.length){ continueMainCases(); return; }
  state.screen='map'; render();
}
function goFinish(){ preserveReturnPoint(); state.screen='finish'; render(); }
function goStep(i){
  const actions = [goCourseIntro, goSkills, goQuiz, goCaseMap, goCasePractice, goFinish];
  if(actions[i]) actions[i]();
}

function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function btn(text, fn, cls='primary'){ return `<button class="${cls}" onclick="${fn}">${text}</button>`; }
function esc(s){ return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function skillTags(skills=[]){ return skills.length ? `<div class="skill-tags">${skills.map(s=>`<span>🏷️ ${esc(s)}</span>`).join('')}</div>` : ''; }
function setSteps(active){
  const steps = [
    {label:'📖 課程介紹'},
    {label:'💬 溝通技巧'},
    {label:'📝 技巧小測驗'},
    {label:'🗺️ 案例地圖'},
    {label:'🎭 案例演練'},
    {label:'🏆 完成回饋'}
  ];
  stepList.innerHTML = steps.map((s,i)=>`<li class="${i===active?'active':''} ${i<active?'done':''}" onclick="goStep(${i})" role="button" tabindex="0">${s.label}</li>`).join('');
  progressText.textContent = (steps[active] && steps[active].label.replace(/^[^一-龥A-Za-z]+\s*/, '')) || '完成';
  barFill.style.width = `${Math.min(100, (active)/(steps.length-1)*100)}%`;
}
function render(){
  if(state.screen==='intro') renderIntro();
  if(state.screen==='skill') renderSkill();
  if(state.screen==='quiz') renderQuiz();
  if(state.screen==='map') renderCaseMap();
  if(state.screen==='caseIntro') renderCaseIntro();
  if(state.screen==='caseQ') renderCaseQ();
  if(state.screen==='caseSummary') renderCaseSummary();
  if(state.screen==='finish') renderFinish();
  saveState();
}
function renderIntro(){
  setSteps(0);
  const i = COURSE.intro;
  const resume = state.completedCases.length || state.total || state.returnTo ? `<div class="notice"><b>歡迎回來</b><br>已完成案例：${state.completedCases.length}/${COURSE.cases.length}｜累積作答：${state.score}/${state.total}<div class="actions compact"><button class="primary" onclick="continueLearning()">繼續學習</button><button class="ghost" onclick="restart()">重新開始</button></div></div>` : '';
  const returnBtn = state.returnTo ? `<button class="ghost" onclick="restoreReturnPoint()">⬅ 返回剛剛的案例</button>` : '';
  card.innerHTML = `<div class="tag">${COURSE.version.replace('v3.0','v3.2')}</div><h2>${i.heading}</h2><p class="lead">${i.text}</p>${resume}<div class="grid">${i.bullets.map(b=>`<div class="mini">${b}</div>`).join('')}</div><div class="notice">教材來源：吸入劑衛教與藥師病房溝通案例簡報。請勿輸入病人個資。</div><div class="actions">${btn('開始學習','startCourse()')}<button class="ghost" onclick="showCaseMapOnly()">直接看案例庫</button>${returnBtn}</div>`;
}
function continueLearning(){
  if(state.returnTo){ restoreReturnPoint(); return; }
  if(state.completedCases.length || state.selectedCases.length){ state.screen='map'; render(); return; }
  startCourse();
}
function startCourse(){ state.screen='skill'; state.skillIndex=0; render(); }
function showCaseMapOnly(){ state.screen='map'; render(); }
function renderSkill(){
  setSteps(1);
  const s = COURSE.skills[state.skillIndex];
  const returnBtn = state.returnTo ? `<button class="ghost" onclick="restoreReturnPoint()">⬅ 返回剛剛的案例</button>` : '';
  card.innerHTML = `<div class="tag">溝通技巧 ${state.skillIndex+1}/${COURSE.skills.length} · ${s.tag}</div><h2>${s.name}</h2><p class="purpose">${s.purpose}</p><h3>藥師可以這樣說</h3><blockquote>${s.example}</blockquote><h3>比較不建議</h3><div class="avoid">${s.avoid}</div><div class="actions"><button class="ghost" onclick="prevSkill()" ${state.skillIndex===0?'disabled':''}>上一個</button><button class="primary" onclick="nextSkill()">${state.skillIndex===COURSE.skills.length-1?'進入小測驗':'下一個技巧'}</button>${returnBtn}</div>`;
}
function prevSkill(){ if(state.skillIndex>0){state.skillIndex--; render();} }
function nextSkill(){ if(state.skillIndex<COURSE.skills.length-1){state.skillIndex++;} else {state.screen='quiz'; state.quizIndex=0;} render(); }
function renderQuiz(){ setSteps(2); renderQuestion(COURSE.quiz[state.quizIndex], 'answerQuiz'); }
function renderQuestion(q, handler){
  let html = `<div class="tag">${q.title}</div><h2>${q.prompt}</h2>`;
  if(q.type==='single') html += `<div class="options">${q.options.map((o,i)=>`<button class="option" onclick="${handler}(${i})"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join('')}</div>`;
  if(q.type==='match'){
    html += `<p class="lead">選出每個情境最適合的技巧：</p>`;
    q.pairs.forEach((p,idx)=>{ html += `<label class="match"><b>${idx+1}. ${p.left}</b><select id="m${idx}">${q.choices.map(c=>`<option>${c}</option>`).join('')}</select></label>`; });
    html += `<div class="actions"><button class="primary" onclick="${handler}('match')">送出答案</button></div>`;
  }
  if(q.type==='short'){
    html += `<div class="hint">💡 提示：${q.hint}</div><textarea id="shortAns" placeholder="請寫下你會怎麼說。不用完美，臨床能用比較重要。"></textarea><div class="actions"><button class="primary" onclick="${handler}('short')">送出答案</button></div>`;
  }
  html += `<div id="feedback" class="feedback hidden"></div>`;
  card.innerHTML = html;
}
function answerQuiz(ans){
  const q=COURSE.quiz[state.quizIndex];
  let correct=false;
  let selectedLabel='';
  if(q.type==='single'){ correct = ans===q.answer; selectedLabel = `${String.fromCharCode(65+ans)}. ${q.options[ans]}`; }
  if(q.type==='match'){
    correct = q.pairs.every((p,i)=>document.getElementById(`m${i}`).value===p.right);
    selectedLabel = '配對題作答';
  }
  showFeedback({correct, q, selectedLabel, next:()=>{ state.quizIndex++; if(state.quizIndex>=COURSE.quiz.length){ startCases(); } else renderQuiz(); }});
}
function startCases(){
  state.mode='initial';
  state.selectedCases = shuffle(COURSE.cases).slice(0,2);
  state.caseIndex=0; state.qIndex=0;
  state.screen='map';
  render();
}
function renderCaseMap(){
  setSteps(3);
  const list = COURSE.cases.map(c=>{
    const done = state.completedCases.includes(c.name);
    const selected = state.selectedCases.some(x=>x.name===c.name);
    const score = state.caseScores[c.name];
    return `<button class="case-card ${done?'done':''} ${selected?'selected':''}" onclick="startSpecificCase('${encodeURIComponent(c.name)}')"><b>${done?'✅ ':selected?'🔓 ':'□ '}${c.name}</b><small>${c.learning}</small>${score?`<em>得分：${score.correct}/${score.total}</em>`:''}</button>`;
  }).join('');
  card.innerHTML = `<div class="tag">案例學習地圖</div><h2>選擇想練習的案例</h2><p class="lead">系統已隨機挑選 2 個案例作為本次主線；完成後可繼續挑戰其他案例。</p><div class="legend"><span>🔓 本次主線</span><span>✅ 已完成</span><span>□ 未完成</span></div><div class="case-list">${list}</div><div class="actions"><button class="primary" onclick="continueMainCases()">開始/繼續主線案例</button><button class="ghost" onclick="state.screen='finish'; render();">查看目前成果</button></div>`;
}
function continueMainCases(){
  const next = state.selectedCases.findIndex(c=>!state.completedCases.includes(c.name));
  if(next >= 0){ state.caseIndex=next; state.screen='caseIntro'; state.qIndex=0; render(); }
  else { state.screen='finish'; render(); }
}
function startSpecificCase(encodedName){
  const name = decodeURIComponent(encodedName);
  const c = COURSE.cases.find(x=>x.name===name);
  if(!c) return;
  state.mode = state.selectedCases.some(x=>x.name===name) ? 'initial' : 'extra';
  state.selectedCases = [c];
  state.caseIndex=0; state.qIndex=0; state.screen='caseIntro'; render();
}
function renderCaseIntro(){
  setSteps(4);
  const c=state.selectedCases[state.caseIndex];
  state.currentCaseCorrect=0; state.currentCaseTotal=0;
  const status = state.completedCases.includes(c.name) ? '已完成，可重複練習' : (state.mode==='extra' ? '延伸案例' : '主線案例');
  card.innerHTML = `<div class="tag">${status}</div><h2>${c.name}</h2><p class="lead">${c.background}</p><div class="mini"><b>本案例學習重點：</b>${c.learning}</div><div class="mini"><b>資料來源：</b>${c.source}</div><div class="actions">${btn('開始本案例','startCaseQuestions()')}<button class="ghost" onclick="state.screen='map'; render();">返回案例地圖</button></div>`;
}
function startCaseQuestions(){ state.screen='caseQ'; state.qIndex=0; render(); }
function renderCaseQ(){
  const c=state.selectedCases[state.caseIndex];
  const q=c.questions[state.qIndex];
  renderQuestion({...q, title:`${c.name}｜${q.title}（${state.qIndex+1}/${c.questions.length}）`}, 'answerCase');
}
function answerCase(ans){
  const c=state.selectedCases[state.caseIndex];
  const q=c.questions[state.qIndex];
  let correct=false;
  let selectedLabel='';
  if(q.type==='single'){ correct = ans===q.answer; selectedLabel = `${String.fromCharCode(65+ans)}. ${q.options[ans]}`; }
  if(q.type==='short'){
    const val=(document.getElementById('shortAns').value||'').trim();
    correct = val.length > 0 && q.keywords.some(k=>val.includes(k));
    selectedLabel = val ? esc(val) : '未輸入內容';
  }
  state.currentCaseTotal++;
  if(correct) state.currentCaseCorrect++;
  showFeedback({correct, q, selectedLabel, next:()=>{
    state.qIndex++;
    if(state.qIndex>=c.questions.length){
      if(!state.completedCases.includes(c.name)) state.completedCases.push(c.name);
      state.caseScores[c.name] = {correct:state.currentCaseCorrect, total:state.currentCaseTotal};
      state.screen='caseSummary';
    }
    render();
  }});
}
function showFeedback({correct, q, selectedLabel, next}){
  state.total++; if(correct) state.score++;
  const fb=document.getElementById('feedback');
  fb.className = `feedback ${correct?'good':'bad'}`;
  let correctText = '';
  let why = '';
  if(q.type==='single'){
    correctText = `<p><b>正確答案：</b>${String.fromCharCode(65+q.answer)}. ${q.options[q.answer]}</p>`;
    const idx = q.options.findIndex((_,i)=>`${String.fromCharCode(65+i)}. ${q.options[i]}` === selectedLabel);
    if(q.optionExplanations && idx>=0) why = `<div class="explain"><b>這個選項解析：</b>${q.optionExplanations[idx]}</div>`;
  }
  if(q.type==='short'){
    correctText = q.sample ? `<p><b>示範說法：</b><br>${q.sample}</p>` : '';
  }
  if(q.type==='match'){
    correctText = `<p><b>正確配對：</b>${q.pairs.map((p,i)=>`${i+1}. ${p.right}`).join('；')}</p>`;
  }
  const patient = correct ? q.patientGood : q.patientBad;
  fb.innerHTML = `
    <h3>${correct?'✅ 答對':'❌ 答錯'}</h3>
    ${!correct?`<p><b>你選擇：</b>${selectedLabel}</p>`:''}
    ${!correct?correctText:''}
    <p><b>解析：</b>${q.feedback}</p>
    ${why}
    ${q.better?`<p><b>較佳說法：</b><br>${q.better}</p>`:''}
    ${patient?`<div class="patient"><b>病人可能反應：</b><br>${patient}</div>`:''}
    ${skillTags(q.skills)}
    <div class="actions"><button class="primary" id="nextBtn">繼續</button></div>`;
  document.getElementById('nextBtn').onclick = next;
  document.querySelectorAll('.option, select, textarea').forEach(el=>el.disabled=true);
}
function renderCaseSummary(){
  setSteps(4);
  const c = state.selectedCases[state.caseIndex];
  const score = state.caseScores[c.name] || {correct:state.currentCaseCorrect, total:state.currentCaseTotal};
  const skills = [...new Set(c.questions.flatMap(q=>q.skills||[]))];
  card.innerHTML = `<div class="tag">🎉 案例完成</div><h2>${c.name}</h2><p class="lead">案例得分：<b>${score.correct}/${score.total}</b></p><h3>本案例學習到</h3>${skillTags(skills)}<div class="grid"><div class="mini">臨床重點：先找出病人真正卡住的地方，再選溝通技巧。不要直接把標準答案丟過去，病人不是 PDF 閱讀器。</div><div class="mini">衛教目標：讓病人願意說、聽得懂、做得到，最後能回覆試教。</div></div><div class="actions"><button class="primary" onclick="afterCaseNext()">繼續</button><button class="ghost" onclick="state.screen='map'; render();">回案例地圖</button></div>`;
}
function afterCaseNext(){
  if(state.mode==='initial'){
    const next = state.selectedCases.findIndex(c=>!state.completedCases.includes(c.name));
    if(next>=0){ state.caseIndex=next; state.qIndex=0; state.screen='caseIntro'; }
    else state.screen='finish';
  } else {
    state.screen='finish';
  }
  render();
}
function renderFinish(){
  setSteps(5);
  const pct = state.total ? Math.round(state.score/state.total*100) : 0;
  const remaining = COURSE.cases.filter(c=>!state.completedCases.includes(c.name));
  card.innerHTML = `<div class="tag">🏆 學習成果</div><h2>目前學習完成</h2><p class="lead">累積得分：<b>${state.score}/${state.total}</b>（${pct}%）</p><p class="lead">完成案例：<b>${state.completedCases.length}/${COURSE.cases.length}</b></p><div class="case-list">${COURSE.cases.map(c=>`<button class="case-card ${state.completedCases.includes(c.name)?'done':''}" onclick="startSpecificCase('${encodeURIComponent(c.name)}')"><b>${state.completedCases.includes(c.name)?'✅ ':'□ '}${c.name}</b><small>${c.learning}</small>${state.caseScores[c.name]?`<em>得分：${state.caseScores[c.name].correct}/${state.caseScores[c.name].total}</em>`:''}</button>`).join('')}</div><h3>還想繼續練習嗎？</h3><p>可以直接點上方案例繼續練習，或重新隨機挑戰 2 個案例。</p><div class="actions"><button class="primary" onclick="startCases()">重新隨機挑戰</button><button class="ghost" onclick="state.screen='map'; render();">回案例地圖</button>${btn('重新開始整個課程','restart()')}</div>${remaining.length?`<div class="notice">尚未完成案例：${remaining.map(c=>c.name).join('、')}</div>`:'<div class="notice">全部案例都完成了，這波很頂。</div>'}`;
}
function restart(){ state = defaultState(); clearSavedState(); render(); }
if(!loadState()) state = defaultState();
render();
