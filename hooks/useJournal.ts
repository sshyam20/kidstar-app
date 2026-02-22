import { useState, useEffect } from "react";
import { useFamilyId } from "../context/FamilyContext";
import { subscribeToJournal } from "../services/journal";
import { JournalEntry } from "../types";

export function useJournal(kidId: string): {
  entries: JournalEntry[];
  loading: boolean;
} {
  const familyId = useFamilyId();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kidId) return;
    setLoading(true);
    const unsub = subscribeToJournal(familyId, kidId, (data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsub;
  }, [familyId, kidId]);

  return { entries, loading };
}
