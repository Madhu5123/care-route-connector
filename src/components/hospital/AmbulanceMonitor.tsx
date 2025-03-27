
import React, { useState } from "react";
import { AmbulanceData } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stethoscope } from "lucide-react";
import AmbulanceCard from "./AmbulanceCard";

interface AmbulanceMonitorProps {
  ambulances: AmbulanceData[];
  onPreparePatient: (ambulanceId: string) => Promise<void>;
  onSelectAmbulance: (ambulance: AmbulanceData) => void;
}

const AmbulanceMonitor: React.FC<AmbulanceMonitorProps> = ({
  ambulances,
  onPreparePatient,
  onSelectAmbulance
}) => {
  const [activeTab, setActiveTab] = useState("incoming");

  const filteredAmbulances = ambulances.filter(amb => {
    if (activeTab === "incoming") {
      return amb.status === "on_duty" && 
             amb.destination?.name; // We're assuming this means it's incoming to this hospital
    } else if (activeTab === "nearby") {
      return amb.status === "available" || 
            (amb.status === "on_duty" && 
             !amb.destination?.name);
    }
    return false;
  });

  return (
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
                <AmbulanceCard 
                  key={ambulance.id}
                  ambulance={ambulance} 
                  isIncoming={true}
                  onPrepare={onPreparePatient}
                />
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
                <AmbulanceCard 
                  key={ambulance.id}
                  ambulance={ambulance} 
                  isIncoming={false}
                  onTrack={() => onSelectAmbulance(ambulance)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AmbulanceMonitor;
