import React, { useState, useEffect, useLayoutEffect } from "react";
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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { doc, getDoc } from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING } from "../constants";
import { KID_EMOJIS } from "../constants/emojis";
import { KID_COLORS } from "../constants/colors";
import { useFamilyId } from "../context/FamilyContext";
import { db } from "../services/firebase";
import { addKid, updateKid, uploadKidAvatar } from "../services/kids";
import { Kid } from "../types";
import EmojiPicker from "../components/EmojiPicker";
import ColorPicker from "../components/ColorPicker";
import HomeButton from "../components/HomeButton";

type Props = NativeStackScreenProps<RootStackParamList, "AddKid">;

export default function AddKidScreen({ navigation, route }: Props): React.ReactElement {
  const familyId = useFamilyId();
  const kidId = route.params?.kidId;
  const isEditing = !!kidId;

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(KID_EMOJIS[0]);
  const [color, setColor] = useState(KID_COLORS[0]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Hero" : "Add Hero",
      headerRight: () => <HomeButton navigation={navigation} />,
    });
  }, [navigation, isEditing]);

  useEffect(() => {
    if (!kidId) return;
    getDoc(doc(db, "families", familyId, "kids", kidId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data() as Omit<Kid, "id">;
        setName(d.name);
        setEmoji(d.emoji);
        setColor(d.color);
        if (d.photoUrl) setExistingPhotoUrl(d.photoUrl);
      }
      setInitializing(false);
    });
  }, [kidId, familyId]);

  async function pickPhoto(): Promise<void> {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Photo upload is not supported on web.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to set a kid photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets[0]) {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPhotoUri(manipulated.uri);
    }
  }

  function removePhoto(): void {
    setPhotoUri(null);
    setExistingPhotoUrl(null);
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the kid's name.");
      return;
    }
    setLoading(true);
    try {
      const data = { name: name.trim(), emoji, color };

      if (isEditing && kidId) {
        await updateKid(familyId, kidId, data);
        if (photoUri) {
          const url = await uploadKidAvatar(familyId, kidId, photoUri);
          await updateKid(familyId, kidId, { photoUrl: url });
        } else if (!existingPhotoUrl) {
          await updateKid(familyId, kidId, { photoUrl: undefined });
        }
      } else {
        const newKidId = await addKid(familyId, data);
        if (photoUri) {
          const url = await uploadKidAvatar(familyId, newKidId, photoUri);
          await updateKid(familyId, newKidId, { photoUrl: url });
        }
      }
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save.");
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

  const displayPhoto = photoUri ?? existingPhotoUrl;

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
          {/* Photo picker */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.photoCircle} />
              ) : (
                <View style={[styles.photoCircle, styles.photoPlaceholder, { backgroundColor: color }]}>
                  <Text style={styles.photoEmoji}>{emoji}</Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>
              {Platform.OS === "web" ? "Photo not supported on web" : "Tap to add a photo"}
            </Text>
            {displayPhoto && (
              <TouchableOpacity onPress={removePhoto}>
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Avatar Emoji</Text>
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
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.previewPhoto} />
              ) : (
                <Text style={styles.previewEmoji}>{emoji}</Text>
              )}
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
              <Text style={styles.buttonText}>
                {isEditing ? "Save Changes" : "Add Kid"}
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
  photoSection: { alignItems: "center", paddingVertical: SPACING.md, gap: SPACING.xs },
  photoCircle: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: { justifyContent: "center", alignItems: "center" },
  photoEmoji: { fontSize: 48 },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  cameraIconText: { fontSize: 14 },
  photoHint: { fontSize: 12, color: COLORS.textSecondary },
  removePhotoText: { fontSize: 13, color: COLORS.error, fontWeight: "600" },
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
    overflow: "hidden",
  },
  previewPhoto: { width: 72, height: 72, borderRadius: 36 },
  previewEmoji: { fontSize: 36 },
  previewName: { fontSize: 17, fontWeight: "700", color: COLORS.text },
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
