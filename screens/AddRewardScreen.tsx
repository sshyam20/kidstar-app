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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { ACTIVITY_EMOJIS } from "../constants/emojis";
import { useFamilyId } from "../context/FamilyContext";
import { db } from "../services/firebase";
import { addReward, updateReward } from "../services/rewards";
import { Reward } from "../types";
import EmojiPicker from "../components/EmojiPicker";

type Props = NativeStackScreenProps<RootStackParamList, "AddReward">;

export default function AddRewardScreen({ navigation, route }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const rewardId = route.params?.rewardId;
  const isEditing = !!rewardId;

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🎁");
  const [pointCost, setPointCost] = useState(20);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);

  useEffect(() => {
    if (!rewardId) return;
    getDoc(doc(db, "families", familyId, "rewards", rewardId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data() as Omit<Reward, "id">;
        setTitle(d.title);
        setEmoji(d.emoji);
        setPointCost(d.pointCost);
      }
      setInitializing(false);
    });
  }, [rewardId, familyId]);

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a reward title.");
      return;
    }
    setLoading(true);
    try {
      const data = { title: title.trim(), emoji, pointCost, isPaused: false };
      if (isEditing && rewardId) {
        await updateReward(familyId, rewardId, data);
      } else {
        await addReward(familyId, data);
      }
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save reward."
      );
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Reward Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Extra Screen Time"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Icon</Text>
          <EmojiPicker
            emojis={["🎁", "🎮", "🍦", "🎬", "🧸", "🏖️", "🎪", "🎡", ...ACTIVITY_EMOJIS]}
            selected={emoji}
            onSelect={setEmoji}
          />

          <Text style={styles.label}>Point Cost</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPointCost((p) => Math.max(1, p - 5))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{pointCost}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPointCost((p) => p + 5)}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Steps of 5 points</Text>
        </ScrollView>

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <TouchableOpacity
              style={[styles.button, !title.trim() && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text style={styles.buttonText}>
                {isEditing ? "Save Changes" : "Add Reward"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  loader: { flex: 1 },
  scroll: { padding: SPACING.lg, gap: SPACING.sm },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 17,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtnText: { fontSize: 22, color: COLORS.text, fontWeight: "600" },
  stepValue: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 50,
    textAlign: "center",
  },
  hint: { fontSize: 13, color: COLORS.textSecondary },
  footer: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
