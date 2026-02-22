import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewActivity } from "../types";

export async function addActivity(
  familyId: string,
  data: NewActivity
): Promise<string> {
  const ref = await addDoc(
    collection(db, "families", familyId, "activities"),
    { ...data, createdAt: serverTimestamp() }
  );
  return ref.id;
}

export async function updateActivity(
  familyId: string,
  activityId: string,
  data: Partial<NewActivity>
): Promise<void> {
  await setDoc(
    doc(db, "families", familyId, "activities", activityId),
    data,
    { merge: true }
  );
}

export async function deleteActivity(
  familyId: string,
  activityId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "activities", activityId));
}
