import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Animated, BackHandler } from 'react-native';
import { Colors } from '../constants';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { Search, ChevronRight, ChevronLeft, LayoutGrid, FileText, Wrench, Settings as SettingsIcon, Zap, Info, RefreshCw, ChevronDown } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import CharmAPI from '../services/CharmAPI';

// ─── groupItems ──────────────────────────────────────────────────────────
// Convierte lista plana [group, item, item, group, item...]
// en árbol [{type:'group', children:[...]}, {type:'item'}, ...]
function groupItems(items) {
    const result = [];
    const stack = [{ level: -1, children: result }];

    items.forEach(item => {
        const node = { ...item, children: [], expanded: false };
        const itemLevel = item.level !== undefined ? item.level : 0;
        
        // Quitar del stack hasta encontrar a un padre con nivel estrictamente menor
        while (stack.length > 1 && stack[stack.length - 1].level >= itemLevel) {
            stack.pop();
        }
        
        // Agregar nodo a los hijos del padre actual
        const parent = stack[stack.length - 1];
        parent.children.push(node);
        
        // Si es un grupo, se convierte en un posible padre para los siguientes nodos
        if (node.type === 'group') {
            stack.push({ level: itemLevel, children: node.children });
        }
    });

    return result;
}

// ─── VehicleSearchScreen ─────────────────────────────────────────────────
export default function VehicleSearchScreen({ navigation }) {
    const [search,    setSearch]    = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [error,     setError]     = useState(null);
    const [history,   setHistory]   = useState([]);
    const [items,     setItems]     = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});

    const fadeAnim = useRef(new Animated.Value(1)).current;

    // ── PREVENIR SALIDA SI HAY HISTORIAL (Solución Universal) ──────────
    usePreventRemove(history.length > 0, ({ action }) => {
        handleGoBack(); // En lugar de salir, retrocedemos un paso en el historial
    });

    const currentLevel = useMemo(() => {
        if (history.length === 0) return { title: 'Marcas', path: '' };
        return history[history.length - 1];
    }, [history]);

    useEffect(() => {
        setExpandedGroups({});
        loadPath(currentLevel.path);
    }, [currentLevel.path]);

    const animateTransition = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    };

    const loadPath = async (path) => {
        setIsSyncing(true);
        setError(null);
        try {
            const data = await CharmAPI.getFolderItems(path);
            setItems(data);
            animateTransition();
        } catch (err) {
            console.error('Error leyendo HTML:', err);
            setError('No pudimos conectar con el servidor. Revisa tu internet o intenta de nuevo.');
            setItems([]);
        } finally {
            setIsSyncing(false);
        }
    };

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleSelect = (item) => {
        if (item.isNavigableDir) {
            setItems([]);
            setHistory([...history, { title: item.name, path: item.path }]);
            setSearch('');
        } else {
            navigation.navigate('VehicleTechnicalDetail', { item, title: item.name });
        }
    };

    const handleGoBack = () => {
        if (history.length > 0) {
            setHistory(history.slice(0, -1));
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const jumpToHistory = (index) => {
        if (index === -1) setHistory([]);
        else setHistory(history.slice(0, index + 1));
    };

    // Filtrado (busca en nombres de items y grupos)
    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    // Árbol agrupado listo para render
    const grouped = groupItems(filteredItems);

    // ── Iconos dinámicos ────────────────────────────────────────────────
    const getBrandLogo = (name) => {
        const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
        return `https://www.carlogos.org/car-logos/${slug}-logo.png`;
    };

    const getItemIcon = (name, isDir) => {
        if (!isDir) return <FileText size={18} color={Colors.textSecondary} />;
        const n = name.toLowerCase();
        if (n.includes('engine') || n.includes('motor') || n.includes('powertrain'))
            return <View style={[styles.miniIcon, { backgroundColor: '#CF132220' }]}><Wrench size={16} color="#CF1322" /></View>;
        if (n.includes('brake') || n.includes('abs'))
            return <View style={[styles.miniIcon, { backgroundColor: '#722ED120' }]}><Zap size={16} color="#722ED1" /></View>;
        if (n.includes('transmission') || n.includes('clutch'))
            return <View style={[styles.miniIcon, { backgroundColor: '#D46B0820' }]}><SettingsIcon size={16} color="#D46B08" /></View>;
        if (n.includes('electrical') || n.includes('wiring'))
            return <View style={[styles.miniIcon, { backgroundColor: '#08979C20' }]}><Zap size={16} color="#08979C" /></View>;
        if (n.includes('maintenance') || n.includes('service'))
            return <View style={[styles.miniIcon, { backgroundColor: '#389E0D20' }]}><Info size={16} color="#389E0D" /></View>;
        return <View style={[styles.miniIcon, { backgroundColor: Colors.background }]}><LayoutGrid size={16} color={Colors.textSecondary} /></View>;
    };

    // ── Render de un nodo (Recursivo) ─────────────────────────
    const renderNode = (node, key, nestLevel = 0) => {
        // Cálculo del margen izquierdo según nivel (máximo 4 niveles para evitar rebase)
        const indentLength = Math.min(nestLevel * 20, 80);

        if (node.type === 'group') {
            const isOpen = !!expandedGroups[node.name];
            return (
                <View key={key}>
                    <TouchableOpacity
                        style={[styles.groupHeader, { paddingLeft: 16 + indentLength }]}
                        onPress={() => toggleGroup(node.name)}
                        activeOpacity={0.7}
                    >
                        {isOpen
                            ? <ChevronDown size={18} color={Colors.textSecondary} style={styles.groupArrow} />
                            : <ChevronRight size={18} color={Colors.textSecondary} style={styles.groupArrow} />}
                        <Text style={[styles.groupHeaderText, nestLevel > 0 && { fontSize: 13, textTransform: 'none' }]}>
                            {node.name}
                        </Text>
                    </TouchableOpacity>

                    {/* Hijos: Renderizado recursivo si está abierto */}
                    {isOpen && node.children.map((child, ci) => renderNode(child, `${key}-${ci}`, nestLevel + 1))}
                </View>
            );
        }

        // Item 
        return (
            <TouchableOpacity
                key={key}
                style={[styles.listItem, { paddingLeft: 20 + indentLength }]}
                onPress={() => handleSelect(node)}
            >
                <View style={styles.listIconBox}>
                    {getItemIcon(node.name, node.isNavigableDir)}
                </View>
                <Text style={styles.listText} numberOfLines={2}>{node.name}</Text>
                <ChevronRight size={16} color={Colors.border} />
            </TouchableOpacity>
        );
    };

    // ── JSX ─────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <CustomHeader
                title={currentLevel.title.toUpperCase()}
                leftAction={handleGoBack}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
                rightAction={() => loadPath(currentLevel.path)}
                rightIcon={isSyncing ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={20} color="#FFF" />}
            />

            {/* Migas de pan */}
            <View style={styles.pathBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathContent}>
                    <TouchableOpacity onPress={() => jumpToHistory(-1)}>
                        <Text style={styles.pathLink}>Inicio</Text>
                    </TouchableOpacity>
                    {history.map((h, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <ChevronRight size={14} color="#BBB" style={{ marginHorizontal: 4 }} />
                            <TouchableOpacity onPress={() => jumpToHistory(i)}>
                                <Text style={[styles.pathLink, i === history.length - 1 && styles.pathActive]}>
                                    {h.title}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Contenido principal */}
            {isSyncing && items.length === 0 ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loaderText}>CONECTANDO CON EL SERVIDOR...</Text>
                    <Text style={styles.loaderSubText}>{currentLevel.path || 'Root'}</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Info size={48} color="#EA4335" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => loadPath(currentLevel.path)}>
                        <Text style={styles.retryBtnText}>REINTENTAR</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <ScrollView contentContainerStyle={styles.scroll}>

                                        {/* Nivel raíz: grid de marcas */}
                        {history.length === 0 ? (
                            <View style={styles.brandsGrid}>
                                {grouped.map((item, idx) => (
                                    <TouchableOpacity key={idx} style={styles.brandCard} onPress={() => handleSelect(item)}>
                                        <View style={styles.brandLogoCircle}>
                                            <Image 
                                                source={{ uri: getBrandLogo(item.name) }} 
                                                style={styles.brandLogo} 
                                                resizeMode="contain" 
                                            />
                                        </View>
                                        <Text style={styles.brandName}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <>
                                {/* Buscador */}
                                <View style={styles.searchSection}>
                                    <View style={styles.searchBox}>
                                        <Search size={18} color={Colors.textSecondary} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={`Filtrar en ${currentLevel.title}...`}
                                            value={search}
                                            onChangeText={setSearch}
                                            placeholderTextColor={Colors.textSecondary}
                                        />
                                    </View>
                                </View>

                                {/* Lista con acordeón anidado */}
                                {grouped.map((node, idx) => renderNode(node, `root-${idx}`, 0))}
                            </>
                        )}

                        {/* Sin resultados */}
                        {!isSyncing && filteredItems.length === 0 && (
                            <View style={styles.center}>
                                <Info size={40} color={Colors.border} />
                                <Text style={styles.noResultsText}>No hay datos para mostrar</Text>
                                <Text style={styles.pathDebug}>{currentLevel.path}</Text>
                                <TouchableOpacity style={styles.retryBtn} onPress={() => loadPath(currentLevel.path)}>
                                    <Text style={styles.retryBtnText}>BUSCAR DE NUEVO</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: Colors.background },
    center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    content:     { flex: 1 },
    scroll:      { paddingBottom: 60 },
    loader:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText:  { marginTop: 15, color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    loaderSubText: { color: Colors.border, fontSize: 10, marginTop: 4 },

    // Path bar
    pathBar:     { backgroundColor: Colors.card, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pathContent: { paddingHorizontal: 16 },
    pathLink:    { fontSize: 13, color: Colors.textSecondary, marginRight: 8 },
    pathActive:  { color: Colors.primary, fontWeight: 'bold' },

    // Search
    searchSection: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.card },
    searchBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 25, paddingHorizontal: 15, height: 44, borderWidth: 1, borderColor: Colors.border },
    input:         { flex: 1, marginLeft: 10, color: Colors.text, fontSize: 15 },

    // Brands grid
    brandsGrid:      { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
    brandCard:       { width: '31%', backgroundColor: Colors.card, borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 10, alignSelf: 'flex-start', marginHorizontal: '1%', borderWidth: 1, borderColor: Colors.border },
    brandLogoCircle: {
        width: 64,
        height: 64,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    brandLogo:       { width: 44, height: 44 },
    brandName:       { fontSize: 12, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },

    // List items
    listItem:    { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
    indentedItem: { paddingLeft: 36, backgroundColor: Colors.background },
    listIconBox: {},
    miniIcon:    { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 0 },
    listText:    { flex: 1, marginLeft: 12, fontSize: 14, color: Colors.text, fontWeight: '500' },

    // Group accordion headers  ▶ / ▼ Nombre
    groupHeader:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, marginTop: 4, opacity: 0.9 },
    groupArrow:      { marginRight: 8 },
    groupHeaderText: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },

    // Misc
    errorText:     { marginTop: 15, textAlign: 'center', color: Colors.textSecondary, fontSize: 14 },
    noResultsText: { marginTop: 15, color: Colors.textSecondary, fontSize: 14 },
    retryBtn:      { backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 15, elevation: 3 },
    retryBtnText:  { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    pathDebug:     { fontSize: 10, color: Colors.border, marginTop: 10 },
});

