const puppeteer = require('puppeteer');

async function browse() {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto('https://www.pinterest.com/search/boards/?q=dubuffet');
  await page.waitFor(1000);
  await page.click(body > div:nth-child(3) > div > div:nth-child(1) > div > div > div.appContent > div > div.SearchPage > div > div > div > div:nth-child(1) > div > div > div > div > a)
  await page.screenshot({ path: 'screenshots/dubuffet.png' });

  browser.close();
}

browse();

// class="boardLinkWrapper"
