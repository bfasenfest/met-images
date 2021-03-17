var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var axios = require('axios'); 
var _ = require('lodash');
var now = require("performance-now")

var json = require('./metObject.json');

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 10
var counter = 0

var max = json.length || 2000
var t0 = now(), t1 = 0

const outDir = './rembrandt/'
const saveJson = false
const saveImages = true
const term = 'Artist: Rembrandt'
const limit = 1000

// objects = json.filter(artwork => {
//   regexp = new RegExp('\\b' + term , 'i') // /\btile/i  aka /\b (term) /i

//   let result = false
//   // if (artwork["Artist Display Name"]) result = regexp.test(artwork["Artist Display Name"]) // artwork["Title"].includes(term)

//   if (artwork["Title"]) result = regexp.test(artwork["Title"]) // artwork["Title"].includes(term)
//   if (result) return result
//   if (artwork["Object Name"]) result = regexp.test(artwork["Object Name"]) // artwork["Object Name"].includes("term")
//   return result
// })

var total = 1

axios.get("https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=" + term)
.then(function (response) {
  // handle success
  // console.log(response);
  // console.log(response.data)
  console.log("Total Images: ", response.data.total)
  total = response.data.total
  let objects = response.data.objectIDs

  if(saveImages){
    if (!fs.existsSync(outDir)){
      fs.mkdirSync(outDir);
    }
    objects.forEach( (artwork, index, array) => {
      if(index < limit) _.delay(processImage, index*50, artwork, outDir)

    })
  }
})
.catch(function (error) {
  // handle error
  console.log(error);
})
.then(function () {

  // always executed
});







function saveImage(artwork, folder){
  let link = artwork.primaryImage
  let name = artwork.title || artwork.objectName
  let id = artwork.objectID
  name = name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
  if (name.length > 40) name = name.slice(0,40)

  let stream = fs.createWriteStream(folder + name + "_" + id + '.png')

  if (link) {
    request(link).on('error', function(err) {
      console.log(err)
    })
    .pipe(stream);
  }
  stream.on('finish', () => {
    counter++
    finishImage(folder)
    if (counter == total) console.log("... complete")
  })

}

function processImage(artworkID, folder = './') {
  if (itemsBeingProcessed > maxItems) {
    fileQueue.push(artworkID);
    return;
  }
  
  axios.get("https://collectionapi.metmuseum.org/public/collection/v1/objects/" + artworkID)
  .then(function (response) {
    itemsBeingProcessed += 1;
    saveImage(response.data, folder)
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  })
  .then(function () {
  });

 
}

function finishImage(folder) {
  itemsBeingProcessed -= 1;
  process.stdout.write(`\rprocessed ${counter} of ${total} `);
  if (itemsBeingProcessed <= maxItems && fileQueue.length > 0) {
    processImage(fileQueue.shift(), folder);
  }
}

function HTMLtoLink(html){
  var $ = cheerio.load(html)
  var icon = $('.download__text')
  var a = icon.parent()
  var href = a.attr('href')
  var parsed = href ? href.replace("{{selectedOrDefaultDownload('","").replace("')}}","") : ""
  return parsed
}