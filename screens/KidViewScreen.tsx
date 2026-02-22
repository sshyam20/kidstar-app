import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS, SPACING } from "../constants";
import { useFamilyId, useKidId } from "../context/FamilyContext";
import { useActivities } from "../hooks/useActivities";
import { useTodayCompletions } from "../hooks/useTodayCompletions";
import { useClasses } from "../hooks/useClasses";
import { useAuth } from "../hooks/useAuth";
import { signOut } from "../services/auth";
import { db } from "../services/firebase";
import { Kid, ClassSchedule } from "../types";
import { RootStackParamList } from "../constants/navigation";
import KidAvatar from "../components/KidAvatar";

type Props = NativeStackScreenProps<RootStackParamList, "KidView">;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function KidViewScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const kidId = useKidId();
  const { user } = useAuth();
  const { activities } = useActivities();
  const { completedSet } = useTodayCompletions();
  const { classes } = useClasses();
  const [kid, setKid] = useState<Kid | null>(null);

  // Subscribe to kid profile for real-time points updates
  useEffect(() => {
    if (!kidId) return;
    return onSnapshot(
      doc(db, "families", familyId, "kids", kidId),
      (snap) => {
        if (snap.exists()) {
          setKid({ id: snap.id, ...(snap.data() as Omit<Kid, "id">) });
        }
      }
    );
  }, [familyId, kidId]);

  // Also handle case where kidId comes from the user's Firestore doc
  useEffect(() => {
    if (kidId || !user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const resolvedKidId = snap.data()?.kidId as string | undefined;
      if (!resolvedKidId) return;
      onSnapshot(
        doc(db, "families", familyId, "kids", resolvedKidId),
        (kidSnap) => {
          if (kidSnap.exists()) {
            setKid({ id: kidSnap.id, ...(kidSnap.data() as Omit<Kid, "id">) });
          }
        }
      );
    });
  }, [familyId, kidId, user]);

  const todayDow = new Date().getDay();
  const todayClasses: ClassSchedule[] = classes
    .filter((c) => c.dayOfWeek === todayDow && kid && c.kidIds.includes(kid.id))
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedToday = kid
    ? activities.filter((a) => completedSet.has(`${kid.id}:${a.id}`)).length
    : 0;

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
    } catch {
      Alert.alert("Error", "Could not sign out.");
    }
  }

  if (!kid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.loadingEmoji}>🦸</Text>
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: kid.color + "30" }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.bigAvatarWrap}>
            <KidAvatar emoji={kid.emoji} color={kid.color} photoUrl={kid.photoUrl} size={100} />
          </View>
          <Text style={styles.kidName}>{kid.name}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsLabel}>⭐</Text>
            <Text style={styles.pointsValue}>{kid.availablePoints}</Text>
            <Text style={styles.pointsUnit}>stars</Text>
          </View>
          <Text style={styles.totalPts}>
            {kid.totalPoints} stars earned total
          </Text>
        </View>

        {/* Journal button */}
        <TouchableOpacity
          style={styles.journalBtn}
          onPress={() =>
            navigation.navigate("Journal", {
              kidId: kid.id,
              kidName: kid.name,
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.journalBtnText}>📓 My Journal</Text>
        </TouchableOpacity>

        {/* Today's progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hero Journey</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      activities.length > 0
                        ? `${(completedToday / activities.length) * 100}%`
                        : "0%",
                    backgroundColor: kid.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {completedToday}/{activities.length}
            </Text>
          </View>
        </View>

        {/* Today's classes */}
        {todayClasses.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Skill Academy — {DAYS[todayDow]}
            </Text>
            {todayClasses.map((cls) => (
              <View key={cls.id} style={styles.classRow}>
                <Text style={styles.classEmoji}>{cls.emoji}</Text>
                <View>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classTime}>{formatTime(cls.time)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Activities */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚡ My Missions</Text>
          {activities.length === 0 ? (
            <Text style={styles.emptyText}>No missions yet.</Text>
          ) : (
            activities.map((activity) => {
              const done = completedSet.has(`${kid.id}:${activity.id}`);
              return (
                <View
                  key={activity.id}
                  style={[styles.activityRow, done && styles.activityRowDone]}
                >
                  <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                  <Text
                    style={[
                      styles.activityTitle,
                      done && styles.activityTitleDone,
                    ]}
                  >
                    {activity.title}
                  </Text>
                  {done ? (
                    <Text style={styles.doneCheck}>✓</Text>
                  ) : (
                    <Text style={styles.activityPts}>+{activity.points}⭐</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.sm },
  loadingEmoji: { fontSize: 48 },
  loadingText: { color: COLORS.textSecondary, fontSize: 16 },
  scroll: { padding: SPACING.lg, gap: SPACING.md },
  header: { alignItems: "center", paddingVertical: SPACING.lg, gap: SPACING.sm },
  bigAvatarWrap: {
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  kidName: { fontSize: 30, fontWeight: "800", color: COLORS.text },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  pointsLabel: { fontSize: 18 },
  pointsValue: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  pointsUnit: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
  totalPts: { fontSize: 13, color: COLORS.textSecondary },
  journalBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: SPACING.sm + 2,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  journalBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  progressRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%" as const, borderRadius: 5 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  classRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  classEmoji: { fontSize: 22 },
  className: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  classTime: { fontSize: 12, color: COLORS.textSecondary },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  activityRowDone: { opacity: 0.5 },
  activityEmoji: { fontSize: 22, width: 30, textAlign: "center" },
  activityTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.text },
  activityTitleDone: { textDecorationLine: "line-through", color: COLORS.textSecondary },
  activityPts: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
  doneCheck: { fontSize: 16, color: COLORS.success, fontWeight: "700" },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  signOutBtn: { alignItems: "center", paddingVertical: SPACING.md },
  signOutText: { fontSize: 15, color: COLORS.error, fontWeight: "600" },
});
