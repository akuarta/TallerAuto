import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CategoryCard } from '../components/CategoryCard';
import { LayoutGrid, Car, Truck, Zap } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

export default function VehicleCategoryScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const { garage, loading } = useData();

    // Extraemos tipos únicos de la tabla garage (que tiene el campo Tipo)
    const categories = [...new Set(garage.map(item => item.Tipo))].filter(Boolean).sort();

    const getIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('camion')) return <Truck size={24} color="#FB8C00" />;
        if (t.includes('suv')) return <LayoutGrid size={24} color="#43A047" />;
        return <Car size={24} color={colors.primary} />;
    };

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title="CATEGORÍAS" />
            <View style={styles.content}>
                <FlatList
                    data={categories}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <CategoryCard
                            title={item.toUpperCase()}
                            onPress={() => navigation.navigate('BrandList', { category: item })}
                            icon={getIcon(item)}
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
});
