/* 11-extra.js — 参考サイト由来 + M3インタラクション + テキスト (9種)
 * 既存カテゴリに配属 (web / entrance / widget / loading / list / text)。
 * 各種にUI Toolkit実装も同梱。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. ケンバーンズ (web) */
  R({
    id: 'ken-burns',
    title: 'ケンバーンズ',
    titleEn: 'Ken Burns',
    category: 'web',
    tags: ['hero', 'zoom', 'pan', '背景'],
    description: '背景画像をゆっくりズーム&パンし続け、静止画に生命感を与える。タイトル画面・ヒーロー背景・カットシーンの止め絵に。ズームとパンを逆位相のYoyoループにすると単調にならない。',
    spec: {
      target: 'RectTransform.localScale + anchoredPosition',
      zoom: '1 → 1.12',
      pan: '±20px',
      duration: 6.0,
      ease: 'InOutSine',
      loops: -1, loopType: 'Yoyo',
    },
    preview(ctx, PV) {
      const img = PV.el(null, {
        position: 'absolute', inset: '0',
        background: 'linear-gradient(135deg,#3a3720,#1b1b2e 45%,#2a1a2e)', willChange: 'transform',
      });
      ctx.stage.appendChild(img);
      const cap = PV.el('mono', { position: 'absolute', left: '14px', bottom: '12px', fontSize: '12px', letterSpacing: '0.2em', color: 'var(--pv-accent)' }, 'HERO');
      ctx.stage.appendChild(cap);
      ctx.tween({
        from: 0, to: 1, duration: 5, ease: 'InOutSine', loops: -1, loopType: 'Yoyo',
        onUpdate: v => img.style.transform = `scale(${lerp(1, 1.15, v)}) translate(${lerp(-3, 3, v)}%, ${lerp(2, -2, v)}%)`,
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class KenBurnsLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform image;
    [SerializeField] float duration = 6f;
    [SerializeField] float zoom = 0.12f;
    [SerializeField] float pan = 20f;

    void OnEnable()
    {
        LMotion.Create(1f, 1f + zoom, duration)
            .WithEase(Ease.InOutSine).WithLoops(-1, LoopType.Yoyo)
            .Bind(s => image.localScale = Vector3.one * s);
        LMotion.Create(new Vector2(-pan, pan), new Vector2(pan, -pan), duration)
            .WithEase(Ease.InOutSine).WithLoops(-1, LoopType.Yoyo)
            .BindToAnchoredPosition(image);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class KenBurnsDOTween : MonoBehaviour
{
    [SerializeField] RectTransform image;
    [SerializeField] float duration = 6f;
    [SerializeField] float zoom = 0.12f;
    [SerializeField] float pan = 20f;

    void OnEnable()
    {
        image.DOScale(1f + zoom, duration).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
        image.anchoredPosition = new Vector2(-pan, pan);
        image.DOAnchorPos(new Vector2(pan, -pan), duration).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
    }

    void OnDisable() => image.DOKill();
}`,
      coroutine: `
using UnityEngine;

public class KenBurnsUpdate : MonoBehaviour
{
    [SerializeField] RectTransform image;
    [SerializeField] float duration = 6f;
    [SerializeField] float zoom = 0.12f;
    [SerializeField] float pan = 20f;

    void Update()
    {
        // sin波で 0..1 を往復させ、ズームとパンに反映
        float w = (Mathf.Sin(Time.time / duration * Mathf.PI) + 1f) * 0.5f;
        image.localScale = Vector3.one * Mathf.Lerp(1f, 1f + zoom, w);
        image.anchoredPosition = Vector2.Lerp(new Vector2(-pan, pan), new Vector2(pan, -pan), w);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — 連続ループのため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class KenBurnsUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Hero";
    [SerializeField] float duration = 6f;
    [SerializeField] float zoom = 0.12f;
    [SerializeField] float pan = 20f;

    void OnEnable()
    {
        var img = document.rootVisualElement.Q<VisualElement>(elementName);
        img.schedule.Execute(() =>
        {
            float w = (Mathf.Sin(Time.time / duration * Mathf.PI) + 1f) * 0.5f;
            float s = Mathf.Lerp(1f, 1f + zoom, w);
            img.style.scale = new Scale(new Vector3(s, s, 1f));
            img.style.translate = new Translate(Mathf.Lerp(-pan, pan, w), Mathf.Lerp(pan, -pan, w), 0);
        }).Every(16);
    }
}`,
    },
  });

  /* 2. パララックス (web / interactive) */
  R({
    id: 'parallax',
    interactive: true,
    title: 'パララックス',
    titleEn: 'Parallax',
    category: 'web',
    tags: ['depth', 'pointer', '奥行き', '視差'],
    description: '複数のレイヤーがカーソル(または傾き)に対して異なる速度で動き、奥行きを錯覚させる。タイトル背景やメニューの立体感に。手前のレイヤーほど大きく動かすのがコツ。プレビューはカーソルを乗せて試せる。',
    spec: {
      target: '各レイヤーの anchoredPosition',
      formula: 'target = -pointerOffset * depth (手前ほどdepth大)',
      smoothing: '1 - exp(-8 * dt)',
    },
    preview(ctx, PV) {
      const mkLayer = (styles, depth) => {
        const l = PV.el(null, Object.assign({ position: 'absolute', willChange: 'transform' }, styles));
        l.dataset.depth = depth;
        ctx.stage.appendChild(l);
        return l;
      };
      const back = mkLayer({ inset: '10px', border: '1px dashed var(--pv-line-strong)', opacity: 0.5 }, 0.02);
      const mid = mkLayer({ left: '30%', top: '30%', width: '80px', height: '80px', background: 'linear-gradient(160deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-line-strong)', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)' }, 0.06);
      const front = mkLayer({ left: '50%', top: '55%', color: 'var(--pv-accent)', fontFamily: "'Oswald',sans-serif", fontSize: '26px', fontWeight: '700', transform: 'translate(-50%,-50%)' }, 0.12);
      front.textContent = 'DEPTH';
      const layers = [back, mid, front];
      const base = { back: [0, 0], mid: [0, 0], front: [-50, -50] };
      const onMove = ev => {
        const r = ctx.stage.getBoundingClientRect();
        const nx = (ev.clientX - r.left) / r.width - 0.5;
        const ny = (ev.clientY - r.top) / r.height - 0.5;
        layers.forEach(l => {
          const d = parseFloat(l.dataset.depth);
          const bx = l === front ? -50 : 0, by = l === front ? -50 : 0;
          l.style.transform = `translate(calc(${bx}% + ${-nx * d * 400}px), calc(${by}% + ${-ny * d * 400}px))`;
        });
      };
      ctx.stage.addEventListener('pointermove', onMove);
      // 自動デモ: 円を描く
      ctx.forever(async () => {
        await ctx.tween({
          from: 0, to: 1, duration: 3, ease: 'InOutSine',
          onUpdate: (p) => {
            if (ctx.stage.matches(':hover')) return;
            const a = p * Math.PI * 2;
            const nx = Math.cos(a) * 0.4, ny = Math.sin(a) * 0.4;
            layers.forEach(l => {
              const d = parseFloat(l.dataset.depth);
              const bx = l === front ? -50 : 0, by = l === front ? -50 : 0;
              l.style.transform = `translate(calc(${bx}% + ${-nx * d * 400}px), calc(${by}% + ${-ny * d * 400}px))`;
            });
          },
        });
      });
    },
    code: {
      litmotion: `
using UnityEngine;

// 連続追従はUpdate+指数補間が基本。奥行き係数(depth)で移動量を変える
public class ParallaxLitMotion : MonoBehaviour
{
    [System.Serializable]
    public struct Layer { public RectTransform rect; public float depth; }

    [SerializeField] RectTransform viewport;
    [SerializeField] Layer[] layers;
    [SerializeField] float smooth = 8f;
    [SerializeField] float amount = 100f;

    Vector2[] basePos;

    void Awake()
    {
        basePos = new Vector2[layers.Length];
        for (int i = 0; i < layers.Length; i++) basePos[i] = layers[i].rect.anchoredPosition;
    }

    void Update()
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(viewport, Input.mousePosition, null, out Vector2 local);
        Vector2 n = new Vector2(local.x / viewport.rect.width, local.y / viewport.rect.height);
        for (int i = 0; i < layers.Length; i++)
        {
            Vector2 target = basePos[i] - n * layers[i].depth * amount;
            layers[i].rect.anchoredPosition = Vector2.Lerp(
                layers[i].rect.anchoredPosition, target, 1f - Mathf.Exp(-smooth * Time.deltaTime));
        }
    }
}`,
      dotween: `
using UnityEngine;

// パララックスは連続追従のためUpdate実装。DOTweenは離散トゥイーン向きなので不使用
public class ParallaxUpdate : MonoBehaviour
{
    [System.Serializable]
    public struct Layer { public RectTransform rect; public float depth; }

    [SerializeField] RectTransform viewport;
    [SerializeField] Layer[] layers;
    [SerializeField] float smooth = 8f;
    [SerializeField] float amount = 100f;

    Vector2[] basePos;

    void Awake()
    {
        basePos = new Vector2[layers.Length];
        for (int i = 0; i < layers.Length; i++) basePos[i] = layers[i].rect.anchoredPosition;
    }

    void Update()
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(viewport, Input.mousePosition, null, out Vector2 local);
        Vector2 n = new Vector2(local.x / viewport.rect.width, local.y / viewport.rect.height);
        for (int i = 0; i < layers.Length; i++)
        {
            Vector2 target = basePos[i] - n * layers[i].depth * amount;
            layers[i].rect.anchoredPosition = Vector2.Lerp(
                layers[i].rect.anchoredPosition, target, 1f - Mathf.Exp(-smooth * Time.deltaTime));
        }
    }
}`,
      coroutine: `
using UnityEngine;

public class ParallaxCoroutine : MonoBehaviour
{
    [System.Serializable]
    public struct Layer { public RectTransform rect; public float depth; }

    [SerializeField] RectTransform viewport;
    [SerializeField] Layer[] layers;
    [SerializeField] float smooth = 8f;
    [SerializeField] float amount = 100f;

    Vector2[] basePos;

    void Awake()
    {
        basePos = new Vector2[layers.Length];
        for (int i = 0; i < layers.Length; i++) basePos[i] = layers[i].rect.anchoredPosition;
    }

    void Update()
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(viewport, Input.mousePosition, null, out Vector2 local);
        Vector2 n = new Vector2(local.x / viewport.rect.width, local.y / viewport.rect.height);
        float k = 1f - Mathf.Exp(-smooth * Time.deltaTime);
        for (int i = 0; i < layers.Length; i++)
            layers[i].rect.anchoredPosition = Vector2.Lerp(
                layers[i].rect.anchoredPosition, basePos[i] - n * layers[i].depth * amount, k);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — PointerMoveEvent で各レイヤーを動かす (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class ParallaxUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string viewportName = "Viewport";
    [SerializeField] float amount = 40f;

    void OnEnable()
    {
        var viewport = document.rootVisualElement.Q<VisualElement>(viewportName);
        // class="layer" の要素に depth を data として持たせる想定
        List<VisualElement> layers = viewport.Query<VisualElement>(className: "layer").ToList();

        viewport.RegisterCallback<PointerMoveEvent>(evt =>
        {
            Vector2 size = viewport.layout.size;
            float nx = evt.localPosition.x / size.x - 0.5f;
            float ny = evt.localPosition.y / size.y - 0.5f;
            for (int i = 0; i < layers.Count; i++)
            {
                float depth = (i + 1) * 0.4f;   // 手前ほど大きく動かす
                layers[i].style.translate = new Translate(-nx * amount * depth, -ny * amount * depth, 0);
            }
        });
    }
}`,
    },
  });

  /* 3. スプラッシュ (entrance) */
  R({
    id: 'splash',
    title: 'スプラッシュ',
    titleEn: 'Splash Screen',
    category: 'entrance',
    tags: ['logo', 'intro', '起動', 'シーケンス'],
    description: 'ロゴがふわっと登場して少し留まり、ズームしながら消えてゲーム画面へ移る起動演出。登場→ホールド→退場の3段シーケンス。退場でわずかにズームすると「奥へ入っていく」感じが出る。',
    spec: {
      in: { scale: '0.8→1', alpha: '0→1', duration: 0.5, ease: 'OutBack' },
      hold: 1.0,
      out: { scale: '1→1.15', alpha: '1→0', duration: 0.4, ease: 'InCubic' },
    },
    preview(ctx, PV) {
      const logo = PV.el(null, {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '120px', height: '70px', background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '22px', letterSpacing: '0.1em',
        clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)',
      }, 'LOGO');
      ctx.stage.appendChild(logo);
      const s = { s: 0.8 };
      ctx.forever(async () => {
        s.s = 0.8; PV.applyT(logo, s); logo.style.opacity = 0;
        await ctx.wait(0.3);
        await ctx.tween({ from: 0.8, to: 1, duration: 0.5, ease: 'OutBack', onUpdate: (v, t) => { s.s = v; PV.applyT(logo, s); logo.style.opacity = Math.min(t * 2.5, 1); } });
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 1.15, duration: 0.4, ease: 'InCubic', onUpdate: (v, t) => { s.s = v; PV.applyT(logo, s); logo.style.opacity = 1 - t; } });
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using System;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SplashLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform logo;
    [SerializeField] float holdSeconds = 1f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play(null);

    /// <summary>onFinished: 退場完了(=ゲーム画面へ移る)コールバック</summary>
    public void Play(Action onFinished)
    {
        logo.localScale = Vector3.one * 0.8f;
        group.alpha = 0f;
        LSequence.Create()
            .Append(LMotion.Create(0.8f, 1f, 0.5f).WithEase(Ease.OutBack).Bind(s => logo.localScale = Vector3.one * s))
            .Join(LMotion.Create(0f, 1f, 0.4f).BindToAlpha(group))
            .AppendInterval(holdSeconds)
            .Append(LMotion.Create(1f, 1.15f, 0.4f).WithEase(Ease.InCubic).Bind(s => logo.localScale = Vector3.one * s))
            .Join(LMotion.Create(1f, 0f, 0.4f).BindToAlpha(group))
            .WithOnComplete(() => onFinished?.Invoke())
            .Run();
    }
}`,
      dotween: `
using System;
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SplashDOTween : MonoBehaviour
{
    [SerializeField] RectTransform logo;
    [SerializeField] float holdSeconds = 1f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play(null);

    public void Play(Action onFinished)
    {
        logo.localScale = Vector3.one * 0.8f;
        group.alpha = 0f;
        DOTween.Sequence()
            .Append(logo.DOScale(1f, 0.5f).SetEase(Ease.OutBack))
            .Join(group.DOFade(1f, 0.4f))
            .AppendInterval(holdSeconds)
            .Append(logo.DOScale(1.15f, 0.4f).SetEase(Ease.InCubic))
            .Join(group.DOFade(0f, 0.4f))
            .OnComplete(() => onFinished?.Invoke());
    }
}`,
      coroutine: `
using System;
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SplashCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform logo;
    [SerializeField] float holdSeconds = 1f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play(null);

    public void Play(Action onFinished)
    {
        StopAllCoroutines();
        StartCoroutine(Sequence(onFinished));
    }

    IEnumerator Sequence(Action onFinished)
    {
        yield return Phase(0.8f, 1f, 0f, 1f, 0.5f, true);
        yield return new WaitForSeconds(holdSeconds);
        yield return Phase(1f, 1.15f, 1f, 0f, 0.4f, false);
        onFinished?.Invoke();
    }

    IEnumerator Phase(float fromS, float toS, float fromA, float toA, float duration, bool back)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = back ? OutBack(p) : p * p * p;      // OutBack / InCubic
            logo.localScale = Vector3.one * Mathf.LerpUnclamped(fromS, toS, e);
            group.alpha = Mathf.Lerp(fromA, toA, p);
            yield return null;
        }
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Logo {
    scale: 0.8 0.8;
    opacity: 0;
    transition: scale 500ms ease-out-back, opacity 400ms ease-out;
}
#Logo.shown  { scale: 1 1; opacity: 1; }
#Logo.hiding { scale: 1.15 1.15; opacity: 0; transition: scale 400ms ease-in-cubic, opacity 400ms ease-in; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SplashUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Logo";
    [SerializeField] float holdMs = 1000f;

    void OnEnable()
    {
        var logo = document.rootVisualElement.Q<VisualElement>(elementName);
        logo.schedule.Execute(() => logo.AddToClassList("shown"));                 // 登場
        logo.schedule.Execute(() => logo.AddToClassList("hiding")).ExecuteLater((long)holdMs + 500);  // ホールド後に退場
    }
}`,
    },
  });

  /* 4. ページインジケータ (widget) */
  R({
    id: 'page-dots',
    title: 'ページインジケータ',
    titleEn: 'Page Indicator Dots',
    category: 'widget',
    tags: ['onboarding', 'dots', 'ページ', 'MD3'],
    description: 'オンボーディングやカルーセルの現在位置を示すドット。アクティブなドットが横長のカプセルに伸び、他は小さな点に戻る。位置と幅・色を同時にトゥイーンするのがポイント。',
    spec: {
      active: { width: '8→24 (カプセル化)', color: 'アクセント' },
      inactive: { width: 8, color: 'ディム' },
      duration: 0.3,
      ease: 'OutCubic',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', gap: '8px', alignItems: 'center' });
      ctx.stage.appendChild(wrap);
      const dots = [0, 1, 2, 3].map(() => {
        const d = PV.el(null, { width: '8px', height: '8px', background: 'var(--pv-line-strong)', borderRadius: '4px', transition: 'none' });
        wrap.appendChild(d);
        return d;
      });
      let cur = -1;
      const setActive = i => {
        dots.forEach((d, j) => {
          const active = j === i;
          const fromW = parseFloat(d.style.width);
          const toW = active ? 24 : 8;
          ctx.tween({ duration: 0.3, ease: 'OutCubic', onUpdate: v => d.style.width = lerp(fromW, toW, v) + 'px' });
          d.style.background = active ? 'var(--pv-accent)' : 'var(--pv-line-strong)';
        });
      };
      ctx.forever(async () => { cur = (cur + 1) % 4; setActive(cur); await ctx.wait(1.1); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

public class PageDotsLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] dots;
    [SerializeField] Image[] dotImages;
    [SerializeField] float dotSize = 8f;
    [SerializeField] float activeWidth = 24f;
    [SerializeField] Color activeColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] Color inactiveColor = new Color(0.27f, 0.27f, 0.29f);

    public void SetPage(int index)
    {
        for (int i = 0; i < dots.Length; i++)
        {
            bool active = i == index;
            LMotion.Create(dots[i].sizeDelta.x, active ? activeWidth : dotSize, 0.3f)
                .WithEase(Ease.OutCubic).BindToSizeDeltaX(dots[i]);
            LMotion.Create(dotImages[i].color, active ? activeColor : inactiveColor, 0.3f)
                .BindToColor(dotImages[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class PageDotsDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] dots;
    [SerializeField] Image[] dotImages;
    [SerializeField] float dotSize = 8f;
    [SerializeField] float activeWidth = 24f;
    [SerializeField] Color activeColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] Color inactiveColor = new Color(0.27f, 0.27f, 0.29f);

    public void SetPage(int index)
    {
        for (int i = 0; i < dots.Length; i++)
        {
            bool active = i == index;
            dots[i].DOSizeDelta(new Vector2(active ? activeWidth : dotSize, dots[i].sizeDelta.y), 0.3f)
                .SetEase(Ease.OutCubic);
            dotImages[i].DOColor(active ? activeColor : inactiveColor, 0.3f);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class PageDotsCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] dots;
    [SerializeField] Image[] dotImages;
    [SerializeField] float dotSize = 8f;
    [SerializeField] float activeWidth = 24f;
    [SerializeField] Color activeColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] Color inactiveColor = new Color(0.27f, 0.27f, 0.29f);

    public void SetPage(int index)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(index));
    }

    IEnumerator Animate(int index)
    {
        float[] fromW = new float[dots.Length];
        Color[] fromC = new Color[dots.Length];
        for (int i = 0; i < dots.Length; i++) { fromW[i] = dots[i].sizeDelta.x; fromC[i] = dotImages[i].color; }

        float t = 0f;
        while (t < 0.3f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.3f), 3f); // OutCubic
            for (int i = 0; i < dots.Length; i++)
            {
                bool active = i == index;
                float w = Mathf.Lerp(fromW[i], active ? activeWidth : dotSize, e);
                dots[i].sizeDelta = new Vector2(w, dots[i].sizeDelta.y);
                dotImages[i].color = Color.Lerp(fromC[i], active ? activeColor : inactiveColor, e);
            }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.page-dot {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background-color: rgb(69, 69, 74);
    transition: width 300ms ease-out-cubic, background-color 300ms ease-out;
}
.page-dot.active {
    width: 24px;
    background-color: rgb(245, 224, 3);
}

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class PageDotsUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Dots";
    List<VisualElement> dots;

    void OnEnable()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        dots = container.Query<VisualElement>(className: "page-dot").ToList();
    }

    public void SetPage(int index)
    {
        for (int i = 0; i < dots.Count; i++)
            dots[i].EnableInClassList("active", i == index);
    }
}`,
    },
  });

  /* 5. シェイプモーフローダー (loading) */
  R({
    id: 'shape-morph-loader',
    title: 'シェイプモーフローダー',
    titleEn: 'Shape Morph Loader',
    category: 'loading',
    tags: ['loading', 'morph', 'MD3', '有機的'],
    description: 'Material 3 Expressive 風の、回転しながら角丸が変化する有機的なローディング。四角⇔円を行き来しつつ回転・脈動する。uGUIは回転+スクワッシュで近似、UI ToolkitはborderRadiusを直接アニメできる。',
    spec: {
      rotate: '0→360 (連続)',
      corner_morph: '角丸 6%⇔50% (Yoyo)',
      scale_pulse: '0.85⇔1.0',
      duration: '回転1.4s / モーフ0.8s',
    },
    preview(ctx, PV) {
      const el = PV.el(null, { width: '52px', height: '52px', background: 'var(--pv-accent)', willChange: 'transform,border-radius' });
      ctx.stage.appendChild(el);
      ctx.tween({
        from: 0, to: 1, duration: 100000, ease: 'Linear',
        onUpdate: (v, t) => {
          const time = t * 100000 / 1000;
          const rot = (time * 200) % 360;
          const morph = (Math.sin(time * 2.2) + 1) / 2;
          const pulse = (Math.sin(time * 3.1) + 1) / 2;
          el.style.transform = `rotate(${rot}deg) scale(${lerp(0.85, 1, pulse)})`;
          el.style.borderRadius = lerp(8, 50, morph) + '%';
        },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// uGUIは角丸を持たないため「回転 + スクワッシュ」で有機的なモーフを近似する
public class ShapeMorphLoaderLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform shape;

    void OnEnable()
    {
        // 連続回転
        LMotion.Create(0f, -360f, 1.4f).WithEase(Ease.Linear).WithLoops(-1, LoopType.Restart)
            .Bind(z => shape.localEulerAngles = new Vector3(0f, 0f, z));
        // 角の代わりにX/Yスケールを逆位相で脈動させて“形が変わる”錯覚を作る
        LMotion.Create(0f, 1f, 0.8f).WithEase(Ease.InOutSine).WithLoops(-1, LoopType.Yoyo)
            .Bind(t => shape.localScale = new Vector3(Mathf.Lerp(1f, 0.7f, t), Mathf.Lerp(0.7f, 1f, t), 1f));
    }

    void OnDisable() { /* MotionHandleを保持して Cancel してもよい */ }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ShapeMorphLoaderDOTween : MonoBehaviour
{
    [SerializeField] RectTransform shape;

    void OnEnable()
    {
        shape.DOLocalRotate(new Vector3(0f, 0f, -360f), 1.4f, RotateMode.FastBeyond360)
            .SetEase(Ease.Linear).SetLoops(-1, LoopType.Restart);
        shape.DOScaleX(0.7f, 0.8f).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
        shape.DOScaleY(1.0f, 0.8f).From(0.7f).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
    }

    void OnDisable() => shape.DOKill();
}`,
      coroutine: `
using UnityEngine;

public class ShapeMorphLoaderCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform shape;

    void Update()
    {
        float z = -Time.time * 360f / 1.4f;
        shape.localEulerAngles = new Vector3(0f, 0f, z % 360f);
        float t = (Mathf.Sin(Time.time / 0.8f * Mathf.PI) + 1f) * 0.5f;
        shape.localScale = new Vector3(Mathf.Lerp(1f, 0.7f, t), Mathf.Lerp(0.7f, 1f, t), 1f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — borderRadius を直接アニメできるので“本物のモーフ”が可能 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ShapeMorphLoaderUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Loader";

    void OnEnable()
    {
        var shape = document.rootVisualElement.Q<VisualElement>(elementName);
        shape.schedule.Execute(() =>
        {
            float time = Time.time;
            float rot = (time * 200f) % 360f;
            float morph = (Mathf.Sin(time * 2.2f) + 1f) * 0.5f;   // 0..1
            float pulse = (Mathf.Sin(time * 3.1f) + 1f) * 0.5f;

            shape.style.rotate = new Rotate(new Angle(rot, AngleUnit.Degree));
            float s = Mathf.Lerp(0.85f, 1f, pulse);
            shape.style.scale = new Scale(new Vector3(s, s, 1f));

            // 四角⇔円を行き来 (%指定で角丸をモーフ)
            var r = Length.Percent(Mathf.Lerp(8f, 50f, morph));
            shape.style.borderTopLeftRadius = r;
            shape.style.borderTopRightRadius = r;
            shape.style.borderBottomLeftRadius = r;
            shape.style.borderBottomRightRadius = r;
        }).Every(16);
    }
}`,
    },
  });

  /* 6. スワイプで消去 (list / interactive) */
  R({
    id: 'swipe-dismiss',
    interactive: true,
    title: 'スワイプで消去',
    titleEn: 'Swipe to Dismiss',
    category: 'list',
    tags: ['swipe', 'drag', 'inventory', '削除'],
    description: 'カードを横にドラッグし、しきい値を超えたら画面外へ飛ばして削除、届かなければバネで戻る。インベントリの整理・通知の消去・不要アイテムの破棄に。ドラッグ量に応じて不透明度も下げる。プレビューは左右にドラッグして試せる。',
    spec: {
      follow: 'ドラッグ量ぶん anchoredPosition.x を追従、alphaも下げる',
      threshold: 90,
      dismiss: '画面外へ飛ばして高さを畳む (0.25s InCubic)',
      snap_back: 'しきい値未満は 0 へ (0.3s OutBack)',
    },
    preview(ctx, PV) {
      const makeCard = () => {
        const c = PV.el('mono', {
          position: 'absolute', left: '20px', right: '20px', top: '50%', marginTop: '-20px',
          height: '40px', display: 'flex', alignItems: 'center', padding: '0 14px',
          background: 'var(--pv-panel)', border: '1px solid var(--pv-line)', borderLeft: '2px solid var(--pv-accent)',
          fontSize: '10px', letterSpacing: '0.08em', color: 'var(--pv-text)', cursor: 'grab', touchAction: 'none',
        }, '◀ ドラッグで消去 ▶');
        ctx.stage.appendChild(c);
        return c;
      };
      let card = makeCard();
      let x = 0, dragging = false, startX = 0;
      const apply = () => { card.style.transform = `translateX(${x}px)`; card.style.opacity = 1 - Math.min(Math.abs(x) / 200, 0.75); };
      const respawn = () => { card.remove(); card = makeCard(); x = 0; bind(); };
      const release = () => {
        dragging = false; card.style.cursor = 'grab';
        if (Math.abs(x) > 90) {
          const dir = Math.sign(x) || 1;
          ctx.tween({ from: x, to: dir * 320, duration: 0.25, ease: 'InCubic', onUpdate: v => { x = v; apply(); }, onComplete: respawn });
        } else {
          ctx.tween({ from: x, to: 0, duration: 0.3, ease: 'OutBack', onUpdate: v => { x = v; apply(); } });
        }
      };
      function bind() {
        card.addEventListener('pointerdown', ev => { dragging = true; startX = ev.clientX - x; card.style.cursor = 'grabbing'; card.setPointerCapture(ev.pointerId); });
        card.addEventListener('pointermove', ev => { if (dragging) { x = ev.clientX - startX; apply(); } });
        card.addEventListener('pointerup', release);
      }
      bind();
      // 自動デモ
      ctx.forever(async () => {
        await ctx.wait(1.6);
        if (dragging) return;
        await ctx.tween({ from: 0, to: 110, duration: 0.5, ease: 'OutCubic', onUpdate: v => { x = v; apply(); } });
        const dir = 1;
        await ctx.tween({ from: 110, to: dir * 320, duration: 0.25, ease: 'InCubic', onUpdate: v => { x = v; apply(); } });
        respawn();
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

[RequireComponent(typeof(CanvasGroup))]
public class SwipeDismissLitMotion : MonoBehaviour, IDragHandler, IEndDragHandler
{
    [SerializeField] float threshold = 150f;
    [SerializeField] float offScreenX = 800f;

    RectTransform rect;
    CanvasGroup group;

    void Awake() { rect = (RectTransform)transform; group = GetComponent<CanvasGroup>(); }

    public void OnDrag(PointerEventData e)
    {
        rect.anchoredPosition += new Vector2(e.delta.x, 0f);
        group.alpha = 1f - Mathf.Min(Mathf.Abs(rect.anchoredPosition.x) / 400f, 0.75f);
    }

    public void OnEndDrag(PointerEventData e)
    {
        if (Mathf.Abs(rect.anchoredPosition.x) > threshold)
        {
            float dir = Mathf.Sign(rect.anchoredPosition.x);
            LMotion.Create(rect.anchoredPosition.x, offScreenX * dir, 0.25f)
                .WithEase(Ease.InCubic)
                .WithOnComplete(() => Destroy(gameObject))
                .BindToAnchoredPositionX(rect);
        }
        else
        {
            LMotion.Create(rect.anchoredPosition.x, 0f, 0.3f).WithEase(Ease.OutBack).BindToAnchoredPositionX(rect);
            LMotion.Create(group.alpha, 1f, 0.3f).BindToAlpha(group);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;

[RequireComponent(typeof(CanvasGroup))]
public class SwipeDismissDOTween : MonoBehaviour, IDragHandler, IEndDragHandler
{
    [SerializeField] float threshold = 150f;
    [SerializeField] float offScreenX = 800f;

    RectTransform rect;
    CanvasGroup group;

    void Awake() { rect = (RectTransform)transform; group = GetComponent<CanvasGroup>(); }

    public void OnDrag(PointerEventData e)
    {
        rect.anchoredPosition += new Vector2(e.delta.x, 0f);
        group.alpha = 1f - Mathf.Min(Mathf.Abs(rect.anchoredPosition.x) / 400f, 0.75f);
    }

    public void OnEndDrag(PointerEventData e)
    {
        if (Mathf.Abs(rect.anchoredPosition.x) > threshold)
        {
            float dir = Mathf.Sign(rect.anchoredPosition.x);
            rect.DOAnchorPosX(offScreenX * dir, 0.25f).SetEase(Ease.InCubic)
                .OnComplete(() => Destroy(gameObject));
        }
        else
        {
            rect.DOAnchorPosX(0f, 0.3f).SetEase(Ease.OutBack);
            group.DOFade(1f, 0.3f);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;

[RequireComponent(typeof(CanvasGroup))]
public class SwipeDismissCoroutine : MonoBehaviour, IDragHandler, IEndDragHandler
{
    [SerializeField] float threshold = 150f;
    [SerializeField] float offScreenX = 800f;

    RectTransform rect;
    CanvasGroup group;

    void Awake() { rect = (RectTransform)transform; group = GetComponent<CanvasGroup>(); }

    public void OnDrag(PointerEventData e)
    {
        rect.anchoredPosition += new Vector2(e.delta.x, 0f);
        group.alpha = 1f - Mathf.Min(Mathf.Abs(rect.anchoredPosition.x) / 400f, 0.75f);
    }

    public void OnEndDrag(PointerEventData e)
    {
        bool dismiss = Mathf.Abs(rect.anchoredPosition.x) > threshold;
        float target = dismiss ? offScreenX * Mathf.Sign(rect.anchoredPosition.x) : 0f;
        StartCoroutine(MoveTo(target, dismiss));
    }

    IEnumerator MoveTo(float target, bool dismiss)
    {
        float from = rect.anchoredPosition.x;
        float duration = dismiss ? 0.25f : 0.3f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = dismiss ? p * p * p : OutBack(p);
            rect.anchoredPosition = new Vector2(Mathf.LerpUnclamped(from, target, e), rect.anchoredPosition.y);
            if (!dismiss) group.alpha = Mathf.Lerp(group.alpha, 1f, p);
            yield return null;
        }
        if (dismiss) Destroy(gameObject);
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — PointerDown/Move/Up でドラッグを実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SwipeDismissUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string cardName = "Card";
    [SerializeField] float threshold = 150f;

    VisualElement card;
    bool dragging;
    float startX, x;

    void OnEnable()
    {
        card = document.rootVisualElement.Q<VisualElement>(cardName);
        card.RegisterCallback<PointerDownEvent>(e => { dragging = true; startX = e.position.x - x; card.CapturePointer(e.pointerId); });
        card.RegisterCallback<PointerMoveEvent>(e =>
        {
            if (!dragging) return;
            x = e.position.x - startX;
            card.style.translate = new Translate(x, 0, 0);
            card.style.opacity = 1f - Mathf.Min(Mathf.Abs(x) / 300f, 0.75f);
        });
        card.RegisterCallback<PointerUpEvent>(e =>
        {
            dragging = false;
            card.ReleasePointer(e.pointerId);
            if (Mathf.Abs(x) > threshold)
            {
                // しきい値超え → 画面外へ飛ばして消す (USS transitionを付けておくと滑らかに)
                card.style.transitionProperty = new System.Collections.Generic.List<StylePropertyName> { "translate", "opacity" };
                card.style.translate = new Translate(Mathf.Sign(x) * 800f, 0, 0);
                card.style.opacity = 0f;
                card.schedule.Execute(() => card.RemoveFromHierarchy()).ExecuteLater(250);
            }
            else
            {
                x = 0f;
                card.style.translate = new Translate(0, 0, 0);
                card.style.opacity = 1f;
            }
        });
    }
}`,
    },
  });

  /* 7. セグメント選択 (widget / interactive) */
  R({
    id: 'segmented-selector',
    interactive: true,
    title: 'セグメント選択',
    titleEn: 'Segmented Selector',
    category: 'widget',
    tags: ['segmented', 'selector', 'filter', 'MD3'],
    description: '連結したボタン群の背後で、選択中を示すハイライトが滑って移動する。難易度選択・フィルタ・表示切替などに。ハイライトの位置と幅を同時にトゥイーンすると、幅が違う項目にも綺麗に収まる。プレビューはクリックで選択。',
    spec: {
      highlight: { target: 'RectTransform.anchoredPosition.x + sizeDelta.x', duration: 0.28, ease: 'OutCubic' },
      label: '選択中の文字色を反転',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', display: 'flex', background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)', padding: '3px', gap: '0', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' });
      ctx.stage.appendChild(wrap);
      const highlight = PV.el(null, { position: 'absolute', top: '3px', bottom: '3px', left: '3px', width: '60px', background: 'var(--pv-accent)', clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)', transition: 'none' });
      wrap.appendChild(highlight);
      const labels = ['EASY', 'NORMAL', 'HARD'];
      const segs = labels.map(l => {
        const b = PV.el('mono', { position: 'relative', zIndex: '1', padding: '8px 14px', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--pv-dim)', cursor: 'pointer' }, l);
        wrap.appendChild(b);
        return b;
      });
      let cur = -1, hx = 3, hw = 60;
      const select = i => {
        if (i === cur) return;
        cur = i;
        const seg = segs[i];
        const tx = seg.offsetLeft, tw = seg.offsetWidth;
        const fx = hx, fw = hw;
        ctx.tween({ duration: 0.28, ease: 'OutCubic', onUpdate: v => { hx = lerp(fx, tx, v); hw = lerp(fw, tw, v); highlight.style.left = hx + 'px'; highlight.style.width = hw + 'px'; } });
        segs.forEach((s, j) => s.style.color = j === i ? 'var(--pv-on-accent)' : 'var(--pv-dim)');
      };
      segs.forEach((s, i) => s.addEventListener('click', () => select(i)));
      requestAnimationFrame(() => select(0));
      let auto = 0;
      ctx.forever(async () => { await ctx.wait(1.5); auto = (auto + 1) % 3; select(auto); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class SegmentedSelectorLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform highlight;
    [SerializeField] RectTransform[] segments;   // 各セグメント(位置・幅参照)
    [SerializeField] float duration = 0.28f;

    public void Select(int index)
    {
        var seg = segments[index];
        LMotion.Create(highlight.anchoredPosition.x, seg.anchoredPosition.x, duration)
            .WithEase(Ease.OutCubic).BindToAnchoredPositionX(highlight);
        LMotion.Create(highlight.sizeDelta.x, seg.rect.width, duration)
            .WithEase(Ease.OutCubic).BindToSizeDeltaX(highlight);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SegmentedSelectorDOTween : MonoBehaviour
{
    [SerializeField] RectTransform highlight;
    [SerializeField] RectTransform[] segments;
    [SerializeField] float duration = 0.28f;

    public void Select(int index)
    {
        var seg = segments[index];
        highlight.DOAnchorPosX(seg.anchoredPosition.x, duration).SetEase(Ease.OutCubic);
        highlight.DOSizeDelta(new Vector2(seg.rect.width, highlight.sizeDelta.y), duration).SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SegmentedSelectorCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform highlight;
    [SerializeField] RectTransform[] segments;
    [SerializeField] float duration = 0.28f;

    public void Select(int index)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(segments[index]));
    }

    IEnumerator Animate(RectTransform seg)
    {
        float fromX = highlight.anchoredPosition.x, toX = seg.anchoredPosition.x;
        float fromW = highlight.sizeDelta.x, toW = seg.rect.width;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / duration), 3f); // OutCubic
            highlight.anchoredPosition = new Vector2(Mathf.Lerp(fromX, toX, e), highlight.anchoredPosition.y);
            highlight.sizeDelta = new Vector2(Mathf.Lerp(fromW, toW, e), highlight.sizeDelta.y);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Highlight {
    position: absolute;
    transition: translate 280ms ease-out-cubic, width 280ms ease-out-cubic;
}
.segment { color: rgb(154, 154, 150); transition: color 200ms ease-out; }
.segment.selected { color: rgb(17, 17, 17); }

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class SegmentedSelectorUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement highlight;
    List<VisualElement> segments;
    int current = -1;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        highlight = root.Q<VisualElement>("Highlight");
        segments = root.Query<VisualElement>(className: "segment").ToList();
        for (int i = 0; i < segments.Count; i++)
        {
            int idx = i;
            segments[i].RegisterCallback<ClickEvent>(_ => Select(idx));
        }
        Select(0);
    }

    public void Select(int index)
    {
        if (index == current) return;
        var seg = segments[index];
        // レイアウト確定後に位置・幅を反映
        seg.schedule.Execute(() =>
        {
            highlight.style.translate = new Translate(seg.layout.x, 0, 0);
            highlight.style.width = seg.layout.width;
        });
        if (current >= 0) segments[current].RemoveFromClassList("selected");
        seg.AddToClassList("selected");
        current = index;
    }
}`,
    },
  });

  /* 8. デジットロール (text) */
  R({
    id: 'digit-roll',
    title: 'デジットロール',
    titleEn: 'Digit Roll',
    category: 'text',
    tags: ['number', 'odometer', 'スロット', 'スコア'],
    description: '各桁が縦に回転して目標の数字に着地する、スロットマシン/オドメーター風のカウンター。桁ごとにわずかに遅延させると「カラカラ」と揃う気持ちよさが出る。所持金・スコア・ハイスコア更新に。',
    spec: {
      target: '各桁ストリップ(0-9縦積み)の anchoredPosition.y',
      per_digit: 'y = 数字 * セル高さ',
      duration: 0.6,
      ease: 'OutCubic',
      stagger: 0.05,
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', gap: '4px' });
      ctx.stage.appendChild(wrap);
      const CELL = 34, NCOL = 4;
      const cols = [];
      for (let c = 0; c < NCOL; c++) {
        const win = PV.el(null, { width: '26px', height: CELL + 'px', overflow: 'hidden', background: 'var(--pv-panel)', border: '1px solid var(--pv-line)' });
        const strip = PV.el(null, { display: 'flex', flexDirection: 'column', willChange: 'transform' });
        for (let d = 0; d < 10; d++) {
          strip.appendChild(PV.el('mono', { height: CELL + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'var(--pv-accent)' }, String(d)));
        }
        win.appendChild(strip);
        wrap.appendChild(win);
        cols.push({ strip, y: 0 });
      }
      const setValue = n => {
        const s = String(n).padStart(NCOL, '0');
        cols.forEach((col, i) => {
          const d = +s[i];
          const from = col.y, to = -d * CELL;
          ctx.tween({ duration: 0.6, ease: 'OutCubic', delay: i * 0.05, onUpdate: v => { col.y = lerp(from, to, v); col.strip.style.transform = `translateY(${col.y}px)`; } });
        });
      };
      ctx.forever(async () => { setValue(Math.floor(Math.random() * 9000) + 1000); await ctx.wait(1.8); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 各桁 = 0〜9を縦に並べたストリップ。yを動かして目標の数字を窓に合わせる
public class DigitRollLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;  // 桁ぶんのストリップ (上位桁から)
    [SerializeField] float cellHeight = 100f;
    [SerializeField] float duration = 0.6f;
    [SerializeField] float stagger = 0.05f;

    public void SetValue(int value)
    {
        string s = value.ToString().PadLeft(columns.Length, '0');
        for (int i = 0; i < columns.Length; i++)
        {
            int digit = s[i] - '0';
            LMotion.Create(columns[i].anchoredPosition.y, digit * cellHeight, duration)
                .WithEase(Ease.OutCubic)
                .WithDelay(i * stagger)
                .BindToAnchoredPositionY(columns[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DigitRollDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;
    [SerializeField] float cellHeight = 100f;
    [SerializeField] float duration = 0.6f;
    [SerializeField] float stagger = 0.05f;

    public void SetValue(int value)
    {
        string s = value.ToString().PadLeft(columns.Length, '0');
        for (int i = 0; i < columns.Length; i++)
        {
            int digit = s[i] - '0';
            columns[i].DOAnchorPosY(digit * cellHeight, duration)
                .SetEase(Ease.OutCubic)
                .SetDelay(i * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DigitRollCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] columns;
    [SerializeField] float cellHeight = 100f;
    [SerializeField] float duration = 0.6f;
    [SerializeField] float stagger = 0.05f;

    public void SetValue(int value)
    {
        StopAllCoroutines();
        string s = value.ToString().PadLeft(columns.Length, '0');
        for (int i = 0; i < columns.Length; i++)
            StartCoroutine(Roll(columns[i], (s[i] - '0') * cellHeight, i * stagger));
    }

    IEnumerator Roll(RectTransform col, float targetY, float delay)
    {
        yield return new WaitForSeconds(delay);
        float fromY = col.anchoredPosition.y;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / duration), 3f); // OutCubic
            col.anchoredPosition = new Vector2(col.anchoredPosition.x, Mathf.Lerp(fromY, targetY, e));
            yield return null;
        }
        col.anchoredPosition = new Vector2(col.anchoredPosition.x, targetY);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 各桁の窓は overflow:hidden、中の strip を translate で動かす */
.digit-strip {
    transition: translate 600ms ease-out-cubic;
}

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class DigitRollUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Odometer";
    [SerializeField] float cellHeight = 100f;
    [SerializeField] float stagger = 0.05f;
    List<VisualElement> strips;

    void OnEnable()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        strips = container.Query<VisualElement>(className: "digit-strip").ToList();
    }

    public void SetValue(int value)
    {
        string s = value.ToString().PadLeft(strips.Count, '0');
        for (int i = 0; i < strips.Count; i++)
        {
            int digit = s[i] - '0';
            int idx = i;
            // 桁ごとに遅延(stagger)を付けて順に揃える
            strips[idx].style.transitionDelay = new List<TimeValue> { new TimeValue(idx * stagger, TimeUnit.Second) };
            strips[idx].style.translate = new Translate(0, -digit * cellHeight, 0);
        }
    }
}`,
    },
  });

  /* 9. ワードリビール (text) */
  R({
    id: 'word-reveal',
    title: 'ワードリビール',
    titleEn: 'Word Reveal',
    category: 'text',
    tags: ['text', 'mask', 'kinetic', '見出し'],
    description: '単語ごとにマスクの下からせり上がって現れるキネティックタイポグラフィ。見出し・章タイトル・決めゼリフの登場に。行をマスク(overflow hidden)にし、各単語を時間差で上げるのがコツ。',
    spec: {
      target: '各単語(マスク内)の translateY + alpha',
      per_word: { y: '100%→0', alpha: '0→1', duration: 0.5, ease: 'OutCubic' },
      stagger: 0.08,
    },
    preview(ctx, PV) {
      const words = ['LEVEL', 'UP', 'COMPLETE'];
      const line = PV.el(null, { display: 'flex', gap: '8px' });
      ctx.stage.appendChild(line);
      const inners = words.map(w => {
        const mask = PV.el(null, { overflow: 'hidden', padding: '2px 0' });
        const inner = PV.el(null, { fontFamily: "'Oswald',sans-serif", fontSize: '26px', fontWeight: '700', letterSpacing: '0.04em', color: 'var(--pv-accent)', willChange: 'transform' }, w);
        mask.appendChild(inner);
        line.appendChild(mask);
        return inner;
      });
      const stagger = 0.08, per = 0.5;
      const total = stagger * (words.length - 1) + per;
      ctx.forever(async () => {
        inners.forEach(el => { el.style.transform = 'translateY(110%)'; el.style.opacity = 0; });
        await ctx.wait(0.4);
        await ctx.tween({
          duration: total, ease: 'Linear',
          onUpdate: (v, t) => {
            const now = t * total;
            inners.forEach((el, i) => {
              const p = Math.min(Math.max((now - i * stagger) / per, 0), 1);
              const e = EASE.OutCubic(p);
              el.style.transform = `translateY(${110 - 110 * e}%)`;
              el.style.opacity = e;
            });
          },
        });
        await ctx.wait(1.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 各単語を「マスク(overflow)子オブジェクト」にして、下からせり上げる
public class WordRevealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] words;    // 各単語 (マスク内に配置)
    [SerializeField] CanvasGroup[] wordGroups;
    [SerializeField] float rise = 40f;
    [SerializeField] float stagger = 0.08f;

    void OnEnable() => Play();

    public void Play()
    {
        for (int i = 0; i < words.Length; i++)
        {
            words[i].anchoredPosition = new Vector2(words[i].anchoredPosition.x, -rise);
            wordGroups[i].alpha = 0f;
            LMotion.Create(-rise, 0f, 0.5f)
                .WithEase(Ease.OutCubic).WithDelay(i * stagger)
                .BindToAnchoredPositionY(words[i]);
            LMotion.Create(0f, 1f, 0.5f).WithDelay(i * stagger).BindToAlpha(wordGroups[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class WordRevealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] words;
    [SerializeField] CanvasGroup[] wordGroups;
    [SerializeField] float rise = 40f;
    [SerializeField] float stagger = 0.08f;

    void OnEnable() => Play();

    public void Play()
    {
        for (int i = 0; i < words.Length; i++)
        {
            words[i].anchoredPosition = new Vector2(words[i].anchoredPosition.x, -rise);
            wordGroups[i].alpha = 0f;
            words[i].DOAnchorPosY(0f, 0.5f).SetEase(Ease.OutCubic).SetDelay(i * stagger);
            wordGroups[i].DOFade(1f, 0.5f).SetDelay(i * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class WordRevealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] words;
    [SerializeField] CanvasGroup[] wordGroups;
    [SerializeField] float rise = 40f;
    [SerializeField] float stagger = 0.08f;

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        for (int i = 0; i < words.Length; i++)
            StartCoroutine(Reveal(words[i], wordGroups[i], i * stagger));
    }

    IEnumerator Reveal(RectTransform word, CanvasGroup cg, float delay)
    {
        word.anchoredPosition = new Vector2(word.anchoredPosition.x, -rise);
        cg.alpha = 0f;
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.5f), 3f); // OutCubic
            word.anchoredPosition = new Vector2(word.anchoredPosition.x, Mathf.Lerp(-rise, 0f, e));
            cg.alpha = e;
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 各単語を .word-mask (overflow:hidden) で包み、中の .word を translate */
.word-mask { overflow: hidden; }
.word {
    translate: 0 110%;
    opacity: 0;
    transition: translate 500ms ease-out-cubic, opacity 500ms ease-out;
}
.word.play { translate: 0 0; opacity: 1; }

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class WordRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Headline";
    [SerializeField] float stagger = 0.08f;

    void OnEnable() => Play();

    public void Play()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var words = container.Query<VisualElement>(className: "word").ToList();
        for (int i = 0; i < words.Count; i++)
        {
            words[i].RemoveFromClassList("play");
            words[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
        }
        container.schedule.Execute(() => { foreach (var w in words) w.AddToClassList("play"); });
    }
}`,
    },
  });
})();
