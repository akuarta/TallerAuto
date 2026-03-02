import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';

const DetailItem = ({ label, value }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
);

// Campos técnicos a ocultar (IDs internos, referencias técnicas, etc.)
const hiddenFields = ['id', 'ref', 'pdf', 'PDF', 'firma', 'Firma', 'foto', 'Foto', 'fotos', 'Fotos', 'image', 'Image', 'images', 'Images'];

export default function GenericDetailsScreen({ route, navigation }) {
    const { item, title } = route.params;

    // Filtrar campos técnicos
    const visibleEntries = Object.entries(item).filter(([key]) => {
        const keyLower = key.toLowerCase();
        // Ocultar campos que contengan patrones técnicos
        return !hiddenFields.some(hidden => keyLower.includes(hidden.toLowerCase()));
    });

    return (
        <View style={styles.container}>
            <CustomHeader
                title={`DETALLE: ${title}`}
                showBack={true}
                leftAction={() => {
                    const titleLower = title.toLowerCase();
                    if (titleLower.includes('orden')) navigation.navigate('Orders');
                    else if (titleLower.includes('técnico') || titleLower.includes('tecnico')) {
                        if (titleLower.includes('detalle')) navigation.navigate('VehicleSearch');
                        else navigation.navigate('TechnicianList');
                    }
                    else if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) navigation.navigate('VehicleList');
                    else if (titleLower.includes('cliente')) navigation.navigate('ClientList');
                    else if (titleLower.includes('cita')) navigation.navigate('AppointmentList');
                    else if (titleLower.includes('facturando')) navigation.navigate('InvoicingList');
                    else navigation.navigate('Dashboard');
                }}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    {visibleEntries.map(([key, value]) => (
                        <DetailItem
                            key={key}
                            label={key.replace(/_/g, ' ').toUpperCase()}
                            value={value?.toString()}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 16 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + '40',
        paddingBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
        color: Colors.text,
        fontSize: 16,
    },
});
