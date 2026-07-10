import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Home, ListChecks, Sparkles, Flame, Wallet, User } from "lucide-react";
import type { ReactNode } from "react";
import { getProfile } from "@/lib/profile.functions";
import { NotificationsBell } from "@/components/notifications-bell";

type Tab = { to: string; label: string; icon: typeof Home; center?: boolean };
const tabs: Tab[] = [
  { to: "/", label: "Today", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/ai", label: "Origin", icon: Sparkles, center: true },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/finance", label: "Money", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const profileFn = useServerFn(getProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const initials = (profile.data?.display_name || "◦")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "◦";

  const onAccount = pathname === "/account";

  return (
    <div className="min-h-screen bg-paper text-ink flex justify-center">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative">
        <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-ink/5 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-1.5 bg-accent rounded-full" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 font-medium">
              Origin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <Link
              to="/account"
              aria-label="Account"
              className={`size-9 border flex items-center justify-center text-[11px] font-medium tracking-wide transition-colors ${
                onAccount ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/70 hover:border-ink hover:text-ink"
              }`}
            >
              {initials.length > 0 ? initials : <User className="size-4" />}
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-28">{children}</main>

        <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-[480px] pointer-events-auto bg-paper/95 backdrop-blur border-t border-ink/10 px-4 pt-3 pb-6 flex justify-between items-center">
            {tabs.map((t) => {
              const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
              const Icon = t.icon;
              if (t.center) {
                return (
                  <Link key={t.to} to={t.to as never} className="flex flex-col items-center gap-1 -mt-6">
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
                <Link key={t.to} to={t.to as never} className="flex flex-col items-center gap-1 py-1 px-2">
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
