const tune = [
  [72,1],[76,1],[79,2],[77,1],[76,1],[74,2],
  [69,1],[74,1],[77,2],[76,1],[74,1],[72,2],
  [67,1],[72,1],[76,2],[79,1],[81,1],[77,2],
  [76,1],[74,1],[69,2],[71,1],[74,1],[72,2]
];

export class Soundtrack {
  constructor(enabled) { this.enabled=enabled; this.mood='quiet'; }
  unlock() {
    if(!this.enabled) return;
    const WebAudio=window.AudioContext || window.webkitAudioContext;
    if (!WebAudio) return;
    if (!this.context) {
      this.context=new WebAudio();
      this.output=this.context.createGain();
      this.output.gain.value=.42;
      this.output.connect(this.context.destination);
      this.noteIndex=0;
      this.next=this.context.currentTime+.06;
      this.timer=window.setInterval(()=>this.schedule(),100);
    }
    if(this.context.state==='suspended') this.context.resume().catch(()=>{});
  }

  toggle(enabled) {
    this.enabled=enabled;
    if (enabled) this.unlock();
    if (this.output) this.output.gain.setTargetAtTime(enabled ? .42 : 0,this.context.currentTime,.03);
  }

  tone(midi, at, duration, volume, wave='sine') {
    const oscillator=this.context.createOscillator();
    const env=this.context.createGain();
    oscillator.type=wave;
    oscillator.frequency.value=440*2**((midi-69)/12);
    env.gain.setValueAtTime(.0001,at);
    env.gain.exponentialRampToValueAtTime(volume,at+.016);
    env.gain.exponentialRampToValueAtTime(.0001,at+duration);
    oscillator.connect(env).connect(this.output);
    oscillator.start(at);
    oscillator.stop(at+duration+.02);
  }

  schedule() {
    const now=this.context.currentTime;
    if(this.context.state!=='running') return;
    if(this.next<now-.3) this.next=now+.03;
    while(this.next<now+.2) {
      const [note,beats]=tune[this.noteIndex%tune.length];
      const bright=this.mood==='festival', tempo=bright ? .29 : .42;
      if(this.enabled) {
        this.tone(note,this.next,beats*tempo+.19,.095,'triangle');
        if(this.noteIndex%3===0) this.tone(note-24,this.next,1.05,.064);
        if(bright||this.noteIndex%6===0) this.tone(note+19,this.next+.04,.31,.022);
      }
      this.noteIndex++;
      this.next+=tempo*beats;
    }
  }

  footstep() {
    const audio=this.context;
    if(!this.snow) {
      this.snow=audio.createBuffer(1,Math.ceil(audio.sampleRate*.085),audio.sampleRate);
      const samples=this.snow.getChannelData(0);
      for(let i=0;i<samples.length;i++) {
        const fade=(1-i/samples.length)**2;
        samples[i]=(Math.random()*2-1)*fade*Math.min(1,i/130);
      }
    }
    const crunch=audio.createBufferSource();
    crunch.buffer=this.snow;
    const filter=audio.createBiquadFilter();
    filter.type='lowpass';
    filter.frequency.value=740;
    const volume=audio.createGain();
    volume.gain.value=.095;
    crunch.connect(filter).connect(volume).connect(this.output);
    crunch.start();
  }

  effect(name) {
    if(!this.enabled||!this.context) return;
    if(name==='step') { this.footstep(); return; }
    const cues={select:[72], collect:[76,84], trope:[72,76,79,84], illuminate:[60,67,72,76,79,84], kiss:[67,72,76,79,84]};
    const notes=cues[name]||cues.select;
    notes.forEach((note,i)=>this.tone(note,this.context.currentTime+.015+i*.075,.29,.12,'triangle'));
  }
}
