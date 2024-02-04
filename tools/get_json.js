const fs = require('fs');
en = JSON.parse(fs.readFileSync('en.json'));
zh = JSON.parse(fs.readFileSync('zh.json'));
const idPalMap = {};
const palIdMap = {};
for (let key in en) {    
    let name = `${zh[key]}(${en[key]})`
    idPalMap[key] = name;
    palIdMap[name] = key
}
fs.writeFileSync('id_pal.json', JSON.stringify(idPalMap));
fs.writeFileSync('pal_id.json', JSON.stringify(palIdMap));

