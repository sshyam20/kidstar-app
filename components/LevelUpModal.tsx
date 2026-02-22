import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { COLORS, SPACING } from "../constants";

interface Props {
  visible: boolean;
  milestone: number;
  onDismiss: () => void;
}

export default function LevelUpModal({ visible, milestone, onDismiss }: Props): React.ReactElement {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.5);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, scale, opacity, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[styles.card, { transform: [{ scale }], opacity }]}
        >
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.title}>Level Up!</Text>
          <Text style={styles.milestone}>
            🎉 {milestone} Stars reached!
          </Text>
          <Text style={styles.sub}>
            Keep earning stars to unlock amazing rewards!
          </Text>
          <TouchableOpacity style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Awesome! ⭐</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: SPACING.xl,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  trophy: { fontSize: 56 },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  milestone: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primary,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
  },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
