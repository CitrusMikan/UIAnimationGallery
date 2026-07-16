/* 01-entrance.js — 出現・退場系 (10種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. フェードイン */
  R({
    id: 'fade-in',
    title: 'フェードイン',
    titleEn: 'Fade In',
    category: 'entrance',
    tags: ['fade', 'alpha', 'CanvasGroup', '登場'],
    description: 'CanvasGroupのalphaを0→1にして表示する最も基本的な登場アニメーション。パネル・ウィンドウ・画面全体など、あらゆるUIの表示に使える。',
    spec: {
      target: 'CanvasGroup.alpha',
      from: 0, to: 1,
      duration: 0.3,
      ease: 'OutQuad',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'PANEL', w: 110, h: 80 });
      ctx.forever(async () => {
        box.style.opacity = 0;
        await ctx.wait(0.3);
        await ctx.tween({ duration: 0.3, ease: 'OutQuad', onUpdate: v => box.style.opacity = v });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;

    CanvasGroup group;
    MotionHandle handle;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(0f, 1f, duration)
            .WithEase(Ease.OutQuad)
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;

    CanvasGroup group;
    Tween tween;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        group.alpha = 0f;
        tween = group.DOFade(1f, duration).SetEase(Ease.OutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutQuad(Mathf.Clamp01(t / duration));
            group.alpha = e;
            yield return null;
        }
        group.alpha = 1f;
    }

    static float OutQuad(float t) => 1f - (1f - t) * (1f - t);
}`,
    },
  });

  /* 2. フェードアウト */
  R({
    id: 'fade-out',
    title: 'フェードアウト',
    titleEn: 'Fade Out',
    category: 'entrance',
    tags: ['fade', 'alpha', 'CanvasGroup', '退場'],
    description: 'CanvasGroupのalphaを1→0にして非表示にする。完了時にSetActive(false)やDestroyを呼ぶのが定番。閉じる操作は開く操作より少し速くするのがコツ。',
    spec: {
      target: 'CanvasGroup.alpha',
      from: 1, to: 0,
      duration: 0.25,
      ease: 'InQuad',
      on_complete: 'gameObject.SetActive(false)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'PANEL', w: 110, h: 80 });
      ctx.forever(async () => {
        box.style.opacity = 1;
        await ctx.wait(0.9);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: v => box.style.opacity = v });
        await ctx.wait(0.8);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeOutLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    CanvasGroup group;
    MotionHandle handle;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(group.alpha, 0f, duration)
            .WithEase(Ease.InQuad)
            .WithOnComplete(() => gameObject.SetActive(false))
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeOutDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    CanvasGroup group;
    Tween tween;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        tween = group.DOFade(0f, duration)
            .SetEase(Ease.InQuad)
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FadeOutCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float start = group.alpha;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = InQuad(Mathf.Clamp01(t / duration));
            group.alpha = Mathf.LerpUnclamped(start, 0f, e);
            yield return null;
        }
        group.alpha = 0f;
        gameObject.SetActive(false);
    }

    static float InQuad(float t) => t * t;
}`,
    },
  });

  /* 3. スケールイン (ポップ) */
  R({
    id: 'scale-in',
    title: 'スケールイン（ポップ）',
    titleEn: 'Scale In / Pop',
    category: 'entrance',
    tags: ['scale', 'OutBack', 'ポップ', '登場'],
    description: 'scaleを0→1、OutBackで少しオーバーシュートさせて「ポンッ」と出す。報酬獲得・ダイアログ・アイコン出現などゲームUIの登場演出の大定番。',
    spec: {
      target: 'Transform.localScale',
      from: 0, to: 1,
      duration: 0.35,
      ease: 'OutBack',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'ITEM' });
      const s = { s: 0 };
      ctx.forever(async () => {
        s.s = 0; PV.applyT(box, s);
        await ctx.wait(0.3);
        await ctx.tween({ duration: 0.35, ease: 'OutBack', onUpdate: v => { s.s = v; PV.applyT(box, s); } });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ScaleInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(Vector3.zero, Vector3.one, duration)
            .WithEase(Ease.OutBack)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ScaleInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;

    Tween tween;

    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localScale = Vector3.zero;
        tween = transform.DOScale(Vector3.one, duration).SetEase(Ease.OutBack);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ScaleInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / duration));
            transform.localScale = Vector3.one * e;
            yield return null;
        }
        transform.localScale = Vector3.one;
    }

    // DOTween/LitMotion の Ease.OutBack と同じ式 (overshoot 1.70158)
    static float OutBack(float t)
    {
        const float c1 = 1.70158f;
        const float c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
    },
  });

  /* 4. スケールアウト */
  R({
    id: 'scale-out',
    title: 'スケールアウト',
    titleEn: 'Scale Out',
    category: 'entrance',
    tags: ['scale', 'InBack', '退場'],
    description: 'scaleを1→0、InBackで一度わずかに膨らんでから「シュッ」と縮んで消える。スケールインと対で使うと開閉に統一感が出る。',
    spec: {
      target: 'Transform.localScale',
      from: 1, to: 0,
      duration: 0.25,
      ease: 'InBack',
      on_complete: 'gameObject.SetActive(false)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'ITEM' });
      const s = { s: 1 };
      ctx.forever(async () => {
        s.s = 1; PV.applyT(box, s); box.style.opacity = 1;
        await ctx.wait(0.9);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InBack', onUpdate: v => { s.s = Math.max(v, 0); PV.applyT(box, s); } });
        await ctx.wait(0.8);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ScaleOutLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(Vector3.one, Vector3.zero, duration)
            .WithEase(Ease.InBack)
            .WithOnComplete(() => gameObject.SetActive(false))
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ScaleOutDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        tween = transform.DOScale(Vector3.zero, duration)
            .SetEase(Ease.InBack)
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ScaleOutCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.25f;

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = InBack(Mathf.Clamp01(t / duration));
            transform.localScale = Vector3.one * (1f - e);
            yield return null;
        }
        transform.localScale = Vector3.zero;
        gameObject.SetActive(false);
    }

    static float InBack(float t)
    {
        const float c1 = 1.70158f;
        const float c3 = c1 + 1f;
        return c3 * t * t * t - c1 * t * t;
    }
}`,
    },
  });

  /* 5. スライドイン */
  R({
    id: 'slide-in',
    title: 'スライドイン',
    titleEn: 'Slide In',
    category: 'entrance',
    tags: ['slide', 'anchoredPosition', '登場', 'メニュー'],
    description: '画面外からRectTransformのanchoredPositionを動かして滑り込ませる。サイドメニュー・通知・ページ要素の登場に。フェードと組み合わせると上品になる。',
    spec: {
      target: 'RectTransform.anchoredPosition.x',
      from: -200, to: 0,
      duration: 0.4,
      ease: 'OutCubic',
      note: '方向はfromの符号/軸で変える(左から: -X, 下から: -Y)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'MENU', w: 120, h: 72 });
      const s = { x: -180 };
      ctx.forever(async () => {
        s.x = -180; PV.applyT(box, s); box.style.opacity = 0;
        await ctx.wait(0.3);
        await ctx.tween({
          from: -180, to: 0, duration: 0.4, ease: 'OutCubic',
          onUpdate: (v, t) => { s.x = v; PV.applyT(box, s); box.style.opacity = Math.min(t * 2.5, 1); },
        });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class SlideInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;
    [SerializeField] Vector2 offset = new Vector2(-200f, 0f); // 開始位置のずらし量

    RectTransform rect;
    Vector2 shownPos;
    MotionHandle handle;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition; // 表示位置を記憶
    }

    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(shownPos + offset, shownPos, duration)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPosition(rect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SlideInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;
    [SerializeField] Vector2 offset = new Vector2(-200f, 0f);

    RectTransform rect;
    Vector2 shownPos;
    Tween tween;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition;
    }

    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        rect.anchoredPosition = shownPos + offset;
        tween = rect.DOAnchorPos(shownPos, duration).SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SlideInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;
    [SerializeField] Vector2 offset = new Vector2(-200f, 0f);

    RectTransform rect;
    Vector2 shownPos;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition;
    }

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutCubic(Mathf.Clamp01(t / duration));
            rect.anchoredPosition = Vector2.LerpUnclamped(shownPos + offset, shownPos, e);
            yield return null;
        }
        rect.anchoredPosition = shownPos;
    }

    static float OutCubic(float t) { float u = 1f - t; return 1f - u * u * u; }
}`,
    },
  });

  /* 6. スライドアウト */
  R({
    id: 'slide-out',
    title: 'スライドアウト',
    titleEn: 'Slide Out',
    category: 'entrance',
    tags: ['slide', 'anchoredPosition', '退場'],
    description: 'anchoredPositionを動かして画面外へ滑り出す。InCubicで加速しながら消えると自然。スライドインと逆方向に出すか、同方向に通過させるかで印象が変わる。',
    spec: {
      target: 'RectTransform.anchoredPosition.x',
      from: 0, to: 200,
      duration: 0.3,
      ease: 'InCubic',
      on_complete: 'gameObject.SetActive(false)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'MENU', w: 120, h: 72 });
      const s = { x: 0 };
      ctx.forever(async () => {
        s.x = 0; PV.applyT(box, s); box.style.opacity = 1;
        await ctx.wait(0.9);
        await ctx.tween({
          from: 0, to: 200, duration: 0.3, ease: 'InCubic',
          onUpdate: (v, t) => { s.x = v; PV.applyT(box, s); box.style.opacity = 1 - t * t; },
        });
        await ctx.wait(0.8);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class SlideOutLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;
    [SerializeField] Vector2 offset = new Vector2(200f, 0f); // 退場方向

    RectTransform rect;
    Vector2 shownPos;
    MotionHandle handle;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition;
    }

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(shownPos, shownPos + offset, duration)
            .WithEase(Ease.InCubic)
            .WithOnComplete(() => gameObject.SetActive(false))
            .BindToAnchoredPosition(rect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SlideOutDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;
    [SerializeField] Vector2 offset = new Vector2(200f, 0f);

    RectTransform rect;
    Vector2 shownPos;
    Tween tween;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition;
    }

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        tween = rect.DOAnchorPos(shownPos + offset, duration)
            .SetEase(Ease.InCubic)
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SlideOutCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.3f;
    [SerializeField] Vector2 offset = new Vector2(200f, 0f);

    RectTransform rect;
    Vector2 shownPos;

    void Awake()
    {
        rect = (RectTransform)transform;
        shownPos = rect.anchoredPosition;
    }

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = InCubic(Mathf.Clamp01(t / duration));
            rect.anchoredPosition = Vector2.LerpUnclamped(shownPos, shownPos + offset, e);
            yield return null;
        }
        gameObject.SetActive(false);
        rect.anchoredPosition = shownPos; // 次回表示に備えて戻す
    }

    static float InCubic(float t) => t * t * t;
}`,
    },
  });

  /* 7. ズームフェードイン */
  R({
    id: 'zoom-fade-in',
    title: 'ズームフェードイン',
    titleEn: 'Zoom Fade In',
    category: 'entrance',
    tags: ['scale', 'fade', '同時再生', '上品'],
    description: 'scale 1.1→1 とalpha 0→1 を同時に再生する。縮みながら現れるためオーバーシュート無しでも柔らかく上品。設定画面やモダンなダイアログ向き。',
    spec: {
      target: ['Transform.localScale', 'CanvasGroup.alpha'],
      scale: { from: 1.1, to: 1.0 },
      alpha: { from: 0, to: 1 },
      duration: 0.35,
      ease: 'OutCubic',
      note: '2本のトゥイーンを同時に再生する',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'DIALOG', w: 130, h: 84 });
      const s = { s: 1.1 };
      ctx.forever(async () => {
        s.s = 1.1; PV.applyT(box, s); box.style.opacity = 0;
        await ctx.wait(0.3);
        await ctx.tween({
          duration: 0.35, ease: 'OutCubic',
          onUpdate: v => { s.s = 1.1 + (1 - 1.1) * v; PV.applyT(box, s); box.style.opacity = v; },
        });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ZoomFadeInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;
    [SerializeField] float fromScale = 1.1f;

    CanvasGroup group;
    MotionHandle scaleHandle, fadeHandle;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();
    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (scaleHandle.IsActive()) scaleHandle.Cancel();
        if (fadeHandle.IsActive()) fadeHandle.Cancel();
    }

    public void Play()
    {
        Cancel();
        scaleHandle = LMotion.Create(Vector3.one * fromScale, Vector3.one, duration)
            .WithEase(Ease.OutCubic)
            .BindToLocalScale(transform);
        fadeHandle = LMotion.Create(0f, 1f, duration)
            .WithEase(Ease.OutCubic)
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ZoomFadeInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;
    [SerializeField] float fromScale = 1.1f;

    CanvasGroup group;
    Sequence seq;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        transform.localScale = Vector3.one * fromScale;
        group.alpha = 0f;
        seq = DOTween.Sequence()
            .Join(transform.DOScale(Vector3.one, duration).SetEase(Ease.OutCubic))
            .Join(group.DOFade(1f, duration).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ZoomFadeInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.35f;
    [SerializeField] float fromScale = 1.1f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutCubic(Mathf.Clamp01(t / duration));
            transform.localScale = Vector3.one * Mathf.LerpUnclamped(fromScale, 1f, e);
            group.alpha = e;
            yield return null;
        }
        transform.localScale = Vector3.one;
        group.alpha = 1f;
    }

    static float OutCubic(float t) { float u = 1f - t; return 1f - u * u * u; }
}`,
    },
  });

  /* 8. フリップイン */
  R({
    id: 'flip-in',
    title: 'フリップイン',
    titleEn: 'Flip In',
    category: 'entrance',
    tags: ['rotation', '3D', 'カード', 'めくり'],
    description: 'Y軸回転90°→0°でカードがめくれるように登場する。ガチャ結果・カード提示・実績解除など「めくる」メタファーに最適。',
    spec: {
      target: 'Transform.localEulerAngles.y',
      from: 90, to: 0,
      duration: 0.45,
      ease: 'OutCubic',
      note: '親CanvasのRenderModeに関わらずRectTransformの回転で動作',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'CARD', w: 80, h: 104 });
      const s = { rotY: 90 };
      ctx.forever(async () => {
        s.rotY = 90; PV.applyT(box, s); box.style.opacity = 0.4;
        await ctx.wait(0.3);
        await ctx.tween({
          from: 90, to: 0, duration: 0.45, ease: 'OutCubic',
          onUpdate: (v, t) => { s.rotY = v; PV.applyT(box, s); box.style.opacity = 0.4 + 0.6 * t; },
        });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class FlipInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.45f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(new Vector3(0f, 90f, 0f), Vector3.zero, duration)
            .WithEase(Ease.OutCubic)
            .BindToLocalEulerAngles(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class FlipInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.45f;

    Tween tween;

    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localEulerAngles = new Vector3(0f, 90f, 0f);
        tween = transform.DOLocalRotate(Vector3.zero, duration)
            .SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class FlipInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.45f;

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutCubic(Mathf.Clamp01(t / duration));
            float y = Mathf.LerpUnclamped(90f, 0f, e);
            transform.localEulerAngles = new Vector3(0f, y, 0f);
            yield return null;
        }
        transform.localEulerAngles = Vector3.zero;
    }

    static float OutCubic(float t) { float u = 1f - t; return 1f - u * u * u; }
}`,
    },
  });

  /* 9. ローテートイン */
  R({
    id: 'rotate-in',
    title: 'ローテートイン',
    titleEn: 'Rotate In',
    category: 'entrance',
    tags: ['rotation', 'scale', '登場', 'バッジ'],
    description: 'Z回転-90°→0°とscale 0.5→1を同時に再生し、回り込みながら登場する。バッジ・スタンプ・勲章など円形要素の出現に映える。',
    spec: {
      target: ['Transform.localEulerAngles.z', 'Transform.localScale'],
      rotation: { from: -90, to: 0 },
      scale: { from: 0.5, to: 1.0 },
      duration: 0.4,
      ease: 'OutCubic',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'BADGE', w: 84, h: 84 });
      const s = { rot: -90, s: 0.5 };
      ctx.forever(async () => {
        s.rot = -90; s.s = 0.5; PV.applyT(box, s); box.style.opacity = 0;
        await ctx.wait(0.3);
        await ctx.tween({
          duration: 0.4, ease: 'OutCubic',
          onUpdate: v => {
            s.rot = -90 + 90 * v;
            s.s = 0.5 + 0.5 * v;
            PV.applyT(box, s);
            box.style.opacity = Math.min(v * 2, 1);
          },
        });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class RotateInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;

    MotionHandle rotHandle, scaleHandle;

    void OnEnable() => Play();
    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (rotHandle.IsActive()) rotHandle.Cancel();
        if (scaleHandle.IsActive()) scaleHandle.Cancel();
    }

    public void Play()
    {
        Cancel();
        rotHandle = LMotion.Create(new Vector3(0f, 0f, -90f), Vector3.zero, duration)
            .WithEase(Ease.OutCubic)
            .BindToLocalEulerAngles(transform);
        scaleHandle = LMotion.Create(Vector3.one * 0.5f, Vector3.one, duration)
            .WithEase(Ease.OutCubic)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class RotateInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;

    Sequence seq;

    void OnEnable() => Play();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        transform.localEulerAngles = new Vector3(0f, 0f, -90f);
        transform.localScale = Vector3.one * 0.5f;
        seq = DOTween.Sequence()
            .Join(transform.DOLocalRotate(Vector3.zero, duration).SetEase(Ease.OutCubic))
            .Join(transform.DOScale(Vector3.one, duration).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class RotateInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.4f;

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutCubic(Mathf.Clamp01(t / duration));
            transform.localEulerAngles = new Vector3(0f, 0f, Mathf.LerpUnclamped(-90f, 0f, e));
            transform.localScale = Vector3.one * Mathf.LerpUnclamped(0.5f, 1f, e);
            yield return null;
        }
        transform.localEulerAngles = Vector3.zero;
        transform.localScale = Vector3.one;
    }

    static float OutCubic(float t) { float u = 1f - t; return 1f - u * u * u; }
}`,
    },
  });

  /* 10. バウンスイン */
  R({
    id: 'bounce-in',
    title: 'バウンスイン',
    titleEn: 'Bounce In',
    category: 'entrance',
    tags: ['scale', 'OutBounce', '弾む', '登場'],
    description: 'scale 0→1をOutBounceで再生し、ボールが弾むように登場する。コミカルで元気な印象。カジュアルゲームの報酬・スコア表示に。',
    spec: {
      target: 'Transform.localScale',
      from: 0, to: 1,
      duration: 0.6,
      ease: 'OutBounce',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'BONUS' });
      const s = { s: 0 };
      ctx.forever(async () => {
        s.s = 0; PV.applyT(box, s);
        await ctx.wait(0.3);
        await ctx.tween({ duration: 0.6, ease: 'OutBounce', onUpdate: v => { s.s = v; PV.applyT(box, s); } });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class BounceInLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 0.6f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(Vector3.zero, Vector3.one, duration)
            .WithEase(Ease.OutBounce)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class BounceInDOTween : MonoBehaviour
{
    [SerializeField] float duration = 0.6f;

    Tween tween;

    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localScale = Vector3.zero;
        tween = transform.DOScale(Vector3.one, duration).SetEase(Ease.OutBounce);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class BounceInCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 0.6f;

    void OnEnable() => Play();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutBounce(Mathf.Clamp01(t / duration));
            transform.localScale = Vector3.one * e;
            yield return null;
        }
        transform.localScale = Vector3.one;
    }

    static float OutBounce(float t)
    {
        const float n1 = 7.5625f, d1 = 2.75f;
        if (t < 1f / d1) return n1 * t * t;
        if (t < 2f / d1) { t -= 1.5f / d1; return n1 * t * t + 0.75f; }
        if (t < 2.5f / d1) { t -= 2.25f / d1; return n1 * t * t + 0.9375f; }
        t -= 2.625f / d1; return n1 * t * t + 0.984375f;
    }
}`,
    },
  });
})();
