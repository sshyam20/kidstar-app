import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Family, FamilyMembership, MemberRole, UserRole } from "../types";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createFamily(
  userId: string,
  name: string,
  displayName: string = "",
  email: string = ""
): Promise<string> {
  const familyRef = doc(collection(db, "families"));
  const fid = familyRef.id;
  const batch = writeBatch(db);

  batch.set(familyRef, {
    name,
    joinCode: generateJoinCode(),
    ownerId: userId,
    createdAt: serverTimestamp(),
  });

  // Creator is admin of this family
  batch.set(doc(db, "families", fid, "members", userId), {
    uid: userId,
    displayName,
    email,
    role: "parent" as UserRole, // UserRole for app-access type
    joinedAt: serverTimestamp(),
  });

  // Read existing families array to append (preserve existing memberships)
  const userSnap = await getDoc(doc(db, "users", userId));
  const existing: FamilyMembership[] = (userSnap.data()?.families as FamilyMembership[]) ?? [];
  const newMembership: FamilyMembership = { familyId: fid, role: "admin", familyName: name };
  const updatedFamilies = [...existing.filter((f) => f.familyId !== fid), newMembership];

  batch.set(doc(db, "users", userId), {
    familyId: fid,         // legacy + active
    role: "parent",
    activeFamilyId: fid,
    families: updatedFamilies,
  }, { merge: true });

  await batch.commit();
  return fid;
}

export async function seedFamilyDefaults(familyId: string): Promise<void> {
  const activitiesCol = collection(db, "families", familyId, "activities");
  const rewardsCol = collection(db, "families", familyId, "rewards");

  const defaultActivities = [
    // Chores
    { title: "Make bed", emoji: "🛏️", category: "chore", points: 5 },
    { title: "Set the table", emoji: "🍽️", category: "chore", points: 5 },
    { title: "Clear the table", emoji: "🧹", category: "chore", points: 5 },
    { title: "Unload the dishwasher", emoji: "🫧", category: "chore", points: 8 },
    { title: "Vacuum the living room", emoji: "🌀", category: "chore", points: 10 },
    { title: "Take out trash", emoji: "🗑️", category: "chore", points: 8 },
    { title: "Feed the pet", emoji: "🐾", category: "chore", points: 5 },
    { title: "Tidy bedroom", emoji: "🧸", category: "chore", points: 8 },
    { title: "Put laundry away", emoji: "👕", category: "chore", points: 8 },
    { title: "Water the plants", emoji: "🌿", category: "chore", points: 5 },
    { title: "Help with grocery shopping", emoji: "🛒", category: "chore", points: 10 },
    // Homework / Learning
    { title: "Do homework", emoji: "✏️", category: "homework", points: 10 },
    { title: "Read for 20 minutes", emoji: "📖", category: "homework", points: 8 },
    { title: "Practice instrument", emoji: "🎵", category: "homework", points: 12 },
    { title: "Study for a test", emoji: "🔬", category: "homework", points: 15 },
    { title: "Practice spelling words", emoji: "📚", category: "homework", points: 8 },
    { title: "Draw or create something", emoji: "🎨", category: "homework", points: 8 },
    // Behavior
    { title: "Be kind to siblings", emoji: "🤗", category: "behavior", points: 8 },
    { title: "No screen time complaints", emoji: "📵", category: "behavior", points: 10 },
    { title: "Brush teeth morning and night", emoji: "🦷", category: "behavior", points: 5 },
    { title: "Get ready on time with no reminders", emoji: "⏰", category: "behavior", points: 10 },
    { title: "Use good manners at dinner", emoji: "🙏", category: "behavior", points: 5 },
    { title: "Help a family member without being asked", emoji: "💪", category: "behavior", points: 12 },
    { title: "No arguing at bedtime", emoji: "🌙", category: "behavior", points: 8 },
  ];

  const defaultRewards = [
    { title: "Extra screen time 30 min", emoji: "📱", pointCost: 20, isPaused: false },
    { title: "Choose dinner", emoji: "🍕", pointCost: 30, isPaused: false },
    { title: "Stay up 30 min late", emoji: "🌟", pointCost: 25, isPaused: false },
    { title: "Movie night pick", emoji: "🎬", pointCost: 40, isPaused: false },
    { title: "Trip to ice cream shop", emoji: "🍦", pointCost: 60, isPaused: false },
    { title: "Skip one chore", emoji: "🙌", pointCost: 35, isPaused: false },
    { title: "Friend sleepover", emoji: "🏕️", pointCost: 80, isPaused: false },
    { title: "Choose a family activity", emoji: "🎡", pointCost: 50, isPaused: false },
    { title: "New book or small toy", emoji: "🎁", pointCost: 70, isPaused: false },
    { title: "Special one-on-one time with parent", emoji: "❤️", pointCost: 40, isPaused: false },
  ];

  const activityWrites = defaultActivities.map((a) =>
    addDoc(activitiesCol, { ...a, createdAt: serverTimestamp() })
  );
  const rewardWrites = defaultRewards.map((r) =>
    addDoc(rewardsCol, { ...r, createdAt: serverTimestamp() })
  );

  await Promise.all([...activityWrites, ...rewardWrites]);
}

