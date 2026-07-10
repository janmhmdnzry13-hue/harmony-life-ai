import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "@/lib/settings.functions";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type Theme = "light" | "dark" | "system";
type PrefKey = "daily_summary" | "habit_streaks" | "task_due";
type Prefs = Record<PrefKey, boolean>;
type SettingsPatch = {
  theme?: Theme;
  timezone?: string;
  notification_prefs?: Prefs;
  daily_summary_time?: string;
};

function SettingsPage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getSettings);
  const setFn = useServerFn(updateSettings);
  const { theme, setTheme } = useTheme();

  const settings = useQuery({ queryKey: ["settings"], queryFn: () => getFn() });

  const save = useMutation({
    mutationFn: (patch: SettingsPatch) => setFn({ data: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const rawPrefs = settings.data?.notification_prefs;
  const prefs: Prefs =
    rawPrefs && typeof rawPrefs === "object" && !Array.isArray(rawPrefs)
      ? {
          daily_summary: (rawPrefs as Record<string, unknown>).daily_summary !== false,
          habit_streaks: (rawPrefs as Record<string, unknown>).habit_streaks !== false,
          task_due: (rawPrefs as Record<string, unknown>).task_due !== false,
        }
      : { daily_summary: true, habit_streaks: true, task_due: true };

  const pickTheme = (t: Theme) => {
    setTheme(t);
    save.mutate({ theme: t });
  };

  const togglePref = (key: PrefKey) => {
    const next: Prefs = { ...prefs, [key]: !prefs[key] };
    save.mutate({ notification_prefs: next });
  };

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-center justify-between mb-8">
        <Link to="/account" className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/50 hover:text-ink">
          <ArrowLeft className="size-4" /> Account
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">Settings</span>
      </div>

      <h1 className="font-serif text-4xl leading-none tracking-tight mb-8">Settings</h1>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: "light", label: "Light", Icon: Sun },
              { v: "dark", label: "Dark", Icon: Moon },
              { v: "system", label: "System", Icon: Monitor },
            ] as const
          ).map(({ v, label, Icon }) => {
            const active = theme === v;
            return (
              <button
                key={v}
                onClick={() => pickTheme(v)}
                className={`flex flex-col items-center gap-2 py-4 border transition-colors ${
                  active ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/70 hover:border-ink/40"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
                <span className="text-[10px] uppercase tracking-widest">{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Notifications">
        <PrefRow
          label="Daily summary"
          hint="A gentle morning brief from Origin."
          checked={!!prefs.daily_summary}
          onChange={() => togglePref("daily_summary")}
        />
        <PrefRow
          label="Habit streaks"
          hint="Nudges when a streak is at risk."
          checked={!!prefs.habit_streaks}
          onChange={() => togglePref("habit_streaks")}
        />
        <PrefRow
          label="Tasks due"
          hint="Reminders for what's due today."
          checked={!!prefs.task_due}
          onChange={() => togglePref("task_due")}
        />
      </Section>

      <Section title="Time zone">
        <input
          value={settings.data?.timezone ?? ""}
          onChange={(e) => save.mutate({ timezone: e.target.value })}
          placeholder="e.g. Europe/Berlin"
          className="w-full bg-surface border border-ink/10 px-3 py-2.5 text-sm focus:outline-none focus:border-ink/40"
        />
        <p className="mt-2 text-[11px] text-ink/50">
          Used for daily summaries and habit resets.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink/40 mb-3">{title}</div>
      {children}
    </section>
  );
}

function PrefRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between gap-4 py-3 border-b border-ink/10 last:border-b-0 text-left"
    >
      <div className="min-w-0">
        <div className="text-sm text-ink">{label}</div>
        <div className="text-xs text-ink/50 mt-0.5">{hint}</div>
      </div>
      <div
        className={`w-10 h-6 border relative shrink-0 transition-colors ${
          checked ? "bg-ink border-ink" : "bg-surface border-ink/20"
        }`}
      >
        <div
          className={`absolute top-0.5 size-5 transition-transform ${
            checked ? "translate-x-[18px] bg-paper" : "translate-x-0.5 bg-ink"
          }`}
        />
      </div>
    </button>
  );
}
