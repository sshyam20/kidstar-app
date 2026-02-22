import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../constants/navigation";

interface Props {
  navigation: NavigationProp<RootStackParamList>;
}

export default function HomeButton({ navigation }: Props): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("ParentTabs", { screen: "Home" })}
      style={styles.btn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.icon}>🏠</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 4 },
  icon: { fontSize: 20 },
});
