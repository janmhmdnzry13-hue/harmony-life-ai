import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateName } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  LogOut,
  Mail,
  User as UserIcon,
  Calendar,
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
  Check,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "Your account · Origin Life OS" },
      { name: "description", content: "Your Origin account — name, sign-in method, settings and sign out." },
      { property: "og:title", content: "Your account · Origin Life OS" },
      { property: "og:description", content: "Your Origin account — name, sign-in method, settings and sign out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AccountPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const nameFn = useServerFn(updateName);

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const [email, setEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setUserId(data.user.id);
        setCreatedAt(data.user.created_at ?? "");
        setProvider(data.user.app_metadata?.provider ?? "email");
      }
    });
  }, []);

  useEffect(() => {
    if (profile.data?.display_name) setName(profile.data.display_name);
  }, [profile.data?.display_name]);

  const save = useMutation({
    mutationFn: (v: { display_name: string }) => nameFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Name updated");
      setEditing(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  async function signOut() {
    setSigningOut(true);
    try {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign out failed");
      setSigningOut(false);
    }
  }

  const displayName = profile.data?.display_name || email.split("@")[0] || "friend";
  const initials = (profile.data?.display_name || email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  const days = createdAt
    ? Math.max(1, Math.round((Date.now() - new Date(createdAt).getTime()) / 86400000))
    : null;

  return (
    <div className="pb-4">
      {/* soft mesh wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(480px 320px at 15% -8%, color-mix(in oklab, var(--amber) 16%, transparent), transparent 60%), radial-gradient(420px 300px at 100% 6%, color-mix(in oklab, var(--sky) 14%, transparent), transparent 60%)",
        }}
      />

      <div className="flex items-center justify-between px-6 pt-4">
        <Link
          to="/"
          className="press flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="label-quiet">Account</span>
        <Link
          to="/settings"
          className="press flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </Link>
      </div>

      {/* Hero */}
      <div className="px-6 pt-7">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {createdAt ? format(new Date(createdAt), "MMM yyyy") : "Origin"}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div
            className="orb size-[68px] shrink-0 rounded-full p-[2px]"
            style={{
              background:
                "conic-gradient(from 200deg, var(--amber), var(--accent), var(--sky), var(--amber))",
            }}
          >
            <div className="grid size-full place-items-center rounded-full bg-card font-serif text-xl">
              {initials || "◦"}
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-[30px] italic leading-[1.15] tracking-tight">
              Hello, <span className="not-italic font-semibold text-amber">{displayName}</span>
            </h1>
            <p className="mt-1 truncate text-[13px] text-muted-foreground">{email || "—"}</p>
          </div>
        </div>
      </div>

      {/* Chips */}
      <div className="mt-7 grid grid-cols-3 gap-2.5 px-6">
        <Chip label="Days here" value={days ? String(days) : "—"} icon={<Calendar className="size-3" />} />
        <Chip label="Sign-in" value={provider || "email"} icon={<ShieldCheck className="size-3" />} small />
        <Chip label="Plan" value="Free" icon={<Sparkles className="size-3" />} />
      </div>

      {/* Name card */}
      <div className="mx-6 mt-5 rounded-[26px] border border-border p-6"
        style={{ background: "linear-gradient(155deg, var(--surface) 0%, var(--card) 100%)" }}
      >
        <div className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber">Your name</div>
        {editing ? (
          <div className="mt-3 space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
              placeholder="What should Origin call you?"
            />
            <div className="flex gap-2">
              <button
                onClick={() => save.mutate({ display_name: name.trim() })}
                disabled={save.isPending || !name.trim()}
                className="press inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-xs font-bold tracking-wide text-white disabled:opacity-50"
              >
                <Check className="size-3.5" /> Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(profile.data?.display_name ?? "");
                }}
                className="press rounded-full border border-border px-5 py-2.5 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-2.5 font-serif text-[24px] font-medium tracking-tight">
              {profile.data?.display_name || "Unnamed"}
            </div>
            <p className="mt-2 max-w-[85%] text-[13px] leading-relaxed text-muted-foreground">
              This is how Origin greets you every morning.
            </p>
            <button
              onClick={() => setEditing(true)}
              className="press mt-4 inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-xs font-bold tracking-wide text-white"
            >
              <Pencil className="size-3.5" /> Edit name
            </button>
          </>
        )}
      </div>

      {/* Details */}
      <div className="label-quiet px-6 pb-3 pt-7">Details</div>
      <div className="mx-6 overflow-hidden rounded-[20px] border border-border bg-card">
        <Row icon={<Mail className="size-4" />} label="Email" value={email || "—"} />
        <Row icon={<UserIcon className="size-4" />} label="Sign-in method" value={provider || "email"} />
        <Row
          icon={<Calendar className="size-4" />}
          label="Member since"
          value={createdAt ? format(new Date(createdAt), "MMM d, yyyy") : "—"}
        />
        <Row icon={<ShieldCheck className="size-4" />} label="User ID" value={userId ? userId.slice(0, 8) + "…" : "—"} mono />
      </div>

      <div className="label-quiet px-6 pb-3 pt-7">Preferences</div>
      <Link
        to="/settings"
        className="press mx-6 flex items-center gap-3 rounded-[20px] border border-border bg-card px-5 py-4"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface">
          <SettingsIcon className="size-4 text-muted-foreground" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold">Settings</span>
          <span className="block text-[12px] text-muted-foreground">Appearance, reminders, privacy</span>
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">Open</span>
      </Link>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="press mx-6 mt-3 flex w-[calc(100%-3rem)] items-center justify-center gap-2 rounded-full border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground disabled:opacity-50"
      >
        <LogOut className="size-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>

      <p className="mt-6 px-8 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        Your life stays yours. Sign in from any device and everything is exactly where you left it.
      </p>
    </div>
  );
}

function Chip({
  label,
  value,
  icon,
  small,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-2 font-serif font-semibold capitalize ${small ? "text-[15px]" : "text-[21px]"}`}>
        {value}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5 last:border-b-0">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <span className={`truncate text-sm ${mono ? "font-mono text-xs text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}
