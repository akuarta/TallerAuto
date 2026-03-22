const url = 'https://script.google.com/macros/s/AKfycbytGOI1XvAa9_heCHBHHQTnIr7Tmy3aoFC-CTpLCQ3e3v8XFg4XrM20o31RUij4SGvZ/exec';

async function inspect() {
    const res = await fetch(url);
    const data = await res.json();
    const result = {};
    for (let sheet in data) {
        if (Array.isArray(data[sheet]) && data[sheet].length > 0) {
            result[sheet] = {
                count: data[sheet].length,
                headers: Object.keys(data[sheet][0]),
                firstRow: data[sheet][0]
            };
        } else {
            result[sheet] = "empty or not array";
        }
    }
    console.log(JSON.stringify(result, null, 2));
}

inspect();
