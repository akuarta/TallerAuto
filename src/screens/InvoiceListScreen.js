import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { FileText, Calendar, DollarSign, ChevronRight, Trash2, Edit2 } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

export default function InvoiceListScreen({ navigation }) {
    const { invoices, loading } = useData();
    const fields = ['Factura', 'IdOrden', 'Cliente', 'Total', 'Impuestos', 'Subtotal', 'Servicios Realizados'];

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="FACTURACION" />
            <FlatList
                data={invoices}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardContainer}>
                        <TouchableOpacity
                            style={styles.cardMain}
                            onPress={() => navigation.navigate('GenericDetails', { item, title: 'Factura' })}
                        >
                            <FileText size={24} color={Colors.primary} style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>Factura #{item.Factura}</Text>
                                <Text style={styles.subtitle}>{item.Cliente}</Text>
                            </View>
                            <View style={styles.amountContainer}>
                                <Text style={styles.amount}>${item.Total}</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.actionIcons}>
                            <TouchableOpacity style={styles.iconBtn}>
                                <Trash2 size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
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
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
            <FAB onPress={() => navigation.navigate('Form', { title: 'Factura', dataKey: 'invoices', fields })} />
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
    title: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
    subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
    amountContainer: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: Colors.primary + '20',
        marginHorizontal: 8,
    },
    amount: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
});
