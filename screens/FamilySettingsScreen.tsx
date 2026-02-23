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
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ParentTabParamList, RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId, useFamilyName, useUserFamilies, useIsAdmin } from "../context/FamilyContext";
import { useAuth } from "../hooks/useAuth";
import { useMembers } from "../hooks/useMembers";
import {
  getFamily,
  switchActiveFamily,
  leaveFamily,
  transferAdmin,
  joinFamilyByCode,
} from "../services/family";
import { updateMemberRole, removeMember } from "../services/members";
import {
  sendInvitation,
  cancelInvitation,
  getFamilyPendingInvitations,
} from "../services/invitations";
import { deleteAccount } from "../services/account";
import { updateDisplayName, getSignInProvider } from "../services/auth";
import { useToast } from "../context/ToastContext";
import { Family, FamilyMember, FamilyMembership, Invitation, UserRole } from "../types";

type Props = CompositeScreenProps<
  BottomTabScreenProps<ParentTabParamList, "Family">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function FamilySettingsScreen({ navigation }: Props): React.ReactElement {
  const { user } = useAuth();
  const familyId = useFamilyId();
  const familyName = useFamilyName();
  const userFamilies = useUserFamilies();
  const isAdmin = useIsAdmin();
  const { showToast } = useToast();
  const { members, loading: membersLoading } = useMembers();

  const [family, setFamily] = useState<Family | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("parent");
  const [inviting, setInviting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Join another family inline
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Delete account confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: "Family",
    });
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

  async function handleSaveDisplayName(): Promise<void> {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(displayName.trim());
      showToast("Name updated");
      setEditingName(false);
    } catch {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSavingName(false);
    }
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
    Alert.alert("Cancel invitation", `Remove invitation for ${inv.email}?`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await cancelInvitation(inv.id);
          await loadPendingInvites();
        },
      },
    ]);
  }

  async function handleChangeRole(member: FamilyMember, newRole: UserRole): Promise<void> {
    if (member.uid === family?.ownerId) {
      Alert.alert("Cannot change", "The family admin's role cannot be changed.");
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
      Alert.alert("Cannot remove", "The family admin cannot be removed. Transfer admin first.");
      return;
    }
    if (member.uid === user?.uid) {
      Alert.alert("Cannot remove", "Use 'Leave Family' to remove yourself.");
      return;
    }
    Alert.alert("Remove member", `Remove ${member.displayName || member.email} from your family?`, [
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
    ]);
  }

  async function handleTransferAdmin(member: FamilyMember): Promise<void> {
    if (!user) return;
    Alert.alert(
      "Transfer Admin",
      `Make ${member.displayName || member.email} the new family admin? You will become a regular parent.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: async () => {
            try {
              await transferAdmin(familyId, user.uid, member.uid);
              showToast(`Admin transferred to ${member.displayName || "new member"}`);
            } catch (err: unknown) {
              Alert.alert("Error", err instanceof Error ? err.message : "Could not transfer admin.");
            }
          },
        },
      ]
    );
  }

  async function handleLeaveFamily(): Promise<void> {
    if (!user) return;
    if (isAdmin) {
      Alert.alert(
        "Cannot Leave",
        "You are the admin. Transfer admin to another member before leaving, or delete the family."
      );
      return;
    }
    Alert.alert(
      "Leave Family",
      `Leave "${familyName || "this family"}"? You will remain a member of any other families you belong to.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveFamily(user.uid, familyId);
              // useAppState will react automatically and navigate away
            } catch (err: unknown) {
              Alert.alert("Error", err instanceof Error ? err.message : "Could not leave family.");
            }
          },
        },
      ]
    );
  }

  async function handleJoinAnotherFamily(): Promise<void> {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert("Invalid code", "Please enter the 6-character join code.");
      return;
    }
    if (!user) return;
    setJoining(true);
    try {
      await joinFamilyByCode(user.uid, trimmed, user.displayName ?? "", user.email ?? "");
      setJoinCode("");
      showToast("Joined new family! Tap Switch on the dashboard to switch.");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not join family.");
    } finally {
      setJoining(false);
    }
  }

  async function handleSwitchToFamily(membership: FamilyMembership): Promise<void> {
    if (!user || membership.familyId === familyId) return;
    try {
      await switchActiveFamily(user.uid, membership.familyId);
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not switch family.");
    }
  }

  async function handleDeleteAccount(): Promise<void> {
    if (deleteConfirmText !== "DELETE") return;
    if (!user) return;

    // If admin with other members, require transfer first
    if (isAdmin && members.filter((m) => m.uid !== user.uid).length > 0) {
      Alert.alert(
        "Transfer Admin First",
        "There are other members in this family. Please transfer the admin role to another member before deleting your account, or remove all other members first."
      );
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount(user.uid);
      // Auth state changes → app navigates to Landing automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not delete account.";
      if (msg.includes("requires-recent-login")) {
        Alert.alert(
          "Re-authentication Required",
          "For security, please sign out and sign back in, then try deleting your account again."
        );
      } else {
        Alert.alert("Error", msg);
      }
      setDeleting(false);
    }
    setDeleteConfirmText("");
    setShowDeleteConfirm(false);
  }

  const signInProvider = getSignInProvider();
  const otherMembers = members.filter((m) => m.uid !== user?.uid && m.uid !== family?.ownerId);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Signed in with</Text>
            <Text style={styles.accountValue}>{signInProvider}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue} numberOfLines={1}>
              {user?.email ?? "—"}
            </Text>
          </View>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your display name"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveDisplayName}
              />
              {savingName ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <TouchableOpacity onPress={handleSaveDisplayName} style={styles.saveNameBtn}>
                  <Text style={styles.saveNameBtnText}>Save</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => { setEditingName(false); setDisplayName(user?.displayName ?? ""); }}
              >
                <Text style={styles.cancelNameText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountRow}>
              <Text style={styles.accountLabel}>Display name</Text>
              <View style={styles.nameRow}>
                <Text style={styles.accountValue}>{user?.displayName || "Not set"}</Text>
                <TouchableOpacity onPress={() => setEditingName(true)} style={styles.editNameBtn}>
                  <Text style={styles.editNameBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Heroes (kids) */}
        <TouchableOpacity
          style={styles.heroesBtn}
          onPress={() => navigation.navigate("ManageKids")}
          activeOpacity={0.8}
        >
          <Text style={styles.heroesBtnEmoji}>👶</Text>
          <Text style={styles.heroesBtnText}>Manage Heroes</Text>
          <Text style={styles.heroesBtnArrow}>›</Text>
        </TouchableOpacity>

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
                {isAdmin && member.uid !== user?.uid ? (
                  <View style={styles.memberActions}>
                    {(["parent", "kid"] as UserRole[]).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, member.role === r && styles.roleChipActive]}
                        onPress={() => handleChangeRole(member, r)}
                      >
                        <Text style={[styles.roleChipText, member.role === r && styles.roleChipTextActive]}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {member.uid !== family?.ownerId && (
                      <TouchableOpacity
                        style={styles.transferAdminBtn}
                        onPress={() => handleTransferAdmin(member)}
                      >
                        <Text style={styles.transferAdminBtnText}>👑</Text>
                      </TouchableOpacity>
                    )}
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
                {isAdmin && (
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

        {/* Invite by email */}
        {isAdmin && (
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
                  <Text style={[styles.roleOptionText, inviteRole === r && styles.roleOptionTextActive]}>
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

        {/* My Families */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY FAMILIES</Text>
          {userFamilies.map((membership) => (
            <View key={membership.familyId} style={styles.myFamilyRow}>
              <View style={styles.myFamilyInfo}>
                <Text style={styles.myFamilyName}>{membership.familyName || "Unnamed Family"}</Text>
                <View style={styles.myFamilyMeta}>
                  <View style={[styles.myFamilyRoleBadge, membership.role === "admin" && styles.myFamilyRoleBadgeAdmin]}>
                    <Text style={[styles.myFamilyRoleText, membership.role === "admin" && styles.myFamilyRoleTextAdmin]}>
                      {membership.role === "admin" ? "👑 Admin" : "Parent"}
                    </Text>
                  </View>
                  {membership.familyId === familyId && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </View>
              </View>
              {membership.familyId !== familyId && (
                <TouchableOpacity
                  style={styles.switchBtn}
                  onPress={() => handleSwitchToFamily(membership)}
                >
                  <Text style={styles.switchBtnText}>Switch</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Join another family */}
          <Text style={styles.joinAnotherLabel}>Join another family</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={styles.joinCodeInput}
              placeholder="6-char code"
              placeholderTextColor={COLORS.textSecondary}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
            />
            {joining ? (
              <ActivityIndicator color={COLORS.primary} style={styles.joinLoader} />
            ) : (
              <TouchableOpacity
                style={[styles.joinBtn, joinCode.trim().length !== 6 && styles.joinBtnDisabled]}
                onPress={handleJoinAnotherFamily}
                disabled={joinCode.trim().length !== 6}
              >
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Leave Family (non-admin only) */}
        {!isAdmin && (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveFamily} activeOpacity={0.8}>
            <Text style={styles.leaveBtnText}>Leave Family</Text>
          </TouchableOpacity>
        )}

        {/* Delete Account */}
        {!showDeleteConfirm ? (
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() => setShowDeleteConfirm(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteAccountBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.deleteConfirmBox}>
            <Text style={styles.deleteWarningTitle}>⚠️ Delete Account</Text>
            <Text style={styles.deleteWarningText}>
              {isAdmin
                ? "This will permanently delete your account and ALL family data including kids, missions, stars and history. This cannot be undone."
                : "This will permanently delete your account. You will be removed from all families. This cannot be undone."}
            </Text>
            <Text style={styles.deleteConfirmPrompt}>
              Type <Text style={styles.deleteConfirmWord}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.deleteConfirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {deleting ? (
              <ActivityIndicator color={COLORS.error} style={styles.loader} />
            ) : (
              <View style={styles.deleteConfirmActions}>
                <TouchableOpacity
                  style={styles.cancelDeleteBtn}
                  onPress={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                >
                  <Text style={styles.cancelDeleteBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteBtn, deleteConfirmText !== "DELETE" && styles.confirmDeleteBtnDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE"}
                >
                  <Text style={styles.confirmDeleteBtnText}>Delete Forever</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: SPACING.md,
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
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  accountLabel: { fontSize: 14, color: COLORS.textSecondary },
  accountValue: { fontSize: 14, fontWeight: "600", color: COLORS.text, maxWidth: "60%" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  editNameBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "18",
  },
  editNameBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nameInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveNameBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  saveNameBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
  cancelNameText: { fontSize: 13, color: COLORS.textSecondary },
  heroesBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  heroesBtnEmoji: { fontSize: 24 },
  heroesBtnText: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.text },
  heroesBtnArrow: { fontSize: 22, color: COLORS.textSecondary },
  codeRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md, marginBottom: SPACING.xs },
  code: { fontSize: 28, fontWeight: "800", color: COLORS.text, letterSpacing: 6 },
  copyBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
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
  roleChip: { borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.border },
  roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  roleChipTextActive: { color: "#FFF" },
  transferAdminBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary + "20", alignItems: "center", justifyContent: "center" },
  transferAdminBtnText: { fontSize: 14 },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.error, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  roleTag: { backgroundColor: COLORS.border, borderRadius: 8, paddingHorizontal: SPACING.sm, paddingVertical: 4 },
  roleTagText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  inviteRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  inviteInfo: { flex: 1 },
  inviteEmail: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  inviteRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cancelInviteBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: COLORS.error },
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
  roleOption: { flex: 1, borderRadius: 10, paddingVertical: SPACING.sm, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleOptionText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  roleOptionTextActive: { color: "#FFF" },
  loader: { marginVertical: SPACING.sm },
  inviteBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: SPACING.sm, alignItems: "center" },
  inviteBtnDisabled: { opacity: 0.4 },
  inviteBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  // My Families
  myFamilyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  myFamilyInfo: { flex: 1 },
  myFamilyName: { fontSize: 15, fontWeight: "600", color: COLORS.text },
  myFamilyMeta: { flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: 4 },
  myFamilyRoleBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: COLORS.border },
  myFamilyRoleBadgeAdmin: { backgroundColor: COLORS.primary + "20" },
  myFamilyRoleText: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary },
  myFamilyRoleTextAdmin: { color: COLORS.primary },
  activeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: COLORS.success + "25" },
  activeBadgeText: { fontSize: 11, fontWeight: "700", color: COLORS.success },
  switchBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 8, backgroundColor: COLORS.primary + "18" },
  switchBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  joinAnotherLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  joinRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  joinCodeInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    letterSpacing: 3,
  },
  joinLoader: { width: 70, alignItems: "center" },
  joinBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: 10, backgroundColor: COLORS.primary },
  joinBtnDisabled: { opacity: 0.4 },
  joinBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },

  // Leave Family
  leaveBtn: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error + "50",
    alignItems: "center",
  },
  leaveBtnText: { color: COLORS.error, fontSize: 15, fontWeight: "700" },

  // Delete Account
  deleteAccountBtn: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.error + "12",
    borderWidth: 1,
    borderColor: COLORS.error + "40",
    alignItems: "center",
  },
  deleteAccountBtnText: { color: COLORS.error, fontSize: 15, fontWeight: "700" },
  deleteConfirmBox: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 14,
    backgroundColor: COLORS.error + "10",
    borderWidth: 1,
    borderColor: COLORS.error + "50",
    gap: SPACING.sm,
  },
  deleteWarningTitle: { fontSize: 16, fontWeight: "800", color: COLORS.error },
  deleteWarningText: { fontSize: 13, color: COLORS.text, lineHeight: 19 },
  deleteConfirmPrompt: { fontSize: 13, color: COLORS.text },
  deleteConfirmWord: { fontWeight: "800", color: COLORS.error },
  deleteConfirmInput: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.error,
    borderWidth: 2,
    borderColor: COLORS.error + "50",
    fontWeight: "700",
  },
  deleteConfirmActions: { flexDirection: "row", gap: SPACING.sm },
  cancelDeleteBtn: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelDeleteBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  confirmDeleteBtn: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: "center",
  },
  confirmDeleteBtnDisabled: { opacity: 0.4 },
  confirmDeleteBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
