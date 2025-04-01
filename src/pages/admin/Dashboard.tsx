import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  UserProfile, 
  UserRole, 
  getPendingUsers, 
  verifyUser, 
  rejectUser,
  getUsersByRole,
  db,
  AmbulanceData
} from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Activity, 
  AlertTriangle, 
  Ambulance,
  CheckCircle2, 
  Clock, 
  FileText, 
  Hospital,
  MapPin, 
  Police,
  Settings, 
  Shield, 
  UserCheck, 
  UserPlus, 
  Users 
} from "lucide-react";

// Add mock data definitions to resolve errors
const mockAmbulances = [
  {
    id: "amb-001",
    driverId: "driver-1",
    vehicleId: "KA-01-1234",
    status: "available",
    currentLocation: { lat: 12.9716, lng: 77.5946 },
    timestamp: new Date(),
    lastMaintenance: new Date(2023, 5, 15)
  },
  {
    id: "amb-002",
    driverId: "driver-2",
    vehicleId: "KA-01-5678",
    status: "on_duty",
    currentLocation: { lat: 12.9716, lng: 77.5946 },
    destination: { lat: 13.0827, lng: 80.2707, name: "Apollo Hospital" },
    timestamp: new Date(),
    lastMaintenance: new Date(2023, 8, 10)
  },
  {
    id: "amb-003",
    driverId: "driver-3",
    vehicleId: "KA-01-9012",
    status: "maintenance",
    timestamp: new Date(),
    lastMaintenance: new Date(2023, 9, 5)
  }
];

const mockEvents = [
  {
    id: "event-001",
    description: "System update failed: Database connection timeout",
    severity: "high",
    timestamp: new Date(2023, 10, 1, 14, 30)
  },
  {
    id: "event-002",
    description: "New hospital registered: City General Hospital",
    severity: "low",
    timestamp: new Date(2023, 10, 2, 9, 15)
  },
  {
    id: "event-003",
    description: "Ambulance KA-01-1234 maintenance scheduled",
    severity: "medium",
    timestamp: new Date(2023, 10, 3, 11, 45)
  },
  {
    id: "event-004",
    description: "User verification process completed for 5 new users",
    severity: "low",
    timestamp: new Date(2023, 10, 4, 16, 20)
  }
];

const AdminDashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [ambulanceUsers, setAmbulanceUsers] = useState<UserProfile[]>([]);
  const [hospitalUsers, setHospitalUsers] = useState<UserProfile[]>([]);
  const [policeUsers, setPoliceUsers] = useState<UserProfile[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserRole | 'pending'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== UserRole.ADMIN)) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        console.log("Loading users, user authenticated:", isAuthenticated, "role:", userProfile?.role);
        
        // Get pending users that need verification
        const pendingUsersData = await getPendingUsers();
        console.log("Pending service users loaded:", pendingUsersData.length);
        setPendingUsers(pendingUsersData);
        
        // Get users by role
        const ambulanceUsersData = await getUsersByRole(UserRole.AMBULANCE);
        setAmbulanceUsers(ambulanceUsersData);
        console.log("Ambulance users loaded:", ambulanceUsersData.length);
        
        const hospitalUsersData = await getUsersByRole(UserRole.HOSPITAL);
        setHospitalUsers(hospitalUsersData);
        console.log("Hospital users loaded:", hospitalUsersData.length);
        
        const policeUsersData = await getUsersByRole(UserRole.POLICE);
        setPoliceUsers(policeUsersData);
        console.log("Police users loaded:", policeUsersData.length);
        
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && userProfile?.role === UserRole.ADMIN) {
      loadUsers();
    }
  }, [isAuthenticated, userProfile]);

  const handleVerifyUser = async (uid: string) => {
    setIsVerifying(true);
    
    try {
      await verifyUser(uid);
      
      const userToVerify = pendingUsers.find(u => u.uid === uid);
      if (userToVerify) {
        // Update appropriate role-based user list
        if (userToVerify.role === UserRole.AMBULANCE) {
          setAmbulanceUsers([...ambulanceUsers, {...userToVerify, verified: true}]);
        } else if (userToVerify.role === UserRole.HOSPITAL) {
          setHospitalUsers([...hospitalUsers, {...userToVerify, verified: true}]);
        } else if (userToVerify.role === UserRole.POLICE) {
          setPoliceUsers([...policeUsers, {...userToVerify, verified: true}]);
        }
        
        // Remove from pending users
        setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
        
        toast({
          title: `${userToVerify.role.charAt(0).toUpperCase() + userToVerify.role.slice(1)} verified`,
          description: `${userToVerify.displayName || userToVerify.email} has been approved and can now log in.`,
        });
      }
    } catch (error) {
      console.error("Error verifying user:", error);
      toast({
        title: "Verification failed",
        description: "Could not verify this user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectUser = async (uid: string) => {
    try {
      await rejectUser(uid);
      
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
      
      toast({
        title: "User rejected",
        description: "The user has been rejected and will not be able to log in.",
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
      toast({
        title: "Rejection failed",
        description: "Could not reject this user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewUserDocuments = (user: UserProfile) => {
    setSelectedUser(user);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Settings className="h-12 w-12 mx-auto text-admin-DEFAULT animate-pulse-gentle" />
          <p className="mt-4 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the role-specific verification tabs
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {userProfile?.displayName ? `Welcome, ${userProfile.displayName}` : "System Administration"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verifications</p>
                  <h3 className="text-2xl font-bold">{pendingUsers.length}</h3>
                </div>
                <UserPlus className="h-8 w-8 text-admin-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ambulance Services</p>
                  <h3 className="text-2xl font-bold">{ambulanceUsers.filter(u => u.verified).length}</h3>
                </div>
                <Ambulance className="h-8 w-8 text-ambulance-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hospital Services</p>
                  <h3 className="text-2xl font-bold">{hospitalUsers.filter(u => u.verified).length}</h3>
                </div>
                <Hospital className="h-8 w-8 text-hospital-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Police Units</p>
                  <h3 className="text-2xl font-bold">{policeUsers.filter(u => u.verified).length}</h3>
                </div>
                <Police className="h-8 w-8 text-police-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card className="glass-card animate-scale-in overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Service Verification</CardTitle>
                <CardDescription>Manage verification of ambulance, hospital, and police services</CardDescription>
              </CardHeader>
              <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value as UserRole | 'pending')}>
                <div className="px-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="pending" className="flex-1">
                      Pending ({pendingUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value={UserRole.AMBULANCE} className="flex-1">
                      Ambulance ({ambulanceUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value={UserRole.HOSPITAL} className="flex-1">
                      Hospitals ({hospitalUsers.length})
                    </TabsTrigger>
                    <TabsTrigger value={UserRole.POLICE} className="flex-1">
                      Police ({policeUsers.length})
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="pending" className="pt-2 pb-4">
                  <div className="px-6">
                    {pendingUsers.length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Organization</TableHead>
                              <TableHead>Documents</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingUsers.map((user) => (
                              <TableRow key={user.uid}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{user.displayName || "No Name"}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      user.role === UserRole.AMBULANCE
                                        ? "bg-ambulance-light/50 text-ambulance-dark border-ambulance-light"
                                        : user.role === UserRole.POLICE
                                        ? "bg-police-light/50 text-police-dark border-police-light"
                                        : user.role === UserRole.HOSPITAL
                                        ? "bg-hospital-light/50 text-hospital-dark border-hospital-light"
                                    }
                                  >
                                    {user.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>{user.organization || "Not specified"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => viewUserDocuments(user)}
                                    disabled={!user.documents}
                                  >
                                    View Docs
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-admin-DEFAULT hover:bg-admin-dark"
                                      onClick={() => handleVerifyUser(user.uid)}
                                      disabled={isVerifying}
                                    >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      {isVerifying ? "Verifying..." : "Verify"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleRejectUser(user.uid)}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No pending service verifications at this time</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value={UserRole.AMBULANCE} className="pt-2 pb-4">
                  <div className="px-6">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ambulanceUsers.map((user) => (
                            <TableRow key={user.uid}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.displayName || "No Name"}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{user.organization || "Not specified"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.verified 
                                      ? "bg-green-100 text-green-800 border-green-300" 
                                      : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  }
                                >
                                  {user.verified ? "Verified" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.createdAt instanceof Date 
                                  ? user.createdAt.toLocaleDateString() 
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => viewUserDocuments(user)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value={UserRole.HOSPITAL} className="pt-2 pb-4">
                  <div className="px-6">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hospital Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hospitalUsers.map((user) => (
                            <TableRow key={user.uid}>
                              <TableCell>
                                <p className="font-medium">{user.organization || user.displayName || "No Name"}</p>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.verified 
                                      ? "bg-green-100 text-green-800 border-green-300" 
                                      : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  }
                                >
                                  {user.verified ? "Verified" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.createdAt instanceof Date 
                                  ? user.createdAt.toLocaleDateString() 
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => viewUserDocuments(user)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value={UserRole.POLICE} className="pt-2 pb-4">
                  <div className="px-6">
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Station</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {policeUsers.map((user) => (
                            <TableRow key={user.uid}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.displayName || "No Name"}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{user.organization || "Not specified"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.verified 
                                      ? "bg-green-100 text-green-800 border-green-300" 
                                      : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  }
                                >
                                  {user.verified ? "Verified" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.createdAt instanceof Date 
                                  ? user.createdAt.toLocaleDateString() 
                                  : "Unknown"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => viewUserDocuments(user)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="glass-card animate-scale-in overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">System Management</CardTitle>
                <CardDescription>Manage users, ambulances, and settings</CardDescription>
              </CardHeader>
              <Tabs defaultValue="users">
                <div className="px-6">
                  <TabsList className="w-full">
                    <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
                    <TabsTrigger value="ambulances" className="flex-1">Ambulances</TabsTrigger>
                    <TabsTrigger value="logs" className="flex-1">System Logs</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="users" className="pt-2 pb-4">
                  <div className="px-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">Active Users</h3>
                      <Button size="sm" className="bg-admin-DEFAULT hover:bg-admin-dark">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add User
                      </Button>
                    </div>
                    
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ambulanceUsers.map((user) => (
                            <TableRow key={user.uid}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.displayName}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.role === UserRole.AMBULANCE
                                      ? "bg-ambulance-light/50 text-ambulance-dark border-ambulance-light"
                                      : user.role === UserRole.POLICE
                                      ? "bg-police-light/50 text-police-dark border-police-light"
                                      : user.role === UserRole.HOSPITAL
                                      ? "bg-hospital-light/50 text-hospital-dark border-hospital-light"
                                      : "bg-admin-light/50 text-admin-dark border-admin-light"
                                  }
                                >
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{user.organization}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="ambulances" className="pt-2 pb-4">
                  <div className="px-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">Ambulance Fleet</h3>
                      <Button size="sm" className="bg-admin-DEFAULT hover:bg-admin-dark">
                        Add Vehicle
                      </Button>
                    </div>
                    
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vehicle ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Maintenance</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockAmbulances.map((ambulance) => (
                            <TableRow key={ambulance.id}>
                              <TableCell className="font-medium">
                                {ambulance.vehicleId}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    ambulance.status === "available"
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : ambulance.status === "on_duty"
                                      ? "bg-blue-100 text-blue-800 border-blue-300"
                                      : "bg-gray-100 text-gray-800 border-gray-300"
                                  }
                                >
                                  {ambulance.status.replace("_", " ")}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {ambulance.lastMaintenance.toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="logs" className="pt-2 pb-4">
                  <div className="px-6">
                    <h3 className="text-sm font-medium mb-4">System Activity</h3>
                    
                    <div className="space-y-4">
                      {mockEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start space-x-3 p-3 rounded-md border"
                        >
                          {event.severity === "high" ? (
                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                          ) : event.severity === "medium" ? (
                            <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {event.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedUser && (
              <Card className="glass-card animate-scale-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">User Documents</CardTitle>
                  <CardDescription>
                    Reviewing documents for {selectedUser.displayName || selectedUser.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedUser.documents?.idCardUrl && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">ID Card/License</h3>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <img 
                          src={selectedUser.documents.idCardUrl} 
                          alt="ID Card" 
                          className="max-h-60 rounded-md mx-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.documents?.selfieUrl && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Selfie/Photograph</h3>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <img 
                          src={selectedUser.documents.selfieUrl} 
                          alt="Selfie" 
                          className="max-h-60 rounded-md mx-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedUser.documents?.vehiclePhotoUrl && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Vehicle Photo</h3>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <img 
                          src={selectedUser.documents.vehiclePhotoUrl} 
                          alt="Vehicle" 
                          className="max-h-60 rounded-md mx-auto"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-admin-DEFAULT hover:bg-admin-dark"
                      onClick={() => {
                        handleVerifyUser(selectedUser.uid);
                        setSelectedUser(null);
                      }}
                    >
                      Verify User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Alerts</CardTitle>
                <CardDescription>Important notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ambulance Maintenance Overdue</AlertTitle>
                    <AlertDescription>
                      Vehicle KA-01-1234 is 15 days overdue for maintenance
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>System Update Complete</AlertTitle>
                    <AlertDescription>
                      All services running on the latest version
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button className="w-full bg-admin-DEFAULT hover:bg-admin-dark">
                    Add New Ambulance
                  </Button>
                  <Button variant="outline" className="w-full">
                    Generate System Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    Update Hospital Database
                  </Button>
                  <Button variant="outline" className="w-full">
                    Manage API Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Health</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Status</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
