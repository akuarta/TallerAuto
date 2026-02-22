import React, { createContext, useState, useEffect, useContext } from 'react';
import completeData from '../../assets/app_data.json';

const DataContext = createContext({});

const parseSheet = (data) => {
  if (!data || data.length === 0) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map((row, index) => {
    const obj = { id: index.toString() };
    headers.forEach((header, i) => {
      obj[header.trim()] = row[i] || '';
    });
    return obj;
  });
};

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    try {
      setData({
        catalog: parseSheet(completeData['buscar vehiculos'] || completeData.vehiculos || []),
        garage: parseSheet(completeData.garage || []),
        services: parseSheet(completeData.servicios || []),
        clients: parseSheet(completeData.clientes || []),
        invoices: parseSheet(completeData.facturacion || completeData.facturas || []),
        orders: parseSheet(completeData.ordenes || []),
        entradas: parseSheet(completeData.entrada || []),
        facturando: parseSheet(completeData.facturando || []),
        fotosEntrada: parseSheet(completeData['fotos de cond/entrada'] || []),
        fotosSalidas: parseSheet(completeData['fotos de cond/salida'] || []),
        detalleFactura: parseSheet(completeData.detalles_factura || []),
        productos: parseSheet(completeData.productos || []),
        salidas: parseSheet(completeData.salidas || []),
        tecnicos: parseSheet(completeData.tecnicos || []),
        citas: parseSheet(completeData.citas || []),
        herramientas: parseSheet(completeData.herramientas || []),
        usuarios: parseSheet(completeData.usuarios || []),
      });
      setLoading(false);
    } catch (error) {
      console.error("Error loading complete data:", error);
      setLoading(false);
    }
  };

  // Función para eliminar un registro
  const deleteItem = (dataKey, itemId) => {
    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.filter(item => item.id !== itemId);
      return { ...prevData, [dataKey]: updatedList };
    });
  };

  // Función para eliminar un registro por un campo específico (como ID_Marca, ID_Modelo, etc.)
  const deleteItemByField = (dataKey, field, value) => {
    setData(prevData => {
      const list = prevData[dataKey] || [];
      const updatedList = list.filter(item => item[field] !== value);
      return { ...prevData, [dataKey]: updatedList };
    });
  };

  // Función para agregar un nuevo registro
  const addItem = (dataKey, newItem) => {
    setData(prevData => {
      const list = prevData[dataKey] || [];
      // Generar un nuevo ID basado en el índice
      const newId = (list.length + 1).toString();
      const itemWithId = { ...newItem, id: newId };
      return { ...prevData, [dataKey]: [...list, itemWithId] };
    });
  };

  return (
    <DataContext.Provider value={{ ...data, loading, deleteItem, deleteItemByField, addItem }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
