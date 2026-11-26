import './style.css';
import { chapters, closing, endings, numbers, subtitle, tropes } from './story.js';
import { StorySession, preferences, savePreferences } from './session.js';
import { Stage } from './stage.js';
import { character, drawWorld, icon } from './art.js';
import { Soundtrack } from './audio.js';

const get = id => document.getElementById(id);
const view = get('view');
const session = new StorySession(chapters);
const storage = (()=>{ try { return window.localStorage; } catch { return null; } })();
const settings = preferences(storage, matchMedia('(prefers-reduced-motion: reduce)').matches);
const audio = new Soundtrack(settings.sound);
const stage = new Stage();
const held = new Set();
const pointers = new Map();
let mode, previousMode, dialogue, toastTimer, typing, timer;
let approach = false;
let toastQueue = [];

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className=className;
  if (text) node.textContent=text;
  return node;
};
function button(label, action, style) {
  const node=element('button',style,label);
  node.type='button';
  node.addEventListener('click',()=>{
    audio.unlock();
    audio.effect('select');
    action();
  });
  return node;
}

function setMode(next,content) {
  if(next!=='play') {
    held.clear();
    pointers.clear();
  }
  mode=next;
  stage.setActive(next==='play');
  view.replaceChildren(...(content?[content]:[]));
  get('hud').hidden=!['card','dialogue','play','event','pause'].includes(next);
  get('pause').hidden=!['dialogue','play','pause'].includes(next);
  get('pause').textContent=next==='pause'?'▶ Resume':'Ⅱ Pause';
  get('touch').hidden=next!=='play';
  get('key-guide').textContent=next==='play'?'← →  Move  ·  ↑  Jump  ·  E  Interact':'An original interactive Christmas movie';
}

function applySettings() {
  stage.reduced=settings.reduced;
  stage.dirty=true;
  document.documentElement.classList.toggle('reduced',settings.reduced);
  get('sound').setAttribute('aria-pressed',settings.sound);
  get('sound').textContent=settings.sound?'♫ Sound on':'♫ Sound off';
  get('motion').setAttribute('aria-pressed',settings.reduced);
  get('motion').textContent=settings.reduced?'Motion reduced':'Reduced motion';
}

function panel(label,title,copy,className='') {
  const wrap=element('div','card-wrap');
  const content=element('section','panel '+className);
  content.setAttribute('role','dialog');
  content.setAttribute('aria-label',title);
  if (className==='story-card') content.append(element('div','ornament','✶'));
  content.append(element('div','eyebrow',label),element('h2','',title));
  if(copy) content.append(element('p','',copy));
  const actions=element('div','actions');
  content.append(actions);
  wrap.append(content);
  return {wrap,actions};
}

function showMenu() {
  clearTimeout(timer);
  clearTimeout(toastTimer);
  clearInterval(typing);
  toastQueue=[];
  get('toast').hidden=true;
  stage.paused=false;
  stage.showMenu();
  audio.mood='quiet';
  dialogue=null;
  const hero=element('section','hero');
  const heading=element('h1','','Christmas on ');
  heading.append(element('span','','Mistletoe Lane'));
  const actions=element('div','actions');
  actions.append(button('Play Movie',start,'primary play'),button('How to Play',showHelp),button('Credits',showCredits));
  hero.append(heading,element('p','subtitle',subtitle),element('p','description','A five-minute interactive Christmas romance.'),actions);
  setMode('menu',hero);
}

function showHelp() {
  const {wrap,actions}=panel('Player guide','How to Play',
    'Walk with A / D or ← / →. Jump with W, ↑, or Space. Use E or Enter to interact and advance dialogue. Use 1, 2, or 3 to choose a response. Press Esc to pause. On touchscreens, use the buttons below the scene. Walk through glowing objects to collect them.');
  actions.append(button('Back',showMenu,'primary'));
  setMode('help',wrap);
  actions.firstChild.focus();
}
function showCredits() {
  const {wrap,actions}=panel('Evergreen Picture House','Credits',
    'An original story set in Evergreen Falls. The pixel scenery, characters, music, and sound effects are generated in the game. Built with Phaser 3.');
  actions.append(button('Back',showMenu,'primary'));
  setMode('help',wrap);
  actions.firstChild.focus();
}

