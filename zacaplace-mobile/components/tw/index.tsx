// NativeWind v4 - className is supported natively via Babel transform.
// These re-exports provide a stable import path for all components.

import { Link as RouterLink } from "expo-router";
import Animated from "react-native-reanimated";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TouchableHighlight as RNTouchableHighlight,
  TextInput as RNTextInput,
} from "react-native";

// Re-exports — NativeWind v4 injects className support automatically
export const View = RNView;
export const Text = RNText;
export const Pressable = RNPressable;
export const ScrollView = RNScrollView;
export const TextInput = RNTextInput;
export const TouchableHighlight = RNTouchableHighlight;
export const Link = RouterLink;

// AnimatedScrollView
export const AnimatedScrollView = Animated.ScrollView;

// Type exports
export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};
