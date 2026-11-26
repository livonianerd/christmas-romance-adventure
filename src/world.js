import { FLOOR, WIDTH } from './art.js';

export const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const WALK_SPEED = 52;

export class WorldState {
  constructor() {
    this.reduced = false;
    this.time = 0;
    this.showMenu();
  }

  showMenu() {
    this.world = 'street';
    this.offset = 0;
    this.menu = true;
    this.active = false;
    this.player = null;
    this.npcs = [];
    this.cat = null;
    this.event = null;
    this.eventAnimating = false;
    this.goal = null;
    this.hint = undefined;
    this.session = null;
    this.dirty = true;
  }

  load(session) {
    this.session = session;
    const { world, npcs = [], companion, goal } = session.chapter;
    this.world = world;
    this.menu = false;
    this.active = false;
    this.offset = 0;
    this.time = 0;
    this.idleSinceFind = 0;
    this.lastStep = 0;
    this.bumpTime = 0;
    this.event = null;
    this.eventAnimating = false;
    this.goal = goal;
    this.hint = undefined;
    this.player = {name:'Emily', x:58, y:FLOOR, v:0, dir:1, walk:false, suitcase:world==='street'};
    this.npcs = npcs.map(npc=>({...npc,y:FLOOR,dir:-1}));
    if (goal.npc) this.npcs.push({name:goal.npc,x:goal.x,y:FLOOR,dir:-1});
    if (companion) this.npcs.push({name:companion,x:33,y:FLOOR,dir:1,follow:true});
    this.cat = ['kitchen','bakery','finale'].includes(world) ? {x:85,walk:false} : null;
    this.dirty = true;
  }

  snapshot() {
    const chapter = this.session?.chapter;
    return {
      ...this, offset:this.offset || 0, obstacles:chapter?.obstacles,
      items:chapter?.items.filter((_,index)=>!this.session.collected.has(index))
    };
  }

  distanceToGoal() { return Math.abs(this.goal.x-this.player.x); }

  jump() {
    if (!this.active || this.player.air) return;
    this.player.v = -131;
    this.player.air = true;
  }

  setActive(active) {
    this.active = active;
    if (this.player && !active) this.player.walk = false;
    this.dirty = true;
  }

  playEvent(kind) {
    this.event = {kind,x:this.goal.x,age:0};
    this.player.y=FLOOR;
    this.player.air=false;
    this.player.v=0;
    this.eventAnimating = true;
    this.dirty = true;
    if (kind==='illuminate') {
      this.npcs.push({name:'Jack',x:this.goal.x+18,y:FLOOR,dir:-1});
      const crowd = this.npcs.filter(npc=>npc.name!=='Jack');
      crowd.forEach((npc,i)=>{
        npc.x=this.goal.x-90-i*32;
        npc.dir=1;
      });
    }
    if (kind==='catch') {
      const companion = this.npcs.find(p=>p.follow);
      companion.x = this.goal.x+7;
      companion.dir = -1;
      companion.follow = false;
      this.player.dir = 1;
    }
    if (kind==='kiss') {
      this.player.x = this.goal.x-12;
      this.player.dir = 1;
    }
  }

  jackLeaves() {
    const jack = this.npcs.find(p=>p.name==='Jack');
    if (jack) { jack.depart = true; jack.dir = 1; }
  }

  update(delta) {
    if (this.paused) return;
    this.time += delta;
    if (!this.session) return;
    const seconds = delta/1000;
    const chapter = this.session.chapter;
    const player = this.player;
    if (this.event) {
      this.event.age += delta;
      this.eventAnimating = this.event.age < 4500;
      if (this.event.kind==='catch' && !this.reduced) {
        player.x = this.goal.x-17+Math.min(this.event.age/460,1)*5;
        player.y = FLOOR-Math.sin(Math.PI*Math.min(this.event.age/470,1))*3;
      }
      if (this.event.kind==='illuminate' && !this.reduced) {
        this.npcs.filter(npc=>npc.name!=='Jack').forEach((npc,i)=>{
          npc.y=FLOOR-(this.event.age<2400?Math.max(0,Math.sin(this.event.age/135+i))*5:0);
        });
      }
      if (this.event.kind==='kiss') {
        const jack = this.npcs.find(npc=>npc.name==='Jack');
        const step = this.reduced?1:Math.min(1,this.event.age/800);
        player.x = this.goal.x-12+step*6;
        jack.x = this.goal.x+step*5;
      }
    }
    for (const npc of this.npcs) {
      if (npc.depart) { npc.walk=true; npc.x+=88*seconds; }
    }
    if (this.active) {
      const direction = this.direction?.() || 0;
      const nextX = clamp(player.x + direction*WALK_SPEED*seconds,14,chapter.length-14);
      const overlap = chapter.obstacles.find(o=>nextX>o.x-5&&nextX<o.x+o.w+5);
      const standingOn = chapter.obstacles.find(o=>player.x>o.x-5&&player.x<o.x+o.w+5);
      const blocked = overlap && overlap!==standingOn && player.y>FLOOR-overlap.h+1;
      this.bumpTime = blocked && direction ? (this.bumpTime||0)+delta : 0;
      // A gentle step assist keeps every route traversable without precise jumps.
      if (this.bumpTime>330) this.jump();
      if (!blocked) player.x=nextX;
      if (direction) player.dir=direction;
      player.walk=Boolean(direction&&!blocked&&!player.air);
      const platform = chapter.obstacles.find(o=>player.x>o.x-5&&player.x<o.x+o.w+5);
      const floor = FLOOR-(platform?.h||0);
      if (player.air || player.y<floor) {
        player.v+=380*seconds;
        player.y+=player.v*seconds;
        if (player.y>=floor&&player.v>=0) { player.y=floor; player.air=false; player.v=0; }
      }
      if (player.walk && this.time-this.lastStep>305) {
        this.lastStep=this.time;
        this.onStep?.();
      }
      this.idleSinceFind+=delta;
      chapter.items.forEach((item,index)=>{
        if (Math.abs(item.x-player.x)<16 && Math.abs(player.y-FLOOR+item.y)<39 && this.session.collect(index)) {
          this.idleSinceFind=0;
          this.onCollect?.(item);
        }
      });
      this.hint = this.session.ready ? this.goal.x : this.idleSinceFind>=15000 ?
        chapter.items.find((_,index)=>!this.session.collected.has(index))?.x : undefined;
      const available = this.distanceToGoal()<39;
      this.onApproach?.(available);
      if (available&&this.session.ready&&chapter.event==='spill') this.onAutoGoal?.();
    } else {
      this.hint=undefined;
    }
    for(const npc of this.npcs.filter(n=>n.follow)) {
      const diff=player.x-29-npc.x;
      npc.x+=clamp(diff,-57*seconds,57*seconds);
      npc.walk=Math.abs(diff)>4;
      npc.dir=diff < -4 ? -1 : 1;
    }
    if (this.cat) {
      const diff=player.x-43-this.cat.x;
      this.cat.walk=Math.abs(diff)>15;
      if(this.cat.walk) this.cat.x+=clamp(diff,-44*seconds,44*seconds);
    }
    const target=clamp(player.x-185,0,chapter.length-WIDTH);
    this.offset=this.reduced ? target : this.offset+(target-this.offset)*(1-Math.exp(-delta/120));
  }
}
