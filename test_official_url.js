const url = 'https://script.google.com/macros/s/AKfycby4AD7hddeuRU7vcYnIPT7R2TuZvTPjte3IWjoMKhHZ1ZIW-plf6JjQB-_oqLRtQnoD/exec';

async function testNuevaURL() {
    // Probamos borrar el registro Isuzu NPR (MARC0032, MOD1009) que está en la Col C/D
    const payload = {
        action: "DELETE",
        sheet: "buscar vehiculos",
        data: {
            "id": "MOD1009", // El ID del modelo
            "ID_Marca": "MARC0032",
            "Marca": "Isuzu",
            "ID_Modelo": "MOD1009",
            "Modelo": "NPR"
        }
    };

    console.log("🚀 PROBANDO NUEVA IMPLEMENTACIÓN (Buscando MOD1009 en cualquier columna):");
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("📩 RESPUESTA:", text);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
}

testNuevaURL();
