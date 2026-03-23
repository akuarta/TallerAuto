import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { FileText, ChevronLeft, Share2, Printer, ShieldCheck, Wrench, Calendar, ChevronRight, LayoutGrid, Zap, HelpCircle } from 'lucide-react-native';

const DetailItem = ({ label, value }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

export default function VehicleDetailsScreen({ route, navigation }) {
    const { vehicle } = route.params || {};
    const { getOrdenesByVehiculo } = useData();

    if (!vehicle || Object.keys(vehicle).length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: Colors.background }}>
                <CustomHeader 
                    title="DETALLES" 
                    leftAction={() => navigation.navigate('VehicleManager')}
                    leftIcon={<ChevronLeft size={24} color="#FFF" />}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <HelpCircle size={48} color={Colors.border} />
                    <Text style={{ color: Colors.textSecondary, marginTop: 15, textAlign: 'center' }}>
                        No se ha podido cargar la información de este vehículo.
                    </Text>
                </View>
            </View>
        );
    }

    // Obtener historial de servicios
    const history = getOrdenesByVehiculo(vehicle.Matricula || vehicle.id);

    // Detectar si el vehículo tiene manual vinculado
    const manualPath = vehicle.Manual_Tecnico_Path || 
                     vehicle.ID_Manual_Tecnico || 
                     vehicle.Manual_Tecnico ||
                     vehicle['Manual Tecnico Path'] ||
                     vehicle['Manual_Tecnico_Ruta'] ||
                     vehicle['Ruta_Manual'];
    const isLocked = !!manualPath;

    const handleOpenManual = () => {
        if (manualPath) {
            navigation.navigate('VehicleSearch', { 
                initialSearch: '', 
                manualPathOverride: manualPath 
            });
        } else {
            const safeLinkingId = vehicle.id || vehicle.Matricula || vehicle['ID Vehiculo'];
            const yearStr = vehicle['Año de Fabricacion'] || vehicle['Año'] || vehicle.Anio || vehicle.Year || '';
            navigation.navigate('VehicleSearch', {
                initialSearch: `${vehicle.Marca || ''} ${vehicle.Modelo || ''} ${yearStr}`.trim(),
                linkingVehicleId: safeLinkingId,
                linkingOldModel: vehicle.Modelo || ''
            });
        }
    };

    const handleOpenSection = (sectionName) => {
        if (!manualPath) return;

        // Si pedimos DIAGRAMS, usualmente están dentro de Repair and Diagnosis en Charm.li
        let searchPath = sectionName;
        if (sectionName === 'Diagrams') {
            searchPath = 'Repair and Diagnosis/Diagrams';
        }

        const fullPath = `${manualPath}/${searchPath}/`.replace(/\/+/g, '/').replace(/^\/+|\/+$/g, '');
        navigation.navigate('VehicleSearch', { 
            manualPathOverride: fullPath,
            sectionTitle: sectionName.toUpperCase() 
        });
    };

    const handleShare = async () => {
        try {
            const message = `Ficha de Vehículo: ${vehicle.Marca} ${vehicle.Modelo}\nPlaca: ${vehicle.Matricula || 'N/A'}\n${isLocked ? '✓ Manual Técnico Vinculado' : ''}`;
            await Share.share({ message });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <CustomHeader 
                title="DETALLES" 
                leftAction={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('VehicleManager')}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
                rightAction={handleShare}
                rightIcon={<Share2 size={22} color="#FFF" />}
            />
            
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.headerSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.header}>{vehicle.Marca} {vehicle.Modelo}</Text>
                            <Text style={styles.subHeader}>
                                {vehicle['Año de Fabricacion'] || vehicle.Año || ''} {(vehicle.Matricula) ? `• ${vehicle.Matricula}` : ''}
                            </Text>
                        </View>
                        {isLocked && (
                            <View style={styles.lockedBadge}>
                                <ShieldCheck size={16} color={Colors.primary} />
                                <Text style={styles.lockedText}>VINCULADO</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* INFORMACIÓN GENERAL */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <LayoutGrid size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>INFORMACIÓN GENERAL</Text>
                    </View>
                    {Object.entries(vehicle).filter(([k]) => !['id', 'Marca', 'Modelo', 'Placa', 'Matricula', 'Manual_Tecnico_Path', 'ID_Manual_Tecnico', 'Manual_Tecnico'].includes(k)).length === 0 ? (
                        <Text style={styles.emptyTextSmall}>No hay campos adicionales registrados.</Text>
                    ) : (
                        Object.entries(vehicle).map(([key, value]) => {
                            if (['id', 'Marca', 'Modelo', 'Placa', 'Matricula', 'Manual_Tecnico_Path', 'ID_Manual_Tecnico', 'Manual_Tecnico'].includes(key)) return null;
                            if (!value || value === '') return null;
                            return <DetailItem key={key} label={key.toUpperCase()} value={value.toString()} />;
                        })
                    )}
                </View>

                {/* Sección Manual Técnico */}
                <View style={styles.manualCardWrapper}>
                    <TouchableOpacity 
                        style={[styles.manualCard, isLocked && styles.manualCardActive]} 
                        onPress={handleOpenManual}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.manualIconContainer, isLocked && { backgroundColor: Colors.primary + '20' }]}>
                            <FileText size={28} color={isLocked ? Colors.primary : Colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={[styles.manualTitle, isLocked && { color: Colors.primary }]}>
                                {isLocked ? 'Documentación Técnica' : 'Vincular Manual Técnico'}
                            </Text>
                            <Text style={styles.manualDesc}>
                                {isLocked 
                                    ? 'Consultar diagramas, motor y despiece oficial.' 
                                    : 'Busca el manual para este modelo.'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {isLocked && (
                        <View style={styles.quickActions}>
                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Repair and Diagnosis')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#722ED115' }]}>
                                    <Wrench size={18} color="#722ED1" />
                                </View>
                                <Text style={styles.quickText}>REPAIR & DIAG</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Diagrams')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#08979C15' }]}>
                                    <Zap size={18} color="#08979C" />
                                </View>
                                <Text style={styles.quickText}>DIAGRAMS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Service and Maintenance')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#389E0D15' }]}>
                                    <Calendar size={18} color="#389E0D" />
                                </View>
                                <Text style={styles.quickText}>MANUAL</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Historial de Servicios */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <LayoutGrid size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>HISTORIAL DE TRABAJOS</Text>
                    </View>
                    
                    {history.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Wrench size={32} color={Colors.border} style={{ marginBottom: 10 }} />
                            <Text style={styles.emptyText}>Sin historial de servicios registrados.</Text>
                            <Text style={styles.emptySubtext}>Las órdenes de trabajo aparecerán aquí automáticamente.</Text>
                        </View>
                    ) : (
                        history.map((order, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.historyItem}
                                onPress={() => navigation.navigate('GenericDetails', { item: order, title: 'Órden de Trabajo' })}
                            >
                                <View style={styles.historyLeft}>
                                    <View style={styles.dateBadge}>
                                        <Calendar size={14} color={Colors.textSecondary} />
                                        <Text style={styles.dateText}>{order.Fecha || 'Reciente'}</Text>
                                    </View>
                                    <Text style={styles.serviceName}>{order.Servicios || order.Motivo || 'Mantenimiento General'}</Text>
                                    <Text style={styles.serviceDetail}>Odómetro: {order.Odometer || order.Kilometraje || 'N/D'}</Text>
                                </View>
                                <ChevronRight size={18} color={Colors.border} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.actionsBox}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Printer size={20} color={Colors.textSecondary} />
                        <Text style={styles.actionBtnText}>IMPRIMIR FICHA</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSection: { padding: 20 },
    header: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    subHeader: { fontSize: 18, color: Colors.textSecondary },
    lockedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    lockedText: { color: Colors.primary, fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
    section: { backgroundColor: Colors.card, borderRadius: 16, margin: 16, marginTop: 0, padding: 20, borderWidth: 1, borderColor: Colors.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { color: Colors.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 },
    itemContainer: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: Colors.border + '50', paddingBottom: 10 },
    label: { color: Colors.textSecondary, fontSize: 13, marginBottom: 4 },
    value: { color: Colors.text, fontSize: 17, fontWeight: '500' },
    manualCardWrapper: { marginBottom: 16 },
    manualCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4, borderLeftColor: Colors.textSecondary 
    },
    manualCardActive: { borderLeftColor: Colors.primary, backgroundColor: Colors.primary + '05', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
    manualIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
    manualTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    manualDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    quickActions: { flexDirection: 'row', backgroundColor: Colors.card, marginHorizontal: 16, padding: 15, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderColor: Colors.border, borderTopWidth: 1, borderTopColor: Colors.border + '50', justifyContent: 'space-between' },
    quickBtn: { alignItems: 'center', flex: 1 },
    quickIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    quickText: { color: Colors.textSecondary, fontSize: 9, fontWeight: 'bold' },
    emptyHistory: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
    emptySubtext: { color: Colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
    emptyTextSmall: { color: Colors.textSecondary, fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 10 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
    historyLeft: { flex: 1 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    dateText: { color: Colors.textSecondary, fontSize: 11, marginLeft: 5 },
    serviceName: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
    serviceDetail: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    actionsBox: { padding: 20, alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, width: '100%', justifyContent: 'center' },
    actionBtnText: { color: Colors.textSecondary, fontWeight: 'bold', marginLeft: 10, fontSize: 13 }
});
