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
import { useKids } from "../hooks/useKids";
import { db } from "../services/firebase";
import { addClass, updateClass } from "../services/classes";
import { ClassSchedule } from "../types";
import EmojiPicker from "../components/EmojiPicker";

type Props = NativeStackScreenProps<RootStackParamList, "AddClass">;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINUTES = [0, 15, 30, 45];

export default function AddClassScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const familyId = useFamilyId();
  const { kids } = useKids();
  const classId = route.params?.classId;
  const isEditing = !!classId;

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎓");
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [hour, setHour] = useState(9); // 1–12
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);

  useEffect(() => {
    if (!classId) return;
    getDoc(doc(db, "families", familyId, "classes", classId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data() as Omit<ClassSchedule, "id">;
        setName(d.name);
        setEmoji(d.emoji);
        setDayOfWeek(d.dayOfWeek);
        setSelectedKidIds(d.kidIds);
        const [h, m] = d.time.split(":").map(Number);
        setIsPM(h >= 12);
        setHour(h % 12 || 12);
        setMinute(m);
      }
      setInitializing(false);
    });
  }, [classId, familyId]);

  function toggleKid(kidId: string): void {
    setSelectedKidIds((prev) =>
      prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
    );
  }

  function buildTime(): string {
    const h24 = isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour;
    return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter a class name.");
      return;
    }
    if (selectedKidIds.length === 0) {
      Alert.alert("Assign kids", "Please select at least one kid.");
      return;
    }
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        emoji,
        dayOfWeek,
        time: buildTime(),
        kidIds: selectedKidIds,
      };
      if (isEditing && classId) {
        await updateClass(familyId, classId, data);
      } else {
        await addClass(familyId, data);
      }
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to save class."
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

  const displayHour = hour === 0 ? 12 : hour;

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
          <Text style={styles.label}>Class Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Piano Lesson"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Icon</Text>
          <EmojiPicker
            emojis={ACTIVITY_EMOJIS}
            selected={emoji}
            onSelect={setEmoji}
          />

          <Text style={styles.label}>Day of Week</Text>
          <View style={styles.dayRow}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDayOfWeek(i)}
                style={[styles.dayBtn, dayOfWeek === i && styles.dayBtnSelected]}
              >
                <Text
                  style={[
                    styles.dayBtnText,
                    dayOfWeek === i && styles.dayBtnTextSelected,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <TouchableOpacity
                onPress={() => setHour((h) => (h === 12 ? 1 : h + 1))}
                style={styles.timeArrow}
              >
                <Text style={styles.timeArrowText}>▲</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{String(displayHour).padStart(2, "0")}</Text>
              <TouchableOpacity
                onPress={() => setHour((h) => (h === 1 ? 12 : h - 1))}
                style={styles.timeArrow}
              >
                <Text style={styles.timeArrowText}>▼</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.timeSep}>:</Text>
            <View style={styles.minuteGrid}>
              {MINUTES.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMinute(m)}
                  style={[styles.minBtn, minute === m && styles.minBtnSelected]}
                >
                  <Text
                    style={[
                      styles.minBtnText,
                      minute === m && styles.minBtnTextSelected,
                    ]}
                  >
                    {String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ampmCol}>
              {(["AM", "PM"] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setIsPM(p === "PM")}
                  style={[
                    styles.ampmBtn,
                    isPM === (p === "PM") && styles.ampmBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ampmText,
                      isPM === (p === "PM") && styles.ampmTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.label}>Assign to Kids</Text>
          {kids.map((kid) => (
            <TouchableOpacity
              key={kid.id}
              onPress={() => toggleKid(kid.id)}
              style={styles.kidRow}
            >
              <View style={[styles.kidAvatar, { backgroundColor: kid.color }]}>
                <Text style={styles.kidEmoji}>{kid.emoji}</Text>
              </View>
              <Text style={styles.kidName}>{kid.name}</Text>
              <View
                style={[
                  styles.checkbox,
                  selectedKidIds.includes(kid.id) && styles.checkboxChecked,
                ]}
              >
                {selectedKidIds.includes(kid.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <TouchableOpacity
              style={[styles.button, !name.trim() && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={styles.buttonText}>
                {isEditing ? "Save Changes" : "Add Class"}
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
  dayRow: { flexDirection: "row", gap: SPACING.xs, flexWrap: "wrap" },
  dayBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 42,
    alignItems: "center",
  },
  dayBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
  dayBtnTextSelected: { color: "#FFFFFF" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: SPACING.md,
  },
  timeColumn: { alignItems: "center", gap: 4 },
  timeArrow: { padding: 4 },
  timeArrowText: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  timeValue: { fontSize: 28, fontWeight: "700", color: COLORS.text, minWidth: 40, textAlign: "center" },
  timeSep: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  minuteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  minBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  minBtnSelected: { backgroundColor: COLORS.primary },
  minBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  minBtnTextSelected: { color: "#FFFFFF" },
  ampmCol: { gap: 6 },
  ampmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  ampmBtnSelected: { backgroundColor: COLORS.primary },
  ampmText: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  ampmTextSelected: { color: "#FFFFFF" },
  kidRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  kidAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  kidEmoji: { fontSize: 18 },
  kidName: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
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
