import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../constants";

export type ToastType = "success" | "error" | "info";

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

interface ToastState {
  message: string;
  type: ToastType;
}

const BG: Record<ToastType, string> = {
  success: COLORS.success,
  error: COLORS.error,
  info: COLORS.primary,
};

const ICON: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "i",
};

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      opacity.setValue(0);
      translateY.setValue(16);
      setToast({ message, type });

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 16,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start(() => setToast(null));
      }, 2600);
    },
    [opacity, translateY]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { backgroundColor: BG[toast.type] },
            {
              bottom: insets.bottom + SPACING.md,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>{ICON[toast.type]}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 13, color: "#FFF", fontWeight: "800" },
  message: {
    flex: 1,
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    lineHeight: 20,
  },
});
