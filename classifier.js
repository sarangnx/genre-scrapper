// const puppeteer = require('puppeteer');
const mm = require('musicmetadata');
const fs = require('fs');
const path = require('path');

let input_directory  = path.resolve('..','songs','input');
let output_directory = path.resolve('..','songs','output');

/**
 * @var metadata contains array of objects
 * [ { title, artist, path, filename } ]
 */
let metadata = [];

/**
 * List songs in input_directory
 * -- Input directory must contain files only.
 *    NO DIRECTORIES
 */

fs.readdir(input_directory,(err, files) => {
    for(let file of files){
        let song = path.join(input_directory,file); 

        // for extracting metadata using mm
        let readable = fs.createReadStream(song);
        /**
         * extract title, artist from song file,
         * add it to metadata array.
         */
        mm(readable, (err, data) => {
            let element = {
                title: data.title,
                artist: data.artist.toString(),
                path: song,
                filename: file
            }
            metadata.push(element);
        });
    }
});

// let string = 'eminem beautiful genre';
// let qstring = encodeURIComponent(string);

// puppeteer.launch().then(async (browser) => {
//     const page = await browser.newPage();
//     await page.goto('https://www.google.com/search?q='+qstring);
//     // console.log(await page.content());
//     let con = await page.$eval('.Z0LcW',el => el.innerHTML );
//     console.log(con);
//     await browser.close();
// }).catch((err) => {
//     console.log("GOD DAMN..!!");
// });


// page.$(selector)
// page.content()
// page.goto(url[, options])




/**
 * [ single genre ]
 * - Z0LcW
 * [ multiple genres ]
 *  
 * - rl_container
 *    - TZNJBf
 *        - IAznY
 *            - title
 */

