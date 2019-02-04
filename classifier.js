const puppeteer = require('puppeteer');
const mm = require('musicmetadata');
const fs = require('fs');
const path = require('path');

let input_directory  = path.resolve('..','songs','input');
let output_directory = path.resolve('..','songs','output');

const INFO = "\u001B[1;36m [ INFO ] \u001B[0;0m";
const ERR  = "\u001B[1;31m [ ERROR ] \u001B[0;0m";

/**
 * Function to extract data from all the files in the input directory
 * @param {Array} files - List of Files in input_directory.
 * @param {String} input_directory - Path to input directory.
 */
async function scanDir(files,input_directory){
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

/**
 * Get Metadata of songs using 'musicmetadata' library.
 * @param {stream} readable - Read Stream to song file.
 * @param {string} song - Full path of the song file.
 * @param {string} file - Filename of the song.
 */

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

/**
 * Print Output of functions performed.
 * To visualize progress.
 * @param {Number} total - Number of total files.
 * @param {Number} waiting  - Number of files started to search.
 * @param {Number} finished - Number of files finished search.
 * @param {Number} errors  - Number of files with no genre match.
 */

function printDetails(total,waiting = 0,finished = 0,errors = 0){
    let width = Math.floor( process.stdout.columns * .8 );
    process.stdout.cursorTo(0,3);
    process.stdout.clearLine();
    let fpercent = Math.floor( ( finished / total ) * width );
    let wpercent = Math.ceil( ( waiting / total ) * width  );
    let epercent = Math.floor( ( errors / total ) * width  );
    let progressbar = "\u001B[1;42m ".repeat(fpercent) + 
                    "\u001B[1;41m ".repeat(epercent) + 
                    "\u001B[1;47m ".repeat(wpercent - ( fpercent + epercent ) )  + 
                    "\u001B[0;0m";
    console.log(progressbar);
    let output = `\u001B[1;32mFinished : \u001B[0;0m` +
                ` ${finished} / \u001B[1;32m${total} \u001B[0;0m    ` + 
                `\u001B[1;31mErrors : \u001B[0;0m ${errors}`;
    console.log(output);
    process.stdout.clearLine();
}

/**
 * Used for Single Genre songs.
 * Move Song Files whose genre are identified to respective deirectories. 
 * @param {String} dirname - Genre Name. New Directories to be created.
 * @param {String} outpath - Main output directory.
 * @param {Object} meta - Object containing details of a song.
 */
function moveToDir(dirname,outpath,meta){
    dirname = dirname.replace("/","+");
    let fullpath = path.resolve(outpath,dirname);
    fs.mkdir(fullpath,(err) => {
        if(err && err.code != 'EEXIST'){
            throw err;
        }
        let outfile = path.resolve(fullpath,meta.filename);
        fs.rename(meta.path,outfile,(err) => {
            if(err){
                throw err;
            }
            // console.log(` ${INFO} ${meta.filename} moved successfully.`);
        });
    });
}

/**
 * Used for Multiple Genre songs.
 * Copy files whose genres are identified to respective directories,
 * and delete source file from input directory.
 * @param {Array} dirnames - Genre Names.
 * @param {String} outpath - Main output directory.
 * @param {Object} meta - Object containing details of a song.
 */
function copyToDir(dirnames,outpath,meta){
    let total = dirnames.length;
    let finished = 0;
    dirnames.forEach( (dirname) => {
        dirname = dirname.replace("/","+");
        let fullpath = path.resolve(outpath,dirname);
        fs.mkdir(fullpath,(err) => {
            if(err && err.code != 'EEXIST'){
                throw err;
            }
            let outfile = path.resolve(fullpath,meta.filename);
            fs.copyFile(meta.path,outfile,(err) => {
                if(err){
                    throw err;
                }
                finished++;
                if(finished == total){
                    fs.unlink(meta.path, (err) => {
                        if(err){
                            throw err;
                        }
                    })
                }
                // console.log(` ${INFO} ${meta.filename} moved successfully.`);
            });
        });
    });
}

process.stdout.cursorTo(0,0);
process.stdout.clearScreenDown();
let files = fs.readdirSync(input_directory);
console.log(` ${INFO} Listing Files...`);

scanDir(files,input_directory).then((list)=>{
    console.log(` ${INFO} Creating Browser Instance...`);
    puppeteer.launch().then( (browser) => {
        console.log(` ${INFO} Browser Instance Created.`);
        let total = files.length;
        let waiting = 0;
        let finished = 0;
        let errors = 0;
        printDetails(total,waiting,finished);
        list.forEach( (element) => {
            browser.newPage().then( (page) => {
                waiting++;
                printDetails(total,waiting,finished,errors);
                let string = element.title + " " + element.artist + " genre";
                let qstring = encodeURIComponent(string);

                page.goto('https://www.google.com/search?q='+qstring).then( () => {
                    page.$eval('.kp-header .Z0LcW',el => el.innerHTML).then( 
                        //Resolve
                        (genre) => {
                            page.close();
                            finished++;
                            printDetails(total,waiting,finished,errors);
                            console.log(` ${INFO} ${element.title}  :  ${genre}`);
                            moveToDir(genre,output_directory,element);
                        },
                        //Reject
                        () => {
                            /**
                             * Search for multiple genres
                             */
                            page.$$eval('.hFvVJe .TZNJBf .IAznY .title',
                                nodes => nodes.map(n => n.innerHTML) ).then( (genreArray) => {
                                    if(genreArray.length == 0){
                                        throw new Error('No Genres found');
                                    }
                                    page.close();
                                    finished++;
                                    printDetails(total,waiting,finished,errors);
                                    copyToDir(genreArray,output_directory,element);
                                    console.log(` ${INFO} ${element.title} : ${genreArray}`);
                            }).catch( () => {
                                page.close();
                                errors++;
                                printDetails(total,waiting,finished,errors);
                                console.log(` ${ERR} Failed to find genre.`);
                            });
                        }
                    ).catch( () => {
                        page.close();
                        errors++;
                        printDetails(total,waiting,finished,errors);
                        console.log(` ${ERR} Failed to find genre.`);
                    });
                }).catch( ()=> {
                    errors++;
                    page.close();
                    printDetails(total,waiting,finished,errors);
                    console.log(` ${ERR} Page Navigation Error`);
                });
            }).catch( ()=> {
                console.log(` ${ERR} Browser Error`);
                process.exit(0);
            });
        });

        // browser.close();
    }).catch((err) => {
        console.log("GOD DAMN..!!");
    }); 
});
