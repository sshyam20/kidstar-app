import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewClass } from "../types";

export async function addClass(
  familyId: string,
  data: NewClass
): Promise<string> {
  const ref = await addDoc(
    collection(db, "families", familyId, "classes"),
    { ...data, createdAt: serverTimestamp() }
  );
  return ref.id;
}

export async function updateClass(
  familyId: string,
  classId: string,
  data: Partial<NewClass>
): Promise<void> {
  await setDoc(
    doc(db, "families", familyId, "classes", classId),
    data,
    { merge: true }
  );
}

export async function deleteClass(
  familyId: string,
  classId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "classes", classId));
}
