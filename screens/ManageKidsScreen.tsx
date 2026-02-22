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
import { useKids } from "../hooks/useKids";
import { deleteKid } from "../services/kids";
import { Kid } from "../types";
import SwipeableRow from "../components/SwipeableRow";

type Props = NativeStackScreenProps<RootStackParamList, "ManageKids">;

export default function ManageKidsScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const { kids, loading } = useKids();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate("AddKid")}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  function confirmDelete(kid: Kid): void {
    Alert.alert(
      "Remove Hero",
      `Remove ${kid.name} from your family? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteKid(familyId, kid.id),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={kids}
        keyExtractor={(k) => k.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <Text style={styles.empty}>No heroes yet. Tap "+ Add" to start.</Text>
          )
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => confirmDelete(item)}>
            <View style={[styles.row, { shadowColor: item.color }]}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.pts}>⭐ {item.totalPoints} total pts</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Journal", {
                    kidId: item.id,
                    kidName: item.name,
                  })
                }
                style={styles.journalBtn}
              >
                <Text style={styles.journalBtnText}>📓 Journal</Text>
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
    borderRadius: 16,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  pts: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  journalBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.accent + "18",
  },
  journalBtnText: { color: COLORS.accent, fontWeight: "600", fontSize: 13 },
  empty: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: SPACING.xxl,
    fontSize: 15,
  },
});
