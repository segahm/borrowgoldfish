// check command line arguments
if(process.argv[2] == undefined){
  console.log("Usage: node 80appTester.js [url]");
  process.exit();
}

console.log("Starting JavaScript 80app tester!");

var http = require('http');
var url = require('url');
var fs = require("fs");

// Try to load the 80app JS file
console.log("Loading 80app...");
var EightyAppBase = require('./EightyApp.js');
var test_eighty_app = require('./crawler2')(EightyAppBase);

// turn the url argument into a url object
var crawl_url = url.parse(process.argv[2]);

// make sure the url has translated into a URL object
if(crawl_url.host == null){
  console.log("Bad url: " + process.argv[2]);
  process.exit();
}

var options = {
  host: crawl_url.host,
  port: 80,
  path: crawl_url.path
};

var html = "";

// open a get request to the specified url
console.log("Starting request...");
http.get(options, function(resp){
  // append data to the html each time it is received
  resp.on('data', function(chunk){
  	html += chunk;
  });

  // when all data has been received, process the html
  resp.on("end", function(){
    process_response(html, crawl_url.href, resp.headers, resp.statusCode);
  });
}).on("error", function(e){
  console.log("Got error: " + e.message);
});

// use the 80app to process the html
function process_response(html, url, headers, status){
  console.log("Processing html...");
  test_eighty_app.processTest(html, url, headers, status);
  console.log("Done.");
}
