import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Invitation, UserRole } from "../types";

// Invitations live at top-level so they can be queried by email at sign-in
export async function sendInvitation(
  familyId: string,
  familyName: string,
  invitedBy: string,
  email: string,
  role: UserRole
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  // Avoid duplicate pending invites for same email+family
  const existing = await getDocs(
    query(
      collection(db, "invitations"),
      where("email", "==", normalizedEmail),
      where("familyId", "==", familyId)
    )
  );
  if (!existing.empty) {
    throw new Error("An invitation for this email already exists.");
  }

  const ref = await addDoc(collection(db, "invitations"), {
    email: normalizedEmail,
    familyId,
    familyName,
    invitedBy,
    role,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPendingInvitations(email: string): Promise<Invitation[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const snap = await getDocs(
    query(
      collection(db, "invitations"),
      where("email", "==", normalizedEmail)
    )
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Invitation, "id">),
  }));
}

export async function acceptInvitation(
  invitation: Invitation,
  uid: string,
  displayName: string
): Promise<void> {
  // Write member record + user doc
  await setDoc(doc(db, "families", invitation.familyId, "members", uid), {
    uid,
    displayName,
    email: invitation.email,
    role: invitation.role,
    joinedAt: serverTimestamp(),
  });
  await setDoc(
    doc(db, "users", uid),
    { familyId: invitation.familyId, role: invitation.role },
    { merge: true }
  );
  // Delete invitation after acceptance
  await deleteDoc(doc(db, "invitations", invitation.id));
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await deleteDoc(doc(db, "invitations", invitationId));
}

export async function getFamilyPendingInvitations(
  familyId: string
): Promise<Invitation[]> {
  const snap = await getDocs(
    query(
      collection(db, "invitations"),
      where("familyId", "==", familyId)
    )
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Invitation, "id">),
  }));
}
