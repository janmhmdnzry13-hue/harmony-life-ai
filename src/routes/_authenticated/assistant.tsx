import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listReviews, runReview, runSuggestions } from "@/lib/assistant.functions";
import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  component: AssistantPage,
});

function AssistantPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReviews);
  const reviewFn = useServerFn(runReview);
  const suggestFn = useServerFn(runSuggestions);
  const q = useQuery({ queryKey: ["reviews"], queryFn: () => listFn() });
  const [suggestions, setSuggestions] = useState<string>("");

  const runW = useMutation({
    mutationFn: (kind: "weekly" | "monthly") => reviewFn({ data: { kind } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const runS = useMutation({
    mutationFn: () => suggestFn(),
    onSuccess: (r) => setSuggestions(r.suggestions),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-6">
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight">Assistant.</h1>
        <p className="text-sm text-ink/60 mt-1">Reviews, reports, and smart next steps.</p>
      </header>

      <section className="mb-8">
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">Smart suggestions</h3>
        <button
          onClick={() => runS.mutate()}
          disabled={runS.isPending}
          className="w-full border border-ink/15 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="size-4" />
          {runS.isPending ? "Thinking…" : "Get 3 next actions"}
        </button>
        {suggestions && (
          <div className="mt-3 border border-ink/10 p-4 text-sm font-serif whitespace-pre-wrap">{suggestions}</div>
        )}
      </section>

      <section className="mb-8">
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">Reviews</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => runW.mutate("weekly")}
            disabled={runW.isPending}
            className="border border-ink/15 py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="size-3" /> Weekly
          </button>
          <button
            onClick={() => runW.mutate("monthly")}
            disabled={runW.isPending}
            className="border border-ink/15 py-3 text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="size-3" /> Monthly
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">History</h3>
        <div className="space-y-3">
          {(q.data ?? []).length === 0 && (
            <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No reviews yet.</p>
          )}
          {(q.data ?? []).map((r) => (
            <div key={r.id} className="border border-ink/10 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-widest text-ink/50 font-medium">{r.kind}</span>
                <span className="text-[10px] text-ink/40">
                  {format(parseISO(r.period_start), "MMM d")} – {format(parseISO(r.period_end), "MMM d")}
                </span>
              </div>
              <div className="text-sm font-serif whitespace-pre-wrap">{r.body_md}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
