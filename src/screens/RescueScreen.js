import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MapPin, Clock, Route, RefreshCw } from 'lucide-react-native';
import { FAB } from '../components/FAB';

let MapView, Marker;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function RescueScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const [rescueInfo, setRescueInfo] = useState({
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        estado: 'En camino (Tiempo est: 15 min)'
    });

    const requestLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('El permiso de ubicación fue denegado.');
                if (Platform.OS !== 'web') {
                    Alert.alert("Permiso Denegado", "Se requiere permiso de ubicación para usar el mapa de rescate.");
                }
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
            setErrorMsg(null);
        } catch (error) {
            setErrorMsg('Hubo un error obteniendo la ubicación.');
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        requestLocation();
    }, []);

    const handleRefresh = () => {
        setRescueInfo({
            ...rescueInfo,
            hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        });
        requestLocation();
    };

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Rescate" 
                leftIcon="menu" 
                onLeftPress={() => navigation.toggleDrawer()} 
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                {/* Information Cards */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Detalles del Rescate</Text>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                            <RefreshCw color={Colors.primary} size={20} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Clock color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Hora de Solicitud</Text>
                            <Text style={styles.infoValue}>{rescueInfo.hora}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Route color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Trayectoria / Estado</Text>
                            <Text style={styles.infoValue}>{rescueInfo.estado}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <MapPin color={Colors.text} size={20} />
                        </View>
                        <View style={styles.infoTexts}>
                            <Text style={styles.infoLabel}>Lugar Actual</Text>
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.primary} style={{ alignSelf: 'flex-start' }} />
                            ) : errorMsg ? (
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            ) : location ? (
                                <Text style={styles.infoValue}>Lat: {location.coords.latitude.toFixed(4)}, Lon: {location.coords.longitude.toFixed(4)}</Text>
                            ) : (
                                <Text style={styles.infoValue}>Buscando...</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Map Section */}
                <View style={styles.mapContainer}>
                    {location ? (
                        Platform.OS === 'web' ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                src={`https://maps.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}&z=15&output=embed`}
                            />
                        ) : (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: location.coords.latitude,
                                    longitude: location.coords.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                showsUserLocation={true}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: location.coords.latitude,
                                        longitude: location.coords.longitude,
                                    }}
                                    title="Tu Ubicación"
                                    description="Donde se solicitó el rescate"
                                />
                            </MapView>
                        )
                    ) : (
                        <View style={styles.webMapPlaceholder}>
                            {loading ? (
                                <ActivityIndicator size="large" color={Colors.primary} />
                            ) : (
                                <MapPin color={Colors.textSecondary} size={48} style={{ marginBottom: 10 }} />
                            )}
                            <Text style={[styles.webMapText, { marginTop: 10 }]}>Buscando ubicación...</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            <FAB 
                onPress={() => navigation.navigate('Form', { 
                    title: 'Rescate', 
                    dataKey: 'rescates', 
                    fields: ['IdRescate', 'Cliente', 'Matricula', 'Fecha', 'Hora', 'Punto de Partida', 'Lugar del Rescate', 'Estado', 'Trayectoria'],
                    prefill: { 'Punto de Partida': 'Taller' }
                })} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    refreshButton: {
        padding: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoTexts: {
        flex: 1,
        justifyContent: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 14,
        color: Colors.danger,
        fontWeight: '500',
    },
    mapContainer: {
        height: 400,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.card,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    webMapPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.background,
    },
    webMapText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        fontSize: 14,
    }
});
