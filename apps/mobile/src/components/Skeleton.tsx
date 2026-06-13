import React, { useEffect, useRef } from 'react';
import { Animated, View, Platform, ViewStyle } from 'react-native';

const useNative = Platform.OS !== 'web';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/** Bloco cinza com animação de pulse, base para telas de carregamento. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: useNative }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: useNative }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: '#E2E8F0', opacity },
        style,
      ]}
    />
  );
}

/** Lista de cartões fantasma para o modal de atribuição de formulários. */
export function FormListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          className="flex-row items-center p-3 rounded-xl mb-2 border border-border"
        >
          <Skeleton width={28} height={28} radius={14} style={{ marginRight: 12 }} />
          <View className="flex-1">
            <Skeleton width="40%" height={10} style={{ marginBottom: 6 }} />
            <Skeleton width="75%" height={12} style={{ marginBottom: 6 }} />
            <Skeleton width="55%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}
