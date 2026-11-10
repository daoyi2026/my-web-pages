import { PlushStudio } from './plush-3d.js?v=11';
import { FUR_PROFILES,createIdentity } from './fur-profiles.js?v=11';
const canvas=document.querySelector('#source'),studio=new PlushStudio(canvas);
studio.angle=-.12;
// One outline without arms or feet. Nothing outside this silhouette is invented.
const shape=[[[220,520],[145,485],[110,410],[115,320],[145,265],[135,190],[155,145],[190,145],[225,210],[280,205],[325,145],[365,135],[395,175],[380,250],[425,300],[445,390],[420,470],[360,520],[280,535],[220,520]]];
if(!new URLSearchParams(location.search).has('accessories')){
for(const profile of FUR_PROFILES){
 const card=document.createElement('article');card.dataset.material=profile.id;
 card.innerHTML=`<div class="placeholder">正在织绒毛…</div><h2>${profile.name}</h2><p>${profile.description}</p>`;document.querySelector('#samples').append(card);
}
for(let i=0;i<FUR_PROFILES.length;i++){
 await new Promise(resolve=>requestAnimationFrame(resolve));
 const identity=createIdentity(i,new Uint32Array([413,0,7,0,1000000000,2,4,9]));
 studio.build(shape,'#cfb496','sweet',identity);
 const img=new Image();img.alt=FUR_PROFILES[i].name+'，相同轮廓和颜色的材质比较';img.src=canvas.toDataURL('image/png');
 document.querySelectorAll('article')[i].querySelector('.placeholder').replaceWith(img);
 document.querySelector('#progress').textContent=`已织好 ${i+1} / 5 种风格`;
}
document.querySelector('#progress').textContent='四种样本来自同一个本地渲染器 · 身体轮廓不添加任何手脚或耳朵';

for(let i=0;i<4;i++){
 await new Promise(resolve=>requestAnimationFrame(resolve));
 const identity=createIdentity(i===1?1:i===2?2:4,new Uint32Array([413,0,(i%3)*8,0,1000000000,i,i%3,9]));studio.angle=i===2?.6:-.12;
 studio.build(shape,'#d5d8c3','sweet',identity);
 const card=document.createElement('article'),img=new Image();img.src=canvas.toDataURL();img.alt=['整只格子布 · 扣子','蓬松毛 · 前置蝴蝶结','长毛 · 悬浮帽子侧面','整只格子布 · 小花发卡'][i];card.append(img,document.createTextNode(img.alt));document.querySelector('#samples').append(card);
}
document.querySelector('#progress').textContent='五种风格与四种装饰已完成';

}
else{document.querySelector('h1').textContent='小帽子与小手杖';document.querySelector('header p').textContent='三款帽子与三款手杖，生成时随机搭配。';}
for(let i=0;i<3;i++){
 await new Promise(resolve=>requestAnimationFrame(resolve));
 const identity=createIdentity(1,new Uint32Array([i*8,0,0,0,1000000000,2,i*8,9]));studio.angle=-.12;
 studio.build(shape,'#d6c2ae','sweet',identity);
 const card=document.createElement('article'),img=new Image();img.src=canvas.toDataURL();img.alt=['贝雷帽与弯钩手杖','渔夫帽与星星手杖','小尖帽与花朵手杖'][i];card.append(img,document.createTextNode(img.alt));document.querySelector('#samples').append(card);
}
document.querySelector('#progress').textContent='五种材质、三款帽子和三款手杖已完成';
