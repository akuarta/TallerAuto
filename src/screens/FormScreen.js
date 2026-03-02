import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Colors } from '../constants';
import { CustomHeader } from '../components/CustomHeader';
import { useData } from '../context/DataContext';
import { Save, X, Lock, Trash2, Calendar, Camera } from 'lucide-react-native';

export default function FormScreen({ route, navigation }) {
    const { title, dataKey, fields, item, prefill } = route.params || {};
    const { deleteItemByField, addItem, updateItem, syncing, ...allData } = useData();
    const [formData, setFormData] = useState(item || prefill || {});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerConfig, setPickerConfig] = useState(null); // { field, data, labelField }
    const [pickerSearchQuery, setPickerSearchQuery] = useState('');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [tempMonth, setTempMonth] = useState('01');
    const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

    // Es edición solo si tiene datos completos (no solo ID_Marca para modelos)
    const isEdit = item && Object.keys(item).length > 0 &&
        !(Object.keys(item).length <= 2 && item.ID_Marca && !item.ID_Modelo && !item.Marca);

    const goBackToList = () => {
        const mapping = {
            'orders': 'Orders',
            'garage': 'Garage',
            'invoices': 'Billing',
            'catalog': 'VehicleSearch',
            'vehiculos': 'VehicleList',
            'clients': 'ClientList',
            'tecnicos': 'TechnicianList',
            'citas': 'AppointmentList',
            'facturando': 'InvoicingList'
        };
        const target = mapping[dataKey];
        if (target) {
            navigation.navigate(target);
        } else {
            navigation.goBack();
        }
    };

    // Función para identificar si un campo es un campo ID
    const isIdField = (field) => {
        const f = field.toLowerCase().trim();
        // Detectar si empieza por ID, contiene _ID, o es exactamente ID
        return f === 'id' ||
            f.startsWith('id ') ||
            f.startsWith('id_') ||
            f.includes('_id') ||
            f.includes('id_') ||
            f.startsWith('id') && f.length > 2 && !['identificacion', 'identidad'].includes(f); // Evitar falsos positivos como 'identidad'
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
        // Para vehículos, usamos 'HV' como prefijo
        if (titleLower.includes('vehículo') || titleLower.includes('vehiculo')) return 'HV';
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

    // --- FUNCIONES AUXILIARES ---

    // Función universal para generar IDs siguiendo la lógica histórica de la tabla
    const generateUniversalId = (idField, dKey) => {
        const list = allData[dKey] || [];
        if (list.length === 0) {
            const prefix = getPrefix();
            return prefix + "1";
        }

        const ids = list.map(item => item[idField]?.toString() || "").filter(id => id !== "");
        if (ids.length === 0) return getPrefix() + "1";

        const lastId = ids[ids.length - 1];
        const prefixMatch = lastId.match(/^([A-Za-z]+)/);
        const prefix = prefixMatch ? prefixMatch[1] : "";

        const maxNum = ids.reduce((max, id) => {
            const numPart = id.replace(/^\D+/g, '');
            const num = parseInt(numPart) || 0;
            return num > max ? num : max;
        }, 0);

        return prefix + (maxNum + 1);
    };

    // Función para formatear el año como mm/AAAA
    const formatMonthYear = (text) => {
        // Eliminar cualquier cosa que no sea número
        const cleaned = text.replace(/\D/g, '');
        let formatted = cleaned;

        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 6);
        }

        return formatted;
    };

    // Función para traducir colores de español a inglés (para CSS)
    const translateColor = (colorName) => {
        if (!colorName) return '';
        const lower = colorName.toLowerCase().trim();
        const colorMap = {
            'rojo': 'red', 'azul': 'blue', 'verde': 'green', 'amarillo': 'yellow',
            'negro': 'black', 'blanco': 'white', 'gris': 'gray', 'naranja': 'orange',
            'morado': 'purple', 'purpura': 'purple', 'rosa': 'pink', 'rosado': 'pink',
            'marron': 'brown', 'café': 'brown', 'cafe': 'brown', 'plateado': 'silver',
            'plata': 'silver', 'dorado': 'gold', 'oro': 'gold', 'celeste': 'skyblue',
            'turquesa': 'turquoise', 'cian': 'cyan', 'magenta': 'magenta', 'lima': 'lime',
            'azul marino': 'navy', 'oliva': 'olive', 'trigo': 'wheat', 'crema': 'beige',
        };
        return colorMap[lower] || lower;
    };

    // Encontrar el campo ID principal
    const getIdField = () => fields.find(f => isIdField(f));

    useEffect(() => {
        if (!isEdit) {
            // Generar ID para cada campo ID que esté vacío
            const updatedFormData = { ...formData };
            let hasChanges = false;

            fields.forEach(field => {
                if (isIdField(field) && !formData[field]) {
                    updatedFormData[field] = generateUniversalId(field, dataKey);
                    hasChanges = true;
                }
            });

            if (hasChanges) setFormData(updatedFormData);
        }
    }, [allData, dataKey, fields, isEdit]);

    const handleSave = async () => {
        // Validación básica
        if (Object.keys(formData).length === 0) {
            Alert.alert("Error", "Por favor completa al menos un campo");
            return;
        }

        const idField = getIdField();

        // Validación de Matrícula Única para Vehículos
        if (dataKey === 'vehiculos') {
            const matricula = formData.Matricula;
            // Solo validar si es nuevo o si cambió la matrícula
            const isMatriculaChanged = !isEdit || item.Matricula !== matricula;

            if (isMatriculaChanged) {
                const existingVehicle = allData.vehiculos?.find(v =>
                    String(v.Matricula || '').toLowerCase() === String(matricula || '').toLowerCase() &&
                    (!isEdit || v.id !== item.id)
                );

                if (existingVehicle) {
                    Alert.alert(
                        "Matrícula Duplicada",
                        `La matrícula ${matricula} ya está registrada en otro vehículo.`
                    );
                    return;
                }
            }
        }

        // Lógica específica para Clientes (requerimiento de tener vehículo)
        if (dataKey === 'clients') {
            const clientName = formData.Nombre || formData.Cliente;
            const vehicleMatricula = formData['Vehículo'] || formData['Matricula'];

            if (!isEdit) {
                const vehicles = allData.getVehiculosByCliente(clientName);
                if (!vehicleMatricula && vehicles.length === 0) {
                    Alert.alert(
                        "Vehículo Requerido",
                        "Cada cliente debe tener al menos un vehículo asignado. ¿Deseas registrar uno ahora?",
                        [
                            { text: "Cancelar", style: "cancel" },
                            {
                                text: "Sí, Registrar Vehículo",
                                onPress: async () => {
                                    await addItem(dataKey, formData);
                                    navigation.push('Form', {
                                        title: 'Vehículo',
                                        dataKey: 'vehiculos',
                                        fields: ['Matricula', 'Marca', 'Modelo', 'Año de Fabricacion', 'Color', 'Codigo VIN', 'Notas'],
                                        prefill: { 'Cliente(REF)': clientName, ID_Cliente: formData[idField] }
                                    });
                                }
                            }
                        ]
                    );
                    return;
                }
            }

            // Si se seleccionó un vehículo existente, vincularlo
            if (vehicleMatricula) {
                const vehicle = allData.vehiculos.find(v => v.Matricula === vehicleMatricula);
                if (vehicle) {
                    allData.updateItem('vehiculos', vehicle.id || vehicle['ID Vehiculo'], {
                        'Cliente(REF)': clientName,
                        'Cliente': clientName
                    });
                }
            }
        }

        try {
            let result;
            if (isEdit) {
                result = await updateItem(dataKey, formData.id, formData);
            } else {
                result = await addItem(dataKey, formData);
            }

            if (result && result.success === false) {
                goBackToList();
                Alert.alert(
                    "Sincronización Pendiente",
                    "Los datos se guardaron localmente pero hubo un problema con la nube: " + (result.error || "Error de respuesta")
                );
            } else {
                goBackToList();
            }
        } catch (error) {
            Alert.alert("Error de Conexión", "No se pudo contactar con el servidor. Revisa tu internet.");
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (formData.id) {
            setIsDeleting(true);
            try {
                const result = await allData.deleteItem(dataKey, formData.id);
                setShowDeleteModal(false);

                if (result && result.success === false) {
                    goBackToList();
                    Alert.alert("Borrado Local", "Se eliminó localmente pero no se pudo borrar en la nube.");
                } else {
                    goBackToList();
                    Alert.alert("Eliminado", "El registro se ha eliminado correctamente de la nube.");
                }
            } catch (error) {
                Alert.alert("Error", "No se pudo procesar la eliminación.");
            } finally {
                setIsDeleting(false);
            }
        } else {
            setShowDeleteModal(false);
            Alert.alert("Error", "No se pudo eliminar el registro");
        }
    };

    // Lógica de Pickers
    const openPicker = (field) => {
        let options = [];
        let labelField = '';
        const fieldLower = field.toLowerCase();

        if (fieldLower.includes('cliente')) {
            options = allData.clients || [];
            labelField = 'Nombre';
        } else if (fieldLower.includes('tecnico')) {
            options = allData.tecnicos || [];
            labelField = 'Nombre';
        } else if (fieldLower === 'estado') {
            options = [
                { id: '1', name: 'Pendiente' },
                { id: '2', name: 'En Proceso' },
                { id: '3', name: 'Completado' },
                { id: '4', name: 'Cancelado' }
            ];
            labelField = 'name';
        } else if (fieldLower.includes('marca')) {
            // Obtener marcas únicas del catálogo
            const marcasSet = new Set();
            (allData.catalog || []).forEach(item => {
                if (item.Marca) marcasSet.add(item.Marca);
            });
            options = Array.from(marcasSet).sort().map(m => ({ id: m, Marca: m }));
            labelField = 'Marca';
        } else if (fieldLower.includes('modelo')) {
            const selectedMarca = formData.Marca;
            if (!selectedMarca) {
                Alert.alert("Atención", "Por favor selecciona primero una Marca");
                return;
            }
            // Filtrar modelos por la marca seleccionada
            const modelosSet = new Set();
            (allData.catalog || []).forEach(item => {
                if (item.Marca === selectedMarca && item.Modelo) {
                    modelosSet.add(item.Modelo);
                }
            });
            options = Array.from(modelosSet).sort().map(m => ({ id: m, Modelo: m }));
            labelField = 'Modelo';
        } else if (fieldLower.includes('matricula') || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo')) {
            const selectedClient = formData.Nombre || formData.Cliente || formData.ID_Cliente;
            options = allData.vehiculos || [];

            if (dataKey === 'clients') {
                options = options.filter(v => {
                    const clientRef = v.Cliente || v.ID_Cliente || v['Cliente(REF)'] || v['ID Cliente'];
                    return !clientRef || clientRef === '';
                });
            } else if (selectedClient) {
                options = options.filter(v =>
                    String(v.Cliente || '').toLowerCase() === String(selectedClient || '').toLowerCase() ||
                    String(v.ID_Cliente || '').toLowerCase() === String(selectedClient || '').toLowerCase()
                );
            }
            labelField = 'Matricula';
        }

        if (options.length > 0 || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo') || fieldLower.includes('placa') || fieldLower.includes('matricula')) {
            setPickerConfig({ field, data: options, labelField });
            setPickerSearchQuery(''); // Resetear búsqueda al abrir
            setPickerVisible(true);
        } else {
            Alert.alert("Info", "No hay opciones disponibles para este campo");
        }
    };

    const handleSelectOption = (option) => {
        const { field, labelField } = pickerConfig;
        const value = option[labelField];

        const newFormData = { ...formData, [field]: value };

        const fieldLower = field.toLowerCase();
        if (fieldLower.includes('cliente')) {
            newFormData['Placa'] = '';
            newFormData['Vehículo'] = '';
        } else if (fieldLower.includes('marca')) {
            // Si cambia la marca, limpiamos el modelo para mantener coherencia
            newFormData['Modelo'] = '';
        } else if (fieldLower.includes('matricula') || fieldLower.includes('vehiculo') || fieldLower.includes('vehículo')) {
            if (fields.includes('Marca')) newFormData['Marca'] = option['Marca'];
            if (fields.includes('Modelo')) newFormData['Modelo'] = option['Modelo'];
            if (field === 'Vehículo') newFormData['Vehículo'] = option['Matricula'] || option['id'];
        }

        setFormData(newFormData);
        setPickerVisible(false);
    };

    const isPickerField = (field) => {
        if (isIdField(field)) return false; // Los IDs nunca son pickers en este formulario

        const f = field.toLowerCase();
        if ((f === 'placa' || f === 'matricula') && dataKey === 'vehiculos') {
            return false;
        }
        return f.includes('cliente') || f.includes('tecnico') || f.includes('placa') || f.includes('matricula') ||
            f === 'estado' || f.includes('vehiculo') || f.includes('vehículo') ||
            f.includes('marca') || f.includes('modelo');
    };

    const idField = getIdField();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <CustomHeader
                title={isEdit ? `EDITAR ${title}` : `NUEVO ${title}`}
                showBack={true}
                leftAction={goBackToList}
            />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
                {fields.map((field) => {
                    const isId = isIdField(field);
                    const isPicker = isPickerField(field);

                    return (
                        <View key={field} style={styles.inputGroup}>
                            <Text style={styles.label}>{field}</Text>
                            <View style={styles.inputContainer}>
                                {field.toLowerCase() === 'color' && formData[field] && (
                                    <View
                                        style={[
                                            styles.colorPreview,
                                            { backgroundColor: translateColor(formData[field]) }
                                        ]}
                                    />
                                )}
                                {isPicker ? (
                                    <TouchableOpacity
                                        style={[styles.input, isId && styles.idInput, { justifyContent: 'center' }]}
                                        onPress={() => openPicker(field)}
                                    >
                                        <Text style={{ color: formData[field] ? Colors.text : Colors.textSecondary }}>
                                            {formData[field] || `Seleccionar ${field}...`}
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <TextInput
                                            style={[styles.input, isId && styles.idInput, { flex: 1 }]}
                                            placeholder={`Ingresa ${field}...`}
                                            placeholderTextColor={Colors.textSecondary}
                                            value={formData[field]?.toString() || ''}
                                            keyboardType={field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion') ? 'numeric' : 'default'}
                                            autoCapitalize={(field.toLowerCase() === 'placa' || field.toLowerCase() === 'matricula' || field.toLowerCase().includes('vin')) ? 'characters' : 'sentences'}
                                            onChangeText={(text) => {
                                                if (isId && isEdit) return;

                                                let finalValue = text;
                                                const fLower = field.toLowerCase();
                                                if (fLower === 'año' || fLower.includes('fabricacion')) {
                                                    finalValue = formatMonthYear(text);
                                                } else if (fLower === 'placa' || fLower === 'matricula' || fLower.includes('vin')) {
                                                    finalValue = text.toUpperCase();
                                                }

                                                setFormData({ ...formData, [field]: finalValue });
                                            }}
                                            editable={!(isId && isEdit)}
                                            maxLength={field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion') ? 7 : undefined}
                                        />
                                        {(field.toLowerCase().includes('año') || field.toLowerCase().includes('fabricacion')) && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={() => {
                                                    const current = formData[field]?.split('/') || [];
                                                    if (current.length === 2) {
                                                        setTempMonth(current[0]);
                                                        setTempYear(current[1]);
                                                    }
                                                    setShowYearPicker(true);
                                                }}
                                            >
                                                <Calendar size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                        {(field.toLowerCase() === 'matricula' || field.toLowerCase().includes('vin')) && (
                                            <TouchableOpacity
                                                style={styles.calendarButton}
                                                onPress={() => {
                                                    Alert.alert("Escáner", `Iniciando escáner para ${field}... (Simulado)`);
                                                    // Aquí iría la lógica de OCR real
                                                }}
                                            >
                                                <Camera size={24} color={Colors.primary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                                {(isId || isPicker) && (
                                    <View style={styles.idIcon}>
                                        {isId ? <Lock size={16} color={Colors.textSecondary} /> : <X size={16} color={Colors.textSecondary} />}
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
                    <TouchableOpacity
                        style={[styles.button, styles.cancel]}
                        onPress={goBackToList}
                    >
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

            {/* Modal de Selección (Picker) */}
            <Modal
                visible={pickerVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '70%' }]}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.modalTitle}>SELECCIONAR {pickerConfig?.field.toUpperCase()}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.pickerSearchInput}
                            placeholder="Buscar..."
                            placeholderTextColor={Colors.textSecondary}
                            value={pickerSearchQuery}
                            onChangeText={setPickerSearchQuery}
                            autoFocus={false}
                        />

                        <ScrollView style={{ marginTop: 10 }}>
                            {pickerConfig?.data
                                .filter(opt => {
                                    if (!pickerSearchQuery) return true;
                                    const val = opt[pickerConfig.labelField]?.toString().toLowerCase() || '';
                                    return val.includes(pickerSearchQuery.toLowerCase());
                                })
                                .map((opt, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.pickerOption}
                                        onPress={() => {
                                            handleSelectOption(opt);
                                            setPickerSearchQuery('');
                                        }}
                                    >
                                        <Text style={styles.pickerOptionText}>{opt[pickerConfig.labelField]}</Text>
                                        {opt.Modelo && <Text style={styles.pickerOptionSubtext}>{opt.Marca} {opt.Modelo}</Text>}
                                    </TouchableOpacity>
                                ))}

                            {/* Opción de crear nuevo al final de la lista */}
                            {(pickerConfig?.field.toLowerCase().includes('matricula') || pickerConfig?.field.toLowerCase().includes('vehiculo') || pickerConfig?.field.toLowerCase().includes('vehículo')) && (
                                <TouchableOpacity
                                    style={[styles.pickerOption, { borderBottomWidth: 0, marginTop: 10, backgroundColor: Colors.primary + '20' }]}
                                    onPress={() => {
                                        setPickerVisible(false);
                                        navigation.push('Form', {
                                            title: 'Vehículo',
                                            dataKey: 'vehiculos',
                                            fields: ['Matricula', 'Marca', 'Modelo', 'Año de Fabricacion', 'Color', 'Codigo VIN', 'Notas'],
                                            prefill: {
                                                'Cliente(REF)': formData.Nombre || formData.Cliente,
                                                'Cliente': formData.Nombre || formData.Cliente,
                                                ID_Cliente: formData[idField]
                                            }
                                        });
                                    }}
                                >
                                    <Text style={[styles.pickerOptionText, { color: Colors.primary, fontWeight: 'bold' }]}>+ AÑADIR NUEVO VEHÍCULO</Text>
                                    <Text style={styles.pickerOptionSubtext}>Si el vehículo no está en la lista</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Modal Selector de Mes/Año (Calendario) */}
            <Modal
                visible={showYearPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowYearPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Seleccionar Fecha</Text>

                        <View style={styles.pickerRow}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={styles.pickerSubLabel}>Mes</Text>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.pickerItem, tempMonth === m && styles.selectedItem]}
                                            onPress={() => setTempMonth(m)}
                                        >
                                            <Text style={[styles.pickerItemText, tempMonth === m && styles.selectedItemText]}>{m}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={styles.pickerSubLabel}>Año</Text>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[styles.pickerItem, tempYear === y && styles.selectedItem]}
                                            onPress={() => setTempYear(y)}
                                        >
                                            <Text style={[styles.pickerItemText, tempYear === y && styles.selectedItemText]}>{y}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        <View style={[styles.modalActions, { marginTop: 20 }]}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalCancel]}
                                onPress={() => setShowYearPicker(false)}
                            >
                                <Text style={styles.modalButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                                onPress={() => {
                                    const fieldToUpdate = fields.find(f => f.toLowerCase().includes('año') || f.toLowerCase().includes('fabricacion'));
                                    if (fieldToUpdate) {
                                        setFormData({ ...formData, [fieldToUpdate]: `${tempMonth}/${tempYear}` });
                                    }
                                    setShowYearPicker(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>ACEPTAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Overlay de Sincronización (Loading) */}
            <Modal transparent={true} visible={syncing || isDeleting}>
                <View style={styles.syncOverlay}>
                    <View style={styles.syncCard}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.syncText}>Sincronizando con la nube...</Text>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: 20, paddingBottom: 100 },
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
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    pickerOption: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
    pickerOptionText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
    pickerOptionSubtext: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
    addOptionBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    addOptionText: { color: '#FFF', fontWeight: 'bold' },
    pickerSearchInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        color: Colors.text,
        padding: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    colorPreview: {
        width: 30,
        height: 30,
        borderRadius: 6,
        marginRight: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calendarButton: {
        padding: 10,
        marginLeft: 8,
        backgroundColor: Colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between' },
    pickerSubLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 5, textAlign: 'center' },
    pickerItem: { padding: 10, alignItems: 'center', borderRadius: 6, marginBottom: 2 },
    selectedItem: { backgroundColor: Colors.primary + '30' },
    pickerItemText: { color: Colors.text, fontSize: 16 },
    selectedItemText: { color: Colors.primary, fontWeight: 'bold' },
    syncOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    syncCard: {
        backgroundColor: Colors.card,
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 5
    },
    syncText: {
        color: Colors.text,
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold'
    }
});