function start() {
  clearTimeout(timer);
  clearTimeout(toastTimer);
  toastQueue=[];
  get('toast').hidden=true;
  stage.paused=false;
  audio.mood='quiet';
  session.restart();
  loadChapter();
}

function updateHud() {
  const chapter=session.chapter;
  get('chapter-number').textContent='Chapter '+numbers[session.index];
  get('chapter-title').textContent=chapter.title;
  get('objective').textContent=session.ready?chapter.destination:chapter.objective;
  get('inventory').replaceChildren(...chapter.items.map((item,index)=>{
    const acquired=session.collected.has(index);
    const canvas=element('canvas',acquired?'':'missing');
    canvas.width=canvas.height=22;
    canvas.title=item.name+(acquired?' · found':'');
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',canvas.title);
    icon(canvas.getContext('2d'),item.icon,11,11);
    return canvas;
  }));
  if(chapter.items.length) get('inventory').prepend(element('span','',session.collected.size+' / '+chapter.items.length));
  get('progress').replaceChildren(...chapters.map((_,index)=>element('i',index<=session.index?'done':'')));
  get('progress').setAttribute('aria-label','Chapter '+(session.index+1)+' of '+chapters.length);
}

function loadChapter() {
  approach=false;
  audio.mood=session.index===5?'festival':'quiet';
  stage.load(session);
  updateHud();
  const chapter=session.chapter;
  const {wrap,actions}=panel('Chapter '+numbers[session.index],chapter.title,chapter.location,'story-card');
  const enter=()=>showDialogue(chapter.intro,beginPlay);
  actions.append(button('Continue',enter,'primary'));
  setMode('card',wrap);
  actions.firstChild.focus();
}

function beginPlay() {
  dialogue=null;
  setMode('play');
  refreshPrompt(false);
}

function portrait(speaker) {
  const canvas=element('canvas','portrait');
  canvas.width=44;
  canvas.height=50;
  canvas.setAttribute('aria-hidden','true');
  const ctx=canvas.getContext('2d');
  if (speaker==='Narrator') icon(ctx,'book',22,23);
  else character(ctx,speaker,20,82,{scale:1.8});
  return canvas;
}

function showDialogue(lines,complete) {
  dialogue={lines:[...lines],index:0,complete,revealed:false};
  renderLine();
}

function renderLine() {
  clearInterval(typing);
  const line=dialogue.lines[dialogue.index];
  if(!line) {
    const complete=dialogue.complete;
    dialogue=null;
    complete();
    return;
  }
  const wrap=element('div','dialogue-wrap');
  const box=element('section','dialogue');
  box.setAttribute('role','dialog');
  box.setAttribute('aria-label',line.speaker+' dialogue');
  const content=element('div');
  const copy=element('p','',line.text);
  copy.setAttribute('aria-label',line.text);
  content.append(element('div','eyebrow',line.speaker==='Boss'?'Boss · Chicago calling':line.speaker),copy);
  let focus;
  if(line.choices) {
    const choices=element('div','choices');
    line.choices.forEach((choice,index)=>{
      const response=button((index+1)+'. '+choice.label,()=>choose(choice));
      choices.append(response);
    });
    focus=choices.firstChild;
    content.append(choices);
    dialogue.revealed=true;
  } else {
    focus=button('Continue ↵',advance,'advance');
    content.append(focus);
    let cursor=0;
    if(settings.reduced||dialogue.revealed) {
      dialogue.revealed=true;
    } else {
      copy.textContent='';
      typing=setInterval(()=>{
        cursor+=3;
        copy.textContent=line.text.slice(0,cursor);
        if(cursor>=line.text.length) {
          dialogue.revealed=true;
          clearInterval(typing);
        }
      },23);
    }
  }
  box.append(portrait(line.speaker),content);
  wrap.append(box);
  setMode('dialogue',wrap);
  focus.focus({preventScroll:true});
}

function advance() {
  if(mode!=='dialogue') return;
  const line=dialogue.lines[dialogue.index];
  if(line.choices) return;
  if(!dialogue.revealed) {
    clearInterval(typing);
    view.querySelector('.dialogue p').textContent=line.text;
    dialogue.revealed=true;
    return;
  }
  dialogue.index++;
  dialogue.revealed=false;
  if(stage.world==='kitchen'&&stage.event?.kind==='bake'&&dialogue.index===3) stage.jackLeaves();
  renderLine();
}

