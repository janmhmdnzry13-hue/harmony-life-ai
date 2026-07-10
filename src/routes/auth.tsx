import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) {
      toast.error(res.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-[440px] mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-2 bg-accent rounded-full" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/50 font-medium">
              Origin — a life operating system
            </span>
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight mb-3 text-balance">
            {mode === "signin" ? "Welcome back." : "Begin your practice."}
          </h1>
          <p className="text-sm text-ink/60 max-w-[34ch]">
            One quiet place for your days, habits, and thinking.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-ink/10 px-4 py-3.5 text-sm focus:outline-none focus:border-ink/40"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-ink/10 px-4 py-3.5 text-sm focus:outline-none focus:border-ink/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-ink/10 px-4 py-3.5 text-sm focus:outline-none focus:border-ink/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-3.5 text-sm font-medium tracking-wide disabled:opacity-50"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10" />
          <span className="text-[10px] uppercase tracking-widest text-ink/40">or</span>
          <div className="h-px flex-1 bg-ink/10" />
        </div>

        <button
          onClick={onGoogle}
          disabled={loading}
          className="w-full border border-ink/15 py-3.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-8 text-xs text-ink/60 hover:text-ink"
        >
          {mode === "signin"
            ? "No account yet? Create one →"
            : "Already have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}
