import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { NewCompletion } from "../types";

export interface CompletionResult {
  luckyBonus: number;
  streakBonus: number;
  newStreak: number;
  leveledUp: boolean;
  newTotal: number;
}

export function getTodayDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function recordCompletion(
  familyId: string,
  data: NewCompletion
): Promise<CompletionResult> {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // Compute lucky bonus client-side (1 in 5 chance, 2–5 stars)
  const luckyBonus = Math.random() < 0.2 ? Math.floor(Math.random() * 4) + 2 : 0;

  const result: CompletionResult = {
    luckyBonus,
    streakBonus: 0,
    newStreak: 1,
    leveledUp: false,
    newTotal: 0,
  };

  const kidRef = doc(db, "families", familyId, "kids", data.kidId);
  const completionRef = doc(collection(db, "families", familyId, "completions"));

  await runTransaction(db, async (transaction) => {
    const kidSnap = await transaction.get(kidRef);
    const kidData = kidSnap.data() ?? {};

    const lastDate = (kidData.lastCompletionDate as string | undefined) ?? null;
    const currentStreak = (kidData.streak as number | undefined) ?? 0;
    const currentTotal = (kidData.totalPoints as number | undefined) ?? 0;

    // Compute new streak
    const streakUpdate: Record<string, unknown> = {};
    if (lastDate === today) {
      // Already completed a mission today — don't increment streak again
      result.newStreak = currentStreak;
    } else if (lastDate === yesterday) {
      result.newStreak = currentStreak + 1;
      streakUpdate.streak = result.newStreak;
      streakUpdate.lastCompletionDate = today;
    } else {
      // Streak broken or first completion ever
      result.newStreak = 1;
      streakUpdate.streak = 1;
      streakUpdate.lastCompletionDate = today;
    }

    // Streak milestone bonuses
    if (result.newStreak === 7) result.streakBonus = 10;
    else if (result.newStreak === 30) result.streakBonus = 50;

    const totalAwarded = data.points + result.luckyBonus + result.streakBonus;
    result.newTotal = currentTotal + totalAwarded;

    // Level-up detection (every 100 stars)
    const oldMilestone = Math.floor(currentTotal / 100);
    const newMilestone = Math.floor(result.newTotal / 100);
    result.leveledUp = newMilestone > oldMilestone;

    transaction.set(completionRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    transaction.update(kidRef, {
      availablePoints: increment(totalAwarded),
      totalPoints: increment(totalAwarded),
      ...streakUpdate,
    });
  });

  return result;
}
