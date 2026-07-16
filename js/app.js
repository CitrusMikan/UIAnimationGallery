/* app.js — カタログ描画・検索/フィルタ・モーダル・コードタブ + プレビューエンジン(PV)。
 * データは js/data/*.js が UIANIM.register() で登録する。 */
(function (global) {
  'use strict';

  /* カテゴリ定義 */
  const CATEGORIES = [
    { id: 'entrance',  label: '出現・退場',       en: 'ENTRANCE / EXIT' },
    { id: 'attention', label: '強調・ループ',     en: 'ATTENTION / LOOP' },
    { id: 'button',    label: 'ボタン・操作',     en: 'BUTTON / INTERACTION' },
    { id: 'widget',    label: 'UI部品',           en: 'WIDGET' },
    { id: 'text',      label: 'テキスト・数値',   en: 'TEXT / NUMBER' },
    { id: 'loading',   label: 'ローディング・進捗', en: 'LOADING / PROGRESS' },
    { id: 'list',      label: 'リスト・レイアウト', en: 'LIST / LAYOUT' },
    { id: 'web',       label: 'モダンWeb・モーション', en: 'WEB / MOTION DESIGN' },
    { id: 'transition', label: '画面遷移・Material', en: 'SCREEN TRANSITION / MATERIAL' },
  ];

  const ANIMS = [];

  /* PV: プレビューエンジン
   * ctx 単位で rAF トゥイーンを管理し、まとめてキャンセルできる。 */
  const PV = {
    /* 要素生成ヘルパー */
    el(cls, styles, text, tag) {
      const e = document.createElement(tag || 'div');
      if (cls) e.className = cls;
      if (styles) Object.assign(e.style, styles);
      if (text != null) e.textContent = text;
      return e;
    },
    /* 黄色パネル(デモ用の標準ボックス) */
    box(ctx, opts) {
      opts = opts || {};
      const b = PV.el('pv-box' + (opts.cls ? ' ' + opts.cls : ''), opts.styles, null);
      if (opts.w) b.style.width = opts.w + 'px';
      if (opts.h) b.style.height = opts.h + 'px';
      const label = PV.el('pv-box-label', null, opts.label != null ? opts.label : 'UI');
      b.appendChild(label);
      (opts.parent || ctx.stage).appendChild(b);
      return b;
    },
    /* デモ用ボタン */
    button(ctx, label, opts) {
      opts = opts || {};
      const b = PV.el('pv-btn' + (opts.cls ? ' ' + opts.cls : ''), opts.styles, label || 'CONFIRM');
      (opts.parent || ctx.stage).appendChild(b);
      return b;
    },
    /* transform 状態オブジェクトを style.transform へ反映 */
    applyT(el, s) {
      const x = s.x || 0, y = s.y || 0;
      const sx = s.sx != null ? s.sx : (s.s != null ? s.s : 1);
      const sy = s.sy != null ? s.sy : (s.s != null ? s.s : 1);
      let t = `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
      if (s.rot) t += ` rotate(${s.rot}deg)`;
      if (s.rotY) t += ` rotateY(${s.rotY}deg)`;
      if (s.rotX) t += ` rotateX(${s.rotX}deg)`;
      el.style.transform = t;
    },
    /* CSS変数を [r,g,b] に解決 (#rgb/#rrggbb/rgb() 対応)。JS色補間をテーマ追従させる用 */
    rgb(cssVar) {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
      if (raw.charAt(0) === '#') {
        let h = raw.slice(1);
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const n = parseInt(h, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
      const m = raw.match(/(\d+(?:\.\d+)?)/g);
      return m ? [+m[0], +m[1], +m[2]] : [128, 128, 128];
    },
  };

  function createCtx(stage) {
    const ctx = {
      stage,
      alive: true,
      _rafs: new Set(),
      _timers: new Set(),

      kill() {
        this.alive = false;
        this._rafs.forEach(id => cancelAnimationFrame(id));
        this._timers.forEach(id => clearTimeout(id));
        this._rafs.clear();
        this._timers.clear();
      },

      /* opts:{from,to,duration(秒),ease,delay(秒),loops(-1=無限),
       * loopType('Restart'|'Yoyo'),onUpdate(v,t01),onComplete} → Promise */
      tween(opts) {
        const self = this;
        return new Promise(resolve => {
          if (!self.alive) return resolve();
          const from = opts.from != null ? opts.from : 0;
          const to = opts.to != null ? opts.to : 1;
          const dur = Math.max((opts.duration != null ? opts.duration : 0.3) * 1000, 1);
          const easeFn = typeof opts.ease === 'function' ? opts.ease : (EASE[opts.ease] || EASE.Linear);
          const loops = opts.loops != null ? opts.loops : 1;
          const yoyo = opts.loopType === 'Yoyo';

          function startLoop(loopIndex) {
            if (!self.alive) return resolve();
            const start = performance.now();
            function frame(now) {
              if (!self.alive) return resolve();
              let t = (now - start) / dur;
              if (t < 0) t = 0;
              if (t >= 1) t = 1;
              let tt = t;
              if (yoyo && loopIndex % 2 === 1) tt = 1 - t;
              const e = easeFn(yoyo && loopIndex % 2 === 1 ? 1 - tt : tt);
              const v = yoyo && loopIndex % 2 === 1
                ? to + (from - to) * e
                : from + (to - from) * e;
              if (opts.onUpdate) opts.onUpdate(v, t);
              if (t < 1) {
                const id = requestAnimationFrame(frame);
                self._rafs.add(id);
              } else {
                const next = loopIndex + 1;
                if (loops === -1 || next < loops) {
                  startLoop(next);
                } else {
                  if (opts.onComplete) opts.onComplete();
                  resolve();
                }
              }
            }
            const id = requestAnimationFrame(frame);
            self._rafs.add(id);
          }

          if (opts.delay) {
            const id = setTimeout(() => { self._timers.delete(id); startLoop(0); }, opts.delay * 1000);
            self._timers.add(id);
          } else {
            startLoop(0);
          }
        });
      },

      wait(sec) {
        const self = this;
        return new Promise(resolve => {
          if (!self.alive) return resolve();
          const id = setTimeout(() => { self._timers.delete(id); resolve(); }, sec * 1000);
          self._timers.add(id);
        });
      },

      /* alive の間だけ非同期関数を繰り返す (ループデモ用) */
      async forever(fn, intervalSec) {
        while (this.alive) {
          await fn();
          if (intervalSec) await this.wait(intervalSec);
          else await this.wait(0.016);
        }
      },
    };
    return ctx;
  }

  function runPreview(anim, stage) {
    stopPreview(stage);
    stage.innerHTML = '';
    const ctx = createCtx(stage);
    stage._ctx = ctx;
    try { anim.preview(ctx, PV); } catch (e) { console.error('[preview]', anim.id, e); }
  }
  function stopPreview(stage) {
    if (stage._ctx) { stage._ctx.kill(); stage._ctx = null; }
  }

  /* AI SPEC 生成 */
  function buildAiSpec(anim) {
    const spec = Object.assign(
      { name: anim.titleEn, name_ja: anim.title, description: anim.description },
      anim.spec
    );
    return [
      '以下はUnity uGUI向けUIアニメーションの仕様です。この仕様どおりのアニメーションを実装してください。',
      '',
      '## アニメーション仕様 (JSON)',
      '```json',
      JSON.stringify(spec, null, 2),
      '```',
      '',
      '## 実装条件',
      '- 対象UIシステム: プロジェクトに合わせて Unity uGUI か UI Toolkit を選択',
      '  - uGUI (RectTransform / CanvasGroup / Image / TextMeshProUGUI) の場合:',
      '    ライブラリは LitMotion を優先、なければ DOTween、どちらも無ければ Coroutine で実装',
      '  - UI Toolkit (VisualElement) の場合:',
      '    状態変化は USS の transition、連続/動的なものは schedule スケジューラで実装 (実験的APIは避ける)',
      '- duration / ease などの数値は仕様の値をそのまま使うこと (ease名はDOTween/USS両方の対応表記で)',
      '- 再生用の public メソッド Play() を持つ MonoBehaviour として実装すること',
      '- 破棄時(OnDestroy/OnDisable)にモーションやスケジュールを確実に停止すること',
    ].join('\n');
  }

  /* コピー (navigator.clipboard + file:// フォールバック) */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  /* ユーティリティ */
  function pad3(n) { return String(n).padStart(3, '0'); }
  function pascal(id) {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }
  const TAB_SUFFIX = { litmotion: 'LitMotion', dotween: 'DOTween', coroutine: 'Coroutine', uitoolkit: 'UIToolkit' };

  /* テーマ切替 */
  const THEMES = [
    { id: 'dark',     label: 'DARK',     bg: '#0b0b0c', accent: '#f5e003' },
    { id: 'light',    label: 'LIGHT',    bg: '#eceae4', accent: '#d19a00' },
    { id: 'sakura',   label: 'SAKURA',   bg: '#fbeef2', accent: '#cf5486' },
    { id: 'mint',     label: 'MINT',     bg: '#e9f5ef', accent: '#1f9e7f' },
    { id: 'lavender', label: 'LAVENDER', bg: '#efeafa', accent: '#7c5bd6' },
    { id: 'ocean',    label: 'OCEAN',    bg: '#0a1016', accent: '#33c8e0' },
  ];
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'lavender';
  }
  function setTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem('uianim-theme', id); } catch (e) { /* noop */ }
    document.querySelectorAll('.theme-swatch').forEach(sw =>
      sw.classList.toggle('active', sw.dataset.theme === id));
  }
  function buildThemeSwitcher() {
    const wrap = document.getElementById('theme-swatches');
    if (!wrap) return;
    wrap.innerHTML = '';
    const active = currentTheme();
    THEMES.forEach(t => {
      const b = PV.el('theme-swatch' + (t.id === active ? ' active' : ''), {
        background: `linear-gradient(135deg, ${t.bg} 0 52%, ${t.accent} 52% 100%)`,
      }, null, 'button');
      b.dataset.theme = t.id;
      b.title = t.label;
      b.setAttribute('aria-label', 'テーマ: ' + t.label);
      b.addEventListener('click', () => setTheme(t.id));
      wrap.appendChild(b);
    });
  }

  /* 描画 */
  let activeCategory = 'all';
  let searchQuery = '';
  let observer = null;

  function renderFilterChips() {
    const wrap = document.getElementById('filter-chips');
    wrap.innerHTML = '';
    const mkChip = (id, label, count) => {
      const b = PV.el('chip' + (activeCategory === id ? ' active' : ''), null, null, 'button');
      b.appendChild(PV.el('chip-label', null, label, 'span'));
      b.appendChild(PV.el('chip-count mono', null, pad3(count), 'span'));
      b.addEventListener('click', () => {
        activeCategory = id;
        renderFilterChips();
        applyFilter();
      });
      wrap.appendChild(b);
    };
    mkChip('all', 'ALL', ANIMS.length);
    CATEGORIES.forEach(c => {
      const count = ANIMS.filter(a => a.category === c.id).length;
      if (count > 0) mkChip(c.id, c.label, count);
    });
  }

  function renderSections() {
    const root = document.getElementById('category-sections');
    root.innerHTML = '';
    let no = 0;

    CATEGORIES.forEach(cat => {
      const items = ANIMS.filter(a => a.category === cat.id);
      if (!items.length) return;

      const section = PV.el('category-section');
      section.dataset.category = cat.id;

      const head = PV.el('category-head');
      head.appendChild(PV.el('category-en mono', null, '// ' + cat.en));
      head.appendChild(PV.el('category-title', null, cat.label, 'h2'));
      head.appendChild(PV.el('category-rule'));
      section.appendChild(head);

      const grid = PV.el('card-grid');
      items.forEach(anim => {
        no++;
        anim._no = no;
        grid.appendChild(buildCard(anim));
      });
      section.appendChild(grid);
      root.appendChild(section);
    });

    document.getElementById('total-count').textContent = pad3(no);
  }

  function buildCard(anim) {
    const card = PV.el('card');
    card.dataset.id = anim.id;

    const head = PV.el('card-head mono');
    head.appendChild(PV.el('card-no', null, 'No.' + pad3(anim._no), 'span'));
    head.appendChild(PV.el('card-cat', null, anim.category.toUpperCase(), 'span'));
    card.appendChild(head);

    const stageWrap = PV.el('card-stage-wrap');
    const stage = PV.el('preview-stage card-stage');
    stageWrap.appendChild(stage);
    if (anim.interactive) {
      // 操作できるプレビューはカード上で直接触れるように、モーダルへのクリックを止める
      stageWrap.addEventListener('click', ev => ev.stopPropagation());
      stageWrap.appendChild(PV.el('card-try mono', null, '▶ TRY IT'));
    }
    const replay = PV.el('card-replay mono', null, '↻', 'button');
    replay.title = 'リプレイ';
    replay.addEventListener('click', ev => {
      ev.stopPropagation();
      runPreview(anim, stage);
    });
    stageWrap.appendChild(replay);
    card.appendChild(stageWrap);

    const info = PV.el('card-info');
    const titleRow = PV.el('card-title-row');
    const titleWrap = PV.el('card-title-wrap');
    titleWrap.appendChild(PV.el('card-title', null, anim.title));
    titleWrap.appendChild(PV.el('card-title-en mono', null, anim.titleEn.toUpperCase()));
    titleRow.appendChild(titleWrap);
    const codeBtn = PV.el('card-code-btn mono', null, '</> CODE', 'button');
    codeBtn.title = 'コードとAIスペックを表示';
    codeBtn.addEventListener('click', ev => { ev.stopPropagation(); openModal(anim); });
    titleRow.appendChild(codeBtn);
    info.appendChild(titleRow);
    const tags = PV.el('card-tags');
    (anim.tags || []).slice(0, 4).forEach(t => tags.appendChild(PV.el('tag mono', null, t, 'span')));
    info.appendChild(tags);
    card.appendChild(info);

    card.addEventListener('click', () => openModal(anim));
    card._anim = anim;
    card._stage = stage;
    return card;
  }

  function applyFilter() {
    const q = searchQuery.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('.category-section').forEach(section => {
      let sectionVisible = 0;
      section.querySelectorAll('.card').forEach(card => {
        const a = card._anim;
        const catOk = activeCategory === 'all' || a.category === activeCategory;
        const text = (a.title + ' ' + a.titleEn + ' ' + (a.tags || []).join(' ') + ' ' + a.description).toLowerCase();
        const qOk = !q || text.includes(q);
        const show = catOk && qOk;
        card.style.display = show ? '' : 'none';
        if (show) sectionVisible++;
        else stopPreview(card._stage);
      });
      section.style.display = sectionVisible ? '' : 'none';
      visible += sectionVisible;
    });
    document.getElementById('empty-state').hidden = visible > 0;
  }

  function setupObserver() {
    observer = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const card = en.target;
        if (en.isIntersecting) {
          runPreview(card._anim, card._stage);
        } else {
          stopPreview(card._stage);
        }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.card').forEach(c => observer.observe(c));
  }

  /* 詳細モーダル */
  let currentAnim = null;
  let currentTab = 'litmotion';

  function openModal(anim) {
    currentAnim = anim;
    currentTab = 'litmotion';
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');

    document.getElementById('modal-no').textContent =
      'No.' + pad3(anim._no) + ' / ' + anim.id.toUpperCase().replace(/-/g, '_');
    document.getElementById('modal-title').textContent = anim.title;
    document.getElementById('modal-title-en').textContent = anim.titleEn.toUpperCase();
    document.getElementById('modal-desc').textContent = anim.description;

    const tagWrap = document.getElementById('modal-tags');
    tagWrap.innerHTML = '';
    (anim.tags || []).forEach(t => tagWrap.appendChild(PV.el('tag mono', null, t, 'span')));

    const table = document.getElementById('spec-table');
    table.innerHTML = '';
    const spec = anim.spec || {};
    Object.keys(spec).forEach(k => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.className = 'mono';
      th.textContent = k;
      const td = document.createElement('td');
      td.className = 'mono';
      td.textContent = typeof spec[k] === 'object' ? JSON.stringify(spec[k]) : String(spec[k]);
      tr.appendChild(th); tr.appendChild(td);
      table.appendChild(tr);
    });

    document.querySelectorAll('.code-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === currentTab);
    });
    renderCode();

    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      modal.classList.add('open');
    });
    document.body.style.overflow = 'hidden';

    const stage = document.getElementById('modal-stage');
    runPreview(anim, stage);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    overlay.classList.remove('open');
    modal.classList.remove('open');
    stopPreview(document.getElementById('modal-stage'));
    setTimeout(() => { overlay.hidden = true; }, 250);
    document.body.style.overflow = '';
    currentAnim = null;
  }

  function renderCode() {
    if (!currentAnim) return;
    const codeEl = document.getElementById('code-view');
    const fileEl = document.getElementById('code-filename');
    let text;
    if (currentTab === 'aispec') {
      text = buildAiSpec(currentAnim);
      fileEl.textContent = currentAnim.id + '_spec.md';
    } else {
      text = (currentAnim.code && currentAnim.code[currentTab]) || '// (準備中)';
      const base = pascal(currentAnim.id) + '_' + TAB_SUFFIX[currentTab];
      fileEl.textContent = currentTab === 'uitoolkit' ? base + '.uss + .cs' : base + '.cs';
    }
    codeEl.textContent = text.trim ? text.trim() : text;
    document.getElementById('ai-hint').style.display = currentTab === 'aispec' ? '' : 'none';
  }

  function setupModalEvents() {
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', ev => {
      if (ev.target === ev.currentTarget) closeModal();
    });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && currentAnim) closeModal();
    });
    document.getElementById('modal-replay').addEventListener('click', () => {
      if (currentAnim) runPreview(currentAnim, document.getElementById('modal-stage'));
    });
    document.querySelectorAll('.code-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        document.querySelectorAll('.code-tab').forEach(b =>
          b.classList.toggle('active', b === btn));
        renderCode();
      });
    });
    const copyBtn = document.getElementById('btn-copy');
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('code-view').textContent;
      copyText(text).then(() => {
        copyBtn.textContent = 'COPIED!';
        copyBtn.classList.add('done');
        setTimeout(() => {
          copyBtn.textContent = 'COPY';
          copyBtn.classList.remove('done');
        }, 1200);
      });
    });
  }

  /* 公開API */
  global.UIANIM = {
    register(anim) { ANIMS.push(anim); },
    /* 既存アニメに後からコードを付与する (uitoolkit等をidで紐付け) */
    attachCode(id, key, code) {
      const a = ANIMS.find(x => x.id === id);
      if (a) { a.code = a.code || {}; a.code[key] = code; }
    },
    init() {
      buildThemeSwitcher();
      renderFilterChips();
      renderSections();
      setupObserver();
      setupModalEvents();
      document.getElementById('search-input').addEventListener('input', ev => {
        searchQuery = ev.target.value;
        applyFilter();
      });
      // ?open=<id>&tab=<tab> で詳細モーダルとタブを直接開く (共有・検証用)
      const params = new URLSearchParams(location.search);
      const openId = params.get('open');
      if (openId) {
        const anim = ANIMS.find(a => a.id === openId);
        if (anim) {
          openModal(anim);
          const tab = params.get('tab');
          const tabBtn = tab && document.querySelector('.code-tab[data-tab="' + tab + '"]');
          if (tabBtn) tabBtn.click();
        }
      }
    },
    PV,
  };
  global.PV = PV;
})(window);
