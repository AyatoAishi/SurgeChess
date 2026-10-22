/* ===== True 3D board: live Three.js scene, drag to orbit, wheel/pinch to zoom ===== */
const V3={ok:false,on:false,inited:false,R:null};
let V3R=null;
const V3H={DR:6,KR:6,W:1.6,A:2.2,P:2.0,N:3.1,B:2.7,R:2.5,Q:2.7,K:3.0,M:2.8,C:2.6,H:2.8,X:1.5,T:1.9,Z:6};
const V3S=.5;
const sqX=i=>colOf(i)-(N-1)/2,sqZ=i=>rowOf(i)-(N-1)/2;
const bossX=a=>colOf(a)-(N-2)/2,bossZ=a=>rowOf(a)-(N-2)/2;
function v3Tex(draw,size){const c=document.createElement('canvas');c.width=c.height=size||128;const x=c.getContext('2d');draw(x,c.width);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;}
function v3Bake(type,c){
  const g=MODEL[type](pal(c));g.updateMatrixWorld(true);
  const by=new Map();
  g.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();
    let e=by.get(o.material);if(!e){e={pos:[],nor:[]};by.set(o.material,e);}
    e.pos.push(geo.attributes.position.array);e.nor.push(geo.attributes.normal.array);});
  const parts=[];
  for(const[mat,e]of by){
    const n=e.pos.reduce((a,b)=>a+b.length,0),P=new Float32Array(n),Nn=new Float32Array(n);let k=0;
    for(let j=0;j<e.pos.length;j++){P.set(e.pos[j],k);Nn.set(e.nor[j],k);k+=e.pos[j].length;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn,3));
    geo.computeBoundingSphere();parts.push({geo,mat});
  }
  return parts;
}
function v3Init(){
  if(V3.inited)return V3.ok;V3.inited=true;
  if(typeof THREE==='undefined')return false;
  try{
    const cv=$('gl3');
    const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x090e18);scene.fog=new THREE.Fog(0x090e18,34,80);
    const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(makeEnv()).texture;
    scene.add(new THREE.HemisphereLight(0xa9bcee,0x1a1822,.45));
    const key=new THREE.DirectionalLight(0xffe2bd,2.0);key.position.set(-8,16,10);key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:2,far:45});key.shadow.bias=-.0004;key.shadow.normalBias=.03;scene.add(key);
    const rim=new THREE.DirectionalLight(0x7f9fff,1.4);rim.position.set(9,7,-10);scene.add(rim);
    const fill=new THREE.DirectionalLight(0xc0a0ff,.5);fill.position.set(8,4,12);scene.add(fill);
    const flash=new THREE.PointLight(0xff9a50,0,40,2);flash.position.set(0,4,0);scene.add(flash);
    const cam=new THREE.PerspectiveCamera(36,1,.5,240);
    const R={renderer,scene,cam,deco:[],lastDraw:0,key,flash,pcs:new Map(),orbs:new Map(),mines:new Map(),marks:new Map(),anims:[],parts:[],pool:[],ov:[],tiles:[],
      pieceRoot:new THREE.Group(),fxRoot:new THREE.Group(),first:true,dirty:true,last:0,shake:0,az:0,el:.9,rad:22,tgt:new THREE.Vector3(0,.4,0),bake:{},tex:{}};
    scene.add(R.pieceRoot,R.fxRoot);
    R.q=3;R.fe=16;R.up=0;R.sf=0;R.sk=20;R.dpr0=Math.min(window.devicePixelRatio||1,1.5);
    try{const m=/[?&]q=(\d)/.exec(location.search);if(m){R.qForce=+m[1];}}catch(e){}
    /* textures */
    R.tex.glow=v3Tex((x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);});
    R.tex.soft=v3Tex((x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);},64);
    /* board */
    const mL=new THREE.MeshStandardMaterial({color:0xb4c1d6,roughness:.55,metalness:.08}),mD=new THREE.MeshStandardMaterial({color:0x4d6a92,roughness:.55,metalness:.12});
    const slabM=new THREE.MeshStandardMaterial({color:0x0e1626,roughness:.8,metalness:0,envMapIntensity:.15}),trimM=new THREE.MeshStandardMaterial({color:0xe2b640,roughness:.3,metalness:.85});
    const gnd=new THREE.Mesh(new THREE.CircleGeometry(80,48),new THREE.MeshBasicMaterial({color:0x090e18,fog:false}));gnd.rotation.x=-Math.PI/2;gnd.position.y=-.92;scene.add(gnd);
    const shp=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:.5}));shp.rotation.x=-Math.PI/2;shp.position.y=-.9;shp.receiveShadow=true;scene.add(shp);
    const bm=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    R.M={edot:bm(0xff5a6a),fire:bm(0xff3a10),warn:bm(0xffa040),sel:bm(0xffffff),last:bm(0xffd666),chk:bm(0xff3a50),rz:bm(0xff4a60),mt:bm(0xff8a30),tgt:bm(0x3fdc8a),dot:bm(0x0e1621),cap:bm(0xff4a60),chute:bm(0x3fdc8a)};
    R.M.edot.opacity=.7;R.M.fire.opacity=.5;R.M.warn.opacity=.28;R.M.sel.opacity=.55;R.M.last.opacity=.42;R.M.chk.opacity=.7;R.M.rz.opacity=.3;R.M.mt.opacity=.38;R.M.tgt.opacity=.35;R.M.dot.opacity=.55;R.M.cap.opacity=.9;R.M.chute.opacity=.9;
    R.th={mL,mD,slabM,trimM,gnd};R.shp=shp;
    v3BuildBoard(R);
    R.hovI=-1;R.lastChk=-1;R.trail=null;R.trailKey='';R.punch=null;
    R.hring=new THREE.Mesh(new THREE.RingGeometry(.36,.48,40),new THREE.MeshBasicMaterial({color:0xffd666,transparent:true,opacity:.85,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));R.hring.rotation.x=-Math.PI/2;R.hring.visible=false;R.hring.raycast=()=>{};scene.add(R.hring);
    V3R=R;V3.R=R;V3.ok=true;try{v3Theme(R,'classic');}catch(e){}
    v3Controls(cv,R);v3Hover(cv,R);
    new ResizeObserver(()=>v3Resize()).observe($('boardwrap'));
    v3Resize();
    requestAnimationFrame(v3Loop);
    return true;
  }catch(e){if(window.console)console.warn('3D failed',e);V3.ok=false;return false;}
}
/* The board meshes depend on N, so they are rebuilt whenever the arena grows. */
function v3BuildBoard(R){
  if(R.boardG){R.scene.remove(R.boardG);R.boardG.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
  const g=new THREE.Group();R.boardG=g;R.scene.add(g);R.tiles=[];R.ov=[];R.n=N;
  const{mL,mD,slabM,trimM}=R.th,add=o=>{g.add(o);return o;},h=N/2;
  const tg=new THREE.BoxGeometry(.995,.18,.995);
  for(let i=0;i<N*N;i++){const t=new THREE.Mesh(tg,((rowOf(i)+colOf(i))&1)?mD:mL);t.position.set(sqX(i),-.09,sqZ(i));t.receiveShadow=true;add(t);R.tiles.push(t);}
  const slab=new THREE.Mesh(new THREE.BoxGeometry(N+1.6,.7,N+1.6),slabM);slab.position.y=-.55;slab.receiveShadow=true;add(slab);
  for(const[w,d,x,z]of[[N+.4,.34,0,-h-.2],[N+.4,.34,0,h+.2],[.34,N+.4,-h-.2,0],[.34,N+.4,h+.2,0]]){const b=new THREE.Mesh(new THREE.BoxGeometry(w,.24,d),trimM);b.position.set(x,.02,z);b.castShadow=b.receiveShadow=true;add(b);}
  for(let k=0;k<N;k++){const a=v3Label(R,FILES[k],sqX(k),h+.55),b=v3Label(R,String(N-k),-h-.55,sqZ(k*N));}
  const pl=new THREE.PlaneGeometry(.97,.97);pl.rotateX(-Math.PI/2);const dotG=new THREE.CircleGeometry(.16,24);dotG.rotateX(-Math.PI/2);const ringG=new THREE.RingGeometry(.34,.46,40);ringG.rotateX(-Math.PI/2);
  for(let i=0;i<N*N;i++){
    const f=new THREE.Mesh(pl,R.M.sel);f.position.set(sqX(i),.012,sqZ(i));f.visible=false;f.raycast=()=>{};add(f);
    const d=new THREE.Mesh(dotG,R.M.dot);d.position.set(sqX(i),.02,sqZ(i));d.visible=false;d.raycast=()=>{};add(d);
    const r=new THREE.Mesh(ringG,R.M.cap);r.position.set(sqX(i),.02,sqZ(i));r.visible=false;r.raycast=()=>{};add(r);
    R.ov.push({f,d,r});
  }
  const k=R.key;if(k){const s=N*.9;Object.assign(k.shadow.camera,{left:-s,right:s,top:s,bottom:-s});k.shadow.camera.updateProjectionMatrix();}
  R.dirty=true;
}
function v3Label(R,txt,x,z){
  const t=v3Tex((c,s)=>{c.fillStyle='rgba(0,0,0,0)';c.clearRect(0,0,s,s);c.fillStyle='#e8c76a';c.font='700 78px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,s/2,s/2);},128);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.55,.55),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(x,.16,z);m.raycast=()=>{};(R.boardG||R.scene).add(m);return m;
}
function v3Resize(){
  const R=V3R;if(!R)return;const w=$('boardwrap').clientWidth,h=$('boardwrap').clientHeight;if(!w||!h)return;
  R.renderer.setSize(w,h,false);R.cam.aspect=w/h;R.cam.updateProjectionMatrix();R.dirty=true;
}
/* adaptive quality: 3 = best, 0 = lowest. Drops automatically when frames run long, creeps back up when there is headroom. */
function v3SetQ(R,q){
  q=Math.max(0,Math.min(3,q));if(q===R.q&&R.qSet)return;R.q=q;R.qSet=1;
  const dpr=q===3?R.dpr0:q===2?Math.min(R.dpr0,1.15):q===1?1:.75;
  R.renderer.setPixelRatio(dpr*(R.dprMul||1));v3Resize();
  const sh=q>=2;if(R.key.castShadow!==sh){R.key.castShadow=sh;R.scene.traverse(o=>{if(o.material){const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>m.needsUpdate=true);}});}
  R.sk=20;R.dirty=true;R.fe=16;R.up=0;
}
/* menu backdrop: half-resolution, no shadows, 30 fps, slow orbit */
function v3Menu(on){
  const R=V3R;V3.menu=!!on;if(!R)return;
  R.dprMul=on?.45:1;R.qSet=0;v3SetQ(R,on?1:(R.qForce!=null?R.qForce:R.q>1?R.q:3));
  if(on){R.az=Math.random()*6.28;R.el=.62;}
}
function v3Quality(v){const R=V3R;if(!R)return;if(v==='auto'){R.qForce=null;R.fe=16;}else R.qForce=+v;R.qSet=0;if(R.qForce!=null)v3SetQ(R,R.qForce);}
function v3QualityTick(R,dtMs){
  if(V3.menu)return;
  if(R.qForce!=null){if(R.q!==R.qForce||!R.qSet)v3SetQ(R,R.qForce);return;}
  if(dtMs>120)return;                       // tab was hidden / one-off hitch
  R.fe=R.fe*.92+dtMs*.08;
  if(R.fe>25&&R.q>0){v3SetQ(R,R.q-1);}
  else if(R.fe<15.5&&R.q<3){if(++R.up>240){v3SetQ(R,R.q+1);}}
  else R.up=Math.max(0,R.up-2);
}
function v3Cam(R){
  let r=R.rad,tx=R.tgt.x,tz=R.tgt.z;const e=R.el,s=R.shake>0?R.shake:0,pu=R.punch;
  if(pu){const t=(performance.now()-pu.t0)/pu.ms;if(t>=1)R.punch=null;else{const k=t<.2?1-Math.pow(1-t/.2,3):t<.5?1:Math.pow(1-(t-.5)/.5,2);r-=pu.amt*k;tx+=(pu.x-tx)*.4*k;tz+=(pu.z-tz)*.4*k;}}
  R.cam.position.set(tx+r*Math.sin(R.az)*Math.cos(e)+(s?(Math.random()-.5)*s:0),R.tgt.y+r*Math.sin(e)+(s?(Math.random()-.5)*s:0),tz+r*Math.cos(R.az)*Math.cos(e)+(s?(Math.random()-.5)*s:0));
  R.cam.lookAt(tx,R.tgt.y,tz);
  const cc=R.cineCam;
  if(cc&&cc.pose&&cc.w>0.001){const q=cc.pose,w=cc.w,P=R.cam.position;
    P.set(_lp(P.x,q.cx,w),_lp(P.y,q.cy,w),_lp(P.z,q.cz,w));R.cam.lookAt(_lp(tx,q.tx,w),_lp(R.tgt.y,q.ty,w),_lp(tz,q.tz,w));
    const f=_lp(R.fov0||36,q.fov,w);if(Math.abs(R.cam.fov-f)>.01){R.cam.fov=f;R.cam.updateProjectionMatrix();}
  }else if(R.fov0&&Math.abs(R.cam.fov-R.fov0)>.01){R.cam.fov=R.fov0;R.cam.updateProjectionMatrix();}
}
function v3CamPunch(R,pos,amt,ms){if(!FX.on)return;R.punch={t0:performance.now(),ms:ms||1100,amt:amt||2,x:pos.x,z:pos.z};R.dirty=true;}
function v3ResetCam(){
  const R=V3R;if(!R)return;R.az=(G&&G.flip)?Math.PI:0;R.el=(G&&G.env)?.55:.92;R.fov0=(G&&G.env)?50:36;R.cam.fov=R.fov0;R.cam.updateProjectionMatrix();R.cineCam=null;{const as=R.cam.aspect,pf=as<1?Math.min(2.2,1+(1/as-1)*.75):1;R.rad=22*(N/10)*pf*((G&&G.env&&as>=1)?.8:1);}R.dirty=true;
}
function v3Controls(cv,R){
  const ptrs=new Map();let drag=null,pinch=0;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===1)drag={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};
    if(ptrs.size===2){const a=[...ptrs.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(drag)drag.moved=99;}
    const h=$('v3hint');if(h)h.classList.add('gone');});
  cv.addEventListener('pointermove',e=>{
    const p=ptrs.get(e.pointerId);if(!p)return;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
    if(ptrs.size===2){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch)R.rad=Math.min(36*N/10,Math.max(10,R.rad*pinch/d));pinch=d;R.dirty=true;return;}
    if(drag){drag.moved+=Math.abs(dx)+Math.abs(dy);if(drag.moved>6){R.az-=dx*.0065;R.el=Math.min(1.45,Math.max(.22,R.el+dy*.005));R.dirty=true;cv.style.cursor='grabbing';}}
  });
  const up=e=>{
    const had=ptrs.delete(e.pointerId);cv.style.cursor='';
    if(R.noClick){R.noClick=false;drag=null;pinch=0;return;}
    if(had&&drag&&ptrs.size===0&&drag.moved<=6&&performance.now()-drag.t<700){const i=v3Pick(R,e);if(i>=0&&G)onSquare(i);}
    if(ptrs.size===0){drag=null;pinch=0;}
  };
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();R.rad=Math.min(36*N/10,Math.max(10,R.rad*(1+Math.sign(e.deltaY)*.08)));R.dirty=true;},{passive:false});
}
const _rc=new THREE.Raycaster(),_v2=new THREE.Vector2(),_pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),_hp=new THREE.Vector3();
function v3Pick(R,e){
  const r=R.renderer.domElement.getBoundingClientRect();
  _v2.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);_rc.setFromCamera(_v2,R.cam);
  const hits=_rc.intersectObjects(R.pieceRoot.children,true);
  for(const h of hits){let o=h.object;while(o&&o.userData.id==null&&!o.userData.boss)o=o.parent;if(o&&o.userData.boss&&G.boss.on){const a0=G.boss.sq,cells=[a0,a0+1,a0+N,a0+N+1];const tg=G.sel!=null?cells.filter(s=>G.selMoves.some(m=>m.t===s)):[];const cx=Math.floor(h.point.x+5),cz=Math.floor(h.point.z+5),ps=cz*N+cx;if(tg.length&&!tg.includes(ps))return tg[0];return cells.includes(ps)?ps:a0;}if(o&&o.userData.id!=null){const pc=R.pcs.get(o.userData.id);if(pc&&!pc.dying)return pc.i;}}
  if(_rc.ray.intersectPlane(_pl,_hp)){const c=Math.floor(_hp.x+N/2),r2=Math.floor(_hp.z+N/2);if(c>=0&&c<N&&r2>=0&&r2<N)return r2*N+c;}
  return -1;
}

