import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Props {
  onAnimationComplete: () => void;
}

export function CustomSplashScreen({ onAnimationComplete }: Props) {
  const containerOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(20); // Start slightly below center

  useEffect(() => {
    // 1. Elegant slide up and fade in
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    logoTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) });

    // 2. Hold, then fade out everything smoothly
    containerOpacity.value = withDelay(
      2000, 
      withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
    
    // Optional: add a subtle slide-up to the logo as the container fades out
    logoTranslateY.value = withDelay(
      2000,
      withTiming(-20, { duration: 500, easing: Easing.inOut(Easing.ease) })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      pointerEvents: containerOpacity.value === 0 ? 'none' : 'auto',
    };
  });

  const logoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [
        { translateY: logoTranslateY.value }
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999, // Ensure it sits on top of everything
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: 24,
  },
});
