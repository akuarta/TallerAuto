import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { VehicleCard } from '../components/VehicleCard';
import { Search, LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Clock } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { addItem } from '../context/DataContext';
import { Alert } from 'react-native';

export default function GarageScreen({ navigation }) {
    const { garage, vehiculos, loading, orders, entradas, addItem, updateItem } = useData();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('Todos');

    const fields = ['TURNO', 'CLIENTE', 'MATRICULA', 'DATOS VEH.', 'TECNICO', 'ID_ESTADO', 'ESTADO'];

    const getActualMatricula = (matriculaId) => {
        if (!matriculaId) return 'Sin matrícula';
        const vehiculo = vehiculos?.find(v => v['ID Vehiculo'] === matriculaId || v.id === matriculaId || v.Matricula === matriculaId);
        return vehiculo?.Matricula ? vehiculo.Matricula : matriculaId;
    };

    // Obtener vehículos en el taller (órdenes pendientes o en proceso)
    const activeOrders = orders.filter(o =>
        o.Estado?.toLowerCase().includes('pendiente') ||
        o.Estado?.toLowerCase().includes('proceso')
    );

    // Obtener entradas registradas
    const registeredEntries = entradas || [];

    // Combinar datos para mostrar
    const garageVehicles = [
        ...activeOrders.map(order => ({
            ...order,
            type: 'orden',
            estado: order.Estado,
            fecha: order['Fecha Recepcion']
        })),
        ...registeredEntries.map(entry => ({
            ...entry,
            type: 'entrada',
            estado: entry.Estado || 'En Taller'
        }))
    ];

    // Filtrar
    const filteredVehicles = garageVehicles.filter(v => {
        const matchesSearch =
            String(getActualMatricula(v.Matricula) || '').toLowerCase().includes(search.toLowerCase()) ||
            String(v.Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            String(v.Marca || '').toLowerCase().includes(search.toLowerCase()) ||
            String(v['Detalles del vehiculo'] || '').toLowerCase().includes(search.toLowerCase());

        if (filterType === 'Todos') return matchesSearch;
        if (filterType === 'Pendiente') return matchesSearch && v.estado?.toLowerCase().includes('pendiente');
        if (filterType === 'En Proceso') return matchesSearch && v.estado?.toLowerCase().includes('proceso');
        return matchesSearch;
    });

    // Función para obtener color del estado
    const getStatusColor = (estado) => {
        const estadoLower = estado?.toLowerCase() || '';
        if (estadoLower.includes('pendiente')) return '#FFA500';
        if (estadoLower.includes('proceso')) return '#4169E1';
        if (estadoLower.includes('completada') || estadoLower.includes('completado')) return '#32CD32';
        return Colors.textSecondary;
    };

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    const isEmpty = filteredVehicles.length === 0;

    return (
        <View style={styles.container}>
            <CustomHeader title="EN TALLER" />
            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar por placa, cliente o vehículo..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filtros */}
                <View style={styles.filterContainer}>
                    <FlatList
                        horizontal
                        data={['Todos', 'Pendiente', 'En Proceso']}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    filterType === item && styles.filterButtonActive
                                ]}
                                onPress={() => setFilterType(item)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    filterType === item && styles.filterTextActive
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {isEmpty ? (
                    <View style={styles.emptyContainer}>
                        <LayoutDashboard size={64} color={Colors.textSecondary} />
                        <Text style={styles.emptyText}>No hay vehículos en el taller</Text>
                        <Text style={styles.emptySubtext}>Crea una orden para registrar entrada</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredVehicles}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.cardContainer}
                                onPress={() => navigation.navigate('GenericDetails', { item, title: 'Vehículo' })}
                            >
                                <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.Estado) }]} />
                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.clientName}>{item.Cliente || 'Sin cliente'}</Text>
                                        <Text style={[styles.statusBadge, { color: getStatusColor(item.Estado) }]}>
                                            {item.Estado || 'En Taller'}
                                        </Text>
                                    </View>
                                    <Text style={styles.vehicleInfo}>
                                        {getActualMatricula(item.Matricula)} - {item['Detalles del vehiculo'] || item.Marca + ' ' + item.Modelo}
                                    </Text>
                                    <View style={styles.cardFooter}>
                                        <View style={styles.dateInfo}>
                                            <Clock size={12} color={Colors.textSecondary} />
                                            <Text style={styles.dateText}>{item.fecha || item['Fecha Recepcion'] || 'Sin fecha'}</Text>
                                        </View>
                                        {item.type === 'orden' && (
                                            <Text style={styles.orderId}>Orden: {item.IdOrden}</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.actionButtons}>
                                    {item.type === 'orden' && item.Estado?.toLowerCase().includes('pendiente') && (
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                            // Registrar entrada y poner en proceso
                                            const entrada = {
                                                'N0. Entrada': 'HE' + String((entradas?.length || 0) + 1).padStart(3, '0'),
                                                'Cliente': item.Cliente,
                                                'Placa': getActualMatricula(item.Placa || item.Matricula),
                                                'Fecha Recepcion': new Date().toLocaleDateString(),
                                                'Estado': 'Entrada'
                                            };
                                            addItem('entradas', entrada);
                                            // Actualizar orden a "En Proceso"
                                            updateItem('orders', item.id, { Estado: 'En Proceso' });
                                            Alert.alert("Éxito", "Entrada registrada y orden puesta en proceso");
                                        }}>
                                            <ArrowDownCircle size={28} color={Colors.primary} />
                                        </TouchableOpacity>
                                    )}
                                    {item.type === 'orden' && item.Estado?.toLowerCase().includes('proceso') && (
                                        <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                            // Avisar que se debe completar la orden primero o registrar salida directa
                                            Alert.alert(
                                                "Confirmar Salida",
                                                "¿Deseas registrar la salida de este vehículo y marcar la orden como completada?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Sí, Salida", onPress: () => {
                                                            const salida = {
                                                                'N0. Salida': 'HS' + String((entradas?.length || 0) + 1).padStart(3, '0'),
                                                                'Cliente': item.Cliente,
                                                                'Placa': getActualMatricula(item.Placa || item.Matricula),
                                                                'Fecha Salida': new Date().toLocaleDateString(),
                                                                'Estado': 'Salida'
                                                            };
                                                            addItem('salidas', salida);
                                                            updateItem('orders', item.id, { Estado: 'Completada' });
                                                            Alert.alert("Éxito", "Salida registrada y orden completada");
                                                        }
                                                    }
                                                ]
                                            );
                                        }}>
                                            <ArrowUpCircle size={28} color={Colors.accent} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 16, flex: 1 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    filterContainer: { marginBottom: 12 },
    filterButton: {
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
        backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    filterButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
    filterTextActive: { color: '#FFF' },
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
    cardContainer: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusBar: { width: 4 },
    cardContent: { flex: 1, padding: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    clientName: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    statusBadge: { fontSize: 12, fontWeight: 'bold' },
    vehicleInfo: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    dateInfo: { flexDirection: 'row', alignItems: 'center' },
    dateText: { color: Colors.textSecondary, fontSize: 12, marginLeft: 4 },
    orderId: { color: Colors.primary, fontSize: 12 },
    actionButtons: { justifyContent: 'center', paddingHorizontal: 8 },
    actionBtn: { padding: 8 },
});
