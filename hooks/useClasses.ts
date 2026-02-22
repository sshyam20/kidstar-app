import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFamilyId } from "../context/FamilyContext";
import { ClassSchedule } from "../types";

interface UseClassesResult {
  classes: ClassSchedule[];
  loading: boolean;
}

export function useClasses(): UseClassesResult {
  const familyId = useFamilyId();
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "families", familyId, "classes"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setClasses(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ClassSchedule, "id">),
        }))
      );
      setLoading(false);
    });
  }, [familyId]);

  return { classes, loading };
}
