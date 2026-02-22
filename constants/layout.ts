import { Dimensions, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

export const SCREEN_W = width;
export const SCREEN_H = height;

/** Whether the device has a narrow screen (iPhone SE / small Androids) */
export const isSmallScreen = width < 375;

/** Whether the device has a large screen (iPhone Pro Max / tablets) */
export const isLargeScreen = width >= 430;

/**
 * Linear scale relative to iPhone 14 base width (390pt).
 * Use for layout dimensions (widths, heights, padding).
 */
export function scale(size: number): number {
  return Math.round((width / 390) * size);
}

/**
 * Moderate scale — less aggressive than linear.
 * Use for font sizes so text doesn't grow/shrink too dramatically.
 * factor: 0 = no scaling, 1 = full linear scaling. Default 0.45.
 */
export function moderateScale(size: number, factor = 0.45): number {
  return Math.round(size + (scale(size) - size) * factor);
}

/** Safe horizontal padding that adapts to screen width */
export const horizontalPad = isSmallScreen ? 14 : isLargeScreen ? 28 : 20;

/** True when running as a web app in a browser */
export const isWeb = Platform.OS === "web";
