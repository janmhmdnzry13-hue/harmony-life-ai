import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, Sparkles, Flame, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/ai", label: "Origin", icon: Sparkles, center: true },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/calendar", label: "Plan", icon: CalendarDays },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-paper text-ink flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">
        <main className="flex-1 pb-28">{children}</main>

        <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-[480px] pointer-events-auto bg-paper/95 backdrop-blur border-t border-ink/10 px-4 pt-3 pb-6 flex justify-between items-center">
            {tabs.map((t) => {
              const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
              const Icon = t.icon;
              if (t.center) {
                return (
                  <Link key={t.to} to={t.to} className="flex flex-col items-center gap-1 -mt-6">
                    <div className="size-12 bg-ink text-paper border border-ink flex items-center justify-center">
                      <Icon className="size-5" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-medium text-ink/50">
                      {t.label}
                    </span>
                  </Link>
                );
              }
              return (
                <Link key={t.to} to={t.to} className="flex flex-col items-center gap-1 py-1 px-2">
                  <Icon
                    className={`size-5 ${active ? "text-ink" : "text-ink/30"}`}
                    strokeWidth={1.8}
                  />
                  <span
                    className={`text-[10px] uppercase tracking-widest font-medium ${active ? "text-ink" : "text-ink/40"}`}
                  >
                    {t.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
