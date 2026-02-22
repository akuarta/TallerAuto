import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Wrench, ChevronRight, DollarSign, Trash2, Edit2 } from 'lucide-react-native';

const ServiceCard = ({ service, onPress, onEdit }) => (
    <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.cardMain} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Wrench size={24} color={Colors.primary} />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{service.Servicios}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{service.descripcion} | {service.tiempo}</Text>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.price}>${service.costo}</Text>
            </View>
        </TouchableOpacity>

        <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.iconBtn}>
                <Trash2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
                <Edit2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
        </View>
    </View>
);

import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

export default function ServiceListScreen({ navigation }) {
    const { services, loading } = useData();
    const fields = ['IDservicio', 'Servicios', 'costo', 'descripcion', 'tiempo', 'tecnico'];

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="SERVICIOS" />
            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ServiceCard
                        service={item}
                        onPress={() => navigation.navigate('GenericDetails', { item, title: 'Servicio' })}
                        onEdit={() => navigation.navigate('Form', {
                            title: 'Servicio',
                            dataKey: 'services',
                            item,
                            fields
                        })}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
            <FAB onPress={() => navigation.navigate('Form', { title: 'Servicio', dataKey: 'services', fields })} />
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
    iconContainer: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B599820',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    info: { flex: 1 },
    title: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
    priceContainer: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#43A04720', marginLeft: 8 },
    price: { color: '#43A047', fontWeight: 'bold', fontSize: 14 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
});
