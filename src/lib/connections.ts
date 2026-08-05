/**
 * connections.ts — the thread that makes Origin one life instead of many tools.
 *
 * Every rule here reads signals from two or more different modules and states,
 * in plain human language, how one part of life is touching another. Pure
 * functions, no I/O, so any screen can ask the same question and get the same
 * warm answer.
 */

export type Signals = {
  /** Hours of sleep last night. */
  sleepHours?: number | null;
  /** Average sleep over the recent window. */
  sleepAvg?: number | null;
  /** 1–10 stress, most recent. */
  stress?: number | null;
  /** 1–5 mood, recent average. */
  mood?: number | null;
  /** 1–5 energy, self-reported. */
  energy?: number | null;
  /** Open tasks right now. */
  openTasks?: number;
  /** Tasks completed today. */
  tasksDone?: number;
  /** Habits kept today / total tracked. */
  habitsDone?: number;
  habitsTotal?: number;
  /** Longest current habit streak. */
  streak?: number | null;
  /** Events on the calendar today. */
  eventsToday?: number;
  /** Money this month. */
  spent?: number;
  earned?: number;
  /** Spend in the last 3 days vs the daily average this month. */
  recentSpendRatio?: number | null;
  /** Active goals and their average progress (0–100). */
  goals?: number;
  goalProgress?: number | null;
};

export type Connection = {
  /** The two-or-more areas this link joins. Shown as a quiet trail. */
  from: string;
  to: string;
  /** One sentence, warm, never alarming. */
  line: string;
  /** Higher wins when we only have room for one. */
  weight: number;
};

const n = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Derives the cross-module links worth telling the user about, best first.
 * Returns an empty list when there simply isn't enough of their life logged
 * yet — silence is kinder than a guess.
 */
export function findConnections(s: Signals): Connection[] {
  const out: Connection[] = [];

  const sleep = n(s.sleepHours) ?? n(s.sleepAvg);
  const stress = n(s.stress);
  const mood = n(s.mood);
  const energy = n(s.energy);
  const events = s.eventsToday ?? 0;
  const open = s.openTasks ?? 0;
  const habitsTotal = s.habitsTotal ?? 0;
  const habitsDone = s.habitsDone ?? 0;
  const streak = n(s.streak);
  const spendRatio = n(s.recentSpendRatio);
  const goalProgress = n(s.goalProgress);

  // Sleep → focus
  if (sleep !== null && sleep < 6.5 && open > 2) {
    out.push({
      from: "Sleep",
      to: "Focus",
      line: `You slept ${sleep.toFixed(1)}h, and there are ${open} things open. Today is a one-task day — the list will keep.`,
      weight: 92,
    });
  } else if (sleep !== null && sleep >= 7.5 && open > 0) {
    out.push({
      from: "Sleep",
      to: "Focus",
      line: `${sleep.toFixed(1)}h of rest behind you. This is the kind of day to spend on the thing you keep postponing.`,
      weight: 64,
    });
  }

  // Stress → spending
  if (stress !== null && stress >= 6 && spendRatio !== null && spendRatio > 1.3) {
    out.push({
      from: "Stress",
      to: "Money",
      line: `Stress has been high and spending has run about ${Math.round((spendRatio - 1) * 100)}% above your usual pace. Worth noticing, not worth guilt.`,
      weight: 90,
    });
  } else if (stress !== null && stress >= 7) {
    out.push({
      from: "Stress",
      to: "Wellbeing",
      line: `Stress is sitting around ${Math.round(stress)}/10. One slow thing today — a walk, a breath, an early night — moves this more than effort does.`,
      weight: 80,
    });
  }

  // Calendar → burnout
  if (events >= 4 && (sleep === null || sleep < 7)) {
    out.push({
      from: "Calendar",
      to: "Energy",
      line: `${events} things on the calendar today on light rest. Protect one gap — that's what keeps tomorrow intact.`,
      weight: 86,
    });
  }

  // Habits → goals
  if (habitsTotal > 0 && habitsDone === habitsTotal && goalProgress !== null) {
    out.push({
      from: "Habits",
      to: "Goals",
      line: `Every habit kept today, and your goals sit near ${Math.round(goalProgress)}%. This is exactly how that number moves.`,
      weight: 74,
    });
  } else if (streak !== null && streak >= 5 && (s.goals ?? 0) > 0) {
    out.push({
      from: "Habits",
      to: "Goals",
      line: `${streak} days of showing up. Consistency like this is what quietly carries your goals.`,
      weight: 70,
    });
  }

  // Money → mood
  if (mood !== null && mood <= 2.5 && (s.spent ?? 0) > (s.earned ?? 0) && (s.earned ?? 0) > 0) {
    out.push({
      from: "Money",
      to: "Mood",
      line: `Spending has outpaced income this month and mood has dipped with it. Naming the link takes some of its weight away.`,
      weight: 82,
    });
  }

  // Energy → planning
  if (energy !== null && energy <= 2 && open > 0) {
    out.push({
      from: "Energy",
      to: "Plan",
      line: `Energy reads low. Choose the smallest open thing — finishing something small is how energy comes back.`,
      weight: 76,
    });
  }

  // Movement → mood (gentle, only when we know mood is fine)
  if (mood !== null && mood >= 4 && habitsDone > 0) {
    out.push({
      from: "Habits",
      to: "Mood",
      line: `Mood is holding well on days you tend your habits. That pattern is yours — keep leaning on it.`,
      weight: 58,
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

/** The single most useful link, or null when the day is simply quiet. */
export function topConnection(s: Signals): Connection | null {
  return findConnections(s)[0] ?? null;
}

/** Recent-spend pressure vs. the month's own daily average. */
export function spendRatio(
  tx: Array<{ type: string; amount: number | string; occurred_on: string }>,
  today = new Date(),
): number | null {
  const monthKey = today.toISOString().slice(0, 10).slice(0, 7);
  const month = tx.filter((t) => t.type === "expense" && t.occurred_on.slice(0, 7) === monthKey);
  if (month.length < 4) return null;
  const dayOfMonth = Math.max(1, today.getDate());
  const total = month.reduce((sum, t) => sum + Number(t.amount), 0);
  const perDay = total / dayOfMonth;
  if (perDay <= 0) return null;
  const cutoff = new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10);
  const recent = month.filter((t) => t.occurred_on >= cutoff).reduce((sum, t) => sum + Number(t.amount), 0);
  return recent / 3 / perDay;
}
