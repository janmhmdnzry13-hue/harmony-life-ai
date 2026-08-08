import type { ReactNode } from "react";

/** A soft, breathing placeholder. Loading should feel calm, not busy. */
export function Shimmer({ className = "" }: { className?: string }) {
  return <span className={`shimmer block rounded-lg ${className}`} />;
}

export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="card-soft p-6">
      <Shimmer className="h-2.5 w-20" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} className={`h-4 ${i === lines - 1 ? "w-2/5" : "w-4/5"}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Friendly empty state — explains, reassures, offers exactly one next step.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  tips,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  tips?: string[];
}) {
  return (
    <div className="rise flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface text-accent">{icon}</span>
      )}
      <p className="font-serif text-xl leading-snug">{title}</p>
      <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">{body}</p>
      {tips && tips.length > 0 && (
        <div className="mt-5 w-full max-w-[320px] space-y-2 text-left">
          {tips.map((tip) => (
            <p key={tip} className="rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              {tip}
            </p>
          ))}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
