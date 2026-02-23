import {
  collection,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { FamilyMember, FamilyMembership, UserRole } from "../types";

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
  // Remove from family members subcollection
  await deleteDoc(doc(db, "families", familyId, "members", uid));

  // Remove this family from the user's families array and update active family
  const userSnap = await getDoc(doc(db, "users", uid));
  if (userSnap.exists()) {
    const existing: FamilyMembership[] =
      (userSnap.data()?.families as FamilyMembership[]) ?? [];
    const updated = existing.filter((f) => f.familyId !== familyId);
    const newActive = updated.length > 0 ? updated[0].familyId : null;
    await updateDoc(doc(db, "users", uid), {
      families: updated,
      activeFamilyId: newActive,
      familyId: newActive,
    });
  }
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
