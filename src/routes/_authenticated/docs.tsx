import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listDocuments,
  upsertDocument,
  deleteDocument,
  signedUploadUrl,
  signedReadUrl,
  runOcr,
} from "@/lib/documents.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Plus, Trash2, ScanLine, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/docs")({
  component: DocsPage,
});

const CATEGORIES = ["all", "passport", "id", "contract", "receipt", "other"] as const;

function DocsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDocuments);
  const saveFn = useServerFn(upsertDocument);
  const delFn = useServerFn(deleteDocument);
  const uploadFn = useServerFn(signedUploadUrl);
  const readFn = useServerFn(signedReadUrl);
  const ocrFn = useServerFn(runOcr);
  const q = useQuery({ queryKey: ["documents"], queryFn: () => listFn() });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"passport" | "id" | "contract" | "receipt" | "other">("other");
  const [expires, setExpires] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("all");
  const [busy, setBusy] = useState(false);

  const list = (q.data ?? []).filter((d) => filter === "all" || d.category === filter);

  async function handleAdd() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      let file_path: string | undefined;
      let mime: string | undefined;
      let size: number | undefined;
      if (file) {
        const up = await uploadFn({ data: { filename: file.name } });
        const { error } = await supabase.storage.from("documents").uploadToSignedUrl(up.path, up.token, file);
        if (error) throw error;
        file_path = up.path;
        mime = file.type;
        size = file.size;
      }
      await saveFn({
        data: { title, category, expires_on: expires || undefined, file_path, mime, size },
      });
      qc.invalidateQueries({ queryKey: ["documents"] });
      setOpen(false);
      setTitle("");
      setExpires("");
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  async function view(path: string) {
    const { url } = await readFn({ data: { path } });
    window.open(url, "_blank");
  }

  const ocr = useMutation({
    mutationFn: (id: string) => ocrFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Scanned");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "OCR failed"),
  });

  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const expiring = (q.data ?? []).filter(
    (d) => d.expires_on && new Date(d.expires_on) <= soon && new Date(d.expires_on) >= now,
  );

  return (
    <div className="px-5 pt-12 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight">Vault.</h1>
          <p className="text-sm text-ink/60 mt-1">Passports, IDs, contracts, receipts.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      {expiring.length > 0 && (
        <section className="mb-6 border border-accent/40 bg-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-2">Expiring soon</p>
          {expiring.map((d) => (
            <p key={d.id} className="text-xs">
              {d.title} — {format(parseISO(d.expires_on!), "MMM d, yyyy")}
            </p>
          ))}
        </section>
      )}

      <div className="flex gap-1 overflow-x-auto mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-widest border ${
              filter === c ? "bg-ink text-paper border-ink" : "border-ink/10 text-ink/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {list.length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No documents.</p>
        )}
        {list.map((d) => (
          <div key={d.id} className="py-3 flex items-start gap-3 group">
            <div className="size-9 border border-ink/10 flex items-center justify-center shrink-0">
              <FileText className="size-4 text-ink/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <span className="text-[9px] uppercase tracking-widest text-ink/40 border border-ink/15 px-1">
                  {d.category}
                </span>
              </div>
              {d.expires_on && (
                <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                  Expires {format(parseISO(d.expires_on), "MMM d, yyyy")}
                </p>
              )}
              {d.ocr_text && (
                <p className="text-xs text-ink/50 mt-1 line-clamp-2 font-serif italic">
                  {d.ocr_text.slice(0, 140)}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {d.file_path && (
                <button onClick={() => view(d.file_path!)} className="p-1.5 text-ink/40 hover:text-ink" title="View">
                  <Download className="size-4" />
                </button>
              )}
              {d.file_path && !d.ocr_text && (
                <button
                  onClick={() => ocr.mutate(d.id)}
                  disabled={ocr.isPending}
                  className="p-1.5 text-ink/40 hover:text-ink disabled:opacity-40"
                  title="Scan (OCR)"
                >
                  <ScanLine className="size-4" />
                </button>
              )}
              <button
                onClick={() => del.mutate(d.id)}
                className="p-1.5 text-ink/40 hover:text-ink opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New document</h2>
            <input autoFocus placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <select value={category} onChange={(e) => setCategory(e.target.value as never)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3">
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="date" placeholder="Expires" value={expires} onChange={(e) => setExpires(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs mb-3" />
            <button disabled={!title.trim() || busy} onClick={handleAdd} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
