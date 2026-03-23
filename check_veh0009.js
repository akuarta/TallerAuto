const fs = require('fs');

const data = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));

const veh0009 = data.VEHICULOS.find(v => v.ID_Vehiculo === 'VEH0009');

console.log(JSON.stringify(veh0009, null, 2));
