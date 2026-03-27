export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '$0.00';
    
    // Remove formatting if it's already formatted
    const stringValue = String(value).replace(/[^0-9.-]+/g,"");
    const numericValue = parseFloat(stringValue);
    
    if (isNaN(numericValue)) return '$0.00';
    
    return numericValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD', // Adjust to local currency if needed (e.g., DOP for Dominican Peso)
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const parseCurrency = (formattedValue) => {
    if (!formattedValue) return '0';
    // Mantiene solo números, punto decimal y guión para negativo
    return String(formattedValue).replace(/[^0-9.-]+/g, "");
};
