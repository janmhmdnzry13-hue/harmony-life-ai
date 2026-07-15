import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContacts } from "@/lib/people.functions";
import { format, parseISO, differenceInDays, addYears } from "date-fns";

export const Route = createFileRoute("/_authenticated/people/birthdays")({
  component: BirthdaysPage,
});

function BirthdaysPage() {
  const listFn = useServerFn(listContacts);
  const q = useQuery({ queryKey: ["people"], queryFn: () => listFn() });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const withBirthday = (q.data?.contacts ?? [])
    .filter((c) => c.birthday)
    .map((c) => {
      const bd = parseISO(c.birthday!);
      let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      if (next < today) next = addYears(next, 1);
      return { ...c, next, in: differenceInDays(next, today) };
    })
    .sort((a, b) => a.in - b.in);

  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-6">
        <h1 className="font-serif text-3xl leading-[1.05] tracking-tight">Birthdays.</h1>
        <p className="text-sm text-ink/60 mt-1">Never miss the moment.</p>
      </header>

      <div className="divide-y divide-ink/10 border-y border-ink/10">
        {withBirthday.length === 0 && (
          <p className="py-8 text-sm text-ink/40 font-serif italic text-center">
            Add birthdays to your contacts.
          </p>
        )}
        {withBirthday.map((c) => (
          <div key={c.id} className="py-4 flex items-center gap-3">
            <div className="w-14 text-[10px] uppercase tracking-widest text-ink/50">
              {c.in === 0 ? "Today" : c.in === 1 ? "Tomorrow" : `${c.in}d`}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-ink/50">{format(c.next, "EEEE, MMM d")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
