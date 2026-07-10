import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Open the reset link from your email to set a new password.");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        setMessage("Choose a new password for your account.");
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setMessage("Choose a new password for your account.");
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (password.length < 8) throw new Error("Use at least 8 characters.");
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated. Sign in with your new password.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not update password.";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-[440px] mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-2 bg-accent rounded-full" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 font-medium">
              Origin — account access
            </span>
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight mb-3 text-balance">
            Reset password.
          </h1>
          <p className="text-sm text-ink/60 max-w-[34ch]">{message}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!ready || loading}
            className="w-full bg-surface border border-ink/10 px-4 py-3.5 text-sm focus:outline-none focus:border-ink/40 disabled:opacity-50"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={!ready || loading}
            className="w-full bg-surface border border-ink/10 px-4 py-3.5 text-sm focus:outline-none focus:border-ink/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!ready || loading}
            className="w-full bg-ink text-paper py-3.5 text-sm font-medium tracking-wide disabled:opacity-50"
          >
            {loading ? "…" : "Update password"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate({ to: "/auth" })}
          className="mt-8 text-xs text-ink/60 hover:text-ink"
        >
          Back to sign in →
        </button>
      </div>
    </div>
  );
}