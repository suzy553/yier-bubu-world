/* 一二布布环游世界 — 塔防核心 */
const GAME = (() => {
  let canvas, ctx, dpr = 1;
  let S = null;
  let raf = null;
  let last = 0;
  let hooks = {};
  let bgImage = null;
  let emitAt = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2;
  function sfx(name) { if (hooks.onSfx) hooks.onSfx(name); }

  class Path {
    constructor(points) {
      this.points = points;
      this.segs = [];
      this.total = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        this.segs.push({ a, b, len, start: this.total });
        this.total += len;
      }
    }
    at(d) {
      d = clamp(d, 0, this.total);
      for (const s of this.segs) {
        if (d <= s.start + s.len) {
          const t = s.len ? (d - s.start) / s.len : 0;
          return {
            x: s.a[0] + (s.b[0] - s.a[0]) * t,
            y: s.a[1] + (s.b[1] - s.a[1]) * t,
            angle: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0])
          };
        }
      }
      const a = this.segs[this.segs.length - 1];
      return { x: a.b[0], y: a.b[1], angle: 0 };
    }
  }

  function init(canvasEl, callbacks) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    hooks = callbacks || {};
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = 1280 * dpr;
    canvas.height = 720 * dpr;
    canvas.style.width = '1280px';
    canvas.style.height = '720px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bindPointer();
  }

  function bindPointer() {
    canvas.addEventListener('pointerdown', e => {
      if (!S || S.over || S.paused) return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (1280 / r.width);
      const y = (e.clientY - r.top) * (720 / r.height);
      pointer(x, y);
    });
    canvas.addEventListener('pointermove', e => {
      if (!S || S.over || S.paused || !S.buildType) { if (S) S.hover = null; return; }
      const r = canvas.getBoundingClientRect();
      S.hover = {
        x: (e.clientX - r.left) * (1280 / r.width),
        y: (e.clientY - r.top) * (720 / r.height)
      };
    });
    canvas.addEventListener('pointerleave', () => { if (S) S.hover = null; });
  }

  function pointSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / len;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  function distToPath(x, y) {
    const pts = S.level.path || [];
    let best = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      best = Math.min(best, pointSegDist(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]));
    }
    return best;
  }

  function canPlaceAt(x, y) {
    if (x < 26 || x > 1254 || y < 86 || y > 560) return { ok: false, reason: '这里太靠边了，换个地方吧。' };
    if (distToPath(x, y) < 48) return { ok: false, reason: '不能建在怪兽走的路上。' };
    if (Math.hypot(x - S.base.x, y - S.base.y) < 76) return { ok: false, reason: '离景区太近了，往旁边挪一点。' };
    for (const t of S.towers) {
      if (Math.hypot(x - t.slot.x, y - t.slot.y) < 44) return { ok: false, reason: '两座塔靠得太近了。' };
    }
    for (const e of S.enemies) {
      if (e.prop && Math.hypot(x - e.x, y - e.y) < Math.max(28, (e.radius || 16) + 10)) return { ok: false, reason: '这里有个道具，换块空地吧。' };
    }
    return { ok: true };
  }

  function tryFreeBuild(x, y) {
    const check = canPlaceAt(x, y);
    if (!check.ok) { toast(check.reason); return; }
    const slot = { x, y, tower: null };
    buildAt(slot);
    S.hover = null;
  }

  function pointer(x, y) {
    if (!S) return;
    if (S.aiming === 'bomb') { useSkill('bomb', x, y); return; }
    // 先找已经建好的塔（包括自由放置的）
    let tower = null, bestD = 9999;
    for (const t of S.towers) {
      const d = Math.hypot(t.slot.x - x, t.slot.y - y);
      if (d < bestD) { bestD = d; tower = t; }
    }
    if (tower && bestD < 42) {
      S.selectedSlot = tower.slot;
      S.selectedTower = tower;
      S.buildType = null;
      S.hover = null;
      emit(true);
      return;
    }
    if (S.buildType) {
      tryFreeBuild(x, y);
      return;
    }
    S.selectedSlot = null;
    S.selectedTower = null;
    S.hover = null;
    emit(true);
  }

  function toast(msg) {
    if (hooks.onToast) hooks.onToast(msg);
  }

  function start(level, outfit, callbacks) {
    stop();
    hooks = Object.assign({}, hooks, callbacks || {});
    const path = new Path(level.path);
    S = {
      level,
      path,
      endless: !!level.endless,
      waves: level.waves ? level.waves.slice() : [],
      waveHpScale: 1,
      spawnGap: 1.3,
      slots: level.slots.map(([x, y]) => ({ x, y, tower: null })),
      towers: [],
      enemies: [],
      projectiles: [],
      effects: [],
      floats: [],
      leaves: Array.from({ length: 16 }, () => ({
        x: Math.random() * 1280, y: Math.random() * 720,
        vx: -12 - Math.random() * 16, vy: 10 + Math.random() * 18,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * 2,
        s: .7 + Math.random() * .7
      })),
      coins: level.coins,
      lives: level.lives,
      maxLives: level.lives,
      waveIndex: -1,
      phase: 'prepare',
      prepareT: 5,
      queue: [],
      queueIndex: 0,
      waveTime: 0,
      time: 0,
      speed: 1,
      paused: false,
      over: false,
      selectedSlot: null,
      selectedTower: null,
      buildType: null,
      hover: null,
      skills: {
        freeze: { cd: 0, max: 25 },
        bomb: { cd: 0, max: 20 }
      },
      aiming: null,
      outfit,
      bgImg: null,
      base: path.at(path.total),
      shakeT: 0,
      bannerT: 0,
      damageBuffT: 0,
      damageBuffMult: 1
    };

    if (bgImage && bgImage.src.includes('cn.jpg')) {
      S.bgImg = bgImage;
    } else {
      bgImage = new Image();
      bgImage.src = 'assets/cn.jpg?v=22';
      bgImage.onload = () => { if (S) S.bgImg = bgImage; };
      S.bgImg = bgImage;
    }

    for (const p of level.props || []) spawnProp(p);

    emit(true);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    S = null;
  }

  function pause(v) {
    if (!S) return;
    S.paused = !!v;
    emit(true);
  }

  function setSpeed(v) {
    if (!S) return;
    S.speed = v;
    emit(true);
  }

  function selectBuild(type) {
    if (!S || S.over || S.paused) return;
    if (!S.level.towers.includes(type)) {
      const unlock = type === 'sling' ? '第 2 关' : type === 'honey' ? '第 3 关' : '第 4 关';
      toast(`${TOWERS[type].name}在${unlock}解锁。`);
      return;
    }
    if (S.coins < TOWERS[type].cost) {
      toast('熊熊币不够，先打一波怪。');
      return;
    }
    S.buildType = S.buildType === type ? null : type;
    S.selectedTower = null;
    S.selectedSlot = null;
    emit(true);
  }

  function deselect() {
    if (!S) return;
    S.buildType = null;
    S.selectedTower = null;
    S.selectedSlot = null;
    emit(true);
  }

  function buildAt(slot) {
    const type = S.buildType;
    if (!type) return;
    const def = TOWERS[type];
    if (slot.tower) return;
    if (S.coins < def.cost) { toast('熊熊币不够。'); return; }
    S.coins -= def.cost;
    const tower = {
      type, level: 1, slot, cooldown: .3, angle: -Math.PI / 2, recoil: 0,
      spent: def.cost
    };
    slot.tower = tower;
    S.towers.push(tower);
    S.buildType = null;
    S.selectedSlot = slot;
    S.selectedTower = tower;
    addEffect('build', slot.x, slot.y - 20, 0, .4);
    sfx('build');
    emit(true);
  }

  function upgrade() {
    const t = S && S.selectedTower;
    if (!t) return;
    const def = TOWERS[t.type];
    if (t.level >= 3) { toast(t.branch ? '已经专精啦。' : '已经 3 级，选一个专精吧。'); return; }
    const cost = def.levels[t.level - 1].cost;
    if (S.coins < cost) { toast('熊熊币不够升级。'); return; }
    S.coins -= cost;
    t.spent += cost;
    t.level++;
    addEffect('upgrade', t.slot.x, t.slot.y - 28, 0, .5);
    sfx('upgrade');
    emit(true);
  }

  function chooseBranch(id) {
    const t = S && S.selectedTower;
    if (!t || t.level < 3 || t.branch) return;
    const def = (BRANCHES[t.type] || []).find(b => b.id === id);
    if (!def) return;
    t.branch = def.id;
    t.branchName = def.name;
    addEffect('upgrade', t.slot.x, t.slot.y - 28, 0, .6);
    sfx('upgrade');
    toast(`${TOWERS[t.type].name} 专精：${def.name}`);
    emit(true);
  }

  function sell() {
    const t = S && S.selectedTower;
    if (!t) return;
    const refund = Math.floor(t.spent * .6);
    S.coins += refund;
    t.slot.tower = null;
    S.towers = S.towers.filter(x => x !== t);
    S.selectedTower = null;
    S.selectedSlot = null;
    addEffect('coin', t.slot.x, t.slot.y - 20, 0, .6);
    sfx('coin');
    emit(true);
  }

  function makeEndlessWave(n) {
    const groups = [{
      enemy: 'fuzz',
      count: 8 + n * 2,
      gap: Math.max(.28, .72 - n * .018)
    }];
    if (n % 2 === 1) groups.push({ enemy: 'dango', count: 4 + n, gap: Math.max(.28, .6 - n * .012) });
    if (n % 3 === 2) groups.push({ enemy: 'can', count: 1 + Math.floor(n / 3), gap: 1.0 });
    if (n % 4 === 3) groups.push({ enemy: 'pudding', count: 2 + Math.floor(n / 4), gap: .85 });
    if (n > 1 && n % 5 === 0) groups.push({ enemy: 'shield', count: 1 + Math.floor(n / 8), gap: 1.2 });
    if (n > 2 && n % 7 === 0) groups.push({ enemy: 'healer', count: 1, gap: 1.5 });
    if (n > 0 && n % 5 === 0) groups.push({ enemy: 'boss', count: 1, gap: 1 });
    return { groups, hpScale: 1 + n * .12, reward: 20 + n * 2 };
  }

  function startWave() {
    if (!S || S.over || S.phase !== 'prepare') return;
    if (S.endless) {
      while (S.waves.length <= S.waveIndex + 1) S.waves.push(makeEndlessWave(S.waves.length));
    }
    const wave = S.waves[S.waveIndex + 1];
    if (!wave) return;
    S.waveIndex++;
    S.phase = 'wave';
    S.prepareT = 0;
    S.waveTime = 0;
    S.waveHpScale = wave.hpScale || 1;
    S.queue = [];
    S.queueIndex = 0;
    let t = 0;
    const gapScale = S.spawnGap || 1;
    for (const g of wave.groups) {
      const def = ENEMIES[g.enemy] || ENEMIES.fuzz;
      const minGap = (def.radius * 2 + 18) / Math.max(1, def.speed);
      const interval = Math.max(g.gap * gapScale, minGap);
      for (let i = 0; i < g.count; i++) {
        S.queue.push({ time: t + i * interval, enemy: g.enemy });
      }
      t += g.count * interval + .9 * gapScale;
    }
    S.queue.sort((a, b) => a.time - b.time);
    S.bannerT = 1.6;
    sfx('wave');
    emit(true);
  }

  function useSkill(type, x, y) {
    if (!S || S.over || S.paused) return;
    if (type === 'freeze') {
      const sk = S.skills.freeze;
      if (sk.cd > 0) { toast(`冰冻还要 ${Math.ceil(sk.cd)} 秒`); return; }
      sk.cd = sk.max;
      for (const e of S.enemies) {
        if (!e.prop && !e.dead && e.shieldHp <= 0) e.stun = Math.max(e.stun, 3);
      }
      addEffect('flash', 640, 360, 0, .55);
      sfx('camera');
      toast('冰冻！全场暂停 3 秒');
      S.aiming = null;
      emit(true);
      return;
    }
    if (type === 'bomb') {
      const sk = S.skills.bomb;
      if (sk.cd > 0) { toast(`轰炸还要 ${Math.ceil(sk.cd)} 秒`); return; }
      if (x === undefined || y === undefined) {
        S.aiming = 'bomb';
        emit(true);
        toast('点地图选择轰炸位置');
        return;
      }
      sk.cd = sk.max;
      S.aiming = null;
      for (const e of S.enemies.slice()) {
        if (!e.dead && !e.prop && dist2(x, y, e.x, e.y) <= 120 * 120) damage(e, 90, 'bomb');
      }
      addEffect('flash', x, y, 0, .6, { r: 120 });
      sfx('camera');
      toast('轰！');
      emit(true);
    }
  }

  function spawnEnemy(type) {
    const def = ENEMIES[type];
    const hpScale = S.waveHpScale || 1;
    const e = {
      id: Math.random().toString(36).slice(2),
      type,
      hp: def.hp * hpScale,
      maxHp: def.hp * hpScale,
      speed: def.speed,
      reward: def.reward,
      radius: def.radius,
      armor: def.armor || 0,
      boss: !!def.boss,
      shieldHp: def.shield || 0,
      maxShield: def.shield || 0,
      healT: 2 + Math.random() * 2,
      split: def.split || null,
      dist: 0,
      x: 0, y: 0,
      slow: 0, slowT: 0,
      stun: 0,
      hitT: 0,
      dead: false,
      bossStage: 0
    };
    S.enemies.push(e);
  }

  function spawnProp(def) {
    const hp = def.hp || 60;
    S.enemies.push({
      id: Math.random().toString(36).slice(2),
      type: def.type,
      prop: true,
      hp, maxHp: hp,
      speed: 0,
      reward: def.reward || 25,
      radius: ({ chest: 20, luckybag: 17, mushroom: 16, gift: 17, pavilion: 30, grass: 14, bamboo: 18 })[def.type] || 17,
      armor: 0,
      boss: false,
      split: null,
      dist: 0,
      x: def.x, y: def.y,
      slow: 0, slowT: 0,
      stun: 0, hitT: 0,
      dead: false,
      bossStage: 0
    });
  }

  function addEffect(type, x, y, delay, life, data) {
    S.effects.push({ type, x, y, t: -delay, life, data: data || {} });
  }

  function addFloat(x, y, text, color) {
    S.floats.push({ x, y, text, color: color || '#fff6e2', t: 0, life: .7 });
  }

  function damage(e, amount, source) {
    if (!e || e.dead) return;
    const buffed = S.damageBuffT > 0 ? S.damageBuffMult : 1;
    const dmg = Math.max(1, Math.round(amount * buffed) - (e.armor || 0));
    if (e.shieldHp > 0) {
      const absorbed = Math.min(e.shieldHp, dmg);
      e.shieldHp -= absorbed;
      e.hitT = .12;
      addFloat(e.x + (Math.random() - .5) * 12, e.y - e.radius - 14, `-${Math.round(absorbed)}`, '#8ecae6');
      if (e.shieldHp <= 0) addEffect('flash', e.x, e.y, 0, .35);
      return;
    }
    e.hp -= dmg;
    e.hitT = .12;
    addFloat(e.x + (Math.random() - .5) * 12, e.y - e.radius - 14, String(Math.round(dmg)));
    if (e.hp <= 0) {
      kill(e);
    } else if (e.boss) {
      const ratio = e.hp / e.maxHp;
      if (e.bossStage === 0 && ratio < .66) {
        e.bossStage = 1;
        for (let i = 0; i < 3; i++) spawnAt('fuzz', Math.max(10, e.dist - 20 - i * 18));
        addEffect('flash', e.x, e.y, 0, .4);
        toast('灯笼大魔王召唤了小灯笼！');
      } else if (e.bossStage === 1 && ratio < .33) {
        e.bossStage = 2;
        for (let i = 0; i < 4; i++) spawnAt('dango', Math.max(10, e.dist - 20 - i * 18));
        addEffect('flash', e.x, e.y, 0, .4);
      }
    }
  }

  function spawnAt(type, dist) {
    spawnEnemy(type);
    const e = S.enemies[S.enemies.length - 1];
    e.dist = dist;
  }

  function kill(e) {
    if (e.dead) return;
    e.dead = true;
    if (e.prop) {
      if (e.type === 'gift') {
        S.damageBuffT = 15;
        S.damageBuffMult = 1.3;
        addEffect('flash', e.x, e.y, 0, .5);
        addFloat(e.x, e.y - 30, '攻击 +30%', '#f6cf6d');
        toast('礼物开出攻击 +30%，持续 15 秒！');
      } else {
        S.coins += e.reward;
        addEffect('coin', e.x, e.y - 18, 0, .55);
        addFloat(e.x, e.y - 30, `+${e.reward} 币`, '#f6cf6d');
      }
      sfx('coin');
      S.enemies = S.enemies.filter(x => x !== e);
      return;
    }
    S.coins += e.reward;
    addEffect('coin', e.x, e.y - e.radius, 0, .55);
    addEffect('hit', e.x, e.y, 0, .35);
    sfx('coin');
    if (e.split) {
      for (let i = 0; i < 2; i++) {
        spawnAt('mini', Math.max(0, e.dist - 8 - i * 14));
      }
    }
    S.enemies = S.enemies.filter(x => x !== e);
  }

  function leak(e) {
    e.dead = true;
    S.enemies = S.enemies.filter(x => x !== e);
    S.lives--;
    S.shakeT = .45;
    addEffect('leak', S.base.x, S.base.y - 20, 0, .7);
    sfx('leak');
    if (S.lives <= 0 && !S.over) {
      S.lives = 0;
      end(false);
    }
  }

  function end(won) {
    if (S.over) return;
    const g = S;
    S.over = true;
    S.phase = won ? 'won' : 'lost';
    const stars = won ? (S.lives >= S.maxLives ? 3 : S.lives >= Math.ceil(S.maxLives * .6) ? 2 : 1) : 0;
    const result = {
      won, stars,
      lives: S.lives,
      maxLives: S.maxLives,
      level: S.level,
      endless: !!S.endless,
      wave: S.waveIndex + 1,
      coins: won ? S.level.reward + stars * 30 : 0
    };
    if (won) sfx('win'); else sfx('lose');
    setTimeout(() => {
      if (S !== g) return;
      if (won && hooks.onWin) hooks.onWin(result);
      if (!won && hooks.onLose) hooks.onLose(result);
    }, won ? 900 : 700);
  }

  function towerStat(t) {
    const base = TOWERS[t.type].levels[t.level - 1];
    if (!t.branch) return base;
    const def = (BRANCHES[t.type] || []).find(b => b.id === t.branch);
    if (!def) return base;
    const m = def.mods || {};
    return {
      ...base,
      damage: Math.round((base.damage + (m.damageAdd || 0)) * (m.damageMul || 1)),
      range: base.range + (m.rangeAdd || 0),
      rate: base.rate * (m.rateMul || 1),
      slow: (base.slow || 0) + (m.slowAdd || 0),
      slowDur: (base.slowDur || 0) + (m.slowDurAdd || 0),
      stun: (base.stun || 0) + (m.stunAdd || 0),
      aoe: (base.aoe || 0) + (m.aoeAdd || 0),
      splash: m.splash || 0
    };
  }

  function update(dt) {
    if (!S) return;
    if (S.paused || S.over) {
      S.time += dt * (S.paused ? 0 : 1);
      return;
    }
    const step = dt * S.speed;
    S.time += step;

    if (S.bannerT > 0) S.bannerT -= dt;
    if (S.shakeT > 0) S.shakeT -= dt;
    if (S.damageBuffT > 0) S.damageBuffT = Math.max(0, S.damageBuffT - step);
    for (const sk of Object.values(S.skills)) {
      if (sk.cd > 0) sk.cd = Math.max(0, sk.cd - step);
    }

    // 波次：准备倒计时结束自动开下一波，不需要手动点按钮
    if (S.phase === 'prepare') {
      S.prepareT -= dt;
      if (S.prepareT <= 0) startWave();
    }
    if (S.phase === 'wave') {
      S.waveTime += step;
      while (S.queueIndex < S.queue.length && S.queue[S.queueIndex].time <= S.waveTime) {
        spawnEnemy(S.queue[S.queueIndex].enemy);
        S.queueIndex++;
      }
      if (S.queueIndex >= S.queue.length && S.enemies.filter(e => !e.prop).length === 0) {
        if (!S.endless && S.waveIndex >= S.waves.length - 1) {
          end(true);
        } else {
          S.phase = 'prepare';
          S.prepareT = 3;
          S.bannerT = 1.4;
          S.coins += 20;
          toast('这一波清空啦，+20 熊熊币');
          emit(true);
        }
      }
    }

    // 怪物
    for (const e of S.enemies.slice()) {
      if (e.dead) continue;
      e.hitT = Math.max(0, e.hitT - step);
      if (e.prop) continue;
      if (e.type === 'healer') {
        e.healT -= step;
        if (e.healT <= 0) {
          e.healT = 4;
          let healed = false;
          for (const o of S.enemies) {
            if (o === e || o.dead || o.prop || o.hp >= o.maxHp) continue;
            if (dist2(e.x, e.y, o.x, o.y) <= 120 * 120) {
              o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .12);
              healed = true;
            }
          }
          if (healed) {
            addEffect('flash', e.x, e.y, 0, .4, { r: 120 });
            addFloat(e.x, e.y - 40, '+治疗', '#7bc8a4');
          }
        }
      }
      if (e.stun > 0) { e.stun -= step; }
      if (e.slowT > 0) { e.slowT -= step; } else { e.slow = 0; }
      const sp = e.stun > 0 ? 0 : e.speed * (1 - e.slow);
      e.dist += sp * step;
      const pos = S.path.at(e.dist);
      e.x = pos.x; e.y = pos.y;
      if (e.dist >= S.path.total) {
        leak(e);
        if (S.over) return;
      }
    }

    // 保持怪兽之间的安全距离，避免挤成一团
    const walkers = S.enemies
      .filter(e => !e.prop && !e.dead)
      .sort((a, b) => b.dist - a.dist);
    for (let i = 1; i < walkers.length; i++) {
      const front = walkers[i - 1];
      const e = walkers[i];
      const minDist = (front.radius || 16) + (e.radius || 16) + 18;
      if (front.dist - e.dist < minDist) {
        e.dist = Math.max(0, front.dist - minDist);
        const pos = S.path.at(e.dist);
        e.x = pos.x; e.y = pos.y;
      }
    }

    // 塔
    for (const t of S.towers) {
      const st = towerStat(t);
      t.cooldown -= step;
      t.recoil = Math.max(0, t.recoil - step * 4);
      let target = null, bestD = -1;
      for (const e of S.enemies) {
        if (e.dead) continue;
        const d = dist2(t.slot.x, t.slot.y, e.x, e.y);
        if (d <= st.range * st.range && e.dist > bestD) { bestD = e.dist; target = e; }
      }
      if (target) {
        t.angle = Math.atan2(target.y - (t.slot.y - 20), target.x - t.slot.x);
      }
      if (t.cooldown <= 0 && target) {
        t.cooldown = 1 / st.rate;
        t.recoil = 1;
        fire(t, target, st);
      }
    }

    // 子弹
    for (const p of S.projectiles) {
      if (p.dead) continue;
      const target = p.target;
      if (target && !target.dead) {
        p.tx = target.x; p.ty = target.y - 6;
      }
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const move = p.speed * step;
      if (d <= move + 4) {
        p.x = p.tx; p.y = p.ty;
        p.dead = true;
        if (target && !target.dead) {
          damage(target, p.damage, 'projectile');
          if (p.splash) {
            for (const e of S.enemies.slice()) {
              if (e === target || e.dead || e.prop) continue;
              if (dist2(p.tx, p.ty, e.x, e.y) <= p.splash * p.splash) {
                damage(e, p.damage * .6, 'splash');
              }
            }
            addEffect('flash', p.tx, p.ty, 0, .3, { r: p.splash });
          }
        }
        addEffect('hit', p.tx, p.ty, 0, .3, { color: p.color });
      } else {
        p.x += dx / d * move;
        p.y += dy / d * move;
        p.angle = Math.atan2(dy, dx);
      }
    }
    S.projectiles = S.projectiles.filter(p => !p.dead);

    // 特效 & 飘字
    for (const fx of S.effects) fx.t += step;
    S.effects = S.effects.filter(fx => fx.t < fx.life);
    for (const f of S.floats) { f.t += step; f.y -= 26 * step; }
    S.floats = S.floats.filter(f => f.t < f.life);

    // 叶子
    for (const l of S.leaves) {
      l.x += l.vx * step;
      l.y += l.vy * step;
      l.r += l.vr * step;
      if (l.y > 740 || l.x < -40) { l.x = 1300; l.y = -20 - Math.random() * 200; }
    }

    emit(false);
  }

  function fire(t, target, st) {
    if (t.type === 'honey') {
      // 范围减速
      for (const e of S.enemies.slice()) {
        if (e.dead) continue;
        if (dist2(t.slot.x, t.slot.y, e.x, e.y) <= st.range * st.range) {
          if (e.shieldHp <= 0) {
            e.slow = Math.max(e.slow, st.slow);
            e.slowT = Math.max(e.slowT, st.slowDur);
          }
          damage(e, st.damage, 'honey');
        }
      }
      addEffect('honey', t.slot.x, t.slot.y - 18, 0, .55, { range: st.range });
      sfx('honey');
      return;
    }
    if (t.type === 'camera') {
      const cx = target.x, cy = target.y;
      for (const e of S.enemies.slice()) {
        if (e.dead) continue;
        if (dist2(cx, cy, e.x, e.y) <= (st.aoe || 60) ** 2) {
          if (e.shieldHp <= 0) e.stun = Math.max(e.stun, st.stun);
          damage(e, st.damage, 'camera');
        }
      }
      addEffect('flash', cx, cy, 0, .45, { r: st.aoe || 60 });
      sfx('camera');
      return;
    }
    S.projectiles.push({
      x: t.slot.x, y: t.slot.y - 28,
      tx: target.x, ty: target.y - 6,
      target, damage: st.damage,
      splash: st.splash || 0,
      speed: t.type === 'dart' ? 760 : 560,
      type: t.type,
      angle: t.angle,
      color: t.type === 'dart' ? '#d94a3d' : '#8a6a4a',
      dead: false
    });
    sfx(t.type === 'dart' ? 'dart' : 'sling');
  }

  function render() {
    if (!S) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ART.drawBackground(ctx, S.bgImg, S.level.tint, S.time);
    ART.drawPath(ctx, S.level.path, { time: S.time });

    // 起点旗
    const start = S.path.at(0);
    const flagX = Math.max(36, start.x + 38);
    ctx.save();
    ctx.translate(flagX, start.y);
    ctx.strokeStyle = ART.INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -52); ctx.stroke();
    ctx.fillStyle = '#d94a3d'; ctx.strokeStyle = ART.INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(34, -40); ctx.lineTo(0, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // 自由建塔预览
    if (S.buildType && S.hover) {
      const ok = canPlaceAt(S.hover.x, S.hover.y).ok;
      const st = TOWERS[S.buildType].levels[0];
      ctx.save();
      ctx.beginPath(); ctx.arc(S.hover.x, S.hover.y, st.range, 0, Math.PI * 2);
      ctx.fillStyle = ok ? 'rgba(143,214,180,.16)' : 'rgba(217,74,61,.12)'; ctx.fill();
      ctx.strokeStyle = ok ? 'rgba(75,110,80,.55)' : 'rgba(217,74,61,.5)';
      ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.restore();
      ctx.save();
      ctx.globalAlpha = .55;
      ART.drawTower(ctx, S.hover.x, S.hover.y - 8, .95, S.buildType, 1, { angle: -0.5 });
      ctx.restore();
    }

    // 终点景点（中国站用黄鹤楼风格景区，不再放一二布布）
    if (S.level.chapter === '中国') {
      ART.drawLandmark(ctx, S.base.x - 8, S.base.y + 2, .95, S.level.chapter, { t: S.time });
    } else {
      ART.drawBase(ctx, S.base.x, S.base.y - 10, S.outfit, {
        bob: Math.sin(S.time * 2) * 2,
        expression: S.shakeT > 0 ? 'scared' : (S.over && S.phase === 'won' ? 'cheer' : 'normal'),
        shake: S.shakeT > 0,
        t: S.time
      });
    }

    // 塔
    const sortedTowers = S.towers.slice().sort((a, b) => a.slot.y - b.slot.y);
    for (const t of sortedTowers) {
      const st = towerStat(t);
      if (S.selectedTower === t) {
        ctx.save();
        ctx.beginPath(); ctx.arc(t.slot.x, t.slot.y, st.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(142,202,230,.13)'; ctx.fill();
        ctx.strokeStyle = 'rgba(75,43,32,.35)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.stroke();
        ctx.restore();
      }
      ART.drawTower(ctx, t.slot.x, t.slot.y - 8, .95, t.type, t.level, {
        recoil: t.recoil, angle: t.angle
      });
    }

    // 怪物
    const sortedEnemies = S.enemies.slice().sort((a, b) => a.y - b.y);
    for (const e of sortedEnemies) {
      const stun = e.stun > 0;
      if (e.prop) {
        ART.drawProp(ctx, e.x, e.y, 1, e.type, { t: S.time });
      } else {
        ART.drawEnemy(ctx, e.x, e.y - 8, 1, e.type, {
          slow: e.slowT > 0, stun, t: S.time
        });
      }
      // 血条
      if (!e.dead && e.hp < e.maxHp) {
        const w = e.boss ? 92 : e.prop ? 34 : 42;
        const h = e.boss ? 8 : 5;
        const y = e.y - (e.boss ? 118 : e.prop ? 44 : 48);
        ctx.fillStyle = 'rgba(42,24,18,.35)';
        ctx.beginPath(); ctx.roundRect(e.x - w / 2, y, w, h, 3); ctx.fill();
        const pct = clamp(e.hp / e.maxHp, 0, 1);
        ctx.fillStyle = e.prop ? '#f6cf6d' : pct > .5 ? '#7bc8a4' : pct > .25 ? '#f2b84b' : '#d94a3d';
        ctx.beginPath(); ctx.roundRect(e.x - w / 2, y, w * pct, h, 3); ctx.fill();
        if (e.boss) {
          ctx.fillStyle = '#fff6e2'; ctx.font = 'bold 12px "Microsoft YaHei"'; ctx.textAlign = 'center';
          ctx.fillText('灯笼大魔王', e.x, y - 6);
        }
      }
    }

    // 子弹
    for (const p of S.projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle || 0);
      if (p.type === 'dart') {
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(6, 0); ctx.stroke();
        ctx.fillStyle = '#d94a3d'; ctx.strokeStyle = ART.INK; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(2, -5); ctx.lineTo(2, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f2b84b';
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-18, -5); ctx.lineTo(-18, 5); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#9fb3c8'; ctx.strokeStyle = ART.INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }

    // 特效
    for (const fx of S.effects) {
      if (fx.t < 0) continue;
      const p = clamp(fx.t / fx.life, 0, 1);
      if (fx.type === 'hit') {
        ART.drawHit(ctx, fx.x, fx.y, p, fx.data.color || '#f6cf6d');
      } else if (fx.type === 'coin') {
        ART.drawCoinPop(ctx, fx.x, fx.y, p);
      } else if (fx.type === 'flash') {
        ctx.save();
        ctx.globalAlpha = (1 - p) * .85;
        const g = ctx.createRadialGradient(fx.x, fx.y, 4, fx.x, fx.y, (fx.data.r || 70) * (0.6 + p));
        g.addColorStop(0, '#fff');
        g.addColorStop(.5, 'rgba(255,246,226,.9)');
        g.addColorStop(1, 'rgba(255,246,226,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, (fx.data.r || 70) * (0.6 + p), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (fx.type === 'honey') {
        ctx.save();
        ctx.globalAlpha = (1 - p) * .45;
        ctx.fillStyle = '#e0a63a';
        ctx.beginPath(); ctx.arc(fx.x, fx.y, (fx.data.range || 140) * p, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (fx.type === 'build') {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = '#f2b84b'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, 20 + p * 34, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      } else if (fx.type === 'upgrade') {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + p;
          ART.star(ctx, fx.x + Math.cos(a) * (20 + p * 40), fx.y + Math.sin(a) * (20 + p * 40), 6, '#f6cf6d', ART.INK, 1.5);
        }
        ctx.restore();
      } else if (fx.type === 'leak') {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ART.heart(ctx, fx.x, fx.y - p * 40, 26, '#d94a3d', ART.INK, 3);
        ctx.restore();
      }
    }

    // 飘字
    ctx.textAlign = 'center';
    for (const f of S.floats) {
      ctx.save();
      ctx.globalAlpha = 1 - f.t / f.life;
      ctx.font = 'bold 15px "Microsoft YaHei"';
      ctx.fillStyle = f.color;
      ctx.strokeStyle = 'rgba(42,24,18,.55)'; ctx.lineWidth = 3;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    // 叶子
    for (const l of S.leaves) {
      ART.drawLeaf(ctx, l.x, l.y, l.r, l.s > 1 ? '#c96a3f' : '#e0a63a');
    }

    // 波次横幅
    if (S.bannerT > 0 && S.phase === 'wave') {
      ctx.save();
      ctx.globalAlpha = Math.min(1, S.bannerT * 2);
      ctx.textAlign = 'center';
      ctx.font = '900 46px "Microsoft YaHei"';
      ctx.strokeStyle = ART.INK; ctx.lineWidth = 10;
      ctx.strokeText(`第 ${S.waveIndex + 1} 波`, 640, 210);
      ctx.fillStyle = '#fff6e2';
      ctx.fillText(`第 ${S.waveIndex + 1} 波`, 640, 210);
      ctx.restore();
    }
  }

  function loop(now) {
    if (!S) return;
    const dt = Math.min(.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }

  function snapshot() {
    if (!S) return null;
    const sel = S.selectedTower;
    const st = sel ? towerStat(sel) : null;
    return {
      coins: S.coins,
      lives: S.lives,
      maxLives: S.maxLives,
      wave: S.waveIndex + 1,
      totalWaves: S.endless ? Math.max(1, S.waveIndex + 1) : S.waves.length,
      endless: !!S.endless,
      phase: S.phase,
      prepareT: Math.max(0, S.prepareT),
      damageBuffT: Math.max(0, S.damageBuffT),
      skills: {
        freeze: { cd: S.skills.freeze.cd, max: S.skills.freeze.max },
        bomb: { cd: S.skills.bomb.cd, max: S.skills.bomb.max }
      },
      aiming: S.aiming,
      over: S.over,
      paused: S.paused,
      speed: S.speed,
      buildType: S.buildType,
      canStartWave: S.phase === 'prepare' && !S.over,
      selected: sel ? {
        type: sel.type,
        name: TOWERS[sel.type].name,
        level: sel.level,
        max: 3,
        stats: st,
        upgradeCost: sel.level < 3 ? TOWERS[sel.type].levels[sel.level - 1].cost : 0,
        sell: Math.floor(sel.spent * .6),
        branch: sel.branch || '',
        branchName: sel.branchName || '',
        branches: sel.level >= 3 && !sel.branch ? (BRANCHES[sel.type] || []) : []
      } : null,
      towers: Object.fromEntries(TOWER_ORDER.map(id => [id, {
        unlocked: S.level.towers.includes(id),
        affordable: S.coins >= TOWERS[id].cost,
        cost: TOWERS[id].cost
      }]))
    };
  }

  function emit(force) {
    if (!S) return;
    const now = performance.now();
    if (!force && now - emitAt < 90) return;
    emitAt = now;
    if (hooks.onState) hooks.onState(snapshot());
  }

  function getS() { return S; }

  function debugBuild(index, type) {
    if (!S) return;
    const slot = S.slots[index];
    if (!slot || slot.tower) return;
    S.coins += TOWERS[type].cost;
    S.buildType = type;
    buildAt(slot);
  }

  function debugClearWave() {
    if (!S) return;
    S.queueIndex = S.queue.length;
    for (const e of S.enemies.slice()) { e.hp = 0; kill(e); }
  }

  function debugFinish(won = true) {
    if (!S) return;
    end(!!won);
  }

  return {
    init, start, stop, pause, setSpeed,
    selectBuild, deselect, upgrade, sell, startWave, useSkill, chooseBranch,
    snapshot, getS, debugBuild, debugClearWave, debugFinish
  };
})();
