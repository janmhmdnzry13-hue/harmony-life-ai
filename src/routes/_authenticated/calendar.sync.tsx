import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/calendar/sync")({
  component: SyncPage,
});

function SyncPage() {
  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Sync.</h1>
        <p className="text-sm text-ink/60 mt-1">Connect external calendars.</p>
      </header>

      <div className="space-y-3">
        {[
          { name: "Google Calendar", desc: "Pull events from your Google account.", provider: "google" },
          { name: "Microsoft Outlook", desc: "Pull events from Outlook.", provider: "outlook" },
        ].map((p) => (
          <div key={p.provider} className="border border-ink/10 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-serif text-lg">{p.name}</div>
                <div className="text-xs text-ink/50">{p.desc}</div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-ink/40 border border-ink/15 px-2 py-1">
                Coming soon
              </span>
            </div>
            <p className="text-xs text-ink/50 font-serif italic mt-2">
              External calendar sync is coming in a future update. Meanwhile, add events manually
              in the Month or Meetings tab.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
