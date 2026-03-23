import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext({});

const API_URL = "https://script.google.com/macros/s/AKfycbz2y8bdW3AoJFBt3XHZf3APMwXa8grTUWfMxiq-1DXMU6qvywSt11tbyaMfRuQTkKuw/exec";

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    catalog: [],
    garage: [],
    servicios: [],
    clients: [],
    invoices: [],
    orders: [],
    entradas: [],
    facturando: [],
    fotosEntrada: [],
    fotosSalidas: [],
    detalleFactura: [],
    productos: [],
    salidas: [],
    tecnicos: [],
    citas: [],
    herramientas: [],
    vehiculos: [],
    rescates: [],
  });

  const EXPECTED_IDS = {
    'entradas': ['ID_N0. Entrada', 'ID_No. Entrada', 'ID_Entrada'],
    'tecnicos': ['ID_Tecnico'],
    'citas': ['ID_Cita'],
    'rescates': ['IdRescate', 'ID_Rescate'],
    'catalog': ['ID_Modelo', 'ID_Marca'],
    'productos': ['IDproducto', 'ID_Producto'],
    'herramientas': ['ID_Tools'],
    'vehiculos': ['ID_Vehiculo', 'Matricula'],
    'clients': ['ID_Cliente'],
    'orders': ['ID_Orden'],
    'invoices': ['Factura', 'ID_Factura', 'ID_Facturacion'],
    'servicios': ['ID_Servicio'],
  };
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const DEFAULT_SETTINGS = {
    tallerName: 'Taller de Reparación Auto',
    tallerPhone: '',
    tallerAddress: '',
    tallerLat: 18.5126,
    tallerLng: -69.8943,
    notificationsEnabled: true,
    alertNewOrder: true,
    alertRescue: true,
    alertAppointment: true,
    shortcuts: ['Garage', 'Billing', 'Services', 'VehicleSearch'],
  };
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    loadAllData();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('@taller_settings');
      if (stored) {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) }));
      }
    } catch (e) {
      console.log('Error cargando settings en DataContext:', e);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('@taller_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (e) {
      console.log('Error guardando settings:', e);
    }
  };

  const loadAllData = async () => {
    try {
      if (!hasLoaded) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const response = await fetch(API_URL);
      const result = await response.json();

      // Función para normalizar objetos (ID -> id, y asegurar que id sea string)
      const normalize = (arr, tableKey) => (arr || []).map(item => {
        let idKey = null;
        if (tableKey && EXPECTED_IDS[tableKey]) {
            idKey = EXPECTED_IDS[tableKey].find(k => item[k] !== undefined && item[k] !== null && item[k] !== '');
        }

        if (!idKey) {
            idKey = Object.keys(item).find(k =>
              k.toLowerCase().trim() === 'id' ||
              k.toLowerCase() === 'identificador' ||
              k.toLowerCase() === 'idvehiculo' ||
              k.toLowerCase() === 'idcliente' ||
              k.toLowerCase() === 'idtecnico' ||
              k.toLowerCase() === 'idservicio' ||
              k.toLowerCase() === 'idproducto' ||
              k.toLowerCase() === 'id_producto' ||
              k.toLowerCase().startsWith('id_') ||
              k.toLowerCase().startsWith('id ')
            );
        }

        const rawId = idKey ? item[idKey] : (item.id || item.ID || item.Id);
        const id = rawId ? String(rawId) : Math.random().toString(36).substr(2, 9);

        // Crear copia normalizada para uso interno pero manteniendo claves originales
        const normalizedItem = { ...item, id };

        // Formatear fechas ISO feas ("2025-01-21T04:00:00.000Z" -> "2025-01-21")
        Object.keys(normalizedItem).forEach(k => {
          const val = normalizedItem[k];
          if (typeof val === 'string') {
            // Caso 1: ISO Date con tiempo (YYYY-MM-DDTHH:mm...)
            if (val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
              if (val.includes('1899-12-30')) {
                // Es solo una Hora que Google Sheets mandó con la fecha base
                const timeMatch = val.match(/T(\d{2}:\d{2})/);
                normalizedItem[k] = timeMatch ? timeMatch[1] : val;
              } else {
                // Es una fecha real
                normalizedItem[k] = val.split('T')[0];
              }
            }
            // Caso 2: Solo la fecha base de Excel/Google para "cero"
            else if (val.includes('1899-12-30')) {
              normalizedItem[k] = ''; // O podrías poner '00:00' si sabes que es hora
            }
          }
        });

        return normalizedItem;
      });

      setData({
        catalog: normalize(result['buscar vehiculos'], 'catalog'),
        garage: normalize(result.GARAGE || result.garage, 'garage'),
        servicios: normalize(result.Servicios || result.servicios, 'servicios'),
        clients: normalize(result.CLIENTES || result.clientes, 'clients'),
        invoices: normalize(result.Facturacion || result.facturacion, 'invoices'),
        orders: normalize(result.ORDENES || result.ordenes, 'orders'),
        entradas: normalize(result.ENTRADA || result.entrada, 'entradas'),
        facturando: normalize(result.facturando, 'facturando'),
        fotosEntrada: normalize(result['Fotos de Cond/entrada'], 'fotosEntrada'),
        fotosSalidas: normalize(result['Fotos de Cond/salida'], 'fotosSalidas'),
        detalleFactura: normalize(result.DETALLES_FACTURA, 'detalleFactura'),
        productos: normalize(result.Productos, 'productos'),
        salidas: normalize(result.salidas, 'salidas'),
        tecnicos: normalize(result.TECNICOS, 'tecnicos'),
        citas: normalize(result.Citas || result.citas, 'citas'),
        herramientas: normalize(result.Herramientas, 'herramientas'),
        usuarios: normalize(result.USUARIOS, 'usuarios'),
        vehiculos: normalize(result.VEHICULOS, 'vehiculos'),
        rescates: normalize(result.RESCATES || result.rescates, 'rescates'),
      });
      setLoading(false);
      setRefreshing(false);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error loading remote data:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const SHEET_MAP = {
    'vehiculos': 'VEHICULOS',
    'clients': 'CLIENTES',
    'orders': 'ORDENES',
    'catalog': 'buscar vehiculos',
    'citas': 'Citas',
    'productos': 'PRODUCTOS',
    'servicios': 'SERVICIOS',
    'entradas': 'ENTRADA',
    'tecnicos': 'TECNICOS',
    'rescates': 'RESCATES'
  };

  const syncToRemote = async (action, dataKey, payload) => {
    try {
      setSyncing(true);
      const actionUpper = action.toUpperCase();
      const sheetName = SHEET_MAP[dataKey] || dataKey;
      console.log(`📡 Sincronizando: ${actionUpper} en hoja "${sheetName}"...`);

      const body = JSON.stringify({
        action: actionUpper,
        sheet: sheetName,
        dataKey: dataKey,
        data: (() => {
          const cleanData = { ...payload };
          
          // Buscar el nombre de la columna ID correcto para esta tabla
          const possibleIdKeys = EXPECTED_IDS[dataKey] || [];
          const sheetIdField = possibleIdKeys[0];

          // Lógica unificada para IDs (ADD, UPDATE, DELETE)
          const businessIdField = Object.keys(cleanData).find(k =>
            k.toLowerCase().startsWith('id_') ||
            k.toLowerCase() === 'idcita' ||
            k.toLowerCase() === 'id_cita' ||
            k.toLowerCase() === 'idproducto' ||
            k.toLowerCase() === 'idrescate'
          );

          if (businessIdField) {
            // REQUERIMIENTO DEL SCRIPT: El borrado/edición NECESITA un campo llamado 'id'.
            // Mapeamos el ID de negocio (Col A) al campo 'id' para que el servidor lo procese.
            cleanData.id = String(cleanData[businessIdField] || '').trim();
          } else if (cleanData.id) {
            const cleanId = String(cleanData.id).trim();
            cleanData.id = cleanId;
            cleanData.ID = cleanId;
            cleanData.Id = cleanId;
            if (sheetIdField) {
              cleanData[sheetIdField] = cleanId;
            }
          }
          return cleanData;
        })()
      });

      console.log('📦 Body enviado:', body);

      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: 'follow',
        // NO enviamos Content-Type para evitar el preflight CORS de Google Apps Script
        // Google lee el body con e.postData.contents y hace JSON.parse()
        body,
      });

      const text = await response.text();
      console.log('📩 Respuesta raw:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { success: true, raw: text };
      }

      console.log(`✅ Resultado de sincronización (${action}):`, result);
      setSyncing(false);
      return result;
    } catch (error) {
      console.error(`❌ Error crítico de sincronización (${action} en ${dataKey}):`, error);
      setSyncing(false);
      return { success: false, error: error.message };
    }
  };

  // Función para eliminar un registro
  const deleteItem = async (dataKey, itemId) => {
    // Buscamos el item completo antes de borrarlo para tener todos los campos (como ID_Marca)
    const fullItem = (data[dataKey] || []).find(i => i.id === itemId);

    // Primero actualizamos localmente
    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.filter(item => item.id !== itemId);
      return { ...prevData, [dataKey]: updatedList };
    });

    // Luego sincronizamos y retornamos resultado (pasamos el fullItem o el id como fallback)
    return await syncToRemote('delete', dataKey, fullItem || { id: itemId });
  };

  // Función para eliminar un registro por un campo específico
  const deleteItemByField = async (dataKey, field, value) => {
    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.filter(item => item[field] !== value);
      return { ...prevData, [dataKey]: updatedList };
    });

    // Luego sincronizamos y retornamos resultado
    return await syncToRemote('deleteByField', dataKey, { field, value });
  };

  // Función para agregar un nuevo registro
  const addItem = async (dataKey, newItem) => {
    // Si ya trae un ID (generado por FormScreen), lo usamos. 
    // De lo contrario generamos uno numérico básico como fallback.
    const itemToSync = { ...newItem };

    // Solo generamos un ID numérico si NO tiene ya un ID de negocio
    const hasBusinessId = Object.keys(itemToSync).some(k => 
        k.toLowerCase().startsWith('id_') || 
        k.toLowerCase() === 'idproducto' ||
        k.toLowerCase() === 'idrescate'
    );

    if (!itemToSync.id && !hasBusinessId) {
      const list = data[dataKey] || [];
      const maxId = list.reduce((max, curr) => {
        const currentId = parseInt(curr.id) || 0;
        return currentId > max ? currentId : max;
      }, 0);
      itemToSync.id = (maxId + 1).toString();
    }

    // Lógica de Reputación para Facturas
    if (dataKey === 'invoices') {
      const total = parseFloat(itemToSync.Total || 0);
      const pagado = parseFloat(itemToSync.MontoPagado || 0);

      const diferencia = pagado - total;
      itemToSync.DiferenciaPago = diferencia;

      if (diferencia > 0) {
        itemToSync.Propina = diferencia;
        itemToSync.Regateo = 0;
      } else if (diferencia < 0) {
        itemToSync.Regateo = Math.abs(diferencia);
        itemToSync.Propina = 0;
      } else {
        itemToSync.Propina = 0;
        itemToSync.Regateo = 0;
      }
    }

    // Actualizamos localmente
    setData(prevData => {
      const list = prevData[dataKey] || [];
      return { ...prevData, [dataKey]: [...list, itemToSync] };
    });

    // Sincronizamos y retornamos resultado
    return await syncToRemote('ADD', dataKey, itemToSync);
  };

  // Función para agregar múltiples registros de una vez (Optimizado)
  const addItems = async (dataKey, newItems, silent = false) => {
    if (!newItems || newItems.length === 0) return;

    // Actualizamos localmente en un solo paso
    setData(prevData => {
      const list = prevData[dataKey] || [];
      return { ...prevData, [dataKey]: [...list, ...newItems] };
    });

    // Sincronización masiva (Opcional, se podría optimizar el Script de Google para recibir arrays)
    if (!silent) {
        // Por ahora lo hacemos secuencial pero sin bloquear el render local
        for (const item of newItems) {
            syncToRemote('ADD', dataKey, item);
        }
    }
  };

  // Función para actualizar un registro existente
  const updateItem = async (dataKey, itemId, updatedFields) => {
    let finalFields = { ...updatedFields };

    // Lógica de Reputación para Facturas
    if (dataKey === 'invoices') {
      const total = parseFloat(finalFields.Total || 0);
      const pagado = parseFloat(finalFields.MontoPagado || 0);
      const descuento = parseFloat(finalFields.Descuentos || 0);

      // Solo aplica si NO hay descuento registrado (o si el descuento es 0)
      // Aunque el usuario dice "si NO hay descuento registrado", usualmente se refiere a que 
      // si el pago coincide con el total DESPUÉS del descuento, es 0 diferencia.
      // Pero su ejemplo dice: Total final 4500, Pagado 4500 -> Diferencia 0.

      const diferencia = pagado - total;
      finalFields.DiferenciaPago = diferencia;

      if (diferencia > 0) {
        finalFields.Propina = diferencia;
        finalFields.Regateo = 0;
      } else if (diferencia < 0) {
        finalFields.Regateo = Math.abs(diferencia);
        finalFields.Propina = 0;
      } else {
        finalFields.Propina = 0;
        finalFields.Regateo = 0;
      }
    }

    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.map(item =>
        item.id === itemId ? { ...item, ...finalFields } : item
      );
      return { ...prevData, [dataKey]: updatedList };
    });

    // Sincronizamos y retornamos resultado
    return await syncToRemote('UPDATE', dataKey, { id: itemId, ...finalFields });
  };

  // Función para obtener vehículos de un cliente específico
  const getVehiculosByCliente = (clienteNombre) => {
    const vehicles = data.vehiculos || [];
    return vehicles.filter(v => {
      const clientRef = v.Cliente || v.ID_Cliente || v['Cliente(REF)'] || v['ID Cliente'];
      return clientRef?.toLowerCase() === clienteNombre?.toLowerCase();
    });
  };

  // Función para obtener órdenes de un cliente o vehículo
  const getOrdenesByCliente = (clienteNombre) => {
    const orders = data.orders || [];
    return orders.filter(o =>
      o.Cliente?.toLowerCase() === clienteNombre?.toLowerCase()
    );
  };

  // Función para obtener órdenes por vehículo
  const getOrdenesByVehiculo = (matricula) => {
    const orders = data.orders || [];
    const safeMatricula = String(matricula || '').toLowerCase();
    if (!safeMatricula) return [];
    return orders.filter(o =>
      String(o.Matricula || '').toLowerCase() === safeMatricula
    );
  };

  // Función para obtener citas de un cliente
  const getCitasByCliente = (clienteNombre) => {
    const citas = data.citas || [];
    return citas.filter(c =>
      c.Cliente?.toLowerCase() === clienteNombre?.toLowerCase()
    );
  };

  // Función para calcular el Índice de Cliente (Reputación)
  const getClientReputation = (clienteNombre) => {
    const invoices = data.invoices || [];
    const clientInvoices = invoices.filter(inv =>
      inv.Cliente?.toLowerCase() === clienteNombre?.toLowerCase() &&
      (inv.Estado?.toLowerCase().includes('pagada') || inv.Estado?.toLowerCase().includes('pagado'))
    );

    let totalPropinas = 0;
    let totalRegateos = 0;
    let puntos = 100; // Empezamos con una base de 100 puntos (reputación neutra/buena)

    clientInvoices.forEach(inv => {
      const propina = parseFloat(inv.Propina || 0);
      const regateo = parseFloat(inv.Regateo || 0);

      totalPropinas += propina;
      totalRegateos += regateo;

      // +1 punto por cada 100 pesos de propina
      puntos += (propina / 100);
      // -1 punto por cada 100 pesos de regateo
      puntos -= (regateo / 100);
    });

    // Calcular estrellas (1-5) basadas en puntos
    // 100 puntos = 3 estrellas (base)
    // > 120 = 4 estrellas
    // > 150 = 5 estrellas
    // < 80 = 2 estrellas
    // < 50 = 1 estrella
    let estrellas = 3;
    if (puntos >= 150) estrellas = 5;
    else if (puntos >= 120) estrellas = 4;
    else if (puntos >= 90) estrellas = 3;
    else if (puntos >= 70) estrellas = 2;
    else estrellas = 1;

    return {
      puntos: Math.round(puntos),
      estrellas,
      totalPropinas,
      totalRegateos,
      visitas: clientInvoices.length,
      frecuenciaRegateo: clientInvoices.filter(inv => parseFloat(inv.Regateo || 0) > 0).length
    };
  };

  return (
    <DataContext.Provider value={{
      ...data,
      loading,
      syncing,
      deleteItem,
      deleteItemByField,
      addItem,
      addItems,
      updateItem,
      getVehiculosByCliente,
      getOrdenesByCliente,
      getOrdenesByVehiculo,
      getCitasByCliente,
      getClientReputation,
      refreshData: loadAllData,
      refreshing,
      settings,
      updateSettings
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
