import { Link, useRouterState } from "@tanstack/react-router";
import {
  House,
  CheckCircle2,
  Repeat,
  Sparkles,
  ChartLine,
  CalendarCheck,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/notifications-bell";
import { CelebrationProvider } from "@/components/celebration";
import { haptic } from "@/lib/feel";

type Tab = { to: string; label: string; icon: typeof House; center?: boolean };

const tabs: Tab[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/tasks", label: "Tasks", icon: CheckCircle2 },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/ai", label: "Origin", icon: Sparkles, center: true },
  { to: "/plan", label: "Plan", icon: CalendarCheck },
  { to: "/insights", label: "Insights", icon: ChartLine },
  { to: "/account", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onAi = pathname === "/ai";

  return (
    <CelebrationProvider>
      <div className="min-h-screen bg-paper text-ink flex justify-center">
        <div className="w-full max-w-[520px] min-h-screen flex flex-col relative">
          <header className="sticky top-0 z-30 glass px-5 py-3 flex items-center justify-between border-x-0 border-t-0">
            <Link to="/" className="flex items-center gap-2.5" onClick={() => haptic("tap")}>
              <span className="grid size-8 place-items-center rounded-xl bg-accent-soft">
                <span className="size-2.5 rounded-full bg-accent" />
              </span>
              <span className="leading-none">
                <span className="block font-serif text-[15px] tracking-tight">Origin</span>
                <span className="block text-[10px] tracking-wide text-muted-foreground">
                  Your life. Organized.
                </span>
              </span>
            </Link>
            <NotificationsBell />
          </header>

          <main className="flex-1 pb-32">{children}</main>

          {/* Floating AI assistant — reachable from anywhere, never in the way */}
          {!onAi && (
            <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 flex justify-center">
              <div className="w-full max-w-[520px] relative">
                <Link
                  to="/ai"
                  aria-label="Ask Origin"
                  onClick={() => haptic("soft")}
                  className="press orb pointer-events-auto absolute bottom-[104px] right-5 grid size-[52px] place-items-center rounded-full bg-accent text-accent-foreground"
                  style={{ boxShadow: "var(--shadow-lift)" }}
                >
                  <Sparkles className="size-[22px]" strokeWidth={1.9} />
                </Link>
              </div>
            </div>
          )}

          <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
            <div className="w-full max-w-[520px] px-3 pb-4 pointer-events-auto">
              <div className="card-lift rounded-2xl px-1.5 py-1.5 flex items-center justify-between">
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
                        onClick={() => haptic("soft")}
                        className="press mx-0.5 size-11 shrink-0 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center"
                        style={{ boxShadow: "var(--shadow-soft)" }}
                      >
                        <Icon className="size-[19px]" strokeWidth={1.9} />
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={t.to}
                      to={t.to as never}
                      aria-label={t.label}
                      onClick={() => haptic("tap")}
                      className={`press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 ${
                        active ? "text-accent" : "text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-[19px]" strokeWidth={active ? 2.2 : 1.7} />
                      <span className={`text-[9px] tracking-wide ${active ? "font-bold" : "font-medium"}`}>
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
    </CelebrationProvider>
  );
}
