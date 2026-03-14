const fetch = require('node-fetch');

async function checkKeys() {
    const url = 'https://script.google.com/macros/s/AKfycbytGOI1XvAa9_heCHBHHQTnIr7Tmy3aoFC-CTpLCQ3e3v8XFg4XrM20o31RUij4SGvZ/exec';
    const response = await fetch(url);
    const data = await response.json();
    console.log('Keys in API response:');
    Object.keys(data).forEach(key => {
        console.log(`- "${key}": ${Array.isArray(data[key]) ? data[key].length : 'not an array'} items`);
        if (data[key].length > 0 && Array.isArray(data[key])) {
            console.log('  Example:', JSON.stringify(data[key][0]).substring(0, 100));
        }
    });
}

checkKeys();
