/* 02-attention.js — 強調・ループ系 (11種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. バウンス (跳ねる) */
  R({
    id: 'bounce',
    title: 'バウンス',
    titleEn: 'Bounce',
    category: 'attention',
    tags: ['jump', 'OutBounce', '強調', '通知'],
    description: '一度跳び上がってからOutBounceで着地する。新着通知・獲得アイテム・注目させたいアイコンに。シーケンス(上昇→落下)の基本形。',
    spec: {
      target: 'RectTransform.anchoredPosition.y',
      sequence: [
        { to: '+30', duration: 0.18, ease: 'OutQuad' },
        { to: 'base', duration: 0.5, ease: 'OutBounce' },
      ],
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'NEW!' });
      const s = { y: 0 };
      ctx.forever(async () => {
        await ctx.tween({ from: 0, to: -30, duration: 0.18, ease: 'OutQuad', onUpdate: v => { s.y = v; PV.applyT(box, s); } });
        await ctx.tween({ from: -30, to: 0, duration: 0.5, ease: 'OutBounce', onUpdate: v => { s.y = v; PV.applyT(box, s); } });
        await ctx.wait(1.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class BounceLitMotion : MonoBehaviour
{
    [SerializeField] float jumpHeight = 30f;

    RectTransform rect;
    float baseY;
    MotionHandle handle;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LSequence.Create()
            .Append(LMotion.Create(baseY, baseY + jumpHeight, 0.18f)
                .WithEase(Ease.OutQuad)
                .BindToAnchoredPositionY(rect))
            .Append(LMotion.Create(baseY + jumpHeight, baseY, 0.5f)
                .WithEase(Ease.OutBounce)
                .BindToAnchoredPositionY(rect))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class BounceDOTween : MonoBehaviour
{
    [SerializeField] float jumpHeight = 30f;

    RectTransform rect;
    float baseY;
    Sequence seq;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, baseY);
        seq = DOTween.Sequence()
            .Append(rect.DOAnchorPosY(baseY + jumpHeight, 0.18f).SetEase(Ease.OutQuad))
            .Append(rect.DOAnchorPosY(baseY, 0.5f).SetEase(Ease.OutBounce));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class BounceCoroutine : MonoBehaviour
{
    [SerializeField] float jumpHeight = 30f;

    RectTransform rect;
    float baseY;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        yield return Tween(baseY, baseY + jumpHeight, 0.18f, OutQuad);
        yield return Tween(baseY + jumpHeight, baseY, 0.5f, OutBounce);
    }

    IEnumerator Tween(float from, float to, float duration, System.Func<float, float> ease)
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float y = Mathf.LerpUnclamped(from, to, ease(Mathf.Clamp01(t / duration)));
            rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, y);
            yield return null;
        }
    }

    static float OutQuad(float t) => 1f - (1f - t) * (1f - t);
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

  /* 2. シェイク */
  R({
    id: 'shake',
    title: 'シェイク',
    titleEn: 'Shake',
    category: 'attention',
    tags: ['shake', 'エラー', 'ダメージ', '否定'],
    description: '位置を細かくランダムに揺らす。入力エラー・不正操作の否定フィードバックや被ダメージ表現の定番。横方向のみに絞ると「NO」のニュアンスが強まる。',
    spec: {
      target: 'RectTransform.anchoredPosition',
      strength: { x: 12, y: 0 },
      duration: 0.4,
      frequency: 20,
      dampingRatio: 1,
      note: '減衰付きランダム振動。LitMotionはLMotion.Shake、DOTweenはDOShakeAnchorPos',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'ERROR', w: 110, h: 72 });
      box.style.borderColor = '#ff4d3a';
      const s = { x: 0 };
      ctx.forever(async () => {
        await ctx.tween({
          duration: 0.4, ease: 'Linear',
          onUpdate: (v, t) => { s.x = EASE.shakeWave(t, 1, 10, 1) * 12; PV.applyT(box, s); },
        });
        s.x = 0; PV.applyT(box, s);
        await ctx.wait(1.1);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ShakeLitMotion : MonoBehaviour
{
    [SerializeField] float strength = 12f;
    [SerializeField] float duration = 0.4f;

    RectTransform rect;
    Vector2 basePos;
    MotionHandle handle;

    void Awake()
    {
        rect = (RectTransform)transform;
        basePos = rect.anchoredPosition;
    }

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); rect.anchoredPosition = basePos; }
        handle = LMotion.Shake.Create(basePos, new Vector2(strength, 0f), duration)
            .WithFrequency(20)
            .WithDampingRatio(1f)
            .BindToAnchoredPosition(rect);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ShakeDOTween : MonoBehaviour
{
    [SerializeField] float strength = 12f;
    [SerializeField] float duration = 0.4f;

    RectTransform rect;
    Vector2 basePos;
    Tween tween;

    void Awake()
    {
        rect = (RectTransform)transform;
        basePos = rect.anchoredPosition;
    }

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        rect.anchoredPosition = basePos;
        tween = rect.DOShakeAnchorPos(duration, new Vector2(strength, 0f), vibrato: 20)
            .OnComplete(() => rect.anchoredPosition = basePos);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ShakeCoroutine : MonoBehaviour
{
    [SerializeField] float strength = 12f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] float frequency = 20f;

    RectTransform rect;
    Vector2 basePos;

    void Awake()
    {
        rect = (RectTransform)transform;
        basePos = rect.anchoredPosition;
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
            float p = Mathf.Clamp01(t / duration);
            float decay = 1f - p;                       // 線形減衰
            float x = (Mathf.PerlinNoise(t * frequency, 0f) * 2f - 1f) * strength * decay;
            rect.anchoredPosition = basePos + new Vector2(x, 0f);
            yield return null;
        }
        rect.anchoredPosition = basePos;
    }
}`,
    },
  });

  /* 3. パンチスケール */
  R({
    id: 'punch-scale',
    title: 'パンチスケール',
    titleEn: 'Punch Scale',
    category: 'attention',
    tags: ['punch', 'scale', 'タップ', 'フィードバック'],
    description: 'scaleを一瞬膨らませてから減衰振動で戻す。タップ確定・カウント加算・コンボなど「今なにか起きた」を伝える万能フィードバック。',
    spec: {
      target: 'Transform.localScale',
      base: 1.0,
      strength: 0.25,
      duration: 0.4,
      frequency: 4,
      dampingRatio: 1,
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: '+1' });
      const s = { s: 1 };
      ctx.forever(async () => {
        await ctx.tween({
          duration: 0.4, ease: 'Linear',
          onUpdate: (v, t) => { s.s = 1 + EASE.punchWave(t, 4, 1) * 0.25; PV.applyT(box, s); },
        });
        s.s = 1; PV.applyT(box, s);
        await ctx.wait(1.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class PunchScaleLitMotion : MonoBehaviour
{
    [SerializeField] float strength = 0.25f;
    [SerializeField] float duration = 0.4f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); transform.localScale = Vector3.one; }
        handle = LMotion.Punch.Create(Vector3.one, Vector3.one * strength, duration)
            .WithFrequency(4)
            .WithDampingRatio(1f)
            .BindToLocalScale(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class PunchScaleDOTween : MonoBehaviour
{
    [SerializeField] float strength = 0.25f;
    [SerializeField] float duration = 0.4f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localScale = Vector3.one;
        tween = transform.DOPunchScale(Vector3.one * strength, duration, vibrato: 8, elasticity: 1f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class PunchScaleCoroutine : MonoBehaviour
{
    [SerializeField] float strength = 0.25f;
    [SerializeField] float duration = 0.4f;
    [SerializeField] float frequency = 4f;

    public void Play()
    {
        StopAllCoroutines();
        transform.localScale = Vector3.one;
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float decay = (1f - p) * (1f - p);          // 2次減衰
            float wave = Mathf.Sin(p * frequency * Mathf.PI) * decay;
            transform.localScale = Vector3.one * (1f + wave * strength);
            yield return null;
        }
        transform.localScale = Vector3.one;
    }
}`,
    },
  });

  /* 4. パンチローテーション */
  R({
    id: 'punch-rotation',
    title: 'パンチローテーション',
    titleEn: 'Punch Rotation',
    category: 'attention',
    tags: ['punch', 'rotation', 'ベル', '通知'],
    description: 'Z回転を減衰振動で揺らす。ベルアイコンの「リンリン」という揺れや、否定的でない軽い注意喚起に向く。',
    spec: {
      target: 'Transform.localEulerAngles.z',
      base: 0,
      strength: 15,
      duration: 0.5,
      frequency: 6,
      dampingRatio: 1,
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: '🔔', w: 72, h: 72 });
      const s = { rot: 0 };
      ctx.forever(async () => {
        await ctx.tween({
          duration: 0.5, ease: 'Linear',
          onUpdate: (v, t) => { s.rot = EASE.punchWave(t, 6, 1) * 15; PV.applyT(box, s); },
        });
        s.rot = 0; PV.applyT(box, s);
        await ctx.wait(1.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class PunchRotationLitMotion : MonoBehaviour
{
    [SerializeField] float strength = 15f;
    [SerializeField] float duration = 0.5f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); transform.localEulerAngles = Vector3.zero; }
        handle = LMotion.Punch.Create(Vector3.zero, new Vector3(0f, 0f, strength), duration)
            .WithFrequency(6)
            .WithDampingRatio(1f)
            .BindToLocalEulerAngles(transform);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class PunchRotationDOTween : MonoBehaviour
{
    [SerializeField] float strength = 15f;
    [SerializeField] float duration = 0.5f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localEulerAngles = Vector3.zero;
        tween = transform.DOPunchRotation(new Vector3(0f, 0f, strength), duration, vibrato: 6);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class PunchRotationCoroutine : MonoBehaviour
{
    [SerializeField] float strength = 15f;
    [SerializeField] float duration = 0.5f;
    [SerializeField] float frequency = 6f;

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
            float decay = (1f - p) * (1f - p);
            float z = Mathf.Sin(p * frequency * Mathf.PI) * decay * strength;
            transform.localEulerAngles = new Vector3(0f, 0f, z);
            yield return null;
        }
        transform.localEulerAngles = Vector3.zero;
    }
}`,
    },
  });

  /* 5. パルス */
  R({
    id: 'pulse',
    title: 'パルス',
    titleEn: 'Pulse',
    category: 'attention',
    tags: ['scale', 'loop', 'Yoyo', '誘導'],
    description: 'scaleを1⇔1.08でゆっくり往復させ続ける。「ここを押して」というタップ誘導や録画中インジケータに。主張しすぎない常時アニメーション。',
    spec: {
      target: 'Transform.localScale',
      from: 1.0, to: 1.08,
      duration: 0.6,
      ease: 'InOutSine',
      loops: -1,
      loopType: 'Yoyo',
    },
    preview(ctx, PV) {
      const btn = PV.button(ctx, 'TAP HERE');
      const s = { s: 1 };
      ctx.tween({
        from: 1, to: 1.08, duration: 0.6, ease: 'InOutSine',
        loops: -1, loopType: 'Yoyo',
        onUpdate: v => { s.s = v; PV.applyT(btn, s); },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class PulseLitMotion : MonoBehaviour
{
    [SerializeField] float maxScale = 1.08f;
    [SerializeField] float duration = 0.6f;

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => Stop();

    public void Play()
    {
        Stop();
        handle = LMotion.Create(Vector3.one, Vector3.one * maxScale, duration)
            .WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Yoyo)
            .BindToLocalScale(transform);
    }

    public void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
        transform.localScale = Vector3.one;
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class PulseDOTween : MonoBehaviour
{
    [SerializeField] float maxScale = 1.08f;
    [SerializeField] float duration = 0.6f;

    Tween tween;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        Stop();
        tween = transform.DOScale(Vector3.one * maxScale, duration)
            .SetEase(Ease.InOutSine)
            .SetLoops(-1, LoopType.Yoyo);
    }

    public void Stop()
    {
        tween?.Kill();
        transform.localScale = Vector3.one;
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class PulseCoroutine : MonoBehaviour
{
    [SerializeField] float maxScale = 1.08f;
    [SerializeField] float duration = 0.6f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() { StopAllCoroutines(); transform.localScale = Vector3.one; }

    IEnumerator Animate()
    {
        float time = 0f;
        while (true)
        {
            time += Time.deltaTime;
            // InOutSine の無限Yoyoは sin波で表現できる
            float wave = (Mathf.Sin(time / duration * Mathf.PI - Mathf.PI / 2f) + 1f) * 0.5f;
            transform.localScale = Vector3.one * Mathf.Lerp(1f, maxScale, wave);
            yield return null;
        }
    }
}`,
    },
  });

  /* 6. ハートビート */
  R({
    id: 'heartbeat',
    title: 'ハートビート',
    titleEn: 'Heartbeat',
    category: 'attention',
    tags: ['scale', 'loop', '鼓動', 'ライフ'],
    description: '「ドッドッ…（休止）」と2拍の鼓動を刻む。ライフ残りわずか・緊急警告など、生命感や切迫感の表現に。パルスより強い注意喚起。',
    spec: {
      target: 'Transform.localScale',
      sequence: [
        { to: 1.15, duration: 0.12, ease: 'OutQuad' },
        { to: 1.0,  duration: 0.12, ease: 'InQuad' },
        { to: 1.12, duration: 0.12, ease: 'OutQuad' },
        { to: 1.0,  duration: 0.16, ease: 'InQuad' },
        { wait: 0.7 },
      ],
      loops: -1,
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'HP 1', w: 84, h: 84 });
      box.style.borderColor = '#ff4d3a';
      box.querySelector('.pv-box-label').style.color = '#ff4d3a';
      const s = { s: 1 };
      const up = (to, d) => ctx.tween({ from: s.s, to, duration: d, ease: 'OutQuad', onUpdate: v => { s.s = v; PV.applyT(box, s); } });
      const dn = (to, d) => ctx.tween({ from: s.s, to, duration: d, ease: 'InQuad', onUpdate: v => { s.s = v; PV.applyT(box, s); } });
      ctx.forever(async () => {
        await up(1.15, 0.12); await dn(1, 0.12);
        await up(1.12, 0.12); await dn(1, 0.16);
        await ctx.wait(0.7);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class HeartbeatLitMotion : MonoBehaviour
{
    MotionHandle handle;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => Stop();

    const float Cycle = 1.22f; // 0.12+0.12+0.12+0.16+休止0.7

    public void Play()
    {
        Stop();
        // SequenceはWithLoops不可のため、1周期を関数評価して無限ループ
        handle = LMotion.Create(0f, Cycle, Cycle)
            .WithEase(Ease.Linear)
            .WithLoops(-1, LoopType.Restart)
            .Bind(t => transform.localScale = Vector3.one * Evaluate(t));
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

    public void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
        transform.localScale = Vector3.one;
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HeartbeatDOTween : MonoBehaviour
{
    Sequence seq;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        Stop();
        seq = DOTween.Sequence()
            .Append(transform.DOScale(1.15f, 0.12f).SetEase(Ease.OutQuad))
            .Append(transform.DOScale(1.00f, 0.12f).SetEase(Ease.InQuad))
            .Append(transform.DOScale(1.12f, 0.12f).SetEase(Ease.OutQuad))
            .Append(transform.DOScale(1.00f, 0.16f).SetEase(Ease.InQuad))
            .AppendInterval(0.7f)
            .SetLoops(-1);
    }

    public void Stop()
    {
        seq?.Kill();
        transform.localScale = Vector3.one;
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HeartbeatCoroutine : MonoBehaviour
{
    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() { StopAllCoroutines(); transform.localScale = Vector3.one; }

    IEnumerator Animate()
    {
        while (true)
        {
            yield return Beat(1.15f, 0.12f);
            yield return Beat(1.00f, 0.12f);
            yield return Beat(1.12f, 0.12f);
            yield return Beat(1.00f, 0.16f);
            yield return new WaitForSeconds(0.7f);
        }
    }

    IEnumerator Beat(float to, float duration)
    {
        float from = transform.localScale.x;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            transform.localScale = Vector3.one * Mathf.LerpUnclamped(from, to, e);
            yield return null;
        }
        transform.localScale = Vector3.one * to;
    }
}`,
    },
  });

  /* 7. フラッシュ */
  R({
    id: 'flash',
    title: 'フラッシュ',
    titleEn: 'Flash',
    category: 'attention',
    tags: ['alpha', '点滅', '警告', '無敵時間'],
    description: 'alphaを高速で点滅させる。警告表示・被弾後の無敵時間・時間切れ間近の表現に。点滅回数は偶数にして必ずalpha=1で終わらせる。',
    spec: {
      target: 'CanvasGroup.alpha',
      from: 1, to: 0.15,
      duration: 0.1,
      ease: 'Linear',
      loops: 6,
      loopType: 'Yoyo',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'ALERT', w: 110, h: 72 });
      ctx.forever(async () => {
        await ctx.tween({
          from: 1, to: 0.15, duration: 0.1, ease: 'Linear',
          loops: 6, loopType: 'Yoyo',
          onUpdate: v => box.style.opacity = v,
        });
        box.style.opacity = 1;
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FlashLitMotion : MonoBehaviour
{
    [SerializeField] int blinkCount = 3;       // 点滅回数
    [SerializeField] float blinkDuration = 0.1f;

    CanvasGroup group;
    MotionHandle handle;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); group.alpha = 1f; }
        // Yoyoで往復するためループ数は点滅回数の2倍
        handle = LMotion.Create(1f, 0.15f, blinkDuration)
            .WithLoops(blinkCount * 2, LoopType.Yoyo)
            .BindToAlpha(group);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FlashDOTween : MonoBehaviour
{
    [SerializeField] int blinkCount = 3;
    [SerializeField] float blinkDuration = 0.1f;

    CanvasGroup group;
    Tween tween;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        group.alpha = 1f;
        tween = group.DOFade(0.15f, blinkDuration)
            .SetEase(Ease.Linear)
            .SetLoops(blinkCount * 2, LoopType.Yoyo);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(CanvasGroup))]
public class FlashCoroutine : MonoBehaviour
{
    [SerializeField] int blinkCount = 3;
    [SerializeField] float blinkDuration = 0.1f;

    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();

    public void Play()
    {
        StopAllCoroutines();
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        for (int i = 0; i < blinkCount; i++)
        {
            yield return Fade(1f, 0.15f);
            yield return Fade(0.15f, 1f);
        }
        group.alpha = 1f;
    }

    IEnumerator Fade(float from, float to)
    {
        float t = 0f;
        while (t < blinkDuration)
        {
            t += Time.deltaTime;
            group.alpha = Mathf.Lerp(from, to, Mathf.Clamp01(t / blinkDuration));
            yield return null;
        }
    }
}`,
    },
  });

  /* 8. ラバーバンド */
  R({
    id: 'rubber-band',
    title: 'ラバーバンド',
    titleEn: 'Rubber Band',
    category: 'attention',
    tags: ['scale', 'squash', 'コミカル', '強調'],
    description: 'ゴムのように横に伸びて縦に縮み、振動しながら戻る。squash & stretchの原則に基づくコミカルな強調。カジュアルゲームのボタンやキャラアイコンに。',
    spec: {
      target: 'Transform.localScale (X/Y個別)',
      keyframes: [
        { scaleX: 1.25, scaleY: 0.75, at: 0.3 },
        { scaleX: 0.85, scaleY: 1.15, at: 0.5 },
        { scaleX: 1.05, scaleY: 0.95, at: 0.7 },
        { scaleX: 1.0,  scaleY: 1.0,  at: 1.0 },
      ],
      duration: 0.8,
      ease: 'OutQuad (区間ごと)',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'BAND' });
      const s = { sx: 1, sy: 1 };
      const seg = (tx, ty, d) => {
        const fx = s.sx, fy = s.sy;
        return ctx.tween({
          duration: d, ease: 'OutQuad',
          onUpdate: v => { s.sx = fx + (tx - fx) * v; s.sy = fy + (ty - fy) * v; PV.applyT(box, s); },
        });
      };
      ctx.forever(async () => {
        await seg(1.25, 0.75, 0.24);
        await seg(0.85, 1.15, 0.16);
        await seg(1.05, 0.95, 0.16);
        await seg(1.0, 1.0, 0.24);
        await ctx.wait(1.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

public class RubberBandLitMotion : MonoBehaviour
{
    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); transform.localScale = Vector3.one; }
        // Sequence構築時にモーションが生成されるため、fromは明示的に渡す
        var k0 = Vector2.one;
        var k1 = new Vector2(1.25f, 0.75f);
        var k2 = new Vector2(0.85f, 1.15f);
        var k3 = new Vector2(1.05f, 0.95f);
        handle = LSequence.Create()
            .Append(To(k0, k1, 0.24f))
            .Append(To(k1, k2, 0.16f))
            .Append(To(k2, k3, 0.16f))
            .Append(To(k3, Vector2.one, 0.24f))
            .Run();
    }

    MotionHandle To(Vector2 from, Vector2 target, float duration)
    {
        return LMotion.Create(from, target, duration)
            .WithEase(Ease.OutQuad)
            .Bind(s => transform.localScale = new Vector3(s.x, s.y, 1f));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class RubberBandDOTween : MonoBehaviour
{
    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        transform.localScale = Vector3.one;
        seq = DOTween.Sequence()
            .Append(transform.DOScale(new Vector3(1.25f, 0.75f, 1f), 0.24f).SetEase(Ease.OutQuad))
            .Append(transform.DOScale(new Vector3(0.85f, 1.15f, 1f), 0.16f).SetEase(Ease.OutQuad))
            .Append(transform.DOScale(new Vector3(1.05f, 0.95f, 1f), 0.16f).SetEase(Ease.OutQuad))
            .Append(transform.DOScale(Vector3.one, 0.24f).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class RubberBandCoroutine : MonoBehaviour
{
    public void Play()
    {
        StopAllCoroutines();
        transform.localScale = Vector3.one;
        StartCoroutine(Animate());
    }

    IEnumerator Animate()
    {
        yield return To(new Vector2(1.25f, 0.75f), 0.24f);
        yield return To(new Vector2(0.85f, 1.15f), 0.16f);
        yield return To(new Vector2(1.05f, 0.95f), 0.16f);
        yield return To(Vector2.one, 0.24f);
    }

    IEnumerator To(Vector2 target, float duration)
    {
        Vector2 from = transform.localScale;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = 1f - (1f - p) * (1f - p); // OutQuad
            Vector2 s = Vector2.LerpUnclamped(from, target, e);
            transform.localScale = new Vector3(s.x, s.y, 1f);
            yield return null;
        }
    }
}`,
    },
  });

  /* 9. ジェロー */
  R({
    id: 'jello',
    title: 'ジェロー',
    titleEn: 'Jello',
    category: 'attention',
    tags: ['scale', 'wobble', 'ぷるぷる', 'コミカル'],
    description: 'ゼリーのように「ぷるぷる」とX/Y逆位相の減衰振動で揺れる。かわいい系UI・食べ物アイコン・スライム的なキャラボタンに。',
    spec: {
      target: 'Transform.localScale (X/Y逆位相)',
      strength: 0.15,
      duration: 0.7,
      frequency: 8,
      dampingRatio: 1,
      formula: 'scaleX = 1 + sin(t*f*π)*decay*s, scaleY = 1 - sin(t*f*π)*decay*s',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'JELLY' });
      box.style.borderRadius = '10px';
      const s = { sx: 1, sy: 1 };
      ctx.forever(async () => {
        await ctx.tween({
          duration: 0.7, ease: 'Linear',
          onUpdate: (v, t) => {
            const w = EASE.punchWave(t, 8, 1) * 0.15;
            s.sx = 1 + w; s.sy = 1 - w; PV.applyT(box, s);
          },
        });
        s.sx = 1; s.sy = 1; PV.applyT(box, s);
        await ctx.wait(1.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

public class JelloLitMotion : MonoBehaviour
{
    [SerializeField] float strength = 0.15f;
    [SerializeField] float duration = 0.7f;
    [SerializeField] float frequency = 8f;

    MotionHandle handle;

    void OnDestroy() { if (handle.IsActive()) handle.Cancel(); }

    public void Play()
    {
        if (handle.IsActive()) { handle.Cancel(); transform.localScale = Vector3.one; }
        // 0→1の進行値からX/Y逆位相の揺れを自前計算してBind
        handle = LMotion.Create(0f, 1f, duration)
            .Bind(p =>
            {
                float decay = (1f - p) * (1f - p);
                float w = Mathf.Sin(p * frequency * Mathf.PI) * decay * strength;
                transform.localScale = new Vector3(1f + w, 1f - w, 1f);
            });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class JelloDOTween : MonoBehaviour
{
    [SerializeField] float strength = 0.15f;
    [SerializeField] float duration = 0.7f;
    [SerializeField] float frequency = 8f;

    Tween tween;

    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        tween?.Kill();
        transform.localScale = Vector3.one;
        // 進行値0→1をトゥイーンし、X/Y逆位相の揺れを自前計算
        float p = 0f;
        tween = DOTween.To(() => p, v =>
        {
            p = v;
            float decay = (1f - p) * (1f - p);
            float w = Mathf.Sin(p * frequency * Mathf.PI) * decay * strength;
            transform.localScale = new Vector3(1f + w, 1f - w, 1f);
        }, 1f, duration).SetEase(Ease.Linear);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class JelloCoroutine : MonoBehaviour
{
    [SerializeField] float strength = 0.15f;
    [SerializeField] float duration = 0.7f;
    [SerializeField] float frequency = 8f;

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
            float decay = (1f - p) * (1f - p);
            float w = Mathf.Sin(p * frequency * Mathf.PI) * decay * strength;
            transform.localScale = new Vector3(1f + w, 1f - w, 1f);
            yield return null;
        }
        transform.localScale = Vector3.one;
    }
}`,
    },
  });

  /* 10. フロート */
  R({
    id: 'float-loop',
    title: 'フロート（浮遊）',
    titleEn: 'Float Loop',
    category: 'attention',
    tags: ['position', 'loop', '浮遊', 'アイドル'],
    description: 'Y座標を±8pxでゆったり往復させ続ける。宝箱・実績アイコン・装飾要素などの「生きている感」を出すアイドルアニメーション。',
    spec: {
      target: 'RectTransform.anchoredPosition.y',
      amplitude: 8,
      duration: 1.2,
      ease: 'InOutSine',
      loops: -1,
      loopType: 'Yoyo',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'GIFT' });
      const s = { y: 0 };
      ctx.tween({
        from: 8, to: -8, duration: 1.2, ease: 'InOutSine',
        loops: -1, loopType: 'Yoyo',
        onUpdate: v => { s.y = v; PV.applyT(box, s); },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class FloatLoopLitMotion : MonoBehaviour
{
    [SerializeField] float amplitude = 8f;
    [SerializeField] float duration = 1.2f;

    RectTransform rect;
    float baseY;
    MotionHandle handle;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => Stop();

    public void Play()
    {
        Stop();
        handle = LMotion.Create(baseY + amplitude, baseY - amplitude, duration)
            .WithEase(Ease.InOutSine)
            .WithLoops(-1, LoopType.Yoyo)
            .BindToAnchoredPositionY(rect);
    }

    public void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
        if (rect != null) rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, baseY);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class FloatLoopDOTween : MonoBehaviour
{
    [SerializeField] float amplitude = 8f;
    [SerializeField] float duration = 1.2f;

    RectTransform rect;
    float baseY;
    Tween tween;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        Stop();
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, baseY + amplitude);
        tween = rect.DOAnchorPosY(baseY - amplitude, duration)
            .SetEase(Ease.InOutSine)
            .SetLoops(-1, LoopType.Yoyo);
    }

    public void Stop()
    {
        tween?.Kill();
        if (rect != null) rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, baseY);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class FloatLoopCoroutine : MonoBehaviour
{
    [SerializeField] float amplitude = 8f;
    [SerializeField] float duration = 1.2f;

    RectTransform rect;
    float baseY;

    void Awake()
    {
        rect = (RectTransform)transform;
        baseY = rect.anchoredPosition.y;
    }

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable()
    {
        StopAllCoroutines();
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, baseY);
    }

    IEnumerator Animate()
    {
        float time = 0f;
        while (true)
        {
            time += Time.deltaTime;
            float y = baseY + Mathf.Sin(time / duration * Mathf.PI) * amplitude;
            rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, y);
            yield return null;
        }
    }
}`,
    },
  });

  /* 11. 回転ループ */
  R({
    id: 'rotate-loop',
    title: '回転ループ',
    titleEn: 'Rotate Loop',
    category: 'attention',
    tags: ['rotation', 'loop', '歯車', '常時'],
    description: 'Z軸を等速で回し続ける。歯車・コイン・処理中アイコンなど。Linear必須(イージングを付けるとカクつく)。RestartループでZ角度を0→-360に。',
    spec: {
      target: 'Transform.localEulerAngles.z',
      from: 0, to: -360,
      duration: 2.0,
      ease: 'Linear',
      loops: -1,
      loopType: 'Restart',
    },
    preview(ctx, PV) {
      const box = PV.box(ctx, { label: 'GEAR', w: 80, h: 80 });
      const s = { rot: 0 };
      ctx.tween({
        from: 0, to: -360, duration: 2.0, ease: 'Linear',
        loops: -1, loopType: 'Restart',
        onUpdate: v => { s.rot = v; PV.applyT(box, s); },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class RotateLoopLitMotion : MonoBehaviour
{
    [SerializeField] float duration = 2f;   // 1回転にかかる秒数

    MotionHandle handle;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => Stop();

    public void Play()
    {
        Stop();
        handle = LMotion.Create(0f, -360f, duration)
            .WithEase(Ease.Linear)
            .WithLoops(-1, LoopType.Restart)
            .Bind(z => transform.localEulerAngles = new Vector3(0f, 0f, z));
    }

    public void Stop()
    {
        if (handle.IsActive()) handle.Cancel();
        transform.localEulerAngles = Vector3.zero;
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class RotateLoopDOTween : MonoBehaviour
{
    [SerializeField] float duration = 2f;

    Tween tween;

    void OnEnable() => Play();
    void OnDisable() => Stop();
    void OnDestroy() => tween?.Kill();

    public void Play()
    {
        Stop();
        // RotateMode.FastBeyond360 で360°超の回転を正しく扱う
        tween = transform.DOLocalRotate(new Vector3(0f, 0f, -360f), duration, RotateMode.FastBeyond360)
            .SetEase(Ease.Linear)
            .SetLoops(-1, LoopType.Restart);
    }

    public void Stop()
    {
        tween?.Kill();
        transform.localEulerAngles = Vector3.zero;
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class RotateLoopCoroutine : MonoBehaviour
{
    [SerializeField] float duration = 2f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() { StopAllCoroutines(); transform.localEulerAngles = Vector3.zero; }

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
})();
