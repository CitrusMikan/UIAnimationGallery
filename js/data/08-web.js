/* 08-web.js — モダンWeb・モーション由来 (6種)
 * Webデザインで定番の演出で、ゲームUIにも応用しやすいもの。
 * 各種にUI Toolkit(USS/schedule)実装も同梱。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. テキストスクランブル */
  R({
    id: 'text-scramble',
    title: 'テキストスクランブル',
    titleEn: 'Text Scramble',
    category: 'web',
    tags: ['text', 'decode', 'サイバー', '解読'],
    description: 'ランダムな文字が高速で切り替わりながら、左から本来の文字に確定していく解読演出。SF/サイバー系のタイトルやコードネーム表示に最適。LitMotionは文字列スクランブルを標準サポート。',
    spec: {
      target: 'TMP_Text.text (または VisualElementのLabel)',
      from: '(空)', to: '目標テキスト',
      duration: 1.0,
      ease: 'Linear',
      scramble_chars: 'A-Z 0-9 記号',
    },
    preview(ctx, PV) {
      const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@';
      const target = 'INITIALIZE';
      const el = PV.el('mono', { fontSize: '22px', fontWeight: '700', letterSpacing: '0.14em', color: 'var(--pv-accent)' });
      ctx.stage.appendChild(el);
      ctx.forever(async () => {
        el.textContent = '';
        await ctx.wait(0.4);
        await ctx.tween({
          from: 0, to: 1, duration: 1.0, ease: 'Linear',
          onUpdate: p => {
            const revealed = Math.floor(target.length * p);
            let s = '';
            for (let i = 0; i < target.length; i++) {
              s += i < revealed ? target[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            }
            el.textContent = s;
          },
        });
        el.textContent = target;
        await ctx.wait(1.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class TextScrambleLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 1f;

    TMP_Text label;
    MotionHandle handle;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play(string target)
    {
        if (handle.IsActive()) handle.Cancel();
        // LitMotionは文字列スクランブルを標準サポート
        handle = LMotion.String.Create128Bytes("", target, duration)
            .WithScrambleChars(ScrambleMode.Uppercase)
            .BindToText(label);
    }
}`,
      dotween: `
using System.Text;
using DG.Tweening;
using TMPro;
using UnityEngine;

public class TextScrambleDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] float duration = 1f;
    const string GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Play(string target)
    {
        tween?.Kill();
        float p = 0f;
        var sb = new StringBuilder(target.Length);
        // 進行値0→1をトゥイーンし、確定文字数を増やしながら残りをスクランブル
        tween = DOTween.To(() => p, v =>
        {
            p = v;
            int revealed = Mathf.FloorToInt(target.Length * p);
            sb.Clear();
            for (int i = 0; i < target.Length; i++)
                sb.Append(i < revealed ? target[i] : GLYPHS[Random.Range(0, GLYPHS.Length)]);
            label.text = sb.ToString();
        }, 1f, duration).SetEase(Ease.Linear).OnComplete(() => label.text = target);
    }
}`,
      coroutine: `
using System.Collections;
using System.Text;
using TMPro;
using UnityEngine;

public class TextScrambleCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] float duration = 1f;
    const string GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";

    public void Play(string target)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(target));
    }

    IEnumerator Animate(string target)
    {
        var sb = new StringBuilder(target.Length);
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            int revealed = Mathf.FloorToInt(target.Length * p);
            sb.Clear();
            for (int i = 0; i < target.Length; i++)
                sb.Append(i < revealed ? target[i] : GLYPHS[Random.Range(0, GLYPHS.Length)]);
            label.text = sb.ToString();
            yield return null;
        }
        label.text = target;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — 動的テキストのため schedule スケジューラで実装 (.cs) ===== */

using System.Text;
using UnityEngine;
using UnityEngine.UIElements;

public class TextScrambleUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Label";
    [SerializeField] float duration = 1f;
    const string GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@";

    public void Play(string target)
    {
        var label = document.rootVisualElement.Q<Label>(elementName);
        var sb = new StringBuilder(target.Length);
        float elapsed = 0f;
        IVisualElementScheduledItem item = null;
        item = label.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            int revealed = Mathf.FloorToInt(target.Length * p);
            sb.Clear();
            for (int i = 0; i < target.Length; i++)
                sb.Append(i < revealed ? target[i] : GLYPHS[Random.Range(0, GLYPHS.Length)]);
            label.text = sb.ToString();
            if (p >= 1f) { label.text = target; item.Pause(); }
        }).Every(16);
    }
}`,
    },
  });

  /* 2. 3Dカードチルト */
  R({
    id: 'card-tilt',
    interactive: true,
    title: '3Dカードチルト',
    titleEn: 'Card Tilt 3D',
    category: 'web',
    tags: ['hover', '3D', 'parallax', 'カード'],
    description: 'カーソルの位置に合わせてカードが立体的に傾く。Webのプロダクトカードで定番の奥行き表現で、ゲームのキャラ/装備カードにも映える。連続追従なのでUpdateでの平滑補間が基本。プレビューはカーソルを乗せて試せる。',
    spec: {
      target: 'RectTransform.localRotation (X/Y)',
      max_angle: 12,
      smoothing: '1 - exp(-12 * dt)',
      note: 'Canvasを Screen Space - Camera + Perspective にするか、要素を3D回転できる構成にする',
    },
    preview(ctx, PV) {
      const card = PV.box(ctx, { label: 'CARD', w: 110, h: 140 });
      card.style.transition = 'transform 0.12s ease-out';
      let raf = null;
      const onMove = ev => {
        const r = ctx.stage.getBoundingClientRect();
        const nx = (ev.clientX - r.left) / r.width - 0.5;
        const ny = (ev.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${nx * 24}deg) rotateX(${-ny * 24}deg)`;
      };
      const onLeave = () => card.style.transform = 'rotateY(0deg) rotateX(0deg)';
      ctx.stage.addEventListener('pointermove', onMove);
      ctx.stage.addEventListener('pointerleave', onLeave);
      // 自動デモ: ゆっくり一周
      ctx.forever(async () => {
        await ctx.tween({
          from: 0, to: 1, duration: 2.4, ease: 'InOutSine',
          onUpdate: p => {
            if (card.matches(':hover')) return;
            const a = p * Math.PI * 2;
            card.style.transform = `rotateY(${Math.cos(a) * 16}deg) rotateX(${Math.sin(a) * 16}deg)`;
          },
        });
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

// 連続追従はUpdateで補間し、離脱時の復帰だけLitMotionで滑らかに戻す
public class CardTiltLitMotion : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float maxAngle = 12f;
    [SerializeField] float smooth = 12f;

    RectTransform rect;
    bool hovering;
    Vector3 targetEuler;
    MotionHandle resetHandle;

    void Awake() => rect = (RectTransform)transform;
    void OnDestroy() { if (resetHandle.IsActive()) resetHandle.Cancel(); }

    public void OnPointerEnter(PointerEventData e)
    {
        if (resetHandle.IsActive()) resetHandle.Cancel();
        hovering = true;
    }

    public void OnPointerExit(PointerEventData e)
    {
        hovering = false;
        resetHandle = LMotion.Create(rect.localEulerAngles, Vector3.zero, 0.3f)
            .WithEase(Ease.OutCubic)
            .BindToLocalEulerAngles(rect);
    }

    void Update()
    {
        if (!hovering) return;
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rect, Input.mousePosition, null, out Vector2 local);
        Vector2 n = new Vector2(local.x / rect.rect.width, local.y / rect.rect.height);
        targetEuler = new Vector3(n.y * maxAngle, -n.x * maxAngle, 0f);
        rect.localRotation = Quaternion.Slerp(rect.localRotation,
            Quaternion.Euler(targetEuler), 1f - Mathf.Exp(-smooth * Time.deltaTime));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.EventSystems;

public class CardTiltDOTween : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float maxAngle = 12f;
    [SerializeField] float smooth = 12f;

    RectTransform rect;
    bool hovering;

    void Awake() => rect = (RectTransform)transform;

    public void OnPointerEnter(PointerEventData e) { rect.DOKill(); hovering = true; }
    public void OnPointerExit(PointerEventData e)
    {
        hovering = false;
        rect.DOLocalRotate(Vector3.zero, 0.3f).SetEase(Ease.OutCubic); // 復帰
    }

    void Update()
    {
        if (!hovering) return;
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            rect, Input.mousePosition, null, out Vector2 local);
        Vector2 n = new Vector2(local.x / rect.rect.width, local.y / rect.rect.height);
        var target = Quaternion.Euler(n.y * maxAngle, -n.x * maxAngle, 0f);
        rect.localRotation = Quaternion.Slerp(rect.localRotation, target,
            1f - Mathf.Exp(-smooth * Time.deltaTime));
    }
}`,
      coroutine: `
