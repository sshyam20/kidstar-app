import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

interface Props {
  emoji: string;
  color: string;
  photoUrl?: string;
  size: number;
}

export default function KidAvatar({ emoji, color, photoUrl, size }: Props): React.ReactElement {
  const radius = size / 2;

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.photo, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.emojiCircle,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}
    >
      <Text style={{ fontSize: size * 0.48 }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    resizeMode: "cover",
  },
  emojiCircle: {
    justifyContent: "center",
    alignItems: "center",
  },
});
