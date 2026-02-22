import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { createFamily, seedFamilyDefaults } from "../services/family";
import { useAuth } from "../hooks/useAuth";

type Props = NativeStackScreenProps<RootStackParamList, "CreateFamily">;

export default function CreateFamilyScreen({ navigation }: Props): React.ReactElement {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a family name.");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const familyId = await createFamily(
        user.uid,
        trimmed,
        user.displayName ?? "",
        user.email ?? ""
      );
      // Seed default activities and rewards in the background
      seedFamilyDefaults(familyId).catch(() => {/* ignore seed errors */});
      // Routing switches automatically via useAppState reactive subscription
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create family."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>🏠⭐</Text>
          <Text style={styles.title}>Create Your Family</Text>
          <Text style={styles.subtitle}>
            Give your family a fun name to get started — chores, activities, and rewards will be ready to go!
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Smiths ⭐"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>
        <View style={styles.footer}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Setting up your family…</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, !name.trim() && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonText}>Create Family 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.joinLink}
                onPress={() => navigation.navigate("JoinFamily")}
              >
                <Text style={styles.joinLinkText}>
                  Already have a family? Join with a code
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1, paddingHorizontal: SPACING.lg },
  content: { flex: 1, justifyContent: "center" },
  icon: { fontSize: 52, textAlign: "center", marginBottom: SPACING.sm },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 17,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  footer: { paddingBottom: SPACING.xxl },
  loadingWrap: { alignItems: "center", gap: SPACING.sm },
  loadingText: { color: COLORS.textSecondary, fontSize: 15 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.md,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.4, shadowOpacity: 0 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  joinLink: { marginTop: SPACING.md, alignItems: "center", paddingVertical: SPACING.sm },
  joinLinkText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
});
