import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { FamilyMember, UserRole } from "../types";

export async function updateMemberRole(
  familyId: string,
  uid: string,
  role: UserRole
): Promise<void> {
  await setDoc(
    doc(db, "families", familyId, "members", uid),
    { role },
    { merge: true }
  );
  await setDoc(doc(db, "users", uid), { role }, { merge: true });
}

export async function removeMember(
  familyId: string,
  uid: string
): Promise<void> {
  await deleteDoc(doc(db, "families", familyId, "members", uid));
  // Clear the user's familyId so they land back on CreateFamily screen
  await setDoc(
    doc(db, "users", uid),
    { familyId: null, role: "parent", kidId: null },
    { merge: true }
  );
}

export function subscribeToFamilyMembers(
  familyId: string,
  callback: (members: FamilyMember[]) => void
): () => void {
  return onSnapshot(
    collection(db, "families", familyId, "members"),
    (snap) => {
      const members = snap.docs.map((d) => ({
        ...(d.data() as Omit<FamilyMember, "uid">),
        uid: d.id,
      }));
      callback(members);
    }
  );
}