/* ---- effects primitives ---- */
function v3Sprite(R,tex,col,blend){const m=new THREE.SpriteMaterial({map:tex,color:col,transparent:true,depthWrite:false,blending:blend===false?THREE.NormalBlending:THREE.AdditiveBlending});const s=new THREE.Sprite(m);s.raycast=()=>{};return s;}
function v3Emit(R,pos,o){
  if(!FX.on)return;
  const n=o.n||10;
  for(let k=0;k<n;k++){
    if(R.parts.length>420)break;
    const s=v3Sprite(R,R.tex.glow,new THREE.Color('rgb('+o.col+')'),o.blend);
    s.position.set(pos.x+(Math.random()-.5)*(o.spread||.2),pos.y,pos.z+(Math.random()-.5)*(o.spread||.2));
    const a=Math.random()*6.283,sp=(o.v0||1)+Math.random()*((o.v1||3)-(o.v0||1)),up=o.up!=null?o.up:1;
    const sz=(o.s0||.2)+Math.random()*((o.s1||.4)-(o.s0||.2));
    R.fxRoot.add(s);
    R.parts.push({s,vx:Math.cos(a)*sp*(o.flat?1:Math.random()),vy:(Math.random()*up+(o.lift||0))*(o.v1||3)*.6,vz:Math.sin(a)*sp*(o.flat?1:Math.random()),g:o.g==null?-6:o.g,drag:o.drag==null?1.2:o.drag,life:(o.l0||.5)+Math.random()*((o.l1||1)-(o.l0||.5)),t:0,sz,grow:o.grow||0,a0:o.a||1});
    s.scale.setScalar(sz);
  }
}
function v3Ring(R,pos,o){
  if(!FX.on)return;
  const g=new THREE.RingGeometry(.92,1,56);g.rotateX(-Math.PI/2);
  const m=new THREE.MeshBasicMaterial({color:new THREE.Color('rgb('+o.col+')'),transparent:true,opacity:o.a||.9,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,m);mesh.position.set(pos.x,(o.y||.05),pos.z);mesh.raycast=()=>{};R.fxRoot.add(mesh);
  const t0=performance.now(),dur=o.ms||700,a0=o.a||.9,r0=o.r0||.2,r1=o.r1||2;
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/dur),e=1-Math.pow(1-t,3);mesh.scale.setScalar(r0+(r1-r0)*e);m.opacity=a0*(1-t);if(t>=1){R.fxRoot.remove(mesh);g.dispose();m.dispose();return true;}}});
}
function v3Flash(R,col,pos,ms,k){
  if(!FX.on)return;R.flash.color.set(new THREE.Color('rgb('+col+')'));R.flash.position.set(pos.x,3,pos.z);const t0=performance.now(),peak=k||40;
  R.anims.push({upd:()=>{const t=(performance.now()-t0)/(ms||500);R.flash.intensity=peak*Math.max(0,1-t);if(t>=1){R.flash.intensity=0;return true;}}});
}
function v3Burst(R,pos,col,sz,ms){
  if(!FX.on)return;const s=v3Sprite(R,R.tex.glow,new THREE.Color('rgb('+col+')'));s.position.copy(pos);R.fxRoot.add(s);const t0=performance.now();
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/(ms||500));s.scale.setScalar(sz*(.3+t*1.1));s.material.opacity=1-t;if(t>=1){R.fxRoot.remove(s);s.material.dispose();return true;}}});
}
function v3Shake(R,amp,ms){if(!FX.on)return;const t0=performance.now();R.anims.push({upd:()=>{const t=(performance.now()-t0)/ms;R.shake=amp*Math.max(0,1-t);if(t>=1){R.shake=0;return true;}}});}
function v3Rubble(R,pos,n,col){
  if(!FX.on)return;const g=new THREE.BoxGeometry(.14,.14,.14),m=new THREE.MeshStandardMaterial({color:col||0x6a6e7c,roughness:.9});
  for(let k=0;k<n;k++){const b=new THREE.Mesh(g,m);b.position.set(pos.x+(Math.random()-.5)*.4,pos.y+.4+Math.random()*.5,pos.z+(Math.random()-.5)*.4);b.castShadow=true;b.raycast=()=>{};R.fxRoot.add(b);
    const vx=(Math.random()-.5)*3,vz=(Math.random()-.5)*3,rx=Math.random()*8,rz=Math.random()*8;let vy=2+Math.random()*3,t=0;
    R.anims.push({upd:(dt)=>{t+=dt;vy-=14*dt;b.position.x+=vx*dt;b.position.z+=vz*dt;b.position.y+=vy*dt;if(b.position.y<.08){b.position.y=.08;vy*=-.35;}b.rotation.x+=rx*dt;b.rotation.z+=rz*dt;if(t>1.6){b.scale.multiplyScalar(.9);}if(t>2.1){R.fxRoot.remove(b);return true;}}});}
}
function v3Streak(R,pos,col,ms,h,cb){
  if(!FX.on){if(cb)cb();return;}
  const s=v3Sprite(R,R.tex.glow,new THREE.Color('rgb('+col+')'));s.scale.set(.9,.9,1);R.fxRoot.add(s);const t0=performance.now();
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/ms);s.position.set(pos.x+(1-t)*2,pos.y+(1-t)*(h||12),pos.z-(1-t)*1.5);if(t>=1){R.fxRoot.remove(s);s.material.dispose();if(cb)cb();return true;}}});
}
function v3Slash(R,pos,ang,col){
  if(!FX.on)return;
  const g=new THREE.PlaneGeometry(2.6,.12),m=new THREE.MeshBasicMaterial({color:new THREE.Color('rgb('+(col||'255,50,80')+')'),transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const s=new THREE.Mesh(g,m);s.position.set(pos.x,pos.y+.9,pos.z);s.rotation.set(0,0,ang);s.lookAt(R.cam.position);s.rotateZ(ang);s.raycast=()=>{};R.fxRoot.add(s);const t0=performance.now();
  R.anims.push({upd:()=>{const t=(performance.now()-t0)/380;s.scale.set(Math.min(1,t*4),1+t*1.5,1);m.opacity=Math.max(0,1-t);if(t>=1){R.fxRoot.remove(s);g.dispose();m.dispose();return true;}}});
}
function v3Bolt(R,pos,col){
  if(!FX.on)return;const pts=[];let x=pos.x+(Math.random()-.5)*1.2,z=pos.z;
  for(let k=0;k<=9;k++){const y=11*(1-k/9);pts.push(new THREE.Vector3(k===9?pos.x:x+(Math.random()-.5)*(k>7?.3:1),k===9?pos.y+.1:y,k===9?pos.z:z+(Math.random()-.5)*.6));}
  const g=new THREE.BufferGeometry().setFromPoints(pts),m=new THREE.LineBasicMaterial({color:new THREE.Color('rgb('+col+')'),transparent:true});
  const l=new THREE.Line(g,m);l.raycast=()=>{};R.fxRoot.add(l);const t0=performance.now();
  for(const p of pts.slice(2,9)){const s=v3Sprite(R,R.tex.glow,new THREE.Color('rgb('+col+')'));s.position.copy(p);s.scale.setScalar(.5);R.fxRoot.add(s);R.anims.push({upd:()=>{const t=(performance.now()-t0)/420;s.material.opacity=1-t;if(t>=1){R.fxRoot.remove(s);return true;}}});}
  R.anims.push({upd:()=>{const t=(performance.now()-t0)/420;m.opacity=Math.random()>.3?1-t:0;if(t>=1){R.fxRoot.remove(l);g.dispose();return true;}}});
}
function v3Beam(R,pos,col,h,ms){
  if(!FX.on)return;const g=new THREE.CylinderGeometry(.3,.3,h,16,1,true),m=new THREE.MeshBasicMaterial({color:new THREE.Color('rgb('+col+')'),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const b=new THREE.Mesh(g,m);b.position.set(pos.x,h/2,pos.z);b.raycast=()=>{};R.fxRoot.add(b);const t0=performance.now();
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/ms);b.scale.set(1+t*.6,1,1+t*.6);m.opacity=.75*(1-t);if(t>=1){R.fxRoot.remove(b);g.dispose();m.dispose();return true;}}});
}
function v3Rise(R,pos,txt,col,ms){
  if(!FX.on)return;const s=v3Mark(R,txt);s.scale.set(1.3,1.3,1);s.position.set(pos.x,pos.y+.5,pos.z);R.fxRoot.add(s);const t0=performance.now();
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/(ms||1100));s.position.y=pos.y+.5+t*1.6;s.material.opacity=t<.2?t*5:1-(t-.2)/.8;s.scale.setScalar(.8+Math.sin(Math.min(1,t*2)*Math.PI)*.8);if(t>=1){R.fxRoot.remove(s);return true;}}});
}
function v3Mark(R,txt){
  let t=R.marks.get(txt);
  if(!t){t=v3Tex((c,s)=>{c.clearRect(0,0,s,s);if(/^#\d$/.test(txt)){c.fillStyle='#ffd45e';c.beginPath();c.arc(s/2,s/2,s*.38,0,6.283);c.fill();c.fillStyle='#1b2332';c.font='800 70px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt.slice(1),s/2,s/2+4);}else{c.font='84px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,s/2,s/2+6);}});R.marks.set(txt,t);}
  const m=new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:false});const s=new THREE.Sprite(m);s.scale.set(.6,.6,1);s.raycast=()=>{};s.renderOrder=10;return s;
}

/* ---- per-unit death animations ---- */
function v3Kill(R,o,delay){
  o.dying=true;
  const go=()=>{
    const pos=o.grp.position.clone(),t=o.p.t,g=o.grp,t0=performance.now();
    const col={P:'255,70,95',N:'255,90,60',B:'255,225,140',R:'200,190,170',Q:'255,150,50',K:'255,150,50',M:'130,210,255',C:'190,120,255',H:'255,210,110'}[t]||'255,70,95';
    const fin=()=>{R.fxRoot.remove(g);R.pieceRoot.remove(g);if(R.pcs.get(o.id)===o)R.pcs.delete(o.id);o.gone=true;R.dirty=true;};
    const anim=(ms,f)=>R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/ms);f(k);if(k>=1){fin();return true;}}});
    if(!FX.on){fin();return;}
    if(o.rg&&t!=='Q'&&t!=='K'){
      const vd=o.vdir||{x:0,z:0},b=o.body,y0=b.rotation.y,yF=o.vdir?Math.atan2(-vd.x,-vd.z):y0;let dy=((yF-y0+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
      v3Emit(R,pos.clone().setY(.9),{n:16,col,v0:1,v1:3.5,l0:.3,l1:.7,g:-6,s0:.06,s1:.14});
      if(t==='R')v3Rubble(R,pos,8);
      anim(1150,k=>{const f=_sm(Math.min(1,k/.5));b.rotation.y=y0+dy*Math.min(1,k/.12);b.rotation.x=-1.5*f;rigSet(o.rg,{dt:f});g.position.x=pos.x+vd.x*.5*f;g.position.z=pos.z+vd.z*.5*f;
        if(k>.72){const z=(k-.72)/.28;g.scale.setScalar(Math.max(.01,1-z));g.position.y=-.25*z;}});
    }else if(t==='P'){
      v3Slash(R,pos,.6+Math.random()*.5);v3Emit(R,pos.clone().setY(.8),{n:18,col,v0:1,v1:4,l0:.3,l1:.7,s0:.12,s1:.22,g:-8});v3Shake(R,.12,160);
      anim(520,k=>{g.scale.set(1+k*.2,Math.max(.01,1-k*k),1+k*.2);g.position.y=k*.4;g.rotation.z=k*.6;});
    }else if(t==='N'){
      v3Slash(R,pos,.5);v3Slash(R,pos,-.7);v3Emit(R,pos.clone().setY(.6),{n:20,col,v0:1,v1:3.5,l0:.4,l1:.9,g:-5});
      v3Emit(R,pos.clone().setY(.2),{n:10,col:'200,190,170',blend:false,v0:.5,v1:2,l0:.6,l1:1.2,s0:.3,s1:.6,g:1,drag:2,flat:true,up:.3});
      anim(620,k=>{g.rotation.z=k*1.4;g.rotation.x=k*.5;g.position.y=Math.sin(k*3)*.5*(1-k);g.scale.setScalar(Math.max(.01,1-k*k*.9));});
    }else if(t==='B'){
      v3Beam(R,pos,'255,225,140',7,900);v3Ring(R,pos,{col,r0:.2,r1:2.2,ms:800});v3Emit(R,pos.clone().setY(.4),{n:26,col,v0:.3,v1:1.2,l0:.8,l1:1.5,g:2,up:1.2,lift:.4,s0:.1,s1:.24,drag:.5});
      anim(800,k=>{g.position.y=k*1.8;g.scale.setScalar(Math.max(.01,1-k));g.rotation.y+=.08;});
    }else if(t==='R'){
      v3Rubble(R,pos,14);v3Emit(R,pos.clone().setY(.3),{n:18,col:'170,165,155',blend:false,v0:.5,v1:2.6,l0:.8,l1:1.6,s0:.4,s1:.9,g:1,drag:1.6,flat:true,up:.4});v3Shake(R,.25,320);v3Ring(R,pos,{col:'200,190,170',r0:.3,r1:2.6,ms:600});
      anim(650,k=>{g.scale.set(1+Math.sin(k*20)*.04,Math.max(.01,1-k*1.05),1);g.position.y=-k*.3;});
    }else if(t==='Q'||t==='K'){
      sfx('boom');if(t==='Q')v3CamPunch(R,pos,3.2,1400);const big=1;v3Flash(R,'255,170,80',pos,900,35);v3Burst(R,pos.clone().setY(.9),'255,245,225',9,520);v3Burst(R,pos.clone().setY(.9),'255,130,40',13,900);
      for(const[r1,ms,c]of[[8,1000,'255,190,110'],[12,1300,'255,110,40'],[6,800,'255,255,255']])v3Ring(R,pos,{col:c,r0:.4,r1,ms,a:1,y:.06});
      v3Emit(R,pos.clone().setY(.8),{n:90,col:'255,170,60',v0:2,v1:11,l0:.7,l1:1.7,s0:.15,s1:.4,g:-4,drag:.8});
      v3Emit(R,pos.clone().setY(.8),{n:50,col:'255,235,170',v0:3,v1:14,l0:.4,l1:.9,s0:.1,s1:.25,g:-2,drag:1});
      v3Emit(R,pos.clone().setY(.6),{n:34,col:'70,60,60',blend:false,v0:.6,v1:4.5,l0:1.2,l1:2.2,s0:.8,s1:1.6,g:1.5,drag:1,up:1.1,grow:1.2});
      v3Rubble(R,pos,16,0x2c2a30);v3Shake(R,.9,900);
      anim(420,k=>{g.scale.setScalar(1+k*.6);g.position.y=k*.5;if(k>.55)g.visible=false;});
    }else if(t==='M'){
      sfx('zap');v3Bolt(R,pos,'150,215,255');setTimeout(()=>v3Bolt(R,pos,'200,235,255'),90);v3Flash(R,'150,210,255',pos,420,45);v3Ring(R,pos,{col,r0:.3,r1:3,ms:600,a:1});
      v3Emit(R,pos.clone().setY(.7),{n:40,col,v0:2,v1:8,l0:.3,l1:.8,s0:.08,s1:.2,g:-3});v3Shake(R,.35,300);
      anim(460,k=>{g.visible=((k*14)|0)%2===0&&k<.9;g.position.x=pos.x+(Math.random()-.5)*.1*(1-k);});
    }else if(t==='C'){
      v3Ring(R,pos.clone().setY(.5),{col,r0:3,r1:.2,ms:560,a:.9,y:.5});v3Ring(R,pos,{col:'255,160,255',r0:2,r1:.2,ms:520,a:.8});
      v3Burst(R,pos.clone().setY(.9),'150,90,255',5,600);
      setTimeout(()=>{v3Emit(R,pos.clone().setY(.9),{n:44,col,v0:1.5,v1:6,l0:.5,l1:1.2,g:1,s0:.1,s1:.24});v3Ring(R,pos,{col:'220,170,255',r0:.2,r1:3.2,ms:600});v3Shake(R,.25,240);},480);
      anim(620,k=>{g.rotation.y=k*k*14;g.scale.setScalar(Math.max(.01,1-k*k));g.position.y=.6*k;});
    }else if(t==='T'){
      v3Burst(R,pos.clone().setY(.8),'255,190,90',3.5,500);v3Ring(R,pos,{col:'255,170,80',r0:.2,r1:2.2,ms:560,a:1});v3Emit(R,pos.clone().setY(.8),{n:30,col:'255,200,120',v0:1.5,v1:5,l0:.4,l1:1,g:-6,s0:.08,s1:.2});v3Shake(R,.18,200);
      anim(420,k=>{g.scale.set(1+k*.3,Math.max(.01,1-k*k),1+k*.3);g.rotation.z=k*.5;});
    }else{
      v3Ring(R,pos,{col,r0:.2,r1:2,ms:560});v3Emit(R,pos.clone().setY(.6),{n:26,col,v0:.8,v1:3,l0:.5,l1:1.1,g:2,up:1.2,lift:.3,drag:1.1});
      anim(540,k=>{g.position.y=k*1.4;g.scale.setScalar(Math.max(.01,1-k));});
    }
  };
  if(delay>0)setTimeout(go,delay);else go();
}
function v3KingFall(sq){
  const R=V3R;if(!R)return;{const q={x:sqX(sq),z:sqZ(sq)};sfx('mate');v3CamPunch(R,q,4,1800);v3Crack(R,q,9,4000);v3Shatter(R,sq);}let o=null;for(const x of R.pcs.values())if(x.i===sq&&x.p.t==='K')o=x;if(!o)return;
  const g=o.grp,t0=performance.now(),pos=g.position.clone();
  v3Emit(R,pos.clone().setY(1),{n:46,col:'255,210,100',v0:1.5,v1:6,l0:.7,l1:1.4,g:-6,s0:.1,s1:.26});v3Ring(R,pos,{col:'255,200,90',r0:.3,r1:5,ms:1000});v3Shake(R,.45,520);v3Flash(R,'255,190,90',pos,700,30);
  R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/900);g.rotation.z=k*k*1.45;g.position.y=-k*.15;if(k>=1)return true;}});
}

