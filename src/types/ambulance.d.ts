
import { AmbulanceData as BaseAmbulanceData } from "@/lib/firebase";

// Extend the AmbulanceData interface with additional properties we need
declare module '@/lib/firebase' {
  interface AmbulanceData extends BaseAmbulanceData {
    eta?: string;
    hospital_prepared?: boolean;
    route_cleared?: boolean;
    patientInfo?: {
      severity: "low" | "medium" | "high" | "critical";
      notes: string;
      age?: string;
      gender?: string;
      condition?: string;
    };
  }
}
