import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AmbulanceData, subscribeToAmbulanceLocations } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Map from "@/components/Map";
import { Activity, AlertTriangle, Calendar, Clock, Heart, Hospital, Users, Stethoscope } from "lucide-react";

const HospitalDashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<AmbulanceData | null>(null);
  const [activeTab, setActiveTab] = useState("incoming");
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== "hospital")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

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

  const filteredAmbulances = ambulances.filter(amb => {
    if (activeTab === "incoming") {
      return amb.status === "on_duty" && 
             amb.destination?.name === userProfile?.organization;
    } else if (activeTab === "nearby") {
      return amb.status === "available" || 
            (amb.status === "on_duty" && 
             amb.destination?.name !== userProfile?.organization);
    }
    return false;
  });

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
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hospital Status</CardTitle>
                <CardDescription>Current capacity and resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">General Ward Capacity</span>
                      <span className="text-sm">72%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">ICU Capacity</span>
                      <span className="text-sm">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Emergency Room</span>
                      <span className="text-sm">60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-hospital-DEFAULT" />
                      <span className="text-sm">Staff: 42</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-hospital-DEFAULT" />
                      <span className="text-sm">Surgeries: 8</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card animate-scale-in overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ambulance Monitoring</CardTitle>
                <CardDescription>Track incoming and nearby ambulances</CardDescription>
              </CardHeader>
              <Tabs defaultValue="incoming" value={activeTab} onValueChange={setActiveTab}>
                <div className="px-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="incoming" className="flex-1">Incoming</TabsTrigger>
                    <TabsTrigger value="nearby" className="flex-1">Nearby</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="incoming" className="pt-2 pb-4">
                  {filteredAmbulances.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No incoming ambulances</p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-6">
                      {filteredAmbulances.map((ambulance) => (
                        <Card key={ambulance.id} className="overflow-hidden border-hospital-light">
                          <CardHeader className="py-3 bg-hospital-light/20">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm font-medium">
                                Ambulance #{ambulance.vehicleId}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={
                                  ambulance.patientInfo?.severity === "critical"
                                    ? "bg-red-100 text-red-800 border-red-300"
                                    : ambulance.patientInfo?.severity === "high"
                                    ? "bg-orange-100 text-orange-800 border-orange-300"
                                    : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                }
                              >
                                {ambulance.patientInfo?.severity || "Unknown"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span>ETA:</span>
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {ambulance.eta || "12 minutes"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Patient:</span>
                                <span>
                                  {ambulance.patientInfo?.age
                                    ? `${ambulance.patientInfo.gender || "Unknown"}, ${
                                        ambulance.patientInfo.age
                                      } yrs`
                                    : "Details pending"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Condition:</span>
                                <span className="flex items-center">
                                  <Activity className="h-3 w-3 mr-1 text-hospital-DEFAULT" />
                                  {ambulance.patientInfo?.condition || "Heart attack"}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="py-3 bg-gray-50 dark:bg-gray-800">
                            <div className="w-full">
                              <Button
                                className="w-full bg-hospital-DEFAULT hover:bg-hospital-dark"
                                size="sm"
                                onClick={() => prepareForPatient(ambulance.id)}
                                disabled={ambulance.hospital_prepared}
                              >
                                {ambulance.hospital_prepared
                                  ? "Preparation Complete"
                                  : "Prepare for Arrival"}
                              </Button>
                              <div className="text-xs text-center mt-1 text-muted-foreground">
                                Click to notify medical team
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="nearby" className="pt-2 pb-4">
                  {filteredAmbulances.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No nearby ambulances</p>
                    </div>
                  ) : (
                    <div className="space-y-4 px-6">
                      {filteredAmbulances.map((ambulance) => (
                        <Card key={ambulance.id} className="overflow-hidden">
                          <CardHeader className="py-3">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm font-medium">
                                Ambulance #{ambulance.vehicleId}
                              </CardTitle>
                              <Badge
                                variant="outline"
                                className={
                                  ambulance.status === "available"
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-blue-100 text-blue-800 border-blue-300"
                                }
                              >
                                {ambulance.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-3">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span>Location:</span>
                                <span>2.5 km away</span>
                              </div>
                              {ambulance.status === "on_duty" && (
                                <div className="flex items-center justify-between">
                                  <span>Destination:</span>
                                  <span>{ambulance.destination?.name || "Unknown"}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="py-3 bg-gray-50 dark:bg-gray-800">
                            <Button
                              variant="outline"
                              className="w-full"
                              size="sm"
                              onClick={() => setSelectedAmbulance(ambulance)}
                            >
                              Track on Map
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="glass-card animate-scale-in border-hospital-light">
              <CardHeader className="pb-3 bg-hospital-light/20 rounded-t-lg">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-hospital-DEFAULT" />
                  Critical Patient Alert
                </CardTitle>
                <CardDescription>Emergency preparation required</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500 animate-pulse" />
                    <span className="text-sm font-medium">Cardiac Arrest</span>
                  </div>
                  
                  <p className="text-sm">
                    <span className="font-medium">Patient:</span> Male, 58 years
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">ETA:</span> 5 minutes
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Ambulance:</span> KA-01-9876
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span> Patient has history of heart disease, currently unresponsive, CPR in progress
                  </p>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="default"
                      className="w-full bg-hospital-DEFAULT hover:bg-hospital-dark"
                    >
                      Prepare ER Team
                    </Button>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-10rem)] glass-card overflow-hidden animate-scale-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ambulance Tracking</CardTitle>
                <CardDescription>
                  Monitor ambulances and estimated arrival times
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <Map
                  ambulanceMode={false}
                  destination={null}
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

export default HospitalDashboard;
