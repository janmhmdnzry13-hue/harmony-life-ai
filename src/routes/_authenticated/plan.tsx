import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  FileLock,
  Kanban,
  Plane,
  Repeat,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Plan — Origin Life OS" },
      { name: "description", content: "Tasks, habits, calendar and projects in one calm place." },
      { property: "og:title", content: "Plan — Origin Life OS" },
      { property: "og:description", content: "Tasks, habits, calendar and projects in one calm place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

const PRIMARY = [
  { to: "/tasks", label: "Tasks", desc: "What needs doing today", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", desc: "Streaks and daily rituals", icon: Repeat },
  { to: "/calendar", label: "Calendar", desc: "Events and time blocks", icon: CalendarDays },
];

const MORE = [
  { to: "/projects", label: "Projects", desc: "Boards and milestones", icon: Kanban },
  { to: "/people", label: "People", desc: "Birthdays, gifts, check-ins", icon: Users },
  { to: "/travel", label: "Travel", desc: "Trips, packing, journals", icon: Plane },
  { to: "/docs", label: "Documents", desc: "Secure vault and scans", icon: FileLock },
  { to: "/assistant", label: "Assistant", desc: "Weekly review", icon: Sparkles },
];

function PlanPage() {
  return (
    <div className="px-5 pt-8 pb-4 space-y-4">
      <header className="px-1 pb-2 rise">
        <p className="label-quiet">Plan</p>
        <h1 className="mt-2 font-serif text-[34px] leading-tight tracking-tight">Your commitments.</h1>
      </header>

      <div className="space-y-4">
        {PRIMARY.map((h) => {
          const Icon = h.icon;
          return (
            <Link key={h.to} to={h.to as never} className="press card-soft flex items-center gap-4 p-5 rise">
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

      <details className="card-soft overflow-hidden rise">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold">
          More tools
          <span className="ml-2 text-xs font-normal text-muted-foreground">projects, people, travel…</span>
        </summary>
        <div className="divide-y divide-border border-t border-border">
          {MORE.map((h) => {
            const Icon = h.icon;
            return (
              <Link key={h.to} to={h.to as never} className="flex items-center gap-4 px-5 py-4">
                <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{h.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{h.desc}</span>
                </span>
                <span className="text-muted-foreground">→</span>
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}
