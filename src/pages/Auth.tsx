import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FullPageSpinner } from "@/components/FullPageSpinner";

const Auth = () => {
  const { session, initializing, configured, signIn, signUp } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  const defaultTab = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState(defaultTab);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTab(searchParams.get("mode") === "signup" ? "signup" : "signin");
  }, [searchParams]);

  if (!configured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-background">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold font-pixel text-foreground">Connect Supabase</h1>
          <p className="font-mono-space text-sm text-foreground/80 leading-relaxed">
            Add <code className="text-xs bg-secondary px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and{" "}
            <code className="text-xs bg-secondary px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> to a{" "}
            <code className="text-xs bg-secondary px-1 py-0.5 rounded">.env</code> file (see{" "}
            <code className="text-xs bg-secondary px-1 py-0.5 rounded">.env.example</code>), then run the SQL in{" "}
            <code className="text-xs bg-secondary px-1 py-0.5 rounded">supabase/migrations/</code> in the Supabase SQL
            editor.
          </p>
          <Button asChild variant="outline" className="rounded-full font-pixel mt-2">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (initializing || (session && profileLoading)) {
    return <FullPageSpinner />;
  }

  if (session && profile?.onboarding_complete) {
    return <Navigate to={from === "/auth" ? "/app" : from} replace />;
  }

  if (session && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Please add a display name");
      return;
    }
    setBusy(true);
    const { error, data } = await signUp(email.trim(), password, displayName.trim());
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user && !data.session) {
      toast.message("Check your email", {
        description: "Confirm your address to finish signing up (if confirmations are enabled in Supabase).",
      });
      return;
    }
    toast.success("Account ready — finish your list next");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <Link to="/" className="text-xl font-bold font-pixel text-foreground hover:opacity-80">
            Finally
          </Link>
          <p className="font-mono-space text-xs text-foreground/60">Plan first. The person is the bonus.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full border border-border bg-secondary/50 p-1 h-11">
            <TabsTrigger value="signin" className="rounded-full font-pixel text-sm">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full font-pixel text-sm">
              Join
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6">
            <form onSubmit={onSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-in" className="font-mono-space text-xs">
                  Email
                </Label>
                <Input
                  id="email-in"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  className="rounded-full border-border font-mono-space text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-in" className="font-mono-space text-xs">
                  Password
                </Label>
                <Input
                  id="password-in"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  className="rounded-full border-border font-mono-space text-sm"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full font-pixel">
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={onSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-mono-space text-xs">
                  Display name
                </Label>
                <Input
                  id="name"
                  autoComplete="nickname"
                  value={displayName}
                  onChange={(ev) => setDisplayName(ev.target.value)}
                  required
                  placeholder="How you want to appear"
                  className="rounded-full border-border font-mono-space text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-up" className="font-mono-space text-xs">
                  Email
                </Label>
                <Input
                  id="email-up"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  className="rounded-full border-border font-mono-space text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-up" className="font-mono-space text-xs">
                  Password
                </Label>
                <Input
                  id="password-up"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  minLength={6}
                  className="rounded-full border-border font-mono-space text-sm"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full font-pixel">
                Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default Auth;
