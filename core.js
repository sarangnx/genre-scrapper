const puppeteer = require('puppeteer');

let string = 'eminem beautiful genre';
let qstring = encodeURIComponent(string);

puppeteer.launch().then(async (browser) => {
    const page = await browser.newPage();
    await page.goto('https://www.google.com/search?q='+qstring);
    // console.log(await page.content());
    let con = await page.$eval('.Z0LcW',el => el.innerHTML );
    console.log(con);
    await browser.close();
}).catch((err) => {
    console.log("GOD DAMN..!!");
});


// Z0LcW
// page.$(selector)
// page.content()
// page.goto(url[, options])