using UnityEngine;
using UnityEngine.EventSystems;

// 追従系はライブラリ不要。Updateでの指数補間が最もシンプルで安定
public class CardTiltUpdate : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [SerializeField] float maxAngle = 12f;
    [SerializeField] float smooth = 12f;

    RectTransform rect;
    bool hovering;
    Vector3 targetEuler;

    void Awake() => rect = (RectTransform)transform;

    public void OnPointerEnter(PointerEventData e) => hovering = true;
    public void OnPointerExit(PointerEventData e) { hovering = false; targetEuler = Vector3.zero; }

    void Update()
    {
        if (hovering)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                rect, Input.mousePosition, null, out Vector2 local);
            Vector2 n = new Vector2(local.x / rect.rect.width, local.y / rect.rect.height);
            targetEuler = new Vector3(n.y * maxAngle, -n.x * maxAngle, 0f);
        }
        rect.localRotation = Quaternion.Slerp(rect.localRotation,
            Quaternion.Euler(targetEuler), 1f - Mathf.Exp(-smooth * Time.deltaTime));
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 補間はUSS transitionに任せ、傾きだけコードで指定する */
#Card {
    transform-origin: center;
    transition: rotate 120ms ease-out;
}

/* ===== C# (.cs) ===== */
/* ※ UI Toolkitのrotateは2D(Z軸)のみ。3D風の傾きはUnity 2022.2+の
   3D transform (style.rotate に Vector3 は不可) では直接表現できないため、
   ここでは perspective 付きの疑似傾きとして scale/translate で近似する例。 */

