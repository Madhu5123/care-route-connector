
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentAmbulance, updateAmbulanceLocation, AmbulanceData } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import Map from "@/components/Map";
import { Clock, MapPin, LocateFixed, AlertTriangle, Truck } from "lucide-react";

const statusColors = {
  available: "bg-green-100 text-green-800 border-green-300",
  on_duty: "bg-blue-100 text-blue-800 border-blue-300",
  returning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  maintenance: "bg-gray-100 text-gray-800 border-gray-300",
};

const AmbulanceDashboard = () => {
  const { currentUser, userProfile, loading, isAuthenticated } = useAuth();
  const [ambulance, setAmbulance] = useState<AmbulanceData | null>(null);
  const [status, setStatus] = useState<AmbulanceData["status"]>("available");
  const [destination, setDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    trafficDuration: string;
  } | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Redirect if not authenticated or not an ambulance driver
  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== "ambulance")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

  // Load ambulance data
  useEffect(() => {
    const loadAmbulanceData = async () => {
      if (currentUser) {
        try {
          const ambulanceData = await getCurrentAmbulance(currentUser.uid);
          if (ambulanceData) {
            setAmbulance(ambulanceData);
            setStatus(ambulanceData.status);
            if (ambulanceData.destination) {
              setDestination(ambulanceData.destination);
            }
          } else {
            toast({
              title: "No ambulance found",
              description: "You are not assigned to any ambulance. Please contact your administrator.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error loading ambulance data:", error);
          toast({
            title: "Error",
            description: "Failed to load ambulance data. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    loadAmbulanceData();
  }, [currentUser]);

  // Watch location and update in Firebase
  useEffect(() => {
    if (ambulance && navigator.geolocation) {
      // Clear any existing watch
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }

      // Start new location watch
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          setCurrentLocation(newLocation);
          
          // Update location in Firebase every 10 seconds or when it changes significantly
          updateAmbulanceLocation(ambulance.id, newLocation).catch((error) => {
            console.error("Error updating location:", error);
          });
        },
        (error) => {
          console.error("Error watching location:", error);
          toast({
            title: "Location error",
            description: "Could not access your location. Please check your device settings.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000,
        }
      );
      
      setLocationWatchId(watchId);
      
      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }
  }, [ambulance]);

  // Handle status change
  const handleStatusChange = async (newStatus: AmbulanceData["status"]) => {
    if (!ambulance) return;
    
    try {
      // Update status in Firebase
      await updateAmbulanceStatus(ambulance.id, newStatus);
      setStatus(newStatus);
      
      toast({
        title: "Status updated",
        description: `Ambulance status is now ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Status update failed",
        description: "Could not update ambulance status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock function for updating ambulance status (replace with actual Firebase function)
  const updateAmbulanceStatus = async (ambulanceId: string, status: AmbulanceData["status"]) => {
    // This would typically update the status in Firebase
    // For now, we're just simulating this
    return Promise.resolve();
  };

  // Handle route calculation
  const handleRouteCalculated = (route: google.maps.DirectionsResult) => {
    if (route.routes.length > 0 && route.routes[0].legs.length > 0) {
      const leg = route.routes[0].legs[0];
      setRouteInfo({
        distance: leg.distance.text,
        duration: leg.duration.text,
        trafficDuration: leg.duration_in_traffic?.text || leg.duration.text,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Truck className="h-12 w-12 mx-auto text-ambulance-DEFAULT animate-pulse-gentle" />
          <p className="mt-4 text-lg">Loading ambulance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Ambulance Dashboard</h1>
          <p className="text-muted-foreground">
            {userProfile?.displayName ? `Welcome, ${userProfile.displayName}` : "Welcome to your dashboard"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - ambulance details */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ambulance Status</CardTitle>
                <CardDescription>Update your current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge variant="outline" className={statusColors[status]}>
                      {status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Select
                      value={status}
                      onValueChange={(value) => handleStatusChange(value as AmbulanceData["status"])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="on_duty">On Duty</SelectItem>
                        <SelectItem value="returning">Returning</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ambulance && (
                    <div className="space-y-2 pt-2">
                      <div className="text-sm">
                        <span className="font-medium">Vehicle ID:</span> {ambulance.vehicleId}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Route information */}
            {routeInfo && destination && (
              <Card className="glass-card animate-scale-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Route Information</CardTitle>
                  <CardDescription>Current journey details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-ambulance-DEFAULT" />
                      <span>Destination: {destination.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-ambulance-DEFAULT" />
                      <span>ETA: {routeInfo.trafficDuration}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <LocateFixed className="h-4 w-4 mr-2 text-ambulance-DEFAULT" />
                      <span>Distance: {routeInfo.distance}</span>
                    </div>

                    {parseFloat(routeInfo.trafficDuration) > parseFloat(routeInfo.duration) * 1.2 && (
                      <div className="flex items-center mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                        <span className="text-yellow-700">Traffic delay detected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mock emergency request - in a real app this would come from the backend */}
            <Card className="glass-card animate-scale-in border-ambulance-light">
              <CardHeader className="pb-3 bg-ambulance-light/20 rounded-t-lg">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-ambulance-DEFAULT" />
                  Emergency Request
                </CardTitle>
                <CardDescription>New emergency pick-up</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-medium">Location:</span> 123 Main St, Bangalore
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Patient:</span> Male, 45 years
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Condition:</span> Chest pain, suspected heart attack
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Priority:</span>{" "}
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                      High
                    </Badge>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Destination:</span> City Hospital
                  </p>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="default" 
                      className="w-full bg-ambulance-DEFAULT hover:bg-ambulance-dark text-white"
                      onClick={() => {
                        setDestination({
                          lat: 12.9716,
                          lng: 77.5946,
                          name: "City Hospital",
                        });
                        handleStatusChange("on_duty");
                        toast({
                          title: "Emergency accepted",
                          description: "Navigation route has been updated.",
                        });
                      }}
                    >
                      Accept
                    </Button>
                    <Button variant="outline" className="w-full">
                      Decline
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
                <CardTitle className="text-lg">Live Navigation</CardTitle>
                <CardDescription>Your optimal route with traffic updates</CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <Map 
                  ambulanceMode={true}
                  onRouteCalculated={handleRouteCalculated}
                  destination={destination}
                  showAmbulances={false}
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

export default AmbulanceDashboard;
