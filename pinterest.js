var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var now = require("performance-now")
var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
const puppeteer = require('puppeteer');
var Spinner     = CLI.Spinner;

var itemsBeingProcessed = 0;
var fileQueue = [];
var maxItems = 40
var counter = 0
var responses = {}
const exportFile = true
var length = 10


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
      default: './' + responses.topics[0] + '/',
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
    },
    {
      name: 'maxResponses',
      type: 'input',
      message: 'How many images do you want to download?',
      default: '10',
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter a number';
        }
      }
    },
  ];

  inquirer.prompt(questions).then(function(){
    responses = {...responses, ...arguments[0]} // responses.location = arguments[0].location
    console.log(responses)
    initDownload()
  })
}

function initDownload(){
  let topics = [];
  responses.topics.forEach( (name) => {
    let topic = {}
    topic.name = name.replace(/^\s+|\s+$/g,"")
    topic.page = "https://www.pinterest.com/search/pins/?q=" + topic.name
    topic.location = responses.location
    if (responses.useFolders && responses.topics.length > 1) topic.location += '/' + topic.name + '/'
    if (topic.name !== '') topics.push(topic)
    if (!fs.existsSync(topic.location)){
      fs.mkdirSync(topic.location);
    }
  })
  console.log("Getting Topics!")
  topics.forEach( (topic) => {
    browse(topic);

  })

}

async function browse(topic) {
  height = 1000
  width = 1600
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setViewport({width, height})

  const {targetInfos: [{targetId}]} = await browser._connection.send(
    'Target.getTargets'
  );
  
  // Tab window. 
  const {windowId} = await browser._connection.send(
    'Browser.getWindowForTarget',
    {targetId}
  );


  await browser._connection.send('Browser.setWindowBounds', {
    bounds: {height, width},
    windowId
  })

  let topicUrl = encodeURIComponent(topic.name)
  await page.goto(topic.page) // ('https://www.pinterest.com/search/pins/?q=' + topicUrl);
  await page.waitFor(1000);

  let artworks = []
  for (i = 1; i <= 10; i++){
    let sel = 'body > div.App.AppBase.Module > div.appContent > div.mainContainer > div > div > div > div > div:nth-child(2) > div > div > div > div:nth-child(' + i + ') > div > div.GrowthUnauthPinImage > a > img'
    let artwork = await page.evaluate((i, sel) => {
      let data = {}
      let item = document.querySelector(sel) //('div.GrowthUnauthPin_brioPin')
      data.imgSrc = item.getAttribute('src').replace(/236x/, 'originals');
      data.title = item.getAttribute('alt')
      return data
    }, i, sel)
    if (i % 20 == 0) {
      await page.hover(sel)
      await page.waitFor(1000)
    }
    console.log(artwork)
    processImage(artwork, topic.location)
    artworks.push(artwork)
}
  browser.close();

  return artworks
}

function processImage(artwork, folder = './') {
  console.log(folder)
  if (itemsBeingProcessed > maxItems) {
    fileQueue.push(artwork);
    return;
  }
  let page = artwork["Link Resource"]

  itemsBeingProcessed += 1;
  saveImage(artwork, folder)
}

function saveImage(artwork, folder){
  let link = artwork.imgSrc
  let name = artwork.title
  name = name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
  if (name.length > 40) name = name.slice(0,40)

  let stream = fs.createWriteStream(folder + name + '.jpg')

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


//old request code
// request(topic.page, function (error, response, html) {
//   if (!error && response.statusCode == 200) {
//     let matches = []
//     var $ = cheerio.load(html)
//     let json = JSON.parse($('#jsInit1').html())
//     let results = json.resourceDataCache[0].data.results
//     let images = []
//     results.forEach ( (result) => {
//       let image = result.images.orig.url
//       images.push(image)
//     })
//     console.log(images)
//     // fs.writeFileSync("pin-data2.json", JSON.stringify(json));

//     // let results = json.resourceDataCache.data.results
//     // console.log(results)

//     console.log('done')

//     // imgs = $('img')
//     // let images = []
//     // $(imgs).each( (i, image) => {
//     //   images.push($(image).attr('srcset'))
//     // })
    
//     // console.log(images)
//     // images.forEach( (image) => {
//     //   let match = image.match(/[^>]*\bhttps[^"]*originals.*?.jpg/)
//     //   if (match) matches.push(match)
//     // })
//     // console.log(matches)
//     //console.log(matches)
//     // var $ = cheerio.load(html)
//     // var icon = $('.icon--download')
//     // var a = icon.parent()
//     // var href = a.attr('href')
//     // var parsed = href ? href.replace("{{selectedOrDefaultDownload('","").replace("')}}","") : ""
//   }
//   else {

//   }
// })
