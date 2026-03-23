const https = require('https');

const API_URL = "https://script.google.com/macros/s/AKfycbz2y8bdW3AoJFBt3XHZf3APMwXa8grTUWfMxiq-1DXMU6qvywSt11tbyaMfRuQTkKuw/exec";

async function fixVeh0009() {
    const payload = {
        action: 'UPDATE',
        sheet: 'VEHICULOS',
        dataKey: 'vehiculos',
        data: {
            id: 'VEH0009',
            ID_Vehiculo: 'VEH0009',
            Manual_Tecnico_Path: 'Toyota/1994/Corolla Sedan L4-96.8 1587cc 1.6L DOHC (4A-FE)',
            Modelo: 'Toyota Corolla (Corolla Sedan L4-1587cc 1.6L DOHC (4A-FE)) 1994'
        }
    };

    const data = JSON.stringify(payload);
    const url = new URL(API_URL);

    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log('Arreglando VEH0009...');

    const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Respuesta:', body.substring(0, 100));
        });
    });

    req.on('error', (e) => console.error('Error:', e.message));
    req.write(data);
    req.end();
}

fixVeh0009();
