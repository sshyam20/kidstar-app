import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Kid } from "../types";
import { COLORS, SPACING } from "../constants";
import { scale, moderateScale } from "../constants/layout";
import ProgressBar from "./ProgressBar";

interface Props {
  kid: Kid;
  isSelected: boolean;
  completedCount: number;
  totalActivities: number;
  todayClassCount?: number;
  onPress: (kid: Kid) => void;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function KidCard({
  kid,
  isSelected,
  completedCount,
  totalActivities,
  todayClassCount = 0,
  onPress,
}: Props): React.ReactElement {
  const progress = totalActivities > 0 ? completedCount / totalActivities : 0;
  const progressPct = Math.round(progress * 100);

  // Effective streak: show 0 if last completion wasn't today or yesterday
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  const lastDate = kid.lastCompletionDate ?? null;
  const effectiveStreak =
    (lastDate === today || lastDate === yesterday) ? (kid.streak ?? 0) : 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(kid)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        { shadowColor: kid.color },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, { backgroundColor: kid.color }]}>
        <Text style={styles.avatarEmoji}>{kid.emoji}</Text>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {kid.name}
      </Text>

      <View style={styles.pointsRow}>
        <Text style={styles.pointsStar}>⭐</Text>
        <Text style={styles.points}>{kid.totalPoints}</Text>
      </View>

      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} height={5} color={isSelected ? COLORS.primary : kid.color} />
        <Text style={styles.progressLabel}>{progressPct}%</Text>
      </View>

      <Text style={styles.sub}>
        {completedCount}/{totalActivities} today
      </Text>

      {effectiveStreak > 0 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {effectiveStreak}</Text>
        </View>
      )}

      {todayClassCount > 0 && (
        <View style={styles.classBadge}>
          <Text style={styles.classes}>
            🎓 {todayClassCount} class{todayClassCount !== 1 ? "es" : ""}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const CARD_W = scale(120);
const AVATAR_W = scale(62);

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    padding: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
    alignItems: "center",
    gap: 5,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  avatar: {
    width: AVATAR_W,
    height: AVATAR_W,
    borderRadius: AVATAR_W / 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarEmoji: { fontSize: moderateScale(32) },
  name: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  pointsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pointsStar: { fontSize: 12 },
  points: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: COLORS.text,
  },
  progressWrap: {
    width: "100%",
    gap: 3,
    alignItems: "stretch",
  },
  progressLabel: {
    fontSize: moderateScale(10),
    color: COLORS.textSecondary,
    textAlign: "right",
    fontWeight: "600",
  },
  sub: { fontSize: moderateScale(10), color: COLORS.textSecondary },
  streakBadge: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streakText: { fontSize: moderateScale(10), fontWeight: "700", color: "#E65100" },
  classBadge: {
    backgroundColor: COLORS.purple + "15",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  classes: { fontSize: moderateScale(10), color: COLORS.purple, fontWeight: "700" },
});
