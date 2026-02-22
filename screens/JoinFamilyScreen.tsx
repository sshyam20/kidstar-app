import React, { useState, useEffect } from "react";
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
  FlatList,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useAuth } from "../hooks/useAuth";
import { joinFamilyByCode } from "../services/family";
import {
  getPendingInvitations,
  acceptInvitation,
} from "../services/invitations";
import { Invitation } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "JoinFamily">;

export default function JoinFamilyScreen({ navigation }: Props): React.ReactElement {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setInvitesLoading(false);
      return;
    }
    getPendingInvitations(user.email)
      .then(setInvitations)
      .catch(() => {/* ignore */})
      .finally(() => setInvitesLoading(false));
  }, [user?.email]);

  async function handleJoinByCode(): Promise<void> {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-character join code.");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await joinFamilyByCode(
        user.uid,
        trimmed,
        user.displayName ?? "",
        user.email ?? ""
      );
      // Reactive routing takes over automatically
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not join family.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptInvitation(inv: Invitation): Promise<void> {
    if (!user) return;
    setLoading(true);
    try {
      await acceptInvitation(inv, user.uid, user.displayName ?? "");
      // Reactive routing takes over
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not accept invitation.");
    } finally {
      setLoading(false);
    }
  }

  const showInvitations = !invitesLoading && invitations.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Join a Family</Text>
          <Text style={styles.subtitle}>
            Enter your family's 6-character join code
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. AB3KX7"
            placeholderTextColor={COLORS.textSecondary}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleJoinByCode}
          />

          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={styles.loader}
            />
          ) : (
            <TouchableOpacity
              style={[styles.button, code.trim().length !== 6 && styles.buttonDisabled]}
              onPress={handleJoinByCode}
              disabled={code.trim().length !== 6}
            >
              <Text style={styles.buttonText}>Join Family</Text>
            </TouchableOpacity>
          )}

          {showInvitations && (
            <View style={styles.invitesSection}>
              <Text style={styles.invitesTitle}>Pending Invitations</Text>
              <FlatList
                data={invitations}
                keyExtractor={(i) => i.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.inviteCard}>
                    <View style={styles.inviteInfo}>
                      <Text style={styles.inviteFamilyName}>{item.familyName}</Text>
                      <Text style={styles.inviteRole}>Role: {item.role}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptInvitation(item)}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          )}

          {invitesLoading && (
            <ActivityIndicator size="small" color={COLORS.textSecondary} style={styles.loader} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1, paddingHorizontal: SPACING.lg },
  header: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: "600" },
  content: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 20,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  loader: { marginVertical: SPACING.md },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  invitesSection: { marginTop: SPACING.lg },
  invitesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  inviteInfo: { flex: 1 },
  inviteFamilyName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  inviteRole: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  acceptBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  acceptBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
