import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { subscribeToAuthState } from "../services/auth";
import { db } from "../services/firebase";
import { UserRole } from "../types";

interface AppState {
  user: User | null;
  familyId: string | null;
  role: UserRole;
  kidId: string | null;
  loading: boolean;
}

export function useAppState(): AppState {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("parent");
  const [kidId, setKidId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreLoading, setFirestoreLoading] = useState(false);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (firebaseUser) {
        setFirestoreLoading(true);
        unsubFirestore = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            const data = snap.data();
            setFamilyId((data?.familyId as string) ?? null);
            setRole((data?.role as UserRole) ?? "parent");
            setKidId((data?.kidId as string) ?? null);
            setFirestoreLoading(false);
          },
          (_error) => {
            // Permission denied or network error — treat as no family yet
            setFamilyId(null);
            setRole("parent");
            setKidId(null);
            setFirestoreLoading(false);
          }
        );
      } else {
        setFamilyId(null);
        setRole("parent");
        setKidId(null);
        setFirestoreLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  return {
    user,
    familyId,
    role,
    kidId,
    loading: authLoading || firestoreLoading,
  };
}
