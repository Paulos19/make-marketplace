// NativeWind v4 - Image component with expo-image
import React from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Image as RNImage } from "expo-image";

const AnimatedExpoImage = Animated.createAnimatedComponent(RNImage);

export type ImageProps = React.ComponentProps<typeof AnimatedExpoImage> & {
  className?: string;
};

export const Image = React.forwardRef<any, ImageProps>((props, ref) => {
  const { style, ...rest } = props;
  // @ts-expect-error: Remap objectFit style to contentFit property
  const { objectFit, objectPosition, ...flatStyle } =
    StyleSheet.flatten(style) || {};

  return (
    <AnimatedExpoImage
      ref={ref}
      contentFit={objectFit as any}
      contentPosition={objectPosition as any}
      {...rest}
      source={
        typeof props.source === "string" ? { uri: props.source } : props.source
      }
      // @ts-expect-error: Style is remapped above
      style={flatStyle}
    />
  );
});

Image.displayName = "Image";
