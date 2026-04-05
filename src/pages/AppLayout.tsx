import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "font-pixel text-sm px-3 py-1.5 rounded-full border transition-opacity",
    isActive ? "bg-primary text-primary-foreground border-border" : "border-transparent hover:opacity-70",
  );

const AppLayout = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4 px-4 h-14 md:px-6">
          <Link to="/app" className="font-pixel text-foreground text-lg shrink-0">
            Finally
          </Link>
          <nav className="flex items-center gap-1 md:gap-2 flex-wrap justify-end">
            <NavLink to="/app/discover" className={navClass}>
              Discover
            </NavLink>
            <NavLink to="/app/list" className={navClass}>
              My list
            </NavLink>
            <NavLink to="/app/plans" className={navClass}>
              Plans
            </NavLink>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-mono-space text-xs rounded-full ml-1"
              onClick={() => void signOut()}
            >
              Log out
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
