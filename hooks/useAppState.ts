import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { subscribeToAuthState } from "../services/auth";
import { db } from "../services/firebase";
import { UserRole, FamilyMembership, MemberRole } from "../types";

interface AppState {
  user: User | null;
  familyId: string | null;
  role: UserRole;
  kidId: string | null;
  userFamilies: FamilyMembership[];
  isAdmin: boolean;
  loading: boolean;
}

export function useAppState(): AppState {
  const [user, setUser] = useState<User | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("parent");
  const [kidId, setKidId] = useState<string | null>(null);
  const [userFamilies, setUserFamilies] = useState<FamilyMembership[]>([]);
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
            // Prefer activeFamilyId, fall back to legacy familyId
            const fid = ((data?.activeFamilyId ?? data?.familyId) as string) ?? null;
            setFamilyId(fid);
            setRole((data?.role as UserRole) ?? "parent");
            setKidId((data?.kidId as string) ?? null);
            setUserFamilies((data?.families as FamilyMembership[]) ?? []);
            setFirestoreLoading(false);
          },
          (_error) => {
            setFamilyId(null);
            setRole("parent");
            setKidId(null);
            setUserFamilies([]);
            setFirestoreLoading(false);
          }
        );
      } else {
        setFamilyId(null);
        setRole("parent");
        setKidId(null);
        setUserFamilies([]);
        setFirestoreLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const isAdmin: boolean =
    familyId !== null &&
    userFamilies.some(
      (f) => f.familyId === familyId && (f.role as MemberRole) === "admin"
    );

  return {
    user,
    familyId,
    role,
    kidId,
    userFamilies,
    isAdmin,
    loading: authLoading || firestoreLoading,
  };
}
