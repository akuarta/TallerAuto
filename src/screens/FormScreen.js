import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { Save, X, Lock, Trash2 } from 'lucide-react-native';

export default function FormScreen({ route, navigation }) {
    const { title, dataKey, fields, item } = route.params;
    const { deleteItemByField, addItem, ...allData } = useData();
    const [formData, setFormData] = useState(item || {});
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Determinar si es edición o nuevo. 
    // Es edición solo si tiene datos completos (no solo ID_Marca para modelos)
    const isEdit = item && Object.keys(item).length > 0 && 
                   !(Object.keys(item).length <= 2 && item.ID_Marca && !item.ID_Modelo && !item.Marca);

    // Función para identificar si un campo es un campo ID
    const isIdField = (field) => {
        const fieldLower = field.toLowerCase();
        return fieldLower === 'id' || 
               fieldLower.includes('id_') || 
               fieldLower === 'idservicio' ||
               fieldLower === 'idmarca' ||
               fieldLower === 'idmodelo' ||
               fieldLower === 'idcliente' ||
               fieldLower === 'idorden' ||
               fieldLower === 'idfactura' ||
               fieldLower === 'factura' ||
               fieldLower === 'idcita' ||
               fieldLower === 'idtools' ||
               fieldLower === 'idproducto' ||
               fieldLower === 'idtecnico';
    };

    // Función para obtener las iniciales según el tipo de entidad (usando los prefijos existentes)
    const getPrefix = () => {
        const titleLower = title?.toLowerCase() || '';
        if (titleLower.includes('servicio')) return 'HS';
        if (titleLower.includes('cliente')) return 'DNI';
        if (titleLower.includes('orden')) return 'HO';
        if (titleLower.includes('marca')) return '';
        if (titleLower.includes('modelo')) return '';
        if (titleLower.includes('factura')) return '';
        if (titleLower.includes('cita')) return '';
        if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) return '';
        if (titleLower.includes('producto')) return 'HP';
        if (titleLower.includes('técnico') || titleLower.includes('tecnico')) return 'HT';
        if (titleLower.includes('herramienta')) return 'HH';
        return '';
    };

    // Función para obtener el prefijo del ID existente
    const getExistingPrefix = (idValue) => {
        if (!idValue) return '';
        // Buscar prefijos conocidos
        const prefixes = ['SER', 'CLI', 'ORD', 'MAR', 'MOD', 'FAC', 'CIT', 'VEH', 'PRO', 'TEC', 'HER', 'HO', 'HS', 'HP', 'HT', 'HH', 'H'];
        for (const prefix of prefixes) {
            if (idValue.toString().toUpperCase().startsWith(prefix)) {
                return prefix;
            }
        }
        return '';
    };

    // Función para generar ID específico para marca/modelo del catálogo (solo números)
    const generateCatalogId = (idField) => {
        const list = allData.catalog || [];
        
        // Filtrar solo los que tienen el campo ID correspondiente
        const filteredList = list.filter(item => item[idField]);
        
        // Para ID_Marca e ID_Modelo, solo buscar números
        const maxId = filteredList.reduce((max, curr) => {
            const val = parseInt(curr[idField]) || 0;
            return !isNaN(val) && val > max ? val : max;
        }, 0);
        
        // Devolver solo el número sin prefijo
        return String(maxId + 1);
    };

    // Función para generar ID general
    const generateGeneralId = (idField, dataKey) => {
        const list = allData[dataKey] || [];
        const prefix = getPrefix();
        
        // Filtrar solo los que tienen el campo ID
        const filteredList = list.filter(item => item[idField]);
        
        // Buscar el ID más alto que coincida con el prefijo o que sea numérico
        const maxId = filteredList.reduce((max, curr) => {
            const idValue = curr[idField]?.toString() || '0';
            let val;
            
            if (prefix) {
                // Si hay prefijo, intentar buscar con ese prefijo
                const numPart = idValue.replace(prefix, '');
                val = parseInt(numPart);
                
                // Si no tiene el prefijo, buscar con prefijos antiguos
                if (isNaN(val) || numPart === idValue) {
                    const oldPrefix = getExistingPrefix(idValue);
                    if (oldPrefix) {
                        val = parseInt(idValue.replace(oldPrefix, ''));
                    } else {
                        val = parseInt(idValue);
                    }
                }
            } else {
                // Sin prefijo, usar el valor directamente
                val = parseInt(idValue);
            }
            
            return !isNaN(val) && val > max ? val : max;
        }, 0);
        
        // Si hay prefijo, usarlo; si no, solo el número
        if (prefix) {
            return prefix + String(maxId + 1).padStart(3, '0');
        } else {
            return String(maxId + 1);
        }
    };

    // Encontrar el campo ID principal
    const getIdField = () => fields.find(f => isIdField(f));

    useEffect(() => {
        if (!isEdit) {
            // Generar ID para cada campo ID que esté vacío
            fields.forEach(field => {
                if (isIdField(field) && !formData[field]) {
                    let newId;
                    
                    // Manejo especial para el catálogo (marcas y modelos)
                    if (dataKey === 'catalog') {
                        newId = generateCatalogId(field);
                    } else {
                        // Para otros dataKeys, usar la función mejorada
                        newId = generateGeneralId(field, dataKey);
                    }
                    
                    setFormData(prev => ({ ...prev, [field]: newId }));
                }
            });
        }
    }, [isEdit, dataKey, fields, allData, title]);

    const handleSave = () => {
        // Validación básica
        if (Object.keys(formData).length === 0) {
            Alert.alert("Error", "Por favor completa al menos un campo");
            return;
        }

        console.log(`Guardando en ${dataKey}:`, formData);
        
        // Agregar el registro a los datos
        addItem(dataKey, formData);
        
        // Cerrar el modal si está abierto
        setShowDeleteModal(false);
        
        // Navegar hacia atrás inmediatamente
        navigation.goBack();
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        // Encontrar el campo ID para eliminar
        const idField = getIdField();
        if (idField && formData[idField]) {
            deleteItemByField(dataKey, idField, formData[idField]);
            console.log(`Eliminado de ${dataKey}:`, formData);
            
            // Cerrar modal
            setShowDeleteModal(false);
            
            // Navegar hacia atrás inmediatamente
            navigation.goBack();
        } else {
            setShowDeleteModal(false);
            Alert.alert("Error", "No se pudo eliminar el registro");
        }
    };

    const idField = getIdField();

    return (
        <View style={styles.container}>
            <CustomHeader title={isEdit ? `EDITAR ${title}` : `NUEVO ${title}`} />
            <ScrollView contentContainerStyle={styles.scroll}>
                {fields.map((field) => {
                    const isId = isIdField(field);
                    return (
                        <View key={field} style={styles.inputGroup}>
                            <Text style={styles.label}>{field}</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, isId && styles.idInput]}
                                    placeholder={`Ingresa ${field}...`}
                                    placeholderTextColor={Colors.textSecondary}
                                    value={formData[field] || ''}
                                    onChangeText={(text) => {
                                        // Si es campo ID y es edición, no permitir cambios
                                        if (isId && isEdit) {
                                            return;
                                        }
                                        setFormData({ ...formData, [field]: text });
                                    }}
                                    editable={!(isId && isEdit)}
                                />
                                {isId && (
                                    <View style={styles.idIcon}>
                                        <Lock size={16} color={Colors.textSecondary} />
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}

                <View style={styles.actions}>
                    {isEdit && (
                        <TouchableOpacity style={[styles.button, styles.delete]} onPress={handleDelete}>
                            <Trash2 size={20} color="#FFF" />
                            <Text style={styles.buttonText}>ELIMINAR</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.button, styles.cancel]} onPress={() => navigation.goBack()}>
                        <X size={20} color={Colors.text} />
                        <Text style={styles.buttonText}>CANCELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSave}>
                        <Save size={20} color="#FFF" />
                        <Text style={styles.buttonText}>GUARDAR</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal de confirmación de eliminación */}
            <Modal
                visible={showDeleteModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¿Confirmar eliminación?</Text>
                        <Text style={styles.modalMessage}>
                            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalCancel]} 
                                onPress={() => setShowDeleteModal(false)}
                            >
                                <Text style={styles.modalButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalDelete]} 
                                onPress={confirmDelete}
                            >
                                <Text style={styles.modalButtonText}>ELIMINAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { color: Colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        color: Colors.text,
        padding: 12,
        fontSize: 16,
    },
    idInput: {
        backgroundColor: '#2A2A2A',
        borderColor: Colors.primary,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    idIcon: {
        position: 'absolute',
        right: 12,
    },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap' },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        marginBottom: 8,
    },
    cancel: { backgroundColor: '#444' },
    save: { backgroundColor: Colors.primary },
    delete: { backgroundColor: Colors.accent },
    buttonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
    
    // Estilos del modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 20,
        width: '85%',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalMessage: {
        color: Colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    modalCancel: {
        backgroundColor: '#444',
    },
    modalDelete: {
        backgroundColor: Colors.accent,
    },
    modalButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
