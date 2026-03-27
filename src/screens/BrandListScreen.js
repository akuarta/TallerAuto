import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CategoryCard } from '../components/CategoryCard';
import { Search, Tag } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

export default function BrandListScreen({ route, navigation }) {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const { category } = route.params;
    const { garage, loading } = useData();
    const [search, setSearch] = useState('');

    // Filtramos marcas que pertenezcan a esa categoría
    const brands = [...new Set(
        garage.filter(item => item.Tipo === category).map(item => item.Marca)
    )].filter(Boolean).sort();

    const filteredBrands = brands.filter(brand =>
        brand.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <CustomHeader title={category.toUpperCase()} />
            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar marca..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <FlatList
                    data={filteredBrands}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <CategoryCard
                            title={item}
                            onPress={() => navigation.navigate('ModelList', { brand: item, category })}
                            icon={<Tag size={24} color="#E53935" />}
                        />
                    )}
                />
            </View>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, flex: 1 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
        borderWidth: 1, borderColor: colors.border,
    },
    input: { flex: 1, color: colors.text, fontSize: 16 },
});
