import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateName } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, LogOut, Mail, User as UserIcon, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
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

  const initials = (profile.data?.display_name || email || "?")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2 text-xs uppercase tracking-widest text-ink/50 hover:text-ink">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">Account</span>
      </div>

      <div className="flex flex-col items-center text-center mb-10">
        <div className="size-20 border border-ink flex items-center justify-center font-serif text-2xl mb-4">
          {initials || "◦"}
        </div>
        <h1 className="font-serif text-3xl leading-tight text-balance">
          {profile.data?.display_name || "Unnamed"}
        </h1>
        <p className="text-sm text-ink/60 mt-1">{email}</p>
      </div>

      <div className="border border-ink/10">
        <div className="px-4 py-4 border-b border-ink/10">
          <div className="text-[10px] uppercase tracking-widest text-ink/40 mb-2">Display name</div>
          {editing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="flex-1 bg-surface border border-ink/10 px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
              />
              <button
                onClick={() => save.mutate({ display_name: name.trim() })}
                disabled={save.isPending || !name.trim()}
                className="bg-ink text-paper px-4 text-xs uppercase tracking-widest disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(profile.data?.display_name ?? "");
                }}
                className="border border-ink/15 px-3 text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm">{profile.data?.display_name || "—"}</span>
              <button
                onClick={() => setEditing(true)}
                className="text-xs uppercase tracking-widest text-ink/50 hover:text-ink"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        <Row icon={<Mail className="size-4" />} label="Email" value={email || "—"} />
        <Row icon={<UserIcon className="size-4" />} label="Sign-in method" value={provider} />
        <Row
          icon={<Calendar className="size-4" />}
          label="Member since"
          value={createdAt ? format(new Date(createdAt), "MMM d, yyyy") : "—"}
        />
        <Row icon={<UserIcon className="size-4" />} label="User ID" value={userId.slice(0, 8) + "…"} mono />
      </div>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="mt-8 w-full flex items-center justify-center gap-2 border border-ink py-3.5 text-sm font-medium tracking-wide hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        <LogOut className="size-4" />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>

      <p className="mt-6 text-center text-[11px] text-ink/40">
        Your data stays in your account. Sign in from any device to see it.
      </p>
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
    <div className="px-4 py-3 border-b border-ink/10 last:border-b-0 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-ink/60">
        <span className="text-ink/40">{icon}</span>
        <span className="text-xs uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-sm text-ink/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