/* ---- sync scene with game state ---- */
function v3ShownMoves(R){
  R.hovSide=G.turn;
  if(G.sel==null&&R.hovI>=0&&!G.over&&!G.tgt&&!G.promo&&!G.draft){
    const hp=G.b[R.hovI];
    if(hp&&hp.c<2){R.hovSide=hp.c;return hp.c===G.turn?G.legal.filter(m=>m.f===R.hovI):legalH({b:G.b,ep:null,turn:hp.c,ply:G.ply}).filter(m=>m.f===R.hovI);}
  }
  return G.selMoves;
}
function v3Overlay(R){
  const tgtV=G.tgt?G.tgt.valid:null,chuteSq=G.chute?new Set(chuteSpots(G.turn)):tgtV;
  const chk=inCheck(stOf())&&!G.over?kingSq(G.b,G.turn):-1,dest=new Map(v3ShownMoves(R).map(m=>[m.t,m]));
  const rzOn=[0,1].map(c=>G.rz[c]>G.ply?rzSet(c):null),mt=new Set();
  for(const m of G.meteors)for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=rowOf(m.sq)+dr,cc=colOf(m.sq)+dc;if(rr>=0&&rr<N&&cc>=0&&cc<N)mt.add(rr*N+cc);}
  for(let i=0;i<N*N;i++){
    const ov=R.ov[i];let f=null;
    if(i===chk)f='chk';else if(G.sel===i||(G.tgt&&G.tgt.kind==='blink'&&G.tgt.step===1&&G.tgt.from===i))f='sel';
    else if(G.fire&&isEdgeSq(i)&&(G.fire.on||G.fire.at-G.ply<=6))f=G.fire.on?'fire':'warn';
    else if(G.last&&(G.last.f===i||G.last.t===i))f='last';
    else if(mt.has(i))f='mt';
    else if((rzOn[0]&&rzOn[0].has(i))||(rzOn[1]&&rzOn[1].has(i)))f='rz';
    else if(tgtV&&tgtV.has(i)&&!G.chute)f='tgt';
    ov.f.visible=!!f;if(f)ov.f.material=R.M[f];
    const mv=dest.get(i),cap=mv&&G.b[mv.cs]&&G.b[mv.cs].c!==R.hovSide;
    ov.d.visible=!!(mv&&!cap)||!!(chuteSq&&chuteSq.has(i)&&G.chute);ov.d.material=(chuteSq&&G.chute&&chuteSq.has(i))?R.M.chute:(R.hovSide!==G.turn&&mv?R.M.edot:R.M.dot);
    if(tgtV&&tgtV.has(i)&&!G.chute){ov.d.visible=true;ov.d.material=R.M.chute;}
    ov.r.visible=!!cap;
  }
  const hp=R.hovI>=0?G.b[R.hovI]:null;R.hring.visible=!!hp;
  if(hp){R.hring.position.set(sqX(R.hovI),.035,sqZ(R.hovI));R.hring.material.color.set(hp.c===G.turn?0xffd666:0xff6a7a);}
  R.dirty=true;
  return chk;
}
function v3SetHover(R,i){
  const p=i>=0&&G?G.b[i]:null,n=p&&!G.over?i:-1;if(n===R.hovI)return;R.hovI=n;v3Overlay(R);
}
function v3Model(R,p){
  if(RIGP.has(p.t)&&!p.wl){const vc0=p.vc!=null?p.vc:p.c,root=rigModel(R,p.t,vc0>1?0:vc0),bs=V3S*RPROF[p.t].s;root.scale.setScalar(bs);root.rotation.order='YXZ';root.rotation.y=p.c===0?Math.PI:0;root.userData.bs=bs;return root;}
  const mt=p.wl?'XW':p.t,vc=p.vc!=null?p.vc:p.c,key=mt+(vc>1?0:vc);
  if(!R.bake[key]){R.bake[key]=v3Bake(mt,vc>1?0:vc);}
  const body=new THREE.Group();
  for(const{geo,mat}of R.bake[key]){const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=p.t==='X';body.add(m);}
  body.scale.setScalar(V3S*(p.t==='X'&&!p.wl?.62:1));body.rotation.order='YXZ';body.rotation.y=p.c===0?Math.PI:0;
  return body;
}
function v3MakePiece(R,id,p,i,pop){
  const g=new THREE.Group();g.userData.id=id;
  const body=v3Model(R,p);g.add(body);
  g.position.set(sqX(i),0,sqZ(i));R.pieceRoot.add(g);
  const o={id,p,i,grp:g,body,sig:'',faceY:p.c===0?Math.PI:0,ph:Math.random()*6.28,moving:false,rg:body.userData.rg||null,bs:body.userData.bs||V3S};R.pcs.set(id,o);if(o.rg){body.rotation.y=o.faceY;rigSet(o.rg,{});}
  if(pop&&FX.on){const t0=performance.now();g.scale.setScalar(.01);R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/420),e=k<1?1-Math.pow(1-k,3)*Math.cos(k*9):1;g.scale.setScalar(Math.max(.01,e));if(k>=1){g.scale.setScalar(1);return true;}}});}
  return o;
}
function v3Decor(R,o){
  const p=o.p,lockN=(p.t==='M'||p.t==='C')&&G.ply<ENG.wake?ENG.wake-G.ply:0,sig=[lockN,G.bonus===o.i?1:0,p.aura?1:0,p.rez?1:0,p.rap?1:0,p.lk?1:0,p.fz?1:0,p.zh?1:0,p.t==='H'?p.ttl:0,p.inv>0?p.inv:0,p.bty?1:0,p.t==='T'?p.sh:0,p.t==='W'?p.hp:0,p.vc!=null&&p.vc!==p.c?'o'+p.c:'',p.dk?1:0].join('');
  if(sig===o.sig)return;o.sig=sig;
  for(const c of[...o.grp.children])if(c.userData.deco)o.grp.remove(c);
  const add=s=>{s.userData.deco=true;o.grp.add(s);return s;};
  const H=V3H[p.t]||2;
  if(p.aura){const s=add(v3Sprite(R,R.tex.glow,new THREE.Color(0xffcf33)));s.scale.set(1.9,1.9,1);s.material.opacity=.4;s.position.y=H*.4;s.userData.pulse=1;
    const cr=add(v3Crown(R,.8)),up0=cr.userData.upd,born=performance.now(),rest=H*V3S+.34;
    cr.userData.upd=(t,dt)=>{const k=Math.min(1,(performance.now()-born)/800),e=1-Math.pow(1-k,3);cr.position.y=rest+(1-e)*1.4+Math.sin(t*2)*.035;cr.scale.setScalar(.45+.55*e);up0(t,dt);};}
  if(lockN){const s=add(v3Mark(R,'🔒'));s.scale.set(.6,.6,1);s.position.set(0,H*V3S+.5,0);const n=add(v3Mark(R,'#'+lockN));n.scale.set(.36,.36,1);n.position.set(.3,H*V3S+.8,0);
    const z=add(v3Sprite(R,R.tex.glow,new THREE.Color(0x6a7da8),false));z.scale.set(1.6,1.6,1);z.position.y=H*V3S*.5;z.material.opacity=.25;}
  if(G.bonus===o.i){const th=add(v3Thunder(R,.62));th.position.y=H*V3S+.42;}
  if(p.lk){
    const cy=H*V3S*.5,rad=H*V3S*.58+.12,bar=add(new THREE.Group());bar.position.y=cy;
    const shell=new THREE.Mesh(new THREE.SphereGeometry(rad,28,20),new THREE.MeshBasicMaterial({color:0xa9c8ff,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));shell.raycast=()=>{};bar.add(shell);
    const web=new THREE.Mesh(new THREE.IcosahedronGeometry(rad*1.01,2),new THREE.MeshBasicMaterial({color:0xd6c4ff,wireframe:true,transparent:true,opacity:.4,depthWrite:false,toneMapped:false}));web.raycast=()=>{};bar.add(web);
    bar.userData.upd=(t)=>{web.rotation.y=t*.5;web.rotation.x=t*.2;shell.material.opacity=.2+.08*Math.sin(t*2.5);web.material.opacity=.55+.2*Math.sin(t*3+1);};
  }
  if(p.fz){const s=add(v3Sprite(R,R.tex.glow,new THREE.Color(0x7fd8ff)));s.scale.set(2.4,2.4,1);s.position.y=H*.45;}
  if(p.zh){const s=add(v3Sprite(R,R.tex.glow,new THREE.Color(0xffd45e)));s.scale.set(2.4,2.4,1);s.position.y=H*.45;}
  const em=(p.rez?'✝':'')+(p.rap?'⚔':'')+(p.fz?'❄':'')+(p.zh?'⏳':'');
  if(em){const s=add(v3Mark(R,em));s.scale.set(.5+.28*em.length,.6,1);s.position.set(0,H*V3S*1.0+.55,0);}
  if(p.vc!=null&&p.vc!==p.c){const rg=add(new THREE.Mesh(new THREE.TorusGeometry(.5,.045,8,36),new THREE.MeshBasicMaterial({color:p.c===0?0xffffff:0xff4458,toneMapped:false})));rg.rotation.x=Math.PI/2;rg.position.y=.1;rg.raycast=()=>{};}
  if(p.dk){const k2=add(v3Mark(R,'♚'));k2.scale.set(.5,.5,1);k2.position.set(.38,H*V3S+.35,0);}
  /* ghost swap */
  o.body.traverse(m=>{if(!m.isMesh)return;
    if(p.inv>0){if(!m.userData.om){m.userData.om=m.material;m.material=R.ghostMat||(R.ghostMat=new THREE.MeshStandardMaterial({color:0xcbb8ff,transparent:true,opacity:.3,depthWrite:false,roughness:.3,emissive:0x5a3aa0,emissiveIntensity:.6,skinning:true}));m.castShadow=false;}}
    else if(m.userData.om){m.material=m.userData.om;m.userData.om=null;m.castShadow=true;}});
  if(p.inv>0){const s=add(v3Sprite(R,R.tex.glow,new THREE.Color(0xb48cff),false));s.scale.set(2.2,2.2,1);s.position.y=H*.4;s.material.opacity=.3;
    const n=add(v3Mark(R,'#'+Math.min(9,p.inv)));n.scale.set(.4,.4,1);n.position.set(.32,H*V3S+.45,0);const e=add(v3Mark(R,'👁'));e.scale.set(.5,.5,1);e.position.set(0,H*V3S+.55,0);}
  if(p.bty){const gr=add(new THREE.Group());gr.position.y=H*V3S*.5+.2;const coins=[];
    for(let k=0;k<3;k++){const c=v3Coin(R,.4);gr.add(c);coins.push(c);}
    gr.userData.upd=(t,dt)=>{coins.forEach((c,k)=>{const a=t*1.6+k*2.094,r=H*V3S*.5+.15;c.position.set(Math.cos(a)*r,Math.sin(t*2+k)*.1,Math.sin(a)*r);c.userData.upd(t+k,dt);});};}
  if(p.t==='W'){const s=add(v3Mark(R,'#'+p.hp));s.scale.set(.4,.4,1);s.position.set(.35,.2,.35);}
  if(p.t==='T'){const s=add(v3Mark(R,'#'+p.sh));s.scale.set(.4,.4,1);s.position.set(.4,.2,.4);}
  if(p.t==='H'){const s=add(v3Mark(R,'#'+p.ttl));s.position.set(.45,.3,.45);s.scale.set(.42,.42,1);}
}
function sync3d(){
  if(V3R&&V3R.n!==N){v3Reset();v3BuildBoard(V3R);v3ResetCam();V3R.first=true;}
  const R=V3R;if(!R)return;if(V3.hide)V3.hide();
  if(R.envKey!==(G.env||null)){v3Env(R,G.env);if(R.envKey)R.first=true;}
  v3EnvSync(R);
  const evs=G.fx;G.fx=[];
  const chk=v3Overlay(R);
  /* pieces */
  const cur=new Map();for(let i=0;i<N*N;i++){const p=G.b[i];if(p&&p.t!=='Z')cur.set(p.id,{p,i});}
  const movers=[],impact=new Map(),first=R.first;
  for(const[id,n]of cur){
    let o=R.pcs.get(id);
    if(o&&o.dying){o.gone=true;R.fxRoot.remove(o.grp);R.pieceRoot.remove(o.grp);R.pcs.delete(id);o=null;}
    if(!o){v3MakePiece(R,id,n.p,n.i,!first);if(!first)v3Emit(R,{x:sqX(n.i),y:.5,z:sqZ(n.i)},{n:8,col:'255,225,140',v0:.4,v1:1.8,l0:.4,l1:.8,g:1,up:1});continue;}
    if(o.p.t!==n.p.t||o.p.c!==n.p.c||o.p.vc!==n.p.vc){R.pieceRoot.remove(o.grp);const c=v3MakePiece(R,id,n.p,n.i,false);v3Burst(R,{x:sqX(n.i),y:1,z:sqZ(n.i)},'255,225,140',4,600);v3Ring(R,{x:sqX(n.i),z:sqZ(n.i)},{col:'255,225,140',r0:.3,r1:2.4,ms:700});o=c;}
    o.p=n.p;
    if(o.i!==n.i){movers.push({o,from:o.i,to:n.i});}
  }
  {const keep=new Set([...R.pcs.values()].map(x=>x.grp));if(R.boss)keep.add(R.boss.g);for(const ch of[...R.pieceRoot.children])if(!keep.has(ch)&&!(ch.userData&&ch.userData.keepAlive))R.pieceRoot.remove(ch);}
  const msHit=new Map();evs.filter(e=>e.k==='burn').forEach(e=>msHit.set(e.sq,e.late||380));evs.filter(e=>e.k==='missile').forEach((e,n)=>msHit.set(e.sq,300+n*230+560));evs.filter(e=>e.k==='shot').forEach(e=>msHit.set(e.to,420));evs.filter(e=>e.k==='crush').forEach(e=>msHit.set(e.sq,300));
  if(!first&&chk>=0&&R.lastChk!==chk){const g0=G,k0=chk;setTimeout(()=>{if(G===g0&&!G.over&&inCheck(stOf()))v3CheckFx(R,k0);},650);}
  R.lastChk=chk;
  const killSq=new Set();for(const[id,o]of R.pcs)if(!cur.has(id)&&!o.dying)killSq.add(o.i);
  for(const mv of movers){
    let pe=FX.on&&!first?evs.find(e=>e.k==='portal'&&e.to===mv.to&&!(e.swap&&mv.from===e.sq)):null;
    if(!pe&&FX.on&&!first){const se=evs.find(e=>e.k==='portal'&&e.swap&&mv.to===e.sq&&mv.from===e.to);if(se)pe={sq:se.to,to:se.sq};}
    if(pe){v3Teleport(R,mv,pe,impact,killSq);continue;}
    {const te=!first&&evs.find(e=>e.k==='bosshit'&&e.toss===mv.to&&e.sq===mv.from);if(te){v3Toss(R,mv,impact);continue;}}
    if(mv.o.rg){v3Walk(R,mv,impact,killSq,first,evs);continue;}
    const o=mv.o,g=o.grp,b=o.body,x0=g.position.x,z0=g.position.z,x1=sqX(mv.to),z1=sqZ(mv.to),dx=x1-x0,dz=z1-z0;
    const dist=Math.max(Math.abs(dx),Math.abs(dz)),hop=o.p.t==='M'||(o.p.t==='N'&&Math.abs(dx)*Math.abs(dz)>1.9);
    const cap=killSq.has(mv.to),fast=!FX.on||first,face0=o.faceY,yawT=Math.atan2(dx,dz),len=Math.hypot(dx,dz)||1,ux=dx/len,uz=dz/len;
    const dur=fast?.01:cap?.85:Math.min(.7,.3+dist*.055+(hop?.1:0));
    impact.set(o.id,cap?dur*.5:dur);
    const burn=0;
    if(!fast)sfx(cap?'capture':'move',Math.round(dur*1000*(cap?.5:1)));
    const t0=performance.now(),flyH=hop?(cap?1.6:1.3):(o.p.t==='K'||o.p.t==='P'?.16:.34),base=V3S;
    const ang=(a,bb)=>{let d=((bb-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d;};
    const sm=k=>k*k*(3-2*k);
    const yawTo=ang(face0,yawT);let hit=false;
    o.i=mv.to;o.moving=true;
    R.anims.push({upd:()=>{
      const k=Math.min(1,(performance.now()-t0)/(dur*1000));
      let px,pz,py=0,pitch=0,sy=1,yaw;
      if(!cap){
        const e=sm(k);px=x0+dx*e;pz=z0+dz*e;
        py=hop?Math.sin(k*Math.PI)*flyH:Math.abs(Math.sin(k*Math.PI*Math.max(1,Math.round(dist*1.5))))*flyH*.5;
        pitch=Math.sin(k*Math.PI)*.16;
        yaw=ang(face0,yawT);const a=k<.18?sm(k/.18):k>.8?sm((1-k)/.2):1;yaw=face0+(yawTo-face0)*a;
        sy=k<.1?1-.1*(k/.1):k<.5?.9+.2*sm((k-.1)/.4):k<.88?1.1-.2*sm((k-.5)/.38):.9+.1*sm((k-.88)/.12);
      }else{
        const back=.2;
        if(k<.25){const a=sm(k/.25);px=x0-ux*back*a;pz=z0-uz*back*a;pitch=-.4*a;sy=1-.1*a;py=0;}
        else if(k<.5){const a=sm((k-.25)/.25),a2=a*a;px=x0-ux*back+(dx+ux*back)*a2;pz=z0-uz*back+(dz+uz*back)*a2;pitch=-.4+1.1*a;sy=.9+.2*a;py=hop?Math.sin(a*Math.PI)*flyH:0;}
        else{const a=sm((k-.5)/.5);px=x1;pz=z1;pitch=.7*(1-a)+Math.sin(a*Math.PI)*.1;sy=1.1-.1*a-(a<.3?.1*Math.sin(a/.3*Math.PI):0);py=Math.sin(Math.min(1,a*2)*Math.PI)*.25*(1-a);}
        yaw=face0+(yawTo-face0)*(k<.7?1:sm((1-k)/.3));
        if(k>=.5&&!hit){hit=true;v3Burst(R,{x:x1,y:.9,z:z1},'255,255,255',2.4,260);v3Ring(R,{x:x1,z:z1},{col:'255,235,200',r0:.2,r1:1.4,ms:420,a:.9});v3Shake(R,.1,140);}
      }
      if(burn&&FX.on&&k<1)v3Emit(R,{x:px,y:py+.25,z:pz},{n:2,col:burn>2?'150,200,255':'255,140,40',v0:.1,v1:.6,l0:.35,l1:.7,s0:.25,s1:.45,g:3,up:.8});
      g.position.set(px,py,pz);
      b.rotation.y=yaw;b.rotation.x=pitch;b.scale.set(base*(1+(1-sy)*.5),base*sy,base*(1+(1-sy)*.5));
      if(k>=1){g.position.set(x1,0,z1);b.rotation.set(0,face0,0);b.scale.setScalar(base);o.moving=false;
        if(FX.on)v3Emit(R,{x:x1,y:.1,z:z1},{n:5,col:'210,215,225',blend:false,v0:.2,v1:1,l0:.3,l1:.6,s0:.2,s1:.4,g:.3,flat:true,up:.2});return true;}
    }});
  }
  for(const[id,o]of[...R.pcs]){
    if(cur.has(id)||o.dying)continue;
    const mv=movers.find(m=>m.to===o.i),delay=msHit.has(o.i)?msHit.get(o.i):mv?Math.round((impact.get(mv.o.id)||.3)*1000):0;
    v3Kill(R,o,first?0:delay);
  }
  for(const o of R.pcs.values())if(!o.dying)v3Decor(R,o);
  v3Trail(R,first);
  R.walls=R.walls||[null,null];
  for(const c of[0,1]){const n=G.streak[c],lv=n>=6?3:n>=4?2:n>=3?1:0,w=R.walls[c];
    if(w&&w.lvl===lv)continue;if(w)R.scene.remove(w.g);R.walls[c]=null;
    if(lv){const g=v3FlameWall(R,lv,c);R.scene.add(g);R.walls[c]={g,lvl:lv};}}
  /* orbs */
  const col={y:0xffcf33,r:0xff5468,g:0x3fdc8a,b:0xf0b030,t:0x9aa8cc,i:0xb48cff};
  for(const[sq,ob]of[...R.orbs])if(G.pw[sq]!==ob.k){R.orbs.delete(sq);
    const c=ORB_COL[ob.k],mvr=movers.find(m=>m.to===sq),dl=mvr&&FX.on&&!first?Math.round((impact.get(mvr.o.id)||.3)*1000):0;
    const fin=()=>{R.scene.remove(ob.g);v3Burst(R,{x:sqX(sq),y:.8,z:sqZ(sq)},c,2.4,500);v3Ring(R,{x:sqX(sq),z:sqZ(sq)},{col:c,r0:.2,r1:1.8,ms:600});v3Emit(R,{x:sqX(sq),y:.8,z:sqZ(sq)},{n:14,col:c,v0:.8,v1:3,l0:.4,l1:.9,g:-2});sfx('pickup');if(ob.k==='r')sfx('zap',120);};
    if(!dl){fin();continue;}
    const t0=performance.now(),y0=ob.g.position.y;
    R.anims.push({upd:(dt)=>{ob.t+=dt;const el=performance.now()-t0-dl;ob.vis.userData.upd(ob.t,dt);if(el<0){ob.g.position.y=.8+Math.sin(ob.t*2)*.1;return;}
      const k=Math.min(1,el/340),e=k*k;ob.g.position.y=y0+(.95-y0)*e;ob.g.rotation.y=k*9;ob.g.scale.setScalar(Math.max(.05,1-e*.9));ob.ring.visible=false;if(k>=1){ob.g.rotation.y=0;fin();return true;}}});
  }
  for(let i=0;i<N*N;i++){const k=G.pw[i];if(k&&!R.orbs.has(i)){
    const g=new THREE.Group(),cc=new THREE.Color(col[k]);
    const vis=k==='y'?v3Crown(R,1.9):k==='r'?v3Thunder(R,1.8):k==='b'?v3Coin(R,1.9):k==='t'?v3MiniTurret(R,1.9):k==='i'?v3Eye(R,1.9):v3Runes(R,2.0);g.add(vis);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.28,.36,36),new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.raycast=()=>{};g.add(ring);
    g.position.set(sqX(i),.8,sqZ(i));R.scene.add(g);R.orbs.set(i,{g,k,t:Math.random()*6,vis,ring});
    if(!first){v3Ring(R,{x:sqX(i),z:sqZ(i)},{col:ORB_COL[k],r0:1.8,r1:.2,ms:600});sfx('orb');}
  }}
  if(G.portals&&!R.portalG)R.portalG=[v3Portal(R,G.portals[0],0x4fa8ff),v3Portal(R,G.portals[1],0xff9a3a)];
  if(!G.portals&&R.portalG){for(const g of R.portalG)R.scene.remove(g);R.portalG=null;}
  if(G.fire&&G.fire.on&&!R.fireG){R.fireG=v3FireRing(R);R.scene.add(R.fireG);}
  if((!G.fire||!G.fire.on)&&R.fireG){R.scene.remove(R.fireG);R.fireG=null;}
  if(G.fire&&!G.fire.on&&!first){const rem=G.fire.at-G.ply;if(rem<=5&&rem>0&&R.fireRem!==rem){R.fireRem=rem;v3Banner('Safe Zone ignites in '+rem+' turn'+(rem>1?'s':''),'hot');sfx('check');}}
  /* mines, pending resurrections, meteors */
  for(const[sq,m]of[...R.mines])if(!G.mines.some(x=>x.sq===sq)){R.scene.remove(m);R.mines.delete(sq);}
  for(const mn of G.mines)if(!R.mines.has(mn.sq)){
    const g=new THREE.Group(),c=mn.c===0?0xffb347:0xb68cff;
    const b=new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),new THREE.MeshStandardMaterial({color:0x22252e,roughness:.4,metalness:.6}));b.position.y=.16;b.scale.y=.7;b.castShadow=true;g.add(b);
    for(let k=0;k<6;k++){const sp=new THREE.Mesh(new THREE.ConeGeometry(.04,.14,6),new THREE.MeshStandardMaterial({color:0x555a66,metalness:.7,roughness:.4}));const a=k*1.047;sp.position.set(Math.cos(a)*.2,.2,Math.sin(a)*.2);sp.rotation.set(Math.sin(a)*1.4,0,-Math.cos(a)*1.4);g.add(sp);}
    const l=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:c}));l.position.y=.36;g.add(l);g.userData.l=l;
    const gl=v3Sprite(R,R.tex.glow,new THREE.Color(c));gl.scale.set(.9,.9,1);gl.position.y=.3;g.add(gl);
    g.position.set(sqX(mn.sq),0,sqZ(mn.sq));R.scene.add(g);R.mines.set(mn.sq,g);
  }
  for(const[k,s]of[...R.marks])if(k.startsWith('@')){}
  for(const s of R.deco||[])R.scene.remove(s);R.deco=[];
  for(const z of G.rezQ){const s=v3Mark(R,'✝');s.scale.set(1.2,1.2,1);s.position.set(sqX(z.sq),1.1,sqZ(z.sq));R.scene.add(s);R.deco.push(s);const n=v3Mark(R,'#'+Math.max(1,Math.ceil((z.at-G.ply)/2)));n.scale.set(.45,.45,1);n.position.set(sqX(z.sq)+.3,.55,sqZ(z.sq)+.3);R.scene.add(n);R.deco.push(n);}
  for(const m of G.meteors){const s=v3Mark(R,'☄');s.scale.set(1.2,1.2,1);s.position.set(sqX(m.sq),1.1,sqZ(m.sq));R.scene.add(s);R.deco.push(s);}
  /* gold mines */
  R.gms=R.gms||new Map();
  for(const[sq,g]of[...R.gms])if(!G.gm.includes(sq)){R.gms.delete(sq);R.scene.remove(g.g);}
  for(const sq of G.gm)if(!R.gms.has(sq)){
    const g=new THREE.Group(),gold=new THREE.MeshStandardMaterial({color:0xffc83a,metalness:.9,roughness:.25,emissive:0xa05a00,emissiveIntensity:.9,flatShading:true}),rock=new THREE.MeshStandardMaterial({color:0x3a3430,roughness:.9,flatShading:true});
    const pit=new THREE.Mesh(new THREE.CylinderGeometry(.46,.5,.06,18),rock);pit.position.y=.03;g.add(pit);
    for(let k=0;k<6;k++){const a=k/6*6.283+.4,r=.18+((k*37)%10)/50,m=new THREE.Mesh(new THREE.DodecahedronGeometry(.08+((k*13)%5)/60),k%2?gold:rock);m.position.set(Math.cos(a)*r,.1+(k%3)*.02,Math.sin(a)*r);m.rotation.set(k,k*2,0);g.add(m);}
    const nug=new THREE.Mesh(new THREE.DodecahedronGeometry(.17),gold);nug.position.y=.2;g.add(nug);
    const gl=v3Sprite(R,R.tex.glow,new THREE.Color(0xffc84a));gl.scale.set(1.5,1.5,1);gl.position.y=.25;gl.material.opacity=.5;g.add(gl);
    g.position.set(sqX(sq),0,sqZ(sq));R.scene.add(g);const ent={g,t:Math.random()*6};R.gms.set(sq,ent);
    R.anims.push({upd:(dt)=>{if(R.gms.get(sq)!==ent)return true;ent.t+=dt||.016;nug.rotation.y=ent.t*1.4;nug.position.y=.2+Math.sin(ent.t*2)*.03;gl.material.opacity=.4+.15*Math.sin(ent.t*3);}});
  }
  /* boss */
  {const B=G.boss,bc=a=>({x:bossX(a),z:bossZ(a)});
   if(B.on&&!R.boss){const g=new THREE.Group();g.userData.boss=true;const dr=B.kind==='D'?v3Dragon(R,V3S):null,body=dr?dr.g:v3Model(R,{t:B.kind==='K'?'KR':'Z',c:2});g.add(body);const p0=bc(B.sq);g.position.set(p0.x,0,p0.z);R.pieceRoot.add(g);
     const lab=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,depthTest:false}));lab.scale.set(2.8,1.4,1);lab.position.y=3.6;lab.renderOrder=10;lab.raycast=()=>{};g.add(lab);
     R.boss={g,body,sq:B.sq,lab,key:'',kind:B.kind,dr};
     if(!R.first&&FX.on){const t0=performance.now();g.scale.setScalar(.01);R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/900),e=1-Math.pow(1-k,3)*Math.cos(k*7);g.scale.setScalar(Math.max(.01,e));if(k>=1){g.scale.setScalar(1);return true;}}});}}
   if(!B.on&&R.boss){const b0=R.boss;R.boss=null;b0.g.userData.keepAlive=1;const t0=performance.now();R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/700);b0.g.scale.setScalar(Math.max(.01,1-k*k));b0.g.position.y=-k*1.5;if(k>=1){R.pieceRoot.remove(b0.g);return true;}}});}
   if(B.on&&R.boss){const bo=R.boss;
     if(bo.sq!==B.sq){const a=bc(bo.sq),b=bc(B.sq),t0=performance.now();bo.sq=B.sq;R.anims.push({upd:()=>{const fl=B.kind==='D',k=Math.min(1,(performance.now()-t0)/(fl?1300:700)),e=k*k*(3-2*k);bo.g.position.set(a.x+(b.x-a.x)*e,Math.abs(Math.sin(k*Math.PI))*(fl?2.6:.25),a.z+(b.z-a.z)*e);if(bo.dr){bo.dr.fly=k<1;bo.g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)*Math.min(1,k*5,(1-k)*5);}bo.body.rotation.z=Math.sin(k*Math.PI*2)*.05;if(k>=1){bo.g.position.set(b.x,0,b.z);bo.body.rotation.z=0;if(bo.dr){bo.dr.fly=false;bo.g.rotation.y=0;}return true;}}});}
     const key=B.hits.join()+'/'+B.max;if(bo.key!==key){bo.key=key;const t=v3Tex((c,s)=>{c.clearRect(0,0,s,s);c.fillStyle='rgba(15,18,28,.82)';c.beginPath();c.roundRect?c.roundRect(8,s*.3,s-16,s*.4,18):c.rect(8,s*.3,s-16,s*.4);c.fill();c.font='700 36px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f3efe3';c.fillText('W '+B.hits[0]+'/'+B.max,s*.26,s*.5);c.fillStyle='#ff8a9a';c.fillText('B '+B.hits[1]+'/'+B.max,s*.74,s*.5);},256);bo.lab.material.map=t;bo.lab.material.needsUpdate=true;}}}
  /* dragon fire + baby dragons */
  {R.dfG=R.dfG||new Map();R.babyG=R.babyG||new Map();
   const want=new Set(G.df.map(x=>x.sq));
   for(const sq of want)if(!R.dfG.has(sq)){const g=v3FireTile(R,sq);R.scene.add(g);R.dfG.set(sq,g);}
   for(const[sq,g]of[...R.dfG])if(!want.has(sq)){R.scene.remove(g);R.dfG.delete(sq);}
   const ids=new Set(G.baby.map(b=>b.id));
   for(const bb of G.baby){let e=R.babyG.get(bb.id);
     if(!e){const dr=v3Dragon(R,V3S*.36),g=new THREE.Group();dr.fly=true;dr.g.rotation.y=bb.c===0?Math.PI:0;g.add(dr.g);g.position.set(sqX(bb.sq),1.5,sqZ(bb.sq));R.scene.add(g);R.babyG.set(bb.id,{g,body:dr.g,dr,sq:bb.sq,ph:Math.random()*6});}
     else if(e.sq!==bb.sq){const a=e.g.position.clone(),b=new THREE.Vector3(sqX(bb.sq),1.5,sqZ(bb.sq)),t0=performance.now();e.sq=bb.sq;R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/700);e.g.position.set(a.x+(b.x-a.x)*k,1.5+Math.sin(k*Math.PI)*.4,a.z+(b.z-a.z)*k);if(k>=1)return true;}});}}
   for(const[id,e]of[...R.babyG])if(!ids.has(id)){R.scene.remove(e.g);R.babyG.delete(id);}}
  /* fortification pillars */
  R.fortG=R.fortG||[null,null];
  for(const c of[0,1]){const on=G.fort[c]>0||G.ply<OPEN_FORT,fg=R.fortG[c];
    if(on&&!fg){const g=new THREE.Group(),row=homeRow(c),ms=[];
      for(let col=OFF();col<=9+OFF();col++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,2.2,24,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,blending:THREE.AdditiveBlending}));m.position.set(sqX(row*N+col),1.1,sqZ(row*N+col));m.raycast=()=>{};g.add(m);ms.push(m);
        const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.46,28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.set(sqX(row*N+col),.06,sqZ(row*N+col));ring.raycast=()=>{};g.add(ring);}
      R.scene.add(g);const ent={g,ms};R.fortG[c]=ent;const t0=performance.now();
      R.anims.push({upd:()=>{if(R.fortG[c]!==ent){R.scene.remove(g);return true;}const t=(performance.now()-t0)/1000;ms.forEach((m,k)=>{m.material.opacity=.08+.04*Math.sin(t*3+k*.6);});}});}
    if(!on&&fg){R.fortG[c]=null;}}
  /* fx events */
  let msN=0;
  for(const e of evs){
    const q={x:sqX(e.sq),y:.7,z:sqZ(e.sq)};
    const cc=e.k==='clone'?ORB_COL.g:ORB_COL.y;
    if(e.k==='charge'||e.k==='clone'||e.k==='respawn'){sfx(e.k==='clone'?'runes':'crown',e.k==='charge'?280:260);setTimeout(()=>{v3Ring(R,q,{col:cc,r0:.3,r1:2,ms:700});v3Emit(R,q,{n:22,col:cc,v0:1,v1:4,l0:.5,l1:1.1,g:-1});if(e.k==='respawn')v3Beam(R,q,cc,6,700);if(e.k==='clone')v3RuneBurst(R,q);},e.k==='charge'?280:260);}
    else if(e.k==='rez'){sfx('rez',200);setTimeout(()=>{v3Beam(R,q,'255,215,100',8,1000);v3Ring(R,q,{col:'255,215,100',r0:.2,r1:2.8,ms:900,a:1});v3Burst(R,q,'255,210,90',4,800);v3Emit(R,q,{n:40,col:'255,220,120',v0:.6,v1:3,l0:.7,l1:1.4,g:2,up:1.2,lift:.5});v3Rise(R,q,'✝','255,215,100',1300);v3Flash(R,'255,200,80',q,600,18);},200);}
    else if(e.k==='frost'){sfx('frost',200);setTimeout(()=>{v3Ring(R,q,{col:'140,220,255',r0:.2,r1:1.7,ms:600});v3Emit(R,q,{n:14,col:'170,230,255',v0:.6,v1:2.5,l0:.5,l1:1,g:-3,s0:.08,s1:.2});},200);}
    else if(v3EnvFx(R,e,q)){}
    else if(e.k==='meteor'){setTimeout(()=>v3Streak(R,q,'255,140,60',420,12,()=>{sfx('boom');v3Ring(R,q,{col:'255,140,50',r0:.2,r1:2.4,ms:640,a:1});v3Burst(R,q,'255,170,70',3,500);v3Emit(R,q,{n:26,col:'255,170,60',v0:1.5,v1:6,l0:.4,l1:1,g:-6});v3Flash(R,'255,140,60',q,400,22);v3Shake(R,.2,260);}),Math.random()*300);}
    else if(e.k==='zone'){v3Banner('Safe Zone: the side columns ignite in 30 turns','hot');sfx('chime');}
    else if(e.k==='ignite'){v3Ignite(R);}
    else if(e.k==='burn'){setTimeout(()=>{v3Emit(R,q,{n:12,col:'255,140,40',v0:.6,v1:2.4,l0:.5,l1:1,g:2,up:1.3});v3Burst(R,q,'255,170,70',2.4,420);},e.late||350);}
    else if(e.k==='knock'){setTimeout(()=>{v3Ring(R,q,{col:'255,150,60',r0:.3,r1:2.2,ms:600,a:1});v3Shake(R,.25,260);},200);}
    else if(e.k==='queen'){sfx('rez',200);setTimeout(()=>{v3Beam(R,q,'255,215,100',9,1100);v3Ring(R,q,{col:'255,215,100',r0:.2,r1:3,ms:900,a:1});v3Burst(R,q,'255,230,150',4.5,700);v3Emit(R,q,{n:36,col:'255,220,120',v0:.6,v1:3.4,l0:.7,l1:1.4,g:2,up:1.3,lift:.5});v3Flash(R,'255,210,110',q,600,22);},200);}
    else if(e.k==='missile'){v3Missile(R,q.x,q.z,300+(msN++)*230);}
    else if(e.k==='streak'){setTimeout(()=>{v3StreakBanner(e.c,e.n,e.sq);},700);}
    else if(e.k==='fblood'){setTimeout(()=>{v3Banner(SIDE[e.c]+' · First blood +30g','warm');sfx('coin');v3Emit(R,q,{n:16,col:'255,215,100',v0:1,v1:3,l0:.5,l1:1,g:1,up:1.4});},650);}
    else if(e.k==='shutdown'){setTimeout(()=>{v3Ring(R,q,{col:'150,190,255',r0:.3,r1:2.4,ms:700});v3Emit(R,q,{n:18,col:'120,130,150',blend:false,v0:.4,v1:1.6,l0:.8,l1:1.5,s0:.3,s1:.6,g:2,up:1,grow:1.2});v3Banner(SIDE[e.c]+': streak ended ('+e.n+')'+(e.b?' · +'+e.b+'g shutdown':''),'cold');sfx('shut');if(e.b)sfx('coin',250);},500);}
    else if(e.k==='mine'){sfx('mine',80);setTimeout(()=>{v3Flash(R,'255,180,90',q,350,25);v3Ring(R,q,{col:'255,120,60',r0:.2,r1:2.2,ms:560,a:1});v3Burst(R,q,'255,170,80',3,400);v3Emit(R,q,{n:30,col:'255,150,60',v0:2,v1:7,l0:.4,l1:.9,g:-6});v3Shake(R,.4,300);},80);}
    else if(e.k==='shot'){v3Shot(R,e.sq,e.to);}
    else if(e.k==='dbreath'){if(R.boss&&R.boss.dr)v3DragonBreathe(R,R.boss.dr,e.tiles.map(t=>new THREE.Vector3(sqX(t),.35,sqZ(t))),220);}
    else if(e.k==='dland'){setTimeout(()=>{sfx('boom');v3Shake(R,.5,600);for(const t of e.cells){const qq={x:sqX(t),y:.35,z:sqZ(t)};v3Burst(R,qq,'255,160,50',3,480);v3Ring(R,qq,{col:'255,120,40',r0:.2,r1:1.8,ms:620,a:1});v3Emit(R,qq,{n:20,col:'255,140,40',v0:1,v1:4.5,l0:.5,l1:1.1,g:-3,up:1.4});}},1250);}
    else if(e.k==='kwater'){sfx('boom');v3Shake(R,.35,520);e.tiles.forEach((t,k)=>setTimeout(()=>{const qq={x:sqX(t),y:.3,z:sqZ(t)};v3Emit(R,qq,{n:12,col:'130,200,255',v0:1.5,v1:5,l0:.4,l1:.9,g:-2,up:1.2});v3Ring(R,qq,{col:'150,210,255',r0:.2,r1:1.2,ms:420,a:.8});},k*55));}
    else if(e.k==='kslam'){sfx('boom');v3Shake(R,.5,600);e.tiles.forEach((t,k)=>setTimeout(()=>{const qq={x:sqX(t),y:.3,z:sqZ(t)};v3Burst(R,qq,'160,130,220',3.2,480);v3Ring(R,qq,{col:'170,140,230',r0:.2,r1:2.2,ms:620,a:1});v3Emit(R,qq,{n:22,col:'110,150,210',v0:1,v1:4,l0:.5,l1:1,g:-2,up:1.2});v3Rubble(R,qq,6,0x4a3a70);},k*160));}
    else if(e.k==='babyup'){sfx('place');setTimeout(()=>{v3Ring(R,q,{col:'255,150,60',r0:.3,r1:2.4,ms:700,a:1});v3Emit(R,q,{n:22,col:'255,170,70',v0:1,v1:4,l0:.5,l1:1,g:-2,up:1.3});},200);}
    else if(e.k==='babyfire'){const be=[...R.babyG.values()].find(x=>x.sq===e.sq);if(be&&e.cells.length)v3DragonBreathe(R,be.dr,e.cells.map(t=>new THREE.Vector3(sqX(t),.35,sqZ(t))),760,1300);}
    else if(e.k==='crush'){sfx('capture');setTimeout(()=>{v3Burst(R,q,'230,200,150',3,400);v3Ring(R,q,{col:'220,190,140',r0:.2,r1:1.8,ms:480,a:.9});v3Rubble(R,q,8,0x6a5030);v3Shake(R,.2,220);},220);}
    else if(e.k==='ramhit'){sfx('capture');v3Burst(R,q,'255,230,180',3,300);v3Shake(R,.18,200);}
    else if(e.k==='turretup'){sfx('place');setTimeout(()=>{v3Ring(R,q,{col:'170,185,220',r0:.3,r1:2,ms:600});v3Emit(R,q,{n:18,col:'190,200,225',v0:.8,v1:3,l0:.4,l1:.9,g:1,up:1.1});v3Shake(R,.1,140);},60);}
    else if(e.k==='turretgone'){sfx('shut',300);setTimeout(()=>{v3Emit(R,q,{n:22,col:'255,170,80',v0:1,v1:4,l0:.4,l1:1,g:-3});v3Burst(R,q,'255,200,120',2.6,420);},320);}
    else if(e.k==='bounty'){sfx('bounty');setTimeout(()=>{v3Ring(R,q,{col:'255,200,60',r0:.2,r1:2.2,ms:700,a:1});v3Emit(R,q,{n:30,col:'255,215,90',v0:1.2,v1:4,l0:.6,l1:1.3,g:-4,up:1.4});v3Banner('Bounty placed · +40g','warm');},120);}
    else if(e.k==='cloak'){sfx('cloak');setTimeout(()=>{v3Ring(R,q,{col:'190,150,255',r0:2,r1:.2,ms:600,a:1});v3Emit(R,q,{n:26,col:'200,170,255',v0:.4,v1:2,l0:.6,l1:1.3,g:1,up:1.4,s0:.1,s1:.3});},100);}
    else if(e.k==='bossslam'){sfx('boom');const q2={x:bossX(e.sq),y:.3,z:bossZ(e.sq)};setTimeout(()=>{v3Ring(R,q2,{col:'255,120,80',r0:.5,r1:5.5,ms:900,a:1});v3Ring(R,q2,{col:'255,220,160',r0:.3,r1:4,ms:700,a:.8});v3Emit(R,q2,{n:40,col:'180,160,140',blend:false,v0:1,v1:4,l0:.6,l1:1.2,s0:.3,s1:.7,g:1,up:.4,flat:true});v3Shake(R,.45,500);if(R.boss){const g=R.boss.g,t0=performance.now();R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/500);g.scale.set(1+.1*Math.sin(k*Math.PI),1-.12*Math.sin(k*Math.PI),1+.1*Math.sin(k*Math.PI));if(k>=1){g.scale.setScalar(1);return true;}}});}},50);}
    else if(e.k==='ascend'){sfx('rez',100);const q2={x:sqX(e.sq),y:.5,z:sqZ(e.sq)};v3Banner(SIDE[e.c]+' ascends · army rebuilt','warm');setTimeout(()=>{v3Beam(R,q2,'255,215,100',9,1200);v3Ring(R,q2,{col:'255,215,100',r0:.3,r1:N*.55,ms:1100,a:1});v3Burst(R,q2,'255,230,150',5,800);v3Shake(R,.3,500);},150);}
    else if(e.k==='sunder'){sfx('portal');v3Banner('Sunder · every unit changes sides','hot');const q2={x:0,y:.5,z:0};setTimeout(()=>{v3Ring(R,q2,{col:'255,90,110',r0:.5,r1:N*.8,ms:900,a:1});v3Ring(R,q2,{col:'255,255,255',r0:.3,r1:N*.65,ms:1100,a:.9});v3Flash(R,'255,200,220',q2,500,40);v3Shake(R,.4,500);},120);}
    else if(e.k==='formation'){sfx('place');setTimeout(()=>{v3Ring(R,q,{col:'150,220,255',r0:.3,r1:2.2,ms:600,a:1});v3Emit(R,q,{n:16,col:'180,230,255',v0:.6,v1:2.4,l0:.4,l1:.9,g:1,up:1});},120);}
    else if(e.k==='polar'){sfx('portal');const q2={x:sqX(e.to),y:.7,z:sqZ(e.to)};setTimeout(()=>{v3Ring(R,q,{col:'180,150,255',r0:.2,r1:2,ms:600,a:1});v3Ring(R,q2,{col:'255,150,200',r0:.2,r1:2,ms:600,a:1});v3Emit(R,q,{n:14,col:'190,160,255',v0:.6,v1:2.2,l0:.4,l1:.9,g:-1,up:1});v3Emit(R,q2,{n:14,col:'255,170,210',v0:.6,v1:2.2,l0:.4,l1:.9,g:-1,up:1});},100);}
    else if(e.k==='gmup'){sfx('coin');setTimeout(()=>{v3Ring(R,q,{col:'255,200,60',r0:.2,r1:2,ms:700,a:1});v3Emit(R,q,{n:26,col:'255,215,90',v0:1,v1:3.5,l0:.5,l1:1.1,g:-2,up:1.3});},200);}
    else if(e.k==='gmpay'){sfx('coin',200);setTimeout(()=>{v3Emit(R,{x:q.x,y:.5,z:q.z},{n:10,col:'255,215,90',v0:.5,v1:2,l0:.6,l1:1.1,g:-3,up:1.8,s0:.08,s1:.16});},150);}
    else if(e.k==='gmgone'){setTimeout(()=>{v3Emit(R,q,{n:18,col:'150,130,100',blend:false,v0:.4,v1:1.6,l0:.6,l1:1.2,s0:.2,s1:.5,g:1,up:.8});},100);}
    else if(e.k==='bossup'){sfx('boss');setTimeout(()=>{const q2={x:bossX(e.sq),y:.5,z:bossZ(e.sq)};v3Ring(R,q2,{col:'255,80,60',r0:.3,r1:5,ms:1100,a:1});v3Emit(R,q2,{n:50,col:'255,120,70',v0:1.5,v1:6,l0:.6,l1:1.4,g:-4,up:1.2});v3Shake(R,.4,700);v3Banner(e.kind==='D'?'A Dragon has appeared · 7 hits to slay it':e.kind==='K'?'The Kraken rises · 6 hits for 1500g':'The Vanguard has appeared · 5 hits for 3 augments','hot');},120);}
    else if(e.k==='bosshit'){const q2={x:bossX(e.to),y:.9,z:bossZ(e.to)};setTimeout(()=>{sfx('bosshit');v3Emit(R,q,{n:16,col:'200,170,255',v0:1,v1:3,l0:.4,l1:.8,g:-2,up:1});v3Burst(R,q2,'255,90,70',3,420);v3Ring(R,q2,{col:'255,120,90',r0:.3,r1:2.2,ms:600,a:1});v3Shake(R,.2,260);if(R.boss){const g=R.boss.g,t0=performance.now();R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/300);g.scale.setScalar(1+.07*Math.sin(k*Math.PI));if(k>=1){g.scale.setScalar(1);return true;}}});}},220);}
    else if(e.k==='bossdie'){sfx('mate');const q2={x:bossX(e.sq),y:.8,z:bossZ(e.sq)};setTimeout(()=>{v3Ring(R,q2,{col:'255,215,100',r0:.3,r1:6,ms:1000,a:1});v3Burst(R,q2,'255,210,100',5,800);v3Emit(R,q2,{n:60,col:'255,215,100',v0:1.5,v1:7,l0:.7,l1:1.5,g:-3});v3Shake(R,.45,600);v3Banner(SIDE[e.c]+(e.kind==='D'?' slays the Dragon · baby dragon incoming':e.kind==='K'?' slays the Kraken · +1500g':' slays the Vanguard · 3 augments'),'warm');},150);}
    else if(e.k==='fort'){sfx('fort');v3Banner(SIDE[e.c]+' · Fortification','warm');}
    else if(e.k==='fortbreak'){const q2={x:sqX(e.to),y:.8,z:sqZ(e.to)};setTimeout(()=>{sfx('zap');v3Ring(R,q2,{col:'255,255,255',r0:.2,r1:1.8,ms:560,a:1});v3Flash(R,'255,255,255',q2,300,30);v3Emit(R,q,{n:18,col:'255,255,255',v0:1,v1:4,l0:.3,l1:.7,g:-2});},180);}
    else if(e.k==='shop'){sfx('coin',260);setTimeout(()=>{v3Ring(R,q,{col:e.col,r0:.3,r1:1.8,ms:650});v3Emit(R,q,{n:20,col:e.col,v0:.8,v1:3.4,l0:.5,l1:1,g:1,up:1.1});},260);}
  }
  R.first=false;R.dirty=true;R.sk=Math.max(R.sk||0,20);
}
function v3Reset(){
  if(V3R&&V3R.envObj){for(const o of V3R.envObj.values())V3R.scene.remove(o.g);V3R.envObj.clear();}
  const R=V3R;if(!R)return;
  for(const o of R.pcs.values())R.pieceRoot.remove(o.grp);R.pcs.clear();
  for(const o of R.orbs.values())R.scene.remove(o.g);R.orbs.clear();
  for(const m of R.mines.values())R.scene.remove(m);R.mines.clear();
  for(const w of R.walls||[])if(w)R.scene.remove(w.g);R.walls=[null,null];
  for(const s of R.deco||[])R.scene.remove(s);R.deco=[];
  for(const g of(R.gms||new Map()).values())R.scene.remove(g.g);if(R.gms)R.gms.clear();
  if(R.boss){R.pieceRoot.remove(R.boss.g);R.boss=null;}
  if(R.fortG){for(const f of R.fortG)if(f)R.scene.remove(f.g);R.fortG=[null,null];}
  if(R.dfG){for(const g of R.dfG.values())R.scene.remove(g);R.dfG=new Map();}if(R.babyG){for(const e of R.babyG.values())R.scene.remove(e.g);R.babyG=new Map();}
  for(const p of R.parts)R.fxRoot.remove(p.s);R.parts=[];
  while(R.fxRoot.children.length)R.fxRoot.remove(R.fxRoot.children[0]);
  R.anims=[];R.shake=0;R.flash.intensity=0;R.first=true;R.punch=null;R.lastChk=-1;R.hovI=-1;R.hring.visible=false;
  if(R.trail){R.scene.remove(R.trail);R.trail=null;}R.trailKey='';
  R.tiles.forEach(t=>{t.position.y=-.09;t.rotation.set(0,0,0);});
  for(const g of R.portalG||[])R.scene.remove(g);R.portalG=null;if(R.fireG){R.scene.remove(R.fireG);R.fireG=null;}R.fireRem=null;
  v3ResetCam();
}

