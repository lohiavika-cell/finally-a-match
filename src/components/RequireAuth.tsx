import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { FullPageSpinner } from "@/components/FullPageSpinner";

type Props = {
  /** When true, users who have not finished onboarding are sent to /onboarding */
  requireOnboarded?: boolean;
};

export function RequireAuth({ requireOnboarded = false }: Props) {
  const { session, initializing, configured } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading: profileLoading, isError } = useProfile();

  if (!configured) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (initializing || (session && profileLoading)) {
    return <FullPageSpinner message="Loading your session…" />;
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <p className="font-mono-space text-sm text-destructive text-center max-w-md">
          Could not load your profile. If you just created a project, run the SQL migration in Supabase and confirm the auth trigger created your profile row.
        </p>
      </div>
    );
  }

  if (requireOnboarded && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
