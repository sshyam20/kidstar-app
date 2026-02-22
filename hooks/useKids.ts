import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFamilyId } from "../context/FamilyContext";
import { Kid } from "../types";

interface UseKidsResult {
  kids: Kid[];
  loading: boolean;
}

export function useKids(): UseKidsResult {
  const familyId = useFamilyId();
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "families", familyId, "kids"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setKids(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Kid, "id">) }))
      );
      setLoading(false);
    });
  }, [familyId]);

  return { kids, loading };
}
