export function calcWeight(level) {
  return Math.pow(2, 5 - level);
}

export function selectWeighted(words) {
  const total = words.reduce((sum, w) => sum + calcWeight(w.level || 0), 0);
  let rand = Math.random() * total;
  for (const word of words) {
    rand -= calcWeight(word.level || 0);
    if (rand <= 0) return word;
  }
  return words[words.length - 1];
}

export function calcNewProgress(current, isCorrect) {
  const level = current?.level ?? 0;
  const streak = current?.correct_streak ?? 0;

  if (isCorrect) {
    const newStreak = streak + 1;
    return newStreak >= 2
      ? { level: Math.min(level + 1, 5), correct_streak: 0 }
      : { level, correct_streak: newStreak };
  }
  return { level: Math.max(level - 1, 0), correct_streak: 0 };
}
