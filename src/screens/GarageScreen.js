import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { VehicleCard } from '../components/VehicleCard';
import { Search, LayoutDashboard } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

import { FAB } from '../components/FAB';

export default function GarageScreen({ navigation }) {
    const { garage, loading } = useData();
    const [search, setSearch] = useState('');

    const fields = ['TURNO', 'CLIENTE', 'MATRICULA ', 'DATOS VEH.', 'FECHA ENTRADA', 'ESTADO'];

    const filteredVehicles = garage.filter(v =>
        (v['MATRICULA ']?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (v.CLIENTE?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (v['DATOS VEH.']?.toLowerCase() || '').includes(search.toLowerCase())
    );

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    const isEmpty = garage.length === 0;

    return (
        <View style={styles.container}>
            <CustomHeader title="GARAGE" />
            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar por matrícula o marca..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                
                {isEmpty ? (
                    <View style={styles.emptyContainer}>
                        <LayoutDashboard size={64} color={Colors.textSecondary} />
                        <Text style={styles.emptyText}>No hay vehículos guardados en el garage</Text>
                        <Text style={styles.emptySubtext}>Presiona el botón + para agregar un vehículo</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredVehicles}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <VehicleCard
                                vehicle={{
                                    Matricula: item['MATRICULA '],
                                    Marca: item['DATOS VEH.'],
                                    Modelo: '',
                                    Año: ''
                                }}
                                showMatricula={true}
                                onPress={() => navigation.navigate('GenericDetails', { item, title: 'Vehículo Garage' })}
                                onEdit={() => navigation.navigate('Form', {
                                    title: 'Vehículo',
                                    dataKey: 'garage',
                                    item,
                                    fields
                                })}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>
            <FAB onPress={() => navigation.navigate('Form', { title: 'Vehículo', dataKey: 'garage', fields })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 16, flex: 1 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});
