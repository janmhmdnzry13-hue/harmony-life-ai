/**
 * understand.server.ts — Origin's understanding layer.
 *
 * Everything here is deterministic: it reads the user's whole life from the
 * database and derives friction, risk, recurring self-sabotage, money leaks,
 * burnout pressure, goal conflicts and the life graph. The AI layer sits on
 * top of these facts so it never has to guess.
 */
import type { Db } from "@/lib/intelligence.server";
import { computeScores, type Scores } from "@/lib/intelligence.server";

const day = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (a: number[]) => {
  const c = a.filter((n) => Number.isFinite(n));
  return c.length ? c.reduce((s, n) => s + n, 0) / c.length : null;
};

export type Friction = {
  id: string;
  /** What kind of drag this is. */
  kind: "energy" | "time" | "stress" | "money" | "habits" | "decisions" | "goals" | "clarity";
  title: string;
  /** Why the user is stuck — always grounded in a number. */
  why: string;
  /** The one practical thing to do about it. */
  move: string;
  weight: number;
};

export type RiskPreview = {
  id: string;
  area: "burnout" | "money" | "goals" | "health" | "focus";
  headline: string;
  /** What happens if nothing changes. */
  ifNothingChanges: string;
  /** Rough likelihood, 0–100. */
  likelihood: number;
  horizon: string;
};

export type Pattern = {
  id: string;
  title: string;
  detail: string;
  /** How often it has repeated in the window. */
  occurrences: number;
};

export type MoneyLeak = {
  id: string;
  label: string;
  detail: string;
  monthly: number;
};

export type GraphEdge = { from: string; to: string; strength: number; line: string };

export type RescueAction = { title: string; why: string; kind: "task" | "habit" | "rest" };

export type Understanding = {
  today: string;
  scores: Pick<Scores, "life" | "health" | "finance" | "productivity" | "happiness" | "burnout">;
  breakdown: Scores["breakdown"];
  friction: Friction[];
  risks: RiskPreview[];
  patterns: Pattern[];
  leaks: MoneyLeak[];
  leakTotal: number;
  burnout: { score: number; drivers: string[]; window: string };
  goalConflicts: Array<{ title: string; detail: string }>;
  graph: GraphEdge[];
  rescue: RescueAction[];
  facts: Record<string, number | string | null>;
};

