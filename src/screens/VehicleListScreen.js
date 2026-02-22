import React, { useState } from 'react';
import { View, FlatList, StyleSheet, TextInput, Text } from 'react-native';
import { Colors } from '../constants';
import { useData } from '../context/DataContext';
import { VehicleCard } from '../components/VehicleCard';
import { Search } from 'lucide-react-native';
import { CustomHeader } from '../components/CustomHeader';

export default function VehicleListScreen({ route, navigation }) {
    const { brand, category, model } = route.params || {};
    const { garage, loading } = useData();
    const [search, setSearch] = useState('');

    // Si venimos de la navegación jerárquica
    let listData = garage;
    if (brand && category && model) {
        listData = garage.filter(v =>
            v.Marca === brand &&
            v.Tipo === category &&
            v.Modelo === model
        );
    }

    const filteredVehicles = listData.filter(v =>
        v.Marca.toLowerCase().includes(search.toLowerCase()) ||
        v.Modelo.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <View style={styles.container}><Text style={{ color: 'white' }}>Cargando...</Text></View>;

    return (
        <View style={styles.container}>
            <CustomHeader title={model ? model.toUpperCase() : "VEHICULOS"} />
            <View style={styles.content}>
                <View style={styles.searchContainer}>
                    <Search size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar por año o detalle..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <FlatList
                    data={filteredVehicles}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <VehicleCard
                            vehicle={item}
                            showMatricula={false} // CRÍTICO: OCULTAR MATRICULA en catálogo
                            onPress={() => navigation.navigate('VehicleDetails', { vehicle: item, isCatalog: true })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
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
