import React, { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext({});

const API_URL = "https://script.google.com/macros/s/AKfycbx2JqRcSa5IV5Hh_hphUNumFeNzfXooiVDqmF1K9zlrp8cNfqLz7EEPpK8PP92BH3Mg/exec";

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    catalog: [],
    garage: [],
    services: [],
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
    vehiculos: [], // Añadido explícitamente
    rescates: [],
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();

      // Función para normalizar objetos (ID -> id, y asegurar que id sea string)
      const normalize = (arr) => (arr || []).map(item => {
        // Encontrar cualquier variante de ID
        const idKey = Object.keys(item).find(k =>
          k.toLowerCase().trim() === 'id' ||
          k.toLowerCase().includes('id ') ||
          k.toLowerCase().includes('id_') ||
          k.toLowerCase() === 'idvehiculo' ||
          k.toLowerCase() === 'idcliente' ||
          k.toLowerCase() === 'idtecnico' ||
          k.toLowerCase() === 'idservicio' ||
          k.toLowerCase() === 'idproducto'
        );
        const id = item[idKey] || item.id || item.ID || item.Id || Math.random().toString(36).substr(2, 9);

        // Crear copia normalizada para uso interno pero manteniendo claves originales
        const normalizedItem = { ...item, id: String(id) };

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
        catalog: normalize(result['buscar vehiculos']),
        garage: normalize(result.GARAGE || result.garage),
        services: normalize(result.Servicios || result.servicios),
        clients: normalize(result.CLIENTES || result.clientes),
        invoices: normalize(result.Facturacion || result.facturacion),
        orders: normalize(result.ORDENES || result.ordenes),
        entradas: normalize(result.ENTRADA || result.entrada),
        facturando: normalize(result.facturando),
        fotosEntrada: normalize(result['Fotos de Cond/entrada']),
        fotosSalidas: normalize(result['Fotos de Cond/salida']),
        detalleFactura: normalize(result.DETALLES_FACTURA),
        productos: normalize(result.Productos),
        salidas: normalize(result.salidas),
        tecnicos: normalize(result.TECNICOS),
        citas: normalize(result.Citas || result.citas),
        herramientas: normalize(result.Herramientas),
        usuarios: normalize(result.USUARIOS),
        vehiculos: normalize(result.VEHICULOS),
        rescates: normalize(result.RESCATES || result.rescates),
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading remote data:", error);
      setLoading(false);
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
        data: actionUpper === 'ADD' ? (() => {
          const cleanData = { ...payload };
          const businessIdField = Object.keys(cleanData).find(k =>
            k.toLowerCase().startsWith('id_') ||
            k.toLowerCase() === 'idcita' ||
            k.toLowerCase() === 'id_cita'
          );
          if (businessIdField && cleanData.id) {
            delete cleanData.id;
          }
          return cleanData;
        })() : payload
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
    // Primero actualizamos localmente
    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.filter(item => item.id !== itemId);
      return { ...prevData, [dataKey]: updatedList };
    });

    // Luego sincronizamos y retornamos resultado
    return await syncToRemote('delete', dataKey, { id: itemId });
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

    if (!itemToSync.id) {
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
    return orders.filter(o =>
      (o.Matricula || '').toLowerCase() === matricula?.toLowerCase()
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
      updateItem,
      getVehiculosByCliente,
      getOrdenesByCliente,
      getOrdenesByVehiculo,
      getCitasByCliente,
      getClientReputation
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
