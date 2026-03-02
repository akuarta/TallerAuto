import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { FileText, Calendar, DollarSign, ChevronRight, Trash2, Edit2, Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { Alert } from 'react-native';
import { FAB } from '../components/FAB';

export default function InvoiceListScreen({ navigation }) {
    const { invoices, loading, orders, updateItem } = useData();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    // Campos para factura
    const fields = ['Factura', 'IdOrden', 'Cliente', 'Detalles del vehiculo', 'Total', 'Impuestos', 'Subtotal', 'Descuentos', 'Estado'];

    const handleMarkAsPaid = (invoice) => {
        updateItem('invoices', invoice.id, { Estado: 'Pagada' });
        Alert.alert("Éxito", "Factura marcada como pagada");
    };

    // Obtener facturas
    const allInvoices = invoices || [];

    // Función para obtener color del estado de pago
    const getPaymentColor = (estado) => {
        const estadoLower = estado?.toLowerCase() || '';
        if (estadoLower.includes('pagado') || estadoLower.includes('pagada')) return '#32CD32';
        if (estadoLower.includes('pendiente')) return '#FFA500';
        if (estadoLower.includes('cancelado')) return '#FF6347';
        return Colors.textSecondary;
    };

    // Función para obtener icono de estado
    const getPaymentIcon = (estado) => {
        const estadoLower = estado?.toLowerCase() || '';
        if (estadoLower.includes('pagado') || estadoLower.includes('pagada')) return <CheckCircle size={16} color="#32CD32" />;
        if (estadoLower.includes('pendiente')) return <Clock size={16} color="#FFA500" />;
        if (estadoLower.includes('cancelado')) return <XCircle size={16} color="#FF6347" />;
        return <Clock size={16} color={Colors.textSecondary} />;
    };

    // Filtrar facturas
    const filteredInvoices = allInvoices.filter(inv => {
        const matchesSearch =
            String(inv.Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
            String(inv.Factura || '').toLowerCase().includes(search.toLowerCase()) ||
            String(inv.IdOrden || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterStatus === 'Todos' ||
            inv.Estado?.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="FACTURACIÓN" />

            {/* Buscador */}
            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por cliente o factura..."
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filtros */}
            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    data={['Todos', 'Pagado', 'Pendiente', 'Cancelado']}
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
                data={filteredInvoices}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => navigation.navigate('GenericDetails', { item, title: 'Factura' })}
                        >
                            <View style={[styles.statusIndicator, { backgroundColor: getPaymentColor(item.Estado) }]} />
                            <FileText size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.title}>Factura #{item.Factura || item.IdOrden}</Text>
                                    {getPaymentIcon(item.Estado)}
                                </View>
                                <Text style={styles.subtitle}>{item.Cliente || 'Sin cliente'}</Text>
                                {item['Detalles del vehiculo'] && (
                                    <Text style={styles.vehicleText}>{item['Detalles del vehiculo']}</Text>
                                )}
                                {item.IdOrden && (
                                    <Text style={styles.orderText}>Orden: {item.IdOrden}</Text>
                                )}
                            </View>
                            <View style={styles.amountContainer}>
                                <Text style={styles.amount}>${item.Total || '0'}</Text>
                                <Text style={[styles.statusText, { color: getPaymentColor(item.Estado) }]}>
                                    {item.Estado || 'Pendiente'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actionIcons}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={() => navigation.navigate('Form', {
                                    title: 'Factura',
                                    dataKey: 'invoices',
                                    item,
                                    fields
                                })}
                            >
                                <Edit2 size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                            {item.Estado?.toLowerCase().includes('pendiente') && (
                                <TouchableOpacity
                                    style={styles.iconBtn}
                                    onPress={() => handleMarkAsPaid(item)}
                                >
                                    <CheckCircle size={18} color={Colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
                nestedScrollEnabled={true}
            />
            <FAB onPress={() => {
                // Solo mostrar órdenes completadas para facturar
                const completedOrders = orders.filter(o =>
                    o.Estado?.toLowerCase().includes('completada') ||
                    o.Estado?.toLowerCase().includes('completado')
                );

                if (completedOrders.length > 0) {
                    // Navegar al formulario con la primera orden completada
                    navigation.navigate('Form', {
                        title: 'Factura',
                        dataKey: 'invoices',
                        fields,
                        prefill: {
                            IdOrden: completedOrders[0].IdOrden,
                            Cliente: completedOrders[0].Cliente,
                            'Detalles del vehiculo': completedOrders[0]['Detalles del vehiculo'],
                            Total: completedOrders[0].Total || '0',
                            Estado: 'Pendiente'
                        }
                    });
                } else {
                    navigation.navigate('Form', { title: 'Factura', dataKey: 'invoices', fields });
                }
            }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 8 },
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
    cardContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    statusIndicator: { width: 3, height: '100%', position: 'absolute', left: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
    vehicleText: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    orderText: { color: Colors.primary, fontSize: 11, marginTop: 2 },
    amountContainer: { alignItems: 'flex-end', marginLeft: 8 },
    amount: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
    statusText: { fontSize: 11, fontWeight: '500', marginTop: 2 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
});
