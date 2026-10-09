// components/ui/LifecycleAnimation.tsx
// A small stage-specific animation for the lettuce lifecycle — Seedling/Thinning/Soil Planting/Mature — built
// from Ionicons + React Native's built-in Animated API (loops of translate/scale/rotate/opacity,
// all useNativeDriver: true). This is a stylized, icon-based representation, not illustrated
// artwork — there's no Lottie/SVG asset pipeline in this project.
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';
import { LettuceStage } from '../../data/mockData';

function useLoop(duration: number, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    const anim = Animated.loop(
      Animated.timing(value, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [duration, delay]);
  return value;
}

function SeedlingAnimation({ size }: { size: number }) {
  const drop1 = useLoop(1400, 0);
  const drop2 = useLoop(1400, 350);
  const drop3 = useLoop(1400, 700);

  const dropStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.28, size * 0.05] }) }],
  });

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <View style={styles.dropRow}>
        <Animated.View style={dropStyle(drop1)}>
          <Ionicons name="water" size={size * 0.14} color={colors.mint} />
        </Animated.View>
        <Animated.View style={dropStyle(drop2)}>
          <Ionicons name="water" size={size * 0.14} color={colors.mint} />
        </Animated.View>
        <Animated.View style={dropStyle(drop3)}>
          <Ionicons name="water" size={size * 0.14} color={colors.mint} />
        </Animated.View>
      </View>
      <Ionicons name="leaf" size={size * 0.4} color={colors.textDarkGreen} />
    </View>
  );
}

function GrowthAnimation({ size }: { size: number }) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(value, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const leafStyle = {
    opacity: value,
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [size * 0.05, -size * 0.14] }) },
      { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
    ],
  };

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Animated.View style={[styles.growthLeaf, leafStyle]}>
        <Ionicons name="leaf" size={size * 0.34} color={colors.textDarkGreen} />
      </Animated.View>
      <Ionicons name="ellipse" size={size * 0.16} color={colors.mintHover} />
    </View>
  );
}

function SoilPlantingAnimation({ size }: { size: number }) {
  const value = useLoop(1600);
  const drop = value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-size * 0.12, size * 0.02, -size * 0.12] });

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ translateY: drop }] }}>
        <Ionicons name="leaf" size={size * 0.36} color={colors.textDarkGreen} />
      </Animated.View>
      <Ionicons name="ellipse" size={size * 0.2} color={colors.mintHover} style={{ marginTop: -size * 0.04 }} />
    </View>
  );
}

function MatureAnimation({ size }: { size: number }) {
  const value = useLoop(6000);
  const rotate = value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.center, { width: size, height: size }]}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="leaf" size={size * 0.46} color={colors.textDarkGreen} />
      </Animated.View>
    </View>
  );
}

export default function LifecycleAnimation({ stage, size = 88 }: { stage: LettuceStage; size?: number }) {
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }]}>
      {stage === 'seedling' && <SeedlingAnimation size={size} />}
      {stage === 'thinning' && <GrowthAnimation size={size} />}
      {stage === 'soil-planting' && <SoilPlantingAnimation size={size} />}
      {stage === 'mature' && <MatureAnimation size={size} />}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { backgroundColor: colors.metricTintSoil, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  dropRow: { flexDirection: 'row', gap: 6, position: 'absolute', top: '18%' },
  growthLeaf: { position: 'absolute' },
});
