import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { ChevronLeft, Info, FileText } from 'lucide-react-native';
import CharmAPI from '../services/CharmAPI';

const { width } = Dimensions.get('window');

export default function VehicleTechnicalDetailScreen({ route, navigation }) {
    const { item, path, title } = route.params;
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    const docPath = item?.path || path;
    const baseUrl = `https://charm.li/${docPath.split('/').slice(0, -1).join('/')}/`;

    useEffect(() => {
        loadContent();
    }, [docPath]);

    const loadContent = async () => {
        try {
            const rawContent = await CharmAPI.getTechnicalContent(docPath);
            // Inyectar CSS para que se vea premium
            const styledHtml = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                    <style>
                        body { 
                            font-family: -apple-system, sans-serif; 
                            padding: 20px; 
                            line-height: 1.6; 
                            color: #FFFFFF; 
                            background-color: #121212;
                        }
                        img { 
                            max-width: 100%; 
                            height: auto; 
                            border-radius: 12px; 
                            margin: 20px 0;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                            background-color: #FFFFFF; /* Algunas imágenes pueden tener fondo transparente y necesitan blanco para verse bien si son diagramas negros */
                            filter: brightness(0.9) contrast(1.1);
                        }
                        table { 
                            width: 100% !important; 
                            border-collapse: collapse; 
                            margin: 20px 0; 
                            background: #1E1E1E;
                            border-radius: 8px;
                            overflow: hidden;
                        }
                        th, td { 
                            border: 1px solid #333; 
                            padding: 12px; 
                            text-align: left; 
                            font-size: 14px;
                            color: #FFFFFF;
                        }
                        th { background: #2A2A2A; font-weight: bold; }
                        h1, h2, h3 { color: ${Colors.primary}; margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 8px; }
                        p, li, span, div { color: rgba(255,255,255,0.9) !important; }
                        .main { display: flex; flex-direction: column; }
                    </style>
                </head>
                <body>
                    <div class="main">
                        ${rawContent}
                    </div>
                </body>
                </html>
            `;
            setContent(styledHtml);
        } catch (error) {
            console.error("Error cargando contenido técnico:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader
                title={title || 'MANUAL TÉCNICO'}
                leftAction={() => navigation.goBack()}
                leftIcon={<ChevronLeft size={24} color="#FFF" />}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>SINCRONIZANDO DIAGRAMAS TÉCNICOS...</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {Platform.OS === 'web' ? (
                        /* Fallback para Web: Usamos un iframe con el contenido inyectado */
                        <iframe
                            title={title}
                            srcDoc={content}
                            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                        />
                    ) : (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: content, baseUrl: baseUrl }}
                            style={styles.webview}
                            scalesPageToFit={true}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                        />
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    webview: { flex: 1, backgroundColor: 'transparent' }
});
