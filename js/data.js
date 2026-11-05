/* 一二布布环游世界 — 数据与关卡 */

const COUNTRIES = [
  { id:'cn', name:'中国', tag:'汉字之城', img:'assets/cn.jpg', emoji:'🏯', color:'#d95d4f', available:true },
  { id:'jp', name:'日本', tag:'樱花小径', img:'assets/jp.jpg', emoji:'⛩️', color:'#f2a7bb', available:false },
  { id:'fr', name:'法国', tag:'塞纳河畔', img:'assets/fr.jpg', emoji:'🗼', color:'#9b8ad6', available:false },
  { id:'gb', name:'英国', tag:'伦敦雾', img:'assets/gb.jpg', emoji:'🎡', color:'#7c9fd6', available:false },
  { id:'au', name:'澳洲', tag:'悉尼港湾', img:'assets/au.jpg', emoji:'🦘', color:'#6fc3d8', available:false },
  { id:'gr', name:'希腊', tag:'爱琴海边', img:'assets/gr.jpg', emoji:'🏛️', color:'#5fb7d4', available:false }
];

const OUTFITS = [
  {
    id:'travel', name:'旅行装', price:0, tag:'出发！',
    yier:{ hat:'bucket', hatColor:'#8ecae6', hatAccent:'#5aa9c9', top:'tee', topColor:'#fff6e2', trim:'#f2b84b', bag:'satchel', bagColor:'#f2b84b', extra:'none' },
    bubu:{ hat:'cap', hatColor:'#f2b84b', hatAccent:'#d99a2b', top:'tee', topColor:'#fff6e2', trim:'#8ecae6', bag:'crossbody', bagColor:'#8ecae6', extra:'none' }
  },
  {
    id:'cn', name:'中国·旗袍', price:200, tag:'长城红',
    yier:{ hat:'bun', hatColor:'#4b2b20', hatAccent:'#f2b84b', top:'qipao', topColor:'#d94a3d', trim:'#f6cf6d', bag:'none', bagColor:'#f2b84b', extra:'fan', extraColor:'#f6cf6d' },
    bubu:{ hat:'none', hatColor:'#4b2b20', hatAccent:'#f2b84b', top:'tang', topColor:'#d94a3d', trim:'#f6cf6d', bag:'none', bagColor:'#f2b84b', extra:'knot', extraColor:'#f6cf6d' }
  },
  {
    id:'jp', name:'日本·和服', price:400, tag:'樱花粉',
    yier:{ hat:'flower', hatColor:'#f7a8c4', hatAccent:'#fff6e2', top:'kimono', topColor:'#f7b6c8', trim:'#fff6e2', bag:'none', bagColor:'#f2b84b', extra:'fan', extraColor:'#fff6e2' },
    bubu:{ hat:'headband', hatColor:'#4d6fa8', hatAccent:'#fff6e2', top:'kimono', topColor:'#4d6fa8', trim:'#fff6e2', bag:'none', bagColor:'#f2b84b', extra:'none' }
  },
  {
    id:'fr', name:'法国·贝雷帽', price:400, tag:'塞纳河',
    yier:{ hat:'beret', hatColor:'#d94a3d', hatAccent:'#b8443a', top:'stripe', topColor:'#fff6e2', trim:'#3d5a80', bag:'satchel', bagColor:'#f2b84b', extra:'baguette' },
    bubu:{ hat:'beret', hatColor:'#4d6fa8', hatAccent:'#3d5a80', top:'stripe', topColor:'#fff6e2', trim:'#3d5a80', bag:'crossbody', bagColor:'#d94a3d', extra:'none' }
  },
  {
    id:'gb', name:'英国·风衣', price:450, tag:'伦敦雾',
    yier:{ hat:'bowler', hatColor:'#5b4034', hatAccent:'#3d2b22', top:'trench', topColor:'#d8b98a', trim:'#5b4034', bag:'none', bagColor:'#f2b84b', extra:'umbrella', extraColor:'#d94a3d' },
    bubu:{ hat:'flatcap', hatColor:'#5b4034', hatAccent:'#3d2b22', top:'trench', topColor:'#c9a878', trim:'#3f6b4f', bag:'crossbody', bagColor:'#3f6b4f', extra:'scarf', extraColor:'#3f6b4f' }
  },
  {
    id:'au', name:'澳洲·冲浪', price:450, tag:'南半球',
    yier:{ hat:'sunhat', hatColor:'#e8c98a', hatAccent:'#d9a85c', top:'hawaii', topColor:'#8fd6b4', trim:'#f7b6c8', bag:'none', bagColor:'#f2b84b', extra:'sunglasses', extraColor:'#4b2b20' },
    bubu:{ hat:'akubra', hatColor:'#b98a5a', hatAccent:'#7a4a33', top:'hawaii', topColor:'#6fc3d8', trim:'#f2b84b', bag:'none', bagColor:'#f2b84b', extra:'sunglasses', extraColor:'#4b2b20' }
  },
  {
    id:'gr', name:'希腊·白裙', price:500, tag:'爱琴海',
    yier:{ hat:'laurel', hatColor:'#e0b84c', hatAccent:'#b8892a', top:'toga', topColor:'#f3ead8', trim:'#e0b84c', bag:'none', bagColor:'#f2b84b', extra:'none' },
    bubu:{ hat:'laurel', hatColor:'#e0b84c', hatAccent:'#b8892a', top:'toga', topColor:'#f3ead8', trim:'#e0b84c', bag:'none', bagColor:'#f2b84b', extra:'none' }
  },
  {
    id:'world', name:'环球·斗篷', price:0, tag:'集齐六国印章',
    yier:{ hat:'crown', hatColor:'#f6cf6d', hatAccent:'#d99a2b', top:'cape', topColor:'#f7b6c8', trim:'#8ecae6', bag:'none', bagColor:'#f2b84b', extra:'star', extraColor:'#f6cf6d' },
    bubu:{ hat:'crown', hatColor:'#f6cf6d', hatAccent:'#d99a2b', top:'cape', topColor:'#8fd6b4', trim:'#8ecae6', bag:'none', bagColor:'#f2b84b', extra:'star', extraColor:'#f6cf6d' }
  }
];

