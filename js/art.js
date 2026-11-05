/* 一二布布环游世界 — Canvas 手绘美术 */
const ART = (() => {
  const INK = '#4b2b20';
  const INK2 = '#6b4436';
  const WHITE = '#fffdf7';
  const BROWN = '#c98e63';
  const BROWN_DARK = '#7a4a33';
  const BLUSH = 'rgba(247,150,160,.55)';

  // 豆包生成的角色素材（白底贴纸卡，按服装分目录）
  const OUTFIT_IDS = ['travel', 'cn', 'jp', 'fr', 'gb', 'au', 'gr', 'world'];
  const sprites = { yier: {}, bubu: {}, pair: {} };
  const heads = { yier: {}, bubu: {} };
  function loadSprite(src, bucket, key) {
    if (typeof Image === 'undefined') return Promise.resolve(null);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { bucket[key] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  const travelPromises = [];
  for (const id of OUTFIT_IDS) {
    const ps = [
      loadSprite(`assets/bears/yier-${id}.png`, sprites.yier, id),
      loadSprite(`assets/bears/bubu-${id}.png`, sprites.bubu, id),
      loadSprite(`assets/bears/pair-${id}.png`, sprites.pair, id),
      loadSprite(`assets/bears/yier-head-${id}.png`, heads.yier, id),
      loadSprite(`assets/bears/bubu-head-${id}.png`, heads.bubu, id)
    ];
    if (id === 'travel') travelPromises.push(ps[0], ps[1], ps[2]);
  }
  function whenTravelReady(cb) {
    Promise.race([
      Promise.all(travelPromises),
      new Promise(resolve => setTimeout(resolve, 2500))
    ]).then(cb);
  }
  const monsterSprites = {};
  for (const id of ['fuzz', 'dango', 'can', 'pudding', 'boss']) {
    loadSprite(`assets/monsters/${id}.png`, monsterSprites, id);
  }
  const towerSprites = {};
  for (const id of ['dart', 'sling', 'honey', 'camera']) {
    loadSprite(`assets/towers/${id}.png`, towerSprites, id);
  }
  const propSprites = {};
  for (const id of ['chest', 'luckybag']) {
    loadSprite(`assets/props/${id}.png`, propSprites, id);
  }


  function circle(ctx, x, y, r, fill, stroke = INK, lw = 5) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke = INK, lw = 5, rot = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function rr(ctx, x, y, w, h, r, fill, stroke = INK, lw = 5) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function capsule(ctx, x1, y1, x2, y2, r, fill, stroke = INK, lw = 5) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.arc(x1, y1, r, a + Math.PI / 2, a - Math.PI / 2);
    ctx.arc(x2, y2, r, a - Math.PI / 2, a + Math.PI / 2);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function poly(ctx, pts, fill, stroke = INK, lw = 5, close = true) {
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (close) ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function star(ctx, x, y, r, fill, stroke = INK, lw = 3, points = 5) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + i * Math.PI / points;
      const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function heart(ctx, x, y, s, fill, stroke = INK, lw = 3) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s / 20, s / 20);
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-24, -8, -14, -24, 0, -12);
    ctx.bezierCurveTo(14, -24, 24, -8, 0, 8);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
    ctx.restore();
  }

  function coin(ctx, x, y, r = 11) {
    circle(ctx, x, y, r, '#f6c453', INK, 2.5);
    circle(ctx, x, y, r * 0.62, '#ffe08a', null, 0);
    star(ctx, x, y, r * 0.42, '#d99a2b', null, 0, 5);
  }

  function paw(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ellipse(ctx, 0, 5, 9, 7, color, null, 0);
    circle(ctx, -9, -5, 3.6, color, null, 0);
    circle(ctx, 0, -8, 3.6, color, null, 0);
    circle(ctx, 9, -5, 3.6, color, null, 0);
    ctx.restore();
  }

  /* ---------------- 小熊 ---------------- */

  function drawEar(ctx, x, y, r, outer, inner) {
    circle(ctx, x, y, r, outer, INK, 5);
    circle(ctx, x, y, r * 0.52, inner, null, 0);
  }

  function drawFace(ctx, who, expression) {
    const eyeY = -128;
    const eyeX = 23;
    const ink = INK;
    ctx.lineCap = 'round';

    if (expression === 'happy' || expression === 'cheer') {
      ctx.strokeStyle = ink; ctx.lineWidth = 5;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.arc(s * eyeX, eyeY + 2, 6, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();
      });
    } else if (expression === 'scared') {
      circle(ctx, -eyeX, eyeY, 4.2, ink, null, 0);
      circle(ctx, eyeX, eyeY, 4.2, ink, null, 0);
      ctx.strokeStyle = ink; ctx.lineWidth = 3;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(s * (eyeX - 6), eyeY - 12);
        ctx.lineTo(s * (eyeX + 6), eyeY - 8);
        ctx.stroke();
      });
    } else if (expression === 'attack') {
      circle(ctx, -eyeX, eyeY, 5.2, ink, null, 0);
      circle(ctx, eyeX, eyeY, 5.2, ink, null, 0);
      ctx.strokeStyle = ink; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-eyeX - 7, eyeY - 12); ctx.lineTo(-eyeX + 7, eyeY - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(eyeX + 7, eyeY - 12); ctx.lineTo(eyeX - 7, eyeY - 8); ctx.stroke();
    } else {
      circle(ctx, -eyeX, eyeY, 5.4, ink, null, 0);
      circle(ctx, eyeX, eyeY, 5.4, ink, null, 0);
      circle(ctx, -eyeX - 1.6, eyeY - 1.8, 1.7, '#fff', null, 0);
      circle(ctx, eyeX - 1.6, eyeY - 1.8, 1.7, '#fff', null, 0);
    }

    // 腮红
    ellipse(ctx, -41, -113, 11, 8, BLUSH, null, 0);
    ellipse(ctx, 41, -113, 11, 8, BLUSH, null, 0);

    // 嘴巴
    ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.fillStyle = '#7a3a32';
    const my = -106;
    if (expression === 'happy' || expression === 'cheer') {
      ctx.beginPath();
      ctx.arc(0, my - 2, 9, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.fillStyle = '#7a3a32'; ctx.fill();
      ctx.stroke();
    } else if (expression === 'scared') {
      ellipse(ctx, 0, my, 4.5, 5.5, '#7a3a32', ink, 3);
    } else if (expression === 'attack') {
      ellipse(ctx, 0, my, 7, 8, '#7a3a32', ink, 3);
      poly(ctx, [[-6, my - 5], [0, my - 9], [6, my - 5]], '#fffdf7', null, 0);
    } else {
      ctx.beginPath();
      ctx.moveTo(-9, my);
      ctx.quadraticCurveTo(-4.5, my + 6, 0, my);
      ctx.quadraticCurveTo(4.5, my + 6, 9, my);
      ctx.stroke();
    }
  }

  function drawHat(ctx, conf) {
    const type = conf.hat;
    if (!type || type === 'none') return;
    ctx.save();
    ctx.translate(0, 6);
    const c = conf.hatColor || '#8ecae6';
    const a = conf.hatAccent || c;

    if (type === 'bucket') {
      rr(ctx, -68, -176, 136, 13, 6, c, INK, 5);
      poly(ctx, [[-50, -174], [-38, -207], [38, -207], [50, -174]], c, INK, 5);
      ctx.strokeStyle = a; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-44, -188); ctx.quadraticCurveTo(0, -194, 44, -188); ctx.stroke();
      circle(ctx, 0, -207, 4, a, null, 0);
    } else if (type === 'cap') {
      ctx.beginPath();
      ctx.arc(0, -174, 49, Math.PI, 0);
      ctx.lineTo(49, -174); ctx.lineTo(-49, -174); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      ellipse(ctx, 26, -173, 38, 11, c, INK, 5, -0.06);
      circle(ctx, 0, -222, 5, a, null, 0);
    } else if (type === 'beret') {
      ellipse(ctx, -8, -199, 47, 19, c, INK, 5, -0.16);
      ctx.strokeStyle = a; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(18, -213); ctx.lineTo(26, -224); ctx.stroke();
    } else if (type === 'sunhat') {
      ellipse(ctx, 0, -174, 78, 14, c, INK, 5);
      ellipse(ctx, 0, -191, 38, 22, c, INK, 5);
      ctx.strokeStyle = a; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-36, -184); ctx.quadraticCurveTo(0, -178, 36, -184); ctx.stroke();
      circle(ctx, 46, -185, 6, '#f7b6c8', INK, 3);
    } else if (type === 'bun') {
      circle(ctx, -42, -193, 20, c, INK, 5);
      circle(ctx, 42, -193, 20, c, INK, 5);
      ctx.strokeStyle = a; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-58, -198); ctx.lineTo(-28, -208); ctx.stroke();
      star(ctx, 42, -196, 7, a, INK, 2);
    } else if (type === 'flower') {
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + i * Math.PI * 2 / 5;
        circle(ctx, 40 + Math.cos(ang) * 11, -190 + Math.sin(ang) * 11, 8, c, INK, 3);
      }
      circle(ctx, 40, -190, 6, a, INK, 2.5);
    } else if (type === 'headband') {
      rr(ctx, -52, -172, 104, 12, 6, c, INK, 4);
      poly(ctx, [[42, -168], [58, -158], [46, -146], [36, -156]], c, INK, 4);
    } else if (type === 'bowler') {
      ellipse(ctx, 0, -174, 54, 11, c, INK, 5);
      ctx.beginPath(); ctx.arc(0, -176, 40, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = a; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-34, -184); ctx.quadraticCurveTo(0, -190, 34, -184); ctx.stroke();
    } else if (type === 'flatcap') {
      ellipse(ctx, 0, -180, 52, 14, c, INK, 5, -0.06);
      ellipse(ctx, 28, -174, 34, 9, c, INK, 4, 0.02);
      circle(ctx, 0, -194, 5, a, null, 0);
    } else if (type === 'akubra') {
      ellipse(ctx, 0, -174, 72, 13, c, INK, 5);
      ctx.beginPath(); ctx.arc(0, -176, 42, Math.PI * 1.02, -0.02 * Math.PI); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = a; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-40, -184); ctx.quadraticCurveTo(0, -178, 40, -184); ctx.stroke();
    } else if (type === 'laurel') {
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const ang = Math.PI * (0.12 + 0.76 * t);
        const x = Math.cos(ang) * 56;
        const y = -178 - Math.sin(ang) * 44;
        ellipse(ctx, x, y, 11, 5, c, INK, 2.5, ang);
      }
      circle(ctx, 0, -218, 5, a, INK, 2);
    } else if (type === 'crown') {
      poly(ctx, [[-34, -196], [-34, -224], [-14, -210], [0, -230], [14, -210], [34, -224], [34, -196]], c, INK, 4);
      circle(ctx, 0, -208, 4, '#d94a3d', INK, 2);
      circle(ctx, -18, -203, 3, '#8ecae6', INK, 2);
      circle(ctx, 18, -203, 3, '#8fd6b4', INK, 2);
    }
    ctx.restore();
  }

  function drawTop(ctx, conf, who) {
    const type = conf.top;
    const c = conf.topColor || '#fff6e2';
    const trim = conf.trim || '#f2b84b';

    if (type === 'cape') {
      // 斗篷主体在身体后面绘制，这里只画领扣
      circle(ctx, 0, -98, 7, trim, INK, 3);
      return;
    }

    if (type === 'tee' || type === 'stripe') {
      rr(ctx, -40, -96, 80, 86, 24, c, INK, 5);
      capsule(ctx, -45, -82, -58, -52, 12, c);
      capsule(ctx, 45, -82, 58, -52, 12, c);
      ctx.strokeStyle = trim; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-16, -92); ctx.quadraticCurveTo(0, -84, 16, -92); ctx.stroke();
      if (type === 'stripe') {
        ctx.save();
        rr(ctx, -40, -96, 80, 86, 24, null, null, 0);
        ctx.clip();
        ctx.fillStyle = trim;
        for (let y = -90; y < -10; y += 16) ctx.fillRect(-42, y, 84, 7);
        ctx.restore();
        rr(ctx, -40, -96, 80, 86, 24, null, INK, 5);
      }
      ctx.strokeStyle = 'rgba(75,43,32,.18)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-36, -20); ctx.quadraticCurveTo(0, -12, 36, -20); ctx.stroke();
    } else if (type === 'qipao' || type === 'tang') {
      poly(ctx, [[-38, -96], [38, -96], [47, -8], [30, -2], [-30, -2], [-47, -8]], c, INK, 5);
      // 立领
      rr(ctx, -18, -104, 36, 12, 5, c, INK, 4);
      // 金色滚边
      ctx.strokeStyle = trim; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-34, -4); ctx.quadraticCurveTo(0, 2, 34, -4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(12, -96); ctx.lineTo(12, -6); ctx.stroke();
      // 盘扣
      for (let i = 0; i < 3; i++) circle(ctx, 12, -80 + i * 24, 3.4, trim, INK, 1.5);
      if (type === 'qipao') {
        ctx.strokeStyle = trim; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(36, -40); ctx.lineTo(36, -6); ctx.stroke();
      }
    } else if (type === 'kimono') {
      // 宽袖
      rr(ctx, -66, -90, 26, 66, 10, c, INK, 5);
      rr(ctx, 40, -90, 26, 66, 10, c, INK, 5);
      // 衣身
      rr(ctx, -44, -96, 88, 88, 18, c, INK, 5);
      // 交领
      poly(ctx, [[-26, -96], [0, -58], [26, -96]], '#fffdf7', INK, 4);
      ctx.strokeStyle = trim; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-30, -94); ctx.lineTo(0, -54); ctx.lineTo(30, -94); ctx.stroke();
      // 腰带
      rr(ctx, -46, -56, 92, 18, 5, trim, INK, 4);
      circle(ctx, 0, -47, 5, c, INK, 2);
    } else if (type === 'trench') {
      rr(ctx, -46, -98, 92, 94, 20, c, INK, 5);
      // 翻领
      poly(ctx, [[-30, -96], [-6, -76], [-22, -68]], '#f4e3c4', INK, 3);
      poly(ctx, [[30, -96], [6, -76], [22, -68]], '#f4e3c4', INK, 3);
      // 腰带
      rr(ctx, -48, -52, 96, 14, 4, trim, INK, 4);
      circle(ctx, 0, -45, 5, '#f2b84b', INK, 2);
      // 扣子
      for (let i = 0; i < 3; i++) circle(ctx, 0, -78 + i * 14, 3.2, trim, INK, 1.5);
      // 下摆线
      ctx.strokeStyle = 'rgba(75,43,32,.25)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-40, -8); ctx.lineTo(40, -8); ctx.stroke();
    } else if (type === 'hawaii') {
      rr(ctx, -42, -96, 84, 86, 18, c, INK, 5);
      ctx.save();
      rr(ctx, -42, -96, 84, 86, 18, null, null, 0);
      ctx.clip();
      for (let i = 0; i < 9; i++) {
        const x = -34 + (i % 3) * 30 + (i * 7 % 9);
        const y = -84 + Math.floor(i / 3) * 26;
        for (let k = 0; k < 5; k++) {
          const ang = k * Math.PI * 2 / 5;
          circle(ctx, x + Math.cos(ang) * 5, y + Math.sin(ang) * 5, 4, trim, null, 0);
        }
        circle(ctx, x, y, 3, '#fff6e2', null, 0);
      }
      ctx.restore();
      rr(ctx, -42, -96, 84, 86, 18, null, INK, 5);
      poly(ctx, [[-18, -96], [0, -78], [18, -96]], '#fffdf7', INK, 3);
    } else if (type === 'toga') {
      // 斜披
      poly(ctx, [[-42, -96], [10, -96], [42, -20], [30, -2], [-20, -2], [-48, -40]], c, INK, 5);
      ctx.strokeStyle = trim; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(-36, -88); ctx.lineTo(22, -22); ctx.stroke();
      rr(ctx, -38, -50, 76, 12, 5, trim, INK, 4);
      // 褶皱
      ctx.strokeStyle = 'rgba(75,43,32,.18)'; ctx.lineWidth = 3;
      for (let i = -20; i <= 20; i += 10) {
        ctx.beginPath(); ctx.moveTo(i, -30); ctx.lineTo(i - 4, -6); ctx.stroke();
      }
    }
  }

  function drawBag(ctx, conf) {
    if (!conf.bag || conf.bag === 'none') return;
    const c = conf.bagColor || '#f2b84b';
    if (conf.bag === 'satchel') {
      ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-34, -92); ctx.lineTo(28, -30); ctx.stroke();
      rr(ctx, 16, -34, 38, 30, 8, c, INK, 4);
      rr(ctx, 16, -34, 38, 12, 6, c, INK, 4);
      circle(ctx, 35, -20, 3.5, '#fff6e2', INK, 1.5);
    } else if (conf.bag === 'crossbody') {
      ctx.strokeStyle = c; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(34, -92); ctx.lineTo(-26, -30); ctx.stroke();
      rr(ctx, -46, -34, 36, 28, 8, c, INK, 4);
      rr(ctx, -46, -34, 36, 11, 6, c, INK, 4);
      circle(ctx, -28, -21, 3.5, '#fff6e2', INK, 1.5);
    }
  }

  function drawExtra(ctx, conf) {
    const type = conf.extra;
    if (!type || type === 'none') return;
    const c = conf.extraColor || '#f2b84b';

    if (type === 'fan') {
      ctx.save(); ctx.translate(46, -58); ctx.rotate(-0.25);
      poly(ctx, [[0, 0], [30, -16], [34, -6], [8, 8]], c, INK, 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(28 - i * 2, -14 + i * 3); ctx.stroke(); }
      ctx.restore();
    } else if (type === 'baguette') {
      ctx.save(); ctx.translate(36, -44); ctx.rotate(-0.45);
      ellipse(ctx, 0, 0, 9, 26, '#e0b26a', INK, 3);
      ctx.strokeStyle = '#b97f3e'; ctx.lineWidth = 2;
      for (let i = -14; i < 20; i += 9) { ctx.beginPath(); ctx.moveTo(-5, i); ctx.lineTo(5, i + 4); ctx.stroke(); }
      ctx.restore();
    } else if (type === 'umbrella') {
      ctx.save(); ctx.translate(56, -150); ctx.rotate(0.08);
      ctx.beginPath(); ctx.arc(0, 0, 62, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = '#fff6e2'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 18, 0); ctx.lineTo(i * 12, -54); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 72); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, 72, 8, Math.PI, 0); ctx.stroke();
      ctx.restore();
    } else if (type === 'sunglasses') {
      rr(ctx, -36, -137, 27, 18, 8, '#3b2a22', INK, 3);
      rr(ctx, 9, -137, 27, 18, 8, '#3b2a22', INK, 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-9, -130); ctx.lineTo(9, -130); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-30, -132); ctx.lineTo(-22, -128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, -132); ctx.lineTo(23, -128); ctx.stroke();
    } else if (type === 'scarf') {
      rr(ctx, -30, -104, 60, 12, 5, c, INK, 3);
      poly(ctx, [[18, -98], [30, -70], [16, -66], [8, -94]], c, INK, 3);
    } else if (type === 'knot') {
      poly(ctx, [[0, -96], [10, -86], [0, -76], [-10, -86]], c, INK, 3);
      ctx.strokeStyle = c; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(-4, -62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(6, -62); ctx.stroke();
    } else if (type === 'star') {
      ctx.save(); ctx.translate(50, -64); ctx.rotate(-0.2);
      ctx.strokeStyle = '#b97f3e'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -42); ctx.stroke();
      star(ctx, 0, -48, 16, c, INK, 3);
      ctx.restore();
    }
  }

  function drawCape(ctx, conf) {
    const c = conf.topColor || '#f7b6c8';
    const trim = conf.trim || '#8ecae6';
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-38, -96);
    ctx.quadraticCurveTo(-96, -40, -78, 8);
    ctx.quadraticCurveTo(-40, 22, 0, 12);
    ctx.quadraticCurveTo(40, 22, 78, 8);
    ctx.quadraticCurveTo(96, -40, 38, -96);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = trim; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-40, -90); ctx.quadraticCurveTo(-80, -30, -66, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, -90); ctx.quadraticCurveTo(80, -30, 66, 4); ctx.stroke();
    ctx.restore();
  }

  function drawBearCard(ctx, x, y, s, opts) {
    const img = sprites[opts.who][opts.outfitId] || sprites[opts.who].travel;
    if (!img) return;
    const h = 198 * s;
    const w = h * img.naturalWidth / img.naturalHeight;
    const bob = opts.bob || 0;
    ctx.save();
    ctx.translate(x, y + bob);
    if (opts.flip) ctx.scale(-1, 1);
    const t = Date.now() / 1000;
    ctx.rotate(Math.sin(t * 1.5 + (opts.who === 'bubu' ? 1.1 : 0)) * .008);
    if (opts.expression === 'scared') ctx.rotate(Math.sin(Date.now() / 55) * .02);
    if (opts.expression === 'cheer') ctx.rotate(-.03);

    // 卡片影子
    ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 4, w * .32, 8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // 拍立得白卡
    rr(ctx, -w / 2, -h, w, h, 10 * s, '#fffdf7', INK, 3);
    const pad = 3 * s;
    ctx.drawImage(img, -w / 2 + pad, -h + pad, w - 2 * pad, h - 2 * pad);

    // 顶部胶带
    ctx.save(); ctx.globalAlpha = .8; ctx.fillStyle = '#f7e3b0';
    ctx.translate(0, -h); ctx.rotate(-.035);
    ctx.fillRect(-w * .16, -5 * s, w * .32, 10 * s);
    ctx.restore();
    ctx.restore();
  }

  function drawHead(ctx, who, outfitId, x, y, size) {
    const img = heads[who][outfitId] || heads[who].travel;
    if (!img || !img.complete || !img.naturalWidth) return false;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.clip();
    const sc = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * sc, h = img.naturalHeight * sc;
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    return true;
  }

  function drawBear(ctx, x, y, s, opts) {
    const who = opts.who || 'yier';
    const outfit = opts.outfit || OUTFITS[0];
    const img = sprites[who] && sprites[who][outfit.id];
    if (img && img.complete && img.naturalWidth) {
      drawBearCard(ctx, x, y, s, {
        who, outfitId: outfit.id,
        expression: opts.expression || 'normal',
        bob: opts.bob || 0,
        flip: !!opts.flip
      });
      return;
    }
    const conf = who === 'yier' ? outfit.yier : outfit.bubu;
    const expression = opts.expression || 'normal';
    const bob = opts.bob || 0;
    const flip = !!opts.flip;
    const isWhite = who === 'yier';
    const bodyColor = isWhite ? '#fffdf7' : BROWN;
    const earColor = isWhite ? '#4b2b20' : BROWN_DARK;
    const innerEar = isWhite ? '#c99a86' : '#e6b58c';
    const muzzle = isWhite ? '#fffdf7' : '#f3d3b8';

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s * (flip ? -1 : 1), s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // 影子
    ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 6, 58, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    if (conf.top === 'cape') drawCape(ctx, conf);
    if (conf.extra === 'umbrella') drawExtra(ctx, conf);

    // 耳朵
    drawEar(ctx, -45, -169, 18, earColor, innerEar);
    drawEar(ctx, 45, -169, 18, earColor, innerEar);

    // 腿
    rr(ctx, -30, -16, 22, 22, 10, bodyColor, INK, 5);
    rr(ctx, 8, -16, 22, 22, 10, bodyColor, INK, 5);

    // 身体
    ellipse(ctx, 0, -52, 46, 59, bodyColor, INK, 5);

    // 手臂
    if (expression === 'cheer') {
      capsule(ctx, -38, -88, -74, -156, 11, bodyColor);
      capsule(ctx, 38, -88, 74, -156, 11, bodyColor);
      circle(ctx, -78, -160, 11, bodyColor, INK, 5);
      circle(ctx, 78, -160, 11, bodyColor, INK, 5);
    } else if (expression === 'scared') {
      capsule(ctx, -38, -88, -56, -128, 11, bodyColor);
      capsule(ctx, 38, -88, 56, -128, 11, bodyColor);
      circle(ctx, -56, -132, 11, bodyColor, INK, 5);
      circle(ctx, 56, -132, 11, bodyColor, INK, 5);
    } else {
      capsule(ctx, -38, -88, -58, -40, 11, bodyColor);
      capsule(ctx, 38, -88, 58, -40, 11, bodyColor);
      circle(ctx, -58, -36, 11, bodyColor, INK, 5);
      circle(ctx, 58, -36, 11, bodyColor, INK, 5);
    }

    // 头
    ellipse(ctx, 0, -124, 63, 57, bodyColor, INK, 5);

    // 棕色熊的浅色口鼻
    if (!isWhite) ellipse(ctx, 0, -108, 27, 18, muzzle, null, 0);

    drawTop(ctx, conf, who);
    drawBag(ctx, conf);
    if (conf.extra !== 'umbrella') drawExtra(ctx, conf);
    drawFace(ctx, who, expression);
    drawHat(ctx, conf);

    ctx.restore();
  }

  /* ---------------- 海鸥 ---------------- */
  function drawSeagull(ctx, x, y, s, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    // 影子
    ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 6, 44, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // 尾巴
    poly(ctx, [[-34, -26], [-58, -36], [-46, -18]], '#e8edf2', INK, 4);
    // 身体
    ellipse(ctx, 0, -34, 38, 28, '#fffdf7', INK, 4.5);
    // 翅膀
    poly(ctx, [[-10, -50], [30, -58], [44, -34], [12, -28]], '#b9c6d4', INK, 4);
    // 头
    circle(ctx, 28, -62, 24, '#fffdf7', INK, 4.5);
    // 嘴
    poly(ctx, [[46, -64], [70, -58], [46, -50]], '#f2b84b', INK, 3.5);
    // 眼睛
    circle(ctx, 36, -68, 3.5, INK, null, 0);
    circle(ctx, 35, -69, 1.1, '#fff', null, 0);
    // 腮红
    ellipse(ctx, 34, -54, 6, 4.5, BLUSH, null, 0);
    // 脚
    ctx.strokeStyle = '#d99a2b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4, 4); ctx.moveTo(10, -6); ctx.lineTo(10, 4); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- 塔 ---------------- */
  function towerBase(ctx) {
    ctx.save();
    ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 30, 38, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // 木台
    ellipse(ctx, 0, 24, 34, 10, '#b98a5a', INK, 4);
    rr(ctx, -26, 8, 52, 18, 5, '#c99a68', INK, 4);
    // 木纹
    ctx.strokeStyle = 'rgba(75,43,32,.25)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18, 15); ctx.lineTo(18, 15); ctx.stroke();
  }

  function drawTower(ctx, x, y, s, type, level, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';

    const sprite = towerSprites[type];
    if (sprite && sprite.complete && sprite.naturalWidth) {
      const lvS = 1 + (level - 1) * .045;
      const h = 100 * lvS;
      const w = h * sprite.naturalWidth / sprite.naturalHeight;
      ctx.save();
      ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
      ctx.beginPath(); ctx.ellipse(0, 28, 34, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (Math.cos(opts.angle || 0) < -.1) ctx.scale(-1, 1);
      ctx.translate(0, (opts.recoil || 0) * 3);
      ctx.drawImage(sprite, -w / 2, 30 - h, w, h);
      for (let i = 0; i < level; i++) star(ctx, -16 + i * 16, 22, 5, '#f6cf6d', INK, 1.5);
      ctx.restore();
      return;
    }

    towerBase(ctx);

    if (type === 'dart') {
      // 靶架
      rr(ctx, -22, -46, 44, 54, 8, '#e8c98a', INK, 4);
      circle(ctx, 0, -22, 17, '#fff6e2', INK, 4);
      circle(ctx, 0, -22, 11, '#d94a3d', null, 0);
      circle(ctx, 0, -22, 5, '#fff6e2', null, 0);
      // 飞镖
      ctx.save();
      ctx.translate(0, -42 + (opts.recoil || 0) * 8);
      ctx.rotate(opts.angle || -0.6);
      rr(ctx, -3, -28, 6, 30, 3, '#8a6a4a', INK, 2);
      poly(ctx, [[-10, -28], [0, -40], [10, -28]], '#d94a3d', INK, 2.5);
      poly(ctx, [[-6, 2], [0, 10], [6, 2]], '#f2b84b', INK, 2);
      ctx.restore();
      // 等级标记
      for (let i = 0; i < level; i++) star(ctx, -16 + i * 16, 20, 5, '#f6cf6d', INK, 1.5);
    } else if (type === 'sling') {
      // Y 形木架
      capsule(ctx, 0, 16, 0, -18, 5, '#a97a4a');
      capsule(ctx, 0, -18, -20, -48, 5, '#a97a4a');
      capsule(ctx, 0, -18, 20, -48, 5, '#a97a4a');
      ctx.strokeStyle = '#6b4436'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-20, -48); ctx.lineTo(0, -24); ctx.lineTo(20, -48); ctx.stroke();
      // 皮筋
      ctx.strokeStyle = '#d94a3d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-20, -48); ctx.quadraticCurveTo(0, -12, 20, -48); ctx.stroke();
      // 石头
      circle(ctx, 0, -30, 7, '#9fb3c8', INK, 3);
      for (let i = 0; i < level; i++) star(ctx, -16 + i * 16, 20, 5, '#f6cf6d', INK, 1.5);
    } else if (type === 'honey') {
      // 蜂蜜罐
      poly(ctx, [[-24, 8], [24, 8], [28, -36], [-28, -36]], '#e0a63a', INK, 4);
      ellipse(ctx, 0, -36, 28, 9, '#f6cf6d', INK, 4);
      rr(ctx, -20, -32, 40, 10, 4, '#fff6e2', INK, 3);
      // 滴落的蜂蜜
      ctx.fillStyle = '#f2b84b'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(28, -18); ctx.quadraticCurveTo(40, -8, 30, 6); ctx.quadraticCurveTo(22, -6, 28, -18); ctx.fill(); ctx.stroke();
      // 勺子
      ctx.save(); ctx.translate(-26, -24); ctx.rotate(-0.4);
      ctx.strokeStyle = '#a97a4a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30); ctx.stroke();
      ellipse(ctx, 0, -34, 8, 10, '#f6cf6d', INK, 3);
      ctx.restore();
      for (let i = 0; i < level; i++) star(ctx, -16 + i * 16, 20, 5, '#f6cf6d', INK, 1.5);
    } else if (type === 'camera') {
      // 拍立得
      rr(ctx, -30, -40, 60, 52, 8, '#5f8fb0', INK, 4);
      rr(ctx, -22, -52, 44, 14, 5, '#4d7a99', INK, 4);
      circle(ctx, 0, -14, 17, '#d9e8f2', INK, 4);
      circle(ctx, 0, -14, 10, '#4b2b20', null, 0);
      circle(ctx, -4, -18, 3, '#fff', null, 0);
      rr(ctx, 14, -50, 16, 8, 3, '#f6cf6d', INK, 3);
      // 闪光
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      star(ctx, 26, -56, 9, '#fff6e2', INK, 2);
      for (let i = 0; i < level; i++) star(ctx, -16 + i * 16, 20, 5, '#f6cf6d', INK, 1.5);
    }

    ctx.restore();
  }

  function drawProp(ctx, x, y, s, type, opts = {}) {
    const img = propSprites[type];
    if (!img || !img.complete || !img.naturalWidth) return;
    const h = type === 'chest' ? 46 : 42;
    const w = h * img.naturalWidth / img.naturalHeight;
    const bob = Math.sin((opts.t || 0) * 2 + x * .01) * 1.5;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(s, s);
    ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 14, w * .42, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.drawImage(img, -w / 2, 12 - h, w, h);
    const tw = (Math.sin((opts.t || 0) * 3) + 1) / 2;
    ctx.globalAlpha = .45 + tw * .45;
    star(ctx, w * .35, -h * .8, 3.5, '#f6cf6d', '#8a5a20', 1);
    ctx.restore();
  }

  /* ---------------- 怪物 ---------------- */
  function drawEnemyStatus(ctx, e, opts) {
    if (opts.slow) {
      ctx.globalAlpha = .35; ctx.fillStyle = '#8ecae6';
      circle(ctx, 0, -e.radius - 10, 5, '#8ecae6', null, 0);
      ctx.globalAlpha = 1;
    }
    if (opts.stun) {
      for (let i = 0; i < 3; i++) {
        const a = (opts.t || 0) * 4 + i * Math.PI * 2 / 3;
        star(ctx, Math.cos(a) * 14, -e.radius - 16 + Math.sin(a) * 4, 4, '#f6cf6d', INK, 1);
      }
    }
  }

  function drawEnemy(ctx, x, y, s, type, opts = {}) {
    const e = ENEMIES[type] || ENEMIES.fuzz;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';

    // 影子
    ctx.save(); ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 16, e.radius * 0.9, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();

    // 豆包生成的小怪兽贴图
    const sprite = type === 'mini' ? monsterSprites.pudding : monsterSprites[type];
    if (sprite && sprite.complete && sprite.naturalWidth) {
      const h = type === 'boss' ? 104 : type === 'mini' ? 26 : e.radius * 2.5;
      const w = h * sprite.naturalWidth / sprite.naturalHeight;
      const wobble = Math.sin((opts.t || 0) * 5) * .03;
      ctx.save();
      ctx.rotate(wobble);
      ctx.drawImage(sprite, -w / 2, 16 - h, w, h);
      ctx.restore();
      drawEnemyStatus(ctx, e, opts);
      ctx.restore();
      return;
    }

    if (type === 'fuzz' || type === 'mini') {
      const r = type === 'mini' ? 13 : 18;
      // 绒毛
      ctx.fillStyle = e.color; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 14; i++) {
        const a = i * Math.PI * 2 / 14;
        const rad = r + (i % 2 ? 4 : -1);
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      circle(ctx, -5, -3, 3, INK, null, 0);
      circle(ctx, 6, -3, 3, INK, null, 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-3, 5); ctx.quadraticCurveTo(0, 8, 4, 5); ctx.stroke();
      // 脚
      ellipse(ctx, -8, 17, 6, 4, e.color, INK, 2);
      ellipse(ctx, 8, 17, 6, 4, e.color, INK, 2);
    } else if (type === 'dango') {
      // 团子
      circle(ctx, 0, -2, 16, e.color, INK, 4);
      ellipse(ctx, 0, -16, 13, 7, '#fff6e2', INK, 3);
      // 叶子
      poly(ctx, [[0, -20], [12, -30], [16, -20], [6, -16]], '#7bc8a4', INK, 2.5);
      circle(ctx, -5, -2, 2.8, INK, null, 0);
      circle(ctx, 5, -2, 2.8, INK, null, 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(3, 6); ctx.stroke();
      ellipse(ctx, -7, 16, 5, 4, e.color, INK, 2);
      ellipse(ctx, 7, 16, 5, 4, e.color, INK, 2);
    } else if (type === 'can') {
      // 铁罐
      rr(ctx, -18, -26, 36, 44, 8, e.color, INK, 4);
      ctx.strokeStyle = '#dfe9f2'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-18, -16); ctx.lineTo(18, -16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, 12); ctx.lineTo(18, 12); ctx.stroke();
      circle(ctx, -6, -4, 3, INK, null, 0);
      circle(ctx, 6, -4, 3, INK, null, 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(6, 5); ctx.stroke();
      // 小脚
      rr(ctx, -14, 16, 10, 8, 3, '#7a8fa3', INK, 2);
      rr(ctx, 4, 16, 10, 8, 3, '#7a8fa3', INK, 2);
    } else if (type === 'pudding') {
      // 布丁
      poly(ctx, [[-18, 14], [18, 14], [23, -12], [-23, -12]], e.color, INK, 4);
      ellipse(ctx, 0, -12, 23, 8, '#c98a3a', INK, 4);
      ellipse(ctx, 0, -16, 14, 5, '#e8b45a', null, 0);
      circle(ctx, -6, 0, 3, INK, null, 0);
      circle(ctx, 6, 0, 3, INK, null, 0);
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, 8); ctx.quadraticCurveTo(0, 11, 4, 8); ctx.stroke();
      ellipse(ctx, -9, 18, 6, 4, e.color, INK, 2);
      ellipse(ctx, 9, 18, 6, 4, e.color, INK, 2);
    } else if (type === 'boss') {
      // 灯笼大魔王
      ctx.save();
      ctx.translate(0, -6);
      ellipse(ctx, 0, 0, 44, 50, '#d94a3d', INK, 6);
      ctx.strokeStyle = '#f6cf6d'; ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(i) * 14 + 6, 48, 0, 0, Math.PI * 2); ctx.stroke();
      }
      rr(ctx, -24, -58, 48, 12, 5, '#f6cf6d', INK, 4);
      rr(ctx, -18, 48, 36, 10, 4, '#f6cf6d', INK, 4);
      // 脸
      circle(ctx, -14, -8, 5, '#2b1712', null, 0);
      circle(ctx, 14, -8, 5, '#2b1712', null, 0);
      ctx.strokeStyle = '#2b1712'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-24, -24); ctx.lineTo(-8, -18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, -24); ctx.lineTo(8, -18); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 8, 10, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
      // 流苏
      ctx.strokeStyle = '#f6cf6d'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(0, 78); ctx.stroke();
      ctx.restore();
    }

    // 状态
    drawEnemyStatus(ctx, e, opts);
    ctx.restore();
  }

  /* ---------------- 场景 ---------------- */
  function drawBackground(ctx, img, tint, time = 0) {
    ctx.clearRect(0, 0, 1280, 720);
    if (img && img.complete && img.naturalWidth) {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(1280 / iw, 720 / ih);
      const w = iw * scale, h = ih * scale;
      ctx.drawImage(img, (1280 - w) / 2, (720 - h) / 2, w, h);
    } else {
      ctx.fillStyle = '#cfe6ef'; ctx.fillRect(0, 0, 1280, 720);
    }
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, 1280, 720); }
    // 顶部 HUD 渐变
    const g = ctx.createLinearGradient(0, 0, 0, 150);
    g.addColorStop(0, 'rgba(255,248,236,.85)');
    g.addColorStop(1, 'rgba(255,248,236,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 150);
    // 暗角
    const v = ctx.createRadialGradient(640, 360, 260, 640, 360, 760);
    v.addColorStop(0, 'rgba(42,24,18,0)');
    v.addColorStop(1, 'rgba(42,24,18,.26)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, 1280, 720);
  }

  function drawPath(ctx, points, opts = {}) {
    if (!points || points.length < 2) return;
    // 平滑
    const p = points;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    function trace() {
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) {
        const midX = (p[i][0] + p[i + 1][0]) / 2;
        const midY = (p[i][1] + p[i + 1][1]) / 2;
        ctx.quadraticCurveTo(p[i][0], p[i][1], midX, midY);
      }
      const last = p[p.length - 1];
      ctx.lineTo(last[0], last[1]);
    }

    trace(); ctx.strokeStyle = 'rgba(75,43,32,.55)'; ctx.lineWidth = 86; ctx.stroke();
    trace(); ctx.strokeStyle = '#f3dfbb'; ctx.lineWidth = 74; ctx.stroke();
    trace(); ctx.strokeStyle = '#fff6e2'; ctx.lineWidth = 64; ctx.stroke();

    // 虚线中线
    trace(); ctx.setLineDash([14, 16]); ctx.lineDashOffset = -(opts.time || 0) * 20;
    ctx.strokeStyle = 'rgba(75,43,32,.28)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawMiniPath(ctx, level, w, h) {
    ctx.clearRect(0, 0, w, h);
    rr(ctx, 1, 1, w - 2, h - 2, 10, '#fff8ec', INK, 2);
    const pts = level.path || [];
    if (pts.length < 2) return;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = 10;
    const sc = Math.min((w - pad * 2) / Math.max(1, maxX - minX),
                        (h - pad * 2) / Math.max(1, maxY - minY));
    const ox = (w - (maxX - minX) * sc) / 2 - minX * sc;
    const oy = (h - (maxY - minY) * sc) / 2 - minY * sc;
    const m = pts.map(([x, y]) => [x * sc + ox, y * sc + oy]);

    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(m[0][0], m[0][1]);
      for (let i = 1; i < m.length; i++) ctx.lineTo(m[i][0], m[i][1]);
    };
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    trace(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.stroke();
    trace(); ctx.strokeStyle = '#fff6e2'; ctx.lineWidth = 4; ctx.stroke();
    trace(); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(75,43,32,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([]);

    // 木桩
    for (const [x, y] of level.slots || []) {
      circle(ctx, x * sc + ox, y * sc + oy, 1.8, '#c99a68', INK, .8);
    }
    // 起点旗
    const s = m[0];
    poly(ctx, [[s[0], s[1] - 5], [s[0] + 7, s[1] - 2], [s[0], s[1] + 2]], '#d94a3d', INK, 1);
    // 终点爱心
    const e = m[m.length - 1];
    heart(ctx, e[0], e[1], 5, '#f7b6c8', INK, 1.2);
    ctx.restore();
  }

  function drawSlot(ctx, x, y, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    // 阴影
    ctx.save(); ctx.globalAlpha = .14; ctx.fillStyle = '#3b241c';
    ctx.beginPath(); ctx.ellipse(0, 8, 30, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // 木桩
    circle(ctx, 0, 0, 27, '#d8b07a', INK, 4);
    circle(ctx, 0, 0, 19, '#c99a68', null, 0);
    ctx.strokeStyle = 'rgba(75,43,32,.28)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    paw(ctx, 0, 1, 0.9, 'rgba(75,43,32,.38)');
    if (opts.highlight) {
      ctx.setLineDash([6, 6]);
      circle(ctx, 0, 0, 35, null, opts.highlight, 3);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawBase(ctx, x, y, outfit, opts = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (opts.shake) ctx.translate(Math.sin((opts.t || 0) * 45) * 3, 0);

    // 野餐垫
    ellipse(ctx, 0, 42, 92, 24, '#f7d9b0', INK, 4);
    ctx.save();
    ellipse(ctx, 0, 42, 86, 20, null, null, 0);
    ctx.clip();
    ctx.strokeStyle = 'rgba(217,93,79,.35)'; ctx.lineWidth = 5;
    for (let i = -80; i < 80; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 22); ctx.lineTo(i + 24, 62); ctx.stroke();
    }
    ctx.restore();

    // 房车
    ctx.save();
    ctx.translate(18, -36);
    rr(ctx, -70, -42, 140, 76, 16, '#fff6e2', INK, 5);
    rr(ctx, -58, -56, 116, 20, 8, '#8ecae6', INK, 4);
    rr(ctx, -52, -30, 44, 28, 6, '#bfe5f3', INK, 4);
    ctx.strokeStyle = '#8ecae6'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-52, 10); ctx.lineTo(52, 10); ctx.stroke();
    circle(ctx, -38, 36, 13, '#4b2b20', INK, 4);
    circle(ctx, 38, 36, 13, '#4b2b20', INK, 4);
    circle(ctx, -38, 36, 5, '#d8d8d8', null, 0);
    circle(ctx, 38, 36, 5, '#d8d8d8', null, 0);
    heart(ctx, 34, 4, 14, '#d95d4f', INK, 2.5);
    ctx.restore();

    // 两只熊
    const pairImg = sprites.pair[outfit.id] || sprites.pair.travel;
    if (pairImg && pairImg.complete && pairImg.naturalWidth) {
      const img = pairImg;
      const w = 150, h = w * img.naturalHeight / img.naturalWidth;
      const y0 = 42 + Math.sin(Date.now() / 1000 * 1.2) * 2;
      ctx.save();
      ctx.globalAlpha = .16; ctx.fillStyle = '#3b241c';
      ctx.beginPath(); ctx.ellipse(0, y0 + 4, w * .3, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      rr(ctx, -w / 2, y0 - h, w, h, 8, '#fffdf7', INK, 3);
      ctx.drawImage(img, -w / 2 + 3, y0 - h + 3, w - 6, h - 6);
      ctx.save(); ctx.globalAlpha = .8; ctx.fillStyle = '#f7e3b0';
      ctx.fillRect(-w * .16, y0 - h - 4, w * .32, 8);
      ctx.restore();
    } else {
      drawBear(ctx, -40, 40, .48, { who: 'yier', outfit, expression: opts.expression || 'normal', bob: opts.bob || 0 });
      drawBear(ctx, 30, 40, .48, { who: 'bubu', outfit, expression: opts.expression || 'normal', bob: (opts.bob || 0) * .7 });
    }

    // 心形气球
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(72, -60); ctx.quadraticCurveTo(88, -100, 78, -126); ctx.stroke();
    heart(ctx, 78, -138, 18, '#f7b6c8', INK, 3);

    ctx.restore();
  }

  function drawCoinPop(ctx, x, y, t) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.translate(x, y - t * 44);
    coin(ctx, 0, 0, 10);
    ctx.restore();
  }

  function drawHit(ctx, x, y, t, color = '#f6cf6d') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    const r = 6 + t * 18;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLeaf(ctx, x, y, rot, color = '#d98a4a') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = color; ctx.strokeStyle = 'rgba(75,43,32,.4)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(8, 0, 0, 8);
    ctx.quadraticCurveTo(-8, 0, 0, -8);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  return {
    INK, WHITE, BROWN,
    circle, ellipse, rr, capsule, poly, star, heart, coin, paw,
    drawBear, drawHead, whenTravelReady, drawSeagull, drawTower, drawProp, drawEnemy,
    drawBackground, drawPath, drawMiniPath, drawSlot, drawBase,
    drawCoinPop, drawHit, drawLeaf
  };
})();
