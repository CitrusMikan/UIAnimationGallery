/* 06-loading.js — ローディング・進捗系 (5種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. スピナー */
  R({
    id: 'spinner',
    title: 'スピナー',
    titleEn: 'Loading Spinner',
    category: 'loading',
    tags: ['loading', 'rotate', '待機', '通信中'],
    description: '欠けたリングを等速回転させる待機表示の大定番。uGUIでは円弧スプライトのImageをZ回転させるだけ。Linear必須。',
    spec: {
      target: '円弧Image の Transform.localEulerAngles.z',
      from: 0, to: -360,
      duration: 1.0,
      ease: 'Linear',
      loops: -1,
    },
    preview(ctx, PV) {
      const sp = PV.el(null, {
        width: '54px', height: '54px', borderRadius: '50%',
        border: '4px solid var(--pv-line)', borderTopColor: 'var(--pv-accent)',
      });
      ctx.stage.appendChild(sp);
      const label = PV.el('mono', { position: 'absolute', bottom: '16px', fontSize: '9px', letterSpacing: '0.22em', color: 'var(--pv-dim)' }, 'NOW LOADING');
      ctx.stage.appendChild(label);
      ctx.tween({
        from: 0, to: 360, duration: 1.0, ease: 'Linear', loops: -1,
        onUpdate: v => sp.style.transform = `rotate(${v}deg)`,
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

/// <summary>円弧スプライトのImageにアタッチして回転させる</summary>
public class SpinnerLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 1f;

    MotionHandle handle;

    void OnEnable()
    {
        handle = LMotion.Create(0f, -360f, duration)
            .WithEase(Ease.Linear)
            .WithLoops(-1, LoopType.Restart)
            .Bind(z => transform.localEulerAngles = new Vector3(0f, 0f, z));
    }

    void OnDisable()
    {
        if (handle.IsActive()) handle.Cancel();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SpinnerDOTween : MonoBehaviour
{
    [SerializeField] float duration = 1f;

    Tween tween;

    void OnEnable()
    {
        tween = transform.DOLocalRotate(new Vector3(0f, 0f, -360f), duration, RotateMode.FastBeyond360)
            .SetEase(Ease.Linear)
            .SetLoops(-1, LoopType.Restart);
    }

    void OnDisable() => tween?.Kill();
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SpinnerCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 1f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() => StopAllCoroutines();

    IEnumerator Animate()
    {
        float z = 0f;
        while (true)
        {
            z -= 360f * Time.deltaTime / duration;
            transform.localEulerAngles = new Vector3(0f, 0f, z);
            yield return null;
        }
    }
}`,
    },
  });

  /* 2. ドット3連 */
  R({
    id: 'dots-loading',
    title: 'ドット3連ローディング',
    titleEn: 'Three Dots Loading',
    category: 'loading',
    tags: ['loading', 'stagger', 'dots', '待機'],
    description: '3つのドットが時間差で跳ねる/明滅する。スピナーより柔らかい印象。各ドットに0.15sずつ遅延を付けた同じループを再生するだけ。',
    spec: {
      target: '各ドットの localScale (または alpha)',
      from: 0.5, to: 1.0,
      duration: 0.4,
      ease: 'InOutSine',
      loops: -1, loopType: 'Yoyo',
      stagger: 0.15,
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', gap: '12px' });
      ctx.stage.appendChild(wrap);
      for (let i = 0; i < 3; i++) {
        const d = PV.el(null, {
          width: '14px', height: '14px', background: 'var(--pv-accent)',
          clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
        });
        wrap.appendChild(d);
        ctx.tween({
          from: 0.5, to: 1, duration: 0.4, ease: 'InOutSine',
          loops: -1, loopType: 'Yoyo', delay: i * 0.15,
          onUpdate: v => { d.style.transform = `scale(${v})`; d.style.opacity = v; },
        });
      }
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class DotsLoadingLitMotion : MonoBehaviour
{
    [SerializeField] Transform[] dots;      // 3つのドット
    [SerializeField] float stagger = 0.15f;

    MotionHandle[] handles;

    void OnEnable()
    {
        handles = new MotionHandle[dots.Length];
        for (int i = 0; i < dots.Length; i++)
        {
            handles[i] = LMotion.Create(Vector3.one * 0.5f, Vector3.one, 0.4f)
                .WithEase(Ease.InOutSine)
                .WithDelay(i * stagger)
                .WithLoops(-1, LoopType.Yoyo)
                .BindToLocalScale(dots[i]);
        }
    }

    void OnDisable()
    {
        if (handles == null) return;
        for (int i = 0; i < handles.Length; i++)
            if (handles[i].IsActive()) handles[i].Cancel();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DotsLoadingDOTween : MonoBehaviour
{
    [SerializeField] Transform[] dots;
    [SerializeField] float stagger = 0.15f;

    Tween[] tweens;

    void OnEnable()
    {
        tweens = new Tween[dots.Length];
        for (int i = 0; i < dots.Length; i++)
        {
            dots[i].localScale = Vector3.one * 0.5f;
            tweens[i] = dots[i].DOScale(Vector3.one, 0.4f)
                .SetEase(Ease.InOutSine)
                .SetDelay(i * stagger)
                .SetLoops(-1, LoopType.Yoyo);
        }
    }

    void OnDisable()
    {
        if (tweens == null) return;
        foreach (var t in tweens) t?.Kill();
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DotsLoadingCoroutine : MonoBehaviour
{
    [SerializeField] Transform[] dots;
    [SerializeField] float stagger = 0.15f;
    [SerializeField] float duration = 0.4f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() => StopAllCoroutines();

    IEnumerator Animate()
    {
        float time = 0f;
        while (true)
        {
            time += Time.deltaTime;
            for (int i = 0; i < dots.Length; i++)
            {
                // sin波の位相をずらして0.5〜1.0を往復
                float phase = (time - i * stagger) / duration * Mathf.PI;
                float wave = (Mathf.Sin(phase - Mathf.PI / 2f) + 1f) * 0.5f;
                dots[i].localScale = Vector3.one * Mathf.Lerp(0.5f, 1f, wave);
            }
            yield return null;
        }
    }
}`,
    },
  });

  /* 3. プログレスバー */
  R({
    id: 'progress-bar',
    title: 'プログレスバー',
    titleEn: 'Progress Bar',
    category: 'loading',
    tags: ['progress', 'fillAmount', 'HPバー', '経験値'],
    description: '値が変わるたびにfillAmountを目標値へ滑らかに追従させる。実際の進捗・HP・経験値バーに。即時反映ではなくトゥイーンで追いかけるのがコツ。',
    spec: {
      target: 'Image.fillAmount (Filled/Horizontal)',
      to: '新しい進捗値 (0〜1)',
      duration: 0.4,
      ease: 'OutCubic',
      text: '百分率テキストも同時にトゥイーン',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { width: '190px' });
      ctx.stage.appendChild(wrap);
      const head = PV.el('mono', { display: 'flex', justifyContent: 'space-between', fontSize: '9px', letterSpacing: '0.18em', color: 'var(--pv-dim)', marginBottom: '6px' });
      head.appendChild(PV.el(null, null, 'DOWNLOAD', 'span'));
      const pct = PV.el(null, { color: 'var(--pv-accent)' }, '0%', 'span');
      head.appendChild(pct);
      wrap.appendChild(head);
      const track = PV.el(null, {
        height: '10px', background: 'var(--pv-panel2)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
        position: 'relative', overflow: 'hidden',
      });
      const fill = PV.el(null, { position: 'absolute', inset: '0', background: 'var(--pv-accent)', transformOrigin: 'left center', transform: 'scaleX(0)' });
      track.appendChild(fill);
      wrap.appendChild(track);
      let cur = 0;
      ctx.forever(async () => {
        if (cur >= 1) { await ctx.wait(0.9); cur = 0; fill.style.transform = 'scaleX(0)'; pct.textContent = '0%'; await ctx.wait(0.4); }
        const target = Math.min(cur + 0.15 + Math.random() * 0.3, 1);
        const from = cur;
        await ctx.tween({
          duration: 0.4, ease: 'OutCubic',
          onUpdate: v => {
            cur = from + (target - from) * v;
            fill.style.transform = `scaleX(${cur})`;
            pct.textContent = Math.round(cur * 100) + '%';
          },
        });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ProgressBarLitMotion : MonoBehaviour
{
    [SerializeField] Image fillImage;      // Image Type = Filled / Horizontal
    [SerializeField] TMP_Text percentLabel; // 任意
    [SerializeField] float duration = 0.4f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    /// <summary>進捗(0〜1)を滑らかに反映する</summary>
    public void SetProgress(float target)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(fillImage.fillAmount, Mathf.Clamp01(target), duration)
            .WithEase(Ease.OutCubic)
            .Bind(v =>
            {
                fillImage.fillAmount = v;
                if (percentLabel != null)
                    percentLabel.text = Mathf.RoundToInt(v * 100f) + "%";
            });
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ProgressBarDOTween : MonoBehaviour
{
    [SerializeField] Image fillImage;
    [SerializeField] TMP_Text percentLabel;
    [SerializeField] float duration = 0.4f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void SetProgress(float target)
    {
        tween?.Kill();
        tween = fillImage.DOFillAmount(Mathf.Clamp01(target), duration)
            .SetEase(Ease.OutCubic)
            .OnUpdate(() =>
            {
                if (percentLabel != null)
                    percentLabel.text = Mathf.RoundToInt(fillImage.fillAmount * 100f) + "%";
            });
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ProgressBarCoroutine : MonoBehaviour
{
    [SerializeField] Image fillImage;
    [SerializeField] TMP_Text percentLabel;
    [SerializeField] float duration = 0.4f;

    public void SetProgress(float target)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(Mathf.Clamp01(target)));
    }

    IEnumerator Animate(float target)
    {
        float from = fillImage.fillAmount;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float u = 1f - p;
            float v = Mathf.Lerp(from, target, 1f - u * u * u); // OutCubic
            fillImage.fillAmount = v;
            if (percentLabel != null)
                percentLabel.text = Mathf.RoundToInt(v * 100f) + "%";
            yield return null;
        }
    }
}`,
    },
  });

  /* 4. 円形プログレス */
  R({
    id: 'circular-progress',
    title: '円形プログレス',
    titleEn: 'Circular Progress',
    category: 'loading',
    tags: ['progress', 'radial', 'CT', 'クールタイム'],
    description: 'リングが時計回りに満ちていく。スキルのクールタイム・チャージ・タイマーに。uGUIではImageのFilled/Radial360を使えばfillAmountだけで済む。',
    spec: {
      target: 'Image.fillAmount (Filled/Radial360)',
      from: 0, to: 1,
      duration: 1.5,
      ease: 'Linear (クールタイムは等速が正しい)',
      center_text: '残り秒数 or 百分率をBindで同時更新',
    },
    preview(ctx, PV) {
      const size = 74;
      const wrap = PV.el(null, { position: 'relative', width: size + 'px', height: size + 'px' });
      ctx.stage.appendChild(wrap);
      const ring = PV.el(null, { position: 'absolute', inset: '0', borderRadius: '50%', background: 'conic-gradient(var(--pv-accent) 0deg, var(--pv-line) 0deg)' });
      wrap.appendChild(ring);
      const hole = PV.el('mono', {
        position: 'absolute', inset: '8px', borderRadius: '50%', background: 'var(--pv-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: 'var(--pv-accent)',
      }, '0%');
      wrap.appendChild(hole);
      ctx.forever(async () => {
        await ctx.tween({
          duration: 1.5, ease: 'Linear',
          onUpdate: v => {
            ring.style.background = `conic-gradient(var(--pv-accent) ${v * 360}deg, var(--pv-line) ${v * 360}deg)`;
            hole.textContent = Math.round(v * 100) + '%';
          },
        });
        await ctx.wait(0.9);
        hole.textContent = '0%';
        ring.style.background = 'conic-gradient(var(--pv-accent) 0deg, var(--pv-line) 0deg)';
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class CircularProgressLitMotion : MonoBehaviour
{
    [SerializeField] Image ringImage;     // Filled / Radial360 / Clockwise
    [SerializeField] TMP_Text centerLabel;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    /// <summary>クールタイムを開始する</summary>
    public void StartCooldown(float seconds)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(0f, 1f, seconds)
            .WithEase(Ease.Linear)
            .Bind(v =>
            {
                ringImage.fillAmount = v;
                if (centerLabel != null)
                    centerLabel.text = Mathf.CeilToInt(seconds * (1f - v)).ToString();
            });
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class CircularProgressDOTween : MonoBehaviour
{
    [SerializeField] Image ringImage;     // Filled / Radial360 / Clockwise
    [SerializeField] TMP_Text centerLabel;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void StartCooldown(float seconds)
    {
        tween?.Kill();
        ringImage.fillAmount = 0f;
        tween = ringImage.DOFillAmount(1f, seconds)
            .SetEase(Ease.Linear)
            .OnUpdate(() =>
            {
                if (centerLabel != null)
                    centerLabel.text = Mathf.CeilToInt(seconds * (1f - ringImage.fillAmount)).ToString();
            });
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class CircularProgressCoroutine : MonoBehaviour
{
    [SerializeField] Image ringImage;     // Filled / Radial360 / Clockwise
    [SerializeField] TMP_Text centerLabel;

    public void StartCooldown(float seconds)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(seconds));
    }

    IEnumerator Animate(float seconds)
    {
        float t = 0f;
        while (t < seconds)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / seconds);
            ringImage.fillAmount = p;
            if (centerLabel != null)
                centerLabel.text = Mathf.CeilToInt(seconds - t).ToString();
            yield return null;
        }
        ringImage.fillAmount = 1f;
    }
}`,
    },
  });

  /* 5. スケルトンスクリーン */
  R({
    id: 'skeleton',
    title: 'スケルトンスクリーン',
    titleEn: 'Skeleton Screen',
    category: 'loading',
    tags: ['loading', 'placeholder', 'shimmer', '読み込み'],
    description: 'コンテンツの形をしたプレースホルダーをゆっくり明滅させる。「何がどこに出るか」を先に見せることで体感待ち時間を減らす。alpha往復ループが最も簡単。',
    spec: {
      target: 'プレースホルダー群の CanvasGroup.alpha',
      from: 0.35, to: 0.7,
      duration: 0.8,
      ease: 'InOutSine',
      loops: -1, loopType: 'Yoyo',
      note: '読み込み完了時にキャンセルして本コンテンツにクロスフェード',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', gap: '10px', width: '190px' });
      ctx.stage.appendChild(wrap);
      const avatar = PV.el(null, { width: '44px', height: '44px', background: 'var(--pv-panel2)', flex: 'none', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' });
      wrap.appendChild(avatar);
      const lines = PV.el(null, { flex: '1', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '2px' });
      const l1 = PV.el(null, { height: '10px', background: 'var(--pv-panel2)', width: '100%' });
      const l2 = PV.el(null, { height: '10px', background: 'var(--pv-panel2)', width: '70%' });
      const l3 = PV.el(null, { height: '10px', background: 'var(--pv-panel2)', width: '45%' });
      [l1, l2, l3].forEach(l => lines.appendChild(l));
      wrap.appendChild(lines);
      ctx.tween({
        from: 0.35, to: 0.75, duration: 0.8, ease: 'InOutSine',
        loops: -1, loopType: 'Yoyo',
        onUpdate: v => wrap.style.opacity = v,
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SkeletonLitMotion : MonoBehaviour
{
    [SerializeField] float minAlpha = 0.35f;
    [SerializeField] float maxAlpha = 0.7f;
    [SerializeField] float duration = 0.8f;

    CanvasGroup group;
    MotionHandle handle;

    void Awake() => group = GetComponent<CanvasGroup>();

    void OnEnable()
    {
        handle = LMotion.Create(minAlpha, maxAlpha, duration)
            .WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Yoyo)
            .BindToAlpha(group);
    }

    void OnDisable()
    {
        if (handle.IsActive()) handle.Cancel();
    }

    /// <summary>読み込み完了: スケルトンをフェードアウトして消す</summary>
    public void Complete()
    {
        if (handle.IsActive()) handle.Cancel();
        LMotion.Create(group.alpha, 0f, 0.25f)
            .WithOnComplete(() => gameObject.SetActive(false))
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SkeletonDOTween : MonoBehaviour
{
    [SerializeField] float minAlpha = 0.35f;
    [SerializeField] float maxAlpha = 0.7f;
    [SerializeField] float duration = 0.8f;

    CanvasGroup group;
    Tween tween;

    void Awake() => group = GetComponent<CanvasGroup>();

    void OnEnable()
    {
        group.alpha = minAlpha;
        tween = group.DOFade(maxAlpha, duration)
            .SetEase(Ease.InOutSine)
            .SetLoops(-1, LoopType.Yoyo);
    }

    void OnDisable() => tween?.Kill();

    public void Complete()
    {
        tween?.Kill();
        tween = group.DOFade(0f, 0.25f)
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class SkeletonCoroutine : MonoBehaviour
{
    [SerializeField] float minAlpha = 0.35f;
    [SerializeField] float maxAlpha = 0.7f;
    [SerializeField] float duration = 0.8f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() => StopAllCoroutines();

    IEnumerator Animate()
    {
        float time = 0f;
        while (true)
        {
            time += Time.deltaTime;
            float wave = (Mathf.Sin(time / duration * Mathf.PI - Mathf.PI / 2f) + 1f) * 0.5f;
            group.alpha = Mathf.Lerp(minAlpha, maxAlpha, wave);
            yield return null;
        }
    }

    public void Complete()
    {
        StopAllCoroutines();
        StartCoroutine(FadeOut());
    }

    IEnumerator FadeOut()
    {
        float from = group.alpha;
        float t = 0f;
        while (t < 0.25f)
        {
            t += Time.deltaTime;
            group.alpha = Mathf.Lerp(from, 0f, Mathf.Clamp01(t / 0.25f));
            yield return null;
        }
        gameObject.SetActive(false);
    }
}`,
    },
  });
})();
