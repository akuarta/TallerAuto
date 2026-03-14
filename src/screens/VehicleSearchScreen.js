import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { Search, ChevronRight, ChevronLeft, Trash2, Edit2, Plus } from 'lucide-react-native';
import { FAB } from '../components/FAB';
import { CustomHeader } from '../components/CustomHeader';

export default function VehicleSearchScreen({ navigation }) {
    const { catalog, loading } = useData();
    const [search, setSearch] = useState('');
    const [selectedBrand, setSelectedBrand] = useState(null);

    // Obtener marcas únicas
    const brands = useMemo(() => {
        const uniqueBrands = [...new Set(catalog.map(item => item.Marca))].sort();
        return uniqueBrands;
    }, [catalog]);

    const filteredBrands = brands.filter(b => b && String(b).toLowerCase().includes(search.toLowerCase()));

    const modelsForBrand = useMemo(() => {
        if (!selectedBrand) return [];
        return catalog.filter(item => item.Marca === selectedBrand &&
            item.Modelo && String(item.Modelo).toLowerCase().includes(search.toLowerCase()));
    }, [selectedBrand, catalog, search]);

    const getBrandLogo = (brand) => {
        if (!brand) return null;
        const slug = brand.toLowerCase().trim().replace(/\s+/g, '-');
        return `https://raw.githubusercontent.com/javimogan/vehicle-logos-dataset/main/logos/originals/${slug}.png`;
    };

    const handleAdd = () => {
        if (selectedBrand) {
            const brandInfo = catalog.find(item => item.Marca === selectedBrand);
            const idMarca = brandInfo ? brandInfo.ID_Marca : '';
            navigation.navigate('Form', {
                title: 'Modelo',
                dataKey: 'catalog',
                prefill: { Marca: selectedBrand, ID_Marca: idMarca },
                fields: ['ID_Marca', 'ID_Modelo', 'Marca', 'Modelo', 'Slug_Modelo']
            });
        } else {
            navigation.navigate('Form', {
                title: 'Marca',
                dataKey: 'catalog',
                fields: ['Marca', 'ID_Marca']
            });
        }
    };

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader
                title={selectedBrand ? selectedBrand.toUpperCase() : "BUSCAR VEHICULOS"}
                leftAction={selectedBrand ? () => { setSelectedBrand(null); setSearch(''); } : null}
                leftIcon={selectedBrand ? <ChevronLeft color="white" /> : null}
            />

            <View style={styles.searchContainer}>
                <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.input}
                    placeholder={selectedBrand ? `Buscar en ${selectedBrand}...` : "Buscar marca..."}
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {selectedBrand ? (
                    modelsForBrand.map((item, idx) => (
                        <View key={item.ID_Modelo || item.id || idx}>
                            <TouchableOpacity
                                style={styles.modelCard}
                                onPress={() => navigation.navigate('GenericDetails', { item, title: 'Detalle Técnico' })}
                            >
                                <View style={styles.modelInfo}>
                                    <Text style={styles.modelTitleMain}>{item.Modelo}</Text>
                                    <Text style={styles.modelTitleSub}>{item.Slug_Modelo || item.Modelo}</Text>
                                </View>
                                <View style={styles.actionIcons}>
                                    <TouchableOpacity style={styles.iconBtn}>
                                        <Trash2 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => navigation.navigate('Form', {
                                            title: 'Modelo',
                                            dataKey: 'catalog',
                                            item,
                                            fields: ['ID_Marca', 'ID_Modelo', 'Marca', 'Modelo', 'Slug_Modelo']
                                        })}
                                    >
                                        <Edit2 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.separator} />
                        </View>
                    ))
                ) : (
                    filteredBrands.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={styles.brandItem}
                            onPress={() => {
                                setSelectedBrand(item);
                                setSearch('');
                            }}
                        >
                            <View style={styles.brandContent}>
                                <TouchableOpacity
                                    style={styles.brandInfo}
                                    onPress={() => {
                                        setSelectedBrand(item);
                                        setSearch('');
                                    }}
                                >
                                    <View style={styles.logoContainer}>
                                        <Image
                                            source={{ uri: getBrandLogo(item) }}
                                            style={styles.brandLogo}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={styles.brandText}>{item}</Text>
                                </TouchableOpacity>
                                <View style={styles.actionIcons}>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => {
                                            const brandInfo = catalog.find(b => b.Marca === item);
                                            navigation.navigate('Form', {
                                                title: 'Modelo',
                                                dataKey: 'catalog',
                                                prefill: { Marca: item, ID_Marca: brandInfo?.ID_Marca || '' },
                                                fields: ['ID_Marca', 'ID_Modelo', 'Marca', 'Modelo', 'Slug_Modelo']
                                            });
                                        }}
                                    >
                                        <Plus size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => {
                                            const brandInfo = catalog.find(b => b.Marca === item);
                                            navigation.navigate('Form', {
                                                title: 'Marca',
                                                dataKey: 'catalog',
                                                item: brandInfo || { Marca: item },
                                                fields: ['Marca', 'ID_Marca']
                                            });
                                        }}
                                    >
                                        <Edit2 size={18} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                    <ChevronRight size={18} color={Colors.textSecondary} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <FAB onPress={handleAdd} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100, paddingHorizontal: 16 },
    brandItem: {
        paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    brandContent: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    brandInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    logoContainer: {
        width: 40, height: 40, borderRadius: 8, backgroundColor: 'white',
        justifyContent: 'center', alignItems: 'center', marginRight: 12, padding: 4,
    },
    brandLogo: { width: '100%', height: '100%' },
    brandText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
    modelCard: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 4,
    },
    modelInfo: { flex: 1 },
    modelTitleMain: { color: Colors.text, fontSize: 16, fontWeight: '500' },
    modelTitleSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
    actionIcons: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 8, marginLeft: 4 },
    separator: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
});
