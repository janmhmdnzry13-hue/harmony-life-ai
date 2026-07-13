import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

const TABS: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/wellness", label: "Health", exact: true },
  { to: "/wellness/mind", label: "Mind" },
  { to: "/wellness/routines", label: "Routines" },
  { to: "/wellness/learn", label: "Learn" },
  { to: "/wellness/coach", label: "Coach" },
];

export const Route = createFileRoute("/_authenticated/wellness")({
  component: WellnessLayout,
});

function WellnessLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div>
      <div className="sticky top-[52px] z-20 bg-paper/95 backdrop-blur border-b border-ink/5">
        <div className="flex gap-1 overflow-x-auto px-5 py-2 scrollbar-none">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to as never}
                className={`shrink-0 px-3 py-1.5 text-[11px] uppercase tracking-widest font-medium border ${
                  active ? "bg-ink text-paper border-ink" : "border-ink/10 text-ink/50"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
