import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjects, upsertProject, deleteProject } from "@/lib/projects.functions";
import { useState } from "react";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/soft";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listProjects);
  const saveFn = useServerFn(upsertProject);
  const delFn = useServerFn(deleteProject);
  const q = useQuery({ queryKey: ["projects"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const save = useMutation({
    mutationFn: () => saveFn({ data: { name, description: description || undefined } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight">Projects.</h1>
          <p className="text-sm text-ink/60 mt-1">Kanban boards, timelines, dependencies.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      {(q.data ?? []).length === 0 ? (
        <div className="card-soft">
          <EmptyState
            icon={<FolderKanban className="size-5" strokeWidth={1.8} />}
            title="Turn a larger goal into a board."
            body="Use projects when a goal has multiple steps, people, or phases. For one-off work, tasks are still perfect."
            tips={["Plan a home move", "Launch a side project", "Organize a family trip"]}
            action={
              <button
                onClick={() => setOpen(true)}
                className="press rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                Create a project
              </button>
            }
          />
        </div>
      ) : (
      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {(q.data ?? []).map((p) => (
          <div key={p.id} className="py-4 flex items-start gap-3 group">
            <Link to="/projects/$id" params={{ id: p.id }} className="flex-1">
              <div className="font-serif text-lg">{p.name}</div>
              {p.description && <div className="text-xs text-ink/50 mt-0.5">{p.description}</div>}
            </Link>
            <button onClick={() => del.mutate(p.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New project</h2>
            <input autoFocus placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Create project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
