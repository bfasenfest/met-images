var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var now = require("performance-now")

var json = require('./jsons/metObject-50k.json');

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 30
var counter = 0

var outputName = "metObjects-linked200.json"
var max = 2000

var t0 = now(), t1 = 0

json.forEach( (artwork, index, array) => {
  processUrl(artwork)
})

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
      var parsed = href.replace("{{selectedOrDefaultDownload('","").replace("')}}","")
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
  console.log('...Outputing file...')
  t1 = now()
  let secs = ((t1-t0)/1000).toFixed(1)
  console.log("Output took " + secs + " seconds ( " + secs/60 + " minutes)")
  fs.writeFileSync(outputName, JSON.stringify(json));
}