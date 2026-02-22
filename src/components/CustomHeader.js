import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Menu, Search, CheckSquare, RotateCw, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../constants';
import { useNavigation } from '@react-navigation/native';

export const CustomHeader = ({ title, showBack = null, leftAction = null, leftIcon = null }) => {
    const navigation = useNavigation();

    // Si hay una acción personalizada, la usamos. Si no, detectamos automáticamente
    const canGoBack = leftAction ? true : (showBack !== null ? showBack : navigation.canGoBack());

    const handleLeftPress = () => {
        if (leftAction) {
            leftAction();
        } else if (canGoBack) {
            navigation.goBack();
        } else {
            navigation.openDrawer();
        }
    };

    return (
        <View style={styles.header}>
            <View style={styles.left}>
                {leftIcon ? (
                    <TouchableOpacity onPress={handleLeftPress}>
                        {leftIcon}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleLeftPress}>
                        {canGoBack ? (
                            <ArrowLeft size={24} color={Colors.text} />
                        ) : (
                            <Menu size={24} color={Colors.text} />
                        )}
                    </TouchableOpacity>
                )}
                <View style={styles.logoPlaceholder}>
                    <Text style={styles.logoText}>TA</Text>
                </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <View style={styles.right}>
                <TouchableOpacity style={styles.iconButton}>
                    <Search size={22} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <CheckSquare size={22} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <RotateCw size={22} color={Colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 60,
        backgroundColor: '#1A1A1A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 32,
        height: 32,
        backgroundColor: Colors.primary,
        borderRadius: 4,
        marginLeft: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    title: {
        flex: 1,
        color: Colors.text,
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
    },
    right: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 16,
    },
});
