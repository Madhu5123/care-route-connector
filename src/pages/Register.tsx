
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, UserRole } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UserPlus, Upload } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(false);
  const [idCard, setIdCard] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    if (!file) return "";
    
    const storage = getStorage();
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (!role) {
      toast({
        title: "Role selection required",
        description: "Please select your role in the system",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms and conditions required",
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    // Validate role-specific document uploads
    if (role === UserRole.AMBULANCE && (!idCard || !selfie || !vehiclePhoto)) {
      toast({
        title: "Documents required",
        description: "Please upload your ID card, selfie, and ambulance photo",
        variant: "destructive",
      });
      return;
    }

    if ((role === UserRole.POLICE || role === UserRole.HOSPITAL) && (!idCard || !selfie)) {
      toast({
        title: "Documents required",
        description: "Please upload your ID card and selfie",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload documents
      let documents: Record<string, string> = {};
      
      if (idCard) {
        documents.idCardUrl = await uploadFile(idCard, `users/${role}/id_cards`);
      }
      
      if (selfie) {
        documents.selfieUrl = await uploadFile(selfie, `users/${role}/selfies`);
      }
      
      if (role === UserRole.AMBULANCE && vehiclePhoto) {
        documents.vehiclePhotoUrl = await uploadFile(vehiclePhoto, `users/${role}/vehicles`);
      }

      await signUp(
        email, 
        password, 
        role as UserRole, 
        {
          displayName,
          phoneNumber,
          organization,
          verified: false, // All users need verification
          documents, // Add uploaded document URLs
        }
      );
      
      toast({
        title: "Registration successful",
        description: "Your account needs admin approval before you can log in.",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-secondary/50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-semibold tracking-tight">Emergency Response System</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        <Card className="w-full glass-card animate-scale-in">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Enter your details to create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Organization (Hospital, Police Station, etc.)"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Select 
                  value={role} 
                  onValueChange={(value) => setRole(value as UserRole)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.AMBULANCE}>Ambulance Driver</SelectItem>
                    <SelectItem value={UserRole.POLICE}>Traffic Police</SelectItem>
                    <SelectItem value={UserRole.HOSPITAL}>Hospital Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Document upload section */}
              {role && (
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                  <h3 className="text-sm font-medium">Required Documents</h3>
                  
                  <div className="space-y-2">
                    <label className="flex flex-col space-y-1">
                      <span className="text-sm">ID Card/License *</span>
                      <div className="flex items-center space-x-2 bg-background rounded border p-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs"
                          onChange={(e) => handleFileChange(e, setIdCard)}
                          disabled={loading}
                          required
                        />
                        {idCard && <span className="text-xs text-green-600">✓ Selected</span>}
                      </div>
                    </label>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex flex-col space-y-1">
                      <span className="text-sm">Selfie/Photograph *</span>
                      <div className="flex items-center space-x-2 bg-background rounded border p-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="max-w-xs"
                          onChange={(e) => handleFileChange(e, setSelfie)}
                          disabled={loading}
                          required
                        />
                        {selfie && <span className="text-xs text-green-600">✓ Selected</span>}
                      </div>
                    </label>
                  </div>

                  {role === UserRole.AMBULANCE && (
                    <div className="space-y-2">
                      <label className="flex flex-col space-y-1">
                        <span className="text-sm">Ambulance Photo *</span>
                        <div className="flex items-center space-x-2 bg-background rounded border p-2">
                          <Input 
                            type="file" 
                            accept="image/*" 
                            className="max-w-xs"
                            onChange={(e) => handleFileChange(e, setVehiclePhoto)}
                            disabled={loading}
                            required
                          />
                          {vehiclePhoto && <span className="text-xs text-green-600">✓ Selected</span>}
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start space-x-2 py-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted} 
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  disabled={loading}
                />
                <label 
                  htmlFor="terms" 
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the terms and conditions of the Emergency Response System
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
