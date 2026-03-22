const url = 'https://script.google.com/macros/s/AKfycbx2JqRcSa5IV5Hh_hphUNumFeNzfXooiVDqmF1K9zlrp8cNfqLz7EEPpK8PP92BH3Mg/exec';

async function testFinalV3() {
    // EL REGISTRO QUE EXISTE EN LA HOJA (MARC0032 Isuzu NPR)
    const payload = {
        action: "DELETE",
        sheet: "buscar vehiculos",
        data: {
            "id": "MARC0032", // CAMPO OBLIGATORIO PARA EL SCRIPT
            "ID_Marca": "MARC0032",
            "Marca": "Isuzu",
            "ID_Modelo": "MOD1009",
            "Modelo": "NPR",
            "Slug_Modelo": "Npr"
        }
    };

    console.log("🚀 PRUEVA V3: Con campo 'id' asignado...");
    
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

testFinalV3();
