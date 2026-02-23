import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
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

/** Deep-delete a kid: journal entries, completions, redemptions, avatar, then the kid doc */
export async function removeKid(
  familyId: string,
  kidId: string
): Promise<void> {
  // 1. Delete all journal entries (subcollection of the kid doc)
  const journalSnap = await getDocs(
    collection(db, "families", familyId, "kids", kidId, "journal")
  );
  if (journalSnap.docs.length > 0) {
    const batch = writeBatch(db);
    journalSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Delete completions for this kid
  const completionsSnap = await getDocs(
    query(collection(db, "families", familyId, "completions"), where("kidId", "==", kidId))
  );
  if (completionsSnap.docs.length > 0) {
    const batch = writeBatch(db);
    completionsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 3. Delete redemptions for this kid
  const redemptionsSnap = await getDocs(
    query(collection(db, "families", familyId, "redemptions"), where("kidId", "==", kidId))
  );
  if (redemptionsSnap.docs.length > 0) {
    const batch = writeBatch(db);
    redemptionsSnap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 4. Delete avatar from Storage (ignore if missing)
  try {
    await deleteObject(ref(storage, `families/${familyId}/kids/${kidId}/avatar.jpg`));
  } catch {
    // avatar may not exist
  }

  // 5. Delete the kid document
  await deleteDoc(doc(db, "families", familyId, "kids", kidId));
}

/** Legacy alias — use removeKid for full cleanup */
export async function deleteKid(
  familyId: string,
  kidId: string
): Promise<void> {
  await removeKid(familyId, kidId);
}
