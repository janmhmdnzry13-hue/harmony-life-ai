import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { haptic } from "@/lib/feel";

type Celebrate = (message: string) => void;

const CelebrationContext = createContext<Celebrate>(() => {});

/** Quiet, warm acknowledgement of a small win. Never blocks, never nags. */
export function useCelebrate() {
  return useContext(CelebrationContext);
}

type Note = { id: number; message: string };

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  const celebrate = useCallback<Celebrate>((message) => {
    haptic("success");
    const id = Date.now() + Math.random();
    setNotes((n) => [...n.slice(-1), { id, message }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 2400);
  }, []);

  const value = useMemo(() => celebrate, [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-6">
        {notes.map((n) => (
          <div
            key={n.id}
            className="bloom glass flex items-center gap-2.5 rounded-full px-4 py-2.5"
            style={{ boxShadow: "var(--shadow-lift)" }}
          >
            <Bloom />
            <span className="font-serif text-[13.5px] leading-none">{n.message}</span>
          </div>
        ))}
      </div>
    </CelebrationContext.Provider>
  );
}

function Bloom() {
  return (
    <span className="relative grid size-4 shrink-0 place-items-center">
      <span className="absolute inset-0 rounded-full bg-accent/20" />
      <svg viewBox="0 0 16 16" className="size-3 text-accent">
        <path
          d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
