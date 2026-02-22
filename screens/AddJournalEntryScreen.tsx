import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getDoc, doc } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { useFamilyId } from "../context/FamilyContext";
import {
  addJournalEntry,
  uploadJournalPhoto,
  deleteJournalEntry,
} from "../services/journal";
import { db } from "../services/firebase";
import { getTodayDate } from "../services/completions";
import { useToast } from "../context/ToastContext";
import { JournalEntry, MoodTag } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "AddJournalEntry">;

const MOOD_OPTIONS: { value: MoodTag; emoji: string; label: string; color: string }[] = [
  { value: "positive", emoji: "😊", label: "Positive", color: "#10B981" },
  { value: "neutral", emoji: "😐", label: "Neutral", color: "#F59E0B" },
  { value: "needs-work", emoji: "💪", label: "Needs Work", color: "#EF4444" },
];

export default function AddJournalEntryScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const { kidId, entryId } = route.params;
  const familyId = useFamilyId();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moodTag, setMoodTag] = useState<MoodTag>("positive");
  const [date, setDate] = useState(getTodayDate());
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: entryId ? "Edit Entry" : "New Entry",
    });
  }, [navigation, entryId]);

  // Load existing entry for edit mode
  useEffect(() => {
    if (!entryId) return;
    setIsEdit(true);
    getDoc(
      doc(db, "families", familyId, "kids", kidId, "journal", entryId)
    ).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Omit<JournalEntry, "id">;
      setTitle(data.title);
      setDescription(data.description);
      setMoodTag(data.moodTag);
      setDate(data.date);
      if (data.photoUrl) setExistingPhotoUrl(data.photoUrl);
    });
  }, [entryId, familyId, kidId]);

  async function pickPhoto(): Promise<void> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to attach photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      // Compress: max 800px wide, JPEG 0.7
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotoUri(manipulated.uri);
    }
  }

  async function handleSave(): Promise<void> {
    if (!title.trim()) {
      Alert.alert("Title required", "Please add a title for this entry.");
      return;
    }
    setLoading(true);
    try {
      if (isEdit && entryId) {
        // Update via delete + re-add (keeps things simple; entryId is reused)
        await deleteJournalEntry(familyId, kidId, entryId);
      }
      const newId = await addJournalEntry(familyId, {
        kidId,
        title: title.trim(),
        description: description.trim(),
        moodTag,
        date,
        photoUrl: existingPhotoUrl ?? undefined,
      });
      // Upload new photo if selected
      if (photoUri) {
        const url = await uploadJournalPhoto(familyId, kidId, newId, photoUri);
        // Patch the photoUrl into the created doc
        const { setDoc, doc: fsDoc } = await import("firebase/firestore");
        const { db: fsDb } = await import("../services/firebase");
        await setDoc(
          fsDoc(fsDb, "families", familyId, "kids", kidId, "journal", newId),
          { photoUrl: url },
          { merge: true }
        );
      }
      showToast(isEdit ? "Entry updated" : "Entry added 📓");
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not save entry.");
    } finally {
      setLoading(false);
    }
  }

  const displayPhoto = photoUri ?? existingPhotoUrl;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <TouchableOpacity onPress={pickPhoto} style={styles.photoWrap} activeOpacity={0.8}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoLabel}>
                {Platform.OS === "web" ? "Photo upload not supported on web" : "Tap to add a photo"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.label}>DATE</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What happened today?"
            placeholderTextColor={COLORS.textSecondary}
            maxLength={80}
          />
        </View>

        {/* Mood */}
        <View style={styles.field}>
          <Text style={styles.label}>MOOD</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[
                  styles.moodOption,
                  moodTag === m.value && { borderColor: m.color, backgroundColor: m.color + "15" },
                ]}
                onPress={() => setMoodTag(m.value)}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, moodTag === m.value && { color: m.color }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>NOTES (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details, observations, or thoughts…"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Save */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={[styles.saveBtn, !title.trim() && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.saveBtnText}>
              {isEdit ? "Save Changes" : "Add Entry 📓"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  photoWrap: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: COLORS.border },
  photo: { width: "100%", height: 200, resizeMode: "cover" },
  photoPlaceholder: {
    height: 140,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  photoIcon: { fontSize: 36 },
  photoLabel: { fontSize: 14, color: COLORS.textSecondary },
  field: { gap: SPACING.xs },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 110, paddingTop: SPACING.sm },
  moodRow: { flexDirection: "row", gap: SPACING.sm },
  moodOption: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 4,
    backgroundColor: COLORS.surface,
  },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  loader: { marginVertical: SPACING.md },
  saveBtn: {
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
  saveBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
