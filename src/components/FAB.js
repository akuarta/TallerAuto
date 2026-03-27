import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export const FAB = ({ onPress, icon }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={onPress}>
            {icon || <Plus size={32} color="white" />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 1000,
    },
});