const TOWERS = {
  dart: {
    id:'dart', name:'飞镖塔', short:'飞镖', cost:60, color:'#d95d4f',
    desc:'短射程、快攻速，第一关的主力。',
    levels:[
      { damage:16, range:160, rate:1.30, cost:80 },
      { damage:22, range:175, rate:1.50, cost:140 },
      { damage:30, range:190, rate:1.75, cost:0 }
    ]
  },
  sling: {
    id:'sling', name:'弹弓塔', short:'弹弓', cost:90, color:'#8a6a4a',
    desc:'射得远、单发伤害高，适合打硬怪。',
    levels:[
      { damage:42, range:230, rate:0.62, cost:110 },
      { damage:60, range:250, rate:0.70, cost:180 },
      { damage:85, range:275, rate:0.80, cost:0 }
    ]
  },
  honey: {
    id:'honey', name:'蜂蜜罐', short:'蜂蜜', cost:80, color:'#e0a63a',
    desc:'范围减速，让怪兽走得像蜗牛。',
    levels:[
      { damage:4, range:135, rate:1.0, slow:0.35, slowDur:1.6, cost:100 },
      { damage:6, range:150, rate:1.0, slow:0.45, slowDur:1.8, cost:160 },
      { damage:9, range:165, rate:1.0, slow:0.55, slowDur:2.0, cost:0 }
    ]
  },
  camera: {
    id:'camera', name:'拍立得', short:'相机', cost:100, color:'#5f8fb0',
    desc:'闪光眩晕一片，关键时候救命。',
    levels:[
      { damage:8, range:160, rate:0.45, stun:0.7, aoe:55, cost:120 },
      { damage:12, range:175, rate:0.5, stun:0.9, aoe:65, cost:190 },
      { damage:18, range:190, rate:0.55, stun:1.1, aoe:80, cost:0 }
    ]
  }
};

const TOWER_ORDER = ['dart','sling','honey','camera'];