function choose(choice) {
  const reply=session.choose(choice);
  if(reply) dialogue.lines.splice(dialogue.index+1,0,{speaker:'Jack',text:reply});
  if(Number.isInteger(choice.ending)) {
    dialogue.lines.splice(dialogue.index+1,0,{speaker:'Jack',text:endings[choice.ending].reply});
  }
  dialogue.index++;
  dialogue.revealed=false;
  renderLine();
}

function refreshPrompt(near) {
  if(mode!=='play') return;
  const npc = stage.npcs.find(person=>person.name!==session.chapter.goal.npc&&
    ['Lucy','Margaret','Jack'].includes(person.name)&&Math.abs(person.x-stage.player.x)<23);
  const label=near ? (session.ready?'✦ '+session.chapter.goal.label+' · E':'Missing supplies · E') : npc ? 'Talk to '+npc.name+' · E' : '';
  if(approach===label) return;
  approach=label;
  view.replaceChildren(...(label?[button(label,interact,'prompt')]:[]));
}

const asides={
  Lucy:'Whatever you choose, Em, make sure it’s the life you want to wake up to.',
  Margaret:'If anyone asks, I had absolutely nothing to do with the mistletoe.',
  Jack:'Around here, directions are usually measured in cups of hot chocolate.'
};
function interact() {
  if(mode==='dialogue') { advance(); return; }
  if(mode!=='play') return;
  if(stage.distanceToGoal()<39) {
    if(session.ready) resolve();
    else showDialogue([{speaker:'Emily',text:'I still need '+session.chapter.items.filter((_,i)=>!session.collected.has(i)).map(item=>item.name.toLowerCase()).join(', ')+'.'}],beginPlay);
    return;
  }
  const npc=stage.npcs.find(p=>asides[p.name]&&Math.abs(p.x-stage.player.x)<23);
  if(npc) showDialogue([{speaker:npc.name,text:asides[npc.name]}],beginPlay);
}

function notify(ids) {
  if(!ids.length) return;
  toastQueue.push(ids);
  if(get('toast').hidden) nextToast();
}
function nextToast() {
  const toast=get('toast'), ids=toastQueue.shift();
  toast.hidden=!ids;
  if(!ids) return;
  audio.effect('trope');
  toast.replaceChildren(element('strong','eyebrow','Christmas movie trope unlocked!'),
    element('span','',ids.map(id=>tropes[id]).join(' · ')));
  toastTimer=setTimeout(nextToast,4500);
}

function resolve() {
  if(!session.ready||session.resolved||mode!=='play') return;
  const chapter=session.chapter;
  const unlocked=session.resolve();
  if(chapter.event==='kiss') {
    showDialogue(chapter.dialogue,()=>{
      cinematic('kiss',()=>{
        notify(unlocked);
        session.next();
        const {wrap,actions}=panel('Evergreen Falls','THE END',closing,'story-card');
        actions.append(button('See Christmas Movie Bingo',showEnding,'primary'));
        wrap.querySelector('.panel p').after(element('p','subtitle','Merry Christmas!'));
        setMode('story-end',wrap);
        actions.firstChild.focus();
      });
    });
    return;
  }
  cinematic(chapter.event,()=>{
    notify(unlocked);
    showDialogue(chapter.dialogue,()=>{
      session.next();
      loadChapter();
    });
  });
}

const cinematicLength={spill:900,repair:1450,catch:900,bake:1300,illuminate:2200,kiss:2500};
function cinematic(kind,done) {
  setMode('event');
  stage.playEvent(kind);
  audio.effect(kind);
  if(kind==='illuminate'||kind==='kiss') audio.mood='festival';
  timer=setTimeout(done,settings.reduced?450:cinematicLength[kind]);
}

