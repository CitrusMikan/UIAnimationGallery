/* 19-hud.js — SF/HUD・ホログラフィック系の汎用UIモーション (6種)
 *   holo-materialize / scan-reveal / system-boot / reticle-lock / glitch-in / hud-frame
 * 配属: entrance / transition / loading / attention / entrance / widget。各種にUI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. ホロ・マテリアライズ (entrance) */
  R({
    id: 'holo-materialize',
    title: 'ホロ・マテリアライズ',
    titleEn: 'Holographic Materialize',
    category: 'entrance',
    tags: ['hologram', 'scanline', 'flicker', 'sci-fi'],
    description: '半透明のホロパネルが、走査線を伴いながら下から上へ「投影されて実体化」する SF/VR 調の登場。情報パネル/メニューを未来的に出したいときに。下端から上へ clip で領域を開きつつ、開いていく境界に発光ラインを走らせ、確定直前に軽く不透明度フリッカを入れると投影感が出る。単なるフェード/スライドと違い「走査 + ちらつき + 半透明」が要点。実機は uGUI なら走査線テクスチャ + マスク、UI Toolkit は overflow マスクと schedule のフリッカで近似する。',
    spec: {
      target: '半透明のホロパネル(情報/メニュー)',
      reveal: { clip: '下端→上端に開く(inset)', duration: 0.6, ease: 'OutCubic' },
      buildLine: '開く境界に発光ラインを走らせる',
      flicker: '確定直前に不透明度を数回ちらつかせる',
      scanline: '常時うっすら走査線を重ねる(screen)',
      note: 'fade/slide とは別。走査 + フリッカ + 半透明の投影感が要点。実機は走査線テクスチャ + マスク',
    },
    preview(ctx, PV) {
      const panel = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '158px', height: '94px',
        marginLeft: '-79px', marginTop: '-47px', boxSizing: 'border-box', padding: '13px 15px',
        background: 'color-mix(in srgb, var(--pv-accent) 12%, transparent)',
        border: '1px solid var(--pv-accent)',
        display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center',
        overflow: 'hidden', willChange: 'clip-path,opacity',
        boxShadow: '0 0 12px color-mix(in srgb, var(--pv-accent) 30%, transparent)',
      });
      const bar = PV.el(null, { width: '58%', height: '10px', background: 'var(--pv-accent)' });
      const l1 = PV.el(null, { width: '100%', height: '6px', background: 'var(--pv-line-strong)' });
      const l2 = PV.el(null, { width: '74%', height: '6px', background: 'var(--pv-line)' });
      panel.appendChild(bar); panel.appendChild(l1); panel.appendChild(l2);
      // 走査線オーバーレイ(常時)
      const scan = PV.el(null, {
        position: 'absolute', inset: '0', pointerEvents: 'none', mixBlendMode: 'screen', opacity: '0.5',
        background: 'repeating-linear-gradient(0deg, transparent 0 3px, color-mix(in srgb, var(--pv-accent) 30%, transparent) 3px 4px)',
      });
      panel.appendChild(scan);
      // 開いていく境界の発光ライン
      const build = PV.el(null, {
        position: 'absolute', left: '0', right: '0', height: '2px', top: '100%',
        background: 'var(--pv-accent)', boxShadow: '0 0 10px var(--pv-accent)', opacity: '0', pointerEvents: 'none',
      });
      panel.appendChild(build);
      ctx.stage.appendChild(panel);

      ctx.forever(async () => {
        panel.style.clipPath = 'inset(100% 0 0 0)'; panel.style.opacity = '0'; build.style.opacity = '0';
        await ctx.wait(0.45);
        await ctx.tween({
          from: 0, to: 1, duration: 0.6, ease: 'OutCubic',
          onUpdate: (v) => {
            panel.style.clipPath = `inset(${(1 - v) * 100}% 0 0 0)`;
            build.style.top = `${(1 - v) * 100}%`;
            build.style.opacity = v >= 1 ? '0' : '0.9';
            const fl = v < 0.9 ? (0.6 + 0.4 * Math.abs(Math.sin(v * 42))) : 1;
            panel.style.opacity = String(Math.min(1, v * 1.4) * fl);
          },
        });
        build.style.opacity = '0';
        // 確定直前フリッカ
        await ctx.tween({ from: 0, to: 1, duration: 0.2, onUpdate: (v) => { panel.style.opacity = String(0.65 + 0.35 * Math.abs(Math.sin(v * 22))); } });
        panel.style.opacity = '1';
        await ctx.wait(1.5);
        await ctx.tween({ from: 1, to: 0, duration: 0.28, ease: 'InCubic', onUpdate: (v) => { panel.style.clipPath = `inset(${(1 - v) * 100}% 0 0 0)`; panel.style.opacity = String(v); } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// ホロパネルの実体化。下端→上端に開くマスク + 発光ライン + 確定前フリッカ
[RequireComponent(typeof(CanvasGroup))]
public class HoloMaterializeLitMotion : MonoBehaviour
{
    [SerializeField] RectMask2D mask;      // パネルを覆う縦マスク(padding.bottom を減らして開く)
    [SerializeField] RectTransform buildLine; // 開く境界の発光ライン
    [SerializeField] float height = 94f;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        // マスクの下パディングを全高→0にして下から開く
        LMotion.Create(height, 0f, 0.6f).WithEase(Ease.OutCubic).Bind(p =>
        {
            var pad = mask.padding; pad.y = p; mask.padding = pad;                 // 上側padding=下から開く
            buildLine.anchoredPosition = new Vector2(0f, -height * 0.5f + p);
        });
        LMotion.Create(0f, 1f, 0.6f).WithEase(Ease.OutCubic).BindToAlpha(group);
        // 確定前のフリッカ
        LMotion.Create(0.6f, 1f, 0.2f).WithEase(Ease.Linear).WithDelay(0.6f).WithLoops(4, LoopType.Yoyo)
            .Bind(a => group.alpha = a);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(CanvasGroup))]
public class HoloMaterializeDOTween : MonoBehaviour
{
    [SerializeField] RectMask2D mask;
    [SerializeField] RectTransform buildLine;
    [SerializeField] float height = 94f;
    CanvasGroup group;

    void Awake() => group = GetComponent<CanvasGroup>();
    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        DOTween.To(() => height, p =>
        {
            var pad = mask.padding; pad.y = p; mask.padding = pad;
            buildLine.anchoredPosition = new Vector2(0f, -height * 0.5f + p);
        }, 0f, 0.6f).SetEase(Ease.OutCubic);
        group.DOFade(1f, 0.6f).SetEase(Ease.OutCubic)
            .OnComplete(() => group.DOFade(0.6f, 0.1f).SetLoops(4, LoopType.Yoyo));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(CanvasGroup))]
public class HoloMaterializeCoroutine : MonoBehaviour
{
    [SerializeField] RectMask2D mask;
    [SerializeField] RectTransform buildLine;
    [SerializeField] float height = 94f;
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
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.6f), 3f); // OutCubic
            float p = Mathf.Lerp(height, 0f, e);
            var pad = mask.padding; pad.y = p; mask.padding = pad;
            buildLine.anchoredPosition = new Vector2(0f, -height * 0.5f + p);
            group.alpha = e < 0.9f ? e * (0.6f + 0.4f * Mathf.Abs(Mathf.Sin(e * 42f))) : 1f;
            yield return null;
        }
        // 確定前フリッカ
        for (int i = 0; i < 4; i++) { group.alpha = i % 2 == 0 ? 0.6f : 1f; yield return new WaitForSeconds(0.05f); }
        group.alpha = 1f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 下から開くマスクは overflow:hidden の親 + 子の translate/height で近似。
 * 走査線は繰り返しグラデ背景、フリッカは schedule で opacity を数回振る。 */
#HoloPanel {
    overflow: hidden;
    background-color: rgba(80, 200, 230, 0.12);
    border-width: 1px;
    border-color: rgb(80, 200, 230);
    opacity: 0;
    height: 0;
    transition: height 600ms ease-out, opacity 600ms ease-out;
}
#HoloPanel.shown { opacity: 1; height: 94px; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HoloMaterializeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var panel = document.rootVisualElement.Q<VisualElement>("HoloPanel");
        panel.schedule.Execute(() => panel.AddToClassList("shown")).ExecuteLater(16);
        // 確定前フリッカ(4回)
        int n = 0;
        panel.schedule.Execute(() => { panel.style.opacity = (n++ % 2 == 0) ? 0.6f : 1f; })
            .Every(50).StartingIn(600).Until(() => n >= 4);
    }
}`,
    },
  });

  /* 2. スキャンリビール (transition) */
  R({
    id: 'scan-reveal',
    title: 'スキャンリビール',
    titleEn: 'Scan Reveal',
    category: 'transition',
    tags: ['scan', 'decode', 'sci-fi', 'reveal'],
    description: '明るいスキャンバーが上から下へ通過し、通り過ぎた後に UI が「解読・出力」されて現れる SF 調のリビール。画面/パネルの読み込み完了や情報の出現に。スキャンバーの位置に同期して背後のコンテンツを clip で開き、バー境界にわずかなノイズ/ずれを添えると解読感が出る。単純な clip-reveal と違い「走るスキャンバー + 境界ノイズ」が要点。',
    spec: {
      target: 'パネル/画面内の UI コンテンツ',
      bar: { move: '上端→下端', duration: 0.9, ease: 'InOutSine', glow: '発光ライン' },
      content: 'バー位置に同期して clip で上から開く',
      noise: 'バー境界に微小なずれ/ちらつき',
      note: 'clip-reveal とは別。走査バー同期 + 境界ノイズで解読感を出す。実機は sprite マスク + 発光ライン',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: '176px', height: '108px',
        marginLeft: '-88px', marginTop: '-54px', overflow: 'hidden',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
      });
      ctx.stage.appendChild(wrap);
      // 解読されるコンテンツ
      const content = PV.el(null, { position: 'absolute', inset: '0', padding: '12px', boxSizing: 'border-box', display: 'flex', gap: '10px', alignItems: 'center' });
      const icon = PV.el(null, { width: '46px', height: '46px', flex: '0 0 auto', background: 'color-mix(in srgb, var(--pv-accent) 22%, transparent)', border: '2px solid var(--pv-accent)' });
      const col = PV.el(null, { display: 'flex', flexDirection: 'column', gap: '7px', flex: '1 1 auto' });
      col.appendChild(PV.el(null, { width: '80%', height: '9px', background: 'var(--pv-accent)' }));
      col.appendChild(PV.el(null, { width: '100%', height: '6px', background: 'var(--pv-line-strong)' }));
      col.appendChild(PV.el(null, { width: '64%', height: '6px', background: 'var(--pv-line)' }));
      content.appendChild(icon); content.appendChild(col);
      wrap.appendChild(content);
      // スキャンバー
      const bar = PV.el(null, {
        position: 'absolute', left: '0', right: '0', top: '0', height: '3px',
        background: 'var(--pv-accent)', boxShadow: '0 0 12px 2px var(--pv-accent)', opacity: '0', pointerEvents: 'none',
      });
      wrap.appendChild(bar);

      ctx.forever(async () => {
        content.style.clipPath = 'inset(0 0 100% 0)'; bar.style.opacity = '0';
        await ctx.wait(0.4);
        bar.style.opacity = '1';
        await ctx.tween({
          from: 0, to: 1, duration: 0.9, ease: 'InOutSine',
          onUpdate: (v) => {
            const y = v * 108;
            bar.style.top = `${y - 1.5}px`;
            // 境界に微小ノイズ
            const n = (Math.random() * 2 - 1) * 2 * (1 - v);
            content.style.clipPath = `inset(0 0 ${(1 - v) * 100}% 0)`;
            bar.style.transform = `translateX(${n}px)`;
          },
        });
        bar.style.opacity = '0'; content.style.clipPath = 'inset(0 0 0 0)';
        await ctx.wait(1.5);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InCubic', onUpdate: (v) => { content.style.opacity = String(v); } });
        content.style.opacity = '1';
        await ctx.wait(0.35);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// スキャンバーを上→下へ動かし、その位置に同期してコンテンツのマスクを開く
public class ScanRevealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform scanBar;
    [SerializeField] RectMask2D contentMask; // コンテンツを覆うマスク(下padを減らして上から開く)
    [SerializeField] float height = 108f;

    void OnEnable() => Play();

    public void Play()
    {
        LMotion.Create(0f, 1f, 0.9f).WithEase(Ease.InOutSine).Bind(v =>
        {
            float y = -height * 0.5f + v * height;
            scanBar.anchoredPosition = new Vector2(0f, -y);
            var pad = contentMask.padding; pad.w = (1f - v) * height; contentMask.padding = pad; // 下padを減らす
        });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class ScanRevealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform scanBar;
    [SerializeField] RectMask2D contentMask;
    [SerializeField] float height = 108f;

    void OnEnable() => Play();

    public void Play()
    {
        DOTween.To(() => 0f, v =>
        {
            scanBar.anchoredPosition = new Vector2(0f, height * 0.5f - v * height);
            var pad = contentMask.padding; pad.w = (1f - v) * height; contentMask.padding = pad;
        }, 1f, 0.9f).SetEase(Ease.InOutSine);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class ScanRevealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform scanBar;
    [SerializeField] RectMask2D contentMask;
    [SerializeField] float height = 108f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        float t = 0f;
        while (t < 0.9f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.9f);
            float e = -(Mathf.Cos(Mathf.PI * p) - 1f) * 0.5f; // InOutSine
            scanBar.anchoredPosition = new Vector2(0f, height * 0.5f - e * height);
            var pad = contentMask.padding; pad.w = (1f - e) * height; contentMask.padding = pad;
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * スキャンバーは translate の transition で上→下へ。
 * コンテンツの解読は親 overflow:hidden + 子の height/translate で上から開く近似。 */
#ScanBar {
    position: absolute;
    left: 0; right: 0; height: 3px;
    background-color: rgb(80, 200, 230);
    translate: 0 0;
    transition: translate 900ms ease-in-out;
}
#ScanBar.run { translate: 0 108px; }

#ScanContent {
    overflow: hidden;
    height: 0;
    transition: height 900ms ease-in-out;
}
#ScanContent.run { height: 108px; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ScanRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var bar = root.Q<VisualElement>("ScanBar");
        var content = root.Q<VisualElement>("ScanContent");
        root.schedule.Execute(() => { bar.AddToClassList("run"); content.AddToClassList("run"); }).ExecuteLater(16);
    }
}`,
    },
  });

  /* 3. システムブート (loading) */
  R({
    id: 'system-boot',
    title: 'システムブート',
    titleEn: 'System Boot',
    category: 'loading',
    tags: ['terminal', 'boot', 'typing', 'mono'],
    description: '端末のブート画面のように、等幅のログ行が上から順にタイプ表示され、各行の末尾に [OK] などのステータスが点いていく起動演出。ローディング/初期化画面の SF 調演出に。行ごとに文字送り→ステータス確定を繰り返し、末尾に点滅カーソルを添える。単一行の typewriter と違い「複数行の順次ログ + ステータス確定 + カーソル点滅」が要点。',
    spec: {
      lines: ['INIT CORE', 'LOAD MODULES', 'LINK NETWORK', 'SYSTEM READY'],
      perLine: { type: '文字送り', then: '[OK] を点灯', status: 'アクセント色' },
      cursor: '末尾で点滅するブロックカーソル',
      note: 'typewriter(単一行)とは別。複数行の順次ログ + ステータス確定が要点。等幅フォント推奨',
    },
    preview(ctx, PV) {
      const con = PV.el('mono', {
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: '198px', fontSize: '11px', lineHeight: '1.7', textAlign: 'left', color: 'var(--pv-text)',
      });
      ctx.stage.appendChild(con);
      const LINES = ['> INIT CORE', '> LOAD MODULES', '> LINK NETWORK', '> SYSTEM READY'];
      const rows = LINES.map((txt) => {
        const row = PV.el(null, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', opacity: '0' });
        const label = PV.el('mono', { whiteSpace: 'pre', color: 'var(--pv-dim)' }, '');
        const status = PV.el('mono', { color: 'var(--pv-accent)', fontWeight: '700', opacity: '0' }, '[OK]');
        row.appendChild(label); row.appendChild(status); con.appendChild(row);
        return { row, label, status, full: txt };
      });
      // 点滅カーソル
      const cursor = PV.el('mono', { display: 'inline-block', width: '7px', height: '12px', background: 'var(--pv-accent)', marginLeft: '2px', verticalAlign: 'middle', opacity: '0' });

      ctx.forever(async () => {
        rows.forEach(r => { r.row.style.opacity = '0'; r.label.textContent = ''; r.status.style.opacity = '0'; });
        await ctx.wait(0.4);
        for (const r of rows) {
          r.row.style.opacity = '1';
          r.label.appendChild(cursor); cursor.style.opacity = '1';
          await ctx.tween({
            from: 0, to: r.full.length, duration: Math.max(0.3, r.full.length * 0.035), ease: 'Linear',
            onUpdate: (v) => { r.label.firstChild && (r.label.textContent = r.full.slice(0, Math.round(v))); r.label.appendChild(cursor); },
          });
          r.label.textContent = r.full; r.label.appendChild(cursor);
          await ctx.tween({ from: 0, to: 1, duration: 0.22, ease: 'OutBack', onUpdate: (v) => { r.status.style.opacity = String(Math.min(1, v)); PV.applyT(r.status, { s: lerp(0.6, 1, Math.min(1, v)) }); } });
          await ctx.wait(0.12);
        }
        // 末尾でカーソル点滅
        const last = rows[rows.length - 1]; last.label.appendChild(cursor);
        await ctx.tween({ from: 0, to: 1, duration: 1.6, ease: 'Linear', onUpdate: (v) => { cursor.style.opacity = (Math.floor(v * 6) % 2 === 0) ? '1' : '0'; } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using System.Collections;
using LitMotion;
using UnityEngine;
using TMPro;

// 端末ブート: 行ごとに文字送り→[OK]確定を順に進める
public class SystemBootLitMotion : MonoBehaviour
{
    [SerializeField] TMP_Text[] lineLabels;   // 各ログ行
    [SerializeField] TMP_Text[] lineStatuses; // 各行の [OK]
    [SerializeField] string[] lines;          // 表示文字列

    void OnEnable() => StartCoroutine(Boot());

    IEnumerator Boot()
    {
        for (int i = 0; i < lines.Length; i++)
        {
            int idx = i;
            lineStatuses[idx].alpha = 0f;
            // 文字送り(maxVisibleCharacters を伸ばす)
            lineLabels[idx].text = lines[idx];
            lineLabels[idx].maxVisibleCharacters = 0;
            bool done = false;
            LMotion.Create(0f, lines[idx].Length, Mathf.Max(0.3f, lines[idx].Length * 0.035f))
                .WithEase(Ease.Linear)
                .WithOnComplete(() => done = true)
                .Bind(v => lineLabels[idx].maxVisibleCharacters = Mathf.RoundToInt(v));
            while (!done) yield return null;
            LMotion.Create(0f, 1f, 0.22f).WithEase(Ease.OutBack).Bind(a => lineStatuses[idx].alpha = a);
            yield return new WaitForSeconds(0.12f);
        }
    }
}`,
      dotween: `
using System.Collections;
using DG.Tweening;
using UnityEngine;
using TMPro;

public class SystemBootDOTween : MonoBehaviour
{
    [SerializeField] TMP_Text[] lineLabels;
    [SerializeField] TMP_Text[] lineStatuses;
    [SerializeField] string[] lines;

    void OnEnable() => StartCoroutine(Boot());

    IEnumerator Boot()
    {
        for (int i = 0; i < lines.Length; i++)
        {
            int idx = i;
            lineLabels[idx].text = lines[idx];
            lineLabels[idx].maxVisibleCharacters = 0;
            lineStatuses[idx].alpha = 0f;
            float dur = Mathf.Max(0.3f, lines[idx].Length * 0.035f);
            yield return DOTween.To(() => 0, c => lineLabels[idx].maxVisibleCharacters = c, lines[idx].Length, dur)
                .SetEase(Ease.Linear).WaitForCompletion();
            lineStatuses[idx].DOFade(1f, 0.22f).SetEase(Ease.OutBack);
            yield return new WaitForSeconds(0.12f);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using TMPro;

public class SystemBootCoroutine : MonoBehaviour
{
    [SerializeField] TMP_Text[] lineLabels;
    [SerializeField] TMP_Text[] lineStatuses;
    [SerializeField] string[] lines;

    void OnEnable() => StartCoroutine(Boot());

    IEnumerator Boot()
    {
        for (int i = 0; i < lines.Length; i++)
        {
            lineLabels[i].text = lines[i];
            lineLabels[i].maxVisibleCharacters = 0;
            lineStatuses[i].alpha = 0f;
            for (int c = 0; c <= lines[i].Length; c++)
            {
                lineLabels[i].maxVisibleCharacters = c;
                yield return new WaitForSeconds(0.035f);
            }
            lineStatuses[i].alpha = 1f; // [OK] 点灯
            yield return new WaitForSeconds(0.12f);
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 文字送りは Label.text を1文字ずつ差し替え、[OK]は opacity の transition。
 * カーソル点滅は schedule で visibility を交互に切り替える。 */
.boot-status {
    color: rgb(80, 200, 230);
    opacity: 0;
    transition: opacity 220ms ease-out;
}
.boot-status.on { opacity: 1; }

/* ===== C# (.cs) ===== */
using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

public class SystemBootUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] string[] lines;

    void OnEnable() => StartCoroutine(Boot());

    IEnumerator Boot()
    {
        var root = document.rootVisualElement;
        for (int i = 0; i < lines.Length; i++)
        {
            var label = root.Q<Label>("BootLine" + i);
            var status = root.Q<VisualElement>("BootStatus" + i);
            for (int c = 0; c <= lines[i].Length; c++)
            {
                label.text = lines[i].Substring(0, c);
                yield return new WaitForSeconds(0.035f);
            }
            status.AddToClassList("on"); // [OK]
            yield return new WaitForSeconds(0.12f);
        }
    }
}`,
    },
  });

  /* 4. レティクルロック (attention) */
  R({
    id: 'reticle-lock',
    title: 'レティクルロック',
    titleEn: 'Reticle Lock',
    category: 'attention',
    tags: ['reticle', 'target', 'lock-on', 'sci-fi'],
    description: '照準リングが回転しながら収束し、四隅のブラケットが対象を囲むように内側へスナップして「ロックオン」する強調演出。対象の選択/捕捉/照準合わせに。外周リングを回しつつ縮め、四隅のカギ括弧を外→内へ OutBack でスナップ、確定でリングを軽くパンチさせ LOCK を明滅。単なる注目リングと違い「回転収束 + 四隅スナップ + ロック確定」が要点。',
    spec: {
      target: '捕捉する対象(ボタン/アイコン/敵)',
      ring: { rotate: '回転しながら', scale: '1.6→1', ease: 'OutBack', duration: 0.5 },
      brackets: { count: 4, from: '外側へオフセット', to: '対象の四隅へスナップ', ease: 'OutBack' },
      confirm: 'リングを punch + "LOCK" を明滅',
      note: 'attention-ring とは別。回転収束 + 四隅スナップ + ロック確定が要点',
    },
    preview(ctx, PV) {
      const center = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '0', height: '0' });
      ctx.stage.appendChild(center);
      // 対象
      const target = PV.el(null, { position: 'absolute', left: '-24px', top: '-24px', width: '48px', height: '48px', background: 'var(--pv-panel2)', border: '1px solid var(--pv-line-strong)' });
      center.appendChild(target);
      // 外周リング
      const ring = PV.el(null, {
        position: 'absolute', left: '-40px', top: '-40px', width: '80px', height: '80px', borderRadius: '50%',
        border: '2px dashed var(--pv-accent)', willChange: 'transform,opacity', opacity: '0',
      });
      center.appendChild(ring);
      // 四隅ブラケット
      const S = 16, H = 32; // bracket size, target half
      const mk = (x, y, sides, ox, oy) => {
        const b = PV.el(null, { position: 'absolute', width: S + 'px', height: S + 'px', left: x + 'px', top: y + 'px', willChange: 'transform,opacity', opacity: '0' });
        Object.assign(b.style, sides);
        center.appendChild(b);
        return { el: b, x, y, ox, oy };
      };
      const line = '2px solid var(--pv-accent)';
      const br = [
        mk(-H, -H, { borderTop: line, borderLeft: line }, -18, -18),
        mk(H - S, -H, { borderTop: line, borderRight: line }, 18, -18),
        mk(-H, H - S, { borderBottom: line, borderLeft: line }, -18, 18),
        mk(H - S, H - S, { borderBottom: line, borderRight: line }, 18, 18),
      ];
      // LOCK ラベル
      const lock = PV.el('mono', { position: 'absolute', left: '50%', top: '46px', transform: 'translateX(-50%)', color: 'var(--pv-accent)', fontWeight: '700', fontSize: '11px', letterSpacing: '0.2em', opacity: '0' }, 'LOCK');
      center.appendChild(lock);

      ctx.forever(async () => {
        ring.style.opacity = '0'; lock.style.opacity = '0';
        br.forEach(o => { o.el.style.opacity = '0'; PV.applyT(o.el, { x: o.ox, y: o.oy }); });
        await ctx.wait(0.4);
        // リング収束(回転しながら)
        ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'OutBack', onUpdate: (v) => { ring.style.opacity = String(Math.min(1, v * 2)); ring.style.transform = `rotate(${lerp(0, 140, v)}deg) scale(${lerp(1.6, 1, v)})`; } });
        // 四隅スナップ
        br.forEach((o, i) => ctx.tween({ from: 0, to: 1, duration: 0.42, delay: 0.06 + i * 0.03, ease: 'OutBack', onUpdate: (v) => { o.el.style.opacity = String(Math.min(1, v * 2)); PV.applyT(o.el, { x: lerp(o.ox, 0, v), y: lerp(o.oy, 0, v) }); } }));
        await ctx.wait(0.6);
        // ロック確定: リングをパンチ + LOCK 明滅
        ctx.tween({ from: 0, to: 1, duration: 0.4, onUpdate: (v) => { const p = EASE.punchWave(v, 6, 0.5) * 0.12; ring.style.transform = `rotate(140deg) scale(${1 + p})`; } });
        await ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'Linear', onUpdate: (v) => { lock.style.opacity = (Math.floor(v * 6) % 2 === 0) ? '1' : '0.25'; } });
        lock.style.opacity = '1';
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InCubic', onUpdate: (v) => { ring.style.opacity = String(v); lock.style.opacity = String(v); br.forEach(o => { o.el.style.opacity = String(v); }); } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 照準リング収束 + 四隅ブラケットのスナップでロックオン
public class ReticleLockLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] brackets;  // TL,TR,BL,BR
    [SerializeField] Vector2[] offsets;         // 各ブラケットの外側オフセット
    [SerializeField] CanvasGroup group;

    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        LMotion.Create(0f, 1f, 0.5f).BindToAlpha(group);
        // リング: 回転しながら 1.6→1
        LMotion.Create(1.6f, 1f, 0.5f).WithEase(Ease.OutBack).Bind(s => ring.localScale = Vector3.one * s);
        LMotion.Create(0f, 140f, 0.5f).WithEase(Ease.OutBack).Bind(z => ring.localEulerAngles = new Vector3(0, 0, z));
        // 四隅を外→内へスナップ
        for (int i = 0; i < brackets.Length; i++)
        {
            int idx = i;
            LMotion.Create(offsets[idx], Vector2.zero, 0.42f).WithEase(Ease.OutBack).WithDelay(0.06f + idx * 0.03f)
                .Bind(p => brackets[idx].anchoredPosition = p);
        }
        // ロック確定パンチ
        LMotion.Punch.Create(Vector3.zero, Vector3.one * 0.12f, 0.4f).WithDelay(0.55f)
            .Bind(v => ring.localScale = Vector3.one + v);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ReticleLockDOTween : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] brackets;
    [SerializeField] Vector2[] offsets;
    [SerializeField] CanvasGroup group;

    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 0f;
        group.DOFade(1f, 0.5f);
        ring.localScale = Vector3.one * 1.6f;
        ring.DOScale(1f, 0.5f).SetEase(Ease.OutBack);
        ring.DOLocalRotate(new Vector3(0, 0, 140f), 0.5f).SetEase(Ease.OutBack);
        for (int i = 0; i < brackets.Length; i++)
        {
            brackets[i].anchoredPosition = offsets[i];
            brackets[i].DOAnchorPos(Vector2.zero, 0.42f).SetEase(Ease.OutBack).SetDelay(0.06f + i * 0.03f);
        }
        ring.DOPunchScale(Vector3.one * 0.12f, 0.4f, 6, 0.5f).SetDelay(0.55f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ReticleLockCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform ring;
    [SerializeField] RectTransform[] brackets;
    [SerializeField] Vector2[] offsets;
    [SerializeField] CanvasGroup group;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        group.alpha = 0f;
        for (int i = 0; i < brackets.Length; i++) brackets[i].anchoredPosition = offsets[i];
        float t = 0f;
        while (t < 0.5f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.5f), e = OutBack(p);
            group.alpha = p;
            ring.localScale = Vector3.one * Mathf.LerpUnclamped(1.6f, 1f, e);
            ring.localEulerAngles = new Vector3(0, 0, Mathf.LerpUnclamped(0f, 140f, e));
            for (int i = 0; i < brackets.Length; i++)
                brackets[i].anchoredPosition = Vector2.LerpUnclamped(offsets[i], Vector2.zero, e);
            yield return null;
        }
    }

    static float OutBack(float x) { const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f; return 1f + c3 * u * u * u + c1 * u * u; }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * リング収束・四隅スナップはクラス切替 + scale/translate の transition。
 * 回転は rotate プロパティも transition 可能。 */
#Reticle {
    scale: 1.6 1.6;
    rotate: 0deg;
    opacity: 0;
    transition: scale 500ms ease-out-back, rotate 500ms ease-out-back, opacity 300ms ease-out;
}
#Reticle.lock { scale: 1 1; rotate: 140deg; opacity: 1; }

.reticle-bracket {
    opacity: 0;
    transition: translate 420ms ease-out-back, opacity 300ms ease-out;
}
/* 各ブラケットの初期 translate は C# 側でオフセットを与える */
.reticle-bracket.lock { translate: 0 0; opacity: 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ReticleLockUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2[] offsets;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var ring = root.Q<VisualElement>("Reticle");
        var brackets = root.Query<VisualElement>(className: "reticle-bracket").ToList();
        for (int i = 0; i < brackets.Count; i++)
            brackets[i].style.translate = new Translate(offsets[i].x, offsets[i].y);
        root.schedule.Execute(() =>
        {
            ring.AddToClassList("lock");
            foreach (var b in brackets) b.AddToClassList("lock");
        }).ExecuteLater(16);
    }
}`,
    },
  });

  /* 5. グリッチイン (entrance) */
  R({
    id: 'glitch-in',
    title: 'グリッチイン',
    titleEn: 'Glitch In',
    category: 'entrance',
    tags: ['glitch', 'rgb-split', 'noise', 'sci-fi'],
    description: '見出し/ロゴが、水平スライスのずれと RGB チャンネル分離(色ずれ)を伴うデジタルグリッチを経て収束・確定する登場。SF/サイバー調のタイトルや強調表示に。開始は大きな横ずれ + 色ずれ + 不透明度ノイズを与え、進行に従ってずれ量を 0 に収束させる。文字単位の text-scramble と違い「要素全体の色ずれ + スライスずれ + ちらつき」が要点。実機は RGB 分離シェーダ/マテリアルで作るのが定番。',
    spec: {
      target: '見出し/ロゴ/バッジ(要素全体)',
      duration: 0.6,
      rgbSplit: { offset: '±8px→0', note: '赤・シアンの2チャンネルを左右にずらす' },
      slice: '水平スライスを数本、横にジャンプさせる',
      flicker: '序盤は不透明度をランダムに明滅',
      note: 'text-scramble(文字単位)とは別。要素全体の色ずれ + スライス + ちらつきが要点。実機はRGB分離シェーダ',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '180px', height: '52px' });
      ctx.stage.appendChild(wrap);
      const baseStyle = {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', fontSize: '38px', letterSpacing: '0.14em', whiteSpace: 'nowrap',
        willChange: 'transform,opacity',
      };
      const TXT = 'ONLINE';
      // RGB分離レイヤー(赤/シアンは意図的な多色の例外。分離感を出すため固定色)
      const red = PV.el(null, Object.assign({}, baseStyle, { color: 'rgba(255,60,80,0.9)', mixBlendMode: 'screen' }), TXT);
      const cyan = PV.el(null, Object.assign({}, baseStyle, { color: 'rgba(60,220,255,0.9)', mixBlendMode: 'screen' }), TXT);
      const base = PV.el(null, Object.assign({}, baseStyle, { color: 'var(--pv-text)' }), TXT);
      wrap.appendChild(red); wrap.appendChild(cyan); wrap.appendChild(base);
      // 水平スライスの覆い(2本)
      const slices = [0.34, 0.62].map((yp) => {
        const s = PV.el(null, { position: 'absolute', left: '0', right: '0', top: (yp * 100) + '%', height: '7px', background: 'var(--pv-bg)', opacity: '0', pointerEvents: 'none' });
        wrap.appendChild(s); return s;
      });

      const setGlitch = (v) => { // v: 0(強グリッチ)→1(確定)
        const amp = 1 - v;
        const jx = (Math.random() * 2 - 1) * 9 * amp;
        base.style.transform = `translateX(${jx}px)`;
        red.style.transform = `translateX(${-8 * amp + (Math.random() * 2 - 1) * 3 * amp}px)`;
        cyan.style.transform = `translateX(${8 * amp + (Math.random() * 2 - 1) * 3 * amp}px)`;
        red.style.opacity = String(0.85 * amp);
        cyan.style.opacity = String(0.85 * amp);
        base.style.opacity = v < 0.35 ? String(0.4 + 0.6 * Math.random()) : '1';
        slices.forEach((s, i) => {
          if (amp > 0.2 && Math.random() < 0.5) { s.style.opacity = '0.9'; s.style.transform = `translateX(${(Math.random() * 2 - 1) * 12 * amp}px)`; }
          else s.style.opacity = '0';
        });
      };

      ctx.forever(async () => {
        setGlitch(0); wrap.style.opacity = '1';
        await ctx.wait(0.4);
        await ctx.tween({ from: 0, to: 1, duration: 0.6, ease: 'OutCubic', onUpdate: setGlitch });
        // 確定
        base.style.transform = 'translateX(0)'; red.style.opacity = '0'; cyan.style.opacity = '0'; base.style.opacity = '1';
        slices.forEach(s => s.style.opacity = '0');
        await ctx.wait(1.4);
        // 退場も軽くグリッチ
        await ctx.tween({ from: 1, to: 0, duration: 0.35, ease: 'InCubic', onUpdate: (v) => { setGlitch(v); wrap.style.opacity = String(Math.min(1, v * 1.5)); } });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// グリッチ収束。amp(1→0) を RGB分離シェーダの _Split と横ジッタへ流す
public class GlitchInLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform target;
    [SerializeField] Material glitchMaterial; // _Split(色ずれ量) / _Slice(スライスずれ) を持つシェーダ
    [SerializeField] CanvasGroup group;

    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 1f;
        Vector2 basePos = target.anchoredPosition;
        // amp: 1(強)→0(確定)
        LMotion.Create(1f, 0f, 0.6f).WithEase(Ease.OutCubic).Bind(amp =>
        {
            if (glitchMaterial != null)
            {
                glitchMaterial.SetFloat("_Split", amp * 8f);
                glitchMaterial.SetFloat("_Slice", amp);
            }
            float jx = (Random.value * 2f - 1f) * 9f * amp;
            target.anchoredPosition = basePos + new Vector2(jx, 0f);
            group.alpha = amp > 0.65f ? Random.Range(0.4f, 1f) : 1f; // 序盤のちらつき
        });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class GlitchInDOTween : MonoBehaviour
{
    [SerializeField] RectTransform target;
    [SerializeField] Material glitchMaterial;
    [SerializeField] CanvasGroup group;

    void OnEnable() => Play();

    public void Play()
    {
        group.alpha = 1f;
        Vector2 basePos = target.anchoredPosition;
        DOTween.To(() => 1f, amp =>
        {
            if (glitchMaterial != null)
            {
                glitchMaterial.SetFloat("_Split", amp * 8f);
                glitchMaterial.SetFloat("_Slice", amp);
            }
            target.anchoredPosition = basePos + new Vector2((Random.value * 2f - 1f) * 9f * amp, 0f);
            group.alpha = amp > 0.65f ? Random.Range(0.4f, 1f) : 1f;
        }, 0f, 0.6f).SetEase(Ease.OutCubic);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class GlitchInCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform target;
    [SerializeField] Material glitchMaterial;
    [SerializeField] CanvasGroup group;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        group.alpha = 1f;
        Vector2 basePos = target.anchoredPosition;
        float t = 0f;
        while (t < 0.6f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.6f), 3f); // OutCubic
            float amp = 1f - e;
            if (glitchMaterial != null)
            {
                glitchMaterial.SetFloat("_Split", amp * 8f);
                glitchMaterial.SetFloat("_Slice", amp);
            }
            target.anchoredPosition = basePos + new Vector2((Random.value * 2f - 1f) * 9f * amp, 0f);
            group.alpha = amp > 0.65f ? Random.Range(0.4f, 1f) : 1f;
            yield return null;
        }
        target.anchoredPosition = basePos;
        if (glitchMaterial != null) { glitchMaterial.SetFloat("_Split", 0f); glitchMaterial.SetFloat("_Slice", 0f); }
        group.alpha = 1f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 注意: RGB分離(色ずれ)は本来シェーダ表現。UI Toolkit 単体では
 * 赤/シアンの複製ラベルを重ね、translate を C# で振って近似する。
 * ここでは横ジッタ + 序盤フリッカを schedule で与える。 */
#GlitchTarget { opacity: 1; }
.glitch-ghost-r { color: rgb(255, 60, 80); position: absolute; }   /* 赤チャンネル複製 */
.glitch-ghost-c { color: rgb(60, 220, 255); position: absolute; }  /* シアンチャンネル複製 */

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class GlitchInUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float duration = 0.6f;
    VisualElement target, ghostR, ghostC;
    float time;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        target = root.Q<VisualElement>("GlitchTarget");
        ghostR = root.Q<VisualElement>(className: "glitch-ghost-r");
        ghostC = root.Q<VisualElement>(className: "glitch-ghost-c");
        time = 0f;
        target.schedule.Execute(() =>
        {
            time += 0.016f;
            float amp = Mathf.Clamp01(1f - time / duration);
            target.style.translate = new Translate((Random.value * 2f - 1f) * 9f * amp, 0);
            ghostR.style.translate = new Translate(-8f * amp, 0); ghostR.style.opacity = 0.85f * amp;
            ghostC.style.translate = new Translate(8f * amp, 0); ghostC.style.opacity = 0.85f * amp;
            target.style.opacity = amp > 0.65f ? Random.Range(0.4f, 1f) : 1f;
        }).Every(16).Until(() => time >= duration);
    }
}`,
    },
  });

  /* 6. HUDフレーム (widget) */
  R({
    id: 'hud-frame',
    title: 'HUDフレーム',
    titleEn: 'HUD Frame',
    category: 'widget',
    tags: ['hud', 'brackets', 'frame', 'sci-fi'],
    description: 'パネルの四隅からカギ括弧の枠線が伸びて対象を囲み、目盛りや小さな読み値が添えられて「HUD の枠」が組み上がる装飾演出。情報パネル/カード/選択枠を SF 調に縁取りたいときに。四隅のブラケットを水平・垂直の線長 0→規定長で描き、少し遅れて目盛りと読み値をフェードインさせる。静的な枠と違い「四隅から線が伸びて組み上がる」のが要点。',
    spec: {
      target: 'パネル/カード/選択枠',
      brackets: { count: 4, draw: '線長 0→規定長(水平・垂直)', ease: 'OutCubic', stagger: '0.05s' },
      ticks: '上辺に目盛りを遅れてフェードイン',
      readout: '隅に小さな読み値(mono)を表示',
      note: '静的な枠とは別。四隅から線が伸びて組み上がる作画感が要点',
    },
    preview(ctx, PV) {
      const W = 168, H = 104;
      const box = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px' });
      ctx.stage.appendChild(box);
      // 内側パネル
      const panel = PV.el(null, { position: 'absolute', inset: '8px', background: 'color-mix(in srgb, var(--pv-accent) 8%, var(--pv-panel))', display: 'flex', flexDirection: 'column', gap: '7px', justifyContent: 'center', padding: '0 14px', boxSizing: 'border-box', opacity: '0' });
      panel.appendChild(PV.el(null, { width: '56%', height: '9px', background: 'var(--pv-accent)' }));
      panel.appendChild(PV.el(null, { width: '100%', height: '6px', background: 'var(--pv-line-strong)' }));
      panel.appendChild(PV.el(null, { width: '70%', height: '6px', background: 'var(--pv-line)' }));
      box.appendChild(panel);
      // 四隅ブラケット: 各々 水平線 + 垂直線
      const LEN = 30, TH = 2;
      const mkBracket = (corner) => {
        const hx = PV.el(null, { position: 'absolute', height: TH + 'px', width: '0px', background: 'var(--pv-accent)' });
        const vy = PV.el(null, { position: 'absolute', width: TH + 'px', height: '0px', background: 'var(--pv-accent)' });
        const c = { tl: [0, 0], tr: [1, 0], bl: [0, 1], br: [1, 1] }[corner];
        if (c[0] === 0) { hx.style.left = '0'; vy.style.left = '0'; } else { hx.style.right = '0'; vy.style.right = '0'; }
        if (c[1] === 0) { hx.style.top = '0'; vy.style.top = '0'; } else { hx.style.bottom = '0'; vy.style.bottom = '0'; }
        box.appendChild(hx); box.appendChild(vy);
        return { hx, vy };
      };
      const brackets = ['tl', 'tr', 'bl', 'br'].map(mkBracket);
      // 上辺の目盛り
      const ticks = [];
      for (let i = 0; i < 5; i++) {
        const t = PV.el(null, { position: 'absolute', top: '-3px', left: `${28 + i * 26}px`, width: '1px', height: '6px', background: 'var(--pv-line-strong)', opacity: '0' });
        box.appendChild(t); ticks.push(t);
      }
      // 読み値
      const readout = PV.el('mono', { position: 'absolute', right: '2px', bottom: '-14px', fontSize: '9px', color: 'var(--pv-dim)', letterSpacing: '0.1em', opacity: '0' }, '// SYS.OK');

      ctx.forever(async () => {
        brackets.forEach(b => { b.hx.style.width = '0px'; b.vy.style.height = '0px'; });
        ticks.forEach(t => t.style.opacity = '0'); readout.style.opacity = '0'; panel.style.opacity = '0';
        await ctx.wait(0.4);
        // パネル
        ctx.tween({ from: 0, to: 1, duration: 0.4, ease: 'OutCubic', onUpdate: (v) => panel.style.opacity = String(v) });
        // 四隅から線が伸びる
        brackets.forEach((b, i) => {
          ctx.tween({ from: 0, to: LEN, duration: 0.4, delay: i * 0.05, ease: 'OutCubic', onUpdate: (v) => { b.hx.style.width = v + 'px'; } });
          ctx.tween({ from: 0, to: LEN, duration: 0.4, delay: i * 0.05 + 0.04, ease: 'OutCubic', onUpdate: (v) => { b.vy.style.height = v + 'px'; } });
        });
        // 目盛り + 読み値
        ticks.forEach((t, i) => ctx.tween({ from: 0, to: 1, duration: 0.3, delay: 0.35 + i * 0.04, ease: 'OutQuad', onUpdate: (v) => t.style.opacity = String(v * 0.9) }));
        ctx.tween({ from: 0, to: 1, duration: 0.35, delay: 0.5, ease: 'OutQuad', onUpdate: (v) => readout.style.opacity = String(v) });
        box.appendChild(readout);
        await ctx.wait(1.7);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InCubic', onUpdate: (v) => { box.style.opacity = String(v); } });
        box.style.opacity = '1';
        await ctx.wait(0.35);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 四隅のブラケットを 線長 0→LEN で描き、目盛り/読み値を遅れてフェードイン
public class HudFrameLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] hLines; // 四隅の水平線
    [SerializeField] RectTransform[] vLines; // 四隅の垂直線
    [SerializeField] CanvasGroup ticks, readout, panel;
    [SerializeField] float len = 30f;

    void OnEnable() => Play();

    public void Play()
    {
        LMotion.Create(0f, 1f, 0.4f).WithEase(Ease.OutCubic).BindToAlpha(panel);
        for (int i = 0; i < hLines.Length; i++)
        {
            int idx = i;
            LMotion.Create(0f, len, 0.4f).WithEase(Ease.OutCubic).WithDelay(idx * 0.05f)
                .Bind(w => hLines[idx].sizeDelta = new Vector2(w, hLines[idx].sizeDelta.y));
            LMotion.Create(0f, len, 0.4f).WithEase(Ease.OutCubic).WithDelay(idx * 0.05f + 0.04f)
                .Bind(h => vLines[idx].sizeDelta = new Vector2(vLines[idx].sizeDelta.x, h));
        }
        LMotion.Create(0f, 1f, 0.3f).WithDelay(0.35f).BindToAlpha(ticks);
        LMotion.Create(0f, 1f, 0.35f).WithDelay(0.5f).BindToAlpha(readout);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HudFrameDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] hLines;
    [SerializeField] RectTransform[] vLines;
    [SerializeField] CanvasGroup ticks, readout, panel;
    [SerializeField] float len = 30f;

    void OnEnable() => Play();

    public void Play()
    {
        panel.alpha = 0f; panel.DOFade(1f, 0.4f);
        for (int i = 0; i < hLines.Length; i++)
        {
            var h = hLines[i]; var v = vLines[i];
            h.DOSizeDelta(new Vector2(len, h.sizeDelta.y), 0.4f).SetEase(Ease.OutCubic).SetDelay(i * 0.05f)
                .From(new Vector2(0f, h.sizeDelta.y));
            v.DOSizeDelta(new Vector2(v.sizeDelta.x, len), 0.4f).SetEase(Ease.OutCubic).SetDelay(i * 0.05f + 0.04f)
                .From(new Vector2(v.sizeDelta.x, 0f));
        }
        ticks.alpha = 0f; ticks.DOFade(1f, 0.3f).SetDelay(0.35f);
        readout.alpha = 0f; readout.DOFade(1f, 0.35f).SetDelay(0.5f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HudFrameCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] hLines;
    [SerializeField] RectTransform[] vLines;
    [SerializeField] CanvasGroup ticks, readout, panel;
    [SerializeField] float len = 30f;

    void OnEnable() => StartCoroutine(Play());

    IEnumerator Play()
    {
        panel.alpha = 0f; ticks.alpha = 0f; readout.alpha = 0f;
        float t = 0f;
        while (t < 0.6f)
        {
            t += Time.deltaTime;
            panel.alpha = Mathf.Clamp01(t / 0.4f);
            for (int i = 0; i < hLines.Length; i++)
            {
                float dh = Mathf.Clamp01((t - i * 0.05f) / 0.4f);
                float dv = Mathf.Clamp01((t - i * 0.05f - 0.04f) / 0.4f);
                float eh = 1f - Mathf.Pow(1f - dh, 3f), ev = 1f - Mathf.Pow(1f - dv, 3f);
                hLines[i].sizeDelta = new Vector2(len * eh, hLines[i].sizeDelta.y);
                vLines[i].sizeDelta = new Vector2(vLines[i].sizeDelta.x, len * ev);
            }
            ticks.alpha = Mathf.Clamp01((t - 0.35f) / 0.3f);
            readout.alpha = Mathf.Clamp01((t - 0.5f) / 0.35f);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 四隅の線は width/height を 0→LEN に transition。
 * 目盛り/読み値は transition-delay 付きの opacity で追随させる。 */
.hud-hline { width: 0; height: 2px; background-color: rgb(80, 200, 230); transition: width 400ms ease-out; }
.hud-vline { width: 2px; height: 0; background-color: rgb(80, 200, 230); transition: height 400ms ease-out; }
.hud-hline.draw { width: 30px; }
.hud-vline.draw { height: 30px; }

#HudTicks   { opacity: 0; transition: opacity 300ms ease-out 350ms; }
#HudReadout { opacity: 0; transition: opacity 350ms ease-out 500ms; }
#HudTicks.draw, #HudReadout.draw { opacity: 1; }

/* ===== C# (.cs) — 四隅へ stagger を付けて draw クラスを付与 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HudFrameUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        var hLines = root.Query<VisualElement>(className: "hud-hline").ToList();
        var vLines = root.Query<VisualElement>(className: "hud-vline").ToList();
        for (int i = 0; i < hLines.Count; i++)
        {
            int idx = i;
            hLines[idx].style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue(idx * 50f, TimeUnit.Millisecond) };
            vLines[idx].style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue(idx * 50f + 40f, TimeUnit.Millisecond) };
        }
        root.schedule.Execute(() =>
        {
            foreach (var h in hLines) h.AddToClassList("draw");
            foreach (var v in vLines) v.AddToClassList("draw");
            root.Q<VisualElement>("HudTicks").AddToClassList("draw");
            root.Q<VisualElement>("HudReadout").AddToClassList("draw");
        }).ExecuteLater(16);
    }
}`,
    },
  });
})();
