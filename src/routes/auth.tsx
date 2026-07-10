import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
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
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active && data.user) navigate({ to: "/" });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/" });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;

        if (!data.session) {
          const message =
            "Check your email to confirm the account, then sign in. If this email already uses Google, continue with Google or reset the password.";
          setNoticeMsg(message);
          setMode("signin");
          setPassword("");
          toast.success("Confirmation email sent.");
          return;
        }

        toast.success("Account created. Welcome.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          throw new Error("Please confirm your email before signing in.");
        }
      }
      navigate({ to: "/" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      const msg = friendlyAuthMessage(raw, mode);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        const msg = res.error.message ?? "Google sign-in failed";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }
      if (res.redirected) {
        setLoading(false);
        return;
      }
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      const msg = "Enter your email first, then request a reset link.";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setNoticeMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      const msg = "Password reset link sent. Check your email.";
      setNoticeMsg(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send reset link.";
      setErrorMsg(msg);
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
          {errorMsg && (
            <div className="border border-ink/20 bg-ink/5 px-4 py-3 text-xs text-ink/80">
              {errorMsg}
            </div>
          )}
          {noticeMsg && (
            <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-xs text-ink/80">
              {noticeMsg}
            </div>
          )}
          {mode === "signup" && (
            <p className="text-[11px] text-ink/50 leading-relaxed">
              Use at least 8 characters with a mix of letters, numbers, and symbols. Common or breached passwords are rejected.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-3.5 text-sm font-medium tracking-wide disabled:opacity-50"
          >
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {mode === "signin" && (
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={loading}
            className="mt-3 text-xs text-ink/50 hover:text-ink disabled:opacity-50"
          >
            Forgot password?
          </button>
        )}

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
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setErrorMsg(null);
            setNoticeMsg(null);
          }}
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

function friendlyAuthMessage(message: string, mode: "signin" | "signup") {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email and password do not match. If you signed up with Google, use Continue with Google. If you just created an account, confirm your email first.";
  }
  if (lower.includes("email not confirmed") || lower.includes("confirm your email")) {
    return "Please confirm your email first, then sign in.";
  }
  if (lower.includes("weak_password") || lower.includes("weak") || lower.includes("pwned")) {
    return "Choose a stronger, unique password. Common or leaked passwords are rejected.";
  }
  if (mode === "signup" && lower.includes("already")) {
    return "This email may already have an account. Sign in, reset the password, or continue with Google.";
  }
  return message;
}
