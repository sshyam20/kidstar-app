import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SPACING } from "../constants";

interface Props {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
}

const SWATCH = 40;

export default function ColorPicker({
  colors,
  selected,
  onSelect,
}: Props): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {colors.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onSelect(color)}
          style={[
            styles.swatch,
            { backgroundColor: color },
            selected === color && styles.swatchSelected,
          ]}
          activeOpacity={0.8}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: "#1A1A2E",
    transform: [{ scale: 1.18 }],
  },
});
