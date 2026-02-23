import React, { createContext, useContext } from "react";
import { UserRole, FamilyMembership } from "../types";

interface FamilyContextValue {
  familyId: string;
  familyName: string;
  role: UserRole;
  kidId: string | null;
  userFamilies: FamilyMembership[];
  isAdmin: boolean;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({
  familyId,
  familyName,
  role,
  kidId,
  userFamilies,
  isAdmin,
  children,
}: {
  familyId: string;
  familyName: string;
  role: UserRole;
  kidId: string | null;
  userFamilies: FamilyMembership[];
  isAdmin: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <FamilyContext.Provider value={{ familyId, familyName, role, kidId, userFamilies, isAdmin }}>
      {children}
    </FamilyContext.Provider>
  );
}

function useFamilyContext(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("Must be used inside FamilyProvider");
  return ctx;
}

export function useFamilyId(): string {
  return useFamilyContext().familyId;
}

export function useFamilyName(): string {
  return useFamilyContext().familyName;
}

export function useRole(): UserRole {
  return useFamilyContext().role;
}

export function useKidId(): string | null {
  return useFamilyContext().kidId;
}

export function useUserFamilies(): FamilyMembership[] {
  return useFamilyContext().userFamilies;
}

export function useIsAdmin(): boolean {
  return useFamilyContext().isAdmin;
}
