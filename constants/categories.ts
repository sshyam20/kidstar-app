import { ActivityCategory } from "../types";

export interface CategoryMeta {
  key: ActivityCategory;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "chore", label: "Chore", emoji: "🧹", color: "#FFE4B5" },
  { key: "homework", label: "Homework", emoji: "📚", color: "#B8D8F8" },
  { key: "behavior", label: "Behavior", emoji: "⭐", color: "#C3F0CA" },
  { key: "class", label: "Class", emoji: "🎓", color: "#E0C3FC" },
];

export function getCategoryMeta(key: ActivityCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}
