
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth, getUserProfile, UserProfile, UserRole } from "@/lib/firebase";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  error: null,
  userRole: null,
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          
          // Check if profile was found
          if (profile) {
            // Only restrict login for service roles (ambulance, hospital, police)
            if (profile.role !== UserRole.ADMIN) {
              if ([UserRole.AMBULANCE, UserRole.HOSPITAL, UserRole.POLICE].includes(profile.role) 
                  && profile.verified === false) {
                console.log(`${profile.role} account is not verified yet:`, user.uid);
                toast({
                  title: `${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} account pending approval`,
                  description: `Your ${profile.role} account is waiting for administrator verification.`,
                  variant: "destructive"
                });
                // Don't set the profile if not verified
                setUserProfile(null);
                // Sign out the user
                await auth.signOut();
                setCurrentUser(null);
              } else {
                console.log("User profile loaded successfully:", profile.role);
                setUserProfile(profile);
              }
            } else {
              // Admin users are always verified
              console.log("Admin user logged in:", user.uid);
              setUserProfile(profile);
            }
          } else {
            console.log("No user profile found for:", user.uid);
            setUserProfile(null);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          toast({
            title: "Error",
            description: "Failed to load user profile. Please refresh the page.",
            variant: "destructive"
          });
          setError("Failed to load user profile");
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    userRole: userProfile?.role || null,
    isAuthenticated: !!currentUser && !!userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
