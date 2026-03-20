import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { MapPin, Clock, ChevronRight, Filter, AlertCircle, CheckCircle2, Timer, XCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react-native';
import { FAB } from '../components/FAB';

const STATUS_CONFIG = {
    'Pendiente': { color: '#FF9800', icon: AlertCircle, bg: '#FFF3E0' },
    'En Proceso': { color: '#2196F3', icon: Timer, bg: '#E3F2FD' },
    'Finalizado': { color: '#4CAF50', icon: CheckCircle2, bg: '#E8F5E9' },
    'Cancelado': { color: '#F44336', icon: XCircle, bg: '#FFEBEE' },
};

export default function RescueListScreen({ navigation }) {
    const { rescates, loading, updateItem, settings } = useData();
    const [activeStatus, setActiveStatus] = useState('Pendiente');

    const statuses = ['Todos', 'Pendiente', 'En Proceso', 'Finalizado', 'Cancelado'];

    const filteredRescates = (rescates || []).filter(r => {
        const itemStatus = (r.Estado || 'Pendiente').toLowerCase();
        if (activeStatus === 'Todos') return true;
        if (activeStatus === 'En Proceso') {
            return itemStatus.includes('proceso') || itemStatus.includes('camino');
        }
        return itemStatus.includes(activeStatus.toLowerCase());
    });

    const renderHeader = () => (
        <View style={styles.statusTabs}>
            {statuses.map(st => {
                const isActive = activeStatus === st;
                const count = (rescates || []).filter(r => {
                    const itemStatus = (r.Estado || 'Pendiente').toLowerCase();
                    if (st === 'Todos') return true;
                    if (st === 'En Proceso') return itemStatus.includes('proceso') || itemStatus.includes('camino');
                    return itemStatus.includes(st.toLowerCase());
                }).length;

                return (
                    <TouchableOpacity
                        key={st}
                        style={[styles.tab, isActive && styles.activeTab]}
                        onPress={() => setActiveStatus(st)}
                    >
                        <Text style={[styles.tabText, isActive && styles.activeTabText]}>{st}</Text>
                        {count > 0 && (
                            <View style={[styles.badge, isActive ? { backgroundColor: '#FFF' } : { backgroundColor: Colors.primary }]}>
                                <Text style={[styles.badgeText, isActive ? { color: Colors.primary } : { color: '#FFF' }]}>{count}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderItem = ({ item }) => {
        const status = item.Estado || 'Pendiente';
        const statusLower = status.toLowerCase();
        
        let config = STATUS_CONFIG['Pendiente'];
        if (statusLower.includes('proceso') || statusLower.includes('camino')) config = STATUS_CONFIG['En Proceso'];
        else if (statusLower.includes('finalizado') || statusLower.includes('completado')) config = STATUS_CONFIG['Finalizado'];
        else if (statusLower.includes('cancelado')) config = STATUS_CONFIG['Cancelado'];
        
        const StatusIcon = config.icon;

        return (
            <TouchableOpacity
                style={styles.rescueCard}
                onPress={() => navigation.navigate('RescueDetails', { rescue: item })}
            >
                <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.clientInfo}>
                            <Text style={styles.clientName}>{item.Cliente || 'Cliente Desconocido'}</Text>
                            <Text style={styles.vehicleInfo}>{item.Matricula || 'S/M'} • {item.Vehiculo || 'Vehículo'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <StatusIcon size={12} color={config.color} />
                            <Text style={[styles.statusText, { color: config.color }]}>{status}</Text>
                        </View>
                    </View>

                    <View style={styles.addressRow}>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.addressText} numberOfLines={1}>{item['Lugar del Rescate'] || 'Dirección no especificada'}</Text>
                    </View>

                    <View style={styles.footerRow}>
                        <View style={styles.timeInfo}>
                            <Clock size={14} color={Colors.textSecondary} />
                            <Text style={styles.timeText}>{item.Fecha || ''} {item.Hora || ''}</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.border} />
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    {statusLower.includes('pendiente') ? (
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => updateItem('rescates', item.id, { Estado: 'En Proceso' })}
                        >
                            <ArrowDownCircle size={32} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : (statusLower.includes('proceso') || statusLower.includes('camino')) ? (
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => updateItem('rescates', item.id, { Estado: 'Finalizado' })}
                        >
                            <ArrowUpCircle size={32} color={Colors.accent} />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="LISTA DE RESCATES" leftIcon="menu" onLeftPress={() => navigation.toggleDrawer()} />
            
            {renderHeader()}

            <FlatList
                data={filteredRescates}
                keyExtractor={(item) => item.id || Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Filter size={48} color={Colors.border} />
                        <Text style={styles.emptyTitle}>No hay rescates {!!activeStatus && activeStatus.toLowerCase()}s</Text>
                        <Text style={styles.emptySubtitle}>Los nuevos pedidos aparecerán aquí automáticamente.</Text>
                    </View>
                }
            />

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
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    statusTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    activeTabText: {
        color: '#FFF',
    },
    badge: {
        marginLeft: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 10,
        minWidth: 18,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
        flexGrow: 1,
    },
    rescueCard: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusIndicator: {
        width: 5,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    clientInfo: {
        flex: 1,
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    vehicleInfo: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressText: {
        fontSize: 13,
        color: Colors.text,
        marginLeft: 6,
        flex: 1,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 10,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    actionButtons: {
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    actionBtn: {
        padding: 8,
    },
});
