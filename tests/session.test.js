import test from 'node:test';
import assert from 'node:assert/strict';
import { chapters, endings, tropes } from '../src/story.js';
import { StorySession, preferences, savePreferences } from '../src/session.js';

test('Only chapter items can count, duplicates do not count, and incomplete objectives block progress',()=>{
  const game=new StorySession(chapters);
  assert.equal(game.next(),false);
  assert.equal(game.collect(100),false);
  assert.equal(game.collect(0),true);
  assert.equal(game.collect(0),false);
  assert.deepEqual(game.resolve(),[]);
  assert.equal(game.ready,false);
  game.chapter.items.forEach((_,index)=>game.collect(index));
  assert.deepEqual(game.resolve().sort(),[0,1,3]);
  assert.deepEqual(game.resolve(),[]);
  assert.equal(game.next(),true);
  assert.equal(game.collected.size,0);
  assert.equal(game.achievements.size,3);
});

test('Each forest response has a distinct reply and all endings complete all sixteen bingo tiles',()=>{
  const game=new StorySession(chapters);
  const forest=chapters[2].dialogue.at(-1).choices;
  assert.equal(new Set(forest.map(choice=>game.choose(choice))).size,3);
  assert.equal(game.ending,null);
  for(const choice of chapters[5].dialogue.at(-1).choices) {
    game.restart(1000);
    chapters.forEach((chapter,index)=>{
      assert.equal(game.chapter,chapter);
      chapter.items.forEach((_,i)=>assert.equal(game.collect(i),true));
      assert.equal(game.resolve().length,chapter.unlock.length);
      if(index===5) {
        assert.equal(game.next(3000),false);
        game.choose(choice);
      }
      assert.equal(game.next(6000),true);
    });
    assert.equal(game.finished,true);
    assert.equal(game.elapsed,5000);
    assert.ok(endings[game.ending].title);
    assert.deepEqual([...game.achievements].sort((a,b)=>a-b),tropes.map((_,i)=>i));
    assert.equal(game.next(7000),false);
  }
  game.restart(0);
  assert.equal(game.index,0);
  assert.equal(game.finished,false);
  assert.equal(game.ending,null);
  assert.equal(game.achievements.size,0);
  assert.equal(game.collected.size,0);
});

test('Preferences survive a reload and fall back safely when unavailable or malformed',()=>{
  const values=new Map();
  const storage={ getItem:key=>values.get(key), setItem:(key,val)=>values.set(key,val) };
  assert.deepEqual(preferences(storage,true),{sound:true,reduced:true});
  savePreferences(storage,{sound:false,reduced:false});
  assert.deepEqual(preferences(storage,true),{sound:false,reduced:false});
  storage.setItem('mistletoe-preferences','invalid json');
  assert.deepEqual(preferences(storage),{sound:true,reduced:false});
  assert.doesNotThrow(()=>savePreferences(null,{sound:false,reduced:false}));
});

test('A continuous right walk reaches each goal and collects every required item',async()=>{
  const { WorldState }=await import('../src/world.js');
  const game=new StorySession(chapters);
  const world=new WorldState();
  world.direction=()=>1;
  for(const chapter of chapters) {
    world.load(game);
    world.setActive(true);
    let frames=0;
    while(world.distanceToGoal()>=39 && frames++<1500) world.update(1000/60);
    assert.ok(frames<1500,chapter.title+' goal is reachable');
    assert.equal(game.ready,true,chapter.title+' items are collected');
    game.resolve();
    game.choose({ending:0});
    game.next();
  }
});

test('Jump returns Emily to ground, pause freezes movement, and the hint appears after 15 seconds',async()=>{
  const { WorldState }=await import('../src/world.js');
  const world=new WorldState();
  world.load(new StorySession(chapters));
  world.setActive(true);
  const ground=world.player.y;
  world.jump();
  world.update(50);
  assert.ok(world.player.y<ground);
  for(let i=0;i<20;i++) world.update(50);
  assert.equal(world.player.y,ground);
  assert.equal(world.player.air,false);
  assert.equal(world.hint,undefined);
  world.direction=()=>1;
  world.paused=true;
  const start=world.player.x;
  world.update(50);
  assert.equal(world.player.x,start);
  world.paused=false;
  world.direction=()=>0;
  for(let i=0;i<300;i++) world.update(50);
  assert.equal(world.hint,chapters[0].items[0].x);
});
