import { characters } from './story.js';

export const WIDTH = 480;
export const HEIGHT = 272;
export const FLOOR = 215;
const palette = { snow:'#dce9ee', light:'#fbefd8', blue:'#9db9cc', ink:'#253247', gold:'#f7c879', pine:'#264a50' };
const lampColors = ['#ffb57d','#f6d88c','#f17778','#9dd6bd'];
const rect = (c,x,y,w,h,color) => { c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),w,h); };
const poly = (c,points,color) => {
  c.fillStyle=color;
  c.beginPath();
  points.forEach(([x,y],i) => i ? c.lineTo(Math.round(x),Math.round(y)) : c.moveTo(Math.round(x),Math.round(y)));
  c.closePath();
  c.fill();
};
const random = seed => () => {
  seed = (Math.imul(1664525,seed)+1013904223) >>> 0;
  return seed / 4294967296;
};
const spark = (c,x,y,color,r=3) => {
  rect(c,x-r,y,2*r+1,1,color);
  rect(c,x,y-r,1,2*r+1,color);
};

function glow(c,x,y,r,color) {
  const g = c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,color);
  g.addColorStop(1,'transparent');
  c.fillStyle=g;
  c.fillRect(x-r,y-r,2*r,2*r);
}

function text(c,label,x,y,size,color = palette.light,align='center') {
  c.font = 'bold '+size+'px Georgia';
  c.fillStyle=color;
  c.textAlign=align;
  c.fillText(label,x,y);
}

function garland(c,x,y,w,lit=true,t=0) {
  for(let i=0;i<w;i+=4) {
    const sag = Math.sin(i/w*Math.PI)*5;
    rect(c,x+i,y+sag,5,3,'#263f37');
    rect(c,x+i+1,y+sag,3,1,'#526a4a');
    if(i%8===0) rect(c,x+i+1,y+sag+3,2,2,lit ? lampColors[(i/8+Math.floor(t/700))%4] : '#6b6565');
  }
}

function wreath(c,x,y,r=8) {
  c.save();
  c.translate(x,y);
  for(let i=0;i<16;i++) {
    const a=i*Math.PI/8;
    rect(c,Math.cos(a)*r-2,Math.sin(a)*r-2,5,5,i%2 ? '#365443':'#506f52');
    if(i%3===0) rect(c,Math.cos(a)*r,Math.sin(a)*r,2,2,'#bd5257');
  }
  rect(c,-3,r-1,7,3,'#b5414e');
  rect(c,-2,r+2,2,3,'#b5414e');
  rect(c,2,r+2,2,3,'#b5414e');
  c.restore();
}

function pine(c,x,y,h,{ snowy=true, decorated=false, lit=true, t=0, distant=false }={}) {
  rect(c,x-h*.035,y-h*.25,Math.ceil(h*.07),h*.25,distant?'#424963':'#57413c');
  const colors=distant?['#384963','#465774','#526380']:['#203e48','#2d5057','#3e6365'];
  for(let i=3;i>=0;i--) {
    const top=y-h+i*h*.17, width=h*(.14+i*.068), bottom=top+h*.36;
    poly(c,[[x,top],[x+width,bottom],[x+width*.48,bottom-3],[x+width*.14,bottom+2],[x-width*.40,bottom-2],[x-width,bottom]],colors[i%3]);
    poly(c,[[x,top+3],[x+width*.69,bottom-4],[x+width*.22,bottom-7],[x-width*.58,bottom-5]],colors[(i+1)%3]);
    if(snowy && !distant) poly(c,[[x,top],[x+width*.48,top+h*.19],[x+width*.12,top+h*.17],[x-width*.46,top+h*.21]],i%2?'#acc5d0':'#dbe5e7');
    if(decorated) {
      for(let j=-2;j<=2;j++) {
        const lx=x+j*width/3, ly=bottom-7-(j*j)*.6;
        if(lit) glow(c,lx,ly,8,'#ffc38445');
        rect(c,lx,ly,2,2,lit?lampColors[(j+2+i+Math.floor(t/900))%4]:'#5c5a65');
      }
    }
  }
  if(decorated) {
    if(lit) glow(c,x,y-h+2,26,'#ffcd8865');
    spark(c,x,y-h+2,lit?'#ffdc8b':'#756a66',5);
    rect(c,x-1,y-h+1,3,3,lit?'#fff1b1':'#756a66');
  }
}

