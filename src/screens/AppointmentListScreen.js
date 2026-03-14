import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Calendar, Clock, User, Car, Search, Edit2, Plus, ChevronRight } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

const AppointmentCard = ({ appointment, onEdit, onPress, getActualMatricula }) => {
    const getStatusColor = (estado) => {
        const est = estado?.toLowerCase() || '';
        if (est.includes('confirmada')) return '#32CD32';
        if (est.includes('pendiente')) return '#FFA500';
        if (est.includes('cancelada')) return '#FF6347';
        return Colors.textSecondary;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(appointment.Estado) }]} />
            <View style={styles.cardHeader}>
                <View style={styles.dateTime}>
                    <Calendar size={14} color={Colors.primary} />
                    <Text style={styles.dateText}>{appointment.Fecha || 'Sin fecha'}</Text>
                    <Clock size={14} color={Colors.primary} style={{ marginLeft: 10 }} />
                    <Text style={styles.dateText}>{appointment.Hora || appointment.Turno || '--:--'}</Text>
                </View>
                <Text style={[styles.statusText, { color: getStatusColor(appointment.Estado) }]}>
                    {appointment.Estado || 'Pendiente'}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.clientName}>{appointment.Cliente || 'Cliente Desconocido'}</Text>
                <View style={styles.vehicleRow}>
                    <Car size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.vehicleText}>
                        {getActualMatricula(appointment.Matricula)} - {appointment['Tipo de cita'] || 'Servicio General'}
                    </Text>
                </View>
                {appointment.Notas && (
                    <Text style={styles.notes} numberOfLines={1}>{appointment.Notas}</Text>
                )}
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                    <Edit2 size={16} color={Colors.textSecondary} />
                    <Text style={styles.editBtnText}>Editar</Text>
                </TouchableOpacity>
                <ChevronRight size={20} color={Colors.border} />
            </View>
        </TouchableOpacity>
    );
};

export default function AppointmentListScreen({ navigation }) {
    const { citas, vehiculos, loading } = useData();
    const [search, setSearch] = useState('');

    const fields = ['ID_Cita', 'Fecha', 'Hora', 'Cliente', 'Matricula', 'Tipo de cita', 'Turno', 'Agendado', 'Estado', 'Notas'];

    const getActualMatricula = (matriculaId) => {
        if (!matriculaId) return 'S/M';
        const vehiculo = vehiculos?.find(v => v['ID Vehiculo'] === matriculaId || v.id === matriculaId || v.Matricula === matriculaId);
        return vehiculo?.Matricula ? vehiculo.Matricula : matriculaId;
    };

    const filteredCitas = (citas || []).filter(c =>
        String(c.Cliente || '').toLowerCase().includes(search.toLowerCase()) ||
        String(getActualMatricula(c.Matricula) || '').toLowerCase().includes(search.toLowerCase()) ||
        String(c['Tipo de cita'] || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="CITAS" />
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cita por cliente o placa..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredCitas}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <AppointmentCard
                        appointment={item}
                        getActualMatricula={getActualMatricula}
                        onPress={() => navigation.navigate('GenericDetails', { item, title: 'Cita' })}
                        onEdit={() => navigation.navigate('Form', {
                            title: 'Cita',
                            dataKey: 'citas',
                            item,
                            fields
                        })}
                    />
                )}
                contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1 }}
                nestedScrollEnabled={true}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay citas programadas</Text>}
            />

            <FAB onPress={() => navigation.navigate('Form', {
                title: 'Cita',
                dataKey: 'citas',
                fields
            })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
    card: {
        backgroundColor: Colors.card, borderRadius: 12, marginBottom: 16,
        paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
        borderWidth: 1, borderColor: Colors.border, overflow: 'hidden'
    },
    statusIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dateTime: { flexDirection: 'row', alignItems: 'center' },
    dateText: { color: Colors.text, fontSize: 13, marginLeft: 5, fontWeight: '500' },
    statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    cardBody: { marginBottom: 12 },
    clientName: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
    vehicleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    vehicleText: { color: Colors.textSecondary, fontSize: 14 },
    notes: { color: Colors.textSecondary, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
    cardFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border
    },
    editBtn: { flexDirection: 'row', alignItems: 'center' },
    editBtnText: { color: Colors.textSecondary, fontSize: 13, marginLeft: 6 },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
