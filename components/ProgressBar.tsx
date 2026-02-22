import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../constants";

interface Props {
  progress: number;
  height?: number;
  color?: string;
}

export default function ProgressBar({
  progress,
  height = 6,
  color = COLORS.primary,
}: Props): React.ReactElement {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct}%`,
          height,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.border,
    overflow: "hidden",
    width: "100%",
  },
});
