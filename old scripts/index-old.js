var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var json = require('./metObject-50k.json');

const jsonFilePath='metObjects.json'


var counter = 0

// json.forEach( (artwork, index, array) => {
//   artwork.imgSrc = getUrl(artwork["Link Resource"])
//   // console.log("processed ", index + 1, " of ", array.length)
//   // if (index == (array.length-1)) outputFile()
// })

processImages(json)
// let art1 = json[0]
// getUrl(art1)


async function processImages(json){
  for (const artwork of json){
      let text = await getUrlAsync(artwork)
  }
  console.log("Done!")
  outputFile()
}

function outputFile(){
    console.log('outputing file')
    fs.writeFileSync("metObjects-linked50k.json", JSON.stringify(json));
}

function getUrlAsync(artwork){
  return new Promise(function(resolve, reject) {
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
        if (counter == 1000) outputFile()
        resolve()
      }
      else {
        reject(Error("It broke"));
      }
    });
});
}

function getUrl(artwork){
  let link = artwork["Link Resource"]
  request(link, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      // console.log(html)
      var $ = cheerio.load(html)
      // console.log(html)
      var icon = $('.icon--download')
      // console.log(icon.parent().parent().html())
      var a = icon.parent()
      var href = a.attr('href')
      var parsed = href.replace("{{selectedOrDefaultDownload('","").replace("')}}","")
      artwork.imgSrc = parsed
      // var parsed  = href.match(/'[^'"]*'(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
      counter++
      process.stdout.write(`\r processed ${counter} of ${json.length} `);
 // console.log("processed ", counter, " of ", json.length)
      if (counter == json.length) outputFile()
      // console.log(artwork)
      return parsed
    }
  });

}


// request('https://www.metmuseum.org/art/collection/search/358737', function (error, response, html) {
//   if (!error && response.statusCode == 200) {
//     // console.log(html)
//     var $ = cheerio.load(html);
//     // console.log(html)
//     var icon = $('.icon--download')
//     console.log(icon.parent().parent().html())
//     var a = icon.parent();
//     var href = a.attr('href')
//     var parsed = href.replace("{{selectedOrDefaultDownload('","").replace("')}}","")
//     // var parsed  = href.match(/'[^'"]*'(?=(?:[^"]*"[^"]*")*[^"]*$)/g)
//     console.log(parsed);
//   }
// });
