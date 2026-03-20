import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Clipboard, ChevronRight, Trash2, Edit2, Search, Filter } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

export default function OrderListScreen({ navigation }) {
    const { orders, loading, clients, vehiculos, tecnicos } = useData();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    // Campos para el formulario de orden
    const fields = ['ID_Orden', 'Fecha Recepcion', 'Cliente', 'Matricula', 'Detalles del vehiculo', 'Estado', 'Total'];

    // Estados disponibles para filtro
    const statusOptions = ['Todos', 'Pendientes', 'En Proceso', 'Completada', 'Cancelada'];

    // Filtrar órdenes
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.Cliente?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (getActualMatricula(order.Matricula)?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (order.IdOrden?.toLowerCase() || '').includes(search.toLowerCase());

        const matchesStatus = filterStatus === 'Todos' ||
            order.Estado?.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Función para obtener color del estado
    const getStatusColor = (estado) => {
        const estadoLower = estado?.toLowerCase() || '';
        if (estadoLower.includes('pendiente')) return '#FFA500';
        if (estadoLower.includes('proceso')) return '#4169E1';
        if (estadoLower.includes('completada') || estadoLower.includes('completado')) return '#32CD32';
        if (estadoLower.includes('cancelada') || estadoLower.includes('cancelado')) return '#FF6347';
        return Colors.textSecondary;
    };

    // Resuelve la matrícula real si el campo contiene el ID_Vehiculo
    const getActualMatricula = (matriculaId) => {
        if (!matriculaId) return 'Sin matrícula';
        const vehiculo = vehiculos?.find(v => v['ID Vehiculo'] === matriculaId || v.id === matriculaId || v.Matricula === matriculaId);
        return vehiculo?.Matricula ? vehiculo.Matricula : matriculaId;
    };

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="ORDENES" />

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por cliente, placa o problema..."
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filtros de estado */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={statusOptions}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                filterStatus === item && styles.filterButtonActive
                            ]}
                            onPress={() => setFilterStatus(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                filterStatus === item && styles.filterTextActive
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredOrders}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => navigation.navigate('GenericDetails', { item, title: 'Orden' })}
                        >
                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.Estado) }]} />
                            <View style={styles.iconCircle}>
                                <Clipboard color={Colors.primary} size={22} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.Cliente || 'Sin Cliente'}</Text>
                                <Text style={styles.subtitle}>
                                    {getActualMatricula(item.Matricula)} - {item['Detalles del vehiculo'] || 'Sin vehículo'}
                                </Text>
                                <View style={styles.extraInfo}>
                                    <Text style={styles.problemText}>{item.Problema || 'Sin descripción'}</Text>
                                    <Text style={[styles.statusText, { color: getStatusColor(item.Estado) }]}>
                                        {item.Estado}
                                    </Text>
                                </View>
                                {item.Tecnico && (
                                    <Text style={styles.techText}>Técnico: {item.Tecnico}</Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actionIcons}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('Form', {
                                    title: 'Orden',
                                    dataKey: 'orders',
                                    item,
                                    fields
                                })}
                            >
                                <Edit2 size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
                nestedScrollEnabled={true}
            />
            <FAB onPress={() => navigation.navigate('Form', { title: 'Orden', dataKey: 'orders', fields })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 8 },
    cardContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconCircle: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#252525',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    title: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginBottom: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
    filterContainer: { marginBottom: 8, paddingHorizontal: 8 },
    filterButton: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8,
        backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    },
    filterButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '500' },
    filterTextActive: { color: '#FFF' },
    statusIndicator: { width: 4, height: '100%', position: 'absolute', left: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
    extraInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    problemText: { color: Colors.textSecondary, fontSize: 12, flex: 1 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    techText: { color: Colors.primary, fontSize: 11, marginTop: 4 },
});
