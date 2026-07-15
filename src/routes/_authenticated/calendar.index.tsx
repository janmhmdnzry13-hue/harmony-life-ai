import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEvents, createEvent, deleteEvent } from "@/lib/events.functions";
import { useState } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar/")({
  component: CalendarPage,
});

function CalendarPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listEvents);
  const createFn = useServerFn(createEvent);
  const delFn = useServerFn(deleteEvent);
  const q = useQuery({ queryKey: ["events"], queryFn: () => listFn() });

  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("09:00");

  const create = useMutation({
    mutationFn: () => {
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(selected);
      dt.setHours(h ?? 9, m ?? 0, 0, 0);
      return createFn({ data: { title, location: location || null, starts_at: dt.toISOString() } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      setTitle("");
      setLocation("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });
  const eventsOnDay = (d: Date) =>
    (q.data ?? []).filter((e) => isSameDay(parseISO(e.starts_at), d));
  const selectedEvents = eventsOnDay(selected);

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mb-2">Plan.</h1>
          <p className="text-sm text-ink/60">{format(cursor, "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-2 border border-ink/15">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 border border-ink/15">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 mb-1 gap-px">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] uppercase tracking-widest text-ink/40 text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-ink/5 border border-ink/10 mb-8">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const has = eventsOnDay(d).length > 0;
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`aspect-square bg-paper p-1.5 flex flex-col items-start justify-between text-left ${
                isSel ? "bg-ink text-paper" : ""
              } ${!inMonth ? "opacity-30" : ""}`}
            >
              <span className={`text-xs font-medium ${isToday && !isSel ? "text-accent" : ""}`}>
                {format(d, "d")}
              </span>
              {has && <span className={`size-1 rounded-full ${isSel ? "bg-paper" : "bg-accent"}`} />}
            </button>
          );
        })}
      </div>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-serif text-xl">{format(selected, "EEEE, MMM d")}</h3>
          <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
            <Plus className="size-4" />
          </button>
        </div>
        <div className="divide-y divide-ink/10">
          {selectedEvents.length === 0 && (
            <p className="py-6 text-sm text-ink/40 font-serif italic">Nothing planned.</p>
          )}
          {selectedEvents.map((e) => (
            <div key={e.id} className="py-3 flex items-start gap-3 group">
              <div className="text-[10px] uppercase tracking-widest text-ink/40 w-14 pt-1">
                {format(parseISO(e.starts_at), "h:mm a")}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{e.title}</p>
                {e.location && (
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">{e.location}</p>
                )}
              </div>
              <button onClick={() => del.mutate(e.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-1">New event</h2>
            <p className="text-xs text-ink/50 mb-4">{format(selected, "EEEE, MMM d")}</p>
            <input
              autoFocus
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3 focus:outline-none focus:border-ink/40"
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40"
              />
              <input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-surface border border-ink/10 px-3 py-3 text-sm focus:outline-none focus:border-ink/40"
              />
            </div>
            <button
              disabled={!title.trim() || create.isPending}
              onClick={() => create.mutate()}
              className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40"
            >
              Add event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
