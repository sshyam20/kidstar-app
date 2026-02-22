import React, { useRef } from "react";
import { Animated, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: Props): React.ReactElement {
  const swipeRef = useRef<Swipeable>(null);

  function renderRightActions(
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ): React.ReactElement {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text style={styles.deleteIcon}>🗑️</Text>
          <Text style={styles.deleteLabel}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  deleteIcon: { fontSize: 22, textAlign: "center" },
  deleteLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 2,
  },
});