function windowPane(c,x,y,w,h,lit,frame='#523c46') {
  if(lit) glow(c,x+w/2,y+h/2,w*.95,'#ffb06935');
  rect(c,x-3,y-3,w+6,h+7,frame);
  rect(c,x,y,w,h,lit?'#f3b56d':'#415165');
  rect(c,x+2,y+2,w-4,h-4,lit?'#ffc987':'#506078');
  rect(c,x+3,y+3,3,h-6,lit?'#ffe6a7':'#63748c');
  rect(c,x+w/2-1,y,2,h,frame);
  rect(c,x,y+h*.51,w,2,frame);
  rect(c,x-4,y+h,w+8,3,'#b9a2a0');
}

function shop(c,x,ground,w,h,name,wall,roof,lit,t) {
  const y=ground-h;
  rect(c,x+4,y,w-8,h,'#4a3544');
  rect(c,x+8,y+7,w-16,h-7,wall);
  for(let row=y+12;row<ground-2;row+=8) {
    rect(c,x+9,row,w-18,1,'#30213940');
    for(let j=0;j<w-22;j+=15) rect(c,x+11+j+((row-y)%3),row,1,6,'#30213930');
  }
  rect(c,x+w-28,y-28,12,26,'#725463');
  rect(c,x+w-30,y-29,16,4,palette.snow);
  poly(c,[[x-4,y+14],[x+w*.23,y-16],[x+w*.76,y-16],[x+w+4,y+14]],roof);
  for(let i=0;i<4;i++) rect(c,x+4+i*5,y+8-i*5,w-8-i*10,2,'#2e304250');
  poly(c,[[x-4,y+7],[x+w*.23,y-19],[x+w*.75,y-19],[x+w+2,y+7],[x+w-7,y+5],[x+w*.72,y-13],[x+w*.25,y-13],[x+7,y+9]],palette.snow);
  rect(c,x+5,y+12,w-10,3,'#463343');
  if(h>70) {
    windowPane(c,x+20,y+21,15,16,lit);
    windowPane(c,x+w-35,y+21,15,16,lit);
    wreath(c,x+w/2,y+30,6);
  }
  rect(c,x+9,ground-57,w-18,13,'#382b39');
  rect(c,x+11,ground-56,w-22,11,'#614650');
  text(c,name,x+w/2,ground-48,8,'#ffe3ad');
  garland(c,x+9,ground-43,w-18,lit,t);
  windowPane(c,x+17,ground-31,24,20,lit);
  windowPane(c,x+w-41,ground-31,24,20,lit);
  rect(c,x+w/2-10,ground-33,20,33,'#332b39');
  rect(c,x+w/2-8,ground-30,16,30,'#6b444b');
  windowPane(c,x+w/2-5,ground-27,10,11,lit,'#55393d');
  rect(c,x+w/2+4,ground-10,2,2,'#dfae6f');
  rect(c,x,ground,w,3,'#bccbd3');
}

function fence(c,x,y,w) {
  for(let i=0;i<w;i+=19) {
    rect(c,x+i,y-16,4,17,'#755159');
    rect(c,x+i-1,y-17,6,2,palette.snow);
  }
  rect(c,x,y-12,w,3,'#8b675e');
  rect(c,x,y-5,w,2,'#8b675e');
  rect(c,x,y-13,w,1,'#d1dce0');
}

function lamp(c,x,y,lit) {
  if(lit) glow(c,x,y-35,28,'#fcb26758');
  rect(c,x-2,y-36,4,36,'#333445');
  rect(c,x-6,y-2,12,3,'#4c4958');
  rect(c,x-5,y-43,10,11,'#343443');
  rect(c,x-3,y-42,6,8,lit?'#ffd48c':'#65718a');
  rect(c,x-7,y-45,14,3,'#3b3b4b');
  rect(c,x-5,y-46,10,1,palette.snow);
}

