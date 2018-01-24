var converter = require('json-2-csv');
var fs = require('fs');
let csv = require('csvtojson')


const csvFilePath='MetObjects.csv'

var metObject = []
let counter = 1
let processed = 0
let max = 100

csv()
.fromFile(csvFilePath)
.on('json',(jsonObj)=>{
    // console.log(jsonObj)
    if(jsonObj['Is Public Domain'] == "True") {
        // Delete empty and non-meaningful keys
        Object.keys(jsonObj).forEach((key) => (jsonObj[key] == "") && delete jsonObj[key]);
        delete jsonObj['Is Highlight']
        delete jsonObj['Is Public Domain']
        delete jsonObj['Metadata Date']
        metObject.push(jsonObj)
        processed++
    }
    process.stdout.write(`\r processed ${processed} of ${counter} `);
    counter++

    if (processed == max) {
        fs.writeFileSync("metObject.json", JSON.stringify(metObject));
        break;
    }

})
.on('done',(error)=>{
    console.log('end')
    if (max < 0) fs.writeFileSync("metObject.json", JSON.stringify(metObject));
    console.log('wrote to file')
})



// converter.json2csv(documents, save);
//
//
// function save(err, file){
//     console.log('writing to file...');
//     fs.writeFileSync("test.csv", file);
// }



// var documents = [
//     {
//         Make: 'Nissan',
//         Model: 'Murano',
//         Year: '2013',
//         Specifications: {
//             Mileage: '7106',
//             Trim: 'S AWD'
//         }
//     },
//     {
//         Make: 'BMW',
//         Model: 'X5',
//         Year: '2014',
//         Specifications: {
//             Mileage: '3287',
//             Trim: 'M'
//         }
//     }
// ];
