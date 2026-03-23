import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing,
    cancelAnimation
} from 'react-native-reanimated';
import { Settings } from 'lucide-react-native';
import { Colors } from '../constants';

export const PremiumLoader = ({ size = 60, color = Colors.primary }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 3000,
                easing: Easing.linear,
            }),
            -1, // Infinito
            false // No reversa (salto de 360 a 0)
        );
        
        return () => cancelAnimation(rotation);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const counterAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${-rotation.value}deg` }],
    }));

    return (
        <View style={styles.container}>
            {/* Gear Grande */}
            <Animated.View style={animatedStyle}>
                <Settings size={size} color={color} strokeWidth={1.5} />
            </Animated.View>
            
            {/* Gear Pequeño entrelazado */}
            <Animated.View style={[
                styles.secondGear, 
                counterAnimatedStyle,
                { 
                    top: size * 0.4,
                    left: -size * 0.2
                }
            ]}>
                <Settings size={size * 0.6} color={color} opacity={0.7} strokeWidth={1.5} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
    },
    secondGear: {
        position: 'absolute',
    }
});

