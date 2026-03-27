import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform } from 'react-native';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { CustomHeader } from '../components/CustomHeader';
import { FileText, ChevronLeft, Share2, Printer, ShieldCheck, Wrench, Calendar, ChevronRight, LayoutGrid, Zap, HelpCircle } from 'lucide-react-native';

const DetailItem = ({ label, value, colors }) => (
    <View style={[styles.itemContainer, { borderBottomColor: colors.border + '50' }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
);

export default function VehicleDetailsScreen({ route, navigation }) {
    const { vehicle } = route.params || {};
    const { getOrdenesByVehiculo } = useData();
    const { colors } = useTheme();

    if (!vehicle || Object.keys(vehicle).length === 0) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <CustomHeader 
                    title="DETALLES" 
                    leftAction={() => navigation.navigate('VehicleManager')}
                    leftIcon={<ChevronLeft size={24} color="#FFF" />}
                />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <HelpCircle size={48} color={colors.border} />
                    <Text style={{ color: colors.textSecondary, marginTop: 15, textAlign: 'center' }}>
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
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
                            <Text style={[styles.header, { color: colors.text }]}>{vehicle.Marca} {vehicle.Modelo}</Text>
                            <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
                                {vehicle['Año de Fabricacion'] || vehicle.Año || ''} {(vehicle.Matricula) ? `• ${vehicle.Matricula}` : ''}
                            </Text>
                        </View>
                        {isLocked && (
                            <View style={[styles.lockedBadge, { backgroundColor: colors.primary + '20' }]}>
                                <ShieldCheck size={16} color={colors.primary} />
                                <Text style={[styles.lockedText, { color: colors.primary }]}>VINCULADO</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* INFORMACIÓN GENERAL */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <LayoutGrid size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>INFORMACIÓN GENERAL</Text>
                    </View>
                    {Object.entries(vehicle).filter(([k]) => !['id', 'Marca', 'Modelo', 'Placa', 'Matricula', 'Manual_Tecnico_Path', 'ID_Manual_Tecnico', 'Manual_Tecnico'].includes(k)).length === 0 ? (
                        <Text style={[styles.emptyTextSmall, { color: colors.textSecondary }]}>No hay campos adicionales registrados.</Text>
                    ) : (
                        Object.entries(vehicle).map(([key, value]) => {
                            if (['id', 'Marca', 'Modelo', 'Placa', 'Matricula', 'Manual_Tecnico_Path', 'ID_Manual_Tecnico', 'Manual_Tecnico'].includes(key)) return null;
                            if (!value || value === '') return null;
                            return <DetailItem key={key} label={key.toUpperCase()} value={value.toString()} colors={colors} />;
                        })
                    )}
                </View>

                {/* Sección Manual Técnico */}
                <View style={styles.manualCardWrapper}>
                    <TouchableOpacity 
                        style={[
                            styles.manualCard, 
                            { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.textSecondary },
                            isLocked && [styles.manualCardActive, { borderLeftColor: colors.primary, backgroundColor: colors.primary + '05' }]
                        ]} 
                        onPress={handleOpenManual}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.manualIconContainer, { backgroundColor: colors.background }, isLocked && { backgroundColor: colors.primary + '20' }]}>
                            <FileText size={28} color={isLocked ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 15 }}>
                            <Text style={[styles.manualTitle, { color: colors.text }, isLocked && { color: colors.primary }]}>
                                {isLocked ? 'Documentación Técnica' : 'Vincular Manual Técnico'}
                            </Text>
                            <Text style={[styles.manualDesc, { color: colors.textSecondary }]}>
                                {isLocked 
                                    ? 'Consultar diagramas, motor y despiece oficial.' 
                                    : 'Busca el manual para este modelo.'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {isLocked && (
                        <View style={[styles.quickActions, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: colors.border + '50' }]}>
                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Repair and Diagnosis')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#722ED115' }]}>
                                    <Wrench size={18} color="#722ED1" />
                                </View>
                                <Text style={[styles.quickText, { color: colors.textSecondary }]}>REPAIR & DIAG</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Diagrams')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#08979C15' }]}>
                                    <Zap size={18} color="#08979C" />
                                </View>
                                <Text style={[styles.quickText, { color: colors.textSecondary }]}>DIAGRAMS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.quickBtn} 
                                onPress={() => handleOpenSection('Service and Maintenance')}
                            >
                                <View style={[styles.quickIcon, { backgroundColor: '#389E0D15' }]}>
                                    <Calendar size={18} color="#389E0D" />
                                </View>
                                <Text style={[styles.quickText, { color: colors.textSecondary }]}>MANUAL</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Historial de Servicios */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                        <LayoutGrid size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { color: colors.primary }]}>HISTORIAL DE TRABAJOS</Text>
                    </View>
                    
                    {history.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <Wrench size={32} color={colors.border} style={{ marginBottom: 10 }} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sin historial de servicios registrados.</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Las órdenes de trabajo aparecerán aquí automáticamente.</Text>
                        </View>
                    ) : (
                        history.map((order, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.historyItem, { borderBottomColor: colors.border + '50' }]}
                                onPress={() => navigation.navigate('GenericDetails', { item: order, title: 'Órden de Trabajo' })}
                            >
                                <View style={styles.historyLeft}>
                                    <View style={styles.dateBadge}>
                                        <Calendar size={14} color={colors.textSecondary} />
                                        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{order.Fecha || 'Reciente'}</Text>
                                    </View>
                                    <Text style={[styles.serviceName, { color: colors.text }]}>{order.Servicios || order.Motivo || 'Mantenimiento General'}</Text>
                                    <Text style={[styles.serviceDetail, { color: colors.textSecondary }]}>Odómetro: {order.Odometer || order.Kilometraje || 'N/D'}</Text>
                                </View>
                                <ChevronRight size={18} color={colors.border} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.actionsBox}>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.border }]}>
                        <Printer size={20} color={colors.textSecondary} />
                        <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>IMPRIMIR FICHA</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerSection: { padding: 20 },
    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
    subHeader: { fontSize: 18 },
    lockedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    lockedText: { fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
    section: { borderRadius: 16, margin: 16, marginTop: 0, padding: 20, borderWidth: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginLeft: 8 },
    itemContainer: { marginBottom: 18, borderBottomWidth: 1, paddingBottom: 10 },
    label: { fontSize: 13, marginBottom: 4 },
    value: { fontSize: 17, fontWeight: '500' },
    manualCardWrapper: { marginBottom: 16 },
    manualCard: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderLeftWidth: 4 
    },
    manualCardActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
    manualIconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    manualTitle: { fontSize: 16, fontWeight: 'bold' },
    manualDesc: { fontSize: 12, marginTop: 2 },
    quickActions: { flexDirection: 'row', marginHorizontal: 16, padding: 15, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderWidth: 1, borderTopWidth: 1, justifyContent: 'space-between' },
    quickBtn: { alignItems: 'center', flex: 1 },
    quickIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    quickText: { fontSize: 9, fontWeight: 'bold' },
    emptyHistory: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { fontSize: 13, fontStyle: 'italic' },
    emptySubtext: { fontSize: 11, marginTop: 4, textAlign: 'center' },
    emptyTextSmall: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 10 },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    historyLeft: { flex: 1 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    dateText: { fontSize: 11, marginLeft: 5 },
    serviceName: { fontSize: 15, fontWeight: 'bold' },
    serviceDetail: { fontSize: 12, marginTop: 2 },
    actionsBox: { padding: 20, alignItems: 'center' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, width: '100%', justifyContent: 'center' },
    actionBtnText: { fontWeight: 'bold', marginLeft: 10, fontSize: 13 }
});
