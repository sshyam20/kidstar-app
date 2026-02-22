import React from "react";
import { FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../constants";

interface Props {
  emojis: string[];
  selected: string;
  onSelect: (emoji: string) => void;
  numColumns?: number;
}

export default function EmojiPicker({
  emojis,
  selected,
  onSelect,
  numColumns = 6,
}: Props): React.ReactElement {
  return (
    <FlatList
      data={emojis}
      keyExtractor={(item) => item}
      numColumns={numColumns}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.cell, item === selected && styles.cellSelected]}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const CELL = 48;

const styles = StyleSheet.create({
  cell: {
    width: CELL,
    height: CELL,
    margin: SPACING.xs,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  cellSelected: {
    backgroundColor: COLORS.primary + "28",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  emoji: {
    fontSize: 24,
  },
});
