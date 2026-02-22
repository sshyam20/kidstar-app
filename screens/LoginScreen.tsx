import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { ResponseType } from "expo-auth-session";
import { RootStackParamList } from "../constants/navigation";
import { COLORS, SPACING, GOOGLE_WEB_CLIENT_ID } from "../constants";
import {
  signInWithApple,
  signInWithGoogleCredential,
  signInWithGooglePopup,
} from "../services/auth";

// Only needed for native production builds; unused in Expo Go / web
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props): React.ReactElement {
  const [loading, setLoading] = useState(false);

  // Hook must be called unconditionally (React rules).
  // Only used on native; web uses signInWithPopup instead.
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
  });

  // Handles the native expo-auth-session response
  React.useEffect(() => {
    if (Platform.OS === "web") return; // handled synchronously via signInWithPopup
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token) handleGoogleCredential(id_token);
    } else if (googleResponse?.type === "error") {
      Alert.alert("Error", googleResponse.error?.message ?? "Google sign-in failed");
      setLoading(false);
    }
  }, [googleResponse]);

  async function handleGoogleCredential(idToken: string): Promise<void> {
    try {
      await signInWithGoogleCredential(idToken);
      // useAppState reactive routing handles stack switch
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(): Promise<void> {
    setLoading(true);
    if (Platform.OS === "web") {
      // Firebase signInWithPopup: opens Google's consent screen as a first-party
      // popup — no redirect URI required, works in any browser without configuration.
      try {
        await signInWithGooglePopup();
        // onAuthStateChanged fires → useAppState updates → App.tsx switches stacks
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Google sign-in failed";
        Alert.alert("Error", message);
      } finally {
        setLoading(false);
      }
    } else {
      // Native: expo-auth-session flow (requires a registered URL scheme in
      // a production/dev build; won't work in plain Expo Go without one).
      try {
        await promptGoogleAsync();
        // loading cleared by handleGoogleCredential's finally block
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Google sign-in failed";
        Alert.alert("Error", message);
        setLoading(false);
      }
    }
  }

  async function handleAppleSignIn(): Promise<void> {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("ERR_CANCELED")
      ) {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Apple sign-in failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Kidstar</Text>
      </View>

      <View style={styles.buttons}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={14}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
  },
  buttons: {
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
    minHeight: 120,
    justifyContent: "center",
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
  },
  appleButton: {
    height: 52,
    width: "100%",
  },
});
