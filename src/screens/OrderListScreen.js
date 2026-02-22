import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Clipboard, ChevronRight, Trash2, Edit2 } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

export default function OrderListScreen({ navigation }) {
    const { orders, loading } = useData();
    const fields = ['IdOrden', 'Fecha Recepcion', 'Hora', 'Cliente', 'Matricula', 'Estado', 'Tecnico', 'Problema', 'Total'];

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="ORDENES" />
            <FlatList
                data={orders}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => navigation.navigate('GenericDetails', { item, title: 'Orden' })}
                        >
                            <View style={styles.iconCircle}>
                                <Clipboard color={Colors.primary} size={22} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>{item.Cliente || 'Sin Cliente'}</Text>
                                <Text style={styles.subtitle}>{item.Problema || 'Sin descripción'} - {item.Estado}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actionIcons}>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Trash2 size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
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
                contentContainerStyle={{ paddingBottom: 100 }}
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
});
