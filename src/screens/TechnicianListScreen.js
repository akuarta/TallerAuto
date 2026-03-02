import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { User, Phone, Briefcase, Search, Edit2, Plus, Star } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

const TechCard = ({ tech, onEdit }) => {
    const getStatusColor = (estado) => {
        const est = estado?.toLowerCase() || '';
        if (est.includes('disponible')) return '#32CD32';
        if (est.includes('ocupado')) return '#FFA500';
        if (est.includes('ausente')) return '#FF6347';
        return Colors.textSecondary;
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <User size={24} color={Colors.primary} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.techName}>{tech.Nombre || tech.tecnicos}</Text>
                    <Text style={styles.specialty}>{tech.Especialidad || tech.especialidad || 'Mecánico General'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tech.Estado) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(tech.Estado) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(tech.Estado) }]}>
                        {tech.Estado || 'Disponible'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={[styles.bodyItem, { flex: 1 }]}>
                    <Phone size={14} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.bodyText}>{tech.Telefono || tech.telefono || 'Sin teléfono'}</Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                    <Edit2 size={18} color={Colors.textSecondary} />
                    <Text style={styles.actionBtnText}>Editar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function TechnicianListScreen({ navigation }) {
    const { tecnicos, loading } = useData();
    const [search, setSearch] = useState('');

    const fields = ['ID_tecnico', 'Nombre', 'Especialidad', 'Telefono', 'Estado'];

    const filteredTechs = (tecnicos || []).filter(t =>
        (t.Nombre?.toLowerCase() || t.tecnicos?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (t.Especialidad?.toLowerCase() || t.especialidad?.toLowerCase() || '').includes(search.toLowerCase())
    );

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="TÉCNICOS" />
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar técnico o especialidad..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                style={{ flex: 1 }}
                data={filteredTechs}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <TechCard tech={item} onEdit={() => navigation.navigate('Form', {
                        title: 'Técnico',
                        dataKey: 'tecnicos',
                        item,
                        fields
                    })} />
                )}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron técnicos</Text>}
            />

            <FAB onPress={() => navigation.navigate('Form', {
                title: 'Técnico',
                dataKey: 'tecnicos',
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
        padding: 16, borderWidth: 1, borderColor: Colors.border,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B599820',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    headerInfo: { flex: 1 },
    techName: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
    specialty: { color: Colors.primary, fontSize: 13, marginTop: 2, fontWeight: '500' },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8,
        paddingVertical: 4, borderRadius: 12,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: 'bold' },
    cardBody: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
    bodyItem: { flexDirection: 'row', alignItems: 'center' },
    bodyText: { color: Colors.textSecondary, fontSize: 14 },
    cardActions: {
        marginTop: 16, paddingTop: 12, borderTopWidth: 1,
        borderTopColor: Colors.border, flexDirection: 'row'
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
    actionBtnText: { color: Colors.textSecondary, fontSize: 14, marginLeft: 6 },
    emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
