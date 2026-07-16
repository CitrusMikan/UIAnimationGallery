/* 18-modern.js — モダン/上質系の汎用UIモーション (6種)
 *   glass-panel / orbit-ring / liquid-gauge / crit-pop / holo-shine / banner-dots
 * 配属: widget / widget / loading / text / web / web。各種にUI Toolkit実装を同梱。
 * すべて一般的なモーション技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. グラスパネル (widget) */
  R({
    id: 'glass-panel',
    title: 'グラスパネル',
    titleEn: 'Glass Panel',
    category: 'widget',
    tags: ['glass', 'blur', 'panel', 'modal'],
    description: 'すりガラス(背景ぼかし)のパネルが、ぼかしと不透明度を解きながらスライド/スケールインする柔らかな登場。モーダルや情報パネルの上質な表示に。backdrop-filter の blur を大→小、opacity と translateY を OutCubic で同時に動かすと質感が出る。実機は uGUI ならブラー用 RenderTexture/専用シェーダ、UI Toolkit は backdrop blur 非対応のため半透明パネルで近似する。',
    spec: {
      target: 'すりガラス(背景ぼかし)のパネル',
      blur: { value: '12px→2px', duration: 0.5, ease: 'OutCubic' },
      panel: { opacity: '0→1', y: '18→0px', scale: '0.94→1', duration: 0.5, ease: 'OutCubic' },
      note: 'blur は uGUI=RenderTexture/シェーダ、UI Toolkit=非対応で半透明近似。透過の上に載せると効果が映える',
    },
    preview(ctx, PV) {
      // 背景に模様を敷き、その上でぼかしパネルを登場させる
      const bg = PV.el(null, {
        position: 'absolute', inset: '0',
        background: 'repeating-linear-gradient(45deg, var(--pv-panel2) 0 14px, var(--pv-panel) 14px 28px)',
        opacity: '0.7',
      });
      ctx.stage.appendChild(bg);
      const dot = PV.el(null, {
        position: 'absolute', left: '38px', top: '24px', width: '54px', height: '54px', borderRadius: '50%',
        background: 'var(--pv-accent-dim)', opacity: '0.9',
      });
      ctx.stage.appendChild(dot);

      const panel = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '150px', height: '80px', marginLeft: '-75px', marginTop: '-40px',
        boxSizing: 'border-box', padding: '12px 14px',
        background: 'color-mix(in srgb, var(--pv-panel) 55%, transparent)',
        border: '1px solid var(--pv-line-strong)',
        display: 'flex', flexDirection: 'column', gap: '7px', justifyContent: 'center',
        willChange: 'transform,opacity,backdrop-filter',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      });
      const bar = PV.el(null, { width: '64%', height: '9px', background: 'var(--pv-accent)' });
      const line1 = PV.el(null, { width: '100%', height: '6px', background: 'var(--pv-line-strong)' });
      const line2 = PV.el(null, { width: '72%', height: '6px', background: 'var(--pv-line)' });
      panel.appendChild(bar); panel.appendChild(line1); panel.appendChild(line2);
      ctx.stage.appendChild(panel);

      const setP = (v) => {
        const blur = lerp(12, 2, v);
        panel.style.backdropFilter = `blur(${blur}px)`;
        panel.style.webkitBackdropFilter = `blur(${blur}px)`;
        panel.style.opacity = v;
        PV.applyT(panel, { y: lerp(18, 0, v), s: lerp(0.94, 1, v) });
      };
      ctx.forever(async () => {
        setP(0);
        await ctx.wait(0.5);
        await ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutCubic', onUpdate: setP });
        await ctx.wait(1.4);
        await ctx.tween({ from: 1, to: 0, duration: 0.32, ease: 'InCubic', onUpdate: setP });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// すりガラスパネルの登場。blur量は専用マテリアルの _Blur などへ流す想定
[RequireComponent(typeof(CanvasGroup))]
public class GlassPanelLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] Material blurMaterial;   // uGUI用ブラー(RenderTexture/シェーダ)
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        panel.localScale = Vector3.one * 0.94f;
        // ぼかしを強→弱に解く
        if (blurMaterial != null)
            LMotion.Create(12f, 2f, 0.5f).WithEase(Ease.OutCubic)
                .Bind(v => blurMaterial.SetFloat("_Blur", v));
        LMotion.Create(0f, 1f, 0.5f).WithEase(Ease.OutCubic).BindToAlpha(group);
        LMotion.Create(18f, 0f, 0.5f).WithEase(Ease.OutCubic).BindToAnchoredPositionY(panel);
        LMotion.Create(0.94f, 1f, 0.5f).WithEase(Ease.OutCubic)
            .Bind(s => panel.localScale = Vector3.one * s);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class GlassPanelDOTween : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] Material blurMaterial;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        panel.localScale = Vector3.one * 0.94f;
        if (blurMaterial != null)
            blurMaterial.DOFloat(2f, "_Blur", 0.5f).SetEase(Ease.OutCubic).From(12f);
        DOTween.Sequence()
            .Join(group.DOFade(1f, 0.5f).SetEase(Ease.OutCubic))
            .Join(panel.DOAnchorPosY(0f, 0.5f).SetEase(Ease.OutCubic).From(new Vector2(panel.anchoredPosition.x, 18f)))
            .Join(panel.DOScale(1f, 0.5f).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class GlassPanelCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] Material blurMaterial;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        group.alpha = 0f;
        float baseY = panel.anchoredPosition.y, t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.5f), 3f); // OutCubic
            group.alpha = e;
            panel.anchoredPosition = new Vector2(panel.anchoredPosition.x, Mathf.Lerp(baseY + 18f, baseY, e));
            panel.localScale = Vector3.one * Mathf.Lerp(0.94f, 1f, e);
            if (blurMaterial != null) blurMaterial.SetFloat("_Blur", Mathf.Lerp(12f, 2f, e));
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 注意: UI Toolkit は backdrop blur 非対応のため、
 * 半透明の背景色 + 薄いボーダーで「すりガラス」を近似する。
 * 実機で本物のぼかしが要る場合は uGUI + RenderTexture/シェーダを使う。 */
