import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewKid } from "../types";

export async function addKid(
  familyId: string,
  data: NewKid
): Promise<string> {
  const ref = await addDoc(collection(db, "families", familyId, "kids"), {
    ...data,
    availablePoints: 0,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteKid(
  familyId: string,
  kidId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "kids", kidId));
}
