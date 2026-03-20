import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Colors } from '../constants';
import { ClipboardList, Car, Users, FileCheck, Warehouse, Calendar, Wrench, Search, MapPin } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { FAB } from '../components/FAB';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const StatCard = ({ title, count, icon, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statCount}>{count ?? '—'}</Text>
        <Text style={styles.statLabel}>{title}</Text>
    </TouchableOpacity>
);

const ShortcutBtn = ({ label, icon, onPress }) => (
    <TouchableOpacity style={styles.shortcut} onPress={onPress} activeOpacity={0.75}>
        <View style={styles.shortcutIcon}>{icon}</View>
        <Text style={styles.shortcutText}>{label}</Text>
    </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
    const { orders, clients, vehiculos, citas, settings } = useData();

    const activeOrders = (orders || []).filter(o =>
        o.Estado?.toLowerCase().includes('pendiente') ||
        o.Estado?.toLowerCase().includes('proceso')
    ).length;

    return (
        <View style={styles.screen}>
            <CustomHeader title="INICIO" />
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Saludo */}
                <View style={styles.greet}>
                    <Text style={styles.greetTitle}>¡Buen día!</Text>
                    <Text style={styles.greetSub}>Resumen de tu taller</Text>
                </View>

                {/* Tarjetas de estadísticas */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Órdenes activas"
                        count={activeOrders}
                        icon={<ClipboardList size={26} color={Colors.primary} />}
                        onPress={() => navigation.navigate('Orders')}
                    />
                    <StatCard
                        title="Clientes"
                        count={clients?.length}
                        icon={<Users size={26} color="#E53935" />}
                        onPress={() => navigation.navigate('ClientList')}
                    />
                    <StatCard
                        title="Vehículos"
                        count={vehiculos?.length}
                        icon={<Car size={26} color="#4CAF50" />}
                        onPress={() => navigation.navigate('VehicleList')}
                    />
                    <StatCard
                        title="Citas"
                        count={citas?.length}
                        icon={<Calendar size={26} color="#FF9800" />}
                        onPress={() => navigation.navigate('AppointmentList')}
                    />
                </View>

                {/* Accesos rápidos */}
                <Text style={styles.sectionTitle}>Accesos rápidos</Text>
                <View style={styles.shortcuts}>
                    {(() => {
                        const shortcutsList = settings?.shortcuts || ['Garage', 'Billing', 'Services', 'VehicleSearch'];
                        const SHORTCUT_CONFIG = {
                            'Garage': { label: 'Garage', icon: <Warehouse size={28} color={Colors.primary} />, route: 'Garage' },
                            'Billing': { label: 'Facturación', icon: <FileCheck size={28} color="#E53935" />, route: 'Billing' },
                            'Services': { label: 'Servicios', icon: <Wrench size={28} color="#4CAF50" />, route: 'Services' },
                            'VehicleSearch': { label: 'Buscar', icon: <Search size={28} color="#FF9800" />, route: 'VehicleSearch' },
                            'Orders': { label: 'Órdenes', icon: <ClipboardList size={28} color="#9C27B0" />, route: 'Orders' },
                            'AppointmentList': { label: 'Citas', icon: <Calendar size={28} color="#FF5722" />, route: 'AppointmentList' },
                            'ClientList': { label: 'Clientes', icon: <Users size={28} color="#03A9F4" />, route: 'ClientList' },
                            'Rescue': { label: 'Rescate', icon: <MapPin size={28} color="#E91E63" />, route: 'Rescue' },
                        };
                        return shortcutsList.map(id => {
                            const config = SHORTCUT_CONFIG[id];
                            if (!config) return null;
                            return (
                                <ShortcutBtn
                                    key={id}
                                    label={config.label}
                                    icon={config.icon}
                                    onPress={() => navigation.navigate(config.route)}
                                />
                            );
                        });
                    })()}
                </View>

            </ScrollView>
            
            <FAB 
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
        backgroundColor: Colors.background,
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
        color: Colors.text,
        fontSize: 26,
        fontWeight: 'bold',
    },
    greetSub: {
        color: Colors.textSecondary,
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
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'flex-start',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(59,89,152,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statCount: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    statLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },

    /* Shortcuts */
    sectionTitle: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    shortcuts: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    shortcut: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginHorizontal: 4,
    },
    shortcutIcon: {
        marginBottom: 8,
    },
    shortcutText: {
        color: Colors.textSecondary,
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },
});
