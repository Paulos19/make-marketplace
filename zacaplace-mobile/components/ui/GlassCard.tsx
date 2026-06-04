import React from 'react';
import { View } from '@/components/tw';
import { ViewProps, Platform, useColorScheme } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  isLight?: boolean;
}

export const GlassCard = ({ 
  children, 
  className = '', 
  style,
  isLight,
  ...props 
}: CardProps) => {
  const systemIsDark = useColorScheme() === 'dark';
  const isDark = isLight ? false : systemIsDark;

  return (
    <View 
      className={`${className}`} 
      style={[
        {
          backgroundColor: isDark ? 'rgba(18, 18, 22, 0.85)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 24,
        },
        Platform.select({
          ios: {
            shadowColor: isDark ? '#000000' : '#1E1B4B',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
          },
          android: {
            elevation: isDark ? 2 : 4,
          },
        }),
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
