/**
 * feel.ts — the emotional layer.
 * Warm language + gentle haptics, in one place so the whole app speaks
 * with a single, human voice.
 */

type Pattern = "tap" | "soft" | "success" | "warn";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  soft: 14,
  success: [12, 40, 22],
  warn: [18, 60, 18],
};

/** A barely-there vibration. Never loud, never long. */
export function haptic(pattern: Pattern = "tap") {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try {
    nav.vibrate?.(PATTERNS[pattern]);
  } catch {
    /* haptics are a nicety, never a requirement */
  }
}

const TASK_DONE = [
  "That's one behind you.",
  "Done. Nicely handled.",
  "One less thing on your mind.",
  "Progress, quietly made.",
  "Good. That one's closed.",
];

const HABIT_DONE = [
  "Kept it up today.",
  "Showing up counts.",
  "That's the habit, tended.",
  "Small thing, real momentum.",
];

const HABIT_STREAK = (n: number) => {
  if (n >= 30) return `${n} days. This is who you are now.`;
  if (n >= 14) return `${n} days running — beautifully steady.`;
  if (n >= 7) return `A full week. That's consistency, not luck.`;
  if (n >= 3) return `${n} days in a row. It's taking root.`;
  return null;
};

const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

export const praise = {
  task: () => pick(TASK_DONE),
  habit: (streak?: number) => (streak ? HABIT_STREAK(streak) : null) ?? pick(HABIT_DONE),
  saved: () => "Saved. It'll be here when you need it.",
};

/** Time-aware, human greeting. */
export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Winding down";
}

/** One calm line under the greeting — never a demand. */
export function dayline(openTasks: number, habitsDone: number, habitsTotal: number) {
  if (habitsTotal > 0 && habitsDone === habitsTotal && openTasks === 0)
    return "Everything you meant to do today is done.";
  if (openTasks === 0) return "Nothing is waiting on you right now.";
  if (openTasks === 1) return "Just one thing on your list. You've got room to breathe.";
  if (openTasks <= 3) return "A short list today. One at a time is plenty.";
  return "Plenty here — pick one, and let the rest wait.";
}

/** Encourage consistency, never perfection. */
export function habitEncouragement(done: number, total: number) {
  if (total === 0) return "One small habit is enough to begin.";
  if (done === 0) return "Nothing yet — any one of these is a good start.";
  if (done === total) return "All of them, today. Enjoy that.";
  return `${done} of ${total} so far. Partway is still forward.`;
}
