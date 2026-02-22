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
import { CATEGORIES } from "../constants/categories";
import { useFamilyId } from "../context/FamilyContext";
import { db } from "../services/firebase";
import { addActivity, updateActivity } from "../services/activities";
import { Activity, ActivityCategory } from "../types";
import EmojiPicker from "../components/EmojiPicker";

type Props = NativeStackScreenProps<RootStackParamList, "AddActivity">;

export default function AddActivityScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const familyId = useFamilyId();
  const activityId = route.params?.activityId;
  const isEditing = !!activityId;

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(ACTIVITY_EMOJIS[0]);
  const [category, setCategory] = useState<ActivityCategory>("chore");
  const [points, setPoints] = useState(5);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);

  useEffect(() => {
    if (!activityId) return;
    getDoc(doc(db, "families", familyId, "activities", activityId)).then(
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Omit<Activity, "id">;
          setTitle(data.title);
          setEmoji(data.emoji);
          setCategory(data.category);
          setPoints(data.points);
        }
        setInitializing(false);
      }
    );
  }, [activityId, familyId]);

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a mission title.");
      return;
    }
    setLoading(true);
    try {
      const data = { title: title.trim(), emoji, category, points };
      if (isEditing && activityId) {
        await updateActivity(familyId, activityId, data);
      } else {
        await addActivity(familyId, data);
      }
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save activity."
      );
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.centerLoader}
        />
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
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Clean Room"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Icon</Text>
          <EmojiPicker
            emojis={ACTIVITY_EMOJIS}
            selected={emoji}
            onSelect={setEmoji}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.catPill,
                  { backgroundColor: cat.color },
                  category === cat.key && styles.catPillSelected,
                ]}
              >
                <Text style={styles.catEmoji}>{cat.emoji}</Text>
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Stars</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPoints((p) => Math.max(1, p - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepValue}>{points}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setPoints((p) => Math.min(30, p + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
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
                {isEditing ? "Save Changes" : "Add Mission"}
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
  centerLoader: { flex: 1 },
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
  catRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 99,
    gap: SPACING.xs,
    borderWidth: 2,
    borderColor: "transparent",
  },
  catPillSelected: {
    borderColor: COLORS.text,
  },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text },
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
  stepValue: { fontSize: 28, fontWeight: "700", color: COLORS.text, minWidth: 40, textAlign: "center" },
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
