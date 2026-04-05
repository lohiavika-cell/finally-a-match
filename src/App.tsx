import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireAuth } from "@/components/RequireAuth";
import AppLayout from "./pages/AppLayout.tsx";
import Auth from "./pages/Auth.tsx";
import Discover from "./pages/Discover.tsx";
import Index from "./pages/Index.tsx";
import MyList from "./pages/MyList.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Plans from "./pages/Plans.tsx";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        <Route element={<RequireAuth requireOnboarded />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="discover" replace />} />
            <Route path="discover" element={<Discover />} />
            <Route path="list" element={<MyList />} />
            <Route path="plans" element={<Plans />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
