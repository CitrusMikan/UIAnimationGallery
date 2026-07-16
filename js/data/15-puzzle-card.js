/* 15-puzzle-card.js — パズル / カードの手触りモーション (第1弾 2種)
 *   match-pop / card-deal
 * 配属: attention / list。各種にUI Toolkit実装を同梱。
 * すべて汎用技法を自前実装 (実在作品名・ロゴ・キャラ名は不使用)。 */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* 1. マッチ消去 (attention) */
  R({
    id: 'match-pop',
    title: 'マッチ消去',
    titleEn: 'Match Pop',
    category: 'attention',
    tags: ['パズル', '消去', 'マッチ3', 'ポップ'],
    description: 'そろったピースがきゅっと膨らんで弾け、きらめきを残して消える。マッチ3・同色そろえ・ブロック消しの快感演出に。膨らみを OutBack、消滅を InQuad の縮小で作り、消える瞬間に小さなスパークを散らすと爽快感が増す。列でわずかに時間差をつけると連鎖感が出る。',
    spec: {
      pop: { target: 'localScale', to: 1.25, duration: 0.14, ease: 'OutBack' },
      vanish: { target: 'localScale 1.25→0', alpha: '1→0', duration: 0.2, ease: 'InQuad' },
      spark: '消滅時に数個の粒を放射 (OutQuad で外へ + フェード)',
      stagger: 0.04,
    },
    preview(ctx, PV) {
      const N = 5, GAP = 6, SIZE = 30;
      const grid = PV.el(null, { position: 'relative', width: (N * SIZE + (N - 1) * GAP) + 'px', height: (N * SIZE + (N - 1) * GAP) + 'px' });
      ctx.stage.appendChild(grid);
      const cells = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const cell = PV.el(null, {
          position: 'absolute', left: c * (SIZE + GAP) + 'px', top: r * (SIZE + GAP) + 'px',
          width: SIZE + 'px', height: SIZE + 'px', borderRadius: '7px', willChange: 'transform,opacity',
          background: 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-line-strong)',
        });
        grid.appendChild(cell);
        cells.push({ el: cell, r, c });
      }
      const spark = (x, y) => {
        for (let i = 0; i < 5; i++) {
          const p = PV.el(null, { position: 'absolute', left: x + 'px', top: y + 'px', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--pv-accent)', willChange: 'transform,opacity', pointerEvents: 'none' });
          grid.appendChild(p);
          const a = (i / 5) * Math.PI * 2, dist = 16 + Math.random() * 10;
          ctx.tween({ from: 0, to: 1, duration: 0.4, ease: 'OutQuad', onUpdate: v => { p.style.transform = `translate(${Math.cos(a) * dist * v}px,${Math.sin(a) * dist * v}px)`; p.style.opacity = 1 - v; }, onComplete: () => p.remove() });
        }
      };
      const popCell = async (cell, delay) => {
        cell.el.style.zIndex = '1';
        cell.el.style.background = 'var(--pv-accent)';
        await ctx.tween({ from: 1, to: 1.25, duration: 0.14, delay, ease: 'OutBack', onUpdate: v => cell.el.style.transform = `scale(${v})` });
        const cx = cell.c * (SIZE + GAP) + SIZE / 2, cy = cell.r * (SIZE + GAP) + SIZE / 2;
        spark(cx, cy);
        await ctx.tween({ from: 1.25, to: 0, duration: 0.2, ease: 'InQuad', onUpdate: (v, t) => { cell.el.style.transform = `scale(${v})`; cell.el.style.opacity = 1 - t; } });
      };
      const restore = cell => { cell.el.style.transform = 'scale(1)'; cell.el.style.opacity = '1'; cell.el.style.zIndex = '0'; cell.el.style.background = 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))'; };
      ctx.forever(async () => {
        await ctx.wait(0.7);
        // ランダムな一列(または一行)をマッチ扱いにして消す
        const row = Math.floor(Math.random() * N);
        const matched = cells.filter(c => c.r === row);
        await Promise.all(matched.map((c, i) => popCell(c, i * 0.04)));
        await ctx.wait(0.5);
        matched.forEach(restore);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// そろったピースを膨らませてから縮小消滅させる
public class MatchPopLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] pieces;
    [SerializeField] CanvasGroup[] groups;
    [SerializeField] float stagger = 0.04f;

    public void Clear(int[] matchedIndices)
    {
        for (int i = 0; i < matchedIndices.Length; i++)
        {
            int idx = matchedIndices[i];
            float delay = i * stagger;
            LMotion.Create(1f, 1.25f, 0.14f).WithEase(Ease.OutBack).WithDelay(delay)
                .Bind(s => pieces[idx].localScale = Vector3.one * s);
            LMotion.Create(1.25f, 0f, 0.2f).WithEase(Ease.InQuad).WithDelay(delay + 0.14f)
                .Bind(s => pieces[idx].localScale = Vector3.one * s);
            LMotion.Create(1f, 0f, 0.2f).WithDelay(delay + 0.14f).BindToAlpha(groups[idx]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class MatchPopDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] pieces;
    [SerializeField] CanvasGroup[] groups;
    [SerializeField] float stagger = 0.04f;

    public void Clear(int[] matchedIndices)
    {
        for (int i = 0; i < matchedIndices.Length; i++)
        {
            int idx = matchedIndices[i];
            float delay = i * stagger;
            DOTween.Sequence().SetDelay(delay)
                .Append(pieces[idx].DOScale(1.25f, 0.14f).SetEase(Ease.OutBack))
                .Append(pieces[idx].DOScale(0f, 0.2f).SetEase(Ease.InQuad))
                .Join(groups[idx].DOFade(0f, 0.2f));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class MatchPopCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] pieces;
    [SerializeField] CanvasGroup[] groups;
    [SerializeField] float stagger = 0.04f;

    public void Clear(int[] matchedIndices)
    {
        for (int i = 0; i < matchedIndices.Length; i++)
            StartCoroutine(Pop(matchedIndices[i], i * stagger));
    }

    IEnumerator Pop(int idx, float delay)
    {
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.14f) { t += Time.deltaTime; pieces[idx].localScale = Vector3.one * Mathf.LerpUnclamped(1f, 1.25f, OutBack(Mathf.Clamp01(t / 0.14f))); yield return null; }
        t = 0f;
        while (t < 0.2f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.2f);
            pieces[idx].localScale = Vector3.one * Mathf.Lerp(1.25f, 0f, p * p); // InQuad
            groups[idx].alpha = 1f - p;
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
.piece { scale: 1 1; opacity: 1; }
.piece.pop    { scale: 1.25 1.25; transition: scale 140ms ease-out-back; }
.piece.vanish { scale: 0 0; opacity: 0; transition: scale 200ms ease-in, opacity 200ms ease-in; }

/* ===== C# (.cs) — pop → vanish の順にクラスを付ける ===== */
using UnityEngine.UIElements;
using UnityEngine;

public class MatchPopUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Clear(string[] pieceNames)
    {
        var root = document.rootVisualElement;
        for (int i = 0; i < pieceNames.Length; i++)
        {
            var piece = root.Q<VisualElement>(pieceNames[i]);
            long delay = (long)(i * 40);
            piece.schedule.Execute(() => piece.AddToClassList("pop")).ExecuteLater(delay);
            piece.schedule.Execute(() => { piece.RemoveFromClassList("pop"); piece.AddToClassList("vanish"); }).ExecuteLater(delay + 140);
        }
    }
}`,
    },
  });

  /* 2. カード配り (list) */
  R({
    id: 'card-deal',
    title: 'カード配り',
    titleEn: 'Card Deal',
    category: 'list',
    tags: ['カード', '配り', 'デッキ', '手札'],
    description: 'デッキの位置から複数枚のカードが弧を描いて飛び、手札として扇状に並ぶ。カードゲームの初期手札・ドロー・役の提示に。各カードを時間差(stagger)で送り、到着位置で少し傾けて扇形にすると自然。移動は OutCubic、最後の着地に軽い overshoot を足すと手札が締まる。',
    spec: {
      deal: { path: 'デッキ座標 → 手札スロット (弧)', per_card: { duration: 0.35, ease: 'OutCubic' }, stagger: 0.08 },
      fan: '手札は中央基準に角度 ±spread、Y を弧状に下げる',
      arc: '移動中に少し持ち上げてから降ろすと放物線に見える',
    },
    preview(ctx, PV) {
      const N = 5;
      const deck = PV.el(null, {
        position: 'absolute', left: '18px', top: '18px', width: '34px', height: '48px', borderRadius: '5px',
        background: 'linear-gradient(150deg,var(--pv-accent-dim),var(--pv-accent))', border: '1px solid var(--pv-line-strong)',
      });
      ctx.stage.appendChild(deck);
      const stageW = 220, cardW = 34, cardH = 48;
      const slots = [];
      for (let i = 0; i < N; i++) {
        const centered = i - (N - 1) / 2;
        slots.push({ x: stageW / 2 + centered * 32 - cardW / 2, y: 78 + Math.abs(centered) * 6, rot: centered * 8 });
      }
      const deckX = 18, deckY = 18;
      const makeCard = () => {
        const c = PV.el(null, {
          position: 'absolute', width: cardW + 'px', height: cardH + 'px', borderRadius: '5px', willChange: 'transform',
          background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '1px solid var(--pv-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pv-accent)', fontSize: '16px', fontFamily: "'Oswald',sans-serif", fontWeight: '700',
        }, '♦');
        ctx.stage.appendChild(c);
        return c;
      };
      const dealOne = (card, slot, delay) => ctx.tween({
        from: 0, to: 1, duration: 0.35, delay, ease: 'OutCubic',
        onUpdate: v => {
          const x = lerp(deckX, slot.x, v), y = lerp(deckY, slot.y, v) - Math.sin(v * Math.PI) * 26;
          const rot = lerp(0, slot.rot, v);
          card.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg)`;
        },
      });
      ctx.forever(async () => {
        const cards = slots.map(makeCard);
        await Promise.all(cards.map((c, i) => dealOne(c, slots[i], i * 0.08)));
        await ctx.wait(1.6);
        cards.forEach(c => c.remove());
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// デッキ位置から手札スロットへ、少し弧を描かせて配る
public class CardDealLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform deck;
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] slots;        // 手札スロットの anchoredPosition
    [SerializeField] float[] slotAngles;     // 扇形の角度
    [SerializeField] float stagger = 0.08f;

    public void Deal()
    {
        for (int i = 0; i < cards.Length; i++)
        {
            int idx = i;
            cards[idx].anchoredPosition = deck.anchoredPosition;
            LMotion.Create(deck.anchoredPosition, slots[idx], 0.35f)
                .WithEase(Ease.OutCubic).WithDelay(i * stagger)
                .BindToAnchoredPosition(cards[idx]);
            LMotion.Create(0f, slotAngles[idx], 0.35f)
                .WithEase(Ease.OutCubic).WithDelay(i * stagger)
                .Bind(z => cards[idx].localEulerAngles = new Vector3(0, 0, z));
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CardDealDOTween : MonoBehaviour
{
    [SerializeField] RectTransform deck;
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] slots;
    [SerializeField] float[] slotAngles;
    [SerializeField] float stagger = 0.08f;

    public void Deal()
    {
        for (int i = 0; i < cards.Length; i++)
        {
            cards[i].anchoredPosition = deck.anchoredPosition;
            cards[i].DOAnchorPos(slots[i], 0.35f).SetEase(Ease.OutCubic).SetDelay(i * stagger);
            cards[i].DOLocalRotate(new Vector3(0, 0, slotAngles[i]), 0.35f).SetEase(Ease.OutCubic).SetDelay(i * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CardDealCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform deck;
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] slots;
    [SerializeField] float[] slotAngles;
    [SerializeField] float stagger = 0.08f;

    public void Deal()
    {
        for (int i = 0; i < cards.Length; i++)
            StartCoroutine(Move(cards[i], slots[i], slotAngles[i], i * stagger));
    }

    IEnumerator Move(RectTransform card, Vector2 to, float angle, float delay)
    {
        Vector2 from = deck.anchoredPosition;
        card.anchoredPosition = from;
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.35f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.35f), 3f); // OutCubic
            Vector2 p = Vector2.Lerp(from, to, e);
            p.y += Mathf.Sin(e * Mathf.PI) * 26f;   // 弧
            card.anchoredPosition = p;
            card.localEulerAngles = new Vector3(0, 0, Mathf.Lerp(0f, angle, e));
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.deal-card {
    position: absolute;
    transition: translate 350ms ease-out-cubic, rotate 350ms ease-out-cubic;
}

/* ===== C# (.cs) — 各カードに遅延を付けてスロットへ ===== */
using UnityEngine;
using UnityEngine.UIElements;
using System.Collections.Generic;

public class CardDealUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2[] slots;
    [SerializeField] float[] slotAngles;
    [SerializeField] float stagger = 0.08f;

    public void Deal()
    {
        var cards = document.rootVisualElement.Query<VisualElement>(className: "deal-card").ToList();
        for (int i = 0; i < cards.Count; i++)
        {
            cards[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
            cards[i].style.translate = new Translate(slots[i].x, slots[i].y, 0);
            cards[i].style.rotate = new Rotate(new Angle(slotAngles[i], AngleUnit.Degree));
        }
    }
}`,
    },
  });

  /* 3. タイル落下 (list) */
  R({
    id: 'tile-drop',
    title: 'タイル落下',
    titleEn: 'Tile Drop',
    category: 'list',
    tags: ['パズル', '落下', 'カスケード', '重力'],
    description: '上からピースが重力で降ってきて、着地の瞬間に OutBounce で弾んで収まる。落ち物パズルのボード補充・カスケード落下・盤面リフィルに。列ごとにわずかな時間差(stagger)を付けると連鎖的に降り注ぐ躍動感が出る。落下距離に応じて時間を伸ばすと重さの説得力が増す。',
    spec: {
      drop: { target: 'anchoredPosition.y', from: '盤外上 → 目標段', duration: 0.5, ease: 'OutBounce' },
      stagger: { per_column: 0.06, note: '列インデックスで遅延を付けカスケード化' },
      distance: '落下距離が長いほど duration を微増させると自然',
    },
    preview(ctx, PV) {
      const COLS = 6, GAP = 5, SIZE = 26, TOP = 12;
      const boardW = COLS * SIZE + (COLS - 1) * GAP;
      const board = PV.el(null, { position: 'relative', width: boardW + 'px', height: '116px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--pv-line)', background: 'var(--pv-panel)' });
      ctx.stage.appendChild(board);
      const ROWS = 3, floorY = 116 - SIZE - 6;
      const makeTile = (col) => {
        const t = PV.el(null, {
          position: 'absolute', left: (6 + col * (SIZE + GAP)) + 'px', top: '0px',
          width: SIZE + 'px', height: SIZE + 'px', borderRadius: '6px', willChange: 'transform',
          background: 'linear-gradient(150deg,var(--pv-accent),var(--pv-accent-dim))', border: '1px solid var(--pv-line-strong)',
        });
        board.appendChild(t);
        return t;
      };
      const dropTile = (tile, targetY, delay) => ctx.tween({
        from: -SIZE, to: targetY, duration: 0.55, delay, ease: 'OutBounce',
        onUpdate: v => tile.style.transform = `translateY(${v}px)`,
      });
      ctx.forever(async () => {
        const tiles = [];
        const jobs = [];
        for (let col = 0; col < COLS; col++) {
          for (let row = 0; row < ROWS; row++) {
            const tile = makeTile(col);
            tiles.push(tile);
            const targetY = floorY - row * (SIZE + GAP);
            jobs.push(dropTile(tile, targetY, col * 0.06 + row * 0.05));
          }
        }
        await Promise.all(jobs);
        await ctx.wait(0.9);
        await Promise.all(tiles.map(t => ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: (v) => t.style.opacity = v })));
        tiles.forEach(t => t.remove());
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 盤外の上から目標段へ、OutBounce で弾ませて落とす
public class TileDropLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] tiles;
    [SerializeField] float[] targetY;     // 各タイルの着地 y
    [SerializeField] int[] column;        // 各タイルの列
    [SerializeField] float spawnY = 320f; // 盤外上の湧き位置
    [SerializeField] float stagger = 0.06f;

    public void Refill()
    {
        for (int i = 0; i < tiles.Length; i++)
        {
            int idx = i;
            var p = tiles[idx].anchoredPosition; p.y = spawnY;
            tiles[idx].anchoredPosition = p;
            LMotion.Create(spawnY, targetY[idx], 0.55f)
                .WithEase(Ease.OutBounce).WithDelay(column[idx] * stagger)
                .Bind(y => { var a = tiles[idx].anchoredPosition; a.y = y; tiles[idx].anchoredPosition = a; });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class TileDropDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] tiles;
    [SerializeField] float[] targetY;
    [SerializeField] int[] column;
    [SerializeField] float spawnY = 320f;
    [SerializeField] float stagger = 0.06f;

    public void Refill()
    {
        for (int i = 0; i < tiles.Length; i++)
        {
            var p = tiles[i].anchoredPosition; p.y = spawnY;
            tiles[i].anchoredPosition = p;
            tiles[i].DOAnchorPosY(targetY[i], 0.55f)
                .SetEase(Ease.OutBounce).SetDelay(column[i] * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class TileDropCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] tiles;
    [SerializeField] float[] targetY;
    [SerializeField] int[] column;
    [SerializeField] float spawnY = 320f;
    [SerializeField] float stagger = 0.06f;

    public void Refill()
    {
        for (int i = 0; i < tiles.Length; i++)
            StartCoroutine(Drop(tiles[i], targetY[i], column[i] * stagger));
    }

    IEnumerator Drop(RectTransform tile, float toY, float delay)
    {
        var p = tile.anchoredPosition; p.y = spawnY; tile.anchoredPosition = p;
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.55f)
        {
            t += Time.deltaTime;
            float e = OutBounce(Mathf.Clamp01(t / 0.55f));
            var a = tile.anchoredPosition; a.y = Mathf.LerpUnclamped(spawnY, toY, e); tile.anchoredPosition = a;
            yield return null;
        }
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
/* ===== UI Toolkit — USS (.uss) ===== */
.tile { position: absolute; transition: translate 550ms ease-out-bounce; }
.tile.spawn   { translate: 0 -320px; }
.tile.settled { translate: 0 0; }

/* ===== C# (.cs) — 列インデックスで遅延を付けて落とす ===== */
using UnityEngine;
using UnityEngine.UIElements;
using System.Collections.Generic;

public class TileDropUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] float stagger = 0.06f;

    public void Refill()
    {
        var tiles = document.rootVisualElement.Query<VisualElement>(className: "tile").ToList();
        for (int i = 0; i < tiles.Count; i++)
        {
            var tile = tiles[i];
            int col = int.Parse(tile.name.Split('_')[1]); // "tile_<col>_<row>"
            tile.AddToClassList("spawn");
            tile.schedule.Execute(() =>
            {
                tile.style.transitionDelay = new List<TimeValue> { new TimeValue(col * stagger, TimeUnit.Second) };
                tile.RemoveFromClassList("spawn");
                tile.AddToClassList("settled");
            }).ExecuteLater(16);
        }
    }
}`,
    },
  });

  /* 4. タイルスワップ (widget) */
  R({
    id: 'tile-swap',
    title: 'タイルスワップ',
    titleEn: 'Tile Swap',
    category: 'widget',
    tags: ['パズル', '入替', 'スワップ'],
    interactive: true,
    description: '隣り合う2ピースが弧を描いて位置を入れ替える。成立手ならそのまま定着、無効手ならいったん入れ替えてバネのようにすぐ戻す。マッチ3の操作フィードバックに。入替は OutCubic、無効時の戻しは OutBack で軽く跳ね返すと「ダメ」の手触りが伝わる。クリックでも交換をトリガできる。',
    spec: {
      swap: { path: '2ピースを弧で交換', duration: 0.26, ease: 'OutCubic' },
      revert: { when: '無効手', back: 'すぐ戻す', duration: 0.24, ease: 'OutBack' },
      arc: '交換の中間で互いに逆向きに膨らませて衝突を避ける',
    },
    preview(ctx, PV) {
      const SIZE = 34, GAP = 10, N = 3;
      const rowW = N * SIZE + (N - 1) * GAP;
      const row = PV.el(null, { position: 'relative', width: rowW + 'px', height: SIZE + 'px' });
      ctx.stage.appendChild(row);
      const suits = ['♠', '♥', '♦'];
      const tiles = [];
      for (let i = 0; i < N; i++) {
        const t = PV.el(null, {
          position: 'absolute', left: '0px', top: '0px', width: SIZE + 'px', height: SIZE + 'px', borderRadius: '7px', willChange: 'transform',
          background: 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pv-accent)', fontSize: '18px', cursor: 'pointer',
          transform: `translate(${i * (SIZE + GAP)}px,0px)`,
        }, suits[i]);
        row.appendChild(t);
        tiles.push({ el: t, pos: i });
      }
      const posX = p => p * (SIZE + GAP);
      let busy = false;
      const swap = async (a, b, valid) => {
        if (busy) return; busy = true;
        const ta = tiles[a], tb = tiles[b];
        const xa = posX(ta.pos), xb = posX(tb.pos);
        ta.el.style.zIndex = '2';
        await Promise.all([
          ctx.tween({ from: 0, to: 1, duration: 0.26, ease: 'OutCubic', onUpdate: v => ta.el.style.transform = `translate(${lerp(xa, xb, v)}px,${-Math.sin(v * Math.PI) * 12}px)` }),
          ctx.tween({ from: 0, to: 1, duration: 0.26, ease: 'OutCubic', onUpdate: v => tb.el.style.transform = `translate(${lerp(xb, xa, v)}px,${Math.sin(v * Math.PI) * 12}px)` }),
        ]);
        if (valid) {
          const tmp = ta.pos; ta.pos = tb.pos; tb.pos = tmp;
          const na = tiles[a], nb = tiles[b];
          [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
          void na; void nb;
        } else {
          await ctx.wait(0.12);
          await Promise.all([
            ctx.tween({ from: 0, to: 1, duration: 0.24, ease: 'OutBack', onUpdate: v => ta.el.style.transform = `translate(${lerp(xb, xa, v)}px,${-Math.sin(v * Math.PI) * 8}px)` }),
            ctx.tween({ from: 0, to: 1, duration: 0.24, ease: 'OutBack', onUpdate: v => tb.el.style.transform = `translate(${lerp(xa, xb, v)}px,${Math.sin(v * Math.PI) * 8}px)` }),
          ]);
        }
        ta.el.style.zIndex = '0';
        busy = false;
      };
      // クリックで隣と交換
      tiles.forEach((t, i) => t.el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (i < N - 1) swap(i, i + 1, true);
      }));
      ctx.forever(async () => {
        await ctx.wait(0.9);
        await swap(0, 1, false); // 無効手デモ (戻す)
        await ctx.wait(0.8);
        await swap(1, 2, true);  // 有効手デモ
        await ctx.wait(1.0);
        await swap(0, 1, true);  // 元に戻す
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 隣接2ピースを弧で交換。無効手なら OutBack で戻す
public class TileSwapLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform a;
    [SerializeField] RectTransform b;

    public void Swap(bool valid)
    {
        Vector2 pa = a.anchoredPosition, pb = b.anchoredPosition;
        LMotion.Create(pa, pb, 0.26f).WithEase(Ease.OutCubic).BindToAnchoredPosition(a);
        LMotion.Create(pb, pa, 0.26f).WithEase(Ease.OutCubic).BindToAnchoredPosition(b)
            .AddTo(gameObject);
        if (!valid)
        {
            LMotion.Create(pb, pa, 0.24f).WithEase(Ease.OutBack).WithDelay(0.38f).BindToAnchoredPosition(a);
            LMotion.Create(pa, pb, 0.24f).WithEase(Ease.OutBack).WithDelay(0.38f).BindToAnchoredPosition(b);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class TileSwapDOTween : MonoBehaviour
{
    [SerializeField] RectTransform a;
    [SerializeField] RectTransform b;

    public void Swap(bool valid)
    {
        Vector2 pa = a.anchoredPosition, pb = b.anchoredPosition;
        var seq = DOTween.Sequence();
        seq.Append(a.DOAnchorPos(pb, 0.26f).SetEase(Ease.OutCubic))
           .Join(b.DOAnchorPos(pa, 0.26f).SetEase(Ease.OutCubic));
        if (!valid)
        {
            seq.AppendInterval(0.12f)
               .Append(a.DOAnchorPos(pa, 0.24f).SetEase(Ease.OutBack))
               .Join(b.DOAnchorPos(pb, 0.24f).SetEase(Ease.OutBack));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class TileSwapCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform a;
    [SerializeField] RectTransform b;

    public void Swap(bool valid) => StartCoroutine(Run(valid));

    IEnumerator Run(bool valid)
    {
        Vector2 pa = a.anchoredPosition, pb = b.anchoredPosition;
        yield return Move(pa, pb, 0.26f, false);
        if (!valid)
        {
            yield return new WaitForSeconds(0.12f);
            yield return Move(pb, pa, 0.24f, true);
        }
    }

    IEnumerator Move(Vector2 fromA, Vector2 toA, float dur, bool back)
    {
        Vector2 fromB = toA, toB = fromA;
        float t = 0f;
        while (t < dur)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / dur);
            float e = back ? OutBack(p) : 1f - Mathf.Pow(1f - p, 3f); // OutBack / OutCubic
            a.anchoredPosition = Vector2.LerpUnclamped(fromA, toA, e);
            b.anchoredPosition = Vector2.LerpUnclamped(fromB, toB, e);
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.swap-tile { position: absolute; transition: translate 260ms ease-out-cubic; }
.swap-tile.revert { transition: translate 240ms ease-out-back; }

/* ===== C# (.cs) — 座標を入れ替え、無効手はもう一度戻す ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class TileSwapUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Swap(string nameA, string nameB, bool valid)
    {
        var root = document.rootVisualElement;
        var a = root.Q<VisualElement>(nameA);
        var b = root.Q<VisualElement>(nameB);
        var ta = a.resolvedStyle.translate; var tb = b.resolvedStyle.translate;
        a.style.translate = new Translate(tb.x, tb.y, 0);
        b.style.translate = new Translate(ta.x, ta.y, 0);
        if (!valid)
        {
            a.schedule.Execute(() =>
            {
                a.AddToClassList("revert"); b.AddToClassList("revert");
                a.style.translate = new Translate(ta.x, ta.y, 0);
                b.style.translate = new Translate(tb.x, tb.y, 0);
            }).ExecuteLater(380);
        }
    }
}`,
    },
  });

  /* 5. ライン消去 (attention) */
  R({
    id: 'line-clear',
    title: 'ライン消去',
    titleEn: 'Line Clear',
    category: 'attention',
    tags: ['パズル', 'ライン', 'フラッシュ', '消去'],
    description: 'そろった一列が白く発光フラッシュしてから、横方向に潰れて消え、上の段がすとんと詰まって落ちる。落ち物パズルのライン消去・行クリアの爽快演出に。フラッシュ→縮小(消去)→上段の落下を段階的につなぐと因果が伝わる。複数行同時消しは行ごとに軽い時間差を付ける。',
    spec: {
      flash: { target: '対象行を白発光', duration: 0.12, note: 'brightness/overlay を一瞬上げる' },
      collapse: { target: 'scaleY 1→0', duration: 0.18, ease: 'InQuad' },
      settle: { target: '上段が消えた行数ぶん落下', duration: 0.24, ease: 'OutQuad' },
    },
    preview(ctx, PV) {
      const COLS = 7, GAP = 4, SIZE = 20, PADX = 8;
      const boardW = COLS * SIZE + (COLS - 1) * GAP + PADX * 2;
      const board = PV.el(null, { position: 'relative', width: boardW + 'px', height: '120px', borderRadius: '8px', border: '1px solid var(--pv-line)', background: 'var(--pv-panel)', overflow: 'hidden' });
      ctx.stage.appendChild(board);
      const ROWS = 4, rowH = SIZE + GAP, baseY = 120 - ROWS * rowH - 4;
      const rows = [];
      const buildRow = (r) => {
        const cells = [];
        for (let c = 0; c < COLS; c++) {
          const cell = PV.el(null, {
            position: 'absolute', left: (PADX + c * (SIZE + GAP)) + 'px', width: SIZE + 'px', height: SIZE + 'px', borderRadius: '4px', willChange: 'transform,opacity',
            background: 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-line-strong)',
          });
          board.appendChild(cell);
          cells.push(cell);
        }
        const wrap = { cells, y: baseY + r * rowH };
        cells.forEach(cell => cell.style.top = wrap.y + 'px');
        return wrap;
      };
      for (let r = 0; r < ROWS; r++) rows.push(buildRow(r));
      const flash = row => row.cells.forEach(cell => {
        cell.style.background = 'var(--pv-text)';
        cell.style.borderColor = 'var(--pv-text)';
      });
      const unflash = row => row.cells.forEach(cell => {
        cell.style.background = 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))';
        cell.style.borderColor = 'var(--pv-line-strong)';
      });
      ctx.forever(async () => {
        await ctx.wait(0.7);
        const target = rows[ROWS - 1]; // 最下段を消す
        flash(target);
        await ctx.wait(0.12);
        await Promise.all(target.cells.map((cell, i) => ctx.tween({ from: 1, to: 0, duration: 0.18, delay: i * 0.015, ease: 'InQuad', onUpdate: (v, t) => { cell.style.transform = `scaleY(${v})`; cell.style.opacity = 1 - t; } })));
        target.cells.forEach(cell => cell.style.display = 'none');
        // 上段が1段ぶん落下
        const above = rows.slice(0, ROWS - 1);
        await Promise.all(above.map(row => ctx.tween({ from: row.y, to: row.y + rowH, duration: 0.24, ease: 'OutQuad', onUpdate: v => row.cells.forEach(cell => cell.style.top = v + 'px') })));
        await ctx.wait(0.8);
        // リセット
        rows.forEach(row => row.cells.forEach(cell => cell.remove()));
        rows.length = 0;
        for (let r = 0; r < ROWS; r++) rows.push(buildRow(r));
        void unflash;
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.UI;

// 行フラッシュ → 横に潰す → 上段を詰める
public class LineClearLitMotion : MonoBehaviour
{
    [SerializeField] Image[] rowCells;        // 消す行のセル
    [SerializeField] RectTransform[] above;   // 上に積まれた行(親)
    [SerializeField] float rowHeight = 24f;

    public void Clear()
    {
        foreach (var img in rowCells) img.color = Color.white; // フラッシュ
        for (int i = 0; i < rowCells.Length; i++)
        {
            var rt = rowCells[i].rectTransform;
            LMotion.Create(1f, 0f, 0.18f).WithEase(Ease.InQuad).WithDelay(0.12f + i * 0.015f)
                .Bind(s => rt.localScale = new Vector3(rt.localScale.x, s, 1f));
        }
        foreach (var row in above)
        {
            float y = row.anchoredPosition.y;
            LMotion.Create(y, y - rowHeight, 0.24f).WithEase(Ease.OutQuad).WithDelay(0.3f)
                .Bind(v => { var p = row.anchoredPosition; p.y = v; row.anchoredPosition = p; });
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using UnityEngine.UI;

public class LineClearDOTween : MonoBehaviour
{
    [SerializeField] Image[] rowCells;
    [SerializeField] RectTransform[] above;
    [SerializeField] float rowHeight = 24f;

    public void Clear()
    {
        foreach (var img in rowCells) img.color = Color.white;
        var seq = DOTween.Sequence().AppendInterval(0.12f);
        for (int i = 0; i < rowCells.Length; i++)
            seq.Join(rowCells[i].rectTransform.DOScaleY(0f, 0.18f).SetEase(Ease.InQuad).SetDelay(i * 0.015f));
        foreach (var row in above)
            seq.Join(row.DOAnchorPosY(row.anchoredPosition.y - rowHeight, 0.24f).SetEase(Ease.OutQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

public class LineClearCoroutine : MonoBehaviour
{
    [SerializeField] Image[] rowCells;
    [SerializeField] RectTransform[] above;
    [SerializeField] float rowHeight = 24f;

    public void Clear() => StartCoroutine(Run());

    IEnumerator Run()
    {
        foreach (var img in rowCells) img.color = Color.white;
        yield return new WaitForSeconds(0.12f);
        float t = 0f;
        while (t < 0.18f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.18f);
            float s = Mathf.Lerp(1f, 0f, p * p); // InQuad
            foreach (var img in rowCells) { var rt = img.rectTransform; rt.localScale = new Vector3(rt.localScale.x, s, 1f); }
            yield return null;
        }
        // 上段を1段ぶん落とす
        Vector2[] from = new Vector2[above.Length];
        for (int i = 0; i < above.Length; i++) from[i] = above[i].anchoredPosition;
        t = 0f;
        while (t < 0.24f)
        {
            t += Time.deltaTime;
            float e = 1f - (1f - Mathf.Clamp01(t / 0.24f)) * (1f - Mathf.Clamp01(t / 0.24f)); // OutQuad
            for (int i = 0; i < above.Length; i++)
            {
                var p = above[i].anchoredPosition; p.y = Mathf.Lerp(from[i].y, from[i].y - rowHeight, e); above[i].anchoredPosition = p;
            }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.lc-cell  { transition: scale 180ms ease-in, opacity 180ms ease-in, background-color 120ms linear; }
.lc-cell.flash    { background-color: white; }
.lc-cell.collapse { scale: 1 0; opacity: 0; }
.lc-row   { transition: translate 240ms ease-out; }
.lc-row.settle { translate: 0 24px; } /* 消えた行数ぶん下げる */

/* ===== C# (.cs) — フラッシュ→潰す→上段を詰める ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class LineClearUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Clear(string rowName)
    {
        var root = document.rootVisualElement;
        var row = root.Q<VisualElement>(rowName);
        row.Query<VisualElement>(className: "lc-cell").ForEach(c => c.AddToClassList("flash"));
        row.schedule.Execute(() =>
            row.Query<VisualElement>(className: "lc-cell").ForEach(c => c.AddToClassList("collapse"))
        ).ExecuteLater(120);
        row.schedule.Execute(() =>
            root.Query<VisualElement>(className: "lc-row").ForEach(r => r.AddToClassList("settle"))
        ).ExecuteLater(300);
    }
}`,
    },
  });

  /* 6. チェインコンボ (text) */
  R({
    id: 'chain-combo',
    title: 'チェインコンボ',
    titleEn: 'Chain Combo',
    category: 'text',
    tags: ['パズル', 'コンボ', '連鎖', '倍率'],
    description: '連鎖が続くたびに「COMBO x2 → x3 → x4 …」と数字と文字サイズがエスカレートしてポップアップする。連鎖数の積み上げを段階的に見せる演出で、瞬間パンチのコンボカウンタとは用途が異なる。倍率が上がるほどスケールと色の強さを増し、OutBack で飛び出して InQuad で余韻を残すと勢いが伝わる。',
    spec: {
      popup: { target: 'localScale', from: 0.6, to: '1 + combo*0.06', duration: 0.24, ease: 'OutBack' },
      escalate: '連鎖ごとに文字サイズと発色を強め、少し上へ持ち上げる',
      settle: { hold: 0.5, ease: 'InQuad' },
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', width: '200px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      ctx.stage.appendChild(wrap);
      const label = PV.el(null, {
        position: 'absolute', display: 'flex', alignItems: 'baseline', gap: '4px', willChange: 'transform,opacity',
        fontFamily: "'Oswald',sans-serif", fontWeight: '700', color: 'var(--pv-accent)', whiteSpace: 'nowrap',
      });
      const word = PV.el(null, { fontSize: '18px', letterSpacing: '2px', color: 'var(--pv-dim)' }, 'COMBO');
      const mult = PV.el(null, { fontSize: '30px', color: 'var(--pv-accent)' }, 'x2');
      label.appendChild(word); label.appendChild(mult);
      wrap.appendChild(label);
      const showCombo = async (n) => {
        mult.textContent = 'x' + n;
        const big = 26 + n * 6;
        mult.style.fontSize = big + 'px';
        const targetScale = 1 + n * 0.05;
        label.style.opacity = '1';
        await ctx.tween({ from: 0.6, to: targetScale, duration: 0.24, ease: 'OutBack', onUpdate: v => label.style.transform = `scale(${v}) translateY(${lerp(6, -n * 2, (v - 0.6) / (targetScale - 0.6 || 1))}px)` });
        await ctx.tween({ from: 1, to: 0.94, duration: 0.16, ease: 'InQuad', onUpdate: v => label.style.transform = `scale(${targetScale * v}) translateY(${-n * 2}px)` });
      };
      ctx.forever(async () => {
        for (let n = 2; n <= 6; n++) {
          await showCombo(n);
          await ctx.wait(0.42);
        }
        await ctx.wait(0.3);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: v => label.style.opacity = v });
        await ctx.wait(0.5);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using TMPro;

// 連鎖が伸びるたびに倍率テキストを段階的にエスカレートさせる
public class ChainComboLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform popup;
    [SerializeField] TMP_Text multText;

    public void ShowCombo(int chain)
    {
        multText.text = "x" + chain;
        multText.fontSize = 26f + chain * 6f;
        float target = 1f + chain * 0.05f;
        LMotion.Create(0.6f, target, 0.24f).WithEase(Ease.OutBack)
            .Bind(s => popup.localScale = Vector3.one * s);
        LMotion.Create(target, target * 0.94f, 0.16f).WithEase(Ease.InQuad).WithDelay(0.24f)
            .Bind(s => popup.localScale = Vector3.one * s);
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;
using TMPro;

public class ChainComboDOTween : MonoBehaviour
{
    [SerializeField] RectTransform popup;
    [SerializeField] TMP_Text multText;

    public void ShowCombo(int chain)
    {
        multText.text = "x" + chain;
        multText.fontSize = 26f + chain * 6f;
        float target = 1f + chain * 0.05f;
        popup.localScale = Vector3.one * 0.6f;
        DOTween.Sequence()
            .Append(popup.DOScale(target, 0.24f).SetEase(Ease.OutBack))
            .Append(popup.DOScale(target * 0.94f, 0.16f).SetEase(Ease.InQuad));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;
using TMPro;

public class ChainComboCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform popup;
    [SerializeField] TMP_Text multText;

    public void ShowCombo(int chain) => StartCoroutine(Pop(chain));

    IEnumerator Pop(int chain)
    {
        multText.text = "x" + chain;
        multText.fontSize = 26f + chain * 6f;
        float target = 1f + chain * 0.05f;
        float t = 0f;
        while (t < 0.24f)
        {
            t += Time.deltaTime;
            float s = Mathf.LerpUnclamped(0.6f, target, OutBack(Mathf.Clamp01(t / 0.24f)));
            popup.localScale = Vector3.one * s;
            yield return null;
        }
        t = 0f;
        while (t < 0.16f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.16f);
            popup.localScale = Vector3.one * Mathf.Lerp(target, target * 0.94f, p * p); // InQuad
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.combo { scale: 0.6 0.6; transition: scale 240ms ease-out-back; }
.combo.show   { scale: 1 1; }        /* コード側で倍率に応じ scale を上書き */
.combo.settle { transition: scale 160ms ease-in; }

/* ===== C# (.cs) — 連鎖ごとにテキストとスケールを更新 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class ChainComboUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void ShowCombo(int chain)
    {
        var root = document.rootVisualElement;
        var popup = root.Q<VisualElement>("combo");
        var mult = root.Q<Label>("mult");
        mult.text = "x" + chain;
        mult.style.fontSize = 26f + chain * 6f;
        float target = 1f + chain * 0.05f;
        popup.style.scale = new Scale(new Vector2(0.6f, 0.6f));
        popup.schedule.Execute(() =>
        {
            popup.AddToClassList("show");
            popup.style.scale = new Scale(new Vector2(target, target));
        }).ExecuteLater(16);
    }
}`,
    },
  });

  /* 7. カードドロー (entrance) */
  R({
    id: 'card-draw',
    title: 'カードドロー',
    titleEn: 'Card Draw',
    category: 'entrance',
    tags: ['カード', 'ドロー', 'めくり', '手札'],
    description: 'デッキの山から1枚が弧を描いて手札の位置まで移動し、到着した瞬間に Y 軸で180°フリップして表向きになる。単体反転のフリップカードと違い「引いて手前に来て表になる」という一連の動線を見せる。移動を OutCubic、フリップを InOutQuad にし、フリップ中央でスケールを少し絞ると立体感が出る。',
    spec: {
      draw: { path: 'デッキ → 手札スロット (弧)', duration: 0.34, ease: 'OutCubic' },
      flip: { target: 'rotateY 180', duration: 0.3, ease: 'InOutQuad', note: '中央で表裏を切替' },
      arc: '移動中に少し持ち上げてから降ろす',
    },
    preview(ctx, PV) {
      const cardW = 40, cardH = 56;
      const deck = PV.el(null, {
        position: 'absolute', left: '22px', top: '42px', width: cardW + 'px', height: cardH + 'px', borderRadius: '6px',
        background: 'linear-gradient(150deg,var(--pv-accent-dim),var(--pv-accent))', border: '1px solid var(--pv-line-strong)',
      });
      ctx.stage.appendChild(deck);
      const deckX = 22, deckY = 42, handX = 150, handY = 46;
      const drawOne = async () => {
        const card = PV.el(null, {
          position: 'absolute', left: '0px', top: '0px', width: cardW + 'px', height: cardH + 'px', borderRadius: '6px', willChange: 'transform',
          transformStyle: 'preserve-3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontFamily: "'Oswald',sans-serif", fontWeight: '700',
          background: 'linear-gradient(150deg,var(--pv-accent-dim),var(--pv-accent))', border: '1px solid var(--pv-line-strong)', color: 'var(--pv-on-accent)',
        });
        ctx.stage.appendChild(card);
        let rotY = 0;
        const apply = (x, y, ry, s) => card.style.transform = `translate(${x}px,${y}px) rotateY(${ry}deg) scale(${s})`;
        apply(deckX, deckY, 0, 1);
        // 弧を描いて手札へ
        await ctx.tween({ from: 0, to: 1, duration: 0.34, ease: 'OutCubic', onUpdate: v => apply(lerp(deckX, handX, v), lerp(deckY, handY, v) - Math.sin(v * Math.PI) * 20, 0, 1) });
        // 180°フリップして表向きに
        await ctx.tween({ from: 0, to: 180, duration: 0.3, ease: 'InOutQuad', onUpdate: v => {
          rotY = v;
          const s = 1 - Math.sin(v / 180 * Math.PI) * 0.08;
          if (v > 90 && card.textContent !== '♠') {
            card.textContent = '♠';
            card.style.background = 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))';
            card.style.color = 'var(--pv-accent)';
            card.style.borderColor = 'var(--pv-accent)';
          }
          // 表面はさらに180°回して正立させる
          const faceRot = v > 90 ? v - 180 : v;
          apply(handX, handY, faceRot, s);
        } });
        void rotY;
        return card;
      };
      ctx.forever(async () => {
        await ctx.wait(0.5);
        const card = await drawOne();
        await ctx.wait(1.1);
        await ctx.tween({ from: 1, to: 0, duration: 0.25, ease: 'InQuad', onUpdate: v => card.style.opacity = v });
        card.remove();
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// デッキから手札へ弧で移動 → 到着で Y 軸 180° フリップして表向き
public class CardDrawLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform card;
    [SerializeField] Vector2 deckPos;
    [SerializeField] Vector2 handPos;
    [SerializeField] GameObject front; // 表
    [SerializeField] GameObject back;  // 裏

    public void Draw()
    {
        card.anchoredPosition = deckPos;
        front.SetActive(false); back.SetActive(true);
        LMotion.Create(deckPos, handPos, 0.34f).WithEase(Ease.OutCubic).BindToAnchoredPosition(card);
        LMotion.Create(0f, 180f, 0.3f).WithEase(Ease.InOutQuad).WithDelay(0.34f)
            .Bind(y =>
            {
                card.localEulerAngles = new Vector3(0, y, 0);
                bool showFront = y > 90f;
                if (front.activeSelf != showFront) { front.SetActive(showFront); back.SetActive(!showFront); }
            });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CardDrawDOTween : MonoBehaviour
{
    [SerializeField] RectTransform card;
    [SerializeField] Vector2 deckPos;
    [SerializeField] Vector2 handPos;
    [SerializeField] GameObject front;
    [SerializeField] GameObject back;

    public void Draw()
    {
        card.anchoredPosition = deckPos;
        card.localEulerAngles = Vector3.zero;
        front.SetActive(false); back.SetActive(true);
        DOTween.Sequence()
            .Append(card.DOAnchorPos(handPos, 0.34f).SetEase(Ease.OutCubic))
            .Append(card.DOLocalRotate(new Vector3(0, 180, 0), 0.3f).SetEase(Ease.InOutQuad)
                .OnUpdate(() =>
                {
                    bool showFront = card.localEulerAngles.y > 90f && card.localEulerAngles.y < 270f;
                    if (front.activeSelf != showFront) { front.SetActive(showFront); back.SetActive(!showFront); }
                }));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CardDrawCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform card;
    [SerializeField] Vector2 deckPos;
    [SerializeField] Vector2 handPos;
    [SerializeField] GameObject front;
    [SerializeField] GameObject back;

    public void Draw() => StartCoroutine(Run());

    IEnumerator Run()
    {
        card.anchoredPosition = deckPos;
        front.SetActive(false); back.SetActive(true);
        float t = 0f;
        while (t < 0.34f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.34f), 3f); // OutCubic
            var p = Vector2.Lerp(deckPos, handPos, e); p.y += Mathf.Sin(e * Mathf.PI) * 20f;
            card.anchoredPosition = p;
            yield return null;
        }
        t = 0f;
        while (t < 0.3f)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / 0.3f);
            float e = p < 0.5f ? 2f * p * p : 1f - Mathf.Pow(-2f * p + 2f, 2f) / 2f; // InOutQuad
            float y = Mathf.Lerp(0f, 180f, e);
            card.localEulerAngles = new Vector3(0, y, 0);
            bool showFront = y > 90f;
            if (front.activeSelf != showFront) { front.SetActive(showFront); back.SetActive(!showFront); }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.draw-card { position: absolute; transition: translate 340ms ease-out-cubic; }
.draw-card.dealt { translate: 128px 0; }
.draw-card .face { transition: rotate 300ms ease-in-out; transform-origin: center; }
.draw-card.flipped .face { rotate: 180deg; } /* Y軸相当の反転表現 */

/* ===== C# (.cs) — 移動完了後にフリップclassを付与 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CardDrawUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    public void Draw()
    {
        var card = document.rootVisualElement.Q<VisualElement>("draw-card");
        card.AddToClassList("dealt");
        card.schedule.Execute(() => card.AddToClassList("flipped")).ExecuteLater(340);
    }
}`,
    },
  });

  /* 8. 手札ホバー (widget) */
  R({
    id: 'hand-fan-hover',
    title: '手札ホバー',
    titleEn: 'Hand Fan Hover',
    category: 'widget',
    tags: ['カード', '手札', 'ホバー', '扇'],
    interactive: true,
    description: '扇状に並んだ手札のうち、ホバー(またはフォーカス)した1枚が持ち上がって拡大し、両隣が少し外側へ退避して重なりを避ける。手札からの1枚選択のフォーカス表現に。持ち上げは OutCubic、隣の退避は距離で減衰させると自然。カードから離れると全カードが元の扇形にスッと戻る。',
    spec: {
      focus: { target: '対象カード', lift: -18, scale: 1.18, ease: 'OutCubic', duration: 0.2 },
      neighbors: '隣接カードを距離に応じて外側へ push (減衰)',
      reset: '離脱で全カードを扇形の初期姿勢へ',
    },
    preview(ctx, PV) {
      const N = 5, cardW = 34, cardH = 50;
      const wrap = PV.el(null, { position: 'relative', width: '210px', height: '110px' });
      ctx.stage.appendChild(wrap);
      const cx = 105, baseY = 44, spread = 12, radius = 150;
      const cards = [];
      const suits = ['♠', '♥', '♦', '♣', '♠'];
      for (let i = 0; i < N; i++) {
        const centered = i - (N - 1) / 2;
        const base = { x: cx + centered * 30 - cardW / 2, y: baseY + Math.abs(centered) * 5, rot: centered * spread };
        const c = PV.el(null, {
          position: 'absolute', left: '0px', top: '0px', width: cardW + 'px', height: cardH + 'px', borderRadius: '6px', willChange: 'transform',
          background: 'linear-gradient(150deg,var(--pv-panel),var(--pv-panel2))', border: '1px solid var(--pv-accent)', transformOrigin: 'bottom center',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '4px', color: 'var(--pv-accent)', fontSize: '15px', cursor: 'pointer',
        }, suits[i]);
        wrap.appendChild(c);
        cards.push({ el: c, base, i, cur: { lift: 0, push: 0, scale: 1 } });
        void radius;
      }
      let focused = -1, manual = false;
      const render = () => cards.forEach(card => {
        const b = card.base, s = card.cur;
        card.el.style.zIndex = (card.i === focused ? 10 : card.i).toString();
        card.el.style.transform = `translate(${b.x + s.push}px,${b.y + s.lift}px) rotate(${b.rot}deg) scale(${s.scale})`;
      });
      const focus = (idx) => {
        focused = idx;
        cards.forEach(card => {
          const d = card.i - idx;
          const to = card.i === idx ? { lift: -18, push: 0, scale: 1.18 } : { lift: 0, push: Math.sign(d) * Math.max(0, 14 - Math.abs(d) * 5), scale: 1 };
          ctx.tween({ from: 0, to: 1, duration: 0.2, ease: 'OutCubic', onUpdate: v => {
            card.cur.lift = lerp(card.cur.lift, to.lift, v);
            card.cur.push = lerp(card.cur.push, to.push, v);
            card.cur.scale = lerp(card.cur.scale, to.scale, v);
            render();
          } });
        });
      };
      const reset = () => {
        focused = -1;
        cards.forEach(card => ctx.tween({ from: 0, to: 1, duration: 0.22, ease: 'OutCubic', onUpdate: v => {
          card.cur.lift = lerp(card.cur.lift, 0, v);
          card.cur.push = lerp(card.cur.push, 0, v);
          card.cur.scale = lerp(card.cur.scale, 1, v);
          render();
        } }));
      };
      cards.forEach(card => {
        card.el.addEventListener('pointerenter', (e) => { e.stopPropagation(); manual = true; focus(card.i); });
        card.el.addEventListener('pointerleave', (e) => { e.stopPropagation(); manual = false; reset(); });
      });
      render();
      ctx.forever(async () => {
        await ctx.wait(0.8);
        if (manual) return;
        for (let i = 0; i < N; i++) {
          if (manual) break;
          focus(i);
          await ctx.wait(0.55);
        }
        if (!manual) reset();
        await ctx.wait(0.6);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;
using UnityEngine.EventSystems;

// 手札の1枚をホバーで持ち上げ拡大、両隣を外へ退避
public class HandFanHoverLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] basePos;
    [SerializeField] float lift = 18f, push = 14f, focusScale = 1.18f;

    public void OnHover(int index)
    {
        for (int i = 0; i < cards.Length; i++)
        {
            int d = i - index;
            Vector2 to = basePos[i];
            float scale = 1f;
            if (i == index) { to.y += lift; scale = focusScale; }
            else to.x += Mathf.Sign(d) * Mathf.Max(0f, push - Mathf.Abs(d) * 5f);
            LMotion.Create(cards[i].anchoredPosition, to, 0.2f).WithEase(Ease.OutCubic).BindToAnchoredPosition(cards[i]);
            LMotion.Create(cards[i].localScale.x, scale, 0.2f).WithEase(Ease.OutCubic).Bind(s => cards[i].localScale = Vector3.one * s);
        }
    }

    public void OnExit()
    {
        for (int i = 0; i < cards.Length; i++)
        {
            LMotion.Create(cards[i].anchoredPosition, basePos[i], 0.22f).WithEase(Ease.OutCubic).BindToAnchoredPosition(cards[i]);
            LMotion.Create(cards[i].localScale.x, 1f, 0.22f).WithEase(Ease.OutCubic).Bind(s => cards[i].localScale = Vector3.one * s);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class HandFanHoverDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] basePos;
    [SerializeField] float lift = 18f, push = 14f, focusScale = 1.18f;

    public void OnHover(int index)
    {
        for (int i = 0; i < cards.Length; i++)
        {
            int d = i - index;
            Vector2 to = basePos[i];
            float scale = 1f;
            if (i == index) { to.y += lift; scale = focusScale; }
            else to.x += Mathf.Sign(d) * Mathf.Max(0f, push - Mathf.Abs(d) * 5f);
            cards[i].DOAnchorPos(to, 0.2f).SetEase(Ease.OutCubic);
            cards[i].DOScale(scale, 0.2f).SetEase(Ease.OutCubic);
        }
    }

    public void OnExit()
    {
        for (int i = 0; i < cards.Length; i++)
        {
            cards[i].DOAnchorPos(basePos[i], 0.22f).SetEase(Ease.OutCubic);
            cards[i].DOScale(1f, 0.22f).SetEase(Ease.OutCubic);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class HandFanHoverCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] cards;
    [SerializeField] Vector2[] basePos;
    [SerializeField] float lift = 18f, push = 14f, focusScale = 1.18f;
    Coroutine running;

    public void OnHover(int index) => Restart(Animate(index));
    public void OnExit() => Restart(Animate(-1));

    void Restart(IEnumerator co) { if (running != null) StopCoroutine(running); running = StartCoroutine(co); }

    IEnumerator Animate(int index)
    {
        Vector2[] from = new Vector2[cards.Length];
        float[] fromS = new float[cards.Length];
        Vector2[] to = new Vector2[cards.Length];
        float[] toS = new float[cards.Length];
        for (int i = 0; i < cards.Length; i++)
        {
            from[i] = cards[i].anchoredPosition; fromS[i] = cards[i].localScale.x;
            to[i] = basePos[i]; toS[i] = 1f;
            if (index >= 0)
            {
                int d = i - index;
                if (i == index) { to[i].y += lift; toS[i] = focusScale; }
                else to[i].x += Mathf.Sign(d) * Mathf.Max(0f, push - Mathf.Abs(d) * 5f);
            }
        }
        float t = 0f;
        while (t < 0.2f)
        {
            t += Time.deltaTime;
            float e = 1f - Mathf.Pow(1f - Mathf.Clamp01(t / 0.2f), 3f); // OutCubic
            for (int i = 0; i < cards.Length; i++)
            {
                cards[i].anchoredPosition = Vector2.Lerp(from[i], to[i], e);
                cards[i].localScale = Vector3.one * Mathf.Lerp(fromS[i], toS[i], e);
            }
            yield return null;
        }
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.fan-card { transition: translate 200ms ease-out-cubic, scale 200ms ease-out-cubic; }
.fan-card:hover { translate: 0 -18px; scale: 1.18; }
/* 両隣の退避は :hover の兄弟結合子で表現 */
.fan-card:hover + .fan-card { translate: 12px 0; }

/* ===== C# (.cs) — フォーカス移譲を補助 (キーボード操作等) ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class HandFanHoverUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;

    void OnEnable()
    {
        var cards = document.rootVisualElement.Query<VisualElement>(className: "fan-card").ToList();
        foreach (var card in cards)
        {
            card.RegisterCallback<PointerEnterEvent>(_ => card.BringToFront());
        }
    }
}`,
    },
  });

  /* 9. ダイスロール (attention) */
  R({
    id: 'dice-roll',
    title: 'ダイスロール',
    titleEn: 'Dice Roll',
    category: 'attention',
    tags: ['テーブル', 'ダイス', 'サイコロ', '乱数'],
    description: 'サイコロが転がるように回転しながら数回バウンドし、減衰して出目(ピップ1〜6)で停止する。ボードゲーム・すごろく・抽選のランダム決定に。回転は減衰付きで速→遅、跳ねは放物線を重ねて表現し、停止時に確定した目を面に描く。着地の最後に小さくバウンドさせると重みが出る。',
    spec: {
      spin: { target: 'rotation', from: '高速', to: '停止角', duration: 1.0, ease: 'OutCubic' },
      bounce: '滞空を複数回、振幅を減衰 (OutBounce 相当)',
      result: { value: '1..6 の乱数', settle: '確定した目を面に表示' },
    },
    preview(ctx, PV) {
      const S = 52;
      const die = PV.el(null, {
        position: 'absolute', left: '50%', top: '20px', width: S + 'px', height: S + 'px', marginLeft: (-S / 2) + 'px', borderRadius: '12px', willChange: 'transform',
        background: 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))', border: '2px solid var(--pv-line-strong)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', padding: '7px', boxSizing: 'border-box',
      });
      ctx.stage.appendChild(die);
      // 9セルのピップ (該当セルだけ表示)
      const pips = [];
      for (let i = 0; i < 9; i++) {
        const p = PV.el(null, { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--pv-accent)', margin: 'auto', opacity: '0' });
        die.appendChild(p);
        pips.push(p);
      }
      // 目→表示するセル index (3x3)
      const FACE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
      const showFace = n => pips.forEach((p, i) => p.style.opacity = FACE[n].includes(i) ? '1' : '0');
      const floorY = 66;
      ctx.forever(async () => {
        const result = 1 + Math.floor(Math.random() * 6);
        showFace(1 + Math.floor(Math.random() * 6));
        const spins = 3 + Math.random() * 2;
        // 転がり: 回転 + 減衰バウンド
        await ctx.tween({ from: 0, to: 1, duration: 1.1, ease: 'OutCubic', onUpdate: v => {
          const rot = 360 * spins * v;
          const bounces = 4;
          const damp = 1 - v;
          const y = Math.abs(Math.sin(v * Math.PI * bounces)) * 40 * damp;
          die.style.transform = `translateY(${floorY - y - 46}px) rotate(${rot}deg)`;
          if (v > 0.5) showFace(1 + (Math.floor(v * 40) % 6)); // 目が目まぐるしく変わる
        } });
        // 出目確定 + 着地の小バウンド
        showFace(result);
        await ctx.tween({ from: 0, to: 1, duration: 0.28, ease: 'OutBack', onUpdate: v => {
          const s = 1 + Math.sin(v * Math.PI) * 0.08;
          die.style.transform = `translateY(${floorY - 46}px) rotate(360deg) scale(${s})`;
        } });
        await ctx.wait(1.2);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 回転しながらバウンドし、減衰して出目で停止する
public class DiceRollLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform die;
    [SerializeField] DiceFace faceView; // 出目を面に描くコンポーネント
    [SerializeField] float floorY = -60f, jump = 90f;

    public void Roll()
    {
        int result = Random.Range(1, 7);
        float spins = 360f * (3f + Random.value * 2f);
        LMotion.Create(0f, spins, 1.1f).WithEase(Ease.OutCubic)
            .Bind(z => die.localEulerAngles = new Vector3(0, 0, z));
        LMotion.Create(0f, 1f, 1.1f).WithEase(Ease.OutCubic)
            .Bind(v =>
            {
                float y = Mathf.Abs(Mathf.Sin(v * Mathf.PI * 4f)) * jump * (1f - v);
                var p = die.anchoredPosition; p.y = floorY + y; die.anchoredPosition = p;
                if (v > 0.5f) faceView.Show(1 + Mathf.FloorToInt(v * 40f) % 6);
            })
            .WithOnComplete(() => faceView.Show(result));
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class DiceRollDOTween : MonoBehaviour
{
    [SerializeField] RectTransform die;
    [SerializeField] DiceFace faceView;
    [SerializeField] float floorY = -60f, jump = 90f;

    public void Roll()
    {
        int result = Random.Range(1, 7);
        float spins = 360f * (3f + Random.value * 2f);
        die.DOLocalRotate(new Vector3(0, 0, spins), 1.1f, RotateMode.FastBeyond360).SetEase(Ease.OutCubic);
        DOVirtual.Float(0f, 1f, 1.1f, v =>
        {
            float y = Mathf.Abs(Mathf.Sin(v * Mathf.PI * 4f)) * jump * (1f - v);
            var p = die.anchoredPosition; p.y = floorY + y; die.anchoredPosition = p;
            if (v > 0.5f) faceView.Show(1 + Mathf.FloorToInt(v * 40f) % 6);
        }).SetEase(Ease.OutCubic).OnComplete(() => faceView.Show(result));
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class DiceRollCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform die;
    [SerializeField] DiceFace faceView;
    [SerializeField] float floorY = -60f, jump = 90f;

    public void Roll() => StartCoroutine(Run());

    IEnumerator Run()
    {
        int result = Random.Range(1, 7);
        float spins = 360f * (3f + Random.value * 2f);
        float t = 0f;
        while (t < 1.1f)
        {
            t += Time.deltaTime;
            float v = Mathf.Clamp01(t / 1.1f);
            float e = 1f - Mathf.Pow(1f - v, 3f); // OutCubic
            die.localEulerAngles = new Vector3(0, 0, spins * e);
            float y = Mathf.Abs(Mathf.Sin(v * Mathf.PI * 4f)) * jump * (1f - v);
            var p = die.anchoredPosition; p.y = floorY + y; die.anchoredPosition = p;
            if (v > 0.5f) faceView.Show(1 + Mathf.FloorToInt(v * 40f) % 6);
            yield return null;
        }
        faceView.Show(result);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.die { transition: rotate 1100ms ease-out, translate 1100ms ease-out; }
.die.rolled { rotate: 1080deg; }

/* ===== C# (.cs) — schedule でバウンドと出目切替を駆動 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class DiceRollUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    float floorY = -60f, jump = 90f, dur = 1.1f, elapsed;

    public void Roll()
    {
        var die = document.rootVisualElement.Q<VisualElement>("die");
        int result = Random.Range(1, 7);
        elapsed = 0f;
        die.AddToClassList("rolled");
        var sched = die.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float v = Mathf.Clamp01(elapsed / dur);
            float y = Mathf.Abs(Mathf.Sin(v * Mathf.PI * 4f)) * jump * (1f - v);
            die.style.translate = new Translate(0, floorY + y, 0);
            SetFace(die, v < 1f ? 1 + Mathf.FloorToInt(v * 40f) % 6 : result);
        }).Every(16);
        die.schedule.Execute(() => sched.Pause()).ExecuteLater((long)(dur * 1000));
    }

    void SetFace(VisualElement die, int n) { /* n に応じてピップ要素の表示を切替 */ }
}`,
    },
  });

  /* 10. コインフリップ (attention) */
  R({
    id: 'coin-flip',
    title: 'コインフリップ',
    titleEn: 'Coin Flip',
    category: 'attention',
    tags: ['テーブル', 'コイン', '表裏', '3D'],
    description: 'コインが放り上げられ、3D で縦方向に複数回転(rotateX)しながら放物線を描き、減衰して表または裏で着地する。オッズ提示・先攻後攻決め・二択のランダム演出に。回転数を減衰させ、上昇下降を Y の放物線で表現、rotateX が 90°を跨ぐタイミングで表裏の面を切り替える。',
    spec: {
      toss: { target: 'anchoredPosition.y', arc: '放物線 (上昇→下降)', duration: 1.0 },
      spin: { target: 'rotateX', turns: '複数回転を減衰', note: '90°跨ぎで表裏を切替' },
      result: '表/裏を乱数で決め着地面に反映',
    },
    preview(ctx, PV) {
      const S = 48;
      const coin = PV.el(null, {
        position: 'absolute', left: '50%', top: '70px', width: S + 'px', height: S + 'px', marginLeft: (-S / 2) + 'px', borderRadius: '50%', willChange: 'transform',
        background: 'linear-gradient(150deg,var(--pv-accent),var(--pv-accent-dim))', border: '2px solid var(--pv-line-strong)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pv-on-accent)', fontSize: '20px', fontFamily: "'Oswald',sans-serif", fontWeight: '700',
        transformStyle: 'preserve-3d',
      }, 'H');
      ctx.stage.appendChild(coin);
      const restY = 70, apex = 62;
      ctx.forever(async () => {
        const heads = Math.random() < 0.5;
        const turns = 4 + Math.floor(Math.random() * 3);
        await ctx.tween({ from: 0, to: 1, duration: 1.0, ease: 'Linear', onUpdate: v => {
          // 放物線 (0→1→0)
          const lift = Math.sin(v * Math.PI) * apex;
          // 回転を後半で減衰
          const rot = 180 * turns * (1 - Math.pow(1 - v, 2)); // OutQuad で角度が詰まる
          const face = Math.floor(((rot % 360) + 360) % 360 / 90);
          const showH = face === 0 || face === 3;
          coin.textContent = showH ? 'H' : 'T';
          coin.style.background = showH ? 'linear-gradient(150deg,var(--pv-accent),var(--pv-accent-dim))' : 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))';
          coin.style.color = showH ? 'var(--pv-on-accent)' : 'var(--pv-accent)';
          coin.style.transform = `translateY(${-lift}px) rotateX(${rot}deg)`;
        } });
        // 着地面を結果に合わせて確定
        coin.textContent = heads ? 'H' : 'T';
        coin.style.background = heads ? 'linear-gradient(150deg,var(--pv-accent),var(--pv-accent-dim))' : 'linear-gradient(150deg,var(--pv-panel2),var(--pv-panel))';
        coin.style.color = heads ? 'var(--pv-on-accent)' : 'var(--pv-accent)';
        coin.style.transform = `translateY(0px) rotateX(0deg)`;
        await ctx.tween({ from: 0, to: 1, duration: 0.2, ease: 'OutBack', onUpdate: v => coin.style.transform = `translateY(0px) rotateX(0deg) scale(${1 + Math.sin(v * Math.PI) * 0.06})` });
        await ctx.wait(1.1);
        void restY;
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// 放物線で上げつつ rotateX を減衰回転させ、表/裏で着地
public class CoinFlipLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform coin;
    [SerializeField] GameObject heads, tails;
    [SerializeField] float apex = 120f;

    public void Flip()
    {
        bool isHeads = Random.value < 0.5f;
        int turns = 4 + Random.Range(0, 3);
        float restY = coin.anchoredPosition.y;
        LMotion.Create(0f, 1f, 1.0f).WithEase(Ease.Linear)
            .Bind(v =>
            {
                float lift = Mathf.Sin(v * Mathf.PI) * apex;
                var p = coin.anchoredPosition; p.y = restY + lift; coin.anchoredPosition = p;
                float rot = 180f * turns * (1f - Mathf.Pow(1f - v, 2f)); // 減衰
                coin.localEulerAngles = new Vector3(rot, 0, 0);
                int face = Mathf.FloorToInt(((rot % 360f) + 360f) % 360f / 90f);
                bool showH = face == 0 || face == 3;
                if (heads.activeSelf != showH) { heads.SetActive(showH); tails.SetActive(!showH); }
            })
            .WithOnComplete(() =>
            {
                coin.localEulerAngles = Vector3.zero;
                heads.SetActive(isHeads); tails.SetActive(!isHeads);
            });
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class CoinFlipDOTween : MonoBehaviour
{
    [SerializeField] RectTransform coin;
    [SerializeField] GameObject heads, tails;
    [SerializeField] float apex = 120f;

    public void Flip()
    {
        bool isHeads = Random.value < 0.5f;
        int turns = 4 + Random.Range(0, 3);
        float restY = coin.anchoredPosition.y;
        DOVirtual.Float(0f, 1f, 1.0f, v =>
        {
            float lift = Mathf.Sin(v * Mathf.PI) * apex;
            var p = coin.anchoredPosition; p.y = restY + lift; coin.anchoredPosition = p;
            float rot = 180f * turns * (1f - Mathf.Pow(1f - v, 2f));
            coin.localEulerAngles = new Vector3(rot, 0, 0);
            int face = Mathf.FloorToInt(((rot % 360f) + 360f) % 360f / 90f);
            bool showH = face == 0 || face == 3;
            if (heads.activeSelf != showH) { heads.SetActive(showH); tails.SetActive(!showH); }
        }).OnComplete(() =>
        {
            coin.localEulerAngles = Vector3.zero;
            heads.SetActive(isHeads); tails.SetActive(!isHeads);
        });
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class CoinFlipCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform coin;
    [SerializeField] GameObject heads, tails;
    [SerializeField] float apex = 120f;

    public void Flip() => StartCoroutine(Run());

    IEnumerator Run()
    {
        bool isHeads = Random.value < 0.5f;
        int turns = 4 + Random.Range(0, 3);
        float restY = coin.anchoredPosition.y;
        float t = 0f;
        while (t < 1.0f)
        {
            t += Time.deltaTime;
            float v = Mathf.Clamp01(t / 1.0f);
            float lift = Mathf.Sin(v * Mathf.PI) * apex;
            var p = coin.anchoredPosition; p.y = restY + lift; coin.anchoredPosition = p;
            float rot = 180f * turns * (1f - Mathf.Pow(1f - v, 2f));
            coin.localEulerAngles = new Vector3(rot, 0, 0);
            int face = Mathf.FloorToInt(((rot % 360f) + 360f) % 360f / 90f);
            bool showH = face == 0 || face == 3;
            if (heads.activeSelf != showH) { heads.SetActive(showH); tails.SetActive(!showH); }
            yield return null;
        }
        coin.localEulerAngles = Vector3.zero;
        heads.SetActive(isHeads); tails.SetActive(!isHeads);
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
/* UI Toolkit の rotate は Z 軸中心。縦回転は子要素の scaleY 反転で近似表現する */
.coin { transition: translate 500ms ease-out, scale 250ms linear; }

/* ===== C# (.cs) — schedule で放物線と面切替を駆動 ===== */
using UnityEngine;
using UnityEngine.UIElements;

public class CoinFlipUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    float apex = 120f, restY, dur = 1.0f, elapsed;

    public void Flip()
    {
        var coin = document.rootVisualElement.Q<VisualElement>("coin");
        bool isHeads = Random.value < 0.5f;
        int turns = 4 + Random.Range(0, 3);
        restY = coin.resolvedStyle.translate.y;
        elapsed = 0f;
        var sched = coin.schedule.Execute(() =>
        {
            elapsed += 0.016f;
            float v = Mathf.Clamp01(elapsed / dur);
            float lift = Mathf.Sin(v * Mathf.PI) * apex;
            coin.style.translate = new Translate(0, restY - lift, 0);
            float rot = 180f * turns * (1f - Mathf.Pow(1f - v, 2f));
            int face = Mathf.FloorToInt(((rot % 360f) + 360f) % 360f / 90f);
            bool showH = face == 0 || face == 3;
            // scaleY を 1/-1 で切替え、面(表裏の子要素)を差し替える
            coin.style.scale = new Scale(new Vector2(1f, showH ? 1f : -1f));
        }).Every(16);
        coin.schedule.Execute(() => sched.Pause()).ExecuteLater((long)(dur * 1000));
    }
}`,
    },
  });

  /* 11. チップベット (list) */
  R({
    id: 'chip-bet',
    title: 'チップベット',
    titleEn: 'Chip Bet',
    category: 'list',
    tags: ['テーブル', 'チップ', 'ベット', 'カジノ'],
    description: 'チップが手前から場(ポット)へスライドして飛び、時間差で1枚ずつ積み重なってスタックが高くなる。ベット・支払い・チップスタックの演出に。各チップを stagger で送り、着地で軽い overshoot(OutBack)を付けると「カチッ」と積まれる手触りになる。積み上がるほど山が高くなるのを見せると賭け金の増加が直感的。',
    spec: {
      slide: { path: '手前 → ポット位置', per_chip: { duration: 0.3, ease: 'OutBack' }, stagger: 0.1 },
      stack: '着地するたびにスタック高さを1段ぶん上げる',
      arc: '移動中に軽く持ち上げて放物線にする',
    },
    preview(ctx, PV) {
      const chipW = 40, chipH = 14;
      const potX = 130, potBaseY = 92, startX = 24, startY = 96;
      // ポット位置の目印
      const potMark = PV.el(null, { position: 'absolute', left: (potX - 4) + 'px', top: (potBaseY + chipH + 4) + 'px', width: (chipW + 8) + 'px', height: '4px', borderRadius: '2px', background: 'var(--pv-line-strong)', opacity: '0.6' });
      ctx.stage.appendChild(potMark);
      const makeChip = () => {
        const chip = PV.el(null, {
          position: 'absolute', left: '0px', top: '0px', width: chipW + 'px', height: chipH + 'px', borderRadius: '7px', willChange: 'transform',
          background: 'repeating-linear-gradient(90deg,var(--pv-accent) 0 6px,var(--pv-accent-dim) 6px 12px)',
          border: '2px solid var(--pv-line-strong)', boxShadow: '0 2px 3px rgba(0,0,0,0.25)',
        });
        ctx.stage.appendChild(chip);
        return chip;
      };
      const flyChip = (chip, stackIndex, delay) => {
        const targetY = potBaseY - stackIndex * (chipH - 5);
        return ctx.tween({ from: 0, to: 1, duration: 0.3, delay, ease: 'OutBack', onUpdate: v => {
          const x = lerp(startX, potX, Math.min(1, v));
          const y = lerp(startY, targetY, Math.min(1, v)) - Math.sin(Math.min(1, v) * Math.PI) * 22;
          chip.style.transform = `translate(${x}px,${y}px)`;
        } });
      };
      ctx.forever(async () => {
        const chips = [];
        const count = 5;
        for (let i = 0; i < count; i++) {
          const chip = makeChip();
          chips.push(chip);
          await flyChip(chip, i, 0);
          await ctx.wait(0.14);
        }
        await ctx.wait(1.2);
        // まとめて消す
        await Promise.all(chips.map((c, i) => ctx.tween({ from: 1, to: 0, duration: 0.25, delay: i * 0.03, ease: 'InQuad', onUpdate: v => c.style.opacity = v })));
        chips.forEach(c => c.remove());
        await ctx.wait(0.3);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

// チップを手前からポットへ、時間差で1枚ずつ積み上げる
public class ChipBetLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform[] chips;
    [SerializeField] Vector2 startPos;
    [SerializeField] Vector2 potPos;
    [SerializeField] float chipStep = 9f;   // 1枚ぶんの積み上げ高さ
    [SerializeField] float stagger = 0.12f;

    public void Bet()
    {
        for (int i = 0; i < chips.Length; i++)
        {
            int idx = i;
            Vector2 to = potPos + new Vector2(0, idx * chipStep);
            chips[idx].anchoredPosition = startPos;
            LMotion.Create(startPos, to, 0.3f).WithEase(Ease.OutBack).WithDelay(i * stagger)
                .BindToAnchoredPosition(chips[idx]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ChipBetDOTween : MonoBehaviour
{
    [SerializeField] RectTransform[] chips;
    [SerializeField] Vector2 startPos;
    [SerializeField] Vector2 potPos;
    [SerializeField] float chipStep = 9f;
    [SerializeField] float stagger = 0.12f;

    public void Bet()
    {
        for (int i = 0; i < chips.Length; i++)
        {
            Vector2 to = potPos + new Vector2(0, i * chipStep);
            chips[i].anchoredPosition = startPos;
            chips[i].DOAnchorPos(to, 0.3f).SetEase(Ease.OutBack).SetDelay(i * stagger);
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ChipBetCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform[] chips;
    [SerializeField] Vector2 startPos;
    [SerializeField] Vector2 potPos;
    [SerializeField] float chipStep = 9f;
    [SerializeField] float stagger = 0.12f;

    public void Bet()
    {
        for (int i = 0; i < chips.Length; i++)
            StartCoroutine(Fly(chips[i], potPos + new Vector2(0, i * chipStep), i * stagger));
    }

    IEnumerator Fly(RectTransform chip, Vector2 to, float delay)
    {
        chip.anchoredPosition = startPos;
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < 0.3f)
        {
            t += Time.deltaTime;
            float e = OutBack(Mathf.Clamp01(t / 0.3f));
            Vector2 p = Vector2.LerpUnclamped(startPos, to, e);
            p.y += Mathf.Sin(Mathf.Clamp01(t / 0.3f) * Mathf.PI) * 22f; // 弧
            chip.anchoredPosition = p;
            yield return null;
        }
    }

    static float OutBack(float x)
    {
        const float c1 = 1.70158f, c3 = c1 + 1f; float u = x - 1f;
        return 1f + c3 * u * u * u + c1 * u * u;
    }
}`,
      uitoolkit: `
/* ===== UI Toolkit — USS (.uss) ===== */
.chip { position: absolute; transition: translate 300ms ease-out-back; }

/* ===== C# (.cs) — 各チップに遅延を付けて積み位置へ ===== */
using UnityEngine;
using UnityEngine.UIElements;
using System.Collections.Generic;

public class ChipBetUIToolkit : MonoBehaviour
{
    [SerializeField] UIDocument document;
    [SerializeField] Vector2 potPos;
    [SerializeField] float chipStep = 9f;
    [SerializeField] float stagger = 0.12f;

    public void Bet()
    {
        var chips = document.rootVisualElement.Query<VisualElement>(className: "chip").ToList();
        for (int i = 0; i < chips.Count; i++)
        {
            chips[i].style.transitionDelay = new List<TimeValue> { new TimeValue(i * stagger, TimeUnit.Second) };
            chips[i].style.translate = new Translate(potPos.x, potPos.y - i * chipStep, 0);
        }
    }
}`,
    },
  });
})();
