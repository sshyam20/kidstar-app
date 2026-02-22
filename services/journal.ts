import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { JournalEntry, NewJournalEntry } from "../types";

export async function addJournalEntry(
  familyId: string,
  data: NewJournalEntry
): Promise<string> {
  const col = collection(db, "families", familyId, "kids", data.kidId, "journal");
  const docRef = await addDoc(col, {
    ...data,
    photoUrl: data.photoUrl ?? null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteJournalEntry(
  familyId: string,
  kidId: string,
  entryId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "families", familyId, "kids", kidId, "journal", entryId)
  );
}

export function subscribeToJournal(
  familyId: string,
  kidId: string,
  callback: (entries: JournalEntry[]) => void
): () => void {
  const q = query(
    collection(db, "families", familyId, "kids", kidId, "journal"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<JournalEntry, "id">),
    }));
    callback(entries);
  });
}

export async function uploadJournalPhoto(
  familyId: string,
  kidId: string,
  entryId: string,
  localUri: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = ref(
    storage,
    `families/${familyId}/kids/${kidId}/journal/${entryId}.jpg`
  );
  await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(fileRef);
}
