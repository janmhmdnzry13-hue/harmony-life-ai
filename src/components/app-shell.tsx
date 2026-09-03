import { Link, useRouterState } from "@tanstack/react-router";
import { House, Heart, Repeat, CalendarCheck, User, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/notifications-bell";
import { CelebrationProvider } from "@/components/celebration";
import { haptic } from "@/lib/feel";

type Tab = { to: string; label: string; icon: typeof House; match: string[] };

/** Home | Health | Habits | Plan | Profile — the five places the app lives. */
const tabs: Tab[] = [
  { to: "/", label: "Home", icon: House, match: [] },
  { to: "/wellness", label: "Health", icon: Heart, match: ["/wellness"] },
  { to: "/habits", label: "Habits", icon: Repeat, match: ["/habits"] },
  {
    to: "/plan",
    label: "Plan",
    icon: CalendarCheck,
    match: ["/plan", "/tasks", "/calendar", "/projects", "/capture", "/understand", "/rescue"],
  },
  { to: "/account", label: "Profile", icon: User, match: ["/account", "/settings"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onAi = pathname === "/ai";

  return (
    <CelebrationProvider>
      <div className="min-h-screen bg-paper text-ink flex justify-center">
        <div className="w-full max-w-[520px] min-h-screen flex flex-col relative">
          {/* Warm ambient wash + film grain, straight from the reference */}
          <div className="mesh pointer-events-none fixed inset-0 z-0 opacity-55" aria-hidden />
          <div className="grain pointer-events-none fixed inset-0 z-0 opacity-[0.025]" aria-hidden />

          {!onAi && (
            <header className="sticky top-0 z-30 glass px-6 py-3.5 flex items-center justify-between border-x-0 border-t-0">
              <Link to="/" className="flex items-center gap-3" onClick={() => haptic("tap")}>
                <span
                  className="size-8 rounded-[9px]"
                  style={{
                    background:
                      "conic-gradient(from 200deg, var(--amber), var(--clay), var(--teal), var(--amber))",
                  }}
                />
                <span className="leading-none">
                  <span className="block text-[14px] font-bold tracking-[0.2px]">Origin</span>
                  <span className="block mt-[3px] text-[10.5px] text-muted-foreground">
                    Your life, unhurried.
                  </span>
                </span>
              </Link>
              <NotificationsBell />
            </header>
          )}


          <main className="flex-1 pb-32">{children}</main>

          {/* Floating AI button → full-screen AI conversation (hidden while in it) */}
          {!onAi && (
            <div className="pointer-events-none fixed bottom-0 inset-x-0 z-40 flex justify-center">
              <div className="w-full max-w-[520px] relative">
                <Link
                  to="/ai"
                  aria-label="Ask Origin"
                  onClick={() => haptic("soft")}
                  className="press orb pointer-events-auto absolute bottom-[104px] right-5 grid size-[56px] place-items-center rounded-full p-[3px]"
                  style={{
                    background:
                      "conic-gradient(from 200deg, var(--amber), var(--accent), var(--sky), var(--amber))",
                    boxShadow: "var(--shadow-lift)",
                  }}
                >
                  <span className="grid size-full place-items-center rounded-full bg-card">
                    <Sparkles className="size-[22px] text-accent" strokeWidth={1.9} />
                  </span>
                </Link>
              </div>
            </div>
          )}

          {!onAi && (
            <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
              <div className="w-full max-w-[520px] px-3 pb-4 pointer-events-auto">
                <div className="card-lift rounded-2xl px-2 py-1.5 flex items-center justify-between">
                  {tabs.map((t) => {
                    const active =
                      t.to === "/"
                        ? pathname === "/"
                        : t.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
                    const Icon = t.icon;

                    return (
                      <Link
                        key={t.to}
                        to={t.to as never}
                        aria-label={t.label}
                        aria-current={active ? "page" : undefined}
                        onClick={() => haptic("tap")}
                        className={`press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 ${
                          active ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-[20px]" strokeWidth={active ? 2.2 : 1.7} />
                        <span className={`text-[9.5px] tracking-wide ${active ? "font-bold" : "font-medium"}`}>
                          {t.label}
                        </span>
                        <span
                          className={`mt-0.5 size-[3.5px] rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </CelebrationProvider>
  );
}
