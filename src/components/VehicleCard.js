import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { Car, ChevronRight, Trash2, Edit2 } from 'lucide-react-native';

export const VehicleCard = ({ vehicle, onPress, onEdit, showMatricula = true }) => {
    return (
        <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.cardMain} onPress={onPress}>
                <View style={styles.iconContainer}>
                    <Car size={24} color={showMatricula ? Colors.primary : "#4CAF50"} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>{vehicle.Marca} {vehicle.Modelo}</Text>
                    {showMatricula ? (
                        <Text style={styles.subtitle}>{vehicle.Matricula || vehicle.Placa} • {vehicle['Año de Fabricacion'] || vehicle.Año}</Text>
                    ) : (
                        <Text style={styles.subtitle}>Modelo {vehicle['Año de Fabricacion'] || vehicle.Año} • {vehicle.Tipo || 'Disponible'}</Text>
                    )}
                </View>
            </TouchableOpacity>

            <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Trash2 size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                    <Edit2 size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B599820',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
});
