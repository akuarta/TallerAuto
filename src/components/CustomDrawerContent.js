import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Users, List, Wrench, Package, ArrowUpRight, Calendar, Settings, LayoutGrid, FileText, ClipboardList } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export function CustomDrawerContent(props) {
    const { colors, isDark } = useTheme();

    const menuItems = [
        { label: 'CALENDARIO/CITAS', icon: <Calendar size={22} color={colors.textSecondary} />, navigateTo: 'AppointmentList' },
        { label: 'CLIENTES', icon: <Users size={22} color={colors.textSecondary} />, navigateTo: 'ClientList' },
        { label: 'REPORTE FINANCIERO', icon: <FileText size={22} color={colors.primary} />, navigateTo: 'Billing' }, // Billing es el Stack que contiene el reporte
        { label: 'ÓRDENES ACTIVAS', icon: <ClipboardList size={22} color={colors.textSecondary} />, navigateTo: 'Orders' },
        { label: 'EN TALLER (ENTRADAS)', icon: <List size={22} color={colors.textSecondary} />, navigateTo: 'Entradas' },
        { label: 'FACTURADO', icon: <FileText size={22} color={colors.textSecondary} />, navigateTo: 'InvoicingList' },
        { label: 'HISTORIAL DE GASTOS', icon: <List size={22} color="#E53935" />, navigateTo: 'Gastos' },
        { label: 'INVENTARIO/PRODUCTOS', icon: <Package size={22} color={colors.textSecondary} />, navigateTo: 'Inventory' },
        { label: 'SALIDAS FINALIZADAS', icon: <ArrowUpRight size={22} color={colors.textSecondary} />, navigateTo: 'Salidas' },
        { label: 'TÉCNICOS', icon: <Wrench size={22} color={colors.textSecondary} />, navigateTo: 'TechnicianList' },
        { label: 'VEHICULOS', icon: <List size={22} color={colors.textSecondary} />, navigateTo: 'VehicleManager' },
        { label: 'MANUALES CHARM', icon: <LayoutGrid size={22} color={colors.textSecondary} />, navigateTo: 'CharmWeb' },
        { label: 'AJUSTES', icon: <Settings size={22} color={colors.primary} />, navigateTo: 'Settings' },
    ];

    const handleNavigation = (item) => {
        props.navigation.navigate('Main', {
            screen: 'Tabs',
            params: { screen: item.navigateTo }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>🛠️</Text>
                    </View>
                </View>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Gestor de</Text>
                    <Text style={styles.headerSubtitle}>Taller Auto</Text>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleNavigation(item)}
                    >
                        <View style={styles.iconContainer}>{item.icon}</View>
                        <Text style={[styles.drawerLabel, { color: colors.text }]}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </DrawerContentScrollView>

            <View style={[styles.footer, { backgroundColor: isDark ? colors.card : '#F2F2F7', borderTopColor: colors.border }]}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Text style={styles.avatarText}>H</Text>
                    </View>
                    <Text numberOfLines={1} style={[styles.email, { color: colors.textSecondary }]}>hairoman28@gmail.com</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 140,
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: 5,
    },
    logoContainer: {
        marginRight: 15,
    },
    logoBox: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 28,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '300',
    },
    headerSubtitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconContainer: {
        marginRight: 15,
        width: 24,
        alignItems: 'center',
    },
    drawerLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    footer: {
        padding: 15,
        paddingBottom: 30,
        borderTopWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    email: {
        fontSize: 12,
        flex: 1,
    },
});
