import React, { useState } from 'react';
import { View, Text, TextInput } from '@/components/tw';
import { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, className = '', ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && <Text className="text-text-dark font-medium mb-2 ml-1">{label}</Text>}
      <View 
        className={`flex-row items-center bg-surface border rounded-2xl px-4 h-14 ${
          error ? 'border-danger' : isFocused ? 'border-primary' : 'border-border'
        }`}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className={`flex-1 text-text-dark text-base ${className}`}
          placeholderTextColor="#9CA3AF"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          underlineColorAndroid="transparent"
          cursorColor="#7C3AED"
          selectionColor="rgba(124, 58, 237, 0.3)"
          {...props}
        />
      </View>
      {error && <Text className="text-danger text-sm mt-1 ml-1">{error}</Text>}
    </View>
  );
};
