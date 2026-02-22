import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Family, UserRole } from "../types";

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
  await setDoc(familyRef, {
    name,
    joinCode: generateJoinCode(),
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
  // Write creator as first member (role: parent)
  await setDoc(doc(db, "families", familyRef.id, "members", userId), {
    uid: userId,
    displayName,
    email,
    role: "parent",
    joinedAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", userId), {
    familyId: familyRef.id,
    role: "parent",
  }, { merge: true });
  return familyRef.id;
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

  await setDoc(doc(db, "families", familyId, "members", userId), {
    uid: userId,
    displayName,
    email,
    role,
    joinedAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", userId), {
    familyId,
    role,
  }, { merge: true });

  return familyId;
}

export async function getUserFamilyId(userId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return (snap.data().familyId as string) ?? null;
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Family;
}
