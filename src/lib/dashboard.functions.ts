import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function avg(values: number[]) {
  const clean = values.filter((n) => Number.isFinite(n));
  return clean.length ? clean.reduce((sum, n) => sum + n, 0) / clean.length : null;
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = todayStr();
    const monthKey = today.slice(0, 7);
    const eventsFrom = new Date();
    eventsFrom.setDate(eventsFrom.getDate() - 1);
    const eventsTo = new Date();
    eventsTo.setDate(eventsTo.getDate() + 60);

    await Promise.all([
      context.supabase.from("tasks").delete().lt("expires_on", today),
      context.supabase.from("habits").delete().lt("expires_on", today),
    ]);

    const [profile, tasks, habits, habitLogs, events, transactions, sleep, mood, stress, latestScore, insights] =
      await Promise.all([
        context.supabase
          .from("profiles")
          .select("id, display_name, energy_level")
          .eq("id", context.userId)
          .maybeSingle(),
        context.supabase
          .from("tasks")
          .select("id, title, tag, priority, completed, due_date, created_at")
          .order("completed", { ascending: true })
          .order("due_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(100),
        context.supabase
          .from("habits")
          .select("id, name")
          .eq("archived", false)
          .order("created_at")
          .limit(100),
        context.supabase.from("habit_logs").select("habit_id, log_date, count").eq("log_date", today),
        context.supabase
          .from("events")
          .select("id, title, location, starts_at, ends_at")
          .gte("starts_at", eventsFrom.toISOString())
          .lte("starts_at", eventsTo.toISOString())
          .order("starts_at")
          .limit(25),
        context.supabase
          .from("transactions")
          .select("id, type, amount, occurred_on")
          .gte("occurred_on", `${monthKey}-01`)
          .order("occurred_on", { ascending: false })
          .limit(200),
        context.supabase
          .from("sleep_logs")
          .select("id, log_date, duration_min, quality")
          .order("log_date", { ascending: false })
          .limit(7),
        context.supabase
          .from("mood_logs")
          .select("id, mood, energy, logged_at")
          .order("logged_at", { ascending: false })
          .limit(7),
        context.supabase
          .from("stress_logs")
          .select("id, level, logged_at")
          .order("logged_at", { ascending: false })
          .limit(7),
        context.supabase
          .from("life_scores")
          .select("life_score, health_score, finance_score, productivity_score, happiness_score, score_date")
          .order("score_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        context.supabase
          .from("ai_insights")
          .select("id, kind, domain, title, body, severity, confidence, created_at")
          .eq("dismissed", false)
          .order("severity", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

    const failedResult = [profile, tasks, habits, habitLogs, events, transactions, sleep, mood, stress, latestScore, insights].find(
      (result) => result.error,
    );
    if (failedResult?.error) throw new Error(failedResult.error.message);

    const taskRows = tasks.data ?? [];
    const habitRows = habits.data ?? [];
    const logRows = habitLogs.data ?? [];
    const eventRows = events.data ?? [];
    const transactionRows = transactions.data ?? [];
    const sleepRows = sleep.data ?? [];
    const moodRows = mood.data ?? [];
    const stressRows = stress.data ?? [];
    const openTasks = taskRows.filter((task) => !task.completed);
    const focusTask = openTasks.find((task) => task.priority === "high") ?? openTasks[0] ?? null;
    const doneToday = habitRows.filter((habit) => logRows.some((log) => log.habit_id === habit.id && log.log_date === today));
    const inMonth = transactionRows.filter((tx) => tx.occurred_on?.slice(0, 7) === monthKey);
    const spent = inMonth.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount), 0);
    const earned = inMonth.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount), 0);
    const lastSleep = sleepRows[0] ?? null;
    const latestStress = stressRows[0] ?? null;
    const score = latestScore.data;

    return {
      profile: profile.data,
      today,
      focusTask,
      nextAction: openTasks.find((task) => task.id !== focusTask?.id) ?? null,
      tasks: {
        total: taskRows.length,
        openCount: openTasks.length,
        completedCount: taskRows.length - openTasks.length,
      },
      habits: {
        items: habitRows,
        logs: logRows,
        completedTodayCount: doneToday.length,
        total: habitRows.length,
        completionPercentage: habitRows.length ? Math.round((doneToday.length / habitRows.length) * 100) : 0,
      },
      upcomingEvents: eventRows,
      eventsTodayCount: eventRows.filter((event) => event.starts_at?.slice(0, 10) === today).length,
      financeSummary: { spent, earned, monthTransactions: inMonth },
      sleepSummary: { latest: lastSleep, hours: lastSleep?.duration_min ? Number(lastSleep.duration_min) / 60 : null },
      moodSummary: { recent: moodRows, average: avg(moodRows.map((entry) => Number(entry.mood))) },
      stressSummary: { recent: stressRows, currentLevel: latestStress?.level ?? null },
      latestLifeScore: score
        ? {
            ...score,
            life_score: num(score.life_score),
            health_score: num(score.health_score),
            finance_score: num(score.finance_score),
            productivity_score: num(score.productivity_score),
            happiness_score: num(score.happiness_score),
          }
        : null,
      importantInsights: insights.data ?? [],
    };
  });
