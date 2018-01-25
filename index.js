var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var now = require("performance-now")

var json = require('./metObjects.json');

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 10
var counter = 0

var outputName = "tiles2.json"
var max = json.length || 2000
const exportFile = true

var t0 = now(), t1 = 0

tiles = json.filter(artwork => {
  if (artwork["Object Name"]) return artwork["Object Name"].includes("Tile")
  else return false
})

tiles.forEach( (artwork, index, array) => {
  processUrl(artwork)
})

// counter = 0

// tiles.forEach( (artwork, index, array) => {
//   processImage(artwork, './images/')

//   process.stdout.write(` \r processed ${counter} of ${array.length} `);

// })


// tiles.forEach( (artwork, index, array) => {
//   // processUrl(artwork)
//   if (artwork["Object Name"] == "Tile"){
//     processImage(artwork, './images/')
//   }

//   process.stdout.write(` \r processed ${counter} of ${index} `);

// })

// json.forEach( (artwork, index, array) => {
//   processUrl(artwork)
// })


function processUrl(artwork) {
  if (itemsBeingProcessed > maxItems) {
    fileQueue.push(artwork);
    return;
  }

  itemsBeingProcessed += 1;

  let link = artwork["Link Resource"]
  request(link, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(html)
      var icon = $('.icon--download')
      var a = icon.parent()
      var href = a.attr('href')
      var parsed = href ? href.replace("{{selectedOrDefaultDownload('","").replace("')}}","") : ""
      artwork.imgSrc = parsed
      counter++
      process.stdout.write(` \r processed ${counter} of ${json.length} `);
      if (counter == max || counter == json.length) {
        outputFile()
      }
      finishUrl()
    }
    else {
      reject(Error("It broke"));
      finishUrl()
    }
  });

    function finishUrl() {
      itemsBeingProcessed -= 1;
      if (itemsBeingProcessed <= maxItems && fileQueue.length > 1) {
        processUrl(fileQueue.shift());
      }
    }
}

function outputFile(){
  if (!exportFile) return
  console.log('...Outputing file...')
  t1 = now()
  let secs = ((t1-t0)/1000).toFixed(1)
  console.log("Output took " + secs + " seconds ( " + secs/60 + " minutes)")
  fs.writeFileSync(outputName, JSON.stringify(json)); // json.splice(0,counter))
  linksFound = true;
}

function saveImage(artwork, folder){
  let link = artwork["imgSrc"]
  let name = artwork["Title"]
  let id = artwork["Object ID"]
  request(link).pipe(fs.createWriteStream(folder + name + "_" + id + '.png'));
  counter++
  finishImage()
}

function processImage(artwork, folder = './') {
  if (itemsBeingProcessed > maxItems) {
    fileQueue.push(artwork);
    return;
  }
  let page = artwork["Link Resource"]

  itemsBeingProcessed += 1;

  if(!artwork.imgSrc){
    request(page, function (error, response, html) {
      if (!error && response.statusCode == 200) {
        artwork.imgSrc = HTMLtoLink(html)
        saveImage(artwork, folder)
      }
      else {
        reject(Error("It broke"));
        artwork.imgSrc = ''
        saveImage(artwork, folder)
      }
    })
  }
  else{
    saveImage(artwork, folder)
  }

  // console.log(artwork.imgSrc)



  // saveImage(artwork, folder)

}

function finishImage() {
  itemsBeingProcessed -= 1;
  if (itemsBeingProcessed <= maxItems && fileQueue.length > 1) {
    processUrl(fileQueue.shift());
  }
}

function HTMLtoLink(html){
  var $ = cheerio.load(html)
  var icon = $('.icon--download')
  var a = icon.parent()
  var href = a.attr('href')
  var parsed = href ? href.replace("{{selectedOrDefaultDownload('","").replace("')}}","") : ""
  return parsed
}