function gazebo(c,x,y,lit,t) {
  const w=143;
  if(lit) glow(c,x,y-35,82,'#f5ac665c');
  rect(c,x-w/2,y-5,w,6,'#695363');
  rect(c,x-w/2+5,y-8,w-10,3,'#f0d6b5');
  for(const offset of [-58,-41,41,58]) {
    rect(c,x+offset,y-67,5,60,'#734e52');
    rect(c,x+offset+1,y-67,2,60,'#d6a783');
  }
  fence(c,x-56,y-8,28);
  fence(c,x+31,y-8,28);
  poly(c,[[x-78,y-64],[x-55,y-84],[x,y-109],[x+56,y-84],[x+78,y-64]],'#66465e');
  poly(c,[[x-78,y-68],[x-55,y-87],[x,y-112],[x+56,y-87],[x+78,y-68],[x+53,y-80],[x,y-105],[x-55,y-80]],palette.snow);
  rect(c,x-77,y-65,154,4,'#9c706c');
  garland(c,x-74,y-63,148,lit,t);
  rect(c,x,y-61,1,15,palette.gold);
  wreath(c,x,y-45,4);
}

function counter(c,x,y,w,type) {
  rect(c,x,y,w,26,'#654153');
  rect(c,x+3,y+4,w-6,20,'#985b59');
  for(let j=5;j<w-10;j+=22) {
    rect(c,x+j,y+6,18,14,'#744c55');
    rect(c,x+j+2,y+7,14,11,'#a46660');
    rect(c,x+j+7,y+9,4,1,'#e5b180');
  }
  rect(c,x-2,y-3,w+4,4,'#e2b58e');
  rect(c,x-2,y,w+4,2,'#b2756d');
  if(type==='oven') {
    rect(c,x+14,y-25,52,26,'#544450');
    rect(c,x+17,y-21,46,17,'#372f3e');
    rect(c,x+23,y-17,34,8,'#b75b46');
    rect(c,x+26,y-13,28,4,'#f8ae67');
    rect(c,x+32,y-23,15,2,'#cda282');
  } else {
    for(let i=0;i<3;i++) {
      rect(c,x+9+i*12,y-11,8,8,['#ce8c62','#d8ae72','#95646a'][i]);
      rect(c,x+8+i*12,y-12,10,2,'#f6d0a1');
    }
    rect(c,x+w-27,y-9,18,3,'#e8ddd2');
    poly(c,[[x+w-27,y-6],[x+w-9,y-6],[x+w-14,y-2],[x+w-22,y-2]],'#b68483');
  }
}

function sky(c,theme,shift) {
  const colors=theme==='forest'?['#243650','#586f8d','#dfb7ab']:['#17253c','#46496e','#a06f81'];
  for(let y=0;y<HEIGHT;y+=3) {
    const p=y/HEIGHT*2;
    const k=Math.min(1,Math.floor(p)), f=p-k;
    const a=colors[k].slice(1).match(/../g).map(n=>parseInt(n,16));
    const b=colors[k+1].slice(1).match(/../g).map(n=>parseInt(n,16));
    rect(c,0,y,WIDTH,3,'rgb('+a.map((n,i)=>Math.round(n+(b[i]-n)*f)).join(',')+')');
  }
  const rnd=random(680);
  for(let i=0;i<71;i++) {
    const x=(rnd()*610-shift*.05+610)%610;
    const y=8+rnd()*133;
    if(i%13===0) spark(c,x,y,'#d7bb9d',2);
    else rect(c,x,y,1,1,i%4?'#818baa':'#d7c7be');
  }
  const moon=389-shift*.06;
  glow(c,moon,54,61,'#ffe1a647');
  c.fillStyle='#fce4b8';
  c.beginPath(); c.arc(moon,54,19,0,Math.PI*2); c.fill();
  rect(c,moon-8,51,6,2,'#ebcbab');
  rect(c,moon+4,61,7,2,'#ebcbab');
  const step=theme==='forest'?134:167;
  for(let i=-1;i<7;i++) {
    const x=i*step-shift*.21, peak=76+(i+3)%3*18;
    poly(c,[[x-60,165],[x+26,peak],[x+107,161],[x+step,174]],theme==='forest'?'#71839f':'#565677');
    poly(c,[[x+4,peak+23],[x+26,peak],[x+58,peak+35],[x+32,peak+26],[x+25,peak+31],[x+19,peak+19]],theme==='forest'?'#b0b8c7':'#81778d');
  }
  for(let i=-2;i<29;i++) {
    const x=i*33-shift*.43;
    if(x>-60&&x<530) pine(c,x,194+(i+3)%4*4,29+(i+3)%5*8,{distant:true});
  }
}

