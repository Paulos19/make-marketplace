import React from 'react';
import { Pressable, Text } from '@/components/tw';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
  colors?: readonly [string, string, ...string[]];
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GradientButton = ({
  title,
  onPress,
  disabled = false,
  className = '',
  colors = ['#7C3AED', '#A855F7'],
  icon
}: GradientButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      className={`rounded-2xl overflow-hidden ${disabled ? 'opacity-50' : ''} ${className}`}
      style={animatedStyle}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {icon}
        <Text className="text-white font-bold text-lg">{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};
