// XP / leveling curve.
//
// Previously every level inside a band cost the same (100 XP for levels 1-10,
// 250 for 11-20, ...), so progress felt flat and then jumped. Instead we use a
// smoothly increasing curve: each level costs a little more than the last, so
// early levels come quickly and later ones take steady, escalating effort.
//
//   xpForLevel(level) = BASE_XP + (level - 1) * XP_STEP
//
// L1->2 = 100, L2->3 = 150, L5->6 = 300, L10->11 = 550, L20->21 = 1050.
const BASE_XP = 100;
const XP_STEP = 50;

/**
 * XP required to advance FROM `level` to the next level.
 * @param {number} level - current level (>= 1)
 * @returns {number}
 */
export function xpForLevel(level) {
  const l = Math.max(1, Math.floor(level));
  return BASE_XP + (l - 1) * XP_STEP;
}

/**
 * Cumulative XP required to reach the start of `level` (i.e. the total earned
 * when you have just dinged that level). Reaching level 1 needs 0 XP.
 * @param {number} level
 * @returns {number}
 */
export function totalXpForLevel(level) {
  const target = Math.max(1, Math.floor(level));
  let total = 0;
  for (let l = 1; l < target; l++) {
    total += xpForLevel(l);
  }
  return total;
}

/**
 * Resolve a running total XP into level, progress within the level, and the XP
 * needed to reach the next level.
 * @param {number} totalXp
 * @returns {{ level: number, xp: number, xpToNextLevel: number }}
 */
export function computeLevelInfo(totalXp) {
  let level = 1;
  let remaining = Math.max(0, totalXp);

  while (true) {
    const needed = xpForLevel(level);
    if (remaining < needed) {
      return { level, xp: remaining, xpToNextLevel: needed };
    }
    remaining -= needed;
    level++;
  }
}
