import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
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
  signInWithEmail,
  createAccountWithEmail,
  sendPasswordReset,
  mapAuthError,
} from "../services/auth";

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

// RFC 5321 compatible — accepts plus-addressed emails
function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(
    email.trim()
  );
}

type EmailMode = "signin" | "signup";

export default function LoginScreen({ navigation }: Props): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
  });

  React.useEffect(() => {
    if (Platform.OS === "web") return;
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
    } catch (error: unknown) {
      Alert.alert("Error", error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn(): Promise<void> {
    setLoading(true);
    if (Platform.OS === "web") {
      try {
        await signInWithGooglePopup();
      } catch (error: unknown) {
        Alert.alert("Error", error instanceof Error ? error.message : "Google sign-in failed");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await promptGoogleAsync();
      } catch (error: unknown) {
        Alert.alert("Error", error instanceof Error ? error.message : "Google sign-in failed");
        setLoading(false);
      }
    }
  }

  async function handleAppleSignIn(): Promise<void> {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("ERR_CANCELED")) {
        setLoading(false);
        return;
      }
      Alert.alert("Error", error instanceof Error ? error.message : "Apple sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  function validateEmail(): boolean {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }

  function validatePassword(): boolean {
    if (!password) {
      setPasswordError("Password is required.");
      return false;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return false;
    }
    if (emailMode === "signup" && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError("");
    return true;
  }

  async function handleEmailAuth(): Promise<void> {
    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk || !passwordOk) return;

    setLoading(true);
    try {
      if (emailMode === "signup") {
        await createAccountWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      const message = mapAuthError(code) || (error instanceof Error ? error.message : "Sign-in failed.");
      if (message.toLowerCase().includes("email")) {
        setEmailError(message);
      } else {
        setPasswordError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(): Promise<void> {
    if (!email.trim() || !isValidEmail(email)) {
      setEmailError("Enter your email address first.");
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      Alert.alert("Email sent", `Password reset email sent to ${email.trim()}.`);
    } catch {
      Alert.alert("Error", "Could not send reset email. Check the address and try again.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>⭐</Text>
            <Text style={styles.title}>
              {showEmailForm
                ? emailMode === "signup"
                  ? "Create Account"
                  : "Welcome back"
                : "Sign in to KidStar"}
            </Text>
            <Text style={styles.subtitle}>
              {showEmailForm
                ? emailMode === "signup"
                  ? "Join your family on KidStar"
                  : "Sign in to continue"
                : "Choose how to continue"}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : showEmailForm ? (
            /* ── Email form ── */
            <View style={styles.emailForm}>
              {emailMode === "signup" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>YOUR NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex Smith"
                    placeholderTextColor={COLORS.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>EMAIL</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={[styles.input, passwordError ? styles.inputError : null]}
                  placeholder={emailMode === "signup" ? "Min. 8 characters" : "Your password"}
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
                  secureTextEntry
                  returnKeyType={emailMode === "signup" ? "next" : "done"}
                  onSubmitEditing={emailMode === "signin" ? handleEmailAuth : undefined}
                />
                {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
              </View>

              {emailMode === "signup" && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor={COLORS.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={handleEmailAuth}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} onPress={handleEmailAuth}>
                <Text style={styles.primaryBtnText}>
                  {emailMode === "signup" ? "Create Account" : "Sign In"}
                </Text>
              </TouchableOpacity>

              {emailMode === "signin" && (
                <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                  <Text style={styles.forgotBtnText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              {/* Toggle sign in / sign up */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>
                  {emailMode === "signin" ? "Don't have an account?" : "Already have an account?"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEmailMode(emailMode === "signin" ? "signup" : "signin");
                    setEmailError("");
                    setPasswordError("");
                    setPassword("");
                    setConfirmPassword("");
                  }}
                >
                  <Text style={styles.toggleLink}>
                    {emailMode === "signin" ? "Create one" : "Sign in"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.backToOptionsBtn}
                onPress={() => {
                  setShowEmailForm(false);
                  setEmailError("");
                  setPasswordError("");
                }}
              >
                <Text style={styles.backToOptionsText}>← Other sign-in options</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Sign-in options ── */
            <View style={styles.options}>
              {/* Google */}
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn}>
                <Text style={styles.socialBtnIcon}>🌐</Text>
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Apple — iOS only */}
              {Platform.OS === "ios" && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={14}
                  style={styles.appleBtn}
                  onPress={handleAppleSignIn}
                />
              )}

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email */}
              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => setShowEmailForm(true)}
              >
                <Text style={styles.emailBtnIcon}>✉️</Text>
                <Text style={styles.emailBtnText}>Continue with Email</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  backBtn: { paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: "600" },
  header: { alignItems: "center", paddingVertical: SPACING.xl, gap: SPACING.sm },
  logo: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center" },
  loader: { flex: 1, justifyContent: "center" as const, marginTop: SPACING.xxl },
  options: { gap: SPACING.sm, marginTop: SPACING.sm },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialBtnIcon: { fontSize: 20 },
  socialBtnText: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  appleBtn: { height: 52, width: "100%" },
  divider: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginVertical: SPACING.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  emailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  emailBtnIcon: { fontSize: 20 },
  emailBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  emailForm: { gap: SPACING.md, marginTop: SPACING.sm },
  field: { gap: SPACING.xs },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, fontWeight: "500" },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  forgotBtn: { alignItems: "center", paddingVertical: SPACING.xs },
  forgotBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  toggleLabel: { fontSize: 14, color: COLORS.textSecondary },
  toggleLink: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  backToOptionsBtn: { alignItems: "center", paddingVertical: SPACING.sm },
  backToOptionsText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
});
