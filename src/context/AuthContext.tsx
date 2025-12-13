"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/lib/types";

interface AuthContextType {
    user: FirebaseUser | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        if (!user) return;

        try {
            const profileRef = doc(db, "profiles", user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                setProfile(profileSnap.data() as UserProfile);
            }
        } catch (error) {
            console.error("[AuthContext] Error refreshing profile:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const profileRef = doc(db, "profiles", firebaseUser.uid);
                    const profileSnap = await getDoc(profileRef);

                    if (profileSnap.exists()) {
                        setProfile(profileSnap.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("[AuthContext] Error fetching profile:", error);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
