/* 04-widget.js — UI部品系 (9種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. モーダル開閉 */
  R({
    id: 'modal-open',
    title: 'モーダル開閉',
    titleEn: 'Modal Open / Close',
    category: 'widget',
    tags: ['modal', 'dialog', 'overlay', '複合'],
    description: '背景の暗幕フェードとパネルのズームインを同時に再生する。閉じるときは逆再生を速めに。ダイアログ実装の複合アニメーションの基本形。',
    spec: {
      overlay: { target: 'CanvasGroup.alpha', from: 0, to: 0.6, duration: 0.2, ease: 'OutQuad' },
      panel: {
        scale: { from: 0.9, to: 1.0 },
        alpha: { from: 0, to: 1 },
        duration: 0.3, ease: 'OutBack',
      },
      close: '逆再生 (duration 0.2, ease: InQuad)',
    },
    preview(ctx, PV) {
      const overlay = PV.el(null, { position: 'absolute', inset: '0', background: '#000', opacity: 0 });
      ctx.stage.appendChild(overlay);
      const panel = PV.box(ctx, { label: 'DIALOG', w: 150, h: 90 });
      const s = { s: 0.9 };
      ctx.forever(async () => {
        overlay.style.opacity = 0; panel.style.opacity = 0; s.s = 0.9; PV.applyT(panel, s);
        await ctx.wait(0.4);
        ctx.tween({ from: 0, to: 0.55, duration: 0.2, ease: 'OutQuad', onUpdate: v => overlay.style.opacity = v });
        await ctx.tween({
          duration: 0.3, ease: 'OutBack',
          onUpdate: (v, t) => { s.s = 0.9 + 0.1 * v; PV.applyT(panel, s); panel.style.opacity = Math.min(t * 3, 1); },
        });
        await ctx.wait(1.1);
        ctx.tween({ from: 0.55, to: 0, duration: 0.2, ease: 'InQuad', onUpdate: v => overlay.style.opacity = v });
        await ctx.tween({
          duration: 0.2, ease: 'InQuad',
          onUpdate: (v, t) => { s.s = 1 - 0.1 * v; PV.applyT(panel, s); panel.style.opacity = 1 - t; },
        });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ModalLitMotion : MonoBehaviour
{
    [SerializeField] CanvasGroup overlay;    // 暗幕 (全画面Image + CanvasGroup)
    [SerializeField] CanvasGroup panel;      // ダイアログ本体
    [SerializeField] float overlayAlpha = 0.6f;

    MotionHandle h1, h2, h3;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (h1.IsActive()) h1.Cancel();
        if (h2.IsActive()) h2.Cancel();
        if (h3.IsActive()) h3.Cancel();
    }

    public void Open()
    {
        gameObject.SetActive(true);
        Cancel();
        h1 = LMotion.Create(0f, overlayAlpha, 0.2f)
            .WithEase(Ease.OutQuad)
            .BindToAlpha(overlay);
        h2 = LMotion.Create(Vector3.one * 0.9f, Vector3.one, 0.3f)
            .WithEase(Ease.OutBack)
            .BindToLocalScale(panel.transform);
        h3 = LMotion.Create(0f, 1f, 0.15f)
            .BindToAlpha(panel);
    }

    public void Close()
    {
        Cancel();
        h1 = LMotion.Create(overlay.alpha, 0f, 0.2f)
            .WithEase(Ease.InQuad)
            .BindToAlpha(overlay);
        h2 = LMotion.Create(panel.transform.localScale, Vector3.one * 0.9f, 0.2f)
            .WithEase(Ease.InQuad)
            .BindToLocalScale(panel.transform);
        h3 = LMotion.Create(panel.alpha, 0f, 0.2f)
            .WithOnComplete(() => gameObject.SetActive(false))
            .BindToAlpha(panel);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ModalDOTween : MonoBehaviour
{
    [SerializeField] CanvasGroup overlay;
    [SerializeField] CanvasGroup panel;
    [SerializeField] float overlayAlpha = 0.6f;

    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Open()
    {
        gameObject.SetActive(true);
        seq?.Kill();
        overlay.alpha = 0f;
        panel.alpha = 0f;
        panel.transform.localScale = Vector3.one * 0.9f;
        seq = DOTween.Sequence()
            .Join(overlay.DOFade(overlayAlpha, 0.2f).SetEase(Ease.OutQuad))
            .Join(panel.transform.DOScale(Vector3.one, 0.3f).SetEase(Ease.OutBack))
            .Join(panel.DOFade(1f, 0.15f));
    }

    public void Close()
    {
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(overlay.DOFade(0f, 0.2f).SetEase(Ease.InQuad))
            .Join(panel.transform.DOScale(Vector3.one * 0.9f, 0.2f).SetEase(Ease.InQuad))
            .Join(panel.DOFade(0f, 0.2f))
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ModalCoroutine : MonoBehaviour
{
    [SerializeField] CanvasGroup overlay;
    [SerializeField] CanvasGroup panel;
    [SerializeField] float overlayAlpha = 0.6f;

    public void Open()
    {
        gameObject.SetActive(true);
        StopAllCoroutines();
        StartCoroutine(Animate(true));
    }

    public void Close()
    {
        StopAllCoroutines();
        StartCoroutine(Animate(false));
    }

    IEnumerator Animate(bool open)
    {
        float duration = open ? 0.3f : 0.2f;
        float t = 0f;
        float fromOv = overlay.alpha, toOv = open ? overlayAlpha : 0f;
        Vector3 fromS = panel.transform.localScale;
        Vector3 toS = open ? Vector3.one : Vector3.one * 0.9f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = open ? OutBack(p) : p * p;
            overlay.alpha = Mathf.Lerp(fromOv, toOv, p);
            panel.transform.localScale = Vector3.LerpUnclamped(fromS, toS, e);
            panel.alpha = open ? Mathf.Min(p * 2f, 1f) : 1f - p;
            yield return null;
        }
        if (!open) gameObject.SetActive(false);
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

  /* 2. トースト通知 */
  R({
    id: 'toast',
    title: 'トースト通知',
    titleEn: 'Toast Notification',
    category: 'widget',
    tags: ['toast', '通知', '自動消滅', 'シーケンス'],
    description: '下からスライドインして数秒表示し、自動でスライドアウトする。「保存しました」などの軽い通知に。イン→待機→アウトのシーケンス実装の定番。',
    spec: {
      target: 'RectTransform.anchoredPosition.y + CanvasGroup.alpha',
      sequence: [
        { phase: 'in', y: '+80', alpha: '0→1', duration: 0.35, ease: 'OutCubic' },
        { phase: 'hold', duration: 2.0 },
        { phase: 'out', y: '-80', alpha: '1→0', duration: 0.3, ease: 'InCubic' },
      ],
    },
    preview(ctx, PV) {
      const toast = PV.el(null, {
        position: 'absolute', bottom: '14px', left: '50%',
        padding: '8px 22px', background: 'var(--pv-panel)', border: '1px solid var(--pv-accent)',
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
        color: 'var(--pv-text)', fontSize: '12px', fontFamily: "'Noto Sans JP',sans-serif",
        opacity: 0, whiteSpace: 'nowrap',
      }, '✓ 保存しました');
      ctx.stage.appendChild(toast);
      ctx.forever(async () => {
        await ctx.tween({
          duration: 0.35, ease: 'OutCubic',
          onUpdate: v => { toast.style.transform = `translate(-50%, ${30 - 30 * v}px)`; toast.style.opacity = v; },
        });
        await ctx.wait(1.6);
        await ctx.tween({
          duration: 0.3, ease: 'InCubic',
          onUpdate: v => { toast.style.transform = `translate(-50%, ${30 * v}px)`; toast.style.opacity = 1 - v; },
        });
        await ctx.wait(0.7);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ToastLitMotion : MonoBehaviour
{
    [SerializeField] float slideDistance = 80f;
    [SerializeField] float holdDuration = 2f;

    RectTransform rect;
    CanvasGroup group;
    float shownY;
    MotionHandle moveHandle, fadeHandle;

    void Awake()
    {
        rect = (RectTransform)transform;
        group = GetComponent<CanvasGroup>();
        shownY = rect.anchoredPosition.y;
    }

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (moveHandle.IsActive()) moveHandle.Cancel();
        if (fadeHandle.IsActive()) fadeHandle.Cancel();
    }

    public void Show()
    {
        gameObject.SetActive(true);
        Cancel();
        // イン→待機→アウトをシーケンスで構成
        moveHandle = LSequence.Create()
            .Append(LMotion.Create(shownY - slideDistance, shownY, 0.35f)
                .WithEase(Ease.OutCubic)
                .BindToAnchoredPositionY(rect))
            .AppendInterval(holdDuration)
            .Append(LMotion.Create(shownY, shownY - slideDistance, 0.3f)
                .WithEase(Ease.InCubic)
                .BindToAnchoredPositionY(rect))
            .Run();
        fadeHandle = LSequence.Create()
            .Append(LMotion.Create(0f, 1f, 0.35f).BindToAlpha(group))
            .AppendInterval(holdDuration)
            .Append(LMotion.Create(1f, 0f, 0.3f)
                .WithOnComplete(() => gameObject.SetActive(false))
                .BindToAlpha(group))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ToastDOTween : MonoBehaviour
{
    [SerializeField] float slideDistance = 80f;
    [SerializeField] float holdDuration = 2f;

    RectTransform rect;
    CanvasGroup group;
    float shownY;
    Sequence seq;

    void Awake()
    {
        rect = (RectTransform)transform;
        group = GetComponent<CanvasGroup>();
        shownY = rect.anchoredPosition.y;
    }

    void OnDestroy() => seq?.Kill();

    public void Show()
    {
        gameObject.SetActive(true);
        seq?.Kill();
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, shownY - slideDistance);
        group.alpha = 0f;
        seq = DOTween.Sequence()
            .Append(rect.DOAnchorPosY(shownY, 0.35f).SetEase(Ease.OutCubic))
            .Join(group.DOFade(1f, 0.35f))
            .AppendInterval(holdDuration)
            .Append(rect.DOAnchorPosY(shownY - slideDistance, 0.3f).SetEase(Ease.InCubic))
            .Join(group.DOFade(0f, 0.3f))
            .OnComplete(() => gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ToastCoroutine : MonoBehaviour
{
    [SerializeField] float slideDistance = 80f;
    [SerializeField] float holdDuration = 2f;

    RectTransform rect;
    CanvasGroup group;
    float shownY;

    void Awake()
    {
        rect = (RectTransform)transform;
        group = GetComponent<CanvasGroup>();
        shownY = rect.anchoredPosition.y;
    }

    public void Show()
    {
        gameObject.SetActive(true);
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        yield return Slide(shownY - slideDistance, shownY, 0f, 1f, 0.35f, false);
        yield return new WaitForSeconds(holdDuration);
        yield return Slide(shownY, shownY - slideDistance, 1f, 0f, 0.3f, true);
        gameObject.SetActive(false);
    }

    IEnumerator Slide(float fromY, float toY, float fromA, float toA, float duration, bool easeIn)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = easeIn ? p * p * p : 1f - (1f - p) * (1f - p) * (1f - p);
            rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, Mathf.Lerp(fromY, toY, e));
            group.alpha = Mathf.Lerp(fromA, toA, p);
            yield return null;
        }
    }
}`,
    },
  });

  /* 3. ドロワー */
  R({
    id: 'drawer',
    title: 'ドロワーメニュー',
    titleEn: 'Drawer Menu',
    category: 'widget',
    tags: ['drawer', 'menu', 'slide', 'ハンバーガー'],
    description: '画面端からメニューパネルがスライドインし、背景に暗幕がかかる。ハンバーガーメニューの中身。パネル幅ぶんだけ画面外に置き、anchoredPositionを動かす。',
    spec: {
      panel: { target: 'RectTransform.anchoredPosition.x', hidden: '-パネル幅', shown: 0, duration: 0.35, ease: 'OutCubic' },
      overlay: { target: 'CanvasGroup.alpha', from: 0, to: 0.5, duration: 0.35 },
      close: 'ease: InCubic, duration: 0.25',
    },
    preview(ctx, PV) {
      const overlay = PV.el(null, { position: 'absolute', inset: '0', background: '#000', opacity: 0 });
      ctx.stage.appendChild(overlay);
      const panel = PV.el(null, {
        position: 'absolute', left: '0', top: '0', bottom: '0', width: '96px',
        background: 'var(--pv-panel)', borderRight: '2px solid var(--pv-accent)',
        transform: 'translateX(-100%)', padding: '12px 10px',
      });
      ['HOME', 'UNIT', 'ITEM', 'SHOP'].forEach(txt => {
        panel.appendChild(PV.el('mono', {
          fontSize: '9px', letterSpacing: '0.15em', color: 'var(--pv-dim)',
          padding: '7px 6px', borderBottom: '1px solid var(--pv-line)',
        }, txt));
      });
      ctx.stage.appendChild(panel);
      ctx.forever(async () => {
        await ctx.wait(0.5);
        ctx.tween({ from: 0, to: 0.45, duration: 0.35, onUpdate: v => overlay.style.opacity = v });
        await ctx.tween({ duration: 0.35, ease: 'OutCubic', onUpdate: v => panel.style.transform = `translateX(${-100 + 100 * v}%)` });
        await ctx.wait(1.3);
        ctx.tween({ from: 0.45, to: 0, duration: 0.25, onUpdate: v => overlay.style.opacity = v });
        await ctx.tween({ duration: 0.25, ease: 'InCubic', onUpdate: v => panel.style.transform = `translateX(${-100 * v}%)` });
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class DrawerLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform panel;     // 左端アンカーのメニューパネル
    [SerializeField] CanvasGroup overlay;
    [SerializeField] float panelWidth = 320f;

    bool isOpen;
    MotionHandle moveHandle, fadeHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (moveHandle.IsActive()) moveHandle.Cancel();
        if (fadeHandle.IsActive()) fadeHandle.Cancel();
    }

    public void Toggle() { if (isOpen) Close(); else Open(); }

    public void Open()
    {
        isOpen = true;
        Cancel();
        moveHandle = LMotion.Create(panel.anchoredPosition.x, 0f, 0.35f)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPositionX(panel);
        fadeHandle = LMotion.Create(overlay.alpha, 0.5f, 0.35f)
            .BindToAlpha(overlay);
    }

    public void Close()
    {
        isOpen = false;
        Cancel();
        moveHandle = LMotion.Create(panel.anchoredPosition.x, -panelWidth, 0.25f)
            .WithEase(Ease.InCubic)
            .BindToAnchoredPositionX(panel);
        fadeHandle = LMotion.Create(overlay.alpha, 0f, 0.25f)
            .BindToAlpha(overlay);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DrawerDOTween : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] CanvasGroup overlay;
    [SerializeField] float panelWidth = 320f;

    bool isOpen;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle() { if (isOpen) Close(); else Open(); }

    public void Open()
    {
        isOpen = true;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(panel.DOAnchorPosX(0f, 0.35f).SetEase(Ease.OutCubic))
            .Join(overlay.DOFade(0.5f, 0.35f));
    }

    public void Close()
    {
        isOpen = false;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(panel.DOAnchorPosX(-panelWidth, 0.25f).SetEase(Ease.InCubic))
            .Join(overlay.DOFade(0f, 0.25f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DrawerCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform panel;
    [SerializeField] CanvasGroup overlay;
    [SerializeField] float panelWidth = 320f;

    bool isOpen;

    public void Toggle()
    {
        isOpen = !isOpen;
        StopAllCoroutines();
        StartCoroutine(Animate(isOpen));
    }

    IEnumerator Animate(bool open)
    {
        float duration = open ? 0.35f : 0.25f;
        float fromX = panel.anchoredPosition.x;
        float toX = open ? 0f : -panelWidth;
        float fromA = overlay.alpha;
        float toA = open ? 0.5f : 0f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = open ? OutCubic(p) : p * p * p;
            panel.anchoredPosition = new Vector2(Mathf.Lerp(fromX, toX, e), panel.anchoredPosition.y);
            overlay.alpha = Mathf.Lerp(fromA, toA, p);
            yield return null;
        }
    }

    static float OutCubic(float t) { float u = 1f - t; return 1f - u * u * u; }
}`,
    },
  });

  /* 4. アコーディオン */
  R({
    id: 'accordion',
    interactive: true,
    title: 'アコーディオン',
    titleEn: 'Accordion',
    category: 'widget',
    tags: ['expand', 'height', 'FAQ', '開閉'],
    description: 'ヘッダーをクリックすると中身の高さが伸縮する。FAQ・詳細表示・インベントリのカテゴリ開閉に。uGUIではsizeDelta.yまたはLayoutElement.preferredHeightをトゥイーンする。',
    spec: {
      target: 'RectTransform.sizeDelta.y (または LayoutElement.preferredHeight)',
      closed: 0, open: 'コンテンツの高さ',
      duration: 0.3,
      ease: 'OutCubic',
      arrow: { target: '矢印の localEulerAngles.z', from: 0, to: 180, duration: 0.3 },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { width: '170px' });
      ctx.stage.appendChild(wrap);
      const head = PV.el('mono', {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--pv-panel2)', border: '1px solid var(--pv-line-strong)', padding: '8px 12px',
        fontSize: '10px', letterSpacing: '0.12em', color: 'var(--pv-text)', cursor: 'pointer',
      });
      head.appendChild(PV.el(null, null, 'ITEM DETAIL', 'span'));
      const arrow = PV.el(null, { color: 'var(--pv-accent)', fontSize: '9px', transition: 'none' }, '▼', 'span');
      head.appendChild(arrow);
      wrap.appendChild(head);
      const body = PV.el(null, { overflow: 'hidden', height: '0px', background: 'var(--pv-panel)', border: '1px solid var(--pv-line)', borderTop: 'none' });
      const inner = PV.el(null, { padding: '10px 12px', fontSize: '10px', color: 'var(--pv-dim)', fontFamily: "'Noto Sans JP',sans-serif" },
        '攻撃力+15 / 防御力+8。装備すると素早さが上がる。');
      body.appendChild(inner);
      wrap.appendChild(body);
      let open = false, cur = 0;
      const H = 64;
      const toggle = () => {
        open = !open;
        const from = cur, to = open ? H : 0;
        ctx.tween({
          duration: 0.3, ease: 'OutCubic',
          onUpdate: v => {
            cur = from + (to - from) * v;
            body.style.height = cur + 'px';
            arrow.style.transform = `rotate(${(open ? v : 1 - v) * 180}deg)`;
          },
        });
      };
      head.addEventListener('click', toggle);
      ctx.forever(async () => { await ctx.wait(1.3); toggle(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class AccordionLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform content;   // 開閉する中身
    [SerializeField] RectTransform arrow;     // 矢印アイコン
    [SerializeField] float openHeight = 200f;
    [SerializeField] float duration = 0.3f;

    bool isOpen;
    MotionHandle heightHandle, arrowHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (heightHandle.IsActive()) heightHandle.Cancel();
        if (arrowHandle.IsActive()) arrowHandle.Cancel();
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        Cancel();
        heightHandle = LMotion.Create(content.sizeDelta.y, isOpen ? openHeight : 0f, duration)
            .WithEase(Ease.OutCubic)
            .BindToSizeDeltaY(content);
        arrowHandle = LMotion.Create(arrow.localEulerAngles.z, isOpen ? 180f : 0f, duration)
            .WithEase(Ease.OutCubic)
            .Bind(z => arrow.localEulerAngles = new Vector3(0f, 0f, z));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class AccordionDOTween : MonoBehaviour
{
    [SerializeField] RectTransform content;
    [SerializeField] RectTransform arrow;
    [SerializeField] float openHeight = 200f;
    [SerializeField] float duration = 0.3f;

    bool isOpen;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle()
    {
        isOpen = !isOpen;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(content.DOSizeDelta(
                new Vector2(content.sizeDelta.x, isOpen ? openHeight : 0f), duration)
                .SetEase(Ease.OutCubic))
            .Join(arrow.DOLocalRotate(
                new Vector3(0f, 0f, isOpen ? 180f : 0f), duration)
                .SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class AccordionCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform content;
    [SerializeField] RectTransform arrow;
    [SerializeField] float openHeight = 200f;
    [SerializeField] float duration = 0.3f;

    bool isOpen;

    public void Toggle()
    {
        isOpen = !isOpen;
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float fromH = content.sizeDelta.y;
        float toH = isOpen ? openHeight : 0f;
        float fromZ = arrow.localEulerAngles.z;
        float toZ = isOpen ? 180f : 0f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float u = 1f - p;
            float e = 1f - u * u * u; // OutCubic
            content.sizeDelta = new Vector2(content.sizeDelta.x, Mathf.Lerp(fromH, toH, e));
            arrow.localEulerAngles = new Vector3(0f, 0f, Mathf.LerpAngle(fromZ, toZ, e));
            yield return null;
        }
    }
}`,
    },
  });

  /* 5. タブ切替 */
  R({
    id: 'tab-switch',
    interactive: true,
    title: 'タブ切替',
    titleEn: 'Tab Switch',
    category: 'widget',
    tags: ['tab', 'indicator', 'crossfade', 'ナビ'],
    description: '選択インジケータがOutCubicで滑り、コンテンツがクロスフェードで入れ替わる。インジケータの「滑り」があるだけでタブの質感が一気に上がる。',
    spec: {
      indicator: { target: 'RectTransform.anchoredPosition.x', duration: 0.25, ease: 'OutCubic' },
      content: { target: 'CanvasGroup.alpha (新旧2枚)', out: { to: 0, duration: 0.12 }, in: { to: 1, duration: 0.2 } },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { width: '180px' });
      ctx.stage.appendChild(wrap);
      const tabs = PV.el(null, { display: 'flex', position: 'relative', borderBottom: '1px solid var(--pv-line-strong)' });
      const labels = ['UNIT', 'ITEM', 'LOG'];
      const btns = labels.map(l => {
        const b = PV.el('mono', { flex: '1', textAlign: 'center', padding: '7px 0', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--pv-dim)', cursor: 'pointer' }, l);
        tabs.appendChild(b);
        return b;
      });
      const ind = PV.el(null, { position: 'absolute', bottom: '-1px', left: '0', width: '33.3%', height: '2px', background: 'var(--pv-accent)' });
      tabs.appendChild(ind);
      wrap.appendChild(tabs);
      const content = PV.el('mono', { padding: '14px 0 4px', fontSize: '10px', color: 'var(--pv-text)', textAlign: 'center', letterSpacing: '0.1em' }, 'UNIT LIST // 012');
      wrap.appendChild(content);
      const texts = ['UNIT LIST // 012', 'ITEM BOX // 034', 'BATTLE LOG // 007'];
      let cur = 0, x = 0;
      const go = i => {
        if (i === cur) return;
        cur = i;
        const fx = x, tx = i * (180 / 3);
        ctx.tween({ duration: 0.25, ease: 'OutCubic', onUpdate: v => { x = fx + (tx - fx) * v; ind.style.transform = `translateX(${x}px)`; } });
        ctx.tween({
          duration: 0.12, onUpdate: v => content.style.opacity = 1 - v,
          onComplete: () => {
            content.textContent = texts[i];
            ctx.tween({ duration: 0.2, onUpdate: v => content.style.opacity = v });
          },
        });
        btns.forEach((b, j) => b.style.color = j === i ? 'var(--pv-accent)' : 'var(--pv-dim)');
      };
      btns.forEach((b, i) => b.addEventListener('click', () => go(i)));
      btns[0].style.color = 'var(--pv-accent)';
      let auto = 0;
      ctx.forever(async () => { await ctx.wait(1.4); auto = (auto + 1) % 3; go(auto); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class TabSwitchLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform indicator;
    [SerializeField] RectTransform[] tabButtons;   // タブボタン(位置参照用)
    [SerializeField] CanvasGroup[] contents;       // タブごとのコンテンツ

    int current;
    MotionHandle moveHandle, outHandle, inHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (moveHandle.IsActive()) moveHandle.Cancel();
        if (outHandle.IsActive()) outHandle.Cancel();
        if (inHandle.IsActive()) inHandle.Cancel();
    }

    public void Select(int index)
    {
        if (index == current) return;
        var prev = contents[current];
        var next = contents[index];
        current = index;
        Cancel();

        // インジケータをタブ位置へスライド
        moveHandle = LMotion.Create(indicator.anchoredPosition.x, tabButtons[index].anchoredPosition.x, 0.25f)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPositionX(indicator);

        // クロスフェード (旧を速く消し、新をゆっくり出す)
        next.gameObject.SetActive(true);
        outHandle = LMotion.Create(prev.alpha, 0f, 0.12f)
            .WithOnComplete(() => prev.gameObject.SetActive(false))
            .BindToAlpha(prev);
        inHandle = LMotion.Create(0f, 1f, 0.2f)
            .WithDelay(0.1f)
            .BindToAlpha(next);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class TabSwitchDOTween : MonoBehaviour
{
    [SerializeField] RectTransform indicator;
    [SerializeField] RectTransform[] tabButtons;
    [SerializeField] CanvasGroup[] contents;

    int current;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Select(int index)
    {
        if (index == current) return;
        var prev = contents[current];
        var next = contents[index];
        current = index;

        seq?.Kill();
        next.gameObject.SetActive(true);
        next.alpha = 0f;
        seq = DOTween.Sequence()
            .Join(indicator.DOAnchorPosX(tabButtons[index].anchoredPosition.x, 0.25f)
                .SetEase(Ease.OutCubic))
            .Join(prev.DOFade(0f, 0.12f)
                .OnComplete(() => prev.gameObject.SetActive(false)))
            .Insert(0.1f, next.DOFade(1f, 0.2f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class TabSwitchCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform indicator;
    [SerializeField] RectTransform[] tabButtons;
    [SerializeField] CanvasGroup[] contents;

    int current;

    public void Select(int index)
    {
        if (index == current) return;
        StopAllCoroutines();
        StartCoroutine(Animate(index));
    }

    IEnumerator Animate(int index)
    {
        var prev = contents[current];
        var next = contents[index];
        current = index;

        next.gameObject.SetActive(true);
        next.alpha = 0f;

        float fromX = indicator.anchoredPosition.x;
        float toX = tabButtons[index].anchoredPosition.x;
        float t = 0f;
        while (t < 0.25f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.25f);
            float u = 1f - p;
            indicator.anchoredPosition = new Vector2(
                Mathf.Lerp(fromX, toX, 1f - u * u * u), indicator.anchoredPosition.y);
            prev.alpha = Mathf.Clamp01(1f - p / 0.48f);           // 0.12s で消える
            next.alpha = Mathf.Clamp01((p - 0.4f) / 0.6f / 0.8f); // 0.1s 遅れて出る
            yield return null;
        }
        prev.alpha = 0f;
        prev.gameObject.SetActive(false);
        next.alpha = 1f;
    }
}`,
    },
  });

  /* 6. ツールチップ */
  R({
    id: 'tooltip',
    interactive: true,
    title: 'ツールチップ',
    titleEn: 'Tooltip',
    category: 'widget',
    tags: ['hover', 'tooltip', 'delay', '補足'],
    description: 'ホバーから少し遅れて、フェード+わずかな上移動で表示する。遅延(0.4s程度)を入れることで、通りすがりのカーソルで出ない上品な挙動になる。',
    spec: {
      trigger: 'IPointerEnterHandler (delay 0.4s)',
      target: 'CanvasGroup.alpha + RectTransform.anchoredPosition.y',
      alpha: { from: 0, to: 1 },
      y: { from: '-6', to: 0 },
      duration: 0.2,
      ease: 'OutQuad',
      hide: '即時 (duration 0.1)',
    },
    preview(ctx, PV) {
      const target = PV.button(ctx, '?', { styles: { padding: '10px 18px' } });
      target.style.cursor = 'help';
      const tip = PV.el('mono', {
        position: 'absolute', bottom: 'calc(50% + 36px)', left: '50%',
        padding: '6px 12px', background: 'var(--pv-panel)', border: '1px solid var(--pv-accent)',
        fontSize: '9.5px', letterSpacing: '0.08em', color: 'var(--pv-text)',
        opacity: 0, whiteSpace: 'nowrap', pointerEvents: 'none',
      }, 'SP消費: 30 / CT: 12s');
      ctx.stage.appendChild(tip);
      let visible = false;
      const show = async () => {
        await ctx.wait(0.4);
        if (!visible) return;
        ctx.tween({
          duration: 0.2, ease: 'OutQuad',
          onUpdate: v => { tip.style.opacity = v; tip.style.transform = `translate(-50%, ${6 - 6 * v}px)`; },
        });
      };
      const hide = () => ctx.tween({ from: parseFloat(tip.style.opacity) || 0, to: 0, duration: 0.1, onUpdate: v => tip.style.opacity = v });
      target.addEventListener('mouseenter', () => { visible = true; show(); });
      target.addEventListener('mouseleave', () => { visible = false; hide(); });
      ctx.forever(async () => {
        await ctx.wait(1.0); visible = true; await show();
        await ctx.wait(1.2); visible = false; hide();
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using System.Collections;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

public class TooltipLitMotion : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] CanvasGroup tooltip;     // ツールチップ本体 (CanvasGroup付き)
    [SerializeField] RectTransform tooltipRect;
    [SerializeField] float delay = 0.4f;
    [SerializeField] float slideDistance = 6f;

    float shownY;
    MotionHandle fadeHandle, moveHandle;

    void Awake() => shownY = tooltipRect.anchoredPosition.y;
    void OnDestroy() => Cancel();

    void Cancel()
    {
        StopAllCoroutines();
        if (fadeHandle.IsActive()) fadeHandle.Cancel();
        if (moveHandle.IsActive()) moveHandle.Cancel();
    }

    public void OnPointerEnter(PointerEventData e) { Cancel(); StartCoroutine(ShowDelayed()); }
    public void OnPointerExit(PointerEventData e)
    {
        Cancel();
        fadeHandle = LMotion.Create(tooltip.alpha, 0f, 0.1f).BindToAlpha(tooltip);
    }

    IEnumerator ShowDelayed()
    {
        yield return new WaitForSeconds(delay);
        fadeHandle = LMotion.Create(0f, 1f, 0.2f)
            .WithEase(Ease.OutQuad)
            .BindToAlpha(tooltip);
        moveHandle = LMotion.Create(shownY - slideDistance, shownY, 0.2f)
            .WithEase(Ease.OutQuad)
            .BindToAnchoredPositionY(tooltipRect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;

public class TooltipDOTween : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] CanvasGroup tooltip;
    [SerializeField] RectTransform tooltipRect;
    [SerializeField] float delay = 0.4f;
    [SerializeField] float slideDistance = 6f;

    float shownY;
    Sequence seq;

    void Awake() => shownY = tooltipRect.anchoredPosition.y;
    void OnDestroy() => seq?.Kill();

    public void OnPointerEnter(PointerEventData e)
    {
        seq?.Kill();
        tooltip.alpha = 0f;
        tooltipRect.anchoredPosition = new Vector2(tooltipRect.anchoredPosition.x, shownY - slideDistance);
        seq = DOTween.Sequence()
            .AppendInterval(delay)   // ホバー継続時のみ表示する遅延
            .Append(tooltip.DOFade(1f, 0.2f).SetEase(Ease.OutQuad))
            .Join(tooltipRect.DOAnchorPosY(shownY, 0.2f).SetEase(Ease.OutQuad));
    }

    public void OnPointerExit(PointerEventData e)
    {
        seq?.Kill();
        seq = DOTween.Sequence().Append(tooltip.DOFade(0f, 0.1f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;

public class TooltipCoroutine : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] CanvasGroup tooltip;
    [SerializeField] RectTransform tooltipRect;
    [SerializeField] float delay = 0.4f;
    [SerializeField] float slideDistance = 6f;

    float shownY;

    void Awake() => shownY = tooltipRect.anchoredPosition.y;

    public void OnPointerEnter(PointerEventData e) { StopAllCoroutines(); StartCoroutine(Show()); }
    public void OnPointerExit(PointerEventData e) { StopAllCoroutines(); StartCoroutine(Hide()); }

    IEnumerator Show()
    {
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.2f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.2f);
            float e = 1f - (1f - p) * (1f - p);
            tooltip.alpha = e;
            tooltipRect.anchoredPosition = new Vector2(
                tooltipRect.anchoredPosition.x, Mathf.Lerp(shownY - slideDistance, shownY, e));
            yield return null;
        }
    }

    IEnumerator Hide()
    {
        float from = tooltip.alpha;
        float t = 0f;
        while (t < 0.1f)
        {
            t += Time.deltaTime;
            tooltip.alpha = Mathf.Lerp(from, 0f, Mathf.Clamp01(t / 0.1f));
            yield return null;
        }
    }
}`,
    },
  });

  /* 7. ドロップダウン */
  R({
    id: 'dropdown',
    interactive: true,
    title: 'ドロップダウン',
    titleEn: 'Dropdown',
    category: 'widget',
    tags: ['dropdown', 'select', 'scaleY', 'pivot'],
    description: 'pivotを上端に設定したパネルをscaleYで開く。中身の項目はわずかに遅れてフェード。pivot設定だけで「上から生える」動きになるのがポイント。',
    spec: {
      panel: { target: 'Transform.localScale.y (pivot.y = 1)', from: 0, to: 1, duration: 0.25, ease: 'OutCubic' },
      items: { target: 'CanvasGroup.alpha', delay: 0.08, duration: 0.15 },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { width: '150px', position: 'relative' });
      ctx.stage.appendChild(wrap);
      const head = PV.el('mono', {
        display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
        background: 'var(--pv-accent)', color: 'var(--pv-on-accent)', fontSize: '10px', fontWeight: '700',
        letterSpacing: '0.12em', cursor: 'pointer',
        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
      });
      head.appendChild(PV.el(null, null, 'SORT: LV', 'span'));
      head.appendChild(PV.el(null, null, '▾', 'span'));
      wrap.appendChild(head);
      const panel = PV.el(null, {
        position: 'absolute', top: 'calc(100% + 4px)', left: '0', right: '0',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        transformOrigin: 'top center', transform: 'scaleY(0)',
      });
      const items = ['LV順', 'レア度順', '入手順'].map(txt => {
        const it = PV.el(null, { padding: '7px 12px', fontSize: '10px', color: 'var(--pv-dim)', fontFamily: "'Noto Sans JP',sans-serif", opacity: 0, borderBottom: '1px solid var(--pv-line)' }, txt);
        panel.appendChild(it);
        return it;
      });
      wrap.appendChild(panel);
      let open = false;
      const toggle = () => {
        open = !open;
        if (open) {
          ctx.tween({ duration: 0.25, ease: 'OutCubic', onUpdate: v => panel.style.transform = `scaleY(${v})` });
          ctx.tween({ duration: 0.15, delay: 0.08, onUpdate: v => items.forEach(i => i.style.opacity = v) });
        } else {
          ctx.tween({ duration: 0.15, ease: 'InQuad', onUpdate: v => { panel.style.transform = `scaleY(${1 - v})`; items.forEach(i => i.style.opacity = 1 - v); } });
        }
      };
      head.addEventListener('click', toggle);
      ctx.forever(async () => { await ctx.wait(1.2); toggle(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class DropdownLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform panel;      // pivot.y = 1 に設定しておく
    [SerializeField] CanvasGroup itemsGroup;   // 項目全体のCanvasGroup

    bool isOpen;
    MotionHandle scaleHandle, fadeHandle;

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (scaleHandle.IsActive()) scaleHandle.Cancel();
        if (fadeHandle.IsActive()) fadeHandle.Cancel();
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        Cancel();
        if (isOpen)
        {
            panel.gameObject.SetActive(true);
            scaleHandle = LMotion.Create(new Vector3(1f, 0f, 1f), Vector3.one, 0.25f)
                .WithEase(Ease.OutCubic)
                .BindToLocalScale(panel);
            fadeHandle = LMotion.Create(0f, 1f, 0.15f)
                .WithDelay(0.08f)
                .BindToAlpha(itemsGroup);
        }
        else
        {
            scaleHandle = LMotion.Create(panel.localScale, new Vector3(1f, 0f, 1f), 0.15f)
                .WithEase(Ease.InQuad)
                .WithOnComplete(() => panel.gameObject.SetActive(false))
                .BindToLocalScale(panel);
            fadeHandle = LMotion.Create(itemsGroup.alpha, 0f, 0.12f)
                .BindToAlpha(itemsGroup);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DropdownDOTween : MonoBehaviour
{
    [SerializeField] RectTransform panel;      // pivot.y = 1 に設定しておく
    [SerializeField] CanvasGroup itemsGroup;

    bool isOpen;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle()
    {
        isOpen = !isOpen;
        seq?.Kill();
        if (isOpen)
        {
            panel.gameObject.SetActive(true);
            panel.localScale = new Vector3(1f, 0f, 1f);
            itemsGroup.alpha = 0f;
            seq = DOTween.Sequence()
                .Append(panel.DOScaleY(1f, 0.25f).SetEase(Ease.OutCubic))
                .Insert(0.08f, itemsGroup.DOFade(1f, 0.15f));
        }
        else
        {
            seq = DOTween.Sequence()
                .Append(panel.DOScaleY(0f, 0.15f).SetEase(Ease.InQuad))
                .Join(itemsGroup.DOFade(0f, 0.12f))
                .OnComplete(() => panel.gameObject.SetActive(false));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DropdownCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform panel;      // pivot.y = 1 に設定しておく
    [SerializeField] CanvasGroup itemsGroup;

    bool isOpen;

    public void Toggle()
    {
        isOpen = !isOpen;
        StopAllCoroutines();
        StartCoroutine(isOpen ? Open() : Close());
    }

    IEnumerator Open()
    {
        panel.gameObject.SetActive(true);
        itemsGroup.alpha = 0f;
        float t = 0f;
        while (t < 0.25f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.25f);
            float u = 1f - p;
            panel.localScale = new Vector3(1f, 1f - u * u * u, 1f); // OutCubic
            if (t > 0.08f)
                itemsGroup.alpha = Mathf.Clamp01((t - 0.08f) / 0.15f);
            yield return null;
        }
        panel.localScale = Vector3.one;
        itemsGroup.alpha = 1f;
    }

    IEnumerator Close()
    {
        float fromY = panel.localScale.y;
        float t = 0f;
        while (t < 0.15f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.15f);
            panel.localScale = new Vector3(1f, Mathf.Lerp(fromY, 0f, p * p), 1f);
            itemsGroup.alpha = 1f - p;
            yield return null;
        }
        panel.gameObject.SetActive(false);
    }
}`,
    },
  });

  /* 8. FABメニュー展開 */
  R({
    id: 'fab-menu',
    interactive: true,
    title: 'FABメニュー展開',
    titleEn: 'FAB Menu Expand',
    category: 'widget',
    tags: ['fab', 'stagger', 'menu', '展開'],
    description: 'メインボタンが45°回転して「+」→「×」になり、子ボタンが時間差(stagger)でOutBack出現する。時間差が「湧き出る」気持ちよさを生む。',
    spec: {
      main: { target: 'Transform.localEulerAngles.z', from: 0, to: 45, duration: 0.25, ease: 'OutBack' },
      children: {
        target: 'Transform.localScale + anchoredPosition',
        scale: { from: 0, to: 1 },
        duration: 0.3, ease: 'OutBack',
        stagger: 0.06,
      },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'absolute', right: '20px', bottom: '16px', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '8px' });
      ctx.stage.appendChild(wrap);
      const main = PV.el(null, {
        width: '42px', height: '42px', background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px', fontWeight: '700', cursor: 'pointer',
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        userSelect: 'none',
      }, '+');
      wrap.appendChild(main); // column-reverseのためmainを先頭に置くと最下部に表示される
      const kids = ['A', 'B', 'C'].map(l => {
        const k = PV.el('mono', {
          width: '30px', height: '30px', background: 'var(--pv-panel)', border: '1px solid var(--pv-accent)',
          color: 'var(--pv-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', transform: 'scale(0)',
          clipPath: 'polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)',
        }, l);
        wrap.appendChild(k);
        return k;
      });
      let open = false;
      const toggle = () => {
        open = !open;
        ctx.tween({ duration: 0.25, ease: 'OutBack', onUpdate: v => main.style.transform = `rotate(${(open ? v : 1 - v) * 45}deg)` });
        kids.forEach((k, i) => {
          ctx.tween({
            duration: open ? 0.3 : 0.15,
            delay: open ? i * 0.06 : (kids.length - 1 - i) * 0.04,
            ease: open ? 'OutBack' : 'InQuad',
            onUpdate: v => k.style.transform = `scale(${open ? v : 1 - v})`,
          });
        });
      };
      main.addEventListener('click', toggle);
      ctx.forever(async () => { await ctx.wait(1.3); toggle(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class FabMenuLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform mainButton;
    [SerializeField] RectTransform[] childButtons;
    [SerializeField] float staggerDelay = 0.06f;

    bool isOpen;
    MotionHandle mainHandle;
    MotionHandle[] childHandles;

    void Awake() => childHandles = new MotionHandle[childButtons.Length];
    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (mainHandle.IsActive()) mainHandle.Cancel();
        for (int i = 0; i < childHandles.Length; i++)
            if (childHandles[i].IsActive()) childHandles[i].Cancel();
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        Cancel();

        mainHandle = LMotion.Create(mainButton.localEulerAngles.z, isOpen ? 45f : 0f, 0.25f)
            .WithEase(Ease.OutBack)
            .Bind(z => mainButton.localEulerAngles = new Vector3(0f, 0f, z));

        for (int i = 0; i < childButtons.Length; i++)
        {
            var child = childButtons[i];
            if (isOpen)
            {
                child.gameObject.SetActive(true);
                childHandles[i] = LMotion.Create(Vector3.zero, Vector3.one, 0.3f)
                    .WithEase(Ease.OutBack)
                    .WithDelay(i * staggerDelay)
                    .BindToLocalScale(child);
            }
            else
            {
                var target = child;
                childHandles[i] = LMotion.Create(child.localScale, Vector3.zero, 0.15f)
                    .WithEase(Ease.InQuad)
                    .WithDelay((childButtons.Length - 1 - i) * 0.04f)
                    .WithOnComplete(() => target.gameObject.SetActive(false))
                    .BindToLocalScale(child);
            }
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class FabMenuDOTween : MonoBehaviour
{
    [SerializeField] RectTransform mainButton;
    [SerializeField] RectTransform[] childButtons;
    [SerializeField] float staggerDelay = 0.06f;

    bool isOpen;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle()
    {
        isOpen = !isOpen;
        seq?.Kill();
        seq = DOTween.Sequence();

        seq.Join(mainButton.DOLocalRotate(new Vector3(0f, 0f, isOpen ? 45f : 0f), 0.25f)
            .SetEase(Ease.OutBack));

        for (int i = 0; i < childButtons.Length; i++)
        {
            var child = childButtons[i];
            if (isOpen)
            {
                child.gameObject.SetActive(true);
                child.localScale = Vector3.zero;
                seq.Insert(i * staggerDelay,
                    child.DOScale(Vector3.one, 0.3f).SetEase(Ease.OutBack));
            }
            else
            {
                var target = child;
                seq.Insert((childButtons.Length - 1 - i) * 0.04f,
                    child.DOScale(Vector3.zero, 0.15f).SetEase(Ease.InQuad)
                        .OnComplete(() => target.gameObject.SetActive(false)));
            }
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class FabMenuCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform mainButton;
    [SerializeField] RectTransform[] childButtons;
    [SerializeField] float staggerDelay = 0.06f;

    bool isOpen;

    public void Toggle()
    {
        isOpen = !isOpen;
        StopAllCoroutines();
        StartCoroutine(RotateMain());
        for (int i = 0; i < childButtons.Length; i++)
        {
            float delay = isOpen ? i * staggerDelay : (childButtons.Length - 1 - i) * 0.04f;
            StartCoroutine(ScaleChild(childButtons[i], delay));
        }
    }

    IEnumerator RotateMain()
    {
        float from = mainButton.localEulerAngles.z;
        float to = isOpen ? 45f : 0f;
        float t = 0f;
        while (t < 0.25f)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / 0.25f));
            mainButton.localEulerAngles = new Vector3(0f, 0f, Mathf.LerpAngle(from, to, e));
            yield return null;
        }
    }

    IEnumerator ScaleChild(RectTransform child, float delay)
    {
        yield return new WaitForSeconds(delay);
        if (isOpen) child.gameObject.SetActive(true);
        Vector3 from = child.localScale;
        Vector3 to = isOpen ? Vector3.one : Vector3.zero;
        float duration = isOpen ? 0.3f : 0.15f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = isOpen ? OutBack(p) : p * p;
            child.localScale = Vector3.LerpUnclamped(from, to, e);
            yield return null;
        }
        if (!isOpen) child.gameObject.SetActive(false);
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

  /* 9. ページ遷移ワイプ */
  R({
    id: 'page-wipe',
    title: 'ページ遷移ワイプ',
    titleEn: 'Page Transition Wipe',
    category: 'widget',
    tags: ['transition', 'wipe', '画面遷移', '演出'],
    description: '斜めのパネルが画面を横切り、覆われている間にシーンを切り替える。SF風UIの画面遷移演出。覆う→切替→開くの3段構成。',
    spec: {
      target: '全画面ワイプパネル RectTransform.anchoredPosition.x',
      phase1_cover: { from: '-画面幅*1.5', to: 0, duration: 0.3, ease: 'InOutCubic' },
      phase2_switch: 'ワイプで隠れている間にシーン/画面を切替',
      phase3_reveal: { from: 0, to: '+画面幅*1.5', duration: 0.3, ease: 'InOutCubic', delay: 0.15 },
      note: 'パネルは平行四辺形にすると斜めワイプになる',
    },
    preview(ctx, PV) {
      const screenA = PV.el('mono', {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', letterSpacing: '0.25em', color: 'var(--pv-dim)',
      }, 'SCREEN A');
      const screenB = PV.el('mono', {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', letterSpacing: '0.25em', color: 'var(--pv-accent)', opacity: 0,
      }, 'SCREEN B');
      ctx.stage.appendChild(screenA); ctx.stage.appendChild(screenB);
      const wipe = PV.el(null, {
        position: 'absolute', top: '0', bottom: '0', width: '160%', left: '-30%',
        background: 'linear-gradient(100deg, var(--pv-accent) 0%, var(--pv-accent) 82%, var(--pv-on-accent) 82%, var(--pv-on-accent) 86%, var(--pv-accent) 86%)',
        transform: 'translateX(-120%) skewX(-12deg)',
      });
      ctx.stage.appendChild(wipe);
      let showingA = true;
      ctx.forever(async () => {
        await ctx.wait(1.2);
        await ctx.tween({ duration: 0.3, ease: 'InOutCubic', onUpdate: v => wipe.style.transform = `translateX(${-120 + 120 * v}%) skewX(-12deg)` });
        showingA = !showingA;
        screenA.style.opacity = showingA ? 1 : 0;
        screenB.style.opacity = showingA ? 0 : 1;
        await ctx.wait(0.15);
        await ctx.tween({ duration: 0.3, ease: 'InOutCubic', onUpdate: v => wipe.style.transform = `translateX(${120 * v}%) skewX(-12deg)` });
        wipe.style.transform = 'translateX(-120%) skewX(-12deg)';
      });
    },
    code: {
      litmotion: `
using System;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class PageWipeLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform wipePanel;   // 全画面を覆うパネル (Canvas最前面)
    [SerializeField] float screenWidth = 1920f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    /// <summary>onCovered: 画面が完全に覆われた瞬間に呼ばれる(ここでシーン切替)</summary>
    public void Play(Action onCovered)
    {
        if (handle.IsActive()) handle.Cancel();
        float w = screenWidth * 1.5f;
        wipePanel.gameObject.SetActive(true);

        handle = LSequence.Create()
            .Append(LMotion.Create(-w, 0f, 0.3f)
                .WithEase(Ease.InOutCubic)
                .WithOnComplete(() => onCovered?.Invoke())
                .BindToAnchoredPositionX(wipePanel))
            .AppendInterval(0.15f)
            .Append(LMotion.Create(0f, w, 0.3f)
                .WithEase(Ease.InOutCubic)
                .BindToAnchoredPositionX(wipePanel))
            .Run();
    }
}`,
      dotween: `
using System;
using DG.Tweening;
using UnityEngine;

public class PageWipeDOTween : MonoBehaviour
{
    [SerializeField] RectTransform wipePanel;
    [SerializeField] float screenWidth = 1920f;

    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Play(Action onCovered)
    {
        seq?.Kill();
        float w = screenWidth * 1.5f;
        wipePanel.gameObject.SetActive(true);
        wipePanel.anchoredPosition = new Vector2(-w, 0f);

        seq = DOTween.Sequence()
            .Append(wipePanel.DOAnchorPosX(0f, 0.3f).SetEase(Ease.InOutCubic))
            .AppendCallback(() => onCovered?.Invoke())
            .AppendInterval(0.15f)
            .Append(wipePanel.DOAnchorPosX(w, 0.3f).SetEase(Ease.InOutCubic))
            .OnComplete(() => wipePanel.gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System;
using System.Collections;
using UnityEngine;

public class PageWipeCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform wipePanel;
    [SerializeField] float screenWidth = 1920f;

    public void Play(Action onCovered)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(onCovered));
    }

    IEnumerator Animate(Action onCovered)
    {
        float w = screenWidth * 1.5f;
        wipePanel.gameObject.SetActive(true);

        yield return Move(-w, 0f, 0.3f);
        onCovered?.Invoke();
        yield return new WaitForSeconds(0.15f);
        yield return Move(0f, w, 0.3f);

        wipePanel.gameObject.SetActive(false);
    }

    IEnumerator Move(float fromX, float toX, float duration)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f; // InOutCubic
            wipePanel.anchoredPosition = new Vector2(Mathf.Lerp(fromX, toX, e), 0f);
            yield return null;
        }
    }
}`,
    },
  });
})();