using UnityEngine;
using UnityEngine.UIElements;

public class CardTiltUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Card";
    [SerializeField] float maxShift = 10f;

    void OnEnable()
    {
        var card = document.rootVisualElement.Q<VisualElement>(elementName);

        // UI ToolkitはPointerMoveEventを標準サポート
        card.RegisterCallback<PointerMoveEvent>(evt =>
        {
            Vector2 size = card.layout.size;
            float nx = evt.localPosition.x / size.x - 0.5f;
            float ny = evt.localPosition.y / size.y - 0.5f;
            // 立体感の近似: 傾き方向へ少しずらす + 全体を微回転
            card.style.translate = new Translate(nx * maxShift, ny * maxShift, 0);
            card.style.rotate = new Rotate(new Angle(nx * 6f, AngleUnit.Degree));
        });
        card.RegisterCallback<PointerLeaveEvent>(_ =>
        {
            card.style.translate = new Translate(0, 0, 0);
            card.style.rotate = new Rotate(new Angle(0, AngleUnit.Degree));
        });
    }
}`,
    },
  });

  /* 3. フリップカード */
  R({
    id: 'flip-card',
    interactive: true,
    title: 'フリップカード',
    titleEn: 'Flip Card',
    category: 'web',
    tags: ['flip', '3D', 'カード', '裏返し'],
    description: 'クリックでカードがY軸に180°回転し、裏面が現れる。Webのプロフィールカードやカードゲームのオープン演出に。90°を境に表裏の要素を切り替えるのがポイント。プレビューはクリックで試せる。',
    spec: {
      target: 'Transform.localEulerAngles.y',
      from: 0, to: 180,
      duration: 0.5,
      ease: 'InOutCubic',
      swap_at: '90°で表面を非表示・裏面を表示',
    },
    preview(ctx, PV) {
      const card = PV.box(ctx, { label: 'FRONT', w: 100, h: 130 });
      const label = card.querySelector('.pv-box-label');
      card.style.cursor = 'pointer';
      let flipped = false;
      const flip = () => {
        flipped = !flipped;
        const from = flipped ? 0 : 180;
        const to = flipped ? 180 : 0;
        ctx.tween({
          from, to, duration: 0.5, ease: 'InOutCubic',
          onUpdate: v => {
            card.style.transform = `rotateY(${v}deg)`;
            const showBack = v > 90;
            label.textContent = showBack ? 'BACK' : 'FRONT';
            label.style.transform = showBack ? 'scaleX(-1)' : 'scaleX(1)';
            card.style.borderColor = showBack ? '#7ee2ff' : 'var(--pv-accent)';
          },
        });
      };
      card.addEventListener('click', flip);
      ctx.forever(async () => { await ctx.wait(1.6); flip(); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class FlipCardLitMotion : MonoBehaviour
{
    [SerializeField] GameObject front;
    [SerializeField] GameObject back;
    [SerializeField] float duration = 0.5f;

    bool flipped;
    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Flip()
    {
        flipped = !flipped;
        if (handle.IsActive()) handle.Cancel();
        float from = flipped ? 0f : 180f;
        float to = flipped ? 180f : 0f;
        handle = LMotion.Create(from, to, duration)
            .WithEase(Ease.InOutCubic)
            .Bind(y =>
            {
                transform.localEulerAngles = new Vector3(0f, y, 0f);
                bool showBack = y > 90f;
                front.SetActive(!showBack);
                back.SetActive(showBack);
            });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class FlipCardDOTween : MonoBehaviour
{
    [SerializeField] GameObject front;
    [SerializeField] GameObject back;
    [SerializeField] float duration = 0.5f;

    bool flipped;
    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Flip()
    {
        flipped = !flipped;
        tween?.Kill();
        float to = flipped ? 180f : 0f;
        tween = transform.DOLocalRotate(new Vector3(0f, to, 0f), duration)
            .SetEase(Ease.InOutCubic)
            .OnUpdate(() =>
            {
                bool showBack = transform.localEulerAngles.y > 90f
                             && transform.localEulerAngles.y < 270f;
                front.SetActive(!showBack);
                back.SetActive(showBack);
            });
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class FlipCardCoroutine : MonoBehaviour
{
    [SerializeField] GameObject front;
    [SerializeField] GameObject back;
    [SerializeField] float duration = 0.5f;

    bool flipped;

    public void Flip()
    {
        flipped = !flipped;
        StopAllCoroutines();
        StartCoroutine(Animate(flipped ? 180f : 0f));
    }

    IEnumerator Animate(float to)
    {
        float from = transform.localEulerAngles.y;
        if (from > 180f) from -= 360f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f; // InOutCubic
            float y = Mathf.LerpUnclamped(from, to, e);
            transform.localEulerAngles = new Vector3(0f, y, 0f);
            bool showBack = y > 90f;
            front.SetActive(!showBack);
            back.SetActive(showBack);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* UI Toolkitのrotateは2Dのみ。裏返しは scaleX の反転で表現するのが定番 */
#Card {
    transition: scale 250ms ease-in;
}
#Card.flipped {
    scale: -1 1;   /* 横反転 */
}

/* ===== C# (.cs) ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class FlipCardUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Card";
    VisualElement front, back, card;
    bool flipped;

    void OnEnable()
    {
        card = document.rootVisualElement.Q<VisualElement>(elementName);
        front = card.Q<VisualElement>("Front");
        back = card.Q<VisualElement>("Back");
        card.RegisterCallback<ClickEvent>(_ => Flip());
        // 縮んで反転するタイミング(中間)で表裏を入れ替える
        card.RegisterCallback<TransitionEndEvent>(_ => { });
    }

    void Flip()
    {
        flipped = !flipped;
        card.ToggleInClassList("flipped");
        // 中間(scaleXが0付近)で切り替わって見えるよう遅延で入れ替え
        card.schedule.Execute(() =>
        {
            front.style.display = flipped ? DisplayStyle.None : DisplayStyle.Flex;
            back.style.display = flipped ? DisplayStyle.Flex : DisplayStyle.None;
        }).ExecuteLater(125); // duration の半分
    }
}`,
    },
  });

  /* 4. スクロールリビール */
  R({
    id: 'scroll-reveal',
    title: 'スクロールリビール',
    titleEn: 'Scroll Reveal',
    category: 'web',
    tags: ['reveal', 'fade', 'スクロール', '出現'],
    description: '要素が下から少し上がりながらフェードインして現れる。Webでスクロール到達時に発火する定番演出。ゲームでは要素が画面に入った時やメニュー展開時に。フェードインより「意図的に現れた感」が出る。',
    spec: {
      target: 'CanvasGroup.alpha + RectTransform.anchoredPosition.y',
      alpha: { from: 0, to: 1 },
      y: { from: -30, to: 0 },
      duration: 0.5,
      ease: 'OutCubic',
      trigger: 'OnBecameVisible 相当 (uGUIはビューポート判定で発火)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'CONTENT', w: 140, h: 88 });
      const s = { y: 0 };
      ctx.forever(async () => {
        box.style.opacity = 0; s.y = 30; PV.applyT(box, s);
        await ctx.wait(0.4);
        await ctx.tween({
          duration: 0.5, ease: 'OutCubic',
          onUpdate: (v, t) => { s.y = 30 - 30 * v; PV.applyT(box, s); box.style.opacity = Math.min(t * 2, 1); },
        });
        await ctx.wait(1.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ScrollRevealLitMotion : MonoBehaviour
{
    [SerializeField] float riseDistance = 30f;
    [SerializeField] float duration = 0.5f;

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

    /// <summary>要素が画面に入ったタイミングで呼ぶ</summary>
    public void Reveal()
    {
        Cancel();
        group.alpha = 0f;
        moveHandle = LMotion.Create(shownY - riseDistance, shownY, duration)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPositionY(rect);
        fadeHandle = LMotion.Create(0f, 1f, duration)
            .WithEase(Ease.OutCubic)
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ScrollRevealDOTween : MonoBehaviour
{
    [SerializeField] float riseDistance = 30f;
    [SerializeField] float duration = 0.5f;

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

    public void Reveal()
    {
        seq?.Kill();
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, shownY - riseDistance);
        group.alpha = 0f;
        seq = DOTween.Sequence()
            .Join(rect.DOAnchorPosY(shownY, duration).SetEase(Ease.OutCubic))
            .Join(group.DOFade(1f, duration).SetEase(Ease.OutCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class ScrollRevealCoroutine : MonoBehaviour
{
    [SerializeField] float riseDistance = 30f;
    [SerializeField] float duration = 0.5f;

    RectTransform rect;
    CanvasGroup group;
    float shownY;

    void Awake()
    {
        rect = (RectTransform)transform;
        group = GetComponent<CanvasGroup>();
        shownY = rect.anchoredPosition.y;
    }

    public void Reveal()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        group.alpha = 0f;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float u = 1f - p;
            float e = 1f - u * u * u; // OutCubic
            rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, Mathf.Lerp(shownY - riseDistance, shownY, e));
            group.alpha = e;
            yield return null;
        }
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, shownY);
        group.alpha = 1f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Content {
    opacity: 0;
    translate: 0 30px;
    transition: opacity 500ms ease-out-cubic, translate 500ms ease-out-cubic;
}
#Content.revealed {
    opacity: 1;
    translate: 0 0;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ScrollRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Content";

    void OnEnable()
    {
        var target = document.rootVisualElement.Q<VisualElement>(elementName);
        // 初期状態を1フレーム描画してからクラスを付与するとtransitionが発火する
        target.schedule.Execute(() => target.AddToClassList("revealed"));
    }
}`,
    },
  });

  /* 5. 文字ウェーブ */
  R({
    id: 'wave-text',
    title: '文字ウェーブ',
    titleEn: 'Wave Text',
    category: 'web',
    tags: ['text', 'wave', 'loop', 'タイトル'],
    description: '文字が波打つように上下し続ける。Webの遊び心あるヒーロータイトルや、ゲームのロゴ・見出しの「生きている感」に。各文字の位相を少しずつずらしたsin波で動かす。',
    spec: {
      target: '各文字の localPosition.y (TMPは頂点、UI Toolkitは文字ごとのLabel)',
      amplitude: 8,
      wave_speed: 3.0,
      phase_per_char: 0.4,
      loops: -1,
    },
    preview(ctx, PV) {
      const text = 'WAVE';
      const wrap = PV.el(null, { display: 'flex', gap: '3px', fontFamily: "'Oswald',sans-serif", fontSize: '34px', fontWeight: '700', color: 'var(--pv-accent)' });
      const chars = text.split('').map(c => {
        const s = PV.el(null, { display: 'inline-block' }, c, 'span');
        wrap.appendChild(s);
        return s;
      });
      ctx.stage.appendChild(wrap);
      ctx.tween({
        from: 0, to: 1, duration: 100000, ease: 'Linear',
        onUpdate: (v, t) => {
          const time = t * 100000;   // t は 0..1 の進捗。duration(=100000秒)を掛けると実経過秒になる
          chars.forEach((c, i) => {
            const y = Math.sin(time * 3 - i * 0.5) * 8;
            c.style.transform = `translateY(${y}px)`;
          });
        },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 各文字を子オブジェクト化し、位相をずらしたsin波で上下させる
public class WaveTextLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;
    [SerializeField] float amplitude = 8f;
    [SerializeField] float waveSpeed = 3f;
    [SerializeField] float phasePerChar = 0.4f;

    float[] baseY;
    MotionHandle handle;

    void Awake()
    {
        baseY = new float[chars.Length];
        for (int i = 0; i < chars.Length; i++) baseY[i] = chars[i].anchoredPosition.y;
    }

    void OnEnable()
    {
        // 時間を流し続け、毎フレーム全文字を更新する
        handle = LMotion.Create(0f, 1f, 1f)
            .WithLoops(-1, LoopType.Restart)
            .Bind(_ =>
            {
                float t = Time.time;
                for (int i = 0; i < chars.Length; i++)
                {
                    float y = baseY[i] + Mathf.Sin(t * waveSpeed - i * phasePerChar) * amplitude;
                    chars[i].anchoredPosition = new Vector2(chars[i].anchoredPosition.x, y);
                }
            });
    }

    void OnDisable() { if (handle.IsActive()) handle.Cancel(); }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class WaveTextDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;
    [SerializeField] float amplitude = 8f;
    [SerializeField] float duration = 0.6f;
    [SerializeField] float staggerDelay = 0.08f;

    void OnEnable()
    {
        for (int i = 0; i < chars.Length; i++)
        {
            float baseY = chars[i].anchoredPosition.y;
            // 各文字にディレイ付きのYoyoループを掛けて波にする
            chars[i].DOAnchorPosY(baseY + amplitude, duration)
                .SetEase(Ease.InOutSine)
                .SetLoops(-1, LoopType.Yoyo)
                .SetDelay(i * staggerDelay);
        }
    }

    void OnDisable()
    {
        foreach (var c in chars) c.DOKill();
    }
}`,
      coroutine: `
using UnityEngine;

public class WaveTextUpdate : MonoBehaviour
{
    [SerializeField] RectTransform[] chars;
    [SerializeField] float amplitude = 8f;
    [SerializeField] float waveSpeed = 3f;
    [SerializeField] float phasePerChar = 0.4f;

    float[] baseY;

    void Awake()
    {
        baseY = new float[chars.Length];
        for (int i = 0; i < chars.Length; i++) baseY[i] = chars[i].anchoredPosition.y;
    }

    void Update()
    {
        float t = Time.time;
        for (int i = 0; i < chars.Length; i++)
        {
            float y = baseY[i] + Mathf.Sin(t * waveSpeed - i * phasePerChar) * amplitude;
            chars[i].anchoredPosition = new Vector2(chars[i].anchoredPosition.x, y);
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — 連続ループのため schedule スケジューラで実装 (.cs) ===== */
/* 文字ごとに Label を並べ、位相をずらしたsin波で translate を更新する */

using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class WaveTextUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "WaveText";
    [SerializeField] float amplitude = 8f;
    [SerializeField] float waveSpeed = 3f;
    [SerializeField] float phasePerChar = 0.4f;

    void OnEnable()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var chars = container.Query<Label>().ToList();

        container.schedule.Execute(() =>
        {
            float t = Time.realtimeSinceStartup;
            for (int i = 0; i < chars.Count; i++)
            {
                float y = Mathf.Sin(t * waveSpeed - i * phasePerChar) * amplitude;
                chars[i].style.translate = new Translate(0, y, 0);
            }
        }).Every(16);
    }
}`,
    },
  });

  /* 6. クリップリビール */
  R({
    id: 'clip-reveal',
    title: 'クリップワイプ表示',
    titleEn: 'Clip Reveal',
    category: 'web',
    tags: ['reveal', 'mask', 'ワイプ', '見出し'],
    description: '帯状のマスクが開いて、テキストや画像が左から拭き出るように現れる。Web見出しの上品なリビールで、ゲームのセクション見出しやカットイン文字にも。uGUIはRectMask2Dの幅、またはImageのfillAmountで実装。',
    spec: {
      target: 'マスクの幅 (RectMask2D) または Image.fillAmount',
      from: 0, to: '全幅',
      duration: 0.5,
      ease: 'InOutCubic',
      note: 'テキストはRectMask2D配下に置き、マスク矩形の幅をトゥイーンする',
    },
    preview(ctx, PV) {
      const mask = PV.el(null, { overflow: 'hidden', width: '0px', whiteSpace: 'nowrap' });
      const inner = PV.el('mono', { fontSize: '22px', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--pv-accent)', padding: '4px 2px' }, 'REVEAL');
      mask.appendChild(inner);
      ctx.stage.appendChild(mask);
      // 内側テキストの実寸を測る
      const probe = inner.cloneNode(true);
      Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', width: 'auto' });
      ctx.stage.appendChild(probe);
      const full = probe.offsetWidth || 130;
      probe.remove();
      ctx.forever(async () => {
        mask.style.width = '0px';
        await ctx.wait(0.4);
        await ctx.tween({
          from: 0, to: full, duration: 0.5, ease: 'InOutCubic',
          onUpdate: v => mask.style.width = v + 'px',
        });
        await ctx.wait(1.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// マスク矩形(RectMask2D付き)の幅をトゥイーンして中身を拭き出す
public class ClipRevealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform mask;
    [SerializeField] float fullWidth = 400f;
    [SerializeField] float duration = 0.5f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(0f, fullWidth, duration)
            .WithEase(Ease.InOutCubic)
            .BindToSizeDeltaX(mask);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ClipRevealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform mask;
    [SerializeField] float fullWidth = 400f;
    [SerializeField] float duration = 0.5f;

    Tween tween;

    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        mask.sizeDelta = new Vector2(0f, mask.sizeDelta.y);
        tween = mask.DOSizeDelta(new Vector2(fullWidth, mask.sizeDelta.y), duration)
            .SetEase(Ease.InOutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ClipRevealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform mask;
    [SerializeField] float fullWidth = 400f;
    [SerializeField] float duration = 0.5f;

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
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f; // InOutCubic
            mask.sizeDelta = new Vector2(fullWidth * e, mask.sizeDelta.y);
            yield return null;
        }
        mask.sizeDelta = new Vector2(fullWidth, mask.sizeDelta.y);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* overflow:hidden の親の幅を 0→100% にトランジションして中身を拭き出す */
#ClipMask {
    overflow: hidden;
    width: 0;
    transition: width 500ms ease-in-out-cubic;
}
#ClipMask.revealed {
    width: 100%;
}
#ClipMask > .label {
    white-space: nowrap;   /* 幅が縮んでも中身を折り返さない */
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ClipRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "ClipMask";

    void OnEnable()
    {
        var mask = document.rootVisualElement.Q<VisualElement>(elementName);
        mask.RemoveFromClassList("revealed");
        mask.schedule.Execute(() => mask.AddToClassList("revealed"));
    }
}`,
    },
  });
})();
