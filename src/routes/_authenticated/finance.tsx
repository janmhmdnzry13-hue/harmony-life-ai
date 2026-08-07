import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

const TABS: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/finance", label: "Money", exact: true },
  { to: "/finance/networth", label: "Wealth" },
  { to: "/finance/invest", label: "Invest" },
  { to: "/finance/trade", label: "Trade" },
  { to: "/finance/market", label: "Market" },
  { to: "/finance/coach", label: "Coach" },
];

export const Route = createFileRoute("/_authenticated/finance")({
  component: FinanceLayout,
});

function FinanceLayout() {
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
                className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-widest font-semibold border ${
                  active ? "bg-accent text-accent-foreground border-accent" : "border-border text-muted-foreground"
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
