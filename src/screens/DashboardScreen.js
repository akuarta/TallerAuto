import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Modal, Alert, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ClipboardList, Car, Users, FileCheck, Warehouse, Calendar, Wrench, Search, MapPin, Plus, Scan } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { FAB } from '../components/FAB';
import { ScanModal } from '../components/ScanModal';
import { formatCurrency } from '../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const StatCard = ({ title, count, icon, onPress, colors }) => (
    <TouchableOpacity 
        style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onPress} 
        activeOpacity={0.75}
    >
        <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>{icon}</View>
        <Text style={[styles.statCount, { color: colors.text }]}>{count ?? '—'}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
);

const ShortcutBtn = ({ label, icon, onPress, colors }) => (
    <TouchableOpacity 
        style={[styles.shortcut, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={onPress} 
        activeOpacity={0.75}
    >
        <View style={styles.shortcutIcon}>{icon}</View>
        <Text style={[styles.shortcutText, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {    const allData = useData();
    const { orders, clients, vehiculos, citas, settings, invoices, gastos } = allData;
    const { colors } = useTheme();

    // ─── LÓGICA DE TIEMPO Y SALUDO ──────────────────────────────────────────────
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const hour = currentTime.getHours();
    let greetText = '¡Buenas noches!';
    if (hour >= 5 && hour < 12) greetText = '¡Buenos días!';
    else if (hour >= 12 && hour < 19) greetText = '¡Buenas tardes!';

    const adminName = settings?.adminName || 'Administrador';
    
    // Formatear Fecha: "Lunes, 25 de Octubre"
    const dateStr = currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    // Capitalizar la primera letra del día
    const dateStrCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    
    // Formatear Hora: "10:30 AM"
    const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const activeOrders = (orders || []).filter(o =>
        o.Estado?.toLowerCase().includes('pendiente') ||
        o.Estado?.toLowerCase().includes('proceso')
    ).length;

    const { totalCobrado, totalGastos, gananciaReal } = useMemo(() => {
        const parse = (val) => parseFloat(String(val || '0').replace(/[^0-9.-]/g, '')) || 0;
        
        const invList = invoices || [];
        const factList = allData.facturando || [];
        const ordList = allData.orders || [];
        const gastList = gastos || [];

        let cobrado = 0;
        invList.forEach(inv => {
            const total = parse(inv.Total || inv['Total Facturado'] || inv.Monto || inv.Precio);
            const pagado = parse(inv.MontoPagado || inv['Monto Pagado'] || inv.Pagado);
            const estado = String(inv.Estado || inv.Status || '').toLowerCase();
            if (estado.includes('pagad') || estado.includes('cobrad') || estado.includes('finalizad')) {
                cobrado += total;
            }
        });

        let tGastos = gastList.reduce((sum, g) => sum + parse(g.Monto || g.monto || g.Costo), 0);
        
        return { 
            totalCobrado: cobrado, 
            totalGastos: tGastos, 
            gananciaReal: cobrado - tGastos 
        };
    }, [invoices, allData.facturando, allData.orders, gastos]);

    const [scanning, setScanning] = React.useState(false);
    const [scanField, setScanField] = React.useState('Matrícula');

    const handleRealScanResult = (result) => {
        // Buscar si existe el vehículo
        const randomPlate = result;
        const vehicle = (vehiculos || []).find(v => v.Matricula === randomPlate || v['Matricula'] === randomPlate);
        
        if (vehicle) {
            Alert.alert(
                "¡Escaneado con éxito!",
                `Vehículo identificado: ${vehicle.Marca} ${vehicle.Modelo} (${randomPlate})`,
                [
                    { text: "Ver Detalle", onPress: () => navigation.navigate('GenericDetails', { item: vehicle, title: 'Vehículo' }) },
                    { text: "OK" }
                ]
            );
        } else {
            Alert.alert("No encontrado", "Esa matrícula no está registrada.");
        }
    };

    const handleSimulatedScan = () => {
        setScanField('Matrícula');
        setScanning(true);
    };

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <CustomHeader title="INICIO" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Saludo */}
                <View style={styles.greet}>
                    <Text style={[styles.greetTitle, { color: colors.text }]} numberOfLines={1}>{greetText}, {adminName}</Text>
                    <Text style={[styles.greetSub, { color: colors.textSecondary }]}>{dateStrCap} • {timeStr}</Text>
                </View>

                {/* Tarjetas de estadísticas */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Órdenes activas"
                        count={activeOrders}
                        icon={<ClipboardList size={26} color={colors.primary} />}
                        onPress={() => navigation.navigate('Orders')}
                        colors={colors}
                    />
                    <StatCard
                        title="Clientes"
                        count={clients?.length}
                        icon={<Users size={26} color="#E53935" />}
                        onPress={() => navigation.navigate('ClientList')}
                        colors={colors}
                    />
                    <StatCard
                        title="En Taller"
                        count={activeOrders}
                        icon={<Warehouse size={26} color="#4CAF50" />}
                        onPress={() => navigation.navigate('Garage')}
                        colors={colors}
                    />
                    <StatCard
                        title="Citas"
                        count={citas?.length}
                        icon={<Calendar size={26} color="#FF9800" />}
                        onPress={() => navigation.navigate('AppointmentList')}
                        colors={colors}
                    />
                </View>

                {/* Resumen Financiero */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Resumen Financiero</Text>
                <TouchableOpacity 
                    style={[styles.financeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('Billing')}
                    activeOpacity={0.8}
                >
                    <View style={styles.financeItem}>
                        <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Total Cobrado</Text>
                        <Text style={[styles.financeValue, { color: '#4CAF50' }]}>{formatCurrency(totalCobrado)}</Text>
                    </View>
                    <View style={styles.financeDivider} />
                    <View style={styles.financeItem}>
                        <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Gastos</Text>
                        <Text style={[styles.financeValue, { color: '#E53935' }]}>{formatCurrency(totalGastos)}</Text>
                    </View>
                    <View style={styles.financeDivider} />
                    <View style={styles.financeItem}>
                        <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>Ganancia Neta</Text>
                        <Text style={[styles.financeValue, { color: gananciaReal >= 0 ? '#4CAF50' : '#E53935' }]}>
                            {formatCurrency(gananciaReal)}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Accesos rápidos */}
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 10 }]}>Accesos rápidos</Text>
                <View style={styles.shortcuts}>
                    {(() => {
                        const shortcutsList = settings?.shortcuts || ['Garage', 'Billing', 'Services', 'VehicleSearch'];
                        const SHORTCUT_CONFIG = {
                            'Garage': { label: 'Garage', icon: <Warehouse size={28} color={colors.primary} />, route: 'Garage' },
                            'Billing': { label: 'Facturación', icon: <FileCheck size={28} color="#E53935" />, route: 'Billing' },
                            'Services': { label: 'Servicios', icon: <Wrench size={28} color="#4CAF50" />, route: 'Services' },
                            'VehicleSearch': { label: 'Buscar', icon: <Search size={28} color="#FF9800" />, route: 'VehicleSearch' },
                            'Orders': { label: 'Órdenes', icon: <ClipboardList size={28} color="#9C27B0" />, route: 'Orders' },
                            'AppointmentList': { label: 'Citas', icon: <Calendar size={28} color="#FF5722" />, route: 'AppointmentList' },
                            'ClientList': { label: 'Clientes', icon: <Users size={28} color="#03A9F4" />, route: 'ClientList' },
                            'Rescue': { label: 'Rescates', icon: <MapPin size={28} color="#E91E63" />, route: 'Rescue' },
                            'VehicleManager': { label: 'Vehículos', icon: <Car size={28} color="#4CAF50" />, route: 'VehicleManager' },
                            'TechnicianList': { label: 'Técnicos', icon: <Users size={28} color="#FF9800" />, route: 'TechnicianList' },
                            'Inventory': { label: 'Inventario', icon: <ClipboardList size={28} color="#FF5722" />, route: 'Inventory' },
                            'Entradas': { label: 'Entradas', icon: <Warehouse size={28} color="#795548" />, route: 'Entradas' },
                            'Salidas': { label: 'Salidas', icon: <Warehouse size={28} color="#607D8B" />, route: 'Salidas' },
                            'InvoicingList': { label: 'Facturando', icon: <FileCheck size={28} color="#E91E63" />, route: 'InvoicingList' },
                            
                            // Accesos a Formularios
                            'NewOrder': { label: '+ Orden', icon: <ClipboardList size={28} color="#9C27B0" />, isForm: true, params: { title: 'Nueva Orden', dataKey: 'orders', fields: ['ID_Orden', 'Fecha Recepcion', 'Cliente', 'Matricula', 'Detalles del vehiculo', 'Problema', 'Estado', 'Total'], prefill: { 'Estado': 'Pendiente', 'Fecha Recepcion': new Date().toISOString().split('T')[0] } } },
                            'NewClient': { label: '+ Cliente', icon: <Users size={28} color="#03A9F4" />, isForm: true, params: { title: 'Nuevo Cliente', dataKey: 'clients', fields: ['ID_Cliente', 'Nombre', 'Teléfono', 'Email', 'Dirección'], prefill: {} } },
                            'NewAppt': { label: '+ Cita', icon: <Calendar size={28} color="#FF9800" />, isForm: true, params: { title: 'Nueva Cita', dataKey: 'citas', fields: ['ID_Cita', 'Fecha', 'Hora', 'Cliente', 'Motivo'], prefill: {} } },
                            'NewVehicle': { label: '+ Vehículo', icon: <Car size={28} color="#4CAF50" />, isForm: true, params: { title: 'Nuevo Vehículo', dataKey: 'vehiculos', fields: ['ID_Vehiculo', 'Marca', 'Modelo', 'Año', 'Matricula', 'Color'], prefill: {} } },
                            'NewRescue': { label: '+ Rescate', icon: <MapPin size={28} color="#E91E63" />, isForm: true, params: { title: 'Nuevo Rescate', dataKey: 'rescates', fields: ['IdRescate', 'Cliente', 'Matricula', 'Fecha', 'Hora', 'Punto de Partida', 'Lugar del Rescate'], prefill: { 'Estado': 'Pendiente', 'Fecha': new Date().toISOString().split('T')[0], 'Punto de Partida': settings?.tallerName || 'Taller' } } },
                            'NewProduct': { label: '+ Producto', icon: <ClipboardList size={28} color="#FF5722" />, isForm: true, params: { title: 'Nuevo Producto', dataKey: 'productos', fields: ['ID_Producto', 'Nombre', 'Precio', 'Stock'], prefill: {} } },
                            'NewTech': { label: '+ Técnico', icon: <Users size={28} color="#FF9800" />, isForm: true, params: { title: 'Nuevo Técnico', dataKey: 'tecnicos', fields: ['ID_Tecnico', 'Nombre', 'Especialidad', 'Teléfono'], prefill: {} } },
                            'NewService': { label: '+ Servicio', icon: <Wrench size={28} color="#4CAF50" />, isForm: true, params: { title: 'Nuevo Servicio', dataKey: 'servicios', fields: ['ID_Servicio', 'Nombre', 'Precio', 'Descripción'], prefill: {} } },
                            'Scanner': { label: 'Escanear', icon: <Scan size={28} color={colors.primary} />, isScanner: true },
                        };
                        return shortcutsList.map(id => {
                            const config = SHORTCUT_CONFIG[id];
                            if (!config) return null;
                            return (
                                <View key={id} style={styles.shortcutWrapper}>
                                    <ShortcutBtn
                                        label={config.label}
                                        icon={config.icon}
                                        onPress={() => {
                                            if (config.isScanner) handleSimulatedScan();
                                            else if (config.isForm) navigation.navigate('Form', config.params);
                                            else navigation.navigate(config.route);
                                        }}
                                        colors={colors}
                                    />
                                </View>
                            );
                        });
                    })()}
                </View>

            </ScrollView>

            <ScanModal 
                visible={scanning} 
                onClose={() => setScanning(false)} 
                onScan={handleRealScanResult} 
                field={scanField} 
                colors={colors} 
            />
            
            <FAB 
                icon={
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <MapPin size={28} color="white" />
                        <View style={{ position: 'absolute', right: -6, top: -4, backgroundColor: colors.primary, borderRadius: 10, padding: 1 }}>
                            <Plus size={14} color="white" strokeWidth={3} />
                        </View>
                    </View>
                }
                onPress={() => navigation.navigate('Form', { 
                    title: 'Nuevo Rescate', 
                    dataKey: 'rescates', 
                    fields: ['IdRescate', 'Cliente', 'Matricula', 'Fecha', 'Hora', 'Punto de Partida', 'Lugar del Rescate', 'Trayectoria'],
                    prefill: { 
                        'Estado': 'Pendiente', 
                        'Fecha': new Date().toISOString().split('T')[0],
                        'Punto de Partida': settings?.tallerName || 'Taller'
                    }
                })} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    scroll: {
        padding: 16,
        paddingBottom: 100,
    },
    greet: {
        marginBottom: 20,
        marginTop: 8,
    },
    greetTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    greetSub: {
        fontSize: 14,
        marginTop: 4,
    },

    /* Stats grid */
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    statCard: {
        width: CARD_WIDTH,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statCount: {
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },

    greetSub: { fontSize: 14, fontWeight: '500' },
    
    /* Finance Styles */
    financeCard: {
        marginHorizontal: 16, borderRadius: 16, padding: 16, borderWidth: 1, 
        flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 10
    },
    financeItem: { alignItems: 'center' },
    financeLabel: { fontSize: 11, marginBottom: 4, fontWeight: '500' },
    financeValue: { fontSize: 18, fontWeight: 'bold' },
    financeDivider: { width: 1, height: 40, backgroundColor: 'rgba(150,150,150,0.2)' },

    /* Shortcuts */
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    shortcuts: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4, // compensar el padding de los atajos
    },
    shortcutWrapper: {
        width: '25%',
        padding: 4,
    },
    shortcut: {
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        minHeight: 85,
        justifyContent: 'center',
    },
    shortcutIcon: {
        marginBottom: 8,
    },
    shortcutText: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },
});