function showEnding() {
  const ending=endings[session.ending];
  const wrap=element('div','end-wrap');
  const content=element('section','ending');
  const time=Math.round(session.elapsed/1000);
  const bingo=element('ul','bingo');
  tropes.forEach((trope,index)=>{
    const tile=element('li');
    tile.append(element('span','',session.achievements.has(index)?'✦':'◇'),element('div','',trope));
    bingo.append(tile);
  });
  const actions=element('div','actions');
  actions.append(button('Play Again',start,'primary'),button('Return to Main Menu',showMenu));
  const epilogue=element('div','epilogue');
  const copy=element('div');
  copy.append(element('div','eyebrow','Merry Christmas!'),element('h2','',ending.title),element('p','',ending.text));
  const keepsake=element('canvas','keepsake');
  keepsake.width=230;
  keepsake.height=132;
  keepsake.setAttribute('role','img');
  keepsake.setAttribute('aria-label','Emily and Jack beneath the lighted mistletoe gazebo');
  const illustration=keepsake.getContext('2d');
  const finalScene=stage.snapshot();
  illustration.translate(-(stage.goal.x-finalScene.offset-keepsake.width/2),-96);
  drawWorld(illustration,{...finalScene,reduced:true});
  epilogue.append(copy,keepsake);
  content.append(epilogue,element('h3','','Christmas Movie Bingo'),element('div','eyebrow','Certified Christmas Romance Classic'),bingo,
    element('p','','Completion time · '+Math.floor(time/60)+'m '+String(time%60).padStart(2,'0')+'s'),actions);
  wrap.append(content);
  setMode('ending',wrap);
  content.querySelector('h2').tabIndex=-1;
  content.querySelector('h2').focus({preventScroll:true});
}

function pause() {
  if(mode==='pause') {
    stage.paused=false;
    if(previousMode==='dialogue') renderLine();
    else beginPlay();
  } else if(mode==='play'||mode==='dialogue') {
    previousMode=mode;
    clearInterval(typing);
    stage.paused=true;
    const {wrap,actions}=panel('Intermission','Movie paused');
    actions.append(button('Resume',pause,'primary'),button('Restart Movie',start),button('Main Menu',showMenu));
    setMode('pause',wrap);
    actions.firstChild.focus();
  }
}

stage.direction=()=>{
  const left=held.has('ArrowLeft')||held.has('KeyA')||[...pointers.values()].includes(-1);
  const right=held.has('ArrowRight')||held.has('KeyD')||[...pointers.values()].includes(1);
  return Number(right)-Number(left);
};
stage.onStep=()=>audio.effect('step');
stage.onApproach=refreshPrompt;
stage.onAutoGoal=resolve;
stage.onCollect=()=>{ audio.effect('collect'); updateHud(); };

const movement=['KeyA','KeyD','ArrowLeft','ArrowRight'];
const jumps=['KeyW','ArrowUp','Space'];
window.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey) return;
  const key=event.code;
  if(key==='Escape') { event.preventDefault(); if(!event.repeat) pause(); return; }
  if(mode==='play') {
    if(movement.includes(key)) { event.preventDefault(); held.add(key); }
    if(jumps.includes(key)) { event.preventDefault(); if(!event.repeat) stage.jump(); }
    if(key==='KeyE'||key==='Enter') { event.preventDefault(); if(!event.repeat) interact(); }
  } else if(mode==='dialogue'&&!event.repeat) {
    const choices=dialogue.lines[dialogue.index].choices;
    if(key==='KeyE'||(key==='Enter'&&!choices)) { event.preventDefault(); advance(); }
    const index=['Digit1','Digit2','Digit3'].indexOf(key);
    if(choices?.[index]) { event.preventDefault(); choose(choices[index]); }
  }
});
window.addEventListener('keyup',event=>held.delete(event.code));
window.addEventListener('blur',()=>{ held.clear(); pointers.clear(); });

for(const node of document.querySelectorAll('[data-move]')) {
  node.addEventListener('pointerdown',event=>{
    event.preventDefault();
    audio.unlock();
    pointers.set(event.pointerId,Number(node.dataset.move));
    node.setPointerCapture(event.pointerId);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) {
    node.addEventListener(type,event=>pointers.delete(event.pointerId));
  }
}
for(const node of document.querySelectorAll('[data-action]')) {
  node.addEventListener('click',()=>{
    audio.unlock();
    if(node.dataset.action==='jump') stage.jump();
    else interact();
  });
}
get('sound').addEventListener('click',()=>{
  settings.sound=!settings.sound;
  audio.toggle(settings.sound);
  savePreferences(storage,settings);
  applySettings();
});
get('motion').addEventListener('click',()=>{
  settings.reduced=!settings.reduced;
  savePreferences(storage,settings);
  applySettings();
  if(mode==='dialogue') { dialogue.revealed=true; renderLine(); }
});
get('pause').addEventListener('click',pause);
applySettings();
showMenu();
