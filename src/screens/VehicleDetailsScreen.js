import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';

const DetailItem = ({ label, value }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

export default function VehicleDetailsScreen({ route }) {
    const { vehicle, isCatalog = false } = route.params;

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <CustomHeader title="DETALLES" />
            <ScrollView style={styles.container}>
                <View style={styles.headerSection}>
                    <Text style={styles.header}>{vehicle.Marca} {vehicle.Modelo}</Text>
                    <Text style={styles.subHeader}>
                        {vehicle['Año de Fabricacion'] || vehicle.Año || ''} {(vehicle.Matricula) ? `• ${vehicle.Matricula}` : ''}
                    </Text>
                </View>

                <View style={styles.section}>
                    {Object.entries(vehicle).map(([key, value]) => {
                        if (['id', 'Marca', 'Modelo', 'Placa', 'Matricula'].includes(key)) return null;
                        if (!value) return null;
                        return <DetailItem key={key} label={key} value={value.toString()} />;
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        padding: 16,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    section: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        margin: 16,
        marginTop: 0,
        padding: 16,
    },
    itemContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
});