export async function joinFamilyByCode(
  userId: string,
  joinCode: string,
  displayName: string,
  email: string,
  role: UserRole = "parent"
): Promise<string> {
  const q = query(
    collection(db, "families"),
    where("joinCode", "==", joinCode.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("No family found with that join code.");
  }
  const familyDoc = snap.docs[0];
  const familyId = familyDoc.id;
  const familyName = (familyDoc.data().name as string) || "";

  // Read current user families to avoid duplicates
  const userSnap = await getDoc(doc(db, "users", userId));
  const existingFamilies: FamilyMembership[] = (userSnap.data()?.families as FamilyMembership[]) ?? [];
  if (existingFamilies.some((f) => f.familyId === familyId)) {
    throw new Error("You're already a member of this family.");
  }

  const newMembership: FamilyMembership = { familyId, role: "parent", familyName };
  const updatedFamilies = [...existingFamilies, newMembership];

  const batch = writeBatch(db);
  batch.set(doc(db, "families", familyId, "members", userId), {
    uid: userId,
    displayName,
    email,
    role,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, "users", userId), {
    familyId,
    role,
    activeFamilyId: familyId,
    families: updatedFamilies,
  }, { merge: true });

  await batch.commit();
  return familyId;
}

export async function switchActiveFamily(userId: string, familyId: string): Promise<void> {
  await updateDoc(doc(db, "users", userId), {
    activeFamilyId: familyId,
    familyId, // keep in sync for legacy/kid compat
  });
}

export async function leaveFamily(userId: string, familyId: string): Promise<void> {
  const userSnap = await getDoc(doc(db, "users", userId));
  const userData = userSnap.data();
  const existing: FamilyMembership[] = (userData?.families as FamilyMembership[]) ?? [];
  const updated = existing.filter((f) => f.familyId !== familyId);
  const newActive = updated.length > 0 ? updated[0].familyId : null;

  const batch = writeBatch(db);
  batch.delete(doc(db, "families", familyId, "members", userId));
  batch.update(doc(db, "users", userId), {
    families: updated,
    activeFamilyId: newActive,
    familyId: newActive,
  });
  await batch.commit();
}

export async function transferAdmin(
  familyId: string,
  fromUid: string,
  toUid: string
): Promise<void> {
  // Update family document's ownerId
  await updateDoc(doc(db, "families", familyId), { ownerId: toUid });

  // Update user docs' families arrays (change role for both)
  const [fromSnap, toSnap] = await Promise.all([
    getDoc(doc(db, "users", fromUid)),
    getDoc(doc(db, "users", toUid)),
  ]);

  function updateRole(families: FamilyMembership[], fid: string, newRole: MemberRole): FamilyMembership[] {
    return families.map((f) => f.familyId === fid ? { ...f, role: newRole } : f);
  }

  const fromFamilies = updateRole((fromSnap.data()?.families as FamilyMembership[]) ?? [], familyId, "parent");
  const toFamilies = updateRole((toSnap.data()?.families as FamilyMembership[]) ?? [], familyId, "admin");

  const batch = writeBatch(db);
  batch.update(doc(db, "users", fromUid), { families: fromFamilies });
  batch.update(doc(db, "users", toUid), { families: toFamilies });
  await batch.commit();
}

export async function deleteEntireFamily(familyId: string): Promise<void> {
  // Delete all kids and their journal subcollections first
  const kidsSnap = await getDocs(collection(db, "families", familyId, "kids"));
  for (const kidDoc of kidsSnap.docs) {
    const journalSnap = await getDocs(
      collection(db, "families", familyId, "kids", kidDoc.id, "journal")
    );
    if (journalSnap.docs.length > 0) {
      const jBatch = writeBatch(db);
      journalSnap.docs.forEach((d) => jBatch.delete(d.ref));
      await jBatch.commit();
    }
  }

  // Delete all other subcollections
  const subcollections = [
    "kids", "activities", "completions", "classes",
    "rewards", "redemptions", "members", "invitations",
  ];
  for (const subcol of subcollections) {
    const colSnap = await getDocs(collection(db, "families", familyId, subcol));
    if (colSnap.docs.length > 0) {
      const batch = writeBatch(db);
      colSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Delete the family document itself
  await deleteDoc(doc(db, "families", familyId));
}

export async function getUserFamilyId(userId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return ((snap.data().activeFamilyId ?? snap.data().familyId) as string) ?? null;
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}
