import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ParentTabParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import { useKids } from "../hooks/useKids";
import { useActivities } from "../hooks/useActivities";
import { useTodayCompletions } from "../hooks/useTodayCompletions";
import { useClasses } from "../hooks/useClasses";
import { useAuth } from "../hooks/useAuth";
import { recordCompletion, getTodayDate } from "../services/completions";
import { signOut } from "../services/auth";
import KidCard from "../components/KidCard";
import ActivityItem from "../components/ActivityItem";
import SparkleOverlay from "../components/SparkleOverlay";
import LevelUpModal from "../components/LevelUpModal";
import { useToast } from "../context/ToastContext";
import { Activity, Kid, ClassSchedule } from "../types";

type Props = BottomTabScreenProps<ParentTabParamList, "Home">;

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function DashboardScreen({ navigation }: Props): React.ReactElement {
  const { user } = useAuth();
  const familyId = useFamilyId();
  const { showToast } = useToast();
  const { kids } = useKids();
  const { activities } = useActivities();
  const { completedSet } = useTodayCompletions();
  const { classes } = useClasses();
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [sparkleVisible, setSparkleVisible] = useState(false);
  const [levelUpMilestone, setLevelUpMilestone] = useState<number | null>(null);

  const selectedKid: Kid | null =
    kids.find((k) => k.id === selectedKidId) ?? kids[0] ?? null;

  const todayDow = new Date().getDay();

  function getKidCompletedCount(kidId: string): number {
    return activities.filter((a) => completedSet.has(`${kidId}:${a.id}`)).length;
  }

  function getKidTodayClasses(kidId: string): ClassSchedule[] {
    return classes
      .filter((c) => c.dayOfWeek === todayDow && c.kidIds.includes(kidId))
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  const selectedKidTodayClasses = selectedKid
    ? getKidTodayClasses(selectedKid.id)
    : [];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "KidStar ⭐",
    });
  }, [navigation]);

  async function handleActivityPress(activity: Activity): Promise<void> {
    if (!selectedKid || !user) return;
    const key = `${selectedKid.id}:${activity.id}`;
    if (completedSet.has(key)) return;

    try {
      const result = await recordCompletion(familyId, {
        kidId: selectedKid.id,
        activityId: activity.id,
        completedBy: user.uid,
        points: activity.points,
        date: getTodayDate(),
      });

      setSparkleVisible(true);
      showToast(`${selectedKid.name} earned ${activity.points}⭐ Mission Complete!`);

      if (result.luckyBonus > 0) {
        setTimeout(() => showToast(`Lucky Star! +${result.luckyBonus}⭐ bonus!`), 800);
      }
      if (result.streakBonus > 0) {
        setTimeout(
          () => showToast(`🔥 ${result.newStreak}-day streak! +${result.streakBonus}⭐ bonus!`),
          1600
        );
      }
      if (result.leveledUp) {
        const milestone = Math.floor(result.newTotal / 100) * 100;
        setTimeout(() => setLevelUpMilestone(milestone), 2000);
      }
    } catch {
      Alert.alert("Error", "Could not record completion. Please try again.");
    }
  }

  async function handleSignOut(): Promise<void> {
    try {
      await signOut();
    } catch {
      Alert.alert("Error", "Could not sign out.");
    }
  }

  const ListHeader = (
    <View>
      {/* Kid cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kidsRow}
      >
        {kids.map((kid) => (
          <KidCard
            key={kid.id}
            kid={kid}
            isSelected={kid.id === selectedKid?.id}
            completedCount={getKidCompletedCount(kid.id)}
            totalActivities={activities.length}
            todayClassCount={getKidTodayClasses(kid.id).length}
            onPress={(k: Kid) => setSelectedKidId(k.id)}
          />
        ))}
        {kids.length === 0 && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Missions")}
            style={styles.addKidPrompt}
          >
            <Text style={styles.addKidPromptEmoji}>👨‍👩‍👧</Text>
            <Text style={styles.addKidPromptText}>Go to Family tab to add heroes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Today's classes */}
      {selectedKidTodayClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Skill Academy Today</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classesRow}
          >
            {selectedKidTodayClasses.map((cls) => (
              <View key={cls.id} style={styles.classChip}>
                <Text style={styles.classEmoji}>{cls.emoji}</Text>
                <View>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classTime}>{formatTime(cls.time)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Missions header */}
      <View style={styles.activitiesHeader}>
        <Text style={styles.sectionTitle}>
          {selectedKid ? `⚡ ${selectedKid.name}'s Missions` : "⚡ Missions"}
        </Text>
        {selectedKid && (
          <View style={styles.progressPill}>
            <Text style={styles.progressPillText}>
              {getKidCompletedCount(selectedKid.id)}/{activities.length} done
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ActivityItem
            activity={item}
            isCompleted={
              selectedKid ? completedSet.has(`${selectedKid.id}:${item.id}`) : false
            }
            onPress={handleActivityPress}
          />
        )}
        ListEmptyComponent={
          <TouchableOpacity
            onPress={() => navigation.navigate("Missions")}
            style={styles.emptyActivities}
          >
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyActivitiesText}>
              No missions yet — tap Missions tab to set some up
            </Text>
          </TouchableOpacity>
        }
        ListFooterComponent={
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        }
      />

      <SparkleOverlay
        visible={sparkleVisible}
        onDone={() => setSparkleVisible(false)}
      />

      <LevelUpModal
        visible={levelUpMilestone !== null}
        milestone={levelUpMilestone ?? 0}
        onDismiss={() => setLevelUpMilestone(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingBottom: SPACING.xxl },
  kidsRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  addKidPrompt: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary + "40",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 180,
    gap: SPACING.xs,
  },
  addKidPromptEmoji: { fontSize: 28 },
  addKidPromptText: { color: COLORS.primary, fontWeight: "600", fontSize: 13, textAlign: "center" },
  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  classesRow: { gap: SPACING.sm },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.purple,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  classEmoji: { fontSize: 22 },
  className: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  classTime: { fontSize: 11, color: COLORS.textSecondary },
  activitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  progressPill: {
    backgroundColor: COLORS.primary + "15",
    borderRadius: 99,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  progressPillText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  emptyActivities: {
    marginHorizontal: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    alignItems: "center",
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { fontSize: 36 },
  emptyActivitiesText: { color: COLORS.textSecondary, fontSize: 15, textAlign: "center" },
  signOutBtn: { alignItems: "center", paddingVertical: SPACING.lg },
  signOutText: { fontSize: 14, color: COLORS.textSecondary },
});
