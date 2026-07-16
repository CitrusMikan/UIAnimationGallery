/* 07-list.js — リスト・レイアウト系 (4種) */
(function () {
  'use strict';
  const R = a => UIANIM.register(a);

  /* 1. リストスタッガー出現 */
  R({
    id: 'list-stagger',
    title: 'リストスタッガー出現',
    titleEn: 'List Stagger In',
    category: 'list',
    tags: ['stagger', 'list', 'スライド', '一覧'],
    description: 'リストの行が上から順に時間差でスライド+フェードインする。インベントリ・ランキング・メニュー項目の表示に。0.05〜0.08sの時間差が最も心地よい。',
    spec: {
      target: '各行の RectTransform.anchoredPosition.x + CanvasGroup.alpha',
      x: { from: -40, to: 0 },
      alpha: { from: 0, to: 1 },
      duration: 0.3,
      ease: 'OutCubic',
      stagger: 0.06,
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { width: '180px', display: 'flex', flexDirection: 'column', gap: '6px' });
      ctx.stage.appendChild(wrap);
      const rows = ['UNIT-01', 'UNIT-02', 'UNIT-03', 'UNIT-04'].map((n, i) => {
        const r = PV.el('mono', {
          display: 'flex', justifyContent: 'space-between', padding: '7px 10px',
          background: 'var(--pv-panel)', border: '1px solid var(--pv-line)', borderLeft: '2px solid var(--pv-accent)',
          fontSize: '9.5px', letterSpacing: '0.12em', color: 'var(--pv-text)', opacity: 0,
        });
        r.appendChild(PV.el(null, null, n, 'span'));
        r.appendChild(PV.el(null, { color: 'var(--pv-dim)' }, 'LV.' + (52 - i * 8), 'span'));
        wrap.appendChild(r);
        return r;
      });
      ctx.forever(async () => {
        rows.forEach(r => { r.style.opacity = 0; r.style.transform = 'translateX(-40px)'; });
        await ctx.wait(0.4);
        rows.forEach((r, i) => {
          ctx.tween({
            duration: 0.3, ease: 'OutCubic', delay: i * 0.06,
            onUpdate: v => { r.style.opacity = v; r.style.transform = `translateX(${-40 + 40 * v}px)`; },
          });
        });
        await ctx.wait(2.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ListStaggerLitMotion : MonoBehaviour
{
    [SerializeField] CanvasGroup[] rows;      // 各行 (CanvasGroup付き)
    [SerializeField] float slideDistance = 40f;
    [SerializeField] float duration = 0.3f;
    [SerializeField] float stagger = 0.06f;

    MotionHandle[] handles;

    void OnEnable() => Play();
    void OnDisable() => Cancel();
    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (handles == null) return;
        foreach (var h in handles) if (h.IsActive()) h.Cancel();
    }

    public void Play()
    {
        Cancel();
        handles = new MotionHandle[rows.Length * 2];
        for (int i = 0; i < rows.Length; i++)
        {
            var rect = (RectTransform)rows[i].transform;
            float shownX = rect.anchoredPosition.x;
            rows[i].alpha = 0f;

            handles[i * 2] = LMotion.Create(shownX - slideDistance, shownX, duration)
                .WithEase(Ease.OutCubic)
                .WithDelay(i * stagger)
                .BindToAnchoredPositionX(rect);
            handles[i * 2 + 1] = LMotion.Create(0f, 1f, duration)
                .WithDelay(i * stagger)
                .BindToAlpha(rows[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class ListStaggerDOTween : MonoBehaviour
{
    [SerializeField] CanvasGroup[] rows;
    [SerializeField] float slideDistance = 40f;
    [SerializeField] float duration = 0.3f;
    [SerializeField] float stagger = 0.06f;

    Sequence seq;

    void OnEnable() => Play();
    void OnDisable() => seq?.Kill();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        seq = DOTween.Sequence();
        for (int i = 0; i < rows.Length; i++)
        {
            var rect = (RectTransform)rows[i].transform;
            float shownX = rect.anchoredPosition.x;
            rect.anchoredPosition = new Vector2(shownX - slideDistance, rect.anchoredPosition.y);
            rows[i].alpha = 0f;

            seq.Insert(i * stagger, rect.DOAnchorPosX(shownX, duration).SetEase(Ease.OutCubic));
            seq.Insert(i * stagger, rows[i].DOFade(1f, duration));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class ListStaggerCoroutine : MonoBehaviour
{
    [SerializeField] CanvasGroup[] rows;
    [SerializeField] float slideDistance = 40f;
    [SerializeField] float duration = 0.3f;
    [SerializeField] float stagger = 0.06f;

    void OnEnable() => Play();
    void OnDisable() => StopAllCoroutines();

    public void Play()
    {
        StopAllCoroutines();
        for (int i = 0; i < rows.Length; i++)
        {
            rows[i].alpha = 0f;
            StartCoroutine(AnimateRow(rows[i], i * stagger));
        }
    }

    IEnumerator AnimateRow(CanvasGroup row, float delay)
    {
        var rect = (RectTransform)row.transform;
        float shownX = rect.anchoredPosition.x;
        rect.anchoredPosition = new Vector2(shownX - slideDistance, rect.anchoredPosition.y);

        yield return new WaitForSeconds(delay);

        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float u = 1f - p;
            float e = 1f - u * u * u; // OutCubic
            rect.anchoredPosition = new Vector2(Mathf.Lerp(shownX - slideDistance, shownX, e), rect.anchoredPosition.y);
            row.alpha = p;
            yield return null;
        }
        rect.anchoredPosition = new Vector2(shownX, rect.anchoredPosition.y);
        row.alpha = 1f;
    }
}`,
    },
  });

  /* 2. グリッドスタッガー出現 */
  R({
    id: 'grid-stagger',
    title: 'グリッドスタッガー出現',
    titleEn: 'Grid Stagger In',
    category: 'list',
    tags: ['stagger', 'grid', 'scale', 'インベントリ'],
    description: 'グリッドのセルが左上から波のようにスケールインする。行+列に応じた遅延(row+col)*staggerで対角線状の波になる。アイテムボックス・ガチャ結果一覧に。',
    spec: {
      target: '各セルの Transform.localScale',
      from: 0, to: 1,
      duration: 0.25,
      ease: 'OutBack',
      stagger: '(row + col) * 0.05',
    },
    preview(ctx, PV) {
      const cols = 4, rowsN = 3;
      const grid = PV.el(null, { display: 'grid', gridTemplateColumns: `repeat(${cols}, 34px)`, gap: '8px' });
      ctx.stage.appendChild(grid);
      const cells = [];
      for (let r = 0; r < rowsN; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = PV.el(null, {
            width: '34px', height: '34px',
            background: 'linear-gradient(160deg,var(--pv-panel2),var(--pv-panel))', border: '1px solid var(--pv-line-strong)',
            clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
            transform: 'scale(0)',
          });
          if ((r * cols + c) % 5 === 0) cell.style.borderColor = 'var(--pv-accent)';
          grid.appendChild(cell);
          cells.push({ el: cell, delay: (r + c) * 0.05 });
        }
      }
      ctx.forever(async () => {
        cells.forEach(c => c.el.style.transform = 'scale(0)');
        await ctx.wait(0.4);
        cells.forEach(c => {
          ctx.tween({
            duration: 0.25, ease: 'OutBack', delay: c.delay,
            onUpdate: v => c.el.style.transform = `scale(${v})`,
          });
        });
        await ctx.wait(2.0);
      });
    },
    code: {
      litmotion: `
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class GridStaggerLitMotion : MonoBehaviour
{
    [SerializeField] Transform[] cells;   // GridLayoutGroup配下のセル(行優先の並び)
    [SerializeField] int columns = 4;
    [SerializeField] float duration = 0.25f;
    [SerializeField] float stagger = 0.05f;

    MotionHandle[] handles;

    void OnEnable() => Play();
    void OnDisable() => Cancel();
    void OnDestroy() => Cancel();

    void Cancel()
    {
        if (handles == null) return;
        foreach (var h in handles) if (h.IsActive()) h.Cancel();
    }

    public void Play()
    {
        Cancel();
        handles = new MotionHandle[cells.Length];
        for (int i = 0; i < cells.Length; i++)
        {
            int row = i / columns;
            int col = i % columns;
            cells[i].localScale = Vector3.zero;
            handles[i] = LMotion.Create(Vector3.zero, Vector3.one, duration)
                .WithEase(Ease.OutBack)
                .WithDelay((row + col) * stagger)
                .BindToLocalScale(cells[i]);
        }
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class GridStaggerDOTween : MonoBehaviour
{
    [SerializeField] Transform[] cells;
    [SerializeField] int columns = 4;
    [SerializeField] float duration = 0.25f;
    [SerializeField] float stagger = 0.05f;

    Sequence seq;

    void OnEnable() => Play();
    void OnDisable() => seq?.Kill();
    void OnDestroy() => seq?.Kill();

    public void Play()
    {
        seq?.Kill();
        seq = DOTween.Sequence();
        for (int i = 0; i < cells.Length; i++)
        {
            int row = i / columns;
            int col = i % columns;
            cells[i].localScale = Vector3.zero;
            seq.Insert((row + col) * stagger,
                cells[i].DOScale(Vector3.one, duration).SetEase(Ease.OutBack));
        }
    }
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class GridStaggerCoroutine : MonoBehaviour
{
    [SerializeField] Transform[] cells;
    [SerializeField] int columns = 4;
    [SerializeField] float duration = 0.25f;
    [SerializeField] float stagger = 0.05f;

    void OnEnable() => Play();
    void OnDisable() => StopAllCoroutines();

    public void Play()
    {
        StopAllCoroutines();
        for (int i = 0; i < cells.Length; i++)
        {
            int row = i / columns;
            int col = i % columns;
            cells[i].localScale = Vector3.zero;
            StartCoroutine(AnimateCell(cells[i], (row + col) * stagger));
        }
    }

    IEnumerator AnimateCell(Transform cell, float delay)
    {
        yield return new WaitForSeconds(delay);
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            cell.localScale = Vector3.one * OutBack(Mathf.Clamp01(t / duration));
            yield return null;
        }
        cell.localScale = Vector3.one;
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

  /* 3. 並び替え */
  R({
    id: 'reorder',
    title: '並び替え',
    titleEn: 'Reorder',
    category: 'list',
    tags: ['sort', 'move', 'ランキング', 'FLIP'],
    description: 'ソート順が変わったとき、各項目が新しい位置へ滑らかに移動する。ランキング更新・フィルタ変更時に「どこへ行ったか」を目で追える。位置を記録→並び替え→新位置へトゥイーンが基本。',
    spec: {
      target: '各項目の RectTransform.anchoredPosition',
      to: '並び替え後のスロット位置',
      duration: 0.4,
      ease: 'InOutCubic',
      note: 'LayoutGroupを使う場合は無効化してから手動でスロット座標を計算する',
    },
    preview(ctx, PV) {
      const wrap = PV.el(null, { position: 'relative', width: '180px', height: '112px' });
      ctx.stage.appendChild(wrap);
      const H = 30, GAP = 6;
      const data = [
        { n: 'PLAYER-A', v: 98, c: 'var(--pv-accent)' },
        { n: 'PLAYER-B', v: 72, c: 'var(--pv-text)' },
        { n: 'PLAYER-C', v: 85, c: 'var(--pv-text)' },
      ];
      const items = data.map((d, i) => {
        const it = PV.el('mono', {
          position: 'absolute', left: '0', right: '0', top: (i * (H + GAP)) + 'px', height: H + 'px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px',
          background: 'var(--pv-panel)', border: '1px solid var(--pv-line)', fontSize: '9.5px',
          letterSpacing: '0.1em', color: d.c,
        });
        it.appendChild(PV.el(null, null, d.n, 'span'));
        const score = PV.el(null, { color: 'var(--pv-dim)' }, String(d.v), 'span');
        it.appendChild(score);
        wrap.appendChild(it);
        return { el: it, score: d.v, y: i * (H + GAP), scoreEl: score };
      });
      ctx.forever(async () => {
        await ctx.wait(1.4);
        // ランダムにスコアを変えて順位を再計算
        items.forEach(it => { it.score = Math.floor(40 + Math.random() * 60); it.scoreEl.textContent = it.score; });
        const sorted = [...items].sort((a, b) => b.score - a.score);
        sorted.forEach((it, rank) => {
          const toY = rank * (H + GAP);
          const fromY = it.y;
          if (toY === fromY) return;
          ctx.tween({
            duration: 0.4, ease: 'InOutCubic',
            onUpdate: v => { it.y = fromY + (toY - fromY) * v; it.el.style.top = it.y + 'px'; },
          });
        });
      });
    },
    code: {
      litmotion: `
using System.Collections.Generic;
using System.Linq;
using LitMotion;
using LitMotion.Extensions;
using UnityEngine;

public class ReorderLitMotion : MonoBehaviour
{
    [SerializeField] float rowHeight = 80f;
    [SerializeField] float duration = 0.4f;

    readonly List<MotionHandle> handles = new List<MotionHandle>();

    void OnDestroy() => Cancel();

    void Cancel()
    {
        foreach (var h in handles) if (h.IsActive()) h.Cancel();
        handles.Clear();
    }

    /// <summary>スコア順に並び替えて各行を新しい位置へ移動する</summary>
    public void Sort(List<(RectTransform rect, int score)> items)
    {
        Cancel();
        var sorted = items.OrderByDescending(x => x.score).ToList();
        for (int rank = 0; rank < sorted.Count; rank++)
        {
            var rect = sorted[rank].rect;
            float targetY = -rank * rowHeight;   // 上から順に配置
            handles.Add(LMotion.Create(rect.anchoredPosition.y, targetY, duration)
                .WithEase(Ease.InOutCubic)
                .BindToAnchoredPositionY(rect));
        }
    }
}`,
      dotween: `
using System.Collections.Generic;
using System.Linq;
using DG.Tweening;
using UnityEngine;

public class ReorderDOTween : MonoBehaviour
{
    [SerializeField] float rowHeight = 80f;
    [SerializeField] float duration = 0.4f;

    Sequence seq;

    void OnDestroy() => seq?.Kill();

    public void Sort(List<(RectTransform rect, int score)> items)
    {
        seq?.Kill();
        seq = DOTween.Sequence();
        var sorted = items.OrderByDescending(x => x.score).ToList();
        for (int rank = 0; rank < sorted.Count; rank++)
        {
            float targetY = -rank * rowHeight;
            seq.Join(sorted[rank].rect.DOAnchorPosY(targetY, duration).SetEase(Ease.InOutCubic));
        }
    }
}`,
      coroutine: `
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ReorderCoroutine : MonoBehaviour
{
    [SerializeField] float rowHeight = 80f;
    [SerializeField] float duration = 0.4f;

    public void Sort(List<(RectTransform rect, int score)> items)
    {
        StopAllCoroutines();
        var sorted = items.OrderByDescending(x => x.score).ToList();
        for (int rank = 0; rank < sorted.Count; rank++)
            StartCoroutine(MoveTo(sorted[rank].rect, -rank * rowHeight));
    }

    IEnumerator MoveTo(RectTransform rect, float targetY)
    {
        float fromY = rect.anchoredPosition.y;
        float t = 0f;
        while (t < duration)
        {
            t += Time.deltaTime;
            float p = Mathf.Clamp01(t / duration);
            float e = p < 0.5f ? 4f * p * p * p : 1f - Mathf.Pow(-2f * p + 2f, 3f) / 2f; // InOutCubic
            rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, Mathf.Lerp(fromY, targetY, e));
            yield return null;
        }
        rect.anchoredPosition = new Vector2(rect.anchoredPosition.x, targetY);
    }
}`,
    },
  });

  /* 4. 無限スクロールティッカー */
  R({
    id: 'ticker',
    title: '無限スクロールティッカー',
    titleEn: 'Infinite Ticker',
    category: 'list',
    tags: ['loop', 'scroll', 'お知らせ', 'マーキー'],
    description: 'お知らせテキストが右から左へ流れ続ける。ニュース・イベント告知バーに。テキスト幅ぶん移動したら位置をリセットして継ぎ目なくループさせる。',
    spec: {
      target: 'RectTransform.anchoredPosition.x',
      speed: '80px/秒 (等速)',
      loop: 'x < -テキスト幅 になったら +テキスト幅 して継ぎ目なく循環',
      note: '同じテキストを2つ横に並べておくと切れ目が見えない',
    },
    preview(ctx, PV) {
      const bar = PV.el(null, {
        position: 'absolute', left: '0', right: '0', top: '50%', marginTop: '-14px',
        height: '28px', background: 'var(--pv-panel)', borderTop: '1px solid var(--pv-accent)', borderBottom: '1px solid var(--pv-line)',
        overflow: 'hidden', display: 'flex', alignItems: 'center',
      });
      ctx.stage.appendChild(bar);
      const msg = '▸ EVENT: 新イベント開催中　▸ MAINTENANCE: 7/20 14:00-16:00　';
      const strip = PV.el(null, { display: 'flex', whiteSpace: 'nowrap', willChange: 'transform' });
      const t1 = PV.el(null, { fontFamily: "'Noto Sans JP',sans-serif", fontSize: '10px', color: 'var(--pv-dim)', letterSpacing: '0.08em' }, msg);
      const t2 = t1.cloneNode(true);
      strip.appendChild(t1); strip.appendChild(t2);
      bar.appendChild(strip);
      let x = 0, w = 0;
      requestAnimationFrame(() => { w = t1.offsetWidth; });
      ctx.tween({
        from: 0, to: 1, duration: 3600, ease: 'Linear',
        onUpdate: () => {
          if (!w) return;
          x -= 80 * 0.016;
          if (x <= -w) x += w;
          strip.style.transform = `translateX(${x}px)`;
        },
      });
    },
    code: {
      litmotion: `
using LitMotion;
using UnityEngine;

/// <summary>
/// 同一テキストを2つ横に並べた親(content)を流し続ける。
/// 等速無限移動は「時間→位置の関数」で書くとリセット処理が消える。
/// </summary>
public class TickerLitMotion : MonoBehaviour
{
    [SerializeField] RectTransform content;   // テキスト2連の親
    [SerializeField] float textWidth = 600f;  // テキスト1つぶんの幅
    [SerializeField] float speed = 80f;       // px/秒

    MotionHandle handle;

    void OnEnable()
    {
        float loopTime = textWidth / speed;
        handle = LMotion.Create(0f, textWidth, loopTime)
            .WithEase(Ease.Linear)
            .WithLoops(-1, LoopType.Restart)
            .Bind(x => content.anchoredPosition = new Vector2(-x, content.anchoredPosition.y));
    }

    void OnDisable()
    {
        if (handle.IsActive()) handle.Cancel();
    }
}`,
      dotween: `
using DG.Tweening;
using UnityEngine;

public class TickerDOTween : MonoBehaviour
{
    [SerializeField] RectTransform content;
    [SerializeField] float textWidth = 600f;
    [SerializeField] float speed = 80f;

    Tween tween;

    void OnEnable()
    {
        float loopTime = textWidth / speed;
        content.anchoredPosition = Vector2.zero;
        tween = content.DOAnchorPosX(-textWidth, loopTime)
            .SetEase(Ease.Linear)
            .SetLoops(-1, LoopType.Restart);
    }

    void OnDisable() => tween?.Kill();
}`,
      coroutine: `
using System.Collections;
using UnityEngine;

public class TickerCoroutine : MonoBehaviour
{
    [SerializeField] RectTransform content;
    [SerializeField] float textWidth = 600f;
    [SerializeField] float speed = 80f;

    void OnEnable() { StopAllCoroutines(); StartCoroutine(Animate()); }
    void OnDisable() => StopAllCoroutines();

    IEnumerator Animate()
    {
        float x = 0f;
        while (true)
        {
            x -= speed * Time.deltaTime;
            if (x <= -textWidth) x += textWidth;   // 継ぎ目なくループ
            content.anchoredPosition = new Vector2(x, content.anchoredPosition.y);
            yield return null;
        }
    }
}`,
    },
  });
})();
