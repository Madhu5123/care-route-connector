
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Heart } from "lucide-react";

const CriticalPatientAlert = () => {
  return (
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
  );
};

export default CriticalPatientAlert;
