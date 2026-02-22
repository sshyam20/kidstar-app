import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { auth } from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export { Google };

export async function signInWithApple(): Promise<User> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const { identityToken } = credential;
  if (!identityToken) {
    throw new Error("Apple Sign-In failed: no identity token returned");
  }

  const provider = new OAuthProvider("apple.com");
  const oauthCredential = provider.credential({ idToken: identityToken });
  const result = await signInWithCredential(auth, oauthCredential);
  return result.user;
}

export async function signInWithGoogleCredential(
  idToken: string
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

// Web-only: opens a Firebase-managed popup (no redirect URI needed).
// Works on web in Expo and in any browser-based environment.
export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
