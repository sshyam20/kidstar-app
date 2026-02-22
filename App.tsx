import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

import { RootStackParamList } from "./constants/navigation";
import { COLORS } from "./constants";
import { useAppState } from "./hooks/useAppState";
import { FamilyProvider } from "./context/FamilyContext";
import { ToastProvider } from "./context/ToastContext";

import LandingScreen from "./screens/LandingScreen";
import LoginScreen from "./screens/LoginScreen";
import CreateFamilyScreen from "./screens/CreateFamilyScreen";
import JoinFamilyScreen from "./screens/JoinFamilyScreen";
import ParentTabNavigator from "./screens/ParentTabNavigator";
import ManageKidsScreen from "./screens/ManageKidsScreen";
import AddKidScreen from "./screens/AddKidScreen";
import AddActivityScreen from "./screens/AddActivityScreen";
import AddClassScreen from "./screens/AddClassScreen";
import AddRewardScreen from "./screens/AddRewardScreen";
import KidViewScreen from "./screens/KidViewScreen";
import JournalScreen from "./screens/JournalScreen";
import AddJournalEntryScreen from "./screens/AddJournalEntryScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "https://kidstar-app.web.app",
    "http://localhost:8081",
    "http://localhost:19006",
    "kidstar://",
  ],
  config: {
    screens: {
      Landing: "",
      Login: "login",
      CreateFamily: "setup",
      JoinFamily: "join",
      KidView: "kid",
      Journal: "journal",
      AddJournalEntry: "journal/entry",
      ParentTabs: {
        screens: {
          Home: "home",
          Missions: "missions",
          Academy: "academy",
          Treasure: "rewards",
          Family: "family",
        },
      },
      ManageKids: "kids",
      AddKid: "kids/edit",
      AddActivity: "activities/edit",
      AddClass: "classes/edit",
      AddReward: "rewards/edit",
    },
  },
};

function RootNavigator(): React.ReactElement {
  const { user, familyId, role, kidId, loading } = useAppState();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const screenGroup = !user ? (
    <>
      <Stack.Screen
        name="Landing"
        component={LandingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </>
  ) : !familyId ? (
    <>
      <Stack.Screen
        name="CreateFamily"
        component={CreateFamilyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinFamily"
        component={JoinFamilyScreen}
        options={{ headerShown: false }}
      />
    </>
  ) : role === "kid" ? (
    <>
      <Stack.Screen
        name="KidView"
        component={KidViewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: "My Journal" }}
      />
    </>
  ) : (
    <>
      <Stack.Screen
        name="ParentTabs"
        component={ParentTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ManageKids"
        component={ManageKidsScreen}
        options={{ title: "Heroes" }}
      />
      <Stack.Screen
        name="AddKid"
        component={AddKidScreen}
        options={{ title: "Add Hero", presentation: "modal" }}
      />
      <Stack.Screen
        name="AddActivity"
        component={AddActivityScreen}
        options={{ title: "Mission", presentation: "modal" }}
      />
      <Stack.Screen
        name="AddClass"
        component={AddClassScreen}
        options={{ title: "Add Class", presentation: "modal" }}
      />
      <Stack.Screen
        name="AddReward"
        component={AddRewardScreen}
        options={{ title: "Reward", presentation: "modal" }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
      />
      <Stack.Screen
        name="AddJournalEntry"
        component={AddJournalEntryScreen}
        options={{ presentation: "modal" }}
      />
    </>
  );

  const stack = <Stack.Navigator>{screenGroup}</Stack.Navigator>;

  if (familyId) {
    return (
      <FamilyProvider familyId={familyId} role={role} kidId={kidId}>
        {stack}
      </FamilyProvider>
    );
  }

  return stack;
}

export default function App(): React.ReactElement {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
