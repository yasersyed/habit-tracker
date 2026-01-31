export function xpForLevel(level) {
  if (level <= 10) return 100;
  if (level <= 20) return 250;
  if (level <= 30) return 500;
  return 1000;
}

export function computeLevelInfo(totalXp) {
  let level = 1;
  let remaining = totalXp;

  while (true) {
    const needed = xpForLevel(level);
    if (remaining < needed) {
      return { level, xp: remaining, xpToNextLevel: needed };
    }
    remaining -= needed;
    level++;
  }
}
