// Visually distinct pile constructions; length is expressed in model units.
export const FUR_PROFILES = [
 {id:'short',name:'密短毛',description:'短而密，有一致的顺毛方向',length:.075,count:100000,segments:3},
 {id:'fluffy',name:'蓬松毛',description:'轻盈炸开，边缘有蓬松的毛晕',length:.24,count:95000,segments:5},
 {id:'shaggy',name:'超长垂毛',description:'长毛成束，顺着重力垂落',length:.66,count:65000,segments:8},
 {id:'curly',name:'螺旋卷毛',description:'松松的螺旋绒圈，卷曲起伏',length:.21,count:32000,segments:16},
 {id:'gingham',name:'格子布',description:'整只格纹棉布缝制，细密织纹与柔软填充',length:0,count:0,segments:0},
];
export const PALETTES = [
 {name:'奶油',hex:'#e5d5b5'},{name:'焦糖',hex:'#d5ae85'},
 {name:'苔绿',hex:'#b1bea0'},{name:'雾蓝',hex:'#abc5d4'},
 {name:'莓粉',hex:'#dfb0bd'},{name:'芋紫',hex:'#c6b3d3'},
 {name:'可可',hex:'#b69784'},{name:'杏橙',hex:'#e5b08c'}
];
export function createIdentity(profile, random=crypto.getRandomValues(new Uint32Array(8)), previousColor) {
 let colorIndex=random[1]%PALETTES.length;
 if(colorIndex===previousColor)colorIndex=(colorIndex+1+random[2]%(PALETTES.length-1))%PALETTES.length;
 return {seed:random[0],fur:profile,colorIndex,color:PALETTES[colorIndex].hex,colorName:PALETTES[colorIndex].name,
  face:random[3]%8,eyeGap:random[4]/4294967296,bulk:.4,
  hatStyle:(random[6]>>>3)%3,caneStyle:(random[0]>>>3)%3,prop:(random[2]>>>3)%3,decoration:random[5]%4,accent:random[6]%3,accessorySide:random[7]%2?1:-1,name:['软豆','蒲蒲','毛毛','卷卷','布布'][profile],label:FUR_PROFILES[profile].name};
}
export function createMaterialPicker(randomIndex=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n) {
 let bag=[],last=-1;
 return ()=>{
  if(!bag.length){bag=FUR_PROFILES.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=randomIndex(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
   if(bag.at(-1)===last)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
  }
  last=bag.pop();return last;
 };
}
