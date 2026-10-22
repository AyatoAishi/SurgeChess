/* ===== Shared helpers ===== */
const $=id=>document.getElementById(id);
const FX={on:!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)};
const ORB_COL={y:'255,207,51',r:'255,84,104',g:'63,220,138',b:'255,200,60',t:'154,168,204',i:'180,140,255',m:'255,200,60'};
function fxReset(){}function fxClear(){}
function makeEnv(){
  const s=new THREE.Scene(),g=new THREE.SphereGeometry(20,24,14),pos=g.attributes.position,col=[];
  for(let i=0;i<pos.count;i++){const t=(pos.getY(i)/20+1)/2,c=new THREE.Color().setHSL(.62,.35,.05+.3*t);col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  s.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const panel=(x,y,z,w,h,v)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(v,v,v),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m);};
  panel(-9,11,9,9,6,4);panel(10,5,-7,6,10,2.5);panel(0,14,0,10,10,1.2);panel(8,3,9,4,8,.8);
  return s;
}
