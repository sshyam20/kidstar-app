import React, { useLayoutEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useJournal } from "../hooks/useJournal";
import { deleteJournalEntry } from "../services/journal";
import { useFamilyId, useRole } from "../context/FamilyContext";
import { JournalEntry, MoodTag } from "../types";
import SwipeableRow from "../components/SwipeableRow";

type Props = NativeStackScreenProps<RootStackParamList, "Journal">;

const MOOD_META: Record<MoodTag, { emoji: string; label: string; color: string }> = {
  positive: { emoji: "😊", label: "Positive", color: "#10B981" },
  neutral: { emoji: "😐", label: "Neutral", color: "#F59E0B" },
  "needs-work": { emoji: "💪", label: "Needs Work", color: "#EF4444" },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function JournalScreen({ navigation, route }: Props): React.ReactElement {
  const { kidId, kidName } = route.params;
  const familyId = useFamilyId();
  const role = useRole();
  const { entries, loading } = useJournal(kidId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${kidName}'s Journal`,
      headerRight:
        role === "parent"
          ? () => (
              <TouchableOpacity
                onPress={() => navigation.navigate("AddJournalEntry", { kidId })}
                style={styles.headerBtn}
              >
                <Text style={styles.headerBtnText}>+ Add</Text>
              </TouchableOpacity>
            )
          : undefined,
    });
  }, [navigation, kidName, kidId, role]);

  function confirmDelete(entry: JournalEntry): void {
    Alert.alert("Delete Entry", `Delete "${entry.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteJournalEntry(familyId, kidId, entry.id),
      },
    ]);
  }

  function renderItem({ item }: { item: JournalEntry }): React.ReactElement {
    const mood = MOOD_META[item.moodTag];
    const row = (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          role === "parent"
            ? navigation.navigate("AddJournalEntry", { kidId, entryId: item.id })
            : undefined
        }
        style={styles.card}
      >
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.photo} />
        ) : null}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
            <View style={[styles.moodBadge, { backgroundColor: mood.color + "20" }]}>
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
            </View>
          </View>
          <Text style={styles.entryTitle}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.entryDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );

    if (role === "parent") {
      return <SwipeableRow onDelete={() => confirmDelete(item)}>{row}</SwipeableRow>;
    }
    return row;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📓</Text>
              <Text style={styles.empty}>
                {role === "parent"
                  ? `No journal entries yet.\nTap "+ Add" to write the first one.`
                  : "No journal entries yet."}
              </Text>
            </View>
          )
        }
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  headerBtn: { paddingHorizontal: SPACING.sm },
  headerBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 15 },
  list: { padding: SPACING.md, gap: SPACING.sm },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: SPACING.sm,
  },
  photo: { width: "100%", height: 180, resizeMode: "cover" },
  cardContent: { padding: SPACING.md, gap: SPACING.xs },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryDate: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  moodEmoji: { fontSize: 13 },
  moodLabel: { fontSize: 12, fontWeight: "700" },
  entryTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  entryDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  emptyWrap: { alignItems: "center", marginTop: SPACING.xxl, gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  empty: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