const ENEMIES = {
  fuzz: { id:'fuzz', name:'绒球怪', hp:48, speed:38, reward:6, radius:17, color:'#7bc8a4', armor:0 },
  dango: { id:'dango', name:'快跑团子', hp:42, speed:76, reward:7, radius:15, color:'#f2a7bb', armor:0 },
  can: { id:'can', name:'铁罐怪', hp:200, speed:28, reward:14, radius:21, color:'#9fb3c8', armor:2 },
  pudding: { id:'pudding', name:'布丁怪', hp:100, speed:36, reward:10, radius:19, color:'#f6c453', armor:0, split:'mini' },
  mini: { id:'mini', name:'小布丁', hp:24, speed:58, reward:3, radius:11, color:'#f9d77e', armor:0 },
  boss: { id:'boss', name:'灯笼大魔王', hp:2200, speed:22, reward:150, radius:46, color:'#d94a3d', armor:3, boss:true }
};

const LEVELS = [
  {
    id:'cn1', name:'长城脚下', sub:'第 1 关 · 飞镖教学', chapter:'中国',
    path:[[-50,500],[220,500],[220,250],[520,250],[520,500],[820,500],[820,220],[1080,220],[1080,400],[1180,400]],
    slots:[[120,420],[320,420],[330,320],[430,170],[620,320],[620,420],[700,150],[920,320],[920,420],[1160,290],[1160,490],[1000,560]],
    waves:[
      { groups:[{enemy:'fuzz',count:8,gap:0.85}], reward:28 },
      { groups:[{enemy:'fuzz',count:10,gap:0.72}], reward:32 },
      { groups:[{enemy:'fuzz',count:12,gap:0.62},{enemy:'dango',count:3,gap:0.8}], reward:40 }
    ],
    coins:200, lives:10, towers:['dart'], reward:120, tint:'rgba(255,238,204,.46)',
    props:[
      { type:'chest', x:170, y:560, hp:60, reward:25 },
      { type:'luckybag', x:700, y:380, hp:50, reward:20 }
    ],
    tip:'点一个木桩，建一座飞镖塔。'
  },
  {
    id:'cn2', name:'烽火台', sub:'第 2 关 · 弹弓登场', chapter:'中国',
    path:[[-50,300],[180,300],[180,520],[420,520],[420,180],[700,180],[700,480],[980,480],[980,240],[1180,240]],
    slots:[[80,390],[300,390],[300,250],[520,300],[520,420],[600,100],[820,280],[820,390],[900,560],[1100,340],[1100,160],[1180,520]],
    waves:[
      { groups:[{enemy:'fuzz',count:10,gap:0.7}], reward:30 },
      { groups:[{enemy:'dango',count:10,gap:0.55},{enemy:'fuzz',count:6,gap:0.8}], reward:34 },
      { groups:[{enemy:'fuzz',count:12,gap:0.6},{enemy:'dango',count:8,gap:0.5}], reward:38 },
      { groups:[{enemy:'dango',count:14,gap:0.45},{enemy:'can',count:2,gap:1.2}], reward:46 }
    ],
    coins:230, lives:10, towers:['dart','sling'], reward:140, tint:'rgba(255,232,196,.44)',
    props:[
      { type:'chest', x:360, y:330, hp:60, reward:25 },
      { type:'luckybag', x:760, y:380, hp:50, reward:20 }
    ],
    tip:'新塔：弹弓塔。射程远，专门打快跑团子。'
  },
  {
    id:'cn3', name:'山海关', sub:'第 3 关 · 铁罐怪', chapter:'中国',
    path:[[-50,180],[300,180],[300,420],[620,420],[620,180],[940,180],[940,520],[1180,520]],
    slots:[[100,280],[180,420],[420,280],[420,520],[520,100],[720,300],[720,520],[820,100],[1040,300],[1040,420],[1120,200],[1120,560]],
    waves:[
      { groups:[{enemy:'fuzz',count:12,gap:0.6},{enemy:'can',count:1,gap:1.3}], reward:34 },
      { groups:[{enemy:'can',count:2,gap:1.1},{enemy:'dango',count:8,gap:0.5}], reward:40 },
      { groups:[{enemy:'fuzz',count:16,gap:0.45},{enemy:'can',count:2,gap:1.0}], reward:44 },
      { groups:[{enemy:'can',count:3,gap:0.9},{enemy:'dango',count:12,gap:0.4}], reward:52 }
    ],
    coins:320, lives:10, towers:['dart','sling','honey'], reward:160, tint:'rgba(226,238,255,.44)',
    props:[
      { type:'chest', x:200, y:300, hp:70, reward:30 },
      { type:'luckybag', x:760, y:380, hp:55, reward:20 }
    ],
    tip:'新塔：蜂蜜罐。先减速，再让飞镖和弹弓慢慢打。'
  },
  {
    id:'cn4', name:'枫叶谷', sub:'第 4 关 · 布丁会分裂', chapter:'中国',
    path:[[-50,420],[200,420],[200,180],[460,180],[460,520],[720,520],[720,180],[980,180],[980,420],[1180,420]],
    slots:[[90,300],[320,300],[320,480],[380,80],[580,300],[580,420],[640,80],[860,300],[860,520],[1040,300],[1040,520],[1160,240]],
    waves:[
      { groups:[{enemy:'pudding',count:4,gap:1.0},{enemy:'fuzz',count:10,gap:0.55}], reward:36 },
      { groups:[{enemy:'dango',count:12,gap:0.45},{enemy:'pudding',count:4,gap:1.0}], reward:42 },
      { groups:[{enemy:'can',count:4,gap:1.1},{enemy:'pudding',count:5,gap:0.8}], reward:46 },
      { groups:[{enemy:'fuzz',count:18,gap:0.4},{enemy:'pudding',count:5,gap:0.75},{enemy:'dango',count:10,gap:0.4}], reward:56 }
    ],
    coins:420, lives:10, towers:['dart','sling','honey','camera'], reward:180, tint:'rgba(255,214,170,.44)',
    props:[
      { type:'chest', x:300, y:200, hp:70, reward:30 },
      { type:'luckybag', x:800, y:380, hp:55, reward:20 }
    ],
    tip:'新塔：拍立得。闪光能眩晕一片，布丁分裂也不怕。'
  },
  {
    id:'cn5', name:'灯笼大魔王', sub:'第 5 关 · 中国站 Boss', chapter:'中国',
    path:[[-50,520],[160,520],[160,160],[480,160],[480,520],[800,520],[800,160],[1120,160],[1120,520],[1180,520]],
    slots:[[80,380],[280,380],[280,260],[360,80],[600,260],[600,380],[720,80],[920,260],[920,380],[1040,260],[1040,420],[1200,260]],
    waves:[
      { groups:[{enemy:'fuzz',count:14,gap:0.45},{enemy:'dango',count:10,gap:0.4}], reward:40 },
      { groups:[{enemy:'can',count:6,gap:0.9},{enemy:'pudding',count:8,gap:0.7}], reward:50 },
      { groups:[{enemy:'boss',count:1,gap:1},{enemy:'fuzz',count:10,gap:0.35},{enemy:'dango',count:8,gap:0.4}], reward:120 }
    ],
    coins:400, lives:12, towers:['dart','sling','honey','camera'], reward:300, tint:'rgba(255,196,150,.48)', boss:true,
    props:[
      { type:'chest', x:300, y:300, hp:80, reward:35 },
      { type:'luckybag', x:860, y:300, hp:60, reward:25 },
      { type:'chest', x:1100, y:480, hp:80, reward:35 }
    ],
    tip:'灯笼大魔王来了！把四种塔都用上，别让它走到房车。'
  }
];

