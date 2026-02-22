import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { CategoryCard } from '../components/CategoryCard';
import { Search, Car } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

export default function ModelListScreen({ route, navigation }) {
    const { brand, category } = route.params;
    const { garage, loading } = useData();
    const [search, setSearch] = useState('');

    const models = [...new Set(
        garage
            .filter(item => item.Marca === brand && item.Tipo === category)
            .map(item => item.Modelo)
    )].filter(Boolean).sort();

    const filteredModels = models.filter(model =>
        model.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <CustomHeader title={brand.toUpperCase()} />
            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder={`Buscar modelo de ${brand}...`}
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <FlatList
                    data={filteredModels}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <CategoryCard
                            title={item}
                            onPress={() => navigation.navigate('VehicleList', { brand, category, model: item })}
                            icon={<Car size={24} color={Colors.primary} />}
                        />
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 16, flex: 1 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
        borderWidth: 1, borderColor: Colors.border,
    },
    input: { flex: 1, color: Colors.text, fontSize: 16 },
});
