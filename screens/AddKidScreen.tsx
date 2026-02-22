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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { KID_EMOJIS } from "../constants/emojis";
import { KID_COLORS } from "../constants/colors";
import { useFamilyId } from "../context/FamilyContext";
import { addKid } from "../services/kids";
import EmojiPicker from "../components/EmojiPicker";
import ColorPicker from "../components/ColorPicker";

type Props = NativeStackScreenProps<RootStackParamList, "AddKid">;

export default function AddKidScreen({ navigation }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(KID_EMOJIS[0]);
  const [color, setColor] = useState(KID_COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the kid's name.");
      return;
    }
    setLoading(true);
    try {
      await addKid(familyId, { name: name.trim(), emoji, color });
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to add kid."
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoFocus
          />

          <Text style={styles.label}>Avatar</Text>
          <EmojiPicker
            emojis={KID_EMOJIS}
            selected={emoji}
            onSelect={setEmoji}
          />

          <Text style={styles.label}>Card Color</Text>
          <ColorPicker
            colors={KID_COLORS}
            selected={color}
            onSelect={setColor}
          />

          <View style={styles.preview}>
            <View style={[styles.previewAvatar, { backgroundColor: color }]}>
              <Text style={styles.previewEmoji}>{emoji}</Text>
            </View>
            <Text style={styles.previewName}>{name || "Preview"}</Text>
          </View>
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
              <Text style={styles.buttonText}>Add Kid</Text>
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
  preview: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  previewEmoji: { fontSize: 36 },
  previewName: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
