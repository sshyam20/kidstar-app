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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import { useClasses } from "../hooks/useClasses";
import { deleteClass } from "../services/classes";
import { ClassSchedule } from "../types";
import SwipeableRow from "../components/SwipeableRow";

type Props = NativeStackScreenProps<RootStackParamList, "ManageClasses">;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function ManageClassesScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const { classes, loading } = useClasses();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("AddClass", {})}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  function confirmDelete(cls: ClassSchedule): void {
    Alert.alert("Delete Class", `Delete "${cls.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteClass(familyId, cls.id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={classes}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>No classes yet. Tap "+ Add" to schedule one.</Text>
          )
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => confirmDelete(item)}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.detail}>
                  {DAYS[item.dayOfWeek]} · {formatTime(item.time)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("AddClass", { classId: item.id })}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </SwipeableRow>
        )}
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
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  detail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
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
