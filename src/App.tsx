
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AmbulanceDashboard from "./pages/ambulance/Dashboard";
import PoliceDashboard from "./pages/police/Dashboard";
import HospitalDashboard from "./pages/hospital/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import NotFound from "./pages/NotFound";
import DashboardHeader from "./components/common/DashboardHeader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/ambulance/dashboard" element={<><DashboardHeader /><AmbulanceDashboard /></>} />
            <Route path="/police/dashboard" element={<><DashboardHeader /><PoliceDashboard /></>} />
            <Route path="/hospital/dashboard" element={<><DashboardHeader /><HospitalDashboard /></>} />
            <Route path="/admin/dashboard" element={<><DashboardHeader /><AdminDashboard /></>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