/* ---- main loop ---- */
function v3Loop(ts){
  requestAnimationFrame(v3Loop);
  try{v3Frame(ts);}catch(e){if(!V3.err){V3.err=1;console.error('3D frame error',e&&e.stack||e);}}
}
function v3Frame(ts){
  const R=V3R;if(!R||!V3.on||document.hidden)return;
  if(V3.menu&&ts-(R.last||0)<30)return;
  const dt=Math.min(.05,(ts-(R.last||ts))/1000);R.last=ts;
  if(V3.menu){R.az+=dt*.11;R.dirty=true;}
  for(let i=R.anims.length-1;i>=0;i--){let done=true;try{done=R.anims[i].upd(dt);}catch(e){if(!V3.err){V3.err=1;console.error('3D anim error',e&&e.stack||e);}}if(done)R.anims.splice(i,1);}
  for(let i=R.parts.length-1;i>=0;i--){
    const p=R.parts[i];p.t+=dt;const k=p.t/p.life;
    if(k>=1){R.fxRoot.remove(p.s);p.s.material.dispose();R.parts.splice(i,1);continue;}
    const d=Math.exp(-p.drag*dt);p.vx*=d;p.vz*=d;p.vy=p.vy*d+p.g*dt;
    p.s.position.x+=p.vx*dt;p.s.position.y=Math.max(.03,p.s.position.y+p.vy*dt);p.s.position.z+=p.vz*dt;
    p.s.material.opacity=p.a0*(1-k)*(k<.1?k*10:1);p.s.scale.setScalar(p.sz*(1+p.grow*k));
  }
  const now=ts/1000;let live=R.anims.length>0||R.parts.length>0||R.shake>0||R.dirty;
  for(const ob of R.orbs.values()){ob.t+=dt;ob.g.position.y=.8+Math.sin(ob.t*2)*.1;ob.vis.userData.upd(ob.t,dt);ob.ring.position.y=.03-ob.g.position.y;live=true;}
  if(FX.on)for(const o of R.pcs.values()){
    if(o.moving||o.dying||o.p.t==='X')continue;
    if(o.rg){rigIdle(o,now,dt);live=true;continue;}
    const t=now,ph=o.ph,ty=o.p.t,b=o.body,br=Math.sin(t*1.7+ph);
    b.scale.y=V3S*(1+.02*br);b.scale.x=b.scale.z=V3S*(1-.008*br);
    b.rotation.y=o.faceY+Math.sin(t*.45+ph)*(ty==='K'||ty==='Q'?.05:.09);
    b.rotation.z=Math.sin(t*.8+ph*1.3)*(ty==='P'?.025:.015);
    b.position.y=(ty==='C'||ty==='B')?Math.sin(t*2+ph)*.06:0;
    live=true;
  }
  for(const o of R.pcs.values())for(const c of o.grp.children){if(c.userData.pulse){const s=1.9+Math.sin(now*3)*.2;c.scale.set(s,s,1);live=true;}if(c.userData.upd){c.userData.upd(now,dt);live=true;}}
  if(v3EnvUpd(R,now,dt))live=true;
  for(const w of R.walls||[])if(w){w.g.userData.upd(now,dt);live=true;}
  for(const g of R.portalG||[]){g.userData.upd(now,dt);live=true;}
  if(R.fireG){R.fireG.userData.upd(now,dt);live=true;}
  if(R.dfG)for(const g of R.dfG.values()){g.userData.upd(now,dt);live=true;}
  if(R.babyG)for(const e of R.babyG.values()){v3DragonUpd(e.dr,now);e.dr.body.position.y+=Math.sin(now*.003+e.ph)*.1;live=true;}
  if(R.boss&&R.boss.dr){v3DragonUpd(R.boss.dr,now);live=true;}
  if(R.hring.visible){R.hring.scale.setScalar(1+.07*Math.sin(now*6));live=true;}
  if(R.punch)live=true;
  for(const m of R.mines.values()){m.userData.l.material.color.setScalar(.5+.5*Math.sin(now*6));live=true;}
  if(!live&&ts-R.lastDraw<250)return;
  if(!R.anims.length&&!R.parts.length&&!R.dirty&&!R.shake&&((ts/16.7)|0)%2){R.lastSkip=(R.lastSkip||0)+1;return;}
  const gap=ts-R.lastDraw;R.lastDraw=ts;R.dirty=false;
  if(gap<80)v3QualityTick(R,gap/((R.lastSkip||0)+1));R.lastSkip=0;
  if(R.q>=2&&(R.anims.length||R.parts.length||R.sk>0||(R.sf++%3===0)))R.renderer.shadowMap.needsUpdate=true;
  if(R.sk>0)R.sk--;
  v3Cam(R);R.renderer.render(R.scene,R.cam);
}
function v3Boot(){
  v3Init();V3.on=V3.ok;
  if(!V3.ok){const t=$('toast');if(t){t.textContent='WebGL is not available, so the 3D board cannot start.';t.className='toast show r';}return;}
  v3Resize();if(G){v3Reset();render();}
  try{const gl=V3R.renderer.getContext(),x=gl.getExtension('WEBGL_debug_renderer_info'),n=x?String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)):'';
    if(/basic render|swiftshader|llvmpipe|software|warp/i.test(n)&&!/nvidia|geforce|radeon|rtx|gtx|intel\(r\)/i.test(n))V3.soft=n;}catch(e){}
}

