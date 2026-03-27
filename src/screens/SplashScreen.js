import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Wrench } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { PremiumLoader } from '../components/PremiumLoader';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: Platform.OS !== 'web',
            })
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Animated.View style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}>
                <View style={styles.logoContainer}>
                    <View style={styles.iconCircle}>
                        <Wrench size={50} color={colors.primary} />
                    </View>
                </View>
                <Text style={styles.title}>TALLER PREMIUM</Text>
                <Text style={styles.subtitle}>Gestión Automotriz Inteligente</Text>

                <View style={styles.loaderContainer}>
                    <PremiumLoader size={70} />
                    <Text style={styles.loadingText}>Sincronizando sistema...</Text>
                </View>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.version}>v2.5.0</Text>
            </View>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 20,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary + '40',
        elevation: 10,
        ...Platform.select({
            web: { boxShadow: `0 0 15px ${colors.primary}` },
            default: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 15,
            }
        })
    },
    title: {
        color: colors.text,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        color: colors.textSecondary,
        fontSize: 16,
        letterSpacing: 1,
        marginBottom: 50,
    },
    loaderContainer: {
        alignItems: 'center',
    },
    loadingText: {
        color: colors.textSecondary,
        marginTop: 15,
        fontSize: 14,
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
    },
    version: {
        color: colors.textSecondary,
        fontSize: 12,
        opacity: 0.5,
    }
});
