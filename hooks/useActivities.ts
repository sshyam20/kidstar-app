import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFamilyId } from "../context/FamilyContext";
import { Activity } from "../types";

interface UseActivitiesResult {
  activities: Activity[];
  loading: boolean;
}

export function useActivities(): UseActivitiesResult {
  const familyId = useFamilyId();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "families", familyId, "activities"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setActivities(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Activity, "id">),
        }))
      );
      setLoading(false);
    });
  }, [familyId]);

  return { activities, loading };
}
