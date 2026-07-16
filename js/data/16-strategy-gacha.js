/* 16-strategy-gacha.js — ストラテジー/シミュ/ガチャの手触り (第1弾 1種)
 *   gacha-reveal
 * 配属: attention。UI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. ガチャ演出 (attention) */
  R({
    id: 'gacha-reveal',
    title: 'ガチャ演出',
    titleEn: 'Gacha Reveal',
    category: 'attention',
    tags: ['ガチャ', '開封', 'レア', '排出'],
    description: '光るオーブが脈動して溜め、弾けて割れると同時にレアリティ色の光が放射状に広がり、中身が現れる期待感の演出。ガチャ排出・宝箱開封・報酬アンロックに。溜め(pulse)→炸裂(scale+shake)→放射光(OutExpo)→中身ポップ(OutBack) の4段で組む。レア色を段階で変えると排出演出のバリエーションになる。',
    spec: {
      charge: { target: 'オーブ localScale', pulse: '0.9⇔1.05', ease: 'InOutSine', 溜め: '約1s' },
      burst: { scale: '1→1.4', ease: 'OutQuad', with: '軽い shake' },
      rays: { target: '放射光 scale + alpha', from: 0, to: 1, duration: 0.5, ease: 'OutExpo' },
      reveal: { target: '中身 localScale', from: 0, to: 1, duration: 0.45, ease: 'OutBack' },
      rarity_color: 'レア度で光色を段階変化 (通常→レア→最高)',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      // 放射光
      const rays = PV.el(null, { position: 'absolute', left: '0', top: '0', willChange: 'transform,opacity', pointerEvents: 'none' });
      const NR = 14;
      for (let i = 0; i < NR; i++) {
        const ray = PV.el(null, {
          position: 'absolute', left: '0', top: '0', width: '120px', height: '4px', marginTop: '-2px',
          transformOrigin: 'left center', transform: `rotate(${i / NR * 360}deg) scaleX(0)`,
          background: 'linear-gradient(90deg, var(--pv-accent), transparent)',
        });
        rays.appendChild(ray);
      }
      center.appendChild(rays);
      // オーブ
      const orb = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '64px', height: '64px', marginLeft: '-32px', marginTop: '-32px',
        borderRadius: '50%', willChange: 'transform,opacity',
        background: 'radial-gradient(circle at 38% 34%, #fff, var(--pv-accent) 55%, var(--pv-accent-dim))',
        boxShadow: '0 0 18px var(--pv-accent)',
      });
      center.appendChild(orb);
      // 中身
      const prize = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '54px', height: '54px', marginLeft: '-27px', marginTop: '-27px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform,opacity',
        background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '2px solid var(--pv-accent)',
        color: 'var(--pv-accent)', fontSize: '26px', clipPath: 'polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)',
      }, '★');
      center.appendChild(prize);

      const rayEls = [...rays.children];
      const setRays = v => rayEls.forEach(r => { const base = r.style.transform.match(/rotate\([^)]*\)/)[0]; r.style.transform = `${base} scaleX(${v})`; r.style.opacity = 1 - v * 0.5; });
      const setOrb = (s, a) => { orb.style.transform = `scale(${s})`; orb.style.opacity = a; };
      const setPrize = (s, a) => { prize.style.transform = `scale(${s})`; prize.style.opacity = a; };

      ctx.forever(async () => {
        setOrb(0.9, 1); setPrize(0, 0); setRays(0); rays.style.transform = 'rotate(0deg)';
        // 溜め (脈動)
        await ctx.tween({ from: 0, to: 1, duration: 1.0, ease: 'InOutSine', loops: 3, loopType: 'Yoyo', onUpdate: v => setOrb(lerp(0.9, 1.05, v), 1) });
        // 炸裂 + 微振動
        await ctx.tween({ from: 1.05, to: 1.4, duration: 0.16, ease: 'OutQuad', onUpdate: (v, t) => { const sh = EASE.shakeWave(t, 3, 14, 0.4) * 4; center.style.transform = `translate(calc(-50% + ${sh}px),-50%)`; setOrb(v, 1 - t); } });
        center.style.transform = 'translate(-50%,-50%)';
        setOrb(0, 0);
        // 放射光 + 中身ポップ
        ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutExpo', onUpdate: setRays });
        ctx.tween({ from: 0, to: 1, duration: 0.8, ease: 'Linear', onUpdate: (v, t) => rays.style.transform = `rotate(${t * 0.8 * 60}deg)` });
        await ctx.tween({ from: 0, to: 1, duration: 0.45, delay: 0.05, ease: 'OutBack', onUpdate: v => setPrize(v, Math.min(v * 2, 1)) });
        await ctx.wait(1.2);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InQuad', onUpdate: (v, t) => { setPrize(v, 1 - t); setRays(1 - t); } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 溜め(脈動) → 炸裂 → 放射光 + 中身ポップ の順に再生
public class GachaRevealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform orb;
    [SerializeField] RectTransform rays;
    [SerializeField] RectTransform prize;
    [SerializeField] CanvasGroup orbGroup;
    [SerializeField] CanvasGroup prizeGroup;

    void OnEnable() => Play();

    public void Play()
    {
        orb.localScale = Vector3.one * 0.9f; orbGroup.alpha = 1f;
        rays.localScale = Vector3.zero;
        prize.localScale = Vector3.zero; prizeGroup.alpha = 0f;

        LSequence.Create()
            // 溜め
            .Append(LMotion.Create(0.9f, 1.05f, 1f).WithEase(Ease.InOutSine).WithLoops(3, LoopType.Yoyo)
                .Bind(s => orb.localScale = Vector3.one * s))
            // 炸裂 (オーブは膨らんで消える)
            .Append(LMotion.Create(1.05f, 1.4f, 0.16f).WithEase(Ease.OutQuad)
                .Bind(s => orb.localScale = Vector3.one * s))
            .Join(LMotion.Create(1f, 0f, 0.16f).BindToAlpha(orbGroup))
            // 放射光 + 中身
            .Append(LMotion.Create(0f, 1f, 0.5f).WithEase(Ease.OutExpo)
                .Bind(s => rays.localScale = Vector3.one * s))
            .Join(LMotion.Create(0f, 1f, 0.45f).WithEase(Ease.OutBack)
                .Bind(s => prize.localScale = Vector3.one * s))
            .Join(LMotion.Create(0f, 1f, 0.25f).BindToAlpha(prizeGroup))
            .Run();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class GachaRevealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform orb;
    [SerializeField] RectTransform rays;
    [SerializeField] RectTransform prize;
    [SerializeField] CanvasGroup orbGroup;
    [SerializeField] CanvasGroup prizeGroup;

    void OnEnable() => Play();

    public void Play()
    {
        orb.localScale = Vector3.one * 0.9f; orbGroup.alpha = 1f;
        rays.localScale = Vector3.zero;
        prize.localScale = Vector3.zero; prizeGroup.alpha = 0f;

        DOTween.Sequence()
            .Append(orb.DOScale(1.05f, 1f).SetEase(Ease.InOutSine).SetLoops(6, LoopType.Yoyo))
            .Append(orb.DOScale(1.4f, 0.16f).SetEase(Ease.OutQuad))
            .Join(orbGroup.DOFade(0f, 0.16f))
            .Append(rays.DOScale(1f, 0.5f).SetEase(Ease.OutExpo))
            .Join(prize.DOScale(1f, 0.45f).SetEase(Ease.OutBack))
            .Join(prizeGroup.DOFade(1f, 0.25f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class GachaRevealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform orb;
    [SerializeField] RectTransform rays;
    [SerializeField] RectTransform prize;
    [SerializeField] CanvasGroup orbGroup;
    [SerializeField] CanvasGroup prizeGroup;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        orbGroup.alpha = 1f; prizeGroup.alpha = 0f;
        prize.localScale = Vector3.zero; rays.localScale = Vector3.zero;
        // 溜め
        float t = 0f;
        while (t < 1f)
        {
            t += Time.deltaTime;
            float w = (Mathf.Sin(t * Mathf.PI * 6f) + 1f) * 0.5f;
            orb.localScale = Vector3.one * Mathf.Lerp(0.9f, 1.05f, w);
            yield return null;
        }
        // 炸裂
        t = 0f;
        while (t < 0.16f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.16f);
            orb.localScale = Vector3.one * Mathf.Lerp(1.05f, 1.4f, 1f - (1f - p) * (1f - p));
            orbGroup.alpha = 1f - p;
            yield return null;
        }
        // 放射光 + 中身
        t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.5f);
            rays.localScale = Vector3.one * (1f - Mathf.Pow(2f, -10f * p));            // OutExpo
            prize.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.45f));         // OutBack
            prizeGroup.alpha = Mathf.Clamp01(t / 0.25f);
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
#Orb   { scale: 0.9 0.9; opacity: 1; }
#Orb.burst  { scale: 1.4 1.4; opacity: 0; transition: scale 160ms ease-out, opacity 160ms ease-out; }
#Rays  { scale: 0 0; opacity: 0; }
#Rays.show  { scale: 1 1; opacity: 1; transition: scale 500ms ease-out-expo, opacity 500ms ease-out; }
#Prize { scale: 0 0; opacity: 0; }
#Prize.show { scale: 1 1; opacity: 1; transition: scale 450ms ease-out-back, opacity 250ms ease-out; }

/* ===== C# (.cs) — 溜めの脈動は schedule、以降はクラス切替 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class GachaRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var orb = root.Q<VisualElement>("Orb");
        var rays = root.Q<VisualElement>("Rays");
        var prize = root.Q<VisualElement>("Prize");

        // 溜め (約1s 脈動)
        var pulse = orb.schedule.Execute(() =>
        {
            float w = (Mathf.Sin(Time.time * Mathf.PI * 6f) + 1f) * 0.5f;
            float s = Mathf.Lerp(0.9f, 1.05f, w);
            orb.style.scale = new Scale(new Vector3(s, s, 1f));
        }).Every(16);

        orb.schedule.Execute(() =>
        {
            pulse.Pause();
            orb.AddToClassList("burst");
            rays.AddToClassList("show");
            prize.AddToClassList("show");
        }).ExecuteLater(1000);
    }
}`,
    },
  });

  /* 2. レアリティ光柱 (attention) */
  R({
    id: 'rarity-pillar',
    title: 'レアリティ光柱',
    titleEn: 'Rarity Pillar',
    category: 'attention',
    tags: ['ガチャ', 'レアリティ', '光柱', 'オーラ'],
    description: 'アイテムの背後に、レア度に応じた高さ・色の光の柱が下からせり上がって立ち、上端で光が拡散する。同時にアイテムアイコンが前面へポップして登場。ガチャ排出・報酬アンロックのレア度表現に。柱の立ち上げ(OutExpo)＋上端ハローの拡散(OutQuad)＋アイコンのポップ(OutBack)＋粒子の舞い上がりで組み、最高レアだけ色を金系にすると格の違いが出せる。',
    spec: {
      pillar: { target: '光柱 localScale.y', from: 0, to: 1, ease: 'OutExpo', duration: 0.55, origin: '下端(bottom)' },
      halo: { target: '上端グロー scale + alpha', ease: 'OutQuad', delay: 0.28, 拡散: 'アイコン出現に合わせ上端で広がる' },
      particles: { target: '粒子 位置 + alpha', ease: 'OutQuad', 動き: '柱に沿って舞い上がりフェード' },
      icon: { target: 'アイテム localScale', from: 0, to: 1, ease: 'OutBack', duration: 0.4, delay: 0.32 },
      rarity: '通常→レア→最高 で 柱の色と高さを段階変化 (最高=金系を意図的例外で採用)',
    },
    preview(ctx, PV) {
      const RAR = [
        { col: 'var(--pv-accent-dim)', top: 'var(--pv-accent)', h: 0.62 },
        { col: 'var(--pv-accent)', top: '#fff', h: 0.82 },
        { col: '#c9a24b', top: '#fff', h: 1.0 }, // 最高レア = 金系 (意図的な例外)
      ];
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '60%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const PH = 64;
      // 光柱 (下端origin)
      const pillar = PV.el(null, {
        position: 'absolute', left: '-13px', top: -PH + 'px', width: '26px', height: PH + 'px',
        transformOrigin: 'center bottom', transform: 'scaleY(0)', willChange: 'transform',
        borderRadius: '13px', filter: 'blur(0.5px)',
      });
      center.appendChild(pillar);
      // 上端ハロー
      const halo = PV.el(null, {
        position: 'absolute', left: '-24px', top: '-24px', width: '48px', height: '48px',
        borderRadius: '50%', transform: 'scale(0)', opacity: 0, willChange: 'transform,opacity', pointerEvents: 'none',
      });
      center.appendChild(halo);
      // 粒子
      const NP = 6, parts = [];
      for (let i = 0; i < NP; i++) {
        const p = PV.el(null, { position: 'absolute', left: '-2px', top: '-2px', width: '4px', height: '4px', borderRadius: '50%', willChange: 'transform,opacity', opacity: 0, pointerEvents: 'none' });
        center.appendChild(p); parts.push(p);
      }
      // アイテム
      const icon = PV.el(null, {
        position: 'absolute', left: '-22px', top: '-22px', width: '44px', height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
        borderRadius: '10px', background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))',
        border: '2px solid var(--pv-accent)', color: 'var(--pv-accent)', willChange: 'transform,opacity',
        transform: 'scale(0)', opacity: 0,
      }, '◆');
      center.appendChild(icon);

      let ri = 0;
      ctx.forever(async () => {
        const r = RAR[ri % RAR.length]; ri++;
        const topY = -PH * r.h;
        pillar.style.background = `linear-gradient(to top, ${r.col}, ${r.col} 40%, transparent)`;
        pillar.style.boxShadow = `0 0 20px ${r.col}`;
        halo.style.background = `radial-gradient(circle, ${r.top}, ${r.col} 45%, transparent 70%)`;
        halo.style.top = (topY - 24) + 'px';
        icon.style.borderColor = r.col; icon.style.color = r.col;
        pillar.style.transform = 'scaleY(0)';
        halo.style.opacity = 0; halo.style.transform = 'scale(0)';
        icon.style.transform = 'scale(0)'; icon.style.opacity = 0;
        parts.forEach(p => { p.style.opacity = 0; p.style.background = r.top; });
        // 柱がせり上がる
        ctx.tween({ from: 0, to: r.h, duration: 0.55, ease: 'OutExpo', onUpdate: v => pillar.style.transform = `scaleY(${v})` });
        // 上端ハロー拡散
        ctx.tween({ from: 0, to: 1, duration: 0.5, delay: 0.28, ease: 'OutQuad', onUpdate: (v, t) => { halo.style.transform = `scale(${lerp(0.3, 1.05, v)})`; halo.style.opacity = (t < 0.5 ? t * 2 : (1 - t) * 2) * 0.9; } });
        // 粒子が柱に沿って舞い上がる
        parts.forEach((p, i) => ctx.tween({ from: 0, to: 1, duration: 0.7, delay: 0.3 + i * 0.05, ease: 'OutQuad', onUpdate: (v, t) => { const dx = (i % 2 ? 1 : -1) * (5 + i * 2) * v; p.style.transform = `translate(${dx}px, ${lerp(-14, topY - 14, v)}px)`; p.style.opacity = (1 - t) * 0.9; } }));
        // アイコンをポップ
        await ctx.tween({ from: 0, to: 1, duration: 0.4, delay: 0.32, ease: 'OutBack', onUpdate: v => { icon.style.transform = `scale(${v})`; icon.style.opacity = Math.min(v * 2, 1); } });
        await ctx.wait(1.1);
        // 退場
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InQuad', onUpdate: v => { icon.style.transform = `scale(${v})`; icon.style.opacity = v; pillar.style.transform = `scaleY(${r.h * v})`; halo.style.opacity = v * 0.9; } });
        await ctx.wait(0.35);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 光柱がせり上がり(OutExpo) → 上端ハロー拡散 → アイテムをポップ(OutBack)
public class RarityPillarLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform pillar;   // pivot は下端(0,0)
    [SerializeField] RectTransform halo;
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup haloGroup;
    [SerializeField] CanvasGroup iconGroup;
    [Range(0, 2)] public int rarity = 2;     // 0..2 でレア度

    void OnEnable() => Play();

    public void Play()
    {
        float h = Mathf.Lerp(0.62f, 1f, rarity / 2f);
        pillar.localScale = new Vector3(1f, 0f, 1f);
        halo.localScale = Vector3.zero; haloGroup.alpha = 0f;
        icon.localScale = Vector3.zero; iconGroup.alpha = 0f;

        LMotion.Create(0f, h, 0.55f).WithEase(Ease.OutExpo)
            .Bind(v => pillar.localScale = new Vector3(1f, v, 1f));
        LMotion.Create(0.3f, 1.05f, 0.5f).WithDelay(0.28f).WithEase(Ease.OutQuad)
            .Bind(v => halo.localScale = Vector3.one * v);
        LMotion.Create(0f, 1f, 0.25f).WithDelay(0.28f).BindToAlpha(haloGroup);
        LMotion.Create(0f, 1f, 0.4f).WithDelay(0.32f).WithEase(Ease.OutBack)
            .Bind(v => icon.localScale = Vector3.one * v);
        LMotion.Create(0f, 1f, 0.2f).WithDelay(0.32f).BindToAlpha(iconGroup);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class RarityPillarDOTween : MonoBehaviour
{
    [SerializeField] RectTransform pillar, halo, icon;   // pillar pivot は下端
    [SerializeField] CanvasGroup haloGroup, iconGroup;
    [Range(0, 2)] public int rarity = 2;

    void OnEnable() => Play();

    public void Play()
    {
        float h = Mathf.Lerp(0.62f, 1f, rarity / 2f);
        pillar.localScale = new Vector3(1f, 0f, 1f);
        halo.localScale = Vector3.zero; haloGroup.alpha = 0f;
        icon.localScale = Vector3.zero; iconGroup.alpha = 0f;

        DOTween.Sequence()
            .Append(pillar.DOScaleY(h, 0.55f).SetEase(Ease.OutExpo))
            .Insert(0.28f, halo.DOScale(1.05f, 0.5f).SetEase(Ease.OutQuad))
            .Insert(0.28f, haloGroup.DOFade(1f, 0.25f))
            .Insert(0.32f, icon.DOScale(1f, 0.4f).SetEase(Ease.OutBack))
            .Insert(0.32f, iconGroup.DOFade(1f, 0.2f));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class RarityPillarCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform pillar, halo, icon;
    [SerializeField] CanvasGroup haloGroup, iconGroup;
    [Range(0, 2)] public int rarity = 2;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        float h = Mathf.Lerp(0.62f, 1f, rarity / 2f);
        pillar.localScale = new Vector3(1f, 0f, 1f);
        halo.localScale = Vector3.zero; haloGroup.alpha = 0f;
        icon.localScale = Vector3.zero; iconGroup.alpha = 0f;

        float t = 0f;
        while (t < 0.72f)
        {
            t += Time.deltaTime;
            float py = Mathf.Clamp01(t / 0.55f);
            pillar.localScale = new Vector3(1f, h * (1f - Mathf.Pow(2f, -10f * py)), 1f);   // OutExpo
            float hp = Mathf.Clamp01((t - 0.28f) / 0.5f);
            halo.localScale = Vector3.one * Mathf.Lerp(0.3f, 1.05f, hp);
            haloGroup.alpha = Mathf.Clamp01((t - 0.28f) / 0.25f);
            float ip = Mathf.Clamp01((t - 0.32f) / 0.4f);
            icon.localScale = Vector3.one * OutBack(ip);
            iconGroup.alpha = Mathf.Clamp01((t - 0.32f) / 0.2f);
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
#Pillar      { scale: 1 0; transform-origin: bottom; }   /* Y方向にせり上がる */
#Pillar.rise { scale: 1 1; transition: scale 550ms ease-out-expo; }
#Halo        { scale: 0.3; opacity: 0; }
#Halo.rise   { scale: 1.05; opacity: 1; transition: scale 500ms 280ms ease-out, opacity 250ms 280ms ease-out; }
#Icon        { scale: 0; opacity: 0; }
#Icon.rise   { scale: 1; opacity: 1; transition: scale 400ms 320ms ease-out-back, opacity 200ms 320ms ease-out; }

/* ===== C# (.cs) — レア度で色を差し替え、クラス付与で再生 ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class RarityPillarUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        // レア度に応じた柱色/高さは USS 変数やインラインstyleで差し替える想定
        root.Q("Pillar").AddToClassList("rise");
        root.Q("Halo").AddToClassList("rise");
        root.Q("Icon").AddToClassList("rise");
    }
}`,
    },
  });

  /* 3. スター評価 (attention) */
  R({
    id: 'star-rating',
    title: 'スター評価',
    titleEn: 'Star Rating',
    category: 'attention',
    tags: ['ガチャ', 'スター', '評価', 'ランクアップ'],
    description: '★が左から1つずつ、OutBack で弾みながら埋まっていく評価表示。キャラの星ランク・武器強化・スコア評価に。点灯を stagger(約0.16s間隔)にして順番に見せ、埋まり切ったら少し留めてから消灯→再生。埋まった★は var(--pv-accent)、空★は控えめな線色で全テーマ追従。',
    spec: {
      count: { total: 5, filled: 5 },
      fill: { target: '各★ localScale', from: 0.2, to: 1, ease: 'OutBack', duration: 0.42 },
      stagger: '左から 0.16s 間隔で順次点灯',
      color: '埋:accent / 空:line。点灯の瞬間に色を切替',
    },
    preview(ctx, PV) {
      const N = 5;
      const row = PV.el(null, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', gap: '9px' });
      ctx.stage.appendChild(row);
      const STAR = 'polygon(50% 2%,61% 35%,96% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,4% 35%,39% 35%)';
      const stars = [];
      for (let i = 0; i < N; i++) {
        const s = PV.el(null, { width: '30px', height: '30px', clipPath: STAR, background: 'var(--pv-line)', willChange: 'transform,background' });
        row.appendChild(s); stars.push(s);
      }
      const setFill = (el, on) => { el.style.background = on ? 'var(--pv-accent)' : 'var(--pv-line)'; };
      ctx.forever(async () => {
        stars.forEach(s => { setFill(s, false); s.style.transform = 'scale(1)'; });
        await ctx.wait(0.4);
        for (let i = 0; i < N; i++) {
          if (!ctx.alive) return;
          setFill(stars[i], true);
          ctx.tween({ from: 0, to: 1, duration: 0.42, ease: 'OutBack', onUpdate: v => stars[i].style.transform = `scale(${lerp(0.2, 1, v)})` });
          await ctx.wait(0.16);
        }
        await ctx.wait(1.4);
        for (let i = N - 1; i >= 0; i--) {
          if (!ctx.alive) return;
          setFill(stars[i], false);
          await ctx.wait(0.06);
        }
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// ★を左から順に点灯し、OutBack で弾ませる
public class StarRatingLitMotion : MonoBehaviour
{
    [SerializeField] Image[] stars;                            // 5枚
    [SerializeField] Color emptyColor = new Color(1, 1, 1, 0.2f);
    [SerializeField] Color fillColor = Color.yellow;
    public int rating = 5;

    void OnEnable() => Play();

    public void Play()
    {
        for (int i = 0; i < stars.Length; i++)
        {
            stars[i].color = emptyColor;
            stars[i].transform.localScale = Vector3.one;
        }
        for (int i = 0; i < rating && i < stars.Length; i++)
        {
            var star = stars[i];
            LMotion.Create(0.2f, 1f, 0.42f).WithDelay(i * 0.16f).WithEase(Ease.OutBack)
                .Bind(v =>
                {
                    star.color = fillColor;
                    star.transform.localScale = Vector3.one * v;
                });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class StarRatingDOTween : MonoBehaviour
{
    [SerializeField] Image[] stars;
    [SerializeField] Color emptyColor = new Color(1, 1, 1, 0.2f);
    [SerializeField] Color fillColor = Color.yellow;
    public int rating = 5;

    void OnEnable() => Play();

    public void Play()
    {
        var seq = DOTween.Sequence();
        for (int i = 0; i < stars.Length; i++)
        {
            stars[i].color = emptyColor;
            stars[i].transform.localScale = Vector3.one;
        }
        for (int i = 0; i < rating && i < stars.Length; i++)
        {
            var star = stars[i];
            seq.Insert(i * 0.16f, star.transform.DOScale(1f, 0.42f).SetEase(Ease.OutBack)
                .From(Vector3.one * 0.2f)
                .OnStart(() => star.color = fillColor));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class StarRatingCoroutine : MonoBehaviour
{
    [SerializeField] Image[] stars;
    [SerializeField] Color emptyColor = new Color(1, 1, 1, 0.2f);
    [SerializeField] Color fillColor = Color.yellow;
    public int rating = 5;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        foreach (var s in stars) { s.color = emptyColor; s.transform.localScale = Vector3.one; }
        for (int i = 0; i < rating && i < stars.Length; i++)
        {
            stars[i].color = fillColor;
            StartCoroutine(Pop(stars[i].transform));
            yield return new WaitForSeconds(0.16f);
        }
    }

    IEnumerator Pop(Transform tr)
    {
        float t = 0f;
        while (t < 0.42f)
        {
            t += Time.deltaTime;
            tr.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.42f));
            yield return null;
        }
        tr.localScale = Vector3.one;
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return Mathf.Lerp(0.2f, 1f, 1f + c3 * u * u * u + c1 * u * u);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.star        { scale: 1; -unity-background-image-tint-color: rgba(255,255,255,0.2); }
.star.filled { -unity-background-image-tint-color: rgb(245,224,3); transition: scale 420ms ease-out-back; }
.star.pop    { scale: 0.2; }   /* .pop を外すと 0.2→1 に弾む */

/* ===== C# (.cs) — 1枚ずつ遅延して点灯 ===== */
using UnityEngine.UIElements;

public class StarRatingUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    public int rating = 5;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var stars = root.Query(className: "star").ToList();
        for (int i = 0; i < rating && i < stars.Count; i++)
        {
            var star = stars[i];
            star.AddToClassList("pop");
            star.schedule.Execute(() =>
            {
                star.AddToClassList("filled");
                star.RemoveFromClassList("pop");   // 0.2→1 へ OutBack
            }).ExecuteLater(i * 160);
        }
    }
}`,
    },
  });

  /* 4. リソース収集 (attention) */
  R({
    id: 'resource-fly',
    title: 'リソース収集',
    titleEn: 'Resource Fly',
    category: 'attention',
    tags: ['ストラテジー', '収集', 'コイン', '加算'],
    description: 'コインやジェムが複数、弧を描いて画面隅のカウンターへ吸い込まれ、着弾のたびにカウンタ数値が跳ねて加算される。資源回収・報酬集約・デイリー受取に。散らす演出とは逆で「集めて数える」動線が要点。source→カウンターへ二次ベジェの弧＋stagger、着弾で数値を punch。',
    spec: {
      coins: { count: 5, path: 'source→カウンターへ二次ベジェ(上に膨らむ弧)', ease: 'InOutQuad', duration: 0.7 },
      stagger: '0.16s 間隔で順に発射',
      arrival: { onEach: 'カウンタ +1、数値ラベルを punch(scale)', punch: 'punchWave' },
      shrink: 'コインは吸い込まれる際に 1→0.6 へ縮小',
    },
    preview(ctx, PV) {
      const stage = ctx.stage;
      // カウンター (右上)
      const counter = PV.el(null, {
        position: 'absolute', right: '12px', top: '12px', display: 'flex', alignItems: 'center', gap: '6px',
        padding: '4px 10px', borderRadius: '20px', background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        color: 'var(--pv-text)', fontSize: '14px', fontWeight: '700',
      });
      const coinIcon = PV.el(null, { width: '14px', height: '14px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #fff, var(--pv-accent) 60%, var(--pv-accent-dim))', boxShadow: '0 0 6px var(--pv-accent)' });
      const num = PV.el(null, { display: 'inline-block', minWidth: '26px', textAlign: 'right', willChange: 'transform', transformOrigin: 'center' }, '0', 'span');
      counter.appendChild(coinIcon); counter.appendChild(num);
      stage.appendChild(counter);
      // ソース (左下)
      const source = PV.el(null, { position: 'absolute', left: '18px', bottom: '16px', width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '1px solid var(--pv-line-strong)' });
      stage.appendChild(source);

      let total = 0;
      const punchNum = () => ctx.tween({ from: 0, to: 1, duration: 0.32, ease: 'Linear', onUpdate: (v, t) => num.style.transform = `scale(${1 + EASE.punchWave(t, 2, 0.5) * 0.4})`, onComplete: () => num.style.transform = 'scale(1)' });
      const flyCoin = delay => {
        const coin = PV.el(null, { position: 'absolute', left: '0', top: '0', width: '16px', height: '16px', marginLeft: '-8px', marginTop: '-8px', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #fff, var(--pv-accent) 60%, var(--pv-accent-dim))', boxShadow: '0 0 8px var(--pv-accent)', willChange: 'transform,opacity', pointerEvents: 'none' });
        stage.appendChild(coin);
        const jx = (Math.random() * 2 - 1) * 16, jy = (Math.random() * 2 - 1) * 10;
        const p0 = { x: 35 + jx, y: 108 + jy }, p1 = { x: 196, y: 22 };
        const c = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 48 };
        ctx.tween({
          from: 0, to: 1, duration: 0.7, delay, ease: 'InOutQuad',
          onUpdate: v => { const u = 1 - v; const x = u * u * p0.x + 2 * u * v * c.x + v * v * p1.x; const y = u * u * p0.y + 2 * u * v * c.y + v * v * p1.y; coin.style.transform = `translate(${x}px,${y}px) scale(${lerp(1, 0.6, v)})`; coin.style.opacity = v > 0.85 ? (1 - v) / 0.15 : 1; },
          onComplete: () => { coin.remove(); total++; num.textContent = total; punchNum(); },
        });
      };
      ctx.forever(async () => {
        total = 0; num.textContent = 0;
        const NC = 5;
        for (let i = 0; i < NC; i++) flyCoin(i * 0.16);
        await ctx.wait(0.16 * NC + 1.0);
        await ctx.wait(0.9);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using TMPro;

// コインが弧を描いてカウンターへ吸い込まれ、着弾で数値を加算+punch
public class ResourceFlyLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] coins;
    [SerializeField] RectTransform source;
    [SerializeField] RectTransform counter;
    [SerializeField] TMP_Text label;
    int total;

    void OnEnable() => Play();

    public void Play()
    {
        total = 0; label.text = "0";
        Vector2 p0 = source.anchoredPosition;
        Vector2 p1 = counter.anchoredPosition;
        Vector2 ctrl = (p0 + p1) * 0.5f + Vector2.up * 120f;   // 上に膨らむ弧

        for (int i = 0; i < coins.Length; i++)
        {
            var coin = coins[i];
            coin.anchoredPosition = p0;
            LMotion.Create(0f, 1f, 0.7f).WithDelay(i * 0.16f).WithEase(Ease.InOutQuad)
                .WithOnComplete(() =>
                {
                    total++;
                    label.text = total.ToString();
                    LMotion.Punch.Create(0.4f, 0f, 0.32f)
                        .Bind(v => label.transform.localScale = Vector3.one * (1f + v));
                })
                .Bind(t =>
                {
                    float u = 1f - t;
                    coin.anchoredPosition = u * u * p0 + 2f * u * t * ctrl + t * t * p1;
                    coin.localScale = Vector3.one * Mathf.Lerp(1f, 0.6f, t);
                });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using TMPro;

public class ResourceFlyDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] coins;
    [SerializeField] RectTransform source, counter;
    [SerializeField] TMP_Text label;
    int total;

    void OnEnable() => Play();

    public void Play()
    {
        total = 0; label.text = "0";
        for (int i = 0; i < coins.Length; i++)
        {
            var coin = coins[i];
            coin.anchoredPosition = source.anchoredPosition;
            // DOJumpAnchorPos で弧を描いて吸い込む
            coin.DOJumpAnchorPos(counter.anchoredPosition, 90f, 1, 0.7f)
                .SetDelay(i * 0.16f).SetEase(Ease.InOutQuad)
                .OnComplete(() =>
                {
                    total++;
                    label.text = total.ToString();
                    label.transform.DOPunchScale(Vector3.one * 0.4f, 0.32f, 6, 0.6f);
                });
            coin.DOScale(0.6f, 0.7f).SetDelay(i * 0.16f);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using TMPro;

public class ResourceFlyCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] coins;
    [SerializeField] RectTransform source, counter;
    [SerializeField] TMP_Text label;
    int total;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        total = 0; label.text = "0";
        Vector2 p0 = source.anchoredPosition, p1 = counter.anchoredPosition;
        Vector2 ctrl = (p0 + p1) * 0.5f + Vector2.up * 120f;
        for (int i = 0; i < coins.Length; i++)
        {
            StartCoroutine(Fly(coins[i], p0, ctrl, p1));
            yield return new WaitForSeconds(0.16f);
        }
    }

    IEnumerator Fly(RectTransform coin, Vector2 p0, Vector2 ctrl, Vector2 p1)
    {
        coin.anchoredPosition = p0;
        float t = 0f;
        while (t < 0.7f)
        {
            t += Time.deltaTime;
            float e = InOutQuad(Mathf.Clamp01(t / 0.7f));
            float u = 1f - e;
            coin.anchoredPosition = u * u * p0 + 2f * u * e * ctrl + e * e * p1;
            coin.localScale = Vector3.one * Mathf.Lerp(1f, 0.6f, e);
            yield return null;
        }
        total++;
        label.text = total.ToString();
        StartCoroutine(Punch(label.transform));
    }

    IEnumerator Punch(Transform tr)
    {
        float t = 0f;
        while (t < 0.32f)
        {
            t += Time.deltaTime;
            float p = t / 0.32f;
            tr.localScale = Vector3.one * (1f + Mathf.Sin(p * Mathf.PI * 4f) * (1f - p) * 0.4f);
            yield return null;
        }
        tr.localScale = Vector3.one;
    }

    static float InOutQuad(float x) => x < 0.5f ? 2f * x * x : 1f - Mathf.Pow(-2f * x + 2f, 2f) / 2f;
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.coin  { position: absolute; }
#Label { transition: scale 120ms ease-out; }

/* ===== C# (.cs) — schedule で弧を描いて移動、着弾で加算 ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class ResourceFlyUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    int total;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var label = root.Q<Label>("Label");
        var coins = root.Query(className: "coin").ToList();
        Vector2 p0 = new Vector2(24, 108), p1 = new Vector2(196, 20);
        Vector2 ctrl = (p0 + p1) * 0.5f + Vector2.down * 60f;   // 上方向へ膨らむ弧

        for (int i = 0; i < coins.Count; i++)
        {
            var coin = coins[i];
            float start = Time.time + i * 0.16f;
            const float dur = 0.7f;
            coin.schedule.Execute(() =>
            {
                float t = Mathf.Clamp01((Time.time - start) / dur);
                float u = 1f - t;
                Vector2 p = u * u * p0 + 2f * u * t * ctrl + t * t * p1;
                coin.style.left = p.x; coin.style.top = p.y;
                coin.style.scale = new Scale(Vector3.one * Mathf.Lerp(1f, 0.6f, t));
                if (t >= 1f)
                {
                    total++;
                    label.text = total.ToString();
                    label.style.scale = new Scale(Vector3.one * 1.4f);
                    label.schedule.Execute(() => label.style.scale = new Scale(Vector3.one)).ExecuteLater(120);
                }
            }).Every(16).Until(() => Time.time >= start + dur);
        }
    }
}`,
    },
  });

  /* 5. 移動範囲ハイライト (widget) */
  R({
    id: 'tile-highlight',
    title: '移動範囲ハイライト',
    titleEn: 'Tile Highlight',
    category: 'widget',
    tags: ['ストラテジー', 'グリッド', '移動範囲', 'SLG'],
    description: 'グリッド上で移動/攻撃可能セルが、ユニット中心から距離順に波紋状へ順次点灯し、以後は常時パルスして選択を促す。カーソル枠が候補マスを巡回する。SLG/タクティカルの範囲表示に。距離ごとの stagger 点灯(OutBack)＋透明度パルス＋カーソル移動で組む。',
    spec: {
      grid: { cols: 7, rows: 5, center: 'ユニット位置', range: 3, metric: 'マンハッタン距離' },
      reveal: { order: '距離の小さい順に波紋点灯', ease: 'OutBack', stagger: '距離+1 ごとに約0.12s' },
      pulse: '点灯後は透明度を 0.55⇔1 で常時パルス',
      cursor: '候補マスを一定間隔で巡回する枠',
    },
    preview(ctx, PV) {
      const COLS = 7, ROWS = 5, GAP = 3, CELL = 20;
      const gw = COLS * CELL + (COLS - 1) * GAP, gh = ROWS * CELL + (ROWS - 1) * GAP;
      const grid = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: gw + 'px', height: gh + 'px', marginLeft: -gw / 2 + 'px', marginTop: -gh / 2 + 'px' });
      ctx.stage.appendChild(grid);
      const cx = 3, cy = 2, RANGE = 3;
      const cells = [];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const d = Math.abs(x - cx) + Math.abs(y - cy);
        const el = PV.el(null, {
          position: 'absolute', left: x * (CELL + GAP) + 'px', top: y * (CELL + GAP) + 'px', width: CELL + 'px', height: CELL + 'px',
          borderRadius: '4px', boxSizing: 'border-box', border: '1px solid var(--pv-line)', background: 'var(--pv-panel2)', willChange: 'opacity,transform',
        });
        grid.appendChild(el);
        cells.push({ el, x, y, d, inRange: d <= RANGE && !(x === cx && y === cy) });
      }
      const unit = cells.find(c => c.x === cx && c.y === cy).el;
      unit.style.background = 'var(--pv-accent)'; unit.style.borderColor = 'var(--pv-accent)';
      // カーソル枠
      const cursor = PV.el(null, { position: 'absolute', left: '0', top: '0', width: CELL + 4 + 'px', height: CELL + 4 + 'px', border: '2px solid var(--pv-text)', borderRadius: '5px', boxSizing: 'border-box', willChange: 'transform,opacity', boxShadow: '0 0 8px var(--pv-accent)', pointerEvents: 'none', opacity: 0 });
      grid.appendChild(cursor);

      const ranged = cells.filter(c => c.inRange).sort((a, b) => a.d - b.d);
      const setLit = (c, on) => { c.el.style.background = on ? 'var(--pv-accent-dim)' : 'var(--pv-panel2)'; c.el.style.borderColor = on ? 'var(--pv-accent)' : 'var(--pv-line)'; };
      const moveCursor = c => cursor.style.transform = `translate(${c.x * (CELL + GAP) - 2}px, ${c.y * (CELL + GAP) - 2}px)`;

      ctx.forever(async () => {
        ranged.forEach(c => { setLit(c, false); c.el.style.opacity = 1; c.el.style.transform = 'scale(1)'; });
        cursor.style.opacity = 0;
        await ctx.wait(0.3);
        // 距離順に点灯 (波紋)
        let curD = -1;
        for (const c of ranged) {
          if (!ctx.alive) return;
          setLit(c, true);
          ctx.tween({ from: 0, to: 1, duration: 0.32, ease: 'OutBack', onUpdate: v => c.el.style.transform = `scale(${lerp(0.6, 1, v)})` });
          if (c.d !== curD) { curD = c.d; await ctx.wait(0.12); } else await ctx.wait(0.03);
        }
        // 常時パルス + カーソル巡回 (有限tweenで統合、無限tweenを積まない)
        cursor.style.opacity = 1;
        const steps = ranged.length;
        await ctx.tween({
          from: 0, to: steps, duration: steps * 0.24, ease: 'Linear',
          onUpdate: (v, t) => {
            const idx = Math.min(Math.floor(v), steps - 1);
            moveCursor(ranged[idx]);
            const pulse = (Math.sin(t * Math.PI * 6) + 1) / 2;
            ranged.forEach(c => c.el.style.opacity = lerp(0.55, 1, pulse));
          },
        });
        ranged.forEach(c => c.el.style.opacity = 1);
        await ctx.wait(0.25);
      });
    },
    code: {
      litmotion: `
using System;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// 中心から距離順にセルを点灯(波紋) → 常時パルス
public class TileHighlightLitMotion : MonoBehaviour
{
    [Serializable] public struct Cell { public Image image; public int distance; }  // distance=マンハッタン距離
    [SerializeField] Cell[] cells;
    [SerializeField] Color litColor = new Color(0.5f, 0.4f, 1f, 0.6f);

    void OnEnable() => Play();

    public void Play()
    {
        foreach (var c in cells)
        {
            float delay = c.distance * 0.12f;
            var img = c.image;
            img.transform.localScale = Vector3.one * 0.6f;
            LMotion.Create(0.6f, 1f, 0.32f).WithDelay(delay).WithEase(Ease.OutBack)
                .Bind(v => { img.color = litColor; img.transform.localScale = Vector3.one * v; });
            // 常時パルス
            LMotion.Create(0.55f, 1f, 1.1f).WithDelay(delay + 0.32f)
                .WithEase(Ease.InOutSine).WithLoops(-1, LoopType.Yoyo)
                .Bind(a => { var col = litColor; col.a = a; img.color = col; });
        }
    }
}`,
      dotween: `
using System;
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class TileHighlightDOTween : MonoBehaviour
{
    [Serializable] public struct Cell { public Image image; public int distance; }
    [SerializeField] Cell[] cells;
    [SerializeField] Color litColor = new Color(0.5f, 0.4f, 1f, 0.6f);

    void OnEnable() => Play();

    public void Play()
    {
        foreach (var c in cells)
        {
            float delay = c.distance * 0.12f;
            var img = c.image;
            img.transform.localScale = Vector3.one * 0.6f;
            DOTween.Sequence().SetDelay(delay)
                .Append(img.transform.DOScale(1f, 0.32f).SetEase(Ease.OutBack)
                    .OnStart(() => img.color = litColor))
                .Append(img.DOFade(1f, 1.1f).SetEase(Ease.InOutSine).SetLoops(-1, LoopType.Yoyo));
        }
    }
}`,
      coroutine: `
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class TileHighlightCoroutine : MonoBehaviour
{
    [Serializable] public struct Cell { public Image image; public int distance; }
    [SerializeField] Cell[] cells;
    [SerializeField] Color litColor = new Color(0.5f, 0.4f, 1f, 0.6f);

    void OnEnable() { foreach (var c in cells) StartCoroutine(Run(c)); }

    IEnumerator Run(Cell c)
    {
        c.image.transform.localScale = Vector3.one * 0.6f;
        yield return new WaitForSeconds(c.distance * 0.12f);
        c.image.color = litColor;
        float t = 0f;
        while (t < 0.32f) { t += Time.deltaTime; c.image.transform.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.32f)); yield return null; }
        c.image.transform.localScale = Vector3.one;
        // 常時パルス
        while (true)
        {
            float p = (Mathf.Sin(Time.time * Mathf.PI / 1.1f) + 1f) * 0.5f;
            var col = litColor; col.a = Mathf.Lerp(0.55f, 1f, p);
            c.image.color = col;
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f;
        float u = x - 1f;
        return Mathf.Lerp(0.6f, 1f, 1f + c3 * u * u * u + c1 * u * u);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.tile     { background-color: rgba(255,255,255,0.05); scale: 0.6; transition: scale 320ms ease-out-back; }
.tile.lit { background-color: rgba(124,91,214,0.55); scale: 1; }

/* ===== C# (.cs) — 距離順に遅延点灯 + 透明度パルス ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class TileHighlightUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var tiles = root.Query(className: "tile").ToList();
        foreach (var tile in tiles)
        {
            int dist = int.Parse(tile.name.Substring(1));   // 例 "d2" → 距離2
            tile.schedule.Execute(() => tile.AddToClassList("lit")).ExecuteLater(dist * 120);
        }
        // 常時パルス (点灯セルの透明度を揺らす)
        root.schedule.Execute(() =>
        {
            float a = (Mathf.Sin(Time.time * Mathf.PI / 1.1f) + 1f) * 0.5f;
            foreach (var tile in tiles.FindAll(t => t.ClassListContains("lit")))
                tile.style.opacity = Mathf.Lerp(0.55f, 1f, a);
        }).Every(16);
    }
}`,
    },
  });

  /* 6. クールダウン (loading) */
  R({
    id: 'cooldown-sweep',
    title: 'クールダウン',
    titleEn: 'Cooldown Sweep',
    category: 'loading',
    tags: ['ストラテジー', 'スキル', 'CT', 'クールダウン'],
    description: 'スキルアイコンに扇形の暗幕が時計回りに減っていき、空になった瞬間 READY の発光フラッシュ＋軽い弾みで使用可能を知らせる。バトル/RTS のスキルCT表示に。満ちる円形プログレスと逆で「減って→READY閃光」が要点。Unity実機では Image type=Filled(Radial360) で fillAmount を 1→0 が定番。',
    spec: {
      veil: { target: '扇形暗幕 fillAmount', from: 1, to: 0, ease: 'Linear', duration: 2.0, dir: '時計回りに減る', impl: 'Image Filled / Radial360' },
      ready: { flash: 'アクセント色を 0.85→0 でフェード', punch: 'アイコンを軽く弾ませる', label: 'READY を OutBack で表示' },
      recharge: 'READY 表示後 少し待って再チャージ (ループ)',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const SZ = 72;
      const icon = PV.el(null, {
        position: 'absolute', left: -SZ / 2 + 'px', top: -SZ / 2 + 'px', width: SZ + 'px', height: SZ + 'px',
        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
        background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '2px solid var(--pv-accent)',
        color: 'var(--pv-accent)', willChange: 'transform', overflow: 'hidden',
      }, '✦');
      center.appendChild(icon);
      // 扇形の暗幕 (conic-gradient)
      const veil = PV.el(null, {
        position: 'absolute', left: -SZ / 2 + 'px', top: -SZ / 2 + 'px', width: SZ + 'px', height: SZ + 'px',
        borderRadius: '12px', pointerEvents: 'none', willChange: 'background',
      });
      center.appendChild(veil);
      // フラッシュ
      const flash = PV.el(null, {
        position: 'absolute', left: -SZ / 2 + 'px', top: -SZ / 2 + 'px', width: SZ + 'px', height: SZ + 'px',
        borderRadius: '12px', background: 'var(--pv-accent)', opacity: 0, pointerEvents: 'none', willChange: 'opacity',
      });
      center.appendChild(flash);
      // READY ラベル
      const ready = PV.el(null, {
        position: 'absolute', left: '50%', top: -SZ / 2 - 22 + 'px', transform: 'translate(-50%,0) scale(0.6)', opacity: 0,
        padding: '2px 8px', borderRadius: '10px', background: 'var(--pv-accent)', color: 'var(--pv-on-accent)',
        fontSize: '11px', fontWeight: '800', letterSpacing: '1px', willChange: 'transform,opacity', whiteSpace: 'nowrap',
      }, 'READY');
      center.appendChild(ready);

      const setVeil = deg => { veil.style.background = deg <= 0.5 ? 'none' : `conic-gradient(rgba(0,0,0,0.6) ${deg}deg, transparent ${deg}deg)`; };

      ctx.forever(async () => {
        ready.style.opacity = 0; ready.style.transform = 'translate(-50%,0) scale(0.6)';
        flash.style.opacity = 0; icon.style.transform = 'scale(1)';
        setVeil(360);
        await ctx.wait(0.3);
        // CT 消化 (時計回りに減る)
        await ctx.tween({ from: 360, to: 0, duration: 2.0, ease: 'Linear', onUpdate: v => setVeil(v) });
        // READY 閃光 + 弾み + ラベル
        ctx.tween({ from: 0, to: 1, duration: 0.4, ease: 'OutQuad', onUpdate: (v, t) => flash.style.opacity = (1 - t) * 0.85 });
        ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutBack', onUpdate: (v, t) => { icon.style.transform = `scale(${1 + EASE.punchWave(t, 2, 0.6) * 0.12})`; ready.style.opacity = Math.min(t * 3, 1); ready.style.transform = `translate(-50%,${lerp(6, 0, v)}px) scale(${lerp(0.6, 1, v)})`; }, onComplete: () => icon.style.transform = 'scale(1)' });
        await ctx.wait(1.5);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: v => ready.style.opacity = v });
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// 扇形フィルが 1→0 に減り、0で READY 閃光 + 弾み
public class CooldownSweepLitMotion : MonoBehaviour
{
    [SerializeField] Image veil;        // Type=Filled, Fill Method=Radial360, 時計回り
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup ready;
    [SerializeField] Image flash;
    [SerializeField] float cooldown = 2f;

    void OnEnable() => Play();

    public void Play()
    {
        veil.fillAmount = 1f;
        ready.alpha = 0f;
        SetFlash(0f);

        LMotion.Create(1f, 0f, cooldown).WithEase(Ease.Linear)
            .WithOnComplete(OnReady)
            .Bind(v => veil.fillAmount = v);
    }

    void OnReady()
    {
        // 閃光
        LMotion.Create(0.85f, 0f, 0.4f).WithEase(Ease.OutQuad).Bind(SetFlash);
        // 弾み
        LMotion.Punch.Create(0.12f, 0f, 0.5f).Bind(v => icon.localScale = Vector3.one * (1f + v));
        // READY 表示
        LMotion.Create(0f, 1f, 0.3f).WithEase(Ease.OutBack).BindToAlpha(ready);
    }

    void SetFlash(float a) { var c = flash.color; c.a = a; flash.color = c; }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class CooldownSweepDOTween : MonoBehaviour
{
    [SerializeField] Image veil;        // Filled / Radial360
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup ready;
    [SerializeField] Image flash;
    [SerializeField] float cooldown = 2f;

    void OnEnable() => Play();

    public void Play()
    {
        veil.fillAmount = 1f; ready.alpha = 0f;
        var fc = flash.color; fc.a = 0f; flash.color = fc;

        veil.DOFillAmount(0f, cooldown).SetEase(Ease.Linear).OnComplete(() =>
        {
            flash.DOFade(0f, 0.4f).From(0.85f).SetEase(Ease.OutQuad);
            icon.DOPunchScale(Vector3.one * 0.12f, 0.5f, 6, 0.6f);
            ready.DOFade(1f, 0.3f).SetEase(Ease.OutBack);
        });
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class CooldownSweepCoroutine : MonoBehaviour
{
    [SerializeField] Image veil;        // Filled / Radial360
    [SerializeField] RectTransform icon;
    [SerializeField] CanvasGroup ready;
    [SerializeField] Image flash;
    [SerializeField] float cooldown = 2f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        veil.fillAmount = 1f; ready.alpha = 0f; SetFlash(0f);
        float t = 0f;
        while (t < cooldown)
        {
            t += Time.deltaTime;
            veil.fillAmount = Mathf.Clamp01(1f - t / cooldown);
            yield return null;
        }
        veil.fillAmount = 0f;
        yield return Ready();
    }

    IEnumerator Ready()
    {
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            SetFlash(Mathf.Lerp(0.85f, 0f, Mathf.Clamp01(t / 0.4f)));
            icon.localScale = Vector3.one * (1f + Mathf.Sin(t * Mathf.PI * 4f) * (1f - t / 0.5f) * 0.12f);
            ready.alpha = Mathf.Clamp01(t / 0.3f);
            yield return null;
        }
        icon.localScale = Vector3.one;
    }

    void SetFlash(float a) { var c = flash.color; c.a = a; flash.color = c; }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
#Ready      { opacity: 0; scale: 0.6; }
#Ready.show { opacity: 1; scale: 1; transition: opacity 300ms, scale 300ms ease-out-back; }
#Flash      { opacity: 0.85; }
#Flash.hit  { opacity: 0; transition: opacity 400ms ease-out; }   /* 付与で 0.85→0 の閃光 */

/* ===== C# (.cs) — Painter2D で扇形を描き、schedule で角度を減らす ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class CooldownSweepUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float cooldown = 2f;
    float remaining;
    VisualElement veil, icon, ready, flash;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        veil = root.Q("Veil");
        icon = root.Q("Icon");
        ready = root.Q("Ready");
        flash = root.Q("Flash");
        remaining = cooldown;

        veil.generateVisualContent += OnGenerate;
        veil.schedule.Execute(() =>
        {
            remaining -= 1f / 60f;
            if (remaining <= 0f) { remaining = 0f; OnReady(); }
            veil.MarkDirtyRepaint();       // 角度を反映
        }).Every(16).Until(() => remaining <= 0f);
    }

    void OnGenerate(MeshGenerationContext mgc)
    {
        float r = veil.contentRect.width * 0.5f;
        Vector2 c = veil.contentRect.center;
        float t = Mathf.Clamp01(remaining / cooldown);
        var start = new Angle(-90f, AngleUnit.Degree);
        var end = new Angle(-90f + 360f * t, AngleUnit.Degree);   // 時計回りに減る暗幕
        var p = mgc.painter2D;
        p.fillColor = new Color(0f, 0f, 0f, 0.6f);
        p.BeginPath();
        p.MoveTo(c);
        p.Arc(c, r, start, end);
        p.LineTo(c);
        p.Fill();
    }

    void OnReady()
    {
        veil.MarkDirtyRepaint();
        ready.AddToClassList("show");
        flash.AddToClassList("hit");
        icon.style.scale = new Scale(Vector3.one * 1.12f);
        icon.schedule.Execute(() => icon.style.scale = new Scale(Vector3.one)).ExecuteLater(200);
    }
}`,
    },
  });

  /* 7. バッジ増減 (attention) */
  R({
    id: 'stat-badge',
    title: 'バッジ増減',
    titleEn: 'Stat Badge',
    category: 'attention',
    tags: ['シミュ', 'バッジ', '通知', '数値'],
    description: 'アイコン右上の通知バッジが、増加時に scale-in(OutBack)＋数値 punch で注意を引き、0 になると scale-out で静かに消える。未読件数・所持数・通知数の表示に。0→1 は出現アニメ、1以上での加算は punch、0 化は退場、と状態で演出を出し分けるのがコツ。',
    spec: {
      appear: { target: 'バッジ localScale', from: 0, to: 1, ease: 'OutBack', duration: 0.4, when: '0→1 の出現時' },
      increment: { target: '数値 punch(scale)', ease: 'punchWave', when: '1以上での加算時' },
      disappear: { target: 'バッジ localScale', from: 1, to: 0, ease: 'InBack', duration: 0.28, when: '0 化した時' },
      color: 'バッジ地は危険色(赤)、増減の演出は共通',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      const SZ = 58;
      const icon = PV.el(null, {
        position: 'absolute', left: -SZ / 2 + 'px', top: -SZ / 2 + 'px', width: SZ + 'px', height: SZ + 'px',
        borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px',
        background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '2px solid var(--pv-line-strong)',
        color: 'var(--pv-text)',
      }, '✉');
      center.appendChild(icon);
      const badge = PV.el(null, {
        position: 'absolute', left: SZ / 2 - 14 + 'px', top: -SZ / 2 - 8 + 'px', minWidth: '22px', height: '22px', padding: '0 5px',
        boxSizing: 'border-box', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#e0556b', color: '#fff', fontSize: '12px', fontWeight: '800', lineHeight: '1',
        border: '2px solid var(--pv-bg)', willChange: 'transform,opacity', transform: 'scale(0)', opacity: 0,
      }, '0');
      center.appendChild(badge);

      let val = 0;
      const punchBadge = () => ctx.tween({ from: 0, to: 1, duration: 0.34, ease: 'Linear', onUpdate: (v, t) => badge.style.transform = `scale(${1 + EASE.punchWave(t, 2, 0.5) * 0.4})`, onComplete: () => badge.style.transform = 'scale(1)' });
      const showBadge = () => ctx.tween({ from: 0, to: 1, duration: 0.4, ease: 'OutBack', onUpdate: v => { badge.style.transform = `scale(${v})`; badge.style.opacity = Math.min(v * 2, 1); } });
      const hideBadge = () => ctx.tween({ from: 1, to: 0, duration: 0.28, ease: 'InBack', onUpdate: v => { badge.style.transform = `scale(${Math.max(v, 0)})`; badge.style.opacity = v; } });

      ctx.forever(async () => {
        val = 0; badge.textContent = '0'; badge.style.transform = 'scale(0)'; badge.style.opacity = 0;
        await ctx.wait(0.5);
        // 出現 (+1)
        val = 1; badge.textContent = val;
        await showBadge();
        await ctx.wait(0.9);
        // 加算を数回 (punch)
        for (let k = 0; k < 3; k++) {
          if (!ctx.alive) return;
          val += 1 + Math.floor(Math.random() * 2); badge.textContent = val; punchBadge();
          await ctx.wait(0.8);
        }
        await ctx.wait(0.6);
        // 0 になって消滅
        val = 0; badge.textContent = '0';
        await hideBadge();
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using TMPro;

// 増加: 0→1で scale-in(OutBack)、1以上は数値punch、0で scale-out
public class StatBadgeLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform badge;
    [SerializeField] CanvasGroup badgeGroup;
    [SerializeField] TMP_Text label;
    int value;

    void OnEnable() { value = 0; badge.localScale = Vector3.zero; badgeGroup.alpha = 0f; }

    public void Add(int amount)
    {
        bool wasZero = value == 0;
        value += amount;
        label.text = value.ToString();

        if (wasZero)
        {
            badgeGroup.alpha = 1f;
            LMotion.Create(0f, 1f, 0.4f).WithEase(Ease.OutBack).Bind(v => badge.localScale = Vector3.one * v);
        }
        else
        {
            LMotion.Punch.Create(0.4f, 0f, 0.34f).Bind(v => badge.localScale = Vector3.one * (1f + v));
        }
    }

    public void Clear()
    {
        value = 0;
        LMotion.Create(1f, 0f, 0.28f).WithEase(Ease.InBack)
            .WithOnComplete(() => badgeGroup.alpha = 0f)
            .Bind(v => badge.localScale = Vector3.one * Mathf.Max(v, 0f));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using TMPro;

public class StatBadgeDOTween : MonoBehaviour
{
    [SerializeField] RectTransform badge;
    [SerializeField] CanvasGroup badgeGroup;
    [SerializeField] TMP_Text label;
    int value;

    void OnEnable() { value = 0; badge.localScale = Vector3.zero; badgeGroup.alpha = 0f; }

    public void Add(int amount)
    {
        bool wasZero = value == 0;
        value += amount; label.text = value.ToString();
        if (wasZero)
        {
            badgeGroup.alpha = 1f;
            badge.DOScale(1f, 0.4f).From(0f).SetEase(Ease.OutBack);
        }
        else
        {
            badge.DOPunchScale(Vector3.one * 0.4f, 0.34f, 6, 0.6f);
        }
    }

    public void Clear()
    {
        value = 0;
        badge.DOScale(0f, 0.28f).SetEase(Ease.InBack).OnComplete(() => badgeGroup.alpha = 0f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using TMPro;

public class StatBadgeCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform badge;
    [SerializeField] CanvasGroup badgeGroup;
    [SerializeField] TMP_Text label;
    int value;

    void OnEnable() { value = 0; badge.localScale = Vector3.zero; badgeGroup.alpha = 0f; }

    public void Add(int amount)
    {
        bool wasZero = value == 0;
        value += amount; label.text = value.ToString();
        StopAllCoroutines();
        StartCoroutine(wasZero ? ScaleIn() : Punch());
    }

    public void Clear() { value = 0; StopAllCoroutines(); StartCoroutine(ScaleOut()); }

    IEnumerator ScaleIn()
    {
        badgeGroup.alpha = 1f;
        float t = 0f;
        while (t < 0.4f) { t += Time.deltaTime; badge.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / 0.4f)); yield return null; }
        badge.localScale = Vector3.one;
    }

    IEnumerator Punch()
    {
        float t = 0f;
        while (t < 0.34f) { t += Time.deltaTime; float p = t / 0.34f; badge.localScale = Vector3.one * (1f + Mathf.Sin(p * Mathf.PI * 4f) * (1f - p) * 0.4f); yield return null; }
        badge.localScale = Vector3.one;
    }

    IEnumerator ScaleOut()
    {
        float t = 0f;
        while (t < 0.28f) { t += Time.deltaTime; badge.localScale = Vector3.one * (1f - Mathf.Clamp01(t / 0.28f)); yield return null; }
        badge.localScale = Vector3.zero; badgeGroup.alpha = 0f;
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
#Badge       { scale: 0; opacity: 0; }
#Badge.show  { scale: 1; opacity: 1; transition: scale 400ms ease-out-back, opacity 150ms; }
#Badge.hide  { scale: 0; opacity: 0; transition: scale 280ms ease-in, opacity 200ms; }
#Badge.punch { scale: 1.35; transition: scale 90ms ease-out; }

/* ===== C# (.cs) — 増減でクラス切替、punch は付け外し ===== */
using UnityEngine.UIElements;

public class StatBadgeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    Label badge;
    int value;

    void OnEnable()
    {
        badge = document.rootVisualElement.Q<Label>("Badge");
    }

    public void Add(int amount)
    {
        bool wasZero = value == 0;
        value += amount; badge.text = value.ToString();
        badge.RemoveFromClassList("hide");
        if (wasZero) badge.AddToClassList("show");
        else
        {
            badge.AddToClassList("punch");
            badge.schedule.Execute(() => badge.RemoveFromClassList("punch")).ExecuteLater(90);
        }
    }

    public void Clear()
    {
        value = 0;
        badge.RemoveFromClassList("show");
        badge.AddToClassList("hide");
    }
}`,
    },
  });
})();
