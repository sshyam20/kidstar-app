import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewReward, NewRedemption } from "../types";

export async function addReward(
  familyId: string,
  data: NewReward
): Promise<string> {
  const ref = await addDoc(
    collection(db, "families", familyId, "rewards"),
    { ...data, createdAt: serverTimestamp() }
  );
  return ref.id;
}

export async function updateReward(
  familyId: string,
  rewardId: string,
  data: Partial<NewReward>
): Promise<void> {
  await setDoc(
    doc(db, "families", familyId, "rewards", rewardId),
    data,
    { merge: true }
  );
}

export async function deleteReward(
  familyId: string,
  rewardId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "rewards", rewardId));
}

export async function pauseReward(
  familyId: string,
  rewardId: string,
  paused: boolean
): Promise<void> {
  await setDoc(
    doc(db, "families", familyId, "rewards", rewardId),
    { isPaused: paused },
    { merge: true }
  );
}

export async function redeemReward(
  familyId: string,
  data: NewRedemption
): Promise<void> {
  const batch = writeBatch(db);

  const redemptionRef = doc(
    collection(db, "families", familyId, "redemptions")
  );
  batch.set(redemptionRef, { ...data, createdAt: serverTimestamp() });

  const kidRef = doc(db, "families", familyId, "kids", data.kidId);
  batch.update(kidRef, {
    availablePoints: increment(-data.pointCost),
  });

  await batch.commit();
}