/* ===== Powerup visuals ===== */
const _ad=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
const _sp=(R,c,o,sc)=>{const s=v3Sprite(R,R.tex.glow,new THREE.Color(c),false);s.material.opacity=o;s.material.toneMapped=false;s.scale.set(sc,sc,1);return s;};
function v3Crown(R,s){
  const g=new THREE.Group(),gold=0xffe39a,hold=new THREE.Group();g.add(hold);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.25,.21,.13,28,1,true),_ad(0x7fe0ff,.6));hold.add(band);
  const rt=new THREE.Mesh(new THREE.TorusGeometry(.25,.014,6,28),_ad(0xffe08a,.95));rt.rotation.x=Math.PI/2;rt.position.y=.065;hold.add(rt);
  const rb=new THREE.Mesh(new THREE.TorusGeometry(.21,.012,6,28),_ad(0xffc84a,.85));rb.rotation.x=Math.PI/2;rb.position.y=-.065;hold.add(rb);
  for(let k=0;k<10;k++){
    const a=k/10*Math.PI*2,tall=k%2===0,h=tall?.27:.14,r=.235;
    const sp=new THREE.Mesh(new THREE.ConeGeometry(.052,h,4),_ad(tall?0xffd35a:0x9fe8ff,.75));sp.position.set(Math.cos(a)*r,.065+h/2,Math.sin(a)*r);hold.add(sp);
    if(tall){const gm=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),_ad(0xffffff,1));gm.position.set(Math.cos(a)*r,.065+h+.02,Math.sin(a)*r);hold.add(gm);}
  }
  const gl=_sp(R,0xffe9a0,.22,.8);gl.position.y=.1;g.add(gl);
  const wisps=[];for(let k=0;k<7;k++){const w=_sp(R,k%2?0x9fe8ff:0xffd35a,.7,.09);g.add(w);wisps.push({w,o:k/7,a:k*2.4});}
  g.scale.setScalar(s);
  g.userData.upd=(t)=>{
    hold.rotation.y=t*.9;band.material.opacity=.5+.12*Math.sin(t*3);gl.material.opacity=.2+.07*Math.sin(t*2.4);
    for(const w of wisps){const p=(t*.45+w.o)%1;w.w.position.set(Math.cos(w.a+t)*.2*(1-p*.4),.05+p*.7,Math.sin(w.a+t)*.2*(1-p*.4));w.w.material.opacity=Math.sin(p*Math.PI)*.8;}
  };
  return g;
}
function v3Thunder(R,s){
  const g=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),new THREE.MeshBasicMaterial({color:0xff1f38,toneMapped:false}));g.add(core);
  const hot=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),new THREE.MeshBasicMaterial({color:0xffe0e0,toneMapped:false}));g.add(hot);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),_ad(0xff3347,.3));g.add(shell);
  const gl=_sp(R,0xff3a50,.3,1.1);g.add(gl);
  const arcs=[];
  for(let k=0;k<10;k++){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(7*3),3));
    const ln=new THREE.Line(geo,new THREE.LineBasicMaterial({color:k%3===0?0xfff4f4:0xff2a40,transparent:true,opacity:1,depthWrite:false,toneMapped:false}));
    ln.frustumCulled=false;ln.raycast=()=>{};g.add(ln);arcs.push(ln);
  }
  let acc=9;
  const regen=()=>{for(const ln of arcs){
    ln.visible=Math.random()<.8;const a=Math.random()*6.283,b=Math.acos(2*Math.random()-1),L=.42+Math.random()*.34;
    const dx=Math.sin(b)*Math.cos(a),dy=Math.cos(b),dz=Math.sin(b)*Math.sin(a),pa=ln.geometry.attributes.position;
    for(let i=0;i<7;i++){const f=i/6,j=i===0?0:.1;pa.setXYZ(i,dx*L*f+(Math.random()-.5)*j,dy*L*f+(Math.random()-.5)*j,dz*L*f+(Math.random()-.5)*j);}
    pa.needsUpdate=true;}};
  g.scale.setScalar(s);
  g.userData.upd=(t,dt)=>{
    acc+=dt||.016;if(acc>.07){acc=0;regen();}
    const f=.85+Math.random()*.35;gl.scale.set(1.1*f,1.1*f,1);shell.scale.setScalar(.92+.16*Math.sin(t*14));core.scale.setScalar(.95+.1*Math.sin(t*9));
  };
  return g;
}
function v3Coin(R,s){
  const g=new THREE.Group(),h=new THREE.Group();g.add(h);
  const gold=new THREE.MeshStandardMaterial({color:0xffc83a,metalness:.9,roughness:.25,emissive:0x9a5a00,emissiveIntensity:.7});
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.05,28),gold);c.rotation.x=Math.PI/2;h.add(c);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.26,.03,8,28),gold);h.add(rim);
  const sy=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,6,20),new THREE.MeshBasicMaterial({color:0xfff0a0,toneMapped:false}));sy.position.z=.03;h.add(sy);
  const sy2=sy.clone();sy2.position.z=-.03;h.add(sy2);
  const gl=v3Sprite(R,R.tex.glow,new THREE.Color(0xffc84a));gl.scale.set(1.1,1.1,1);gl.material.opacity=.5;g.add(gl);
  g.scale.setScalar(s);
  g.userData.upd=(t)=>{h.rotation.y=t*2.6;h.position.y=Math.sin(t*2)*.05;gl.material.opacity=.4+.15*Math.sin(t*4);};
  return g;
}
function v3MiniTurret(R,s){
  const g=new THREE.Group(),h=new THREE.Group();g.add(h);
  const st=new THREE.MeshStandardMaterial({color:0x8b95b0,metalness:.7,roughness:.35}),dk=new THREE.MeshStandardMaterial({color:0x3a4256,metalness:.5,roughness:.5});
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.1,16),dk);b.position.y=-.14;h.add(b);
  const d=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),st);d.position.y=-.02;h.add(d);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,.36,10),dk);bar.rotation.z=Math.PI/2;bar.position.set(.22,0,0);h.add(bar);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),new THREE.MeshBasicMaterial({color:0xff4a4a,toneMapped:false}));eye.position.set(.1,.07,.12);h.add(eye);
  const gl=v3Sprite(R,R.tex.glow,new THREE.Color(0x9aa8cc));gl.scale.set(1.1,1.1,1);gl.material.opacity=.4;g.add(gl);
  g.scale.setScalar(s);
  g.userData.upd=(t)=>{h.rotation.y=t*1.1;h.position.y=Math.sin(t*2)*.04;};
  return g;
}
function v3Eye(R,s){
  const g=new THREE.Group(),h=new THREE.Group();g.add(h);
  const sh=new THREE.Mesh(new THREE.SphereGeometry(.26,22,16),_ad(0xb48cff,.28));h.add(sh);
  const web=new THREE.Mesh(new THREE.IcosahedronGeometry(.27,1),new THREE.MeshBasicMaterial({color:0xe0ccff,wireframe:true,transparent:true,opacity:.5,toneMapped:false}));h.add(web);
  const iris=new THREE.Mesh(new THREE.SphereGeometry(.1,14,10),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));h.add(iris);
  const pu=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshBasicMaterial({color:0x4a1f9a,toneMapped:false}));pu.position.z=.08;iris.add(pu);
  const gl=v3Sprite(R,R.tex.glow,new THREE.Color(0xb48cff));gl.scale.set(1.2,1.2,1);gl.material.opacity=.45;g.add(gl);
  g.scale.setScalar(s);
  g.userData.upd=(t)=>{web.rotation.y=t*.8;web.rotation.x=t*.4;h.position.y=Math.sin(t*2)*.05;iris.rotation.y=Math.sin(t*1.3)*.8;iris.rotation.x=Math.sin(t*.9)*.4;sh.material.opacity=.22+.1*Math.sin(t*3);};
  return g;
}
function v3RuneTex(R,kind){
  const key='rune'+kind;if(R.tex[key])return R.tex[key];
  return R.tex[key]=v3Tex((c,s)=>{
    c.clearRect(0,0,s,s);c.strokeStyle='#fff';c.fillStyle='#fff';c.lineCap='round';c.lineJoin='round';
    c.lineWidth=5;c.beginPath();c.arc(64,64,56,0,6.283);c.stroke();
    c.lineWidth=2;for(let k=0;k<12;k++){const a=k/12*6.283;c.beginPath();c.moveTo(64+Math.cos(a)*47,64+Math.sin(a)*47);c.lineTo(64+Math.cos(a)*53,64+Math.sin(a)*53);c.stroke();}
    c.lineWidth=10;c.beginPath();
    if(kind===0){c.moveTo(64,100);c.lineTo(64,28);c.moveTo(64,66);c.lineTo(38,36);c.moveTo(64,66);c.lineTo(90,36);}
    else{c.moveTo(46,100);c.lineTo(46,28);c.lineTo(84,52);c.lineTo(46,76);c.lineTo(86,100);}
    c.stroke();
  },128);
}
function v3Runes(R,s){
  const g=new THREE.Group(),tilt=new THREE.Group();tilt.rotation.x=.5;tilt.rotation.z=.25;g.add(tilt);
  const mk=(kind,col)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:v3RuneTex(R,kind),color:col,transparent:true,opacity:1,depthWrite:false,toneMapped:false}));m.scale.set(.46,.46,1);m.raycast=()=>{};tilt.add(m);return m;};
  const A=mk(0,0x22d97a),B=mk(1,0xa8ffd0);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.005,6,48),_ad(0x18c26a,.6));ring.rotation.x=Math.PI/2;tilt.add(ring);
  const gl=_sp(R,0x3fdc8a,.25,.9);g.add(gl);
  const trails=[];for(let k=0;k<6;k++){const w=_sp(R,k%2?0x9dffcb:0x3fdc8a,.5,.11-.014*(k>>1));tilt.add(w);trails.push(w);}
  g.scale.setScalar(s);
  g.userData.upd=(t)=>{
    const th=t*2.3,r=.27;
    for(const[m,off]of[[A,0],[B,Math.PI]]){m.position.set(Math.cos(th+off)*r,Math.sin(t*3+off)*.05,Math.sin(th+off)*r);m.material.rotation=Math.sin(t*1.7+off)*.35;}
    trails.forEach((w,k)=>{const off=k%2?Math.PI:0,d=(1+(k>>1))*.28;w.position.set(Math.cos(th+off-d)*r,Math.sin(t*3+off)*.05,Math.sin(th+off-d)*r);w.material.opacity=.6/(1+(k>>1));});
    tilt.rotation.y=t*.5;gl.material.opacity=.2+.07*Math.sin(t*3);
  };
  return g;
}
function v3RuneBurst(R,q){
  if(!FX.on)return;
  const r=v3Runes(R,1.5);r.position.set(q.x,1,q.z);R.fxRoot.add(r);const t0=performance.now();
  R.anims.push({upd:(dt)=>{const t=(performance.now()-t0)/1000,k=Math.min(1,t/1.5);r.userData.upd(t*2.6,dt);r.position.y=1+k*.6;r.scale.setScalar(1.5*(k<.15?k/.15:k>.7?1-(k-.7)/.3:1)+.001);if(k>=1){R.fxRoot.remove(r);return true;}}});
}

