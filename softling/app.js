import { createIdentity, createMaterialPicker } from './fur-profiles.js?v=11';
import { PlushStudio } from './plush-3d.js?v=11';
const $ = (s) => document.querySelector(s);
const drawing = $('#drawing'), dc = drawing.getContext('2d');
const plush = $('#plush');
const studio = new PlushStudio(plush);
let pointerId=null;
let strokes = [], active = null, mood = 'sweet', generated = false, busy = false;
const examples = {
 bunny: [[220,510],[170,460],[155,370],[185,290],[175,155],[190,85],[225,78],[250,130],[270,250],[300,240],[320,100],[350,60],[380,80],[390,140],[375,280],[420,335],[435,420],[410,485],[350,520],[280,525]],
 cloud: [[150,430],[100,400],[85,350],[105,305],[150,290],[145,240],[175,195],[230,195],[260,230],[290,160],[350,145],[400,175],[415,235],[470,230],[510,265],[510,315],[555,340],[565,390],[530,435],[450,455],[350,448],[250,460]],
 blob: [[220,520],[145,485],[110,410],[115,320],[145,265],[135,190],[155,145],[190,145],[225,210],[280,205],[325,145],[365,135],[395,175],[380,250],[425,300],[445,390],[420,470],[360,520],[280,535],[220,520]]
};
function pathFor(points, close = true) {
 const p = new Path2D();
 if (!points.length) return p;
 p.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length-1;i++) p.quadraticCurveTo(points[i][0],points[i][1],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);
 if(points.length>1)p.lineTo(...points[points.length-1]);
 if(close)p.closePath(); return p;
}
function redraw(){dc.clearRect(0,0,720,660);dc.lineCap='round';dc.lineJoin='round';dc.lineWidth=4;dc.strokeStyle='#888b72';strokes.forEach(s=>dc.stroke(pathFor(s,false)));$('#drawHint').style.display=strokes.length?'none':'flex';$('#undo').disabled=!strokes.length;$('#clear').disabled=!strokes.length;}
function pos(e){const r=drawing.getBoundingClientRect();return [(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*562/r.height];}
drawing.addEventListener('pointerdown',e=>{if(busy||active)return; e.preventDefault();pointerId=e.pointerId;drawing.setPointerCapture(e.pointerId);active=[pos(e)];strokes.push(active);redraw();});
drawing.addEventListener('pointermove',e=>{if(!active||e.pointerId!==pointerId)return;const p=pos(e),last=active.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>2){active.push(p);redraw();}});
function finish(e){if(!active||e.pointerId!==pointerId)return;if(e.type==='pointerup'){const p=pos(e);if(Math.hypot(p[0]-active.at(-1)[0],p[1]-active.at(-1)[1])>2)active.push(p);}if(active.length<2)strokes.pop();active=null;pointerId=null;redraw();}
drawing.addEventListener('pointerup',finish);drawing.addEventListener('pointercancel',finish);
$('#undo').onclick=()=>{if(busy)return;strokes.pop();redraw();};$('#clear').onclick=()=>{if(busy)return;strokes=[];redraw();$('#status').textContent='空白也很好，慢慢来。';};
$('#example').onclick=()=>{if(busy)return;strokes=[[...examples.cloud,examples.cloud[0]].map(p=>[...p])];redraw();$('#status').textContent='';};
let lastShape = [examples.blob];
const pickMaterial = createMaterialPicker();
let identity = createIdentity(1);
const quotes=['慢慢来，你有自己的时区。','今天的你，也值得一个拥抱。','不必完美，也一样可爱。','允许自己，休息一小会儿。','微小的快乐，也值得收藏。','你已经走了很远，辛苦啦。','把今天，过成喜欢的样子。','偶尔停下来，也是在照顾自己。','你的柔软，是很珍贵的力量。','总有小小的美好，在等你。','照自己的节奏，慢慢生长。','今天，先对自己温柔一点。'];
let quoteIndex=0;
function nextQuote(){quoteIndex=(quoteIndex+1+crypto.getRandomValues(new Uint32Array(1))[0]%(quotes.length-1))%quotes.length;$('#quote').textContent=quotes[quoteIndex];}
function makeIdentity(previous) { return createIdentity(pickMaterial(),undefined,previous?.colorIndex); }
function render(source) { studio.build(source,identity.color,mood,identity); }
$('#generate').onclick=async()=>{
 if(busy)return;
 const useful=strokes.filter(s=>s.length>=2);
 if(!useful.length){$('#status').textContent='先画一点什么吧，也可以点选小云朵。';return;}
 const all=useful.flat(),w=Math.max(...all.map(p=>p[0]))-Math.min(...all.map(p=>p[0])),h=Math.max(...all.map(p=>p[1]))-Math.min(...all.map(p=>p[1]));
 if(Math.max(w,h)<35){$('#status').textContent='再画得大一些，让我看清你的线条。';return;}
 busy=true;$('#generate').disabled=true;$('#stage').classList.add('generating');$('#status').textContent='正在变柔软…';
 await new Promise(r=>setTimeout(r,450));
 try{lastShape=useful.map(s=>s.map(p=>[...p]));identity=makeIdentity(identity);render(lastShape);generated=true;$('#share').disabled=false;nextQuote();$('#status').textContent='';$('#generate').innerHTML='再遇见一只 <span>↻</span>';if(matchMedia('(max-width:760px)').matches)document.querySelector('.result-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}catch(e){$('#status').textContent='这次没有织好，请再试一次。';console.error(e);}finally{busy=false;$('#generate').disabled=false;$('#stage').classList.remove('generating');}
};
let shareFile=null;
$('#share').onclick=()=>{
 if(!generated||busy)return;shareFile=null;$('#nativeShare').hidden=true;
 const card=document.createElement('canvas');card.width=1080;card.height=1350;const ctx=card.getContext('2d');
 ctx.fillStyle='#f7f5ef';ctx.fillRect(0,0,1080,1350);
 ctx.fillStyle='#fffefa';ctx.beginPath();ctx.roundRect(48,48,984,1254,36);ctx.fill();
 ctx.drawImage(plush,90,110,900,900);
 ctx.fillStyle='#515946';ctx.textAlign='center';ctx.font='40px "Songti SC", serif';
 const text=quotes[quoteIndex];ctx.fillText(text,540,1090,880);
 ctx.fillStyle='#a2a793';ctx.font='italic 26px Georgia';ctx.fillText('softling',540,1210);
 const url=card.toDataURL('image/png');card.toBlob(blob=>{shareFile=new File([blob],'softling-card.png',{type:'image/png'});$('#nativeShare').hidden=!navigator.canShare?.({files:[shareFile]});},'image/png');$('#cardPreview').src=url;$('#downloadCard').href=url;$('#cardDialog').showModal();
};
$('#nativeShare').onclick=async()=>{if(!shareFile)return;try{await navigator.share({files:[shareFile],title:'我的绒绒'});}catch(error){if(error.name!=='AbortError')console.error(error);}};
$('#closeCard').onclick=()=>$('#cardDialog').close();
$('#cardDialog').addEventListener('click',e=>{if(e.target===$('#cardDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
redraw();render(lastShape);
