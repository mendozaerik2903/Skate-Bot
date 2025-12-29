import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';

interface TimerBarProps {
  duration: number; // in milliseconds
  onComplete?: () => void;
  style?: ViewStyle;
}

export default function TimerBar({ duration, onComplete, style }: TimerBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0); // reset to 0 each time it's rendered

    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      onComplete?.();
    });
  }, [duration]);

  const widthInterpolated = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        style,
        { width: widthInterpolated },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 4,
    backgroundColor: 'black',
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
});
