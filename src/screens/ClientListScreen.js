import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { Search, User, ChevronRight, Phone, Trash2, Edit2, Car } from 'lucide-react-native';

import { Star, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';
import { formatCurrency } from '../utils/formatters';

const ClientCard = ({ client, onPress, onEdit, vehicles, onAddVehicle, onCall, reputation, colors }) => (
    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.cardMain} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <User size={24} color={colors.primary} />
            </View>
            <View style={styles.info}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: colors.text }]}>{client.Nombre}</Text>
                    {reputation?.frecuenciaRegateo > 0 && (
                        <View style={styles.warningBadge}>
                            <AlertTriangle size={12} color="#FF6347" />
                            <Text style={styles.warningText}> Regateo Frecuente</Text>
                        </View>
                    )}
                </View>

                <View style={styles.reputationRow}>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                size={12}
                                color={s <= (reputation?.estrellas || 3) ? "#FFD700" : colors.textSecondary + '40'}
                                fill={s <= (reputation?.estrellas || 3) ? "#FFD700" : "transparent"}
                            />
                        ))}
                    </View>
                    <Text style={[styles.pointsText, { color: colors.textSecondary }]}>{reputation?.puntos} pts</Text>
                </View>

                <View style={styles.subtextRow}>
                    <Phone size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{client.Telefono || 'Sin teléfono'}</Text>
                </View>

                {reputation && (reputation.totalPropinas > 0 || reputation.totalRegateos > 0) && (
                    <View style={styles.statsRow}>
                        {reputation.totalPropinas > 0 && (
                            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
                                <TrendingUp size={10} color="#32CD32" />
                                <Text style={[styles.statText, { color: '#32CD32' }]}>{formatCurrency(reputation.totalPropinas)}</Text>
                            </View>
                        )}
                        {reputation.totalRegateos > 0 && (
                            <View style={[styles.statItem, { backgroundColor: colors.background }]}>
                                <TrendingDown size={10} color="#FF6347" />
                                <Text style={[styles.statText, { color: '#FF6347' }]}>{formatCurrency(reputation.totalRegateos)}</Text>
                            </View>
                        )}
                    </View>
                )}

                {vehicles && vehicles.length > 0 && (
                    <View style={[styles.vehicleContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Car size={12} color={colors.accent} style={{ marginRight: 4 }} />
                        <Text style={[styles.vehicleText, { color: colors.accent }]}>
                            {vehicles.map(v => `${v.Marca} ${v.Modelo} (${v.Matricula})`).join(', ')}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={onCall}>
                <View style={styles.callCircle}>
                    <Phone size={18} color="#FFF" />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onAddVehicle}>
                <Car size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                <Edit2 size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    </View>
);

export default function ClientListScreen({ navigation }) {
    const { clients, loading, vehiculos, getVehiculosByCliente, ...allData } = useData();
    const { colors } = useTheme();
    const [search, setSearch] = useState('');

    // Campos visibles para el usuario (no técnicos)
    const fields = ['ID_Cliente', 'Nombre', 'Telefono', 'Direccion', 'Notas'];

    const filteredClients = clients.filter(c =>
        (c.Nombre?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (String(c.Telefono || '')).includes(search)
    );

    // Función para obtener vehículos de un cliente
    const getClientVehicles = (item) => {
        return getVehiculosByCliente(item.Nombre);
    };

    const handleCall = (phoneNumber) => {
        if (!phoneNumber) {
            Alert.alert('Atención', 'Este cliente no tiene un teléfono registrado.');
            return;
        }

        // Limpiar el número de espacios o caracteres raros
        const numStr = String(phoneNumber || '');
        const cleanNumber = numStr.replace(/[^0-9+]/g, '');
        const url = `tel:${cleanNumber}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert('Error', 'Tu dispositivo no soporta realizar llamadas telefónicas.');
                }
            })
            .catch((err) => console.error('Error al intentar llamar:', err));
    };

    if (loading) return <View style={[styles.container, { backgroundColor: colors.background }]}><Text style={{ color: colors.text }}>Cargando...</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader title="CLIENTES" />
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    placeholderTextColor={colors.textSecondary}
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
                        colors={colors}
                        reputation={allData.getClientReputation(item.Nombre)}
                        vehicles={getClientVehicles(item)}
                        onCall={() => handleCall(item.Telefono)}
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
    container: { flex: 1, padding: 8 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 8, marginBottom: 16,
        borderWidth: 1,
    },
    input: { flex: 1, fontSize: 16 },
    cardContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10,
        borderWidth: 1,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold' },
    subtextRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    subtitle: { fontSize: 14 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
    iconBtn: { padding: 6, marginLeft: 2 },
    callCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#4CAF50', // Color verde para la llamada
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start'
    },
    vehicleText: { fontSize: 11, fontWeight: '500' },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    warningBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF634715', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    warningText: { color: '#FF6347', fontSize: 10, fontWeight: 'bold' },
    reputationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 4 },
    starsContainer: { flexDirection: 'row', marginRight: 8 },
    pointsText: { fontSize: 11, fontWeight: '500' },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    statItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    statText: { fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
});
