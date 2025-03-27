
import React from "react";
import { AmbulanceData } from "@/lib/firebase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity } from "lucide-react";

interface AmbulanceCardProps {
  ambulance: AmbulanceData;
  isIncoming: boolean;
  onPrepare?: (ambulanceId: string) => void;
  onTrack?: (ambulance: AmbulanceData) => void;
}

const AmbulanceCard: React.FC<AmbulanceCardProps> = ({ 
  ambulance, 
  isIncoming, 
  onPrepare, 
  onTrack 
}) => {
  if (isIncoming) {
    return (
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
              onClick={() => onPrepare && onPrepare(ambulance.id)}
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
    );
  }
  
  return (
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
          onClick={() => onTrack && onTrack(ambulance)}
        >
          Track on Map
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AmbulanceCard;
