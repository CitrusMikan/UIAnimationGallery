/* aquarium.js — 背景の水槽演出（魚影と気泡）
 * .bg-grid と同じ層 (fixed / z-index:0 / pointer-events:none)。
 * テーマ色は data-theme を MutationObserver で監視して追従。
 * タブ非表示 / モーダル中 / prefers-reduced-motion では描画停止。 */
(function () {
  'use strict';

  var canvas, ctx;
  var W = 0, H = 0;            // CSS ピクセルサイズ
  var dpr = 1;
  var fishes = [];
  var bubbles = [];
  var colors = null;          // { fish, bubble } — 解決済み色（alpha 込み rgba）
  var rafId = 0;
  var lastTime = 0;
  var running = false;
  var reduceMotion = false;
  var resizeTimer = 0;

  var DPR_MAX = 1.25;
  var TWO_PI = Math.PI * 2;

  /* 色ユーティリティ */

  // "#rgb" / "#rrggbb" / "rgb(...)" を [r,g,b] に。失敗時は null。
  function parseColor(str) {
    if (!str) return null;
    str = str.trim();
    if (str[0] === '#') {
      var hex = str.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      if (hex.length !== 6) return null;
      var n = parseInt(hex, 16);
      if (isNaN(n)) return null;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = str.match(/rgba?\(([^)]+)\)/);
    if (m) {
      var p = m[1].split(',');
      return [parseFloat(p[0]) || 0, parseFloat(p[1]) || 0, parseFloat(p[2]) || 0];
    }
    return null;
  }

  function luminance(rgb) {
    // 0(暗)〜1(明) の簡易輝度
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }

  // テーマの CSS 変数から魚影・気泡の色を解決する
  function resolveColors() {
    var cs = getComputedStyle(document.documentElement);
    var accent = parseColor(cs.getPropertyValue('--pv-accent')) || [120, 120, 120];
    var faint = parseColor(cs.getPropertyValue('--text-faint')) || accent;
    var bg = parseColor(cs.getPropertyValue('--bg')) || [255, 255, 255];
    var dark = luminance(bg) < 0.5;

    // 暗いテーマ: アクセント寄りで少し明るめ / 明るいテーマ: 中間色寄りで控えめ
    var fishRgb = dark ? accent : faint;
    var fishAlpha = dark ? 0.13 : 0.10;
    var bubbleRgb = dark ? accent : faint;
    var bubbleAlpha = dark ? 0.10 : 0.08;

    colors = {
      fish: rgba(fishRgb, fishAlpha),
      bubble: rgba(bubbleRgb, bubbleAlpha),
    };
  }

  /* 生き物の生成 */

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeFish() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    return {
      x: rand(0, W),
      y: rand(H * 0.1, H * 0.9),
      len: rand(46, 88),          // 体長(px)
      speed: rand(8, 20) * dir,   // px/s（符号=進行方向）
      dir: dir,
      wobAmp: rand(3, 9),         // 上下揺れ幅
      wobSpeed: rand(0.4, 1.0),   // 上下揺れ速度
      wobPhase: rand(0, TWO_PI),
    };
  }

  function makeBubble() {
    return {
      x: rand(0, W),
      y: rand(0, H),
      r: rand(4, 13),
      speed: rand(10, 26),        // 上昇速度 px/s
      swayAmp: rand(4, 12),
      swaySpeed: rand(0.5, 1.2),
      swayPhase: rand(0, TWO_PI),
    };
  }

  function populate() {
    // 画面面積に応じた匹数（上限あり）
    var area = W * H;
    var fishCount = Math.max(4, Math.min(8, Math.round(area / 190000)));
    var bubbleCount = Math.max(8, Math.min(18, Math.round(area / 90000)));
    fishes = [];
    bubbles = [];
    for (var i = 0; i < fishCount; i++) fishes.push(makeFish());
    for (var j = 0; j < bubbleCount; j++) bubbles.push(makeBubble());
  }

  /* 描画 */

  function drawFish(f) {
    var len = f.len;
    var h = len * 0.42;         // 体高
    var dir = f.dir;            // 1=右向き, -1=左向き
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(dir, 1);
    // 紡錘形の体（頭が前(+x)、尾が後ろ(-x)）
    ctx.beginPath();
    ctx.moveTo(len * 0.5, 0);
    ctx.quadraticCurveTo(len * 0.1, -h * 0.5, -len * 0.35, 0);
    ctx.quadraticCurveTo(len * 0.1, h * 0.5, len * 0.5, 0);
    ctx.fill();
    // 尾びれ（三角）
    ctx.beginPath();
    ctx.moveTo(-len * 0.32, 0);
    ctx.lineTo(-len * 0.5, -h * 0.55);
    ctx.lineTo(-len * 0.5, h * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 気泡
    ctx.fillStyle = colors.bubble;
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      ctx.beginPath();
      ctx.arc(b.x + Math.sin(b.swayPhase) * b.swayAmp, b.y, b.r, 0, TWO_PI);
      ctx.fill();
    }
    // 魚
    ctx.fillStyle = colors.fish;
    for (var j = 0; j < fishes.length; j++) drawFish(fishes[j]);
  }

  function update(dt) {
    var i, f, b;
    for (i = 0; i < fishes.length; i++) {
      f = fishes[i];
      f.x += f.speed * dt;
      f.wobPhase += f.wobSpeed * dt;
      f.y += Math.sin(f.wobPhase) * f.wobAmp * dt;
      // 上下の緩い制限
      if (f.y < H * 0.06) f.y = H * 0.06;
      if (f.y > H * 0.94) f.y = H * 0.94;
      // 画面端で反対側へラップ
      var margin = f.len;
      if (f.dir > 0 && f.x > W + margin) f.x = -margin;
      else if (f.dir < 0 && f.x < -margin) f.x = W + margin;
    }
    for (i = 0; i < bubbles.length; i++) {
      b = bubbles[i];
      b.y -= b.speed * dt;
      b.swayPhase += b.swaySpeed * dt;
      if (b.y < -b.r) {
        b.y = H + b.r;
        b.x = rand(0, W);
      }
    }
  }

  /* ループ制御 */

  function tick(now) {
    if (!running) return;
    var dt = (now - lastTime) / 1000;
    lastTime = now;
    // タブ復帰などで大ジャンプした場合はクランプ
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    update(dt);
    draw();
    rafId = requestAnimationFrame(tick);
  }

  // 動かして良い状態か（可視・モーダル閉・reduce無効）
  function shouldRun() {
    if (reduceMotion) return false;
    if (document.hidden) return false;
    var overlay = document.getElementById('modal-overlay');
    if (overlay && !overlay.hasAttribute('hidden')) return false;
    return true;
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function sync() {
    if (shouldRun()) start();
    else {
      stop();
      // reduce-motion 時は静止画を1枚だけ描いておく
      if (reduceMotion && ctx) draw();
    }
  }

  /* サイズ */

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    populate();
    if (!running && ctx) draw();  // 停止中でも描き直す
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }

  /* 初期化 */

  function init() {
    canvas = document.createElement('canvas');
    canvas.className = 'bg-aquarium';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');

    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotion = mq.matches;
    if (mq.addEventListener) mq.addEventListener('change', function (e) {
      reduceMotion = e.matches; sync();
    });

    resolveColors();
    resize();
    sync();

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', sync);

    // テーマ変更 → 色を再解決（位置状態は保持）
    var themeObs = new MutationObserver(function () {
      resolveColors();
      if (!running && ctx) draw();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // モーダルの開閉（hidden 属性）を監視して停止/再開
    var overlay = document.getElementById('modal-overlay');
    if (overlay) {
      var modalObs = new MutationObserver(sync);
      modalObs.observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
