import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useData, API_URL } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { CustomHeader } from '../components/CustomHeader';
import { Phone, Star, AlertTriangle, TrendingUp, TrendingDown, FileText, ArrowRight } from 'lucide-react-native';
import { formatCurrency } from '../utils/formatters';

const DetailItem = ({ label, value, colors }) => {
    const labelLower = label.toLowerCase();
    const isPhone = labelLower.includes('telefono') || labelLower.includes('teléfono');
    const isCurrency = labelLower.includes('precio') || labelLower.includes('costo') || labelLower.includes('total') || labelLower.includes('subtotal') || labelLower.includes('impuesto') || labelLower.includes('descuento') || labelLower.includes('pago') || labelLower.includes('pagado') || labelLower.includes('propina') || labelLower.includes('regateo');

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
        <View style={[styles.itemContainer, { borderBottomColor: colors.border + '40' }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            {isPhone && value ? (
                <TouchableOpacity style={[styles.phoneValueContainer, { backgroundColor: colors.primary + '10' }]} onPress={handleCall}>
                    <Text style={[styles.value, { color: colors.primary, fontWeight: 'bold' }]}>{value}</Text>
                    <View style={styles.callIconSmall}>
                        <Phone size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>
            ) : (
                <Text style={[styles.value, { color: isCurrency ? '#4CAF50' : colors.text, fontWeight: isCurrency ? 'bold' : 'normal' }]}>
                    {isCurrency && value ? formatCurrency(value) : (value || 'N/A')}
                </Text>
            )}
        </View>
    );
};

// Campos técnicos a ocultar (IDs internos, referencias técnicas, etc.)
const hiddenFields = ['id', 'ref', 'pdf', 'PDF', 'firma', 'Firma', 'foto', 'Foto', 'fotos', 'Fotos', 'image', 'Image', 'images', 'Images'];

export default function GenericDetailsScreen({ route, navigation }) {
    const { item = {}, title = 'Detalles' } = route.params || {};
    const { colors } = useTheme();
    const { getClientReputation, invoices, facturando, orders } = useData();

    // Filtrar campos técnicos
    const visibleEntries = Object.entries(item).filter(([key]) => {
        const keyLower = key.toLowerCase();
        // Ocultar campos técnicos
        return !hiddenFields.some(hidden => keyLower.includes(hidden.toLowerCase()));
    });

    const isClient = title.toLowerCase().includes('cliente');
    const reputation = isClient ? getClientReputation(item.Nombre) : null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader
                title={`DETALLE: ${title}`}
                showBack={true}
                leftAction={() => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                        return;
                    }
                    const titleLower = title.toLowerCase();
                    if (titleLower.includes('orden')) navigation.navigate('Orders');
                    else if (titleLower.includes('técnico') || titleLower.includes('tecnico')) {
                        if (titleLower.includes('detalle')) navigation.navigate('VehicleSearch');
                        else navigation.navigate('TechnicianList');
                    }
                    else if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) navigation.navigate('VehicleManager');
                    else if (titleLower.includes('cliente')) navigation.navigate('ClientList');
                    else if (titleLower.includes('cita')) navigation.navigate('AppointmentList');
                    else if (titleLower.includes('facturando')) navigation.navigate('InvoicingList');
                    else navigation.navigate('Dashboard');
                }}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                {isClient && reputation && (
                    <View style={[styles.reputationSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.reputationHeader}>
                            <View>
                                <Text style={[styles.reputationTitle, { color: colors.textSecondary }]}>REPUTACIÓN DEL CLIENTE</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            size={20}
                                            color={s <= reputation.estrellas ? "#FFD700" : colors.textSecondary + '40'}
                                            fill={s <= reputation.estrellas ? "#FFD700" : "transparent"}
                                        />
                                    ))}
                                </View>
                            </View>
                            <View style={[styles.pointsBadge, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={[styles.pointsLabel, { color: colors.primary }]}>SCORE</Text>
                                <Text style={[styles.pointsValue, { color: colors.primary }]}>{reputation.puntos}</Text>
                            </View>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border + '40' }]}>
                                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Visitas</Text>
                                <Text style={[styles.statBoxValue, { color: colors.text }]}>{reputation.visitas}</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border + '40' }]}>
                                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Propinas</Text>
                                <Text style={[styles.statBoxValue, { color: '#32CD32' }]}>{formatCurrency(reputation.totalPropinas)}</Text>
                            </View>
                            <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border + '40' }]}>
                                <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Regateos</Text>
                                <Text style={[styles.statBoxValue, { color: '#FF6347' }]}>{formatCurrency(reputation.totalRegateos)}</Text>
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

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {visibleEntries.map(([key, value]) => (
                        <DetailItem
                            key={key}
                            label={key.replace(/_/g, ' ').toUpperCase()}
                            value={value?.toString()}
                            colors={colors}
                        />
                    ))}
                </View>

                {(() => {
                    const isOrder = title.toLowerCase().includes('orden');
                    const isInvoice = title.toLowerCase().includes('factura') || title.toLowerCase().includes('facturado');
                    
                    if (!isOrder && !isInvoice) return null;


                    // Buscamos si ya existe el PDF en los datos
                    const findPDFInAnySheet = () => {
                        const directPDF = Object.entries(item).find(([k, v]) => (k.toLowerCase().includes('pdf') || String(v).toLowerCase().includes('.pdf')) && v);
                        if (directPDF) return directPDF[1];
                        const id = item.Factura || item.id || item.ID_Factura || item.ID_Orden || item.TURNO;
                        if (!id) return null;
                        const allSheets = [orders, facturando, invoices];
                        for (const sheet of allSheets) {
                            if (!sheet) continue;
                            const match = sheet.find(s => (s.Factura === id || s.id === id || s.ID_Factura === id || s.ID_Orden === id || s.TURNO === id));
                            if (match) {
                                const p = Object.entries(match).find(([k, v]) => (k.toLowerCase().includes('pdf') || String(v).toLowerCase().includes('.pdf')) && v);
                                if (p) return p[1];
                            }
                        }
                        return null;
                    };

                    const existingPDF = findPDFInAnySheet();


                    const handlePDFPress = (path) => {
                        const p = String(path).trim();
                        let finalUrl;

                        if (p.startsWith('http://') || p.startsWith('https://')) {
                            // URL completa — abrir directamente
                            finalUrl = p;
                        } else if (p.includes('/edit') || p.includes('spreadsheets/d') || p.includes('/view')) {
                            // URL parcial de Google Docs/Sheets (le falta https://docs.google.com/)
                            finalUrl = `https://docs.google.com/${p.replace(/^\//, '')}`;
                        } else if (/^[A-Za-z0-9_-]{25,}$/.test(p)) {
                            // Parece un ID de Google Drive (25+ caracteres alfanuméricos)
                            finalUrl = `https://drive.google.com/file/d/${p}/view`;
                        } else {
                            // Es un nombre de archivo (ej: HO01.PDF) — buscar en carpeta PDFS
                            const PDFS_FOLDER_ID = '1sT52R92wMXs6jLQakvlAevoGXtR8PU01';
                            finalUrl = `https://drive.google.com/drive/folders/${PDFS_FOLDER_ID}?q=${encodeURIComponent(p)}`;
                        }
                        console.log('🌐 [PDF] Abriendo URL:', finalUrl);
                        Linking.openURL(finalUrl);
                    };


                    return (
                        <View style={{ marginTop: 20 }}>
                            {existingPDF ? (
                                <TouchableOpacity style={[styles.printButton, { backgroundColor: '#2196F3', marginBottom: 15 }]} onPress={() => handlePDFPress(existingPDF)}>
                                    <FileText size={20} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.printButtonText}>{isOrder ? 'VER REPORTE ORDEN (PDF)' : 'VER FACTURA (PDF)'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.printButton, { backgroundColor: colors.primary, marginBottom: 15 }]} onPress={() => {
                                    const docId = item.Factura || item.id || item.ID_Factura || item.ID_Orden || item.TURNO;
                                    const docType = isOrder ? 'order' : 'invoice';
                                    const url = `${API_URL}?action=generatePDF&id=${docId}&type=${docType}`;
                                    Linking.openURL(url);
                                }}>
                                    <FileText size={20} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.printButtonText}>{isOrder ? 'GENERAR REPORTE/DIAGNÓSTICO' : 'GENERAR FACTURA PDF'}</Text>
                                </TouchableOpacity>
                            )}
                            {isOrder && (
                                <TouchableOpacity style={[styles.printButton, { backgroundColor: '#FF9800', marginTop: 10 }]} onPress={() => navigation.navigate('InvoicingList')}>
                                    <ArrowRight size={20} color="#FFF" style={{ marginRight: 10 }} />
                                    <Text style={styles.printButtonText}>PASAR A FACTURACIÓN</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    );
                })()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16 },
    card: {
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    itemContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
    },
    phoneValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    reputationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    reputationTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    starsRow: {
        flexDirection: 'row',
    },
    pointsBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
    },
    pointsLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    pointsValue: {
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
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
    },
    statBoxLabel: {
        fontSize: 10,
        marginBottom: 4,
    },
    statBoxValue: {
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
    printButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    printButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    pdfButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 2,
    },
    pdfButtonText: {
        fontSize: 16,
        fontWeight: '800',
        marginLeft: 10,
        letterSpacing: 1,
    },
});
