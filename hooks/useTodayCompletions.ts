import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFamilyId } from "../context/FamilyContext";
import { Completion } from "../types";
import { getTodayDate } from "../services/completions";

interface UseTodayCompletionsResult {
  completions: Completion[];
  completedSet: Set<string>;
  loading: boolean;
}

export function useTodayCompletions(): UseTodayCompletionsResult {
  const familyId = useFamilyId();
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getTodayDate();
    const q = query(
      collection(db, "families", familyId, "completions"),
      where("date", "==", today)
    );
    return onSnapshot(q, (snap) => {
      const result: Completion[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Completion, "id">),
      }));
      setCompletions(result);
      setCompletedSet(new Set(result.map((c) => `${c.kidId}:${c.activityId}`)));
      setLoading(false);
    });
  }, [familyId]);

  return { completions, completedSet, loading };
}
