/* 09-uitoolkit.js — 既存アニメーションへ UI Toolkit 実装を後付け
 * Unity 6.x の標準的な手法:
 *   - 状態変化(出現/ホバー/トグル/開閉) → USS transition
 *   - 連続/動的(回転ループ/パーティクル/数値) → schedule スケジューラ
 *   （実験的な experimental.animation は使わない方針）
 * このファイルは全データ登録後に読み込む (UIANIM.attachCode でidに紐付け)。 */
(function () {
  'use strict';
  const A = (id, code) => UIANIM.attachCode(id, 'uitoolkit', code.trim());

  /* USS + 「1フレーム後にクラス付与で transition 発火」する定番の一発再生パターン */
  function oneShot(cls, name, uss) {
    return `/* ===== UI Toolkit — USS (.uss) ===== */
${uss.trim()}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ${cls} : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "${name}";

    void OnEnable() => Play();

    public void Play()
    {
        var target = document.rootVisualElement.Q<VisualElement>(elementName);
        target.RemoveFromClassList("play");
        // 初期状態を1フレーム描画してからクラスを付与すると USS transition が発火する
        target.schedule.Execute(() => target.AddToClassList("play"));
    }
}`;
  }

  /* USS の2状態を TransitionEnd で往復させる無限Yoyoパターン */
  function pingPong(cls, name, uss) {
    return `/* ===== UI Toolkit — USS (.uss) ===== */
${uss.trim()}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ${cls} : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "${name}";

    void OnEnable()
    {
        var target = document.rootVisualElement.Q<VisualElement>(elementName);
        // transition完了ごとにクラスを付け外しして永久にYoyoさせる
        target.RegisterCallback<TransitionEndEvent>(_ => target.ToggleInClassList("on"));
        target.schedule.Execute(() => target.AddToClassList("on"));
    }
}`;
  }

  /* 01 ENTRANCE */
  A('fade-in', oneShot('FadeInUIToolkit', 'Panel',
`#Panel {
    opacity: 0;
    transition: opacity 300ms cubic-bezier(0.5, 1, 0.89, 1);
}
#Panel.play { opacity: 1; }`));

  A('fade-out', oneShot('FadeOutUIToolkit', 'Panel',
`#Panel {
    opacity: 1;
    transition: opacity 250ms cubic-bezier(0.11, 0, 0.5, 0);
}
#Panel.play { opacity: 0; }`));

  A('scale-in', oneShot('ScaleInUIToolkit', 'Item',
`#Item {
    scale: 0 0;
    transition: scale 350ms ease-out-back;
}
#Item.play { scale: 1 1; }`));

  A('scale-out', oneShot('ScaleOutUIToolkit', 'Item',
`#Item {
    scale: 1 1;
    transition: scale 250ms ease-in-back;
}
#Item.play { scale: 0 0; }`));

  A('slide-in', oneShot('SlideInUIToolkit', 'Panel',
`#Panel {
    translate: -200px 0;
    opacity: 0;
    transition: translate 400ms ease-out-cubic, opacity 400ms ease-out-cubic;
}
#Panel.play { translate: 0 0; opacity: 1; }`));

  A('slide-out', oneShot('SlideOutUIToolkit', 'Panel',
`#Panel {
    translate: 0 0;
    opacity: 1;
    transition: translate 300ms ease-in-cubic, opacity 300ms ease-in-cubic;
}
#Panel.play { translate: 200px 0; opacity: 0; }`));

  A('zoom-fade-in', oneShot('ZoomFadeInUIToolkit', 'Dialog',
`#Dialog {
    scale: 1.1 1.1;
    opacity: 0;
    transition: scale 350ms ease-out-cubic, opacity 350ms ease-out-cubic;
}
#Dialog.play { scale: 1 1; opacity: 1; }`));

  A('flip-in', oneShot('FlipInUIToolkit', 'Card',
`/* UI Toolkitは3D回転(Y軸)非対応。scaleXの0→1でめくり風に近似する */
#Card {
    scale: 0 1;
    transition: scale 450ms ease-out-cubic;
}
#Card.play { scale: 1 1; }`));

  A('rotate-in', oneShot('RotateInUIToolkit', 'Badge',
`#Badge {
    rotate: -90deg;
    scale: 0.5 0.5;
    opacity: 0;
    transition: rotate 400ms ease-out-cubic, scale 400ms ease-out-cubic, opacity 300ms ease-out-cubic;
}
#Badge.play { rotate: 0; scale: 1 1; opacity: 1; }`));

  A('bounce-in', oneShot('BounceInUIToolkit', 'Bonus',
`#Bonus {
    scale: 0 0;
    transition: scale 600ms ease-out-bounce;
}
#Bonus.play { scale: 1 1; }`));

  /* 02 ATTENTION */
  A('bounce',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Icon {
    translate: 0 0;
    transition: translate 500ms ease-out-bounce;   /* 着地は跳ねる */
}
#Icon.up {
    translate: 0 -30px;
    transition: translate 180ms cubic-bezier(0.5, 1, 0.89, 1); /* 上昇は速く */
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class BounceUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Icon";

    public void Play()
    {
        var target = document.rootVisualElement.Q<VisualElement>(elementName);
        // 上げてから、transition完了で下ろすと着地でバウンドする
        void OnUp(TransitionEndEvent _)
        {
            target.UnregisterCallback<TransitionEndEvent>(OnUp);
            target.RemoveFromClassList("up");
        }
        target.RegisterCallback<TransitionEndEvent>(OnUp);
        target.AddToClassList("up");
    }
}`);

  A('shake',
`/* ===== UI Toolkit — 減衰振動のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ShakeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Field";
    [SerializeField] float strength = 12f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] float frequency = 20f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float elapsed = 0f;
        el.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float x = (Mathf.PerlinNoise(elapsed * frequency, 0f) * 2f - 1f) * strength * (1f - p);
            el.style.translate = new Translate(p >= 1f ? 0f : x, 0, 0);
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('punch-scale',
`/* ===== UI Toolkit — 減衰振動のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class PunchScaleUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Icon";
    [SerializeField] float strength = 0.25f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] float frequency = 4f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float elapsed = 0f;
        el.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float wave = Mathf.Sin(p * frequency * Mathf.PI) * (1f - p) * (1f - p);
            float s = 1f + wave * strength;
            el.style.scale = new Scale(new Vector3(s, s, 1f));
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('punch-rotation',
`/* ===== UI Toolkit — 減衰振動のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class PunchRotationUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Bell";
    [SerializeField] float strength = 15f;
    [SerializeField] float duration = 0.5f;
    [SerializeField] float frequency = 6f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float elapsed = 0f;
        el.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float z = Mathf.Sin(p * frequency * Mathf.PI) * (1f - p) * (1f - p) * strength;
            el.style.rotate = new Rotate(new Angle(z, AngleUnit.Degree));
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('pulse', pingPong('PulseUIToolkit', 'Button',
`#Button { transition: scale 600ms ease-in-out-sine; }
#Button.on { scale: 1.08 1.08; }`));

  A('heartbeat',
`/* ===== UI Toolkit — 多段の鼓動のため schedule で評価する (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HeartbeatUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Heart";
    const float Cycle = 1.22f;

    void OnEnable()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float t = 0f;
        el.schedule.Execute(() =>
        {
            t = (t + 0.016f) % Cycle;
            float s = Evaluate(t);
            el.style.scale = new Scale(new Vector3(s, s, 1f));
        }).Every(16);
    }

    static float Evaluate(float t)
    {
        if (t < 0.12f) return Mathf.Lerp(1.00f, 1.15f, OutQuad(t / 0.12f));
        if (t < 0.24f) return Mathf.Lerp(1.15f, 1.00f, InQuad((t - 0.12f) / 0.12f));
        if (t < 0.36f) return Mathf.Lerp(1.00f, 1.12f, OutQuad((t - 0.24f) / 0.12f));
        if (t < 0.52f) return Mathf.Lerp(1.12f, 1.00f, InQuad((t - 0.36f) / 0.16f));
        return 1f;
    }
    static float OutQuad(float t) => 1f - (1f - t) * (1f - t);
    static float InQuad(float t) => t * t;
}`);

  A('flash',
`/* ===== UI Toolkit — 回数指定の点滅のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class FlashUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Alert";
    [SerializeField] int blinkCount = 3;
    [SerializeField] float blinkInterval = 0.1f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        int total = blinkCount * 2;
        int count = 0;
        el.schedule.Execute(() =>
        {
            count++;
            el.style.opacity = (count % 2 == 1) ? 0.15f : 1f;
            if (count >= total) el.style.opacity = 1f;
        }).Every((long)(blinkInterval * 1000)).Until(() => count >= total);
    }
}`);

  A('rubber-band',
`/* ===== UI Toolkit — キーフレーム列のため schedule で評価する (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class RubberBandUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Band";

    // (時刻, scaleX, scaleY) のキーフレーム
    static readonly (float t, float x, float y)[] Keys =
    {
        (0.00f, 1.00f, 1.00f),
        (0.30f, 1.25f, 0.75f),
        (0.50f, 0.85f, 1.15f),
        (0.70f, 1.05f, 0.95f),
        (1.00f, 1.00f, 1.00f),
    };
    const float Duration = 0.8f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float elapsed = 0f;
        el.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / Duration);
            Vector2 s = Sample(p);
            el.style.scale = new Scale(new Vector3(s.x, s.y, 1f));
        }).Every(16).Until(() => elapsed >= Duration);
    }

    static Vector2 Sample(float p)
    {
        for (int i = 1; i < Keys.Length; i++)
        {
            if (p <= Keys[i].t)
            {
                var a = Keys[i - 1];
                var b = Keys[i];
                float k = Mathf.InverseLerp(a.t, b.t, p);
                float e = 1f - (1f - k) * (1f - k); // OutQuad
                return new Vector2(Mathf.Lerp(a.x, b.x, e), Mathf.Lerp(a.y, b.y, e));
            }
        }
        return Vector2.one;
    }
}`);

  A('jello',
`/* ===== UI Toolkit — X/Y逆位相の減衰振動のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class JelloUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Jelly";
    [SerializeField] float strength = 0.15f;
    [SerializeField] float duration = 0.7f;
    [SerializeField] float frequency = 8f;

    public void Play()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float elapsed = 0f;
        el.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float w = Mathf.Sin(p * frequency * Mathf.PI) * (1f - p) * (1f - p) * strength;
            el.style.scale = new Scale(new Vector3(1f + w, 1f - w, 1f));
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('float-loop', pingPong('FloatLoopUIToolkit', 'Gift',
`#Gift { transition: translate 1200ms ease-in-out-sine; }
#Gift.on { translate: 0 -16px; }`));

  A('rotate-loop',
`/* ===== UI Toolkit — 連続回転のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class RotateLoopUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Gear";
    [SerializeField] float duration = 2f;   // 1回転の秒数

    void OnEnable()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float angle = 0f;
        el.schedule.Execute(() =>
        {
            angle = (angle - 360f * 16f / 1000f / duration) % 360f;
            el.style.rotate = new Rotate(new Angle(angle, AngleUnit.Degree));
        }).Every(16);
    }
}`);

  /* 03 BUTTON */
  A('hover-scale',
`/* ===== UI Toolkit — USS だけで完結 (:hover 疑似クラス) ===== */
/* ホバー系はコード不要。UXMLで class="hover-scale" を付けるだけ */
.hover-scale {
    scale: 1 1;
    transition: scale 150ms cubic-bezier(0.5, 1, 0.89, 1);
}
.hover-scale:hover {
    scale: 1.05 1.05;
}`);

  A('press-down',
`/* ===== UI Toolkit — USS だけで完結 (:active 疑似クラス) ===== */
.press-button {
    scale: 1 1;
    transition: scale 200ms ease-out-back;
}
.press-button:active {
    scale: 0.92 0.92;
    transition: scale 80ms ease-out;   /* 押し込みは速く */
}`);

  A('ripple',
`/* ===== UI Toolkit — クリック地点に円を生成して schedule で拡大フェード (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class RippleUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Button";
    [SerializeField] float maxSize = 240f;
    [SerializeField] float duration = 0.5f;

    void OnEnable()
    {
        var button = document.rootVisualElement.Q<VisualElement>(elementName);
        button.style.overflow = Overflow.Hidden;
        button.RegisterCallback<PointerDownEvent>(evt => Spawn(button, evt.localPosition));
    }

    void Spawn(VisualElement parent, Vector2 pos)
    {
        var ripple = new VisualElement();
        ripple.style.position = Position.Absolute;
        ripple.style.width = maxSize;
        ripple.style.height = maxSize;
        ripple.style.left = pos.x - maxSize / 2f;
        ripple.style.top = pos.y - maxSize / 2f;
        ripple.style.borderTopLeftRadius = maxSize / 2f;
        ripple.style.borderTopRightRadius = maxSize / 2f;
        ripple.style.borderBottomLeftRadius = maxSize / 2f;
        ripple.style.borderBottomRightRadius = maxSize / 2f;
        ripple.style.backgroundColor = new Color(0.08f, 0.08f, 0.08f, 0.35f);
        ripple.style.scale = new Scale(Vector3.zero);
        ripple.pickingMode = PickingMode.Ignore;
        parent.Add(ripple);

        float elapsed = 0f;
        ripple.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            ripple.style.scale = new Scale(Vector3.one * e);
            ripple.style.opacity = 1f - e;
            if (p >= 1f) ripple.RemoveFromHierarchy();
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('cta-attention',
`/* ===== UI Toolkit — 一定間隔で揺らすため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CtaAttentionUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "CtaButton";
    [SerializeField] float interval = 2.5f;
    [SerializeField] float rotationStrength = 6f;
    [SerializeField] float scaleStrength = 0.08f;
    [SerializeField] float duration = 0.5f;
    [SerializeField] float frequency = 8f;

    void OnEnable()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float clock = 0f;
        el.schedule.Execute(() =>
        {
            clock += 0.016f;
            float cyc = clock % (interval + duration);
            if (cyc < interval) { el.style.rotate = new Rotate(0); el.style.scale = new Scale(Vector3.one); return; }
            float p = (cyc - interval) / duration;
            float w = Mathf.Sin(p * frequency * Mathf.PI) * (1f - p) * (1f - p);
            el.style.rotate = new Rotate(new Angle(w * rotationStrength, AngleUnit.Degree));
            float s = 1f + Mathf.Abs(w) * scaleStrength;
            el.style.scale = new Scale(new Vector3(s, s, 1f));
        }).Every(16);
    }
}`);

  A('toggle-switch',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Track {
    background-color: rgb(58, 58, 62);
    transition: background-color 250ms ease-out;
}
#Track.on { background-color: rgb(245, 224, 3); }

#Knob {
    translate: 0 0;
    transition: translate 250ms ease-out-back;
}
#Track.on #Knob { translate: 44px 0; }

/* ===== C# (.cs) ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class ToggleSwitchUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string trackName = "Track";

    void OnEnable()
    {
        var track = document.rootVisualElement.Q<VisualElement>(trackName);
        track.RegisterCallback<ClickEvent>(_ => track.ToggleInClassList("on"));
    }
}`);

  A('checkmark',
`/* ===== UI Toolkit — USS (.uss) ===== */
/* 円がポップ → チェックが左から現れる (fillの代わりにscaleXで表現) */
#Circle {
    scale: 0 0;
    transition: scale 250ms ease-out-back;
}
#Circle.play { scale: 1 1; }

#Check {
    transform-origin: left;
    scale: 0 1;
    transition: scale 400ms ease-out-cubic 250ms; /* 円の後に開始 */
}
#Circle.play #Check { scale: 1 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CheckmarkUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string circleName = "Circle";

    public void Play()
    {
        var circle = document.rootVisualElement.Q<VisualElement>(circleName);
        circle.RemoveFromClassList("play");
        circle.schedule.Execute(() => circle.AddToClassList("play"));
    }
}`);

  A('like-burst',
`/* ===== UI Toolkit — アイコン跳ね + パーティクル生成を schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class LikeBurstUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string iconName = "Star";
    [SerializeField] int particleCount = 8;
    [SerializeField] float distance = 60f;

    void OnEnable()
    {
        var icon = document.rootVisualElement.Q<VisualElement>(iconName);
        icon.RegisterCallback<ClickEvent>(_ => Play(icon));
    }

    void Play(VisualElement icon)
    {
        // アイコンをポップ (USS transitionでも可)
        float e = 0f;
        icon.schedule.Execute(() =>
        {
            e += 0.016f;
            float p = Mathf.Clamp01(e / 0.4f);
            float s = Mathf.LerpUnclamped(0.3f, 1f, OutBack(p));
            icon.style.scale = new Scale(new Vector3(s, s, 1f));
        }).Every(16).Until(() => e >= 0.4f);

        var parent = icon.parent;
        for (int i = 0; i < particleCount; i++)
        {
            float ang = i * Mathf.PI * 2f / particleCount;
            SpawnParticle(parent, icon, new Vector2(Mathf.Cos(ang), Mathf.Sin(ang)));
        }
    }

    void SpawnParticle(VisualElement parent, VisualElement icon, Vector2 dir)
    {
        var p = new VisualElement();
        p.style.position = Position.Absolute;
        p.style.width = 8; p.style.height = 8;
        p.style.left = icon.layout.center.x; p.style.top = icon.layout.center.y;
        p.style.backgroundColor = new Color(0.96f, 0.88f, 0.01f);
        p.pickingMode = PickingMode.Ignore;
        parent.Add(p);

        Vector2 from = icon.layout.center;
        float e = 0f;
        p.schedule.Execute(() =>
        {
            e += 0.016f;
            float t = Mathf.Clamp01(e / 0.5f);
            float u = 1f - t;
            float mv = 1f - u * u * u; // OutCubic
            p.style.left = from.x + dir.x * distance * mv;
            p.style.top = from.y + dir.y * distance * mv;
            p.style.scale = new Scale(Vector3.one * (1f - mv));
            if (t >= 1f) p.RemoveFromHierarchy();
        }).Every(16).Until(() => e >= 0.5f);
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`);

  /* 04 WIDGET */
  A('modal-open',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Overlay {
    opacity: 0;
    transition: opacity 200ms ease-out;
}
#Overlay.open { opacity: 0.6; }

#Panel {
    scale: 0.9 0.9;
    opacity: 0;
    transition: scale 300ms ease-out-back, opacity 150ms ease-out;
}
#Panel.open { scale: 1 1; opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ModalUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement overlay, panel;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        overlay = root.Q<VisualElement>("Overlay");
        panel = root.Q<VisualElement>("Panel");
    }

    public void Open()
    {
        overlay.style.display = DisplayStyle.Flex;
        overlay.schedule.Execute(() => { overlay.AddToClassList("open"); panel.AddToClassList("open"); });
    }

    public void Close()
    {
        overlay.RemoveFromClassList("open");
        panel.RemoveFromClassList("open");
        // フェードアウト後に非表示
        overlay.schedule.Execute(() => overlay.style.display = DisplayStyle.None).ExecuteLater(220);
    }
}`);

  A('toast',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Toast {
    translate: 0 80px;
    opacity: 0;
    transition: translate 350ms ease-out-cubic, opacity 350ms ease-out-cubic;
}
#Toast.show { translate: 0 0; opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ToastUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Toast";
    [SerializeField] float holdSeconds = 2f;

    public void Show()
    {
        var toast = document.rootVisualElement.Q<VisualElement>(elementName);
        toast.style.display = DisplayStyle.Flex;
        toast.schedule.Execute(() => toast.AddToClassList("show"));
        // 表示 → 一定時間後に自動で消す
        toast.schedule.Execute(() => toast.RemoveFromClassList("show"))
            .ExecuteLater((long)(holdSeconds * 1000) + 350);
        toast.schedule.Execute(() => toast.style.display = DisplayStyle.None)
            .ExecuteLater((long)(holdSeconds * 1000) + 700);
    }
}`);

  A('drawer',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Drawer {
    translate: -100% 0;   /* 幅ぶん画面外へ */
    transition: translate 350ms ease-out-cubic;
}
#Drawer.open { translate: 0 0; }

#Overlay {
    opacity: 0;
    transition: opacity 350ms ease-out;
}
#Overlay.open { opacity: 0.5; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DrawerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement drawer, overlay;
    bool isOpen;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        drawer = root.Q<VisualElement>("Drawer");
        overlay = root.Q<VisualElement>("Overlay");
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        drawer.EnableInClassList("open", isOpen);
        overlay.EnableInClassList("open", isOpen);
    }
}`);

  A('accordion',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Content {
    overflow: hidden;
    height: 0;
    transition: height 300ms ease-out-cubic;
}
#Arrow {
    transition: rotate 300ms ease-out-cubic;
}
#Arrow.open { rotate: 180deg; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class AccordionUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement content, inner, arrow;
    bool isOpen;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        content = root.Q<VisualElement>("Content");
        inner = root.Q<VisualElement>("Inner");   // 中身の実体(高さ計測用)
        arrow = root.Q<VisualElement>("Arrow");
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        // height:auto はトランジションできないので実測px を指定する
        content.style.height = isOpen ? inner.resolvedStyle.height : 0f;
        arrow.EnableInClassList("open", isOpen);
    }
}`);

  A('tab-switch',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Indicator {
    transition: translate 250ms ease-out-cubic;
}
.tab-page {
    opacity: 0;
    display: none;
    transition: opacity 200ms ease-out;
}
.tab-page.active {
    opacity: 1;
    display: flex;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class TabSwitchUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float tabWidth = 120f;
    VisualElement indicator;
    VisualElement[] pages;
    int current;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        indicator = root.Q<VisualElement>("Indicator");
        pages = root.Query<VisualElement>(className: "tab-page").ToList().ToArray();
    }

    public void Select(int index)
    {
        if (index == current) return;
        pages[current].RemoveFromClassList("active");
        pages[index].AddToClassList("active");
        indicator.style.translate = new Translate(index * tabWidth, 0, 0);
        current = index;
    }
}`);

  A('tooltip',
`/* ===== UI Toolkit — USS だけで完結 (:hover + transition-delay) ===== */
/* Tooltip を Target の子として配置。表示だけ遅延させる */
#Target > #Tooltip {
    opacity: 0;
    translate: 0 6px;
    transition: opacity 200ms ease-out 0ms, translate 200ms ease-out 0ms;
}
#Target:hover > #Tooltip {
    opacity: 1;
    translate: 0 0;
    /* transition-delay 400ms で「少し待ってから表示」を実現 (消す時は即時) */
    transition: opacity 200ms ease-out 400ms, translate 200ms ease-out 400ms;
}`);

  A('dropdown',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Panel {
    transform-origin: top;
    scale: 1 0;
    transition: scale 250ms ease-out-cubic;
}
#Panel.open { scale: 1 1; }

#Items {
    opacity: 0;
    transition: opacity 150ms ease-out 80ms;
}
#Panel.open #Items { opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DropdownUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string headName = "Head";
    [SerializeField] string panelName = "Panel";

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var head = root.Q<VisualElement>(headName);
        var panel = root.Q<VisualElement>(panelName);
        head.RegisterCallback<ClickEvent>(_ => panel.ToggleInClassList("open"));
    }
}`);

  A('fab-menu',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Main {
    transition: rotate 250ms ease-out-back;
}
#Main.open { rotate: 45deg; }

.fab-child {
    scale: 0 0;
    transition: scale 300ms ease-out-back;
}
.fab-child.open { scale: 1 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;
using UnityEngine.UIElements.Experimental;   // TimeValue用途は無し。下記はStyleListで指定

public class FabMenuUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float staggerDelay = 0.06f;
    VisualElement main;
    System.Collections.Generic.List<VisualElement> children;
    bool isOpen;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        main = root.Q<VisualElement>("Main");
        children = root.Query<VisualElement>(className: "fab-child").ToList();
    }

    public void Toggle()
    {
        isOpen = !isOpen;
        main.EnableInClassList("open", isOpen);
        for (int i = 0; i < children.Count; i++)
        {
            // 子ごとに transition-delay をずらして時間差(stagger)を出す
            float delay = isOpen ? i * staggerDelay : (children.Count - 1 - i) * 0.04f;
            children[i].style.transitionDelay = new System.Collections.Generic.List<TimeValue>
            {
                new TimeValue(delay, TimeUnit.Second)
            };
            children[i].EnableInClassList("open", isOpen);
        }
    }
}`);

  A('page-wipe',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Wipe {
    translate: -150% 0;
    transition: translate 300ms ease-in-out-cubic;
}
#Wipe.cover  { translate: 0 0; }
#Wipe.reveal { translate: 150% 0; }

/* ===== C# (.cs) ===== */
using System;
using UnityEngine;
using UnityEngine.UIElements;

public class PageWipeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Wipe";

    public void Play(Action onCovered)
    {
        var wipe = document.rootVisualElement.Q<VisualElement>(elementName);
        wipe.RemoveFromClassList("reveal");
        wipe.AddToClassList("cover");

        void OnCover(TransitionEndEvent _)
        {
            wipe.UnregisterCallback<TransitionEndEvent>(OnCover);
            onCovered?.Invoke();                         // 覆われた瞬間に画面を切替
            wipe.schedule.Execute(() =>
            {
                wipe.RemoveFromClassList("cover");
                wipe.AddToClassList("reveal");
            }).ExecuteLater(150);
        }
        wipe.RegisterCallback<TransitionEndEvent>(OnCover);
    }
}`);

  /* 05 TEXT */
  A('typewriter',
`/* ===== UI Toolkit — 1文字ずつ表示のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class TypewriterUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Label";
    [SerializeField] float charsPerSecond = 20f;

    public void Play(string message)
    {
        var label = document.rootVisualElement.Q<Label>(elementName);
        float acc = 0f;
        int shown = 0;
        label.schedule.Execute(() =>
        {
            acc += charsPerSecond * 0.016f;
            shown = Mathf.Min(Mathf.FloorToInt(acc), message.Length);
            label.text = message.Substring(0, shown);
        }).Every(16).Until(() => shown >= message.Length);
    }
}`);

  A('char-stagger',
`/* ===== UI Toolkit — USS (.uss) ===== */
.stagger-char {
    opacity: 0;
    translate: 0 10px;
    transition: opacity 300ms ease-out, translate 300ms ease-out;
}
.stagger-char.play {
    opacity: 1;
    translate: 0 0;
}

/* ===== C# (.cs) ===== */
/* 文字ごとに Label を並べ、transition-delay をずらして順に出す */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class CharStaggerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Title";
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => Play();

    public void Play()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var chars = container.Query<Label>(className: "stagger-char").ToList();
        for (int i = 0; i < chars.Count; i++)
        {
            chars[i].RemoveFromClassList("play");
            chars[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
        }
        container.schedule.Execute(() =>
        {
            foreach (var c in chars) c.AddToClassList("play");
        });
    }
}`);

  A('count-up',
`/* ===== UI Toolkit — 数値カウントのため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CountUpUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Score";
    [SerializeField] float duration = 1.2f;

    public void Play(int targetValue)
    {
        var label = document.rootVisualElement.Q<Label>(elementName);
        float elapsed = 0f;
        label.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float e = p >= 1f ? 1f : 1f - Mathf.Pow(2f, -10f * p); // OutExpo
            label.text = Mathf.RoundToInt(targetValue * e).ToString("N0");
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('score-pop',
`/* ===== UI Toolkit — ポップ文字を生成して schedule で上昇フェード (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ScorePopUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "PopLayer";
    [SerializeField] float riseDistance = 50f;

    public void Spawn(Vector2 position, int value)
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var pop = new Label($"+{value:N0}");
        pop.style.position = Position.Absolute;
        pop.style.left = position.x;
        pop.style.top = position.y;
        pop.style.color = new Color(0.96f, 0.88f, 0.01f);
        pop.style.unityFontStyleAndWeight = FontStyle.Bold;
        pop.pickingMode = PickingMode.Ignore;
        container.Add(pop);

        float elapsed = 0f;
        pop.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / 0.7f);
            float u = 1f - p;
            pop.style.top = position.y - riseDistance * (1f - u * u * u); // OutCubic
            float s = Mathf.Clamp01(elapsed / 0.2f);
            pop.style.scale = new Scale(Vector3.one * Mathf.LerpUnclamped(0.5f, 1f, OutBack(s)));
            pop.style.opacity = elapsed < 0.35f ? 1f : 1f - (elapsed - 0.35f) / 0.35f;
            if (p >= 1f) pop.RemoveFromHierarchy();
        }).Every(16).Until(() => elapsed >= 0.7f);
    }

    static float OutBack(float t)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = t - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`);

  A('damage-text',
`/* ===== UI Toolkit — 揺れ + 色戻しを schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DamageTextUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "HpLabel";
    [SerializeField] float strength = 8f;
    [SerializeField] float duration = 0.4f;
    Color baseColor = Color.white;
    Color damageColor = new Color(1f, 0.3f, 0.23f);

    public void Play(int newValue)
    {
        var label = document.rootVisualElement.Q<Label>(elementName);
        label.text = newValue.ToString("N0");
        float elapsed = 0f;
        label.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float p = Mathf.Clamp01(elapsed / duration);
            float x = (Mathf.PerlinNoise(elapsed * 24f, 0f) * 2f - 1f) * strength * (1f - p);
            label.style.translate = new Translate(p >= 1f ? 0f : x, 0, 0);
            label.style.color = Color.Lerp(damageColor, baseColor, p * p);
        }).Every(16).Until(() => elapsed >= duration);
    }
}`);

  A('shine',
`/* ===== UI Toolkit — 光の帯を schedule で走らせる (.cs) ===== */
/* overflow:hidden の親の中で、光の帯 VisualElement を左→右へ動かす */
using UnityEngine;
using UnityEngine.UIElements;

public class ShineUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string stripName = "Shine";
    [SerializeField] float startX = -80f;
    [SerializeField] float endX = 280f;
    [SerializeField] float sweepDuration = 0.7f;
    [SerializeField] float interval = 2f;

    void OnEnable()
    {
        var strip = document.rootVisualElement.Q<VisualElement>(stripName);
        float clock = 0f;
        float total = sweepDuration + interval;
        strip.schedule.Execute(() =>
        {
            clock = (clock + 0.016f) % total;
            float p = Mathf.Clamp01(clock / sweepDuration);
            float e = p < 0.5f ? 2f * p * p : 1f - Mathf.Pow(-2f * p + 2f, 2f) / 2f; // InOutQuad
            strip.style.translate = new Translate(Mathf.Lerp(startX, endX, e), 0, 0);
        }).Every(16);
    }
}`);

  /* 06 LOADING */
  A('spinner',
`/* ===== UI Toolkit — 連続回転のため schedule で実装 (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class SpinnerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Spinner";
    [SerializeField] float duration = 1f;

    void OnEnable()
    {
        var el = document.rootVisualElement.Q<VisualElement>(elementName);
        float angle = 0f;
        el.schedule.Execute(() =>
        {
            angle = (angle - 360f * 16f / 1000f / duration) % 360f;
            el.style.rotate = new Rotate(new Angle(angle, AngleUnit.Degree));
        }).Every(16);
    }
}`);

  A('dots-loading',
`/* ===== UI Toolkit — 位相をずらしたsin波を schedule で実装 (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class DotsLoadingUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Dots";
    [SerializeField] float stagger = 0.15f;
    [SerializeField] float duration = 0.4f;

    void OnEnable()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        List<VisualElement> dots = container.Query<VisualElement>(className: "dot").ToList();
        float time = 0f;
        container.schedule.Execute(() =>
        {
            time += 0.016f;
            for (int i = 0; i < dots.Count; i++)
            {
                float phase = (time - i * stagger) / duration * Mathf.PI;
                float wave = (Mathf.Sin(phase - Mathf.PI / 2f) + 1f) * 0.5f;
                float s = Mathf.Lerp(0.5f, 1f, wave);
                dots[i].style.scale = new Scale(new Vector3(s, s, 1f));
            }
        }).Every(16);
    }
}`);

  A('progress-bar',
`/* ===== UI Toolkit — USS (.uss) ===== */
#Fill {
    width: 0;
    transition: width 400ms ease-out-cubic;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ProgressBarUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string fillName = "Fill";
    [SerializeField] string labelName = "Percent";
    VisualElement fill;
    Label percent;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        fill = root.Q<VisualElement>(fillName);
        percent = root.Q<Label>(labelName);
    }

    /// <summary>進捗(0〜1)を反映。widthのtransitionが滑らかに追従する</summary>
    public void SetProgress(float target)
    {
        target = Mathf.Clamp01(target);
        fill.style.width = Length.Percent(target * 100f);
        if (percent != null) percent.text = Mathf.RoundToInt(target * 100f) + "%";
    }
}`);

  A('circular-progress',
`/* ===== UI Toolkit — 円形フィルは Painter2D(Vector API)で描く (.cs / Unity 2022.2+) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CircularProgressUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string elementName = "Ring";
    VisualElement ring;
    float progress; // 0..1

    void OnEnable()
    {
        ring = document.rootVisualElement.Q<VisualElement>(elementName);
        ring.generateVisualContent += OnGenerate;
    }

    public void StartCooldown(float seconds)
    {
        float elapsed = 0f;
        ring.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            progress = Mathf.Clamp01(elapsed / seconds);
            ring.MarkDirtyRepaint();   // 再描画を要求
        }).Every(16).Until(() => elapsed >= seconds);
    }

    void OnGenerate(MeshGenerationContext context)
    {
        var p = context.painter2D;
        Vector2 c = ring.contentRect.center;
        float r = Mathf.Min(c.x, c.y) - 6f;

        p.lineWidth = 8f;
        p.strokeColor = new Color(0.17f, 0.17f, 0.19f);
        p.BeginPath();
        p.Arc(c, r, 0f, 360f);
        p.Stroke();

        if (progress <= 0f) return;
        p.strokeColor = new Color(0.96f, 0.88f, 0.01f);
        p.BeginPath();
        p.Arc(c, r, -90f, -90f + 360f * progress);
        p.Stroke();
    }
}`);

  A('skeleton', pingPong('SkeletonUIToolkit', 'Skeleton',
`#Skeleton {
    opacity: 0.35;
    transition: opacity 800ms ease-in-out-sine;
}
#Skeleton.on { opacity: 0.7; }`));

  /* 07 LIST */
  A('list-stagger',
`/* ===== UI Toolkit — USS (.uss) ===== */
.list-row {
    opacity: 0;
    translate: -40px 0;
    transition: opacity 300ms ease-out-cubic, translate 300ms ease-out-cubic;
}
.list-row.play {
    opacity: 1;
    translate: 0 0;
}

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class ListStaggerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "List";
    [SerializeField] float stagger = 0.06f;

    void OnEnable() => Play();

    public void Play()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var rows = container.Query<VisualElement>(className: "list-row").ToList();
        for (int i = 0; i < rows.Count; i++)
        {
            rows[i].RemoveFromClassList("play");
            rows[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
        }
        container.schedule.Execute(() => { foreach (var r in rows) r.AddToClassList("play"); });
    }
}`);

  A('grid-stagger',
`/* ===== UI Toolkit — USS (.uss) ===== */
.grid-cell {
    scale: 0 0;
    transition: scale 250ms ease-out-back;
}
.grid-cell.play { scale: 1 1; }

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class GridStaggerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string containerName = "Grid";
    [SerializeField] int columns = 4;
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => Play();

    public void Play()
    {
        var container = document.rootVisualElement.Q<VisualElement>(containerName);
        var cells = container.Query<VisualElement>(className: "grid-cell").ToList();
        for (int i = 0; i < cells.Count; i++)
        {
            int row = i / columns, col = i % columns;
            cells[i].RemoveFromClassList("play");
            // 対角線状の波にする (row + col) * stagger
            cells[i].style.transitionDelay = new List<TimeValue> { new TimeValue((row + col) * stagger, TimeUnit.Second) };
        }
        container.schedule.Execute(() => { foreach (var c in cells) c.AddToClassList("play"); });
    }
}`);

  A('reorder',
`/* ===== UI Toolkit — USS (.uss) ===== */
/* 各行に position:absolute + translate を使い、順位変更を transition で滑らかに */
.rank-row {
    position: absolute;
    transition: translate 400ms ease-in-out-cubic;
}

/* ===== C# (.cs) ===== */
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.UIElements;

public class ReorderUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float rowHeight = 40f;

    /// <summary>スコア順に並び替えて各行を新しいYへ移動する</summary>
    public void Sort(List<(VisualElement row, int score)> items)
    {
        var sorted = items.OrderByDescending(x => x.score).ToList();
        for (int rank = 0; rank < sorted.Count; rank++)
            sorted[rank].row.style.translate = new Translate(0, rank * rowHeight, 0);
    }
}`);

  A('ticker',
`/* ===== UI Toolkit — 無限スクロールのため schedule で実装 (.cs) ===== */
/* 同一テキストの Label を2つ横に並べた content を流し続ける */
using UnityEngine;
using UnityEngine.UIElements;

public class TickerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string contentName = "TickerContent";
    [SerializeField] float textWidth = 600f;   // テキスト1つぶんの幅
    [SerializeField] float speed = 80f;         // px/秒

    void OnEnable()
    {
        var content = document.rootVisualElement.Q<VisualElement>(contentName);
        float x = 0f;
        content.schedule.Execute(() =>
        {
            x -= speed * 0.016f;
            if (x <= -textWidth) x += textWidth;   // 継ぎ目なくループ
            content.style.translate = new Translate(x, 0, 0);
        }).Every(16);
    }
}`);
})();
