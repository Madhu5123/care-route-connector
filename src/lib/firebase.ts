
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  GeoPoint
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
// Note: In a production environment, these would be stored securely
const firebaseConfig = {
  apiKey: "AIzaSyDoaSY-n_ebkRccENDb9HHubXQyQtIxfvI", // Replace with your Firebase API key
  authDomain: "lifeline-ai-485e3.firebaseapp.com",
  projectId: "lifeline-ai-485e3",
  storageBucket: "lifeline-ai-485e3.firebasestorage.app",
  messagingSenderId: "114223980407",
  appId: "1:114223980407:web:732e297a81e32a9efbcb72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// User roles
export enum UserRole {
  AMBULANCE = "ambulance",
  POLICE = "police",
  HOSPITAL = "hospital",
  ADMIN = "admin"
}

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phoneNumber?: string;
  organization?: string;
  verified?: boolean;
  createdAt: Date;
  lastLogin?: Date;
  documents?: {
    idCardUrl?: string;
    selfieUrl?: string;
    vehiclePhotoUrl?: string;
  };
}

// Ambulance interface
export interface AmbulanceData {
  id: string;
  driverId: string;
  vehicleId: string;
  status: 'available' | 'on_duty' | 'returning' | 'maintenance';
  eta?: string;  // ✅ Add missing field
  hospital_prepared?: boolean;  // ✅ Add missing field
  route_cleared?: boolean;  // ✅ Add missing field
  currentLocation?: {
    lat: number;
    lng: number;
  };
  destination?: {
    lat: number;
    lng: number;
    name: string;
  };
  patientInfo?: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    notes: string;
    age?: string;  // ✅ Add missing field
    gender?: string;  // ✅ Add missing field
    condition?: string;  // ✅ Add missing field
  };
  timestamp: Date;
}

// Authentication functions
export const signUp = async (
  email: string, 
  password: string, 
  role: UserRole, 
  userData: Partial<UserProfile>
): Promise<UserProfile> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      role,
      createdAt: new Date(),
      verified: false, // Explicitly set to false to require admin approval
      ...userData
    };
    
    // Save to Firestore
    await setDoc(doc(db, "users", user.uid), userProfile);
    
    return userProfile;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if user is verified
    const userProfile = await getUserProfile(userCredential.user.uid);
    
    if (userProfile && userProfile.verified === false) {
      await firebaseSignOut(auth); // Sign out the user immediately
      throw new Error("Your account is pending approval. Please wait for an administrator to verify your account.");
    }
    
    // Update last login
    await updateDoc(doc(db, "users", userCredential.user.uid), {
      lastLogin: new Date()
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Location tracking functions
export const updateAmbulanceLocation = async (
  ambulanceId: string, 
  location: { lat: number; lng: number }
): Promise<void> => {
  try {
    await updateDoc(doc(db, "ambulances", ambulanceId), {
      currentLocation: location,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error updating ambulance location:", error);
    throw error;
  }
};

export const subscribeToAmbulanceLocations = (
  callback: (ambulances: AmbulanceData[]) => void
) => {
  const ambulancesRef = collection(db, "ambulances");
  
  // Only get active ambulances
  const q = query(
    ambulancesRef, 
    where("status", "in", ["on_duty", "available"])
  );
  
  return onSnapshot(q, (snapshot) => {
    const ambulances: AmbulanceData[] = [];
    snapshot.forEach((doc) => {
      ambulances.push({ id: doc.id, ...doc.data() } as AmbulanceData);
    });
    callback(ambulances);
  });
};

export const getCurrentAmbulance = async (driverId: string): Promise<AmbulanceData | null> => {
  try {
    const ambulancesRef = collection(db, "ambulances");
    const q = query(ambulancesRef, where("driverId", "==", driverId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as AmbulanceData;
    }
    return null;
  } catch (error) {
    console.error("Error getting current ambulance:", error);
    throw error;
  }
};

// Admin functions for user verification
export const getPendingUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("verified", "==", false));
    const querySnapshot = await getDocs(q);
    
    const pendingUsers: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      pendingUsers.push(doc.data() as UserProfile);
    });
    
    return pendingUsers;
  } catch (error) {
    console.error("Error getting pending users:", error);
    throw error;
  }
};

export const verifyUser = async (uid: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "users", uid), {
      verified: true
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    throw error;
  }
};

export const rejectUser = async (uid: string): Promise<void> => {
  try {
    // You could either delete the user or mark them as rejected
    await updateDoc(doc(db, "users", uid), {
      verified: null,
      rejected: true
    });
  } catch (error) {
    console.error("Error rejecting user:", error);
    throw error;
  }
};

export { auth, db, storage };
