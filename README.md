# GENRE SCRAPPER

Using Puppeteer to scrape the web, essentially cards in Google search result only.

#### Basic idea is : 
    
Search results with single genre has the genre text in element with class **Z0LcW**
```html
<div class = "Z0LcW" > Hip-Hop/Rap </div>
```

Search results with multiple genres has each genre text in the following pattern :

```html
<div class="hFvVJe">
    <div class = "TZNJBf" > 
        <div class = "IAznY" >
            <div class = "title" >
                Pop
            </div>
        </div>
    </div>
</div>
```

## Puppeteer
Puppeteer is a headless browser used for test automation and web scraping. 

We use puppeteer to load the google page and extract the genre information from the classes given above. 

    The classes given above might change in the future. 
    But as of now, this works perfectly fine.

## USAGE

To install dependencies run
```bash
yarn
```
Setup ```input_directory``` and ```output_directory``` constants in **classifier.js** file.

Run:
```bash
node classifier.js
```
