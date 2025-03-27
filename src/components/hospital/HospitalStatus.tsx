
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar } from "lucide-react";

const HospitalStatus = () => {
  return (
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
  );
};

export default HospitalStatus;
