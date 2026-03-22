const url = 'https://script.google.com/macros/s/AKfycbx2JqRcSa5IV5Hh_hphUNumFeNzfXooiVDqmF1K9zlrp8cNfqLz7EEPpK8PP92BH3Mg/exec';

async function testDelete() {
    const payload = {
        action: "DELETE",
        sheet: "buscar vehiculos",
        data: {
            id: "MARC0075" // Volvo
        }
    };

    console.log("🚀 TEST DELETE Volvo (URL 3Mg):", JSON.stringify(payload));
    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("📩 RESPUESTA:", text);
}

testDelete();
