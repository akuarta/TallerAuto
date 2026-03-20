import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { ChevronLeft, Info, FileText, Maximize2, X } from 'lucide-react-native';
import CharmAPI from '../services/CharmAPI';

const { width, height } = Dimensions.get('window');

export default function VehicleTechnicalDetailScreen({ route, navigation }) {
    const { item, path, title } = route.params;
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        loadContent();
    }, []);

    const loadContent = async () => {
        try {
            const rawContent = await CharmAPI.getTechnicalContent(item?.path || path);
            setContent(rawContent);
        } catch (error) {
            console.error("Error cargando contenido técnico:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (!content) return <Text style={styles.emptyText}>No se pudo cargar la información técnica.</Text>;

        const parts = content.split(/(<img[^>]+src=['"][^'"]+['"][^>]*>)/gi);

        return parts.map((part, index) => {
            if (part.startsWith('<img')) {
                const srcMatch = part.match(/src=['"]([^'"]+)['"]/i);
                const src = srcMatch ? srcMatch[1] : null;
                if (!src) return null;

                return (
                    <TouchableOpacity 
                        key={index} 
                        activeOpacity={0.9} 
                        style={styles.imageContainer}
                        onPress={() => setSelectedImage(src)}
                    >
                        <Image source={{ uri: src }} style={styles.image} resizeMode="contain" />
                        <View style={styles.zoomIcon}>
                            <Maximize2 size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                );
            } else {
                const cleanText = part.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (!cleanText || cleanText.length < 2) return null;

                return (
                    <Text key={index} style={styles.textPart}>
                        {cleanText}
                    </Text>
                );
            }
        });
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
                    <Text style={styles.loadingText}>CARGANDO DIAGRAMAS...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerCard}>
                        <FileText size={24} color={Colors.primary} />
                        <View style={styles.headerTextInfo}>
                            <Text style={styles.docType}>DOCUMENTACIÓN OFICIAL</Text>
                            <Text style={styles.docTitle}>{title}</Text>
                        </View>
                    </View>

                    <View style={styles.mainContent}>
                        {renderContent()}
                    </View>

                    <View style={styles.disclaimer}>
                        <Info size={14} color="#999" />
                        <Text style={styles.disclaimerText}>
                            Información técnica proporcionada por Operation CHARM. Verifique siempre los torques y especificaciones con el fabricante.
                        </Text>
                    </View>
                </ScrollView>
            )}

            {/* Modal de Imagen Pantalla Completa */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View style={styles.modalBg}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
                        <X size={30} color="#FFF" />
                    </TouchableOpacity>
                    <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.fullImage} 
                        resizeMode="contain" 
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#999', fontSize: 11, fontWeight: 'bold' },
    scrollContent: { padding: 16 },
    
    headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2 },
    headerTextInfo: { marginLeft: 15 },
    docType: { fontSize: 10, fontWeight: 'bold', color: Colors.primary, letterSpacing: 1 },
    docTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 2 },
    
    mainContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
    textPart: { fontSize: 15, lineHeight: 24, color: '#444', marginBottom: 18 },
    
    imageContainer: { width: '100%', height: 250, marginVertical: 15, backgroundColor: '#F0F2F5', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    image: { width: '100%', height: '100%' },
    zoomIcon: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
    
    disclaimer: { flexDirection: 'row', marginTop: 20, padding: 15, backgroundColor: '#EEE', borderRadius: 10, opacity: 0.7 },
    disclaimerText: { flex: 1, fontSize: 11, color: '#666', marginLeft: 10, lineHeight: 16 },
    
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: width, height: height * 0.8 },
    closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    
    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
});
