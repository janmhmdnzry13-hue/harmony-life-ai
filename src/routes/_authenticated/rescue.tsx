import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, Moon, Repeat } from "lucide-react";
import { useState } from "react";
import { getUnderstanding } from "@/lib/understand.functions";
import { CardSkeleton } from "@/components/soft";
import { haptic, praise } from "@/lib/feel";
import { useCelebrate } from "@/components/celebration";

export const Route = createFileRoute("/_authenticated/rescue")({
  head: () => ({
    meta: [
      { title: "Rescue mode — Origin Life OS" },
      {
        name: "description",
        content: "For heavy days: the three highest-impact things, and nothing else on the screen.",
      },
      { property: "og:title", content: "Rescue mode — Origin Life OS" },
      {
        property: "og:description",
        content: "For heavy days: the three highest-impact things, and nothing else on the screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RescuePage,
});

const ICON = { task: Check, habit: Repeat, rest: Moon } as const;

function RescuePage() {
  const fn = useServerFn(getUnderstanding);
  const u = useQuery({ queryKey: ["understanding"], queryFn: () => fn() });
  const celebrate = useCelebrate();
  const [done, setDone] = useState<number[]>([]);

  const actions = u.data?.rescue ?? [];
  const allDone = actions.length > 0 && done.length >= actions.length;

  return (
    <div className="min-h-[70vh] space-y-6 px-6 pb-8 pt-10">
      <Link
        to="/understand"
        onClick={() => haptic("tap")}
        className="press inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <header className="rise">
        <p className="label-quiet">Rescue mode</p>
        <h1 className="mt-2 font-serif text-[32px] leading-tight tracking-tight">
          {allDone ? "That was enough." : "Just these three."}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {allDone
            ? "You did the things that mattered on a hard day. The rest can wait without costing you anything."
            : "Today doesn't need all of you. These are the three that actually move something — everything else is hidden."}
        </p>
      </header>

      {u.isLoading && <CardSkeleton lines={2} />}

      <ul className="space-y-4">
        {actions.map((a, i) => {
          const Icon = ICON[a.kind];
          const isDone = done.includes(i);
          return (
            <li key={`${a.title}-${i}`}>
              <button
                onClick={() => {
                  haptic(isDone ? "tap" : "success");
                  setDone((d) => (isDone ? d.filter((x) => x !== i) : [...d, i]));
                  if (!isDone) celebrate(praise.task());
                }}
                className={`press card-soft rise flex w-full items-start gap-4 p-6 text-left ${
                  isDone ? "opacity-55" : ""
                }`}
              >
                <span
                  className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                    isDone ? "bg-accent text-accent-foreground" : "bg-surface text-accent"
                  }`}
                >
                  {isDone ? <Check className="size-4" strokeWidth={2.2} /> : <Icon className="size-4" strokeWidth={1.9} />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block font-serif text-xl leading-snug ${isDone ? "line-through decoration-1" : ""}`}
                  >
                    {a.title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{a.why}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {!u.isLoading && actions.length === 0 && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nothing urgent is waiting on you. Rest is the highest-impact action available today.
        </p>
      )}

      <p className="pt-2 text-center text-xs leading-relaxed text-muted-foreground">
        Origin will keep the rest of your life exactly where you left it.
      </p>
    </div>
  );
}
