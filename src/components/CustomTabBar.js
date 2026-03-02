import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Solo mostramos los tabs que tengan un tabBarIcon definido
export function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();

    const visibleRoutes = state.routes.filter((route) => {
        const { options } = descriptors[route.key];
        // Si no tiene tabBarIcon, es un tab oculto — lo saltamos
        return !!options.tabBarIcon;
    });

    return (
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 6) }]}>
            {visibleRoutes.map((route) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === state.routes.indexOf(route);
                const color = isFocused ? Colors.primary : Colors.textSecondary;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        style={styles.tab}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        {options.tabBarIcon({ color, size: 24, focused: isFocused })}
                        <Text style={[styles.label, { color }]}>
                            {options.tabBarLabel || route.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 3,
    },
});
