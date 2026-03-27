import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CustomHeader } from '../components/CustomHeader';
import { formatCurrency } from '../utils/formatters';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    Briefcase,
    Package,
    Wrench,
    ArrowRight,
    Wallet,
    Info,
    ClipboardList
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

/**
 * Pantalla Integral de Finanzas (Contabilidad Completa)
 * Engloba Ingresos (Facturas/Facturando/Órdenes), Egresos (Gastos) y Activos.
 */
export default function FinancialReportScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const allAppData = useData();
    
    const { 
        invoices = [], 
        facturando = [], 
        orders = [],
        gastos = [], 
        productos = [], 
        herramientas = [] 
    } = allAppData;

    const styles = getStyles(colors, isDark);

    const metrics = useMemo(() => {
        const parse = (val) => {
            if (val === null || val === undefined) return 0;
            return parseFloat(String(val).replace(/[^0-9.-]/g, '')) || 0;
        };

        // 1. INGRESOS (Facturas Emitidas + Borradores de Facturación + Órdenes con Costo)
        let totalCobrado = 0;
        let totalPorCobrar = 0;
        let totalBorradores = 0;
        let totalOrdenes = 0;

        // Procesar Facturas Emitidas
        invoices.forEach(inv => {
            const total = parse(inv.Total || inv['Total Facturado'] || inv.Monto || inv.Subtotal || inv.Precio);
            const pagado = parse(inv.MontoPagado || inv['Monto Pagado'] || inv.Pagado);
            const estado = String(inv.Estado || inv.Status || '').toLowerCase();

            if (estado.includes('pagad') || estado.includes('cobrad') || estado.includes('finalizad')) {
                totalCobrado += total;
            } else {
                totalPorCobrar += (total - pagado);
            }
        });

        // Procesar Facturación (Drafts)
        facturando.forEach(f => {
            totalBorradores += parse(f.Total || f.Monto || f.Subtotal || f.Precio);
        });

        // Procesar Órdenes (Incluyendo costos de servicios en órdenes)
        orders.forEach(o => {
            // Buscamos columnas de costo/precio en las órdenes
            const cost = parse(o.Costo || o.Precio || o.Total || o.Monto || o.Valor);
            totalOrdenes += cost;
        });

        // 2. EGRESOS (Gastos registrados)
        let totalGastos = gastos.reduce((sum, g) => sum + parse(g.Monto || g.monto || g.Costo || g.Total), 0);

        // 3. VALOR DE ACTIVOS
        let valorInv = productos.reduce((sum, p) => {
            const precio = parse(p.precio || p.Precio || p.costo || p.Costo);
            const cant = parse(p.existencia || p.Existencia || p.Cantidad || 1);
            return sum + (precio * cant);
        }, 0);

        let valorTools = herramientas.reduce((sum, t) => sum + parse(t.costo || t.Costo || t.Precio), 0);

        const gananciaReal = totalCobrado - totalGastos;
        const totalIngresos = totalCobrado + totalPorCobrar + totalBorradores + totalOrdenes;

        return {
            totalCobrado,
            totalPorCobrar,
            totalBorradores,
            totalOrdenes,
            totalGastos,
            valorInv,
            valorTools,
            gananciaReal,
            totalIngresos
        };
    }, [invoices, facturando, orders, gastos, productos, herramientas]);

    return (
        <View style={styles.container}>
            <CustomHeader title="CONTABILIDAD Y FINANZAS" />
            
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. BALANCE GENERAL - GANANCIA REAL */}
                <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <Wallet size={24} color={colors.primary} />
                        <Text style={styles.heroLabel}>Ganancia Neta (Caja)</Text>
                    </View>
                    <Text style={[styles.heroValue, { color: metrics.gananciaReal >= 0 ? '#4CAF50' : '#E53935' }]}>
                        {formatCurrency(metrics.gananciaReal)}
                    </Text>
                    <Text style={styles.heroSubtext}>Dinero cobrado menos todos los gastos</Text>
                    
                    <View style={styles.heroGrid}>
                        <View style={styles.heroItem}>
                            <Text style={styles.microLabel}>Cobrado Real</Text>
                            <Text style={[styles.microValue, { color: '#4CAF50' }]}>{formatCurrency(metrics.totalCobrado)}</Text>
                        </View>
                        <View style={styles.heroItem}>
                            <Text style={styles.microLabel}>Egresos</Text>
                            <Text style={[styles.microValue, { color: '#E53935' }]}>{formatCurrency(metrics.totalGastos)}</Text>
                        </View>
                    </View>
                </View>

                {/* 2. INGRESOS Y FACTURACIÓN TOTAL */}
                <View style={styles.sectionHeader}>
                    <DollarSign size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Ingresos y Proyecciones</Text>
                </View>
                
                <View style={styles.dataCard}>
                    <View style={styles.dataRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TrendingUp size={16} color="#4CAF50" style={{ marginRight: 8 }} />
                            <Text style={styles.dataLabel}>Facturas Pendientes</Text>
                        </View>
                        <Text style={[styles.dataValue, { color: '#FF9800' }]}>{formatCurrency(metrics.totalPorCobrar)}</Text>
                    </View>
                    <View style={styles.dataDivider} />
                    <View style={styles.dataRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ClipboardList size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <Text style={styles.dataLabel}>Monto en Órdenes</Text>
                        </View>
                        <Text style={styles.dataValue}>{formatCurrency(metrics.totalOrdenes)}</Text>
                    </View>
                    <View style={styles.dataDivider} />
                    <View style={styles.dataRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Package size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <Text style={styles.dataLabel}>En Facturación (Drafts)</Text>
                        </View>
                        <Text style={styles.dataValue}>{formatCurrency(metrics.totalBorradores)}</Text>
                    </View>
                    <View style={styles.dataDivider} />
                    <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { fontWeight: '700' }]}>TOTAL INGRESOS BRUTOS</Text>
                        <Text style={[styles.dataValue, { fontWeight: '900', fontSize: 18 }]}>{formatCurrency(metrics.totalIngresos)}</Text>
                    </View>
                </View>

                {/* 3. ACTIVOS DEL NEGOCIO */}
                <View style={styles.sectionHeader}>
                    <Briefcase size={20} color="#9C27B0" />
                    <Text style={styles.sectionTitle}>Patrimonio y Activos</Text>
                </View>

                <View style={[styles.dataCard, { borderLeftColor: '#9C27B0', borderLeftWidth: 4 }]}>
                    <View style={styles.assetRow}>
                        <View style={styles.assetItem}>
                            <Package size={20} color={colors.textSecondary} />
                            <Text style={styles.assetLabel}>Inventario</Text>
                            <Text style={styles.assetValue}>{formatCurrency(metrics.valorInv)}</Text>
                        </View>
                        <View style={styles.assetDivider} />
                        <View style={styles.assetItem}>
                            <Wrench size={20} color={colors.textSecondary} />
                            <Text style={styles.assetLabel}>Herramientas</Text>
                            <Text style={styles.assetValue}>{formatCurrency(metrics.valorTools)}</Text>
                        </View>
                    </View>
                    <View style={[styles.dataDivider, { marginVertical: 15 }]} />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.microLabel}>VALOR TOTAL ESTIMADO DE NEGOCIO</Text>
                        <Text style={[styles.dataValue, { fontSize: 24, color: '#9C27B0' }]}>
                            {formatCurrency(metrics.valorInv + metrics.valorTools + metrics.gananciaReal)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.infoAlert}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <Info size={18} color={isDark ? '#FFF' : colors.primary} />
                    <Text style={styles.infoAlertText}>
                        Este reporte consolida datos de las hojas de Facturas, Órdenes, Gastos, Inventario y Herramientas.
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