#GlassPanel {
    background-color: rgba(30, 30, 40, 0.55);   /* すりガラス近似(半透明) */
    border-width: 1px;
    border-color: rgba(255, 255, 255, 0.25);
    opacity: 0;
    scale: 0.94 0.94;
    translate: 0 18px;
    transition: opacity 500ms ease-out, scale 500ms ease-out, translate 500ms ease-out;
}
#GlassPanel.shown { opacity: 1; scale: 1 1; translate: 0 0; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class GlassPanelUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var panel = document.rootVisualElement.Q<VisualElement>("GlassPanel");
        // 1フレーム後にクラス付与して transition を発火
        panel.schedule.Execute(() => panel.AddToClassList("shown")).ExecuteLater(16);
    }
}`,
    },
  });

  /* 2. オービットリング (widget) */
  R({
    id: 'orbit-ring',
    title: 'オービットリング',
    titleEn: 'Orbit Ring',
    category: 'widget',
    tags: ['orbit', 'ring', 'loop', 'radial'],
    description: '複数のアイコンが中心の周りのリング上を等速で周回し続ける円環メニュー/インジケータ。周回選択・状態表示・装飾に。親コンテナを Linear の無限回転で回し、各アイコンは逆回転で正立を保つと読みやすい。開閉するラジアルメニューと違い「常時周回」が要点。',
    spec: {
      target: 'リング上に等間隔配置した N 個のアイコン',
      spin: { rot: '0→360', duration: 6, ease: 'Linear', loop: '無限(Restart)' },
      counter_rotate: '各アイコンは -回転 で正立を保つ',
      note: 'radial-menu(開閉)とは別で、常時周回するインジケータ/装飾。半径と個数で密度を調整',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const ring = PV.el(null, {
        position: 'absolute', left: '0', top: '0', width: '112px', height: '112px', marginLeft: '-56px', marginTop: '-56px',
        borderRadius: '50%', border: '1px dashed var(--pv-line-strong)', willChange: 'transform',
      });
      center.appendChild(ring);
      const N = 6, radius = 56;
      const icons = [];
      for (let i = 0; i < N; i++) {
        const ang = (i / N) * Math.PI * 2;
        const x = Math.cos(ang) * radius, y = Math.sin(ang) * radius;
        const it = PV.el('mono', {
          position: 'absolute', left: '50%', top: '50%', width: '20px', height: '20px', marginLeft: '-10px', marginTop: '-10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px',
          background: i === 0 ? 'var(--pv-accent)' : 'var(--pv-panel2)',
          color: i === 0 ? 'var(--pv-on-accent)' : 'var(--pv-dim)',
          border: '1px solid var(--pv-line-strong)', willChange: 'transform',
          transform: `translate(${x}px, ${y}px) rotate(0deg)`,
        }, String(i + 1));
        ring.appendChild(it);
        icons.push({ el: it, x, y });
      }
      // 中心の目印
      const hub = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '14px', height: '14px', marginLeft: '-7px', marginTop: '-7px',
        borderRadius: '50%', background: 'var(--pv-accent-dim)',
      });
      center.appendChild(hub);

      ctx.tween({
        from: 0, to: 1, duration: 6, ease: 'Linear', loops: -1, loopType: 'Restart',
        onUpdate: (v) => {
          const deg = v * 360;
          ring.style.transform = `rotate(${deg}deg)`;
          // アイコンは逆回転で正立を保つ
          icons.forEach(o => { o.el.style.transform = `translate(${o.x}px, ${o.y}px) rotate(${-deg}deg)`; });
        },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 親リングを等速回転。各アイコンは逆回転で正立を保つ
public class OrbitRingLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] icons;   // リング上に等間隔配置済み
    [SerializeField] float period = 6f;

    void OnEnable()
    {
        LMotion.Create(0f, 360f, period).WithEase(Ease.Linear).WithLoops(-1)
            .Bind(z =>
            {
                ring.localEulerAngles = new Vector3(0, 0, z);
                foreach (var ic in icons)
                    ic.localEulerAngles = new Vector3(0, 0, -z);
            });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class OrbitRingDOTween : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] icons;
    [SerializeField] float period = 6f;

    void OnEnable()
    {
        ring.DOLocalRotate(new Vector3(0, 0, 360f), period, RotateMode.FastBeyond360)
            .SetEase(Ease.Linear).SetLoops(-1, LoopType.Restart)
            .OnUpdate(() =>
            {
                float z = ring.localEulerAngles.z;
                foreach (var ic in icons)
                    ic.localEulerAngles = new Vector3(0, 0, -z);
            });
    }
}`,
      coroutine: `
using UnityEngine;

public class OrbitRingCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] icons;
    [SerializeField] float period = 6f;
    float angle;

    void Update()
    {
        angle = (angle + 360f / period * Time.deltaTime) % 360f;
        ring.localEulerAngles = new Vector3(0, 0, angle);
        foreach (var ic in icons)
            ic.localEulerAngles = new Vector3(0, 0, -angle);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 連続回転は transition では作れないので schedule で駆動する。
 * アイコンは C# 側で逆回転を与え正立を保つ。 */
#OrbitRing { position: absolute; }

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class OrbitRingUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float period = 6f;
    VisualElement ring;
    List<VisualElement> icons;
    float angle;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        ring = root.Q<VisualElement>("OrbitRing");
        icons = ring.Query<VisualElement>(className: "orbit-icon").ToList();
        ring.schedule.Execute(() =>
        {
            angle = (angle + 360f / period * 0.016f) % 360f;
            ring.style.rotate = new Rotate(new Angle(angle, AngleUnit.Degree));
            foreach (var ic in icons)
                ic.style.rotate = new Rotate(new Angle(-angle, AngleUnit.Degree));
        }).Every(16);
    }
}`,
    },
  });

  /* 3. リキッドゲージ (loading) */
  R({
    id: 'liquid-gauge',
    title: 'リキッドゲージ',
    titleEn: 'Liquid Gauge',
    category: 'loading',
    tags: ['liquid', 'wave', 'gauge', 'fill'],
    description: '波打つ液面が上下しながら満ちていく、液体表現のスタミナ/エナジー系ゲージ。回復・チャージ・満量表現に。液面の高さ=値とし、上端に位相の違う2本のサイン波を重ねて表面を揺らす。満ちたら少し待って減らすのを繰り返す。単なる進捗バーと違い「液体の波」が要点。実機は波シェーダやスクロール sprite が定番で、ここでは fillAmount と波の近似で表現する。',
    spec: {
      target: '円/縦バー内の液面(高さ=値 0..1)',
      fill: { level: '0→1→少し減', ease: 'InOutSine', note: '満ちたら hold して減らす' },
      surface: '位相の違う2本のサイン波を重ねて表面を揺らす',
      note: 'progress-bar/circular-progress とは別。実機は波シェーダ/スクロールsprite定番 + fillAmount 近似',
    },
    preview(ctx, PV) {
      const size = 96;
      const wrap = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: size + 'px', height: size + 'px',
        marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px',
        borderRadius: '50%', overflow: 'hidden',
        background: 'var(--pv-panel)', border: '2px solid var(--pv-line-strong)',
      });
      ctx.stage.appendChild(wrap);
      // 液面 (SVG の波パスを高さで動かす)
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
      svg.setAttribute('width', size); svg.setAttribute('height', size);
      svg.style.position = 'absolute'; svg.style.inset = '0';
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('fill', 'var(--pv-accent)');
      path.setAttribute('opacity', '0.9');
      svg.appendChild(path);
      wrap.appendChild(svg);
      // 値ラベル
      const label = PV.el('mono', {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', fontWeight: '700', color: 'var(--pv-text)', textShadow: '0 1px 2px rgba(0,0,0,0.35)',
      }, '0%');
      wrap.appendChild(label);

      let level = 0, phase = 0;
      const buildPath = () => {
        const base = size * (1 - level);      // 液面のY(上ほど小)
        const amp = 5, k = (Math.PI * 2) / size;
        let d = `M0 ${size} L0 ${base.toFixed(1)}`;
        for (let x = 0; x <= size; x += 4) {
          // 位相違いの2波を重ねる
          const y = base + Math.sin(x * k * 1.2 + phase) * amp + Math.sin(x * k * 2.1 + phase * 1.6) * amp * 0.4;
          d += ` L${x} ${y.toFixed(1)}`;
        }
        d += ` L${size} ${size} Z`;
        path.setAttribute('d', d);
        label.textContent = Math.round(level * 100) + '%';
      };
      // 波の常時スクロール
      ctx.tween({ from: 0, to: 1, duration: 1.6, ease: 'Linear', loops: -1, loopType: 'Restart', onUpdate: (v) => { phase = v * Math.PI * 2; buildPath(); } });
      // 満ちる→hold→減る
      ctx.forever(async () => {
        await ctx.tween({ from: level, to: 1, duration: 2.0, ease: 'InOutSine', onUpdate: (v) => { level = v; } });
        await ctx.wait(0.9);
        await ctx.tween({ from: level, to: 0.15, duration: 1.1, ease: 'InOutSine', onUpdate: (v) => { level = v; } });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// 液面の高さ = 値。表面の波は波マテリアルのパラメータ or スクロールUVで作る想定
public class LiquidGaugeLitMotion : MonoBehaviour
{
    [SerializeField] Image liquid;         // fillAmount = 液面の高さ(0..1), FillMethod=Vertical
    [SerializeField] Material waveMaterial; // _WaveSpeed / _Phase を持つ波シェーダ(任意)

    void OnEnable()
    {
        // 波の位相を常時スクロール
        if (waveMaterial != null)
            LMotion.Create(0f, Mathf.PI * 2f, 1.6f).WithEase(Ease.Linear).WithLoops(-1)
                .Bind(p => waveMaterial.SetFloat("_Phase", p));
    }

    public void SetLevel(float target)  // 0..1
    {
        LMotion.Create(liquid.fillAmount, target, 1.2f).WithEase(Ease.InOutSine)
            .Bind(v => liquid.fillAmount = v);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class LiquidGaugeDOTween : MonoBehaviour
{
    [SerializeField] Image liquid;         // FillMethod = Vertical
    [SerializeField] Material waveMaterial;

    void OnEnable()
    {
        if (waveMaterial != null)
            waveMaterial.DOFloat(Mathf.PI * 2f, "_Phase", 1.6f)
                .SetEase(Ease.Linear).SetLoops(-1, LoopType.Restart);
    }

    public void SetLevel(float target)
    {
        liquid.DOFillAmount(target, 1.2f).SetEase(Ease.InOutSine);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class LiquidGaugeCoroutine : MonoBehaviour
{
    [SerializeField] Image liquid;         // FillMethod = Vertical
    [SerializeField] Material waveMaterial;
    float phase;

    void Update()
    {
        // 波の位相をスクロール(近似)
        if (waveMaterial != null)
        {
            phase = (phase + Time.deltaTime * Mathf.PI * 2f / 1.6f) % (Mathf.PI * 2f);
            waveMaterial.SetFloat("_Phase", phase);
        }
    }

    public void SetLevel(float target) => StartCoroutine(Fill(target));

    IEnumerator Fill(float target)
    {
        float from = liquid.fillAmount, t = 0f, dur = 1.2f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / dur);
            float e = -(Mathf.Cos(Mathf.PI * p) - 1f) * 0.5f; // InOutSine
            liquid.fillAmount = Mathf.Lerp(from, target, e);
            yield return null;
        }
        liquid.fillAmount = target;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 注意: 液面の波は本来シェーダ/スクロールspriteが定番。
 * UI Toolkit だけで波を描くのは難しいため、
 * ここでは液面の「高さ」を height の transition で近似し、
 * 波の揺れは schedule で上端要素を微小に上下させて表現する。 */
#Liquid {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 0;
    background-color: rgb(120, 170, 240);
    transition: height 1200ms ease-in-out;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class LiquidGaugeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement liquid;
    float time;

    void OnEnable()
    {
        liquid = document.rootVisualElement.Q<VisualElement>("Liquid");
        // 液面の上端をわずかに上下させて波の揺れを近似
        liquid.schedule.Execute(() =>
        {
            time += 0.016f;
            float wobble = Mathf.Sin(time * Mathf.PI * 2f / 1.6f) * 2f; // px
            liquid.style.marginTop = wobble;
        }).Every(16);
    }

    public void SetLevel(float ratio)   // 0..1
    {
        liquid.style.height = Length.Percent(ratio * 100f);
    }
}`,
    },
  });

  /* 4. クリティカルポップ (text) */
  R({
    id: 'crit-pop',
    title: 'クリティカルポップ',
    titleEn: 'Crit Pop',
    category: 'text',
    tags: ['crit', 'flare', 'ring', 'emphasis'],
    description: '数値が二段階で弾け(大きく出て一度縮み、再度弾ける)、閃光リングと色フレアを伴う会心強調。重要な数値・特大加算・強調ヒットに。1段目 OutBack で大きく出し、少し縮めてから 2段目のパンチで弾く。背後に発光リングを拡大フェードさせ、瞬間的な色フラッシュを重ねると迫力が出る。通常のダメージ表示と違い「二段+フレア」が要点。',
    spec: {
      value: '強調したい数値(例 999)',
      stage1: { scale: '0→1.35', duration: 0.28, ease: 'OutBack' },
      dip: { scale: '1.35→1.05', duration: 0.12, ease: 'InOutSine' },
      stage2: { punch: 'punch(減衰) +0.25', duration: 0.4 },
      ring: { scale: '0.4→1.6', alpha: '0.9→0', duration: 0.5, ease: 'OutQuad' },
      note: 'damage-text/score-pop とは別。二段の弾け + 発光リング + 色フラッシュが要点',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const ring = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '96px', height: '96px', marginLeft: '-48px', marginTop: '-48px',
        borderRadius: '50%', border: '4px solid var(--pv-accent)', willChange: 'transform,opacity', pointerEvents: 'none', opacity: '0',
      });
      center.appendChild(ring);
      const flare = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '120px', height: '120px', marginLeft: '-60px', marginTop: '-60px',
        borderRadius: '50%', background: 'radial-gradient(circle, var(--pv-accent) 0%, transparent 68%)',
        willChange: 'opacity', pointerEvents: 'none', opacity: '0',
      });
      center.appendChild(flare);
      const num = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '46px', letterSpacing: '0.02em',
        color: 'var(--pv-accent)', textShadow: '0 2px 6px rgba(0,0,0,0.4)',
        willChange: 'transform', whiteSpace: 'nowrap',
      }, '999');
      center.appendChild(num);
      const setNum = s => { num.style.transform = `translate(-50%,-50%) scale(${s})`; };

      ctx.forever(async () => {
        setNum(0); ring.style.opacity = '0'; flare.style.opacity = '0';
        await ctx.wait(0.5);
        // 発光リングを拡大フェード + 色フレア
        ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutQuad', onUpdate: (v) => { PV.applyT(ring, { s: lerp(0.4, 1.6, v) }); ring.style.opacity = String(0.9 * (1 - v)); } });
        ctx.tween({ from: 0, to: 1, duration: 0.32, onUpdate: (v) => { flare.style.opacity = String(0.7 * (1 - v)); } });
        // 1段目: 大きく出す
        await ctx.tween({ from: 0, to: 1, duration: 0.28, ease: 'OutBack', onUpdate: (v) => setNum(lerp(0, 1.35, v)) });
        // 一度縮む
        await ctx.tween({ from: 0, to: 1, duration: 0.12, ease: 'InOutSine', onUpdate: (v) => setNum(lerp(1.35, 1.05, v)) });
        // 2段目: 再度弾ける(punch)
        await ctx.tween({ from: 0, to: 1, duration: 0.4, onUpdate: (v) => { const p = EASE.punchWave(v, 7, 0.55) * 0.25; setNum(1.05 + p); } });
        await ctx.wait(0.9);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InCubic', onUpdate: (v) => { setNum(lerp(1.05, 0.6, 1 - v) * v + 0); num.style.opacity = v; } });
        num.style.opacity = '1';
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using TMPro;

// 二段階で弾ける会心数値。発光リング + 色フレアを重ねる
public class CritPopLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;

    void OnEnable() => Play();

    public void Play()
    {
        number.rectTransform.localScale = Vector3.zero;
        // 発光リングを拡大フェード
        ring.localScale = Vector3.one * 0.4f;
        LMotion.Create(0.4f, 1.6f, 0.5f).WithEase(Ease.OutQuad).Bind(s => ring.localScale = Vector3.one * s);
        LMotion.Create(0.9f, 0f, 0.5f).WithEase(Ease.OutQuad).BindToAlpha(ringGroup);
        // 数値: 1段目→縮み→2段目パンチ
        LSequence.Create()
            .Append(LMotion.Create(0f, 1.35f, 0.28f).WithEase(Ease.OutBack)
                .Bind(s => number.rectTransform.localScale = Vector3.one * s))
            .Append(LMotion.Create(1.35f, 1.05f, 0.12f).WithEase(Ease.InOutSine)
                .Bind(s => number.rectTransform.localScale = Vector3.one * s))
            .Append(LMotion.Punch.Create(Vector3.zero, Vector3.one * 0.25f, 0.4f)
                .Bind(v => number.rectTransform.localScale = Vector3.one * 1.05f + v))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using TMPro;

public class CritPopDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;

    void OnEnable() => Play();

    public void Play()
    {
        var rt = number.rectTransform;
        rt.localScale = Vector3.zero;
        ring.localScale = Vector3.one * 0.4f;
        ring.DOScale(1.6f, 0.5f).SetEase(Ease.OutQuad);
        ringGroup.alpha = 0.9f;
        ringGroup.DOFade(0f, 0.5f).SetEase(Ease.OutQuad);
        DOTween.Sequence()
            .Append(rt.DOScale(1.35f, 0.28f).SetEase(Ease.OutBack))
            .Append(rt.DOScale(1.05f, 0.12f).SetEase(Ease.InOutSine))
            .Append(rt.DOPunchScale(Vector3.one * 0.25f, 0.4f, 7, 0.55f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using TMPro;

public class CritPopCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        var rt = number.rectTransform;
        StartCoroutine(Ring());
        yield return Scale(rt, 0f, 1.35f, 0.28f, OutBack);
        yield return Scale(rt, 1.35f, 1.05f, 0.12f, InOutSine);
        // 2段目パンチ(減衰振動)
        float t = 0f;
        while (t < 0.4f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.4f);
            float punch = Mathf.Sin(p * Mathf.PI * 2f * 7f) * (1f - p) * 0.25f;
            rt.localScale = Vector3.one * (1.05f + punch);
            yield return null;
        }
        rt.localScale = Vector3.one * 1.05f;
    }

    IEnumerator Ring()
    {
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.5f), e = 1f - (1f - p) * (1f - p);
            ring.localScale = Vector3.one * Mathf.Lerp(0.4f, 1.6f, e);
            ringGroup.alpha = 0.9f * (1f - e);
            yield return null;
        }
    }

    IEnumerator Scale(Transform tr, float a, float b, float dur, System.Func<float, float> ease)
    {
        float t = 0f;
        while (t < dur) { t += Time.deltaTime; tr.localScale = Vector3.one * Mathf.LerpUnclamped(a, b, ease(Mathf.Clamp01(t / dur))); yield return null; }
        tr.localScale = Vector3.one * b;
    }

    static float OutBack(float x) { const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f; return 1f + c3 * u * u * u + c1 * u * u; }
    static float InOutSine(float x) => -(Mathf.Cos(Mathf.PI * x) - 1f) * 0.5f;
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 二段の弾けはクラス切り替え + transition の連鎖で表現。
 * 発光リングは scale/opacity の transition で拡大フェードする。 */
#CritNumber {
    scale: 0 0;
    transition: scale 280ms ease-out-back;
}
#CritNumber.stage1 { scale: 1.35 1.35; }
#CritNumber.dip    { scale: 1.05 1.05; transition-duration: 120ms; }
#CritNumber.stage2 { scale: 1.3 1.3; transition-duration: 120ms; } /* 再度弾く近似 */

#CritRing {
    scale: 0.4 0.4;
    opacity: 0.9;
    transition: scale 500ms ease-out, opacity 500ms ease-out;
}
#CritRing.burst { scale: 1.6 1.6; opacity: 0; }

/* ===== C# (.cs) — 段階クラスを時間差で付与 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CritPopUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var num = root.Q<VisualElement>("CritNumber");
        var ring = root.Q<VisualElement>("CritRing");
        ring.AddToClassList("burst");
        num.AddToClassList("stage1");
        num.schedule.Execute(() => { num.RemoveFromClassList("stage1"); num.AddToClassList("dip"); }).ExecuteLater(280);
        num.schedule.Execute(() => { num.RemoveFromClassList("dip"); num.AddToClassList("stage2"); }).ExecuteLater(400);
    }
}`,
    },
  });

  /* 5. ホログラムシャイン (web) */
  R({
    id: 'holo-shine',
    title: 'ホログラムシャイン',
    titleEn: 'Holographic Shine',
    category: 'web',
    tags: ['holographic', 'foil', 'shine', 'rainbow'],
    description: '角度/位置で色相が移り変わる箔押し・ホログラム風の光沢が、表面を斜めに走る。レア表現・カード・バッジの高級感に。斜めの光沢帯を横断させつつ、hue-rotate で虹色をゆっくり循環させると箔の質感が出る。単色グロスのシャインと違い「多色の色相変化」が要点。基調色は var(--pv-accent) を保ちつつ、この技法だけ多色表現を意図的に許容する。',
    spec: {
      target: 'カード/バッジ表面の斜め光沢帯',
      sweep: { x: '-140%→140%', duration: 1.6, ease: 'InOutSine', loop: '無限' },
      hue: { rotate: '0→360deg', duration: 4, ease: 'Linear', loop: '無限' },
      note: '既存 shine(単色グロス)とは別。色相回転は実機ではグラデ + マテリアルの色相操作/シェーダで再現',
    },
    preview(ctx, PV) {
      const card = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '132px', height: '92px', marginLeft: '-66px', marginTop: '-46px',
        overflow: 'hidden', background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      });
      ctx.stage.appendChild(card);
      // 基調はアクセント。中央の紋
      const emblem = PV.el(null, {
        width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid var(--pv-accent)', boxShadow: 'inset 0 0 0 3px var(--pv-panel2)',
      });
      card.appendChild(emblem);
      // ホログラム箔レイヤー(色相回転する多色) — この技法のみ意図的に多色可
      const holo = PV.el(null, {
        position: 'absolute', inset: '-20%',
        background: 'linear-gradient(115deg, hsl(200,90%,60%), hsl(280,90%,60%), hsl(340,90%,60%), hsl(60,90%,60%), hsl(160,90%,60%))',
        mixBlendMode: 'overlay', opacity: '0.45', willChange: 'filter',
      });
      card.appendChild(holo);
      // 斜めの光沢帯
      const shine = PV.el(null, {
        position: 'absolute', top: '-30%', left: '0', width: '46px', height: '160%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
        transform: 'translateX(-140%) rotate(18deg)', willChange: 'transform', pointerEvents: 'none',
      });
      card.appendChild(shine);

      // 色相をゆっくり循環
      ctx.tween({ from: 0, to: 360, duration: 4, ease: 'Linear', loops: -1, loopType: 'Restart', onUpdate: (v) => { holo.style.filter = `hue-rotate(${v}deg)`; } });
      // 光沢帯を斜めに走らせる
      ctx.tween({
        from: -140, to: 140, duration: 1.6, ease: 'InOutSine', loops: -1, loopType: 'Restart',
        onUpdate: (v) => { shine.style.transform = `translateX(${v}%) rotate(18deg)`; },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// 斜めの光沢帯を走らせつつ、色相をゆっくり循環させて箔の質感を出す
public class HoloShineLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform shine;    // マスクした光沢帯
    [SerializeField] Graphic holoLayer;      // 虹色グラデのオーバーレイ
    [SerializeField] float sweepWidth = 200f;

    void OnEnable()
    {
        // 光沢帯の横断(無限)
        LMotion.Create(-sweepWidth, sweepWidth, 1.6f).WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Restart)
            .Bind(x => shine.anchoredPosition = new Vector2(x, shine.anchoredPosition.y));
        // 色相を循環(Color.HSVToRGB で回す)
        LMotion.Create(0f, 1f, 4f).WithEase(Ease.Linear).WithLoops(-1)
            .Bind(h => holoLayer.color = Color.HSVToRGB(h, 0.6f, 1f));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class HoloShineDOTween : MonoBehaviour
{
    [SerializeField] RectTransform shine;
    [SerializeField] Graphic holoLayer;
    [SerializeField] float sweepWidth = 200f;

    void OnEnable()
    {
        shine.DOAnchorPosX(sweepWidth, 1.6f).From(new Vector2(-sweepWidth, shine.anchoredPosition.y))
            .SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Restart);
        DOTween.To(() => 0f, h => holoLayer.color = Color.HSVToRGB(h, 0.6f, 1f), 1f, 4f)
            .SetEase(Ease.Linear).SetLoops(-1, LoopType.Restart);
    }
}`,
      coroutine: `
using UnityEngine;
using UnityEngine.UI;

public class HoloShineCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform shine;
    [SerializeField] Graphic holoLayer;
    [SerializeField] float sweepWidth = 200f;
    float t;

    void Update()
    {
        t += Time.deltaTime;
        // 光沢帯: InOutSine で往復
        float p = Mathf.PingPong(t / 1.6f, 1f);
        float e = -(Mathf.Cos(Mathf.PI * p) - 1f) * 0.5f;
        shine.anchoredPosition = new Vector2(Mathf.Lerp(-sweepWidth, sweepWidth, e), shine.anchoredPosition.y);
        // 色相を循環
        float h = (t / 4f) % 1f;
        holoLayer.color = Color.HSVToRGB(h, 0.6f, 1f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 注意: UI Toolkit は hue-rotate フィルタ非対応。
 * 色相の連続変化は C# 側で背景色を HSV で回して近似する。
 * 光沢帯の横断は translate の transition + クラス往復で表現。 */
#Shine {
    position: absolute;
    translate: -200px 0;
    rotate: 18deg;
    transition: translate 1600ms ease-in-out;
}
#Shine.sweep { translate: 200px 0; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HoloShineUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement shine, holo;
    float time;
    bool right;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        shine = root.Q<VisualElement>("Shine");
        holo = root.Q<VisualElement>("HoloLayer");
        // 光沢帯を往復
        shine.RegisterCallback<TransitionEndEvent>(_ => Toggle());
        Toggle();
        // 色相を循環(hue-rotate 非対応の近似)
        holo.schedule.Execute(() =>
        {
            time += 0.016f;
            float h = (time / 4f) % 1f;
            Color c = Color.HSVToRGB(h, 0.6f, 1f); c.a = 0.45f;
            holo.style.backgroundColor = c;
        }).Every(16);
    }

    void Toggle()
    {
        right = !right;
        if (right) shine.AddToClassList("sweep");
        else shine.RemoveFromClassList("sweep");
    }
}`,
    },
  });

  /* 6. バナードット (web) */
  R({
    id: 'banner-dots',
    title: 'バナードット',
    titleEn: 'Banner Dots',
    category: 'web',
    tags: ['banner', 'dots', 'stagger', 'wave'],
    description: '主役の大きな図形/見出しが現れると同時に、上下に並んだドット列が副次アニメ(順次点灯・波)で動き、仕上げ感を出すバナー表現。特集見出し・セクション見出しに。主役は OutBack で登場させ、ドット列は delay をずらした stagger で順に点灯/上下させると視線誘導と装飾を両立できる。',
    spec: {
      hero: { scale: '0.6→1', alpha: '0→1', duration: 0.5, ease: 'OutBack' },
      dots: { count: '上下に各 N 個', stagger: '0.05s ずつ delay', motion: '点灯 + 上下の波', ease: 'OutQuad' },
      hold: 1.2,
      note: '主役の登場に同期した副次モーションで「仕上げ感」を出すのが要点。見出し/バナーに',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      // 主役の見出し
      const hero = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0.6)',
        padding: '8px 20px', whiteSpace: 'nowrap', willChange: 'transform,opacity',
        background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '22px', letterSpacing: '0.14em',
        clipPath: 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
      }, 'FEATURE');
      center.appendChild(hero);
      const setHero = (s, a) => { hero.style.transform = `translate(-50%,-50%) scale(${s})`; hero.style.opacity = a; };

      // 上下のドット列
      const DOTS = 9, gap = 22;
      const mkRow = (yOff) => {
        const row = PV.el(null, { position: 'absolute', left: '50%', top: '50%', display: 'flex', gap: '10px', transform: `translate(-50%, ${yOff}px)` });
        const arr = [];
        for (let i = 0; i < DOTS; i++) {
          const d = PV.el(null, {
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--pv-line-strong)', willChange: 'transform,opacity', opacity: '0.35',
          });
          row.appendChild(d); arr.push(d);
        }
        center.appendChild(row);
        return arr;
      };
      const top = mkRow(-40), bottom = mkRow(40);
      const dots = top.concat(bottom);
      const lightDot = (d, delay) => {
        d.style.opacity = '0.35'; d.style.background = 'var(--pv-line-strong)';
        ctx.tween({
          from: 0, to: 1, duration: 0.45, delay, ease: 'OutQuad',
          onUpdate: (v) => {
            d.style.opacity = String(lerp(0.35, 1, v));
            d.style.background = v > 0.5 ? 'var(--pv-accent)' : 'var(--pv-line-strong)';
            PV.applyT(d, { y: -Math.sin(v * Math.PI) * 6, s: lerp(1, 1.4, Math.sin(v * Math.PI)) });
          },
        });
      };

      ctx.forever(async () => {
        setHero(0.6, 0);
        dots.forEach(d => { d.style.opacity = '0.35'; PV.applyT(d, { y: 0, s: 1 }); });
        await ctx.wait(0.5);
        // 主役登場
        ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutBack', onUpdate: (v, t) => setHero(lerp(0.6, 1, v), Math.min(t * 3, 1)) });
        // ドット列を stagger で波状に点灯
        top.forEach((d, i) => lightDot(d, i * 0.05));
        bottom.forEach((d, i) => lightDot(d, (DOTS - 1 - i) * 0.05));
        await ctx.wait(1.2);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InCubic', onUpdate: (v) => setHero(lerp(0.6, 1, v), v) });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// 主役の見出しを OutBack で登場させ、上下のドット列を stagger で波状に点灯
[RequireComponent(typeof(CanvasGroup))]
public class BannerDotsLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform hero;
    [SerializeField] Image[] dots;       // 上下に並べたドット
    [SerializeField] float step = 0.05f;
    CanvasGroup heroGroup;

    void Awake() => heroGroup = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        hero.localScale = Vector3.one * 0.6f;
        heroGroup.alpha = 0f;
        LMotion.Create(0.6f, 1f, 0.5f).WithEase(Ease.OutBack).Bind(s => hero.localScale = Vector3.one * s);
        LMotion.Create(0f, 1f, 0.4f).BindToAlpha(heroGroup);
        for (int i = 0; i < dots.Length; i++)
        {
            var d = dots[i];
            LMotion.Create(0.35f, 1f, 0.45f).WithEase(Ease.OutQuad).WithDelay(i * step)
                .Bind(a => { var c = d.color; c.a = a; d.color = c; });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(CanvasGroup))]
public class BannerDotsDOTween : MonoBehaviour
{
    [SerializeField] RectTransform hero;
    [SerializeField] Image[] dots;
    [SerializeField] float step = 0.05f;
    CanvasGroup heroGroup;

    void Awake() => heroGroup = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        hero.localScale = Vector3.one * 0.6f;
        heroGroup.alpha = 0f;
        hero.DOScale(1f, 0.5f).SetEase(Ease.OutBack);
        heroGroup.DOFade(1f, 0.4f);
        for (int i = 0; i < dots.Length; i++)
            dots[i].DOFade(1f, 0.45f).SetEase(Ease.OutQuad).SetDelay(i * step).From(0.35f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(CanvasGroup))]
public class BannerDotsCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform hero;
    [SerializeField] Image[] dots;
    [SerializeField] float step = 0.05f;
    CanvasGroup heroGroup;

    void Awake() => heroGroup = GetComponent<CanvasGroup>();
    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        heroGroup.alpha = 0f;
        StartCoroutine(Hero());
        for (int i = 0; i < dots.Length; i++)
            StartCoroutine(Light(dots[i], i * step));
        yield return null;
    }

    IEnumerator Hero()
    {
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / 0.5f));
            hero.localScale = Vector3.one * Mathf.LerpUnclamped(0.6f, 1f, e);
            heroGroup.alpha = Mathf.Clamp01(t / 0.4f);
            yield return null;
        }
    }

    IEnumerator Light(Image d, float delay)
    {
        if (delay > 0f) yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.45f)
        {
            t += Time.deltaTime;
            float e = 1f - (1f - Mathf.Clamp01(t / 0.45f)) * (1f - Mathf.Clamp01(t / 0.45f));
            var c = d.color; c.a = Mathf.Lerp(0.35f, 1f, e); d.color = c;
            yield return null;
        }
    }

    static float OutBack(float x) { const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f; return 1f + c3 * u * u * u + c1 * u * u; }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 主役はクラス付与で OutBack 登場、ドットは stagger を C# の delay で付ける。 */
#Hero {
    scale: 0.6 0.6;
    opacity: 0;
    transition: scale 500ms ease-out-back, opacity 400ms ease-out;
}
#Hero.shown { scale: 1 1; opacity: 1; }

.banner-dot {
    opacity: 0.35;
    transition: opacity 450ms ease-out, scale 450ms ease-out;
}
.banner-dot.lit { opacity: 1; scale: 1.4 1.4; }

/* ===== C# (.cs) — ドットへ順次 delay を付けて点灯 ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class BannerDotsUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float stepMs = 50f;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var hero = root.Q<VisualElement>("Hero");
        var dots = root.Query<VisualElement>(className: "banner-dot").ToList();
        hero.AddToClassList("shown");
        for (int i = 0; i < dots.Count; i++)
        {
            var d = dots[i];
            d.style.transitionDelay = new List<TimeValue> { new TimeValue(i * stepMs, TimeUnit.Millisecond) };
            d.AddToClassList("lit");
        }
    }
}`,
    },
  });
})();