/* ===== Portraits (rendered once per unit type) ===== */
let PR=null;const PIMG={};
function portraitURL(t,c){
  c=c>1?0:c;const key=t+c;if(PIMG[key]!==undefined)return PIMG[key];
  if(typeof THREE==='undefined'||!MODEL[t])return '';
  const pdef=t==='XW'?{t:'X',wl:true,c}:{t,c};
  try{
    if(!PR){
      const cv=document.createElement('canvas');cv.width=cv.height=192;
      const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});
      r.setPixelRatio(1);r.setSize(192,192,false);r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=.9;r.setClearColor(0x000000,0);
      const sc=new THREE.Scene();sc.environment=new THREE.PMREMGenerator(r).fromScene(makeEnv()).texture;
      sc.add(new THREE.HemisphereLight(0xa9bcee,0x1a1822,.55));
      const k=new THREE.DirectionalLight(0xffe2bd,2.2);k.position.set(-4,6,7);sc.add(k);
      const rm=new THREE.DirectionalLight(0x7f9fff,1.2);rm.position.set(5,3,-5);sc.add(rm);
      PR={r,sc,cam:new THREE.PerspectiveCamera(24,1,.1,60),bake:{},cur:null};
    }
    if(PR.cur)PR.sc.remove(PR.cur);
    const body=v3Model(PR,pdef);body.rotation.y=.55;PR.sc.add(body);PR.cur=body;body.updateMatrixWorld(true);
    const bb=new THREE.Box3().setFromObject(body),ct=bb.getCenter(new THREE.Vector3()),sz=bb.getSize(new THREE.Vector3());
    const ext=Math.max(sz.y,sz.x,sz.z)*1.18,d=ext/2/Math.tan(PR.cam.fov*Math.PI/360);
    PR.cam.position.set(ct.x,ct.y+sz.y*.12,ct.z+d);PR.cam.lookAt(ct);
    PR.r.render(PR.sc,PR.cam);
    return PIMG[key]=PR.r.domElement.toDataURL('image/png');
  }catch(e){if(window.console)console.warn('portrait failed',e);return PIMG[key]='';}
}
function portraitImg(t,c){const u=portraitURL(t,c);return u?'<img class="pimg" alt="" src="'+u+'">':'<span class="pimg">'+(NAMES[t]||t)[0].toUpperCase()+'</span>';}

