'use strict';

var http  = require("q-io/http");
var URL   = require('url');
var _     = require('lodash');
var Q       = require('q');
var csv     = require('ya-csv');

var EightyAppBase = require('./EightyApp.js');
var test_eighty_app = require('./crawler2')(EightyAppBase);

var _DEPTH = 2;
var main_urls = ['http://www.borrowgoldfish.com'];
var final_results = [];

var crawl;
var process_response;

var total_urls_crawled = 0;

var promise = Q.fcall(function(){});
//var reader = csv.createCsvFileReader('./Crawler/websites.csv', {columnsFromHeader:true, 'separator': ','});
//reader.addListener('data', function(data) {
  var url = 'http://www.google.com';  //data.website;
  var obj = {link: url, emails: {},twitter: {}};
  var i = -1;
  final_results.push(obj);
  i++;
  return crawl(url,final_results[i]);
//});
// use the 80app to process the html
process_response = function(html, url, headers, status,level,parent){

  var env = require('jsdom').env;
  try{
      env(html, function(errors, window) {
      var $ = test_eighty_app.$ = require('jquery')(window);

      var result = test_eighty_app.processDocument(html, url, headers, status, $);
      _(result.twitterList).forEach(function(handle){
        parent.twitter[handle] = 1;
      });
      _(result.emailList).forEach(function(email){
        parent.emails[email] = 1;
      });
      console.log(result);
      var links = test_eighty_app.parseLinks(html, url, headers, status, $);

      _(links).forEach(function(url){
        crawl(url,parent,level+1);
      });
    });
  }catch(e){
    console.log(html);
  }
};

crawl = function(new_link,parent,level){
  if (typeof(level) === 'undefined'){
    level = 1;
  }else if (level > _DEPTH){
    return false;
  }
  var crawl_url = URL.parse(new_link);

  // make sure the url has translated into a URL object
  if(crawl_url.host === null){
    console.log('Bad url: ' + new_link);
    return false;
  }

  var options = {
    host: crawl_url.host,
    port: 80,
    path: crawl_url.path,
    method : 'GET'
  };
  var html = '';
  var promise = promise.then(function(){
    return http.request(options)
    .timeout(5000)
    .then(function(res){
      return res.body.read();
    }).then(function(chunk){
      html += charset;
      //process_response(html, crawl_url.href, resp.headers, resp.statusCode,level,parent);
    });
  });
  total_urls_crawled++;
  return true;
};
/*promise.then(function(data){
  console.log('data');
  console.log(data['website']);
  /*_(main_urls).forEach(function(url){
    var obj = {link: url, emails: {},twitter: {}};
    final_results.push(obj);
  //  promise = promise.then(function(){
      return crawl(url,obj);
  //  });
  });
});*/
/*promise.then(function(){
  console.log('total_urls_crawled:'+total_urls_crawled);
  console.log(final_results);
});*/
