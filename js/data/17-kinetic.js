/* 17-kinetic.js — キネティック / インパクト系の手触りモーション (6種)
 *   skew-slide-in / kinetic-slam / cutout-title
 *   option-burst / speed-lines / converge-reveal
 * 配属: entrance / text / text / widget / attention / transition。各種にUI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. スキュースライドイン (entrance) */
  R({
    id: 'skew-slide-in',
    title: 'スキュースライドイン',
    titleEn: 'Skew Slide In',
    category: 'entrance',
    tags: ['skew', 'slide', 'kinetic', '登場'],
    description: 'パネルが横方向のシアー(skewX)を伴ったまま画面外から高速で滑り込み、着地で skew が 0 に緩んで整列する角張った登場。勢いを付けたいパネル・見出し帯の表示に向く。位置は OutCubic、skew は OutQuad で別々に戻すと「勢い→整列」の緩急が出る。',
    spec: {
      target: 'パネル(RectTransform + シアー)',
      slide: { x: '-260→0', duration: 0.5, ease: 'OutCubic' },
      skew: { skewX: '-18deg→0', duration: 0.55, ease: 'OutQuad' },
      note: 'uGUIは skew を直接持たないため、実機は傾けた子要素/簡易頂点操作か Canvas の疑似シアーで近似する',
    },
    preview(ctx, PV) {
      const panel = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '150px', height: '52px',
        marginLeft: '-75px', marginTop: '-26px',
        display: 'flex', alignItems: 'center', paddingLeft: '16px', boxSizing: 'border-box',
        background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '18px', letterSpacing: '0.14em',
        clipPath: 'polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)',
        willChange: 'transform', transform: 'translateX(-260px) skewX(-18deg)',
      }, 'MENU');
      ctx.stage.appendChild(panel);
      // 背後の下線帯 (遅れて追う奥行き)
      const under = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '150px', height: '5px',
        marginLeft: '-71px', marginTop: '30px', background: 'var(--pv-accent-dim)',
        willChange: 'transform', transform: 'translateX(-300px) skewX(-18deg)',
      });
      ctx.stage.appendChild(under);

      const setP = (x, sk) => {
        panel.style.transform = `translateX(${x}px) skewX(${sk}deg)`;
        under.style.transform = `translateX(${x * 1.15}px) skewX(${sk}deg)`;
      };
      ctx.forever(async () => {
        setP(-260, -18);
        await ctx.wait(0.4);
        // 位置は OutCubic、skew は OutQuad で別々に戻す
        let px = -260, sk = -18;
        ctx.tween({ from: -18, to: 0, duration: 0.55, ease: 'OutQuad', onUpdate: v => { sk = v; setP(px, sk); } });
        await ctx.tween({ from: -260, to: 0, duration: 0.5, ease: 'OutCubic', onUpdate: v => { px = v; setP(px, sk); } });
        await ctx.wait(1.1);
        await ctx.tween({ from: 0, to: 1, duration: 0.32, ease: 'InCubic', onUpdate: t => { setP(lerp(0, 90, t), lerp(0, 10, t)); panel.style.opacity = 1 - t; under.style.opacity = 1 - t; } });
        panel.style.opacity = '1'; under.style.opacity = '1';
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 位置と疑似シアーを別カーブで戻し「勢い→整列」を作る
public class SkewSlideInLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] RectTransform shear;   // skew を担う子 (localScale.x を傾け代わりに使う簡易近似)
    [SerializeField] float offX = -320f;
    [SerializeField] float skew = -18f;

    void OnEnable() => Play();

    public void Play()
    {
        panel.anchoredPosition = new Vector2(offX, panel.anchoredPosition.y);
        LMotion.Create(offX, 0f, 0.5f).WithEase(Ease.OutCubic).BindToAnchoredPositionX(panel);
        // uGUI は skew を直接持たないため、角度を子の回転で近似する
        LMotion.Create(skew, 0f, 0.55f).WithEase(Ease.OutQuad)
            .Bind(a => shear.localEulerAngles = new Vector3(0f, 0f, a));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SkewSlideInDOTween : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] RectTransform shear;   // skew 近似 (子の回転)
    [SerializeField] float offX = -320f;
    [SerializeField] float skew = -18f;

    void OnEnable() => Play();

    public void Play()
    {
        panel.anchoredPosition = new Vector2(offX, panel.anchoredPosition.y);
        shear.localEulerAngles = new Vector3(0f, 0f, skew);
        panel.DOAnchorPosX(0f, 0.5f).SetEase(Ease.OutCubic);
        shear.DOLocalRotate(Vector3.zero, 0.55f).SetEase(Ease.OutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SkewSlideInCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] RectTransform shear;
    [SerializeField] float offX = -320f;
    [SerializeField] float skew = -18f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        float t = 0f;
        while (t < 0.55f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.5f);
            float ec = 1f - Mathf.Pow(1f - p, 3f);                 // OutCubic
            float eq = 1f - (1f - Mathf.Clamp01(t / 0.55f)) * (1f - Mathf.Clamp01(t / 0.55f)); // OutQuad
            panel.anchoredPosition = new Vector2(Mathf.Lerp(offX, 0f, ec), panel.anchoredPosition.y);
            shear.localEulerAngles = new Vector3(0f, 0f, Mathf.Lerp(skew, 0f, eq));
            yield return null;
        }
        panel.anchoredPosition = new Vector2(0f, panel.anchoredPosition.y);
        shear.localEulerAngles = Vector3.zero;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* UI Toolkit は rotate/translate を持つが skew は無いため、rotate で傾きを近似する */
#Panel {
    position: absolute;
    translate: -320px 0;
    rotate: -18deg;
    transform-origin: left center;
    transition: translate 500ms ease-out, rotate 550ms ease-out;
}
#Panel.shown { translate: 0 0; rotate: 0deg; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SkewSlideInUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var panel = document.rootVisualElement.Q<VisualElement>("Panel");
        panel.AddToClassList("shown");
    }
}`,
    },
  });

  /* 2. キネティックスラム (text) */
  R({
    id: 'kinetic-slam',
    title: 'キネティックスラム',
    titleEn: 'Kinetic Slam',
    category: 'text',
    tags: ['kinetic', 'impact', 'shake', '見出し'],
    description: '大きな見出し文字が斜めのオフセットとオーバーシュートで叩き込まれ、着地で微振動(shake)して締まるインパクト表示。決め台詞・大見出し・成否結果の強調に。大きめスケール→1.0へ OutBack で落とし、着地の一瞬だけ減衰シェイクを乗せると重さが出る。',
    spec: {
      target: '大見出しテキスト(TMP_Text)',
      slam: { scale: '1.6→1.0', offset: '(14,-10)→(0,0)', duration: 0.32, ease: 'OutBack' },
      land_shake: { amp: '6px', duration: 0.35, ease: 'shakeWave(減衰)' },
      note: '着地の瞬間だけシェイクを乗せる。連発すると軽くなるので1回で締める',
    },
    preview(ctx, PV) {
      const word = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '40px', letterSpacing: '0.06em',
        color: 'var(--pv-accent)', whiteSpace: 'nowrap', willChange: 'transform',
        transform: 'translate(-50%,-50%) translate(0px,0px) scale(1.6)',
      }, 'IMPACT');
      ctx.stage.appendChild(word);

      const set = (dx, dy, s) => { word.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px) scale(${s})`; };
      ctx.forever(async () => {
        set(14, -10, 1.6); word.style.opacity = '0';
        await ctx.wait(0.4);
        word.style.opacity = '1';
        // 斜めオフセット＋オーバーシュートで叩き込む
        await ctx.tween({ from: 0, to: 1, duration: 0.32, ease: 'OutBack', onUpdate: v => set(lerp(14, 0, v), lerp(-10, 0, v), lerp(1.6, 1, v)) });
        // 着地の微振動 (減衰シェイク)
        await ctx.tween({ from: 0, to: 1, duration: 0.35, onUpdate: t => { const sx = EASE.shakeWave(t, 3, 12, 1) * 6; const sy = EASE.shakeWave(t, 9, 12, 1) * 4; set(sx, sy, 1); } });
        set(0, 0, 1);
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 0, duration: 0.28, ease: 'InCubic', onUpdate: v => { word.style.opacity = v; set(0, 0, lerp(1, 0.85, 1 - v)); } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using TMPro;

// 斜めオフセット＋オーバーシュートで叩き込み、着地で減衰シェイク
public class KineticSlamLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform text;   // TMP_Text の RectTransform
    [SerializeField] float shakeAmp = 6f;

    void OnEnable() => Play();

    public void Play()
    {
        text.localScale = Vector3.one * 1.6f;
        text.anchoredPosition = new Vector2(14f, -10f);
        LSequence.Create()
            .Append(LMotion.Create(1.6f, 1f, 0.32f).WithEase(Ease.OutBack)
                .Bind(s => text.localScale = Vector3.one * s))
            .Join(LMotion.Create(new Vector2(14f, -10f), Vector2.zero, 0.32f).WithEase(Ease.OutBack)
                .BindToAnchoredPosition(text))
            .Append(LMotion.Punch.Create(Vector3.zero, Vector3.one * shakeAmp, 0.35f)
                .WithFrequency(12)
                .Bind(v => text.anchoredPosition = new Vector2(v.x, v.y)))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class KineticSlamDOTween : MonoBehaviour
{
    [SerializeField] RectTransform text;
    [SerializeField] float shakeAmp = 6f;

    void OnEnable() => Play();

    public void Play()
    {
        text.localScale = Vector3.one * 1.6f;
        text.anchoredPosition = new Vector2(14f, -10f);
        DOTween.Sequence()
            .Append(text.DOScale(1f, 0.32f).SetEase(Ease.OutBack))
            .Join(text.DOAnchorPos(Vector2.zero, 0.32f).SetEase(Ease.OutBack))
            .Append(text.DOShakeAnchorPos(0.35f, shakeAmp, 14, 90f, false, true));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class KineticSlamCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform text;
    [SerializeField] float shakeAmp = 6f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        float t = 0f;
        while (t < 0.32f)
        {
            t += Time.deltaTime;
            float v = OutBack(Mathf.Clamp01(t / 0.32f));
            text.localScale = Vector3.one * Mathf.LerpUnclamped(1.6f, 1f, v);
            text.anchoredPosition = Vector2.LerpUnclamped(new Vector2(14f, -10f), Vector2.zero, v);
            yield return null;
        }
        t = 0f;
        while (t < 0.35f)
        {
            t += Time.deltaTime;
            float d = 1f - Mathf.Clamp01(t / 0.35f);                 // 減衰
            float a = shakeAmp * d;
            text.anchoredPosition = new Vector2(Random.Range(-a, a), Random.Range(-a, a));
            yield return null;
        }
        text.anchoredPosition = Vector2.zero;
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 叩き込みは transition。着地シェイクは連続微振動なので schedule で駆動する */
#Slam {
    scale: 1.6;
    translate: 14px -10px;
    transition: scale 320ms ease-out-back, translate 320ms ease-out-back;
}
#Slam.landed { scale: 1; translate: 0 0; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class KineticSlamUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float shakeAmp = 6f;
    VisualElement text;

    void OnEnable()
    {
        text = document.rootVisualElement.Q<VisualElement>("Slam");
        text.AddToClassList("landed");
        // 着地後に減衰シェイクを短時間だけ乗せる
        text.schedule.Execute(() => StartShake()).ExecuteLater(320);
    }

    void StartShake()
    {
        float dur = 0.35f, start = Time.time;
        var it = text.schedule.Execute(() =>
        {
            float d = 1f - Mathf.Clamp01((Time.time - start) / dur);
            float a = shakeAmp * d;
            text.style.translate = new Translate(Random.Range(-a, a), Random.Range(-a, a));
        }).Every(16);
        text.schedule.Execute(() => { it.Pause(); text.style.translate = new Translate(0, 0); }).ExecuteLater(360);
    }
}`,
    },
  });

  /* 3. カットアウトタイトル (text) */
  R({
    id: 'cutout-title',
    title: 'カットアウトタイトル',
    titleEn: 'Cutout Title',
    category: 'text',
    tags: ['cutout', 'stagger', 'title', '見出し'],
    description: '各文字が大小・角度・上下オフセットのばらついた「切り抜き」風に、時間差でポンポンと現れる不揃いなタイトル演出。ラフで元気なタイトル・ロゴ的な見出しに。文字ごとに乱数で回転/スケール/Yを与え、stagger で OutBack ポップさせると手貼りのコラージュ感が出る。',
    spec: {
      target: 'タイトルの各文字(1文字=1要素)',
      per_char: { scale: '0→1(乱数終値 0.9〜1.15)', rot: '乱数 -14〜14deg', y: '乱数 -6〜6px', ease: 'OutBack' },
      stagger: 0.06,
      note: '各文字の最終姿勢に少し乱数を残すと切り抜きコラージュ感が出る',
    },
    preview(ctx, PV) {
      const row = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        display: 'flex', gap: '2px',
      });
      ctx.stage.appendChild(row);
      const text = 'TITLE';
      const chars = [...text].map((c, i) => {
        const el = PV.el(null, {
          fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '38px', lineHeight: '1',
          color: 'var(--pv-accent)', display: 'inline-block', willChange: 'transform,opacity',
          transformOrigin: 'center bottom',
        }, c);
        // 交互に配色して切り抜き感を強める
        if (i % 2 === 1) el.style.color = 'var(--pv-text)';
        row.appendChild(el);
        return el;
      });
      // 文字ごとの最終姿勢(乱数)を固定
      const seeds = chars.map(() => ({ rot: (Math.random() * 2 - 1) * 14, y: (Math.random() * 2 - 1) * 6, s: lerp(0.9, 1.15, Math.random()) }));

      ctx.forever(async () => {
        chars.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(0) rotate(0deg) scale(0)'; });
        await ctx.wait(0.35);
        for (let i = 0; i < chars.length; i++) {
          const el = chars[i], sd = seeds[i];
          el.style.opacity = '1';
          ctx.tween({ from: 0, to: 1, duration: 0.4, ease: 'OutBack', onUpdate: v => { el.style.transform = `translateY(${lerp(0, sd.y, v)}px) rotate(${lerp(0, sd.rot, v)}deg) scale(${lerp(0, sd.s, v)})`; } });
          await ctx.wait(0.06);
        }
        await ctx.wait(1.3);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InCubic', onUpdate: v => chars.forEach(el => el.style.opacity = v) });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 各文字を1要素にし、乱数の最終姿勢へ stagger でポップさせる
public class CutoutTitleLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;   // 1文字=1 RectTransform
    [SerializeField] float stagger = 0.06f;

    void OnEnable() => Play();

    public void Play()
    {
        for (int i = 0; i < chars.Length; i++)
        {
            var t = chars[i];
            float rot = Random.Range(-14f, 14f);
            float y = Random.Range(-6f, 6f);
            float s = Random.Range(0.9f, 1.15f);
            t.localScale = Vector3.zero;
            LMotion.Create(0f, 1f, 0.4f).WithEase(Ease.OutBack).WithDelay(i * stagger)
                .Bind(v =>
                {
                    t.localScale = Vector3.one * (s * v);
                    t.localEulerAngles = new Vector3(0f, 0f, rot * v);
                    t.anchoredPosition = new Vector2(t.anchoredPosition.x, y * v);
                });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CutoutTitleDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;
    [SerializeField] float stagger = 0.06f;

    void OnEnable() => Play();

    public void Play()
    {
        for (int i = 0; i < chars.Length; i++)
        {
            var t = chars[i];
            float rot = Random.Range(-14f, 14f), s = Random.Range(0.9f, 1.15f);
            t.localScale = Vector3.zero;
            var seq = DOTween.Sequence().SetDelay(i * stagger);
            seq.Append(t.DOScale(s, 0.4f).SetEase(Ease.OutBack));
            seq.Join(t.DOLocalRotate(new Vector3(0f, 0f, rot), 0.4f).SetEase(Ease.OutBack));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CutoutTitleCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;
    [SerializeField] float stagger = 0.06f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        foreach (var t in chars) t.localScale = Vector3.zero;
        for (int i = 0; i < chars.Length; i++)
        {
            StartCoroutine(Pop(chars[i], Random.Range(-14f, 14f), Random.Range(0.9f, 1.15f)));
            yield return new WaitForSeconds(stagger);
        }
    }

    IEnumerator Pop(RectTransform t, float rot, float s)
    {
        float e = 0f;
        while (e < 0.4f)
        {
            e += Time.deltaTime;
            float v = OutBack(Mathf.Clamp01(e / 0.4f));
            t.localScale = Vector3.one * (s * v);
            t.localEulerAngles = new Vector3(0f, 0f, rot * v);
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 各文字を Label にし、scale 0→1 を transition。乱数姿勢とディレイは C# で付与 */
.cutout-char {
    scale: 0;
    transition: scale 400ms ease-out-back, rotate 400ms ease-out-back;
}
.cutout-char.shown { scale: 1; }

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class CutoutTitleUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] long staggerMs = 60;

    void OnEnable()
    {
        var chars = document.rootVisualElement.Query<VisualElement>(className: "cutout-char").ToList();
        for (int i = 0; i < chars.Count; i++)
        {
            var c = chars[i];
            float rot = Random.Range(-14f, 14f), s = Random.Range(0.9f, 1.15f);
            c.style.rotate = new Rotate(new Angle(rot, AngleUnit.Degree));
            c.schedule.Execute(() =>
            {
                c.style.scale = new Scale(new Vector3(s, s, 1f));
                c.AddToClassList("shown");
            }).ExecuteLater(i * staggerMs);
        }
    }
}`,
    },
  });

  /* 4. オプションバースト (widget) */
  R({
    id: 'option-burst',
    title: 'オプションバースト',
    titleEn: 'Option Burst',
    category: 'widget',
    tags: ['burst', 'stagger', 'menu', '展開'],
    description: 'メニュー項目が一点(中心)から放射状に勢いよく飛び出し、それぞれの整列位置へ吸着するように収まる開き方。メニュー展開・クイック選択・アクションリストに。中心→各スロットへ OutBack ＋ stagger で飛ばし、閉じは逆順で中心へ吸わせる。円形メニューと違い最終的に縦リストへ整列するのが要点。',
    spec: {
      target: 'メニュー項目(複数)',
      open: { from: '中心(0,0)', to: '各スロット', duration: 0.42, ease: 'OutBack', stagger: 0.05 },
      close: { to: '中心へ吸着', duration: 0.28, ease: 'InCubic', order: '逆順' },
      note: '放射で飛び出すが最終位置は整列リスト。円形メニューとは別物',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0', transform: 'translate(-50%,-50%)' });
      ctx.stage.appendChild(center);
      const labels = ['START', 'OPTION', 'HELP', 'EXIT'];
      const SLOT = 26;
      const items = labels.map((l, i) => {
        const el = PV.el('mono', {
          position: 'absolute', left: '-56px', width: '112px', boxSizing: 'border-box',
          top: (i * SLOT - (labels.length - 1) * SLOT / 2 - 9) + 'px',
          textAlign: 'center', padding: '4px 0', fontSize: '11px', letterSpacing: '0.14em',
          color: 'var(--pv-on-accent)', background: 'var(--pv-accent)',
          clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
          willChange: 'transform,opacity', transform: 'translate(0px,0px) scale(0)',
        }, l);
        center.appendChild(el);
        return el;
      });
      // 各項目の整列先(スロットの相対Y)＝ top で既に配置済みなので、飛び出しは中心からの差分で表現
      const slotY = items.map((el, i) => (i * SLOT - (labels.length - 1) * SLOT / 2 - 9));

      ctx.forever(async () => {
        items.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translate(0px,0px) scale(0)'; });
        await ctx.wait(0.45);
        // 中心から各スロットへ放射→整列 (stagger)
        for (let i = 0; i < items.length; i++) {
          const el = items[i], sy = slotY[i];
          el.style.opacity = '1';
          ctx.tween({ from: 0, to: 1, duration: 0.42, ease: 'OutBack', onUpdate: v => { el.style.transform = `translate(0px,${lerp(-sy, 0, v)}px) scale(${v})`; } });
          await ctx.wait(0.05);
        }
        await ctx.wait(1.1);
        // 逆順で中心へ吸着して閉じる
        for (let i = items.length - 1; i >= 0; i--) {
          const el = items[i], sy = slotY[i];
          ctx.tween({ from: 1, to: 0, duration: 0.28, ease: 'InCubic', onUpdate: v => { el.style.opacity = v; el.style.transform = `translate(0px,${lerp(-sy, 0, v)}px) scale(${v})`; } });
          await ctx.wait(0.04);
        }
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 中心から各スロットへ放射して整列。閉じは逆順で中心へ吸着
public class OptionBurstLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] Vector2[] slots;      // 各項目の整列先 anchoredPosition
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => Open();

    public void Open()
    {
        for (int i = 0; i < items.Length; i++)
        {
            var t = items[i]; var slot = slots[i];
            t.localScale = Vector3.zero;
            t.anchoredPosition = Vector2.zero;
            LMotion.Create(0f, 1f, 0.42f).WithEase(Ease.OutBack).WithDelay(i * stagger)
                .Bind(v =>
                {
                    t.localScale = Vector3.one * v;
                    t.anchoredPosition = Vector2.LerpUnclamped(Vector2.zero, slot, v);
                });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class OptionBurstDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] Vector2[] slots;
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => Open();

    public void Open()
    {
        for (int i = 0; i < items.Length; i++)
        {
            var t = items[i];
            t.localScale = Vector3.zero;
            t.anchoredPosition = Vector2.zero;
            float d = i * stagger;
            t.DOScale(1f, 0.42f).SetEase(Ease.OutBack).SetDelay(d);
            t.DOAnchorPos(slots[i], 0.42f).SetEase(Ease.OutBack).SetDelay(d);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class OptionBurstCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] items;
    [SerializeField] Vector2[] slots;
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => StartCoroutine(Open());

    IEnumerator Open()
    {
        foreach (var t in items) { t.localScale = Vector3.zero; t.anchoredPosition = Vector2.zero; }
        for (int i = 0; i < items.Length; i++)
        {
            StartCoroutine(Fly(items[i], slots[i]));
            yield return new WaitForSeconds(stagger);
        }
    }

    IEnumerator Fly(RectTransform t, Vector2 slot)
    {
        float e = 0f;
        while (e < 0.42f)
        {
            e += Time.deltaTime;
            float v = OutBack(Mathf.Clamp01(e / 0.42f));
            t.localScale = Vector3.one * v;
            t.anchoredPosition = Vector2.LerpUnclamped(Vector2.zero, slot, v);
            yield return null;
        }
        t.anchoredPosition = slot;
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 各項目を中心(translate 0)＋scale 0 から、整列先 translate へ transition */
.burst-item {
    position: absolute;
    scale: 0;
    transition: scale 420ms ease-out-back, translate 420ms ease-out-back;
}

/* ===== C# (.cs) — 整列先とディレイを付与 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class OptionBurstUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2[] slots;      // 各項目の整列先(px)
    [SerializeField] long staggerMs = 50;

    void OnEnable()
    {
        var items = document.rootVisualElement.Query<VisualElement>(className: "burst-item").ToList();
        for (int i = 0; i < items.Count; i++)
        {
            var el = items[i];
            var slot = i < slots.Length ? slots[i] : Vector2.zero;
            el.schedule.Execute(() =>
            {
                el.style.scale = new Scale(Vector3.one);
                el.style.translate = new Translate(slot.x, slot.y);
            }).ExecuteLater(i * staggerMs);
        }
    }
}`,
    },
  });

  /* 5. スピードライン (attention) */
  R({
    id: 'speed-lines',
    title: 'スピードライン',
    titleEn: 'Speed Lines',
    category: 'attention',
    tags: ['集中線', 'impact', 'burst', '強調'],
    description: '中心へ収束する多数の細線(集中線)が瞬間的に現れて対象を強調し、素早く消える漫画的なアクセント。ヒット・気合・注目の一瞬強調に。外側から内側へ scaleX で伸ばしつつフェードで抜くと「シュッ」と決まる。連続再生でループ強調にも使える。',
    spec: {
      target: '中心から放射する細線(多数)',
      appear: { scaleX: '0→1', alpha: '0→1', duration: 0.12, ease: 'OutQuad' },
      vanish: { alpha: '1→0', duration: 0.22, ease: 'InQuad' },
      interval: 0.9,
      note: '各線は中心を原点に回転配置。瞬間表示で強調し即消す',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0', transform: 'translate(-50%,-50%)' });
      ctx.stage.appendChild(center);
      const N = 20, R0 = 120;
      const lines = [];
      for (let i = 0; i < N; i++) {
        const ang = i / N * 360 + (Math.random() * 8 - 4);
        const len = lerp(34, 54, Math.random());
        const line = PV.el(null, {
          position: 'absolute', left: '0', top: '0', height: '2px', width: len + 'px',
          marginTop: '-1px', transformOrigin: 'right center',
          // right end を半径 R0 に置き、中心へ向けて伸びる集中線
          transform: `rotate(${ang}deg) translateX(${R0}px) scaleX(0)`,
          background: 'linear-gradient(90deg, transparent, var(--pv-accent))',
          willChange: 'transform,opacity', opacity: '0',
        });
        center.appendChild(line);
        lines.push({ el: line, ang, len });
      }
      // 中央の対象
      const dot = PV.el(null, {
        position: 'absolute', left: '-10px', top: '-10px', width: '20px', height: '20px',
        background: 'var(--pv-accent)', willChange: 'transform',
        clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
      });
      center.appendChild(dot);

      const setLine = (o, v) => { o.el.style.transform = `rotate(${o.ang}deg) translateX(${R0}px) scaleX(${v})`; };
      ctx.forever(async () => {
        // 集中線が瞬間的に現れて対象を強調
        lines.forEach(o => o.el.style.opacity = '1');
        ctx.tween({ from: 0.6, to: 1, duration: 0.14, ease: 'OutBack', onUpdate: v => PV.applyT(dot, { s: v }) });
        await ctx.tween({ from: 0, to: 1, duration: 0.12, ease: 'OutQuad', onUpdate: v => lines.forEach(o => setLine(o, v)) });
        await ctx.tween({ from: 1, to: 0, duration: 0.22, ease: 'InQuad', onUpdate: v => lines.forEach(o => o.el.style.opacity = v) });
        lines.forEach(o => setLine(o, 0));
        await ctx.wait(0.7);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 中心へ収束する集中線を瞬間表示して即消す
public class SpeedLinesLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] lines;   // 中心原点に放射配置。pivot は外側端
    [SerializeField] CanvasGroup group;

    void OnEnable() => Flash();

    public void Flash()
    {
        group.alpha = 1f;
        foreach (var l in lines)
            LMotion.Create(0f, 1f, 0.12f).WithEase(Ease.OutQuad)
                .Bind(v => l.localScale = new Vector3(v, 1f, 1f));
        LMotion.Create(1f, 0f, 0.22f).WithEase(Ease.InQuad).WithDelay(0.12f)
            .Bind(a => group.alpha = a);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SpeedLinesDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] lines;
    [SerializeField] CanvasGroup group;

    void OnEnable() => Flash();

    public void Flash()
    {
        group.alpha = 1f;
        foreach (var l in lines)
            l.DOScaleX(1f, 0.12f).From(0f).SetEase(Ease.OutQuad);
        group.DOFade(0f, 0.22f).SetDelay(0.12f).SetEase(Ease.InQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SpeedLinesCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] lines;
    [SerializeField] CanvasGroup group;

    void OnEnable() => StartCoroutine(Flash());

    IEnumerator Flash()
    {
        group.alpha = 1f;
        float t = 0f;
        while (t < 0.12f)
        {
            t += Time.deltaTime;
            float v = 1f - (1f - Mathf.Clamp01(t / 0.12f)) * (1f - Mathf.Clamp01(t / 0.12f)); // OutQuad
            foreach (var l in lines) l.localScale = new Vector3(v, 1f, 1f);
            yield return null;
        }
        t = 0f;
        while (t < 0.22f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.22f);
            group.alpha = 1f - p * p;   // InQuad
            yield return null;
        }
        group.alpha = 0f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 各線を中心原点に配置。scaleX 0→1 で伸ばし、親の opacity で一括フェード */
.speed-line { transform-origin: right center; scale: 0 1; transition: scale 120ms ease-out; }
.speed-line.on { scale: 1 1; }
#Lines { transition: opacity 220ms ease-in; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SpeedLinesUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement group;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        group = root.Q<VisualElement>("Lines");
        group.style.opacity = 1f;
        foreach (var l in root.Query<VisualElement>(className: "speed-line").ToList())
            l.AddToClassList("on");
        // 伸び切ってからフェードアウト
        group.schedule.Execute(() => group.style.opacity = 0f).ExecuteLater(120);
    }
}`,
    },
  });

  /* 6. 集中線リビール (transition) */
  R({
    id: 'converge-reveal',
    title: '集中線リビール',
    titleEn: 'Converge Reveal',
    category: 'transition',
    tags: ['集中線', 'converge', 'reveal', '導入'],
    description: '画面外周から中央へ複数の帯が直線的に収束し、中央で対象を出現させる導入トランジション。画面導入・フォーカス誘導・シーン切替の入りに。帯は InCubic で中央へ突っ込ませ、集まった瞬間に中央要素をポップ、その後帯を外へ抜くと視線が中心に集まる。',
    spec: {
      target: '四方(上下左右)から中央へ収束する帯 + 中央の対象',
      converge: { from: '画面外', to: '中央', duration: 0.4, ease: 'InCubic' },
      reveal: { scale: '0→1', duration: 0.35, ease: 'OutBack' },
      exit: { 帯: '中央→外へ scaleX/位置で抜く', duration: 0.3, ease: 'OutQuad' },
      note: '帯の収束で視線を中央へ誘導してから対象を出す',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0', transform: 'translate(-50%,-50%)' });
      ctx.stage.appendChild(center);
      // 四方から寄る帯 (dir: 単位ベクトル, 開始オフセット)
      const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
      const bands = dirs.map(d => {
        const horiz = d.x !== 0;
        const el = PV.el(null, {
          position: 'absolute', left: '50%', top: '50%',
          width: horiz ? '110px' : '10px', height: horiz ? '10px' : '90px',
          marginLeft: horiz ? '-55px' : '-5px', marginTop: horiz ? '-5px' : '-45px',
          background: 'var(--pv-accent)', opacity: '0.85', willChange: 'transform',
          transform: 'translate(0px,0px)',
        });
        center.appendChild(el);
        return { el, d };
      });
      // 中央の対象
      const target = PV.el(null, {
        position: 'absolute', left: '-22px', top: '-22px', width: '44px', height: '44px',
        background: 'var(--pv-panel2)', border: '2px solid var(--pv-accent)',
        clipPath: 'polygon(50% 0,100% 30%,82% 100%,18% 100%,0 30%)',
        willChange: 'transform', transform: 'scale(0)',
      });
      center.appendChild(target);
      const OFF = 130;

      ctx.forever(async () => {
        bands.forEach(b => b.el.style.transform = `translate(${b.d.x * OFF}px,${b.d.y * OFF}px)`);
        PV.applyT(target, { s: 0 });
        await ctx.wait(0.4);
        // 外→中央へ収束
        await ctx.tween({ from: 1, to: 0, duration: 0.4, ease: 'InCubic', onUpdate: v => bands.forEach(b => b.el.style.transform = `translate(${b.d.x * OFF * v}px,${b.d.y * OFF * v}px)`) });
        // 中央で対象を出現
        ctx.tween({ from: 0, to: 1, duration: 0.35, ease: 'OutBack', onUpdate: v => PV.applyT(target, { s: v }) });
        // 帯を外へ抜く
        await ctx.tween({ from: 0, to: 1, duration: 0.3, ease: 'OutQuad', onUpdate: v => bands.forEach(b => { b.el.style.transform = `translate(${b.d.x * OFF * v}px,${b.d.y * OFF * v}px)`; b.el.style.opacity = 0.85 * (1 - v); }) });
        bands.forEach(b => b.el.style.opacity = '0.85');
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 0, duration: 0.28, ease: 'InCubic', onUpdate: v => PV.applyT(target, { s: v }) });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 四方の帯が中央へ収束→対象を出現→帯を外へ抜く導入トランジション
public class ConvergeRevealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;   // 各帯。開始は画面外
    [SerializeField] Vector2[] offsets;       // 各帯の外側オフセット
    [SerializeField] RectTransform target;

    void OnEnable() => Play();

    public void Play()
    {
        target.localScale = Vector3.zero;
        for (int i = 0; i < bands.Length; i++)
        {
            var b = bands[i]; var off = offsets[i];
            LMotion.Create(1f, 0f, 0.4f).WithEase(Ease.InCubic)
                .Bind(v => b.anchoredPosition = off * v);
        }
        LMotion.Create(0f, 1f, 0.35f).WithEase(Ease.OutBack).WithDelay(0.4f)
            .Bind(s => target.localScale = Vector3.one * s);
        // 帯を外へ抜く
        for (int i = 0; i < bands.Length; i++)
        {
            var b = bands[i]; var off = offsets[i];
            LMotion.Create(0f, 1f, 0.3f).WithEase(Ease.OutQuad).WithDelay(0.4f)
                .Bind(v => b.anchoredPosition = off * v);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ConvergeRevealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;
    [SerializeField] Vector2[] offsets;
    [SerializeField] RectTransform target;

    void OnEnable() => Play();

    public void Play()
    {
        target.localScale = Vector3.zero;
        var seq = DOTween.Sequence();
        for (int i = 0; i < bands.Length; i++)
        {
            bands[i].anchoredPosition = offsets[i];
            seq.Join(bands[i].DOAnchorPos(Vector2.zero, 0.4f).SetEase(Ease.InCubic));
        }
        seq.Append(target.DOScale(1f, 0.35f).SetEase(Ease.OutBack));
        for (int i = 0; i < bands.Length; i++)
            seq.Join(bands[i].DOAnchorPos(offsets[i], 0.3f).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ConvergeRevealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;
    [SerializeField] Vector2[] offsets;
    [SerializeField] RectTransform target;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        target.localScale = Vector3.zero;
        yield return Move(1f, 0f, 0.4f, false);        // 収束 (InCubic)
        StartCoroutine(Reveal());
        yield return Move(0f, 1f, 0.3f, true);         // 帯を外へ抜く (OutQuad)
    }

    IEnumerator Move(float from, float to, float dur, bool outQuad)
    {
        float t = 0f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / dur);
            float e = outQuad ? 1f - (1f - p) * (1f - p) : p * p * p;
            float v = Mathf.Lerp(from, to, e);
            for (int i = 0; i < bands.Length; i++) bands[i].anchoredPosition = offsets[i] * v;
            yield return null;
        }
    }

    IEnumerator Reveal()
    {
        float t = 0f;
        while (t < 0.35f)
        {
            t += Time.deltaTime;
            target.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.35f));
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 帯は translate を transition で中央(0)へ。対象は scale で出現 */
.converge-band { position: absolute; transition: translate 400ms ease-in; }
.converge-band.exit { transition: translate 300ms ease-out; }
#Target { scale: 0; transition: scale 350ms ease-out-back; }
#Target.shown { scale: 1; }

/* ===== C# (.cs) — 収束→出現→帯退場を段階制御 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ConvergeRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2[] offsets;   // 各帯の外側オフセット(px)

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var bands = root.Query<VisualElement>(className: "converge-band").ToList();
        var target = root.Q<VisualElement>("Target");
        for (int i = 0; i < bands.Count; i++)
            bands[i].style.translate = new Translate(0, 0);   // 中央へ収束
        target.schedule.Execute(() => target.AddToClassList("shown")).ExecuteLater(400);
        // 帯を外へ抜く
        for (int i = 0; i < bands.Count; i++)
        {
            var b = bands[i];
            var off = i < offsets.Length ? offsets[i] : Vector2.zero;
            b.schedule.Execute(() =>
            {
                b.AddToClassList("exit");
                b.style.translate = new Translate(off.x, off.y);
            }).ExecuteLater(400);
        }
    }
}`,
    },
  });
})();