/* ===== Hover card ===== */
const PINFO={
  P:'First move: 1 or 2 tiles forward. After that, 1 tile forward. Captures 1 tile diagonally forward. Promotes on the far rank.',
  N:'Jumps in an L: 2 tiles one way and 1 tile sideways. Leaps over any unit.',
  B:'Slides up to 7 tiles diagonally.',
  R:'Slides up to 8 tiles forward, back or sideways.',
  Q:'Slides any distance straight or diagonally.',
  K:'Steps 1 tile in any direction. Lose it to checkmate and the game is over.',
  M:'Commander: leaps to any tile on the outer ring of its 5x5 box. The route through the inner 3x3 must be free of units.',
  Z:'Boss: stone colossus filling 2×2 tiles. Every attack on it sacrifices the attacking unit. The first side to sacrifice 5 units wins 200 gold and 2 free augments. It shifts one tile after each full round, is immune to fire and slips through walls and rocks.',
  ZV:'Vanguard: stone colossus filling 2×2 tiles. Attacking it hurls your piece away (random distance) and makes it stomp. First side to land 5 hits wins 3 free augments. It shifts one tile now and then.',
  ZD:'Dragon: 2×2, 7 hits per side to slay. Each hit makes it breathe fire on two random neighbouring tiles that burn for 10 turns and kill units. It flies to a new spot every 10-20 turns. The slayer gets a baby dragon.',
  ZK:'Kraken: 2×2 in the centre, 6 hits per side to slay. Every 10-20 turns it blasts a water jet that shoves units off the board or slams 2-4 nearby tiles. The slayer wins 1500 gold.',
  W:'Battering Ram: you cannot control it. After each owner turn it has a 50% chance to advance 1 tile, crushing enemies and smashing walls and rocks. Each crush costs it 1 HP. Attacking it deals 1 HP and does not move the attacker.',
  A:'Archer: steps 1 tile in a plus direction. Shoots any enemy up to 4 tiles away along a plus line and stays on its tile. Any unit, wall or rock in the way blocks the shot.',
  T:'Turret: never moves. After each owner turn it has a 25% chance to shoot an enemy in its 5×5 box (pawns first, never kings), then dismantles after 3 shots. Destroying it pays the enemy 200 gold.',
  XW:'Permanent wall block. Nothing can pass through or capture it.',
  H:'Summoned champion: moves anywhere in a 5×5 box. Never captures a king. Vanishes when its timer runs out.',
  X:'Immovable rock. Sliding pieces are blocked by it. Knights, marshals and cardinals jump over.'
};
function pieceBuffs(p,i){
  const L=[];const add=(c,n,d)=>L.push({c,n,d});
  if(G.bonus===i)add('r','Chain move','Moves again right away.');
  if(p.aura)add('y','Divine judgement','If captured, returns once on a random free square on its own half.');
  if(p.rez)add('y','Resurrect','If slain, rises again on this square 2 turns later.');
  if(p.rap)add('r','Wrath Blade','Bonus move after each capture. Its death pays the enemy 100 gold.');
  if(p.dk)add('y','Second king','You have two kings: no check while both live. Enemies may capture a king.');
  if(p.vc!=null&&p.vc!==p.c)add('r','Sundered','Changed sides. The ring shows its current owner.');
  if(p.ft)add('y','Fortified','Home tile: any enemy attacking this piece is destroyed instead.');
  if(p.t==='Z')add('r','Hits','White '+G.boss.hits[0]+'/'+G.boss.max+' · Black '+G.boss.hits[1]+'/'+G.boss.max);
  if(p.inv>0)add('b','Invisible',p.inv+' of its turns left. Cannot be captured, units pass through it and it gives no check. Attacking breaks it.');
  if(p.bty)add('y','Bounty','Whoever slays this piece collects 100 extra gold.');
  if(p.t==='T')add('r','Ammo',p.sh+' kill'+(p.sh===1?'':'s')+' left before it dismantles.');
  if(p.lk)add('b',"Queen’s Veil",'The first capture against it is blocked.');
  if((p.t==='M'||p.t==='C')&&G.ply<ENG.wake)add('b','Asleep','Wakes up after turn '+ENG.wake+' ('+(ENG.wake-G.ply)+' left).');
  if(p.fz)add('b','Frozen','Cannot move for a couple of turns.');
  if(p.zh)add('y',"Frozen Moment",'Cannot move or be captured for a short time.');
  if(p.t==='H')add('g','Timer',p.ttl+' of your turns left.');
  if(p.c<2){
    if(p.t==='P'&&has(p.c,'charged'))add('g','Charged Pawns','Can always move 1 or 2 tiles forward.');
    if(p.t==='P'&&has(p.c,'fury'))add('r','Reaper’s Cleave','Its captures also destroy a neighbouring enemy pawn.');
    if(p.t==='N'&&has(p.c,'cav'))add('g','Cavalry','After a capture it may move again (not to capture).');
    if((p.t==='R'||p.t==='B')&&has(p.c,'aghs'))add('g',"Sovereign’s Reach",'Can also step 1 tile in any direction.');
  }
  return L;
}
function v3Hover(cv,R){
  const card=$('hcard');if(!card)return;
  let tm=0,id=null;
  const hide=()=>{clearTimeout(tm);tm=0;card.hidden=true;};
  V3.hide=hide;
  const show=(i,x,y)=>{
    const p=G&&G.b[i];if(!p||p.id!==id)return;
    const bf=pieceBuffs(p,i),zk=p.t==='Z'?G.boss.kind||'V':null,nm=p.wl?'Castle wall':zk?BOSS_NAME[zk]:NAMES[p.t][0].toUpperCase()+NAMES[p.t].slice(1);
    card.innerHTML='<div class="hc-top"><div class="hc-img">'+portraitImg(p.wl?'XW':p.t,p.vc!=null?p.vc:p.c)+'</div><div class="hc-txt"><h4>'+nm+(p.c<2?'<small>'+SIDE[p.c]+'</small>':'')+'</h4><p><b>'+(p.t==='X'?'Info':'Move')+':</b> '+PINFO[p.wl?'XW':zk?'Z'+zk:p.t]+'</p></div></div>'
      +'<div class="hc-buffs"><h5>Active buffs</h5>'+(bf.length?'<ul>'+bf.map(b=>'<li class="'+b.c+'"><b>'+b.n+'</b> '+b.d+'</li>').join('')+'</ul>':'<div class="hc-none">None</div>')+'</div>';
    card.hidden=false;
    const w=$('boardwrap').getBoundingClientRect();
    let l=x-w.left+18,t=y-w.top+18;
    if(l+card.offsetWidth>w.width-6)l=Math.max(6,x-w.left-card.offsetWidth-18);
    if(t+card.offsetHeight>w.height-6)t=Math.max(6,w.height-card.offsetHeight-6);
    card.style.left=l+'px';card.style.top=t+'px';
  };
  const watch=(e,delay,i0)=>{
    const i=i0!=null?i0:v3Pick(R,e),p=i>=0&&G&&!G.over?G.b[i]:null,pid=p?p.id:null;
    if(pid===id&&(tm||!card.hidden))return;
    hide();id=pid;if(p){const x=e.clientX,y=e.clientY;tm=setTimeout(()=>{show(i,x,y);if(e.pointerType==='touch')R.noClick=true;},delay);}
  };
  cv.addEventListener('pointermove',e=>{if(e.buttons){hide();id=null;v3SetHover(R,-1);return;}if(e.pointerType==='touch')return;const i=v3Pick(R,e);v3SetHover(R,i);watch(e,500,i);});
  cv.addEventListener('pointerleave',()=>{hide();id=null;v3SetHover(R,-1);});
  cv.addEventListener('pointerdown',e=>{hide();id=null;if(e.pointerType==='touch')watch(e,550);});
  cv.addEventListener('wheel',()=>{hide();id=null;},{passive:true});
}

const FALL0=560;
function v3Shot(R,from,to){
  if(!FX.on)return;
  let o=null;for(const x of R.pcs.values())if(x.i===from&&(x.p.t==='T'||x.p.t==='A'))o=x;
  const A=new THREE.Vector3(sqX(from),1.0,sqZ(from)),B=new THREE.Vector3(sqX(to),.8,sqZ(to));
  if(o){const yaw=Math.atan2(B.x-A.x,B.z-A.z);const y0=o.body.rotation.y;let d=((yaw-y0+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;const t0=performance.now();
    R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/180);o.body.rotation.y=y0+d*k;if(k>=1)return true;}});}
  setTimeout(()=>{
    sfx('shot');v3Flash(R,'255,220,140',A,160,18);v3Emit(R,A,{n:8,col:'255,230,150',v0:2,v1:5,l0:.15,l1:.3,s0:.06,s1:.14,g:0});
    const L=A.distanceTo(B),m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,L,6),new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,opacity:1,toneMapped:false,depthWrite:false}));
    m.position.copy(A).add(B).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());m.raycast=()=>{};R.scene.add(m);
    const t0=performance.now();R.anims.push({upd:()=>{const k=Math.min(1,(performance.now()-t0)/260);m.material.opacity=1-k;m.scale.x=m.scale.z=1-k*.8;if(k>=1){R.scene.remove(m);return true;}}});
    setTimeout(()=>{v3Burst(R,B,'255,230,160',2.6,320);v3Ring(R,{x:B.x,z:B.z},{col:'255,210,120',r0:.2,r1:1.4,ms:420,a:1});v3Shake(R,.12,150);},140);
  },190);
}

/* ---- Dragon rig: baked parts, animated head / jaw / wings ---- */
function v3Dragon(R,scale){
  const bk=k=>{const key=k+'0';if(!R.bake[key])R.bake[key]=v3Bake(k,0);return R.bake[key];};
  const mesh=(k,par)=>{for(const{geo,mat}of bk(k)){const m=new THREE.Mesh(geo,mat);m.castShadow=true;par.add(m);}};
  const g=new THREE.Group(),body=new THREE.Group(),head=new THREE.Group(),jaw=new THREE.Group(),wl=new THREE.Group(),wr=new THREE.Group(),mouth=new THREE.Object3D();
  mesh('DRB',body);mesh('DRH',head);mesh('DRJ',jaw);mesh('DRW',wl);mesh('DRW',wr);
  head.rotation.order='YXZ';head.position.set(DR_NECK[0],DR_NECK[1],DR_NECK[2]);jaw.position.set(DR_JAW[0],DR_JAW[1],DR_JAW[2]);head.add(jaw);
  mouth.position.set(DR_MOUTH[0],DR_MOUTH[1],DR_MOUTH[2]);head.add(mouth);
  wr.position.set(DR_SHO[0],DR_SHO[1],DR_SHO[2]);wl.position.set(-DR_SHO[0],DR_SHO[1],DR_SHO[2]);wl.scale.x=-1;
  body.add(head,wl,wr);body.scale.setScalar(scale);g.add(body);
  return{g,body,head,jaw,wl,wr,mouth,hy:0,hp:0,jw:0,fly:false,ph:Math.random()*6.28,sc:scale,busy:false};
}
function v3DragonUpd(dr,now){
  const t=now*.001+dr.ph,fs=dr.fly?9:2.1,amp=dr.fly?.75:.14,a=Math.sin(t*fs)*amp+(dr.fly?.25:0);
  dr.wr.rotation.z=a;dr.wl.rotation.z=-a;dr.wr.rotation.y=-.12+Math.sin(t*fs+.8)*.06;dr.wl.rotation.y=.12-Math.sin(t*fs+.8)*.06;
  dr.head.rotation.set(dr.hp+Math.sin(t*1.3)*.035,dr.hy+Math.sin(t*.8)*.07,Math.sin(t*.7)*.02);
  dr.jaw.rotation.x=dr.jw+(dr.jw>.05?0:Math.sin(t*1.7)*.02);
  dr.body.position.y=Math.sin(t*1.6)*.05+(dr.fly?.1:0);
}
function v3DragonBreathe(R,dr,targets,delay,dur){
  if(!FX.on||!dr||!targets.length)return;
  dur=dur||1700;
  setTimeout(()=>{
    if(!R.scene||!dr.g.parent&&!dr.g.userData.keep)return;
    dr.g.updateMatrixWorld(true);
    const mid=new THREE.Vector3();for(const t of targets)mid.add(t);mid.multiplyScalar(1/targets.length);
    const lt=dr.g.worldToLocal(mid.clone()),hp=dr.head.position.clone().multiplyScalar(dr.sc);
    const dx=lt.x-hp.x,dz=lt.z-hp.z,dy=lt.y-hp.y;
    const yaw=Math.max(-1.25,Math.min(1.25,Math.atan2(dx,dz))),pitch=Math.max(-.2,Math.min(.95,Math.atan2(-dy,Math.hypot(dx,dz))));
    const t0=performance.now(),sm=k=>k*k*(3-2*k),cl=k=>Math.max(0,Math.min(1,k));
    const puffs=[];let last=t0,ti=0,flashed=false,hit=new Set();const mp=new THREE.Vector3();
    dr.busy=true;
    R.anims.push({upd:()=>{
      const now=performance.now(),el=now-t0,dt=now-last;last=now;
      const k1=sm(cl(el/380)),k2=sm(cl((el-260)/220)),k3=sm(cl((el-(dur-480))/320));
      dr.hy=yaw*k1*(1-k3);dr.hp=pitch*k1*(1-k3);dr.jw=.8*k2*(1-k3);
      if(el>480&&el<dur-480){
        dr.head.updateMatrixWorld(true);dr.mouth.getWorldPosition(mp);
        if(!flashed){flashed=true;sfx('boom');v3Flash(R,'255,150,50',mp,500,22);}
        const n=Math.max(1,Math.round(dt/11));
        for(let q=0;q<n;q++){
          const tg=targets[ti++%targets.length],s=v3Sprite(R,R.tex.glow,new THREE.Color(q%3===0?0xffd24a:q%3===1?0xff7a14:0xe8330c),true);
          s.material.toneMapped=false;s.position.copy(mp);R.scene.add(s);
          puffs.push({s,a:mp.clone(),b:new THREE.Vector3(tg.x+(Math.random()-.5)*.5,.35,tg.z+(Math.random()-.5)*.5),t:now,life:260+Math.random()*140,sz:.5+Math.random()*.5});
        }
        if(Math.random()<.5)v3Emit(R,{x:mp.x,y:mp.y,z:mp.z},{n:2,col:'255,170,60',v0:.5,v1:2,l0:.3,l1:.6,s0:.05,s1:.12,g:-1});
      }
      for(let i=puffs.length-1;i>=0;i--){
        const p=puffs[i],k=(now-p.t)/p.life;
        if(k>=1){R.scene.remove(p.s);p.s.material.dispose();puffs.splice(i,1);continue;}
        const e=k*k*.5+k*.5;p.s.position.set(p.a.x+(p.b.x-p.a.x)*e,p.a.y+(p.b.y-p.a.y)*e+Math.sin(k*Math.PI)*.12,p.a.z+(p.b.z-p.a.z)*e);
        const sz=(.25+k*p.sz*1.1);p.s.scale.set(sz,sz,1);p.s.material.opacity=Math.min(1,(1-k)*1.6)*.95;
      }
      if(el>720)for(const t of targets){const key=t.x+','+t.z;if(!hit.has(key)){hit.add(key);v3Burst(R,{x:t.x,y:.4,z:t.z},'255,160,50',3,520);v3Ring(R,{x:t.x,z:t.z},{col:'255,120,40',r0:.2,r1:1.7,ms:600,a:1});v3Emit(R,{x:t.x,y:.3,z:t.z},{n:24,col:'255,150,40',v0:1,v1:5,l0:.5,l1:1.1,g:-3,up:1.4});v3Shake(R,.25,400);}}
      if(el>=dur){for(const p of puffs){R.scene.remove(p.s);}dr.hy=dr.hp=dr.jw=0;dr.busy=false;return true;}
    }});
  },delay||0);
}
function v3Toss(R,mv,impact){
  const o=mv.o,g=o.grp,b=o.body,x0=g.position.x,z0=g.position.z,x1=sqX(mv.to),z1=sqZ(mv.to),dur=1.15,face0=o.faceY,base=o.bs||V3S,H=3.2+Math.hypot(x1-x0,z1-z0)*.35;
  impact.set(o.id,.3);o.i=mv.to;o.moving=true;
  const t0=performance.now()+260,sm=k=>k*k*(3-2*k);
  R.anims.push({upd:()=>{
    const el=performance.now()-t0;if(el<0)return;
    const k=Math.min(1,el/(dur*1000));
    g.position.set(x0+(x1-x0)*k,Math.sin(k*Math.PI)*H,z0+(z1-z0)*k);
    b.rotation.x=k*Math.PI*4;b.rotation.y=face0+k*Math.PI*2;
    if(k>=1){g.position.set(x1,0,z1);b.rotation.set(0,face0,0);o.moving=false;sfx('capture');v3Burst(R,{x:x1,y:.3,z:z1},'255,255,255',2.4,300);v3Ring(R,{x:x1,z:z1},{col:'255,230,190',r0:.2,r1:1.6,ms:450,a:.9});v3Shake(R,.18,200);return true;}
  }});
}
function v3FireTile(R,sq){
  const g=new THREE.Group(),items=[];
  const mk=(c,o)=>{const s=v3Sprite(R,R.tex.glow,new THREE.Color(c),false);s.material.toneMapped=false;s.material.opacity=o;g.add(s);return s;};
  const gl=mk(0xff5a10,.3);gl.scale.set(1.5,1.2,1);gl.position.set(sqX(sq),.25,sqZ(sq));
  for(let k=0;k<5;k++)items.push({s:mk(k%3===0?0xffc933:k%3===1?0xff7a14:0xe8330c,.9),x:sqX(sq)+(Math.random()-.5)*.7,z:sqZ(sq)+(Math.random()-.5)*.7,o:Math.random(),sp:.5+Math.random()*.7,j:Math.random()*6.28});
  g.userData.upd=(t)=>{gl.material.opacity=.26+.1*Math.sin(t*6+sq);for(const it of items){const p=(t*it.sp+it.o)%1,w=1-p,sz=.3+.34*w;it.s.position.set(it.x+Math.sin(t*3+it.j)*.1*p,.08+p*1.25,it.z);it.s.scale.set(sz*.8,sz*1.6,1);it.s.material.opacity=Math.min(1,w*1.8)*.95;}};
  return g;
}
function v3Missile(R,x,z,delay){
  if(!FX.on)return;
  const T=new THREE.Vector3(x,.3,z),S=new THREE.Vector3(x+4,15,z-3),d=T.clone().sub(S),len=d.length();d.normalize();
  const g=new THREE.Group(),steel=new THREE.MeshStandardMaterial({color:0x9aa3b5,metalness:.7,roughness:.35}),red=new THREE.MeshStandardMaterial({color:0xd8334a,metalness:.3,roughness:.5});
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.55,12),steel);g.add(body);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(.075,.2,12),red);nose.rotation.x=Math.PI;nose.position.y=-.375;g.add(nose);
  for(let k=0;k<4;k++){const f=new THREE.Mesh(new THREE.BoxGeometry(.02,.16,.12),red);const a=k*Math.PI/2;f.position.set(Math.cos(a)*.1,.22,Math.sin(a)*.1);f.rotation.y=-a;g.add(f);}
  const fl=v3Sprite(R,R.tex.glow,new THREE.Color(0xff9a3a));fl.scale.set(.9,.9,1);fl.position.y=.45;g.add(fl);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),d);g.visible=false;g.position.copy(S);R.fxRoot.add(g);
  const wm=new THREE.Mesh(new THREE.RingGeometry(.3,.4,32),new THREE.MeshBasicMaterial({color:0xff3347,transparent:true,opacity:.8,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));
  wm.rotation.x=-Math.PI/2;wm.position.set(x,.05,z);wm.raycast=()=>{};R.fxRoot.add(wm);
  sfx('whoosh',delay+60);sfx('mimpact',delay+FALL0);
  const t0=performance.now(),FALL=560;let hit=false;
  R.anims.push({upd:()=>{
    const el=performance.now()-t0-delay;
    wm.scale.setScalar(1+.15*Math.sin(performance.now()/60));
    if(el<0)return;
    const k=Math.min(1,el/FALL);g.visible=true;g.position.copy(S).addScaledVector(d,len*k*k);
    v3Emit(R,g.position.clone().addScaledVector(d,-.5),{n:1,col:'255,170,70',v0:0,v1:.3,l0:.25,l1:.45,s0:.2,s1:.36,g:0,up:0});
    if(k>=1&&!hit){hit=true;R.fxRoot.remove(g);R.fxRoot.remove(wm);
      const q={x,y:.4,z};
      v3Flash(R,'255,170,80',q,380,30);v3Ring(R,q,{col:'255,150,60',r0:.2,r1:2.1,ms:520,a:1});v3Burst(R,{x,y:.7,z},'255,210,140',3.2,380);
      v3Emit(R,q,{n:26,col:'255,150,50',v0:1.5,v1:6,l0:.35,l1:.9,g:-6});v3Emit(R,{x,y:.3,z},{n:8,col:'80,70,70',blend:false,v0:.4,v1:1.6,l0:.8,l1:1.5,s0:.4,s1:.8,g:1,up:1,grow:1.2});
      v3Rubble(R,q,5);v3Shake(R,.22,240);return true;}
  }});
}

