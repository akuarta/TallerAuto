import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Search, User, ChevronRight, Phone, Trash2, Edit2, Car } from 'lucide-react-native';

const ClientCard = ({ client, onPress, onEdit, vehicles, onAddVehicle }) => (
    <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.cardMain} onPress={onPress}>
            <View style={styles.iconContainer}>
                <User size={24} color={Colors.primary} />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{client.Nombre}</Text>
                <View style={styles.subtextRow}>
                    <Phone size={14} color={Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={styles.subtitle}>{client.Telefono || 'Sin teléfono'}</Text>
                </View>
                {vehicles && vehicles.length > 0 && (
                    <View style={styles.vehicleContainer}>
                        <Car size={12} color={Colors.accent} style={{ marginRight: 4 }} />
                        <Text style={styles.vehicleText}>
                            {vehicles.map(v => `${v.Marca} ${v.Modelo} (${v.Matricula})`).join(', ')}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={onAddVehicle}>
                <Car size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                <Edit2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
        </View>
    </View>
);

import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

export default function ClientListScreen({ navigation }) {
    const { clients, loading, vehiculos, getVehiculosByCliente } = useData();
    const [search, setSearch] = useState('');

    // Campos visibles para el usuario (no técnicos)
    const fields = ['DNI', 'Nombre', 'Telefono', 'Direccion', 'Notas', 'Vehículo'];

    const filteredClients = clients.filter(c =>
        (c.Nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (String(c.Telefono || '')).includes(search)
    );

    // Función para obtener vehículos de un cliente
    const getClientVehicles = (item) => {
        return getVehiculosByCliente(item.Nombre);
    };

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="CLIENTES" />
            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <FlatList
                style={{ flex: 1 }}
                data={filteredClients}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ClientCard
                        client={item}
                        vehicles={getClientVehicles(item)}
                        onPress={() => navigation.navigate('GenericDetails', { item, title: 'Cliente' })}
                        onEdit={() => navigation.navigate('Form', {
                            title: 'Cliente',
                            dataKey: 'clients',
                            item,
                            fields
                        })}
                        onAddVehicle={() => navigation.navigate('Form', {
                            title: 'Vehículo',
                            dataKey: 'vehiculos',
                            fields: ['ID Vehiculo', 'Matricula', 'Marca', 'Modelo', 'Año de Fabricacion', 'Color', 'Codigo VIN', 'Notas'],
                            prefill: { Cliente: item.Nombre }
                        })}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
            <FAB onPress={() => navigation.navigate('Form', { title: 'Cliente', dataKey: 'clients', fields })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 8 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    cardContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B599820',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    info: { flex: 1 },
    title: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    subtextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subtitle: { color: Colors.textSecondary, fontSize: 14 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
    vehicleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        backgroundColor: '#3B599820',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start'
    },
    vehicleText: { color: Colors.accent, fontSize: 11, fontWeight: '500' },
});
