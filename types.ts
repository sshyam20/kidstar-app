import { Timestamp } from "firebase/firestore";

export interface Family {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Kid {
  id: string;
  name: string;
  emoji: string;
  color: string;
  photoUrl?: string;
  availablePoints: number;
  totalPoints: number;
  streak?: number;
  lastCompletionDate?: string; // YYYY-MM-DD
  createdAt: Timestamp;
}

export interface Activity {
  id: string;
  title: string;
  emoji: string;
  category: ActivityCategory;
  points: number;
  createdAt: Timestamp;
}

export type ActivityCategory = "chore" | "homework" | "behavior" | "class";

export interface Completion {
  id: string;
  kidId: string;
  activityId: string;
  completedBy: string;
  points: number;
  date: string;
  createdAt: Timestamp;
}

export interface ClassSchedule {
  id: string;
  name: string;
  emoji: string;
  dayOfWeek: number; // 0=Sunday … 6=Saturday
  time: string; // "HH:MM" 24-hour
  kidIds: string[];
  createdAt: Timestamp;
}

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  pointCost: number;
  isPaused: boolean;
  createdAt: Timestamp;
}

export interface Redemption {
  id: string;
  kidId: string;
  rewardId: string;
  pointCost: number;
  redeemedBy: string;
  createdAt: Timestamp;
}

export type UserRole = "parent" | "kid";

export type MemberRole = "admin" | "parent";

export interface FamilyMembership {
  familyId: string;
  role: MemberRole;
  familyName: string;
}

export interface FamilyMember {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  joinedAt: Timestamp;
}

export interface Invitation {
  id: string;
  email: string;
  familyId: string;
  familyName: string;
  invitedBy: string;
  role: UserRole;
  createdAt: Timestamp;
}

export type MoodTag = "positive" | "neutral" | "needs-work";

export interface JournalEntry {
  id: string;
  kidId: string;
  title: string;
  description: string;
  moodTag: MoodTag;
  date: string;
  photoUrl?: string;
  createdAt: Timestamp;
}

// Input types (omit server-generated fields)
export type NewKid = Pick<Kid, "name" | "emoji" | "color">;
export type NewActivity = Pick<Activity, "title" | "emoji" | "category" | "points">;
export type NewCompletion = Pick<
  Completion,
  "kidId" | "activityId" | "completedBy" | "points" | "date"
>;
export type NewClass = Pick<
  ClassSchedule,
  "name" | "emoji" | "dayOfWeek" | "time" | "kidIds"
>;
export type NewReward = Pick<Reward, "title" | "emoji" | "pointCost" | "isPaused">;
export type NewRedemption = Pick<
  Redemption,
  "kidId" | "rewardId" | "pointCost" | "redeemedBy"
>;
export type NewJournalEntry = Pick<
  JournalEntry,
  "kidId" | "title" | "description" | "moodTag" | "date" | "photoUrl"
>;
