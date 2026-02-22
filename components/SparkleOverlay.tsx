import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";

interface Props {
  visible: boolean;
  onDone?: () => void;
}

const { width, height } = Dimensions.get("window");
const NUM_PARTICLES = 12;

interface ParticleConfig {
  dx: number;
  dy: number;
}

export default function SparkleOverlay({ visible, onDone }: Props): React.ReactElement | null {
  const anim = useRef(new Animated.Value(0)).current;

  // Pre-compute directions once per mount
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: NUM_PARTICLES }, (_, i) => {
      const angle = (i / NUM_PARTICLES) * Math.PI * 2;
      const distance = 60 + (i % 3) * 30;
      return {
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
      };
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start(() => {
      onDone?.();
    });
  }, [visible, anim, onDone]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dy],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0, 1, 0],
        });
        const scale = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.2, 1.2, 0.5],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
              },
            ]}
          >
            <Text style={styles.star}>⭐</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: height / 2,
    left: width / 2,
    width: 0,
    height: 0,
    zIndex: 999,
  },
  particle: {
    position: "absolute",
  },
  star: {
    fontSize: 22,
  },
});
