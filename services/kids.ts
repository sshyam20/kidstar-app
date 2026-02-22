import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { Kid, NewKid } from "../types";

export async function addKid(
  familyId: string,
  data: NewKid
): Promise<string> {
  const ref2 = await addDoc(collection(db, "families", familyId, "kids"), {
    ...data,
    availablePoints: 0,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });
  return ref2.id;
}

export async function updateKid(
  familyId: string,
  kidId: string,
  data: Partial<Pick<Kid, "name" | "emoji" | "color" | "photoUrl">>
): Promise<void> {
  await updateDoc(doc(db, "families", familyId, "kids", kidId), data);
}

export async function uploadKidAvatar(
  familyId: string,
  kidId: string,
  localUri: string
): Promise<string> {
  const storageRef = ref(storage, `families/${familyId}/kids/${kidId}/avatar.jpg`);
  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

export async function deleteKid(
  familyId: string,
  kidId: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "kids", kidId));
}
