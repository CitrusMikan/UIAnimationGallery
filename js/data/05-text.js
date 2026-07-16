/* 05-text.js — テキスト・数値系 (6種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. タイプライター */
  R({
    id: 'typewriter',
    title: 'タイプライター',
    titleEn: 'Typewriter',
    category: 'text',
    tags: ['text', 'TMP', '会話', 'ノベル'],
    description: '文字を1文字ずつ表示する。会話ウィンドウ・チュートリアルの定番。TMPのmaxVisibleCharactersを整数トゥイーンするのが最も簡単で崩れない方法。',
    spec: {
      target: 'TMP_Text.maxVisibleCharacters',
      from: 0, to: '文字数',
      charsPerSecond: 20,
      ease: 'Linear',
      note: 'レイアウト済みの全文に対して表示数だけを増やすため折り返しが暴れない',
    },
    preview(ctx, PV) {
      const text = 'システム起動。コマンドを入力してください。';
      const el = PV.el(null, {
        fontFamily: "'Noto Sans JP',sans-serif", fontSize: '13px', color: 'var(--pv-text)',
        width: '210px', lineHeight: '1.8', borderLeft: '2px solid var(--pv-accent)', paddingLeft: '10px',
      });
      ctx.stage.appendChild(el);
      ctx.forever(async () => {
        el.textContent = '';
        await ctx.wait(0.4);
        await ctx.tween({
          from: 0, to: text.length, duration: text.length / 14, ease: 'Linear',
          onUpdate: v => el.textContent = text.slice(0, Math.floor(v)),
        });
        await ctx.wait(1.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class TypewriterLitMotion : MonoBehaviour
{
    [SerializeField] float charsPerSecond = 20f;

    TMP_Text label;
    MotionHandle handle;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play(string message)
    {
        if (handle.IsActive()) handle.Cancel();
        label.text = message;
        label.maxVisibleCharacters = 0;
        int total = message.Length;
        handle = LMotion.Create(0f, total, total / charsPerSecond)
            .WithEase(Ease.Linear)
            .Bind(v => label.maxVisibleCharacters = Mathf.FloorToInt(v));
    }

    /// <summary>スキップ(全文即時表示)</summary>
    public void Skip()
    {
        if (handle.IsActive()) handle.Complete();
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class TypewriterDOTween : MonoBehaviour
{
    [SerializeField] float charsPerSecond = 20f;

    TMP_Text label;
    Tween tween;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnDestroy() => tween?.Kill();

    public void Play(string message)
    {
        tween?.Kill();
        label.text = message;
        label.maxVisibleCharacters = 0;
        int total = message.Length;
        tween = DOTween.To(() => label.maxVisibleCharacters,
                x => label.maxVisibleCharacters = x,
                total, total / charsPerSecond)
            .SetEase(Ease.Linear);
    }

    public void Skip() => tween?.Complete();
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class TypewriterCoroutine : MonoBehaviour
{
    [SerializeField] float charsPerSecond = 20f;

    TMP_Text label;
    bool skip;

    void Awake() => label = GetComponent<TMP_Text>();

    public void Play(string message)
    {
        StopAllCoroutines();
        skip = false;
        StartCoroutine(Animate(message));
    }

    public void Skip() => skip = true;

    IEnumerator Animate(string message)
    {
        label.text = message;
        label.maxVisibleCharacters = 0;
        float shown = 0f;
        while (shown < message.Length)
        {
            if (skip) break;
            shown += charsPerSecond * Time.deltaTime;
            label.maxVisibleCharacters = Mathf.FloorToInt(shown);
            yield return null;
        }
        label.maxVisibleCharacters = message.Length;
    }
}`,
    },
  });

  /* 2. 文字スタッガーフェード */
  R({
    id: 'char-stagger',
    title: '文字スタッガーフェード',
    titleEn: 'Char Stagger Fade',
    category: 'text',
    tags: ['text', 'stagger', 'タイトル', '演出'],
    description: '1文字ずつ時間差でフェード+上昇しながら現れる。タイトルロゴ・章見出し・リザルト画面の見出しに。TMPの頂点カラーを進行値から直接書き換える。',
    spec: {
      target: 'TMP_Text 頂点カラー(alpha) + 頂点座標(y)',
      perChar: { alpha: '0→1', y: '+10→0', duration: 0.3, ease: 'OutQuad' },
      stagger: 0.05,
      note: '進行値0→1の単一トゥイーンから全文字の状態を毎フレーム計算する方式が扱いやすい',
    },
    preview(ctx, PV) {
      const text = 'MOTION';
      const wrap = PV.el(null, { display: 'flex', gap: '2px', fontFamily: "'Oswald',sans-serif", fontSize: '30px', fontWeight: '600', letterSpacing: '0.05em', color: 'var(--pv-accent)' });
      const chars = text.split('').map(c => {
        const s = PV.el(null, { opacity: 0, display: 'inline-block' }, c, 'span');
        wrap.appendChild(s);
        return s;
      });
      ctx.stage.appendChild(wrap);
      const stagger = 0.05, per = 0.3;
      const total = stagger * (chars.length - 1) + per;
      ctx.forever(async () => {
        chars.forEach(c => { c.style.opacity = 0; c.style.transform = 'translateY(10px)'; });
        await ctx.wait(0.4);
        await ctx.tween({
          duration: total, ease: 'Linear',
          onUpdate: (v, t) => {
            const now = t * total;
            chars.forEach((c, i) => {
              const p = Math.min(Math.max((now - i * stagger) / per, 0), 1);
              const e = EASE.OutQuad(p);
              c.style.opacity = e;
              c.style.transform = `translateY(${10 - 10 * e}px)`;
            });
          },
        });
        await ctx.wait(1.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CharStaggerLitMotion : MonoBehaviour
{
    [SerializeField] float perCharDuration = 0.3f;
    [SerializeField] float stagger = 0.05f;

    TMP_Text label;
    MotionHandle handle;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnEnable() => Play();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        label.ForceMeshUpdate();
        int count = label.textInfo.characterCount;
        float total = stagger * (count - 1) + perCharDuration;

        // 進行値1本で全文字を毎フレーム更新する
        handle = LMotion.Create(0f, total, total)
            .WithEase(Ease.Linear)
            .Bind(now => Apply(now));
    }

    void Apply(float now)
    {
        var textInfo = label.textInfo;
        for (int i = 0; i < textInfo.characterCount; i++)
        {
            var charInfo = textInfo.characterInfo[i];
            if (!charInfo.isVisible) continue;

            float p = Mathf.Clamp01((now - i * stagger) / perCharDuration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            byte alpha = (byte)(e * 255f);

            int mat = charInfo.materialReferenceIndex;
            int vertex = charInfo.vertexIndex;
            var colors = textInfo.meshInfo[mat].colors32;
            for (int v = 0; v < 4; v++)
                colors[vertex + v].a = alpha;
        }
        label.UpdateVertexData(TMP_VertexDataUpdateFlags.Colors32);
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CharStaggerDOTween : MonoBehaviour
{
    [SerializeField] float perCharDuration = 0.3f;
    [SerializeField] float stagger = 0.05f;

    TMP_Text label;
    Tween tween;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnEnable() => Play();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        label.ForceMeshUpdate();
        int count = label.textInfo.characterCount;
        float total = stagger * (count - 1) + perCharDuration;

        float now = 0f;
        tween = DOTween.To(() => now, v => { now = v; Apply(now); }, total, total)
            .SetEase(Ease.Linear);
    }

    void Apply(float now)
    {
        var textInfo = label.textInfo;
        for (int i = 0; i < textInfo.characterCount; i++)
        {
            var charInfo = textInfo.characterInfo[i];
            if (!charInfo.isVisible) continue;

            float p = Mathf.Clamp01((now - i * stagger) / perCharDuration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            byte alpha = (byte)(e * 255f);

            int mat = charInfo.materialReferenceIndex;
            int vertex = charInfo.vertexIndex;
            var colors = textInfo.meshInfo[mat].colors32;
            for (int v = 0; v < 4; v++)
                colors[vertex + v].a = alpha;
        }
        label.UpdateVertexData(TMP_VertexDataUpdateFlags.Colors32);
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CharStaggerCoroutine : MonoBehaviour
{
    [SerializeField] float perCharDuration = 0.3f;
    [SerializeField] float stagger = 0.05f;

    TMP_Text label;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }

    IEnumerator Animate()
    {
        label.ForceMeshUpdate();
        int count = label.textInfo.characterCount;
        float total = stagger * (count - 1) + perCharDuration;

        float now = 0f;
        while (now < total)
        {
            now += Time.deltaTime;
            Apply(Mathf.Min(now, total));
            yield return null;
        }
    }

    void Apply(float now)
    {
        var textInfo = label.textInfo;
        for (int i = 0; i < textInfo.characterCount; i++)
        {
            var charInfo = textInfo.characterInfo[i];
            if (!charInfo.isVisible) continue;

            float p = Mathf.Clamp01((now - i * stagger) / perCharDuration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            byte alpha = (byte)(e * 255f);

            int mat = charInfo.materialReferenceIndex;
            int vertex = charInfo.vertexIndex;
            var colors = textInfo.meshInfo[mat].colors32;
            for (int v = 0; v < 4; v++)
                colors[vertex + v].a = alpha;
        }
        label.UpdateVertexData(TMP_VertexDataUpdateFlags.Colors32);
    }
}`,
    },
  });

  /* 3. カウントアップ */
  R({
    id: 'count-up',
    title: 'カウントアップ',
    titleEn: 'Count Up',
    category: 'text',
    tags: ['number', 'スコア', 'リザルト', 'OutExpo'],
    description: '数値が高速に回ってから目標値に減速して着地する。リザルトのスコア・獲得ゴールド表示に。OutExpoにすると「最後の桁が揃う」気持ちよさが出る。',
    spec: {
      target: 'TMP_Text.text (数値を整形して代入)',
      from: 0, to: 128500,
      duration: 1.2,
      ease: 'OutExpo',
      format: 'N0 (3桁区切り)',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { textAlign: 'center' });
      const labelEl = PV.el('mono', { fontSize: '9px', letterSpacing: '0.25em', color: 'var(--pv-dim)', marginBottom: '4px' }, 'SCORE');
      const num = PV.el('mono', { fontSize: '30px', fontWeight: '700', color: 'var(--pv-accent)', letterSpacing: '0.04em' }, '0');
      wrap.appendChild(labelEl); wrap.appendChild(num);
      ctx.stage.appendChild(wrap);
      ctx.forever(async () => {
        num.textContent = '0';
        await ctx.wait(0.5);
        await ctx.tween({
          from: 0, to: 128500, duration: 1.2, ease: 'OutExpo',
          onUpdate: v => num.textContent = Math.round(v).toLocaleString(),
        });
        await ctx.wait(1.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CountUpLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 1.2f;

    TMP_Text label;
    MotionHandle handle;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play(int targetValue)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(0f, targetValue, duration)
            .WithEase(Ease.OutExpo)
            .Bind(v => label.text = Mathf.RoundToInt(v).ToString("N0"));
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CountUpDOTween : MonoBehaviour
{
    [SerializeField] float duration = 1.2f;

    TMP_Text label;
    Tween tween;

    void Awake() => label = GetComponent<TMP_Text>();
    void OnDestroy() => tween?.Kill();

    public void Play(int targetValue)
    {
        tween?.Kill();
        float current = 0f;
        tween = DOTween.To(() => current, v =>
            {
                current = v;
                label.text = Mathf.RoundToInt(v).ToString("N0");
            }, targetValue, duration)
            .SetEase(Ease.OutExpo);
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

[RequireComponent(typeof(TMP_Text))]
public class CountUpCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 1.2f;

    TMP_Text label;

    void Awake() => label = GetComponent<TMP_Text>();

    public void Play(int targetValue)
    {
        StopAllCoroutines();
        StartCoroutine(Animate(targetValue));
    }

    IEnumerator Animate(int targetValue)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p >= 1f ? 1f : 1f - Mathf.Pow(2f, -10f * p); // OutExpo
            label.text = Mathf.RoundToInt(targetValue * e).ToString("N0");
            yield return null;
        }
        label.text = targetValue.ToString("N0");
    }
}`,
    },
  });

  /* 4. スコアポップ */
  R({
    id: 'score-pop',
    title: 'スコアポップ',
    titleEn: 'Score Pop',
    category: 'text',
    tags: ['popup', 'ダメージ数字', '加算', '演出'],
    description: '「+100」がポップして上昇しながら消える。ダメージ数字・スコア加算・獲得表示に。生成→上昇+フェード→破棄のワンショット演出。',
    spec: {
      target: '動的生成したテキスト',
      scale: { from: 0.5, to: 1.0, duration: 0.2, ease: 'OutBack' },
      rise: { distance: 50, duration: 0.7, ease: 'OutCubic' },
      fade: { from: 1, to: 0, delay: 0.35, duration: 0.35 },
      cleanup: '完了時にDestroy',
    },
    preview(ctx, PV) {
      ctx.forever(async () => {
        const p = PV.el('mono', {
          position: 'absolute',
          left: (35 + Math.random() * 30) + '%', top: '58%',
          fontSize: '20px', fontWeight: '700', color: 'var(--pv-accent)',
          textShadow: '0 0 8px rgba(245,224,3,0.5)',
        }, '+' + (Math.floor(Math.random() * 5) + 1) * 100);
        ctx.stage.appendChild(p);
        ctx.tween({
          duration: 0.7, ease: 'OutCubic',
          onUpdate: (v, t) => {
            const sc = t < 0.28 ? 0.5 + 0.5 * EASE.OutBack(t / 0.28) : 1;
            p.style.transform = `translateY(${-50 * v}px) scale(${sc})`;
            p.style.opacity = t < 0.5 ? 1 : 1 - (t - 0.5) * 2;
          },
          onComplete: () => p.remove(),
        });
        await ctx.wait(0.8);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;

public class ScorePopLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text popPrefab;     // ポップ用テキストのプレハブ
    [SerializeField] float riseDistance = 50f;

    /// <summary>指定したanchoredPositionに「+value」をポップさせる</summary>
    public void Spawn(Vector2 position, int value)
    {
        var pop = Instantiate(popPrefab, transform);
        pop.text = $"+{value:N0}";
        var rect = (RectTransform)pop.transform;
        rect.anchoredPosition = position;

        LMotion.Create(Vector3.one * 0.5f, Vector3.one, 0.2f)
            .WithEase(Ease.OutBack)
            .BindToLocalScale(rect);
        LMotion.Create(position.y, position.y + riseDistance, 0.7f)
            .WithEase(Ease.OutCubic)
            .BindToAnchoredPositionY(rect);
        LMotion.Create(1f, 0f, 0.35f)
            .WithDelay(0.35f)
            .WithOnComplete(() => Destroy(pop.gameObject))
            .BindToColorA(pop);
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

public class ScorePopDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text popPrefab;
    [SerializeField] float riseDistance = 50f;

    public void Spawn(Vector2 position, int value)
    {
        var pop = Instantiate(popPrefab, transform);
        pop.text = $"+{value:N0}";
        var rect = (RectTransform)pop.transform;
        rect.anchoredPosition = position;
        rect.localScale = Vector3.one * 0.5f;

        DOTween.Sequence()
            .Join(rect.DOScale(Vector3.one, 0.2f).SetEase(Ease.OutBack))
            .Join(rect.DOAnchorPosY(position.y + riseDistance, 0.7f).SetEase(Ease.OutCubic))
            .Insert(0.35f, pop.DOFade(0f, 0.35f))
            .OnComplete(() => Destroy(pop.gameObject));
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

public class ScorePopCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text popPrefab;
    [SerializeField] float riseDistance = 50f;

    public void Spawn(Vector2 position, int value)
    {
        var pop = Instantiate(popPrefab, transform);
        pop.text = $"+{value:N0}";
        StartCoroutine(Animate(pop, position));
    }

    IEnumerator Animate(TMP_Text pop, Vector2 position)
    {
        var rect = (RectTransform)pop.transform;
        rect.anchoredPosition = position;

        float t = 0f;
        const float duration = 0.7f;
        Color c = pop.color;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float u = 1f - p;
            float rise = 1f - u * u * u; // OutCubic
            rect.anchoredPosition = new Vector2(position.x, position.y + riseDistance * rise);
            float sp = Mathf.Clamp01(t / 0.2f);
            rect.localScale = Vector3.one * Mathf.LerpUnclamped(0.5f, 1f, OutBack(sp));
            c.a = t < 0.35f ? 1f : 1f - (t - 0.35f) / 0.35f;
            pop.color = c;
            yield return null;
        }
        Destroy(pop.gameObject);
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

  /* 5. ダメージシェイク */
  R({
    id: 'damage-text',
    title: 'ダメージシェイク',
    titleEn: 'Damage Text Shake',
    category: 'text',
    tags: ['shake', 'color', 'HP', 'ダメージ'],
    description: 'HPなどの数値が赤く点滅しながら揺れる。被ダメージ・残高不足・制限超過など「悪いことが起きた」ことを数字自体で伝える。',
    spec: {
      shake: { target: 'RectTransform.anchoredPosition.x', strength: 8, duration: 0.4, frequency: 24 },
      color: { target: 'TMP_Text.color', flash: '#ff4d3a → 元色', duration: 0.4 },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { textAlign: 'center' });
      const cap = PV.el('mono', { fontSize: '9px', letterSpacing: '0.25em', color: 'var(--pv-dim)', marginBottom: '4px' }, 'HP');
      const num = PV.el('mono', { fontSize: '28px', fontWeight: '700', color: 'var(--pv-text)' }, '1024');
      wrap.appendChild(cap); wrap.appendChild(num);
      ctx.stage.appendChild(wrap);
      let hp = 1024;
      ctx.forever(async () => {
        await ctx.wait(1.2);
        hp = Math.max(hp - Math.floor(120 + Math.random() * 200), 0);
        if (hp === 0) hp = 1024;
        num.textContent = hp;
        await ctx.tween({
          duration: 0.4, ease: 'Linear',
          onUpdate: (v, t) => {
            num.style.transform = `translateX(${EASE.shakeWave(t, 2, 12, 1) * 8}px)`;
            num.style.color = t < 0.6 ? '#ff4d3a' : 'var(--pv-text)';
          },
        });
        num.style.transform = 'none';
        num.style.color = 'var(--pv-text)';
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using TMPro;
using UnityEngine;

public class DamageTextLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] float strength = 8f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] Color damageColor = new Color(1f, 0.3f, 0.23f);

    Vector2 basePos;
    Color baseColor;
    MotionHandle shakeHandle, colorHandle;

    void Awake()
    {
        basePos = ((RectTransform)label.transform).anchoredPosition;
        baseColor = label.color;
    }

    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (shakeHandle.IsActive()) shakeHandle.Cancel();
        if (colorHandle.IsActive()) colorHandle.Cancel();
    }

    public void Play(int newValue)
    {
        label.text = newValue.ToString("N0");
        Cancel();
        var rect = (RectTransform)label.transform;
        rect.anchoredPosition = basePos;
        shakeHandle = LMotion.Shake.Create(basePos, new Vector2(strength, 0f), duration)
            .WithFrequency(24)
            .WithDampingRatio(1f)
            .BindToAnchoredPosition(rect);
        colorHandle = LMotion.Create(damageColor, baseColor, duration)
            .WithEase(Ease.InQuad)
            .BindToColor(label);
    }
}`,
      dotween: `
using DG.Tweening;
using TMPro;
using UnityEngine;

public class DamageTextDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] float strength = 8f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] Color damageColor = new Color(1f, 0.3f, 0.23f);

    Vector2 basePos;
    Color baseColor;
    Sequence seq;

    void Awake()
    {
        basePos = ((RectTransform)label.transform).anchoredPosition;
        baseColor = label.color;
    }

    void OnDestroy() => seq?.Kill();

    public void Play(int newValue)
    {
        label.text = newValue.ToString("N0");
        seq?.Kill();
        var rect = (RectTransform)label.transform;
        rect.anchoredPosition = basePos;
        label.color = damageColor;
        seq = DOTween.Sequence()
            .Join(rect.DOShakeAnchorPos(duration, new Vector2(strength, 0f), vibrato: 24)
                .OnComplete(() => rect.anchoredPosition = basePos))
            .Join(label.DOColor(baseColor, duration).SetEase(Ease.InQuad));
    }
}`,
      coroutine: `
using System.Collections;
using TMPro;
using UnityEngine;

public class DamageTextCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text label;
    [SerializeField] float strength = 8f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] Color damageColor = new Color(1f, 0.3f, 0.23f);

    Vector2 basePos;
    Color baseColor;

    void Awake()
    {
        basePos = ((RectTransform)label.transform).anchoredPosition;
        baseColor = label.color;
    }

    public void Play(int newValue)
    {
        label.text = newValue.ToString("N0");
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        var rect = (RectTransform)label.transform;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float decay = 1f - p;
            float x = (Mathf.PerlinNoise(t * 24f, 0f) * 2f - 1f) * strength * decay;
            rect.anchoredPosition = basePos + new Vector2(x, 0f);
            label.color = Color.Lerp(damageColor, baseColor, p * p);
            yield return null;
        }
        rect.anchoredPosition = basePos;
        label.color = baseColor;
    }
}`,
    },
  });

  /* 6. シャイン */
  R({
    id: 'shine',
    title: 'シャイン（光走査）',
    titleEn: 'Shine Sweep',
    category: 'text',
    tags: ['shine', 'gloss', 'レア', 'ボタン'],
    description: '光の帯が左から右へ走り抜ける。レアアイテム・プレミアムボタン・強調したいバナーに。Mask付きの親の中で細い光のImageを横切らせる。',
    spec: {
      target: '光の帯Image (親にMask/RectMask2D)',
      x: { from: '-帯幅', to: '+親の幅', duration: 0.7, ease: 'InOutQuad' },
      interval: 2.0,
      note: '帯は15°ほど傾け、alpha 0.35程度の白グラデにすると自然',
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'PREMIUM', { styles: { position: 'relative', overflow: 'hidden', padding: '12px 36px' } });
      const shine = PV.el(null, {
        position: 'absolute', top: '-20%', bottom: '-20%', width: '36px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
        transform: 'translateX(-60px) rotate(15deg)', pointerEvents: 'none',
      });
      btn.appendChild(shine);
      ctx.forever(async () => {
        await ctx.tween({
          from: -60, to: 170, duration: 0.7, ease: 'InOutQuad',
          onUpdate: v => shine.style.transform = `translateX(${v}px) rotate(15deg)`,
        });
        await ctx.wait(1.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ShineLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform shineStrip;   // Mask付き親の中の光の帯
    [SerializeField] float startX = -80f;
    [SerializeField] float endX = 280f;
    [SerializeField] float sweepDuration = 0.7f;
    [SerializeField] float interval = 2f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => Stop();

    public void Play()
    {
        Stop();
        // 掃引→待機を1周期としてループ (待機はディレイで表現)
        float total = sweepDuration + interval;
        handle = LMotion.Create(0f, total, total)
            .WithEase(Ease.Linear)
            .WithLoops(-1, LoopType.Restart)
            .Bind(now =>
            {
                float p = Mathf.Clamp01(now / sweepDuration);
                float e = p < 0.5f ? 2f * p * p : 1f - Mathf.Pow(-2f * p + 2f, 2f) / 2f; // InOutQuad
                shineStrip.anchoredPosition = new Vector2(Mathf.Lerp(startX, endX, e), 0f);
            });
    }

    public void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ShineDOTween : MonoBehaviour
{
    [SerializeField] RectTransform shineStrip;
    [SerializeField] float startX = -80f;
    [SerializeField] float endX = 280f;
    [SerializeField] float sweepDuration = 0.7f;
    [SerializeField] float interval = 2f;

    Sequence seq;

    void OnEnable() => Play();
    void OnDisable() => seq?.Kill();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        shineStrip.anchoredPosition = new Vector2(startX, 0f);
        seq = DOTween.Sequence()
            .Append(shineStrip.DOAnchorPosX(endX, sweepDuration).SetEase(Ease.InOutQuad))
            .AppendCallback(() => shineStrip.anchoredPosition = new Vector2(startX, 0f))
            .AppendInterval(interval)
            .SetLoops(-1);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ShineCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform shineStrip;
    [SerializeField] float startX = -80f;
    [SerializeField] float endX = 280f;
    [SerializeField] float sweepDuration = 0.7f;
    [SerializeField] float interval = 2f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() => StopAllCoroutines();

    IEnumerator Animate()
    {
        var wait = new WaitForSeconds(interval);
        while (true)
        {
            float t = 0f;
            while (t < sweepDuration)
            {
                t += Time.deltaTime;
                float p = Mathf.Clamp01(t / sweepDuration);
                float e = p < 0.5f ? 2f * p * p : 1f - Mathf.Pow(-2f * p + 2f, 2f) / 2f;
                shineStrip.anchoredPosition = new Vector2(Mathf.Lerp(startX, endX, e), 0f);
                yield return null;
            }
            shineStrip.anchoredPosition = new Vector2(startX, 0f);
            yield return wait;
        }
    }
}`,
    },
  });
})();
