import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomHeader = ({ title, showBack = null, leftAction = null, onLeftPress = null, leftIcon = null, rightAction = null, rightIcon = null }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    // Detectar si estamos dentro de un Stack y no en la pantalla raíz (index > 0)
    // state.type === 'stack' nos asegura que no estamos leyendo el estado del Tab navigator
    const stackDepth = useNavigationState(state => {
        if (!state || state.type !== 'stack') return 0;
        return state.index ?? 0;
    });

    // Si hay una acción explícita, mostrar flecha. Sino, mostrar flecha si el stack local tiene >1 pantalla.
    const actualLeftAction = leftAction || onLeftPress;
    const canGoBack = actualLeftAction ? true : (showBack !== null ? showBack : stackDepth > 0);

    console.log(`[CustomHeader] title="${title}" stackDepth=${stackDepth} canGoBack=${canGoBack}`);

    const handleLeftPress = () => {
        if (actualLeftAction) {
            actualLeftAction();
        } else if (canGoBack) {
            navigation.goBack();
        } else {
            navigation.openDrawer();
        }
    };

    return (
        <View style={[
            styles.wrapper, 
            { 
                paddingTop: insets.top,
                backgroundColor: colors.card,
                borderBottomColor: colors.border
            }
        ]}>
            <View style={styles.header}>
                {/* Botón izquierdo */}
                <TouchableOpacity style={styles.sideBtn} onPress={handleLeftPress}>
                    {(() => {
                        if (leftIcon) {
                            if (typeof leftIcon === 'string') {
                                if (leftIcon === 'menu') return <Menu size={24} color={colors.text} />;
                                if (leftIcon === 'arrow-left') return <ArrowLeft size={24} color={colors.text} />;
                            }
                            return leftIcon;
                        }
                        return canGoBack
                            ? <ArrowLeft size={24} color={colors.text} />
                            : <Menu size={24} color={colors.text} />;
                    })()}
                </TouchableOpacity>

                {/* Título centrado */}
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>

                {/* Botón derecho (opcional) */}
                <TouchableOpacity style={styles.sideBtn} onPress={rightAction} disabled={!rightAction}>
                    {rightIcon ? rightIcon : null}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderBottomWidth: 1,
        elevation: 4,
        ...Platform.select({
            web: { boxShadow: '0px 2px 3px rgba(0,0,0,0.25)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3,
            }
        })
    },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    sideBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
