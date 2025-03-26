import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AmbulanceData, subscribeToAmbulanceLocations } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Map from "@/components/Map";
import { AlertTriangle, Clock, Info, Shield, Users } from "lucide-react";

const PoliceDashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceData | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const navigate = useNavigate();

  // Redirect if not authenticated or not a police officer
  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== "police")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

  // Subscribe to ambulance locations from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToAmbulanceLocations((data) => {
      // Enhance the ambulance data with default values for any missing properties
      const enhancedData = data.map(ambulance => ({
        ...ambulance,
        route_cleared: ambulance.route_cleared || false
      }));
      setAmbulances(enhancedData);
    });

    return () => unsubscribe();
  }, []);

  // Function to clear route for ambulance (simulated for now)
  const clearRouteForAmbulance = async (ambulanceId: string) => {
    setIsClearing(true);
    
    try {
      // In a real app, this would send notifications to other police officers
      // and perhaps integrate with traffic management systems
      
      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast({
        title: "Route cleared",
        description: "Notifications sent to traffic control points.",
      });

      // Simulate updating the UI to show cleared status
      setAmbulances(ambulances.map(amb => 
        amb.id === ambulanceId ? { ...amb, route_cleared: true } : amb
      ));
    } catch (error) {
      console.error("Error clearing route:", error);
      toast({
        title: "Action failed",
        description: "Could not process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Shield className="h-12 w-12 mx-auto text-police-DEFAULT animate-pulse-gentle" />
          <p className="mt-4 text-lg">Loading police dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Police Traffic Control</h1>
          <p className="text-muted-foreground">
            {userProfile?.displayName ? `Officer ${userProfile.displayName}` : "Welcome"}
            {userProfile?.organization ? ` - ${userProfile.organization}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - ambulance list */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Ambulances</CardTitle>
                <CardDescription>Ambulances requiring route clearance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[500px]">
                  {ambulances.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No active ambulances at the moment</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ambulances.map((ambulance) => (
                          <TableRow 
                            key={ambulance.id}
                            className={selectedAmbulance?.id === ambulance.id ? "bg-police-light/20" : ""}
                          >
                            <TableCell className="font-medium">
                              {ambulance.vehicleId}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  ambulance.status === "on_duty"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                    : ambulance.status === "available"
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                }
                              >
                                {ambulance.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => setSelectedAmbulance(ambulance)}
                                >
                                  Track
                                </Button>
                                {ambulance.status === "on_duty" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="text-xs bg-police-DEFAULT hover:bg-police-dark"
                                    onClick={() => clearRouteForAmbulance(ambulance.id)}
                                    disabled={isClearing || ambulance.route_cleared}
                                  >
                                    {ambulance.route_cleared 
                                      ? "Cleared" 
                                      : isClearing ? "Clearing..." : "Clear Route"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Controls and Emergency alert cards */}
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Traffic Controls</CardTitle>
                <CardDescription>Manage traffic signals in your zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Main Street Junction</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Normal Flow
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hospital Avenue</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Medium Traffic
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Central Square</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      Heavy Traffic
                    </Badge>
                  </div>
                  
                  <Button className="w-full mt-2 bg-police-DEFAULT hover:bg-police-dark">
                    Override Traffic Signals
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Emergency alert card */}
            <Card className="glass-card animate-scale-in border-police-light">
              <CardHeader className="pb-3 bg-police-light/20 rounded-t-lg">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-police-DEFAULT" />
                  Emergency Alert
                </CardTitle>
                <CardDescription>Critical ambulance approaching</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ambulance:</span>
                    <span className="text-sm">KA-01-1234</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Location:</span>
                    <span className="text-sm">Richards Town</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Destination:</span>
                    <span className="text-sm">Apollo Hospital</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ETA:</span>
                    <span className="text-sm flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      8 minutes
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority:</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                      Critical
                    </Badge>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="default"
                      className="w-full bg-police-DEFAULT hover:bg-police-dark"
                    >
                      Clear Route
                    </Button>
                    <Button variant="outline" className="w-full">
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - map */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-10rem)] glass-card overflow-hidden animate-scale-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Traffic & Ambulance Map</CardTitle>
                <CardDescription>
                  Live monitoring of ambulances and traffic conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <Map
                  ambulanceMode={false}
                  destination={selectedAmbulance?.destination || null}
                  showAmbulances={true}
                  className="h-full w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;
