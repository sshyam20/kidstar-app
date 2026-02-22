import React, { createContext, useContext } from "react";
import { UserRole } from "../types";

interface FamilyContextValue {
  familyId: string;
  role: UserRole;
  kidId: string | null; // non-null only when role === 'kid'
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({
  familyId,
  role,
  kidId,
  children,
}: {
  familyId: string;
  role: UserRole;
  kidId: string | null;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <FamilyContext.Provider value={{ familyId, role, kidId }}>
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

export function useRole(): UserRole {
  return useFamilyContext().role;
}

export function useKidId(): string | null {
  return useFamilyContext().kidId;
}
