/* 一二布布环游世界 — 界面、存档、换装、流程 */
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const params = new URLSearchParams(location.search);
  window.__errors = [];
  window.addEventListener('error', e => {
    window.__errors.push(`${e.message} @${e.filename || ''}:${e.lineno || ''}`);
  });
  window.addEventListener('unhandledrejection', e => {
    window.__errors.push(`promise: ${e.reason}`);
  });
  const DEFAULT_SAVE = {
    coins: 0, stars: {}, cleared: [], outfit: 'travel', owned: ['travel'],
    stampCn: false, sound: true, seenIntro: false, seenCnStart: false, seenCnEnd: false,
    endlessBest: 0
  };

  let save = loadSave();
  let previewOutfit = save.outfit;
  let currentScreen = 'loading';
  let menuRaf = 0, wardrobeRaf = 0, menuT = 0, wardrobeT = 0;
  let tipTimer = 0;
  let lastLevel = null;
  let lastResult = null;
  let journalPreload = false;
  const JOURNAL_TYPES = ['fuzz', 'dango', 'can', 'pudding', 'shield', 'healer', 'boss'];

  if (params.get('fresh') === '1') {
    save = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    persist();
  }

  /* ---------------- 存档 ---------------- */
  function loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return Object.assign({}, DEFAULT_SAVE, s, {
          stars: Object.assign({}, s.stars || {}),
          owned: Array.isArray(s.owned) && s.owned.length ? s.owned : ['travel']
        });
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  function outfitById(id) {
    return OUTFITS.find(o => o.id === id) || OUTFITS[0];
  }
  function currentOutfit() { return outfitById(save.outfit); }

  function stampCount() {
    return save.stampCn ? 1 : 0;
  }

  /* ---------------- 声音 ---------------- */
  const Sound = (() => {
    let ctx = null, master = null, bgmTimer = 0, bgmStep = 0, enabled = true;

    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = .5;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function beep(freq, dur, type = 'sine', vol = .12, when = 0, slide = 0) {
      const c = ensure(); if (!c) return;
      const t = c.currentTime + when;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .012);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + .02);
    }

    const notes = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 261.63];

    function startBgm() {
      if (!enabled || bgmTimer) return;
      ensure();
      bgmTimer = setInterval(() => {
        if (!enabled) return;
        const f = notes[bgmStep % notes.length];
        beep(f, .55, 'triangle', .028);
        if (bgmStep % 4 === 0) beep(f / 2, .7, 'sine', .018);
        bgmStep++;
      }, 820);
    }
    function stopBgm() {
      if (bgmTimer) clearInterval(bgmTimer);
      bgmTimer = 0;
    }
    function setEnabled(v) {
      enabled = !!v;
      if (enabled) startBgm(); else stopBgm();
    }

    function sfx(name) {
      if (!enabled) return;
      ensure();
      switch (name) {
        case 'click': beep(520, .05, 'square', .035); break;
        case 'build': beep(300, .1, 'triangle', .08, 0, 1.3); break;
        case 'upgrade': [523, 659, 784].forEach((f, i) => beep(f, .12, 'triangle', .07, i * .06)); break;
        case 'dart': beep(880, .04, 'square', .03); break;
        case 'sling': beep(240, .06, 'triangle', .06, 0, .7); break;
        case 'honey': beep(180, .12, 'sine', .06, 0, .8); break;
        case 'camera': beep(1200, .04, 'square', .04); beep(700, .08, 'sine', .03, .04); break;
        case 'coin': beep(988, .06, 'triangle', .05); beep(1319, .08, 'triangle', .04, .05); break;
        case 'leak': beep(180, .18, 'sawtooth', .06, 0, .5); break;
        case 'wave': beep(392, .12, 'triangle', .06); beep(523, .14, 'triangle', .05, .1); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => beep(f, .18, 'triangle', .07, i * .1)); break;
        case 'lose': [392, 330, 262].forEach((f, i) => beep(f, .2, 'sine', .07, i * .12)); break;
        default: beep(440, .05, 'sine', .03);
      }
    }

    return { ensure, startBgm, stopBgm, setEnabled, sfx };
  })();

  Sound.setEnabled(save.sound !== false);

  /* ---------------- 通用 ---------------- */
  function show(id) {
    currentScreen = id;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (menuRaf) { cancelAnimationFrame(menuRaf); menuRaf = 0; }
    if (wardrobeRaf) { cancelAnimationFrame(wardrobeRaf); wardrobeRaf = 0; }
    if (id === 'screen-menu') startMenuLoop();
    if (id === 'screen-wardrobe') startWardrobeLoop();
    if (id === 'screen-map') renderMap();
    if (id === 'screen-levels') renderLevels();
    if (id === 'screen-journal') renderJournal();
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const smallLandscape = w <= 1100 && h <= 620 && w > h;
    const mobile = coarse || smallLandscape;
    let scale = Math.min(w / 1280, h / 720);
    let safeY = 0;
    if (mobile && w > h) {
      const cover = Math.max(w / 1280, h / 720);
      if (cover > scale) {
        scale = cover;
        safeY = Math.max(0, (720 * scale - h) / (2 * scale));
      }
    }
    stage.style.setProperty('--safe-y', `${safeY}px`);
    stage.style.transform = `translate(${(w - 1280 * scale) / 2}px, ${(h - 720 * scale) / 2}px) scale(${scale})`;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();

  let toastTimer = 0;
  function toast(msg, ms = 1900) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  function drawMiniBear(canvas, who, outfit, expression = 'normal', scale = .34) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = 62 * dpr;
    canvas.height = 78 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 62, 78);
    ART.drawBear(ctx, 31, 74, scale, { who, outfit, expression, bob: 0 });
  }

  /* ---------------- 主菜单 ---------------- */
  function startMenuLoop() {
    if (menuRaf) cancelAnimationFrame(menuRaf);
    const c = $('menu-bears');
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== 560 * dpr) { c.width = 560 * dpr; c.height = 330 * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = () => {
      if (currentScreen !== 'screen-menu') { menuRaf = 0; return; }
      menuT += .016;
      ctx.clearRect(0, 0, 560, 330);
      const outfit = currentOutfit();
      // 云朵
      ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(90, 68, 58, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(440, 50, 44, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ART.drawSeagull(ctx, 424, 92, .48, {});
      ART.drawBear(ctx, 196, 302, .94, {
        who: 'yier', outfit, expression: 'happy', bob: Math.sin(menuT * 2) * 3
      });
      ART.drawBear(ctx, 356, 302, .94, {
        who: 'bubu', outfit, expression: 'happy', bob: Math.sin(menuT * 2 + 1.2) * 3
      });
      menuRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  /* ---------------- 世界地图 ---------------- */
  function renderMap() {
    $('map-coins').textContent = save.coins;
    const route = $('map-route');
    route.innerHTML = COUNTRIES.map(c => {
      const stamp = (c.id === 'cn' && save.stampCn);
      const unlocked = c.available;
      return `
        <div class="country-card ${unlocked ? 'unlocked' : 'locked'}" data-country="${c.id}">
          <img src="${c.img}" alt="${c.name}">
          <div class="cc-shade"></div>
          <div class="cc-badge">${unlocked ? '现在出发' : '敬请期待'}</div>
          ${stamp ? '<div class="cc-stamp">印</div>' : ''}
          <div class="cc-copy">
            <div class="cc-name">${c.emoji} ${c.name}</div>
            <div class="cc-tag">${c.tag}</div>
          </div>
        </div>`;
    }).join('');
    route.querySelectorAll('.country-card').forEach(el => {
      el.addEventListener('click', () => {
        const c = COUNTRIES.find(x => x.id === el.dataset.country);
        if (!c.available) { toast('这一站还在施工，先去中国站攒熊熊币吧。'); return; }
        Sound.sfx('click');
        renderLevels();
        show('screen-levels');
      });
    });
  }

  /* ---------------- 关卡选择 ---------------- */
  function isLevelUnlocked(idx) {
    if (idx === 0) return true;
    const prev = LEVELS[idx - 1];
    return (save.stars[prev.id] || 0) > 0;
  }

  function renderLevels() {
    $('levels-coins').textContent = save.coins;
    $('levels-title').textContent = '中国 · 汉字之城';
    const wrap = $('level-path');
    wrap.innerHTML = LEVELS.map((l, i) => {
      const unlocked = isLevelUnlocked(i);
      const stars = save.stars[l.id] || 0;
      const starHtml = [0, 1, 2].map(k => `<span class="${k < stars ? 'on' : ''}">★</span>`).join('');
      return `
        <div class="level-node ${unlocked ? '' : 'locked'} ${l.boss ? 'ln-boss' : ''}" data-level="${l.id}">
          <div class="ln-map"><canvas width="140" height="68"></canvas></div>
          <div class="ln-circle">
            ${unlocked ? (l.boss ? '王' : (i + 1)) : '🔒'}
            <small>${l.boss ? 'BOSS' : '第 ' + (i + 1) + ' 关'}</small>
          </div>
          <div class="ln-stars">${starHtml}</div>
          <div class="ln-name">${l.name}</div>
        </div>`;
    }).join('');
    wrap.querySelectorAll('.level-node').forEach(el => {
      const l = LEVELS.find(x => x.id === el.dataset.level);
      const cv = el.querySelector('.ln-map canvas');
      if (cv) {
        const ctx = cv.getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = 140 * dpr; cv.height = 68 * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ART.drawMiniPath(ctx, l, 140, 68);
      }
      el.addEventListener('click', () => {
        const idx = LEVELS.indexOf(l);
        if (!isLevelUnlocked(idx)) { toast('先通关上一关，才能继续往前走。'); return; }
        Sound.sfx('click');
        if (l.id === 'cn1' && !save.seenCnStart) {
          save.seenCnStart = true; persist();
          playStory(STORY.cnStart, () => startLevel(l));
        } else {
          startLevel(l);
        }
      });
    });
    drawLevelBears();
  }

  function drawLevelBears() {
    const c = $('levels-bears');
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== 360 * dpr) { c.width = 360 * dpr; c.height = 240 * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 360, 240);
    const outfit = currentOutfit();
    ART.drawBear(ctx, 118, 222, .72, { who: 'yier', outfit, expression: 'happy', bob: Math.sin(menuT) * 2 });
    ART.drawBear(ctx, 238, 222, .72, { who: 'bubu', outfit, expression: 'normal', bob: Math.sin(menuT + 1) * 2 });
  }

  /* ---------------- 衣柜 ---------------- */
  function startWardrobeLoop() {
    if (wardrobeRaf) cancelAnimationFrame(wardrobeRaf);
    const c = $('wardrobe-canvas');
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== 980 * dpr) { c.width = 980 * dpr; c.height = 330 * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = () => {
      if (currentScreen !== 'screen-wardrobe') { wardrobeRaf = 0; return; }
      wardrobeT += .016;
      ctx.clearRect(0, 0, 980, 330);
      // 背景光
      const g = ctx.createRadialGradient(490, 160, 40, 490, 160, 420);
      g.addColorStop(0, 'rgba(255,253,247,.9)');
      g.addColorStop(1, 'rgba(255,248,236,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 980, 330);
      // 地毯
      ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#f7d9b0';
      ctx.beginPath(); ctx.ellipse(490, 310, 330, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // 衣架线
      ctx.strokeStyle = 'rgba(75,43,32,.18)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(80, 40); ctx.lineTo(900, 40); ctx.stroke();
      ART.drawBear(ctx, 360, 302, 1.05, {
        who: 'yier', outfit: outfitById(previewOutfit), expression: 'happy', bob: Math.sin(wardrobeT * 2) * 2.5
      });
      ART.drawBear(ctx, 620, 302, 1.05, {
        who: 'bubu', outfit: outfitById(previewOutfit), expression: 'happy', bob: Math.sin(wardrobeT * 2 + 1.1) * 2.5
      });
      wardrobeRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function renderWardrobe() {
    $('wardrobe-coins').textContent = save.coins;
    $('wardrobe-label').textContent = outfitById(previewOutfit).name;
    const grid = $('outfit-grid');
    grid.innerHTML = OUTFITS.map(o => {
      const owned = save.owned.includes(o.id);
      const isWorld = o.id === 'world';
      const locked = isWorld && stampCount() < 6;
      const selected = previewOutfit === o.id;
      const priceText = owned ? '<div class="oc-owned">已拥有</div>'
        : locked ? '<div class="oc-price">集齐 6 国</div>'
        : `<div class="oc-price">${o.price} 熊熊币</div>`;
      return `
        <div class="outfit-card ${selected ? 'selected' : ''} ${(!owned && isWorld && stampCount() < 6) ? 'locked' : ''}" data-outfit="${o.id}">
          <canvas width="62" height="78"></canvas>
          <div>
            <div class="oc-name">${o.name}</div>
            ${priceText}
          </div>
        </div>`;
    }).join('');
    grid.querySelectorAll('.outfit-card').forEach(el => {
      const o = OUTFITS.find(x => x.id === el.dataset.outfit);
      const canvas = el.querySelector('canvas');
      drawMiniBear(canvas, 'yier', o, 'happy', .34);
      el.addEventListener('click', () => {
        previewOutfit = o.id;
        Sound.sfx('click');
        renderWardrobe();
      });
    });
    updateWearButton();
    startWardrobeLoop();
  }

  function updateWearButton() {
    const o = outfitById(previewOutfit);
    const owned = save.owned.includes(o.id);
    const isWorld = o.id === 'world';
    const locked = isWorld && stampCount() < 6;
    const btn = $('btn-wear');
    if (owned) {
      btn.textContent = save.outfit === o.id ? '正穿着这套' : '穿上这套';
      btn.disabled = save.outfit === o.id;
      $('wardrobe-hint').textContent = '选一套喜欢的，两只熊一起换。';
    } else if (locked) {
      btn.textContent = '需要 6 枚国家印章';
      btn.disabled = true;
      $('wardrobe-hint').textContent = '集齐六个国家的印章，就能解锁环球斗篷。';
    } else {
      btn.textContent = `购买并穿上 · ${o.price}`;
      btn.disabled = save.coins < o.price;
      $('wardrobe-hint').textContent = save.coins < o.price ? `还差 ${o.price - save.coins} 枚熊熊币。` : '买下这套，两只熊一起换。';
    }
  }

  function wearOutfit() {
    const o = outfitById(previewOutfit);
    if (save.owned.includes(o.id)) {
      save.outfit = o.id;
      persist();
      toast(`换好啦：${o.name}`);
      renderWardrobe();
      return;
    }
    if (o.id === 'world' && stampCount() < 6) { toast('先集齐六国印章吧。'); return; }
    if (save.coins < o.price) { toast(`还差 ${o.price - save.coins} 枚熊熊币。`); return; }
    save.coins -= o.price;
    save.owned.push(o.id);
    save.outfit = o.id;
    persist();
    Sound.sfx('upgrade');
    toast(`买到了：${o.name}`);
    renderWardrobe();
  }

  /* ---------------- 手账 ---------------- */
  function renderJournal() {
    $('journal-coins').textContent = save.coins;
    const sg = $('stamp-grid');
    sg.innerHTML = COUNTRIES.map(c => {
      const got = c.id === 'cn' && save.stampCn;
      return `<div class="stamp-card ${got ? '' : 'off'}">${got ? '中国<br>印章' : '未收集'}</div>`;
    }).join('');
    const mg = $('monster-grid');
    const types = JOURNAL_TYPES;
    mg.innerHTML = types.map(t => `
      <div class="monster-card">
        <canvas width="56" height="56"></canvas>
        <span>${ENEMIES[t].name}</span>
      </div>`).join('');
    drawJournalMonsters();
    if (!journalPreload) {
      journalPreload = true;
      setTimeout(() => {
        if (currentScreen === 'screen-journal') drawJournalMonsters();
      }, 800);
    }
  }

  function drawJournalMonsters() {
    const mg = $('monster-grid');
    if (!mg) return;
    mg.querySelectorAll('.monster-card canvas').forEach((canvas, i) => {
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = 56 * dpr; canvas.height = 56 * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 56, 56);
      ART.drawEnemy(ctx, 28, 40, JOURNAL_TYPES[i] === 'boss' ? .42 : .9, JOURNAL_TYPES[i], {});
    });
  }

  /* ---------------- 游戏 ---------------- */
  let gameInited = false;

  function initGame() {
    if (gameInited) return;
    gameInited = true;
    GAME.init($('game-canvas'), {
      onState: updateHUD,
      onWin: handleWin,
      onLose: handleLose,
      onToast: toast,
      onSfx: n => Sound.sfx(n)
    });
    buildBuildBar();
    $('wave-action').style.display = 'none';
    $('skill-freeze').addEventListener('click', () => {
      GAME.useSkill('freeze');
      updateHUD(GAME.snapshot());
    });
    $('skill-bomb').addEventListener('click', () => {
      GAME.useSkill('bomb');
      updateHUD(GAME.snapshot());
    });
    $('btn-upgrade').addEventListener('click', () => GAME.upgrade());    $('btn-sell').addEventListener('click', () => GAME.sell());
    $('panel-close').addEventListener('click', () => {
      GAME.deselect();
      hideTowerPanel();
    });
    $('btn-speed').addEventListener('click', () => {
      const s = GAME.getS(); if (!s) return;
      GAME.setSpeed(s.speed === 1 ? 2 : 1);
      Sound.sfx('click');
    });
    $('btn-fullscreen').addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
        Sound.sfx('click');
        setTimeout(resize, 120);
      } catch (e) {
        toast('这个浏览器不支持全屏，可以试着横屏玩。');
      }
    });
    $('btn-pause').addEventListener('click', () => {
      const s = GAME.getS(); if (!s) return;
      GAME.pause(!s.paused);
      $('pause-overlay').classList.toggle('show', s.paused);
      Sound.sfx('click');
    });
    $('btn-resume').addEventListener('click', () => {
      GAME.pause(false);
      $('pause-overlay').classList.remove('show');
    });
    $('btn-quit').addEventListener('click', () => {
      GAME.stop();
      $('pause-overlay').classList.remove('show');
      show('screen-map');
    });
    $('tip-next').addEventListener('click', hideTip);
    window.addEventListener('keydown', e => {
      if (currentScreen !== 'screen-game') return;
      const s = GAME.getS(); if (!s) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (s.over) return;
        GAME.pause(!s.paused);
        $('pause-overlay').classList.toggle('show', s.paused);
      } else if (['1','2','3','4'].includes(e.key)) {
        GAME.selectBuild(TOWER_ORDER[Number(e.key) - 1]);
      } else if (e.key === 'Escape') {
        s.buildType = null; s.selectedTower = null; s.selectedSlot = null;
        updateHUD(GAME.snapshot());
        hideTowerPanel();
      }
    });
  }

  function buildBuildBar() {
    const bar = $('buildbar');
    bar.innerHTML = TOWER_ORDER.map((id, i) => {
      const t = TOWERS[id];
      return `
        <button class="build-card" data-tower="${id}">
          <canvas width="52" height="52"></canvas>
          <div>
            <div class="bc-name">${t.name}</div>
            <div class="bc-cost">${t.cost} 币</div>
            <div class="bc-key">快捷键 ${i + 1}</div>
          </div>
        </button>`;
    }).join('');
    bar.querySelectorAll('.build-card').forEach(el => {
      const id = el.dataset.tower;
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = 52 * dpr; canvas.height = 52 * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 52, 52);
      ART.drawTower(ctx, 26, 36, .52, id, 1, { angle: -0.5 });
      el.addEventListener('click', () => GAME.selectBuild(id));
    });
  }

  function updateHUD(s) {
    if (!s) return;
    $('hud-coins').textContent = s.coins;
    $('hud-lives').textContent = `❤ ${s.lives}`;
    $('btn-speed').textContent = `${s.speed}×`;

    const bp = $('buff-pill');
    if (s.damageBuffT > 0) {
      bp.style.display = 'inline-flex';
      bp.textContent = `攻击 +30% · ${Math.ceil(s.damageBuffT)}s`;
    } else {
      bp.style.display = 'none';
    }
    for (const key of ['freeze', 'bomb']) {
      const el = $('skill-' + key);
      const sk = s.skills[key];
      el.classList.toggle('cooling', sk.cd > 0);
      el.classList.toggle('aiming', key === 'bomb' && s.aiming === 'bomb');
      el.querySelector('.cd-text').textContent = sk.cd > 0 ? Math.ceil(sk.cd) + 's' : '';
    }
    $('game-canvas').style.cursor = s.aiming === 'bomb' || s.buildType ? 'crosshair' : '';

    let waveText = '准备中';
    if (s.over) waveText = s.phase === 'won' ? '通关！' : '失败';
    else if (s.phase === 'prepare') {
      const sec = Math.max(0, Math.ceil(s.prepareT || 0));
      waveText = s.wave === 0 ? `第 1 波 · ${sec}s` : `第 ${s.wave + 1} 波 · ${sec}s`;
    } else waveText = s.endless ? `第 ${s.wave} 波 · 无尽` : `第 ${s.wave} / ${s.totalWaves} 波`;
    $('hud-wave').textContent = waveText;

    const dots = $('hud-wave-dots');
    if (s.endless) {
      dots.style.display = 'none';
    } else {
      dots.style.display = 'flex';
      const current = s.phase === 'prepare' ? s.wave : s.wave - 1;
      dots.innerHTML = Array.from({ length: s.totalWaves }, (_, i) => {
        const cls = i < current ? 'done' : i === current ? 'now' : '';
        return `<i class="${cls}"></i>`;
      }).join('');
    }

    // 建造栏
    document.querySelectorAll('.build-card').forEach(el => {
      const id = el.dataset.tower;
      const info = s.towers[id];
      el.classList.toggle('selected', s.buildType === id);
      el.classList.toggle('disabled', !info.unlocked || !info.affordable);
      const name = el.querySelector('.bc-name');
      const cost = el.querySelector('.bc-cost');
      if (!info.unlocked) {
        name.textContent = `${TOWERS[id].name} 🔒`;
        cost.textContent = '下一关解锁';
      } else {
        name.textContent = TOWERS[id].name;
        cost.textContent = `${info.cost} 币`;
      }
    });

    // 塔面板
    if (s.selected) {
      const sel = s.selected;
      $('tower-panel').classList.add('show');
      $('panel-name').textContent = sel.name;
      $('panel-level').textContent = `Lv.${sel.level} / 3`;
      const st = sel.stats;
      let stats = `<span>攻击 ${st.damage}</span><span>射程 ${Math.round(st.range)}</span><span>攻速 ${st.rate.toFixed(2)}/s</span>`;
      if (st.slow) stats += `<span>减速 ${Math.round(st.slow * 100)}%</span>`;
      if (st.stun) stats += `<span>眩晕 ${st.stun}s</span>`;
      $('panel-stats').innerHTML = stats;
      const up = $('btn-upgrade');
      if (sel.branch) {
        up.textContent = `已专精 · ${sel.branchName}`;
        up.disabled = true;
      } else if (sel.level >= 3) {
        up.textContent = '3 级 · 选专精';
        up.disabled = true;
      } else {
        up.textContent = `升级 · ${sel.upgradeCost}`;
        up.disabled = s.coins < sel.upgradeCost;
      }
      const box = $('branch-box');
      if (sel.branches && sel.branches.length) {
        box.innerHTML = '<div class="branch-title">3 级专精 · 二选一</div>' +
          sel.branches.map(b => `<button class="branch-btn" data-branch="${b.id}"><b>${b.name}</b><small>${b.desc}</small></button>`).join('');
        box.querySelectorAll('.branch-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            GAME.chooseBranch(btn.dataset.branch);
            updateHUD(GAME.snapshot());
          });
        });
      } else if (sel.branch) {
        box.innerHTML = `<div class="branch-chosen">专精：${sel.branchName}</div>`;
      } else {
        box.innerHTML = '';
      }
      $('btn-sell').textContent = `拆除 · +${sel.sell}`;
      const icon = $('panel-icon');
      if (!icon.dataset.drawn || icon.dataset.type !== sel.type) {
        icon.innerHTML = '<canvas width="40" height="40"></canvas>';
        const ctx = icon.querySelector('canvas').getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cv = icon.querySelector('canvas');
        cv.width = 40 * dpr; cv.height = 40 * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ART.drawTower(ctx, 20, 28, .38, sel.type, sel.level, { angle: -0.5 });
        icon.dataset.drawn = '1';
        icon.dataset.type = sel.type;
      }
    } else {
      hideTowerPanel();
    }

    // 波次按钮：自动波次，永远隐藏
    const action = $('wave-action');
    if (action) action.style.display = 'none';

    // 提示
    if (s.over) hideTip();
    else updateTip(s);
  }

  function hideTowerPanel() {
    $('tower-panel').classList.remove('show');
  }

  function updateTip(s) {
    const tip = $('tip-bubble');
    if (!s || s.over) { hideTip(); return; }
    const st = GAME.getS();
    if (!st) return;
    const level = st.level;
    if (s.wave >= 1) { hideTip(); return; }
    if (level.id !== 'cn1') {
      if (!tip.dataset.shown || tip.dataset.level !== level.id) {
        tip.dataset.shown = '1';
        tip.dataset.level = level.id;
        $('tip-text').textContent = level.tip;
        tip.classList.add('show');
        clearTimeout(tipTimer);
        tipTimer = setTimeout(hideTip, 8000);
      }
      return;
    }
    // 第一关分步提示
    const built = st.towers.length > 0;
    const upgraded = st.towers.some(t => t.level > 1);
    let text = '';
    if (!built) text = '点地图上的空地，建一座飞镖塔。';
    else if (st.towers.length < 3) text = '再建两座飞镖塔，别让怪走到景区。';
    else if (!upgraded) text = '点塔可以升级，升到 2 级更稳。';
    else if (st.phase === 'prepare') text = '准备好了，下一波会自动开始。';
    else text = '别让怪兽走到景区！';
    if (tip.dataset.text !== text) {
      tip.dataset.text = text;
      $('tip-text').textContent = text;
      tip.classList.add('show');
    }
  }

  function hideTip() {
    $('tip-bubble').classList.remove('show');
    clearTimeout(tipTimer);
  }

  function makeEndlessLevel() {
    const base = LEVELS[4];
    return {
      id: 'endless',
      name: '无尽模式',
      sub: '看你能撑到第几波',
      chapter: '中国',
      path: base.path,
      slots: base.slots,
      waves: [],
      coins: 300,
      lives: 10,
      towers: ['dart', 'sling', 'honey', 'camera'],
      reward: 0,
      tint: base.tint,
      endless: true,
      tip: '无尽模式：每波都会更强，撑得越久越好。'
    };
  }

  function startEndless() {
    Sound.sfx('click');
    startLevel(makeEndlessLevel());
  }

  function startLevel(level, skipStory) {
    lastLevel = level;
    initGame();
    show('screen-game');
    $('pause-overlay').classList.remove('show');
    hideTip();
    hideTowerPanel();
    $('tip-bubble').classList.remove('show');
    $('tip-bubble').dataset.text = '';
    $('tip-bubble').dataset.shown = '';
    $('tip-bubble').dataset.level = '';
    GAME.start(level, currentOutfit(), {
      onState: updateHUD,
      onWin: handleWin,
      onLose: handleLose,
      onToast: toast
    });
    Sound.ensure();
    Sound.startBgm();
  }

  function handleWin(result) {
    const level = result.level;
    const first = !save.cleared.includes(level.id);
    save.stars[level.id] = Math.max(save.stars[level.id] || 0, result.stars);
    if (first) save.cleared.push(level.id);
    const bonus = first ? 50 : 0;
    const earned = result.coins + bonus;
    save.coins += earned;
    if (level.boss) save.stampCn = true;
    persist();
    result.earned = earned;
    result.first = first;
    showResult(result, true);
  }

  function handleLose(result) {
    if (result.endless) {
      save.endlessBest = Math.max(save.endlessBest || 0, result.wave || 1);
      persist();
    }
    showResult(result, false);
  }

  function showResult(result, won) {
    lastResult = result;
    GAME.stop();
    show('screen-result');
    $('result-kicker').textContent = won ? (result.first ? '第一次通关 · 额外 +50' : '关卡完成') : '再来一次';
    $('result-title').textContent = result.level.name;
    $('result-stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < result.stars ? 'on' : ''}">★</span>`).join('');
    $('result-coins').textContent = won ? `+${result.earned || result.coins}` : '+0';
    $('result-stamp-wrap').style.visibility = (won && result.level.boss) ? 'visible' : 'hidden';
    $('result-stamp').textContent = '中国印章';

    if (result.endless) {
      $('result-kicker').textContent = `无尽挑战 · 最高第 ${save.endlessBest || 0} 波`;
      $('result-title').textContent = '无尽模式';
      $('result-stars').innerHTML = '';
      $('result-goals').innerHTML =
        `<span class="result-goal done">撑到第 ${result.wave || 1} 波</span>` +
        `<span class="result-goal">最高第 ${save.endlessBest || 0} 波</span>`;
    } else {
      const goals = [
        { label: '通关', done: won },
        { label: '剩余生命 ≥60%', done: won && result.lives >= Math.ceil(result.maxLives * .6) },
        { label: '不掉血', done: won && result.lives === result.maxLives }
      ];
      $('result-goals').innerHTML = goals.map(g =>
        `<span class="result-goal ${g.done ? 'done' : 'fail'}">${g.done ? '✓' : '×'} ${g.label}</span>`
      ).join('');
    }
    const c = $('result-bears');
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== 420 * dpr) { c.width = 420 * dpr; c.height = 240 * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 420, 240);
    const outfit = currentOutfit();
    ART.drawBear(ctx, 135, 220, .82, { who: 'yier', outfit, expression: won ? 'cheer' : 'scared', bob: Math.sin(menuT) * 2 });
    ART.drawBear(ctx, 285, 220, .82, { who: 'bubu', outfit, expression: won ? 'cheer' : 'scared', bob: Math.sin(menuT + 1) * 2 });
    $('btn-result-next').textContent = result.endless ? '再来一次' : won ? '继续' : '再试一次';
    $('btn-result-replay').style.display = won ? '' : 'none';
    $('btn-result-wardrobe').style.display = won ? '' : 'none';
  }

  $('btn-result-next').addEventListener('click', () => {
    if (!lastResult) { show('screen-map'); return; }
    if (!lastResult.won) { startLevel(lastResult.level); return; }
    const idx = LEVELS.indexOf(lastResult.level);
    if (lastResult.level.boss && !save.seenCnEnd) {
      save.seenCnEnd = true; persist();
      playStory(STORY.cnEnd, () => show('screen-map'));
      return;
    }
    if (idx >= 0 && idx < LEVELS.length - 1) startLevel(LEVELS[idx + 1]);
    else show('screen-map');
  });
  $('btn-result-replay').addEventListener('click', () => {
    if (lastResult) startLevel(lastResult.level);
  });
  $('btn-result-wardrobe').addEventListener('click', () => {
    previewOutfit = save.outfit;
    show('screen-wardrobe');
    renderWardrobe();
  });
  $('btn-result-map').addEventListener('click', () => show('screen-map'));

  /* ---------------- 剧情 ---------------- */
  let storyState = null;

  function playStory(lines, cb) {
    storyState = { lines, i: 0, cb };
    $('story-overlay').classList.add('show');
    renderStory();
  }

  function renderStory() {
    if (!storyState) return;
    const line = storyState.lines[storyState.i];
    $('story-name').textContent = line.who;
    $('story-text').textContent = line.text;
    const c = $('story-portrait');
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== 160 * dpr) { c.width = 160 * dpr; c.height = 160 * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, 160, 160);
    if (line.who === '鸥鸥') {
      ART.drawSeagull(ctx, 80, 108, .9, {});
    } else if (line.who === '灯笼大魔王') {
      ART.drawEnemy(ctx, 80, 118, 1.05, 'boss', {});
    } else {
      const who = line.who === '一二' ? 'yier' : 'bubu';
      const outfit = currentOutfit();
      if (!ART.drawHead(ctx, who, outfit.id, 80, 80, 128)) {
        ART.drawBear(ctx, 80, 154, .62, {
          who,
          outfit,
          expression: 'happy'
        });
      }
    }
    $('story-next').textContent = storyState.i >= storyState.lines.length - 1 ? '出发' : '继续';
  }

  $('story-next').addEventListener('click', () => {
    if (!storyState) return;
    storyState.i++;
    if (storyState.i >= storyState.lines.length) {
      const cb = storyState.cb;
      storyState = null;
      $('story-overlay').classList.remove('show');
      Sound.sfx('click');
      if (cb) cb();
    } else {
      Sound.sfx('click');
      renderStory();
    }
  });

  /* ---------------- 导航 ---------------- */
  $('btn-start').addEventListener('click', () => {
    Sound.ensure(); Sound.startBgm(); Sound.sfx('click');
    if (!save.seenIntro) {
      save.seenIntro = true; persist();
      playStory(STORY.intro, () => show('screen-map'));
    } else {
      show('screen-map');
    }
  });
  $('btn-wardrobe').addEventListener('click', () => {
    previewOutfit = save.outfit;
    show('screen-wardrobe');
    renderWardrobe();
    Sound.sfx('click');
  });
  $('btn-journal').addEventListener('click', () => {
    show('screen-journal');
    Sound.sfx('click');
  });
  $('btn-endless').addEventListener('click', startEndless);
  $('btn-map-back').addEventListener('click', () => show('screen-menu'));
  $('btn-levels-back').addEventListener('click', () => show('screen-map'));
  $('btn-wardrobe-back').addEventListener('click', () => show('screen-menu'));
  $('btn-journal-back').addEventListener('click', () => show('screen-menu'));
  $('btn-wear').addEventListener('click', wearOutfit);
  $('btn-sound-menu').addEventListener('click', () => {
    save.sound = !save.sound;
    persist();
    Sound.setEnabled(save.sound);
    $('btn-sound-menu').textContent = save.sound ? '🔊' : '🔇';
    if (save.sound) Sound.sfx('click');
  });

  $('btn-sound-menu').textContent = save.sound ? '🔊' : '🔇';

  /* ---------------- 启动 ---------------- */
  function boot() {
    // loading 小熊
    const lb = $('loading-bears');
    const c = document.createElement('canvas');
    c.width = 220; c.height = 150;
    lb.appendChild(c);
    const ctx = c.getContext('2d');
    function drawLoadingPlaceholder() {
      ctx.clearRect(0, 0, 220, 150);
      ctx.fillStyle = '#fff8ec'; ctx.strokeStyle = '#4b2b20'; ctx.lineWidth = 3;
      for (const x of [48, 118]) {
        ctx.beginPath(); ctx.roundRect(x, 24, 54, 104, 14); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8d7c0';
        ctx.beginPath(); ctx.arc(x + 27, 58, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 27, 96, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff8ec';
      }
    }
    function drawLoadingBears() {
      ctx.clearRect(0, 0, 220, 150);
      ART.drawBear(ctx, 80, 140, .55, { who: 'yier', outfit: OUTFITS[0], expression: 'happy' });
      ART.drawBear(ctx, 150, 140, .55, { who: 'bubu', outfit: OUTFITS[0], expression: 'happy' });
    }
    drawLoadingPlaceholder();

    const dbgOutfit = params.get('outfit');
    if (dbgOutfit && OUTFITS.some(o => o.id === dbgOutfit)) {
      if (!save.owned.includes(dbgOutfit)) save.owned.push(dbgOutfit);
      save.outfit = dbgOutfit;
      persist();
    }

    ART.whenTravelReady(() => {
      drawLoadingBears();
      setTimeout(() => {
        show('screen-menu');
        const q = params.get('screen');
      if (q === 'map') show('screen-map');
      else if (q === 'levels') show('screen-levels');
      else if (q === 'wardrobe') { previewOutfit = save.outfit; show('screen-wardrobe'); renderWardrobe(); }
      else if (q === 'journal') show('screen-journal');
      else if (q === 'game') {
        const l = findLevel(params.get('level') || 'cn1');
        if (l) startLevel(l);
        if (params.get('autoplay') === '1') {
          setTimeout(() => {
            if (!GAME.getS()) return;
            GAME.debugBuild(0, 'dart');
            GAME.debugBuild(1, 'dart');
            GAME.debugBuild(4, 'sling');
            GAME.startWave();
          }, 800);
        }
      }
      }, 380);
    });
  }

  window.__APP = {
    get save() { return save; },
    show, startLevel,
    reset() { save = JSON.parse(JSON.stringify(DEFAULT_SAVE)); persist(); location.reload(); }
  };

  boot();
})();
