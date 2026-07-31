(function(){
'use strict';
const $=id=>document.getElementById(id);
const clone=o=>JSON.parse(JSON.stringify(o));
const defaults={
  brief:{title:'Reimagining the ski pole for more effective use',purpose:'Use the unused space inside a ski pole to combine useful tools, interchangeable components and skiing feedback.',impact:'Create a useful product for skiers, reduce plastic waste, and learn how physical components and AI can work together.',question:'How might I reimagine the ski pole to reduce environmental impact, help skiers improve, and allow them to carry less gear?',steps:'Create success criteria and a materials list. Contact Jeremy. Research basket attachment systems, recycled plastic, sensors and AI coaching.'},
  materials:[
    {id:1,name:'Bamboo shaft',qty:'2 lengths',purpose:'Main pole body',status:'Needed'},
    {id:2,name:'Recycled HDPE sheet',qty:'1 sheet',purpose:'Prototype basket',status:'Needed'},
    {id:3,name:'Ski-pole ferrule and tip',qty:'1 set',purpose:'Lower pole connection',status:'Needed'}
  ],
  kwl:{know:['A ski pole needs a handle, strong shaft, basket and tip.','A recycled-plastic basket can be prototyped from a flat sheet.'],want:['How can baskets be quickly swapped?','How can sensors give useful skiing feedback?'],learnt:[]},
  tasks:[{id:11,text:'Research current ski-pole basket connectors',stage:'Research'},{id:12,text:'Contact Jeremy',stage:'Research'},{id:13,text:'Prototype a recycled-plastic basket',stage:'Prototype'}],
  sources:[],events:[]
};
function load(){
  try{
    const raw=JSON.parse(localStorage.getItem('skiPoleOS')||'null');
    if(!raw)return clone(defaults);
    return {
      brief:{...defaults.brief,...(raw.brief||{})},
      materials:Array.isArray(raw.materials)?raw.materials:clone(defaults.materials),
      kwl:{know:raw.kwl?.know||clone(defaults.kwl.know),want:raw.kwl?.want||clone(defaults.kwl.want),learnt:raw.kwl?.learnt||[]},
      tasks:Array.isArray(raw.tasks)?raw.tasks.map((t,i)=>({id:t.id||Date.now()+i,...t})):clone(defaults.tasks),
      sources:Array.isArray(raw.sources)?raw.sources:[],
      events:Array.isArray(raw.events)?raw.events.map((e,i)=>({id:e.id||Date.now()+i,...e})):[]
    };
  }catch(err){console.error('Could not load saved project',err);return clone(defaults)}
}
let state=load();let monthCursor=new Date();
function save(){localStorage.setItem('skiPoleOS',JSON.stringify(state));renderAll()}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function makeId(){return Date.now()+Math.floor(Math.random()*10000)}
function initNav(){
  const tabs=[['overview','Overview'],['brief','Project brief'],['materials','Materials'],['kwl','KWL'],['tasks','Tasks'],['sources','Sources'],['calendar','Calendar'],['ai','Project AI']];
  $('nav').innerHTML=tabs.map((t,i)=>`<button class="${i===0?'active':''}" data-page="${t[0]}">${t[1]}</button>`).join('');
  document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('[data-page]').forEach(b=>b.classList.remove('active'));
    $(button.dataset.page).classList.add('active');button.classList.add('active');
  }));
}
function renderMaterials(){
  $('materialList').innerHTML=state.materials.length?state.materials.map(m=>`<div class="list-item"><button class="delete" data-delete-material="${m.id}" aria-label="Delete material">×</button><strong>${escapeHtml(m.name)}</strong><br><small>${escapeHtml(m.qty||'No quantity')} · ${escapeHtml(m.purpose||'No purpose')}</small><br><select class="status-select" data-material-status="${m.id}"><option ${m.status==='Needed'?'selected':''}>Needed</option><option ${m.status==='Ordered'?'selected':''}>Ordered</option><option ${m.status==='Have it'?'selected':''}>Have it</option><option ${m.status==='Tested'?'selected':''}>Tested</option></select></div>`).join(''):'<div class="empty">No materials yet.</div>';
  document.querySelectorAll('[data-delete-material]').forEach(b=>b.addEventListener('click',()=>{state.materials=state.materials.filter(m=>String(m.id)!==b.dataset.deleteMaterial);save()}));
  document.querySelectorAll('[data-material-status]').forEach(s=>s.addEventListener('change',()=>{const m=state.materials.find(x=>String(x.id)===s.dataset.materialStatus);if(m){m.status=s.value;save()}}));
}
function renderKWL(){['know','want','learnt'].forEach(kind=>{$(kind+'List').innerHTML=state.kwl[kind].length?state.kwl[kind].map((text,i)=>`<div class="list-item"><button class="delete" data-delete-kwl="${kind}:${i}">×</button>${escapeHtml(text)}</div>`).join(''):'<div class="empty">Nothing added yet.</div>'});document.querySelectorAll('[data-delete-kwl]').forEach(b=>b.addEventListener('click',()=>{const[k,i]=b.dataset.deleteKwl.split(':');state.kwl[k].splice(Number(i),1);save()}))}
function renderTasks(){$('taskList').innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="list-item"><button class="delete" data-delete-task="${t.id}">×</button><strong>${escapeHtml(t.text)}</strong><br><small>${escapeHtml(t.stage)}</small></div>`).join(''):'<div class="empty">No tasks yet.</div>';document.querySelectorAll('[data-delete-task]').forEach(b=>b.addEventListener('click',()=>{state.tasks=state.tasks.filter(t=>String(t.id)!==b.dataset.deleteTask);save()}))}
function renderSources(){$('sourceList').innerHTML=state.sources.length?state.sources.map(s=>`<div class="list-item"><button class="delete" data-delete-source="${s.id}">×</button><strong>${escapeHtml(s.title)}</strong><br><small>${escapeHtml(s.claim||'')}</small>${s.url?`<br><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">Open source</a>`:''}</div>`).join(''):'<div class="empty">No sources saved yet.</div>';document.querySelectorAll('[data-delete-source]').forEach(b=>b.addEventListener('click',()=>{state.sources=state.sources.filter(s=>String(s.id)!==b.dataset.deleteSource);save()}))}
function renderCalendar(){
  $('monthLabel').textContent=monthCursor.toLocaleDateString('en-NZ',{month:'long',year:'numeric'});
  const first=new Date(monthCursor.getFullYear(),monthCursor.getMonth(),1),offset=(first.getDay()+6)%7,start=new Date(first);start.setDate(first.getDate()-offset);const today=localISO(new Date());$('calendarGrid').innerHTML='';
  for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const date=localISO(d),events=state.events.filter(e=>e.date===date),button=document.createElement('button');button.className=`day ${d.getMonth()!==monthCursor.getMonth()?'outside ':''}${date===today?'today':''}`;button.innerHTML=`<strong>${d.getDate()}</strong>${events.map(e=>`<span class="event-chip">${escapeHtml(e.time||'')} ${escapeHtml(e.title)}</span>`).join('')}`;button.addEventListener('click',()=>{$('eventDate').value=date});$('calendarGrid').appendChild(button)}
  const upcoming=state.events.filter(e=>e.date>=today).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,12);
  $('upcomingList').innerHTML=upcoming.length?upcoming.map(e=>`<div class="list-item"><button class="delete" data-delete-event="${e.id}">×</button><strong>${escapeHtml(e.title)}</strong><br><small>${escapeHtml(e.date)} ${escapeHtml(e.time||'')} · ${escapeHtml(e.type)}</small></div>`).join(''):'<div class="empty">No upcoming events.</div>';
  document.querySelectorAll('[data-delete-event]').forEach(b=>b.addEventListener('click',()=>{state.events=state.events.filter(e=>String(e.id)!==b.dataset.deleteEvent);save()}));
}
function renderAll(){
  $('briefTitle').value=state.brief.title;$('briefPurpose').value=state.brief.purpose;$('briefImpact').value=state.brief.impact;$('briefQuestion').value=state.brief.question;$('briefSteps').value=state.brief.steps;
  $('metricMaterials').textContent=state.materials.length;$('metricTasks').textContent=state.tasks.length;$('metricEvents').textContent=state.events.length;
  renderMaterials();renderKWL();renderTasks();renderSources();renderCalendar();
}
function bind(){
  $('poleImage').addEventListener('error',()=>{$('poleImage').hidden=true;$('imageFallback').hidden=false});
  $('saveBrief').addEventListener('click',()=>{state.brief={title:$('briefTitle').value,purpose:$('briefPurpose').value,impact:$('briefImpact').value,question:$('briefQuestion').value,steps:$('briefSteps').value};save()});
  $('addMaterial').addEventListener('click',()=>{const name=$('materialName').value.trim();if(!name)return;state.materials.push({id:makeId(),name,qty:$('materialQty').value.trim(),purpose:$('materialPurpose').value.trim(),status:$('materialStatus').value});$('materialName').value=$('materialQty').value=$('materialPurpose').value='';save()});
  document.querySelectorAll('[data-add-kwl]').forEach(b=>b.addEventListener('click',()=>{const kind=b.dataset.addKwl,input=$(kind+'Input'),text=input.value.trim();if(text){state.kwl[kind].push(text);input.value='';save()}}));
  $('addTask').addEventListener('click',()=>{const text=$('taskText').value.trim();if(text){state.tasks.push({id:makeId(),text,stage:$('taskStage').value});$('taskText').value='';save()}});
  $('addSource').addEventListener('click',()=>{const title=$('sourceTitle').value.trim();if(title){state.sources.push({id:makeId(),title,url:$('sourceUrl').value.trim(),claim:$('sourceClaim').value.trim()});$('sourceTitle').value=$('sourceUrl').value=$('sourceClaim').value='';save()}});
  $('addEvent').addEventListener('click',()=>{const title=$('eventTitle').value.trim(),date=$('eventDate').value;if(title&&date){state.events.push({id:makeId(),title,date,time:$('eventTime').value,type:$('eventType').value});$('eventTitle').value=$('eventTime').value='';save()}});
  $('previousMonth').addEventListener('click',()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()-1,1);renderCalendar()});$('nextMonth').addEventListener('click',()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,1);renderCalendar()});
}
window.ProjectOS={getState:()=>state,save,makeId,localISO,setMonth:d=>{monthCursor=new Date(d.getFullYear(),d.getMonth(),1);renderCalendar()},renderAll};
initNav();bind();$('eventDate').value=localISO(new Date());renderAll();
})();