function ground(c,offset,interior) {
  rect(c,0,FLOOR,WIDTH,HEIGHT-FLOOR,interior?'#945e61':'#a7bdcb');
  rect(c,0,FLOOR,WIDTH,interior?4:7,interior?'#e0a980':'#edf0e8');
  rect(c,0,FLOOR+28,WIDTH,2,interior?'#744c55':'#879fb5');
  const rnd=random(51);
  for(let i=0;i<124;i++) {
    const x=(rnd()*552-offset%552+552)%552-30;
    const y=FLOOR+5+rnd()*47;
    rect(c,x,y,3+rnd()*17,1,interior?(i%2?'#6f4a535f':'#d79a7b72'):(i%2?'#dce7e5':'#8ca6bd'));
  }
  if(interior) for(let row=0;row<8;row++) {
    rect(c,0,FLOOR+row*8,WIDTH,1,'#67465485');
    for(let i=-1;i<11;i++) rect(c,i*53-offset%53+row%2*26,FLOOR+row*8,1,8,'#67465480');
  }
}

export function character(c,name,x,y,{time=0,walk=false,dir=1,air=false,suitcase=false,scale=1}={}) {
  const p=characters[name];
  if(!p) return;
  const step=walk?Math.round(Math.sin(time/66)*3):0;
  const bob=walk?Math.abs(step)%2:(time%2700>2600?1:0);
  c.save(); c.translate(Math.round(x),Math.round(y-bob)); c.scale(dir*scale,scale);
  rect(c,-8,-10,6,7-air*2,'#343040');
  rect(c,2,-10,6,7-air*2,'#393144');
  rect(c,-8-step,-4-air*3,8,4,'#452d35');
  rect(c,1+step,-4+air*1,8,4,'#392b37');
  rect(c,-9,-24,17,15,p.dark);
  rect(c,-7,-24,14,12,p.coat);
  rect(c,-7,-13,14,3,p.dark);
  if(p.plaid) {
    for(let i=-5;i<8;i+=4) rect(c,i,-23,2,11,p.dark);
    rect(c,-7,-19,14,2,p.dark);
    rect(c,-7,-14,14,1,'#c47268');
  }
  rect(c,-10,-24,4,11,p.coat);
  rect(c,7,-24,3,8,p.dark);
  rect(c,-10,-15,3,3,p.skin);
  rect(c,8,-17,3,3,p.skin);
  rect(c,-8,-39,14,14,p.hair);
  rect(c,-7,-41,12,3,p.hair);
  rect(c,-5,-37,12,10,p.skin);
  rect(c,-3,-39,10,3,p.hair);
  rect(c,-7,-37,4,name==='Emily'?15:8,p.hair);
  rect(c,6,-33,2,3,p.skin);
  rect(c,3,-34,1,1,'#352b37');
  rect(c,0,-31,2,1,'#cd7769');
  rect(c,4,-29,2,1,'#995e56');
  if(name==='Margaret') {
    rect(c,-9,-41,5,6,p.hair);
    rect(c,0,-34,6,1,'#654656');
  }
  rect(c,-7,-27,15,3,p.scarf);
  rect(c,-5,-24,4,7,p.scarf);
  rect(c,-4,-20,2,1,'#ffffff65');
  if(suitcase) {
    rect(c,-15,-15,5,3,'#674441');
    rect(c,-19,-13,12,10,'#704b43');
    rect(c,-18,-12,10,7,'#a57353');
    rect(c,-16,-12,1,7,'#d0a36b');
    rect(c,-10,-12,1,7,'#d0a36b');
  }
  c.restore();
}

