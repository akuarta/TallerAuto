const url = 'https://script.google.com/macros/s/AKfycbx2JqRcSa5IV5Hh_hphUNumFeNzfXooiVDqmF1K9zlrp8cNfqLz7EEPpK8PP92BH3Mg/exec';

async function testFinal() {
    // Simulando EXACTAMENTE lo que envía la App ahora (Formato ADD pero con DELETE)
    // Usamos el ID de Isuzu NPR que vimos en la inspección: MARC0032 y MOD1009
    const payload = {
        action: "DELETE",
        sheet: "buscar vehiculos",
        dataKey: "catalog",
        data: {
            "ID_Marca": "MARC0032",
            "Marca": "Isuzu",
            "ID_Modelo": "MOD1009",
            "Modelo": "NPR",
            "Slug_Modelo": "Npr"
        }
    };

    console.log("🚀 PROBANDO DELETE UNIFICADO (Payload idéntico a ADD):");
    console.log(JSON.stringify(payload, null, 2));
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const text = await res.text();
        console.log("📩 RESPUESTA SERVIDOR:", text);
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
}

testFinal();
