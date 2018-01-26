var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var now = require("performance-now")

var json = require('./metObjects-linked.json');

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 30
var counter = 0

var max = json.length || 2000
var t0 = now(), t1 = 0

const outDir = './quilts/'
const saveJson = false
const saveImages = true

objects = json.filter(artwork => {
  let term = 'quilt'
  regexp = new RegExp('\\b' + term , 'i') // /\btile/i  aka /\b (term) /i

  let result = false
  // if (artwork["Artist Display Name"]) result = regexp.test(artwork["Artist Display Name"]) // artwork["Title"].includes(term)

  if (artwork["Title"]) result = regexp.test(artwork["Title"]) // artwork["Title"].includes(term)
  if (result) return result
  if (artwork["Object Name"]) result = regexp.test(artwork["Object Name"]) // artwork["Object Name"].includes("term")
  return result
})

var length = objects.length
console.log("Total Images: ", length)

if (!fs.existsSync(outDir)){
  fs.mkdirSync(outDir);
}

if(saveImages){
  objects.forEach( (artwork, index, array) => {
    processImage(artwork, outDir )
  })
}


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
      if (counter == max || counter == tiles.length) {
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
  console.log('...Outputing file...')
  t1 = now()
  let secs = ((t1-t0)/1000).toFixed(1)
  console.log("Output took " + secs + " seconds ( " + secs/60 + " minutes)")
  fs.writeFileSync(outputName, JSON.stringify(json)); // json.splice(0,counter))
  linksFound = true;
}

function saveImage(artwork, folder){
  let link = artwork["imgSrc"]
  let name = artwork["Title"] || artwork["Object Name"]
  let id = artwork["Object ID"]
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
    if (counter == length) console.log("... complete")
  })

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
}

function finishImage(folder) {
  itemsBeingProcessed -= 1;
  process.stdout.write(`\rprocessed ${counter} of ${length} `);
  if (itemsBeingProcessed <= maxItems && fileQueue.length > 0) {
    processImage(fileQueue.shift(), folder);
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