export function icon(c,id,x,y) {
  c.save(); c.translate(Math.round(x),Math.round(y));
  const r=(x,y,w,h,col)=>rect(c,x,y,w,h,col);
  const gold='#efbf6c', cream='#f5dfb9', red='#c55762', dark='#533b4b';
  if(id==='wreath') wreath(c,0,0,5);
  else if(id==='lights') garland(c,-10,-3,20);
  else if(id==='star') { spark(c,0,0,gold,7); r(-2,-2,5,5,cream); }
  else if(['red','gold','green'].includes(id)) {
    const color={red,gold,green:'#68a582'}[id];
    r(-2,-8,4,3,gold); r(-4,-5,9,10,color); r(-6,-3,13,6,color); r(-3,-3,2,3,cream);
  } else if(id==='hammer') { r(-2,-3,4,12,'#97664e'); r(-7,-7,13,5,'#aabcd0'); r(-7,-7,4,2,cream); }
  else if(id==='key') { r(-7,-4,7,7,gold); r(-5,-2,3,3,dark); r(-1,-1,9,2,gold); r(5,1,2,3,gold); }
  else if(id==='cord') { r(-7,-5,13,10,'#485f4d'); r(-5,-3,9,6,dark); r(-3,-1,6,2,'#7b9b66'); r(5,3,4,3,gold); }
  else if(id==='fuse') { r(-7,-4,14,8,'#93aebc'); r(-7,-4,3,8,gold); r(4,-4,3,8,gold); r(-3,-2,6,1,cream); }
  else if(id==='cookie') { r(-5,-6,10,12,'#be7b4b'); r(-6,-4,12,8,'#be7b4b'); r(-2,-2,2,2,dark); r(2,1,2,2,dark); r(1,-4,1,1,cream); }
  else {
    const color={ticket:cream,book:'#a46a59',flour:'#e9cfb5',sugar:'#ecbdcb',butter:gold,spice:'#c68358'}[id]||cream;
    r(-6,-5,12,11,dark); r(-5,-5,10,9,color); r(-3,-2,6,3,cream); r(-2,-1,4,1,dark);
    if(id==='flour'||id==='sugar'||id==='spice') r(-4,-7,8,2,id==='spice'?red:cream);
  }
  c.restore();
}

function cat(c,x,y,t,walking) {
  const step=walking?Math.round(Math.sin(t/80)*2):0;
  rect(c,x-8,y-8,12,7,'#c77549');
  rect(c,x+2,y-11,7,8,'#e29859');
  rect(c,x+2,y-13,2,4,'#b86446');
  rect(c,x+7,y-13,2,4,'#b86446');
  rect(c,x+7,y-8,1,1,'#3e303a');
  rect(c,x-8+step,y-2,3,2,'#a75d45');
  rect(c,x+4-step,y-2,3,2,'#a75d45');
  rect(c,x-12,y-10+(Math.floor(t/260)%2),6,2,'#db8952');
  rect(c,x-12,y-12,2,4,'#db8952');
}

const snowflakes = Array.from({length:86},(_,i)=>{
  const rnd=random(1721+i*901);
  return [rnd()*WIDTH,rnd()*HEIGHT,8+rnd()*30,rnd()];
});

