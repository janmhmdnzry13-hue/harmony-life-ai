import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMeetings, upsertMeeting, deleteMeeting } from "@/lib/calendar-blocks.functions";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar/meetings")({
  component: MeetingsPage,
});

function MeetingsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMeetings);
  const saveFn = useServerFn(upsertMeeting);
  const delFn = useServerFn(deleteMeeting);
  const q = useQuery({ queryKey: ["meetings"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [attendees, setAttendees] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          title,
          starts_at: new Date(when).toISOString(),
          attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean),
          location: location || null,
          agenda: agenda || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      setOpen(false);
      setTitle("");
      setAttendees("");
      setLocation("");
      setAgenda("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Meetings.</h1>
          <p className="text-sm text-ink/60 mt-1">Prepare, attend, follow up.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {(q.data ?? []).length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No meetings scheduled.</p>
        )}
        {(q.data ?? []).map((m) => (
          <div key={m.id} className="py-4 group">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-widest text-ink/40 mb-1">
                  {format(parseISO(m.starts_at), "EEE, MMM d · h:mm a")}
                </div>
                <p className="text-sm font-medium">{m.title}</p>
                {m.location && <p className="text-xs text-ink/50 mt-0.5">{m.location}</p>}
                {(m.attendees ?? []).length > 0 && (
                  <p className="text-xs text-ink/50 mt-1">{(m.attendees ?? []).join(", ")}</p>
                )}
                {m.agenda && <p className="text-xs text-ink/60 mt-2 font-serif">{m.agenda}</p>}
              </div>
              <button onClick={() => del.mutate(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New meeting</h2>
            <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input placeholder="Attendees (comma separated)" value={attendees} onChange={(e) => setAttendees(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input placeholder="Location or link" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <textarea placeholder="Agenda" value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={4} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!title.trim() || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Add meeting
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
