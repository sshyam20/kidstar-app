import { NavigatorScreenParams } from "@react-navigation/native";

export type ParentTabParamList = {
  Home: undefined;
  Missions: undefined;
  Academy: undefined;
  Treasure: undefined;
  Family: undefined;
};

export type RootStackParamList = {
  // Unauthenticated
  Landing: undefined;
  Login: undefined;
  // No family
  CreateFamily: undefined;
  JoinFamily: undefined;
  // Kid role
  KidView: undefined;
  // Parent role — tab navigator
  ParentTabs: NavigatorScreenParams<ParentTabParamList> | undefined;
  // Push / modal screens accessible from parent tabs
  ManageKids: undefined;
  AddKid: { kidId?: string };
  AddActivity: { activityId?: string };
  AddClass: { classId?: string };
  AddReward: { rewardId?: string };
  Journal: { kidId: string; kidName: string };
  AddJournalEntry: { kidId: string; entryId?: string };
};