export function drawWorld(c,state) {
  const {world, offset=0, time=0, reduced=false, player, npcs=[], items=[], obstacles=[], hint, event, menu=false}=state;
  const t=reduced?0:time;
  const interior=world==='bakery'||world==='kitchen';
  const switches = event?.kind==='illuminate' ? (reduced?2000:event.age) : 0;
  const lit=world!=='square' || switches>=680;
  const treeLit=world!=='square' || switches>=270;
  const repaired=event?.kind==='repair' && (reduced||event.age>670);
  if(interior) {
    rect(c,0,0,WIDTH,HEIGHT,'#553849');
    rect(c,0,35,WIDTH,136,world==='bakery'&&!repaired?'#9a696a':'#b87d72');
    for(let i=-1;i<30;i++) rect(c,i*22-offset%22,35,1,137,'#663e5237');
    rect(c,0,154,WIDTH,61,'#714557'); rect(c,0,151,WIDTH,4,'#db9b7e');
    rect(c,0,31,WIDTH,5,'#d99972');
    for(let i=0;i<11;i++) {
      const x=i*108-offset;
      if(x<-125||x>WIDTH+80) continue;
      if(i%2===0) {
        windowPane(c,x+30,72,49,50,true,'#704b58');
        rect(c,x+32,109,46,5,'#fff1b185');
        if(world==='kitchen'||repaired) wreath(c,x+55,70,9);
      } else {
        rect(c,x+13,101,76,6,'#714556');
        for(let j=0;j<5;j++) {
          rect(c,x+18+j*13,87+(j%2)*4,8,14-(j%2)*4,lampColors[j%4]);
          rect(c,x+17+j*13,86+(j%2)*4,10,3,'#edcb9d');
        }
        text(c,i%4===1?'FRESH BREAD':'GINGERBREAD',x+53,68,8,'#ffe0b2');
      }
      if(world==='kitchen'||repaired) garland(c,x,42,108,true,t);
      counter(c,x+9,173,89,world==='kitchen'&&i%3===1?'oven':'prep');
      glow(c,x+54,135,56,'#ffbb6d25');
    }
  } else {
    sky(c,world,offset);
    if(world==='forest') {
      for(let i=0;i<19;i++) {
        const x=i*68-offset+12;
        if(x>-65&&x<WIDTH+65) pine(c,x,201+i%3*3,53+(i*17)%68,{});
      }
      for(let i=0;i<8;i++) fence(c,i*142-offset,210,121);
      pine(c,980-offset,FLOOR,119,{decorated:event?.kind==='catch',t});
      rect(c,507-offset,FLOOR+4,101,13,'#668394');
      rect(c,518-offset,FLOOR+8,83,2,'#abc5cb');
    } else {
      const names=world==='street'?['RAILWAY STATION','WINTER POST','PINE & PAPER','EVERGREEN INN','BENNETT’S BAKERY']:['EVERGREEN INN','THE HOLLY POST','TOWN HALL','PINE & PAPER','BENNETT’S BAKERY'];
      for(let i=0;i<6;i++) {
        const x=13+i*169-offset;
        if(x<-170||x>WIDTH+36) continue;
        const walls=['#875d65','#696579','#826376','#80545d','#945d64'];
        shop(c,x,199,147,78+(i*11)%29,names[i%5],walls[i%5],'#473c58',lit,t);
        const smokeX=x+125;
        for(let j=0;j<4;j++) {
          const rise=(j*9+t/170)%36;
          rect(c,smokeX+rise*.42,87-rise,5+rise*.27,2+rise*.1,'#d5becc29');
        }
        lamp(c,x+156,209,lit);
      }
      if(menu) {
        pine(c,349-offset,215,118,{decorated:true,t});
        gazebo(c,153-offset,209,true,t);
      } else if(world==='square'||world==='finale') {
        pine(c,(world==='square'?905:484)-offset,214,124,{decorated:true,lit:treeLit,t});
        if(world==='finale') gazebo(c,766-offset,214,true,t);
      }
    }
  }
  ground(c,offset,interior);
  if(world==='forest'&&offset<620&&offset+WIDTH>500) {
    rect(c,500-offset,FLOOR+4,103,15,'#7598a9');
    rect(c,500-offset,FLOOR+7,104,1,'#c1d4d8');
  }
  for(const o of obstacles) {
    const x=o.x-offset;
    rect(c,x,FLOOR-o.h,o.w,o.h,'#886266');
    rect(c,x,FLOOR-o.h,o.w,2,interior?'#d6a07d':'#e9eee7');
    for(let i=5;i<o.w;i+=7) rect(c,x+i,FLOOR-o.h+2,1,o.h-2,'#633f4d');
    if(o.bridge) fence(c,x,FLOOR-o.h,o.w);
  }
  if(state.goal&&!state.goal.npc&&world!=='forest') {
    const x=state.goal.x-offset;
    if(world==='kitchen') counter(c,x-37,FLOOR-24,74,'prep');
    else {
      rect(c,x-10,FLOOR-27,21,27,'#394556');
      rect(c,x-8,FLOOR-25,17,18,'#68717e');
      rect(c,x-4,FLOOR-19,3,3,lit?'#b7e193':'#dc7772');
    }
  }
  for(const item of items) {
    const x=item.x-offset, y=FLOOR-20-item.y+Math.sin(t/310+item.x)*2;
    glow(c,x,y,20,'#ffbf5849');
    spark(c,x+10,y-8,'#fff0b3',2);
    icon(c,item.icon,x,y);
  }
  const people = player ? [...npcs,player] : npcs;
  for(const p of people) {
    const x=p.x-offset;
    rect(c,x-10,p.y-1,20,3,'#453b5360');
    character(c,p.name,x,p.y,{...p,time:t});
  }
  if(state.cat) cat(c,state.cat.x-offset,FLOOR,t,state.cat.walk);
  if(event&&(!reduced||event.kind==='kiss')) drawEvent(c,reduced?{...state,event:{...event,age:600}}:state,t);
  if(!interior) {
    const count = reduced?16:switches>1050?86:49;
    for(let i=0;i<count;i++) {
      const [x,y,speed,f]=snowflakes[i];
      const sx=(x+WIDTH*4+Math.sin(t/1700+i)*12-offset*(.06+f*.12))%WIDTH;
      const sy=(y+t/1000*speed)%HEIGHT;
      rect(c,sx,sy,i%7===0?2:1,i%7===0?2:1,i%5?'#e5eff3aa':'#fff7e8');
    }
  }
  if(hint!==undefined) {
    const x=Math.max(25,Math.min(WIDTH-25,hint-offset));
    const y=146+Math.sin(t/290)*3;
    rect(c,x-10,y-8,20,15,'#272638');
    const d=hint-offset<25?-1:hint-offset>WIDTH-25?1:0;
    poly(c,d?[[x+d*5,y],[x-d*3,y-4],[x-d*3,y+4]]:[[x-4,y-2],[x+4,y-2],[x,y+4]],palette.gold);
  }
}

