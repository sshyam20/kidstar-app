import { deleteUser } from "firebase/auth";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { FamilyMembership } from "../types";
import { deleteEntireFamily } from "./family";

/**
 * Permanently deletes the current user's account:
 * - Families where they are admin → entire family is deleted; all other members have this
 *   family removed from their user docs.
 * - Families where they are not admin → they are removed from the members subcollection only.
 * - Their own user document is deleted.
 * - Their Firebase Auth account is deleted last.
 *
 * IMPORTANT: Firebase may require recent sign-in for deleteUser. Caller should
 * handle auth/requires-recent-login and prompt re-authentication if needed.
 */
export async function deleteAccount(uid: string): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", uid));
  const userData = userSnap.data();
  const families: FamilyMembership[] = (userData?.families as FamilyMembership[]) ?? [];

  for (const membership of families) {
    if (membership.role === "admin") {
      // Notify other members: remove this family from their user docs
      const membersSnap = await getDocs(
        collection(db, "families", membership.familyId, "members")
      );
      for (const memberDoc of membersSnap.docs) {
        if (memberDoc.id === uid) continue;
        try {
          const otherSnap = await getDoc(doc(db, "users", memberDoc.id));
          if (otherSnap.exists()) {
            const otherFamilies: FamilyMembership[] =
              (otherSnap.data()?.families as FamilyMembership[]) ?? [];
            const filtered = otherFamilies.filter(
              (f) => f.familyId !== membership.familyId
            );
            const newActive =
              filtered.length > 0 ? filtered[0].familyId : null;
            await updateDoc(doc(db, "users", memberDoc.id), {
              families: filtered,
              activeFamilyId: newActive,
              familyId: newActive,
            });
          }
        } catch {
          // Don't fail the whole operation if one member update fails
        }
      }
      // Delete the entire family and all its data
      await deleteEntireFamily(membership.familyId);
    } else {
      // Just remove this user from the family's members subcollection
      try {
        await deleteDoc(
          doc(db, "families", membership.familyId, "members", uid)
        );
      } catch {
        // Ignore if already missing
      }
    }
  }

  // Delete the user's own document
  await deleteDoc(doc(db, "users", uid));

  // Delete the Firebase Auth account (must be last)
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}
