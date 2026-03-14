import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { Phone, Star, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useData } from '../context/DataContext';

const DetailItem = ({ label, value }) => {
    const isPhone = label.toLowerCase().includes('telefono') || label.toLowerCase().includes('teléfono');

    const handleCall = () => {
        if (!value) return;
        const cleanNumber = value.toString().replace(/[^0-9+]/g, '');
        const url = `tel:${cleanNumber}`;

        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert('Error', 'No se puede realizar la llamada desde este dispositivo.');
                }
            })
            .catch((err) => console.error('Error:', err));
    };

    return (
        <View style={styles.itemContainer}>
            <Text style={styles.label}>{label}</Text>
            {isPhone && value ? (
                <TouchableOpacity style={styles.phoneValueContainer} onPress={handleCall}>
                    <Text style={[styles.value, { color: Colors.primary, fontWeight: 'bold' }]}>{value}</Text>
                    <View style={styles.callIconSmall}>
                        <Phone size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>
            ) : (
                <Text style={styles.value}>{value || 'N/A'}</Text>
            )}
        </View>
    );
};

// Campos técnicos a ocultar (IDs internos, referencias técnicas, etc.)
const hiddenFields = ['id', 'ref', 'pdf', 'PDF', 'firma', 'Firma', 'foto', 'Foto', 'fotos', 'Fotos', 'image', 'Image', 'images', 'Images'];

export default function GenericDetailsScreen({ route, navigation }) {
    const { item, title } = route.params;

    // Filtrar campos técnicos
    const visibleEntries = Object.entries(item).filter(([key]) => {
        const keyLower = key.toLowerCase();
        // Ocultar campos que contengan patrones técnicos
        return !hiddenFields.some(hidden => keyLower.includes(hidden.toLowerCase()));
    });

    const isClient = title.toLowerCase().includes('cliente');
    const { getClientReputation } = useData();
    const reputation = isClient ? getClientReputation(item.Nombre) : null;

    return (
        <View style={styles.container}>
            <CustomHeader
                title={`DETALLE: ${title}`}
                showBack={true}
                leftAction={() => {
                    const titleLower = title.toLowerCase();
                    if (titleLower.includes('orden')) navigation.navigate('Orders');
                    else if (titleLower.includes('técnico') || titleLower.includes('tecnico')) {
                        if (titleLower.includes('detalle')) navigation.navigate('VehicleSearch');
                        else navigation.navigate('TechnicianList');
                    }
                    else if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) navigation.navigate('VehicleList');
                    else if (titleLower.includes('cliente')) navigation.navigate('ClientList');
                    else if (titleLower.includes('cita')) navigation.navigate('AppointmentList');
                    else if (titleLower.includes('facturando')) navigation.navigate('InvoicingList');
                    else navigation.navigate('Dashboard');
                }}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                {isClient && reputation && (
                    <View style={styles.reputationSection}>
                        <View style={styles.reputationHeader}>
                            <View>
                                <Text style={styles.reputationTitle}>REPUTACIÓN DEL CLIENTE</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            size={20}
                                            color={s <= reputation.estrellas ? "#FFD700" : Colors.textSecondary + '40'}
                                            fill={s <= reputation.estrellas ? "#FFD700" : "transparent"}
                                        />
                                    ))}
                                </View>
                            </View>
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsLabel}>SCORE</Text>
                                <Text style={styles.pointsValue}>{reputation.puntos}</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Text style={styles.statBoxLabel}>Visitas</Text>
                                <Text style={styles.statBoxValue}>{reputation.visitas}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statBoxLabel}>Propinas</Text>
                                <Text style={[styles.statBoxValue, { color: '#32CD32' }]}>${reputation.totalPropinas}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statBoxLabel}>Regateos</Text>
                                <Text style={[styles.statBoxValue, { color: '#FF6347' }]}>${reputation.totalRegateos}</Text>
                            </View>
                        </View>

                        {reputation.frecuenciaRegateo > 0 && (
                            <View style={styles.warningBox}>
                                <AlertTriangle size={20} color="#FF6347" />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.warningBoxTitle}>Historial de Regateo</Text>
                                    <Text style={styles.warningBoxText}>Este cliente ha regateado en {reputation.frecuenciaRegateo} ocasiones.</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.card}>
                    {visibleEntries.map(([key, value]) => (
                        <DetailItem
                            key={key}
                            label={key.replace(/_/g, ' ').toUpperCase()}
                            value={value?.toString()}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 16 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + '40',
        paddingBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
        color: Colors.text,
        fontSize: 16,
    },
    phoneValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3B599810',
        padding: 8,
        borderRadius: 8,
    },
    callIconSmall: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reputationSection: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reputationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    reputationTitle: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
    },
    pointsBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    pointsLabel: {
        color: Colors.primary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    pointsValue: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border + '40',
    },
    statBoxLabel: {
        color: Colors.textSecondary,
        fontSize: 10,
        marginBottom: 4,
    },
    statBoxValue: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF634710',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF634730',
    },
    warningBoxTitle: {
        color: '#FF6347',
        fontSize: 14,
        fontWeight: 'bold',
    },
    warningBoxText: {
        color: '#FF6347',
        fontSize: 12,
        opacity: 0.8,
    },
});
