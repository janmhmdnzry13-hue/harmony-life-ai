import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  FileLock,
  Heart,
  Kanban,
  Plane,
  Repeat,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { haptic } from "@/lib/feel";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Plan — Origin Life OS" },
      { name: "description", content: "Every part of your life — today, wellbeing, money and people — in one place." },
      { property: "og:title", content: "Plan — Origin Life OS" },
      {
        property: "og:description",
        content: "Every part of your life — today, wellbeing, money and people — in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

const TODAY = [
  { to: "/tasks", label: "Tasks", desc: "What needs doing today", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", desc: "Streaks and daily rituals", icon: Repeat },
  { to: "/calendar", label: "Calendar", desc: "Events and time blocks", icon: CalendarDays },
];

const GROUPS: { title: string; note: string; items: { to: string; label: string; icon: typeof Heart }[] }[] = [
  {
    title: "Wellbeing",
    note: "Rest and mood shape everything else here",
    items: [
      { to: "/wellness", label: "Health", icon: Heart },
      { to: "/wellness/mind", label: "Mind", icon: Brain },
      { to: "/wellness/learn", label: "Learning", icon: BookOpen },
    ],
  },
  {
    title: "Money",
    note: "Spending moves with stress more than you'd think",
    items: [
      { to: "/finance", label: "Finance", icon: Wallet },
      { to: "/finance/invest", label: "Investing", icon: TrendingUp },
      { to: "/finance/networth", label: "Net worth", icon: Target },
    ],
  },
  {
    title: "Work & life",
    note: "The longer arcs — projects, people, places",
    items: [
      { to: "/projects", label: "Projects", icon: Kanban },
      { to: "/people", label: "People", icon: Users },
      { to: "/travel", label: "Travel", icon: Plane },
      { to: "/docs", label: "Documents", icon: FileLock },
      { to: "/assistant", label: "Review", icon: Sparkles },
    ],
  },
];

function PlanPage() {
  return (
    <div className="space-y-4 px-5 pb-4 pt-8">
      <header className="rise px-1 pb-2">
        <p className="label-quiet">Plan</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">Your whole life.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Start with today. Everything deeper is one tap away.
        </p>
      </header>

      <div className="space-y-4">
        {TODAY.map((h) => {
          const Icon = h.icon;
          return (
            <Link
              key={h.to}
              to={h.to as never}
              onClick={() => haptic("tap")}
              className="press card-soft rise flex items-center gap-4 p-5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface">
                <Icon className="size-[18px] text-accent" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-lg leading-snug">{h.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{h.desc}</span>
              </span>
              <span className="text-muted-foreground">→</span>
            </Link>
          );
        })}
      </div>

      {GROUPS.map((g) => (
        <section key={g.title} className="card-soft rise p-6">
          <p className="label-quiet">{g.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{g.note}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {g.items.map((i) => {
              const Icon = i.icon;
              return (
                <Link
                  key={i.to}
                  to={i.to as never}
                  onClick={() => haptic("tap")}
                  className="press flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-xs font-medium"
                >
                  <Icon className="size-3.5 text-accent" strokeWidth={2} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
