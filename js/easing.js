/* easing.js — DOTween / LitMotion の Ease 名と同一挙動のイージング関数群。
 * t は 0..1 の正規化時間、戻り値も基本 0..1。 */
(function (global) {
  'use strict';

  const PI = Math.PI;
  const c1 = 1.70158;          // Back の overshoot (DOTween/LitMotion 既定値)
  const c2 = c1 * 1.525;
  const c3 = c1 + 1;
  const c4 = (2 * PI) / 3;     // Elastic
  const c5 = (2 * PI) / 4.5;

  function bounceOut(t) {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }

  const EASE = {
    Linear:      t => t,

    InSine:      t => 1 - Math.cos((t * PI) / 2),
    OutSine:     t => Math.sin((t * PI) / 2),
    InOutSine:   t => -(Math.cos(PI * t) - 1) / 2,

    InQuad:      t => t * t,
    OutQuad:     t => 1 - (1 - t) * (1 - t),
    InOutQuad:   t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

    InCubic:     t => t * t * t,
    OutCubic:    t => 1 - Math.pow(1 - t, 3),
    InOutCubic:  t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

    InQuart:     t => t * t * t * t,
    OutQuart:    t => 1 - Math.pow(1 - t, 4),
    InOutQuart:  t => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),

    InQuint:     t => t * t * t * t * t,
    OutQuint:    t => 1 - Math.pow(1 - t, 5),
    InOutQuint:  t => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),

    InExpo:      t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    OutExpo:     t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    InOutExpo:   t => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? Math.pow(2, 20 * t - 10) / 2
                    : (2 - Math.pow(2, -20 * t + 10)) / 2),

    InCirc:      t => 1 - Math.sqrt(1 - Math.pow(t, 2)),
    OutCirc:     t => Math.sqrt(1 - Math.pow(t - 1, 2)),
    InOutCirc:   t => (t < 0.5
                    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
                    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2),

    InBack:      t => c3 * t * t * t - c1 * t * t,
    OutBack:     t => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
    InOutBack:   t => (t < 0.5
                    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2),

    InElastic:   t => (t === 0 ? 0 : t === 1 ? 1
                    : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)),
    OutElastic:  t => (t === 0 ? 0 : t === 1 ? 1
                    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1),
    InOutElastic:t => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5
                    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
                    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1),

    InBounce:    t => 1 - bounceOut(1 - t),
    OutBounce:   bounceOut,
    InOutBounce: t => (t < 0.5
                    ? (1 - bounceOut(1 - 2 * t)) / 2
                    : (1 + bounceOut(2 * t - 1)) / 2),
  };

  /* LitMotion の Punch / Shake 相当の減衰振動 (プレビュー用)。
   * t:0..1 → -1..1 の振動値。strength を掛けて使う。 */
  function punchWave(t, frequency = 10, dampingRatio = 1) {
    const decay = Math.pow(1 - t, dampingRatio * 2);
    return Math.sin(t * frequency * PI) * decay;
  }
  function shakeWave(t, seed = 0, frequency = 10, dampingRatio = 1) {
    const decay = Math.pow(1 - t, dampingRatio * 2);
    // 擬似ランダムなギザギザ波 (seed で軸ごとに変える)
    const n = Math.sin((t * frequency + seed * 12.9898) * PI * 2)
            * Math.cos((t * frequency * 0.7 + seed * 4.1414) * PI * 2 + seed);
    return n * decay;
  }

  global.EASE = EASE;
  global.EASE.punchWave = punchWave;
  global.EASE.shakeWave = shakeWave;
})(window);
