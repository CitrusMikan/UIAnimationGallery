/* 20-artsy.js — アート/レトロ解体/テック調の汎用UIモーション (9種)
 *   crt-off / chromatic-split / deconstruct-scatter        … レトロ解体・CRT
 *   circuit-trace / stamina-wheel / sonar-ping             … テック・探索HUD
 *   ink-wipe / halftone-reveal / color-block-wipe          … グラフィックアート
 * 配属: transition / attention / entrance / loading / widget / attention / transition / entrance / transition
 * 各種に UI Toolkit 実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);

  /* 1. CRTオフ (transition) — ブラウン管の電源オフ収束 */
  R({
    id: 'crt-off',
    title: 'CRTオフ',
    titleEn: 'CRT Power Off',
    category: 'transition',
    tags: ['crt', 'retro', 'collapse', 'vhs'],
    description: '古いブラウン管テレビの電源を切ったときのように、画面が縦方向へ潰れて一本の明るい横線になり、さらに横方向へ中央の輝点へ収束して消える退場/切替演出。レトロ・ホラー・チャンネル切替の画面転換に。縦スケールを一気に0付近まで潰す瞬間にグロー(白い走査線)を最大にし、続けて横スケールを潰して点にしてからフラッシュ→消灯する。単なるスケールアウトと違い「縦潰し→横線発光→点収束→残光」の順序が要点。実機は uGUI なら RectTransform.localScale の二段アニメ + 発光オーバーレイ、UI Toolkit は scale の transition を二段で組む。',
    spec: {
      target: '画面/パネル(退場・切替)',
      collapseV: { scaleY: '1→0.02', duration: 0.26, ease: 'InQuart', note: '縦に潰して横線化' },
      lineGlow: '横線化の瞬間に白い発光を最大化',
      collapseH: { scaleX: '1→0.03', duration: 0.16, ease: 'InQuart', note: '横線を点へ収束' },
      flash: '中央の輝点をフラッシュ→残光フェード',
      note: 'scale-out とは別。縦潰し→横線発光→点収束→残光の順序が肝。実機は localScale 二段 + 発光オーバーレイ',
    },
    preview(ctx, PV) {
      const W = 182, H = 112;
      const screen = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px',
        marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px',
        background: 'var(--pv-panel)', border: '1px solid var(--pv-line-strong)',
        overflow: 'hidden', willChange: 'transform,opacity', transformOrigin: 'center center',
        display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', padding: '0 16px', boxSizing: 'border-box',
      });
      screen.appendChild(PV.el(null, { width: '60%', height: '11px', background: 'var(--pv-accent)' }));
      screen.appendChild(PV.el(null, { width: '100%', height: '7px', background: 'var(--pv-line-strong)' }));
      screen.appendChild(PV.el(null, { width: '72%', height: '7px', background: 'var(--pv-line)' }));
      // 走査線オーバーレイ(常時うっすら)
      screen.appendChild(PV.el(null, {
        position: 'absolute', inset: '0', pointerEvents: 'none', mixBlendMode: 'screen', opacity: '0.35',
        background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.25) 2px 3px)',
      }));
      ctx.stage.appendChild(screen);
      // 収束時の白い発光ライン(横線化の瞬間に光る)
      const glow = PV.el(null, {
        position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: '3px',
        marginLeft: -W / 2 + 'px', marginTop: '-1.5px', background: '#fff',
        boxShadow: '0 0 14px 3px rgba(255,255,255,0.9)', opacity: '0', pointerEvents: 'none', willChange: 'transform,opacity',
      });
      ctx.stage.appendChild(glow);

      const setScale = (sx, sy) => { screen.style.transform = `scale(${sx}, ${sy})`; };

      ctx.forever(async () => {
        setScale(1, 1); screen.style.opacity = '1'; glow.style.opacity = '0'; glow.style.transform = 'scaleX(1)';
        await ctx.wait(1.3);
        // 縦潰し → 横線化(グロー最大へ)
        await ctx.tween({
          from: 0, to: 1, duration: 0.26, ease: 'InQuart',
          onUpdate: (v) => { setScale(1, lerp(1, 0.02, v)); glow.style.opacity = String(v); },
        });
        screen.style.opacity = '0'; // 以降はグローの線/点で表現
        glow.style.opacity = '1';
        // 横線 → 点へ収束
        await ctx.tween({
          from: 0, to: 1, duration: 0.16, ease: 'InQuart',
          onUpdate: (v) => { glow.style.transform = `scaleX(${lerp(1, 0.02, v)})`; },
        });
        // 輝点フラッシュ → 残光フェード
        await ctx.tween({ from: 1, to: 0, duration: 0.34, ease: 'OutQuad', onUpdate: (v) => { glow.style.opacity = String(v); } });
        await ctx.wait(0.5);
        // 電源オン(逆再生)でループを繋ぐ
        glow.style.opacity = '1';
        await ctx.tween({ from: 0, to: 1, duration: 0.14, onUpdate: (v) => { glow.style.transform = `scaleX(${lerp(0.02, 1, v)})`; } });
        screen.style.opacity = '1';
        await ctx.tween({ from: 0, to: 1, duration: 0.28, ease: 'OutQuart', onUpdate: (v) => { setScale(1, lerp(0.02, 1, v)); glow.style.opacity = String(1 - v); } });
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// ブラウン管オフ: 縦潰し→横線発光→点収束→残光
public class CrtPowerOffLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform screen;     // 画面本体
    [SerializeField] CanvasGroup screenGroup;
    [SerializeField] RectTransform glowLine;    // 白い横線/輝点
    [SerializeField] CanvasGroup glowGroup;

    public void PlayOff()
    {
        screen.localScale = Vector3.one; screenGroup.alpha = 1f;
        glowLine.localScale = Vector3.one; glowGroup.alpha = 0f;
        // 縦潰し + グロー最大
        LMotion.Create(1f, 0.02f, 0.26f).WithEase(Ease.InQuart).Bind(sy => screen.localScale = new Vector3(1f, sy, 1f));
        LMotion.Create(0f, 1f, 0.26f).Bind(a => glowGroup.alpha = a)
            .AddTo(gameObject);
        // 横線→点(0.26s後)
        LMotion.Create(1f, 0.02f, 0.16f).WithEase(Ease.InQuart).WithDelay(0.26f)
            .WithOnComplete(() => screenGroup.alpha = 0f)
            .Bind(sx => glowLine.localScale = new Vector3(sx, 1f, 1f));
        // 残光フェード
        LMotion.Create(1f, 0f, 0.34f).WithEase(Ease.OutQuad).WithDelay(0.42f).Bind(a => glowGroup.alpha = a);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CrtPowerOffDOTween : MonoBehaviour
{
    [SerializeField] RectTransform screen;
    [SerializeField] CanvasGroup screenGroup;
    [SerializeField] RectTransform glowLine;
    [SerializeField] CanvasGroup glowGroup;

    public void PlayOff()
    {
        screen.localScale = Vector3.one; screenGroup.alpha = 1f;
        glowLine.localScale = Vector3.one; glowGroup.alpha = 0f;
        Sequence seq = DOTween.Sequence();
        seq.Append(screen.DOScaleY(0.02f, 0.26f).SetEase(Ease.InQuart));
        seq.Join(glowGroup.DOFade(1f, 0.26f));
        seq.AppendCallback(() => screenGroup.alpha = 0f);
        seq.Append(glowLine.DOScaleX(0.02f, 0.16f).SetEase(Ease.InQuart));
        seq.Append(glowGroup.DOFade(0f, 0.34f).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CrtPowerOffCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform screen;
    [SerializeField] CanvasGroup screenGroup;
    [SerializeField] RectTransform glowLine;
    [SerializeField] CanvasGroup glowGroup;

    public void PlayOff() => StartCoroutine(Off());

    IEnumerator Off()
    {
        screen.localScale = Vector3.one; screenGroup.alpha = 1f;
        glowLine.localScale = Vector3.one; glowGroup.alpha = 0f;
        yield return Scale(0.26f, t => {
            float e = t * t * t * t;                         // InQuart
            screen.localScale = new Vector3(1f, Mathf.Lerp(1f, 0.02f, e), 1f);
            glowGroup.alpha = t;
        });
        screenGroup.alpha = 0f; glowGroup.alpha = 1f;
        yield return Scale(0.16f, t => glowLine.localScale = new Vector3(Mathf.Lerp(1f, 0.02f, t * t * t * t), 1f, 1f));
        yield return Scale(0.34f, t => glowGroup.alpha = 1f - (1f - (1f - t) * (1f - t))); // OutQuad フェード
        glowGroup.alpha = 0f;
    }

    IEnumerator Scale(float dur, System.Action<float> step)
    {
        for (float t = 0f; t < dur; t += Time.deltaTime) { step(Mathf.Clamp01(t / dur)); yield return null; }
        step(1f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 二段収束を scale の transition で。縦→横の順に別クラスで切替える。
 * 発光ラインは別 VisualElement を重ね opacity で光らせる。 */
#CrtScreen {
    scale: 1 1;
    transition: scale 260ms ease-in;          /* まず縦を潰す */
    transform-origin: center;
}
#CrtScreen.off-v { scale: 1 0.02; }
#CrtScreen.off-h { scale: 0.02 0.02; transition: scale 160ms ease-in; }

#CrtGlow {
    opacity: 0; scale: 1 1;
    transition: opacity 260ms linear, scale 160ms ease-in;
}
#CrtGlow.on  { opacity: 1; }
#CrtGlow.dot { scale: 0.02 1; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CrtPowerOffUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void PlayOff()
    {
        var root = document.rootVisualElement;
        var screen = root.Q<VisualElement>("CrtScreen");
        var glow = root.Q<VisualElement>("CrtGlow");
        screen.AddToClassList("off-v"); glow.AddToClassList("on");
        // 縦潰し完了後に横収束→残光
        screen.schedule.Execute(() => { screen.AddToClassList("off-h"); glow.AddToClassList("dot"); }).ExecuteLater(260);
        glow.schedule.Execute(() => glow.style.opacity = 0f).ExecuteLater(430);
    }
}`,
    },
  });

  /* 2. クロマチックスプリット (attention) — RGB色ずれ強調 */
  R({
    id: 'chromatic-split',
    title: 'クロマチックスプリット',
    titleEn: 'Chromatic Split',
    category: 'attention',
    tags: ['rgb-split', 'chromatic', 'glitch', 'retro'],
    description: 'UI要素の赤チャンネルと青(シアン)チャンネルを左右へ一瞬引き離し、微振動を添えてから素早く戻す「色収差パルス」で注目を集める強調演出。新着・エラー・強調バッジや、ホバー/選択の反応に。punch 減衰波で色ずれ量を 0→最大→0 と一往復させ、本体にはごく小さな縦揺れを加えるとブラウン管的な滲みになる。要素全体を分解して確定する glitch-in と違い、こちらは「常設要素に繰り返しかけられる短い色ずれパルス」が要点。実機は RGB 分離マテリアルの _Split を punch で振るか、赤/シアンの複製を左右へずらす。',
    spec: {
      target: 'バッジ/チップ/選択要素(常設)',
      trigger: '注目/ホバー/選択/エラー時',
      split: { channels: ['red(-x)', 'cyan(+x)'], amount: '0→8px→0', curve: 'punch減衰波', duration: 0.5 },
      jitter: '本体にごく小さな縦揺れ',
      note: 'glitch-in(分解して確定)とは別。常設要素に繰り返せる短い色ずれパルスが要点。実機は _Split を punch で振る',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: '150px', height: '46px', marginLeft: '-75px', marginTop: '-23px' });
      ctx.stage.appendChild(wrap);
      // 同じチップを3層(本体 + 赤 + シアン)重ねる
      const makeChip = (color, blend) => {
        const chip = PV.el(null, {
          position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 16px', boxSizing: 'border-box', border: '2px solid ' + color, willChange: 'transform',
        });
        if (blend) chip.style.mixBlendMode = 'screen';
        const dot = PV.el(null, { width: '16px', height: '16px', flex: '0 0 auto', background: color, borderRadius: '50%' });
        const label = PV.el('mono', { fontWeight: '700', fontSize: '15px', letterSpacing: '0.18em', color: color }, 'ALERT');
        chip.appendChild(dot); chip.appendChild(label);
        wrap.appendChild(chip);
        return chip;
      };
      // 赤/シアンは色ずれ表現のための意図的な固定色(危険色ではなくチャンネル分離用の例外)
      const red = makeChip('rgba(255,60,90,0.85)', true);
      const cyan = makeChip('rgba(60,210,255,0.85)', true);
      const base = makeChip('var(--pv-accent)', false); // 本体は最前面・テーマ追従

      ctx.forever(async () => {
        red.style.transform = 'translate(0,0)'; cyan.style.transform = 'translate(0,0)'; base.style.transform = 'translate(0,0)';
        await ctx.wait(0.9);
        // 色ずれパルス(punch 減衰波)
        await ctx.tween({
          from: 0, to: 1, duration: 0.5, ease: 'Linear',
          onUpdate: (v) => {
            const p = EASE.punchWave(v, 5, 0.55);           // 0→±→0 の減衰波
            const off = p * 8;
            const jy = (Math.random() * 2 - 1) * 1.5 * Math.abs(p);
            red.style.transform = `translate(${-off}px, ${jy}px)`;
            cyan.style.transform = `translate(${off}px, ${-jy}px)`;
            base.style.transform = `translate(0, ${(Math.random() * 2 - 1) * 1.2 * Math.abs(p)}px)`;
          },
        });
        red.style.transform = 'translate(0,0)'; cyan.style.transform = 'translate(0,0)'; base.style.transform = 'translate(0,0)';
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 赤/シアン複製を punch 減衰波で左右へ振る色収差パルス
public class ChromaticSplitLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform redGhost, cyanGhost, body;
    [SerializeField] float amount = 8f;

    // 注目/ホバー/エラー時に呼ぶ
    public void Pulse()
    {
        LMotion.Punch.Create(0f, amount, 0.5f).WithFrequency(5).WithDampingRatio(0.55f)
            .Bind(p =>
            {
                redGhost.anchoredPosition = new Vector2(-p, Random.Range(-1.5f, 1.5f) * Mathf.Abs(p) / amount);
                cyanGhost.anchoredPosition = new Vector2(p, Random.Range(-1.5f, 1.5f) * Mathf.Abs(p) / amount);
            });
    }
    // 分離マテリアルを使う場合は _Split を punch で振るだけでよい:
    // LMotion.Punch.Create(0f, amount, 0.5f).Bind(p => mat.SetFloat("_Split", Mathf.Abs(p)));
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ChromaticSplitDOTween : MonoBehaviour
{
    [SerializeField] RectTransform redGhost, cyanGhost;
    [SerializeField] float amount = 8f;

    public void Pulse()
    {
        redGhost.DOPunchAnchorPos(new Vector2(-amount, 0f), 0.5f, 5, 0.55f);
        cyanGhost.DOPunchAnchorPos(new Vector2(amount, 0f), 0.5f, 5, 0.55f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ChromaticSplitCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform redGhost, cyanGhost;
    [SerializeField] float amount = 8f;

    public void Pulse() => StartCoroutine(Run());

    IEnumerator Run()
    {
        const float dur = 0.5f, freq = 5f, damp = 0.55f;
        for (float t = 0f; t < dur; t += Time.deltaTime)
        {
            float x = Mathf.Clamp01(t / dur);
            // 減衰付き振動 (punch 波)
            float p = amount * Mathf.Sin(x * freq * Mathf.PI * 2f) * Mathf.Exp(-x / damp);
            redGhost.anchoredPosition = new Vector2(-p, 0f);
            cyanGhost.anchoredPosition = new Vector2(p, 0f);
            yield return null;
        }
        redGhost.anchoredPosition = cyanGhost.anchoredPosition = Vector2.zero;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 注意: 色ずれは本来シェーダ表現。UI Toolkit 単体では赤/シアンの複製を重ね、
 * translate を C# の schedule で減衰振動させて近似する。 */
.chroma-ghost-r { color: rgb(255, 60, 90);  position: absolute; }
.chroma-ghost-c { color: rgb(60, 210, 255); position: absolute; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ChromaticSplitUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float amount = 8f;
    VisualElement red, cyan;
    float time; bool running;

    void OnEnable()
    {
        var root = document.rootVisualElement;
        red = root.Q<VisualElement>(className: "chroma-ghost-r");
        cyan = root.Q<VisualElement>(className: "chroma-ghost-c");
    }

    public void Pulse()
    {
        time = 0f; running = true;
        red.schedule.Execute(() =>
        {
            time += 0.016f;
            float x = time / 0.5f;
            float p = amount * Mathf.Sin(x * 5f * Mathf.PI * 2f) * Mathf.Exp(-x / 0.55f);
            red.style.translate = new Translate(-p, 0);
            cyan.style.translate = new Translate(p, 0);
            if (x >= 1f) { red.style.translate = cyan.style.translate = new Translate(0, 0); running = false; }
        }).Every(16).Until(() => !running);
    }
}`,
    },
  });

  /* 3. デコンストラクト・スキャッター (entrance) — 破片解体/再構築 */
  R({
    id: 'deconstruct-scatter',
    title: 'デコンストラクト・スキャッター',
    titleEn: 'Deconstruct Scatter',
    category: 'entrance',
    tags: ['shatter', 'fragment', 'deconstruct', 'exit'],
    description: 'アイコンやカードを格子状の破片に分解し、各片を外側へ回転しながら飛散させて消す(退場)/逆順で寄せ集めて実体化する(登場)演出。情報の「解体・保留」やカード除去、モーダルの解散などに。片ごとに外向きのランダムな移動量・回転・スケール・遅延を与え、進行度で飛散↔集結を反転できるようにするのが要点。粒子で溶ける dissolve と違い、こちらは「元形状を保った矩形片が明確に散る/組み上がる」構造感が肝。実機は片をあらかじめ子オブジェクトとして並べ、各片へ移動+回転+フェードを与える。',
    spec: {
      target: 'アイコン/カード(登場・退場)',
      grid: '対象を N×M の矩形片に分割',
      perPiece: { move: '中心から外向きへランダム', rotate: '±ランダム', scale: '1→0.4', fade: '1→0', delayByDist: '中心からの距離で微ディレイ' },
      reversible: '進行度 0(集結)↔1(飛散) を反転して登場/退場を共用',
      note: 'dissolve(粒子で溶ける)とは別。元形状を保った矩形片が構造的に散る/組み上がるのが要点',
    },
    preview(ctx, PV) {
      const COLS = 5, ROWS = 5, TILE = 17, GAP = 1, SIZE = COLS * (TILE + GAP) - GAP;
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: SIZE + 'px', height: SIZE + 'px', marginLeft: -SIZE / 2 + 'px', marginTop: -SIZE / 2 + 'px' });
      ctx.stage.appendChild(wrap);
      const cx = (SIZE - TILE) / 2, cy = (SIZE - TILE) / 2;
      const pieces = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const hx = c * (TILE + GAP), hy = r * (TILE + GAP);
          // 円形マスク風に角を落とし、アイコンらしいまとまりに
          const dxc = (hx - cx), dyc = (hy - cy);
          const distC = Math.hypot(dxc, dyc) / (SIZE * 0.6);
          const el = PV.el(null, {
            position: 'absolute', width: TILE + 'px', height: TILE + 'px', left: hx + 'px', top: hy + 'px',
            background: distC < 0.55 ? 'var(--pv-accent)' : 'var(--pv-accent-dim)',
            willChange: 'transform,opacity',
          });
          wrap.appendChild(el);
          const dir = Math.atan2(dyc || rand(-1, 1), dxc || rand(-1, 1));
          const mag = rand(38, 74);
          pieces.push({
            el, hx, hy,
            ex: Math.cos(dir) * mag + rand(-10, 10),
            ey: Math.sin(dir) * mag + rand(-10, 10),
            rot: rand(-160, 160), delay: distC * 0.12,
          });
        }
      }
      // p: 0 = 集結(実体), 1 = 飛散
      const setP = (p) => {
        pieces.forEach(o => {
          const t = Math.max(0, Math.min(1, (p - o.delay) / (1 - 0.12)));
          const e = t; // 呼び出し側でイージング済みの p を渡す
          o.el.style.transform = `translate(${o.ex * e}px, ${o.ey * e}px) scale(${lerp(1, 0.4, e)}) rotate(${o.rot * e}deg)`;
          o.el.style.opacity = String(lerp(1, 0, e));
        });
      };

      ctx.forever(async () => {
        // 登場: 飛散→集結
        setP(1);
        await ctx.wait(0.35);
        await ctx.tween({ from: 1, to: 0, duration: 0.6, ease: 'OutCubic', onUpdate: setP });
        setP(0);
        await ctx.wait(1.3);
        // 退場: 集結→飛散
        await ctx.tween({ from: 0, to: 1, duration: 0.55, ease: 'InCubic', onUpdate: setP });
        await ctx.wait(0.4);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 事前に子として並べた破片へ、外向きの移動+回転+縮小+フェードを与える
public class DeconstructScatterLitMotion : MonoBehaviour
{
    [System.Serializable] public struct Piece { public RectTransform rt; public CanvasGroup cg; public Vector2 exit; public float rot; public float delay; }
    [SerializeField] Piece[] pieces;

    public void PlayIn()  => Run(1f, 0f, Ease.OutCubic, 0.6f);   // 飛散→集結
    public void PlayOut() => Run(0f, 1f, Ease.InCubic, 0.55f);   // 集結→飛散

    void Run(float from, float to, Ease ease, float dur)
    {
        foreach (var p in pieces)
        {
            var piece = p;
            LMotion.Create(from, to, dur).WithEase(ease).WithDelay(piece.delay).Bind(e =>
            {
                piece.rt.anchoredPosition = piece.exit * e;
                piece.rt.localScale = Vector3.one * Mathf.Lerp(1f, 0.4f, e);
                piece.rt.localEulerAngles = new Vector3(0, 0, piece.rot * e);
                piece.cg.alpha = 1f - e;
            });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DeconstructScatterDOTween : MonoBehaviour
{
    [System.Serializable] public struct Piece { public RectTransform rt; public CanvasGroup cg; public Vector2 exit; public float rot; public float delay; }
    [SerializeField] Piece[] pieces;

    public void PlayIn()  => Run(1f, 0f, Ease.OutCubic, 0.6f);
    public void PlayOut() => Run(0f, 1f, Ease.InCubic, 0.55f);

    void Run(float from, float to, Ease ease, float dur)
    {
        foreach (var p in pieces)
        {
            var piece = p;
            DOTween.To(() => from, e =>
            {
                piece.rt.anchoredPosition = piece.exit * e;
                piece.rt.localScale = Vector3.one * Mathf.Lerp(1f, 0.4f, e);
                piece.rt.localEulerAngles = new Vector3(0, 0, piece.rot * e);
                piece.cg.alpha = 1f - e;
            }, to, dur).SetEase(ease).SetDelay(piece.delay);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DeconstructScatterCoroutine : MonoBehaviour
{
    [System.Serializable] public struct Piece { public RectTransform rt; public CanvasGroup cg; public Vector2 exit; public float rot; public float delay; }
    [SerializeField] Piece[] pieces;

    public void PlayIn()  => StartCoroutine(Run(1f, 0f, 0.6f, true));
    public void PlayOut() => StartCoroutine(Run(0f, 1f, 0.55f, false));

    IEnumerator Run(float from, float to, float dur, bool outCubic)
    {
        float t = 0f, span = dur + 0.15f;
        while (t < span)
        {
            t += Time.deltaTime;
            foreach (var p in pieces)
            {
                float x = Mathf.Clamp01((t - p.delay) / dur);
                float e = outCubic ? 1f - Mathf.Pow(1f - x, 3f) : x * x * x;
                float v = Mathf.Lerp(from, to, e);
                p.rt.anchoredPosition = p.exit * v;
                p.rt.localScale = Vector3.one * Mathf.Lerp(1f, 0.4f, v);
                p.rt.localEulerAngles = new Vector3(0, 0, p.rot * v);
                p.cg.alpha = 1f - v;
            }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 各片に translate/scale/rotate/opacity の transition を効かせ、
 * .scattered クラスの付与/除去で 集結↔飛散 を切替える。
 * 片ごとの目標 translate/rotate と transition-delay は C# 側で個別設定する。 */
.frag {
    transition: translate 600ms ease-out, scale 600ms ease-out, rotate 600ms ease-out, opacity 600ms ease-out;
    opacity: 1; scale: 1 1; translate: 0 0; rotate: 0deg;
}
.frag.scattered { scale: 0.4 0.4; opacity: 0; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DeconstructScatterUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void Setup(VisualElement frag, Vector2 exit, float rot, float delayMs)
    {
        // 飛散先(translate)と回転・遅延を片ごとに設定
        frag.style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue(delayMs, TimeUnit.Millisecond) };
        frag.RegisterCallback<GeometryChangedEvent>(_ => { });
        frag.userData = new Vector3(exit.x, exit.y, rot);
    }

    public void PlayOut()
    {
        var frags = document.rootVisualElement.Query<VisualElement>(className: "frag").ToList();
        foreach (var f in frags)
        {
            var d = (Vector3)f.userData;
            f.style.translate = new Translate(d.x, d.y);
            f.style.rotate = new Rotate(d.z);
            f.AddToClassList("scattered");
        }
    }

    public void PlayIn()
    {
        var frags = document.rootVisualElement.Query<VisualElement>(className: "frag").ToList();
        foreach (var f in frags) { f.style.translate = new Translate(0, 0); f.style.rotate = new Rotate(0); f.RemoveFromClassList("scattered"); }
    }
}`,
    },
  });

  /* 4. サーキットトレース (loading) — 回路経路の点灯 */
  R({
    id: 'circuit-trace',
    title: 'サーキットトレース',
    titleEn: 'Circuit Trace',
    category: 'loading',
    tags: ['circuit', 'trace', 'tech', 'path'],
    description: '発光する光点が回路パターン(直角に折れる配線)の上を走り、通過した経路を点灯させながら終端のノードへ到達して点火する、テック調のローディング/接続演出。データ転送・起動・接続確立の待ち表現に。経路の総長に対する進捗で各セグメントの点灯長を伸ばし、先頭に強い発光ヘッドを置く。到達時に終端ノードを punch で点火する。単純な直線プログレスと違い「折れ曲がる経路を光が辿り、終端が点火する」配線感が要点。実機は経路を子セグメント化して長さを伸ばすか、LineRenderer/シェーダのマスクで表現する。',
    spec: {
      target: '接続/転送/起動の待ち表現',
      path: '直角に折れるセグメント列(Manhattan配線)',
      head: { glow: '先頭に強い発光ヘッド', speed: '総長を等速〜OutSineで走破', duration: 1.1 },
      trail: '通過済みの経路を点灯保持',
      node: '終端ノードを到達時に punch で点火',
      note: '直線プログレスとは別。折れ経路を光が辿り終端点火する配線感が要点。実機は経路のセグメント化 or LineRenderer',
    },
    preview(ctx, PV) {
      const W = 178, H = 106;
      const box = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px', willChange: 'opacity' });
      ctx.stage.appendChild(box);
      const TH = 3;
      const pts = [[16, 16], [16, 88], [92, 88], [92, 44], [162, 44]];
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const horiz = y0 === y1;
        const len = Math.abs(horiz ? x1 - x0 : y1 - y0);
        // 下地(暗い配線)
        const track = PV.el(null, {
          position: 'absolute', background: 'var(--pv-line-strong)',
          left: (horiz ? Math.min(x0, x1) : x0 - TH / 2) + 'px',
          top: (horiz ? y0 - TH / 2 : Math.min(y0, y1)) + 'px',
          width: (horiz ? len : TH) + 'px', height: (horiz ? TH : len) + 'px',
        });
        // 点灯(アクセント, 起点から伸ばす)
        const lit = PV.el(null, { position: 'absolute', background: 'var(--pv-accent)', boxShadow: '0 0 6px var(--pv-accent)', left: track.style.left, top: track.style.top, width: (horiz ? '0px' : TH + 'px'), height: (horiz ? TH + 'px' : '0px') });
        box.appendChild(track); box.appendChild(lit);
        segs.push({ x0, y0, x1, y1, horiz, len, lit, dirPos: horiz ? x1 > x0 : y1 > y0 });
      }
      const total = segs.reduce((s, g) => s + g.len, 0);
      // ノード(各折れ点)と終端
      pts.forEach((p, i) => {
        const isEnd = i === pts.length - 1;
        const n = PV.el(null, {
          position: 'absolute', width: (isEnd ? 14 : 7) + 'px', height: (isEnd ? 14 : 7) + 'px', borderRadius: '50%',
          left: p[0] - (isEnd ? 7 : 3.5) + 'px', top: p[1] - (isEnd ? 7 : 3.5) + 'px',
          background: isEnd ? 'var(--pv-panel2)' : 'var(--pv-line-strong)',
          border: isEnd ? '2px solid var(--pv-accent)' : 'none', willChange: 'transform',
        });
        box.appendChild(n);
        if (isEnd) box._endNode = n;
      });
      // 発光ヘッド
      const head = PV.el(null, { position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 12px 3px var(--pv-accent)', marginLeft: '-5px', marginTop: '-5px', opacity: '0', willChange: 'transform' });
      box.appendChild(head);

      const setProgress = (p) => {
        let travelled = p * total;
        let headX = pts[0][0], headY = pts[0][1];
        for (const g of segs) {
          const litLen = Math.max(0, Math.min(g.len, travelled));
          if (g.horiz) {
            g.lit.style.width = litLen + 'px';
            if (!g.dirPos) g.lit.style.left = (g.x0 - litLen) + 'px';
          } else {
            g.lit.style.height = litLen + 'px';
            if (!g.dirPos) g.lit.style.top = (g.y0 - litLen) + 'px';
          }
          if (travelled > 0 && travelled <= g.len) {
            const f = litLen;
            headX = g.horiz ? (g.dirPos ? g.x0 + f : g.x0 - f) : g.x0;
            headY = g.horiz ? g.y0 : (g.dirPos ? g.y0 + f : g.y0 - f);
          }
          travelled -= g.len;
        }
        head.style.left = headX + 'px'; head.style.top = headY + 'px';
      };

      ctx.forever(async () => {
        setProgress(0); head.style.opacity = '0'; box.style.opacity = '1';
        if (box._endNode) box._endNode.style.transform = 'scale(1)';
        await ctx.wait(0.4);
        head.style.opacity = '1';
        await ctx.tween({ from: 0, to: 1, duration: 1.1, ease: 'OutSine', onUpdate: setProgress });
        head.style.opacity = '0';
        // 終端ノード点火
        if (box._endNode) {
          box._endNode.style.background = 'var(--pv-accent)';
          await ctx.tween({ from: 0, to: 1, duration: 0.5, onUpdate: (v) => { box._endNode.style.transform = `scale(${1 + EASE.punchWave(v, 4, 0.5) * 0.5})`; } });
          box._endNode.style.transform = 'scale(1)';
        }
        await ctx.wait(1.0);
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InQuad', onUpdate: (v) => { box.style.opacity = String(v); } });
        if (box._endNode) box._endNode.style.background = 'var(--pv-panel2)';
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 総長に対する進捗で各セグメントの点灯長を伸ばし、終端で点火
public class CircuitTraceLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] litSegments; // 各配線の点灯部(pivotを起点側に)
    [SerializeField] float[] segLengths;          // 各セグメント長
    [SerializeField] RectTransform head;          // 発光ヘッド
    [SerializeField] RectTransform endNode;       // 終端ノード
    [SerializeField] Vector2[] pathPoints;        // 折れ点

    public void Play()
    {
        float total = 0f; foreach (var l in segLengths) total += l;
        LMotion.Create(0f, 1f, 1.1f).WithEase(Ease.OutSine).WithOnComplete(Ignite).Bind(p =>
        {
            float travelled = p * total;
            for (int i = 0; i < litSegments.Length; i++)
            {
                float lit = Mathf.Clamp(travelled, 0f, segLengths[i]);
                var sd = litSegments[i].sizeDelta;
                bool horiz = i % 2 == 0; // 例: 偶数=横 として長さ方向へ伸ばす(実際は方向データで判定)
                litSegments[i].sizeDelta = horiz ? new Vector2(lit, sd.y) : new Vector2(sd.x, lit);
                travelled -= segLengths[i];
            }
        });
    }

    void Ignite() => LMotion.Punch.Create(0f, 0.5f, 0.5f).WithFrequency(4).Bind(v => endNode.localScale = Vector3.one * (1f + v));
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CircuitTraceDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] litSegments;
    [SerializeField] float[] segLengths;
    [SerializeField] RectTransform endNode;

    public void Play()
    {
        float total = 0f; foreach (var l in segLengths) total += l;
        DOTween.To(() => 0f, p =>
        {
            float travelled = p * total;
            for (int i = 0; i < litSegments.Length; i++)
            {
                float lit = Mathf.Clamp(travelled, 0f, segLengths[i]);
                var sd = litSegments[i].sizeDelta;
                bool horiz = i % 2 == 0;
                litSegments[i].sizeDelta = horiz ? new Vector2(lit, sd.y) : new Vector2(sd.x, lit);
                travelled -= segLengths[i];
            }
        }, 1f, 1.1f).SetEase(Ease.OutSine)
          .OnComplete(() => endNode.DOPunchScale(Vector3.one * 0.5f, 0.5f, 4));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CircuitTraceCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] litSegments;
    [SerializeField] float[] segLengths;
    [SerializeField] RectTransform endNode;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        float total = 0f; foreach (var l in segLengths) total += l;
        for (float t = 0f; t < 1.1f; t += Time.deltaTime)
        {
            float p = Mathf.Sin(Mathf.Clamp01(t / 1.1f) * Mathf.PI * 0.5f); // OutSine
            float travelled = p * total;
            for (int i = 0; i < litSegments.Length; i++)
            {
                float lit = Mathf.Clamp(travelled, 0f, segLengths[i]);
                var sd = litSegments[i].sizeDelta;
                bool horiz = i % 2 == 0;
                litSegments[i].sizeDelta = horiz ? new Vector2(lit, sd.y) : new Vector2(sd.x, lit);
                travelled -= segLengths[i];
            }
            yield return null;
        }
        // 終端 punch 点火
        for (float t = 0f; t < 0.5f; t += Time.deltaTime)
        {
            float v = Mathf.Sin(t * 4f * Mathf.PI * 2f) * Mathf.Exp(-t / 0.5f);
            endNode.localScale = Vector3.one * (1f + v * 0.5f);
            yield return null;
        }
        endNode.localScale = Vector3.one;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 各配線の点灯部を width/height の transition で順に伸ばし、
 * transition-delay で経路の順序を表現。終端は scale の transition で点火。 */
.trace-seg { background-color: rgb(80, 200, 230); width: 0; transition: width 300ms linear; }
.trace-seg.v { width: 3px; height: 0; transition: height 300ms linear; }
.trace-seg.lit   { width: var(--seg-len); }
.trace-seg.v.lit { height: var(--seg-len); }

#EndNode { scale: 1 1; transition: scale 250ms ease-out; }
#EndNode.ignite { scale: 1.5 1.5; }

/* ===== C# (.cs) — セグメントを順に点灯 → 終端点火 ===== */
using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

public class CircuitTraceUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float[] segDurations;

    void OnEnable() => StartCoroutine(Run());

    IEnumerator Run()
    {
        var root = document.rootVisualElement;
        var segs = root.Query<VisualElement>(className: "trace-seg").ToList();
        for (int i = 0; i < segs.Count; i++)
        {
            segs[i].AddToClassList("lit");
            yield return new WaitForSeconds(segDurations[i]);
        }
        root.Q<VisualElement>("EndNode").AddToClassList("ignite");
    }
}`,
    },
  });

  /* 5. スタミナホイール (widget) — 円弧ゲージの消費/回復 */
  R({
    id: 'stamina-wheel',
    title: 'スタミナホイール',
    titleEn: 'Stamina Wheel',
    category: 'widget',
    tags: ['stamina', 'gauge', 'radial', 'ring'],
    description: 'アクションの持続に合わせて円弧のリングゲージが減っていき、空に近づくと危険色で明滅、手を離すと回復して満タンに戻る、アクション/探索系でおなじみのスタミナ表示。走る・登る・滑空などの消費リソースの可視化に。円弧の角度をアクション進行に同期させ、しきい値(約25%)を下回ったらリングを危険色にして数回明滅、解放後は OutQuad で満タンへ戻す。直線プログレスや読み込み用の circular-progress と違い「消費↔回復を往復し、低下時に警告する双方向ゲージ」が要点。実機は Image.fillAmount(Radial360) を消費/回復で駆動する。',
    spec: {
      target: '持続アクションの残量(走行/滑空/登攀 等)',
      gauge: { shape: 'リング状の円弧(fillAmount Radial360)', deplete: '消費中は角度を減らす', refill: '解放後 OutQuad で満タンへ' },
      lowWarning: { threshold: '約25%以下', effect: '危険色 + 数回明滅' },
      duration: { deplete: 1.2, refill: 0.8 },
      note: 'circular-progress(読み込み)とは別。消費↔回復を往復し低下時に警告する双方向ゲージが要点。実機は Image.fillAmount',
    },
    preview(ctx, PV) {
      const SIZE = 96;
      const wheel = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: SIZE + 'px', height: SIZE + 'px', marginLeft: -SIZE / 2 + 'px', marginTop: -SIZE / 2 + 'px', borderRadius: '50%', willChange: 'transform' });
      ctx.stage.appendChild(wheel);
      // 中央くり抜き(リング化)
      const hole = PV.el(null, { position: 'absolute', inset: '13px', borderRadius: '50%', background: 'var(--pv-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      const icon = PV.el(null, { width: '0', height: '0', borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderBottom: '16px solid var(--pv-accent)' });
      hole.appendChild(icon); wheel.appendChild(hole);
      const DANGER = 'rgba(255,84,84,1)'; // 低下警告用の危険色(意図的な固定色)

      const setPct = (pct, danger) => {
        const deg = pct * 360;
        const col = danger ? DANGER : 'var(--pv-accent)';
        wheel.style.background = `conic-gradient(from -90deg, ${col} 0 ${deg}deg, var(--pv-line) ${deg}deg 360deg)`;
        icon.style.borderBottomColor = danger ? DANGER : 'var(--pv-accent)';
      };

      ctx.forever(async () => {
        setPct(1, false);
        await ctx.wait(0.7);
        // 消費
        await ctx.tween({
          from: 1, to: 0.16, duration: 1.2, ease: 'Linear',
          onUpdate: (v) => setPct(v, v < 0.25),
        });
        // 低下明滅(危険色)
        await ctx.tween({ from: 0, to: 1, duration: 0.5, ease: 'Linear', onUpdate: (v) => { wheel.style.opacity = (Math.floor(v * 6) % 2 === 0) ? '1' : '0.4'; } });
        wheel.style.opacity = '1';
        // 回復
        await ctx.tween({ from: 0.16, to: 1, duration: 0.8, ease: 'OutQuad', onUpdate: (v) => setPct(v, v < 0.25) });
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;
using UnityEngine.UI;

// リング(Image: Filled/Radial360)の fillAmount を消費/回復で駆動
public class StaminaWheelLitMotion : MonoBehaviour
{
    [SerializeField] Image ring;          // Filled, Radial360
    [SerializeField] Color normalColor = new Color(0.31f, 0.78f, 0.9f);
    [SerializeField] Color dangerColor = new Color(1f, 0.33f, 0.33f);
    [SerializeField] float lowThreshold = 0.25f;
    MotionHandle handle;

    public void Deplete() => Drive(ring.fillAmount, 0.16f, 1.2f, Ease.Linear);
    public void Refill()  => Drive(ring.fillAmount, 1f, 0.8f, Ease.OutQuad);

    void Drive(float from, float to, float dur, Ease ease)
    {
        if (handle.IsActive()) handle.Cancel();
        handle = LMotion.Create(from, to, dur).WithEase(ease).Bind(v =>
        {
            ring.fillAmount = v;
            ring.color = v < lowThreshold ? dangerColor : normalColor;
        });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class StaminaWheelDOTween : MonoBehaviour
{
    [SerializeField] Image ring;
    [SerializeField] Color normalColor = new Color(0.31f, 0.78f, 0.9f);
    [SerializeField] Color dangerColor = new Color(1f, 0.33f, 0.33f);
    [SerializeField] float lowThreshold = 0.25f;

    public void Deplete() => Drive(0.16f, 1.2f, Ease.Linear);
    public void Refill()  => Drive(1f, 0.8f, Ease.OutQuad);

    void Drive(float to, float dur, Ease ease)
    {
        ring.DOKill();
        ring.DOFillAmount(to, dur).SetEase(ease)
            .OnUpdate(() => ring.color = ring.fillAmount < lowThreshold ? dangerColor : normalColor);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class StaminaWheelCoroutine : MonoBehaviour
{
    [SerializeField] Image ring;
    [SerializeField] Color normalColor = new Color(0.31f, 0.78f, 0.9f);
    [SerializeField] Color dangerColor = new Color(1f, 0.33f, 0.33f);
    [SerializeField] float lowThreshold = 0.25f;

    public void Deplete() { StopAllCoroutines(); StartCoroutine(Drive(0.16f, 1.2f, false)); }
    public void Refill()  { StopAllCoroutines(); StartCoroutine(Drive(1f, 0.8f, true)); }

    IEnumerator Drive(float to, float dur, bool outQuad)
    {
        float from = ring.fillAmount;
        for (float t = 0f; t < dur; t += Time.deltaTime)
        {
            float x = Mathf.Clamp01(t / dur);
            float e = outQuad ? 1f - (1f - x) * (1f - x) : x;
            ring.fillAmount = Mathf.Lerp(from, to, e);
            ring.color = ring.fillAmount < lowThreshold ? dangerColor : normalColor;
            yield return null;
        }
        ring.fillAmount = to;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * UI Toolkit には Radial fill が無いため、円弧は Painter2D(生成メッシュ)で描く。
 * 消費/回復は schedule で fill 値を補間し、しきい値で色を切替える。 */
#StaminaRing { width: 96px; height: 96px; }

/* ===== C# (.cs) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class StaminaWheelUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement ring;
    float fill = 1f, target = 1f, speed = 0.8f;
    readonly Color normal = new Color(0.31f, 0.78f, 0.9f);
    readonly Color danger = new Color(1f, 0.33f, 0.33f);

    void OnEnable()
    {
        ring = document.rootVisualElement.Q<VisualElement>("StaminaRing");
        ring.generateVisualContent += Draw;
        ring.schedule.Execute(Tick).Every(16);
    }

    public void Deplete() { target = 0.16f; speed = 1f / 1.2f; }
    public void Refill()  { target = 1f;    speed = 1f / 0.8f; }

    void Tick() { fill = Mathf.MoveTowards(fill, target, speed * 0.016f); ring.MarkDirtyRepaint(); }

    void Draw(MeshGenerationContext ctx)
    {
        var p = ctx.painter2D; float r = ring.resolvedStyle.width * 0.5f;
        p.lineWidth = 13f; p.strokeColor = fill < 0.25f ? danger : normal;
        p.BeginPath();
        p.Arc(new Vector2(r, r), r - 7f, -90f, -90f + 360f * fill);
        p.Stroke();
    }
}`,
    },
  });

  /* 6. ソナーピン (attention) — ピン落下 + 同心円の探査波 */
  R({
    id: 'sonar-ping',
    title: 'ソナーピン',
    titleEn: 'Sonar Ping',
    category: 'attention',
    tags: ['sonar', 'pin', 'ping', 'map'],
    description: 'マーカーピンが上から落ちて着地し、その地点から同心円の探査波(ソナー)が複数、外へ広がって薄れていく強調演出。マップ上の目標地点提示・スキャン・「ここに注目」の合図に。ピンは OutBounce で落として着地時に軽くスカッシュし、直後に時間差で複数のリングを scale 0→大 + opacity 1→0 で放つ。単発の hit-ring と違い「ピン着地 + 時間差の連続波」でその場所を継続的に指し示すのが要点。実機は着地アニメ後に、リングプレハブを一定間隔でスポーンして拡大フェードさせる。',
    spec: {
      target: 'マップ地点/対象位置の強調',
      pin: { drop: '上→着地', ease: 'OutBounce', land: '着地時に軽くスカッシュ' },
      rings: { count: 3, interval: 0.35, scale: '0.2→2.4', fade: '1→0', ease: 'OutCubic' },
      loop: 'ピン保持のまま波を周期的に放つ',
      note: 'hit-ring(単発)とは別。ピン着地 + 時間差の連続波で地点を指し示すのが要点。実機はリングを一定間隔でスポーン',
    },
    preview(ctx, PV) {
      const stage = PV.el(null, {
        position: 'absolute', inset: '0',
        backgroundImage: 'linear-gradient(var(--pv-grid) 1px, transparent 1px), linear-gradient(90deg, var(--pv-grid) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      });
      ctx.stage.appendChild(stage);
      const cx = '50%', cy = '54%';
      // 探査波リング(プール)
      const rings = [0, 1, 2].map(() => {
        const r = PV.el(null, {
          position: 'absolute', left: cx, top: cy, width: '30px', height: '30px', marginLeft: '-15px', marginTop: '-15px',
          borderRadius: '50%', border: '2px solid var(--pv-accent)', opacity: '0', willChange: 'transform,opacity', pointerEvents: 'none',
        });
        stage.appendChild(r); return r;
      });
      // ピン(円 + 下向き三角の簡易マーカー)
      const pin = PV.el(null, { position: 'absolute', left: cx, top: cy, willChange: 'transform', transformOrigin: 'center bottom' });
      const pinHead = PV.el(null, { position: 'absolute', left: '-11px', top: '-34px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--pv-accent)', border: '3px solid var(--pv-on-accent)', boxSizing: 'border-box' });
      const pinTip = PV.el(null, { position: 'absolute', left: '-6px', top: '-14px', width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '14px solid var(--pv-accent)' });
      const dot = PV.el(null, { position: 'absolute', left: '-3px', top: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pv-accent)' });
      pin.appendChild(pinTip); pin.appendChild(pinHead); stage.appendChild(dot); stage.appendChild(pin);

      const emitRing = (r) => {
        ctx.tween({
          from: 0, to: 1, duration: 1.1, ease: 'OutCubic',
          onUpdate: (v) => { r.style.transform = `scale(${lerp(0.2, 2.4, v)})`; r.style.opacity = String((1 - v) * 0.85); },
        });
      };

      ctx.forever(async () => {
        pin.style.opacity = '0'; rings.forEach(r => r.style.opacity = '0');
        await ctx.wait(0.3);
        // ピン落下(バウンド着地)
        pin.style.opacity = '1';
        await ctx.tween({ from: 0, to: 1, duration: 0.6, ease: 'OutBounce', onUpdate: (v) => { pin.style.transform = `translateY(${lerp(-46, 0, v)}px)`; } });
        // 着地スカッシュ
        await ctx.tween({ from: 0, to: 1, duration: 0.22, onUpdate: (v) => { const p = EASE.punchWave(v, 3, 0.5); pin.style.transform = `translateY(0) scale(${1 + p * 0.14}, ${1 - p * 0.14})`; } });
        pin.style.transform = 'translateY(0) scale(1,1)';
        // 時間差で探査波を3連
        for (let i = 0; i < rings.length; i++) { emitRing(rings[i]); await ctx.wait(0.35); }
        await ctx.wait(0.9);
      });
    },
    code: {
      litmotion: `
using System.Collections;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// ピンをバウンド着地させ、その後に探査波リングを時間差でスポーン
public class SonarPingLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform pin;
    [SerializeField] RectTransform ringPrefab;
    [SerializeField] Transform ringParent;
    [SerializeField] int ringCount = 3;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        LMotion.Create(new Vector2(pin.anchoredPosition.x, pin.anchoredPosition.y + 46f), pin.anchoredPosition, 0.6f)
            .WithEase(Ease.OutBounce).BindToAnchoredPosition(pin);
        yield return new WaitForSeconds(0.6f);
        for (int i = 0; i < ringCount; i++)
        {
            var ring = Instantiate(ringPrefab, ringParent);
            var cg = ring.GetComponent<CanvasGroup>();
            LMotion.Create(0.2f, 2.4f, 1.1f).WithEase(Ease.OutCubic).Bind(s => ring.localScale = Vector3.one * s);
            LMotion.Create(0.85f, 0f, 1.1f).WithOnComplete(() => Destroy(ring.gameObject)).Bind(a => cg.alpha = a);
            yield return new WaitForSeconds(0.35f);
        }
    }
}`,
      dotween: `
using System.Collections;
using DG.Tweening;
using UnityEngine;

public class SonarPingDOTween : MonoBehaviour
{
    [SerializeField] RectTransform pin;
    [SerializeField] RectTransform ringPrefab;
    [SerializeField] Transform ringParent;
    [SerializeField] int ringCount = 3;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        Vector2 landed = pin.anchoredPosition;
        pin.anchoredPosition = landed + Vector2.up * 46f;
        pin.DOAnchorPos(landed, 0.6f).SetEase(Ease.OutBounce);
        yield return new WaitForSeconds(0.6f);
        for (int i = 0; i < ringCount; i++)
        {
            var ring = Instantiate(ringPrefab, ringParent);
            var cg = ring.GetComponent<CanvasGroup>();
            ring.localScale = Vector3.one * 0.2f;
            ring.DOScale(2.4f, 1.1f).SetEase(Ease.OutCubic);
            cg.DOFade(0f, 1.1f).OnComplete(() => Destroy(ring.gameObject));
            yield return new WaitForSeconds(0.35f);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class SonarPingCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform pin;
    [SerializeField] RectTransform ringPrefab;
    [SerializeField] Transform ringParent;
    [SerializeField] int ringCount = 3;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        Vector2 landed = pin.anchoredPosition;
        for (float t = 0f; t < 0.6f; t += Time.deltaTime)
        {
            pin.anchoredPosition = landed + Vector2.up * Mathf.Lerp(46f, 0f, OutBounce(t / 0.6f));
            yield return null;
        }
        for (int i = 0; i < ringCount; i++) { StartCoroutine(Ring(Instantiate(ringPrefab, ringParent))); yield return new WaitForSeconds(0.35f); }
    }

    IEnumerator Ring(RectTransform ring)
    {
        var cg = ring.GetComponent<CanvasGroup>();
        for (float t = 0f; t < 1.1f; t += Time.deltaTime)
        {
            float e = 1f - Mathf.Pow(1f - t / 1.1f, 3f);
            ring.localScale = Vector3.one * Mathf.Lerp(0.2f, 2.4f, e);
            cg.alpha = (1f - e) * 0.85f;
            yield return null;
        }
        Destroy(ring.gameObject);
    }

    static float OutBounce(float x)
    {
        const float n1 = 7.5625f, d1 = 2.75f;
        if (x < 1f / d1) return n1 * x * x;
        if (x < 2f / d1) { x -= 1.5f / d1; return n1 * x * x + 0.75f; }
        if (x < 2.5f / d1) { x -= 2.25f / d1; return n1 * x * x + 0.9375f; }
        x -= 2.625f / d1; return n1 * x * x + 0.984375f;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * ピン落下は translate の transition(ease-out-bounce 相当は近似)。
 * 探査波は scale/opacity の transition を持つリングを複製し、時間差で .ping を付与する。 */
#Pin { translate: 0 -46px; transition: translate 600ms ease-out; }
#Pin.landed { translate: 0 0; }

.sonar-ring {
    scale: 0.2 0.2; opacity: 0.85;
    transition: scale 1100ms ease-out, opacity 1100ms ease-out;
}
.sonar-ring.ping { scale: 2.4 2.4; opacity: 0; }

/* ===== C# (.cs) ===== */
using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

public class SonarPingUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] int ringCount = 3;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        var root = document.rootVisualElement;
        root.Q<VisualElement>("Pin").AddToClassList("landed");
        yield return new WaitForSeconds(0.6f);
        var rings = root.Query<VisualElement>(className: "sonar-ring").ToList();
        for (int i = 0; i < Mathf.Min(ringCount, rings.Count); i++)
        {
            rings[i].AddToClassList("ping");
            yield return new WaitForSeconds(0.35f);
        }
    }
}`,
    },
  });

  /* 7. インクワイプ (transition) — 墨/絵筆の塗り現し */
  R({
    id: 'ink-wipe',
    title: 'インクワイプ',
    titleEn: 'Ink Wipe',
    category: 'transition',
    tags: ['ink', 'brush', 'wipe', 'artistic'],
    description: '絵筆で塗るように、不規則(波打つ)な境界を持つ墨面が画面を横切り、通過した後ろから次の画面が現れるアート調の画面転換。和風・書道・グラフィック誌面のような有機的なトランジションに。境界を直線ではなく複数点の波形にして左→右へ動かし、境界のすぐ先に滲みの帯(絵筆の先)を添えると塗り感が出る。直線 wipe と違い「エッジが不規則に波打ち、塗り跡が滲む」筆致が要点。実機は筆ストロークのアルファテクスチャを dissolve 閾値でスクロール、または SpriteMask を筆形状で動かす。',
    spec: {
      target: '画面/パネルの切替(A→B)',
      edge: { shape: '波打つ不規則境界(複数点)', move: '左→右', duration: 0.9, ease: 'InOutQuad' },
      brush: '境界の先に滲みの帯(絵筆の先)を添える',
      note: '直線 wipe とは別。境界が不規則に波打ち塗り跡が滲む筆致が要点。実機は筆アルファテクスチャの dissolve or SpriteMask',
    },
    preview(ctx, PV) {
      const W = 190, H = 116;
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px', overflow: 'hidden', border: '1px solid var(--pv-line-strong)' });
      ctx.stage.appendChild(wrap);
      const makeScreen = (bg, accent, label) => {
        const s = PV.el(null, { position: 'absolute', inset: '0', background: bg, display: 'flex', flexDirection: 'column', gap: '9px', justifyContent: 'center', padding: '0 20px', boxSizing: 'border-box' });
        s.appendChild(PV.el(null, { width: '54%', height: '12px', background: accent }));
        s.appendChild(PV.el(null, { width: '100%', height: '7px', background: 'var(--pv-line-strong)' }));
        s.appendChild(PV.el(null, { width: '76%', height: '7px', background: 'var(--pv-line)' }));
        return s;
      };
      const screenA = makeScreen('var(--pv-panel)', 'var(--pv-line-strong)', 'A');
      const screenB = makeScreen('var(--pv-panel2)', 'var(--pv-accent)', 'B');
      wrap.appendChild(screenA); wrap.appendChild(screenB);
      // 境界の先の滲み(絵筆の先)
      const brush = PV.el(null, { position: 'absolute', top: '0', bottom: '0', width: '26px', background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--pv-accent) 55%, transparent))', filter: 'blur(3px)', pointerEvents: 'none', opacity: '0' });
      wrap.appendChild(brush);

      const N = 7; // 波形の制御点数
      const seeds = Array.from({ length: N + 1 }, () => rand(-9, 9));
      const inkClip = (p) => { // p: 0→1 で左→右
        const baseX = lerp(-14, W + 14, p);
        const pts = [];
        pts.push('0% 0%');
        for (let i = 0; i <= N; i++) {
          const y = (i / N) * 100;
          const x = baseX + seeds[i] + Math.sin(p * 6 + i) * 6;
          pts.push(`${(x / W) * 100}% ${y}%`);
        }
        pts.push('0% 100%');
        return { clip: `polygon(${pts.join(',')})`, edgeX: baseX };
      };

      ctx.forever(async () => {
        // Bを墨面クリップで隠しておく(左端に畳む)
        let r = inkClip(0);
        screenB.style.clipPath = r.clip; brush.style.opacity = '0';
        await ctx.wait(0.5);
        brush.style.opacity = '1';
        await ctx.tween({
          from: 0, to: 1, duration: 0.9, ease: 'InOutQuad',
          onUpdate: (v) => { const rr = inkClip(v); screenB.style.clipPath = rr.clip; brush.style.left = (rr.edgeX - 6) + 'px'; brush.style.opacity = v > 0.94 ? String((1 - v) / 0.06) : '1'; },
        });
        screenB.style.clipPath = 'none'; brush.style.opacity = '0';
        await ctx.wait(1.2);
        // 次サイクルへ: A/B を入れ替えた見た目に戻す(色を交換)
        const bgA = screenA.style.background, bgB = screenB.style.background;
        screenA.style.background = bgB; screenB.style.background = bgA;
        await ctx.wait(0.1);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 筆アルファの dissolve 閾値を左→右へ動かして塗り現し
public class InkWipeLitMotion : MonoBehaviour
{
    [SerializeField] Material inkMaterial;  // _Cutoff(閾値) と筆ストロークの _NoiseTex を持つ dissolve シェーダ
    [SerializeField] RectTransform brush;    // 境界先の滲み帯
    [SerializeField] float width = 190f;

    public void Play()
    {
        LMotion.Create(0f, 1f, 0.9f).WithEase(Ease.InOutQuad).Bind(p =>
        {
            inkMaterial.SetFloat("_Cutoff", p);                       // 閾値で塗り面積を拡大
            brush.anchoredPosition = new Vector2(Mathf.Lerp(-14f, width + 14f, p), 0f);
        });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class InkWipeDOTween : MonoBehaviour
{
    [SerializeField] Material inkMaterial;
    [SerializeField] RectTransform brush;
    [SerializeField] float width = 190f;

    public void Play()
    {
        DOTween.To(() => 0f, p =>
        {
            inkMaterial.SetFloat("_Cutoff", p);
            brush.anchoredPosition = new Vector2(Mathf.Lerp(-14f, width + 14f, p), 0f);
        }, 1f, 0.9f).SetEase(Ease.InOutQuad);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class InkWipeCoroutine : MonoBehaviour
{
    [SerializeField] Material inkMaterial;
    [SerializeField] RectTransform brush;
    [SerializeField] float width = 190f;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        for (float t = 0f; t < 0.9f; t += Time.deltaTime)
        {
            float x = Mathf.Clamp01(t / 0.9f);
            float p = x < 0.5f ? 2f * x * x : 1f - Mathf.Pow(-2f * x + 2f, 2f) / 2f; // InOutQuad
            inkMaterial.SetFloat("_Cutoff", p);
            brush.anchoredPosition = new Vector2(Mathf.Lerp(-14f, width + 14f, p), 0f);
            yield return null;
        }
        inkMaterial.SetFloat("_Cutoff", 1f);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 不規則な筆エッジは USS だけでは出せないため、境界を Painter2D で波形メッシュに描き、
 * その面を左→右へ動かすのが確実。簡易には筆形状のマスク画像を translate で流す。 */
#InkMask { translate: -110% 0; transition: translate 900ms ease-in-out; }
#InkMask.wipe { translate: 110% 0; }

/* ===== C# (.cs) — 波形エッジを Painter2D で描き、進捗を schedule で更新 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class InkWipeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    VisualElement ink; float p; bool running;

    void OnEnable()
    {
        ink = document.rootVisualElement.Q<VisualElement>("InkLayer");
        ink.generateVisualContent += Draw;
    }

    public void Play()
    {
        p = 0f; running = true;
        ink.schedule.Execute(() => { p += 0.016f / 0.9f; ink.MarkDirtyRepaint(); if (p >= 1f) running = false; }).Every(16).Until(() => !running);
    }

    void Draw(MeshGenerationContext ctx)
    {
        float w = ink.resolvedStyle.width, h = ink.resolvedStyle.height;
        float baseX = Mathf.Lerp(-14f, w + 14f, p);
        var g = ctx.painter2D; g.fillColor = new Color(0.1f, 0.1f, 0.12f);
        g.BeginPath(); g.MoveTo(new Vector2(0, 0));
        for (int i = 0; i <= 7; i++) { float y = h * i / 7f; g.LineTo(new Vector2(baseX + Mathf.Sin(p * 6f + i) * 6f, y)); }
        g.LineTo(new Vector2(0, h)); g.ClosePath(); g.Fill();
    }
}`,
    },
  });

  /* 8. ハーフトーンリビール (entrance) — 網点で刷り上がる出現 */
  R({
    id: 'halftone-reveal',
    title: 'ハーフトーンリビール',
    titleEn: 'Halftone Reveal',
    category: 'entrance',
    tags: ['halftone', 'dots', 'print', 'artistic'],
    description: '網点(ハーフトーン)のドットが中心から外へ順に膨らみ、印刷が刷り上がるように図版が浮かび上がる出現演出。ポスター・コミック調・レトロ印刷風のロゴ/カード登場に。格子状のドットを中心からの距離に応じた遅延でスケール 0→1 させ、刷り上がった後に実体パネルへ滑らかに置き換えると「網点→実体」の解像感が出る。単なるフェード/スケールインと違い「多数の網点が刷られて像を成す」印刷質感が要点。実機はドット群を子に並べて距離ディレイでスケールさせるか、ハーフトーン化シェーダのドット径を上げる。',
    spec: {
      target: 'ロゴ/カード/図版(登場)',
      dots: { grid: 'N×M の網点', grow: 'scale 0→1', delayByDist: '中心からの距離で段階的に', ease: 'OutBack' },
      resolve: '刷り上がり後に実体パネルへクロスフェード',
      note: 'fade/scale-in とは別。多数の網点が刷られて像を成す印刷質感が要点。実機はドット群の距離ディレイ or ハーフトーン化シェーダ',
    },
    preview(ctx, PV) {
      const COLS = 11, ROWS = 7, SP = 15, D = 11;
      const W = COLS * SP, H = ROWS * SP;
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px' });
      ctx.stage.appendChild(wrap);
      const cx = (COLS - 1) / 2, cy = (ROWS - 1) / 2, maxD = Math.hypot(cx, cy);
      const dots = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dist = Math.hypot(c - cx, r - cy) / maxD;
          const dot = PV.el(null, {
            position: 'absolute', width: D + 'px', height: D + 'px', borderRadius: '50%',
            left: c * SP + (SP - D) / 2 + 'px', top: r * SP + (SP - D) / 2 + 'px',
            background: dist < 0.62 ? 'var(--pv-accent)' : 'var(--pv-accent-dim)',
            transform: 'scale(0)', willChange: 'transform', transformOrigin: 'center',
          });
          wrap.appendChild(dot); dots.push({ dot, dist });
        }
      }
      // 刷り上がり後に置き換える実体パネル
      const solid = PV.el(null, { position: 'absolute', inset: '4px', background: 'var(--pv-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: '0' });
      solid.appendChild(PV.el('mono', { color: 'var(--pv-on-accent)', fontWeight: '700', fontSize: '15px', letterSpacing: '0.24em' }, 'PRINT'));
      wrap.appendChild(solid);

      ctx.forever(async () => {
        dots.forEach(o => { o.dot.style.transform = 'scale(0)'; }); solid.style.opacity = '0';
        await ctx.wait(0.4);
        // 網点を距離ディレイで膨らませる
        dots.forEach(o => ctx.tween({ from: 0, to: 1, duration: 0.4, delay: o.dist * 0.5, ease: 'OutBack', onUpdate: (v) => { o.dot.style.transform = `scale(${Math.max(0, v)})`; } }));
        await ctx.wait(1.05);
        // 網点 → 実体へクロスフェード
        await ctx.tween({ from: 0, to: 1, duration: 0.35, ease: 'OutQuad', onUpdate: (v) => { solid.style.opacity = String(v); dots.forEach(o => { if (o.dist > 0.2) o.dot.style.opacity = String(1 - v); }); } });
        await ctx.wait(1.2);
        // リセットへ向けフェードアウト
        await ctx.tween({ from: 1, to: 0, duration: 0.3, ease: 'InQuad', onUpdate: (v) => { solid.style.opacity = String(v); } });
        dots.forEach(o => o.dot.style.opacity = '1');
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

// 中心からの距離ディレイで網点ドットを scale 0→1 → 実体へクロスフェード
public class HalftoneRevealLitMotion : MonoBehaviour
{
    [System.Serializable] public struct Dot { public RectTransform rt; public float dist; }
    [SerializeField] Dot[] dots;              // 距離(0..1)を事前計算して格納
    [SerializeField] CanvasGroup solid;        // 刷り上がり後の実体

    public void Play()
    {
        solid.alpha = 0f;
        foreach (var d in dots)
        {
            var dot = d;
            dot.rt.localScale = Vector3.zero;
            LMotion.Create(0f, 1f, 0.4f).WithEase(Ease.OutBack).WithDelay(dot.dist * 0.5f)
                .Bind(s => dot.rt.localScale = Vector3.one * Mathf.Max(0f, s));
        }
        LMotion.Create(0f, 1f, 0.35f).WithDelay(0.9f).Bind(a => solid.alpha = a);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HalftoneRevealDOTween : MonoBehaviour
{
    [System.Serializable] public struct Dot { public RectTransform rt; public float dist; }
    [SerializeField] Dot[] dots;
    [SerializeField] CanvasGroup solid;

    public void Play()
    {
        solid.alpha = 0f;
        foreach (var d in dots)
        {
            d.rt.localScale = Vector3.zero;
            d.rt.DOScale(1f, 0.4f).SetEase(Ease.OutBack).SetDelay(d.dist * 0.5f);
        }
        solid.DOFade(1f, 0.35f).SetDelay(0.9f);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HalftoneRevealCoroutine : MonoBehaviour
{
    [System.Serializable] public struct Dot { public RectTransform rt; public float dist; }
    [SerializeField] Dot[] dots;
    [SerializeField] CanvasGroup solid;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        solid.alpha = 0f;
        foreach (var d in dots) d.rt.localScale = Vector3.zero;
        float t = 0f;
        while (t < 1.25f)
        {
            t += Time.deltaTime;
            foreach (var d in dots)
            {
                float x = Mathf.Clamp01((t - d.dist * 0.5f) / 0.4f);
                const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f;
                float e = 1f + c3 * u * u * u + c1 * u * u;         // OutBack
                d.rt.localScale = Vector3.one * Mathf.Max(0f, e);
            }
            solid.alpha = Mathf.Clamp01((t - 0.9f) / 0.35f);
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 各ドットに scale の transition を効かせ、transition-delay を距離で個別設定する。
 * 実体パネルは opacity の transition で網点の上に刷り上げる。 */
.halftone-dot { scale: 0 0; transition: scale 400ms ease-out-back; border-radius: 50%; }
.halftone-dot.print { scale: 1 1; }
#HalftoneSolid { opacity: 0; transition: opacity 350ms ease-out 900ms; }
#HalftoneSolid.print { opacity: 1; }

/* ===== C# (.cs) — 距離に応じた delay を付けて .print を付与 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HalftoneRevealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Play()
    {
        var root = document.rootVisualElement;
        var dots = root.Query<VisualElement>(className: "halftone-dot").ToList();
        foreach (var dot in dots)
        {
            float dist = (float)(dot.userData ?? 0f);            // 生成時に中心距離(0..1)を userData へ
            dot.style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue(dist * 500f, TimeUnit.Millisecond) };
            dot.AddToClassList("print");
        }
        root.Q<VisualElement>("HalftoneSolid").AddToClassList("print");
    }
}`,
    },
  });

  /* 9. カラーブロックワイプ (transition) — 色帯の連続転換 */
  R({
    id: 'color-block-wipe',
    title: 'カラーブロックワイプ',
    titleEn: 'Color Block Wipe',
    category: 'transition',
    tags: ['wipe', 'color-block', 'graphic', 'diagonal'],
    description: '斜めにカットされた複数の色帯が時間差で画面を横切って覆い、覆い切った瞬間に中身を差し替えてから、続けて反対側へ抜けて次の画面を見せる、グラフィック誌面調の画面転換。章切替・シーン転換・強い場面転換に。数枚のスキュー(平行四辺形)帯を少しずつ遅延させて流し、全被覆のフレームでコンテンツを A→B に入れ替える。単色の page-wipe と違い「複数色帯の時間差 + 斜めカット + 被覆点での差し替え」が要点。実機は帯 Image を anchoredPosition で流し、被覆コールバックで内容を切替える。',
    spec: {
      target: '章/シーンの強い切替(A→B)',
      bands: { count: 3, skew: '斜めカット(平行四辺形)', stagger: 0.08, colors: ['accent', 'accent-dim', 'text/panel'] },
      cover: 'イン(左→右で全被覆)→ 被覆点で内容差し替え → アウト(右へ抜ける)',
      duration: { in: 0.5, out: 0.5 },
      note: 'page-wipe(単色)とは別。複数色帯の時間差 + 斜めカット + 被覆点での差し替えが要点。実機は帯を anchoredPosition で流す',
    },
    preview(ctx, PV) {
      const W = 190, H = 116;
      const wrap = PV.el(null, { position: 'absolute', left: '50%', top: '50%', width: W + 'px', height: H + 'px', marginLeft: -W / 2 + 'px', marginTop: -H / 2 + 'px', overflow: 'hidden', border: '1px solid var(--pv-line-strong)' });
      ctx.stage.appendChild(wrap);
      const makeScreen = (bg, accent) => {
        const s = PV.el(null, { position: 'absolute', inset: '0', background: bg, display: 'flex', flexDirection: 'column', gap: '9px', justifyContent: 'center', padding: '0 22px', boxSizing: 'border-box' });
        s.appendChild(PV.el(null, { width: '52%', height: '12px', background: accent }));
        s.appendChild(PV.el(null, { width: '100%', height: '7px', background: 'var(--pv-line-strong)' }));
        s.appendChild(PV.el(null, { width: '72%', height: '7px', background: 'var(--pv-line)' }));
        return s;
      };
      const content = makeScreen('var(--pv-panel)', 'var(--pv-line-strong)');
      wrap.appendChild(content);
      let showingB = false;
      const swap = () => {
        showingB = !showingB;
        content.style.background = showingB ? 'var(--pv-panel2)' : 'var(--pv-panel)';
        content.firstChild.style.background = showingB ? 'var(--pv-accent)' : 'var(--pv-line-strong)';
      };
      // 斜めカットの色帯(overshoot 分だけ広め)
      const OVER = 46;
      const cols = ['var(--pv-accent)', 'var(--pv-accent-dim)', 'var(--pv-text)'];
      const bands = cols.map((c, i) => {
        const b = PV.el(null, {
          position: 'absolute', top: '-4px', bottom: '-4px', width: (W + OVER) + 'px', left: '0',
          background: c, transform: `translateX(${-(W + OVER + 30)}px) skewX(-16deg)`, willChange: 'transform',
        });
        wrap.appendChild(b); return b;
      });
      const START = -(W + OVER + 30), COVER = -10, END = W + 40;

      ctx.forever(async () => {
        bands.forEach(b => b.style.transform = `translateX(${START}px) skewX(-16deg)`);
        await ctx.wait(0.6);
        // イン: 左→右で覆う(時間差)
        await Promise.all(bands.map((b, i) => ctx.tween({
          from: 0, to: 1, duration: 0.5, delay: i * 0.08, ease: 'OutCubic',
          onUpdate: (v) => { b.style.transform = `translateX(${lerp(START, COVER, v)}px) skewX(-16deg)`; },
        })));
        swap(); // 全被覆の瞬間に内容差し替え
        await ctx.wait(0.08);
        // アウト: 右へ抜ける(時間差)
        await Promise.all(bands.map((b, i) => ctx.tween({
          from: 0, to: 1, duration: 0.5, delay: (bands.length - 1 - i) * 0.08, ease: 'InCubic',
          onUpdate: (v) => { b.style.transform = `translateX(${lerp(COVER, END, v)}px) skewX(-16deg)`; },
        })));
        await ctx.wait(1.1);
      });
    },
    code: {
      litmotion: `
using System.Collections;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 斜めカットの色帯を時間差で流し、全被覆点で内容を差し替える
public class ColorBlockWipeLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;   // skew を付けた色帯(3枚程度)
    [SerializeField] float startX = -260f, coverX = -10f, endX = 230f, stagger = 0.08f;
    [SerializeField] System.Action onCovered;  // 被覆点で内容差し替え

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        for (int i = 0; i < bands.Length; i++)
            LMotion.Create(new Vector2(startX, 0), new Vector2(coverX, 0), 0.5f).WithEase(Ease.OutCubic).WithDelay(i * stagger).BindToAnchoredPosition(bands[i]);
        yield return new WaitForSeconds(0.5f + bands.Length * stagger);
        onCovered?.Invoke();
        for (int i = 0; i < bands.Length; i++)
            LMotion.Create(new Vector2(coverX, 0), new Vector2(endX, 0), 0.5f).WithEase(Ease.InCubic).WithDelay((bands.Length - 1 - i) * stagger).BindToAnchoredPosition(bands[i]);
    }
}`,
      dotween: `
using System.Collections;
using DG.Tweening;
using UnityEngine;

public class ColorBlockWipeDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;
    [SerializeField] float startX = -260f, coverX = -10f, endX = 230f, stagger = 0.08f;
    [SerializeField] System.Action onCovered;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        for (int i = 0; i < bands.Length; i++)
        {
            bands[i].anchoredPosition = new Vector2(startX, 0f);
            bands[i].DOAnchorPosX(coverX, 0.5f).SetEase(Ease.OutCubic).SetDelay(i * stagger);
        }
        yield return new WaitForSeconds(0.5f + bands.Length * stagger);
        onCovered?.Invoke();
        for (int i = 0; i < bands.Length; i++)
            bands[i].DOAnchorPosX(endX, 0.5f).SetEase(Ease.InCubic).SetDelay((bands.Length - 1 - i) * stagger);
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ColorBlockWipeCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] bands;
    [SerializeField] float startX = -260f, coverX = -10f, endX = 230f, stagger = 0.08f;
    [SerializeField] System.Action onCovered;

    public void Play() => StartCoroutine(Run());

    IEnumerator Run()
    {
        yield return Move(startX, coverX, 0.5f, true, false);   // イン(OutCubic)
        onCovered?.Invoke();
        yield return Move(coverX, endX, 0.5f, false, true);     // アウト(InCubic)
    }

    IEnumerator Move(float from, float to, float dur, bool outCubic, bool reverse)
    {
        float span = dur + bands.Length * stagger;
        for (float t = 0f; t < span; t += Time.deltaTime)
        {
            for (int i = 0; i < bands.Length; i++)
            {
                float d = (reverse ? (bands.Length - 1 - i) : i) * stagger;
                float x = Mathf.Clamp01((t - d) / dur);
                float e = outCubic ? 1f - Mathf.Pow(1f - x, 3f) : x * x * x;
                bands[i].anchoredPosition = new Vector2(Mathf.Lerp(from, to, e), 0f);
            }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) =====
 * 各色帯は rotate(skew 代替) を付けて translate の transition で流す。
 * transition-delay で時間差を付け、被覆完了のタイミングで内容を差し替える。 */
.wipe-band { position: absolute; top: -4px; bottom: -4px; width: 236px; rotate: -16deg; translate: -260px 0; transition: translate 500ms ease-out; }
.wipe-band.cover { translate: -10px 0; }
.wipe-band.out   { translate: 230px 0; transition: translate 500ms ease-in; }

/* ===== C# (.cs) ===== */
using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

public class ColorBlockWipeUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float stagger = 0.08f;
    System.Action onCovered;

    public void Play(System.Action swapContent) { onCovered = swapContent; StartCoroutine(Run()); }

    IEnumerator Run()
    {
        var bands = document.rootVisualElement.Query<VisualElement>(className: "wipe-band").ToList();
        for (int i = 0; i < bands.Count; i++)
        {
            bands[i].style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue(i * stagger * 1000f, TimeUnit.Millisecond) };
            bands[i].AddToClassList("cover");
        }
        yield return new WaitForSeconds(0.5f + bands.Count * stagger);
        onCovered?.Invoke();
        for (int i = 0; i < bands.Count; i++)
        {
            bands[i].style.transitionDelay = new System.Collections.Generic.List<TimeValue> { new TimeValue((bands.Count - 1 - i) * stagger * 1000f, TimeUnit.Millisecond) };
            bands[i].RemoveFromClassList("cover"); bands[i].AddToClassList("out");
        }
    }
}`,
    },
  });
})();
