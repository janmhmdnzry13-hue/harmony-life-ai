import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  listCourses, upsertCourse, deleteCourse,
  listBooks, upsertBook, deleteBook, logReading,
  listDecks, createDeck, deleteDeck, listCards, addCard, reviewCard, deleteCard,
  listNotes, upsertNote, deleteNote,
  listLearningGoals, upsertLearningGoal, deleteLearningGoal,
} from "@/lib/learn.functions";

export const Route = createFileRoute("/_authenticated/wellness/learn")({
  component: LearnPage,
});

const SUB = ["courses", "books", "flashcards", "notes", "graph", "goals"] as const;

function LearnPage() {
  const [tab, setTab] = useState<(typeof SUB)[number]>("courses");
  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-5">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Knowledge</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Learn.</h1>
      </header>
      <div className="grid grid-cols-3 gap-1 mb-5">
        {SUB.map((s) => (
          <button key={s} onClick={() => setTab(s)}
            className={`py-2 border text-[10px] uppercase tracking-widest ${tab === s ? "bg-ink text-paper border-ink" : "border-ink/10 text-ink/60"}`}>
            {s}
          </button>
        ))}
      </div>
      {tab === "courses" && <CoursesPanel />}
      {tab === "books" && <BooksPanel />}
      {tab === "flashcards" && <FlashcardsPanel />}
      {tab === "notes" && <NotesPanel />}
      {tab === "graph" && <GraphPanel />}
      {tab === "goals" && <GoalsPanel />}
    </div>
  );
}

function CoursesPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["courses"], queryFn: useServerFn(listCourses) });
  const upFn = useServerFn(upsertCourse);
  const delFn = useServerFn(deleteCourse);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", provider: "", url: "", status: "planned" as "planned"|"active"|"done", progress_pct: 0 });
  const up = useMutation({ mutationFn: () => upFn({ data: form }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["courses"] }); setOpen(false); setForm({ title: "", provider: "", url: "", status: "planned", progress_pct: 0 }); }, onError: (e) => toast.error(e.message) });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }) });
  const updateProgress = useMutation({ mutationFn: (v: { id: string; progress_pct: number; title: string }) => upFn({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }) });
  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(true)} className="w-full py-2 border border-ink/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Plus className="size-4"/> Add course</button>
      {(q.data ?? []).map((c) => (
        <div key={c.id} className="p-4 border border-ink/10 bg-surface">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg">{c.title}</p>
              <p className="text-[10px] uppercase tracking-widest text-ink/50">{c.provider ?? "—"} · {c.status}</p>
            </div>
            <div className="flex items-center gap-1">
              {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="p-1 text-ink/50"><ExternalLink className="size-4"/></a>}
              <button onClick={() => del.mutate(c.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-ink/10">
              <div className="h-full bg-accent" style={{ width: `${c.progress_pct}%` }}/>
            </div>
            <input type="range" min={0} max={100} value={c.progress_pct}
              onChange={(e) => updateProgress.mutate({ id: c.id, progress_pct: Number(e.target.value), title: c.title })}
              className="w-full accent-ink mt-1"/>
            <p className="text-[10px] uppercase tracking-widest text-ink/40">{c.progress_pct}%</p>
          </div>
        </div>
      ))}
      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <h2 className="font-serif text-2xl mb-4">New course</h2>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-2"/>
          <input placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-2"/>
          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4"/>
          <button disabled={!form.title.trim()} onClick={() => up.mutate()} className="w-full bg-ink text-paper py-3 text-sm disabled:opacity-40">Save</button>
        </Sheet>
      )}
    </div>
  );
}

function BooksPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["books"], queryFn: useServerFn(listBooks) });
  const upFn = useServerFn(upsertBook);
  const delFn = useServerFn(deleteBook);
  const logFn = useServerFn(logReading);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", pages: 0, status: "reading" as "planned"|"reading"|"done" });
  const up = useMutation({ mutationFn: () => upFn({ data: form }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); setOpen(false); setForm({ title: "", author: "", pages: 0, status: "reading" }); } });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }) });
  const logR = useMutation({ mutationFn: (v: { book_id: string; minutes: number; pages: number }) => logFn({ data: v }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["books"] }); toast.success("Session logged"); } });
  const books = q.data?.books ?? [];
  const sessions = q.data?.sessions ?? [];
  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(true)} className="w-full py-2 border border-ink/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Plus className="size-4"/> Add book</button>
      {books.map((b) => {
        const minsThisMonth = sessions.filter(s => s.book_id === b.id).reduce((sum, s) => sum + s.minutes, 0);
        return (
          <div key={b.id} className="p-4 border border-ink/10 bg-surface">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-serif text-lg">{b.title}</p>
                <p className="text-[10px] uppercase tracking-widest text-ink/50">{b.author ?? "—"} · {b.status} · {minsThisMonth}m this month</p>
              </div>
              <button onClick={() => del.mutate(b.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
            </div>
            <button onClick={() => logR.mutate({ book_id: b.id, minutes: 20, pages: 10 })} className="w-full mt-1 py-1.5 text-[10px] uppercase tracking-widest border border-ink/15">+ 20 min · 10 pages</button>
          </div>
        );
      })}
      {open && (
        <Sheet onClose={() => setOpen(false)}>
          <h2 className="font-serif text-2xl mb-4">New book</h2>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-2"/>
          <input placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-4"/>
          <button disabled={!form.title.trim()} onClick={() => up.mutate()} className="w-full bg-ink text-paper py-3 text-sm disabled:opacity-40">Save</button>
        </Sheet>
      )}
    </div>
  );
}

function FlashcardsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["decks"], queryFn: useServerFn(listDecks) });
  const createFn = useServerFn(createDeck);
  const delFn = useServerFn(deleteDeck);
  const [openDeck, setOpenDeck] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const create = useMutation({ mutationFn: () => createFn({ data: { name: newName } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["decks"] }); setNewName(""); } });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }) });
  if (openDeck) return <DeckDetail id={openDeck} onBack={() => setOpenDeck(null)} />;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New deck" className="flex-1 bg-surface border border-ink/10 px-3 py-2 text-sm"/>
        <button disabled={!newName.trim()} onClick={() => create.mutate()} className="px-4 bg-ink text-paper text-xs uppercase tracking-widest disabled:opacity-40">Add</button>
      </div>
      {(q.data ?? []).map((d) => (
        <div key={d.id} className="flex justify-between items-center p-3 border border-ink/10 bg-surface">
          <button onClick={() => setOpenDeck(d.id)} className="flex-1 text-left">
            <p className="font-serif text-lg">{d.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-ink/50">{d.total} cards · {d.due} due</p>
          </button>
          <button onClick={() => del.mutate(d.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
        </div>
      ))}
    </div>
  );
}

function DeckDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listCards);
  const addFn = useServerFn(addCard);
  const reviewFn = useServerFn(reviewCard);
  const delFn = useServerFn(deleteCard);
  const q = useQuery({ queryKey: ["cards", id], queryFn: () => listFn({ data: { deck_id: id } }) });
  const [front, setFront] = useState(""); const [back, setBack] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const add = useMutation({ mutationFn: () => addFn({ data: { deck_id: id, front, back } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards", id] }); qc.invalidateQueries({ queryKey: ["decks"] }); setFront(""); setBack(""); } });
  const review = useMutation({ mutationFn: (v: { id: string; rating: "again"|"hard"|"good"|"easy" }) => reviewFn({ data: v }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards", id] }); qc.invalidateQueries({ queryKey: ["decks"] }); setRevealed(false); } });
  const del = useMutation({ mutationFn: (cid: string) => delFn({ data: { id: cid } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", id] }) });
  const today = new Date().toISOString().slice(0,10);
  const due = (q.data ?? []).filter((c) => c.due_on <= today);
  const current = due[0];
  if (reviewMode) {
    if (!current) return (
      <div className="space-y-3">
        <button onClick={() => setReviewMode(false)} className="text-xs uppercase tracking-widest">← Back</button>
        <p className="text-center py-12 font-serif italic text-ink/40">Nothing due. You're caught up.</p>
      </div>
    );
    return (
      <div className="space-y-4">
        <button onClick={() => setReviewMode(false)} className="text-xs uppercase tracking-widest">← Back</button>
        <div className="p-6 border border-ink/10 bg-surface min-h-[200px] flex items-center justify-center text-center">
          <p className="font-serif text-2xl">{revealed ? current.back : current.front}</p>
        </div>
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="w-full bg-ink text-paper py-3 text-sm">Reveal</button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {(["again","hard","good","easy"] as const).map(r => (
              <button key={r} onClick={() => review.mutate({ id: current.id, rating: r })} className="py-2 border border-ink/20 text-[10px] uppercase tracking-widest">{r}</button>
            ))}
          </div>
        )}
        <p className="text-[10px] uppercase tracking-widest text-ink/40 text-center">{due.length} due</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-xs uppercase tracking-widest">← Decks</button>
        <button onClick={() => setReviewMode(true)} className="text-xs uppercase tracking-widest px-3 py-1.5 bg-ink text-paper">Review ({due.length})</button>
      </div>
      <div className="p-3 border border-ink/10 bg-surface space-y-2">
        <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Front" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="Back" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm min-h-[70px]"/>
        <button disabled={!front.trim() || !back.trim()} onClick={() => add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest disabled:opacity-40">Add card</button>
      </div>
      {(q.data ?? []).map((c) => (
        <div key={c.id} className="flex justify-between items-center p-3 border border-ink/10">
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{c.front}</p>
            <p className="text-[10px] uppercase tracking-widest text-ink/40">due {c.due_on} · reps {c.reps}</p>
          </div>
          <button onClick={() => del.mutate(c.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
        </div>
      ))}
    </div>
  );
}

function NotesPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["learn-notes"], queryFn: useServerFn(listNotes) });
  const upFn = useServerFn(upsertNote);
  const delFn = useServerFn(deleteNote);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", tags: "", links: [] as string[] });
  const notes = q.data ?? [];
  const current = openId ? notes.find(n => n.id === openId) : null;

  const save = useMutation({
    mutationFn: () => upFn({ data: {
      id: openId ?? undefined,
      title: form.title,
      body: form.body,
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
      links: form.links,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["learn-notes"] }); setOpenId(null); setCreating(false); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["learn-notes"] }); setOpenId(null); } });

  if (creating || current) {
    return (
      <div className="space-y-3">
        <button onClick={() => { setCreating(false); setOpenId(null); }} className="text-xs uppercase tracking-widest">← Notes</button>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-lg font-serif"/>
        <textarea placeholder="Write…" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm min-h-[240px]"/>
        <input placeholder="tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full bg-surface border border-ink/10 px-3 py-2 text-sm"/>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-1">Link to notes</p>
          <div className="flex flex-wrap gap-1">
            {notes.filter(n => n.id !== openId).map(n => {
              const on = form.links.includes(n.id);
              return (
                <button key={n.id} onClick={() => setForm({ ...form, links: on ? form.links.filter(x => x !== n.id) : [...form.links, n.id] })}
                  className={`text-[10px] px-2 py-1 border ${on ? "bg-ink text-paper border-ink" : "border-ink/15"}`}>{n.title}</button>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => save.mutate()} disabled={!form.title.trim()} className="flex-1 bg-ink text-paper py-3 text-sm disabled:opacity-40">Save</button>
          {openId && <button onClick={() => del.mutate(openId)} className="px-4 border border-ink/20"><Trash2 className="size-4"/></button>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={() => { setForm({ title: "", body: "", tags: "", links: [] }); setCreating(true); }} className="w-full py-2 border border-ink/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Plus className="size-4"/> New note</button>
      {notes.map(n => (
        <button key={n.id} onClick={() => { setForm({ title: n.title, body: n.body, tags: (n.tags ?? []).join(", "), links: n.links ?? [] }); setOpenId(n.id); }} className="w-full text-left p-3 border border-ink/10 bg-surface">
          <p className="font-serif text-lg">{n.title}</p>
          <p className="text-sm text-ink/60 line-clamp-2">{n.body}</p>
          {n.tags?.length ? <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-1">{n.tags.join(" · ")}</p> : null}
        </button>
      ))}
      {notes.length === 0 && <p className="text-center py-8 font-serif italic text-ink/40 text-sm">Start your knowledge graph with one note.</p>}
    </div>
  );
}

function GraphPanel() {
  const q = useQuery({ queryKey: ["learn-notes"], queryFn: useServerFn(listNotes) });
  const notes = q.data ?? [];
  const size = 320;
  const layout = useMemo(() => {
    const n = notes.length || 1;
    return notes.map((note, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r = notes.length > 1 ? 120 : 0;
      return { id: note.id, title: note.title, x: size / 2 + Math.cos(angle) * r, y: size / 2 + Math.sin(angle) * r, links: note.links ?? [] };
    });
  }, [notes]);
  const map = new Map(layout.map(l => [l.id, l]));
  return (
    <div className="space-y-3">
      {notes.length === 0 ? <p className="text-center py-8 font-serif italic text-ink/40 text-sm">Add notes and link them to build a graph.</p> : (
        <div className="p-4 border border-ink/10 bg-surface flex justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px]">
            {layout.flatMap(node => node.links.map(lid => {
              const t = map.get(lid);
              if (!t) return null;
              return <line key={`${node.id}-${lid}`} x1={node.x} y1={node.y} x2={t.x} y2={t.y} stroke="currentColor" strokeOpacity={0.2}/>;
            }))}
            {layout.map(node => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r={6} fill="currentColor"/>
                <text x={node.x} y={node.y - 10} textAnchor="middle" fontSize="10" fill="currentColor">{node.title.slice(0, 18)}</text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

function GoalsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["learning-goals"], queryFn: useServerFn(listLearningGoals) });
  const upFn = useServerFn(upsertLearningGoal);
  const delFn = useServerFn(deleteLearningGoal);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const add = useMutation({ mutationFn: () => upFn({ data: { title, target_date: target || null } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["learning-goals"] }); setTitle(""); setTarget(""); } });
  const setProg = useMutation({ mutationFn: (v: { id: string; progress_pct: number; title: string }) => upFn({ data: v }), onSuccess: () => qc.invalidateQueries({ queryKey: ["learning-goals"] }) });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["learning-goals"] }) });
  return (
    <div className="space-y-3">
      <div className="p-3 border border-ink/10 bg-surface flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal" className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <input type="date" value={target} onChange={(e) => setTarget(e.target.value)} className="bg-paper border border-ink/10 px-2 py-2 text-sm"/>
        <button disabled={!title.trim()} onClick={() => add.mutate()} className="px-3 bg-ink text-paper text-xs uppercase tracking-widest disabled:opacity-40">Add</button>
      </div>
      {(q.data ?? []).map(g => (
        <div key={g.id} className="p-3 border border-ink/10 bg-surface">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-serif text-lg">{g.title}</p>
              {g.target_date && <p className="text-[10px] uppercase tracking-widest text-ink/50">by {g.target_date}</p>}
            </div>
            <button onClick={() => del.mutate(g.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
          <div className="h-1.5 bg-ink/10">
            <div className="h-full bg-accent" style={{ width: `${g.progress_pct}%` }}/>
          </div>
          <input type="range" min={0} max={100} value={g.progress_pct}
            onChange={(e) => setProg.mutate({ id: g.id, progress_pct: Number(e.target.value), title: g.title })} className="w-full accent-ink"/>
          <p className="text-[10px] uppercase tracking-widest text-ink/40">{g.progress_pct}%</p>
        </div>
      ))}
    </div>
  );
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
