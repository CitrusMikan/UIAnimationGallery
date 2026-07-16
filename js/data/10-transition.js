/* 10-transition.js — 画面遷移・Material (4種)
 * Material Design 3 のトランジションパターン。ゲームの画面遷移に。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. コンテナトランスフォーム */
  R({
    id: 'container-transform',
    title: 'コンテナトランスフォーム',
    titleEn: 'Container Transform',
    category: 'transition',
    tags: ['shared-element', 'morph', 'MD3', 'アイテム→詳細'],
    description: 'カードが位置とサイズを保ったまま詳細パネルへ「伸びて」変形する共有要素トランジション。アイテム一覧→詳細画面など、要素の連続性を保つMD3の代表的な遷移。中身はクロスフェードで入れ替える。',
    spec: {
      target: 'RectTransform.anchoredPosition + sizeDelta + 中身のCanvasGroup.alpha',
      duration: 0.45,
      ease: 'InOutCubic (MD3 emphasized相当)',
      note: 'ソース矩形→ターゲット矩形へ補間しつつ、旧中身を消し新中身を出す',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'absolute', inset: '0' });
      ctx.stage.appendChild(wrap);
      const card = PV.el(null, {
        position: 'absolute', boxSizing: 'border-box',
        background: 'linear-gradient(160deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-accent)',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      });
      wrap.appendChild(card);
      const front = PV.el('mono', { position: 'absolute', top: '8px', left: '10px', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--pv-accent)' }, 'CARD');
      card.appendChild(front);
      const detail = PV.el(null, { position: 'absolute', left: '12px', right: '12px', top: '30px', display: 'flex', flexDirection: 'column', gap: '7px', opacity: 0 });
      ['ITEM DETAIL', 'ATK +15  DEF +8', 'RARITY ★★★★'].forEach((t, i) => {
        detail.appendChild(PV.el('mono', { fontSize: i === 0 ? '11px' : '9px', color: i === 0 ? 'var(--pv-accent)' : 'var(--pv-dim)', letterSpacing: '0.08em' }, t));
      });
      card.appendChild(detail);
      const setRect = t => {
        card.style.left = lerp(32, 8, t) + '%';
        card.style.top = lerp(30, 12, t) + '%';
        card.style.width = lerp(38, 84, t) + '%';
        card.style.height = lerp(42, 76, t) + '%';
        front.style.opacity = 1 - Math.min(t * 2.5, 1);
        detail.style.opacity = Math.max((t - 0.45) / 0.55, 0);
      };
      ctx.forever(async () => {
        setRect(0);
        await ctx.wait(0.5);
        await ctx.tween({ duration: 0.45, ease: 'InOutCubic', onUpdate: setRect });
        await ctx.wait(1.3);
        await ctx.tween({ duration: 0.4, ease: 'InOutCubic', onUpdate: v => setRect(1 - v) });
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// カード(source)を詳細(target)の矩形へ伸ばしつつ中身をクロスフェードする
public class ContainerTransformLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform container;   // 変形する器
    [SerializeField] CanvasGroup cardContent;   // カード側の中身
    [SerializeField] CanvasGroup detailContent; // 詳細側の中身
    [SerializeField] Vector2 targetPos;
    [SerializeField] Vector2 targetSize;
    [SerializeField] float duration = 0.45f;

    Vector2 sourcePos, sourceSize;

    void Awake()
    {
        sourcePos = container.anchoredPosition;
        sourceSize = container.sizeDelta;
    }

    public void Expand()
    {
        LMotion.Create(container.anchoredPosition, targetPos, duration)
            .WithEase(Ease.InOutCubic).BindToAnchoredPosition(container);
        LMotion.Create(container.sizeDelta, targetSize, duration)
            .WithEase(Ease.InOutCubic).BindToSizeDelta(container);
        LMotion.Create(1f, 0f, duration * 0.4f).BindToAlpha(cardContent);
        LMotion.Create(0f, 1f, duration * 0.6f).WithDelay(duration * 0.4f).BindToAlpha(detailContent);
    }

    public void Collapse()
    {
        LMotion.Create(container.anchoredPosition, sourcePos, duration)
            .WithEase(Ease.InOutCubic).BindToAnchoredPosition(container);
        LMotion.Create(container.sizeDelta, sourceSize, duration)
            .WithEase(Ease.InOutCubic).BindToSizeDelta(container);
        LMotion.Create(detailContent.alpha, 0f, duration * 0.4f).BindToAlpha(detailContent);
        LMotion.Create(0f, 1f, duration * 0.6f).WithDelay(duration * 0.4f).BindToAlpha(cardContent);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ContainerTransformDOTween : MonoBehaviour
{
    [SerializeField] RectTransform container;
    [SerializeField] CanvasGroup cardContent;
    [SerializeField] CanvasGroup detailContent;
    [SerializeField] Vector2 targetPos;
    [SerializeField] Vector2 targetSize;
    [SerializeField] float duration = 0.45f;

    Vector2 sourcePos, sourceSize;
    Sequence seq;

    void Awake()
    {
        sourcePos = container.anchoredPosition;
        sourceSize = container.sizeDelta;
    }

    void OnDestroy() => seq?.Kill();

    public void Expand() => Morph(targetPos, targetSize, cardContent, detailContent);
    public void Collapse() => Morph(sourcePos, sourceSize, detailContent, cardContent);

    void Morph(Vector2 pos, Vector2 size, CanvasGroup outCg, CanvasGroup inCg)
    {
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(container.DOAnchorPos(pos, duration).SetEase(Ease.InOutCubic))
            .Join(container.DOSizeDelta(size, duration).SetEase(Ease.InOutCubic))
            .Join(outCg.DOFade(0f, duration * 0.4f))
            .Insert(duration * 0.4f, inCg.DOFade(1f, duration * 0.6f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ContainerTransformCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform container;
    [SerializeField] CanvasGroup cardContent;
    [SerializeField] CanvasGroup detailContent;
    [SerializeField] Vector2 targetPos;
    [SerializeField] Vector2 targetSize;
    [SerializeField] float duration = 0.45f;

    Vector2 sourcePos, sourceSize;

    void Awake()
    {
        sourcePos = container.anchoredPosition;
        sourceSize = container.sizeDelta;
    }

    public void Expand() { StopAllCoroutines(); StartCoroutine(Morph(targetPos, targetSize, cardContent, detailContent)); }
    public void Collapse() { StopAllCoroutines(); StartCoroutine(Morph(sourcePos, sourceSize, detailContent, cardContent)); }

    IEnumerator Morph(Vector2 pos, Vector2 size, CanvasGroup outCg, CanvasGroup inCg)
    {
        Vector2 fromP = container.anchoredPosition, fromS = container.sizeDelta;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f; // InOutCubic
            container.anchoredPosition = Vector2.LerpUnclamped(fromP, pos, e);
            container.sizeDelta = Vector2.LerpUnclamped(fromS, size, e);
            outCg.alpha = Mathf.Clamp01(1f - p / 0.4f);
            inCg.alpha = Mathf.Clamp01((p - 0.4f) / 0.6f);
            yield return null;
        }
        container.anchoredPosition = pos; container.sizeDelta = size;
        outCg.alpha = 0f; inCg.alpha = 1f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Container {
    transition: width 450ms ease-in-out-cubic, height 450ms ease-in-out-cubic,
                left 450ms ease-in-out-cubic, top 450ms ease-in-out-cubic;
}
#CardContent   { transition: opacity 180ms ease-out; }
#DetailContent { opacity: 0; transition: opacity 270ms ease-out 180ms; }
#Container.expanded #CardContent   { opacity: 0; }
#Container.expanded #DetailContent { opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ContainerTransformUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2 targetPos = new Vector2(20, 20);
    [SerializeField] Vector2 targetSize = new Vector2(400, 300);
    VisualElement container;
    Vector2 sourcePos, sourceSize;

    void OnEnable()
    {
        container = document.rootVisualElement.Q<VisualElement>("Container");
        sourcePos = new Vector2(container.resolvedStyle.left, container.resolvedStyle.top);
        sourceSize = container.layout.size;
    }

    public void Expand()
    {
        container.style.left = targetPos.x; container.style.top = targetPos.y;
        container.style.width = targetSize.x; container.style.height = targetSize.y;
        container.AddToClassList("expanded");
    }

    public void Collapse()
    {
        container.style.left = sourcePos.x; container.style.top = sourcePos.y;
        container.style.width = sourceSize.x; container.style.height = sourceSize.y;
        container.RemoveFromClassList("expanded");
    }
}`,
    },
  });

  /* 2. シェアドアクシス */
  R({
    id: 'shared-axis',
    title: 'シェアドアクシス',
    titleEn: 'Shared Axis',
    category: 'transition',
    tags: ['navigation', 'slide', 'MD3', '画面遷移'],
    description: '共通の軸(X/Y/Z)に沿って、旧画面がスライド+フェードで去り、新画面が反対から入る協調的な画面遷移。前後関係のあるナビ(次へ/戻る、ステップ移動)に。Z軸版はスケールで奥行きを表す。',
    spec: {
      target: '2画面の RectTransform.anchoredPosition.x + CanvasGroup.alpha',
      distance: 30,
      duration: 0.3,
      ease: 'InOutCubic (emphasized)',
      variants: 'X=横スライド / Y=縦スライド / Z=スケール(0.8↔1)',
    },
    preview(ctx, PV) {
      const mk = (txt, color) => {
        const s = PV.el('mono', {
          position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', letterSpacing: '0.2em', color,
        }, txt);
        ctx.stage.appendChild(s);
        return s;
      };
      const a = mk('SCREEN A', 'var(--pv-accent)');
      const b = mk('SCREEN B', '#7ee2ff');
      const D = 40;
      let showA = true;
      const setB = (out, incoming, p) => {}; // placeholder
      ctx.forever(async () => {
        // A → B
        await ctx.wait(1.2);
        await ctx.tween({
          duration: 0.3, ease: 'InOutCubic',
          onUpdate: p => {
            a.style.transform = `translateX(${-D * p}px)`; a.style.opacity = 1 - p;
            b.style.transform = `translateX(${D * (1 - p)}px)`; b.style.opacity = p;
          },
        });
        // B → A
        await ctx.wait(1.2);
        await ctx.tween({
          duration: 0.3, ease: 'InOutCubic',
          onUpdate: p => {
            b.style.transform = `translateX(${-D * p}px)`; b.style.opacity = 1 - p;
            a.style.transform = `translateX(${D * (1 - p)}px)`; a.style.opacity = p;
          },
        });
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 共通の横軸に沿って旧画面を送り出し、新画面を反対から入れる (X軸版)
public class SharedAxisLitMotion : MonoBehaviour
{
    [SerializeField] float distance = 30f;
    [SerializeField] float duration = 0.3f;

    public void Transition(RectTransform outgoing, CanvasGroup outCg,
                           RectTransform incoming, CanvasGroup inCg, bool forward)
    {
        float dir = forward ? 1f : -1f;
        incoming.gameObject.SetActive(true);
        incoming.anchoredPosition = new Vector2(distance * dir, incoming.anchoredPosition.y);

        LMotion.Create(0f, -distance * dir, duration).WithEase(Ease.InOutCubic).BindToAnchoredPositionX(outgoing);
        LMotion.Create(1f, 0f, duration).WithOnComplete(() => outgoing.gameObject.SetActive(false)).BindToAlpha(outCg);
        LMotion.Create(distance * dir, 0f, duration).WithEase(Ease.InOutCubic).BindToAnchoredPositionX(incoming);
        LMotion.Create(0f, 1f, duration).BindToAlpha(inCg);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class SharedAxisDOTween : MonoBehaviour
{
    [SerializeField] float distance = 30f;
    [SerializeField] float duration = 0.3f;

    public void Transition(RectTransform outgoing, CanvasGroup outCg,
                           RectTransform incoming, CanvasGroup inCg, bool forward)
    {
        float dir = forward ? 1f : -1f;
        incoming.gameObject.SetActive(true);
        incoming.anchoredPosition = new Vector2(distance * dir, incoming.anchoredPosition.y);
        inCg.alpha = 0f;

        DOTween.Sequence()
            .Join(outgoing.DOAnchorPosX(-distance * dir, duration).SetEase(Ease.InOutCubic))
            .Join(outCg.DOFade(0f, duration))
            .Join(incoming.DOAnchorPosX(0f, duration).SetEase(Ease.InOutCubic))
            .Join(inCg.DOFade(1f, duration))
            .OnComplete(() => outgoing.gameObject.SetActive(false));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SharedAxisCoroutine : MonoBehaviour
{
    [SerializeField] float distance = 30f;
    [SerializeField] float duration = 0.3f;

    public void Transition(RectTransform outgoing, CanvasGroup outCg,
                           RectTransform incoming, CanvasGroup inCg, bool forward)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(outgoing, outCg, incoming, inCg, forward ? 1f : -1f));
    }

    IEnumerator Animate(RectTransform outg, CanvasGroup outCg, RectTransform inc, CanvasGroup inCg, float dir)
    {
        inc.gameObject.SetActive(true);
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f;
            outg.anchoredPosition = new Vector2(Mathf.Lerp(0f, -distance * dir, e), outg.anchoredPosition.y);
            inc.anchoredPosition = new Vector2(Mathf.Lerp(distance * dir, 0f, e), inc.anchoredPosition.y);
            outCg.alpha = 1f - p;
            inCg.alpha = p;
            yield return null;
        }
        outg.gameObject.SetActive(false);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.screen {
    transition: translate 300ms ease-in-out-cubic, opacity 300ms ease-in-out-cubic;
}
/* 前へ: 旧は左へ去り、新は右から入る */
.screen.out-left  { translate: -30px 0; opacity: 0; }
.screen.in-right  { translate: 30px 0;  opacity: 0; }
.screen.active    { translate: 0 0;     opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SharedAxisUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Transition(string outgoingName, string incomingName)
    {
        var root = document.rootVisualElement;
        var outgoing = root.Q<VisualElement>(outgoingName);
        var incoming = root.Q<VisualElement>(incomingName);

        outgoing.RemoveFromClassList("active");
        outgoing.AddToClassList("out-left");

        incoming.style.display = DisplayStyle.Flex;
        incoming.AddToClassList("in-right");
        incoming.schedule.Execute(() =>
        {
            incoming.RemoveFromClassList("in-right");
            incoming.AddToClassList("active");
        });
    }
}`,
    },
  });

  /* 3. フェードスルー */
  R({
    id: 'fade-through',
    title: 'フェードスルー',
    titleEn: 'Fade Through',
    category: 'transition',
    tags: ['crossfade', 'scale', 'MD3', '切替'],
    description: '前後関係のない内容を入れ替える遷移。旧要素がフェードアウトし、新要素がわずかに拡大(0.92→1)しながらフェードイン。ボトムナビのタブ内容切替やフィルタ変更など、空間的なつながりが無い切替に。',
    spec: {
      out: { alpha: '1→0', duration: 0.09 },
      in: { alpha: '0→1', scale: '0.92→1', duration: 0.21, delay: 0.06 },
      ease: 'OutCubic',
    },
    preview(ctx, PV) {
      const mk = (txt, color) => {
        const s = PV.el('mono', { position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', letterSpacing: '0.15em', color }, txt);
        ctx.stage.appendChild(s);
        return s;
      };
      const views = [mk('VIEW 1', 'var(--pv-accent)'), mk('VIEW 2', '#7ee2ff'), mk('VIEW 3', '#b98cff')];
      views.forEach((v, i) => { v.style.opacity = i === 0 ? 1 : 0; });
      let cur = 0;
      ctx.forever(async () => {
        await ctx.wait(1.2);
        const from = views[cur], to = views[(cur + 1) % 3];
        cur = (cur + 1) % 3;
        await ctx.tween({ duration: 0.09, onUpdate: p => from.style.opacity = 1 - p });
        to.style.transform = 'scale(0.92)';
        await ctx.tween({
          duration: 0.21, ease: 'OutCubic',
          onUpdate: p => { to.style.opacity = p; to.style.transform = `scale(${lerp(0.92, 1, p)})`; },
        });
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 空間的つながりの無い内容の入れ替え (旧を消し、新を拡大しながら出す)
public class FadeThroughLitMotion : MonoBehaviour
{
    public void Switch(CanvasGroup outgoing, GameObject outObj, CanvasGroup incoming, RectTransform inRect)
    {
        LMotion.Create(1f, 0f, 0.09f)
            .WithOnComplete(() => outObj.SetActive(false))
            .BindToAlpha(outgoing);

        incoming.gameObject.SetActive(true);
        incoming.alpha = 0f;
        inRect.localScale = Vector3.one * 0.92f;
        LMotion.Create(0f, 1f, 0.21f).WithDelay(0.06f).WithEase(Ease.OutCubic).BindToAlpha(incoming);
        LMotion.Create(Vector3.one * 0.92f, Vector3.one, 0.21f).WithDelay(0.06f).WithEase(Ease.OutCubic).BindToLocalScale(inRect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class FadeThroughDOTween : MonoBehaviour
{
    public void Switch(CanvasGroup outgoing, GameObject outObj, CanvasGroup incoming, RectTransform inRect)
    {
        incoming.gameObject.SetActive(true);
        incoming.alpha = 0f;
        inRect.localScale = Vector3.one * 0.92f;

        DOTween.Sequence()
            .Append(outgoing.DOFade(0f, 0.09f).OnComplete(() => outObj.SetActive(false)))
            .AppendInterval(-0.03f)
            .Append(incoming.DOFade(1f, 0.21f).SetEase(Ease.OutCubic))
            .Join(inRect.DOScale(1f, 0.21f).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class FadeThroughCoroutine : MonoBehaviour
{
    public void Switch(CanvasGroup outgoing, GameObject outObj, CanvasGroup incoming, RectTransform inRect)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(outgoing, outObj, incoming, inRect));
    }

    IEnumerator Animate(CanvasGroup outCg, GameObject outObj, CanvasGroup inCg, RectTransform inRect)
    {
        float t = 0f;
        while (t < 0.09f) { t += Time.deltaTime; outCg.alpha = 1f - Mathf.Clamp01(t / 0.09f); yield return null; }
        outObj.SetActive(false);

        inCg.gameObject.SetActive(true);
        t = 0f;
        while (t < 0.21f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.21f);
            float e = 1f - Mathf.Pow(1f - p, 3f); // OutCubic
            inCg.alpha = e;
            inRect.localScale = Vector3.one * Mathf.Lerp(0.92f, 1f, e);
            yield return null;
        }
        inRect.localScale = Vector3.one;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.ft-view {
    opacity: 0;
    scale: 0.92 0.92;
    display: none;
    transition: opacity 210ms ease-out, scale 210ms ease-out;
}
.ft-view.active {
    opacity: 1;
    scale: 1 1;
    display: flex;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class FadeThroughUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Switch(string outName, string inName)
    {
        var root = document.rootVisualElement;
        var outgoing = root.Q<VisualElement>(outName);
        var incoming = root.Q<VisualElement>(inName);

        outgoing.RemoveFromClassList("active");   // フェードアウト
        // 旧が消えかけたころに新をフェードイン
        incoming.schedule.Execute(() => incoming.AddToClassList("active")).ExecuteLater(60);
    }
}`,
    },
  });

  /* 4. ボトムシート */
  R({
    id: 'bottom-sheet',
    interactive: true,
    title: 'ボトムシート',
    titleEn: 'Bottom Sheet',
    category: 'transition',
    tags: ['sheet', 'slide-up', 'MD3', 'メニュー'],
    description: '画面下部からシートがせり上がり、背後にスクリム(暗幕)がかかる。装備選択・アクション一覧・詳細メニューなどモバイルゲームの操作パネルに。減速イージングで「すっと止まる」のがMD3流。プレビューはハンドルをクリックで開閉。',
    spec: {
      sheet: { target: 'RectTransform.anchoredPosition.y', hidden: '-シート高', shown: 0, duration: 0.35, ease: 'OutCubic (decelerate)' },
      scrim: { target: 'CanvasGroup.alpha', from: 0, to: 0.5, duration: 0.35 },
      close: 'ease: InCubic (accelerate)',
    },
    preview(ctx, PV) {
      const scrim = PV.el(null, { position: 'absolute', inset: '0', background: '#000', opacity: 0 });
      ctx.stage.appendChild(scrim);
      const H = 120;
      const sheet = PV.el(null, {
        position: 'absolute', left: '14px', right: '14px', bottom: '0', height: H + 'px',
        background: 'var(--pv-panel)', borderTop: '2px solid var(--pv-accent)',
        clipPath: 'polygon(14px 0,100% 0,100% 100%,0 100%,0 14px)',
        transform: `translateY(${H}px)`, cursor: 'pointer', padding: '10px 14px',
      });
      const grip = PV.el(null, { width: '36px', height: '4px', background: 'var(--pv-dim)', margin: '0 auto 10px' });
      sheet.appendChild(grip);
      ['装備する', '強化する', '売却する'].forEach(t => {
        sheet.appendChild(PV.el('mono', { fontSize: '10px', color: 'var(--pv-text)', padding: '6px 4px', borderBottom: '1px solid var(--pv-line)', letterSpacing: '0.06em', fontFamily: "'Noto Sans JP',sans-serif" }, t));
      });
      ctx.stage.appendChild(sheet);
      let open = false, y = H;
      const toggle = () => {
        open = !open;
        const from = y, to = open ? 0 : H;
        ctx.tween({ duration: open ? 0.35 : 0.28, ease: open ? 'OutCubic' : 'InCubic', onUpdate: v => { y = lerp(from, to, v); sheet.style.transform = `translateY(${y}px)`; } });
        ctx.tween({ duration: 0.32, onUpdate: v => scrim.style.opacity = lerp(open ? 0 : 0.45, open ? 0.45 : 0, v) });
      };
      sheet.addEventListener('click', toggle);
      scrim.addEventListener('click', () => { if (open) toggle(); });
      ctx.forever(async () => { await ctx.wait(1.4); toggle(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class BottomSheetLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform sheet;   // 下端アンカーのシート
    [SerializeField] CanvasGroup scrim;
    [SerializeField] float sheetHeight = 600f;

    bool isOpen;

    public void Toggle() { if (isOpen) Close(); else Open(); }

    public void Open()
    {
        isOpen = true;
        LMotion.Create(sheet.anchoredPosition.y, 0f, 0.35f)
            .WithEase(Ease.OutCubic).BindToAnchoredPositionY(sheet);   // 減速で止まる
        LMotion.Create(scrim.alpha, 0.5f, 0.35f).BindToAlpha(scrim);
    }

    public void Close()
    {
        isOpen = false;
        LMotion.Create(sheet.anchoredPosition.y, -sheetHeight, 0.28f)
            .WithEase(Ease.InCubic).BindToAnchoredPositionY(sheet);    // 加速で去る
        LMotion.Create(scrim.alpha, 0f, 0.28f).BindToAlpha(scrim);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class BottomSheetDOTween : MonoBehaviour
{
    [SerializeField] RectTransform sheet;
    [SerializeField] CanvasGroup scrim;
    [SerializeField] float sheetHeight = 600f;

    bool isOpen;
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Toggle() { if (isOpen) Close(); else Open(); }

    public void Open()
    {
        isOpen = true;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(sheet.DOAnchorPosY(0f, 0.35f).SetEase(Ease.OutCubic))
            .Join(scrim.DOFade(0.5f, 0.35f));
    }

    public void Close()
    {
        isOpen = false;
        seq?.Kill();
        seq = DOTween.Sequence()
            .Join(sheet.DOAnchorPosY(-sheetHeight, 0.28f).SetEase(Ease.InCubic))
            .Join(scrim.DOFade(0f, 0.28f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class BottomSheetCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform sheet;
    [SerializeField] CanvasGroup scrim;
    [SerializeField] float sheetHeight = 600f;

    bool isOpen;

    public void Toggle()
    {
        isOpen = !isOpen;
        StopAllCoroutines();
        StartCoroutine(Animate(isOpen));
    }

    IEnumerator Animate(bool open)
    {
        float duration = open ? 0.35f : 0.28f;
        float fromY = sheet.anchoredPosition.y, toY = open ? 0f : -sheetHeight;
        float fromA = scrim.alpha, toA = open ? 0.5f : 0f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = open ? 1f - Mathf.Pow(1f - p, 3f) : p * p * p; // Out/InCubic
            sheet.anchoredPosition = new Vector2(sheet.anchoredPosition.x, Mathf.Lerp(fromY, toY, e));
            scrim.alpha = Mathf.Lerp(fromA, toA, p);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Sheet {
    translate: 0 100%;                 /* 画面外(下)に隠す */
    transition: translate 350ms ease-out-cubic;
}
#Sheet.open { translate: 0 0; }
#Sheet.closing { transition: translate 280ms ease-in-cubic; }

#Scrim {
    opacity: 0;
    transition: opacity 350ms ease-out;
}
#Scrim.open { opacity: 0.5; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class BottomSheetUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement sheet, scrim;
    bool isOpen;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        sheet = root.Q<VisualElement>("Sheet");
        scrim = root.Q<VisualElement>("Scrim");
        scrim.RegisterCallback<ClickEvent>(_ => { if (isOpen) Toggle(); });
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        sheet.EnableInClassList("closing", !isOpen);
        sheet.EnableInClassList("open", isOpen);
        scrim.EnableInClassList("open", isOpen);
    }
}`,
    },
  });
})();
