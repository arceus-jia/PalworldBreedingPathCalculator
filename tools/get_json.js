const fs = require('fs');
en = JSON.parse(fs.readFileSync('en.json'));
zh = JSON.parse(fs.readFileSync('zh.json'));
let idPalMap = {};
let palIdMap = {};
for (let key in en) {
    let name = `${zh[key]}(${en[key]})`;
    idPalMap[key] = name;
    palIdMap[name] = key;
}

function sort(map) {
    const map2 = new Map(Object.entries(map));
    const array = Array.from(map2).sort((a, b) => {
        const matchA = a[0].match(/^(\d+)([a-z]?)$/);
        const matchB = b[0].match(/^(\d+)([a-z]?)$/);

        const numA = parseInt(matchA[1], 10);
        const numB = parseInt(matchB[1], 10);
        if (numA !== numB) {
            return numA - numB;
        }
        if (matchA[2] && matchB[2]) {
            return matchA[2].localeCompare(matchB[2]);
        }
        return matchA[2] ? 1 : -1;
    });
    return Object.fromEntries(array)
}
idPalMap = sort(idPalMap)

fs.writeFileSync('zh.json',JSON.stringify(sort(zh)))
fs.writeFileSync('id_pal.json', JSON.stringify(sort(idPalMap)));

fs.writeFileSync('pal_id.json', JSON.stringify(palIdMap));
