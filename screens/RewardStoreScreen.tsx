import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import { useKids } from "../hooks/useKids";
import { useRewards } from "../hooks/useRewards";
import { redeemReward, deleteReward, pauseReward } from "../services/rewards";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../context/ToastContext";
import { Kid, Reward } from "../types";
import SwipeableRow from "../components/SwipeableRow";

type Props = NativeStackScreenProps<RootStackParamList, "RewardStore">;

export default function RewardStoreScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const { kids } = useKids();
  const { rewards } = useRewards();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);

  const selectedKid: Kid | null =
    kids.find((k) => k.id === selectedKidId) ?? kids[0] ?? null;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("AddReward", {})}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  function handleRedeem(reward: Reward): void {
    if (!selectedKid || !user) return;
    if (reward.isPaused) {
      Alert.alert("Reward Paused", "This reward is currently paused by your parent.");
      return;
    }
    if (selectedKid.availablePoints < reward.pointCost) {
      Alert.alert(
        "Not enough points",
        `${selectedKid.name} has ${selectedKid.availablePoints} pts but needs ${reward.pointCost} pts.`
      );
      return;
    }

    Alert.alert(
      "Redeem Reward?",
      `Use ${reward.pointCost} pts to get "${reward.title}" for ${selectedKid.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem 🎉",
          onPress: async () => {
            try {
              await redeemReward(familyId, {
                kidId: selectedKid.id,
                rewardId: reward.id,
                pointCost: reward.pointCost,
                redeemedBy: user.uid,
              });
              showToast(`🎉 "${reward.title}" redeemed for ${selectedKid.name}!`);
            } catch {
              Alert.alert("Error", "Failed to redeem reward. Please try again.");
            }
          },
        },
      ]
    );
  }

  function handleTogglePause(reward: Reward): void {
    const next = !reward.isPaused;
    Alert.alert(
      next ? "Pause Reward?" : "Unpause Reward?",
      next
        ? `"${reward.title}" will be visible but kids cannot redeem it.`
        : `"${reward.title}" will be available for kids to redeem.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: next ? "Pause 🔒" : "Unpause ✅",
          onPress: async () => {
            await pauseReward(familyId, reward.id, next);
            showToast(next ? `"${reward.title}" paused` : `"${reward.title}" unpaused`);
          },
        },
      ]
    );
  }

  function confirmDelete(reward: Reward): void {
    Alert.alert("Delete Reward", `Delete "${reward.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteReward(familyId, reward.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Kid selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kidsRow}
      >
        {kids.map((kid) => {
          const isSelected = kid.id === selectedKid?.id;
          return (
            <TouchableOpacity
              key={kid.id}
              onPress={() => setSelectedKidId(kid.id)}
              style={[styles.kidChip, isSelected && styles.kidChipSelected]}
            >
              <View style={[styles.kidAvatar, { backgroundColor: kid.color }]}>
                <Text style={styles.kidEmoji}>{kid.emoji}</Text>
              </View>
              <View>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidPts}>
                  ⭐ {kid.availablePoints} available
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedKid && (
        <View style={styles.balanceBar}>
          <Text style={styles.balanceText}>
            {selectedKid.name}'s balance:{" "}
            <Text style={styles.balanceAmt}>
              ⭐ {selectedKid.availablePoints} pts
            </Text>
          </Text>
        </View>
      )}

      <FlatList
        data={rewards}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No rewards yet. Tap "+ Add" to create one.
          </Text>
        }
        renderItem={({ item }) => {
          const canAfford =
            selectedKid !== null &&
            selectedKid.availablePoints >= item.pointCost &&
            !item.isPaused;
          return (
            <SwipeableRow onDelete={() => confirmDelete(item)}>
              <View style={[styles.rewardRow, item.isPaused && styles.rewardRowPaused]}>
                <View style={styles.emojiWrap}>
                  <Text style={styles.rewardEmoji}>{item.emoji}</Text>
                  {item.isPaused && (
                    <View style={styles.pauseBadge}>
                      <Text style={styles.pauseIcon}>🔒</Text>
                    </View>
                  )}
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardTitle, item.isPaused && styles.rewardTitlePaused]}>
                    {item.title}
                  </Text>
                  <Text style={styles.rewardCost}>⭐ {item.pointCost} pts</Text>
                </View>
                <View style={styles.rewardActions}>
                  <TouchableOpacity
                    onPress={() => handleTogglePause(item)}
                    style={[styles.pauseBtn, item.isPaused && styles.pauseBtnActive]}
                  >
                    <Text style={styles.pauseBtnText}>
                      {item.isPaused ? "▶" : "⏸"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("AddReward", { rewardId: item.id })
                    }
                    style={styles.editBtn}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRedeem(item)}
                    disabled={!selectedKid || item.isPaused}
                    style={[
                      styles.redeemBtn,
                      (!canAfford || !selectedKid || item.isPaused) && styles.redeemBtnDisabled,
                    ]}
                  >
                    <Text style={styles.redeemBtnText}>
                      {item.isPaused ? "🔒" : "Redeem"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SwipeableRow>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBtn: { paddingHorizontal: SPACING.sm },
  headerBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },
  kidsRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  kidChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  kidChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "12",
  },
  kidAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  kidEmoji: { fontSize: 20 },
  kidName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  kidPts: { fontSize: 12, color: COLORS.textSecondary },
  balanceBar: {
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary + "12",
    borderRadius: 12,
    marginBottom: SPACING.xs,
  },
  balanceText: { fontSize: 14, color: COLORS.text },
  balanceAmt: { fontWeight: "700", color: COLORS.primary },
  list: { padding: SPACING.md },
  rewardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rewardRowPaused: { opacity: 0.6 },
  emojiWrap: { position: "relative", width: 44 },
  rewardEmoji: { fontSize: 28, textAlign: "center" },
  pauseBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
  },
  pauseIcon: { fontSize: 13 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  rewardTitlePaused: { color: COLORS.textSecondary },
  rewardCost: { fontSize: 13, color: COLORS.primary, fontWeight: "700", marginTop: 2 },
  rewardActions: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },
  pauseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  pauseBtnActive: { backgroundColor: COLORS.orange + "25" },
  pauseBtnText: { fontSize: 13 },
  editBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "18",
  },
  editBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  redeemBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.success,
  },
  redeemBtnDisabled: { backgroundColor: COLORS.border, opacity: 0.5 },
  redeemBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  empty: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
    fontSize: 15,
  },
});
