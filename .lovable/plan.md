## Scope

Expand the existing Finance page into a full **Wealth OS** — personal finance, investments, trading journal, live market dashboard, and an AI Financial Coach — while keeping the app's editorial/minimal design system (ink/paper/serif, mobile-first).

The current app already has: transactions, budgets, and an AI spending insight. Everything else is new.

## Navigation

Restructure `/finance` into a hub with 5 sub-tabs (segmented control at top):

1. **Money** — Income, Expenses, Budgets, Bills & Subscriptions, Cash Flow, Savings goals
2. **Net Worth** — Accounts, Asset Allocation, Net Worth over time
3. **Invest** — Stocks / Crypto / ETF / Gold / Real Estate holdings, P/L, Dividends
4. **Trade** — Trading Journal, Trade History, Win Rate, Mistake tags, Position Size Calculator
5. **Market** — Live crypto & stock prices, Fear & Greed, BTC Dominance, Altcoin Season, Economic Calendar (CPI, PPI, FOMC)

AI Coach lives as a floating insight card on each tab, plus a dedicated `/finance/coach` route that runs deeper analysis across all modules.

## Data Model (new tables)

```text
bills             — recurring bills & subscriptions (name, amount, cycle, next_due, category, active)
savings_goals     — name, target, current, deadline, category
accounts          — name, type (cash/checking/savings/brokerage/crypto/real_estate/other), balance, currency
holdings          — account_id, asset_type (stock/crypto/etf/gold/realestate), symbol, name,
                    quantity, avg_cost, currency, notes
price_cache       — symbol, asset_type, price, currency, updated_at (server-side price memo)
dividends         — holding_id, amount, currency, paid_on, note
trades            — symbol, side (long/short), entry, exit, quantity, stop, target,
                    opened_at, closed_at, pnl, r_multiple, setup, mistakes[], notes, rating
```

All tables: `user_id` + RLS `auth.uid() = user_id`, GRANT to authenticated + service_role, `updated_at` trigger.

`transactions` and `budgets` stay as-is (they already work).

## Server functions (new files)

- `src/lib/bills.functions.ts` — CRUD + `upcomingBills` (next 30 days)
- `src/lib/savings.functions.ts` — CRUD savings goals + contribute
- `src/lib/networth.functions.ts` — CRUD accounts, aggregate net worth + allocation breakdown
- `src/lib/holdings.functions.ts` — CRUD holdings, refresh prices, compute P/L, dividends
- `src/lib/trading.functions.ts` — CRUD trades, stats (win rate, avg R, mistake frequency)
- `src/lib/market.functions.ts` — server-side fetchers for public market data (see APIs below)
- `src/lib/coach.functions.ts` — extends `analyzeSpending` into a multi-module coach

## Market data (server-side, cached)

Free public APIs, called from server functions and cached in `price_cache` (5–15 min TTL). Server-side only, so no CORS or key leaks. No user-facing API keys required for the defaults; if any provider requires a key later, request it via `add_secret`.

- **Crypto prices & BTC dominance** — CoinGecko `/simple/price`, `/global`
- **Fear & Greed (crypto)** — alternative.me `/fng`
- **Altcoin Season Index** — computed server-side from CoinGecko top-50 30-day performance vs BTC (standard formula: % of top-50 that outperformed BTC over 90d)
- **Stocks / ETFs / Gold** — Yahoo Finance public quote endpoint (`query1.finance.yahoo.com/v7/finance/quote`) — no key, server-side only
- **Economic calendar (CPI, PPI, FOMC, Fed events)** — curated static JSON of upcoming US macro events shipped in `src/lib/econ-calendar.ts`, updated per release. (Free live econ-calendar APIs are unreliable / paywalled; a maintained JSON list is the pragmatic v1.)

## Position Size Calculator

Pure client-side, no persistence: inputs (account size, risk %, entry, stop) → position size, risk $, R:R when target given.

## AI Coach

`coach.functions.ts` gathers monthly cash flow, net worth snapshot, portfolio allocation, and trading stats and asks `google/gemini-2.5-flash` for a single-paragraph insight per module (spending, investing, portfolio suggestion, budget optimization). Uses the same `createLovableAiGatewayProvider` pattern already in `finance.functions.ts`.

## Route structure

```text
src/routes/_authenticated/
  finance.tsx              → redirects to /finance/money (or renders hub with tabs)
  finance.money.tsx        → income/expenses/budgets/bills/subs/cashflow/savings
  finance.networth.tsx     → accounts + allocation + timeline
  finance.invest.tsx       → holdings across asset types + P/L + dividends
  finance.trade.tsx        → journal + stats + position size calc
  finance.market.tsx       → live prices + indices + econ calendar
  finance.coach.tsx        → deep AI analysis across all modules
```

Reuses existing app shell + design tokens.

## Deliverables (in order)

1. Migration: create all new tables with RLS + GRANTs + triggers.
2. Server functions for each module.
3. Route files with mobile-first UI matching the existing editorial style.
4. Wire AI Coach card into each tab + dedicated coach route.
5. Update nav to point Finance → hub.

## Out of scope (v1)

- Bank account sync (Plaid) — manual entries only.
- Broker API sync — manual holdings + refreshable prices via public APIs.
- Real-time streaming — prices refresh on demand + cache TTL.
- Multi-currency FX conversion — display each holding in its own currency; net worth aggregates per currency.
