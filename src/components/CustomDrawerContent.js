import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Users, List, Wrench, Package, ArrowUpRight, Calendar, Info, Share2, LayoutGrid } from 'lucide-react-native';
import { Colors } from '../constants';

export function CustomDrawerContent(props) {
    const menuItems = [
        { label: 'CITAS', icon: <Calendar size={22} color={Colors.textSecondary} />, navigateTo: 'Citas' },
        { label: 'CLIENTES', icon: <Users size={22} color={Colors.textSecondary} />, navigateTo: 'Clients' },
        { label: 'DETALLE DE FACTURA', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'InvoiceDetails' },
        { label: 'ENTRADAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Entradas' },
        { label: 'Facturando', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Facturando' },
        { label: 'FACTURAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'Invoices' },
        { label: 'FOTOS ENTRADA', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'FotosEntrada' },
        { label: 'FOTOS SALIDAS', icon: <List size={22} color={Colors.textSecondary} />, navigateTo: 'FotosSalidas' },
        { label: 'PRODUCTOS', icon: <Package size={22} color={Colors.textSecondary} />, navigateTo: 'Productos' },
        { label: 'SALIDAS', icon: <ArrowUpRight size={22} color={Colors.textSecondary} />, navigateTo: 'Salidas' },
        { label: 'TECNICOS', icon: <Wrench size={22} color={Colors.textSecondary} />, navigateTo: 'Tecnicos' },
        { label: 'Herramientas', icon: <Wrench size={22} color={Colors.textSecondary} />, navigateTo: 'Herramientas' },
        { label: 'About', icon: <Info size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard' },
        { label: 'Share', icon: <Share2 size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard' },
        { label: 'App Gallery', icon: <LayoutGrid size={22} color={Colors.textSecondary} />, navigateTo: 'Dashboard' },
    ];

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
                        onPress={() => props.navigation.navigate(item.navigateTo)}
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
        height: 140,
        backgroundColor: '#333',
        padding: 20,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 12,
    },
    logoBox: {
        width: 60,
        height: 60,
        backgroundColor: '#111',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 30,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '400',
    },
    headerSubtitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
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
