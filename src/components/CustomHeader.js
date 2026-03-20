import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../constants';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CustomHeader = ({ title, showBack = null, leftAction = null, leftIcon = null, rightAction = null, rightIcon = null }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const canGoBack = leftAction ? true : (showBack !== null ? showBack : navigation.canGoBack());

    const handleLeftPress = () => {
        if (leftAction) {
            leftAction();
        } else if (canGoBack) {
            // Si estamos dentro de un tab oculto (como Form), forzar volver al stack principal si goBack falla
            navigation.goBack();
        } else {
            navigation.openDrawer();
        }
    };

    return (
        <View style={[styles.wrapper, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                {/* Botón izquierdo */}
                <TouchableOpacity style={styles.sideBtn} onPress={handleLeftPress}>
                    {leftIcon ? leftIcon : (
                        canGoBack
                            ? <ArrowLeft size={24} color={Colors.text} />
                            : <Menu size={24} color={Colors.text} />
                    )}
                </TouchableOpacity>

                {/* Título centrado */}
                <Text style={styles.title} numberOfLines={1}>{title}</Text>

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
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
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
        color: Colors.text,
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
