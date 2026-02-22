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
import DashboardScreen from "./screens/DashboardScreen";
import ManageKidsScreen from "./screens/ManageKidsScreen";
import AddKidScreen from "./screens/AddKidScreen";
import ManageActivitiesScreen from "./screens/ManageActivitiesScreen";
import AddActivityScreen from "./screens/AddActivityScreen";
import ManageClassesScreen from "./screens/ManageClassesScreen";
import AddClassScreen from "./screens/AddClassScreen";
import RewardStoreScreen from "./screens/RewardStoreScreen";
import AddRewardScreen from "./screens/AddRewardScreen";
import FamilySettingsScreen from "./screens/FamilySettingsScreen";
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
      Dashboard: "home",
      ManageKids: "kids",
      AddKid: "kids/new",
      ManageActivities: "activities",
      AddActivity: "activities/edit",
      ManageClasses: "classes",
      AddClass: "classes/edit",
      RewardStore: "rewards",
      AddReward: "rewards/edit",
      FamilySettings: "settings",
      KidView: "kid",
      Journal: "journal",
      AddJournalEntry: "journal/entry",
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
        name="Dashboard"
        component={DashboardScreen}
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
        name="ManageActivities"
        component={ManageActivitiesScreen}
        options={{ title: "Missions" }}
      />
      <Stack.Screen
        name="AddActivity"
        component={AddActivityScreen}
        options={{ title: "Mission", presentation: "modal" }}
      />
      <Stack.Screen
        name="ManageClasses"
        component={ManageClassesScreen}
        options={{ title: "Skill Academy" }}
      />
      <Stack.Screen
        name="AddClass"
        component={AddClassScreen}
        options={{ title: "Add Class", presentation: "modal" }}
      />
      <Stack.Screen
        name="RewardStore"
        component={RewardStoreScreen}
        options={{ title: "Treasure Chest" }}
      />
      <Stack.Screen
        name="AddReward"
        component={AddRewardScreen}
        options={{ title: "Reward", presentation: "modal" }}
      />
      <Stack.Screen
        name="FamilySettings"
        component={FamilySettingsScreen}
        options={{ title: "Family Settings" }}
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
