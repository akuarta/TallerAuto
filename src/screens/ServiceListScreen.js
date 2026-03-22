import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Wrench, ChevronRight, DollarSign, Trash2, Edit2, Search, Plus } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

const ServiceCard = ({ service, onPress, onEdit, onDelete }) => (
    <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.cardMain} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Wrench size={22} color={Colors.primary} />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{service.Servicios || service.servicio}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    {(service.descripcion || 'Sin descripción').substring(0, 40)}...
                </Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{service.tiempo || '—'}</Text>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.metaText}>{service.tecnico || 'General'}</Text>
                </View>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.price}>${service.costo}</Text>
            </View>
        </TouchableOpacity>

        <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                <Edit2 size={18} color={Colors.primary} />
            </TouchableOpacity>
        </View>
    </View>
);

export default function ServiceListScreen({ navigation }) {
    const { services, loading, deleteItem } = useData();
    const [search, setSearch] = useState('');
    const fields = ['ID_Servicio', 'Servicios', 'costo', 'descripcion', 'tiempo', 'tecnico'];

    const filteredServices = (services || []).filter(s => 
        (s.Servicios || s.servicio || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.descripcion || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <View style={styles.container}><Text style={{ color: Colors.text }}>Cargando servicios...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="SERVICIOS Y TARIFAS" />
            
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar servicio guardado..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <FlatList
                data={filteredServices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ServiceCard
                        service={item}
                        onPress={() => navigation.navigate('GenericDetails', { item, title: 'Servicio' })}
                        onEdit={() => navigation.navigate('Form', {
                            title: 'Editar Servicio',
                            dataKey: 'servicios',
                            item,
                            fields
                        })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Wrench size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>No hay servicios que coincidan</Text>
                    </View>
                }
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            />
            
            <FAB 
                icon={<Plus size={32} color="white" />}
                onPress={() => navigation.navigate('Form', { 
                    title: 'Nuevo Servicio Personalizado', 
                    dataKey: 'servicios', 
                    fields 
                })} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    
    // Búsqueda
    searchSection: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 25, paddingHorizontal: 15, height: 44, borderWidth: 1, borderColor: Colors.border },
    input: { flex: 1, marginLeft: 10, color: Colors.text, fontSize: 15 },

    cardContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 12, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 14,
        borderWidth: 1, borderColor: Colors.border,
    },
    cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(59,89,152,0.1)',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    info: { flex: 1 },
    title: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
    subtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { fontSize: 11, color: Colors.textSecondary, opacity: 0.8 },
    metaDivider: { marginHorizontal: 6, color: Colors.border, fontSize: 10 },

    priceContainer: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(67,160,71,0.15)', marginLeft: 8 },
    price: { color: '#4CAF50', fontWeight: 'bold', fontSize: 15 },
    
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textSecondary, marginTop: 15, fontSize: 14 },
});
