import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { ChevronLeft, Info, FileText, Link, ShieldCheck } from 'lucide-react-native';
import { Alert } from 'react-native';
import CharmAPI from '../services/CharmAPI';

let WebView = null;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
}

const { width } = Dimensions.get('window');

export default function VehicleTechnicalDetailScreen({ route, navigation }) {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const { item, path, title, linkingVehicleId } = route.params;
    const { updateItem, vehiculos, loadAllData } = useData();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isLinking, setIsLinking] = useState(false);

    const docPath = item?.path || path;
    const baseUrl = `https://charm.li/${docPath.split('/').slice(0, -1).join('/')}/`;

    useEffect(() => {
        loadContent();
    }, [docPath]);

    const loadContent = async () => {
        try {
            const rawContent = await CharmAPI.getTechnicalContent(docPath);
            const styledHtml = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                    <style>
                        body { 
                            font-family: -apple-system, system-ui, sans-serif; 
                            padding: 20px; 
                            line-height: 1.6; 
                            color: #FFFFFF; 
                            background-color: #121212; 
                            font-size: 16px;
                        }
                        img { 
                            max-width: 100%; 
                            height: auto; 
                            border-radius: 8px; 
                            margin: 20px 0; 
                            filter: contrast(1.1); 
                        }
                        table { 
                            width: 100% !important; 
                            border-collapse: collapse; 
                            margin: 20px 0; 
                            background: #1C1C1E; 
                            border-radius: 8px; 
                            overflow: hidden; 
                            border: 1px solid #333;
                        }
                        th, td { border: 1px solid #333; padding: 12px; text-align: left; font-size: 14px; color: #FFFFFF; }
                        th { background: #2C2C2E; font-weight: 700; color: #FFFFFF; }
                        
                        /* Títulos Blancos */
                        h1, h2, h3 { 
                            color: #FFFFFF !important; 
                            margin-top: 30px; 
                            border-bottom: 2px solid #333; 
                            padding-bottom: 8px; 
                            font-weight: 700;
                        }
                        
                        /* Enlaces técnicos */
                        a { color: #5C7CFF; text-decoration: underline; font-weight: 500; }
                        
                        /* Listas y párrafos */
                        li, p { margin-bottom: 12px; color: #FFFFFF; }
                        
                        /* Forzar Blanco en TODO sobre el fondo oscuro */
                        p, li, span, div, td, th { color: #FFFFFF !important; }
                    </style>
                </head>
                <body>${rawContent}</body>
                </html>
            `;
            setContent(styledHtml);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLinkToVehicle = async () => {
        if (!linkingVehicleId) return;
        
        const confirmMsg = "¿Desea vincular este manual técnico al vehículo?\n\nEl nombre del modelo se actualizará para incluir la referencia oficial del catálogo (esta acción NO se puede deshacer).";
        
        if (Platform.OS === 'web') {
            if (!window.confirm(confirmMsg)) return;
        }

        setIsLinking(true);
        try {
            // Extraer modelo del path (ej: Toyota/1992/Corolla/...)
            const pathParts = docPath.split('/').filter(p => !!p);
            const rawCatalogModel = pathParts[2] || ''; 
            
            // Decodificar el path antes de procesar
            let catalogModel = rawCatalogModel;
            try { catalogModel = decodeURIComponent(rawCatalogModel); } catch(e) {}

            // Decodificar el path completo para guardarlo limpio
            let cleanPath = docPath;
            try { cleanPath = decodeURIComponent(docPath); } catch(e) {}

            // Encontrar vehículo y limpiar el nombre del modelo
            const currentVehicle = vehiculos?.find(v => v.id === linkingVehicleId || v.Matricula === linkingVehicleId || v['ID Vehiculo'] === linkingVehicleId);
            
            // Eliminar cualquier sufijo previo de catálogo (texto entre paréntesis)
            const rawModel = currentVehicle?.Modelo || '';
            const currentModel = rawModel.replace(/\s*\([^)]*\)\s*$/, '').trim();

            let newModelName = currentModel;
            if (catalogModel && !currentModel.toLowerCase().includes(catalogModel.toLowerCase())) {
                newModelName = `${currentModel} (${catalogModel})`;
            }

            await updateItem('vehiculos', linkingVehicleId, {
                Manual_Tecnico_Path: cleanPath,
                ID_Manual_Tecnico: cleanPath,
                Manual_Tecnico: cleanPath,
                Modelo: newModelName
            });
            
            // Esperar un momento antes del refresh
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Forzar recarga de los datos para que el badge "VINCULADO" aparezca en todos lados
            if (loadAllData) await loadAllData();
            
            alert("✓ Vehículo vinculado y referencia de modelo actualizada.");
            navigation.navigate('VehicleDetails', { 
                vehicle: { 
                    ...(currentVehicle || {}), 
                    id: linkingVehicleId,
                    Manual_Tecnico_Path: cleanPath,
                    Modelo: newModelName
                } 
            });
        } catch (error) {
            console.error(error);
            alert("Error al vincular: " + error.message);
        } finally {
            setIsLinking(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title={title || 'MANUAL TÉCNICO'}
                leftAction={() => {
                    // Si estamos vinculando, el atrás debe respetarlo
                    navigation.navigate('VehicleSearch', { 
                        linkingVehicleId: linkingVehicleId,
                        manualPathOverride: docPath.split('/').slice(0, -1).join('/') // Subir un nivel
                    });
                }}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
                rightAction={linkingVehicleId ? handleLinkToVehicle : null}
                rightIcon={linkingVehicleId ? (
                    isLinking ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold', marginRight: 5 }}>VINCULAR</Text>
                            <ShieldCheck size={18} color={colors.primary} />
                        </View>
                    )
                ) : null}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {Platform.OS === 'web' ? (
                        <iframe title={title} srcDoc={content} style={{ flex: 1, border: 'none' }} />
                    ) : (
                        <WebView source={{ html: content, baseUrl }} style={{ flex: 1, backgroundColor: 'transparent' }} />
                    )}
                </View>
            )}
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
