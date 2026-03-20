import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Users, List, Wrench, Package, ArrowUpRight, Calendar, Info, Share2, LayoutGrid, Settings } from 'lucide-react-native';
import { Colors } from '../constants';

export function CustomDrawerContent(props) {
    const menuItems = [
        { label: 'CITAS', icon: <Calendar size={22} color={Colors.textSecondary} />, navigateTo: 'AppointmentList', inTabs: true },
        { label: 'CLIENTES', icon: <Users size={22} color={Colors.textSecondary} />, navigateTo: 'ClientList', inTabs: true },
        { label: 'ÓRDENES', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Orders', inTabs: true },
        { label: 'DETALLE DE FACTURA', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'GenericDetails', inTabs: true },
        { label: 'ENTRADAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Entradas', inTabs: true },
        { label: 'Facturando', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'InvoicingList', inTabs: true },
        { label: 'FACTURAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Billing', inTabs: true },
        { label: 'FOTOS ENTRADA', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'FotosEntrada', inTabs: true },
        { label: 'FOTOS SALIDAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'FotosSalidas', inTabs: true },
        { label: 'PRODUCTOS', icon: <Package size={22} color={Colors.textSecondary} />, navigateTo: 'Productos', inTabs: true },
        { label: 'SALIDAS', icon: <ArrowUpRight size={22} color={Colors.textSecondary} />, navigateTo: 'Salidas', inTabs: true },
        { label: 'TECNICOS', icon: <Wrench size={22} color={Colors.textSecondary} />, navigateTo: 'TechnicianList', inTabs: true },
        { label: 'Herramientas', icon: <Wrench size={22} color={Colors.textSecondary} />, navigateTo: 'Herramientas', inTabs: true },
        { label: 'Vehículos', icon: <Users size={22} color={Colors.textSecondary} />, navigateTo: 'VehicleList', inTabs: true },
        { label: 'CATALOGO', icon: <LayoutGrid size={22} color={Colors.textSecondary} />, navigateTo: 'Catálogo', inTabs: true },
        { label: 'About', icon: <Info size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard', inTabs: true },
        { label: 'Share', icon: <Share2 size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard', inTabs: true },
        { label: 'App Gallery', icon: <LayoutGrid size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard', inTabs: true },
        { label: 'CONFIGURACIÓN', icon: <Settings size={22} color={Colors.primary} />, navigateTo: 'Settings', inTabs: true },
    ];

    const handleNavigation = (item) => {
        if (item.inTabs) {
            // Navegación anidada para mantener las pestañas (Tabs -> MainStack -> Drawer)
            props.navigation.navigate('Main', {
                screen: 'Tabs',
                params: { screen: item.navigateTo }
            });
        } else {
            props.navigation.navigate(item.navigateTo);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#222' }}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>🛠️</Text>
                    </View>
                </View>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Taller de</Text>
                    <Text style={styles.headerSubtitle}>reparacion auto</Text>
                </View>
            </View>

            <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.drawerItem}
                        onPress={() => handleNavigation(item)}
                    >
                        <View style={styles.iconContainer}>{item.icon}</View>
                        <Text style={styles.drawerLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </DrawerContentScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>H</Text>
                    </View>
                    <Text style={styles.email}>hairoman28@gmail.com</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 160,
        backgroundColor: Colors.primary,
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    logoContainer: {
        marginRight: 15,
    },
    logoBox: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    logoText: {
        fontSize: 34,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '300',
        opacity: 0.9,
    },
    headerSubtitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    iconContainer: {
        marginRight: 20,
        width: 24,
        alignItems: 'center',
    },
    drawerLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '400',
    },
    footer: {
        backgroundColor: '#333',
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#444',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B5998',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    email: {
        color: '#AAA',
        fontSize: 14,
        flex: 1,
    },
    logoutBtn: {
        alignSelf: 'flex-end',
    },
    logoutText: {
        color: '#3B5998',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
