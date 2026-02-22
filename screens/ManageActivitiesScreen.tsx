import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
} from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ParentTabParamList, RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import { useActivities } from "../hooks/useActivities";
import { deleteActivity } from "../services/activities";
import { getCategoryMeta } from "../constants/categories";
import { Activity } from "../types";
import SwipeableRow from "../components/SwipeableRow";

type Props = CompositeScreenProps<
  BottomTabScreenProps<ParentTabParamList, "Missions">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ManageActivitiesScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const { activities, loading } = useActivities();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Missions",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("AddActivity", {})}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  function confirmDelete(activity: Activity): void {
    Alert.alert("Delete Mission", `Delete "${activity.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteActivity(familyId, activity.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>No missions yet. Tap "+ Add" to create one.</Text>
          )
        }
        renderItem={({ item }) => {
          const cat = getCategoryMeta(item.category);
          return (
            <SwipeableRow onDelete={() => confirmDelete(item)}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: cat.color }]}>
                    <Text style={styles.badgeText}>{cat.emoji} {cat.label}</Text>
                  </View>
                </View>
                <Text style={styles.pts}>+{item.points}⭐</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AddActivity", { activityId: item.id })}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
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
  list: { padding: SPACING.md },
  row: {
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
  emoji: { fontSize: 24, width: 36, textAlign: "center" },
  info: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: "500", color: COLORS.text },
  pts: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  editBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "18",
  },
  editBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },
  empty: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
    fontSize: 15,
  },
});
