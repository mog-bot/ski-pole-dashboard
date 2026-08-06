(function(){
'use strict';
const $=id=>document.getElementById(id);
const clone=value=>JSON.parse(JSON.stringify(value));
const STORAGE_KEY='parkScoreProjectOS_v1';
const defaults={
  brief:{
    title:'AI Ski Park Scoring System',
    purpose:'Design a clear and fair system that can score ski-park runs and explain why a run received its result.',
    impact:'Help riders understand their performance, make judging more consistent, and explore how AI could support human scoring.',
    question:'How might I create a ski-park scoring system that is fair, understandable and useful for both riders and judges?',
    focus:'Define the first scoring model and test it against sample runs.',
    steps:'Finish the scoring criteria and weights. Create several sample runs. Compare scores from different people. Record where the system feels unclear or unfair.'
  },
  criteria:[
    {id:101,name:'Execution',weight:25,description:'How cleanly and confidently the tricks and movements are completed.',status:'Draft'},
    {id:102,name:'Difficulty',weight:25,description:'The technical challenge and risk of the tricks, line and combinations.',status:'Draft'},
    {id:103,name:'Style & control',weight:20,description:'Body control, creativity, flow and how intentional the run looks.',status:'Draft'},
    {id:104,name:'Landing',weight:20,description:'Stability, balance and control when finishing each feature or trick.',status:'Draft'},
    {id:105,name:'Use of features',weight:10,description:'How effectively the rider uses the available park features and line.',status:'Draft'}
  ],
  tasks:[
    {id:201,text:'Research how existing ski-park competitions are judged',stage:'Research',priority:'High'},
    {id:202,text:'Define the first scoring categories and weights',stage:'Design',priority:'High'},
    {id:203,text:'Create sample runs for scoring tests',stage:'Prototype',priority:'Medium'},
    {id:204,text:'Test whether different judges produce similar scores',stage:'Test',priority:'Medium'}
  ],
  research:[
    {id:301,title:'Existing competition judging systems',url:'',note:'Compare the categories, scoring ranges and explanations used by current events.',status:'To review'}
  ],
  log:[
    {id:401,type:'Idea',title:'Explain every score',notes:'Show the total score and the contribution from each category.',result:'Prototype a score breakdown card.'}
  ],
  events:[]
};
let state;
let monthCursor=new Date();

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!saved)return clone(defaults);
    return{
      brief:{...defaults.brief,...(saved.brief||{})},
      criteria:Array.isArray(saved.criteria)?saved.criteria:clone(defaults.criteria),
      tasks:Array.isArray(saved.tasks)?saved.tasks:clone(defaults.tasks),
      research:Array.isArray(saved.research)?saved.research:clone(defaults.research),
      log:Array.isArray(saved.log)?saved.log:clone(defaults.log),
      events:Array.isArray(saved.events)?saved.events:[]
    };
  }catch(error){
    console.error('Could not load project data',error);
    return clone(defaults);
  }
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderAll()}
function makeId(){return Date.now()+Math.floor(Math.random()*10000)}
function localISO(date){return`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function safeUrl(value){
  const raw=String(value||'').trim();
  if(!raw)return'';
  const candidate=/^https?:\/\//i.test(raw)?raw:`https://${raw}`;
  try{const url=new URL(candidate);return/^https?:$/.test(url.protocol)?url.href:''}catch(error){return''}
}
function showEditor(id,show=true){$(id).hidden=!show;if(show)$(id).scrollIntoView({behavior:'smooth',block:'nearest'})}
function showPage(id){
  document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));
  document.querySelectorAll('[data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===id));
  const page=$(id);if(page)page.classList.add('active');
}
function initNav(){
  const tabs=[['overview','Overview'],['brief','Project brief'],['scoring','Scoring model'],['tasks','Tasks'],['research','Research & links'],['log','Ideas & testing'],['calendar','Calendar']];
  $('nav').innerHTML=tabs.map((tab,index)=>`<button type="button" class="${index===0?'active':''}" data-page="${tab[0]}">${tab[1]}</button>`).join('');
}
function renderOverview(){
  const totalWeight=state.criteria.reduce((sum,item)=>sum+Number(item.weight||0),0);
  const openTasks=state.tasks.filter(task=>task.stage!=='Done').length;
  const today=localISO(new Date());
  const upcoming=state.events.filter(event=>event.date>=today).length;
  $('metricCriteria').textContent=state.criteria.length;
  $('metricTasks').textContent=openTasks;
  $('metricEvents').textContent=upcoming;
  $('currentFocus').textContent=state.brief.focus||'Choose the next project focus.';
  $('currentNextStep').textContent=state.brief.steps||'Add a next step in the project brief.';
  $('weightTotal').textContent=totalWeight;
  $('weightFill').style.width=`${Math.min(totalWeight,100)}%`;
  $('weightMessage').textContent=totalWeight===100?'The current model adds up to 100%.':totalWeight<100?`${100-totalWeight}% is still unallocated.`:`The model is ${totalWeight-100}% over 100%.`;
}
function renderBrief(){
  const brief=state.brief;
  $('briefView').innerHTML=`
    <article class="card"><h2>${esc(brief.title)}</h2><p><strong>Purpose</strong><br>${esc(brief.purpose)}</p><p><strong>Intended impact</strong><br>${esc(brief.impact)}</p></article>
    <article class="card"><p><strong>Driving question</strong><br>${esc(brief.question)}</p><p><strong>Current focus</strong><br>${esc(brief.focus)}</p><p><strong>Next steps</strong><br>${esc(brief.steps)}</p></article>`;
}
function renderCriteria(){
  const total=state.criteria.reduce((sum,item)=>sum+Number(item.weight||0),0);
  $('criteriaWeightTotal').textContent=`${total}%`;
  $('criteriaWeightAdvice').textContent=total===100?'Ready for a balanced test.':total<100?`Add or increase ${100-total}% before testing the full model.`:`Reduce the total by ${total-100}% before testing.`;
  $('criterionList').innerHTML=state.criteria.length?state.criteria.map(item=>`
    <article class="criterion-card">
      <div class="criterion-weight">${Number(item.weight||0)}%</div>
      <h2>${esc(item.name)}</h2>
      <p>${esc(item.description||'No description yet.')}</p>
      <span class="badge">${esc(item.status||'Draft')}</span>
      <div class="criterion-actions"><button class="icon-button" type="button" data-edit-criterion="${item.id}" aria-label="Edit ${esc(item.name)}">✎</button><button class="icon-button" type="button" data-delete-criterion="${item.id}" aria-label="Delete ${esc(item.name)}">×</button></div>
    </article>`).join(''):'<div class="empty">No scoring criteria yet. Add the first one.</div>';
}
function taskRecord(task){
  const priorityClass=task.priority==='High'?'high':'';
  const doneClass=task.stage==='Done'?'done':'';
  return`<article class="record"><div class="record-main"><strong>${esc(task.text)}</strong><br><span class="badge ${doneClass}">${esc(task.stage)}</span><span class="badge ${priorityClass}">${esc(task.priority)} priority</span></div><div class="record-actions"><button class="icon-button" type="button" data-edit-task="${task.id}" aria-label="Edit task">✎</button><button class="icon-button" type="button" data-delete-task="${task.id}" aria-label="Delete task">×</button></div></article>`;
}
function renderTasks(){$('taskList').innerHTML=state.tasks.length?state.tasks.map(taskRecord).join(''):'<div class="empty">No tasks yet. Add the first one.</div>'}
function renderResearch(){
  $('researchList').innerHTML=state.research.length?state.research.map(item=>{
    const url=safeUrl(item.url);
    return`<article class="record"><div class="record-main"><strong>${esc(item.title)}</strong><p>${esc(item.note||'No notes yet.')}</p><span class="badge">${esc(item.status||'To review')}</span>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">Open link ↗</a>`:''}</div><div class="record-actions"><button class="icon-button" type="button" data-edit-research="${item.id}" aria-label="Edit research">✎</button><button class="icon-button" type="button" data-delete-research="${item.id}" aria-label="Delete research">×</button></div></article>`;
  }).join(''):'<div class="empty">No research saved yet.</div>';
}
function renderLog(){
  $('logList').innerHTML=state.log.length?state.log.map(item=>`<article class="record"><div class="record-main"><strong>${esc(item.title)}</strong><br><span class="badge">${esc(item.type)}</span><p>${esc(item.notes||'No notes yet.')}</p>${item.result?`<p><strong>Result / next action:</strong> ${esc(item.result)}</p>`:''}</div><div class="record-actions"><button class="icon-button" type="button" data-edit-log="${item.id}" aria-label="Edit entry">✎</button><button class="icon-button" type="button" data-delete-log="${item.id}" aria-label="Delete entry">×</button></div></article>`).join(''):'<div class="empty">No ideas or test results yet.</div>';
}
function renderCalendar(){
  const first=new Date(monthCursor.getFullYear(),monthCursor.getMonth(),1);
  const offset=(first.getDay()+6)%7;
  const start=new Date(first);start.setDate(first.getDate()-offset);
  const today=localISO(new Date());
  $('monthLabel').textContent=monthCursor.toLocaleDateString('en-NZ',{month:'long',year:'numeric'});
  $('calendarGrid').innerHTML='';
  for(let index=0;index<42;index++){
    const dateObject=new Date(start);dateObject.setDate(start.getDate()+index);
    const date=localISO(dateObject);
    const events=state.events.filter(event=>event.date===date);
    const button=document.createElement('button');
    button.type='button';button.dataset.pickDate=date;
    button.className=`day ${dateObject.getMonth()!==monthCursor.getMonth()?'outside ':''}${date===today?'today':''}`;
    button.innerHTML=`<strong>${dateObject.getDate()}</strong>${events.map(event=>`<span class="event-chip">${esc(event.time||'')} ${esc(event.title)}</span>`).join('')}`;
    $('calendarGrid').appendChild(button);
  }
  const upcoming=state.events.filter(event=>event.date>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,12);
  $('upcomingList').innerHTML=upcoming.length?upcoming.map(event=>`<article class="record"><div class="record-main"><strong>${esc(event.title)}</strong><p>${esc(event.date)} ${esc(event.time||'')} · ${esc(event.type)}</p></div><div class="record-actions"><button class="icon-button" type="button" data-edit-event="${event.id}" aria-label="Edit event">✎</button><button class="icon-button" type="button" data-delete-event="${event.id}" aria-label="Delete event">×</button></div></article>`).join(''):'<div class="empty">No upcoming events.</div>';
}
function renderAll(){renderOverview();renderBrief();renderCriteria();renderTasks();renderResearch();renderLog();renderCalendar()}

function openBrief(){const item=state.brief;$('briefTitle').value=item.title;$('briefQuestion').value=item.question;$('briefPurpose').value=item.purpose;$('briefImpact').value=item.impact;$('briefFocus').value=item.focus;$('briefSteps').value=item.steps;showEditor('briefEditor')}
function openCriterion(item=null){$('criterionEditorTitle').textContent=item?'Edit criterion':'Add criterion';$('criterionEditId').value=item?.id||'';$('criterionName').value=item?.name||'';$('criterionWeight').value=item?.weight??'';$('criterionStatus').value=item?.status||'Draft';$('criterionDescription').value=item?.description||'';showEditor('criterionEditor')}
function openTask(item=null){$('taskEditorTitle').textContent=item?'Edit task':'Add task';$('taskEditId').value=item?.id||'';$('taskText').value=item?.text||'';$('taskStage').value=item?.stage||'Research';$('taskPriority').value=item?.priority||'Medium';showEditor('taskEditor')}
function openResearch(item=null){$('researchEditorTitle').textContent=item?'Edit research':'Add research';$('researchEditId').value=item?.id||'';$('researchTitle').value=item?.title||'';$('researchUrl').value=item?.url||'';$('researchStatus').value=item?.status||'To review';$('researchNote').value=item?.note||'';showEditor('researchEditor')}
function openLog(item=null){$('logEditorTitle').textContent=item?'Edit entry':'Add entry';$('logEditId').value=item?.id||'';$('logType').value=item?.type||'Idea';$('logTitle').value=item?.title||'';$('logNotes').value=item?.notes||'';$('logResult').value=item?.result||'';showEditor('logEditor')}
function openEvent(item=null,date=''){const today=localISO(new Date());$('eventEditorTitle').textContent=item?'Edit event':'Add event';$('eventEditId').value=item?.id||'';$('eventTitle').value=item?.title||'';$('eventDate').value=item?.date||date||today;$('eventTime').value=item?.time||'';$('eventType').value=item?.type||'General';showEditor('eventEditor')}
function shouldDelete(label){return window.confirm(`Delete ${label}?`)}

function handleClick(event){
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.page){showPage(button.dataset.page);return}
  const action=button.dataset.action;
  if(action==='edit-brief')return openBrief();
  if(action==='cancel-brief')return showEditor('briefEditor',false);
  if(action==='save-brief'){state.brief={title:$('briefTitle').value.trim(),question:$('briefQuestion').value.trim(),purpose:$('briefPurpose').value.trim(),impact:$('briefImpact').value.trim(),focus:$('briefFocus').value.trim(),steps:$('briefSteps').value.trim()};showEditor('briefEditor',false);return save()}

  if(action==='open-add-criterion')return openCriterion();
  if(action==='close-criterion-editor')return showEditor('criterionEditor',false);
  if(action==='save-criterion'){
    const name=$('criterionName').value.trim();const weight=Number($('criterionWeight').value);
    if(!name)return alert('Please add a criterion name.');if(!Number.isFinite(weight)||weight<0||weight>100)return alert('Weight must be between 0 and 100.');
    const data={name,weight,description:$('criterionDescription').value.trim(),status:$('criterionStatus').value};const editId=$('criterionEditId').value;
    if(editId){const item=state.criteria.find(entry=>String(entry.id)===editId);if(item)Object.assign(item,data)}else state.criteria.push({id:makeId(),...data});showEditor('criterionEditor',false);return save();
  }
  if(button.dataset.editCriterion){const item=state.criteria.find(entry=>String(entry.id)===button.dataset.editCriterion);if(item)return openCriterion(item)}
  if(button.dataset.deleteCriterion&&shouldDelete('this criterion')){state.criteria=state.criteria.filter(entry=>String(entry.id)!==button.dataset.deleteCriterion);return save()}

  if(action==='open-add-task')return openTask();
  if(action==='close-task-editor')return showEditor('taskEditor',false);
  if(action==='save-task'){const text=$('taskText').value.trim();if(!text)return alert('Please add a task.');const data={text,stage:$('taskStage').value,priority:$('taskPriority').value};const editId=$('taskEditId').value;if(editId){const item=state.tasks.find(entry=>String(entry.id)===editId);if(item)Object.assign(item,data)}else state.tasks.push({id:makeId(),...data});showEditor('taskEditor',false);return save()}
  if(button.dataset.editTask){const item=state.tasks.find(entry=>String(entry.id)===button.dataset.editTask);if(item)return openTask(item)}
  if(button.dataset.deleteTask&&shouldDelete('this task')){state.tasks=state.tasks.filter(entry=>String(entry.id)!==button.dataset.deleteTask);return save()}

  if(action==='open-add-research')return openResearch();
  if(action==='close-research-editor')return showEditor('researchEditor',false);
  if(action==='save-research'){const title=$('researchTitle').value.trim();const enteredUrl=$('researchUrl').value.trim();if(!title)return alert('Please add a research title.');if(enteredUrl&&!safeUrl(enteredUrl))return alert('Please enter a valid web link.');const data={title,url:enteredUrl,note:$('researchNote').value.trim(),status:$('researchStatus').value};const editId=$('researchEditId').value;if(editId){const item=state.research.find(entry=>String(entry.id)===editId);if(item)Object.assign(item,data)}else state.research.push({id:makeId(),...data});showEditor('researchEditor',false);return save()}
  if(button.dataset.editResearch){const item=state.research.find(entry=>String(entry.id)===button.dataset.editResearch);if(item)return openResearch(item)}
  if(button.dataset.deleteResearch&&shouldDelete('this research item')){state.research=state.research.filter(entry=>String(entry.id)!==button.dataset.deleteResearch);return save()}

  if(action==='open-add-log')return openLog();
  if(action==='close-log-editor')return showEditor('logEditor',false);
  if(action==='save-log'){const title=$('logTitle').value.trim();if(!title)return alert('Please add a title.');const data={type:$('logType').value,title,notes:$('logNotes').value.trim(),result:$('logResult').value.trim()};const editId=$('logEditId').value;if(editId){const item=state.log.find(entry=>String(entry.id)===editId);if(item)Object.assign(item,data)}else state.log.push({id:makeId(),...data});showEditor('logEditor',false);return save()}
  if(button.dataset.editLog){const item=state.log.find(entry=>String(entry.id)===button.dataset.editLog);if(item)return openLog(item)}
  if(button.dataset.deleteLog&&shouldDelete('this entry')){state.log=state.log.filter(entry=>String(entry.id)!==button.dataset.deleteLog);return save()}

  if(action==='open-add-event')return openEvent();
  if(action==='close-event-editor')return showEditor('eventEditor',false);
  if(action==='save-event'){const title=$('eventTitle').value.trim();const date=$('eventDate').value;if(!title||!date)return alert('Please add an event title and date.');const data={title,date,time:$('eventTime').value,type:$('eventType').value};const editId=$('eventEditId').value;if(editId){const item=state.events.find(entry=>String(entry.id)===editId);if(item)Object.assign(item,data)}else state.events.push({id:makeId(),...data});monthCursor=new Date(`${date}T12:00:00`);showEditor('eventEditor',false);return save()}
  if(button.dataset.editEvent){const item=state.events.find(entry=>String(entry.id)===button.dataset.editEvent);if(item)return openEvent(item)}
  if(button.dataset.deleteEvent&&shouldDelete('this event')){state.events=state.events.filter(entry=>String(entry.id)!==button.dataset.deleteEvent);return save()}
  if(button.dataset.pickDate)return openEvent(null,button.dataset.pickDate);
}
function init(){
  state=load();initNav();document.addEventListener('click',handleClick);
  $('previousMonth').addEventListener('click',()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()-1,1);renderCalendar()});
  $('nextMonth').addEventListener('click',()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,1);renderCalendar()});
  window.ParkScoreOS={getState:()=>state,save,makeId,localISO,safeUrl,setMonth:date=>{monthCursor=new Date(date.getFullYear(),date.getMonth(),1)},showPage,renderAll};
  renderAll();window.dispatchEvent(new Event('ParkScoreReady'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
