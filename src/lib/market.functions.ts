import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Upcoming US macro events. Curated because free live econ-calendar APIs are unreliable / paywalled.
const ECON_CALENDAR: Array<{ date: string; title: string; kind: "CPI" | "PPI" | "FOMC" | "FED" | "JOBS" }> = [
  { date: "2026-07-15", title: "CPI Release (June)", kind: "CPI" },
  { date: "2026-07-16", title: "PPI Release (June)", kind: "PPI" },
  { date: "2026-07-29", title: "FOMC Statement & Rate Decision", kind: "FOMC" },
  { date: "2026-07-30", title: "Powell Press Conference", kind: "FED" },
  { date: "2026-08-01", title: "Non-Farm Payrolls", kind: "JOBS" },
  { date: "2026-08-13", title: "CPI Release (July)", kind: "CPI" },
  { date: "2026-08-14", title: "PPI Release (July)", kind: "PPI" },
  { date: "2026-08-22", title: "Jackson Hole Symposium", kind: "FED" },
  { date: "2026-09-17", title: "FOMC Statement & Rate Decision", kind: "FOMC" },
];

export const getMarketDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const [crypto, global, fng, coins, stocks] = await Promise.all([
      safeJson(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano,dogecoin&vs_currencies=usd&include_24hr_change=true",
      ),
      safeJson("https://api.coingecko.com/api/v3/global"),
      safeJson("https://api.alternative.me/fng/?limit=1"),
      safeJson(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&price_change_percentage=90d",
      ),
      safeJson(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
          "^GSPC,^IXIC,^DJI,^VIX,GC=F,CL=F",
        )}`,
        { "User-Agent": "Mozilla/5.0" },
      ),
    ]);

    const cryptoPrices = Object.entries((crypto ?? {}) as Record<string, { usd?: number; usd_24h_change?: number }>).map(
      ([id, v]) => ({ id, price: v.usd ?? 0, change24h: v.usd_24h_change ?? 0 }),
    );

    const btcDominance = (global as any)?.data?.market_cap_percentage?.btc ?? null;
    const totalMcap = (global as any)?.data?.total_market_cap?.usd ?? null;

    const fngRaw = (fng as any)?.data?.[0];
    const fearGreed = fngRaw
      ? { value: Number(fngRaw.value), classification: fngRaw.value_classification as string }
      : null;

    // Altcoin Season Index: % of top-50 (excluding BTC & stables) that outperformed BTC over 90d.
    let altSeason: number | null = null;
    if (Array.isArray(coins)) {
      const list = coins as Array<{ id: string; symbol: string; price_change_percentage_90d_in_currency?: number }>;
      const btc = list.find((c) => c.id === "bitcoin");
      const btcPerf = btc?.price_change_percentage_90d_in_currency;
      const stables = new Set(["tether", "usd-coin", "dai", "binance-usd", "true-usd", "first-digital-usd", "usde"]);
      if (typeof btcPerf === "number") {
        const alts = list
          .filter((c) => c.id !== "bitcoin" && !stables.has(c.id))
          .slice(0, 50)
          .filter((c) => typeof c.price_change_percentage_90d_in_currency === "number");
        if (alts.length) {
          const beat = alts.filter((c) => (c.price_change_percentage_90d_in_currency ?? 0) > btcPerf).length;
          altSeason = Math.round((beat / alts.length) * 100);
        }
      }
    }

    const stockQuotes: Array<{ symbol: string; price: number; change: number }> = [];
    const stockData = ((stocks as any)?.quoteResponse?.result ?? []) as Array<{
      symbol: string;
      regularMarketPrice?: number;
      regularMarketChangePercent?: number;
    }>;
    for (const q of stockData) {
      stockQuotes.push({
        symbol: q.symbol,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChangePercent ?? 0,
      });
    }

    const upcoming = ECON_CALENDAR.filter((e) => e.date >= new Date().toISOString().slice(0, 10)).slice(0, 10);

    return {
      cryptoPrices,
      stockQuotes,
      btcDominance,
      totalMcap,
      fearGreed,
      altSeason,
      calendar: upcoming,
      updatedAt: new Date().toISOString(),
    };
  });

async function safeJson(url: string, headers?: Record<string, string>) {
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
