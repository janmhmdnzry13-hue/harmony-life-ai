type Props = {
  label: string;
  value: number;
  size?: number;
  accent?: boolean;
};

/** Animated score ring — stroke length is driven by the score. */
export function ScoreRing({ label, value, size = 76, accent = false }: Props) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={5} className="stroke-ink/10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={accent ? "stroke-accent" : "stroke-ink"}
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif" style={{ fontSize: size * 0.28 }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">{label}</span>
    </div>
  );
}

/** Minimal sparkline for score history. */
export function Sparkline({ points, height = 44 }: { points: number[]; height?: number }) {
  if (points.length < 2) {
    return <div className="text-[11px] text-ink/40 italic font-serif">Not enough history yet.</div>;
  }
  const w = 300;
  const max = Math.max(...points, 100);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = height - ((p - min) / span) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={d} fill="none" strokeWidth={2} className="stroke-accent" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
