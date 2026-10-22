/* ===== Synth sound effects (WebAudio, no assets) ===== */
const SFX={on:true,ctx:null,master:null,nb:null,out:null,bus:null,bg:false,vol:{m:80,fx:100,vo:100,ui:100}};
try{SFX.on=localStorage.getItem('surgeSnd')!=='0';}catch(e){}
try{const v=JSON.parse(localStorage.getItem('surgeVol')||'null');if(v)for(const k in SFX.vol)if(typeof v[k]==='number')SFX.vol[k]=v[k];}catch(e){}
const _vg=(k,v)=>Math.pow(Math.max(0,Math.min(100,v))/100,1.7)*(k==='m'?.8:1);
function sfxSetVol(k,v){SFX.vol[k]=v;try{localStorage.setItem('surgeVol',JSON.stringify(SFX.vol));}catch(e){}
  const c=SFX.ctx;if(!c)return;const g=k==='m'?SFX.master:SFX.bus&&SFX.bus[k];if(g)g.gain.setTargetAtTime(_vg(k,v),c.currentTime,.012);}
function sfxInit(){
  if(SFX.ctx)return SFX.ctx;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
  const c=new C(),comp=c.createDynamicsCompressor(),m=c.createGain();m.gain.value=_vg('m',SFX.vol.m);m.connect(comp);comp.connect(c.destination);
  SFX.bus={};for(const k of['fx','vo','ui']){const g=c.createGain();g.gain.value=_vg(k,SFX.vol[k]);g.connect(m);SFX.bus[k]=g;}
  const b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  SFX.ctx=c;SFX.master=m;SFX.nb=b;return c;
}
function _tone(f0,f1,dur,type,g,at,att){
  const c=SFX.ctx,t=c.currentTime+(at||0),o=c.createOscillator(),gn=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const a=att||.005;gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(g,t+a);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(gn);gn.connect(SFX.out||SFX.master);o.start(t);o.stop(t+dur+.05);
}
function _noise(dur,f0,ftype,g,at,f1,q){
  const c=SFX.ctx,t=c.currentTime+(at||0),s=c.createBufferSource(),fl=c.createBiquadFilter(),gn=c.createGain();
  s.buffer=SFX.nb;s.loop=true;fl.type=ftype||'lowpass';fl.frequency.setValueAtTime(f0,t);if(f1)fl.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);fl.Q.value=q||1;
  gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(g,t+.01);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl);fl.connect(gn);gn.connect(SFX.out||SFX.master);s.start(t);s.stop(t+dur+.05);
}
function _voice(f0,f1,dur,g,fm1,fm2,at){
  const c=SFX.ctx,t=c.currentTime+(at||0),o=c.createOscillator(),gn=c.createGain(),b1=c.createBiquadFilter(),b2=c.createBiquadFilter(),mx=c.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+dur);
  b1.type=b2.type='bandpass';b1.frequency.value=fm1;b2.frequency.value=fm2;b1.Q.value=b2.Q.value=6;
  gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(g,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(b1);o.connect(b2);b1.connect(mx);b2.connect(mx);mx.connect(gn);gn.connect(SFX.out||SFX.master);o.start(t);o.stop(t+dur+.05);
}
const SFXS={
  step(){_noise(.07,520,'lowpass',.2,0,130);_tone(120,70,.07,'sine',.16);},
  kiai(){_voice(210,300,.26,.22,720,1250);_noise(.2,2200,'bandpass',.08,0,900,2);},
  cry(){_voice(330,110,.42,.16,560,1000);},
  slash(){_noise(.26,1300,'bandpass',.5,0,7500,3);_noise(.1,6000,'highpass',.18,.06);},
  shing(){[2200,3300,4400].forEach((f,i)=>_tone(f,f*.985,.75,'sine',.06-i*.01));_noise(.14,9000,'highpass',.14);},
  impact(){_noise(.55,800,'lowpass',.85,0,70);_tone(88,30,.55,'sine',.95);_noise(.07,5200,'highpass',.4);_tone(240,120,.12,'square',.18);},
  riser(){_noise(1.2,260,'bandpass',.2,0,4600,2);_tone(110,540,1.2,'sawtooth',.09);[330,415,494].forEach((f,i)=>_tone(f,f*1.5,1.1,'triangle',.05,i*.08,.5));},
  sting(){_tone(65,60,1.7,'sawtooth',.22,0,.02);[220,277,330,440].forEach(f=>_tone(f,f*.995,1.4,'square',.05,.02));_noise(1,1400,'lowpass',.3,0,180);_tone(1760,880,.5,'sine',.07);},
  heart(){_tone(58,40,.14,'sine',.75);_tone(58,40,.14,'sine',.5,.2);},
  move(){_tone(190,100,.09,'sine',.4);_noise(.05,1800,'bandpass',.18,0,0,2);},
  capture(){_noise(.24,1100,'lowpass',.7,0,200);_tone(150,45,.28,'triangle',.6);_noise(.05,4000,'highpass',.25);},
  boom(){_noise(1,600,'lowpass',.95,0,60);_tone(95,28,.9,'sine',.9);},
  mimpact(){_noise(.45,800,'lowpass',.65,0,90);_tone(120,40,.4,'sine',.6);_noise(.08,3500,'highpass',.2);},
  whoosh(){_noise(.55,300,'bandpass',.3,0,2800,2);},
  orb(){_tone(880,1320,.28,'sine',.18);_tone(1320,1760,.22,'sine',.12,.09);},
  pickup(){[523,659,784,1047].forEach((f,i)=>_tone(f,f,.16,'triangle',.22,i*.07));},
  crown(){[440,554,659,880].forEach((f,i)=>_tone(f,f,1,'sine',.1,i*.05,.25));},
  zap(){_noise(.2,5000,'highpass',.4,0,1200);_tone(1400,180,.18,'sawtooth',.22);},
  runes(){[784,1175,1568].forEach((f,i)=>_tone(f,f,.7,'sine',.15,i*.09));},
  rez(){_tone(220,220,1.2,'sine',.3,0,.1);_tone(330,330,1.1,'sine',.2,.1,.1);_noise(.9,400,'lowpass',.25,0,1800);},
  frost(){_noise(.5,7000,'highpass',.3,0,3000);_tone(1900,900,.35,'sine',.16);},
  mine(){SFXS.boom();SFXS.zap();},
  coin(){_tone(1568,1568,.09,'square',.12);_tone(2093,2093,.2,'square',.12,.08);},
  ignite(){_noise(.9,300,'bandpass',.4,0,3200,1.5);_tone(220,520,.7,'sawtooth',.14);_noise(.5,2500,'highpass',.12,.3);},
  shut(){_tone(440,110,.55,'triangle',.35);_noise(.4,1200,'lowpass',.3,0,200);},
  check(){[880,660,880].forEach((f,i)=>_tone(f,f,.14,'square',.16,i*.15));},
  mate(){_tone(110,110,2,'sine',.55,0,.02);_tone(165,165,1.8,'sine',.3,.05);SFXS.boom();},
  pick(){_tone(660,990,.14,'triangle',.25);_tone(990,1320,.16,'sine',.15,.06);},
  portal(){_tone(300,1300,.28,'sine',.25);_tone(1300,300,.3,'sine',.2,.3);_noise(.4,2000,'bandpass',.12,0,600,2);},
  shot(){_noise(.12,3500,'highpass',.5,0,800);_tone(520,110,.16,'sawtooth',.3);},
  place(){_tone(180,90,.14,'square',.25);_noise(.08,1200,'lowpass',.35);_tone(700,700,.06,'square',.12,.1);},
  cloak(){_tone(900,300,.6,'sine',.18);_tone(1350,450,.55,'sine',.1,.05);_noise(.5,3000,'bandpass',.1,0,800,2);},
  bounty(){[1047,1319,1568].forEach((f,i)=>_tone(f,f,.18,'square',.11,i*.07));_noise(.1,6000,'highpass',.2,.1);},
  boss(){_tone(70,45,1.6,'sawtooth',.4,0,.15);_tone(105,60,1.4,'sine',.4);_noise(1.2,500,'lowpass',.5,0,80);},
  bosshit(){_tone(300,90,.3,'square',.2);_noise(.2,2000,'bandpass',.3,0,400,2);},
  fort(){[392,523,659,784].forEach((f,i)=>_tone(f,f,.9,'sine',.12,i*.06,.1));},
  chime(){_tone(784,784,.5,'sine',.15);_tone(988,988,.6,'sine',.12,.1);},
  uihover(){_tone(1500,1900,.045,'sine',.09);_noise(.03,6000,'highpass',.03);},
  uiclick(){_tone(520,820,.09,'triangle',.22);_tone(1040,1400,.07,'sine',.09,.03);_noise(.04,5000,'highpass',.07);},
  uiback(){_tone(620,330,.12,'triangle',.2);_noise(.05,2500,'bandpass',.06,0,600,2);},
  uiopen(){_noise(.22,500,'bandpass',.12,0,3200,2);_tone(440,880,.18,'sine',.1);},
  uistart(){_noise(.9,200,'bandpass',.25,0,5200,2);_tone(98,392,.8,'sawtooth',.1);[392,494,587].forEach((f,i)=>_tone(f,f,.5,'triangle',.07,.55+i*.05));},
  uideny(){_tone(180,120,.16,'square',.14);_tone(150,100,.18,'square',.12,.08);}
};
const SFX_CAT={kiai:'vo',cry:'vo',uihover:'ui',uiclick:'ui',uiback:'ui',uiopen:'ui',uistart:'ui',uideny:'ui'};
/* slider scrub sound: a quick pitched zip that glides up when raising, down when lowering; it plays through the bus being edited so you hear the level change */
function sfxZip(bus,v,dir){
  const c=SFX.ctx;if(!c||!SFX.on)return;
  try{if(c.state==='suspended')c.resume();SFX.out=bus==='m'?SFX.master:(SFX.bus[bus]||SFX.master);
    const f=240+v*10.5,up=dir>=0;
    _tone(f,f*(up?1.55:.62),.085,'sawtooth',.2,0,.004);_tone(f*2,f*(up?3.1:1.2),.055,'square',.05);_noise(.06,2400+v*30,'bandpass',.1,0,up?9500:800,3);
  }catch(e){}SFX.out=null;
}
function sfx(name,delayMs){
  if(!SFX.on)return;
  if(SFX.bg&&name.slice(0,2)!=='ui')return;
  if(delayMs>0){setTimeout(()=>sfx(name),delayMs);return;}
  const c=SFX.ctx;if(!c)return;
  try{if(c.state==='suspended')c.resume();const f=SFXS[name];SFX.out=SFX.bus[SFX_CAT[name]||'fx'];if(f)f();}catch(e){}SFX.out=null;
}
document.addEventListener('pointerdown',()=>{const c=sfxInit();if(c&&c.state==='suspended')c.resume();},{passive:true});
