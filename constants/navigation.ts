export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  CreateFamily: undefined;
  JoinFamily: undefined;
  Dashboard: undefined;
  ManageKids: undefined;
  AddKid: undefined;
  ManageActivities: undefined;
  AddActivity: { activityId?: string };
  ManageClasses: undefined;
  AddClass: { classId?: string };
  RewardStore: undefined;
  AddReward: { rewardId?: string };
  FamilySettings: undefined;
  KidView: undefined;
  Journal: { kidId: string; kidName: string };
  AddJournalEntry: { kidId: string; entryId?: string };
};
