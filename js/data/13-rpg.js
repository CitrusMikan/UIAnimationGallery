/* 13-rpg.js — RPG / ADV ジャンルの手触りモーション (第1弾 3種)
 *   command-cursor / hp-damage-bar / level-up
 * 配属: widget / loading / attention。各種にUI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. コマンドカーソル (widget / interactive) */
  R({
    id: 'command-cursor',
    interactive: true,
    title: 'コマンドカーソル',
    titleEn: 'Command Cursor',
    category: 'widget',
    tags: ['RPG', 'カーソル', '選択', 'バトル'],
    description: 'コマンドリストの選択カーソル(▶)が項目間をぴょこんと跳ねて移動し、選択中の行がわずかに脈動する。コマンド式バトルのコマンド選択・メニュー・装備選択に。カーソルのY移動を OutBack、選択行の強調を punch(減衰振動)で作ると手触りが良い。プレビューは項目クリックで選択。',
    spec: {
      cursor: { target: 'カーソルの anchoredPosition.y', duration: 0.22, ease: 'OutBack' },
      selected_row: { target: 'localScale', punch: 0.04, ease: 'punch(減衰振動)', loop: '選択中は待機で微脈動' },
      idle_bob: 'カーソル自体もX方向に±3pxで待機アニメすると生きて見える',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, {
        position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px',
        padding: '10px 12px 10px 30px', minWidth: '150px',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      });
      ctx.stage.appendChild(wrap);
      const labels = ['ATTACK', 'MAGIC', 'ITEM', 'GUARD'];
      const ROW = 26;
      const rows = labels.map(l => {
        const r = PV.el('mono', {
          height: ROW + 'px', display: 'flex', alignItems: 'center',
          fontSize: '12px', letterSpacing: '0.12em', color: 'var(--pv-dim)',
          cursor: 'pointer', willChange: 'transform', transformOrigin: 'left center',
        }, l);
        wrap.appendChild(r);
        return r;
      });
      const cursor = PV.el(null, {
        position: 'absolute', left: '12px', top: '10px', width: '12px', height: ROW + 'px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--pv-accent)', fontSize: '13px', willChange: 'transform', pointerEvents: 'none',
      }, '▶');
      wrap.appendChild(cursor);

      let cur = -1, cy = 0;
      const select = i => {
        if (i === cur) return;
        const from = cy, to = i * (ROW + 4);
        ctx.tween({ duration: 0.22, ease: 'OutBack', onUpdate: v => { cy = lerp(from, to, v); cursor.style.transform = `translateY(${cy}px)`; } });
        // 選択行を punch で軽く強調
        rows.forEach((r, j) => {
          r.style.color = j === i ? 'var(--pv-accent)' : 'var(--pv-dim)';
          if (j === i) ctx.tween({ from: 0, to: 1, duration: 0.4, onUpdate: t => { const p = EASE.punchWave(t, 8, 0.5) * 0.04; PV.applyT(r, { x: 4, s: 1 + p }); } });
          else PV.applyT(r, { x: 0, s: 1 });
        });
        cur = i;
      };
      rows.forEach((r, i) => r.addEventListener('click', () => select(i)));
      // カーソルの待機ボブ
      ctx.tween({ from: 0, to: 1, duration: 0.7, ease: 'InOutSine', loops: -1, loopType: 'Yoyo', onUpdate: v => cursor.style.marginLeft = lerp(-2, 2, v) + 'px' });
      requestAnimationFrame(() => select(0));
      let auto = 0;
      ctx.forever(async () => { await ctx.wait(1.3); auto = (auto + 1) % labels.length; select(auto); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// カーソルは行の高さ単位で Y 移動。選択行は Punch で軽く脈動させる
public class CommandCursorLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform cursor;
    [SerializeField] RectTransform[] rows;     // コマンド行 (上から)
    [SerializeField] float duration = 0.22f;

    MotionHandle pulse;

    public void Select(int index)
    {
        LMotion.Create(cursor.anchoredPosition.y, rows[index].anchoredPosition.y, duration)
            .WithEase(Ease.OutBack)
            .BindToAnchoredPositionY(cursor);

        if (pulse.IsActive()) pulse.Cancel();
        var t = rows[index];
        pulse = LMotion.Punch.Create(Vector3.zero, Vector3.one * 0.05f, 0.4f)
            .Bind(v => t.localScale = Vector3.one + v)
            .AddTo(gameObject);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CommandCursorDOTween : MonoBehaviour
{
    [SerializeField] RectTransform cursor;
    [SerializeField] RectTransform[] rows;
    [SerializeField] float duration = 0.22f;

    public void Select(int index)
    {
        cursor.DOAnchorPosY(rows[index].anchoredPosition.y, duration).SetEase(Ease.OutBack);
        rows[index].DOPunchScale(Vector3.one * 0.05f, 0.4f, 6, 0.5f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CommandCursorCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform cursor;
    [SerializeField] RectTransform[] rows;
    [SerializeField] float duration = 0.22f;

    public void Select(int index)
    {
        StopAllCoroutines();
        StartCoroutine(Move(rows[index].anchoredPosition.y));
    }

    IEnumerator Move(float targetY)
    {
        float fromY = cursor.anchoredPosition.y, t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / duration));
            cursor.anchoredPosition = new Vector2(cursor.anchoredPosition.x, Mathf.LerpUnclamped(fromY, targetY, e));
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
#Cursor {
    position: absolute;
    left: 12px;
    transition: top 220ms ease-out-back;
}
.command-row { color: rgb(154, 154, 150); transition: color 150ms ease-out; }
.command-row.selected { color: rgb(245, 224, 3); }

/* ===== C# (.cs) — カーソルの top を選択行に合わせる ===== */
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;

public class CommandCursorUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement cursor;
    List<VisualElement> rows;
    int current = -1;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        cursor = root.Q<VisualElement>("Cursor");
        rows = root.Query<VisualElement>(className: "command-row").ToList();
        for (int i = 0; i < rows.Count; i++)
        {
            int idx = i;
            rows[i].RegisterCallback<ClickEvent>(_ => Select(idx));
        }
        Select(0);
    }

    public void Select(int index)
    {
        if (index == current) return;
        var row = rows[index];
        row.schedule.Execute(() => cursor.style.top = row.layout.y);
        if (current >= 0) rows[current].RemoveFromClassList("selected");
        row.AddToClassList("selected");
        current = index;
    }
}`,
    },
  });

  /* 2. ダメージゲージ (loading) */
  R({
    id: 'hp-damage-bar',
    title: 'ダメージゲージ',
    titleEn: 'HP Damage Bar',
    category: 'loading',
    tags: ['RPG', 'HP', 'ゲージ', 'ダメージ'],
    description: '被弾で前面の色バーが即座に減り、背後の白い「遅延バー」がワンテンポ遅れて追いつく2層ゲージ。減った量が視覚的に伝わり、RPG/対戦のHP表示の定番。前面=即時、背面=delay付き OutCubic の2本立てで作る。回復時は逆に前面を先に伸ばす。',
    spec: {
      layers: '前面(現在HP) / 背面(遅延・白または赤)',
      on_damage: { front: 'すぐ目標へ (0.12s)', back: 'delay 0.4s → 0.5s OutCubic で追従' },
      on_heal: '前面を先に伸ばし、背面が後追い',
      note: '実機は fillAmount を持つ Image を2枚重ね',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' });
      ctx.stage.appendChild(wrap);
      const track = PV.el(null, {
        position: 'relative', width: '190px', height: '18px', overflow: 'hidden',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)',
      });
      const mkBar = color => PV.el(null, { position: 'absolute', left: '0', top: '0', bottom: '0', width: '100%', background: color, transformOrigin: 'left center', willChange: 'transform' });
      const delayed = mkBar('rgba(255,255,255,0.72)');      // 遅延バー(白)
      const front = mkBar('var(--pv-accent)');              // 現在HP
      track.appendChild(delayed); track.appendChild(front);
      wrap.appendChild(track);
      const label = PV.el('mono', { fontSize: '11px', letterSpacing: '0.14em', color: 'var(--pv-dim)' }, 'HP');
      wrap.appendChild(label);

      let hp = 1;
      const setFront = v => { hp = v; front.style.transform = `scaleX(${v})`; };
      const setDelayed = v => delayed.style.transform = `scaleX(${v})`;
      setFront(1); setDelayed(1);

      const damage = async amount => {
        const to = Math.max(0, hp - amount);
        const from = hp;
        front.style.background = 'var(--pv-accent)';
        await ctx.tween({ from, to, duration: 0.12, ease: 'OutQuad', onUpdate: setFront });
        await ctx.tween({ from, to, duration: 0.5, delay: 0.35, ease: 'OutCubic', onUpdate: setDelayed });
      };
      const heal = async () => {
        const from = hp;
        await ctx.tween({ from, to: 1, duration: 0.4, ease: 'OutCubic', onUpdate: setFront });
        await ctx.tween({ from, to: 1, duration: 0.3, onUpdate: setDelayed });
      };
      ctx.forever(async () => {
        await ctx.wait(0.8); await damage(0.28);
        await ctx.wait(0.7); await damage(0.34);
        await ctx.wait(0.7); await damage(0.22);
        await ctx.wait(0.9); await heal();
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// front = 現在HP。delayed = 遅れて追従する白バー(減った量を見せる)
public class HpDamageBarLitMotion : MonoBehaviour
{
    [SerializeField] Image front;
    [SerializeField] Image delayed;

    public void SetHp(float ratio)   // 0..1
    {
        float from = front.fillAmount;
        // 前面はすぐ反映
        LMotion.Create(from, ratio, 0.12f).WithEase(Ease.OutQuad)
            .Bind(v => front.fillAmount = v);
        // 背面(遅延バー)はワンテンポ置いて追いつく
        LMotion.Create(delayed.fillAmount, ratio, 0.5f)
            .WithEase(Ease.OutCubic).WithDelay(ratio < from ? 0.35f : 0f)
            .Bind(v => delayed.fillAmount = v);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class HpDamageBarDOTween : MonoBehaviour
{
    [SerializeField] Image front;
    [SerializeField] Image delayed;

    public void SetHp(float ratio)
    {
        float from = front.fillAmount;
        front.DOFillAmount(ratio, 0.12f).SetEase(Ease.OutQuad);
        delayed.DOFillAmount(ratio, 0.5f).SetEase(Ease.OutCubic)
            .SetDelay(ratio < from ? 0.35f : 0f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class HpDamageBarCoroutine : MonoBehaviour
{
    [SerializeField] Image front;
    [SerializeField] Image delayed;

    public void SetHp(float ratio)
    {
        StopAllCoroutines();
        bool dmg = ratio < front.fillAmount;
        StartCoroutine(Fill(front, ratio, 0.12f, 0f, false));
        StartCoroutine(Fill(delayed, ratio, 0.5f, dmg ? 0.35f : 0f, true));
    }

    IEnumerator Fill(Image img, float target, float duration, float delay, bool cubic)
    {
        if (delay > 0f) yield return new WaitForSeconds(delay);
        float from = img.fillAmount, t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = cubic ? 1f - Mathf.Pow(1f - p, 3f) : 1f - (1f - p) * (1f - p); // OutCubic / OutQuad
            img.fillAmount = Mathf.Lerp(from, target, e);
            yield return null;
        }
        img.fillAmount = target;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 2枚の bar を重ね、width(%) を transition で動かす。遅延は C# で付与 */
.hp-track { overflow: hidden; }
.hp-fill { position: absolute; left: 0; top: 0; bottom: 0; }
.hp-front  { background-color: rgb(245, 224, 3); transition: width 120ms ease-out; }
.hp-delayed { background-color: rgba(255, 255, 255, 0.72); transition: width 500ms ease-out-cubic; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HpDamageBarUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement front, delayed;
    float current = 1f;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        front = root.Q<VisualElement>("HpFront");
        delayed = root.Q<VisualElement>("HpDelayed");
    }

    public void SetHp(float ratio)   // 0..1
    {
        bool dmg = ratio < current;
        front.style.width = Length.Percent(ratio * 100f);
        // 遅延バーは被弾時だけ transition-delay を付ける
        delayed.style.transitionDelay = new System.Collections.Generic.List<TimeValue>
            { new TimeValue(dmg ? 0.35f : 0f, TimeUnit.Second) };
        delayed.style.width = Length.Percent(ratio * 100f);
        current = ratio;
    }
}`,
    },
  });

  /* 3. レベルアップ (attention) */
  R({
    id: 'level-up',
    title: 'レベルアップ',
    titleEn: 'Level Up',
    category: 'attention',
    tags: ['RPG', '演出', '強調', 'ファンファーレ'],
    description: '「LEVEL UP」のバナーが弾んで現れ、背後から光条が放射して達成感を出す祝福演出。レベルアップ・ミッション達成・アンロックに。バナーは OutBack でスケールイン、光条は回転しながら scaleX で伸ばし、最後にフェードで締める。',
    spec: {
      banner: { scale: '0.5→1', alpha: '0→1', duration: 0.5, ease: 'OutBack' },
      rays: { target: '光条の回転 + scale', spin: '連続', ease: 'OutExpo' },
      hold: 1.0,
      out: { scale: '1→1.1', alpha: '1→0', duration: 0.35, ease: 'InCubic' },
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      // 光条
      const rays = PV.el(null, { position: 'absolute', left: '0', top: '0', width: '220px', height: '220px', marginLeft: '-110px', marginTop: '-110px', willChange: 'transform', pointerEvents: 'none' });
      const N = 12;
      for (let i = 0; i < N; i++) {
        const ray = PV.el(null, {
          position: 'absolute', left: '50%', top: '50%', width: '110px', height: '5px',
          marginTop: '-2.5px', transformOrigin: 'left center', transform: `rotate(${i / N * 360}deg) scaleX(0)`,
          background: 'linear-gradient(90deg, var(--pv-accent), transparent)', opacity: '0.7',
        });
        rays.appendChild(ray);
      }
      center.appendChild(rays);
      const banner = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0.5)',
        padding: '10px 22px', whiteSpace: 'nowrap', willChange: 'transform,opacity',
        background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '22px', letterSpacing: '0.12em',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      }, 'LEVEL UP');
      center.appendChild(banner);

      const setBanner = (s, a) => { banner.style.transform = `translate(-50%,-50%) scale(${s})`; banner.style.opacity = a; };
      const rayEls = [...rays.children];
      let spin = 0;
      ctx.tween({ from: 0, to: 1, duration: 6, ease: 'Linear', loops: -1, onUpdate: (v, t) => { spin = t * 6 * 40; rays.style.transform = `rotate(${spin}deg)`; } });

      ctx.forever(async () => {
        setBanner(0.5, 0); rayEls.forEach(r => r.style.transform = r.style.transform.replace(/scaleX\([^)]*\)/, 'scaleX(0)'));
        await ctx.wait(0.3);
        ctx.tween({ from: 0, to: 1, duration: 0.6, ease: 'OutExpo', onUpdate: v => rayEls.forEach((r, i) => { const base = r.style.transform.match(/rotate\([^)]*\)/)[0]; r.style.transform = `${base} scaleX(${v})`; }) });
        await ctx.tween({ from: 0.5, to: 1, duration: 0.5, ease: 'OutBack', onUpdate: (v, t) => setBanner(v, Math.min(t * 2.5, 1)) });
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 1.1, duration: 0.35, ease: 'InCubic', onUpdate: (v, t) => setBanner(v, 1 - t) });
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class LevelUpLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform banner;
    [SerializeField] RectTransform rays;
    [SerializeField] float holdSeconds = 1f;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        banner.localScale = Vector3.one * 0.5f;
        rays.localScale = Vector3.zero;
        group.alpha = 0f;
        // 光条の回転はループで回し続ける
        LMotion.Create(0f, 360f, 6f).WithEase(Ease.Linear).WithLoops(-1)
            .Bind(z => rays.localEulerAngles = new Vector3(0, 0, z));
        LSequence.Create()
            .Append(LMotion.Create(0.5f, 1f, 0.5f).WithEase(Ease.OutBack).Bind(s => banner.localScale = Vector3.one * s))
            .Join(LMotion.Create(0f, 1f, 0.6f).WithEase(Ease.OutExpo).Bind(s => rays.localScale = Vector3.one * s))
            .Join(LMotion.Create(0f, 1f, 0.4f).BindToAlpha(group))
            .AppendInterval(holdSeconds)
            .Append(LMotion.Create(1f, 0f, 0.35f).BindToAlpha(group))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class LevelUpDOTween : MonoBehaviour
{
    [SerializeField] RectTransform banner;
    [SerializeField] RectTransform rays;
    [SerializeField] float holdSeconds = 1f;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        banner.localScale = Vector3.one * 0.5f;
        rays.localScale = Vector3.zero;
        group.alpha = 0f;
        rays.DOLocalRotate(new Vector3(0, 0, 360f), 6f, RotateMode.FastBeyond360)
            .SetEase(Ease.Linear).SetLoops(-1, LoopType.Restart);
        DOTween.Sequence()
            .Append(banner.DOScale(1f, 0.5f).SetEase(Ease.OutBack))
            .Join(rays.DOScale(1f, 0.6f).SetEase(Ease.OutExpo))
            .Join(group.DOFade(1f, 0.4f))
            .AppendInterval(holdSeconds)
            .Append(group.DOFade(0f, 0.35f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class LevelUpCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform banner;
    [SerializeField] RectTransform rays;
    [SerializeField] float holdSeconds = 1f;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        group.alpha = 0f;
        float t = 0f;
        while (t < 0.6f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.6f);
            banner.localScale = Vector3.one * Mathf.LerpUnclamped(0.5f, 1f, OutBack(Mathf.Clamp01(t / 0.5f)));
            rays.localScale = Vector3.one * (1f - Mathf.Pow(2f, -10f * p)); // OutExpo
            rays.localEulerAngles = new Vector3(0, 0, Time.time * 60f);
            group.alpha = Mathf.Clamp01(t / 0.4f);
            yield return null;
        }
        yield return new WaitForSeconds(holdSeconds);
        t = 0f;
        while (t < 0.35f) { t += Time.deltaTime; group.alpha = 1f - Mathf.Clamp01(t / 0.35f); yield return null; }
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
#Banner {
    scale: 0.5 0.5;
    opacity: 0;
    transition: scale 500ms ease-out-back, opacity 400ms ease-out;
}
#Banner.shown { scale: 1 1; opacity: 1; }
#Rays { scale: 0 0; transition: scale 600ms ease-out-expo; }
#Rays.shown { scale: 1 1; }

/* ===== C# (.cs) — 光条の連続回転は schedule で ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class LevelUpUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float holdMs = 1000f;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var banner = root.Q<VisualElement>("Banner");
        var rays = root.Q<VisualElement>("Rays");
        rays.schedule.Execute(() => rays.style.rotate =
            new Rotate(new Angle((Time.time * 60f) % 360f, AngleUnit.Degree))).Every(16);
        banner.AddToClassList("shown");
        rays.AddToClassList("shown");
        banner.schedule.Execute(() =>
        {
            banner.RemoveFromClassList("shown");
            rays.RemoveFromClassList("shown");
        }).ExecuteLater((long)holdMs + 500);
    }
}`,
    },
  });

  /* 4. メッセージ送り (widget) */
  R({
    id: 'message-advance',
    title: 'メッセージ送り',
    titleEn: 'Message Advance',
    category: 'widget',
    tags: ['ADV', '会話', '送り', '▼'],
    description: '会話ウィンドウ末尾の送り矢印(▼)が、点滅しながら上下に小さくバウンスして「クリック待ち」を伝えるアイドル演出。ADVのメッセージ送り待ち・次ページ誘導に。alpha点滅とY方向バウンスをどちらも InOutSine の Yoyo 無限ループで重ねると自然な待機になる。',
    spec: {
      target: '会話ウィンドウ右下の送り矢印(▼)',
      blink: { alpha: '1→0.2', duration: 0.5, ease: 'InOutSine', loop: 'Yoyo 無限' },
      bounce: { y: '0→4px', duration: 0.5, ease: 'InOutSine', loop: 'Yoyo 無限' },
      note: 'クリック/タップ入力待ちの間だけ再生し、送り確定で停止する',
    },
    preview(ctx, PV) {
      const win = PV.el(null, {
        position: 'relative', width: '200px', minHeight: '78px',
        padding: '12px 14px 18px', boxSizing: 'border-box',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      });
      ctx.stage.appendChild(win);
      const speaker = PV.el('mono', { fontSize: '10px', letterSpacing: '0.16em', color: 'var(--pv-accent)', marginBottom: '6px' }, 'NPC');
      const body = PV.el(null, { fontSize: '11.5px', lineHeight: '1.5', color: 'var(--pv-text)' }, 'この先は 危険だ。準備は いいか……？');
      win.appendChild(speaker); win.appendChild(body);
      const arrow = PV.el(null, {
        position: 'absolute', right: '12px', bottom: '8px',
        color: 'var(--pv-accent)', fontSize: '12px', willChange: 'transform,opacity', pointerEvents: 'none',
      }, '▼');
      win.appendChild(arrow);
      // 点滅 (alpha) と 上下バウンス (Y) をそれぞれ Yoyo 無限で重ねる
      ctx.tween({ from: 1, to: 0.2, duration: 0.5, ease: 'InOutSine', loops: -1, loopType: 'Yoyo', onUpdate: v => arrow.style.opacity = v });
      ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'InOutSine', loops: -1, loopType: 'Yoyo', onUpdate: v => PV.applyT(arrow, { y: lerp(0, 4, v) }) });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// 送り待ちの ▼。alpha点滅 と Y方向の小バウンスを Yoyo 無限で重ねる
public class MessageAdvanceLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform arrow;
    [SerializeField] Image arrowImage;
    [SerializeField] float baseY = -40f;

    void OnEnable()
    {
        LMotion.Create(1f, 0.25f, 0.5f).WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Yoyo)
            .Bind(a => { var c = arrowImage.color; c.a = a; arrowImage.color = c; });
        LMotion.Create(baseY, baseY - 6f, 0.5f).WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Yoyo)
            .BindToAnchoredPositionY(arrow);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class MessageAdvanceDOTween : MonoBehaviour
{
    [SerializeField] RectTransform arrow;
    [SerializeField] Image arrowImage;
    [SerializeField] float baseY = -40f;

    void OnEnable()
    {
        arrowImage.DOFade(0.25f, 0.5f).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
        arrow.DOAnchorPosY(baseY - 6f, 0.5f).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class MessageAdvanceCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform arrow;
    [SerializeField] Image arrowImage;
    [SerializeField] float baseY = -40f;

    void OnEnable() => StartCoroutine(Loop());

    IEnumerator Loop()
    {
        float t = 0f;
        while (true)
        {
            t += Time.deltaTime;
            float s = (Mathf.Sin(t * Mathf.PI * 2f) + 1f) * 0.5f; // 0..1
            var c = arrowImage.color; c.a = Mathf.Lerp(0.25f, 1f, s); arrowImage.color = c;
            arrow.anchoredPosition = new Vector2(arrow.anchoredPosition.x, baseY - (1f - s) * 6f);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 点滅とバウンスは連続ループなので schedule で駆動する */
#Arrow { position: absolute; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class MessageAdvanceUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float baseY = -40f;
    VisualElement arrow;
    float time;

    void OnEnable()
    {
        arrow = document.rootVisualElement.Q<VisualElement>("Arrow");
        arrow.schedule.Execute(() =>
        {
            time += 0.016f;
            float s = (Mathf.Sin(time * Mathf.PI * 2f) + 1f) * 0.5f;
            arrow.style.opacity = Mathf.Lerp(0.25f, 1f, s);
            arrow.style.top = baseY - (1f - s) * 6f;
        }).Every(16);
    }
}`,
    },
  });

  /* 5. EXP加算 (loading) */
  R({
    id: 'exp-gain',
    title: 'EXP加算',
    titleEn: 'EXP Gain',
    category: 'loading',
    tags: ['RPG', 'EXP', 'ゲージ', '経験値'],
    description: '戦闘後などに経験値ゲージが伸び、満タンに達すると発光して溢れ、次のレベルへ巻き戻って加算を続ける演出。単なる進捗バーと違い「満タン→周回(LV+1)」が要点。fill を OutCubic で伸ばし、1.0到達で白フラッシュ＋LVラベルを更新、0へ戻して超過分を継続する。',
    spec: {
      target: '経験値ゲージ(fillAmount 0..1) と LV ラベル',
      gain: { fill: '現在値→加算後', duration: 0.4, ease: 'OutCubic' },
      overflow: '1.0到達で発光フラッシュ→LV+1→0へ巻き戻し、超過分を継続',
      flash: { alpha: '0.9→0', duration: 0.4 },
      note: 'progress-bar と違い「満タン→周回」が要点。複数レベル分の加算も連鎖できる',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' });
      ctx.stage.appendChild(wrap);
      const head = PV.el(null, { display: 'flex', justifyContent: 'space-between', width: '196px', alignItems: 'baseline' });
      const lvLabel = PV.el(null, { fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '15px', letterSpacing: '0.08em', color: 'var(--pv-accent)' }, 'LV 5');
      const tag = PV.el('mono', { fontSize: '10px', letterSpacing: '0.16em', color: 'var(--pv-dim)' }, 'EXP');
      head.appendChild(lvLabel); head.appendChild(tag);
      wrap.appendChild(head);
      const track = PV.el(null, {
        position: 'relative', width: '196px', height: '16px', overflow: 'hidden',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
      });
      const fill = PV.el(null, { position: 'absolute', left: '0', top: '0', bottom: '0', width: '100%', background: 'var(--pv-accent)', transformOrigin: 'left center', willChange: 'transform' });
      const flash = PV.el(null, { position: 'absolute', inset: '0', background: 'rgba(255,255,255,0.9)', opacity: '0', pointerEvents: 'none' });
      track.appendChild(fill); track.appendChild(flash);
      wrap.appendChild(track);

      let exp = 0, lv = 5;
      const setFill = v => fill.style.transform = `scaleX(${v})`;
      setFill(0);
      const gains = [0.34, 0.3, 0.42, 0.28, 0.38];
      let gi = 0;
      ctx.forever(async () => {
        await ctx.wait(0.55);
        const g = gains[gi % gains.length]; gi++;
        const to = exp + g;
        if (to >= 1) {
          await ctx.tween({ from: exp, to: 1, duration: 0.45, ease: 'OutCubic', onUpdate: setFill });
          // 発光フラッシュ＆レベルアップ
          lv++; lvLabel.textContent = 'LV ' + lv;
          ctx.tween({ from: 0.9, to: 0, duration: 0.4, onUpdate: v => flash.style.opacity = v });
          await ctx.wait(0.12);
          exp = to - 1; setFill(0);
          if (exp > 0) await ctx.tween({ from: 0, to: exp, duration: 0.35, ease: 'OutCubic', onUpdate: setFill });
        } else {
          await ctx.tween({ from: exp, to, duration: 0.35, ease: 'OutCubic', onUpdate: setFill });
          exp = to;
        }
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// 経験値を加算。満タンで発光→LV++→0へ巻き戻して超過分を継続
public class ExpGainLitMotion : MonoBehaviour
{
    [SerializeField] Image fill;        // fillAmount 0..1
    [SerializeField] CanvasGroup flash;
    [SerializeField] Text levelLabel;
    int level = 5;
    float exp;

    void OnEnable() => levelLabel.text = "LV " + level;

    public void AddExp(float amount)
    {
        float to = exp + amount;
        if (to >= 1f)
            Fill(1f, 0.45f, () => LevelUp(to - 1f));
        else
            Fill(to, 0.4f, () => exp = to);
    }

    void Fill(float target, float dur, System.Action done)
    {
        LMotion.Create(fill.fillAmount, target, dur).WithEase(Ease.OutCubic)
            .WithOnComplete(() => done())
            .Bind(v => fill.fillAmount = v);
    }

    void LevelUp(float carry)
    {
        level++; exp = carry;
        levelLabel.text = "LV " + level;
        LMotion.Create(0.9f, 0f, 0.4f).Bind(a => flash.alpha = a);
        fill.fillAmount = 0f;
        if (carry > 0f) Fill(carry, 0.35f, () => { });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class ExpGainDOTween : MonoBehaviour
{
    [SerializeField] Image fill;
    [SerializeField] CanvasGroup flash;
    [SerializeField] Text levelLabel;
    int level = 5;
    float exp;

    void OnEnable() => levelLabel.text = "LV " + level;

    public void AddExp(float amount)
    {
        float to = exp + amount;
        if (to >= 1f)
            fill.DOFillAmount(1f, 0.45f).SetEase(Ease.OutCubic).OnComplete(() => LevelUp(to - 1f));
        else
            fill.DOFillAmount(to, 0.4f).SetEase(Ease.OutCubic).OnComplete(() => exp = to);
    }

    void LevelUp(float carry)
    {
        level++; exp = carry;
        levelLabel.text = "LV " + level;
        flash.alpha = 0.9f;
        flash.DOFade(0f, 0.4f);
        fill.fillAmount = 0f;
        if (carry > 0f) fill.DOFillAmount(carry, 0.35f).SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ExpGainCoroutine : MonoBehaviour
{
    [SerializeField] Image fill;
    [SerializeField] CanvasGroup flash;
    [SerializeField] Text levelLabel;
    int level = 5;
    float exp;

    void OnEnable() => levelLabel.text = "LV " + level;

    public void AddExp(float amount) => StartCoroutine(Add(amount));

    IEnumerator Add(float amount)
    {
        float to = exp + amount;
        if (to >= 1f)
        {
            yield return Fill(1f, 0.45f);
            level++; exp = to - 1f;
            levelLabel.text = "LV " + level;
            StartCoroutine(Flash());
            fill.fillAmount = 0f;
            if (exp > 0f) yield return Fill(exp, 0.35f);
        }
        else { yield return Fill(to, 0.4f); exp = to; }
    }

    IEnumerator Fill(float target, float dur)
    {
        float from = fill.fillAmount, t = 0f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / dur), 3f); // OutCubic
            fill.fillAmount = Mathf.Lerp(from, target, e);
            yield return null;
        }
        fill.fillAmount = target;
    }

    IEnumerator Flash()
    {
        float t = 0f;
        while (t < 0.4f) { t += Time.deltaTime; flash.alpha = 0.9f * (1f - t / 0.4f); yield return null; }
        flash.alpha = 0f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.exp-fill { transition: width 400ms ease-out-cubic; }
.exp-flash { opacity: 0; transition: opacity 400ms ease-out; }
.exp-flash.on { opacity: 0.9; transition-duration: 0ms; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ExpGainUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement fill, flash;
    Label levelLabel;
    int level = 5;
    float exp;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        fill = root.Q<VisualElement>("ExpFill");
        flash = root.Q<VisualElement>("ExpFlash");
        levelLabel = root.Q<Label>("LevelLabel");
        levelLabel.text = "LV " + level;
    }

    public void AddExp(float amount)
    {
        float to = exp + amount;
        if (to >= 1f)
        {
            fill.style.width = Length.Percent(100f);
            fill.schedule.Execute(() => LevelUp(to - 1f)).ExecuteLater(450);
        }
        else { fill.style.width = Length.Percent(to * 100f); exp = to; }
    }

    void LevelUp(float carry)
    {
        level++; exp = carry;
        levelLabel.text = "LV " + level;
        flash.AddToClassList("on");
        flash.schedule.Execute(() => flash.RemoveFromClassList("on")).ExecuteLater(16);
        // width の transition を一瞬無効化して即 0 に戻す
        fill.style.width = Length.Percent(0f);
        fill.schedule.Execute(() => fill.style.width = Length.Percent(carry * 100f)).ExecuteLater(16);
    }
}`,
    },
  });

  /* 6. アイテム入手 (attention) */
  R({
    id: 'item-get',
    title: 'アイテム入手',
    titleEn: 'Item Get',
    category: 'attention',
    tags: ['RPG', '入手', '宝箱', '報酬'],
    description: '宝箱がぽんと開き、中からアイテムアイコンが回転しながら飛び出して上昇し、下にネームプレートがフェードインする入手演出。宝箱・ドロップ・報酬提示に。箱は punch(減衰振動)でスカッシュして開き、アイコンは OutBack で跳ねて出す。',
    spec: {
      box: { squash: 'punch(減衰) scaleX+/scaleY- で開く', duration: 0.35 },
      icon: { scale: '0→1', y: '+6→-34px', rot: '0→360', duration: 0.55, ease: 'OutBack' },
      plate: { alpha: '0→1', y: '+6→0', duration: 0.3 },
      hold: 1.1,
      out: { alpha: '1→0', scale: '1→0', duration: 0.3, ease: 'InCubic' },
    },
    preview(ctx, PV) {
      const scene = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0', transform: 'translate(-50%,-50%)' });
      ctx.stage.appendChild(scene);
      const box = PV.el(null, {
        position: 'absolute', left: '-24px', top: '10px', width: '48px', height: '34px',
        background: 'var(--pv-panel2)', border: '2px solid var(--pv-line-strong)',
        clipPath: 'polygon(6px 0,100% 0,100% 100%,0 100%,0 6px)',
        willChange: 'transform', transformOrigin: 'center bottom',
      });
      const icon = PV.el(null, {
        position: 'absolute', left: '-13px', top: '4px', width: '26px', height: '26px',
        background: 'var(--pv-accent)', border: '2px solid var(--pv-on-accent)',
        willChange: 'transform,opacity', opacity: '0',
        transform: 'translateY(6px) scale(0) rotate(0deg)',
      });
      const plate = PV.el('mono', {
        position: 'absolute', left: '-42px', top: '52px', width: '84px', boxSizing: 'border-box',
        textAlign: 'center', padding: '4px 0', fontSize: '10px', letterSpacing: '0.18em',
        color: 'var(--pv-on-accent)', background: 'var(--pv-accent)',
        clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
        opacity: '0', willChange: 'transform,opacity',
      }, 'ITEM');
      scene.appendChild(box); scene.appendChild(plate); scene.appendChild(icon);

      ctx.forever(async () => {
        icon.style.opacity = '0'; icon.style.transform = 'translateY(6px) scale(0) rotate(0deg)';
        plate.style.opacity = '0'; plate.style.transform = 'translateY(6px)';
        PV.applyT(box, { s: 1 });
        await ctx.wait(0.45);
        // 箱がぽんと開く (スカッシュ)
        await ctx.tween({ from: 0, to: 1, duration: 0.35, onUpdate: t => { const p = EASE.punchWave(t, 7, 0.6) * 0.2; PV.applyT(box, { sx: 1 + p * 0.6, sy: 1 - p }); } });
        // アイコンが飛び出して上昇＋回転
        icon.style.opacity = '1';
        await ctx.tween({ from: 0, to: 1, duration: 0.55, ease: 'OutBack', onUpdate: v => { icon.style.transform = `translateY(${lerp(6, -34, v)}px) scale(${v}) rotate(${v * 360}deg)`; } });
        // ネームプレートがフェードイン
        await ctx.tween({ from: 0, to: 1, duration: 0.3, onUpdate: v => { plate.style.opacity = v; plate.style.transform = `translateY(${lerp(6, 0, v)}px)`; } });
        await ctx.wait(1.1);
        // 畳む
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InCubic', onUpdate: v => { icon.style.opacity = v; plate.style.opacity = v; icon.style.transform = `translateY(-34px) scale(${v}) rotate(360deg)`; } });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 箱がぽんと開き、アイコンが飛び出して上昇＋回転、ネームプレートがフェードイン
public class ItemGetLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform box;
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup iconGroup;
    [SerializeField] CanvasGroup plate;
    [SerializeField] float riseY = 60f;

    void OnEnable() => Play();

    public void Play()
    {
        icon.localScale = Vector3.zero;
        iconGroup.alpha = 0f;
        plate.alpha = 0f;
        LSequence.Create()
            .Append(LMotion.Punch.Create(Vector3.zero, new Vector3(0.2f, -0.2f, 0f), 0.35f)
                .Bind(v => box.localScale = Vector3.one + v))
            .Join(LMotion.Create(0f, 1f, 0.05f).Bind(a => iconGroup.alpha = a))
            .Append(LMotion.Create(0f, 1f, 0.55f).WithEase(Ease.OutBack)
                .Bind(v =>
                {
                    icon.localScale = Vector3.one * v;
                    icon.anchoredPosition = new Vector2(0f, Mathf.LerpUnclamped(6f, riseY, v));
                    icon.localEulerAngles = new Vector3(0f, 0f, v * 360f);
                }))
            .Append(LMotion.Create(0f, 1f, 0.3f).Bind(a => plate.alpha = a))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ItemGetDOTween : MonoBehaviour
{
    [SerializeField] RectTransform box;
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup iconGroup;
    [SerializeField] CanvasGroup plate;
    [SerializeField] float riseY = 60f;

    void OnEnable() => Play();

    public void Play()
    {
        icon.localScale = Vector3.zero;
        iconGroup.alpha = 0f;
        plate.alpha = 0f;
        DOTween.Sequence()
            .Append(box.DOPunchScale(new Vector3(0.2f, -0.2f, 0f), 0.35f, 8, 0.6f))
            .Join(iconGroup.DOFade(1f, 0.05f))
            .Append(icon.DOScale(1f, 0.55f).SetEase(Ease.OutBack))
            .Join(icon.DOAnchorPosY(riseY, 0.55f).SetEase(Ease.OutBack))
            .Join(icon.DOLocalRotate(new Vector3(0f, 0f, 360f), 0.55f, RotateMode.FastBeyond360))
            .Append(plate.DOFade(1f, 0.3f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ItemGetCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform box;
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup iconGroup;
    [SerializeField] CanvasGroup plate;
    [SerializeField] float riseY = 60f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        icon.localScale = Vector3.zero; iconGroup.alpha = 0f; plate.alpha = 0f;
        iconGroup.alpha = 1f;
        float t = 0f;
        while (t < 0.55f)
        {
            t += Time.deltaTime;
            float v = OutBack(Mathf.Clamp01(t / 0.55f));
            icon.localScale = Vector3.one * v;
            icon.anchoredPosition = new Vector2(0f, Mathf.LerpUnclamped(6f, riseY, v));
            icon.localEulerAngles = new Vector3(0f, 0f, v * 360f);
            yield return null;
        }
        t = 0f;
        while (t < 0.3f) { t += Time.deltaTime; plate.alpha = Mathf.Clamp01(t / 0.3f); yield return null; }
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
#Icon {
    scale: 0 0;
    opacity: 0;
    translate: 0 6px;
    transition: scale 550ms ease-out-back, translate 550ms ease-out-back,
                rotate 550ms ease-out-back, opacity 80ms linear;
}
#Icon.pop { scale: 1 1; opacity: 1; translate: 0 -60px; rotate: 360deg; }
#Plate { opacity: 0; transition: opacity 300ms ease-out; }
#Plate.shown { opacity: 1; }

/* ===== C# (.cs) — 箱の開き後に icon/plate を段階表示 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ItemGetUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var icon = root.Q<VisualElement>("Icon");
        var plate = root.Q<VisualElement>("Plate");
        icon.AddToClassList("pop");   // 上方向は translate y をマイナスに
        icon.schedule.Execute(() => plate.AddToClassList("shown")).ExecuteLater(550);
    }
}`,
    },
  });

  /* 7. ターンバナー (transition) */
  R({
    id: 'turn-banner',
    title: 'ターンバナー',
    titleEn: 'Turn Banner',
    category: 'transition',
    tags: ['RPG', 'ターン', 'バトル', 'バナー'],
    description: '「YOUR TURN」の帯が斜めカットのまま画面を横断して現れ、中央で少し留まってから反対側へ抜けるターン表示。ターン制バトルの手番表示・ラウンド開始に。帯は回転させず clip-path の平行四辺形で斜めにし、入り OutCubic / 抜け InCubic で緩急を付ける。',
    spec: {
      target: '斜めカット(clip-path 平行四辺形)の帯',
      in: { x: '-320→0', duration: 0.5, ease: 'OutCubic' },
      hold: 0.9,
      out: { x: '0→320', duration: 0.45, ease: 'InCubic' },
      note: '帯は回転させずカットのみ斜め。文字は水平を保つ。ターン開始/ラウンド表示に',
    },
    preview(ctx, PV) {
      const band = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '250px', height: '38px',
        marginLeft: '-125px', marginTop: '-19px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '19px', letterSpacing: '0.2em',
        clipPath: 'polygon(22px 0,100% 0,calc(100% - 22px) 100%,0 100%)',
        willChange: 'transform', transform: 'translateX(-320px)',
      }, 'YOUR TURN');
      ctx.stage.appendChild(band);
      // 奥行き用の副帯(遅れて追う)
      const strip = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '250px', height: '4px',
        marginLeft: '-125px', marginTop: '20px', background: 'var(--pv-accent-dim)',
        clipPath: 'polygon(22px 0,100% 0,calc(100% - 22px) 100%,0 100%)',
        willChange: 'transform', transform: 'translateX(-352px)',
      });
      ctx.stage.appendChild(strip);

      const setX = x => { band.style.transform = `translateX(${x}px)`; strip.style.transform = `translateX(${x * 1.1}px)`; };
      ctx.forever(async () => {
        setX(-320);
        await ctx.wait(0.5);
        await ctx.tween({ from: -320, to: 0, duration: 0.5, ease: 'OutCubic', onUpdate: setX });
        await ctx.wait(0.9);
        await ctx.tween({ from: 0, to: 320, duration: 0.45, ease: 'InCubic', onUpdate: setX });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 斜めカットの帯が左外→中央→右外へ抜ける。中央で留める
public class TurnBannerLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform band;
    [SerializeField] float offX = 420f;      // 画面外までの距離
    [SerializeField] float holdSeconds = 0.9f;

    void OnEnable() => Play();

    public void Play()
    {
        band.anchoredPosition = new Vector2(-offX, band.anchoredPosition.y);
        LSequence.Create()
            .Append(LMotion.Create(-offX, 0f, 0.5f).WithEase(Ease.OutCubic).BindToAnchoredPositionX(band))
            .AppendInterval(holdSeconds)
            .Append(LMotion.Create(0f, offX, 0.45f).WithEase(Ease.InCubic).BindToAnchoredPositionX(band))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class TurnBannerDOTween : MonoBehaviour
{
    [SerializeField] RectTransform band;
    [SerializeField] float offX = 420f;
    [SerializeField] float holdSeconds = 0.9f;

    void OnEnable() => Play();

    public void Play()
    {
        band.anchoredPosition = new Vector2(-offX, band.anchoredPosition.y);
        DOTween.Sequence()
            .Append(band.DOAnchorPosX(0f, 0.5f).SetEase(Ease.OutCubic))
            .AppendInterval(holdSeconds)
            .Append(band.DOAnchorPosX(offX, 0.45f).SetEase(Ease.InCubic));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class TurnBannerCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform band;
    [SerializeField] float offX = 420f;
    [SerializeField] float holdSeconds = 0.9f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        yield return Move(-offX, 0f, 0.5f, true);    // OutCubic
        yield return new WaitForSeconds(holdSeconds);
        yield return Move(0f, offX, 0.45f, false);   // InCubic
    }

    IEnumerator Move(float from, float to, float dur, bool outEase)
    {
        float t = 0f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / dur);
            float e = outEase ? 1f - Mathf.Pow(1f - p, 3f) : p * p * p;
            band.anchoredPosition = new Vector2(Mathf.Lerp(from, to, e), band.anchoredPosition.y);
            yield return null;
        }
        band.anchoredPosition = new Vector2(to, band.anchoredPosition.y);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* 斜めは要素の -unity clip でなく、背景を平行四辺形にカットした帯を用意 */
/* left を transition。中央保持→退場は C# の段階クラスで切り替える */
#Banner {
    position: absolute;
    left: -420px;
    transition: left 500ms ease-out-cubic;
}
#Banner.center { left: 0; }
#Banner.exit { left: 420px; transition: left 450ms ease-in-cubic; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class TurnBannerUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] long holdMs = 900;
    VisualElement banner;

    void OnEnable()
    {
        banner = document.rootVisualElement.Q<VisualElement>("Banner");
        banner.AddToClassList("center");
        banner.schedule.Execute(() =>
        {
            banner.RemoveFromClassList("center");
            banner.AddToClassList("exit");
        }).ExecuteLater(500 + holdMs);
    }
}`,
    },
  });
})();
