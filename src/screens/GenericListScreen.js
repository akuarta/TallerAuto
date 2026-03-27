import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { List, ChevronRight, Plus, Trash2, Edit2, FileText } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';
import { formatCurrency } from '../utils/formatters';

export default function GenericListScreen({ route, navigation }) {
    const { title, dataKey } = route.params;
    const allData = useData();
    let listData = allData[dataKey] || [];
    const vehiculos = allData.vehiculos || [];
    const loading = allData.loading;

    // Si estamos en la lista de Facturación, unificamos con el Historial de Facturas
    if (dataKey === 'facturando') {
        const historicalInvoices = allData.invoices || [];
        listData = [...listData, ...historicalInvoices];
    }

    // Ordenamos por fecha (más reciente primero) si existe el campo
    listData = [...listData].sort((a, b) => {
        const dateA = new Date(a.Fecha || a.date || 0);
        const dateB = new Date(b.Fecha || b.date || 0);
        return dateB - dateA;
    });

    // Función para buscar si existe un PDF para este registro en cualquier otra lista (ej. en órdenes)
    const findPDFInAnySheet = (item) => {
        const id = item.Factura || item.id || item.ID_Factura || item.ID_Orden || item.TURNO;
        if (!id) return null;

        const allSheets = [allData.invoices, allData.facturando, allData.orders];
        for (const sheet of allSheets) {
            if (!sheet) continue;
            const match = sheet.find(s => (s.Factura === id || s.id === id || s.ID_Factura === id || s.ID_Orden === id || s.TURNO === id));
            if (match) {
                const pdf = Object.entries(match).find(([k, v]) => (k.toLowerCase().includes('pdf') || String(v).toLowerCase().includes('.pdf')) && v);
                if (pdf) return pdf[1];
            }
        }
        return null;
    };

    const getActualMatricula = (matriculaId) => {
        if (!matriculaId) return matriculaId;
        const vehiculo = vehiculos.find(v => v['ID Vehiculo'] === matriculaId || v.id === matriculaId || v.Matricula === matriculaId);
        return vehiculo?.Matricula ? vehiculo.Matricula : matriculaId;
    };

    // Campos por defecto si la lista está vacía
    const defaultFields = {
        citas: ['ID_Cita', 'Fecha', 'Hora', 'Cliente', 'Matricula', 'Tipo de cita', 'Turno', 'Agendado', 'Estado', 'Notas'],
        tecnicos: ['ID_tecnico', 'tecnico', 'especialidad', 'telefono'],
        productos: ['IDproducto', 'Producto', 'costo', 'precio', 'existencia'],
        servicios: ['id_servicio', 'Servicio', 'costo', 'descripcion', 'tiempo', 'tecnico'],
        garage: ['TURNO', 'CLIENTE', 'MATRICULA', 'DATOS VEH.', 'FECHA ENTRADA', 'ESTADO'],
        entradas: ['IdEntrada', 'Fecha', 'Hora', 'Cliente', 'Matricula'],
        facturando: ['IdFacturacion', 'Fecha', 'Cliente', 'Total'],
        herramientas: ['ID_herramienta', 'herramienta', 'estado'],
    };

    // Obtenemos los campos de la primera fila si existen para el formulario, o usamos los por defecto
    const fields = listData.length > 0
        ? Object.keys(listData[0]).filter(k => k !== 'id')
        : (defaultFields[dataKey] || ['Nombre', 'Descripción', 'Fecha']);

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
                        style={{ flex: 1 }}
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
                                            {dataKey === 'facturando' && (item.Factura || item.id || item.ID_Factura || item.ID_Orden) 
                                                ? `Factura #${item.Factura || item.id || item.ID_Factura || item.ID_Orden}` 
                                                : (item.Producto || item.Servicio || item.herramienta || item.tecnico || 
                                                   item.Nombre || item.Descripcion || item.Fecha || item.Marca || 
                                                   item.Modelo || item.CLIENTE || 'Registro')}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.subtitle} numberOfLines={1}>
                                                {Object.entries(item)
                                                    .filter(([k, v]) => k !== 'id' && v && typeof v === 'string' && v.length < 50 && !k.toLowerCase().includes('pdf'))
                                                    .map(([k, v]) => {
                                                        const keyLower = k.toLowerCase();
                                                        if (keyLower === 'matricula' || keyLower === 'placa') {
                                                            return getActualMatricula(v);
                                                        }
                                                        const isCurrency = keyLower.includes('precio') || keyLower.includes('costo') || keyLower.includes('total') || keyLower.includes('subtotal') || keyLower.includes('impuesto') || keyLower.includes('descuento');
                                                        if (isCurrency && v) return formatCurrency(v);
                                                        return v;
                                                    })
                                                    .slice(0, 3).join(' | ')}
                                            </Text>
                                            {Object.entries(item).some(([k, v]) => (k.toLowerCase().includes('pdf') || String(v).toLowerCase().includes('.pdf')) && v) && (
                                                <FileText size={14} color={Colors.primary} style={{ marginLeft: 8 }} />
                                            )}
                                        </View>
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
                        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
                        nestedScrollEnabled={true}
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
