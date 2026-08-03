import { Link, useRouterState } from "@tanstack/react-router";
import { House, CalendarCheck, Sparkles, ChartLine, User } from "lucide-react";
import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/notifications-bell";

type Tab = { to: string; label: string; icon: typeof House; center?: boolean };

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/plan", label: "Plan", icon: CalendarCheck },
  { to: "/ai", label: "Origin", icon: Sparkles, center: true },
  { to: "/insights", label: "Insights", icon: ChartLine },
  { to: "/account", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-paper text-ink flex justify-center">
      <div className="w-full max-w-[520px] min-h-screen flex flex-col relative">
        <header className="sticky top-0 z-30 glass px-6 py-3.5 flex items-center justify-between border-x-0 border-t-0">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-serif text-[15px] tracking-tight">Origin</span>
          </Link>
          <NotificationsBell />
        </header>

        <main className="flex-1 pb-32">{children}</main>

        <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-[520px] px-4 pb-5 pointer-events-auto">
            <div className="card-lift rounded-2xl px-2.5 py-2 flex items-center justify-between">
              {tabs.map((t) => {
                const active =
                  t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(`${t.to}/`);
                const Icon = t.icon;

                if (t.center) {
                  return (
                    <Link
                      key={t.to}
                      to={t.to as never}
                      aria-label={t.label}
                      className="press mx-1 size-12 shrink-0 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center"
                      style={{ boxShadow: "var(--shadow-soft)" }}
                    >
                      <Icon className="size-5" strokeWidth={1.8} />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={t.to}
                    to={t.to as never}
                    aria-label={t.label}
                    className={`press flex flex-1 flex-col items-center gap-1 rounded-xl py-2 ${
                      active ? "text-ink" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-[21px]" strokeWidth={active ? 2.1 : 1.7} />
                    <span className={`text-[10px] tracking-wide ${active ? "font-semibold" : "font-medium"}`}>
                      {t.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
