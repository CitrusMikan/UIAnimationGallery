/* 03-button.js — ボタン・インタラクション系 (7種)
 * プレビューは実際にホバー/クリックで試せる */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. ホバースケール */
  R({
    id: 'hover-scale',
    interactive: true,
    title: 'ホバースケール',
    titleEn: 'Hover Scale',
    category: 'button',
    tags: ['hover', 'scale', 'ボタン', 'PC向け'],
    description: 'カーソルが乗ったらscale 1.05に拡大、離れたら戻す。PC向けUIのホバーフィードバックの基本。プレビューは実際にホバーで試せる。',
    spec: {
      target: 'Transform.localScale',
      normal: 1.0, hover: 1.05,
      duration: 0.15,
      ease: 'OutQuad',
      trigger: 'IPointerEnterHandler / IPointerExitHandler',
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'HOVER ME');
      btn.style.cursor = 'pointer';
      const s = { s: 1 };
      let cur = 1;
      const go = to => {
        const from = cur;
        ctx.tween({ duration: 0.15, ease: 'OutQuad', onUpdate: v => { cur = from + (to - from) * v; s.s = cur; PV.applyT(btn, s); } });
      };
      btn.addEventListener('mouseenter', () => go(1.05));
      btn.addEventListener('mouseleave', () => go(1));
      // 自動デモ1回
      (async () => { await ctx.wait(0.5); go(1.05); await ctx.wait(0.6); go(1); })();
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

public class HoverScaleLitMotion : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float hoverScale = 1.05f;
    [SerializeField] float duration = 0.15f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void OnPointerEnter(PointerEventData e) => To(hoverScale);
    public void OnPointerExit(PointerEventData e) => To(1f);

    void To(float target)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(transform.localScale, Vector3.one * target, duration)
            .WithEase(Ease.OutQuad)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;

public class HoverScaleDOTween : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float hoverScale = 1.05f;
    [SerializeField] float duration = 0.15f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void OnPointerEnter(PointerEventData e) => To(hoverScale);
    public void OnPointerExit(PointerEventData e) => To(1f);

    void To(float target)
    {
        tween?.Kill();
        tween = transform.DOScale(Vector3.one * target, duration).SetEase(Ease.OutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;

public class HoverScaleCoroutine : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float hoverScale = 1.05f;
    [SerializeField] float duration = 0.15f;

    public void OnPointerEnter(PointerEventData e) { StopAllCoroutines(); StartCoroutine(To(hoverScale)); }
    public void OnPointerExit(PointerEventData e) { StopAllCoroutines(); StartCoroutine(To(1f)); }

    IEnumerator To(float target)
    {
        Vector3 from = transform.localScale;
        Vector3 to = Vector3.one * target;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            transform.localScale = Vector3.LerpUnclamped(from, to, e);
            yield return null;
        }
        transform.localScale = to;
    }
}`,
    },
  });

  /* 2. プレス (押し込み) */
  R({
    id: 'press-down',
    interactive: true,
    title: 'プレス（押し込み）',
    titleEn: 'Press Down',
    category: 'button',
    tags: ['press', 'scale', 'タップ', 'モバイル'],
    description: '押下でscale 0.92に沈み、離すとOutBackで弾んで戻る。押した感触を指に伝えるタッチUIの必須フィードバック。プレビューはクリックで試せる。',
    spec: {
      target: 'Transform.localScale',
      pressed: 0.92,
      down: { duration: 0.08, ease: 'OutQuad' },
      up: { duration: 0.2, ease: 'OutBack' },
      trigger: 'IPointerDownHandler / IPointerUpHandler',
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'PRESS ME');
      btn.style.cursor = 'pointer';
      const s = { s: 1 };
      let cur = 1;
      const go = (to, d, ease) => {
        const from = cur;
        ctx.tween({ duration: d, ease, onUpdate: v => { cur = from + (to - from) * v; s.s = cur; PV.applyT(btn, s); } });
      };
      btn.addEventListener('pointerdown', () => go(0.92, 0.08, 'OutQuad'));
      btn.addEventListener('pointerup', () => go(1, 0.2, 'OutBack'));
      btn.addEventListener('pointerleave', () => go(1, 0.2, 'OutBack'));
      (async () => {
        await ctx.wait(0.5); go(0.92, 0.08, 'OutQuad');
        await ctx.wait(0.35); go(1, 0.2, 'OutBack');
      })();
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

public class PressDownLitMotion : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    [SerializeField] float pressedScale = 0.92f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void OnPointerDown(PointerEventData e) => To(pressedScale, 0.08f, Ease.OutQuad);
    public void OnPointerUp(PointerEventData e) => To(1f, 0.2f, Ease.OutBack);

    void To(float target, float duration, Ease ease)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(transform.localScale, Vector3.one * target, duration)
            .WithEase(ease)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;

public class PressDownDOTween : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    [SerializeField] float pressedScale = 0.92f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void OnPointerDown(PointerEventData e) => To(pressedScale, 0.08f, Ease.OutQuad);
    public void OnPointerUp(PointerEventData e) => To(1f, 0.2f, Ease.OutBack);

    void To(float target, float duration, Ease ease)
    {
        tween?.Kill();
        tween = transform.DOScale(Vector3.one * target, duration).SetEase(ease);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;

public class PressDownCoroutine : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    [SerializeField] float pressedScale = 0.92f;

    public void OnPointerDown(PointerEventData e) { Run(pressedScale, 0.08f, false); }
    public void OnPointerUp(PointerEventData e) { Run(1f, 0.2f, true); }

    void Run(float target, float duration, bool back)
    {
        StopAllCoroutines();
        StartCoroutine(To(target, duration, back));
    }

    IEnumerator To(float target, float duration, bool back)
    {
        Vector3 from = transform.localScale;
        Vector3 to = Vector3.one * target;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = back ? OutBack(p) : 1f - (1f - p) * (1f - p);
            transform.localScale = Vector3.LerpUnclamped(from, to, e);
            yield return null;
        }
        transform.localScale = to;
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
    },
  });

  /* 3. リップル */
  R({
    id: 'ripple',
    interactive: true,
    title: 'リップル',
    titleEn: 'Ripple',
    category: 'button',
    tags: ['click', '波紋', 'Material', 'エフェクト'],
    description: 'クリック地点から波紋が広がる。Material Design由来の押下フィードバック。円形Imageをスクリプトから生成し、拡大とフェードを同時再生して破棄する。プレビューはクリックで試せる。',
    spec: {
      target: '動的生成した円形Image (scale + alpha)',
      scale: { from: 0, to: 1 },
      alpha: { from: 0.5, to: 0 },
      duration: 0.5,
      ease: 'OutQuad',
      cleanup: '完了時にDestroy',
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'CLICK ME', { styles: { overflow: 'hidden', position: 'relative', padding: '16px 40px' } });
      btn.style.cursor = 'pointer';
      const spawn = (x, y) => {
        const r = PV.el(null, {
          position: 'absolute', left: (x - 60) + 'px', top: (y - 60) + 'px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(20,20,20,0.35)', pointerEvents: 'none',
        });
        btn.appendChild(r);
        ctx.tween({
          duration: 0.5, ease: 'OutQuad',
          onUpdate: v => { r.style.transform = `scale(${v})`; r.style.opacity = 0.5 * (1 - v); },
          onComplete: () => r.remove(),
        });
      };
      btn.addEventListener('pointerdown', ev => {
        const rc = btn.getBoundingClientRect();
        spawn(ev.clientX - rc.left, ev.clientY - rc.top);
      });
      ctx.forever(async () => {
        spawn(btn.offsetWidth * (0.3 + Math.random() * 0.4), btn.offsetHeight * 0.5);
        await ctx.wait(1.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class RippleLitMotion : MonoBehaviour, IPointerDownHandler
{
    [SerializeField] Sprite circleSprite;    // 白い円のスプライト
    [SerializeField] float maxSize = 240f;
    [SerializeField] float duration = 0.5f;

    RectTransform rect;

    void Awake() => rect = (RectTransform)transform;

    public void OnPointerDown(PointerEventData e)
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rect, e.position, e.pressEventCamera, out Vector2 localPos);

        var go = new GameObject("Ripple", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = circleSprite;
        image.raycastTarget = false;

        var rippleRect = (RectTransform)go.transform;
        rippleRect.SetParent(rect, false);
        rippleRect.anchoredPosition = localPos;
        rippleRect.sizeDelta = Vector2.one * maxSize;

        LMotion.Create(Vector3.zero, Vector3.one, duration)
            .WithEase(Ease.OutQuad)
            .BindToLocalScale(rippleRect);
        LMotion.Create(0.5f, 0f, duration)
            .WithEase(Ease.OutQuad)
            .WithOnComplete(() => Destroy(go))
            .BindToColorA(image);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class RippleDOTween : MonoBehaviour, IPointerDownHandler
{
    [SerializeField] Sprite circleSprite;
    [SerializeField] float maxSize = 240f;
    [SerializeField] float duration = 0.5f;

    RectTransform rect;

    void Awake() => rect = (RectTransform)transform;

    public void OnPointerDown(PointerEventData e)
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rect, e.position, e.pressEventCamera, out Vector2 localPos);

        var go = new GameObject("Ripple", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = circleSprite;
        image.raycastTarget = false;
        image.color = new Color(1f, 1f, 1f, 0.5f);

        var rippleRect = (RectTransform)go.transform;
        rippleRect.SetParent(rect, false);
        rippleRect.anchoredPosition = localPos;
        rippleRect.sizeDelta = Vector2.one * maxSize;
        rippleRect.localScale = Vector3.zero;

        DOTween.Sequence()
            .Join(rippleRect.DOScale(Vector3.one, duration).SetEase(Ease.OutQuad))
            .Join(image.DOFade(0f, duration).SetEase(Ease.OutQuad))
            .OnComplete(() => Destroy(go));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class RippleCoroutine : MonoBehaviour, IPointerDownHandler
{
    [SerializeField] Sprite circleSprite;
    [SerializeField] float maxSize = 240f;
    [SerializeField] float duration = 0.5f;

    RectTransform rect;

    void Awake() => rect = (RectTransform)transform;

    public void OnPointerDown(PointerEventData e)
    {
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rect, e.position, e.pressEventCamera, out Vector2 localPos);
        StartCoroutine(Animate(localPos));
    }

    IEnumerator Animate(Vector2 localPos)
    {
        var go = new GameObject("Ripple", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = circleSprite;
        image.raycastTarget = false;

        var rippleRect = (RectTransform)go.transform;
        rippleRect.SetParent(rect, false);
        rippleRect.anchoredPosition = localPos;
        rippleRect.sizeDelta = Vector2.one * maxSize;

        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            rippleRect.localScale = Vector3.one * e;
            image.color = new Color(1f, 1f, 1f, 0.5f * (1f - e));
            yield return null;
        }
        Destroy(go);
    }
}`,
    },
  });

  /* 4. CTAアテンション */
  R({
    id: 'cta-attention',
    title: 'CTAアテンション',
    titleEn: 'CTA Attention',
    category: 'button',
    tags: ['loop', '誘導', 'CTA', '定期実行'],
    description: '数秒おきにブルッと揺れて存在を主張する。「購入」「ガチャを引く」など押してほしいボタンに。常時動かすより間欠のほうが目障りになりにくい。',
    spec: {
      target: 'Transform.localEulerAngles.z + localScale',
      interval: 2.5,
      rotationStrength: 6,
      scaleStrength: 0.08,
      duration: 0.5,
      frequency: 8,
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'ガチャを引く');
      const s = { rot: 0, s: 1 };
      ctx.forever(async () => {
        await ctx.wait(2.0);
        await ctx.tween({
          duration: 0.5, ease: 'Linear',
          onUpdate: (v, t) => {
            const w = EASE.punchWave(t, 8, 1);
            s.rot = w * 6; s.s = 1 + Math.abs(w) * 0.08;
            PV.applyT(btn, s);
          },
        });
        s.rot = 0; s.s = 1; PV.applyT(btn, s);
      });
    },
    code: {
      litmotion: `
using System.Collections;
using LitMotion;
using UnityEngine;

public class CtaAttentionLitMotion : MonoBehaviour
{
    [SerializeField] float interval = 2.5f;
    [SerializeField] float rotationStrength = 6f;
    [SerializeField] float scaleStrength = 0.08f;
    [SerializeField] float duration = 0.5f;
    [SerializeField] float frequency = 8f;

    MotionHandle handle;

    void OnEnable() => StartCoroutine(Loop());
    void OnDisable() { StopAllCoroutines(); Stop(); }
    void OnDestroy() => Stop();

    IEnumerator Loop()
    {
        var wait = new WaitForSeconds(interval);
        while (true)
        {
            yield return wait;
            Stop();
            handle = LMotion.Create(0f, 1f, duration)
                .Bind(p =>
                {
                    float decay = (1f - p) * (1f - p);
                    float w = Mathf.Sin(p * frequency * Mathf.PI) * decay;
                    transform.localEulerAngles = new Vector3(0f, 0f, w * rotationStrength);
                    transform.localScale = Vector3.one * (1f + Mathf.Abs(w) * scaleStrength);
                });
        }
    }

    void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
        transform.localEulerAngles = Vector3.zero;
        transform.localScale = Vector3.one;
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CtaAttentionDOTween : MonoBehaviour
{
    [SerializeField] float interval = 2.5f;
    [SerializeField] float rotationStrength = 6f;
    [SerializeField] float scaleStrength = 0.08f;
    [SerializeField] float duration = 0.5f;

    Sequence seq;

    void OnEnable() => Play();
    void OnDisable() => seq?.Kill();
    void OnDestroy() => seq?.Kill();

    void Play()
    {
        seq?.Kill();
        // 揺れ→インターバルを1つのシーケンスにして無限ループ
        seq = DOTween.Sequence()
            .AppendInterval(interval)
            .Append(transform.DOPunchRotation(new Vector3(0f, 0f, rotationStrength), duration, vibrato: 8))
            .Join(transform.DOPunchScale(Vector3.one * scaleStrength, duration, vibrato: 8))
            .SetLoops(-1);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CtaAttentionCoroutine : MonoBehaviour
{
    [SerializeField] float interval = 2.5f;
    [SerializeField] float rotationStrength = 6f;
    [SerializeField] float scaleStrength = 0.08f;
    [SerializeField] float duration = 0.5f;
    [SerializeField] float frequency = 8f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Loop()); }
    void OnDisable()
    {
        StopAllCoroutines();
        transform.localEulerAngles = Vector3.zero;
        transform.localScale = Vector3.one;
    }

    IEnumerator Loop()
    {
        var wait = new WaitForSeconds(interval);
        while (true)
        {
            yield return wait;
            float t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                float p = Mathf.Clamp01(t / duration);
                float decay = (1f - p) * (1f - p);
                float w = Mathf.Sin(p * frequency * Mathf.PI) * decay;
                transform.localEulerAngles = new Vector3(0f, 0f, w * rotationStrength);
                transform.localScale = Vector3.one * (1f + Mathf.Abs(w) * scaleStrength);
                yield return null;
            }
            transform.localEulerAngles = Vector3.zero;
            transform.localScale = Vector3.one;
        }
    }
}`,
    },
  });

  /* 5. トグルスイッチ */
  R({
    id: 'toggle-switch',
    interactive: true,
    title: 'トグルスイッチ',
    titleEn: 'Toggle Switch',
    category: 'button',
    tags: ['toggle', 'スイッチ', '設定', '状態変化'],
    description: 'ノブがOutBackで滑り、背景色が同時に切り替わる。設定画面のON/OFF。位置と色の2トゥイーン同時再生の実例。プレビューはクリックで切替。',
    spec: {
      knob: { target: 'RectTransform.anchoredPosition.x', off: -22, on: 22, duration: 0.25, ease: 'OutBack' },
      background: { target: 'Image.color', off: 'var(--pv-line-strong)', on: 'var(--pv-accent)', duration: 0.25, ease: 'OutQuad' },
    },
    preview(ctx, PV) {
      const track = PV.el('pv-toggle-track', {
        width: '92px', height: '48px', background: 'var(--pv-line-strong)',
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        position: 'relative', cursor: 'pointer', transition: 'none',
      });
      const knob = PV.el(null, {
        position: 'absolute', top: '6px', left: '6px',
        width: '36px', height: '36px', background: 'var(--pv-bg)',
        border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
      });
      track.appendChild(knob);
      ctx.stage.appendChild(track);
      let on = false, x = 0;
      let colT = 0;
      const toggle = () => {
        on = !on;
        // トラック色は現在テーマの --pv-line-strong(OFF) ⇔ --pv-accent(ON) を補間
        const off = PV.rgb('--pv-line-strong'), acc = PV.rgb('--pv-accent');
        const mix = t => {
          const c = off.map((v, i) => Math.round(v + (acc[i] - v) * t));
          return `rgb(${c[0]},${c[1]},${c[2]})`;
        };
        const fx = x, tx = on ? 44 : 0;
        const fc = colT, tc = on ? 1 : 0;
        ctx.tween({ duration: 0.25, ease: 'OutBack', onUpdate: v => { x = fx + (tx - fx) * v; knob.style.transform = `translateX(${x}px)`; } });
        ctx.tween({ duration: 0.25, ease: 'OutQuad', onUpdate: v => { colT = fc + (tc - fc) * v; track.style.background = mix(colT); } });
      };
      track.addEventListener('click', toggle);
      ctx.forever(async () => { await ctx.wait(1.4); toggle(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

public class ToggleSwitchLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform knob;
    [SerializeField] Image background;
    [SerializeField] float knobOffX = -22f;
    [SerializeField] float knobOnX = 22f;
    [SerializeField] Color offColor = new Color(0.23f, 0.23f, 0.24f);
    [SerializeField] Color onColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] float duration = 0.25f;

    bool isOn;
    MotionHandle knobHandle, colorHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (knobHandle.IsActive()) knobHandle.Cancel();
        if (colorHandle.IsActive()) colorHandle.Cancel();
    }

    public void Toggle()
    {
        isOn = !isOn;
        Cancel();
        knobHandle = LMotion.Create(knob.anchoredPosition.x, isOn ? knobOnX : knobOffX, duration)
            .WithEase(Ease.OutBack)
            .BindToAnchoredPositionX(knob);
        colorHandle = LMotion.Create(background.color, isOn ? onColor : offColor, duration)
            .WithEase(Ease.OutQuad)
            .BindToColor(background);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class ToggleSwitchDOTween : MonoBehaviour
{
    [SerializeField] RectTransform knob;
    [SerializeField] Image background;
    [SerializeField] float knobOffX = -22f;
    [SerializeField] float knobOnX = 22f;
    [SerializeField] Color offColor = new Color(0.23f, 0.23f, 0.24f);
    [SerializeField] Color onColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] float duration = 0.25f;

    bool isOn;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle()
    {
        isOn = !isOn;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(knob.DOAnchorPosX(isOn ? knobOnX : knobOffX, duration).SetEase(Ease.OutBack))
            .Join(background.DOColor(isOn ? onColor : offColor, duration).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ToggleSwitchCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform knob;
    [SerializeField] Image background;
    [SerializeField] float knobOffX = -22f;
    [SerializeField] float knobOnX = 22f;
    [SerializeField] Color offColor = new Color(0.23f, 0.23f, 0.24f);
    [SerializeField] Color onColor = new Color(0.96f, 0.88f, 0.01f);
    [SerializeField] float duration = 0.25f;

    bool isOn;

    public void Toggle()
    {
        isOn = !isOn;
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float fromX = knob.anchoredPosition.x;
        float toX = isOn ? knobOnX : knobOffX;
        Color fromC = background.color;
        Color toC = isOn ? onColor : offColor;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            knob.anchoredPosition = new Vector2(Mathf.LerpUnclamped(fromX, toX, OutBack(p)), knob.anchoredPosition.y);
            background.color = Color.Lerp(fromC, toC, 1f - (1f - p) * (1f - p));
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
    },
  });

  /* 6. チェックマーク */
  R({
    id: 'checkmark',
    title: 'チェックマーク描画',
    titleEn: 'Checkmark Draw',
    category: 'button',
    tags: ['fillAmount', '完了', 'チェック', '成功'],
    description: 'チェックマークが描かれるように現れる。uGUIではImage.fillAmount(0→1)で表現するのが手軽。完了・成功・タスク達成の瞬間に小さな快感を添える。',
    spec: {
      target: 'Image.fillAmount',
      from: 0, to: 1,
      duration: 0.4,
      ease: 'OutCubic',
      pre: '親円をScale In (OutBack 0.25s) してから描画開始',
      note: 'Image Type=Filled, Fill Method=Horizontal のチェック画像を使用',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', width: '90px', height: '90px' });
      ctx.stage.appendChild(wrap);
      const circle = PV.el(null, {
        position: 'absolute', inset: '0', border: '2px solid var(--pv-accent)',
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
        background: 'linear-gradient(160deg,var(--pv-panel2),var(--pv-panel))',
      });
      wrap.appendChild(circle);
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 90 90');
      Object.assign(svg.style, { position: 'absolute', inset: '0' });
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M24 46 L40 62 L68 30');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'var(--pv-accent)');
      path.setAttribute('stroke-width', '7');
      path.setAttribute('stroke-linecap', 'square');
      svg.appendChild(path);
      wrap.appendChild(svg);
      const len = 70; // 概算パス長より大きめ
      const total = path.getTotalLength ? path.getTotalLength() : len;
      path.style.strokeDasharray = total;
      ctx.forever(async () => {
        circle.style.transform = 'scale(0)';
        path.style.strokeDashoffset = total;
        await ctx.wait(0.3);
        await ctx.tween({ duration: 0.25, ease: 'OutBack', onUpdate: v => circle.style.transform = `scale(${v})` });
        await ctx.tween({ duration: 0.4, ease: 'OutCubic', onUpdate: v => path.style.strokeDashoffset = total * (1 - v) });
        await ctx.wait(1.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

public class CheckmarkLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform circle;   // 背景の円
    [SerializeField] Image checkImage;       // Filled(Horizontal)設定のチェック画像

    MotionHandle circleHandle, checkHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (circleHandle.IsActive()) circleHandle.Cancel();
        if (checkHandle.IsActive()) checkHandle.Cancel();
    }

    public void Play()
    {
        Cancel();
        checkImage.fillAmount = 0f;
        circleHandle = LMotion.Create(Vector3.zero, Vector3.one, 0.25f)
            .WithEase(Ease.OutBack)
            .BindToLocalScale(circle);
        checkHandle = LMotion.Create(0f, 1f, 0.4f)
            .WithEase(Ease.OutCubic)
            .WithDelay(0.25f)
            .BindToFillAmount(checkImage);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class CheckmarkDOTween : MonoBehaviour
{
    [SerializeField] RectTransform circle;
    [SerializeField] Image checkImage;   // Filled(Horizontal)設定

    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        circle.localScale = Vector3.zero;
        checkImage.fillAmount = 0f;
        seq = DOTween.Sequence()
            .Append(circle.DOScale(Vector3.one, 0.25f).SetEase(Ease.OutBack))
            .Append(checkImage.DOFillAmount(1f, 0.4f).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class CheckmarkCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform circle;
    [SerializeField] Image checkImage;   // Filled(Horizontal)設定

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        circle.localScale = Vector3.zero;
        checkImage.fillAmount = 0f;

        float t = 0f;
        while (t < 0.25f)
        {
            t += Time.deltaTime;
            circle.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.25f));
            yield return null;
        }

        t = 0f;
        while (t < 0.4f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.4f);
            float u = 1f - p;
            checkImage.fillAmount = 1f - u * u * u; // OutCubic
            yield return null;
        }
        checkImage.fillAmount = 1f;
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
    },
  });

  /* 7. いいねバースト */
  R({
    id: 'like-burst',
    interactive: true,
    title: 'いいねバースト',
    titleEn: 'Like Burst',
    category: 'button',
    tags: ['particle', 'いいね', 'お気に入り', '演出'],
    description: 'タップでアイコンがOutBackで弾み、周囲に小さなパーティクルが飛び散る。お気に入り登録・いいね・スターなどの気持ちいい確定演出。プレビューはクリックで試せる。',
    spec: {
      icon: { target: 'Transform.localScale', keyframes: [0, 1.3, 1.0], duration: 0.4, ease: 'OutBack' },
      particles: {
        count: 8, distance: 60,
        scale: { from: 1, to: 0 },
        duration: 0.5, ease: 'OutCubic',
        note: '中心から放射状(360°/count刻み)に飛ばす',
      },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' });
      ctx.stage.appendChild(wrap);
      const star = PV.el(null, { fontSize: '46px', lineHeight: '1', color: 'var(--pv-line-strong)', transition: 'none', userSelect: 'none' }, '★');
      wrap.appendChild(star);
      let on = false;
      const burst = () => {
        on = !on;
        if (!on) { star.style.color = 'var(--pv-line-strong)'; return; }
        star.style.color = 'var(--pv-accent)';
        ctx.tween({
          duration: 0.4, ease: 'OutBack',
          onUpdate: v => star.style.transform = `scale(${0.3 + 0.7 * v})`,
        });
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const p = PV.el(null, {
            position: 'absolute', left: '50%', top: '50%',
            width: '6px', height: '6px', background: 'var(--pv-accent)',
            clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
          });
          wrap.appendChild(p);
          ctx.tween({
            duration: 0.5, ease: 'OutCubic',
            onUpdate: v => {
              const d = 44 * v;
              p.style.transform = `translate(${Math.cos(ang) * d - 3}px, ${Math.sin(ang) * d - 3}px) scale(${1 - v})`;
              p.style.opacity = 1 - v;
            },
            onComplete: () => p.remove(),
          });
        }
      };
      wrap.addEventListener('click', burst);
      ctx.forever(async () => { await ctx.wait(1.6); burst(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

public class LikeBurstLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform icon;      // 星やハートのアイコン
    [SerializeField] Sprite particleSprite;   // パーティクル用の小さいスプライト
    [SerializeField] int particleCount = 8;
    [SerializeField] float distance = 60f;

    MotionHandle iconHandle;

    void OnDestroy() { if (iconHandle.IsActive()) iconHandle.Cancel(); }

    public void Play()
    {
        if (iconHandle.IsActive()) iconHandle.Cancel();
        iconHandle = LMotion.Create(Vector3.one * 0.3f, Vector3.one, 0.4f)
            .WithEase(Ease.OutBack)
            .BindToLocalScale(icon);

        for (int i = 0; i < particleCount; i++)
        {
            float angle = i * Mathf.PI * 2f / particleCount;
            var dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
            SpawnParticle(dir);
        }
    }

    void SpawnParticle(Vector2 dir)
    {
        var go = new GameObject("Particle", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = particleSprite;
        image.raycastTarget = false;

        var rect = (RectTransform)go.transform;
        rect.SetParent(icon.parent, false);
        rect.anchoredPosition = icon.anchoredPosition;
        rect.sizeDelta = Vector2.one * 12f;

        LMotion.Create(icon.anchoredPosition, icon.anchoredPosition + dir * distance, 0.5f)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPosition(rect);
        LMotion.Create(Vector3.one, Vector3.zero, 0.5f)
            .WithEase(Ease.OutCubic)
            .WithOnComplete(() => Destroy(go))
            .BindToLocalScale(rect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class LikeBurstDOTween : MonoBehaviour
{
    [SerializeField] RectTransform icon;
    [SerializeField] Sprite particleSprite;
    [SerializeField] int particleCount = 8;
    [SerializeField] float distance = 60f;

    Tween iconTween;

    void OnDestroy() => iconTween?.Kill();

    public void Play()
    {
        iconTween?.Kill();
        icon.localScale = Vector3.one * 0.3f;
        iconTween = icon.DOScale(Vector3.one, 0.4f).SetEase(Ease.OutBack);

        for (int i = 0; i < particleCount; i++)
        {
            float angle = i * Mathf.PI * 2f / particleCount;
            var dir = new Vector2(Mathf.Cos(angle), Mathf.Sin(angle));
            SpawnParticle(dir);
        }
    }

    void SpawnParticle(Vector2 dir)
    {
        var go = new GameObject("Particle", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = particleSprite;
        image.raycastTarget = false;

        var rect = (RectTransform)go.transform;
        rect.SetParent(icon.parent, false);
        rect.anchoredPosition = icon.anchoredPosition;
        rect.sizeDelta = Vector2.one * 12f;

        DOTween.Sequence()
            .Join(rect.DOAnchorPos(icon.anchoredPosition + dir * distance, 0.5f).SetEase(Ease.OutCubic))
            .Join(rect.DOScale(Vector3.zero, 0.5f).SetEase(Ease.OutCubic))
            .OnComplete(() => Destroy(go));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class LikeBurstCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform icon;
    [SerializeField] Sprite particleSprite;
    [SerializeField] int particleCount = 8;
    [SerializeField] float distance = 60f;

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(AnimateIcon());
        for (int i = 0; i < particleCount; i++)
        {
            float angle = i * Mathf.PI * 2f / particleCount;
            StartCoroutine(AnimateParticle(new Vector2(Mathf.Cos(angle), Mathf.Sin(angle))));
        }
    }

    IEnumerator AnimateIcon()
    {
        float t = 0f;
        while (t < 0.4f)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / 0.4f));
            icon.localScale = Vector3.one * Mathf.LerpUnclamped(0.3f, 1f, e);
            yield return null;
        }
        icon.localScale = Vector3.one;
    }

    IEnumerator AnimateParticle(Vector2 dir)
    {
        var go = new GameObject("Particle", typeof(Image));
        var image = go.GetComponent<Image>();
        image.sprite = particleSprite;
        image.raycastTarget = false;

        var rect = (RectTransform)go.transform;
        rect.SetParent(icon.parent, false);
        rect.anchoredPosition = icon.anchoredPosition;
        rect.sizeDelta = Vector2.one * 12f;

        Vector2 from = icon.anchoredPosition;
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.5f);
            float u = 1f - p;
            float e = 1f - u * u * u; // OutCubic
            rect.anchoredPosition = from + dir * distance * e;
            rect.localScale = Vector3.one * (1f - e);
            yield return null;
        }
        Destroy(go);
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
    },
  });
})();
