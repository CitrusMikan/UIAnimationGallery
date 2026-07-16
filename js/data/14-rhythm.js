/* 14-rhythm.js — リズムゲームの手触りモーション (第1弾 2種)
 *   judgment-text / combo-counter
 * 配属: text。各種にUI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. 判定表示 (text) */
  R({
    id: 'judgment-text',
    title: '判定表示',
    titleEn: 'Judgment Text',
    category: 'text',
    tags: ['リズム', '判定', 'PERFECT', 'タイミング'],
    description: 'ノーツのタイミング判定(PERFECT / GREAT / MISS)が、色付きで一瞬パンチして現れ、少し浮きながら消える。リズムゲームの判定フィードバック・アクションのヒット評価に。判定語ごとに色を変え、スケールを OutBack でオーバーシュートさせると打点が締まる。数字が出る score-pop とは別用途。',
    spec: {
      pop: { target: 'localScale', from: 1.4, to: 1.0, duration: 0.18, ease: 'OutBack' },
      rise_fade: { y: '0→-16px', alpha: '1→0', duration: 0.35, delay: 0.15, ease: 'OutCubic' },
      colors: 'PERFECT=アクセント / GREAT=シアン系 / MISS=危険色(赤)',
    },
    preview(ctx, PV) {
      const grades = [
        { t: 'PERFECT', c: 'var(--pv-accent)' },
        { t: 'GREAT', c: '#38c8e0' },
        { t: 'GOOD', c: '#7bd67c' },
        { t: 'MISS', c: '#e0556b' },
      ];
      const label = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '34px', letterSpacing: '0.06em',
        willChange: 'transform,opacity', whiteSpace: 'nowrap', pointerEvents: 'none',
      });
      ctx.stage.appendChild(label);
      // 打点マーカー
      const line = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '80px', height: '80px', marginLeft: '-40px', marginTop: '-40px', borderRadius: '50%', border: '1px dashed var(--pv-line-strong)', opacity: '0.4' });
      ctx.stage.appendChild(line);

      const show = async g => {
        label.textContent = g.t; label.style.color = g.c;
        const setT = (s, a) => { label.style.transform = `translate(-50%,calc(-50% + ${(1 - a) * -16}px)) scale(${s})`; label.style.opacity = a; };
        setT(1.4, 1);
        await ctx.tween({ from: 1.4, to: 1, duration: 0.18, ease: 'OutBack', onUpdate: v => setT(v, 1) });
        await ctx.tween({ from: 1, to: 0, duration: 0.35, delay: 0.15, ease: 'OutCubic', onUpdate: a => setT(1, a) });
      };
      let i = 0;
      ctx.forever(async () => { await show(grades[i % grades.length]); i++; await ctx.wait(0.5); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;

// 判定語をパンチで出し、少し浮かせながらフェードで消す
public class JudgmentTextLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup group;

    public void Show(string grade, Color color)
    {
        label.text = grade;
        label.color = color;
        rect.localScale = Vector3.one * 1.4f;
        rect.anchoredPosition = Vector2.zero;
        group.alpha = 1f;

        LMotion.Create(1.4f, 1f, 0.18f).WithEase(Ease.OutBack)
            .Bind(s => rect.localScale = Vector3.one * s);
        LMotion.Create(0f, 16f, 0.35f).WithEase(Ease.OutCubic).WithDelay(0.15f)
            .BindToAnchoredPositionY(rect);
        LMotion.Create(1f, 0f, 0.35f).WithDelay(0.15f).BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

public class JudgmentTextDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup group;

    public void Show(string grade, Color color)
    {
        label.text = grade;
        label.color = color;
        rect.localScale = Vector3.one * 1.4f;
        rect.anchoredPosition = Vector2.zero;
        group.alpha = 1f;

        rect.DOScale(1f, 0.18f).SetEase(Ease.OutBack);
        rect.DOAnchorPosY(16f, 0.35f).SetEase(Ease.OutCubic).SetDelay(0.15f);
        group.DOFade(0f, 0.35f).SetDelay(0.15f);
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

public class JudgmentTextCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup group;

    public void Show(string grade, Color color)
    {
        label.text = grade;
        label.color = color;
        StopAllCoroutines();
        StartCoroutine(Run());
    }

    IEnumerator Run()
    {
        float t = 0f;
        rect.anchoredPosition = Vector2.zero;
        group.alpha = 1f;
        while (t < 0.18f)
        {
            t += Time.deltaTime;
            rect.localScale = Vector3.one * Mathf.LerpUnclamped(1.4f, 1f, OutBack(Mathf.Clamp01(t / 0.18f)));
            yield return null;
        }
        yield return new WaitForSeconds(0.15f);
        t = 0f;
        while (t < 0.35f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.35f), 3f); // OutCubic
            rect.anchoredPosition = new Vector2(0f, Mathf.Lerp(0f, 16f, e));
            group.alpha = 1f - e;
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
.judgment {
    scale: 1.4 1.4;
    translate: 0 0;
    opacity: 1;
}
.judgment.play {
    scale: 1 1;
    transition: scale 180ms ease-out-back;
}
.judgment.fade {
    translate: 0 -16px;
    opacity: 0;
    transition: translate 350ms ease-out-cubic, opacity 350ms ease-out;
}

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class JudgmentTextUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    Label label;

    void OnEnable() => label = document.rootVisualElement.Q<Label>("Judgment");

    public void Show(string grade, Color color)
    {
        label.text = grade;
        label.style.color = color;
        label.RemoveFromClassList("play");
        label.RemoveFromClassList("fade");
        // クラスを付け直してアニメを再生
        label.schedule.Execute(() => label.AddToClassList("play"));
        label.schedule.Execute(() => label.AddToClassList("fade")).ExecuteLater(150);
    }
}`,
    },
  });

  /* 2. コンボカウンター (text) */
  R({
    id: 'combo-counter',
    title: 'コンボカウンター',
    titleEn: 'Combo Counter',
    category: 'text',
    tags: ['リズム', 'コンボ', 'カウント', '連撃'],
    description: '連続ヒットのたびに数字が一瞬パンチして跳ね、コンボが伸びるほど色が段階的に熱を帯びる。リズム/アクション/格闘のコンボ表示に。加算のたびに scale を 1.3→1 へ OutBack で戻すのがキモ。減速して止まる count-up とは逆で、瞬間の弾みが命。',
    spec: {
      per_hit: { target: 'localScale', from: 1.3, to: 1.0, duration: 0.16, ease: 'OutBack' },
      color_ramp: 'コンボ数の閾値で色を段階変化 (dim→accent→hot)',
      label_shift: 'COMBO ラベルもわずかに揺らすと一体感が出る',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' });
      ctx.stage.appendChild(wrap);
      const num = PV.el(null, {
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '52px', lineHeight: '1',
        color: 'var(--pv-accent)', willChange: 'transform',
      }, '0');
      const cap = PV.el('mono', { fontSize: '12px', letterSpacing: '0.3em', color: 'var(--pv-dim)' }, 'COMBO');
      wrap.appendChild(num); wrap.appendChild(cap);

      const colorFor = n => n >= 40 ? '#e0556b' : n >= 20 ? '#f0a030' : n >= 8 ? 'var(--pv-accent)' : 'var(--pv-text)';
      let combo = 0;
      const hit = async () => {
        combo++;
        num.textContent = combo; num.style.color = colorFor(combo);
        await ctx.tween({ from: 1.3, to: 1, duration: 0.16, ease: 'OutBack', onUpdate: v => num.style.transform = `scale(${v})` });
      };
      const reset = () => { combo = 0; num.textContent = '0'; num.style.color = 'var(--pv-text)'; num.style.transform = 'scale(1)'; };
      ctx.forever(async () => {
        for (let i = 0; i < 48; i++) { await hit(); await ctx.wait(0.14 + Math.random() * 0.08); }
        await ctx.wait(0.8); reset(); await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using TMPro;
using UnityEngine;

public class ComboCounterLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform rect;
    [SerializeField] Color[] ramp;          // [通常, 熱, 最高]
    [SerializeField] int[] thresholds;      // ramp に対応する下限コンボ
    int combo;

    public void AddHit()
    {
        combo++;
        number.text = combo.ToString();
        number.color = ColorFor(combo);
        LMotion.Create(1.3f, 1f, 0.16f).WithEase(Ease.OutBack)
            .Bind(s => rect.localScale = Vector3.one * s);
    }

    public void ResetCombo() { combo = 0; number.text = "0"; }

    Color ColorFor(int n)
    {
        Color c = ramp[0];
        for (int i = 0; i < thresholds.Length; i++)
            if (n >= thresholds[i]) c = ramp[Mathf.Min(i, ramp.Length - 1)];
        return c;
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

public class ComboCounterDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform rect;
    int combo;

    public void AddHit()
    {
        combo++;
        number.text = combo.ToString();
        rect.localScale = Vector3.one * 1.3f;
        rect.DOScale(1f, 0.16f).SetEase(Ease.OutBack);
    }

    public void ResetCombo() { combo = 0; number.text = "0"; }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

public class ComboCounterCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text number;
    [SerializeField] RectTransform rect;
    int combo;

    public void AddHit()
    {
        combo++;
        number.text = combo.ToString();
        StopAllCoroutines();
        StartCoroutine(Punch());
    }

    public void ResetCombo() { combo = 0; number.text = "0"; }

    IEnumerator Punch()
    {
        float t = 0f;
        while (t < 0.16f)
        {
            t += Time.deltaTime;
            rect.localScale = Vector3.one * Mathf.LerpUnclamped(1.3f, 1f, OutBack(Mathf.Clamp01(t / 0.16f)));
            yield return null;
        }
        rect.localScale = Vector3.one;
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
.combo-num { scale: 1 1; transition: scale 160ms ease-out-back; }
.combo-num.hit { scale: 1.3 1.3; transition: none; }   /* 加算の瞬間だけ拡大 */

/* ===== C# (.cs) — hit を一瞬付けて外すとパンチになる ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ComboCounterUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    Label number;
    int combo;

    void OnEnable() => number = document.rootVisualElement.Q<Label>("ComboNumber");

    public void AddHit()
    {
        combo++;
        number.text = combo.ToString();
        number.AddToClassList("hit");
        // 次フレームで hit を外すと 1.3 → 1 の transition が走る
        number.schedule.Execute(() => number.RemoveFromClassList("hit"));
    }

    public void ResetCombo() { combo = 0; number.text = "0"; }
}`,
    },
  });

  /* 3. ビートパルス (attention) */
  R({
    id: 'beat-pulse',
    title: 'ビートパルス',
    titleEn: 'Beat Pulse',
    category: 'attention',
    tags: ['リズム', 'BPM', '同期', '拍'],
    description: '一定テンポの拍の瞬間に中央の要素が「ドンッ」と弾んで減衰し、外周リングが1拍ごとに拡大しながら薄れる。BPM 同期の鼓動・ビート表現・オーディオビジュアライザに。常時往復する pulse と違い「拍の瞬間だけ叩いて減衰させる」のがポイントで、punch 波形で反発を1回入れると生っぽくなる。',
    spec: {
      tempo: { bpm: 120, interval: '60/bpm 秒ごとに1拍' },
      core: { target: 'localScale', punch: 0.28, freq: 8, duration: 0.45, note: '拍で叩いて減衰' },
      ring: { scale: '1→2.6', alpha: '1→0', duration: 0.6, ease: 'OutQuad', note: '1拍ごとに新規生成' },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(wrap);
      const core = PV.el(null, {
        position: 'absolute', left: '-30px', top: '-30px', width: '60px', height: '60px', borderRadius: '50%',
        background: 'var(--pv-accent)', boxShadow: '0 0 18px var(--pv-accent-dim)', willChange: 'transform',
      });
      wrap.appendChild(core);
      const spawnRing = () => {
        const ring = PV.el(null, {
          position: 'absolute', left: '-30px', top: '-30px', width: '60px', height: '60px', borderRadius: '50%',
          border: '2px solid var(--pv-accent)', pointerEvents: 'none', willChange: 'transform,opacity',
        });
        wrap.appendChild(ring);
        ctx.tween({
          from: 0, to: 1, duration: 0.6, ease: 'OutQuad',
          onUpdate: v => { ring.style.transform = `scale(${1 + v * 1.6})`; ring.style.opacity = String(1 - v); },
          onComplete: () => ring.remove(),
        });
      };
      const beat = () => {
        spawnRing();
        ctx.tween({
          from: 0, to: 1, duration: 0.45,
          onUpdate: v => { const p = EASE.punchWave(v, 8, 1.2); core.style.transform = `scale(${1 + p * 0.28})`; },
        });
      };
      ctx.forever(async () => { beat(); await ctx.wait(0.5); }); // 0.5s = 120BPM
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// BPM に同期して拍の瞬間にコアを叩き、リングを広げる
public class BeatPulseLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform core;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;
    [SerializeField] float bpm = 120f;

    void OnEnable() => InvokeRepeating(nameof(Beat), 0f, 60f / bpm);
    void OnDisable() => CancelInvoke();

    void Beat()
    {
        // コアを punch (反発しながら減衰する叩き)
        LMotion.Punch.Create(0f, 0.28f, 0.45f).WithFrequency(8)
            .Bind(p => core.localScale = Vector3.one * (1f + p));
        // リングを拡大しながらフェード
        ring.localScale = Vector3.one;
        ringGroup.alpha = 1f;
        LMotion.Create(1f, 2.6f, 0.6f).WithEase(Ease.OutQuad)
            .Bind(s => ring.localScale = Vector3.one * s);
        LMotion.Create(1f, 0f, 0.6f).WithEase(Ease.OutQuad).BindToAlpha(ringGroup);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class BeatPulseDOTween : MonoBehaviour
{
    [SerializeField] RectTransform core;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;
    [SerializeField] float bpm = 120f;

    void OnEnable() => InvokeRepeating(nameof(Beat), 0f, 60f / bpm);
    void OnDisable() => CancelInvoke();

    void Beat()
    {
        core.DOPunchScale(Vector3.one * 0.28f, 0.45f, 8, 0.8f);
        ring.localScale = Vector3.one;
        ringGroup.alpha = 1f;
        ring.DOScale(2.6f, 0.6f).SetEase(Ease.OutQuad);
        ringGroup.DOFade(0f, 0.6f).SetEase(Ease.OutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class BeatPulseCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform core;
    [SerializeField] RectTransform ring;
    [SerializeField] CanvasGroup ringGroup;
    [SerializeField] float bpm = 120f;

    void OnEnable() => StartCoroutine(Loop());

    IEnumerator Loop()
    {
        var wait = new WaitForSeconds(60f / bpm);
        while (true) { StartCoroutine(Beat()); yield return wait; }
    }

    IEnumerator Beat()
    {
        float t = 0f, dur = 0.6f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float n = Mathf.Clamp01(t / dur);
            // 減衰する叩き (punch)
            float punch = Mathf.Sin(n * Mathf.PI * 8f) * (1f - n) * 0.28f;
            core.localScale = Vector3.one * (1f + punch);
            // リング拡大 + フェード (OutQuad)
            float e = 1f - (1f - n) * (1f - n);
            ring.localScale = Vector3.one * Mathf.Lerp(1f, 2.6f, e);
            ringGroup.alpha = 1f - e;
            yield return null;
        }
        core.localScale = Vector3.one;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.beat-core { scale: 1 1; transition: scale 90ms ease-out; }
.beat-core.on { scale: 1.28 1.28; transition: none; }   /* 拍で一瞬拡大 → 外すと減衰 */
.beat-ring {
    scale: 1 1;
    opacity: 1;
    transition: scale 600ms ease-out, opacity 600ms ease-out;
}
.beat-ring.expand { scale: 2.6 2.6; opacity: 0; }

/* ===== C# (.cs) — BPM 間隔で schedule ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class BeatPulseUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float bpm = 120f;
    VisualElement core, ring;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        core = root.Q("BeatCore");
        ring = root.Q("BeatRing");
        long ms = (long)(60000f / bpm);
        root.schedule.Execute(Beat).Every(ms);
    }

    void Beat()
    {
        core.AddToClassList("on");
        core.schedule.Execute(() => core.RemoveFromClassList("on"));   // 1.28 → 1 で減衰
        ring.RemoveFromClassList("expand");
        ring.style.opacity = 1f;
        ring.schedule.Execute(() => ring.AddToClassList("expand"));    // 拡大 + フェード
    }
}`,
    },
  });

  /* 4. ヒットリング (attention) */
  R({
    id: 'hit-ring',
    title: 'ヒットリング',
    titleEn: 'Hit Ring',
    category: 'attention',
    tags: ['リズム', 'タップ', '判定', 'リング'],
    description: 'タップ/ノーツ判定の瞬間に、その点から発光リングが広がって薄れる。多重(2〜3重)の時間差リングと中心フラッシュを重ね、単発の Material リップルより「打点の衝撃」を強調する。判定エフェクト・タップフィードバック・ヒットスパークに。リングは OutExpo で一気に開いて素早く消すとキレる。',
    spec: {
      rings: { count: 3, stagger: 0.08, scale: '0.3→1.3', alpha: '0.9→0', duration: 0.55, ease: 'OutExpo' },
      flash: { target: 'localScale', scale: '1→2.5', alpha: '1→0', duration: 0.3, ease: 'OutQuad' },
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const flash = PV.el(null, {
        position: 'absolute', left: '-11px', top: '-11px', width: '22px', height: '22px', borderRadius: '50%',
        background: 'var(--pv-accent)', boxShadow: '0 0 14px var(--pv-accent)', willChange: 'transform,opacity', pointerEvents: 'none',
      });
      center.appendChild(flash);
      const ring = (delay, size, thick) => {
        const r = PV.el(null, {
          position: 'absolute', borderRadius: '50%', border: `${thick}px solid var(--pv-accent)`,
          left: `${-size / 2}px`, top: `${-size / 2}px`, width: `${size}px`, height: `${size}px`,
          opacity: '0', willChange: 'transform,opacity', pointerEvents: 'none',
        });
        center.appendChild(r);
        ctx.tween({
          from: 0, to: 1, duration: 0.55, delay, ease: 'OutExpo',
          onUpdate: v => { r.style.transform = `scale(${0.3 + v})`; r.style.opacity = String((1 - v) * 0.9); },
        });
      };
      const hit = () => {
        ctx.tween({
          from: 0, to: 1, duration: 0.3, ease: 'OutQuad',
          onUpdate: v => { flash.style.transform = `scale(${1 + v * 1.5})`; flash.style.opacity = String(1 - v); },
        });
        ring(0, 84, 3); ring(0.08, 76, 2); ring(0.16, 68, 2);
      };
      ctx.forever(async () => { hit(); await ctx.wait(0.9); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 判定点から多重リングを時間差で広げ、中心をフラッシュさせる
public class HitRingLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] rings;       // 2〜3枚
    [SerializeField] CanvasGroup[] ringGroups;
    [SerializeField] RectTransform flash;
    [SerializeField] CanvasGroup flashGroup;

    public void Play()
    {
        for (int i = 0; i < rings.Length; i++)
        {
            int k = i;
            rings[k].localScale = Vector3.one * 0.3f;
            ringGroups[k].alpha = 0.9f;
            LMotion.Create(0.3f, 1.3f, 0.55f).WithEase(Ease.OutExpo).WithDelay(0.08f * k)
                .Bind(s => rings[k].localScale = Vector3.one * s);
            LMotion.Create(0.9f, 0f, 0.55f).WithEase(Ease.OutExpo).WithDelay(0.08f * k)
                .BindToAlpha(ringGroups[k]);
        }
        flash.localScale = Vector3.one;
        flashGroup.alpha = 1f;
        LMotion.Create(1f, 2.5f, 0.3f).WithEase(Ease.OutQuad).Bind(s => flash.localScale = Vector3.one * s);
        LMotion.Create(1f, 0f, 0.3f).WithEase(Ease.OutQuad).BindToAlpha(flashGroup);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HitRingDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] rings;
    [SerializeField] CanvasGroup[] ringGroups;
    [SerializeField] RectTransform flash;
    [SerializeField] CanvasGroup flashGroup;

    public void Play()
    {
        for (int i = 0; i < rings.Length; i++)
        {
            var r = rings[i]; var g = ringGroups[i]; float d = 0.08f * i;
            r.localScale = Vector3.one * 0.3f;
            g.alpha = 0.9f;
            r.DOScale(1.3f, 0.55f).SetEase(Ease.OutExpo).SetDelay(d);
            g.DOFade(0f, 0.55f).SetEase(Ease.OutExpo).SetDelay(d);
        }
        flash.localScale = Vector3.one;
        flashGroup.alpha = 1f;
        flash.DOScale(2.5f, 0.3f).SetEase(Ease.OutQuad);
        flashGroup.DOFade(0f, 0.3f).SetEase(Ease.OutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HitRingCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] rings;
    [SerializeField] CanvasGroup[] ringGroups;

    public void Play()
    {
        for (int i = 0; i < rings.Length; i++)
            StartCoroutine(Ring(rings[i], ringGroups[i], 0.08f * i));
    }

    IEnumerator Ring(RectTransform r, CanvasGroup g, float delay)
    {
        yield return new WaitForSeconds(delay);
        float t = 0f, dur = 0.55f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float n = Mathf.Clamp01(t / dur);
            float e = 1f - Mathf.Pow(2f, -10f * n);   // OutExpo
            r.localScale = Vector3.one * Mathf.Lerp(0.3f, 1.3f, e);
            g.alpha = (1f - e) * 0.9f;
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.hit-ring { opacity: 0; scale: 0.3 0.3; }
.hit-ring.arm { opacity: 0.9; scale: 0.3 0.3; transition: none; }        /* 開始状態にリセット */
.hit-ring.spread {
    opacity: 0;
    scale: 1.3 1.3;
    transition: scale 550ms ease-out, opacity 550ms ease-out;
}

/* ===== C# (.cs) — 各リングを時間差で spread ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HitRingUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement[] rings;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        rings = new[] { root.Q("Ring0"), root.Q("Ring1"), root.Q("Ring2") };
    }

    public void Play()
    {
        for (int i = 0; i < rings.Length; i++)
        {
            var r = rings[i];
            r.RemoveFromClassList("spread");
            r.AddToClassList("arm");
            long delay = 80L * i + 16L;
            r.schedule.Execute(() => { r.RemoveFromClassList("arm"); r.AddToClassList("spread"); }).ExecuteLater(delay);
        }
    }
}`,
    },
  });

  /* 5. ランクスタンプ (attention) */
  R({
    id: 'rank-stamp',
    title: 'ランクスタンプ',
    titleEn: 'Rank Stamp',
    category: 'attention',
    tags: ['リザルト', 'ランク', 'S', '評価'],
    description: 'リザルトの総合評価(S / A / B …)の大きな文字が、拡大とわずかな回転で「ドンッ」と押し込まれ、着地でフラッシュと微振動を起こす。スコアランク・実績解除・評価演出に。scale 2.2→1 を InBack 気味に叩き込み、着地の瞬間に shake を一発入れると重量感が出る。',
    spec: {
      slam: { target: 'localScale', from: 2.2, to: 1.0, rotate: '8→0deg', duration: 0.32, ease: 'InBack' },
      land: { shake: { amplitude: 6, freq: 18, duration: 0.3 }, flash: { alpha: '0.7→0', duration: 0.4, ease: 'OutQuad' } },
      cycle: 'S / A / B を巡回 (リザルト評価語)',
    },
    preview(ctx, PV) {
      const ranks = [
        { t: 'S', c: 'var(--pv-accent)' },
        { t: 'A', c: '#7bd67c' },
        { t: 'B', c: '#38c8e0' },
      ];
      const flash = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '120px', height: '120px', marginLeft: '-60px', marginTop: '-60px',
        borderRadius: '50%', background: 'var(--pv-accent-dim)', opacity: '0', willChange: 'transform,opacity', pointerEvents: 'none',
      });
      ctx.stage.appendChild(flash);
      const letter = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', fontFamily: "'Oswald',sans-serif", fontWeight: '700',
        fontSize: '84px', lineHeight: '1', color: 'var(--pv-accent)', opacity: '0',
        transform: 'translate(-50%,-50%) scale(1)', willChange: 'transform,opacity', pointerEvents: 'none',
      });
      ctx.stage.appendChild(letter);

      const stamp = async r => {
        letter.textContent = r.t; letter.style.color = r.c; letter.style.opacity = '1';
        // 叩き込み (2.2 → 1, わずかに回転)
        await ctx.tween({
          from: 0, to: 1, duration: 0.32, ease: 'InBack',
          onUpdate: v => { letter.style.transform = `translate(-50%,-50%) scale(${2.2 - 1.2 * v}) rotate(${(1 - v) * 8}deg)`; },
        });
        // 着地フラッシュ
        ctx.tween({
          from: 0, to: 1, duration: 0.4, ease: 'OutQuad',
          onUpdate: v => { flash.style.opacity = String((1 - v) * 0.65); flash.style.transform = `scale(${1 + v * 0.8})`; },
        });
        // 微振動
        await ctx.tween({
          from: 0, to: 1, duration: 0.3,
          onUpdate: v => { const sh = EASE.shakeWave(v, 3, 18, 1.4) * 5 * (1 - v); letter.style.transform = `translate(calc(-50% + ${sh}px),-50%) scale(1)`; },
        });
        await ctx.wait(0.7);
        // フェードアウトして次へ
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: a => { letter.style.opacity = String(a); } });
      };
      let i = 0;
      ctx.forever(async () => { await stamp(ranks[i % ranks.length]); i++; await ctx.wait(0.3); });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;

// ランク文字を叩き込み、着地でフラッシュ＋微振動
public class RankStampLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text rankText;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup flash;

    public void Stamp(string rank, Color color)
    {
        rankText.text = rank;
        rankText.color = color;
        rect.localScale = Vector3.one * 2.2f;
        rect.localRotation = Quaternion.Euler(0, 0, 8f);
        rect.anchoredPosition = Vector2.zero;

        // 叩き込み (2.2 → 1)
        LMotion.Create(2.2f, 1f, 0.32f).WithEase(Ease.InBack)
            .Bind(s => rect.localScale = Vector3.one * s);
        LMotion.Create(8f, 0f, 0.32f).WithEase(Ease.InBack)
            .Bind(z => rect.localRotation = Quaternion.Euler(0, 0, z));

        // 着地に合わせて微振動 + フラッシュ
        LMotion.Punch.Create(0f, 6f, 0.3f).WithFrequency(18).WithDelay(0.32f)
            .Bind(x => rect.anchoredPosition = new Vector2(x, 0f));
        flash.alpha = 0.7f;
        LMotion.Create(0.7f, 0f, 0.4f).WithEase(Ease.OutQuad).WithDelay(0.32f)
            .BindToAlpha(flash);
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

public class RankStampDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text rankText;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup flash;

    public void Stamp(string rank, Color color)
    {
        rankText.text = rank;
        rankText.color = color;
        rect.localScale = Vector3.one * 2.2f;
        rect.localEulerAngles = new Vector3(0, 0, 8f);
        rect.anchoredPosition = Vector2.zero;

        var seq = DOTween.Sequence();
        seq.Append(rect.DOScale(1f, 0.32f).SetEase(Ease.InBack));
        seq.Join(rect.DORotate(Vector3.zero, 0.32f).SetEase(Ease.InBack));
        seq.Append(rect.DOShakeAnchorPos(0.3f, 6f, 18));   // 着地の微振動
        flash.alpha = 0.7f;
        seq.Join(flash.DOFade(0f, 0.4f).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

public class RankStampCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text rankText;
    [SerializeField] RectTransform rect;
    [SerializeField] CanvasGroup flash;

    public void Stamp(string rank, Color color)
    {
        rankText.text = rank;
        rankText.color = color;
        StopAllCoroutines();
        StartCoroutine(Run());
    }

    IEnumerator Run()
    {
        // 叩き込み (2.2 → 1, 回転 8 → 0)
        float t = 0f;
        while (t < 0.32f)
        {
            t += Time.deltaTime;
            float e = InBack(Mathf.Clamp01(t / 0.32f));
            rect.localScale = Vector3.one * Mathf.LerpUnclamped(2.2f, 1f, e);
            rect.localEulerAngles = new Vector3(0, 0, Mathf.LerpUnclamped(8f, 0f, e));
            yield return null;
        }
        // 着地フラッシュ + 微振動
        flash.alpha = 0.7f;
        t = 0f;
        while (t < 0.3f)
        {
            t += Time.deltaTime;
            float n = Mathf.Clamp01(t / 0.3f);
            float sh = Mathf.Sin(n * Mathf.PI * 18f) * (1f - n) * 6f;
            rect.anchoredPosition = new Vector2(sh, 0f);
            flash.alpha = 0.7f * (1f - n);
            yield return null;
        }
        rect.anchoredPosition = Vector2.zero;
        flash.alpha = 0f;
    }

    static float InBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        return c3 * x * x * x - c1 * x * x;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.rank { scale: 2.2 2.2; rotate: 8deg; opacity: 1; }
.rank.land {
    scale: 1 1;
    rotate: 0deg;
    transition: scale 320ms ease-in-back, rotate 320ms ease-in-back;
}
.rank-flash { opacity: 0; transition: opacity 400ms ease-out; }
.rank-flash.on { opacity: 0.7; transition: none; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class RankStampUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    Label rank;
    VisualElement flash;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        rank = root.Q<Label>("Rank");
        flash = root.Q("RankFlash");
    }

    public void Stamp(string text, Color color)
    {
        rank.text = text;
        rank.style.color = color;
        rank.RemoveFromClassList("land");
        // 次フレームで land → 2.2 から 1 へ叩き込み
        rank.schedule.Execute(() => rank.AddToClassList("land"));
        // 着地に合わせてフラッシュ (on を付けて外す)
        flash.AddToClassList("on");
        flash.schedule.Execute(() => flash.RemoveFromClassList("on")).ExecuteLater(320);
    }
}`,
    },
  });
})();
