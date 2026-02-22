import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Activity } from "../types";
import { COLORS, SPACING } from "../constants";
import { moderateScale } from "../constants/layout";
import { getCategoryMeta } from "../constants/categories";

interface Props {
  activity: Activity;
  isCompleted: boolean;
  onPress: (activity: Activity) => void;
}

export default function ActivityItem({
  activity,
  isCompleted,
  onPress,
}: Props): React.ReactElement {
  const cat = getCategoryMeta(activity.category);

  return (
    <TouchableOpacity
      onPress={() => !isCompleted && onPress(activity)}
      disabled={isCompleted}
      style={[styles.row, isCompleted && styles.rowDone]}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{activity.emoji}</Text>

      <View style={styles.info}>
        <Text style={[styles.title, isCompleted && styles.titleDone]}>
          {activity.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: cat.color }]}>
          <Text style={styles.badgeText}>
            {cat.emoji} {cat.label}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {isCompleted ? (
          <Text style={styles.check}>✓</Text>
        ) : (
          <Text style={styles.pts}>+{activity.points}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowDone: {
    opacity: 0.45,
  },
  emoji: {
    fontSize: 28,
    width: 38,
    textAlign: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "600",
    color: COLORS.text,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: COLORS.text,
  },
  right: {
    minWidth: 36,
    alignItems: "flex-end",
  },
  pts: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: COLORS.primary,
  },
  check: {
    fontSize: moderateScale(20),
    color: COLORS.success,
    fontWeight: "700",
  },
});
