import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Kanban, FileLock, Users, Plane, Sparkles, Gauge } from "lucide-react";

export const Route = createFileRoute("/_authenticated/more")({
  component: MorePage,
});

const HUBS = [
  { to: "/intel", label: "Intelligence", desc: "Life Score, predictions, agents, memory.", icon: Gauge },
  { to: "/calendar", label: "Calendar", desc: "Time blocks, meetings, sync.", icon: Calendar },
  { to: "/projects", label: "Projects", desc: "Kanban, timeline, dependencies.", icon: Kanban },
  { to: "/docs", label: "Documents", desc: "Secure vault, OCR scanner.", icon: FileLock },
  { to: "/people", label: "People", desc: "Contacts, birthdays, gifts.", icon: Users },
  { to: "/travel", label: "Travel", desc: "Trips, packing, journal.", icon: Plane },
  { to: "/assistant", label: "Assistant", desc: "Weekly review & suggestions.", icon: Sparkles },
];


function MorePage() {
  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-8">
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mb-2">More.</h1>
        <p className="text-sm text-ink/60">Productivity and relationships.</p>
      </header>
      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {HUBS.map((h) => {
          const Icon = h.icon;
          return (
            <Link
              key={h.to}
              to={h.to as never}
              className="flex items-center gap-4 py-5 group"
            >
              <div className="size-10 border border-ink/15 flex items-center justify-center">
                <Icon className="size-4" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="font-serif text-lg">{h.label}</div>
                <div className="text-xs text-ink/50">{h.desc}</div>
              </div>
              <span className="text-ink/30 group-hover:text-ink transition-colors">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
