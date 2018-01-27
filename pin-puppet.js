const puppeteer = require('puppeteer');
var clear       = require('clear');


clear();

async function browse() {
  height = 1000
  width = 1600
  const browser = await puppeteer.launch({headless: false});
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
  await page.goto('https://www.pinterest.com/search/pins/?q=sarah%20charlesworth');
  await page.waitFor(1000);

  // var data = await page.evaluate(() => {
  //   let json = document.querySelector('#jsInit1') //('div.GrowthUnauthPin_brioPin')
  //   return json.innerHTML
  // })

  // json = json.outerHTML

  let images = []
  for (i = 1; i <= 100; i++){
    let sel = 'body > div.App.AppBase.Module > div.appContent > div.mainContainer > div > div > div > div > div:nth-child(2) > div > div > div > div:nth-child(' + i + ') > div > div.GrowthUnauthPinImage > a > img'
    let image = await page.evaluate((i, sel) => {
      let json = document.querySelector(sel) //('div.GrowthUnauthPin_brioPin')
      json = json.getAttribute('src').replace(/236x/, 'originals');
      return json
    }, i, sel)
    if (i % 20 == 0) {
      await page.hover(sel)
      await page.waitFor(1000)
    }
    console.log(image)
    images.push(image)
}

  // var image = await page.evaluate(() => {
  //   let json = document.querySelector('body > div.App.AppBase.Module > div.appContent > div.mainContainer > div > div > div > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div.GrowthUnauthPinImage > a > img') //('div.GrowthUnauthPin_brioPin')
  //   json = json.getAttribute('src')
  //   return json
  // })



  // json = JSON.parse(json)
  // console.log(image)
  // let results = json.resourceDataCache[0].data.results
  // let images = []
  // results.forEach ( (result) => {
  //   let image = result.images.orig.url
  //   images.push(image)
  // })
  // console.log(images)


  // First grid item for pins is 55
  // await page.click('body > div.App.AppBase.Module > div.appContent > div.mainContainer > div > div > div > div > div:nth-child(2) > div > div > div > div:nth-child(55)') //('div.GrowthUnauthPin_brioPin')
  // await page.screenshot({ path: 'dubuffet.png' });
  // await page.waitFor(1000);
  // await page.goto('https://www.pinterest.com/search/boards/?q=dubuffet');
  // await page.click('body > div.App.AppBase.Module > div.appContent > div.mainContainer > div > div > div > div > div:nth-child(2) > div > div > div > div:nth-child(56)') //('div.GrowthUnauthPin_brioPin')



  // browser.close();
}

browse();

// class="boardLinkWrapper"
