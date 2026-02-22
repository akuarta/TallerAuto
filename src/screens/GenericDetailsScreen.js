import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';

const DetailItem = ({ label, value }) => (
    <View style={styles.itemContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
);

export default function GenericDetailsScreen({ route, navigation }) {
    const { item, title } = route.params;

    return (
        <View style={styles.container}>
            <CustomHeader
                title={`DETALLE: ${title}`}
                showBack={true}
                leftAction={() => navigation.goBack()}
            />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    {Object.entries(item).map(([key, value]) => {
                        if (key === 'id') return null;
                        return (
                            <DetailItem
                                key={key}
                                label={key.replace(/_/g, ' ').toUpperCase()}
                                value={value?.toString()}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 16 },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemContainer: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + '40',
        paddingBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    value: {
        color: Colors.text,
        fontSize: 16,
    },
});
