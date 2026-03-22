const url = 'https://script.google.com/macros/s/AKfycbytGOI1XvAa9_heCHBHHQTnIr7Tmy3aoFC-CTpLCQ3e3v8XFg4XrM20o31RUij4SGvZ/exec';

async function testDelete() {
    // Probando con un ID que SABEMOS que existe (Volvo MARC0075)
    const payload = {
        action: "DELETE",
        sheet: "buscar vehiculos",
        data: {
            id: "MARC0075"
        }
    };

    console.log("🚀 TEST DELETE Volvo:", JSON.stringify(payload));
    const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("📩 RESPUESTA:", text);
}

testDelete();