/** Reads the user's whole life and derives Origin's understanding of it. */
export async function buildUnderstanding(supabase: Db): Promise<Understanding> {
  const now = new Date();
  const today = iso(now);
  const since14 = iso(new Date(now.getTime() - 14 * day));
  const since30 = iso(new Date(now.getTime() - 30 * day));
  const since14Iso = new Date(now.getTime() - 14 * day).toISOString();
  const since30Iso = new Date(now.getTime() - 30 * day).toISOString();
  const monthKey = today.slice(0, 7);

  const [
    scores,
    sleep,
    workouts,
    mood,
    stress,
    tasks,
    habits,
    hlogs,
    events,
    blocks,
    tx,
    bills,
    goals,
  ] = await Promise.all([
    computeScores(supabase),
    supabase.from("sleep_logs").select("log_date,duration_min,quality,bedtime").gte("log_date", since30),
    supabase.from("workouts").select("log_date").gte("log_date", since30),
    supabase.from("mood_logs").select("mood,energy,logged_at").gte("logged_at", since30Iso),
    supabase.from("stress_logs").select("level,logged_at").gte("logged_at", since30Iso),
    supabase.from("tasks").select("id,title,priority,due_date,completed,created_at,completed_at"),
    supabase.from("habits").select("id,name,target_per_day").eq("archived", false),
    supabase.from("habit_logs").select("habit_id,log_date").gte("log_date", since30),
    supabase.from("events").select("title,starts_at,ends_at").gte("starts_at", since14Iso),
    supabase.from("time_blocks").select("date,start_time,end_time,title").gte("date", since14),
    supabase.from("transactions").select("type,amount,category,note,occurred_on").gte("occurred_on", since30),
    supabase.from("bills").select("name,amount,cycle,category,next_due,is_active"),
    supabase.from("goals").select("title,progress,status,target_date"),
  ]);

  const sleepRows = sleep.data ?? [];
  const sleepHrs = sleepRows.map((r) => Number(r.duration_min ?? 0) / 60).filter((n) => n > 0);
  const sleepAvg = avg(sleepHrs);
  const shortNights = sleepHrs.filter((h) => h < 6.5).length;
  const lateNights = sleepRows.filter((r) => {
    if (!r.bedtime) return false;
    const h = new Date(r.bedtime).getHours();
    return h >= 1 && h < 5;
  }).length;

  const moodRows = mood.data ?? [];
  const moodAvg = avg(moodRows.map((m) => Number(m.mood)));
  const energyAvg = avg(moodRows.map((m) => Number(m.energy ?? 0)).filter((n) => n > 0));
  const stressRows = stress.data ?? [];
  const stressAvg = avg(stressRows.map((s) => Number(s.level)));
  const highStressDays = new Set(
    stressRows.filter((s) => Number(s.level) >= 7).map((s) => s.logged_at.slice(0, 10)),
  ).size;

  const taskRows = tasks.data ?? [];
  const open = taskRows.filter((t) => !t.completed);
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const stale = open.filter((t) => t.created_at.slice(0, 10) <= since14);
  const closedRecently = taskRows.filter(
    (t) => t.completed && t.completed_at && t.completed_at >= since14Iso,
  ).length;
  const highOpen = open.filter((t) => t.priority === "high");

  const habitRows = habits.data ?? [];
  const logRows = hlogs.data ?? [];
  const habitRate = habitRows.length
    ? Math.min(1, logRows.length / (habitRows.length * 30))
    : null;
  const skipped = habitRows
    .map((h) => {
      const kept = new Set(logRows.filter((l) => l.habit_id === h.id).map((l) => l.log_date)).size;
      return { name: h.name, missed: Math.max(0, 14 - kept) };
    })
    .filter((h) => h.missed >= 8)
    .sort((a, b) => b.missed - a.missed);

  const eventRows = events.data ?? [];
  const todaysEvents = eventRows.filter((e) => e.starts_at.slice(0, 10) === today);
  const meetingHoursWeek = eventRows
    .filter((e) => e.starts_at >= new Date(now.getTime() - 7 * day).toISOString())
    .reduce((s, e) => {
      if (!e.ends_at) return s + 1;
      return s + Math.max(0, (new Date(e.ends_at).getTime() - new Date(e.starts_at).getTime()) / 3600000);
    }, 0);

  // Calendar collisions — two things claiming the same minutes.
  const sorted = [...eventRows].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  let collisions = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const prevEnd = prev.ends_at ? new Date(prev.ends_at).getTime() : new Date(prev.starts_at).getTime() + 3600000;
    if (new Date(cur.starts_at).getTime() < prevEnd) collisions++;
  }

  const txRows = tx.data ?? [];
  const monthTx = txRows.filter((t) => t.occurred_on.slice(0, 7) === monthKey);
  const spent = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const earned = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = txRows.filter((t) => t.type === "expense");
  const recentCut = iso(new Date(now.getTime() - 3 * day));
  const perDay = spent / Math.max(1, now.getDate());
  const recent3 = monthTx
    .filter((t) => t.type === "expense" && t.occurred_on >= recentCut)
    .reduce((s, t) => s + Number(t.amount), 0);
  const spendRatio = perDay > 0 ? recent3 / 3 / perDay : null;

  const goalRows = (goals.data ?? []).filter((g) => g.status !== "done");
  const stalledGoals = goalRows.filter((g) => Number(g.progress ?? 0) < 25);
  const dueSoonGoals = goalRows.filter(
    (g) => g.target_date && g.target_date <= iso(new Date(now.getTime() + 30 * day)),
  );

  /* ------------------------------ money leaks ------------------------------ */
  const leaks: MoneyLeak[] = [];

  // Recurring charges spotted from the ledger itself (same label, 3+ months/weeks).
  const byLabel = new Map<string, number[]>();
  for (const e of expenses) {
    const label = (e.note?.trim() || e.category || "").toLowerCase().slice(0, 40);
    if (!label) continue;
    byLabel.set(label, [...(byLabel.get(label) ?? []), Number(e.amount)]);
  }
  for (const [label, amounts] of byLabel) {
    if (amounts.length < 3) continue;
    const a = avg(amounts)!;
    const sameish = amounts.filter((x) => Math.abs(x - a) / Math.max(1, a) < 0.12).length;
    if (sameish >= 3 && a > 0) {
      leaks.push({
        id: `recurring-${label}`,
        label: label.replace(/\b\w/g, (c) => c.toUpperCase()),
        detail: `Charged ${sameish} times in the last 30 days at about the same amount — this looks like a subscription.`,
        monthly: Math.round(a * (sameish >= 4 ? sameish : 1)),
      });
    }
  }

  // Declared bills that are quietly adding up.
  const activeBills = (bills.data ?? []).filter((b) => b.is_active);
  const billsMonthly = activeBills.reduce((s, b) => {
    const amt = Number(b.amount);
    const mult = b.cycle === "weekly" ? 4.33 : b.cycle === "yearly" ? 1 / 12 : b.cycle === "quarterly" ? 1 / 3 : 1;
    return s + amt * mult;
  }, 0);
  if (activeBills.length >= 3 && earned > 0 && billsMonthly / earned > 0.35) {
    leaks.push({
      id: "fixed-load",
      label: "Fixed costs are heavy",
      detail: `${activeBills.length} recurring bills take about ${Math.round((billsMonthly / earned) * 100)}% of what you earn before anything else happens.`,
      monthly: Math.round(billsMonthly),
    });
  }

  // Discretionary categories running hot.
  const catTotals = new Map<string, number>();
  for (const e of monthTx.filter((t) => t.type === "expense")) {
    catTotals.set(e.category, (catTotals.get(e.category) ?? 0) + Number(e.amount));
  }
  const soft = ["food", "dining", "eating out", "takeaway", "shopping", "entertainment", "subscriptions", "coffee"];
  for (const [cat, total] of catTotals) {
    if (!soft.some((s) => cat.toLowerCase().includes(s))) continue;
    if (spent > 0 && total / spent > 0.28) {
      leaks.push({
        id: `cat-${cat}`,
        label: cat,
        detail: `${Math.round((total / spent) * 100)}% of this month's spending sits in ${cat}. Trimming a quarter of it would free about ${Math.round(total * 0.25).toLocaleString()}.`,
        monthly: Math.round(total * 0.25),
      });
    }
  }
  leaks.sort((a, b) => b.monthly - a.monthly);
  const leakTotal = leaks.reduce((s, l) => s + l.monthly, 0);

  /* -------------------------------- friction ------------------------------- */
  const friction: Friction[] = [];
  const push = (f: Friction) => friction.push(f);

  if (sleepAvg !== null && sleepAvg < 6.8) {
    push({
      id: "f-energy",
      kind: "energy",
      title: "You're running on a sleep deficit",
      why: `Your nights average ${sleepAvg.toFixed(1)}h, with ${shortNights} under 6.5h in the last month. Everything else — focus, patience, appetite for hard things — is being paid for out of that.`,
      move: "Pick tonight's bedtime now and set one alarm for it. Nothing else needs to change today.",
      weight: 96,
    });
  }
  if (collisions > 0 || (todaysEvents.length >= 4 && (sleepAvg ?? 8) < 7.5)) {
    push({
      id: "f-time",
      kind: "time",
      title: "Your calendar promises more than the day holds",
      why: collisions
        ? `${collisions} overlapping commitment${collisions > 1 ? "s" : ""} in the last two weeks, and about ${Math.round(meetingHoursWeek)}h booked this week.`
        : `${todaysEvents.length} commitments today on ${(sleepAvg ?? 0).toFixed(1)}h of average sleep.`,
      move: "Protect one 45-minute gap today and treat it as booked.",
      weight: 88,
    });
  }
  if (stressAvg !== null && stressAvg >= 6) {
    push({
      id: "f-stress",
      kind: "stress",
      title: "Stress is doing the deciding",
      why: `Stress has averaged ${stressAvg.toFixed(1)}/10 with ${highStressDays} high day${highStressDays === 1 ? "" : "s"} this month. At that level the brain shortens its horizon — which is why plans keep slipping.`,
      move: "One ten-minute walk without your phone. It moves this number more than effort does.",
      weight: 90,
    });
  }
  if (earned > 0 && spent > earned) {
    push({
      id: "f-money",
      kind: "money",
      title: "Money is applying quiet pressure",
      why: `You've spent ${Math.round(spent).toLocaleString()} against ${Math.round(earned).toLocaleString()} earned this month — a gap of ${Math.round(spent - earned).toLocaleString()}. That pressure shows up as mood before it shows up as maths.`,
      move: leaks[0] ? `Start with ${leaks[0].label} — about ${leaks[0].monthly.toLocaleString()} a month.` : "Name one expense you'd be fine without and pause it.",
      weight: 86,
    });
  } else if (leakTotal > 0 && spent > 0 && leakTotal / spent > 0.15) {
    push({
      id: "f-money-leak",
      kind: "money",
      title: "Money is leaking, not overspending",
      why: `About ${Math.round(leakTotal).toLocaleString()} a month is going to things you haven't chosen recently.`,
      move: `Cancel or pause ${leaks[0]!.label} this week.`,
      weight: 72,
    });
  }
  if (skipped.length > 0) {
    push({
      id: "f-habits",
      kind: "habits",
      title: `“${skipped[0]!.name}” keeps falling off`,
      why: `Missed ${skipped[0]!.missed} of the last 14 days. A habit at this rate isn't a discipline problem — it's usually the wrong size or the wrong time.`,
      move: `Halve it. Do the smallest honest version of “${skipped[0]!.name}” today.`,
      weight: 74,
    });
  }
  if (open.length >= 12 || (open.length >= 8 && closedRecently <= 2)) {
    push({
      id: "f-decisions",
      kind: "decisions",
      title: "Too many open decisions",
      why: `${open.length} things are open and ${closedRecently} closed in two weeks. The list itself is now the work — every glance costs a small decision.`,
      move: "Choose three to keep for this week. Everything else moves to next week, untouched.",
      weight: 84,
    });
  }
  if (goalRows.length >= 3 && highOpen.length >= 3) {
    push({
      id: "f-goals",
      kind: "goals",
      title: "Your goals are competing for the same hours",
      why: `${goalRows.length} active goals and ${highOpen.length} high-priority tasks, all wanting the same finite attention. Progress averages ${Math.round(Number(avg(goalRows.map((g) => Number(g.progress ?? 0))) ?? 0))}%.`,
      move: "Name the one goal that matters most this month. The others become maintenance, not projects.",
      weight: 80,
    });
  }
  if (stale.length >= 3) {
    push({
      id: "f-clarity",
      kind: "clarity",
      title: "Some things aren't stuck — they're unclear",
      why: `${stale.length} items have sat untouched for more than two weeks. Usually that means the next physical step was never written down.`,
      move: `Rewrite “${stale[0]!.title}” as the very next action you could do in ten minutes.`,
      weight: 78,
    });
  }
  friction.sort((a, b) => b.weight - a.weight);

  /* -------------------------------- burnout -------------------------------- */
  const drivers: string[] = [];
  if (sleepAvg !== null && sleepAvg < 6.8) drivers.push(`sleep averaging ${sleepAvg.toFixed(1)}h`);
  if (stressAvg !== null && stressAvg >= 6) drivers.push(`stress at ${stressAvg.toFixed(1)}/10`);
  if (moodAvg !== null && moodAvg <= 2.6) drivers.push(`mood at ${moodAvg.toFixed(1)}/5`);
  if (meetingHoursWeek >= 18) drivers.push(`${Math.round(meetingHoursWeek)}h booked this week`);
  if (open.length >= 12 && closedRecently <= 3) drivers.push(`${open.length} open items, little closing`);
  if (habitRate !== null && habitRate < 0.3) drivers.push("routines mostly dropped");
  if ((workouts.data ?? []).length === 0) drivers.push("no movement logged");
  const burnoutScore = clamp(
    scores.burnout * 0.6 +
      Math.min(40, drivers.length * 9) +
      (collisions > 1 ? 6 : 0) +
      (overdue.length >= 4 ? 6 : 0),
  );

  /* ---------------------------- future risk preview ------------------------ */
  const risks: RiskPreview[] = [];
  if (burnoutScore >= 45) {
    risks.push({
      id: "r-burnout",
      area: "burnout",
      headline: burnoutScore >= 70 ? "Burnout is close" : "Burnout is building",
      ifNothingChanges: `At this pace — ${drivers.slice(0, 2).join(" and ") || "current load"} — expect the flat, unmotivated weeks to arrive within ${burnoutScore >= 70 ? "7–10 days" : "3–4 weeks"}. It usually announces itself as apathy, not exhaustion.`,
      likelihood: burnoutScore,
      horizon: burnoutScore >= 70 ? "next 10 days" : "next month",
    });
  }
  if (earned > 0 && spent > earned) {
    const monthlyGap = spent - earned;
    risks.push({
      id: "r-money",
      area: "money",
      headline: "This month's gap becomes a habit",
      ifNothingChanges: `Repeating this pace costs about ${Math.round(monthlyGap * 12).toLocaleString()} over a year — roughly ${Math.round(monthlyGap).toLocaleString()} a month you intended to keep.`,
      likelihood: clamp(55 + (monthlyGap / Math.max(1, earned)) * 100),
      horizon: "12 months",
    });
  }
  for (const g of dueSoonGoals.slice(0, 2)) {
    const p = Number(g.progress ?? 0);
    const daysLeft = Math.max(0, Math.round((new Date(g.target_date!).getTime() - now.getTime()) / day));
    if (p < 70) {
      risks.push({
        id: `r-goal-${g.title}`,
        area: "goals",
        headline: `“${g.title}” will be missed`,
        ifNothingChanges: `${p}% done with ${daysLeft} day${daysLeft === 1 ? "" : "s"} left. At the current rate this finishes late — moving the date is a legitimate answer.`,
        likelihood: clamp(100 - p - daysLeft),
        horizon: `${daysLeft} days`,
      });
    }
  }
  if (sleepAvg !== null && sleepAvg < 6.5 && (workouts.data ?? []).length <= 2) {
    risks.push({
      id: "r-health",
      area: "health",
      headline: "Health drifts quietly",
      ifNothingChanges: `Short sleep plus ${(workouts.data ?? []).length} sessions a month is the pattern that shows up later as weight, immunity and mood — slowly enough to miss.`,
      likelihood: 62,
      horizon: "3 months",
    });
  }
  if (open.length >= 10 && closedRecently <= 3) {
    risks.push({
      id: "r-focus",
      area: "focus",
      headline: "The list outgrows you",
      ifNothingChanges: `Closing ${closedRecently} while holding ${open.length} means the backlog roughly doubles each month. At some point you'll stop opening the list at all.`,
      likelihood: 70,
      horizon: "6 weeks",
    });
  }
  risks.sort((a, b) => b.likelihood - a.likelihood);

  /* --------------------------- self-sabotage radar ------------------------- */
  const patterns: Pattern[] = [];
  if (lateNights >= 3) {
    patterns.push({
      id: "p-late",
      title: "Late nights, then heavy mornings",
      detail: `${lateNights} nights this month you went to bed after 1am. The days after are where your focus score drops.`,
      occurrences: lateNights,
    });
  }
  if (spendRatio !== null && spendRatio > 1.4 && stressAvg !== null && stressAvg >= 6) {
    patterns.push({
      id: "p-stress-spend",
      title: "Stress spending",
      detail: `The last three days ran ${Math.round((spendRatio - 1) * 100)}% above your usual pace, and stress was high through the same stretch. It's a coping pattern, not a character flaw.`,
      occurrences: 1,
    });
  }
  if (skipped.length >= 2) {
    patterns.push({
      id: "p-skip",
      title: "Routines drop together",
      detail: `${skipped.map((s) => s.name).slice(0, 3).join(", ")} all slipped in the same period. They usually fall as a group when sleep or stress moves first.`,
      occurrences: skipped.length,
    });
  }
  if (stale.length >= 3) {
    patterns.push({
      id: "p-procrast",
      title: "The same items keep being carried forward",
      detail: `${stale.length} tasks have survived more than two weeks untouched, including “${stale[0]!.title}”.`,
      occurrences: stale.length,
    });
  }
  if ((workouts.data ?? []).length > 0 && (workouts.data ?? []).length <= 3 && habitRows.length > 0) {
    patterns.push({
      id: "p-move",
      title: "Movement is the first thing dropped",
      detail: `Only ${(workouts.data ?? []).length} session${(workouts.data ?? []).length === 1 ? "" : "s"} in 30 days, while other habits kept going. Movement tends to be the first casualty of a full week.`,
      occurrences: (workouts.data ?? []).length,
    });
  }

  /* ----------------------------- goal conflicts ---------------------------- */
  const goalConflicts: Array<{ title: string; detail: string }> = [];
  if (dueSoonGoals.length >= 2) {
    goalConflicts.push({
      title: `${dueSoonGoals.length} goals land in the same month`,
      detail: `${dueSoonGoals.map((g) => `“${g.title}”`).slice(0, 3).join(", ")} all come due within 30 days. Sequence them — pick which one gets this month and which gets next.`,
    });
  }
  if (stalledGoals.length >= 2) {
    goalConflicts.push({
      title: "Several goals are barely moving",
      detail: `${stalledGoals.length} goals sit under 25%. That's usually a sign of too many open fronts rather than low effort — parking one often unblocks the others.`,
    });
  }
  if (goalRows.length > 0 && earned > 0 && spent > earned) {
    const money = goalRows.find((g) => /save|debt|fund|invest|money/i.test(g.title));
    if (money) {
      goalConflicts.push({
        title: `“${money.title}” conflicts with this month's spending`,
        detail: `You're spending more than you earn while holding a money goal. One of the two has to give — and the goal is the honest one to keep.`,
      });
    }
  }
  if (meetingHoursWeek >= 20 && goalRows.length > 0) {
    goalConflicts.push({
      title: "Your calendar has no room for your goals",
      detail: `About ${Math.round(meetingHoursWeek)}h is already committed this week. Goals need booked time, not leftover time.`,
    });
  }

  /* ------------------------------- life graph ------------------------------ */
  const graph: GraphEdge[] = [];
  const edge = (from: string, to: string, strength: number, line: string) =>
    graph.push({ from, to, strength: clamp(strength), line });

  if (sleepAvg !== null) {
    edge("Sleep", "Focus", sleepAvg < 6.8 ? 88 : 62, sleepAvg < 6.8
      ? `${sleepAvg.toFixed(1)}h nights, and ${overdue.length} things already past their date.`
      : `${sleepAvg.toFixed(1)}h nights — your steadiest input right now.`);
  }
  if (stressAvg !== null && spendRatio !== null) {
    edge("Stress", "Money", stressAvg >= 6 && spendRatio > 1.2 ? 84 : 46,
      `Stress at ${stressAvg.toFixed(1)}/10 with recent spending at ${spendRatio.toFixed(1)}× your usual pace.`);
  }
  if (habitRate !== null && goalRows.length) {
    edge("Habits", "Goals", habitRate < 0.4 ? 80 : 66,
      `Routines kept ${Math.round(habitRate * 100)}% of the time, goals averaging ${Math.round(Number(avg(goalRows.map((g) => Number(g.progress ?? 0))) ?? 0))}%.`);
  }
  if (eventRows.length) {
    edge("Calendar", "Energy", meetingHoursWeek >= 18 ? 82 : 50,
      `${Math.round(meetingHoursWeek)}h booked this week${collisions ? `, ${collisions} overlapping` : ""}.`);
  }
  if (moodAvg !== null) {
    edge("Money", "Mood", earned > 0 && spent > earned ? 76 : 40,
      earned > 0 && spent > earned
        ? `Spending above income this month, mood at ${moodAvg.toFixed(1)}/5.`
        : `Money is steady and mood sits at ${moodAvg.toFixed(1)}/5.`);
    edge("Mood", "Focus", moodAvg <= 2.6 ? 78 : 52,
      `Mood ${moodAvg.toFixed(1)}/5 alongside ${closedRecently} things closed in two weeks.`);
  }
  if ((workouts.data ?? []).length >= 0 && moodAvg !== null) {
    edge("Movement", "Mood", (workouts.data ?? []).length <= 2 ? 70 : 58,
      `${(workouts.data ?? []).length} sessions logged in 30 days.`);
  }
  if (habitRows.length && sleepAvg !== null) {
    edge("Sleep", "Habits", 64, `Routines hold together on nights above 7h and scatter below it.`);
  }
  graph.sort((a, b) => b.strength - a.strength);

  /* ------------------------------ rescue mode ----------------------------- */
  const rescue: RescueAction[] = [];
  const smallest = [...open].sort((a, b) => a.title.length - b.title.length)[0];
  if (overdue[0]) {
    rescue.push({ title: overdue[0].title, why: "It's already past its date — closing it stops the noise.", kind: "task" });
  } else if (highOpen[0]) {
    rescue.push({ title: highOpen[0].title, why: "The one that actually matters today.", kind: "task" });
  } else if (smallest) {
    rescue.push({ title: smallest.title, why: "Small and finishable — finishing something is the point.", kind: "task" });
  }
  const easyHabit = habitRows[0];
  if (easyHabit) {
    rescue.push({ title: easyHabit.name, why: "The smallest honest version counts. Consistency, not perfection.", kind: "habit" });
  }
  rescue.push(
    sleepAvg !== null && sleepAvg < 7
      ? { title: "Be in bed 30 minutes early", why: `You're averaging ${sleepAvg.toFixed(1)}h. This is the highest-leverage thing available today.`, kind: "rest" }
      : { title: "Ten quiet minutes, no screen", why: "A short reset does more for the rest of today than pushing harder will.", kind: "rest" },
  );

  return {
    today,
    scores: {
      life: scores.life,
      health: scores.health,
      finance: scores.finance,
      productivity: scores.productivity,
      happiness: scores.happiness,
      burnout: scores.burnout,
    },
    breakdown: scores.breakdown,
    friction: friction.slice(0, 6),
    risks: risks.slice(0, 5),
    patterns: patterns.slice(0, 5),
    leaks: leaks.slice(0, 5),
    leakTotal: Math.round(leakTotal),
    burnout: { score: burnoutScore, drivers, window: burnoutScore >= 70 ? "next 10 days" : "next month" },
    goalConflicts: goalConflicts.slice(0, 4),
    graph: graph.slice(0, 8),
    rescue: rescue.slice(0, 3),
    facts: {
      sleepAvg: sleepAvg === null ? null : Number(sleepAvg.toFixed(1)),
      shortNights,
      lateNights,
      moodAvg: moodAvg === null ? null : Number(moodAvg.toFixed(1)),
      energyAvg: energyAvg === null ? null : Number(energyAvg.toFixed(1)),
      stressAvg: stressAvg === null ? null : Number(stressAvg.toFixed(1)),
      highStressDays,
      openTasks: open.length,
      overdueTasks: overdue.length,
      staleTasks: stale.length,
      closedRecently,
      habitRate: habitRate === null ? null : Number(habitRate.toFixed(2)),
      workouts30: (workouts.data ?? []).length,
      meetingHoursWeek: Math.round(meetingHoursWeek),
      calendarCollisions: collisions,
      spentThisMonth: Math.round(spent),
      earnedThisMonth: Math.round(earned),
      recentSpendRatio: spendRatio === null ? null : Number(spendRatio.toFixed(2)),
      leakTotal: Math.round(leakTotal),
      activeGoals: goalRows.length,
      timeBlocks14: (blocks.data ?? []).length,
    },
  };
}
