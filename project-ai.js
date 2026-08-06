(function(){
'use strict';
const $=id=>document.getElementById(id);
let api;
function bubble(text,type=''){const node=document.createElement('div');node.className=`bubble ${type}`;node.textContent=text;$('aiChat').appendChild(node);$('aiChat').scrollTop=$('aiChat').scrollHeight}
function nextWeekday(day,forceNext=false){const date=new Date();let difference=(day-date.getDay()+7)%7;if(difference===0&&forceNext)difference=7;date.setDate(date.getDate()+difference);return date}
function parseDate(text){
  const source=text.toLowerCase();const now=new Date();
  if(source.includes('day after tomorrow')){const date=new Date(now);date.setDate(date.getDate()+2);return date}
  if(source.includes('tomorrow')){const date=new Date(now);date.setDate(date.getDate()+1);return date}
  if(source.includes('today'))return now;
  let match=source.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);if(match)return new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
  const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for(let index=0;index<days.length;index++){if(source.includes(`next ${days[index]}`))return nextWeekday(index,true);if(new RegExp(`(?:this\\s+|on\\s+|for\\s+|by\\s+|to\\s+)?${days[index]}\\b`).test(source))return nextWeekday(index,false)}
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
  match=source.match(new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${months.join('|')})(?:\\s+(20\\d{2}))?`));
  if(match){let year=Number(match[3]||now.getFullYear());const date=new Date(year,months.indexOf(match[2]),Number(match[1]));if(!match[3]&&date<new Date(now.getFullYear(),now.getMonth(),now.getDate()))date.setFullYear(year+1);return date}
  return null;
}
function parseTime(text){let match=text.toLowerCase().match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);if(match){let hour=Number(match[1]);const minute=match[2]||'00';if(match[3]==='pm'&&hour<12)hour+=12;if(match[3]==='am'&&hour===12)hour=0;return`${String(hour).padStart(2,'0')}:${minute}`}match=text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);return match?`${match[1].padStart(2,'0')}:${match[2]}`:''}
function inferEventType(text){const source=text.toLowerCase();if(/deadline|due|submit|finish/.test(source))return'Deadline';if(/meet|interview|call|contact/.test(source))return'Meeting';if(/research|review|read/.test(source))return'Research';if(/prototype|build|design/.test(source))return'Prototype';if(/test|trial|score sample/.test(source))return'Testing';return'General'}
function inferTaskStage(text){const source=text.toLowerCase();if(/research|review|compare|find/.test(source))return'Research';if(/design|define|sketch|plan/.test(source))return'Design';if(/prototype|build|create sample/.test(source))return'Prototype';if(/test|trial|measure|validate/.test(source))return'Test';return'Research'}
function cleanEventTitle(text){return text.replace(/\b(could you|can you|please|add|schedule|create|put|book|remind me|calendar|event)\b/gi,' ').replace(/\b(today|tomorrow|day after tomorrow|next\s+\w+|this\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,' ').replace(/\b(?:at\s*)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi,' ').replace(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/g,' ').replace(/\s+/g,' ').trim().replace(/^(for|on|by|to)\s+/i,'')||'Project event'}
function findItem(items,query,fields){const needle=query.trim().toLowerCase();return items.find(item=>fields.some(field=>String(item[field]||'').toLowerCase().includes(needle)))}
function summary(state){const total=state.criteria.reduce((sum,item)=>sum+Number(item.weight||0),0);const open=state.tasks.filter(task=>task.stage!=='Done').length;return`The project has ${state.criteria.length} scoring criteria worth ${total}% in total, ${open} open tasks, ${state.research.length} research items, ${state.log.length} ideas or test entries, and ${state.events.length} calendar events. Current focus: ${state.brief.focus}`}
function nextStep(state){const high=state.tasks.find(task=>task.stage!=='Done'&&task.priority==='High')||state.tasks.find(task=>task.stage!=='Done');return high?`The clearest next step is: ${high.text}. It is currently in ${high.stage}.`:`There are no open tasks. Add a test or research task next.`}
function handleCommand(question){
  const state=api.getState();const lower=question.toLowerCase();let match;
  if(/summari[sz]e|project summary|how is my project/.test(lower))return bubble(summary(state));
  if(/what should i do next|next step|what next/.test(lower))return bubble(nextStep(state));
  if(/list (?:my )?scoring criteria|what are (?:my )?criteria|show criteria/.test(lower))return bubble(state.criteria.length?state.criteria.map(item=>`${item.name}: ${item.weight}% (${item.status})`).join('; '):'No scoring criteria are saved.');
  if(/list (?:my )?tasks|what tasks/.test(lower))return bubble(state.tasks.length?state.tasks.map(item=>`${item.text} [${item.stage}, ${item.priority}]`).join('; '):'No tasks are saved.');
  if(/list (?:my )?(?:calendar )?events|what events|what is on my calendar/.test(lower))return bubble(state.events.length?state.events.map(item=>`${item.date}: ${item.title}${item.time?' at '+item.time:''}`).join('; '):'No calendar events are saved.');

  match=question.match(/add\s+(?:a\s+)?(?:scoring\s+)?criterion\s+(.+?)\s+(?:with\s+)?weight\s+(\d{1,3})/i);
  if(match){const weight=Number(match[2]);if(weight>100)return bubble('A single criterion cannot be more than 100%.');state.criteria.push({id:api.makeId(),name:match[1].trim(),weight,description:'Added by Project AI. Click the pencil to add judging guidance.',status:'Draft'});api.save();bubble(`Added the criterion “${match[1].trim()}” with a ${weight}% weight.`,'success');return}
  match=question.match(/(?:set|change|update)\s+(?:the\s+)?(?:criterion\s+)?(.+?)\s+(?:to\s+)?(?:a\s+)?weight\s+(?:of\s+)?(\d{1,3})/i);
  if(match){const item=findItem(state.criteria,match[1],['name']);const weight=Number(match[2]);if(!item)return bubble('I could not find that scoring criterion.');if(weight>100)return bubble('The weight must be between 0 and 100%.');item.weight=weight;api.save();bubble(`Changed ${item.name} to ${weight}%.`,'success');return}

  match=question.match(/(?:add|create)\s+(?:a\s+)?task\s+(.+)/i)||question.match(/(?:add|create)\s+(.+?)\s+(?:to|in)\s+(?:my\s+|the\s+)?tasks?/i);
  if(match){const text=match[1].trim();state.tasks.push({id:api.makeId(),text,stage:inferTaskStage(text),priority:/urgent|important|high priority/i.test(question)?'High':'Medium'});api.save();bubble(`Added the task “${text}”.`,'success');return}
  match=question.match(/mark\s+(?:the\s+)?task\s+(.+?)\s+(?:as\s+)?done/i);
  if(match){const item=findItem(state.tasks,match[1],['text']);if(!item)return bubble('I could not find that task.');item.stage='Done';api.save();bubble(`Marked “${item.text}” as done.`,'success');return}

  match=question.match(/add\s+research\s+(.+?)\s+(?:with\s+)?link\s+(https?:\/\/\S+|www\.\S+)/i);
  if(match){state.research.push({id:api.makeId(),title:match[1].trim(),url:match[2],note:'Added by Project AI.',status:'To review'});api.save();bubble(`Saved “${match[1].trim()}” in Research & links.`,'success');return}
  match=question.match(/add\s+(idea|test|decision|learning)\s+(.+)/i);
  if(match){const type=match[1][0].toUpperCase()+match[1].slice(1).toLowerCase();state.log.push({id:api.makeId(),type,title:match[2].trim(),notes:'Added by Project AI.',result:''});api.save();bubble(`Added the ${type.toLowerCase()} “${match[2].trim()}”.`,'success');return}

  match=question.match(/(?:set|change|update)\s+(?:the\s+)?(project title|title|purpose|impact|driving question|question|current focus|focus|next steps|steps)\s+to\s+(.+)/i);
  if(match){const map={'project title':'title',title:'title',purpose:'purpose',impact:'impact','driving question':'question',question:'question','current focus':'focus',focus:'focus','next steps':'steps',steps:'steps'};const key=map[match[1].toLowerCase()];state.brief[key]=match[2].trim();api.save();bubble(`Updated the project ${match[1].toLowerCase()}.`,'success');return}

  match=question.match(/(?:move|reschedule)\s+(.+?)\s+(?:to|for)\s+(.+)/i);
  if(match){const date=parseDate(match[2]);if(!date)return bubble('I need a date such as next Friday, tomorrow, 14 August, or 2026-08-14.');const item=findItem(state.events,match[1],['title']);if(!item)return bubble('I could not find that calendar event.');item.date=api.localISO(date);const time=parseTime(match[2]);if(time)item.time=time;api.setMonth(date);api.save();bubble(`Moved “${item.title}” to ${date.toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${item.time?' at '+item.time:''}.`,'success');return}
  match=question.match(/delete\s+(?:the\s+)?event\s+(.+)/i);
  if(match){const item=findItem(state.events,match[1],['title']);if(!item)return bubble('I could not find that calendar event.');state.events.splice(state.events.indexOf(item),1);api.save();bubble(`Deleted “${item.title}” from the calendar.`,'success');return}
  const date=parseDate(question);const eventIntent=/(schedule|calendar|event|remind|meeting|interview|deadline|session|prototype|test|research)/i.test(question);
  if(eventIntent&&date){const item={id:api.makeId(),title:cleanEventTitle(question),date:api.localISO(date),time:parseTime(question),type:inferEventType(question)};state.events.push(item);api.setMonth(date);api.save();bubble(`Added “${item.title}” for ${date.toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${item.time?' at '+item.time:''}.`,'success');return}
  if(eventIntent&&!date)return bubble('I understood the event, but I need a date. Try “Schedule scoring test for next Friday at 3pm.”');

  if(/what research|list research/.test(lower))return bubble(state.research.length?state.research.map(item=>`${item.title} [${item.status}]`).join('; '):'No research items are saved.');
  if(/what ideas|list ideas|what tests|list tests/.test(lower))return bubble(state.log.length?state.log.map(item=>`${item.type}: ${item.title}`).join('; '):'No ideas or tests are saved.');
  bubble('I can update the brief, scoring criteria, tasks, research, ideas and tests, and the calendar. Try “Add criterion originality weight 15” or “Schedule judge comparison test for Monday at 2pm.”');
}
function process(){const input=$('aiInput');const question=input.value.trim();if(!question)return;bubble(question,'user');input.value='';handleCommand(question)}
function setPanel(open){$('aiPanel').hidden=!open;$('aiToggle').setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>$('aiInput').focus(),0)}
function init(){
  api=window.ParkScoreOS;if(!api)return;
  $('aiToggle').addEventListener('click',()=>setPanel($('aiPanel').hidden));
  $('aiClose').addEventListener('click',()=>setPanel(false));
  $('sendAI').addEventListener('click',process);
  $('aiInput').addEventListener('keydown',event=>{if(event.key==='Enter')process();if(event.key==='Escape')setPanel(false)});
  document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{$('aiInput').value=button.dataset.prompt;process()}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('aiPanel').hidden)setPanel(false)});
}
if(window.ParkScoreOS)init();else window.addEventListener('ParkScoreReady',init,{once:true});
})();