function drawEvent(c,state,t) {
  const {kind,x:worldX,age}=state.event, x=worldX-state.offset;
  if(kind==='spill'&&age<950){
    for(let i=0;i<7;i++) rect(c,x+5+i*2+age*.018,FLOOR-24-i+(age/170)**2,2,2,'#a87458');
  }
  if(kind==='bake'&&age<4500) {
    for(let i=0;i<5;i++) {
      const y=FLOOR-38-Math.min(age/70,28)-i*3;
      icon(c,'cookie',x+(i-2)*14,y);
      spark(c,x+(i-2)*14+5,y-8,'#ffda9c',2);
    }
  }
  if(kind==='repair'&&age<1300) {
    icon(c,'hammer',x+12+Math.sin(t/95)*3,FLOOR-30+Math.cos(t/95)*5);
    spark(c,x+18,FLOOR-18,'#ffd58b',3);
  }
  if(kind==='catch'&&age<850) {
    for(let i=0;i<5;i++) rect(c,x-i*4-age/100,FLOOR-5-i%3*3,2,2,'#f1efed');
  }
  if(kind==='illuminate') {
    glow(c,x-33,FLOOR-84,85,'#ffd17940');
    if(age<3600) for(let i=0;i<13;i++) spark(c,x-70+i*9,FLOOR-28-(i*19+age/28)%82,lampColors[i%4],2);
  }
  if(kind==='kiss') {
    glow(c,x,FLOOR-33,79,'#ffb18e60');
    for(let i=0;i<8;i++) {
      const y=FLOOR-30-((age/33+i*9)%80);
      const hx=x+(i-4)*7+Math.sin(i+t/700)*7;
      poly(c,[[hx,y],[hx-4,y-3],[hx-4,y-6],[hx-2,y-7],[hx,y-5],[hx+2,y-7],[hx+4,y-6],[hx+4,y-3]],i%2?'#f3979b':'#ffcfb3');
    }
  }
}
