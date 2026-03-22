import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Settings } from 'lucide-react-native';
import { Colors } from '../constants';

export const PremiumLoader = ({ size = 60, color = Colors.primary }) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [spinAnim]);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const spinCounter = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg']
    });

    return (
        <View style={styles.container}>
            {/* Gear Grande */}
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Settings size={size} color={color} strokeWidth={1.5} />
            </Animated.View>
            
            {/* Gear Pequeño entrelazado */}
            <Animated.View style={[
                styles.secondGear, 
                { 
                    transform: [{ rotate: spinCounter }],
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
        padding: 20,
    },
    secondGear: {
        position: 'absolute',
    }
});
