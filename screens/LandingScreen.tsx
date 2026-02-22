import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../constants/navigation";
import { SPACING } from "../constants";

const { height } = Dimensions.get("window");

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Landing">;
};

const FEATURES = [
  { icon: "⭐", label: "Earn Points" },
  { icon: "🎁", label: "Claim Rewards" },
  { icon: "📅", label: "Track Progress" },
  { icon: "🎓", label: "Classes" },
];

export default function LandingScreen({ navigation }: Props): React.ReactElement {
  return (
    <LinearGradient
      colors={["#1D4ED8", "#2563EB", "#7C3AED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        {/* Hero section */}
        <View style={styles.hero}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🏠</Text>
            <Text style={styles.logoStar}>⭐</Text>
          </View>
          <Text style={styles.brand}>HomeHero</Text>
          <Text style={styles.tagline}>
            Turn everyday tasks into{"\n"}family adventures
          </Text>

          {/* Feature pills */}
          <View style={styles.pills}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.pill}>
                <Text style={styles.pillIcon}>{f.icon}</Text>
                <Text style={styles.pillLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Decoration */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>🏆</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>🌟</Text>
              <Text style={styles.statLabel}>Daily Goals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>🎉</Text>
              <Text style={styles.statLabel}>Family Fun</Text>
            </View>
          </View>
        </View>

        {/* Action card */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Ready to become heroes?</Text>
          <Text style={styles.actionSub}>
            Set up your family in seconds — activities and rewards are ready to go.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>🚀  Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: height * 0.02,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: -SPACING.sm,
  },
  logoEmoji: { fontSize: 56 },
  logoStar: { fontSize: 28, marginLeft: -8, marginBottom: 6 },
  brand: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 99,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  pillIcon: { fontSize: 15 },
  pillLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    gap: 2,
  },
  statNum: { fontSize: 26 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  actionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  actionSub: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: -SPACING.xs,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "600",
  },
});
