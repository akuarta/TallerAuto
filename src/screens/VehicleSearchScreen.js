import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Animated } from 'react-native';
import { Colors } from '../constants';
import { Search, ChevronRight, ChevronLeft, LayoutGrid, FileText, Wrench, Settings as SettingsIcon, Zap, Info, RefreshCw } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';
import CharmAPI from '../services/CharmAPI';

export default function VehicleSearchScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]); 
    const [items, setItems] = useState([]); 
    
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const currentLevel = useMemo(() => {
        if (history.length === 0) return { title: 'Marcas', path: '' };
        return history[history.length - 1];
    }, [history]);

    useEffect(() => {
        loadPath(currentLevel.path);
    }, [currentLevel.path]);

    const animateTransition = () => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();
    };

    const loadPath = async (path) => {
        setIsSyncing(true);
        setError(null);
        try {
            const data = await CharmAPI.getFolderItems(path);
            setItems(data);
            animateTransition();
        } catch (err) {
            console.error("Error leyendo HTML:", err);
            setError("No pudimos conectar con el servidor. Revisa tu internet o intenta de nuevo.");
            setItems([]);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSelect = (item) => {
        if (item.type === 'folder') {
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

    const getBrandLogo = (name) => {
        const lower = name.toLowerCase().trim();
        const slug = lower.replace(/\s+/g, '-');
        // Usamos múltiples fuentes de logos para garantizar visibilidad
        return `https://www.carlogos.org/car-logos/${slug}-logo.png`; 
    };

    const getItemIcon = (name, type) => {
        const n = name.toLowerCase();
        if (type === 'document') return <FileText size={18} color={Colors.textSecondary} />;
        
        // Iconografía Dinámica basada en palabras clave del manual técnico
        if (n.includes('engine') || n.includes('motor') || n.includes('powertrain')) 
            return <View style={[styles.miniIcon, {backgroundColor: '#FFF1F0'}]}><Wrench size={16} color="#CF1322" /></View>;
        
        if (n.includes('brake') || n.includes('freno') || n.includes('abs')) 
            return <View style={[styles.miniIcon, {backgroundColor: '#F9F0FF'}]}><Zap size={16} color="#722ED1" /></View>;
            
        if (n.includes('transmission') || n.includes('caja') || n.includes('clutch')) 
            return <View style={[styles.miniIcon, {backgroundColor: '#FFF7E6'}]}><SettingsIcon size={16} color="#D46B08" /></View>;
            
        if (n.includes('electrical') || n.includes('wiring') || n.includes('fuses')) 
            return <View style={[styles.miniIcon, {backgroundColor: '#E6FFFB'}]}><Zap size={16} color="#08979C" /></View>;

        if (n.includes('maintenance') || n.includes('service')) 
            return <View style={[styles.miniIcon, {backgroundColor: '#F6FFED'}]}><Info size={16} color="#389E0D" /></View>;
        
        return <View style={[styles.miniIcon, {backgroundColor: '#F5F5F5'}]}><LayoutGrid size={16} color="#595959" /></View>;
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title={currentLevel.title.toUpperCase()}
                leftAction={handleGoBack}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
                rightAction={() => loadPath(currentLevel.path)}
                rightIcon={isSyncing ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={20} color="#FFF" />}
            />

            <View style={styles.pathBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pathContent}>
                    <TouchableOpacity onPress={() => jumpToHistory(-1)}>
                        <Text style={styles.pathLink}>Inicio</Text>
                    </TouchableOpacity>
                    {history.map((h, i) => (
                        <View key={i} style={{flexDirection: 'row', alignItems: 'center'}}>
                            <ChevronRight size={14} color="#BBB" style={{marginHorizontal: 4}} />
                            <TouchableOpacity onPress={() => jumpToHistory(i)}>
                                <Text style={[styles.pathLink, i === history.length-1 && styles.pathActive]}>
                                    {h.title}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

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
                        {history.length === 0 ? (
                            <View style={styles.brandsGrid}>
                                {filteredItems.map((item, idx) => (
                                    <TouchableOpacity key={idx} style={styles.brandCard} onPress={() => handleSelect(item)}>
                                        <View style={styles.brandLogoCircle}>
                                            <Image source={{ uri: getBrandLogo(item.name) }} style={styles.brandLogo} resizeMode="contain" />
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
                                {filteredItems.map((item, idx) => (
                                    <TouchableOpacity key={idx} style={styles.listItem} onPress={() => handleSelect(item)}>
                                        <View style={styles.listIconBox}>
                                            {getItemIcon(item.name, item.type)}
                                        </View>
                                        <Text style={styles.listText} numberOfLines={2}>{item.name}</Text>
                                        <ChevronRight size={16} color={Colors.border} />
                                    </TouchableOpacity>
                                ))
                                }
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
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    pathBar: { backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E1E4E8', elevation: 2 },
    pathContent: { paddingHorizontal: 16 },
    pathLink: { fontSize: 13, color: '#666', marginRight: 8 },
    pathActive: { color: Colors.primary, fontWeight: 'bold' },
    
    searchSection: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F3F4', borderRadius: 25, paddingHorizontal: 15, height: 44 },
    input: { flex: 1, marginLeft: 10, color: '#333', fontSize: 15 },
    
    content: { flex: 1 },
    scroll: { paddingBottom: 60 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: 15, color: '#999', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
    
    brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12 },
    brandCard: { width: '31%', backgroundColor: '#FFF', borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 10, alignSelf: 'flex-start', marginHorizontal: '1%' },
    brandLogo: { width: 50, height: 50, marginBottom: 10 },
    brandName: { fontSize: 12, fontWeight: 'bold', color: '#333', textAlign: 'center' },
    
    listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    miniIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    listText: { flex: 1, fontSize: 14, color: '#262626', fontWeight: '500' },
    
    errorText: { marginTop: 15, textAlign: 'center', color: '#666', fontSize: 14 },
    noResultsText: { marginTop: 15, color: '#999', fontSize: 14 },
    retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 15, elevation: 3 },
    retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    pathDebug: { fontSize: 10, color: '#CCC', marginTop: 10 },
});
