/* 12-gameui.js — 参考モーションカタログ由来のアイデアを
 *   ゲームUI向けに自前実装した追加分 (5種)。
 * 配属: entrance / widget / button / text。
 * 各種にUI Toolkit実装も同梱 (10/11 と同じインライン方式)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. ディゾルブ / 溶解退場 (entrance) */
  R({
    id: 'dissolve',
    title: 'ディゾルブ',
    titleEn: 'Dissolve',
    category: 'entrance',
    tags: ['dissolve', 'shader', '撃破', '退場'],
    description: 'ノイズ閾値を上げながら、端が発光しつつ砕けて消える溶解退場。ユニット撃破・カードの焼失・霧散演出に。単純なフェードでは出せない「粒子が飛ぶ」質感が出る。実機ではディゾルブシェーダの _DissolveAmount(0→1) を1本のトゥイーンで動かすのが定番。',
    spec: {
      target: 'Material float _DissolveAmount',
      from: 0.0, to: 1.0,
      duration: 1.2,
      ease: 'InQuad',
      note: 'ノイズテクスチャの閾値で消える順を制御。閾値付近を発光色にするとエッジが燃える',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', width: '190px', height: '116px' });
      ctx.stage.appendChild(wrap);
      const COLS = 13, ROWS = 8;
      const cw = 190 / COLS, ch = 116 / ROWS;
      const cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const cell = PV.el(null, {
          position: 'absolute', left: (c * cw) + 'px', top: (r * ch) + 'px',
          width: (cw + 0.5) + 'px', height: (ch + 0.5) + 'px', willChange: 'transform,opacity',
          background: 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))',
        });
        // 右上ほど早く消えるバイアス + ランダムで自然な溶解順に
        const bias = (c / COLS) * 0.5 + (1 - r / ROWS) * 0.2;
        cell._th = Math.min(0.98, Math.max(0.02, bias * 0.6 + Math.random() * 0.5));
        wrap.appendChild(cell);
        cells.push(cell);
      }
      const label = PV.el('mono', {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        fontSize: '13px', letterSpacing: '0.2em', color: 'var(--pv-accent)', zIndex: '1', pointerEvents: 'none',
      }, 'UNIT');
      wrap.appendChild(label);
      const apply = t => {
        cells.forEach(cell => {
          const d = cell._th - t;               // >0: まだ残っている
          if (d > 0.06) {
            cell.style.opacity = '1'; cell.style.transform = 'none';
            cell.style.background = 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))';
          } else if (d > -0.06) {               // 燃えるエッジ
            cell.style.opacity = '1'; cell.style.background = 'var(--pv-accent)';
            cell.style.transform = `scale(${0.6 + (d + 0.06) / 0.12 * 0.4})`;
          } else {                              // 崩れて上に飛ぶ
            const a = Math.max(0, 1 + (d + 0.06) / 0.25);
            cell.style.opacity = String(a); cell.style.background = 'var(--pv-accent)';
            cell.style.transform = `translateY(${d * 20}px) scale(${a})`;
          }
        });
        label.style.opacity = String(Math.max(0, 1 - t * 2.2));
      };
      ctx.forever(async () => {
        await ctx.tween({ from: 0, to: 1.1, duration: 1.4, ease: 'InQuad', onUpdate: apply });
        await ctx.wait(0.5);
        await ctx.tween({ from: 1.1, to: 0, duration: 0.9, ease: 'OutCubic', onUpdate: apply });
        await ctx.wait(0.7);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// 溶解シェーダのマテリアルに _DissolveAmount(0..1) を持たせておく
public class DissolveLitMotion : MonoBehaviour
{
    [SerializeField] Graphic target;          // Image / TMP など
    [SerializeField] float duration = 1.2f;
    static readonly int Amount = Shader.PropertyToID("_DissolveAmount");

    public void DissolveOut()
    {
        var mat = target.material;            // インスタンス化されたマテリアル
        LMotion.Create(0f, 1f, duration)
            .WithEase(Ease.InQuad)
            .Bind(v => mat.SetFloat(Amount, v))
            .AddTo(gameObject);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class DissolveDOTween : MonoBehaviour
{
    [SerializeField] Graphic target;
    [SerializeField] float duration = 1.2f;
    static readonly int Amount = Shader.PropertyToID("_DissolveAmount");

    public void DissolveOut()
    {
        var mat = target.material;
        DOTween.To(() => mat.GetFloat(Amount), v => mat.SetFloat(Amount, v), 1f, duration)
            .SetEase(Ease.InQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class DissolveCoroutine : MonoBehaviour
{
    [SerializeField] Graphic target;
    [SerializeField] float duration = 1.2f;
    static readonly int Amount = Shader.PropertyToID("_DissolveAmount");

    public void DissolveOut() => StartCoroutine(Run());

    IEnumerator Run()
    {
        var mat = target.material;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = Mathf.Clamp01(t / duration);
            mat.SetFloat(Amount, e * e);      // InQuad
            yield return null;
        }
        mat.SetFloat(Amount, 1f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USSにノイズ溶解の表現は無いため、
   溶解シェーダのマテリアル float を schedule で駆動する (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DissolveUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Material dissolveMaterial;   // _DissolveAmount を持つマテリアル
    [SerializeField] string elementName = "Unit"; // material を割り当てた VisualElement
    [SerializeField] float duration = 1.2f;
    static readonly int Amount = Shader.PropertyToID("_DissolveAmount");

    public void DissolveOut()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float t = 0f;
        el.schedule.Execute(() =>
        {
            t += 0.016f;
            float e = Mathf.Clamp01(t / duration);
            dissolveMaterial.SetFloat(Amount, e * e);
        }).Every(16).Until(() => t >= duration);
    }
}`,
    },
  });

  /* 2. 放射状メニュー (widget / interactive) */
  R({
    id: 'radial-menu',
    interactive: true,
    title: '放射状メニュー',
    titleEn: 'Radial Menu',
    category: 'widget',
    tags: ['radial', 'wheel', 'クイックメニュー', 'MD3'],
    description: '中央のハブから複数の項目が円弧状に開くクイックメニュー。ウェポンホイール・放射状ショートカット・キャラ選択に。各項目を角度から配置し、位置とスケールを少しずつ遅延させて OutBack で開くと弾ける気持ちよさが出る。プレビューは中央のハブをクリックで開閉。',
    spec: {
      layout: '角度 = π - (i/(n-1))·π。dir=(cos,-sin)、位置 = dir·radius',
      radius: 74,
      per_item: { target: 'anchoredPosition + localScale', duration: 0.4, ease: 'OutBack(開)/InBack(閉)' },
      stagger: 0.045,
      hub: '開いたら +45°回転して × に',
    },
    preview(ctx, PV) {
      const hub = PV.el(null, {
        position: 'absolute', left: '50%', top: '64%', width: '48px', height: '48px',
        marginLeft: '-24px', marginTop: '-24px', borderRadius: '50%', background: 'var(--pv-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '2',
        transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)',
      });
      hub.appendChild(PV.el(null, { color: 'var(--pv-on-accent)', fontSize: '24px', fontWeight: '700', lineHeight: '1' }, '+'));
      ctx.stage.appendChild(hub);

      const N = 5, RAD = 74;
      const icons = ['⚔', '✦', '◆', '♥', '⛩'];
      const items = [];
      for (let i = 0; i < N; i++) {
        const it = PV.el(null, {
          position: 'absolute', left: '50%', top: '64%', width: '34px', height: '34px',
          marginLeft: '-17px', marginTop: '-17px', borderRadius: '50%',
          background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--pv-accent)', fontSize: '15px', willChange: 'transform',
        });
        it.textContent = icons[i % icons.length];
        ctx.stage.appendChild(it);
        const ang = Math.PI - (i / (N - 1)) * Math.PI;
        it._dx = Math.cos(ang) * RAD; it._dy = -Math.sin(ang) * RAD;
        PV.applyT(it, { s: 0.001 });
        items.push(it);
      }
      let open = false, running = false;
      const setOpen = async o => {
        if (running) return; running = true; open = o;
        hub.style.transform = o ? 'rotate(135deg)' : 'rotate(0deg)';
        await Promise.all(items.map((it, i) => ctx.tween({
          from: 0, to: 1, duration: 0.4, delay: i * 0.045, ease: o ? 'OutBack' : 'InBack',
          onUpdate: v => { const p = o ? v : 1 - v; PV.applyT(it, { x: it._dx * p, y: it._dy * p, s: Math.max(0.001, p) }); },
        })));
        running = false;
      };
      hub.addEventListener('click', () => setOpen(!open));
      ctx.forever(async () => {
        await ctx.wait(0.8); await setOpen(true);
        await ctx.wait(1.4); await setOpen(false);
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class RadialMenuLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] float radius = 160f;
    [SerializeField] float duration = 0.35f;
    [SerializeField] float stagger = 0.045f;
    bool open;

    public void Toggle()
    {
        open = !open;
        for (int i = 0; i < items.Length; i++)
        {
            float ang = Mathf.PI - (i / (float)(items.Length - 1)) * Mathf.PI;
            Vector2 to = open ? new Vector2(Mathf.Cos(ang), Mathf.Sin(ang)) * radius : Vector2.zero;
            int idx = i;
            LMotion.Create(items[i].anchoredPosition, to, duration)
                .WithEase(open ? Ease.OutBack : Ease.InBack).WithDelay(i * stagger)
                .BindToAnchoredPosition(items[i]);
            LMotion.Create(items[i].localScale.x, open ? 1f : 0f, duration)
                .WithEase(open ? Ease.OutBack : Ease.InBack).WithDelay(i * stagger)
                .Bind(s => items[idx].localScale = Vector3.one * s);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class RadialMenuDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] float radius = 160f;
    [SerializeField] float duration = 0.35f;
    [SerializeField] float stagger = 0.045f;
    bool open;

    public void Toggle()
    {
        open = !open;
        for (int i = 0; i < items.Length; i++)
        {
            float ang = Mathf.PI - (i / (float)(items.Length - 1)) * Mathf.PI;
            Vector2 to = open ? new Vector2(Mathf.Cos(ang), Mathf.Sin(ang)) * radius : Vector2.zero;
            var ease = open ? Ease.OutBack : Ease.InBack;
            items[i].DOAnchorPos(to, duration).SetEase(ease).SetDelay(i * stagger);
            items[i].DOScale(open ? 1f : 0f, duration).SetEase(ease).SetDelay(i * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class RadialMenuCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] float radius = 160f;
    [SerializeField] float duration = 0.35f;
    [SerializeField] float stagger = 0.045f;
    bool open;

    public void Toggle()
    {
        open = !open;
        StopAllCoroutines();
        for (int i = 0; i < items.Length; i++)
            StartCoroutine(Move(items[i], i, open));
    }

    IEnumerator Move(RectTransform item, int i, bool opening)
    {
        yield return new WaitForSeconds(i * stagger);
        float ang = Mathf.PI - (i / (float)(items.Length - 1)) * Mathf.PI;
        Vector2 from = item.anchoredPosition;
        Vector2 to = opening ? new Vector2(Mathf.Cos(ang), Mathf.Sin(ang)) * radius : Vector2.zero;
        float fromS = item.localScale.x, toS = opening ? 1f : 0f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / duration));
            item.anchoredPosition = Vector2.LerpUnclamped(from, to, e);
            item.localScale = Vector3.one * Mathf.LerpUnclamped(fromS, toS, e);
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = 2.70158f;
        return 1f + c3 * Mathf.Pow(x - 1f, 3f) + c1 * Mathf.Pow(x - 1f, 2f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.radial-item {
    position: absolute;
    translate: 0 0;
    scale: 0;
    transition: translate 350ms ease-out-back, scale 350ms ease-out-back;
}

/* ===== C# (.cs) — 角度計算が要るため translate/scale はコードで与える ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class RadialMenuUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float radius = 160f;
    [SerializeField] float stagger = 0.045f;
    List<VisualElement> items;
    bool open;

    void OnEnable()
    {
        items = document.rootVisualElement.Query<VisualElement>(className: "radial-item").ToList();
    }

    public void Toggle()
    {
        open = !open;
        for (int i = 0; i < items.Count; i++)
        {
            var it = items[i];
            it.style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
            float ang = Mathf.PI - (i / (float)(items.Count - 1)) * Mathf.PI;
            if (open)
            {
                it.style.translate = new Translate(Mathf.Cos(ang) * radius, -Mathf.Sin(ang) * radius, 0);
                it.style.scale = new Scale(Vector3.one);
            }
            else
            {
                it.style.translate = new Translate(0, 0, 0);
                it.style.scale = new Scale(Vector3.zero);
            }
        }
    }
}`,
    },
  });

  /* 3. 塗りつぶしスイープボタン (button / interactive) */
  R({
    id: 'fill-sweep',
    interactive: true,
    title: '塗りつぶしスイープ',
    titleEn: 'Fill Sweep',
    category: 'button',
    tags: ['hover', 'fill', 'menu', 'sweep'],
    description: 'ホバーで塗りがボタンを横断して埋め、文字色が反転する。メニュー項目・確定ボタンの選択強調に。入るときは左から、離れるときは右へ抜けると流れが自然。scaleX を transform-origin と一緒に切り替えるだけで実装できる。プレビューはホバーで試せる。',
    spec: {
      fill: { target: 'RectTransform.localScale.x', from: 0, to: 1, duration: 0.35, ease: 'OutCubic' },
      origin: 'hover-in=left / hover-out=right',
      label: 'ホバー中は文字色を on-accent へ',
    },
    preview(ctx, PV) {
      const btn = PV.el('mono', {
        position: 'relative', overflow: 'hidden', padding: '14px 32px', minWidth: '150px', textAlign: 'center',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-accent)', color: 'var(--pv-accent)',
        fontSize: '13px', letterSpacing: '0.18em', cursor: 'pointer',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      });
      const fill = PV.el(null, {
        position: 'absolute', inset: '0', background: 'var(--pv-accent)', zIndex: '0',
        transformOrigin: 'left center', transform: 'scaleX(0)',
        transition: 'transform .35s cubic-bezier(.22,.61,.36,1)',
      });
      const label = PV.el(null, { position: 'relative', zIndex: '1', transition: 'color .2s' }, 'START');
      btn.appendChild(fill); btn.appendChild(label);
      ctx.stage.appendChild(btn);
      const set = on => {
        fill.style.transformOrigin = on ? 'left center' : 'right center';
        fill.style.transform = `scaleX(${on ? 1 : 0})`;
        label.style.color = on ? 'var(--pv-on-accent)' : 'var(--pv-accent)';
      };
      btn.addEventListener('pointerenter', () => set(true));
      btn.addEventListener('pointerleave', () => set(false));
      ctx.forever(async () => {
        await ctx.wait(1.0); if (!btn.matches(':hover')) set(true);
        await ctx.wait(0.9); if (!btn.matches(':hover')) set(false);
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// fill は pivot(0,0.5) の Image を重ね、ローカルScale.x を 0..1 で動かす
public class FillSweepLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform fill;
    [SerializeField] Graphic label;
    [SerializeField] Color hoverText = Color.black;
    [SerializeField] float duration = 0.35f;
    Color baseText;

    void Awake() { baseText = label.color; fill.localScale = new Vector3(0f, 1f, 1f); }

    public void OnHover(bool on)
    {
        fill.pivot = new Vector2(on ? 0f : 1f, 0.5f);   // 入り=左 / 抜け=右
        LMotion.Create(fill.localScale.x, on ? 1f : 0f, duration)
            .WithEase(Ease.OutCubic)
            .Bind(x => fill.localScale = new Vector3(x, 1f, 1f));
        label.color = on ? hoverText : baseText;
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class FillSweepDOTween : MonoBehaviour
{
    [SerializeField] RectTransform fill;
    [SerializeField] Graphic label;
    [SerializeField] Color hoverText = Color.black;
    [SerializeField] float duration = 0.35f;
    Color baseText;

    void Awake() { baseText = label.color; fill.localScale = new Vector3(0f, 1f, 1f); }

    public void OnHover(bool on)
    {
        fill.pivot = new Vector2(on ? 0f : 1f, 0.5f);
        fill.DOScaleX(on ? 1f : 0f, duration).SetEase(Ease.OutCubic);
        label.DOColor(on ? hoverText : baseText, duration * 0.6f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class FillSweepCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform fill;
    [SerializeField] Graphic label;
    [SerializeField] Color hoverText = Color.black;
    [SerializeField] float duration = 0.35f;
    Color baseText;

    void Awake() { baseText = label.color; fill.localScale = new Vector3(0f, 1f, 1f); }

    public void OnHover(bool on)
    {
        StopAllCoroutines();
        fill.pivot = new Vector2(on ? 0f : 1f, 0.5f);
        label.color = on ? hoverText : baseText;
        StartCoroutine(Scale(on ? 1f : 0f));
    }

    IEnumerator Scale(float target)
    {
        float from = fill.localScale.x, t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / duration), 3f); // OutCubic
            fill.localScale = new Vector3(Mathf.Lerp(from, target, e), 1f, 1f);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.fill-btn { overflow: hidden; }
.fill-btn > .fill {
    position: absolute; left: 0; top: 0; right: 0; bottom: 0;
    transform-origin: left;
    scale: 0 1;
    transition: scale 350ms ease-out-cubic;
}
.fill-btn > .label { transition: color 200ms ease-out; }
.fill-btn:hover > .fill { scale: 1 1; }
.fill-btn:hover > .label { color: rgb(17, 17, 17); }`,
    },
  });

  /* 4. 下線スライド (button / interactive) */
  R({
    id: 'hover-underline',
    interactive: true,
    title: '下線スライド',
    titleEn: 'Hover Underline',
    category: 'button',
    tags: ['hover', 'underline', 'menu', 'nav'],
    description: 'ホバーで下線が左から伸び、離れると右へ抜ける定番のナビ強調。メニュー・タブ見出し・リンクに。下線 RectTransform の pivot を入り=左/抜け=右に切り替えて Scale.x を 0↔1 するだけ。tab-switch(タブ間移動)とは用途が別で、単一項目のホバー表現。プレビューはホバーで試せる。',
    spec: {
      underline: { target: 'RectTransform.localScale.x', from: 0, to: 1, duration: 0.3, ease: 'OutCubic' },
      origin: 'hover-in=left / hover-out=right',
    },
    preview(ctx, PV) {
      const item = PV.el(null, {
        position: 'relative', display: 'inline-block', padding: '6px 4px 10px', cursor: 'pointer',
        fontFamily: "'Oswald',sans-serif", fontWeight: '600', fontSize: '22px',
        letterSpacing: '0.12em', color: 'var(--pv-text)',
      }, 'CAMPAIGN');
      const bar = PV.el(null, {
        position: 'absolute', left: '4px', right: '4px', bottom: '2px', height: '3px',
        background: 'var(--pv-accent)', transformOrigin: 'left center', transform: 'scaleX(0)',
        transition: 'transform .3s cubic-bezier(.22,.61,.36,1)',
      });
      item.appendChild(bar);
      ctx.stage.appendChild(item);
      const set = on => {
        bar.style.transformOrigin = on ? 'left center' : 'right center';
        bar.style.transform = `scaleX(${on ? 1 : 0})`;
        item.style.color = on ? 'var(--pv-accent)' : 'var(--pv-text)';
      };
      item.addEventListener('pointerenter', () => set(true));
      item.addEventListener('pointerleave', () => set(false));
      ctx.forever(async () => {
        await ctx.wait(1.0); if (!item.matches(':hover')) set(true);
        await ctx.wait(0.9); if (!item.matches(':hover')) set(false);
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// underline は pivot(0,0.5) の細い Image。localScale.x を 0..1 で伸縮
public class HoverUnderlineLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform underline;
    [SerializeField] float duration = 0.3f;

    void Awake() => underline.localScale = new Vector3(0f, 1f, 1f);

    public void OnHover(bool on)
    {
        underline.pivot = new Vector2(on ? 0f : 1f, 0.5f);   // 入り=左 / 抜け=右
        LMotion.Create(underline.localScale.x, on ? 1f : 0f, duration)
            .WithEase(Ease.OutCubic)
            .Bind(x => underline.localScale = new Vector3(x, 1f, 1f));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HoverUnderlineDOTween : MonoBehaviour
{
    [SerializeField] RectTransform underline;
    [SerializeField] float duration = 0.3f;

    void Awake() => underline.localScale = new Vector3(0f, 1f, 1f);

    public void OnHover(bool on)
    {
        underline.pivot = new Vector2(on ? 0f : 1f, 0.5f);
        underline.DOScaleX(on ? 1f : 0f, duration).SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HoverUnderlineCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform underline;
    [SerializeField] float duration = 0.3f;

    void Awake() => underline.localScale = new Vector3(0f, 1f, 1f);

    public void OnHover(bool on)
    {
        StopAllCoroutines();
        underline.pivot = new Vector2(on ? 0f : 1f, 0.5f);
        StartCoroutine(Scale(on ? 1f : 0f));
    }

    IEnumerator Scale(float target)
    {
        float from = underline.localScale.x, t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / duration), 3f); // OutCubic
            underline.localScale = new Vector3(Mathf.Lerp(from, target, e), 1f, 1f);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.nav-item { position: relative; color: rgb(230, 230, 230); transition: color 200ms ease-out; }
.nav-item > .underline {
    position: absolute; left: 0; right: 0; bottom: 0; height: 3px;
    transform-origin: left;
    scale: 0 1;
    transition: scale 300ms ease-out-cubic;
}
.nav-item:hover { color: rgb(245, 224, 3); }
.nav-item:hover > .underline { scale: 1 1; }`,
    },
  });

  /* 5. 文字フリップ (text / interactive) */
  R({
    id: 'char-flip-hover',
    interactive: true,
    title: '文字フリップ',
    titleEn: 'Char Flip',
    category: 'text',
    tags: ['hover', 'roll', 'label', 'menu'],
    description: 'ホバーで各文字が1つずつ上へ回り、下からハイライト色の同じ文字が現れる。メニューラベル・ボタン文字の上質なホバーに。文字ごとに上下2枚を縦に積み、列を文字高さ分ずらすだけ。文字ごとに遅延を付けると波打って見える。プレビューはホバーで試せる。',
    spec: {
      per_char: { target: 'columnのanchoredPosition.y', shift: 'cellHeight', duration: 0.34, ease: 'OutCubic' },
      stagger: 0.03,
      structure: '各文字 = 縦に[通常色 / ハイライト色]の2枚。overflowで窓抜き',
    },
    preview(ctx, PV) {
      const word = 'MISSION';
      const H = 40;
      const wrap = PV.el(null, {
        display: 'flex', gap: '1px', cursor: 'pointer',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '32px',
      });
      ctx.stage.appendChild(wrap);
      const cols = [...word].map((ch, i) => {
        const cell = PV.el(null, { position: 'relative', height: H + 'px', width: '22px', overflow: 'hidden' });
        const col = PV.el(null, {
          position: 'absolute', left: '0', top: '0',
          transition: 'transform .34s cubic-bezier(.22,.61,.36,1)', transitionDelay: (i * 0.03) + 's',
        });
        const mk = color => PV.el(null, {
          height: H + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }, ch);
        col.appendChild(mk('var(--pv-text)'));
        col.appendChild(mk('var(--pv-accent)'));
        cell.appendChild(col); wrap.appendChild(cell);
        return col;
      });
      const set = on => cols.forEach(col => col.style.transform = on ? `translateY(${-H}px)` : 'translateY(0)');
      wrap.addEventListener('pointerenter', () => set(true));
      wrap.addEventListener('pointerleave', () => set(false));
      ctx.forever(async () => {
        await ctx.wait(1.0); if (!wrap.matches(':hover')) set(true);
        await ctx.wait(1.2); if (!wrap.matches(':hover')) set(false);
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 各文字は上下2枚(通常色/ハイライト色)を縦に積んだ column。
// column を cellHeight ぶん上へずらすと下の文字が現れる
public class CharFlipHoverLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;   // 文字ごとのコンテナ
    [SerializeField] float cellHeight = 40f;
    [SerializeField] float duration = 0.34f;
    [SerializeField] float stagger = 0.03f;

    public void OnHover(bool on)
    {
        for (int i = 0; i < columns.Length; i++)
        {
            float toY = on ? cellHeight : 0f;
            LMotion.Create(columns[i].anchoredPosition.y, toY, duration)
                .WithEase(Ease.OutCubic).WithDelay(i * stagger)
                .BindToAnchoredPositionY(columns[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CharFlipHoverDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;
    [SerializeField] float cellHeight = 40f;
    [SerializeField] float duration = 0.34f;
    [SerializeField] float stagger = 0.03f;

    public void OnHover(bool on)
    {
        for (int i = 0; i < columns.Length; i++)
            columns[i].DOAnchorPosY(on ? cellHeight : 0f, duration)
                .SetEase(Ease.OutCubic).SetDelay(i * stagger);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CharFlipHoverCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;
    [SerializeField] float cellHeight = 40f;
    [SerializeField] float duration = 0.34f;
    [SerializeField] float stagger = 0.03f;

    public void OnHover(bool on)
    {
        StopAllCoroutines();
        for (int i = 0; i < columns.Length; i++)
            StartCoroutine(Move(columns[i], i, on ? cellHeight : 0f));
    }

    IEnumerator Move(RectTransform col, int i, float toY)
    {
        yield return new WaitForSeconds(i * stagger);
        float fromY = col.anchoredPosition.y, t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / duration), 3f); // OutCubic
            col.anchoredPosition = new Vector2(col.anchoredPosition.x, Mathf.Lerp(fromY, toY, e));
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.flip-cell { overflow: hidden; height: 40px; }
.flip-col {
    translate: 0 0;
    transition: translate 340ms ease-out-cubic;
}
/* ホバー時、親の :hover で列を1文字分だけ上へ。
   遅延は C# 側で per-char に設定する */
.flip-word:hover .flip-col { translate: 0 -40px; }

/* ===== C# (.cs) — 文字ごとの遅延を付与 ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class CharFlipHoverUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float stagger = 0.03f;

    void OnEnable()
    {
        var cols = document.rootVisualElement.Query<VisualElement>(className: "flip-col").ToList();
        for (int i = 0; i < cols.Count; i++)
            cols[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
    }
}`,
    },
  });
})();
