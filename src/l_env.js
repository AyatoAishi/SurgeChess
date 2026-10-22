/* ===== Environments: palettes, scenery, craters, puddles, wind ===== */
const V3ENV={
  volcano:{L:0x6a5148,D:0x261917,rough:.85,met:.05,slab:0x1b0e0b,em:0x6a1a05,emi:.7,trim:0xc2561f,bg:0x1d0a06,fog:[60,210],key:0xffb27a,keyI:1.1,exp:.5,tilt:.94},
  sky:{L:0x8aa6c4,D:0x34607f,rough:.7,met:0,slab:0x4f4a56,em:0x000000,emi:0,trim:0xb4c6da,bg:0x6aa2dc,fog:[50,150],key:0xe4eeff,keyI:1.5,exp:.52,tilt:.94},
  rain:{L:0x7aa05a,D:0x35643a,rough:.6,met:0,slab:0x2a1c10,em:0x03140a,emi:.3,trim:0x7a5528,bg:0x0e231a,fog:[30,100],key:0xd8f0c8,keyI:1.0,exp:.55,tilt:.94}
};
function envRnd(a,b){return a+Math.random()*(b-a);}
function envMat(c,o){return new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.95,metalness:0,flatShading:true,envMapIntensity:.15},o||{}));}
function envMesh(g,m,x,y,z,cs){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.raycast=()=>{};if(cs)o.castShadow=o.receiveShadow=true;return o;}
function envCloud(R,sc){
  const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0x9fb4cc,emissiveIntensity:.55,transparent:true,opacity:.96,flatShading:false});
  const n=4+((Math.random()*3)|0);
  for(let k=0;k<n;k++){const s=envRnd(.8,1.8)*sc,b=envMesh(new THREE.SphereGeometry(s,10,8),m,(k-n/2)*sc*1.1+envRnd(-.3,.3),envRnd(-.2,.5)*sc,envRnd(-.8,.8)*sc);b.scale.y=.6;g.add(b);}
  return g;
}
function envTree(h,leaf,trunk){
  const g=new THREE.Group(),tm=envMat(trunk),lm=envMat(leaf);
  g.add(envMesh(new THREE.CylinderGeometry(.28*h/8,.5*h/8,h,7),tm,0,h/2,0));
  for(let k=0;k<3;k++){const s=envRnd(2.2,3.6)*h/9;g.add(envMesh(new THREE.IcosahedronGeometry(s,0),lm,envRnd(-1.4,1.4)*h/9,h-.5+k*.9*h/9,envRnd(-1.4,1.4)*h/9));}
  return g;
}
function v3EnvClear(R){
  if(R.envG){R.scene.remove(R.envG);R.envG.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  R.envG=null;R.envU=[];R.envLights=[];
}
function v3EnvPalette(R){
  const P=V3ENV[R.envKey];if(!P)return;const h=R.th;
  h.mL.color.set(P.L);h.mD.color.set(P.D);h.mL.roughness=h.mD.roughness=P.rough;h.mL.metalness=h.mD.metalness=P.met;
  h.slabM.color.set(P.slab);h.slabM.emissive.set(P.em);h.slabM.emissiveIntensity=P.emi;h.trimM.color.set(P.trim);
  R.scene.background.set(P.bg);R.scene.fog.color.set(P.bg);R.scene.fog.near=P.fog[0];R.scene.fog.far=P.fog[1];h.gnd.material.color.set(P.bg);
  R.key.color.set(P.key);R.renderer.toneMappingExposure=P.exp;R.key.intensity=P.keyI;R.tiles.forEach(t=>t.scale.set(P.tilt,1,P.tilt));
  R.cam.far=260;R.cam.updateProjectionMatrix();R.dirty=true;
}
function v3Env(R,key){
  v3EnvClear(R);R.envKey=key;
  for(const m of[...(R.envObj||new Map()).values()])R.scene.remove(m.g);R.envObj=new Map();
  if(!V3ENV[key]){R.envKey=null;return;}
  v3EnvPalette(R);
  const G3=new THREE.Group();R.envG=G3;R.scene.add(G3);const U=R.envU;
  const flat=key==='sky'||key==='volcano'||key==='rain';R.th.gnd.visible=!flat;if(R.shp)R.shp.visible=!flat;
  const N2=N/2;
  if(key==='volcano'){
    const lav=v3Tex((c,s)=>{c.fillStyle='#b02a06';c.fillRect(0,0,s,s);for(let k=0;k<160;k++){const x=Math.random()*s,y=Math.random()*s,r=8+Math.random()*26;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,200,60,.9)');g.addColorStop(.5,'rgba(255,90,20,.6)');g.addColorStop(1,'rgba(120,20,0,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}for(let k=0;k<30;k++){c.fillStyle='rgba(20,6,4,.55)';c.beginPath();c.ellipse(Math.random()*s,Math.random()*s,6+Math.random()*22,3+Math.random()*10,Math.random()*3,0,7);c.fill();}},256);
    lav.wrapS=lav.wrapT=THREE.RepeatWrapping;lav.repeat.set(7,7);
    const lake=envMesh(new THREE.CircleGeometry(110,40),new THREE.MeshBasicMaterial({map:lav,fog:false,toneMapped:false}),0,-2.6,0);lake.rotation.x=-Math.PI/2;G3.add(lake);
    U.push((t)=>{lav.offset.set(t*.012,t*.006);});
    const rockM=envMat(0x2a1d1b);
    G3.add(envMesh(new THREE.CylinderGeometry(N2+1.7,N2+3.6,2.6,10),rockM,0,-2.2,0));
    for(let k=0;k<16;k++){const a=k/16*6.283+envRnd(-.15,.15),r=N2+envRnd(1.5,4.5),s=envRnd(.5,1.5);G3.add(envMesh(new THREE.DodecahedronGeometry(s,0),rockM,Math.cos(a)*r,-1.9+s*.3,Math.sin(a)*r));}
    const coneM=envMat(0x241a1a);
    const BX=-52,BZ=-34,BS=1.4,big=new THREE.Group();big.position.set(BX,0,BZ);big.scale.setScalar(BS);G3.add(big);
    big.add(envMesh(new THREE.CylinderGeometry(3.2,15,10.5,16),coneM,0,2.65,0));
    const lm=new THREE.MeshBasicMaterial({color:0xff6a1a,toneMapped:false});
    {const cr=envMesh(new THREE.CircleGeometry(3.2,18),lm,0,7.92,0);cr.rotation.x=-Math.PI/2;big.add(cr);}
    for(let k=0;k<7;k++){const a=new THREE.Group();a.rotation.y=-Math.PI/2+(k-3)*.3;const ang=Math.atan2(10.5,11.8);const st=envMesh(new THREE.BoxGeometry(15.4,.08,.6),lm,9.2,2.75,0);st.rotation.z=-ang;a.add(st);big.add(a);}
    const L1=new THREE.PointLight(0xff6a1a,2.4,110,1.6);L1.position.set(BX,10*BS,BZ);G3.add(L1);
    const mk2=(x,z,h,r)=>{const g=new THREE.Group();g.position.set(x,0,z);g.add(envMesh(new THREE.CylinderGeometry(r*.3,r,h,10),coneM,0,h/2-2,0));const cr=envMesh(new THREE.CircleGeometry(r*.3,12),lm,0,h-1.95,0);cr.rotation.x=-Math.PI/2;g.add(cr);G3.add(g);};
    mk2(46,-30,9,7);mk2(-62,-6,8,6.5);mk2(22,-70,13,9.5);mk2(-34,-62,9,6.5);
    const smoke=[];for(let k=0;k<14;k++){const s=v3Sprite(R,R.tex.soft,new THREE.Color(0x3a2a28),false);s.material.opacity=.5;s.renderOrder=3;G3.add(s);smoke.push({s,o:Math.random()});}
    U.push((t)=>{for(const m of smoke){const k=(t*.07+m.o)%1;m.s.position.set(BX+Math.sin(k*5+m.o*9)*3+k*6,11*BS+k*26,BZ+k*-4);m.s.scale.setScalar(7+k*20);m.s.material.opacity=.55*(1-k)*Math.min(1,k*8);}});
    const em=[];for(let k=0;k<70;k++){const s=v3Sprite(R,R.tex.glow,new THREE.Color(0xff7a2a));s.scale.setScalar(.14);s.material.toneMapped=false;G3.add(s);em.push({s,x:envRnd(-22,22),z:envRnd(-22,22),o:Math.random(),sp:envRnd(.4,1.2)});}
    U.push((t)=>{for(const e of em){const k=(t*.12*e.sp+e.o)%1;e.s.position.set(e.x+Math.sin(t+e.o*20)*.8,-1+k*14,e.z);e.s.material.opacity=Math.sin(k*3.14);}});
    const L2=new THREE.PointLight(0xff5a1a,1.3,36,2);L2.position.set(0,-1.6,0);G3.add(L2);U.push((t)=>{L2.intensity=1.2+Math.sin(t*3.1)*.25+Math.sin(t*7.3)*.12;});
  }
  if(key==='sky'){
    const earth=envMat(0x6b5034),grass=envMat(0x62ad56),stone=envMat(0x8a8176);
    const isl=envMesh(new THREE.ConeGeometry(N2+3.4,10,9),earth,0,-6,0);isl.rotation.x=Math.PI;G3.add(isl);
    G3.add(envMesh(new THREE.CylinderGeometry(N2+3.4,N2+3.4,.35,9),grass,0,-1.02,0));
    for(let k=0;k<12;k++){const a=k/12*6.283+envRnd(-.2,.2),r=envRnd(2,N2+1.5),h=envRnd(2,6);const c=new THREE.Mesh(new THREE.ConeGeometry(envRnd(.4,1.1),h,6),stone);c.rotation.x=Math.PI;c.position.set(Math.cos(a)*r,-8-h/2+3,Math.sin(a)*r);G3.add(c);}
    const bush=envMat(0x3f8a45);for(let k=0;k<18;k++){const a=k/18*6.283+envRnd(-.15,.15),r=N2+envRnd(.9,2.4);G3.add(envMesh(new THREE.IcosahedronGeometry(envRnd(.3,.7),0),bush,Math.cos(a)*r,-.7,Math.sin(a)*r));}
    const floaters=[];
    for(let k=0;k<7;k++){const g=new THREE.Group(),a=k/7*6.283+envRnd(-.3,.3),r=envRnd(17,30),s=envRnd(1.6,3.4);const c=new THREE.Mesh(new THREE.ConeGeometry(s,s*1.6,7),earth);c.rotation.x=Math.PI;c.position.y=-s*.8;g.add(c);g.add(envMesh(new THREE.CylinderGeometry(s,s,.3,7),grass,0,.05,0));g.add(envTree(envRnd(2.5,4.5),0x3f9a4a,0x6a4a2a).translateY(.1).translateX(envRnd(-.3,.3)));g.position.set(Math.cos(a)*r,envRnd(-4,5),Math.sin(a)*r);G3.add(g);floaters.push({g,y:g.position.y,o:Math.random()*6});}
    U.push((t)=>{for(const f of floaters)f.g.position.y=f.y+Math.sin(t*.5+f.o)*.5;});
    const clouds=[];
    for(let k=0;k<22;k++){const c=envCloud(R,envRnd(1.4,3.2)),a=Math.random()*6.283,r=envRnd(14,60);c.position.set(Math.cos(a)*r,envRnd(-19,-13),Math.sin(a)*r);G3.add(c);clouds.push({c,sp:envRnd(.15,.5)});}
    for(let k=0;k<6;k++){const c=envCloud(R,envRnd(2,3.5)),a=Math.random()*6.283,r=envRnd(48,70);c.position.set(Math.cos(a)*r,envRnd(-6,2),Math.sin(a)*r);G3.add(c);clouds.push({c,sp:envRnd(.1,.25)});}
    for(let k=0;k<26;k++){const c=envCloud(R,envRnd(4,8)),a=Math.random()*6.283,r=envRnd(8,90);c.position.set(Math.cos(a)*r,envRnd(-28,-22),Math.sin(a)*r);G3.add(c);clouds.push({c,sp:envRnd(.1,.3)});}
    U.push((t,dt)=>{for(const c of clouds){c.c.position.x+=c.sp*dt;if(c.c.position.x>70)c.c.position.x=-70;}});
    const deep=envMesh(new THREE.CircleGeometry(240,40),new THREE.MeshBasicMaterial({color:0x1e4a82}),0,-48,0);deep.rotation.x=-Math.PI/2;G3.add(deep);
    const sun=v3Sprite(R,R.tex.glow,new THREE.Color(0xfff0b0));sun.scale.setScalar(60);sun.position.set(40,34,-70);sun.material.toneMapped=false;sun.material.opacity=.55;G3.add(sun);
  }
  if(key==='rain'){
    R.th.gnd.material.color.set(0x16301f);
    G3.add(envMesh(new THREE.CylinderGeometry(N2+2.2,N2+3,1.6,12),envMat(0x3d5a2a),0,-1.7,0));
    const gr=new THREE.Mesh(new THREE.CircleGeometry(120,30),new THREE.MeshStandardMaterial({color:0x12301a,roughness:1,metalness:0,envMapIntensity:0}));gr.rotation.x=-Math.PI/2;gr.position.y=-2.6;gr.raycast=()=>{};G3.add(gr);
    const leaves=[0x2f7a3c,0x3e9a4a,0x276b34,0x4aa653],trunks=[0x5a3e24,0x4a3320,0x6a4a2c];
    for(let k=0;k<44;k++){const a=Math.random()*6.283,r=envRnd(12,38);if(Math.sin(a)*r>8)continue;const t=envTree(envRnd(5,9),leaves[k%4],trunks[k%3]);t.position.set(Math.cos(a)*r,-2.6,Math.sin(a)*r);G3.add(t);
      if(Math.random()<.5){const vm=envMat(0x2e8a3a);for(let j=0;j<3;j++){const L=envRnd(2,5);G3.add(envMesh(new THREE.CylinderGeometry(.04,.04,L,4),vm,t.position.x+envRnd(-2,2),7-L/2+envRnd(0,3),t.position.z+envRnd(-2,2)));}}}
    const fern=envMat(0x3c9a48);for(let k=0;k<70;k++){const a=envRnd(3.4,6.0),r=envRnd(N2+1.5,24);const c=new THREE.Mesh(new THREE.ConeGeometry(envRnd(.35,.9),envRnd(1,2.2),5),fern);c.position.set(Math.cos(a)*r,-2.2,Math.sin(a)*r);c.rotation.set(envRnd(-.5,.5),0,envRnd(-.5,.5));c.raycast=()=>{};G3.add(c);}
    for(let k=0;k<14;k++){G3.add(envMesh(new THREE.DodecahedronGeometry(envRnd(.5,1.2),0),envMat(0x5a6358),Math.cos(k)*envRnd(8,22),-2.2,-Math.abs(Math.sin(k*1.7))*envRnd(8,22)));}
    const NR=420,pos=new Float32Array(NR*6),spd=new Float32Array(NR);
    const RX=26,RY=24;for(let k=0;k<NR;k++){spd[k]=envRnd(18,30);const x=envRnd(-RX,RX),y=envRnd(0,RY),z=envRnd(-RX,RX);pos.set([x,y,z,x-.05,y+.9,z],k*6);}
    const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xbfe0ff,transparent:true,opacity:.55,depthWrite:false}));rain.frustumCulled=false;rain.raycast=()=>{};G3.add(rain);
    U.push((t,dt)=>{const p=rg.attributes.position.array;for(let k=0;k<NR;k++){const d=spd[k]*dt;p[k*6+1]-=d;p[k*6+4]-=d;if(p[k*6+1]<-1.5){const y=RY,x=envRnd(-RX,RX),z=envRnd(-RX,RX);p[k*6]=x;p[k*6+1]=y;p[k*6+2]=z;p[k*6+3]=x-.05;p[k*6+4]=y+.9;p[k*6+5]=z;}}rg.attributes.position.needsUpdate=true;});
    const mist=[];for(let k=0;k<10;k++){const s=v3Sprite(R,R.tex.soft,new THREE.Color(0xa8d8b8),false);s.material.opacity=.14;s.scale.setScalar(envRnd(14,26));const a=Math.random()*6.283,r=envRnd(8,30);s.position.set(Math.cos(a)*r,envRnd(0,3),Math.sin(a)*r);G3.add(s);mist.push({s,o:Math.random()*6});}
    U.push((t)=>{for(const m of mist)m.s.material.opacity=.11+Math.sin(t*.3+m.o)*.04;});
    const ff=[];for(let k=0;k<26;k++){const s=v3Sprite(R,R.tex.glow,new THREE.Color(0xc8ff7a));s.scale.setScalar(.22);s.material.toneMapped=false;const a=Math.random()*6.283,r=envRnd(6,22);s.position.set(Math.cos(a)*r,envRnd(.4,4),Math.sin(a)*r);G3.add(s);ff.push({s,o:Math.random()*6,b:s.position.clone()});}
    U.push((t)=>{for(const f of ff){f.s.position.set(f.b.x+Math.sin(t*.6+f.o)*1.4,f.b.y+Math.sin(t*.9+f.o*2)*.5,f.b.z+Math.cos(t*.5+f.o)*1.4);f.s.material.opacity=.4+.6*Math.max(0,Math.sin(t*1.7+f.o*3));}});
  }
  R.dirty=true;
}
function v3EnvUpd(R,t,dt){
  if(!R.envKey)return false;
  for(const f of R.envU)f(t,dt);
  for(const o of R.envObj.values())o.g.userData.upd&&o.g.userData.upd(t,dt);
  return true;
}
/* craters & puddles: keyed meshes kept in sync with G.cr / G.pd */
function v3EnvSync(R){
  const want=new Map();
  for(const s of G.cr)want.set('c'+s,{t:'c',sq:s});
  for(const d of G.pd)want.set('p'+d.sq,{t:'p',sq:d.sq,n:d.n});
  for(const[k,o]of[...R.envObj])if(!want.has(k)){const t0=performance.now(),g=o.g;g.userData.upd=null;R.anims.push({upd:()=>{const q=Math.min(1,(performance.now()-t0)/500);g.scale.setScalar(Math.max(.01,1-q));if(q>=1){R.scene.remove(g);return true;}}});R.envObj.delete(k);}
  for(const[k,w]of want){
    let o=R.envObj.get(k);
    if(!o){
      const g=new THREE.Group();g.position.set(sqX(w.sq),0,sqZ(w.sq));
      if(w.t==='c'){
        const ds=new THREE.Mesh(new THREE.CircleGeometry(.47,24),new THREE.MeshBasicMaterial({color:0x120705,transparent:true,opacity:.92,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}));ds.rotation.x=-Math.PI/2;ds.position.y=.03;ds.raycast=()=>{};g.add(ds);
        const gl=new THREE.Mesh(new THREE.RingGeometry(.2,.44,24),new THREE.MeshBasicMaterial({color:0xff5a14,transparent:true,opacity:.85,toneMapped:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,side:THREE.DoubleSide}));gl.rotation.x=-Math.PI/2;gl.position.y=.035;gl.raycast=()=>{};g.add(gl);
        const sp=v3Sprite(R,R.tex.glow,new THREE.Color(0xff6a20));sp.scale.set(1.5,1.5,1);sp.position.y=.2;sp.material.opacity=.6;sp.material.toneMapped=false;g.add(sp);
        const ph=Math.random()*6;g.userData.upd=(t)=>{const f=.6+.4*Math.sin(t*4+ph)+.15*Math.sin(t*9+ph);gl.material.opacity=.55+.4*f;sp.material.opacity=.3+.4*f;};
      }else{
        const pm=new THREE.MeshStandardMaterial({color:0x3f86b8,roughness:.05,metalness:.55,transparent:true,opacity:.82,envMapIntensity:1.6,polygonOffset:true,polygonOffsetFactor:-3});
        const ds=new THREE.Mesh(new THREE.CircleGeometry(.45,26),pm);ds.rotation.x=-Math.PI/2;ds.scale.set(1,1.15,1);ds.position.y=.03;ds.raycast=()=>{};g.add(ds);
        const rm=new THREE.MeshBasicMaterial({color:0xdff4ff,transparent:true,opacity:0,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
        const rg=new THREE.Mesh(new THREE.RingGeometry(.9,1,26),rm);rg.rotation.x=-Math.PI/2;rg.position.y=.04;rg.raycast=()=>{};g.add(rg);
        const ph=Math.random()*3;g.userData.upd=(t)=>{const k=((t*.8+ph)%1);rg.scale.setScalar(.15+k*.34);rm.opacity=.55*(1-k);const u=g.userData.n||0;pm.color.setRGB(.25+u*.01,.52+u*.02,.72-u*.015);};
      }
      if(FX.on&&!R.first){g.scale.setScalar(.01);const t0=performance.now();R.anims.push({upd:()=>{const q=Math.min(1,(performance.now()-t0)/500);g.scale.setScalar(Math.max(.01,1-Math.pow(1-q,3)*Math.cos(q*5)));if(q>=1){g.scale.setScalar(1);return true;}}});}
      R.scene.add(g);o={g};R.envObj.set(k,o);
    }
    if(w.t==='p')o.g.userData.n=w.n||0;
  }
}
/* event visuals */
function v3EnvFx(R,e,q){
  if(e.k==='volmeteor'){
    setTimeout(()=>v3Streak(R,q,'255,120,40',650,22,()=>{sfx('boom');v3Ring(R,q,{col:'255,120,40',r0:.2,r1:3.2,ms:760,a:1});v3Burst(R,q,'255,170,70',3.6,600);v3Emit(R,q,{n:50,col:'255,150,50',v0:2,v1:8,l0:.5,l1:1.3,g:-7});v3Emit(R,{x:q.x,y:.3,z:q.z},{n:18,col:'60,40,38',blend:false,v0:.5,v1:2,l0:.9,l1:1.6,s0:.5,s1:1,g:1,up:1.2});v3Flash(R,'255,130,50',q,500,26);v3Shake(R,.35,360);}),Math.random()*200);
    return true;}
  if(e.k==='craterGone'){setTimeout(()=>{v3Emit(R,{x:q.x,y:.2,z:q.z},{n:14,col:'70,50,46',blend:false,v0:.3,v1:1,l0:.7,l1:1.4,s0:.3,s1:.7,g:1,up:1.1});},300);return true;}
  if(e.k==='gale'){
    sfx('chime',0);
    const z=sqZ(e.row*N),h=N/2+3,dir=e.dir;
    for(let k=0;k<18;k++){
      const m=new THREE.Mesh(new THREE.PlaneGeometry(envRnd(1.6,3.4),.045),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));
      const y=envRnd(.15,1.6),zz=z+envRnd(-.45,.45),x0=-dir*h,x1=dir*h,t0=performance.now()+Math.random()*350,dur=650+Math.random()*250;m.position.set(x0,y,zz);m.raycast=()=>{};R.fxRoot.add(m);
      R.anims.push({upd:()=>{const t=(performance.now()-t0)/dur;if(t<0)return false;if(t>=1){R.fxRoot.remove(m);m.geometry.dispose();m.material.dispose();return true;}m.position.x=x0+(x1-x0)*t;m.material.opacity=.8*Math.sin(t*3.14);m.position.y=y+Math.sin(t*9+k)*.06;return false;}});
    }
    v3Shake(R,.12,500);return true;}
  if(e.k==='rainorb'){
    setTimeout(()=>{const q2={x:sqX(e.to),z:sqZ(e.to)};v3Ring(R,q,{col:'150,220,255',r0:.2,r1:2.2,ms:700,a:1});v3Ring(R,q2,{col:'150,255,190',r0:.2,r1:1.6,ms:700,a:1});v3Emit(R,{x:q.x,y:.2,z:q.z},{n:26,col:'170,230,255',v0:.8,v1:3,l0:.5,l1:1,g:-1,up:1.3});v3Emit(R,{x:q2.x,y:.4,z:q2.z},{n:20,col:'160,255,190',v0:.6,v1:2.4,l0:.5,l1:1,g:-1,up:1.2});sfx('pickup',0);},150);
    return true;}
  if(e.k==='puddle'){setTimeout(()=>{v3Ring(R,q,{col:'170,225,255',r0:.1,r1:1.4,ms:600,a:.9});},120);return true;}
  return false;
}