const STORY = {
  intro: [
    { who:'鸥鸥', text:'欢迎登上「一二布布号」！我是导游鸥鸥。' },
    { who:'一二', text:'第一站去哪里呀？我带了新帽子和空肚子。' },
    { who:'鸥鸥', text:'中国·长城！不过长城脚下有一群捣蛋小怪兽，正围着房车转。' },
    { who:'布布', text:'飞镖塔已经搬下车了。一二，你站我后面。' }
  ],
  cnStart: [
    { who:'鸥鸥', text:'这里就是中国站。看到路上的木桩了吗？点一下就能建塔。' },
    { who:'一二', text:'那我负责美，布布负责打。' },
    { who:'布布', text:'先把第 1 波挡住再说。' }
  ],
  cnEnd: [
    { who:'灯笼大魔王', text:'呜……我只是想借点灯光，给长城挂灯笼。' },
    { who:'一二', text:'早说呀！灯笼可以一起挂，但不能撞我们的房车。' },
    { who:'鸥鸥', text:'中国站印章到手！下一站：日本·樱花小径（正在施工）。' }
  ]
};

const SAVE_KEY = 'yier-bubu-world-v1';

/* 调试用：?level=cn1 直接进关 */
function findLevel(id){ return LEVELS.find(l => l.id === id); }
