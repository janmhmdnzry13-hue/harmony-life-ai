import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Db = SupabaseClient<Database>;

export type ScoreBreakdown = {
  health: { sleepHours: number | null; workouts: number; stepsAvg: number | null; waterAvg: number | null };
  happiness: { moodAvg: number | null; stressAvg: number | null; gratitudeDays: number; reflections: number };
  productivity: { tasks: number; tasksDone: number; completionRate: number; habitConsistency: number; timeBlocks: number };
  finance: { income: number; expense: number; savingsRate: number; net: number; budgetAdherence: number | null; netWorth: number };
  goals: { total: number; avgProgress: number; overdue: number };
};

export type Scores = {
  life: number;
  health: number;
  finance: number;
  productivity: number;
  happiness: number;
  burnout: number;
  breakdown: ScoreBreakdown;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : null);
const ratio = (v: number | null, target: number) => (v === null ? null : clamp((v / target) * 100));

function blend(parts: (number | null)[], fallback = 50) {
  const known = parts.filter((p): p is number => p !== null);
  return known.length ? clamp(avg(known)!) : fallback;
}

export async function computeScores(supabase: Db): Promise<Scores> {
  const days = 14;
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString();
  const since = sinceIso.slice(0, 10);
  const monthStart = new Date().toISOString().slice(0, 8) + "01";

  const [sleep, workouts, steps, water, mood, stress, gratitude, reflection, tasks, habits, hlogs, blocks, tx, budgets, accounts, holdings, goals] =
    await Promise.all([
      supabase.from("sleep_logs").select("duration_min,quality,log_date").gte("log_date", since),
      supabase.from("workouts").select("id,log_date").gte("log_date", since),
      supabase.from("step_logs").select("steps,log_date").gte("log_date", since),
      supabase.from("water_logs").select("amount_ml,log_date").gte("log_date", since),
      supabase.from("mood_logs").select("mood,energy,logged_at").gte("logged_at", sinceIso),
      supabase.from("stress_logs").select("level,logged_at").gte("logged_at", sinceIso),
      supabase.from("gratitude_entries").select("log_date").gte("log_date", since),
      supabase.from("reflection_entries").select("log_date").gte("log_date", since),
      supabase.from("tasks").select("id,completed,due_date,created_at").gte("created_at", sinceIso),
      supabase.from("habits").select("id").eq("archived", false),
      supabase.from("habit_logs").select("habit_id,log_date").gte("log_date", since),
      supabase.from("time_blocks").select("id,date").gte("date", since),
      supabase.from("transactions").select("type,amount,category,occurred_on").gte("occurred_on", monthStart),
      supabase.from("budgets").select("category,amount,month"),
      supabase.from("accounts").select("balance"),
      supabase.from("holdings").select("quantity,avg_cost,current_price"),
      supabase.from("goals").select("progress,status,target_date"),
    ]);

  // Health
  const sleepHours = avg((sleep.data ?? []).map((r) => Number(r.duration_min ?? 0) / 60).filter((n) => n > 0));
  const workoutCount = workouts.data?.length ?? 0;
  const stepsAvg = avg((steps.data ?? []).map((r) => Number(r.steps ?? 0)));
  const waterAvg = avg((water.data ?? []).map((r) => Number(r.amount_ml ?? 0)));
  const health = blend([
    sleepHours === null ? null : clamp(100 - Math.abs(sleepHours - 7.75) * 18),
    (workouts.data ?? []).length ? ratio(workoutCount, 6) : null,
    ratio(stepsAvg, 8000),
    ratio(waterAvg, 2000),
  ]);

  // Happiness
  const moodAvg = avg((mood.data ?? []).map((r) => Number(r.mood)));
  const stressAvg = avg((stress.data ?? []).map((r) => Number(r.level)));
  const gratitudeDays = new Set((gratitude.data ?? []).map((r) => r.log_date)).size;
  const reflections = reflection.data?.length ?? 0;
  const happiness = blend([
    moodAvg === null ? null : clamp((moodAvg / 5) * 100),
    stressAvg === null ? null : clamp(100 - (stressAvg / 10) * 100),
    gratitudeDays ? ratio(gratitudeDays, days) : null,
    reflections ? ratio(reflections, 7) : null,
  ]);

  // Productivity
  const taskArr = tasks.data ?? [];
  const tasksDone = taskArr.filter((t) => t.completed).length;
  const completionRate = taskArr.length ? tasksDone / taskArr.length : 0;
  const habitCount = habits.data?.length ?? 0;
  const habitConsistency = habitCount ? Math.min(1, (hlogs.data ?? []).length / (habitCount * days)) : 0;
  const blockCount = blocks.data?.length ?? 0;
  const productivity = blend([
    taskArr.length ? clamp(completionRate * 100) : null,
    habitCount ? clamp(habitConsistency * 100) : null,
    blockCount ? ratio(blockCount, days) : null,
  ]);

  // Finance
  const txArr = tx.data ?? [];
  const income = txArr.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txArr.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const thisMonth = monthStart;
  const monthBudgets = (budgets.data ?? []).filter((b) => String(b.month).slice(0, 7) === thisMonth.slice(0, 7));
  let budgetAdherence: number | null = null;
  if (monthBudgets.length) {
    const scores = monthBudgets.map((b) => {
      const spent = txArr
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((s, t) => s + Number(t.amount), 0);
      const cap = Number(b.amount) || 1;
      return clamp(100 - Math.max(0, (spent - cap) / cap) * 100);
    });
    budgetAdherence = clamp(avg(scores)!);
  }
  const cash = (accounts.data ?? []).reduce((s, a) => s + Number(a.balance), 0);
  const portfolio = (holdings.data ?? []).reduce(
    (s, h) => s + Number(h.quantity) * Number(h.current_price ?? h.avg_cost),
    0,
  );
  const netWorth = cash + portfolio;
  const finance = blend([
    income > 0 ? clamp(savingsRate * 250) : null,
    budgetAdherence,
    netWorth !== 0 ? clamp(netWorth > 0 ? 70 + Math.min(30, Math.log10(Math.max(1, netWorth)) * 6) : 20) : null,
  ]);

  // Goals
  const goalArr = goals.data ?? [];
  const activeGoals = goalArr.filter((g) => g.status !== "done");
  const avgProgress = avg(activeGoals.map((g) => Number(g.progress ?? 0))) ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = activeGoals.filter((g) => g.target_date && g.target_date < today && Number(g.progress) < 100).length;

  const life = clamp(health * 0.28 + happiness * 0.24 + productivity * 0.26 + finance * 0.22);

  const burnout = clamp(
    (sleepHours !== null && sleepHours < 6.5 ? 28 : 0) +
      (stressAvg !== null && stressAvg >= 7 ? 26 : stressAvg !== null && stressAvg >= 5 ? 12 : 0) +
      (moodAvg !== null && moodAvg <= 2.5 ? 22 : 0) +
      (habitCount && habitConsistency < 0.3 ? 12 : 0) +
      (taskArr.length > 12 && completionRate < 0.35 ? 14 : 0) +
      (workoutCount === 0 ? 8 : 0),
  );

  return {
    life,
    health,
    finance,
    productivity,
    happiness,
    burnout,
    breakdown: {
      health: {
        sleepHours: sleepHours === null ? null : Number(sleepHours.toFixed(1)),
        workouts: workoutCount,
        stepsAvg: stepsAvg === null ? null : Math.round(stepsAvg),
        waterAvg: waterAvg === null ? null : Math.round(waterAvg),
      },
      happiness: {
        moodAvg: moodAvg === null ? null : Number(moodAvg.toFixed(2)),
        stressAvg: stressAvg === null ? null : Number(stressAvg.toFixed(2)),
        gratitudeDays,
        reflections,
      },
      productivity: {
        tasks: taskArr.length,
        tasksDone,
        completionRate: Number(completionRate.toFixed(2)),
        habitConsistency: Number(habitConsistency.toFixed(2)),
        timeBlocks: blockCount,
      },
      finance: {
        income: Math.round(income),
        expense: Math.round(expense),
        savingsRate: Number(savingsRate.toFixed(2)),
        net: Math.round(income - expense),
        budgetAdherence,
        netWorth: Math.round(netWorth),
      },
      goals: { total: activeGoals.length, avgProgress: Math.round(avgProgress), overdue },
    },
  };
}

export async function buildContextSnapshot(supabase: Db) {
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);
  const [scores, memories, tasks, events, habits, goals] = await Promise.all([
    computeScores(supabase),
    supabase.from("ai_memories").select("kind,content,importance").order("importance", { ascending: false }).limit(40),
    supabase.from("tasks").select("title,priority,due_date").eq("completed", false).limit(20),
    supabase.from("events").select("title,starts_at").gte("starts_at", nowIso).order("starts_at").limit(10),
    supabase.from("habits").select("name,target_per_day").eq("archived", false).limit(20),
    supabase.from("goals").select("title,progress,target_date,status").neq("status", "done").limit(15),
  ]);
  return {
    today,
    scores: { life: scores.life, health: scores.health, finance: scores.finance, productivity: scores.productivity, happiness: scores.happiness, burnout: scores.burnout },
    breakdown: scores.breakdown,
    memories: memories.data ?? [],
    openTasks: tasks.data ?? [],
    upcomingEvents: events.data ?? [],
    habits: habits.data ?? [],
    goals: goals.data ?? [],
  };
}
