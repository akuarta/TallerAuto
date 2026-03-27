import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Car, Trash2, Edit2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export const VehicleCard = ({ vehicle, onPress, onEdit, showMatricula = true }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.cardMain} onPress={onPress}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Car size={24} color={showMatricula ? colors.primary : "#4CAF50"} />
                </View>
                <View style={styles.info}>
                    <Text style={[styles.title, { color: colors.text }]}>{vehicle.Marca} {vehicle.Modelo}</Text>
                    {showMatricula ? (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{vehicle.Matricula || vehicle.Placa} • {vehicle['Año de Fabricacion'] || vehicle.Año}</Text>
                    ) : (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Modelo {vehicle['Año de Fabricacion'] || vehicle.Año} • {vehicle.Tipo || 'Disponible'}</Text>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Trash2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                    <Edit2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row', 
        alignItems: 'center', 
        borderRadius: 12, 
        marginBottom: 10, 
        paddingHorizontal: 12, 
        paddingVertical: 10,
        borderWidth: 1,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
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
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
});