function getStyles(colors, isDark) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scroll: { flex: 1 },
        scrollContent: { padding: 16, paddingBottom: 80 },
        
        // Hero Card
        heroCard: {
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 4
        },
        heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        heroLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
        heroValue: { fontSize: 40, fontWeight: '900', color: colors.text, marginVertical: 8 },
        heroSubtext: { fontSize: 12, color: colors.textSecondary, marginBottom: 20 },
        heroGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
        heroItem: { flex: 1 },
        
        // Secciones
        sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
        
        // Data Cards
        dataCard: {
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24
        },
        dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        dataLabel: { fontSize: 14, color: colors.textSecondary },
        dataValue: { fontSize: 17, fontWeight: '700', color: colors.text },
        dataDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
        
        // Assets
        assetRow: { flexDirection: 'row' },
        assetItem: { flex: 1, alignItems: 'center' },
        assetLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
        assetValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
        assetDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 15 },
        
        microLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
        microValue: { fontSize: 18, fontWeight: '700' },

        infoAlert: {
            flexDirection: 'row',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: 12,
            padding: 15,
            alignItems: 'center',
            marginTop: 10
        },
        infoAlertText: { flex: 1, fontSize: 12, color: colors.textSecondary, marginLeft: 12, lineHeight: 18 }
    });
}
