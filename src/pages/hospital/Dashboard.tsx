
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AmbulanceData, subscribeToAmbulanceLocations } from "@/lib/firebase";
import { toast } from "@/components/ui/use-toast";
import { Hospital } from "lucide-react";

// Import our new components
import HospitalStatus from "@/components/hospital/HospitalStatus";
import AmbulanceMonitor from "@/components/hospital/AmbulanceMonitor";
import CriticalPatientAlert from "@/components/hospital/CriticalPatientAlert";
import AmbulanceTracking from "@/components/hospital/AmbulanceTracking";

const HospitalDashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceData | null>(null);
  const navigate = useNavigate();

  // Handle authentication and redirect
  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== "hospital")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

  // Subscribe to ambulance locations
  useEffect(() => {
    const unsubscribe = subscribeToAmbulanceLocations((data) => {
      const enhancedData = data.map(ambulance => ({
        ...ambulance,
        eta: ambulance.eta || "12 minutes",
        hospital_prepared: ambulance.hospital_prepared || false,
        patientInfo: {
          ...(ambulance.patientInfo || { severity: "medium", notes: "" }),
          age: ambulance.patientInfo?.age || "Unknown",
          gender: ambulance.patientInfo?.gender || "Unknown",
          condition: ambulance.patientInfo?.condition || "Unknown"
        }
      }));
      setAmbulances(enhancedData);
    });

    return () => unsubscribe();
  }, []);

  // Handle preparing for a patient
  const prepareForPatient = async (ambulanceId: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast({
        title: "Preparation started",
        description: "Medical team has been notified of incoming patient.",
      });

      setAmbulances(ambulances.map(amb => 
        amb.id === ambulanceId ? { ...amb, hospital_prepared: true } : amb
      ));
    } catch (error) {
      console.error("Error preparing for patient:", error);
      toast({
        title: "Action failed",
        description: "Could not notify medical team. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Hospital className="h-12 w-12 mx-auto text-hospital-DEFAULT animate-pulse-gentle" />
          <p className="mt-4 text-lg">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hospital Dashboard</h1>
          <p className="text-muted-foreground">
            {userProfile?.organization ? userProfile.organization : "Welcome"}
            {userProfile?.displayName ? ` - ${userProfile.displayName}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-1">
            {/* Hospital Status Card */}
            <HospitalStatus />

            {/* Ambulance Monitor */}
            <AmbulanceMonitor 
              ambulances={ambulances}
              onPreparePatient={prepareForPatient}
              onSelectAmbulance={setSelectedAmbulance}
            />

            {/* Critical Patient Alert */}
            <CriticalPatientAlert />
          </div>

          <div className="lg:col-span-2">
            {/* Ambulance Tracking Map */}
            <AmbulanceTracking />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
