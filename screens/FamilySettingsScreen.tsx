import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import { useAuth } from "../hooks/useAuth";
import { useMembers } from "../hooks/useMembers";
import { getFamily } from "../services/family";
import { updateMemberRole, removeMember } from "../services/members";
import {
  sendInvitation,
  cancelInvitation,
  getFamilyPendingInvitations,
} from "../services/invitations";
import { useToast } from "../context/ToastContext";
import { Family, FamilyMember, Invitation, UserRole } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "FamilySettings">;

export default function FamilySettingsScreen({ navigation }: Props): React.ReactElement {
  const { user } = useAuth();
  const familyId = useFamilyId();
  const { showToast } = useToast();
  const { members, loading: membersLoading } = useMembers();

  const [family, setFamily] = useState<Family | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("parent");
  const [inviting, setInviting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "Family Settings" });
  }, [navigation]);

  useEffect(() => {
    getFamily(familyId).then(setFamily).catch(() => {/* ignore */});
    loadPendingInvites();
  }, [familyId]);

  async function loadPendingInvites(): Promise<void> {
    try {
      const invs = await getFamilyPendingInvitations(familyId);
      setPendingInvites(invs);
    } catch {/* ignore */}
  }

  async function handleCopyCode(): Promise<void> {
    if (!family) return;
    await Clipboard.setStringAsync(family.joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleInvite(): Promise<void> {
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (!family || !user) return;
    setInviting(true);
    try {
      await sendInvitation(familyId, family.name, user.uid, email, inviteRole);
      setInviteEmail("");
      await loadPendingInvites();
      showToast(`Invitation sent to ${email}`);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not send invitation.");
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvite(inv: Invitation): Promise<void> {
    Alert.alert(
      "Cancel invitation",
      `Remove invitation for ${inv.email}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await cancelInvitation(inv.id);
            await loadPendingInvites();
          },
        },
      ]
    );
  }

  async function handleChangeRole(member: FamilyMember, newRole: UserRole): Promise<void> {
    if (member.uid === family?.ownerId) {
      Alert.alert("Cannot change", "The family owner's role cannot be changed.");
      return;
    }
    try {
      await updateMemberRole(familyId, member.uid, newRole);
      showToast(`${member.displayName || "Member"} is now a ${newRole}`);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update role.");
    }
  }

  async function handleRemoveMember(member: FamilyMember): Promise<void> {
    if (member.uid === family?.ownerId) {
      Alert.alert("Cannot remove", "The family owner cannot be removed.");
      return;
    }
    if (member.uid === user?.uid) {
      Alert.alert("Cannot remove", "You cannot remove yourself. Sign out instead.");
      return;
    }
    Alert.alert(
      "Remove member",
      `Remove ${member.displayName || member.email} from your family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMember(familyId, member.uid);
            } catch (err: unknown) {
              Alert.alert("Error", err instanceof Error ? err.message : "Could not remove member.");
            }
          },
        },
      ]
    );
  }

  const isOwner = user?.uid === family?.ownerId;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Join code */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FAMILY JOIN CODE</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{family?.joinCode ?? "——"}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Text style={styles.copyBtnText}>{codeCopied ? "Copied!" : "Copy"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.codeHint}>
            Share this code with family members so they can join.
          </Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MEMBERS</Text>
          {membersLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            members.map((member) => (
              <View key={member.uid} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.displayName || "—"}
                    {member.uid === family?.ownerId ? " 👑" : ""}
                    {member.uid === user?.uid ? " (you)" : ""}
                  </Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                {isOwner && member.uid !== family?.ownerId ? (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={[
                        styles.roleChip,
                        member.role === "parent" && styles.roleChipActive,
                      ]}
                      onPress={() => handleChangeRole(member, "parent")}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          member.role === "parent" && styles.roleChipTextActive,
                        ]}
                      >
                        Parent
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleChip,
                        member.role === "kid" && styles.roleChipActive,
                      ]}
                      onPress={() => handleChangeRole(member, "kid")}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          member.role === "kid" && styles.roleChipTextActive,
                        ]}
                      >
                        Kid
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveMember(member)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.roleTag}>
                    <Text style={styles.roleTagText}>{member.role}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PENDING INVITATIONS</Text>
            {pendingInvites.map((inv) => (
              <View key={inv.id} style={styles.inviteRow}>
                <View style={styles.inviteInfo}>
                  <Text style={styles.inviteEmail}>{inv.email}</Text>
                  <Text style={styles.inviteRole}>{inv.role}</Text>
                </View>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.cancelInviteBtn}
                    onPress={() => handleCancelInvite(inv)}
                  >
                    <Text style={styles.cancelInviteBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Invite by email (owner only) */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INVITE BY EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              placeholderTextColor={COLORS.textSecondary}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
            />
            <View style={styles.roleRow}>
              {(["parent", "kid"] as UserRole[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, inviteRole === r && styles.roleOptionActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      inviteRole === r && styles.roleOptionTextActive,
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {inviting ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
              <TouchableOpacity
                style={[styles.inviteBtn, !inviteEmail.trim() && styles.inviteBtnDisabled]}
                onPress={handleInvite}
                disabled={!inviteEmail.trim()}
              >
                <Text style={styles.inviteBtnText}>Send Invitation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  section: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  code: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 6,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  copyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  codeHint: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  memberEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  memberActions: { flexDirection: "row", gap: SPACING.xs, alignItems: "center" },
  roleChip: {
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  roleChipTextActive: { color: "#FFF" },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  roleTag: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  roleTagText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inviteInfo: { flex: 1 },
  inviteEmail: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  inviteRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cancelInviteBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelInviteBtnText: { fontSize: 12, color: COLORS.error, fontWeight: "600" },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  roleRow: { flexDirection: "row", gap: SPACING.sm, marginBottom: SPACING.md },
  roleOption: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  roleOptionTextActive: { color: "#FFF" },
  loader: { marginVertical: SPACING.sm },
  inviteBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  inviteBtnDisabled: { opacity: 0.4 },
  inviteBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
