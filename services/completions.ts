import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewCompletion } from "../types";

export function getTodayDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function recordCompletion(
  familyId: string,
  data: NewCompletion
): Promise<void> {
  const batch = writeBatch(db);

  const completionRef = doc(
    collection(db, "families", familyId, "completions")
  );
  batch.set(completionRef, {
    ...data,
    createdAt: serverTimestamp(),
  });

  const kidRef = doc(db, "families", familyId, "kids", data.kidId);
  batch.update(kidRef, {
    availablePoints: increment(data.points),
    totalPoints: increment(data.points),
  });

  await batch.commit();
}