/* ===== Kill streak flames ===== */
function v3BurnLvl(p){
  if(!G||p.c>1||G.burn[p.c]!==p.id)return 0;const n=G.streak[p.c];
  return n>=6?3:n>=4?2:n>=3?1:0;
}
const STREAK_NAMES=['','On fire','Blazing','Inferno','Wildfire'];
function v3Banner(txt,kind){
  const el=$('streakBanner');if(!el)return;
  el.textContent=txt;el.className='streak '+kind;void el.offsetWidth;el.classList.add('show');
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2300);
}
function v3StreakBanner(c,n,sq){
  const R=V3R;if(!R||!G)return;
  const nm=STREAK_NAMES[Math.min(4,n-2)],q={x:sqX(sq),y:.8,z:sqZ(sq)};
  v3Banner(SIDE[c]+' · '+nm+' ×'+n,n>=6?'blue':n>=4?'hot':'warm');sfx('ignite');if(n>=6)v3CamPunch(R,q,2.2,1200);
  v3Ring(R,q,{col:n>=6?'140,190,255':'255,140,40',r0:.3,r1:3.2,ms:800,a:1});v3Flash(R,n>=6?'150,200,255':'255,150,60',q,500,24);
  v3Emit(R,q,{n:30,col:n>=6?'150,200,255':'255,150,40',v0:1,v1:4,l0:.6,l1:1.2,g:3,up:1.3,lift:.4});
}
function v3Flame(R,lvl,H){
  const g=new THREE.Group(),n=10+lvl*8,blue=lvl>=3,items=[];
  const mk=(c,sc,o)=>{const s=v3Sprite(R,R.tex.glow,new THREE.Color(c),false);s.material.toneMapped=false;s.scale.set(sc,sc,1);s.material.opacity=o;g.add(s);return s;};
  const base=mk(blue?0x4f8cff:0xff6a10,1.3+lvl*.3,.3);base.position.y=.2;
  for(let k=0;k<n;k++){items.push({s:mk(blue?(k%3?0x8fc4ff:0xe8f4ff):(k%3===0?0xffc933:k%3===1?0xff7a14:0xe8330c),.3,.9),a:Math.random()*6.28,r:.12+Math.random()*.22,o:Math.random(),sp:.7+Math.random()*.8});}
  const hMax=H+.35+lvl*.25;
  g.userData.upd=(t)=>{
    base.material.opacity=.4+.12*Math.sin(t*9);
    for(const it of items){
      const p=(t*it.sp+it.o)%1,y=.1+p*hMax,w=1-p;
      it.s.position.set(Math.cos(it.a+t*2)*it.r*w,y,Math.sin(it.a+t*2)*it.r*w);
      const sz=(.26+.3*w)*(1+lvl*.12);it.s.scale.set(sz*.8,sz*1.5,1);it.s.material.opacity=Math.min(1,w*1.8)*.95;
    }
  };
  return g;
}

function v3FlameWall(R,lvl,c){
  const g=new THREE.Group(),blue=lvl>=3,z0=c===0?N/2+.4:-N/2-.4,dir=c===0?1:-1,items=[],n=34+lvl*16;
  const mk=(col,o)=>{const s=v3Sprite(R,R.tex.glow,new THREE.Color(col),false);s.material.toneMapped=false;s.material.opacity=o;g.add(s);return s;};
  const glows=[];for(let k=0;k<6;k++){const s=mk(blue?0x4f8cff:0xff6a10,.3);s.scale.set(3.2,1.6+lvl*.4,1);s.position.set(-(N-1)/2+k*(N-1)/5,.35,z0);glows.push(s);}
  for(let k=0;k<n;k++){
    items.push({s:mk(blue?(k%3?0x8fc4ff:0xe8f4ff):(k%3===0?0xffc933:k%3===1?0xff7a14:0xe8330c),.9),x:-(N/2+.3)+(N+.6)*(k+Math.random())/n,o:Math.random(),sp:.55+Math.random()*.8,j:Math.random()*6.28});
  }
  const hMax=.9+lvl*.55,t0=performance.now();
  g.userData.upd=(t)=>{
    const ign=Math.min(1,(performance.now()-t0)/700);
    glows.forEach((s,k)=>{s.material.opacity=(.24+.1*Math.sin(t*7+k))*ign;});
    for(const it of items){
      const p=(t*it.sp+it.o)%1,w=1-p,sway=Math.sin(t*3+it.j)*.12*p;
      it.s.position.set(it.x+sway,.08+p*hMax*ign,z0+dir*.05+Math.cos(t*2+it.j)*.1);
      const sz=(.32+.38*w)*(.7+.3*ign)*(1+lvl*.15);it.s.scale.set(sz*.8,sz*1.6,1);it.s.material.opacity=Math.min(1,w*1.8)*.95;
    }
  };
  return g;
}

/* ===== Check / mate FX, trail, themes ===== */
function v3Crack(R,q,size,ms){
  if(!FX.on)return;
  if(!R.tex.crack)R.tex.crack=v3Tex((c,s)=>{
    c.clearRect(0,0,s,s);c.lineCap='round';
    const br=(x,y,a,len,w,d)=>{
      if(len<9||d>4)return;const x2=x+Math.cos(a)*len+(Math.random()-.5)*8,y2=y+Math.sin(a)*len+(Math.random()-.5)*8;
      c.strokeStyle='rgba(255,70,50,.85)';c.lineWidth=w+3;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
      c.strokeStyle='#1a0505';c.lineWidth=Math.max(1,w*.55);c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
      br(x2,y2,a+.2+Math.random()*.5,len*.66,w*.72,d+1);if(Math.random()<.75)br(x2,y2,a-.25-Math.random()*.5,len*.6,w*.7,d+1);
    };
    for(let k=0;k<9;k++)br(s/2,s/2,k*.7+Math.random()*.4,s*.2,6,0);
  },256);
  const m=new THREE.MeshBasicMaterial({map:R.tex.crack,transparent:true,opacity:0,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-3});
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(size,size),m);pl.rotation.x=-Math.PI/2;pl.rotation.z=Math.random()*6.28;pl.position.set(q.x,.04,q.z);pl.raycast=()=>{};R.fxRoot.add(pl);
  const t0=performance.now();
  R.anims.push({upd:()=>{const t=Math.min(1,(performance.now()-t0)/ms);m.opacity=t<.08?t/.08:t<.55?1:1-(t-.55)/.45;pl.scale.setScalar(.6+.4*Math.min(1,t*6));if(t>=1){R.fxRoot.remove(pl);m.dispose();return true;}}});
}
function v3CheckFx(R,sq){
  const q={x:sqX(sq),y:.7,z:sqZ(sq)};
  v3Ring(R,q,{col:'255,60,80',r0:.3,r1:3.2,ms:800,a:1});setTimeout(()=>v3Ring(R,q,{col:'255,90,100',r0:.3,r1:4.5,ms:900,a:.8}),180);
  v3Flash(R,'255,50,70',q,500,26);v3Crack(R,q,3.8,2400);v3Shake(R,.14,240);v3CamPunch(R,q,1.3,1000);
  v3Banner('Check','check');sfx('check');
}
function v3Shatter(R,sq){
  if(!FX.on)return;const r0=rowOf(sq),c0=colOf(sq);
  R.tiles.forEach((t,i)=>{
    const d=Math.hypot(rowOf(i)-r0,colOf(i)-c0);if(d>3.2)return;
    const t0=performance.now()+d*70,amp=.5+Math.random()*.7,rx=(Math.random()-.5)*.9,rz=(Math.random()-.5)*.9,fy=-.09-Math.random()*.035,fx=(Math.random()-.5)*.08,fz=(Math.random()-.5)*.08;
    R.anims.push({upd:()=>{const k=(performance.now()-t0)/1100;if(k<0)return;const e=Math.min(1,k);
      t.position.y=-.09+(fy+.09)*e+Math.sin(Math.min(1,k)*Math.PI)*amp*(1-e*.4);t.rotation.x=rx*Math.sin(e*Math.PI)+fx*e;t.rotation.z=rz*Math.sin(e*Math.PI)+fz*e;
      if(k>=1){t.position.y=fy;t.rotation.x=fx;t.rotation.z=fz;return true;}}});
  });
  v3Rubble(R,{x:sqX(sq),y:0,z:sqZ(sq)},20,0x3a3640);
}
function v3Trail(R,first){
  const L=G.last;if(!L||L.f===L.t||first){if(first&&R.trail){R.scene.remove(R.trail);R.trail=null;}R.trailKey=L?L.f+'-'+L.t+'-'+G.ply:'';return;}
  const key=L.f+'-'+L.t+'-'+G.ply;if(key===R.trailKey)return;R.trailKey=key;
  if(R.trail){R.scene.remove(R.trail);R.trail.geometry.dispose();R.trail=null;}
  const p=G.b[L.t];if(!p)return;
  const a=new THREE.Vector3(sqX(L.f),.12,sqZ(L.f)),b=new THREE.Vector3(sqX(L.t),.12,sqZ(L.t)),d=a.distanceTo(b);
  const knight=p.t==='M'||(p.t==='N'&&Math.abs(sqX(L.t)-sqX(L.f))*Math.abs(sqZ(L.t)-sqZ(L.f))>1.9);
  const mid=a.clone().add(b).multiplyScalar(.5);mid.y=.15+Math.min(2,.35+d*.14)+(knight?.4:0);
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b),geo=new THREE.TubeGeometry(curve,30,.03,6,false);
  const mat=new THREE.MeshBasicMaterial({color:p.c===0?0xffe29a:0xff6a8a,transparent:true,opacity:.6,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(geo,mat);mesh.raycast=()=>{};R.scene.add(mesh);R.trail=mesh;
  const total=geo.index.count,t0=performance.now();geo.setDrawRange(0,0);
  R.anims.push({upd:()=>{if(R.trail!==mesh){return true;}const k=Math.min(1,(performance.now()-t0)/450);geo.setDrawRange(0,Math.floor(k*total/3)*3);if(k>=1)return true;}});
}
const V3THEMES={
  classic:{n:'Classic',L:0xb4c1d6,D:0x4d6a92,slab:0x0e1626,em:0x000000,emi:0,trim:0xe2b640,bg:0x090e18,rough:.55,met:.08,sc:1},
  obsidian:{n:'Obsidian',L:0x424a68,D:0x161a2b,slab:0x07080f,em:0x7a4dff,emi:.9,trim:0x9b7bff,bg:0x06050c,rough:.28,met:.35,sc:.95},
  marble:{n:'Marble',L:0xeee9e0,D:0x9b97a4,slab:0x1a1614,em:0x000000,emi:0,trim:0xd9b25a,bg:0x14110f,rough:.22,met:.04,sc:1},
  lava:{n:'Lava',L:0x4d2e26,D:0x1e100c,slab:0x3a0d04,em:0xff4a10,emi:1.3,trim:0xff7a2a,bg:0x0d0504,rough:.7,met:.05,sc:.93}
};
function v3Theme(R,name){
  const T=V3THEMES[name]||V3THEMES.classic,h=R.th;
  h.mL.color.set(T.L);h.mD.color.set(T.D);h.mL.roughness=h.mD.roughness=T.rough;h.mL.metalness=h.mD.metalness=T.met;
  h.slabM.color.set(T.slab);h.slabM.emissive.set(T.em);h.slabM.emissiveIntensity=T.emi;h.trimM.color.set(T.trim);
  R.scene.background.set(T.bg);R.scene.fog.color.set(T.bg);h.gnd.material.color.set(T.bg);
  R.tiles.forEach(t=>t.scale.set(T.sc,1,T.sc));
  if(R.envKey)v3EnvPalette(R);
  R.themeName=name;R.dirty=true;
}

/* ===== Gateways, fire ring, teleport ===== */
function v3Portal(R,sq,col){
  if(!R.tex.swirl)R.tex.swirl=v3Tex((c,s)=>{
    c.clearRect(0,0,s,s);const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,s,s);
    c.lineCap='round';for(let k=0;k<5;k++){c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=7;c.beginPath();for(let t=0;t<=1;t+=.04){const a=k*1.2566+t*4.2,r=8+t*s*.4;const x=s/2+Math.cos(a)*r,y=s/2+Math.sin(a)*r;if(t===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}
  },256);
  const g=new THREE.Group(),C=new THREE.Color(col);g.position.set(sqX(sq),.04,sqZ(sq));
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.46,40),new THREE.MeshBasicMaterial({map:R.tex.swirl,color:C,transparent:true,opacity:.95,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.raycast=()=>{};g.add(disc);
  const r1=new THREE.Mesh(new THREE.TorusGeometry(.46,.035,8,40),new THREE.MeshBasicMaterial({color:C,toneMapped:false,transparent:true,opacity:.95}));r1.rotation.x=Math.PI/2;r1.position.y=.03;r1.raycast=()=>{};g.add(r1);
  const r2=new THREE.Mesh(new THREE.TorusGeometry(.3,.02,8,40),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false,transparent:true,opacity:.7}));r2.rotation.x=Math.PI/2;r2.position.y=.05;r2.raycast=()=>{};g.add(r2);
  const gl=v3Sprite(R,R.tex.glow,C,false);gl.material.toneMapped=false;gl.material.opacity=.4;gl.scale.set(1.8,1.8,1);gl.position.y=.25;g.add(gl);
  const sp=[];for(let k=0;k<7;k++){const s=v3Sprite(R,R.tex.glow,C,false);s.material.toneMapped=false;s.scale.setScalar(.12);g.add(s);sp.push({s,o:k/7,a:k*2.1});}
  g.userData.upd=(t)=>{
    disc.rotation.z=t*1.6;r1.rotation.z=-t*.8;r2.rotation.z=t*2.2;r2.scale.setScalar(1+.12*Math.sin(t*3));gl.material.opacity=.32+.1*Math.sin(t*2.5);
    for(const q of sp){const p=(t*.6+q.o)%1;q.s.position.set(Math.cos(q.a+t*2)*.34*(1-p*.5),.05+p*.9,Math.sin(q.a+t*2)*.34*(1-p*.5));q.s.material.opacity=Math.sin(p*Math.PI)*.8;}
  };
  R.scene.add(g);return g;
}
function v3FireRing(R){
  const g=new THREE.Group(),items=[];
  const mk=(c,o)=>{const s=v3Sprite(R,R.tex.glow,new THREE.Color(c),false);s.material.toneMapped=false;s.material.opacity=o;g.add(s);return s;};
  for(let i=0;i<N*N;i++){
    if(!isEdgeSq(i))continue;
    const gl=mk(0xff5a10,.3);gl.scale.set(1.5,1.2,1);gl.position.set(sqX(i),.25,sqZ(i));items.push({gl,i,isg:true});
    for(let k=0;k<5;k++)items.push({s:mk(k%3===0?0xffc933:k%3===1?0xff7a14:0xe8330c,.9),x:sqX(i)+(Math.random()-.5)*.7,z:sqZ(i)+(Math.random()-.5)*.7,o:Math.random(),sp:.5+Math.random()*.7,j:Math.random()*6.28});
  }
  g.userData.upd=(t)=>{
    for(const it of items){
      if(it.isg){it.gl.material.opacity=.26+.1*Math.sin(t*6+it.i);continue;}
      const p=(t*it.sp+it.o)%1,w=1-p,sz=.3+.34*w;
      it.s.position.set(it.x+Math.sin(t*3+it.j)*.1*p,.08+p*1.25,it.z);it.s.scale.set(sz*.8,sz*1.6,1);it.s.material.opacity=Math.min(1,w*1.8)*.95;
    }
  };
  return g;
}
function v3Ignite(R){
  v3Banner('The edge is ablaze','hot');sfx('boom');sfx('ignite',150);v3Shake(R,.7,900);v3Flash(R,'255,120,40',{x:0,z:0},900,40);v3CamPunch(R,{x:0,z:0},-2,1400);
  for(let k=0;k<36;k++){const a=k/36*6.283,x=Math.cos(a)*4.5,z=Math.sin(a)*4.5;setTimeout(()=>{v3Emit(R,{x:Math.max(-4.5,Math.min(4.5,x*1.3)),y:.3,z:Math.max(-4.5,Math.min(4.5,z*1.3))},{n:8,col:'255,140,40',v0:1,v1:4,l0:.5,l1:1.1,g:-2,up:1.5});},k*18);}
  v3Ring(R,{x:0,z:0},{col:'255,130,40',r0:.5,r1:8,ms:1100,a:1,y:.06});
}
function v3Teleport(R,mv,pe,impact,killSq){
  const o=mv.o,g=o.grp,b=o.body,xa=sqX(pe.sq),za=sqZ(pe.sq),x0=g.position.x,z0=g.position.z,x1=sqX(mv.to),z1=sqZ(mv.to),dur=1.0;
  impact.set(o.id,dur*.6);o.i=mv.to;o.moving=true;sfx('portal',380);
  const t0=performance.now(),face=o.faceY,base=o.bs||V3S;let a1=false,a2=false;
  const sm=k=>k*k*(3-2*k);
  R.anims.push({upd:()=>{
    const k=Math.min(1,(performance.now()-t0)/(dur*1000));
    let px,pz,sc;
    if(k<.42){const e=sm(k/.42);px=x0+(xa-x0)*e;pz=z0+(za-z0)*e;sc=Math.max(.04,1-Math.pow(e,2.2));}
    else if(k<.58){px=x1;pz=z1;sc=.04;g.position.set(px,0,pz);}
    else{const e=sm((k-.58)/.42);px=x1;pz=z1;sc=.04+.96*e;}
    if(k>=.42&&!a1){a1=true;v3Ring(R,{x:xa,z:za},{col:'120,190,255',r0:.2,r1:1.6,ms:500,a:1});v3Burst(R,{x:xa,y:.5,z:za},'140,200,255',2.4,380);}
    if(k>=.58&&!a2){a2=true;v3Ring(R,{x:x1,z:z1},{col:'255,170,80',r0:.2,r1:1.8,ms:520,a:1});v3Burst(R,{x:x1,y:.6,z:z1},'255,190,110',2.8,420);v3Emit(R,{x:x1,y:.4,z:z1},{n:14,col:'255,180,90',v0:.8,v1:3,l0:.4,l1:.9,g:-1,up:1.3});if(killSq.has(mv.to))v3Shake(R,.15,160);}
    g.position.set(px,0,pz);b.rotation.y=face+k*12;b.scale.set(base*sc,base*sc,base*sc);
    if(k>=1){g.position.set(x1,0,z1);b.rotation.set(0,face,0);b.scale.setScalar(base);o.moving=false;return true;}
  }});
}
