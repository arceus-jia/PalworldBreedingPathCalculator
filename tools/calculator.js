const fs = require('fs');
const fastcsv = require('fast-csv');
const readline = require('readline');

function getInput(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve =>
        rl.question(query, ans => {
            rl.close();
            resolve(ans);
        })
    );
}

function readCsvFile(filePath) {
    return new Promise((resolve, reject) => {
        let stream = fs.createReadStream(filePath);
        let csvData = [];
        let csvStream = fastcsv
            .parse()
            .on('data', function (data) {
                csvData.push(data);
            })
            .on('end', function () {
                resolve(csvData);
            })
            .on('error', function (error) {
                reject(error);
            });

        stream.pipe(csvStream);
    });
}

function floydWarshall(vecsMap) {
    const dist = {};
    const keys = Object.keys(vecsMap);
    keys.map(key1 => {
        keys.map(key2 => {
            if (!dist[key1]) dist[key1] = {};
            if (!dist[key2]) dist[key2] = {};
            dist[key1][key2] = vecsMap[key1][key2] || Infinity;
        });
    });

    keys.forEach(k => {
        keys.forEach(i => {
            keys.forEach(j => {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            });
        });
    });
    return dist;
}

function safeSet(map, key1, key2, value) {
    if (!map[key1]) {
        map[key1] = {};
    }
    map[key1][key2] = value;
}

async function preprocess() {
    let data = await readCsvFile('sheet.csv');
    const idPalMap = {};
    const palIdMap = {};
    const parentParentMap = {};
    const sonParentMap = {};

    for (let i = 2; i < data[1].length; i++) {
        let idx = data[0][i];
        let pal = data[1][i];
        // console.log(idx,pal,idPalMap[idx])
        if (idPalMap[idx]) {
            idx = `${idx}b`;
        }
        idPalMap[idx] = pal;
        palIdMap[pal] = idx;
    }

    for (let i = 2; i < data.length; i++) {
        for (let j = 2; j < data[i].length; j++) {
            let pal1 = palIdMap[data[1][j]];
            let pal2 = palIdMap[data[i][1]];
            let palson = palIdMap[data[i][j]];

            safeSet(parentParentMap, pal1, pal2, palson);
            safeSet(parentParentMap, pal2, pal1, palson);
            safeSet(sonParentMap, palson, pal1, pal2);
            safeSet(sonParentMap, palson, pal2, pal1);
        }
    }
    fs.writeFileSync('parent_parent.json', JSON.stringify(parentParentMap));
    fs.writeFileSync('son_parent.json', JSON.stringify(sonParentMap));
    fs.writeFileSync('en.json', JSON.stringify(idPalMap));
    const vecsMap = {};
    for (let pal1 in parentParentMap) {
        for (let pal2 in parentParentMap[pal1]) {
            let palson = parentParentMap[pal1][pal2];
            safeSet(vecsMap, pal1, palson, 1);
            safeSet(vecsMap, pal2, palson, 1);
        }
    }
    fs.writeFileSync('vecs.json', JSON.stringify(vecsMap));
    let dist = floydWarshall(vecsMap);

    fs.writeFileSync('dist.json', JSON.stringify(dist));
}
// preprocess();

function cal(st, ed, distMap, vecsMap) {
    const paths = [];
    const path = [st];

    function dfs(cur, dis) {
        if (!distMap[st][ed]) return;
        if (cur == ed) {
            if (dis <= distMap[st][ed]) {
                if (path.length == 1) {
                    path.push(st);
                }
                paths.push([...path]);
            }
            return;
        }

        for (let next in vecsMap[cur]) {
            if (!vecsMap[cur][next]) continue;
            if (dis + vecsMap[cur][next] > distMap[st][ed]) continue; //vecsMap[x][y] = 1 , never trigger
            path.push(next);
            dfs(next, dis + vecsMap[cur][next]);
            path.pop();
        }
    }

    dfs(st, 0);
    return paths;
}

async function main() {
    const vecsMap = JSON.parse(fs.readFileSync('vecs.json'));
    const distMap = JSON.parse(fs.readFileSync('dist.json'));
    const sonParentMap = JSON.parse(fs.readFileSync('son_parent.json'));
    const idPalMap = JSON.parse(fs.readFileSync('id_pal.json'));

    const st = await getInput('input 1 parent id: ');
    const ed = await getInput('input son id: ');

    const paths = cal(st, ed, distMap, vecsMap);
    // console.log('paths..', paths);

    console.log('sonParent sequence is: \n');
    paths.map(path => {
        let str = '';
        for (let i = 0; i < path.length - 1; i++) {
            str += `step${i + 1}: ${idPalMap[path[i]]} + ${idPalMap[sonParentMap[path[i + 1]][path[i]]]} = ${idPalMap[path[i + 1]]}。   `;
        }
        console.log(str);
        console.log('\n');
    });
}

main();
