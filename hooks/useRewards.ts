import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFamilyId } from "../context/FamilyContext";
import { Reward } from "../types";

interface UseRewardsResult {
  rewards: Reward[];
  loading: boolean;
}

export function useRewards(): UseRewardsResult {
  const familyId = useFamilyId();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "families", familyId, "rewards"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setRewards(
        snap.docs.map((d) => {
          const data = d.data() as Omit<Reward, "id">;
          return { id: d.id, ...data, isPaused: data.isPaused ?? false };
        })
      );
      setLoading(false);
    });
  }, [familyId]);

  return { rewards, loading };
}
