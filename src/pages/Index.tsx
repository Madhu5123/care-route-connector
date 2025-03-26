
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ambulance, Hospital, Shield, Settings } from "lucide-react";

const Index = () => {
  const { isAuthenticated, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // If authenticated, redirect to the appropriate dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && userRole) {
      switch (userRole) {
        case "ambulance":
          navigate("/ambulance/dashboard");
          break;
        case "police":
          navigate("/police/dashboard");
          break;
        case "hospital":
          navigate("/hospital/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          // Stay on the landing page
          break;
      }
    }
  }, [isAuthenticated, userRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        {/* Hero section */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Emergency Response System
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Streamlining communication between ambulances, hospitals, and traffic police 
            for faster emergency response.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="h-14 px-8 text-lg bg-ambulance-DEFAULT hover:bg-ambulance-dark"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg"
              asChild
            >
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="py-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="glass-card border-ambulance-light/50 animate-scale-in">
            <CardContent className="pt-8 pb-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ambulance-light/20 flex items-center justify-center mb-6">
                <Ambulance className="h-8 w-8 text-ambulance-DEFAULT" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Ambulance Drivers</h3>
              <p className="text-muted-foreground">
                Get optimal routes with real-time traffic data, coordinate with hospitals, and 
                receive route clearance assistance from traffic police.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-hospital-light/50 animate-scale-in delay-100">
            <CardContent className="pt-8 pb-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-hospital-light/20 flex items-center justify-center mb-6">
                <Hospital className="h-8 w-8 text-hospital-DEFAULT" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Hospitals</h3>
              <p className="text-muted-foreground">
                Track incoming ambulances in real-time, prepare for patient arrival with 
                advanced notification, and coordinate resources efficiently.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-police-light/50 animate-scale-in delay-200">
            <CardContent className="pt-8 pb-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-police-light/20 flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-police-DEFAULT" />
              </div>
              <h3 className="text-xl font-semibold mb-3">For Traffic Police</h3>
              <p className="text-muted-foreground">
                View ambulance locations and routes to coordinate traffic clearance, 
                prioritize emergency vehicles, and improve response times.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Admin section */}
        <section className="py-16 max-w-4xl mx-auto animate-fade-in">
          <Card className="glass-card border-admin-light/50">
            <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-admin-light/20 flex items-center justify-center shrink-0">
                <Settings className="h-12 w-12 text-admin-DEFAULT" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-semibold mb-3">System Administration</h3>
                <p className="text-muted-foreground mb-6">
                  For system administrators, manage users, monitor system health, 
                  and maintain fleet information through a comprehensive dashboard.
                </p>
                <Button 
                  className="bg-admin-DEFAULT hover:bg-admin-dark"
                  asChild
                >
                  <Link to="/admin/dashboard">Admin Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Emergency Response System | All Rights Reserved</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
