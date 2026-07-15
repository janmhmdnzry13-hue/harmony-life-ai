import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContacts, upsertContact, deleteContact } from "@/lib/people.functions";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/people/")({
  component: ContactsPage,
});

function ContactsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listContacts);
  const saveFn = useServerFn(upsertContact);
  const delFn = useServerFn(deleteContact);
  const q = useQuery({ queryKey: ["people"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<"family" | "friend" | "colleague" | "other">("friend");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          name,
          relation,
          email: email || undefined,
          phone: phone || undefined,
          birthday: birthday || undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["people"] });
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setBirthday("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });

  const contacts = q.data?.contacts ?? [];
  const grouped: Record<string, typeof contacts> = {};
  for (const c of contacts) (grouped[c.relation] ||= []).push(c);

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">People.</h1>
          <p className="text-sm text-ink/60 mt-1">Family, friends, and everyone in between.</p>
        </div>
        <button onClick={() => setOpen(true)} className="size-9 bg-ink text-paper flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </header>

      {contacts.length === 0 && (
        <p className="py-8 text-sm text-ink/40 font-serif italic text-center">No contacts yet.</p>
      )}

      {Object.entries(grouped).map(([rel, list]) => (
        <section key={rel} className="mb-6">
          <h3 className="text-[10px] uppercase tracking-widest text-ink/50 font-medium mb-2">{rel}</h3>
          <div className="divide-y divide-ink/10 border-y border-ink/10">
            {list.map((c) => (
              <div key={c.id} className="py-3 flex items-start gap-3 group">
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-ink/50">
                    {[c.email, c.phone].filter(Boolean).join(" · ")}
                  </p>
                  {c.birthday && (
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-0.5">
                      Birthday {c.birthday.slice(5)}
                    </p>
                  )}
                </div>
                <button onClick={() => del.mutate(c.id)} className="opacity-0 group-hover:opacity-100 p-1 text-ink/40">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[480px] bg-paper border-t border-ink/10 p-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">New contact</h2>
            <input autoFocus placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <select value={relation} onChange={(e) => setRelation(e.target.value as never)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3">
              <option value="family">Family</option>
              <option value="friend">Friend</option>
              <option value="colleague">Colleague</option>
              <option value="other">Other</option>
            </select>
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <input type="date" placeholder="Birthday" value={birthday} onChange={(e) => setBirthday(e.target.value)} className="w-full bg-surface border border-ink/10 px-3 py-3 text-sm mb-3" />
            <button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()} className="w-full bg-ink text-paper py-3 text-sm font-medium disabled:opacity-40">
              Add contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
