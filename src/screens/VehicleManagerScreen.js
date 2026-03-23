import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Search, Car, Edit2, Plus, ShieldCheck } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

const VehicleItem = ({ vehicle, onPress, onEdit }) => {
    const isLinked = !!vehicle.Manual_Tecnico_Path;
    return (
        <View style={[styles.card, isLinked && styles.cardLinked]}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={onPress}>
                <View style={[styles.iconContainer, isLinked && { backgroundColor: Colors.primary + '25' }]}>
                    {isLinked
                        ? <ShieldCheck size={24} color={Colors.primary} />
                        : <Car size={24} color={Colors.textSecondary} />}
                </View>
                <View style={styles.info}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.plate}>{vehicle.Matricula || 'SIN MATRICULA'}</Text>
                        {isLinked && (
                            <View style={styles.linkedBadge}>
                                <Text style={styles.linkedText}>VINCULADO</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.model}>{vehicle.Marca} {vehicle.Modelo} ({vehicle['Año de Fabricacion']})</Text>
                    <View style={styles.badgeRow}>
                        {!!vehicle.Color && <Text style={styles.badge}>{vehicle.Color}</Text>}
                        {!!vehicle.Tipo && <Text style={styles.badge}>{vehicle.Tipo}</Text>}
                    </View>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation && e.stopPropagation(); onEdit(); }}>
                <Edit2 size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

export default function VehicleManagerScreen({ navigation }) {
    const { vehiculos, loading } = useData();
    const [search, setSearch] = useState('');

    const fields = [
        'ID_Vehiculo',
        'Matricula',
        'Marca',
        'Modelo',
        'Año de Fabricacion',
        'Codigo VIN',
        'Color',
        'Tipo',
        'Motor',
        'Transmision',
        'Cliente/Propietario'
    ];

    const filteredVehicles = (vehiculos || []).filter(v =>
        String(v.Matricula || '').toLowerCase().includes(search.toLowerCase()) ||
        String(v.Modelo || '').toLowerCase().includes(search.toLowerCase()) ||
        String(v.Marca || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <CustomHeader title="VEHICULOS" />
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar por placa o modelo..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredVehicles}
                keyExtractor={(item, index) => item['ID Vehiculo'] || index.toString()}
                renderItem={({ item }) => (
                    <VehicleItem
                        vehicle={item}
                        onPress={() => navigation.navigate('VehicleDetails', { vehicle: item })}
                        onEdit={() => navigation.navigate('Form', {
                            title: 'Vehículo',
                            dataKey: 'vehiculos',
                            item,
                            fields
                        })}
                    />
                )}
                contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1 }}
                nestedScrollEnabled={true}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron vehículos</Text>}
            />

            <FAB onPress={() => navigation.navigate('Form', {
                title: 'Vehículo',
                dataKey: 'vehiculos',
                fields
            })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchSection: { padding: 16, paddingBottom: 8 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 12, padding: 15,
        borderWidth: 1, borderColor: Colors.border,
    },
    iconContainer: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B599820',
        justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    info: { flex: 1 },
    plate: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
    model: { color: Colors.text, fontSize: 14, marginTop: 2 },
    badgeRow: { flexDirection: 'row', marginTop: 8 },
    badge: {
        backgroundColor: '#333', color: Colors.textSecondary,
        fontSize: 10, paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 4, marginRight: 6, textTransform: 'uppercase'
    },
    editBtn: { padding: 8 },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
    cardLinked: {
        borderColor: Colors.primary + '50',
        borderWidth: 1.5,
    },
    linkedBadge: {
        backgroundColor: Colors.primary + '20',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    linkedText: {
        color: Colors.primary,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
