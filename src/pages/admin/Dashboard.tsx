import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  UserProfile, 
  UserRole, 
  getPendingUsers, 
  verifyUser, 
  rejectUser,
  db
} from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MapPin, 
  Settings, 
  Shield, 
  UserCheck, 
  UserPlus, 
  Users 
} from "lucide-react";

const AdminDashboard = () => {
  const { userProfile, loading, isAuthenticated } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || userProfile?.role !== "admin")) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, userProfile, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Get pending users using the imported function
        const pendingUsersData = await getPendingUsers();
        setPendingUsers(pendingUsersData);
        
        // Get verified users using Firestore queries
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("verified", "==", true));
        const querySnapshot = await getDocs(q);
        
        const activeUsersData: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          activeUsersData.push(doc.data() as UserProfile);
        });
        
        setActiveUsers(activeUsersData);
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    if (isAuthenticated && userProfile?.role === "admin") {
      loadUsers();
    }
  }, [isAuthenticated, userProfile]);

  const handleVerifyUser = async (uid: string) => {
    setIsVerifying(true);
    
    try {
      await verifyUser(uid);
      
      const userToVerify = pendingUsers.find(u => u.uid === uid);
      if (userToVerify) {
        const verifiedUser = { ...userToVerify, verified: true };
        setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
        setActiveUsers([...activeUsers, verifiedUser]);
        
        toast({
          title: "User verified",
          description: `${verifiedUser.displayName || verifiedUser.email} has been approved and can now log in.`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Settings className="h-12 w-12 mx-auto text-admin-DEFAULT animate-pulse-gentle" />
          <p className="mt-4 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

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
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">{activeUsers.length + pendingUsers.length}</h3>
                </div>
                <Users className="h-8 w-8 text-admin-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Ambulances</p>
                  <h3 className="text-2xl font-bold">
                    {mockAmbulances.filter(a => a.status !== "maintenance").length}
                  </h3>
                </div>
                <Activity className="h-8 w-8 text-ambulance-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Hospitals</p>
                  <h3 className="text-2xl font-bold">
                    {activeUsers.filter(u => u.role === UserRole.HOSPITAL).length}
                  </h3>
                </div>
                <MapPin className="h-8 w-8 text-hospital-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Police Units</p>
                  <h3 className="text-2xl font-bold">
                    {activeUsers.filter(u => u.role === UserRole.POLICE).length}
                  </h3>
                </div>
                <Shield className="h-8 w-8 text-police-DEFAULT opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            {pendingUsers.length > 0 && (
              <Card className="glass-card animate-scale-in border-admin-light">
                <CardHeader className="pb-3 bg-admin-light/20">
                  <CardTitle className="text-lg flex items-center">
                    <UserPlus className="h-5 w-5 mr-2 text-admin-DEFAULT" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription>New users requiring verification</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
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
                                    : "bg-admin-light/50 text-admin-dark border-admin-light"
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
                </CardContent>
              </Card>
            )}

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
                          {activeUsers.map((user) => (
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
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Location Services</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notification System</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Degraded
                    </Badge>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-2">
                    View Full System Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
