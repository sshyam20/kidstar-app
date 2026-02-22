import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ParentTabParamList } from "../constants/navigation";
import { COLORS } from "../constants";
import DashboardScreen from "./DashboardScreen";
import ManageActivitiesScreen from "./ManageActivitiesScreen";
import ManageClassesScreen from "./ManageClassesScreen";
import RewardStoreScreen from "./RewardStoreScreen";
import FamilySettingsScreen from "./FamilySettingsScreen";

const Tab = createBottomTabNavigator<ParentTabParamList>();

function tabIcon(emoji: string, focused: boolean): React.ReactElement {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
  );
}

export default function ParentTabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => tabIcon("🏠", focused),
        }}
      />
      <Tab.Screen
        name="Missions"
        component={ManageActivitiesScreen}
        options={{
          tabBarLabel: "Missions",
          tabBarIcon: ({ focused }) => tabIcon("📋", focused),
        }}
      />
      <Tab.Screen
        name="Academy"
        component={ManageClassesScreen}
        options={{
          tabBarLabel: "Academy",
          tabBarIcon: ({ focused }) => tabIcon("🎓", focused),
        }}
      />
      <Tab.Screen
        name="Treasure"
        component={RewardStoreScreen}
        options={{
          tabBarLabel: "Treasure",
          tabBarIcon: ({ focused }) => tabIcon("🎁", focused),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilySettingsScreen}
        options={{
          tabBarLabel: "Family",
          tabBarIcon: ({ focused }) => tabIcon("👨‍👩‍👧", focused),
        }}
      />
    </Tab.Navigator>
  );
}
