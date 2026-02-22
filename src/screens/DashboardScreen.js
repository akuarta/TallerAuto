import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Colors } from '../constants';
import { ClipboardList, Car, Users, FileCheck } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import { FAB } from '../components/FAB';

const DashboardCard = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardHeader}>
            {icon}
        </View>
        <View style={styles.cardFooter}>
            <Text style={styles.cardTitle}>{title}</Text>
        </View>
    </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
            <CustomHeader title="INICIO" />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.grid}>
                    <DashboardCard
                        title="SERVICIOS"
                        icon={<ClipboardList size={100} color="#000" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Services')}
                    />
                    <DashboardCard
                        title="CLIENTES"
                        icon={<Users size={100} color="#000" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Clients')}
                    />
                    <DashboardCard
                        title="ORDENES"
                        icon={<ClipboardList size={100} color="#3B5998" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Orders')}
                    />
                    <DashboardCard
                        title="FACTURAS"
                        icon={<FileCheck size={100} color="#000" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Invoices')}
                    />
                    <DashboardCard
                        title="GARAGE"
                        icon={<Car size={100} color="#FB8C00" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Garage')}
                    />
                    <DashboardCard
                        title="CITAS"
                        icon={<ClipboardList size={100} color="#4CAF50" />}
                        color="#FFF"
                        onPress={() => navigation.navigate('Citas')}
                    />
                </View>
            </ScrollView>
            <FAB onPress={() => navigation.navigate('Form', {
                title: 'Cita',
                dataKey: 'citas',
                fields: ['ID_Cita', 'Tipo de cita', 'Turno', 'Agendado', 'Cliente', 'Fecha ']
            })} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        aspectRatio: 0.85,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    cardHeader: {
        flex: 3,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    cardFooter: {
        height: 40,
        backgroundColor: '#222',
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    cardTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
