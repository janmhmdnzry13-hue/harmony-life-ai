import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, Droplets, Moon, Dumbbell, Utensils, Scale, Footprints } from "lucide-react";
import { toast } from "sonner";
import {
  listSleep, addSleep, deleteSleep,
  listWorkouts, addWorkout, deleteWorkout,
  listNutrition, addNutrition, deleteNutrition,
  listWater, addWater,
  listWeight, addWeight, deleteWeight,
  listSteps, setSteps,
} from "@/lib/health.functions";

export const Route = createFileRoute("/_authenticated/wellness/")({
  component: HealthPage,
});

const SUB = [
  { key: "sleep", label: "Sleep", Icon: Moon },
  { key: "workouts", label: "Workouts", Icon: Dumbbell },
  { key: "nutrition", label: "Nutrition", Icon: Utensils },
  { key: "water", label: "Water", Icon: Droplets },
  { key: "weight", label: "Weight", Icon: Scale },
  { key: "steps", label: "Steps", Icon: Footprints },
] as const;

function HealthPage() {
  const [tab, setTab] = useState<(typeof SUB)[number]["key"]>("sleep");
  return (
    <div className="px-5 pt-6 pb-8">
      <header className="mb-5">
        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-ink/50">Health</span>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight mt-1">Body.</h1>
      </header>
      <div className="grid grid-cols-3 gap-1 mb-5">
        {SUB.map((s) => {
          const active = tab === s.key;
          const Icon = s.Icon;
          return (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`flex flex-col items-center gap-1 py-2 border ${active ? "bg-ink text-paper border-ink" : "border-ink/10 text-ink/60"}`}>
              <Icon className="size-4" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-widest">{s.label}</span>
            </button>
          );
        })}
      </div>
      {tab === "sleep" && <SleepPanel />}
      {tab === "workouts" && <WorkoutsPanel />}
      {tab === "nutrition" && <NutritionPanel />}
      {tab === "water" && <WaterPanel />}
      {tab === "weight" && <WeightPanel />}
      {tab === "steps" && <StepsPanel />}
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function SleepPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSleep);
  const addFn = useServerFn(addSleep);
  const delFn = useServerFn(deleteSleep);
  const q = useQuery({ queryKey: ["sleep"], queryFn: () => listFn() });
  const [hours, setHours] = useState("7.5");
  const [quality, setQuality] = useState(4);
  const add = useMutation({
    mutationFn: () => addFn({ data: { log_date: today(), duration_min: Math.round(parseFloat(hours) * 60), quality } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sleep"] }); toast.success("Logged"); },
    onError: (e) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["sleep"] }) });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface">
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Log tonight</p>
        <div className="flex gap-2 mb-3">
          <input type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)}
            className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm" placeholder="Hours" />
          <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}
            className="bg-paper border border-ink/10 px-3 py-2 text-sm">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
        </div>
        <button onClick={() => add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest">Log sleep</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex justify-between items-center p-3 border border-ink/10">
            <div>
              <p className="font-serif text-lg">{((r.duration_min ?? 0) / 60).toFixed(1)}h</p>
              <p className="text-[10px] uppercase tracking-widest text-ink/50">{r.log_date} · {"★".repeat(r.quality ?? 0)}</p>
            </div>
            <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <EmptyText>No sleep logged.</EmptyText>}
      </div>
    </div>
  );
}

function WorkoutsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["workouts"], queryFn: useServerFn(listWorkouts) });
  const addFn = useServerFn(addWorkout);
  const delFn = useServerFn(deleteWorkout);
  const [type, setType] = useState("Run");
  const [mins, setMins] = useState("30");
  const [intensity, setIntensity] = useState<"low"|"medium"|"high">("medium");
  const add = useMutation({
    mutationFn: () => addFn({ data: { log_date: today(), type, duration_min: parseInt(mins) || 0, intensity } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["workouts"] }); toast.success("Logged"); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["workouts"] }) });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface space-y-2">
        <input value={type} onChange={(e)=>setType(e.target.value)} placeholder="Type (Run, Yoga, Lift…)" className="w-full bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <div className="flex gap-2">
          <input type="number" value={mins} onChange={(e)=>setMins(e.target.value)} placeholder="Minutes" className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
          <select value={intensity} onChange={(e)=>setIntensity(e.target.value as "low"|"medium"|"high")} className="bg-paper border border-ink/10 px-3 py-2 text-sm">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <button onClick={()=>add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest">Log workout</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((w) => (
          <div key={w.id} className="flex justify-between items-center p-3 border border-ink/10">
            <div>
              <p className="font-serif text-lg">{w.type}</p>
              <p className="text-[10px] uppercase tracking-widest text-ink/50">{w.log_date} · {w.duration_min}m · {w.intensity}</p>
            </div>
            <button onClick={() => del.mutate(w.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <EmptyText>No workouts yet.</EmptyText>}
      </div>
    </div>
  );
}

function NutritionPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["nutrition"], queryFn: useServerFn(listNutrition) });
  const addFn = useServerFn(addNutrition);
  const delFn = useServerFn(deleteNutrition);
  const [meal, setMeal] = useState<"breakfast"|"lunch"|"dinner"|"snack">("lunch");
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [p, setP] = useState(""); const [c, setC] = useState(""); const [f, setF] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { log_date: today(), meal, name, calories: parseInt(cal)||0, protein: parseFloat(p)||0, carbs: parseFloat(c)||0, fat: parseFloat(f)||0 } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["nutrition"] }); setName(""); setCal(""); setP(""); setC(""); setF(""); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["nutrition"] }) });
  const todayLogs = (q.data ?? []).filter((r) => r.log_date === today());
  const totals = todayLogs.reduce((a, r) => ({
    cal: a.cal + (r.calories ?? 0),
    p: a.p + Number(r.protein ?? 0),
    c: a.c + Number(r.carbs ?? 0),
    f: a.f + Number(r.fat ?? 0),
  }), { cal: 0, p: 0, c: 0, f: 0 });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        <Metric label="Cal" value={String(totals.cal)}/>
        <Metric label="Protein" value={`${totals.p.toFixed(0)}g`}/>
        <Metric label="Carbs" value={`${totals.c.toFixed(0)}g`}/>
        <Metric label="Fat" value={`${totals.f.toFixed(0)}g`}/>
      </div>
      <div className="p-4 border border-ink/10 bg-surface space-y-2">
        <div className="flex gap-2">
          <select value={meal} onChange={(e)=>setMeal(e.target.value as typeof meal)} className="bg-paper border border-ink/10 px-3 py-2 text-sm">
            <option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option>
          </select>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="What did you eat?" className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input type="number" value={cal} onChange={(e)=>setCal(e.target.value)} placeholder="cal" className="bg-paper border border-ink/10 px-2 py-2 text-sm"/>
          <input type="number" value={p} onChange={(e)=>setP(e.target.value)} placeholder="P" className="bg-paper border border-ink/10 px-2 py-2 text-sm"/>
          <input type="number" value={c} onChange={(e)=>setC(e.target.value)} placeholder="C" className="bg-paper border border-ink/10 px-2 py-2 text-sm"/>
          <input type="number" value={f} onChange={(e)=>setF(e.target.value)} placeholder="F" className="bg-paper border border-ink/10 px-2 py-2 text-sm"/>
        </div>
        <button disabled={!name.trim()} onClick={()=>add.mutate()} className="w-full bg-ink text-paper py-2 text-xs uppercase tracking-widest disabled:opacity-40">Log meal</button>
      </div>
      <div className="space-y-2">
        {todayLogs.map((r) => (
          <div key={r.id} className="flex justify-between items-center p-3 border border-ink/10">
            <div>
              <p className="text-sm">{r.name} <span className="text-ink/40 text-[10px] uppercase tracking-widest">· {r.meal}</span></p>
              <p className="text-[10px] uppercase tracking-widest text-ink/50">{r.calories}c · P{Number(r.protein).toFixed(0)} C{Number(r.carbs).toFixed(0)} F{Number(r.fat).toFixed(0)}</p>
            </div>
            <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
        ))}
        {todayLogs.length === 0 && <EmptyText>Nothing logged today.</EmptyText>}
      </div>
    </div>
  );
}

function WaterPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["water"], queryFn: useServerFn(listWater) });
  const addFn = useServerFn(addWater);
  const add = useMutation({ mutationFn: (ml: number) => addFn({ data: { log_date: today(), amount_ml: ml } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["water"] }); } });
  const totalToday = (q.data ?? []).filter((r) => r.log_date === today()).reduce((s, r) => s + r.amount_ml, 0);
  const goal = 2500;
  const pct = Math.min(100, (totalToday / goal) * 100);
  return (
    <div className="space-y-4">
      <div className="p-5 border border-ink/10 bg-surface">
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Today</p>
        <p className="font-serif text-4xl">{totalToday} <span className="text-lg text-ink/40">ml</span></p>
        <div className="mt-3 h-2 bg-ink/10 relative">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }}/>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-ink/40 mt-2">Goal · {goal}ml</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[250, 500, 750, 1000].map(ml => (
          <button key={ml} onClick={() => add.mutate(ml)} className="py-3 border border-ink/15 text-sm">+{ml}</button>
        ))}
      </div>
    </div>
  );
}

function WeightPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["weight"], queryFn: useServerFn(listWeight) });
  const addFn = useServerFn(addWeight);
  const delFn = useServerFn(deleteWeight);
  const [kg, setKg] = useState("");
  const [bf, setBf] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { log_date: today(), weight_kg: parseFloat(kg), body_fat_pct: bf ? parseFloat(bf) : null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["weight"] }); setKg(""); setBf(""); },
  });
  const del = useMutation({ mutationFn: (id: string) => delFn({ data: { id } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["weight"] }) });
  return (
    <div className="space-y-4">
      <div className="p-4 border border-ink/10 bg-surface flex gap-2">
        <input type="number" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="kg" className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <input type="number" step="0.1" value={bf} onChange={(e) => setBf(e.target.value)} placeholder="BF%" className="w-20 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
        <button disabled={!kg} onClick={() => add.mutate()} className="px-4 bg-ink text-paper text-xs uppercase tracking-widest disabled:opacity-40">Log</button>
      </div>
      <div className="space-y-2">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex justify-between items-center p-3 border border-ink/10">
            <div>
              <p className="font-serif text-lg">{r.weight_kg} kg {r.body_fat_pct ? <span className="text-ink/50 text-sm">· {r.body_fat_pct}%</span> : null}</p>
              <p className="text-[10px] uppercase tracking-widest text-ink/50">{r.log_date}</p>
            </div>
            <button onClick={() => del.mutate(r.id)} className="p-1 text-ink/40"><Trash2 className="size-4"/></button>
          </div>
        ))}
        {(q.data ?? []).length === 0 && <EmptyText>No weight logged.</EmptyText>}
      </div>
    </div>
  );
}

function StepsPanel() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["steps"], queryFn: useServerFn(listSteps) });
  const setFn = useServerFn(setSteps);
  const [steps, setStepsVal] = useState("");
  const save = useMutation({
    mutationFn: () => setFn({ data: { log_date: today(), steps: parseInt(steps) || 0 } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["steps"] }); setStepsVal(""); toast.success("Saved"); },
  });
  const todayRow = (q.data ?? []).find((r) => r.log_date === today());
  return (
    <div className="space-y-4">
      <div className="p-5 border border-ink/10 bg-surface">
        <p className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">Today</p>
        <p className="font-serif text-4xl">{(todayRow?.steps ?? 0).toLocaleString()}</p>
        <div className="flex gap-2 mt-3">
          <input type="number" value={steps} onChange={(e) => setStepsVal(e.target.value)} placeholder="Steps today" className="flex-1 bg-paper border border-ink/10 px-3 py-2 text-sm"/>
          <button disabled={!steps} onClick={() => save.mutate()} className="px-4 bg-ink text-paper text-xs uppercase tracking-widest disabled:opacity-40">Save</button>
        </div>
      </div>
      <div className="space-y-1">
        {(q.data ?? []).map((r) => (
          <div key={r.id} className="flex justify-between p-2 border-b border-ink/5 text-sm">
            <span className="text-ink/60">{r.log_date}</span>
            <span className="font-serif">{r.steps.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 border border-ink/10 text-center">
      <p className="text-[9px] uppercase tracking-widest text-ink/40">{label}</p>
      <p className="font-serif text-base">{value}</p>
    </div>
  );
}
function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-center py-6 text-sm text-ink/40 font-serif italic">{children}</p>;
}
// Keep icons imported without lint errors on unused
void Plus;
