import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { List, ChevronRight, Plus, Trash2, Edit2 } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

export default function GenericListScreen({ route, navigation }) {
    const { title, dataKey } = route.params;
    const allData = useData();
    const listData = allData[dataKey] || [];
    const loading = allData.loading;

    // Campos por defecto si la lista está vacía
    const defaultFields = {
        citas: ['ID_Cita', 'Tipo de cita', 'Turno', 'Agendado', 'Cliente', 'Fecha '],
        tecnicos: ['ID_tecnico', 'tecnicos', 'especialidad', 'telefono'],
        productos: ['id', 'producto', 'marca', 'precio', 'stock'],
        garage: ['TURNO', 'CLIENTE', 'MATRICULA ', 'DATOS VEH.', 'FECHA ENTRADA', 'ESTADO'],
        entradas: ['IdEntrada', 'Fecha', 'Hora', 'Cliente', 'Matricula'],
        facturando: ['IdFacturacion', 'Fecha', 'Cliente', 'Total'],
        herramientas: ['ID_herramienta', 'herramienta', 'estado'],
    };

    // Obtenemos los campos de la primera fila si existen para el formulario, o usamos los por defecto
    const fields = listData.length > 0
        ? Object.keys(listData[0]).filter(k => k !== 'id')
        : (defaultFields[dataKey] || ['Nombre', 'Descripción', 'Fecha']);

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title={title.toUpperCase()} />
            <View style={styles.content}>
                {listData.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No hay registros en {title}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => navigation.navigate('Form', { title, dataKey, fields })}
                        >
                            <Text style={{ color: '#FFF' }}>AGREGAR PRIMER REGISTRO</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        renderItem={({ item }) => (
                            <View style={styles.cardContainer}>
                                <TouchableOpacity
                                    style={styles.cardMain}
                                    onPress={() => navigation.navigate('GenericDetails', { item, title })}
                                >
                                    <View style={styles.iconCircle}>
                                        <List size={20} color={Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.title} numberOfLines={1}>
                                            {item.Nombre || item.Descripcion || item.Fecha || item.Marca || item.Modelo || 'Registro'}
                                        </Text>
                                        <Text style={styles.subtitle} numberOfLines={1}>
                                            {Object.values(item).filter(v => v && typeof v === 'string' && v.length < 50).slice(1, 4).join(' | ')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.actionIcons}>
                                    <TouchableOpacity style={styles.iconBtn}>
                                        <Trash2 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => navigation.navigate('Form', { title, dataKey, item, fields })}
                                    >
                                        <Edit2 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
            </View>
            <FAB onPress={() => navigation.navigate('Form', { title, dataKey, fields })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 8, flex: 1 },
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
    title: { color: Colors.text, fontSize: 16, fontWeight: '600' },
    subtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
    actionIcons: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
    iconBtn: { padding: 8, marginLeft: 2 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 20, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 8 },
});
