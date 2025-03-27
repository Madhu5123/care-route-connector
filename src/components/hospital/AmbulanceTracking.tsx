
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Map from "@/components/Map";

const AmbulanceTracking = () => {
  return (
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
  );
};

export default AmbulanceTracking;
