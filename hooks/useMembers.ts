import { useState, useEffect } from "react";
import { FamilyMember } from "../types";
import { subscribeToFamilyMembers } from "../services/members";
import { useFamilyId } from "../context/FamilyContext";

interface UseMembersResult {
  members: FamilyMember[];
  loading: boolean;
}

export function useMembers(): UseMembersResult {
  const familyId = useFamilyId();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToFamilyMembers(familyId, (m) => {
      setMembers(m);
      setLoading(false);
    });
    return unsub;
  }, [familyId]);

  return { members, loading };
}
