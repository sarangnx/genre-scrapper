const puppeteer = require('puppeteer');
const mm = require('musicmetadata');
const fs = require('fs');
const path = require('path');

let input_directory  = path.resolve('..','songs','input');
let output_directory = path.resolve('..','songs','output');

async function scanDir(files){
    let metadata = [];
    for(let file of files){
        let song = path.join(input_directory,file);

        // for extracting metadata using mm
        let readable = fs.createReadStream(song);
        /**
         * extract title, artist from song file,
         * add it to metadata array.
         */
        let meta = await getMeta(readable,song,file);
        metadata.push(meta);
    }
    return metadata;
}

function getMeta(readable,song,file){
    return new Promise((resolve,reject)=>{
        mm(readable, (err, data) => {
            let element = {
                title: data.title,
                artist: data.artist.toString(),
                path: song,
                filename: file
            }
            resolve(element);
        });
    });
}

function search(query){

}

let files = fs.readdirSync(input_directory);

scanDir(files).then((list)=>{

    
    puppeteer.launch().then( (browser) => {
        // const page = await browser.newPage();
        list.forEach( (element) => {
            browser.newPage().then( (page) => {            
                let string = element.title + " " + element.artist + " genre";
                let qstring = encodeURIComponent(string);
    
                page.goto('https://www.google.com/search?q='+qstring).then( () => {
                    page.$eval('.Z0LcW',el => el.innerHTML).then( (genre) => {
                            console.log(element.title + " : " + genre);
                            page.close();
                    }).catch( ()=> {
                        console.log(`${element.title} : not single genre`);
                    }); 
                    
                    page.$$eval('.hFvVJe .TZNJBf .IAznY .title',
                        nodes => nodes.map(n => n.innerHTML) ).then( (genreArray) => {
                            console.log(genreArray);
                            page.close();
                        }).catch( () => {
                            console.log("Level 2 error");
                            page.close();
                        });       
                    }).catch( (err) => {
                        console.log(element.title + " : ERROR" );
                        page.close();
                    });

            }).catch( ()=> {
                console.log("Brower Error");
            });
        });
        // browser.close();
    }).catch((err) => {
        console.log("GOD DAMN..!!");
    });
    
})
