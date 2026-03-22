const url = 'https://script.google.com/macros/s/AKfycbytGOI1XvAa9_heCHBHHQTnIr7Tmy3aoFC-CTpLCQ3e3v8XFg4XrM20o31RUij4SGvZ/exec';

async function search() {
    const res = await fetch(url);
    const data = await res.json();
    const catalog = data['buscar vehiculos'] || [];
    console.log("CATALOG CONTENT:");
    console.log(JSON.stringify(catalog, null, 2));
}

search();
