import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Text, FlatList, TouchableOpacity } from 'react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Search, Car, Edit2, Plus, ShieldCheck } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

const VehicleItem = ({ vehicle, onPress, onEdit, colors }) => {
    const isLinked = !!vehicle.Manual_Tecnico_Path;
    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: isLinked ? colors.primary + '50' : colors.border, borderWidth: isLinked ? 1.5 : 1 }]}>
            <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={onPress}>
                <View style={[styles.iconContainer, { backgroundColor: isLinked ? colors.primary + '25' : colors.primary + '15' }]}>
                    {isLinked
                        ? <ShieldCheck size={24} color={colors.primary} />
                        : <Car size={24} color={colors.textSecondary} />}
                </View>
                <View style={styles.info}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.plate, { color: colors.primary }]}>{vehicle.Matricula || 'SIN MATRICULA'}</Text>
                        {isLinked && (
                            <View style={[styles.linkedBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                                <Text style={[styles.linkedText, { color: colors.primary }]}>VINCULADO</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.model, { color: colors.text }]}>{vehicle.Marca} {vehicle.Modelo} ({vehicle['Año de Fabricacion']})</Text>
                    <View style={styles.badgeRow}>
                        {!!vehicle.Color && <Text style={[styles.badge, { backgroundColor: colors.border, color: colors.textSecondary }]}>{vehicle.Color}</Text>}
                        {!!vehicle.Tipo && <Text style={[styles.badge, { backgroundColor: colors.border, color: colors.textSecondary }]}>{vehicle.Tipo}</Text>}
                    </View>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation && e.stopPropagation(); onEdit(); }}>
                <Edit2 size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

export default function VehicleManagerScreen({ navigation }) {
    const { vehiculos, loading } = useData();
    const { colors } = useTheme();
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader title="VEHICULOS" />
            <View style={styles.searchSection}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Buscar por placa o modelo..."
                        placeholderTextColor={colors.textSecondary}
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
                        colors={colors}
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
                ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No se encontraron vehículos</Text>}
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
    container: { flex: 1 },
    searchSection: { padding: 16, paddingBottom: 8 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1,
    },
    input: { flex: 1, fontSize: 16 },
    card: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, marginBottom: 12, padding: 15,
    },
    iconContainer: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center', marginRight: 15,
    },
    info: { flex: 1 },
    plate: { fontSize: 18, fontWeight: 'bold' },
    model: { fontSize: 14, marginTop: 2 },
    badgeRow: { flexDirection: 'row', marginTop: 8 },
    badge: {
        fontSize: 10, paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 4, marginRight: 6, textTransform: 'uppercase'
    },
    editBtn: { padding: 8 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
    linkedBadge: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
    },
    linkedText: {
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
