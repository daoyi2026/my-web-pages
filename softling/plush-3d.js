import * as THREE from './vendor/three.module.js';
import { FUR_PROFILES } from './fur-profiles.js?v=11';

// Everything is built locally from the drawing: an inflated shell, individual
// curved fibers and surface facial details. Never append undrawn anatomy.
export class PlushStudio {
 constructor(canvas) {
  this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});
  this.renderer.setSize(900,900,false);this.renderer.setPixelRatio(1);
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(33,1,.1,30);this.camera.position.set(0,.25,7.3);this.camera.lookAt(0,0,0);
  this.scene.add(new THREE.HemisphereLight(0xfff8ed,0xb5a899,1.55));
  const key=new THREE.DirectionalLight(0xfff4e4,2.7);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2.5;key.shadow.camera.right=2.5;key.shadow.camera.top=2.5;key.shadow.camera.bottom=-2.5;key.shadow.normalBias=.025;key.shadow.bias=-.0003;this.scene.add(key);
  const rim=new THREE.DirectionalLight(0xffefd5,1.7);rim.position.set(3,2,-2);this.scene.add(rim);
  this.root=null;this.angle=-.28;this.dragging=false;
  canvas.style.touchAction='none';canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.lastX=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';});
  canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;this.angle=Math.max(-.85,Math.min(.85,this.angle+(e.clientX-this.lastX)*.008));this.lastX=e.clientX;this.draw();});
  const end=()=>{this.dragging=false;canvas.style.cursor='grab';};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
 }
 draw(){if(this.root)this.root.rotation.y=this.angle;this.renderer.render(this.scene,this.camera);}
 build(source,hex,mood,identity){
  if(this.root){this.scene.remove(this.root);this.root.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.bumpMap?.dispose();m.dispose();}}});}
  this.root=new THREE.Group();this.scene.add(this.root);
  let seed=identity.seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const N=180,mask=document.createElement('canvas');mask.width=mask.height=N;const ctx=mask.getContext('2d',{willReadFrequently:true});
  const all=source.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(...xs)-minX,h=Math.max(...ys)-minY;
  const scale=148/Math.max(w,h),ox=(N-w*scale)/2,oy=(N-h*scale)/2;
  // Union drawn paths first. Open strokes become padded seams, never artificial polygons.
  ctx.fillStyle=ctx.strokeStyle='white';ctx.lineWidth=5;ctx.lineCap=ctx.lineJoin='round';
  for(const stroke of source){
   const points=stroke.map(p=>[(p[0]-minX)*scale+ox,(p[1]-minY)*scale+oy]);
   ctx.beginPath();ctx.moveTo(...points[0]);
   for(let i=1;i<points.length-1;i++)ctx.quadraticCurveTo(...points[i],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);
   ctx.lineTo(...points.at(-1));
   if(Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<9){ctx.closePath();ctx.fill();}
   ctx.stroke();
  }
  const pixels=ctx.getImageData(0,0,N,N).data,dist=new Float32Array(N*N);
  // Flood from the outside: regions enclosed by several separate strokes also fill.
  const outside=new Uint8Array(N*N),queue=[0];outside[0]=1;
  for(let q=0;q<queue.length;q++){
   const i=queue[q],x=i%N,y=Math.floor(i/N);
   for(const j of [x>0?i-1:-1,x<N-1?i+1:-1,y>0?i-N:-1,y<N-1?i+N:-1])
    if(j>=0&&!outside[j]&&pixels[j*4+3]<128){outside[j]=1;queue.push(j);}
  }
  for(let i=0;i<dist.length;i++)dist[i]=outside[i]?0:1000;
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(dist[i])dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-N]+1,dist[i-N-1]+1.414,dist[i-N+1]+1.414);}
  for(let y=N-2;y>0;y--)for(let x=N-2;x>0;x--){const i=y*N+x;if(dist[i])dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+N]+1,dist[i+N+1]+1.414,dist[i+N-1]+1.414);}
  const d=(x,y)=>dist[Math.max(0,Math.min(N*N-1,Math.round(y)*N+Math.round(x)))];
  const thickness=.85;
  let height=new Float32Array(N*N);
  for(let i=0;i<height.length;i++)height[i]=thickness*Math.sqrt(1-Math.exp(-dist[i]/27));
  // Smooth the sampled field before meshing so the pile has no contour bands.
  for(let pass=0;pass<3;pass++){
   const blurred=new Float32Array(N*N);
   for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){
    let value=0,weight=0;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const k=(3-Math.abs(dx))*(3-Math.abs(dy));value+=height[(y+dy)*N+x+dx]*k;weight+=k;}
    blurred[y*N+x]=value/weight;
   }
   height=blurred;
  }
  const z=(x,y)=>{
   x=Math.max(0,Math.min(N-2,x));y=Math.max(0,Math.min(N-2,y));const ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy,i=iy*N+ix;
   return height[i]*(1-tx)*(1-ty)+height[i+1]*tx*(1-ty)+height[i+N]*(1-tx)*ty+height[i+N+1]*tx*ty;
  };
  const unit=2.75/148,world=(x,y)=>new THREE.Vector3((x-N/2)*unit,(N/2-y)*unit,z(x,y));
  const normal=(x,y)=>new THREE.Vector3(-(z(x+1,y)-z(x-1,y))/(2*unit),(z(x,y+1)-z(x,y-1))/(2*unit),1).normalize();
  let face={x:N/2,y:N/2,width:0,score:0};
  // The largest interior circle keeps the whole face on the actual head/body surface.
  for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
   const score=d(x,y)*(1-.18*(y-oy)/Math.max(1,h*scale));
   if(score>face.score)face={x,y,width:d(x,y)*2,score};
  }
  const fx=(face.x-N/2)*unit,fy=(N/2-face.y)*unit,bodyWidth=face.width*unit;
  const bottom=(N/2-(oy+h*scale))*unit,top=(N/2-oy)*unit;
  const bodyColor=new THREE.Color(hex),cream=new THREE.Color('#fff0dc');
  const dark=new THREE.Color('#352721');
  const profile=FUR_PROFILES[identity.fur];
  const material=(c,roughness=.92)=>new THREE.MeshStandardMaterial({color:c,roughness,metalness:0});
  const mesh=(geo,mat,parent=this.root)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const furPositions=[],furColors=[];
  const light=new THREE.Vector3(-.5,.8,1).normalize();
  const faceScale=Math.min(1,bodyWidth/1.65);
  const faceY=fy+.03*faceScale;
  const frontAt=(wx,wy)=>z(wx/unit+N/2,N/2-wy/unit);
  const eyeGap=(.24+identity.eyeGap*.06)*faceScale;
  const faceDistance=p=>Math.sqrt(((p.x-fx)/(.57*faceScale))**2+((p.y-faceY+.08*faceScale)/(.40*faceScale))**2);
  const colorAt=()=>bodyColor.clone();
  // Woven cotton is a whole-body material, never a patch on another style.
  const cotton=(color,checks=false)=>{
   const tile=document.createElement('canvas');tile.width=tile.height=512;const tc=tile.getContext('2d');
   tc.fillStyle=checks?'#fff7e6':color.getStyle();tc.fillRect(0,0,512,512);
   if(checks){tc.fillStyle=color.clone().multiplyScalar(.82).getStyle();tc.globalAlpha=.52;tc.fillRect(0,0,256,512);tc.fillRect(0,0,512,256);tc.globalAlpha=1;}
   for(let i=0;i<512;i+=3){tc.strokeStyle=i%2?'#ffffff20':'#594b3d12';tc.lineWidth=1;tc.beginPath();tc.moveTo(i,0);tc.lineTo(i,512);tc.moveTo(0,i);tc.lineTo(512,i);tc.stroke();}
   const texture=new THREE.CanvasTexture(tile);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
   const relief=texture.clone();relief.colorSpace=THREE.NoColorSpace;
   return new THREE.MeshStandardMaterial({color:0xffffff,map:texture,bumpMap:relief,bumpScale:.004,roughness:1,side:THREE.DoubleSide});
  };
  const accessoryX=Math.round(face.x+identity.accessorySide*Math.min(face.width*.22,16));let accessoryY=face.y;
  for(let y=1;y<face.y;y++)if(d(accessoryX,y)>4){accessoryY=y;break;}
  const accessoryAnchor=world(accessoryX,accessoryY);
  const trim=p=>{
   if(p.z<0)return 1;
   const closePile=Math.min(.3,.013/profile.length);
   const facial=closePile+(1-closePile)*THREE.MathUtils.smoothstep(faceDistance(p),.85,1.4);
   return facial;
  };
  function hair(p,n,c,length,phase,spread=1){
   const t1=new THREE.Vector3(0,-1,0).addScaledVector(n,n.y);
   if(t1.lengthSq()<.001)t1.set(1,0,0);t1.normalize();
   const t2=new THREE.Vector3().crossVectors(n,t1).normalize();
   const prev=p.clone(),steps=profile.segments;
   const shade=(.42+.43*Math.max(0,n.dot(light))+.14*Math.max(0,n.z))*(.86+rand()*.23);
   const frizz=rand()*6.28;
   for(let j=1;j<=steps;j++){
    const t=j/steps;let rise=length*t,along=0,across=0;
    switch(profile.id){
     case 'short':rise*=.65;along=length*t*t*.65;across=Math.sin(t*3+phase)*length*.1*t;break;
     case 'fluffy':rise=length*(t-.22*t*t);along=Math.sin(phase)*length*t*.7;across=Math.cos(phase)*length*t*.7+Math.sin(t*6+frizz)*length*.09*t;break;
     case 'shaggy':rise=length*(t-.75*t*t);along=length*t*t*1.05;across=Math.sin(phase)*length*t*.20+Math.sin(t*7+phase)*length*.06*t;break;
     case 'curly':{
      const radius=length*.28*t;rise=length*t*.60;
      along=Math.sin(t*Math.PI*4+phase)*radius;across=Math.cos(t*Math.PI*4+phase)*radius;break;
     }
    }
    const next=p.clone().addScaledVector(n,rise).addScaledVector(t1,along).addScaledVector(t2,across*spread);
    // Long locks may start above the face; trim their path as well as their roots.
    if(next.z>0 && profile.length>.1 && faceDistance(next)<.93)break;
    furPositions.push(prev.x,prev.y,prev.z,next.x,next.y,next.z);
    const col=c.clone().multiplyScalar(shade*(.70+t*.47));
    furColors.push(col.r,col.g,col.b,col.r,col.g,col.b);prev.copy(next);
   }
  }
  // Front and back shells share the user's silhouette; the depth field fills it like a cushion.
  const positions=[],indices=[];
  for(let side=0;side<2;side++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p=world(x,y);positions.push(p.x,p.y,(side?-1:1)*p.z);}
  for(let side=0;side<2;side++)for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
   if(!d(x,y)||!d(x+1,y)||!d(x,y+1)||!d(x+1,y+1))continue;
   const a=side*N*N+y*N+x,b=a+1,c=a+N,e=c+1;
   if(!side)indices.push(a,c,b,b,c,e);else indices.push(a,b,c,b,e,c);
  }
  const boundary=new Map();
  const frontIndices=indices.filter(i=>i<N*N);
  for(let i=0;i<frontIndices.length;i+=3)for(let j=0;j<3;j++){
   const a=frontIndices[i+j],b=frontIndices[i+(j+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);
   if(boundary.has(key))boundary.delete(key);else boundary.set(key,[a,b]);
  }
  for(const [a,b] of boundary.values())indices.push(a,a+N*N,b,b,a+N*N,b+N*N);
  // Relax the grid stair steps and the front/back seam without changing topology.
  const neighbors=new Map();
  for(let i=0;i<indices.length;i+=3)for(let j=0;j<3;j++){
   const a=indices[i+j],b=indices[i+(j+1)%3];
   if(!neighbors.has(a))neighbors.set(a,new Set());if(!neighbors.has(b))neighbors.set(b,new Set());
   neighbors.get(a).add(b);neighbors.get(b).add(a);
  }
  for(let pass=0;pass<3;pass++){
   const next=positions.slice();
   for(const [i,near] of neighbors)for(let axis=0;axis<3;axis++){
    let sum=0;for(const j of near)sum+=positions[j*3+axis];
    next[i*3+axis]=positions[i*3+axis]*.5+sum/near.size*.5;
   }
   for(let i=0;i<positions.length;i++)positions[i]=next[i];
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const skinColors=[];for(let i=0;i<positions.length;i+=3){const c=colorAt(new THREE.Vector3(positions[i],positions[i+1],positions[i+2]));skinColors.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(skinColors,3));
  const skinMaterial=profile.id==='gingham'?cotton(bodyColor,true):material(0xffffff);
  if(profile.id==='gingham'){
   const uv=[];for(let side=0;side<2;side++)for(let y=0;y<N;y++)for(let x=0;x<N;x++)uv.push((x-ox)/148*5,(y-oy)/148*5);
   geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  }else skinMaterial.vertexColors=true;mesh(geo,skinMaterial);
  // Each pile is constructed differently, rather than just recoloring the same fibers.
  const pileSites=[];
  for(let i=0;i<profile.count;i++){
   const x=ox+rand()*w*scale,y=oy+rand()*h*scale;if(d(x,y)<1)continue;
   const p=world(x,y),n=normal(x,y);if(i%5===0){p.z*=-1;n.z*=-1;}
   const clipped=trim(p),length=profile.length*(.55+rand()*.65)*clipped;
   // Neighboring long strands share a flowing lock direction.
   const phase=profile.id==='shaggy'?Math.sin(Math.floor(x/5)*37+Math.floor(y/5)*13)*3.14:rand()*6.28;
   hair(p,n,colorAt(p),length,phase);
   if(profile.id==='curly'&&i%3===0&&clipped>.3)pileSites.push({p,n,clipped});
  }
  if(pileSites.length){
   const tuftGeo=new THREE.TorusGeometry(1,.22,5,13,Math.PI*1.85);
   const tufts=new THREE.InstancedMesh(tuftGeo,material(0xffffff),pileSites.length);
   const transform=new THREE.Object3D(),axis=new THREE.Vector3(0,0,1);
   for(let i=0;i<pileSites.length;i++){
    const {p,n,clipped}=pileSites[i],r=.049*(.7+rand()*.9)*clipped;
    transform.position.copy(p).addScaledVector(n,r);transform.quaternion.setFromUnitVectors(axis,n);transform.rotateZ(rand()*6.28);
    transform.scale.set(r,r*(.8+rand()*.4),r);transform.updateMatrix();tufts.setMatrixAt(i,transform.matrix);
    tufts.setColorAt(i,colorAt(p).multiplyScalar(.83+rand()*.25));
   }
   tufts.castShadow=true;tufts.receiveShadow=true;this.root.add(tufts);
  }
  // Flat embroidery: ink-like eyes and mouth on a surface-following transparent decal.
  const S=faceScale,ink=document.createElement('canvas');ink.width=ink.height=512;
  const pen=ink.getContext('2d');pen.strokeStyle=pen.fillStyle='#292b27';pen.lineWidth=15;pen.lineCap='round';pen.lineJoin='round';
  const expression=identity.face;
  for(const side of [-1,1]){
   const x=256+side*105,y=215;
   if(expression===1||(expression===2&&side===1)||expression===4){pen.beginPath();pen.moveTo(x-20,y+3);pen.quadraticCurveTo(x,y+(expression===4?-25:20),x+20,y+3);pen.stroke();}
   else{pen.beginPath();pen.arc(x,y,17,0,Math.PI*2);pen.fill();}
  }
  pen.beginPath();
  if(expression===3)pen.ellipse(256,305,18,23,0,0,Math.PI*2);
  else if(expression===5){pen.moveTo(220,320);pen.quadraticCurveTo(256,280,292,320);}
  else if(expression===7){pen.moveTo(235,308);pen.lineTo(277,308);}
  else{pen.moveTo(214,285);pen.bezierCurveTo(220,342,291,342,298,285);}
  pen.stroke();
  const faceTexture=new THREE.CanvasTexture(ink);faceTexture.colorSpace=THREE.SRGBColorSpace;
  const faceGeometry=new THREE.PlaneGeometry(1.2*S,1.0*S,32,32),fp=faceGeometry.attributes.position;
  for(let i=0;i<fp.count;i++){const x=fx+fp.getX(i),y=faceY+fp.getY(i);fp.setXYZ(i,x,y,frontAt(x,y)+.021);}
  faceGeometry.computeVertexNormals();
  const decal=new THREE.Mesh(faceGeometry,new THREE.MeshBasicMaterial({map:faceTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));decal.renderOrder=3;this.root.add(decal);
  // Accessories are explicitly requested; they do not generate new body anatomy.
  const accent=new THREE.Color(['#b78479','#8d9e7d','#b3a3bb'][identity.accent]);
  const accessory=new THREE.Group();accessory.name='accessory';this.root.add(accessory);
  if(identity.decoration===0){
   const px=accessoryAnchor.x,py=accessoryAnchor.y-.20*S;
   const button=mesh(new THREE.CylinderGeometry(.12*S,.12*S,.025*S,28),material(accent),accessory);
   button.rotation.x=Math.PI/2;button.position.set(px,py,frontAt(px,py)+.075);
   for(const dx of [-1,1])for(const dy of [-1,1]){const hole=mesh(new THREE.CircleGeometry(.014*S,12),material(dark),accessory);hole.position.set(px+dx*.035*S,py+dy*.035*S,button.position.z+.014*S);}
  }else{
   const size=Math.max(.65,S);
   // Keep decorations outside a conservative bound of both shell and maximum pile.
   const frontClearance=thickness+profile.length*1.2+.13;
   accessory.position.set(accessoryAnchor.x,accessoryAnchor.y+.045,frontClearance);
   if(identity.decoration===2)accessory.position.set(accessoryAnchor.x,top+profile.length*1.2+.23,0);

   if(identity.decoration===1){
    const ribbon=cotton(accent);ribbon.map.repeat.set(2,2);ribbon.bumpMap.repeat.set(2,2);
    for(const sign of [-1,1]){
     // Pinched ribbon loops with broad fabric wings and folds toward the knot.
     const wingGeo=new THREE.PlaneGeometry(1,1,32,20),vertices=wingGeo.attributes.position;
     for(let i=0;i<vertices.count;i++){
      const u=vertices.getX(i)+.5,v=vertices.getY(i)*2;
      const width=.055+.22*Math.sin(u*Math.PI*.70);
      vertices.setXYZ(i,sign*(.025+u*.43)*size,v*width*size,(.035+.11*Math.sin(u*Math.PI)+.028*Math.cos(v*Math.PI*3)*(1-u))*size);
     }
     wingGeo.computeVertexNormals();mesh(wingGeo,ribbon,accessory);
     const tailGeo=new THREE.PlaneGeometry(1,1,16,16),tp=tailGeo.attributes.position;
     for(let i=0;i<tp.count;i++){const u=tp.getX(i),v=tp.getY(i)+.5;tp.setXYZ(i,(sign*(.07+.14*v)+u*.15)*size,(-.035-v*.35+Math.abs(u)*.1*v)*size,(.02+.04*Math.sin(v*5))*size);}
     tailGeo.computeVertexNormals();mesh(tailGeo,ribbon,accessory);
    }
    const knot=mesh(new THREE.SphereGeometry(1,24,16),ribbon,accessory);knot.scale.set(.07*size,.115*size,.085*size);knot.position.z=.06*size;
    accessory.rotation.z=identity.accessorySide*-.25;
   }else if(identity.decoration===3){
    // A visible enamel barrette with a small woven flower.
    const bar=mesh(new THREE.CapsuleGeometry(.045*size,.44*size,6,20),material(new THREE.Color('#d9ad72'),.48),accessory);bar.rotation.z=Math.PI/2;
    const felt=cotton(accent);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const petal=mesh(new THREE.SphereGeometry(1,18,12),felt,accessory);petal.scale.set(.085*size,.13*size,.035*size);petal.position.set(Math.sin(a)*.105*size,Math.cos(a)*.105*size,.07);petal.rotation.z=-a;}
    const center=mesh(new THREE.SphereGeometry(.065*size,18,12),material(new THREE.Color('#f0d69b')),accessory);center.position.z=.11;center.scale.z=.45;
    accessory.rotation.z=identity.accessorySide*-.30;
   }else{
    const hatStyle=identity.hatStyle??0,hatFabric=cotton(accent);
    if(hatStyle===0){
     const beret=mesh(new THREE.SphereGeometry(1,28,18),hatFabric,accessory);beret.scale.set(.30*size,.115*size,.23*size);beret.position.y=.06*size;beret.rotation.z=.15;
     const stem=mesh(new THREE.CapsuleGeometry(.025*size,.065*size,5,10),hatFabric,accessory);stem.position.set(.025*size,.19*size,0);stem.rotation.z=-.2;
    }else if(hatStyle===1){
     const brim=mesh(new THREE.CylinderGeometry(.23*size,.34*size,.065*size,32,1,true),hatFabric,accessory);
     const crown=mesh(new THREE.CylinderGeometry(.19*size,.23*size,.23*size,32),hatFabric,accessory);crown.position.y=.14*size;
     const band=mesh(new THREE.CylinderGeometry(.222*size,.235*size,.045*size,32),cotton(cream),accessory);band.position.y=.045*size;
    }else{
     const brim=mesh(new THREE.SphereGeometry(1,28,14),hatFabric,accessory);brim.scale.set(.29*size,.035*size,.21*size);
     const cone=mesh(new THREE.ConeGeometry(.20*size,.41*size,32),hatFabric,accessory);cone.position.y=.20*size;cone.rotation.z=.12;
     const pom=mesh(new THREE.SphereGeometry(.065*size,18,12),cotton(cream),accessory);pom.position.set(-.045*size,.41*size,0);
    }
    accessory.rotation.z=identity.accessorySide*-.18;
   }
  }
  // A tiny separate companion object, placed beyond the drawn body and its pile.
  const props=new THREE.Group();this.root.add(props);props.name='surroundings';
  const propSide=identity.accessorySide===1?-1:1;
  const bodyHalf=w*scale*unit/2;
  const propX=propSide*(bodyHalf+profile.length*.65+.40);
  const ground=bottom-.12;
  const fabric=cotton(new THREE.Color(['#b7c0a4','#d1b4a9','#acbdc7'][identity.accent]));
  const rounded=(x,y,z,sx,sy,sz,mat=fabric)=>{
   const part=mesh(new THREE.BoxGeometry(1,1,1,4,4,4),mat,props);
   // Rounded box by projecting the outer grid onto a sphere around the inner box.
   const pos=part.geometry.attributes.position,r=.12;
   for(let i=0;i<pos.count;i++){
    const p=new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i));const inner=p.clone().clampScalar(-.5+r,.5-r);p.sub(inner).normalize().multiplyScalar(r).add(inner);pos.setXYZ(i,p.x,p.y,p.z);
   }
   part.geometry.computeVertexNormals();part.scale.set(sx,sy,sz);part.position.set(x,y,z);return part;
  };
  const propKind=identity.prop??0;
  if(propKind===0){
   const caneStyle=identity.caneStyle??0,caneColor=new THREE.Color(['#c99999','#b3a1c6','#94b4a2'][caneStyle]);
   const cane=new THREE.Group();props.add(cane);cane.position.set(propX,ground,0);cane.rotation.z=-propSide*.12;
   const stickMaterial=material(caneColor,.75);
   const stick=mesh(new THREE.CapsuleGeometry(.026,.65,6,16),stickMaterial,cane);stick.position.y=.35;
   const foot=mesh(new THREE.SphereGeometry(.038,16,10),material(cream),cane);foot.scale.y=.65;foot.position.y=.015;
   if(caneStyle===0){
    const points=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI;points.push(new THREE.Vector3(-.10+.10*Math.cos(a),.70+.10*Math.sin(a),0));}
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.027,10,false),stickMaterial,cane);
    for(let i=0;i<5;i++){const ring=mesh(new THREE.CylinderGeometry(.027,.027,.025,16),material(cream),cane);ring.position.y=.12+i*.10;}
   }else if(caneStyle===1){
    const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.075:.15;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y);}star.closePath();
    const topper=mesh(new THREE.ExtrudeGeometry(star,{depth:.035,bevelEnabled:true,bevelThickness:.01,bevelSize:.012,bevelSegments:3,steps:1}),material(new THREE.Color('#e5c88e')),cane);topper.position.set(0,.77,-.02);
   }else{
    for(let i=0;i<5;i++){const a=i*2*Math.PI/5,petal=mesh(new THREE.SphereGeometry(1,16,12),cotton(new THREE.Color('#e3b6b4')),cane);petal.scale.set(.06,.085,.027);petal.position.set(Math.sin(a)*.08,.77+Math.cos(a)*.08,0);petal.rotation.z=-a;}
    const center=mesh(new THREE.SphereGeometry(.052,16,12),material(new THREE.Color('#edd6a1')),cane);center.position.set(0,.77,.028);center.scale.z=.5;
   }
  }else if(propKind===1){
   const pillow=rounded(propX,ground+.15,0,.53,.28,.40);pillow.rotation.z=propSide*.12;
   const topPillow=rounded(propX+.03,ground+.37,0,.45,.23,.35,cotton(cream));topPillow.rotation.y=.3;
  }else{
   const pot=mesh(new THREE.CylinderGeometry(.17,.13,.25,28),material(new THREE.Color('#cfad92')),props);pot.position.set(propX,ground+.125,0);
   const soil=mesh(new THREE.CircleGeometry(.15,24),material(new THREE.Color('#89705a')),props);soil.rotation.x=-Math.PI/2;soil.position.set(propX,ground+.255,0);
   for(let i=0;i<5;i++){const a=i*2.4,leaf=mesh(new THREE.SphereGeometry(1,18,12),material(new THREE.Color(i%2?'#91a07b':'#b0bd98')),props);leaf.scale.set(.075,.19,.035);leaf.position.set(propX+Math.sin(a)*.10,ground+.35+(i%2)*.07,Math.cos(a)*.07);leaf.rotation.z=-Math.sin(a)*.7;}
  }
  // Accessories and surrounding objects must never cast shadows onto the companion.
  for(const group of [accessory,props])group.traverse(object=>{object.castShadow=false;});
  this.renderer.domElement.dataset.prop=['cane','cushions','plant'][propKind];
  // Fit toy, floating hat and side object together without cropping the export.
  const sceneWidth=bodyHalf*2+profile.length*1.3+1.1;
  const sceneHeight=top-bottom+2*(profile.length*1.2+.60);
  this.camera.position.set(0,.25,Math.max(7.3,Math.max(sceneWidth,sceneHeight)/(2*Math.tan(THREE.MathUtils.degToRad(16.5)))+1.2));
  this.camera.lookAt(0,.10,0);
  const furGeo=new THREE.BufferGeometry();furGeo.setAttribute('position',new THREE.Float32BufferAttribute(furPositions,3));furGeo.setAttribute('color',new THREE.Float32BufferAttribute(furColors,3));
  const fibers=new THREE.LineSegments(furGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.90,depthWrite:true}));this.root.add(fibers);
  this.root.position.y=-(top+bottom)/2;
  this.renderer.domElement.dataset.identity=String(identity.seed);this.renderer.domElement.dataset.personality=identity.label;
  this.renderer.domElement.dataset.material=profile.id;
  this.renderer.domElement.dataset.appendedAnatomy='0';
  this.renderer.domElement.dataset.color=hex;
  this.renderer.domElement.dataset.decoration=['button','bow','hat','barrette'][identity.decoration];
  this.renderer.domElement.dataset.expression=String(identity.face);
  this.draw();
 }
}
