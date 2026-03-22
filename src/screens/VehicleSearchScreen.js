import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Image, Animated, BackHandler } from 'react-native';
import { Colors } from '../constants';
import { PremiumLoader } from '../components/PremiumLoader';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { Search, ChevronRight, ChevronLeft, LayoutGrid, FileText, Wrench, Settings as SettingsIcon, Zap, Info, RefreshCw, ChevronDown } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import CharmAPI from '../services/CharmAPI';

// ─── groupItems ──────────────────────────────────────────────────────────
function groupItems(items) {
    const result = [];
    const stack = [{ level: -1, children: result }];

    items.forEach(item => {
        const node = { ...item, children: [], expanded: false };
        const itemLevel = item.level !== undefined ? item.level : 0;
        
        while (stack.length > 1 && stack[stack.length - 1].level >= itemLevel) {
            stack.pop();
        }
        
        const parent = stack[stack.length - 1];
        parent.children.push(node);
        
        if (node.type === 'group') {
            stack.push({ level: itemLevel, children: node.children });
        }
    });

    return result;
}

export default function VehicleSearchScreen({ navigation }) {
    const [search,    setSearch]    = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [error,     setError]     = useState(null);
    const [history,   setHistory]   = useState([]);
    const [items,     setItems]     = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});

    const fadeAnim = useRef(new Animated.Value(1)).current;

    usePreventRemove(history.length > 0, ({ action }) => {
        handleGoBack();
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

    const filteredItems = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const grouped = groupItems(filteredItems);

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

    const renderNode = (node, key, nestLevel = 0) => {
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
                    {isOpen && node.children.map((child, ci) => renderNode(child, `${key}-${ci}`, nestLevel + 1))}
                </View>
            );
        }
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

    return (
        <View style={styles.container}>
            <CustomHeader
                title={currentLevel.title.toUpperCase()}
                leftAction={handleGoBack}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
                rightAction={() => loadPath(currentLevel.path)}
                rightIcon={isSyncing ? <PremiumLoader size={20} color="#FFF" /> : <RefreshCw size={20} color="#FFF" />}
            />

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

            {isSyncing && items.length === 0 ? (
                <View style={styles.loader}>
                    <PremiumLoader size={60} />
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
                                {grouped.map((node, idx) => renderNode(node, `root-${idx}`, 0))}
                            </>
                        )}

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

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: Colors.background },
    center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    content:     { flex: 1 },
    scroll:      { paddingBottom: 60 },
    loader:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText:  { marginTop: 15, color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    loaderSubText: { color: Colors.border, fontSize: 10, marginTop: 4 },
    pathBar: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pathContent: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
    pathLink: { color: Colors.textSecondary, fontSize: 13 },
    pathActive: { color: Colors.primary, fontWeight: 'bold' },
    searchSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 10, height: 40, borderWidth: 1, borderColor: Colors.border },
    input: { flex: 1, marginLeft: 10, color: Colors.text },
    brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, justifyContent: 'space-between' },
    brandCard: { width: '30%', backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    brandLogoCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    brandLogo: { width: 45, height: 45 },
    brandName: { color: Colors.text, fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
    groupArrow: { marginRight: 10 },
    groupHeaderText: { color: Colors.text, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    listIconBox: { marginRight: 12 },
    miniIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    listText: { flex: 1, color: Colors.text, fontSize: 14 },
    errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 10 },
    retryBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    retryBtnText: { color: '#FFF', fontWeight: 'bold' },
    noResultsText: { color: Colors.textSecondary, marginTop: 15 },
    pathDebug: { fontSize: 9, color: Colors.border, marginTop: 5 },
});
