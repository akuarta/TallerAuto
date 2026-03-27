import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Folder } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export const CategoryCard = ({ title, subtitle, onPress, icon }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                {icon || <Folder size={24} color={colors.primary} />}
            </View>
            <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
});
