var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var now = require("performance-now")
var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 40
var counter = 0
var responses = {}
const exportFile = true

var t0 = now(), t1 = 0

clear();
console.log(
  chalk.red(
    figlet.textSync('Pinterest Downloader', { horizontalLayout: 'default' })
  )
);

getTopic()

function getTopic(callback) {
  var questions = [
    {
      name: 'topics',
      type: 'input',
      default: 'dubuffet',
      message: 'Enter topics seperated by commas',
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter a topic';
        }
      }
    },
  ];

  inquirer.prompt(questions).then(getLocation)
}

function getLocation(answers){
  responses.topics = answers.topics.split(',')

  var questions = [
    {
      name: 'location',
      type: 'input',
      message: 'Enter location to save',
      default: './' + responses.topics[0],
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter a location';
        }
      }
    },
    {
      message: "Create folders for each topic?",
      type: "confirm",
      name: "useFolders",
      default: true
    }
  ];

  inquirer.prompt(questions).then(function(){
    responses = {...responses, ...arguments[0]} // responses.location = arguments[0].location
    console.log(responses)
    initDownload()
  })
}

function initDownload(){
  console.log('here')
  let topics = [];
  responses.topics.forEach( (name) => {
    let topic = {}
    topic.name = name.replace(/^\s+|\s+$/g,"")
    topic.page = "https://www.pinterest.com/search/pins/?q=" + topic.name
    topic.location = responses.location
    if (responses.useFolders && responses.topics.length > 1) topic.location += '/' + topic.name
    if (topic.name !== '') topics.push(topic)
  })
  console.log(topics)
  topics.forEach( (topic) => {

  request(topic.page, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      let matches = []
      var $ = cheerio.load(html)
      let json = JSON.parse($('#jsInit1').html())
      let results = json.resourceDataCache[0].data.results
      let images = []
      results.forEach ( (result) => {
        let image = result.images.orig.url
        images.push(image)
      })
      console.log(images)
      // fs.writeFileSync("pin-data2.json", JSON.stringify(json));

      // let results = json.resourceDataCache.data.results
      // console.log(results)

      console.log('done')

      // imgs = $('img')
      // let images = []
      // $(imgs).each( (i, image) => {
      //   images.push($(image).attr('srcset'))
      // })
      
      // console.log(images)
      // images.forEach( (image) => {
      //   let match = image.match(/[^>]*\bhttps[^"]*originals.*?.jpg/)
      //   if (match) matches.push(match)
      // })
      // console.log(matches)
      //console.log(matches)
      // var $ = cheerio.load(html)
      // var icon = $('.icon--download')
      // var a = icon.parent()
      // var href = a.attr('href')
      // var parsed = href ? href.replace("{{selectedOrDefaultDownload('","").replace("')}}","") : ""
    }
    else {

    }
  })

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

function saveImage(artwork, folder){
  let link = artwork.imgSrc
  let name = artwork.title
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



